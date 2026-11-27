# Execution Report — UNO-WO-124 / R08

**Disposition: CHECKPOINT. The card action is implemented end to end and the suite is one assertion short of green; no implementation was committed or pushed because the mandatory U04 gate could not be run in this session.** `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`.

| | |
| --- | --- |
| Order | `UNO-WO-124 / R08`, `FINAL — EXECUTE` |
| ACTIVE | **3,135 bytes**, SHA-256 `cbd43aaec228ba5164214c9f999004879ced7362b56d6c1c4750e9f1c8f9ad4f` — matched; private, ignored, untracked |
| Start SHA | `686db9f22723b50214b559886d58d2022c3e759b` = `origin/main`; index clean; the four preserved R07 files were present and reconciled |
| Transient fixtures | none created; no fixture transaction ran, so nothing needed restoration |

## What was completed this run

- **Reader** (`src/core/page-document.ts`): `action` admitted by the card allow-list and typed as the static outbound anchor with the closed optional variant; `readCardAction` reads exactly `{label, href, variant?}`, classifies with the unchanged `classifyAuthorDestination` and admits only `https`/`mailto` (`document:unsafe-link`); `targetId`/`linkId`/`routeTarget` are shape refusals; the card builder emits `action` only when authored.
- **Composer** (`src/application/compose-uno-foundation-families.ts`): the donor card admits `image` and `action`; the new arm adopts Hero's static outbound shape and refuses `route`/`link` with `family:unsupported-feature`.
- **Renderer and stylesheet**: one ordinary anchor after the body (`uno-json-card-action`, `data-uno-variant` primary/secondary/link, `rel="noreferrer noopener"`) with a visible `:focus-visible` ring and a reduced-motion guard.
- **Evidence**: the composed fixture now authors a card action (`Read the plate`, `https://example.org/wo124-card`, `secondary`), and the composed transaction gained `U04_COMPOSED_CARDS_ACTION`, asserting the served anchor, its classified href, its closed variant, its own label and the absence of any script destination or button form.
- **Reader coverage**: new positive probe (accepted action with label, href and variant) plus six refusals (same-document target, application link, `javascript:`, `tel:`, two destinations, no label); the module probe still labelled *a deferred card action* is filtered out of the refusal loop and named in the test.

## Verification actually run

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npm run lint` | **0 problems** |
| `pnpm test` | **1,415 / 1,416 passed, 34 of 35 files** — one assertion left |
| Focused native proof, mandatory U04 gate, U03 | **not run** — capacity ended before the gate |

Remaining failure, exactly:
`FAIL  tests/unit/uno-foundation-families.test.ts > composeUnoFoundationSubset ΓÇö cards and features authored heading > still refuses every out-of-subset cards and features donor field, headed or not`

`AssertionError: expected 'family:unsupported-feature' to be 'family:target-refused' // Object.is equality`

`Γ¥» tests/unit/uno-foundation-families.test.ts:4687:5`


This is the obsolete expectation in `composeUnoFoundationSubset — cards and features authored heading`: a card action whose destination is the fragment `#go` now refuses as `family:target-refused` (the composer will not resolve a card target) where the assertion still expects `family:unsupported-feature`. Next executable step: set that single expectation to `family:target-refused`, then `pnpm test`, then the focused native proof, the mandatory U04 gate (which also runs the composed transaction including the new action evidence), U03, commit, push and both hosted operating systems.

## Preserved implementation (unstaged)
| `scripts/u04/cards-composed-evidence.mjs` | 17461 B | 07ad6756105626d1... |
| `scripts/u04/family-fixture.mjs` | 24492 B | c01f891906057088... |
| `src/app/globals.css` | 48190 B | c862bbdb417e9f1d... |
| `src/application/compose-uno-foundation-families.ts` | 99076 B | b0ed5159f419564f... |
| `src/components/uno-page-sections.tsx` | 47231 B | 5ab17c37c08e36f2... |
| `src/core/page-document.ts` | 164602 B | fe8c0ea81f764742... |
| `tests/unit/page-document.test.ts` | 157085 B | 42e79b8b251cfced... |
| `tests/unit/uno-foundation-families.test.ts` | 324783 B | a478c3ab2a5ed6da... |

## Not claimed

No parity credit: the seven Cards dimensions are not yet evidenced as a set, the unchanged closure evaluator has not been run, and `14/17`/`56/59` are **not** emitted. Features, Actions and ContactForm stay pending; C2 and U04 remain open; no stage closure, release or deployment. C1, the 22 modules, the four zones and browser matrix, the nine credited families, the native and composed owned-image proofs at `1607cfb` (12/0 and 966/0), the seventeen-family baseline fixture and the 24 closed refusals are untouched.

## Disposition

STOP for independent review, with the preserved edits available for the successor activation.
