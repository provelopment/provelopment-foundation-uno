import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  UNO_SITE_PUBLICATION_INPUT_KEYS,
  UNO_SITE_PUBLICATION_INPUT_LIMITS,
  UNO_SITE_PUBLICATION_INPUT_REFUSALS,
  UNO_SITE_PUBLICATION_LOCALE_BUDGET,
  validateUnoSitePublicationInputs,
  type UnoSitePublicationInputsRefusal,
  type UnoSitePublicationResult,
} from "../../src/application/validate-uno-site-publication-inputs";
import { MANIFEST_GRAPH_LIMITS } from "../../src/core/efs/manifest-graph";
import { resolveUnoCommittedLocales } from "../../src/application/resolve-uno-committed-locales";
import { resolveUnoCommittedBase } from "../../src/application/resolve-uno-committed-base";

/**
 * U03 Site publication-inputs tests (`UNO-WO-024 / R01`).
 *
 * The committed manifest and selected-Site declaration are read once as *data* fixtures; the composition
 * under test never touches the filesystem. Every host, base and locale policy below is synthetic test data.
 * Composing these inputs is not publishing a Page, choosing a production domain or serving a route.
 */

const REPO_ROOT = new URL("../../", import.meta.url);
const MANIFEST_URL = new URL("deployment/efs/manifest.json", REPO_ROOT);
const CONFIG_URL = new URL("deployment/uno.config.json", REPO_ROOT);

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const CODES = UNO_SITE_PUBLICATION_INPUT_REFUSALS;

const readJson = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const readBytes = (url: URL): string => readFileSync(url, "utf8");
const digest = (text: string): string => createHash("sha256").update(text).digest("hex");

/** A local test-only base. Not a Site configuration, not an origin claim. */
const LOCAL_BASE = { canonical: "http://localhost:3000", aliases: [] as string[] };

function representation(locale: string, path: string): unknown {
  return { locale, sources: [{ kind: "markdown", path }] };
}

function homePage(locales: readonly string[]): unknown {
  return {
    id: "home",
    route: ["home"],
    representations: locales.map((locale) => representation(locale, `deployment/efs/content/home.${locale}.md`)),
  };
}

function subPage(id: string, locales: readonly string[]): unknown {
  return {
    id,
    route: [id],
    representations: locales.map((locale) => representation(locale, `deployment/efs/content/${id}.${locale}.md`)),
  };
}

function siteOf(id: string, pages: readonly unknown[]): unknown {
  return { id, pages };
}

function manifestOf(sites: readonly unknown[], facetId = "foundation"): unknown {
  return { entities: [{ id: ENTITY_ID, facets: [{ id: facetId, sites }] }] };
}

function selectionOf(siteId = "main", facetId = "foundation"): unknown {
  return { version: 1, entityId: ENTITY_ID, selectedSite: { facetId, siteId } };
}

function policy(
  supportedLocales: readonly string[],
  defaultLocale: string,
  languagePreferences: Record<string, string> = { en: "en-001" },
): unknown {
  return { supportedLocales, defaultLocale, languagePreferences };
}

const EN_ONLY = (): unknown => policy(["en-001"], "en-001");

function expectAccepted(
  result: UnoSitePublicationResult,
): asserts result is ExtractUnoAccepted {
  expect(result.accepted).toBe(true);
}

type ExtractUnoAccepted = Extract<UnoSitePublicationResult, { accepted: true }>;

function expectRefused(result: UnoSitePublicationResult, code: UnoSitePublicationInputsRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(CODES).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

function compose(overrides: Record<string, unknown> = {}): UnoSitePublicationResult {
  return validateUnoSitePublicationInputs({
    manifest: manifestOf([siteOf("main", [homePage(["en-001"])])]),
    selection: selectionOf(),
    base: LOCAL_BASE,
    localePolicy: EN_ONLY(),
    ...overrides,
  });
}

describe("the real committed manifest and selection", () => {
  it("composes the authored one-Entity Site with a synthetic local base and en-001 policy", () => {
    const manifest = readJson(MANIFEST_URL);
    const selection = readJson(CONFIG_URL);
    const result = validateUnoSitePublicationInputs({
      manifest,
      selection,
      base: LOCAL_BASE,
      localePolicy: EN_ONLY(),
    });
    expectAccepted(result);

    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(result.canonicalBase).toEqual({ origin: "http://localhost:3000", pathPrefix: "" });
    expect(result.aliases).toEqual([]);
    expect(result.localePolicy.supportedLocales).toEqual(["en-001"]);
    expect(result.localePolicy.defaultLocale).toBe("en-001");
    expect({ ...result.localePolicy.languagePreferences }).toEqual({ en: "en-001" });
    // Three declared candidate addresses — Home, About and Components at en-001 — never a published Page.
    expect(result.candidateCount).toBe(3);

    for (const forbidden of ["published", "authorized", "ready", "redirect", "canonicalUrl", "hreflang", "sitemap"]) {
      expect(Object.keys(result)).not.toContain(forbidden);
    }
    expect(JSON.stringify(result).includes("http://localhost:3000")).toBe(true);
    expect(JSON.stringify(result).includes("https://")).toBe(false);
  });

  it("leaves the committed manifest, selection and Home source byte-identical", () => {
    const paths = [
      MANIFEST_URL,
      CONFIG_URL,
      new URL("deployment/efs/content/home.en-001.md", REPO_ROOT),
    ];
    const before = paths.map((url) => digest(readBytes(url)));
    expectAccepted(
      validateUnoSitePublicationInputs({
        manifest: readJson(MANIFEST_URL),
        selection: readJson(CONFIG_URL),
        base: LOCAL_BASE,
        localePolicy: EN_ONLY(),
      }),
    );
    expect(paths.map((url) => digest(readBytes(url)))).toEqual(before);
  });

  it("accepts a path-prefixed canonical base and preserves aliases in input order", () => {
    const result = validateUnoSitePublicationInputs({
      manifest: readJson(MANIFEST_URL),
      selection: readJson(CONFIG_URL),
      base: { canonical: "https://example.org/site", aliases: ["https://old.example.org", "https://alt.example.org/site"] },
      localePolicy: EN_ONLY(),
    });
    expectAccepted(result);
    expect(result.canonicalBase).toEqual({ origin: "https://example.org", pathPrefix: "/site" });
    expect(result.aliases).toEqual([
      { origin: "https://old.example.org", pathPrefix: "" },
      { origin: "https://alt.example.org", pathPrefix: "/site" },
    ]);
  });

  it("returns a fresh deeply frozen result without mutating the caller", () => {
    const request = {
      manifest: manifestOf([siteOf("main", [homePage(["en-001"])])]),
      selection: selectionOf(),
      base: LOCAL_BASE,
      localePolicy: EN_ONLY(),
    };
    const snapshot = JSON.stringify(request);
    const first = validateUnoSitePublicationInputs(request);
    const second = validateUnoSitePublicationInputs(request);
    expectAccepted(first);
    expectAccepted(second);

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.site)).toBe(true);
    expect(Object.isFrozen(first.canonicalBase)).toBe(true);
    expect(Object.isFrozen(first.localePolicy.supportedLocales)).toBe(true);
    expect(first.site).not.toBe(second.site);
    expect(first.localePolicy.supportedLocales).not.toBe(second.localePolicy.supportedLocales);
    expect(() => {
      (first.canonicalBase as { origin: string }).origin = "https://evil.example.org";
    }).toThrow();
    expect(JSON.stringify(request)).toBe(snapshot);
  });

  it("accepts a non-default supported locale that carries a representation but no Home", () => {
    // The approved contract requires the reserved Home for the *declared default* only.
    const manifest = manifestOf([siteOf("main", [homePage(["en-001"]), subPage("about", ["de-DE"])])]);
    const result = compose({ manifest, localePolicy: policy(["en-001", "de-DE"], "en-001") });
    expectAccepted(result);
    expect(result.localePolicy.supportedLocales).toEqual(["de-DE", "en-001"]);
    expect(result.candidateCount).toBe(2);
  });

  it("selects the named Site, never the first Site of a Facet", () => {
    const manifest = manifestOf([
      siteOf("other", [homePage(["de-DE"])]),
      siteOf("main", [homePage(["en-001"])]),
    ]);
    const result = compose({ manifest, selection: selectionOf("main") });
    expectAccepted(result);
    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(result.localePolicy.supportedLocales).toEqual(["en-001"]);

    expectRefused(
      compose({ manifest, selection: selectionOf("other") }),
      "publication-inputs:unsupported-representation",
    );
  });

  it("accepts the eight-alias bound on the real committed fixture", () => {
    const aliases = Array.from({ length: 8 }, (_, index) => `https://alt${index + 1}.example.org`);
    const result = validateUnoSitePublicationInputs({
      manifest: readJson(MANIFEST_URL),
      selection: readJson(CONFIG_URL),
      base: { canonical: "https://example.org", aliases },
      localePolicy: EN_ONLY(),
    });
    expectAccepted(result);
    expect(result.aliases.map((alias) => alias.origin)).toEqual(aliases);
  });
});

describe("locale consistency across one Site", () => {
  it("accepts two authored locales of the same Site with a Home at the declared default", () => {
    const manifest = manifestOf([
      siteOf("main", [homePage(["en-001", "de-DE"]), subPage("about", ["en-001", "de-DE"])]),
    ]);
    const result = compose({
      manifest,
      localePolicy: policy(["en-001", "de-DE"], "de-DE"),
    });
    expectAccepted(result);
    expect(result.localePolicy.supportedLocales).toEqual(["de-DE", "en-001"]);
    expect(result.localePolicy.defaultLocale).toBe("de-DE");
    expect(result.candidateCount).toBe(4);
  });

  it("is order-independent: a permuted supportedLocales list yields the same accepted semantics", () => {
    const manifest = manifestOf([siteOf("main", [homePage(["en-001", "de-DE"])])]);
    const first = compose({ manifest, localePolicy: policy(["en-001", "de-DE"], "en-001") });
    const second = compose({ manifest, localePolicy: policy(["de-DE", "en-001"], "en-001") });
    expectAccepted(first);
    expectAccepted(second);
    expect(second.localePolicy.supportedLocales).toEqual(first.localePolicy.supportedLocales);
    expect(second.localePolicy.defaultLocale).toBe(first.localePolicy.defaultLocale);
    expect(second.candidateCount).toBe(first.candidateCount);
  });

  it("accepts a canonical script subtag when the Site authors it and a Home exists", () => {
    const result = compose({
      manifest: manifestOf([siteOf("main", [homePage(["zh-Hans-CN"])])]),
      localePolicy: policy(["zh-Hans-CN"], "zh-Hans-CN", {}),
    });
    expectAccepted(result);
    expect(result.localePolicy.supportedLocales).toEqual(["zh-Hans-CN"]);
  });

  it("refuses an authored locale the policy never promised", () => {
    expectRefused(
      compose({ manifest: manifestOf([siteOf("main", [homePage(["en-001", "de-DE"])])]) }),
      "publication-inputs:unsupported-representation",
    );
  });

  it("refuses a promised locale the selected Site never authors", () => {
    expectRefused(
      compose({ localePolicy: policy(["en-001", "de-DE"], "en-001") }),
      "publication-inputs:unrepresented-supported-locale",
    );
  });

  it("refuses a locale authored only under a sibling Site", () => {
    const manifest = manifestOf([
      siteOf("main", [homePage(["en-001"])]),
      siteOf("other", [homePage(["de-DE"])]),
    ]);
    expectRefused(
      compose({ manifest, localePolicy: policy(["en-001", "de-DE"], "en-001") }),
      "publication-inputs:unrepresented-supported-locale",
    );
  });

  it("refuses a default locale whose Site has no reserved Home in that locale", () => {
    const manifest = manifestOf([siteOf("main", [subPage("about", ["de-DE"])])]);
    expectRefused(
      compose({ manifest, localePolicy: policy(["de-DE"], "de-DE", {}) }),
      "publication-inputs:default-home-missing",
    );
  });

  it("never repairs a missing default Home by falling back to another locale's Home", () => {
    const manifest = manifestOf([
      siteOf("main", [homePage(["en-001"]), subPage("about", ["de-DE"])]),
    ]);
    expectRefused(
      compose({ manifest, localePolicy: policy(["en-001", "de-DE"], "de-DE") }),
      "publication-inputs:default-home-missing",
    );
  });
});


describe("refused domain inputs", () => {
  it("refuses an invalid manifest graph", () => {
    const twoEntities = {
      entities: [
        { id: ENTITY_ID, facets: [{ id: "foundation", sites: [siteOf("main", [homePage(["en-001"])])] }] },
        { id: "e_secondentitysecondentity00001", facets: [{ id: "foundation", sites: [siteOf("main", [homePage(["de-DE"])])] }] },
      ],
    };
    expectRefused(compose({ manifest: twoEntities }), "publication-inputs:manifest-invalid");
  });

  it("refuses a manifest whose nested record carries an accessor", () => {
    let reads = 0;
    const facet: Record<string, unknown> = {
      get id(): string {
        reads += 1;
        return "foundation";
      },
      sites: [siteOf("main", [homePage(["en-001"])])],
    };
    expectRefused(compose({ manifest: { entities: [{ id: ENTITY_ID, facets: [facet] }] } }), "publication-inputs:unreadable");
    expect(reads).toBe(0);
  });

  it("refuses a selection that does not match the committed contract", () => {
    expectRefused(compose({ selection: { ...(selectionOf() as object), version: 2 } }), "publication-inputs:selection-invalid");
    expectRefused(compose({ selection: selectionOf("missing") }), "publication-inputs:selection-invalid");
    expectRefused(compose({ selection: selectionOf("main", "absent") }), "publication-inputs:selection-invalid");
  });

  it("refuses an invalid canonical base or alias", () => {
    expectRefused(compose({ base: { canonical: "ftp://example.org", aliases: [] } }), "publication-inputs:base-invalid");
    expectRefused(compose({ base: { canonical: "https://example.org/", aliases: [] } }), "publication-inputs:base-invalid");
    expectRefused(
      compose({ base: { canonical: "https://example.org", aliases: ["https://UPPER.example.org"] } }),
      "publication-inputs:base-invalid",
    );
  });

  it("refuses an invalid locale policy", () => {
    expectRefused(compose({ localePolicy: policy(["en"], "en", {}) }), "publication-inputs:locale-policy-invalid");
    expectRefused(
      compose({ localePolicy: { supportedLocales: ["en-001"], defaultLocale: "en-001", languagePreferences: {}, extra: true } }),
      "publication-inputs:locale-policy-invalid",
    );
    expectRefused(
      compose({ localePolicy: { supportedLocales: ["en-001"], languagePreferences: {} } }),
      "publication-inputs:locale-policy-invalid",
    );
    expectRefused(compose({ localePolicy: policy([], "en-001", {}) }), "publication-inputs:locale-policy-invalid");
  });

  it("refuses non-canonical, duplicate and case-colliding locales", () => {
    expectRefused(compose({ localePolicy: policy(["en-001", "EN-001"], "en-001") }), "publication-inputs:locale-policy-invalid");
    expectRefused(
      compose({ localePolicy: policy(["zh-Hans-CN", "zh-hans-cn"], "zh-Hans-CN", {}) }),
      "publication-inputs:locale-policy-invalid",
    );
    expectRefused(compose({ localePolicy: policy(["en-001", "en-001"], "en-001") }), "publication-inputs:locale-policy-invalid");
  });

  it("refuses an explicit short mapping that is not the approved English alias", () => {
    expectRefused(
      compose({ localePolicy: policy(["en-001", "de-DE"], "en-001", { en: "de-DE" }) }),
      "publication-inputs:locale-policy-invalid",
    );
    expectRefused(
      compose({ localePolicy: policy(["de-DE"], "de-DE", { en: "en-001" }) }),
      "publication-inputs:locale-policy-invalid",
    );
  });

  it("refuses policies beyond the declared bounds", () => {
    const many = Array.from({ length: UNO_SITE_PUBLICATION_INPUT_LIMITS.supportedLocales + 1 }, (_, index) =>
      `aa-${String(index + 1).padStart(3, "0")}`,
    );
    expectRefused(compose({ localePolicy: policy(many, "aa-001", {}) }), "publication-inputs:locale-policy-invalid");

    const preferences: Record<string, string> = {};
    for (let index = 0; index < UNO_SITE_PUBLICATION_INPUT_LIMITS.languagePreferences + 1; index += 1) {
      preferences[`a${String.fromCharCode(97 + index)}`] = "en-001";
    }
    expectRefused(
      compose({ localePolicy: policy(["en-001"], "en-001", preferences) }),
      "publication-inputs:locale-policy-invalid",
    );
  });
});


describe("request shape and hostile values", () => {
  it("refuses non-object roots without throwing", () => {
    for (const value of [null, undefined, [], [LOCAL_BASE], 0, "", true, "manifest"]) {
      const result = validateUnoSitePublicationInputs(value);
      expect(result.accepted).toBe(false);
      if (result.accepted) return;
      expect(CODES).toContain(result.reason);
    }
  });

  it("refuses a missing or extra request key instead of ignoring it", () => {
    expectRefused(
      validateUnoSitePublicationInputs({ manifest: readJson(MANIFEST_URL), selection: readJson(CONFIG_URL), base: LOCAL_BASE }),
      "publication-inputs:input-shape",
    );
    expectRefused(
      validateUnoSitePublicationInputs({
        manifest: readJson(MANIFEST_URL),
        selection: readJson(CONFIG_URL),
        base: LOCAL_BASE,
        localePolicy: EN_ONLY(),
        published: true,
      }),
      "publication-inputs:input-shape",
    );
    expect(UNO_SITE_PUBLICATION_INPUT_KEYS).toEqual(["manifest", "selection", "base", "localePolicy"]);
  });

  it("refuses a wrong field kind", () => {
    expectRefused(compose({ manifest: "deployment/efs/manifest.json" }), "publication-inputs:input-shape");
    expectRefused(compose({ selection: null }), "publication-inputs:input-shape");
    expectRefused(compose({ base: [] }), "publication-inputs:input-shape");
    // A policy that is not a record is a request-shape failure, not a policy-content one.
    expectRefused(compose({ localePolicy: "en-001" }), "publication-inputs:input-shape");
  });

  it("refuses an accessor root with zero getter invocations", () => {
    let reads = 0;
    const request = {
      get manifest(): unknown {
        reads += 1;
        return readJson(MANIFEST_URL);
      },
      selection: readJson(CONFIG_URL),
      base: LOCAL_BASE,
      localePolicy: EN_ONLY(),
    };
    expectRefused(validateUnoSitePublicationInputs(request), "publication-inputs:input-not-plain");
    expect(reads).toBe(0);
  });

  it("refuses a policy accessor without invoking it", () => {
    let reads = 0;
    const hostile = {
      supportedLocales: ["en-001"],
      defaultLocale: "en-001",
      get languagePreferences(): Record<string, string> {
        reads += 1;
        return { en: "en-001" };
      },
    };
    expectRefused(compose({ localePolicy: hostile }), "publication-inputs:input-not-plain");
    expect(reads).toBe(0);
  });

  it("refuses symbol keys, exotic prototypes and a throwing Proxy", () => {
    const withSymbol: Record<PropertyKey, unknown> = {
      manifest: manifestOf([siteOf("main", [homePage(["en-001"])])]),
      selection: selectionOf(),
      base: LOCAL_BASE,
      localePolicy: EN_ONLY(),
    };
    withSymbol[Symbol("extra")] = true;
    expectRefused(validateUnoSitePublicationInputs(withSymbol), "publication-inputs:input-not-plain");

    class Exotic {
      manifest = manifestOf([siteOf("main", [homePage(["en-001"])])]);
      selection = selectionOf();
      base = LOCAL_BASE;
      localePolicy = EN_ONLY();
    }
    expectRefused(validateUnoSitePublicationInputs(new Exotic()), "publication-inputs:input-not-plain");

    const hostile = new Proxy(
      { manifest: {}, selection: {}, base: {}, localePolicy: {} },
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    expectRefused(validateUnoSitePublicationInputs(hostile), "publication-inputs:unreadable");
  });

  it("refuses a sparse or accessor locale array without reading it", () => {
    const sparse = ["en-001"];
    sparse.length = 2;
    expectRefused(
      compose({ localePolicy: { supportedLocales: sparse, defaultLocale: "en-001", languagePreferences: {} } }),
      "publication-inputs:input-not-plain",
    );

    const accessor: string[] = ["en-001"];
    Object.defineProperty(accessor, "0", {
      get(): string {
        throw new Error("accessor");
      },
      enumerable: true,
      configurable: true,
    });
    expectRefused(
      compose({ localePolicy: { supportedLocales: accessor, defaultLocale: "en-001", languagePreferences: {} } }),
      "publication-inputs:input-not-plain",
    );
  });

  it("keeps one closed, duplicate-free refusal vocabulary", () => {
    expect(CODES).toHaveLength(11);
    expect(new Set(CODES).size).toBe(11);
    expect(Object.isFrozen(CODES)).toBe(true);
    for (const code of [
      "publication-inputs:input-not-plain",
      "publication-inputs:input-shape",
      "publication-inputs:unreadable",
      "publication-inputs:manifest-invalid",
      "publication-inputs:selection-invalid",
      "publication-inputs:base-invalid",
      "publication-inputs:locale-policy-invalid",
      "publication-inputs:unsupported-representation",
      "publication-inputs:unrepresented-supported-locale",
      "publication-inputs:default-home-missing",
      "publication-inputs:route-index-invalid",
    ]) {
      expect(CODES).toContain(code as UnoSitePublicationInputsRefusal);
    }
  });

  it("echoes no rejected host, path or locale back to the caller", () => {
    const rejected = compose({ base: { canonical: "https://LEAK.example.org/site", aliases: [] } });
    expectRefused(rejected, "publication-inputs:base-invalid");
    const serialised = JSON.stringify(rejected);
    expect(serialised).toBe('{"accepted":false,"reason":"publication-inputs:base-invalid"}');
    for (const leak of ["LEAK", "example.org", "/site"]) {
      expect(serialised.includes(leak)).toBe(false);
    }
  });
});

describe("the stored policy composes with this validator (`UNO-WO-025 / R01`)", () => {
  it("accepts the committed policy derived from the committed files with a test-only loopback base", () => {
    const manifest = readJson(MANIFEST_URL);
    const selection = readJson(CONFIG_URL);

    const stored = resolveUnoCommittedLocales({ manifest, selection });
    expect(stored.accepted).toBe(true);
    if (!stored.accepted) return;

    const checked = validateUnoSitePublicationInputs({
      manifest,
      selection,
      base: { canonical: "http://localhost:3000", aliases: [] },
      localePolicy: stored.localePolicy,
    });
    expectAccepted(checked);

    expect(checked.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(checked.localePolicy.supportedLocales).toEqual(["en-001"]);
    expect(checked.localePolicy.defaultLocale).toBe("en-001");
    expect({ ...checked.localePolicy.languagePreferences }).toEqual({ en: "en-001" });
    expect(checked.candidateCount).toBe(3);
    expect(JSON.stringify(checked).includes("https://")).toBe(false);
    for (const forbidden of ["published", "authorized", "ready", "canonicalUrl", "hreflang", "sitemap"]) {
      expect(Object.keys(checked)).not.toContain(forbidden);
    }
  });

  it("reads the committed stored base as the reserved sample canonical, not a test-only proposal", () => {
    const stored = resolveUnoCommittedBase({ manifest: readJson(MANIFEST_URL), selection: readJson(CONFIG_URL) });
    expect(stored.accepted).toBe(true);
    if (!stored.accepted) return;
    expect(stored.base).toEqual({ canonical: "https://uno-starter.example", aliases: [] });
    expect(stored.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });

    // A candidate count is never a publication decision: the composition still reports three candidates only.
    const checked = validateUnoSitePublicationInputs({
      manifest: readJson(MANIFEST_URL),
      selection: readJson(CONFIG_URL),
      base: { canonical: "https://uno-starter.example", aliases: [] },
      localePolicy: EN_ONLY(),
    });
    expectAccepted(checked);
    expect(checked.candidateCount).toBe(3);
    expect(JSON.stringify(checked).includes('"published"')).toBe(false);
  });

  it("fails when either stored authority is deleted, without inventing an alias", () => {
    const manifest = readJson(MANIFEST_URL) as {
      entities: { facets: { sites: Record<string, unknown>[] }[] }[];
    };
    const selection = readJson(CONFIG_URL) as Record<string, unknown>;

    delete manifest.entities[0]!.facets[0]!.sites[0]!.locales;
    expect(
      resolveUnoCommittedLocales({ manifest, selection: readJson(CONFIG_URL) }).accepted,
    ).toBe(false);

    const withoutMapping = { ...selection };
    delete withoutMapping.languagePreferences;
    expect(resolveUnoCommittedLocales({ manifest: readJson(MANIFEST_URL), selection: withoutMapping }).accepted).toBe(
      false,
    );
  });
});

/**
 * T10 — `UNO-WO-086 / R01` (M9): Site-qualified publication inputs.
 *
 * One synthetic Entity with three bound Sites: `corporate/main` and `corporate/docs` on one origin (root and `/docs`),
 * and `services/main` on a second origin. Every declared source path is unique across the whole manifest, every Site
 * authors its own locales, and the two Sites named `main` differ only by Facet — which is exactly what must keep them
 * apart. All hosts, bases and policies below are synthetic fixtures, never a deployment decision.
 */
const M9_CORPORATE_MAIN = { facetId: "corporate", siteId: "main" } as const;
const M9_CORPORATE_DOCS = { facetId: "corporate", siteId: "docs" } as const;
const M9_SERVICES_MAIN = { facetId: "services", siteId: "main" } as const;

function m9Page(id: string, route: readonly string[], locales: readonly string[], slug: string) {
  return {
    id,
    route: [...route],
    representations: locales.map((locale) => ({
      locale,
      sources: [{ kind: "markdown", path: `deployment/efs/content/${slug}.${locale}.md` }],
    })),
  };
}

const M9_MANIFEST = {
  entities: [
    {
      id: ENTITY_ID,
      facets: [
        {
          id: "corporate",
          sites: [
            {
              id: "main",
              pages: [
                m9Page("home", ["home"], ["en-001"], "corp-main-home"),
                m9Page("about", ["about"], ["en-001"], "corp-main-about"),
              ],
            },
            {
              id: "docs",
              locales: { supportedLocales: ["en-001", "fr-FR"], defaultLocale: "en-001" },
              pages: [
                m9Page("home", ["home"], ["en-001", "fr-FR"], "corp-docs-home"),
                m9Page("guide", ["guide"], ["en-001", "fr-FR"], "corp-docs-guide"),
              ],
            },
          ],
        },
        {
          id: "services",
          sites: [
            {
              id: "main",
              pages: [
                m9Page("home", ["home"], ["de-DE"], "svc-main-home"),
                m9Page("offers", ["offers"], ["de-DE"], "svc-main-offers"),
              ],
            },
          ],
        },
      ],
    },
  ],
};

function m9Address(withDefault = false) {
  return {
    version: 2,
    entityId: ENTITY_ID,
    sites: [
      { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
      { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
      { facetId: "services", siteId: "main", origin: "https://xyz.example" },
    ],
    ...(withDefault ? { default: { facetId: "corporate", siteId: "main" } } : {}),
  };
}

const M9_BASE_CORPORATE_MAIN = { canonical: "https://abc.example", aliases: [] as string[] };
const M9_BASE_CORPORATE_DOCS = { canonical: "https://abc.example/docs", aliases: [] as string[] };
const M9_BASE_SERVICES_MAIN = { canonical: "https://xyz.example", aliases: [] as string[] };

function m9Policy(supportedLocales: string[], defaultLocale: string) {
  return { supportedLocales, defaultLocale, languagePreferences: {} };
}

const M9_POLICY_CORPORATE_MAIN = m9Policy(["en-001"], "en-001");
const M9_POLICY_CORPORATE_DOCS = m9Policy(["en-001", "fr-FR"], "en-001");
const M9_POLICY_SERVICES_MAIN = m9Policy(["de-DE"], "de-DE");

describe("site-qualified publication inputs (v2)", () => {
  it("composes publication inputs for three independently bound Sites", () => {
    const corporateMain = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_CORPORATE_MAIN,
      base: M9_BASE_CORPORATE_MAIN,
      localePolicy: M9_POLICY_CORPORATE_MAIN,
    });
    expect(corporateMain.accepted).toBe(true);
    if (corporateMain.accepted) {
      expect(corporateMain.site).toEqual({
        entityId: ENTITY_ID,
        facetId: "corporate",
        siteId: "main",
      });
      expect(corporateMain.canonicalBase).toEqual({ origin: "https://abc.example", pathPrefix: "" });
      expect(corporateMain.candidateCount).toBe(2);
    }

    const corporateDocs = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_CORPORATE_DOCS,
      base: M9_BASE_CORPORATE_DOCS,
      localePolicy: M9_POLICY_CORPORATE_DOCS,
    });
    expect(corporateDocs.accepted).toBe(true);
    if (corporateDocs.accepted) {
      expect(corporateDocs.canonicalBase).toEqual({ origin: "https://abc.example", pathPrefix: "/docs" });
      expect(corporateDocs.candidateCount).toBe(4);
      expect(corporateDocs.localePolicy.supportedLocales).toEqual(["en-001", "fr-FR"]);
    }

    const servicesMain = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_SERVICES_MAIN,
      base: M9_BASE_SERVICES_MAIN,
      localePolicy: M9_POLICY_SERVICES_MAIN,
    });
    expect(servicesMain.accepted).toBe(true);
    if (servicesMain.accepted) {
      expect(servicesMain.canonicalBase).toEqual({ origin: "https://xyz.example", pathPrefix: "" });
      expect(servicesMain.candidateCount).toBe(2);
    }
  });

  it("keeps two Sites named main distinct because their Facets differ", () => {
    const corporate = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_CORPORATE_MAIN,
      base: M9_BASE_CORPORATE_MAIN,
      localePolicy: M9_POLICY_CORPORATE_MAIN,
    });
    const services = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_SERVICES_MAIN,
      base: M9_BASE_SERVICES_MAIN,
      localePolicy: M9_POLICY_SERVICES_MAIN,
    });
    expect(corporate.accepted && services.accepted).toBe(true);
    if (corporate.accepted && services.accepted) {
      expect(corporate.site.siteId).toBe(services.site.siteId);
      expect(corporate.site.facetId).not.toBe(services.site.facetId);
      expect(corporate.canonicalBase).not.toEqual(services.canonicalBase);
    }
    // The `services` base can never be accepted for `corporate/main` even though the Site id matches.
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_MAIN,
        base: M9_BASE_SERVICES_MAIN,
        localePolicy: M9_POLICY_CORPORATE_MAIN,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:base-invalid" });
  });

  it("does not disable another Site when a default names one Site", () => {
    const withoutDefault = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_SERVICES_MAIN,
      base: M9_BASE_SERVICES_MAIN,
      localePolicy: M9_POLICY_SERVICES_MAIN,
    });
    const withDefault = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(true),
      site: M9_SERVICES_MAIN,
      base: M9_BASE_SERVICES_MAIN,
      localePolicy: M9_POLICY_SERVICES_MAIN,
    });
    expect(withDefault).toEqual(withoutDefault);
    expect(withDefault.accepted).toBe(true);
  });

  it("counts only the requested Site's own candidate addresses", () => {
    const counts: number[] = [];
    for (const request of [
      { site: M9_CORPORATE_MAIN, base: M9_BASE_CORPORATE_MAIN, localePolicy: M9_POLICY_CORPORATE_MAIN },
      { site: M9_CORPORATE_DOCS, base: M9_BASE_CORPORATE_DOCS, localePolicy: M9_POLICY_CORPORATE_DOCS },
      { site: M9_SERVICES_MAIN, base: M9_BASE_SERVICES_MAIN, localePolicy: M9_POLICY_SERVICES_MAIN },
    ]) {
      const result = validateUnoSitePublicationInputs({ manifest: M9_MANIFEST, selection: m9Address(), ...request });
      expect(result.accepted).toBe(true);
      if (result.accepted) counts.push(result.candidateCount);
    }
    // Two plus four plus two is the whole index; no Site reports any of another Site's candidates.
    expect(counts).toEqual([2, 4, 2]);
    expect(counts.reduce((total, count) => total + count, 0)).toBe(8);
  });

  it("refuses when one Site cannot satisfy another Site's locales or Home", () => {
    // `corporate/main` authors only en-001, so the `docs` policy's fr-FR is not represented there.
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_MAIN,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: M9_POLICY_CORPORATE_DOCS,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:unrepresented-supported-locale" });

    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_MAIN,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: M9_POLICY_SERVICES_MAIN,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:unsupported-representation" });

    // A Site that declares its own locales refuses any policy that is not that declaration.
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_DOCS,
        base: M9_BASE_CORPORATE_DOCS,
        localePolicy: m9Policy(["en-001"], "en-001"),
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:locale-policy-invalid" });

    // Home authored in en-001 only: a fr-FR default is a missing Home, not a translation to invent.
    const noFrenchHome = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            {
              id: "corporate",
              sites: [
                {
                  id: "main",
                  pages: [
                    m9Page("home", ["home"], ["en-001"], "solo-home"),
                    m9Page("about", ["about"], ["en-001", "fr-FR"], "solo-about"),
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(
      validateUnoSitePublicationInputs({
        manifest: noFrenchHome,
        selection: {
          version: 2,
          entityId: ENTITY_ID,
          sites: [{ facetId: "corporate", siteId: "main", origin: "https://abc.example" }],
        },
        site: M9_CORPORATE_MAIN,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: m9Policy(["en-001", "fr-FR"], "fr-FR"),
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:default-home-missing" });
  });

  it("refuses a base or alias set borrowed from a sibling Site", () => {
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_DOCS,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: M9_POLICY_CORPORATE_DOCS,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:base-invalid" });

    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_DOCS,
        base: { canonical: "https://abc.example/docs", aliases: ["https://abc.example/old"] },
        localePolicy: M9_POLICY_CORPORATE_DOCS,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:base-invalid" });
  });

  it("refuses a Site with no qualified binding and returns no partial result", () => {
    const unbound = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: { facetId: "corporate", siteId: "archive" },
      base: M9_BASE_CORPORATE_MAIN,
      localePolicy: M9_POLICY_CORPORATE_MAIN,
    });
    expect(unbound).toEqual({ accepted: false, reason: "publication-inputs:selection-invalid" });

    // The right Site id under the wrong Facet is a different Site, so it is not found either.
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: { facetId: "services", siteId: "docs" },
        base: M9_BASE_CORPORATE_DOCS,
        localePolicy: M9_POLICY_CORPORATE_DOCS,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:selection-invalid" });
  });

  it("accepts thirty-three authored full locales for one Site", () => {
    const locales = Array.from({ length: 33 }, (_, index) => `de-${String(101 + index)}`);
    const wide = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            {
              id: "corporate",
              sites: [{ id: "main", pages: [m9Page("home", ["home"], locales, "wide-home")] }],
            },
          ],
        },
      ],
    };
    const result = validateUnoSitePublicationInputs({
      manifest: wide,
      selection: {
        version: 2,
        entityId: ENTITY_ID,
        sites: [{ facetId: "corporate", siteId: "main", origin: "https://abc.example" }],
      },
      site: M9_CORPORATE_MAIN,
      base: M9_BASE_CORPORATE_MAIN,
      localePolicy: m9Policy(locales, "de-101"),
    });
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.localePolicy.supportedLocales.length).toBe(33);
      expect(result.candidateCount).toBe(33);
    }
  });

  it("refuses duplicate and invalid locale tags before any publication decision", () => {
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_MAIN,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: m9Policy(["en-001", "en-001"], "en-001"),
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:locale-policy-invalid" });

    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_MAIN,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: m9Policy(["not-a-locale!"], "not-a-locale!"),
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:locale-policy-invalid" });

    // A policy whose default is not among its own supported locales is not a policy.
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: M9_CORPORATE_MAIN,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: m9Policy(["en-001"], "fr-FR"),
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:locale-policy-invalid" });
  });

  it("refuses accessors, symbols, extra keys and wrong Site shapes without running a getter", () => {
    let invoked = 0;
    const hostile = {
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_CORPORATE_MAIN,
      get base() {
        invoked += 1;
        return M9_BASE_CORPORATE_MAIN;
      },
      localePolicy: M9_POLICY_CORPORATE_MAIN,
    };
    expect(validateUnoSitePublicationInputs(hostile)).toEqual({
      accepted: false,
      reason: "publication-inputs:input-not-plain",
    });
    expect(invoked).toBe(0);

    const extraKey = { ...m9Address() };
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: { ...M9_CORPORATE_MAIN, extra: "x" },
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: M9_POLICY_CORPORATE_MAIN,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:input-shape" });
    expect(extraKey.version).toBe(2);

    // The selector is a pair only: a Site named by id alone is not a qualified Site.
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: { siteId: "main" },
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: M9_POLICY_CORPORATE_MAIN,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:input-shape" });

    const symbolKeyed = { ...M9_CORPORATE_MAIN } as Record<PropertyKey, unknown>;
    symbolKeyed[Symbol("facet")] = "services";
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        site: symbolKeyed,
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: M9_POLICY_CORPORATE_MAIN,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:input-not-plain" });

    // A v1-shaped request is never read as a Site-qualified one: without `site` the address declaration is not a legacy
    // selection, so the legacy contract refuses it rather than publishing from it.
    expect(
      validateUnoSitePublicationInputs({
        manifest: M9_MANIFEST,
        selection: m9Address(),
        base: M9_BASE_CORPORATE_MAIN,
        localePolicy: M9_POLICY_CORPORATE_MAIN,
      }),
    ).toEqual({ accepted: false, reason: "publication-inputs:selection-invalid" });
  });

  it("returns deeply frozen, independently allocated and deterministic results", () => {
    const first = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_CORPORATE_DOCS,
      base: M9_BASE_CORPORATE_DOCS,
      localePolicy: M9_POLICY_CORPORATE_DOCS,
    });
    const second = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_CORPORATE_DOCS,
      base: M9_BASE_CORPORATE_DOCS,
      localePolicy: M9_POLICY_CORPORATE_DOCS,
    });
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.accepted).toBe(true);
    if (first.accepted && second.accepted) {
      expect(first.localePolicy).not.toBe(second.localePolicy);
      expect(first.localePolicy.supportedLocales).not.toBe(second.localePolicy.supportedLocales);
      expect(Object.isFrozen(first)).toBe(true);
      expect(Object.isFrozen(first.site)).toBe(true);
      expect(Object.isFrozen(first.canonicalBase)).toBe(true);
      expect(Object.isFrozen(first.aliases)).toBe(true);
      expect(Object.isFrozen(first.localePolicy)).toBe(true);
      expect(Object.isFrozen(first.localePolicy.supportedLocales)).toBe(true);
      expect(Object.isFrozen(first.localePolicy.languagePreferences)).toBe(true);
    }
  });

  it("accepts 513 distinct authored full locales under the shared manifest budget", () => {
    // The former 512 was a per-Site count ceiling; the only remaining bound is the single documented machine-safety
    // budget the manifest validator already applies to a Site's own `supportedLocales`.
    expect(UNO_SITE_PUBLICATION_LOCALE_BUDGET).toBe(MANIFEST_GRAPH_LIMITS.hierarchyDeclarations);
    expect(UNO_SITE_PUBLICATION_LOCALE_BUDGET).toBeGreaterThan(512);

    // 27 real ISO 639-1 languages x 19 real ISO 3166-1 alpha-2 regions = 513 distinct authored full locales.
    const languages = [
      "en", "de", "fr", "es", "it", "pt", "nl", "sv", "da", "fi", "nb", "pl", "cs", "sk",
      "hu", "ro", "bg", "el", "tr", "ru", "uk", "ar", "hi", "ja", "ko", "zh", "th",
    ];
    const regions = [
      "US", "GB", "DE", "FR", "ES", "IT", "PT", "NL", "SE", "DK", "FI", "NO", "PL", "CZ",
      "SK", "HU", "RO", "BG", "GR", "RU",
    ].slice(0, 19);
    const locales: string[] = [];
    for (const language of languages) for (const region of regions) locales.push(`${language}-${region}`);
    expect(locales).toHaveLength(513);
    expect(new Set(locales).size).toBe(513);

    const wide = {
      entities: [
        {
          id: ENTITY_ID,
          facets: [
            {
              id: "corporate",
              sites: [
                {
                  id: "main",
                  locales: { supportedLocales: [...locales], defaultLocale: locales[0] },
                  pages: [m9Page("home", ["home"], locales, "wide513-home")],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = validateUnoSitePublicationInputs({
      manifest: wide,
      selection: {
        version: 2,
        entityId: ENTITY_ID,
        sites: [{ facetId: "corporate", siteId: "main", origin: "https://abc.example" }],
      },
      site: M9_CORPORATE_MAIN,
      base: M9_BASE_CORPORATE_MAIN,
      localePolicy: m9Policy([...locales], locales[0] as string),
    });
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.localePolicy.supportedLocales).toHaveLength(513);
      expect(result.candidateCount).toBe(513);
    }
    // The v1 compatibility ceiling is unchanged and still refuses the same oversized policy it always did.
    expect(UNO_SITE_PUBLICATION_INPUT_LIMITS.supportedLocales).toBe(32);
  });

  it("refuses a policy at the shared budget boundary before per-entry validation", () => {
    const overBoundary = Array.from(
      { length: UNO_SITE_PUBLICATION_LOCALE_BUDGET + 1 },
      () => "en-001",
    );
    const result = validateUnoSitePublicationInputs({
      manifest: M9_MANIFEST,
      selection: m9Address(),
      site: M9_CORPORATE_MAIN,
      base: M9_BASE_CORPORATE_MAIN,
      localePolicy: m9Policy(overBoundary, "en-001"),
    });
    // The count guard precedes tag and membership validation, which is what keeps an oversized policy cheap to refuse.
    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.reason).toBe("publication-inputs:locale-policy-invalid");
    }
  });
});
