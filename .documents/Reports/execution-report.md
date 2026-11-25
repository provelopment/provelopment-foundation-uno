# Execution Report — UNO-WO-115 / R02

**Outcome: COMPLETE — concurrent publication governance corrected, every obsolete README truth gate replaced with durable enforceable rules, all mandatory local gates green, B1 preserved at `8/17` and `50/59`.**

| | |
| --- | --- |
| Order | `UNO-WO-115 / R02`, `FINAL — EXECUTE` (supersedes R01) |
| ACTIVE | **4,328 bytes**, SHA-256 `38c6248c610bbbb89f87bda789cbf51760e219f1c3536b931441154feac39e2b` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `84155b8e3e1bcba6a1f3aa7514003a8db8b24848` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`) |
| R01 preservation | the five delivered R01 modifications were present, unstaged and byte-identical to the R01 report before any edit (`AGENTS.md` `e7ff1d7f…`, `README.md` `e6995a84…`, SOP `6c20beb7…`, plus the gate literals and the extended governance tests) |
| B1 baseline | `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, `U04_MODULE_IDS=22/22`, `U04_ASSET_ZONES=4/4`, `U04_BROWSER_MATRIX=16/16`; three-Site P6 PASS with both phases byte-exact |

## 1. Authorized changes

Nine paths, no others. `git diff --stat` before the report overwrite: 8 files, 320 insertions, 43 deletions.

| Path | Bytes / cap | Final SHA-256 |
| --- | --- | --- |
| `AGENTS.md` | 3,164 / 3,200 | `e7ff1d7fcb555f8b2ac2cda3b7ea0267aab70f0e779436f415503141ae44185d` |
| `README.md` | 2,961 / 3,200 | `035eb96c2a12adb8143790cff775d73bbc5cb53b668db2c63aaf5998a8374322` |
| `.documents/SOP/sop-implementation.md` | 5,438 / 6,000 | `6c20beb768294c3b12de63a34a5dd998e3d4d4b2d039ed945093e258b262cc2d` |

- **Governance contract (preserved from R01, unchanged by R02).** `AGENTS.md`, `README.md` and the SOP state one Entity per
  Installation; one or more concurrently active Facets, Sites per Facet, Pages per Site and explicitly authored full-locale
  representations per Page; every valid Site may publish independently through its validated Facet/Site host and/or path
  binding; an optional explicit default is an entry preference and never an exclusive publisher; no arbitrary hierarchy or
  language ceiling; resource, ownership and collision guards mandatory; no Hub/Spoke or second Entity. `AGENTS.md` adds the
  STOP/preserve rule for an unexplained mid-run external change, and SOP §3 requires STOP with no unauthorized restoration.
  Rights, authority and freeze boundaries are untouched in all three files.
- **`README.md` (only necessary wording adjustment).** Progress authority is current `main` plus the sole execution report,
  with no fixed stage, head or implementation-status assertion; the durable disclaimer now reads that a technical baseline,
  valid declaration or passing test *does not establish a published website and does not authorize release or deployment*.
  Mission, rights, toolchain, development commands and the exact-hash sentence are unchanged.
- **`scripts/verify-bootstrap.mjs`.** The obsolete `not implemented yet` requirement is replaced by one exported durable rule
  list, `README_TRUTH_RULES` + `README_TRUTH_ISSUES` + `OBSOLETE_README_CLAIMS`: baseline, progress-authority repository,
  current `main`, sole report link, publication disclaimer, release/deployment disclaimer, refusal of a published-website
  claim, refusal of a pinned commit, and refusal of seven superseded claims. Every other check — required files, licence,
  AGENTS anchors, `.gitignore` screening, Hub/Spoke trees, credential and private-path scanning, four-slot WIP discipline —
  is untouched.
- **`tests/bootstrap.test.mjs`.** The valid fixture now carries only durable truth; new mutation-sensitive tests refuse a
  removed publication disclaimer, a removed release disclaimer, a missing report link, a missing current `main`, a missing
  progress-authority repository and a missing baseline (asserted rule by rule), plus seven reappearances: obsolete stage
  wording, `projected Page header`, `exactly one public Site`, `U01 remains open`, a published-website claim and a pinned
  commit. The credential and private-path fixtures now isolate exactly one defect each.
- **`tests/architecture/u01-boundaries.test.mjs`.** Its private copy of the README rules is deleted: the gate imports the one
  exported list, so bootstrap and architecture cannot drift. The verbatim A1-sentence assertion is replaced by the shared
  rule check plus an explicit absence assertion, and thirteen mutations are refused, including removed disclaimers, missing
  progress references, unsupported publication claims and reintroduced obsolete wording. All non-README architecture checks
  and the privacy assertions are unchanged.
- **`scripts/verify-governance-docs.mjs`.** Only the three digest literals; byte caps (3,200 / 3,200 / 6,000), validation
  logic and both hosted workflows are unchanged.
- **`tests/governance-docs.test.mjs`.** Eight original tests plus four added in R01: three-file hash/cap/content agreement
  with the approved contract, a byte flip in each file refused as `SHA-256` and never as a cap, a stale single-public-Site
  rewrite of each file refused by content and hash, and the three prior approved digests proven superseded.

## 2. Local verification (all executed in this run, in this order)

| Gate | Result |
| --- | --- |
| `node --test tests/governance-docs.test.mjs` | **13 passed / 0 failed** |
| `node scripts/verify-governance-docs.mjs` | **PASS** — all three frozen files match the approved bytes |
| `node --test tests/bootstrap.test.mjs` (focused, first) | **21 passed / 0 failed**, including `the real Uno root passes the same validation` |
| `node --test tests/architecture/u01-boundaries.test.mjs` (focused, first) | **47 passed / 0 failed** |
| `pnpm test:bootstrap` (bootstrap tests + validator) | **green**, validator reports `OK - 11 required files present, licence verified, four-slot WIP discipline intact, private authority screened, no Hub/Spoke data, no credential or private-path leaks` |
| `pnpm test:architecture` | **green** — full suite, no README rule duplicated |
| `pnpm lint` / `pnpm typecheck` | exit 0 / exit 0 |
| `pnpm test` (unit) | **1,313 / 1,313**, 35 files |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node --test tests/deployment` | **342 passed / 0 failed** |
| `verify-u04-22-module-consent.mjs` (build + start + Chromium) | **838 passed / 0 failed** — `PARITY_STEPS=PASS`, `U04_PARITY=8/17`, `U04_PROXY=50/59`, `U04_MODULE_IDS=22/22`, `U04_ASSET_ZONES=4/4`, `U04_BROWSER_MATRIX=16/16` |
| `verify-u03-multisite-http.mjs` (three Sites, both phases) | **179 passed / 0 failed** — `phase one verified byte-exactly · phase two verified byte-exactly` |

No mandatory gate was skipped, softened or made non-blocking; no `continue-on-error`, workflow, dependency or product change
was made. Refusal evidence is mutation-based, not assert-free: every rule above is proven by a deliberately broken input in
the same run.

## 3. Guard integrity

- **Exact-byte protection intact.** The three frozen files are still checked by SHA-256 with unchanged caps; the gate script
  differs only in its three digest literals; both hosted workflows still invoke it and were not modified (`.github/**` shows
  no change in `git status`).
- **Previous bytes refused.** The governance tests assert each final digest differs from the prior approved value, so the
  superseded bytes can never pass again even if someone restores them.
- **Single rule source.** The architecture gate no longer re-states README rules; it imports `README_TRUTH_ISSUES`, removing
  the drift that R01 exposed. `README_TRUTH_ISSUES` returns both a machine label and an operator message, and bootstrap maps
  every violation to a named issue.
- **Privacy and authority.** Credential patterns, private-path patterns, `.gitignore` screening, four-slot WIP discipline,
  Hub/Spoke exclusion, the canonical Drive identity and the private order filename checks are all unchanged and still
  executed by the same validator.

## 4. Preserved R01 work and the unresolved external rewrite

The five R01 modifications were accepted into the expanded ledger after checking their full diff against the R01 report and
this order; nothing was discarded, stashed, reset or recreated. `README.md` received one further wording adjustment (the
explicit durable publication/release disclaimer) and its digest was re-approved within the authorized gate literal.

The cause of the earlier out-of-band `README.md` rewrite **remains unresolved and no new evidence appeared in this run**:
nothing outside the authorized ledger changed, both R02 scratch logs are inside ignored `.temp/`, and the working tree
contained exactly the expected eight modifications when checked before staging and again at commit time.

## 5. Risks

1. **`AGENTS.md` headroom.** 3,164 of 3,200 approved bytes — 36 bytes. Any further sentence needs the Owner's cap decision.
2. **Rule scope is documentation-only.** The durable rules constrain the README's public claims; they cannot detect a false
   claim expressed in new wording that avoids every listed phrase. The mutation list is the enforceable subset, not a proof
   of universal truthfulness.
3. **Two gates now share one rule list.** A change to `README_TRUTH_RULES` deliberately affects both bootstrap and
   architecture at once; that is the intended anti-drift property, but it also means a future weakening would not be caught by
   a second, independent implementation.

## 6. Disposition

`U04` remains **OPEN**; this order delivered governance and documentation-gate correctness only. No product code, test
fixture for product behaviour, dependency, workflow, closure oracle, declaration, durable Page, external repository, provider,
release or deployment was changed, and no family-parity credit is claimed. Stopping for independent Architect review.

## 7. Hosted verification at the exact product head

Product commit `265d5f0e8344f998466f7da7609b8a94c0d9d2e1` (`84155b8..265d5f0`), one non-force push to Uno `main`.

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Uno Bootstrap Verify` | [45549334009](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45549334009) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |
| `Verify U01 baseline` | [45549333868](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45549333868) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |

Both hosted workflows run the unchanged governance-hash gate, the replaced bootstrap truth rules and the architecture gate at
this exact head, so the corrected frozen bytes, the durable README rules and the single shared rule source are verified on
Linux and Windows, not only locally. The report-only commit that publishes this record changes no gate input.

