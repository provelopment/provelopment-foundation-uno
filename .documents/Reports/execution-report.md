# Execution Report — UNO-WO-112 / R01

**Outcome: DELIVERED — `PARITY_HERO=PASS`, `U04_PARITY=6/17`, `U04_PROXY=48/59`, with the five earlier families still `PASS`, proven at the exact product SHA on both hosted operating systems.**

| | |
| --- | --- |
| Order | `UNO-WO-112 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **2,947 bytes**, SHA-256 `cc413978936bffbe13f9418d12343a58228cd91790e3ea3b6c38b570422b6904` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `f7197ce6c26812a011d504634e73e7922a737eb2` (`HEAD` = `main` = `origin/main` = `ls-remote`, clean tree, one worktree, one Uno `origin`) |
| Product SHA | **`2e3eb10e3ff062e4b81458bbe3251015c7fa4ebc`** |
| Credited families | `prose`, `callout`, `table`, `list`, **`hero`**, `divider` → **`6/17`**, **`48/59`** |
| Not claimed | the full B1 `8/17` row: `stats` and `steps` stay `PENDING` |

## 1. Hero parity (the substantive surface)

The approved donor Hero is `{type, eyebrow?, lede?, actions?, support?, align?, surface?}` with `hero.lede` and `hero.support`
listed as Markdown-capable fields. Three genuine gaps were repaired, end to end, in the authorized trees only.

**Strict reader (`src/core/page-document.ts`).** `content.hero` gained the donor's action surface and the adapter's own
Markdown switch:
- `UnoHeroActionItem` is a closed union of the unchanged same-document `{label, targetId}` and the static outbound
  `{label, href}`, each with an optional `primary`/`secondary`/`link` variant. Exactly one destination form is admitted; a
  mixed or destination-less entry is a props refusal before any label is read; an unsafe scheme or relative destination is
  the existing `document:unsafe-link` refusal through the unchanged `classifyAuthorDestination`. Fragment targets still
  register for the existing anchor check, so `content.actions` and every earlier hero stay byte-identical.
- `markdown?: true` is a closed literal; anything else is a props refusal.

**Composer (`src/application/compose-uno-foundation-families.ts`).** The bounded hero becomes the donor's own surface:
`lede` is no longer required (one of `lede`/`support` must exist), both body fields are read as Markdown-capable at the Uno
target's own 4000-code-point bound, the closed `align`/`surface` pair is copied as authored, and 1–3 `actions` compose with
their static safe `href` and closed variant. `route`/`link` action destinations and a body-less hero remain refusals:
site-local route projection belongs to the serving boundary (outside this order's authorized scope) and an application link
is inert elsewhere. `markdown` is set only when one of the two fields actually authors Markdown.

**Renderer (`src/components/uno-page-sections.tsx`).** A plain field keeps the byte-identical `<p>`; a `markdown` hero
renders both bodies through the same shared family Markdown renderer the table, list and prose already use. Actions render
as one ordinary `<ul class="uno-json-actions uno-json-hero-actions">`: an outbound anchor carries
`rel="noreferrer noopener"` and `data-uno-variant`, and a fragment keeps `#<section-id>`. No form, button, iframe or script.

**Evidence.** `localA2.hero` is a seven-dimension record filled only by executed checks: composed source, reader
round-trip, served React markup, real production HTTP, a four-case Chromium conjunction (light and dark/reduced-motion at
390 px and 1280 px), six whole-source hero refusals (`javascript:`, relative destination, unknown variant, `route`, four
actions, no body) and the rights invariants (no donor path, no declaration key, no control). The unchanged oracle then
credits exactly `prose, callout, table, list, hero, divider` at `6/17` / `48/59`; A1 (`3/17`), the interim four-family row
(`4/17`) and A2 (`5/17`) all remain as regressions.

## 2. Reusable verification modules (the required engineering work)

The entrypoint was **not** extended into a fifth family monolith. Four cohesive modules now hold what the entrypoint only
orchestrates, each independently testable and each genuinely invoked by the gate:

| Module | Lines | Responsibility |
| --- | --- | --- |
| `scripts/u04/family-fixture.mjs` | 236 | the one donor source, bindings, hero actions, ids and `composeFamilyFixture(adapter)` |
| `scripts/u04/hero-evidence.mjs` | 138 | Hero expectations, served-region/action parsers, the composite predicate and the refusal matrix |
| `scripts/u04/family-evidence.mjs` | 54 | the seven-dimension record, `isCreditable`, and the four-case `conjunction`/`conjunctionDetail` |
| `scripts/u04/serving-harness.mjs` | 105 | pinned-CLI lookup, free port, bounded child run, readiness wait, best-effort kill |

The entrypoint imports all four (`composeFamilyFixture(composeUnoFoundationSubset)`, `createFamilyEvidence()` per credited
family, `conjunction(...)` for every browser dimension, `heroServed`/`heroActionsOf` for HTTP and one `waitForServer`,
`runChild`, `freeLoopbackPort`, `nextBinPath`, `killChild` call each). No assertion was duplicated: the two table/list
conjunctions were rewritten onto the shared helper, and the hero's expectations live once for the gate and the tests.
`tests/unit/u04-verification-modules.test.mjs` (207 lines, 13 tests) executes the real adapter against the real fixture and
every predicate, including each refusal case and the harness's exit-code and cleanup behaviour.

## 3. Documentation

`.documents/Architecture/u04-family-parity.md`: the aggregate now reads **six** fully parity-evidenced candidates with
**eleven** still bounded, the `hero` row is rewritten as `PARITY (UNO-WO-112 / R01)` with its real accepted fields,
deliberate refusals, output and evidence, and the narrative no longer claims hero actions or a required `lede` are refused.
The unit tests that pin the ledger text were updated, including a positive `6/17` pin and the `8/17` prohibition.

## 4. Local gates (all green)

| Gate | Result |
| --- | --- |
| `verify-u04-22-module-consent.mjs` (real build/start + Chromium) | **828 passed / 0 failed**; `PARITY_HERO=PASS`, `6/17`, `48/59` |
| `verify-u03-multisite-http.mjs` (three Sites, both phases, restored) | **179 passed / 0 failed**, both phases byte-exact |
| `u03-multisite-contract` + `u04-22-module-consent` + `u04-family-closure` | **101 passed / 0 failed** |
| `pnpm test` | **1,302 / 1,302** (13 new module tests) |
| `pnpm test:architecture`, `pnpm typecheck`, `pnpm lint` | **47 / 0**, exit 0, exit 0 |
| Declarations after every run | `manifest` `b6213ed6…`, `config` `58011c43…` |

## 5. Hosted proof at `2e3eb10`

Both required workflows were green at the exact product SHA, on both hosted operating systems:

| Workflow | Run | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- | --- |
| `Verify U01 baseline` | **45376285173** | success | success |
| `Uno Bootstrap Verify` | **45376285164** | success | success |

Read out of the **actual** hosted logs, on both systems:

```text
verify-u03-multisite-http: 179 passed, 0 failed
verify-u04-22-module-consent: 828 passed, 0 failed
PASS  U04_LABEL PARITY_PROSE=PASS
PASS  U04_LABEL PARITY_CALLOUT=PASS
PASS  U04_LABEL PARITY_TABLE=PASS
PASS  U04_LABEL PARITY_LIST=PASS
PASS  U04_LABEL PARITY_HERO=PASS
PASS  U04_LABEL PARITY_STATS=PENDING
PASS  U04_LABEL U04_PARITY=6/17
PASS  U04_LABEL U04_PROXY=48/59
```

The untouched regression gates are green in the same logs on both systems: `verify-u01-http` 105/0, `verify-u03-http` 135/0,
`verify-u03-published-http` 999/0, `verify-u04-json-slice` 477/0.

## 6. State and next

`Hero` is credited at the interim **`6/17` / `48/59`** row, with `table`, `list`, `prose`, `callout` and `divider` preserved
and `stats`/`steps` still `PENDING`; the full B1 `8/17` row is explicitly **not** claimed. `U04` remains **OPEN** — this is
an interim family count, not stage closure, release or deployment, and the Owner separately decides those. No workflow,
closure oracle, permanent declaration, protected governance file or other family's behaviour was changed. The product commit
was pushed non-force and this single sanitized report is overwritten. The run stops here for independent Architect review.

