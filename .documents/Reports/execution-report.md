# Execution Report — UNO-WO-117 / R01

**Outcome: COMPLETE — Quote is the ninth parity-evidenced Foundation family. `PARITY_QUOTE=PASS`, `U04_PARITY=9/17`, `U04_PROXY=51/59`, all eight prior family credits preserved, the shared Markdown and Unicode protections intact, concurrent publication regressions untouched, and every mandatory local gate green. B1 remains earned; B2 and U04 remain OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-117 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **3,999 bytes**, SHA-256 `627ef2a7f2e4dcc8b94eee96f6d5a44dafea2a9e59ae5dee4eb0c2ababfbc3a2` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `6d651fc1e771dc1b62b877ae371d2d070752b11b` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Donor pins | `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`; schema `a12d964c43626c6313a621bf628f5cc24b65d444`; `text-sections.tsx` `caeee57798bdd533867e5bef350422618187612f` — unchanged, read-only |
| Oracle | the unchanged `scripts/verify-u04-family-closure.mjs`: A1 `3/17`, A2 `5/17`, B1 `8/17` / `50/59`, and the checkpoint-free interim `9/17` / `51/59` |

## 1. What the donor actually specifies, and what was closed

The donor `quote` schema requires a Markdown-capable `body`, accepts optional **plain** `attribution` and `role` beside the
closed `align`/`surface`, and has **no** `heading` or `lede` (`PAGE_MARKDOWN_FIELDS` lists `quote.body`). Its renderer draws
one `<figure>` with one `<blockquote>`, and a caption **only** when an attribution exists — so a role supplied without an
attribution produces no caption at all. The previous subset refused that shape and rendered every quotation as literal text;
both gaps are now closed:

- **Markdown quotation.** `content.testimonials` gained the closed `markdown?: true` switch. When it is the literal `true`,
  every quotation must parse by the same shared `readUnoFamilyMarkdown` the composer and renderer use, so unsupported or
  unbalanced Markdown (raw HTML, image syntax, unbalanced emphasis, unsafe or protocol-relative destinations) refuses the
  whole Page instead of being printed. The renderer draws the parsed quotation through the one shared family renderer inside
  the same `<blockquote>`; an unflagged node keeps the byte-identical escaped text.
- **Unicode parity.** The quotation is now a Markdown-capable field, so it is held to the one `isWellFormedUnicodeText`
  decision in **both** forms — flagged and unflagged — exactly as every other Markdown-capable field already is.
- **Donor caption rule adopted.** A donor `role` without an `attribution` is read, **validated through the strict reader's own
  caption contract** (a minimal probe node, so the bound and character rules are never duplicated), and then not composed, so
  the Page presents nothing — as the donor does. Suppression is a presentation rule, never a validation exemption: an
  over-length or Markdown-bearing role still refuses the whole source. Ordinary **native** testimonials keep their previous
  contract, including the existing role-only caption.
- **Bounds audited, neither widened nor narrowed.** The donor's 4,000 code-point body limit is exactly Uno's existing
  `textCodePoints`; `attribution`/`role` keep Uno's 160-code-point label bound, which is 40 wider than the donor's 120 — a
  pre-existing Uno bound, retained deliberately and recorded here and in the ledger rather than narrowed inside this order.
- **No donor heading, lede, link, image or collection is accepted**, and the closed field set is unchanged: `type`, `body`,
  `attribution`, `role`, `align`, `surface`.

## 2. Seven executed dimensions (no dimension is asserted without an execution)

| Dimension | Execution |
| --- | --- |
| `source` | the real adapter composes `family-12-quote` as one `content.testimonials` node whose props equal `quoteNodeProps()` derived from the single fixture definition — Markdown body, plain attribution and role, closed `align`/`surface`, `markdown: true` |
| `reader` | the composed document is serialized and re-read by `readUnoPageDocument`; the re-read node's props are byte-equal to the composed props with identical keys, and the document is frozen |
| `renderer` | the served region predicate: one figure, one `<blockquote>` containing the shared renderer's `<strong>`, one caption with separate attribution and role spans, the authored `center`/`bordered` pair, no heading, no destination, control or frame |
| `http` | the same predicate over the real production response at `/en-001/wo066-family-composition` (status 200) |
| `browser` | four real Chromium cases — 390 px and 1280 px, light and dark/reduced-motion — each asserting the parsed quotation (`strong` text, no literal `**`), both caption spans, the closed presentation, no invented heading, zero controls and no overflow |
| `refusal` | twelve whole-source cases through the adapter and four direct-document cases through the strict reader, each with its own closed reason and no partial document |
| `rights` | no donor asset identity, no `example.help` declaration key, no second `main`/`h1`, no form, frame, image or script in the region |

## 3. Authorized changes (10 modified + 1 new, plus this sole report)

`git diff --stat` before the report overwrite: 10 files changed, 695 insertions, 99 deletions, plus the new
`scripts/u04/quote-evidence.mjs`. No workflow, frozen governance file, closure oracle, dependency, durable Page, deployment
declaration or other repository was touched.

| Path | Change |
| --- | --- |
| `src/core/page-document.ts` | `UnoContentTestimonialsProps.markdown`; `readTestimonialItems(value, markdown)` reads the quotation through the shared Markdown reader when declared and through `readMarkdownCapableText` otherwise; the module reads its closed flag once via `optionalProseMarkdown` and emits it only when present |
| `src/application/compose-uno-foundation-families.ts` | the donor `quote.body` is read through `readRichFamilyText(…, 4000)` and flags Markdown only when authored; the donor caption rule is adopted; new `requireQuoteRoleLabel` helper validates a suppressed role with the strict reader itself |
| `src/components/uno-page-sections.tsx` | the testimonials case destructures the switch and draws the quotation through `UnoFamilyMarkdown` inside its own `<blockquote>`; the unflagged path is unchanged |
| `scripts/u04/family-fixture.mjs` | new `QUOTE_SOURCE` export — Markdown body, plain attribution and role, closed pair — consumed by the fixture at index 12 |
| `scripts/u04/quote-evidence.mjs` | **new:** the Quote expectations, node props, region/item parsers, the seven-dimension served predicate and the twelve-case refusal matrix |
| `scripts/verify-u04-22-module-consent.mjs` | quote record and browser-case set; six dimensions; two served checks, one direct-document check and one refusal-matrix check; light and dark Chromium cases; the retained B1 regression (`8/17`, `50/59`, `PARITY_QUOTE=PENDING`) plus the checkpoint-free interim evaluation whose labels are printed and re-derived; the credited-evidence label becomes `…STEPS_QUOTE_EVIDENCE=42/42` |
| `tests/unit/page-document.test.ts` | the plain-only Unicode counting probe moves from the quotation to the now genuinely plain-only caption labels (contract preserved); new declared-Markdown quotation suite (acceptance, literal text, five invalid constructs from both entry points, closed flag, multi-line policy, 4,000/4,001 bound); native role-only caption preserved |
| `tests/unit/uno-foundation-families.test.ts` | the quote refusal suite is re-expressed as shared-reader Markdown refusals plus a validated suppressed role; new acceptance suite (Markdown versus byte-identical plain, multiline, attribution with role, suppressed role-only, bare quotation) with rendered assertions; ledger pins updated to nine credited / eight bounded / `9/17` / `51/59` |
| `tests/unit/uno-page-sections.test.ts` | declared-Markdown quotation rendered through the shared renderer inside the blockquote; unflagged quotation byte-identical with a native role-only caption |
| `tests/deployment/u04-22-module-consent.test.mjs` | the Quote module, record, six dimension assignments, predicates, check names, the interim-oracle assertions and the B1 `PARITY_QUOTE=PENDING` regression added as required tokens; `42/42` evidence label; six Quote neutering mutations (including the interim row and the B1 pending assertion) |
| `.documents/Architecture/u04-family-parity.md` | nine credited / eight bounded; the Quote row is now `PARITY (UNO-WO-117 / R01)` with donor evidence, accepted fields, refusals, output and proof; a new subsection records the caption rule and the 4,000 / 160-versus-120 bound audit; §5 and §6 updated; B2 explicitly not claimed |


## 4. Local verification (executed in this run)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` (unit, vitest) | **1,357 / 1,357**, 35 files (R02 head: 1,347) |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged and still exact |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **343 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **850 passed / 0 failed** (R02 head: 842) — `PARITY_QUOTE=PASS`, the eight prior families `PASS`, `U04_PARITY=9/17`, `U04_PROXY=51/59`, `22/22`, `4/4`, `16/16` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — `phase one verified byte-exactly · phase two verified byte-exactly` |

The production gate ran the real `next build` + `next start` + Chromium path, so every Quote dimension above was executed
against the installed bytes, the fixture was restored byte-exactly, and the closure oracle was not touched.

## 5. Risks

1. **One bound is deliberately wider than the donor.** Uno accepts a 160-code-point `attribution`/`role` where the donor caps
   at 120. Keeping it avoids narrowing an established Uno contract inside a parity order; it is recorded in the ledger and
   here rather than smoothed over, and a future order may align it explicitly.
2. **Suppression is a presentation rule with a validation obligation.** A role-only donor caption is validated then omitted,
   so the Page shows nothing rather than an invented caption. The validation runs through the strict reader on a minimal probe
   node — one extra bounded read per quote that supplies a role without an attribution — so the caption contract is never
   duplicated in the composer.
3. **The rendering switch is per node, not per item.** `markdown` is a literal `true` on the testimonials node because the
   donor authors one quotation per `quote` section; a hand-authored multi-item node with mixed plain and Markdown quotations
   must declare the switch, and then every quotation is parsed (the shared reader refuses anything unparseable), so no item is
   silently downgraded to literal text.
4. **B2 stays Open.** `quote` is credited at the checkpoint-free interim row only (`9/17` / `51/59`); the declared B2 target is
   not asserted, and `faq`/`columns` remain pending.

## 6. Disposition

`U04` remains **OPEN**; nine of seventeen families are parity-evidenced, eight remain bounded subsets, and B1 remains the
earned row. No dependency, workflow, oracle, frozen governance file, durable Page, deployment declaration, external
repository or provider was changed, and nothing was released or deployed. Stopping for independent Architect review.


## 7. Hosted verification at the exact product head

Product commit `03736b1fe4b6af456975c53ae16298b5a168f189` (`6d651fc..03736b1`), one non-force push to Uno `main`.

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45564566113](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45564566113) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |
| `Uno Bootstrap Verify` | [45564566086](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45564566086) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |

Both workflows ran at this exact head on both operating systems, including `Verify Owner-frozen governance files (positive and
refusal)`, `Bootstrap governance gate`, `Architecture boundaries`, `Unit tests`, `Production build`, `Multi-Site P6 contract
(mutation-sensitive)`, `Verify U04 A1 JSON Page vertical slice`, `U04 22-module consent hermetic guard` and `Verify U04 22-module
and four-provider consent (real production HTTP and Chromium)` — so the Quote credit, the eight retained family credits, the
concurrent-publication regressions and the shared Markdown/Unicode protections are proven on Linux and Windows, not only
locally. The report-only commit that publishes this record changes no gate input.

