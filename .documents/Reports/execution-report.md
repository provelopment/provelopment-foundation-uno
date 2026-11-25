# Execution Report — UNO-WO-119 / R01

**Outcome: COMPLETE — Columns is the eleventh parity-evidenced family. `PARITY_COLUMNS=PASS`, `U04_PARITY=11/17`, `U04_PROXY=53/59`, the unchanged **B2** checkpoint is earned, all ten prior credits and the concurrent-publication regressions are preserved, and every mandatory local gate is green. U04 remains OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-119 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **4,832 bytes**, SHA-256 `971e92cbda52b38d5459d3721383aaebe23de09d63979b40e5839dc2b44e080e` — matched the activation exactly; private, ignored, absent from the tree |
| Start SHA | `1db4da6ca14d83d80f44019c10dce47925802b8d` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Donor pins | Foundation GEO-03 `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, schema `a12d964c…`, `structure-sections.tsx` `65d254e1…`, `section-support.tsx` `19c9bee3…` — read-only, unchanged |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs`: A1 `3/17`, A2 `5/17`, B1 `8/17` / `50/59`, nine-family `9/17` / `51/59`, ten-family `10/17` / `52/59`, then **B2 `11/17` / `53/59`** |

## 1. What the order added

The donor `ColumnsSection` carries an optional plain `heading`, a **Markdown** `lede`, a closed `surface`, a closed `ratio`,
and two or three ordered columns, each a plain title with exactly one Markdown body **or** one list of up to twenty-four plain
labels. Before this order the mapping accepted only plain bodies, twelve labels, a two-column ratio and no heading, lede or
surface. Now:

| Donor field | Uno result |
| --- | --- |
| plain `heading` | `content.heading {level:2}` at `${id}-heading`, inside the section stack |
| **Markdown** `lede` | one `content.prose` at `${id}-lede` through the shared Markdown reader and the one family renderer |
| **Markdown** body | one `content.prose {text, markdown:true}`; a body without Markdown keeps the byte-identical escaped paragraph |
| 1–24 plain labels | consecutive **native** lists of at most twelve in the same column (`…-body`, `…-body-2`), same order, same ownership |
| closed `ratio` | validated for two **and** three columns; reaches the grid only for two, because three columns are equal by the donor's own rule |
| closed `surface` | on the section **stack**, so it covers the authored heading, the lede **and** the grid — the whole authored section |

The bare legacy case (no heading, lede or surface) still composes as `layout.grid {columns, ratio}` at the family anchor with
the same ids, and is proven byte-identical. The `layout.stack` `surface` prop and its two token-only stylesheet rules are the
only schema and styling additions; no module, dependency, provider or design token was added.

**Adaptations recorded rather than smoothed over.** (1) A valid ratio on three columns is validated and then has **no layout
effect**, matching the donor's equal three-column layout; the native grid's own refusal of a ratio on any non-two-column grid is
untouched and is proven separately. (2) Twenty-four labels exceed the native twelve-item list bound, so 13–24 labels compose as
two consecutive native lists — the global cap is not moved and the twenty-fifth label refuses the whole Page. (3) The surface
covers the whole authored section (heading, lede, grid) rather than the donor's outer wrapper only.

## 2. Acceptance evidence — all seven Columns dimensions, executed

| Dimension | Execution |
| --- | --- |
| `source` | `FAMILY_COLUMNS_SOURCE` — the real adapter composes the rich section as one surfaced stack of authored heading, Markdown lede and a two-column grid with the authored ratio, plus `FAMILY_COLUMNS_LEGACY` proving the served fixture's bare grid stays byte-identical with the authored titles |
| `reader` | `FAMILY_COLUMNS_READER` — the composed Page round-trips byte-identically through the strict reader; the 1/12/13/24 boundary holds as consecutive native lists with stable ids; a 25th label refuses; a valid ratio on three columns is dropped while the native grid still refuses any non-two-column ratio; the native stack accepts the closed surface |
| `renderer` | served markup: `<div class="uno-json-stack" … data-uno-surface="muted">`, authored `<h2>`, Markdown lede `<strong>`, `<div class="uno-json-grid" data-uno-columns="2" … data-uno-ratio="equal">`, Markdown body `<a rel="noopener noreferrer">`, two `<ul class="uno-json-list">` with all 24 labels in order, two `<h3>` titles, no `<button>`/`<img>`/`<script>`/`<form>`/`<input>` |
| `http` | the swap Page answers 200 and the three-column grid carries **no** `data-uno-ratio` attribute — the suppression is real in the response, not only in memory |
| `browser` | four served variants in production Chromium at **1280 px** (2 equal = equal, `start-wide` first wider, `end-wide` second wider, 3 equal with no ratio attribute) and **390 px** (every grid one column, authored reading order, no overflow), with the computed surfaces distinct (`muted` ≠ `plain` ≠ `bordered`, `plain` ≡ absent), in light and dark/reduced-motion |
| `refusal` | ten closed probes, each refusing the whole Page with its own literal reason: 25 labels, empty list, invalid ratio, invalid surface, body+list, neither, nested donor section, unsafe destination, malformed Markdown, ill-formed Unicode |
| `rights` | no donor identity, owned asset, foreign resource, font or frame reaches the served region; the only outbound destination is the authored `https://example.org/…` |

The swap is test-owned and temporary: the fixture Page is written, visited, then restored in `finally` and re-verified by digest
(`FAMILY_COLUMNS_BROWSER` asserts the restore), so no durable Page or declaration changed.

## 3. Authorized changes (12 modified, 1 new evidence module)

| Path | Change |
| --- | --- |
| `src/core/page-document.ts` | closed optional `surface` on `layout.stack` props (reader + type), reusing the existing closed surface reader |
| `src/application/compose-uno-foundation-families.ts` | the full donor Columns mapping: heading, Markdown lede/body, 1–24 labels as consecutive native lists, ratio validated for two and three columns and emitted only for two, section-level surface, byte-identical legacy path |
| `src/components/uno-page-sections.tsx` | `data-uno-surface` on the stack (`undefined` renders nothing, so existing stacks are byte-identical) |
| `src/app/globals.css` | two token-only rules for `.uno-json-stack[data-uno-surface="muted"|"bordered"]`; `plain` and absent stay untouched |
| `scripts/u04/family-fixture.mjs` | `COLUMNS_SOURCE` (the served section, now one definition), `COLUMNS_LABELS`, `COLUMNS_RICH_SOURCE`, `COLUMNS_VARIANT_SOURCES` |
| `scripts/u04/columns-evidence.mjs` **(new)** | ids, expectations, region/label parsers, the one geometry comparison, the ten refusal probes |
| `scripts/verify-u04-22-module-consent.mjs` | the seven Columns checks, the swap visit, the eleven-family and **B2** closure evaluations, the `56/56` record count, the stack-surface stylesheet check |
| `tests/unit/page-document.test.ts` | stack surface accept/refuse matrix (closed values, `gap`+`surface`, unknown prop refused) |
| `tests/unit/uno-foundation-families.test.ts` | legacy byte-identity, surfaced wrapper, label ceiling 1/12/13/24/25, three-column ratio suppression, rendered markup, updated ledger pins |
| `tests/unit/uno-page-sections.test.ts` | the shipped stack-surface stylesheet contract |
| `tests/unit/u04-verification-modules.test.mjs` | the Columns evidence module on its own: variants, label parser, geometry report accept/reject, ten refusal probes |
| `tests/deployment/u04-22-module-consent.test.mjs` | new tokens, five neutering mutations for the Columns proof, the declared-checkpoint list now `A1/A2/B1/B2`, whole-Page probe mutation across every call site |
| `.documents/Architecture/u04-family-parity.md` | the `columns` row as `PARITY (UNO-WO-119 / R01)`, the three adaptation notes, eleven credited / six bounded, B2 earned |


## 4. Local verification (sequential, this run)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,378 / 1,378**, 35 files (R02 head: 1,367) |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **345 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **881 passed / 0 failed** — `PARITY_COLUMNS=PASS`, `U04_PARITY=11/17`, `U04_PROXY=53/59`, B2 earned, `56/56`, `22/22`, `4/4`, `16/16` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — both phases byte-exact (concurrent publication preserved) |

## 5. Risks

1. **Split label lists.** A 13–24-label column is two adjacent native lists in one column. Order, semantics and ownership are
   preserved and the global cap is untouched, but a screen-reader user hears two lists rather than one; recorded here and in the
   ledger.
2. **Ratio suppression.** A valid ratio authored on three columns is validated and inert, matching the donor. The native reader's
   refusal of a non-two-column ratio is still proven, but an author who writes a ratio on three columns gets no warning.
3. **Surface scope.** The closed surface covers the whole authored section (heading, lede, grid) through the stack; a grid
   authored with no heading, lede or surface carries none, so the surfaced and plain arrangements differ by one wrapper.
4. **B2 is not closure.** `U04` remains OPEN, `quote` and `faq` remain credited at their interim rows, and six families remain
   bounded.

## 6. Disposition

Eleven of seventeen families are parity-evidenced; the declared **B2** row (`11/17` / `53/59`) is earned by executed evidence
through the unchanged oracle, and every earlier row is retained as a regression. No stage closure is claimed. Stopping for
independent Architect review.

## 7. Hosted verification

Pending the push of this order's product commit; both Uno workflows are required to succeed on `ubuntu-24.04` and
`windows-2025` at the exact product head, and their runs are recorded in section 8 before this report is final.


## 8. Hosted verification at the exact product head

Product commit `9aa088a85ec114baa88a6f95fc55e889a3cec6f1` (`1db4da6..9aa088a`), one non-force push to Uno `main`.

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45597816397](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45597816397) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |
| `Uno Bootstrap Verify` | [45597816426](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45597816426) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |

Both workflows ran at this exact head on both operating systems, including the frozen-governance positive/refusal check, the
bootstrap and architecture gates, the unit suite, the production build, the mutation-sensitive P6 contract, the A1 slice, the
22-module hermetic guard and the real production HTTP/Chromium consent run that carries the new Columns evidence — so the four
served geometries, the computed surfaces, the label ceiling, the refusal matrix and every retained credit are proven on Linux
and Windows, not only locally.

