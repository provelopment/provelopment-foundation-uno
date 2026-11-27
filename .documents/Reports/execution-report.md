# Execution Report — UNO-WO-124 / R09

**Delivered to `main`: the card action, end to end. Cards parity itself is NOT claimed** — the closure work (rich donor matrix, 24-image and 32-binding cases, ledger and evaluator) was not reached. `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`.

| | |
| --- | --- |
| Order | `UNO-WO-124 / R09`, `FINAL — EXECUTE` |
| ACTIVE | **2,989 bytes**, SHA-256 `ed8731752106322492c352ab1f9abe9c35cc92c02f2ace0a10d5e182224026d0` — matched; private, ignored, untracked |
| Start SHA | `60979d42ab9d931a57b9c8caf8e9f24829f305af` = `origin/main`; eight preserved R09 inputs reconciled and retained |
| Code head | **`876507f46f859e8133959828239afed3275631ec`** — `feat(u04): serve a card action through native and composed Cards` |

## What landed

A donor card's optional single action is now a first-class, bounded part of the native Cards contract, composed and served for real:

- **Reader** (`src/core/page-document.ts`): `action` is admitted on a card and typed as the static outbound anchor with the closed optional variant. `readCardAction` accepts exactly `{label, href, variant?}`, runs the **unchanged** `classifyAuthorDestination`, admits only `https`/`mailto` and refuses everything else as `document:unsafe-link`; `targetId`, `linkId` and `routeTarget` are shape refusals, so a card can never acquire a target, route projection or application link. The builder emits `action` only when authored, so every previous document is byte-identical.
- **Composer** (`src/application/compose-uno-foundation-families.ts`): the donor card allow-list admits `image` and `action`; the new arm adopts Hero's own static outbound shape and refuses `route`/`link` with `family:unsupported-feature`. No destination is resolved, guessed or invented.
- **Renderer and stylesheet**: one ordinary anchor after the body (`uno-json-card-action`, `data-uno-variant` primary/secondary/link, `rel="noreferrer noopener"`), the label as its own text, a visible `:focus-visible` ring, hover opacity and a reduced-motion guard — never a button, fragment, inline handler or request.
- **Evidence**: the composed fixture authors a card action (`Read the plate`, `https://example.org/wo124-card`, `secondary`), and the composed production transaction gained `U04_COMPOSED_CARDS_ACTION`, proving the served anchor, its classified href, its closed variant, its own label and the absence of any script destination or button form. The native refusal list's obsolete *deferred card action* probe became *a card action with a same-document target*, and the reader gained one positive probe plus six refusals (target, application link, `javascript:`, `tel:`, two destinations, no label).

## Gates — executed results

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npm run lint` | **0 problems** |
| `pnpm test` | **1,416 / 1,416 passed, 35 of 35 files** |
| Focused `verify-u04-cards-native.mjs` | **PASS — 12 passed, 0 failed** |
| **Mandatory U04 gate** (real production HTTP and Chromium, native and composed) | **PASS — 967 passed, 0 failed** (966 at `1607cfb`, +1 for `U04_COMPOSED_CARDS_ACTION`) |
| U03 published Pages | **PASS** |
| Deployment fixtures and readiness | **PASS** |
| Architecture / Governance | **PASS / PASS** |
| Hosted `Verify U01 baseline` at `876507f` | **completed/success — 38/38 steps, 0 failed on `ubuntu-24.04` and `windows-2025`** |
| Hosted `Uno Bootstrap Verify` at `876507f` | **completed/success on both** |

A mid-run poll of the Windows job showed six steps marked failed while the job was still `in_progress`; the completed result is **38/38 success with zero failures** on both operating systems, which is the evidence of record.

## Not delivered (why no parity credit)

M2 was not reached: the remaining rich donor matrix beyond the proved surface, the 24-image Cards and combined 32-binding Cards/Gallery production cases, the parity/provenance ledger update with pinned donor blobs and rights, and the unchanged closure evaluator run that must earn `14/17` and `56/59`. Emitting those numbers without that execution would be a forced score, so they are not emitted.

## Preserved

C1 and every earlier credit are untouched: the 22 modules, the four zones and their browser matrix, the nine credited families, the native and composed owned-image proofs (12/0 and 966/0 at `1607cfb`), the seventeen-family baseline fixture, the ordinary eight-binding ceiling and all 24 closed refusals. Features, Actions and ContactForm remain pending; C2 and U04 stay open; no stage closure, release or deployment.

## Disposition

STOP for independent review. The card action is delivered and proved; Cards closure needs a fresh activation for M2.
