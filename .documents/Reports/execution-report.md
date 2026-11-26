# Execution Report — UNO-WO-124 / R04

**Delivered: owned card images now arrive over real production HTTP and Chromium in the native Cards proof.** Two runtime-only
synthetic plates are served per card, and the mandatory U04 gate executes the same transaction.

| | |
| --- | --- |
| Order | `UNO-WO-124 / R04`, `FINAL — EXECUTE` |
| ACTIVE | **4,047 bytes**, SHA-256 `3823e332aabd33a3c22d445c35ff66f9df60f3f2f5751f1f3d19da89d9701db3` — matched; private, ignored, untracked |
| Start SHA | `4494258477be156b8424bb1ba600935ef1aad929`, empty index, clean tree |
| Code head | `c271b2fe9498fb002c4183bcd6a09c3e394795b9` (`test(u04): deliver both owned card plates over production HTTP and Chromium`) |

## 1. What changed (one file, inside the ledger)

`scripts/u04/cards-native-evidence.mjs` only. The served native document now authors the donor's optional owned image on three
cards: card one a described plate (`cards/plate.png`, 64x64), card two **no image at all**, card three the same plate again as an
explicitly decorative image (`alt: ""`), and the `plain` section's card a second distinguishable plate (`cards/alt-plate.png`,
96x40). Nothing else about the document changed: heading, level, Markdown lede and body, column intents, surfaces and the safe
link are exactly as before.

- **Fixture lifecycle.** A deterministic PNG writer (builtin `node:zlib` only) produces both plates; they are created with `flag:"wx"` into a `cards/` directory that must be **absent** beforehand, and removed file-by-file and then as an empty directory in
  `finally`. A pre-existing directory is never reused and never removed. The fixture check records `absent`, both sizes and both
  byte counts; the cleanup check proves the zone by readback, not by having called `delete`.
- **Per-card extraction.** Each card's own `<figure>` is read from that card's own `<li>`: count, `src`, `alt`, class and whether it
  is the card's first element — never a section-wide match, so a shifted or inherited figure fails.
- **HTTP proof.** The served markup must show the exact per-card ownership, the described alternative, the exactly-empty decorative
  alternative, image-first order and no image on the omitted card. Both identities are then fetched from the Page's own origin:
  `200`, `image/png`, a byte count equal to the installed fixture, and IHDR intrinsic dimensions `64x64` and `96x40`.
- **Chromium proof.** Every executed case now also requires each card's figure to be `complete` with the right `naturalWidth`/
  `naturalHeight`, the right alternative, first-element order, and no figure on the image-free card, while the existing track,
  row-order, text, border, padding, surface, keyboard, overflow, error and foreign-request assertions are unchanged.

**One measured fact worth recording:** the media route namespaces a served locator by Page **occurrence**, so the two cards that
author the same identity receive two distinct locators over identical bytes (`/uno-media/en-001/wo122-native-cards/0` and `/2`, both
136 B, 64x64). Repetition is therefore proved by byte and dimension equality across the two cards and the second identity by the
opposite comparison — never by string equality of URLs, which would prove nothing.

## 2. Gates — actual results

| Gate | Result |
| --- | --- |
| `node scripts/verify-u04-cards-native.mjs` | **PASS — 12 passed, 0 failed** (was 9; +FIXTURE, +IMAGES, +CLEANUP) |
| **Mandatory U04 gate** `node scripts/verify-u04-22-module-consent.mjs` | **PASS — 956 passed, 0 failed** (was 953) |
| Unit — `pnpm test` | **PASS — 35 of 35 files, 1,416 tests** |
| Typecheck — `npx tsc --noEmit` | **0 errors** |
| Lint — `npm run lint` | **0 problems** |
| Architecture boundaries | **PASS** |
| Deployment suite | **PASS** |
| Governance frozen bytes | **PASS** |
| Capsule zone after the run | `cards/` **absent** — no durable asset byte added, changed or left behind |

One unit failure was met and fixed inside the ledger: `tests/unit/page-document.test.ts` pins the R01 accepted-probe shape and is
outside this order's ledger, so the probe was restored to its original card index (the served document keeps its images) rather than
editing a test the order does not authorize.

## 3. Hosted verification — exact code head `c271b2f`

| Workflow | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- |
| `Verify U01 baseline` | **success** — 38 steps, 0 failed | **success** — 38 steps, 0 failed |
| `Uno Bootstrap Verify` | **success** — 10 steps, 0 failed | **success** — 10 steps, 0 failed |

Steps include English demonstration, U03 locale and discovery refusals, U03 published Pages (restored afterwards), three-Site P6
default-bearing and default-free, the U04 hermetic guard and the U04 22-module four-provider gate on real production HTTP and
Chromium. Durable Pages and declarations were restored byte-for-byte after every run.

## 4. Preserved, unchanged

Text-only Cards evidence, all 24 closed refusals, the accepted bounds, the image-free sections, responsive column resolution at 390,
768 and 1280, keyboard reach and departure, restoration of the fixture page bytes with a fresh original response, resource/error/
foreign-request silence, and the Composer, Features, ordinary grid, Columns, Table, Media and Gallery behaviour are all untouched and
still asserted.

## 5. Still open — not claimed

Composed (Foundation-composer) Cards delivery, per-card unit coverage in the four unit files, the 24-image and combined
32-binding production cases, the rich donor-to-native production matrix and the remaining donor parity stay open exactly as the order
states. `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04 OPEN. Cards is **not** credited.

## 6. Disposition

STOP for independent Architect review.
