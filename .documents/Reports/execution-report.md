# Execution Report — UNO-WO-119 / R02

**Outcome: COMPLETE — the Columns browser evidence is now executed in all four cases (390/1280 × light/normal and dark/reduced), the R01 report's overstatement is corrected, and the unchanged B2 checkpoint is fully evidenced at `PARITY_COLUMNS=PASS`, `U04_PARITY=11/17`, `U04_PROXY=53/59`. All ten prior credits are preserved. U04 remains OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-119 / R02`, `FINAL — EXECUTE` (supersedes R01) |
| ACTIVE | **4,427 bytes**, SHA-256 `727a1d996f1566cf942e20eb709270142046ea090ea609b59a831fb912ee111a` — matched the activation exactly; private, ignored, absent from the tree |
| Start SHA | `57634fbf6775d8d17484e9efc49cd402abaecba1` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Product head | `28d6a9fbb2d70df55a3aa7e988bf5edc12c1841a` (`57634fb..28d6a9f`, one non-force push) |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs` — A1 `3/17`, A2 `5/17`, B1 `8/17` / `50/59`, nine-family `9/17` / `51/59`, ten-family `10/17` / `52/59`, **B2 `11/17` / `53/59`** |

## 1. What R01 claimed, what was actually missing, and what R02 executed

R01 committed the Columns implementation (composer, reader, renderer, stylesheet, evidence module, ledger), and that checkpoint is
still the right one — **no product source changed here**. What R01 *reported* as complete was not: its dedicated Columns swap
transaction visited only **1280/light/normal** and **390/light/normal**, and its asymmetric predicate only asked *which* cell was
wider. Dark/reduced motion, the exact 2:1 and 1:2 proportions, the per-scheme computed surfaces at both widths, and any keyboard
access to the rich safe link were asserted in prose, not executed.

R02 replaces that transaction with **four independently executed cases** over the same real production HTTP page and real Chromium:

| Case | Media asserted | 1280 px geometry | Computed surfaces |
| --- | --- | --- | --- |
| `light:1280` | light, `no-preference` | `[246,246]`, `[327,163]`, `[177,355]`, `[171,171,171]` | muted `rgb(245,247,251)`, bordered `rgb(255,255,255)`, plain/absent `rgba(0,0,0,0)` |
| `dark:1280` | dark, `reduce` | `[246,246]`, `[327,163]`, `[177,355]`, `[171,171,171]` | muted `rgb(20,27,36)`, bordered `rgb(12,17,24)`, plain/absent transparent |
| `light:390` | light, `no-preference` | single column: `[310,310]`, `[308,308]`, `[350,350]`, `[350,350,350]` | as light above |
| `dark:390` | dark, `reduce` | single column: `[310,310]`, `[308,308]`, `[350,350]`, `[350,350,350]` | as dark above |

In every case: the four served variants in authored order with their native ratio attributes (`equal`, `start-wide`, `end-wide`,
and **none** on the three-column grid); every cell a positive nonzero box; authored DOM order and the same visual order; all
24 labels in two native lists; `plain` presenting exactly like no surface at all (no background, no border, zero padding) while
`muted` and `bordered` differ from it and from each other with a real fill, a 1 px border and `16px 20px` token padding; no
horizontal overflow; **11 real Tab presses** reaching `A[https://example.org/columns]` with `rel="noopener noreferrer"`, focus
leaving it again on the next Tab, the URL unchanged and **zero** foreign requests; and **zero** new console or page errors.

The asymmetry contract uses a documented **±2 px** rounding tolerance — `wider ≈ 2 × narrower` (`327 ≈ 2 × 163`, `355 ≈ 2 × 177`) —
so a grid that is *merely wider* fails; a negative test feeds `[250,240]` and must refuse.

## 2. Authorized ledger (5 modified; no product change)

| Path | Change |
| --- | --- |
| `scripts/u04/columns-evidence.mjs` | `COLUMNS_CASES` (the four cases), `COLUMNS_RATIO_TOLERANCE_PX` / `COLUMNS_RATIO_FACTOR`, `columnsCaseVerdict` (media, geometry, exact asymmetry, order/count, surfaces, labels, keyboard), `columnsGeometryReport` (exactly four distinct cases — no duplicate, no missing) |
| `scripts/verify-u04-22-module-consent.mjs` | the four-case swap transaction, one `check` per case, the keyboard walk, console/foreign-request accounting, the conjunction + `FAMILY_COLUMNS_RESTORE`, and one `INFO` line per case recording the measured widths, surfaces, presses and media |
| `tests/unit/u04-verification-modules.test.mjs` | the four-case contract and its negative matrix (missing / duplicate / mislabelled case, merely-wider, 3:1, reversed, unequal, ragged, the rounding tolerance, a kept ratio attribute, narrow order and count, zero width, overflow, surface effects, keyboard, labels/lists/link) |
| `tests/deployment/u04-22-module-consent.test.mjs` | new required tokens (per-case label, conjunction, restore, verdict, case loop, keyboard) and seven neutering mutations |
| `.documents/Architecture/u04-family-parity.md` | the R02 supersession paragraph and the measured cases; R01's paragraph corrected to point at R02 for the browser proof |

`git status` shows exactly these five paths: no source, style, durable Page, declaration, dependency, workflow, frozen governance
file, closure oracle, other repository or provider was touched. The fixture swap is test-owned and restored in `finally`, with the
digest and the served legacy page re-verified (`FAMILY_COLUMNS_RESTORE`).

## 3. Local verification (sequential, this run)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,381 / 1,381**, 35 files (R01 head: 1,378) |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **345 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **886 passed / 0 failed** — `PARITY_COLUMNS=PASS`, `U04_PARITY=11/17`, `U04_PROXY=53/59`, B2 earned, `22/22` modules, `4/4` zones, `16/16` browser matrix, `56/56` rich-family evidence |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — both P6 declaration phases byte-exact |

## 4. Hosted verification at the exact product head

Both workflows ran at `28d6a9fbb2d70df55a3aa7e988bf5edc12c1841a` on both operating systems:

| Workflow | Run | Jobs | Steps |
| --- | --- | --- | --- |
| `Verify U01 baseline` | [45604671359](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45604671359) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success | 38 / 38 success in each job |
| `Uno Bootstrap Verify` | [45604671296](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45604671296) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success | all steps success |

The steps include the frozen-governance positive/refusal check, the dependency and brand contracts, the bootstrap and architecture
gates, the unit suite, the production build, the mutation-sensitive P6 contract, the A1 slice, the 22-module hermetic guard and the
real production HTTP/Chromium consent run that now carries the four-case Columns evidence — so the dark/reduced cases, the exact
ratios, the computed surfaces and the keyboard walk are proven on Linux and Windows, not only locally.

## 5. Risks and limits

1. **Tolerance.** The asymmetry check allows ±2 px on the doubled track, which is exactly what whole-pixel track rounding produces;
   a real 2.5:1 or 1.5:1 grid still fails, and a merely-wider grid fails.
2. **Keyboard reachability is measured, not guaranteed.** The walk asserts this page's own focus order reaches the link in 11
   presses and can leave it; a future layout change that reorders focus would be caught by this check, not by a general rule.
3. **Dark surfaces come from the same two tokens.** `muted` uses `--uno-surface` and `bordered` `--uno-background`; both are
   distinct from the transparent ordinary stack in each scheme, but a future token change that made them equal would fail this gate.
4. **B2 is not closure.** `U04` remains OPEN, six families remain bounded, and no release, deployment or stage closure follows.

## 6. Disposition

Eleven of seventeen families are parity-evidenced and the declared **B2** row is earned with the browser dimension now executed in
all four cases rather than asserted. Stopping for independent Architect review.

