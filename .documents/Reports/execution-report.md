# Execution Report — UNO-WO-116 / R02

**Outcome: COMPLETE — both reader defects corrected. The pre-R01 plain prose/callout lede newline refusal is restored, declared Markdown is now validated at the strict Page reader for native Hero, Stats and Timeline fields, R01's Unicode correction and every credited family are intact, and all mandatory local gates are green. No new parity credit.**

| | |
| --- | --- |
| Order | `UNO-WO-116 / R02`, `FINAL — EXECUTE` (supersedes R01; the committed R01 work was preserved, never reset or reverted) |
| ACTIVE | **3,634 bytes**, SHA-256 `c6ca071dd2a03640a6edf53e2b58618a87d144cb74d90b615cb808a72ef70f9a` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `9957bbb98e32683acfca102568556ce83ff1627e` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| R01 preserved | `14e66d8` Unicode correction untouched; every R01 unit test still passes unmodified, including the malformed-Unicode Steps probe |
| B1 baseline | eight families `PARITY_* = PASS`, `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, `22/22`, `4/4`, `16/16`; three-Site P6 both phases byte-exact |

## 1. Defect one — the plain prose/callout lede newline refusal

At the pre-R01 SHA `1bf835f` an undeclared (`markdown` absent) prose/callout `lede` was read with `allowNewlines: false`, so an
authored CR, LF or CRLF refused with `document:unsafe-text`. R01 replaced that call with a Markdown-capable reader that allowed
line breaks, silently widening the field. R02 restores the exact pre-R01 policy for that one field:

- `readProseBody` reads the undeclared lede through `optionalMarkdownCapableText(..., allowNewlines: false)` — the pre-R01
  single-line refusal **plus** R01's Unicode decision, so neither is traded for the other.
- `requireFamilyMarkdown` now takes the caller's newline policy (`allowNewlines` defaults to `true`, preserving every existing
  Markdown caller), so the declared-Markdown lede keeps its authored lines because it is parsed as Markdown, and the stats
  detail / timeline description keep the single-line policy they have always had.
- The body keeps the multi-line policy it has always had, in both the plain and the declared form.

Proved through **both** entry points in unit tests and in the production gate: LF, CR and CRLF each refuse as
`document:unsafe-text` for prose and callout, the same lede declared as Markdown is accepted with its text byte-identical, and a
multi-line body stays accepted.

## 2. Defect two — declared Markdown validated at the strict Page reader

A native `content.hero`, `content.stats` or `content.timeline` node could declare `markdown: true` and carry Markdown the shared
reader refuses; the renderer then printed the raw syntax as literal text. R02 closes that at the strict reader:

- When the closed flag is the literal `true`, every present hero `lede`/`support`, stats item `detail` and timeline item
  `description` is read with `requireFamilyMarkdown` — the same shared `readUnoFamilyMarkdown` the composer and renderer use — so
  unsupported or unbalanced Markdown (raw HTML, image syntax, unbalanced emphasis, unsafe or protocol-relative destinations)
  refuses the **whole Page** with no partial document and no render.
- The flag is now read through the existing `optionalProseMarkdown` helper in all three modules, so the closed literal rule,
  optional absence and the reason vocabulary are reused rather than reimplemented. Field bounds, the per-field newline policies
  and every valid authored output are unchanged; without the flag, previously accepted well-formed literal text is unchanged.
- `src/components/uno-page-sections.tsx` was **not** changed: the order allowed it only if needed, and the reader now validates
  exactly the bytes the renderer will parse, so the literal branch is unreachable for an accepted Page. No renderer redesign.

## 3. Authorized changes (7 paths, no others)

`git diff --stat` before the report overwrite: 7 files, 508 insertions, 48 deletions. `.github/**`, `AGENTS.md`, `README.md`,
the SOP, the governance gate, `package.json`, dependencies, the closure oracle, durable Pages, deployment declarations and every
other repository are untouched; `tests/unit/uno-family-markdown.test.ts` needed no edit because the Markdown reader's own
contract did not change, and all of its R01 tests still pass unmodified.

| Path | Change |
| --- | --- |
| `src/core/page-document.ts` | `requireFamilyMarkdown` takes the field's newline policy; undeclared prose/callout lede restored to single-line; hero/stats/timeline read the closed flag once and validate declared-Markdown `lede`/`support`/`detail`/`description` through the shared reader |
| `tests/unit/page-document.test.ts` | New suite for the restored lede policy (CR/LF/CRLF × prose/callout × object/JSON text, body multi-line retained, declared lede retained, R01 Unicode retained); new suite for declared-Markdown validation (4 surfaces × 5 invalid constructs × both entry points, the exact per-layer refusal reason, valid declared Markdown accepted and round-tripped, per-field newline policies, undeclared literal text unchanged, closed flag unchanged); four plain lede surfaces added to the R01 Unicode matrix |
| `tests/unit/uno-page-sections.test.ts` | New suite proving an invalid declared field is refused **before** markup exists and a valid declared field renders through the shared Markdown renderer instead of its source syntax |
| `tests/unit/uno-foundation-families.test.ts` | New suite proving the corrections change no valid composition: plain single-line lede still byte-identically hoisted, multi-line/Markdown lede still declared, hero/stats/steps still compose, re-read and render parsed Markdown |
| `scripts/verify-u04-22-module-consent.mjs` | Two new production-gate checks: the plain lede CR/LF/CRLF refusal with the declared lede and body retained, and the declared-Markdown refusal for every native hero/stats/timeline surface with valid and undeclared text accepted |
| `tests/deployment/u04-22-module-consent.test.mjs` | Two new required audit tokens, both added to the existing mutation test, so deleting either gate check fails the hermetic audit |
| `.documents/Architecture/u04-family-parity.md` | §4a retitled, new §4a.1 recording both corrections and the remaining native plain-only Unicode limitation |

## 4. Local verification (executed in this run)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` (unit, vitest) | **1,347 / 1,347**, 35 files (R01 head: 1,334) |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged and still exact |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **343 / 0** |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **842 passed / 0 failed** (R01 head: 840) — `PARITY_PROSE/CALLOUT/TABLE/LIST/HERO/STATS/STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, `22/22`, `4/4`, `16/16` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — `phase one verified byte-exactly · phase two verified byte-exactly` |

The production gate ran the real `next build` + `next start` + Chromium path: both R02 corrections were exercised against the
installed bytes, the four-case browser matrix and the rights evidence are unchanged for all eight credited families, the
fixture was restored byte-exactly, and the closure oracle was not touched.

## 5. Risks

1. **Precedence inside a module.** The closed `markdown` flag is now read before the body fields in the three native modules, so
   a document that declares a malformed flag *and* a malformed field refuses on the flag. Both are `document:invalid-props`, so
   no caller can observe a different reason; the flag-first order is what lets the flag drive field validation.
2. **Two layers, two reasons.** A declared-Markdown field keeps the plain-text layer's `document:unsafe-text` for raw markup and
   an encoded scheme and the Markdown layer's `document:invalid-props` otherwise. That is the pre-existing vocabulary, pinned
   case by case, rather than one new merged reason.
3. **Native plain-only Unicode limitation stands.** A lone surrogate in a title, quote, label or similar non-Markdown field is
   still accepted and counted once, exactly as before both rounds; this order does not widen that scope and does not claim
   universal text validation.
4. **Renderer fallback is unreachable, not removed.** `uno-page-sections.tsx` keeps its literal branch for a field the shared
   reader refuses; the strict reader now guarantees it cannot be reached for an accepted Page. Removing it would be a renderer
   redesign the order did not authorize.

## 6. Disposition

`U04` remains **OPEN**; this order corrected two reader defects and added no family credit. `U04_PARITY` stays at the B1 row
`8/17` and `U04_PROXY` at `50/59`; nine families remain pending. No dependency, workflow, oracle, durable Page, deployment
declaration, external repository or provider was changed, and nothing was released or deployed. Stopping for independent
Architect review.


## 7. Hosted verification at the exact product head

Product commit `f2f54dc3fdf1eeb9ba3ff21cf0258abbeea6ad6b` (`9957bbb..f2f54dc`), one non-force push to Uno `main`.

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45559273015](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45559273015) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |
| `Uno Bootstrap Verify` | [45559272893](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45559272893) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |

Both workflows ran at this exact head on both operating systems, including `Verify Owner-frozen governance files (positive and
refusal)`, `Bootstrap governance gate`, `Architecture boundaries`, `Unit tests`, `Production build`, `Multi-Site P6 contract
(mutation-sensitive)`, `Verify U04 A1 JSON Page vertical slice`, `U04 22-module consent hermetic guard` and `Verify U04 22-module
and four-provider consent (real production HTTP and Chromium)` — so both corrections and the retained credits are proven on Linux
and Windows, not only locally. The report-only commit that publishes this record changes no gate input.

