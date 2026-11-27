# Foundation Uno: execution plan through first release

Planning snapshot: November 27, 2026. This file records proposed work, not permission to publish, close a stage, or deploy.

## Current status after the workflow reset

The per-task work-order system and the exact-byte prose freeze are retired. An Owner request now authorizes one local outcome; push, release and deployment still need separate authorization. The WIP folder accepts additional planning files, and every Markdown file there is still scanned for credentials and machine-specific paths.

Verified in this checkout after the reset:

- Bootstrap: 19 tests plus the scaffold verifier pass; an extra planning file is accepted, and a private path planted in it is still refused.
- Architecture: 47 pass. Unit: 1427 pass across 36 files. Lint and typecheck are clean with no suppressions.
- Production build: succeeds with zero warnings; the trace inspector confirms only declared inputs ship.
- Real HTTP: 105 pass. Deployment readiness: 131 checks pass. Deployment suites: 349 pass.
- U04 22-module consent gate, real production HTTP plus Chromium: 969 checks, 0 failed.
- Parity is **15/17 families and 57/59**, earned by the unchanged closure oracle under the declared **C2** checkpoint. The fourteen-family Cards interim (14/17, 56/59) stays reproduced as closed history.

## Starting point and the open row

Local main is `8f4f340`, three commits ahead of `origin/main` at `f906172`: the Features composer adoption (`0c6ef32`) and two report-only commits. Preserve them.

The composer emits one native Features node, its verification matches that representation, and Features is credited on all seven dimensions. C2 is earned, so only the **D** row remains: `actions` and `contactForm`, which together would take the oracle to `17/17` and `59/59`.

## 1. Earn the D row

1. Prove `actions` and `contactForm` across the same seven dimensions; keep contact presentation-only until delivery is separately authorized.
2. Never pre-label or hard-code a credit; let the unchanged oracle return `17/17` and `59/59` before asserting it.
3. Run every applicable gate before any authorized push, then verify the exact pushed SHA and every hosted job.

## 2. Finish U04 and settle the U03 record

- Finish the evaluator remaining families after Features: `actions` and `contactForm`, each across the same seven dimensions. Contact stays presentation-only until delivery is separately authorized.
- Audit the separate U04 exit criteria: one accessible shell, navigation from published public Pages, owned and licensed assets, valid configuration, keyboard/focus/reduced-motion behavior, and 320/390/768/1280 evidence.
- Reconcile the roadmap U03 entry against the later U04 commencement rather than redoing completed routing work.
- Before **December 18, 2026 at 00:00 UTC**, check the development-advisory exception against the real dependency graph; adopt a repaired dependency or record a fresh Owner decision.

## 3. Remaining stages

| Stage | Work | Exit evidence |
| --- | --- | --- |
| U05: approved functionality | Safe contact and permitted integrations; test success, failure and unconfigured states; keep credentials outside the repository. | Approved flows work, failure is safe, rights and secret handling are recorded. |
| U06: setup, upgrade and distribution | Produce the artifact and operator instructions; install clean and upgrade with existing authored content. | Exact artifact identity, reproducible setup and upgrade evidence. |
| U07: review and first release | Assemble exact-head CI, provenance, security, accessibility and clean-room evidence; resolve findings. | Independent review closed and explicit Owner release authorization. |

Deployment remains a separate decision: HTTPS origin, named publishable Pages, the protected root demonstration, rebuild-to-publish behavior and any base path all need explicit Owner approval.
