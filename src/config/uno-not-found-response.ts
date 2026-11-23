/**
 * Foundation Uno — the approved 404 response (`UNO-WO-095 / R01`).
 *
 * The one approved 404 document as a **static, self-contained** HTML string, for the narrow pre-render refusal responder in
 * `src/proxy.ts`. The App Router boundary answers the same refusal through `src/app/(site)/not-found.tsx`, which renders the
 * same heading, the same sentence and the same return link.
 *
 * Next 16 renders a not-found raised below a route-group root layout as an RSC-only shell: the status is 404, but the
 * document carries no anchor and the approved content appears only in the Flight payload. A 404 must be readable with
 * JavaScript disabled, so this is byte-stable markup with **no interpolation of any kind** — no request authority, path,
 * header, query or locale can reach it, and nothing user-supplied can be reflected.
 *
 * The copy is the approved U01 copy verbatim: heading `Page not found`, the sentence beginning `This address is not part of
 * the Foundation Uno demonstration.` and the literal same-origin link `<a href="/">Go to the Foundation Uno homepage</a>`.
 */

/** The approved 404 document: static markup, no interpolation, no script, no external reference. */
export const UNO_APPROVED_404_HTML = [
  "<!doctype html>",
  '<html lang="en">',
  "<head>",
  '<meta charset="utf-8"/>',
  '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
  '<meta name="robots" content="noindex, nofollow"/>',
  "<title>Page not found</title>",
  "</head>",
  '<body style="margin:0;background:#f7f7f5;color:#1c1c1a;font-family:system-ui,-apple-system,\'Segoe UI\',sans-serif;line-height:1.55">',
  '<main style="max-width:44rem;margin:0 auto;padding:3rem 1.25rem">',
  '<h1 style="margin:0 0 1rem;font-size:1.75rem">Page not found</h1>',
  '<p style="margin:0 0 1rem">This address is not part of the Foundation Uno demonstration. Nothing is authored, selected ' +
    "or served at it yet, and no locale route is enabled.</p>",
  '<p style="margin:0"><a href="/" style="color:#14532d;text-underline-offset:2px">Go to the Foundation Uno homepage</a></p>',
  "</main>",
  "</body>",
  "</html>",
  "",
].join("\n");

/** The exact response headers of an approved refusal: never cached, always a real 404. */
export const UNO_APPROVED_404_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store, max-age=0, must-revalidate",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
});

/** Whether a body is exactly the approved document — byte equality, not similarity. */
export function isUnoApproved404Document(body: unknown): boolean {
  return body === UNO_APPROVED_404_HTML;
}
