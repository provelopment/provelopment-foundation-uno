import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  UNO_COMMITTED_BASE_INPUT_KEYS,
  UNO_COMMITTED_BASE_INPUT_KEYS_V2,
  UNO_COMMITTED_BASE_REFUSAL_REASONS,
  resolveUnoCommittedBase,
  type UnoCommittedBaseRefusal,
  type UnoCommittedBaseResult,
} from "../../src/application/resolve-uno-committed-base";

/**
 * U03 committed canonical-base reader tests (`UNO-WO-027 / R02`).
 *
 * The committed declaration and manifest are read once as *data*; the reader never touches the filesystem.
 * Every refusal asserts one exact closed code, so a reader that supplied a domain, defaulted a base or
 * echoed an authored value could not pass. The committed declaration states no base, and that must be
 * reported as `committed-base:missing` rather than repaired.
 */

const REPO_ROOT = new URL("../../", import.meta.url);
const CONFIG_URL = new URL("deployment/uno.config.json", REPO_ROOT);
const MANIFEST_URL = new URL("deployment/efs/manifest.json", REPO_ROOT);

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

const readSelection = (): Record<string, unknown> =>
  JSON.parse(readFileSync(CONFIG_URL, "utf8")) as Record<string, unknown>;
const readManifest = (): unknown => JSON.parse(readFileSync(MANIFEST_URL, "utf8"));

/** A minimal valid manifest with one Entity, one Facet and one Site. */
function manifest(facetId = "foundation", siteId = "main"): Record<string, unknown> {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: facetId,
            sites: [
              {
                id: siteId,
                pages: [
                  {
                    id: "home",
                    route: ["home"],
                    representations: [
                      {
                        locale: "en-001",
                        sources: [{ kind: "markdown", path: "deployment/efs/content/home.en-001.md" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** A valid declaration for the committed identifiers, optionally carrying a declared base. */
function selection(base?: unknown): Record<string, unknown> {
  const declared: Record<string, unknown> = {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
  };
  if (base !== undefined) declared["base"] = base;
  return declared;
}

function expectRefused(result: UnoCommittedBaseResult, code: UnoCommittedBaseRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(UNO_COMMITTED_BASE_REFUSAL_REASONS).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

describe("the committed declaration", () => {
  it("accepts the reserved sample canonical with no aliases", () => {
    const result = resolveUnoCommittedBase({ manifest: readManifest(), selection: readSelection() });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result).sort()).toEqual(["accepted", "base", "site"]);
    expect(result.base.canonical).toBe("https://uno-starter.example");
    expect(result.base.aliases).toEqual([]);
    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
  });

  it("still reports a missing base on a synthetic base-free declaration", () => {
    // A separate synthetic fixture: the reader refuses a declaration with no base and never supplies a domain.
    const result = resolveUnoCommittedBase({ manifest: manifest(), selection: selection() });
    expectRefused(result, "committed-base:missing");
    expect(JSON.stringify(result).includes("https://")).toBe(false);
  });

  it("does not read the committed files itself", () => {
    // The reader is pure: an empty manifest refuses on selection, and the committed files are untouched.
    const before = readFileSync(CONFIG_URL, "utf8");
    expectRefused(
      resolveUnoCommittedBase({ manifest: {}, selection: readSelection() }),
      "committed-base:selection-invalid",
    );
    expect(readFileSync(CONFIG_URL, "utf8")).toBe(before);
  });
});

describe("a declared base through the selection validator", () => {
  it("returns the accepted root base with the selected Site", () => {
    const result = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "https://example.org", aliases: [] }),
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(result.base).toEqual({ canonical: "https://example.org", aliases: [] });
    expect(Object.keys(result).sort()).toEqual(["accepted", "base", "site"]);
    expect(Object.keys(result.base)).toEqual(["canonical", "aliases"]);
  });

  it("returns a sub-path base and its aliases in declared order", () => {
    const aliases = ["https://alias.example.net", "https://other.example.net"];
    const result = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "https://example.org/site", aliases }),
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.base.canonical).toBe("https://example.org/site");
    expect(result.base.aliases).toEqual(aliases);
    expect(result.base.aliases).not.toBe(aliases);
  });

  it("returns a loopback base unchanged", () => {
    const result = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "http://localhost:3000/site", aliases: [] }),
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.base.canonical).toBe("http://localhost:3000/site");
  });

  it("maps a policy-refused base to committed-base:invalid", () => {
    for (const base of [
      { canonical: "ftp://example.org", aliases: [] },
      { canonical: "https://example.org/?q=1", aliases: [] },
      { canonical: "https://example.org", aliases: ["https://example.org"] },
      { canonical: "https://example.org/site", aliases: ["https://example.org"] },
      { canonical: "https://example.org", aliases: [], extra: true },
    ]) {
      expectRefused(
        resolveUnoCommittedBase({ manifest: manifest(), selection: selection(base) }),
        "committed-base:invalid",
      );
    }
  });

  it("maps an unreadable declaration to committed-base:unreadable", () => {
    const hostileSelection = Object.create({}) as Record<string, unknown>;
    hostileSelection["version"] = 1;
    hostileSelection["entityId"] = ENTITY_ID;
    hostileSelection["selectedSite"] = { facetId: "foundation", siteId: "main" };
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest(), selection: hostileSelection }),
      "committed-base:unreadable",
    );
  });

  it("maps every other selection failure to committed-base:selection-invalid", () => {
    for (const declared of [
      { ...selection(), version: 2 },
      { ...selection(), entityId: "e_otherentityotherentity00000001" },
      { ...selection(), selectedSite: { facetId: "foundation", siteId: "absent" } },
      { ...selection(), extra: 1 },
    ]) {
      expectRefused(
        resolveUnoCommittedBase({ manifest: manifest("foundation", "main"), selection: declared }),
        "committed-base:selection-invalid",
      );
    }
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest("other", "main"), selection: selection() }),
      "committed-base:selection-invalid",
    );
    expectRefused(
      resolveUnoCommittedBase({ manifest: {}, selection: selection() }),
      "committed-base:selection-invalid",
    );
  });
});


describe("request shape and hostile input", () => {
  it("refuses a request that is not exactly the two declared keys", () => {
    for (const value of [null, undefined, [], 0, "", true]) {
      expectRefused(resolveUnoCommittedBase(value), "committed-base:input-invalid");
    }
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest(), selection: selection(), base: {} }),
      "committed-base:input-invalid",
    );
    expectRefused(resolveUnoCommittedBase({ manifest: manifest() }), "committed-base:input-invalid");
    expectRefused(resolveUnoCommittedBase({ selection: selection() }), "committed-base:input-invalid");
    expectRefused(
      resolveUnoCommittedBase({ manifest: "deployment/efs/manifest.json", selection: selection() }),
      "committed-base:input-invalid",
    );
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest(), selection: "deployment/uno.config.json" }),
      "committed-base:input-invalid",
    );
  });

  it("refuses an accessor, symbol or exotic request without invoking anything", () => {
    let reads = 0;
    expectRefused(
      resolveUnoCommittedBase({
        manifest: manifest(),
        get selection(): unknown {
          reads += 1;
          return selection({ canonical: "https://example.org", aliases: [] });
        },
      }),
      "committed-base:input-invalid",
    );
    expect(reads).toBe(0);

    const withSymbol = { manifest: manifest(), selection: selection() } as Record<PropertyKey, unknown>;
    withSymbol[Symbol("extra")] = true;
    expectRefused(resolveUnoCommittedBase(withSymbol), "committed-base:input-invalid");

    class ExoticRequest {
      manifest = manifest();
      selection = selection();
    }
    expectRefused(resolveUnoCommittedBase(new ExoticRequest()), "committed-base:input-invalid");
  });

  it("refuses a throwing proxy as a bounded unreadable refusal", () => {
    expectRefused(
      resolveUnoCommittedBase(
        new Proxy(
          {},
          {
            ownKeys(): string[] {
              throw new Error("hostile");
            },
          },
        ),
      ),
      "committed-base:unreadable",
    );
  });

  it("returns a fresh frozen answer and never mutates the caller's data", () => {
    const declared = { canonical: "https://example.org/site", aliases: ["https://alias.example.net"] };
    const manifestInput = manifest();
    const selectionInput = selection(declared);
    const snapshot = JSON.stringify({ manifest: manifestInput, selection: selectionInput });

    const first = resolveUnoCommittedBase({ manifest: manifestInput, selection: selectionInput });
    const second = resolveUnoCommittedBase({ manifest: manifestInput, selection: selectionInput });
    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;

    expect(first).not.toBe(second);
    expect(first.site).not.toBe(second.site);
    expect(first.base).not.toBe(second.base);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.site)).toBe(true);
    expect(Object.isFrozen(first.base)).toBe(true);
    expect(Object.isFrozen(first.base.aliases)).toBe(true);
    expect(JSON.stringify({ manifest: manifestInput, selection: selectionInput })).toBe(snapshot);
  });

  it("keeps one closed vocabulary and echoes nothing when refusing", () => {
    expect(UNO_COMMITTED_BASE_REFUSAL_REASONS).toHaveLength(5);
    expect(new Set(UNO_COMMITTED_BASE_REFUSAL_REASONS).size).toBe(5);
    expect(Object.isFrozen(UNO_COMMITTED_BASE_REFUSAL_REASONS)).toBe(true);
    expect(UNO_COMMITTED_BASE_INPUT_KEYS).toEqual(["manifest", "selection"]);
    expect(Object.isFrozen(UNO_COMMITTED_BASE_INPUT_KEYS)).toBe(true);

    const rejected = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "https://secret-host.example/secret-path?q=1", aliases: [] }),
    });
    expectRefused(rejected, "committed-base:invalid");
    expect(JSON.stringify(rejected)).toBe('{"accepted":false,"reason":"committed-base:invalid"}');
    expect(JSON.stringify(rejected).includes("secret-path")).toBe(false);
    expect(JSON.stringify(rejected).includes("secret-host")).toBe(false);
  });
});

/**
 * T06 — `UNO-WO-086 / R01` (M10): Site-qualified committed base.
 *
 * One synthetic Entity, three bound Sites: `corporate/main` at the root of `https://abc.example`,
 * `corporate/docs` beneath `/docs` on the same origin, and `services/main` on `https://xyz.example`. Every declared
 * source path is unique across the manifest. The two Sites named `main` differ only by Facet, which is exactly the
 * distinction a `siteId`-only reader would lose. All hosts here are synthetic fixtures.
 */
function t06Page(id: string, route: readonly string[], locales: readonly string[], slug: string) {
  return {
    id,
    route: [...route],
    representations: locales.map((locale) => ({
      locale,
      sources: [{ kind: "markdown", path: `deployment/efs/content/${slug}.${locale}.md` }],
    })),
  };
}

const T06_DOC_ALIASES = ["https://abc.example/docs-old"];

function t06Manifest(): Record<string, unknown> {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: "corporate",
            sites: [
              {
                id: "main",
                locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
                pages: [
                  t06Page("home", ["home"], ["en-001"], "corp-main-home"),
                  t06Page("about", ["about"], ["en-001"], "corp-main-about"),
                ],
              },
              {
                id: "docs",
                locales: { supportedLocales: ["de-DE"], defaultLocale: "de-DE" },
                pages: [
                  t06Page("home", ["home"], ["de-DE"], "corp-docs-home"),
                  t06Page("guide", ["guide"], ["de-DE"], "corp-docs-guide"),
                ],
              },
            ],
          },
          {
            id: "services",
            sites: [
              {
                id: "main",
                locales: { supportedLocales: ["fr-FR"], defaultLocale: "fr-FR" },
                pages: [
                  t06Page("home", ["home"], ["fr-FR"], "svc-main-home"),
                  t06Page("offers", ["offers"], ["fr-FR"], "svc-main-offers"),
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function t06Address(withDefault = false): Record<string, unknown> {
  return {
    version: 2,
    entityId: ENTITY_ID,
    sites: [
      { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
      {
        facetId: "corporate",
        siteId: "docs",
        origin: "https://abc.example",
        pathPrefix: "/docs/",
        aliases: ["https://abc.example/docs-old"],
      },
      { facetId: "services", siteId: "main", origin: "https://xyz.example" },
    ],
    ...(withDefault ? { default: { facetId: "corporate", siteId: "main" } } : {}),
  };
}

const T06_MAIN = { facetId: "corporate", siteId: "main" } as const;
const T06_DOCS = { facetId: "corporate", siteId: "docs" } as const;
const T06_SERVICES = { facetId: "services", siteId: "main" } as const;

describe("a qualified Site's committed base (v2)", () => {
  it("resolves each of three Sites to its own declared canonical base", () => {
    const main = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_MAIN });
    const docs = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_DOCS });
    const services = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_SERVICES });

    expect(main.accepted && docs.accepted && services.accepted).toBe(true);
    if (!main.accepted || !docs.accepted || !services.accepted) return;

    expect(main.base.canonical).toBe("https://abc.example");
    expect(docs.base.canonical).toBe("https://abc.example/docs");
    expect(services.base.canonical).toBe("https://xyz.example");
    expect(main.site).toEqual({ entityId: ENTITY_ID, facetId: "corporate", siteId: "main" });
    expect(docs.site).toEqual({ entityId: ENTITY_ID, facetId: "corporate", siteId: "docs" });
    expect(services.site).toEqual({ entityId: ENTITY_ID, facetId: "services", siteId: "main" });
  });

  it("keeps two Sites named main distinct because their Facets differ", () => {
    const corporate = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_MAIN });
    const services = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_SERVICES });
    expect(corporate.accepted && services.accepted).toBe(true);
    if (!corporate.accepted || !services.accepted) return;

    expect(corporate.site.siteId).toBe(services.site.siteId);
    expect(corporate.site.facetId).not.toBe(services.site.facetId);
    expect(corporate.base.canonical).not.toBe(services.base.canonical);
  });

  it("preserves a declared /docs prefix without a trailing slash", () => {
    const docs = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_DOCS });
    expect(docs.accepted).toBe(true);
    if (!docs.accepted) return;
    expect(docs.base.canonical).toBe("https://abc.example/docs");
    expect(docs.base.canonical.endsWith("/")).toBe(false);
  });

  it("takes canonical and aliases only from the requested binding", () => {
    const main = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_MAIN });
    const docs = resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: T06_DOCS });
    expect(main.accepted && docs.accepted).toBe(true);
    if (!main.accepted || !docs.accepted) return;

    // The docs alias belongs to docs alone and is never offered to the root Site.
    expect(main.base.aliases).toEqual([]);
    expect(docs.base.aliases).toEqual(T06_DOC_ALIASES);
    expect(docs.base.aliases).not.toBe(T06_DOC_ALIASES);
  });

  it("does not change a Site's answer when a default names another Site", () => {
    const withoutDefault = resolveUnoCommittedBase({
      manifest: t06Manifest(),
      selection: t06Address(),
      site: T06_SERVICES,
    });
    const withDefault = resolveUnoCommittedBase({
      manifest: t06Manifest(),
      selection: t06Address(true),
      site: T06_SERVICES,
    });
    expect(withDefault).toEqual(withoutDefault);
    expect(withDefault.accepted).toBe(true);
  });

  it("refuses a wrong Site or Facet pair with no fallback base", () => {
    expectRefused(
      resolveUnoCommittedBase({
        manifest: t06Manifest(),
        selection: t06Address(),
        site: { facetId: "services", siteId: "docs" },
      }),
      "committed-base:selection-invalid",
    );
    expectRefused(
      resolveUnoCommittedBase({
        manifest: t06Manifest(),
        selection: t06Address(),
        site: { facetId: "corporate", siteId: "archive" },
      }),
      "committed-base:selection-invalid",
    );
    // A v1 declaration is not an address declaration, so a v2 request cannot publish a base from it.
    expectRefused(
      resolveUnoCommittedBase({ manifest: t06Manifest(), selection: readSelection(), site: T06_MAIN }),
      "committed-base:selection-invalid",
    );
  });

  it("refuses hostile, malformed and unknown-field v2 requests", () => {
    let invoked = 0;
    expectRefused(
      resolveUnoCommittedBase({
        manifest: t06Manifest(),
        selection: t06Address(),
        site: T06_MAIN,
        get extra(): unknown {
          invoked += 1;
          return "x";
        },
      }),
      "committed-base:input-invalid",
    );
    expect(invoked).toBe(0);

    for (const site of [
      { siteId: "main" },
      { facetId: "corporate" },
      { facetId: "corporate", siteId: "main", extra: true },
      { facetId: "", siteId: "main" },
      { facetId: 1, siteId: "main" },
      "corporate/main",
      [],
      null,
    ]) {
      expectRefused(
        resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site }),
        "committed-base:input-invalid",
      );
    }

    const symbolKeyed = { ...T06_MAIN } as Record<PropertyKey, unknown>;
    symbolKeyed[Symbol("facet")] = "services";
    expectRefused(
      resolveUnoCommittedBase({ manifest: t06Manifest(), selection: t06Address(), site: symbolKeyed }),
      "committed-base:input-invalid",
    );

    expectRefused(
      resolveUnoCommittedBase({ manifest: t06Manifest(), site: T06_MAIN }),
      "committed-base:input-invalid",
    );
  });

  it("returns frozen, deterministic answers and a refusal with no partial base", () => {
    const manifest = t06Manifest();
    const selection = t06Address();
    const snapshot = JSON.stringify({ manifest, selection });

    const first = resolveUnoCommittedBase({ manifest, selection, site: T06_DOCS });
    const second = resolveUnoCommittedBase({ manifest, selection, site: T06_DOCS });
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.accepted).toBe(true);
    if (first.accepted && second.accepted) {
      expect(first.base).not.toBe(second.base);
      expect(first.base.aliases).not.toBe(second.base.aliases);
      expect(Object.isFrozen(first)).toBe(true);
      expect(Object.isFrozen(first.site)).toBe(true);
      expect(Object.isFrozen(first.base)).toBe(true);
      expect(Object.isFrozen(first.base.aliases)).toBe(true);
    }
    expect(JSON.stringify({ manifest, selection })).toBe(snapshot);

    const refused = resolveUnoCommittedBase({ manifest, selection, site: { facetId: "corporate", siteId: "nope" } });
    expect(Object.keys(refused).sort()).toEqual(["accepted", "reason"]);
    expect(JSON.stringify(refused)).toBe('{"accepted":false,"reason":"committed-base:selection-invalid"}');
    expect(UNO_COMMITTED_BASE_INPUT_KEYS_V2).toEqual(["manifest", "selection", "site"]);
    expect(Object.isFrozen(UNO_COMMITTED_BASE_INPUT_KEYS_V2)).toBe(true);
  });
});
