# Execution Report — U04 complete on evidence, awaiting independent acceptance

**State:** `687d80b` is pushed and green on both hosts. This increment (the presentation shell and its derived navigation)
is committed locally and unpushed; a further push needs separate Owner authorization. Nothing was released, deployed or
published externally, and contact delivery remains OFF.

## Confirmed root cause of the hosted failure

Both hosted jobs failed at `Run production HTTP and browser (U03 published Pages, restored afterwards)` with:

```text
FAIL  DURABLE_FAMILY_SOURCE the appended sections are the composer's own output
verify-u03-published-http: the durable family source proof failed; no build was attempted.
verify-u03-published-http: 68 passed, 1 failed
```

The durable Page is deliberately never rewritten (`UNO-WO-123 / R06`), so it still carries the *historical* Features outline — a `layout.stack` wrapper with an authored level-2 heading, a plain prose lede and an ordinary `layout.grid` of `itemSemantics: "list"` stacks — while the adapter now composes the accepted native `layout.grid` **features** node (`UNO-WO-125 / R05`). The unit suite and the C2 evidence knew that three sections differ; the production verifier still permitted only two:

```text
committed vs composed differing ids: ["family-5-gallery","family-15-cards","family-16-features"]
verifier permitted:                  ["family-5-gallery","family-15-cards"]
```

Reproduced with the real gate before any edit (log above), and independently with a differential probe over the real composer and the committed bytes. The defect was a stale allow-list in one production predicate, not a fault in the Features implementation, the durable Page or the composer.

## Exact changes

- `scripts/u03/durable-features-equivalence.mjs` (new): one pure comparator, `featuresEquivalenceDelta`, deciding eight load-bearing clauses between the historical wrapper and the native node — stable identity and module pairing; representation (three committed children, authentically childless native node whose empty consumer list is non-enumerable); authored heading and its level 2 on both sides; authored lede with no invented Markdown declaration; authored column intent; unit count, order and titles against the level-3 title contract; absence of body, bodyMarkdown, icon, meta, image, action and surface; and closed authored key sets on both sides, so a dropped field and an extra field both fail.
- `scripts/verify-u03-published-http.mjs`: the appended-section predicate now permits exactly the three representation differences and still requires every other appended section to be byte-identical; a new semantic check credits Features only when the comparator holds **and** the composed node is recognised as a native features grid; a second check requires the composed node to be childless and to survive the strict Page reader round-trip; the served-HTML phase now pins the Features family to its authored heading, lede and three unit titles in order and requires the native icon treatment to be absent.
- `tests/deployment/u03-durable-features-equivalence.test.mjs` (new): 38 assertions over the real fixtures. One test pins the baseline as eight true clauses; one refuses a missing node; 36 mutation cases each require a named clause to fail after altering, dropping, adding or reordering units, altering headings, levels, lede or columns, inventing an icon, body, meta, action or surface, crossing a module or id, authoring a native `children` list, adding a wrapper child, adding a wrapper prop, or dropping the committed grid.
- `tests/deployment/u04-22-module-consent.test.mjs`: the hermetic guard now requires the new labels, the comparator import and call, the reader acceptance, the childless requirement and the served icon refusal, and its neutering list proves each clause is load-bearing.

## Security

A fresh full-graph audit reported one moderate development-only finding absent from the earlier record: `GHSA-g3hv-75wg-m249` on `minimatch` (`>=7.0.0 <11.0.1`), reachable only through `@typescript-eslint/*`. A patched range is published, so the repair was adopted instead of waived: `@typescript-eslint/parser` and `typescript-eslint` moved 8.72.2 → 8.74.0, which depends on `minimatch ^11.0.1`. No override, no suppression and no waiver was added. `pnpm audit` now reports **no known vulnerabilities** on the unfiltered graph; the production audit was already clean. The retired picomatch disclosure is preserved as history in `pnpm-workspace.yaml`; it was never repaired, only retired from the reported graph. The review date 2026-12-18 needed no extension because nothing was extended.

## Executed verification (local, Node 26.13.1, pnpm 11.6.0)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | clean |
| `pnpm audit --prod --audit-level high` / `pnpm audit --audit-level high` | clean / **no known vulnerabilities** |
| Node 26, security-floor, brand-copy and exception suites | 31 pass; exception guard ACCEPTED |
| Bootstrap | 19 tests, scaffold verifier OK |
| Architecture | 47 pass |
| Lint / typecheck | clean, no suppressions |
| Unit | 1427 pass, 36 files |
| Deployment suites | **388 pass, 0 fail** (349 + 38 new equivalence + 1 minimatch repair) |
| U04 JSON vertical slice (test + production HTTP/Chromium) | pass, byte-exact restoration |
| Production build / bounded trace | compiled, zero warnings; only declared inputs ship |
| U01 production HTTP | OK |
| U03 locale and discovery refusals | OK |
| U03 published Page HTTP + Chromium | **1005 pass, 0 fail** (was 68 passed / 1 failed before the build) |
| U03 fixture transaction | 28 pass; fixtures restored byte-exactly |
| Multi-Site contract + HTTP | pass; two-phase restoration byte-exact |
| U04 22-module and consent gate | **969 pass, 0 fail** |
| Closure oracle (unchanged) | C2 reproduced: `U04_PARITY=15/17`, `U04_PROXY=57/59`, `PARITY_FEATURES=PASS`, `PARITY_CARDS=PASS`; closed interim still 14/17 and 56/59 |
| Deployment readiness | PASS, `VERCEL_NOT_DEPLOYED_BY_AGENT` |

## Checkpoint D earned — all seventeen families

The same unchanged evaluator, fed only evidence this run executed, now credits **every** family and returns `U04_PARITY=17/17`
and `U04_PROXY=59/59` under the declared **D** checkpoint, with `PARITY_ACTIONS=PASS` and `PARITY_CONTACTFORM=PASS`. `actions`
and `contactForm` each earned seven dimensions:

| Dimension | `actions` | `contactForm` |
| --- | --- | --- |
| source | Composed `content.actions` with two authored same-document targets, frozen props, ids unchanged | Composed `interaction.contact` with props exactly `{}`, reference validated then discarded |
| reader | Strict reader re-accepting both targets from serialized JSON | Strict reader re-accepting the empty node |
| renderer | Served `<ul class="uno-json-actions">` of two `<li>` and two native `<a>`, authored order, no control | Served `<section class="uno-json-contact">` with only the fixed OFF line, no control or echoed reference |
| http | Accepted production response that delivered the list | Accepted production response that delivered the notice |
| browser | Chromium at 390 and 1280: exactly two reachable same-document links | Chromium at 390 and 1280: visible inert notice plus same-document navigation that reaches it |
| refusal | Seven closed refusals: external, mail and site-route destinations, unknown target, nested target, unknown field, empty label | Six closed refusals: missing acknowledgement, mismatched reference, non-`delivery-off` mode, unacknowledged reference, donor delivery field, invalid grammar |
| rights | Ledger row source identity under the ledger's Apache-2.0 donor declaration | Same provenance chain |

The C2 row (15/17, 57/59), the Cards interim (14/17, 56/59) and every earlier checkpoint stay reproduced as history. The
`features` rights predicate was tightened from a case-insensitive `MIT` match — which "limit" could satisfy — to the ledger's
real chain: the row must name its `page-document.ts` donor provenance and the ledger must declare the donor licence.

Contact remains presentation-only: delivery is switched off, no provider, recipient, credential or submission path exists.

## Hosted CI at the corrected head

`1485354` was pushed non-force (`58ac18c..1485354`) and every check run at that exact SHA completed successfully:

| Check run | Status | Conclusion | Completed |
| --- | --- | --- | --- |
| `verify (ubuntu-24.04)` | completed | **success** | 13:19:35Z |
| `verify (windows-2025)` | completed | **success** | 13:21:06Z |
| `verify (windows-2025)` (bootstrap) | completed | **success** | 13:16:15Z |
| `verify (ubuntu-24.04)` (bootstrap) | completed | **success** | 13:16:04Z |


## Authorization and outstanding work

- `1485354` is pushed and green on both hosts. This increment (the D row and its guard) is local only; a further push needs
  separate Owner authorization.
- U04 remains **OPEN** on its non-family obligations, which family parity does not satisfy: one coherent presentation shell,
  accessible responsive navigation and public Page locale behaviour, keyboard access and visible focus, semantic markup,
  contrast and dark-mode and reduced-motion behaviour, the 320/390/768/1280 matrix, owned-asset licensing boundaries,
  validated configuration and fail-closed behaviour, and the absence of unauthorised publication or data exposure.
- Independent acceptance is the Chief Master Architect's; this report does not self-accept or self-close the stage.


## U04 presentation shell — requirement to evidence

The Owner's eleven exit obligations were audited against the implementation and the executing gates. Two genuine gaps were
found and corrected, in that order: the **published** shell had a `<main>` with no `id` and no skip affordance (they existed
only on the demonstration route), and it had no cross-Page navigation. Everything else was already implemented and is now
backed by executed readings rather than by the existence of a test.

| Requirement | Implementation | Executed evidence |
| --- | --- | --- |
| One coherent shell | `src/app/(site)/[...segments]/layout.tsx` (one `<html lang>`), `page.tsx` (skip link, header, one `<main id="main">`), one stylesheet | U04 gate 320/390/768/1280: exactly one main landmark, one skip anchor first in the body, overflow 0 |
| Accessible, responsive navigation | `planUnoSiteNavigation` + `deployment/site.config.json`, rendered as `header > nav[aria-label] > ul > li > a` | Published gate: 324 `SHELL_NAV` readings — order, authored labels, destinations, `aria-current`, keyboard reach with the token ring, four widths, no overflow |
| Public Page navigation and locale | Serving composition, canonical/`hreflang`/`x-default`, alias redirect, 404 boundaries | Published gate: each Page declares its authored language; x-default only where authored; sitemap and robots agree; Multi-Site gate byte-exact; no destination outside the served Page's locale |
| Keyboard operation and visible focus | Global `:focus-visible` 3px token ring; disclosures, tabs, modal, table scroll and every nav destination | U04 gate: skip link is the first Tab stop, becomes visible, ring is 3px solid `--uno-focus`; Enter lands on `#main`; published gate: every nav destination is a Tab stop with the same ring |
| Semantic markup and interactions | One `<main>`, one `<h1>`, native `ul/ol/figure/details/blockquote/table` and `nav/ul/li/a` | U04 gate: 17 family ids in order, unique ids, level-3 outlines, native disclosures, table scopes |
| Colour contrast, light and dark | Tokenised palette with `prefers-color-scheme: dark` | U04 gate: measured WCAG ratios at four widths — light and dark, body ≥ 4.5:1, large ≥ 3:1 |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` clamps transitions and motion modules | 16-case matrix (four widths × two schemes × two motions), the dark/reduced family loop, and the nav present under dark+reduce |
| Responsive 320/390/768/1280 | Fluid shell, no fixed widths, wrapping navigation | `MATRIX_WIDTHS` matrix and `SHELL_NAV_WIDTHS`: zero horizontal overflow in every case |
| Owned-asset confinement and licensing | Owned-media policy, four zones, binding ceilings, ledger provenance | U04 gate: 4/4 zones, 22/22 modules, owned locators only; ledger rows record donor source and Apache-2.0 |
| Validated configuration, fail-closed | Declaration validation, closed refusals, strict reader, presentation envelope | Readiness 131 checks; published gate refusals; 22-module refusal matrices; `VERCEL_NOT_DEPLOYED_BY_AGENT`; invalid presentation removes navigation and leaves Pages served |
| No unauthorised publication or exposure | Delivery-OFF contact, no provider call, no private path or credential in the payload | Readiness and trace gates; U04 gate contact refusals; bootstrap leak scan; navigation advertises no refused or unlisted address |


## U04 navigation — the remaining obligation, resolved

Navigation is implemented inside the existing shell: no navigation Page module, no change to the 22-module vocabulary, no
reopening of the family campaign, no new dependency.

**The configuration is not authority.** `deployment/site.config.json` (version 1, closed envelope) declares, per Site, an
optional brand name plus home Page id, and an ordered list of Page-id references with optional per-locale label overrides. It
cannot publish, unlist, redirect, translate, bind a Site or invent a destination: it is read through a fixed declaration path
like the other two, validated by `validateUnoPresentationConfig` with a closed refusal vocabulary, and it only *orders and
names* what the routing authority already accepts.

**Navigation is derived.** `planUnoSiteNavigation` builds entries from the Site's **accepted** plans only, requiring
`delivery.public`, `!delivery.unlisted`, `document.visibility === "public"`, the same facet and Site id, and the current
locale. A reference to an unlisted, unpublished, foreign, malformed, refused or missing Page yields no entry at all — never a
link, never a refusal of the Page being served. `href` is always `identity.pathname`, the address the routing authority
decided, so no base path, locale prefix or redirect can be invented, and labels are the target Page's own authored title
unless the configuration authors an override for exactly that locale.

**The shell renders it natively.** One `<header>` with an optional brand link and `<nav aria-label="Primary"><ul><li><a>`,
`aria-current="page"` on exactly the served Page when that Page is offered, the same 3px `--uno-focus` ring on every
destination, and the existing wrapping layout. Absent configuration renders no navigation; a malformed file removes
navigation and leaves every Page served. The skip link stays first; the demonstration route is untouched; the build's traced
payload now includes the presentation file, and the trace gate refuses an authored-but-untraced one.

**Evidence.** 324 `SHELL_NAV` readings in the published gate over the committed starter Pages and then the two-locale
fixture; 17 unit tests pinning the validator, the planner, every exclusion, the locale-isolation case and the agreement
between the committed configuration and the committed manifest; a deployment guard requiring each clause and each route
attribute, and refusing their removal or neutering; and a trace-gate rule for the optional declaration.

## Verification — current head (local, Node 26.13.1, pnpm 11.6.0)

| Gate | Result |
| --- | --- |
| U04 22-module, consent and closure | **996 checks, 0 failed** (unchanged closure oracle: 17/17 and 59/59) |
| Published Page HTTP + Chromium | **1329 checks, 0 failed** (1005 + 324 `SHELL_NAV`) |
| Deployment suites | **400 passed, 0 failed** |
| Unit / architecture / bootstrap | 1444 / 47 / 19 pass |
| Lint, typecheck, build, trace | clean, zero warnings; only declared inputs ship |
| Readiness, Multi-Site, U01/U03 HTTP | pass; no known vulnerabilities |

## Proposed U04 closure determination (for independent acceptance)

**Not self-accepted.** Every one of the eleven obligations now has an executed reading. The proposed determination is:

- **Satisfied:** one coherent shell; accessible and responsive navigation; public Page navigation and locale behaviour;
  keyboard operation and visible focus; semantic markup and interactions; contrast in both schemes; reduced motion;
  responsive operation at 320/390/768/1280; owned-asset confinement, provenance and licensing; validated configuration and
  fail-closed behaviour; absence of unauthorised publication, external delivery and private-data exposure.
- **Outstanding limitation:** the presentation entry is authored per Site. A Site added to the manifest without one is served
  correctly but carries no navigation until an operator authors it — the designed fail-closed behaviour, covered by a test.
- **Recommendation:** accept U04, and authorise U05 to begin at safe contact functionality and approved integrations.

## U05 — approved website functionality

The inspection came first: `mailto:`, `https` and same-document actions were already admitted by the unchanged
`classifyAuthorDestination`, the contact module was already a truthful delivery-OFF surface, and public-only property exposure
already held. What was genuinely missing was a contact *interface*, an optional server-only transport, and opt-in analytics —
each of which is now implemented inside the existing boundaries rather than beside them.

**Safe authored actions — unchanged and verified, not reopened.** `content.actions`, hero, card and list-item actions still
admit exactly a same-document fragment or a static `mailto:`/`https:` destination classified by the unchanged policy. That policy
already refuses unsafe schemes, credentials in an origin, protocol-relative values, character references, nested encoding,
malformed escapes, markup, whitespace, backslashes and ambiguous relative values, and it accepts the original bytes unchanged —
so a maps, directions or booking link is validated by the same rule as any other authored link. No new action kind, no embedded
engine, no geolocation.

**Contact interface (new).** `interaction.contact` now renders one accessible form — three labelled fields, `role="status"`, a
`role="alert"` summary that receives focus, `aria-invalid`/`aria-describedby` wiring, a disabled `aria-busy` submit — **only when**
the server holds a validated webhook configuration. With delivery off, which is what ships, the module renders the same inert
notice as before, so the family evidence is unchanged. Local validation refuses an incomplete form before any request, and the
form has exactly four outcomes: accepted by the configured endpoint, invalid, not delivered, unavailable.

**Server-only transport (new, OFF by default).** `POST /api/contact` validates a bounded JSON body against the closed contact
contract (three fields, declared code-point bounds, conservative mailbox, control characters refused, unknown fields refused, a
honeypot refused before any field is read), applies a bounded in-memory token bucket, and then — only with a configured
`UNO_CONTACT_WEBHOOK_URL`, `UNO_CONTACT_WEBHOOK_HOSTS` allowlist and optional `UNO_CONTACT_WEBHOOK_TOKEN` — makes one `POST` with
`redirect: "manual"`, an 8-second timeout and a bounded response read. The destination must pass the new
`classifyPublicHttpsDestination`: `https` only, no credentials, no port, no IP literal, no loopback, RFC 1918, link-local, CGNAT,
reserved, multicast or documentation address, no bare label. `accepted` is only ever a 2xx from that endpoint; a redirect, a peer
refusal, a timeout and a network failure each answer their own status. Nothing is logged, stored, queued or retried.

**Analytics (new, OFF by default).** A Site's presentation entry may carry `analytics: {enabled, endpoint}`. Absent is off;
`enabled: false` is off; `enabled: true` requires a public-HTTPS endpoint, and a declaration that fails that policy refuses the
whole presentation (`presentation:analytics-invalid`) rather than being quietly ignored. When it is on, the single client island
posts one `page-view` to the product's **own** `/api/analytics` with `credentials: "omit"`, `referrerPolicy: "no-referrer"`,
`cache: "no-store"` and no identifier, cookie or storage write; that route answers `204` and stores nothing, forwarding only to an
allowlisted public-HTTPS endpoint when an operator configured one. In the shipped state the beacon is never rendered, so no request
exists to be made.

**Boundaries preserved.** One Entity per Installation, concurrent Facets and Sites, authored full-locale representations,
validated routing and publication authority, public/unlisted distinctions, public-only property defaults, owned-asset
confinement, the single presentation shell, the 22 module IDs and the earned `17/17`/`59/59` are untouched. Exactly one
`"use client"` boundary still exists — the U04 island, which now also owns the form and the beacon — and the architecture test
requires its two, and only two, request sites to be `/api/contact` and `/api/analytics`.


| Requirement | Implementation | Executed evidence |
| --- | --- | --- |
| Safe authored actions | Unchanged `classifyAuthorDestination`; fragment or `mailto`/`https` only | Unit suite 1465 pass, including the classifier's refusal matrix; U04 gate 996/0 |
| Independent accessible contact UI | `interaction.contact` → one island form, native validation, status region, alert summary | Published gate: form absent and notice present in the shipped state; architecture test pins the island contract |
| Optional server-only webhook, OFF by default | `resolveUnoContactWebhookConfig` + `deliverUnoContactSubmission` + `POST /api/contact` | Published gate: a valid submission answers `not-configured` 503 with no delivery claim; unit suite: 2xx accepted, 302 refused, 422 rejected, timeout, network error, oversized response |
| Valid and invalid input, bounds | Closed contact contract | Published gate: invalid mailbox, empty field, unknown field and honeypot each refused by name; 9 KB body → 413; `text/plain` → 415; malformed JSON → 400; unit suite: exact limit accepted, limit + 1 refused |
| Abuse protection | Bounded token bucket, honeypot, body bound, media-type check | Published gate: sixth rapid submission from one caller → 429 with `retry-after`; unit suite: burst, refill, caller isolation, eviction ceiling |
| Destination allowlisting, SSRF, redirects | `classifyPublicHttpsDestination` + `isUnoAllowlistedHost` + `redirect: "manual"` | Unit suite: 15 private/loopback/link-local/CGNAT/reserved/IPv6 destinations refused; suffix trickery refused; a redirect is answered `redirect-refused` |
| Server-only credentials, no leakage | Env read at call time; token added to the one allowlisted request | Unit suite: no error path contains the submission, the mailbox or the token; published gate: no response echoes a submitted value, sets a cookie or is cacheable |
| Accepted ≠ delivered | `accepted` only for 2xx; `not-delivered`/`unavailable`/`not-configured` otherwise | Published gate + unit suite; the UI has no success wording on any non-2xx path |
| Opt-in analytics, OFF default | Presentation declaration + same-origin beacon + `/api/analytics` | Committed config declares none; the browser proof requires zero `/api/analytics` and `/api/contact` requests on every Page; unit suite: absent/disabled/enabled/invalid declarations and the one-event shape |
| Public-only exposure, privacy, licensing | Public property defaults; no new dependency, SDK or donor code | Bootstrap leak scan, readiness PASS, `pnpm audit` no known vulnerabilities, ledger untouched |

**Verified at this head (local, Node 26.13.1, pnpm 11.6.0).** U04 gate **996/0**, with the closure oracle still crediting the D row
at **17/17** and **59/59**; published HTTP + Chromium **1379/0**; deployment suites **405/0**; unit **1465**; architecture **47/0**;
bootstrap **19**; lint and typecheck clean; build and bounded trace clean; readiness PASS; Multi-Site, U01 and U03 HTTP pass; audit
clean.

**Limitations, stated plainly.** Configured success, rejection, redirect, timeout and network failure are proven with an injected
transport in the unit suite, not against a live provider: no credential, endpoint or real submission was created and no external
delivery was activated. The enabled analytics path is proven at the contract level and its disabled path in the browser; enabling
it in a browser run would require committing an operator declaration and a destination, which remains an Owner decision. The
limiter is per-process and in-memory, so several instances each hold their own buckets.

**Authorization status.** No provider, credential, DNS record, deployment, release, tag or external delivery was created, and
analytics remain off. Both routes read `process.env` inside the request, so no value is baked into the build.

## U05 — finalization against the canonical contract

The Owner's five specific matters were resolved at their cause, and one of them changed the design rather than the wording.

**A. Contact interface independence.** The interface no longer depends on delivery being available. With a validated webhook it
renders the live form; without one it renders the same inert fields, its authored labels and its honest "delivery is switched off"
notice, and the notice is now named (`id`) and referenced by the inert field group and the disabled submit through
`aria-describedby` — so the OFF state is *described*, not merely disabled. Nothing is collected, persisted or transmitted: the
fields are `readOnly`, there is no `<form>` in the OFF state, and the module renders no transport. The describing `id` is emitted
**only when there are inert controls to describe**, so a contact node that authors no fields stays byte-identical to the earned U04
evidence — the family suite and the closure oracle (`17/17`, `59/59`) are unchanged.

**B. Outbound transport security — rebuilt around the connection, not the string.** Lexical validation alone cannot answer "where
does this name go?", so the connector resolves first: `src/adapters/net/uno-pinned-https-transport.ts` asks the platform resolver
for **every** address, classifies each one (`classifyResolvedAddress`: IPv4 loopback/RFC 1918/link-local/CGNAT/reserved/multicast/
documentation, IPv6 loopback/ULA/link-local/multicast/documentation, and IPv4-mapped and NAT64 forms unwrapped), refuses the
connection if **any** answer is private, and then dials **only the address it validated** by pinning the socket's resolver. DNS
rebinding is therefore not a race: the value that was checked is the value that is connected to, and the socket's own
`remoteAddress` is checked again against it. TLS verification uses the configured name (`servername`), not the address; the exchange
has no pool (`agent: false`), a connect bound, a header bound, a response-body bound and a whole-exchange bound; and a `3xx` is a
status the caller refuses, never a second request. The contact webhook and the analytics forwarder share this one connector, so the
product has one outbound path.

**Limiter, stated accurately.** The limiter is a bounded in-memory token bucket (burst 5 per 60 s, 2,048 keys, oldest-idle
eviction) keyed by the first forwarded address. What it protects: one process against a naive flood, with memory bounded so a flood
of distinct keys cannot grow it. What it does **not** do: it is not distributed, not persistent and not restart-surviving; several
instances each hold their own budget. The gate proves both halves — five rapid submissions accepted, the sixth refused with
`retry-after`, and the refused one never reaching the destination.

**C. Analytics integrity — one policy, incoherence removed.** The demonstration route's approved `@vercel/analytics` integration
fired on every view, which contradicted the canonical opt-in/OFF default; it now renders only when an operator sets
`UNO_DEMO_ANALYTICS=1`, read at request time from an explicitly dynamic route. The product's Site analytics are a one-boolean
declaration that is **permission, never capability**: it names no endpoint, the destination is a server-only environment value, and a
beacon is rendered only when both are present. The collector is no longer an event-discarding endpoint: with no destination it
answers `503` and accepts nothing; with one it forwards the single validated event through the same pinned connector, and Uno stores
nothing. One policy, two opt-in switches, no unapproved provider, no new SDK, no storage.


**D. Enabled-state production evidence.** `scripts/verify-u05-enabled-states.mjs` installs a temporary synthetic configuration, runs
the **real production build** and real Chromium, and restores every byte. Proven: the OFF state (notice, no form, read-only
controls, no request); the seam requirement (the same loopback destination is refused with the seam off, and reaches nothing); field
labels and required/described controls; keyboard order name→email→message→submit; local validation refusing an empty and a malformed
form before any request, with focus moved to the `role="alert"` summary and `aria-invalid` on each field; the endpoint refusing the
same malformed mailbox independently; the observable pending state (`aria-busy`, disabled) and its announcement; acceptance
described as "reached the configured endpoint" with exactly one request carrying the synthetic bearer token and the three fields
only — no address, agent, cookie or clock; rejection, redirect refusal and an oversized answer each reported honestly with exactly
one request and no acceptance wording; the redirect target never followed; a timeout reported honestly, once, never retried; five
rapid submissions accepted and the sixth refused; analytics fired once per Page view only when opted in, forwarded once, with no
cookie and no foreign host; and byte-exact restoration of both the Page and the presentation, after which the OFF state returns.
**57 assertions, 0 failures.**

**E. Action and property assurance.** The approved authored actions already work through the unchanged policy: `mailto:` for a
contact address and `https:` for maps, directions and external booking are admitted; `tel:`, `javascript:`, `data:`, `http:`,
protocol-relative, credentialed and relative forms are refused as `document:unsafe-link`; and the hero, card, list-item and
stand-alone action readers all delegate to that one classifier, so no second destination rule was introduced. The contact facts exist
as the canonical keys (`contact.name`, `contact.email`, `contact.phone`), every declared `contact.*` property is `public: false`, the
renderer and the island never construct a `mailto:` or `tel:` value, and the published gate now asserts that no served Page carries a
contact transport at all.

**U05 result at this head.** Unit **1481**, deployment **405/0**, architecture **47/0**, bootstrap **19/0**, published HTTP +
Chromium **1381/0**, U04 gate **996/0** with the closure oracle at **17/17** and **59/59**, enabled-state gate **57/0**; lint,
typecheck, build and bounded trace clean; readiness PASS; `pnpm audit` no known vulnerabilities.

**U05 status: implementation and evidence complete; submitted for independent acceptance and Owner closure.** Two limitations are
stated rather than papered over: success, rejection, redirect and timeout are proven against a deterministic local receiver through
the documented test seam (never a live provider), and the limiter is per-process as described above.


## U05 — canonical contact property contract, confirmed and scoped

The Owner asked for the positive half of the property boundary: proving internal information never leaks is necessary but not
sufficient. Both halves are now covered, and the unresolved decision is named rather than invented.

**Supported: an authored public contact fact is published.** `tests/unit/u05-action-assurance.test.ts` renders a Page whose
`content.actions` section authors `mailto:hello@example.com`, and asserts the served HTML carries `href="mailto:hello@example.com"`
as a live anchor — the destination character for character, no rewriting, no `javascript:`. The same address is absent from a Page
that does not author it. That is the supported way to publish a contact fact: **author it as content**.

**Unresolved, stated explicitly.** The property layer is closed and its `public` boolean is authorship metadata only —
`src/core/efs/properties.ts` says so in terms ("in U02 it never projects anywhere"), and the test asserts that sentence still holds.
There is therefore **no** property-to-Page projection: marking `contact.email` public does not render anything, and this increment
did not invent one. The canonical schema decision that remains open is whether public properties should project at all and, if so,
how a projected value is named, escaped and placed. Until the Owner decides, the authored-content path above is the sanctioned
behaviour, and the private path stays proven: every declared `contact.*` property is `public: false`, the renderer and the island
never construct `mailto:`/`tel:`, and the published gate asserts no served Page carries a contact transport.

## U06 — independent distribution: defect found, cause corrected, distribution proven

**The first actual divergence.** The development runtime served `/en-001` with `200`; both clean-room installations answered `404`
from the demonstration's global not-found shell while `/` answered `200`. The route manifests were identical, the compiled site route
was present, and the declarations and content sources were present. Instrumenting the installed release directly produced the
answer: the installation was entered through a **directory junction**, `process.cwd()` reported the link path, and
`src/adapters/efs/uno-confined-source-reader.ts` refuses a root whose `lstat` says `symlink` (`root:symlink`). Every publication
decision therefore refused, and only the static demonstration route survived. The distribution was never broken; the installer's
blue/green **link** design was, and the product's confinement rule was correct and was not touched.

A second, smaller harness fault was found and removed: the gate had been rewriting `base.canonical` to `http://localhost:<port>`, and
an `https`-only canonical is refused, which produced the same `404` for an unrelated reason. The gate now edits nothing and proves the
release as shipped.

**The correction.** The installer no longer creates any link. An installation is a real directory holding `installation.json`, a
generated `start.mjs`, and `releases/<name>-<version>-<digest12>/` — each release a real directory, built in place, so no
package-manager link dangles and no served decision ever sees a symlinked root. `installation.json` names the active release and
carries that release's own digest, version, commit and preserved list; the launcher reads the record and starts the server **in** the
active release's directory. Rollback is a record change that restores the previous release's own identity, and the release it
replaces is kept for inspection. The installer also records how dependencies were obtained (`--offline` first, registry fallback) and
refuses a release path that is itself a link (`install:release-path-is-a-link`).


**Executed evidence — `scripts/verify-u06-distribution.mjs`, 195 assertions, 0 failures.** Packaged from the working tree and
transferred to a fresh location; the transferred copy keeps the packaged digest; two installations into empty directories **outside
the repository** succeed and record the same digest; each installation is a physical directory whose active release is physical and
inside it; each is started through the documented `start.mjs`; and against each, from real HTTP carrying the declared authority: the
demonstration root answers `200` and stays unindexed; `robots.txt` names the declared sitemap; `sitemap.xml` lists one address per
published Page on the declared canonical origin; every one of those addresses serves `200` with its own `rel="canonical"` and its
authored `lang="en-001"`; Home, About and Components render their authored JSON and Markdown; one navigation landmark marks
`aria-current="page"` and links every other Page; an unowned media address is refused; an unpublished address answers a genuine `404`
that is not a Page; no authority is redirected to another origin and a refused address is refused under any authority; the declared
canonical authority also serves the home Page; contact is OFF (no form, no transport, `POST /api/contact` → `503 not-configured`, no
GET); analytics is OFF (no beacon, `POST /api/analytics` → `503`); no served Page exposes an installation path or `deployment/efs`;
and the operator guide ships and answers all nine required topics.

Distribution mechanics are proven alongside: a genuine upgrade to a **different** release (one source comment, re-digested, so it is a
valid release in its own right) moves the active release, preserves the adopter's Page and presentation byte for byte and records what
it preserved, and the upgraded installation is then re-proven operationally; a modified file and an unlisted file are each refused by
name and change nothing; rollback restores the release that was running **and** that installation is re-proven operationally; an
interrupted install leaves the previous complete active release and no incomplete release behind; and the same tree packages to the
same digest twice.

**Blocking pipeline.** `pnpm test:distribution` runs the gate, and `.github/workflows/verify-u01.yml` runs that script as a blocking
step on both hosts, after the readiness step. The clean-room proof is no longer an optional local exercise.

**A Linux-only gate defect, found by that step and corrected.** The first hosted run of the distribution step did not finish on
Ubuntu: the gate's readiness loop swallowed every error and retried until its two-minute bound, so a defect in the harness looked
like a slow installation, and a killed launcher left its server running on POSIX. The gate now starts the installation server in its
own process group, kills the group on shutdown, retries only genuinely transient connection errors and rethrows anything else at
once, and every child command the installer runs is bounded. After that correction `fb83169` passes the step on both hosts.

**Not claimed.** No public release, tag, deployment or domain activation was performed, and none is claimed.

## U07 — release-candidate readiness: requirement-to-evidence matrix

The release candidate is the committed tree at the pushed head. Its packaged identity is **`provelopment-foundation-uno@0.1.0`,
85 files, tree digest `798bdab8d89fe18c1d1b025e0fb6e60f1a003f3e10c41f3471869b796d766e90`** (commit recorded at push). This section states the
requirement, the evidence and the result; it is submitted for independent acceptance and does not close the stage.

| Requirement | Evidence | Result |
| --- | --- | --- |
| Approved functionality (contact, transport, opt-in analytics, OFF defaults) | enabled-state gate **57/0** through the real build and Chromium; published gate **1381/0**; unit **1483** | PASS |
| Architecture and ownership integrity | `tests/architecture` **47/0**; confined reads, zero proprietary TSX, adapters enumerated | PASS |
| Source provenance and licensing | `LICENSE`, `NOTICE.md` generated from the real runtime dependency licences, no donor code; release contents asserted | PASS |
| Dependency and application security | `pnpm audit` no known vulnerabilities; security-exception guard PASS; readiness guard **132 checks, 0 failed** | PASS |
| Exact-head hosted CI | `fb83169` — `verify (ubuntu-24.04)` **success**, `verify (windows-2025)` **success**, both bootstrap runs **success**; the clean-room distribution step runs inside that job on both hosts | PASS |
| Production HTTP and Chromium | published gate **1381/0**; U04 gate **996/0** with the closure oracle at **17/17** and **59/59** | PASS |
| SEO and publication behaviour | sitemap, robots, canonical and `hreflang` assertions in the published gate and the distribution gate | PASS |
| Accessibility | U04 shell readings (landmark, first Tab stop, 3px token ring, Enter lands, WCAG AA ratios light and dark at four widths) plus the contact keyboard and focus assertions | PASS |
| Two independent clean-room installations | distribution gate: two installations outside the checkout, both operational | PASS |
| Upgrade, rollback and recovery | genuine upgrade to a distinct release, preservation, rollback with operational re-proof, interruption recovery | PASS |
| Artifact identity and integrity | per-file `MANIFEST.sha256`, tree digest, `RELEASE.json`, `SHA256SUMS`, byte-exact refusal of tampering, reproducible re-packaging | PASS |
| Operator documentation | `OPERATIONS.md` shipped and asserted across all nine topics | PASS |

**Stated limitations.** Success, rejection, redirect refusal and timeout — and the limiter — are proven against a deterministic local
receiver through the documented test seam, never a live provider; the limiter is per process; public contact properties do not
project (U05); and the demonstration route's approved `@vercel/analytics` integration is opt-in only, so the shipped default measures
nothing. Public release publication, tagging, deployment, domain activation, live analytics and external delivery remain the Owner's
separate decisions.

## U07 — live installation at uno.provelopment.com: state, corrections and the remaining blocker

**Production identity reconciled.** The GitHub head and the Vercel production deployment are produced by the repository's own Git
integration — not by an agent-initiated deployment — and `uno.provelopment.com` is assigned to that production deployment. Earlier
statements in this report that “nothing is deployed” described the agent's own actions and were wrong about the product; they are
corrected here.

**Why every Site address was refused, and the configuration that fixes it.** The neutral distribution declares the reserved,
non-routable `https://uno-starter.example`; the live installation is served on `uno.provelopment.com`. Uno does not infer publication
authority from a `Host` header, so it refused — correctly. A deployment now states its own origin through three layered statements: the
server-only `UNO_CANONICAL_ORIGIN`, the committed hosting profile `deployment/uno.deploy.json` (consulted only on a hosted deployment
and excluded from the distributable), and the platform's `VERCEL_PROJECT_PRODUCTION_URL` (production only). Every candidate is judged
by the same canonical validator, the profile may only replace the reserved example origin, and an invalid statement refuses rather
than falling back. **Proven live:** `robots.txt` names `https://uno.provelopment.com/sitemap.xml`, the sitemap lists all three Pages on
that origin with `hreflang`, and `/api/uno-health` answers `200 {"status":"serving","canonical":"https://uno.provelopment.com/en-001"}`.

**Two genuine defects found on the live path and corrected at their cause.**

1. The refusal responder (`src/proxy.ts`) makes the same serving decision as the Page, but a hosting platform bundles it separately and
   its bundle carried the authored content **without** the three declaration files. Locally it read them from disk; in production it
   could not, so it refused published addresses. The responder now distinguishes a decision it could not make
   (`serving:authority-unavailable`) from one that refused an address and continues on a read failure — the Page, which owns the same
   decision and has the declarations, remains the authority. A bundling omission can no longer become an outage.
2. The responder also matched `/api/*`, so a route handler was answered by the responder instead of by itself. `/api` is now outside its
   remit by prefix and by matcher; a handler owns its own method semantics, as it already did for writes.

An operational `GET /api/uno-health` was added and documented: it reports the decision in a closed vocabulary, carries no content,
path, environment or caller value, is `no-store` and `noindex`, and grants nothing.

**Remaining blocker, stated exactly.** On the live deployment the three Site addresses return Next's error shell (`__next_error__`, 404)
while the **same** build serves them `200` locally in three runtime shapes — webpack `next start`, Turbopack `next start`, and the
standalone server (`output: 'standalone'`, `server.js`) — and while the platform itself proves the decision is correct
(`/api/uno-health` = serving, correct canonical). The failure is therefore in **rendering** on the platform's function runtime, not in
the publication decision, the authority, the canonical origin or the distribution. Locally it is not reproducible, and this session's
Vercel MCP connection returned `Unauthorized`, so the deployment's function logs could not be read.

**Next diagnostic, in order.** (a) Read the Vercel function log for `GET /en-001` on this deployment — the throwing frame and the error
digest are the missing fact; (b) if logs stay unavailable, refactor the two-root-layout structure (`(demo)` + `(site)` with
`experimental.globalNotFound`) into a single root layout that resolves the document language from the same decision, which removes the
exact structure whose error fallback produces `__next_error__`. The second is a design change to routing shape only: same authority,
same decision, same refusals.

**U07 is NOT accepted, and the live Site does not yet serve its Pages.** Family parity 17/17, proxy 59/59, 22/22 module IDs, 195/195
distribution assertions, enabled-state 57/0 and the full local pipeline remain green at this head; the live installation does not.

**Reproduced at the cause, and what remains.** Removing the declarations locally reproduces the live failure exactly: `/en-001` renders
Next's error shell on a 404 and `/api/uno-health` answers `503 serving:authority-unavailable`. Comparing the emitted bundles shows the
asymmetry: the `route.js` bundles (`/robots.txt`, `/sitemap.xml`, `/api/uno-health`) carry the declarations, while the `page.js` bundle and
the refusal responder bundle carry the authored content but **not** the declarations — an exact-file `outputFileTracingIncludes` entry is
honoured for a route handler and silently dropped for a page bundle in this build. Three bounded attempts were made and measured, none of
which closed it: an exact-file entry under the group-qualified, page-qualified and app-path keys; the same set expressed as bounded globs;
and `vercel.json` `functions[].includeFiles`. The declaration reads were also rebuilt from literal path components, mirroring the trick the
content reader already uses; that changed no measured bundle and crossed an architectural boundary (the configuration layer must not
carry the literal `deployment/` path), so it was reverted rather than kept for its intent.

**Recommendation for the next increment, in order of cost.** (a) Read the deployment's function log for `GET /en-001`: the throwing frame
settles whether the failure is the missing declarations or a render-time throw, and this session's Vercel MCP connection returned
`Unauthorized`, so it could not be read here. (b) If the declarations are confirmed absent, carry them into the page bundle by importing
`deployment/efs/manifest.json`, `deployment/uno.config.json` and `deployment/site.config.json` as build inputs for a *verification-only*
module, so the bundler includes them by construction rather than by a tracing hint; the runtime reads stay as they are, so the fixture
gates keep working. (c) Only if both fail, replace the two-root-layout structure with a single root layout that resolves the document
language from the same decision.

**Current live state, measured.** `/` 200; `/robots.txt` 200 on the production origin; `/sitemap.xml` 200 listing all three Pages with
`hreflang`; `/api/uno-health` 200 `serving`; `/en-001`, `/en-001/about`, `/en-001/components`, `/en` and `/en-001/no-such-page` return Next's
error shell with 404. The demonstration and every discovery surface are correct; the three authored Pages are not yet served.

## U07 — resolved: the packaged function now carries what it reads, and the live installation serves

**The divergence between the health route and the Page, settled from the build artifact.** A hosting platform packages each server route
separately and decides what a function carries from the build's file trace; that trace follows *literal* path components. The declarations
were read through a path assembled from a constant, so the Page and refusal-responder bundles carried the authored content and **not**
`manifest.json`, `uno.config.json` or `site.config.json`, while the health, robots and sitemap handlers did. The cause was proved twice over:
the emitted traces showed the asymmetry directly (`page.js.nft.json` contained no declaration and no media-zone file at all — so
`outputFileTracingIncludes` was not being applied to that bundle), and removing the declarations locally reproduces the live failure
byte for byte (`/en-001` renders the error shell; health answers `503 serving:authority-unavailable`). The Architect's runtime log contained
no throwing frame because there was none: the Page was deciding, correctly, on an input it did not have.

**Correction, at the cause and inside the architecture.** The confined reader now exposes `readUnoDeclarationJson`/`Value`, which builds
each declaration path from literal components, and the owned-media reader selects each of the four zone roots the same way — keeping
`unoOwnedMediaZoneRoot` the single authority and refusing any disagreement before a read. The serving composition now reads declarations
*through* the adapter, so `src/config` touches no filesystem at all; the architecture guard was tightened to require exactly that. Every
consuming bundle — Page, responder, health, robots, sitemap and owned media — now physically carries what it reads.

**A gate that would have caught it.** `scripts/verify-u07-function-inputs.mjs` reads the emitted file traces, the contract a platform
consumes, and fails unless each consuming bundle carries its inputs; `--self-test` proves sensitivity by omitting each input in turn. It is a
blocking CI step after the build, and it fails against the previous head.

**Live installation, verified at `6376965`** (deployment produced by the repository's Git integration; the deployed tree is proven to be that
commit by copy that exists only in it, and the same behaviour was re-verified after the two gate-only commits that follow it. Final head is
`ca90989`, green on both hosts and on both bootstrap runs; it changes only test gates, copy contracts and evidence, so the served product
is identical to what was verified. Distribution at that head: 90 files, digest
`604e191ab0f4f4f1a11c00e779d43bf8dfa34999fdff48fd608937825fd37075`.

| Address | Result |
| --- | --- |
| `/` | 200, `lang=en`, `noindex, nofollow, nocache` preserved |
| `/en-001`, `/en-001/about`, `/en-001/components` | 200, `lang=en-001`, canonical on `https://uno.provelopment.com/…`, `index, follow` |
| `/en` | 307 → `/en-001` (the declared locale alias) |
| `/robots.txt` | 200, sitemap on the production origin |
| `/sitemap.xml` | 200, three authored URLs with `hreflang` |
| `/api/uno-health` | 200 `serving`, canonical `…/en-001` — agrees with the Page |
| `/en-001/no-such-page`, `/zzz` | genuine 404 with the approved refusal document |
| `/uno-media/en-001/components/{0,1,2}` | 200 `image/png` (owned media) |
| `/uno-media/en-001/0` | 404 (undeclared occurrence refused) |

**Visual and interaction review** (pinned Chromium, 320/390/768/1280 px, light and dark, reduced motion): sixteen page-and-width combinations,
all 200, no overflow, no broken image, no console error, no uncaught exception, no failed request. Skip navigation is the first keyboard stop
and moves the document to `#main`; focus rings are visible at every stop; the four native disclosures toggle; the table carries scoped header
cells; the delivery-off notice is present and no form is served. Measured: TTFB 61–62 ms, LCP 412 ms (Home) and 432 ms (Components), nine
resources. Evidence: `.documents/Reports/evidence/u07-live/`.

**Demonstration corrected.** The false statement that publication selects one public Site at a time is replaced with the concurrent-Sites
truth; the future-tense descriptions now describe what is implemented and verified; and the demonstration's primary call to action opens the
published Site, with Home, About and Components linked directly from it. The retired claims are pinned in the copy contract so they cannot
return, and the non-indexable policy is unchanged.

**U07 evidence is complete and submitted for independent acceptance.** Contact and analytics remain OFF on the live installation and no
provider, credential, tag or release was activated.

**One environment-only failure, corrected honestly.** The published-Pages step failed on the hosted Ubuntu runner while passing on Windows and on
Linux in a clean container with a real clone, a real build and the pinned Chromium (1381/0). Its cause class was a `networkidle` navigation:
network silence is a convenience, never a correctness condition, and a streamed RSC response or a keep-alive connection can keep one open on a
slower runner. Every navigation in the browser gate now waits for `load`, attempts quiet for a bounded five seconds and proceeds; the assertions
are unchanged, and both hosts are green at `ca90989`.

## Assurance concluded — independent acceptance, evidence reconciled, one scope decision open

**Independent verification and acceptance, recorded.** The Architect confirmed GitHub and Vercel production HEAD both at `ca90989`, both hosted
verification workflows successful, the demonstration and the three authored Pages serving, the production canonical URLs and locale declarations
correct, discovery, health, owned media and not-found responses correct, and the committed visual evidence sufficient to accept the responsive
starter. Operational production readiness is accepted. The production serving defect is closed. Nothing in this section is a self-assessment:
the acceptance is the Architect’s.

**Provenance, stated plainly.** Two kinds of statement appear above and they are not interchangeable.

- **Measured by the repository's own gates and evidence runs** — statuses, headers, languages, canonicals, robots directives, media types,
  overflow, broken images, console and request failures, focus order, disclosure state, structure counts, and the timing table (TTFB 61-62 ms,
  LCP 412/432 ms, nine resources). These come from the pinned Chromium and plain HTTPS requests, are reproducible, and are reported as measured
  values rather than certified performance.
- **Inspected independently** — the Architect’s review of the committed screenshots and of the live installation. That inspection is what the
  acceptance rests on; the measurements support it and do not substitute for it.

**Skip navigation, reconciled by a targeted re-test (no deployment).** The stored interaction JSON showed `firstFocus: null` and an empty hash for
one probe while the narrative reported a working skip link, so the reading was re-taken. From a fresh document, with no programmatic focus, one
Tab then Enter: the first keyboard stop is the skip link (`href="#main"`), activating it performs the fragment navigation and the reading
position moves to the landmark. `document.activeElement` remains `body`, because `<main id="main">` carries no `tabindex` — standard browser
behaviour for a fragment target that is not focusable. The earlier probe began from a page whose focus was already deep in the document, so it
measured a different start condition rather than different behaviour; the record is retained and labelled, and `skipRetest` in the same file is
now authoritative. An optional future improvement — `tabindex="-1"` on the landmark, which would also move the focus ring — is noted for the
next meaningful update and is **not** treated as a release defect, so no production change was made for it.

**Function-input gate, stated for what it is.** `scripts/verify-u07-function-inputs.mjs` enforces a **named** list of required inputs per
consuming bundle (the three declarations, the starter Home source and the owned-media zone for the Page; the declarations for the responder,
health, robots, sitemap and media bundles). It detects the defect class that broke production — a bundle that reads an input it does not carry —
for those named inputs. It does **not** discover new authored sources or assets by itself: a future input must be added to the contract by hand,
and `--self-test` proves only that the named requirements are enforced rather than merely reported.

## Open decision — U05 validated public contact-property projection

One decision remains. It is a scope decision, not a defect, and it is the only thing between the current release candidate and a clean release
statement.

**What exists today.** Publishing a contact fact is supported by authoring it: a Page whose `content.actions` authors `mailto:` or `tel:` renders
that destination character for character as a live anchor, and a Page that does not author it carries nothing. The closed property layer’s
`public` boolean is authorship metadata only and projects nowhere; every declared `contact.*` property is `public: false`, the renderer and the
island never construct `mailto:`/`tel:`, and the published gates assert no served Page carries a contact transport.

**Option A — complete the canonical projection.** Define an approved contract for how a validated `public` contact property is named, escaped and
placed in a Page, implement it, and gate it. Cost: an EFS schema decision plus renderer, presentation and publication-gate changes across the
property boundary — a contract change on the release path, with new canonical decisions (naming, escaping, placement, precedence against authored
content) that the Owner would have to approve before implementation.

**Option B — formally defer it from `0.1.0`.** Record that projection is out of scope for the first release, keep authored content as the
sanctioned way to publish a contact fact, and keep the property layer closed.

**Recommendation: Option B.** The user-visible capability already exists through the authored-content path and is proven in both directions; the
property layer is private and closed, which is the safer default. Deferring is explicit rather than silent, and it moves no contract onto the
release path for no new user-visible capability.

**Exact consequence of deferring.** For `0.1.0`, an adopter who marks `contact.email` public and authors no action sees **no** contact address
rendered: the flag has no rendering effect, and nothing leaks either. To publish a contact address, the adopter authors it in Page content. If the
Owner later approves Option A, that is a normal, separately gated increment rather than a correction.

## Release handoff

| Item | Value |
| --- | --- |
| Product | `provelopment-foundation-uno@0.1.0` |
| Git HEAD | `ca90989` (GitHub and Vercel production identical) |
| Hosted verification | both workflows successful on both hosts and both bootstrap runs |
| Distribution | 90 files, tree digest `604e191ab0f4f4f1a11c00e779d43bf8dfa34999fdff48fd608937825fd37075` |
| Production | `https://uno.provelopment.com` |
| Contact delivery | OFF |
| Analytics | OFF |

**Preserved and unchanged by this assurance pass.** The two independent clean-room installations, upgrade, rollback and recovery, the
security and privacy controls, licensing, the accessibility and responsive evidence, the 17/17 family parity, the 59/59 proxy parity, the 22/22
module identities, and the hosted cross-platform verification at `ca90989`.

**Not done, and not authorised here:** no release tag, no published package, no provider activation, no credential, no domain change, and no
deployment for this report. The stable production installation at `ca90989` was preserved exactly as the Architect verified it.

**Where this record lives.** These assurance notes are committed locally on top of `ca90989` and are deliberately **not** pushed, so that no build
is spent publishing a report. They ride with the next meaningful, verified repository update, as directed.

**Open items for the Owner.** One: the U05 projection decision above (recommended Option B). Everything else in Foundation Uno is verified and
operational.

## Completion pass — Owner-directed parity, hexagonal architecture, Connect, contact and Resend

**Applied direction.** The prepared roadmap amendment `1d91c09` was cherry-picked onto the local assurance history as
`e0f3685`, so `11dff19` and `b8927b8` are preserved. The Foundation reference is pinned at `fa599973` and `ca90989`
remains the last deployment. Nothing here is self-accepted; it is submitted for the independent audit.

**1. Modular hexagonal architecture, enforced rather than arranged.** Layers are now proven by a resolved-edge gate
(`scripts/verify-uno-module-boundaries.mjs`): **78 files, 169 resolved edges, 0 violations**, covering static imports,
type-only imports, `export … from`, side-effect imports and dynamic `import()`. Its `--self-test` builds a temporary
tree with one violation of each kind — a Node import in the framework-free core, an inward layer escaping outward, an
unresolved specifier, a client component importing a server adapter, and a cycle — and fails unless all five are
reported.

Responsibilities were moved, not renamed:

| Responsibility | Before | After |
| --- | --- | --- |
| Whether a form may render or submit | the route and a boolean prop | `src/core/contact/uno-contact-authorization.ts`, one policy for both |
| The message a provider receives | the route | `src/core/contact/uno-contact-message.ts` |
| Which transport exists | the route | `src/adapters/mail/uno-mail-transport-selection.ts` behind `src/core/ports/uno-mail-transport.ts` |
| Which modules this build enables | implicit | `src/composition/uno-composition.ts`, consulted by the serving path |
| Deployment environment names | `src/config` (reached by an adapter) | `src/core/deploy/uno-deploy-environment-names.ts` — a real violation the new gate found and this pass fixed |

**2. Module extensibility, proved by exercise.** `src/core/modules/module-registry.ts` is a typed, versioned,
fail-closed registry; `src/components/uno-module-host.tsx` is the only bridge to React. `tests/unit/uno-module-registry.test.ts`
registers an additional synthetic module, validates its props through its own reader, invokes and renders it, disables it
(render and validate both refuse), then removes it — and separately proves the refusals for an unknown capability, an
incompatible version, a duplicate, a missing dependency and a removal another module still requires. No unrelated
module, Page-document rule, routing policy or EFS declaration was edited to achieve it.

**3. Connect incorporated; licensing reconciled.** `src/connect/` is an adapted subset of the Owner-owned Connect
module (`modules/connect/src` at `fa599973`), incorporated under Uno’s Apache-2.0 `LICENSE` by the Owner’s direction of
2026-11-28. `src/connect/PROVENANCE.md` records the exact upstream contracts, the adaptation and the boundaries; the
distribution notice now states the incorporation instead of claiming no donor source ships. There is no external
Connect runtime, package dependency or submodule, and no earlier exclusion survives.

**4. Public contact and SIMPLE enquiries.** Publication and delivery are now independent, and neither is inferred.

- **Exposure is explicit.** `src/core/efs/properties.ts` gained one exposure token, `publicContact`, admissible only on
  `contact.email`/`contact.phone`, only with `public: true`, and never with a suppressed (`null`) value. `public` alone
  still publishes nothing.
- **Connect decides.** `projectPublicContact` answers `available`, `absent` or `unavailable` — three outcomes, never a
  boolean — keyed by the verified Site, checked against the verified authorisation reference and the Page’s own
  publicity, and it builds the finished `mailto:`/`tel:` itself. A mailbox that could carry a header, a parameter or a
  second recipient is refused.
- **Provenance survives.** `src/application/project-uno-public-contact.ts` carries the declaring level and identifier
  into the projection, so an inherited fact is published with the ancestry that authorised it.
- **One slot, resolved.** A Page asks with a declared `linkId` of `public-contact-email`; an unresolvable reference
  renders inert text. The demonstration now declares `contact.email` publicly and exposes it, and Home renders the live
  `mailto:hello@example.com`.
- **Submission re-establishes everything.** The handler re-plans the claimed Page through the same publication
  authority, reads the form reference from that Page’s own validated document, and refuses a claim that disagrees with
  what it proved. Render and submit share one policy, so they cannot disagree.
- **Bounded and closed.** The body is read as a bounded stream (8 KiB, reading stops at the bound), the origin must
  agree with the host when present, the honeypot is checked first, exactly one transport attempt is made, and there is
  no queue, retry, scheduler or store.
- **Truthful outcomes.** `off`, `unavailable`, `unauthorized`, `invalid`, `accepted`, `accepted-not-sent`, `refused`
  and `ambiguous` each render their own sentence, from localized copy (English and Spanish, with an English fallback).

**Findings from the earlier source audit, resolved:** the section-derived Page path (`page="/${node.id}"`) is gone —
the form posts the served route path; an unverified POST now re-plans the Page; whole-body buffering is replaced by a
bounded stream; duplicate DOM ids cannot occur because one Page declares at most one form reference; and global
enablement is replaced by three independent facts (a Site-authored contact fact, a Page-declared form, an
operator-selected transport).

**5. Optional Resend adapter.** `src/adapters/mail/uno-resend-mail-transport.ts` sits behind the mail port: one fixed
HTTPS destination, pinned resolution with private answers refused, no redirects, bounded request/response/exchange,
a sending-only key read at call time, a domain-restricted sender, server-allowlisted recipients, a validated visitor
`Reply-To`, plain-text-only messages, an opaque idempotency key, and closed redacted diagnostics. It ships with
`deployment/uno.env.example` (placeholders only) and `.documents/Architecture/connect-mail.md` (account security,
dedicated subdomain, SPF/DKIM/DMARC, key creation and least privilege, secret storage, environment separation, testing,
monitoring, rotation, revocation, disable and incident response). No key exists, no DNS record was touched, no provider
was activated and no real message was sent.

**6. Verification at this candidate.**

| Gate | Result |
| --- | --- |
| Unit (vitest) | **1513 pass, 0 fail** across 44 files |
| Architecture (`u01-boundaries`) | **47 pass, 0 fail** |
| Resolved dependency boundaries | **78 files, 169 edges, 0 violations**; self-test reports all 5 injected kinds |
| Lint / typecheck | clean |
| Production build | succeeds; `/`, the three Pages, `robots.txt`, `sitemap.xml`, `/api/contact`, `/api/analytics`, `/api/uno-health`, owned media and the proxy all emit |
| Function-input contract (`verify-u07-function-inputs`) | **6 pass, 0 fail** (named inputs per consuming bundle) |
| Packaging trace (`verify-u03-trace`) | only the declared inputs and authored sources ship |
| Distribution (`verify-u06-distribution`) | **195 pass, 0 fail** — two independent clean rooms, upgrade, rollback, recovery, reproducibility, contact OFF |
| Bootstrap | **19 pass, 0 fail** |

**Distribution identity at this candidate:** 108 files, tree digest
`73291436b0645a8b32fe09614ff3c58314ffbf4721cbf9d221f3c7fe210418e0` (it supersedes `604e191a…`, which described the
previous 90-file tree).

**7. What this pass did not do — stated, not hidden.**

- **Full Foundation parity is not claimed.** The family inventory (17/17), proxy parity (59/59) and module identities
  (22/22) measured slices, not the whole product. Remaining applicable gaps, carried forward explicitly: maps and
  directions adapters, a booking adapter, the OpenGraph image route, the contact-inquiry webhook provider variants and
  the video provider adapters. Each is a deliberate deferral chosen to keep this pass verifiable, and none is described
  as done.
- **Abuse protection is per instance.** The in-process limiter is not distributed, and the operator guide says so.
- **Connect is an adapted subset.** The upstream runtime, Hub/Spoke registry and durable delivery are not part of Uno and
  are not implied by SIMPLE.
- **No live provider.** Resend is proved with deterministic mocked responses only; contact delivery and analytics remain
  OFF in production.
- **No independent audit has occurred.** This report is the Implementation Agent’s statement of what was built and
  measured; the Architect prepares the audit, and the auditor inspects the codebase rather than this narrative.

