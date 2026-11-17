import { describe, expect, it } from "vitest";

import {
  UNO_PUBLIC_DISCOVERY_INPUT_KEYS,
  UNO_PUBLIC_DISCOVERY_REFUSAL_REASONS,
  planUnoPublicDiscovery,
  type UnoPublicDiscoveryRefusal,
  type UnoPublicDiscoveryResult,
} from "../../src/application/plan-uno-public-discovery";

/**
 * U03 public discovery tests (`UNO-WO-028 / R01`).
 *
 * The planner is pure: it consumes an already-accepted collection of published-Page plans, so these cases
 * exercise the advertising rules in isolation. The real composition — confined loader, planner and this
 * planner together — is proved in `efs-uno-published-page.test.ts`, which feeds real fixture decisions here.
 */

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

/** One accepted published-Page decision, in exactly the shape the published-Page planner returns. */
function decision(options: {
  readonly pageId: string;
  readonly routePath: string;
  readonly localeTag: string;
  readonly url: string;
  readonly unlisted?: boolean;
  readonly siteId?: string;
}): Record<string, unknown> {
  const unlisted = options.unlisted === true;
  return {
    accepted: true,
    identity: {
      entityId: ENTITY_ID,
      facetId: "foundation",
      siteId: options.siteId ?? "main",
      pageId: options.pageId,
      localeTag: options.localeTag,
      localePathKey: options.localeTag,
      routePath: options.routePath,
      pathname:
        options.routePath === ""
          ? `/${options.localeTag}`
          : `/${options.localeTag}/${options.routePath}`,
    },
    document: { kind: "markdown", title: options.pageId, visibility: unlisted ? "unlisted" : "public" },
    delivery: {
      canonicalUrl: options.url,
      robots: unlisted ? "noindex,nofollow" : null,
      public: !unlisted,
      unlisted,
      indexable: !unlisted,
      eligible: {
        navigation: !unlisted,
        sitemap: !unlisted,
        hreflang: !unlisted,
        xDefault: !unlisted,
        languageSwitch: !unlisted,
        automaticLocaleRedirectTarget: !unlisted,
      },
      supportedLocales: ["en-001"],
      defaultLocale: "en-001",
      languagePreferences: {},
    },
  };
}

/** The one-locale Site authority these cases use. */
const LOCALES = { supportedLocales: ["en-001"], defaultLocale: "en-001" };

/** Assert one exact closed refusal. */
function expectRefused(result: UnoPublicDiscoveryResult, code: UnoPublicDiscoveryRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(UNO_PUBLIC_DISCOVERY_REFUSAL_REASONS).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

describe("discovery of published public Pages", () => {
  it("emits the Home and a non-Home Page as sorted canonical entries", () => {
    const result = planUnoPublicDiscovery({
      decisions: [
        decision({ pageId: "home", routePath: "", localeTag: "en-001", url: "https://example.org/en-001" }),
        decision({
          pageId: "about",
          routePath: "about",
          localeTag: "en-001",
          url: "https://example.org/en-001/about",
        }),
      ],
      locales: LOCALES,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(result.defaultLocale).toBe("en-001");
    expect(result.sitemapUrls).toEqual([
      "https://example.org/en-001",
      "https://example.org/en-001/about",
    ]);
    expect(result.entries.map((entry) => entry.pageId)).toEqual(["home", "about"]);
    // x-default belongs to the reserved Home and points at the published public default locale.
    expect(result.entries[0]?.xDefault).toBe("https://example.org/en-001");
    expect(result.entries[1]?.xDefault).toBeUndefined();
  });

  it("builds same-Page locale alternates and never leaks an unlisted one", () => {
    const result = planUnoPublicDiscovery({
      decisions: [
        decision({ pageId: "home", routePath: "", localeTag: "en-001", url: "https://example.org/en-001" }),
        decision({ pageId: "home", routePath: "", localeTag: "en-002", url: "https://example.org/en-002" }),
        decision({
          pageId: "home",
          routePath: "",
          localeTag: "en-003",
          url: "https://example.org/en-003",
          unlisted: true,
        }),
        decision({
          pageId: "about",
          routePath: "about",
          localeTag: "en-001",
          url: "https://example.org/en-001/about",
        }),
      ],
      locales: { supportedLocales: ["en-001", "en-002", "en-003"], defaultLocale: "en-001" },
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.sitemapUrls).toEqual([
      "https://example.org/en-001",
      "https://example.org/en-001/about",
      "https://example.org/en-002",
    ]);
    expect(JSON.stringify(result).includes("en-003")).toBe(false);

    const homeDefault = result.entries[0];
    expect(homeDefault?.canonicalUrl).toBe("https://example.org/en-001");
    expect(homeDefault?.alternates).toEqual([
      { localeTag: "en-002", href: "https://example.org/en-002" },
    ]);
    expect(homeDefault?.xDefault).toBe("https://example.org/en-001");
    expect(result.entries[1]?.alternates).toEqual([]);
    expect(result.entries[2]?.xDefault).toBe("https://example.org/en-001");
  });
});

describe("discovery refusals", () => {
  it("refuses when no decision is public", () => {
    expectRefused(
      planUnoPublicDiscovery({
        decisions: [
          decision({
            pageId: "home",
            routePath: "",
            localeTag: "en-001",
            url: "https://example.org/en-001",
            unlisted: true,
          }),
        ],
        locales: LOCALES,
      }),
      "discovery:url-invalid",
    );
  });

  it("refuses duplicate URLs, including a case-only difference", () => {
    for (const second of ["https://example.org/en-001", "https://EXAMPLE.org/en-001"]) {
      expectRefused(
        planUnoPublicDiscovery({
          decisions: [
            decision({ pageId: "home", routePath: "", localeTag: "en-001", url: "https://example.org/en-001" }),
            decision({ pageId: "about", routePath: "about", localeTag: "en-001", url: second }),
          ],
          locales: LOCALES,
        }),
        "discovery:duplicate-url",
      );
    }
  });

  it("refuses a duplicate Page locale and a second Site", () => {
    expectRefused(
      planUnoPublicDiscovery({
        decisions: [
          decision({ pageId: "home", routePath: "", localeTag: "en-001", url: "https://example.org/en-001" }),
          decision({
            pageId: "home",
            routePath: "",
            localeTag: "en-001",
            url: "https://example.org/en-001/",
          }),
        ],
        locales: LOCALES,
      }),
      "discovery:duplicate-page",
    );
    expectRefused(
      planUnoPublicDiscovery({
        decisions: [
          decision({ pageId: "home", routePath: "", localeTag: "en-001", url: "https://example.org/en-001" }),
          decision({
            pageId: "about",
            routePath: "about",
            localeTag: "en-001",
            url: "https://example.org/other/about",
            siteId: "other",
          }),
        ],
        locales: LOCALES,
      }),
      "discovery:site-mismatch",
    );
  });
});


describe("discovery policy inputs", () => {
  it("refuses an undeclared locale, an invalid locale policy and an unusable URL", () => {
    expectRefused(
      planUnoPublicDiscovery({
        decisions: [
          decision({ pageId: "home", routePath: "", localeTag: "en-999", url: "https://example.org/en-999" }),
        ],
        locales: LOCALES,
      }),
      "discovery:unsupported-locale",
    );

    for (const locales of [
      { supportedLocales: [] as string[], defaultLocale: "en-001" },
      { supportedLocales: ["en-001", "en-001"], defaultLocale: "en-001" },
      { supportedLocales: ["en-001"], defaultLocale: "en-002" },
    ]) {
      expectRefused(
        planUnoPublicDiscovery({
          decisions: [
            decision({ pageId: "home", routePath: "", localeTag: "en-001", url: "https://example.org/en-001" }),
          ],
          locales,
        }),
        "discovery:locale-invalid",
      );
    }

    for (const url of [
      "/en-001",
      "https://example.org/en-001?q=1",
      "https://example.org/en-001#x",
      "https://example.org/é",
      `https://example.org/${"a".repeat(400)}`,
    ]) {
      expectRefused(
        planUnoPublicDiscovery({
          decisions: [decision({ pageId: "home", routePath: "", localeTag: "en-001", url })],
          locales: LOCALES,
        }),
        "discovery:url-invalid",
      );
    }
  });

  it("refuses a malformed or contradictory decision", () => {
    const base = decision({
      pageId: "home",
      routePath: "",
      localeTag: "en-001",
      url: "https://example.org/en-001",
    });
    const contradictory = JSON.parse(JSON.stringify(base)) as Record<string, Record<string, unknown>>;
    contradictory["delivery"]!["unlisted"] = true;

    for (const invalid of [
      { accepted: false, reason: "publication:not-published" },
      { accepted: true },
      { ...base, identity: undefined },
      contradictory,
    ]) {
      expectRefused(
        planUnoPublicDiscovery({ decisions: [invalid], locales: LOCALES }),
        "discovery:invalid-decision",
      );
    }
  });

  it("refuses an empty, oversized or wrongly shaped request", () => {
    expectRefused(
      planUnoPublicDiscovery({ decisions: [], locales: LOCALES }),
      "discovery:input-invalid",
    );
    expectRefused(
      planUnoPublicDiscovery({ decisions: null, locales: LOCALES }),
      "discovery:input-invalid",
    );
    expectRefused(
      planUnoPublicDiscovery({ decisions: [], locales: LOCALES, extra: 1 }),
      "discovery:input-invalid",
    );

    const many = Array.from({ length: 257 }, (_unused, index) =>
      decision({
        pageId: index === 0 ? "home" : `page-${index}`,
        routePath: index === 0 ? "" : `page-${index}`,
        localeTag: "en-001",
        url: index === 0 ? "https://example.org/en-001" : `https://example.org/en-001/page-${index}`,
      }),
    );
    expectRefused(planUnoPublicDiscovery({ decisions: many, locales: LOCALES }), "discovery:too-many");
  });
});

describe("discovery determinism and hostile input", () => {
  it("is order-independent, fresh and frozen", () => {
    const home = decision({
      pageId: "home",
      routePath: "",
      localeTag: "en-001",
      url: "https://example.org/en-001",
    });
    const about = decision({
      pageId: "about",
      routePath: "about",
      localeTag: "en-001",
      url: "https://example.org/en-001/about",
    });

    const first = planUnoPublicDiscovery({ decisions: [home, about], locales: LOCALES });
    const second = planUnoPublicDiscovery({ decisions: [about, home], locales: LOCALES });
    expect(first.accepted && second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.entries)).toBe(true);
    expect(Object.isFrozen(first.entries[0])).toBe(true);
    expect(Object.isFrozen(first.sitemapUrls)).toBe(true);
  });

  it("refuses hostile input without invoking a getter", () => {
    let reads = 0;
    const hostile = {
      get decisions(): unknown {
        reads += 1;
        return [];
      },
      locales: LOCALES,
    };
    expectRefused(planUnoPublicDiscovery(hostile), "discovery:input-invalid");
    expect(reads).toBe(0);

    const withSymbol = { decisions: [], locales: LOCALES } as Record<PropertyKey, unknown>;
    withSymbol[Symbol("extra")] = true;
    expectRefused(planUnoPublicDiscovery(withSymbol), "discovery:input-invalid");

    const throwingProxy = new Proxy(
      {},
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    expectRefused(planUnoPublicDiscovery(throwingProxy), "discovery:unreadable");
  });

  it("keeps one frozen, complete vocabulary", () => {
    expect(UNO_PUBLIC_DISCOVERY_INPUT_KEYS).toEqual(["decisions", "locales"]);
    expect(Object.isFrozen(UNO_PUBLIC_DISCOVERY_INPUT_KEYS)).toBe(true);
    expect(Object.isFrozen(UNO_PUBLIC_DISCOVERY_REFUSAL_REASONS)).toBe(true);
    expect(new Set(UNO_PUBLIC_DISCOVERY_REFUSAL_REASONS).size).toBe(
      UNO_PUBLIC_DISCOVERY_REFUSAL_REASONS.length,
    );
  });
});
