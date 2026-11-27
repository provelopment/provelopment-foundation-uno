/**
 * Foundation Uno — the Site navigation planner (`U04`, navigation).
 *
 * WHAT THIS IS. One pure use case that turns the accepted published Pages of **one** Site plus that Site's validated
 * presentation entry into exactly what the shell may render: an optional accessible navigation name, an optional branding
 * name and home destination, and an ordered list of `{pageId, href, label, current}` entries.
 *
 * THE ELIGIBILITY GATE. Navigation is derived, never declared into existence. An entry exists only when the referenced Page
 * id resolves to an **accepted** plan of this Site, in this locale, whose delivery is public and whose document is public —
 * the same predicate the discovery surface already applies. An unlisted Page, an unpublished Page, a Page of another Site or
 * another locale, an unknown id, a refusal or a missing representation therefore produces **no entry at all**: it is neither
 * linked nor disclosed by its absence, and it never becomes a refusal of the Page being served.
 *
 * DESTINATIONS. Every `href` is the served pathname the routing authority already decided for that Page
 * (`identity.pathname`), so navigation cannot invent an address, a base path, a locale prefix or a redirect. Labels are that
 * Page's own authored title in this locale, unless the presentation file authors an override for exactly this locale tag.
 *
 * WHAT IT IS NOT. No file, environment, clock, network, adapter, React or Next.js import; no publication, redirect, listing or
 * translation. Absent or silent presentation is a normal outcome: the shell renders no navigation.
 */
import {
  selectUnoPresentationSite,
  type UnoPresentationConfig,
  type UnoPresentationSiteKey,
} from "../core/efs/uno-presentation";
import type { UnoPublishedPageAccepted } from "./plan-uno-published-page";

/** Declared bounds: a wider label or href refuses rather than being truncated. */
export const UNO_SITE_NAVIGATION_LIMITS = Object.freeze({
  entries: 24,
  hrefBytes: 384,
  labelLength: 96,
});

/** Why a Site has no navigation. Each literal is an ordinary presentation outcome, never a refusal of a Page. */
export type UnoSiteNavigationAbsence =
  | "navigation:not-configured"
  | "navigation:site-undeclared"
  | "navigation:no-navigation"
  | "navigation:no-eligible-entry"
  /** A present but malformed presentation file: navigation is removed, publication is untouched. */
  | "navigation:configuration-invalid"
  /** The committed authority itself refused, so no Page of this Site can be enumerated. */
  | "navigation:authority-unavailable";

/** One rendered navigation entry. */
export interface UnoSiteNavigationEntry {
  readonly pageId: string;
  readonly href: string;
  readonly label: string;
  readonly current: boolean;
}

/** The optional Site branding the header may display. `href` is present only when the home Page is itself eligible. */
export interface UnoSiteNavigationBrand {
  readonly name: string;
  readonly href: string | null;
}

/** The planned shell navigation. */
export interface UnoSiteNavigationPlan {
  readonly ariaLabel: string;
  readonly brand: UnoSiteNavigationBrand | null;
  readonly entries: readonly UnoSiteNavigationEntry[];
}

/** The tagged outcome. */
export type UnoSiteNavigationOutcome =
  | { readonly status: "planned"; readonly plan: UnoSiteNavigationPlan }
  | { readonly status: "absent"; readonly reason: UnoSiteNavigationAbsence };


/** A Page may be shown in navigation only when both the served delivery and the authored document are public. */
function isEligible(page: UnoPublishedPageAccepted, site: UnoPresentationSiteKey, localeTag: string): boolean {
  return page.identity.facetId === site.facetId
    && page.identity.siteId === site.siteId
    && page.identity.localeTag === localeTag
    && page.delivery.public === true
    && page.delivery.unlisted === false
    && page.document.visibility === "public"
    && page.identity.pathname.startsWith("/")
    && page.identity.pathname.length > 1
    && page.identity.pathname.length <= UNO_SITE_NAVIGATION_LIMITS.hrefBytes;
}

/** The authored label: an explicit override for exactly this locale, else the Page's own authored title. */
function labelOf(page: UnoPublishedPageAccepted, overrides: Readonly<Record<string, string>>): string | null {
  const override = Object.hasOwn(overrides, page.identity.localeTag) ? overrides[page.identity.localeTag] : undefined;
  const label = override ?? page.document.title;
  if (typeof label !== "string") return null;
  if (label.length === 0 || label.length > UNO_SITE_NAVIGATION_LIMITS.labelLength) return null;
  return label;
}

/**
 * Plan the shell navigation for one request.
 *
 * Ordering is the presentation file's order, and nothing is appended: a Page the file does not name is simply not in the
 * navigation, which is a presentation decision and never a publication one.
 */
export function planUnoSiteNavigation(input: UnoSiteNavigationInput): UnoSiteNavigationOutcome {
  if (input.presentation === null) return { status: "absent", reason: "navigation:not-configured" };

  const declared = selectUnoPresentationSite(input.presentation, input.site);
  if (declared === null) return { status: "absent", reason: "navigation:site-undeclared" };
  if (declared.navigation === null) return { status: "absent", reason: "navigation:no-navigation" };

  const eligible = input.pages.filter((page) => isEligible(page, input.site, input.localeTag));
  const byPageId = new Map<string, UnoPublishedPageAccepted>();
  for (const page of eligible) {
    // Two accepted plans for one Page id in one locale cannot both be served; the first in canonical order wins.
    if (!byPageId.has(page.identity.pageId)) byPageId.set(page.identity.pageId, page);
  }

  const entries: UnoSiteNavigationEntry[] = [];
  for (const item of declared.navigation.items) {
    if (entries.length >= UNO_SITE_NAVIGATION_LIMITS.entries) break;
    const page = byPageId.get(item.pageId);
    if (page === undefined) continue;
    const label = labelOf(page, item.labels);
    if (label === null) continue;
    entries.push(Object.freeze({
      pageId: page.identity.pageId,
      href: page.identity.pathname,
      label,
      current: page.identity.pageId === input.currentPageId && page.identity.pathname === input.currentPathname,
    }));
  }
  if (entries.length === 0) return { status: "absent", reason: "navigation:no-eligible-entry" };

  const brandName = declared.brand?.name ?? null;
  const homePageId = declared.brand?.homePageId ?? null;
  const homeEntry = homePageId === null ? undefined : entries.find((entry) => entry.pageId === homePageId);
  const brand = brandName === null
    ? null
    : Object.freeze({ name: brandName, href: homeEntry === undefined ? null : homeEntry.href });

  return {
    status: "planned",
    plan: Object.freeze({
      ariaLabel: declared.navigation.ariaLabel,
      brand,
      entries: Object.freeze(entries),
    }),
  };
}

/** The input: the current Site and locale, the current Page, that Site's accepted Pages, and the validated presentation. */
export interface UnoSiteNavigationInput {
  readonly site: UnoPresentationSiteKey;
  readonly localeTag: string;
  readonly currentPageId: string;
  readonly currentPathname: string;
  readonly pages: readonly UnoPublishedPageAccepted[];
  readonly presentation: UnoPresentationConfig | null;
}
