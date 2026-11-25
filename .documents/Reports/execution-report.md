# Execution Report — UNO-WO-120 / R01

**Outcome: COMPLETE — `media` is credited as the twelfth parity-evidenced family (`PARITY_MEDIA=PASS`, `U04_PARITY=12/17`,
`U04_PROXY=54/59`) while the declared **B2** row stays exactly `11/17` / `53/59`. All eleven prior family credits are retained,
the owned-asset and concurrent-publication regressions are unchanged, and every mandatory local and hosted gate is green. U04 and
C1 remain OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-120 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **5,097 bytes**, SHA-256 `85f42032c2ae0b50948dc3ff1d1a16b9e1c9a35f98edd5cb9d53f19941993e80` — matched the activation exactly; private, ignored, absent from the tree |
| Start SHA | `20e364185bbe2f1523f2a24a35097d1f893c1cea` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Product head | `fdc52ef51b105354182dc08b45d0d35c2945c180` (`20e3641..fdc52ef`, two non-force pushes: `72934c3` product, `fdc52ef` ledger/test correction) |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs` — the checkpoint-free row is now **12/17** / **54/59**, and the selector `B2` row still evaluates to exactly **11/17** / **53/59** |

## 1. What was adopted, through existing modules only

The donor's Media section authors an optional plain `heading`, a Markdown-capable `lede`, a figure with a Markdown-capable
`caption` and an optional `decorative` boolean, plus a closed `position` and `surface`. Uno now expresses all of that through the
already-registered `media.image` module and the section stack — **no new module id, no new schema variant, no new asset
authority**:

| Donor member | Uno expression |
| --- | --- |
| optional `heading` | `content.heading {level: 2}` inside the family stack (nothing invented) |
| Markdown `lede` | `content.prose {text, markdown: true}`, validated by the one shared Markdown reader |
| Markdown `caption` (≤ 4,000) | `media.image {caption, markdown: true}` — a **closed literal**; a caption without Markdown keeps the plain form and its native 320-point bound |
| `decorative` boolean | `media.image {alt: "", decorative: true}` — only the literal `true`, with an exactly empty alt |
| closed `position` | `layout.stack {position: "start" \| "end"}` — a new closed optional member; `start` puts the figure first, `end` the text first, and the stylesheet makes such a stack **two equal tracks** above `64rem` and one column, in the same authored order, below it |
| closed `surface` | `layout.stack {surface}` — covers the heading, the lede **and** the figure |
| bare section | still exactly one `media.image` at the family anchor, byte-identical to the previously accepted output |

Recorded, not concealed: **Uno keeps its 320-code-point alt bound where the donor allows 400** (a longer description refuses
rather than widening any other media contract); the `alt` key stays required, so the decorative semantic is always explicit and
never inferred from an empty string; a `position` with no authored text refuses instead of inventing one; remote and SVG sources
stay outside the subset, so the donor identity is never a rendered `src`; and `gallery`, `carousel` and `video` are untouched.

## 2. Authorized ledger (13 modified, 1 new; no other path touched)

`src/core/page-document.ts` (stack `position`, `media.image` Markdown caption, the donor's own caption limit) ·
`src/application/compose-uno-foundation-families.ts` (the Media case) · `src/components/uno-page-sections.tsx` (position
attribute, Markdown caption inside the owning `figcaption`) · `src/app/globals.css` (the two-track rule, the caption body) ·
`scripts/u04/family-fixture.mjs` (the rich Media source and its three variants) · `scripts/u04/media-evidence.mjs` (**new**) ·
`scripts/verify-u04-22-module-consent.mjs` · `tests/unit/page-document.test.ts` · `tests/unit/uno-foundation-families.test.ts` ·
`tests/unit/uno-page-sections.test.ts` · `tests/unit/u04-verification-modules.test.mjs` ·
`tests/deployment/u04-22-module-consent.test.mjs` · `.documents/Architecture/u04-family-parity.md` ·
`.documents/Reports/execution-report.md` (this single overwrite).

Frozen governance, the closure oracle, workflows, dependencies, durable Pages and declarations, publication authority, other
repositories and providers were read-only and are unchanged.

## 3. The seven dimensions, as executed

| Dimension | Evidence (all executed this run) |
| --- | --- |
| `source` | the real adapter composes the fixture's Media section as `layout.stack {position: "start", surface: "muted"}` with the figure first and one owned text stack; the `end` variant reverses the two children and keeps a plain caption plain; the decorative variant composes `alt: ""` with `decorative: true`; the bare section composes one `media.image` at the anchor, byte-identical to the previously accepted output |
| `reader` | the composed Page round-trips; the donor's 4,000 bound holds for the **Markdown** caption (4,000 accepted, 4,001 refused) while the plain caption keeps 320 (320 accepted, 321 refused); `markdown` without a caption, an unknown `position`/`surface` and a decorative image with a description all refuse |
| `renderer` | the served region is one positioned, surfaced stack whose figure owns its image **and** its `figcaption`; the caption renders from the shared AST (`<strong class="uno-family-md-strong">owned</strong>`, `<a class="uno-family-md-link" href="https://example.org/media-notes">`), never raw syntax; the decorative figure is `<img alt="">` with no `aria-label` and no `title` |
| `http` | the committed Page's own locator answers `200 image/png` with bytes equal to the generated 64×64 plate (`IHDR` read at 16/20 = 64×64); the temporary page serves the `end` position with its plain caption, the decorative empty-alt figure and the byte-identical bare figure |
| `browser` | four cases — `light:390`, `light:1280`, `dark:390`, `dark:1280` — each measuring all four variants: images loaded at `64×64` natural size; equal tracks `[246,246]` (rich) and `[245,245]` (end) at 1280, single column `[310,310]` / `[308,308]` at 390; decorative `[552,552,552]` / `[350,350,350]` and bare `[552]` / `[350]` one-column; `muted` `rgb(245,247,251)` / `rgb(20,27,36)`, `bordered` `rgb(255,255,255)` / `rgb(12,17,24)`, plain and absent transparent with no border and no padding; **6 real Tab presses** reach `A[https://example.org/media-notes]`, focus leaves it again, the URL is unchanged, **0** foreign requests, **0** console/page errors |
| `refusal` | twelve closed probes, each refusing the whole Page with its own literal reason and no document: unbound source, remote URL source, decorative with a nonempty alt, empty alt without the flag, non-literal decorative value, unsafe Markdown destination, malformed Markdown, caption beyond 4,000, unknown position, unknown surface, position without authored text, unknown image field |
| `rights` | the served region renders no donor identity (`/assets/wo066-donor-plate.png`), no storage path, no remote host, no provider, no `url(`/`@font-face`/frame; every `src` matches this Page's own `/uno-media/<locale>/wo066-family-composition/<n>` route |

Each dimension is recorded in `localA2.media` and only the unchanged oracle turns them into `PARITY_MEDIA=PASS`.

## 4. The restore proof the order asked for

R02 verified the Columns fixture's restored **bytes** but then re-read the swap's own response. Both transactions now re-request
the Page after the restore and assert a **fresh** served original — the committed Page, its committed region and **none** of the
temporary variant anchors — in addition to the byte digest:

- `FAMILY_COLUMNS_RESTORE … a fresh response serves the committed Page without any variant anchor` — PASS
- `FAMILY_MEDIA_RESTORE … a fresh response serves the committed Page without any variant anchor` — PASS

Both fixtures are written back in `finally`, so an interrupted run cannot leave a variant behind.

## 5. Local verification (sequential, final head)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,391 / 1,391**, 35 files |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **346 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **911 passed / 0 failed** — `PARITY_MEDIA=PASS`, `U04_PARITY=12/17`, `U04_PROXY=54/59`, B2 still `11/17` / `53/59`, `22/22` modules, `4/4` zones, `16/16` browser matrix, `63/63` rich-family dimensions |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — both P6 declaration phases byte-exact, multi-Facet/multi-Site/multi-Page/multi-language publication intact |


## 6. Hosted verification at the exact product head

Both workflows ran at `fdc52ef51b105354182dc08b45d0d35c2945c180` on both operating systems:

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45616503714](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45616503714) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 38/38 steps each: governance bytes, dependency and brand contracts, **Unit tests**, the U04 JSON-slice hermetic contract, the production build and bounded output tracing, the multi-Site P6 contract, the three-Site P6 HTTP/Chromium run, the A1 slice, the 22-module hermetic guard, the **22-module production HTTP/Chromium consent run** that now carries the Media evidence, and deployment readiness |
| `Uno Bootstrap Verify` | [45616503612](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45616503612) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 10/10 steps each |

**Recorded failure and its fix.** The first product push (`72934c3`) failed the hosted `Unit tests` step on both operating
systems: four tests pin the ledger's claim text and a bare-row guard, and the corrected ledger now says *twelve* evidenced
candidates with *five* bounded shapes while containing the earned `12/17` row. The failure was real and the fix is honest, not a
suppression: the pinned phrases were updated to the new truthful wording, and the `2/17` guard became a boundary-aware
`not.toMatch(/(?<!\d)2\/17/u)` so it still forbids a bare `2/17` claim without colliding with the earned `12/17`; `12/17` and
`54/59` are now pinned **positively**. `fdc52ef` is green on both operating systems.

## 7. Risks and limits

1. **Alt bound.** Uno keeps 320 code points where the donor allows 400. A longer donor description refuses the Page; no other
   media contract was widened.
2. **Decorative is explicit.** `alt` stays a required field, so an explicitly decorative image authors `alt: ""` plus
   `decorative: true`; the semantic is never inferred from an empty string, and a description beside the flag refuses.
3. **Caption bounds are disjoint.** Only a declared-Markdown caption may exceed 320; a plain caption keeps its native bound, so
   a donor caption between 321 and 4,000 characters that carries no Markdown refuses.
4. **Position needs text.** A `position` without a heading or lede refuses rather than inventing copy — the donor's own
   arrangement has nothing to place against otherwise.
5. **Lazy images are visited.** The shipped images are `loading="lazy"`, so each case scrolls every variant into view and awaits
   that image's own `load` before measuring; an off-screen figure is never reported as loaded.
6. **Checkpoints.** `B2` is earned and unchanged at `11/17` / `53/59`; the twelve-family `12/17` / `54/59` row is checkpoint-free
   and `C1` is **not** claimed because `gallery` remains bounded. No stage closure, release or deployment follows.

## 8. Disposition

Twelve of seventeen families are parity-evidenced with executed seven-dimension evidence, the twelve refusal probes are closed,
the four browser cases are a conjunction, and both temporary fixture transactions now prove a fresh served original. Stopping for
independent Architect review.
