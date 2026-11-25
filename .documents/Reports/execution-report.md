# Execution Report — UNO-WO-120 / R03

**Outcome: COMPLETE — the native required-`alt` input boundary is restored while the donor-side normalization stays in the
adapter. All five delivered R02 Media corrections are preserved. `PARITY_MEDIA=PASS`, `U04_PARITY=12/17`, `U04_PROXY=54/59`; the
eleven prior credits are preserved, **B2** is unchanged at exactly `11/17` / `53/59`, and every mandatory local and exact-head
hosted gate is green. C1 and U04 remain OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-120 / R03`, `FINAL — EXECUTE` (supersedes R02) |
| ACTIVE | **3,779 bytes**, SHA-256 `028fa6fd39fb58287c4d060e4d1e84d43620a85e65c44db2ec9c6eb398b1ce69` — matched the activation exactly; private, ignored, absent from the tree |
| Start SHA | `5d8fe8ad5cf5255b86aa3a5c785a116c9ac5607e` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Product head | `9791e52eb48934e3b8c8baab958732229304291e` (`5d8fe8a..9791e52`, one non-force push) |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs` — twelve families at **12/17** / **54/59**, selector `B2` still exactly **11/17** / **53/59** |

## 1. The authorized correction

**The defect.** R02's authorised text says "Keep native required alt and 320-code-point bound" and "Preserve ordinary native and
other-family behavior". R02 correctly normalized an omitted donor `alt` beside `decorative: true` **in the composer**, but it also
made `alt` optional at the **native strict reader** — so a hand-authored native document could omit the alternative and still be
accepted, which is a widening of the native contract the order never authorized.

**The correction.** `src/core/page-document.ts` is back to the original native boundary: `media.image` requires **both** `asset`
and `alt`; the alternative is read with the unchanged 320-code-point bound; `decorative: true` requires it exactly empty; a
described image requires it non-empty; a non-boolean flag still refuses. Nothing else about the node changed — the caption forms,
the `markdown` literal and the closed props set are untouched.

**What stays where.** The donor's optional boolean is a **source** shape and its normalization belongs to the adapter, which
already emitted the native `alt: ""` before reading; the composer is unchanged by this round. So:

| Input | Result |
| --- | --- |
| donor section, `decorative: true`, `alt` omitted | adapter composes `media.image {asset, alt: "", decorative: true}` → **accepted**, served figure carries an explicit empty `alt` |
| donor section, `decorative: true`, `alt: ""` | **accepted**, byte-identical to R02 |
| donor section, described alt with `decorative` absent or `false` | **accepted** as before |
| **direct native object** (`readUnoPageDocument`) `decorative: true`, `alt` omitted | **refused** `document:invalid-props`, no document |
| **raw JSON document** with the same omission | **refused** `document:invalid-props`, no document |
| direct native object, `alt` omitted and no flag | **refused** as before |
| direct native object, nonempty `alt` with `true`, empty `alt` without `true`, non-boolean flag, `alt` > 320 code points | **refused** as before |

No native alt bound was widened, no donor composition changed, and the caption-Unicode protection, long-caption representation,
textless position and surface behaviour are exactly as delivered by R02.

## 2. Authorized ledger (7 modified; no other path touched)

`src/core/page-document.ts` (the native required-`alt` restoration and its comments) · `scripts/verify-u04-22-module-consent.mjs`
and `scripts/u04/media-evidence.mjs` (to distinguish source normalization from direct-native refusal) ·
`tests/unit/page-document.test.ts`, `tests/unit/u04-verification-modules.test.mjs`,
`tests/deployment/u04-22-module-consent.test.mjs` (focused boundary regression and mutation-sensitive evidence) ·
`.documents/Architecture/u04-family-parity.md`, and this single overwrite of `.documents/Reports/execution-report.md`.

No composer, renderer, stylesheet, durable Page/declaration, asset policy, dependency, workflow, oracle, frozen governance,
sibling repository, provider, release or deployment change was made. `tests/unit/uno-foundation-families.test.ts` needed no edit:
its composer expectation (`omitted donor alt → alt: ""`) is still exactly what the adapter does.

## 3. Acceptance evidence, as executed

**Through the real composer** (`FAMILY_MEDIA_SOURCE`, PASS): the donor fixture whose `image` **omits `alt`** and authors
`decorative: true` composes `media.image {alt: "", decorative: true}`, and the existing explicit empty-alt form composes
identically; both round-trip through the strict reader; the served figure renders `<img alt="">` with no accessible name, and the
temporary page serves that exact markup (`FAMILY_MEDIA_HTTP`, PASS).

**The native boundary refuses the omission** (`FAMILY_MEDIA_READER`, PASS) — proven directly on `readUnoPageDocument`, not through
the adapter: explicit empty alt with `true` **accepted**; descriptive alt with absent/`false` decorative **accepted**; omitted alt
with `true`, omitted alt with no flag, contradictory nonempty alt with `true`, empty alt without `true`, non-boolean
`decorative`, and a 321-code-point alt **refused**; and the same omission submitted as a **raw JSON string** refused as well. Each
refusal carries no document. The reader dimension also keeps every R02 caption proof: unflagged 320 accepted / 321 refused
natively, declared 321 and 4,000 accepted / 4,001 refused, an unformatted 400-character caption declared through the accepted
Markdown form with its exact authored text, lone high/low surrogates refused in **both** forms, and a supplementary pair accepted
in both.

**All seven Media dimensions re-executed** (913 checks, 0 failed): `source`, `reader`, `renderer`, `http`, `browser`, `refusal`
(**fourteen** closed probes), `rights` — with `FAMILY_MEDIA_RESTORE` proving the byte-exact restore **and** a fresh served
original.

**Six variants across four real Chromium cases** (`light:390`, `light:1280`, `dark:390`+reduced motion, `dark:1280`+reduced
motion), each measuring the committed rich section, the `end` position, the decorative figure whose donor alt is omitted (served
`alt=""`, authored `surface:"plain"`), the bare figure, and both textless positions. Measured at 1280: rich tracks `[246,246]` at
lefts `[380,646]`; `end` `[245,245]` at `[381,646]`; decorative `[552,552,552]` at `[360,360,360]`; bare `[552]` at `[360]`;
**textless start `[266]` at `[360]`** and **textless end `[266]` at `[646]`**. At 390 every variant is one column in authored
order with the textless figures flush to the content edge. Images all loaded `64×64` from this Page's own locator; surfaces
`muted` `rgb(245,247,251)` / dark `rgb(20,27,36)`, `bordered` `rgb(255,255,255)` / dark `rgb(12,17,24)`, authored `plain`
`rgba(0,0,0,0)` **with** `data-uno-surface="plain"`, absent `rgba(0,0,0,0)` with **no** attribute; **6** real Tab presses reach
`A[https://example.org/media-notes]`, focus leaves again, no navigation, **0** foreign requests, **0** console/page errors.

**Prior credits, restoration and cross-cutting regressions**: `A2_LOCAL_…=63/63`, `U04_MODULE_IDS=22/22`,
`U04_BROWSER_MATRIX=16/16`, four of four owned zones, `FAMILY_COLUMNS_RESTORE` and the concurrent multi-Facet/Site/Page/locale
phases of the P6 gate (179 checks, both declaration phases byte-exact) all PASS. The unchanged oracle credits twelve families at
`12/17` / `54/59` and earns **B2** at exactly `11/17` / `53/59`; no `C1` claim is made.


## 4. Mutation-sensitive evidence

The deployment audit (346 checks) now pins the **restored** boundary and fails if it is weakened:

- the reader label asserts that "the native reader still requires an explicit alt while the adapter normalizes the donor's
  omission";
- the token `directOmission.accepted === false` must be present, and replacing it with `true` fails the audit;
- the token `Media raw omission probe` must be present, and dropping it fails the audit — so the raw-JSON refusal cannot vanish
  silently;
- the R02 tokens for the declared unformatted caption, the shared Unicode decision and the textless served shape remain required,
  each with its own neutering shape.

The unit suite mirrors the split: `page-document.test.ts` asserts the native refusal (object **and** raw JSON, no document) beside
the still-accepted explicit forms; `u04-verification-modules.test.mjs` asserts that the served decorative figure must carry the
explicit empty alternative even though the donor input omitted it.

## 5. Local verification (sequential, final head)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,397 / 1,397**, 35 files |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **346 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **913 passed / 0 failed** — `PARITY_MEDIA=PASS`, `U04_PARITY=12/17`, `U04_PROXY=54/59`, `22/22`, `63/63`, `16/16`, fourteen refusals, B2 `11/17` / `53/59` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — both P6 declaration phases byte-exact |

## 6. Hosted verification at the exact product head

Both workflows ran at `9791e52eb48934e3b8c8baab958732229304291e` on both operating systems:

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45635804565](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45635804565) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 38/38 steps each, including governance bytes, **Unit tests**, the A1 slice, the 22-module hermetic guard, the **22-module production HTTP/Chromium consent run**, the multi-Site P6 contract and run, and deployment readiness |
| `Uno Bootstrap Verify` | [45635804527](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45635804527) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 10/10 steps each |

## 7. Risks and limits

1. **Two boundaries, one contract.** The donor may omit `alt` beside `decorative: true`; the native document may not. The split is
   enforced by location (adapter versus reader), and both directions are mutation-guarded, so a future change that moves the
   normalization back into the reader fails the audit.
2. **Alt bound.** Uno keeps 320 code points where the donor allows 400; a longer donor description refuses and no bound moved.
3. **Caption scope.** The shared well-formedness decision still applies to the native `media.image` caption only; gallery,
   carousel and video captions keep exactly the acceptance they had.
4. **Long captions are declared, not detected.** An unformatted caption above 320 is representable because the adapter declares
   the accepted Markdown form; a hand-authored native node must make the same declaration.
5. **Textless placement is CSS-scoped** to a single-child stack inside the wide-viewport media query, and is measured in all four
   browser cases rather than inferred.
6. **Checkpoints.** `B2` remains earned and unchanged; the twelve-family row is checkpoint-free; `C1` is **not** claimed because
   `gallery` remains bounded. No stage closure, release or deployment follows.

## 8. Disposition

Media remains the twelfth parity-evidenced family with the delivered R02 capability intact and the native input boundary restored
to its pre-adoption contract; the correction is proven from the real composer in one direction and from the strict reader in the
other, and both are guarded by mutation-sensitive tests. Stopping for independent Architect review.

