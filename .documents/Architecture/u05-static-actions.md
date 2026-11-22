# U05 — transport-free authored static actions (`UNO-WO-081 / R01`)

This is a bounded source/assurance note for one capability, not a governance file, a U05 stage exit or a parity claim.
It records what was added to the stand-alone `content.actions` module, what it deliberately does **not** do, and which
obligations remain open.

## 1. Provenance, rights and notice

New work here is original **Uno-authored**, rights class **`NEW / COMPOSE`**. The pinned read-only donor
`provelopment/provelopment-foundation` at `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` was consulted only for context:
its Apache-2.0 `LICENSE` (`d645695673349e3947e8e5ae42332d0ac3164cd7`) and the two reference files
`src/components/site/page-sections/text-sections.tsx` (`caeee57798bdd533867e5bef350422618187612f`) and
`src/components/site/page-sections/section-support.tsx` (`19c9bee3b3b200af2455813e5f842c30b062a6ac`). No donor JSX, CSS,
markup, brand, image, fixture, Foundation Solo Rust, `modules/connect/**`, SDK or licensed component was copied, and no
dependency, notice exception or licence waiver was added.

## 2. Dependencies, exactly two

| Dependency | Role | Status |
| --- | --- | --- |
| `src/core/safe-author-url.ts` → `classifyAuthorDestination` | lexical destination classifier | **unchanged**; blob `6070b2a27a505b8012600f9e73343976e5e4882a` |
| `src/core/page-document.ts` (own readers) | strict version-1 Page parsing | extended only for `content.actions` props |

The classifier is imported, never re-implemented or edited. `tests/unit/safe-author-url.test.ts` is likewise unchanged.

## 3. Accepted shape

`content.actions.props.items` is one bounded list of at most eight entries, each **exactly** one of:

* the pre-existing fragment form `{ "label": "…", "targetId": "<existing-section-id>" }`, whose target must still resolve
  within the same Page and whose serialized shape and anchor markup are byte-identical to before;
* the new outbound form `{ "label": "…", "href": "mailto:…" }` or `{ "label": "…", "href": "https://…" }`, where `href`
  is the original accepted string and `classifyAuthorDestination` must return exactly the `mailto` or `https` category.

Labels keep the existing ≤160-code-point plain-text bound. A superset, a mixed `{label,targetId,href}`, a label-only or
destination-only entry, an own `undefined`, a sparse array, a getter, an exotic prototype, a cycle, a duplicate JSON
member or a ninth entry refuses the **whole** Page through the existing closed vocabulary (`document:invalid-props`,
`document:unsafe-link`, `document:input-not-plain`, `document:json-duplicate-key`, `document:unresolved-target`). A
non-string `href` is a *shape* refusal (`document:invalid-props`); a string that is not an admitted `mailto`/`https`
destination is a *link* refusal (`document:unsafe-link`). `http` is accepted by the classifier but refused by this
module's exact-two-category rule. Nothing is silently coerced, normalised, dropped or rewritten.

## 4. Target/hero split

`content.actions` alone reads the disjoint union. `content.hero.props.actions` keeps its original `{label,targetId}`-only
shape and its 1–3 bound: an outbound action there is a props refusal. Outbound entries never become synthetic
`state.targets`, and a malformed `targetId` never falls through to `href`. No other module, family adapter, committed
Page, manifest, selection, asset or registry entry changes; the three committed `en-001` Pages, the reserved
`https://uno-starter.example` illustrative canonical and the undeclared legacy Markdown Home are untouched.

## 5. Rendering

Stand-alone `content.actions` keeps its `<ul class="uno-json-actions">` / `<li class="uno-json-action-item">` /
`<a class="uno-json-action">` hierarchy, item order and React text escaping. A fragment entry is unchanged. An outbound
entry is ordinary server-rendered markup: no script, handler, popup, SDK, API call, `target`, automatic click, tracking,
geolocation, prefetch, hydration island or destination probe. HTTPS anchors carry `rel="noopener noreferrer"` and
`referrerPolicy="no-referrer"`; a `mailto:` anchor gets neither a forced new tab nor any fabricated delivery state.

## 6. Security and privacy non-goals

`classifyAuthorDestination` is **lexical syntax safety only**. It is not target existence, provider identity, Page
ownership, link trust, delivery success, SSRF authorization or a server fetch allowlist. This capability never fetches,
pings, proxies, crawls, preconnects, resolves DNS, follows redirects or sends a webhook on the server, and it makes no
booking, availability, directions, contact-delivery or provider-ownership claim. A real authored HTTPS destination may
still be unsafe, unavailable or misleading; the Visitor activates it, not Uno. No `.temp/`, `.documents/`, internal
property data, secret or private machine path is emitted to client markup or traces, and no private EFS property is
auto-projected into an action destination.

## 7. Synthetic fixture destinations

The temporary, reversible U04 JSON-slice fixture Home carries exactly three reserved illustrative destinations after its
original fragment: `mailto:contact@example.invalid`, `https://maps.example/directions?to=sample` and
`https://booking.example/availability`. They are never followed, fetched or tested for reachability, and no provider or
mailbox is claimed to own them.

## 8. Evidence

* Pure reader tests: accepted fragment/mailto/HTTPS roundtrips, the eight-entry mixed cap, frozen output, and refusals for
  wrong categories, encoding, CRLF, credentials, extra or mixed keys, own `undefined`, duplicate JSON members, accessors,
  throwing proxies, dead or malformed targets, oversized labels and hero outbound forms.
* Static markup tests: exact legacy fragment anchor, plain inert outbound anchors, `rel`/referrer policy, escaping, and no
  script, handler, new tab, form or status.
* Real production HTTP and Chromium over the temporary fixture: the four anchors in authored order with their exact
  destinations and policies, keyboard focus on the `mailto:` anchor, one `main`/one `h1`, no form or ping surface, zero
  requests outside loopback, and byte-exact restoration proven in `finally` (`U05_STATIC_ACTIONS_SOURCE`,
  `U05_STATIC_ACTIONS_HTTP`, `U05_STATIC_ACTIONS_BROWSER`, `U05_STATIC_ACTIONS_REFUSALS`,
  `U05_STATIC_ACTIONS_RESTORE`).

## 9. Still open

This is **not** U05 completion. Actual `mailto` transmission, contact UI and delivery, abuse controls, analytics,
webhooks, public/internal contact facts, geolocation or directions routing, a booking engine, provider validation,
permission prompts and every other U05 obligation remain open. Accounting is unchanged: **22/22** typed module IDs,
**4/4** owned asset zones, **16/16** browser matrix, **17/17** bounded mappings, **1/17** full family parity (`divider`),
**43/59 = 72.88%** proxy. U04–U07 stay OPEN, only the Owner closes a stage, and the historical private-path exposure
remains unresolved and Owner-controlled.

