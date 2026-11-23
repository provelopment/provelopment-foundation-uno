/**
 * Foundation Uno — the 404 boundary of the authority-aware catch-all (`UNO-WO-095 / R01`).
 *
 * A catch-all matches every path, so a refused address cannot fall through to an unmatched route. This boundary answers the
 * Page's `notFound()` with the **existing approved** document — re-exported from `src/app/not-found.tsx`, never re-authored —
 * so the U01 heading, sentence and `href="/"` return link stay byte-identical and no second 404 copy can drift.
 *
 * It renders no `<html>` or `<body>` of its own. In addition, `src/proxy.ts` answers a refused address before rendering with
 * the same approved document as static HTML, so a client without JavaScript still receives readable, truthful 404 content.
 */
export { default } from '../../not-found';
