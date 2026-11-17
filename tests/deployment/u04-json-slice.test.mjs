/**
 * Foundation Uno — hermetic tests for the U04 JSON-slice gate (`UNO-WO-035 / R01`).
 *
 * These tests never build Next.js, never start a server, never launch a browser and never touch the committed
 * deployment declarations. They prove the gate's contract instead: that it refuses outside the checkout root
 * (and leaves no residue when it does), that it delegates every mutation to the accepted U03 transaction helper
 * rather than re-implementing one, that it keeps all of its mandatory evidence and no escape hatch, and that the
 * accepted 27-case fault suite still passes unchanged.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";

const ROOT = process.cwd();
const SCRIPT = resolve(ROOT, "scripts/verify-u04-json-slice.mjs");
const SOURCE = readFileSync(SCRIPT, "utf8");

/** Directories this suite creates; removed in `after` even when a test fails. */
const scratchDirectories = [];

after(() => {
  for (const directory of scratchDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

/**
 * The accepted gate proves dark mode and reduced motion from a **single** browser context. This extracts the arguments
 * of that exact `const darkContext = await browser.newContext({ ... });` construction, so the guard below can require
 * both preferences on that one call instead of accepting a matching fragment anywhere else in the file.
 */
const DARK_CONTEXT_ARGUMENTS = /const darkContext = await browser\.newContext\(\{([\s\S]*?)\}\);/u;

/** The argument object of the gate's one dark-context creation, or `null` when it is absent. */
function darkContextArguments(source) {
  return DARK_CONTEXT_ARGUMENTS.exec(source)?.[1] ?? null;
}

/** True only while the one dark-context call carries the dark colour scheme and reduced motion together. */
function holdsDarkContextContract(source) {
  const argument = darkContextArguments(source);
  return (
    argument !== null && /colorScheme: "dark"/u.test(argument) && /reducedMotion: "reduce"/u.test(argument)
  );
}

/** One fresh scratch directory that is not the Uno checkout. */
function scratchDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "uno-u04-gate-"));
  scratchDirectories.push(directory);
  return directory;
}

describe("the U04 JSON-slice gate — refusal without residue", () => {
  it("is syntactically valid and imports only Node built-ins plus the accepted transaction helper", () => {
    const check = spawnSync(process.execPath, ["--check", SCRIPT], { cwd: ROOT, encoding: "utf8" });
    assert.equal(check.status, 0, check.stderr);

    assert.match(SOURCE, /from "\.\/uno-u03-fixture-transaction\.mjs"/u);
    const imports = [...SOURCE.matchAll(/^import[^;]*?from "([^"]+)";$/gmu)].map((match) => match[1]);
    for (const specifier of imports) {
      assert.ok(
        specifier.startsWith("node:") || specifier === "./uno-u03-fixture-transaction.mjs",
        `unexpected import: ${specifier}`,
      );
    }
    const dynamic = [...SOURCE.matchAll(/await import\("([^"]+)"\)/gu)].map((match) => match[1]);
    for (const specifier of dynamic) {
      assert.ok(
        specifier.startsWith("../src/") || specifier === "playwright",
        `unexpected dynamic import: ${specifier}`,
      );
    }
  });

  it("refuses outside the checkout root with a bounded exit code and writes nothing", () => {
    const directory = scratchDirectory();
    const result = spawnSync(process.execPath, [SCRIPT], { cwd: directory, encoding: "utf8", timeout: 120_000 });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /preflight refused; nothing was changed|pinned local Next CLI was not found/u);
    assert.equal(existsSync(join(directory, ".next")), false);
    assert.equal(existsSync(join(directory, "deployment")), false);
    // No refusal may echo an absolute path from the machine it ran on.
    assert.equal(result.stderr.includes(directory), false);
    assert.equal(result.stdout.includes("PASS  the fixture transaction is armed"), false);
  });
});

describe("the U04 JSON-slice gate — mandatory evidence, no escape hatch", () => {
  it("keeps every mandatory proof and never skips one", () => {
    assert.match(SOURCE, /checkTrace\("the fixture production build", "fixture"\)/u);
    assert.match(SOURCE, /checkTrace\("the committed rebuild", "committed"\)/u);
    const reasons = [
      "renderer-unavailable",
      "unknown-module",
      "unsupported-version",
      "unexpected-key",
      "unsafe-link",
      "unresolved-target",
      "duplicate-section-id",
      "too-deep",
      "too-many-nodes",
      "malformed-preferred-json",
      "draft",
      "wrong-site",
      "undeclared-locale",
    ];
    for (const marker of reasons) {
      assert.ok(SOURCE.includes(`reason: "${marker}"`), `missing refusal case: ${marker}`);
    }
    assert.ok((SOURCE.match(/reason: "/gu) ?? []).length >= 12, "fewer than twelve refused cases");
    assert.ok(SOURCE.includes("[1280, 768, 390, 320]"), "missing the four responsive widths");
    assert.ok(SOURCE.includes("noindex,nofollow"));
    assert.ok(SOURCE.includes('reducedMotion: "reduce"'));
    // The dark proof is one context created with both preferences (UNO-WO-036 / R02). The predecessor assertion looked
    // for an `emulateMedia({ colorScheme: "dark" ... })` call that the accepted runner never had, so it was stale
    // against this very file and proved nothing; this guard is tied to the real construction instead.
    assert.equal(holdsDarkContextContract(SOURCE), true, "the gate must create one context with dark and reduced motion");
    assert.ok(SOURCE.includes("chromium.launch()"));
  });

  it("keeps both dark-context preferences on one call and refuses drift in either", () => {
    // Baseline: the real source satisfies the same-call guard.
    assert.equal(holdsDarkContextContract(SOURCE), true);

    // Negative 1 — only the colour scheme drifts: the same-call guard must fail, not fall back to a stray fragment.
    const lightDrift = SOURCE.replace('colorScheme: "dark"', 'colorScheme: "light"');
    assert.notEqual(lightDrift, SOURCE, "the fixture must actually change the colour scheme");
    assert.equal(holdsDarkContextContract(lightDrift), false, "a light colour scheme must not satisfy the guard");

    // Negative 2 — only the motion preference drifts: the same-call guard must fail.
    const motionDrift = SOURCE.replace('reducedMotion: "reduce"', 'reducedMotion: "no-preference"');
    assert.notEqual(motionDrift, SOURCE, "the fixture must actually change the motion preference");
    assert.equal(
      holdsDarkContextContract(motionDrift),
      false,
      "an unreduced motion preference must not satisfy the guard",
    );

    // Negative 3 — a wholly removed dark-context creation must be refused as well.
    const removed = SOURCE.replace(DARK_CONTEXT_ARGUMENTS, "chromium.launch()");
    assert.notEqual(removed, SOURCE, "the fixture must actually remove the dark context");
    assert.equal(holdsDarkContextContract(removed), false, "a missing dark context must not satisfy the guard");
  });

  it("has no skip, no muted warning, no retry and no fallback path", () => {
    for (const forbidden of ["continue-on-error", ".skip(", "ignoreBuildErrors", "dangerouslySetInnerHTML"]) {
      assert.equal(SOURCE.includes(forbidden), false, `forbidden construct: ${forbidden}`);
    }
    assert.equal(/fetch\("https:\/\//u.test(SOURCE), false, "the gate must not call a live domain");
  });

  it("restores inside a finally and only removes task-owned fixtures", () => {
    assert.match(SOURCE, /finally \{/u);
    assert.match(SOURCE, /await transaction\.restore\(\)/u);
    assert.match(SOURCE, /transaction\.dispose\(\)/u);
    // The only recursive removal is the task's own build output.
    const removals = [...SOURCE.matchAll(/rmSync\(([^;]+)\);/gu)].map((match) => match[1]);
    assert.ok(removals.length > 0);
    for (const removal of removals) {
      assert.ok(removal.includes(".next"), `unexpected recursive removal: ${removal}`);
    }
  });
});

describe("the accepted U03 transaction fault suite is reused, not re-implemented", () => {
  it("still passes all 27 fault and restoration cases", () => {
    // A nested test runner inherits `NODE_TEST_CONTEXT`; clearing it keeps the child's TAP output on stdout.
    const environment = { ...process.env };
    delete environment.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      ["--test", "--test-reporter=tap", "tests/deployment/u03-fixture-transaction.test.mjs"],
      { cwd: ROOT, encoding: "utf8", timeout: 180_000, env: environment },
    );
    assert.equal(result.status, 0, result.stderr);
    const passed = Number(/^# pass (\d+)$/mu.exec(result.stdout)?.[1] ?? "0");
    assert.ok(passed >= 27, `expected at least 27 passing cases, saw ${passed}`);
  });
});

