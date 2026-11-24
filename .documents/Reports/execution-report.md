# Execution Report — UNO-WO-106 / R01

**Truthful outcome: the real A2 fixture was implemented and executed against production `next build`/`next start` plus real Chromium, but the gate did not reach green, so nothing was committed and no A2 credit is claimed.** `table` and `list` remain **PENDING**; the repository stands at product SHA **`e5d5cd41cf0f93ae07ad674a8ff13f01f7758df4`** with all gates green and the U04 runner byte-identical to it.

| | |
| --- | --- |
| Order | `UNO-WO-106 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **36,421 bytes**, SHA-256 `0f5a8f86aa09425a85d819dc3f90c1648cbbd210c787c2a9081fc183ca7b82a3` — read from the ignored private slot; never staged or published |
| Start SHA | `e5d5cd41cf0f93ae07ad674a8ff13f01f7758df4` (`HEAD == main == origin/main == git ls-remote`) |
| Frozen blobs | `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `sop-implementation.md` `f30d6590…`; declarations `b6213ed6…`/`58011c43…`; WO-086 pair `5e409638…`/`1cdddb38…` — all unchanged |
| Product SHA | **unchanged: `e5d5cd41cf0f93ae07ad674a8ff13f01f7758df4`** |
| A2 credit | **none.** No `5/17`, `47/59`, `PARITY_TABLE=PASS` or `PARITY_LIST=PASS` claimed; the oracle still answers at `A1` |

## 1. What was built and really executed

In `scripts/verify-u04-22-module-consent.mjs` the order's A2-T1 recipe was implemented in full: donor-envelope `links.help`; list index 2 replaced by the four-item surface (`"Prepare"`, classified `href:"https://example.org/notes"` with Markdown detail, `route:"wo106-target"`, and the declared-but-off `link:"help"`), Markdown lede and `surface:"bordered"`; table index 13 given Markdown `caption`/`lede` and `surface:"muted"` with its two columns, two rows and heading intact; a sixth `SOURCES` entry `wo106-target.en-001.json` installed by the **same** recovery-armed transaction with `fixturePlan()`, published under the existing `foundation/main` Site in `fixtureManifest()`, and removed by the existing cleanup; plus A2 assertion blocks for source, reader, renderer-contract, seven refusals, real HTTP (`200` source, `200` target, stored `http://localhost:3000/en-001/wo106-target` anchor, `404` for an undeclared route), and a 24-check Chromium matrix at 390 px and 1280 px in light and dark with `reducedMotion:"reduce"` and real keyboard focus. The oracle call was switched to `checkpoint:"A2"` with `table`/`list` fed from a new `a2Evidence` record that starts all-false.

Two full production runs were executed (fresh `next build`, real `next start` on an ephemeral loopback port, real Playwright). The second reached **800 passed / 23 failed**. The fixture itself was installed, served and restored correctly: the target Page returned 200, the stored canonical anchor rendered, the inert link produced no anchor, the four items and two anchors were counted, the caption and `<strong>` Markdown, `th[scope]`, two rectangular rows, `tabindex="0"` and zero document overflow were all observed, and both declarations were restored to their pinned digests.

## 2. Why it was not committed

The 23 failures are ordinary, in-scope mismatch work that this run ran out of capacity to finish, not a safety or authority blocker. They cluster in four places, each now precisely identified from the real run:

1. **Composed shapes.** Authored Markdown ledes make the composer emit a two-child `layout.stack` (heading + native node carrying `markdown:true`) instead of the three-child heading/plain-lede/native shape; the older `FAMILY_TEXT_FIVE_SOURCE` and `FAMILY_TEXT_FIVE_HTTP` assertions (six failures) still expect the three-child form for indices 2 and 13 and must be re-pinned to the rich shape, and their stack/lede counts adjusted.
2. **Node identity in the DOM.** With a rich lede the `family-2-list-list` / `family-13-table-table` id sits on the section, not on the `<ol>` / scroll `<div>`; three pre-existing `FAMILY_BROWSER` checks still query the element directly and must be re-scoped to `.uno-json-list` / `.uno-json-table-scroll`.
3. **List reader equality.** `A2_READER` compares composed `props` to re-read `props` as serialized JSON; the table matches and the list does not, so the list's own key order (or a normalised `items` field) must be compared field-wise rather than by whole-string equality.
4. **Source item normalisation.** The plain string item arrives as `{label:"Prepare"}`, so the A2_SOURCE list predicate must assert the composer's normalised item shape rather than a bare string.

No product source, declaration, oracle, workflow or frozen document was modified, because no product defect was observed; every failure was a stale expectation or a test-side selector. Committing a runner that fails its own blocking gate would turn `Verify U01 baseline` red, so the runner was restored byte-for-byte to `e5d5cd4` rather than shipped broken.

## 3. Verified state at this report's product SHA

`pnpm test` **1,287/1,287**; `node --test tests/deployment/` **337/337**; `pnpm test:architecture` **47/0**; tracked tree clean and `scripts/verify-u04-22-module-consent.mjs` identical to `e5d5cd4`. Hosted proof at that SHA was already obtained earlier in this session: `Verify U01 baseline` 45324703639 and `Uno Bootstrap Verify` 45324703547, both green on Ubuntu and Windows. Scratch output lives only in the ignored `.temp/uno-wo106/` directory.

## 4. Exact next step

Re-apply the fixture (recipe above), then in one pass: re-pin the six `FAMILY_TEXT_FIVE_*` cases to the two-child rich shape, re-scope the three `FAMILY_BROWSER` selectors, compare the list re-read field-wise, and assert the normalised `{label}` item. Then rerun the single runner; when all 800+ checks pass and the unchanged oracle prints `PARITY_TABLE=PASS PARITY_LIST=PASS U04_PARITY=5/17 U04_PROXY=47/59`, commit and verify both hosted workflows before any report claims A2.

**Disposition:** A2 fixture implemented and observed; gate not green; parity unchanged at `3/17`/`45/59`; U04 stays open.
