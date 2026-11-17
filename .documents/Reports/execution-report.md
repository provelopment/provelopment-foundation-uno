# UNO-WO-026 / R01 — One prepared, non-serving Page-delivery candidate

**Work order:** `UNO-WO-026 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 14,163 bytes, SHA-256 `920b8ffdf233d73ebdf4dc24fab3345cc86aa2d51fab4be08cab95c5f80d464c`,
heading `UNO-WO-026 / R01 — Prepare one validated Page-delivery candidate`; verified byte-for-byte before any
write; ignored, untracked, unstaged, never printed, never committed.
**Owner decision:** the activation approves the Page-delivery candidate contract in §3 of the order.
**Push authorization:** the activation contains **`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`**.
**Required start = actual start:** `ca82eb41cab332775019dc08d710098e0b216d03`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `DELIVERY_USE_CASE` | **PASS** | `src/application/prepare-uno-page-delivery-candidate.ts`, blob `d943c3b9…`, 15,332 B |
| `STORED_POLICY_ONLY` | **PASS** | accepts the *stored* `localePolicy` from `resolveUnoCommittedLocales`; a caller-supplied policy is not an input |
| `CANDIDATE_AUTHORITY` | **PASS** | authoritative candidate from `matchUnoCandidateRoute`; the loader result is compared field-by-field and per source, in order |
| `POLICY_REUSE` | **PASS** | header and discoverability come from `resolveUnoPageHeader` and `classifyUnoPageDiscoverability`; no re-implementation, no JSON AST |
| `CANONICAL_LABEL` | **PASS** | `ifServed.canonicalUrl` is labelled hypothetical, built only from the validated proposed base, capped at 384 ASCII bytes, never truncated |
| `CLOSED_VOCABULARY` | **PASS** | ten frozen `delivery:` literals; refusals carry `{accepted:false, reason}` only |
| `FOCUSED_TESTS` | **PASS** | **24** cases, **24** refusal assertions executed over **42** distinct refusal inputs, no existing suite touched |
| `BASELINE_PRESERVED` | **PASS** | 676 unit tests over 20 files (652 + 24); 33 architecture checks (31 + 2) |
| `PUBLIC_BEHAVIOUR_UNCHANGED` | **PASS** | `/` 200; `/en`, `/en-001`, `/about`, unknown, `robots.txt`, `sitemap.xml` 404; build still three routes |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | four jobs, two hosts, zero non-success steps (§6) |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, manual deploy, alias, domain or settings change |
| `STAGE` | U03 **OPEN** | no route activated, no publication, no closure |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`9eb93156aeb52ee283fa1c3cc03bbbb64e6f86d8`** | exactly six ledger paths; direct child of `ca82eb4` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/application/prepare-uno-page-delivery-candidate.ts` | CREATE | ABSENT → `d943c3b9…` | 15,332 |
| 2 | `tests/unit/efs-uno-page-delivery-candidate.test.ts` | CREATE | ABSENT → `b1bc9ec1…` | 31,522 |
| 3 | `tests/architecture/u01-boundaries.test.mjs` | EDIT (additive) | `b030201d…` → `0bea41fa…` | 45,883 |
| 4 | `.documents/Architecture/source-inventory.md` | EDIT (additive) | `7b6a6c02…` → `4cee36ef…` | 114,295 |
| 5 | `.documents/WIP/plan-roadmap.md` | EDIT (narrow) | `3329dcc1…` → `f77320f3…` | 9,998 |
| 6 | `.documents/WIP/plan-next.md` | OVERWRITE | `99d0298c…` → `2d3e2bd7…` | 1,121 |

Both CREATE paths were absent at start. `git diff --cached --check` was clean; no other tracked path changed;
`src/app/**`, deployment files, authored content, packages, lockfiles, scripts, workflows, frozen governance and
existing unit suites are byte-identical.

## 3. Guards (sanitized)

| Guard | Result |
| --- | --- |
| Physical root | the single Uno checkout resolved physically; Git toplevel equal; no symlink, junction or reparse alias |
| Parent and siblings | the parent anchored `/00.foundation-uno/` ignore rule verified and untouched; parent, Foundation, Solo and every sibling strictly read-only |
| Worktrees / remotes | one worktree, `main`, one fetch/push remote `origin` for `provelopment/provelopment-foundation-uno`, no mirror; no reset, rebase, force, clean or amend |
| Head and remote | `HEAD` = `origin/main` = `ca82eb4` at start and re-read immediately before the push; clean index and worktree |
| ACTIVE | one private file at the expected path, matching byte count, digest and heading, ignored, untracked, unstaged, absent from every diff |
| WIP slots | exactly four: `plan-roadmap.md`, `plan-next.md`, the ignored private ACTIVE, `plan-outlook.md` |
| Pins | **24 / 24** immutable blobs byte-identical; both CREATE destinations ABSENT at start |
| Runtime | Node 26.13.1 and pnpm 11.6.0; in-root install `--frozen-lockfile --ignore-scripts --store-dir .pnpm-store`; `package.json` and `pnpm-lock.yaml` blobs unchanged |

## 4. What was built

**One use case, one record.** `prepareUnoPageDeliveryCandidate(input)` accepts exactly
`{manifest, selection, base, pathname, loadedSource}`, classifies plain records and descriptors before reading
anything, and never invokes an accessor. It reads the stored Site locale policy through
`resolveUnoCommittedLocales`, and only on acceptance hands that **stored** policy — never a caller-supplied one —
to `validateUnoSitePublicationInputs` with the proposed canonical base, so one Entity, one selected Site, the
declared locales, a reserved default Home and a valid base must all agree before an address is considered. It then
takes the authoritative candidate from `matchUnoCandidateRoute` and accepts the supplied loader result only when
it is the exact accepted loader shape and describes that same candidate field for field — Entity, Facet, Site,
Page, locale tag, locale path key, route, pathname — with the same declared source kinds and paths in the same
order. A rebuilt, fully checked loader record is what reaches `resolveUnoPageHeader`; the header and the
discoverability intent are then read from their own accepted policies.

**The record.** `{accepted, identity, document, ifServed}`. `identity` names the one Entity, Facet, Site, Page,
authored locale tag and exact pathname. `document` carries the projected header plus the raw, deliberately
unrendered Markdown body where the source is Markdown; no JSON key is ever returned as executable content.
`ifServed` carries the **hypothetical** canonical URL, the robots intent and the six eligibility booleans copied
unchanged from the discoverability policy. The canonical address is
`validatedBase.origin + validatedBase.pathPrefix + candidate.pathname` — one slash between prefix and locale —
uses the canonical base only and never an alias or a request Host, is proven ASCII, and is refused beyond 384
bytes rather than truncated.

**Refusals.** Ten closed literals: `delivery:input-invalid`, `delivery:unreadable`,
`delivery:committed-locales-invalid`, `delivery:site-inputs-invalid`, `delivery:route-invalid`,
`delivery:load-refused`, `delivery:candidate-mismatch`, `delivery:header-invalid`, `delivery:discovery-invalid`,
`delivery:canonical-too-long`. Rejected output is exactly `{accepted:false, reason}`; accepted output is freshly
allocated and deeply frozen. No refusal echoes a pathname, a host, a title, a body or an exception.

**Not serving.** No route, redirect, response object, HTTP status, rendered HTML, `hreflang` tag, sitemap entry or
metadata emission is produced; no `published`, `authorized` or `live` field exists; `src/app/**` does not import
the use case and the pure kernel never depends on it.


## 5. Test evidence — 24 focused cases, 42 exact-code refusal inputs

| Area | Cases | What is proved |
| --- | ---: | --- |
| Committed Home through the real confined loader | 5 | `Foundation Uno`, one Entity / `foundation` / `main`, stored `en-001`, raw unrendered body, `http://localhost:3000/en-001`, `https://example.org/site/en-001`, alias origin never used, committed files unchanged by digest |
| Scratch repositories | 4 | unlisted non-Home JSON → six flags false and `noindex,nofollow`; public non-Home Markdown → six flags true and `robots: null`; declared JSON-before-Markdown precedence holds; malformed preferred JSON refuses instead of falling back |
| Stored authority and base refusals | 4 | missing Site `locales`, missing mapping, four invalid bases, over-cap canonical measured on a real candidate |
| Route and loader refusals | 3 | missing / unknown / malformed pathname, loader refusal at a declared address, non-loader and incomplete loader shapes |
| Candidate identity refusals | 2 | ten identity/source disagreements and a swapped source order |
| Header, discovery and request shape | 4 | unlisted Home refused by the header policy, six non-object roots, extra and missing keys, accessor with zero reads, symbol, exotic prototype, throwing Proxy |
| Freshness and the byte boundary | 3 | public JSON without description or body, per-call freshness with no caller reference, exactly 384 bytes accepted and one byte more refused |

No existing test was dropped, skipped, weakened or mocked. The two loader-driven refusal classes were
distinguished empirically rather than assumed: a loader failure at an *undeclared* address refuses as
`delivery:route-invalid` (the matcher owns the address), while a loader failure at a *declared* address refuses as
`delivery:load-refused`.

**Broad local gates.**

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — both dependency blobs unchanged |
| Focused suite `efs-uno-page-delivery-candidate` | **24 / 24** |
| `node scripts/verify-governance-docs.mjs` | PASS — three frozen files match Owner-frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **9 / 9** |
| `pnpm test:bootstrap` | **19 / 19**; CLI: 11 files, licence verified, four-slot discipline, no credential or private-path leak |
| `pnpm test:architecture` | **33 / 33** (31 preserved + 2 new) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **676 passed / 676**, 20 files — 652 previous + **24 new** |
| `pnpm build` | PASS — exactly `/`, `/_not-found`, `/icon.svg`; no `en-001` route |
| `pnpm test:http` | **103 passed, 0 failed** — `/` 200 with the approved headline; `/en`, `/en-001`, `/about`, unknown, `/robots.txt`, `/sitemap.xml` 404 |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean before the commit and after |
| Immutable pins | 24 blobs byte-identical; both CREATE paths absent at start |

**Warnings, disclosed.** Two **moderate** advisories remain — the same dev-only `minimatch` denial-of-service
family (`>=7.0.0 <11.0.1`, patched `>=11.0.1`) reached only through the ESLint toolchain, never through a runtime
or production dependency path. They are recorded, not waived or silenced; the blocking threshold is zero high or
critical, and zero is what the gate reports. Local Windows execution is **PASS**; WSL is **NOT APPLICABLE**.

**Reachability, stated honestly.** `delivery:header-invalid` is proven reachable by the unlisted-Home case, which
the Page-header policy refuses before discoverability is consulted. `delivery:discovery-invalid` remains a
**defensive** code: no accepted precedence reached it in this run, so its reachability is **UNVERIFIED** and the
inventory records that status rather than implying coverage.


## 6. Hosted CI

**Product head `9eb93156aeb52ee283fa1c3cc03bbbb64e6f86d8` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `44013801756` | success | success | 24 / **0** |
| Uno Bootstrap Verify | `44013801713` | success | success | 10 / **0** |

Both hosts ran the governance verifier, the architecture suite and the blocking unit step that includes the new
focused suite. **Full log text is UNVERIFIED** — this client reads job and step conclusions only. The report-only
head repeats the same four jobs; its run IDs are returned privately to the Owner.

## 7. Rights, privacy and cleanup

**Provenance.** The new implementation is original **Uno-owned** work, class **NEW**; the pinned read-only
Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains conceptual context only. No
Foundation, Solo or Connect source, media or brand was copied, and the 17-family / 22-module rights inventory is
unchanged.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or unpublished external content
appears in either commit, in CI or in this report. No guard was weakened, no threshold raised, no workflow edited
and no test skipped.

**Provider actions: zero.** No provider API call, manual deployment, promotion, alias, domain or settings change;
the only external effect was the authorized non-force Git push and any build the existing Git integration starts
from it.

**Cleanup.** Task scratch under the ignored `.temp/` directory removed; build, package-store and cache outputs
stay ignored; no unknown file was deleted; `git status` is clean at the product head; the private ACTIVE remains
ignored and unstaged.

## 8. What remains unimplemented — U03 stays OPEN

1. **A real canonical base.** No production origin is chosen; the base this use case consumes is the caller's
   proposed value, and the committed declaration still carries none.
2. **An explicit publication decision.** A prepared candidate is not a served Page: no Site or Page is published,
   no route is activated and no address is served.
3. **Real delivery.** HTTP status and error behaviour, emitted metadata with canonical advertising and real
   `hreflang` tags, locale routing for the declared locales, and sitemap and robots policy are all still
   unimplemented, as is any response body rendering.
4. **Provider state.** Production SHA, build log and analytics remain **UNVERIFIED** by this Agent.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this bounded U03 checkpoint:
one pure non-serving delivery-candidate use case, ten closed refusals, a 384-byte canonical cap proven at its
boundary, 24 focused cases with 42 exact-code refusal inputs, a preserved baseline of 676 unit tests and 33
architecture checks, unchanged public behaviour, zero provider actions and U03 still open.
