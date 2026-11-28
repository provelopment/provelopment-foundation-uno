# Foundation Uno — Roadmap

This file is a public planning summary; the single execution report records executed results and independent acceptance. The Owner's 2026-11-28 completion direction at the end of this file is the controlling remaining scope, aligned with the canonical Google Drive PLAN.md. Historical stage entries are retained as evidence and context, not proof that the newly approved requirements are complete.

Owner requests authorize local implementation and verification. Stable, sufficiently verified pushes and their existing automatic Vercel deployments are standing-authorized; no repeated activation or per-push approval. No force-push, speculative build or report-only deployment. Final release/tag and live provider activation remain separate Owner decisions. Independent acceptance is required; no self-closure.

---

## Stage sequence

The historical U00–U07 sequence remains. The Owner-approved completion direction below strengthens U02–U07 requirements and authorizes coordinated implementation across them without another administrative activation cycle. The agent must preserve all prior evidence and prove the new requirements before final closure.

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

**CLOSED WITHIN THIS INCREMENT — implementation and evidence complete; independent acceptance outstanding.** Started by the Owner at `bc4763c`.
Both shell gaps found by the obligation audit are closed: the published `<main>` now carries `id="main"` with the shared skip
affordance, and cross-Page navigation is derived from the Site's accepted public Pages under the validated
`deployment/site.config.json` presentation envelope. Every one of the eleven exit obligations now has an executed reading;
nothing here closes the stage.

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

**CLOSED WITHIN THIS INCREMENT — implementation and evidence complete; independent acceptance outstanding.** Was blocked on U04 exit; the U04
navigation obligation is complete on evidence, so this stage proceeded within the authorized local scope. Delivered: the
accessible contact interface (rendered only when configured), the optional server-only allowlisted HTTPS webhook with delivery
**OFF** by default, a bounded abuse limiter, public-destination/SSRF and redirect refusal, opt-in same-origin analytics with
**OFF** by default, and the wiring guard that refuses any of those clauses being removed. Authored `mailto:`/`https` actions were
inspected and left unchanged: they were already admitted only through the established policy, which now also has U05 evidence.
Parity, the 22 module IDs, the single client island and the single presentation shell are preserved.

Scope: retain appropriate website functionality, including **safe contact** and explicitly
approved integrations.

**Exit gate:** the approved functionality works with explicit secret handling, no credential
in the repository, and a recorded licence review for any integration.

### U06 — Clean-room setup, upgrade and distribution

**COMPLETE — awaiting independent acceptance.** The clean-room routing defect was traced to the installer, not the product: an
installation entered through a directory junction is refused by the product's own source confinement (`root:symlink`). The installer
now builds every release at a permanent physical path and switches the active release by record, with a generated `start.mjs`
launcher. The clean-room gate proves two independent installations, operational starter Pages, discovery surfaces, canonical metadata,
navigation, owned-media refusal, genuine 404s, both OFF defaults, a genuine upgrade with adopter preservation, tamper refusal,
rollback with operational re-proof, interruption recovery and reproducible packaging (**195/0**), and is wired into the blocking CI
pipeline on both hosts. Operator documentation ships in the artefact.

### U07 — Full independent review and Owner-controlled first release

**COMPLETION PASS IN PROGRESS — submitted for independent audit.** The Owner-approved completion direction of 2026-11-28 is
implemented against the pinned Foundation reference `fa599973`: a resolved-edge dependency gate and a module registry with a
proved synthetic-module exercise, the Owner-owned Connect module incorporated under Uno's Apache-2.0 licence, explicit
public-contact exposure with a three-outcome projection, a re-established SIMPLE submission policy with bounded streamed
input, and an optional server-only Resend adapter with placeholder configuration and an operator runbook. Remaining
deferrals (maps/directions, booking, OpenGraph image, video providers, inquiry webhook variants) are recorded in the
execution report; none is described as done. Release tagging, publication, live provider activation and domain changes each
keep their own authorisation boundary and were not performed.

## Dependency summary

```text
U00 → U01 → U02 → U03 → U04 → U05 → U06 → U07
```

A requirement that cannot meet its exit gate stays open; it is never marked complete because unrelated checks passed. The final integrated completion and independent Cline audit gate below applies across the existing stages.

---

## Owner-approved completion direction — 2026-11-28

This direction strengthens the U02–U07 exit criteria; it does not introduce a new U08 stage or erase earned historical evidence. The operational Uno baseline at `ca90989532e452467867bcad011dcaee477c5594` is not complete Foundation functional parity. Compare the pinned Foundation `main` at `fa599973a88ff77f6a8e012f3266c3c139b52c17` and inspect the actual current Uno checkout, preserving local assurance commits `11dff19` and `b8927b8` if present. Complete all applicable single-Entity functionality and every approved BLUEPRINT requirement. Exactly one Entity; concurrent independently publishable Facets/Sites; explicitly authored full locales; no multi-Entity Hub/Spoke runtime. No silent deferrals or acceptance based on scaffolding.

### 1. Complete Foundation single-Entity functional parity

Inventory each applicable Foundation contract, source, behavior and test: identity/publication; authored JSON/Markdown and source precedence; locales, dictionaries and switching; shell, navigation, footer, branding and asset roles; properties and public facts; application links and safe actions; assets/media; SEO and visibility; section families and modules; maps/directions/booking; contact; analytics; installation, configuration, release, upgrade, rollback and recovery. Include every approved Uno-specific BLUEPRINT obligation. For each, identify the exact reference, Uno implementation, executed positive/refusal evidence and disposition: verified equivalent, deliberate Uno adaptation, gap to close, or demonstrably outside Uno's single-Entity scope. Resolve every applicable gap. In particular, reconcile BLUEPRINT §5's additive inheritance, provenance, suppression and explicit exposure (including contact.phone/contact.email) with Uno's existing scalar nearest-wins implementation; do not assume they are equivalent. Reconcile schema decisions against source evidence and Owner-approved direction; never silently substitute a weaker contract. Preserve historical 17/17 family parity, 59/59 proxy and the existing 22 module identities, without claiming that these measure full functionality.

### 2. Strict hexagonal architecture and real module extensibility

Enforce inward dependencies: framework-free domain invariants; application use cases and inward-owned ports; driving UI/HTTP/CLI adapters; driven filesystem/environment/network/mail/provider adapters; thin composition roots. Keep publication, identity, ownership, visibility and privacy authority independent of capabilities. Move independent validation, execution, rendering and configuration out of centralized dispatch and move business orchestration out of HTTP handlers and configuration. Prefer clear bounded contracts and simple, maintainable implementations over abstraction for its own sake. Use deterministic typed/versioned compile-time registration, explicit dependencies and capability checks, bounded configuration and fail-closed unknown, duplicate, incompatible or unavailable registrations. No arbitrary executable authored code, dynamic third-party plugin loading or unnecessary microservices. Prove an additional synthetic module can be registered, validated, invoked/rendered, disabled and removed without editing unrelated modules or EFS/routing policy. Enforce resolved dependency edges (imports, type imports, re-exports, aliases, dynamic imports and transitive paths), cycles, server/client boundaries and mutation sensitivity. Preserve accepted authoring compatibility and physically packaged runtime inputs. Review the entire codebase, not just paths previously guarded.

### 3. Connect ownership and unified licensing

Owner direction of 2026-11-28: the Owner confirms ownership of Connect and expressly authorizes incorporation of Owner-owned Connect source into Foundation Uno under Uno's main Apache-2.0 license. Connect is an integral Uno module, not a separately licensed product or mandatory external runtime dependency. This supersedes previous Uno exclusions and separate-license assumptions for Connect. Select and pin the applicable source and contracts from the Foundation-integrated Connect and/or Owner-authorized upstream source; inspect their dependencies, security and provenance. Apply Uno's main LICENSE to the incorporated Owner-owned source, update affected rights records and retire conflicting separate Connect licence restrictions within Uno. Retain copyright attribution and third-party notices where legally required; the Owner grant does not relicense unrelated third-party IP. Do not publish unrelated private repository contents, real recipient settings, credentials or proprietary assets. Foundation and upstream references remain read-only; no ADVANCED durable delivery is implied by SIMPLE.

### 4. Complete Connect contact: public mailto and SIMPLE

Implement public contact projection and SIMPLE enquiries as independent capabilities behind module/application ports, based on the actual Foundation behavior. Public contact facts may reach explicit authorized references only, never inferred from private delivery policy. Support literal safe mailto and applicationLink resolution in applicable prose, action and list surfaces. Absent, disabled, revoked, suppressed, invalid or unauthorized public facts must produce inert text or a closed refusal, never an unauthorized address. Preserve qualified ancestry, explicit fact selection and Site/locale isolation. Public email and private recipients are independent.

For every SIMPLE submission, server-side re-establish validated Entity/Facet/Site/Page/representation/publication and form identity; never trust a client-posted path, hidden field or claimed Site as authority. Use one shared render/submission authorization policy, with current facts rechecked on submission. Explicit Site/form enablement, stable form reference, authorized placement, localized name/email/subject/message and transactional acknowledgement, unique DOM IDs, consistent client/server schema, accessible validation and status, bounded streamed request input and time, honeypot, origin/request integrity and proportionate abuse/concurrency limits. Server-only recipient, sender and Reply-To policy; no visitor-controlled recipient or From, no header injection, arbitrary attachments or HTML. Exactly one authorized direct transport attempt; no queue, persistence or automatic retry in SIMPLE. Distinguish OFF, unavailable, invalid, offline accepted (not sent), provider accepted (not delivered), known refusal/not sent, and ambiguous outcomes. Resolve confirmed global enablement, unverified POST, section-derived Page path, mismatched fields, duplicate IDs and whole-body buffering. Retain pinned connection-level HTTPS/SSRF protections and fail-closed provider selection.

### 5. Optional Resend adapter and secure operator setup

Implement a server-only Resend driven adapter behind the mail transport port, optional and OFF by default. Use the fixed documented HTTPS API endpoint, TLS verification, bounded streaming/response and request deadlines, no redirects, explicit credential and recipient scope, safe plain text or escaped templates, no provider secrets/body in logs or responses, and honest safe error mapping. Use a non-PII opaque idempotency key per authorized attempt to prevent accidental duplicates without claiming cross-instance exactly-once delivery; never automatically retry SIMPLE. Test with injected transport and deterministic faults, without a live key or actual send.

Ship a complete operator guide in the distribution and a placeholder-only environment/configuration example whose exact names match the implementation (e.g. RESEND_API_KEY=FILL_IN, private verified sender and recipient settings, provider OFF/Resend selection; no real login/password/token). Document: create a Resend account and enable MFA; use a dedicated verified sending subdomain; enter the exact SPF/DKIM DNS records supplied by the dashboard and verify DMARC alignment/rollout without breaking existing mail; generate a dedicated domain-restricted sending-only API key, separate development/staging/production keys; place credentials only in the hosting secret store or ignored local environment, never Git, client bundle, authored content or screenshots. Use a verified fixed From, server-allowlisted private To/CC, and validated visitor Reply-To, never send to arbitrary visitor-selected addresses. Describe key rotation/revocation, least privilege, quota and cost monitoring, distributed abuse protection for multi-instance production (do not claim in-memory protection is distributed), failure/timeout/ambiguous outcomes, consent/privacy and retention including provider logs, controlled smoke testing, disable/rollback and incident response. Link official documentation: https://resend.com/docs, https://resend.com/security, https://resend.com/changelog/new-api-key-permissions, https://resend.com/changelog/idempotency-keys. No live key, DNS modification, provider activation or real send until explicitly authorized. A real provider is not required to prove OFF/offline/mocked functionality.

### 6. Integrated verification and deployment

Run the full existing pipeline plus new module/architecture tests, parity evidence, public/internal fact tests, mailto and form authorization equivalence, cross-Site/locale/form/refusal tests, abuse/concurrency/body limits, Resend contract and fault tests, client/server secret leakage checks, accessibility, localized UI, real production HTTP/Chromium, emitted function-input/asset contracts, dependency/security and licensing scans, two independent clean rooms, upgrade/rollback/recovery. Verify exact candidate CI on Ubuntu and Windows, then the actual HTTPS production installation at https://uno.provelopment.com using the existing Git-to-Vercel pipeline and available Vercel MCP. Perform real visual and interaction verification at 320/390/768/1280, including safe non-transmitting contact demonstrations. No speculative or report-only deployments; preserve operational production. Local evidence, clean-room packaging and live deployment are all required, not interchangeable. No fake pass or unapproved provider activation.

### 7. Independent Cline Plan-mode audit and final release gate

After all implementation and verification are complete, the Architect prepares a standalone audit prompt for a fresh independent Cline Plan-mode agent against the exact candidate, canonical PLAN/BLUEPRINT, Foundation reference and executed evidence. The auditor remains read-only: independently inspect architecture/dependency boundaries, module extension, functional completeness, Connect rights, contact/Resend authorization and security, supply chain, secrets/privacy, packaging, accessibility and live evidence. Provide an audit report with severity, exact source location, reproducible evidence, impact, remediation and verification; distinguish confirmed defects from hypotheses and untested claims. The Implementation Agent remediates findings, reruns affected/full gates and submits for independent re-review. No final acceptance with unresolved applicable functionality or material architecture/security findings. The Architect's final acceptance and Owner's first-release/tag decision follow the independent audit and remediation. Live provider activation remains a separate Owner decision.

### Governance and reporting

The Owner request authorizes implementation and local verification. Standing authorization applies to stable, sufficiently verified pushes and their established automatic Vercel deployments; no per-task ACTIVE/work order or per-push approval, force-push, speculative resource use or unrelated infrastructure/provider action. Preserve unrelated local work. The sole repository execution report records actual results, exact SHA, artifact digest, production deployment and limitations; the Drive plan is direction, not a chronological execution log. Align README, AGENTS, architecture, roadmap, rights and operator docs with this Owner direction. The implementation agent owns engineering design and execution, not self-acceptance. Final completion requires all seven outcomes, the Cline audit and remediation/re-review, not just green CI or an accepted presentation slice.
