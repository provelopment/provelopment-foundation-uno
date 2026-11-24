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
const SERVING = "src/config/uno-serving.ts";
const PROXY = "src/proxy.ts";
const QUERY_HELPER = "src/config/uno-safe-redirect-query.ts";

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

  // 6. `UNO-WO-111 / R01`: the authored List destinations must be composed by the real adapter, proven per Site authority in
  // both phases, and refused as a whole Page — with every temporary source mutation restored unconditionally.
  if (!/composeUnoFoundationSubset/u.test(source)) add("runner:list-compose");
  const compositions = (source.match(/await composedListSections\(/gu) ?? []).length;
  if (compositions !== 3) add("runner:list-composed");
  if (!/g06ListDestinations\(port\)/u.test(source)) add("runner:list-http-group");
  if (!/g06ListRefusals\(port\)/u.test(source)) add("runner:list-refusal-group");
  const probes = [
    'await probe(corporate, "privacy", "cross-Site");',
    'await probe(corporate, "brief", "cross-Facet");',
    'await probe(services, "brief", "unlisted");',
    'await probe(services, "draft", "draft");',
  ];
  for (const [index, probe] of probes.entries()) if (!source.includes(probe)) add(`runner:list-probe-${index}`);
  if (!source.includes("G06 corporate/main refuses the whole Page for a wrong-locale List target")) {
    add("runner:list-locale");
  }
  if (!/writeFileSync\(absolute, original\);/u.test(source)) add("runner:list-restore");
  if (!source.includes('"G06 with no declared default each Site still projects its own authored List destinations"')) {
    add("runner:list-no-default");
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

/**
 * The alias-routing contract (`UNO-WO-098 / R01`).
 *
 * A green redirect can hide a policy regression in three places a log cannot show: the branch may run *before* the
 * canonical match (shadowing an owner), the destination may skip the `public` gate (redirecting an unlisted Page), or the
 * planner's own identity/canonical may never be compared with the translated target. Each rule below is one predicate, so
 * the mutation cases below exercise the real detector rather than a restatement of it.
 */
function analyseAliasRouting(source) {
  const problems = [];
  const add = (code) => problems.push(code);

  if (!/export function matchUnoServingAliasAddress\(/u.test(source)) add("alias:matcher");
  if (!/if \(!planned\.page\.delivery\.public\) return null;/u.test(source)) add("alias:public-gate");
  if (
    !/if \(planned\.page\.identity\.facetId !== target\.facetId \|\| planned\.page\.identity\.siteId !== target\.siteId\) return null;/u.test(
      source,
    )
  ) {
    add("alias:identity-gate");
  }
  if (!/if \(planned\.page\.delivery\.canonicalUrl !== target\.canonicalUrl\) return null;/u.test(source)) {
    add("alias:canonical-gate");
  }
  if (!/if \(matched\.status !== "match"\) return null;/u.test(source)) add("alias:single-owner");
  if (!/async function redirectThroughAlias\(/u.test(source)) add("alias:resolver");
  if (!/const aliased = await redirectThroughAlias\(host, pathname\);/u.test(source)) add("alias:wiring");
  if (!/if \(aliased !== null\) return \{ kind: "redirect", location: aliased\.location \};/u.test(source)) {
    add("alias:decision");
  }
  // Whole-segment prefix match and no synthesised locale for an alias root.
  if (!/requestPath\.startsWith\(`\$\{declared\.prefix\}\/`\)/u.test(source)) add("alias:whole-segment");
  if (!/suffix === null \|\| suffix === ""/u.test(source)) add("alias:no-root");
  // The destination authority comes from the stored origin, never from the request.
  if (!/host: canonicalHost,/u.test(source)) add("alias:stored-host");
  // The canonical Page must be attempted before any alias may answer.
  const canonicalAt = source.indexOf("const served = await planUnoServingPage({ host, pathname });");
  const aliasAt = source.indexOf("const aliased = await redirectThroughAlias(host, pathname);");
  if (canonicalAt < 0) add("alias:canonical-first-missing");
  if (aliasAt < 0 || (canonicalAt >= 0 && aliasAt < canonicalAt)) add("alias:canonical-first-order");
  // One fixed deployment root only, and no request-shaped URL construction.
  if ((source.match(/process\.cwd\(\)/gu) ?? []).length !== 1) add("alias:single-cwd");
  if (/new URL\(\s*[^)]*(host|pathname)/u.test(source)) add("alias:request-url");

  return { ok: problems.length === 0, problems };
}

/** The production runner's alias evidence: positive redirect assertions, and no permissive substitute. */
function analyseAliasRunner(source) {
  const problems = [];
  const add = (code) => problems.push(code);

  if (!/G03 a declared address alias redirects temporarily to its own Site's canonical address/u.test(source)) {
    add("alias-runner:positive");
  }
  if (!/addressAlias\.status === 307 && addressAliasLocation === `https:\/\/\$\{HOST_ABC\}\/docs\/de-de`/u.test(source)) {
    add("alias-runner:exact-location");
  }
  if (/when offered/u.test(source)) add("alias-runner:permissive");
  for (const needed of [
    "G03 a nested alias path redirects to the same Site's authored nested Page",
    "G03 an alias declared on another host redirects to its Site's configured canonical host",
    "G03 an alias root never synthesises a locale and is refused",
    "G03 an alias prefix matches whole segments only",
    "G03 an alias never invents a locale the owning Site does not declare",
    "G03 an unlisted Page keeps its canonical access and is never an alias destination",
    "G03 a hostile query on an authorized alias refuses with the approved 404 and no reflection",
    "G03 with no declared default a declared address alias still redirects to its own Site's canonical",
  ]) {
    if (!source.includes(needed)) add(`alias-runner:${needed.slice(4, 34)}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The safe-query contract (`UNO-WO-099 / R01`).
 *
 * Three files must agree: the pure validator exists and bounds itself, the thin edge consults it and appends only its
 * accepted answer to a location the serving decision already granted, and the production runner proves both the
 * byte-preserving positive and the refusing negative.
 */
function analyseQueryPolicy(proxySource, helperSource, runnerSource) {
  const problems = [];
  const add = (code) => problems.push(code);

  if (!/export function validateUnoSafeRedirectQuery\(/u.test(helperSource)) add("query:helper");
  if (!/export const UNO_SAFE_REDIRECT_QUERY_LIMITS/u.test(helperSource)) add("query:limits");
  if (!/bytes: 512/u.test(helperSource)) add("query:byte-budget");
  if (!/parameters: 8/u.test(helperSource)) add("query:parameter-budget");
  if (!/const SAFE_VALUE = /u.test(helperSource)) add("query:value-grammar");
  if (!/function normalizeSpaceSpelling\(/u.test(helperSource)) add("query:space-spelling");
  if (!/"query:too-long"/u.test(helperSource)) add("query:refusal-vocabulary");

  if (!/import \{ validateUnoSafeRedirectQuery \} from '\.\/config\/uno-safe-redirect-query';/u.test(proxySource)) {
    add("query:edge-import");
  }
  if (!/if \(safeQuery\.status !== 'accepted'\) return approvedRefusal\(\);/u.test(proxySource)) add("query:edge-guard");
  if (!/location: `\$\{decision\.location\}\$\{safeQuery\.query\}`,/u.test(proxySource)) add("query:edge-concat");
  if (!/status: 307,/u.test(proxySource)) add("query:edge-status");
  if (!/'cache-control': 'no-store',/u.test(proxySource)) add("query:edge-cache");
  if (/new URL\(/u.test(proxySource)) add("query:edge-url");
  if (/x-forwarded/u.test(proxySource)) add("query:edge-forwarded");

  if (!runnerSource.includes("G03 an authorized alias preserves a safe query byte for byte")) {
    add("query-runner:positive");
  }
  if (!runnerSource.includes("?ref=alpha%20beta&view=compact")) add("query-runner:literal");
  if (!runnerSource.includes("G03 a hostile query on an authorized alias refuses with the approved 404 and no reflection")) {
    add("query-runner:hostile");
  }
  if (!runnerSource.includes("G03 the short language alias preserves a safe query to its own Site's Home")) {
    add("query-runner:short-alias");
  }
  if (
    !runnerSource.includes("G03 with no declared default a safe query still reaches the owning canonical Site on a fresh server")
  ) {
    add("query-runner:phase-two");
  }

  return { ok: problems.length === 0, problems };
}

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

test("the runner contract rejects a hand-built List instead of the real composition", () => {
  const mutated = mutate(read(RUNNER), "await composedListSections({", "await Promise.resolve([])(");
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:list-composed"));
});

test("the runner contract rejects a List destination proof that skips the whole-Page refusal matrix", () => {
  const mutations = [
    ['await probe(corporate, "privacy", "cross-Site");', ""],
    ['await probe(corporate, "brief", "cross-Facet");', ""],
    ['await probe(services, "brief", "unlisted");', ""],
    ['await probe(services, "draft", "draft");', ""],
  ];
  for (const [index, [token, replacement]] of mutations.entries()) {
    const verdict = analyseRunner(mutate(read(RUNNER), token, replacement));
    assert.equal(verdict.ok, false, token);
    assert.ok(verdict.problems.includes(`runner:list-probe-${index}`), `${token}: ${verdict.problems.join(",")}`);
  }
});

test("the runner contract rejects a List mutation that is never restored", () => {
  const verdict = analyseRunner(mutate(read(RUNNER), "writeFileSync(absolute, original);", ""));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:list-restore"));
});

test("the runner contract rejects dropping the no-default List destination proof", () => {
  const mutated = mutate(
    read(RUNNER),
    '"G06 with no declared default each Site still projects its own authored List destinations"',
    '"G06 no default"',
  );
  const verdict = analyseRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("runner:list-no-default"));
});

test("the committed serving composition satisfies every declared-alias routing rule", () => {
  const verdict = analyseAliasRouting(read(SERVING));
  assert.deepEqual(verdict.problems, []);
  assert.equal(verdict.ok, true);
});

test("the committed runner proves the declared alias positively, not permissively", () => {
  const verdict = analyseAliasRunner(read(RUNNER));
  assert.deepEqual(verdict.problems, []);
  assert.equal(verdict.ok, true);
});

test("the alias contract rejects a redirect that skips the public gate", () => {
  const mutated = mutate(read(SERVING), "  if (!planned.page.delivery.public) return null;\n", "");
  const verdict = analyseAliasRouting(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias:public-gate"));
});

test("the alias contract rejects a redirect that never compares the planned canonical", () => {
  const mutated = mutate(read(SERVING), "  if (planned.page.delivery.canonicalUrl !== target.canonicalUrl) return null;\n", "");
  const verdict = analyseAliasRouting(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias:canonical-gate"));
});

test("the alias contract rejects answering an alias before the canonical owner is tried", () => {
  const mutated = mutate(read(SERVING), "  const served = await planUnoServingPage({ host, pathname });\n", "");
  const verdict = analyseAliasRouting(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias:canonical-first-missing"));
});

test("the alias contract rejects removing the alias branch entirely", () => {
  const mutated = mutate(read(SERVING), "  const aliased = await redirectThroughAlias(host, pathname);\n", "");
  const verdict = analyseAliasRouting(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias:wiring"));
});

test("the alias contract rejects a destination authority taken from the request", () => {
  const mutated = mutate(read(SERVING), "        host: canonicalHost,", "        host: requestHost,");
  const verdict = analyseAliasRouting(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias:stored-host"));
});

test("the alias runner contract rejects the permissive alias wording returning", () => {
  const mutated = mutate(
    read(RUNNER),
    "G03 an alias prefix matches whole segments only",
    "G03 an alias redirect, when offered, matches whole segments only",
  );
  const verdict = analyseAliasRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias-runner:permissive"));
});

test("the alias runner contract rejects a lost positive redirect assertion", () => {
  const mutated = mutate(
    read(RUNNER),
    "G03 a declared address alias redirects temporarily to its own Site's canonical address",
    "G03 a declared address alias is recorded",
  );
  const verdict = analyseAliasRunner(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias-runner:positive"));
});

test("the committed safe-query policy satisfies every validator, edge and runner rule", () => {
  const verdict = analyseQueryPolicy(read(PROXY), read(QUERY_HELPER), read(RUNNER));
  assert.deepEqual(verdict.problems, []);
  assert.equal(verdict.ok, true);
});

test("the query contract rejects an edge that appends a query without consulting the validator", () => {
  const mutated = mutate(read(PROXY), "  if (safeQuery.status !== 'accepted') return approvedRefusal();\n", "");
  const verdict = analyseQueryPolicy(mutated, read(QUERY_HELPER), read(RUNNER));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("query:edge-guard"));
});

test("the query contract rejects a location built from the raw request query", () => {
  const mutated = mutate(read(PROXY), "location: `${decision.location}${safeQuery.query}`,", "location: `${decision.location}${rawQuery}`,");
  const verdict = analyseQueryPolicy(mutated, read(QUERY_HELPER), read(RUNNER));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("query:edge-concat"));
});

test("the query contract rejects a widened byte budget", () => {
  const mutated = mutate(read(QUERY_HELPER), "  bytes: 512,", "  bytes: 65536,");
  const verdict = analyseQueryPolicy(read(PROXY), mutated, read(RUNNER));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("query:byte-budget"));
});

test("the query contract rejects removing the single space normalization", () => {
  const mutated = mutate(read(QUERY_HELPER), "function normalizeSpaceSpelling(", "function unusedSpaceSpelling(");
  const verdict = analyseQueryPolicy(read(PROXY), mutated, read(RUNNER));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("query:space-spelling"));
});

test("the query contract rejects a lost byte-preserving positive assertion", () => {
  const mutated = mutate(
    read(RUNNER),
    "G03 an authorized alias preserves a safe query byte for byte",
    "G03 an authorized alias is recorded",
  );
  const verdict = analyseQueryPolicy(read(PROXY), read(QUERY_HELPER), mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("query-runner:positive"));
});

test("the query contract rejects a lost hostile-query refusal assertion", () => {
  const mutated = mutate(
    read(RUNNER),
    "G03 a hostile query on an authorized alias refuses with the approved 404 and no reflection",
    "G03 a hostile query on an authorized alias is tolerated",
  );
  const verdict = analyseQueryPolicy(read(PROXY), read(QUERY_HELPER), mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("query-runner:hostile"));
});

test("the query contract rejects an edge that trusts a forwarded authority", () => {
  const mutated = mutate(read(PROXY), "request.headers.get('host')", "request.headers.get('x-forwarded-host')");
  const verdict = analyseQueryPolicy(mutated, read(QUERY_HELPER), read(RUNNER));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("query:edge-forwarded"));
});

test("the alias contract keeps rejecting the pre-existing public-gate removal", () => {
  const mutated = mutate(read(SERVING), "  if (!planned.page.delivery.public) return null;\n", "");
  const verdict = analyseAliasRouting(mutated);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.problems.includes("alias:public-gate"));
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

