/**
 * Foundation Uno — the localized published-Page segment (`UNO-WO-029 / R01`, U03).
 *
 * WHAT THIS IS. One thin App Router segment inside the `(site)` route group: it validates the incoming locale and
 * segments, asks the server-only composition whether this exact address is a published Page, and renders either
 * that Page, one temporary redirect for an explicit short locale alias, or the ordinary 404. The `(site)` group
 * owns its own locale-root layout, so `<html lang>` is the authored full locale tag rather than a fixed `en`.
 *
 * SEO. A published **public** Page takes its canonical URL, its same-Page public locale alternates and its
 * `x-default` from the accepted public discovery plan — the same plan that produces `robots.txt` and
 * `sitemap.xml` — so the HTML and the sitemap can never disagree. A published **unlisted** Page keeps its own
 * canonical and `noindex,nofollow` but advertises no alternate, because discovery deliberately excludes it. If a
 * public Page's exact entry cannot be found, the address is refused rather than served with invented links.
 *
 * WHAT IT WILL NOT DO. No environment fallback, no request-Host inference, no `Accept-Language` guess, no
 * preference cookie, no geo lookup, no first-Site default and no `rewrite`. An address that the committed
 * declaration does not publish is a genuine 404 — including every address of this repository's own deployment,
 * which declares no canonical base and publishes no Page.
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import type { UnoPublishedPageAccepted } from '../../../../application/plan-uno-published-page';
import {
  UnoSafeMarkdownPage,
  parseUnoSafeMarkdown,
} from '../../../../components/uno-safe-markdown-page';
import {
  listUnoServingAddresses,
  planUnoServingDiscovery,
  planUnoServingPage,
  resolveUnoServingAlias,
} from '../../../../config/uno-serving';
import { PAGE_ROUTE_PATH_MAX_SEGMENTS } from '../../../../core/page-route-path';

/** The subset of the route parameters this segment reads. */
interface LocalizedRouteParams {
  readonly locale?: string;
  readonly segments?: readonly string[];
}

/**
 * The route shapes this deployment generates below its locale. The `[[...segments]]` segment is created here, so its
 * parameters are declared here: the reserved locale root and each published relative route the declaration enumerates.
 */
export async function generateStaticParams(): Promise<{ segments: string[] }[]> {
  const addresses = await listUnoServingAddresses();
  const shapes: { segments: string[] }[] = [];
  for (const address of addresses) {
    const key = address.segments.join("/");
    if (!shapes.some((shape) => shape.segments.join("/") === key)) {
      shapes.push({ segments: [...address.segments] });
    }
  }
  return shapes;
}

/** One validated lowercase path segment or locale path key. */
const PATH_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * This segment serves only the addresses the build enumerated in the `[locale]` layout. Every other address —
 * an unpublished Page, an unlisted Page, an unknown Page, an undeclared locale — is refused by the router with
 * the global 404 document, so nothing here can stream a shell or answer 200 for something it does not publish.
 */
export const dynamicParams = false;

/** What this segment resolved an address to. */
type ResolvedRoute =
  | { readonly kind: 'page'; readonly page: UnoPublishedPageAccepted }
  | { readonly kind: 'redirect'; readonly location: string }
  | { readonly kind: 'refused' };

/**
 * Resolve one incoming address through the server composition.
 *
 * The exact address is tried first, because a full-locale address is the real Page. Only a bare locale with no
 * segments may fall through to an explicit short alias, and only that alias's own stored mapping is consulted.
 * `cache` memoises the decision for the duration of one request, so the metadata phase and the render phase
 * cannot observe two different answers.
 */
const resolveRoute = cache(_resolveRoute);

/** The public discovery plan, memoised per request so metadata costs at most one composition. */
const resolveDiscovery = cache(planUnoServingDiscovery);

async function _resolveRoute(params: Promise<LocalizedRouteParams>): Promise<ResolvedRoute> {
  const resolved = await params;
  const locale = resolved.locale ?? '';
  if (!PATH_KEY.test(locale)) return { kind: 'refused' };

  const segments = resolved.segments ?? [];
  if (segments.length > PAGE_ROUTE_PATH_MAX_SEGMENTS) return { kind: 'refused' };
  for (const segment of segments) {
    if (!PATH_KEY.test(segment)) return { kind: 'refused' };
  }

  const pathname = segments.length === 0 ? `/${locale}` : `/${locale}/${segments.join('/')}`;
  const planned = await planUnoServingPage(pathname);
  if (planned.status === 'served') return { kind: 'page', page: planned.page };

  if (segments.length === 0) {
    const alias = await resolveUnoServingAlias(locale);
    if (alias.status === 'redirect') return { kind: 'redirect', location: alias.location };
  }

  return { kind: 'refused' };
}

/**
 * The metadata of one accepted published Page, taken from the same public discovery plan that produces the
 * sitemap, or nothing at all for a refused address.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<LocalizedRouteParams>;
}): Promise<Metadata> {
  const resolvedRoute = await resolveRoute(params);
  if (resolvedRoute.kind === 'refused') notFound();
  if (resolvedRoute.kind !== 'page') return {};

  const { page } = resolvedRoute;

  // A public Page must be findable in the public plan, exactly. Anything less is a refusal, never a guess.
  const languages: Record<string, string> = {};
  if (page.delivery.public) {
    const discovery = await resolveDiscovery();
    if (discovery.status !== 'planned') notFound();

    const entry = discovery.plan.entries.find(
      (candidate) => candidate.canonicalUrl === page.delivery.canonicalUrl,
    );
    if (entry === undefined) notFound();

    languages[entry.localeTag] = entry.canonicalUrl;
    for (const alternate of entry.alternates) languages[alternate.localeTag] = alternate.href;
    if (entry.xDefault !== undefined) languages['x-default'] = entry.xDefault;
  }

  const metadata: Metadata = {
    title: page.document.title,
    alternates:
      Object.keys(languages).length === 0
        ? { canonical: page.delivery.canonicalUrl }
        : { canonical: page.delivery.canonicalUrl, languages },
    robots: page.delivery.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      url: page.delivery.canonicalUrl,
      title: page.document.title,
      type: 'website',
    },
  };
  if (page.document.description !== undefined) {
    metadata.description = page.document.description;
    metadata.openGraph = { ...metadata.openGraph, description: page.document.description };
  }
  return metadata;
}

/** Render the one visible `h1`, the optional description and the inert Markdown body. */
export default async function LocalizedPage({ params }: { params: Promise<LocalizedRouteParams> }) {
  const resolvedRoute = await resolveRoute(params);

  if (resolvedRoute.kind === 'redirect') redirect(resolvedRoute.location);
  if (resolvedRoute.kind === 'refused') notFound();

  const { page } = resolvedRoute;
  const parsed = parseUnoSafeMarkdown(page.document.markdownBody);
  if (!parsed.ok) notFound();

  return (
    <main className="uno-shell uno-narrow">
      <h1>{page.document.title}</h1>
      {page.document.description !== undefined ? <p>{page.document.description}</p> : null}
      <UnoSafeMarkdownPage blocks={parsed.blocks} />
    </main>
  );
}
