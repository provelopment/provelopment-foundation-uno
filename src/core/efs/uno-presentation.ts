/**
 * Foundation Uno — the installation-wide presentation, navigation and branding configuration (`U04`, navigation).
 *
 * WHAT THIS IS. One pure contract for `deployment/site.config.json`: a closed envelope that says **how** a Site's own
 * published Pages are presented — the order they appear in navigation, the accessible name of that navigation, optional
 * authored label overrides per locale, and an optional Site name. It is configuration, and it is not authority.
 *
 * WHAT IT IS NOT. It cannot publish, unpublish, list, unlist, redirect, translate, create a destination or bind a Site. A
 * reference to a Page that is not an accepted **public** Page of the current Site in the current locale produces no entry
 * at all; it is never rendered as a link and never refused as a Page. Nothing here reads a file, an environment, a clock or
 * the network, and no refusal widens at a call site.
 *
 * ABSENT IS NORMAL. A Site with no entry, or a project with no such file, is not an error: the shell simply renders no
 * navigation. Only a **present and malformed** file refuses, and that refusal still leaves every Page served.
 */
import {
  validateUnoAnalyticsDeclaration,
  type UnoAnalyticsVerdict,
} from "../analytics/uno-analytics";

/** The one accepted version. A different version refuses rather than being read optimistically. */
export const UNO_PRESENTATION_CONFIG_VERSION = 1;

/** Declared bounds. Each is a limit that refuses instead of truncating. */
export const UNO_PRESENTATION_LIMITS = Object.freeze({
  sites: 64,
  items: 24,
  labelOverrides: 8,
  labelLength: 64,
  nameLength: 96,
  ariaLabelLength: 48,
});

/** The closed refusal vocabulary: one literal per failure family. */
export type UnoPresentationRefusal =
  | "presentation:not-object"
  | "presentation:unknown-key"
  | "presentation:version-invalid"
  | "presentation:too-many"
  | "presentation:site-invalid"
  | "presentation:duplicate-site"
  | "presentation:navigation-invalid"
  | "presentation:item-invalid"
  | "presentation:duplicate-item"
  | "presentation:label-invalid"
  | "presentation:text-invalid"
  /** `U05`: a present analytics declaration that the analytics contract refused. */
  | "presentation:analytics-invalid";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_PRESENTATION_REFUSAL_REASONS: readonly UnoPresentationRefusal[] = Object.freeze([
  "presentation:not-object",
  "presentation:unknown-key",
  "presentation:version-invalid",
  "presentation:too-many",
  "presentation:site-invalid",
  "presentation:duplicate-site",
  "presentation:navigation-invalid",
  "presentation:item-invalid",
  "presentation:duplicate-item",
  "presentation:label-invalid",
  "presentation:text-invalid",
] as const);

/** One Site the presentation file speaks about: the same pair the manifest and the selection already use. */
export interface UnoPresentationSiteKey {
  readonly facetId: string;
  readonly siteId: string;
}

/** One navigation reference: a Page id of this Site, with optional authored labels keyed by authored locale tag. */
export interface UnoPresentationNavigationItem {
  readonly pageId: string;
  readonly labels: Readonly<Record<string, string>>;
}

/** The navigation presentation of one Site. */
export interface UnoPresentationNavigation {
  readonly ariaLabel: string;
  readonly items: readonly UnoPresentationNavigationItem[];
}

/** The optional Site branding: an authored name, plus the Page id a display href may derive from. */
export interface UnoPresentationBrand {
  readonly name: string;
  readonly homePageId: string | null;
}

/** The validated presentation of exactly one Site. */
export interface UnoPresentationSite {
  readonly site: UnoPresentationSiteKey;
  readonly brand: UnoPresentationBrand | null;
  readonly navigation: UnoPresentationNavigation | null;
  /** `U05`: the resolved analytics verdict, or `null` when this Site declares none. Off is the default. */
  readonly analytics: UnoAnalyticsVerdict | null;
}

/** The validated whole file. */
export interface UnoPresentationConfig {
  readonly version: number;
  readonly sites: readonly UnoPresentationSite[];
}

/** The tagged result: a validated configuration, or one closed reason and no partial record. */
export type UnoPresentationConfigResult =
  | { readonly accepted: true; readonly config: UnoPresentationConfig }
  | { readonly accepted: false; readonly reason: UnoPresentationRefusal };

/** A lowercase identifier token: no case games, no separators that could be read as a path. */
const ID = /^[a-z0-9][a-z0-9._-]{0,63}$/u;

/** A full locale tag in the shape the locales contract already accepts. */
const LOCALE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u;

/** One plain object check that refuses arrays and `null`. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Exact own keys, so an envelope can never carry a field nobody validated. */
function hasExactly(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[]): boolean {
  const keys = Object.keys(value);
  if (keys.some((key) => !allowed.includes(key))) return false;
  return required.every((key) => Object.hasOwn(value, key));
}

/** One authored, displayable piece of text: no control characters, no surrounding blank, inside the declared limit. */
function isDisplayText(value: unknown, limit: number): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= limit
    && value.trim() === value
    && !/[\u0000-\u001f\u007f]/u.test(value);
}


/** Validate one `{facetId, siteId}` pair. */
function readSiteKey(value: unknown): UnoPresentationSiteKey | null {
  if (!isRecord(value)) return null;
  if (!hasExactly(value, ["facetId", "siteId"], ["facetId", "siteId"])) return null;
  const { facetId, siteId } = value;
  if (typeof facetId !== "string" || !ID.test(facetId)) return null;
  if (typeof siteId !== "string" || !ID.test(siteId)) return null;
  return Object.freeze({ facetId, siteId });
}

/** Validate one navigation reference and its optional authored labels. */
function readItem(value: unknown): UnoPresentationNavigationItem | UnoPresentationRefusal {
  if (!isRecord(value)) return "presentation:item-invalid";
  if (!hasExactly(value, ["page", "labels"], ["page"])) return "presentation:item-invalid";
  const { page, labels } = value;
  if (typeof page !== "string" || !ID.test(page)) return "presentation:item-invalid";
  const overrides: Record<string, string> = {};
  if (labels !== undefined) {
    if (!isRecord(labels)) return "presentation:label-invalid";
    const entries = Object.entries(labels);
    if (entries.length > UNO_PRESENTATION_LIMITS.labelOverrides) return "presentation:label-invalid";
    for (const [localeTag, label] of entries) {
      if (!LOCALE.test(localeTag)) return "presentation:label-invalid";
      if (!isDisplayText(label, UNO_PRESENTATION_LIMITS.labelLength)) return "presentation:label-invalid";
      overrides[localeTag] = label;
    }
  }
  return Object.freeze({ pageId: page, labels: Object.freeze(overrides) });
}

/** Validate the navigation envelope of one Site. `null` (omitted) means: no navigation for this Site. */
function readNavigation(value: unknown): UnoPresentationNavigation | UnoPresentationRefusal | null {
  if (!isRecord(value)) return "presentation:navigation-invalid";
  if (!hasExactly(value, ["ariaLabel", "items"], ["items"])) return "presentation:navigation-invalid";
  const ariaLabel = value.ariaLabel === undefined ? "Primary" : value.ariaLabel;
  if (!isDisplayText(ariaLabel, UNO_PRESENTATION_LIMITS.ariaLabelLength)) return "presentation:navigation-invalid";
  if (!Array.isArray(value.items) || value.items.length === 0) return "presentation:navigation-invalid";
  if (value.items.length > UNO_PRESENTATION_LIMITS.items) return "presentation:navigation-invalid";
  const items: UnoPresentationNavigationItem[] = [];
  const seen = new Set<string>();
  for (const candidate of value.items) {
    const item = readItem(candidate);
    if (typeof item === "string") return item;
    if (seen.has(item.pageId)) return "presentation:duplicate-item";
    seen.add(item.pageId);
    items.push(item);
  }
  return Object.freeze({ ariaLabel, items: Object.freeze(items) });
}

/** Validate the optional branding envelope. `null` (omitted) means: display no Site name. */
function readBrand(value: unknown): UnoPresentationBrand | UnoPresentationRefusal | null {
  if (!isRecord(value)) return "presentation:text-invalid";
  if (!hasExactly(value, ["name", "homePage"], ["name"])) return "presentation:text-invalid";
  if (!isDisplayText(value.name, UNO_PRESENTATION_LIMITS.nameLength)) return "presentation:text-invalid";
  let homePageId: string | null = null;
  if (value.homePage !== undefined) {
    if (typeof value.homePage !== "string" || !ID.test(value.homePage)) return "presentation:text-invalid";
    homePageId = value.homePage;
  }
  return Object.freeze({ name: value.name, homePageId });
}

/** Validate one Site entry: the Site key plus its optional branding and navigation. */
function readSite(value: unknown): UnoPresentationSite | UnoPresentationRefusal {
  if (!isRecord(value)) return "presentation:site-invalid";
  if (!hasExactly(value, ["site", "brand", "navigation", "analytics"], ["site"])) return "presentation:site-invalid";
  const site = readSiteKey(value.site);
  if (site === null) return "presentation:site-invalid";

  let brand: UnoPresentationBrand | null = null;
  if (value.brand !== undefined) {
    const read = readBrand(value.brand);
    if (typeof read === "string") return read;
    brand = read;
  }

  let navigation: UnoPresentationNavigation | null = null;
  if (value.navigation !== undefined) {
    const read = readNavigation(value.navigation);
    if (typeof read === "string") return read;
    navigation = read;
  }

  // `U05`: analytics are opt-in and off unless an operator authors them. A declaration that is present but refused fails the
  // whole presentation rather than being quietly treated as off, so a half-configured installation can never appear compliant.
  let analytics: UnoAnalyticsVerdict | null = null;
  if (value.analytics !== undefined) {
    const declared = validateUnoAnalyticsDeclaration(value.analytics);
    if (declared.enabled === false && declared.reason !== "analytics:disabled"
      && declared.reason !== "analytics:not-declared") {
      return "presentation:analytics-invalid";
    }
    analytics = declared;
  }

  return Object.freeze({ site, brand, navigation, analytics });
}

/**
 * Validate one parsed presentation file.
 *
 * The whole file refuses on the first failure rather than dropping a Site: a half-read presentation could silently show one
 * Site's navigation under another Site's authority. Every accepted value is frozen, so a later caller cannot add an item.
 */
export function validateUnoPresentationConfig(value: unknown): UnoPresentationConfigResult {
  if (!isRecord(value)) return { accepted: false, reason: "presentation:not-object" };
  if (!hasExactly(value, ["version", "sites"], ["version", "sites"])) {
    return { accepted: false, reason: "presentation:unknown-key" };
  }
  if (value.version !== UNO_PRESENTATION_CONFIG_VERSION) {
    return { accepted: false, reason: "presentation:version-invalid" };
  }
  if (!Array.isArray(value.sites)) return { accepted: false, reason: "presentation:site-invalid" };
  if (value.sites.length > UNO_PRESENTATION_LIMITS.sites) return { accepted: false, reason: "presentation:too-many" };

  const sites: UnoPresentationSite[] = [];
  const seen = new Set<string>();
  for (const candidate of value.sites) {
    const site = readSite(candidate);
    if (typeof site === "string") return { accepted: false, reason: site };
    const key = `${site.site.facetId}/${site.site.siteId}`;
    if (seen.has(key)) return { accepted: false, reason: "presentation:duplicate-site" };
    seen.add(key);
    sites.push(site);
  }

  return {
    accepted: true,
    config: Object.freeze({ version: UNO_PRESENTATION_CONFIG_VERSION, sites: Object.freeze(sites) }),
  };
}

/** The presentation entry of exactly one Site, matched by both identifiers, or `null` when the file is silent about it. */
export function selectUnoPresentationSite(
  config: UnoPresentationConfig,
  site: UnoPresentationSiteKey,
): UnoPresentationSite | null {
  return config.sites.find(
    (candidate) => candidate.site.facetId === site.facetId && candidate.site.siteId === site.siteId,
  ) ?? null;
}
