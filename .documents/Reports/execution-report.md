# UNO-WO-007 / R01 — A1 capability vocabulary and ledger reconciliation

**Order:** `UNO-WO-007 / R01` (FINAL — EXECUTE) · **Executed:** 2026-11-16
**Starting `main`:** `606f0771a97c50899467afb0e2be18ae8b02cad7`
**Product commit:** `09511614c2f685d365ed6df195e49be2b0c3c9df`
**Stage:** U01 — bounded product slice · **U01 remains OPEN** · **no stage closure, release or deployment**
**Role:** Implementation Agent · **Disposition requested:** Chief Master Architect review

Paths are symbolic; no private absolute path, ACTIVE byte, credential or personal datum appears
below. Canonical Drive records were not edited.

## 1. Authority actually verified

| Item | Observed |
| --- | --- |
| Private ACTIVE slot | regular, ignored, untracked, unstaged, `.documents/WIP/workorder-active.md`, no root alternative, no duplicate order |
| Installed order | `UNO-WO-007 / R01`, **21,620 bytes**, SHA-256 `BE002669000331174EBD6E0EEBCB675E641F808F272DCA34B7E8324582597DE6` — exact match to the Owner activation |
| Prior orders | `UNO-WO-006 / R03` accepted within verification scope; `UNO-WO-006 / R02` a procedural STOP. Neither was treated as a precondition, and no spent ACTIVE was required to remain in the slot |
| Read before acting | repository `AGENTS.md`, local SOP, three `plan-*.md` slots, the previous report, this order |

**Drive limitation, stated plainly:** this agent has no Drive access and did **not** read
`BLUEPRINT.md`. The 22 approved IDs used here are taken from this order's own §3 restatement of
`BLUEPRINT.md` §5, which is the operative authority supplied to the agent. No claim to have read
the canonical Drive is made.

## 2. Read-only preflight (before any write)

| Check | Result |
| --- | --- |
| Physical Uno root resolved; no symlink, junction or reparse escape; ancestors contained | `PASS` |
| Exactly one Git checkout/worktree; branch `main`; clean index and worktree | `PASS` |
| Exactly one remote `origin` → `provelopment/provelopment-foundation-uno` only | `PASS` |
| Local `HEAD` = local `main` = remote `refs/heads/main` = `606f077…` | `PASS` |
| No merge, rebase, bisect, cherry-pick or index lock | `PASS` |
| Parent workspace anchored `/00.foundation-uno/` guard; parent HEAD `e17fd960…` unchanged, read-only | `PASS` |
| Local Foundation template HEAD `8789a450…`; file names only, no dirty contents read or written | `PASS` |
| Frozen governance bytes unchanged; `verify-governance-docs.mjs` `PASS` | `PASS` |
## 3. What was delivered — four authorized paths only

| Path | Operation | Content |
| --- | --- | --- |
| `src/core/modules/capability-registry.ts` | CREATE | Pure, import-free, frozen registry: the 22 approved A1 IDs in groups 4 / 8 / 4 / 2 / 4, a `Set`-backed membership guard, a single-owner group lookup, and a separate immutable list of the 17 observed Foundation families |
| `tests/unit/capability-registry.test.ts` | CREATE | 14 Vitest cases: exact vocabulary, counts, uniqueness, freezing, membership and refusals |
| `tests/architecture/u01-boundaries.test.mjs` | EDIT (1 line) | Added only the new core file to the hard-coded authored-inventory list; every prior assertion retained |
| `.documents/Architecture/source-inventory.md` | EDIT (62 lines) | Old provisional 22 descriptions marked superseded; exact binding ID table added; registry-only versus renderer support classified; 17-family candidate-ID/gap matrix added with stages, owners and pending proofs |

**Contract behaviour.** `isCapabilityId(value: unknown)` is a real type guard: it refuses a
non-string before any lookup, so no value is coerced and an object carrying `toString` or
`Symbol.toPrimitive` is never read as an ID. `capabilityGroupFor` returns exactly one group or
`undefined`; it never derives a group by splitting an unregistered string, and no near-miss is
repaired. Groups and lists are frozen against runtime mutation. The 22 IDs and the 17 family
names occupy **different namespaces**: `contactForm` is not `interaction.contact` and carries no
delivery, provider or authorization meaning.

**Refusal coverage proven** (all `false` / `undefined`): unknown and invented IDs; case variants;
bare family names (`hero`, …); category-only and malformed strings (`layout.`, `.stack`,
`layout..stack`, `layout stack`, `layout/stack`); near-matches (`interaction.contactForm`,
`content.table`); prototype-looking keys (`constructor`, `__proto__`, `prototype`, `toString`,
`valueOf`, `hasOwnProperty`); blank and whitespace-only values; non-strings including `null`,
`undefined`, numbers, booleans, arrays, objects, `Symbol` and `bigint`; hostile objects, with
zero `toString`/`Symbol.toPrimitive` calls asserted.

## 4. Source, rights and provenance proof

| Pinned Foundation object | Blob at GEO-03 `c05c55ea…` | Bytes |
| --- | --- | ---: |
| `src/core/page-document.ts` (`PAGE_SECTION_TYPES`) | `a12d964c43626c6313a621bf628f5cc24b65d444` | 45,106 |
| `src/components/site/page-document-content.tsx` | `fc35a52d6cfc5f114e50470e8286a89916cde801` | 8,280 |

Both blob identities were confirmed read-only through authenticated GitHub reads before the family
list was written. **No external source byte was copied:** the registry imports nothing, contains no
Foundation code, asset, brand, `modules/connect` path, Solo Rust code or provider integration, and
no generated, licensed or third-party material entered the repository. The 17 families are recorded
as obligations with explicit gaps, never as parity.

**Known, recorded gaps (unchanged by this order).** `callout`, `cards`, `features`, `quote`,
`table`, `list` and `divider` have no approved A1 ID and remain explicit gaps rather than invented
IDs; `media`-and-text composition, `columns` ratios, `steps` item caps and FAQ-versus-disclosure
semantics are recorded fidelity gaps. All 17 rows are `UNIMPLEMENTED` for renderer parity, owned by
U04, with `contactForm` delivery at U05.
## 5. Local verification — rerun on this machine

Node 24.x, pnpm 11.6.0, existing frozen lock, no global install and no package added.

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | up to date; lockfile unchanged |
| `node scripts/verify-governance-docs.mjs` | `PASS` — frozen bytes match |
| `node --test tests/governance-docs.test.mjs` | 6 / 6 pass |
| `pnpm test:bootstrap` | 19 / 19 pass |
| `pnpm test:architecture` | 11 / 11 pass |
| `pnpm lint` | clean, exit 0 |
| `pnpm typecheck` | clean, exit 0 |
| `pnpm test` (Vitest) | **91 / 91 pass = 77 pre-existing + 14 new** |
| `pnpm build` | success, 3 / 3 static pages, exit 0 |
| `pnpm test:http` (real loopback production server) | 21 / 21 pass, exit 0 |

No gate was skipped, weakened or reclassified, and no hosted job is reported as a local run.
`/` still serves the non-indexable technical placeholder with unchanged refusals (`/en`, `/about`,
`/robots.txt`, `/sitemap.xml` → 404; no `hreflang`, canonical, sitemap or analytics markup).

**Warnings, disclosed rather than waived:** pnpm prints a cosmetic "update available 11.6.0 → 12.21.0"
notice (no upgrade performed); the four edited files were normalised to LF per `.gitattributes` and
the staged blobs were proven byte-identical before and after that normalisation.

## 6. Exact-head hosted verification — product commit `0951161…`

| Workflow | Run | ubuntu-24.04 | windows-2025 | Governance step |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43807688044 | success | success | success (both) |
| Verify U01 baseline | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43807688047 | success | success | success (both) |

Step-level conclusions were read from the GitHub API for the exact head SHA; both jobs have zero
non-success steps (9 and 18 steps). Full job log text was **not** read in this run — unauthenticated
log access returns 403 — so log-internal warning text is `UNVERIFIED` here while the step outcomes
are `PASS`. No Action was rerun, cancelled or mutated.

## 7. Write boundary, privacy and cleanup

- Product commit `0951161…`: exactly the four authorized paths, 513 insertions, 1 deletion, direct
  parent `606f077…`, fast-forward push only. No other tracked path, no `src/app/**`, no workflow,
  `package.json`, lockfile, `.gitignore`, bootstrap script or frozen governance file changed.
- This report is the sole content of the single permitted report-only commit; it is not duplicated
  or archived, and it does not assert its own SHA.
- The private ACTIVE was never staged, rewritten or published; no private absolute path, secret,
  ACTIVE byte or personal datum appears in any changed file.
- Scratch use was limited to one empty hooks directory under `.temp/uno-wo-007-r01/`, removed after
  use. Parent workspace, Foundation template, Solo and all siblings were read-only throughout.

## 8. Stage status and requested disposition

This order's bounded deliverable — the capability vocabulary, its refusal tests and the reconciled
ledger — is **COMPLETE**. That is **not** U01 completion and not a website: there is no renderer, no
authored props or envelope schema, no composer, no EFS manifest, no public route, no locale HTTP
behaviour and no publication. Twenty-two registered *names* are not 22 executable modules. The
formal closed-stage meter remains **1 / 8**: U00 Owner-closed, **U01 OPEN**, U02–U07 NOT STARTED.

The canonical Drive's seven governance documents remain **unconsolidated**; that Owner-directed
blocker still precedes any further product work.

The Agent does not accept or close anything: the Chief Master Architect is asked for
`ACCEPT` / `REVISE` / `STOP` on this order only.
