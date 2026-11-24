/**
 * Foundation Uno — the server-only multi-Site serving composition (`UNO-WO-028 / R01`, `UNO-WO-095 / R01`).
 *
 * The single trusted IO boundary between Next.js and the accepted U03/U04 contracts. It reads the two fixed committed
 * declarations through one fixed deployment root, resolves the committed authority (the legacy one-Site form or the
 * version-2 all-Sites address declaration) and answers one question per request: which Site owns this authority and
 * whole-segment prefix, and may that Site serve this address?
 *
 * The request `host` is a plain **untrusted lookup key**. It is lowercased, shape-checked and compared for exact equality
 * against the origins the validated declaration already binds; it is never used to construct an origin and never falls back
 * to a default, an entry position, a forwarded header, the scheme or the environment. An authority no binding declares
 * matches nothing. This module reads no request header itself: only the thin document edge does, and it passes the value
 * here as an argument.
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { readUnoOwnedMedia, type UnoOwnedMediaOwner } from "../adapters/assets/uno-owned-media-reader";
import { planUnoPageAssets, readUnoPageAssetOccurrence, type UnoPageAssetPlan } from "../application/plan-uno-page-assets";
import { planUnoPublicDiscovery, type UnoPublicDiscoveryEntry } from "../application/plan-uno-public-discovery";
import { planUnoPublishedPage, type UnoPublishedPageAccepted } from "../application/plan-uno-published-page";
import { resolveUnoCommittedBase } from "../application/resolve-uno-committed-base";
import { resolveUnoCommittedLocales } from "../application/resolve-uno-committed-locales";
import {
  UNO_MANIFEST_PATH,
  UNO_SELECTION_PATH,
  UNO_SOURCE_LIMITS,
  loadUnoCandidateSource,
} from "../adapters/efs/uno-confined-source-reader";
import {
  UNO_MEDIA_NOMINAL_SIZE,
  readUnoOwnedAssetRef,
  unoOwnedMediaImageSize,
  type UnoPageMedia,
  type UnoResolvedImage,
  type UnoResolvedMedia,
} from "../core/assets/uno-owned-media";
import {
  UNO_SITE_ADDRESS_CONFIG_VERSION,
  validateUnoSiteAddressConfig,
  type UnoSiteAddressBinding,
} from "../core/efs/uno-config";
import { localePathKey } from "../core/efs/uno-locales";
import {
  buildUnoCandidateRouteIndex,
  buildUnoSiteRouteIndex,
  matchUnoSiteRouteCandidate,
  type UnoRouteCandidate,
  type UnoSiteRouteCandidate,
} from "../core/efs/uno-route-address";
import { HOME_CONTENT_SLUG } from "../core/page-content";
import type { UnoSectionNode } from "../core/page-document";

/** The closed refusal vocabulary of this boundary: one literal per failure family. */
export type UnoServingRefusal =
  | "serving:input-invalid"
  | "serving:authority-unavailable"
  | "serving:publication-refused"
  | "serving:renderer-unavailable"
  | "serving:media-unavailable"
  | "serving:discovery-unavailable";

/** A Page that may be served: an accepted published plan plus the media and occurrence ledger it declared. */
export type UnoServingPageOutcome =
  | {
      readonly status: "served";
      readonly page: UnoPublishedPageAccepted;
      readonly media?: UnoPageMedia;
      readonly assets?: UnoPageAssetPlan;
      /** `UNO-WO-104 / R01`: proven, server-only canonical URLs keyed `${section.id}:${itemIndex}`. */
      readonly routeHrefs?: ReadonlyMap<string, string>;
    }
  | { readonly status: "not-served"; readonly reason: UnoServingRefusal };

/** A short-alias outcome: one temporary redirect target, or nothing at all. */
export type UnoServingAliasOutcome =
  | { readonly status: "redirect"; readonly location: string }
  | { readonly status: "none"; readonly reason: UnoServingRefusal };

/** One request decision, as the document, metadata, route and refusal responder each need it. */
export type UnoServingDecision =
  | {
      readonly kind: "page";
      readonly page: UnoPublishedPageAccepted;
      readonly media?: UnoPageMedia;
      readonly routeHrefs?: ReadonlyMap<string, string>;
    }
  | { readonly kind: "redirect"; readonly location: string }
  | { readonly kind: "refused"; readonly reason: UnoServingRefusal };


/** The committed authority: the legacy one-Site form, the version-2 all-Sites form, or a refusal. */
type ServingAuthority =
  | {
      readonly mode: "legacy";
      readonly root: string;
      readonly manifest: unknown;
      readonly selection: unknown;
      readonly canonical: string;
      readonly aliases: readonly string[];
    }
  | {
      readonly mode: "qualified";
      readonly root: string;
      readonly manifest: unknown;
      readonly selection: unknown;
      readonly bindings: readonly UnoSiteAddressBinding[];
    }
  | { readonly mode: "refused"; readonly reason: UnoServingRefusal };

/** The qualified branch, named so helpers need no narrowing gymnastics. */
type QualifiedAuthority = Extract<ServingAuthority, { mode: "qualified" }>;

/** The bounded reader for one fixed declaration file, or `null` when it is absent, oversized or not JSON. */
function readFixedJson(root: string, relativePath: string, maxBytes: number): unknown | null {
  try {
    const path = resolve(root, relativePath);
    const stats = statSync(path);
    if (!stats.isFile() || stats.size > maxBytes) return null;
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    return null;
  }
}

/** The declared version of an untrusted declaration record, or `null` when it states none. */
function declaredVersion(value: unknown): number | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const version = (value as { readonly version?: unknown }).version;
  return typeof version === "number" && Number.isInteger(version) ? version : null;
}

/**
 * Resolve the committed authority from the two fixed declarations.
 *
 * A version-2 declaration is validated **once**, so the validated binding set is the only authority downstream and an
 * invalid multi-Site declaration can never be partially served.
 */
function readAuthority(): ServingAuthority {
  const root = process.cwd();
  const manifest = readFixedJson(root, UNO_MANIFEST_PATH, UNO_SOURCE_LIMITS.manifestBytes);
  const selection = readFixedJson(root, UNO_SELECTION_PATH, UNO_SOURCE_LIMITS.configBytes);
  if (manifest === null || selection === null) {
    return { mode: "refused", reason: "serving:authority-unavailable" };
  }

  if (declaredVersion(selection) === UNO_SITE_ADDRESS_CONFIG_VERSION) {
    const addresses = validateUnoSiteAddressConfig(selection, manifest);
    if (!addresses.accepted) return { mode: "refused", reason: "serving:authority-unavailable" };
    return { mode: "qualified", root, manifest, selection, bindings: addresses.config.sites };
  }

  const committed = resolveUnoCommittedBase({ manifest, selection });
  if (!committed.accepted) return { mode: "refused", reason: "serving:authority-unavailable" };
  return {
    mode: "legacy",
    root,
    manifest,
    selection,
    canonical: committed.base.canonical,
    aliases: committed.base.aliases,
  };
}


/** One absolute address of this build, or `null` when the shape cannot be one. */
function normalizePathname(pathname: unknown): string | null {
  if (typeof pathname !== "string") return null;
  if (pathname.length === 0 || pathname.length > 240) return null;
  if (!pathname.startsWith("/")) return null;
  if (/[?#%\\:\s]/u.test(pathname)) return null;
  if (pathname.length > 1 && pathname.endsWith("/")) return null;
  return pathname;
}

/**
 * Normalize an untrusted request authority for exact comparison against a configured origin.
 *
 * Only a lowercase DNS authority with an optional explicit port survives; a scheme, credentials, path, space, bracket,
 * trailing dot or empty label is refused. A different port, case or punycode form therefore simply matches no binding.
 */
function normalizeHost(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > 260) return null;
  const host = value.toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?$/u.test(host)) return null;
  if (host.includes("..")) return null;
  return host;
}

/** One request authority, where the empty string means the legacy, authority-less form. */
function readHost(hostInput: unknown): string | null {
  if (hostInput === undefined || hostInput === "") return "";
  return normalizeHost(hostInput);
}

/** The declared authority of one configured origin: scheme removed, lowercased, port preserved. */
function hostOfOrigin(origin: string): string | null {
  const marker = origin.indexOf("://");
  if (marker < 0) return null;
  return normalizeHost(origin.slice(marker + 3));
}

/** One whole-segment, lowercase public path prefix, as a validated declaration spells it. */
const DECLARED_PATH_PREFIX = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/u;

/**
 * Split one stored alias string into the authority and the path prefix it claims.
 *
 * The stored form is the validator's own `origin + pathPrefix` string, so this only re-reads it: the authority is
 * normalized exactly as a request authority is, and a prefix survives only when it is a whole-segment lowercase path.
 * Anything else yields `null` and therefore claims nothing at all.
 */
function splitDeclaredAddress(address: string): { readonly host: string; readonly prefix: string } | null {
  const marker = address.indexOf("://");
  if (marker < 0) return null;
  const rest = address.slice(marker + 3);
  const slash = rest.indexOf("/");
  const host = normalizeHost(slash < 0 ? rest : rest.slice(0, slash));
  if (host === null) return null;
  const prefix = slash < 0 ? "" : rest.slice(slash);
  if (prefix !== "" && !DECLARED_PATH_PREFIX.test(prefix)) return null;
  return { host, prefix };
}

/** One declared alias already translated into the address its owning Site actually publishes. */
export interface UnoServingAliasTarget {
  readonly facetId: string;
  readonly siteId: string;
  /** The owning Site's canonical authority, taken from its stored origin — never from the request. */
  readonly host: string;
  /** The owning Site's canonical pathname: the alias prefix replaced by that same binding's canonical prefix. */
  readonly pathname: string;
  /** The owning Site's canonical URL, assembled from stored values only. */
  readonly canonicalUrl: string;
}

/** The verdict of matching one request against every declared Site-address alias. */
export type UnoServingAliasAddressMatch =
  | { readonly status: "match"; readonly match: UnoServingAliasTarget }
  | { readonly status: "none" }
  | { readonly status: "ambiguous" };

/**
 * Translate one request into the canonical address of the Site that declared it as an alias.
 *
 * This is a **pure** translation: it reads nothing, binds nothing and publishes nothing. A request matches an alias only
 * by exact authority equality and a whole-segment prefix, so `/docs-older` never matches `/docs-old`, a different
 * authority matches nothing, and a suffix is carried over unchanged instead of a locale being invented. An alias root
 * (`/docs-old` with no suffix) names no authored locale and therefore claims nothing. Two claims on one request are
 * reported as ambiguous — never resolved by declaration order, array position or a default.
 */
export function matchUnoServingAliasAddress(
  bindings: readonly UnoSiteAddressBinding[],
  host: unknown,
  pathname: unknown,
): UnoServingAliasAddressMatch {
  const requestHost = normalizeHost(host);
  const requestPath = normalizePathname(pathname);
  if (requestHost === null || requestPath === null) return { status: "none" };

  const claims: UnoServingAliasTarget[] = [];
  for (const binding of bindings) {
    const canonicalHost = hostOfOrigin(binding.origin);
    if (canonicalHost === null) continue;
    for (const alias of binding.aliases) {
      const declared = splitDeclaredAddress(alias);
      if (declared === null || declared.prefix === "" || declared.host !== requestHost) continue;
      const suffix =
        requestPath === declared.prefix
          ? ""
          : requestPath.startsWith(`${declared.prefix}/`)
            ? requestPath.slice(declared.prefix.length)
            : null;
      if (suffix === null || suffix === "") continue;
      const canonicalPath = `${binding.pathPrefix}${suffix}`;
      // The translated address must itself be a whole-segment public path: no dot segment, empty segment or stray
      // character may ride across from the alias request into the destination.
      if (!DECLARED_PATH_PREFIX.test(canonicalPath)) continue;
      claims.push({
        facetId: binding.facetId,
        siteId: binding.siteId,
        host: canonicalHost,
        pathname: canonicalPath,
        canonicalUrl: `${binding.origin}${canonicalPath}`,
      });
    }
  }

  if (claims.length === 0) return { status: "none" };
  if (claims.length > 1) return { status: "ambiguous" };
  return { status: "match", match: claims[0] as UnoServingAliasTarget };
}


/** The bindings one request authority owns. An unknown authority owns none, so it can authorise nothing. */
function bindingsForHost(authority: ServingAuthority, host: string): readonly UnoSiteAddressBinding[] {
  if (authority.mode !== "qualified" || host.length === 0) return [];
  return authority.bindings.filter((binding) => hostOfOrigin(binding.origin) === host);
}

/** The Site-local path of one candidate, spelled as a request pathname carries it. */
function requestPathOf(binding: UnoSiteAddressBinding, candidatePathname: string): string {
  return binding.pathPrefix === "" ? candidatePathname : `${binding.pathPrefix}${candidatePathname}`;
}

/**
 * Both accepted call shapes, normalized once.
 *
 * The `(pathname)` string form carries no request authority and therefore never qualifies a version-2 request; the
 * `{ host, pathname }` object form is the qualified one. One helper serves every entry point, so no caller can silently
 * drop its pathname and no entry point can disagree with another about the same request.
 */
function readRequestInput(
  request: unknown,
  pathnameInput?: unknown,
): { readonly host: string; readonly pathname: string } | null {
  const stringForm = typeof request === "string";
  const host = stringForm ? "" : readHost((request as { readonly host?: unknown } | null)?.host);
  const rawPathname = stringForm
    ? request
    : (pathnameInput ?? (request as { readonly pathname?: unknown } | null)?.pathname);
  const pathname = normalizePathname(rawPathname);
  if (host === null || pathname === null) return null;
  return Object.freeze({ host, pathname });
}


/** One mutable section projection while a plan is resolved into render-ready media. */
interface MutableSectionMedia {
  image?: UnoResolvedImage;
  video?: UnoResolvedMedia;
  poster?: UnoResolvedImage;
  captions?: UnoResolvedMedia;
  items?: UnoResolvedImage[];
}

/** The accepted Page's own identity: the only thing that may select a `page`-zone capsule directory. */
function ownerOf(page: UnoPublishedPageAccepted): UnoOwnedMediaOwner {
  return { entityId: page.identity.entityId, facetId: page.identity.facetId, siteId: page.identity.siteId };
}

/**
 * Resolve and verify every asset one accepted Page declares.
 *
 * All-or-nothing: a missing, oversized, wrongly signed, escaping or integrity-mismatched occurrence refuses the whole Page
 * rather than dropping one module from a published document.
 */
function resolvePageMedia(
  root: string,
  page: UnoPublishedPageAccepted,
  plan: UnoPageAssetPlan,
): { readonly ok: true; readonly media: UnoPageMedia } | { readonly ok: false } {
  const owner = ownerOf(page);
  const bySection = new Map<string, MutableSectionMedia>();

  for (const occurrence of plan.occurrences) {
    const decision = readUnoOwnedAssetRef(occurrence.ref, occurrence.purpose);
    if (!decision.ok) return { ok: false };

    const read = readUnoOwnedMedia({
      repoRoot: root,
      owner,
      decision: decision.decision,
      full: occurrence.purpose !== "video",
    });
    if (!read.accepted) return { ok: false };

    const current = bySection.get(occurrence.sectionId) ?? {};
    if (occurrence.purpose === "captions") {
      current.captions = { src: occurrence.url, type: decision.decision.mime };
    } else if (occurrence.purpose === "video") {
      current.video = { src: occurrence.url, type: decision.decision.mime };
    } else {
      const size = unoOwnedMediaImageSize(read.bytes, decision.decision.extension);
      const image: UnoResolvedImage = {
        src: occurrence.url,
        type: decision.decision.mime,
        width: size?.width ?? UNO_MEDIA_NOMINAL_SIZE.width,
        height: size?.height ?? UNO_MEDIA_NOMINAL_SIZE.height,
      };
      if (occurrence.slot === "poster") {
        current.poster = image;
      } else if (occurrence.itemIndex >= 0) {
        const items = current.items === undefined ? [] : [...current.items];
        items[occurrence.itemIndex] = image;
        current.items = items;
      } else {
        current.image = image;
      }
    }
    bySection.set(occurrence.sectionId, current);
  }

  return { ok: true, media: bySection as UnoPageMedia };
}

/** Whether the loader's own candidate is exactly the request-scoped match: no sibling Site may substitute. */
function sameQualifiedCandidate(loaded: UnoRouteCandidate, matched: UnoSiteRouteCandidate): boolean {
  return (
    loaded.facetId === matched.facetId &&
    loaded.siteId === matched.siteId &&
    loaded.entityId === matched.entityId &&
    loaded.pathname === matched.pathname
  );
}

/** Whether a planned Page is exactly the matched candidate's Site and declared public address. */
function sameQualifiedPage(page: UnoPublishedPageAccepted, candidate: UnoSiteRouteCandidate): boolean {
  return (
    page.identity.facetId === candidate.facetId &&
    page.identity.siteId === candidate.siteId &&
    page.identity.entityId === candidate.entityId &&
    page.delivery.canonicalUrl === candidate.address
  );
}

/** One authored `routeTarget` occurrence, keyed by its already validated section id and item index. */
interface UnoRouteIntent {
  readonly key: string;
  readonly target: string;
}

/**
 * `UNO-WO-104 / R01`: collect every authored site-local route intent in one accepted Page, walking nested layout
 * children rather than only a top-level list. The key is deterministic `${section.id}:${itemIndex}`.
 */
function collectRouteIntents(nodes: readonly UnoSectionNode[], out: UnoRouteIntent[]): void {
  for (const node of nodes) {
    if (node.module === "content.prose") {
      const props = node.props as { readonly variant?: unknown; readonly items?: unknown };
      if (props.variant === "list" && Array.isArray(props.items)) {
        props.items.forEach((item: unknown, index: number) => {
          if (item === null || typeof item !== "object") return;
          const routeTarget = (item as { readonly routeTarget?: unknown }).routeTarget;
          if (typeof routeTarget === "string") out.push({ key: `${node.id}:${index}`, target: routeTarget });
        });
      }
    }
    const children = (node as { readonly children?: readonly UnoSectionNode[] }).children;
    if (Array.isArray(children)) collectRouteIntents(children, out);
  }
}

/** Finish one accepted plan: the renderer gate, then the all-or-nothing owned-media preflight. */
function finishPage(
  root: string,
  planned: UnoPublishedPageAccepted,
  routeHrefs?: ReadonlyMap<string, string>,
): UnoServingPageOutcome {
  if (planned.document.kind !== "json") return { status: "served", page: planned };
  if (planned.document.pageDocument === undefined) {
    return { status: "not-served", reason: "serving:renderer-unavailable" };
  }
  const assets = planUnoPageAssets(planned);
  if (assets.status !== "planned") return { status: "not-served", reason: "serving:media-unavailable" };
  const resolved = resolvePageMedia(root, planned, assets.plan);
  if (!resolved.ok) return { status: "not-served", reason: "serving:media-unavailable" };
  return routeHrefs === undefined
    ? { status: "served", page: planned, media: resolved.media, assets: assets.plan }
    : { status: "served", page: planned, media: resolved.media, assets: assets.plan, routeHrefs };
}

/**
 * `UNO-WO-104 / R01`: prove one authored route intent on the **same** qualified Site as the source Page.
 *
 * Nothing is derived from request authority: candidate, host, prefix and canonical all come from the stored declaration,
 * and `planUnoPublishedPage()` remains the sole publication authority. A missing, draft, unlisted, wrong-Facet,
 * wrong-Site, wrong-locale, ambiguous or mismatching target yields one closed refusal, so the whole source Page is
 * refused rather than a partially linked list.
 */
async function projectQualifiedRouteTarget(
  authority: Extract<ServingAuthority, { readonly mode: "qualified" }>,
  source: UnoPublishedPageAccepted,
  target: string,
): Promise<string | null> {
  const index = buildUnoSiteRouteIndex(authority.manifest, authority.selection);
  if (!index.accepted) return null;
  const matches = index.candidates.filter(
    (candidate) =>
      candidate.entityId === source.identity.entityId &&
      candidate.facetId === source.identity.facetId &&
      candidate.siteId === source.identity.siteId &&
      candidate.localeTag === source.identity.localeTag &&
      candidate.routePath === target,
  );
  if (matches.length !== 1) return null;
  const candidate = matches[0];
  if (candidate === undefined) return null;
  const storedPathname = `${candidate.pathPrefix}${candidate.pathname}`;
  const loaded = await loadUnoCandidateSource({
    repoRoot: authority.root,
    host: candidate.host,
    pathname: storedPathname,
  });
  if (!loaded.accepted || !sameQualifiedCandidate(loaded.candidate, candidate)) return null;
  const planned = planUnoPublishedPage({
    manifest: authority.manifest,
    selection: authority.selection,
    site: { facetId: candidate.facetId, siteId: candidate.siteId },
    host: candidate.host,
    pathname: storedPathname,
    loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
  });
  if (!planned.accepted) return null;
  if (
    !planned.delivery.public ||
    !sameQualifiedPage(planned, candidate) ||
    planned.identity.entityId !== source.identity.entityId ||
    planned.identity.facetId !== source.identity.facetId ||
    planned.identity.siteId !== source.identity.siteId ||
    planned.identity.localeTag !== source.identity.localeTag ||
    planned.identity.routePath !== target ||
    planned.delivery.canonicalUrl !== candidate.address
  ) {
    return null;
  }
  return planned.delivery.canonicalUrl;
}

/** The legacy one-Site proof: same accepted Site and full locale, exact relative route, `public`, stored base only. */
async function projectLegacyRouteTarget(
  authority: Extract<ServingAuthority, { readonly mode: "legacy" }>,
  source: UnoPublishedPageAccepted,
  target: string,
): Promise<string | null> {
  const index = buildUnoCandidateRouteIndex(authority.manifest, authority.selection);
  if (!index.accepted) return null;
  const matches = index.candidates.filter(
    (candidate) =>
      candidate.entityId === source.identity.entityId &&
      candidate.facetId === source.identity.facetId &&
      candidate.siteId === source.identity.siteId &&
      candidate.localeTag === source.identity.localeTag &&
      candidate.routePath === target,
  );
  if (matches.length !== 1) return null;
  const candidate = matches[0];
  if (candidate === undefined) return null;
  const loaded = await loadUnoCandidateSource({ repoRoot: authority.root, pathname: candidate.pathname });
  if (!loaded.accepted) return null;
  const planned = planUnoPublishedPage({
    manifest: authority.manifest,
    selection: authority.selection,
    base: { canonical: authority.canonical, aliases: [...authority.aliases] },
    pathname: candidate.pathname,
    loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
  });
  if (!planned.accepted || !planned.delivery.public) return null;
  if (
    planned.identity.entityId !== source.identity.entityId ||
    planned.identity.facetId !== source.identity.facetId ||
    planned.identity.siteId !== source.identity.siteId ||
    planned.identity.localeTag !== source.identity.localeTag ||
    planned.identity.routePath !== target
  ) {
    return null;
  }
  return planned.delivery.canonicalUrl;
}

/**
 * Project every authored route intent of one accepted source Page, or refuse the whole Page.
 *
 * Each distinct target is proven once per request; nothing is cached across requests and no caller may supply a URL.
 */
async function projectRouteTargets(
  authority: ServingAuthority,
  source: UnoPublishedPageAccepted,
): Promise<ReadonlyMap<string, string> | null> {
  if (authority.mode === "refused") return null;
  if (source.document.kind !== "json" || source.document.pageDocument === undefined) return new Map();
  const intents: UnoRouteIntent[] = [];
  collectRouteIntents(source.document.pageDocument.sections, intents);
  if (intents.length === 0) return new Map();
  const proven = new Map<string, string>();
  const byTarget = new Map<string, string | null>();
  for (const intent of intents) {
    if (!byTarget.has(intent.target)) {
      const url =
        authority.mode === "qualified"
          ? await projectQualifiedRouteTarget(authority, source, intent.target)
          : await projectLegacyRouteTarget(authority, source, intent.target);
      byTarget.set(intent.target, url);
    }
    const url = byTarget.get(intent.target);
    if (url === undefined || url === null) return null;
    proven.set(intent.key, url);
  }
  return proven;
}

/**
 * Decide whether one request may be served as a published Page of the Site that owns it.
 *
 * Authority first, then — for a version-2 declaration — the authority/prefix placement, then the confined source load, then
 * the published-Page planner, then the renderer capability. The matched `{facetId, siteId}` is passed unchanged to the
 * loader and the planner, the loader's candidate must be that same pair at that same pathname, and the planner's own
 * identity and canonical must equal the matched candidate's address. Any disagreement is `not-served`.
 */
export async function planUnoServingPage(request: unknown, pathnameInput?: unknown): Promise<UnoServingPageOutcome> {
  const input = readRequestInput(request, pathnameInput);
  if (input === null) return { status: "not-served", reason: "serving:input-invalid" };
  const { host, pathname } = input;

  const authority = readAuthority();
  if (authority.mode === "refused") return { status: "not-served", reason: authority.reason };

  if (authority.mode === "qualified") {
    const matched = matchUnoSiteRouteCandidate(host, pathname, authority.manifest, authority.selection);
    if (!matched.accepted) return { status: "not-served", reason: "serving:publication-refused" };

    const loaded = await loadUnoCandidateSource({ repoRoot: authority.root, host, pathname });
    if (!loaded.accepted) return { status: "not-served", reason: "serving:publication-refused" };
    if (!sameQualifiedCandidate(loaded.candidate, matched.candidate)) {
      return { status: "not-served", reason: "serving:publication-refused" };
    }

    const planned = planUnoPublishedPage({
      manifest: authority.manifest,
      selection: authority.selection,
      site: { facetId: matched.candidate.facetId, siteId: matched.candidate.siteId },
      host,
      pathname,
      loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
    });
    if (!planned.accepted) return { status: "not-served", reason: "serving:publication-refused" };
    if (!sameQualifiedPage(planned, matched.candidate)) {
      return { status: "not-served", reason: "serving:publication-refused" };
    }
    const routeHrefs = await projectRouteTargets(authority, planned);
    if (routeHrefs === null) return { status: "not-served", reason: "serving:publication-refused" };
    return finishPage(authority.root, planned, routeHrefs);
  }

  const loaded = await loadUnoCandidateSource({ repoRoot: authority.root, pathname });
  if (!loaded.accepted) return { status: "not-served", reason: "serving:publication-refused" };

  const planned = planUnoPublishedPage({
    manifest: authority.manifest,
    selection: authority.selection,
    base: { canonical: authority.canonical, aliases: [...authority.aliases] },
    pathname,
    loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
  });
  if (!planned.accepted) return { status: "not-served", reason: "serving:publication-refused" };
  const routeHrefs = await projectRouteTargets(authority, planned);
  if (routeHrefs === null) return { status: "not-served", reason: "serving:publication-refused" };
  return finishPage(authority.root, planned, routeHrefs);
}

/**
 * Resolve one declared Site-address alias into a temporary redirect to that Site's own canonical Page.
 *
 * Order of proof: the alias must translate to exactly one owning Site (`matchUnoServingAliasAddress`), the **canonical
 * binding's own host** must then accept the translated pathname through the ordinary qualified publication gate, the
 * planned identity must be that same Site, the planned canonical URL must equal the address assembled from stored values,
 * and the Page must be `public`. Anything else returns `null`, so the caller answers its normal refusal: an alias never
 * serves a document, never redirects to another alias, never redirects an unlisted, draft or absent Page, and never lets
 * a request authority reach the destination.
 */
async function redirectThroughAlias(host: string, pathname: string): Promise<{ readonly location: string } | null> {
  const authority = readAuthority();
  if (authority.mode !== "qualified") return null;

  const matched = matchUnoServingAliasAddress(authority.bindings, host, pathname);
  if (matched.status !== "match") return null;
  const target = matched.match;

  const planned = await planUnoServingPage({ host: target.host, pathname: target.pathname });
  if (planned.status !== "served") return null;
  if (!planned.page.delivery.public) return null;
  if (planned.page.identity.facetId !== target.facetId || planned.page.identity.siteId !== target.siteId) return null;
  if (planned.page.delivery.canonicalUrl !== target.canonicalUrl) return null;
  return { location: planned.page.delivery.canonicalUrl };
}

/**
 * The single request decision the document, metadata, route and refusal responder all consume.
 *
 * It is deliberately non-throwing: every failure is a `refused` value, never an exception, so the document layout renders for
 * any address, the Page performs the App Router refusal, and the pre-render responder can answer a refused address before a
 * Flight-only shell is produced. The canonical Page is always tried first, so a declared alias can never displace an accepted
 * canonical owner; a declared Site-address alias may then become one temporary redirect to that same Site's own public
 * canonical Page; only then may a single-segment address fall through to an explicit short alias, and only that Site's own
 * stored mapping is read.
 */
export async function resolveUnoServingRequest(request: unknown, pathnameInput?: unknown): Promise<UnoServingDecision> {
  const input = readRequestInput(request, pathnameInput);
  if (input === null) return { kind: "refused", reason: "serving:input-invalid" };
  const { host, pathname } = input;

  const served = await planUnoServingPage({ host, pathname });
  if (served.status === "served") {
    return served.routeHrefs === undefined
      ? { kind: "page", page: served.page, media: served.media }
      : { kind: "page", page: served.page, media: served.media, routeHrefs: served.routeHrefs };
  }

  const aliased = await redirectThroughAlias(host, pathname);
  if (aliased !== null) return { kind: "redirect", location: aliased.location };

  const parts = pathname.slice(1).split("/");
  const [single] = parts;
  if (parts.length === 1 && single !== undefined) {
    const alias = await resolveUnoServingAlias(single, host);
    if (alias.status === "redirect") return { kind: "redirect", location: alias.location };
  }

  return { kind: "refused", reason: served.reason };
}



/**
 * Resolve one Site-local media locator against the bindings that own the request authority.
 *
 * The locator carries only the path *inside* a Site, so each authority-owning binding offers exactly one candidate path. More
 * than one accepted reading is refused rather than picking the first, so a locator can never resolve to a sibling Site.
 */
async function resolveQualifiedMediaPage(
  authority: ServingAuthority,
  host: string,
  sitePath: string,
): Promise<UnoServingPageOutcome> {
  const served: UnoServingPageOutcome[] = [];
  for (const binding of bindingsForHost(authority, host)) {
    const outcome = await planUnoServingPage({ host, pathname: requestPathOf(binding, sitePath) });
    if (outcome.status === "served") served.push(outcome);
  }
  if (served.length !== 1) return { status: "not-served", reason: "serving:publication-refused" };
  return served[0] as UnoServingPageOutcome;
}

/** The outcome of one media locator request: real bytes with their true MIME type, or nothing. */
export type UnoServingMediaOutcome =
  | { readonly status: "resolved"; readonly bytes: Uint8Array; readonly mime: string }
  | { readonly status: "not-found"; readonly reason: UnoServingRefusal };

/** One integer occurrence segment of a locator. */
const OCCURRENCE_SEGMENT = /^(?:0|[1-9][0-9]{0,3})$/u;

/** One lowercase public path segment of a Page address. */
const PATH_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Serve the bytes behind one media locator.
 *
 * The last segment is the occurrence index and everything before it is the Page's own public address inside its Site, so the
 * route can never be given a storage path: it re-derives the address, re-runs the full publication and media preflight for
 * the Site that owns the request authority, and only then reads the one occurrence that address declares.
 */
export async function readUnoServingMedia(segments: unknown, hostInput?: unknown): Promise<UnoServingMediaOutcome> {
  if (!Array.isArray(segments) || segments.length < 2 || segments.length > 6) {
    return { status: "not-found", reason: "serving:input-invalid" };
  }
  const parts: string[] = [];
  for (const part of segments) {
    if (typeof part !== "string" || part.length === 0 || part.length > 64 || !PATH_SEGMENT.test(part)) {
      return { status: "not-found", reason: "serving:input-invalid" };
    }
    parts.push(part);
  }

  const last = parts[parts.length - 1];
  if (last === undefined || !OCCURRENCE_SEGMENT.test(last)) {
    return { status: "not-found", reason: "serving:input-invalid" };
  }
  const host = readHost(hostInput);
  if (host === null) return { status: "not-found", reason: "serving:input-invalid" };

  const occurrence = Number(last);
  const sitePath = `/${parts.slice(0, -1).join("/")}`;

  const authority = readAuthority();
  if (authority.mode === "refused") return { status: "not-found", reason: authority.reason };

  const served =
    authority.mode === "qualified"
      ? await resolveQualifiedMediaPage(authority, host, sitePath)
      : await planUnoServingPage(sitePath);
  if (served.status !== "served" || served.assets === undefined) {
    return { status: "not-found", reason: "serving:publication-refused" };
  }

  const declared = readUnoPageAssetOccurrence(served.assets, occurrence);
  if (declared === undefined) return { status: "not-found", reason: "serving:media-unavailable" };

  const decision = readUnoOwnedAssetRef(declared.ref, declared.purpose);
  if (!decision.ok) return { status: "not-found", reason: "serving:media-unavailable" };

  const read = readUnoOwnedMedia({
    repoRoot: authority.root,
    owner: ownerOf(served.page),
    decision: decision.decision,
    full: true,
  });
  if (!read.accepted) return { status: "not-found", reason: "serving:media-unavailable" };

  return { status: "resolved", bytes: read.bytes, mime: read.mime };
}


/**
 * Resolve an explicit short-locale alias to a real published public destination.
 *
 * The mapping comes from the **stored** declaration — never a guess, a header or a preference — and for a version-2
 * declaration it applies only to the Site that owns the request authority *and* owns the mapped locale. The destination must
 * itself be an accepted published plan for that Site's reserved Home with `public` visibility; anything else resolves to
 * nothing at all, so the caller answers 404 rather than redirecting somewhere unproven.
 */
export async function resolveUnoServingAlias(localeKey: unknown, hostInput?: unknown): Promise<UnoServingAliasOutcome> {
  if (typeof localeKey !== "string" || localeKey.length === 0 || localeKey.length > 64) {
    return { status: "none", reason: "serving:input-invalid" };
  }
  const host = readHost(hostInput);
  if (host === null) return { status: "none", reason: "serving:input-invalid" };

  const authority = readAuthority();
  if (authority.mode === "refused") return { status: "none", reason: authority.reason };

  if (authority.mode === "qualified") {
    for (const binding of bindingsForHost(authority, host)) {
      const stored = resolveUnoCommittedLocales({
        manifest: authority.manifest,
        selection: authority.selection,
        site: { facetId: binding.facetId, siteId: binding.siteId },
      });
      if (!stored.accepted) continue;
      const targetTag = stored.localePolicy.languagePreferences[localeKey];
      if (targetTag === undefined) continue;

      let targetKey: string;
      try {
        targetKey = localePathKey(targetTag);
      } catch {
        continue;
      }

      const target = await planUnoServingPage({ host, pathname: requestPathOf(binding, `/${targetKey}`) });
      if (target.status !== "served") continue;
      if (target.page.identity.pageId !== HOME_CONTENT_SLUG || !target.page.delivery.public) continue;
      return { status: "redirect", location: target.page.delivery.canonicalUrl };
    }
    return { status: "none", reason: "serving:publication-refused" };
  }

  const stored = resolveUnoCommittedLocales({ manifest: authority.manifest, selection: authority.selection });
  if (!stored.accepted) return { status: "none", reason: "serving:authority-unavailable" };

  const targetTag = stored.localePolicy.languagePreferences[localeKey];
  if (targetTag === undefined) return { status: "none", reason: "serving:publication-refused" };

  let targetKey: string;
  try {
    targetKey = localePathKey(targetTag);
  } catch {
    return { status: "none", reason: "serving:publication-refused" };
  }

  const target = await planUnoServingPage(`/${targetKey}`);
  if (target.status !== "served") return { status: "none", reason: target.reason };
  if (target.page.identity.pageId !== HOME_CONTENT_SLUG || !target.page.delivery.public) {
    return { status: "none", reason: "serving:publication-refused" };
  }
  return { status: "redirect", location: target.page.delivery.canonicalUrl };
}

/** The host-scoped discovery plan: entries already planned per Site, so no entry can span two Sites. */
export interface UnoServingDiscoveryPlan {
  readonly entries: readonly UnoPublicDiscoveryEntry[];
  readonly sitemapUrls: readonly string[];
  /** The one selected Site of a legacy declaration; a qualified plan has no single Site to name. */
  readonly site?: { readonly entityId: string; readonly facetId: string; readonly siteId: string };
  /** The default locale of that one Site, when the plan belongs to a single Site. */
  readonly defaultLocale?: string;
}

/** The discovery outcome used by `robots.txt`, `sitemap.xml` and each Page's metadata. */
export type UnoServingDiscoveryOutcome =
  | { readonly status: "planned"; readonly plan: UnoServingDiscoveryPlan }
  | { readonly status: "unavailable"; readonly reason: UnoServingRefusal };


/**
 * One Site's accepted public discovery plan, or `null` when that Site contributes no public Page.
 *
 * Each Site is planned from its own decisions and its own locale authority, so a same-Page `hreflang`, `x-default` or
 * automatic link can never span two Sites even when their public URLs are combined for the same request authority.
 */
async function planOneSiteDiscovery(
  authority: QualifiedAuthority,
  binding: UnoSiteAddressBinding,
  host: string,
  candidates: readonly UnoSiteRouteCandidate[],
): Promise<UnoServingDiscoveryPlan | null> {
  const stored = resolveUnoCommittedLocales({
    manifest: authority.manifest,
    selection: authority.selection,
    site: { facetId: binding.facetId, siteId: binding.siteId },
  });
  if (!stored.accepted) return null;

  const decisions: UnoPublishedPageAccepted[] = [];
  for (const candidate of candidates) {
    const pathname = requestPathOf(binding, candidate.pathname);
    const loaded = await loadUnoCandidateSource({ repoRoot: authority.root, host, pathname });
    if (!loaded.accepted) continue;
    const planned = planUnoPublishedPage({
      manifest: authority.manifest,
      selection: authority.selection,
      site: { facetId: binding.facetId, siteId: binding.siteId },
      host,
      pathname,
      loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
    });
    if (!planned.accepted) continue;
    if (!sameQualifiedPage(planned, candidate)) continue;
    if (planned.document.kind === "json" && planned.document.pageDocument === undefined) continue;
    decisions.push(planned);
  }
  if (decisions.length === 0) return null;

  const plan = planUnoPublicDiscovery({
    decisions,
    locales: {
      supportedLocales: [...stored.localePolicy.supportedLocales],
      defaultLocale: stored.localePolicy.defaultLocale,
    },
  });
  if (!plan.accepted) return null;
  return Object.freeze({
    entries: Object.freeze([...plan.entries]) as readonly UnoPublicDiscoveryEntry[],
    sitemapUrls: Object.freeze([...plan.sitemapUrls]) as readonly string[],
  });
}

/**
 * Plan the public discovery surface for one request authority.
 *
 * Legacy: the one selected Site, exactly as before. Version 2: only the Sites bound to the request authority contribute,
 * each planned from its own candidates and locales before the authority-scoped public URLs are combined.
 */
export async function planUnoServingDiscovery(hostInput?: unknown): Promise<UnoServingDiscoveryOutcome> {
  const host = readHost(hostInput);
  if (host === null) return { status: "unavailable", reason: "serving:input-invalid" };

  const authority = readAuthority();
  if (authority.mode === "refused") return { status: "unavailable", reason: authority.reason };

  if (authority.mode === "qualified") {
    const bindings = bindingsForHost(authority, host);
    if (bindings.length === 0) return { status: "unavailable", reason: "serving:discovery-unavailable" };

    const index = buildUnoSiteRouteIndex(authority.manifest, authority.selection);
    if (!index.accepted) return { status: "unavailable", reason: "serving:authority-unavailable" };

    const entries: UnoPublicDiscoveryEntry[] = [];
    const sitemapUrls: string[] = [];
    for (const binding of bindings) {
      const candidates = index.candidates.filter(
        (candidate) => candidate.facetId === binding.facetId && candidate.siteId === binding.siteId,
      );
      const plan = await planOneSiteDiscovery(authority, binding, host, candidates);
      if (plan === null) continue;
      entries.push(...plan.entries);
      sitemapUrls.push(...plan.sitemapUrls);
    }
    if (entries.length === 0 || sitemapUrls.length === 0) {
      return { status: "unavailable", reason: "serving:discovery-unavailable" };
    }
    return {
      status: "planned",
      plan: Object.freeze({
        entries: Object.freeze(entries) as readonly UnoPublicDiscoveryEntry[],
        sitemapUrls: Object.freeze(sitemapUrls) as readonly string[],
      }),
    };
  }

  const stored = resolveUnoCommittedLocales({ manifest: authority.manifest, selection: authority.selection });
  if (!stored.accepted) return { status: "unavailable", reason: "serving:authority-unavailable" };

  const index = buildUnoCandidateRouteIndex(authority.manifest, authority.selection);
  if (!index.accepted) return { status: "unavailable", reason: "serving:authority-unavailable" };

  const decisions: UnoPublishedPageAccepted[] = [];
  for (const candidate of index.candidates) {
    const loaded = await loadUnoCandidateSource({ repoRoot: authority.root, pathname: candidate.pathname });
    if (!loaded.accepted) continue;
    const planned = planUnoPublishedPage({
      manifest: authority.manifest,
      selection: authority.selection,
      base: { canonical: authority.canonical, aliases: [...authority.aliases] },
      pathname: candidate.pathname,
      loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
    });
    if (!planned.accepted) continue;
    if (planned.document.kind === "json" && planned.document.pageDocument === undefined) continue;
    decisions.push(planned);
  }
  if (decisions.length === 0) return { status: "unavailable", reason: "serving:discovery-unavailable" };

  const plan = planUnoPublicDiscovery({
    decisions,
    locales: {
      supportedLocales: [...stored.localePolicy.supportedLocales],
      defaultLocale: stored.localePolicy.defaultLocale,
    },
  });
  if (!plan.accepted) return { status: "unavailable", reason: "serving:discovery-unavailable" };
  return {
    status: "planned",
    plan: Object.freeze({
      entries: Object.freeze([...plan.entries]) as readonly UnoPublicDiscoveryEntry[],
      sitemapUrls: Object.freeze([...plan.sitemapUrls]) as readonly string[],
      site: plan.site,
      defaultLocale: plan.defaultLocale,
    }),
  };
}


/** What a requested locale path key resolved to against the stored Site authority. */
export type UnoServingLocaleOutcome =
  | { readonly status: "supported"; readonly tag: string }
  | { readonly status: "alias"; readonly tag: string }
  | { readonly status: "unknown" };

/** Match one path key against one accepted locale policy; both branches stay closed. */
function matchLocale(
  policy: {
    readonly supportedLocales: readonly string[];
    readonly languagePreferences: Readonly<Record<string, string>>;
  },
  pathKey: string,
): UnoServingLocaleOutcome {
  for (const tag of policy.supportedLocales) {
    let key: string;
    try {
      key = localePathKey(tag);
    } catch {
      return { status: "unknown" };
    }
    if (key === pathKey) return { status: "supported", tag };
  }
  const aliasTarget = policy.languagePreferences[pathKey];
  if (aliasTarget === undefined) return { status: "unknown" };
  if (!policy.supportedLocales.includes(aliasTarget)) return { status: "unknown" };
  return { status: "alias", tag: aliasTarget };
}

/**
 * Resolve a requested locale path key against the **committed** locale authority of one Site.
 *
 * The key must be one of the lowercase full path keys the Site authors, or an explicit short alias the declaration itself
 * stores. A version-2 declaration is resolved per Site, so the request authority is required there: without it there is no
 * Site context and the answer is `unknown`, never a guess borrowed from another Site's locales.
 */
export function resolveUnoServingLocaleTag(pathKey: unknown, hostInput?: unknown): UnoServingLocaleOutcome {
  if (typeof pathKey !== "string") return { status: "unknown" };
  if (pathKey.length === 0 || pathKey.length > 64) return { status: "unknown" };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(pathKey)) return { status: "unknown" };

  const host = readHost(hostInput);
  if (host === null) return { status: "unknown" };

  const authority = readAuthority();
  if (authority.mode === "refused") return { status: "unknown" };

  if (authority.mode === "qualified") {
    for (const binding of bindingsForHost(authority, host)) {
      const stored = resolveUnoCommittedLocales({
        manifest: authority.manifest,
        selection: authority.selection,
        site: { facetId: binding.facetId, siteId: binding.siteId },
      });
      if (!stored.accepted) continue;
      const outcome = matchLocale(stored.localePolicy, pathKey);
      if (outcome.status !== "unknown") return outcome;
    }
    return { status: "unknown" };
  }

  const stored = resolveUnoCommittedLocales({ manifest: authority.manifest, selection: authority.selection });
  if (!stored.accepted) return { status: "unknown" };
  return matchLocale(stored.localePolicy, pathKey);
}

/** One localized address this deployment may render, in route-parameter form. */
export interface UnoServingAddress {
  readonly locale: string;
  readonly segments: readonly string[];
}

/**
 * Enumerate the addresses a **legacy** declaration may render.
 *
 * A version-2 declaration is not enumerated: its addresses are chosen per request from the binding that owns the authority
 * and prefix, so no authority-free list could be mistaken for one.
 */
export async function listUnoServingAddresses(): Promise<readonly UnoServingAddress[]> {
  const authority = readAuthority();
  if (authority.mode !== "legacy") return [];

  const index = buildUnoCandidateRouteIndex(authority.manifest, authority.selection);
  if (!index.accepted) return [];

  const addresses: UnoServingAddress[] = [];
  const seen = new Set<string>();
  const remember = (locale: string, segments: readonly string[]): void => {
    const key = `${locale}\u0000${segments.join("/")}`;
    if (seen.has(key)) return;
    seen.add(key);
    addresses.push(Object.freeze({ locale, segments: Object.freeze([...segments]) }));
  };

  for (const candidate of index.candidates) {
    const loaded = await loadUnoCandidateSource({ repoRoot: authority.root, pathname: candidate.pathname });
    if (!loaded.accepted) continue;
    const planned = planUnoPublishedPage({
      manifest: authority.manifest,
      selection: authority.selection,
      base: { canonical: authority.canonical, aliases: [...authority.aliases] },
      pathname: candidate.pathname,
      loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
    });
    if (!planned.accepted) continue;
    if (planned.document.kind === "json" && planned.document.pageDocument === undefined) continue;

    const segments = planned.identity.routePath === "" ? [] : planned.identity.routePath.split("/");
    remember(planned.identity.localePathKey, segments);
  }

  const stored = resolveUnoCommittedLocales({ manifest: authority.manifest, selection: authority.selection });
  if (stored.accepted) {
    for (const key of Object.keys(stored.localePolicy.languagePreferences).sort()) {
      const alias = await resolveUnoServingAlias(key);
      if (alias.status === "redirect") remember(key, []);
    }
  }

  return Object.freeze(
    addresses.sort((left, right) => {
      const a = `${left.locale}\u0000${left.segments.join("/")}`;
      const b = `${right.locale}\u0000${right.segments.join("/")}`;
      return a < b ? -1 : a > b ? 1 : 0;
    }),
  );
}


/** Escape the five XML metacharacters so a declared URL cannot alter the document structure. */
function escapeXml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&apos;");
}

/**
 * The absolute sitemap address of the request authority's own Site, or `null` when no authority exists.
 *
 * It is always the accepted binding's declared `origin + pathPrefix` — never a request-derived origin — so this advertises
 * exactly the Site it belongs to and a sibling Site's address can never be published here.
 */
export function readUnoServingSitemapUrl(hostInput?: unknown): string | null {
  const host = readHost(hostInput);
  if (host === null) return null;

  const authority = readAuthority();
  if (authority.mode === "refused") return null;

  if (authority.mode === "qualified") {
    const [binding] = bindingsForHost(authority, host);
    if (binding === undefined) return null;
    return `${binding.origin}${binding.pathPrefix}/sitemap.xml`;
  }
  return `${authority.canonical}/sitemap.xml`;
}

/**
 * Render `robots.txt` for one request authority, or `null` when the discovery gate does not hold.
 *
 * No `Disallow` rule names an unlisted Page: an unlisted Page is protected by its own `noindex,nofollow` response, not by a
 * rule that would advertise its address. The single `Sitemap` line is the request authority's own Site address.
 */
export async function renderUnoServingRobots(hostInput?: unknown): Promise<string | null> {
  const host = readHost(hostInput);
  if (host === null) return null;

  const discovery = await planUnoServingDiscovery(host);
  if (discovery.status !== "planned") return null;
  const sitemapUrl = readUnoServingSitemapUrl(host);
  if (sitemapUrl === null) return null;
  return ["User-agent: *", "Allow: /", `Sitemap: ${sitemapUrl}`, ""].join("\n");
}

/**
 * Render `sitemap.xml` for one request authority, or `null` when the discovery gate does not hold.
 *
 * Every `<loc>` and alternate is a URL its own Site's accepted plan produced, so an unlisted Page, an alias, a refused
 * source, an unpublished Page or a sibling Site can never appear, and every emitted value is XML-escaped.
 */
export async function renderUnoServingSitemap(hostInput?: unknown): Promise<string | null> {
  const host = readHost(hostInput);
  if (host === null) return null;

  const discovery = await planUnoServingDiscovery(host);
  if (discovery.status !== "planned") return null;

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const entry of discovery.plan.entries) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(entry.canonicalUrl)}</loc>`);
    for (const alternate of entry.alternates) {
      const href = escapeXml(alternate.href);
      const tag = escapeXml(alternate.localeTag);
      lines.push(`    <xhtml:link rel="alternate" hreflang="${tag}" href="${href}"/>`);
    }
    lines.push(`    <xhtml:link rel="alternate" hreflang="${escapeXml(entry.localeTag)}" href="${escapeXml(entry.canonicalUrl)}"/>`);
    if (entry.xDefault !== undefined) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.xDefault)}"/>`);
    }
    lines.push("  </url>");
  }
  lines.push("</urlset>", "");

  const document = lines.join("\n");
  if (document.length > 512 * 1024) return null;
  return document;
}

