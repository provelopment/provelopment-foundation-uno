# Execution Report — UNO-WO-124 / R05

**Delivered: owned card images now arrive through real Foundation-composed Cards, proved over production HTTP and Chromium in the mandatory gate — and the native proof was corrected to real byte equality.** Cards is still not credited.

| | |
| --- | --- |
| Order | `UNO-WO-124 / R05`, `FINAL — EXECUTE` |
| ACTIVE | **4,810 bytes**, SHA-256 `225fc410aedd94d717d9578696b70213d32eaadc190e2376845d1409a36876f2` — matched; private, ignored, untracked |
| Start SHA | `c3d8cc90e588193e0e9ef4d8490a3ca0b77f0585`, empty index, clean tree |
| Code head | `1607cfb04ddb842dfaa70e4636b833bf50fd9440` — `test(u04): prove owned card images through composed and native Cards` |

R04's one outstanding observation is closed: its report head `c3d8cc9` finished `completed/success` for both workflows on both operating systems.

## 1. Composed Cards delivery (new module, inside the ledger)

`scripts/u04/cards-composed-evidence.mjs` runs one bounded composed transaction on the existing test-owned family route:

- **Real adapter, explicit bindings.** `composeUnoFoundationSubset` composes one donor-shaped Cards section (`{type, items, heading, lede, columns: 2, surface: "muted"}`) whose four cards carry a described image, an omitted image, an explicitly decorative image (`decorative: true`, exactly empty alternative) and a second identity. The two donor identities are bound to the two synthetic Page plates the gate already installs (`wo066-family-plate.png`, 64x64; `wo121-alt-plate.png`, 32x48). The serialized adapter output is what gets served — never a hand-built native substitute.
- **Composition proof.** The accepted Page must carry exactly that ownership; an identity left unbound must refuse the whole composition with a closed `family:` reason before anything is served.
- **Markup proof.** One list, four cards in authored order, the authored heading, column intent and surface, each card's own figure first with its own alternative, none on the omitted card.
- **Delivery proof.** Every locator must be on the Page's own origin **before** any bytes are requested; the three occurrence locators must be distinct; each response must be `200`, `image/png`, and `Buffer.equals`-identical to the intended installed plate, with that plate's IHDR dimensions. Repetition is proved by content equality, distinctness by content difference — never by URL equality.
- **Browser proof** at 390, 768 and 1280: authored tracks (an authored `2` resolving 1/2/2), row order, distinct cells, every figure `complete` at its own intrinsic size with its own alternative, no figure on the omitted card, no overflow, no console error, no foreign request.
- **Restoration.** The original response is captured **before** the swap; the transaction restores the fixture bytes in `finally` and proves the original digest plus a fresh original response free of the composed anchors. The plates belong to the caller and are only read, so no asset or declaration outlives the run.

## 2. Specified native corrections (same ledger)

- Length-only comparisons replaced with **actual byte equality** against the installed file.
- Same-origin locator checks and distinct-occurrence checks added before fetching.
- Fixture creation is now **exception-safe from the first successful write**: a partial install removes exactly what it created and rethrows; a pre-existing `cards/` directory still fails closed and is never reused or removed.
- The original response is now captured **before** the swap, so restoration is compared with the state actually found.
- Every existing native positive/refusal, keyboard, resource and restoration assertion is preserved.

## 3. Gates — actual results

| Gate | Result |
| --- | --- |
| Focused `verify-u04-cards-native.mjs` (run first, after the shared changes) | **PASS — 12 passed, 0 failed** |
| **Mandatory U04 gate** | **PASS — 966 passed, 0 failed** (953 → 956 in R04 → 966 now; +10 for the composed proof and its roll-up) |
| Unit `pnpm test` | **PASS — 35 of 35 files** |
| Typecheck / Lint | **0 errors / 0 problems** |
| Architecture / Deployment / Governance | **PASS / PASS / PASS** |
| Build | reused the gate's own production build (no build error step green) |
| Capsule zone | `cards/` **absent**; both plates removed with their directory |

Two refusals were met while establishing the composed case and both were fixed inside the ledger: the donor Cards key is `items` (not `cards`), and the section allow-list carries no `ledeMarkdown` flag because the lede is Markdown-capable by contract.

## 4. Hosted verification — exact code head `1607cfb`

| Workflow | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- |
| `Verify U01 baseline` | **completed/success** — 38 steps | **completed/success** — 38 steps |
| `Uno Bootstrap Verify` | **completed/success** | **completed/success** |

## 5. Preserved / still open

Preserved: native delivery and every native assertion, the seventeen-family baseline fixture (only additive exports were added), all 24 closed refusals, the accepted bounds, restoration of Page bytes and declarations, and Composer, Features, ordinary grid, Columns, Table, Media and Gallery behaviour.

Still open by the order: additional unit coverage, the 24-image and 32-binding production cases, rich donor parity and supported card actions. `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; no C2/U04 closure and no Features advance.

## 6. Disposition

STOP for independent Architect review.
