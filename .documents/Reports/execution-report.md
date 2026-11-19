# UNO-WO-046 / R01 — STOPPED (local gates green except two retained HTTP gates)

**Status: STOPPED before any product commit. No product code has been pushed. U04 remains OPEN.**

## 1. Authority

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-046 / R01`, `FINAL — EXECUTE` |
| Private ACTIVE | 29,871 bytes, SHA-256 `9e7eb072472eac458d29cec0d09767acfcee4c9f9f8fa519910892e57fd23fea` — matches the activation, ignored/untracked, never in a ref |
| Start SHA | `cb0edf3974dfa429d8c2da7cbfc484aa49cc6754` at `HEAD`, `main`, `origin/main` |
| Checkout | one checkout, one worktree, one remote, empty index at start |
| Toolchain | Node v26.13.1, pnpm 11.6.0, frozen lockfile unchanged |

## 2. Recovery archive (loss prevention, ignored and local only)

- `.temp/uno-u04-046/recovery/before/` — 26 files: every dirty/untracked authored path plus the prior 9,300-byte report,
  `manifest.tsv` (status, bytes, SHA-256, read-back equality), `dirty.diff` (`git diff --binary`), `status.txt`.
- `.temp/uno-u04-046/recovery/final/` — 5 files edited in this run with `manifest.tsv` and `edited.diff`.
- Nothing was deleted, reset or cleaned. **All pre-existing implementation bytes are preserved in the worktree and in the
  archive.**

## 3. Completed in-ledger repairs

1. **Architecture inventory (was blocker 1).** `tests/architecture/u01-boundaries.test.mjs` now lists the sanctioned
   fixture-transaction importer `scripts/verify-u04-22-module-consent.mjs`. Scanner and both negative boundaries untouched.
   `pnpm test:architecture` → **exit 0**.
2. **Security waiver retired (was blocker 2).** Fresh raw evidence, unfiltered: full graph
   `{info:0, low:0, moderate:1, high:0, critical:0}`, strict production all-zero, `pnpm audit --audit-level high` and
   `--prod --audit-level high` both exit 0. `pnpm-workspace.yaml` now declares only `packages: ["."]` with **no**
   `auditConfig.ignoreGhsas`. `scripts/verify-u04-security-exception.mjs` was converted to an **unwaived** guard (zero
   waiver entries, zero raw HIGH/critical, clean strict production audit, one package, lockfile byte-identity, no
   alternative ignore key, CI commands present and unmuted). Its 22 hermetic cases and
   `tests/deployment/node26-security-floor.test.mjs` were updated to the retired-waiver contract.
   `node scripts/verify-u04-security-exception.mjs` → **ACCEPTED**, exit 0.

**Disclosure, not a repair claim:** the published `GHSA-fc5q-39xc-vjpf` still describes every `picomatch` release through
4.0.7 and no patched release exists. Zero audit detection does **not** prove a fix. One development-only MODERATE
advisory remains in the full graph and is disclosed here.

## 4. Local gate results (actual)

| Gate | Exit | Grade |
| --- | --- | --- |
| `pnpm test:architecture` | 0 | PASS |
| `node --test tests/deployment/u04-security-exception.test.mjs` | 0 | PASS (22 cases) |
| `node scripts/verify-u04-security-exception.mjs` | 0 | PASS (unwaived ACCEPTED) |
| `node --test tests/deployment/node26-security-floor.test.mjs` | 0 | PASS |
| `node scripts/verify-vercel-readiness.mjs` / its test | 0 / 0 | PASS (pre-existing shape) |
| governance docs test + script | 0 / 0 | PASS |
| `u03-fixture-transaction` / `u03-trace` / `u04-json-slice` / `u04-22-module-consent` guard tests | 0 | PASS |
| `pnpm typecheck` / `eslint . --max-warnings 0` | 0 / 0 | PASS |
| `pnpm test` (unit) | 0 | PASS 870/870 in 29 files — see caveat |
| `pnpm build` | 0 | PASS |
| `node scripts/verify-u03-trace.mjs --expect committed` | 0 | PASS |
| `node scripts/verify-u04-json-slice.mjs` | 0 | PASS 464/464 |
| `node scripts/verify-u04-22-module-consent.mjs` | 0 | PASS 130/130 (22 IDs, 4 providers, consent boundary) |
| `pnpm test:bootstrap` | 0 | PASS |
| `node scripts/verify-u03-published-http.mjs` | 0 | PASS |
| `pnpm test:http` (`verify-u01-http`) | **1** | **FAIL — 101 pass, 2 fail** |
| `node scripts/verify-u03-http.mjs` | **1** | **FAIL — 87 pass, 4 fail** |

Both fixture runners restored `deployment/efs/manifest.json` to `ba232d46…` and `deployment/uno.config.json` to
`4f656c93…`; `git status --porcelain -- deployment` is empty and zero `wo04*` fixture files remain.

**Unit-suite caveat (truthful):** bare `pnpm test` now also collects the duplicated test files inside the mandated
recovery archive under `.temp/uno-u04-046/recovery/before/tests/unit/`, failing three of them on unresolved imports. The
scoped equivalent `pnpm exec vitest run tests/unit --exclude '**/.temp/**'` exits 0 with 870/870 in 29 files. The
archive is ignored and never pushed, so hosted CI is unaffected.

## 5. The blocker that stopped this order

The two retained HTTP gates assert that the demonstration route is **not publicly reachable**: `/en` must return 404.
Against the new renderer `/en` returns **307 → `/en-001`**, which returns **200** and carries a canonical link. Either the
uncommitted product code has widened publication visibility, or the retained gate is stale. Those are opposite remedies
and the distinction is a publication-boundary/security decision, not a mechanical fix. I did not edit a retained gate to
make the failure disappear, and I did not push a product commit whose own retained gates fail.

## 6. Not delivered in this run

§3.4 bounded four-zone owned-media HTTP smoke/refusal evidence; §3.5 new blocking 22-module browser steps on
`ubuntu-24.04` and `windows-2025` plus the matching `verify-vercel-readiness` negative tests; the product commit
`feat(uno): land 22-module renderers and governed video (WO-046)`; all hosted CI evidence. No commit, push or deployment
of product code occurred, so **no Git-triggered Vercel side effect** was produced by this run.

## 7. Remaining obligations

Adjudicate the `/en` publication expectation; then add §3.4 four-zone smoke and §3.5 blocking CI steps, rerun the full
battery, and land the product commit. Still outstanding afterwards: exhaustive four-zone negative/fault matrix, native
video range/VTT/poster, viewport/motion matrix, the 17 Foundation-family compositions (**0/17**), installation shell, and
U04 closure. 22/22 module renderers exist locally but are **not** published to GitHub by this run.

**Requested disposition: STOP / REVISE** with a scoped decision on the `/en` visibility expectation. No self-acceptance.