# UNO-WO-047 / R01 — 22-module implementation landed; both hosts green

**Status: COMPLETE for the 22-ID product-landing milestone. U04 remains OPEN.**

## 1. Authority and physical facts

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-047 / R01`, `FINAL — EXECUTE` |
| Private ACTIVE | 28,449 bytes, SHA-256 `459069cb8ff74cf278093728d8d196a3ba4112d1efc19a296676b7812e89f516` — matches the activation; ignored, untracked, absent from every ref |
| Starting `main` | `091961b6efe590f3328661639599e62552c7c466` at `HEAD`, `main`, `origin/main`, `ls-remote` |
| Checkout | one checkout, one worktree, one branch `main`, one `origin` (`provelopment/provelopment-foundation-uno`), no stash |
| **Product SHA** | **`06599fe7b7c951462a87b9ac75e7b1a705f1254c`** (`feat(uno): land 22-module renderers and governed video (WO-047)`) |
| Report SHA | recorded by this commit; parent is the product SHA |
| Final `git status` | **0 entries** (tracked and untracked) |

## 2. The `/en` publication boundary — resolved, not weakened

The committed authority is unpublished: `deployment/uno.config.json` carries `languagePreferences: {"en":"en-001"}` with **no**
canonical base, and `deployment/efs/manifest.json` holds no published Home. Measured behaviour:

1. Declarations byte-exact (`manifest` `ba232d46…`, `config` `4f656c93…`), deployment tree clean, zero `wo04*` residue.
2. `pnpm build` from those committed bytes, then **pre-fixture baseline**: `verify-u01-http` 103/103 and
   `verify-u03-http` 91/91, both exit 0, with `/en returns 404`.
3. Both fixture suites then ran serially: 464/464 and 130/130.
4. Declarations restored byte-exact; committed output rebuilt; **post-fixture** the same two gates were green again
   (103/103, 91/91).

Root cause of the WO-046 failure: **stale fixture-built `.next`**, not an implementation redirect. The negative gates had
been run against a build produced while a published fixture was installed. No retained gate was edited, weakened,
skipped or marked N/A; `/en` is a genuine 404 under the committed unpublished configuration. Under an explicitly
published fixture the alias still resolves only to the accepted, `public` canonical Home; every other case returns
nothing.

## 3. Security posture — waiver retired, unwaived guard green on both hosts

| Evidence | Result |
| --- | --- |
| Unfiltered full graph (`pnpm audit --json`) | 1 MODERATE (dev-only), **0 HIGH, 0 CRITICAL** |
| `pnpm audit --audit-level high` | exit 0 |
| `pnpm audit --prod --json` / `--prod --audit-level high` | all-zero / exit 0 |
| `pnpm why picomatch` | dev-only tooling path, absent from `dependencies` |
| `node scripts/verify-u04-security-exception.mjs` | **ACCEPTED**, exit 0 — zero waivers |

`pnpm-workspace.yaml` now declares only `packages: ["."]`; the `GHSA-fc5q-39xc-vjpf` `ignoreGhsas` entry is removed. The
guard enforces zero waiver entries (including alternative ignore keys and leftover expiry), zero raw HIGH/critical on
the unfiltered graph, a clean strict production audit, one root package, lockfile byte-identity and unmuted CI steps;
22 hermetic cases plus `node26-security-floor` were aligned to the retired-waiver contract.

**Disclosure, not a repair claim:** the official advisory still describes every `picomatch` release through 4.0.7 and no
patched release exists. Zero audit detection does **not** prove a fixed package; the residual development-only code risk
is disclosed here. Any resurfacing HIGH or critical is blocking with no waiver available.

## 4. Local verification (actual)

PASS (exit 0): `pnpm typecheck`, `eslint . --max-warnings 0`, `pnpm test:architecture`, security guard + 22 cases,
`node26-security-floor`, governance docs test + script, `u03-fixture-transaction`, `u03-trace` test,
`u04-json-slice` guard, `u04-22-module-consent` guard, `pnpm test:bootstrap`, `pnpm test` (**870/870, 29 files, bare
command, no exclusion**), `pnpm build`, `verify-u03-trace --expect committed`, `verify-vercel-readiness` + its tests,
`verify-u03-published-http`, `verify-u04-json-slice` (**464/464**), `verify-u04-22-module-consent` (**130/130**),
`verify-u01-http` (**103/103**) and `verify-u03-http` (**91/91**) both before and after the fixtures.

Recovery hygiene: `.temp/uno-u04-046` source-shaped duplicates were repacked into 25 opaque `.bin` payloads under
`.temp/uno-u04-047/recovery/` with a hash manifest; all 23 were read back byte-identical before the duplicate copies
were removed, so bare `pnpm test` no longer discovers archive files. Both archives are ignored and local only.

## 5. Hosted CI at the product head `06599fe`

| Workflow | Run | Result |
| --- | --- | --- |
| Uno Bootstrap Verify | `44634505110` | **success** |
| Verify U01 baseline | `44634505480` | **success** |

Both jobs — `verify (ubuntu-24.04)` `135949433047` and `verify (windows-2025)` `135949433581` — are **success**, and on each
host these steps individually succeeded: the repaired dependency-advisory guard, architecture boundaries, unit tests,
production HTTP (English demonstration, i.e. `/en` 404), U03 locale refusals, the 464-check JSON slice, the **new
22-module hermetic guard**, and the **new 22-module / four-provider consent gate over real production HTTP and
Chromium**. No step is muted, skipped or `continue-on-error`.

## 6. Not delivered in this order (explicit)

1. **Four-zone owned-media HTTP smoke/refusal** inside the 22-module runner (§3.4-equivalent): not implemented. The owned
   media policy, reader, route and unit suites are landed, but the bounded four-zone HTTP 200/magic-MIME plus
   wrong-Page/signature/traversal refusals are **not yet proved**.
2. **Readiness refusal tests** for the two new steps: `verify-vercel-readiness` accepts the workflow as-is, but it does
   not yet *refuse* removal/muting of the two new steps, and no new negative mutation tests were added.
3. No provider playback is claimed: provider frames and requests are intercepted locally.

## 7. Remaining U04 obligations

Bounded four-zone media smoke and the exhaustive four-zone fault matrix; native video range/VTT/poster; the wider
viewport/motion matrix; the **17 Foundation-family compositions (0/17)**; installation/presentation shell; readiness
refusal coverage for the new gates; `media.map` (23rd module) and optional location/sensor adapters under a separate
authorized order. U04 remains OPEN; no release, tag, merge, manual deployment, provider change or Drive edit was made.

**Requested disposition: ACCEPT / REVISE / STOP.** No self-acceptance is claimed.