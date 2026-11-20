# Execution Report — UNO-WO-064 / R01

**Status: DELIVERED — the sixteenth bounded source mapping is published. U04 remains OPEN.**
**Accounting: 16/17 bounded source-family mappings, 1 entirely unimplemented (`contactForm`), 0/17 full semantic parity.**

## 1. Authority and observed start state

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-064 / R01`, EDITION FINAL — EXECUTE |
| ACTIVE | `.documents/WIP/workorder-active.md` — **40,474 bytes**, SHA-256 `3a46dad7157784b2baed7ae6ca65025eb5cb25093efb28449776a2b1765e74f0`, ignored, untracked, unstaged, in its one private WIP slot |
| Required start | `bb0b63148f23d074df489a3a2262d862304e51ce` — matched `HEAD`, local `main`, `origin/main` and `git ls-remote` |
| Start blobs | A01 `c09b2f3351d9946cde27143552fc50fa38f27ee5`, A02 `768fa043b0ba3bfb04acdd6b5c525dac0b28923e`, A03 `6ac7979b5f6989398780bc3406cf0377a4bdc05d` — all matched |
| Local Uno pins | `uno-owned-media.ts` `f988a0e5…`, `page-document.ts` `2d968300…`, `uno-page-sections.tsx` `cde15a6b…` |
| Donor pins | `provelopment/provelopment-foundation` @ `c05c55ea…`: `LICENSE` `d6456956…`, `page-document.ts` `a12d964c…`, `media-sections.tsx` `e3f3a12e…`, `section-support.tsx` `19c9bee3…` |
| Physical/Git | one checkout, **1** worktree, **1** branch, **1** remote `origin`, **0** stashes, clean status and empty index before the first write |
| Declarations | `ba232d46…e3f0` and `4f656c93…9a0c` — byte-identical before/after every stateful suite and on handback |

## 2. Published product — one complete audited commit

| Commit | Contents |
| --- | --- |
| **`6c76a56491d957b2e041cf1f32402b1b7f8ac03e`** `feat(u04): compose explicitly bound donor gallery subset` | A01 `868ed5f95abb08c8d32d6b3060cdbabc6ff91169`, A02 `95df22f3d916d6813e07dbccca18ec152cc40e21`, A03 `a29f90badedaedd666afb104c4dda1b1ded6299c` |

Gate used: `git diff --check` 0 with no output → the three literal paths staged → staged check 0 → exactly three `M`
→ index-byte audit (A01 `case "gallery"`, 16-name tuple, `bindings?: unknown`, two `usedSources.add` sites; A02
`MAPPED_16`, one `UNIMPLEMENTED (1)`, gallery binding tests; A03 one `UNIMPLEMENTED (1)`, no `(2)`, no stale fifteen-count
phrase, one sixteen-count phrase, one gallery row, no parity marker) → one commit → committed-tree audit exactly three `M` →
`git show HEAD:<ledger>` → clean status → focused and architecture re-run at HEAD → one ordinary non-force push. An
early `git diff --check` reported a new blank line at EOF in A02; it was removed and both checks re-ran clean **before**
the commit, so no amend and no corrective push were needed.

## 3. The sixteenth mapping, the shared binding and the markup difference

`gallery` is appended after `media`, and `composeUnoFoundationSubset(input, bindings?)` is unchanged. The bounded donor
shape is exactly `{type:"gallery", columns:2|3|4, items[2..8]{image:{src,alt}, caption?}}`:

* `columns` is required and must be the integer literal `2`, `3` or `4`; omission, `0`, `1`, `5`, `"2"`, `2.5`, `null`
  and booleans refuse `family:target-refused`, so the donor default is never borrowed.
* `items` must be an array of two to eight entries (`0`, `1` and `9` refuse `family:target-refused`; a non-array
  `family:unsupported-feature`), each exactly `{image, caption?}` with `image` exactly `{src, alt}`.
* Every `src` is the same literal `/assets/…` identity used by `media`, validated by `readMediaSourceIdentity`, and
  looked up in the **same** `MediaBindingContext`. One source repeated across items, sections or the `media` family
  reuses one binding; distinct sources need distinct entries; the unique bound set must equal the set consumed across
  both families, so missing, extra, unused and duplicate authority all refuse.
* Composed output is one node `family-N-gallery` with `module:"media.gallery"` and `props:{columns, items:[{asset, alt,
  caption?}]}` in authored item order, missing captions absent, no `decorative`, heading, lede, route or src. It is
  accepted by the same `readUnoPageDocument(candidate, {reservedHome:false})`, and the 22-module registry is untouched.

**Markup difference, stated plainly.** The donor gallery renders a native `<ul>` of `<li>` figures. Uno's
`media.gallery` renders one `<div class="uno-json-gallery" data-uno-columns="…">` containing
`<figure class="uno-json-media-item">` children, and emits nothing at all unless a server-built `UnoPageMedia` projection
matches the item count. Authored order, alt text and figure/caption meaning survive; the list wrapper does not. No donor
`ul`/`li` parity is claimed, and no gallery HTTP, byte-availability or browser-image proof is asserted.

## 4. Focused tests — 115 cases (101 retained, 14 added)

Retained unchanged in intent: all earlier family, media, markup, refusal, determinism, ledger and zero-getter cases.
Added gallery proof: the sixteen-name frozen tuple and a lone `contactForm` remainder; sixteen-node composition with the
first fifteen node JSON byte-identical; a gallery alone at `family-0-gallery` with two exact owned refs and an absent
second caption; authored order preserved under reversed binding order; one binding serving a repeated source while
distinct sources refuse; one binding reused across a `media` section and a gallery item; unused authority refused; the
2-, 3- and 4-column literals and the 2- and 8-item boundaries accepted with 9 refused; deep freeze of document, node,
props, items, item and nested ref plus caller-input immutability and object/JSON round-trip; and real React markup.

Renderer evidence with a synthetic server projection: exactly one
`<div class="uno-json-gallery" data-uno-columns="3" id="family-0-gallery">`, exactly two
`<figure class="uno-json-media-item">`, two `<img>` with the authored alts and server-resolved `src` values, exactly one
`<figcaption class="uno-json-media-caption">First caption</figcaption>`, no `<ul>`, `<li>` or carousel controls inside the
gallery region and no donor `/assets/` path anywhere. Without a projection, and with a projection whose item count does
not match, no gallery wrapper, figure, image or caption is emitted.

Closed refusals, always whole-document with no `document` key:

| Input | Reason |
| --- | --- |
| missing/non-array `items`; missing `columns`; parent `heading`/`lede`/`surface`/`align`/`position`/`links`/`visibility`/`style`; item `href`/`meta`/`action`/`icon`; image `decorative`/`width`/`height`/`srcset`/`style`; malformed image or item; non-string or Markdown alt/caption; wrong source identity (`https://`, `//`, `../`, `%2e`, query, fragment, SVG, `.PNG`, backslash, device name); absent binder; wrong or duplicate binding; distinct sources with one binding; extra/unused source; binder on an image-free Page | `family:unsupported-feature` |
| `columns` `0`/`1`/`5`/`"2"`/noninteger; item count `0`/`1`/`9`; blank, 321-code-point or script-like alt or caption; invalid owned zone/path/extension/purpose/digest; generated digest missing, uppercase or malformed; >64 KiB candidate | `family:target-refused` |
| getters on `items`, item `image`, `image.src`, `image.alt`, item `caption`, `binding.source`, `binding.owned`, `owned.path` (counter exactly **0**); sparse arrays; valid prose followed by hostile gallery | `family:unsafe-source` |
| `contactForm`, unknown `heading` | `family:unsupported-family` |

## 5. Ledger and rights

A03 now reads **sixteen** composed shapes, **These sixteen mappings**, **sixteen bounded mappings implemented**, **one
donor family entirely unimplemented**, one exact line **UNIMPLEMENTED (1):** `contactForm`, sixteen rows including a
distinct `gallery` row `COMPOSE (explicit owned-gallery binding subset)` with donor and local Uno pins, and a
"Deliberately absent donor design (gallery)" paragraph covering the list-wrapper difference, refused optional
heading/lede/surface, the never-borrowed column default, decorative images and Markdown captions. Zero of seventeen full
parity; no parity marker; no stale fifteen/2 wording remains and the guard fails if it returns.

Donor evidence is read-only Apache-2.0 concept adaptation at the pinned commit; no donor source, JSX, CSS, fonts, images,
trademark, Connect code or package was copied, and no donor `/assets/` path was treated as an Uno-owned asset. The
binding is a migration declaration only: no file read, licence, ownership proof, byte availability, source URL
pass-through or publication authority. The transitive picomatch advisory remains disclosed, neither fixed nor waived.

## 6. Local battery — sequential, green on the final bytes

`pnpm test` **1,033 passed / 30 files** (focused **115**); architecture **46/46**; typecheck 0; `eslint . --max-warnings 0`
0; bootstrap OK; governance test and CLI pass; the seven deployment unit suites pass; readiness **PASS**; security
**ACCEPTED** (zero waivers, zero HIGH/critical); U03 published HTTP **542/0**; U04 JSON slice **464/0**; U04 22-module
runner **565/0** with `FOUR_ZONE_HTTP=4/4`, `NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER`, `BROWSER_MATRIX=16/16`, fixture
teardown and *nothing staged*; `pnpm build` 0; U03 trace `--expect committed` OK; `pnpm test:http` **103/0**;
`verify-u03-http` **91/0** with committed unpublished `/en` still a real 404. Stateful suites ran strictly one at a time
and the declarations were re-hashed after each. Both diff checks exited 0 with no output. Production HTTP/browser proof
for the new gallery adapter is **NOT APPLICABLE**: it is a pure translator and no asset bytes were created.

## 7. Hosted CI at the product head

`6c76a56491d957b2e041cf1f32402b1b7f8ac03e`: `Uno Bootstrap Verify` run `44837578008` — `verify (ubuntu-24.04)`
**success**, `verify (windows-2025)` **success**; `Verify U01 baseline` run `44837578009` — `verify (windows-2025)`
**success**, `verify (ubuntu-24.04)` **success**. No failed, muted or skipped gate.

## 8. Remaining obligations

`contactForm` remains entirely unimplemented and needs its own approved privacy and delivery contract. Still open: the
donor gallery list wrapper, optional heading/lede/surface and Markdown captions, the remaining donor options in the
other fifteen families, real family-Page HTTP/browser proof, the neutral installation/presentation shell, and the
unresolved advisory. **U04 stays OPEN**: no full-parity claim, 23rd module, stage closure, merge, tag, release, manual
deployment or provider/secret change occurred.

The report SHA and its own CI results cannot appear inside this file; both are returned in the handback message.
