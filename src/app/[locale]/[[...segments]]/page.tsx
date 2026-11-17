/**
 * Foundation Uno — the localized published-Page segment (`UNO-WO-028 / R01`, U03).
 *
 * WHAT THIS IS. One thin App Router segment: it validates the incoming locale and segments, asks the
 * server-only composition whether this exact address is a published Page, and renders either that Page, one
 * temporary redirect for an explicit short locale alias, or the ordinary 404.
 *
 * WHAT IT WILL NOT DO. No environment fallback, no request-Host inference, no `Accept-Language` guess, no
 * preference cookie, no geo lookup, no first-Site default, no localhost default and no `rewrite`. An address
 * that the committed declaration does not publish is a genuine 404 — including every address of this
 * repository's own deployment, which declares no canonical base and publishes no Page.
 *
 * LANGUAGE ATTRIBUTE. The root layout renders a fixed `<html lang="en">` and is byte-frozen by an earlier
 * order, so this segment cannot set a truthful per-Page language attribute. That limitation is recorded rather
 * than faked: the attribute stays `en` and the locale-attribute gate is reported UNVERIFIED.
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import type { UnoPublishedPageAccepted } from '../../../application/plan-uno-published-page';
import {
  UnoSafeMarkdownPage,
  parseUnoSafeMarkdown,
} from '../../../components/uno-safe-markdown-page';
import { planUnoServingPage, listUnoServingAddresses, resolveUnoServingAlias } from '../../../config/uno-serving';
import { PAGE_ROUTE_PATH_MAX_SEGMENTS } from '../../../core/page-route-path';

/** The subset of the route parameters this segment reads. */
interface LocalizedRouteParams {
  readonly locale?: string;
  readonly segments?: readonly string[];
}

/**
 * Only addresses the committed declaration actually publishes are generated; every other address is refused by
 * the router itself, which answers the ordinary static 404 document instead of a streamed error shell. With no
 * published Page and no declared base — the committed reality — this list is empty, so every localized address
 * is a genuine, fully rendered 404.
 */
export async function generateStaticParams(): Promise<LocalizedRouteParams[]> {
  const addresses = await listUnoServingAddresses();
  return addresses.map((address) => ({
    locale: address.locale,
    ...(address.segments.length === 0 ? {} : { segments: [...address.segments] }),
  }));
}

/** Addresses not produced at build time are not part of this deployment: the router refuses them. */
export const dynamicParams = false;

/** One validated lowercase path segment or locale path key. */
const PATH_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

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

/** The metadata of one accepted published Page, or nothing at all for a refused address. */
export async function generateMetadata({
  params,
}: {
  params: Promise<LocalizedRouteParams>;
}): Promise<Metadata> {
  const resolvedRoute = await resolveRoute(params);
  if (resolvedRoute.kind === 'refused') notFound();
  if (resolvedRoute.kind !== 'page') return {};

  const { page } = resolvedRoute;
  const metadata: Metadata = {
    title: page.document.title,
    alternates: { canonical: page.delivery.canonicalUrl },
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
