# Execution Report — UNO-WO-121 / R01

**Outcome: COMPLETE — the donor Gallery is adopted as a closed opt-in list representation of `media.gallery`.
`PARITY_GALLERY=PASS`, `U04_PARITY=13/17`, `U04_PROXY=55/59`, the **C1** checkpoint earned by its own declared row, all twelve
prior family credits preserved, the native Media/Gallery/Carousel boundaries retained, and every mandatory local and hosted
gate green. U04 remains OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-121 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **6,513 bytes**, SHA-256 `93626a0938e3262ff025b0498c161d72997cbc715e17b95e563f445f21639e6d` — matched the activation exactly; private, ignored, absent from the tree |
| Start SHA | `75c1575ae0b057a6b3fae910b0bfeb9fdaec4bf5` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs` — no edit, no selector added to it: `C1` was already its declared row at `13/17` / `55/59`, and `B2` still reports exactly `11/17` / `53/59` |

## 1. The authorized capability, as delivered

**One closed opt-in representation, not a second module.** `media.gallery` gained exactly one discriminating literal,
`list: true`. With it absent the ordinary native gallery is byte-identical — required `columns`, two to twelve described
items, one plain caption each and the original `<div class="uno-json-gallery">` markup — and `media.carousel` is untouched. With
it present the node is the donor's own Gallery:

`{ list: true, items[1..24], columns?, heading?, level?, lede?, ledeMarkdown?, surface? }`, each item
`{ asset, alt, decorative?, caption?, markdown? }`.

**Adopted surface.** An optional plain `heading` with its closed level (obeying the Page outline exactly as `content.heading`
does), a Markdown-capable `lede`, the whole-section closed `surface`, an optional `columns` of `2`, `3` or `4` — left **absent**
when the donor authors none, so the donor's own three/two/one default applies instead of an invented intent — and one to
twenty-four ordered figures, each with its own descriptive or explicitly decorative image and its own Markdown-capable caption
through the donor's 4,000 code points.

**Boundaries retained.** The item contract is `media.image`'s after `UNO-WO-120 / R03`, verbatim: `asset` and `alt` are both
required native keys, a literal `true` `decorative` flag needs the alternative exactly empty, a described figure needs it
non-empty at the unchanged **320** code points, and one shared well-formedness decision covers the plain and the declared
caption forms. The adapter declares the Markdown form for a donor caption that carries Markdown or exceeds the native bound —
never padding, wrapping or formatting the words to fit. A declared-Markdown caption with no caption, a non-`true` `markdown`
value, a level without a heading, a heading without a level and any member outside a closed set all refuse the whole Page.

**Binder.** The aggregate image-binding ceiling is **32 only for a Page that actually composed a Gallery** (`galleryComposed`
set by that arm alone) and stays **8** for every other Page — proven by a nine-media Page that consumes nine distinct
identities and is still refused. The consumed source set must equal the bound set exactly; duplicate, unused, missing,
unsafe, remote/SVG and invalid owned references refuse as before, and repeated occurrences of one bound identity keep their
authored order.

**Markup.** One `<div class="uno-json-gallery-section">` per section holding only the authored heading, the authored lede and
exactly one ordered `<ul class="uno-json-gallery-list" role="list">` whose every direct `<li class="uno-json-gallery-entry">`
owns one `<figure>` with its own image and caption. No control, no invented heading, no invented text, no duplicated anchor.
Column geometry is token-only: one column below `40rem`, two from `40rem`, and from `64rem` the authored intent or three.

## 2. Authorized ledger (11 modified, 1 added)

**Product**: `src/core/page-document.ts` (the list type and reader, `galleryListItems: 24`), `src/application/compose-uno-foundation-families.ts` (the Gallery arm and the Gallery-scoped ceiling), `src/components/uno-page-sections.tsx` (the list markup and Markdown item captions), `src/app/globals.css` (list layout and the three responsive intents).

**Evidence**: `scripts/verify-u04-22-module-consent.mjs` (the Gallery dimensions, the C1 row, the untouched B2 row), the new `scripts/u04/gallery-evidence.mjs` (donor shapes, six served variants, twelve closed probes, region/list readers, case verdicts, geometry report). Family-fixture restoration and all prior Media/Columns evidence are unchanged and still executed.

**Tests**: `tests/unit/page-document.test.ts` (the native list contract), `tests/unit/uno-foundation-families.test.ts` (composer, markup, the distinguished durable fixture), `tests/unit/uno-page-sections.test.ts` (renderer), `tests/unit/u04-verification-modules.test.mjs` (the evidence module and mutation-sensitive verdicts), `tests/deployment/u04-22-module-consent.test.mjs` (required tokens, three new mutation shapes, the declared-checkpoint row).

**Ledger and report**: `.documents/Architecture/u04-family-parity.md` and this single overwrite of `.documents/Reports/execution-report.md`.

No durable Page, durable asset, declaration, asset policy, serving code, provider, dependency, workflow, closure-oracle, frozen governance file, sibling repository, release or deployment changed. `tests/unit/uno-page-assets.test.ts` needed no edit: the occurrence ledger already reads `props.items` for both gallery forms, so the list plans its own occurrences with the unchanged 512-occurrence guard.

## 3. Acceptance evidence, as executed

**The seven dimensions all executed** (939 checks, 0 failed):

| Dimension | What was observed |
| --- | --- |
| `source` | The real adapter composes the donor Gallery as one list: heading + `level: 2`, the Markdown lede declared, the closed surface, a Markdown caption on item 0, the decorative item normalized to `alt: ""`, **no** `columns` attribute, and no donor `/assets/` identity anywhere in the Page |
| `reader` | 1, 8, 9, 12, 13 and 24 figures accepted; 0 and 25 refused; **24 distinct bound identities plus one separate Media identity** accepted on one Page with the consumed set equal to the bound set; an extra binding, a missing binding, a nine-media Page without a Gallery (the eight ceiling) and repeated identities in authored order all behave exactly as declared; the ordinary grid's 2–12 and the carousel's 2–8 still refuse 1 and 13 / 9; an omitted list `alt` refuses in the object **and** raw-JSON forms; plain captions 320/321 and declared 321/4,000/4,001 (formatted and unformatted) behave as `media`; lone surrogates refuse in both forms; `galleryItems`, `carouselItems`, `galleryListItems`, the 320 alt, the 320/4,000 captions and the 512 occurrences are each exactly their documented value |
| `renderer` | Every served clause measured by name: the wrapper and its `data-uno-surface="muted"`, one list, two items and two images, the `<h2>` heading, the lede with its `<strong>`, the caption with its `<em>` and its safe link, the decorative empty alternative, **no** authored column attribute, the bare list with no heading, no lede and no surface, the explicit `2` and `4` intents served as their own literals, 24 items and 24 images in the ceiling list, no control in either region, and no donor identity in the page |
| `http` | All **24** distinct occurrence locators return `200 image/png` with bytes equal to the Page's own 64×64 plate and intrinsic size 64×64 |
| `browser` | Six real Chromium cases — 390, 768 and 1280 in light/normal motion and in dark/reduced motion — each measuring all six variants: **1** column at 390, **2** at 768, and `3 / 2 / 3 / 4 / 3 / 3` at 1280 (the donor default where no intent is authored), item and image counts `2/3/3/4/1/24`, every image loaded at 64px, distinct ascending owned locators, the caption reached in **12** real Tab presses with focus able to leave and no navigation, **0** foreign requests and **0** console errors |
| `refusal` | Twelve closed probes — empty list, twenty-five figures, absent description without the flag, decorative contradiction, unbound source, item destination, columns outside the set, surface outside the set, an unadopted donor member, an embedded Markdown image, a caption past 4,000, a remote source — each refusing the **whole** Page with its own closed reason and no document |
| `rights` | No donor identity, no remote source, no provider, no locator outside this Page's own owned route, and no foreign request during the served pass |

**Restoration**: the temporary swap is restored byte-exactly (`sha256` equal, both after the renderer/HTTP pass and after the
browser pass) and a fresh request serves the committed Page with none of the six variant anchors.

**Prior credits, the unchanged rows and P6**: `A2_LOCAL_…=63/63`, `U04_MODULE_IDS=22/22`, `U04_BROWSER_MATRIX=16/16`, four of
four owned zones, Media's own seven dimensions (R03 boundary included) and Columns' restoration all still PASS; the declared
**B2** row is still earned at exactly `11/17` / `53/59`; **C1** is earned at exactly `13/17` / `55/59`; and the same evidence
evaluated **without** a checkpoint selector reports the identical `13/17` / `55/59`, so the selector adds no credit of its own.
The concurrent multi-Facet/Site/Page/locale P6 gate passes 179 checks with both declaration phases byte-exact.


## 4. Mutation-sensitive evidence

`tests/deployment/u04-22-module-consent.test.mjs` (346 checks) pins every Gallery label and three load-bearing shapes, so a
deleted proof cannot leave a passing label behind: the **Gallery-scoped ceiling proof** (`const noGalleryCeiling = composePage(`)
must be present and neutering it fails the audit; the **exact-consumption proof** (`bindingsFor(GALLERY_SOURCE)`) likewise; and
the **C1 credit** (`closureC1.labels.includes("PARITY_GALLERY=PASS")`) must be asserted, with its `PENDING` mutation failing.
The declared-checkpoint row is now exactly `["A1","A2","B1","B2","C1"]` — `C2` and `D` still may not appear.
`tests/unit/u04-verification-modules.test.mjs` executes the evidence module directly and shows the case verdict refusing a
wrong track count, a lost item or image, a broken occurrence order, an unowned locator, an injected control, any overflow, a
wrong surface paint, a lost decorative empty alternative and an invented heading — each naming its own clause — and shows the
region reader stopping at its own wrapper rather than swallowing the page after it.

## 5. Local verification (sequential, final head)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,407 / 1,407**, 35 files |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **346 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **939 passed / 0 failed** — `PARITY_GALLERY=PASS`, `PARITY_MEDIA=PASS`, `U04_PARITY=13/17`, `U04_PROXY=55/59`, `22/22`, `63/63`, `16/16`, twelve closed Gallery probes, B2 `11/17` / `53/59`, C1 `13/17` / `55/59` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — both P6 declaration phases byte-exact |

## 6. Hosted verification at the exact product head

The product head is `2c41f04bc1d181eed95760494607ba6014299176` (the commit that carries every product, evidence and test change);
the three commits after it change only the report, one ledger-pinned unit test and one published-Pages assertion, and the head
that ran CI green is `fe3f942868380c91c32b4f751ac8e86f1cb205b0`, whose tree is the product head plus those three verifications.
Both workflows ran at that head on both operating systems:

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45654952437](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45654952437) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 38/38 steps each, including governance bytes, **Unit tests**, the A1 slice, the U04 JSON-slice contract, the production build, bounded output tracing, the home and locale-refusal HTTP passes, fixture fault injection, the **published-Pages HTTP/Chromium gate**, the **multi-Site P6** contract and run, the **22-module hermetic guard**, the **22-module production HTTP/Chromium consent run**, and deployment readiness |
| `Uno Bootstrap Verify` | [45654952589](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45654952589) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 10/10 steps each |

Two earlier hosted runs at intermediate heads failed and are recorded rather than hidden, because both named a real legacy
expectation the order itself anticipated: the ledger-pinned unit test still asserted the pre-adoption wording (`twelve of
seventeen…`, the old Gallery disposition, `five still bounded`), and the published-Pages gate still compared the committed
durable Page to the recomposition byte-for-byte. Both were corrected — the tests now follow the ledger, and the gate now
distinguishes the committed ordinary grid from the newly composed list instead of conflating them — and the final head is green
on both hosts.

## 6a. One evidence-ledger adjustment beyond the literal file list

`scripts/verify-u03-published-http.mjs` needed the durable-fixture distinction described in §1 and §7.6: without it the
published-Pages gate could only pass by rewriting the committed durable Page, which the order forbids. The change adds no claim
and removes none — every other appended section is still compared byte-for-byte against the composer's own output, and the
Gallery is compared by shape (composed list, committed grid).

## 7. Risks, adaptations and limits

1. **Opt-in, not a widening.** The list is a separate closed shape behind `list: true`. A document that does not opt in keeps
   the original grid byte-for-byte, and the reader refuses any other `list` value (`false`, `1`, `"true"`, `null`).
2. **Two ceilings, one rule.** 32 bindings only for a Page that composed a Gallery, 8 for every other Page, and the consumed set
   must equal the bound set in both cases. The wider ceiling is never granted by the mere presence of a binding list.
3. **Alt bound.** 320 native code points stand (the donor allows 400); a longer donor description refuses and no bound moved.
   The native `alt` remains a required key in this representation, exactly as `media` after R03.
4. **Caption scope.** The shared well-formedness decision covers the native `media.image` caption and this Gallery's captions,
   in both forms; gallery/carousel items of the ordinary native form and video captions keep exactly the acceptance they had.
5. **Column default is the stylesheet's, not the reader's.** An un-authored intent stays absent in the document and the
   token-only media queries apply the donor's three/two/one default; the executed geometry is what is measured, not the
   attribute.
6. **Durable fixture distinguished.** The committed durable Components Page is **not** rewritten: it keeps its ordinary grid,
   and the test now proves every other appended section is still byte-identical while only the newly composed Gallery differs.
7. **Checkpoints.** B2 stays earned and unchanged; C1 is earned by its own declared row; `C2` and `D` are not claimed, and no
   stage closure, release or deployment follows.

## 8. Disposition

Gallery is the thirteenth parity-evidenced family, adopted as the donor declares it — heading, Markdown lede, whole-section
surface, 1–24 ordered figures with their own alternatives and Markdown captions, and the donor's responsive column default —
while every native boundary around it (the ordinary grid, the carousel, the required `alt`, the 320/4,000 caption bounds, the
eight-binding ceiling and the 512-occurrence guard) stays exactly where it was. The C1 row is earned by executed evidence at
`13/17` / `55/59`. Stopping for independent Architect review.

