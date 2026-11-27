# Execution Report - workflow reset and Features reconciliation

**State: local work verified, not published.** Local `main` is three commits ahead of `origin/main` (`f906172`); nothing was committed or pushed in this reset.

## What changed

- The per-task work-order requirement and the exact-byte freeze of `AGENTS.md`, `README.md` and the local SOP are retired by Owner direction. The governance-hash script and its tests were deleted, their workflow steps removed, and the readiness checks that required those steps dropped.
- The bootstrap verifier no longer enforces a closed WIP allowlist or mandatory planning slots. It still requires the core files, refuses the Hub/Spoke data and copied upstream source, and scans every public document and every WIP Markdown file for credentials and machine-specific private paths.
- The Features composer accepts only the pinned donor icon shape, a bound asset-reference string; an object icon is refused as unsupported.
- The family tests, the production verifier and its hermetic guard were reconciled to the native Features node instead of the superseded stack-and-grid tree. Closed refusals, bounds, historical Page bytes and the ordinary binding ceilings were kept; the two 64 KiB probes now exceed the cap with nine bodies.
- New owned-asset proofs cover a 24-image Cards section, a combined 24-image Cards plus 8-image Gallery at the 32-binding ceiling, and the icon binding and refusal matrix.

## Verified locally

| Gate | Result |
| --- | --- |
| Bootstrap | 19 tests pass; scaffold verifier OK |
| Architecture | 47 pass |
| Unit | 1427 pass, 36 files |
| Lint / typecheck | clean, no suppressions |
| Build / trace inspector | build clean with zero warnings; only declared inputs ship |
| Real HTTP | 105 pass |
| Deployment readiness | 131 checks pass |
| Deployment suites | 349 pass |
| U04 consent gate (production HTTP plus Chromium) | 969 checks, 0 failed |
| Closure oracle | C2 earned: **15/17**, **57/59**, `PARITY_FEATURES=PASS`; the closed Cards interim still reproduces 14/17 and 56/59 |

## Honest limits

Parity is now 15/17 families and 57/59, earned by the unchanged oracle under the declared C2 checkpoint and not asserted in advance. The fourteen-family Cards interim remains reproduced history. `actions` and `contactForm` are still uncredited, so U04 remains open, and the stage's shell, accessibility, asset-rights and responsive criteria are separate obligations. Hosted CI at an exact pushed SHA is unverified because nothing was pushed. Release, deployment and any real-site publication remain unauthorized.
