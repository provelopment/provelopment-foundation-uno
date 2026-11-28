/**
 * Foundation Uno — the authority-aware published-Page route (`UNO-WO-030 / R01`, `UNO-WO-095 / R01`).
 *
 * One catch-all segment below the document layout. It reuses that layout's single request-scoped decision — keyed by the
 * primitive authority and pathname — and is the **first App Router 404 boundary**: a refused address calls `notFound()` here,
 * a validated public alias is the only redirect, and everything else renders the accepted published Page.
 * `src/proxy.ts` answers most refused addresses earlier with the approved static 404; this route keeps the same refusal as
 * defense in depth, so a responder bypass can never turn a refusal into a page.
 *
 * SEO. A published **public** Page takes its canonical, its same-Page public locale alternates and its `x-default` from the
 * authority-scoped public discovery plan — the same plan that produces `robots.txt` and `sitemap.xml` for that authority.
 * Those entries were planned per Site, so an alternate can never point at a sibling Site. A published **unlisted** Page keeps
 * its own canonical and `noindex,nofollow` but advertises no alternate.
 *
 * METADATA NEVER THROWS. `generateMetadata` returns non-indexable metadata for a refused or redirecting address rather than
 * calling `notFound()`, because a throw during the metadata phase is what produced an error shell for a 404.
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import type { UnoPublishedPageAccepted } from '../../../application/plan-uno-published-page';
import type { UnoPageMedia } from '../../../core/assets/uno-owned-media';
import { UnoAnalyticsBeacon } from '../../../components/uno-interaction-island';
import { UnoPageSections } from '../../../components/uno-page-sections';
import { UnoSafeMarkdownPage, parseUnoSafeMarkdown } from '../../../components/uno-safe-markdown-page';
import {
  planUnoServingDiscovery,
  planUnoServingNavigation,
  readUnoServingContactFacts,
  readUnoServingPresentationFacts,
} from '../../../config/uno-serving';
import { readSiteRequest, resolveSiteRequest } from './layout';

/** Every request is decided from the committed authority on its own terms. */
export const dynamic = 'force-dynamic';

/** The one route parameter this segment reads: the whole path below the root. */
interface CatchAllRouteParams {
  readonly segments?: readonly string[];
}

/** The metadata shared by a refused address and a redirecting alias: never indexed, never thrown. */
const NON_INDEXABLE: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false, nocache: true },
};

/** The metadata of one accepted published Page, from the same authority-scoped plan that produces that Site's sitemap. */
export async function generateMetadata({ params }: { params: Promise<CatchAllRouteParams> }): Promise<Metadata> {
  const request = await readSiteRequest(params);
  const decision = await resolveSiteRequest(request.host, request.pathname);
  if (decision.kind !== 'page') return NON_INDEXABLE;

  const { page } = decision;
  const languages: Record<string, string> = {};

  if (page.delivery.public) {
    const discovery = await planUnoServingDiscovery(request.host);
    if (discovery.status !== 'planned') return NON_INDEXABLE;

    const entry = discovery.plan.entries.find((candidate) => candidate.canonicalUrl === page.delivery.canonicalUrl);
    if (entry === undefined) return NON_INDEXABLE;

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
    openGraph: { url: page.delivery.canonicalUrl, title: page.document.title, type: 'website' },
  };
  if (page.document.description !== undefined) {
    metadata.description = page.document.description;
    metadata.openGraph = { ...metadata.openGraph, description: page.document.description };
  }
  return metadata;
}

/** Render one visible `h1`, the optional description and exactly one body: inert Markdown or the JSON Page. */
async function renderPage(
  host: string,
  page: UnoPublishedPageAccepted,
  media: UnoPageMedia | undefined,
  routeHrefs?: ReadonlyMap<string, string>,
): Promise<ReactNode> {
  // The shell navigation is derived, never declared: the Site's accepted public Pages in this Page's own locale, ordered by
  // the validated presentation configuration. An absent or malformed configuration simply renders no navigation.
  const navigation = await planUnoServingNavigation({
    host,
    site: { facetId: page.identity.facetId, siteId: page.identity.siteId },
    localeTag: page.identity.localeTag,
    pageId: page.identity.pageId,
    pathname: page.identity.pathname,
  });

  // `U05`: both facts are resolved once, from the committed presentation plus the server-only transport state. Analytics stay
  // off unless an operator authors the declaration; the contact form exists only when a validated webhook is configured.
  const facts = readUnoServingPresentationFacts(
    { facetId: page.identity.facetId, siteId: page.identity.siteId },
    page.identity.pathname,
  );

  let body: ReactNode;
  if (page.document.kind === 'json') {
    if (page.document.pageDocument === undefined) notFound();
    // `U05`: the contact facts come from the same served plan this Page was built from, so the form posts the real
    // route path and the Page's own form reference rather than a section-derived guess.
    const contact = readUnoServingContactFacts({
      facetId: page.identity.facetId,
      siteId: page.identity.siteId,
      host,
      canonicalUrl: page.delivery.canonicalUrl,
      publicPage: page.delivery.public,
      routePath: page.identity.pathname,
      pageId: page.identity.pageId,
      sections: page.document.pageDocument.sections,
      // The Page's own declarations: the generic resolver turns each application key into a destination, or nothing.
      ...(page.document.pageDocument.links === undefined ? {} : { links: page.document.pageDocument.links }),
    });
    body = (
      <UnoPageSections
        contact={{
          siteId: page.identity.siteId,
          applicationLinks: contact.applicationLinks,
          formRef: contact.formRef,
          formEnabled: contact.formEnabled,
          placement: contact.placement,
          transport: contact.transport,
          routePath: contact.routePath,
          localeTag: page.identity.localeTag,
        }}
        document={page.document.pageDocument}
        media={media}
        routeHrefs={routeHrefs}
      />
    );
  } else {
    const parsed = parseUnoSafeMarkdown(page.document.markdownBody);
    if (!parsed.ok) notFound();
    body = <UnoSafeMarkdownPage blocks={parsed.blocks} />;
  }

  return (
    <>
      {/* `UNO-WO-129 / R01`: the published shell carries the same skip affordance as the demonstration page, so a keyboard
          visitor can bypass the navigation and the page body without meeting an authored control first. The `#main` target is
          the one `<main>` this document renders, and the visible-on-focus treatment comes from the one stylesheet. */}
      <a className="uno-skip-link" href="#main">
        Skip to main content
      </a>
      {navigation.status === 'planned' ? (
        <header className="uno-header">
          <div className="uno-shell uno-header__row">
            {navigation.plan.brand === null ? null : navigation.plan.brand.href === null ? (
              <p className="uno-brand">
                <span className="uno-brand__name">{navigation.plan.brand.name}</span>
              </p>
            ) : (
              <a className="uno-brand" href={navigation.plan.brand.href}>
                <span className="uno-brand__name">{navigation.plan.brand.name}</span>
              </a>
            )}
            <nav className="uno-nav" aria-label={navigation.plan.ariaLabel}>
              <ul>
                {navigation.plan.entries.map((entry) => (
                  <li key={entry.pageId}>
                    <a href={entry.href} aria-current={entry.current ? 'page' : undefined}>
                      {entry.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
      ) : null}
      <main className="uno-shell uno-narrow" id="main">
        <h1>{page.document.title}</h1>
        {page.document.description !== undefined ? <p>{page.document.description}</p> : null}
        {body}
      </main>
      {/* `U05`: rendered only when an operator authored an enabled analytics declaration, so a default installation emits no
          beacon, no request and no storage at all. It carries no identifier and no cookie. */}
      {facts.analyticsPath === null ? null : <UnoAnalyticsBeacon path={facts.analyticsPath} />}
    </>
  );
}

/** The first App Router 404 boundary of the site document: refuse here, never in the root layout. */
export default async function SitePage({ params }: { params: Promise<CatchAllRouteParams> }) {
  const request = await readSiteRequest(params);
  const decision = await resolveSiteRequest(request.host, request.pathname);

  if (decision.kind === 'redirect') redirect(decision.location);
  if (decision.kind === 'refused') notFound();

  return renderPage(request.host, decision.page, decision.media, decision.routeHrefs);
}
