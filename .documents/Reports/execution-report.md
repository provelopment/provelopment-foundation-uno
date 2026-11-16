# UNO-WO-024 / R01 — Site publication-inputs composition

**Work order:** `UNO-WO-024 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 24,949 bytes, SHA-256 `d2fec044338cd6e0ac5f8df8df4dfcf49b29cf332e5c6028919e830babb61b20`,
first heading `UNO-WO-024 / R01`, matched before any write, ignored, untracked, unstaged, never printed or
committed.
**Owner decision:** the activation states **`I APPROVE THE U03 PUBLICATION-INPUTS CONTRACT IN §4 OF UNO-WO-024 /
R01.`**
**Push authorization:** the activation contains **`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`**,
covering only an incidental Git-linked build — never a manual provider action.
**Required start = actual start:** `4f19ea9b1a73e0a5df9f62ac7043bb2644972b39`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `PUBLICATION_INPUTS_COMPOSITION` | **PASS** | `src/application/validate-uno-site-publication-inputs.ts`, 15,808 B, blob `c0d22f63…`; pure, fail-closed, 11-code closed vocabulary |
| `REAL_FIXTURE_INTEGRATION` | **PASS** | committed manifest + committed selection → the authored one Entity / `foundation` / `main`, **one** candidate, `en-001` |
| `FOCUSED_TESTS` | **PASS** | **32** cases in one new suite with **39** exact-code refusal assertions, each also asserting vocabulary membership |
| `LAYERING` | **PASS** | registered as a scanned source; scanner refuses Node/Next/React/adapter/provider/deployment imports; no `src/app` consumer; no `src/core` dependency upward |
| `NONPUBLICATION` | **PASS** | manifest, selection, Home Markdown and every deployment/app/script/workflow path byte-identical; build route table unchanged |
| `BASELINE_PRESERVED` | **PASS** | 620 unit tests over 18 files (588 + 32); 29 architecture checks (27 + 2); 27 protected paths byte-identical |
| `PUBLIC_404_PRESERVED` | **PASS** | `/` 200; `/en`, `/en-001`, `/about`, unknown, `robots.txt`, `sitemap.xml` 404 |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | four jobs on two hosts, zero non-success steps (§6) |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, manual deploy, alias, domain or settings change; only the authorized Git push |
| `STAGE` | U03 **OPEN** | no closure, release, merge or publication authority is asserted |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`6cefe2c9cb473b382e097b53845d4100df05f42f`** | exactly six ledger paths; direct child of `4f19ea9` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/application/validate-uno-site-publication-inputs.ts` | CREATE | ABSENT → `c0d22f63…` | 15,808 |
| 2 | `tests/unit/efs-uno-site-publication-inputs.test.ts` | CREATE | ABSENT → `b3c618dd…` | 21,996 |
| 3 | `tests/architecture/u01-boundaries.test.mjs` | EDIT (additive) | `d1002cd6…` → `fce74d54…` | 40,407 |
| 4 | `.documents/Architecture/source-inventory.md` | EDIT (additive) | `9f95fedc…` → `b9b02294…` | 109,590 |
| 5 | `.documents/WIP/plan-roadmap.md` | EDIT | `33ecaf64…` → `94fb3b1c…` | 10,194 |
| 6 | `.documents/WIP/plan-next.md` | OVERWRITE | `bf87eeb7…` → `5b33bd48…` | 1,366 |

Both CREATE paths were absent at start; the inventory addition is 28 insertions and 0 deletions; the
architecture addition is 65 lines with no existing assertion altered; `git diff --cached --check` was clean
before the commit. No other tracked path changed.

## 3. Physical, parent, Git and privacy preflight (sanitized)

| Guard | Result |
| --- | --- |
| Physical root | the sole Uno checkout resolved physically; Git toplevel equals the checkout path; no symlink, junction or reparse alias |
| Ancestors and parent | the parent's anchored `/00.foundation-uno/` ignore rule verified and untouched; parent, Foundation, Solo and every sibling strictly read-only — never written, built, tested, installed or reconfigured |
| Worktrees / remotes | exactly one worktree, `main` checked out, one remote `origin` fetching and pushing only `provelopment/provelopment-foundation-uno`; no mirror; no reset, rebase, force, clean, amend or merge |
| Head and remote | local `HEAD` = `origin/main` = `4f19ea9`, re-read immediately before the push and still `4f19ea9` |
| Acting tree | clean before work; clean after the product push; no unexpected tracked, untracked or staged path |
| ACTIVE privacy | exactly one private ACTIVE, bytes and digest as above, ignored, untracked, unstaged, absent from every diff, never printed |
| WIP slots | exactly four: `plan-roadmap.md`, `plan-next.md`, the ignored private ACTIVE, `plan-outlook.md` |
| Pins | **27 / 27** protected blobs matched before the first write and again at the product candidate; all five editable/starting ledger blobs matched their required starting IDs; both CREATE paths confirmed ABSENT |
| Runtime | Node 26.x and pnpm 11.6.0 from the committed `package.json`; in-root install with an in-root store; no package, lockfile or dependency change |

## 4. The composition

`validateUnoSitePublicationInputs({manifest, selection, base, localePolicy})` accepts exactly that plain
own-data record and returns either a freshly copied, deeply frozen
`{accepted: true, site, canonicalBase, aliases, localePolicy, candidateCount}` or one of eleven closed
`publication-inputs:` codes:

`input-not-plain` · `input-shape` · `unreadable` · `manifest-invalid` · `selection-invalid` · `base-invalid` ·
`locale-policy-invalid` · `unsupported-representation` · `unrepresented-supported-locale` ·
`default-home-missing` · `route-index-invalid`

- **One authority per domain.** It calls `validateUnoManifestGraph`, then `validateUnoSiteSelection`, then
  `validateUnoCanonicalBase`, then `localePolicyIssue` on a descriptor-checked plain-data copy of exactly the
  three policy fields, then `buildUnoCandidateRouteIndex` **once**. It restates no rule, weakens none and adds
  no fifth validator; a sub-validator's `*:unreadable` maps to `publication-inputs:unreadable`.
- **Hostile values first.** The root record is read by descriptor: accessors are refused instead of invoked,
  symbols and exotic prototypes are refused before any value, a throwing trap becomes one closed code, sparse or
  accessor arrays refuse, and nothing is coerced, stringified or mutated.
- **One selected Site only.** The Site comes from the validated selection, never from the first array element;
  the index is built once and a refusal yields no partial candidate.
- **Locale agreement both ways.** Every authored representation locale must be promised by the policy
  (`unsupported-representation`), and every promised locale must be authored by that same Site
  (`unrepresented-supported-locale`). A locale authored only under a sibling Site therefore refuses. The
  declared default must additionally own a reserved Home — `pageId: "home"`, `routePath: ""` — in that exact
  full locale (`default-home-missing`), and a missing Home is never repaired from another locale or by
  manufacturing a Page.
- **No inferred locale.** Supported locales are compared as sets, so order never matters and no locale is
  auto-enrolled; canonical spelling, case collisions and the explicit `en: "en-001"` alias remain the policy's
  own rules; no language is guessed from geography.
- **Bounded output.** `supportedLocales` is copied and sorted by code point, `languagePreferences` keys are
  sorted into a fresh null-prototype map, aliases keep validated input order, and `candidateCount` counts
  declared candidate addresses — not published Pages. No `published`, `authorized`, `ready`, redirect, canonical
  URL, `hreflang`, visibility, sitemap, body or secret field exists in the result, and no file, socket, clock,
  environment or provider is touched.


## 5. Test evidence

**Real committed integration (PASS).** The committed `deployment/efs/manifest.json` and
`deployment/uno.config.json` are read as read-only data, with a synthetic `http://localhost:3000` base and the
policy `{supportedLocales:["en-001"], defaultLocale:"en-001", languagePreferences:{en:"en-001"}}`. The result
identifies the authored one Entity / `foundation` / `main`, reports `candidateCount: 1` and `en-001`, carries no
publication flag and no `https://` value, and a before/after SHA-256 comparison of the manifest, selection and
`deployment/efs/content/home.en-001.md` proves all three files stayed byte-identical.

**Focused suite — 32 cases, all passing, 39 exact-code refusals.** Required distinctions are proven separately:
`unsupported-representation` (an authored locale the policy omits), `unrepresented-supported-locale` (a promised
locale the selected Site never authors, including one authored only under a sibling Site) and
`default-home-missing` (a default whose Site has no reserved Home in that locale, including the case where
another locale *does* own a Home, so no fallback repair can hide it).

| Family | Observed |
| --- | --- |
| Acceptances | real committed fixture; path-prefixed base with two aliases in input order; eight-alias bound; two locales of one Site with a default Home; order-independent permutation; a canonical `zh-Hans-CN`; a non-default locale with a representation but no Home; the named Site chosen over the first Site of a Facet; fresh deep-frozen results with no caller mutation |
| Domain refusals | two-Entity manifest; manifest with a nested accessor (zero reads); wrong version, absent Site and absent Facet selections; `ftp://`, trailing-slash and uppercase-alias bases; bare `en`, unknown policy field, missing `defaultLocale`, empty `supportedLocales`; non-canonical / duplicate / case-colliding locales; `en` mapped to a non-approved target and to an unsupported locale; 33 supported locales; 17 preference keys |
| Request refusals | eight non-object roots; missing and extra keys; four wrong field kinds; accessor root and policy accessor with **zero** getter invocations; symbol key; exotic prototype; throwing Proxy (`unreadable`); sparse and accessor locale arrays; no-echo proof (`{"accepted":false,"reason":"publication-inputs:base-invalid"}` with no host, path or scheme) |

`publication-inputs:route-index-invalid` is a **mapped defensive code with no reachable construction**: the
manifest validator already refuses every construct the candidate index rejects (canonical locale spelling,
duplicate route, duplicate locale, reserved-Home pairing) and the pathname bound exceeds the maximum possible
pathname, so no honest test can produce it. Its mapping exists and its membership is asserted; its reachability
is **UNVERIFIED**, never faked.

**Broad local gates.**

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — no package or lockfile change |
| `pnpm exec vitest run tests/unit/efs-uno-site-publication-inputs.test.ts` | **32 / 32** |
| `node scripts/verify-governance-docs.mjs` | PASS — three frozen files match Owner-frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **9 / 9** |
| `pnpm test:bootstrap` | **19 / 19**; CLI reports 11 required files, licence verified, four-slot WIP discipline, private authority screened, no credential or private-path leaks |
| `pnpm test:architecture` | **29 / 29** (27 preserved + 2 new) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **620 passed / 620**, 18 files — 588 previous + **32 new** |
| `pnpm build` | PASS — exactly `/`, `/_not-found`, `/icon.svg`; no `en-001` route |
| `pnpm test:http` | **103 passed, 0 failed** — `/` 200; `/en`, `/en-001`, `/about`, unknown, `robots.txt`, `sitemap.xml` 404 |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical**; the known dev-only **moderate** `minimatch` advisory remains disclosed, not waived |
| `git diff --check` | clean before the commit and clean after |
| Protected paths | 27 re-checked at the product head: 0 changed |

Composing these inputs is **not** HTTP evidence: no route, redirect, canonical tag or `hreflang` was served or
emitted anywhere.


## 6. Hosted CI at the product head

**`6cefe2c9cb473b382e097b53845d4100df05f42f` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `43900937417` | success | success | 24 / **0** |
| Uno Bootstrap Verify | `43900937348` | success | success | 10 / **0** |

Both hosts ran the governance verifier, the architecture suite and the blocking unit step that includes the new
composition suite. **Full log text is UNVERIFIED** — this client reads job and step conclusions only. The
report-only head repeats the same four jobs; its run IDs are returned privately to the Owner.

## 7. Rights, warnings, cleanup and nonpublication

**Provenance and rights.** `src/application/validate-uno-site-publication-inputs.ts` is original **Uno-owned**
implementation, class **NEW / REWRITE concept**; the read-only Foundation GEO-03 commit `c05c55ea…` informed the
*idea* only and granted no import or write permission. The 17-family / 22-ID capability mapping, Apache-2.0
obligations and pinned source history are unchanged; no Foundation, Solo Rust, GEO-04, Connect, mark or asset was
imported and no dependency, workflow, schema, asset or lockfile line was added.

**Warnings.** One **moderate** dev-only `minimatch` advisory (GHSA-g3hv-75wg-m249) remains disclosed and
unwaived; zero high or critical findings, so the blocking gate passes on its own threshold. Local Windows
execution is **PASS**; WSL was not used and is **NOT APPLICABLE**.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or unpublished Foundation content
appears in either commit, in CI or in this report. No guard was weakened, no threshold raised, no workflow job
edited, and no test skipped, mocked or excluded.

**Provider actions: zero.** No provider API call, manual deployment, promotion, alias, domain, analytics or
settings change. The only external effect was the authorized non-force Git push and any build the existing Git
integration starts from it.

**Nonpublication is preserved.** `deployment/efs/manifest.json`, `deployment/uno.config.json`,
`deployment/efs/content/home.en-001.md`, every `src/app/**` file, the landing page, logo, favicon, CSS, root
noindex, analytics and both workflows are byte-identical. The build still emits exactly `/`, `/_not-found` and
`/icon.svg`; no `en-001` route exists; `/` stays 200 and `/en`, `/en-001`, `/about`, unknown paths,
`robots.txt` and `sitemap.xml` stay 404. No canonical tag, `hreflang`, sitemap, robots header, redirect, alias or
config migration was created, and no `src/app` source imports the composition.

**Cleanup.** Task scratch (`.temp/`) removed; ignored package store and build outputs remain ignored; no unknown
file was deleted; `git status` is clean at the product head; the private ACTIVE remains ignored and unstaged.

## 8. What remains unimplemented — U03 stays OPEN

A consistent composition is not a published Site. Still open, each requiring its own Owner order:

1. An Owner-selected **real** canonical base and the single-Site configuration migration that installs it —
   `deployment/uno.config.json` is deliberately unchanged, so no validated base is live.
2. The **Site locale authorities** the manifest still lacks; this order proves agreement with an *explicit
   caller policy*, not a stored per-Site locale authority.
3. An explicit **Page/Site publication decision** and real HTTP behaviour — status and error handling for
   unmatched, invalid and unlisted addresses — plus emitted metadata with canonical advertising and `hreflang`,
   and real locale routing.
4. The **stale Home Markdown**, recorded in `plan-next.md` as **not approved for publication as-is**; correcting
   it needs an Owner-approved content change.
5. Provider state (production SHA, build log, analytics) remains **UNVERIFIED** by this Agent.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this bounded U03 checkpoint:
one pure application composition of four already-validated inputs with an eleven-code closed vocabulary, 32
focused cases and 39 exact-code refusals, real committed-fixture integration with byte-identical inputs, a
preserved baseline of 620 unit tests and 29 architecture checks, unchanged public 404 behaviour, zero provider
actions and U03 still open.
