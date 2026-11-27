# Execution Report — UNO-WO-125 / R01

**Delivered: the Cards closure dimensions are now evidence-derived rather than declared, verified locally and on Ubuntu. Not delivered: Features parity and C2. `PARITY_FEATURES=PENDING`, `U04_PARITY=14/17`, `U04_PROXY=56/59`.**

| | |
| --- | --- |
| Order | `UNO-WO-125 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **3,548 bytes**, SHA-256 `f8b1d92c77fd7f72cb9ec4372ba2124dcea1515cc71b8ee0ed2a768bbd815e46` — matched |
| Start SHA | `96e56d9ac9482529845944e40ae897d3a4e66cfe` = `origin/main`; clean tree |
| Code head | **`7ffb35b76c27b5e0c64266166cdef07519ec1609`** — `test(u04): derive the Cards source, reader and rights dimensions from recorded evidence` |

## What was delivered

The order asked for evidence-backed source, reader and rights results instead of unconditional `true` assignments. That is now true in the mandatory gate: `cardsClosureEvidence` reads the pinned provenance and licence rows the ledger already carries for `cards` (`cardsSourceRow`, `cardsRightsRow`) and takes `reader` from the strict reader's own accepted and refused probes executed by the mandatory native transaction. `renderer`, `http`, `browser` and `refusal` continue to come from the composed and native transactions' own outcomes. No dimension is declared any more.

The fourteen-family row still holds on those stricter inputs: the unchanged oracle, with no checkpoint selector, reports `U04_PARITY=14/17` and `U04_PROXY=56/59`.

## What was not delivered, and why

**Features parity and C2 were not implemented.** The mapping I read in the composer (`case "features"`, lines 1339–1404) shows how far the current subset is from the donor contract the order specifies: it requires `columns` explicitly, bounds items to **8**, composes neither Markdown lede nor Markdown item bodies, has **no section surface**, and — decisively — **no icon at all**. Icons are the donor feature's whole visual identity and, per the order, must arrive as *owned asset identities rendered decoratively*, which means a native representation extension: reader support for an owned icon on a list item, planner involvement, renderer markup and stylesheet, refusal coverage, and only then composer wiring, plus the 24-item bound and the absent-column default.

That is a larger contract change than the Cards action, and it cannot be done honestly in the capacity this run had left. I did not start it, because a half-added icon contract would have left the tree red or the feature unverifiable — and I will not push either.

Also still owed from WO-124: the real **24-image Cards** and **combined 32-distinct-binding Cards/Gallery** production cases. These need a generalised multi-plate fixture installer and the identity-ceiling interaction to be evidenced deliberately (an over-bound refusal is one of the cases), which is its own contained piece of work.

## Gates executed at `7ffb35b`

| Gate | Result |
| --- | --- |
| `pnpm test` | **1,416 / 1,416, 35 files** |
| **Mandatory U04 gate** | **PASS — 968 passed, 0 failed**, including the fourteen-family oracle row at `14/17` and `56/59` |
| Hosted `Verify U01 baseline` — `ubuntu-24.04` | **completed/success, 38/38 steps, 0 failed** |
| Hosted `Verify U01 baseline` — `windows-2025` | **in progress when this report was written**; earlier polls of the same job shape resolved to success, but it is not yet evidence and is not claimed |
| Hosted `Uno Bootstrap Verify` | **completed/success** |

## Exact next steps for Features

1. Extend the native list-item representation with an optional owned icon (`asset`, decorative alt = `""`, `decorative: true`), read with the existing owned-asset reader, and render it as a decorative image before the title; keep the feature presentation distinct from bordered cards (no card border, icon-led layout).
2. Add the donor's optional section `surface` to the features wrapper, the Markdown lede, Markdown item bodies (via `content.prose { markdown: true }` as Hero does) and the absent-column default, then raise the item bound to the donor's 24 with the aggregate ceiling preserved.
3. Prove it the way Cards was proved: reader positives and refusals, composer ownership and binding consumption, served markup, byte-equal icon delivery over production HTTP, three-width Chromium readings, and the omission case.
4. Then feed `features` into the unchanged oracle for the fifteenth family and C2 at `15/17` and `57/59`, updating the ledger and its historical pins together, with guards against overclaiming retained.

## Preserved

Every earlier credit: C1, the twenty-two modules, four zones and browser matrix, the fourteen credited families including Cards, the owned-image and card-action proofs, the seventeen-family baseline fixture, the ordinary eight-binding ceiling and every closed refusal. `actions` and `contactForm` remain pending; C2 and U04 stay open; no stage closure, release or deployment.

## Disposition

STOP for independent review.
