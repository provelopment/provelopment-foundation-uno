# Foundation Uno — Roadmap

Unfinished stages and their exit gates, nothing more. **No stage in this file is
accepted.** A stage closes only when the independent Chief Master Architect records
`ACCEPT` against a published execution report, and the Owner authorises the next stage
with a new work order.

This file is a public planning summary. It is not an authorisation, not an acceptance
record, and not a substitute for the Owner-installed `workorder-active.md`. **No
implementation permission may be inferred from this file or from any other planning slot:
planning describes intended stages, and only an Owner-issued work order authorises work.**

---

## Stage sequence

Each stage depends on the previous stage's exit gate. Work may not start on a stage
whose predecessor is still open. The stage names below are the canonical Foundation Uno
sequence and must not be re-scoped by an implementation agent.

### U00 — Safe foundation, independent repository and extraction contract

**State: closed by explicit Owner activation.** The Owner closed U00 by the activation that
authorised the bounded U01 commencement. This entry is a one-line record only: U00 is no
longer a remaining stage and its requirements are not restated here.

### U01 — Independent codebase and reliable baseline

**State: CLOSED by explicit Owner activation (formal stage 2 of 8).**

The Owner closed `U00` by explicit activation and authorised the bounded U01 sequence.
Delivered: a real App Router runtime with a non-indexable technical placeholder at `/`, later
replaced by the accepted English informational demonstration; one pure `src/core/efs/identity.ts`
copied verbatim from GEO-03 `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`; an adapted pure
authoring kernel (`src/core/page-content.ts`, `src/core/page-route-path.ts`); a new Uno-owned
locale policy (`src/core/efs/uno-locales.ts`) requiring an authored language **and region** with
explicit short-language mappings only; an Uno-only exact dependency lock; focused unit and
architecture-refusal tests; a loopback production HTTP proof; a source-adoption ledger with a
17-row section matrix and 22 capability contracts; and two-host CI beside the unchanged U00
workflow.

**Stage-exit correction (Owner-authorized, `UNO-WO-013 / R01`).** The exit gate below — an
accepted extraction ledger naming every path, a genuinely buildable baseline with real tests,
and a recorded dependency set — was met and independently reviewed, so U01 now closes there.
An earlier sentence in this file listed "full module parity with the Foundation Page composer"
and "real public routing/locale behaviour" as unfinished U01 work. That was inconsistent with
the stage assignment in this same roadmap and is corrected here: **routing, locale serving,
content reading and metadata parity belong to U03**, and **presentation shell plus module and
family parity belong to U04**. Neither is a U01 obligation.

Scope: extract a **buildable, testable Foundation-derived Next.js / TypeScript source
baseline** into this independent repository against the Owner-approved source pin, and
establish that the independent codebase builds and its baseline checks pass.

U01 is a **baseline** stage. It does **not** remove the Hub/Spoke domain — that belongs to U02 —
and it does **not** deliver public routing, locale serving or metadata parity, which belong to U03.

**Exit gate:** an accepted extraction ledger naming every path before any source moves, a
genuinely buildable baseline with real tests, and a recorded dependency set.

### U02 — Remove Hub/Spoke domain and establish single-Entity authority

**State: CLOSED — closed by the Owner's explicit activation of `UNO-WO-019 / R01`, after the
independent acceptance of `UNO-WO-018 / R01`.** The closure record is the Owner's, not the
Implementation Agent's: no self-acceptance is claimed here.

Scope: remove the Hub/Spoke domain model and establish Uno's single-Entity authority,
including explicit refusal of a **zero-Entity** and a **two-Entity** configuration.
Spoke-owned publication identity and multi-publisher ownership are removed here.

**Exit gate:** one Entity is the only admissible topology, with refusal tests proving that
zero and two Entities are rejected.

**Established at closure:** one Entity (`e_7a3knkx60eacyhca7a0cr1k6e1`) as the only admissible
cardinality; an optional typed five-level property contract (`brand.name`, `contact.name`,
`contact.email`, `contact.phone`) with deterministic nearest-ancestor inheritance, explicit `null`
suppression and exact-code refusals; and one explicit, non-serving selected-Site declaration
(`foundation` / `main`) validated against the manifest with no array-first fallback. No Hub, Spoke,
second Entity, host binding or publisher authority exists in the authored graph.

### U03 — Public routing, content and metadata parity

**State: IN PROGRESS — the Owner has explicitly accepted the first pure canonical candidate-address
schema (`UNO-WO-019 / R01` §3). Nothing is served, published, indexed or redirected.**

Scope: public routing, content and metadata parity — canonical addresses, an optional base
path, Page and locale behaviour, and visibility. `canonicalLocaleTag` remains distinct from
`localePathKey`.

**Completed checkpoint:** a pure candidate-address index and byte-exact matcher
(`src/core/efs/uno-route-address.ts`) for the selected Site only — `/<lowercase-full-locale>` for the
reserved Home declaration, `/<lowercase-full-locale>/<relative-route>` otherwise, with exact-path
matching and closed refusals. The live `/` page and every existing 404 are unchanged.

**Confined source loading (`UNO-WO-020 / R01`):** the first real Node adapter,
`src/adapters/efs/uno-confined-source-reader.ts`, reads one declared source from a trusted root with a
physical confinement boundary — symlink/junction refusal on every component, bounded reads (128 KiB
manifest, 8 KiB selection, 64 KiB content), strict UTF-8, and minimal Markdown/JSON safety validation.
It is wired through the existing `resolveDeclaredPageSource` use case, so declared **JSON-before-
Markdown** precedence governs reads. The committed `en-001` Home Markdown is genuinely opened and
returned as a non-serving payload. Nothing is routed, published, indexed or rendered, and the adapter is
imported only by its tests: no `src/app` file, no route, no metadata.

**Header projection (`UNO-WO-021 / R01`):** the pure projector
`src/core/efs/uno-page-header.ts` and its application use case
`src/application/resolve-uno-page-header.ts` turn an already loaded, non-serving source payload into a
bounded Page header — `title`, optional `description`, the policy-decided `visibility`, and for Markdown
the raw unrendered body. The reserved Home candidate maps to the authoring route `home`, JSON keeps every
other key opaque, and a refused load stays refused. **Projection is not publication:** no route is served,
no Page is published or indexed, nothing is rendered, and `src/app/**` is untouched.

**Discoverability intent (`UNO-WO-022 / R01`):** the pure
`src/core/efs/uno-discovery-policy.ts` classifies what an already-projected Page header would be *eligible*
for **if** an Owner later authorized publication — six conditional surface flags plus a robots intent — and
delegates every visibility decision to the existing policy. It publishes, routes, renders and indexes
nothing, no `src/app` source imports it, and `public` eligibility is not publication.

**Still outstanding:** the validated Page-document and module schema, explicit Owner publication and route
activation, safe HTTP error behaviour, metadata/SEO emission including canonical advertising and `hreflang`,
real locale routing, and any optional base path. Each requires a later bounded Owner order.

**Integrated exit evidence (`UNO-WO-032 / R01`):** one synthetic fixture now proves the same production build serves an
explicitly published Home, About and a **custom multi-segment Page** in two authored locales over real HTTP *and* a real
headless Chromium DOM — truthful language, title, canonical/OG, same-Page alternates and `x-default`, a six-entry
sitemap, crawler parity for two user agents, fifteen strict refusals and a genuine 404 document — with 530 checks passing,
the original 195 preserved, the fixture restored byte-for-byte and the unpublished configuration rebuilt afterwards.
`playwright@1.65.1` is Apache-2.0 and test-only, installed into the repository-local ignored browser path. No live origin,
provider action or U04 rendering is claimed, and U03 stays open.

**Exit gate:** the approved route schema serves correctly, with declared locales and correct
visibility behaviour.

### U04 — One owner, one presentation shell

Not started. Blocked on U03 exit.

Scope: one owner and **one** presentation shell — assets, responsive navigation and
accessibility.

**Exit gate:** the single presentation shell meets the agreed responsive and accessibility
criteria.

### U05 — Retain appropriate website functionality

Not started. Blocked on U04 exit.

Scope: retain appropriate website functionality, including **safe contact** and explicitly
approved integrations.

**Exit gate:** the approved functionality works with explicit secret handling, no credential
in the repository, and a recorded licence review for any integration.

### U06 — Clean-room setup, upgrade and distribution

Not started. Blocked on U05 exit. Upstream `scripts/release/**` and
`scripts/installation/**` are **not** copied before this stage; Uno's own clean-room setup,
upgrade and distribution capability is a future obligation here, not something permanently
deleted.

**Exit gate:** a reproducible clean-room setup, a documented upgrade path and a
distributable artefact.

### U07 — Full independent review and Owner-controlled first release

Not started. Blocked on U06 exit.

Scope: a full independent review, followed by the Owner-controlled first release.

**Exit gate:** the independent review is closed and the Owner authorises the first release.

---

## Dependency summary

```text
U00 → U01 → U02 → U03 → U04 → U05 → U06 → U07
```

There is no parallel track. A stage that cannot meet its exit gate stays open; it is
never marked complete because unrelated checks passed.
