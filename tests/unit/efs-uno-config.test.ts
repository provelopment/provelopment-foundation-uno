import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CONFIG_REFUSAL_REASONS, UNO_SITE_ADDRESS_CONFIG_VERSION, validateUnoSiteAddressConfig, validateUnoSiteSelection, type UnoConfigRefusal } from "../../src/core/efs/uno-config";
import { validateUnoManifestGraph } from "../../src/core/efs/manifest-graph";

/**
 * U02 selected-Site tests (`UNO-WO-018 / R01`).
 *
 * The committed declaration and the committed manifest are read once as *data*; the validator under
 * test never touches the filesystem. Every refusal asserts the specific closed code, so a validator
 * that defaulted to the first Site, or accepted any config, could not pass.
 */

const REPO_ROOT = new URL("../../", import.meta.url);
const CONFIG_URL = new URL("deployment/uno.config.json", REPO_ROOT);
const MANIFEST_URL = new URL("deployment/efs/manifest.json", REPO_ROOT);

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

const readConfig = (): unknown => JSON.parse(readFileSync(CONFIG_URL, "utf8"));
const readManifest = (): unknown => JSON.parse(readFileSync(MANIFEST_URL, "utf8"));

/** A minimal valid manifest with one Entity, one Facet and one Site. */
function manifest(facetId = "foundation", siteId = "main"): unknown {
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
                        sources: [
                          { kind: "markdown", path: "deployment/efs/content/home.en-001.md" },
                        ],
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

/** A valid declaration for the committed identifiers. */
function config(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
    ...overrides,
  };
}

function expectRefused(
  input: unknown,
  reason: UnoConfigRefusal,
  manifestInput: unknown = manifest(),
): void {
  const result = validateUnoSiteSelection(input, manifestInput);
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(CONFIG_REFUSAL_REASONS).toContain(result.reason);
}

describe("the committed declaration", () => {
  it("accepts the committed config against the committed manifest", () => {
    const result = validateUnoSiteSelection(readConfig(), readManifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.version).toBe(1);
    expect(result.config.entityId).toBe(ENTITY_ID);
    expect(result.config.selectedSite).toEqual({ facetId: "foundation", siteId: "main" });
  });

  it("keeps the Entity property the manifest declares", () => {
    const graph = validateUnoManifestGraph(readManifest());
    expect(graph.accepted).toBe(true);
    if (!graph.accepted) return;
    const entity = graph.graph.entities[0];
    expect(entity?.properties?.["brand.name"]).toEqual({ value: "Foundation Uno", public: false });
  });

  it("returns a deeply frozen, freshly owned selection", () => {
    const input = config();
    const result = validateUnoSiteSelection(input, manifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.isFrozen(result.config)).toBe(true);
    expect(Object.isFrozen(result.config.selectedSite)).toBe(true);
    expect(result.config.selectedSite).not.toBe(input.selectedSite);
    expect(input.selectedSite).toEqual({ facetId: "foundation", siteId: "main" });
  });

  it("selects a Site that is not the first array element", () => {
    const homePage = {
      id: "home",
      route: ["home"],
      representations: [
        {
          locale: "en-001",
          sources: [{ kind: "markdown", path: "deployment/efs/content/home.en-001.md" }],
        },
      ],
    };
    const studioPage = {
      id: "studio-home",
      route: ["studio-home"],
      representations: [
        {
          locale: "en-001",
          sources: [{ kind: "markdown", path: "deployment/efs/content/studio-home.en-001.md" }],
        },
      ],
    };
    const twoFacets = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            { id: "foundation", sites: [{ id: "main", pages: [homePage] }] },
            { id: "studio", sites: [{ id: "preview", pages: [studioPage] }] },
          ],
        },
      ],
    };
    const result = validateUnoSiteSelection(config(), twoFacets);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.selectedSite).toEqual({ facetId: "foundation", siteId: "main" });
  });
});


describe("declaration shape and authority refusals", () => {
  it("refuses a declaration that is not a plain object", () => {
    expectRefused("config", "config:invalid-shape");
    expectRefused([], "config:invalid-shape");
    expectRefused(null, "config:invalid-shape");
  });

  it("refuses a missing required field", () => {
    expectRefused(
      { version: 1, selectedSite: { facetId: "foundation", siteId: "main" } },
      "config:missing-field",
    );
  });

  it("refuses every unauthorized publication-authority field", () => {
    for (const field of [
      "publication",
      "host",
      "basePath",
      "bindings",
      "spokeId",
      "release",
      "canonical",
      "analytics",
    ]) {
      expectRefused({ ...config(), [field]: true }, "config:unknown-field");
    }
  });

  it("refuses an extra field inside selectedSite", () => {
    expectRefused(
      { ...config(), selectedSite: { facetId: "foundation", siteId: "main", host: "x.invalid" } },
      "config:unknown-field",
    );
  });

  it("refuses a missing field inside selectedSite", () => {
    expectRefused({ ...config(), selectedSite: { facetId: "foundation" } }, "config:missing-field");
    expectRefused({ ...config(), selectedSite: { siteId: "main" } }, "config:missing-field");
  });

  it("refuses a wrong or non-integer version", () => {
    expectRefused({ ...config(), version: 2 }, "config:version");
    expectRefused({ ...config(), version: 1.5 }, "config:version");
    expectRefused({ ...config(), version: "1" }, "config:version");
  });

  it("refuses a malformed entity identifier", () => {
    expectRefused(
      { ...config(), entityId: "e_7A3KNKX60EACYHCA7A0CR1K6E1" },
      "config:invalid-entity",
    );
    expectRefused(
      { ...config(), entityId: "b_7a3knkx60eacyhca7a0cr1k6e1" },
      "config:invalid-entity",
    );
  });

  it("refuses a malformed Facet or Site identifier", () => {
    expectRefused(
      { ...config(), selectedSite: { facetId: "Foundation", siteId: "main" } },
      "config:invalid-site",
    );
    expectRefused(
      { ...config(), selectedSite: { facetId: "foundation", siteId: "Main Site" } },
      "config:invalid-site",
    );
  });

  it("refuses any invalid manifest before considering a Site", () => {
    expectRefused(config(), "config:manifest-invalid", { entities: [] });
    expectRefused(config(), "config:manifest-invalid", "not-a-manifest");
    expectRefused(config(), "config:manifest-invalid", null);
  });

  it("refuses a two-Entity manifest", () => {
    const twoEntities = JSON.parse(JSON.stringify(manifest())) as {
      entities: Record<string, unknown>[];
    };
    const first = twoEntities.entities[0];
    expect(first).toBeDefined();
    if (first === undefined) return;
    twoEntities.entities.push({ ...first, id: "e_00000000000000000000000000" });
    expectRefused(config(), "config:manifest-invalid", twoEntities);
  });

  it("refuses a declaration that names a different Entity", () => {
    const other = JSON.parse(JSON.stringify(manifest())) as { entities: { id: string }[] };
    const entity = other.entities[0];
    expect(entity).toBeDefined();
    if (entity === undefined) return;
    entity.id = "e_00000000000000000000000000";
    expectRefused(config(), "config:entity-mismatch", other);
  });

  it("refuses an unknown Facet", () => {
    expectRefused(
      { ...config(), selectedSite: { facetId: "studio", siteId: "main" } },
      "config:facet-not-found",
    );
  });

  it("refuses an unknown Site without falling back to the first Site", () => {
    expectRefused(
      { ...config(), selectedSite: { facetId: "foundation", siteId: "preview" } },
      "config:site-not-found",
    );
  });
});

/** One authored page declaration for a synthetic manifest. */
function page(id: string, route: string, file: string): unknown {
  return {
    id,
    route: [route],
    representations: [
      {
        locale: "en-001",
        sources: [{ kind: "markdown", path: `deployment/efs/content/${file}` }],
      },
    ],
  };
}

/** Two Facets whose Sites are distinct. */
function twoFacetManifest(): unknown {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          { id: "foundation", sites: [{ id: "main", pages: [page("home", "home", "home.en-001.md")] }] },
          {
            id: "studio",
            sites: [{ id: "preview", pages: [page("studio-home", "studio-home", "studio-home.en-001.md")] }],
          },
        ],
      },
    ],
  };
}

describe("Site ownership and hostile input", () => {
  it("refuses a Site that exists only under another Facet", () => {
    expectRefused(
      { ...config(), selectedSite: { facetId: "foundation", siteId: "preview" } },
      "config:site-not-found",
      twoFacetManifest(),
    );
  });

  it("refuses an ambiguous Site id owned by two Facets", () => {
    const ambiguous = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            { id: "foundation", sites: [{ id: "main", pages: [page("home", "home", "home.en-001.md")] }] },
            {
              id: "studio",
              sites: [{ id: "main", pages: [page("studio-home", "studio-home", "studio-home.en-001.md")] }],
            },
          ],
        },
      ],
    };
    expectRefused(config(), "config:ambiguous-site", ambiguous);
  });

  it("refuses an accessor without ever invoking it", () => {
    let reads = 0;
    const hostile = {
      version: 1,
      entityId: ENTITY_ID,
      get selectedSite(): never {
        reads += 1;
        throw new Error("must not run");
      },
    };
    expectRefused(hostile, "config:unreadable");
    expect(reads).toBe(0);
  });

  it("refuses a symbol-keyed declaration", () => {
    const hostile: Record<PropertyKey, unknown> = config();
    hostile[Symbol("bindings")] = { host: "x.invalid" };
    expectRefused(hostile, "config:unreadable");
  });

  it("refuses a declaration with a non-plain prototype", () => {
    class Declaration {
      version = 1;
      entityId = ENTITY_ID;
      selectedSite = { facetId: "foundation", siteId: "main" };
    }
    expectRefused(new Declaration(), "config:unreadable");
  });

  it("refuses a Proxy whose own-key trap throws", () => {
    const hostile = new Proxy(config(), {
      ownKeys(): string[] {
        throw new Error("hostile");
      },
    });
    expectRefused(hostile, "config:unreadable");
  });

  it("never exposes a partial selection on refusal", () => {
    const result = validateUnoSiteSelection(
      { ...config(), selectedSite: { facetId: "foundation", siteId: "preview" } },
      manifest(),
    );
    expect(result.accepted).toBe(false);
    expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
    expect(JSON.stringify(result)).not.toContain("preview");
  });
});

describe("explicit short-language mapping (`UNO-WO-025 / R01`)", () => {
  /** The shared minimal manifest, with one declared Site locale policy injected. */
  function manifestWith(locales: unknown): unknown {
    const base = manifest() as {
      entities: { facets: { sites: Record<string, unknown>[] }[] }[];
    };
    base.entities[0]!.facets[0]!.sites[0]!.locales = locales;
    return base;
  }

  const LOCALES_EN = { supportedLocales: ["en-001"], defaultLocale: "en-001" };

  it("reads the committed mapping as an explicit, frozen declaration", () => {
    const result = validateUnoSiteSelection(readConfig(), readManifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect({ ...result.config.languagePreferences }).toEqual({ en: "en-001" });
    expect(Object.isFrozen(result.config.languagePreferences)).toBe(true);
    expect(result.config.version).toBe(1);
    expect(result.config.selectedSite).toEqual({ facetId: "foundation", siteId: "main" });
  });

  it("keeps a legacy declaration without a mapping valid and mapping-free", () => {
    const result = validateUnoSiteSelection(config(), manifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result.config)).toEqual(["version", "entityId", "selectedSite"]);
  });

  it("accepts an explicit empty mapping and a valid explicit alias", () => {
    const empty = validateUnoSiteSelection({ ...config(), languagePreferences: {} }, manifestWith(LOCALES_EN));
    expect(empty.accepted).toBe(true);
    if (!empty.accepted) return;
    expect(Object.keys(empty.config.languagePreferences ?? {})).toEqual([]);

    const aliased = validateUnoSiteSelection(
      { ...config(), languagePreferences: { en: "en-001" } },
      manifestWith(LOCALES_EN),
    );
    expect(aliased.accepted).toBe(true);
    if (!aliased.accepted) return;
    expect({ ...aliased.config.languagePreferences }).toEqual({ en: "en-001" });
  });

  it("refuses a mapping the declared Site locales cannot satisfy", () => {
    const declared = { supportedLocales: ["en-001", "de-DE"], defaultLocale: "en-001" };
    expectRefused(
      { ...config(), languagePreferences: { en: "de-DE" } },
      "config:invalid-language-preferences",
      manifestWith(declared),
    );
    expectRefused(
      { ...config(), languagePreferences: { fr: "fr-001" } },
      "config:invalid-language-preferences",
      manifestWith(declared),
    );
    expectRefused(
      { ...config(), languagePreferences: { en: "EN-001" } },
      "config:invalid-language-preferences",
      manifestWith(declared),
    );
    expectRefused(
      { ...config(), languagePreferences: { EN: "en-001" } },
      "config:invalid-language-preferences",
      manifestWith(declared),
    );
    expectRefused(
      { ...config(), languagePreferences: JSON.parse('{"__proto__": "en-001"}') },
      "config:invalid-language-preferences",
      manifestWith(declared),
    );
    expectRefused(
      { ...config(), languagePreferences: ["en-001"] },
      "config:invalid-language-preferences",
      manifestWith(declared),
    );
  });

  it("refuses a mapping longer than the declared bound", () => {
    const many: Record<string, string> = {};
    for (let index = 0; index < 17; index += 1) many[`a${String.fromCharCode(97 + index)}`] = "en-001";
    expectRefused(
      { ...config(), languagePreferences: many },
      "config:invalid-language-preferences",
      manifestWith(LOCALES_EN),
    );
  });

  it("refuses a mapping with no declared Site locale authority to check it against", () => {
    expectRefused(
      { ...config(), languagePreferences: { en: "en-001" } },
      "config:locale-authority-missing",
      manifest(),
    );
  });

  it("refuses a mapping accessor without invoking it, and still refuses unknown config keys", () => {
    let reads = 0;
    const hostile = {
      get en(): string {
        reads += 1;
        return "en-001";
      },
    };
    expectRefused(
      { ...config(), languagePreferences: hostile },
      "config:unreadable",
      manifestWith(LOCALES_EN),
    );
    expect(reads).toBe(0);

    expectRefused(
      { ...config(), schemaVersion: 1, languagePreferences: { en: "en-001" } },
      "config:unknown-field",
      manifestWith(LOCALES_EN),
    );
  });
});

describe("the optional declared canonical base", () => {
  /** The eight aliases a declaration may carry, all distinct and none overlapping the canonical base. */
  function eightAliases(): string[] {
    return Array.from({ length: 8 }, (_unused, index) => `https://alias${index + 1}.example.net`);
  }

  it("keeps an absent base absent instead of defaulting one", () => {
    const result = validateUnoSiteSelection(config(), manifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.prototype.hasOwnProperty.call(result.config, "base")).toBe(false);
    expect(Object.keys(result.config).sort()).toEqual(["entityId", "selectedSite", "version"]);
  });

  it("accepts a root base and returns the declaration's own string form", () => {
    const result = validateUnoSiteSelection(
      { ...config(), base: { canonical: "https://example.org", aliases: [] } },
      manifest(),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.base).toEqual({ canonical: "https://example.org", aliases: [] });
    expect(Object.keys(result.config.base as object)).toEqual(["canonical", "aliases"]);
  });

  it("accepts one validated path-prefix base and an explicit loopback base", () => {
    for (const canonical of ["https://example.org/site", "http://localhost:3000/site"]) {
      const result = validateUnoSiteSelection({ ...config(), base: { canonical, aliases: [] } }, manifest());
      expect(result.accepted).toBe(true);
      if (!result.accepted) continue;
      expect(result.config.base?.canonical).toBe(canonical);
    }
  });

  it("accepts eight aliases in declared order and refuses a ninth", () => {
    const aliases = eightAliases();
    const accepted = validateUnoSiteSelection(
      { ...config(), base: { canonical: "https://example.org", aliases } },
      manifest(),
    );
    expect(accepted.accepted).toBe(true);
    if (!accepted.accepted) return;
    expect(accepted.config.base?.aliases).toEqual(aliases);
    expect(accepted.config.base?.aliases).not.toBe(aliases);

    expectRefused(
      {
        ...config(),
        base: { canonical: "https://example.org", aliases: [...aliases, "https://alias9.example.net"] },
      },
      "config:invalid-base",
    );
  });

  it("refuses a duplicate alias and an ancestor/descendant overlap", () => {
    expectRefused(
      {
        ...config(),
        base: { canonical: "https://example.org", aliases: ["https://a.example.net", "https://a.example.net"] },
      },
      "config:invalid-base",
    );
    expectRefused(
      { ...config(), base: { canonical: "https://example.org/site", aliases: ["https://example.org"] } },
      "config:invalid-base",
    );
  });
});


describe("the declared base under hostile and non-URL input", () => {
  it("refuses malformed bases one family at a time", () => {
    const malformed: unknown[] = [
      { canonical: "ftp://example.org", aliases: [] },
      { canonical: "https://user:pw@example.org", aliases: [] },
      { canonical: "https://example.org/?a=1", aliases: [] },
      { canonical: "https://example.org/#fragment", aliases: [] },
      { canonical: "https://example.org/a%20b", aliases: [] },
      { canonical: "https://exa_mple.org", aliases: [] },
      { canonical: "https://example.org", aliases: [], path: "/site" },
      { canonical: "https://example.org", aliases: "https://alias.example.net" },
      "https://example.org",
    ];
    for (const base of malformed) {
      expectRefused({ ...config(), base }, "config:invalid-base");
    }
  });

  it("refuses base accessors, symbols, exotic prototypes and proxies without invoking them", () => {
    let rootReads = 0;
    expectRefused(
      {
        ...config(),
        get base(): unknown {
          rootReads += 1;
          return { canonical: "https://example.org", aliases: [] };
        },
      },
      "config:unreadable",
    );
    expect(rootReads).toBe(0);

    // The canonical-base policy owns the nested reading: it reports hostile structure as its own
    // not-plain refusal, which this validator maps to one closed `config:` code. Nothing is invoked.
    let innerReads = 0;
    expectRefused(
      {
        ...config(),
        base: {
          get canonical(): string {
            innerReads += 1;
            return "https://example.org";
          },
          aliases: [],
        },
      },
      "config:invalid-base",
    );
    expect(innerReads).toBe(0);

    const withSymbol = { canonical: "https://example.org", aliases: [] } as Record<PropertyKey, unknown>;
    withSymbol[Symbol("extra")] = true;
    expectRefused({ ...config(), base: withSymbol }, "config:invalid-base");

    class ExoticBase {
      canonical = "https://example.org";
      aliases: string[] = [];
    }
    expectRefused({ ...config(), base: new ExoticBase() }, "config:invalid-base");

    // A trap that throws a plain error is not hostile *structure*: it surfaces as the policy's own
    // unreadable outcome, which this validator keeps as `config:unreadable`.
    expectRefused(
      {
        ...config(),
        base: new Proxy(
          {},
          {
            ownKeys(): string[] {
              throw new Error("hostile");
            },
          },
        ),
      },
      "config:unreadable",
    );
  });

  it("returns a freshly frozen base, never mutates the caller, and echoes nothing when refusing", () => {
    const base = { canonical: "https://example.org/site", aliases: ["https://alias.example.net"] };
    const input = { ...config(), base };
    const snapshot = JSON.stringify(input);

    const result = validateUnoSiteSelection(input, manifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(Object.isFrozen(result.config.base)).toBe(true);
    expect(Object.isFrozen(result.config.base?.aliases)).toBe(true);
    expect(result.config.base).not.toBe(base);
    expect(result.config.base?.aliases).not.toBe(base.aliases);
    expect(JSON.stringify(input)).toBe(snapshot);

    const refused = validateUnoSiteSelection(
      { ...config(), base: { canonical: "https://example.org/secret-path", aliases: [], extra: 1 } },
      manifest(),
    );
    expect(refused.accepted).toBe(false);
    expect(JSON.stringify(refused)).toBe('{"accepted":false,"reason":"config:invalid-base"}');
    expect(JSON.stringify(refused).includes("secret-path")).toBe(false);
  });
});

/**
 * `UNO-WO-086 / R01` (M1): the multi-Facet / multi-Site address declaration.
 *
 * Two Facets are bound to unrelated reserved `.example` domains, and the `corporate` Facet hosts a second Site on a
 * disjoint path prefix of its own domain. Every case asserts a specific closed code, so a validator that bound only one
 * Site, inferred a host, or fell back to the first entry could not pass.
 */
describe("multi-Facet / multi-Site address configuration", () => {
  const siteOf = (siteId: string, slug: string) => ({
    id: siteId,
    pages: [
      {
        id: "home",
        route: ["home"],
        representations: [
          { locale: "en-001", sources: [{ kind: "markdown", path: `deployment/efs/content/${slug}.en-001.md` }] },
        ],
      },
    ],
  });

  const twoFacetManifest = () => ({
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          { id: "corporate", sites: [siteOf("main", "corp-main"), siteOf("docs", "corp-docs")] },
          { id: "services", sites: [siteOf("main", "svc-main")] },
        ],
      },
    ],
  });

  const addressConfig = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    version: UNO_SITE_ADDRESS_CONFIG_VERSION,
    entityId: ENTITY_ID,
    sites: [
      { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
      { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
      { facetId: "services", siteId: "main", origin: "https://xyz.example" },
    ],
    default: { facetId: "corporate", siteId: "main" },
    ...overrides,
  });

  it("accepts two unrelated Facet domains plus a disjoint prefix, with every Site independently bound", () => {
    const result = validateUnoSiteAddressConfig(addressConfig(), twoFacetManifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.version).toBe(UNO_SITE_ADDRESS_CONFIG_VERSION);
    expect(result.config.sites.map((site) => `${site.facetId}/${site.siteId}`)).toEqual([
      "corporate/main",
      "corporate/docs",
      "services/main",
    ]);
    expect(result.config.sites.map((site) => `${site.origin}${site.pathPrefix}`)).toEqual([
      "https://abc.example",
      "https://abc.example/docs",
      "https://xyz.example",
    ]);
    // A declared default resolves the ambiguous entry; it must never remove another Site from the authority.
    expect(result.config.selectedSite).toEqual({ facetId: "corporate", siteId: "main" });
    expect(result.config.defaultSite).toEqual({ facetId: "corporate", siteId: "main" });
    expect(Object.isFrozen(result.config.sites)).toBe(true);
    expect(Object.isFrozen(result.config.sites[0])).toBe(true);
  });

  it("binds the only Site without any declared default", () => {
    const single = {
      version: UNO_SITE_ADDRESS_CONFIG_VERSION,
      entityId: ENTITY_ID,
      sites: [{ facetId: "foundation", siteId: "main", origin: "https://abc.example" }],
    };
    const result = validateUnoSiteAddressConfig(single, manifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.sites).toHaveLength(1);
    expect(result.config.defaultSite).toBeUndefined();
    expect(result.config.selectedSite).toEqual({ facetId: "foundation", siteId: "main" });
  });

  it("refuses an origin claimed twice with the same prefix", () => {
    const duplicated = addressConfig({
      sites: [
        { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    expect(validateUnoSiteAddressConfig(duplicated, twoFacetManifest())).toEqual({
      accepted: false,
      reason: "config:duplicate-site-address",
    });
  });

  it("refuses the same Site bound twice", () => {
    const duplicated = addressConfig({
      sites: [
        { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
        { facetId: "corporate", siteId: "main", origin: "https://other.example" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    expect(validateUnoSiteAddressConfig(duplicated, twoFacetManifest())).toEqual({
      accepted: false,
      reason: "config:duplicate-site-address",
    });
  });

  it("refuses partial authority: a declared Site left without its own address", () => {
    const partial = addressConfig({
      sites: [
        { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    expect(validateUnoSiteAddressConfig(partial, twoFacetManifest())).toEqual({
      accepted: false,
      reason: "config:incomplete-site-bindings",
    });
  });

  it("refuses a default that names no bound Site", () => {
    const badDefault = addressConfig({ default: { facetId: "corporate", siteId: "ghost" } });
    expect(validateUnoSiteAddressConfig(badDefault, twoFacetManifest())).toEqual({
      accepted: false,
      reason: "config:invalid-default",
    });
  });

  it("refuses a Site that does not exist under the named Facet", () => {
    const wrongOwner = addressConfig({
      sites: [
        { facetId: "corporate", siteId: "missing", origin: "https://abc.example" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    expect(validateUnoSiteAddressConfig(wrongOwner, twoFacetManifest())).toEqual({
      accepted: false,
      reason: "config:site-not-found",
    });
  });

  it("refuses an origin the accepted canonical policy rejects, without echoing it", () => {
    const hostile = addressConfig({
      sites: [
        { facetId: "corporate", siteId: "main", origin: "javascript:alert(1)" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    const result = validateUnoSiteAddressConfig(hostile, twoFacetManifest());
    expect(result).toEqual({ accepted: false, reason: "config:invalid-site-address" });
    expect(JSON.stringify(result).includes("javascript")).toBe(false);
  });

  it("refuses a version-1 declaration through the address entry point", () => {
    expect(validateUnoSiteAddressConfig({ ...config(), version: 1 }, manifest())).toEqual({
      accepted: false,
      reason: "config:version",
    });
  });

  it("keeps every binding whatever the declaration order, and never re-derives the default", () => {
    const reversed = addressConfig({
      sites: [
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
      ],
    });
    const result = validateUnoSiteAddressConfig(reversed, twoFacetManifest());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.sites.map((site) => `${site.facetId}/${site.siteId}`)).toEqual([
      "services/main",
      "corporate/docs",
      "corporate/main",
    ]);
    expect(result.config.selectedSite).toEqual({ facetId: "corporate", siteId: "main" });
  });
});

/**
 * `UNO-WO-092 / R01` (§4.A): the two independently found version-2 authority defects.
 *
 * The first is order-dependent address ownership: `A.alias = B.canonical` used to validate whenever A was declared
 * first, because a new canonical was compared only against older canonicals. The second is the implicit entry Site:
 * with several Sites and no authored `default`, `selectedSite` was filled with `sites[0]` and a language mapping was
 * checked against that arbitrary choice. Every case below asserts a specific closed code or an exact absence.
 */
describe("version-2 authority: address ownership and entry default", () => {
  const siteWithLocales = (siteId: string, slug: string, supportedLocales: readonly string[], defaultLocale: string) => ({
    id: siteId,
    locales: { supportedLocales: [...supportedLocales], defaultLocale },
    pages: [
      {
        id: "home",
        route: ["home"],
        representations: [
          {
            locale: supportedLocales[0],
            sources: [{ kind: "markdown", path: `deployment/efs/content/${slug}.en-001.md` }],
          },
        ],
      },
    ],
  });

  const manifestWithLocales = () => ({
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: "corporate",
            sites: [
              siteWithLocales("main", "corp-main", ["en-001"], "en-001"),
              siteWithLocales("docs", "corp-docs", ["de-DE"], "de-DE"),
            ],
          },
          { id: "services", sites: [siteWithLocales("main", "svc-main", ["en-001"], "en-001")] },
        ],
      },
    ],
  });

  const declaration = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    version: UNO_SITE_ADDRESS_CONFIG_VERSION,
    entityId: ENTITY_ID,
    sites: [
      { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
      { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
      { facetId: "services", siteId: "main", origin: "https://xyz.example" },
    ],
    ...overrides,
  });

  const duplicate = { accepted: false, reason: "config:duplicate-site-address" };

  it("refuses an alias another Site claims as canonical, whichever Site is declared first", () => {
    const aliasFirst = declaration({
      sites: [
        { facetId: "corporate", siteId: "main", origin: "https://abc.example", aliases: ["https://xyz.example"] },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    expect(validateUnoSiteAddressConfig(aliasFirst, manifestWithLocales())).toEqual(duplicate);

    // The same two addresses, opposite declaration order: the answer must not depend on `sites[]` order.
    const canonicalFirst = declaration({
      sites: [
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "corporate", siteId: "main", origin: "https://abc.example", aliases: ["https://xyz.example"] },
      ],
    });
    expect(validateUnoSiteAddressConfig(canonicalFirst, manifestWithLocales())).toEqual(duplicate);
  });

  it("refuses a canonical an earlier Site already claims as an alias", () => {
    // The alias belongs to the root Site and sits under *another* Site's canonical address, not under its own, so the
    // per-base policy accepts it and only the one shared ownership index can refuse the collision.
    const selfAliased = declaration({
      sites: [
        {
          facetId: "corporate",
          siteId: "main",
          origin: "https://abc.example",
          aliases: ["https://xyz.example/docs"],
        },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example", pathPrefix: "/docs/" },
      ],
    });
    expect(validateUnoSiteAddressConfig(selfAliased, manifestWithLocales())).toEqual(duplicate);
  });



  it("refuses two Sites that claim the same alias, in either declaration order", () => {
    const forward = declaration({
      sites: [
        { facetId: "corporate", siteId: "main", origin: "https://abc.example", aliases: ["https://alias.example"] },
        {
          facetId: "corporate",
          siteId: "docs",
          origin: "https://abc.example",
          pathPrefix: "/docs/",
          aliases: ["https://alias.example"],
        },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    expect(validateUnoSiteAddressConfig(forward, manifestWithLocales())).toEqual(duplicate);

    const reversed = declaration({
      sites: [
        {
          facetId: "corporate",
          siteId: "docs",
          origin: "https://abc.example",
          pathPrefix: "/docs/",
          aliases: ["https://alias.example"],
        },
        { facetId: "corporate", siteId: "main", origin: "https://abc.example", aliases: ["https://alias.example"] },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    expect(validateUnoSiteAddressConfig(reversed, manifestWithLocales())).toEqual(duplicate);
  });

  it("keeps disjoint legitimate prefixes and unrelated aliases valid on one shared host", () => {
    const shared = declaration({
      sites: [
        { facetId: "corporate", siteId: "main", origin: "https://abc.example", aliases: ["https://www.abc.example"] },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
    });
    const result = validateUnoSiteAddressConfig(shared, manifestWithLocales());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.sites.map((site) => `${site.origin}${site.pathPrefix}`)).toEqual([
      "https://abc.example",
      "https://abc.example/docs",
      "https://xyz.example",
    ]);
  });

  it("never promotes the first binding to an entry default, and is permutation independent", () => {
    const result = validateUnoSiteAddressConfig(declaration(), manifestWithLocales());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.config.defaultSite).toBeUndefined();
    expect(result.config.selectedSite).toBeUndefined();
    // Every Site stays active: an entry choice must not remove one from the authority.
    expect(result.config.sites).toHaveLength(3);

    const reversed = declaration({
      sites: [
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
      ],
    });
    const permuted = validateUnoSiteAddressConfig(reversed, manifestWithLocales());
    expect(permuted.accepted).toBe(true);
    if (!permuted.accepted) return;
    expect(permuted.config.selectedSite).toBeUndefined();
    const key = (value: { facetId: string; siteId: string; origin: string; pathPrefix: string }) =>
      `${value.facetId}/${value.siteId}=${value.origin}${value.pathPrefix}`;
    expect([...permuted.config.sites].map(key).sort()).toEqual([...result.config.sites].map(key).sort());
  });

  it("applies a mapping only to the Sites that own its target locale", () => {
    // `corporate/main` owns en-001 and `corporate/docs` owns de-DE, so each projection is valid for its own Site.
    const mapped = validateUnoSiteAddressConfig(
      declaration({ languagePreferences: { en: "en-001", de: "de-DE" } }),
      manifestWithLocales(),
    );
    expect(mapped.accepted).toBe(true);
    if (!mapped.accepted) return;
    expect(mapped.config.languagePreferences).toEqual({ de: "de-DE", en: "en-001" });

    // A target no bound Site authors refuses instead of being validated against an arbitrary first Site.
    const unowned = validateUnoSiteAddressConfig(
      declaration({ languagePreferences: { fr: "fr-001" } }),
      manifestWithLocales(),
    );
    expect(unowned).toEqual({ accepted: false, reason: "config:invalid-language-preferences" });
  });
});
