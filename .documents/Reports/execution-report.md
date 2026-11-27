# Execution Report — UNO-WO-124 / R07

**Disposition: CHECKPOINT at M1, mid-implementation. No implementation was committed or pushed.** M1's card action is implemented across the reader, composer, renderer and stylesheet; `tsc` and `lint` are clean and 1,414 of 1,416 unit tests pass. Two obsolete action-refusal assertions still need updating to prove the new closed contract, so the mandatory U04 gate, U03, push and hosted verification have not run. `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`.

| | |
| --- | --- |
| Order | `UNO-WO-124 / R07`, `FINAL — EXECUTE` |
| ACTIVE | **6,113 bytes**, SHA-256 `c1867486997607088e35360bcfc13cd4bbbce5a0252a87ac04e8f78db1068b27` — matched byte-for-byte; private, ignored, untracked |
| Start SHA | `5a6b2e17650bb434eb12c8aa10e86878c15e6372` = `origin/main`; empty index; clean tree |
| HEAD | no implementation commit this run; the only commit is this report |
| Transient fixtures | none created; no fixture transaction ran, so nothing needed restoration |

## M1 implemented (preserved unstaged)

`src/core/page-document.ts` — the card allow-list admits `action`; `UnoLayoutCard.action` is typed as the static outbound anchor with the closed optional variant; `readCardAction` reads exactly `{label, href, variant?}`, classifies the destination with the unchanged `classifyAuthorDestination` and admits only `https`/`mailto` (otherwise `document:unsafe-link`), while `targetId`/`linkId`/`routeTarget` are shape refusals; the card builder emits `action` only when authored.

`src/application/compose-uno-foundation-families.ts` — the Cards donor card allow-list admits `action`, and a new arm adopts Hero's static outbound shape (one plain label, one `href`, closed `variant`), refusing `route`/`link` with `family:unsupported-feature` so no destination is ever resolved or invented.

`src/components/uno-page-sections.tsx` — one ordinary anchor after the body: `class="uno-json-card-action"`, `data-uno-variant` for primary/secondary/link, `rel="noreferrer noopener"`, the label as its own text; never a button, fragment, inline handler or request.

`src/app/globals.css` — the three closed presentations of that anchor, a visible `:focus-visible` ring, hover opacity and a reduced-motion guard.

## Tests already run

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npm run lint` | **0 problems** |
| `pnpm test` | **1,414 / 1,416 passed across 35 files** — 2 failures, both obsolete action-refusal assertions |

Exact next executable test: `pnpm test`, after these two ledger updates.

1. `tests/unit/page-document.test.ts > native cards (UNO-WO-122) > refuses every closed native Cards probe…` — `NATIVE_CARDS_REFUSALS` still carries a probe labelled *a deferred card action*, which now correctly accepts. Replace it with probes proving the new refusals (`{label,targetId}` → `document:invalid-props`; `href: "javascript:…"` and `tel:…` → `document:unsafe-link`) and add one positive probe asserting the accepted `{label, href, variant}` with `rel`, class and label.
2. `tests/unit/uno-foundation-families.test.ts > … still refuses every out-of-subset cards and features donor field` — the `action` entry of the extras loop now yields `family:target-refused` where the helper expects `family:unsupported-feature`; drop `action` from that loop and assert the new arm's own refusals (`route`/`link` destinations) plus one composed positive.

After those: the focused native proof, the mandatory U04 gate (which also runs the real composed transaction and the production HTTP/Chromium proof), U03 published Pages, then both hosted operating systems.

## Preserved implementation digests
| `src/app/globals.css` | 48190 B | c862bbdb417e9f1d... |
| `src/application/compose-uno-foundation-families.ts` | 99076 B | b0ed5159f419564f... |
| `src/components/uno-page-sections.tsx` | 47231 B | 5ab17c37c08e36f2... |
| `src/core/page-document.ts` | 164602 B | fe8c0ea81f764742... |

## Not claimed

No parity credit. Cards' action dimension is implemented but not yet evidenced, so the unchanged closure evaluator has not been run and `14/17` and `56/59` are **not** emitted. Features, Actions and ContactForm remain pending; C2 and U04 stay open; no release or deployment authority is claimed. Every earlier credit is untouched: C1, the 22 modules, the four zones and their browser matrix, the nine credited families, the native and composed owned-image proofs at `1607cfb` (12/0 and 966/0), the seventeen-family baseline fixture and all 24 closed refusals.

## Disposition

STOP for independent review. A fresh Owner activation at the actual HEAD, with these preserved edits, is required to finish M1 verification and then M2.
