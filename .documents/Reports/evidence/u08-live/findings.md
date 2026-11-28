# Completion pass — live production evidence

Installation: `https://uno.provelopment.com`, deployed by the existing Git-to-Vercel integration from candidate
`179da66` (pushed `ca90989..179da66`). Deployment marker: `/en-001` began serving the newly authorised
`mailto:hello@example.com` on 2026-11-28, which only the new candidate can produce.

## HTTP (17 checks, 17 pass)

| Check | Result |
| --- | --- |
| `/en-001`, `/en-001/about`, `/en-001/components` | 200 |
| `/robots.txt`, `/sitemap.xml`, `/api/uno-health` | 200 |
| `/en` | 307 → `/en-001` |
| undeclared address `/en-001/does-not-exist` | 404 |
| `robots.txt` and `sitemap.xml` | name `https://uno.provelopment.com` |
| health | `serving`, address `/en-001`, canonical `https://uno.provelopment.com/en-001` |
| public contact | exactly **one** anchor `<a class="uno-json-list-link" href="mailto:hello@example.com" rel="noreferrer noopener">`; the second textual occurrence is the RSC flight payload carrying the same prop, not a second link; no `tel:` destination is invented |
| unverified submission (no claims) | 403 `contact:page-mismatch` — refused before any transport |
| submission for a Page that declares no form | 409 `contact:form-undeclared` — the honest `off` outcome |
| submission carrying an extra field | 409 — refused before composition |

## Browser (24 combinations, 24 pass)

Two colour schemes × 320/390/768/1280 px × the three published Pages: every request 200, no horizontal overflow, no
broken image, no console error and no failed request. The skip link remains the first keyboard stop (`#main`), and the
public contact anchor is visible and focusable at 320 px (105 px wide).

These are readings from this repository's pinned Chromium and plain HTTPS requests. They support the visual review; they
do not replace the independent inspection the audit performs.
