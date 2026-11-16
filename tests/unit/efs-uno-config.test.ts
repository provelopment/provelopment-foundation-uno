import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CONFIG_REFUSAL_REASONS, validateUnoSiteSelection, type UnoConfigRefusal } from "../../src/core/efs/uno-config";
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
