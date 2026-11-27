# Execution Report — UNO-WO-125 / R05

**Delivered and held locally: the donor Features composition, adopted through the native representation with owned decorative icons and the shared binding contract. Not published, because twenty-four pre-adoption assertions still pin the replaced wrapper tree — so `origin/main` stays green at `f906172` and Features stays uncounted.** `PARITY_FEATURES=PENDING`, `U04_PARITY=14/17`, `U04_PROXY=56/59`.

| | |
| --- | --- |
| Order | `UNO-WO-125 / R05`, `FINAL — EXECUTE` |
| ACTIVE | **5,476 bytes**, SHA-256 `8be57fadf77a9c00095eaa5a8c098bfd2db3f90cf148b4e8c553d4094261b266` — matched |
| Start SHA | `f906172f69416081cc35c51fe2b50a97e5f26e0c` = `origin/main`; clean tree |
| Published head | **`f906172f69416081cc35c51fe2b50a97e5f26e0c`** — unchanged, green |

## What the local commit contains

The composer's `case "features"` now emits the accepted native features node instead of the earlier wrapper stack of list-grid sub-stacks:

- **One node per authored section** — `{ features, columns?, heading?, level?, lede?, ledeMarkdown?, surface? }` — with `id` unchanged, so a Page's anchors survive the change.
- **Donor bounds** — one to twenty-four units; the plain 160-code-point title; the Markdown-capable 4,000-code-point body declared through the literal `true` only when the shared reader actually classifies Markdown.
- **No invented intent** — an absent `columns`, `heading`, `lede` or `surface` stays absent, so the renderer's own three/two/one default and outline apply.
- **Icons** — the donor icon is adopted only as an owned identity from this Page's own bindings, resolved through `readMediaSourceIdentity`, recorded in the exact consumed set, and refused when unbound, misowned or carried by an extra identity. Both donor shapes are accepted: a bare identity string, and an authored `{ src }` object whose `alt`, if present, must be exactly empty and whose `decorative`, if present, must be exactly `true`, because a feature icon is decorative by contract.
- **Binding ceiling integration** — `featuresComposed` joins `galleryComposed` and `cardsComposed` in the ordinary single-image ceiling exemption, so a legitimate twenty-four-icon section moves into the shared thirty-two ceiling that already governs those families rather than inventing an asset system. No new binding mechanism was added; the exact-consumed-set contract is the cards contract.

`npx tsc --noEmit` and `npm run lint` are **clean** with the adoption in place.

## Why it is not published

Twenty-four assertions in `tests/unit/uno-foundation-families.test.ts` still describe the pre-adoption tree, so the suite is not green. Publishing a red `main` is worse than holding a green origin with a precisely described local diff — the SOP and this order both permit exactly that. I did not attempt a partial rewrite because the two largest blocks must be replaced wholesale rather than patched, and a half-migrated ledger would be harder to review than a clean inventory.

The inventory, exactly:

1. `bounded cards and features` — node count and source order.
2. `cards and features React markup` — the feature element shape.
3. `cards and features refusal` — `features fields outside the bound` and `malformed features values`, which must now distinguish representable fields from out-of-subset ones.
4. Both `refuses a candidate above the Uno 64 KiB` probes — compact serialization changes byte size; the honest probe constructs a genuinely over-limit input or output and verifies the unchanged cap.
5. `media donor-shape refusals` and `gallery target refusals` — both share the binding-ceiling path now touched by `featuresComposed`.
6. `cards and features authored heading` — six assertions.
7. `cards and features authored lede` — eight assertions.
8. `the committed durable family Page` — historical native bytes and digests are preserved while `family-16-features`, and `family-15-cards` or `family-5-gallery` where recomposition moves them, now recompute.
9. `the three donor heading outlines` — the features outline is now the single node's own heading and level.
10. `tests/unit/u04-verification-modules.test.mjs` — the extracted fixture must distinguish the historical Page from the newly composed one, including the old Features selectors near lines 3293 and 4716.

Each rewrite is simpler than what it replaces: native props, order, absence and semantic markup asserted directly against one node, with the hostile and out-of-subset refusals retained as refusals. The R04 proof suite (`tests/unit/u04-features-representation.test.ts`) already covers the representation's positives and refusals and stays green; it must not be repeated as if it were the delivery.

## Then, in order

1. Rewrite the ten items above; keep every historical byte and digest that is genuinely historical while letting recomposition differ at the three named selectors.
2. Assert the composer's own positive coverage: icon bound, unbound, repeated, non-decorative refused.
3. Real composed icon delivery through the existing transaction machinery — HTTP and Chromium, omission and repetition, responsive geometry, rich semantics — then the seven evidence dimensions and the `features` row into the unchanged evaluator for `15/17`, `57/59` and C2, reconciling ledger prose, pins and overclaim guards together.
4. Cards assurance still owed: the 24-image and combined 32-binding Cards/Gallery production cases.

## Preserved

C1, the twenty-two modules, the four zones, the browser matrix, the fourteen credited families, the owned-image and card-action proofs, the seventeen-family fixture, the eight-binding ceiling, every closed refusal, the native features representation and its executed proof suite, and every byte of the cards representation and ordinary grid. The adoption changes only what a Features section composes to; no other family's source, props, markup or acceptance moves.

## Disposition

STOP for independent review. `origin/main` is green and unchanged; the adoption waits on its ledger reconciliation in one local commit, which is the whole of the remaining product work before evidence.
