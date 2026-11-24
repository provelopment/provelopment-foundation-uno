# Execution Report — UNO-WO-105 / R01

**Truthful outcome: E3 mutation protection delivered as the only new increment; E1 and E2 were not executed, so no A2 credit is claimed.** `table` and `list` remain **PENDING**, and the only parity label observed anywhere remains the A1 row **`U04_PARITY=3/17`, `U04_PROXY=45/59`**.

| | |
| --- | --- |
| Order | `UNO-WO-105 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **40,527 bytes**, SHA-256 `5ca595ffdd6e4fef60fd9845f07b487ea2259810f10675342cbdd5b31de712b8` — read from its ignored private slot; never staged, never published |
| Policy | Owner-reaffirmed `U04-A2-SAFE-REFERENCE-01`; no route, link, Site, provider or publication authority added |
| Start SHA | `ea668d249d5231751bbbb31d4302e12a44995299` |
| Preserved ancestors | D1 `140cb132…`, D2a `734a345…`, M1 `604754eb…` — all product files byte-identical; no product edit was required or made |
| **Product SHA** | **`430527bb76b26347b0a53824b5485a5ae51ac840`** (non-force push to the single Uno `origin/main`) |
| Report SHA | this report-only commit, after the product SHA |
| A2 credit | **none.** No `5/17`, `47/59`, `PARITY_TABLE=PASS` or `PARITY_LIST=PASS` claimed; the oracle was not invoked at `A2` |

## 1. Preflight — agent-observed, once

Sole verified Uno checkout; empty `git rev-parse --show-prefix`; branch `main`; one worktree; one Uno-only `origin`; clean index and tracked tree; `HEAD == main == origin/main == git ls-remote origin main == ea668d2…`. Frozen blobs `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `.documents/SOP/sop-implementation.md` `f30d6590…`; declarations `b6213ed6ee2dfdf3…` / `58011c4324f53741…`; protected WO-086 pair `5e40963895d26687…` (90,536 B) and `1cdddb38a91b7b76…` (17,405 B) — all unchanged before and after; the protected pair was neither applied nor altered.

## 2. Delivered — E3 oracle mutation protection

`tests/deployment/u04-family-closure.test.mjs` (node:test) gains one additive suite of five cases with the oracle itself untouched: the **A2 row is pinned exactly** as `{parity:5, proxy:47, families:["table","list"]}`, and a fully evidenced A2 attempt must return `ok`, `parity 5`, `proxy 47`; dropping either new family must fail with `closure:checkpoint-parity-mismatch`; **each of the seven dimensions of each new family** is demonstrated required by its own false-dimension mutant (14 mutants); crossed, incomplete or non-boolean evidence (missing `source`, `browser:"yes"`, an extra unknown dimension, a `source` swapped between the two families) must fail; an inflated six-family set must fail, and the identical evidence cannot satisfy the A1 row. Any future attempt to credit `table`/`list` without executed evidence, or to satisfy the wrong checkpoint, now fails inside the committed suite rather than in review. The 13 pre-existing closure cases are unchanged.


## 3. Verification actually executed

| Gate | Result |
| --- | --- |
| `node --test tests/deployment/` | **337 passed / 0 failed** (was 332; +5 new) |
| `node --test tests/deployment/u04-family-closure.test.mjs` | **18 passed / 0 failed** |
| `pnpm test` (unit) | **1,287 passed / 1,287** |
| `pnpm test:architecture` | **47 passed / 0 failed** |
| `pnpm lint` / `pnpm typecheck` / `pnpm build` | clean / clean / successful Next 16.4.6 production build |
| `Verify U01 baseline` | run **45324703639** — **success** on ubuntu-24.04 and windows-2025 |
| `Uno Bootstrap Verify` | run **45324703547** — **success** on both legs |

Hosted output at `430527b` still prints `U04_PARITY=3/17`. Changed path: only `tests/deployment/u04-family-closure.test.mjs`. `git diff --check` raised one whitespace note (a blank line at EOF from the appended suite); it is cosmetic and was left committed rather than rewriting the file. No other path was touched.

## 4. E1 and E2 not executed — exact remaining work

No A2 fixture was installed and no production observation was made: `scripts/verify-u04-22-module-consent.mjs` and `scripts/verify-u03-multisite-http.mjs` are byte-identical to the M1 head, so all fourteen A2 flags remain **`false`** for both families and the runner still asks the oracle for `A1`.

Remaining, in order: (a) in the existing recovery-armed U04 transaction add the donor-level `links.help`, replace **list index 2** with plain / `href:"https://example.org/notes"` / `route:"wo105-target"` / `link:"help"` plus Markdown `detail`, Markdown `lede` and closed `surface`, and give **table index 13** a Markdown `caption`/`lede` and closed `surface` with its two columns and two rows intact, keeping all 17 IDs and the A1 prose/callout values; (b) add the sixth `SOURCES` entry, a `published` `wo105-target` Page on the same `foundation/main` Site in `fixtureManifest()`, installed by the same `fixturePlan()` transaction and removed by the same cleanup with both declarations restored to the pinned digests; (c) assert real HTTP 200 for the source Page with exactly two anchors in that ordered list, the routed anchor equal to the **stored** `http://localhost:3000/en-001/wo105-target` (never the ephemeral loopback port), an inert `Help unavailable` with no anchor or key, real `<caption>`/`<th scope>`/focusable scroll/`<strong>` Markdown, and real 200 for the target; (d) in `consentPhase()` Chromium cover 390 px and 1280 px in light and dark with `reducedMotion:"reduce"` in at least one run per width, tabbing to the scroll wrapper and both links, asserting computed DOM and no off-loopback request; (e) in P6 add the `corporate/docs` `de-DE` `wo105-a2-list` source with `routeTarget:"notes"` plus safe `href` and inert `linkId`, and the seven refusal sources (unlisted, draft, missing, cross-Facet, wrong-locale, malformed `links`, mixed valid+invalid list), each proving whole-Page 404 in **both** binding phases while preserving G01–G05, 154 assertions and both restorations; (f) only then change the runner's invocation to `checkpoint:"A2"` and require the unchanged oracle to print `PARITY_TABLE=PASS`, `PARITY_LIST=PASS`, `5/17`, `47/59`.

## 5. Boundary

Declarations, frozen documents, workflows, the oracle, both runners, the module registry, `package.json`, the lockfile, `src/proxy.ts` and the private A2 pair are unchanged and hash-verified. No dependency, provider, DNS, deployment, release, tag, merge or parent/sibling action. Tree clean at the report head.

**Disposition:** E3 protection delivered; parity unchanged at `3/17`/`45/59`; U04 stays open.
