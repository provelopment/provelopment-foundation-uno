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

const PINNED = Object.freeze([
  "ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0",
  "4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c",
]);

/** Audit one runner source and return every invariant it fails. An empty list means the gate is intact. */
function audit(text) {
  const missing = [];
  for (const token of REQUIRED) if (!text.includes(token)) missing.push(token);
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
});
