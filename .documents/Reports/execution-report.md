# UNO-WO-021 / R01 — bounded selected Page-header and visibility projection

**Work order:** `UNO-WO-021 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 18,593 bytes, SHA-256 `8f9f45beb250635dab248f1bfd752f2f9556551075eacf67a145aa939df48f63`,
verified byte-for-byte at `.documents/WIP/workorder-active.md` before any write, ignored, untracked and unstaged.
**Activation:** Owner activation supplied the three required literals, including
`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`; no publication, route activation or release is claimed.
**Required start and actual start:** `75a671bc362adef32ab77eefed78a9ef4c5a7631`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `PURE_HEADER_PROJECTOR` | **PASS** | `src/core/efs/uno-page-header.ts`, 22,949 B, blob `c4e3f46f…`; frozen non-serving header, closed refusal vocabulary, no IO/framework/provider |
| `APPLICATION_USE_CASE` | **PASS** | `src/application/resolve-uno-page-header.ts`, 11,214 B, blob `e62cef60…`; consumes the accepted loader shape, no adapter or `node:` import |
| `REAL_HOME_PROJECTION` | **PASS** | The committed `en-001` Markdown projects the actual on-disk title `Foundation Uno` and a >200-character raw body, `markdown`, `public` |
| `DECLARED_PRECEDENCE` | **PASS** | JSON wins even when Markdown is declared first; an invalid declared JSON never falls back |
| `VISIBILITY_POLICY_REUSED` | **PASS** | `decideSelectedPageVisibility` decides; reserved Home `unlisted` refuses `home-cannot-be-unlisted`; Markdown cannot declare one |
| `ARCHITECTURE_ENFORCEMENT` | **PASS** | 22 checks (20 preserved + 2 new), including negative scanner cases for Node, framework, adapter and deployment imports |
| `NONPUBLICATION` | **PASS** | No `src/app/**`, route, middleware, metadata, sitemap, robots, provider or dependency change; build route table still `/`, `/_not-found`, `/icon.svg`; `pnpm test:http` 103 checks with six 404s |
| `BASELINE_PRESERVED` | **PASS** | 513 unit tests across 15 files (455 previous + 58 new); 18 pinned immutable paths byte-identical |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | Four jobs on two hosts, zero non-success steps (§7) |
| `PROVIDER_STATE` | **UNVERIFIED** | No provider tool is used or available in this session; nothing was read, written or deployed |
| `STAGE` | U03 **OPEN** | No closure, credit, release or next-stage authority is asserted |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`50f52eaf883de95161de00084a4e21abc597c528`** | exactly eight ledger paths; direct child of `75a671b` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/core/efs/uno-page-header.ts` | CREATE | `c4e3f46f…` | 22,949 |
| 2 | `src/application/resolve-uno-page-header.ts` | CREATE | `e62cef60…` | 11,214 |
| 3 | `tests/unit/efs-uno-page-header.test.ts` | CREATE | `747bf2ed…` | 16,381 |
| 4 | `tests/unit/efs-page-header-pipeline.test.ts` | CREATE | `87a98b40…` | 17,659 |
| 5 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | `09985b01…` → `5a49bffe…` | 30,752 |
| 6 | `.documents/Architecture/source-inventory.md` | EDIT | `4a387437…` → `6e4694ee…` | 102,923 |
| 7 | `.documents/WIP/plan-roadmap.md` | EDIT | `30c6d42f…` → `1d89aa08…` | 9,026 |
| 8 | `.documents/WIP/plan-next.md` | OVERWRITE | `a2315b2e…` → `fe2e2d36…` | 1,065 |

No other tracked path changed in the product commit, and none of the four CREATE paths existed at start.

## 3. Physical, parent, Git and privacy preflight (sanitized)

| Guard | Result |
| --- | --- |
| Physical root | the sole Uno checkout resolved physically; toplevel equals the checkout path; one worktree, no hidden linked worktree |
| Ancestors | no reparse, junction or symlink component in the checkout path; parent and Foundation/Solo siblings untouched and read-only |
| Parent ignore rule | the parent's anchored `/00.foundation-uno/` rule remains effective; no parent, template or sibling tree was written, tested or built |
| Remote | exactly one remote, `origin`, pointing only at `provelopment/provelopment-foundation-uno`; no additional fetch or push mirror |
| Branch and head | branch `main`; local `HEAD` equals fetched `origin/main` equals `75a671bc…` at start; no force, reset, rebase or clean |
| Working tree | clean apart from the ignored exact ACTIVE before work; clean after the product push |
| ACTIVE privacy | exactly one private ACTIVE at `.documents/WIP/workorder-active.md`, byte count and SHA-256 matching the activation, ignored, untracked, unstaged and never printed or published |
| WIP slots | four and only four local slots: `plan-roadmap.md`, `plan-next.md`, private `workorder-active.md`, `plan-outlook.md` |
| Pinned blobs | all twelve required start blobs matched before any write |
| Scratch | task scratch confined to the ignored `.temp/` root and the ignored package store; removed after the run |

## 4. What was built

**Core projector.** `projectUnoSelectedPageHeader(input)` accepts exactly plain own data
`{ kind, text, routePath }`. `kind` is `json` or `markdown`; `routePath` is the validated **authoring** path
(`home` for the reserved Home, otherwise a validated nonempty relative route); `text` is the already-loaded
source. It classifies the request without invoking accessors, resolves the source bounds (≤ 64 KiB of UTF-8,
scalar Unicode, no NUL, no forbidden control, no tag-shaped HTML), validates each field as single-line plain
text (title 1–160 code points, description 1–320), refuses YAML front matter and any Markdown `visibility:`
declaration, keeps the Markdown body raw and unrendered, refuses repeated **top-level** authority keys instead
of allowing a last-wins value, refuses prototype-polluting keys and excessive depth/width, and returns one
fresh frozen object: `kind`, `title`, optional `description`, `visibility`, and for Markdown only
`markdownBody`. Visibility is **called**, never restated: `decideSelectedPageVisibility` owns the
`public | unlisted` vocabulary and the reserved Home rule.

**Application use case.** `resolveUnoPageHeader(input)` accepts the accepted non-serving loader shape
`{ accepted: true, candidate, kind, text }` or the loader's refused shape `{ accepted: false, reason }`. It
re-verifies the candidate as data — page identity, locale spelling, route spelling and pathname must agree,
and the declared sources must include the selected kind — maps the reserved Home candidate
`{ pageId: "home", routePath: "" }` to the authoring `routePath: "home"`, refuses an inconsistent
Home/empty pair, and forwards one existing closed loader refusal verbatim (an unknown literal is refused
rather than forwarded). It never reads a file, never recomputes precedence, and imports no adapter or
`node:` built-in.

## 5. Observed behaviour

| Observation | Result |
| --- | --- |
| Committed Home through the real loader | `loadUnoCandidateSource(…, "/en-001")` → `resolveUnoPageHeader` → title `Foundation Uno`, `markdown`, `public`, raw body > 200 characters |
| Title provenance | equals the first `# ` heading of the on-disk `deployment/efs/content/home.en-001.md` (2,085 bytes, LF-only) |
| Agrees with the pure projector | the use-case result deep-equals `projectUnoSelectedPageHeader` for the same text |
| Follows the file | a scratch source edited from `# First scratch title` to `# Second scratch title` projects the new title and body |
| Undeclared files | a stray JSON file in the content root is never opened and never appears in the header |
| Precedence | Markdown declared first with valid JSON → `json`; invalid declared JSON with valid Markdown → forwarded `invalid-json-source`, no header |
| Non-Home unlisted | `/en-001/offers/home` with `visibility: unlisted` → `unlisted`; reserved Home `unlisted` → `home-cannot-be-unlisted` |
| Forged candidates | Home with a non-empty route, non-Home carrying the Home authoring route, a pathname that does not follow from its own locale/route, an undeclared kind and a traversal route all refuse with exact literals |
| Non-mutation | the loader result, the request and the committed source bytes are unchanged after every call |


## 6. Refusals

58 new Vitest cases, **53 of them refusal or negative cases**, each asserting the exact closed literal and
membership in the closed vocabulary: `header:input-not-plain`, `header:input-shape`, `header:unknown-kind`,
`header:route-invalid`, `header:text-not-a-string`, `header:text-empty`, `header:text-too-large`,
`header:text-not-scalar`, `header:text-nul`, `header:text-control`, `header:text-raw-html`,
`header:markdown-front-matter`, `header:markdown-visibility`, `header:markdown-heading`,
`header:markdown-body`, `header:json-parse`, `header:json-shape`, `header:json-duplicate-key`,
`header:json-pollution`, `header:json-depth`, `header:title-missing`, `header:title-not-a-string`,
`header:title-empty`, `header:title-too-long`, `header:title-multiline`, `header:title-unsafe`,
`header:description-not-a-string`, `header:description-empty`, `header:description-too-long`,
`header:description-multiline`, `header:description-unsafe`, the visibility policy literals including
`unknown-visibility`, `home-cannot-be-unlisted` and `markdown-visibility-not-allowed`, the use-case literals
`page-header:input-shape`, `page-header:candidate-invalid`, `page-header:kind-inconsistent`,
`page-header:home-inconsistent`, `page-header:route-invalid`, `page-header:load-refusal-unknown`, and the
forwarded `route:*`, `invalid-*` and `no-valid-source` literals. Accessor invocation counts remain zero, no
exception escapes, and no refusal carries a path, body, stack or caller value.

## 7. Local and hosted gates

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — no package or lockfile change |
| governance verifier + docs test | PASS — 6 / 6 |
| `pnpm test:bootstrap` | 19 / 19 |
| `pnpm test:architecture` | **22 / 22** (20 preserved + 2 new) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **513 passed / 513**, 15 files — 455 previous + **58 new** (34 projector, 24 pipeline) |
| `pnpm build` | PASS — `/`, `/_not-found`, `/icon.svg`; no `en-001` route in the build output |
| `pnpm test:http` | **103 passed, 0 failed** — live `/` and six 404s unchanged |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical**; one **moderate** dev-only `minimatch` advisory (GHSA-g3hv-75wg-m249) remains disclosed, not waived |
| `git diff --check` | clean |

**Hosted CI at product head `50f52eaf883de95161de00084a4e21abc597c528` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | `43885459119` | success | success | 10 / **0** |
| Verify U01 baseline | `43885458657` | success | success | 24 / **0** |

The blocking `Unit tests` step ran both new suites on both hosts. **Full log text is UNVERIFIED** — this
client reads job and step conclusions only. The report-only head repeats the same four jobs; its run IDs are
returned privately to the Owner.


## 8. Licensing, security, cleanup and the next blocker

**Licensing and provenance.** Original Uno-owned code, class **REWRITE concept / DEFER**. The read-only
comparator was Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`,
`src/core/page-document.ts` (blob `a12d964c43626c6313a621bf628f5cc24b65d444`); no code, fixture, prose or
schema was copied, no dirty or unpublished upstream was read, no branch was switched, and no Foundation or
Solo Rust, Connect module, media, brand asset or package was imported. Apache-2.0 notices and source history
are unchanged. The omitted runtime powers — routing, rendering, publication, indexing and the module AST —
remain deliberately absent and are recorded as U04 obligations in the inventory.

**Security.** No secret, token, absolute personal path, private ACTIVE byte or unpublished Foundation data is
in the commit or this report. The confined reader and its symlink, bounds and UTF-8 protections from the
previous increment are untouched. No existing test was weakened, skipped or removed, and no workflow,
dependency, lockfile or configuration changed.

**Cleanup.** Task scratch removed; `.temp/` and the package store remain ignored; no unknown ignored file was
deleted; `git status` reports a clean tree at the product head, and the private ACTIVE remains ignored and
unstaged.

**Next blocker.** Publication remains unowned by any order: the projected header is not a published Page, no
address is served, and `/en-001` stays a real HTTP 404. A next increment would need its own Owner-installed
work order for a validated Page document and module schema, explicit publication authorization, HTTP and
metadata policy, and locale coverage.

## 9. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for the bounded U03
Page-header checkpoint: one pure, closed projector and one pure application use case that turn an already
loaded, non-serving source into `title`, optional `description`, policy-decided `visibility` and, for
Markdown only, the raw unrendered body — with the real committed Home source projected end to end,
JSON-before-Markdown precedence preserved, every failure closed and bounded, and nothing routed, published,
rendered, indexed or released.
