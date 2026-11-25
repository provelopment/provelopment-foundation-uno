# Foundation Uno — Implementation Agent SOP

**Purpose:** durable agent procedure, not a work order or a progress log. Read `AGENTS.md` first. This SOP is usable without Drive access; never claim unobserved evidence.

## 1. Authority and onboarding

Read the three `.documents/WIP/plan-*.md` files, the sole private `.documents/WIP/workorder-active.md`, the Owner's activation and the last `.documents/Reports/execution-report.md`. The Owner either installs exact order bytes or expressly delegates verbatim installation. Verify the exact ID, edition, SHA-256, canonical path and activation. Never improvise, rewrite or publicly stage the private ACTIVE file. Plans, reports, green CI and this SOP do not authorize code changes.

## 2. Mandatory read-only preflight

Before any write, confirm the physical Uno root and every ancestor/junction; one checkout and worktree; expected `main` start SHA; clean or precisely explained tree/index; a single `origin` targeting `provelopment/provelopment-foundation-uno`; no duplicate/root-level order; the effective `/00.foundation-uno/` rule in the **parent's own** `.gitignore`; intact reference repository HEAD/status; and the complete allowed write ledger. Read pinned committed Foundation blobs, not its dirty working tree. Missing, mismatched or ambiguous authority/safety means **STOP before any write**.

## 3. Containment and product invariants

All implementation files, package installs, build output, Git operations and task scratch stay inside the verified Uno root and the order's ledger. Parent workspace, Foundation template, Solo and siblings are read-only. No second clone/worktree, hook bypass, global install, cache escape, `git clean/reset` of unknown changes, force-push, secret publication or unapproved provider action.

Uno contains exactly one Entity, with one or more concurrently active Facets, Sites per Facet, Pages per Site and explicitly authored full-locale representations per Page — no arbitrary hierarchy or language-count ceiling, while resource, ownership and collision guards stay mandatory. Every valid Site may publish independently through its explicitly validated Facet/Site host and/or path binding; an optional explicit default is an entry preference, never an exclusive publisher, and public or unlisted discovery plus full-locale representations are supported without a second publisher. No Spoke/Hub or alternate publication authority. Keep framework-free core and inward ports/adapters boundaries; validate authored paths, URLs, assets, visibility and public/private properties at the stage that implements them. No unreviewed Foundation draft/Solo Rust/Connect import.

An unexplained mid-run mutation of a file outside this order's ledger means **STOP**: preserve the unknown change, restore, overwrite and commit nothing, and record it for the Owner.

## 4. WIP, tests and Git

`.documents/WIP/` has exactly four entries: public `plan-roadmap.md`, `plan-next.md`, `plan-outlook.md` and private ignored/untracked `workorder-active.md`. The single overwritten public report is `.documents/Reports/execution-report.md`; Git history, not copied files, preserves old reports.

Run focused positive/refusal tests locally first, then all stage-applicable bootstrap, architecture, lint, typecheck, unit, production-build and real HTTP/browser checks specified by the order. Record actual tool versions and counts. No skipped/softened mandatory gate, `continue-on-error` or concealed warning. Stage exact intended paths; inspect the index, staged diff and public privacy. Commit and non-force push **only** the permitted Uno paths/operations after local green. Verify the exact pushed SHA and every hosted OS job/step/log. Unavailable checks are `UNVERIFIED`, never `PASS`.

Task scratch belongs in ignored Uno `.temp/`, except an explicitly supplied agent-platform task area. Remove only identified task-owned disposable output; never erase unknown Owner files.

## 5. Evidence and independent review

Overwrite the sole execution report for COMPLETE, FAILED or STOPPED runs. Include order/hash and activation evidence; root/parent/source integrity; before/after commits and exact files; local and hosted test results (PASS/FAIL/UNVERIFIED/NOT APPLICABLE); rights/security warnings, privacy, scratch cleanup and outstanding gates. Publish only under express authorization and never embed its own future commit SHA or any private order bytes. The previously adopted narrow standing exception permits a **report-only** safe Uno commit/push, never source/CI/governance edits.

The Architect alone reviews published evidence and issues `ACCEPT / REVISE / STOP`, maintains the seven canonical Drive records and never writes GitHub. Only the Owner closes a stage or authorizes the next work order, parent exception, release or deployment.

## 6. Owner-controlled governance freeze

`AGENTS.md`, `README.md`, this SOP and the governance-hash script/tests/workflow gates are controlled surfaces. **Do not modify them without express Owner approval naming the exact files and changes in a new work order.** Never append prior-order narratives, daily status, technical changelogs or duplicated roadmap content to these files. `scripts/verify-governance-docs.mjs` rejects any byte change to the three frozen prose files; the separate approved-order process, not a self-edited hash, governs a legitimate future revision. STOP if a task conflicts with this rule.
