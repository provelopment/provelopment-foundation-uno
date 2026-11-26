# Execution Report — UNO-WO-123 / R06

**Outcome: every mandatory LOCAL gate is green — the U04 production gate included, at 953 passing checks and zero failures — but
exact-head HOSTED acceptance is NOT achieved (see §5).** The production-evidence migration that stopped R05 is finished: the durable-family predicates now
describe the native cards section, no affected family lost a check, and the closure-oracle rows recover on their own. The adoption and
its evidence are committed together; exact-head hosted verification is recorded in §5.

| | |
| --- | --- |
| Order | `UNO-WO-123 / R06`, `FINAL — EXECUTE` (supersedes R05) |
| ACTIVE | **3,573 bytes**, SHA-256 `eb8ba10cfbb72e69d46252e12477bc454969f4938a0af4bd5ee5c1184ace80c0` — matched; private, ignored, untracked |
| Start SHA | `621aca88d676367b662451111165cd5e2ae3cdb4`, empty index, exactly the two preserved files modified |

## 1. What this round completed

**Production evidence migrated, not weakened.** The durable family Page now composes Cards as one native node, so every predicate that
described the old wrapper was restated against the served native markup, with its meaning intact:

- source-side: `FAMILY_ITEM_OUTLINE_SOURCE` and `FAMILY_LEDE_SOURCE` assert the one native node, its authored heading and `level: 2`,
  its plain lede, its ordered two-card list, the absent second body, childlessness and deep freeze; the real-reader re-acceptance now
  proves the serialized native node re-reads with an empty child list;
- served: `FAMILY_CARDS_HTTP` asserts `<div class="uno-json-cards-section">`, the authored `<h2>`, the `<p …-lede>`, one
  `<ul class="uno-json-cards" data-uno-columns="2" …-list>`, exactly two `<li class="uno-json-card">`, two `<h3>` titles in order, one
  card body and one prose paragraph; `FAMILY_ITEM_OUTLINE_HTTP` and `FAMILY_LEDE_HTTP` branch correctly for cards while Features keeps
  its cells and per-item ids;
- browser: the cards collector reads `ul.uno-json-cards` / `li.uno-json-card` and adds a `cardBodies` measurement, so the 390/1280 px
  checks prove the native section's heading, lede placement, two-column list, body and absence of invented controls;
- counts: the top-level stack totals drop from eight to seven (and the served `normal` stacks from nine to eight) because Cards is no
  longer a wrapper stack — each count carries the reason in a comment;
- `FAMILY_LEDE_REFUSALS` now proves the donor's Markdown lede **composes** (with a document) while unsafe markup, a non-string and an
  accessor still refuse with no partial document; Features keeps every plain-text rule;
- `tests/deployment/u04-22-module-consent.test.mjs` was updated in step with those labels, counts and pins.

## 2. Gates — actual results

| Gate | Result |
| --- | --- |
| Focused migration file — `npx vitest run tests/unit/uno-foundation-families.test.ts` | **PASS, exit 0** |
| Complete unit suite — `pnpm test` | **PASS — 35 of 35 files** |
| Lint — `npm run lint` | **PASS — 0 problems, exit 0** |
| Typecheck — `npx tsc --noEmit` | **0 errors** |
| Architecture boundaries | **PASS, exit 0** |
| Deployment suite — `node --test tests/deployment` | **PASS, exit 0** |
| Governance bytes | **PASS — frozen bytes** |
| Focused native Cards production proof | **PASS — 18 PASS, 0 FAIL, exit 0** |
| **Mandatory U04 gate — `node scripts/verify-u04-22-module-consent.mjs`** | **PASS — 953 passed, 0 failed, exit 0** |

The gate's own totals include `U04_MODULE_IDS=22/22`, the 16/16 browser matrix, the concurrent multi-Site publication checks, both
U04 hermetic guards, the real production HTTP and Chromium family evidence at 390/1280 px, `nothing was staged by the gate`, and the
unchanged closure oracle crediting exactly `13/17` families and `55/59` at the C1 checkpoint.

## 3. Preserved capability and durable compatibility

The composer keeps the accepted native representation and the donor contract: optional `columns` 2/3/4 (absent stays absent), plain
`heading` with `level: 2`, Markdown-capable `lede` (+`ledeMarkdown`) and `body` (+`bodyMarkdown`), plain `meta`, closed `surface`,
1–24 cards, and `image`/`action` still refusing the whole Page. Features, ordinary grids, the reader, the renderer, the stylesheet, the
durable Page, the fixture, the asset and destination policies, the oracle and the frozen governance files are unchanged. The durable
Cards section keeps its committed legacy bytes as a retained reference while the recomposed native node is proved semantically
equivalent field by field; the Gallery comparison and the byte-identical unaffected sections are retained, and `family-15-cards` now
sits in the recomposed set beside `family-5-gallery`.

## 4. Evidence integrity

The rich synthetic proof (24-card bounds, meta, Markdown lede and body, every refusal) stays test-owned and distinct from the durable
source, which remains the authored fixture. Fixture restoration is still proved by digest and by a fresh original response, and the
gate's own removal check confirms no temporary route or write survives the run.

## 5. Hosted verification

Exact-head hosted acceptance is **NOT achieved**. Evidence head `4057b57` (and the follow-up `9569f31`): `Uno Bootstrap Verify`
**success** on both systems; `Verify U01 baseline` **failure** on both, in the U03 published-Page runner step, where the newly added
durable-Cards semantic proof returns false on one field comparison. That single predicate is not yet diagnosed; every other check in
that runner passes, and all local gates listed in §2 are green.

## 6. Disposition

`PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04 OPEN. Cards is adopted as a bounded text-only
composer capability and is **not** credited: no images, actions, six-case browser matrix or full Cards parity is claimed. This is the
**STOP for independent Architect review**.
