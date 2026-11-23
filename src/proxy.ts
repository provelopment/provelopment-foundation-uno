/**
 * Foundation Uno — the narrow 404 refusal responder (`UNO-WO-095 / R01`).
 *
 * WHY. A root-level catch-all matches every path, so the App Router — not framework unmatched-route handling — owns unknown
 * addresses inside the site tree, and Next 16 renders a `notFound()` raised below a route-group root layout as an RSC-only
 * shell: status 404, but no approved HTML and no `href="/"` in the document. This is the authorized narrow pre-render step
 * that answers *only* an address the same validated serving decision has already refused.
 *
 * IT IS NOT PUBLICATION AUTHORITY. It cannot create a 200, bind a Site, rewrite a source path, trust a forwarded authority,
 * send an open redirect, run a provider call or turn a negative Page positive. It has exactly three outcomes: **continue** to
 * the App Router (which performs all of its own validation and remains the real router, including the alias redirect), **refuse**
 * with the approved 404, or answer a redirect the serving decision already granted with a temporary `307` to that same
 * canonical target (`UNO-WO-099 / R01`). The only bytes it may add to that target are the request's own query, and only when
 * `validateUnoSafeRedirectQuery` accepts them byte for byte; an unprovable or unsafe query becomes the approved 404 rather
 * than a stripped redirect.
 *
 * IT DOES NOT TOUCH THE REST OF THE APPLICATION. `/`, the demonstration tree, Next internals, static assets, the icon, the SEO
 * endpoints and owned media are excluded twice — by the declared matcher and by an explicit guard — so an asset request can
 * never be answered by this responder even if a future matcher edit is too broad.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { UNO_APPROVED_404_HEADERS, UNO_APPROVED_404_HTML } from './config/uno-not-found-response';
import { validateUnoSafeRedirectQuery } from './config/uno-safe-redirect-query';
import { resolveUnoServingRequest } from './config/uno-serving';

/** The exact prefixes this responder must never intercept. */
const EXCLUDED_PREFIXES: readonly string[] = Object.freeze(['/_next', '/uno-media', '/.well-known']);

/** The exact paths this responder must never intercept. */
const EXCLUDED_PATHS: readonly string[] = Object.freeze([
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/icon.svg',
  '/favicon.ico',
  '/apple-icon.png',
  '/manifest.webmanifest',
]);

/** One file extension of a real static asset: such a request belongs to the asset pipeline, not to a Page. */
const ASSET_FILE = /\.[a-z0-9]{2,5}$/u;

/** Whether this request is outside the responder's remit. */
function isOutsideRemit(pathname: string): boolean {
  if (EXCLUDED_PATHS.includes(pathname)) return true;
  if (EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
  if (ASSET_FILE.test(pathname)) return true;
  return pathname.startsWith('/_');
}

/** The approved refusal response: static HTML, a real 404, never cached and never indexed. */
function approvedRefusal(): NextResponse {
  return new NextResponse(UNO_APPROVED_404_HTML, { status: 404, headers: { ...UNO_APPROVED_404_HEADERS } });
}

/**
 * The raw query suffix this very request carried, including its leading `?`, or `""` when it carried none.
 *
 * The request URL is the least privileged surface that still holds the original bytes: no forwarded header, cookie,
 * environment value or request authority participates, and nothing here decides a destination. A fragment appearing in a
 * server-side request URL means the bytes cannot be proven to be the request's own, so `null` is returned and the caller
 * refuses instead of guessing.
 */
function rawQueryOf(requestUrl: string): string | null {
  const start = requestUrl.indexOf('?');
  if (start < 0) return '';
  if (requestUrl.indexOf('#') >= 0) return null;
  return requestUrl.slice(start);
}

/**
 * Answer one request with the decision the validated serving resolver already made.
 *
 * A `page` decision is passed to the App Router untouched — the edge adds no redirect and reads no query into publication.
 * A `redirect` decision becomes one temporary `307` to that accepted canonical location, carrying the request's own query
 * only when the pure validator accepts it **and** only as the suffix of the location the resolver already produced; an
 * unprovable or unsafe query refuses with the approved 404 rather than being stripped into a successful redirect.
 */
async function decide(request: NextRequest, pathname: string): Promise<NextResponse> {
  const decision = await resolveUnoServingRequest({ host: request.headers.get('host') ?? '', pathname });
  if (decision.kind === 'refused') return approvedRefusal();
  if (decision.kind === 'page') return NextResponse.next();

  const rawQuery = rawQueryOf(request.url);
  if (rawQuery === null) return approvedRefusal();
  const safeQuery = validateUnoSafeRedirectQuery(rawQuery);
  if (safeQuery.status !== 'accepted') return approvedRefusal();

  return new NextResponse(null, {
    status: 307,
    headers: {
      location: `${decision.location}${safeQuery.query}`,
      'cache-control': 'no-store',
    },
  });
}

/**
 * Answer an address the validated serving decision has refused with the approved 404, an authorized redirect with its
 * temporary canonical target, and let everything else through.
 *
 * A non-read method is passed straight on so the App Router answers it with its own semantics. The decision is the *same*
 * function the document, metadata and route use, so the responder cannot disagree with the Page about who owns an address.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isOutsideRemit(pathname)) return NextResponse.next();

  return decide(request, pathname);
}

/** Skip the responder for everything it must not own, before it even runs. */
export const config = {
  matcher: ['/((?!_next/|uno-media/|robots\\.txt|sitemap\\.xml|icon\\.svg).*)'],
};
