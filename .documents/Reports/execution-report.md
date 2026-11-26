# Execution Report — UNO-WO-122 / R07

**Outcome: COMPLETE and green.** The delivered native Cards text and presentation increment is preserved, the approved architecture
inventory is preserved, the two outstanding lint defects and their stale comment are resolved inside the R07 ledger, every mandatory
local gate is green — lint included — and both hosted workflows pass on both required operating systems for the evidence head and for
this report's head. Cards remains **PENDING** and no credit is claimed: `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`,
`U04_PROXY=55/59`. C1 remains earned; C2 and U04 remain OPEN. No stage closure, release or deployment.

| | |
| --- | --- |
| Order | `UNO-WO-122 / R07`, `FINAL — EXECUTE` (supersedes R06) |
| ACTIVE | **2,058 bytes**, SHA-256 `74a4fe875f404da7578612e95e2b69ace259fd92f46c42272ee650c69cb0491b` — matched; private, ignored, untracked |
| Start / base | `50e5ea1fa0e1a922ae3c70970682b395dba9ad0b`, tree clean, `HEAD` = `origin/main` |
| Preserved | the product implementation, the focused runner's behaviour, the architecture inventory's strictness, and every workflow, dependency, oracle, durable Page/declaration and frozen governance file — byte-for-byte |

## 1. What R06 established and R07 finished

R06 (evidence head `9d7f81d`) admitted `scripts/verify-u04-cards-native.mjs` to the exact fixture-transaction importer inventory —
`Architecture boundaries` went green on both operating systems — and recorded the capability in the architecture table. It then stopped
honestly at hosted `Lint`, because the two remaining defects sat in files its ledger forbade touching. R07 authorizes exactly those
files, and they are corrected without behaviour change:

1. **`scripts/u04/cards-native-evidence.mjs`** — the dead `originalHtml` capture is removed, together with the stale comment that still
   claimed restoration was proved "by exact content equality". `originalResponse` stays: its status is compared with the fresh response
   in the restore proof. R05 had already replaced literal HTML equality with the marker-plus-digest proof, which is what left the
   captured body unused.
2. **`tests/unit/page-document.test.ts`** — the module-declaration suppression now reads `@ts-expect-error`, which is *satisfied* by the
   real TS7016 diagnostic for the plain-ESM evidence module rather than unused; the directive stays on the line above the specifier,
   the line TypeScript reports.
3. **This report**, and nothing else. The architecture row R06 added is unchanged and still reads
   `REPRESENTATION (bounded native text cards inside layout.grid; **not** a family credit)`.


## 2. Mandatory local gates — actual results

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | **PASS — 0 problems, exit 0** (was the R06 hosted blocker) |
| Architecture boundaries | `node --test tests/architecture/u01-boundaries.test.mjs` | **PASS, exit 0** (47 tests, 0 fail) |
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

Evidence head **`9dd30d51815ca652f964a28c408c761acb4a8cc2`** (`fix(u04): drop the dead originalHtml capture and satisfy the
expect-error rule`), pushed without force from `50e5ea1`, tree clean.

| Workflow | Run | ubuntu-24.04 | windows-2025 |
| --- | --- | --- | --- |
| `Uno Bootstrap Verify` | `45780676522` | **success** (10 steps) | **success** (10 steps) |
| `Verify U01 baseline` | `45780676544` | **success** (38 steps) | **success** (38 steps) |

No step in either job is `failure`, `cancelled` or otherwise unresolved. On `ubuntu-24.04` the baseline run reported
`Verify Owner-frozen governance files (positive and refusal)`, `Bootstrap governance gate`, `Architecture boundaries` (`pass 47`,
`fail 0`), `Lint`, `Typecheck`, `Unit tests`, `U04 JSON-slice hermetic contract and refusal tests`, `Verify U04 A1 JSON Page vertical
slice`, `U04 22-module consent hermetic guard`, `Verify U04 22-module and four-provider consent (real production HTTP and Chromium)`,
`Deployment readiness fixtures (offline, in-memory)` and `Deployment readiness (offline; VERCEL_NOT_DEPLOYED_BY_AGENT)` — all
**success**, and the same step set is green on `windows-2025`.

For the record, the two heads that preceded this one and the reason they are superseded: R05's head failed `Architecture boundaries`
(the inventory did not yet admit the focused runner), and R06's evidence head `9d7f81d` and report head `b7c90ee` cleared it and then
failed `Lint` on the two lines R07 was authorized to fix. Nothing was force-pushed or rewritten; both remain in history.

| Workflow | Run | ubuntu-24.04 | windows-2025 |
| --- | --- | --- | --- |
| `Uno Bootstrap Verify` | `45777460173` | **success** | **success** |
| `Verify U01 baseline` | `45777460251` | **failure — `Lint`** | **failure — `Lint`** |

Report head **`70ce0f9172fcf40a3fa68b751356a33a676b442a`** is verified on the same four jobs — `Verify U01 baseline` success on
`ubuntu-24.04` and `windows-2025`, `Uno Bootstrap Verify` success on both — with no step failing, cancelled or unresolved.

## 6. Disposition

Committed and pushed without force, in two exact heads, after the full local suite in §2 was green — lint first, because it was the
thing that had never been allowed to run. Nothing was reverted, amended, rebased or force-pushed at any point in this order, and the
identifiable authorized work of R05 and R06 remains intact in history and in the working tree.

**What is proven and what is not.** Proven: the native `layout.grid` text-cards representation, through real production HTTP and
Chromium, inside both the focused entrypoint and the mandatory default U04 gate, with the fixture restored byte-exactly; and the
architecture boundary still policed (47 tests, 0 fail) with its exact importer inventory, its transaction import policy and its
product-layer prohibition unchanged. Not proven, and not claimed: any Cards family credit, the six-case browser matrix, images and
actions, and every C2/U04 obligation. `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned; C2 and U04 OPEN.

This report is the **STOP for independent Architect review**. No further write, revert or push occurs until that review returns.
