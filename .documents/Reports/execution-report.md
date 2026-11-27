# Execution Report — deployment integrity restored, C2 preserved

**State: local work verified; one commit unpushed.** Local `main` carries `58ac18c` (published) plus this increment. Nothing was pushed, released, deployed or published in this increment. Hosted CI at the corrected SHA is therefore still unverified — see *Authorization*.

## Confirmed root cause of the hosted failure

Both hosted jobs failed at `Run production HTTP and browser (U03 published Pages, restored afterwards)` with:

```text
FAIL  DURABLE_FAMILY_SOURCE the appended sections are the composer's own output
verify-u03-published-http: the durable family source proof failed; no build was attempted.
verify-u03-published-http: 68 passed, 1 failed
```

The durable Page is deliberately never rewritten (`UNO-WO-123 / R06`), so it still carries the *historical* Features outline — a `layout.stack` wrapper with an authored level-2 heading, a plain prose lede and an ordinary `layout.grid` of `itemSemantics: "list"` stacks — while the adapter now composes the accepted native `layout.grid` **features** node (`UNO-WO-125 / R05`). The unit suite and the C2 evidence knew that three sections differ; the production verifier still permitted only two:

```text
committed vs composed differing ids: ["family-5-gallery","family-15-cards","family-16-features"]
verifier permitted:                  ["family-5-gallery","family-15-cards"]
```

Reproduced with the real gate before any edit (log above), and independently with a differential probe over the real composer and the committed bytes. The defect was a stale allow-list in one production predicate, not a fault in the Features implementation, the durable Page or the composer.

## Exact changes

- `scripts/u03/durable-features-equivalence.mjs` (new): one pure comparator, `featuresEquivalenceDelta`, deciding eight load-bearing clauses between the historical wrapper and the native node — stable identity and module pairing; representation (three committed children, authentically childless native node whose empty consumer list is non-enumerable); authored heading and its level 2 on both sides; authored lede with no invented Markdown declaration; authored column intent; unit count, order and titles against the level-3 title contract; absence of body, bodyMarkdown, icon, meta, image, action and surface; and closed authored key sets on both sides, so a dropped field and an extra field both fail.
- `scripts/verify-u03-published-http.mjs`: the appended-section predicate now permits exactly the three representation differences and still requires every other appended section to be byte-identical; a new semantic check credits Features only when the comparator holds **and** the composed node is recognised as a native features grid; a second check requires the composed node to be childless and to survive the strict Page reader round-trip; the served-HTML phase now pins the Features family to its authored heading, lede and three unit titles in order and requires the native icon treatment to be absent.
- `tests/deployment/u03-durable-features-equivalence.test.mjs` (new): 38 assertions over the real fixtures. One test pins the baseline as eight true clauses; one refuses a missing node; 36 mutation cases each require a named clause to fail after altering, dropping, adding or reordering units, altering headings, levels, lede or columns, inventing an icon, body, meta, action or surface, crossing a module or id, authoring a native `children` list, adding a wrapper child, adding a wrapper prop, or dropping the committed grid.
- `tests/deployment/u04-22-module-consent.test.mjs`: the hermetic guard now requires the new labels, the comparator import and call, the reader acceptance, the childless requirement and the served icon refusal, and its neutering list proves each clause is load-bearing.

## Security

A fresh full-graph audit reported one moderate development-only finding absent from the earlier record: `GHSA-g3hv-75wg-m249` on `minimatch` (`>=7.0.0 <11.0.1`), reachable only through `@typescript-eslint/*`. A patched range is published, so the repair was adopted instead of waived: `@typescript-eslint/parser` and `typescript-eslint` moved 8.72.2 → 8.74.0, which depends on `minimatch ^11.0.1`. No override, no suppression and no waiver was added. `pnpm audit` now reports **no known vulnerabilities** on the unfiltered graph; the production audit was already clean. The retired picomatch disclosure is preserved as history in `pnpm-workspace.yaml`; it was never repaired, only retired from the reported graph. The review date 2026-12-18 needed no extension because nothing was extended.

## Executed verification (local, Node 26.13.1, pnpm 11.6.0)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | clean |
| `pnpm audit --prod --audit-level high` / `pnpm audit --audit-level high` | clean / **no known vulnerabilities** |
| Node 26, security-floor, brand-copy and exception suites | 31 pass; exception guard ACCEPTED |
| Bootstrap | 19 tests, scaffold verifier OK |
| Architecture | 47 pass |
| Lint / typecheck | clean, no suppressions |
| Unit | 1427 pass, 36 files |
| Deployment suites | **388 pass, 0 fail** (349 + 38 new equivalence + 1 minimatch repair) |
| U04 JSON vertical slice (test + production HTTP/Chromium) | pass, byte-exact restoration |
| Production build / bounded trace | compiled, zero warnings; only declared inputs ship |
| U01 production HTTP | OK |
| U03 locale and discovery refusals | OK |
| U03 published Page HTTP + Chromium | **1005 pass, 0 fail** (was 68 passed / 1 failed before the build) |
| U03 fixture transaction | 28 pass; fixtures restored byte-exactly |
| Multi-Site contract + HTTP | pass; two-phase restoration byte-exact |
| U04 22-module and consent gate | **969 pass, 0 fail** |
| Closure oracle (unchanged) | C2 reproduced: `U04_PARITY=15/17`, `U04_PROXY=57/59`, `PARITY_FEATURES=PASS`, `PARITY_CARDS=PASS`; closed interim still 14/17 and 56/59 |
| Deployment readiness | PASS, `VERCEL_NOT_DEPLOYED_BY_AGENT` |

## Checkpoint D earned — all seventeen families

The same unchanged evaluator, fed only evidence this run executed, now credits **every** family and returns `U04_PARITY=17/17`
and `U04_PROXY=59/59` under the declared **D** checkpoint, with `PARITY_ACTIONS=PASS` and `PARITY_CONTACTFORM=PASS`. `actions`
and `contactForm` each earned seven dimensions:

| Dimension | `actions` | `contactForm` |
| --- | --- | --- |
| source | Composed `content.actions` with two authored same-document targets, frozen props, ids unchanged | Composed `interaction.contact` with props exactly `{}`, reference validated then discarded |
| reader | Strict reader re-accepting both targets from serialized JSON | Strict reader re-accepting the empty node |
| renderer | Served `<ul class="uno-json-actions">` of two `<li>` and two native `<a>`, authored order, no control | Served `<section class="uno-json-contact">` with only the fixed OFF line, no control or echoed reference |
| http | Accepted production response that delivered the list | Accepted production response that delivered the notice |
| browser | Chromium at 390 and 1280: exactly two reachable same-document links | Chromium at 390 and 1280: visible inert notice plus same-document navigation that reaches it |
| refusal | Seven closed refusals: external, mail and site-route destinations, unknown target, nested target, unknown field, empty label | Six closed refusals: missing acknowledgement, mismatched reference, non-`delivery-off` mode, unacknowledged reference, donor delivery field, invalid grammar |
| rights | Ledger row source identity under the ledger's Apache-2.0 donor declaration | Same provenance chain |

The C2 row (15/17, 57/59), the Cards interim (14/17, 56/59) and every earlier checkpoint stay reproduced as history. The
`features` rights predicate was tightened from a case-insensitive `MIT` match — which "limit" could satisfy — to the ledger's
real chain: the row must name its `page-document.ts` donor provenance and the ledger must declare the donor licence.

Contact remains presentation-only: delivery is switched off, no provider, recipient, credential or submission path exists.

## Hosted CI at the corrected head

`1485354` was pushed non-force (`58ac18c..1485354`) and every check run at that exact SHA completed successfully:

| Check run | Status | Conclusion | Completed |
| --- | --- | --- | --- |
| `verify (ubuntu-24.04)` | completed | **success** | 13:19:35Z |
| `verify (windows-2025)` | completed | **success** | 13:21:06Z |
| `verify (windows-2025)` (bootstrap) | completed | **success** | 13:16:15Z |
| `verify (ubuntu-24.04)` (bootstrap) | completed | **success** | 13:16:04Z |


## Authorization and outstanding work

- `1485354` is pushed and green on both hosts. This increment (the D row and its guard) is local only; a further push needs
  separate Owner authorization.
- U04 remains **OPEN** on its non-family obligations, which family parity does not satisfy: one coherent presentation shell,
  accessible responsive navigation and public Page locale behaviour, keyboard access and visible focus, semantic markup,
  contrast and dark-mode and reduced-motion behaviour, the 320/390/768/1280 matrix, owned-asset licensing boundaries,
  validated configuration and fail-closed behaviour, and the absence of unauthorised publication or data exposure.
- Independent acceptance is the Chief Master Architect's; this report does not self-accept or self-close the stage.

## Proposed U04 closure determination (for independent acceptance)

**Not self-accepted.** Family parity is complete (`17/17`, `59/59`) and the shell, focus, contrast, reduced-motion,
responsive and asset-rights obligations are backed by executed readings at four widths. The proposed determination is:

- **Satisfied:** one shell; keyboard operation and visible focus; semantic markup and interactions; contrast in both
  schemes; reduced motion; responsive operation at 320/390/768/1280; owned-asset confinement, provenance and licensing;
  validated configuration and fail-closed behaviour; absence of unauthorised publication, external delivery or private
  data exposure.
- **Partially satisfied:** accessible and responsive navigation — the shell affords the skip route and the demonstration
  route carries a working on-this-page navigation, but published Pages carry no cross-Page navigation because no Site-level
  label/route source exists in the declarations.
- **Recommendation:** accept U04 on the satisfied obligations with cross-Page navigation recorded as the first U05
  integration item, or return a decision on the navigation source so it can be implemented inside U04.

## Verification this increment (local, Node 26.13.1, pnpm 11.6.0)

| Gate | Result |
| --- | --- |
| U04 22-module, consent and closure | **996 checks, 0 failed** (20 new shell/focus/contrast readings) |
| Published Page HTTP + Chromium | 1005 checks, 0 failed |
| Deployment suites | 394 passed, 0 failed |
| Unit / architecture / bootstrap | 1427 / 47 / 19 pass |
| Lint, typecheck, build, trace | clean, zero warnings |
| Readiness, Multi-Site, U01/U03 HTTP, audit | pass; no known vulnerabilities |


## U04 presentation shell — requirement to evidence

The Owner's eleven exit obligations were audited against the implementation and the executing gates. Only one genuine
implementation gap was found and corrected: the **published** Page shell had a `<main>` with no `id` and no skip
affordance (those existed only on the demonstration route). The route now renders the same `uno-skip-link` targeting
`<main id="main">`, reusing the one stylesheet's existing focus treatment.

| Requirement | Implementation | Executed evidence |
| --- | --- | --- |
| One coherent shell | `src/app/(site)/[...segments]/layout.tsx` (one `<html lang>`), `page.tsx` (skip link, one `<main id="main">`), one stylesheet | U04 gate 320/390/768/1280: exactly one main landmark, one skip anchor first in the body, overflow 0 |
| Accessible, responsive navigation | Demonstration route's `nav.uno-nav[aria-label="On this page"]`; authored in-Page anchors; no cross-Page Site nav source exists | U04 gate: skip-link and landmark behaviour at four widths; in-Page actions/breadcrumb-free targets reach their sections in Chromium |
| Public Page navigation and locale | Serving composition, canonical/`hreflang`/`x-default`, alias redirect, 404 boundaries | Published gate: `/en-001`, `/en-001/about`, `/en-001/components` declare their authored language; x-default only where authored; sitemap and robots agree; Multi-Site gate byte-exact |
| Keyboard operation and visible focus | Global `:focus-visible` 3px token ring; disclosures, tabs, modal and table scroll are keyboard operable | U04 gate: skip link is the first Tab stop, becomes visible, ring is 3px solid `--uno-focus`; Enter lands on `#main`; disclosure/tab/modal focus returns proved |
| Semantic markup and interactions | One `<main>`, one `<h1>`, native `ul/ol/figure/details/blockquote/table` renderers | U04 gate: 17 family ids in order, unique ids, level-3 outlines, native disclosures, table scopes |
| Colour contrast, light and dark | Tokenised palette with `prefers-color-scheme: dark` | U04 gate: measured WCAG ratios at four widths — light and dark, body ≥ 4.5:1, large ≥ 3:1 |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` clamps transitions | 16-case matrix (four widths × two schemes × two motions) plus the dark/reduced family loop |
| Responsive 320/390/768/1280 | Fluid shell, no fixed widths | `MATRIX_WIDTHS` matrix: zero horizontal overflow in all 16 cases |
| Owned-asset confinement and licensing | Owned-media policy, four zones, binding ceilings, ledger provenance | U04 gate: 4/4 zones, 22/22 modules, owned locators only; ledger rows record donor source and Apache-2.0 |
| Validated configuration, fail-closed | Declaration validation, closed refusals, strict reader | Readiness 131 checks; published gate refusals; 22-module refusal matrices; `VERCEL_NOT_DEPLOYED_BY_AGENT` |
| No unauthorised publication or exposure | Delivery-OFF contact, no provider call, no private path or credential in the payload | Readiness and trace gates; U04 gate contact refusals; bootstrap leak scan |

**Outstanding limitation.** Cross-Page navigation is not implemented for published Pages. Building it needs a Site-level
label and route source that the committed declarations do not carry (`uno.config.json` holds no Site name and the Page
contract has no navigation module), so it is a design decision for the Owner rather than something to invent here. The
demonstration route's on-this-page navigation remains the only shell navigation in the tree.


- Gallery and Cards semantic comparisons, the six-section preservation digest, historical Page bytes, owned asset identities, refusal contracts, validation limits and the closure evaluator are unchanged.
