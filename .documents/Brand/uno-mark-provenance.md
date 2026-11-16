# Uno mark provenance — `UNO-WO-016 / R01`

**Audience:** the Owner, the Architect and any future maintainer. **Status:** records the origin,
digests and limits of the one brand asset installed by this order. It is not a trademark filing and not
an execution log.

## 1. What is installed

| Item | Value |
| --- | --- |
| Header emblem | `public/uno-logo.svg`, rendered by `next/image` with `unoptimized`, 30 × 30, `alt="Foundation Uno"` |
| Favicon | `src/app/icon.svg`, served by the Next.js App Router icon route as `<link rel="icon" href="/icon.svg?…" type="image/svg+xml">` |
| Byte parity | Identical byte streams: **8,247 bytes** each |
| SHA-256 | `bd804ce683824ad85852615b0e0a700badb80cf2cdff38dd642d9f1947d57d9c` |
| Canvas | `viewBox="0 0 2048 2048"`, transparent, no raster, no font, no script |

## 2. Provenance — derived from the official emblem

The Owner supplied the genuine Provelopment `emblem.svg` (7,938 bytes, SHA-256
`0512bfa323589990f3300203f5f1e89a6d2a9ebb2df30755fa466ad00f5ed8e0`). This order's derivative:

- **retains all ten original network `<path>` definitions and their group transforms**, so the official
  network geometry is preserved rather than redrawn;
- recolours the network's single original fill `#C5161D` to the approved Uno green `#1f6f6b`;
- adds one enlarged numeral `1` as clean path geometry in **true black** `#000000`, the Owner's final
  colour decision for this increment, replacing the previous concept mark's dark numeral;
- keeps a transparent canvas with no solid bounding box, no white plate and no embedded raster.

The previous order's concept mark (128-unit canvas, `#101620` numeral) and the interim charcoal numeral
(`#36454f`, 8,250 bytes, SHA-256 `de749e41347a043691b3dd82ced90a2d53f80c240993057388cdfaee20a0a568`) are
both **superseded**. Neither colour may reappear: tests refuse `#101620`, `#36454f` and any 128-unit
canvas, and the current asset is pinned at 8,247 bytes.

## 3. Colour references

| Element | Value | Reference |
| --- | --- | --- |
| Network stroke and nodes | `#1f6f6b` | Existing approved token `--uno-accent` in the untouched `src/app/globals.css` |
| Numeral | `#000000` (true black) | Owner's final colour decision for this increment; the charcoal `#36454f` choice is withdrawn |
| Canvas | none | Transparent; no white background behind the mark |

No CSS filter, gradient, animation or new palette entry is introduced, and the stylesheet is unchanged
by this order.

## 4. Safety properties

The committed SVG contains no `<script>`, no event attribute, no `<foreignObject>`, no `<image>`, no
`href`/`xlink:href` remote reference, no embedded base64 payload, no external font and no filter URL.
Both the readiness verifier and the brand/copy suite assert these properties and prove their refusals
against synthetic fixtures; the HTTP verifier re-checks the served bytes and their digest.

## 5. Parity and replacement procedure

Header and favicon must remain **the same vector bytes**: any revision writes one file to both paths in
the same change, and the tests fail if they diverge. A future authorized replacement should:

1. arrive with a new bounded work order naming exactly `public/uno-logo.svg` and `src/app/icon.svg`;
2. state the intended digest and byte length, plus the licence or ownership basis;
3. update the pinned digest in `scripts/verify-vercel-readiness.mjs`,
   `tests/deployment/uno-brand-copy.test.mjs` and the HTTP verifier in the same change;
4. keep the transparent canvas, the 30 × 30 header size and the `alt="Foundation Uno"` text;
5. replace §2 of this file rather than appending a second, conflicting narrative.

Until then, this derivative — official network geometry plus the enlarged true-black numeral — is the
approved Uno emblem.
