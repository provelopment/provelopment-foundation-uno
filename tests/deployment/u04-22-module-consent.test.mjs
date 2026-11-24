/**
 * Hermetic guard for the bounded 22-module and four-provider consent gate (`UNO-WO-044 / R01`).
 *
 * This is not the gate. It is the guard that makes the gate hard to weaken: it audits the runner's source for the
 * invariants that give it meaning — the pinned declaration digests, the twenty-two authored module IDs, the four
 * governed providers, an unconditional `finally` restoration, and the absence of any silent-pass bypass — and it proves
 * the audit actually fails when one of those invariants is deleted. A green gate whose assertions can be quietly
 * removed is worth less than no gate at all.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();
const RUNNER = resolve(ROOT, "scripts/verify-u04-22-module-consent.mjs");
/**
 * `UNO-WO-112 / R01`: the gate's contract now spans its entrypoint **and** the extracted fixture module it orchestrates, so
 * the audited text is the pair. A fixture-shape token is still asserted — mutation-sensitive — but now against the file
 * that actually owns it, which is what keeps the extraction from becoming a place where a contract silently disappears.
 */
const RUNNER_SOURCE = readFileSync(RUNNER, "utf8");
const FIXTURE_SOURCE = readFileSync(resolve(ROOT, "scripts/u04/family-fixture.mjs"), "utf8");
const source = `${RUNNER_SOURCE}\n${FIXTURE_SOURCE}`;

/** The invariants that must survive any future edit to the runner. */
const REQUIRED = Object.freeze([
  'provider: "youtube"',
  'provider: "vimeo"',
  'provider: "rumble"',
  'provider: "bitchute"',
  "pre-consent Chromium DOM has zero iframes",
  "pre-consent made no provider request at all",
  "uses a governed fixed origin",
  "made exactly one provider request",
  "made no foreign network request",
  "unload removes the iframe",
  "unload restores focus to the consent control",
  "the authored fixture Page is accepted by the real validator",
  "the fixture carries all",
  "an unregistered module ID refuses the whole Page",
  "the unregistered-module Page answers HTTP 404",
  "is restored to its committed bytes",
  "nothing was staged by the gate",
  // `UNO-WO-048 / R01`: the owned-media HTTP proof must survive any future edit.
  "the served Page advertises an owned-media locator",
  "the authorised owned occurrence answers HTTP 200",
  "it forbids MIME sniffing",
  "HEAD answers HTTP 200 for the same authorised occurrence",
  "HEAD returns no body at all",
  "a non-video resource ignores a range and serves the full authorised 200",
  "an unauthorised locator is refused before any range is inspected",
  "an out-of-range occurrence is a closed 404",
  "prepareUnoU03FixtureTransaction",
  "finally",
]);

const FORBIDDEN = Object.freeze(["continue-on-error", "|| true", "process.exit(0)", "test.skip", "it.skip"]);

/** Every one of the twenty-two registered module IDs must be authored by the fixture. */
const MODULE_IDS = Object.freeze([
  "layout.stack", "layout.grid", "layout.bento", "layout.layers",
  "content.heading", "content.prose", "content.actions", "content.hero", "content.stats",
  "content.testimonials", "content.pricing", "content.timeline",
  "media.image", "media.video", "media.gallery", "media.carousel",
  "design.watermark", "design.motion",
  "interaction.tabs", "interaction.accordion", "interaction.modal", "interaction.contact",
]);

/** Phase A invariants (`UNO-WO-053 / R01`): the producer, four-zone, native-container and closed-refusal gates. */
const PHASE_A_REQUIRED = Object.freeze([
  // `UNO-WO-053 / R01` Phase A: the producer, four-zone, native-container and closed-refusal gates.
  "allModulesDocument(generatedIntegrity)",
  "{ path: SOURCES[1], bytes: allModulesJsonBytes }",
  "INSTALL_PARITY the installed source is the single authored buffer",
  "INSTALL_DOCUMENT_HAS_DIGEST",
  "LOAD_PARITY the loaded text is the installed bytes",
  "SERVING_SERVED the trusted serving planner serves the Page",
  "BAD_DOCUMENT_VALID the wrong-digest Page is syntactically accepted",
  "BAD_PAGE serving refuses the wrong generated digest",
  "FOUR_ZONE_HTTP=4/4",
  "NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER",
  "ZONE ${zone} ledger zone",
  "ZONE ${zone} ignores non-video Range",
  "wo052-native-mp4",
  "wo053-native-webm",
  '"wo053-native-webm", MEDIA.webm, "video/webm"',
  "text/vtt",
  "WEBVTT",
  "await expectVideoRanges(",
  "416 ${header}",
  "expectClosed404",
  "wo053-bad-generated",
  "for (const [relativePath] of createdMedia) {",
]);

/** Phase B invariants (`UNO-WO-054 / R01`): the executed sixteen-case browser matrix. */
const PHASE_B_REQUIRED = Object.freeze([
  'const MATRIX_WIDTHS = Object.freeze([320, 390, 768, 1280]);',
  'const MATRIX_SCHEMES = Object.freeze(["light", "dark"]);',
  'const MATRIX_MOTIONS = Object.freeze(["no-preference", "reduce"]);',
  "for (const width of MATRIX_WIDTHS)",
  "for (const colorScheme of MATRIX_SCHEMES)",
  "for (const reducedMotion of MATRIX_MOTIONS)",
  "await tab.setViewportSize({ width, height: 900 });",
  "await tab.emulateMedia({ colorScheme, reducedMotion });",
  'await tab.goto(MATRIX_URL, { waitUntil: "load" });',
  "no document horizontal overflow",
  "reduced-motion CSS",
  "two native controls and source/track/poster",
  "ArrowRight selects B and focuses it",
  "Home restores A and focus",
  "accordion Enter opens",
  "accordion Space closes",
  "Escape closes modal and restores focus",
  "carousel next changes live status",
  "carousel previous restores status",
  "zero iframe/provider requests before consent",
  "unload removes frame and restores focus",
  "matrixPassed += 1",
  "MATRIX_CASE ${caseId}",
  "BROWSER_MATRIX 16 distinct case IDs",
  "BROWSER_MATRIX=16/16",
]);

const PINNED = Object.freeze([
  "b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925",
  "58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952",
]);

/**
 * Phase C invariants (`UNO-WO-066 / R01`): the composed family Page, from the real adapter through installation,
 * loading, serving, production HTTP, owned-media bytes and Chromium, plus its unconditional cleanup.
 */
const PHASE_C_REQUIRED = Object.freeze([
  'await import("../src/application/compose-uno-foundation-families.ts")',
  "return compose(familySource(), familyBindings());",
  "FAMILY_COMPOSE_ACCEPTED the real adapter accepts the seventeen-section source once",
  "FAMILY_COMPOSE_ACCEPTED exact source-index ids and no extra section",
  "FAMILY_COMPOSE_ACCEPTED the accepted document is deeply frozen",
  "FAMILY_DOCUMENT_REACCEPTED the real reader reaccepts the same bytes with equal values",
  "FAMILY_SOURCE_NOT_SERIALIZED the donor identity and the acknowledgement never reach the Page",
  "FAMILY_SOURCE_NOT_SERIALIZED the Page carries the real Uno modules and the owned ref, not a donor path",
  "FAMILY_BINDING_REFUSED the identical source refuses with every incomplete binding",
  'FAMILY_ROUTE = Object.freeze(["wo066-family-composition"]);',
  "wo066-family-composition.en-001.json",
  "wo066-family-plate.png",
  "{ path: SOURCES[4], bytes: familyJsonBytes }",
  "FAMILY_INSTALL_PARITY the installed family source is the one composed buffer",
  'loadUnoCandidateSource({ repoRoot: ROOT, pathname: "/en-001/wo066-family-composition" })',
  "FAMILY_LOAD_PARITY the confined loader accepts and returns the installed bytes",
  "FAMILY_SERVING_SERVED the trusted serving planner serves the composed Page",
  "FAMILY_SERVING_SERVED one JSON Page and exactly three owned image occurrences in document order",
  "FAMILY_HTTP=200 the composed Page answers HTTP 200",
  "FAMILY_HTTP=200 the Page renders the seventeen authored section ids in document order",
  "FAMILY_CONTACT_OFF_HTTP the contact subtree carries no form, control, handler or destination",
  "FAMILY_CONTACT_OFF_HTTP neither the donor identity nor the acknowledgement appears anywhere in the HTML",
  "FAMILY_MEDIA=3/3 three distinct locators serve the one Page-owned plate with GET and HEAD",
  "FAMILY_UNPUBLISHED_404 an unlisted path stays a closed 404",
  "FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px",
  "family-6-contactform",
  // `UNO-WO-067 / R01`: the four appended donor shapes, their contractual ids and their executed evidence.
  'type: "hero",',
  'type: "stats",',
  'type: "steps",',
  'type: "quote",',
  '"family-9-hero"',
  '"family-10-stats"',
  '"family-11-steps"',
  '"family-12-quote"',
  "FAMILY_FOUR_REFUSALS each appended-family probe refuses the whole Page with its documented reason",
  "composeUnoFoundationSubset(probeSource, familyBindings())",
  "FAMILY_HERO_HTTP the served hero carries its authored surface, both Markdown bodies and both approved actions",
  "FAMILY_STATS_HTTP the served stats family carries its heading, Markdown lede, closed surface, pairs and Markdown detail",
  "FAMILY_STEPS_HTTP the steps region is one authored heading, Markdown lede and one ordered list of two titled items",
  "FAMILY_QUOTE_HTTP the quote region is one figure, blockquote and caption with separate attribution and role",
  "${width}px hero shows both Markdown bodies and both approved static actions",
  "${width}px stats show both Markdown bodies, the closed surface and two authored pairs",
  "${width}px steps show both Markdown bodies, the closed surface and two ordered titles",
  "${width}px quote shows one figure, blockquote and caption with separate attribution and role",
  "FAMILY_BROWSER ${label}",
  "${width}px the contact action stays in the same document and reaches its target",
  "${width}px Enter opens the FAQ disclosure",
  "the fixture source ${path} is removed",
  // `UNO-WO-068 / R03`: both ingress-depth corrections, the header projection evidence, the last four families,
  // their eight whole-Page refusals, the hostile-accessor proof and the seventeen-root evidence.
  "FAMILY_HEADER_ACCEPTED the composed buffer projects one accepted authored header before installation",
  "FAMILY_HEADER_ACCEPTED the loaded text projects the same accepted header with no extra authority",
  'await import("../src/core/efs/uno-page-header.ts")',
  'projectUnoSelectedPageHeader({\n      kind: "json",\n      text: familyJsonBytes.toString("utf8")',
  'type: "table",',
  'type: "columns",',
  'type: "cards",',
  'type: "features",',
  '  "family-13-table",',
  '  "family-14-columns",',
  '  "family-15-cards",',
  '  "family-16-features",',
  "FAMILY_LAST_FOUR_REFUSALS each last-four probe refuses the whole Page with its documented reason",
  "FAMILY_LAST_FOUR_REFUSALS an authored getter yields family:unsafe-source with zero invocations",
  'Object.defineProperty(getterSource.sections[16].items[0], "title"',
  "getterCalls === 0",
  "const cells = [...(region?.children ?? [])];",
  "family:unsafe-source",
  "FAMILY_TABLE_HTTP the table region is one scroll wrapper with a genuine captioned two-column table",
  "FAMILY_COLUMNS_HTTP the columns region is an authored plain two-column grid of two tight stacks",
  "FAMILY_CARDS_HTTP the cards region is a headed top-level stack with a native two-column list grid and one body",
  "FAMILY_FEATURES_HTTP the features region is a separate headed top-level stack with a native three-column list grid",
  "FAMILY_SEVENTEEN_HTTP the last four regions add no second main, h1, script, frame or form control",
  "${width}px table shows a captioned two-column table and its scroll control takes focus",
  "${width}px columns show two authored tight stacks with one paragraph and one native list",
  "${width}px cards show a headed stack with one authored h2, a two-column list grid and two h3 titles",
  "${width}px features show a separate headed stack with one authored h2, a three-column list grid and two h3 titles",
  "${width}px the composed Page carries seventeen unique top-level sections with no nested inflation",
  // `UNO-WO-069 / R01`: the divider parity candidate. Labels alone are not enough, so the executable predicates that
  // make each label meaningful are required tokens too, and A03 mutates them one at a time.
  "DIVIDER_PARITY_SOURCE the composed family-8-divider is one frozen content.prose",
  "DIVIDER_PARITY_SOURCE the serialized buffer carries that one divider node",
  "DIVIDER_PARITY_SOURCE the real reader re-reads the same divider node",
  "DIVIDER_PARITY_HTTP the composed Page serves exactly one native hr divider directly in the Uno root",
  "DIVIDER_PARITY_HTTP the served divider carries no heading, text, focus, interactive or media attribute",
  "${width}px divider is one native non-focusable hr directly in a 1.5rem flex column",
  "${width}px divider is a 1px theme-token rule with 1rem margins and 2.5rem separation each side",
  "${width}px divider sits exactly between the actions and hero siblings",
  "dark ${width}px divider keeps its native role, 1px theme rule and no focus or motion",
  "dark ${width}px divider keeps 1rem margins and 2.5rem separation on both sides",
  "dark ${width}px divider visit made no foreign or provider request",
  "DIVIDER_PARITY=PASS the divider passed source, HTTP and light/dark Chromium evidence",
  '<hr class="uno-json-divider" id="family-8-divider"/>',
  'seen.divider.borderTopWidth === "1px"',
  'seen.divider.borderTopStyle === "solid"',
  'seen.divider.borderTopColor === seen.divider.tokenColor',
  'seen.divider.tabIndex === -1',
  'seen.divider.previousId === "family-7-actions" && seen.divider.nextId === "family-9-hero"',
  'near(seen.divider.spaceBefore, expectedOffset, 1.5)',
  'near(seen.divider.spaceAfter, expectedOffset, 1.5)',
  "const expectedOffset = 2.5 * seen.divider.rootFont;",
  'await tab.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });',
  'scheme: matchMedia("(prefers-color-scheme: dark)").matches',
  'reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches',
  "dark.scheme === true",
  "dark.reducedMotion === true",
  "parseFloat(dark.transitionDuration) <= 1e-4",
  "let dividerOk = true;",
  "dividerChecks += 1;",
  "dividerOk === true && familyOk === true && dividerChecks === 12",
  // `UNO-WO-070 / R01`: the authored heading and item outline. Labels plus the executable predicates that make them
  // meaningful, so a neutered comparison cannot pass as evidence.
  'heading: "Synthetic cards",',
  'heading: "Synthetic features",',
  "FAMILY_ITEM_OUTLINE_SOURCE cards compose one frozen top-level stack with an authored h2 before a nested list grid of level-3 item titles",
  "FAMILY_ITEM_OUTLINE_SOURCE features compose the same stack, authored h2 and nested level-3 item outline",
  "FAMILY_ITEM_OUTLINE_SOURCE the seventeen top-level ids and all other fifteen families are unchanged",
  "FAMILY_ITEM_OUTLINE_SOURCE the real reader re-accepts both headed families from the serialized JSON",
  "FAMILY_ITEM_OUTLINE_HTTP both headed families serve exactly one authored h2 before two nested h3 titles, one list and no duplicate id",
  "${width}px the headed families keep one h2 before every item h3 with no invented control or overflow",
  'JSON.stringify(section.props) === "{}"',
  'heading.module === "content.heading"',
  "title.props.level === 3",
  'outlineOk(cardsRegion, "cards", "Synthetic cards", 2)',
  'outlineOk(featuresRegion, "features", "Synthetic features", 3)',
  'region.indexOf("<h2") < region.indexOf("<h3")',
  "new Set(allIds).size === allIds.length",
  "family.headingIsFirst",
  "seen.cards.h2 === 1 && seen.cards.h3 === 2",
  "seen.features.h2 === 1 && seen.features.h3 === 2",
  "seen.cards.uniqueIds",
  // `UNO-WO-080 / R01`: the served outline is now nine `h2` and ten `h3`, because the steps, FAQ and columns families
  // carry genuine level-3 item headings; the count stays an exact expectation rather than a lower bound.
  String.raw`(familyHtml.match(/<h3[\s>]/giu) ?? []).length === 9`,
  // `UNO-WO-071 / R01`: the authored plain-text lede — labels plus the executable predicates behind them.
  'lede: "Synthetic cards explain the choices.",',
  'lede: "Synthetic features describe the work.",',
  "FAMILY_LEDE_SOURCE cards compose exactly one lede paragraph in the ordered heading, lede and grid stack",
  "FAMILY_LEDE_SOURCE features compose exactly one lede paragraph in the same ordered stack",
  "FAMILY_LEDE_SOURCE the ledes add no node outside the two families and keep the seventeen top-level ids",
  "FAMILY_LEDE_SOURCE the composed JSON matches the installed buffer and the caller source is unmutated",
  "FAMILY_LEDE_REFUSALS each lede probe refuses the whole Page with its documented reason and no partial document",
  "FAMILY_LEDE_REFUSALS an authored card lede getter yields family:unsafe-source with zero invocations",
  "FAMILY_LEDE_HTTP each headed family serves exactly one lede paragraph after its h2 and before its native list",
  "FAMILY_LEDE_BROWSER the authored ledes were measured in real Chromium at both viewports",
  "${width}px each headed family shows its authored lede as one visible paragraph between the h2 and the list",
  'lede?.id === `family-${index}-${type}-lede`',
  'JSON.stringify(lede?.props) === JSON.stringify({ text: expectedText })',
  "ledeAt > headingEnd",
  "ledeAt < listAt",
  "ledeGetterCalls === 0",
  "family.ledeAfterHeading",
  "family.ledeBeforeGrid",
  "family.ledeVisible",
  "ledeBrowserChecks === 2",
  // `UNO-WO-072 / R01`: the authored stats/steps heading and lede — labels plus their executable predicates.
  'heading: "Synthetic numbers",',
  'lede: "Synthetic numbers **summarise** the sample.",',
  'heading: "Synthetic sequence",',
  'lede: "Synthetic steps keep the **authored** order.",',
  "FAMILY_STATS_STEPS_SOURCE stats compose one authored heading and lede before the unchanged stat list",
  "FAMILY_STATS_STEPS_SOURCE steps compose the same ordered text before the unchanged timeline node",
  "FAMILY_STATS_STEPS_SOURCE the authored-text families keep the seventeen ids and no other family changes",
  "FAMILY_STATS_STEPS_SOURCE the sequence JSON matches the installed buffer and the caller source is unmutated",
  "FAMILY_STATS_STEPS_REFUSALS each sequence probe refuses the whole Page with its documented reason",
  "FAMILY_STATS_STEPS_REFUSALS an authored steps heading getter yields family:unsafe-source with zero invocations",
  "FAMILY_STATS_STEPS_HTTP each sequence family serves its authored Markdown lede before its unchanged native list",
  "FAMILY_STATS_STEPS_BROWSER the sequence headings and ledes were measured in real Chromium at both viewports",
  "${width}px each sequence family shows its authored heading and one visible lede before its list",
  'section.children[0]?.id === `family-${index}-${type}-heading`',
  'JSON.stringify(section.children[1]?.props) === JSON.stringify(expectedLedeProps)',
  "JSON.stringify(section.children[2]) === JSON.stringify(expectedChild)",
  "sequenceGetterCalls === 0",
  "family.ledeBeforeList",
  "sequenceBrowserChecks === 2",
  // `UNO-WO-075 / R01`: the five-family authored plain-text heading and lede — labels plus their executable predicates.
  'heading: "Synthetic prose heading",',
  'lede: "Synthetic prose introduction & \\"quoted\\" wording, with *emphasis*.",',
  'heading: "Synthetic callout heading",',
  'lede: "Synthetic callout introduction.",',
  'heading: "Synthetic list heading",',
  'lede: "A **bounded list** on one published Page.",',
  'heading: "Synthetic FAQ heading",',
  'lede: "Synthetic FAQ introduction.",',
  'heading: "Synthetic table heading",',
  'lede: "The **table** explains synthetic totals.",',
  "FAMILY_TEXT_FIVE_SOURCE ${evidence.id} composes one frozen stack with the authored heading, the authored lede and the unchanged native node",
  "FAMILY_TEXT_FIVE_SOURCE the three remaining authored-text families add no top-level node and keep the seventeen ids",
  "FAMILY_TEXT_FIVE_REFUSALS each authored-text probe refuses the whole Page with its documented reason",
  "FAMILY_TEXT_FIVE_REFUSALS an authored prose heading getter yields family:unsafe-source with zero invocations",
  "FAMILY_TEXT_FIVE_REFUSALS a whitespace-only table lede refuses the whole Page despite four valid siblings",
  "FAMILY_TEXT_FIVE_HTTP family-${index}-${type} serves one authored h2 and one lede before its native node",
  "FAMILY_TEXT_FIVE_HTTP the three remaining authored-text families add seven stacks and three headings with no duplicate id, extra main or external destination",
  "FAMILY_TEXT_FIVE_BROWSER the five authored-text families were measured in real Chromium at both viewports",
  "textFiveGetterCalls === 0",
  "textFiveBrowserChecks === 2",
  "familyAccepted.sections.filter((section) => section.module === \"layout.stack\").length === 7",
  'id="family-0-prose" data-uno-align="center"',
  "family-13-table-table",
  "family-3-faq-accordion",
  "found.ledeBeforeNative",
  // `UNO-WO-084 / R01` (checkpoint A1): prose + callout rich parity — labels plus their executable predicates. Each
  // fragment must exist literally in the runner, so deleting a probe or neutering a predicate fails this guard.
  "A1_SOURCE the composed family-0-prose carries the authored heading, Markdown lede/body, align and surface",
  "A1_SOURCE the composed family-1-callout keeps its tone and carries an inside heading and Markdown body",
  "A1_READER the real reader re-reads both rich family nodes from the serialized buffer",
  "A1_RENDERER both rich family nodes carry exactly the closed renderer contract",
  "A1_REFUSAL raw markup, an image and a script scheme each refuse the whole source",
  "A1_HTTP the served family-0-prose keeps its authored heading, Markdown lede and body, align and surface",
  "A1_HTTP the served family-1-callout keeps its accent, tone and inside heading and lede",
  "A1_BROWSER=PASS prose passed twenty real-Chromium checks at 390px and 1280px in light and dark",
  "A1_BROWSER=PASS callout passed twelve real-Chromium checks at 390px and 1280px in light and dark",
  "U04_CLOSURE_ORACLE the cumulative oracle accepts the A1 row from the executed evidence",
  "a1ProseBrowserChecks === 20",
  "a1CalloutBrowserChecks === 12",
  "a1Evidence.prose.refusal = unsafeMarkup.status === \"refused\" && unsafeScheme.status === \"refused\"",
  "closure.ok === true && closure.parity === 3 && closure.proxy === 45 && familyOk && dividerOk",
  // `UNO-WO-080 / R01`: the three donor level-3 outlines — labels plus their executable predicates.
  "FAMILY_OUTLINE_THREE_SOURCE steps, faq and columns compose the documented level-3 item outline and refuse an authored level",
  "FAMILY_OUTLINE_THREE_HTTP the served Page puts the step titles, FAQ questions and column titles in level-3 headings of their own regions",
  "FAMILY_OUTLINE_THREE_BROWSER=PASS the three level-3 outline regions were measured in real Chromium at both viewports",
  "stepsTimeline.props.itemHeadingLevel === 3",
  "faqAccordion.props.summaryHeadingLevel === 3",
  'columnTitles.every((title) => title?.module === "content.heading" && title.props.level === 3)',
  'authoredLevelOutcome.reason === "family:unsupported-feature"',
  "stepsRegion.includes('<h3 class=\"uno-json-timeline-title\">Draft</h3>')",
  'columnsRegion.match(/<h3 class="uno-json-heading"/gu)',
  String.raw`stepsServed.match(/<li class="uno-json-timeline-item"[^>]*>(?:(?!<\/li>)[\s\S])*?<h3 class="uno-json-timeline-title">/gu)`,
  String.raw`faqServed.match(/<summary class="uno-json-disclosure-summary"><h3>[^<]+<\/h3><\/summary>/gu)`,
  String.raw`columnsServed.match(/<div class="uno-json-cell"[^>]*>\s*<div class="uno-json-stack"[^>]*>\s*<h3 class="uno-json-heading"[^>]*>/gu)`,
  "outlineSeen.stepParagraphTitles === 0",
  "outlineSeen.columnFirstChildIsHeading",
  "outlineBrowserChecks === 12",
  "darkOutline.columns === 2",
  // `UNO-WO-110 / R01` (§2): the fourth family — a malformed-table refusal, the production-HTTP rich DOM, the four-case
  // Chromium conjunction and the separate checkpoint-omitted four-family credit — labels plus their predicates.
  "A2_LOCAL_REFUSAL each malformed table refuses the whole source Page with a family reason and no partial document",
  "localA2.table.refusal = tableRefusalOk;",
  '["columns not an array", (source) => { source.sections[13].columns = "Phase"; }]',
  "localA2.table.http = familyHtmlResponse.status === 200",
  "A2_LOCAL_BROWSER the rich table was observed at 390px and 1280px in light and dark/reduced motion with its scroll control focused",
  'localA2.table.browser = conjunction(tableBrowserCases);',
  "if (tableLightOk) tableBrowserCases.add(`light:${width}`);",
  "if (darkTableOk) tableBrowserCases.add(`dark:${width}`);",
  "A2_LOCAL_TABLE_LIST_HERO_STATS_STEPS_EVIDENCE=35/35 (table, list, hero, stats and steps credited; P6 destination proof in the three-Site gate)",
  "U04_CLOSURE_ORACLE the checkpoint-omitted oracle credits exactly prose, callout, table and divider",
  'JSON.stringify(closureFour.credited) === JSON.stringify(["prose", "callout", "table", "divider"])',
  "closureFour.parity === 4",
  "closureFour.proxy === 46",
  'closureFour.pending.includes("list")',
  "table: localA2.table,",
  // `UNO-WO-111 / R01` (§3): the credited List's four-case browser conjunction and the earned A2 checkpoint, whose frozen
  // target is `5/17` / `47/59` over exactly `table` and `list`.
  "A2_LOCAL_BROWSER the rich list was observed at 390px and 1280px in light and dark/reduced motion with both proven anchors",
  'localA2.list.browser = conjunction(listBrowserCases);',
  "if (darkListOk) listBrowserCases.add(`dark:${width}`);",
  "list: localA2.list,",
  "hero: localA2.hero,",
  "stats: localA2.stats,",
  "steps: localA2.steps,",
  'checkpoint: "A2",',
  "U04_CLOSURE_ORACLE the A2 checkpoint credits exactly prose, callout, table, list and divider at 5/17 and 47/59",
  'JSON.stringify(closureA2.credited) === JSON.stringify(["prose", "callout", "table", "list", "divider"])',
  "closureA2.parity === 5",
  "closureA2.proxy === 47",
  'closureA2.labels.includes("PARITY_LIST=PASS")',
  // `UNO-WO-112 / R01` (§2–§3): the four extracted modules the entrypoint orchestrates, the credited Hero's own executed
  // dimensions, the shared conjunction/record helpers and the six-family checkpoint-omitted row.
  'from "./u04/family-fixture.mjs";',
  'from "./u04/family-evidence.mjs";',
  'from "./u04/hero-evidence.mjs";',
  'from "./u04/serving-harness.mjs";',
  "composeFamilyFixture(composeUnoFoundationSubset)",
  "table: createFamilyEvidence(),",
  "list: createFamilyEvidence(),",
  "hero: createFamilyEvidence(),",
  "localA2.hero.browser = conjunction(heroBrowserCases);",
  "localA2.hero.source = familyAccepted.sections[9]?.module === \"content.hero\"",
  "localA2.hero.reader = heroReaderOk;",
  "localA2.hero.refusal = heroRefusalOk;",
  "localA2.hero.http = familyHtmlResponse.status === 200 && heroFacts.ok;",
  "Object.values(localA2).every((record) => isCreditable(record))",
  "const heroRegion = heroRegionOf(familyHtml);",
  "const heroFacts = heroServed(heroRegion);",
  "const heroServedActions = heroActionsOf(heroRegion);",
  "A2_LOCAL_BROWSER the rich hero was observed at 390px and 1280px in light and dark/reduced motion with both actions intact",
  "A2_LOCAL_REFUSAL every malformed hero refuses the whole source Page with the family's own reason",
  "A2_LOCAL_READER the installed bytes re-read to the same rich list, table and hero, with the one approved declaration",
  "U04_CLOSURE_ORACLE the unchanged oracle credits exactly prose, callout, table, list, hero, stats, steps and divider at B1 8/17 and 50/59",
  'JSON.stringify(closureB1.credited)',
  "closureB1.parity === 8",
  "closureB1.proxy === 50",
  'closureB1.labels.includes("PARITY_STATS=PASS")',
  'closureB1.labels.includes("PARITY_HERO=PASS")',
  'closureB1.labels.includes("PARITY_STEPS=PASS")',
  // `UNO-WO-113 / R01` (§2–§3): the extracted Stats module, the credited family's own executed dimensions, and the
  // seven-family checkpoint-omitted row.
  'from "./u04/stats-evidence.mjs";',
  "stats: createFamilyEvidence(),",
  "localA2.stats.source = familyAccepted.sections[10]?.module === \"layout.stack\"",
  "localA2.stats.reader = statsReaderOk;",
  "localA2.stats.refusal = statsRefusalOk;",
  "localA2.stats.http = familyHtmlResponse.status === 200 && statsFacts.ok;",
  "localA2.stats.browser = conjunction(statsBrowserCases);",
  "localA2.stats.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE)",
  "const statsRegion = statsRegionOf(familyHtml);",
  "const statsFacts = statsServed(statsRegion);",
  "const statsPairs = statsPairsOf(statsRegion);",
  "JSON.stringify(familyAccepted.sections[10]?.children?.[2]?.props) === JSON.stringify(statsNodeProps())",
  "A2_LOCAL_BROWSER the rich stats family was observed at 390px and 1280px in light and dark/reduced motion with both Markdown bodies",
  "A2_LOCAL_REFUSAL every malformed stats family refuses the whole source Page with the family's own reason",
  "FAMILY_STATS_HTTP the served stats family carries its heading, Markdown lede, closed surface, pairs and Markdown detail",
  "FAMILY_STATS_HTTP the stats pairs are exactly the authored values, labels and detail in order",
  "${width}px stats show both Markdown bodies, the closed surface and two authored pairs",
  "dark ${width}px the stats family keeps both Markdown bodies, the closed surface and its pairs",
  "U04_CLOSURE_ORACLE the unchanged oracle credits exactly prose, callout, table, list, hero, stats, steps and divider at B1 8/17 and 50/59",
  "closureB1.parity === 8",
  "closureB1.proxy === 50",
  // `UNO-WO-114 / R01` (§1–§3): the extracted Steps module, the credited family's own executed dimensions, and the declared
  // B1 checkpoint row the unchanged oracle enforces.
  'from "./u04/steps-evidence.mjs";',
  "steps: createFamilyEvidence(),",
  "localA2.steps.source = familyAccepted.sections[11]?.module === \"layout.stack\"",
  "localA2.steps.reader = stepsReaderOk;",
  "localA2.steps.refusal = stepsRefusalOk;",
  "localA2.steps.http = familyHtmlResponse.status === 200 && stepsFacts.ok;",
  "localA2.steps.browser = conjunction(stepsBrowserCases);",
  "localA2.steps.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE)",
  "const stepsRegion = stepsRegionOf(familyHtml);",
  "const stepsFacts = stepsServed(stepsRegion);",
  "const stepsItems = stepsItemsOf(stepsRegion);",
  "JSON.stringify(familyAccepted.sections[11]?.children?.[2]?.props) === JSON.stringify(stepsNodeProps())",
  "A2_LOCAL_BROWSER the rich steps family was observed at 390px and 1280px in light and dark/reduced motion with both Markdown bodies",
  "A2_LOCAL_REFUSAL every malformed steps family refuses the whole source Page with the family's own reason",
  "FAMILY_STEPS_HTTP the served steps family carries its heading, Markdown lede, closed surface, ordered titles and Markdown body",
  "FAMILY_STEPS_HTTP the step titles and body are exactly the authored ones in order, with no invented status, current step or date",
  "${width}px steps show both Markdown bodies, the closed surface and two ordered titles",
  "dark ${width}px the steps family keeps its ordered titles and both Markdown bodies with no invented state",
  '  checkpoint: "B1",',
  "composeFamilyFixture(composeUnoFoundationSubset)",
]);
/** Audit one runner source and return every invariant it fails. An empty list means the gate is intact. */
function audit(text) {
  const missing = [];
  for (const token of [...REQUIRED, ...PHASE_A_REQUIRED, ...PHASE_B_REQUIRED, ...PHASE_C_REQUIRED]) if (!text.includes(token)) missing.push(token);
  for (const token of FORBIDDEN) if (text.includes(token)) missing.push(`forbidden: ${token}`);
  for (const id of MODULE_IDS) if (!text.includes(`"${id}"`)) missing.push(`module: ${id}`);
  for (const digest of PINNED) if (!text.includes(digest)) missing.push(`digest: ${digest}`);
  if (!/finally\s*\{[\s\S]*restore\(/u.test(text)) missing.push("the finally block does not restore the fixture");
  return missing;
}

describe("verify-u04-22-module-consent — hermetic guard", () => {
  it("the runner exists and is the one authorized by this order", () => {
    assert.ok(source.length > 8_000, "the runner is suspiciously small");
    assert.match(source, /UNO-WO-044/u);
  });

  it("the intact runner satisfies every invariant", () => {
    assert.deepEqual(audit(source), []);
  });

  it("the audit genuinely fails when a pre-consent assertion is deleted", () => {
    const mutated = source.replace('check("pre-consent made no provider request at all"', 'check("x"');
    assert.notDeepEqual(audit(mutated), []);
  });

  it("the audit genuinely fails when a module ID is dropped from the fixture", () => {
    const mutated = source.replaceAll('"interaction.contact"', '"content.prose"');
    const missing = audit(mutated);
    assert.ok(missing.some((entry) => entry.includes("interaction.contact")), missing.join(","));
  });

  it("the audit genuinely fails when the restoration check is removed", () => {
    const mutated = source.replace("is restored to its committed bytes", "is whatever");
    assert.notDeepEqual(audit(mutated), []);
  });

  it("the audit genuinely fails when a silent-pass bypass is introduced", () => {
    const mutated = `${source}\nprocess.exit(0);\n`;
    assert.ok(audit(mutated).some((entry) => entry.startsWith("forbidden:")));
  });

  it("the audit genuinely fails when a provider is dropped", () => {
    const mutated = source.replaceAll('provider: "bitchute"', 'provider: "vimeo"');
    assert.ok(audit(mutated).some((entry) => entry.includes("bitchute")));
  });

  it("the pinned declarations in the runner match the committed bytes", () => {
    for (const digest of PINNED) assert.ok(source.includes(digest));
  });

  // `UNO-WO-053 / R01` §6: independent Phase A mutations. Each deletes one real gate and must change the audit.
  it("the audit genuinely fails when the generated integrity argument is dropped again", () => {
    const mutated = source.replaceAll("allModulesDocument(generatedIntegrity)", "allModulesDocument()");
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes("allModulesDocument(generatedIntegrity)")), audit(mutated).join(","));
  });

  it("the audit genuinely fails when fixturePlan regenerates a second Page", () => {
    const mutated = source.replace("{ path: SOURCES[1], bytes: allModulesJsonBytes }", "{ path: SOURCES[1], bytes: Buffer.from(JSON.stringify(allModulesDocument())) }");
    assert.notEqual(mutated, source);
    assert.notDeepEqual(audit(mutated), []);
  });

  it("the audit genuinely fails when an installed or loaded parity check is deleted", () => {
    for (const token of ["INSTALL_PARITY the installed source is the single authored buffer", "LOAD_PARITY the loaded text is the installed bytes"]) {
      const mutated = source.replace(`"${token}"`, '"removed"');
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(token)), token);
    }
  });

  it("the audit genuinely fails when a zone, the WebM case or a gate label is dropped", () => {
    const dropped = source
      .replace('["platform", "wo052-platform-image", "image", "image/png"', '["platform", "wo052-platform-image"')
      .replace('"wo053-native-webm", MEDIA.webm, "video/webm"', '"wo052-native-mp4", MEDIA.mp4, "video/mp4"')
      .replace('check("FOUR_ZONE_HTTP=4/4"', 'check("x"')
      .replace('check("NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER"', 'check("y"');
    const missing = audit(dropped);
    assert.ok(missing.some((entry) => entry.includes("FOUR_ZONE_HTTP=4/4")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("NATIVE_VIDEO_HTTP")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("video/webm")), missing.join(","));
  });

  it("the audit genuinely fails when range or refusal coverage disappears", () => {
    const mutated = source
      .replaceAll("await expectVideoRanges(", "void (")
      .replaceAll("416 ${header}", "nope");
    const missing = audit(mutated);
    assert.ok(missing.some((entry) => entry.includes("expectVideoRanges")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("416")), missing.join(","));
  });

  it("the audit genuinely fails when owned-media cleanup is removed", () => {
    const mutated = source.replace("for (const [relativePath] of createdMedia) {", "for (const [relativePath] of []) {");
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes("createdMedia")), audit(mutated).join(","));
  });

  // `UNO-WO-054 / R01` §5: independent Phase B mutations. Each deletes an executed matrix contract.
  it("the audit genuinely fails when a matrix dimension is removed", () => {
    const shapes = [
      [source.replace("320, 390, 768, 1280", "390, 768, 1280"), "MATRIX_WIDTHS"],
      [source.replace("320, 390, 768, 1280", "320, 390, 768"), "MATRIX_WIDTHS"],
      [source.replace('["light", "dark"]', '["light"]'), "MATRIX_SCHEMES"],
      [source.replace('["no-preference", "reduce"]', '["no-preference"]'), "MATRIX_MOTIONS"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the emulation, navigation or a layout/motion check is removed", () => {
    const shapes = [
      [source.replace("await tab.emulateMedia({ colorScheme, reducedMotion });", ""), "emulateMedia"],
      [source.replace('await tab.goto(MATRIX_URL, { waitUntil: "load" });', ""), "MATRIX_URL"],
      [source.replace("no document horizontal overflow", "overflow tolerated"), "horizontal overflow"],
      [source.replace("reduced-motion CSS", "motion unverified"), "reduced-motion"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when a keyboard or interaction assertion is removed", () => {
    const shapes = [
      [source.replace("ArrowRight selects B and focuses it", "tab unverified"), "ArrowRight"],
      [source.replace("Home restores A and focus", "tab unverified"), "Home restores"],
      [source.replace("accordion Enter opens", "accordion unverified"), "accordion Enter"],
      [source.replace("accordion Space closes", "accordion unverified"), "accordion Space"],
      [source.replace("Escape closes modal and restores focus", "modal unverified"), "Escape closes modal"],
      [source.replace("carousel next changes live status", "carousel unverified"), "carousel next"],
      [source.replace("carousel previous restores status", "carousel unverified"), "carousel previous"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when consent, unload or native-media coverage is removed", () => {
    const shapes = [
      [source.replace("zero iframe/provider requests before consent", "consent unverified"), "zero iframe"],
      [source.replace("unload removes frame and restores focus", "unload unverified"), "unload removes"],
      [source.replace("two native controls and source/track/poster", "media unverified"), "native controls"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the matrix gate, its counting or its case emission is weakened", () => {
    const shapes = [
      [source.replace("matrixPassed += 1", "matrixPassed += 0"), "matrixPassed"],
      [source.replace("MATRIX_CASE ${caseId}", "CASE"), "MATRIX_CASE"],
      [source.replace("BROWSER_MATRIX=16/16", "BROWSER_MATRIX=ok"), "BROWSER_MATRIX=16/16"],
      [source.replace('BROWSER_MATRIX 16 distinct case IDs', 'BROWSER_MATRIX ids'), "BROWSER_MATRIX 16 distinct case IDs"],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  // `UNO-WO-066 / R01` §5: independent Phase C mutations. Each one deletes a real executed family-Page check, and the
  // audit must name the invariant that disappeared.
  it("the audit genuinely fails when the real adapter is replaced by a hand-authored Page", () => {
    const mutated = source
      .replace('await import("../src/application/compose-uno-foundation-families.ts")', "await import(\"../src/core/page-document.ts\")")
      .replace("composeFamilyFixture(composeUnoFoundationSubset)", "({ status: \"composed\", document: familySource() })");
    assert.notEqual(mutated, source);
    const missing = audit(mutated);
    assert.ok(missing.some((entry) => entry.includes("compose-uno-foundation-families.ts")), missing.join(","));
    assert.ok(missing.some((entry) => entry.includes("composeFamilyFixture(composeUnoFoundationSubset)")), missing.join(","));
  });

  it("the audit genuinely fails when the fifth fixture source is not installed from the composed buffer", () => {
    const mutated = source.replace("{ path: SOURCES[4], bytes: familyJsonBytes }", "{ path: SOURCES[4], bytes: allModulesJsonBytes }");
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes("SOURCES[4], bytes: familyJsonBytes")), audit(mutated).join(","));
  });

  it("the audit genuinely fails when the composed-install or composed-load parity check is deleted", () => {
    for (const token of [
      "FAMILY_INSTALL_PARITY the installed family source is the one composed buffer",
      "FAMILY_LOAD_PARITY the confined loader accepts and returns the installed bytes",
      "FAMILY_SERVING_SERVED one JSON Page and exactly three owned image occurrences in document order",
    ]) {
      const mutated = source.replace(`"${token}"`, '"removed"');
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(token)), token);
    }
  });

  it("the audit genuinely fails when the family HTTP, media-byte or contact-OFF check is weakened", () => {
    const shapes = [
      ['check("FAMILY_HTTP=200 the composed Page answers HTTP 200"', 'check("FAMILY_HTTP=ok"', "FAMILY_HTTP=200"],
      ["FAMILY_MEDIA=3/3 three distinct locators serve the one Page-owned plate with GET and HEAD", "FAMILY_MEDIA=served", "FAMILY_MEDIA=3/3"],
      ["FAMILY_CONTACT_OFF_HTTP the contact subtree carries no form, control, handler or destination", "contact unchecked", "FAMILY_CONTACT_OFF_HTTP"],
      ["FAMILY_UNPUBLISHED_404 an unlisted path stays a closed 404", "unlisted unchecked", "FAMILY_UNPUBLISHED_404"],
    ];
    for (const [from, to, contract] of shapes) {
      const mutated = source.replace(from, to);
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the family browser, keyboard or cleanup token is removed", () => {
    const shapes = [
      ["FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px", "family browser unverified", "FAMILY_BROWSER=PASS"],
      ["${width}px Enter opens the FAQ disclosure", "faq unverified", "Enter opens the FAQ"],
      ["${width}px the contact action stays in the same document and reaches its target", "anchor unverified", "reaches its target"],
      ["the fixture source ${path} is removed", "cleanup skipped", "the fixture source ${path} is removed"],
    ];
    for (const [from, to, contract] of shapes) {
      const mutated = source.replace(from, to);
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  // `UNO-WO-067 / R01` §5: five independent mutations over the appended families, each failing for its own token.
  it("the audit genuinely fails when an appended source shape is changed", () => {
    const shapes = [
      [source.replaceAll('type: "hero",', 'type: "prose",'), 'type: "hero",'],
      [source.replaceAll('type: "stats",', 'type: "prose",'), 'type: "stats",'],
      [source.replaceAll('type: "steps",', 'type: "prose",'), 'type: "steps",'],
      [source.replaceAll('type: "quote",', 'type: "prose",'), 'type: "quote",'],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when an appended top-level id is changed", () => {
    const mutated = source.replaceAll('"family-12-quote"', '"family-12-testimonial"');
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes('"family-12-quote"')), audit(mutated).join(","));
  });

  it("the audit genuinely fails when a new family HTTP assertion is replaced", () => {
    const shapes = [
      [
        source.replace(
          "FAMILY_STEPS_HTTP the steps region is one authored heading, Markdown lede and one ordered list of two titled items",
          "steps region unchecked",
        ),
        "FAMILY_STEPS_HTTP",
      ],
      [
        source.replace(
          "FAMILY_HERO_HTTP the served hero carries its authored surface, both Markdown bodies and both approved actions",
          "hero region unchecked",
        ),
        "FAMILY_HERO_HTTP",
      ],
      [
        source.replace(
          "FAMILY_STATS_HTTP the served stats family carries its heading, Markdown lede, closed surface, pairs and Markdown detail",
          "stats region unchecked",
        ),
        "FAMILY_STATS_HTTP",
      ],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when a new family browser assertion is replaced", () => {
    const shapes = [
      [
        source.replace(
          "${width}px quote shows one figure, blockquote and caption with separate attribution and role",
          "${width}px quote unverified",
        ),
        "${width}px quote shows one figure",
      ],
      [
        source.replace(
          "${width}px hero shows both Markdown bodies and both approved static actions",
          "${width}px hero unverified",
        ),
        "${width}px hero shows both Markdown bodies",
      ],
    ];
    for (const [mutated, contract] of shapes) {
      assert.notEqual(mutated, source);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the whole-Page refusal probe is neutered", () => {
    const mutated = source.replace(
      "FAMILY_FOUR_REFUSALS each appended-family probe refuses the whole Page with its documented reason",
      "FAMILY_FOUR_REFUSALS recorded",
    );
    assert.notEqual(mutated, source);
    assert.ok(audit(mutated).some((entry) => entry.includes("FAMILY_FOUR_REFUSALS")), audit(mutated).join(","));
    // A probe that no longer composes the adapter cannot refuse anything.
    const unprobed = source.replace("composeUnoFoundationSubset(probeSource, familyBindings())", "({ status: \"refused\" })");
    assert.notEqual(unprobed, source);
    assert.ok(
      audit(unprobed).some((entry) => entry.includes("composeUnoFoundationSubset(probeSource, familyBindings())")),
      audit(unprobed).join(","),
    );
  });

  // `UNO-WO-068 / R03` §7: independent mutations over the last four families, both ingress-depth corrections and the
  // seventeen-root evidence. Each one deletes or mislabels a real executed gate and must change the audit.
  it("the audit genuinely fails when a last-four source shape or its id is removed", () => {
    for (const [token, replacement] of [
      ['type: "table",', 'type: "tableRemoved",'],
      ['type: "columns",', 'type: "columnsRemoved",'],
      ['type: "cards",', 'type: "cardsRemoved",'],
      ['type: "features",', 'type: "featuresRemoved",'],
      ['  "family-13-table",', '  "family-13-tableRenamed",'],
      ['  "family-14-columns",', '  "family-14-columnsRenamed",'],
      ['  "family-15-cards",', '  "family-15-cardsRenamed",'],
      ['  "family-16-features",', '  "family-16-featuresRenamed",'],
    ]) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token)), `${token}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the header projection evidence disappears", () => {
    for (const contract of [
      "FAMILY_HEADER_ACCEPTED the composed buffer projects one accepted authored header before installation",
      "FAMILY_HEADER_ACCEPTED the loaded text projects the same accepted header with no extra authority",
    ]) {
      const mutated = source.replace(contract, "FAMILY_HEADER_ACCEPTED recorded");
      assert.notEqual(mutated, source, contract);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
    // Removing the projector import entirely must also fail, because the header could then never be projected.
    const noImport = source.replace('await import("../src/core/efs/uno-page-header.ts")', 'await import("../src/core/page-document.ts")');
    assert.notEqual(noImport, source);
    assert.ok(audit(noImport).some((entry) => entry.includes("uno-page-header.ts")), audit(noImport).join(","));
  });

  it("the audit genuinely fails when a last-four HTTP or seventeen-root check is deleted", () => {
    for (const contract of [
      "FAMILY_TABLE_HTTP the table region is one scroll wrapper with a genuine captioned two-column table",
      "FAMILY_COLUMNS_HTTP the columns region is an authored plain two-column grid of two tight stacks",
      "FAMILY_CARDS_HTTP the cards region is a headed top-level stack with a native two-column list grid and one body",
      "FAMILY_FEATURES_HTTP the features region is a separate headed top-level stack with a native three-column list grid",
      "FAMILY_SEVENTEEN_HTTP the last four regions add no second main, h1, script, frame or form control",
    ]) {
      const mutated = source.replace(contract, "FAMILY_UNVERIFIED recorded");
      assert.notEqual(mutated, source, contract);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when a last-four browser region or its direct-child count is removed", () => {
    for (const contract of [
      "${width}px table shows a captioned two-column table and its scroll control takes focus",
      "${width}px columns show two authored tight stacks with one paragraph and one native list",
      "${width}px cards show a headed stack with one authored h2, a two-column list grid and two h3 titles",
      "${width}px features show a separate headed stack with one authored h2, a three-column list grid and two h3 titles",
      "${width}px the composed Page carries seventeen unique top-level sections with no nested inflation",
    ]) {
      const mutated = source.replace(contract, "${width}px region unverified");
      assert.notEqual(mutated, source, contract);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
    // The direct-child proof itself must survive: a region read from `children` cannot be replaced by a query sweep.
    const swept = source.replace("const cells = [...(region?.children ?? [])];", "const cells = [...document.querySelectorAll(\"li\")];");
    assert.notEqual(swept, source);
    assert.ok(audit(swept).some((entry) => entry.includes("region?.children")), audit(swept).join(","));
  });

  it("the audit genuinely fails when the last-four refusal or getter-zero proof is removed", () => {
    const noProbe = source.replace(
      "FAMILY_LAST_FOUR_REFUSALS each last-four probe refuses the whole Page with its documented reason",
      "FAMILY_LAST_FOUR_REFUSALS recorded",
    );
    assert.notEqual(noProbe, source);
    assert.ok(audit(noProbe).some((entry) => entry.includes("FAMILY_LAST_FOUR_REFUSALS each last-four probe")));
    const noGetter = source.replace(
      "FAMILY_LAST_FOUR_REFUSALS an authored getter yields family:unsafe-source with zero invocations",
      "FAMILY_LAST_FOUR_REFUSALS getter recorded",
    );
    assert.notEqual(noGetter, source);
    assert.ok(audit(noGetter).some((entry) => entry.includes("FAMILY_LAST_FOUR_REFUSALS an authored getter")));
    const countedGetter = source.replace(
      "getterOutcome.status === \"refused\" && getterOutcome.reason === \"family:unsafe-source\"\n        && getterCalls === 0",
      "getterOutcome.status === \"refused\"",
    );
    assert.notEqual(countedGetter, source);
    assert.ok(audit(countedGetter).some((entry) => entry.includes("getterCalls === 0")), audit(countedGetter).join(","));
  });

  // `UNO-WO-069 / R01`: independent mutations over the divider evidence. Each replaces a real predicate (or deletes a
  // real check) and must make the audit fail, so a label alone can never stand in for measured evidence.
  it("the audit genuinely fails when the divider source, HTTP or parity gate is neutered", () => {
    const mutations = [
      ["DIVIDER_PARITY_SOURCE the composed family-8-divider is one frozen content.prose", "DIVIDER_PARITY_SOURCE recorded"],
      ["DIVIDER_PARITY_SOURCE the real reader re-reads the same divider node", "DIVIDER_PARITY_SOURCE reread"],
      ["DIVIDER_PARITY_HTTP the composed Page serves exactly one native hr divider directly in the Uno root", "DIVIDER_PARITY_HTTP served"],
      ['<hr class="uno-json-divider" id="family-8-divider"/>', '<hr class="uno-json-divider" id="family-8-divider" data-x="1"/>'],
      ["dividerOk === true && familyOk === true && dividerChecks === 12", "true"],
      ["dividerChecks += 1;", ""],
      ["let dividerOk = true;", "let dividerAccepted = true;"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(
        audit(mutated).some((entry) => entry.includes(token.split("\n")[0].slice(0, 40))),
        `${token.slice(0, 40)}: ${audit(mutated).join(",")}`,
      );
    }
  });

  it("the audit genuinely fails when a divider border, role, spacing or sibling predicate is neutered", () => {
    const mutations = [
      ['seen.divider.borderTopWidth === "1px"', "true"],
      ['seen.divider.borderTopStyle === "solid"', "true"],
      ['seen.divider.borderTopColor === seen.divider.tokenColor', "true"],
      ["seen.divider.tabIndex === -1", "true"],
      ['seen.divider.previousId === "family-7-actions" && seen.divider.nextId === "family-9-hero"', "true"],
      ["const expectedOffset = 2.5 * seen.divider.rootFont;", "const expectedOffset = 40;"],
      ["near(seen.divider.spaceBefore, expectedOffset, 1.5)", "true"],
      ["near(seen.divider.spaceAfter, expectedOffset, 1.5)", "true"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the dark or reduced-motion divider probe is removed", () => {
    const mutations = [
      ['await tab.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });', 'await tab.emulateMedia({ colorScheme: "light" });'],
      ['scheme: matchMedia("(prefers-color-scheme: dark)").matches', "scheme: true"],
      ['reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches', "reducedMotion: true"],
      ["dark.scheme === true", ""],
      ["dark.reducedMotion === true", ""],
      ["parseFloat(dark.transitionDuration) <= 1e-4", "true"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
    // Deleting a whole dark-viewport assertion must be caught by its label, not merely by the media token.
    for (const label of [
      "dark ${width}px divider keeps its native role, 1px theme rule and no focus or motion",
      "dark ${width}px divider keeps 1rem margins and 2.5rem separation on both sides",
      "dark ${width}px divider visit made no foreign or provider request",
    ]) {
      const mutated = source.replace(label, "dark divider probe removed");
      assert.notEqual(mutated, source, label);
      assert.ok(audit(mutated).some((entry) => entry.includes(label)), `${label}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit fails when the authored heading or item-outline evidence is neutered", () => {
    const mutations = [
      // The source contract: an authored h2 before a nested level-3 grid, in one top-level stack with empty props.
      ['heading: "Synthetic cards",', 'heading: "Cards",'],
      ['JSON.stringify(section.props) === "{}"', "true"],
      ['heading.module === "content.heading"', "true"],
      ["title.props.level === 3", "true"],
      // The served-HTML hierarchy for both headed families.
      ['outlineOk(cardsRegion, "cards", "Synthetic cards", 2)', "true"],
      ['outlineOk(featuresRegion, "features", "Synthetic features", 3)', "true"],
      ['region.indexOf("<h2") < region.indexOf("<h3")', "true"],
      ["new Set(allIds).size === allIds.length", "true"],
      [String.raw`(familyHtml.match(/<h3[\s>]/giu) ?? []).length === 9`, "true"],
      // The Chromium item-outline predicates.
      ["family.headingIsFirst", "true"],
      ["seen.cards.h2 === 1 && seen.cards.h3 === 2", "true"],
      ["seen.features.h2 === 1 && seen.features.h3 === 2", "true"],
      ["seen.cards.uniqueIds", "true"],
    ];
    // `UNO-WO-080 / R01`: each of the three new outline labels and their executable predicates must fail the audit when
    // neutralized — a deleted label, a `true` predicate or a count-only substitute cannot pass.
    for (const [token, replacement] of [
      [
        "FAMILY_OUTLINE_THREE_SOURCE steps, faq and columns compose the documented level-3 item outline and refuse an authored level",
        "FAMILY_OUTLINE_THREE_SOURCE",
      ],
      [
        "FAMILY_OUTLINE_THREE_HTTP the served Page puts the step titles, FAQ questions and column titles in level-3 headings of their own regions",
        "FAMILY_OUTLINE_THREE_HTTP",
      ],
      [
        "FAMILY_OUTLINE_THREE_BROWSER=PASS the three level-3 outline regions were measured in real Chromium at both viewports",
        "FAMILY_OUTLINE_THREE_BROWSER=PASS",
      ],
      ["stepsTimeline.props.itemHeadingLevel === 3", "true"],
      ["faqAccordion.props.summaryHeadingLevel === 3", "true"],
      ['columnTitles.every((title) => title?.module === "content.heading" && title.props.level === 3)', "true"],
      ['authoredLevelOutcome.reason === "family:unsupported-feature"', "true"],
      ["outlineSeen.stepParagraphTitles === 0", "true"],
      ["outlineSeen.columnFirstChildIsHeading", "true"],
      ["outlineBrowserChecks === 12", "true"],
      ["darkOutline.columns === 2", "true"],
    ]) {
      const mutatedOutline = source.split(token).join(replacement);
      assert.notEqual(mutatedOutline, source, token);
      assert.ok(
        audit(mutatedOutline).some((entry) => entry.includes(token.slice(0, 40))),
        `${token}: ${audit(mutatedOutline).join(",")}`,
      );
    }

    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
    // Deleting a whole outline assertion must be caught by its own label.
    for (const label of [
      "FAMILY_ITEM_OUTLINE_SOURCE cards compose one frozen top-level stack with an authored h2 before a nested list grid of level-3 item titles",
      "FAMILY_ITEM_OUTLINE_HTTP both headed families serve exactly one authored h2 before two nested h3 titles, one list and no duplicate id",
      "${width}px the headed families keep one h2 before every item h3 with no invented control or overflow",
    ]) {
      const mutated = source.split(label).join("outline evidence removed");
      assert.notEqual(mutated, source, label);
      assert.ok(audit(mutated).some((entry) => entry.includes(label)), `${label}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit fails when the authored lede source or served evidence is neutered", () => {
    const mutations = [
      // The fixture source loses the authored lede.
      ['lede: "Synthetic cards explain the choices.",', ""],
      ['lede: "Synthetic features describe the work.",', ""],
      // The composed shape: lede id and text comparisons turned unconditional.
      ["lede?.id === `family-${index}-${type}-lede`", "true"],
      ["JSON.stringify(lede?.props) === JSON.stringify({ text: expectedText })", "true"],
      // The served order predicate collapsed.
      ["ledeAt > headingEnd", "true"],
      ["ledeAt < listAt", "true"],
      // The refusal probe's zero-getter assertion removed.
      ["ledeGetterCalls === 0", "true"],
      // The Chromium lede predicates neutralized.
      ["family.ledeAfterHeading", "true"],
      ["family.ledeBeforeGrid", "true"],
      ["family.ledeVisible", "true"],
      ["ledeBrowserChecks === 2", "true"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
    for (const label of [
      "FAMILY_LEDE_SOURCE cards compose exactly one lede paragraph in the ordered heading, lede and grid stack",
      "FAMILY_LEDE_REFUSALS each lede probe refuses the whole Page with its documented reason and no partial document",
      "FAMILY_LEDE_HTTP each headed family serves exactly one lede paragraph after its h2 and before its native list",
      "FAMILY_LEDE_BROWSER the authored ledes were measured in real Chromium at both viewports",
    ]) {
      const mutated = source.split(label).join("lede evidence removed");
      assert.notEqual(mutated, source, label);
      assert.ok(audit(mutated).some((entry) => entry.includes(label)), `${label}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit fails when the authored stats or steps evidence is neutered", () => {
    const mutations = [
      // The fixture source loses each authored field.
      ['heading: "Synthetic numbers",', ""],
      ['lede: "Synthetic numbers **summarise** the sample.",', ""],
      ['heading: "Synthetic sequence",', ""],
      ['lede: "Synthetic steps keep the **authored** order.",', ""],
      // The composed shape comparisons turned unconditional.
      ["section.children[0]?.id === `family-${index}-${type}-heading`", "true"],
      ["JSON.stringify(section.children[1]?.props) === JSON.stringify(expectedLedeProps)", "true"],
      ["JSON.stringify(section.children[2]) === JSON.stringify(expectedChild)", "true"],
      // The refusal probe's zero-getter assertion removed.
      ["sequenceGetterCalls === 0", "true"],
      // The served order and the Chromium lede-order predicates neutralized.
      ["ledeAt < listAt", "true"],
      ["family.ledeBeforeList", "true"],
      ["sequenceBrowserChecks === 2", "true"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
    for (const label of [
      "FAMILY_STATS_STEPS_SOURCE stats compose one authored heading and lede before the unchanged stat list",
      "FAMILY_STATS_STEPS_REFUSALS each sequence probe refuses the whole Page with its documented reason",
      "FAMILY_STATS_STEPS_HTTP each sequence family serves its authored Markdown lede before its unchanged native list",
      "FAMILY_STATS_STEPS_BROWSER the sequence headings and ledes were measured in real Chromium at both viewports",
    ]) {
      const mutated = source.split(label).join("sequence evidence removed");
      assert.notEqual(mutated, source, label);
      assert.ok(audit(mutated).some((entry) => entry.includes(label)), `${label}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit still fails when a retained family, parity or matrix gate is dropped alongside the outline", () => {
    for (const gate of [
      "BROWSER_MATRIX=16/16",
      "FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px",
      "FAMILY_SEVENTEEN_HTTP the last four regions add no second main, h1, script, frame or form control",
      "DIVIDER_PARITY=PASS the divider passed source, HTTP and light/dark Chromium evidence",
      "FAMILY_MEDIA=3/3 three distinct locators serve the one Page-owned plate with GET and HEAD",
      "FAMILY_CONTACT_OFF_HTTP the contact subtree carries no form, control, handler or destination",
    ]) {
      const mutated = source.split(gate).join("gate removed");
      assert.notEqual(mutated, source, gate);
      assert.ok(audit(mutated).some((entry) => entry.includes(gate)), `${gate}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit fails when the five-family authored heading or lede evidence is neutered", () => {
    const mutations = [
      // Each authored fixture field removed from the five families.
      ['heading: "Synthetic prose heading",', ""],
      ['lede: "Synthetic prose introduction & \\"quoted\\" wording, with *emphasis*.",', ""],
      ['heading: "Synthetic callout heading",', ""],
      ['lede: "Synthetic callout introduction.",', ""],
      ['heading: "Synthetic list heading",', ""],
      ['lede: "A **bounded list** on one published Page.",', ""],
      ['heading: "Synthetic FAQ heading",', ""],
      ['lede: "Synthetic FAQ introduction.",', ""],
      ['heading: "Synthetic table heading",', ""],
      ['lede: "The **table** explains synthetic totals.",', ""],
      // The shape, refusal, served-order and Chromium comparisons turned unconditional.
      ["textFiveGetterCalls === 0", "true"],
      ["textFiveBrowserChecks === 2", "true"],
      ["found.ledeBeforeNative", "true"],
      ['familyAccepted.sections.filter((section) => section.module === "layout.stack").length === 7', "true"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
    for (const label of [
      "FAMILY_TEXT_FIVE_SOURCE ${evidence.id} composes one frozen stack with the authored heading, the authored lede and the unchanged native node",
      "FAMILY_TEXT_FIVE_SOURCE the three remaining authored-text families add no top-level node and keep the seventeen ids",
      "FAMILY_TEXT_FIVE_REFUSALS each authored-text probe refuses the whole Page with its documented reason",
      "FAMILY_TEXT_FIVE_REFUSALS an authored prose heading getter yields family:unsafe-source with zero invocations",
      "FAMILY_TEXT_FIVE_REFUSALS a whitespace-only table lede refuses the whole Page despite four valid siblings",
      "FAMILY_TEXT_FIVE_HTTP family-${index}-${type} serves one authored h2 and one lede before its native node",
      "FAMILY_TEXT_FIVE_HTTP the three remaining authored-text families add seven stacks and three headings with no duplicate id, extra main or external destination",
      "FAMILY_TEXT_FIVE_BROWSER the five authored-text families were measured in real Chromium at both viewports",
    ]) {
      const mutated = source.split(label).join("five-family evidence removed");
      assert.notEqual(mutated, source, label);
      assert.ok(audit(mutated).some((entry) => entry.includes(label)), `${label}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit fails when the fourth-family table evidence or its credit is neutered", () => {
    const mutations = [
      // The table's own refusal witness replaced by the list's, the HTTP proof weakened, the browser conjunction collapsed.
      ["localA2.table.refusal = tableRefusalOk;", "localA2.table.refusal = refusalOk;"],
      ["localA2.table.http = familyHtmlResponse.status === 200", "localA2.table.http = true"],
      ["localA2.table.browser = conjunction(tableBrowserCases);", "localA2.table.browser = true;"],
      ["table: localA2.table,", ""],
      // The four-family credit weakened to an unconditional pass, and the A1 regression weakened in the same way.
      ["closureFour.parity === 4", "true"],
      ["closureFour.proxy === 46", "true"],
      ['closureFour.pending.includes("list")', "true"],
      ['JSON.stringify(closureFour.credited) === JSON.stringify(["prose", "callout", "table", "divider"])', "true"],
      ["closure.ok === true && closure.parity === 3 && closure.proxy === 45 && familyOk && dividerOk", "true"],
      // `UNO-WO-111 / R01` (§3): the earned A2 credit and its List evidence cannot be neutered either.
      ["closureA2.parity === 5", "true"],
      ["closureA2.proxy === 47", "true"],
      ['JSON.stringify(closureA2.credited) === JSON.stringify(["prose", "callout", "table", "list", "divider"])', "true"],
      ["list: localA2.list,", ""],
      ["if (darkListOk) listBrowserCases.add(`dark:${width}`);", ""],
      // `UNO-WO-112 / R01`: the credited Hero, its shared conjunction and the six-family row cannot be neutered either.
      ["hero: localA2.hero,", ""],
      ["localA2.hero.http = familyHtmlResponse.status === 200 && heroFacts.ok;", "localA2.hero.http = true;"],
      ["localA2.hero.browser = conjunction(heroBrowserCases);", "localA2.hero.browser = true;"],
      ["closureB1.parity === 8", "true"],
      ["closureB1.proxy === 50", "true"],
      // `UNO-WO-113 / R01`: the credited Stats family, its shared predicates and its conjunction cannot be neutered either.
      ["stats: localA2.stats,", ""],
      ["localA2.stats.http = familyHtmlResponse.status === 200 && statsFacts.ok;", "localA2.stats.http = true;"],
      ["localA2.stats.browser = conjunction(statsBrowserCases);", "localA2.stats.browser = true;"],
      ["const statsFacts = statsServed(statsRegion);", "const statsFacts = { ok: true, detail: \"\" };"],
      // `UNO-WO-114 / R01`: the credited Steps family, its shared predicates and its conjunction cannot be neutered either.
      ["steps: localA2.steps,", ""],
      ["localA2.steps.http = familyHtmlResponse.status === 200 && stepsFacts.ok;", "localA2.steps.http = true;"],
      ["localA2.steps.browser = conjunction(stepsBrowserCases);", "localA2.steps.browser = true;"],
      ["const stepsFacts = stepsServed(stepsRegion);", "const stepsFacts = { ok: true, detail: \"\" };"],
      ["composeFamilyFixture(composeUnoFoundationSubset)", "composeUnoFoundationSubset(familySource(), familyBindings())"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
    // The declared checkpoints are exactly the earned rows — the A1 regression, the A2 delivery and now the B1 row this order
    // delivered. A higher checkpoint would claim a row the Owner has not delivered, so it must never appear.
    const declared = [...source.matchAll(/checkpoint:\s*"([A-Z0-9]+)",$/gmu)].map((match) => match[1]);
    assert.deepEqual(declared, ["A1", "A2", "B1"]);
  });

  it("the guard is intact and the family fixture keeps the seventeen-mapping contract", () => {
    assert.deepEqual(audit(source), []);
    // The runner verifies the adapter's contractual top-level ids but never invents a child id or authors a Page node.
    // `UNO-WO-075 / R01` moves five native nodes under their stack wrappers, so the runner now *names* those
    // adapter-generated child ids in read-only assertions; it still must never author one as a node object.
    assert.ok(source.includes("const FAMILY_IDS = Object.freeze(["));
    assert.ok(!/id:\s*"family-\d+-[a-z]+-[a-z]+"/u.test(source));
    assert.ok(!/id: "family-0-prose", module: "/u.test(source));
    assert.ok(source.includes('"contactForm"'));
    assert.ok(source.includes('mode: "delivery-off"'));
  });
});


/**
 * `UNO-WO-078 / R01` — the hosted durable-family proof must stay connected to real predicates.
 *
 * `verify-u03-published-http.mjs` is the CI-enforced acceptance path for `DURABLE_FAMILY_*`, and
 * `verify-u03-browser.mjs` supplies its Chromium label. This guard reads both sources and requires each label to
 * appear next to the executable predicate behind it, so a future edit cannot keep a label while deleting its check.
 */
describe("the hosted durable-family labels are connected to real predicates", () => {
  const publishedSource = readFileSync(resolve(ROOT, "scripts/verify-u03-published-http.mjs"), "utf8");
  const browserSource = readFileSync(resolve(ROOT, "scripts/verify-u03-browser.mjs"), "utf8");

  const DURABLE_REQUIRED = Object.freeze([
    "DURABLE_FAMILY_SOURCE the real composer accepts the source and its bindings",
    "DURABLE_FAMILY_SOURCE the committed Page has twenty-three top-level sections",
    "parsed.document.sections.length === 23",
    "DURABLE_FAMILY_SOURCE the appended sections are the composer's own output",
    "JSON.stringify(parsed.document.sections.slice(6)) === JSON.stringify(composed.document.sections)",
    "DURABLE_FAMILY_SOURCE the six original sections still equal the starting committed blob",
    "DURABLE_FAMILY_REFUSALS the composer refuses ${label}",
    'outcome.status === "refused" && outcome.reason === reason',
    "DURABLE_FAMILY_REFUSALS an accessor source refuses as unsafe without running it",
    'hostileOutcome.reason === "family:unsafe-source" && invoked === false',
    "DURABLE_FAMILY_HTTP all twenty-three section ids are served in order",
    "DURABLE_FAMILY_HTTP the contact family renders only the inert delivery-OFF notice",
    "DURABLE_FAMILY_HTTP exactly three owned images are served",
    "DURABLE_FAMILY_MEDIA occurrence ${index} is the exact owned bytes",
    'createHash("sha256").update(bytes).digest("hex") === DURABLE_PLATE_SHA256',
    "DURABLE_FAMILY_MEDIA ${path} is a real 404",
    'response.status === 404 && response.headers.get("location") === null && body.length === 0',
    "DURABLE_FAMILY_BROWSER the real browser proof executed its durable family cases",
    'browserProof.passes.some((name) => name.startsWith("DURABLE_FAMILY_BROWSER"))',
    "DURABLE_FAMILY_RESTORE ${relativePath} is byte-identical after the fixture run",
    "DURABLE_FAMILY_RESTORE the three-Page graph is unchanged after the fixture run",
    "durableFamilyPage: COMMITTED_PAGES[2]",
    "durableFamilyIds: DURABLE_FAMILY_IDS",
  ]);

  const DURABLE_BROWSER_REQUIRED = Object.freeze([
    "DURABLE_FAMILY_BROWSER ${label} renders all seventeen family ids in order",
    "DURABLE_FAMILY_BROWSER ${label} keeps every family id unique",
    "DURABLE_FAMILY_BROWSER ${label} renders a native divider",
    "DURABLE_FAMILY_BROWSER ${label} renders a native quotation",
    "DURABLE_FAMILY_BROWSER ${label} renders table column scopes",
    "DURABLE_FAMILY_BROWSER ${label} renders native disclosures",
    "DURABLE_FAMILY_BROWSER ${label} decodes every owned image",
    "DURABLE_FAMILY_BROWSER ${label} gives every image authored alternative text",
    "DURABLE_FAMILY_BROWSER ${label} shows only the inert delivery-OFF notice",
    "DURABLE_FAMILY_BROWSER ${label} does not overflow horizontally",
    "DURABLE_FAMILY_BROWSER ${label} requests nothing outside loopback",
    "DURABLE_FAMILY_BROWSER ${label} toggles the first disclosure from the keyboard",
    "observed.imageCount === 3",
    "observed.imagesDecoded === 3",
    "observed.forms === 0",
    "observed.offOriginImages === 0",
    "record.foreignRequests.length === 0",
  ]);

  const durableAudit = (text, required) => required.filter((token) => !text.includes(token));

  it("keeps every durable label and predicate in the hosted runner and its browser helper", () => {
    assert.deepEqual(durableAudit(publishedSource, DURABLE_REQUIRED), []);
    assert.deepEqual(durableAudit(browserSource, DURABLE_BROWSER_REQUIRED), []);
  });

  it("fails the audit when any hosted durable label or predicate is removed", () => {
    for (const token of DURABLE_REQUIRED) {
      const mutated = publishedSource.split(token).join("DURABLE_REMOVED");
      assert.notEqual(mutated, publishedSource, token);
      assert.ok(durableAudit(mutated, DURABLE_REQUIRED).includes(token), token);
    }
    for (const token of DURABLE_BROWSER_REQUIRED) {
      const mutated = browserSource.split(token).join("DURABLE_REMOVED");
      assert.notEqual(mutated, browserSource, token);
      assert.ok(durableAudit(mutated, DURABLE_BROWSER_REQUIRED).includes(token), token);
    }
  });

  it("fails the audit when a durable predicate is neutered rather than deleted", () => {
    for (const [token, replacement] of [
      ["parsed.document.sections.length === 23", "parsed.document.sections.length > 0"],
      ['outcome.status === "refused" && outcome.reason === reason', "outcome.status !== undefined"],
      ['createHash("sha256").update(bytes).digest("hex") === DURABLE_PLATE_SHA256', "true"],
      ['response.status === 404 && response.headers.get("location") === null && body.length === 0', "true"],
      ['browserProof.passes.some((name) => name.startsWith("DURABLE_FAMILY_BROWSER"))', "true"],
      ["observed.imageCount === 3", "observed.imageCount > 0"],
      ["observed.forms === 0", "observed.forms >= 0"],
      ["record.foreignRequests.length === 0", "record.foreignRequests.length >= 0"],
    ]) {
      const inPublished = publishedSource.includes(token);
      const target = inPublished ? publishedSource : browserSource;
      const mutated = target.split(token).join(replacement);
      assert.notEqual(mutated, target, token);
      const required = inPublished ? DURABLE_REQUIRED : DURABLE_BROWSER_REQUIRED;
      assert.ok(durableAudit(mutated, required).includes(token), token);
    }
  });
});
