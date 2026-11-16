# UNO-WO-015 / R01 — approved public copy and the Uno network-one mark

**Order:** `UNO-WO-015 / R01` · FINAL — EXECUTE (Owner-activated) · **Executed:** 2026-11-16
**Stage:** U01 **CLOSED**, **U02 OPEN**. This is a bounded correction of the already-deployed
informational demo — not U02 exit, not content-route activation, not release, not SEO approval.
**Result:** the Owner-approved visitor copy, metadata, header mark and favicon are committed; every
local gate and both-host CI are green. Provider-side deployment state is **UNVERIFIED**, because no
Vercel tool exists in this session.
**Provider write actions by the Agent: ZERO.** The only provider-visible effect is the Git-linked
production build triggered by the two authorized `main` pushes.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `COPY_APPROVED_TEXT` | **PASS** | The exact copy sentences ordered by the Owner are rendered by the real production server; 95 HTTP assertions, 93 readiness checks, 59 fixtures and 17 brand/copy tests agree |
| `RETIRED_CLAIMS_REMOVED` | **PASS** | `A1`, `P05`, "technical placeholder", "not deployed", "no live deployment", "no manifest", "only the smallest pure primitives", "not a finished website", "no publication" are absent from visible copy and each is refused by a named test |
| `BRAND_MARK_INSTALLED` | **PASS** | `public/uno-logo.svg` and `src/app/icon.svg` are the same blob `4228d20b16585b4d8807e5e3c392c27ad4dafa0d`, 1,730 bytes, SHA-256 `19759bc29d887401dd42550304e22dc625cbd5be936f5f93d2b9fde938010162` |
| `FAVICON_HEADER_PARITY` | **PASS** | Identical bytes on disk, identical served bodies, and an App Router `<link rel="icon" href="/icon.svg?…" type="image/svg+xml">` |
| `DESIGN_PRESERVED` | **PASS** | No colour token changed; only three layout declarations added; the brand/copy test refuses a recoloured token |
| `ANALYTICS_PRESERVED` | **PASS** | One `@vercel/analytics/next` import and one `<Analytics />` remain in the root layout |
| `ROBOTS_POLICY_PRESERVED` | **PASS** | `noindex`, `nofollow`, `nocache` served; no canonical, hreflang or sitemap |
| `LOCAL_GATES` | **PASS** | §3 |
| `HOSTED_CI` | **PASS** | Both heads, both hosts, eight green jobs — §5 |
| `VERCEL_DEPLOYMENT_READ_ONLY` | **UNVERIFIED** | The Vercel tools are not available in this session (`AI_NoSuchToolError`); no deployment, log or dashboard fact was read |
| `WEB_ANALYTICS_COLLECTION` | **UNVERIFIED** | Owner-enabled per the order; collected events cannot be read by the Agent |
| `BROWSER_RENDER_OR_AXE` | **UNVERIFIED** | No automated visual or accessibility audit was run; the SVG was checked structurally, not by screenshot |
| `PROVIDER_WRITE_ACTIONS_BY_AGENT` | **ZERO** | No provider write tool was called |
| `STAGE` | U01 CLOSED, U02 **OPEN** | No stage closure, no new route, no new locale |

## 2. Lineage and the twelve-path ledger

| Item | Value |
| --- | --- |
| Active order | `UNO-WO-015 / R01`, 22,388 bytes, SHA-256 `772539f6bc36aafaf7e36ef0ed5b7ea4e39d1964063c7348805e5850e957cc0b` (identity only; the private body is not reproduced) |
| Required start / product parent | `a3f46031d94f01cf23821aa1625fcdbb1a34c7af` — verified equal to `origin/main` before writing |
| **Product commit** | **`65494abff45569a8934687e71f884ef2269ba8a9`** — twelve ledger paths |
| **Report commit** | the report-only child of the product commit; its SHA is in the Owner handback, because a report cannot contain its own commit |

Owner authorizations, verified as non-secret facts: approved professional English copy = **YES**; the
original green network-one SVG as the Uno mark = **YES**, with the Owner's explicit understanding that
it is **not** verified as the official Provelopment logo; layout, colour scheme, responsive design and
accessibility preserved; the same SVG for the visible logo **and** the favicon;
`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES` for exactly these two commits; read-only
Vercel inspection permitted; **no direct Vercel change**, no Analytics disablement, no Drive access.

| # | Path | Op | Result at product head |
| --- | --- | --- | --- |
| 1 | `src/app/page.tsx` | EDIT | approved copy; one `h1`; skip link; `#main`, `#how-it-is-organized`, `#status`, `#explore`; five-level list; two status cards; two GitHub anchors |
| 2 | `src/app/layout.tsx` | EDIT | title and description only — the diff is exactly those two strings |
| 3 | `src/app/globals.css` | EDIT | `.uno-brand` becomes an inline flex row; `.uno-brand__mark` fixed at 1.875rem; `.uno-brand__name` line height |
| 4 | `public/uno-logo.svg` | CREATE | the §3 vector, byte for byte |
| 5 | `src/app/icon.svg` | CREATE | same blob as path 4 |
| 6 | `scripts/verify-u01-http.mjs` | EDIT | **95** real-HTTP checks (was 57), six 404 refusals, analytics rules kept |
| 7 | `scripts/verify-vercel-readiness.mjs` | EDIT | **93** checks (was 80), including brand assets and copy |
| 8 | `tests/deployment/verify-vercel-readiness.test.mjs` | EDIT | **59** tests (was 51), eight new copy/brand regressions |
| 9 | `tests/deployment/uno-brand-copy.test.mjs` | CREATE | **17** tests, five synthetic negatives |
| 10 | `.github/workflows/verify-u01.yml` | EDIT | one added blocking step `Brand and copy contract`; all previous steps, permissions and triggers kept |
| 11 | `.documents/Architecture/source-inventory.md` | EDIT | one labelled `UNO-WO-015 / R01` note |
| 12 | `.documents/Brand/uno-mark-provenance.md` | CREATE | provenance, colour references, parity rule, master-replacement procedure |

Untouched by this order: `package.json`, `pnpm-lock.yaml`, `deployment/efs/manifest.json`
(`b077520f…`), `deployment/efs/content/home.en-001.md` (`1b062fb3…`), `src/core/**`,
`src/application/**`, `src/app/not-found.tsx`, `next.config.ts`, `tsconfig.json`, `.vercelignore`,
`AGENTS.md`, `README.md`, the local SOP and both governance test files. The frozen-bytes governance
verifier passed immediately before the commit.

## 3. Local gates (Node v26.13.1, pnpm 11.6.0, Next.js 16.4.2, Windows 11)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — exit 0, lockfile unchanged |
| Governance verifier + `tests/governance-docs.test.mjs` | PASS — frozen bytes; **6 / 6** |
| `tests/bootstrap.test.mjs` | PASS — **19 / 19** |
| `pnpm test:architecture` | PASS — **16 / 16** |
| `pnpm lint` | PASS — exit 0, **0 errors, 1 warning** (disclosed in §7) |
| `pnpm typecheck` | PASS — exit 0 |
| `pnpm test` (Vitest) | PASS — **229 / 229** in 8 files |
| `pnpm build` | PASS — **4 static routes**, including the App Router icon route |
| `pnpm test:http` | PASS — **95 / 95**, six 404 refusals |
| Readiness fixtures | PASS — **59 / 59** |
| Readiness CLI | PASS — **93 checks, 0 failed** |
| `tests/deployment/node26-security-floor.test.mjs` | PASS — **16 / 16** |
| `tests/deployment/uno-brand-copy.test.mjs` | PASS — **17 / 17**, five synthetic negatives |
| `pnpm audit --audit-level high` | PASS — exit 0; **0 high, 0 critical**; the documented dev-only moderate `minimatch` advisory (GHSA-g3hv-75wg-m249) is unchanged by this order |

Nothing was skipped, softened or bypassed. The brand/copy step is blocking in CI, and its negatives
prove that a drifted heading, a reintroduced retired claim, an SVG handler, a divergent favicon and a
recoloured token are each refused by name.

## 4. Actual served evidence (real `next start` on loopback, no mocks)

| Evidence | Served value |
| --- | --- |
| Metadata title | `Foundation Uno \| A focused website foundation by Provelopment` |
| Meta description | `Explore Foundation Uno, a live, open-source single-page demonstration of a website foundation designed around one organization and developed by Provelopment.` |
| `h1` | `Foundation Uno — a focused foundation for the web` |
| Eyebrow | `A Provelopment initiative · Open source · Next.js + TypeScript` |
| Hero note | `You are viewing a live, single-page example of Foundation Uno. The wider content-publishing system is being developed in stages.` |
| Footer | `Foundation Uno is a Provelopment initiative. A live, open-source demonstration of a focused, single-owner website foundation. © 2026 Provelopment.` |
| GitHub anchors | exactly **2**: `Explore the source on GitHub`, `View Foundation Uno on GitHub` |
| Header mark | `<img class="uno-brand__mark" src="/uno-logo.svg" alt="Foundation Uno" width="30" height="30"/>` |
| Favicon | `<link rel="icon" href="/icon.svg?icon.…svg" sizes="any" type="image/svg+xml"/>` |
| Brand routes | `/uno-logo.svg` **200** `image/svg+xml` 1,730 B; `/icon.svg` **200** `image/svg+xml` 1,730 B; bodies **identical** |
| Robots | `noindex`, `nofollow`, `nocache`; no canonical, no hreflang, no sitemap |
| Analytics | the approved integration is unchanged; off-Vercel the provider script is legitimately absent |


## 5. Exact-head hosted evidence — eight green jobs

| Head | Workflow | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| `65494ab` (product) | Uno Bootstrap Verify `43849181132` | success | success | 10 / **0** each |
| `65494ab` (product) | Verify U01 baseline `43849181179` | success | success | 24 / **0** each |

On Ubuntu the new step `Brand and copy contract` is `success`, alongside `Assert Node 26 runtime`,
`Node 26 and dependency security floors`, `Dependency audit (high and critical must be zero)`, unit,
build, production HTTP and both readiness steps; the same jobs are `success` on Windows. The
report-only head repeats all four jobs and its identities are stated in the Owner handback. **Job log
text remains `UNVERIFIED`** (the API returned 403 to this client); only job and step conclusions are
claimed.

## 6. Provider evidence — what could not be read

- **Attempted:** read-only inspection of the named Uno project, its team and its deployments.
- **Result:** the Vercel tools are not registered in this session at all — the call was rejected with
  `AI_NoSuchToolError: Model tried to call unavailable tool 'mcpVercel__list_deployments'`. No
  deployment, build log, effective runtime, analytics state or recommendation was observed.
- **Consequence:** the production SHA serving `uno.provelopment.com`, its READY status, Web Analytics
  collection and any provider recommendation are **UNVERIFIED**. CI success is not used as a substitute
  for provider proof.
- **Known from the order's own pinned evidence, quoted only as such:** the starting `a3f4603` was a
  READY production deployment of `uno.provelopment.com`, its build events no longer repeated the Node 24
  override warning, and the Owner reports Web Analytics enabled. None of that is an Agent observation.

## 7. Warnings and honest non-claims

| Item | Disposition |
| --- | --- |
| `@next/next/no-img-element` lint warning in `src/app/page.tsx` | **Disclosed, deliberate.** The order requires a plain `<img src="/uno-logo.svg">` with no new asset pipeline; `next/image` would add an optimizer surface this order does not authorize. Lint exits 0 with 0 errors |
| Dev-only `minimatch` moderate advisory | Unchanged by this order; the production graph remains at **0** vulnerabilities. Not downgraded and not silenced |
| Visual or accessibility audit | **UNVERIFIED** — no screenshot and no axe run; the mark was validated structurally (viewBox, palette, keyline, no active content) rather than visually |
| Production deployment of these commits | **UNVERIFIED** — two `main` pushes occurred under the Owner's explicit consent, so two automatic production builds were most likely triggered, but which SHA serves production could not be read |
| Trademark status of the mark | An **original Uno concept**, expressly **not** verified as the official Provelopment logo; the provenance file states this and forbids presenting it as official artwork |

## 8. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** on this bounded order:
twelve product paths, the approved copy rendered by a real production server, one byte-identical vector
serving both the header and the favicon, unchanged colour scheme and structure, every previous gate
retained, eight green hosted jobs, and each provider fact that could not be read marked `UNVERIFIED`
rather than guessed.
