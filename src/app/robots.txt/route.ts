/**
 * Foundation Uno — `robots.txt` (`UNO-WO-028 / R01`, U03).
 *
 * Served only when the committed canonical base exists and the discovery plan holds at least one published
 * public Page. Otherwise this address is a genuine 404 — never an empty `200` that would advertise a site the
 * declaration does not publish. No `Disallow` rule names an unlisted Page: an unlisted Page is protected by its
 * own `noindex,nofollow` response, so listing its address here would be exactly the leak to avoid.
 */
import { NextResponse } from 'next/server';

import { renderUnoServingRobots } from '../../config/uno-serving';

/** Nothing is cached: the answer is derived from the committed declaration on every request. */
export const dynamic = 'force-dynamic';

/** The bounded plain-text body, or a real 404. */
export async function GET(): Promise<NextResponse> {
  const body = await renderUnoServingRobots();
  if (body === null) return new NextResponse(null, { status: 404 });

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
