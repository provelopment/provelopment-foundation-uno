# Foundation Uno

Foundation Uno is an independent, rebrandable Apache-2.0 **Next.js/TypeScript** website foundation adapted from audited [Provelopment Foundation](https://github.com/provelopment/provelopment-foundation) code. One Installation owns **one Entity → Facets → Sites → Pages → explicitly authored full-locale representations**. A1 permits exactly one explicitly selected public Site. It does not implement multi-Entity Hub/Spoke operation. Solo informs only adopted design concepts, not runtime code.

## Source of truth

The [Uno repository](https://github.com/provelopment/provelopment-foundation-uno) is the **only record of progress and executed work**. Read current `main`, [the single execution report](.documents/Reports/execution-report.md), [the roadmap](.documents/WIP/plan-roadmap.md) and exact-head CI for present stage, implemented features and limitations. This README has no run history, closed/open stage declarations or pinned commit.

The authored public Uno A1 website is not implemented yet. A **technical baseline**, valid EFS declaration, passing tests or projected Page header is not by itself a published A1 website. Public routes, publication, releases and deployments require their own Owner-authorized work and evidence; do not describe unfinished functions as live.

## Develop and verify

Use the versions required by the actual `package.json`, lockfile and CI: **Node.js 26.x**, **pnpm 11.6.0**. Inside the physically verified Uno checkout, under the active work order only:

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

A passing HTTP test of the current informational page does not establish public EFS routing or authorize deployment.

## Authority and rights

Read [AGENTS.md](AGENTS.md) and the [Implementation SOP](.documents/SOP/sop-implementation.md). Only the exact private, Owner-activated `.documents/WIP/workorder-active.md` and its explicit ledger authorize implementation. The Architect maintains the [seven canonical Drive documents](https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0) as direction and guardrails, not status logs. The [source inventory](.documents/Architecture/source-inventory.md) retains source rights and the 17/22 capability mapping.

Apache-2.0 does not automatically license Provelopment trademarks, unreviewed imagery or separately licensed Connect code. Do not publish secrets, private authoring data or unapproved integrations. Changes to this frozen README, `AGENTS.md` or the local SOP require explicit Owner approval and exact-hash verification.
