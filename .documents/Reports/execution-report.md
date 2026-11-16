# UNO-WO-023 / R01 — pure canonical base and alias validation

**Work order:** `UNO-WO-023 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 21,411 bytes, SHA-256 `aff74b1e52a7a15a0579c0a59a3ccc579bd7f442e6ac4c94c2bfe73c5eb5ad3a`,
matched byte-for-byte before any write, ignored, untracked, unstaged, never printed or committed.
**Owner decision:** the activation contains the exact sentence **`I APPROVE U03 CANONICAL BASE CONTRACT IN
§4 OF UNO-WO-023 / R01`**, which this order requires before any implementation.
**Push authorization:** the activation contains **`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`**,
covering only the incidental build an authorized non-force Git push may start — not any manual provider action.
**Required start = actual start:** `e9cac6b1d1e4554f019467b73fd47143a664c1b6`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `CANONICAL_BASE_VALIDATOR` | **PASS** | `src/core/efs/uno-canonical-base.ts`, 15,465 B, blob `fe617f03…`; pure, fail-closed, closed 8-code vocabulary |
| `FOCUSED_TESTS` | **PASS** | **57** cases in one new suite, **32+** of them refusals, each asserting one exact code and vocabulary membership |
| `PURITY_BOUNDARY` | **PASS** | registered in `CORE_AUTHORED_FILES`; scanner refuses injected Node/Next/React/adapter/provider imports; no `src/app` consumer |
| `NONPUBLICATION` | **PASS** | `deployment/uno.config.json` and every deployment, app, application, adapter, script, workflow and package path byte-identical; build route table unchanged |
| `BASELINE_PRESERVED` | **PASS** | 588 unit tests over 17 files (531 + 57); 27 architecture checks (25 + 2); 25 protected paths byte-identical |
| `PUBLIC_404_PRESERVED` | **PASS** | `/` 200, `/en` 404, `/en-001` 404, `/about` 404, `robots.txt` 404, `sitemap.xml` 404 |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | four jobs on two hosts, zero non-success steps (§7) |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, manual deploy, alias, domain or settings change; only the authorized Git push |
| `STAGE` | U03 **OPEN** | no closure, release, merge, publication or next-stage authority is asserted |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`cb6b88feb647f5ee8131f57e08edcf0df7e1ee2e`** | exactly six ledger paths; direct child of `e9cac6b` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/core/efs/uno-canonical-base.ts` | CREATE | ABSENT → `fe617f03…` | 15,465 |
| 2 | `tests/unit/efs-uno-canonical-base.test.ts` | CREATE | ABSENT → `35322ef1…` | 14,643 |
| 3 | `tests/architecture/u01-boundaries.test.mjs` | EDIT (additive) | `694e599d…` → `d1002cd6…` | 37,334 |
| 4 | `.documents/Architecture/source-inventory.md` | EDIT | `5e04c4e0…` → `9f95fedc…` | 107,361 |
| 5 | `.documents/WIP/plan-roadmap.md` | EDIT | `2e620585…` → `33ecaf64…` | 10,125 |
| 6 | `.documents/WIP/plan-next.md` | OVERWRITE | `bb325134…` → `bf87eeb7…` | 1,464 |

The inventory edit is **purely additive** (29 insertions, 0 deletions): the U03 discoverability section and its
heading are preserved intact beside the new canonical-base section. No other tracked path changed, both CREATE
paths were absent at start, and `git diff --cached --check` reported nothing before the commit.

## 3. Physical, parent, Git and privacy preflight (sanitized)

| Guard | Result |
| --- | --- |
| Physical root | the sole Uno checkout resolved physically; Git toplevel equals the checkout path; no reparse or junction alias |
| Ancestors and parent | no symlink/reparse component; the parent's anchored `/00.foundation-uno/` ignore rule still effective and untouched; parent, Foundation, Solo and every sibling strictly read-only, never written, built or tested |
| Worktrees / remotes | exactly one worktree, `main` checked out, one remote `origin` fetching and pushing only `provelopment/provelopment-foundation-uno`; no mirror; no force, reset, rebase, amend, merge or clean |
| Head and remote | local `HEAD` = `origin/main` = `e9cac6b`, and `origin/main` re-read immediately before the push and still `e9cac6b` |
| Acting tree | clean before work; clean after the product push; no unexpected untracked, staged or ignored source |
| ACTIVE privacy | exactly one private ACTIVE, 21,411 bytes, activation SHA-256, ignored, untracked, unstaged, neither printed nor committed |
| WIP slots | exactly four: `plan-roadmap.md`, `plan-next.md`, private `workorder-active.md`, `plan-outlook.md` |
| Pins | **25 / 25** start blobs matched before the first write; the five editable ledger blobs matched their required starting IDs; both CREATE paths confirmed ABSENT |
| Runtime | Node 26.x and pnpm 11.6.0 from the committed `package.json`; install in-root with an in-root store; no package, lockfile or dependency change |

## 4. The validated contract

`validateUnoCanonicalBase({ canonical, aliases })` accepts only plain own data with exactly those two keys and
returns either a freshly allocated, deeply frozen
`{accepted: true, canonical: {origin, pathPrefix}, aliases: [{origin, pathPrefix}…]}`, or one closed
`{accepted: false, reason}` from an 8-member frozen vocabulary:

`base:input-not-plain` · `base:input-shape` · `base:unreadable` · `base:canonical-url` · `base:alias-url` ·
`base:alias-count` · `base:alias-duplicate` · `base:alias-overlap`

- **Untrusted values first.** Prototypes, descriptors and symbol keys are checked before any value is read, so
  an accessor is refused instead of invoked, a sparse or accessor array entry is refused instead of skipped, and
  a trap that throws becomes one closed refusal rather than an escaping exception. The caller's value is never
  mutated.
- **Screened strings.** 1..255 printable non-space ASCII bytes only; no controls, NUL, Unicode, whitespace,
  backslash, `@` userinfo, `%`, `?` or `#`; a non-HTTP(S) scheme, relative or protocol-relative reference
  refuses. The platform `URL` parser runs **after** that screening and only to confirm the spelling: any host
  case, scheme, port, dot-segment, escaping or trailing-slash normalization it would perform is a refusal, and a
  bare-origin root's `pathname === "/"` is read as `pathPrefix: ""`.
- **Origin policy.** HTTPS with lowercase DNS labels (1..63 characters, no empty/trailing-dot/wildcard/all-numeric
  label, no explicit port at all — an explicit `:443` or `:8443` is refused as redundant or nonstandard). Plain
  HTTP only for the exact loopback hosts `localhost`, `127.0.0.1`, `[::1]` with an optional explicit port
  1..65535. Already-canonical punycode labels are accepted as labels. This is lexical safety, not DNS, TLS or
  Owner approval of a host.
- **Prefix and aliases.** An optional prefix of 1..8 lowercase content-slug segments (≤160 characters) reuses the
  authored `isContentSlug`, so `.`/`..`, empty segments, uppercase and `_`-prefixed segments cannot appear; at most
  eight aliases; no alias identical to the canonical base, no duplicate alias, and no whole-segment origin
  overlap — while `/site` and `/site2` stay distinct and different hosts or ports stay independent.
- **No borrowed power.** The result carries no `published`, `redirect`, location, cookie, request, route, locale
  target, sitemap, canonical tag or dynamic hostname, and the module imports nothing from Node, Next, React, an
  adapter, a provider or the environment. `validateUnoSiteSelection`, the manifest graph, the locale matcher, the
  Page-header projector and the discoverability classifier are untouched and remain authoritative in their scopes.


## 5. Focused and broad test results

**Focused suite — 57 cases, all passing.** 48 cases assert a refusal (32 canonical-URL, 6 alias and 9
untrusted-input refusals) and 9 assert acceptance, one of which also proves the 256-byte refusal — well above the
required 30 cases and 20 refusals. Every refusal asserts one exact code **and** that the code is a member of the
closed vocabulary.

| Family | Observed |
| --- | --- |
| Acceptances | bare origin with `pathPrefix: ""`; `/site` prefix; two aliases on other origins; `http://localhost`, `localhost:3000`, `127.0.0.1:3000`, `[::1]:3000`; `/site` + `/site2` on one origin; punycode label; eight aliases and an empty list; exactly 255 bytes; fresh frozen result with no caller mutation |
| Canonical URL refusals (32) | unknown protocol, external HTTP, `http://localhost.evil.org`, credentials, empty host, uppercase host, wildcard, trailing dot, explicit and redundant HTTPS port, query, fragment, percent escape, raw backslash, Unicode, NUL, leading/trailing whitespace, protocol-relative, relative, trailing slash, duplicated slash, `.` and `..` segments, uppercase path, `_`-prefixed segment, nine prefix segments, prefix over 160 characters, IPv4 literal, single-label HTTPS host, 64-character label, 256 bytes, empty string |
| Alias refusals | invalid alias (two spellings), ninth alias, self-alias, duplicate aliases, ancestor/child overlap both directions, root-versus-prefix overlap, alias-list overlap |
| Untrusted input | non-object roots, missing/extra/wrong-typed fields, accessor root with **zero** getter invocations, symbol key, exotic prototype, throwing Proxy, sparse array, accessor array entry, twelve aliases refused without throwing |
| Vocabulary and secrecy | 8 frozen duplicate-free codes; a rejected declaration serialises to exactly `{"accepted":false,"reason":"base:canonical-url"}` with no echoed host, path or scheme |

**Broad local gates.**

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — no package or lockfile change |
| `pnpm exec vitest run tests/unit/efs-uno-canonical-base.test.ts` | **57 / 57** |
| `node scripts/verify-governance-docs.mjs` | PASS — three frozen files match Owner-frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **9 / 9** |
| `pnpm test:bootstrap` | **19 / 19** and the CLI reports 11 required files, licence verified, four-slot WIP discipline, private authority screened, no credential or private-path leaks |
| `pnpm test:architecture` | **27 / 27** (25 preserved + 2 new) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings (empty report) |
| `pnpm typecheck` | exit 0 (empty report) |
| `pnpm test` | **588 passed / 588**, 17 files — 531 previous + **57 new** |
| `pnpm build` | PASS — exactly `/`, `/_not-found`, `/icon.svg`; no `en-001` route |
| `pnpm test:http` | **103 passed, 0 failed** — `/` 200; `/en` 404, `/en-001` 404, `/about` 404, unknown 404, `robots.txt` 404, `sitemap.xml` 404 |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical**; one **moderate** dev-only `minimatch` advisory remains disclosed, not waived |
| `git diff --check` | clean before the commit and clean after |
| Protected paths | 25 re-checked at the product head: 0 changed |

Testing a pure URL validator is **not** evidence of real HTTP serving, and none of these results demonstrates a
published Site, an indexable Page, a redirect or a live production base.


## 6. Hosted CI at the product head

**`cb6b88feb647f5ee8131f57e08edcf0df7e1ee2e` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `43895132164` | success | success | 24 / **0** |
| Uno Bootstrap Verify | `43895131202` | success | success | 10 / **0** |

Both hosts ran the governance verifier, the architecture suite and the blocking unit step that includes the new
canonical-base suite. **Full log text is UNVERIFIED** — this client reads job and step conclusions only. The
report-only head repeats the same four jobs; its run IDs are returned privately to the Owner.

## 7. Rights, warnings, cleanup and nonpublication

**Provenance and rights.** `src/core/efs/uno-canonical-base.ts` is original **Uno-owned** implementation, class
**NEW / ABSTRACT DESIGN**; no upstream source, fixture, schema or prose was copied. Historical Foundation GEO-03
`c05c55ea…` stays read-only design context for the *idea* of an absolute base and granted no import or write
permission. Solo, Connect and brand/media assets were excluded; Apache-2.0 notices and source history are
unchanged; the 17-family / 22-ID capability mapping is untouched; no dependency, workflow, asset or schema was
added.

**Warnings.** One **moderate** dev-only `minimatch` advisory (GHSA-g3hv-75wg-m249) remains disclosed and is not
waived; zero high or critical findings, so the blocking gate stays green on its own threshold.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or unpublished Foundation data is in
either commit or in this report. No governance guard was weakened, no cap raised, no workflow job edited and no
test skipped, mocked or deleted.

**Provider actions: zero.** No provider API call, manual deployment, promotion, alias, domain, analytics or
settings change; the only external effect was the authorized non-force Git push and whatever build the existing
Git integration starts from it.

**Nonpublication is preserved.** `deployment/uno.config.json`, `deployment/efs/**`, `deployment/site.config.json`
(absent), every `src/app/**` file, the landing page, logo, favicon, CSS, root noindex, analytics and every
workflow are byte-identical. The Next build still emits exactly `/`, `/_not-found` and `/icon.svg`; no `en-001`
route exists; `/` stays 200 and `/en`, `/en-001`, `/about`, unknown paths, `robots.txt` and `sitemap.xml` stay
404. No canonical tag, `hreflang`, sitemap, robots header or redirect was emitted or enabled.

**Cleanup.** Task scratch (`.temp/`) removed; the ignored package store and build outputs remain ignored; no
unknown ignored file was deleted; `git status` is clean at the product head; the private ACTIVE remains ignored
and unstaged.

## 8. Next U03 blocker and request

A validated base is data, not a deployment. U03 still needs an Owner-controlled integration of a real `base`
into the single-Site configuration, an explicit Site/Page publication decision, a full-locale policy and then
actual production HTTP, metadata and refusal proof — each under its own order. The committed Home Markdown is
recorded in `plan-next.md` as containing outdated statements and as **not approved for publication as-is**;
correcting it requires a separate Owner-approved content change.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this bounded U03 checkpoint:
one pure, fail-closed canonical-base and alias validator with a closed eight-code vocabulary, 57 focused cases
(48 of them refusals), a preserved baseline of 588 unit tests and 27 architecture checks, unchanged public 404
behaviour, zero provider actions and U03 still open.
