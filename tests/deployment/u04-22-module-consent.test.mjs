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

const PINNED = Object.freeze([
  "ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0",
  "4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c",
]);

/** Audit one runner source and return every invariant it fails. An empty list means the gate is intact. */
function audit(text) {
  const missing = [];
  for (const token of [...REQUIRED, ...PHASE_A_REQUIRED]) if (!text.includes(token)) missing.push(token);
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
});
