# Execution Report — UNO-WO-122 / R04

**Outcome: INCOMPLETE — work preserved under the R04 non-destructive stop boundary, nothing committed but this report.**
The native Cards product slice is complete and compiles, the shared evidence module and the focused entrypoint both exist and
execute, and the focused production proof reaches real HTTP, real Chromium and a verified byte-exact restore — but its served-page
stage does not yet observe the swapped fixture, so the capability is **not** evidenced and **not** integrated into the U04 gate.
Credits are untouched: `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`, C1 still earned. C2 and U04 remain OPEN.

| | |
| --- | --- |
| Order | `UNO-WO-122 / R04`, `FINAL — EXECUTE` (supersedes R03) |
| ACTIVE | **5,020 bytes**, SHA-256 `bcd054c1da1e9770708c6e416b76ec15abebbe72143c1377698c1040acb013c8` — matched exactly; private, ignored, untracked |
| Base / head | `6f9f3bcf28127f803870e531521aea041efa6cdf` `HEAD` = `main` = `origin/main` (unchanged; no implementation commit) |
| Stop boundary | invoked: authorized edits preserved **unstaged/untracked**, temporary servers stopped, committed fixture bytes verified intact |

## 1. What exists in the working tree now (unstaged / untracked, preserved)

| Path | Status | Bytes | SHA-256 |
| --- | --- | --- | --- |
| `src/core/page-document.ts` | modified, unstaged | 158,398 | `56a370298d876f19879149683ad159f0bea78126e9970cef8af17b52791473f5` |
| `src/components/uno-page-sections.tsx` | modified, unstaged | 45,703 | `6818e4fc2a6b5a221d4a065b29695efa8f741fdd5def079e61e91eee061c9fea` |
| `src/app/globals.css` | modified, unstaged | 46,473 | `a5f34d5104ba837630fc6ab4ea9ef597c1f4f9e46ab22677a959808e202be2c7` |
| `scripts/u04/cards-native-evidence.mjs` | **new, untracked** | 34,071 | `afe9cc68138804ca88fee9f06faa29dec251ddfcb7e269f17f506f91bdd10962` |
| `scripts/verify-u04-cards-native.mjs` | **new, untracked** | 5,116 | `e89045299c866521f816eac801f27e93a303036fcacf11f5d6c92db99cdab34f` |

`deployment/efs/content/components.en-001.json` is **byte-identical to the committed fixture** after the run (no diff), and no
`next` server process was left running. `.next` is build output and `.temp/*` is scratch; neither is part of the tree.

**Product, as delivered in the tree.** The closed, props-only, childless `layout.grid` alternative: `cards[1..24]`, plain title
(160 code points, well-formed Unicode enforced — an unpaired surrogate now refuses), optional plain meta (120), Markdown-capable
body and lede (4,000), optional heading with an explicit valid level, closed whole-section surface, optional columns 2/3/4. One
native `<ul>` of direct `<li class="uno-json-card">` items reusing the donor's shipped card treatment (border, radius, padding,
paint), meta → title → body in authored order, level-3 titles under an authored heading and level-2 without one, no invented text
or intent. Ordinary grids keep their required children, props, bounds and markup; the validated cards node carries `children: []`
(authored `children` is still refused) so existing `node.children` consumers stay type-correct without editing any unledgered
test. No new module, no bound change beyond the cards shape, no composer, asset or destination-policy change.

**Evidence module.** `scripts/u04/cards-native-evidence.mjs` (20 exports) holds the authored native Page (rich muted default-column
list, 24-card explicit-four bordered list, explicit `plain` two-column list, absent-surface list), the exact per-card expected
text, the per-width column expectations, **19** closed refusal probes, **6** accepted boundary cases, the served-region/list

## 2. Executed commands and exact results

| Command | Result |
| --- | --- |
| `npx tsc --noEmit -p tsconfig.json` | **0 errors** (including every existing test file) |
| `npx vitest run tests/unit/page-document.test.ts tests/unit/uno-page-sections.test.ts` | **2 files passed** (existing suites unchanged and green) |
| `node scripts/verify-u04-cards-native.mjs` | **3 passed, 6 failed** — build PASS, server PASS, `REFUSALS` **19/19 PASS**, `BOUNDS` PASS, `RESTORE` PASS (digest true, fresh 200, no anchors), fixture byte-identical PASS; **`HTTP` ×3 and `BROWSER` ×3 FAIL** |
| `pnpm test` | **not run** this round |
| `node --test tests/deployment` | **not run** this round |
| `node scripts/verify-u04-22-module-consent.mjs` | **not run** this round (U04 integration not yet written) |
| hosted workflows | **not run** (only this report is pushed) |

## 3. The one unresolved gate, precisely

**Symptom.** With the authored native document written to `deployment/efs/content/components.en-001.json`, `GET
/en-001/components` answers **200** with **41,936 bytes** of HTML that contains **none** of the four native section ids, so every
`HTTP` and `BROWSER` clause fails on `lists=0 items=0 surface=null`.

**What is already excluded.** (a) *Not* a stale build: `.next` is removed before building and the server starts only after a
successful build. (b) *Not* a warm-cache artefact: the readiness probe was moved off the route under test to `/` and the result was
identical. (c) *Not* a static route: `.next/prerender-manifest.json` lists four routes and **no** `/en-001/*`, so the Page is
generated per request. (d) *Not* a reader problem: against the same installed source the reader **accepts** the authored document
and refuses exactly the 19 closed probes, which are two of the three passing evidence checks. (e) *Not* a manifest problem:
`deployment/efs/manifest.json` declares `{"id":"components","route":["components"],"publication":"published",…}` with the JSON
source that was swapped.

**Hypothesis.** The serving path resolves the Page's declared source **once per server process** — an in-memory registry built at
boot, or a memoised confined read — rather than per request. The U04 gate's own family swap works because that fixture is
installed **before** its build, so the registry is built from the swapped bytes; my focused entrypoint builds **then** swaps. That
difference is the most likely single cause and the first thing to test.

**Next step (one change).** Either (i) install the native document **before** the build in the focused entrypoint, leaving the
transaction to prove only the served facts plus the restore/fresh-response pair, or (ii) find and bypass the per-process
memoisation in the serving path so a post-boot swap is visible, as the gate already requires of its own transaction. Then run
`scripts/verify-u04-cards-native.mjs` to green, add the additive unit/deployment tests, wire the same transaction into
`verify-u04-22-module-consent.mjs`, and only then run the full local and hosted gates.

## 4. Disposition

No implementation was committed or pushed; only this report is committed, and it claims no capability. The five paths in §1 are
the authorized work preserved exactly as R04 requires, with their digests recorded so a continuation can bind to this precise tree
without fresh discovery. Further continuation requires fresh Owner authorization of that tree.

readers, the case verdict, one browser reader, the keyboard walk and **one** `runNativeCardsTransaction` — the single
implementation both entrypoints are meant to execute.

**Focused entrypoint.** `scripts/verify-u04-cards-native.mjs` builds from a removed `.next` (no stale build can answer), serves on
loopback, runs that one transaction against the committed `components` Page fixture, then prints a focused verdict and states
explicitly that it is not the U04 gate.
