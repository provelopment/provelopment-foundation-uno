# UNO-WO-005 / R01 — U01 AUTHORING KERNEL, ADOPTION LEDGER AND HOSTED HTTP PROOF

**Order:** `UNO-WO-005` · **Edition:** `R01` · **Stage:** U01 (second bounded implementation package)
**Execution date:** 2026-11-15
**Execution role:** Foundation Uno Implementation Agent
**Independent review:** Chief Master Architect — everything below is agent-reported until reproduced
**Owner authority:** explicit activation naming `UNO-WO-005 / R01` with the full file SHA-256
**Local outcome:** `COMPLETE` · **U01 stage status:** **OPEN** (unchanged)

> Evidence only. This is not Architect `ACCEPT` and does not close `U01`. No website, release or
> deployment exists or is claimed. `U02–U07` are untouched.

All paths below are symbolic (`<UNO>`, `<FOUNDATION>`, `<PARENT>`). No private absolute path,
active-order byte, unpublished raw hunk, credential or personal datum is reproduced.

## 1. Authority and order identity

| Fact | Value |
| --- | --- |
| Order ID / edition | `UNO-WO-005 / R01` |
| Installed order path | `<UNO>/.documents/WIP/workorder-active.md` |
| Installed order SHA-256 | `E25261749B0A66D603A4B7D2FEF73341EBBAA0EBFAEE4C47AAE44C699F64334E` |
| Installed order size | 31,628 bytes |
| Owner installation | the Owner installed this edition directly; the Agent verified it in place and performed **no** replacement write |
| Predecessor | `UNO-WO-004 / R02`, 21,872 bytes, `F865B3E3…A979401F4` — Architect-ACCEPTED at `4f8cd53…`, displaced by this edition before this run's first read |
| ACTIVE visibility | ignored (`.gitignore:12`), **untracked**, never staged, never published |
| Root-level alternate order | absent |
| Uno start commit | `4f8cd53b90354032ccb29e54176c20bc667624f5` (local and remote `main` at preflight) |

## 2. Preflight result

| Check | Result |
| --- | --- |
| Installed ACTIVE is the exact 31,628-byte / `E2526174…` file | `PASS` — read back, not replaced |
| ACTIVE regular, ignored, untracked; no second or root-level order | `PASS` |
| `<UNO>` resolves physically; no reparse point in the directory chain | `PASS` |
| One checkout, one worktree, branch `main` | `PASS` |
| Exactly one remote, `origin` → Uno only | `PASS` |
| Local `HEAD` = `4f8cd53b90354032ccb29e54176c20bc667624f5` | `PASS` |
| Remote `refs/heads/main` = same SHA via `ls-remote`, no fetch | `PASS` |
| Index and worktree clean before the run | `PASS` |
| Published report blob `0dd33bbf91a6461c486a8f02631f03f28e77447a` present | `PASS` |
| Existing identity codec blob `7e6f8e0a4f0b9ba7b90f66c44205ff67befb7d20` | `PASS` |
| `<PARENT>` own-root anchored `/00.foundation-uno/` guard active; HEAD unchanged `e17fd960…` | `PASS` — read-only throughout |
| No merge / rebase / cherry-pick / bisect / lock state | `PASS` |
| Six pinned GEO-03 blobs exist with exact IDs and sizes | `PASS` — see §3 |
## 3. Pinned source objects read (read-only, committed objects only)

All six were verified by resolving `c05c55ea61b5347cf5032211dd0bf37f2cc5083c:<path>` and checking
the blob ID and byte size, then read with `git cat-file blob`. No fetch, no checkout, no
worktree read, no dirty hunk.

| Path | Expected blob | Bytes | Verified |
| --- | --- | ---: | --- |
| `src/core/page-content.ts` | `49014ecbe5152244ffb40eceee56359f0b9d55d1` | 3,896 | `PASS` |
| `src/core/page-route-path.ts` | `aed10f713c148b4190dcf744015d051cce8851ce` | 7,406 | `PASS` |
| `tests/unit/page-route-path.test.ts` | `9edb01de6a42d5d989c82113e207dff6e8af91f9` | 6,035 | `PASS` (behaviour evidence only) |
| `src/core/efs/locales.ts` | `3cbe1dbe3b684c5cfc79d1df7e5fc5a61db3c24f` | 15,109 | `PASS` (adaptation reference) |
| `src/core/page-document.ts` | `a12d964c43626c6313a621bf628f5cc24b65d444` | 45,106 | `PASS` (ledger evidence only) |
| `src/components/site/page-document-content.tsx` | `fc35a52d6cfc5f114e50470e8286a89916cde801` | 8,280 | `PASS` (ledger evidence only) |

**Copied bytes versus adapted code.** Only `src/core/efs/identity.ts` carries upstream Git blob
identity (`7e6f8e0a…`, unchanged, 4,439 B). Nothing in this order was copied verbatim: the two
route/source files are **adaptations** (retained pure algorithms, corrected address-shape prose,
recorded provenance) and `src/core/efs/uno-locales.ts` is a **new Uno-owned rewrite** that
deliberately omits Foundation's implicit preference-prefix selection and script-only
qualification. No second upstream file was added verbatim.

## 4. Delivered paths and output hashes (14 changed + this report)

| Path | State | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `src/core/page-content.ts` | created | 3,276 | `909905F30CBDB88CE26EB10484266249310C711765E170A04124141CA0E501C6` |
| `src/core/page-route-path.ts` | created | 7,452 | `F11624C73D94F8C4EC6125EB3FD9044486DEE36DD7135609D13F7FE796322FE3` |
| `src/core/efs/uno-locales.ts` | created | 15,429 | `2F9072DC0AC290F0A60F95A89E4D3503511DE2C907043E3CBA7B0876078C3429` |
| `tests/unit/page-route-path.test.ts` | created | 8,666 | `28DCE8F8C1653A9415EEB9A1179365DF609BA185C7254A5F72E0534847F5ACA1` |
| `tests/unit/uno-locales.test.ts` | created | 13,414 | `59C7F31E2942DD8A8B50BAB96C75A59E4EC11802D151D36500B6CF0B8F0FAD93` |
| `tests/architecture/u01-boundaries.test.mjs` | extended | 12,504 | `2385EE0B7BFB0E06E06B30D33161ED18B9557D2E97BF01951D5F5BD47432C842` |
| `scripts/verify-u01-http.mjs` | created | 7,140 | `8667983789A1CD1077835DCFF9C306B9AB371F76A54F83796CE6F8BC5C75FD68` |
| `package.json` | changed | 1,133 | `910BDA9ABA7C22AD30CF5178161B1D2AFA8A61F70426DE458A862E44104CF64C` |
| `.github/workflows/verify-u01.yml` | changed | 2,280 | `5E84AB16CD1E6C10374EB59F26D9430DB969E18AD4576E781C3A7052F30F2F97` |
| `.documents/Architecture/source-inventory.md` | appended | 57,612 | `31FB76C04C9B5EF082D750AF0CC7CA45B12707B911C866CDE07C3ADF6BC3E564` |
| `.documents/WIP/plan-roadmap.md` | changed | 5,684 | `886B4DBC6F2403596E9AD3FAE0638BDFD7A6E57F54FB408DDC0838C3DED6045D` |
| `.documents/WIP/plan-next.md` | changed | 680 | `0F4F00822753F7865BE10F3C5043FAB743A1CB5F18B0C90AF94259636EC71A76` |
| `README.md` | changed | 11,041 | `9D515DF5FAEF280B0BEAFC5F2FE2112212331E351AF50DA65B8FFF90A14E66E8` |
| `AGENTS.md` | changed | 11,729 | `4FBDA43DF7CD9A64F887CBBC03924F9719D154513059409E43FA6F08A0DC1256` |
| `.documents/Reports/execution-report.md` | overwritten | this file | - |

**Unchanged and asserted unchanged:** `src/core/efs/identity.ts` (blob `7e6f8e0a…`),
`pnpm-lock.yaml` (`63FD0CB7…` before and after the frozen install), `tsconfig.json`,
`next.config.ts`, `.gitattributes`, `.gitignore`, `LICENSE`, the U00 bootstrap validator, its
tests and its workflow, and `.documents/SOP/`.

## 5. The kernel and its tests

**Slug and route path.** `CONTENT_SLUG_PATTERN` is `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` and
`isContentSlug(value: unknown)` refuses a non-string BEFORE any regex coercion, so an object with
a custom `toString` can never be read as an authored slug. `pageRoutePathSegments` accepts 1-4
slug segments and at most 160 characters, refusing empty, `.`, `..`, encoded, backslash and
leading/trailing separators. The constructor refuses a separator smuggled through one argument;
the leaf returns an empty string for a bad route; the file mapper requires an exact
extension; child directories are sorted, unique and depth/length bounded. No `/ww`, Site code,
country folder or site-mode dispatch exists in any Uno function.

**Locale policy.** `localeTagIssue` requires language PLUS region (`en-001`, `de-DE`,
`zh-Hans-CN`) and rejects bare language, bare script, variants-only, `en-01`, private extensions,
non-ASCII/control characters, surrounding whitespace and tags over 64 characters.
`canonicalLocaleTag` normalises well-shaped mixed-case input and throws otherwise;
`localePathKey` returns the lower-case URL key. `localePolicyIssue` requires canonical STORED
spellings, unique path keys, a member default, lower-case 2-3 letter map keys each targeting a
declared locale, `en` mapping to `en-001` exactly, and no prototype-pollution keys.
`selectUnoEntryLocale` orders explicit, then saved, then bounded `Accept-Language`, then default;
an unsupported explicit value is REJECTED and never overwritten; `q` must be 0-1 with `q=0`
excluded and deterministic tie ordering; `en-US` never becomes `en-001` and `de` never becomes
`de-DE` without an explicit map.

| Suite | Cases | Result |
| --- | ---: | --- |
| `tests/unit/efs-identity.test.ts` (unchanged) | 19 | `PASS` |
| `tests/unit/page-route-path.test.ts` | 23 | `PASS` |
| `tests/unit/uno-locales.test.ts` | 36 | `PASS` |
| `pnpm test` total | 78 in 3 files | `PASS` |
| `pnpm test:architecture` | 11 | `PASS` |
| `pnpm test:bootstrap` | 19 | `PASS` |

**Negative outcomes handled honestly.** Three of my own initial assertions were wrong and were
corrected to the pinned contract rather than to hide a defect: a lowercase `readme` IS a valid
slug (only `README` is refused), `readme.md` therefore maps to `readme`, and a short key is
matched case-insensitively so `EN` resolves through the declared map. One implementation defect I
introduced (a swallowed closing brace in `page-route-path.ts`) was caught by typecheck and lint
and fixed before any gate passed.
## 6. Local gates (Windows, Node v24.22.1, pnpm 11.6.0)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | `PASS` - already up to date; lock `63FD0CB7...` unchanged |
| `pnpm test:bootstrap` | `PASS` - 19/19, validator OK |
| `pnpm test:architecture` | `PASS` - 11/11 |
| `pnpm lint` | `PASS` - exit 0, no output |
| `pnpm typecheck` | `PASS` - `tsc --noEmit`, exit 0 |
| `pnpm test` | `PASS` - 78/78 in 3 files |
| `pnpm build` | `PASS` - Next 16.4.2 compiled; 3/3 static pages; routes `/` and `/_not-found` |
| `pnpm test:http` | `PASS` - 21/21 assertions |
| `pnpm audit` | 1 moderate dev-tool advisory - see section 8 |

Toolchain: system pnpm is 12.x, so pnpm 11.6.0 was again provisioned locally through corepack
with `COREPACK_HOME=<UNO>/.temp/uno-wo-005/corepack`, and every command ran through it. No global
install, upgrade, shim or user-level configuration changed. WSL Ubuntu 26.04 has no `node` and no
`pnpm`; installing them would be a forbidden global tool install, so local WSL gates are
`UNVERIFIED` and hosted Ubuntu supplies the Linux evidence.

## 7. Real production HTTP proof

`scripts/verify-u01-http.mjs` (Node built-ins only) requires an existing `.next`, starts the
unchanged Next server through the pinned local CLI with `node` and no shell, on `127.0.0.1` and an
OS-chosen ephemeral port, polls for bounded readiness, issues real `fetch` requests, always
terminates and waits for that exact child, then confirms the port is released.

| Assertion | Result |
| --- | --- |
| `/` returns 200 with the exact h1 and the exact baseline sentence | `PASS` |
| robots `noindex, nofollow` | `PASS` |
| `/en`, `/en-001`, `/about`, `/does-not-exist-9f3`, `/robots.txt`, `/sitemap.xml` return 404 | `PASS` (6/6) |
| No hreflang, canonical, sitemap, analytics, googletagmanager, `@vercel` or `modules/connect` in served HTML | `PASS` (7/7) |
| Server stayed up; loopback port released after shutdown | `PASS` |

This proves the technical placeholder only. It says nothing about later real EFS routing.
## 8. Security advisory (recorded, not hidden)

| Fact | Value |
| --- | --- |
| Advisory | `GHSA-g3hv-75wg-m249` (minimatch denial of service) |
| Severity | **1 moderate**, no high or critical findings |
| Stated vulnerable range | `>=7.0.0, <11.0.1`; patched `>=11.0.1` |
| Installed version | `minimatch@3.1.5` - numerically OUTSIDE the stated range, so the tool's flag and the advisory range disagree; the maintainer's original advisory names `10.2.6` and the interpretation for 3.x is disputed |
| Dependency path | `devDependencies > eslint@9.39.5 > @eslint/config-array@0.21.2 > minimatch@3.1.5` (and sibling ESLint/`typescript-eslint` paths) |
| Exposure | development lint tooling only; no runtime dependency, no shipped code path, no provider request |
| Action | recorded as `REVIEW` technical debt. No override, no major-version bump, no lock change, no version suppression |

`pnpm audit --audit-level high` is NOT claimed as proof that moderate alerts are fixed, and no
gate was loosened. New high/critical or runtime exposure would have been a STOP; none occurred.

## 9. Write fences and no-write evidence

- `<FOUNDATION>` read ONLY through `git cat-file` / `git rev-parse` on committed objects with
  `GIT_OPTIONAL_LOCKS=0`. No fetch, checkout, build, install, test or worktree read. Its HEAD
  remains `8789a450525d44dc8f60ea572ad84fcf64f2ace5` with its five pre-existing dirty files.
- `<PARENT>` read only. HEAD remains `e17fd9601b4fc40be7af77caf4b255bd115b12b8`; its
  `.gitignore` (anchored `/00.foundation-uno/` at line 138) was not modified; no commit, no push.
- No `.env`, secret, token, credential, private absolute path or active-order byte appears in any
  published file; `scripts/verify-bootstrap.mjs` and the boundary scanner both confirm this.
- Task scratch is confined to ignored `<UNO>/.temp/uno-wo-005/**` (corepack home, pnpm store and
  cache, XDG dirs) plus generated `node_modules/`, `.next/`, `next-env.d.ts`, `*.tsbuildinfo`.
  No unknown or Owner-owned file was removed.
- No direct package was added, removed or upgraded; `pnpm-lock.yaml` is byte-identical before and
  after; no Git fetch, pull, rebase or force operation was performed.

## 10. Still open (nothing invented as delivered)

- No published Site, Page, route, locale route, manifest, sitemap or representation exists.
- The 17 Foundation sections and the 22 capability contracts are **recorded targets**, not
  implemented modules; no module parity or 39-module claim is made.
- Real public routing/locale HTTP behaviour (R4, canonical redirects, unlisted targeting,
  per-Page fallback) belongs to U03 and is not satisfied by the pure locale kernel.
- Contact delivery, providers, Connect licensing, analytics, assets and branding remain U05 and
  are unreviewed.
- Local WSL execution remains `UNVERIFIED` (no Node/pnpm in WSL; global install forbidden).
- `U01` stays OPEN. Only independent Architect review plus an explicit Owner decision can close
  a stage.

## 11. Acceptance matrix

| Condition | Mark |
| --- | --- |
| Exact frozen R01 private active, SHA, size, ignored/untracked | `PASS` |
| Untouched Foundation and parent; single Uno origin | `PASS` |
| Real reusable source kernel with named positive/refusal tests | `PASS` |
| No hidden Spoke, geo or provider authority (negative fixtures) | `PASS` |
| Source rights and 17/22 parity stated truthfully | `PASS` - ledger appended, ambiguity marked OPEN |
| Reproducible baseline, zero new packages, no lock change | `PASS` |
| Real cross-host technical HTTP | local `PASS`; hosted recorded in the report-only follow-up |
| Vulnerability accuracy | `PASS` - one moderate dev-tool advisory disclosed |
| Published only in authorized scope | `PASS` locally; independent verification pending |
| Truthful stage status | U01 OPEN; no website or release claim |

## 12. Status

**Local execution: COMPLETE.** Exact product-commit and hosted run evidence, plus the final
report blob, are recorded in the single authorised report-only follow-up commit. `U01` remains
**OPEN**; an agent `COMPLETE` is not an Architect `ACCEPT`.
