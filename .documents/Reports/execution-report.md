# UNO-WO-009 / R01 — declared Page-source and visibility policy

**Order / edition:** `UNO-WO-009 / R01` (FINAL — EXECUTE) · **Executed:** 2026-11-16
**Private ACTIVE:** `.documents/WIP/workorder-active.md`, SHA-256 `ba8f07fcc9b20c0c16ae6cf0fd8166607460ffb240c8b34542466828cb5bc786` (content withheld)
**Required start:** `17db693f6dd094f8f0d1b7a7842a267d7f9377ed` · **Product head:** `6ca5ae62f78cadba379e05e8d5d7a4cbe8bfb892`
**Stage:** U01 — one bounded policy increment · **U01 remains OPEN** · no closure, release or deployment
**Disposition requested:** Chief Master Architect `ACCEPT / REVISE / STOP`

All paths are symbolic. No private absolute path, credential, ACTIVE byte or personal datum appears
in this report or in any committed file.

## 1. Authority verified

| Item | Observed |
| --- | --- |
| ACTIVE slot | one regular, non-symlink file at `.documents/WIP/workorder-active.md`; ignored by the repository, untracked, unstaged; no root-level alternative or duplicate |
| ACTIVE identity | SHA-256 `ba8f07fc…bc786`; matches the separate Owner activation exactly; length, line endings, absent BOM and terminating newline checked without exposing content |
| Order edition | `UNO-WO-009 / R01`; the superseded `UNO-WO-008 / R02` slot was replaced directly, which this order permits |
| Read before writing | `AGENTS.md`, local SOP, all three `plan-*.md` slots, the single prior execution report, the source inventory, current `src/core/**` and tests, and this exact ACTIVE |
| Progress authority | Uno GitHub only: source, inventory, commit history, one execution report, exact-head Actions |

## 2. Read-only preflight (before any write)

| Check | Result |
| --- | --- |
| Physical Uno root resolves to the intended directory; no junction, symlink or reparse escape; `git rev-parse --show-toplevel` names it exactly | `PASS` |
| Exactly one worktree, branch `main`, clean index and worktree, no merge/rebase/cherry-pick/bisect/lock | `PASS` |
| Exactly one remote, `origin` → `provelopment/provelopment-foundation-uno` only, no alternate remote | `PASS` |
| Local `HEAD` = local `main` = remote `refs/heads/main` = `17db693…` | `PASS` |
| Parent workspace anchored `/00.foundation-uno/` ignore rule effective; parent tracks no Uno path; parent `e17fd960…` unchanged | `PASS` |
| Foundation template `8789a450…`, Solo `502892f…`, all siblings read-only; no dirty reference content read | `PASS` |
| Frozen governance bytes match; `verify-governance-docs.mjs` `PASS` | `PASS` |
| Four immutable GEO-03 objects verified by path, blob SHA and byte size before use | `PASS` |

## 3. Delivered — four ledger paths only

| Path | Operation | Content |
| --- | --- | --- |
| `src/core/page-authoring-policy.ts` | CREATE | Original pure policy: `selectDeclaredPageSource(input: unknown)` and `decideSelectedPageVisibility(input: unknown)`, plus three frozen vocabularies. Imports only `./page-content` and `./page-route-path` |
| `tests/unit/page-authoring-policy.test.ts` | CREATE | 26 independent Vitest cases covering precedence, visibility, hostile input, determinism and non-authorisation |
| `tests/architecture/u01-boundaries.test.mjs` | EDIT (1 line) | Added `src/core/page-authoring-policy.ts` to `CORE_AUTHORED_FILES`; every other assertion, negative test and the core-import scanner unchanged |
| `.documents/Architecture/source-inventory.md` | EDIT (32 lines) | One labelled U01 Page-source/visibility adoption section: four pinned blobs with sizes and KEEP/ADAPT/REWRITE/DEFER classes, Uno's narrower precedence, refusal proofs, stage handoffs |

## 4. Policy semantics as implemented and tested

**A. Declared-source selection (one already-identified representation).** Input is a finite array of
1–2 plain records carrying exactly `kind` (`json` | `markdown`) and `state` (`absent` | `valid` |
`invalid`), produced by a future trusted adapter after it has confined and read real files. Result is
one selected kind or a bounded refusal — never a Page, path, body, locale, fallback or published flag.

- declared `json` `valid` wins, in either array order, and wins even when Markdown is `invalid`;
- declared `json` `invalid` refuses outright (`invalid-json-source`), even with valid Markdown present;
- valid Markdown answers only when JSON is declared `absent` or is not declared at all;
- zero valid candidates refuse (`no-valid-source`); invalid Markdown alone refuses
  (`invalid-markdown-source`); an `absent` JSON is never reinterpreted as a missing file by this
  policy, and no undeclared source is ever consulted.

**B. Visibility vocabulary.** Input is `{ source, routePath, visibility? }`. JSON defaults to
`public` and may declare `public` or `unlisted`; the reserved root Home (`routePath === HOME_CONTENT_SLUG`)
may be `public` but never `unlisted`; a nested path such as `offers/home` is an ordinary Route.
Markdown is `public` with **no** visibility field at all — even `visibility: "public"` refuses,
because Markdown must not acquire metadata authority it cannot honour. Routes are validated by the
existing `isPageRoutePath`, and `HOME_CONTENT_SLUG` is reused rather than re-declared.

**Refusals proven by the 26 tests:** non-array input, 0 or 3 records, duplicate kind, unknown kind,
wrong casing, unknown state, extra or missing keys, `null`/array/class/date candidates,
accessor fields (getter never invoked), symbol keys, prototype-pollution-shaped records, hostile
prototypes whose `toString`/`valueOf`/`Symbol.toPrimitive` are never called, proxies that throw
(bounded `unreadable-input`, no throw), non-plain visibility input, unknown keys including
`__proto__`, missing required fields, every malformed route (empty, leading/trailing slash, uppercase,
`//`, traversal, percent-encoded, whitespace, backslash, 5 segments, over-length, non-string), and
unknown, wrongly-cased or explicitly `undefined` visibility values. Both functions are deterministic
and provably non-mutating.

**Non-authorisation proven in tests:** the module exposes exactly two functions and three frozen
vocabularies, results carry at most two keys and no URL/header/sitemap/serve/publish/redirect/body
field, an `unlisted` decision on `admin/secret` is only a vocabulary value, and the separate R02
classifier's syntactic acceptance of `/admin/secret` grants no Page existence or permission.

## 5. Provenance, rights and immutable source evidence

| Pinned GEO-03 object | Blob | Bytes | Verified | Class and use |
| --- | --- | ---: | --- | --- |
| `src/core/page-source.ts` | `8071f0a425dcbb5422d25be308ae2135cfd64219` | 12,614 | exact | **ADAPT** — order and fail-closed idea only; site codes, bare-locale lookup and default-locale fallback rejected |
| `src/application/page-source-resolution.ts` | `05060f116a7f2703db42d8e7c10d57bc2e5748ed` | 4,261 | exact | **REWRITE** — provider/resolver separation becomes one pure observation-only policy |
| `tests/unit/page-source-resolution.test.ts` | `ca3abff92116ea9157f00dd355fe5c7eda5da883` | 4,710 | exact | reference categories only; no fixture or test code copied |
| `src/core/page-document.ts` | `a12d964c43626c6313a621bf628f5cc24b65d444` | 45,106 | exact | **DEFER** — Page schema, sections and document fields not adopted; only `public`/`unlisted` and the Home rule |

All four were read as committed immutable objects at `c05c55ea…` through read-only GitHub reads; no
dirty reference worktree was read. No upstream source, fixture, asset, brand, `modules/connect` path
or Solo Rust code entered Uno; no `NOTICE`, `package.json` or lockfile change was made.

## 6. Local verification — rerun on this machine

Node v24.22.1, pnpm 11.6.0, Next 16.4.2, React 19.2.9; frozen lockfile, nothing installed or upgraded.

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | `PASS` — up to date; lockfile unchanged |
| `node scripts/verify-governance-docs.mjs` | `PASS` — frozen bytes match |
| `node --test tests/governance-docs.test.mjs` | `PASS` — 6 / 6 |
| `pnpm test:bootstrap` | `PASS` — 19 / 19, plus 11-file/licence/slot/private-authority screen |
| `pnpm test:architecture` | `PASS` — 11 / 11 |
| `pnpm lint` | `PASS` — exit 0 |
| `pnpm typecheck` | `PASS` — exit 0 |
| `pnpm test` (Vitest) | `PASS` — **144 / 144 = 118 retained + 26 new** |
| `pnpm build` | `PASS` — 3 / 3 static pages, exit 0 |
| `pnpm test:http` (real loopback server) | `PASS` — 21 / 21, placeholder refusals intact |
| Local WSL | `UNVERIFIED` — not attempted; hosted Linux is not relabelled as local |

Nothing was skipped, downscoped, suppressed or made non-blocking. `/` still serves the non-indexable
placeholder: no public Site, no locale route, no sitemap, no canonical or `hreflang`, no analytics.

**Warnings, disclosed:** pnpm prints its cosmetic "update available 11.6.0 → 12.21.0" notice (no
upgrade performed); the two created files and the inventory were normalised to LF, and
`git diff --check` / `git diff --cached --check` were clean at commit time; one blank-line-at-EOF
defect was found and corrected **before** committing. Not observed in this run's captured local
output: Windows Node `DEP0190`, Next "no cache" notices, pnpm v10 shim-layout warning.

## 7. Exact-head hosted verification — product head `6ca5ae6…`

| Workflow | Run | ubuntu-24.04 | windows-2025 | Governance steps | Steps / non-success |
| --- | --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43815646671 | success | success | success (both) | 9 / **0** |
| Verify U01 baseline | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43815646659 | success | success | success (both) | 18 / **0** |

Step conclusions were read for the exact product SHA. **Full job log text is `UNVERIFIED`: the logs
endpoint returned HTTP 403** to this unauthenticated client on all four jobs. No workflow was edited,
rerun, cancelled or retried; hosted green is not offered in place of the local preflight in §2.

## 8. Write boundary, privacy and cleanup

- Product commit `6ca5ae6…`: exactly the four ledger paths (+697/−1), direct parent `17db693…`,
  fast-forward push only. Not touched: `src/app/**`, existing core modules, existing unit tests
  beyond the one architecture line, the 22-capability registry, `package.json`, lockfile,
  `.gitignore`, `.github/**`, `scripts/**`, frozen `AGENTS.md`/`README.md`/SOP, governance files,
  plans, assets or any Foundation/Solo/sibling file.
- This report is the sole content of the single permitted report-only commit and does not predict
  its own SHA.
- The ACTIVE was never staged, copied or published; no private absolute path, credential or personal
  datum appears in any changed file, commit message or this report.
- Scratch was limited to one empty hooks directory under `.temp/uno-wo-009-r01/`, removed after use;
  `node_modules/`, `.next/` and the TypeScript cache stay in ignored Uno build paths; no listener or
  server was left running; parent, Foundation, Solo and siblings stayed read-only.

## 9. Stage status, remaining blockers and requested disposition

The bounded deliverable is **COMPLETE**: one pure, refusal-tested Page-authoring policy (declared
source precedence and visibility vocabulary), its 26 tests, the one-line architecture addition and
the inventory note. That is **not** U01 completion and not a website: no Page exists, no source file
is read, no locale is mapped, no Site is selected, no route is served and nothing is published.

Still owed and explicitly **not** satisfied here: **U02** EFS manifest ownership, cardinality and
property typing; **U03** JSON/Markdown readers with real confinement, locale routing, composed
Page/visibility application, unlisted HTTP and SEO behaviour, Markdown sanitisation, canonical and
`sitemap` handling; **U04** the 22 capability modules and 17-family parity; **U05** provider
adapters. An `unlisted` decision grants no access control and no discovery exclusion by itself.

Formal closed-stage meter remains **1 / 8 (12.5%)**: U00 Owner-closed, **U01 OPEN**, U02–U07 NOT
STARTED. The Agent accepts and closes nothing and asks the Chief Master Architect for one
`ACCEPT` / `REVISE` / `STOP` on this exact bounded order.
