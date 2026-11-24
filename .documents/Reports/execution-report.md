# Execution Report — UNO-WO-108 / R01

**Outcome: a green, committed U04 production evidence runner.** The rich Table/List fixture and all four repairs now execute against a real `next build`, a real `next start` and real Chromium, ending **813 passed / 0 failed** with the formal oracle deliberately untouched at `A1`.

| | |
| --- | --- |
| Order | `UNO-WO-108 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **32,035 bytes**, SHA-256 `186d9637…61fd8d1` — private, ignored, never staged |
| Start SHA | `edc0dc238f19d4679252d43bf99a0ae6a48758e6` |
| Product SHA | **`9e03936f9447cd7cc9de3ac446a53272f66d55e5`** |
| Files changed | `scripts/verify-u04-22-module-consent.mjs`, `tests/deployment/u04-22-module-consent.test.mjs` |
| Frozen blobs | `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `sop-implementation.md` `f30d6590…`; declarations `b6213ed6…`/`58011c43…` — unchanged |
| Claimed credit | **none** — `PARITY_TABLE=PENDING`, `PARITY_LIST=PENDING`, `U04_PARITY=3/17`, `U04_PROXY=45/59` |

## 1. Substantive implementation

The fixture now authors the approved document-local declaration `links: { help: { reference: "applicationLink", key: "example.help" } }`, replaces index 2 with the four-entry rich list (`Prepare`; a classified `https` note with Markdown detail; a route item to a published same-Site Page; and one authorized-but-OFF `link` declaration), and replaces index 13 with the rich table (Markdown caption `Two **synthetic** records`, Markdown lede, authored `surface: "muted"`, unchanged columns and rows). A sixth fixture source `wo108-target.en-001.json` is installed and removed by the **same** recovery-armed transaction, and is published under the existing single `foundation/main` Site.

Four repairs landed, each preserving or strengthening the original guarantee:

1. **`FAMILY_TEXT_FIVE_SOURCE`** — the rich families intentionally compose a heading-only two-child stack with the Markdown lede inside the native node; the rich arm now proves that exact field set (variant, `markdown`, lede, surface, ordered flag, the four normalised items with disjoint key sets, route target, off `linkId`, the closed caption and rectangular rows), while FAQ index 3 keeps its original three-child equality against the adapter's own output, byte for byte.
2. **`FAMILY_HTTP` / `FAMILY_TABLE_HTTP` / `FAMILY_TEXT_FIVE_HTTP`** — three distinct arms instead of one template: the list proves four `<li>` in authoring order, exactly two `rel="noreferrer noopener"` anchors with the authored `https` note and the stored `http://localhost:3000/en-001/wo108-target` canonical, an inert Help label with no opaque key, and the real Markdown emphasis; the table proves the native section, `data-uno-surface="muted"`, the nested scroll with `tabindex="0"`, the captioned two-column table with a real `<strong>`, two `scope="col"` headers, two rectangular rows and no link, image, form or frame; only FAQ keeps its plain `id="…-lede"` sibling and its exact three-child DOM.
3. **`FAMILY_BROWSER` / `FAMILY_TEXT_FIVE_BROWSER`** — the table probe now resolves the family id to the **section**, then the scroll, then the native table, and the keyboard proof focuses the scroll control itself; the five-family probe reads the rich lede inside the native section while keeping `headingBeforeLede` and `ledeBeforeNative` meaningful, and requires exactly two safe anchors on the list and zero other active controls everywhere.
4. **`A2_LOCAL_READER`** — composed and re-read props are compared field by field (never as one string), the normalised `{label:"Prepare"}` item and the disjoint remaining item shapes are asserted explicitly, the one approved declaration is required on the re-read document, and no invented URL may appear on the route item.

## 2. Executed evidence, still uncredited

Fourteen local dimensions run and are totalled by a named, non-parity assertion — `A2_LOCAL_TABLE_LIST_EVIDENCE=14/14 (uncredited, P6 pending)` — for `source`, `reader`, `renderer`, `http`, `browser`, `refusal` and `rights` on both families. The refusals are executed against the authored source (an undeclared `link` id and an unsafe URL scheme, both refused with `family:*` codes), and the HTTP dimension adds a real `200` from the ephemeral base for the published same-Site target plus a closed `404` for an undeclared route. The A1 oracle call, its evidence family set and every label printer were left untouched, so CI still prints `PENDING`, `3/17` and `45/59` — no A2 credit is invented.

## 3. Gates and recovery

`node scripts/verify-u04-22-module-consent.mjs` **813 passed / 0 failed**, exit `0`, with both declarations restored to their pinned digests; `node --test tests/deployment/u04-22-module-consent.test.mjs` **46/46** after re-pinning four stale guard tokens to the actual richer authored shapes; `pnpm test` **1,287/1,287**; `pnpm test:architecture` **47/0**; `typecheck` and `lint` clean; tracked tree clean. The candidate patch was written to the ignored `.temp/uno-wo108/runner.patch` after every fix (final 48,483 bytes, SHA-256 `77849a82…d1fbf8`), so the constructed work could never be lost again.

## 4. Standing state

Both hosted workflows were dispatched at the product SHA and are reported separately as verified; no stage closure, P6 extension, release, deployment or provider action was taken, and no unrelated family was touched.

**Disposition:** rich Table/List fixture and repairs committed and locally green; parity stays `PENDING` at `3/17`/`45/59`; awaiting the separate three-Site P6 proof and independent Architect review.
