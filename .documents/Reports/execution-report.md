# Execution Report — UNO-WO-116 / R01

**Outcome: COMPLETE — the shared authored family Markdown Unicode well-formedness defect is closed with one shared decision, valid multilingual content is preserved, all eight credited families and B1 are intact, and every mandatory local gate is green.**

| | |
| --- | --- |
| Order | `UNO-WO-116 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **3,749 bytes**, SHA-256 `a6ce94672e5a9b450b18a72d9d70fcf502c31077357013b8265f9a6f5fcfbf58` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `1bf835f481b18405c486538975fb6820fc3d4d5d` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree, nothing staged) |
| B1 baseline | `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, `U04_MODULE_IDS=22/22`, `U04_ASSET_ZONES=4/4`, `U04_BROWSER_MATRIX=16/16`; three-Site P6 PASS with both phases byte-exact |

## 1. The defect and the one decision that closes it

The disclosed WO-114 defect: the **shared authored family Markdown reader** accepted unpaired UTF-16 surrogates, so a
malformed value could reach a visitor as a replacement character, a mangled glyph or a dropped code unit — while the plain
lede readers refused it. Per-family patches would have recreated the drift, so the order required a single decision.

`isWellFormedUnicodeText(value)` in `src/core/page-document.ts` is now that decision: a high surrogate must be followed by a
low surrogate, and any low surrogate with no lead is refused — lone high, lone low, reversed and interrupted pairs all fail,
while valid astral pairs, combining sequences, zero-width-joiner sequences and any mixture of scripts stay accepted. It never
replaces, trims or normalises. The strict reader, the shared Markdown reader and the family composer all consume it, and the
**two duplicated surrogate scans in the composer were deleted** — one definition, not per-family patches.

## 2. Authorized changes (13 code/test/doc paths, no others)

`git diff --stat` before the report overwrite: 13 files, 627 insertions, 48 deletions. `.github/**`, `AGENTS.md`,
`README.md`, the SOP, the governance gate, `package.json`, dependencies, the closure oracle, durable Pages and committed
deployment declarations are untouched.

| Path | Change |
| --- | --- |
| `src/core/page-document.ts` | New exported `isWellFormedUnicodeText`; new closed reason `markdown:ill-formed-unicode` checked in `readUnoFamilyMarkdown` **before** parsing and before the size cap; new `readMarkdownCapableText`/`optionalMarkdownCapableText` applied in the plain branch of every Markdown-capable field — hero `lede`/`support`, stats item `detail`, timeline item `description`, prose/callout `text`/`lede`, list `detail`/`lede`, table `caption`/`lede` |
| `src/application/compose-uno-foundation-families.ts` | Imports the shared decision; both hand-rolled surrogate loops (`readFamilyLede`, `readSectionPlainText`) replaced by it. No reason vocabulary, bound or feature changed |
| `tests/unit/uno-family-markdown.test.ts` | New Unicode matrix: four malformed shapes plus malformed-inside-code-span and malformed-inside-link-label, each `markdown:ill-formed-unicode`; malformed-before-cap; multilingual acceptance; supplementary pair counted once (4,000 accepted / 4,001 `too-large`); no normalisation |
| `tests/unit/page-document.test.ts` | Counting test now proves the split (plain field still counts and accepts a lone surrogate; the same value in a Markdown-capable field refuses); new suite over **15 Markdown-capable surfaces** × 4 malformed shapes × **both entry points** (plain data and raw JSON text with a decoded `\uD800` escape), plus multilingual acceptance, exact astral bounds (4,000/4,001 body, 320/321 detail) and native plain-field preservation |
| `tests/unit/uno-foundation-families.test.ts` | New composer suite over 13 donor surfaces (including the four ledes that keep `family:target-refused`), each proven **without any Markdown punctuation**, plus multilingual compose → JSON round trip → served markup with no `U+FFFD`; `expectRefusal` proves the whole source refuses with no partial Page |
| `tests/unit/uno-page-sections.test.ts` | New renderer suite: eight malformed native fixtures are refused before rendering; multilingual text renders byte-exactly in plain and Markdown form for prose, hero, stats and timeline |
| `scripts/u04/hero-evidence.mjs` | Two new whole-source cases (lede with an unpaired surrogate, support with a reversed pair), `family:unsupported-feature`; earlier six cases retained |
| `scripts/u04/stats-evidence.mjs` | Two new cases (detail with an unpaired surrogate, lede with an interrupted pair); earlier six retained |
| `scripts/u04/steps-evidence.mjs` | Three new cases — a real malformed-Unicode Steps body (high surrogate), a second body (lone low surrogate) and the lede (interrupted pair); earlier seven retained, none dropped |
| `scripts/verify-u04-22-module-consent.mjs` | Two new checks: the Unicode probes are present in the hero/stats/steps matrices with no earlier case dropped, and a **native** hero/stats/timeline node with a malformed Markdown field is refused by the strict reader from plain data **and** JSON text |
| `tests/unit/u04-verification-modules.test.mjs` | Two new tests: per-family probe presence and non-reduction of the case lists; each surrogate probe re-executed as a whole-source refusal with no partial Page |
| `tests/deployment/u04-22-module-consent.test.mjs` | Three new required audit tokens plus a mutation test proving removal of any of them fails the hermetic audit |
| `.documents/Architecture/u04-family-parity.md` | New §4a recording the shared decision, the new closed reason, the accepted set and the **remaining scope** |

## 3. Refusal and preservation semantics

- **Established reasons retained.** `family:unsupported-feature` where a field is read through the shared Markdown reader;
  `family:target-refused` where it is read by the bounded lede reader; `document:invalid-props` at the strict reader. The one
  new closed reason is the Markdown reader's `markdown:ill-formed-unicode`, documented in §4a and in the module's own header.
- **Even without Markdown punctuation.** The composer tests assert the mutated value carries no Markdown character at all, so
  the refusal cannot be attributed to a Markdown construct — it is the well-formedness decision.
- **Both forms of every Markdown-capable field.** The plain form is a publication form, so it cannot be laxer than the
  Markdown form: a `markdown`-less hero `lede`/`support`, stats `detail` or timeline `description` now refuses malformed text
  instead of falling back to literal rendering.
- **No broadening.** Native plain fields keep their previous contract (a lone surrogate is counted once and accepted); field
  bounds, the plain-text counting tests, destination policy and every Markdown feature are unchanged.
- **Recorded remaining scope.** Native plain-text fields still accept a lone surrogate by contract, and a hand-authored
  native hero/stats/timeline node that declares `markdown: true` but carries unparseable Markdown still renders literally at
  render time. Neither is claimed closed and no universal text validation is claimed. `src/core/efs/uno-page-header.ts`
  keeps its own pre-existing surrogate scan; it is outside this order's ledger and unchanged.

## 4. Local verification (executed in this run, in this order)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` (unit, vitest) | **1,334 / 1,334**, 35 files (was 1,313 at the start SHA) |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged and still exact |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **343 / 0** (was 342; +1 audit mutation test) |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **840 passed / 0 failed** (was 838; +2 new checks) — `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, `U04_MODULE_IDS=22/22`, `U04_ASSET_ZONES=4/4`, `U04_BROWSER_MATRIX=16/16` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — `phase one verified byte-exactly · phase two verified byte-exactly` |

The production gate ran the real `next build` + `next start` + Chromium path: the malformed-Unicode probes refuse the whole
source with no partial Page, the four-case browser matrix and the rights evidence are unchanged for all eight credited
families, and the fixture was restored byte-exactly afterwards. No gate was skipped, softened or made non-blocking.

## 5. Risks

1. **One rule, one failure mode.** Because bootstrap and architecture share the README rules and the reader, the composer and
   the Markdown reader share this decision, a future weakening is edited once and lands everywhere at once. That is the
   intended anti-drift property, and it is also why the rule is pinned by positive **and** refusal tests at three layers.
2. **Enumerated surface, not universal validation.** The rule covers every Markdown-capable field the reader accepts today;
   a future Markdown-capable field must remember to use `readMarkdownCapableText`. The gate's presence check and the unit
   suites fail loudly for the current fifteen surfaces, but they cannot detect a surface that does not exist yet.
3. **Native plain fields remain unvalidated by contract.** A lone surrogate in a title, quote or label is still accepted and
   still counted once; publishing such a value is a pre-existing, documented limitation this order deliberately did not widen.

## 6. Disposition

`U04` remains **OPEN**; this order fixed a verification defect and added no family credit. `U04_PARITY` stays at the credited
B1 row `8/17` and `U04_PROXY` at `50/59` — nine families remain pending, including the five the order did not touch. No
dependency, workflow, oracle, durable Page, deployment declaration, external repository or provider was changed, and nothing
was released or deployed. Stopping for independent Architect review.

## 7. Hosted verification at the exact product head

Product commit `14e66d83b7f48cf675fa90acb806d2cc75675f3d` (`1bf835f..14e66d8`), one non-force push to Uno `main`.

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45555178292](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45555178292) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |
| `Uno Bootstrap Verify` | [45555178112](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45555178112) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |

Both hosted workflows ran at this exact head on both operating systems, including `Verify Owner-frozen governance files
(positive and refusal)`, `Bootstrap governance gate`, `Architecture boundaries`, `Unit tests`, `Production build`, `Multi-Site
P6 contract (mutation-sensitive)`, `Verify U04 A1 JSON Page vertical slice`, `U04 22-module consent hermetic guard` and
`Verify U04 22-module and four-provider consent (real production HTTP and Chromium)` — so the shared well-formedness decision,
the new closed reason and the retained credits are proven on Linux and Windows, not only locally. The report-only commit that
publishes this record changes no gate input.

