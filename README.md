# Foundation Uno

An **independent, open-source Next.js / TypeScript website foundation**, extracted
from the Provelopment Foundation product into its own repository.

Foundation Uno serves **exactly one Entity**. Its content model is a single
hierarchical chain and nothing else:

> **Entity → Facet → Site → Page → localized representation**

There is **no Hub/Spoke model** and **no multi-Entity publication** in Uno. Where the
upstream product organises several Spokes under a Spoke Hub, Uno holds one Entity and
publishes that Entity's Facets, Sites and Pages.

---

## Project stage: U00 — bootstrap only

This repository is at **stage U00**. It contains project governance, a source
extraction inventory, and a verified bootstrap scaffold — and nothing else:

- ❌ **no Uno runtime** — there is no `src/`, no Next.js app, no `package.json`
- ❌ **no working website**, no build, no dev server
- ❌ **no release and no deployment**, no production configuration, no DNS
- ✅ documents, an extraction inventory / U01 plan, and a bootstrap verifier with tests
- ✅ a self-contained implementation SOP, a four-slot WIP discipline and one execution report

The Uno runtime is **not implemented yet**. Nothing here runs a website; this is a
project bootstrap, not a product and not a v1 release.

There is therefore deliberately **no `pnpm install` or `pnpm build` instruction** in
this README. There is no application to install or build. A later stage introduces the
runtime together with real, tested commands — not before.

---

## Upstream source (read-only)

Foundation Uno is derived from a public upstream product, which is read-only reference
material for this project:

- Repository: <https://github.com/provelopment/provelopment-foundation>
- Observed exact revision for U00 analysis: **`fa599973a88ff77f6a8e012f3266c3c139b52c17`**
  (`main`, observed 2026-11-15)

Upstream is a source of *architecture and behaviour*, not a directory to copy wholesale.
See `.documents/Architecture/source-inventory.md` for the per-module extraction decision
matrix (KEEP / ADAPT / DELETE / REPLACE / FURTHER AUDIT), recorded against that exact
revision.

No Foundation runtime source has been copied into this repository at U00.

## Canonical project documentation

The governing, canonical documentation set lives outside this repository in the
project's documentation folder, maintained by the Architect:

- Canonical Uno project folder: <https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0>

That folder holds the canonical `AGENTS.md`, `SOP-ARCHITECT.md`, `README.md`, `PLAN.md`,
`BLUEPRINT.md` and `WIP.md`. This repository's `AGENTS.md` and `README.md` are useful,
synchronised public entry points; **the canonical governing records are the Drive
documents**. Canonical documentation content is not mirrored here.

## Licence and rights

Released under the **Apache License, Version 2.0** — see [LICENSE](LICENSE). The full,
unmodified Apache-2.0 text is included; it was copied verbatim from the upstream
repository and not edited.

Important caveats, stated plainly:

- The Apache-2.0 licence grants copyright and patent permissions for the **software**.
  It does **not** grant rights to the **Provelopment** name, brand, logos, visual
  identity or trademarks, except for reasonable and customary use in describing the
  origin of the work.
- Foundation Uno is an independent extraction. It is **not** the Provelopment
  Foundation product, and it is not endorsed by or affiliated with it beyond being
  derived from the same public source.
- Any future copied prose, imagery, brand assets or other third-party content requires
  a **provenance and rights review before it is committed**. U00 copies **no** assets.
  See `.documents/Architecture/source-inventory.md` for the recorded concerns.

## What is in this repository

| Path | Purpose |
| --- | --- |
| `README.md` | This orientation document. |
| `AGENTS.md` | Self-contained public entry point: roles, boundary and repo-local working rules. |
| `LICENSE` | Complete, unmodified Apache License 2.0. |
| `.documents/SOP/sop-implementation.md` | Self-contained implementation agent SOP, usable without a Drive connector. |
| `.documents/Architecture/source-inventory.md` | Source-verified extraction inventory and U01 handoff. |
| `.documents/WIP/plan-roadmap.md` | Unfinished stages `U00–U07` and their exit gates. |
| `.documents/WIP/plan-next.md` | The single next authorised item — header-only while none is authorised. |
| `.documents/WIP/plan-outlook.md` | Optional ideas. Never a requirement. |
| `.documents/Reports/execution-report.md` | The single execution evidence report, overwritten each run. |
| `scripts/verify-bootstrap.mjs` | Dependency-free bootstrap validator. |
| `tests/bootstrap.test.mjs` | Dependency-free positive/refusal bootstrap tests. |
| `.github/workflows/verify-bootstrap.yml` | Two-host read-only bootstrap verification CI. |

## Working in this repository

Start with `AGENTS.md`, then read `.documents/SOP/sop-implementation.md` in full.

`.documents/WIP/` holds exactly **four** slots, and nothing else:

| Slot | Visibility | Meaning |
| --- | --- | --- |
| `workorder-active.md` | private, ignored, untracked | The Owner-authorised order for the current stage. Read-only after installation. Never published. |
| `plan-roadmap.md` | public, tracked | Unfinished stages and exit gates. Never an acceptance record. |
| `plan-next.md` | public, tracked | The single next authorised item. |
| `plan-outlook.md` | public, tracked | Optional ideas. |

A root-level `workorder-active.md` is **never** a valid order. Exactly **one** report
exists and each real run overwrites it, including a run that stopped or failed.

Work begins only under an Owner-installed work order plus an explicit Owner activation for
that stage. A plan file, a milestone, a green CI run or this README is never an
authorisation.

## Verifying the scaffold


Two dependency-free commands. Node.js 24 is used; **no packages are installed and no
lockfile exists at U00**.

```sh
node --check scripts/verify-bootstrap.mjs
node --test tests/bootstrap.test.mjs
node scripts/verify-bootstrap.mjs
```

- `node --test tests/bootstrap.test.mjs` runs the bootstrap tests: a complete minimal
  fixture must produce zero issues, and each specific defect — missing licence, missing
  work-order ignore rule, a stray Hub/Spoke deployment file, missing README, missing
  AGENTS, a missing local SOP, a missing planning slot, an over-broad WIP ignore rule and
  an unexpected WIP entry — must be refused with its own diagnostic.
- `node scripts/verify-bootstrap.mjs` validates **this actual checkout** and exits
  non-zero with diagnostics if the scaffold is wrong.

The same two commands run in CI on `ubuntu-24.04` and `windows-2025` via
`.github/workflows/verify-bootstrap.yml`. That workflow verifies the scaffold only — it
is not a production build and proves nothing about Next.js behaviour.

## Next stage

**U01 — first extraction slice.** It is expected to take the upstream EFS content model
(`Entity → Facet → Site → Page → representation`) as the starting architecture, strip
the Hub/Spoke and presentation-site couplings, bring over one Entity's content
foundation, and stand up a minimal, genuinely buildable Next.js runtime with real
tests.

U01 is **not** authorised by this repository, this README, or the presence of this
scaffold. Each stage proceeds only under an Owner-issued work order. See
`AGENTS.md` for the working boundary.
