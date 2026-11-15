# UNO-WO-004 / R02 — U01 BOUNDED TECHNICAL BASELINE

**Order:** `UNO-WO-004` · **Edition:** `R02` · **Stage:** U01 (bounded first technical baseline)
**Execution date:** 2026-11-15
**Execution role:** Foundation Uno Implementation Agent
**Independent review:** Chief Master Architect — everything below is agent-reported until reproduced
**Owner authority:** explicit activation naming `UNO-WO-004 / R02`, closing `U00` and approving the restricted U01 source/toolchain scope
**Local outcome:** `COMPLETE` · **Hosted CI at the product commit:** verified — both workflows passed on both hosts (see §13)

> Evidence only. This is not Architect `ACCEPT`, does not close `U01`, and authorises no
> release or deployment. `U02–U07` are untouched.

All paths are symbolic (`<UNO>`, `<FOUNDATION>`, `<PARENT>`). No private absolute path, order
byte, raw upstream hunk, credential or personal datum is reproduced here.

## 1. Authority and order identity

| Fact | Value |
| --- | --- |
| Order ID / edition | `UNO-WO-004 / R02` |
| Installed order path | `<UNO>/.documents/WIP/workorder-active.md` |
| Installed order SHA-256 | `F865B3E3956CD77F0453501EC442BFE3BBD735C4C8C1887F71AE070A979401F4` |
| Installed order size | 21,872 bytes |
| Predecessor (spent) | `UNO-WO-003 / R03`, 15,352 bytes, `5F1EBC82…F72180BB6` |
| ACTIVE visibility | ignored (`.gitignore:12`), **untracked**, never staged, never published |
| Root-level alternate order | absent |
| Owner installation | the Owner installed R02 directly; the Agent read it back and did **not** replace it |

## 2. Source provenance — the single authorised copy

| Fact | Value |
| --- | --- |
| Immutable source commit (GEO-03) | `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` |
| Copied path (only one) | `src/core/efs/identity.ts` |
| Source Git blob | `7e6f8e0a4f0b9ba7b90f66c44205ff67befb7d20` |
| Source blob size | 4,439 bytes |
| Read method | `git -C <FOUNDATION> cat-file blob` from committed objects — no fetch, no worktree read, no dirty hunk |
| Copied file blob (with filters) | `7e6f8e0a…` — identical |
| Copied file blob (`--no-filters`) | `7e6f8e0a…` — identical |
| Copied file SHA-256 | `DA99857F71B0B630C53A9D7D6746891E579934D0AA3A984005F4A9B62B47876A` |
| Comparison-only release | `fa599973a88ff77f6a8e012f3266c3c139b52c17` — not a source |
| GEO-04 `8789a450…` and its five dirty files | not read, not used |

The copy is byte-identical under both filtered and unfiltered hashing, so no line-ending or
attribute translation occurred. No other upstream file was copied.

## 3. Toolchain actually used

| Tool | Required | Observed |
| --- | --- | --- |
| Node.js | major 24 | `v24.22.1` |
| pnpm | exactly 11.6.0 | system pnpm was **12.15.0**; **11.6.0 provisioned locally** (finding W1) and every command ran through it |
| Git | — | `2.56.0.windows.3` |
| WSL Ubuntu 26.04 | repeat gates if available | distro present, but **no `node` and no `pnpm`** inside it (finding W2) |

Installed direct versions were verified exact against the order: `next 16.4.2`, `react 19.2.9`,
`react-dom 19.2.9`, `typescript 5.9.3`, `eslint 9.39.5`, `eslint-config-next 16.4.2`,
`vitest 4.1.12`, `vite 8.2.4`, `@types/node 24.19.1`, `@types/react 19.2.18`,
`@types/react-dom 19.2.4`. No direct dependency uses a semver range; `packageManager` is
`pnpm@11.6.0` and `engines.node` is `24.x`. The lockfile is newly resolved for Uno only — the
Foundation lockfile was **not** copied and no analytics/Connect dependency was inherited.

## 4. Preflight result

| Check | Result |
| --- | --- |
| Owner activation names `UNO-WO-004 / R02` and its full SHA-256 | `PASS` |
| Installed ACTIVE is the exact 21,872-byte / `F865B3E3…` file | `PASS` — read back, not replaced |
| ACTIVE regular, ignored, untracked; no second or root-level order | `PASS` |
| `<UNO>` resolves physically; no reparse/junction/symlink in the directory chain | `PASS` |
| One checkout, one worktree, branch `main` | `PASS` |
| Exactly one remote, `origin` → Uno only | `PASS` |
| Local `HEAD` = `c82e15c9068dc0d498443fafe73498a6a851861d` | `PASS` |
| Remote `refs/heads/main` = same SHA via `ls-remote`, no fetch | `PASS` |
| Index and worktree clean before the run | `PASS` |
| Published report blob `678543de7cbace1e6824b363bcefa5676114fee8` present | `PASS` |
| `<PARENT>` own-root anchored `/00.foundation-uno/` guard active | `PASS` — `.gitignore:138` |
| `<PARENT>` HEAD unchanged at `e17fd9601b4fc40be7af77caf4b255bd115b12b8`; read-only | `PASS` |
| GEO-03 commit and `identity.ts` blob exist in committed objects | `PASS` |
| No merge / rebase / cherry-pick / bisect / lock state | `PASS` |

## 5. Delivered and changed paths (complete)

Modified (4): `README.md`, `AGENTS.md`, `.documents/WIP/plan-roadmap.md`,
`.documents/WIP/plan-next.md`.

Created (13): `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `eslint.config.mjs`,
`next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`,
`src/app/globals.css`, `src/core/efs/identity.ts`, `tests/unit/efs-identity.test.ts`,
`tests/architecture/u01-boundaries.test.mjs`, `.github/workflows/verify-u01.yml`.

Overwritten (1): `.documents/Reports/execution-report.md` — this file, no archive created.

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `package.json` | 1,100 | `BD8895FCF55EF144AADE3C19C89C5D3E9AE0A17847C69AE2B43BE0EE0C23E56A` |
| `pnpm-lock.yaml` | 146,324 | `63FD0CB77C2BC670A53221F18995115F559A45579770BB5EBDD7734F3FB884DC` |
| `tsconfig.json` | 869 | `5CCC9C1F82C48BE12414E9C4A4B370D2E6DD06E3D1784AC4EF2A81717C4E2C9F` |
| `eslint.config.mjs` | 712 | `E82B4BFDF20662A0A7E33D4AA28CEE45A18590141E70BBB4EA410D1D0C3D9FDC` |
| `next.config.ts` | 427 | `F75F30133960D3C01706926595448BF9461B53C5F868A9BE7446DEB1147E6FBA` |
| `src/app/layout.tsx` | 900 | `4BDA1B6AD2C109DD6C9F043BDF99D45850471A3A753FEE9DB7A0E95458F35D34` |
| `src/app/page.tsx` | 501 | `36910E52362A39F31236E89AF09DD78DDBFDD7114EE0BA33DD1BD940558C4911` |
| `src/app/not-found.tsx` | 559 | `FAC3311448BD92B1E63FB5B25F17AFD7B13C1F2E047071E1FAEABDBE8086821F` |
| `src/app/globals.css` | 1,474 | `3D81777F819F2E02A5C1F685D733F734C663CD3E0EC746AE50F39D9B18733274` |
| `src/core/efs/identity.ts` | 4,439 | `DA99857F71B0B630C53A9D7D6746891E579934D0AA3A984005F4A9B62B47876A` |
| `tests/unit/efs-identity.test.ts` | 6,137 | `9A6E3266A219CF51DDBE7D7C0E1B725E7BF1E8354CCBF2CF83A24DA82EE0695A` |
| `tests/architecture/u01-boundaries.test.mjs` | 9,613 | `DF1B3AD919908F95419F8E3748BAFC67D90113364F4F86768459C04601DE0C9E` |
| `.github/workflows/verify-u01.yml` | 2,157 | `70F1FBE8BC3DF13FB97EBEE3AA17677517F031F2790419C664B4BE2529FB85E9` |
| `README.md` | 10,265 | `74243000CBBE250CB8A9802CA9899AFAE7D3874BFCAC451C47101344A6CDCB48` |
| `AGENTS.md` | 11,473 | `1902DEBDDF0A3CD6A363402A2091FF64CDEFC56C8EF3D7E3893638DF30ACC02B` |
| `.documents/WIP/plan-roadmap.md` | 6,819 | `4AB12E236C152C1D59320B97F7C148A5544DC4687AA343E84B7686C409DC75AE` |
| `.documents/WIP/plan-next.md` | 623 | `80C959E5A857B95D5E60D7EB0114A814C49D90FED8FC486B6719DAC1DF87EB1C |

## 6. Local gate results (Windows, Node v24.22.1, pnpm 11.6.0)

Install was performed with task-owned store/cache under `<UNO>/.temp/uno-wo-004/` and
`--ignore-scripts`. pnpm reported **no ignored build scripts**, so no package required a
lifecycle script and no build step was silently skipped.

| Gate | Command | Result |
| --- | --- | --- |
| Lock generation | `pnpm install --lockfile-only --ignore-scripts` | `PASS` — 457 packages resolved, lock written, `using pnpm v11.6.0` |
| Frozen install | `pnpm install --frozen-lockfile --ignore-scripts` | `PASS` — 373 packages, lockfile up to date |
| Governance | `pnpm test:bootstrap` | `PASS` — 19/19 bootstrap tests, validator `OK` (11 required files, no leaks) |
| Architecture | `pnpm test:architecture` | `PASS` — 9/9 |
| Lint | `pnpm lint` | `PASS` — no output, exit 0 |
| Typecheck | `pnpm typecheck` | `PASS` — `tsc --noEmit`, exit 0 |
| Unit tests | `pnpm test` | `PASS` — 19/19 vitest tests, 1 file |
| Production build | `pnpm build` | `PASS` — `next build` 16.4.2 (Turbopack), compiled in 2.0s, 3/3 static pages, routes `/` and `/_not-found` |

One in-scope correction was necessary during this run and is disclosed: the architecture
scanner initially accepted `16.x` as an "exact" version. It was tightened to require strict
`x.y.z` (optionally with a prerelease tag) and the suite then passed 9/9. The approved
source/toolchain ledger was not changed by this correction.

`tsconfig.json` was reformatted and adjusted by `next build` itself: `jsx` was set to
`react-jsx` (Next's React automatic runtime, mandatory) and `.next/dev/types/**/*.ts` was
added to `include`. Staged values are the post-normalisation ones recorded in §5.

## 7. HTTP assertions against the compiled production server

`next start` was bound to loopback only, each run was stopped afterwards, and the listening
port was confirmed closed (no orphan process left behind).

| Assertion | Expected | Observed |
| --- | --- | --- |
| `GET /` | 200 | `200` |
| heading | `<h1>Foundation Uno</h1>` | present |
| body sentence | `U01 technical baseline — the authored public Site is not configured.` | present |
| robots directive | `noindex, nofollow` | `<meta name="robots" content="noindex, nofollow, nocache"/>` |
| document language | static `en` | `<html lang="en">` |
| `GET /en` | 404 | `404` |
| `GET /en-001` | 404 | `404` |
| `GET /about` | 404 | `404` |
| `GET /does-not-exist-9f3` | 404 | `404` |
| `GET /robots.txt` | no published-Site advertising | `404` |
| `GET /sitemap.xml` | no published-Site advertising | `404` |
| served HTML contains `hreflang` | no | absent |
| served HTML contains `rel="canonical"` | no | absent |
| served HTML contains `sitemap` | no | absent |
| served HTML contains `vercel` / `analytics` / `googletagmanager` / `connect` | no | absent |

No provider request is issued by the served document: the HTML references only Next.js
local assets and the inline stylesheet bundle. `/` returns HTTP 200 while remaining
non-indexable; unknown paths return an ordinary 404 with no implicit Site or locale guess.

## 8. Findings, warnings and limitations

| # | Finding | Mark |
| --- | --- | --- |
| W1 | The machine's **system pnpm is 12.15.0**, not the mandated exact 11.6.0. A global install/upgrade is forbidden by the order, so pnpm 11.6.0 was provisioned **locally** with corepack into `<UNO>/.temp/uno-wo-004/corepack` (`COREPACK_HOME`) and every pnpm command ran through `corepack pnpm` — verified `corepack pnpm --version` = `11.6.0`, and both install runs reported `using pnpm v11.6.0`. No global config, shim or user-level setting was changed. | `PASS` with disclosure |
| W2 | WSL distro `Ubuntu-26.04` is installed, but it contains **no `node` and no `pnpm`**. Provisioning either inside WSL would be a global tool install, which the order forbids, so the full gate set was **not** repeated under WSL. Hosted Ubuntu CI provides the Linux evidence instead. | `UNVERIFIED` (WSL) |
| F1 | `pnpm audit` reports **1 moderate** advisory: `minimatch` `GHSA-g3hv-75wg-m249`, vulnerable `>=7.0.0 <11.0.1`. It is reached only transitively through dev tooling (`eslint-config-next → eslint-plugin-import → @typescript-eslint → minimatch`), is not a runtime dependency, and is not a direct dependency. It cannot be fixed without moving off the approved exact versions, so it is **recorded, not bypassed and not upgraded**. | `REVIEW` — Architect decision |
| F2 | Three `next start` HTTP verification runs were performed. Two early runs had invalid content assertions because a PowerShell reserved variable (`$home`) was used as the scratch holder; those two runs were discarded and **not** counted. The content assertions quoted in §7 come only from the corrected re-run. Status-code assertions from all runs agreed. | `PASS` after correction |
| F3 | The `.gitattributes` policy (`*.md text eol=lf`) applies to this report as well. The report is written with LF on disk, so its working file and its Git blob are byte-identical; no CRLF/LF divergence is expected for this commit. | informational |

## 9. Write fences actually observed

- `<FOUNDATION>` was read **only** through `git -C <FOUNDATION> cat-file blob` on the immutable
  GEO-03 commit. No fetch, no checkout, no build, no install, no test, no worktree file read.
  Its worktree HEAD `8789a450525d44dc8f60ea572ad84fcf64f2ace5` and its five dirty files remain
  exactly as found.
- `<PARENT>` was read-only throughout. No file, no `.gitignore`, no commit and no push.
- No `.env`, no secret, no credential, no token and no private absolute path was created or
  published. The private ACTIVE order is still ignored and untracked and was never staged.
- Task scratch `.temp/uno-wo-004/**` (corepack home, pnpm store, pnpm cache, XDG dirs, server
  logs) is inside `<UNO>` and Git-ignored. `node_modules/`, `.next/` and `next-env.d.ts` are
  generated, ignored and untracked. No file was written outside the §4 ledger.

## 10. Stage, rights and scope caveats

- This is a **technical baseline only**. It is not the P05 Home/Page starter, not the
  three-Page content set, not a published Site, not module parity, and not U01 completion.
- No P01–P08 website feature, no EFS cascade, no content model, no routing/locale authority,
  no presentation shell, no contact delivery, no analytics, no Connect module and no
  third-party provider is present or claimed.
- `U00` was closed by explicit **Owner** activation. Closing a stage is the Owner's act;
  this report does not close `U01` and cannot close it.
- Licence: Apache-2.0 retained unchanged. The adopted `identity.ts` keeps its upstream
  attribution comments intact.
- No release, no deployment, no DNS, no PR, no tag and no remote beyond Uno `main`.

## 11. Acceptance matrix

| Criterion | Mark |
| --- | --- |
| (a) exact Owner authority proven | `PASS` |
| (b) parent/source fences and single `origin` independently supported | `PASS` |
| (c) only declared file paths modified | `PASS` |
| (d) copied pure source blob exactly matches GEO-03 | `PASS` — `7e6f8e0a…` both ways |
| (e) minimal dependency lock plus reproducible install | `PASS` locally; hosted reproduction pending |
| (f) real Next production build and noindex HTTP checks locally | `PASS` |
| (g) positive/refusal and strict architecture tests | `PASS` — 19 + 9 + 19 |
| (h) Windows **and** Ubuntu Node 24 bootstrap and U01 workflows at the final SHA | `PASS` at `cc01b183a54f926c592767874a95f83b3255347c` — both workflows, both hosts |
| (i) final report, public commits, no ACTIVE/secret/asset/provider leakage | `PASS` locally; independent verification pending |

## 12. Status

**Local execution: `COMPLETE`.** Hosted CI results at the product commit, the exact commit
SHAs and the public URLs are recorded in the single report-only follow-up commit authorised
by this order. `U01` remains **OPEN**. Architect review and Owner stage closure are required;
an agent `COMPLETE` is not an `ACCEPT`.
## 13. Hosted CI at the product commit `cc01b183a54f926c592767874a95f83b3255347c`

Both workflows were triggered naturally by the permitted push and both completed `success`
on both hosts at exactly that commit:

| Workflow | Run | Hosts | Steps |
| --- | --- | --- | --- |
| `Uno Bootstrap Verify` (existing, unchanged) | `43728296399` — https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43728296399 | `ubuntu-24.04` success, `windows-2025` success | checkout, Node 24, bootstrap tests, scaffold validation — all `success` |
| `Verify U01 baseline` (new) | `43728296358` — https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43728296358 | `ubuntu-24.04` success, `windows-2025` success | pnpm 11.6.0, Node 24, tool versions, frozen install, bootstrap gate, architecture, lint, typecheck, unit tests, production build — all `success` |

**Evidence basis.** Run conclusions and **per-step conclusions** were read from the GitHub
Actions API at that exact commit, so each named check is individually observed rather than
inferred from an overall badge. Job **log text** could not be downloaded: the logs endpoint
returns HTTP 403 without an authenticated token, and no credential may be introduced for
this run. Log-level readback is therefore `UNVERIFIED`; the step-level results above are
observed. No check was rerun, skipped, loosened or bypassed.

This report-only commit is pushed within the same work order. The two workflows must pass
again at the new report-only head; that result is confirmed in the completion handoff and is
**not** asserted here in advance.
