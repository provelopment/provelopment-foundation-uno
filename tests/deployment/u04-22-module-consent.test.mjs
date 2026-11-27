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
  "FAMILY_CARDS_HTTP the cards region is one native cards section with its authored heading, lede and two-column card list",
  "FAMILY_FEATURES_HTTP the features region is one native headed features section with a three-column list",
  "FAMILY_SEVENTEEN_HTTP the last four regions add no second main, h1, script, frame or form control",
  "${width}px table shows a captioned two-column table and its scroll control takes focus",
  "${width}px columns show two authored tight stacks with one paragraph and one native list",
  "${width}px cards show one native cards section with the authored h2, its lede and a two-column card list",
  "${width}px features show one native headed section with one authored h2, a three-column feature list and two h3 titles",
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
  "FAMILY_ITEM_OUTLINE_SOURCE cards compose one frozen native cards node carrying the authored h2, lede and ordered card list",
  "FAMILY_ITEM_OUTLINE_SOURCE features compose one frozen native features node carrying the authored h2, lede, column intent and ordered feature list",
  "FAMILY_ITEM_OUTLINE_SOURCE the seventeen top-level ids and all other fifteen families are unchanged",
  "FAMILY_ITEM_OUTLINE_SOURCE the real reader re-accepts both headed families from the serialized JSON",
  "FAMILY_ITEM_OUTLINE_HTTP both headed families serve exactly one authored h2 before two nested h3 titles, one list and no duplicate id",
  "${width}px the headed families keep one h2 before every item h3 with no invented control or overflow",
  'JSON.stringify(section.props) === "{}"',
  'props.features.every((feature) => typeof feature?.title === "string" && feature.title.length > 0)',
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
  String.raw`(familyHtml.match(/<h3[\s>]/giu) ?? []).length === 8 + FAQ_EXPECTED.items.length`,
  // `UNO-WO-071 / R01`: the authored plain-text lede — labels plus the executable predicates behind them.
  'lede: "Synthetic cards explain the choices.",',
  'lede: "Synthetic features describe the work.",',
  "FAMILY_LEDE_SOURCE cards compose exactly one lede paragraph in the ordered heading, lede and grid stack",
  "FAMILY_LEDE_SOURCE features compose exactly one authored lede on their one native node",
  "FAMILY_LEDE_SOURCE the ledes add no node outside the two families and keep the seventeen top-level ids",
  "FAMILY_LEDE_SOURCE the composed JSON matches the installed buffer and the caller source is unmutated",
  "FAMILY_LEDE_REFUSALS each lede probe reaches its documented outcome with no partial document when it refuses",
  "FAMILY_LEDE_REFUSALS an authored card lede getter yields family:unsafe-source with zero invocations",
  "FAMILY_LEDE_HTTP each headed family serves exactly one lede paragraph after its h2 and before its native list",
  "FAMILY_LEDE_BROWSER the authored ledes were measured in real Chromium at both viewports",
  "${width}px each headed family shows its authored lede as one visible paragraph between the h2 and the list",
  'props.lede === expectedText',
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
  'lede: "Synthetic FAQ **introduction** with bounds.",',
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
  "familyAccepted.sections.filter((section) => section.module === \"layout.stack\").length === 6",
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
  "A2_LOCAL_TABLE_LIST_HERO_STATS_STEPS_QUOTE_FAQ_COLUMNS_MEDIA_EVIDENCE=63/63 (table, list, hero, stats, steps, quote, faq, columns and media credited; P6 destination proof in the three-Site gate)",
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
  // `UNO-WO-116 / R01`: the shared Unicode well-formedness decision, proved at the composer's family matrices and at the
  // strict reader's native hero/stats/timeline nodes.
  "A2_LOCAL_REFUSAL the malformed-Unicode probes are present in the hero, stats and steps matrices and no earlier case was dropped",
  "A2_LOCAL_READER a native hero, stats and timeline node with a malformed Markdown field is refused from plain data and JSON text",
  "unicodeProbes.steps >= 2",
  // `UNO-WO-116 / R02`: the restored pre-R01 plain lede single-line policy and the strict reader's declared-Markdown
  // validation for the three native families.
  "A2_LOCAL_READER the plain prose and callout lede refuses CR, LF and CRLF while a declared-Markdown lede and the body keep their lines",
  "A2_LOCAL_READER every invalid declared-Markdown hero, stats and timeline field is refused while valid and undeclared text is accepted",
  "FAMILY_STEPS_HTTP the served steps family carries its heading, Markdown lede, closed surface, ordered titles and Markdown body",
  "FAMILY_STEPS_HTTP the step titles and body are exactly the authored ones in order, with no invented status, current step or date",
  "${width}px steps show both Markdown bodies, the closed surface and two ordered titles",
  "dark ${width}px the steps family keeps its ordered titles and both Markdown bodies with no invented state",
  '  checkpoint: "B1",',
  "composeFamilyFixture(composeUnoFoundationSubset)",
  // `UNO-WO-117 / R01` (§1–§3): the extracted Quote module, the credited family's own seven executed dimensions, and the
  // checkpoint-free nine-family interim row the unchanged oracle derives.
  'from "./u04/quote-evidence.mjs";',
  "quote: createFamilyEvidence(),",
  "localA2.quote.source = familyAccepted.sections[12]?.module === \"content.testimonials\"",
  "localA2.quote.reader = quoteReaderOk;",
  "localA2.quote.refusal = quoteRefusalOk;",
  "localA2.quote.renderer = quoteRegion.length > 0 && quoteFacts.ok;",
  "localA2.quote.http = familyHtmlResponse.status === 200 && quoteFacts.ok;",
  "localA2.quote.browser = conjunction(quoteBrowserCases);",
  "localA2.quote.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE)",
  "const quoteRegion = quoteRegionOf(familyHtml);",
  "const quoteFacts = quoteServed(quoteRegion);",
  "const quoteItems = quoteItemsOf(quoteRegion);",
  "JSON.stringify(familyAccepted.sections[12]?.props) === JSON.stringify(quoteNodeProps())",
  "A2_LOCAL_TABLE_LIST_HERO_STATS_STEPS_QUOTE_FAQ_COLUMNS_MEDIA_EVIDENCE=63/63 (table, list, hero, stats, steps, quote, faq, columns and media credited; P6 destination proof in the three-Site gate)",
  "A2_LOCAL_BROWSER the rich quote family was observed at 390px and 1280px in light and dark/reduced motion with its parsed Markdown quotation",
  "A2_LOCAL_REFUSAL every malformed quote family refuses the whole source Page with the family's own reason",
  "A2_LOCAL_READER the quote quotation is Markdown-validated and Unicode-checked in both forms while a native role-only caption stays accepted",
  "FAMILY_QUOTE_HTTP the served quote carries its parsed Markdown quotation, closed presentation and separate caption spans",
  "FAMILY_QUOTE_HTTP the quote holds no donor identity, declaration key, invented heading, form control or frame",
  "dark ${width}px the quote family keeps its parsed Markdown quotation, closed presentation and caption spans",
  "U04_CLOSURE_ORACLE the unchanged oracle credits exactly nine families at 9/17 and 51/59 without a checkpoint selector",
  'closureInterim.labels.includes("U04_PARITY=9/17")',
  'closureInterim.labels.includes("U04_PROXY=51/59")',
  'closureB1.labels.includes("PARITY_QUOTE=PENDING")',
  // `UNO-WO-118 / R01` (§1–§3): the extracted FAQ module, the credited family's own executed dimensions, its 1–8–9–24–25
  // boundary and the checkpoint-free ten-family interim row the unchanged oracle derives.
  'from "./u04/faq-evidence.mjs";',
  "faq: createFamilyEvidence(),",
  "localA2.faq.source = familyAccepted.sections[3]?.module === \"layout.stack\"",
  "localA2.faq.reader = faqReaderOk;",
  "localA2.faq.refusal = faqRefusalOk;",
  "localA2.faq.renderer = faqRegion.length > 0 && faqFacts.ok;",
  "localA2.faq.http = familyHtmlResponse.status === 200 && faqFacts.ok;",
  "localA2.faq.browser = conjunction(faqBrowserCases);",
  "localA2.faq.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE)",
  "const faqRegion = faqRegionOf(familyHtml);",
  "const faqFacts = faqServed(faqRegion);",
  "const faqDisclosures = faqDisclosuresOf(faqRegion);",
  "JSON.stringify(familyAccepted.sections[3]?.children?.[2]?.props) === JSON.stringify(faqNodeProps())",
  "A2_LOCAL_BROWSER the rich faq family was observed at 390px and 1280px in light and dark/reduced motion with its Markdown lede and answer",
  "A2_LOCAL_REFUSAL every malformed faq family refuses the whole source Page with the family's own reason",
  "A2_LOCAL_REFUSAL the FAQ boundary is exactly 1-8 one group, 9-24 consecutive groups and 25 refused, with the ordinary nine-panel accordion still refused",
  "FAMILY_FAQ_HTTP the served faq carries its Markdown lede, closed surface, ordered level-3 questions and owned Markdown answer",
  "FAMILY_FAQ_HTTP the faq holds no donor identity, declaration key, invented open state, form control or frame",
  "${width}px faq shows its Markdown lede, closed surface, ordered level-3 questions and closed disclosures",
  "${width}px the FAQ disclosures open independently",
  "${width}px the second FAQ disclosure opens by keyboard without opening the first",
  "dark ${width}px the faq family keeps its Markdown lede, closed surface and owned Markdown answer",
  "U04_CLOSURE_ORACLE the declared B2 checkpoint is earned by the executed evidence at exactly 11/17 and 53/59",
  "U04_CLOSURE_ORACLE the unchanged oracle credits exactly eleven families at 11/17 and 53/59 without a checkpoint selector",
  // `UNO-WO-119 / R01` (§2): the seven Columns dimensions — composition, the legacy byte-identity, the label/ratio boundaries,
  // the ten refusals, the served markup, the four geometries and the rights probe.
  "FAMILY_COLUMNS_SOURCE the real adapter composes the rich section as one surfaced stack of authored heading, Markdown lede and a two-column grid",
  "FAMILY_COLUMNS_LEGACY the served fixture keeps its byte-identical two-column grid with the authored ratio and the authored titles",
  "FAMILY_COLUMNS_READER the composed Page round-trips, the 1/12/13/24 label boundary holds as consecutive native lists, twenty-five refuses, three columns drop an authored ratio and the native grid still refuses one",
  "FAMILY_COLUMNS_REFUSAL every columns refusal probe refuses the whole Page with its closed reason and no partial document",
  "FAMILY_COLUMNS_HTTP the served rich section is one surfaced stack of authored heading, Markdown lede and body, a two-column grid and two native label lists — and the three-column grid carries no ratio attribute",
  "FAMILY_COLUMNS_BROWSER the browser dimension is the conjunction of all four executed cases at 390px and 1280px in light and dark/reduced motion",
  "FAMILY_COLUMNS_BROWSER ${testCase.key} the four served variants lay out as authored, present their surfaces distinctly, keep their labels and reach the safe link by keyboard",
  "FAMILY_COLUMNS_RESTORE the temporary Columns fixture was restored byte-exactly and a fresh response serves the committed Page without any variant anchor",
  "FAMILY_COLUMNS_RIGHTS the served columns region carries no donor identity, owned asset, foreign resource or provider",
  // `UNO-WO-120 / R01`: the Media family's own seven dimensions, its closed refusal probes and its restore proof.
  "FAMILY_MEDIA_SOURCE the real adapter composes the donor's Media surface — authored heading and Markdown lede, closed position and surface, a Markdown caption, the optional decorative form, both textless positions and the byte-identical bare section",
  "FAMILY_MEDIA_READER the composed Page round-trips, the donor caption bound is 4,000 for both declared forms while the unflagged caption stays at 320, one shared Unicode decision covers both, the native reader still requires an explicit alt while the adapter normalizes the donor's omission, and the closed position/surface members refuse any other shape",
  "FAMILY_MEDIA_REFUSAL every one of the ${MEDIA_REFUSAL_CASES.length} media probes refuses the whole Page with its own closed reason and no partial document",
  "FAMILY_MEDIA_HTTP the served Media section is one positioned and surfaced stack whose figure owns its loaded 64x64 PNG and its Markdown caption, with the authored heading and Markdown lede",
  "FAMILY_MEDIA_HTTP the temporary page serves the end position with a plain caption, the decorative figure with a normalized empty alt and an authored plain surface, both textless positions and the byte-identical bare figure",
  "FAMILY_MEDIA_BROWSER ${testCase.key} the six served variants load their owned image, own their caption, keep their alt or decorative semantics, lay out their position and surface and reach the caption link by keyboard",
  "FAMILY_MEDIA_BROWSER the browser dimension is the conjunction of all four executed cases at 390px and 1280px in light and dark/reduced motion",
  "FAMILY_MEDIA_RIGHTS the served media region renders no donor identity, no remote source, no provider and no locator outside this Page's own owned route",
  "FAMILY_MEDIA_RESTORE the temporary Media fixture was restored byte-exactly and a fresh response serves the committed Page without any variant anchor",
  // `UNO-WO-120 / R02`: the four adopted corrections each stay executed — the unformatted caption declared through the accepted
  // Markdown form, the one shared Unicode decision, the normalized optional decorative boolean and the textless placement.
  "mediaFigureOf(longComposed.document.sections[0])?.props.markdown === true",
  "readFigureAccepts(figureProps({ caption: loneHigh, markdown: true })) === false",
  // `UNO-WO-120 / R03`: the native required-alt boundary is proven by a **direct** refusal, while the adapter's own
  // normalization stays proven on the real composer.
  "directOmission.accepted === false",
  "Media raw omission probe",
  '!textlessRegion.includes("uno-json-prose")',
  "localA2.media.browser = conjunction(mediaCases) && mediaBrowser.ok;",
  "localA2.media.renderer = rendererOk;",
  "const mediaBrowser = mediaBrowserReport(readings);",
  "mediaCaseVerdict(reading, testCase)",
  "walkToSafeLink(tab, MEDIA_EXPECTED.captionLinkHref)",
  // `UNO-WO-121 / R01`: the Gallery family's own seven dimensions, its twelve closed probes, its three measured widths and
  // its restore proof — plus the C1 row the unchanged oracle now earns.
  "FAMILY_GALLERY_SOURCE the real adapter composes the donor's Gallery as one ordered list — authored heading and Markdown lede, whole-section surface, a Markdown caption, the decorative form and the donor's own default column intent left absent",
  "FAMILY_GALLERY_READER one through twenty-four figures are accepted and zero or twenty-five refuse, twenty-four distinct bound identities coexist with a separate Media identity on one Page, the consumed set equals the bound set, repeated identities keep authored order, the ordinary grid and carousel and the required-alt boundary are unchanged, and no shared guard moved",
  "FAMILY_GALLERY_REFUSAL every one of the ${GALLERY_REFUSAL_CASES.length} gallery probes refuses the whole Page with its own closed reason and no partial document",
  "FAMILY_GALLERY_HTTP the served Gallery is one ordered list per section with the authored heading, Markdown lede, caption and all three surfaces, and every one of its occurrences serves the locator, bytes, MIME and intrinsic size of the plate its own binding names",
  "const galleryOccurrences = planned.status === \"planned\"",
  "occurrence.ref.path === galleryOwnedPathFor(entry.image.src)",
  "const aggregateBoundary = eightMedia.status === \"composed\"",
  "const occurrenceLimit = overCeiling.status === \"refused\"",
  "abandonedOk && abandonedRestored && restoredInFinally && restoredHtml.length > 0",
  "restoredInFinally = sha256Of(SOURCES[4]) === originalDigest;",
  'data-uno-surface="plain"',
  "absentSurface:",
  "geometryOk,",
  // `UNO-WO-121 / R03`: real positive equal tracks, per-item caption ownership, the resolved emphasis radius token, the
  // served link relation, and a fresh browser restoration.
  "trackWidths,",
  "directFigures,",
  "directImages,",
  "captionOwners,",
  "captionLinkRel",
  "borderStyle",
  'emphasisRadius: resolveLength("--uno-radius-lg")' ,
  "FAMILY_GALLERY_BROWSER_RESTORE after the browser swap restored in finally, a fresh response serves the committed Page's own Gallery list and no temporary anchor",
  "&& freshRestored",
  "conjunction(galleryCases, GALLERY_REQUIRED_CASES)",
  "geometry.ok",  "FAMILY_GALLERY_BROWSER ${testCase.key} the six served lists lay out the authored column count, keep their owned locators in order, load their images, own their captions, present their surfaces and reach the caption link by keyboard",
  "FAMILY_GALLERY_BROWSER the browser dimension is the conjunction of all six executed cases at 390, 768 and 1280px in light and dark/reduced motion, with the fixture restored byte-exactly",
  "FAMILY_GALLERY_RIGHTS the served Gallery renders no donor identity, no remote source, no provider and no locator outside this Page's own owned route",
  "FAMILY_GALLERY_RESTORE both the abandoned write and the served swap were restored byte-exactly, and a fresh response serves the committed Page's own Gallery list with no temporary anchor",
  "galleryCaseVerdict(reading, testCase)",
  "const geometry = galleryGeometryReport(readings);",
  "FAMILY_GALLERY_REFUSAL ${probe.label} refuses the whole Page with ${probe.expected} and no document",
  "U04_CLOSURE_ORACLE the unchanged oracle credits exactly thirteen families at 13/17 and 55/59 under the C1 checkpoint it declared",
  "U04_CLOSURE_ORACLE the same evidence reports 13/17 and 55/59 without any checkpoint selector, so the selector adds no credit of its own",
  'closureC1.labels.includes("PARITY_GALLERY=PASS")',
  'closureC1.labels.includes("U04_PARITY=13/17")',
  'closureC1.labels.includes("U04_PROXY=55/59")',
  "gallery: localA2.gallery,",
  "const bindingsFor = (section) => {",
  "bindingsFor(GALLERY_SOURCE)",
  // The Gallery-scoped ceiling, the exact-consumption proof and the C1 credit each have their own required token.
  "const noGalleryCeiling = composePage(",
  "gallery: localA2.gallery,",
  "A2_LOCAL_TABLE_LIST_HERO_STATS_STEPS_QUOTE_FAQ_COLUMNS_MEDIA_EVIDENCE=63/63 (table, list, hero, stats, steps, quote, faq, columns and media credited; P6 destination proof in the three-Site gate)",
  "localA2.columns.browser = conjunction(columnsCases) && geometry.ok;",
  "localA2.columns.renderer = rendererOk;",
  "columnsCaseVerdict(reading, testCase)",
  "const geometry = columnsGeometryReport(readings);",
  "exerciseColumnsKeyboard(COLUMNS_RICH.bodyLink)",
  "reading.keyboard.pageUrlBefore = pageUrlBefore;",
  "for (const testCase of COLUMNS_CASES) {",
  "COLUMNS_REFUSAL_CASES.map((probe) =>",
  // `UNO-WO-118 / R02` (§2): the executed stylesheet check, the computed-appearance proof of the closed surface, its long-FAQ
  // coverage and the temporary fixture restoration.
  "FAMILY_SURFACE_CSS the shipped stylesheet gives the closed surface one token-only treatment per emphasised value and none for plain",
  "background-color: var(--uno-surface-strong);",
  "border: 1px solid var(--uno-border);",
  "const faqSurfaceVerdict = faqSurfacesDistinct(faqSurfaceLight.rows);",
  "const darkSurfaceVerdict = faqSurfacesDistinct(darkFaqSurface.rows);",
  "${width}px the faq surface presents distinctly: muted and bordered differ from plain, plain equals the absent accordion, and the authored reading is muted",
  "dark ${width}px the faq surface still presents distinctly in dark and reduced motion",
  "A2_LOCAL_BROWSER the faq surface presents distinctly (plain == absent, muted and bordered each different) at 390px and 1280px in light and dark/reduced motion",
  "FAMILY_BROWSER the long twenty-four-item faq serves three consecutive groups that all present the authored surface",
  "FAMILY_BROWSER the fixture Page is restored byte-exactly after the long faq visit",
  "const faqSurfaceOk = conjunction(faqSurfaceCases);",
  "surface.paddingInlineStart === \"12px\"",
  'closureTen.labels.includes("U04_PARITY=10/17")',
  'closureTen.labels.includes("U04_PROXY=52/59")',
  'closureInterim.labels.includes("PARITY_FAQ=PENDING")',
  'closureB1.labels.includes("PARITY_FAQ=PENDING")',
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

  it("the audit genuinely fails when the shared Unicode well-formedness checks are removed", () => {
    for (const token of [
      "A2_LOCAL_REFUSAL the malformed-Unicode probes are present in the hero, stats and steps matrices and no earlier case was dropped",
      "A2_LOCAL_READER a native hero, stats and timeline node with a malformed Markdown field is refused from plain data and JSON text",
      "unicodeProbes.steps >= 2",
      "A2_LOCAL_READER the plain prose and callout lede refuses CR, LF and CRLF while a declared-Markdown lede and the body keep their lines",
      "A2_LOCAL_READER every invalid declared-Markdown hero, stats and timeline field is refused while valid and undeclared text is accepted",
    ]) {
      const mutated = source.replace(token, "");
      const missing = audit(mutated);
      assert.ok(
        missing.some((entry) => entry.includes(token) || entry.includes("unicodeProbes")),
        `removing ${token} must fail the audit`,
      );
    }
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
  // `UNO-WO-118 / R02`: the surface proof must be load-bearing in both directions — deleting a computed-appearance comparison
  // and neutering the long-FAQ coverage each have to fail the audit for their own token.
  // `UNO-WO-119 / R02`: the four-case Columns browser proof is load-bearing — collapsing the case conjunction, neutering the
  // keyboard walk, the surface comparison, the case loop or the restoration each have to fail the audit for its own token.
  it("the audit genuinely fails when the columns evidence is deleted or neutered", () => {
    const shapes = [
      [
        "localA2.columns.browser = conjunction(columnsCases) && geometry.ok;",
        "localA2.columns.browser = true;",
        "localA2.columns.browser = conjunction(columnsCases) && geometry.ok;",
      ],
      [
        "const geometry = columnsGeometryReport(readings);",
        "const geometry = { ok: true, detail: \"\" };",
        "columnsGeometryReport(readings)",
      ],
      [
        "exerciseColumnsKeyboard(COLUMNS_RICH.bodyLink)",
        "Promise.resolve({ reached: true })",
        "exerciseColumnsKeyboard(COLUMNS_RICH.bodyLink)",
      ],
      [
        "columnsCaseVerdict(reading, testCase)",
        "{ ok: true, detail: \"\" }",
        "columnsCaseVerdict(reading, testCase)",
      ],
      [
        "for (const testCase of COLUMNS_CASES) {",
        "for (const testCase of COLUMNS_CASES.slice(0, 2)) {",
        "for (const testCase of COLUMNS_CASES) {",
      ],
      [
        "FAMILY_COLUMNS_RESTORE the temporary Columns fixture was restored byte-exactly and a fresh response serves the committed Page without any variant anchor",
        "restore unchecked",
        "FAMILY_COLUMNS_RESTORE",
      ],
      [
        "localA2.columns.renderer = rendererOk;",
        "localA2.columns.renderer = true;",
        "localA2.columns.renderer = rendererOk",
      ],
    ];
    for (const [from, to, contract] of shapes) {
      const mutated = source.replace(from, to);
      assert.notEqual(mutated, source, from);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  // `UNO-WO-120 / R01`: the Media proof is load-bearing in both directions — collapsing the four-case conjunction, replacing the
  // shared keyboard walk, deleting the surface/style comparison, the loaded-image comparison or the fresh-response restore each
  // has to fail the audit for its own token.
  it("the audit genuinely fails when the media evidence is deleted or neutered", () => {
    const shapes = [
      [
        "localA2.media.browser = conjunction(mediaCases) && mediaBrowser.ok;",
        "localA2.media.browser = true;",
        "localA2.media.browser = conjunction(mediaCases) && mediaBrowser.ok;",
      ],
      [
        "const mediaBrowser = mediaBrowserReport(readings);",
        "const mediaBrowser = { ok: true, detail: \"\" };",
        "mediaBrowserReport(readings)",
      ],
      [
        "const verdict = mediaCaseVerdict(reading, testCase);",
        "const verdict = { ok: true, detail: \"\" };",
        "mediaCaseVerdict(reading, testCase)",
      ],
      [
        "reading.keyboard = await walkToSafeLink(tab, MEDIA_EXPECTED.captionLinkHref);",
        "reading.keyboard = { reached: true };",
        "walkToSafeLink(tab, MEDIA_EXPECTED.captionLinkHref)",
      ],
      [
        "localA2.media.renderer = rendererOk;",
        "localA2.media.renderer = true;",
        "localA2.media.renderer = rendererOk;",
      ],
      [
        "FAMILY_MEDIA_HTTP the served Media section is one positioned and surfaced stack whose figure owns its loaded 64x64 PNG and its Markdown caption, with the authored heading and Markdown lede",
        "media http unverified",
        "FAMILY_MEDIA_HTTP",
      ],
      [
        "FAMILY_MEDIA_RESTORE the temporary Media fixture was restored byte-exactly and a fresh response serves the committed Page without any variant anchor",
        "restore unchecked",
        "FAMILY_MEDIA_RESTORE",
      ],
      [
        "FAMILY_MEDIA_REFUSAL every one of the ${MEDIA_REFUSAL_CASES.length} media probes refuses the whole Page with its own closed reason and no partial document",
        "refusals unchecked",
        "FAMILY_MEDIA_REFUSAL",
      ],
      // `UNO-WO-120 / R02`: each adopted correction is load-bearing too — dropping the declared unformatted caption, the shared
      // Unicode decision, the normalized optional alternative or the textless served shape must each fail the audit.
      [
        "mediaFigureOf(longComposed.document.sections[0])?.props.markdown === true",
        "true",
        "mediaFigureOf(longComposed.document.sections[0])?.props.markdown === true",
      ],
      [
        "readFigureAccepts(figureProps({ caption: loneHigh, markdown: true })) === false",
        "true",
        "readFigureAccepts(figureProps({ caption: loneHigh, markdown: true }))",
      ],
      [
        "directOmission.accepted === false",
        "true",
        "directOmission.accepted === false",
      ],
      [
        "Media raw omission probe",
        "Media raw probe",
        "Media raw omission probe",
      ],
      [
        "!textlessRegion.includes(\"uno-json-prose\")",
        "true",
        "!textlessRegion.includes(\"uno-json-prose\")",
      ],
      // `UNO-WO-121 / R01`: the Gallery-scoped binding ceiling and the one-list representation are each load-bearing — dropping
      // either must fail the audit rather than silently pass.
      [
        "const noGalleryCeiling = composePage(",
        "const noGalleryCeilingRemoved = composePage(",
        "const noGalleryCeiling = composePage(",
      ],
      [
        "bindingsFor(GALLERY_SOURCE)",
        "GALLERY_BINDINGS.images",
        "bindingsFor(GALLERY_SOURCE)",
      ],
      [
        'closureC1.labels.includes("PARITY_GALLERY=PASS")',
        'closureC1.labels.includes("PARITY_GALLERY=PENDING")',
        'closureC1.labels.includes("PARITY_GALLERY=PASS")',
      ],
      [
        "occurrence.ref.path === galleryOwnedPathFor(entry.image.src)",
        "true",
        "occurrence.ref.path === galleryOwnedPathFor(entry.image.src)",
      ],
      [
        "restoredInFinally = sha256Of(SOURCES[4]) === originalDigest;",
        "restoredInFinally = true;",
        "restoredInFinally = sha256Of(SOURCES[4]) === originalDigest;",
      ],
      [
        "&& freshRestored",
        "&& true",
        "&& freshRestored",
      ],
      [
        "geometry.ok",
        "true",
        "geometry.ok",
      ],
      [
        "conjunction(galleryCases, GALLERY_REQUIRED_CASES)",
        "true",
        "conjunction(galleryCases, GALLERY_REQUIRED_CASES)",
      ],
      [
        "captionOwners,",
        "captionOwners: [],",
        "captionOwners,",
      ],
      [
        "absentSurface:",
        "absentSurfaceIgnored:",
        "absentSurface:",
      ],
    ];
    for (const [from, to, contract] of shapes) {
      const mutated = source.replace(from, to);
      assert.notEqual(mutated, source, from);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

  it("the audit genuinely fails when the faq surface presentation proof is deleted or neutered", () => {
    const shapes = [
      [
        "const faqSurfaceVerdict = faqSurfacesDistinct(faqSurfaceLight.rows);",
        "const faqSurfaceVerdict = { ok: true, detail: \"\" };",
        "faqSurfacesDistinct(faqSurfaceLight.rows)",
      ],
      [
        "const darkSurfaceVerdict = faqSurfacesDistinct(darkFaqSurface.rows);",
        "const darkSurfaceVerdict = { ok: true, detail: \"\" };",
        "faqSurfacesDistinct(darkFaqSurface.rows)",
      ],
      ["surface.paddingInlineStart === \"12px\"", "true", "surface.paddingInlineStart"],
      [
        "FAMILY_BROWSER the long twenty-four-item faq serves three consecutive groups that all present the authored surface",
        "long faq unverified",
        "long twenty-four-item faq",
      ],
    ];
    for (const [from, to, contract] of shapes) {
      const mutated = source.replace(from, to);
      assert.notEqual(mutated, source, from);
      assert.ok(audit(mutated).some((entry) => entry.includes(contract)), `${contract}: ${audit(mutated).join(",")}`);
    }
  });

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
    // A probe that no longer composes the adapter cannot refuse anything. `UNO-WO-119 / R01` added further probes that compose
    // the same adapter, so the mutation replaces every call site rather than the first one.
    const unprobed = source.split("composeUnoFoundationSubset(probeSource, familyBindings())").join("({ status: \"refused\" })");
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
      "FAMILY_CARDS_HTTP the cards region is one native cards section with its authored heading, lede and two-column card list",
      "FAMILY_FEATURES_HTTP the features region is one native headed features section with a three-column list",
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
      "${width}px cards show one native cards section with the authored h2, its lede and a two-column card list",
      "${width}px features show one native headed section with one authored h2, a three-column feature list and two h3 titles",
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
      ['props.features.every((feature) => typeof feature?.title === "string" && feature.title.length > 0)', "true"],
      ["title.props.level === 3", "true"],
      // The served-HTML hierarchy for both headed families.
      ['outlineOk(cardsRegion, "cards", "Synthetic cards", 2)', "true"],
      ['outlineOk(featuresRegion, "features", "Synthetic features", 3)', "true"],
      ['region.indexOf("<h2") < region.indexOf("<h3")', "true"],
      ["new Set(allIds).size === allIds.length", "true"],
      [String.raw`(familyHtml.match(/<h3[\s>]/giu) ?? []).length === 8 + FAQ_EXPECTED.items.length`, "true"],
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
      "FAMILY_ITEM_OUTLINE_SOURCE cards compose one frozen native cards node carrying the authored h2, lede and ordered card list",
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
      ["props.lede === expectedText", "true"],
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
      "FAMILY_LEDE_REFUSALS each lede probe reaches its documented outcome with no partial document when it refuses",
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
      ['lede: "Synthetic FAQ **introduction** with bounds.",', ""],
      ['heading: "Synthetic table heading",', ""],
      ['lede: "The **table** explains synthetic totals.",', ""],
      // The shape, refusal, served-order and Chromium comparisons turned unconditional.
      ["textFiveGetterCalls === 0", "true"],
      ["textFiveBrowserChecks === 2", "true"],
      ["found.ledeBeforeNative", "true"],
      // `UNO-WO-120 / R01`: Media is the eighth top-level stack.
      ['familyAccepted.sections.filter((section) => section.module === "layout.stack").length === 6', "true"],
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
      // `UNO-WO-117 / R01`: the credited Quote family, its shared predicates, its conjunction and the checkpoint-free
      // interim row cannot be neutered either.
      ["quote: createFamilyEvidence(),", ""],
      ["localA2.quote.http = familyHtmlResponse.status === 200 && quoteFacts.ok;", "localA2.quote.http = true;"],
      ["localA2.quote.browser = conjunction(quoteBrowserCases);", "localA2.quote.browser = true;"],
      ["const quoteFacts = quoteServed(quoteRegion);", "const quoteFacts = { ok: true, detail: \"\" };"],
      ['closureInterim.labels.includes("U04_PARITY=9/17")', "true"],
      ['closureB1.labels.includes("PARITY_QUOTE=PENDING")', "true"],
      ["composeFamilyFixture(composeUnoFoundationSubset)", "composeUnoFoundationSubset(familySource(), familyBindings())"],
    ];
    for (const [token, replacement] of mutations) {
      const mutated = source.split(token).join(replacement);
      assert.notEqual(mutated, source, token);
      assert.ok(audit(mutated).some((entry) => entry.includes(token.slice(0, 40))), `${token}: ${audit(mutated).join(",")}`);
    }
    // The declared checkpoints are exactly the earned rows — the A1 regression, the A2 delivery, the B1 row, the B2 row, the
    // C1 row, the C2 row and now the D row this increment earned from executed evidence. A higher checkpoint would claim a
    // row that has not been earned, so it must never appear: the sequence ends at the final row.
    //
    // `UNO-WO-128 / R01` — D is earned, so no checkpoint above D exists to forbid.
    const declared = [...source.matchAll(/checkpoint:\s*"([A-Z0-9]+)",$/gmu)].map((match) => match[1]);
    assert.deepEqual(declared, ["A1", "A2", "B1", "B2", "C1", "C2", "D"]);
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
    // `UNO-WO-121 / R01`: the committed durable Page keeps its ordinary grid while the adapter composes the list, so the
  // published-Pages gate must distinguish them rather than conflate them.
  "DURABLE_FAMILY_SOURCE the committed grid and the composed list agree on anchor, authored columns, order, assets, alternatives and captions and invent no field",
  "const GALLERY_SECTION_ID = \"family-5-gallery\";",
  "JSON.stringify(gridItem.asset) === JSON.stringify(listItem.asset)",
  "gridItem.alt === listItem.alt",
  "gridProps.items.length === listProps.items.length",
  "(gridItem.caption ?? null) === (listItem.caption ?? null)",
  "galleryDelta.anchor && galleryDelta.representation && galleryDelta.columns",
    // `UNO-WO-127 / R01`: the committed Features wrapper is proved equivalent to the composed native node, never exempted.
    // The label, the comparator call, the reader acceptance and each clause the verifier itself decides must stay present.
    "DURABLE_FAMILY_SOURCE the committed Features wrapper and the composed native features node agree on identity, heading, lede, columns, units, absent fields and invent nothing",
    "DURABLE_FAMILY_SOURCE the composed native features node is accepted by the strict reader and stays childless",
    "from \"./u03/durable-features-equivalence.mjs\";",
    "featuresEquivalenceDelta(committedFeatures, composedFeatures)",
    "featuresEquivalenceHolds(featuresDelta)",
    "isUnoLayoutGridFeatures(composedFeatures?.props ?? {})",
    "composedFeatures.children.length !== 0",
    "propertyIsEnumerable.call(composedFeatures, \"children\")",
    // `UNO-WO-127 / R02`: the served historical rendering is pinned to the same authored strings the proof compares.
    "DURABLE_FAMILY_HTTP the Features family serves its authored heading, lede and three unit titles in order",
    "DURABLE_FAMILY_HTTP the Features family invents no icon treatment",
    "!raw.includes(\"uno-json-feature-icon\")",
    // `UNO-WO-128 / R01`: the D row's two families are audited against the gate that earns them, in the dedicated block
    // below this list — every label there is paired with the assertion, probe, accumulator and oracle target behind it.
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
      // `UNO-WO-121 / R02`: each semantic clause of the durable Gallery comparison is load-bearing on its own.
      ["JSON.stringify(gridItem.asset) === JSON.stringify(listItem.asset)", "true"],
      ["gridItem.alt === listItem.alt", "true"],
      ["gridProps.items.length === listProps.items.length", "true"],
      ["(gridItem.caption ?? null) === (listItem.caption ?? null)", "true"],
      ["galleryDelta.anchor && galleryDelta.representation && galleryDelta.columns", "true"],
      // `UNO-WO-127 / R01`: the Features equivalence cannot be neutered either — the call, its result, the native-node
      // recognition, the childless requirement and the served icon refusal are each load-bearing.
      ["featuresEquivalenceHolds(featuresDelta)", "true"],
      ["isUnoLayoutGridFeatures(composedFeatures?.props ?? {})", "true"],
      ["composedFeatures.children.length !== 0", "false"],
      ['propertyIsEnumerable.call(composedFeatures, "children")', "false"],
      ['!raw.includes("uno-json-feature-icon")', "true"],
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

/**
 * `UNO-WO-122 / R05`: the native Cards proof is mandatory in the default run and shares one implementation with the focused
 * entrypoint. The audit reads both runners and fails if the invocation is conditional, duplicated, missing, or replaced by a
 * second implementation — and it proves its own sensitivity by mutating the runner text.
 */
function nativeCardsWiring(source) {
  const problems = [];
  const imports = source.match(/import \{ runNativeCardsTransaction \} from "\.\/u04\/cards-native-evidence\.mjs";/gu) ?? [];
  if (imports.length !== 1) problems.push(`import:${imports.length}`);
  const calls = source.match(/await runNativeCardsTransaction\(/gu) ?? [];
  if (calls.length !== 1) problems.push(`calls:${calls.length}`);
  const guarded = /if \([^)]*\) \{\s*await runNativeCardsTransaction\(/u.test(source);
  if (guarded) problems.push("conditional");
  if (!/cardsOutcome\.failed === 0 && cardsOutcome\.passed > 0/u.test(source)) problems.push("no-fail-clause");
  if (!/prefix: "U04_NATIVE_CARDS"/u.test(source)) problems.push("no-prefix");
  return problems;
}

describe("native Cards mandatory wiring (UNO-WO-122 / R05)", () => {
  const runner = readFileSync(resolve(process.cwd(), "scripts/verify-u04-22-module-consent.mjs"), "utf8");

  it("invokes the one shared native Cards transaction exactly once, unconditionally, and fails the run on any failed check", () => {
    assert.deepEqual(nativeCardsWiring(runner), []);
  });

  it("shares that transaction with the focused entrypoint instead of reimplementing it", () => {
    const focused = readFileSync(resolve(process.cwd(), "scripts/verify-u04-cards-native.mjs"), "utf8");
    assert.match(focused, /import \{[\s\S]*?runNativeCardsTransaction,[\s\S]*?\} from "\.\/u04\/cards-native-evidence\.mjs";/u);
    assert.equal((focused.match(/await runNativeCardsTransaction\(/gu) ?? []).length, 1);
    // The focused entrypoint must never present itself as the gate or claim credit.
    assert.match(focused, /not the U04 gate/u);
    assert.match(focused, /PARITY_CARDS=PENDING/u);
  });

  it("fails the audit when the mandatory invocation is deleted or made conditional", () => {
    const deleted = runner.replace(/\s*const cardsOutcome = await runNativeCardsTransaction\(/u, "\n    const cardsOutcome = undefined; void (");
    assert.notDeepEqual(nativeCardsWiring(deleted), []);
    // A conditional invocation — the shape that would let the default run skip the proof — must be rejected outright.
    const guarded = [
      'import { runNativeCardsTransaction } from "./u04/cards-native-evidence.mjs";',
      'if (process.env.SKIP_NATIVE_CARDS !== "1") {',
      "  await runNativeCardsTransaction({});",
      "}",
      "cardsOutcome.failed === 0 && cardsOutcome.passed > 0",
      'prefix: "U04_NATIVE_CARDS"',
    ].join("\n");
    assert.ok(nativeCardsWiring(guarded).includes("conditional"));
    // A duplicated second implementation must be rejected as well.
    const duplicated = `${runner}\nawait runNativeCardsTransaction({});\n`;
    assert.ok(nativeCardsWiring(duplicated).some((problem) => problem.startsWith("calls:")));
  });
});

/**
 * `UNO-WO-128 / R08` — the D row's labels are connected to the assertions that earn them.
 *
 * `scripts/verify-u04-22-module-consent.mjs` is the runner that produces the checkpoint-D credit. This guard reads its source
 * and requires each label to appear beside the executable predicate behind it, so no later edit can keep the label while
 * deleting the probe, the composed-node reading, the serializer round-trip, the served markup, the Chromium accumulator or
 * the exact oracle target. It proves its own sensitivity by mutating the text.
 */
describe("the checkpoint-D labels are connected to real predicates", () => {
  const gateSource = readFileSync(resolve(ROOT, "scripts/verify-u04-22-module-consent.mjs"), "utf8");

  const D_REQUIRED = Object.freeze([
    "const actionsClosureEvidence = { source: false, reader: false, renderer: false, http: false, browser: false, refusal: false };",
    "const contactFormClosureEvidence = { source: false, reader: false, renderer: false, http: false, browser: false, refusal: false };",
    "FAMILY_ACTIONS_REFUSALS every closed destination, target and shape refusal holds with no partial document",
    "FAMILY_CONTACT_REFUSALS every acknowledgement, mode, field and grammar refusal holds with no partial document",
    "probes.every((probe) => probe.actual === probe.expected && probe.partial === false)",
    "FAMILY_D_SOURCE the composed family-7-actions is one frozen content.actions node of two authored same-document targets",
    "FAMILY_D_SOURCE the composed family-6-contactform is one frozen interaction.contact node with empty props and no reference",
    "FAMILY_D_READER the real reader re-accepts the actions node and its two ordered targets from serialized JSON",
    "FAMILY_D_READER the real reader re-accepts the contact node with empty props from serialized JSON",
    "FAMILY_D_ACTIONS_HTTP the composed actions are two native same-document anchors in the authored order",
    "FAMILY_D_CONTACT_HTTP the contact section serves only the fixed delivery-OFF notice with no control or reference",
    "actionsClosureEvidence.browser = actionsBrowserProven",
    "contactFormClosureEvidence.browser = contactBrowserProven",
    "actionsBrowserProven = actionsBrowserProven && familyCheck(",
    "contactBrowserProven = contactBrowserProven && familyCheck(",
    'rights: actionsRow.includes("page-document.ts") && donorLicenceDeclared',
    'rights: contactRow.includes("page-document.ts") && donorLicenceDeclared',
    'checkpoint: "D",',
    "U04_CLOSURE_ORACLE the unchanged oracle credits the D row at 17/17 and 59/59, closing the seventeen-family campaign on evidence",
    "closureD.parity === 17",
    "closureD.proxy === 59",
    'closureD.labels.includes("PARITY_ACTIONS=PASS")',
    'closureD.labels.includes("PARITY_CONTACTFORM=PASS")',
    'closureD.labels.includes("U04_PARITY=17/17")',
    'closureD.labels.includes("U04_PROXY=59/59")',
  ]);

  const dAudit = (text) => D_REQUIRED.filter((token) => !text.includes(token));

  it("keeps every checkpoint-D label, probe, accumulator and oracle target in the gate", () => {
    assert.deepEqual(dAudit(gateSource), []);
  });

  it("fails the audit when any checkpoint-D predicate is removed", () => {
    for (const token of D_REQUIRED) {
      const mutated = gateSource.split(token).join("D_REMOVED");
      assert.notEqual(mutated, gateSource, token);
      assert.ok(dAudit(mutated).includes(token), token);
    }
  });

  it("fails the audit when a checkpoint-D predicate is neutered", () => {
    for (const [token, replacement] of [
      ["probes.every((probe) => probe.actual === probe.expected && probe.partial === false)", "true"],
      ["actionsBrowserProven = actionsBrowserProven && familyCheck(", "actionsBrowserProven = true || familyCheck("],
      ["contactBrowserProven = contactBrowserProven && familyCheck(", "contactBrowserProven = true || familyCheck("],
      ['rights: actionsRow.includes("page-document.ts") && donorLicenceDeclared', "rights: true"],
      ['rights: contactRow.includes("page-document.ts") && donorLicenceDeclared', "rights: true"],
      ["closureD.parity === 17", "closureD.parity > 0"],
      ["closureD.proxy === 59", "closureD.proxy > 0"],
      ['closureD.labels.includes("U04_PARITY=17/17")', "true"],
    ]) {
      const mutated = gateSource.split(token).join(replacement);
      assert.notEqual(mutated, gateSource, token);
      assert.ok(dAudit(mutated).includes(token), token);
    }
  });
});
