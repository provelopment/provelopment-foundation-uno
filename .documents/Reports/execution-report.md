# Execution Report — UNO-WO-122 / R06

**Outcome: COMPLETE for the R06 scope.** The delivered native Cards representation is preserved unchanged, the authorized
architecture inventory now admits its focused runner with its strictness and product-layer prohibition intact, every mandatory local
gate is green including the architecture gate, the focused production proof and the default U04 gate, and both hosted workflows are
verified on the evidence head and on this report's own head. Cards remains **PENDING** and no credit is claimed:
`PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 remains earned, C2 and U04 remain OPEN. No stage closure, release or
deployment.

| | |
| --- | --- |
| Order | `UNO-WO-122 / R06`, `FINAL — EXECUTE` (supersedes R05) |
| ACTIVE | **1,931 bytes**, SHA-256 `e0f0dd365c5b6342908c136b0c9ff62d0700dad484358f73c7c518cc8295b96e` — matched; private, ignored, untracked |
| Start / base | `2d0428a7f4a358d32a0511b05495e8495112757c`, tree clean, `HEAD` = `origin/main` |
| Preserved | the R05 implementation and focused runner, byte-for-byte (no product, runner, workflow, declaration, Page, dependency or frozen governance change) |

## 1. What R06 changed

Exactly the three authorized files.

1. **`tests/architecture/u01-boundaries.test.mjs`** — `scripts/verify-u04-cards-native.mjs` is admitted to the exact
   fixture-transaction importer inventory, in sorted position between `scripts/verify-u04-22-module-consent.mjs` and
   `scripts/verify-u04-json-slice.mjs`, with the inventory's stale "two sanctioned importers" wording corrected to the six that
   actually import it and one explanatory sentence naming why the new importer exists. Nothing else in the inventory moved: the
   transaction's own import policy, the `assert.deepEqual` strictness and the loop that forbids `src/app`, `src/core` and
   `src/application` from naming the transaction are untouched, so the gate stays a gate.
2. **`.documents/Architecture/u04-family-parity.md`** — one new table row records the delivered bounded capability: the closed
   `cards` surface, its refusals, the fact that it has **no** composer projection, the one-native-list markup, and its evidence. It
   is labelled `REPRESENTATION (bounded native text cards inside layout.grid; **not** a family credit)`.
3. **This report.**


## 2. Mandatory local gates — actual results

| Gate | Command | Result |
| --- | --- | --- |
| Architecture boundaries | `node --test tests/architecture/u01-boundaries.test.mjs` | **PASS, exit 0** (was the R05 blocker) |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | **0 errors** |
| Unit | `pnpm test` | **PASS — 35 test files** |
| Deployment | `node --test tests/deployment` | **PASS, exit 0** (54 tests) |
| Focused Cards production proof | `node scripts/verify-u04-cards-native.mjs` | **PASS — 18 PASS, 0 FAIL, exit 0** (9 of them the transaction) |
| Default U04 gate | `node scripts/verify-u04-22-module-consent.mjs` | **PASS — 953 passed, 0 failed, exit 0** |

The U04 gate reported, in its own words: `U04_MODULE_IDS=22/22`, `U04_BROWSER_MATRIX=16/16`, `BROWSER_MATRIX=16/16`,
`A2_LOCAL_TABLE_LIST_HERO_STATS_STEPS_QUOTE_FAQ_COLUMNS_MEDIA_EVIDENCE=63/63`, the concurrent-publication P6 multi-Site checks, all
`FAMILY_*` checks, `nothing was staged by the gate`, and — new and mandatory — `U04_NATIVE_CARDS_HTTP` ×3,
`U04_NATIVE_CARDS_REFUSALS`, `U04_NATIVE_CARDS_BOUNDS`, `U04_NATIVE_CARDS_BROWSER` at 390/768/1280, `U04_NATIVE_CARDS_RESTORE` and
"the mandatory native Cards transaction ran and every required check passed".

## 3. What the served proof actually shows

Four sections, one native list each, **3 / 24 / 1 / 1** items, surfaces muted / bordered / plain / absent; resolved tracks
**1,2,3 · 1,2,4 · 1,2,2 · 1,2,3** at 390 / 768 / 1280 with positive, equal tracks and distinct cells; every card's own meta, title
and body in authored order and nothing where nothing was authored; the rich section's authored heading and Markdown lede, with no
heading invented elsewhere; card border ≥ 1px and padding `20px 20px 20px 20px`; the muted surface equal to the live
`--uno-surface` token, the bordered edge present, `plain` and the absent case computing no paint, no edge and no padding; one safe
link, keyboard-reached, visible, left by Tab with the URL unchanged; no overflow, no console error, no foreign request;
**19/19** closed refusal probes and the `1/8/9/24` accepted bounds; the fixture restored byte-exactly with a fresh original response.

The route proved is **test-owned**: `wo122-native-cards`, declared for the length of the run by the existing fixture transaction and
removed with its source. The durable `components` Page, every declaration and every fixture of the composer are untouched, and the
gate's own removal check confirmed the tree afterwards.

## 4. Limitations

- **Cards remains PENDING and is not credited.** The six-case browser matrix, images/actions and any family credit remain a later
  adoption review; the architecture record labels the capability a representation, not a family.
- **One asymmetric proof, stated deliberately.** The gate's native transaction runs on the family fixture route with
  `originalMarker: null`, so its restoration evidence is the fixture digest plus the absence of every temporary anchor; only the
  focused entrypoint additionally proves the before-document marker by content.
- **Untouched and unclaimed:** the ordinary `layout.grid` children/props/markup, the composer, the family fixtures, the planner, the
  oracle and the frozen governance documents are unchanged, and `scripts/verify-governance-docs.mjs` was re-run green.

## 5. Hosted verification

Recorded in §6 once observed, on both `Verify U01 baseline` and `Uno Bootstrap Verify`, for `ubuntu-24.04` and `windows-2025`, for
the evidence head and for this report's head.

## 6. Disposition

Committed and pushed without force as one exact head after the local gates above were green, then amended only with the hosted
results this section records. The report is a **STOP for independent Architect review**; nothing further is written, reverted or
force-pushed until that review returns.
