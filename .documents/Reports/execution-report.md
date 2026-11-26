# Execution Report — UNO-WO-123 / R02

**Outcome: STOP — still incomplete, and this is a continuation record, not an acceptance.** R02 continued from the preserved R01
prototype: the composer adoption is untouched and intact, and the Cards expectation rewrite it demanded advanced from **20 failing
tests to 9**, all of them inside one file. The remaining nine, plus the fixture/evidence/digest work, the mandatory gates and hosted
verification, exceed what this run could complete without weakening assertions. Nothing is staged or committed from the adoption;
`HEAD` is unchanged and green.

| | |
| --- | --- |
| Order | `UNO-WO-123 / R02`, `FINAL — EXECUTE` (supersedes R01) |
| ACTIVE | **2,996 bytes**, SHA-256 `a9d9d97c492fbc271a5399f36bbe3da2b7fb51ada637b58837b0ef0f401b1a66` — matched; private, ignored, untracked |
| Start SHA | `49e3f172c07b1dd6a6c3fb2fce5b83ed70599b97`, tree carrying the R01 prototype, `HEAD` = `origin/main` |
| HEAD at stop | **unchanged** `49e3f17` — no adoption commit exists, so no gate or hosted result is claimed for the prototype |

## 1. Preserved work, exactly

Two modified, **unstaged** files. Nothing else in the tree changed.

```
src/application/compose-uno-foundation-families.ts
  95,438 bytes   SHA-256 9638c5bee57783dc2a9de0da57770098f23ed55e0aaabb21dbb30864cb43b88e   +56 / -1
  (byte-identical to the R01 prototype — R02 did not touch it)

tests/unit/uno-foundation-families.test.ts
  319,792 bytes  SHA-256 8addf57b94dce6162b9b88ba2fa620142823362445c7d73f247f6e385c6ed250   +41 / -33
```

### What the composer does now (unchanged from R01)

`case "cards"` emits **one native cards node** — the accepted `UNO-WO-122 / R03` representation — instead of a list grid of
`layout.stack` children: `cards[1..24]` of `{title, meta?, body?, bodyMarkdown?}` with a plain 160-point title, plain 120-point
`meta`, Markdown-capable 4,000-point `body` flagged only through literal `true`; optional plain `heading` with explicit `level: 2`,
optional Markdown `lede` (+ `ledeMarkdown`), closed `surface`, authored `columns` 2/3/4 still **required** so no renderer default is
borrowed; `image` and `action` still refuse the whole Page through `requireExactKeys`. `features`, ordinary grids, the reader, the
renderer, the stylesheet, durable Pages/declarations, the asset and destination policies and the frozen governance files are
untouched.

### What R02 completed in the expectations

Every change keeps its original semantic coverage; no assertion was deleted for convenience.

1. **Bounded cards node** — `props` is now the native `{cards: […], columns: 2}` with the authored order and the absent second body,
   and the node is proved to own **no** `children` key at all.
2. **Cards markup** — asserted against the native markup: `<ul class="uno-json-cards" data-uno-columns="2" id="…-list" role="list">`,
   one `<li class="uno-json-card">` per card, level-2 `<h2 class="uno-json-heading">` titles when heading-less, exactly one
   `<p class="uno-json-card-body">` for the one authored body, and authored order.
3. **Out-of-subset refusals** — `surface` (section) and `meta` (card) are now admitted for cards only; `align`/`ratio`/`href`/`route`/
   `link`/`style`/`onClick`/`visibility`, `image`, `action` and `icon` still refuse, Markdown **titles** still refuse, and Markdown
   **bodies** are deliberately excluded from the refusal loop for cards only.
4. **Card counts and failing bodies** — nine cards are now valid for cards (twenty-five is the first refused count; features still
   refuse nine), and a raw-HTML body refuses as `family:unsupported-feature` for cards against `family:target-refused` for features,
   each with the reason that matches its cause.

## 2. The nine remaining failures, named

```
bounded cards and features    composes thirteen nodes in source order …
authored heading              composes the headed cards source into one stack …
authored lede                 keeps all four pre-WO-071 baselines byte-identical …
authored lede                 composes heading+lede for cards …
authored lede                 renders exactly one escaped lede paragraph …
authored lede                 accepts 4000 code points …
authored lede                 refuses every malformed lede …
committed durable family Page keeps every committed appended section byte-identical …
three donor heading outlines  keeps exactly the three documented family sections recomposed
```

They are the shared-loop blocks where cards and features are asserted together (`ledePage`, the four `PRE_WO071_*` baselines, the
mixed-order and 4000/4001 loops) plus the two committed-digest pins. Each needs a cards branch in the new representation and, for the
digest pins, a recomputation of the durable Page's cards section — with the Gallery comparison and every other section's byte
identity retained.

## 3. What still stands between this order and acceptance

1. The nine failures above, restated without loss.
2. `scripts/u04/family-fixture.mjs`: author the full donor field set on the durable `cards` section (meta, Markdown lede/body, surface,
   a non-2 column intent, one absent field), then update the composed-section digest picks and the cards HTTP/Chromium predicates that
   still expect `uno-json-grid`/`layout.stack` markup.
3. The strict semantic-equivalence proof for the durable Cards section, the retained Gallery comparison, and fixture restoration by
   digest plus fresh original content.
4. Every mandatory local gate, then exact-head hosted baseline and bootstrap jobs, steps and logs on both systems.
5. `.documents/Architecture/u04-family-parity.md`: the Cards row still records the superseded composition.

## 4. Why this stopped here again

The nine failures are not independent: six of them share helper source and baseline constants with the features assertions that must
keep their exact previous bytes, so each rewrite has to be done against a whole block rather than one assertion at a time. With the
capacity left to this run, finishing the test file, then the fixture, evidence, digests, four local gates and four hosted jobs would
have meant editing blind and pushing red. The order's continuation clause covers this: the work is preserved exactly as measured
above, nothing was staged, reverted, rebased or force-pushed, and the digests are sufficient to resume without reconstruction.

## 5. State at handoff

- Working tree: exactly the two modified **unstaged** files listed in §1; nothing added or removed.
- `HEAD` = `origin/main` = `49e3f17` (the R01-era head, itself fully green on both operating systems); the adoption is not in it.
- Progress this round: **20 → 9** failing tests, `tsc --noEmit` at **0 errors**, the other **34 of 35** test files green.
- Credits unchanged and unclaimed: `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04 OPEN. No
  images, actions, six-case browser matrix or full Cards parity is implied anywhere.

This is the **STOP for independent Architect review**.

