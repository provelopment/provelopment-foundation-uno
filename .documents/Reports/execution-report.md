# Execution Report — UNO-WO-122 / R05

**Outcome: COMPLETE for the R05 scope — native Cards text and presentation are delivered, proven over independent production HTTP
and Chromium, and wired mandatorily into the U04 gate.** Cards remains **PENDING** and no credit is claimed:
`PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`, C1 still earned, C2 and U04 still OPEN.

| | |
| --- | --- |
| Order | `UNO-WO-122 / R05`, `FINAL — EXECUTE` (supersedes R04) |
| ACTIVE | **5,861 bytes**, SHA-256 `701238b537a7e55d45803191504524d9afd46124cfb778c0e389f5108a9e5bee` — matched; private, ignored, untracked |
| Start / base | `648c31aca561093cdaf1b6c4d461375b2310d3df`; all five preserved digests matched R04 exactly before any write |
| Tree at start | exactly the five explained files, nothing else dirty |

## 1. The diagnosis R04 could not reach

R04 swapped the **durable `components` Page** in place and saw its own document ignored. R05 measured the actual mechanism instead of
assuming a process-level cache, and the cause was the fixture, not the server:

1. **A durable Page is the wrong instrument.** Its declaration, its published representation and its served bytes belong to the
   product; swapping it proves nothing about a capability. R05 never touches it.
2. **A route must be declared, not merely present.** The test-owned Page `wo122-native-cards` is declared by the existing fixture
   transaction — the committed manifest plus exactly one published Page, installed through `prepareUnoU03FixtureTransaction` with the
   committed manifest's own digest pinned — and its source is a transaction-owned fixture file. The declaration is installed
   **before** the build, because a declaration must exist when the app is built; the **document** it serves is swapped after the
   server is running, exactly as the existing Gallery, Media and Columns evidence does.
3. **The transaction's teardown has an order.** `dispose()` refuses unless a verified `restore()` has already run
   (`dispose:unverified`); R04 called it alone, which is why that manifest and source outlived those runs. R05 restores, then
   disposes, then proves the committed manifest's bytes and the absence of the fixture source.
4. **Restoration is proved by content.** The "before" document shares no anchor with the native one, so a fresh response is
   attributable to exactly one of them: it must carry the before marker, contain none of the four native anchors, and return the
   original status. (Literal HTML equality across requests is not achievable — Next emits per-request payloads — so the proof is
   marker plus anchors plus digest, and the claim is stated that way.)

## 2. What was delivered

**Product.** The closed, props-only, childless Cards alternative of `layout.grid`: 1–24 ordered cards; title 160 code points with
well-formed Unicode enforced (an unpaired surrogate refuses); optional plain meta 120; Markdown-capable body and lede 4,000;
optional heading with an explicit level; optional `2`/`3`/`4` columns; closed whole-section surface. Authored `children` (even
empty), deferred image/action, unknown fields and unsafe Markdown all refuse. Presentation is one native `<ul class="uno-json-cards">`
whose every direct child is one `<li class="uno-json-card">` in the donor's own shipped card treatment — border, radius, padding and
paint are the existing `.uno-json-card` rules, not copies — with meta → title → body in authored order, level-3 titles under an
authored heading and level-2 without one, and the unauthored column default living in the stylesheet rather than the document. The
ordinary grid's children, props, bounds and markup are untouched.

**The reported `children: []` issue, resolved.** The validated cards node carries its empty child list as a **non-enumerable**
property: consumers that read `node.children` still compile and iterate, while the document's serialized form stays authentically
childless. A test round-trips the accepted output and revalidates it unchanged, and a document that *declares* `children` beside
`cards` is still refused with `document:invalid-section` — childlessness is preserved, not relaxed.

**Evidence.** `scripts/u04/cards-native-evidence.mjs` holds the authored native Page (rich default-column muted list, 24-card
explicit-four bordered list, explicit `plain` two-column list, absent-surface list), the exact per-card expected text, per-width
column expectations, **19** closed refusal probes, **6** accepted boundary cases, the HTTP readers, the browser reader, the keyboard
walk, the case verdict and **one** `runNativeCardsTransaction`. Both entrypoints execute that one function; there is no second
implementation.

**Focused and mandatory.** `scripts/verify-u04-cards-native.mjs` installs the test-owned route, builds from a removed `.next`,
serves, runs the transaction and prints a focused verdict stating that it is not the gate.
`scripts/verify-u04-22-module-consent.mjs` invokes the same transaction exactly once, unconditionally, right after its server is
ready, and fails the run if any check fails.

## 3. Evidence actually obtained

| Command | Result |
| --- | --- |
| `npx tsc --noEmit -p tsconfig.json` | **0 errors** |
| `pnpm test` | **PASS — 35 test files** |
| `node --test tests/deployment` | **PASS — 54 tests, 0 fail** |
| `node scripts/verify-u04-cards-native.mjs` | **PASS — 18 PASS, 0 FAIL, exit 0**, of which 9 are the transaction: HTTP ×3, `REFUSALS` 19/19, `BOUNDS`, `BROWSER` 390/768/1280, `RESTORE` |
| `node scripts/verify-u04-22-module-consent.mjs` | **PASS, exit 0** — all pre-existing checks plus `U04_NATIVE_CARDS_*` (HTTP ×3, refusals, bounds, Chromium ×3, restore) and its own "ran and every required check passed" clause |

Served facts at each width: four sections with exactly one list each; **3 / 24 / 1 / 1** items; surfaces muted / bordered / plain /
absent; resolved tracks **1,2,3 · 1,2,4 · 1,2,2 · 1,2,3** at 390 / 768 / 1280; positive, equal tracks; row order and distinct cells
proven from element boxes; every card's own meta, title and body and nothing where none was authored; card border ≥ 1px and
padding `20px 20px 20px 20px`; the muted surface equal to the live `--uno-surface` token, the bordered edge present, `plain` and the
absent case computing no paint, no edge and no padding; one safe link, keyboard-reached, visible, left again by Tab with the URL
unchanged; no overflow, no console error, no foreign request.

## 4. Limitations and what is still owed

- **Cards remains PENDING and is not credited.** The six-case browser matrix, images/actions and the family credit remain a later
  adoption review; nothing here claims them.
- **`.documents/Architecture/u04-family-parity.md` was not updated** in this round; the capability is recorded here and in the
  runners, and the architecture record still describes the pre-adoption state.
- **The gate's native transaction runs on the family fixture route** with `originalMarker: null`, so its restoration proof is the
  byte digest plus the absence of every temporary anchor; only the focused entrypoint additionally proves the before-document
  marker. This asymmetry is deliberate and stated rather than hidden.
- **Hosted workflows are verified after this report**, on the exact head it accompanies; the report states their outcome in the
  disposition below only once observed.

## 6. STOP — an out-of-ledger change is required, and it is not taken

The exact head `ab43ae316bf0e230a3092d7ed9b5a1b9fb6e9aad` is **red on one hosted step**: `Architecture boundaries` fails in both
`verify (ubuntu-24.04)` and `verify (windows-2025)` of `Verify U01 baseline` (`45772393015`), and every later step is skipped. The
other workflow, `Uno Bootstrap Verify` (`45772393047`), is green.

**Cause, precisely.** `tests/architecture/u01-boundaries.test.mjs` asserts a strict deep-equality on the exact list of scripts under
`scripts/`, and the new authorized runner appears in the actual list but not in the pinned expectation:

```
actual:   [ … "scripts/verify-u04-22-module-consent.mjs", "scripts/verify-u04-cards-native.mjs", … ]
expected: [ … "scripts/verify-u04-22-module-consent.mjs", "scripts/verify-u04-json-slice.mjs", … ]
```

**Why this is a stop and not a fix.** The file that must change to make the check pass is
`tests/architecture/u01-boundaries.test.mjs`, and the R05 authorized ledger does not include it: it names only
`tests/unit/page-document.test.ts`, `tests/unit/uno-page-sections.test.ts`, `tests/unit/u04-verification-modules.test.mjs` and
`tests/deployment/u04-22-module-consent.test.mjs`. Editing the pin to admit the new runner would be the agent extending its own
authority over an architecture boundary — exactly what the ledger forbids — so the pin is untouched and the failure is preserved as
evidence, not hidden.

**What is otherwise true of this head.** Every local gate listed in §3 was green *before* the commit, including the U04 gate with the
mandatory native Cards transaction and its own fixture-removal check. The hosted failure is a boundary inventory, not a behavioural
one: no product, evidence, gate or fixture behaviour regressed.

**What the Owner must decide (one of).**

1. **Authorize the pin.** Add `tests/architecture/u01-boundaries.test.mjs` to the ledger with the single-line addition of
   `scripts/verify-u04-cards-native.mjs` to the expected inventory — the honest, smallest change, and the one consistent with the
   order's own requirement that a focused entrypoint exist and be runnable.
2. **Relocate the focused entrypoint** so no new top-level `scripts/verify-*.mjs` exists — for example `scripts/u04/cards-native.mjs`
   as the runnable and `cards-native-evidence.mjs` as its shapes, if the pin only enumerates the top level. This changes the ledger's
   named path and should therefore be spelled out in a new order rather than assumed.
3. **Withdraw the focused entrypoint** and keep only the mandatory in-gate transaction, accepting that a standalone runnable proof
   no longer exists.

Until one is authorized, this delivery is **not** releasable and the capability remains uncredited: `PARITY_CARDS=PENDING`,
`U04_PARITY=13/17`, `U04_PROXY=55/59`. Nothing further is written, reverted or force-pushed; this report is the STOP.


### Disposition of the work itself

Verified work — three source files, two runner files, the gate integration, two test files and this report — was committed and
pushed without force as one exact head after the local gates above were green. The test-owned declaration, fixture source and server
are gone: the gate's own removal check passed, the committed manifest is byte-identical, and no durable Page, composer, family
fixture, planner, oracle or governance file was touched. Section 6 records the hosted STOP that keeps this delivery short of release.

