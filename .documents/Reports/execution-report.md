# Execution Report — UNO-WO-113 / R01

**Outcome: DELIVERED — `PARITY_STATS=PASS`, `PARITY_STEPS=PENDING`, `U04_PARITY=7/17`, `U04_PROXY=49/59`, with the six earlier families still `PASS`, proven at the exact product SHA on both hosted operating systems.**

| | |
| --- | --- |
| Order | `UNO-WO-113 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **2,642 bytes**, SHA-256 `69a8fbea02debb07fe0e65059a8b751f228fc0442bc75889995a1e67a3d3e98f` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `2737e938736d435767912904444fbc432e8a7a04` (`HEAD` = `main` = `origin/main` = `ls-remote`, clean tree, one worktree, one Uno `origin`) |
| Product SHA | **`d2439a11827eb071b85874553deabce49247dfaf`** |
| Credited families | `prose`, `callout`, `table`, `list`, `hero`, **`stats`**, `divider` → **`7/17`**, **`49/59`** |
| Not claimed | the full B1 `8/17` row: `steps` stays `PENDING` |

## 1. Stats parity (the substantive surface)

The pinned donor contract is `statsSectionSchema = {type, ...headingFields (optional plain heading, Markdown-capable lede),
items: 1..6 of {value, label, detail?}, ...surfaceField}`, with `statItemSchema.detail` typed `markdownTextSchema`. Three
genuine gaps were closed end to end, in the authorized trees only, and the native accessible structure was proved rather
than restyled:

- **Markdown-capable lede.** `stats` now reads its donor `lede` through the same shared family Markdown reader the credited
  `prose`, `table`, `list` and `hero` families use, and composes it as `content.prose {text, markdown: true}` inside the
  existing authored-text stack. A plain lede keeps the **byte-identical** `content.prose {text}` child, so every previously
  accepted composition is unchanged.
- **Markdown-capable item detail.** The strict reader (`src/core/page-document.ts`) gained the closed `markdown?: true`
  switch on `content.stats`, and the composer sets it only when an authored `detail` actually carries Markdown (read at the
  Uno target's own 320-code-point detail bound). The renderer draws a flagged detail through the shared family renderer
  (`<div class="uno-json-stat-detail">` + `<strong class="uno-family-md-strong">`), while an unflagged detail keeps the
  escaped `<span>` of the earlier accepted output.
- **The donor's closed `surface`.** Composed and served as `data-uno-surface`, with the reader's existing enumeration
  refusing any other value (`family:target-refused`).

**Native accessible structure.** The served family is one `<section class="uno-json-stats">` holding a `<dl
class="uno-json-stats-list">` whose every `<dt class="uno-json-stat-label">` is paired with one `<dd
class="uno-json-stat-value">` in authored order, preceded by exactly one authored `<h2>` and the authored lede; the evidence
asserts there is no invented heading level, no second list, no currency, no link, control, form or frame.

**Evidence.** `localA2.stats` is a seven-dimension record filled only by executed checks: composed source, strict-reader
round-trip, served React markup, real production HTTP (`statsServed` + an independently parsed pair list), the four-case
Chromium conjunction (light and dark/reduced-motion at 390 px and 1280 px), six whole-source stats refusals and the rights
invariants. The unchanged oracle then credits exactly `prose, callout, table, list, hero, stats, divider` at `7/17` /
`49/59`; A1 (`3/17`), the interim four-family row (`4/17`), A2 (`5/17`) and the six-family row (`6/17`) all remain as
regressions, and `steps` is still `PENDING`.

## 2. The reusable verification modules (extended, not rewritten)

The main runner stays an orchestrator. The Stats family reuses the same four modules the Hero family established and adds
one cohesive module of its own:

| Module | Lines | Responsibility |
| --- | --- | --- |
| `scripts/u04/stats-evidence.mjs` | **162** | Stats expectations derived from one fixture definition, the served-region and `<dl>` pair parsers, the seven-dimension predicate and the six-case refusal matrix |
| `scripts/u04/family-fixture.mjs` | 248 | adds the exported `STATS_SOURCE` and authors index 10 from it, so the fixture and every expectation read one definition |
| `scripts/u04/hero-evidence.mjs` | 138 | unchanged Hero expectations and predicates |
| `scripts/u04/family-evidence.mjs` | 54 | the seven-dimension record, `isCreditable`, the four-case `conjunction` |
| `scripts/u04/serving-harness.mjs` | 105 | pinned-CLI lookup, free port, bounded child run, readiness wait, best-effort kill |

`statsNodeProps()` is **derived** from the fixture rather than retyped, so the runner, the served-HTTP assertion and the
unit tests cannot drift. `tests/unit/u04-verification-modules.test.mjs` (300 lines, 17 tests) executes the real adapter
against the real fixture, the parsers, the predicate's accept/reject cases and every refusal case.

## 3. Documentation

`.documents/Architecture/u04-family-parity.md`: the aggregate now reads **seven** fully parity-evidenced candidates with
**ten** still bounded, the `stats` row is rewritten as `PARITY (UNO-WO-113 / R01)` with its real accepted fields (Markdown
lede and detail, the closed surface), its deliberate refusals, its output and its evidence, the `stats`/`steps` narrative
records that `UNO-WO-113 / R01` supersedes the bounded half for `stats` only, and the HTTP/browser paragraph now describes
the Markdown lede, the `muted` surface and the Markdown detail. The unit tests that pin the ledger text were updated
(positive `7/17`, the `8/17` prohibition kept, and the bounded-mode count now one).

## 4. Local gates (all green)

| Gate | Result |
| --- | --- |
| `verify-u04-22-module-consent.mjs` (real build/start + Chromium) | **832 passed / 0 failed**; `PARITY_STATS=PASS`, `PARITY_STEPS=PENDING`, `7/17`, `49/59` |
| `verify-u03-multisite-http.mjs` (three Sites, both phases, restored) | **179 passed / 0 failed**, both phases byte-exact |
| `u03-multisite-contract` + `u04-22-module-consent` + `u04-family-closure` | **101 passed / 0 failed** |
| `pnpm test` | **1,308 / 1,308** (17 extracted-module tests) |
| `pnpm test:architecture`, `pnpm typecheck`, `pnpm lint` | **47 / 0**, exit 0, exit 0 |
| Declarations after every run | `manifest` `b6213ed6…`, `config` `58011c43…` |

## 5. Hosted proof at `d2439a1`

| Workflow | Run | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- | --- |
| `Verify U01 baseline` | **45408339302** | success | success |
| `Uno Bootstrap Verify` | **45408339212** | success | success |

Read out of the **actual** hosted logs, on both systems:

```text
verify-u03-multisite-http: 179 passed, 0 failed
verify-u04-22-module-consent: 832 passed, 0 failed
PASS  U04_LABEL PARITY_HERO=PASS
PASS  U04_LABEL PARITY_STATS=PASS
PASS  U04_LABEL PARITY_STEPS=PENDING
PASS  U04_LABEL U04_PARITY=7/17
PASS  U04_LABEL U04_PROXY=49/59
```

The untouched regression gates are green in the same logs on both systems, including `verify-u01-http` 105/0,
`verify-u03-http` 135/0 and `verify-u03-published-http` 999/0.

## 6. State and next

`Stats` is credited at the interim **`7/17` / `49/59`** row, with `hero`, `table`, `list`, `prose`, `callout` and `divider`
preserved and `steps` still `PENDING`; the full B1 `8/17` checkpoint is explicitly **not** claimed. `U04` remains **OPEN** —
this is an interim family count, not stage closure, release or deployment, and the Owner separately decides those. No
workflow, closure oracle, permanent declaration, protected governance file, committed durable Page or other family's
behaviour was changed. The product commit was pushed non-force and this single sanitized report is overwritten. The run stops
here for independent Architect review.

