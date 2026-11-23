import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  UNO_COMMITTED_LOCALES_INPUT_KEYS,
  UNO_COMMITTED_LOCALES_INPUT_KEYS_V2,
  UNO_COMMITTED_LOCALES_REFUSALS,
  resolveUnoCommittedLocales,
  type UnoCommittedLocalesRefusal,
  type UnoCommittedLocalesResult,
} from "../../src/application/resolve-uno-committed-locales";

/**
 * U03 stored Site-locale policy tests (`UNO-WO-025 / R01`).
 *
 * The committed manifest and selection are read as *data*; the reader never touches the filesystem. These
 * cases prove that the stored policy a reader returns is exactly what the files declare — no invented
 * default, no implicit alias — and that a missing stored authority refuses instead of being guessed.
 */

const REPO_ROOT = new URL("../../", import.meta.url);
const MANIFEST_URL = new URL("deployment/efs/manifest.json", REPO_ROOT);
const CONFIG_URL = new URL("deployment/uno.config.json", REPO_ROOT);

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const CODES = UNO_COMMITTED_LOCALES_REFUSALS;

const readJson = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const digestOf = (url: URL): string => createHash("sha256").update(readFileSync(url)).digest("hex");

type Accepted = Extract<UnoCommittedLocalesResult, { accepted: true }>;

function expectAccepted(result: UnoCommittedLocalesResult): asserts result is Accepted {
  expect(result.accepted).toBe(true);
}

function expectRefused(result: UnoCommittedLocalesResult, code: UnoCommittedLocalesRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(CODES).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

interface MutableSite {
  id: string;
  pages: unknown[];
  locales?: unknown;
}

/** A minimal valid manifest, optionally declaring a Site locale policy. */
function manifestOf(sites: MutableSite[]): unknown {
  return { entities: [{ id: ENTITY_ID, facets: [{ id: "foundation", sites }] }] };
}

function homePage(locales: readonly string[]): unknown {
  return {
    id: "home",
    route: ["home"],
    representations: locales.map((locale) => ({
      locale,
      sources: [{ kind: "markdown", path: `deployment/efs/content/home.${locale}.md` }],
    })),
  };
}

function siteOf(id: string, locales: unknown, pages: readonly string[] = ["en-001"]): MutableSite {
  const site: MutableSite = { id, pages: [homePage(pages)] };
  if (locales !== undefined) site.locales = locales;
  return site;
}

function selectionOf(overrides: Record<string, unknown> = {}, siteId = "main"): Record<string, unknown> {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId },
    ...overrides,
  };
}

const LOCALES_EN = { supportedLocales: ["en-001"], defaultLocale: "en-001" };

function read(manifest: unknown, selection: unknown): UnoCommittedLocalesResult {
  return resolveUnoCommittedLocales({ manifest, selection });
}

describe("the committed stored policy", () => {
  it("returns the Site locale policy the committed files declare", () => {
    const result = read(readJson(MANIFEST_URL), readJson(CONFIG_URL));
    expectAccepted(result);

    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(result.localePolicy.supportedLocales).toEqual(["en-001"]);
    expect(result.localePolicy.defaultLocale).toBe("en-001");
    expect({ ...result.localePolicy.languagePreferences }).toEqual({ en: "en-001" });
    for (const forbidden of ["published", "authorized", "ready", "canonicalUrl", "hreflang", "base"]) {
      expect(Object.keys(result)).not.toContain(forbidden);
    }
  });

  it("returns a fresh deeply frozen policy without mutating the stored files", () => {
    const before = [digestOf(MANIFEST_URL), digestOf(CONFIG_URL)];
    const manifest = readJson(MANIFEST_URL);
    const selection = readJson(CONFIG_URL);
    const snapshot = [JSON.stringify(manifest), JSON.stringify(selection)];

    const first = read(manifest, selection);
    const second = read(manifest, selection);
    expectAccepted(first);
    expectAccepted(second);

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.localePolicy)).toBe(true);
    expect(Object.isFrozen(first.localePolicy.supportedLocales)).toBe(true);
    expect(Object.isFrozen(first.localePolicy.languagePreferences)).toBe(true);
    expect(first.site).not.toBe(second.site);
    expect(() => {
      (first.localePolicy as { defaultLocale: string }).defaultLocale = "de-DE";
    }).toThrow();

    expect([digestOf(MANIFEST_URL), digestOf(CONFIG_URL)]).toEqual(before);
    expect([JSON.stringify(manifest), JSON.stringify(selection)]).toEqual(snapshot);
  });

  it("keeps an empty mapping an explicit, accepted absence of aliases", () => {
    const result = read(manifestOf([siteOf("main", LOCALES_EN)]), selectionOf({ languagePreferences: {} }));
    expectAccepted(result);
    expect(Object.keys(result.localePolicy.languagePreferences)).toEqual([]);
    expect(result.localePolicy.defaultLocale).toBe("en-001");
  });

  it("reads the named Site even when it is not the first Site of the Facet", () => {
    const manifest = manifestOf([
      siteOf("other", { supportedLocales: ["de-DE"], defaultLocale: "de-DE" }, ["de-DE"]),
      siteOf("main", LOCALES_EN),
    ]);
    const result = read(manifest, selectionOf({ languagePreferences: { en: "en-001" } }));
    expectAccepted(result);
    expect(result.site.siteId).toBe("main");
    expect(result.localePolicy.supportedLocales).toEqual(["en-001"]);
  });
});


describe("refused stored authorities", () => {
  it("refuses a Site that declares no locale policy", () => {
    expectRefused(
      read(manifestOf([siteOf("main", undefined)]), selectionOf({ languagePreferences: { en: "en-001" } })),
      "committed-locales:site-locales-missing",
    );
  });

  it("refuses a selection that states no language mapping", () => {
    expectRefused(
      read(manifestOf([siteOf("main", LOCALES_EN)]), selectionOf()),
      "committed-locales:mapping-missing",
    );
  });

  it("refuses invalid Site locale declarations", () => {
    const cases: unknown[] = [
      { supportedLocales: [], defaultLocale: "en-001" },
      { supportedLocales: ["en-001", "en-001"], defaultLocale: "en-001" },
      { supportedLocales: ["EN-001"], defaultLocale: "EN-001" },
      { supportedLocales: ["en-001"], defaultLocale: "de-DE" },
      { supportedLocales: ["en-001"] },
      { supportedLocales: ["en-001"], defaultLocale: "en-001", extra: true },
      {
        supportedLocales: Array.from({ length: 33 }, (_, index) => `aa-${String(index + 1).padStart(3, "0")}`),
        defaultLocale: "aa-001",
      },
    ];
    for (const locales of cases) {
      expectRefused(
        read(manifestOf([siteOf("main", locales)]), selectionOf({ languagePreferences: { en: "en-001" } })),
        "committed-locales:manifest-invalid",
      );
    }
  });

  it("refuses a Page locale the Site never declared", () => {
    expectRefused(
      read(
        manifestOf([siteOf("main", LOCALES_EN, ["en-001", "de-DE"])]),
        selectionOf({ languagePreferences: { en: "en-001" } }),
      ),
      "committed-locales:manifest-invalid",
    );
  });

  it("refuses a mapping the stored policy cannot satisfy", () => {
    const manifest = manifestOf([siteOf("main", LOCALES_EN)]);
    expectRefused(read(manifest, selectionOf({ languagePreferences: { en: "de-DE" } })), "committed-locales:policy-invalid");
    expectRefused(read(manifest, selectionOf({ languagePreferences: { fr: "fr-001" } })), "committed-locales:policy-invalid");
    expectRefused(read(manifest, selectionOf({ languagePreferences: { EN: "en-001" } })), "committed-locales:policy-invalid");
    expectRefused(read(manifest, selectionOf({ languagePreferences: { en: "EN-001" } })), "committed-locales:policy-invalid");
  });

  it("refuses an over-long mapping and a prototype-key mapping", () => {
    const manifest = manifestOf([siteOf("main", LOCALES_EN)]);
    const many: Record<string, string> = {};
    for (let index = 0; index < 17; index += 1) many[`a${String.fromCharCode(97 + index)}`] = "en-001";
    expectRefused(read(manifest, selectionOf({ languagePreferences: many })), "committed-locales:policy-invalid");

    const protoKeyed = JSON.parse('{"__proto__": "en-001"}') as Record<string, string>;
    expectRefused(read(manifest, selectionOf({ languagePreferences: protoKeyed })), "committed-locales:policy-invalid");
  });

  it("refuses a declaration that is not the committed shape", () => {
    const manifest = manifestOf([siteOf("main", LOCALES_EN)]);
    expectRefused(
      read(manifest, selectionOf({ version: 2, languagePreferences: { en: "en-001" } })),
      "committed-locales:selection-invalid",
    );
    expectRefused(
      read(manifest, selectionOf({ languagePreferences: { en: "en-001" } }, "absent")),
      "committed-locales:selection-invalid",
    );
    expectRefused(
      read(
        {
          entities: [
            { id: ENTITY_ID, facets: [{ id: "foundation", sites: [siteOf("main", LOCALES_EN)] }] },
            {
              id: "e_secondentitysecondentity00001",
              facets: [{ id: "foundation", sites: [siteOf("main", LOCALES_EN)] }],
            },
          ],
        },
        selectionOf({ languagePreferences: { en: "en-001" } }),
      ),
      "committed-locales:manifest-invalid",
    );
  });
});


describe("request shape and hostile values", () => {
  it("refuses non-object and wrongly shaped requests", () => {
    for (const value of [null, undefined, [], 0, "", true]) {
      const result = resolveUnoCommittedLocales(value);
      expect(result.accepted).toBe(false);
      if (result.accepted) return;
      expect(CODES).toContain(result.reason);
    }
    expectRefused(resolveUnoCommittedLocales({ manifest: readJson(MANIFEST_URL) }), "committed-locales:input-invalid");
    expectRefused(
      resolveUnoCommittedLocales({ manifest: readJson(MANIFEST_URL), selection: readJson(CONFIG_URL), base: {} }),
      "committed-locales:input-invalid",
    );
    expectRefused(
      resolveUnoCommittedLocales({ manifest: "deployment/efs/manifest.json", selection: readJson(CONFIG_URL) }),
      "committed-locales:input-invalid",
    );
  });

  it("refuses an accessor, symbol or exotic request without invoking anything", () => {
    let reads = 0;
    const hostile = {
      get manifest(): unknown {
        reads += 1;
        return readJson(MANIFEST_URL);
      },
      selection: readJson(CONFIG_URL),
    };
    expectRefused(resolveUnoCommittedLocales(hostile), "committed-locales:input-invalid");
    expect(reads).toBe(0);

    const withSymbol = {
      manifest: readJson(MANIFEST_URL),
      selection: readJson(CONFIG_URL),
    } as Record<PropertyKey, unknown>;
    withSymbol[Symbol("extra")] = true;
    expectRefused(resolveUnoCommittedLocales(withSymbol), "committed-locales:input-invalid");

    class Exotic {
      manifest = readJson(MANIFEST_URL);
      selection = readJson(CONFIG_URL);
    }
    expectRefused(resolveUnoCommittedLocales(new Exotic()), "committed-locales:input-invalid");
  });

  it("turns a throwing trap and a hostile nested manifest into one closed code", () => {
    expectRefused(
      resolveUnoCommittedLocales(
        new Proxy(
          { manifest: {}, selection: {} },
          {
            ownKeys(): string[] {
              throw new Error("hostile");
            },
          },
        ),
      ),
      "committed-locales:unreadable",
    );

    let reads = 0;
    const facet: Record<string, unknown> = {
      get id(): string {
        reads += 1;
        return "foundation";
      },
      sites: [siteOf("main", LOCALES_EN)],
    };
    expectRefused(
      resolveUnoCommittedLocales({
        manifest: { entities: [{ id: ENTITY_ID, facets: [facet] }] },
        selection: selectionOf({ languagePreferences: { en: "en-001" } }),
      }),
      "committed-locales:unreadable",
    );
    expect(reads).toBe(0);
  });

  it("keeps one closed, duplicate-free refusal vocabulary and echoes nothing", () => {
    expect(CODES).toHaveLength(7);
    expect(new Set(CODES).size).toBe(7);
    expect(Object.isFrozen(CODES)).toBe(true);
    expect(UNO_COMMITTED_LOCALES_INPUT_KEYS).toEqual(["manifest", "selection"]);

    const rejected = read(
      manifestOf([siteOf("main", undefined)]),
      selectionOf({ languagePreferences: { en: "en-001" } }),
    );
    expectRefused(rejected, "committed-locales:site-locales-missing");
    expect(JSON.stringify(rejected)).toBe('{"accepted":false,"reason":"committed-locales:site-locales-missing"}');
  });
});

/**
 * T07 — `UNO-WO-086 / R01` (M11): Site-qualified committed locale authority.
 *
 * One synthetic Entity, three bound Sites, each declaring and authoring its own locale: `corporate/main` en-001,
 * `corporate/docs` de-DE, `services/main` fr-FR. The two Sites named `main` differ only by Facet. Source paths are
 * unique across the manifest, and no Site authors a locale another Site declares — so any leakage of a sibling's
 * locale into an answer would be visible.
 */
function t07Page(id: string, route: readonly string[], locales: readonly string[], slug: string) {
  return {
    id,
    route: [...route],
    representations: locales.map((locale) => ({
      locale,
      sources: [{ kind: "markdown", path: `deployment/efs/content/${slug}.${locale}.md` }],
    })),
  };
}

function t07Site(id: string, supportedLocales: readonly string[], pages: readonly unknown[]) {
  return {
    id,
    locales: { supportedLocales: [...supportedLocales], defaultLocale: supportedLocales[0] },
    pages: [...pages],
  };
}

function t07Manifest(): Record<string, unknown> {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: "corporate",
            sites: [
              t07Site("main", ["en-001"], [
                t07Page("home", ["home"], ["en-001"], "q-main-home"),
                t07Page("about", ["about"], ["en-001"], "q-main-about"),
              ]),
              t07Site("docs", ["de-DE"], [
                t07Page("home", ["home"], ["de-DE"], "q-docs-home"),
                t07Page("guide", ["guide"], ["de-DE"], "q-docs-guide"),
              ]),
            ],
          },
          {
            id: "services",
            sites: [
              t07Site("main", ["fr-FR"], [
                t07Page("home", ["home"], ["fr-FR"], "q-svc-home"),
                t07Page("offers", ["offers"], ["fr-FR"], "q-svc-offers"),
              ]),
            ],
          },
        ],
      },
    ],
  };
}

function t07Address(
  mapping?: Record<string, string>,
  defaultSite?: { facetId: string; siteId: string },
): Record<string, unknown> {
  const declared: Record<string, unknown> = {
    version: 2,
    entityId: ENTITY_ID,
    sites: [
      { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
      { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
      { facetId: "services", siteId: "main", origin: "https://xyz.example" },
    ],
  };
  if (defaultSite !== undefined) declared["default"] = { ...defaultSite };
  if (mapping !== undefined) declared["languagePreferences"] = mapping;
  return declared;
}

const T07_MAIN = { facetId: "corporate", siteId: "main" } as const;
const T07_DOCS = { facetId: "corporate", siteId: "docs" } as const;
const T07_SERVICES = { facetId: "services", siteId: "main" } as const;

function t07Read(site: { facetId: string; siteId: string }, address = t07Address(), manifest = t07Manifest()) {
  return resolveUnoCommittedLocales({ manifest, selection: address, site });
}

describe("a qualified Site's committed locales (v2)", () => {
  it("returns each Site's own declared locales, default and applicable mappings", () => {
    const address = t07Address({ en: "en-001" }, T07_MAIN);
    const main = t07Read(T07_MAIN, address);
    const docs = t07Read(T07_DOCS, address);
    const services = t07Read(T07_SERVICES, address);

    expectAccepted(main);
    expectAccepted(docs);
    expectAccepted(services);

    expect(main.site).toEqual({ entityId: ENTITY_ID, facetId: "corporate", siteId: "main" });
    expect(main.localePolicy.supportedLocales).toEqual(["en-001"]);
    expect(main.localePolicy.defaultLocale).toBe("en-001");
    expect({ ...main.localePolicy.languagePreferences }).toEqual({ en: "en-001" });

    expect(docs.localePolicy.supportedLocales).toEqual(["de-DE"]);
    expect(docs.localePolicy.defaultLocale).toBe("de-DE");
    // The declared mapping names `en-001`, which `corporate/docs` does not author, so it is not its alias.
    expect(Object.keys(docs.localePolicy.languagePreferences)).toEqual([]);

    expect(services.localePolicy.supportedLocales).toEqual(["fr-FR"]);
    expect(services.localePolicy.defaultLocale).toBe("fr-FR");
    expect(Object.keys(services.localePolicy.languagePreferences)).toEqual([]);
  });

  it("never lends one Site another Site's locale or mapping", () => {
    // `services/main` authors no en-001, so a corporate alias is not its redirect and is dropped.
    const borrowed = t07Read(T07_SERVICES, t07Address({ en: "en-001" }, T07_MAIN));
    expectAccepted(borrowed);
    expect(borrowed.localePolicy.supportedLocales).toEqual(["fr-FR"]);
    expect(Object.keys(borrowed.localePolicy.languagePreferences)).toEqual([]);

    // A mapping to a locale no Site declares applies to nobody and invents nothing.
    const unknownTarget = t07Read(T07_SERVICES, t07Address({ zz: "en-001" }, T07_MAIN));
    expectAccepted(unknownTarget);
    expect(Object.keys(unknownTarget.localePolicy.languagePreferences)).toEqual([]);
  });

  it("keeps two Sites named main distinct because their Facets differ", () => {
    const corporate = t07Read(T07_MAIN);
    const services = t07Read(T07_SERVICES);
    expectAccepted(corporate);
    expectAccepted(services);
    expect(corporate.site.siteId).toBe(services.site.siteId);
    expect(corporate.site.facetId).not.toBe(services.site.facetId);
    expect(corporate.localePolicy.supportedLocales).not.toEqual(services.localePolicy.supportedLocales);
  });

  it("refuses a Site that declares no locale policy of its own", () => {
    const manifest = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            {
              id: "corporate",
              sites: [
                { id: "main", pages: [t07Page("home", ["home"], ["en-001"], "r-main-home")] },
                t07Site("docs", ["de-DE"], [t07Page("home", ["home"], ["de-DE"], "r-docs-home")]),
              ],
            },
            {
              id: "services",
              sites: [t07Site("main", ["fr-FR"], [t07Page("home", ["home"], ["fr-FR"], "r-svc-home")])],
            },
          ],
        },
      ],
    };
    expectRefused(t07Read(T07_MAIN, t07Address(), manifest), "committed-locales:site-locales-missing");
    // The sibling that does declare locales is unaffected by the failure above.
    expectAccepted(t07Read(T07_DOCS, t07Address(), manifest));
  });

  it("adds no implicit alias when the optional v2 mapping is absent", () => {
    const docs = t07Read(T07_DOCS, t07Address());
    expectAccepted(docs);
    expect(docs.localePolicy.supportedLocales).toEqual(["de-DE"]);
    expect(Object.keys(docs.localePolicy.languagePreferences)).toEqual([]);
  });

  it("never turns a sibling-owned Page locale into this Site's alias", () => {
    // fr-FR is authored by `services/main` alone, so it is not a `corporate/docs` alias.
    const docs = t07Read(T07_DOCS, t07Address({ fr: "fr-FR" }, T07_SERVICES));
    expectAccepted(docs);
    expect(Object.keys(docs.localePolicy.languagePreferences)).toEqual([]);

    const services = t07Read(T07_SERVICES, t07Address({ fr: "fr-FR" }, T07_SERVICES));
    expectAccepted(services);
    expect({ ...services.localePolicy.languagePreferences }).toEqual({ fr: "fr-FR" });
  });

  it("applies a mapping per Site across shared and disjoint locale ownership", () => {
    const manifest = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            {
              id: "corporate",
              sites: [
                t07Site("main", ["en-001", "de-DE"], [
                  t07Page("home", ["home"], ["en-001", "de-DE"], "shared-main-home"),
                ]),
                t07Site("docs", ["en-001"], [
                  t07Page("home", ["home"], ["en-001"], "shared-docs-home"),
                ]),
              ],
            },
            {
              id: "services",
              sites: [t07Site("main", ["fr-FR"], [t07Page("home", ["home"], ["fr-FR"], "shared-svc-home")])],
            },
          ],
        },
      ],
    };
    const address = {
      version: 2,
      entityId: ENTITY_ID,
      sites: [
        { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
        { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
        { facetId: "services", siteId: "main", origin: "https://xyz.example" },
      ],
      default: { facetId: "corporate", siteId: "main" },
      languagePreferences: { de: "de-DE", en: "en-001" },
    };

    const sharing = t07Read(T07_MAIN, address, manifest);
    const sibling = t07Read(T07_DOCS, address, manifest);
    const disjoint = t07Read(T07_SERVICES, address, manifest);
    expectAccepted(sharing);
    expectAccepted(sibling);
    expectAccepted(disjoint);

    // `corporate/main` owns both locales, so both mappings apply to it.
    expect(sharing.localePolicy.supportedLocales).toEqual(["de-DE", "en-001"]);
    expect({ ...sharing.localePolicy.languagePreferences }).toEqual({ de: "de-DE", en: "en-001" });

    // `corporate/docs` shares only en-001, so the shared mapping applies and the private one does not.
    expect(sibling.localePolicy.supportedLocales).toEqual(["en-001"]);
    expect({ ...sibling.localePolicy.languagePreferences }).toEqual({ en: "en-001" });

    // `services/main` shares nothing, so neither mapping becomes its alias.
    expect(disjoint.localePolicy.supportedLocales).toEqual(["fr-FR"]);
    expect(Object.keys(disjoint.localePolicy.languagePreferences)).toEqual([]);
  });

  it("accepts thirty-three authored full locales without an arbitrary ceiling", () => {
    const locales = Array.from({ length: 33 }, (_, index) => `es-${String(101 + index)}`);
    const manifest = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            {
              id: "corporate",
              sites: [t07Site("main", locales, [t07Page("home", ["home"], locales, "wide2-home")])],
            },
          ],
        },
      ],
    };
    const address = {
      version: 2,
      entityId: ENTITY_ID,
      sites: [{ facetId: "corporate", siteId: "main", origin: "https://abc.example" }],
    };
    const result = t07Read(T07_MAIN, address, manifest);
    expectAccepted(result);
    expect(result.localePolicy.supportedLocales.length).toBe(33);
    expect(result.localePolicy.supportedLocales).toEqual([...locales].sort());
    expect(result.localePolicy.defaultLocale).toBe(locales[0]);
  });

  it("refuses malformed, duplicated and wrongly descended requests and declarations", () => {
    const duplicated = t07Site("main", ["en-001", "en-001"], [
      t07Page("home", ["home"], ["en-001"], "dup-home"),
    ]);
    expectRefused(
      t07Read(T07_MAIN, t07Address(), {
        entities: [
          {
            id: ENTITY_ID,
            facets: [
              { id: "corporate", sites: [duplicated] },
              { id: "services", sites: [t07Site("main", ["fr-FR"], [t07Page("home", ["home"], ["fr-FR"], "s-home")])] },
            ],
          },
        ],
      }),
      "committed-locales:manifest-invalid",
    );

    // The right Site id under a Facet that does not own it is another Site, and there is no fallback.
    expectRefused(
      t07Read({ facetId: "services", siteId: "docs" }, t07Address(), t07Manifest()),
      "committed-locales:selection-invalid",
    );

    // A v1 declaration is not an address declaration.
    expectRefused(
      t07Read(T07_MAIN, selectionOf({ languagePreferences: { en: "en-001" } }), t07Manifest()),
      "committed-locales:selection-invalid",
    );

    let invoked = 0;
    expectRefused(
      resolveUnoCommittedLocales({
        manifest: t07Manifest(),
        selection: t07Address(),
        get site(): unknown {
          invoked += 1;
          return T07_MAIN;
        },
      }),
      "committed-locales:input-invalid",
    );
    expect(invoked).toBe(0);

    const symbolKeyed = { ...T07_MAIN } as Record<PropertyKey, unknown>;
    symbolKeyed[Symbol("site")] = "services";
    expectRefused(
      resolveUnoCommittedLocales({ manifest: t07Manifest(), selection: t07Address(), site: symbolKeyed }),
      "committed-locales:input-invalid",
    );

    for (const site of [{ siteId: "main" }, { facetId: "corporate" }, { facetId: "corporate", siteId: "docs", x: 1 }]) {
      expectRefused(
        resolveUnoCommittedLocales({ manifest: t07Manifest(), selection: t07Address(), site }),
        "committed-locales:input-invalid",
      );
    }
  });

  it("returns a frozen, deterministic policy and never mutates the caller's data", () => {
    const manifest = t07Manifest();
    const address = t07Address({ en: "en-001" }, T07_MAIN);
    const snapshot = JSON.stringify({ manifest, address });

    const first = t07Read(T07_DOCS, address, manifest);
    const second = t07Read(T07_DOCS, address, manifest);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expectAccepted(first);
    expectAccepted(second);
    if (!first.accepted || !second.accepted) return;

    expect(first.localePolicy).not.toBe(second.localePolicy);
    expect(first.localePolicy.supportedLocales).not.toBe(second.localePolicy.supportedLocales);
    expect(first.localePolicy.languagePreferences).not.toBe(second.localePolicy.languagePreferences);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.site)).toBe(true);
    expect(Object.isFrozen(first.localePolicy)).toBe(true);
    expect(Object.isFrozen(first.localePolicy.supportedLocales)).toBe(true);
    expect(Object.isFrozen(first.localePolicy.languagePreferences)).toBe(true);
    expect(JSON.stringify({ manifest, address })).toBe(snapshot);

    expect(UNO_COMMITTED_LOCALES_INPUT_KEYS_V2).toEqual(["manifest", "selection", "site"]);
    expect(Object.isFrozen(UNO_COMMITTED_LOCALES_INPUT_KEYS_V2)).toBe(true);
  });

  it("keeps the v1 contract: an explicit language mapping is still required", () => {
    expectRefused(read(manifestOf([siteOf("main", LOCALES_EN)]), selectionOf()), "committed-locales:mapping-missing");
    expectAccepted(read(manifestOf([siteOf("main", LOCALES_EN)]), selectionOf({ languagePreferences: {} })));
  });
});
