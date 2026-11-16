/**
 * Foundation Uno — the closed EFS authored-graph contract (U02, `UNO-WO-013 / R01`).
 *
 * WHAT THIS IS. One authored topology declaration: exactly one Entity, then Facets, Sites,
 * Pages, localized representations and declared source candidates. It is a *declaration of
 * authorship*, never a serving instruction: nothing here selects a public Site, opens a route,
 * resolves a URL, reads a file, parses Markdown or JSON content, or authorises publication.
 *
 * PROVENANCE. REWRITTEN for Uno, informed by the pinned Foundation GEO-03 commit
 * `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, file `src/config/efs/manifest.ts`
 * (Git blob `e4f578fd4be3c393483f851867f605e5d216cb64`, 24,124 bytes). This module is an
 * original Uno implementation, not a copy: no upstream byte runs here and no upstream blob
 * identity is carried. The upstream **two-Entity**, `publications`, Spoke-binding, host and
 * geo fields are deliberately absent. `publication.ts` (25,840 B) and `page-document.ts`
 * (45,106 B) are DEFERRED wholesale, and `deployment/efs/manifest.json` (11,607 B) was read
 * only for the topology idea.
 *
 * PURITY. Framework-free and dependency-free within Uno's own core: no `fs`, no process,
 * environment, clock, network, adapter, Next.js, React or Node built-in. Validation of the
 * caller's value is the only work performed, and importing this module executes nothing.
 *
 * HOSTILE INPUT. Only own enumerable **data** properties are read; accessors are refused
 * without ever being invoked, symbol properties and non-plain prototypes are refused, and a
 * throwing Proxy trap becomes a bounded refusal because the whole walk is guarded. Nothing is
 * mutated, no caller value is stringified into a diagnostic, and every refusal is one of the
 * closed literals in `REFUSAL_REASONS`.
 */

import { HOME_CONTENT_SLUG, isContentSlug } from "../page-content";
import { PAGE_ROUTE_PATH_MAX_SEGMENTS, pageRoutePath } from "../page-route-path";
import { isEntityId } from "./identity";
import { canonicalLocaleTag, localeTagIssue } from "./uno-locales";

/** The only source candidate kinds this increment declares. */
export type UnoManifestSourceKind = "json" | "markdown";

/** One declared, repo-root-relative content candidate. Lexical only — never opened here. */
export interface UnoManifestSource {
  readonly kind: UnoManifestSourceKind;
  readonly path: string;
}

/** One authored locale representation and the candidates declared for it. */
export interface UnoManifestRepresentation {
  readonly locale: string;
  readonly sources: readonly UnoManifestSource[];
}

/** One authored Page: its authoring id, its authoring route segments and its representations. */
export interface UnoManifestPage {
  readonly id: string;
  readonly route: readonly string[];
  readonly representations: readonly UnoManifestRepresentation[];
}

/** One authored Site inside a Facet. */
export interface UnoManifestSite {
  readonly id: string;
  readonly pages: readonly UnoManifestPage[];
}

/** One authored Facet inside the single Entity. */
export interface UnoManifestFacet {
  readonly id: string;
  readonly sites: readonly UnoManifestSite[];
}

/** The single authored Entity. */
export interface UnoManifestEntity {
  readonly id: string;
  readonly facets: readonly UnoManifestFacet[];
}

/** The validated, deep-cloned, deeply frozen authored graph. */
export interface UnoManifestGraph {
  readonly entities: readonly UnoManifestEntity[];
}

/**
 * The closed refusal vocabulary. Every reason a caller can receive is one of these literals, so
 * a diagnostic can never echo an authored value, a private path or a caller's own message.
 */
export type UnoManifestRefusal =
  | "input:unreadable"
  | "shape:not-an-object"
  | "shape:unsupported-field"
  | "shape:missing-field"
  | "shape:invalid-collection"
  | "shape:empty-collection"
  | "shape:too-many"
  | "entity:cardinality"
  | "entity:invalid-id"
  | "entity:duplicate-id"
  | "facet:invalid-id"
  | "facet:duplicate-id"
  | "site:invalid-id"
  | "site:duplicate-id"
  | "page:invalid-id"
  | "page:duplicate-id"
  | "page:invalid-route"
  | "page:duplicate-route"
  | "representation:invalid-locale"
  | "representation:duplicate-locale"
  | "source:invalid-kind"
  | "source:invalid-path"
  | "source:unsafe-path"
  | "source:duplicate-kind"
  | "source:duplicate-path";

/** The closed refusal vocabulary as data, for callers that must enumerate or document it. */
export const REFUSAL_REASONS: readonly UnoManifestRefusal[] = Object.freeze([
  "input:unreadable",
  "shape:not-an-object",
  "shape:unsupported-field",
  "shape:missing-field",
  "shape:invalid-collection",
  "shape:empty-collection",
  "shape:too-many",
  "entity:cardinality",
  "entity:invalid-id",
  "entity:duplicate-id",
  "facet:invalid-id",
  "facet:duplicate-id",
  "site:invalid-id",
  "site:duplicate-id",
  "page:invalid-id",
  "page:duplicate-id",
  "page:invalid-route",
  "page:duplicate-route",
  "representation:invalid-locale",
  "representation:duplicate-locale",
  "source:invalid-kind",
  "source:invalid-path",
  "source:unsafe-path",
  "source:duplicate-kind",
  "source:duplicate-path",
]);

/** A tagged result: a validated graph, or one closed reason and no partial graph. */
export type UnoManifestValidationResult =
  | { readonly accepted: true; readonly graph: UnoManifestGraph }
  | { readonly accepted: false; readonly reason: UnoManifestRefusal };

/** The exact authored content root; no candidate may sit outside it. */
export const MANIFEST_CONTENT_ROOT = "deployment/efs/content/";

/**
 * Declared bounds. These are limits, not defaults: nothing is filled in, padded or inferred,
 * and exceeding a bound is a refusal rather than a truncation.
 */
export const MANIFEST_GRAPH_LIMITS = Object.freeze({
  entities: 1,
  facetsPerEntity: 8,
  sitesPerFacet: 8,
  pagesPerSite: 64,
  representationsPerPage: 16,
  sourcesPerRepresentation: 2,
  routeSegments: PAGE_ROUTE_PATH_MAX_SEGMENTS,
  sourcePathLength: 240,
  identifierLength: 64,
  totalSources: 512,
});

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for input that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/**
 * Read an untrusted value as a plain record of own enumerable data properties.
 *
 * A non-object (including `null` and an array) is reported as `null` so the caller can answer
 * `shape:not-an-object`. Hostile structure — a non-plain prototype, any symbol property, or any
 * accessor — throws `HostileInput`, which the public entry point turns into the bounded
 * `input:unreadable` refusal **without ever invoking a getter**.
 */
function ownData(value: unknown): DataRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new HostileInput();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileInput();
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileInput();
    copy[key] = descriptor.value;
  }
  return copy;
}

/** Exactly the declared fields, no more and no fewer. */
function shapeIssue(
  record: DataRecord,
  required: readonly string[],
  optional: readonly string[] = [],
): UnoManifestRefusal | null {
  for (const key of Object.keys(record)) {
    if (!required.includes(key) && !optional.includes(key)) return "shape:unsupported-field";
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return "shape:missing-field";
  }
  return null;
}

/** A bounded, non-empty array — declared explicitly, never defaulted. */
function collectionIssue(value: unknown, max: number): UnoManifestRefusal | null {
  if (!Array.isArray(value)) return "shape:invalid-collection";
  if (value.length === 0) return "shape:empty-collection";
  if (value.length > max) return "shape:too-many";
  return null;
}

/** Deep-freeze the validated clone so no caller can later rewrite accepted authority. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/** Printable ASCII only, and only the characters a repo-relative content path may contain. */
const SOURCE_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/;

/**
 * Validate one declared source path lexically — no filesystem, no glob, no resolution.
 *
 * The path must sit under the exact content root, use forward slashes, carry no traversal or
 * hidden segment, no scheme/query/fragment/percent/backslash/control/space, and end in the
 * suffix its declared kind requires. Confinement, reading and parsing remain U03 work.
 */
function sourcePathIssue(rawPath: unknown, kind: UnoManifestSourceKind): UnoManifestRefusal | null {
  if (typeof rawPath !== "string") return "source:invalid-path";
  if (rawPath.length === 0 || rawPath.length > MANIFEST_GRAPH_LIMITS.sourcePathLength) {
    return "source:invalid-path";
  }
  if (!SOURCE_PATH_PATTERN.test(rawPath)) return "source:unsafe-path";
  if (!rawPath.startsWith(MANIFEST_CONTENT_ROOT)) return "source:unsafe-path";

  const relative = rawPath.slice(MANIFEST_CONTENT_ROOT.length);
  if (relative.length === 0) return "source:invalid-path";
  for (const segment of relative.split("/")) {
    if (segment.length === 0 || segment === "." || segment === "..") return "source:unsafe-path";
    if (segment.startsWith(".")) return "source:unsafe-path";
  }

  const suffix = kind === "markdown" ? ".md" : ".json";
  if (!rawPath.endsWith(suffix)) return "source:invalid-path";
  return null;
}

/** The bounded refusal result. No partial graph, no echoed value. */
function refuse(reason: UnoManifestRefusal): UnoManifestValidationResult {
  return Object.freeze({ accepted: false, reason });
}

/** One validated node or one closed reason; used so no caller sees a half-built page. */
type Step<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: UnoManifestRefusal };

/** Mutable pass-by-reference counters, so bounds are shared across the whole walk. */
interface WalkState {
  readonly sourcePaths: Set<string>;
  totalSources: number;
}

/**
 * Validate one authored graph and return a tagged result.
 *
 * Refuses (never throws) for hostile input: accessors, symbols, non-plain prototypes, throwing
 * Proxy traps, cyclic or oversized structures. The accepted value is a fresh deep-cloned,
 * deeply frozen graph containing only the declared authoring fields — no publication flag, no
 * selected Site, no host, no URL and no runtime route.
 */
export function validateUnoManifestGraph(input: unknown): UnoManifestValidationResult {
  try {
    return analyzeGraph(input);
  } catch {
    return refuse("input:unreadable");
  }
}

/** The guarded walk. Every failure path returns before any graph is produced. */
function analyzeGraph(input: unknown): UnoManifestValidationResult {
  const root = ownData(input);
  if (root === null) return refuse("shape:not-an-object");
  const rootShape = shapeIssue(root, ["entities"]);
  if (rootShape) return refuse(rootShape);

  const entityValue = root.entities;
  if (!Array.isArray(entityValue)) return refuse("shape:invalid-collection");
  if (entityValue.length !== MANIFEST_GRAPH_LIMITS.entities) return refuse("entity:cardinality");

  const state: WalkState = { sourcePaths: new Set<string>(), totalSources: 0 };
  const seenEntityIds = new Set<string>();
  const entities: UnoManifestEntity[] = [];

  for (const rawEntity of entityValue as readonly unknown[]) {
    const entity = ownData(rawEntity);
    if (entity === null) return refuse("shape:not-an-object");
    const entityShape = shapeIssue(entity, ["id", "facets"]);
    if (entityShape) return refuse(entityShape);

    const entityId = entity.id;
    if (!isEntityId(entityId)) return refuse("entity:invalid-id");
    if (seenEntityIds.has(entityId)) return refuse("entity:duplicate-id");
    seenEntityIds.add(entityId);

    const facetValue = entity.facets;
    const facetCollection = collectionIssue(facetValue, MANIFEST_GRAPH_LIMITS.facetsPerEntity);
    if (facetCollection) return refuse(facetCollection);

    const seenFacetIds = new Set<string>();
    const facets: UnoManifestFacet[] = [];
    for (const rawFacet of facetValue as readonly unknown[]) {
      const facet = ownData(rawFacet);
      if (facet === null) return refuse("shape:not-an-object");
      const facetShape = shapeIssue(facet, ["id", "sites"]);
      if (facetShape) return refuse(facetShape);

      const facetId = facet.id;
      if (!isContentSlug(facetId)) return refuse("facet:invalid-id");
      if (seenFacetIds.has(facetId)) return refuse("facet:duplicate-id");
      seenFacetIds.add(facetId);

      const siteValue = facet.sites;
      const siteCollection = collectionIssue(siteValue, MANIFEST_GRAPH_LIMITS.sitesPerFacet);
      if (siteCollection) return refuse(siteCollection);

      const seenSiteIds = new Set<string>();
      const sites: UnoManifestSite[] = [];
      for (const rawSite of siteValue as readonly unknown[]) {
        const site = ownData(rawSite);
        if (site === null) return refuse("shape:not-an-object");
        const siteShape = shapeIssue(site, ["id", "pages"]);
        if (siteShape) return refuse(siteShape);

        const siteId = site.id;
        if (!isContentSlug(siteId)) return refuse("site:invalid-id");
        if (seenSiteIds.has(siteId)) return refuse("site:duplicate-id");
        seenSiteIds.add(siteId);

        const pageValue = site.pages;
        const pageCollection = collectionIssue(pageValue, MANIFEST_GRAPH_LIMITS.pagesPerSite);
        if (pageCollection) return refuse(pageCollection);

        const seenPageIds = new Set<string>();
        const seenRoutes = new Set<string>();
        const pages: UnoManifestPage[] = [];
        for (const rawPage of pageValue as readonly unknown[]) {
          const page = readPage(rawPage, seenPageIds, seenRoutes, state);
          if (!page.ok) return refuse(page.reason);
          pages.push(page.value);
        }

        sites.push(Object.freeze({ id: siteId, pages: Object.freeze(pages) }));
      }

      facets.push(Object.freeze({ id: facetId, sites: Object.freeze(sites) }));
    }

    entities.push(Object.freeze({ id: entityId, facets: Object.freeze(facets) }));
  }

  return Object.freeze({
    accepted: true,
    graph: deepFreeze({ entities: Object.freeze(entities) }),
  });
}


/**
 * Validate one Page: authoring slug id, bounded route segments, exactly one canonical locale
 * per representation, and the reserved Home slot rule.
 *
 * The reserved rule is deliberately two-way, so neither half can drift: the Page whose route
 * is exactly `["home"]` must be identified `home`, and a Page identified `home` must sit at
 * that route. A distinct nested `offers/home` stays an ordinary route under its own id.
 */
function readPage(
  raw: unknown,
  seenIds: Set<string>,
  seenRoutes: Set<string>,
  state: WalkState,
): Step<UnoManifestPage> {
  const page = ownData(raw);
  if (page === null) return { ok: false, reason: "shape:not-an-object" };
  const shape = shapeIssue(page, ["id", "route", "representations"]);
  if (shape) return { ok: false, reason: shape };

  const id = page.id;
  if (!isContentSlug(id)) return { ok: false, reason: "page:invalid-id" };
  if (seenIds.has(id)) return { ok: false, reason: "page:duplicate-id" };

  const routeValue = page.route;
  if (!Array.isArray(routeValue)) return { ok: false, reason: "page:invalid-route" };
  if (routeValue.length === 0 || routeValue.length > MANIFEST_GRAPH_LIMITS.routeSegments) {
    return { ok: false, reason: "page:invalid-route" };
  }

  const segments: string[] = [];
  for (const segment of routeValue as readonly unknown[]) {
    if (!isContentSlug(segment)) return { ok: false, reason: "page:invalid-route" };
    segments.push(segment);
  }

  // The one validated constructor: it refuses a repeated separator, a traversal segment or a
  // path beyond the documented depth/length caps, so no route is ever joined by hand here.
  const routePath = pageRoutePath(...segments);
  if (routePath === null) return { ok: false, reason: "page:invalid-route" };
  if (seenRoutes.has(routePath)) return { ok: false, reason: "page:duplicate-route" };

  const isReservedHome = segments.length === 1 && segments[0] === HOME_CONTENT_SLUG;
  if ((id === HOME_CONTENT_SLUG) !== isReservedHome) {
    return { ok: false, reason: "page:invalid-route" };
  }

  const representationValue = page.representations;
  const representationCollection = collectionIssue(
    representationValue,
    MANIFEST_GRAPH_LIMITS.representationsPerPage,
  );
  if (representationCollection) return { ok: false, reason: representationCollection };

  const seenLocales = new Set<string>();
  const representations: UnoManifestRepresentation[] = [];
  for (const rawRepresentation of representationValue as readonly unknown[]) {
    const representation = readRepresentation(rawRepresentation, seenLocales, state);
    if (!representation.ok) return representation;
    representations.push(representation.value);
  }

  seenIds.add(id);
  seenRoutes.add(routePath);

  return {
    ok: true,
    value: {
      id,
      route: Object.freeze(segments.slice()),
      representations: Object.freeze(representations),
    },
  };
}

/**
 * Validate one representation: a canonical, authored, full-region locale and one or two
 * declared candidates of distinct kinds.
 */
function readRepresentation(
  raw: unknown,
  seenLocales: Set<string>,
  state: WalkState,
): Step<UnoManifestRepresentation> {
  const representation = ownData(raw);
  if (representation === null) return { ok: false, reason: "shape:not-an-object" };
  const shape = shapeIssue(representation, ["locale", "sources"]);
  if (shape) return { ok: false, reason: shape };

  const locale = representation.locale;
  if (localeTagIssue(locale) !== null) return { ok: false, reason: "representation:invalid-locale" };
  let canonical: string;
  try {
    canonical = canonicalLocaleTag(locale);
  } catch {
    return { ok: false, reason: "representation:invalid-locale" };
  }
  // Stored spelling must already be canonical: `en`, `EN-001` and `en_US` are refused rather
  // than silently repaired into a different authored identity.
  if (canonical !== locale) return { ok: false, reason: "representation:invalid-locale" };
  if (seenLocales.has(locale)) return { ok: false, reason: "representation:duplicate-locale" };

  const sourceValue = representation.sources;
  const sourceCollection = collectionIssue(
    sourceValue,
    MANIFEST_GRAPH_LIMITS.sourcesPerRepresentation,
  );
  if (sourceCollection) return { ok: false, reason: sourceCollection };

  const seenKinds = new Set<string>();
  const sources: UnoManifestSource[] = [];
  for (const rawSource of sourceValue as readonly unknown[]) {
    const source = readSource(rawSource, seenKinds, state);
    if (!source.ok) return source;
    sources.push(source.value);
  }

  seenLocales.add(locale);

  return { ok: true, value: { locale, sources: Object.freeze(sources) } };
}

/**
 * Validate one source candidate: a declared kind, a confined repo-relative path, one kind per
 * representation and one path across the entire manifest.
 */
function readSource(
  raw: unknown,
  seenKinds: Set<string>,
  state: WalkState,
): Step<UnoManifestSource> {
  const source = ownData(raw);
  if (source === null) return { ok: false, reason: "shape:not-an-object" };
  const shape = shapeIssue(source, ["kind", "path"]);
  if (shape) return { ok: false, reason: shape };

  const kind = source.kind;
  if (kind !== "json" && kind !== "markdown") return { ok: false, reason: "source:invalid-kind" };
  if (seenKinds.has(kind)) return { ok: false, reason: "source:duplicate-kind" };

  const pathIssue = sourcePathIssue(source.path, kind);
  if (pathIssue !== null) return { ok: false, reason: pathIssue };

  const path = source.path as string;
  if (state.sourcePaths.has(path)) return { ok: false, reason: "source:duplicate-path" };
  state.totalSources += 1;
  if (state.totalSources > MANIFEST_GRAPH_LIMITS.totalSources) {
    return { ok: false, reason: "shape:too-many" };
  }

  seenKinds.add(kind);
  state.sourcePaths.add(path);

  return { ok: true, value: { kind, path } };
}
