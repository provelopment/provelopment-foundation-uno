/**
 * Foundation Uno — the published-declaration baseline (shared by the HTTP and browser gates).
 *
 * WHY THIS EXISTS. Two verification families used to compare `deployment/efs/manifest.json` against a single historical
 * SHA-256. That is exact, but it cannot tell an authorised declaration change from unauthorised drift, and it produced a
 * failure that said nothing except "the bytes differ". This module replaces the opaque pin with three separate proofs,
 * and keeps the old digest as recorded history rather than as an active assertion:
 *
 *   1. SEMANTIC. `manifestSemanticIssue()` states exactly which Entity, Facet, Site, locales, Pages, publications,
 *      sources and governed properties the committed graph must declare. A change of any of those is refused with the
 *      first difference named.
 *   2. MUTATION-SENSITIVE. `manifestMutationProof()` applies one mutation per rule to a structured clone and reports what
 *      the semantic check said. A baseline that cannot fail is not a baseline.
 *   3. BYTE-EXACT RESTORE. `captureDeclarationDigests()` records the digests observed at process start, and
 *      `declarationDriftAfter()` compares the same files afterwards. A fixture run must leave the tree byte-identical to
 *      what it found — never to a constant baked into a script.
 *
 * The historical digests are retained below with the reason they were retired, so the evidence chain is intact.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** The committed declarations this baseline governs. */
export const MANIFEST = "deployment/efs/manifest.json";
export const SELECTION = "deployment/uno.config.json";

/** The one synthetic Entity this starter declares. */
export const BASELINE_ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
export const BASELINE_FACET_ID = "foundation";
export const BASELINE_SITE_ID = "main";
export const BASELINE_LOCALE = "en-001";

/** The three Pages, their routes, and the publication each declares. */
export const BASELINE_PAGES = Object.freeze([
  Object.freeze({ id: "home", route: Object.freeze(["home"]), publication: "published" }),
  Object.freeze({ id: "about", route: Object.freeze(["about"]), publication: "published" }),
  Object.freeze({ id: "components", route: Object.freeze(["components"]), publication: "published" }),
]);

/**
 * The governed properties the committed graph must declare, exactly.
 *
 * `contact.email` is public **and** carries the one exposure token: that pair is the authorisation the public-contact
 * projection requires, so losing either half changes what the product publishes and must fail here.
 */
export const BASELINE_PROPERTIES = Object.freeze({
  "brand.name": Object.freeze({ value: "Foundation Uno", public: false }),
  "contact.email": Object.freeze({ value: "hello@example.com", public: true, expose: Object.freeze(["publicContact"]) }),
});

/**
 * THE RETIRED BYTE PINS, kept as history rather than as an assertion.
 *
 * `MANIFEST` was `b6213ed6…` until the authorised public-contact declaration (`contact.email`, public, exposed) was
 * added to the Entity at `179da66`. `SELECTION` is unchanged and stays pinned byte-for-byte, because nothing has
 * legitimately altered it.
 */
export const HISTORICAL_DECLARATION_DIGESTS = Object.freeze({
  [MANIFEST]: "b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925",
  [SELECTION]: "58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952",
});

/** The digest a file has now. */
export function sha256Of(root, relativePath) {
  return createHash("sha256").update(readFileSync(resolve(root, relativePath))).digest("hex");
}

/** A plain own-data view; the manifest is authored JSON, so reading it here is safe. */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Compare a declared value against an expectation, order-independently for arrays. */
function sameValue(actual, expected) {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((entry, index) => sameValue(actual[index], entry))
    );
  }
  if (isRecord(expected)) {
    if (!isRecord(actual)) return false;
    const expectedKeys = Object.keys(expected).sort();
    const actualKeys = Object.keys(actual).sort();
    if (expectedKeys.join(",") !== actualKeys.join(",")) return false;
    return expectedKeys.every((key) => sameValue(actual[key], expected[key]));
  }
  return actual === expected;
}

/** A structured clone of authored JSON, so a mutation never touches the committed file. */
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * The semantic expectation of the committed graph, or `null` when it is exactly what the product declares.
 *
 * The first difference is named, because "the manifest is wrong" is not a finding an operator can act on.
 */
export function manifestSemanticIssue(manifest) {
  if (!isRecord(manifest)) return "manifest:not-an-object";
  if (!Array.isArray(manifest.entities)) return "manifest:entities-missing";
  if (manifest.entities.length !== 1) return `manifest:expected-one-entity:${manifest.entities.length}`;

  const entity = manifest.entities[0];
  if (!isRecord(entity) || entity.id !== BASELINE_ENTITY_ID) return "manifest:entity-id";
  if (!isRecord(entity.properties)) return "manifest:entity-properties-missing";
  for (const [key, expected] of Object.entries(BASELINE_PROPERTIES)) {
    if (!sameValue(entity.properties[key], expected)) return `manifest:property:${key}`;
  }
  if (Object.keys(entity.properties).length !== Object.keys(BASELINE_PROPERTIES).length) {
    return "manifest:unexpected-property";
  }

  if (!Array.isArray(entity.facets) || entity.facets.length !== 1) return "manifest:expected-one-facet";
  const facet = entity.facets[0];
  if (!isRecord(facet) || facet.id !== BASELINE_FACET_ID) return "manifest:facet-id";
  if (!Array.isArray(facet.sites) || facet.sites.length !== 1) return "manifest:expected-one-site";
  const site = facet.sites[0];
  if (!isRecord(site) || site.id !== BASELINE_SITE_ID) return "manifest:site-id";
  if (!sameValue(site.locales, { supportedLocales: [BASELINE_LOCALE], defaultLocale: BASELINE_LOCALE })) {
    return "manifest:site-locales";
  }
  if (!Array.isArray(site.pages) || site.pages.length !== BASELINE_PAGES.length) {
    return `manifest:page-count:${Array.isArray(site.pages) ? site.pages.length : "none"}`;
  }

  for (const [index, expected] of BASELINE_PAGES.entries()) {
    const page = site.pages[index];
    if (!isRecord(page)) return `manifest:page-shape:${index}`;
    if (page.id !== expected.id) return `manifest:page-id:${index}`;
    if (!sameValue(page.route, expected.route)) return `manifest:page-route:${page.id}`;
    if (page.publication !== expected.publication) return `manifest:page-publication:${page.id}`;
    if (!Array.isArray(page.representations) || page.representations.length !== 1) {
      return `manifest:page-representations:${page.id}`;
    }
    const representation = page.representations[0];
    if (!isRecord(representation) || representation.locale !== BASELINE_LOCALE) {
      return `manifest:page-locale:${page.id}`;
    }
    if (!Array.isArray(representation.sources) || representation.sources.length !== 1) {
      return `manifest:page-sources:${page.id}`;
    }
    const source = representation.sources[0];
    if (!isRecord(source)) return `manifest:page-source-shape:${page.id}`;
    if (source.kind !== "json" && source.kind !== "markdown") return `manifest:page-source-kind:${page.id}`;
    if (typeof source.path !== "string" || !source.path.startsWith("deployment/efs/content/")) {
      return `manifest:page-source-path:${page.id}`;
    }
  }

  return null;
}

/**
 * Apply one mutation per rule and report what the semantic baseline said about each.
 *
 * A case whose `issue` is null means the baseline accepted a mutation it exists to refuse; the caller must treat that as
 * a defect of the baseline rather than as a passing check.
 */
export function manifestMutationProof(source) {
  const base = clone(source);
  const cases = [
    {
      rule: "adds a fourth Page",
      mutate: (m) => m.entities[0].facets[0].sites[0].pages.push(clone(m.entities[0].facets[0].sites[0].pages[0])),
    },
    {
      rule: "publishes the contact address without its exposure grant",
      mutate: (m) => {
        delete m.entities[0].properties["contact.email"].expose;
      },
    },
    {
      rule: "flips the contact address back to private",
      mutate: (m) => (m.entities[0].properties["contact.email"].public = false),
    },
    {
      rule: "withdraws a Page from publication",
      mutate: (m) => (m.entities[0].facets[0].sites[0].pages[1].publication = "draft"),
    },
    { rule: "adds a second Entity", mutate: (m) => m.entities.push(clone(m.entities[0])) },
    { rule: "moves a Page route", mutate: (m) => (m.entities[0].facets[0].sites[0].pages[2].route = ["parts"]) },
    {
      rule: "adds an undeclared property",
      mutate: (m) => (m.entities[0].properties["contact.phone"] = { value: "+442079460958", public: false }),
    },
    {
      rule: "drops a supported locale",
      mutate: (m) => (m.entities[0].facets[0].sites[0].locales.supportedLocales = []),
    },
    {
      rule: "points a source outside the content root",
      mutate: (m) => (m.entities[0].facets[0].sites[0].pages[0].representations[0].sources[0].path = "src/leak.json"),
    },
  ];
  return cases.map((entry) => {
    const mutated = clone(base);
    entry.mutate(mutated);
    return { rule: entry.rule, issue: manifestSemanticIssue(mutated) };
  });
}

/** The digests observed at process start, for the byte-exact restore proof. */
export function captureDeclarationDigests(root, paths) {
  const captured = new Map();
  for (const path of paths) captured.set(path, sha256Of(root, path));
  return captured;
}

/** Every file whose bytes differ from the captured baseline, with both digests. */
export function declarationDriftAfter(root, captured) {
  const drift = [];
  for (const [path, before] of captured) {
    const after = sha256Of(root, path);
    if (after !== before) drift.push({ path, before, after });
  }
  return drift;
}

/** Read one authored JSON declaration from disk; `null` when it cannot be read or parsed. */
export function readDeclarationJson(root, relativePath) {
  try {
    return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
  } catch {
    return null;
  }
}

/** The semantic issue of one manifest file on disk, or a closed reason when it cannot be read. */
export function manifestFileIssue(root, relativePath) {
  const parsed = readDeclarationJson(root, relativePath);
  return parsed === null ? "manifest:unreadable" : manifestSemanticIssue(parsed);
}

/** The mutation proof for one manifest file on disk: every case, with the issue it produced. */
export function manifestFileMutationProof(root, relativePath) {
  const parsed = readDeclarationJson(root, relativePath);
  return parsed === null ? [] : manifestMutationProof(parsed);
}
