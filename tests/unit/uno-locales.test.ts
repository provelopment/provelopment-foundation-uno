import { describe, expect, it } from "vitest";

import {
  canonicalLocaleTag,
  localePathKey,
  localePolicyIssue,
  localeTagIssue,
  selectUnoEntryLocale,
  type UnoLocalePolicy,
} from "../../src/core/efs/uno-locales";

/**
 * Regression tests for the Uno-owned locale policy.
 *
 * The policy is the Owner's R1/P04 rule: a published representation needs an authored
 * language AND region; a short language resolves only through an explicit declared mapping.
 * These cases deliberately prove that Uno does NOT inherit Foundation's implicit
 * preference-prefix selection, geo/country inference or script-only qualification.
 *
 * Nothing here is a route: no URL, redirect, fallback or published representation is
 * produced, so U03 remains the owner of real HTTP behaviour.
 */

const POLICY: UnoLocalePolicy = {
  supportedLocales: ["en-001", "de-DE"],
  defaultLocale: "en-001",
  languagePreferences: { en: "en-001", de: "de-DE" },
};

const WIDE: UnoLocalePolicy = {
  supportedLocales: ["en-001", "de-DE", "fr-FR", "zh-Hans-CN"],
  defaultLocale: "en-001",
  languagePreferences: { en: "en-001" },
};

describe("locale tag grammar — accepted", () => {
  it("accepts a language plus region", () => {
    for (const value of ["en-001", "de-DE", "fr-FR", "id-ID", "zh-Hans-CN"]) {
      expect(localeTagIssue(value)).toBeNull();
    }
  });

  it("accepts a well-shaped mixed-case incoming tag", () => {
    for (const value of ["de-de", "zh-hans-cn", "EN-001", "fr-fr", "sr-Latn-RS"]) {
      expect(localeTagIssue(value)).toBeNull();
    }
  });

  it("accepts a numeric region and a variant subtag", () => {
    expect(localeTagIssue("es-419")).toBeNull();
    expect(localeTagIssue("de-DE-1901")).toBeNull();
  });

  it("canonicalises to conventional casing without changing a numeric region", () => {
    expect(canonicalLocaleTag("en-001")).toBe("en-001");
    expect(canonicalLocaleTag("de-de")).toBe("de-DE");
    expect(canonicalLocaleTag("zh-hans-cn")).toBe("zh-Hans-CN");
    expect(canonicalLocaleTag("ES-419")).toBe("es-419");
    expect(canonicalLocaleTag("DE-de-1901")).toBe("de-DE-1901");
  });

  it("derives the lower-case URL path key", () => {
    expect(localePathKey("de-DE")).toBe("de-de");
    expect(localePathKey("zh-Hans-CN")).toBe("zh-hans-cn");
    expect(localePathKey("en-001")).toBe("en-001");
  });
});

describe("locale tag grammar — refused", () => {
  it("refuses a bare language, a bare script and a script-only tag", () => {
    for (const value of ["en", "de", "zh", "zh-Hans", "sr-Latn"]) {
      expect(localeTagIssue(value)).not.toBeNull();
    }
  });

  it("refuses a malformed or incomplete region", () => {
    for (const value of ["en-01", "en-0", "en-USA", "de-", "-DE", "en--DE"]) {
      expect(localeTagIssue(value)).not.toBeNull();
    }
  });

  it("refuses variants without a region", () => {
    expect(localeTagIssue("de-1901")).not.toBeNull();
  });

  it("refuses surrounding whitespace", () => {
    expect(localeTagIssue(" en-001")).not.toBeNull();
    expect(localeTagIssue("en-001 ")).not.toBeNull();
  });

  it("refuses unicode, control characters and over-long tags", () => {
    expect(localeTagIssue("en-00１")).not.toBeNull();
    expect(localeTagIssue("en-00\n1")).not.toBeNull();
    expect(localeTagIssue(`en-${"a".repeat(62)}`)).not.toBeNull();
  });

  it("refuses private extensions and non-strings", () => {
    for (const value of ["en-001-x-private", "x-private", "en-001-u-ca-gregory"]) {
      expect(localeTagIssue(value)).not.toBeNull();
    }
    for (const value of [null, undefined, 42, [], {}, ["en-001"]]) {
      expect(localeTagIssue(value)).not.toBeNull();
    }
  });

  it("refuses the empty value", () => {
    expect(localeTagIssue("")).not.toBeNull();
  });
});

describe("canonical and path-key helpers throw on invalid input", () => {
  it("never silently normalises an invalid tag", () => {
    expect(() => canonicalLocaleTag("en")).toThrow();
    expect(() => canonicalLocaleTag("zh-Hans")).toThrow();
    expect(() => canonicalLocaleTag(null)).toThrow();
    expect(() => localePathKey("en-01")).toThrow();
  });
});

describe("locale policy — accepted", () => {
  it("accepts a full-locale policy with explicit short mappings", () => {
    expect(localePolicyIssue(POLICY)).toBeNull();
    expect(localePolicyIssue(WIDE)).toBeNull();
  });

  it("accepts a Site with no English and no mappings at all", () => {
    expect(
      localePolicyIssue({
        supportedLocales: ["de-DE"],
        defaultLocale: "de-DE",
        languagePreferences: {},
      }),
    ).toBeNull();
  });
});

describe("locale policy — refused", () => {
  it("refuses a non-object, an empty supported list and unknown fields", () => {
    expect(localePolicyIssue(null)).not.toBeNull();
    expect(localePolicyIssue([])).not.toBeNull();
    expect(
      localePolicyIssue({ supportedLocales: [], defaultLocale: "en-001", languagePreferences: {} }),
    ).not.toBeNull();
    expect(localePolicyIssue({ ...POLICY, extra: true })).not.toBeNull();
  });

  it("refuses a bare locale, a non-canonical stored spelling and a duplicate", () => {
    for (const tag of ["en", "zh-Hans", "de-de", "DE-DE"]) {
      expect(
        localePolicyIssue({
          supportedLocales: [tag],
          defaultLocale: tag,
          languagePreferences: {},
        }),
      ).not.toBeNull();
    }
    expect(
      localePolicyIssue({
        supportedLocales: ["en-001", "en-001"],
        defaultLocale: "en-001",
        languagePreferences: {},
      }),
    ).not.toBeNull();
    expect(
      localePolicyIssue({
        supportedLocales: ["de-DE", "de-de"],
        defaultLocale: "de-DE",
        languagePreferences: {},
      }),
    ).not.toBeNull();
  });

  it("refuses a default that is not a declared member or not canonical", () => {
    expect(localePolicyIssue({ ...POLICY, defaultLocale: "fr-FR" })).not.toBeNull();
    expect(localePolicyIssue({ ...POLICY, defaultLocale: "en-01" })).not.toBeNull();
  });

  it("refuses a bad short mapping", () => {
    for (const preferences of [
      { EN: "en-001" },
      { engg: "en-001" },
      { en: "en" },
      { en: "en-us" },
      { en: "fr-FR" },
      { es: "es-ES" },
    ]) {
      expect(localePolicyIssue({ ...POLICY, languagePreferences: preferences })).not.toBeNull();
    }
  });

  it('refuses an "en" mapping that is not exactly "en-001"', () => {
    expect(
      localePolicyIssue({
        supportedLocales: ["en-GB"],
        defaultLocale: "en-GB",
        languagePreferences: { en: "en-GB" },
      }),
    ).toContain('"en-001"');
  });

  it("refuses a prototype-pollution key", () => {
    const preferences = JSON.parse('{"__proto__": "en-001"}') as Record<string, string>;
    expect(
      localePolicyIssue({
        supportedLocales: ["en-001"],
        defaultLocale: "en-001",
        languagePreferences: preferences,
      }),
    ).not.toBeNull();
  });
});

describe("entry locale selection — explicit first", () => {
  it("selects an explicit full locale, case-insensitively", () => {
    expect(selectUnoEntryLocale({ policy: POLICY, explicit: "de-DE" })).toEqual({
      kind: "selected",
      locale: "de-DE",
      source: "explicit",
    });
    expect(selectUnoEntryLocale({ policy: POLICY, explicit: "de-de" })).toEqual({
      kind: "selected",
      locale: "de-DE",
      source: "explicit",
    });
  });

  it("selects a short key ONLY through the declared mapping", () => {
    expect(selectUnoEntryLocale({ policy: POLICY, explicit: "en" })).toEqual({
      kind: "selected",
      locale: "en-001",
      source: "explicit",
    });
    expect(selectUnoEntryLocale({ policy: WIDE, explicit: "en" }).kind).toBe("selected");

    const unmapped: UnoLocalePolicy = {
      supportedLocales: ["en-001"],
      defaultLocale: "en-001",
      languagePreferences: {},
    };
    expect(selectUnoEntryLocale({ policy: unmapped, explicit: "en" }).kind).toBe("rejected");
  });

  it("rejects an unsupported explicit value and does not fall back", () => {
    const explicitWins = selectUnoEntryLocale({
      policy: POLICY,
      explicit: "en-US",
      savedPreference: "de-DE",
      acceptLanguage: "de-DE",
    });
    expect(explicitWins.kind).toBe("rejected");

    for (const explicit of ["fr-FR", "en-01", "en-001-x", ""]) {
      expect(
        selectUnoEntryLocale({ policy: POLICY, explicit, savedPreference: "de-DE" }).kind,
      ).toBe("rejected");
    }
  });

  it("matches a short key case-insensitively through the declared mapping", () => {
    // Incoming spellings are compared case-insensitively; only the stored map is canonical.
    expect(selectUnoEntryLocale({ policy: POLICY, explicit: "EN" })).toEqual({
      kind: "selected",
      locale: "en-001",
      source: "explicit",
    });
    expect(selectUnoEntryLocale({ policy: POLICY, explicit: "De" })).toEqual({
      kind: "selected",
      locale: "de-DE",
      source: "explicit",
    });
  });

  it("refuses a non-string explicit value", () => {
    expect(
      selectUnoEntryLocale({ policy: POLICY, explicit: 42 as unknown as string }).kind,
    ).toBe("rejected");
  });
});

describe("entry locale selection — preference ordering", () => {
  it("prefers a saved preference over Accept-Language", () => {
    expect(
      selectUnoEntryLocale({
        policy: POLICY,
        savedPreference: "de-DE",
        acceptLanguage: "en-001,de-DE;q=0.9",
      }),
    ).toEqual({ kind: "selected", locale: "de-DE", source: "saved" });
  });

  it("ignores an unknown saved preference and uses the header", () => {
    expect(
      selectUnoEntryLocale({
        policy: POLICY,
        savedPreference: "fr-FR",
        acceptLanguage: "de-DE",
      }),
    ).toEqual({ kind: "selected", locale: "de-DE", source: "accept-language" });
  });

  it("orders by q and breaks ties by original position", () => {
    expect(
      selectUnoEntryLocale({
        policy: POLICY,
        acceptLanguage: "en-001;q=0.4, de-DE;q=0.9",
      }).kind,
    ).toBe("selected");
    expect(
      selectUnoEntryLocale({
        policy: POLICY,
        acceptLanguage: "en-001;q=0.4, de-DE;q=0.9",
      }),
    ).toEqual({ kind: "selected", locale: "de-DE", source: "accept-language" });
    expect(
      selectUnoEntryLocale({ policy: POLICY, acceptLanguage: "de-DE, en-001" }),
    ).toEqual({ kind: "selected", locale: "de-DE", source: "accept-language" });
  });

  it("excludes q=0, wildcards and malformed quality values", () => {
    expect(
      selectUnoEntryLocale({ policy: POLICY, acceptLanguage: "de-DE;q=0, en-001;q=0.1" }),
    ).toEqual({ kind: "selected", locale: "en-001", source: "accept-language" });
    expect(
      selectUnoEntryLocale({ policy: POLICY, acceptLanguage: "*" }),
    ).toEqual({ kind: "selected", locale: "en-001", source: "default" });
    expect(
      selectUnoEntryLocale({ policy: POLICY, acceptLanguage: "de-DE;q=abc, en-001" }),
    ).toEqual({ kind: "selected", locale: "en-001", source: "accept-language" });
  });

  it("ignores an over-long header entirely", () => {
    const overlong = `de-DE, ${"en-001,".repeat(200)}`.slice(0, 1500);
    expect(selectUnoEntryLocale({ policy: POLICY, acceptLanguage: overlong })).toEqual({
      kind: "selected",
      locale: "en-001",
      source: "default",
    });
  });

  it("never invents a locale from a language or region prefix", () => {
    expect(selectUnoEntryLocale({ policy: POLICY, acceptLanguage: "en-US" })).toEqual({
      kind: "selected",
      locale: "en-001",
      source: "default",
    });
    const noEn: UnoLocalePolicy = {
      supportedLocales: ["en-001"],
      defaultLocale: "en-001",
      languagePreferences: {},
    };
    expect(selectUnoEntryLocale({ policy: noEn, acceptLanguage: "de" })).toEqual({
      kind: "selected",
      locale: "en-001",
      source: "default",
    });
  });

  it("resolves a header short language only through the declared mapping", () => {
    expect(
      selectUnoEntryLocale({ policy: POLICY, acceptLanguage: "en;q=0.8, de-DE;q=0.2" }),
    ).toEqual({ kind: "selected", locale: "en-001", source: "accept-language" });
  });
});

describe("entry locale selection — robustness", () => {
  it("rejects an invalid policy instead of throwing", () => {
    expect(
      selectUnoEntryLocale({ policy: { ...POLICY, supportedLocales: [] } }).kind,
    ).toBe("rejected");
  });

  it("rejects a malformed input object or an unknown field", () => {
    expect(selectUnoEntryLocale(null as unknown as never).kind).toBe("rejected");
    expect(
      selectUnoEntryLocale({ policy: POLICY, country: "DE" } as unknown as never).kind,
    ).toBe("rejected");
  });

  it("returns a locale decision only — no URL, slug or representation", () => {
    const result = selectUnoEntryLocale({ policy: POLICY });
    expect(Object.keys(result).sort()).toEqual(["kind", "locale", "source"]);
    expect(result).toEqual({ kind: "selected", locale: "en-001", source: "default" });
  });
});
