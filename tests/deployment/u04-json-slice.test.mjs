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

/**
 * The real evidence the extended gate must keep for the three modules added by `UNO-WO-037 / R01`.
 *
 * Every marker is a literal from the runner itself: the fixture nodes, the served-markup assertions, the Chromium
 * DOM measurements, the three unique negative Pages and their bound refusal reasons. Removing any one of them makes
 * the predicate false, so a deleted module can never hide behind a green total.
 */
const ADDED_MODULE_EVIDENCE = Object.freeze([
  'module: "content.hero"',
  'module: "content.stats"',
  'module: "content.testimonials"',
  "Increment overview",
  'href="#figures"',
  'aria-labelledby="figures-title"',
  'class="uno-json-stat-label"',
  'class="uno-json-testimonial-quote"',
  'figcaption class="uno-json-testimonial-caption"',
  "dt.uno-json-stat-label",
  "figcaption.uno-json-testimonial-caption",
  "the hero action targets the statistics section",
  "the statistics list holds three terms and three descriptions",
  "only the attributed quotation carries a caption",
  '["content.hero", JSON_DOCUMENTS.heroBodyMissing, "document:invalid-props"]',
  '["content.stats", JSON_DOCUMENTS.statsHeadingSkip, "document:heading-order"]',
  '["content.testimonials", JSON_DOCUMENTS.quoteMarkup, "document:unsafe-text"]',
  'pathname: "/en-001/herobody"',
  'pathname: "/en-001/statslevel"',
  'pathname: "/en-001/quotemarkup"',
  "wo037-herobody.en-001.json",
  "wo037-statslevel.en-001.json",
  "wo037-quotemarkup.en-001.json",
]);

/** True only while every added-module marker is still present in the gate. */
function holdsAddedModuleEvidence(source) {
  return ADDED_MODULE_EVIDENCE.every((marker) => source.includes(marker));
}

/**
 * The real evidence the gate must keep for the three modules added by `UNO-WO-038 / R01`.
 *
 * Each marker is a literal from the runner: the fixture nodes, the served-markup assertions, the Chromium DOM and
 * geometry measurements, the nine bound negative Pages and their refusal reasons. Deleting a module, an assertion or
 * a refusal fixture therefore falsifies this predicate, so a green total can never hide a removed module.
 */
const ADDED_MODULE_EVIDENCE_038 = Object.freeze([
  'module: "layout.bento"',
  'module: "content.pricing"',
  'module: "content.timeline"',
  "Programme tiers",
  "Programme timeline",
  "Contract baseline",
  'class="uno-json-bento"',
  "data-uno-tile-span",
  '<article class="uno-json-tile"',
  "ul.uno-json-price-list",
  "li.uno-json-price",
  'data-uno-featured="true"',
  "ol.uno-json-timeline-list",
  'aria-current="step"',
  "uno-json-timeline-marker",
  "the tiles carry the authored ids and spans in authored order",
  "exactly one price is marked featured",
  "exactly one milestone is the current step",
  "the new modules keep one h1 and one main landmark",
  "resolves the bento to",
  "keeps the milestones in one vertical column in authored order",
  "dark mode keeps the featured price amount above a 4.5:1 contrast ratio",
  '["layout.bento", JSON_DOCUMENTS.bentoCountMismatch, "document:invalid-props"]',
  '["layout.bento", JSON_DOCUMENTS.bentoForeignTile, "document:invalid-props"]',
  '["layout.bento", JSON_DOCUMENTS.bentoSingleChild, "document:invalid-children"]',
  '["content.pricing", JSON_DOCUMENTS.priceDoubleFeatured, "document:invalid-props"]',
  '["content.pricing", JSON_DOCUMENTS.priceEmptyAmount, "document:invalid-props"]',
  '["content.pricing", JSON_DOCUMENTS.priceHeadingSkip, "document:heading-order"]',
  '["content.timeline", JSON_DOCUMENTS.timelineDoubleCurrent, "document:invalid-props"]',
  '["content.timeline", JSON_DOCUMENTS.timelineBadStatus, "document:invalid-props"]',
  '["content.timeline", JSON_DOCUMENTS.timelineMarkup, "document:unsafe-text"]',
  'pathname: "/en-001/bentocount"',
  'pathname: "/en-001/bentotile"',
  'pathname: "/en-001/bentoone"',
  'pathname: "/en-001/pricedouble"',
  'pathname: "/en-001/priceamount"',
  'pathname: "/en-001/pricelevel"',
  'pathname: "/en-001/timelinedouble"',
  'pathname: "/en-001/timelinestatus"',
  'pathname: "/en-001/timelinemarkup"',
  "wo038-bentocount.en-001.json",
  "wo038-bentotile.en-001.json",
  "wo038-bentoone.en-001.json",
  "wo038-pricedouble.en-001.json",
  "wo038-priceamount.en-001.json",
  "wo038-pricelevel.en-001.json",
  "wo038-timelinedouble.en-001.json",
  "wo038-timelinestatus.en-001.json",
  "wo038-timelinemarkup.en-001.json",
]);

/** True only while every `UNO-WO-038 / R01` marker is still present in the gate. */
function holdsAddedModuleEvidence038(source) {
  return ADDED_MODULE_EVIDENCE_038.every((marker) => source.includes(marker));
}

/**
 * `UNO-WO-081 / R01`: the five static-action labels and the executable predicates behind them.
 *
 * Each marker is a literal from the runner — not a badge. Removing a label, deleting the served-anchor assertion,
 * replacing a predicate with `true`, or dropping the restoration residue check must falsify this predicate.
 */
const STATIC_ACTION_EVIDENCE = Object.freeze([
  "U05_STATIC_ACTIONS_SOURCE the fixture document is accepted with one fragment and three literal static links",
  "U05_STATIC_ACTIONS_SOURCE the accepted entries round-trip as literal fragment, mailto and two HTTPS links",
  "U05_STATIC_ACTIONS_SOURCE the accepted action props are deeply frozen",
  "U05_STATIC_ACTIONS_REFUSALS every refused action refuses the whole fixture Page with its closed reason",
  "U05_STATIC_ACTIONS_HTTP the fixture Home serves one fragment and three static action anchors in authored order",
  "U05_STATIC_ACTIONS_HTTP both HTTPS anchors carry noopener and no-referrer and no anchor opens a new tab",
  "U05_STATIC_ACTIONS_HTTP the served Home keeps one main and one h1 and exposes no form, prefetch or remote script",
  "U05_STATIC_ACTIONS_BROWSER the fixture Home exposes one fragment and three static anchors in authored order",
  "U05_STATIC_ACTIONS_BROWSER the HTTPS anchors resolve their noopener and no-referrer policies and no anchor opens a new tab",
  "U05_STATIC_ACTIONS_BROWSER the mailto anchor takes keyboard focus without any delivery state being invented",
  "U05_STATIC_ACTIONS_BROWSER the static-action visit kept one main, one h1 and no script, form or ping surface",
  "U05_STATIC_ACTIONS_BROWSER the static-action visit made no request outside loopback",
  "U05_STATIC_ACTIONS_RESTORE the declarations, committed Pages and temporary sources were restored with no static-link residue",
  // The executed predicates, not their labels: the fixture entries, the refusal matrix and the DOM attribute reads.
  'href: "mailto:contact@example.invalid"',
  'href: "https://maps.example/directions?to=sample"',
  'href: "https://booking.example/availability"',
  '["an `http` destination", { label: "Insecure", href: "http://example.invalid/x" }, "document:unsafe-link"]',
  `anchors[2].attributes.includes('rel="noopener noreferrer"')`,
  'staticActions.referrers[2] === "no-referrer"',
  'staticFocused === "mailto:contact@example.invalid"',
  "external.length === externalBeforeStatic",
  '!readFileSync(resolve(ROOT, `${CONTENT}/home.en-001.json`), "utf8").includes("example.invalid")',
  "Object.isFrozen(actions.props.items)",
]);

/** True only while every static-action label and predicate is still present in the gate. */
function holdsStaticActionEvidence(source) {
  return STATIC_ACTION_EVIDENCE.every((marker) => source.includes(marker));
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
    // `REVIEWED_HELPERS` is the complete set of repository modules this runner may import. Each entry is a helper that has
    // its own hermetic proof; anything else is refused, so the restriction still means something.
    const REVIEWED_HELPERS = Object.freeze([
      "./uno-u03-fixture-transaction.mjs",
      "./uno-published-baseline.mjs",
    ]);
    const imports = [...SOURCE.matchAll(/^import[^;]*?from "([^"]+)";$/gmu)].map((match) => match[1]);
    for (const specifier of imports) {
      assert.ok(
        specifier.startsWith("node:") || REVIEWED_HELPERS.includes(specifier),
        `unexpected import: ${specifier}`,
      );
    }
    // The helper itself must stay dependency-free apart from Node built-ins.
    const BASELINE = readFileSync(resolve(ROOT, "scripts/uno-published-baseline.mjs"), "utf8");
    const helperImports = [...BASELINE.matchAll(/^import[^;]*?from "([^"]+)";$/gmu)].map((match) => match[1]);
    for (const specifier of helperImports) {
      assert.ok(specifier.startsWith("node:"), `unexpected baseline import: ${specifier}`);
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

  it("pins the real HTTP and Chromium evidence for the three added modules", () => {
    // Baseline: the real runner carries every marker.
    assert.equal(holdsAddedModuleEvidence(SOURCE), true);

    // Removing a module from the fixture must fail, one module at a time.
    for (const marker of ['module: "content.hero"', 'module: "content.stats"', 'module: "content.testimonials"']) {
      // Every occurrence must go, otherwise a leftover node would keep the guard green and prove nothing.
      const removed = SOURCE.replaceAll(marker, 'module: "content.prose"');
      assert.notEqual(removed, SOURCE, `the gate must actually contain ${marker}`);
      assert.equal(holdsAddedModuleEvidence(removed), false, `removing ${marker} must fail this gate`);
    }

    // Deleting a served-markup assertion, a DOM measurement or a bound negative fixture must fail too.
    for (const marker of [
      'aria-labelledby="figures-title"',
      "figcaption.uno-json-testimonial-caption",
      "only the attributed quotation carries a caption",
      '["content.stats", JSON_DOCUMENTS.statsHeadingSkip, "document:heading-order"]',
      'pathname: "/en-001/quotemarkup"',
    ]) {
      const removed = SOURCE.replace(marker, "REMOVED");
      assert.notEqual(removed, SOURCE, `the gate must actually contain ${marker}`);
      assert.equal(holdsAddedModuleEvidence(removed), false, `removing ${marker} must fail this gate`);
    }
  });

  it("binds each added module to its own negative Page, its own reason and the shared restoration", () => {
    // Each negative is unique per module: a shared placeholder would be a weaker proof, so it is refused here.
    const negatives = [
      { module: "content.hero", body: "heroBodyMissing", reason: "document:invalid-props", page: "herobody" },
      { module: "content.stats", body: "statsHeadingSkip", reason: "document:heading-order", page: "statslevel" },
      { module: "content.testimonials", body: "quoteMarkup", reason: "document:unsafe-text", page: "quotemarkup" },
    ];
    const reasons = new Set();
    for (const negative of negatives) {
      assert.ok(
        SOURCE.includes(
          `["${negative.module}", JSON_DOCUMENTS.${negative.body}, "${negative.reason}"]`,
        ),
        `${negative.module} must bind its own negative document and reason`,
      );
      assert.ok(SOURCE.includes(`pathname: "/en-001/${negative.page}"`), `missing refused Page ${negative.page}`);
      assert.ok(SOURCE.includes(`wo037-${negative.page}.en-001.json`), `missing fixture source ${negative.page}`);
      reasons.add(negative.reason);
    }
    assert.equal(reasons.size, 3, "the three negatives must use three distinct reasons");
    // The added sources are claimed and restored by the accepted transaction, exactly like the original eighteen.
    assert.match(SOURCE, /fixtureSources: sources\.map/u);
    assert.match(SOURCE, /await transaction\.restore\(\)/u);
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


describe("the U04 JSON-slice gate — the three modules added by UNO-WO-038 / R01", () => {
  it("pins the real HTTP and Chromium evidence for bento, pricing and timeline", () => {
    // Baseline: the real runner carries every marker.
    assert.equal(holdsAddedModuleEvidence038(SOURCE), true);

    // Removing a module from the fixture must fail, one module at a time, with every occurrence replaced.
    for (const marker of ['module: "layout.bento"', 'module: "content.pricing"', 'module: "content.timeline"']) {
      const removed = SOURCE.replaceAll(marker, 'module: "content.prose"');
      assert.notEqual(removed, SOURCE, `the gate must actually contain ${marker}`);
      assert.equal(holdsAddedModuleEvidence038(removed), false, `removing ${marker} must fail this gate`);
    }

    // Deleting a served-markup assertion, a DOM measurement, a geometry check, a contrast proof, a bound negative
    // fixture or a refusal binding must each fail on its own.
    for (const marker of [
      'class="uno-json-bento"',
      '<article class="uno-json-tile"',
      "ul.uno-json-price-list",
      "li.uno-json-price",
      "ol.uno-json-timeline-list",
      'aria-current="step"',
      "the tiles carry the authored ids and spans in authored order",
      "exactly one price is marked featured",
      "exactly one milestone is the current step",
      "resolves the bento to",
      "keeps the milestones in one vertical column in authored order",
      "dark mode keeps the featured price amount above a 4.5:1 contrast ratio",
      '["layout.bento", JSON_DOCUMENTS.bentoCountMismatch, "document:invalid-props"]',
      '["content.pricing", JSON_DOCUMENTS.priceHeadingSkip, "document:heading-order"]',
      '["content.timeline", JSON_DOCUMENTS.timelineMarkup, "document:unsafe-text"]',
      'pathname: "/en-001/bentoone"',
      'pathname: "/en-001/priceamount"',
      'pathname: "/en-001/timelinestatus"',
      "wo038-bentotile.en-001.json",
      "wo038-pricedouble.en-001.json",
      "wo038-timelinestatus.en-001.json",
    ]) {
      const removed = SOURCE.replaceAll(marker, "REMOVED");
      assert.notEqual(removed, SOURCE, `the gate must actually contain ${marker}`);
      assert.equal(holdsAddedModuleEvidence038(removed), false, `removing ${marker} must fail this gate`);
    }
  });

  it("binds each new module to its own three negative Pages, its own reasons and the shared restoration", () => {
    const negatives = [
      {
        module: "layout.bento",
        bodies: [
          ["bentoCountMismatch", "invalid-props", "bentocount"],
          ["bentoForeignTile", "invalid-props", "bentotile"],
          ["bentoSingleChild", "invalid-children", "bentoone"],
        ],
      },
      {
        module: "content.pricing",
        bodies: [
          ["priceDoubleFeatured", "invalid-props", "pricedouble"],
          ["priceEmptyAmount", "invalid-props", "priceamount"],
          ["priceHeadingSkip", "heading-order", "pricelevel"],
        ],
      },
      {
        module: "content.timeline",
        bodies: [
          ["timelineDoubleCurrent", "invalid-props", "timelinedouble"],
          ["timelineBadStatus", "invalid-props", "timelinestatus"],
          ["timelineMarkup", "unsafe-text", "timelinemarkup"],
        ],
      },
    ];

    // Nine distinct task-owned invalid Pages, three per module, each with its own route and fixture source.
    const pages = new Set();
    for (const negative of negatives) {
      assert.equal(negative.bodies.length, 3, `${negative.module} must carry exactly three negatives`);
      for (const [body, reason, page] of negative.bodies) {
        assert.ok(
          SOURCE.includes(`["${negative.module}", JSON_DOCUMENTS.${body}, "document:${reason}"]`),
          `${negative.module} must bind ${body} to document:${reason}`,
        );
        assert.ok(SOURCE.includes(`pathname: "/en-001/${page}"`), `missing refused Page ${page}`);
        assert.ok(SOURCE.includes(`wo038-${page}.en-001.json`), `missing fixture source ${page}`);
        pages.add(page);
      }
    }
    assert.equal(pages.size, 9, "the nine negatives must be nine distinct Pages");

    // The declared refusal reasons must be genuine members of the closed vocabulary, not free text.
    for (const reason of ["invalid-props", "invalid-children", "heading-order", "unsafe-text"]) {
      assert.ok(SOURCE.includes(`reason: "${reason}"`), `missing refusal case: ${reason}`);
    }

    // The added sources are claimed and restored by the accepted transaction, exactly like the original ones.
    assert.match(SOURCE, /fixtureSources: sources\.map/u);
    assert.match(SOURCE, /await transaction\.restore\(\)/u);
  });

  it("keeps the earlier 308 assertions intact beside the new ones", () => {
    // The predecessor's own evidence predicate must still hold, so this increment cannot have displaced it.
    assert.equal(holdsAddedModuleEvidence(SOURCE), true);
    assert.ok(SOURCE.includes("[1280, 768, 390, 320]"), "the four responsive widths must survive");
    assert.ok(SOURCE.includes("noindex,nofollow"), "the unlisted Page contract must survive");
    assert.ok(SOURCE.includes("chromium.launch()"), "the real browser proof must survive");
    // The original three negatives and their pages are untouched.
    for (const page of ["herobody", "statslevel", "quotemarkup"]) {
      assert.ok(SOURCE.includes(`pathname: "/en-001/${page}"`), `missing predecessor refused Page ${page}`);
    }
  });
});

describe("the U04 JSON-slice gate — transport-free static actions (`UNO-WO-081 / R01`)", () => {
  it("keeps every static-action label and its executable predicate", () => {
    assert.equal(holdsStaticActionEvidence(SOURCE), true);
    // The five labels are distinct concerns: source/refusal, HTTP, Chromium and restoration.
    for (const prefix of [
      "U05_STATIC_ACTIONS_SOURCE",
      "U05_STATIC_ACTIONS_REFUSALS",
      "U05_STATIC_ACTIONS_HTTP",
      "U05_STATIC_ACTIONS_BROWSER",
      "U05_STATIC_ACTIONS_RESTORE",
    ]) {
      assert.ok(SOURCE.includes(prefix), `missing label family ${prefix}`);
    }
    // The fixture keeps its original fragment entry and adds the three reserved example destinations after it.
    const homeFixture = SOURCE.slice(SOURCE.indexOf("homeEn: {"), SOURCE.indexOf("homeDe: {"));
    const fragmentAt = homeFixture.indexOf('label: "Back to the heading", targetId: "intro"');
    assert.ok(fragmentAt > 0, "the original fragment action must survive");
    assert.ok(homeFixture.indexOf("mailto:contact@example.invalid") > fragmentAt);
    assert.ok(homeFixture.indexOf("https://maps.example/directions?to=sample") > fragmentAt);
    assert.ok(homeFixture.indexOf("https://booking.example/availability") > fragmentAt);
    // No real external host and no provider claim enters the fixture.
    for (const forbidden of ["@gmail.com", "google.com", "localhost:", "example.com"]) {
      assert.equal(homeFixture.includes(forbidden), false, `forbidden fixture destination: ${forbidden}`);
    }
  });

  it("genuinely fails when a static-action label or predicate is deleted or neutered", () => {
    for (const marker of [
      STATIC_ACTION_EVIDENCE[0],
      STATIC_ACTION_EVIDENCE[1],
      STATIC_ACTION_EVIDENCE[3],
      STATIC_ACTION_EVIDENCE[4],
      STATIC_ACTION_EVIDENCE[7],
      STATIC_ACTION_EVIDENCE[12],
    ]) {
      const deleted = SOURCE.split(marker).join("removed");
      assert.notEqual(deleted, SOURCE, marker);
      assert.equal(holdsStaticActionEvidence(deleted), false, `deletion not detected: ${marker.slice(0, 48)}`);
    }
    // Replacing a real predicate with a constant true must also fail the guard.
    for (const [token, replacement] of [
      ["external.length === externalBeforeStatic", "true"],
      ['staticFocused === "mailto:contact@example.invalid"', "true"],
      ["Object.isFrozen(actions.props.items)", "true"],
      [`anchors[2].attributes.includes('rel="noopener noreferrer"')`, "true"],
    ]) {
      const mutated = SOURCE.split(token).join(replacement);
      assert.notEqual(mutated, SOURCE, token);
      assert.equal(holdsStaticActionEvidence(mutated), false, `neutralized predicate not detected: ${token}`);
    }
  });
});
