# Uno mark provenance — `UNO-WO-015 / R01`

**Audience:** the Owner, the Architect and any future maintainer. **Status:** records the origin and
limits of the one brand asset installed by this order. It is not a trademark filing, not a claim of
official brand equivalence and not an execution log.

## 1. What was installed

| Item | Value |
| --- | --- |
| Header mark | `public/uno-logo.svg` — referenced as `<img src="/uno-logo.svg" alt="Foundation Uno" width="30" height="30">` in the brand row of `src/app/page.tsx` |
| Favicon | `src/app/icon.svg` — the Next.js App Router icon route, served as `<link rel="icon" href="/icon.svg?…" type="image/svg+xml">` |
| Byte parity | The two files are **byte-identical**, 1,730 bytes each, SHA-256 `19759bc29d887401dd42550304e22dc625cbd5be936f5f93d2b9fde938010162` |
| Format | One self-contained static SVG, `viewBox="0 0 128 128"`, no raster fallback, no font, no script |

## 2. Provenance — an original concept, not a licensed master

The mark is an **original dot-network concept with a prominent numeral `1`**, authored for this order
from the Owner's brief and supplied in the order's §3 as the complete file. The Owner approved that
exact vector as the Uno mark for this increment.

It is **deliberately not asserted to be the official Provelopment logo.** No rights-cleared
Provelopment master artwork was available to the Implementation Agent, and the neutral `logo.svg` /
`favicon.svg` files seen in the sibling Foundation repository are placeholders, not brand masters.
Anyone reading this file must therefore treat the geometry as an Uno concept, not as official
Provelopment brand geometry, and must not cite it as a byte-identical overlay of any official emblem.

## 3. Design and colour references

| Element | Value | Source of the value |
| --- | --- | --- |
| Network stroke and nodes | `#1f6f6b` (light-mode accent) | Existing approved token `--uno-accent` in `src/app/globals.css` |
| Numeral fill | `#101620` | Existing approved token `--uno-foreground` |
| Keyline | `#ffffff`, 7 units, `paint-order="stroke fill"` | Keeps the numeral legible against dense network nodes at 16 × 16 |
| Canvas | `128 × 128` units, integer node coordinates | Reproducible at 16, 32 and header size without resampling |

The mark introduces **no new colour**: it reuses the two existing palette values, so light and dark
mode, contrast preferences and the site's colour scheme are unchanged. No CSS filter, gradient or
animation is applied to it.

## 4. Safety properties

The committed SVG contains no `<script>`, no event attribute, no `<foreignObject>`, no `<image>`, no
`href`/`xlink:href` remote reference, no embedded base64 payload, no external font, no CSS import and
no filter URL. It is inert when opened directly or served from the App Router route. Both the
security-floor test and the brand/copy test assert these properties, and both prove their refusals
against synthetic negative fixtures.

## 5. Parity rule (header = favicon)

The header image and the favicon must remain **the same vector bytes**. Any revision applies the same
file to both paths in one change, and the tests fail if they diverge. This prevents the common drift
where a favicon silently becomes an older or different mark.

## 6. Replacing the concept with an official master

If a rights-cleared Provelopment or Uno master is supplied later, the replacement procedure is:

1. A new work order authorizing exactly two paths — `public/uno-logo.svg` and `src/app/icon.svg` — and
   no copy or layout change.
2. Write the supplied vector to both paths with byte-identical content, keeping a square `viewBox` and
   integer-safe geometry.
3. Update the byte-parity expectation recorded in the brand/copy test **only** if the file size is
   asserted there; the parity comparison itself stays unchanged.
4. Re-run the brand/copy test, the HTTP verifier (which checks that both routes serve identical SVG)
   and both-host CI before any push.
5. Record the new licence and provenance in this file, replacing §2 rather than appending a second
   conflicting narrative.

Until that happens, this concept stands as the approved Uno mark for the demonstration page, and no
document may describe it as official Provelopment brand artwork.
