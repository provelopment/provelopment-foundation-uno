# Execution Report — UNO-WO-122 / R03

**Outcome: NOT DELIVERED. The complete native JSON Cards slice was implemented — reader, markup, stylesheet, evidence module and
focused tests — proven green at unit level, and then reverted, because the one mandatory piece I could not execute and verify is
the gate's own production HTTP + Chromium transaction, and this order forbids landing the proof unproven. The repository is back
at the reviewed state `b5e6b00e47ffd5254208e0a5a561a8182f8cf3b5`, every gate green, `PARITY_CARDS=PENDING`,
`U04_PARITY=13/17`, `U04_PROXY=55/59`. U04 and C2 remain OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-122 / R03`, `FINAL — EXECUTE` (supersedes R02) |
| ACTIVE | **4,687 bytes**, SHA-256 `48dd6761dfad6310a5ca553926caa0ba3fff3af23199bb391d9d2092b6453a14` — matched exactly; private, ignored, untracked |
| Start SHA | `b5e6b00e47ffd5254208e0a5a561a8182f8cf3b5` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Required outcome | functioning native JSON Cards, independently evidenced through production HTTP and Chromium, without touching the composer or existing durable assertions, all gates green — **not delivered** |
| Actual outcome | nothing landed; `PARITY_CARDS=PENDING`, `13/17`, `55/59`; C1 unchanged |

## 1. What was built and proven

The composer-free scope of R03 removed the R02 blocker, and the whole slice was implemented and type-checked:

- **`src/core/page-document.ts`** — the accepted shape: closed, props-only, **childless** `layout.grid` alternative
  (`UnoLayoutCard` = `title` + optional `meta`/`body`/`bodyMarkdown`; `UnoLayoutGridCardsProps` = `cards[1..24]` + optional
  `columns` 2/3/4, `heading`/`level`, `lede`/`ledeMarkdown`, closed `surface`), `isUnoLayoutGridCards`, the childless node variant,
  `cardItems: 24` / `cardTitleCodePoints: 160` / `cardMetaCodePoints: 120` / `cardTextCodePoints: 4000`, and a validator branch that
  refuses `cards` **and** `children` (including `children: []`) while ordinary grids keep their required children and 1–8 bound.
  Two defects my own evidence exposed were fixed here: a card title and meta line are now read by the well-formed-Unicode reader
  (an unpaired surrogate previously slipped through `readBoundedText`).
- **`src/components/uno-page-sections.tsx`** — one native `<ul>` with one direct `<li class="uno-json-card">` per card, meta →
  title → body in authored order, level-3 titles beneath an authored heading and level-2 without one, no invented element and no
  image/action markup.
- **`src/app/globals.css`** — the card border/padding, the shared closed surfaces, and the 1 / 2 / authored-or-3 default that lives
  in the stylesheet so an unauthored intent carries no attribute.
- **`scripts/u04/cards-native-evidence.mjs`** (new) — the authored native test Page (rich muted default-column list, 24-card
  explicit-four list, explicit `plain` two-column list, absent-surface list), the exact per-card expected text, the per-width
  column expectations, **19** closed refusal probes and **6** accepted boundary cases, the served-region/list readers and the case
  verdict.
- **Tests, all green before the revert** — `page-document.test.ts` **151/151** with 4 new tests (accept shape, 1/24 vs 0/25, exact
  160/120/4000 bounds, crossed children + deferred image/action, ordinary grid unchanged); `uno-page-sections.test.ts` **66/66**
  with 4 new tests (markup and author order, Markdown lede/body, no image/action/column attribute, ordinary grid untouched);
  `u04-verification-modules.test.mjs` **49/49** with 6 new tests (document accepted, every probe refused with its own reason,
  bounds accepted, readers exact, honest reading passes, **27 single-fact mutants each fail**).
- **`scripts/verify-u04-22-module-consent.mjs`** — an additive, isolated transaction was written: authored JSON into the test-owned

## 2. Why it was reverted

Two facts stayed unproven, and both are load-bearing:

1. The transaction had not been run. It is the only place where the production HTTP and Chromium evidence actually exists, and a
   gate block that has never executed cannot be reported as green evidence. Running it needs a full Next.js build plus three
   browser cases, which did not fit in what remained of this session.
2. My deployment audit for the new checks was still red (52 passed, 2 failed on token mismatches), so the guard that is meant to
   make the native proof impossible to weaken was itself failing.

Landing either state would have produced an unverified acceptance claim: the product without the gate proof is exactly what this
order forbids, and an unexecuted gate block is what the SOP forbids. The reviewed state was therefore restored and verified:
`git status` clean, `HEAD` still `b5e6b00`, `pnpm typecheck` 0, `pnpm test` green, `node --test tests/deployment` **346/0**, the
governance byte check **PASS**, and `verify-u04-22-module-consent` **943/0** reporting `PARITY_CARDS=PENDING`,
`U04_PARITY=13/17`, `U04_PROXY=55/59`.

## 3. What the next round should change

Three rounds have now produced a complete, compiling slice that could not be certified inside one session. The blocker is not the
design — it is the size of the evidence surface this gate demands in a single pass. I recommend the Owner choose one of:

1. **Split the increment**: one order to land the product plus the unit tests (already proven in §1, and harmless without a
   credit), then a second order for the gate transaction alone. The product carries no credit until the second lands, so nothing
   is over-claimed and each order stays inside a verifiable window.
2. **Move the native proof out of the monolith**: authorise a small `scripts/verify-u04-cards-native.mjs` invoked by the existing
   gate as one step, so the proof is runnable and verifiable on its own instead of inside a nine-thousand-line run.
3. **Keep it as-is**, accepting that the round must be spent on the two runs (build + gate, then hosted) and delivers nothing else.

Everything needed for option 1 or 2 is described in §1 and can be rebuilt quickly; the two audit-token mismatches are named so they
are fixed rather than rediscovered.

## 4. State handed back

`PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`, C1 earned and unchanged, B2 `11/17` / `53/59`, `A2` `63/63`,
`U04_MODULE_IDS=22/22`, `U04_ASSET_ZONES=4/4`, `U04_BROWSER_MATRIX=16/16`. No product source, stylesheet, planner, asset policy,
composer, family fixture, durable Page, dependency, workflow, oracle or frozen governance document is changed. The ACTIVE order
remains private and untracked.

  fixture zone, production HTTP assertions (`U04_NATIVE_CARDS_HTTP` ×3), reader refusals and bounds against the same production
  reader (`U04_NATIVE_CARDS_REFUSALS`, `U04_NATIVE_CARDS_BOUNDS`), Chromium at 390/768/1280 (`U04_NATIVE_CARDS_BROWSER` ×3, with a
  real keyboard walk to the safe link), and a `finally` restore with digest plus fresh-response proof
  (`U04_NATIVE_CARDS_RESTORE`). Its syntax was verified; **it was never executed.**
