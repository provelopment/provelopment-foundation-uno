# UNO-WO-016 / R01 — official network emblem and benefits-led public copy

**Order:** `UNO-WO-016 / R01` · FINAL — EXECUTE (Owner-activated) · **Executed:** 2026-11-16
**Stage:** U00 and U01 **CLOSED**, **U02 OPEN**. This is a bounded communications and visual-identity
correction; it closes no stage, publishes no EFS Page, adds no route or locale and authorizes no release.
**Provider write actions by the Agent: ZERO.** The only provider-visible effect is the Git-linked
production build caused by the authorized `main` pushes.

## 1. Deviation disclosed up front — two product commits, not one

The order specifies one product commit. This run produced **two**, and the reason is recorded rather
than smoothed over:

| Commit | Result | Detail |
| --- | --- | --- |
| `cadddc8cf077f6598779771a6df2e9e6e56d7333` | **Windows hosted job failed** | Exactly the ten ledger paths. Ubuntu passed; on `windows-2025` the step `Brand and copy contract` failed |
| `75e1d1e8fd4f1995abd0b20ae61052fe79c9d9d1` | **All four jobs green** | Same ten paths, three of them corrected: the verifiers now hash the **LF-canonical** vector form |

**Cause.** The repository stores `public/uno-logo.svg` with LF (8,250 bytes, the pinned digest). A
Windows checkout with `core.autocrlf` delivers the *same content* with CRLF, so a byte count and digest
computed over the raw working file only matched on LF checkouts. The test, not the asset, was at fault.

**Fix.** `scripts/verify-u01-http.mjs`, `scripts/verify-vercel-readiness.mjs` and
`tests/deployment/uno-brand-copy.test.mjs` normalise CRLF to LF before hashing the vector. No assertion,
threshold or path was removed or weakened, and the committed blob is unchanged. The fix was proven
locally by converting both assets to CRLF, rebuilding and re-running all three verifiers (readiness 99,
brand 24, HTTP 101 — all green), then restoring LF and repeating.

**Consequence for release history.** The push of `cadddc8` triggered one automatic production build of a
commit whose Windows CI job was red for a test-portability defect; its page and asset bytes were the
approved ones, and its Linux job was green. The corrected `75e1d1e` is the head this report describes.
The Architect may treat the two-commit shape as a scope deviation; it is reported, not hidden.

## 2. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `OFFICIAL_VECTOR_INSTALLED` | **PASS** | Both targets are blob `a9990629…`, 8,250 bytes, SHA-256 `de749e41347a043691b3dd82ced90a2d53f80c240993057388cdfaee20a0a568`; green `#1f6f6b` network, enlarged charcoal `#36454f` numeral, `2048` canvas |
| `BENEFITS_COPY_PUBLISHED` | **PASS** | Page source is 9,335 bytes, SHA-256 `d86fdcf6e3d3be85b577ac4fded6e08e954f8db6f481b196df1bfe6834943876`; served HTML carries every approved sentence |
| `TWO_ILLUSTRATIVE_EXAMPLES` | **PASS** | `Example: a community organisation` and `Example: a service provider with regional audiences`, each with three benefits and an explicit "not existing customers" note |
| `DESIGN_PRESERVED` | **PASS** | `src/app/globals.css` blob `8d9268c4…` unchanged; palette, dark mode, breakpoints, focus and reduced-motion intact |
| `LINT_WARNING_REMOVED` | **PASS** | `pnpm lint` exits 0 with **zero warnings**; `next/image` plus `unoptimized` replaces the `<img>` rule violation |
| `FAVICON_HEADER_PARITY` | **PASS** | Identical bytes on disk, identical served bodies, digest matches |
| `ANALYTICS_AND_ROBOTS` | **PASS** | One `@vercel/analytics/next` import and one `<Analytics />`; `noindex`, `nofollow`, `nocache` |
| `LOCAL_GATES` | **PASS** | §4 |
| `HOSTED_CI` | **PASS at the corrected head** | §6 |
| `VERCEL_DEPLOYMENT_READ_ONLY` | **UNVERIFIED** | The Vercel tools are absent from this session; no deployment or log was read |
| `PROVIDER_WRITE_ACTIONS_BY_AGENT` | **ZERO** | No provider write tool was called |
| `STAGE` | U01 CLOSED, U02 **OPEN** | No stage closure, no new route or locale |

## 3. Lineage and the closed ledger

| Item | Value |
| --- | --- |
| Active order | `UNO-WO-016 / R01`, 34,515 bytes, SHA-256 `c3902097e266624cdf656c47b88905ca0e3cb14b9b4d65b79d2655453ed4a8fb` (identity only) |
| Required start | `317845a8957fb5df0c5419a22fdfce1ff03f541b` — verified equal to `origin/main` before writing; its page, layout, asset and CSS blobs all matched the order's pins |
| Product attempt 1 | `cadddc8cf077f6598779771a6df2e9e6e56d7333` (ten paths; the Windows brand step failed) |
| **Product head** | **`75e1d1e8fd4f1995abd0b20ae61052fe79c9d9d1`** (ten paths after correction) |
| **Report commit** | the report-only child of the product head; its SHA is in the Owner handback |

Owner authorizations, verified as non-secret facts: the revised benefits copy = **YES**; the official
Provelopment network-derived emblem with the larger charcoal numeral = **YES**, with both SVG and page
source supplied inside the order; the identical asset for header and favicon = **YES**; design, green
colour, responsiveness, accessibility, Analytics and security controls preserved;
`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES` for these commits; read-only Vercel inspection
permitted; **no direct provider change**; no Drive access.

| # | Path | Op | Result at the product head |
| --- | --- | --- | --- |
| 1 | `public/uno-logo.svg` | OVERWRITE | the §3 vector verbatim, 8,250 bytes |
| 2 | `src/app/icon.svg` | OVERWRITE | identical blob |
| 3 | `src/app/page.tsx` | OVERWRITE | the §4 TSX verbatim, 9,335 bytes |
| 4 | `src/app/layout.tsx` | EDIT | title and description only; the diff is exactly those two strings |
| 5 | `scripts/verify-u01-http.mjs` | EDIT | 101 served checks, including digest, geometry and copy |
| 6 | `scripts/verify-vercel-readiness.mjs` | EDIT | 99 checks, including the pinned digest and palette |
| 7 | `tests/deployment/verify-vercel-readiness.test.mjs` | EDIT | 64 fixtures |
| 8 | `tests/deployment/uno-brand-copy.test.mjs` | EDIT | 24 tests, eleven synthetic negatives |
| 9 | `.documents/Brand/uno-mark-provenance.md` | EDIT | official-source provenance, digests, charcoal choice, parity |
| 10 | `.documents/Architecture/source-inventory.md` | EDIT | one bounded `UNO-WO-016 / R01` note |

Untouched: `src/app/globals.css` (`8d9268c448dfa5a0a25bb14657ca450396efe59d`), `deployment/efs/manifest.json` (`b077520f…`),
`deployment/efs/content/home.en-001.md` (`1b062fb3…`), `package.json`, `pnpm-lock.yaml`, both workflows,
`next.config.ts`, `tsconfig.json`, `.vercelignore`, `src/core/**`, `src/application/**`, `AGENTS.md`,
`README.md`, the local SOP and its governance tests. The frozen-bytes verifier passed before the commit.


## 4. Local gates (Node v26.13.1, pnpm 11.6.0, Next.js 16.4.2, Windows 11)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — exit 0, lockfile unchanged |
| Governance verifier + `tests/governance-docs.test.mjs` | PASS — frozen bytes; **6 / 6** |
| `tests/bootstrap.test.mjs` | PASS — **19 / 19** |
| `pnpm test:architecture` | PASS — **16 / 16** |
| `pnpm lint` | PASS — exit 0, **0 errors, 0 warnings** (the previous `@next/next/no-img-element` warning is gone) |
| `pnpm typecheck` | PASS — exit 0 |
| `pnpm test` (Vitest) | PASS — **229 / 229** in 8 files |
| `pnpm build` | PASS — **4 static routes**, including the App Router icon route |
| `pnpm test:http` | PASS — **101 / 101**, six 404 refusals |
| Readiness fixtures | PASS — **64 / 64** |
| Readiness CLI | PASS — **99 checks, 0 failed** |
| `tests/deployment/node26-security-floor.test.mjs` | PASS — **16 / 16** |
| `tests/deployment/uno-brand-copy.test.mjs` | PASS — **24 / 24**, eleven synthetic negatives |
| `pnpm audit --audit-level high` | PASS — exit 0; **0 high, 0 critical**; the dev-only moderate `minimatch` advisory (GHSA-g3hv-75wg-m249) is unchanged and is **not** reclassified as fixed |

The vector hashing was additionally exercised under CRLF working-tree files (readiness 99, brand 24,
HTTP 101 all green) to reproduce and close the hosted Windows failure described in §1.

## 5. Actual served evidence (real `next start` on loopback, no mocks)

| Evidence | Served value |
| --- | --- |
| Metadata title | `Foundation Uno \| One organisation. One connected digital presence.` |
| Meta description | `Foundation Uno by Provelopment will give organisations clear ownership, structured content, reliable publishing and intentionally authored regional editions. Explore the live single-page example.` |
| `h1` | `One organisation. One connected digital presence.` |
| Eyebrow | `A Provelopment initiative · Open source · Next.js + TypeScript` |
| Hero note | `This is the live single-page introduction to Foundation Uno. The examples below illustrate the experience its complete publishing foundation will deliver.` |
| Feature headings | `One Entity`, `Purposeful Facets`, `Deliberate Sites`, `Reliable Pages`, `Thoughtful regional editions` |
| Example labels | `Example: a community organisation`, `Example: a service provider with regional audiences` |
| Footer | `© 2026 Provelopment. Foundation Uno is an open-source website foundation and a Provelopment initiative. This is its live single-page demonstration.` |
| GitHub anchors | exactly **2**, both the approved repository URL |
| Header mark | `<img alt="Foundation Uno" loading="lazy" width="30" height="30" … class="uno-brand__mark" src="/uno-logo.svg"/>` — no `/_next/image`, no `srcSet` |
| Favicon | `<link rel="icon" href="/icon.svg?icon.…svg" sizes="any" type="image/svg+xml"/>` |
| Brand routes | `/uno-logo.svg` and `/icon.svg` both **200** `image/svg+xml`, identical bodies, digest `de749e41…` |
| Robots | `noindex`, `nofollow`, `nocache`; no canonical, hreflang or sitemap |
| Analytics | the approved integration is unchanged; off-Vercel the provider script is legitimately absent |


## 6. Exact-head hosted evidence

| Head | Workflow | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| `cadddc8` (attempt 1) | Uno Bootstrap Verify `43855099531` | success | success | 10 / **0** |
| `cadddc8` (attempt 1) | Verify U01 baseline `43855099608` | success | **failure** | 24; the Windows step `Brand and copy contract` failed |
| **`75e1d1e`** (product head) | Uno Bootstrap Verify `43855546598` | success | success | 10 / **0** each |
| **`75e1d1e`** (product head) | Verify U01 baseline `43855546397` | success | success | 24 / **0** each |

On Windows at the product head, `Assert Node 26 runtime`, `Node 26 and dependency security floors`,
`Brand and copy contract`, `Dependency audit (high and critical must be zero)`, unit tests, production
build, production HTTP and both readiness steps are individually `success`; Ubuntu matches. The
report-only head repeats all four jobs and its identities are stated in the Owner handback. **Job log
text remains `UNVERIFIED`** (the API returned 403 to this client); only job and step conclusions are
claimed.

## 7. Provider evidence — what could not be read

- **Attempted:** read-only inspection of the named Uno project, its team and its deployments.
- **Result:** the Vercel tools are not registered in this session, so no deployment, build log,
  effective runtime, analytics state or recommendation was observed.
- **Consequence:** which commit currently serves `uno.provelopment.com`, its READY status, Web
  Analytics collection and any provider recommendation are **UNVERIFIED**. CI success is not used as a
  substitute for provider proof, and no claim is made that the live site already shows this copy.
- The automated pushes themselves are the only provider-visible effect, and they were authorized.

## 8. Warnings and honest non-claims

| Item | Disposition |
| --- | --- |
| Lint warning from the previous order | **Resolved** by `next/image` + `unoptimized`; lint now exits 0 with zero warnings, and no rule was suppressed |
| Dev-only `minimatch` moderate advisory | Unchanged, not waived, not recast as fixed; production graph remains at **0** vulnerabilities |
| Two product commits instead of one | **Disclosed** in §1 with the failing run, the cause and the corrected head |
| Visual or accessibility audit | **UNVERIFIED** — no screenshot and no axe run; the vector was validated structurally (viewBox, palette, 11 paths, no active content, digest) |
| Production deployment of these commits | **UNVERIFIED** — pushes occurred under explicit consent; the serving SHA could not be read |
| Trademark status | The vector derives from the Owner-supplied official emblem, but this report makes no trademark claim and no filing |

## 9. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`**: the official
network-derived emblem with the enlarged charcoal numeral serving both the header and the favicon, the
benefits-led copy with two labelled illustrative examples, the untouched design and security posture,
every previous gate retained and strengthened, four green hosted jobs at the corrected head — and, stated
plainly rather than buried, the two-commit shape and the Windows test-portability failure that caused it.
