/**
 * Foundation Uno — the global not-found document (`UNO-WO-029 / R01`, U03).
 *
 * WHAT THIS IS. The complete HTML 404 for an address that matches **no** route at all. Next's supported
 * `experimental.globalNotFound` flag makes this file the document for those requests, so an unmatched path is a real
 * status 404 with a fully rendered page rather than a streamed shell.
 *
 * HONESTY AND SAFETY. The visible copy, the single `h1` and the return link are exactly the approved ones from
 * `src/app/not-found.tsx`, which stays in place for a segment-level Not Found. The document is `lang="en"` because it
 * is the demonstration/error document, carries `noindex, nofollow`, imports the same stylesheet and adds no canonical,
 * `hreflang`, analytics or provider — it cannot turn an unknown address into a success or an indexed page.
 */
import Link from 'next/link';

import './globals.css';

/** Render the approved 404 document. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Page not found</title>
      </head>
      <body>
        <main className="uno-shell uno-narrow">
          <h1>Page not found</h1>
          <p>
            This address is not part of the Foundation Uno demonstration. Nothing is authored, selected or served
            at it yet, and no locale route is enabled.
          </p>
          <p>
            <Link className="uno-link" href="/">
              Go to the Foundation Uno homepage
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
