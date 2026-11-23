/**
 * Foundation Uno — the `(site)` group 404 boundary (`UNO-WO-095 / R01`).
 *
 * The authorized group-level boundary for the site tree. It re-exports the one approved 404 document from
 * `src/app/not-found.tsx`, so the route group and the catch-all segment cannot disagree about the approved heading, sentence
 * or return link, and no reader of this file has to trust a second copy of the copy.
 *
 * The `<html>`/`<body>` document comes from the segment document layout; this boundary contributes only the approved body, and
 * it never mutates the response status, the safety headers or the refusal semantics of the address that reached it.
 */
export { default } from '../not-found';
