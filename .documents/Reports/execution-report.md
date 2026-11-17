# UNO-WO-033 / R01 — A warning-free Uno build and a bounded server payload

**Work order:** `UNO-WO-033 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 24,587 bytes, SHA-256 `4da9160910d0b4219a1109a6f0dce9edf66d5daf87e0bac62dea53dce96b1088`, heading
`UNO-WO-033 / R01 — U03 clean Vercel build and live-site assurance`; verified byte-for-byte, ignored, untracked,
unstaged, never printed, never staged.
**Push authorization:** the activation carries `AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`.
**Required start = actual start:** `5355453b591a175db5513dd54e12a57b6f4649cc`.

## 1. Status

| Requirement | Status | Evidence |
| --- | --- | --- |
| Remove the **cause** of both whole-project tracing warnings | **PASS** | static tracing prefix in the confined reader; build prints **0** warnings and **0** errors (was exactly 2) |
| Bounded server payload, nothing private or irrelevant shipped | **PASS** | project-owned traced entries **228 → 4**; new blocking inspector on both hosts |
| Preserve EFS confinement, JSON precedence, refusal, locale/Site model | **PASS** | reader unit 54/54 (48 preserved + 6 new), fault 27/27, U03 refusal 91/0, U01 103/0, published gate **542/0** |
| Blocking source/trace/build verification on both CI hosts | **PASS** | new `Bounded output tracing (committed build)` step; 29 steps per host, 0 non-success |
| Re-prove the synthetic publication fixture | **PASS** | 542 checks incl. 6 Pages × 2 locales, 15 refusals, crawler parity, real Chromium |
| Restore the committed deployment before push | **PASS** | declarations byte-identical; `git status -- deployment` empty; inspector `committed` clean after rebuild |
| **Zero** build warnings on the **next Vercel deployment** | **UNVERIFIED** | no provider connection in this session; see §6 |
| Live demonstration, robots/sitemap/404 refusals | **PASS** (HTTP) | read-only live requests in §6 |
| No provider/DNS/domain/publication change, U03 stays open | **PASS** | zero provider actions; `deployment/site.config.json` still absent |

## 2. Commits

| Role | SHA | Paths |
| --- | --- | --- |
| **Product** | **`f152544a2c8c3b65d7a1e489523ba817d59b8d95`** | **13** of the 14 authorized product paths (see below) |
| **Report** | this file's commit, child of the product commit | 1 path |

`f152544` is a direct child of `5355453` and touches exactly:
`src/adapters/efs/uno-confined-source-reader.ts`, `next.config.ts`, `tests/unit/efs-confined-source-reader.test.ts`,
`tests/architecture/u01-boundaries.test.mjs`, `scripts/verify-u03-published-http.mjs`, **`scripts/verify-u03-trace.mjs`
(create)**, **`tests/deployment/u03-trace.test.mjs` (create)**, `.github/workflows/verify-u01.yml`,
`scripts/verify-vercel-readiness.mjs`, `tests/deployment/verify-vercel-readiness.test.mjs`,
`.documents/Architecture/source-inventory.md`, `.documents/WIP/plan-roadmap.md`, `.documents/WIP/plan-next.md`.
`src/config/uno-serving.ts` was authorized but **needed no change**: its reads are already fixed project-relative
declarations, which the bundled trace confirms (`src/config/uno-serving.ts` is the only `src/` file shipped). No other
tracked path changed, and no dependency, lockfile, package script or hook was touched. The build output, `.temp/` and
`.next/` were never staged.

## 3. The defect and the treatment

**Before.** `pnpm build` printed exactly two warnings, both in `src/adapters/efs/uno-confined-source-reader.ts`:
`Dynamic filesystem access causes tracing of the whole project` at the content-root join (`...UNO_CONTENT_ROOT.split("/")`)
and at the declared-file join (`...segmentList`). The site route's own `.nft.json` then listed **228** entries that were
not Next internals: `AGENTS.md`, `README.md`, `LICENSE`, `eslint.config.mjs`, `tsconfig.json`, `tsconfig.tsbuildinfo`,
`pnpm-lock.yaml`, `public/uno-logo.svg`, eight `scripts/` files, thirty `tests/` files and the three deployment inputs —
i.e. the test harness, the root documentation, the lockfile and the public folder were all part of the server payload.

**The treatment (Uno-owned, two halves).**
1. **Static tracing boundary in the reader.** Both joins spell the prefix literally —
   `join(root.root, "deployment", "efs", "content", ...contentRelativeSegments(declaredPath))` — so the bundler sees a
   scope. A new exported `UNO_CONTENT_ROOT_COMPONENTS` states the literals; a unit test pins it to `UNO_CONTENT_ROOT` and
   the architecture test pins the literal join, forbids the runtime-split form, and confines `node:fs` to the reader and
   the serving composition. The *behaviour* is byte-identical: the declared-path rule already confined every source to
   `deployment/efs/content/`, so no new path became readable and no refusal changed (`path:outside-content-root`,
   `path:symlink`, `path:absent`, JSON-before-Markdown, no rescue — all still proven).
2. **Explicit narrow includes in `next.config.ts`.** With the prefix static, the two fixed declarations are no longer
   discovered statically, and the site route is prerendered (`SSG`), so Next applies per-route includes only to dynamic
   routes. `outputFileTracingIncludes` therefore lists exactly four project-relative globs —
   `./deployment/efs/manifest.json`, `./deployment/uno.config.json`, `./deployment/efs/content/**/*.md`,
   `./deployment/efs/content/**/*.json` — for exactly the three routes that read them
   (`/[locale]/[[...segments]]`, `/sitemap.xml`, `/robots.txt`). No `outputFileTracingRoot`, no
   `outputFileTracingExcludes`, no root-wide glob, no `turbopackIgnore` annotation, no `--webpack` escape, no warning
   filter, no logger override and no `ignoreBuildErrors`.

**After.** Build: **0 warnings, 0 errors.** Committed-build payload, project-owned entries — **4**:
`deployment/efs/manifest.json`, `deployment/uno.config.json`, `deployment/efs/content/home.en-001.md`,
`src/config/uno-serving.ts`. Fixture-build payload — the two declarations, the six published sources, the three remaining
authored fixture sources and `src/config/uno-serving.ts`, all inside `deployment/efs/content/`. Traced files in total
(including Next internals and `node_modules`): 1,972 across 9 manifests.

## 4. The inspector and its refusal fixtures

`scripts/verify-u03-trace.mjs` — dependency-free, read-only, closed codes (`build:missing`, `trace:missing`,
`trace:unreadable`, `trace:malformed`, `trace:empty`, `trace:outside-root`, `trace:private-path`, `trace:root-wide`,
`trace:forbidden-path`, `trace:unexpected-project-path`, `trace:too-many-files`, `declaration:missing`,
`declaration:unreadable`, `source:missing`, `source:not-traced`). It resolves every `.nft.json` entry against that
manifest's own directory, normalizes `\` and `/`, refuses any path outside the physical root, any private prefix
(`.documents/`, `.temp/`, `.git/`, `tests/`, `scripts/`, `public/`), any root documentation or lockfile, an undeclared
deployment file, an unexpected project path, a payload over the ceilings, and any published source the declarations name
but the build does not ship. It reads no source bytes, decides no publication and re-implements no reader rule; it serves
both `--expect committed` and `--expect fixture`. On missing or unreadable evidence it **fails**, never skips.

`tests/deployment/u03-trace.test.mjs` — **25/25**, every case synthetic: bounded committed and fixture acceptance,
Windows-separator normalization, root-wide documentation/test-harness inclusion, the private ACTIVE, `.temp`/`.git`,
`scripts/` and `public/`, an undeclared `deployment/site.config.json`, an unexpected project path, a path escaping the
root, a root-wide trace **with no warning text at all**, missing declarations, no trace, malformed and non-JSON evidence,
an empty trace, omitted declarations, an unshipped published source, no declared published source, an unreadable
declaration, the project-entry ceiling, the exact four-glob allowlist, a rejected root-wide/escaping glob, route scoping,
and the CLI's 0/1/2 exit codes.


## 5. Local gates

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | clean; Node 26.13.1, pnpm 11.6.0 |
| `vitest run tests/unit/efs-confined-source-reader.test.ts` | **54 / 54** (48 preserved + 6 new; no test lost) |
| `node --test tests/deployment/u03-trace.test.mjs` | **25 / 25** |
| `node --test tests/deployment/u03-fixture-transaction.test.mjs` | **27 / 27** |
| governance docs + `pnpm test:bootstrap` | PASS, **9 / 9**, **19 / 19** |
| `pnpm test:architecture` | **41 / 41** |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | exit 0 / exit 0 / **739 / 739** |
| `pnpm build` | exit 0 — **0 warnings, 0 errors** |
| `node scripts/verify-u03-trace.mjs --expect committed` | **OK** — 9 manifests, 1,972 traced files, 4 project entries |
| `pnpm test:http` / `node scripts/verify-u03-http.mjs` | **103 / 0** / **91 / 0** |
| `node scripts/verify-u03-published-http.mjs` | **542 passed, 0 failed** (530 preserved + 12 build/trace checks) |
| readiness fixtures / CLI | **81 / 81** / **117 checks, 0 failed** |
| security floors / brand contract | **22 / 22** / **29 / 29** |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean |

**Warnings, classified honestly.** The build is warning-free; the *toolchain* is not claimed to be. The two **moderate**
advisories are the pre-existing dev-only `minimatch` family reachable through ESLint — reported, not waived, and not a
Vercel build or runtime warning. Node's `MODULE_TYPELESS_PACKAGE_JSON` notice still appears for the repository's
TypeScript modules under `node --test`; it is a Node notice, not a Next build warning. Neither was suppressed.

**The published-Page evidence is unchanged or stronger.** 542 checks: six Pages across two authored locales including the
custom `programmes/events` Page, `/en` as a 307, a six-entry sitemap, robots agreement, fifteen strict refusals, the
malformed-JSON non-rescue proof, 33 crawler-parity checks and the full Chromium suite (104 desktop + 104 mobile
assertions, reduced motion, keyboard skip link, genuine 404 document) — plus the new fixture and rebuild warning/trace
assertions. A real headless Chromium process launched in this run.

## 6. Hosted CI and the live deployment

| Head | Workflow | Run | ubuntu-24.04 | windows-2025 | Steps |
| --- | --- | --- | --- | --- | --- |
| `f152544` (product) | Verify U01 baseline | `44060165079` | success, 0 non-success | success, 0 non-success | **29** |
| `f152544` (product) | Uno Bootstrap Verify | `44060165299` | success | success | 10 |
| report head | both workflows | polled at the report head | success | success | 29 / 10 |

Both hosts ran the new `Bounded output tracing (committed build)` step and the browser-driven publication gate, and both
report `success` with no non-successful step. Log **text** is **UNVERIFIED** — this client reads job and step
conclusions only; the raw log inspection the order asks for is **not claimed**.

**Live deployment — HTTP: PASS.** Read-only requests to `https://uno.provelopment.com/` immediately after the push:

| Address | Status | Notes |
| --- | --- | --- |
| `/` | **200** | 22,642 B; `Server: Vercel`, `X-Vercel-Cache: HIT`, `Age` 12 s at first read; exactly one `<h1>`; `<html lang="en">`; `robots: noindex, nofollow, nocache`; **no** canonical, **no** `hreflang`; approved demonstration copy present (`One organisation. One connected digital presence.`, `A Provelopment initiative`, nav `Approach Examples Open source`) |
| `/robots.txt` | **404** | expected with no published Page and no declared base |
| `/sitemap.xml` | **404** | expected, same reason |
| `/en`, `/en-001`, `/about`, `/en-001/about` | **404** | the global not-found document (5,518 B) — no redirect, no canonical, no alternate |
| `/does-not-exist` | **404** | same document |

`Strict-Transport-Security: max-age=63072000` is present; `X-Content-Type-Options` and `Referrer-Policy` are absent (a
header-hygiene observation, not part of this order's gates, and not changed here).

**Vercel deployment identity and build-warning count: UNVERIFIED.** No provider connection exists in this session — the
Vercel MCP server returns `Unauthorized` / `no connection`, and this order forbids using a token, changing a setting or
performing any provider operation. I therefore **cannot** read deployment `dpl_…` IDs, confirm that the production target
deployment was built from `f152544`, read its build events, count its warnings, or inspect its runtime log window. The
live HTTP evidence above is real but does not identify a commit: the served HTML is byte-identical to the previous
deployment because only build internals changed. Per the order this is reported as **UNVERIFIED**, not as a Vercel
warning-free claim, and the Architect is asked to complete it read-only.

## 7. Guards, restoration and cleanup

| Guard | Result |
| --- | --- |
| ACTIVE | matches the activation by bytes and digest; ignored, untracked, unstaged, in no diff |
| Physical root | single Uno checkout resolved physically; no symlink, junction or reparse alias on it or its ancestors |
| Parent and siblings | parent-owned anchored ignore unchanged; parent, Foundation, Solo and siblings untouched |
| Git | one worktree, `main`, one remote; `origin/main` re-read and immobile immediately before the push (no amend, rebase, force, tag, release) |
| Pins | **22 / 22** immutable anchors byte-identical; **12 / 12** editable start blobs matched; both create paths absent before the write |
| Restoration | both declarations restored byte-for-byte by the transaction; `git status -- deployment` empty; the three deployment inputs unchanged |
| Scratch | only task-owned `.temp/wo033-*` logs; no fixture, screenshot or build artefact staged; browser installer confined to the ignored `.temp/uno-u03-browsers` |
| Privacy | no secret, credential, personal path, private ACTIVE byte or unpublished source text in any commit, workflow or this report |


## 8. Residual Owner decisions (U03 stays open)

1. **Live acceptance.** Whether the now-unpublished live demonstration — its copy, single `h1`, English language,
   `noindex`/`nofollow` and absence of canonical/alternate — is itself acceptable.
2. **Reserved presentation authority.** Whether `deployment/site.config.json` (still absent) and any base-path scope are
   assigned to U04 or later; its absence means no appearance or tenant configuration has been delivered.
3. **The four earlier decisions:** the real HTTPS canonical origin; which named real Pages may publish; whether the
   protected `/` demonstration is retired; whether rebuild-to-publish is the operational model.
4. **Closure timing.** Whether U03 may close on this evidence, or must wait for the U04 versioned JSON contract and
   renderer plus the 17-family / 22-module parity obligations.

**Also outstanding, and outside an Agent's authority:** the independent read-only Vercel inspection — the production
deployment ID for `f152544`, its build-event warning count, its runtime log window, and the aliases — which this session
could not perform because no provider connection is available.

**Not verified, and not claimed:** zero build warnings on the live provider deployment; the provider's runtime error
window; a screen-reader audit; real search-engine indexing; real-device browser behaviour; any U04 JSON rendering.

**Requesting the Chief Master Architect's ruling: `ACCEPT` / `REVISE` / `STOP`.** The engineering claim of this order is
narrow and fully evidenced locally and on both hosted runners: the two whole-project tracing warnings are removed at their
cause rather than silenced, the build is warning-free, the server payload's project-owned content fell from 228 entries to
four, a new blocking inspector refuses a root-wide trace from the build's own `.nft.json` evidence on Ubuntu and Windows,
every preserved gate still passes (including 542 publication checks and 739 unit tests), and the committed deployment was
restored byte-for-byte with no provider, domain, publication or presentation change. The provider-side half of the
assurance — that the live Vercel build for this exact commit is warning-free — is explicitly **UNVERIFIED** in this
session and must be completed read-only before any closure decision.
