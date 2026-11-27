# Foundation Uno — Roadmap

Unfinished stages and their exit gates, nothing more. **No stage in this file is
accepted.** A stage closes only when the independent Chief Master Architect records
`ACCEPT` against a published execution report, and the Owner authorises the next stage
separately.

This file is a public planning summary. It is not an authorisation, not an acceptance
record, and not a substitute for an Owner instruction. **No implementation permission may
be inferred from this file or from any other planning slot: planning describes intended
stages, and only an Owner request authorises a local outcome.** Push, release and
deployment each require their own separate Owner authorization.

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

**State: technical obligations implemented and verified locally; real-domain publication and independent
acceptance outstanding.** The Owner accepted the first pure canonical candidate-address schema (`UNO-WO-019 / R01` §3).
The record below is preserved as history; since those entries, the published-Page, Multi-Site and trace gates were
added and pass: canonical addresses with an optional base path resolve per Site, a published Page declares its own
authored `<html lang>`, canonical, same-Page `hreflang` alternates and `x-default` only where authored, an alias
redirect is proved, `robots.txt` and `sitemap.xml` agree with the HTML, and refusals stay real 404s with no discovery
leakage. Two locales and an unlisted Page are served and verified over real HTTP and Chromium in a reversible
fixture. Nothing is published to a real domain, indexed or pointed at an Owner-chosen origin: those remain
Owner-controlled publication decisions, and U03 is not accepted.

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

**Clean build and bounded payload (`UNO-WO-033 / R01`):** the two `Dynamic filesystem access causes tracing of the whole
project` warnings are gone at their cause, not their text — the confined reader now spells its content-root prefix with
literal components and `next.config.ts` lists exactly four narrow deployment inputs for the three routes that read them.
The build prints zero warnings and zero errors, and the server payload's project-owned content is four files instead of
the whole repository. A new blocking inspector reads the build's own `.nft.json` evidence on both hosts and refuses a
root-wide trace even when no warning is printed; the positive gate now also fails on any build warning. No dependency,
provider, domain, publication or routing change, and U03 stays open.

**Exit gate:** the approved route schema serves correctly, with declared locales and correct
visibility behaviour.

### U04 — One owner, one presentation shell

**OPEN.** Started by the Owner at `bc4763c`; the stage is not closed and this run does not close it.

**Bounded progress (`UNO-WO-035 / R01`).** The version-1 JSON Page document contract exists
(`src/core/page-document.ts`, closed envelope, closed refusals, strict duplicate-key JSON reading,
bounded caps) with **5 of the 22** approved module renderers — `layout.stack`, `layout.grid`,
`content.heading`, `content.prose`, `content.actions` — served end to end by the real Next.js
production build, including a two-card semantic article grid, an unlisted Page with its own
`noindex,nofollow` and zero discovery leakage, and sixteen distinct refusals as genuine 404s.
Family composition coverage is **0 of 17**: the typed `uno-family-composition.ts` translator,
the remaining seventeen module renderers, `deployment/site.config.json`, the presentation shell,
the client interaction island and the owned-asset policy remain mandatory U04 obligations.

**Bounded progress (`UNO-WO-037 / R01`).** Three further approved renderers land — `content.hero`,
`content.stats`, `content.testimonials` — raising live module coverage to **8 of 22**, each with closed typed
props, a unique closed negative refusal and real production HTTP plus Chromium proof over the same two-locale
synthetic Page (308 checks, including dark-mode contrast, 320/390/768/1280 overflow, `<figure>`/`<blockquote>`/
`<figcaption>` quotation semantics and a `<dl>`/`<dt>`/`<dd>` statistics list). The fourteen remaining registered
IDs still refuse as `document:renderer-unavailable`. Family composition coverage remains **0 of 17**; this
increment does not close U04 and does not substitute for the family-composition layer.

**Bounded progress (`UNO-WO-038 / R03`).** Three further renderers land — `layout.bento`, `content.pricing`,
`content.timeline` — raising live module coverage to **11 of 22**, each with closed typed props, at most one
featured pricing option, at most one `aria-current="step"` milestone, a unique closed negative refusal and real
production HTTP plus Chromium proof (464 checks, 0 failed, with the previous 308 preserved and byte-exact fixture
restoration). The same increment performs the authorised dependency-security migration: `next` moves from
`16.4.2` to `16.4.6`, the vulnerable `eslint-config-next` resolver chain is removed and its ruleset is
reconstituted as direct pinned plugins with measured rule-for-rule parity (86→89 `.ts`/`.tsx`, 82→85 `.mjs`;
zero missing, zero demoted, three added). One advisory — `GHSA-fc5q-39xc-vjpf` on `picomatch`, which has **no
published fixed release** — is carried as a named, development-only exception expiring **2026-12-18T00:00:00Z**,
enforced in code and paired with an unfiltered full-graph audit (exactly one high, dev-only) and a strict
production audit (zero). The eleven remaining registered IDs still refuse as `document:renderer-unavailable`.
Family composition coverage remains **0 of 17**; U04 stays **OPEN**.

**Bounded progress (`UNO-WO-126 / R01`).** The `features` family is credited from executed evidence, so the unchanged closure
oracle now returns **15/17** families and **57/59** proxy under the declared **C2** checkpoint, whose target families are `cards`
and `features`. The fourteen-family Cards interim (14/17, 56/59) is retained as closed, reproduced history. Features was earned on
all seven dimensions: the composed native node, the strict reader's re-acceptance, the served markup, the accepted production
response, the Chromium reading at 390 and 1280, the preserved closed refusals, and the ledger's source and rights row. The whole
gate passes **969 checks with 0 failures**. This entry supersedes the earlier family counts above. U04 stays **OPEN**: only
`actions` and `contactForm` are uncredited, and the stage's shell, accessibility, asset-rights and responsive criteria remain
separate obligations.

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
