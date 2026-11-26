# Execution Report — UNO-WO-124 / R01

**Outcome: the Cards owned-image adoption is implemented, locally gate-green and verified at the exact head `a0c1639` on both
operating systems — but it is a bounded adoption, not Cards parity.** Served byte/MIME/dimension evidence for card images and the
24-image/32-binding production cases remain **OPEN** and are listed in §5.

| | |
| --- | --- |
| Order | `UNO-WO-124 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **3,902 bytes**, SHA-256 `5ed08e0bb67e8edc14e8e754cec6dfe8151f10065d3214a9bf3ec600aaae25be` — matched; private, ignored, untracked |
| Start SHA | `6e4d9fc8f94c9499c2db9f474b01867f2b76167e`, empty index, the seven preserved files from the interrupted attempt |

## 1. What was adopted

The pinned GEO-03 donor's **optional per-card image** now reaches the native cards node through Uno's existing owned-media contract,
and nothing else does:

- **core** (`src/core/page-document.ts`): `UnoLayoutCard` gains optional `asset`/`alt`/`decorative`. The reader accepts exactly those
  keys, requires an alternative beside an asset, refuses an alternative or decorative flag without one, refuses a decorative image
  whose alternative is not exactly empty and a described one whose alternative is empty, and reads the alternative through the
  **same** `readBoundedText` call `media.image` uses at the unchanged 320-point bound. Every undeclared key — including the still
  deferred card `action` and `icon` — refuses the whole Page.
- **composer**: the cards arm accepts `image: {src, alt?, decorative?}` only as an identity resolved from this Page's own binding
  list; it records the identity as consumed, so the existing exact-set rule still refuses missing, extra, misowned and unbound
  authority, and nothing is fetched, inferred or invented. A new `cardsComposed` flag shares the Gallery's 32-binding aggregate
  ceiling; **every Page that composed neither Cards images nor a list Gallery keeps the eight-binding ceiling unchanged**.
- **planner**: one `image` occurrence per card **that authored an image**, indexed by the card's own position, so an unauthored card
  consumes nothing and no image can shift onto a neighbour.
- **renderer/style**: each card emits its own resolved `<img class="uno-json-card-image">` with the authored alternative (`""` when
  decorative) inside its own `<li>`, with no invented figure, caption or control; the box keeps the picture undistorted and bounded.

## 2. Gates — actual results at `a0c1639`

| Gate | Result |
| --- | --- |
| Unit suite — `pnpm test` | **PASS — 35 of 35 files** |
| Lint — `npm run lint` | **PASS — 0 problems** |
| Typecheck — `npx tsc --noEmit` | **0 errors** |
| Architecture boundaries | **PASS** |
| Deployment suite — `node --test tests/deployment` | **PASS** |
| Focused native Cards proof | **PASS — 9 passed, 0 failed** |
| Governance bytes | **PASS — frozen bytes** |
| **Mandatory U04 gate** — `node scripts/verify-u04-22-module-consent.mjs` | **PASS — 953 passed, 0 failed** |

The one probe that failed on the first attempt was `FAMILY_LAST_FOUR_REFUSALS` / `card media`: it authored a card image with no
alternative and no binding, which the adopted composer now refuses as an incomplete shape (`family:target-refused`) before it can
reach the authority check. The probe now authors the complete donor shape so it proves the boundary that still refuses — **unbound
authority** — and keeps its documented reason. That is a restatement of meaning, not a weakening.

## 3. Evidence added

`scripts/u04/cards-native-evidence.mjs`: the former single "deferred card image" refusal became six boundary refusals (no
alternative; decorative with an alternative; alternative without an asset; decorative flag without an asset; unknown zone; unsafe
path) and one **accepted** case carrying a described and an explicitly decorative owned image. The accepted case is built on a clone,
so the shared accepted document, the served markup proof and the Chromium evidence are untouched. `tests/unit/page-document.test.ts`
asserts the owned reference and both authored alternatives survive exactly, that a card without an image carries none, and that the
document still round-trips; the refusal count moved 19 → 24.

## 4. Hosted verification — exact head `a0c1639`

| Workflow | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- |
| `Verify U01 baseline` | **success** — 38 steps, 0 failed | **success** — 38 steps, 0 failed |
| `Uno Bootstrap Verify` | **success** — 10 steps, 0 failed | **success** — 10 steps, 0 failed |

Steps confirmed green on both systems: English demonstration, U03 locale and discovery refusals, **U03 published Pages (restored
afterwards)**, three-Site P6 default-bearing and default-free, the U04 22-module consent hermetic guard, and the U04 22-module
four-provider gate on real production HTTP and Chromium. Durable Pages and declarations were restored byte-for-byte after every run.

## 5. Explicitly OPEN — not claimed

- **Served card-image proof**: the actual locator, bytes, MIME and intrinsic dimensions read through the media route for a card
  image in real HTTP and Chromium (the rich test-owned fixture carries no owned image files yet).
- **Production 24-image case and the combined 32-binding Cards/Gallery Page**: the ceiling logic and the retained eight-binding rule
  are implemented, but those production cases are not yet executed.
- **Composer, planner and renderer unit coverage** for card images beyond the reader: the binding rules, the planned occurrence
  index and the rendered `<img>` are implemented but not yet pinned by their own tests.
- **Rich donor-to-native production evidence** (meta, Markdown lede/body, optional columns and surfaces together with images) and the
  responsive, keyboard and restoration matrix for cards.

These are the remaining Cards adoption work. `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04
OPEN. Cards remains a bounded capability and is **not** credited.

## 6. Disposition

Delivered implementation, Feature, ordinary-grid, Columns, Table, Media and Gallery behaviour, every refusal, restoration, durable
Card/Gallery semantic equivalence and concurrent multi-Facet/Site/Page/locale publication are preserved. This is the **STOP for
independent Architect review**.
