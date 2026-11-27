# Foundation Uno

Foundation Uno is an independent, rebrandable Apache-2.0 **Next.js/TypeScript** website foundation adapted from audited [Provelopment Foundation](https://github.com/provelopment/provelopment-foundation) code. One Installation owns **one Entity, one or more concurrently active Facets, Sites per Facet, Pages per Site and explicitly authored full-locale representations per Page**. Every valid Site may publish independently through its explicitly validated Facet/Site host and/or path binding; an optional explicit default is an entry preference, never an exclusive publisher. No arbitrary hierarchy or language ceiling and no multi-Entity Hub/Spoke operation; Solo informs only adopted design concepts, not runtime code.

## Source of truth

The [Uno repository](https://github.com/provelopment/provelopment-foundation-uno) is the **only record of progress and executed work**. Read current `main`, [the single execution report](.documents/Reports/execution-report.md), [the roadmap](.documents/WIP/plan-roadmap.md) and exact-head CI for present stage, implemented features and limitations. This README has no run history, closed/open stage declarations or pinned commit.

Current maturity, implemented features and outstanding gates live only in current `main` and [the single execution report](.documents/Reports/execution-report.md): the code is a **technical baseline**, and a technical baseline, valid declaration or passing test does not establish a published website and does not authorize release or deployment; those need their own Owner authorization and evidence.

## Develop and verify

Use the versions required by the actual `package.json`, lockfile and CI: **Node.js 26.x**, **pnpm 11.6.0**. From the Uno checkout:

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

Read [AGENTS.md](AGENTS.md) and the [Implementation SOP](.documents/SOP/sop-implementation.md). One Owner request authorizes work on the requested local outcome. Push, release and deployment require separate authorization. The Architect maintains the [seven canonical Drive documents](https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0) as direction and guardrails, not status logs. The [source inventory](.documents/Architecture/source-inventory.md) retains source rights and the 17/22 capability mapping.

Apache-2.0 does not automatically license Provelopment trademarks, unreviewed imagery or separately licensed Connect code. Do not publish secrets, private authoring data or unapproved integrations.
