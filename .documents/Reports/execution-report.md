# Execution Report — UNO-WO-114 / R01

**Outcome: DELIVERED — `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, the declared B1 row earned through the unchanged oracle, with all seven earlier credits and every prior checkpoint regression preserved.**

| | |
| --- | --- |
| Order | `UNO-WO-114 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **2,786 bytes**, SHA-256 `49c34be612ee0ad09ee8983d0739b4190818bbe56983c92898d47597da3b83d7` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `8d3355dca702e03a13be95ec717edeb0534a5ccf` (`HEAD` = `main` = `origin/main` = `ls-remote`, clean tree, one worktree, one Uno `origin`) |
| Product SHA | **`729d94bfc7b4591e39c922903fc565516834e334`** |
| Credited families | `prose`, `callout`, `table`, `list`, `hero`, `stats`, **`steps`**, `divider` → **`8/17`**, **`50/59`** |
| Checkpoint | **B1** — enforced by the unchanged oracle's own declared target, not re-declared here |

## 1. Steps parity (the substantive surface)

The pinned donor contract is `stepsSectionSchema = {type, ...headingFields (optional plain heading, Markdown-capable lede),
items: 1–12 of {title, body?}, ...surfaceField}` with `stepItemSchema.body` typed `markdownTextSchema`, rendered by
`StepsSection` as a `SectionHeading` over a native `<ol>` whose items are a level-3 title plus an optional Markdown body.
The Uno timeline already matched the donor on item count (12), closed `surface`, the level-3 item outline and native
ordered-list semantics, so two genuine gaps were closed end to end:

- **Markdown-capable lede.** `steps` now reads its donor `lede` through the same shared family Markdown reader the credited
  `prose`, `table`, `list`, `hero` and `stats` families use, and composes it as `content.prose {text, markdown: true}`
  inside the existing authored-text stack. A plain lede keeps the **byte-identical** `content.prose {text}` child.
- **Markdown-capable item body.** The strict reader (`src/core/page-document.ts`) gained the closed `markdown?: true`
  switch on `content.timeline`, and the composer sets it only when an authored body actually carries Markdown (read at the
  Uno target's own 320-code-point description bound). The renderer draws it through the one shared family renderer
  (`<div class="uno-json-timeline-description">` + `<strong class="uno-family-md-strong">`), while an unflagged body keeps
  the escaped `<p>` of the earlier accepted output.

Nothing was invented: no status, current step, `aria-current`, date, icon, destination, ordinal marker or extra heading is
manufactured, and the native `<ol>`/`<li>` semantics, decorative marker and authored order are unchanged.

**Evidence.** `localA2.steps` is a seven-dimension record filled only by executed checks: composed source, strict-reader
round-trip, served React markup, real production HTTP (`stepsServed` + an independently parsed ordered-item list), the
four-case Chromium conjunction (light and dark/reduced-motion at 390 px and 1280 px), seven whole-source steps refusals and
the rights invariants. The unchanged oracle then credits exactly `prose, callout, table, list, hero, stats, steps, divider`
at B1 `8/17` / `50/59`; A1 (`3/17`), four-family (`4/17`), A2 (`5/17`), six-family (`6/17`) and seven-family (`7/17`) all
remain as regressions.

## 2. The reusable verification modules (extended, not rewritten)

The runner remains an orchestrator. The Steps family reuses the same modules the Hero and Stats families established and
adds one cohesive module of its own:

| Module | Lines | Responsibility |
| --- | --- | --- |
| `scripts/u04/steps-evidence.mjs` | **181** | Steps expectations derived from one fixture definition, the served-region and ordered-item parsers, the seven-dimension predicate and the seven-case refusal matrix |
| `scripts/u04/stats-evidence.mjs` | 162 | unchanged Stats expectations and predicates |
| `scripts/u04/hero-evidence.mjs` | 138 | unchanged Hero expectations and predicates |
| `scripts/u04/family-evidence.mjs` | 54 | the seven-dimension record, `isCreditable`, the four-case `conjunction` |
| `scripts/u04/serving-harness.mjs` | 105 | pinned-CLI lookup, free port, bounded child run, readiness wait, best-effort kill |
| `scripts/u04/family-fixture.mjs` | 259 | adds the exported `STEPS_SOURCE` and authors index 11 from it |

`stepsNodeProps()` is **derived** from the fixture rather than retyped, so the runner, the served-HTTP assertion and the
unit tests cannot drift. `tests/unit/u04-verification-modules.test.mjs` (393 lines, 21 tests) executes the real adapter
against the real fixture, both parsers, both predicates' accept/reject cases and every refusal case.

## 3. Documentation

`.documents/Architecture/u04-family-parity.md`: the aggregate now reads **eight** fully parity-evidenced candidates with
**nine** still bounded, the `steps` row is rewritten as `PARITY (UNO-WO-114 / R01)` with its real accepted fields (Markdown
lede and body, the closed surface, the 12-item bound), its deliberate refusals, its output and its evidence, the
`stats`/`steps` narrative records that `UNO-WO-113 / R01` and `UNO-WO-114 / R01` supersede the bounded half for both
families, section 6 now reports nine bounded shapes, and the HTTP/browser paragraph describes the Steps Markdown lede, body
and surface. The unit tests that pin the ledger text were updated (positive `8/17` and `50/59`, `9/17` still forbidden, the
bounded-mode count now zero, `Nine of the seventeen remain bounded`).

## 4. Local gates (all green)

| Gate | Result |
| --- | --- |
| `verify-u04-22-module-consent.mjs` (real build/start + Chromium) | **838 passed / 0 failed**; `PARITY_STEPS=PASS`, `8/17`, `50/59`, 35/35 evidence |
| `verify-u03-multisite-http.mjs` (three Sites, both phases, restored) | **179 passed / 0 failed**, both phases byte-exact |
| `u03-multisite-contract` + `u04-22-module-consent` + `u04-family-closure` | **101 passed / 0 failed** |
| `pnpm test` | **1,313 / 1,313** (21 extracted-module tests) |
| `pnpm test:architecture`, `pnpm typecheck`, `pnpm lint` | **47 / 0**, exit 0, exit 0 |
| Declarations after every run | `manifest` `b6213ed6…`, `config` `58011c43…` |
| Governance bytes | `verify-governance-docs` PASS (`AGENTS.md`, `README.md`, SOP) |

## 5. Hosted proof at `729d94b`

| Workflow | Run | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- | --- |
| `Verify U01 baseline` | **45416405115** | success | success |
| `Uno Bootstrap Verify` | **45416405074** | success | success |

Read out of the **actual** hosted logs, identically on both systems:

```text
verify-u01-http: 105 passed, 0 failed
verify-u03-http: 135 passed, 0 failed
verify-u03-published-http: 999 passed, 0 failed
verify-u03-multisite-http: 179 passed, 0 failed
verify-u04-22-module-consent: 838 passed, 0 failed
PASS  U04_LABEL PARITY_HERO=PASS
PASS  U04_LABEL PARITY_STATS=PASS
PASS  U04_LABEL PARITY_STEPS=PASS
PASS  U04_LABEL U04_PARITY=8/17
PASS  U04_LABEL U04_PROXY=50/59
```

## 6. Outstanding risks (disclosed)

1. **Out-of-band `README.md` modification, reverted.** During this run the working copy's `README.md` was replaced with
   Foundation-oriented text by a process outside this agent's edits (no command in this run targets it). `AGENTS.md` and
   the SOP were untouched. The file was restored to its committed frozen blob (`690f0870…`) with `git checkout --`, the
   frozen bytes were re-verified with `verify-governance-docs` (**PASS**), the architecture gate returned to **47/0**, and
   the published commit carries the unchanged blob. No edit to a frozen governance file was authored, staged or pushed, but
   the Architect should confirm the mechanism, since the same mechanism could reappear.
2. **Shared Markdown-path well-formedness.** The rich Markdown reader used by the credited `table`, `list`, `hero`, `stats`
   and now `steps` families refuses markup, images, unsafe schemes, control characters, padding and bounds but does not
   reject an unpaired surrogate (the *plain* reader does). That acceptance predates this order and is identical across all
   five rich families, so Steps matches existing behaviour exactly; tightening it would change four already-credited
   families and is therefore left to a future explicit order rather than taken here. The affected probe was replaced with a
   still-refused Markdown case, and the observation is recorded for the Architect.
3. **Donor presentation not adopted.** The donor's decorative `aria-hidden` ordinal marker and `SectionHeading` typography
   are not reproduced; Uno relies on native `<ol>` semantics, as it already does for the accepted timeline.

## 7. State and next

`Steps` is credited on the declared **B1** row at `8/17` / `50/59`, with `hero`, `stats`, `table`, `list`, `prose`,
`callout` and `divider` preserved and every earlier checkpoint regression still green. `U04` remains **OPEN** — B1 is an
interim checkpoint, not stage closure, release or deployment, and the Owner separately decides those. No workflow,
closure-oracle, permanent declaration, protected governance file, committed durable Page or other family's behaviour was
changed. The product commit was pushed non-force and this single sanitized report is overwritten. The run stops here for
independent Architect review.

