# Foundation Uno

Foundation Uno is an independent Apache-2.0 **Next.js/TypeScript** website foundation derived from [Provelopment Foundation](https://github.com/provelopment/provelopment-foundation). It is designed for **one Entity** with Facets, Sites, Pages and explicitly authored localized representations, initially publishing one selected Site. No Hub/Spoke runtime or multi-Entity tenancy.

## Current maturity

**U00 is Owner-closed; U01 remains open.** The repository contains a reproducible Next.js technical baseline, pure EntityID/content-slug/relative-route/locale-policy code, tests and Windows/Ubuntu CI. `/` serves a deliberately non-indexable technical placeholder. The authored public Uno A1 website is not implemented yet. There is no published EFS Site/Page, locale URL routing, modular presentation system, live provider, release or deployment. Consult the [roadmap](.documents/WIP/plan-roadmap.md) and [single execution report](.documents/Reports/execution-report.md) for current evidence; this README is not a status log.

## Develop and verify

Use Node.js 24 and pnpm 11.6.0 inside the Uno checkout; the dependency lock is committed.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test:bootstrap
pnpm test:architecture
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:http
```

The HTTP gate checks the **technical placeholder**, not a usable public website. No deploy or release follows from successful tests.

## Governance and source

Read [AGENTS.md](AGENTS.md) first and the [local Implementation SOP](.documents/SOP/sop-implementation.md) before any work. Execution requires one matching Owner-authorized private ACTIVE order; roadmap and README are not work orders. The canonical seven project documents are maintained by the Architect in [Uno Drive](https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0). For exact upstream provenance and the 17/22 capability mapping, see the [source inventory](.documents/Architecture/source-inventory.md).

Apache-2.0 does not grant rights to Provelopment trademarks, unaudited imagery or separately licensed Connect code. Keep credentials and private authoring data out of public files.

**Owner approval is mandatory for any change to this README, AGENTS.md or the local Implementation SOP.** No append-only milestones or execution history belong in these files.
