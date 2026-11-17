# UNO-WO-027 / R02 — Optional declared canonical base integrated; no domain chosen

**Work order:** `UNO-WO-027 / R02` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 13,036 bytes, SHA-256 `c613b6dde8d96b3086e85c802c0f74f50d3c1aaf928c15518fda6625f1f364a3`,
heading `UNO-WO-027 / R02 — Integrate an optional Uno canonical base`; verified byte-for-byte before any write;
ignored, untracked, unstaged, never printed, never committed.
**Owner decision:** the activation approves the optional canonical-base configuration and committed-base reader
contract in §3.
**Push authorization:** the activation contains **`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`**.
**Required start = actual start:** `99cc6905a0c5002687733667da6243d3e542db27`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `CONFIG_BASE_ACCEPTED` | **PASS** | `src/core/efs/uno-config.ts` gains exactly one optional key, `base`, re-expressed from the accepted policy's own answer |
| `POLICY_DELEGATION` | **PASS** | one `validateUnoCanonicalBase` call; no URL, prefix, alias-count, duplicate or overlap rule restated (architecture-proved) |
| `CLOSED_CODE` | **PASS** | one new literal `config:invalid-base`; the policy's own unreadable outcome keeps `config:unreadable` |
| `ABSENT_IS_ABSENT` | **PASS** | an absent base yields the unchanged config with no `base` property; nothing defaulted |
| `READER` | **PASS** | `src/application/resolve-uno-committed-base.ts`, five frozen `committed-base:` literals, deep-frozen `{site, base}` |
| `COMMITTED_REALITY` | **PASS** | the committed declaration states no base and the reader answers `committed-base:missing`, supplying no domain |
| `FOCUSED_TESTS` | **PASS** | **21** new cases and **49** new exact-code refusal inputs across the two suites (52 focused tests) |
| `BASELINE_PRESERVED` | **PASS** | 697 unit tests over 21 files (676 + 21); 36 architecture checks (33 + 3); every existing test kept |
| `PUBLIC_BEHAVIOUR_UNCHANGED` | **PASS** | `/` 200; `/en`, `/en-001`, `/about`, unknown, `robots.txt`, `sitemap.xml` 404; build exactly three routes |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | four jobs, two hosts, zero non-success steps (§6) |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, manual deploy, alias, domain or settings change |
| `STAGE` | U03 **OPEN** | no route activated, no domain selected, no publication |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`d58696d2d391b97e7e935a163b7350e78ef3341a`** | exactly eight ledger paths; direct child of `99cc690` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/core/efs/uno-config.ts` | EDIT | `b1b6a2fb…` → `62ebb236…` | 15,626 |
| 2 | `tests/unit/efs-uno-config.test.ts` | EDIT | `a3ac711f…` → `5a5888b1…` | 22,620 |
| 3 | `src/application/resolve-uno-committed-base.ts` | CREATE | ABSENT → `30f5af0e…` | 7,782 |
| 4 | `tests/unit/efs-uno-committed-base.test.ts` | CREATE | ABSENT → `64d272d3…` | 11,395 |
| 5 | `tests/architecture/u01-boundaries.test.mjs` | EDIT (additive) | `0bea41fa…` → `bb048eea…` | 49,403 |
| 6 | `.documents/Architecture/source-inventory.md` | EDIT (narrow additive) | `4cee36ef…` → `d7864318…` | 116,538 |
| 7 | `.documents/WIP/plan-roadmap.md` | EDIT (U03 only) | `f77320f3…` → `d052728c…` | 10,070 |
| 8 | `.documents/WIP/plan-next.md` | OVERWRITE (forward-only) | `2d3e2bd7…` → `80a1b6d9…` | 1,198 |

Both CREATE paths were absent at start; the six editable start blobs matched exactly. `git diff --cached --check`
was clean; eight paths staged and committed, ACTIVE never staged, working tree clean at the product head.

## 3. Guards (sanitized)

| Guard | Result |
| --- | --- |
| ACTIVE | one private file at the expected path, 13,036 bytes, digest and heading matching the activation, ignored, untracked, unstaged, absent from every diff |
| Physical root | the single Uno checkout resolved physically; Git toplevel equal; no symlink, junction or reparse alias on the checkout or its ancestors |
| Parent and siblings | the parent-anchored `/00.foundation-uno/` ignore rule verified without editing the parent; parent, Foundation, Solo and every sibling path and remote strictly read-only |
| Git | one worktree, `main`, exactly one fetch/push remote `origin` for `provelopment/provelopment-foundation-uno`, no mirror; no reset, rebase, force, clean or amend |
| Head and remote | `HEAD` = `origin/main` = `99cc690` at start and re-read immediately before the push, where it had not moved |
| WIP slots | exactly four: `plan-roadmap.md`, `plan-next.md`, the ignored private ACTIVE, `plan-outlook.md` |
| Pins | **21 / 21** immutable anchors byte-identical; all six editable start blobs matched; both CREATE destinations ABSENT |
| Runtime | Node 26.13.1 and pnpm 11.6.0; in-root frozen install with `--frozen-lockfile --ignore-scripts --store-dir .pnpm-store`; `package.json` and `pnpm-lock.yaml` blobs unchanged |

## 4. What was built

**A. The declaration may now state a base.** `src/core/efs/uno-config.ts` accepts exactly one additional optional
top-level key, `base: { canonical, aliases }`. When it is absent, the validated config is unchanged and carries no
`base` property, with identical selection and language-mapping semantics. When it is present the module calls
`validateUnoCanonicalBase(base)` — the single owner of every URL, scheme, credential, query, fragment,
percent-encoding, host, prefix, alias-count, duplicate and overlap rule — and stores that policy's own answer,
re-expressed as `canonical = origin + pathPrefix` and one string per alias in validated order, freshly frozen with
only those two keys. A policy refusal becomes the one new closing code `config:invalid-base`; the policy's own
unreadable outcome keeps the existing `config:unreadable`. Root unknown keys and unknown keys inside `base` both
refuse, nothing is inferred from a host or environment, and no rejected value is returned, thrown or echoed.

**B. One pure reader over that declaration.** `src/application/resolve-uno-committed-base.ts` takes exactly
`{manifest, selection}` as own data, never invoking an accessor, and delegates to `validateUnoSiteSelection`,
which already validates the graph, the selection, the optional language mapping and the newly integrated base. It
translates that validator's closed codes onto its own five frozen literals — `committed-base:input-invalid`,
`committed-base:unreadable`, `committed-base:selection-invalid`, `committed-base:missing`, `committed-base:invalid`
— and returns a fresh, deeply frozen `{accepted, site, base}` identifying exactly the selected Entity, Facet, Site
and declared base. A hostile prototype, symbol key or accessor refuses without being read; a throwing proxy trap
becomes `committed-base:unreadable`.

**C. The committed reality is stated, not repaired.** `deployment/uno.config.json` still declares no base, so the
reader answers `committed-base:missing`. It supplies no domain, no loopback default and no placeholder — the
absence is the answer, and the file was not edited. `src/app/**` does not import the reader and no core module
depends on it; no route, redirect, metadata, `basePath`, deployment or provider surface changed.


## 5. Test evidence — 21 new cases, 49 new exact-code refusal inputs

| Suite | Cases | New refusal inputs | What is proved |
| --- | ---: | ---: | --- |
| `efs-uno-config` | 39 (31 preserved + 8) | 18 | absent-vs-present; root, one sub-path and an explicit loopback base; eight aliases accepted in declared order and a ninth refused; duplicate alias and ancestor/descendant overlap refused; nine malformed families (scheme, credentials, query, fragment, percent encoding, invalid host, extra key, non-array aliases, non-object base) each refused as `config:invalid-base`; root and nested accessors refused with **zero** invocations; symbol key, exotic prototype and throwing proxy; byte-for-byte no caller mutation; fresh deep freeze; a refusal that echoes nothing |
| `efs-uno-committed-base` | 13 (all new) | 31 | the committed files answer `committed-base:missing` and the reader reads no file itself; accepted root, sub-path, alias-ordered and loopback bases; policy-refused bases map to `committed-base:invalid`; an unreadable declaration maps to `committed-base:unreadable`; every other selection failure maps to `committed-base:selection-invalid`; wrong shape, extra key, missing key, non-object manifest or selection, accessor, symbol and exotic prototype refuse as `input-invalid`; a throwing proxy refuses as `unreadable`; fresh frozen answers, no caller mutation, one frozen five-code vocabulary, and refusals that never echo a host or path |

No existing test was skipped, weakened, mocked or downgraded; the 31 pre-existing config cases and every other
suite are unchanged in expectation.

**Hostile-structure codes, stated precisely.** The nested reading belongs to the canonical-base policy, so a
nested accessor, symbol key or exotic prototype surfaces as that policy's own not-plain refusal and therefore as
`config:invalid-base`, while a *root* accessor is refused by this validator's own reader as `config:unreadable`.
A trap that throws a plain error is not hostile structure and keeps `config:unreadable`. Both families were
verified empirically rather than assumed; in every case the accessor was never invoked.

**Broad local gates.**

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — both dependency blobs unchanged |
| Focused suites (`efs-uno-config`, `efs-uno-committed-base`) | **52 / 52** |
| `node scripts/verify-governance-docs.mjs` | PASS — three frozen files match Owner-frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **9 / 9** |
| `pnpm test:bootstrap` | **19 / 19**; CLI: 11 files, licence verified, four-slot discipline, no credential or private-path leak |
| `pnpm test:architecture` | **36 / 36** (33 preserved + 3 new) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **697 passed / 697**, 21 files — 676 previous + **21 new** |
| `pnpm build` | PASS — exactly `/`, `/_not-found`, `/icon.svg`; no `en-001` route |
| `pnpm test:http` | **103 passed, 0 failed** — `/` 200; `/en`, `/en-001`, `/about`, unknown, `/robots.txt`, `/sitemap.xml` 404 |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean before the commit and after |
| Pins | 21 immutable anchors byte-identical; six editable start blobs matched; both CREATE paths absent at start |

**Warnings, disclosed.** Two **moderate** advisories remain — the same dev-only `minimatch` denial-of-service
family (`>=7.0.0 <11.0.1`, patched `>=11.0.1`) reached only through the ESLint toolchain, never through a runtime
or production dependency path. They are recorded, not waived or silenced; the blocking threshold is zero high or
critical, and zero is what the gate reports. Local Windows execution is **PASS**; WSL is **NOT APPLICABLE**.

**Architecture coverage, stated honestly.** Three additive checks were added rather than the two required: the
reader is inside the authored-source scan with `../core/efs/uno-config` as its only import specifier; injected
Node, Next, React, adapter, `deployment/` and `src/app` imports are each refused while an inward core import stays
clean; and the config validator is proven to reference `validateUnoCanonicalBase` exactly twice — one import and
one call site — while restating none of the policy's URL, prefix, alias-count, duplicate or overlap vocabulary.


## 6. Hosted CI

**Product head `d58696d2d391b97e7e935a163b7350e78ef3341a` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `44027391031` | success | success | 24 / **0** |
| Uno Bootstrap Verify | `44027390957` | success | success | 10 / **0** |

Both hosts ran the governance verifier, the architecture suite and the blocking unit step that includes
`efs-uno-config` and the new `efs-uno-committed-base` suite. Log **text** is **UNVERIFIED** — this client reads job
and step conclusions only. The report-only head repeats the same four jobs; its run IDs are returned privately to
the Owner.

## 7. Rights, privacy and cleanup

**Provenance.** Both new files are original **Uno-owned** work, class **NEW**; the pinned read-only Foundation
GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains conceptual context with **no code imported**. No
Foundation, Solo or Connect source, media or brand was copied, and the 17-family / 22-module rights inventory is
unchanged.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or unpublished external content appears
in either commit, in CI or in this report. No guard was weakened, no threshold raised, no workflow edited and no
test skipped. The committed declaration was **not** edited: no domain, origin or placeholder was installed.

**Provider actions: zero.** No provider API call, manual deployment, promotion, alias, domain or settings change;
the only external effect was the authorized non-force Git push and any build the existing Git integration starts
from it.

**Cleanup.** Task-owned `.temp/` scratch removed; build, package-store and cache outputs stay ignored; no unknown
file was deleted; `git status` is clean at the product head; the private ACTIVE remains ignored and unstaged.

## 8. What remains unimplemented — U03 stays OPEN

1. **No production domain.** The committed declaration still states no base; the capability exists, the Owner's
   real public origin does not. Choosing it remains an Owner decision this Agent must not infer.
2. **No publication decision.** No Site or Page is published, no route is activated, no address is served.
3. **No real delivery.** HTTP status and error behaviour, emitted metadata with canonical advertising and real
   `hreflang` tags, locale routing for the declared locales, sitemap and robots policy, and response rendering all
   remain unimplemented.
4. **No runtime `basePath`.** A validated declared base is data for validated contracts only; nothing yet derives a
   serving path or a redirect from it.
5. **Provider state.** Production SHA, build log and analytics remain **UNVERIFIED** by this Agent.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this bounded U03 checkpoint:
one optional declared canonical base delegated entirely to the accepted policy, one closed code, one pure reader
with five closed literals, `committed-base:missing` as the truthful answer for the committed files, 21 new cases
with 49 new refusal inputs, 697 unit tests and 36 architecture checks green, unchanged public behaviour, zero
provider actions and U03 still open.
