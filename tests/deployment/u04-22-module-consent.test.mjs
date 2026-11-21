/**
 * Hermetic guard for the bounded 22-module and four-provider consent gate (`UNO-WO-044 / R01`).
 *
 * This is not the gate. It is the guard that makes the gate hard to weaken: it audits the runner's source for the
 * invariants that give it meaning — the pinned declaration digests, the twenty-two authored module IDs, the four
 * governed providers, an unconditional `finally` restoration, and the absence of any silent-pass bypass — and it proves
 * the audit actually fails when one of those invariants is deleted. A green gate whose assertions can be quietly
 * removed is worth less than no gate at all.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();
const RUNNER = resolve(ROOT, "scripts/verify-u04-22-module-consent.mjs");
const source = readFileSync(RUNNER, "utf8");

/** The invariants that must survive any future edit to the runner. */
const REQUIRED = Object.freeze([
  'provider: "youtube"',
  'provider: "vimeo"',
  'provider: "rumble"',
  'provider: "bitchute"',
  "pre-consent Chromium DOM has zero iframes",
  "pre-consent made no provider request at all",
  "uses a governed fixed origin",
  "made exactly one provider request",
  "made no foreign network request",
  "unload removes the iframe",
  "unload restores focus to the consent control",
  "the authored fixture Page is accepted by the real validator",
  "the fixture carries all",
  "an unregistered module ID refuses the whole Page",
  "the unregistered-module Page answers HTTP 404",
  "is restored to its committed bytes",
  "nothing was staged by the gate",
  // `UNO-WO-048 / R01`: the owned-media HTTP proof must survive any future edit.
  "the served Page advertises an owned-media locator",
  "the authorised owned occurrence answers HTTP 200",
  "it forbids MIME sniffing",
  "HEAD answers HTTP 200 for the same authorised occurrence",
  "HEAD returns no body at all",
  "a non-video resource ignores a range and serves the full authorised 200",
  "an unauthorised locator is refused before any range is inspected",
  "an out-of-range occurrence is a closed 404",
  "prepareUnoU03FixtureTransaction",
  "finally",
]);

const FORBIDDEN = Object.freeze(["continue-on-error", "|| true", "process.exit(0)", "test.skip", "it.skip"]);

/** Every one of the twenty-two registered module IDs must be authored by the fixture. */
const MODULE_IDS = Object.freeze([
  "layout.stack", "layout.grid", "layout.bento", "layout.layers",
  "content.heading", "content.prose", "content.actions", "content.hero", "content.stats",
  "content.testimonials", "content.pricing", "content.timeline",
  "media.image", "media.video", "media.gallery", "media.carousel",
  "design.watermark", "design.motion",
  "interaction.tabs", "interaction.accordion", "interaction.modal", "interaction.contact",
]);

/** Phase A invariants (`UNO-WO-053 / R01`): the producer, four-zone, native-container and closed-refusal gates. */
const PHASE_A_REQUIRED = Object.freeze([
  // `UNO-WO-053 / R01` Phase A: the producer, four-zone, native-container and closed-refusal gates.
  "allModulesDocument(generatedIntegrity)",
  "{ path: SOURCES[1], bytes: allModulesJsonBytes }",
  "INSTALL_PARITY the installed source is the single authored buffer",
  "INSTALL_DOCUMENT_HAS_DIGEST",
  "LOAD_PARITY the loaded text is the installed bytes",
  "SERVING_SERVED the trusted serving planner serves the Page",
  "BAD_DOCUMENT_VALID the wrong-digest Page is syntactically accepted",
  "BAD_PAGE serving refuses the wrong generated digest",
  "FOUR_ZONE_HTTP=4/4",
  "NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER",
  "ZONE ${zone} ledger zone",
  "ZONE ${zone} ignores non-video Range",
  "wo052-native-mp4",
  "wo053-native-webm",
  '"wo053-native-webm", MEDIA.webm, "video/webm"',
  "text/vtt",
  "WEBVTT",
  "await expectVideoRanges(",
  "416 ${header}",
  "expectClosed404",
  "wo053-bad-generated",
  "for (const [relativePath] of createdMedia) {",
]);

/** Phase B invariants (`UNO-WO-054 / R01`): the executed sixteen-case browser matrix. */
const PHASE_B_REQUIRED = Object.freeze([
  'const MATRIX_WIDTHS = Object.freeze([320, 390, 768, 1280]);',
  'const MATRIX_SCHEMES = Object.freeze(["light", "dark"]);',
  'const MATRIX_MOTIONS = Object.freeze(["no-preference", "reduce"]);',
  "for (const width of MATRIX_WIDTHS)",
  "for (const colorScheme of MATRIX_SCHEMES)",
  "for (const reducedMotion of MATRIX_MOTIONS)",
  "await tab.setViewportSize({ width, height: 900 });",
  "await tab.emulateMedia({ colorScheme, reducedMotion });",
  'await tab.goto(MATRIX_URL, { waitUntil: "load" });',
  "no document horizontal overflow",
  "reduced-motion CSS",
  "two native controls and source/track/poster",
  "ArrowRight selects B and focuses it",
  "Home restores A and focus",
  "accordion Enter opens",
  "accordion Space closes",
  "Escape closes modal and restores focus",
  "carousel next changes live status",
  "carousel previous restores status",
  "zero iframe/provider requests before consent",
  "unload removes frame and restores focus",
  "matrixPassed += 1",
  "MATRIX_CASE ${caseId}",
  "BROWSER_MATRIX 16 distinct case IDs",
  "BROWSER_MATRIX=16/16",
]);

const PINNED = Object.freeze([
  "ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0",
  "4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c",
]);

/**
 * Phase C invariants (`UNO-WO-066 / R01`): the composed family Page, from the real adapter through installation,
 * loading, serving, production HTTP, owned-media bytes and Chromium, plus its unconditional cleanup.
 */
const PHASE_C_REQUIRED = Object.freeze([
  'await import("../src/application/compose-uno-foundation-families.ts")',
  "composeUnoFoundationSubset(familySource(), familyBindings())",
  "FAMILY_COMPOSE_ACCEPTED the real adapter accepts the nine-section source once",
  "FAMILY_COMPOSE_ACCEPTED exact source-index ids and no extra section",
  "FAMILY_COMPOSE_ACCEPTED the accepted document is deeply frozen",
  "FAMILY_DOCUMENT_REACCEPTED the real reader reaccepts the same bytes with equal values",
  "FAMILY_SOURCE_NOT_SERIALIZED the donor identity and the acknowledgement never reach the Page",
  "FAMILY_SOURCE_NOT_SERIALIZED the Page carries the real Uno modules and the owned ref, not a donor path",
  "FAMILY_BINDING_REFUSED the identical source refuses with every incomplete binding",
  'const FAMILY_ROUTE = ["wo066-family-composition"];',
  "wo066-family-composition.en-001.json",
  "wo066-family-plate.png",
  "{ path: SOURCES[4], bytes: familyJsonBytes }",
  "FAMILY_INSTALL_PARITY the installed family source is the one composed buffer",
  'loadUnoCandidateSource({ repoRoot: ROOT, pathname: "/en-001/wo066-family-composition" })',
  "FAMILY_LOAD_PARITY the confined loader accepts and returns the installed bytes",
  "FAMILY_SERVING_SERVED the trusted serving planner serves the composed Page",
  "FAMILY_SERVING_SERVED one JSON Page and exactly three owned image occurrences in document order",
  "FAMILY_HTTP=200 the composed Page answers HTTP 200",
  "FAMILY_HTTP=200 the Page renders the nine authored section ids in document order",
  "FAMILY_CONTACT_OFF_HTTP the contact subtree carries no form, control, handler or destination",
  "FAMILY_CONTACT_OFF_HTTP neither the donor identity nor the acknowledgement appears anywhere in the HTML",
  "FAMILY_MEDIA=3/3 three distinct locators serve the one Page-owned plate with GET and HEAD",
  "FAMILY_UNPUBLISHED_404 an unlisted path stays a closed 404",
  "FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px",
  "family-6-contactform",
  "FAMILY_BROWSER ${label}",
  "${width}px the contact action stays in the same document and reaches its target",
  "${width}px Enter opens the FAQ disclosure",
  "the fixture source ${path} is removed",
]);

/** Audit one runner source and return every invariant it fails. An empty list means the gate is intact. */
function audit(text) {
  const missing = [];
  for (const token of [...REQUIRED, ...PHASE_A_REQUIRED, ...PHASE_B_REQUIRED, ...PHASE_C_REQUIRED]) if (!text.includes(token)) missing.push(token);
  for (const token of FORBIDDEN) if (text.includes(token)) missing.push(`forbidden: ${token}`);
  for (const id of MODULE_IDS) if (!text.includes(`"${id}"`)) missing.push(`module: ${id}`);
  for (const digest of PINNED) if (!text.includes(digest)) missing.push(`digest: ${digest}`);
  if (!/finally\s*\{[\s\S]*restore\(/u.test(text)) missing.push("the finally block does not restore the fixture");
  return missing;
}

describe("verify-u04-22-module-consent — hermetic guard", () => {
  it("the runner exists and is the one authorized by this order", () => {
    assert.ok(source.length > 8_000, "the runner is suspiciously small");
    assert.match(source, /UNO-WO-044/u);
  });

  it("the intact runner satisfies every invariant", () => {
    assert.deepEqual(audit(source), []);
  });

  it("the audit genuinely fails when a pre-consent assertion is deleted", () => {
    const mutated = source.replace('check("pre-consent made no provider request at all"', 'check("x"');
    assert.notDeepEqual(audit(mutated), []);
  });

  it("the audit genuinely fails when a module ID is dropped from the fixture", () => {
    const mutated = source.replaceAll('"interaction.contact"', '"content.prose"');
    const missing = audit(mutated);
    assert.ok(missing.some((entry) => entry.includes("interaction.contact")), missing.join(","));
  });

  it("the audit genuinely fails when the restoration check is removed", () => {
    const mutated = source.replace("is restored to its committed bytes", "is whatever");
    assert.notDeepEqual(audit(mutated), []);
  });

  it("the audit genuinely fails when a silent-pass bypass is introduced", () => {
    const mutated = `${source}\nprocess.exit(0);\n`;
    assert.ok(audit(mutated).some((entry) => entry.startsWith("forbidden:")));
  });

  it("the audit genuinely fails when a provider is dropped", () => {
    const mutated = source.replaceAll('provider: "bitchute"', 'provider: "vimeo"');
    assert.ok(audit(mutated).some((entry) => entry.includes("bitchute")));
  });

  it("the pinned declarations in the runner match the committed bytes", () => {
    for (const digest of PINNED) assert.ok(source.includes(digest));
  });

  // `UNO-WO-053 / R01` §6: independent Phase A mutations. Each deletes one real gate and must change the audit.
  it("the audit genuinely fails when the generated integrity argument is dropped again", () => {
    const mutated = source.replaceAll("allModulesDocument(generatedIntegrity)", "allModulesDocument()");
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes("allModulesDocument(generatedIntegrity)")), audit(mutated).join(","));
  });

  it("the audit genuinely fails when fixturePlan regenerates a second Page", () => {
    const mutated = source.replace("{ path: SOURCES[1], bytes: allModulesJsonBytes }", "{ path: SOURCES[1], bytes: Buffer.from(JSON.stringify(allModulesDocument())) }");
    assert.notEqual(mutated, source);
    assert.notDeepEqual(audit(mutated), []);
  });

  it("the audit genuinely fails when an installed or loaded parity check is deleted", () => {
    for (const token of ["INSTALL_PARITY the installed source is the single authored buffer", "LOAD_PARITY the loaded text is the installed bytes"]) {
      const mutated = source.replace(`"${token}"`, '"removed"');
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(token)), token);
    }
  });

  it("the audit genuinely fails when a zone, the WebM case or a gate label is dropped", () => {
    const dropped = source
      .replace('["platform", "wo052-platform-image", "image", "image/png"', '["platform", "wo052-platform-image"')
      .replace('"wo053-native-webm", MEDIA.webm, "video/webm"', '"wo052-native-mp4", MEDIA.mp4, "video/mp4"')
      .replace('check("FOUR_ZONE_HTTP=4/4"', 'check("x"')
      .replace('check("NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER"', 'check("y"');
    const missing = audit(dropped);
    assert.ok(missing.some((entry) => entry.includes("FOUR_ZONE_HTTP=4/4")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("NATIVE_VIDEO_HTTP")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("video/webm")), missing.join(","));
  });

  it("the audit genuinely fails when range or refusal coverage disappears", () => {
    const mutated = source
      .replaceAll("await expectVideoRanges(", "void (")
      .replaceAll("416 ${header}", "nope");
    const missing = audit(mutated);
    assert.ok(missing.some((entry) => entry.includes("expectVideoRanges")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("416")), missing.join(","));
  });

  it("the audit genuinely fails when owned-media cleanup is removed", () => {
    const mutated = source.replace("for (const [relativePath] of createdMedia) {", "for (const [relativePath] of []) {");
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes("createdMedia")), audit(mutated).join(","));
  });

  // `UNO-WO-054 / R01` §5: independent Phase B mutations. Each deletes an executed matrix contract.
  it("the audit genuinely fails when a matrix dimension is removed", () => {
    const shapes = [
      [source.replace("320, 390, 768, 1280", "390, 768, 1280"), "MATRIX_WIDTHS"],
      [source.replace("320, 390, 768, 1280", "320, 390, 768"), "MATRIX_WIDTHS"],
      [source.replace('["light", "dark"]', '["light"]'), "MATRIX_SCHEMES"],
      [source.replace('["no-preference", "reduce"]', '["no-preference"]'), "MATRIX_MOTIONS"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the emulation, navigation or a layout/motion check is removed", () => {
    const shapes = [
      [source.replace("await tab.emulateMedia({ colorScheme, reducedMotion });", ""), "emulateMedia"],
      [source.replace('await tab.goto(MATRIX_URL, { waitUntil: "load" });', ""), "MATRIX_URL"],
      [source.replace("no document horizontal overflow", "overflow tolerated"), "horizontal overflow"],
      [source.replace("reduced-motion CSS", "motion unverified"), "reduced-motion"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when a keyboard or interaction assertion is removed", () => {
    const shapes = [
      [source.replace("ArrowRight selects B and focuses it", "tab unverified"), "ArrowRight"],
      [source.replace("Home restores A and focus", "tab unverified"), "Home restores"],
      [source.replace("accordion Enter opens", "accordion unverified"), "accordion Enter"],
      [source.replace("accordion Space closes", "accordion unverified"), "accordion Space"],
      [source.replace("Escape closes modal and restores focus", "modal unverified"), "Escape closes modal"],
      [source.replace("carousel next changes live status", "carousel unverified"), "carousel next"],
      [source.replace("carousel previous restores status", "carousel unverified"), "carousel previous"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when consent, unload or native-media coverage is removed", () => {
    const shapes = [
      [source.replace("zero iframe/provider requests before consent", "consent unverified"), "zero iframe"],
      [source.replace("unload removes frame and restores focus", "unload unverified"), "unload removes"],
      [source.replace("two native controls and source/track/poster", "media unverified"), "native controls"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the matrix gate, its counting or its case emission is weakened", () => {
    const shapes = [
      [source.replace("matrixPassed += 1", "matrixPassed += 0"), "matrixPassed"],
      [source.replace("MATRIX_CASE ${caseId}", "CASE"), "MATRIX_CASE"],
      [source.replace("BROWSER_MATRIX=16/16", "BROWSER_MATRIX=ok"), "BROWSER_MATRIX=16/16"],
      [source.replace('BROWSER_MATRIX 16 distinct case IDs', 'BROWSER_MATRIX ids'), "BROWSER_MATRIX 16 distinct case IDs"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  // `UNO-WO-066 / R01` §5: independent Phase C mutations. Each one deletes a real executed family-Page check, and the
  // audit must name the invariant that disappeared.
  it("the audit genuinely fails when the real adapter is replaced by a hand-authored Page", () => {
    const mutated = source
      .replace('await import("../src/application/compose-uno-foundation-families.ts")', "await import(\"../src/core/page-document.ts\")")
      .replace("composeUnoFoundationSubset(familySource(), familyBindings())", "({ status: \"composed\", document: familySource() })");
    assert.notEqual(mutated, source);
    const missing = audit(mutated);
    assert.ok(missing.some((entry) => entry.includes("compose-uno-foundation-families.ts")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("composeUnoFoundationSubset(familySource(), familyBindings())")), missing.join(","));
  });

  it("the audit genuinely fails when the fifth fixture source is not installed from the composed buffer", () => {
    const mutated = source.replace("{ path: SOURCES[4], bytes: familyJsonBytes }", "{ path: SOURCES[4], bytes: allModulesJsonBytes }");
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes("SOURCES[4], bytes: familyJsonBytes")), audit(mutated).join(","));
  });

  it("the audit genuinely fails when the composed-install or composed-load parity check is deleted", () => {
    for (const token of [
      "FAMILY_INSTALL_PARITY the installed family source is the one composed buffer",
      "FAMILY_LOAD_PARITY the confined loader accepts and returns the installed bytes",
      "FAMILY_SERVING_SERVED one JSON Page and exactly three owned image occurrences in document order",
    ]) {
      const mutated = source.replace(`"${token}"`, '"removed"');
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(token)), token);
    }
  });

  it("the audit genuinely fails when the family HTTP, media-byte or contact-OFF check is weakened", () => {
    const shapes = [
      ['check("FAMILY_HTTP=200 the composed Page answers HTTP 200"', 'check("FAMILY_HTTP=ok"', "FAMILY_HTTP=200"],
      ["FAMILY_MEDIA=3/3 three distinct locators serve the one Page-owned plate with GET and HEAD", "FAMILY_MEDIA=served", "FAMILY_MEDIA=3/3"],
      ["FAMILY_CONTACT_OFF_HTTP the contact subtree carries no form, control, handler or destination", "contact unchecked", "FAMILY_CONTACT_OFF_HTTP"],
      ["FAMILY_UNPUBLISHED_404 an unlisted path stays a closed 404", "unlisted unchecked", "FAMILY_UNPUBLISHED_404"],
    ];
    for (const [from, to, contract] of shapes) {
      const mutated = source.replace(from, to);
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the family browser, keyboard or cleanup token is removed", () => {
    const shapes = [
      ["FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px", "family browser unverified", "FAMILY_BROWSER=PASS"],
      ["${width}px Enter opens the FAQ disclosure", "faq unverified", "Enter opens the FAQ"],
      ["${width}px the contact action stays in the same document and reaches its target", "anchor unverified", "reaches its target"],
      ["the fixture source ${path} is removed", "cleanup skipped", "the fixture source ${path} is removed"],
    ];
    for (const [from, to, contract] of shapes) {
      const mutated = source.replace(from, to);
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the guard is intact and the family fixture keeps the seventeen-mapping contract", () => {
    assert.deepEqual(audit(source), []);
    // The runner verifies the adapter's contractual top-level ids but never invents a child id or authors a Page node.
    assert.ok(source.includes("const FAMILY_IDS = Object.freeze(["));
    assert.ok(!/family-3-faq-/u.test(source));
    assert.ok(!/id: "family-0-prose", module: "/u.test(source));
    assert.ok(source.includes('"contactForm"'));
    assert.ok(source.includes('mode: "delivery-off"'));
  });
});
