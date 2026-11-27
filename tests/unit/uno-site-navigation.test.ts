/**
 * Foundation Uno — the presentation configuration and the Site navigation it orders (`U04`, navigation).
 *
 * Two halves, both pure. The **validator** pins the closed envelope of `deployment/site.config.json`: a version, a list of
 * Site entries, and nothing else — no field can be added that a later reader would silently honour. The **planner** pins the
 * eligibility gate: an entry exists only where the referenced Page is an accepted public Page of this Site in this locale, so
 * an unlisted, unpublished, foreign, malformed or unknown reference produces no entry and never a link.
 *
 * The mutation cases are the point: each one removes or neuters one clause and expects the corresponding refusal or the
 * corresponding absence, so no test can pass because a predicate stopped being evaluated.
 */
import { describe, expect, it } from "vitest";

import { planUnoSiteNavigation } from "../../src/application/plan-uno-site-navigation";
import type { UnoPublishedPageAccepted } from "../../src/application/plan-uno-published-page";
import {
  UNO_PRESENTATION_LIMITS,
  UNO_PRESENTATION_REFUSAL_REASONS,
  selectUnoPresentationSite,
  validateUnoPresentationConfig,
  type UnoPresentationConfig,
} from "../../src/core/efs/uno-presentation";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** One accepted Page plan, with only the fields navigation actually reads. */
function page(
  pageId: string,
  pathname: string,
  options: { localeTag?: string; title?: string; visibility?: "public" | "unlisted"; facetId?: string; siteId?: string } = {},
): UnoPublishedPageAccepted {
  const visibility = options.visibility ?? "public";
  return {
    accepted: true,
    identity: {
      entityId: "e_7a3knkx60eacyhca7a0cr1k6e1",
      facetId: options.facetId ?? "foundation",
      siteId: options.siteId ?? "main",
      pageId,
      localeTag: options.localeTag ?? "en-001",
      localePathKey: (options.localeTag ?? "en-001").toLowerCase(),
      routePath: pageId,
      pathname,
    },
    document: {
      kind: "markdown",
      title: options.title ?? pageId,
      visibility,
      markdownBody: "# body",
    },
    delivery: {
      canonicalUrl: `https://uno-starter.example${pathname}`,
      robots: visibility === "public" ? null : "noindex,nofollow",
      public: visibility === "public",
      unlisted: visibility !== "public",
      indexable: visibility === "public",
      eligible: "eligible",
      supportedLocales: ["en-001"],
      defaultLocale: "en-001",
      languagePreferences: { en: "en-001" },
    },
  } as unknown as UnoPublishedPageAccepted;
}

/** A minimal well-formed configuration for the starter Site. */
function config(sites: unknown[] = [
  {
    site: { facetId: "foundation", siteId: "main" },
    brand: { name: "Foundation Uno", homePage: "home" },
    navigation: { ariaLabel: "Primary", items: [{ page: "home" }, { page: "about" }, { page: "components" }] },
  },
]): UnoPresentationConfig {
  const validated = validateUnoPresentationConfig({ version: 1, sites });
  if (!validated.accepted) throw new Error(`the fixture configuration must be accepted: ${validated.reason}`);
  return validated.config;
}

describe("the presentation configuration is a closed envelope", () => {
  it("accepts the shape the project commits", () => {
    expect(config().sites).toHaveLength(1);
    expect(selectUnoPresentationSite(config(), { facetId: "foundation", siteId: "main" })).not.toBeNull();
  });

  it("accepts the committed deployment/site.config.json itself", () => {
    const text = readFileSync(resolve(process.cwd(), "deployment/site.config.json"), "utf8");
    const validated = validateUnoPresentationConfig(JSON.parse(text) as unknown);
    expect(validated).toMatchObject({ accepted: true });
  });

  it("refuses a body that is not an object, an unknown top-level key and a foreign version", () => {
    expect(validateUnoPresentationConfig(null)).toMatchObject({ accepted: false, reason: "presentation:not-object" });
    expect(validateUnoPresentationConfig([])).toMatchObject({ accepted: false, reason: "presentation:not-object" });
    expect(validateUnoPresentationConfig({ version: 1, sites: [], extra: true }))
      .toMatchObject({ accepted: false, reason: "presentation:unknown-key" });
    expect(validateUnoPresentationConfig({ version: 2, sites: [] }))
      .toMatchObject({ accepted: false, reason: "presentation:version-invalid" });
  });

  it("refuses a Site entry with an unknown key, a malformed identifier or a duplicate Site", () => {
    const base = { site: { facetId: "foundation", siteId: "main" } };
    expect(validateUnoPresentationConfig({ version: 1, sites: [{ ...base, footer: {} }] }))
      .toMatchObject({ accepted: false, reason: "presentation:site-invalid" });
    expect(validateUnoPresentationConfig({ version: 1, sites: [{ site: { facetId: "Foundation", siteId: "main" } }] }))
      .toMatchObject({ accepted: false, reason: "presentation:site-invalid" });
    expect(validateUnoPresentationConfig({ version: 1, sites: [base, base] }))
      .toMatchObject({ accepted: false, reason: "presentation:duplicate-site" });
  });

  it("refuses a navigation envelope that is empty, duplicated or over its declared caps", () => {
    const site = (navigation: unknown) => ({ version: 1, sites: [{ site: { facetId: "foundation", siteId: "main" }, navigation }] });
    expect(validateUnoPresentationConfig(site({ items: [] })))
      .toMatchObject({ accepted: false, reason: "presentation:navigation-invalid" });
    expect(validateUnoPresentationConfig(site({ items: [{ page: "home" }, { page: "home" }] })))
      .toMatchObject({ accepted: false, reason: "presentation:duplicate-item" });
    expect(validateUnoPresentationConfig(site({ items: Array.from({ length: UNO_PRESENTATION_LIMITS.items + 1 }, (_, index) => ({ page: `p${index}` })) })))
      .toMatchObject({ accepted: false, reason: "presentation:navigation-invalid" });
    expect(validateUnoPresentationConfig(site({ items: [{ page: "home", label: "Home" }] })))
      .toMatchObject({ accepted: false, reason: "presentation:item-invalid" });
  });

  it("refuses a label override with a malformed locale, an empty label or a control character", () => {
    const site = (labels: unknown) => ({
      version: 1,
      sites: [{ site: { facetId: "foundation", siteId: "main" }, navigation: { items: [{ page: "home", labels }] } }],
    });
    expect(validateUnoPresentationConfig(site({ "en 001": "Home" })))
      .toMatchObject({ accepted: false, reason: "presentation:label-invalid" });
    expect(validateUnoPresentationConfig(site({ "en-001": "" })))
      .toMatchObject({ accepted: false, reason: "presentation:label-invalid" });
    expect(validateUnoPresentationConfig(site({ "en-001": "Home\u0007" })))
      .toMatchObject({ accepted: false, reason: "presentation:label-invalid" });
  });

  it("refuses a brand name that is blank, padded or not a string", () => {
    const site = (brand: unknown) => ({ version: 1, sites: [{ site: { facetId: "foundation", siteId: "main" }, brand }] });
    expect(validateUnoPresentationConfig(site({ name: "" })))
      .toMatchObject({ accepted: false, reason: "presentation:text-invalid" });
    expect(validateUnoPresentationConfig(site({ name: " Foundation Uno" })))
      .toMatchObject({ accepted: false, reason: "presentation:text-invalid" });
    expect(validateUnoPresentationConfig(site({ name: 7 })))
      .toMatchObject({ accepted: false, reason: "presentation:text-invalid" });
  });

  it("freezes every accepted level, so no caller can append an item", () => {
    const accepted = config();
    expect(Object.isFrozen(accepted)).toBe(true);
    expect(Object.isFrozen(accepted.sites)).toBe(true);
    expect(Object.isFrozen(accepted.sites[0]?.navigation?.items)).toBe(true);
    expect(UNO_PRESENTATION_REFUSAL_REASONS).toHaveLength(11);
  });
});

describe("the navigation planner derives entries and never declares them", () => {
  const site = { facetId: "foundation", siteId: "main" };
  const starter = [
    page("home", "/en-001", { title: "Home" }),
    page("about", "/en-001/about", { title: "About" }),
    page("components", "/en-001/components", { title: "Components" }),
  ];

  const plan = (pages: UnoPublishedPageAccepted[], overrides: Partial<Parameters<typeof planUnoSiteNavigation>[0]> = {}) =>
    planUnoSiteNavigation({
      site,
      localeTag: "en-001",
      currentPageId: "about",
      currentPathname: "/en-001/about",
      pages,
      presentation: config(),
      ...overrides,
    });

  it("orders the three starter Pages as the configuration orders them and marks the current Page", () => {
    const outcome = plan(starter);
    expect(outcome.status).toBe("planned");
    if (outcome.status !== "planned") return;
    expect(outcome.plan.ariaLabel).toBe("Primary");
    expect(outcome.plan.entries.map((entry) => [entry.pageId, entry.href, entry.label, entry.current])).toEqual([
      ["home", "/en-001", "Home", false],
      ["about", "/en-001/about", "About", true],
      ["components", "/en-001/components", "Components", false],
    ]);
    expect(outcome.plan.brand).toEqual({ name: "Foundation Uno", href: "/en-001" });
  });

  it("indicates exactly one current entry, and only in the Page actually being served", () => {
    const home = plan(starter, { currentPageId: "home", currentPathname: "/en-001" });
    expect(home.status).toBe("planned");
    if (home.status !== "planned") return;
    expect(home.plan.entries.filter((entry) => entry.current).map((entry) => entry.pageId)).toEqual(["home"]);
  });

  it("labels an entry from its own authored title, and lets an authored override win for that locale only", () => {
    const overridden = config([{
      site,
      navigation: { items: [{ page: "about", labels: { "en-001": "Who we are" } }, { page: "home" }] },
    }]);
    const outcome = plan(starter, { presentation: overridden });
    expect(outcome.status).toBe("planned");
    if (outcome.status !== "planned") return;
    expect(outcome.plan.entries.map((entry) => entry.label)).toEqual(["Who we are", "Home"]);

    const otherLocale = config([{
      site,
      navigation: { items: [{ page: "about", labels: { "de-DE": "Über uns" } }] },
    }]);
    const fallback = plan(starter, { presentation: otherLocale });
    expect(fallback.status).toBe("planned");
    if (fallback.status !== "planned") return;
    expect(fallback.plan.entries.map((entry) => entry.label)).toEqual(["About"]);
  });

  it("drops an unlisted Page, an unpublished Page, a foreign Site's Page and an unknown id", () => {
    const pages = [
      starter[0] as UnoPublishedPageAccepted,
      page("secret", "/en-001/secret", { title: "Secret", visibility: "unlisted" }),
      page("about", "/en-001/about", { title: "About", visibility: "unlisted" }),
      page("elsewhere", "/en-001/elsewhere", { title: "Elsewhere", siteId: "other" }),
    ];
    const wide = config([{
      site,
      navigation: {
        items: [{ page: "home" }, { page: "about" }, { page: "secret" }, { page: "elsewhere" }, { page: "missing" }],
      },
    }]);
    const outcome = plan(pages, { presentation: wide });
    expect(outcome.status).toBe("planned");
    if (outcome.status !== "planned") return;
    expect(outcome.plan.entries.map((entry) => entry.pageId)).toEqual(["home"]);
  });

  it("keeps one locale's navigation out of another locale's Page", () => {
    const pages = [
      ...starter,
      page("home", "/de-DE", { title: "Startseite", localeTag: "de-DE" }),
      page("about", "/de-DE/about", { title: "Über uns", localeTag: "de-DE" }),
    ];
    const german = plan(pages, { localeTag: "de-DE", currentPageId: "about", currentPathname: "/de-DE/about" });
    expect(german.status).toBe("planned");
    if (german.status !== "planned") return;
    expect(german.plan.entries.map((entry) => [entry.href, entry.label, entry.current])).toEqual([
      ["/de-DE", "Startseite", false],
      ["/de-DE/about", "Über uns", true],
    ]);
    expect(german.plan.entries.some((entry) => entry.href.startsWith("/en-001"))).toBe(false);
  });

  it("renders no navigation at all when the configuration is absent, silent about the Site or has no entries", () => {
    expect(plan(starter, { presentation: null })).toEqual({ status: "absent", reason: "navigation:not-configured" });
    expect(plan(starter, { presentation: config([{ site: { facetId: "foundation", siteId: "other" } }]) }))
      .toEqual({ status: "absent", reason: "navigation:site-undeclared" });
    expect(plan(starter, { presentation: config([{ site }]) }))
      .toEqual({ status: "absent", reason: "navigation:no-navigation" });
    expect(plan([], { presentation: config() }))
      .toEqual({ status: "absent", reason: "navigation:no-eligible-entry" });
    expect(plan([page("secret", "/en-001/secret", { visibility: "unlisted" })], {
      presentation: config([{ site, navigation: { items: [{ page: "secret" }] } }]),
    })).toEqual({ status: "absent", reason: "navigation:no-eligible-entry" });
  });

  it("links the brand to the home Page only while that Page is itself eligible", () => {
    const withoutHome = plan([starter[1] as UnoPublishedPageAccepted]);
    expect(withoutHome.status).toBe("planned");
    if (withoutHome.status !== "planned") return;
    expect(withoutHome.plan.brand).toEqual({ name: "Foundation Uno", href: null });
    expect(withoutHome.plan.entries.map((entry) => entry.pageId)).toEqual(["about"]);
  });

  it("cannot be widened by the configuration: the same Page id in another Site is still not a destination", () => {
    const foreign = [page("home", "/en-001", { title: "Home", facetId: "other" })];
    expect(plan(foreign)).toEqual({ status: "absent", reason: "navigation:no-eligible-entry" });
  });
});




describe("the committed configuration agrees with the committed manifest", () => {
  it("names only Pages the declared Site authors, and every published starter Page is named exactly once", () => {
    const presentation = JSON.parse(
      readFileSync(resolve(process.cwd(), "deployment/site.config.json"), "utf8"),
    ) as {
      readonly sites: readonly {
        readonly site: { readonly facetId: string; readonly siteId: string };
        readonly navigation?: { readonly items: readonly { readonly page: string }[] };
      }[];
    };
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "deployment/efs/manifest.json"), "utf8"),
    ) as {
      readonly entities: readonly {
        readonly facets: readonly {
          readonly id: string;
          readonly sites: readonly {
            readonly id: string;
            readonly pages: readonly { readonly id: string; readonly publication: string }[];
          }[];
        }[];
      }[];
    };

    for (const entry of presentation.sites) {
      const facet = manifest.entities.flatMap((entity) => entity.facets)
        .find((candidate) => candidate.id === entry.site.facetId);
      const site = facet?.sites.find((candidate) => candidate.id === entry.site.siteId);
      expect(site, `${entry.site.facetId}/${entry.site.siteId}`).toBeDefined();
      const pages = site?.pages ?? [];
      const authored = new Set(pages.map((candidate) => candidate.id));
      const referenced = (entry.navigation?.items ?? []).map((item) => item.page);
      for (const pageId of referenced) {
        expect(authored.has(pageId), `${pageId} is authored`).toBe(true);
      }
      const published = pages.filter((candidate) => candidate.publication === "published").map((candidate) => candidate.id);
      for (const pageId of published) {
        expect(referenced.filter((candidate) => candidate === pageId), `${pageId} is navigable once`).toHaveLength(1);
      }
    }
  });
});
