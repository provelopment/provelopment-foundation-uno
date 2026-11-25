/**
 * Foundation Uno — the Columns family evidence (`UNO-WO-119 / R01`).
 *
 * WHY THIS IS A MODULE. The Columns credit rests on seven different observations of the same facts: the section's anchor and
 * grid ids, its authored titles and content, its closed ratio and surface, and the donor's twenty-four-label ceiling. Keeping
 * the parsers and the one geometry comparison here means the gate orchestrates rather than re-implements, the expectations are
 * derived from the single fixture definition, and every comparison can be exercised on its own.
 *
 * WHAT IT IS NOT. Nothing here is authority. No file is read or written, no Page is composed, and nothing here can raise the
 * campaign score: the unchanged closure oracle still decides that from executed evidence.
 */

import { COLUMNS_LABELS, COLUMNS_RICH_SOURCE, COLUMNS_SOURCE, COLUMNS_VARIANT_SOURCES } from "./family-fixture.mjs";

/** The served anchor id, and the ids the composed wrapper and grid must own. */
export const COLUMNS_ID = "family-14-columns";
export const COLUMNS_GRID_ID = `${COLUMNS_ID}-grid`;
export const COLUMNS_HEADING_ID = `${COLUMNS_ID}-heading`;
export const COLUMNS_LEDE_ID = `${COLUMNS_ID}-lede`;
export const COLUMNS_COLUMN_ID = (index) => `${COLUMNS_ID}-column-${index}`;
export const COLUMNS_BODY_ID = (index, chunk = 1) =>
  chunk === 1 ? `${COLUMNS_COLUMN_ID(index)}-body` : `${COLUMNS_COLUMN_ID(index)}-body-${chunk}`;
export const COLUMNS_TITLE_ID = (index) => `${COLUMNS_COLUMN_ID(index)}-title`;

/** The served (legacy) section, exactly as authored — two ratioed columns with one body and one two-label list. */
export const COLUMNS_EXPECTED = Object.freeze({
  ratio: COLUMNS_SOURCE.ratio,
  columns: COLUMNS_SOURCE.items.length,
  titles: Object.freeze(COLUMNS_SOURCE.items.map((item) => item.title)),
  body: COLUMNS_SOURCE.items[0].body,
  labels: Object.freeze([...COLUMNS_SOURCE.items[1].items]),
  surface: null,
});

/** The rich section that is served only through the gate's temporary swap. */
export const COLUMNS_RICH = Object.freeze({
  heading: COLUMNS_RICH_SOURCE.heading,
  lede: COLUMNS_RICH_SOURCE.lede,
  surface: COLUMNS_RICH_SOURCE.surface,
  ratio: COLUMNS_RICH_SOURCE.ratio,
  columns: COLUMNS_RICH_SOURCE.items.length,
  titles: Object.freeze(COLUMNS_RICH_SOURCE.items.map((item) => item.title)),
  bodyLink: "https://example.org/columns",
  labels: Object.freeze([...COLUMNS_LABELS]),
  /** Twenty-four labels compose as two consecutive native lists of twelve. */
  listChunks: Object.freeze([12, 12]),
});

/** The four served layout variants, with the ids the swap page gives them. */
export const COLUMNS_VARIANTS = Object.freeze(
  COLUMNS_VARIANT_SOURCES.map((source, index) =>
    Object.freeze({
      index,
      id: index === 0 ? COLUMNS_ID : `family-${17 + (index - 1)}-columns`,
      ratio: source.ratio ?? null,
      surface: source.surface ?? null,
      columns: source.items.length,
      titles: Object.freeze(source.items.map((item) => item.title)),
    }),
  ),
);

/** One composed section, or the grid inside its wrapper. */
export function columnsGridOf(section) {
  if (section === undefined || section === null) return null;
  if (section.module === "layout.grid") return section;
  if (section.module !== "layout.stack") return null;
  const grid = section.children.find((child) => child.module === "layout.grid");
  return grid ?? null;
}

/** The rendered region of a served Page, between this family's anchor and the next top-level section. */
export function columnsRegionOf(html) {
  const start = html.indexOf(`id="${COLUMNS_ID}"`);
  if (start < 0) return "";
  const openTag = html.lastIndexOf("<div", start);
  const next = html.indexOf('id="family-15-cards"', start);
  const end = next < 0 ? html.length : html.lastIndexOf("<div", next);
  return openTag < 0 || end <= openTag ? "" : html.slice(openTag, end);
}

/** The plain labels of every native list inside one served region, in document order. */
export function columnsLabelsOf(region) {
  return [...region.matchAll(/<li><span>([^<]*)<\/span><\/li>/gu)].map((match) => match[1]);
}

/** Every plain label span anywhere in the region (used where a list item may carry more than a label). */
export function columnsLabelSpansOf(region) {
  return [...region.matchAll(/<span>([^<]*)<\/span>/gu)].map((match) => match[1]);
}
/**
 * The four independently executed browser cases. `UNO-WO-119 / R02` requires all four — 390 and 1280 in light/normal motion and
 * in dark/reduced motion — so a missing, failed or duplicated case can never complete the `browser` dimension.
 */
export const COLUMNS_CASES = Object.freeze([
  Object.freeze({ key: "light:390", width: 390, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "light:1280", width: 1280, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "dark:390", width: 390, scheme: "dark", motion: "reduce" }),
  Object.freeze({ key: "dark:1280", width: 1280, scheme: "dark", motion: "reduce" }),
]);

/**
 * The documented pixel-rounding tolerance.
 *
 * A `2fr 1fr` grid splits the free space into thirds, so the browser rounds each of the two tracks to a whole CSS pixel: the wider
 * track can differ from exactly twice the narrower one by a couple of pixels at any container width. The asymmetry checks therefore
 * allow `2 * COLUMNS_RATIO_TOLERANCE_PX` on the doubled track and the equality checks one tolerance — nothing looser, so a grid
 * that is merely wider than its neighbour still fails.
 */
export const COLUMNS_RATIO_TOLERANCE_PX = 2;

/** The authored asymmetry: `2fr 1fr` is 2:1 and `1fr 2fr` is 1:2. */
export const COLUMNS_RATIO_FACTOR = 2;

const near = (left, right, tolerance = COLUMNS_RATIO_TOLERANCE_PX) => Math.abs(left - right) <= tolerance;

/** A positive, finite, nonzero track width. */
const positive = (value) => Number.isFinite(value) && value > 0;

/** `wider` is `COLUMNS_RATIO_FACTOR` times `narrower`, within the documented tolerance, and never merely wider. */
const asymmetric = (wider, narrower) =>
  positive(wider)
  && positive(narrower)
  && wider > narrower
  && near(wider, narrower * COLUMNS_RATIO_FACTOR, COLUMNS_RATIO_TOLERANCE_PX * COLUMNS_RATIO_FACTOR);

/** Every track in one grid has the same nonzero width. */
const uniform = (widths) => widths.length > 0 && widths.every((width) => positive(width) && near(width, widths[0]));

/** The cells stack visually in authored reading order: strictly increasing top offsets. */
const stackedInOrder = (tops) => tops.length > 0 && tops.every((top, index) => index === 0 || top > tops[index - 1]);

/** One computed surface sample, reduced to the effects the shipped tokens can produce. */
function surfaceOf(variant) {
  return {
    backgroundColor: variant.backgroundColor,
    borderWidth: variant.borderWidth,
    padding: variant.padding,
    borderRadius: variant.borderRadius,
  };
}

const samePresentation = (left, right) =>
  left.backgroundColor === right.backgroundColor
  && left.borderWidth === right.borderWidth
  && left.padding === right.padding
  && left.borderRadius === right.borderRadius;

/** Chromium reports a computed zero padding as `0px`, so a padding side counts as zero only when its number is zero. */
const zeroPadding = (padding) =>
  typeof padding === "string"
  && padding.split(" ").length === 4
  && padding.split(" ").every((side) => Number.parseFloat(side) === 0);

const noEffect = (surface) =>
  surface.borderWidth === "0px"
  && zeroPadding(surface.padding)
  && /rgba\(0, 0, 0, 0\)|transparent/u.test(surface.backgroundColor);
/**
 * The verdict for one executed case: the actual media settings, the four served variants, their geometry at that width, their
 * computed surfaces, and the keyboard access the gate exercised on the real rich link.
 *
 * At 1280 the equal grids are equal and the two asymmetric grids are exactly 2:1 and 1:2 within the documented tolerance. At 390
 * every variant is one column, with the authored cell count, the authored DOM order and the same visual order, all tracks equal
 * and nonzero. In both schemes `plain` presents exactly like no surface at all, while `muted` and `bordered` are distinct from it
 * and from one another with real background, border and padding effects. Nothing overflows, nothing is zero-width, and the
 * keyboard reached the rich safe link, left it again and never navigated away.
 */
export function columnsCaseVerdict(reading, testCase) {
  if (reading === undefined || reading === null) return { ok: false, detail: "{\"reading\":\"missing\"}" };
  if (!COLUMNS_CASES.some((entry) => entry.key === testCase?.key)) {
    return { ok: false, detail: JSON.stringify({ unknownCase: testCase?.key }) };
  }
  const reasons = [];
  const expect = (condition, reason) => {
    if (!condition) reasons.push(reason);
  };
  const byId = new Map((reading.variants ?? []).map((variant) => [variant.id, variant]));
  const [equalCase, startCase, endCase, threeCase] = COLUMNS_VARIANTS;
  const equal = byId.get(equalCase.id);
  const startWide = byId.get(startCase.id);
  const endWide = byId.get(endCase.id);
  const three = byId.get(threeCase.id);

  // The media really was what this case claims: a mislabelled case is not evidence.
  expect(reading.case === testCase.key, `case:${reading.case}`);
  expect(reading.width === testCase.width, `width:${reading.width}`);
  expect(reading.dark === (testCase.scheme === "dark"), `dark:${reading.dark}`);
  expect(reading.reduce === (testCase.motion === "reduce"), `reduce:${reading.reduce}`);
  expect(reading.forced === false, `forced:${reading.forced}`);

  // The four served variants, in authored order, each with its authored count and native ratio attribute.
  expect(
    JSON.stringify((reading.variants ?? []).map((variant) => variant.id))
      === JSON.stringify(COLUMNS_VARIANTS.map((variant) => variant.id)),
    "variants",
  );
  expect(equal?.columns === 2 && startWide?.columns === 2 && endWide?.columns === 2 && three?.columns === 3, "counts");
  expect(equal?.ratioAttribute === "equal", `ratio-equal:${equal?.ratioAttribute}`);
  expect(startWide?.ratioAttribute === "start-wide", `ratio-start:${startWide?.ratioAttribute}`);
  expect(endWide?.ratioAttribute === "end-wide", `ratio-end:${endWide?.ratioAttribute}`);
  // Three columns carry no ratio attribute at all: the authored ratio is validated and inert.
  expect(three?.ratioAttribute === null, `ratio-none:${three?.ratioAttribute}`);

  // Every served cell is a real, nonzero box; the authored titles are the DOM order; nothing overflows.
  for (const variant of reading.variants ?? []) {
    expect((variant.widths ?? []).length === variant.columns, `widths:${variant.id}`);
    expect((variant.widths ?? []).every(positive), `zero-width:${variant.id}`);
    expect(variant.overflow === 0, `overflow:${variant.id}:${variant.overflow}`);
    expect(
      JSON.stringify(variant.titles) === JSON.stringify(COLUMNS_VARIANTS.find((entry) => entry.id === variant.id)?.titles),
      `dom-order:${variant.id}`,
    );
  }
  if (testCase.width >= 1000) {
    // 1280: the equal grids are equal and the asymmetric ones are exactly 2:1 and 1:2.
    expect(uniform(equal?.widths ?? []), `equal:${JSON.stringify(equal?.widths)}`);
    expect(uniform(three?.widths ?? []), `three:${JSON.stringify(three?.widths)}`);
    expect(asymmetric(startWide?.widths?.[0], startWide?.widths?.[1]), `start-wide:${JSON.stringify(startWide?.widths)}`);
    expect(asymmetric(endWide?.widths?.[1], endWide?.widths?.[0]), `end-wide:${JSON.stringify(endWide?.widths)}`);
    // One row: the two cells of each two-column grid share a top offset.
    for (const variant of [equal, startWide, endWide]) {
      expect((variant?.tops ?? []).length === 2 && near(variant.tops[0], variant.tops[1]), `row:${variant?.id}`);
    }
  } else {
    // 390: one column everywhere, in authored reading order, with the authored counts preserved.
    for (const variant of reading.variants ?? []) {
      expect(uniform(variant.widths), `narrow-uniform:${variant.id}`);
      expect(stackedInOrder(variant.tops), `narrow-order:${variant.id}`);
    }
  }

  // Computed surfaces at this width in this scheme: plain ≡ absent, muted and bordered distinct from both and from each other.
  const plain = surfaceOf(endWide ?? {});
  const absent = surfaceOf(three ?? {});
  const muted = surfaceOf(equal ?? {});
  const bordered = surfaceOf(startWide ?? {});
  expect(samePresentation(plain, absent), `plain:${JSON.stringify([plain, absent])}`);
  expect(noEffect(plain), `plain-effect:${JSON.stringify(plain)}`);
  expect(noEffect(absent), `absent-effect:${JSON.stringify(absent)}`);
  expect(muted.backgroundColor !== plain.backgroundColor, `muted-bg:${muted.backgroundColor}`);
  expect(bordered.backgroundColor !== plain.backgroundColor, `bordered-bg:${bordered.backgroundColor}`);
  expect(muted.backgroundColor !== bordered.backgroundColor, `muted-vs-bordered:${muted.backgroundColor}/${bordered.backgroundColor}`);
  expect(muted.padding !== plain.padding && !zeroPadding(muted.padding), `muted-padding:${muted.padding}`);
  expect(bordered.padding === muted.padding, `padding-parity:${bordered.padding}/${muted.padding}`);
  expect(bordered.borderWidth === "1px", `bordered-border:${bordered.borderWidth}`);
  expect(muted.borderWidth === "0px", `muted-border:${muted.borderWidth}`);
  expect(muted.borderRadius === bordered.borderRadius && muted.borderRadius !== "0px", `radius:${muted.borderRadius}`);

  // The rich content is intact on the served page: two native label lists, all 24 labels in order, the authored body link.
  expect(JSON.stringify(equal?.labels) === JSON.stringify(COLUMNS_RICH.labels), `labels:${equal?.labels?.length}`);
  expect(equal?.labelLists === COLUMNS_RICH.listChunks.length, `lists:${equal?.labelLists}`);
  expect(equal?.bodyLinkHref === COLUMNS_RICH.bodyLink, `href:${equal?.bodyLinkHref}`);
  expect(equal?.bodyLinkRel === "noopener noreferrer", `rel:${equal?.bodyLinkRel}`);

  // Real keyboard access to the rich safe link: reached by Tab, left again by Tab, never navigated, no foreign request.
  const keyboard = reading.keyboard ?? {};
  expect(keyboard.reached === true, `keyboard-reached:${keyboard.reached}`);
  expect(keyboard.href === COLUMNS_RICH.bodyLink, `keyboard-href:${keyboard.href}`);
  expect(keyboard.rel === "noopener noreferrer", `keyboard-rel:${keyboard.rel}`);
  expect(keyboard.visible === true, `keyboard-visible:${keyboard.visible}`);
  expect(keyboard.leftAfterTab === true, `keyboard-left:${keyboard.leftAfterTab}`);
  // The visit never navigated: the page URL is unchanged after the whole walk, and no foreign request was made.
  expect(keyboard.pageUrlAfter === keyboard.pageUrlBefore, `keyboard-url:${keyboard.pageUrlBefore}->${keyboard.pageUrlAfter}`);
  expect(keyboard.foreignRequests === undefined || keyboard.foreignRequests === 0, `keyboard-foreign:${keyboard.foreignRequests}`);

  return {
    ok: reasons.length === 0,
    detail: JSON.stringify({
      case: testCase.key,
      reasons,
      href: reading.href,
      keyboard: reading.keyboard,
      widths: (reading.variants ?? []).map((variant) => [variant.id, variant.widths]),
      surfaces: { plain: plain.backgroundColor, muted: muted.backgroundColor, bordered: bordered.backgroundColor },
    }),
  };
}

/**
 * The aggregate verdict: exactly the four declared cases, each executed once and each passing its own contract. A duplicated,
 * missing or failed case leaves the aggregate false, so `browser` can never be satisfied by three good cases.
 */
export function columnsGeometryReport(readings) {
  const list = Array.isArray(readings) ? readings : [];
  const seen = new Map();
  for (const reading of list) {
    const key = reading?.case;
    if (typeof key !== "string") return { ok: false, detail: "{\"case\":\"missing\"}" };
    if (seen.has(key)) return { ok: false, detail: JSON.stringify({ duplicate: key }) };
    seen.set(key, reading);
  }
  const verdicts = COLUMNS_CASES.map((testCase) => {
    const reading = seen.get(testCase.key);
    return reading === undefined
      ? { key: testCase.key, ok: false, detail: JSON.stringify({ missing: testCase.key }) }
      : { key: testCase.key, ...columnsCaseVerdict(reading, testCase) };
  });
  return {
    ok: verdicts.length === COLUMNS_CASES.length && verdicts.every((verdict) => verdict.ok),
    detail: JSON.stringify(verdicts.map((verdict) => [verdict.key, verdict.ok, verdict.detail])),
  };
}


/**
 * The refusal probes the gate executes, each one mutation of the rich section with its closed literal reason. They cover the
 * donor's two hard bounds (twenty-four labels, one body *or* one list), the closed ratio and surface, nested sections, and the
 * shared Markdown/Unicode readers.
 */
export const COLUMNS_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "twenty-five labels",
    expected: "family:target-refused",
    mutate: (section) => {
      section.items[1].items = [...COLUMNS_LABELS, "Label 25"];
    },
  }),
  Object.freeze({
    label: "empty label list",
    expected: "family:target-refused",
    mutate: (section) => {
      section.items[1].items = [];
    },
  }),
  Object.freeze({
    label: "invalid ratio value",
    expected: "family:target-refused",
    mutate: (section) => {
      section.ratio = "wide";
    },
  }),
  Object.freeze({
    label: "invalid surface value",
    expected: "family:target-refused",
    mutate: (section) => {
      section.surface = "raised";
    },
  }),
  Object.freeze({
    label: "body and labels together",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items[1].body = "A body beside a list.";
    },
  }),
  Object.freeze({
    label: "neither body nor labels",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      delete section.items[1].items;
    },
  }),
  Object.freeze({
    label: "nested donor section",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items[0].sections = [];
    },
  }),
  Object.freeze({
    label: "unsafe Markdown destination",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items[0].body = "Read [the notes](javascript:alert(1)).";
    },
  }),
  Object.freeze({
    label: "malformed Markdown",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.lede = "An **unbalanced lede.";
    },
  }),
  Object.freeze({
    label: "ill-formed Unicode",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items[0].body = "A lone surrogate: \uD800.";
    },
  }),
]);

