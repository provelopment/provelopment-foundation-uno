# Execution Report — UNO-WO-121 / R03

**Outcome: COMPLETE. The three outstanding evidence corrections are closed in the served transaction, `PARITY_GALLERY=PASS`,
`U04_PARITY=13/17`, `U04_PROXY=55/59`, the unchanged **C1** checkpoint fully evidenced, all twelve prior credits preserved, and
every mandatory local and exact-head hosted gate green. U04 remains OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-121 / R03`, `FINAL — EXECUTE` — **supersedes R02** |
| ACTIVE | **4,925 bytes**, SHA-256 `2b7ae9bd6731b73b49563ec155a3f4c913ca8c4cd1cd8623885473dcfe0c6d42` — matched the activation exactly; private, ignored, untracked |
| Start SHA | `5e7028528cbbb93161dbc3a4453a39692c626461` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Scope | Evidence only. No product source, stylesheet, published-Pages comparison, durable Page, asset policy, dependency, workflow, oracle or frozen governance change — the diff is exactly the six ledger files |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs` — C1 remains its declared row at `13/17` / `55/59`; B2 still exactly `11/17` / `53/59` |

## 1. What R03 corrected, and why each gap was real

**(a) Geometry accepted equal zero widths.** The R02 verdict compared each cell only against its neighbours, and the reader
counted tracks without ever reading them, so a list of three zero-width columns and a list of three real columns were
indistinguishable. The reading now carries the **resolved track lengths** parsed from `grid-template-columns`, and the verdict
requires: the authored count of tracks; every track finite and strictly positive; every track equal to the first within a
rounding pixel; every cell positive; and every cell equal to **its own** track (`item % columns`) within a rounding pixel. Row
count, row order, positive geometry, viewport/media agreement, no overflow and the six unique cases are retained.

**(b) An authored `plain` was only required to *equal* the absent case.** Two identically broken surfaces could pass. Both inert
cases must now compute **nothing at all** — transparent background, no border width, `border-style: none`, zero padding and zero
radius — asserted absolutely. The two emphases are asserted against the **live tokens** (surface and background resolved in the
page), the bordered border's **colour, style (`solid`) and width (`1px`)** against the border token, and the emphasis padding
(`1rem 1.25rem`, i.e. `16px 20px 16px 20px` at the fixture's 16px root) and radius (`--uno-radius-lg`, resolved through its own
property so a `rem` token still compares equal) against the shipped rule. The three backgrounds must be mutually distinct and the
bordered border must differ from the muted one. The authored surface, or its absence, is now asserted for **every** variant. No
CSS or token was touched.

**(c) Captions were checked for presence, not for meaning.** The fixture now carries a **second, distinct** caption on a
different item of a different section, so a caption swapped between figures or sections changes the text that must appear in that
exact place. The verdict requires the **exact authored rendered caption text** at every position (`An owned caption with the
notes` in the rich section, `A second plate's own caption.` in the two-column section, and a real absence of the element
elsewhere), each caption's **own list item** as its owner (measured from the caption's `closest("li")`), exactly one **direct**
figure and one **direct** image per item, the exact alternative per item including the decorative empty one, the link's exact
destination and the renderer's own `rel="noopener noreferrer"`, and a keyboard traversal that reaches the link, departs in
exactly one further Tab and leaves the URL unchanged.

**(d) The browser swap never proved a fresh response.** It restored in `finally` and checked the digest, while the HTTP swap also
asserted the served result. After the browser swap's `finally`, the gate now requests the Page again and requires the committed
Page's own Gallery list (`family-5-gallery`, two items) and none of the six temporary anchors. The abandoned-write probe and the
temporary asset cleanup are unchanged.

**(e) A misleading log, corrected.** The run log printed `variant.columns`, which does not exist on a reading, so the authored
intent silently serialised as `null` and looked like "no intent authored". It now prints the authored intent **and** the measured
track widths, plus every served caption. The R02 report's per-plate occurrence split (`32`/`5`) was also wrong and is corrected
here to the measured `35` of the 64×64 plate and `2` of the 32×48 plate.

## 2. Executed evidence, as observed

**The Gallery row on this run: 943 checks, 0 failed.** These are the values the run printed, not restatements.

| Dimension | Observed |
| --- | --- |
| `source` | One list per section; heading and Markdown lede declared; `muted` surface; the decorative item normalized to `alt: ""`; no invented column attribute; no donor identity in the Page |
| `reader` | 1/8/9/12/13/24 figures accepted and 0/25 refused; 24 distinct identities plus a separate Media identity with the consumed set equal to the bound set; extra, missing and repeated bindings behave as declared; **8 accepted / 9 refused** without a Gallery and **32 accepted / 33 refused** with one; a 528-occurrence Page refuses as `assets:too-many` while 504 plan; the ordinary grid 2–12, the carousel 2–8, the required `alt` in both forms, the 320/321 and 321/4,000/4,001 caption bounds in both forms, lone-surrogate refusal and a valid supplementary pair all hold |
| `renderer` | Wrapper and `data-uno-surface="muted"`; one list; two items and two images; the `<h2>`; the lede `<strong>`; the caption `<em>` and its safe link; the decorative empty alternative; no authored intent; authored `plain` and `bordered` wrappers; the absent case with **no** surface attribute; the bare list with no heading/lede/surface; explicit `2` and `4`; 24 items and 24 images; no control; no donor identity |
| `http` | The planner's ledger names 37 Gallery occurrences; each serves `200 image/png` with its own binding's bytes and intrinsic size — **35** on the 64×64 plate, **2** on the 32×48 plate; every served `src` equals its planned locator, in order |
| `browser` | Six cases, each verified against its own key/width/scheme/motion/both media queries. At 1280 the resolved tracks were `162.656/162.672/162.672` (3), `270/270` (2), `162×3` (3), `129×4` (4), `176×3` (3), `176×3` (3) — the authored `2` and `4` beside the donor default of three. Rows `1/2/1/1/1/8`, geometry true. Sizes per list `64x64`, and `64x64`+`32x48` in the ceiling list. Surfaces: `muted rgb(245,247,251) 0px 20px 16px 20px`, `plain rgba(0,0,0,0) 0px 0px 0px 0px`, `bordered rgb(255,255,255) 1px 20px 16px 20px`, and both absent cases identical to `plain`. Captions `["An owned caption with the notes", null]` in the rich section and `[null, "A second plate's own caption.", null]` in the two-column section, each in its own figure. Keyboard: the link reached in **12** Tab presses, departed in one more, URL unchanged, **0** errors, **0** foreign requests |
| `refusal` | All **twelve** closed probes refuse the whole Page with their own reason and no document |
| `rights` | No donor identity, no remote source, no provider, no locator outside this Page's own owned route, no foreign request |
| `browser restore` | After the swap's `finally`: bytes restored **and** a fresh response serving the committed Page's own Gallery list, with none of the six temporary anchors |

**Prior credits, unchanged rows and P6.** `A2_LOCAL_…=63/63`, `U04_MODULE_IDS=22/22`, `U04_ASSET_ZONES=4/4`,
`U04_BROWSER_MATRIX=16/16`, Media's seven dimensions (R03 boundary included), Columns and the twelve-family interim are all PASS;
the declared **B2** row is still earned at exactly `11/17` / `53/59`; **C1** is earned at exactly `13/17` / `55/59`; the same
evidence evaluated **without** a checkpoint selector reports the identical `13/17` / `55/59`; and the concurrent
multi-Facet/Site/Page/locale P6 gate passes 179 checks with both declaration phases byte-exact.

## 3. Local verification (sequential, shared `.next`)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,410 / 1,410**, 35 files |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `pnpm test:bootstrap` / `pnpm test:architecture` | **21 / 0** / **47 / 0** |
| `node --test tests/deployment` | **346 / 0** — including the new R03 tokens and their neutering shapes |
| `pnpm build` | exit 0 — `Compiled successfully` |
| `node scripts/verify-u01-http.mjs` | exit 0 |
| `node scripts/verify-u03-http.mjs` | exit 0 |
| `node scripts/verify-u03-published-http.mjs` | **1,000 / 0** |
| `node scripts/verify-u03-browser.mjs` / `verify-u03-trace.mjs` | exit 0 / exit 0 |
| `node scripts/verify-u03-multisite-http.mjs` | **179 / 0** — both P6 phases byte-exact |
| `node scripts/verify-u04-json-slice.mjs` | **477 / 0** |
| `node scripts/verify-vercel-readiness.mjs` | exit 0 |
| `node scripts/verify-u04-22-module-consent.mjs` | **943 / 0** — `PARITY_GALLERY=PASS`, `PARITY_MEDIA=PASS`, `13/17`, `55/59`, `22/22`, `63/63`, `4/4`, `16/16`, B2 `11/17` / `53/59` |


## 4. Hosted verification at the exact head

The head carrying every evidence, test and ledger change of this order is
`01f4b06524065984adaadf1fbb8538150dbcbe51`. Both workflows ran there, on both operating systems, and every step passed:

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45744048226](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45744048226) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — **38/38 steps each, 0 failures**, including the governance byte check, **Unit tests**, the production build, bounded output tracing, the home and locale-refusal HTTP passes, fixture fault injection, the **published-Pages HTTP/Chromium gate**, the **multi-Site P6** contract and run, the **22-module hermetic guard**, the **22-module production HTTP/Chromium consent run** and deployment readiness |
| `Uno Bootstrap Verify` | [45744048243](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45744048243) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — **10/10 steps each, 0 failures** |

The two earlier heads of this order are part of the record: `5e70285` is the R02 report head this order started from, and the
evidence commit `01f4b06` is the one whose steps are listed above. This report is committed on top of `01f4b06`; the same two
workflows run again there, and a failure would supersede this record rather than be explained away.


## 5. Risks, adaptations and limits

1. **Two plates, one rule.** The fixture converges twenty-four identities onto two owned plates only so occurrences can be told
   apart by bytes and size; the product never chooses a path, and no planner, serving or asset policy changed.
2. **320 native alt code points** stand (the donor allows 400); a longer donor description refuses and no bound moved.
3. **The column default lives in the stylesheet.** An unauthored intent stays absent in the document; the executed tracks, not the
   attribute, are what the verdict measures.
4. **The committed durable Page is not rewritten.** It keeps its ordinary grid, and the R02 semantic comparison still proves the
   composed list agrees with it on anchor, columns, order, assets, alternatives and captions while inventing nothing.
5. **One rounding tolerance.** Track and cell equality allow a single pixel, which is the largest difference Chromium's own
   sub-pixel track resolution produced on this run (`162.656` against `162.672`); it is not a general tolerance for layout drift.
6. **Checkpoints.** B2 stays earned and unchanged; C1 is earned by its own declared row; `C2` and `D` are not claimed, and no Cards
   work, stage closure, release or deployment follows.

## 6. Disposition

The three gaps the order named are closed in the real served transaction and in its reusable verdict, not in prose: geometry is
now positive, equal and bound to each cell's own track; the inert surfaces are required to compute nothing while the emphases are
checked against their live tokens including the bordered border; captions are checked for exact authored text, figure ownership
and a real absence, with two distinct captions making a swap visible; and the browser swap now proves a fresh committed response,
as the HTTP swap does. The misleading intent log is fixed and the earlier per-plate figure is corrected to the measured `35`/`2`.
Gallery remains the thirteenth parity-evidenced family at `13/17` / `55/59`, every native boundary around it is untouched, and the
delivered implementation and resolved authorization boundary are preserved. Stopping for independent Architect review.

