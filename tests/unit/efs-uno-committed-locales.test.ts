import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  UNO_COMMITTED_LOCALES_INPUT_KEYS,
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
