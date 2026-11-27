# Execution Report — UNO-WO-125 / R03

**Delivered: the defect that made the native Features representation unreadable from authored source, fixed and proven. Not delivered: composer adoption, which I implemented, validated, and then reverted rather than publish a red `main`.** `PARITY_FEATURES=PENDING`, `U04_PARITY=14/17`, `U04_PROXY=56/59`.

| | |
| --- | --- |
| Order | `UNO-WO-125 / R03`, `FINAL — EXECUTE` |
| ACTIVE | **3,892 bytes**, SHA-256 `e7d74e72bc918eedbcd731dac504e9407b45f0546b68fe9d51913dcc2e74a04a` — matched |
| Start SHA | `5a16ba823e216e0c70155c9df34860dbd865cddc` = `origin/main`; clean tree |
| Code head | **`c57d49f6851c8b3e833bd6818f7787f232ff2c06`** — `fix(u04): exempt a declared features grid from the childless section key check` |

## The defect this run found and fixed

R02's features representation was never reachable from a real Page, and the suite could not tell me because it exercised the reader on objects the reader itself had produced. `readNode` decides a section's required key set from `CHILD_BEARING_MODULES` and exempted only a declared **cards** grid, so every authored `layout.grid { features }` was required to carry `children` and was refused with `document:invalid-children` **before** its own branch ran. A grid that declares its own closed content is childless by contract, so the exemption now covers both shapes:

- `declaresOwnedContentGrid` reads `props.cards` **or** `props.features` structurally from the raw section, and delegates the cards half to the existing `declaresCardsGrid` so the two can never drift.
- Proven by probe: a features node with heading, lede, columns and level reads `accepted=true`; the bare `{ features: [{ title }] }` node reads `accepted=true`. Both were `invalid-children` before the fix.
- The probe file was deleted before the gates; it is not part of the tree.

## Gates at `c57d49f`

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npm run lint` | **0 problems** |
| `pnpm test` | **1,416 / 1,416, 35 of 35 files** |
| **Mandatory U04 gate** | **PASS — 968 passed, 0 failed**; fourteen-family oracle row still `14/17`, `56/59` |

## Why composer adoption is not in this head

I wrote the full adoption — the opt-in features node carrying heading, Markdown lede, closed surface, optional 2/3/4 columns, the donor 24-item bound, Markdown bodies, and the donor icon resolved only through this Page's bindings with the identity recorded as consumed (the cards arm's precedent) — and it composed and read correctly. It is **not pushed**, because the family ledger pins the previous shape in twenty-four assertions I could not rewrite correctly within this window, and a red `main` is a worse outcome than an honest absence. The work is reverted, not abandoned: the composer arm is a contained change, and the fix it depended on is now landed.

The twenty-four assertions to rewrite, by block:

- node count and source order (`composes thirteen nodes in source order`);
- feature markup (`cards and features React markup`);
- refusals that are now representable or bounded differently — `features fields outside the bound`, `malformed features values`, both `64 KiB` caps, `media malformed alt or caption values`, `gallery invalid owned targets`;
- the whole `cards and features authored heading` block, six assertions;
- the whole `cards and features authored lede` block, eight assertions;
- the committed durable family Page byte comparison and the three documented heading outlines.

Each becomes simpler, not harder: one features node with `features`, `heading`, `level`, `lede`, `ledeMarkdown`, `surface` and `columns`, in place of a wrapper stack carrying a grid and per-item sub-stacks.

## Exact remaining sequence

1. Rewrite the twenty-four pinned expectations above, with the extracted fixture's expectation (`tests/unit/u04-verification-modules.test.mjs`), which refused only because of the defect now fixed.
2. Re-apply the composer arm with its unit coverage: icons present, absent and repeated; unbound icon refused; non-decorative icon refused; Markdown lede and body; surface; absent and explicit columns; twenty-four items accepted, twenty-five refused.
3. Production evidence over real HTTP and Chromium at three widths, then the `features` row into the unchanged oracle for `15/17`, `57/59` and C2, with ledger prose and guards updated together.
4. Cards assurance still owed from WO-124: the 24-image and combined 32-binding Cards/Gallery cases.

## Preserved

C1, the twenty-two modules, the four zones and browser matrix, the fourteen credited families, the owned-image and card-action proofs, the seventeen-family fixture, the eight-binding ceiling and every closed refusal. The cards grid remains byte-identical; the new exemption changes only what a **declared** features grid may omit, and no document that previously composed now refuses.

## Disposition

STOP for independent review. The next activation should begin with the twenty-four pinned expectations, which are the only thing standing between the written adoption and the credit.
