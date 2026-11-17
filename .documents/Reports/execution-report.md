# UNO-WO-032 / R01 — A custom Page and the whole published surface proved in a real browser

**Work order:** `UNO-WO-032 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 27,167 bytes, SHA-256 `11c1593dc2407732c9e31730ecd71397d2b201574f21bed5a404a6906bb0031d`, heading
`UNO-WO-032 / R01 — U03 integrated production-browser and custom-Page exit proof`; verified byte-for-byte, ignored,
untracked, unstaged, never printed, never staged.
**Push authorization:** the activation carries `AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`.
**Required start = actual start:** `bd1d26c3df40e615d3d53016e48dc0fe05ff7f77`.

## 1. Status

| Mandatory criterion | Status | Evidence |
| --- | --- | --- |
| 1 · Six positive Pages, own-source text, one `h1`, truthful lang, canonical/OG, same-Page alternates | **PASS** | Home, About and the custom `programmes/events` Page in `en-001` and `de-DE`; 6 HTTP 200s each with its own title, own-source sentence, one `h1`, exact canonical and OG, and only same-Page public alternates |
| 2 · `/en` a real 307 to the test-only canonical Home | **PASS** | exact `Location: http://localhost:3000/en-001`; no bare or guessed locale redirects |
| 3 · Sitemap exactly six `<loc>`, `x-default` only to the public default Home, robots agreement, unlisted still refused | **PASS** | 6 locations, two `hreflang` values, all `x-default` targets the default Home; robots names the test-only sitemap and disallows nothing; unlisted/draft absent from discovery and refused at HTTP |
| 4 · Negative real HTTP and browser | **PASS** | 15 refusal addresses are real 404s with no canonical, alternate, OG or authored text: draft, unlisted JSON, malformed preferred JSON, absent Page, wrong full locale, unsupported short locale, extra segment, cross-Page route, short and bare locales, the previous fixture URL |
| 5 · Real headless Chromium, not jsdom or request-only | **PASS** | `chromium.launch({headless:true})`, desktop 1280×720 and mobile 390×844, 104 assertions each, reduced motion, keyboard focus, no page/console error, no external request, no overflow |
| 6 · Crawler parity for two user agents | **PASS** | identical status, byte-identical document and identical canonical/robots/OG/alternate policy for all six Pages and the malformed-source refusal; a forged cookie changes nothing |
| 7 · Transactional safety and preserved baseline | **PASS** | 27/27 fault and ownership cases, 733/733 unit, 41/41 architecture, the original 195 assertions preserved inside an expanded **530/0** gate, U01 103/0 and U03 91/0 after a clean unpublished rebuild |
| 8 · Cross-host gate with real browser | **PASS** | product head: 4 jobs `success`, **28** steps each including the browser install and the browser-driven runner on Ubuntu 24.04 **and** Windows 2025; report head repeated in §7 |
| `COMMITTED_UNPUBLISHED` | **PASS** | `deployment/efs/manifest.json` `84866290…`, `deployment/uno.config.json` `fda8188c…`, `deployment/efs/content/home.en-001.md` `ef4254a3…` |
| `PROVIDER_ACTIONS` | **ZERO** | no domain, alias, deployment, release, provider account or Master Gateway work |
| `STAGE` | U03 **OPEN** | no live origin, no permanent publication, no screen-reader or indexing claim, no U04 renderer |

## 2. Commit and exact path set

**Product commit `7847879d2f1e5c55619ae1eab4380363767aab28`**, direct child of `bd1d26c`, **12 paths**, 898 insertions and
36 deletions:

| # | Op | Path | Start blob → final blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | EDIT | `package.json` | `1ef27f69…` → `91f045c5…` | — |
| 2 | EDIT | `pnpm-lock.yaml` | `0db53423…` → `e658179e…` | — |
| 3 | EDIT | `scripts/verify-u03-published-http.mjs` | `2b98dab3…` → `d76547a5…` | 43,106 |
| 4 | CREATE | `scripts/verify-u03-browser.mjs` | ABSENT → `99552287…` | 14,802 |
| 5 | EDIT | `.github/workflows/verify-u01.yml` | `edf50313…` → `fb48c7be…` | — |
| 6 | EDIT | `scripts/verify-vercel-readiness.mjs` | `8d71b515…` → changed | — |
| 7 | EDIT | `tests/deployment/verify-vercel-readiness.test.mjs` | `9edb1271…` → changed | — |
| 8 | EDIT | `tests/deployment/node26-security-floor.test.mjs` | `001ec3fc…` → changed | — |
| 9 | EDIT | `tests/architecture/u01-boundaries.test.mjs` | `d1ff4447…` → changed | — |
| 10 | EDIT | `.documents/Architecture/source-inventory.md` | `84241dab…` → changed | — |
| 11 | EDIT | `.documents/WIP/plan-roadmap.md` | `efd582f7…` → changed | — |
| 12 | OVERWRITE | `.documents/WIP/plan-next.md` | `3b8b4785…` → changed | — |

No `src/**`, `next.config.ts`, tracked `deployment/**` blob, app route, validator, source reader, SEO planner, publication
policy, fixture transaction, Foundation template, Solo, `modules/connect/**` or provider setting was modified. The
**report-only** commit that carries this file is a child of the product commit and touches nothing else.

## 3. The test-only browser: dependency, provenance, rights

**Exactly one dependency added:** `playwright@1.65.1` under `devDependencies`, license **Apache-2.0**, resolved by the
pinned pnpm 11.6.0 to `playwright-core@1.65.1` and nothing else — 19 added lockfile lines, no other resolution, no
`dependencies` change, no package script change, no postinstall, no new provider or analytics, no Node/pnpm pin change.

**Browser binary.** `pnpm exec playwright install --only-shell chromium` fetched only the Chromium **headless shell**
(`chromium_headless_shell-1255`, `winldd-1007`, `ffmpeg-1013`) into the repository-local ignored
`.temp/uno-u03-browsers`, locally and in both hosted jobs. `PLAYWRIGHT_BROWSERS_PATH` is set on the install step and on
the runner step, so no shared user cache and no OS package was written; the dependency-installing variants are never
invoked. Locally the launched build reports Chromium `159.0.8154.6`; the hosted jobs show the same install step
succeeding on both hosts. Downloads are tool setup, not provider operations, and no screenshot, video or trace is
committed.

**Enforcement added.** `tests/deployment/node26-security-floor.test.mjs` now pins the browser to dev-only, exact and
singular, and refuses, by name, a production placement, a drift, a range, a rival driver (`puppeteer`, `cypress`,
`webdriverio`, `selenium-webdriver`) and a drifted lockfile resolution. `scripts/verify-vercel-readiness.mjs` refuses a
workflow that loses the hermetic install, escapes the repository-local path, stops driving the publication runner, or
introduces OS-level dependency installation, and refuses a promoted or drifted browser pin. `tests/architecture/u01-boundaries.test.mjs`
proves the runner reaches the browser only through the single sanctioned test-only helper, that the helper is bounded and
loopback-only, and that no `src/**` module names the helper or imports the package.

**Rights.** The helper, the fixture text, the assertions and the documentation are original Uno work under the project's
Apache-2.0 terms. Playwright and its Chromium shell are consumed as an unmodified, exactly pinned test dependency; no
Foundation GEO-03, Geo, Solo or Connect source, asset or capability was imported, and no brand, licence or provider
authority changed.

## 4. Evidence, separated by kind

**HTTP (real production server on an ephemeral loopback port).** 530 checks pass, 0 fail — the previously accepted 195
assertions are all still present and are joined by: the custom Page's HTTP 200s, the six-entry sitemap with same-Page
alternates and a single default-Home `x-default`, the additional refusals, and 33 crawler-parity checks. `/en` answers
307 with the exact test-only `Location`. `/robots.txt` names the test-only sitemap and disallows nothing. The
declared-but-malformed JSON Page is refused by the loader and the planner **and** over HTTP, so no Markdown rescue exists.

**Browser DOM (a real headless Chromium process).** 104 desktop assertions and 104 mobile assertions — at least 17
independent checks on each of the six Pages in each viewport — plus 2 reduced-motion visibility checks, 11 refusal-document
checks and 2 keyboard checks, and the launch itself. Observed from the rendered document: status 200, exactly one visible
`h1` with the authored text, the own-source paragraph in visible text, `<html lang>`, `document.title`, canonical,
`og:url`, indexability, same-Page public alternates only, the `x-default` policy, authored list semantics, a heading
hierarchy, no horizontal overflow (2 px tolerance) at 390×844, no page error, no console error and no request to any
origin other than the loopback server.

**Basic accessibility and keyboard.** The skip link on the `/` demonstration takes focus on the first `Tab`; the refusal
document's return link is focusable; the refusal is a real 404 with one `h1`, a language, `noindex`, no canonical, no
alternate and no leaked authored text; content remains visible with `prefers-reduced-motion: reduce`. No keyboard
requirement was invented for Pages that contain no links.

**Not verified, and deliberately not claimed.** A screen-reader audit, WCAG conformance, a live HTTPS origin, real
search-engine discovery or indexing, a production provider, real-device browser behaviour, cross-browser rendering
beyond Chromium, and any U04 JSON rendering.

## 5. Guards, restoration and cleanup

| Guard | Result |
| --- | --- |
| ACTIVE | 27,167 bytes and digest matching the activation; ignored, untracked, unstaged, in no diff |
| Physical root | single Uno checkout resolved physically; no symlink, junction or reparse alias on it, its ancestors or any target |
| Parent and siblings | parent-owned anchored ignore rule unchanged; parent, Foundation, Solo and siblings read-only |
| Git | one worktree, `main`, one fetch/push remote; remote re-read and immobile immediately before the push |
| Pins | **26 / 26** immutable anchors byte-identical; **11 / 11** editable start blobs matched; the browser helper was absent |
| Toolchain | Node 26.13.1, pnpm 11.6.0, frozen lockfile install inside Uno |
| Restoration | both declarations restored byte-for-byte by the transaction; `git status -- deployment` empty; the three deployment inputs still at their pinned blobs |
| Fixtures | no `wo029-*`, `wo030-*`, `wo031-*` or `wo032-*` file remains; the nine task-owned sources were created and removed by the transaction |
| Privacy | no secret, credential, absolute personal path, private ACTIVE byte or fixture text in any commit, workflow, CI output or this report |


## 6. Gate results

| Gate | Result |
| --- | --- |
| Published HTTP + browser (`verify-u03-published-http.mjs`) | **530 passed, 0 failed**, exit 0 |
| Original U01 HTTP, after restoration and rebuild | **103 passed, 0 failed** |
| Original U03 fail-closed HTTP, after restoration and rebuild | **91 passed, 0 failed** |
| Fixture ownership and fault injection | **27 / 27** |
| `pnpm test` | **733 / 733** |
| `pnpm test:architecture` | **41 / 41** |
| `pnpm test:bootstrap` / governance docs | **19 / 19** / PASS, **9 / 9** |
| `pnpm lint` / `pnpm typecheck` / `pnpm build` | exit 0 / exit 0 / PASS |
| readiness fixtures / CLI | **76 / 76** / **107 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors (now including the browser) / brand contract | **22 / 22** / **29 / 29** |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean |

**Warnings, classified.** The two **moderate** advisories are the pre-existing dev-only `minimatch` family reachable
through ESLint; zero high and zero critical is what the blocking gate reports, and neither the threshold nor a waiver
changed. Node's benign "typeless package.json" notice still appears because the gate intercepts no warning event. The
Turbopack tracing notice for the serving composition is expected: that module reads the fixed declarations by design.
Playwright's install step printed only download progress; it introduced no advisory. No gate, step, matrix entry,
`continue-on-error` or runtime skip was added, removed or muted.

## 7. Hosted CI

| Head | Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- | --- |
| `7847879` (product) | Verify U01 baseline | `44050102610` | success | success | **28** / **0** |
| `7847879` (product) | Uno Bootstrap Verify | `44050102734` | success | success | 10 / **0** |
| report head | Verify U01 baseline | polled at the report head | success | success | 28 / 0 |
| report head | Uno Bootstrap Verify | polled at the report head | success | success | 10 / 0 |

At the product head the steps `Install pinned headless Chromium (test-only, repo-local)` and
`Run production HTTP and browser (U03 published Pages, restored afterwards)` both report **success on Ubuntu 24.04 and on
Windows 2025**, so the pinned headless shell really launches on both hosted runners and the proof is not skipped there.
Log **text** is **UNVERIFIED** — this client reads job and step conclusions only. Run IDs for the report head are
returned privately to the Owner.

## 8. U03 remains open — what still blocks a stage-exit ruling

**Four Owner decisions, which no Agent may infer:**
1. The real **HTTPS canonical origin** to declare as the base.
2. **Which real, named authored Pages** are approved to publish.
3. **Whether and when the protected `/` demonstration** may be replaced or retired.
4. Whether **build-time publication / rebuild-to-publish** is the accepted operational model, since a published address
   exists only after a build enumerates it.

**One reserved authority, stated precisely.** `deployment/site.config.json` remains absent. The A1 presentation
authority is reserved for U04's theme and shell, and this order neither invented a theme schema nor claimed that
presentation has been delivered. Its absence does not block the engineering exit evidence above, but it does mean no
appearance or tenant configuration exists yet; if the approved stage plan requires that configuration before U03 can
close, that is an Owner ruling, not something this report may assert.

**Technical dependencies still open.** The U04 versioned JSON contract and renderer (JSON bodies stay unserved until
then), and the 17-family / 22-module parity obligations. The proofs listed in §4 as *not verified* cannot be supplied by
a loopback fixture.

**Boundaries carried forward.** A test-only origin is not a chosen live domain; a fixture publication is not a delivered
website; a loopback production build plus a local browser is not a deployment; and no provider, release or stage-closure
authority was exercised here.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** on this evidence: one fixture and one
production build serving six published Pages including a custom nested-route Page in two authored locales, proved over
real HTTP and a real headless Chromium DOM at desktop and mobile viewports, with crawler parity, fifteen strict refusals,
a malformed-JSON non-rescue proof, a keyboard-reachable skip link and a genuine 404 document — 530 HTTP-plus-browser
checks passing, the original baseline preserved, the fixture restored byte-for-byte, the unpublished configuration
rebuilt, every other gate green, and four hosted jobs green on Ubuntu and Windows including the browser steps.
