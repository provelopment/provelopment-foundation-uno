import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  UNO_SITE_PUBLICATION_INPUT_KEYS,
  UNO_SITE_PUBLICATION_INPUT_LIMITS,
  UNO_SITE_PUBLICATION_INPUT_REFUSALS,
  validateUnoSitePublicationInputs,
  type UnoSitePublicationInputsRefusal,
  type UnoSitePublicationResult,
} from "../../src/application/validate-uno-site-publication-inputs";
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
