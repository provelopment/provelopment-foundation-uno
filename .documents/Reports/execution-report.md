# UNO-WO-010 / R01 — injected-observer Page-source resolution seam

**Order / edition:** `UNO-WO-010 / R01` (FINAL — EXECUTE) · **Executed:** 2026-11-16
**Private ACTIVE:** `.documents/WIP/workorder-active.md`, SHA-256 `0d0cc9c3fa943bfe7ef0e1aecc473323b9480d62959b94019ea7cf6473787bcd` (content withheld)
**Starting Uno `main`:** `2e50e45913241f1f8513633f2376782e906f9aca` · **Product head:** `6b948e318d939f4153f5928a9acf553e02536a54`
**Stage:** U01 — one bounded application/ports increment · **U01 remains OPEN**
**Disposition requested:** Chief Master Architect `ACCEPT / REVISE / STOP`

Paths are symbolic; no private absolute path, credential, ACTIVE byte or personal datum appears here
or in any committed file.

## 1. Authority verified

| Item | Observed |
| --- | --- |
| ACTIVE slot | one regular, non-symlink file at the single private slot; ignored by the repository, untracked, unstaged; no root-level alternative or duplicate |
| ACTIVE identity | SHA-256 `0d0cc9c3…7bcd`, matching the separate Owner activation; length, line endings, absent BOM and terminating newline checked without exposing content |
| Order edition | `UNO-WO-010 / R01`; the superseded order slot was replaced directly, which this order permits |
| Read before writing | `AGENTS.md`, local SOP, all three `plan-*.md` slots, the prior single report, the source inventory, current `src/core/**` and `src/application/**`, and this exact ACTIVE |
| Progress authority | Uno GitHub only: source, inventory, commit history, one execution report, exact-head Actions. No Drive access was made or claimed |

## 2. Read-only preflight (before any write)

| Check | Result |
| --- | --- |
| Physical Uno root; no junction, symlink or reparse escape; `git rev-parse --show-toplevel` names it exactly | `PASS` |
| Exactly one worktree, branch `main`, clean index and worktree, no merge/rebase/cherry-pick/bisect/lock | `PASS` |
| Exactly one remote, `origin` → `provelopment/provelopment-foundation-uno`; no alternate remote | `PASS` |
| Local `HEAD` = local `main` = remote `refs/heads/main` = `2e50e45…` | `PASS` |
| Parent workspace anchored `/00.foundation-uno/` ignore rule effective; parent tracks no Uno path; parent `e17fd960…` unchanged | `PASS` |
| Foundation template `8789a45…` and Solo read-only and untouched by this run | `PASS` |
| Frozen governance bytes match; `verify-governance-docs.mjs` `PASS` | `PASS` |
| Pinned GEO-03 objects re-verified read-only on GitHub before use | `PASS` |

The required starting commit matched exactly, so no STOP condition was engaged.

## 3. Delivered — closed ledger, four product paths plus one report

| # | Path | Operation | Content |
| --- | --- | --- | --- |
| 1 | `src/application/resolve-declared-page-source.ts` | CREATE | The use case plus injected observer port types. Imports only `../core/page-authoring-policy`; no adapter, framework, Node I/O or provider |
| 2 | `tests/unit/resolve-declared-page-source.test.ts` | CREATE | 23 named Vitest cases: invocation counts and order, fail-closed JSON, pass-through identity, hostile ports and observations, core integration |
| 3 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | Added `APPLICATION_FORBIDDEN_MODULES`, an application specifier check, an `src/application/**` scan branch, `src/application` in the real inspected tree, and one synthetic negative test. Every prior check, fixture and the core scanner meaning preserved (11 → 12 tests) |
| 4 | `.documents/Architecture/source-inventory.md` | EDIT | One appended, labelled U01 application-resolution entry: four pins with sizes and classes, semantics, exclusions, stage handoff |
| 5 | `.documents/Reports/execution-report.md` | OVERWRITE | This single report |

Product commit `6b948e3…`: exactly paths 1–4, +933/−3, direct parent `2e50e45…`. This report alone
forms the separate single-path report-only commit; its own SHA is deliberately not predicted here.

## 4. Contract as implemented and proven

**Ports.** `input` is one or two plain records with exactly the own data fields `kind` and `observe`;
`kind` is exactly `json` or `markdown` and unique; `observe` is a caller-supplied function. The whole
collection is validated as data **before any observer runs**, so accessors, symbol keys, exotic
prototypes, duplicates, casing variants, extra or missing keys and non-functions can never execute
caller code — proven by counters that stay at zero. A hostile collection or proxy trap yields a bounded
`invalid-input` instead of an exception.

**Observations.** Each observation is a plain record: exactly `state`, plus exactly one `source` for
`valid`. `valid` with a missing, `undefined` or `null` body refuses `invalid-observation`; `absent` or
`invalid` carrying a body refuses too. A malformed observation is never read as an absence.

**Order (the material invariant).**

1. A declared JSON observer is invoked once. A throw, a rejected promise or a malformed observation
   refuses `observer-failed` / `invalid-observation` and Markdown is **never** consulted.
2. An `invalid` JSON observation refuses with the core's own `invalid-json-source`, even when valid
   Markdown exists, in either declaration order.
3. A `valid` JSON observation is confirmed through `selectDeclaredPageSource` and returned with the
   caller's exact source object by reference; Markdown is not invoked.
4. Only a declared-and-`absent` JSON (or no JSON declaration) lets the declared Markdown observer run,
   once, after which the core confirms the selection from the actually observed states.
5. Otherwise the core supplies the bounded refusal (`no-valid-source`, `invalid-markdown-source`).

**Bounded refusals:** `invalid-input`, `invalid-observer`, `invalid-observation`, `observer-failed`, plus
these exact core reasons: `invalid-json-source`, `invalid-markdown-source`, `no-valid-source`. A refusal
has exactly `accepted` and `reason`; an acceptance has exactly `accepted`, `kind`, `source`. No thrown
message, path, URL, locale, visibility or candidate value ever appears in a refusal.

## 5. Dependency evidence — one decision authority, not a copy

The use case imports `selectDeclaredPageSource` and core types only, and calls the policy in the
accepted, the invalid and the empty cases alike, so precedence and refusal wording cannot drift. The
integration test compares the use case's refusal strings with `selectDeclaredPageSource`'s answer for
`invalid` JSON, `invalid` Markdown and an absent JSON: a core change to its refusal fails this test
rather than letting divergent logic pass. The architecture test now also refuses any `src/application`
import of a framework, Node filesystem/process/network module, adapter, `src/app` or deployment path,
and inspects the real `src/application` tree rather than a declared list.

## 6. Provenance, rights and pins

| Pinned GEO-03 object | Blob | Bytes | Class and use |
| --- | --- | ---: | --- |
| `src/application/page-source-resolution.ts` | `05060f116a7f2703db42d8e7c10d57bc2e5748ed` | 4,261 | **REWRITE** — precedence-versus-reader separation only; providers, locale fallback and Site codes rejected |
| `src/core/page-source.ts` | `8071f0a425dcbb5422d25be308ae2135cfd64219` | 12,614 | **ADAPT** — declared JSON-before-Markdown order only |
| `tests/unit/page-source-resolution.test.ts` | `ca3abff92116ea9157f00dd355fe5c7eda5da883` | 4,710 | reference for test *categories* only; no code or fixture copied |
| Uno `src/core/page-authoring-policy.ts` at `2e50e45` | `b9ddbee09eb776d034038dca09cad48680939512` | 12,483 | **KEEP unchanged** — still the single authority |

All four were read as committed immutable objects at `c05c55ea…` through read-only GitHub reads; no
dirty reference worktree was read. No upstream source, test, fixture, brand, licensed asset, Connect
module or Solo Rust code entered Uno. No `NOTICE`, `package.json`, lockfile, workflow or governance
change was made and no new dependency was added.

## 7. Local verification — this machine

Node v24.22.1, pnpm 11.6.0, Next 16.4.2, React 19.2.9; frozen lockfile, nothing installed or upgraded.

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | `PASS` — up to date; lockfile unchanged |
| `node scripts/verify-governance-docs.mjs` | `PASS` |
| `node --test tests/governance-docs.test.mjs` | `PASS` — 6 / 6 |
| `pnpm test:bootstrap` | `PASS` — 19 / 19 plus the 11-file/licence/slot/private-authority screen |
| `pnpm test:architecture` | `PASS` — 12 / 12 (11 prior + 1 new application negative) |
| `pnpm lint` | `PASS` — exit 0 |
| `pnpm typecheck` | `PASS` — exit 0 |
| `pnpm test` (Vitest) | `PASS` — **167 / 167 = 144 retained + 23 new** |
| `pnpm build` | `PASS` — 3 / 3 static pages, exit 0 |
| `pnpm test:http` | `PASS` — 21 / 21 against a real loopback server |
| Local WSL | `UNVERIFIED` — not attempted; hosted Linux is not relabelled as local |

Nothing was skipped, downscoped, silenced or made non-blocking. `/` still serves the non-indexable
placeholder: no Site, locale route, manifest, sitemap, canonical or analytics exists.

**Warnings and refusals, disclosed.** pnpm prints a cosmetic "update available 11.6.0 → 12.21.0"
notice (no upgrade performed). The two new files were normalised to LF and one trailing blank line was
removed before committing; `git diff --check` and `git diff --cached --check` were clean at commit time.
Not observed here: Windows Node `DEP0190`, Next "no cache" notices, pnpm v10 shim-layout warnings.

## 8. Exact-head hosted verification — product head `6b948e3…`

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43818431638 | success | success | 9 / **0** |
| Verify U01 baseline | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43818431646 | success | success | 18 / **0** |

Step conclusions were read for the exact product SHA. **Full job log text is `UNVERIFIED`: the logs
endpoint returned HTTP 403** to this unauthenticated client on all four jobs, so no log line is claimed.
No workflow was edited, rerun, cancelled or retried; step-level greens never substitute for the local
gates above.

## 9. Write boundary, privacy and cleanup

- Only paths 1–4 entered the product commit; the report is the sole content of the report-only commit.
  Not touched: `src/core/**` (including the unchanged policy), `src/app/**`, `deployment/**`, `public/**`,
  `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `scripts/**`, `.github/**`, plan slots, frozen
  governance documents, governance hash/tests or any Foundation/Solo/sibling file.
- The ACTIVE was never staged, copied or published, and no private path, credential or datum appears in
  any changed file, commit message or this report.
- Scratch was one empty hooks directory under `.temp/uno-wo-010-r01/`, removed after use; build output
  stayed in ignored Uno paths; no listener or server was left running.

## 10. Stage status and requested disposition

**COMPLETE for this order only.** The delivered seam is real executable orchestration over trusted
injected ports — not another registry — with the core policy imported rather than duplicated, fail-closed
preferred JSON, byte-identical pass-through of the caller's opaque source, and bounded refusals.

Still **not** delivered and not implied: any EFS manifest or schema, source ownership, filesystem
confinement, JSON/Markdown reader or sanitiser, Page envelope or module prop, locale mapping, Site
selection, URL, route, metadata, sitemap, redirect, unlisted discoverability or publication decision.
U02 (manifest and cardinality), U03 (readers, locale routing, visibility/serving behaviour, SEO,
sanitisation), U04 (22 modules, 17-family parity) and U05 (provider adapters) remain open.

Formal closed-stage meter stays **1 / 8 (12.5%)**: U00 Owner-closed, **U01 OPEN**, U02–U07 NOT STARTED.
The Agent closes nothing, accepts nothing and requests one `ACCEPT` / `REVISE` / `STOP` from the Chief
Master Architect on this exact bounded order.
