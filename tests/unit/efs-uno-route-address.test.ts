import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  UNO_ROUTE_LIMITS,
  UNO_ROUTE_REFUSAL_REASONS,
  buildUnoCandidateRouteIndex,
  matchUnoCandidateRoute,
  type UnoRouteRefusal,
} from "../../src/core/efs/uno-route-address";

/**
 * U03 candidate-address tests (`UNO-WO-019 / R01`).
 *
 * Two kinds of evidence, deliberately separated:
 *
 * 1. **Committed-fixture evidence.** The real `deployment/efs/manifest.json` and
 *    `deployment/uno.config.json` are read as *data* and must produce exactly one `/en-001`
 *    candidate. Reading files is test-side work; the module under test never touches a filesystem.
 * 2. **Refusal evidence.** Every negative asserts `accepted === false`, its exact closed reason and
 *    that the reason belongs to `UNO_ROUTE_REFUSAL_REASONS`, so an always-accepting implementation
 *    cannot pass and a refusal cannot be satisfied by the wrong category.
 *
 * Nothing here asserts a served route: a candidate address is a proposal, and the live `/` plus the
 * six established 404s remain the original `pnpm test:http` gate's business.
 */

const REPO_ROOT = new URL("../../", import.meta.url);
const MANIFEST_URL = new URL("deployment/efs/manifest.json", REPO_ROOT);
const CONFIG_URL = new URL("deployment/uno.config.json", REPO_ROOT);

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const HOME_PATH = "deployment/efs/content/home.en-001.md";

const readManifest = (): unknown => JSON.parse(readFileSync(MANIFEST_URL, "utf8"));
const readConfig = (): unknown => JSON.parse(readFileSync(CONFIG_URL, "utf8"));

function selection(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
    ...overrides,
  };
}

/** One valid Page, so a synthetic Site can hold several distinct addresses. */
function page(id: string, route: string[], locale: string, sources: unknown[]): unknown {
  return { id, route, representations: [{ locale, sources }] };
}

/**
 * A synthetic two-Page Site: the reserved Home in `en-001` with **two** declared sources, plus a
 * nested Page authored in `de-DE`.
 */
function twoPageManifest(): unknown {
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
                  page("home", ["home"], "en-001", [
                    { kind: "markdown", path: HOME_PATH },
                    { kind: "json", path: "deployment/efs/content/home.en-001.json" },
                  ]),
                  page("web-design", ["offers", "web-design"], "de-DE", [
                    { kind: "markdown", path: "deployment/efs/content/web-design.de-DE.md" },
                  ]),
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** Assert an index refusal with its exact closed reason. */
function expectIndexRefused(
  manifest: unknown,
  selected: unknown,
  reason: UnoRouteRefusal,
): void {
  const result = buildUnoCandidateRouteIndex(manifest, selected);
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(UNO_ROUTE_REFUSAL_REASONS).toContain(result.reason);
}

/** Assert a match refusal with its exact closed reason. */
function expectMatchRefused(
  pathname: unknown,
  manifest: unknown,
  selected: unknown,
  reason: UnoRouteRefusal,
): void {
  const result = matchUnoCandidateRoute(pathname, manifest, selected);
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(UNO_ROUTE_REFUSAL_REASONS).toContain(result.reason);
}

describe("the committed fixture", () => {
  it("builds exactly one candidate for the committed manifest and selection", () => {
    const result = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.candidates).toHaveLength(1);
  });

  it("identifies the one Entity, Facet, Site and Page of that candidate", () => {
    const result = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const candidate = result.candidates[0];
    expect(candidate?.entityId).toBe(ENTITY_ID);
    expect(candidate?.facetId).toBe("foundation");
    expect(candidate?.siteId).toBe("main");
    expect(candidate?.pageId).toBe("home");
  });

  it("keeps the authored locale tag and the lowercase path key distinct", () => {
    const result = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const candidate = result.candidates[0];
    expect(candidate?.localeTag).toBe("en-001");
    expect(candidate?.localePathKey).toBe("en-001");
  });

  it("suppresses the reserved Home segment in the pathname", () => {
    const result = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const candidate = result.candidates[0];
    expect(candidate?.pathname).toBe("/en-001");
    expect(candidate?.routePath).toBe("");
  });

  it("preserves the one declared Markdown source without opening it", () => {
    const result = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const candidate = result.candidates[0];
    expect(candidate?.sources).toEqual([{ kind: "markdown", path: HOME_PATH }]);
  });

  it("carries no publication, visibility, host or SEO authority", () => {
    const result = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const candidate = result.candidates[0];
    expect(candidate === undefined ? undefined : Object.keys(candidate).sort()).toEqual([
      "entityId",
      "facetId",
      "localePathKey",
      "localeTag",
      "pageId",
      "pathname",
      "routePath",
      "siteId",
      "sources",
    ]);
  });

  it("deep-freezes the candidates array, the candidate and its sources", () => {
    const result = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.candidates)).toBe(true);
    const candidate = result.candidates[0];
    expect(Object.isFrozen(candidate)).toBe(true);
    expect(Object.isFrozen(candidate?.sources)).toBe(true);
    expect(Object.isFrozen(candidate?.sources[0])).toBe(true);
  });

  it("is repeatable and independent across calls", () => {
    const first = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    const second = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(first).toEqual(second);
    expect(first.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;
    expect(first.candidates).not.toBe(second.candidates);
    expect(first.candidates[0]).not.toBe(second.candidates[0]);
  });

  it("matches the one candidate by exact pathname", () => {
    const result = matchUnoCandidateRoute("/en-001", readManifest(), readConfig());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.candidate.pathname).toBe("/en-001");
    expect(result.candidate.pageId).toBe("home");
    expect(Object.isFrozen(result.candidate)).toBe(true);
  });

  it("leaves the caller's manifest and selection byte-identical", () => {
    const manifest = readManifest();
    const selected = readConfig();
    const before = JSON.stringify([manifest, selected]);
    buildUnoCandidateRouteIndex(manifest, selected);
    matchUnoCandidateRoute("/en-001", manifest, selected);
    expect(JSON.stringify([manifest, selected])).toBe(before);
  });
});


describe("exact-path match refusals", () => {
  it("refuses a short language key that names no candidate", () => {
    expectMatchRefused("/en", readManifest(), readConfig(), "route:unmatched");
  });

  it("refuses an uppercased locale key", () => {
    expectMatchRefused("/EN-001", readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses the suppressed Home alias /en-001/home", () => {
    expectMatchRefused("/en-001/home", readManifest(), readConfig(), "route:unmatched");
  });

  it("refuses a different region tag", () => {
    expectMatchRefused("/en-US", readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused("/en-us", readManifest(), readConfig(), "route:unmatched");
  });

  it("refuses an unknown child segment", () => {
    expectMatchRefused("/en-001/unknown", readManifest(), readConfig(), "route:unmatched");
  });

  it("refuses a trailing separator", () => {
    expectMatchRefused("/en-001/", readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses a doubled leading separator", () => {
    expectMatchRefused("//en-001", readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses a query string", () => {
    expectMatchRefused("/en-001?x=1", readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses a fragment", () => {
    expectMatchRefused("/en-001#section", readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses a percent escape", () => {
    expectMatchRefused("/%65n-001", readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused("/en-001/%2e%2e", readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses an absolute URL rather than parsing it as a host authority", () => {
    expectMatchRefused(
      "http://example.test/en-001",
      readManifest(),
      readConfig(),
      "route:invalid-pathname",
    );
    expectMatchRefused(
      "https://example.test/en-001",
      readManifest(),
      readConfig(),
      "route:invalid-pathname",
    );
  });

  it("refuses a path beyond the declared pathname bound", () => {
    const long = `/${"a".repeat(UNO_ROUTE_LIMITS.pathnameLength)}`;
    expectMatchRefused(long, readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses a non-string pathname without reading it", () => {
    expectMatchRefused(null, readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused(42, readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused(["/en-001"], readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused({ pathname: "/en-001" }, readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses a bare separator and an empty value", () => {
    expectMatchRefused("/", readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused("", readManifest(), readConfig(), "route:invalid-pathname");
  });

  it("refuses a backslash, a space and a control character", () => {
    expectMatchRefused("/en-001\\home", readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused("/en 001", readManifest(), readConfig(), "route:invalid-pathname");
    expectMatchRefused("/en-001\n", readManifest(), readConfig(), "route:invalid-pathname");
  });
});


describe("a synthetic two-Page Site with a nested Page authored in de-DE", () => {
  it("yields exactly the two expected candidate pathnames in code-point order", () => {
    const result = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.candidates.map((candidate) => candidate.pathname)).toEqual([
      "/de-de/offers/web-design",
      "/en-001",
    ]);
  });

  it("keeps the authored de-DE tag canonical while the path key is lowercase", () => {
    const result = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const nested = result.candidates.find(
      (candidate) => candidate.pathname === "/de-de/offers/web-design",
    );
    expect(nested?.localeTag).toBe("de-DE");
    expect(nested?.localePathKey).toBe("de-de");
    expect(nested?.routePath).toBe("offers/web-design");
    expect(nested?.pageId).toBe("web-design");
  });

  it("preserves a nested relative route without adding Site or Facet segments", () => {
    const result = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    for (const candidate of result.candidates) {
      expect(candidate.pathname.startsWith("/foundation")).toBe(false);
      expect(candidate.pathname.includes("/main/")).toBe(false);
    }
  });

  it("preserves two source declarations without precedence or selection", () => {
    const result = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const home = result.candidates.find((candidate) => candidate.pageId === "home");
    expect(home?.sources).toEqual([
      { kind: "markdown", path: HOME_PATH },
      { kind: "json", path: "deployment/efs/content/home.en-001.json" },
    ]);
    expect(home?.sources[0]?.kind).toBe("markdown");
    expect(home?.sources[1]?.kind).toBe("json");
  });

  it("never treats a source declaration as publication authority", () => {
    const result = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    for (const candidate of result.candidates) {
      expect(Object.keys(candidate)).not.toContain("public");
      expect(Object.keys(candidate)).not.toContain("published");
      expect(Object.keys(candidate)).not.toContain("visibility");
      expect(Object.keys(candidate.sources[0] ?? {})).toEqual(["kind", "path"]);
    }
  });

  it("matches the nested de-de candidate exactly", () => {
    const result = matchUnoCandidateRoute(
      "/de-de/offers/web-design",
      twoPageManifest(),
      selection(),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.candidate.pageId).toBe("web-design");
    expect(result.candidate.localeTag).toBe("de-DE");
  });

  it("refuses the authored uppercase spelling as a pathname", () => {
    expectMatchRefused(
      "/de-DE/offers/web-design",
      twoPageManifest(),
      selection(),
      "route:invalid-pathname",
    );
  });

  it("refuses a short-language alias and a missing segment", () => {
    expectMatchRefused("/de", twoPageManifest(), selection(), "route:unmatched");
    expectMatchRefused("/de-de/offers", twoPageManifest(), selection(), "route:unmatched");
    expectMatchRefused("/de-de/offers/web-design/", twoPageManifest(), selection(), "route:invalid-pathname");
  });

  it("is stable across repeated builds of the same input", () => {
    const first = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    const second = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).toEqual(second);
  });

  it("does not mutate the synthetic manifest or selection", () => {
    const manifest = twoPageManifest();
    const selected = selection();
    const before = JSON.stringify([manifest, selected]);
    buildUnoCandidateRouteIndex(manifest, selected);
    expect(JSON.stringify([manifest, selected])).toBe(before);
  });

  it("shares no mutable state between two independent results", () => {
    const first = buildUnoCandidateRouteIndex(twoPageManifest(), selection());
    const second = buildUnoCandidateRouteIndex(readManifest(), readConfig());
    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;
    expect(first.candidates).toHaveLength(2);
    expect(second.candidates).toHaveLength(1);
    expect(first.candidates[0]).not.toEqual(second.candidates[0]);
  });
});


describe("manifest and selection refusals", () => {
  it("refuses a zero-Entity manifest", () => {
    expectIndexRefused({ entities: [] }, selection(), "route:manifest-invalid");
  });

  it("refuses a two-Entity manifest", () => {
    const manifest = JSON.parse(JSON.stringify(twoPageManifest())) as {
      entities: Record<string, unknown>[];
    };
    const first = manifest.entities[0];
    expect(first).toBeDefined();
    if (first === undefined) return;
    manifest.entities.push({ ...first, id: "e_00000000000000000000000000" });
    expectIndexRefused(manifest, selection(), "route:manifest-invalid");
  });

  it("refuses a manifest that is not an object at all", () => {
    expectIndexRefused("manifest", selection(), "route:manifest-invalid");
    expectIndexRefused(null, selection(), "route:manifest-invalid");
  });

  it("refuses a missing selection", () => {
    expectIndexRefused(readManifest(), undefined, "route:selection-invalid");
    expectIndexRefused(readManifest(), null, "route:selection-invalid");
  });

  it("refuses an unknown selected Facet", () => {
    expectIndexRefused(
      readManifest(),
      selection({ selectedSite: { facetId: "studio", siteId: "main" } }),
      "route:selection-invalid",
    );
  });

  it("refuses a selected Site that does not exist", () => {
    expectIndexRefused(
      readManifest(),
      selection({ selectedSite: { facetId: "foundation", siteId: "preview" } }),
      "route:selection-invalid",
    );
  });

  it("refuses a selection naming a different Entity", () => {
    expectIndexRefused(
      readManifest(),
      selection({ entityId: "e_00000000000000000000000000" }),
      "route:selection-invalid",
    );
  });

  it("refuses a Site id declared under two Facets", () => {
    const pageA = page("home", ["home"], "en-001", [{ kind: "markdown", path: HOME_PATH }]);
    const pageB = page("studio-home", ["studio-home"], "en-001", [
      { kind: "markdown", path: "deployment/efs/content/studio-home.en-001.md" },
    ]);
    const ambiguous = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            { id: "foundation", sites: [{ id: "main", pages: [pageA] }] },
            { id: "studio", sites: [{ id: "main", pages: [pageB] }] },
          ],
        },
      ],
    };
    expectIndexRefused(ambiguous, selection(), "route:selection-invalid");
  });

  it("refuses a Site that exists only under another Facet", () => {
    const pageA = page("home", ["home"], "en-001", [{ kind: "markdown", path: HOME_PATH }]);
    const pageB = page("studio-home", ["studio-home"], "en-001", [
      { kind: "markdown", path: "deployment/efs/content/studio-home.en-001.md" },
    ]);
    const twoFacets = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            { id: "foundation", sites: [{ id: "main", pages: [pageA] }] },
            { id: "studio", sites: [{ id: "preview", pages: [pageB] }] },
          ],
        },
      ],
    };
    expectIndexRefused(
      twoFacets,
      selection({ selectedSite: { facetId: "foundation", siteId: "preview" } }),
      "route:selection-invalid",
    );
  });

  it("refuses an unsupported selection version", () => {
    expectIndexRefused(
      readManifest(),
      selection({ version: 2 }),
      "route:selection-invalid",
    );
  });

  it("refuses every unauthorized authority field in the selection", () => {
    for (const field of ["host", "publication", "spokeId", "basePath", "release"]) {
      expectIndexRefused(readManifest(), selection({ [field]: true }), "route:selection-invalid");
    }
  });
});


describe("upstream graph refusals that never yield a candidate", () => {
  /** A one-Page Site whose single Page is replaced by the case's own declaration. */
  function siteWith(pages: unknown[]): unknown {
    return {
      entities: [
        {
          id: ENTITY_ID,
          facets: [{ id: "foundation", sites: [{ id: "main", pages }] }],
        },
      ],
    };
  }

  it("never yields a candidate for a duplicate Page route", () => {
    const manifest = siteWith([
      page("home", ["home"], "en-001", [{ kind: "markdown", path: HOME_PATH }]),
      page("services", ["home"], "de-DE", [
        { kind: "markdown", path: "deployment/efs/content/services.de-DE.md" },
      ]),
    ]);
    expectIndexRefused(manifest, selection(), "route:manifest-invalid");
  });

  it("never yields a candidate for a Home id at a foreign route", () => {
    const manifest = siteWith([
      page("home", ["offers"], "en-001", [{ kind: "markdown", path: HOME_PATH }]),
    ]);
    expectIndexRefused(manifest, selection(), "route:manifest-invalid");
  });

  it("never yields a candidate for a source traversal attempt", () => {
    const manifest = siteWith([
      page("home", ["home"], "en-001", [
        { kind: "markdown", path: "deployment/efs/content/../private.md" },
      ]),
    ]);
    expectIndexRefused(manifest, selection(), "route:manifest-invalid");
  });

  it("never yields a candidate for a malformed authored locale", () => {
    const manifest = siteWith([
      page("home", ["home"], "en_US", [{ kind: "markdown", path: HOME_PATH }]),
    ]);
    expectIndexRefused(manifest, selection(), "route:manifest-invalid");
  });

  it("never yields a candidate for a noncanonical authored tag", () => {
    const manifest = siteWith([
      page("home", ["home"], "EN-001", [{ kind: "markdown", path: HOME_PATH }]),
    ]);
    expectIndexRefused(manifest, selection(), "route:manifest-invalid");
  });

  it("never yields a candidate for a Site with no Pages", () => {
    expectIndexRefused(siteWith([]), selection(), "route:manifest-invalid");
  });
});


describe("hostile input", () => {
  it("refuses a manifest accessor without invoking it", () => {
    let reads = 0;
    const hostile = {
      entities: [
        {
          get id(): string {
            reads += 1;
            throw new Error("must not run");
          },
        },
      ],
    };
    expectIndexRefused(hostile, selection(), "route:unreadable");
    expect(reads).toBe(0);
  });

  it("refuses a symbol-keyed selection", () => {
    const hostile = selection() as Record<PropertyKey, unknown>;
    hostile[Symbol("bindings")] = { host: "x.invalid" };
    expectIndexRefused(readManifest(), hostile, "route:unreadable");
  });

  it("refuses a manifest whose Proxy trap throws", () => {
    const hostile = new Proxy(twoPageManifest() as object, {
      ownKeys(): string[] {
        throw new Error("hostile");
      },
    });
    expectIndexRefused(hostile, selection(), "route:unreadable");
  });

  it("refuses a selection with a non-plain prototype", () => {
    class Selection {
      version = 1;
      entityId = ENTITY_ID;
      selectedSite = { facetId: "foundation", siteId: "main" };
    }
    expectIndexRefused(readManifest(), new Selection(), "route:unreadable");
  });

  it("refuses a hostile pathname without reading it", () => {
    const hostile = new Proxy(
      {},
      {
        get(): never {
          throw new Error("must not run");
        },
      },
    );
    expectMatchRefused(hostile, readManifest(), readConfig(), "route:invalid-pathname");
  });
});

describe("the closed refusal vocabulary", () => {
  it("publishes exactly the nine documented literals including the six required codes", () => {
    expect(UNO_ROUTE_REFUSAL_REASONS).toHaveLength(9);
    for (const required of [
      "route:manifest-invalid",
      "route:selection-invalid",
      "route:invalid-pathname",
      "route:unmatched",
      "route:duplicate-address",
      "route:unreadable",
    ]) {
      expect(UNO_ROUTE_REFUSAL_REASONS).toContain(required);
    }
    expect(new Set(UNO_ROUTE_REFUSAL_REASONS).size).toBe(9);
    expect(Object.isFrozen(UNO_ROUTE_REFUSAL_REASONS)).toBe(true);
  });

  it("keeps every observed refusal inside the vocabulary", () => {
    const observed: string[] = [];
    const indexCases: [unknown, unknown][] = [
      [{ entities: [] }, selection()],
      [readManifest(), undefined],
      [readManifest(), selection({ version: 3 })],
    ];
    for (const [manifest, selected] of indexCases) {
      const result = buildUnoCandidateRouteIndex(manifest, selected);
      if (!result.accepted) observed.push(result.reason);
    }
    for (const pathname of ["/en", "/EN-001", "/en-001/"]) {
      const result = matchUnoCandidateRoute(pathname, readManifest(), readConfig());
      if (!result.accepted) observed.push(result.reason);
    }
    expect(observed).toHaveLength(6);
    for (const reason of observed) expect(UNO_ROUTE_REFUSAL_REASONS).toContain(reason);
  });

  it("records that a duplicate candidate address is unreachable under a validated graph", () => {
    // `route:duplicate-address` is a live guard in the module, but no valid input can reach it: a
    // repeated pathname needs a repeated Page route (`page:duplicate-route`) or a repeated locale key
    // inside one Page (`representation:duplicate-locale`). Both are proved here at the earlier, exact
    // upstream category instead of with an unreachable fake candidate.
    const duplicateRoute = {
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
                    page("home", ["home"], "en-001", [{ kind: "markdown", path: HOME_PATH }]),
                    page("services", ["home"], "de-DE", [
                      { kind: "markdown", path: "deployment/efs/content/services.de-DE.md" },
                    ]),
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expectIndexRefused(duplicateRoute, selection(), "route:manifest-invalid");

    const duplicateLocale = {
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
                        { locale: "en-001", sources: [{ kind: "markdown", path: HOME_PATH }] },
                        {
                          locale: "en-001",
                          sources: [
                            { kind: "json", path: "deployment/efs/content/home.en-001.json" },
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
    expectIndexRefused(duplicateLocale, selection(), "route:manifest-invalid");
  });
});
