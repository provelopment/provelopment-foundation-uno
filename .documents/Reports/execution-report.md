# UNO-WO-014 / R01 — Node 26, dependency audit and the one approved analytics integration

**Order:** `UNO-WO-014 / R01` · FINAL — EXECUTE (Owner-activated) · **Executed:** 2026-11-16
**Stage:** U01 **CLOSED**, **U02 OPEN** (this order is a production-hardening correction inside U02; it
does not close U02 and adds no route, locale or publication).
**Result:** Node 26 qualification, a blocking high/critical audit gate and the official Vercel Analytics
source integration are **committed and green on both hosts**. The provider-side runtime and dashboard
facts are **UNVERIFIED**, because no Vercel read tool was reachable from this session.
**Provider write actions by the Agent: ZERO.** No project setting, Analytics toggle, redeploy, promotion,
alias, secret, domain or protection change was made, and no provider credential was read or stored.

## 1. Findings matrix

| Fact | Status | Evidence |
| --- | --- | --- |
| `NODE26_PACKAGE_CI_VERIFIED` | **PASS** | `engines.node: "26.x"`, `@types/node` `26.6.6`, both workflows set Node 26 then **assert** it in-job; that step is `success` on ubuntu-24.04 and windows-2025 at `32e16c9`; local gates ran on Node **v26.13.1** |
| `VERCEL_NODE26_RUNTIME_VERIFIED` | **UNVERIFIED** | The Vercel MCP server was not connected this session (`No connection found for server: mcpVercel`), so no post-correction build log could be read. A pushed revision is not provider-runtime proof |
| `VERCEL_OLD_NODE_WARNING` | **UNVERIFIED** | Only the pre-correction deployment `dpl_A3Y5V5znUxAcd1H6wZEZXpPMTR7a` was ever observed warning twice that `engines.node: 24.x` overrode the project's `26.x` choice. The new build's log must confirm it is gone |
| `SECURITY_AUDIT_HIGH_CRITICAL` | **ZERO** | `pnpm audit` full graph: high 0, critical 0, moderate 1 (dev-only, §4); `pnpm audit --prod`: **0**; blocking CI gate `pnpm audit --audit-level high` exits 0 |
| `ANALYTICS_SOURCE_INTEGRATION` | **PASS** | `@vercel/analytics@2.0.1` (MIT) direct dependency; one `@vercel/analytics/next` import and one `<Analytics />` render inside `<body>`; build green with 3 static pages; 16 security-floor cases and 51 readiness fixtures assert the placement and refuse every deviation |
| `VERCEL_WEB_ANALYTICS_DASHBOARD_ENABLED` | **UNVERIFIED** | No provider read access. Owner action: Uno project → Analytics → Enable |
| `ANALYTICS_LIVE_EVENTS` | **UNVERIFIED** | No visitor requests were made to manufacture metrics, and no analytics read was available |
| `VERCEL_RECOMMENDATION_1..3` | **UNVERIFIED ×3** | Project metadata and build-event feeds were unreachable, so the three labels cannot be quoted. Owner dashboard text or a screenshot is required |
| `GIT_AUTODEPLOY_EFFECT` | **UNVERIFIED** | Two `main` pushes were made under explicit consent (`65d97f2 → 32e16c9`, then this report). Which deployment serves production, at which SHA, could not be read |
| `PROVIDER_WRITE_ACTIONS_BY_AGENT` | **ZERO** | No write tool invoked; the only permitted side effect is the Git-linked build caused by the authorized pushes |
| `STAGE` | U01 CLOSED, U02 **OPEN** | No U02 closure, no new locale, no route, no publication |

## 2. Lineage and the twelve-path ledger

| Item | Value |
| --- | --- |
| Active order | `UNO-WO-014 / R01`, 24,561 bytes, SHA-256 `8f7e11927711a888cbb95e6de17ec1eab750b987c230ff1c39f132a2baf38734` (identity only; the private body is not reproduced) |
| Required start / product parent | `65d97f296e1be7ee8e1eb4b088f4b197e0a39a9d` — verified equal to `origin/main` before writing |
| **Product commit** | **`32e16c90e20656d0d8a33c8c7f0f94b5a47447e6`** — twelve ledger paths, direct child of the start |
| **Report commit** | the report-only child of the product commit; its SHA is in the Owner handback, because a report cannot contain its own commit |

Owner authorizations, verified as non-secret facts: **Node 26 migration = YES**; **dependency security
audit = YES**; **`@vercel/analytics` 2.0.1 source integration = YES**;
**`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`** for exactly the two commits of this order;
**read-only Vercel inspection of the named Uno project = YES**; **provider writes = NO**.

| # | Path | Op | Blob at product head |
| --- | --- | --- | --- |
| 1 | `package.json` | EDIT | `1ef27f69d7adbb99b355bd65deef219988c9f377` (1,129 B) |
| 2 | `pnpm-lock.yaml` | EDIT | regenerated with pinned pnpm 11.6.0 |
| 3 | `.github/workflows/verify-bootstrap.yml` | EDIT | Node 26 + blocking runtime assertion |
| 4 | `.github/workflows/verify-u01.yml` | EDIT | `10f8811dcf0c0e54940456b205660925d51f2cb5` (4,344 B) |
| 5 | `src/app/layout.tsx` | EDIT | `a71737a4aa3c143e6a09731dd263831b05f7acaa` (1,904 B) |
| 6 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | narrow allowlist + negatives; Node 26 expectation |
| 7 | `scripts/verify-vercel-readiness.mjs` | EDIT | Node 26 + analytics + workflow gates — **80 checks** |
| 8 | `tests/deployment/verify-vercel-readiness.test.mjs` | EDIT | Node 26 fixtures + analytics negatives — **51 tests** |
| 9 | `scripts/verify-u01-http.mjs` | EDIT | **57** loopback assertions, six 404 refusals |
| 10 | `.documents/Deployment/vercel-manual-handoff.md` | EDIT | Node 26, pnpm 11 observed, auto-deploy and Analytics split |
| 11 | `.documents/Architecture/source-inventory.md` | EDIT | one `UNO-WO-014 / R01` adoption note |
| 12 | `tests/deployment/node26-security-floor.test.mjs` | CREATE | `4df7910bae6a243d285d3f3f18fca45570261044` (12,426 B), **16 cases** |

Unchanged by blob at the product head: `src/app/page.tsx` `7b7c883b…`, `src/app/globals.css`,
`src/app/not-found.tsx`, `deployment/efs/manifest.json` `b077520f…`,
`deployment/efs/content/home.en-001.md` `1b062fb3…`, `src/core/efs/manifest-graph.ts` `753709ee…`,
`tests/unit/efs-manifest-graph.test.ts` `805d1191…`, `src/core/**`, `src/application/**`,
`scripts/verify-governance-docs.mjs`, `tests/governance-docs.test.mjs`, `AGENTS.md`, `README.md`, the
local SOP, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore`, `.vercelignore`. The
frozen-bytes governance verifier passed before and after the edit — the authoritative proof for the
frozen documents. No `vercel.json`, no `deployment/uno.config.json`, no third workflow, no new route.

## 3. Local gates (Node v26.13.1, pnpm 11.6.0, Next.js 16.4.2)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — exit 0, 30 s |
| Governance verifier + `tests/governance-docs.test.mjs` | PASS — frozen bytes; **6 / 6** |
| `tests/bootstrap.test.mjs` + verifier | PASS — **19 / 19** |
| `pnpm test:architecture` | PASS — **16 / 16** (was 12) |
| `pnpm lint` | PASS — exit 0 |
| `pnpm typecheck` | PASS — exit 0, `@types/node` 26.6.6 |
| `pnpm test` (Vitest) | PASS — **229 / 229** in 8 files, unchanged count |
| `pnpm build` | PASS — exit 0, **3 static pages** |
| `pnpm test:http` | PASS — **57 / 57** (was 51), six 404 refusals |
| Readiness fixtures | PASS — **51 / 51** (was 44) |
| Readiness CLI | PASS — **80 checks, 0 failed** (was 70) |
| `tests/deployment/node26-security-floor.test.mjs` | PASS — **16 / 16**, six synthetic negatives |
| `pnpm audit --audit-level high` | PASS — exit 0, zero high/critical |

Nothing was skipped, softened or bypassed. The new security-floor gate refuses a Node 24 engine, a
drifted analytics pin, a Node-24 workflow, a `|| true` bypass, a sub-floor resolution and a duplicated
render — each by its own named assertion, so an always-green scanner cannot pass it.

## 4. Dependency audit — exact results

| Invocation | Exit | Result |
| --- | --- | --- |
| `pnpm audit --json` (full graph) | 1 (any-severity exit) | info 0 · low 0 · **moderate 1** · high **0** · critical **0** |
| `pnpm audit --prod --json` | 0 | **0 vulnerabilities** |
| `pnpm audit --audit-level high` (the CI gate) | **0** | 1 moderate reported, no high/critical, step passes without suppression |

The single moderate finding, classified rather than ignored:

- **GHSA-g3hv-75wg-m249** (advisory `1244623`), `minimatch@10.2.6`, range `>=7.0.0 <11.0.1`, patched
  `>=11.0.1`. Title: denial of service via glob-parts amplification.
- **Scope:** development only. Its full path is
  `eslint-config-next → eslint-import-resolver-typescript / eslint-plugin-import → @typescript-eslint/* → minimatch`.
  It is not in the production graph, not in the Next.js build output and not reachable from the served
  page, which has no user-supplied glob input.
- **Patch feasibility:** the only fix is `minimatch@11`, a major bump forced upward through
  `@typescript-eslint`, which is not a direct Uno dependency. An override would be a wider, unproven
  change than this ledger permits, so it is **not** applied here; it is proposed as a separate bounded
  dependency-refresh order once the upstream toolchain ships a compatible range.

## 5. Warning and recommendation assessment

| Warning class | Assessment | Action taken |
| --- | --- | --- |
| Vercel `engines.node` overrides the project Node version (observed twice in the pre-correction log) | **Real, and a genuine provider-vs-source mismatch.** One warning repeated once per build phase, not two vulnerabilities | Fixed at source: `engines.node` is now `26.x` and agrees with the project setting. Post-correction log confirmation is **UNVERIFIED** (no provider read) |
| Historical CI pnpm v10 shim-layout notice | Runner/toolchain housekeeping, **not** a production vulnerability | Gone by construction: every workflow now installs pnpm 11.6.0 via the pinned action and Node 26; no such notice appeared in local runs |
| "Missing Next build cache" | Provider cache miss, **not** a defect and not security relevant | No action; caching is a provider setting the Agent may not change |
| Windows Node `DEP0190` deprecation in earlier runner output | Runtime deprecation notice from the CI image, **not** proven production risk | Not observed locally on Node 26; hosted log text is **UNVERIFIED** (403 to this client) |
| Three Owner-reported Vercel recommendations | **UNVERIFIED** — the project read endpoint and build-event feed were unreachable this session, so their labels cannot be quoted or classified | Recorded as `REC_01..03 = UNVERIFIED — Owner dashboard text/screenshot required`. Any recommendation that needs a project-setting change is an Owner action |

No warning above is claimed as cured, and none is silently downgraded.

## 6. Provider evidence — what could and could not be read

- **Reads attempted:** the Vercel MCP server for the named project, team and deployments.
- **Result:** `No connection found for server: mcpVercel` — the server was not connected in this session,
  so **no** project metadata, deployment, build event, log line, domain or recommendation was observed by
  the Agent for this order.
- **Consequence:** `VERCEL_NODE26_RUNTIME_VERIFIED`, `VERCEL_OLD_NODE_WARNING`,
  `VERCEL_WEB_ANALYTICS_DASHBOARD_ENABLED`, `ANALYTICS_LIVE_EVENTS`, `GIT_AUTODEPLOY_EFFECT` and all three
  recommendations are **UNVERIFIED**. CI success alone is not used as a provider-runtime claim.
- **What is known from the order's own pinned evidence** (pre-correction, quoted only as such): the
  project `prj_cdVYLTxxVR5dwnthFyVRgNOcdaGu` in team `team_Zf6yEXTnzNd5KsklCp5FtKRu` served
  `dpl_A3Y5V5znUxAcd1H6wZEZXpPMTR7a` at `65d97f2`, `READY`, production, and its build log installed
  `pnpm v11.6.0`, built Next 16.4.2 and produced three static pages while warning about the Node mismatch.

## 7. Exact-head hosted evidence

| Head | Workflow | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| `32e16c9` (product) | Uno Bootstrap Verify `43840530391` | success | success | 10 / **0** each |
| `32e16c9` (product) | Verify U01 baseline `43840530416` | success | success | 23 / **0** each |

On Ubuntu the steps `Assert Node 26 runtime`, `Node 26 and dependency security floors`,
`Dependency audit (high and critical must be zero)`, `Unit tests`, the production HTTP run and both
readiness steps are individually `success`; the same jobs are `success` on Windows. The report-only head
repeats all four jobs and its identities are stated in the Owner handback. **Job log text remains
`UNVERIFIED`** (403 to this client); only job and step conclusions are claimed.

## 8. Remaining obligations and request

- **Owner:** enable Uno project → Analytics if you want collection (`VERCEL_WEB_ANALYTICS_...`), and read
  the new production build log to confirm effective Node 26 and that the mismatch warning is gone. Provide
  the three recommendation labels if you want them classified.
- **U02 (still open):** the additive typed `properties` vocabulary and the selected public Site in
  `deployment/uno.config.json`; U03 owns readers, confinement, locale routing and publication.
- **Proposed:** a separate bounded dependency-refresh order for `minimatch@11` once the ESLint toolchain
  supports it — no override is smuggled in here.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** on this bounded order:
twelve product paths, Node 26 and its blocking runtime assertion on both hosts, a zero high/critical
audit with one honestly classified dev-only moderate, one narrowly allowlisted analytics integration,
the visitor page and EFS graph untouched, and every provider fact that could not be read marked
`UNVERIFIED` rather than guessed.
