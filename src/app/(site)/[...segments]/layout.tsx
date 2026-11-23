/**
 * Foundation Uno — the published-Site document (`UNO-WO-030 / R01`, `UNO-WO-095 / R01`).
 *
 * The single `<html>` document of the site tree, now one authority-aware catch-all. A version-2 declaration can bind several
 * Sites on one authority under disjoint prefixes and several Sites may author the same locale, so the locale can no longer be
 * a build-time dynamic segment: the whole path arrives here and the composition decides which Site owns it.
 *
 * THIS LAYOUT NEVER THROWS. A catch-all matches unknown paths, so an unknown address must still produce a document. The
 * refusal is raised by the Page below and, for a refused address, answered before rendering by `src/proxy.ts`; a throw from
 * this root layout would instead produce Next's not-found shell.
 *
 * TRUTHFUL `lang`. For a served Page the attribute is that Page's **authored full** locale tag (`de-de` renders `de-DE`). For
 * a refusal or an alias redirect the neutral `en` of the error document is used — never presented as a published locale —
 * because a refused address has no authored language to claim. No cookie, preference, `Accept-Language` header or environment
 * value ever chooses a language.
 *
 * THIN EDGE. This is the one place that reads the raw request authority, and it passes it here as an untrusted argument.
 */
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveUnoServingRequest, type UnoServingDecision } from '../../../config/uno-serving';
import '../../globals.css';

/** Every request is placed by its own authority and path, so nothing is prerendered. */
export const dynamic = 'force-dynamic';

/** The one route parameter this document reads. */
interface SiteRouteParams {
  readonly segments?: readonly string[];
}

/** The primitive request key: one authority string and one absolute pathname. */
export interface SiteRequest {
  readonly host: string;
  readonly pathname: string;
}

/** Read the request as two primitives, joined exactly once so every phase keys on the same pair. */
export async function readSiteRequest(params: Promise<SiteRouteParams>): Promise<SiteRequest> {
  const resolved = await params;
  const parts = resolved.segments ?? [];
  const host = (await headers()).get('host') ?? '';
  return Object.freeze({ host, pathname: parts.length === 0 ? '/' : `/${parts.join('/')}` });
}

/**
 * One request decision, memoised for the duration of one request by its two primitive keys.
 *
 * `cache` is request-scoped, so this is not a global authority cache: two requests with the same keys each get their own
 * evaluation, and a changed authority can never reuse another authority's answer.
 */
export const resolveSiteRequest = cache(
  async (host: string, pathname: string): Promise<UnoServingDecision> => resolveUnoServingRequest({ host, pathname }),
);

/** Render the document; never throw a 404 here. */
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<SiteRouteParams>;
}) {
  const request = await readSiteRequest(params);
  const decision = await resolveSiteRequest(request.host, request.pathname);
  const lang = decision.kind === 'page' ? decision.page.identity.localeTag : 'en';

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
