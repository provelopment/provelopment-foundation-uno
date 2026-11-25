# Execution Report — UNO-WO-118 / R01

**Outcome: COMPLETE — FAQ is the tenth parity-evidenced Foundation family. `PARITY_FAQ=PASS`, `U04_PARITY=10/17`, `U04_PROXY=52/59`, all nine prior family credits preserved, the shared Markdown and Unicode protections intact, concurrent publication regressions untouched, and every mandatory local gate green. B1 remains earned; B2 and U04 remain OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-118 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **4,152 bytes**, SHA-256 `7fa972511b7597458c9e1995e661bb792ff703dadf8d0aa7518c5620cc87ad71` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `d1bbf5ef621301d1e122adb0b4232b8923a68d7e` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Donor pins | `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`; schema `a12d964c43626c6313a621bf628f5cc24b65d444`; `structure-sections.tsx` `65d254e192a6a8ef4886590026c2ea58e02264be` — unchanged, read-only |
| Oracle | unchanged `scripts/verify-u04-family-closure.mjs`: A1 `3/17`, A2 `5/17`, B1 `8/17` / `50/59`, Quote interim `9/17` / `51/59`, FAQ interim `10/17` / `52/59` |

## 1. What the donor specifies, and what closed

The donor `faq` schema spreads `headingFields`, carries the closed `surfaceField`, and accepts **1–24** ordered
`{question, answer}` items: the question is plain, the answer is **Markdown**. Its renderer draws each question as a
**level-3 heading inside its own native `<details>/<summary>`**, each answer as Markdown, with the authored heading and lede
before the group. Four gaps closed:

- **Markdown answers.** An answer is read at the donor's own 4,000 code-point limit through the shared `readUnoFamilyMarkdown`,
  flagged `markdown: true` only when it actually authors Markdown, so unsafe or unparseable constructs (raw HTML, images,
  unbalanced emphasis, `javascript:`/protocol-relative destinations) refuse the whole Page instead of being printed, and a
  plain answer keeps the byte-identical escaped `<p>`.
- **Markdown lede.** The `faq` lede joins the Markdown-capable surface and is read by the *same* lede reader the five
  `headingFields` families have always used, so its refusal vocabulary and every neighbouring family's reasons are unchanged.
- **Closed surface.** `interaction.accordion` gained the donor's closed `surface` — one `data-uno-surface` on the disclosure
  group wrapper, absent means no attribute at all, so every accordion authored before this order is byte-identical.
- **The donor's 24-item ceiling, without raising a bound.** The ordinary accordion group is *still* 1–8 panels: a
  hand-authored nine-panel accordion is refused by the strict reader exactly as before, and no global guard was touched.
  A 9–24-entry FAQ is composed as **consecutive ordinary groups** of at most eight, in authored order, each entry naming the
  answer child it owns by the identity it already had (`family-N-faq-answer-<i>`); one group keeps the documented root
  identity (`family-N-faq`, or `family-N-faq-accordion` under authored heading/lede), so every input that fitted before is
  byte-identical. Boundaries proved: `1`, `8` → one group; `9` → `8+1`; `24` → `8+8+8`; `25` → `family:target-refused`; a
  nine-panel accordion → still refused.
- **Native behaviour preserved.** Every disclosure is the platform's `<details class="uno-json-disclosure">` with its question
  as `<h3>` in its own `<summary>`; all are initially closed, opened and closed by keyboard, and independent of one another.

## 2. Seven executed dimensions (nothing asserted without an execution)

| Dimension | Execution |
| --- | --- |
| `source` | the real adapter composes `family-3-faq` as the authored heading + Markdown lede + one disclosure group whose props equal `faqNodeProps()` (surface, `summaryHeadingLevel: 3`, both positional entries) and whose children are the two owned answers, in order |
| `reader` | the composed document is serialized and re-read: the stack, the Markdown lede with its switch, the group's props and the per-answer prose props are byte-equal with identical keys, and the document is frozen |
| `renderer` | the served region predicate: heading, Markdown lede through the shared renderer, `data-uno-surface` on the group, one `<details>` per item with `<summary><h3>question</h3></summary>`, the first answer's real `<strong>` and `<a rel="noopener noreferrer">`, the second answer's plain `<p>`, no `open`, control, form, frame or extra heading level |
| `http` | the same predicate over the real production response at `/en-001/wo066-family-composition` (status 200) |
| `browser` | four real Chromium cases (390/1280 × light/dark-reduced): questions in authored order as level-3 headings, closed surface, owned Markdown answer with `rel`, one plain answer, all disclosures closed, both opened and closed by keyboard **independently**, no control, no overflow |
| `refusal` | thirteen whole-source cases with their own closed reasons and no partial document, plus the 1/8/9/24/25 boundary and the untouched nine-panel refusal |
| `rights` | no donor asset identity, no declaration key, no second `main`/`h1`, no form, frame, image, script or invented open state |

## 3. Authorized changes (10 modified + 1 new, plus this sole report)

`git diff --stat` before the report overwrite: 10 files changed, 899 insertions, 127 deletions, plus the new
`scripts/u04/faq-evidence.mjs`. No workflow, frozen governance file, closure oracle, dependency, durable Page, deployment
declaration, stylesheet or other repository was touched, and no new registered module was created.

| Path | Change |
| --- | --- |
| `src/core/page-document.ts` | `UNO_PAGE_DOCUMENT_LIMITS.faqItems: 24` (documented as the donor ceiling, **not** an accordion bound); `UnoInteractionAccordionProps.surface`; the accordion reader accepts the closed `surface` and emits it only when present, with the 1–8 panel bound untouched |
| `src/application/compose-uno-foundation-families.ts` | the `faq` case composes the heading + Markdown lede + consecutive ordinary groups (`accordionChildren` as the chunk size), Markdown answers via `readRichFamilyText(…, 4000)`, the closed `surface`, an explicit 160-code-point question bound, and the documented root/child identities; `wrapAuthoredText` gained an optional `ledeReader` so `faq` keeps the five-family lede vocabulary |
| `src/components/uno-page-sections.tsx` | the accordion renders `data-uno-surface` when authored and nothing when not; every existing attribute, `<details>`/`<summary>` structure and heading level is unchanged |
| `scripts/u04/family-fixture.mjs` | new `FAQ_SOURCE` export — plain heading, Markdown lede, closed surface, two ordered items (one Markdown answer with a safe link, one plain) — consumed at index 3 |
| `scripts/u04/faq-evidence.mjs` | **new:** the authored expectations, the exact node props, the region/disclosure parsers, the seven-dimension served predicate, the composed-layout helper and the thirteen-case refusal matrix |
| `scripts/verify-u04-22-module-consent.mjs` | the FAQ record and browser-case set; six dimensions; the boundary proof; two served checks; light and dark Chromium cases plus the independence assertions; kept the B1 and Quote-interim regressions (`PARITY_FAQ=PENDING` in both) and added the checkpoint-free ten-family interim whose labels are printed and re-derived; the evidence label becomes `…QUOTE_FAQ_EVIDENCE=49/49`; affected FAQ pins now derive from the fixture module |
| `tests/unit/page-document.test.ts` | new accordion suite: the closed `surface` accepted, absent exactly absent, eight wrong values refused; the ordinary 1–8 panel bound and its nine-panel refusal; JSON round-trip |
| `tests/unit/uno-foundation-families.test.ts` | FAQ refusal suite re-expressed for Markdown answers and the accepted surface; new parity suites covering 1/8 one group, 9 → `8+1`, 24 → `8+8+8`, 25 refused, order and answer ownership, Markdown-versus-plain answers, the authored surface and its absence, rendered `strong`/link/no `open`; five-family lede rules now shared by all five; ledger pins moved to ten credited / seven bounded / `10/17` / `52/59` |
| `tests/unit/uno-page-sections.test.ts` | the authored FAQ surface, both level-3 questions, the parsed Markdown answer inside its own disclosure, the plain answer unchanged, no `open` and no `<button>` |
| `tests/deployment/u04-22-module-consent.test.mjs` | the FAQ module, record, six dimension assignments, predicates, boundary, check names, the ten-family oracle row and the B1/Quote-interim `PARITY_FAQ=PENDING` regressions added as required tokens; `49/49` evidence label; the retired single-question `h3` count and plain FAQ lede replaced by fixture-derived expectations; six FAQ neutering mutations |
| `.documents/Architecture/u04-family-parity.md` | ten credited / seven bounded; the FAQ row is now `PARITY (UNO-WO-118 / R01)` with donor evidence, accepted fields, refusals, output and proof; a new subsection records the Markdown lede/answers, the surface, the 24-item representation without a raised bound, the question-bound audit and the per-group surface consequence; §5/§6 updated; B2 explicitly not claimed |


## 4. Local verification (executed in this run)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` (unit, vitest) | **1,364 / 1,364**, 35 files (previous head: 1,357) |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged and still exact |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **343 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **864 passed / 0 failed** (previous head: 850) — `PARITY_FAQ=PASS`, the nine prior families `PASS`, `U04_PARITY=10/17`, `U04_PROXY=52/59`, `22/22`, `4/4`, `16/16` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — `phase one verified byte-exactly · phase two verified byte-exactly` |

The production gate ran the real `next build` + `next start` + Chromium path, so every FAQ dimension above was executed
against the installed bytes, the fixture was restored byte-exactly and the closure oracle was not touched. (Two gates were
briefly run concurrently by this agent and collided on the shared `.next` build directory; both were re-run sequentially and
passed. Nothing was changed to accommodate that.)

## 5. Risks

1. **Several groups for 9–24 items.** The donor draws one list; Uno draws consecutive ordinary groups of at most eight,
   because the accordion bound must not be raised. Order, questions, answer ownership and identity are preserved, but the
   authored `surface` is consequently carried by **each** group rather than once around all of them, and a very long FAQ
   shows grouped disclosure blocks instead of a single uninterrupted list. Both consequences are recorded in the ledger.
2. **Question bound is Uno's label bound.** A donor question longer than 160 code points is refused (`family:target-refused`)
   rather than widened; the adapter enforces it explicitly so the refusal is the family's own.
3. **Markdown switch is per node.** An accordion carries Markdown-bearing prose children composed by the adapter, so a
   hand-authored mixed accordion must declare the flag on those children exactly as the adapter does; no answer is ever
   silently downgraded to literal text.
4. **B2 stays Open.** `quote` and `faq` are credited at checkpoint-free interim rows (`10/17` / `52/59`); the declared B2
   target also requires `columns` and is deliberately not asserted.

## 6. Disposition

`U04` remains **OPEN**; ten of seventeen families are parity-evidenced, seven remain bounded subsets, and B1 remains the
earned row. No dependency, workflow, oracle, frozen governance file, durable Page, deployment declaration, external
repository or provider was changed, and nothing was released or deployed. Stopping for independent Architect review.


## 7. Hosted verification at the exact product head

Product commit `07f4e8c7ee12748f386751e07ae1526949ef78db` (`d1bbf5e..07f4e8c`), one non-force push to Uno `main`.

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45572576214](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45572576214) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |
| `Uno Bootstrap Verify` | [45572575957](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45572575957) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |

Both workflows ran at this exact head on both operating systems, including `Verify Owner-frozen governance files (positive and
refusal)`, `Bootstrap governance gate`, `Architecture boundaries`, `Unit tests`, `Production build`, `Multi-Site P6 contract
(mutation-sensitive)`, `Verify U04 A1 JSON Page vertical slice`, `U04 22-module consent hermetic guard` and `Verify U04 22-module
and four-provider consent (real production HTTP and Chromium)` — so the FAQ credit, the nine retained family credits, the
concurrent-publication regressions and the shared Markdown/Unicode protections are proven on Linux and Windows, not only
locally. The report-only commit that publishes this record changes no gate input.

