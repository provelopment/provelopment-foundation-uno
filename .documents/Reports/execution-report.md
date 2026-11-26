# Execution Report — UNO-WO-123 / R04

**Outcome: the local Cards adoption checkpoint is COMPLETE and green.** The composer now emits the accepted native Cards
representation, every Cards expectation in the unit suite is migrated to it, and the **focused migration file, the complete unit
suite, lint and typecheck are all green**. The candidate is preserved **unstaged** exactly as this order requires; production
fixture/evidence migration, the remaining mandatory local gates and hosted acceptance are **deferred and not PASS** for it.

| | |
| --- | --- |
| Order | `UNO-WO-123 / R04`, `FINAL — EXECUTE` (supersedes R03) |
| ACTIVE | **3,164 bytes**, SHA-256 `e0667f64ea563243384af6394272b30093380d4cd0b309801bbfa01ca7f25b9b` — matched; private, ignored, untracked |
| Start SHA | `57611d0ba8ce7b137f15b0b827f411b0bfbf7e7c`, empty index, exactly the two preserved files modified |
| Continuation check | both files matched the order's bytes and SHA-256 exactly before any edit |

## 1. Preserved candidate, exact bytes

```
src/application/compose-uno-foundation-families.ts
  95,415 bytes   SHA-256 93b50bc6e6519257407b21a0ca9d04ad3bdc9dd1386365be2f200ac129976d83   (unstaged, uncommitted)

tests/unit/uno-foundation-families.test.ts
  321,184 bytes  SHA-256 d38015eabedaae8b003c83e5db056f17e88b34989f3a4aac40deb7d23118607e   (unstaged, uncommitted)
```

Nothing else in the tree is modified, added or removed. The index was empty before and after; the adoption is not committed.

## 2. What the composer now does

One authored Cards section composes to **one native cards node** — `layout.grid` in its closed opt-in text-only cards
representation — carrying, in this order: `cards[1..24]`, the optional authored `columns` 2/3/4, the optional plain `heading` with
explicit `level: 2`, the optional bounded **plain** `lede`, the optional closed `surface`.

- **Cards** are `{title, meta?, body?, bodyMarkdown?}`: plain 160-code-point title, plain 120-code-point `meta`, and an optional
  Markdown-capable 4,000-code-point `body` declared as Markdown only through the literal `true`. An absent field stays absent.
- **Column intent is optional.** An authored 2/3/4 is carried unchanged; an absent intent stays absent so the renderer's own default
  applies and no intent is invented. A `1`, `5`, `0` or string intent still refuses.
- **Images and actions remain refused**, never dropped: an authored `image`, `action` or any other undeclared key refuses the whole
  Page through `requireExactKeys`.
- **The section lede is bounded plain text**, exactly as Features keeps it. A lede carrying Markdown constructs is refused rather

## 3. Unit-level migration — 18 failures resolved, no coverage lost

The order's diagnostic settled the first failure: `composeUnoFoundationSubset` returns the validated document, so the cards node's
accepted empty `children` is present but non-enumerable. It is now proved exactly that way — `children` equals `[]`, is absent from
`Object.keys`, and is absent from the serialized node — while the authored-`children` refusal and serialized revalidation contracts
are untouched.

Every other restatement keeps its original semantic coverage:

- the headed, lede and markup blocks now assert the native node, `<ul class="uno-json-cards">`, one `<li class="uno-json-card">` per
  card, an `<h2>` section heading, `<h3>` card titles, one card body element, authored order and the closed surface;
- the pre-WO-070 and four `PRE_WO071_*` Cards baselines and the two `family-15-cards` digest pins are **distinguished, not replaced**:
  the committed legacy bytes are retained as the reference constant, the recomposed node is proved to differ from it, and strict
  semantic equivalence is asserted field by field (order, titles, bodies, absence, columns, no invented heading/meta/image/action);
- `UNAFFECTED_DIGESTS` drops to **13** entries, with `family-15-cards` moving into the recomposed set beside `family-5-gallery`, so
  every other durable section stays byte-identical and the Gallery comparison is retained;
- `surface` and card `meta` are proved **accepted for cards** and still refused for features; Markdown titles still refuse; a raw-HTML
  body refuses as `family:unsupported-feature` for cards against `family:target-refused` for features; nine cards are valid and
  twenty-five is the first refused count; an absent column intent is accepted for cards and still refused for features.

## 4. Gates actually run

| Gate | Result |
| --- | --- |
| Focused migration file — `npx vitest run tests/unit/uno-foundation-families.test.ts` | **PASS, exit 0** |
| Complete unit suite — `pnpm test` | **PASS — 35 of 35 test files** |
| Lint — `npm run lint` | **PASS — 0 problems, exit 0** |
| Typecheck — `npx tsc --noEmit -p tsconfig.json` | **0 errors** |

## 5. Explicitly NOT PASS for this candidate

Per the order, the following are deferred and **not** claimed: production fixture authoring and evidence-predicate migration
(`scripts/u04/*`), the served-HTTP and Chromium Cards proofs, the remaining mandatory local gates (architecture boundaries, deployment
suite, the U04 22-module gate and the governance byte check — none re-run against this candidate), and exact-head hosted baseline and
bootstrap jobs. The durable Page is not rewritten and no fixture is edited. Cards remains `PENDING` and uncredited:
`PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04 OPEN.

## 6. Disposition

The candidate is preserved unstaged with the digests in §1 for the separate production-verification order. Only this report was
committed and pushed, under the standing report-only exception; the adoption itself is untouched in the index and in history. This is
the **STOP for independent Architect review**.

  than flattened, so nothing is downgraded silently; the native node still accepts a Markdown lede for directly authored documents.
- **Features, ordinary grids, the reader, the renderer, the stylesheet, durable Pages/declarations, fixtures, gate runners, the
  oracle, dependencies, workflows and frozen governance files are untouched.**
