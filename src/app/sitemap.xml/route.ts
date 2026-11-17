/**
 * Foundation Uno — `sitemap.xml` (`UNO-WO-028 / R01`, U03).
 *
 * Served only when the committed canonical base exists and the discovery plan holds at least one published
 * public Page. Otherwise a genuine 404. Every `<loc>` is a canonical origin URL produced by the discovery
 * planner; every alternate comes from the same plan, so an unlisted Page, an alias, a refused source or an
 * unpublished Page can never appear, and every emitted value is XML-escaped.
 */
import { NextResponse } from 'next/server';

import { renderUnoServingSitemap } from '../../config/uno-serving';

/** Nothing is cached: the answer is derived from the committed declaration on every request. */
export const dynamic = 'force-dynamic';

/** The bounded XML body, or a real 404. */
export async function GET(): Promise<NextResponse> {
  const body = await renderUnoServingSitemap();
  if (body === null) return new NextResponse(null, { status: 404 });

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
