# Execution Report — UNO-WO-122 / R06

**Outcome: the authorized objective is achieved; the delivery is NOT green, and this report is a STOP.** The delivered native Cards
representation is preserved unchanged, the authorized architecture inventory now admits its focused runner with its strictness and
product-layer prohibition intact, and every local gate is green. Hosted `Verify U01 baseline` now passes `Architecture boundaries` on
both operating systems and then fails **`Lint`** on two one-line defects that R05 introduced in files R06's ledger forbids changing —
see §5 and §6. Cards remains **PENDING** and no credit is claimed: `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`;
C1 remains earned, C2 and U04 remain OPEN. No stage closure, release or deployment.

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

## 5. Hosted verification — actual results

Evidence head **`9d7f81de949fbfb79bbc9930a95548974057be3b`** (`fix(arch): admit the focused native Cards runner …`), pushed without
force from `2d0428a`, tree clean.

| Workflow | Run | ubuntu-24.04 | windows-2025 |
| --- | --- | --- | --- |
| `Uno Bootstrap Verify` | `45777460173` | **success** | **success** |
| `Verify U01 baseline` | `45777460251` | **failure — `Lint`** | **failure — `Lint`** |

Report head **`b7c90eedf0413ccfccbbc26bcf4d590bbb24ac34`** reproduces the same shape exactly — `Uno Bootstrap Verify` success on both
systems; `Verify U01 baseline` green through `Architecture boundaries` and failing only at `Lint` on both — which confirms the
blocker is the two R05 lint lines and not the R06 change.

`Architecture boundaries` — the R05 blocker — **passes on both systems**. The run then stops at `Lint`, and every later step
(typecheck, unit, the U04 slice and gate, the HTTP and browser proofs, deployment readiness) is skipped on this head.

`npm run lint` reproduces it locally as **exactly two errors, 0 warnings**:

```
  657:11  error  'originalHtml' is assigned a value but never used                       @typescript-eslint/no-unused-vars
   16:3  error  Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do
                nothing if the following line is error-free                            @typescript-eslint/ban-ts-comment
```

Both are R05 artefacts left by that round's own late edits, and neither changes behaviour:

1. `scripts/u04/cards-native-evidence.mjs:657` — `originalHtml` became unused when R05 replaced literal HTML equality with the
   marker-plus-digest restoration proof. The fix is deleting that one assignment; `originalResponse` stays, because its status and
   the original fetch are still part of the proof.
2. `tests/unit/page-document.test.ts:16` — the declaration suppression must read `@ts-expect-error` rather than `@ts-ignore`; the
   diagnostic really is there (TS7016, no declaration for the plain-ESM evidence module), so `@ts-expect-error` is satisfied rather
   than unused. The directive must stay on the line immediately above the module specifier, which is the line TypeScript reports.

## 6. STOP — the fix lies outside this ledger

R06 authorizes exactly three files: the architecture inventory, the architecture record and this report. The two defects above sit in
`scripts/u04/cards-native-evidence.mjs` and `tests/unit/page-document.test.ts`, which the same order names only as things to
*preserve* and explicitly forbids changing ("No product, other test, runner … change"). Hosted `Lint` cannot pass without them, so two
clauses of the controlling instruction conflict, and the SOP's rule for a conflict — and R06's own clause, "If another out-of-ledger
blocker arises, STOP and preserve" — governs: **the files are untouched and the red check is preserved as evidence.**

**Requested decision (one line of authority clears it).** Authorize, in a follow-on order, these two non-behavioural edits:

```
scripts/u04/cards-native-evidence.mjs:657   - const originalHtml = originalResponse.status === 200 ? await originalResponse.text() : "";
tests/unit/page-document.test.ts:16         -   // @ts-ignore - no declaration file is shipped for the plain-ESM runner asset
                                            +   // @ts-expect-error - no declaration file is shipped for the plain-ESM runner asset
```

Everything else is already in place: with those two lines corrected, `npm run lint` returns 0 problems, and every downstream step is
the same locally green chain recorded in §2 — the hosted runner simply has never been allowed past `Lint` on this branch since the
R05 push, because `Architecture boundaries` failed first then and `Lint` fails first now.

Until that decision arrives, this delivery is **not** releasable and the capability remains uncredited. Nothing further is written,
reverted or force-pushed; this report is the STOP for independent Architect review.
