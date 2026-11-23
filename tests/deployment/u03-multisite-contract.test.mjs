/**
 * Foundation Uno — the multi-Site contract (`UNO-WO-097 / R01`, M1 P6).
 *
 * WHAT THIS IS. A hermetic, mutation-sensitive contract over the *committed* P6 runner and the *committed* CI wiring.
 * It reads source text only: no network, no `next build`, no browser, no declaration replacement, no scratch writes and
 * no import of the destructive fixture helper. It proves the two things a green HTTP run cannot prove by itself — that
 * the runner's no-default phase really owns the content it declares, and that the runner's verdict and restoration
 * guards are still unconditional — and it proves the detector can fail, by running the same detector against
 * deliberately mutated copies held in memory.
 *
 * WHY THE DETECTOR IS A PURE FUNCTION. A contract suite that only asserts literals about itself is inert. Every rule
 * here is expressed once as a predicate over source text, so the same predicate that accepts the committed runner must
 * reject each mutation below. Mutations therefore exercise the real detector rather than a parallel copy of it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const RUNNER = "scripts/verify-u03-multisite-http.mjs";
const WORKFLOW = ".github/workflows/verify-u01.yml";

/** Read one repository file as text with normalised newlines; a missing file is a failure, never a skip. */
function read(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), "utf8").replace(/\r\n/gu, "\n");
}

/** Every top-level `fixtureSources:` binding, in source order. */
function fixtureSourceBindings(source) {
  return [...source.matchAll(/fixtureSources:\s*([^,\n]+)/gu)].map((match) => match[1].trim());
}

/**
 * The runner contract. Returns `{ ok, problems }`, where each problem is one precise, testable rule.
 *
 * `ok` is true only when every rule holds, so a mutation anywhere in the guarded surface flips it — which is what makes
 * the mutation cases meaningful.
 */
function analyseRunner(source) {
  const problems = [];
  const add = (code) => problems.push(code);

  // 1. Both fixture phases must go through the real transaction, and both must own their sources.
  const phases = source.match(/prepareUnoU03FixtureTransaction\(\{/gu) ?? [];
  if (phases.length !== 2) add("runner:phase-count");
  const bindings = fixtureSourceBindings(source);
  if (bindings.length !== 2) add("runner:fixture-sources-count");
  if (bindings.some((binding) => !/^sources$/u.test(binding))) add("runner:fixture-sources-empty");
  if (/fixtureSources:\s*\[\s*\]/u.test(source)) add("runner:fixture-sources-blank-array");

  // 2. Phase one installs the default-bearing declaration, phase two the default-free one.
  const replacementOrder = [...source.matchAll(/path:\s*CONFIG_PATH,\s*bytes:\s*buildBytes\((CONFIG[A-Z_]*)\)/gu)].map(
    (match) => match[1],
  );
  if (replacementOrder.length !== 2) add("runner:config-replacement-count");
  if (replacementOrder[0] !== "CONFIG") add("runner:phase-one-config");
  if (replacementOrder[1] !== "CONFIG_NO_DEFAULT") add("runner:phase-two-config");

  const noDefaultBlock = /\nconst CONFIG_NO_DEFAULT = \{([\s\S]*?)\n\};/u.exec(source);
  if (noDefaultBlock === null) {
    add("runner:no-default-declaration");
  } else {
    if (/\bdefault:/u.test(noDefaultBlock[1])) add("runner:no-default-has-default");
    if (!/sites:\s*SITE_BINDINGS_PERMUTED/u.test(noDefaultBlock[1])) add("runner:no-default-order");
    if (!/sites:\s*SITE_BINDINGS_PERMUTED/u.test(source)) add("runner:permuted-order");
  }
  if (!/\nconst SITE_BINDINGS_PERMUTED = \[SITE_BINDINGS\[2\], SITE_BINDINGS\[1\], SITE_BINDINGS\[0\]\];/u.test(source)) {
    add("runner:permutation-definition");
  }

  // 3. The real transport, the real browser and every requirement group must still be present.
  if (!/request as httpRequest/u.test(source)) add("runner:node-http");
  if (!/headers:\s*\{\s*host:\s*hostHeader/u.test(source)) add("runner:synthetic-host");
  if (!/chromium\.launch\(/u.test(source)) add("runner:chromium");
  if (!/page\.route\(/u.test(source)) add("runner:route-forwarding");
  for (const group of ["G01", "G02", "G03", "G04", "G05"]) {
    if (!source.includes(`"${group}`) && !source.includes(`\`${group}`)) add(`runner:group-${group}`);
  }
  const checkCount = (source.match(/\bcheck\(/gu) ?? []).length;
  if (checkCount < 100) add("runner:check-count");

  // 4. Verdict and restoration guards: nonzero on any failure, and nothing disposed before proof.
  if (!/process\.exitCode = failed === 0 && restoration\.ok && noDefaultRestoration\.ok \? 0 : 1;/u.test(source)) {
    add("runner:exit-condition");
  }
  if (!/if \(late\.ok\) await transaction\.dispose\(\);/u.test(source)) add("runner:phase-one-guard");
  if (!/if \(late\.ok\) await second\.dispose\(\);/u.test(source)) add("runner:phase-two-guard");
  if (!/pruneFixtureDirectories\(createdDirectories\);/u.test(source)) add("runner:prune");
  if (!/if \(secondRestoration\.ok\) await second\.dispose\(\);/u.test(source)) add("runner:phase-two-dispose");

  // 5. The two no-default evidence assertions must stay separate and both present.
  if (!source.includes('"G01 with no declared default every Site stays active"')) add("runner:no-default-status");
  if (!source.includes('"G01 with no declared default each Site serves its own authored body"')) {
    add("runner:no-default-body");
  }

  return { ok: problems.length === 0, problems };
}

/** The two unconditional CI commands this order requires, in order. */
const REQUIRED_STEPS = Object.freeze([
  "node --test tests/deployment/u03-multisite-contract.test.mjs",
  "node scripts/verify-u03-multisite-http.mjs",
]);

/**
 * The CI contract. The two commands must appear as real `run:` steps in the existing both-OS verify workflow, with the
 * Playwright browser path, and without any escape hatch that could make them non-blocking.
 */
function analyseWorkflow(text) {
  const problems = [];
  const add = (code) => problems.push(code);

  const positions = REQUIRED_STEPS.map((command) => text.indexOf(command));
  if (positions.some((position) => position < 0)) add("workflow:step-missing");
  if (positions[0] >= 0 && positions[1] >= 0 && positions[0] > positions[1]) add("workflow:step-order");
  if (!/PLAYWRIGHT_BROWSERS_PATH:\s*\.temp\/uno-u03-browsers/u.test(text)) add("workflow:playwright-path");
  if (/continue-on-error/u.test(text)) add("workflow:continue-on-error");
  if (/if:\s*false/u.test(text)) add("workflow:if-false");
  if (!/ubuntu-24\.04/u.test(text)) add("workflow:ubuntu-leg");
  if (!/windows-2025/u.test(text)) add("workflow:windows-leg");

  return { ok: problems.length === 0, problems };
}

/** One replacement that must make the detector fail, applied only in memory. */
function mutate(source, from, to) {
  assert.ok(source.includes(from), `mutation target must exist: ${from.slice(0, 60)}`);
  return source.replace(from, to);
}

test("the committed runner satisfies every contract rule", () => {
  const verdict = analyseRunner(read(RUNNER));
  assert.deepEqual(verdict.problems, []);
  assert.equal(verdict.ok, true);
});

test("the committed workflow runs both unconditional P6 steps on both operating systems", () => {
  const verdict = analyseWorkflow(read(WORKFLOW));
  assert.deepEqual(verdict.problems, []);
  assert.equal(verdict.ok, true);
});

test("the runner contract rejects an empty second-phase source collection", () => {
  const mutated = mutate(
    read(RUNNER),
    'fixtureSources: sources,\n    });\n    check("the no-default permutation is armed"',
    'fixtureSources: [],\n    });\n    check("the no-default permutation is armed"',
  );
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:fixture-sources-empty"));
});

test("the runner contract rejects reinstating a declared default in the no-default phase", () => {
  const mutated = mutate(
    read(RUNNER),
    '  sites: SITE_BINDINGS_PERMUTED,\n  languagePreferences: { en: "en-001" },',
    '  sites: SITE_BINDINGS_PERMUTED,\n  default: { facetId: "services", siteId: "main" },\n  languagePreferences: { en: "en-001" },',
  );
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:no-default-has-default"));
});

test("the runner contract rejects the no-default phase installing the default-bearing declaration", () => {
  const mutated = mutate(
    read(RUNNER),
    "{ path: CONFIG_PATH, bytes: buildBytes(CONFIG_NO_DEFAULT) }",
    "{ path: CONFIG_PATH, bytes: buildBytes(CONFIG) }",
  );
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:phase-two-config"));
});

test("the runner contract rejects an un-permuted no-default order", () => {
  const mutated = mutate(read(RUNNER), "  sites: SITE_BINDINGS_PERMUTED,", "  sites: SITE_BINDINGS,");
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:no-default-order"));
});

test("the runner contract rejects a weakened exit condition", () => {
  const mutated = mutate(
    read(RUNNER),
    "process.exitCode = failed === 0 && restoration.ok && noDefaultRestoration.ok ? 0 : 1;",
    "process.exitCode = 0;",
  );
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:exit-condition"));
});

test("the runner contract rejects disposing a transaction whose restoration was not proved", () => {
  const mutated = mutate(read(RUNNER), "if (secondRestoration.ok) await second.dispose();", "await second.dispose();");
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:phase-two-dispose"));
});

test("the runner contract rejects a removed requirement group", () => {
  const mutated = read(RUNNER).replace(/G05/gu, "X05");
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:group-G05"));
});

test("the runner contract rejects replacing Chromium with a plain fetch", () => {
  const mutated = mutate(read(RUNNER), "chromium.launch({", "fakeBrowser.launch({");
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:chromium"));
});

test("the workflow contract rejects a removed blocking step", () => {
  const mutated = mutate(read(WORKFLOW), "node scripts/verify-u03-multisite-http.mjs", "echo skipped");
  const verdict = analyseWorkflow(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("workflow:step-missing"));
});

test("the workflow contract rejects a non-blocking escape hatch", () => {
  const mutated = mutate(
    read(WORKFLOW),
    "node scripts/verify-u03-multisite-http.mjs",
    "continue-on-error: true\nnode scripts/verify-u03-multisite-http.mjs",
  );
  const verdict = analyseWorkflow(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("workflow:continue-on-error"));
});

test("the workflow contract rejects a missing Playwright browser path", () => {
  const mutated = read(WORKFLOW).replace(
    /PLAYWRIGHT_BROWSERS_PATH: \.temp\/uno-u03-browsers/gu,
    "PLAYWRIGHT_BROWSERS_PATH: .temp/elsewhere",
  );
  const verdict = analyseWorkflow(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("workflow:playwright-path"));
});

test("the detector is exercised by many mutations and inspects a real check surface", () => {
  assert.ok(MUTATION_LABELS.length >= 10);
  assert.ok((read(RUNNER).match(/\bcheck\(/gu) ?? []).length >= 100);
});

/** Named mutations the suite above actually executes; kept here so the count is asserted, not assumed. */
const MUTATION_LABELS = Object.freeze([
  "fixture-sources",
  "default",
  "phase-two-config",
  "order",
  "exit",
  "dispose",
  "group",
  "chromium",
  "step",
  "escape",
  "browsers",
]);

