# U07 live evidence — uno.provelopment.com

Captured with the repository's pinned Chromium against the public HTTPS installation. These are evidence artifacts, not a gate: the gate is
`scripts/verify-u07-function-inputs.mjs`, which runs in CI against the build's own packaging traces. That gate enforces a **named** list of
required inputs per consuming bundle; it does not discover new authored sources or assets by itself, so a future input must be added to the
contract by hand.

## Addresses

| Address | Status | Language | Canonical | Robots |
| --- | --- | --- | --- | --- |
| `/` | 200 | `en` | none (demonstration) | `noindex, nofollow, nocache` |
| `/en-001` | 200 | `en-001` | `https://uno.provelopment.com/en-001` | `index, follow` |
| `/en-001/about` | 200 | `en-001` | `…/en-001/about` | `index, follow` |
| `/en-001/components` | 200 | `en-001` | `…/en-001/components` | `index, follow` |
| `/en` | 307 | — | `Location: /en-001` | — |
| `/robots.txt` | 200 | — | `Sitemap: https://uno.provelopment.com/sitemap.xml` | — |
| `/sitemap.xml` | 200 | — | three `<loc>` values + `hreflang` on the production origin | — |
| `/api/uno-health` | 200 | — | `serving`, `https://uno.provelopment.com/en-001` | `noindex, nofollow` |
| `/en-001/no-such-page`, `/zzz` | 404 | `en` | — | `noindex, nofollow` |
| `/uno-media/en-001/components/{0,1,2}` | 200 | — | `image/png`, 191 bytes each | `public, max-age=0, must-revalidate` |
| `/uno-media/en-001/0` (undeclared) | 404 | — | — | `no-store` |

## Layout, responsive behaviour and console health

Sixteen page-and-width combinations (four Pages at 320, 390, 768 and 1280 px): every one returned 200, with no horizontal overflow, no broken
image, no console error, no uncaught exception and no failed request.

## Appearance and interaction

- Light surface `rgb(255,255,255)` on `rgb(16,22,32)`; dark surface `rgb(12,17,24)` on `rgb(238,242,248)`; `prefers-reduced-motion: reduce` is
  honoured (`matchMedia` true under the reduced-motion context).
- First keyboard stop is "Skip to main content" (`href="#main"`) with a visible 3 px focus ring. Re-tested from a fresh document with no
  programmatic focus, one Tab then Enter: the fragment navigation to `#main` occurs and the reading position moves. `document.activeElement`
  remains `body` because the landmark carries no `tabindex`, which is standard browser behaviour for a fragment target that is not focusable.
  An earlier reading in `interaction-findings.json` began from a page whose focus was already deep in the document and therefore measured a
  different start condition; it is retained and labelled, and `skipRetest` is the authoritative record.
- Focus order then follows the header links: brand, About, Components; every stop shows the same visible ring.
- The four native disclosures open and close (first `<details>` toggled closed and reported `open: false`), with no script involved.
- Structure on the Components Page: 4 `<figure>`, 3 `<figcaption>`, a table whose `<th>` cells all carry `scope`, 4 `<details>` with summaries.
- The contact notice is present and honest — "Delivery is switched off. Nothing entered here is sent or stored." — and no form is served.

## Performance (cold context, single run)

| Page | TTFB | DOMContentLoaded | LCP | Resources |
| --- | --- | --- | --- | --- |
| `/en-001` | 62 ms | 408 ms | 412 ms | 9 |
| `/en-001/components` | 61 ms | 363 ms | 432 ms | 9 |

## Provenance of each statement

- **Measured here** — statuses, headers, languages, canonicals, robots directives, media types, overflow, broken images, console and request
  failures, focus order, disclosure state, structure counts, and the timing table above. These are readings from the pinned Chromium and plain
  HTTP requests, reproducible by re-running the scripts described in the report.
- **Inspected independently** — the Architect's own review of the committed screenshots and of the live installation, which is the basis of the
  acceptance recorded in the execution report. The measurements above support that review; they do not replace it.

## Artifacts

`demonstration-{320,390,768,1280}.png`, `home-*.png`, `about-*.png`, `components-*.png`, `components-390-{light,dark}.png`,
`components-1280-disclosure-open.png`, `navigation-from-demonstration.png`, `findings.json`, `interaction-findings.json`.

## Observations, not defects

- The Components Page is long by design: seventeen bounded family samples follow six native sections. Every one is authored plain text; nothing
  is decorative filler, but the length is the main usability cost of the page.
- The three gallery plates are the same authored 191-byte sample image, repeated as a declared gallery. That is authored content, not a rendering
  fault, and it is the one place where the page looks thinner than the rest.
