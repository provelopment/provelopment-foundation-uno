import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  MANIFEST_CONTENT_ROOT,
  MANIFEST_GRAPH_LIMITS,
  REFUSAL_REASONS,
  validateUnoManifestGraph,
  type UnoManifestRefusal,
} from "../../src/core/efs/manifest-graph";
import { resolveUnoProperties } from "../../src/core/efs/properties";

/**
 * U02 authored-graph tests (`UNO-WO-013 / R01`).
 *
 * Two kinds of evidence live here, deliberately separated:
 *
 * 1. **Committed-content evidence.** A few cases read the real `deployment/efs/manifest.json`
 *    and the real Home Markdown from the tracked tree. Reading files is test-side work; the
 *    validator under test never touches the filesystem. If the Markdown were deleted, these
 *    cases fail rather than letting a manifest claim a source that does not exist.
 * 2. **Refusal evidence.** Every other case builds an in-memory object, changes exactly one
 *    thing, and asserts the specific closed refusal reason — so a validator that always
 *    accepted could not pass, and a refusal cannot be satisfied by the wrong category.
 *
 * Nothing here asserts publication, serving, routing or a selected public Site: acceptance of
 * an authored graph is explicitly not publication authority.
 */

const REPO_ROOT = new URL("../../", import.meta.url);
const MANIFEST_URL = new URL("deployment/efs/manifest.json", REPO_ROOT);
const HOME_URL = new URL("deployment/efs/content/home.en-001.md", REPO_ROOT);

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const HOME_PATH = "deployment/efs/content/home.en-001.md";

interface MutableSource {
  kind: string;
  path: string;
}
interface MutableRepresentation {
  locale: string;
  sources: MutableSource[];
}
interface MutablePage {
  id: string;
  route: string[];
  representations: MutableRepresentation[];
}
interface MutableSite {
  id: string;
  pages: MutablePage[];
  /** Optional declared Site locale policy; typed loosely because refusal cases install wrong types. */
  locales?: unknown;
}
interface MutableFacet {
  id: string;
  sites: MutableSite[];
}
interface MutableEntity {
  id: string;
  facets: MutableFacet[];
}
interface MutableGraph {
  entities: MutableEntity[];
}

/** The one authored graph, as plain mutable data the cases below can copy and alter. */
function authoredGraph(): MutableGraph {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: "foundation",
            sites: [
              {
                id: "main",
                pages: [
                  {
                    id: "home",
                    route: ["home"],
                    representations: [
                      {
                        locale: "en-001",
                        sources: [{ kind: "markdown", path: HOME_PATH }],
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

/** A deep copy, so a mutation in one case can never leak into another. */
function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Write one field of a cloned graph node.
 *
 * Needed because several refusal cases deliberately install a value of the wrong type (an
 * array where a string belongs), which the compile-time shape forbids by design.
 */
function setField(target: object, key: string, value: unknown): void {
  (target as Record<string, unknown>)[key] = value;
}

const entityOf = (graph: MutableGraph): MutableEntity => graph.entities[0]!;
const facetOf = (graph: MutableGraph): MutableFacet => entityOf(graph).facets[0]!;
const siteOf = (graph: MutableGraph): MutableSite => facetOf(graph).sites[0]!;
const pageOf = (graph: MutableGraph): MutablePage => siteOf(graph).pages[0]!;
const representationOf = (graph: MutableGraph): MutableRepresentation =>
  pageOf(graph).representations[0]!;
const sourceOf = (graph: MutableGraph): MutableSource => representationOf(graph).sources[0]!;

/** Assert a refusal with its exact reason, and prove that reason is in the closed vocabulary. */
function expectRefused(input: unknown, reason: UnoManifestRefusal): void {
  const result = validateUnoManifestGraph(input);
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(REFUSAL_REASONS).toContain(result.reason);
}

describe("the committed authored graph", () => {
  it("parses the committed manifest and accepts it", () => {
    const parsed: unknown = JSON.parse(readFileSync(MANIFEST_URL, "utf8"));
    expect(validateUnoManifestGraph(parsed).accepted).toBe(true);
  });

  it("accepts exactly the committed one-Entity topology and nothing more", () => {
    const result = validateUnoManifestGraph(JSON.parse(readFileSync(MANIFEST_URL, "utf8")));
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    const entity = result.graph.entities[0]!;
    expect(result.graph.entities).toHaveLength(1);
    expect(entity.id).toBe(ENTITY_ID);
    expect(entity.facets).toHaveLength(1);
    const facet = entity.facets[0]!;
    expect(facet.id).toBe("foundation");
    expect(facet.sites).toHaveLength(1);
    const site = facet.sites[0]!;
    expect(site.id).toBe("main");
    expect(site.pages).toHaveLength(1);
    const page = site.pages[0]!;
    expect(page.id).toBe("home");
    expect(page.route).toEqual(["home"]);
    expect(page.representations).toHaveLength(1);
    const representation = page.representations[0]!;
    expect(representation.locale).toBe("en-001");
    expect(representation.sources).toEqual([{ kind: "markdown", path: HOME_PATH }]);
  });

  it("finds the committed Home Markdown as truthful English source content", () => {
    const markdown = readFileSync(HOME_URL, "utf8");
    expect(markdown.length).toBeGreaterThan(400);
    expect(markdown.startsWith("# Foundation Uno")).toBe(true);
    expect(markdown).toContain("one Entity");
    expect(markdown).toContain("en-001");
    // No raw HTML, no image or script smuggling, no remote URL.
    expect(markdown).not.toMatch(/<[a-zA-Z/]/);
    expect(markdown).not.toMatch(/https?:\/\//);
    expect(markdown).not.toMatch(/!\[/);
  });

  it("declares only the committed Home candidate, inside the authored content root", () => {
    const parsed = JSON.parse(readFileSync(MANIFEST_URL, "utf8")) as MutableGraph;
    const paths = parsed.entities.flatMap((entity) =>
      entity.facets.flatMap((facet) =>
        facet.sites.flatMap((site) =>
          site.pages.flatMap((page) =>
            page.representations.flatMap((representation) =>
              representation.sources.map((source) => source.path),
            ),
          ),
        ),
      ),
    );
    expect(paths).toEqual([HOME_PATH]);
    expect(paths[0]!.startsWith(MANIFEST_CONTENT_ROOT)).toBe(true);
    expect(() => readFileSync(new URL(paths[0]!, REPO_ROOT), "utf8")).not.toThrow();
  });
});

describe("entity cardinality", () => {
  it("refuses a zero-Entity graph", () => {
    expectRefused({ entities: [] }, "entity:cardinality");
  });

  it("refuses a two-Entity graph", () => {
    const graph = authoredGraph();
    graph.entities.push(copy(entityOf(graph)));
    expectRefused(graph, "entity:cardinality");
  });

  it("refuses a missing entities field", () => {
    expectRefused({}, "shape:missing-field");
  });

  it("refuses an unknown root field such as a property bag", () => {
    const graph = copy(authoredGraph()) as unknown as Record<string, unknown>;
    graph.properties = { theme: "dark" };
    expectRefused(graph, "shape:unsupported-field");
  });

  it("refuses every publication, Spoke and address claim at the root", () => {
    for (const field of [
      "public",
      "publicSite",
      "published",
      "publication",
      "publications",
      "spokeId",
      "spokes",
      "host",
      "basePath",
      "aliases",
    ]) {
      const graph = copy(authoredGraph()) as unknown as Record<string, unknown>;
      graph[field] = true;
      expectRefused(graph, "shape:unsupported-field");
    }
  });
});

describe("closed shape at every level", () => {
  it("refuses an extra field on a facet", () => {
    const graph = authoredGraph();
    // `properties` is now a supported optional tier field (UNO-WO-018); the closed-shape refusal is
    // proved with a field that remains unauthorized at every tier.
    setField(facetOf(graph), "publication", "live");
    expectRefused(graph, "shape:unsupported-field");
  });

  it("refuses an extra field on a site", () => {
    const graph = authoredGraph();
    setField(siteOf(graph), "host", "example.invalid");
    expectRefused(graph, "shape:unsupported-field");
  });

  it("refuses an extra field on a page", () => {
    const graph = authoredGraph();
    setField(pageOf(graph), "visibility", "public");
    expectRefused(graph, "shape:unsupported-field");
  });

  it("refuses an extra field on a representation", () => {
    const graph = authoredGraph();
    setField(representationOf(graph), "published", true);
    expectRefused(graph, "shape:unsupported-field");
  });

  it("refuses an extra field on a source", () => {
    const graph = authoredGraph();
    setField(sourceOf(graph), "state", "approved");
    expectRefused(graph, "shape:unsupported-field");
  });

  it("refuses an empty facets collection", () => {
    const graph = authoredGraph();
    entityOf(graph).facets = [];
    expectRefused(graph, "shape:empty-collection");
  });

  it("refuses an empty pages collection", () => {
    const graph = authoredGraph();
    siteOf(graph).pages = [];
    expectRefused(graph, "shape:empty-collection");
  });

  it("refuses an empty representations collection", () => {
    const graph = authoredGraph();
    pageOf(graph).representations = [];
    expectRefused(graph, "shape:empty-collection");
  });

  it("refuses an empty sources collection", () => {
    const graph = authoredGraph();
    representationOf(graph).sources = [];
    expectRefused(graph, "shape:empty-collection");
  });

  it("refuses a children collection that is not an array", () => {
    const graph = authoredGraph();
    setField(entityOf(graph), "facets", {});
    expectRefused(graph, "shape:invalid-collection");
  });

  it("refuses a non-object entity node", () => {
    const graph = authoredGraph();
    graph.entities = ["entity" as never];
    expectRefused(graph, "shape:not-an-object");
  });

  it("refuses a null root", () => {
    expectRefused(null, "shape:not-an-object");
  });
});

describe("identifiers", () => {
  it("refuses a retired b_ EntityID prefix", () => {
    const graph = authoredGraph();
    setField(entityOf(graph), "id", "b_7a3knkx60eacyhca7a0cr1k6e1");
    expectRefused(graph, "entity:invalid-id");
  });

  it("refuses a mixed-case EntityID instead of normalising it", () => {
    const graph = authoredGraph();
    setField(entityOf(graph), "id", ENTITY_ID.toUpperCase());
    expectRefused(graph, "entity:invalid-id");
  });

  it("refuses a non-canonical facet identifier", () => {
    const graph = authoredGraph();
    setField(facetOf(graph), "id", "Foundation");
    expectRefused(graph, "facet:invalid-id");
  });

  it("refuses duplicate facet identifiers", () => {
    const graph = authoredGraph();
    entityOf(graph).facets.push(copy(facetOf(graph)));
    expectRefused(graph, "facet:duplicate-id");
  });

  it("refuses duplicate site identifiers within one facet", () => {
    const graph = authoredGraph();
    facetOf(graph).sites.push(copy(siteOf(graph)));
    expectRefused(graph, "site:duplicate-id");
  });

  it("refuses duplicate page identifiers within one site", () => {
    const graph = authoredGraph();
    const duplicate = copy(pageOf(graph));
    duplicate.route = ["offers"];
    siteOf(graph).pages.push(duplicate);
    expectRefused(graph, "page:duplicate-id");
  });
});



describe("authoring routes", () => {
  it("refuses a route that is not an array of segments", () => {
    const graph = authoredGraph();
    setField(pageOf(graph), "route", "home");
    expectRefused(graph, "page:invalid-route");
  });

  it("refuses an empty route", () => {
    const graph = authoredGraph();
    pageOf(graph).route = [];
    expectRefused(graph, "page:invalid-route");
  });

  it("refuses a route deeper than the declared cap", () => {
    const graph = authoredGraph();
    pageOf(graph).route = ["a", "b", "c", "d", "e"];
    expectRefused(graph, "page:invalid-route");
  });

  it("refuses a segment that smuggles a path separator", () => {
    const graph = authoredGraph();
    pageOf(graph).route = ["offers/website"];
    expectRefused(graph, "page:invalid-route");
  });

  it("refuses a traversal segment", () => {
    const graph = authoredGraph();
    pageOf(graph).route = [".."];
    expectRefused(graph, "page:invalid-route");
  });

  it("refuses duplicate routes inside one site even under distinct page ids", () => {
    const graph = authoredGraph();
    const first = copy(pageOf(graph));
    first.id = "offers-a";
    first.route = ["offers"];
    const second = copy(pageOf(graph));
    second.id = "offers-b";
    second.route = ["offers"];
    siteOf(graph).pages = [first, second];
    expectRefused(graph, "page:duplicate-route");
  });

  it("refuses the home page id sitting at a different route", () => {
    const graph = authoredGraph();
    pageOf(graph).route = ["offers"];
    expectRefused(graph, "page:invalid-route");
  });

  it("refuses the reserved home route claimed by a different page id", () => {
    const graph = authoredGraph();
    pageOf(graph).id = "landing";
    expectRefused(graph, "page:invalid-route");
  });

  it("accepts a distinct nested offers/home route under its own id", () => {
    const graph = authoredGraph();
    siteOf(graph).pages.push({
      id: "offers-home",
      route: ["offers", "home"],
      representations: [
        {
          locale: "en-001",
          sources: [{ kind: "markdown", path: "deployment/efs/content/offers-home.en-001.md" }],
        },
      ],
    });
    const result = validateUnoManifestGraph(graph);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.graph.entities[0]!.facets[0]!.sites[0]!.pages).toHaveLength(2);
  });
});

describe("authored locales", () => {
  it("refuses a bare language instead of inventing a region", () => {
    const graph = authoredGraph();
    representationOf(graph).locale = "en";
    expectRefused(graph, "representation:invalid-locale");
  });

  it("refuses a non-canonical case spelling", () => {
    const graph = authoredGraph();
    representationOf(graph).locale = "EN-001";
    expectRefused(graph, "representation:invalid-locale");
  });

  it("refuses a malformed tag separator", () => {
    const graph = authoredGraph();
    representationOf(graph).locale = "en_001";
    expectRefused(graph, "representation:invalid-locale");
  });

  it("refuses duplicate locales in one page", () => {
    const graph = authoredGraph();
    pageOf(graph).representations.push({
      locale: "en-001",
      sources: [{ kind: "json", path: "deployment/efs/content/home.en-001.json" }],
    });
    expectRefused(graph, "representation:duplicate-locale");
  });
});


describe("declared source candidates", () => {
  it("refuses an unknown source kind", () => {
    const graph = authoredGraph();
    sourceOf(graph).kind = "yaml";
    expectRefused(graph, "source:invalid-kind");
  });

  it("refuses a kind whose declared suffix disagrees", () => {
    const graph = authoredGraph();
    sourceOf(graph).path = "deployment/efs/content/home.en-001.json";
    expectRefused(graph, "source:invalid-path");
  });

  it("refuses a traversal out of the content root", () => {
    const graph = authoredGraph();
    sourceOf(graph).path = "deployment/efs/content/../private.md";
    expectRefused(graph, "source:unsafe-path");
  });

  it("refuses an absolute path", () => {
    const graph = authoredGraph();
    sourceOf(graph).path = "/deployment/efs/content/home.en-001.md";
    expectRefused(graph, "source:unsafe-path");
  });

  it("refuses a backslash path", () => {
    const graph = authoredGraph();
    sourceOf(graph).path = "deployment\\efs\\content\\home.en-001.md";
    expectRefused(graph, "source:unsafe-path");
  });

  it("refuses a query or fragment on the path", () => {
    const graph = authoredGraph();
    sourceOf(graph).path = "deployment/efs/content/home.en-001.md?raw=1";
    expectRefused(graph, "source:unsafe-path");
  });

  it("refuses a hidden segment", () => {
    const graph = authoredGraph();
    sourceOf(graph).path = "deployment/efs/content/.home.en-001.md";
    expectRefused(graph, "source:unsafe-path");
  });

  it("refuses a percent-encoded path", () => {
    const graph = authoredGraph();
    sourceOf(graph).path = "deployment/efs/content/home%2Een-001.md";
    expectRefused(graph, "source:unsafe-path");
  });

  it("refuses duplicate candidate kinds for one representation", () => {
    const graph = authoredGraph();
    representationOf(graph).sources.push({
      kind: "markdown",
      path: "deployment/efs/content/home.second.en-001.md",
    });
    expectRefused(graph, "source:duplicate-kind");
  });

  it("refuses the same candidate path claimed twice across the manifest", () => {
    const graph = authoredGraph();
    siteOf(graph).pages.push({
      id: "about",
      route: ["about"],
      representations: [{ locale: "en-001", sources: [{ kind: "markdown", path: HOME_PATH }] }],
    });
    expectRefused(graph, "source:duplicate-path");
  });

  it("refuses more than two candidates on one representation", () => {
    const graph = authoredGraph();
    representationOf(graph).sources.push(
      { kind: "json", path: "deployment/efs/content/home.en-001.json" },
      { kind: "markdown", path: "deployment/efs/content/home.alt.en-001.md" },
    );
    expectRefused(graph, "shape:too-many");
  });

  it("accepts a declared JSON candidate beside the Markdown one", () => {
    const graph = authoredGraph();
    representationOf(graph).sources.push({
      kind: "json",
      path: "deployment/efs/content/home.en-001.json",
    });
    const result = validateUnoManifestGraph(graph);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(
      result.graph.entities[0]!.facets[0]!.sites[0]!.pages[0]!.representations[0]!.sources,
    ).toHaveLength(2);
  });
});


describe("hostile and oversized input", () => {
  it("refuses an accessor without ever invoking it", () => {
    const graph = authoredGraph();
    let invoked = 0;
    Object.defineProperty(sourceOf(graph), "path", {
      enumerable: true,
      get() {
        invoked += 1;
        return HOME_PATH;
      },
    });
    expectRefused(graph, "input:unreadable");
    expect(invoked).toBe(0);
  });

  it("refuses a symbol-keyed field", () => {
    const graph = authoredGraph();
    (facetOf(graph) as unknown as Record<symbol, unknown>)[Symbol("extra")] = "value";
    expectRefused(graph, "input:unreadable");
  });

  it("refuses a node with a hostile prototype", () => {
    class Hostile {
      id = "foundation";
      sites: unknown[] = [];
    }
    const graph = authoredGraph();
    entityOf(graph).facets = [new Hostile() as unknown as MutableFacet];
    expectRefused(graph, "input:unreadable");
  });

  it("refuses a throwing property trap without leaking its message", () => {
    const hostile = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("HOSTILE-MANIFEST-TOKEN");
        },
      },
    );
    const result = validateUnoManifestGraph({ entities: [hostile] });
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe("input:unreadable");
    expect(JSON.stringify(result)).not.toContain("HOSTILE-MANIFEST-TOKEN");
  });

  it("refuses a graph with too many facets instead of truncating it", () => {
    const graph = authoredGraph();
    const facets: MutableFacet[] = [];
    for (let index = 0; index <= MANIFEST_GRAPH_LIMITS.facetsPerEntity; index += 1) {
      facets.push({ id: `facet-${index}`, sites: copy(facetOf(graph)).sites });
    }
    entityOf(graph).facets = facets;
    expectRefused(graph, "shape:too-many");
  });

  it("does not mutate the caller's graph", () => {
    const graph = authoredGraph();
    const before = JSON.stringify(graph);
    validateUnoManifestGraph(graph);
    expect(JSON.stringify(graph)).toBe(before);
  });

  it("is deterministic for the same input", () => {
    const graph = authoredGraph();
    expect(JSON.stringify(validateUnoManifestGraph(graph))).toBe(
      JSON.stringify(validateUnoManifestGraph(graph)),
    );
  });

  it("returns a deeply frozen graph that cannot be rewritten", () => {
    const result = validateUnoManifestGraph(authoredGraph());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(Object.isFrozen(result.graph)).toBe(true);
    expect(Object.isFrozen(result.graph.entities)).toBe(true);
    expect(Object.isFrozen(result.graph.entities[0])).toBe(true);
    expect(Object.isFrozen(result.graph.entities[0]!.facets[0]!.sites[0]!.pages)).toBe(true);
    expect(() => {
      (result.graph.entities[0] as unknown as { id: string }).id = "e_00000000000000000000000000";
    }).toThrow();
  });

  it("exposes no publication, host, URL or selected-Site authority in the result", () => {
    const result = validateUnoManifestGraph(authoredGraph());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const serialised = JSON.stringify(result);
    for (const forbidden of ["publicSite", "published", "publication", "host", "basePath", "http"]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it("answers every refusal with a code from the closed vocabulary", () => {
    const samples: unknown[] = [
      {},
      { entities: [] },
      { entities: [{}] },
      { entities: [{ id: ENTITY_ID, facets: [] }] },
      authoredGraph(),
    ];
    for (const sample of samples) {
      const result = validateUnoManifestGraph(sample);
      if (result.accepted) continue;
      expect(REFUSAL_REASONS).toContain(result.reason);
    }
  });
});

// --- U02 typed properties at the five owner tiers (UNO-WO-018 / R01) -------------------

/** The committed manifest as mutable data, so one tier can be annotated per case. */
function committed(): MutableGraph {
  return JSON.parse(readFileSync(MANIFEST_URL, "utf8")) as MutableGraph;
}

/** The committed topology with the Entity property bag removed. */
function manifestWithoutProperties(): MutableGraph {
  const graph = JSON.parse(readFileSync(MANIFEST_URL, "utf8")) as MutableGraph;
  delete (entityOf(graph) as MutableEntity & { properties?: unknown }).properties;
  return graph;
}

/**
 * One ancestry link, omitting the `properties` key when the tier authors no bag.
 *
 * The omission matters: an explicitly present `properties: undefined` is *not* the same thing as an
 * absent declaration, and the resolver refuses it rather than reading it as "nothing authored".
 */
function link(
  level: string,
  id: string,
  properties: unknown,
): { level: string; id: string; properties?: unknown } {
  return properties === undefined ? { level, id } : { level, id, properties };
}

describe("optional typed properties at the five owner tiers", () => {
  it("exposes the committed Entity brand.name declaration and freezes it", () => {
    const result = validateUnoManifestGraph(committed());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const entity = result.graph.entities[0];
    expect(entity?.properties?.["brand.name"]).toEqual({ value: "Foundation Uno", public: false });
    expect(Object.isFrozen(entity?.properties)).toBe(true);
    expect(Object.isFrozen(entity?.properties?.["brand.name"])).toBe(true);
  });

  it("accepts a valid declaration at every one of the five levels", () => {
    const tiers: [string, (graph: MutableGraph) => object][] = [
      ["entity", entityOf],
      ["facet", facetOf],
      ["site", siteOf],
      ["page", pageOf],
      ["representation", representationOf],
    ];
    for (const [level, nodeOf] of tiers) {
      const graph = committed();
      setField(nodeOf(graph), "properties", { "brand.name": { value: `Brand ${level}` } });
      const result = validateUnoManifestGraph(graph);
      expect(result.accepted, `level ${level} must be accepted`).toBe(true);
    }
  });

  it("preserves the exact previous node shape when no properties are authored", () => {
    const result = validateUnoManifestGraph(manifestWithoutProperties());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const entity = result.graph.entities[0];
    expect(entity === undefined ? undefined : "properties" in entity).toBe(false);
  });

  it("refuses a non-string property value", () => {
    const graph = committed();
    setField(entityOf(graph), "properties", { "brand.name": { value: 7 } });
    expectRefused(graph, "property:invalid-declaration");
  });

  it("refuses an unknown property key", () => {
    const graph = committed();
    setField(entityOf(graph), "properties", { timezone: { value: "UTC" } });
    expectRefused(graph, "property:unknown-key");
  });

  it("refuses a property bag that is not an object", () => {
    const graph = committed();
    setField(siteOf(graph), "properties", ["brand.name"]);
    expectRefused(graph, "property:invalid-bag");
  });

  it("refuses an unknown field inside a declaration", () => {
    const graph = committed();
    setField(pageOf(graph), "properties", { "brand.name": { value: "x", isPublic: true } });
    expectRefused(graph, "property:invalid-declaration");
  });

  it("refuses a __proto__ property key without polluting Object.prototype", () => {
    const graph = committed();
    setField(facetOf(graph), "properties", JSON.parse('{"__proto__": {"value": "polluted"}}'));
    expectRefused(graph, "property:unknown-key");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("refuses an accessor in a property bag without invoking it", () => {
    let reads = 0;
    const graph = committed();
    setField(representationOf(graph), "properties", {
      "brand.name": {
        get value(): string {
          reads += 1;
          return "x";
        },
      },
    });
    expectRefused(graph, "input:unreadable");
    expect(reads).toBe(0);
  });
});


describe("property inheritance over the validated graph", () => {
  it("inherits the Entity declaration down the committed chain", () => {
    const validated = validateUnoManifestGraph(committed());
    expect(validated.accepted).toBe(true);
    if (!validated.accepted) return;
    const entity = validated.graph.entities[0];
    const facet = entity?.facets[0];
    const site = facet?.sites[0];
    const page = site?.pages[0];
    const representation = page?.representations[0];
    expect(entity && facet && site && page && representation).toBeTruthy();
    if (!entity || !facet || !site || !page || !representation) return;

    const resolved = resolveUnoProperties([
      link("entity", entity.id, entity.properties),
      link("facet", facet.id, facet.properties),
      link("site", site.id, site.properties),
      link("page", page.id, page.properties),
      link("representation", representation.locale, representation.properties),
    ]);
    expect(resolved.accepted).toBe(true);
    if (!resolved.accepted) return;
    const resolution = resolved.resolved.properties["brand.name"];
    expect(resolution?.value).toBe("Foundation Uno");
    expect(resolution?.status).toBe("inherited");
    expect(resolution?.origin).toEqual({ level: "entity", id: entity.id });
  });

  it("suppresses the inherited Entity value from a descendant tier", () => {
    const graph = committed();
    setField(siteOf(graph), "properties", { "brand.name": { value: null } });
    const validated = validateUnoManifestGraph(graph);
    expect(validated.accepted).toBe(true);
    if (!validated.accepted) return;
    const entity = validated.graph.entities[0];
    const facet = entity?.facets[0];
    const site = facet?.sites[0];
    if (!entity || !facet || !site) return;

    const resolved = resolveUnoProperties([
      link("entity", entity.id, entity.properties),
      link("facet", facet.id, facet.properties),
      link("site", site.id, site.properties),
    ]);
    expect(resolved.accepted).toBe(true);
    if (!resolved.accepted) return;
    expect(resolved.resolved.properties["brand.name"]?.status).toBe("suppressed");
    expect(resolved.resolved.properties["brand.name"]?.value).toBeNull();
  });

  it("lets a Page override an inherited value without touching the Site", () => {
    const graph = committed();
    setField(pageOf(graph), "properties", { "brand.name": { value: "Page brand" } });
    const validated = validateUnoManifestGraph(graph);
    expect(validated.accepted).toBe(true);
    if (!validated.accepted) return;
    const entity = validated.graph.entities[0];
    const facet = entity?.facets[0];
    const site = facet?.sites[0];
    const page = site?.pages[0];
    if (!entity || !facet || !site || !page) return;

    const atPage = resolveUnoProperties([
      link("entity", entity.id, entity.properties),
      link("facet", facet.id, facet.properties),
      link("site", site.id, site.properties),
      link("page", page.id, page.properties),
    ]);
    const atSite = resolveUnoProperties([
      link("entity", entity.id, entity.properties),
      link("facet", facet.id, facet.properties),
      link("site", site.id, site.properties),
    ]);
    expect(atPage.accepted).toBe(true);
    expect(atSite.accepted).toBe(true);
    if (!atPage.accepted || !atSite.accepted) return;
    expect(atPage.resolved.properties["brand.name"]?.value).toBe("Page brand");
    expect(atPage.resolved.properties["brand.name"]?.status).toBe("declared");
    expect(atSite.resolved.properties["brand.name"]?.value).toBe("Foundation Uno");
  });

  it("still refuses a zero-Entity graph that declares properties", () => {
    expectRefused({ entities: [] }, "entity:cardinality");
  });

  it("still refuses a two-Entity graph that declares properties", () => {
    const graph = committed();
    graph.entities.push(copy(entityOf(graph)));
    expectRefused(graph, "entity:cardinality");
  });

  it("keeps a topology refusal when a property bag is also present", () => {
    const graph = committed();
    setField(siteOf(graph), "host", "example.invalid");
    expectRefused(graph, "shape:unsupported-field");
  });

  it("keeps the duplicate source refusal when a property bag is present", () => {
    const graph = committed();
    setField(entityOf(graph), "properties", { "contact.name": { value: "Front Desk" } });
    setField(representationOf(graph), "sources", [
      { kind: "markdown", path: HOME_PATH },
      { kind: "json", path: HOME_PATH },
    ]);
    expectRefused(graph, "source:invalid-path");
  });
});

describe("declared Site locales (`UNO-WO-025 / R01`)", () => {
  it("accepts a Site that declares a frozen locale policy", () => {
    const graph = authoredGraph();
    setField(siteOf(graph), "locales", { supportedLocales: ["en-001"], defaultLocale: "en-001" });

    const result = validateUnoManifestGraph(graph);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const site = result.graph.entities[0]!.facets[0]!.sites[0]!;
    expect(site.locales).toEqual({ supportedLocales: ["en-001"], defaultLocale: "en-001" });
    expect(Object.isFrozen(site.locales)).toBe(true);
    expect(Object.isFrozen(site.locales?.supportedLocales)).toBe(true);
    expect(site.locales).not.toBe(graph.entities[0]!.facets[0]!.sites[0]!.locales);
  });

  it("accepts a Site whose declared list covers every authored Page locale", () => {
    const graph = authoredGraph();
    pageOf(graph).representations.push({
      locale: "de-DE",
      sources: [{ kind: "json", path: "deployment/efs/content/home.de-DE.json" }],
    });
    setField(siteOf(graph), "locales", { supportedLocales: ["en-001", "de-DE"], defaultLocale: "de-DE" });

    const result = validateUnoManifestGraph(graph);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.graph.entities[0]!.facets[0]!.sites[0]!.locales?.defaultLocale).toBe("de-DE");
  });

  it("keeps an absent locales declaration valid for older in-memory fixtures", () => {
    const result = validateUnoManifestGraph(authoredGraph());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.graph.entities[0]!.facets[0]!.sites[0]!.locales).toBeUndefined();
  });

  it("refuses empty, duplicated, non-canonical or non-full locales", () => {
    const cases: unknown[] = [
      { supportedLocales: [], defaultLocale: "en-001" },
      { supportedLocales: ["en-001", "en-001"], defaultLocale: "en-001" },
      { supportedLocales: ["EN-001"], defaultLocale: "EN-001" },
      { supportedLocales: ["en"], defaultLocale: "en" },
      { supportedLocales: ["zh-Hans"], defaultLocale: "zh-Hans" },
    ];
    for (const locales of cases) {
      const graph = authoredGraph();
      setField(siteOf(graph), "locales", locales);
      expectRefused(graph, "site:invalid-locales");
    }
  });

  it("refuses a default outside the list and an incomplete or unknown declaration", () => {
    const cases: unknown[] = [
      { supportedLocales: ["en-001"], defaultLocale: "de-DE" },
      { supportedLocales: ["en-001"] },
      { defaultLocale: "en-001" },
      { supportedLocales: ["en-001"], defaultLocale: "en-001", extra: true },
      { supportedLocales: "en-001", defaultLocale: "en-001" },
      [],
    ];
    for (const locales of cases) {
      const graph = authoredGraph();
      setField(siteOf(graph), "locales", locales);
      expectRefused(graph, "site:invalid-locales");
    }
  });

  it("refuses more declared locales than the bounded limit", () => {
    const graph = authoredGraph();
    setField(siteOf(graph), "locales", {
      supportedLocales: Array.from({ length: 33 }, (_, index) => `aa-${String(index + 1).padStart(3, "0")}`),
      defaultLocale: "aa-001",
    });
    expectRefused(graph, "site:invalid-locales");
  });

  it("refuses a Page locale the declaring Site does not support", () => {
    const graph = authoredGraph();
    setField(siteOf(graph), "locales", { supportedLocales: ["de-DE"], defaultLocale: "de-DE" });
    expectRefused(graph, "site:invalid-locales");
  });

  it("refuses hostile locale structure without reading it", () => {
    let reads = 0;
    const hostile: Record<string, unknown> = {
      get supportedLocales(): string[] {
        reads += 1;
        return ["en-001"];
      },
      defaultLocale: "en-001",
    };
    const graph = authoredGraph();
    setField(siteOf(graph), "locales", hostile);
    expectRefused(graph, "input:unreadable");
    expect(reads).toBe(0);

    const sparse = ["en-001"];
    sparse.length = 2;
    const sparseGraph = authoredGraph();
    setField(siteOf(sparseGraph), "locales", { supportedLocales: sparse, defaultLocale: "en-001" });
    expectRefused(sparseGraph, "input:unreadable");
  });
});
