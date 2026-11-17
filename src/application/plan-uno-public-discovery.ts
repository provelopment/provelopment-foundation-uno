/**
 * Foundation Uno — the public discovery planner (`UNO-WO-028 / R01`, U03).
 *
 * WHAT THIS IS. One pure application use case that turns a complete, validated collection of **accepted
 * published Page plans** into exactly what a future sitemap and `hreflang` set may advertise: the public
 * canonical URLs, in a deterministic order, and the same-Page locale alternates for those URLs.
 *
 * THE ADVERTISING GATE. Only a Page whose plan is accepted *and* whose visibility is `public` becomes a
 * sitemap entry or an alternate. An `unlisted` Page is directly addressable only under its own
 * `noindex,nofollow` response, so it is excluded from every URL list and from every alternate set — it can
 * never leak into discovery. `x-default` exists only when a published **public** default-locale Home entry
 * exists; it is never guessed.
 *
 * WHAT THIS IS NOT. No file, environment, clock, network, adapter, provider, React or Next.js import; no
 * XML, response, header, redirect, route or publication. A refused or missing source cannot reach this
 * planner at all, because a refused plan is not an accepted decision.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**; the pinned read-only Foundation
 * GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` is conceptual context only. No Foundation,
 * Solo or Connect code, media, brand or fixture is imported, and Apache-2.0 notices are unchanged.
 */
import { HOME_CONTENT_SLUG } from "../core/page-content";

/** Declared bounds. A limit, not a default: exceeding one refuses instead of truncating. */
export const UNO_PUBLIC_DISCOVERY_LIMITS = Object.freeze({
  decisions: 256,
  supportedLocales: 32,
  urlBytes: 384,
  alternatesPerPage: 16,
});

/** The closed refusal vocabulary: one literal per failure family, never widened at a call site. */
export type UnoPublicDiscoveryRefusal =
  | "discovery:input-invalid"
  | "discovery:unreadable"
  | "discovery:locale-invalid"
  | "discovery:invalid-decision"
  | "discovery:site-mismatch"
  | "discovery:unsupported-locale"
  | "discovery:url-invalid"
  | "discovery:duplicate-url"
  | "discovery:duplicate-page"
  | "discovery:too-many";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_PUBLIC_DISCOVERY_REFUSAL_REASONS: readonly UnoPublicDiscoveryRefusal[] = Object.freeze([
  "discovery:input-invalid",
  "discovery:unreadable",
  "discovery:locale-invalid",
  "discovery:invalid-decision",
  "discovery:site-mismatch",
  "discovery:unsupported-locale",
  "discovery:url-invalid",
  "discovery:duplicate-url",
  "discovery:duplicate-page",
  "discovery:too-many",
] as const);

/** The exact own-data keys the request may carry. */
export const UNO_PUBLIC_DISCOVERY_INPUT_KEYS: readonly string[] = Object.freeze([
  "decisions",
  "locales",
] as const);

/** One same-Page locale alternate: the authored locale and the exact URL that locale is served at. */
export interface UnoPublicDiscoveryAlternate {
  readonly localeTag: string;
  readonly href: string;
}

/** One public, published canonical entry. */
export interface UnoPublicDiscoveryEntry {
  readonly pageId: string;
  readonly routePath: string;
  readonly localeTag: string;
  readonly canonicalUrl: string;
  readonly alternates: readonly UnoPublicDiscoveryAlternate[];
  readonly xDefault?: string;
}

/** The accepted discovery plan. Still nothing is served, emitted or advertised. */
export interface UnoPublicDiscoveryAccepted {
  readonly accepted: true;
  readonly site: {
    readonly entityId: string;
    readonly facetId: string;
    readonly siteId: string;
  };
  readonly defaultLocale: string;
  readonly entries: readonly UnoPublicDiscoveryEntry[];
  readonly sitemapUrls: readonly string[];
}

/** The refused plan: one closed literal and no partial answer. */
export type UnoPublicDiscoveryRefused = {
  readonly accepted: false;
  readonly reason: UnoPublicDiscoveryRefusal;
};

/** Anything this planner returns. */
export type UnoPublicDiscoveryResult = UnoPublicDiscoveryAccepted | UnoPublicDiscoveryRefused;

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileStructure extends Error {}

/** One bounded refusal, used for every early exit. */
function refuseDiscovery(reason: UnoPublicDiscoveryRefusal): UnoPublicDiscoveryRefused {
  return Object.freeze({ accepted: false, reason });
}

/** Read an untrusted value as a plain record of own enumerable data properties, or `null`. */
function readPlainData(value: unknown): DataRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new HostileStructure();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileStructure();
  const copy = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileStructure();
    copy[key] = descriptor.value;
  }
  return copy;
}

/** Exactly the declared keys, no more and no fewer. */
function hasExactlyKeys(record: DataRecord, keys: readonly string[]): boolean {
  const own = Object.keys(record);
  if (own.length !== keys.length) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
  }
  return true;
}

/** A non-empty string field, read by descriptor so an accessor is refused rather than invoked. */
function stringField(record: DataRecord, key: string): string | null {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) return null;
  return typeof descriptor.value === "string" && descriptor.value.length > 0 ? descriptor.value : null;
}

/** A boolean field, read by descriptor. */
function booleanField(record: DataRecord, key: string): boolean | null {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) return null;
  return typeof descriptor.value === "boolean" ? descriptor.value : null;
}

/** Compare by code point, so ordering is deterministic on every host and locale. */
function compareCodePoints(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** True only for a string this module can prove is ASCII, so a character count is a byte count. */
function isAscii(value: string): boolean {
  for (const character of value) {
    const point = character.codePointAt(0);
    if (point === undefined || point > 0x7f) return false;
  }
  return true;
}

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted plan. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}


/** One validated decision, reduced to exactly the facts discovery may advertise. */
interface DecisionFacts {
  readonly entityId: string;
  readonly facetId: string;
  readonly siteId: string;
  readonly pageId: string;
  readonly routePath: string;
  readonly localeTag: string;
  readonly canonicalUrl: string;
  readonly isPublic: boolean;
}

/** Read one accepted published-Page plan down to its advertising facts, or `null`. */
function readDecision(value: unknown): DecisionFacts | null {
  const decision = readPlainData(value);
  if (decision === null) return null;
  if (booleanField(decision, "accepted") !== true) return null;

  const identity = readPlainData(decision["identity"]);
  const delivery = readPlainData(decision["delivery"]);
  if (identity === null || delivery === null) return null;

  const entityId = stringField(identity, "entityId");
  const facetId = stringField(identity, "facetId");
  const siteId = stringField(identity, "siteId");
  const pageId = stringField(identity, "pageId");
  const routePath = descriptorString(identity, "routePath");
  const localeTag = stringField(identity, "localeTag");
  const canonicalUrl = stringField(delivery, "canonicalUrl");
  const isPublic = booleanField(delivery, "public");
  const isUnlisted = booleanField(delivery, "unlisted");
  if (
    entityId === null ||
    facetId === null ||
    siteId === null ||
    pageId === null ||
    routePath === null ||
    localeTag === null ||
    canonicalUrl === null ||
    isPublic === null ||
    isUnlisted === null
  ) {
    return null;
  }
  // `public` and `unlisted` are the two sides of one decision: a plan claiming both, or neither, is refused.
  if (isPublic === isUnlisted) return null;

  return { entityId, facetId, siteId, pageId, routePath, localeTag, canonicalUrl, isPublic };
}

/** A string field that may legitimately be the empty string (the reserved Home route). */
function descriptorString(record: DataRecord, key: string): string | null {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) return null;
  return typeof descriptor.value === "string" ? descriptor.value : null;
}

/** An absolute, ASCII, fragment-free and query-free `http(s)` URL within the declared byte cap. */
function isDiscoverableUrl(value: string): boolean {
  if (!isAscii(value) || value.length > UNO_PUBLIC_DISCOVERY_LIMITS.urlBytes) return false;
  if (value.includes("?") || value.includes("#")) return false;
  return value.startsWith("https://") || value.startsWith("http://");
}


/**
 * Plan the public discovery surface of the one selected Site.
 *
 * The request must be exactly `{decisions, locales}`, where `decisions` is a complete collection of accepted
 * published-Page plans and `locales` is that Site's stored locale authority. Every decision must name the
 * same selected Site and one of the declared locales; a duplicate URL (case-insensitively, too), a duplicate
 * Page locale, an oversized collection or an unusable URL refuses the whole plan rather than emitting a
 * partial sitemap. Only `public` Pages appear, sorted deterministically by canonical URL; `unlisted` Pages
 * are absent from every entry and every alternate.
 */
export function planUnoPublicDiscovery(input: unknown): UnoPublicDiscoveryResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuseDiscovery("discovery:input-invalid");
    if (!hasExactlyKeys(request, UNO_PUBLIC_DISCOVERY_INPUT_KEYS)) {
      return refuseDiscovery("discovery:input-invalid");
    }

    const locales = readPlainData(request["locales"]);
    if (locales === null) return refuseDiscovery("discovery:input-invalid");
    const supportedValue = locales["supportedLocales"];
    if (!Array.isArray(supportedValue)) return refuseDiscovery("discovery:locale-invalid");
    if (supportedValue.length === 0 || supportedValue.length > UNO_PUBLIC_DISCOVERY_LIMITS.supportedLocales) {
      return refuseDiscovery("discovery:locale-invalid");
    }
    const supported: string[] = [];
    for (const entry of supportedValue as readonly unknown[]) {
      if (typeof entry !== "string" || entry.length === 0 || entry.length > 64) {
        return refuseDiscovery("discovery:locale-invalid");
      }
      if (!/^[A-Za-z0-9-]+$/u.test(entry)) return refuseDiscovery("discovery:locale-invalid");
      supported.push(entry);
    }
    if (new Set(supported).size !== supported.length) return refuseDiscovery("discovery:locale-invalid");
    const defaultLocale = stringField(locales, "defaultLocale");
    if (defaultLocale === null || !supported.includes(defaultLocale)) {
      return refuseDiscovery("discovery:locale-invalid");
    }

    const decisionsValue = request["decisions"];
    if (!Array.isArray(decisionsValue) || decisionsValue.length === 0) {
      return refuseDiscovery("discovery:input-invalid");
    }
    if (decisionsValue.length > UNO_PUBLIC_DISCOVERY_LIMITS.decisions) {
      return refuseDiscovery("discovery:too-many");
    }

    const facts: DecisionFacts[] = [];
    for (const value of decisionsValue as readonly unknown[]) {
      const decision = readDecision(value);
      if (decision === null) return refuseDiscovery("discovery:invalid-decision");
      facts.push(decision);
    }

    const first = facts[0] as DecisionFacts;
    for (const fact of facts) {
      if (fact.entityId !== first.entityId || fact.facetId !== first.facetId || fact.siteId !== first.siteId) {
        return refuseDiscovery("discovery:site-mismatch");
      }
      if (!supported.includes(fact.localeTag)) return refuseDiscovery("discovery:unsupported-locale");
      if (!isDiscoverableUrl(fact.canonicalUrl)) return refuseDiscovery("discovery:url-invalid");
    }

    const seenUrls = new Set<string>();
    const seenPageLocales = new Set<string>();
    for (const fact of facts) {
      const urlKey = fact.canonicalUrl.toLowerCase();
      if (seenUrls.has(urlKey)) return refuseDiscovery("discovery:duplicate-url");
      seenUrls.add(urlKey);
      const pageKey = `${fact.pageId}\u0000${fact.localeTag}`;
      if (seenPageLocales.has(pageKey)) return refuseDiscovery("discovery:duplicate-page");
      seenPageLocales.add(pageKey);
    }

    const publicFacts = facts.filter((fact) => fact.isPublic);
    if (publicFacts.length === 0) return refuseDiscovery("discovery:url-invalid");

    const entries: UnoPublicDiscoveryEntry[] = [];
    for (const fact of publicFacts) {
      const alternates: UnoPublicDiscoveryAlternate[] = publicFacts
        .filter((other) => other.pageId === fact.pageId && other.localeTag !== fact.localeTag)
        .map((other) => ({ localeTag: other.localeTag, href: other.canonicalUrl }))
        .sort((left, right) => compareCodePoints(left.localeTag, right.localeTag));
      if (alternates.length + 1 > UNO_PUBLIC_DISCOVERY_LIMITS.alternatesPerPage) {
        return refuseDiscovery("discovery:too-many");
      }

      const entry: {
        pageId: string;
        routePath: string;
        localeTag: string;
        canonicalUrl: string;
        alternates: readonly UnoPublicDiscoveryAlternate[];
        xDefault?: string;
      } = {
        pageId: fact.pageId,
        routePath: fact.routePath,
        localeTag: fact.localeTag,
        canonicalUrl: fact.canonicalUrl,
        alternates: alternates.map((alternate) => Object.freeze({ ...alternate })),
      };
      // `x-default` only for the reserved Home, and only to an actually published public default locale.
      if (fact.pageId === HOME_CONTENT_SLUG && fact.routePath === "") {
        const defaultHome = publicFacts.find(
          (other) => other.pageId === HOME_CONTENT_SLUG && other.localeTag === defaultLocale,
        );
        if (defaultHome !== undefined) entry.xDefault = defaultHome.canonicalUrl;
      }
      entries.push(Object.freeze(entry));
    }

    entries.sort((left, right) => compareCodePoints(left.canonicalUrl, right.canonicalUrl));

    return deepFreeze({
      accepted: true as const,
      site: { entityId: first.entityId, facetId: first.facetId, siteId: first.siteId },
      defaultLocale,
      entries,
      sitemapUrls: entries.map((entry) => entry.canonicalUrl),
    });
  } catch (error) {
    if (error instanceof HostileStructure) return refuseDiscovery("discovery:input-invalid");
    return refuseDiscovery("discovery:unreadable");
  }
}
