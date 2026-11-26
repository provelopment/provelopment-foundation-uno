# Execution Report — UNO-WO-123 / R05

**Outcome: STOP — production acceptance NOT achieved.** The composer is fully aligned with the approved GEO-03 donor contract and
every unit-level gate is green, but the mandatory U04 production gate fails **28** assertions because its durable-family evidence
predicates still describe the superseded cards DOM. That evidence migration is the remaining work and it is not complete. No adoption
commit exists; the candidate is preserved unstaged with its exact digests below.

| | |
| --- | --- |
| Order | `UNO-WO-123 / R05`, `FINAL — EXECUTE` (supersedes R04) |
| ACTIVE | **3,412 bytes**, SHA-256 `b1b1d0826b240399eea515b082f050a50d09a83c864877fb632f192c1a5ad795` — matched; private, ignored, untracked |
| Start SHA | `565a1a0e958c50b841041019d21b52e515a0c5ab`, empty index, exactly the two preserved files modified |
| HEAD at stop | unchanged; the adoption is in no commit |

## 1. Preserved candidate, exact bytes

```
src/application/compose-uno-foundation-families.ts
  95,535 bytes   SHA-256 901e6eadd20078d71bd1897e585296662502e666fc8562ee4d85f3c993448b9e   (unstaged)

tests/unit/uno-foundation-families.test.ts
  323,834 bytes  SHA-256 871d2d26978628f21d95d5110e5e63c3dd6260619cb1d68a04e1611326e3939d   (unstaged)
```

`scripts/u04/family-fixture.mjs` is **untouched** (its `cards` section still at line 419): the durable Page is not rewritten and no
fixture was edited.

## 2. What R05 achieved

**Donor alignment restored.** The Cards lede is Markdown-capable again — read by the shared family Markdown reader, which refuses unsafe
or ill-formed constructs, and declared Markdown only through the literal `true`. A plain lede stays plain, so the durable Page's plain
lede composes exactly as before.

**The full bounded composer contract now holds**, proved at unit level:

- `cards[1..24]` of `{title, meta?, body?, bodyMarkdown?}` — plain 160-point title, plain 120-point `meta`, Markdown-capable
  4,000-point `body` flagged only by the literal `true`; absent fields stay absent;
- optional `columns` 2/3/4 (absent stays absent; `1`/`5`/`0`/string still refuse), optional plain `heading` with `level: 2`,
  Markdown-capable `lede` (+`ledeMarkdown`), closed `surface`;
- `image` and `action` still refuse the whole Page, never dropped;
- Features, ordinary grids, reader, renderer, stylesheet, durable Pages, fixtures, gate runners, oracle, dependencies, workflows and
  the frozen governance files are unchanged.

The obsolete Cards checks were migrated without losing coverage, including a **new positive proof** that a safe Markdown cards lede
composes as `ledeMarkdown: true` and renders `<strong>` and a `rel="noopener noreferrer"` link natively, alongside the retained refusals
for unsafe markup, control characters, ill-formed surrogates, images and accessor sources — with the refusal reason differing correctly
between the Markdown field (cards) and the plain-text field (features).


## 3. Gates actually run

| Gate | Result |
| --- | --- |
| Focused migration file — `npx vitest run tests/unit/uno-foundation-families.test.ts` | **PASS, exit 0** |
| Complete unit suite — `pnpm test` | **PASS — 35 of 35 files** |
| Lint — `npm run lint` | **PASS — 0 problems** |
| Typecheck — `npx tsc --noEmit` | **0 errors** |
| Architecture boundaries — `node --test tests/architecture/u01-boundaries.test.mjs` | **PASS, exit 0** |
| Deployment suite — `node --test tests/deployment` | **PASS, exit 0** |
| Governance bytes — `node scripts/verify-governance-docs.mjs` | **PASS — frozen bytes** |
| Focused native Cards production proof — `node scripts/verify-u04-cards-native.mjs` | **PASS — 18 PASS, 0 FAIL, exit 0** |
| **Mandatory U04 gate — `node scripts/verify-u04-22-module-consent.mjs`** | **FAIL — 925 passed, 28 failed** |

## 4. The 28 failures, precisely

All 28 are durable-family evidence predicates and their dependent closure-oracle rows, not product defects:

- `FAMILY_ITEM_OUTLINE_SOURCE/HTTP`, `FAMILY_LEDE_SOURCE/HTTP/BROWSER`, `FAMILY_CARDS_HTTP`, `FAMILY_TEXT_FIVE_SOURCE` and
  `FAMILY_STATS_STEPS_SOURCE` still require the cards section to be a `uno-json-stack` wrapper holding an `h2`, a lede paragraph and a
  `uno-json-grid` list of `uno-json-cell`/`uno-json-stack` items (runner lines ≈1743–1830, 1870–1900, 2010, 2806, 3182–3196,
  3218–3240, plus the matching 390/1280 px browser predicates);
- the nine `U04_CLOSURE_ORACLE` rows fail only because that family evidence is false, so they recover once the predicates are
  migrated — the credit counts themselves are unchanged and unclaimed.

Migrating them means restating each predicate against the native cards node (`<div class="uno-json-cards-section" id="family-15-cards">`,
`<h2 id="family-15-cards-heading">`, `<p id="family-15-cards-lede">`, `<ul class="uno-json-cards" data-uno-columns="2"
id="family-15-cards-list">`, two `<li class="uno-json-card">` with `h3` titles and one card body), the source-side props assertions, and
the "seven stacks / seventeen ids" counts that currently include the cards wrapper.

## 5. Why this stopped here

That migration is roughly ten predicate groups across a 7,392-line runner plus its HTTP and browser mirrors. Inside the capacity left
to this run it could not be completed and verified to a green gate, and the order forbids committing before the mandatory gates pass.
The continuation clause therefore governs: the work is preserved at the digests in §1, the fixture is untouched, no temporary state is
left behind, and nothing was staged or reverted.

## 6. State and what remains

- Working tree: exactly the two modified **unstaged** files in §1; the fixture, gate runners, workflows and governance files untouched.
- Not PASS for this candidate: the U04 production gate (28 evidence predicates), exact-head hosted baseline and bootstrap jobs, the
  architecture row update, and the durable fixture/evidence authoring the acceptance describes.
- Credits unchanged and unclaimed: `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04 OPEN.

Only this report was committed and pushed, under the standing report-only exception. This is the **STOP for independent Architect
review**.
