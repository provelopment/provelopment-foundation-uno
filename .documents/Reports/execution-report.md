# UNO-WO-008 / R02 — author-destination safety classifier

**Order / edition:** `UNO-WO-008 / R02` (FINAL — EXECUTE) · **Executed:** 2026-11-16
**Private ACTIVE:** `.documents/WIP/workorder-active.md`, SHA-256 `efb497089c1ff55d6bad6a6f86737ea3e9f60ea4e9b89057a4943c9228b4ef6f` (bytes withheld)
**Required start:** `4e74ae1bec8d11994d8ba2c26ef721a1d58d02f4` · **Product head:** `67c1898b253eff4d30dbad10d2260dad1c927246`
**Stage:** U01 — bounded core primitive · **U01 remains OPEN** · **no closure, release or deployment**
**Disposition requested:** Chief Master Architect review

All paths are symbolic. No private absolute path, credential, ACTIVE byte or personal datum
appears in this report or in any committed file.

## 1. Authority and scope actually verified

| Item | Observed |
| --- | --- |
| Private ACTIVE slot | regular file at `.documents/WIP/workorder-active.md`; ignored by the repository, untracked, unstaged; no root-level alternative or duplicate order |
| ACTIVE identity | SHA-256 `efb49708…b4ef6f`; matches the Owner activation exactly; internal integrity checks (length, line endings, no BOM, terminating newline) passed without exposing the content |
| Order edition | `UNO-WO-008 / R02`; `R01` of the same order was treated as superseded and was not executed |
| Read before writing | repository `AGENTS.md`, local SOP, three `plan-*.md` slots, the single previous execution report, this exact ACTIVE |
| Scope | one pure author-destination *syntax* classifier, its focused tests, one exact architecture-list line and one inventory note |
| Not authorised, not performed | merge, PR, tag, release, deployment, provider action, dependency change, parent/Foundation mutation, U01 closure |

## 2. Read-only preflight (before any write)

| Check | Result |
| --- | --- |
| Physical Uno root resolves to the intended directory; no junction, symlink or reparse escape; `git` toplevel equals the root | `PASS` |
| Exactly one worktree and one checkout on branch `main`; clean index and worktree | `PASS` |
| Exactly one remote, `origin` → `provelopment/provelopment-foundation-uno` only | `PASS` |
| Local `HEAD` = `main` = remote `refs/heads/main` = `4e74ae1…` | `PASS` |
| No merge, rebase, cherry-pick, bisect or index lock present | `PASS` |
| Parent workspace anchored `/00.foundation-uno/` ignore rule is effective (`check-ignore` confirms) and the parent tracks no Uno path; parent head `e17fd960…` unchanged | `PASS` |
| Foundation template `8789a450…`, Solo and all siblings read-only; no dirty content read | `PASS` |
| Frozen governance bytes match; `verify-governance-docs.mjs` `PASS` | `PASS` |

## 3. What was delivered — four ledger paths only

| Path | Operation | Content |
| --- | --- | --- |
| `src/core/safe-author-url.ts` | CREATE | Original, import-free, pure classifier: `classifyAuthorDestination(input: unknown)` returning a discriminated accepted/rejected verdict, plus `isSafeAuthorHref` delegating to it |
| `tests/unit/safe-author-url.test.ts` | CREATE | 27 independent Vitest cases: admitted categories, exact byte preservation, hostile refusals, non-coercion, determinism, non-authorisation |
| `tests/architecture/u01-boundaries.test.mjs` | EDIT (1 line) | Added `src/core/safe-author-url.ts` to the hard-coded authored-file list; every existing assertion retained |
| `.documents/Architecture/source-inventory.md` | EDIT (35 lines) | One labelled U01 security-adoption note: pinned blob IDs/bytes, original-vs-source differences, admitted and refused forms, boundary and U03/U04/U05 handoff |

**Contract behaviour.** An accepted verdict carries the category and an `href` **identical to the
input**, so validation and emission can never diverge: no trimming, percent-decoding, entity
unescaping or WHATWG reserialisation occurs. A refused verdict carries a bounded reason and **no
href**, and never interpolates the offending value. `unknown` input is refused before any lookup,
so no coercion happens and `toString` / `Symbol.toPrimitive` / `valueOf` are never invoked. Absolute
origins are validated lexically first; the in-memory `URL` constructor is used only as a
cross-check, so its normalisation cannot rescue `https:example.org`, `https:///x`, userinfo, an
invalid port or an impossible host. The module has no imports, no I/O, no global state, no
framework and no provider surface (a test asserts the module exports exactly four names).

**Refusal coverage proven:** `javascript:`, `vbscript:`, `data:`, `blob:`, `file:`, `ftp:`, `ws:`,
`wss:`, `about:`, `view-source:`, `jar:`, **`tel:`**, unknown `x:`/`custom:` schemes; raw and
percent-encoded protocol-relative forms; raw C0/C1 controls and DEL; whitespace (including NBSP and
U+2028); backslash; `<`, `>`, `"`, `'`, backtick; numeric, hex and named character references and
their double-encoded forms; malformed escapes and invalid UTF-8 sequences; encoded controls and
encoded markup; 3-round and 4-round nesting; malformed origins; empty, over-long and non-string
input. Benign separators stay valid and unchanged: `?a=1&b=2`, `?q=100%25`, `?q=%E2%82%AC`,
`?q=hello%20world`, `/a%20b/c`, `mailto:a@b.com?subject=Hello%20there`.

## 4. Provenance, rights and immutable source evidence

| Pinned GEO-03 object | Blob ID | Bytes | Verified | Use |
| --- | --- | ---: | --- | --- |
| `src/core/safe-url.ts` | `d19b6c8ecb2f1bb3d3a163260ca2afeb87b89493` | 8,195 | exact | Concept only: allowlist author destinations, fail closed. Its tolerances (trim, entity-decode, `tel:`) are deliberately **not** adopted |
| `tests/unit/safe-url.test.ts` | `13343cf06cd3dca1768edcb8ae46480325dc1391` | 3,503 | exact | Reference case *categories* only; no fixture copied |
| `src/core/page-document.ts` | `a12d964c43626c6313a621bf628f5cc24b65d444` | 45,106 | exact | Evidence that Foundation's Page authoring validator depended on URL classification; **not imported** |

All three were read as committed immutable objects at `c05c55ea…` through authenticated read-only
GitHub reads; no dirty Foundation worktree was read. **No byte of Foundation source or tests is
copied:** the classifier and its fixtures are Uno-authored, the module imports nothing, and no
asset, brand, `modules/connect` path, provider SDK or Solo Rust code entered the repository. Licence
position unchanged: Apache-2.0 source review only; no `NOTICE`, `package.json` or lockfile change.

## 5. Local verification — rerun on this machine

Node v24.22.1, pnpm 11.6.0, existing frozen lockfile, no package installed or upgraded.

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | up to date; lockfile unchanged |
| `node scripts/verify-governance-docs.mjs` | `PASS` — frozen bytes match |
| `node --test tests/governance-docs.test.mjs` | 6 / 6 pass |
| `pnpm test:bootstrap` | 19 / 19 pass; 11 files, licence, four-slot discipline, private-authority screen |
| `pnpm test:architecture` | 11 / 11 pass |
| `pnpm lint` | clean, exit 0 |
| `pnpm typecheck` | clean, exit 0 |
| `pnpm test` (Vitest) | **118 / 118 pass = 91 retained + 27 new** |
| `pnpm build` | success, 3 / 3 static pages, exit 0 |
| `pnpm test:http` (real loopback production server) | 21 / 21 pass, exit 0 |

No gate was skipped, downscoped, suppressed or made non-blocking, and no hosted job is reported as
a local run. `/` still serves the non-indexable technical placeholder with unchanged refusals
(`/en`, `/en-001`, `/about`, `/does-not-exist-9f3`, `/robots.txt`, `/sitemap.xml` all 404; no
`hreflang`, canonical, sitemap or analytics markup). Local WSL execution was not attempted this
run and is therefore not claimed.

**Warnings, disclosed rather than waived:** pnpm prints a cosmetic "update available 11.6.0 →
12.21.0" notice (no upgrade performed); the created and edited files were normalised to LF per
`.gitattributes` and the staged blobs were proven byte-identical before and after that
normalisation; `git diff --cached --check` found one blank line at end of file in the new test file,
which was corrected **before** the commit. Not observed in this run's captured local output: the
Windows Node `DEP0190` notice, Next "no cache" notices and the pnpm v10 shim-layout warning; nothing
was hidden to achieve that.

## 6. Exact-head hosted verification — product head `67c1898…`

| Workflow | Run | ubuntu-24.04 | windows-2025 | Governance steps | Steps / non-success |
| --- | --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43812939337 | success | success | success (both) | 9 / **0** |
| Verify U01 baseline | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43812939330 | success | success | success (both) | 18 / **0** |

Step-level conclusions were read from the GitHub API for the exact head SHA. **Full job log text is
`UNVERIFIED`:** the logs endpoint returned **HTTP 403** to this unauthenticated client on all four
jobs, so any warning text inside a hosted log is not asserted here. No workflow was edited, rerun,
cancelled or retried, and hosted green is not offered as a substitute for the local root/ACTIVE proof
in §2.

## 7. Write boundary, privacy and cleanup

- Product commit `67c1898…`: exactly the four ledger paths, 719 insertions, 0 deletions, direct
  parent `4e74ae1…`, fast-forward push only. No other tracked path changed: not `src/app/**`, not
  `capability-registry.ts`, not `package.json`, lockfile, `.gitignore`, workflow, bootstrap script,
  frozen governance file or planning slot.
- This report is the sole content of the single permitted report-only commit; it is not duplicated
  or archived, and it does not predict its own SHA.
- The private ACTIVE was never staged, copied, rewritten or published; no private absolute path,
  credential, ACTIVE byte or personal datum appears in any changed file, commit message or this
  report.
- Scratch use was limited to one empty hooks directory under `.temp/uno-wo-008-r02/`, removed after
  use; `node_modules/`, `.next/` and the TypeScript cache stay inside the ignored Uno build paths.
  No node listener was left running. Parent workspace, Foundation template, Solo and all siblings
  remained read-only throughout.

## 8. Stage status and requested disposition

This order's bounded deliverable — one pure, refusal-tested author-destination classifier, its
focused tests, the exact architecture-list line and the inventory note — is **COMPLETE**. That is
**not** U01 completion and not a website: there is no authored Page model, no Page-document
envelope, no locale routing, no EFS manifest, no renderer, no composer, no public route and no
provider integration. Twenty-two registered capability names still render nothing, and this
classifier is a single early authoring/security primitive.

Formal closed-stage meter remains **1 / 8 (12.5%)**: U00 Owner-closed, **U01 OPEN**, U02–U07 NOT
STARTED. The genuine current blocker is U01 itself: the repository is a verified technical baseline
with an incomplete Page/locale/publication slice, so the public website still does not exist.

The Agent does not accept or close anything: the Chief Master Architect is asked for
`ACCEPT` / `REVISE` / `STOP` on this exact bounded order only.
