# UNO-WO-017 / R01 — true black numeral in the official Provelopment-derived Uno emblem

**Order:** `UNO-WO-017 / R01` · FINAL — EXECUTE (Owner-activated) · **Executed:** 2026-11-16
**Stage:** U00 and U01 **CLOSED**; **U02 OPEN**. A one-colour visual-identity correction: no module,
publication, locale, route, SEO, release or stage closure.
**Provider write actions by the Agent: ZERO.** The only provider-visible effect is the Git-linked
production build caused by the authorized `main` pushes.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `BLACK_NUMERAL_INSTALLED` | **PASS** | Both targets are Git blob `204b4d12…`, **8,247 bytes**, SHA-256 `bd804ce683824ad85852615b0e0a700badb80cf2cdff38dd642d9f1947d57d9c` |
| `ONE_VISUAL_CHANGE_ONLY` | **PASS** | The new vector is the previous asset with exactly two token substitutions: `fill="#36454f"` → `fill="#000000"` and the inert comment `Enlarged charcoal 1` → `Enlarged black 1`; derivation proved byte-exact |
| `NETWORK_AND_GEOMETRY_RETAINED` | **PASS** | Ten original Provelopment paths and their group transforms unchanged; green `#1f6f6b` retained; eleven `<path>` elements; `viewBox="0 0 2048 2048"`; transparent canvas |
| `CHARCOAL_WITHDRAWN` | **PASS** | `#36454f` absent from the asset and refused by three independent suites; the previous 8,250-byte digest is recorded as superseded |
| `FAVICON_HEADER_PARITY` | **PASS** | Identical blob, identical served bodies, digest matches on both routes |
| `COPY_LAYOUT_CSS_UNCHANGED` | **PASS** | Page blob `837aad87…`, layout `c7dc9392…`, CSS `8d9268c4…` — all byte-identical to the required start |
| `LOCAL_GATES` | **PASS** | §4 |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | §5 — four jobs, both hosts, zero non-success steps |
| `VERCEL_READ_ONLY` | **UNVERIFIED** | Provider tools are absent from this session; no deployment, build log or Analytics state was read |
| `PROVIDER_WRITE_ACTIONS_BY_AGENT` | **ZERO** | No provider write tool was called |
| `STAGE` | U01 CLOSED, U02 **OPEN** | No closure, no new route or locale |

## 2. The two authorized commits

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`44782a332d0996f235f53547158f687547baa74e`** | exactly the seven ledger paths, parent `766aee688ef68a91989207659f56c67040757e20` |
| Report | the report-only child of the product commit; its SHA is in the Owner handback | `.documents/Reports/execution-report.md` only |

The order permitted **one** product commit with **no** corrective follow-up. Exactly one was created;
the WO-016 shape was not repeated. The cross-platform hazard was pre-empted before pushing (§4).

| # | Tracked path | Op | Result at the product head |
| --- | --- | --- | --- |
| 1 | `public/uno-logo.svg` | OVERWRITE | §3 vector verbatim, 8,247 LF bytes |
| 2 | `src/app/icon.svg` | OVERWRITE | identical blob `204b4d12…` |
| 3 | `tests/deployment/uno-brand-copy.test.mjs` | EDIT | black pin, charcoal refusal, CRLF canonical proof, near-black and network-coordinate negatives — **29 tests** |
| 4 | `scripts/verify-vercel-readiness.mjs` | EDIT | black palette, 8,247, new digest, both superseded colours — **100 checks** |
| 5 | `scripts/verify-u01-http.mjs` | EDIT | black palette, digest, size, fill counts, superseded colours — **103 checks** |
| 6 | `tests/deployment/verify-vercel-readiness.test.mjs` | EDIT | new asset used as the valid snapshot; charcoal and concept-colour refusals — **66 fixtures** |
| 7 | `.documents/Brand/uno-mark-provenance.md` | EDIT | black decision, new digest, both superseded colours, official-source provenance and parity retained |

Not touched: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `deployment/efs/**`,
`package.json`, `pnpm-lock.yaml`, both workflows, `next.config.ts`, `tsconfig.json`, `.vercelignore`,
`src/core/**`, `src/application/**`, `.documents/Architecture/source-inventory.md`, `AGENTS.md`,
`README.md` and the local SOP. The frozen-bytes verifier passed before committing.

## 3. The asset: source, target and the single visual change

| Item | Source (withdrawn) | Target (approved) |
| --- | --- | --- |
| Canonical bytes | 8,250 | **8,247** |
| SHA-256 | `de749e41347a043691b3dd82ced90a2d53f80c240993057388cdfaee20a0a568` | **`bd804ce683824ad85852615b0e0a700badb80cf2cdff38dd642d9f1947d57d9c`** |
| Numeral fill | `#36454f` charcoal | `#000000` true black |
| Inert comment | `Enlarged charcoal 1` | `Enlarged black 1` |
| Git blob | `a9990629…` | **`204b4d1234e3c0b12cc0c269f0500c9d4da78b55`** |

Both target files hold the **same** blob and hash. Provenance is unchanged: the ten network paths and
their group transforms still come from the Owner-supplied official `emblem.svg` (7,938 bytes, SHA-256
`0512bfa3…f5ed8e0`), with its single original fill `#C5161D` rendered as Uno green `#1f6f6b`. Only the
numeral's colour and a non-rendered comment differ from the previous asset — proved by replaying the two
substitutions over the committed predecessor and comparing the result with the §3 bytes: **identical**.

The file contains no script, event attribute, `<foreignObject>`, `<image>`, remote reference, embedded
raster, font or gradient; the canvas stays transparent at `0 0 2048 2048`. The served HTML is unchanged
apart from the asset bytes: the header still renders `<img alt="Foundation Uno" width="30" height="30"
… src="/uno-logo.svg"/>` through `next/image` with `unoptimized`, and the favicon still resolves through
the App Router icon route.

## 4. Local gates and the cross-platform proof

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — exit 0, lockfile unchanged |
| Governance verifier + `tests/governance-docs.test.mjs` | PASS — frozen bytes; **6 / 6** |
| `tests/bootstrap.test.mjs` | PASS — **19 / 19** |
| `tests/architecture/u01-boundaries.test.mjs` | PASS — **16 / 16** |
| `pnpm lint` | PASS — exit 0, **0 errors, 0 warnings** |
| `pnpm typecheck` | PASS — exit 0 |
| `pnpm test` (Vitest) | PASS — **229 / 229** |
| `pnpm build` | PASS — four static routes including the icon route |
| `pnpm test:http` | PASS — **103 / 103**, six 404 refusals retained |
| Readiness fixtures | PASS — **66 / 66** |
| Readiness CLI | PASS — **100 checks, 0 failed** |
| `node26-security-floor.test.mjs` | PASS — **16 / 16** |
| `uno-brand-copy.test.mjs` | PASS — **29 / 29** |
| `pnpm audit --audit-level high` | PASS — exit 0; **0 high, 0 critical**; one dev-only moderate `minimatch` advisory (GHSA-g3hv-75wg-m249) unchanged |

**CRLF proof, before pushing.** The whole vector-sensitive set was re-run with both assets converted to
CRLF in the working tree, and again after restoring LF:

| Condition | Readiness | Brand/copy | Fixtures | HTTP |
| --- | --- | --- | --- | --- |
| Working tree LF | 100 PASS | 29 PASS | 66 PASS | 103 PASS |
| Working tree CRLF (simulated hosted Windows) | 100 PASS | 29 PASS | 66 PASS | 103 PASS |

The rehearsal caught one real defect in the new in-memory CRLF test — building the variant from an
already-CRLF file produced `\r\r\n` — which was corrected before the single product commit: the variant
is now derived from the canonical form. The **committed** blob was separately read back with
`git cat-file` and hashed to `bd804ce6…` at 8,247 bytes, so the repository artifact is LF even where a
Windows checkout receives CRLF.


## 5. Hosted CI at the product head

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | `43858572212` | success | success | 10 / **0** each |
| Verify U01 baseline | `43858572082` | success | success | 24 / **0** each |

Steps individually `success` on **both** hosts at `44782a3`: Node 26 assertion, Node 26 and dependency
security floors, unit tests, production build, **production HTTP**, both readiness steps, dependency
audit and the **Brand and copy contract** step — including the Windows job that failed in the previous
order for the unrelated CRLF reason. The report-only head repeats all four jobs; those run identities are
in the Owner handback. Job log text remains **UNVERIFIED** (the API returned 403 to this client); only
job and step conclusions are claimed.

## 6. Warnings, limitations and honest non-claims

| Item | Disposition |
| --- | --- |
| Dev-only `minimatch` moderate advisory | Unchanged, not waived, not reclassified; production graph remains **0** high/critical |
| Provider evidence | **UNVERIFIED** — no Vercel tool, deployment, build log or Analytics state was readable; the SHA serving `uno.provelopment.com` is **not** claimed |
| Live visual confirmation | **UNVERIFIED** — the black mark is proved in the committed and served bytes, not by a browser screenshot |
| Production build side effect | The authorized push triggered the automatic Vercel build; no provider setting, alias, protection or Analytics action was taken |
| Copy, layout, SEO, Analytics | Unchanged by construction and by blob equality with the required start |
| Trademark | The vector derives from the Owner-supplied emblem; no trademark claim is made |

## 7. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`**: the numeral is now true
black `#000000` in the identical official-source emblem served as both header mark and favicon
(8,247 bytes, `bd804ce6…`), the network, geometry, transparency, copy, layout, CSS, metadata, Analytics
and security posture are untouched, all local gates and both hosted operating systems are green at the
single product commit, and the withdrawn charcoal colour can no longer pass any suite.
