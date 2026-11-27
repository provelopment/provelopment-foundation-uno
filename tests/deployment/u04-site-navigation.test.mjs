/**
 * Foundation Uno — the U04 navigation wiring (`U04`, navigation).
 *
 * The navigation is only as trustworthy as the clauses that build it: a planner that stops checking eligibility, a route that
 * stops rendering the current-Page indication, a build that stops shipping the presentation file, or a browser proof that
 * stops asserting destinations would each leave a label claiming something no longer executed. This guard requires every one
 * of those clauses to stay in place, and proves its own sensitivity by removing and neutering each one.
 *
 * The validator and planner are proven **behaviourally** by `tests/unit/uno-site-navigation.test.ts`; this guard proves the
 * wiring and the committed data, so neither half can pass while the other is disconnected.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();
const read = (relativePath) => readFileSync(resolve(ROOT, relativePath), "utf8");

/** Every clause the navigation depends on, with the file that must keep it. */
const REQUIRED = Object.freeze([
  ["src/core/efs/uno-presentation.ts", "export function validateUnoPresentationConfig"],
  ["src/core/efs/uno-presentation.ts", 'return { accepted: false, reason: "presentation:unknown-key" };'],
  ["src/core/efs/uno-presentation.ts", 'if (seen.has(key)) return { accepted: false, reason: "presentation:duplicate-site" };'],
  ["src/core/efs/uno-presentation.ts", 'if (seen.has(item.pageId)) return "presentation:duplicate-item";'],
  ["src/application/plan-uno-site-navigation.ts", "page.delivery.public === true"],
  ["src/application/plan-uno-site-navigation.ts", "page.delivery.unlisted === false"],
  ["src/application/plan-uno-site-navigation.ts", 'page.document.visibility === "public"'],
  ["src/application/plan-uno-site-navigation.ts", "page.identity.localeTag === localeTag"],
  ["src/application/plan-uno-site-navigation.ts", "page.identity.siteId === site.siteId"],
  ["src/application/plan-uno-site-navigation.ts", "href: page.identity.pathname"],
  ["src/application/plan-uno-site-navigation.ts", 'if (input.presentation === null) return { status: "absent", reason: "navigation:not-configured" };'],
  ["src/application/plan-uno-site-navigation.ts", 'return { status: "absent", reason: "navigation:no-eligible-entry" };'],
  ["src/config/uno-serving.ts", "export async function planUnoServingNavigation"],
  ["src/config/uno-serving.ts", 'return { status: "absent", reason: "navigation:configuration-invalid" };'],
  ["src/config/uno-serving.ts", "const presentation = readPresentation(authority.root);"],
  ["src/app/(site)/[...segments]/page.tsx", "planUnoServingNavigation({"],
  ["src/app/(site)/[...segments]/page.tsx", '<nav className="uno-nav" aria-label={navigation.plan.ariaLabel}>'],
  ["src/app/(site)/[...segments]/page.tsx", "aria-current={entry.current ? 'page' : undefined}"],
  ["scripts/verify-u03-browser.mjs", "async function assertShellNavigation("],
  ["scripts/verify-u03-browser.mjs", "excludedPaths"],
  ["scripts/verify-u03-browser.mjs", "offers only destinations this run serves publicly"],
  ["scripts/verify-u03-browser.mjs", "labels every entry with the authored title of its own Page"],
  ["scripts/verify-u03-browser.mjs", "keeps every destination inside the served Page's own locale"],
  ["scripts/verify-u03-browser.mjs", "reaches every destination by keyboard with the token focus ring"],
  ["next.config.ts", "'./deployment/site.config.json'"],
  ["scripts/verify-u03-trace.mjs", '"deployment/site.config.json"'],
]);

describe("the U04 navigation is wired end to end", () => {
  it("keeps every clause in the file that owns it", () => {
    for (const [file, token] of REQUIRED) {
      assert.deepEqual(missing(read(file), [token]), [], `${file} :: ${token}`);
    }
  });

  it("fails the same audit when any clause is removed", () => {
    for (const [file, token] of REQUIRED) {
      const text = read(file);
      const mutated = text.split(token).join("REMOVED");
      assert.notEqual(mutated, text, `${file} :: ${token}`);
      assert.ok(missing(mutated, [token]).includes(token), `${file} :: ${token}`);
    }
  });

  it("fails the same audit when an eligibility clause is neutered", () => {
    const planner = read("src/application/plan-uno-site-navigation.ts");
    for (const [clause, neutered] of [
      ["page.delivery.public === true", "true"],
      ["page.delivery.unlisted === false", "true"],
      ['page.document.visibility === "public"', "true"],
      ["page.identity.localeTag === localeTag", "true"],
      ["page.identity.siteId === site.siteId", "true"],
    ]) {
      const mutated = planner.split(clause).join(neutered);
      assert.notEqual(mutated, planner, clause);
      assert.ok(missing(mutated, [clause]).includes(clause), clause);
    }
  });
});

describe("the committed navigation configuration is the one the manifest describes", () => {
  const presentation = JSON.parse(read("deployment/site.config.json"));
  const manifest = JSON.parse(read("deployment/efs/manifest.json"));
  const selection = JSON.parse(read("deployment/uno.config.json"));

  it("declares version 1, one Site entry, and that entry is the selected Site", () => {
    assert.equal(presentation.version, 1);
    assert.equal(presentation.sites.length, 1);
    assert.deepEqual(presentation.sites[0].site, selection.selectedSite);
  });

  it("names the three authored starter Pages in order, with Home as the brand destination", () => {
    const site = manifest.entities[0].facets[0].sites[0];
    const authored = site.pages.map((page) => page.id);
    const items = presentation.sites[0].navigation.items.map((item) => item.page);
    assert.deepEqual(items, ["home", "about", "components"]);
    for (const pageId of items) assert.ok(authored.includes(pageId), pageId);
    assert.equal(presentation.sites[0].brand.homePage, "home");
    assert.equal(presentation.sites[0].navigation.ariaLabel, "Primary");
  });

  it("carries no field the envelope does not define", () => {
    assert.deepEqual(Object.keys(presentation).sort(), ["sites", "version"]);
    assert.deepEqual(Object.keys(presentation.sites[0]).sort(), ["brand", "navigation", "site"]);
    assert.deepEqual(Object.keys(presentation.sites[0].site).sort(), ["facetId", "siteId"]);
    assert.deepEqual(Object.keys(presentation.sites[0].navigation).sort(), ["ariaLabel", "items"]);
  });
});


/** The tokens still missing from one source text. */
const missing = (text, tokens) => tokens.filter((token) => !text.includes(token));
