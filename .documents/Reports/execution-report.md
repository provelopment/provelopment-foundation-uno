# UNO-WO-022 / R01 — truthful frozen README and pure discoverability intent

**Work order:** `UNO-WO-022 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 21,332 bytes, SHA-256 `5dd7f351ae33bce964c028b979bb0f06dea03d6fe1ab5e0e178d89df1c623bd7`,
verified byte-for-byte at `.documents/WIP/workorder-active.md` before any write, ignored, untracked, unstaged.
**Owner activation:** approved the exact §4 README correction with its necessary hash update and truth tests,
the §5 pure discoverability contract, and the Uno-only non-force pushes, including
`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES` for an incidental Git-triggered build only.
**Required start and actual start:** `2a815c2f0bf4d10c9b44c1c8273fdf42ccb87c28`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `FROZEN_README_CORRECTED` | **PASS** | `README.md` written with the exact §4 bytes: **2,681 bytes**, SHA-256 `97f93bda…995a`, LF only, zero BOM, one final LF |
| `VERIFIER_HASH_UPDATED` | **PASS** | only the `README.md` SHA-256 literal changed; `maxBytes: 3200` and both other entries byte-identical |
| `README_TRUTH_TESTS` | **PASS** | stale-U01 test renamed and strengthened; a five-case mutation refusal test added; the exact not-yet-implemented disclaimer preserved |
| `DISCOVERABILITY_POLICY` | **PASS** | `src/core/efs/uno-discovery-policy.ts`, 9,878 B, blob `2c74ff76…`; pure, closed, no IO/framework/adapter/provider |
| `REAL_HOME_INTEGRATION` | **PASS** | real loader → header → classifier: `public`, six `true` conditional flags, `null` robots, committed source bytes unchanged |
| `UNLISTED_EXCLUSION` | **PASS** | scratch non-Home JSON `unlisted`: six `false` flags and `noindex,nofollow`, with no live route |
| `NONPUBLICATION` | **PASS** | no `src/app/**`, route, middleware, metadata, sitemap, robots, redirect, provider or dependency change; build route table unchanged; `/`, `/en`, `/en-001` behaviour unchanged |
| `BASELINE_PRESERVED` | **PASS** | 531 unit tests over 16 files (513 previous + 18 new); 25 architecture checks (23 previous + 2 new); 13 protected paths byte-identical |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | four jobs on two hosts, zero non-success steps (§7) |
| `PROVIDER_ACTIONS` | **ZERO** | no provider API call, manual deploy, alias, domain or settings change; only the authorized Git push occurred |
| `STAGE` | U03 **OPEN** | no closure, release, merge or next-stage authority is asserted |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`fe74bfe79bf5ea72d6db7b41beee749c8c01a644`** | exactly nine ledger paths; direct child of `2a815c2` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `README.md` | OVERWRITE | `8f5f4e15…` → `690f0870…` | 2,681 |
| 2 | `scripts/verify-governance-docs.mjs` | EDIT | `3d9360da…` → `0e607d90…` | 2,092 |
| 3 | `tests/governance-docs.test.mjs` | EDIT | `c8d51e12…` → `45861502…` | 3,063 |
| 4 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | `5a49bffe…` → `694e599d…` | 35,030 |
| 5 | `src/core/efs/uno-discovery-policy.ts` | CREATE | `2c74ff76…` | 9,878 |
| 6 | `tests/unit/efs-uno-discovery-policy.test.ts` | CREATE | `5f4f8d53…` | 13,875 |
| 7 | `.documents/Architecture/source-inventory.md` | EDIT | `6e4694ee…` → `5e04c4e0…` | 105,116 |
| 8 | `.documents/WIP/plan-roadmap.md` | EDIT | `1d89aa08…` → `2e620585…` | 9,523 |
| 9 | `.documents/WIP/plan-next.md` | OVERWRITE | `fe2e2d36…` → `bb325134…` | 1,112 |

No other tracked path changed, both CREATE paths were absent at start, and `git diff --cached --check`
reported nothing before the commit.

## 3. Physical, parent, Git and privacy preflight (sanitized)

| Guard | Result |
| --- | --- |
| Physical root | the sole Uno checkout resolved physically; toplevel equals the checkout path; one worktree, no hidden linked worktree |
| Ancestors and parent | no reparse, junction or symlink component in the checkout path; the parent's anchored `/00.foundation-uno/` ignore rule still effective; no parent, Foundation, Solo or sibling tree written, tested or built |
| Remote | exactly one remote, `origin`, fetching and pushing only `provelopment/provelopment-foundation-uno`; no mirror |
| Branch and head | branch `main`; local `HEAD` and `origin/main` both `2a815c2f…` before any write; remote re-read immediately before the push and still `2a815c2f…`; no force, reset, rebase or clean |
| Working tree | clean before work; clean after the product push; no unexpected untracked or staged file |
| ACTIVE privacy | exactly one private ACTIVE, 21,332 bytes and the activation's SHA-256, ignored, untracked, unstaged, never printed or published |
| WIP slots | exactly four: `plan-roadmap.md`, `plan-next.md`, private `workorder-active.md`, `plan-outlook.md` |
| Preflight pins | all **sixteen** required start blobs matched before any write |
| Scratch | task scratch confined to ignored `.temp/` plus the ignored package store; removed before the commit |

## 4. The frozen README correction

The Owner-approved replacement was written as **exactly** the §4 UTF-8 LF bytes and verified on disk before
staging: 2,681 bytes, SHA-256 `97f93bdaf710bac53e3be48be0365c414042e89ef4461e55e98852cd0fd1995a`, no CR, no
BOM, one final LF. The verifier's `README.md` entry now carries that hash, its `maxBytes` is still **3,200**,
and the `AGENTS.md` and local-SOP entries, the traversal logic and every failure branch are byte-identical.

The README now states Node.js 26.x and pnpm 11.6.0, points progress at the GitHub execution report and
`main` instead of a frozen stage or commit, and contains no `U01 remains open`, `U03 is open` or
`Node.js 24` claim. The exact Owner-approved sentence
`The authored public Uno A1 website is not implemented yet.` is preserved word for word, so the bootstrap
not-yet-implemented gate still passes unchanged.

Governance evidence: `scripts/verify-governance-docs.mjs` prints PASS for all three frozen files, and
`tests/governance-docs.test.mjs` is **9 / 9** — the six preserved tests plus three new README cases (a
same-length byte edit, an appended status line, and the unchanged file still passing with its 3,200-byte cap).

Architecture truth evidence: **25 / 25**. The stale U01-labelled test is renamed to describe the current
baseline, now asserts the Node 26, pnpm 11.6.0, report-link and no-pinned-commit rules through one shared
`readmeTruthIssues` predicate, and a new case proves five mutations (U01 stage claim, U03 stage claim,
restored Node 24, removed disclaimer, pinned commit) are all refused by that same predicate.


## 5. The discoverability-intent policy

`classifyUnoPageDiscoverability(input)` accepts exactly plain own data `{ kind, routePath, visibility }`:
`kind` is `json` or `markdown`, `routePath` is the validated **authoring** route (`home` for the reserved
Home, never a candidate's empty route), and `visibility` is the value an already-validated header produced.
The record is classified before any field is read, so an accessor, symbol key, exotic prototype or throwing
trap cannot run code, coerce a value or escape as an exception.

`decideSelectedPageVisibility` remains the sole authority. JSON is delegated with the declared visibility;
Markdown is delegated **without** one, because Markdown may never declare a visibility, and the supplied
value must then equal the `public` the policy returned — a Markdown `unlisted` refuses as
`discovery:projection-mismatch` instead of being silently reclassified. The reserved Home rule is decided by
the policy, not restated here.

An accepted result is freshly allocated and deeply frozen, and contains exactly `accepted`, `visibility`,
`eligibleIfPublished` with its six conditional flags (`navigation`, `sitemap`, `hreflang`, `xDefault`,
`languageSwitch`, `automaticLocaleRedirectTarget`) and `robotsIfDirectlyServed`. Every flag is `true` only for
a validated `public`, and `robotsIfDirectlyServed` is `null` for `public` and `noindex,nofollow` for
`unlisted`. No URL, pathname, canonical, locale target, asset, body, `published` field or publication token
can be returned, and no `src/app` source imports the classifier.

## 6. Observed positives and refusals

| Observation | Result |
| --- | --- |
| Committed Home, real loader → real header → classifier | `public`, six `true` flags, `null` robots; the committed source bytes are unchanged |
| Same Home under a forged `unlisted` | `discovery:projection-mismatch` (Markdown may never declare a visibility) |
| JSON Home with `unlisted` | `home-cannot-be-unlisted`, the existing exact policy literal |
| Scratch non-Home `/en-001/offers/home` JSON `unlisted` | six `false` flags and `noindex,nofollow`, with no live route created |
| Public JSON and Markdown, plus a non-Home authoring route | six `true` flags and `null` robots |
| Invalid authoring routes (empty, traversal, leading/trailing slash, double slash, backslash, space) | `invalid-route-path`, forwarded from the policy |
| Unknown visibility / unknown kind / non-string value | `unknown-visibility` and `discovery:input-shape` |
| Missing key, extra key (`published`), empty object, `null`, array, scalar | `discovery:input-shape` / closed literals |
| Getter, symbol key, exotic prototype | `discovery:input-not-plain` with **zero** getter invocations |
| Throwing Proxy trap | `discovery:unreadable` (a trap that throws makes the record unreadable) |
| Result integrity | fresh allocation each call, no shared flag object, deep freeze throws on assignment, no request mutation, exact key whitelist, no leaked address or content |
| Closed vocabulary | 14 literals, duplicate-free, every refusal asserted for membership |

18 new Vitest cases (16 refusal or negative), 531 unit tests total, and two new architecture checks that
prove the classifier stays pure, rejects injected Node/Next/React/adapter imports, and is not consumed by the
app layer.


## 7. Local and hosted gates

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — no package or lockfile change |
| `node scripts/verify-governance-docs.mjs` | PASS — all three frozen files match Owner-frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **9 / 9** (6 preserved + 3 new README cases) |
| `pnpm test:bootstrap` | **19 / 19** and the CLI reports 11 required files, licence verified, four-slot WIP discipline, private authority screened, no credential or private-path leaks |
| `pnpm test:architecture` | **25 / 25** (23 preserved + 2 new) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings (empty report) |
| `pnpm typecheck` | exit 0 (empty report) |
| `pnpm test` | **531 passed / 531**, 16 files — 513 previous + **18 new** |
| `pnpm build` | PASS — `/`, `/_not-found`, `/icon.svg`; no `en-001` route in the output |
| `pnpm test:http` | **103 passed, 0 failed** — `/en` 404, `/en-001` 404, `/about` 404, unknown path 404, `robots.txt` 404, `sitemap.xml` 404, and the 404 page still advertises no published Site |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical**; one **moderate** dev-only `minimatch` advisory (GHSA-g3hv-75wg-m249) remains disclosed, not waived |
| `git diff --check` | clean before the commit and clean after |
| README on disk | 2,681 bytes and SHA-256 `97f93bda…995a` re-verified after staging |
| Protected paths | 13 re-checked at the product head: 0 changed |

**Hosted CI at product head `fe74bfe79bf5ea72d6db7b41beee749c8c01a644` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `43890828714` | success | success | 24 / **0** |
| Uno Bootstrap Verify | `43890828710` | success | success | 10 / **0** |

Both hosts ran the governance verifier and the blocking unit step, which includes the new discovery suite.
**Full log text is UNVERIFIED** — this client reads job and step conclusions only. The report-only head
repeats the same four jobs; its run IDs are returned privately to the Owner.

## 8. Licensing, security, cleanup and the next blocker

**Licensing and provenance.** `src/core/efs/uno-discovery-policy.ts` is original **Uno-owned** code, class
**NEW / REWRITE concept**: no upstream code, fixture, schema or prose was copied. The historical Foundation
GEO-03 commit `c05c55ea…` remains read-only provenance for the *idea* of visibility-conditional
discoverability and granted no import or write permission; Solo Rust and separately licensed Connect were
excluded; no dependency, media or brand asset was added; Apache-2.0 notices and source history are unchanged.

**Security.** No secret, token, absolute personal path, private ACTIVE byte or unpublished Foundation data is
in the commit or this report. No governance guard was weakened, no byte cap raised, no workflow job changed,
and no test was skipped, mocked or removed. The landing page, noindex policy, favicon, emblem, copy and CSS
are byte-identical.

**Provider actions: zero.** No provider API call, manual deployment, promotion, alias, domain, analytics or
settings change was made; the only external effect was the authorized non-force Git push and whatever build
the existing Git integration starts from it.

**Cleanup.** Task scratch removed; `.temp/` and the package store remain ignored; no unknown ignored file was
deleted; the private ACTIVE remains ignored and unstaged; `git status` is clean at the product head.

**Next blocker.** Publication is still unowned by any order: nothing is routed, served, indexed, canonicalized
or redirected, and a `public` discoverability result is only an eligibility statement. A next increment would
need its own Owner-installed work order for the validated Page document and module schema, explicit
publication authorization, real HTTP and metadata behaviour, and locale routing.

## 9. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this joined U03
checkpoint: the Owner-approved frozen README corrected to its exact bytes with its exact verifier hash and
strengthened truth tests, plus one pure, closed discoverability-intent classifier that reuses the existing
visibility policy and states only what a later Owner-authorized publication would be eligible for — with
every failure closed, no publication, routing, indexing or provider action, and the live 404 behaviour of the
technical baseline unchanged.
