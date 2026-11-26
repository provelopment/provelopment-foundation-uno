# Execution Report — UNO-WO-123 / R03

**Outcome: STOP — incomplete. No adoption commit exists.** R03 resumed from both preserved files exactly as identified. The composer
adoption is unchanged and intact; the Cards expectation rewrite remains unfinished at **18 failing tests**, all in one file, and the
fixture/evidence, digest, gate and hosted work that the acceptance requires is still outstanding. Nothing was staged, committed,
reverted or force-pushed, so `HEAD` stays green and no verification is claimed for the prototype.

| | |
| --- | --- |
| Order | `UNO-WO-123 / R03`, `FINAL — EXECUTE` (supersedes R02) |
| ACTIVE | **2,984 bytes**, SHA-256 `5ac91fc309888173a9670457b4743b260bd6386c0812ac9f44a56a409395a92b` — matched; private, ignored, untracked |
| Start SHA | `34ea34a316aa2e410a7621739b5696728b23393c`, tree carrying both preserved files, `HEAD` = `origin/main` |
| HEAD at stop | **unchanged** `34ea34a` — the adoption is in no commit |

## 1. Preserved work, exactly as measured this round

```
src/application/compose-uno-foundation-families.ts
  95,438 bytes   SHA-256 9638c5bee57783dc2a9de0da57770098f23ed55e0aaabb21dbb30864cb43b88e   +56 / -1

tests/unit/uno-foundation-families.test.ts
  319,792 bytes  SHA-256 8addf57b94dce6162b9b88ba2fa620142823362445c7d73f247f6e385c6ed250   +41 / -33
```

Both are byte-identical to the R02 measurements: R03 could not add a further verified edit to either, so it deliberately changed
nothing rather than edit blind.

The composer emits **one native cards node** (`UNO-WO-122 / R03`): `cards[1..24]` of `{title, meta?, body?, bodyMarkdown?}` with a
plain 160-point title, plain 120-point `meta` and Markdown-capable 4,000-point `body`; optional plain `heading` with `level: 2`,
optional Markdown `lede` (+`ledeMarkdown`), closed `surface`, authored `columns` 2/3/4 still required; `image`/`action` still refuse
the whole Page. `features`, ordinary grids, reader, renderer, stylesheet, durable Pages, policies and frozen governance files are
untouched.

## 2. The 18 remaining failures, verbatim from the run

```
bounded cards and features   composes thirteen nodes in source order, leaving the first eleven byte-identical
authored heading             keeps the heading-less cards node byte-identical to the pre-WO-070 committed output
authored heading             composes the headed cards source into one stack with an authored h2 and level-3 item titles
authored heading             resets the authored heading order across a mixed two-family Page in both orders
authored heading             renders the headed regions with one authored h2, one h3 per item and no invented markup
authored heading             accepts exactly 160 code points, counting astral characters once each
authored heading             still refuses every out-of-subset cards and features donor field, headed or not
authored lede                keeps all four pre-WO-071 baselines byte-identical when no lede is authored
authored lede                composes heading+lede for cards as an ordered heading, lede paragraph and grid
authored lede                composes lede-only for both families with level-2 item titles and no synthetic heading
authored lede                keeps authored order and ids for lede-bearing families mixed with the divider in either order

They fall into four classes, each mechanical but requiring the whole block to be read and restated together:

1. **`layout.stack`-shaped assertions** (`expected 'layout.grid' to be 'layout.stack'`, `to have a length of 2 but got 1`,
   `expected 1 to be 2`) — the headed and lede tests still expect a wrapper stack with `-heading`, `-lede` and `-grid` children.
2. **Byte baselines** — the four `PRE_WO071_*` constants and the pre-WO-070 cards constant encode the superseded JSON and must be
   recaptured in the native shape.
3. **Now-accepted refusals** (`expected 'composed' to be 'refused'`) — `surface` and card `meta` are admitted for cards, so those cases
   must move from the refusal loops into positive cards tests while staying refused for features.
4. **Digest pins** — the committed durable Page and the three-outline comparisons include the recomposed `family-15-cards` section and
   need recomputation, keeping the Gallery comparison and every other section byte-identical.

## 3. One open question the continuation must settle first

The first failure reports `expected true to be false` on the assertion that the composed cards node owns no `children` key, yet the
composer's cards branch returns `{ id, module, props }` with no `children`, and no assembly step in that file adds one. The
continuation must determine whether the test's `composed()` helper or the `CandidateSection` type narrowing is responsible before
restating that assertion — guessing would hide a real defect if the composed document were in fact child-bearing, which the reader
rejects as `document:invalid-children`.

## 4. What else stands between the order and acceptance

1. The 18 failures above, restated without loss.
2. `scripts/u04/family-fixture.mjs`: author the donor field set on the durable `cards` section (meta, Markdown lede/body, surface, a
   non-2 column intent, one absent field), then update the cards HTTP/Chromium predicates that still expect `uno-json-grid` markup.
3. The strict semantic-equivalence proof, the retained Gallery comparison, and fixture restoration by digest plus fresh original
   content.
4. Every mandatory local gate, then exact-head hosted baseline and bootstrap jobs, steps and logs on both systems.
5. `.documents/Architecture/u04-family-parity.md`: the Cards row still records the superseded composition.

## 5. Why this stopped here

Eighteen interlocking tests across three shared describes, plus two digest pins, then fixture, evidence, four local gates and four
hosted jobs, cannot be completed honestly in what remained of this run. Each block shares helper source and baseline constants with
features assertions that must keep their exact previous bytes, so a partial edit either weakens coverage or leaves the file
inconsistent — and the acceptance forbids both. The order's continuation clause governs: the work is preserved at the digests in §1,
nothing is staged, and resuming requires no reconstruction.

## 6. State at handoff

- Working tree: exactly the two modified **unstaged** files in §1, plus this report.
- `HEAD` = `origin/main` before this report: `34ea34a`, verified green hosted in R02 on both operating systems.
- Prototype health: `tsc --noEmit` **0 errors**; **34 of 35** test files green; the single failing file is the migration in progress.
- Credits unchanged and unclaimed: `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04 OPEN.

This is the **STOP for independent Architect review**.

authored lede                renders exactly one escaped lede paragraph between the authored heading and the native list
authored lede                renders lede-only as one paragraph before the list with level-2 item titles and no invented heading
authored lede                accepts 4000 code points, including astral characters, and refuses 4001
authored lede                refuses every malformed lede with the closed reason that matches its cause
authored lede                refuses markup, control characters, unpaired surrogates and an accessor lede with zero getter runs
committed durable family Page keeps every committed appended section byte-identical apart from the newly composed Gallery
three donor heading outlines  keeps exactly the three documented family sections recomposed and nothing else
```
