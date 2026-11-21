# Execution Report — UNO-WO-068 / R03

**Status: DELIVERED — both authored-JSON ingress depth bounds now match the published Page-document ceiling, and one
temporary composed-family fixture Page carries all seventeen bounded donor shapes through real composition, confined
loading, header projection, serving, production HTTP and Chromium. U04 remains OPEN.**
**Accounting: 22 registered v1 Uno module IDs unchanged; 17/17 donor families bounded-mapped; 0 entirely unmapped;
0/17 full semantic parity; 17/17 bounded shapes sampled over one temporary Page; no durable published family Page.**

## 1. Authority and start state

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-068 / R03`, EDITION FINAL — EXECUTE (supersedes the stopped R01 and R02 editions) |
| ACTIVE | `.documents/WIP/workorder-active.md` — **48,454 bytes**, SHA-256 `454eb3c45050c2481859bcb766bb032238cc2d351fcba745e1b939a7c26494c3`, ignored, untracked, unstaged, sole private WIP slot |
| Required start | `b6e9fd2e0891486081731d5f39a2faf391734c57` — matched `HEAD`, local `main`, `origin/main` and `git ls-remote` |
| Start blobs | A01 `9c366a29…`, A02 `8be82072…`, A03 `4ea59faf…`, A04 `d2f7c5c9…`, A05 `513c5c99…`, A06 `f46d9560…`, A07 `c4e3f46f…`, A08 `747bf2ed…` — all matched; read-only pins `compose-uno-foundation-families.ts` `24e30fca…`, `page-document.ts` `2d968300…`, `uno-page-sections.tsx` `cde15a6b…`, `uno-owned-media.ts` `f988a0e5…`, `plan-uno-page-assets.ts` `6e9265ba…`, `prepare-uno-page-delivery-candidate.ts` `c204e7b9…`, `uno-serving.ts` `720592f1…` — unchanged |
| Donor pins | `provelopment/provelopment-foundation` @ `c05c55ea…`: `LICENSE` `d6456956…`, `page-document.ts` `a12d964c…`, `page-document-content.tsx` `fc35a52d…`, `text-sections.tsx` `caeee577…`, `items-sections.tsx` `bc729d6a…` |
| Git/hooks | one checkout, 1 worktree, 1 branch `main`, 1 remote `origin`, 0 stashes, clean status, empty index; `core.hooksPath` unset and no active local hook files — both commits used the ordinary path with no override |
| Declarations | `ba232d46…e3f0` / `4f656c93…9a0c` — byte-exact before, after every stateful suite, and on handback |

## 2. Product commit and path set

| Commit | Parent | Contents |
| --- | --- | --- |
| **`1054b4bdc290ba55554f2a9c9454b1f14f982e34`** `UNO-WO-068 / R03: align both ingress JSON-depth bounds and sample all 17 donor families` | `b6e9fd2e…` | exactly eight `M`, 657 insertions / 48 deletions |

| File | Committed blob |
| --- | --- |
| A01 `scripts/verify-u04-22-module-consent.mjs` | `944294ca…` |
| A02 `tests/deployment/u04-22-module-consent.test.mjs` | `ff426884…` |
| A03 `tests/unit/uno-foundation-families.test.ts` | `f7188b4b…` |
| A04 `.documents/Architecture/u04-family-parity.md` | `e84c5e96…` |
| A05 `src/adapters/efs/uno-confined-source-reader.ts` | `c2142905…` |
| A06 `tests/unit/efs-confined-source-reader.test.ts` | `2ed497ae…` |
| A07 `src/core/efs/uno-page-header.ts` | `c0d51cda…` |
| A08 `tests/unit/efs-uno-page-header.test.ts` | `2b28e753…` |

No addition, deletion, rename, declaration, fixture, media or `src/core/**` file beyond A07 appears in the commit.

## 3. The two approved one-number contract corrections

| Contract | Before | After | Everything else |
| --- | --- | --- | --- |
| A05 `UNO_SOURCE_LIMITS.jsonDepth` | `8` | `16` | recursive walker, `depth > jsonDepth` → `content:json-depth`, `contentBytes 64 KiB`, `jsonNodes 4096`, `jsonKeysPerObject 512`, source kinds, Markdown, realpath/identity, decoder, error vocabulary unchanged |
| A07 `UNO_PAGE_HEADER_LIMITS.jsonDepth` | `8` | `16` | `jsonSafetyIssue`, `depth > jsonDepth` → `header:json-depth`, duplicate top-level authority-key scan, parser, prototype refusal, `sourceBytes 64 KiB`, `jsonNodes 4096`, 160/320 code-point field caps, visibility/Markdown policy unchanged; still returns an accepted header, never a publication verdict |

Both now equal the frozen `UNO_PAGE_DOCUMENT_LIMITS.jsonDepth: 16`. A06/A08 were written **red before** their source edit
(4 failures each) and green after. Boundary evidence, through the real `writeSource`/`diagnoseUnoConfinedSource` and the
real pure `projectUnoSelectedPageHeader`:

| Contract | depth 8 | 10 | 12 | 16 | 17 |
| --- | --- | --- | --- | --- | --- |
| loader (A06) | valid, bytes intact | valid | valid | valid | `invalid / content:json-depth`, no content |
| header (A08) | accepted, full header shape | accepted | accepted | accepted | `header:json-depth`, no partial header |

Still refusing at an admitted depth: nested `constructor`/`__proto__` (`content:json-pollution` / `header:json-pollution`),
over-wide objects and over-budget node counts (`content:json-width` / `header:json-width`), repeated top-level
`title`/`description`/`visibility` with a depth-10 payload (`header:json-duplicate-key`), exact-byte caps, invalid UTF-8,
NUL/control/HTML, symlink and traversal gates, and the unchanged published limit values.

## 4. Seventeen-family temporary Page evidence

One adapter call, one serialized buffer, one installed fifth fixture source, one Page.

* **Header.** `FAMILY_HEADER_ACCEPTED` passes twice: on the composed buffer **before** installation and on the
  **loaded** text after loading — accepted, authored title, `visibility: "public"`, keys limited to
  `accepted/description/kind/title/visibility`, no publication or transport field.
* **Loader / serving / media.** `FAMILY_LOAD_PARITY` returns the installed bytes unchanged; `FAMILY_SERVING_SERVED`
  returns `served` with exactly three ordered occurrences `family-4-media#0`, `family-5-gallery#0`, `family-5-gallery#1`
  at three distinct `/uno-media/en-001/wo066-family-composition/<n>` locators; `FAMILY_MEDIA=3/3` GET+HEAD byte equality;
  wrong-occurrence, wrong-locale and unlisted paths stay closed 404s.
* **HTTP.** `FAMILY_HTTP=200` with seventeen strict unique top-level ids in order, one `main`, one `h1`, no Home fallback.
  `FAMILY_TABLE_HTTP` — one `.uno-json-table-scroll` (`tabindex="0"`) wrapping `<table class="uno-json-table">`, one
  `<caption>Synthetic table</caption>`, two `<th scope="col">` in `Phase`/`Count` order, `<tbody>` with two rows and four
  cells in `First/1`, `Second/2` order, no link/img/script/form/button. `FAMILY_COLUMNS_HTTP` —
  `data-uno-columns="2" data-uno-item-semantics="plain" data-uno-ratio="start-wide"` with two `.uno-json-cell` groups, two
  tight stacks, `<h2>` `Left column`/`Right column`, `The left text.`, a native `<ul class="uno-json-list"` with
  `Check one`/`Check two`, no `<h3>`. `FAMILY_CARDS_HTTP` — native `<ul ... data-uno-columns="2" ... role="list">`, two
  `<li class="uno-json-cell">`, two titles, exactly one body, no ratio/article/link/img/button/icon. `FAMILY_FEATURES_HTTP`
  — separately scoped native list grid with `data-uno-columns="3"`, two `<li>`, two titles, one body, no fabricated
  content. `FAMILY_SEVENTEEN_HTTP` — the four regions add no second `main`/`h1`/script/frame/form control, six nested
  `<h2>` total, no donor copy and no `formRef`.
* **Chromium, 390 px and 1280 px.** `FAMILY_BROWSER` table/columns/cards/features/seventeen checks all pass with
  DOM-scoped direct-child counts and the table wrapper focus state; the earlier nine plus four semantics remain executed;
  zero foreign or provider requests, no new console or page error; `FAMILY_BROWSER=PASS`.
* **Unchanged baselines.** `FOUR_ZONE_HTTP=4/4`, `NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER`, 16 distinct `MATRIX_CASE` PASS,
  `BROWSER_MATRIX=16/16`, `FAMILY_CONTACT_OFF_HTTP`, `FAMILY_UNPUBLISHED_404`.

## 5. Refusals, privacy and rights

Eight new whole-Page probes over the appended sections, each from a fresh source, each `refused` with no own `document`:
`table.links` → `family:unsupported-feature`; ragged table row → `family:target-refused`; column body+list →
`family:unsupported-feature`; blank column title → `family:target-refused`; card image → `family:unsupported-feature`;
`cards.columns = 5` → `family:target-refused`; feature icon → `family:unsupported-feature`; empty feature body →
`family:target-refused`. One authored getter on `sections[16].items[0].title` yields `family:unsafe-source` with
**zero** invocations. The five earlier probes and the empty/image-only/contact-only binder refusals still pass.
The serialized Page contains no donor `/assets/` path, `formRef`, `contactForms`, `delivery-off`, webhook, provider,
recipient or secret string, and no `http(s)` URL. The contact region remains the existing fixed delivery-OFF notice.
`table`, `columns`, `cards` and `features` are bounded structural samples, not parity: Markdown rendering, donor heading
outlines (`h2` vs `h3`), donor card/feature borders, media, meta, actions and icons, links, remote media, rich forms and
every delivery semantic remain unimplemented. No donor text, brand, font, CSS, package or runtime source was copied;
the generated 64×64 plate is deleted by the fixture.

## 6. Local verification

| Gate | Result |
| --- | --- |
| `vitest` loader + header (A06/A08) | 97 passed |
| `vitest` families (A03, incl. ledger guard) | 126 passed |
| `node --test` runner guard (A02) | 35 passed, 0 failed |
| `pnpm test` | 30 files, 1053 passed |
| `pnpm test:architecture` / `typecheck` / `lint` / `eslint --max-warnings 0` | 0 |
| governance docs, `verify-governance-docs`, `test:bootstrap` | 0 |
| 7 deployment `node --test` suites, Vercel readiness, security exception | 0 |
| `verify-u03-published-http` | 542 passed, 0 failed |
| `verify-u04-json-slice` | 464 passed, 0 failed |
| `verify-u04-22-module-consent` | 670 passed, 0 failed |
| `pnpm build`, `verify-u03-trace --expect committed`, `test:http`, `verify-u03-http` | 0 |

Stateful suites ran strictly one at a time; declarations were re-hashed after each and every temporary source, capsule,
plate, generated asset and `.next` artefact was absent on handback. The picomatch advisory remains the pre-existing,
unwaived exception; no new high/critical advisory was introduced and no failure was suppressed.

## 7. Hosted CI

`Uno Bootstrap Verify` and `Verify U01 baseline` were independently verified on the product head
`1054b4bdc290ba55554f2a9c9454b1f14f982e34` (runs `44873201727` and `44873201723`): `verify (ubuntu-24.04)` and
`verify (windows-2025)` both `success`, with the U04 runner executing the new assertions rather than a skipped step.
Git-push-triggered deployments are the only publication side effect; no manual deployment, provider setting or
domain change was made.

## 8. Truthful limits and status

The fixture proves bounded structural mapping and evidence plumbing — not full Foundation family parity, not a durable
page, not a new module, route, entity, locale, provider or publication authority, and not a licence for donor assets.
The temporary source and plate were removed and both protected declarations were restored byte-exactly; the checkout is
clean and synchronized at the report head. **U04 remains OPEN**; only the Owner may separately approve stage closure.
