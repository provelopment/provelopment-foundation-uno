/**
 * Foundation Uno — the closed U03 candidate-address contract (`UNO-WO-019 / R01`).
 *
 * WHAT THIS IS. A pure index of the **candidate** addresses the one authored Entity's expressly
 * selected Site could eventually serve, and one byte-exact pathname matcher over that index. A
 * candidate is a *proposal derived from authored declarations*. It is not a route, not a redirect,
 * not a rewrite, not a rendered Page and not publication: nothing here is imported by `src/app`, no
 * App Router segment, middleware, metadata alternate, sitemap or `robots.txt` endpoint is created,
 * and every non-existent path keeps its existing HTTP 404 response.
 *
 * THE OWNER-APPROVED SCHEMA (UNO-WO-019 §3). One Entity; one explicitly selected Site from
 * `deployment/uno.config.json` (Facet `foundation`, Site `main`). The authored full language-and-region
 * locale stays the identity (`en-001`, `de-DE`, `zh-Hans-CN`); the **path key** is that whole locale
 * lowercased through `localePathKey` (`en-001`, `de-de`, `zh-hans-cn`). `canonicalLocaleTag` remains
 * the authored spelling for future metadata and is never the URL spelling. The reserved Home
 * declaration (`id: "home"`, `route: ["home"]`) proposes `/<locale-path-key>` and suppresses the
 * literal `home` segment; no `/en-001/home` alias exists. Any other Page proposes
 * `/<locale-path-key>/<pageRoutePath>` with no Site or Facet segment, at most four relative segments
 * and a whole pathname bounded to 240 ASCII characters.
 *
 * MATCHING. Exact pathname equality only: one leading slash, lowercase content-slug segments, no
 * query, fragment, percent escape, backslash, scheme, doubled or trailing slash. There is no visitor
 * IP, cookie, `Accept-Language`, geolocation or inferred locale, and no redirect or fallback. A
 * well-shaped pathname that names no candidate is `route:unmatched`; a malformed pathname is
 * `route:invalid-pathname`.
 *
 * PROVENANCE. NEW UNO-OWNED code. It reuses only Uno's own pure contracts —
 * `validateUnoManifestGraph`, `validateUnoSiteSelection`, `localePathKey`, `canonicalLocaleTag`,
 * `localeTagIssue`, `pageRoutePath` and `HOME_CONTENT_SLUG` — and imports no Foundation or Solo
 * source. The Foundation repository was read only for prior reference; no upstream byte runs here.
 *
 * PURITY. Framework-free and dependency-free: no Next.js, React, Node built-in, `fs`, `path`, URL
 * network or filesystem, environment, process, clock, randomness, adapter or content parsing.
 * Importing this module executes nothing.
 *
 * HOSTILE INPUT. Every accepted value is freshly copied and recursively deep-frozen; caller data is
 * never mutated. Hostile manifest or selection structure is already refused by the two upstream
 * validators (their `unreadable` reasons become `route:unreadable`), a hostile pathname is refused
 * without reading any property from it, and no refusal echoes an authored string, private path,
 * secret or Proxy error.
 */

import { HOME_CONTENT_SLUG, isContentSlug } from "../page-content";
import { pageRoutePath } from "../page-route-path";
import { validateUnoManifestGraph } from "./manifest-graph";
import { validateUnoSiteAddressConfig, validateUnoSiteSelection } from "./uno-config";
import { canonicalLocaleTag, localePathKey, localeTagIssue } from "./uno-locales";

/** Declared bounds. A limit, not a default: exceeding it is a refusal, never a truncation. */
export const UNO_ROUTE_LIMITS = Object.freeze({
  pathnameLength: 240,
  localePathKeyLength: 64,
});

/** The single separator of an address, and the only one accepted in an incoming pathname. */
const PATH_SEPARATOR = "/";

/** Characters that may never appear in a candidate pathname this contract would match. */
const FORBIDDEN_PATHNAME_PARTS: readonly string[] = Object.freeze(["?", "#", "%", "\\", ":", " "]);

/**
 * The closed refusal vocabulary. Every reason a caller can receive is one of these literals, so a
 * diagnostic can never echo an authored value, a private path or a thrown message.
 *
 * The first six are required by the order; `route:invalid-route`, `route:invalid-locale` and
 * `route:pathname-too-long` are narrowly justified additions that keep three genuinely distinct
 * failures — an unusable Page route, an unusable authored locale and an over-long derived path — out
 * of the manifest/selection bucket they do not belong to.
 */
export type UnoRouteRefusal =
  | "route:manifest-invalid"
  | "route:selection-invalid"
  | "route:invalid-pathname"
  | "route:unmatched"
  | "route:duplicate-address"
  | "route:unreadable"
  | "route:invalid-route"
  | "route:invalid-locale"
  | "route:pathname-too-long";

/** The closed refusal vocabulary as data, for callers that must enumerate or document it. */
export const UNO_ROUTE_REFUSAL_REASONS: readonly UnoRouteRefusal[] = Object.freeze([
  "route:manifest-invalid",
  "route:selection-invalid",
  "route:invalid-pathname",
  "route:unmatched",
  "route:duplicate-address",
  "route:unreadable",
  "route:invalid-route",
  "route:invalid-locale",
  "route:pathname-too-long",
]);

/**
 * One preserved source *declaration*.
 *
 * It records what the authored manifest declared and nothing else: a candidate never opens, selects,
 * prefers, parses or renders a source, and a declaration is never publication authority.
 */
export interface UnoRouteCandidateSource {
  readonly kind: string;
  readonly path: string;
}

/**
 * One candidate address of the selected Site.
 *
 * `localeTag` is the authored canonical spelling; `localePathKey` is the lowercase URL spelling.
 * `routePath` is the validated relative route inside the locale directory, and is the empty string
 * for the reserved Home Page, whose candidate pathname is the locale root itself.
 */
export interface UnoRouteCandidate {
  readonly entityId: string;
  readonly facetId: string;
  readonly siteId: string;
  readonly pageId: string;
  readonly localeTag: string;
  readonly localePathKey: string;
  readonly routePath: string;
  readonly pathname: string;
  readonly sources: readonly UnoRouteCandidateSource[];
}

/** A tagged index result: immutable candidates, or one closed reason and no candidate at all. */
export type UnoRouteIndexResult =
  | { readonly accepted: true; readonly candidates: readonly UnoRouteCandidate[] }
  | { readonly accepted: false; readonly reason: UnoRouteRefusal };

/** A tagged match result: one immutable candidate, or one closed reason and no route. */
export type UnoRouteMatchResult =
  | { readonly accepted: true; readonly candidate: UnoRouteCandidate }
  | { readonly accepted: false; readonly reason: UnoRouteRefusal };


/** The bounded index refusal. No partial candidate, no echoed value. */
function refuseIndex(reason: UnoRouteRefusal): UnoRouteIndexResult {
  return Object.freeze({ accepted: false, reason });
}

/** The bounded match refusal. No partial candidate, no echoed value. */
function refuseMatch(reason: UnoRouteRefusal): UnoRouteMatchResult {
  return Object.freeze({ accepted: false, reason });
}

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted address. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/**
 * Compare two ASCII strings by Unicode code point.
 *
 * `localeCompare` is deliberately not used: it is locale- and platform-sensitive, so the same
 * authored input could order differently on two machines. Both operands here are validated ASCII
 * content slugs and separators, where code-unit order *is* code-point order.
 */
function compareCodePoints(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/**
 * Diagnose an incoming pathname without reading any property from a non-string value.
 *
 * The rule is lexical and strict: one leading separator, at least one segment, only lowercase
 * content-slug segments, no trailing separator, no doubled separator and none of the characters that
 * would give the address a second meaning (`?`, `#`, `%`, `\`, `:`, space). Bounds are applied before
 * anything is split, so no unbounded input reaches the segment loop.
 */
function pathnameIssue(pathname: unknown): UnoRouteRefusal | null {
  if (typeof pathname !== "string") return "route:invalid-pathname";
  if (pathname.length === 0 || pathname.length > UNO_ROUTE_LIMITS.pathnameLength) {
    return "route:invalid-pathname";
  }
  if (!pathname.startsWith(PATH_SEPARATOR)) return "route:invalid-pathname";
  if (pathname.length === 1) return "route:invalid-pathname";
  if (pathname.endsWith(PATH_SEPARATOR)) return "route:invalid-pathname";
  for (const part of FORBIDDEN_PATHNAME_PARTS) {
    if (pathname.includes(part)) return "route:invalid-pathname";
  }
  if (pathname.includes(`${PATH_SEPARATOR}${PATH_SEPARATOR}`)) return "route:invalid-pathname";

  const segments = pathname.slice(1).split(PATH_SEPARATOR);
  if (segments.length === 0) return "route:invalid-pathname";
  for (const segment of segments) {
    if (!isContentSlug(segment)) return "route:invalid-pathname";
  }
  return null;
}


/**
 * Build the immutable candidate index for the one selected Site.
 *
 * The manifest is validated first, then the Site selection, so an invalid manifest always refuses
 * before a Site is considered. Both are caller-supplied data; nothing is read from disk. A rejection
 * returns one closed literal and no candidate derived from it.
 */
export function buildUnoCandidateRouteIndex(
  manifest: unknown,
  selection: unknown,
): UnoRouteIndexResult {
  try {
    return analyzeIndex(manifest, selection);
  } catch {
    return refuseIndex("route:unreadable");
  }
}

/** The guarded index walk. Every failure returns before any candidate escapes. */
function analyzeIndex(manifest: unknown, selection: unknown): UnoRouteIndexResult {
  const validated = validateUnoManifestGraph(manifest);
  if (!validated.accepted) {
    return refuseIndex(
      validated.reason === "input:unreadable" ? "route:unreadable" : "route:manifest-invalid",
    );
  }

  const selected = validateUnoSiteSelection(selection, manifest);
  if (!selected.accepted) {
    return refuseIndex(
      selected.reason === "config:unreadable" ? "route:unreadable" : "route:selection-invalid",
    );
  }

  const entity = validated.graph.entities[0];
  if (entity === undefined) return refuseIndex("route:manifest-invalid");

  const facetId = selected.config.selectedSite.facetId;
  const siteId = selected.config.selectedSite.siteId;
  const facet = entity.facets.find((candidate) => candidate.id === facetId);
  if (facet === undefined) return refuseIndex("route:selection-invalid");
  const site = facet.sites.find((candidate) => candidate.id === siteId);
  if (site === undefined) return refuseIndex("route:selection-invalid");

  const candidates: UnoRouteCandidate[] = [];
  const seenPathnames = new Set<string>();

  for (const page of site.pages) {
    const routePath = pageRoutePath(...page.route);
    if (routePath === null) return refuseIndex("route:invalid-route");

    const isReservedHome =
      page.id === HOME_CONTENT_SLUG &&
      page.route.length === 1 &&
      page.route[0] === HOME_CONTENT_SLUG;

    for (const representation of page.representations) {
      const locale = representation.locale;
      if (localeTagIssue(locale) !== null) return refuseIndex("route:invalid-locale");

      let localeTag: string;
      let pathKey: string;
      try {
        localeTag = canonicalLocaleTag(locale);
        pathKey = localePathKey(locale);
      } catch {
        return refuseIndex("route:invalid-locale");
      }
      if (localeTag !== locale) return refuseIndex("route:invalid-locale");
      if (pathKey.length === 0 || pathKey.length > UNO_ROUTE_LIMITS.localePathKeyLength) {
        return refuseIndex("route:invalid-locale");
      }

      const relativeRoutePath = isReservedHome ? "" : routePath;
      const pathname =
        relativeRoutePath === ""
          ? `${PATH_SEPARATOR}${pathKey}`
          : `${PATH_SEPARATOR}${pathKey}${PATH_SEPARATOR}${relativeRoutePath}`;
      if (pathname.length > UNO_ROUTE_LIMITS.pathnameLength) {
        return refuseIndex("route:pathname-too-long");
      }
      if (seenPathnames.has(pathname)) return refuseIndex("route:duplicate-address");
      seenPathnames.add(pathname);

      candidates.push({
        entityId: entity.id,
        facetId: facet.id,
        siteId: site.id,
        pageId: page.id,
        localeTag,
        localePathKey: pathKey,
        routePath: relativeRoutePath,
        pathname,
        sources: representation.sources.map((source) => ({ kind: source.kind, path: source.path })),
      });
    }
  }

  candidates.sort(
    (left, right) =>
      compareCodePoints(left.pathname, right.pathname) ||
      compareCodePoints(left.pageId, right.pageId) ||
      compareCodePoints(left.localeTag, right.localeTag),
  );

  return Object.freeze({
    accepted: true,
    candidates: Object.freeze(deepFreeze(candidates) as UnoRouteCandidate[]),
  });
}

/**
 * Match one incoming pathname against the candidate index by exact string equality.
 *
 * The pathname shape is judged first, then the index is rebuilt from the same caller-supplied data,
 * then one byte-exact comparison decides. The result is a candidate record or a closed literal — never
 * a route, a redirect, an HTTP response or a fallback to a nearby Page.
 */
export function matchUnoCandidateRoute(
  pathname: unknown,
  manifest: unknown,
  selection: unknown,
): UnoRouteMatchResult {
  try {
    return analyzeMatch(pathname, manifest, selection);
  } catch {
    return refuseMatch("route:unreadable");
  }
}

/** The guarded match walk. */
function analyzeMatch(
  pathname: unknown,
  manifest: unknown,
  selection: unknown,
): UnoRouteMatchResult {
  const issue = pathnameIssue(pathname);
  if (issue !== null) return refuseMatch(issue);

  const index = buildUnoCandidateRouteIndex(manifest, selection);
  if (!index.accepted) return refuseMatch(index.reason);

  const target = pathname as string;
  const match = index.candidates.find((candidate) => candidate.pathname === target);
  if (match === undefined) return refuseMatch("route:unmatched");
  return Object.freeze({ accepted: true, candidate: match });
}

/**
 * The declared host of one accepted origin, lowercased (`UNO-WO-086 / R01`, M3).
 *
 * It is read from the configured origin and from nowhere else: no request `Host` header, forwarded header, cookie,
 * environment value or DNS lookup can produce or alter it. The lexical URL rules are already the canonical policy's, so
 * this only removes the scheme and lowercases the authority.
 */
function hostOf(origin: string): string | null {
  const marker = origin.indexOf("://");
  if (marker < 0) return null;
  const host = origin.slice(marker + 3).toLowerCase();
  if (host.length === 0 || host.length > 260) return null;
  if (/[/\\?#@\s]/u.test(host)) return null;
  return host;
}

/**
 * One candidate address of one bound Site: the single-Site candidate plus the identity that makes it host-qualified.
 *
 * `pathname` keeps its existing meaning — the path *inside* the Site, beginning at the locale key — while `pathPrefix`
 * and `origin` place it, and `address` is the full public address. `pathname` is never the request path when a Site has a
 * prefix, so a caller can never mistake a Site-local path for a host-wide one.
 */
export interface UnoSiteRouteCandidate extends UnoRouteCandidate {
  readonly origin: string;
  readonly pathPrefix: string;
  readonly host: string;
  readonly address: string;
}

/** A tagged multi-Site index result: candidates for every bound Site, or one closed reason. */
export type UnoSiteRouteIndexResult =
  | { readonly accepted: true; readonly candidates: readonly UnoSiteRouteCandidate[] }
  | { readonly accepted: false; readonly reason: UnoRouteRefusal };

/** A tagged multi-Site match result: exactly one candidate, or one closed reason. */
export type UnoSiteRouteMatchResult =
  | { readonly accepted: true; readonly candidate: UnoSiteRouteCandidate }
  | { readonly accepted: false; readonly reason: UnoRouteRefusal };

function refuseSiteIndex(reason: UnoRouteRefusal): UnoSiteRouteIndexResult {
  return Object.freeze({ accepted: false, reason });
}

function refuseSiteMatch(reason: UnoRouteRefusal): UnoSiteRouteMatchResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Build the immutable candidate index for **every** Site the address declaration binds (`UNO-WO-086 / R01`, M3).
 *
 * The declared `default` is never consulted: it resolves an ambiguous entry and must not be able to remove a Site, so a
 * default-bound installation and a default-free one produce the same candidate set. Two Sites may share an origin only
 * with disjoint whole-segment prefixes, which is what makes a request path assignable to exactly one Site; an overlapping
 * or duplicated pair refuses here rather than being resolved by guessing.
 */
export function buildUnoSiteRouteIndex(
  manifest: unknown,
  addressConfig: unknown,
): UnoSiteRouteIndexResult {
  try {
    return analyzeSiteIndex(manifest, addressConfig);
  } catch {
    return refuseSiteIndex("route:unreadable");
  }
}

/** The guarded multi-Site index walk. Every failure returns before any candidate escapes. */
function analyzeSiteIndex(manifest: unknown, addressConfig: unknown): UnoSiteRouteIndexResult {
  const validated = validateUnoManifestGraph(manifest);
  if (!validated.accepted) {
    return refuseSiteIndex(
      validated.reason === "input:unreadable" ? "route:unreadable" : "route:manifest-invalid",
    );
  }
  const addresses = validateUnoSiteAddressConfig(addressConfig, manifest);
  if (!addresses.accepted) {
    return refuseSiteIndex(
      addresses.reason === "config:unreadable" ? "route:unreadable" : "route:selection-invalid",
    );
  }
  const entity = validated.graph.entities[0];
  if (entity === undefined) return refuseSiteIndex("route:manifest-invalid");

  const bindings = addresses.config.sites;
  const candidates: UnoSiteRouteCandidate[] = [];
  const seenAddresses = new Set<string>();

  for (const binding of bindings) {
    const facet = entity.facets.find((candidate) => candidate.id === binding.facetId);
    if (facet === undefined) return refuseSiteIndex("route:selection-invalid");
    const site = facet.sites.find((candidate) => candidate.id === binding.siteId);
    if (site === undefined) return refuseSiteIndex("route:selection-invalid");
    const host = hostOf(binding.origin);
    if (host === null) return refuseSiteIndex("route:selection-invalid");

    for (const page of site.pages) {
      const routePath = pageRoutePath(...page.route);
      if (routePath === null) return refuseSiteIndex("route:invalid-route");

      const isReservedHome =
        page.id === HOME_CONTENT_SLUG &&
        page.route.length === 1 &&
        page.route[0] === HOME_CONTENT_SLUG;

      for (const representation of page.representations) {
        const locale = representation.locale;
        if (localeTagIssue(locale) !== null) return refuseSiteIndex("route:invalid-locale");

        let localeTag: string;
        let pathKey: string;
        try {
          localeTag = canonicalLocaleTag(locale);
          pathKey = localePathKey(locale);
        } catch {
          return refuseSiteIndex("route:invalid-locale");
        }
        if (localeTag !== locale) return refuseSiteIndex("route:invalid-locale");
        if (pathKey.length === 0 || pathKey.length > UNO_ROUTE_LIMITS.localePathKeyLength) {
          return refuseSiteIndex("route:invalid-locale");
        }

        const relativeRoutePath = isReservedHome ? "" : routePath;
        const pathname =
          relativeRoutePath === ""
            ? `${PATH_SEPARATOR}${pathKey}`
            : `${PATH_SEPARATOR}${pathKey}${PATH_SEPARATOR}${relativeRoutePath}`;
        const fullPathname = binding.pathPrefix === "" ? pathname : `${binding.pathPrefix}${pathname}`;
        if (fullPathname.length > UNO_ROUTE_LIMITS.pathnameLength) {
          return refuseSiteIndex("route:pathname-too-long");
        }

        // Host-qualified identity: the same Site-local path on two origins is two different addresses, so the key is the
        // whole address and never the path alone.
        const addressKey = `${binding.origin}${fullPathname}`;
        if (seenAddresses.has(addressKey)) return refuseSiteIndex("route:duplicate-address");
        seenAddresses.add(addressKey);

        candidates.push({
          entityId: entity.id,
          facetId: facet.id,
          siteId: site.id,
          pageId: page.id,
          localeTag,
          localePathKey: pathKey,
          routePath: relativeRoutePath,
          origin: binding.origin,
          pathPrefix: binding.pathPrefix,
          host,
          address: addressKey,
          pathname,
          sources: representation.sources.map((source) => ({ kind: source.kind, path: source.path })),
        });
      }
    }
  }

  candidates.sort(
    (left, right) =>
      compareCodePoints(left.address, right.address) ||
      compareCodePoints(left.pageId, right.pageId) ||
      compareCodePoints(left.localeTag, right.localeTag),
  );

  return Object.freeze({
    accepted: true,
    candidates: Object.freeze(deepFreeze(candidates) as UnoSiteRouteCandidate[]),
  });
}

/**
 * Match one declared host and request pathname to exactly one bound Site's candidate (`UNO-WO-086 / R01`, M3).
 *
 * Assignment is whole-segment: a Site bound at `/docs` owns `/docs` and `/docs/...` and never `/docsy`, while the root
 * Site owns only paths that no longer prefix claims. The host is compared against the *configured* authority only, so an
 * unknown, hostile or forwarded host can never grant identity — it simply matches nothing.
 */
export function matchUnoSiteRouteCandidate(
  host: unknown,
  pathname: unknown,
  manifest: unknown,
  addressConfig: unknown,
): UnoSiteRouteMatchResult {
  try {
    return analyzeSiteMatch(host, pathname, manifest, addressConfig);
  } catch {
    return refuseSiteMatch("route:unreadable");
  }
}

/** The guarded multi-Site match walk. */
function analyzeSiteMatch(
  host: unknown,
  pathname: unknown,
  manifest: unknown,
  addressConfig: unknown,
): UnoSiteRouteMatchResult {
  const issue = pathnameIssue(pathname);
  if (issue !== null) return refuseSiteMatch(issue);
  if (typeof host !== "string") return refuseSiteMatch("route:unmatched");
  const declaredHost = host.toLowerCase();
  if (declaredHost.length === 0) return refuseSiteMatch("route:unmatched");

  const index = buildUnoSiteRouteIndex(manifest, addressConfig);
  if (!index.accepted) return refuseSiteMatch(index.reason);

  const target = pathname as string;
  const matches = index.candidates.filter((candidate) => {
    if (candidate.host !== declaredHost) return false;
    if (candidate.pathPrefix === "") return candidate.pathname === target;
    if (target !== candidate.pathPrefix && !target.startsWith(`${candidate.pathPrefix}${PATH_SEPARATOR}`)) {
      return false;
    }
    return candidate.pathname === target.slice(candidate.pathPrefix.length);
  });

  if (matches.length === 0) return refuseSiteMatch("route:unmatched");
  const [only] = matches;
  if (only === undefined || matches.length > 1) return refuseSiteMatch("route:duplicate-address");
  return Object.freeze({ accepted: true, candidate: only });
}
