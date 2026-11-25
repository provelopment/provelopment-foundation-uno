# Execution Report — UNO-WO-115 / R01

**Outcome: STOPPED before commit — an authority conflict. The authorized governance correction cannot reach a green local gate because two gate sources outside this order's authorized path list still require the superseded wording. No governance or product bytes were published; the authorized edits remain uncommitted in the working tree for review.**

| | |
| --- | --- |
| Order | `UNO-WO-115 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **3,568 bytes**, SHA-256 `27072c0fc5f1c0850be2350a3f4200aeb517d6db412dfa99508a922546cf134b` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `b3d921e9f1ebae97a8c1354c0cc04469aae80d53` (`HEAD` = `main` = `origin/main` = `ls-remote`, clean tree, one worktree, one Uno `origin`) |
| End SHA | **unchanged** — `b3d921e9f1ebae97a8c1354c0cc04469aae80d53`; this run published only this report |
| B1 baseline | intact: `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, three-Site P6 PASS |

## 1. Why this run stopped

The order authorises exactly six paths. Three of them are the frozen governance files, their gate script and its tests.
Replacing the superseded single-public-Site wording and the stale maturity assertions — as the order requires — makes the
repository's **own** bootstrap and architecture gates fail, because those two sources still demand the old text verbatim and
are **not** in the authorized list:

| Blocking source (unauthorised) | Line | Requirement that now fails |
| --- | --- | --- |
| `scripts/verify-bootstrap.mjs` | 208 | README must match `/not implemented yet/i` → `README.md must state that the Uno runtime is not implemented yet` |
| `tests/bootstrap.test.mjs` | 154 (fixtures 30/188/205) | asserts that same rule refuses a README without the sentence |
| `tests/architecture/u01-boundaries.test.mjs` | 669, 685–686, 726 | README must contain verbatim `The authored public Uno A1 website is not implemented yet.` (`missing-disclaimer`, plus two explicit `assert.ok`/`assert.equal` checks) |

The order's own acceptance criterion requires the architecture and bootstrap gates to be green, and both hosted workflows run
them. Satisfying the governance correction therefore requires editing files the order does not authorise, and leaving the
gates red blocks the authorised commit/push. Under `AGENTS.md`, SOP §2/§3 and SOP §6 (“STOP if a task conflicts with this
rule”), a conflict between authorized scope and a mandatory gate is a **STOP**, not an improvised widening of the path
ledger. I stopped before staging or committing any governance or product path.

One earlier rule was satisfiable inside the authorised README change and was therefore kept: the README still says the code
is a **technical baseline** (`u01-boundaries.test.mjs:688`), while the stale “not implemented yet / projected Page header”
claims were removed as instructed.

## 2. Authorized work performed (uncommitted, unstaged)

| Path | Bytes | SHA-256 |
| --- | --- | --- |
| `AGENTS.md` | **3,164** (cap 3,200) | `e7ff1d7fcb555f8b2ac2cda3b7ea0267aab70f0e779436f415503141ae44185d` |
| `README.md` | **2,938** (cap 3,200) | `e6995a841b1d5f7e4cf83c10bdcacde5fcbe9620ba75e16f09a4057044280304` |
| `.documents/SOP/sop-implementation.md` | **5,438** (cap 6,000) | `6c20beb768294c3b12de63a34a5dd998e3d4d4b2d039ed945093e258b262cc2d` |

- **`AGENTS.md`** (Product bullet): one Entity per Installation; **one or more concurrently active Facets, Sites per Facet,
  Pages per Site and explicitly authored full-locale representations per Page**; every valid Site may publish independently
  through its validated Facet/Site host and/or path binding; an optional explicit default is an entry preference, **never an
  exclusive publisher**; no arbitrary hierarchy or language ceiling; resource, ownership and collision guards mandatory; no
  Hub/Spoke or second Entity; Foundation Next.js/TypeScript stays the technical source, not Solo Rust. The **Writes** bullet
  now adds: an unexplained mid-run external file change means **STOP** — preserve it and restore nothing without Owner
  direction.
- **`README.md`**: the single-public-Site A1 restriction is replaced by the same concurrent contract; the stale maturity
  assertions are replaced by stable direction to current `main` and the sole execution report, stating a technical baseline
  without implying release or deployment. Mission, rights, development commands, authority boundary and the exact-hash
  sentence are preserved.
- **`.documents/SOP/sop-implementation.md`** §3: the one-selected-public-Site invariant is replaced by the concurrent
  contract, including optional nonexclusive defaults, public/unlisted discovery and full-locale representations, and a new
  paragraph requires **STOP/preservation** on an unexplained mid-run mutation with no unauthorized restoration. All other
  safety, authority and freeze rules are untouched.
- **`scripts/verify-governance-docs.mjs`**: only the three `sha256` literals changed; byte caps (3,200 / 3,200 / 6,000),
  validation logic and both workflows are unchanged.
- **`tests/governance-docs.test.mjs`**: 8 existing tests preserved plus 4 new — the three corrected files pass the hash gate,
  the unchanged caps and an approved-contract content check (concurrent wording present, six superseded forms absent, one
  statement per file, the STOP/preserve sentences, README boundaries, dropped maturity claim); an unexpected byte flip in
  **each** file is refused by the exact-hash gate and never as a cap; a stale single-public-Site rewrite of **each** file is
  refused by content *and* by hash; and the three prior approved digests are provably superseded.

`git status` at stop: exactly those five paths modified, **nothing staged**, `HEAD` unchanged.


## 3. Local results (all executed in this run)

| Gate | Result |
| --- | --- |
| `node scripts/verify-governance-docs.mjs` | **PASS** — `AGENTS.md, README.md and local SOP match Owner-frozen bytes` |
| `node --test tests/governance-docs.test.mjs` | **13 passed / 0 failed** |
| `pnpm test` (unit) | **1,313 / 1,313** |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `verify-u04-22-module-consent.mjs` (build + start + Chromium) | **838 passed / 0 failed** — `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, 35/35 evidence |
| `verify-u03-multisite-http.mjs` (three Sites, both phases) | **179 passed / 0 failed**, both phases byte-exact |
| `pnpm test:bootstrap` | **18 passed / 1 failed** — `the real Uno root passes the same validation` → `README.md must state that the Uno runtime is not implemented yet` |
| `pnpm test:architecture` | **45 passed / 2 failed** — `README.md must carry the exact truthful sentence about the A1 website`; plus the mutation test's `missing-disclaimer` rule |

No hosted verification was attempted: nothing was pushed, and the two failing gates are exactly what the hosted workflows
execute.

## 4. The reported `README.md` rewrite (read-only investigation)

The prior order disclosed that the working copy's `README.md` was replaced mid-run with Foundation-oriented prose and that it
was restored with `git checkout --`. This order authorises read-only investigation of that incident. Findings:

- No task or script in this repository writes `README.md`: no `package.json` script names it, and no `writeFileSync` /
  `writeFile` target in `scripts/`, `tests/` or `.github/` includes it.
- The rewritten content referenced `SOP-ARCHITECT.md`, `BLUEPRINT.md`, `PLAN.md`, `WIP.md` and a seven-file Drive folder —
  files that do not exist in Uno — so the text was not produced by Uno's own tooling.
- `git reflog` contains only this agent's own commits; the content was never committed, and no copy survives in `.temp/`,
  so there is no recoverable artefact to inspect.
- **Cause: unresolved.** The mutation appeared in the interval between the P6 gate finishing and the architecture gate
  starting. An external editor/sync or agent-style process remains an unproven hypothesis only; asserting it would be a
  claim without evidence, which this order forbids.
- For the record: the WO-114 run restored the frozen blob. Under the rule this order installs, the correct response would
  have been STOP + preserve + report instead — which is precisely why the clause was ordered. This run performed no
  restoration of any unexpected change.


## 5. Risks

1. **Scope conflict (blocking).** Until the two unauthorised gate sources are corrected or the Owner directs otherwise, the
   corrected governance bytes and a green bootstrap/architecture gate are mutually exclusive.
2. **`AGENTS.md` headroom.** 3,164 of 3,200 approved bytes — 36 bytes of headroom. Further growth needs the Owner's cap
   decision, not a silent adjustment.
3. **External mutation mechanism.** Unresolved (section 4); the new STOP/preserve rule bounds the reaction, not the cause.

## 6. State, remedy and review

`HEAD` and `origin/main` remain `b3d921e9f1ebae97a8c1354c0cc04469aae80d53`; the only published change is this report, a
sanitized single-file overwrite under the standing report-only exception. The three corrected files, the gate literals and
the extended governance tests are complete and locally validated (governance gate PASS, 13/0) but **uncommitted**.

Minimal remedy requiring Owner authorization — one of:

- **A.** Authorize `scripts/verify-bootstrap.mjs` (line 208 rule), `tests/bootstrap.test.mjs` (rule 154 and its fixtures) and
  `tests/architecture/u01-boundaries.test.mjs` (lines 669, 685–686, 716, 726) to state the *current* truthful rule instead
  of the superseded sentence — for example: the README must point progress at current `main` and the sole execution report
  and must not claim a published website, which it already satisfies; or
- **B.** Direct that the superseded sentence be retained, in which case the README correction in this order must be narrowed.

With either decision the work already present in the working tree can be finished in one short follow-up run: update those
rules, re-run the full gate set, commit, push and verify both hosted OS jobs at the exact head.

`U04` remains **OPEN**. No product code, dependency, workflow, closure oracle, declaration, durable Page, external
repository, provider, release or deployment was touched, and no new parity credit is claimed. Stopping here for independent
Architect review.

