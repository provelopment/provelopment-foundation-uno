# Execution report — UNO-WO-036 / R02

**Stage:** U04 **OPEN**. This is one bounded corrective execution covering a test/CI assurance gap and the
privacy-safe repair of the branch tip. It adds **0** modules, changes no product behaviour, publishes no Page and
closes no stage.

## 1. What this run corrects, and why it was needed

The predecessor corrective run stopped deliberately before any public write, so `main` still carried a
privacy-defective intermediate report commit in its ancestry. It stopped because its own newly enforced mandatory
command, `node --test tests/deployment/u04-json-slice.test.mjs`, was red: the hermetic test asserted a textual
form (`emulateMedia({ colorScheme: "dark" ... })`) that the accepted browser runner never contained, because that
runner proves dark mode through a single `browser.newContext({ ..., colorScheme: "dark", reducedMotion: "reduce" })`
call instead. The 239-check browser gate itself was green throughout; only the static contract test was stale, and
because no CI job ever ran that test file, the staleness could not fail a build. The defect was therefore in test
and CI assurance, not in the product.

This run performs exactly four product edits to close that gap, then rebuilds the branch tip as
`PRODUCT` → `FIX` (test/CI assurance) → `NEW` (this report). No assertion was waived, no test disabled, and the
working runner was not altered to satisfy a wrong expectation.

## 2. Authority

- **ACTIVE:** the installed private corrective order, `FINAL — EXECUTE`, **30,958 bytes**, SHA-256
  `6c2978ab46915120053bf692eb9c9d9f6e62733163a07963053dabbe70b980e4`, matching the Owner activation that names
  `UNO-WO-036 / R02`, both authorization tokens and the required starting head. The ACTIVE content is never printed,
  staged or committed.
- **Starting head:** `6113fa0b688e952541089f61df706941291201f9` (the accepted tip), equal to local `main` and
  `origin/main` at start.
- **Preserved engineering base (PRODUCT):** `0a346619fe4a7960bd66bca99c4f1bd3da477361`, direct child of
  `bc4763c931d8da4f5a01b38a2656f1d6527b179d`.
- **Test/CI repair (FIX):** `f917bc2de0e8cd447181885c5ea54112c7eb60fe`, exactly one child of PRODUCT.
- **This report (NEW):** the single report-only child of FIX.
- **Excluded ancestry:** the privacy-defective intermediate report commit and the contaminated tip are not
  ancestors of this lineage. Their identifiers are deliberately withheld from the public record and are available
  only in the private handback.

## 3. The four-path product repair

Only these four Uno-owned testing, CI and readiness files changed; every other tracked blob in the repository is
byte-identical to PRODUCT.

| Path | Blob before | Blob after | Change |
|---|---|---|---|
| `tests/deployment/u04-json-slice.test.mjs` | `d74c32000c3fba925927ed159f9196d0001a2c09` | `99161906ae3a4081d4504a531d7f7c82a17fdc97` | Replaced the stale `emulateMedia` expectation with a bounded, same-call guard and added three negative mutations |
| `.github/workflows/verify-u01.yml` | `64ca1945bfd9ee2ccf2fe1c8f317c2e43ac50dc1` | `cfee88cde36eb13ba2794a50ed4b1d02d974147f` | Added one blocking step, `U04 JSON-slice hermetic contract and refusal tests`, before the production build on the existing two-host matrix |
| `scripts/verify-vercel-readiness.mjs` | `9aaeac122f50b9f19b0a1b7fb4564cf7ed06904a` | `7325806754b5846812da0a17239ab345d2985410` | Added the closed refusal `workflow:no-u04-hermetic-test` and pinned the step's name, command, position and unmuted state |
| `tests/deployment/verify-vercel-readiness.test.mjs` | `15bfd3bcbc16f3806619ab937c73b85b25b9c173` | `4b7c4d11dc32546d1f54b6bb463827142503cf0d` | Extended the valid CI fixture and added three negative fixtures: step removal, command substitution, muted condition |

## 4. What the repaired assurance now proves

- **One context, two preferences.** The guard extracts the argument object of the single
  `const darkContext = await browser.newContext({ ... });` construction and requires `colorScheme: "dark"` and
  `reducedMotion: "reduce"` **on that call**, so a matching fragment elsewhere in the file can no longer satisfy it.
- **Three mutations must fail.** Copies of the runner with only the colour scheme drifted to `light`, only the
  motion preference drifted to `no-preference`, and the dark-context creation removed entirely are each rejected by
  the same guard; a passing baseline plus three refused mutations is proof the guard can actually fail.
- **The gate is blocking on both hosts.** The hermetic test is now its own CI step on Ubuntu 24.04 and Windows 2025,
  ahead of the production build, with no condition, no `continue-on-error` and no alternate matrix entry.
- **Removal cannot look like a pass.** The readiness gate refuses a missing step, a renamed step, a replaced
  command, a step moved after the build, or any false condition in uncommented workflow text.

## 5. Local verification performed before this commit

| Check | Result |
|---|---|
| Formerly red hermetic suite | **PASS 7/7**, 0 failed, 0 skipped (six baseline tests plus the new drift/removal test) |
| Readiness fixtures | **PASS 86/86** (83 baseline plus three new refusals) |
| Readiness CLI | **PASS 124 checks**, 0 failed (baseline 120 plus the pinned CI contract) |
| Governance documentation | PASS 9/9, digest CLI PASS |
| Bootstrap governance | PASS 19/19 + CLI |
| Architecture boundaries | PASS 45/45 |
| Lint / typecheck | PASS / PASS |
| Unit suite | **PASS 770/770**, 0 failed, 0 skipped |
| U03 trace fixtures / fixture-transaction faults | PASS 25/25 / 27/27 |
| Production build | PASS with **zero** Next/Turbopack warning or error events |
| Bounded trace (committed inputs) | PASS, bounded payload |
| U01 HTTP / U03 HTTP | PASS **103/103** / **91/91** |
| U03 published harness (real Chromium, restored) | PASS **542/542** |
| U04 JSON slice (real Chromium, restored) | PASS **239/239** |
| Security floor / brand copy | PASS 22/22 / 29/29 |
| Audit (high threshold) | PASS, 0 high, 0 critical |
| Fixture restoration and final rebuild | byte-exact restore proven by each harness; committed-input rebuild and trace repeated with zero warnings |
| `git diff --check`, staged paths at FIX | clean; exactly the four product EDITs, all modifications, nothing else |
| Privacy scan of this report | PASS — no drive-letter profile path, no home-directory username, no UNC share, no token, no secret, no defective value, no defective commit identifier |

## 6. Verification status at commit time (not overstated)

| Assurance | Status |
|---|---|
| Active-history repair | FIX and this report are proven locally to be `PRODUCT` → `FIX` → `NEW`, with the defective commits unreachable from the repaired lineage; the remote half is proven only after the guarded compare-and-swap |
| Hosted CI at this commit | **UNVERIFIED at commit time** — CI cannot run before the commit exists; the four jobs are observed and reported privately after the push |
| Production provider | **UNVERIFIED** — no provider connector in this run; deployment identity, alias, warning count and runtime-error window require read-only inspection |
| Server-side or cached copies of the old objects | **UNVERIFIED / OUTSTANDING** — removing a ref is not a server-side purge; the provider's object store, caches, logs and any clone or fork are outside this run's control, and a private provider request is the only authorized channel |

## 7. Warnings and advisories (disclosed, not suppressed)

The two pre-existing **moderate, dev-only `minimatch`** advisories remain; there is no high or critical finding and
the high-threshold audit exits 0. Node's benign module-format notice appears when a gate imports the repository's
TypeScript directly; it is expected and is not a build warning. The production build prints no `Warning:` line, no
`Failed to compile`, no whole-project tracing warning and no Turbopack notice. No `continue-on-error`, warning
filter, `ignoreBuildErrors`, skipped browser test or lowered threshold exists anywhere in the pipeline.

## 8. U04 remains open

**5 of 22** module renderers (22.7%) and **0 of 17** mapped Foundation families. The presentation shell, the
`site.config.json` presentation authority, the family composer, the remaining seventeen modules, the single client
interaction island and the owned-asset policy remain mandatory U04 obligations. No Page is published, no release or
manual deployment exists, and the demonstration and deployment declarations are unchanged.

## 9. Ruling requested

One independent Architect ruling: **`ACCEPT` / `REVISE` / `STOP`** on this test/CI repair, this report and the
repaired `main` history.

---

## Incorporated predecessor evidence — `UNO-WO-035 / R01` (sanitized; bounded historical context)

**Stage:** U04, **OPEN**. This report proves one bounded increment; it does not close U04, does not claim
`22/22` module parity and does not claim `17/17` family-composition parity.

### 1. Authority verified

- **ACTIVE:** `.documents/WIP/workorder-active.md`, heading
  `# UNO-WO-035 / R01 — U04 first executable A1 JSON Page vertical slice with real production-browser proof`,
  edition `FINAL — EXECUTE`, **31,089 bytes**, SHA-256
  `b8415a27af049fed05f915298f2993a6397ced12811d6b994f9a8077960f022c` — both matched the Owner activation exactly.
  Ignored, untracked and unstaged throughout; never printed, staged, uploaded or committed.
- **Owner activation:** the matching message carrying the same order ID, the same byte count and hash, the
  required start SHA and `AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`.
- **Start head:** `bc4763c931d8da4f5a01b38a2656f1d6527b179d`, equal to `origin/main` before the first write.
- **Product head:** `0a346619fe4a7960bd66bca99c4f1bd3da477361` (`0a34661`).
- **Report commit:** the direct child of `0a34661`; its SHA is whatever Git records for this file — no SHA is
  asserted here before it exists.

### 2. Physical, Git and source guards

One worktree at the authorized physical checkout recorded in the active order, branch `main`, exactly one `origin`
pointing only at `provelopment/provelopment-foundation-uno`, clean index and worktree, no foreign or untracked product
file, exactly four permitted WIP slots. Node `26.13.1`, pnpm `11.6.0`, Next `16.4.2`, React `19.2.9`,
Playwright `1.65.1` from the frozen lockfile; `pnpm install --frozen-lockfile --ignore-scripts` with no
postinstall. Parent, Foundation template, Solo and every sibling repository stayed read-only.

Immutable anchors re-verified at the start and again before staging — `AGENTS.md`, `README.md`,
`.documents/SOP/sop-implementation.md`, `package.json`, `pnpm-lock.yaml`, `verify-bootstrap.yml`,
`capability-registry.ts` and its frozen test, `identity.ts`, `uno-canonical-base.ts`, the `(demo)` page and
layout, `global-not-found.tsx`, `icon.svg`, the confined source reader, `manifest.json`, `uno.config.json`,
`home.en-001.md`, `uno-u03-fixture-transaction.mjs`, its 27-case suite, `verify-u03-browser.mjs`,
`verify-u03-http.mjs`, `verify-u01-http.mjs`, `verify-u03-published-http.mjs`, `verify-u03-trace.mjs`,
`u03-trace.test.mjs`, the governance script and test, the security floor, the brand copy test and
`bootstrap.test.mjs` — **0 mismatches**.

### 3. Authorized ledger — 20 paths, 19 changed

**EDIT (13 authorized):** `prepare-uno-page-delivery-candidate.ts`, `plan-uno-published-page.ts`,
`uno-serving.ts`, `page.tsx`, `globals.css`, `efs-uno-page-delivery-candidate.test.ts`,
`u01-boundaries.test.mjs`, `verify-vercel-readiness.mjs`, `verify-vercel-readiness.test.mjs`,
`verify-u01.yml`, `source-inventory.md`, `plan-roadmap.md`, and `plan-next.md` (**OVERWRITE**).
`tests/unit/efs-uno-published-page.test.ts` was authorized but **not changed**: the planner's accepted record
gains only optional fields, so every existing assertion there remains true and stronger wording was unnecessary.

**CREATE (6):** `src/core/page-document.ts`, `src/components/uno-page-sections.tsx`,
`tests/unit/page-document.test.ts`, `tests/unit/uno-page-sections.test.ts`,
`scripts/verify-u04-json-slice.mjs`, `tests/deployment/u04-json-slice.test.mjs`.

No rename, deletion, dependency, lockfile, hook, new worktree or external write. No path outside the ledger was
touched; `git diff --check` is clean.

### 4. The version-1 document contract

`src/core/page-document.ts` is pure, framework-free, dependency-free and imports only `isCapabilityId()` from
the immutable registry. The envelope is closed: `{ version: 1, title, description?, visibility?, sections }`.

| Bound | Value |
|---|---|
| sections | 1–32 |
| module nodes in total | ≤ 128 |
| nesting depth | ≤ 4 |
| children per layout | 1–8 |
| authored text | ≤ 4,000 code points |
| title / description | ≤ 160 / ≤ 320 code points |
| action entries | 1–8, label ≤ 160 code points |
| section id | `[a-z][a-z0-9-]{0,47}`, unique document-wide |
| JSON source | ≤ 64 KiB |

A section is exactly `{ id, module, props }`, plus `children` only for the two layouts. Identifiers are unique
across the whole document; every `content.actions` target must resolve to a section in the same document; heading
levels are `2..6` and may never skip a level above the App Router's single `h1`. The accepted document is deeply
frozen, deterministically ordered and JSON-serializable; the validator materializes the default `public`
visibility so no consumer depends on an absent key.

**Lexical handling.** Authored JSON is read by a purpose-built recursive-descent reader, not `JSON.parse`, because
`JSON.parse` silently keeps the *last* of two duplicate keys. It refuses duplicate keys, the three
prototype-pollution keys, unescaped control characters and over-deep or over-wide input. Direct-object input is
classified as plain own data first, so getters, symbols, exotic prototypes, sparse arrays, class instances, cyclic
graphs and throwing proxies are refused without executing authored code.

**Renderable set.** Exactly `layout.stack`, `layout.grid`, `content.heading`, `content.prose`,
`content.actions` — **5 of the 22** approved IDs, all real implementations. The other seventeen remain registered
but unrenderable and refuse with `document:renderer-unavailable`; anything outside the immutable 22 refuses with
`document:unknown-module`. Both refuse the entire Page, so no partially supported document reaches a renderer or a
discovery plan.

**Family composition: 0 of 17.** `src/core/modules/uno-family-composition.ts` does not exist yet; the typed
17-family translator, the remaining 17 renderers, the presentation shell and the owned-asset policy remain
mandatory U04 obligations recorded in the roadmap and `plan-next.md`.


### 5. Composition and the immutable publication boundary

The existing pipeline was wired, not duplicated. `prepare-uno-page-delivery-candidate.ts` validates the **selected**
JSON source after matching, header and visibility checks, and returns the accepted document in the accepted
candidate; a title, description or visibility disagreement between the document and the accepted header refuses
with the new closed literal `delivery:document-invalid`. `plan-uno-published-page.ts` carries the frozen document
forward only after the manifest Page's own `publication: "published"` gate, mapping the new literal to
`publication:document-invalid`. `src/config/uno-serving.ts` serves a JSON Page only when the whole tree is
renderable, otherwise `serving:renderer-unavailable` and a genuine 404 — never partial content, never a Markdown
fallback. The confined reader, the header projector and the canonical-base contract are unchanged.

Publication authority, renderability and presentation stayed three separate decisions: a JSON Page that is
published but unrenderable is refused at serving, while the planner still records its publication and visibility
truthfully. That is what keeps the accepted U03 classification assertions intact.

### 6. Discovery, visibility and SEO

`listUnoServingAddresses()` and `planUnoServingDiscovery()` no longer hardcode `kind === markdown`; both include a
JSON Page exactly when its document validates and renders. A **public** JSON Page is served and discovered on the
same basis as Markdown. A valid **unlisted** JSON Page is enumerated for routing (so its exact full-locale address
can be served under `dynamicParams = false`) and is absent from the sitemap, `hreflang`, `x-default`, navigation and
every alias or missing-locale redirect; it answers 200 only at its own address, with its own canonical and
`noindex,nofollow`. The reserved Home cannot be unlisted. Draft, unselected, absent, unknown, unsupported, invalid,
undeclared and malformed-preferred JSON are 404s that advertise nothing. A valid Markdown Page still answers when
no JSON is declared — never when a declared JSON is present but invalid.

### 7. Renderer, styling and browser semantics

`src/components/uno-page-sections.tsx` is an original server component with a total switch over exactly the five
renderable literals; it re-validates the document it is handed and renders nothing at all if validation fails.
Authored text is React text — no `dangerouslySetInnerHTML`, no Markdown interpretation, no client directive, no
inline style, no authored URL and no `<h1>` or `<main>` of its own. `layout.grid` with `itemSemantics: "article"`
wraps each item in a real semantic `<article>`. Only `.uno-json-*` rules were appended to `globals.css`, using the
existing palette tokens; the `(demo)` language, focus treatment and `noindex` policy are untouched. No new client
JavaScript was added: the architecture guard asserts that `src/components` contains no `"use client"` source at all.


### 8. Evidence — real build, real HTTP, real Chromium

`scripts/verify-u04-json-slice.mjs` installs a synthetic fixture through the accepted, immutable
`prepareUnoU03FixtureTransaction` (never by touching the real Home Markdown), validates it with the real loader,
planner and serving composition, runs one production build, starts the real server on loopback and asserts:

- **Positive JSON Pages:** `/en-001`, `/de-de`, `/en-001/programmes/components`,
  `/de-de/programmes/components` — 200, truthful `<html lang>`, exactly one `h1`, exact canonical and `og:url`,
  exactly one `main`, and for the listing Page two `<article class="uno-json-card">` cards with unique headings and
  bodies, a declared two-column article grid and a real `href="#card-one"` same-page anchor;
- **Markdown still served:** `/en-001/notes`, proving the two renderers coexist;
- **Unlisted privacy:** `/en-001/preview` — 200 at its exact address, own canonical, `noindex,nofollow`, no
  `hreflang`, one `h1`, and absent from `sitemap.xml`;
- **Sixteen distinct refusals as genuine 404s** with no canonical, no alternate, no `og:url` and no leaked fixture
  title: unrenderable module, unknown module, unsupported version, extra top-level key, unsafe action, unresolved
  target, duplicate section id, excessive depth, excessive width, malformed preferred JSON without rescue, draft,
  wrong Site, undeclared locale, missing locale, unknown Page and a case-mismatched segment;
- **Alias, robots and sitemap parity:** `/en` redirects to the exact canonical Home, `robots.txt` names the
  canonical sitemap, and the sitemap lists exactly the five public entries;
- **Crawler parity:** a Googlebot-shaped request receives the same status, the same canonical and the same
  `noindex,nofollow` policy; no cookie or Host header can change publication;
- **Real DOM at 320 / 390 / 768 / 1280:** no horizontal overflow at any width, two cards side by side at 768 and
  1280 and stacked at 390 and 320, one `h1`, one `main`, two articles, keyboard focus reaching the action, dark
  mode resolving the dark token with body contrast ≥ 4.5:1, reduced motion collapsing the action transition to
  ≤ 1 ms against a 120 ms default, **no console error, no uncaught error and no external request**;
- **Restoration:** the committed declarations and every task-created source restored byte for byte, the
  transaction scratch removed, then a clean rebuild of the committed unpublished inputs with zero warnings,
  `verify-u03-trace.mjs --expect committed` PASS and `verify-u03-http.mjs` PASS.

**Total: 239 checks, 0 failed** — on this machine, on Ubuntu 24.04 and on Windows 2025.

**Accessibility criteria exercised by those assertions:** 1.1.1 (text alternatives are authored and bounded; no
image renders in this slice), 1.3.1 (semantic `article`, `h2`–`h6`, list-based actions), 1.3.2 (heading order is
validated and refused when skipped), 1.4.3 and 1.4.11 (dark-mode contrast measured), 1.4.10 (reflow at 320 px),
2.1.1 and 2.1.2 (keyboard focus, no trap), 2.4.1 (no repeated landmark), 2.4.3 and 2.4.7 (focus order and
visibility), 3.2.4 (no surprise context change) and 4.1.2 (no custom widget roles). A **screen-reader assessment is
not claimed**: these are automated DOM assertions, not a manual AT evaluation. WCAG 1.2.x and 2.2.2 are not
applicable because this slice renders no time-based media and no moving content.


### 9. Gate table

| Gate | Result |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | **PASS** (no postinstall) |
| `pnpm lint` | **PASS** (exit 0) |
| `pnpm typecheck` | **PASS** (exit 0) |
| Focused U04 units (`page-document`, `uno-page-sections`) | **PASS** 30/30 |
| Whole `pnpm test` | **PASS 770/770** (25 files; baseline 739, +31 added, none removed or skipped) |
| `tests/deployment/u04-json-slice.test.mjs` | **PASS** 6/6 |
| Governance documentation | **PASS 9/9** |
| Bootstrap (test + CLI) | **PASS 19/19** + CLI |
| Architecture boundaries | **PASS 45/45** (baseline 41, +4 added, none lost) |
| Security floor | **PASS 22/22** |
| Brand copy | **PASS 29/29** |
| Readiness fixtures / CLI | **PASS 83/83** fixtures, **120 checks, 0 failed** |
| U03 fixture-transaction faults | **PASS 27/27** |
| U03 trace fixtures | **PASS 25/25** |
| `pnpm build` (committed inputs) | **PASS**, 0 Next/Turbopack warnings and 0 errors |
| `verify-u03-trace.mjs --expect committed` | **PASS** (9 trace manifests, 1,980 traced files, 4 project entries) |
| `pnpm test:http` (English demonstration) | **PASS 103/103** |
| `node scripts/verify-u03-http.mjs` | **PASS 91/91** |
| `node scripts/verify-u03-published-http.mjs` (unaltered) | **PASS 542/542**, real Chromium |
| `node scripts/verify-u04-json-slice.mjs` | **PASS 239/239**, real Chromium |
| `pnpm audit --audit-level high` | **PASS** (exit 0) |
| `git diff --check`, clean tracked deployment state | **PASS** |
| Hosted `Verify U01 baseline` at `0a34661` | **PASS** — ubuntu-24.04 and windows-2025, all steps successful |
| Hosted `Uno Bootstrap Verify` at `0a34661` | **PASS** — ubuntu-24.04 and windows-2025 |
| Hosted U04 step actually executed | **PASS** — raw logs show `verify-u04-json-slice: 239 passed, 0 failed` on **both** hosts |
| Vercel provider deployment evidence | **UNVERIFIED** — no provider connector in this run; requires read-only Architect inspection |

### 10. Warnings, advisories and notices (disclosed, not suppressed)

- `pnpm audit` reports the **two pre-existing moderate, dev-only `minimatch` advisories**; there are no high or
  critical findings and the high-threshold audit exits 0. Nothing was waived or silenced.
- Node prints its benign `MODULE_TYPELESS_PACKAGE_JSON` notice when the gate imports the repository's TypeScript
  directly. It is expected, is not suppressed, and is not a build warning.
- The Next build printed **no** `Warning:` line, no `Failed to compile`, no whole-project tracing warning and no
  Turbopack notice; the gate fails on any of those markers rather than filtering them.
- No `continue-on-error`, no `ignoreBuildErrors`, no warning filter, no lowered threshold, no skipped browser test
  and no disabled assertion exists anywhere in the new or amended gates.

### 11. Old U03 assertions — preserved, none superseded

The U03 published harness is **byte-identical and unaltered** and still reports 542/542. Its hidden JSON fixture
(`{title, visibility}` with no `sections`) is still refused for having no renderable document, so its 404
expectation, its planner classification assertion and its `addresses.length === 7` assertion all still hold
exactly as accepted. No prior assertion name or count was replaced, and no fail-closed rule was relaxed. The only
test file whose expectations moved is the delivery-candidate unit suite, where three assertions were **strengthened**
to name the new closed document outcome that the candidate now carries (documented in-file with the reason).

### 12. Documentation

`.documents/Architecture/source-inventory.md` now records the measured **5/22** module coverage and **0/17**
family-composition coverage, the exact schema and bounds, the full refusal vocabulary, the source/rights position
and the evidence. `.documents/WIP/plan-roadmap.md` records U04 as **OPEN** with this bounded progress and the
remaining obligations. `.documents/WIP/plan-next.md` was overwritten with one forward-only U04 exit candidate. The
seven canonical Drive documents were not touched; they remain Architect-owned.

### 13. Outstanding obligations, and the ruling requested

Mandatory and still open: the typed 17-family composition translator with per-family positive and unique-negative
real-DOM proofs, the remaining seventeen module renderers (including the single tabs/modal/carousel client island
with its focus contract and the honest display-only contact state), `deployment/site.config.json` and the
presentation shell with navigation derived only from published public Pages, and the four-zone owned-asset policy
and guarded reader with the temporary media fixture proof. **U04 remains OPEN**; this run neither closes it nor
claims 22/22 or 17/17 parity, and no release, tag, domain, provider or settings action was taken. An automated
Vercel production build triggered by the authorized push is the only provider-side effect.

**Requested ruling: `ACCEPT` / `REVISE` / `STOP`** on this bounded increment, from the independent Architect.
