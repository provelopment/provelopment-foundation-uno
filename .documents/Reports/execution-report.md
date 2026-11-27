# Execution Report — UNO-WO-125 / R04

**Delivered: a dedicated, executed proof of the native Features representation — reader, refusals, presentation and stylesheet — 36 of 36 files green. Not delivered: composer adoption, so Features is still uncounted.** `PARITY_FEATURES=PENDING`, `U04_PARITY=14/17`, `U04_PROXY=56/59`.

| | |
| --- | --- |
| Order | `UNO-WO-125 / R04`, `FINAL — EXECUTE` |
| ACTIVE | **3,485 bytes**, SHA-256 `7c5c1b0465a8f1c48d797eef7c2ceee06bfeede6a20d27e0152bf429c2fa83de` — matched |
| Start SHA | `4e58d6aa91fa7399e402b8fc3cbf259f3080fd1a` = `origin/main`; clean tree |
| Code head | **`66e76279b463b11dae78690ad75500ff7c95b4a8`** — `test(u04): prove the native features representation, its refusals and its presentation` |

## What landed

`tests/unit/u04-features-representation.test.ts` — seven executed assertions that the representation R02 added and R03 repaired actually **behaves**, which nothing in the suite previously established:

- **Reader**: one childless node carrying heading, level, Markdown lede, closed surface, explicit columns and three ordered units, with unit one keeping its body, its Markdown declaration and its owned icon, and unit two — which authored none of those — keeping no key at all. A headingless, ledeless, columnless node is accepted and **no default is invented**: `columns` stays absent for the renderer's own three/two/one intent.
- **Childless serialization**: `children` is a real empty array for the grid contract's consumers, yet absent from `JSON.stringify`, and the serialized document re-reads rather than refusing itself as authored `children`.
- **Ceiling**: twenty-four units accepted, twenty-five refused, zero refused.
- **Crossed shapes**: declared `children` (empty or real), an icon with an authored alternative, an external icon identity, a Markdown body declaration without a body, a Markdown lede without a lede, an unknown unit field, the ordinary grid's `itemSemantics` beside `features`, and `cards` beside `features` — each refuses rather than dropping a field.
- **Presentation**: the authored surface, the section `<h2>` with its stable anchor id, the Markdown lede, the `ul` with `data-uno-columns`, its id and `role="list"`, exactly three border-free units, unit titles at the level the outline implies, a plain body as one paragraph, **no `<img>` where no icon was projected**, and no card markup anywhere. A headingless node renders level-two titles and **no** `data-uno-columns`, `data-uno-surface` or heading.
- **Stylesheet**: the features list, its explicit column rules, its closed muted surface and its icon rule are all present in the one sheet production ships.

## Gates at `66e7627`

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npm run lint` | **0 problems** |
| `pnpm test` | **36 of 36 files pass**, seven of those assertions new |
| **Mandatory U04 gate** | **PASS — 968 passed, 0 failed**; fourteen-family row still `14/17`, `56/59` |

## Why Features still earns nothing

Credit comes only from the composer emitting an accepted features node from donor source. That arm is written, composes and reads correctly (proved in R03), but the family ledger still pins the previous stack/grid shape in twenty-four assertions across six blocks, and the twenty-fifth — the extracted seventeen-family fixture — plus the committed-Page byte comparison would move with it. Rewriting them is mechanical but not small: each becomes simpler, one node with `features`, `heading`, `level`, `lede`, `ledeMarkdown`, `surface` and `columns` in place of a wrapper stack carrying a grid and per-item sub-stacks. I have chosen in three consecutive orders not to publish a red `main`, and this order's contribution is the proof layer those rewritten assertions will lean on.

Blocks to rewrite, in order: `composes thirteen nodes in source order`; `cards and features React markup`; the four refusal tests whose subject is now representable or bounded differently (both 64 KiB caps included); the whole `cards and features authored heading` block, six assertions; the whole `cards and features authored lede` block, eight assertions; the committed durable Page byte comparison; the three documented heading outlines; and `tests/unit/u04-verification-modules.test.mjs`.

## Then

1. Re-apply the composer arm with icon coverage at the composer level: bound, unbound, repeated, non-decorative.
2. Production evidence over real HTTP and Chromium at three widths, then the `features` row into the unchanged oracle for `15/17`, `57/59` and C2 — with ledger prose, pins and overclaim guards updated together.
3. Cards assurance still owed from WO-124: the 24-image and combined 32-binding Cases/Gallery cases.

## Preserved

C1, the twenty-two modules, four zones, browser matrix, fourteen credited families, image and action proofs, the seventeen-family fixture, the eight-binding ceiling, every closed refusal, and every byte of the cards representation and the ordinary grid.

## Disposition

STOP for independent review. The proof layer is now in place; the next activation is the twenty-four expectations and then the arm itself.
