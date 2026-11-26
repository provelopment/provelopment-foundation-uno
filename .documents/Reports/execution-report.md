# Execution Report — UNO-WO-121 / R02

**Outcome: COMPLETE under fresh Owner authority. The R01 STOP is resolved, not retrospectively blessed. `PARITY_GALLERY=PASS`,
`U04_PARITY=13/17`, `U04_PROXY=55/59`, the unchanged **C1** checkpoint fully evidenced, all twelve prior credits retained, and
every mandatory local and exact-head hosted gate green. U04 remains OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-121 / R02`, `FINAL — EXECUTE` — **supersedes R01** |
| ACTIVE | **5,717 bytes**, SHA-256 `c98216fc116bc34322edd9f82407ea59ea673a68cdd94c7e262ba9ce0efbd5e8` — matched the activation exactly; private, ignored, untracked |
| Start SHA | `0c6a6131bbc398ee6ef6d99f6c1891aeb8ddc84c` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs` — C1 was already its declared row at `13/17` / `55/59`; B2 still reports exactly `11/17` / `53/59` |

## 1. The R01 breach, recorded plainly

R01 changed `scripts/verify-u03-published-http.mjs` so the hosted published-Pages gate would stop comparing the committed
durable Page to the recomposition byte-for-byte. That file was **not** in the R01 ledger and the R01 order did **not** list it;
the R01 report disclosed the change, but disclosure is not authority. **R01 was therefore out of ledger on that one file.**

R02 supplies **fresh, prospective** authority to retain and correct it. Nothing here treats R01 as authorized, and no other
out-of-ledger change exists: the R02 diff touches only the files R02 names.

Two further R01 weaknesses the order identified were real and are fixed here: the published-Pages comparison exempted the whole
Gallery section from equality, and the Gallery fixture restored its temporary Page **after** the `try` block instead of inside
`finally`, so an exception could have bypassed restoration. Both are now strictly stronger.

## 2. What was corrected and strengthened

**(a) The durable comparison is semantic, not exempt.** `durableFamilySourcePhase` still compares every unaffected appended
section byte-for-byte, and now compares the Gallery itself on the things that must not change: equal anchor (id and module),
equal authored `columns`, equal item count and **order**, and for every item the exact owned `asset`, the exact alternative and
the exact caption — including whether a caption exists at all. It also refuses an invented field: the committed grid may carry
only `columns`/`items`, the composed list adds only the `list` marker, and no item may carry a key beyond
`asset`/`alt`/`caption`. The **only** permitted difference is therefore the representation itself. A changed asset,
alternative, caption, order or a missing item fails the gate, and eight negative mutations are pinned in
`tests/deployment/u04-22-module-consent.test.mjs` — five of them inside the dedicated durable-label guard that reads this very
file, and three inside the runner audit (binding, restoration and the absent-surface clause).

**(b) All six browser cases now measure all three surfaces.** The fixture authors `plain` on the two-column variant and
`bordered` on the three-column variant beside the existing `muted` rich section and the two absent cases, so the whole closed
surface set is measured. Each of the six executed cases (390 / 768 / 1280 × light-normal / dark-reduced) must describe exactly
its own key, viewport, colour scheme, motion preference and **both real media queries**; the verdict then requires equal track
widths, real row geometry (each row's cells share a top, rows descend, authored order preserved left to right), the authored
intent beside the resolved track count, per-item loaded intrinsic dimensions, exact per-item alternative and caption
ownership, the decorative empty alternative, distinct ascending same-Page locators, one figure per list item, no control, no
overflow, no console error, no foreign request, and a real keyboard traversal that reaches the caption link and can leave it
without navigating. The surface proof is measured against the **live tokens**, resolved inside the page: an authored `plain`
computes exactly like the section that authors nothing (transparent, `0px` border, `0px` padding, `0px` radius), `muted` paints
`--uno-surface` with the emphasis padding and radius and no border, `bordered` paints `--uno-background` with a real `1px`
border and the same padding and radius, and the three backgrounds are mutually distinct. R01's hard-coded colour constant is
gone.

**(c) The occurrence proof is planned, bound and byte-exact.** The gate plans the composed Page with the real
`planUnoPageAssets` and, for all six variants, checks that the planner's ordered ledger names each occurrence's **own authored
binding**, that the served `src` of every item is exactly that occurrence's locator in authored order, and that each
occurrence's bytes, MIME type and intrinsic size equal the plate its own binding names. The twenty-four figure list is bound
across **two** owned plates — sources 22 and 23 to a second, deliberately different 32×48 PNG — so two distinguishable byte sets
are proven, and all 37 Gallery occurrences are fetched and compared. The aggregate boundary is explicit: **8** identities
without a Gallery compose and **9** refuse; **32** compose with a Gallery and **33** refuse; the unchanged **512**-occurrence
guard refuses twenty-two 24-item Galleries (528 occurrences) while twenty-one (504) plan. The native grid (2–12), the carousel
(2–8), the required `alt` in object and raw-JSON form, the 320/321 plain and 321/4,000/4,001 declared caption bounds with and
without formatting, lone-surrogate refusal in both forms and a valid supplementary pair counting once are all still asserted.

**(d) Restoration is inside `finally`, and the failure path is proven.** Both the renderer/HTTP swap and the browser swap
restore in `finally`, and `restoredInFinally` records that the bytes actually came back. A dedicated probe writes an
intentionally foreign Page, throws, restores in its own `finally`, and proves the digest is back **before** any other assertion
runs — so an abandoned write cannot leave the fixture behind. The fresh response after the served swap must carry the committed
Page's own composed Gallery list and none of the six temporary anchors. Media's and Columns' restorations are untouched and
still execute. The Gallery stylesheet comment was corrected to describe what the media queries actually do; no rule changed.


## 3. Executed evidence, as observed

**The seven Gallery dimensions, 942 checks, 0 failed.** Every clause below is a measurement from this run, not a restatement.

| Dimension | Observed |
| --- | --- |
| `source` | The adapter composes the donor Gallery as one list: heading at level 2, the Markdown lede declared, `muted` surface, a Markdown caption, the decorative item normalized to `alt: ""`, no invented column attribute, no donor identity in the Page |
| `reader` | 1/8/9/12/13/24 figures accepted and 0/25 refused; 24 distinct identities plus a separate Media identity on one Page with the consumed set equal to the bound set; an extra binding, a missing binding and repeated identities in authored order behave exactly as declared; **8 accepted / 9 refused without a Gallery** and **32 accepted / 33 refused with one**; a 528-occurrence Page is refused as `assets:too-many` while 504 plan; the ordinary grid's 2–12, the carousel's 2–8, the required `alt` (object and raw JSON), the 320/321 and 321/4,000/4,001 caption bounds in both forms and lone-surrogate refusal all hold; every shared bound is its documented value |
| `renderer` | Each clause named and measured: the wrapper and its `data-uno-surface="muted"`, one list, two items and two images, the `<h2>`, the lede with its `<strong>`, the caption with its `<em>` and its safe link, the decorative empty alternative, no authored intent, the authored `plain` and `bordered` wrappers, the absent case with **no** surface attribute at all, the bare list with no heading/lede/surface, the explicit `2` and `4` intents, 24 items and 24 images, no control, no donor identity |
| `http` | The planner's ledger names 37 Gallery occurrences; every one fetches `200 image/png` with the bytes and intrinsic size of **its own** bound plate (32 occurrences of the 64×64 plate, 5 of the 32×48 plate), and every served `src` equals its planned locator in order |
| `browser` | Six cases, each verified against its own key/width/scheme/motion/media-queries. Columns: **1** at 390, **2** at 768, `3/2/3/4/3/3` at 1280. Rows: `1/2/1/1/1/8` at 1280, geometry true. Sizes: the ceiling list loads **both** `64x64` and `32x48`. Surfaces: `muted rgb(245,247,251) 0px 20px 16px 20px`, `plain rgba(0,0,0,0) 0px 0px 0px 0px`, `bordered rgb(255,255,255) 1px 20px 16px 20px`, absent identical to `plain`. Keyboard: the caption link reached in **12** Tab presses, focus left it, no navigation, **0** errors, **0** foreign requests |
| `refusal` | All **twelve** closed probes refuse the whole Page with their own reason and no document |
| `rights` | No donor identity, no remote source, no provider, no locator outside this Page's own owned route, no foreign request |

**Restoration.** The abandoned-write probe restored the exact bytes; the served swap restored the exact bytes inside `finally`;
a fresh request answered with the committed Page's own Gallery list (`family-5-gallery`, two items) and none of the six temporary
anchors. Media's and Columns' restorations still pass.

**Prior credits, unchanged rows and P6.** `A2_LOCAL_…=63/63`, `U04_MODULE_IDS=22/22`, `U04_ASSET_ZONES=4/4`,
`U04_BROWSER_MATRIX=16/16`, Media's seven dimensions (R03 boundary included) and the twelve-family interim are all PASS; the
declared **B2** row is still earned at exactly `11/17` / `53/59`; **C1** is earned at exactly `13/17` / `55/59`; the same evidence
evaluated **without** a checkpoint selector reports the identical `13/17` / `55/59`; and the concurrent
multi-Facet/Site/Page/locale P6 gate passes 179 checks with both declaration phases byte-exact.

## 4. Local verification (sequential, shared `.next`)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,410 / 1,410**, 35 files |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `pnpm test:bootstrap` / `pnpm test:architecture` | **21 / 0** / **47 / 0** |
| `node --test tests/deployment` | **346 / 0** |
| `pnpm build` | exit 0 — `Compiled successfully` |
| `node scripts/verify-u01-http.mjs` | **105 / 0** |
| `node scripts/verify-u03-http.mjs` | **135 / 0** |
| `node scripts/verify-u03-published-http.mjs` | **1,000 / 0** — including the semantic durable-Gallery comparison |
| `node scripts/verify-u03-browser.mjs` / `verify-u03-trace.mjs` | exit 0 / exit 0 |
| `node scripts/verify-u03-multisite-http.mjs` | **179 / 0** — both P6 phases byte-exact |
| `node scripts/verify-u04-json-slice.mjs` | **477 / 0** |
| `node scripts/verify-vercel-readiness.mjs` | **PASS** — 132 checks, `VERCEL_NOT_DEPLOYED_BY_AGENT` |
| `node scripts/verify-u04-22-module-consent.mjs` | **942 / 0** — `PARITY_GALLERY=PASS`, `PARITY_MEDIA=PASS`, `13/17`, `55/59`, `22/22`, `63/63`, `4/4`, `16/16`, B2 `11/17` / `53/59` |


## 5. Hosted verification at the exact head

The head that carries every product, evidence, test and ledger change of this order is
`6b2528c127c74841297e664652b8f2c37548b746`. Both workflows ran there, on both operating systems, and every step passed:

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45736831689](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45736831689) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — **38/38 steps each, 0 failures**, including the governance byte check, **Unit tests**, the production build, bounded output tracing, the home and locale-refusal HTTP passes, fixture fault injection, the **published-Pages HTTP/Chromium gate** (with the semantic durable comparison), the **multi-Site P6** contract and run, the **22-module hermetic guard**, the **22-module production HTTP/Chromium consent run** and deployment readiness |
| `Uno Bootstrap Verify` | [45736831629](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45736831629) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — **10/10 steps each, 0 failures** |

The earlier hosted failures at the R01 heads are part of this record: the pre-R02 gate failed on a ledger-pinned unit assertion
and on the byte-for-byte durable comparison, and R02's corrections are what the green runs above execute. No run was re-used and
no step was skipped. This report is committed on top of that head; the same two workflows run again on the report commit, and any
failure there would supersede this record rather than be explained away.


## 6. Risks, adaptations and limits

1. **Two plates, one rule.** The Gallery fixture converges its twenty-four identities onto two owned plates purely so the
   evidence can distinguish occurrences by bytes and size. A real migration may converge any number onto any declared refs; the
   product never chooses a path, and the planner, serving policy and asset policy are untouched.
2. **320 native alt code points** stand (the donor allows 400); a longer donor description refuses and no bound moved.
3. **The column default lives in the stylesheet.** An unauthored intent stays absent in the document and the media queries apply
   three/two/one; the executed geometry, not the attribute, is what the verdict measures.
4. **The committed durable Page is not rewritten.** It keeps its ordinary grid, and the gate proves the composed list agrees with
   it on anchor, columns, order, assets, alternatives and captions while inventing nothing.
5. **Checkpoints.** B2 stays earned and unchanged; C1 is earned by its own declared row; `C2` and `D` are not claimed, and no
   stage closure, release or deployment follows.

## 7. Disposition

The R01 STOP is resolved: the published-Pages correction is now authorized on its merits and is stronger than what it replaced,
the Gallery's browser evidence covers all six cases and the whole closed surface against live tokens, the occurrence proof is
planned, bound and byte-exact across two owned plates, and restoration is inside `finally` with the failure path proven. Gallery
remains the thirteenth parity-evidenced family at `13/17` / `55/59`; every native boundary around it — the ordinary grid, the
carousel, the required `alt`, the 320/4,000 caption bounds, the 8/32 binding ceilings and the 512-occurrence guard — stays
exactly where it was. Stopping for independent Architect review.

