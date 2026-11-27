# Execution Report — UNO-WO-125 / R02

**Delivered: the native Features representation with owned decorative icons, its own presentation and its own stylesheet, green through every local gate. Not delivered: the composer adoption that actually earns Features, and therefore C2.** `PARITY_FEATURES=PENDING`, `U04_PARITY=14/17`, `U04_PROXY=56/59`.

| | |
| --- | --- |
| Order | `UNO-WO-125 / R02`, `FINAL — EXECUTE` |
| ACTIVE | **3,543 bytes**, SHA-256 `9be801fb74347ec5c9c36acfc7475299ce2e4cda51d0bd6132c9a0035fa0b136` — matched |
| Start SHA | `0982811fa2a9c0135abfb3c461747b8e4dc22536` = `origin/main`; clean tree |
| Code head | **`d7a883a301d2b668e14323db545f7c4031e3f1b8`** — `feat(u04): add the native features representation with owned decorative icons` |

## What landed

The donor Features contract now has a native target, built the way Cards was built so nothing existing moved.

- **Reader** (`src/core/page-document.ts`): `UnoLayoutFeature` — a plain title, an optional Markdown-capable body and an optional owned decorative icon; `UnoLayoutGridFeaturesProps` — one to twenty-four ordered features under an optional authored heading and Markdown lede, an optional closed surface and an optional 2/3/4 column intent; `isUnoLayoutGridFeatures` narrows on the own `features` key exactly as `isUnoLayoutGridCards` does. The grid branch reads it as a separate explicit shape that refuses `children` — including an explicitly empty array — and the validated node carries the same non-enumerable empty `children` the cards node carries, so the existing grid contract keeps working. `readLayoutFeatures` bounds the list at the donor twenty-four, reads the title at the card-title bound, takes the body through the shared Markdown reader (declared only by the literal `true`) and resolves the icon through the existing owned-asset reader; an external, provider or unowned icon refuses.
- **Planner** (`src/application/plan-uno-page-assets.ts`): each authored icon contributes one image occurrence indexed by the feature's own position, so an iconless feature contributes nothing and can never shift an asset onto a neighbour.
- **Renderer** (`src/components/uno-page-sections.tsx`): a distinct presentation — the features section with its authored surface, heading at the authored level, Markdown or plain lede, then one border-free list item per feature, the icon rendered decoratively (`alt=""`, `aria-hidden="true"`), the title at the outline level the heading implies, the body as Markdown or plain text. Deliberately not the bordered card treatment.
- **Stylesheet** (`src/app/globals.css`): the donor default of three columns wide, two intermediate, one narrow, honouring explicit 2/3/4, plus the closed muted and bordered surfaces and the icon-led unit layout.

## Gates executed at `d7a883a`

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npm run lint` | **0 problems** |
| `pnpm test` | **1,416 / 1,416, 35 of 35 files** — no existing family changed shape |
| **Mandatory U04 gate** | **PASS — 968 passed, 0 failed**; fourteen-family oracle row still `14/17` and `56/59` |

## What is still missing — the part that earns the credit

The representation is a target, not a delivery. Features is not credited because **the composer still emits the old bounded mapping** (`case "features"`: columns required, at most eight items, no Markdown, no surface, no icons). Until the composer adopts the contract, the oracle has no Features evidence to read, and I will not hand it a declaration.

In order:

1. **Composer adoption** — emit the features grid from the donor source: Markdown lede and item bodies, authored surface, absent-column default, the donor twenty-four item bound, and icons resolved through the migration bindings so each identity is consumed exactly once (the cards arm is the precedent). Update the composer unit expectations, which pin the current stack/grid byte shape.
2. **Unit coverage** for the new representation: accepted features with and without icons, decorative-icon rendering, Markdown lede and body, surface, absent and explicit columns, twenty-four items, and the refusals (declared children, crossed shapes, unowned icon, twenty-five items).
3. **Production evidence** — reuse the composed transaction machinery: a features section with an icon, an iconless feature and a repeated icon over real HTTP and Chromium at three widths.
4. **Closure** — feed `features` into the unchanged oracle for the fifteenth family, earning `15/17`, `57/59` and C2, with the ledger and its historical pins updated together and the overclaim guards retained.
5. **Cards assurance still owed from WO-124** — the 24-image and combined 32-binding Cards/Gallery production cases.

## Preserved

C1, the twenty-two modules, the four zones and browser matrix, the fourteen credited families, the owned-image and card-action proofs, the seventeen-family baseline fixture, the eight-binding ceiling and every closed refusal. No existing family's props, markup or acceptance moved: the features shape is opt-in, and the ordinary grid and cards grid are byte-identical to before.

## Disposition

STOP for independent review. The next activation should begin at composer adoption.
