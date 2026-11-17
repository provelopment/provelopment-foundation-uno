/**
 * Foundation Uno — the server-only U03 serving composition (`UNO-WO-028 / R01`).
 *
 * WHAT THIS IS. The single trusted IO boundary between Next.js and the accepted U03 contracts. It reads the
 * two FIXED committed declarations through a fixed deployment root, resolves the committed canonical base,
 * loads one address through the confined source loader, and asks the published-Page planner whether that
 * address may be served. It also plans the public discovery surface from the same authority.
 *
 * THE GATE. Nothing here may serve, redirect, emit metadata, advertise a canonical URL or list a sitemap
 * entry unless the committed base exists and is valid *and* the specific Page's own manifest declaration is
 * `published` *and* every other accepted contract agrees. Otherwise the caller is told `not-served` and the
 * route answers a genuine 404. There is no environment fallback, no request-Host inference, no proxy header,
 * no geo lookup, no first-Site default, no localhost default and no cached "last known" page.
 *
 * ROOT. `process.cwd()` is used once, only to locate this repository's own fixed deployment root in this
 * server-side adapter. It is never read from a request, a header or a query, and the two declaration paths
 * are constants, so no incoming value can redirect the read.
 *
 * WHAT THIS IS NOT. No provider SDK, no outbound request, no deployment action, no domain selection, no
 * `basePath`, no rewrite or proxy. A JSON Page is classified by the planner but refused for serving until its
 * versioned document contract and renderer exist in U04.
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  UNO_MANIFEST_PATH,
  UNO_SELECTION_PATH,
  UNO_SOURCE_LIMITS,
  loadUnoCandidateSource,
} from "../adapters/efs/uno-confined-source-reader";
import { planUnoPublicDiscovery, type UnoPublicDiscoveryAccepted } from "../application/plan-uno-public-discovery";
import { planUnoPublishedPage, type UnoPublishedPageAccepted } from "../application/plan-uno-published-page";
import { resolveUnoCommittedBase } from "../application/resolve-uno-committed-base";
import { resolveUnoCommittedLocales } from "../application/resolve-uno-committed-locales";
import { HOME_CONTENT_SLUG } from "../core/page-content";
import { buildUnoCandidateRouteIndex } from "../core/efs/uno-route-address";
import { localePathKey } from "../core/efs/uno-locales";

/** The closed refusal vocabulary of this boundary. One literal per failure family. */
export type UnoServingRefusal =
  | "serving:input-invalid"
  | "serving:authority-unavailable"
  | "serving:publication-refused"
  | "serving:renderer-unavailable"
  | "serving:discovery-unavailable";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_SERVING_REFUSAL_REASONS: readonly UnoServingRefusal[] = Object.freeze([
  "serving:input-invalid",
  "serving:authority-unavailable",
  "serving:publication-refused",
  "serving:renderer-unavailable",
  "serving:discovery-unavailable",
] as const);

/** A Page that may be served: an accepted published plan whose body this version can render. */
export type UnoServingPageOutcome =
  | { readonly status: "served"; readonly page: UnoPublishedPageAccepted }
  | { readonly status: "not-served"; readonly reason: UnoServingRefusal };

/** A short-alias outcome: one temporary redirect target, or nothing at all. */
export type UnoServingAliasOutcome =
  | { readonly status: "redirect"; readonly location: string }
  | { readonly status: "none"; readonly reason: UnoServingRefusal };

/** The discovery outcome used by `robots.txt` and `sitemap.xml`. */
export type UnoServingDiscoveryOutcome =
  | { readonly status: "planned"; readonly plan: UnoPublicDiscoveryAccepted }
  | { readonly status: "unavailable"; readonly reason: UnoServingRefusal };

/** The committed authority this boundary resolved, or a closed refusal. */
type AuthorityOutcome =
  | {
      readonly status: "resolved";
      readonly root: string;
      readonly manifest: unknown;
      readonly selection: unknown;
      readonly canonical: string;
      readonly aliases: readonly string[];
    }
  | { readonly status: "refused"; readonly reason: UnoServingRefusal };

/** The bounded reader for one fixed declaration file, or `null`. */
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

/**
 * Resolve the committed authority: the two fixed declarations plus the declared canonical base.
 *
 * A missing or invalid base is `serving:authority-unavailable` — exactly the committed reality today — and
 * nothing downstream may treat that as "serve anyway".
 */
function readAuthority(): AuthorityOutcome {
  const root = process.cwd();
  const manifest = readFixedJson(root, UNO_MANIFEST_PATH, UNO_SOURCE_LIMITS.manifestBytes);
  const selection = readFixedJson(root, UNO_SELECTION_PATH, UNO_SOURCE_LIMITS.configBytes);
  if (manifest === null || selection === null) {
    return { status: "refused", reason: "serving:authority-unavailable" };
  }

  const committed = resolveUnoCommittedBase({ manifest, selection });
  if (!committed.accepted) return { status: "refused", reason: "serving:authority-unavailable" };

  return {
    status: "resolved",
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
 * Decide whether one absolute address may be served as a published Page of the selected Site.
 *
 * The order is deliberate: authority first (a missing base can never be worked around), then the confined
 * source load, then the published-Page planner, then the renderer capability. A JSON Page is refused here
 * because this version has no versioned JSON document contract or renderer; its visibility is still
 * classified by the planner in tests.
 */
export async function planUnoServingPage(pathname: unknown): Promise<UnoServingPageOutcome> {
  const target = normalizePathname(pathname);
  if (target === null) return { status: "not-served", reason: "serving:input-invalid" };

  const authority = readAuthority();
  if (authority.status === "refused") return { status: "not-served", reason: authority.reason };

  const loaded = await loadUnoCandidateSource({ repoRoot: authority.root, pathname: target });
  if (!loaded.accepted) return { status: "not-served", reason: "serving:publication-refused" };

  const planned = planUnoPublishedPage({
    manifest: authority.manifest,
    selection: authority.selection,
    base: { canonical: authority.canonical, aliases: [...authority.aliases] },
    pathname: target,
    loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
  });
  if (!planned.accepted) return { status: "not-served", reason: "serving:publication-refused" };
  if (planned.document.kind === "json") {
    return { status: "not-served", reason: "serving:renderer-unavailable" };
  }

  return { status: "served", page: planned };
}

/**
 * Resolve an explicit short-locale alias to a real published public destination.
 *
 * `en → en-001` comes from the **stored** declaration's own language preferences, never from a guess, a
 * header or a preference. The destination must itself be an accepted published plan for the reserved Home
 * with `public` visibility; anything else resolves to nothing at all, so the caller answers 404.
 */
export async function resolveUnoServingAlias(localeKey: unknown): Promise<UnoServingAliasOutcome> {
  if (typeof localeKey !== "string" || localeKey.length === 0 || localeKey.length > 64) {
    return { status: "none", reason: "serving:input-invalid" };
  }

  const authority = readAuthority();
  if (authority.status === "refused") return { status: "none", reason: authority.reason };

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


/**
 * Plan the public discovery surface from the same committed authority.
 *
 * Every candidate address of the selected Site is loaded through the confined loader and offered to the
 * published-Page planner; only accepted, renderable (`markdown`) decisions survive, so a refused or missing
 * source can never become an entry. The collection is then handed to `planUnoPublicDiscovery`, which enforces
 * the declared locales, the single Site, collision rules and deterministic ordering. Anything less than one
 * public published Page is `serving:discovery-unavailable`, which the routes render as a real 404.
 */
export async function planUnoServingDiscovery(): Promise<UnoServingDiscoveryOutcome> {
  const authority = readAuthority();
  if (authority.status === "refused") return { status: "unavailable", reason: authority.reason };

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
    if (planned.document.kind !== "markdown") continue;
    decisions.push(planned);
  }

  if (decisions.length === 0) {
    return { status: "unavailable", reason: "serving:discovery-unavailable" };
  }

  const plan = planUnoPublicDiscovery({
    decisions,
    locales: {
      supportedLocales: [...stored.localePolicy.supportedLocales],
      defaultLocale: stored.localePolicy.defaultLocale,
    },
  });
  if (!plan.accepted) return { status: "unavailable", reason: "serving:discovery-unavailable" };

  return { status: "planned", plan };
}

/** One localized address this deployment may render, in route-parameter form. */
export interface UnoServingAddress {
  readonly locale: string;
  readonly segments: readonly string[];
}

/**
 * Enumerate the addresses this deployment may render.
 *
 * This is the build-time counterpart of `planUnoServingPage`: the same authority, the same confined loader and the
 * same publication planner decide which localized addresses exist. Only accepted published Pages with a renderable
 * (Markdown) body are listed, plus an explicit short alias whose destination is a published public Home. With no
 * declared base and no published Page — the committed reality — the list is empty, so every localized address is
 * refused by the router with the ordinary static 404 document.
 */
export async function listUnoServingAddresses(): Promise<readonly UnoServingAddress[]> {
  const authority = readAuthority();
  if (authority.status === "refused") return [];

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
    if (planned.document.kind !== "markdown") continue;

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

  return Object.freeze(addresses.sort((left, right) =>
    left.locale === right.locale
      ? left.segments.join("/") < right.segments.join("/")
        ? -1
        : left.segments.join("/") > right.segments.join("/")
          ? 1
          : 0
      : left.locale < right.locale
        ? -1
        : 1,
  ));
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

/** The absolute sitemap address of the committed base, or `null` when no authority exists. */
export function readUnoServingSitemapUrl(): string | null {
  const authority = readAuthority();
  if (authority.status === "refused") return null;
  return `${authority.canonical}/sitemap.xml`;
}


/**
 * Render `robots.txt`, or `null` when the discovery gate does not hold.
 *
 * No `Disallow` rule names an unlisted Page: an unlisted Page is protected by its own `noindex,nofollow`
 * response, not by a rule that would advertise its address. The single `Sitemap` line is the committed
 * canonical origin's own address.
 */
export async function renderUnoServingRobots(): Promise<string | null> {
  const discovery = await planUnoServingDiscovery();
  if (discovery.status !== "planned") return null;
  const sitemapUrl = readUnoServingSitemapUrl();
  if (sitemapUrl === null) return null;
  return ["User-agent: *", "Allow: /", `Sitemap: ${sitemapUrl}`, ""].join("\n");
}

/** Render `sitemap.xml`, or `null` when the discovery gate does not hold. */
export async function renderUnoServingSitemap(): Promise<string | null> {
  const discovery = await planUnoServingDiscovery();
  if (discovery.status !== "planned") return null;

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const entry of discovery.plan.entries) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(entry.canonicalUrl)}</loc>`);
    for (const alternate of entry.alternates) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.localeTag)}" href="${escapeXml(alternate.href)}"/>`,
      );
    }
    lines.push(`    <xhtml:link rel="alternate" hreflang="${escapeXml(entry.localeTag)}" href="${escapeXml(entry.canonicalUrl)}"/>`);
    if (entry.xDefault !== undefined) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.xDefault)}"/>`,
      );
    }
    lines.push("  </url>");
  }
  lines.push("</urlset>", "");

  const document = lines.join("\n");
  if (document.length > 512 * 1024) return null;
  return document;
}
