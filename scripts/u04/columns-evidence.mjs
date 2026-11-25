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
 * The one geometry comparison for the four served variants, fed by real `getBoundingClientRect`/`getComputedStyle` readings.
 *
 * At a wide viewport two equal columns must be equal, `start-wide` must make the first wider, `end-wide` the second, and three
 * columns must be equal — with the authored ratio validated and *without* a layout effect. At a narrow viewport every grid must
 * collapse to one column in authored reading order. Surfaces must present distinctly (`plain` equals an absent stack, `muted`
 * and `bordered` each differ from it and from each other), and no variant may overflow.
 */
export function columnsGeometryReport(wide, narrow) {
  const byId = new Map(wide.map((reading) => [reading.id, reading]));
  const equal = byId.get(COLUMNS_VARIANTS[0].id);
  const startWide = byId.get(COLUMNS_VARIANTS[1].id);
  const endWide = byId.get(COLUMNS_VARIANTS[2].id);
  const three = byId.get(COLUMNS_VARIANTS[3].id);
  const missing = [equal, startWide, endWide, three].some((reading) => reading === undefined);
  if (missing) return { ok: false, detail: JSON.stringify({ missing, ids: wide.map((row) => row.id) }) };
  const close = (left, right) => Math.abs(left - right) <= 2;
  const equalWide = equal.widths.length === 2 && close(equal.widths[0], equal.widths[1]) && equal.widths[0] > 200;
  const startOk = startWide.widths.length === 2 && startWide.widths[0] > startWide.widths[1] + 2;
  const endOk = endWide.widths.length === 2 && endWide.widths[1] > endWide.widths[0] + 2;
  const threeOk = three.widths.length === 3 && three.widths[0] > 120
    && close(three.widths[0], three.widths[1]) && close(three.widths[1], three.widths[2])
    && three.ratioAttribute === null;
  // `plain` is the ordinary stack: it presents exactly like the variant that authored no surface at all.
  const surfaceOk = equal.backgroundColor !== endWide.backgroundColor
    && startWide.backgroundColor !== endWide.backgroundColor
    && startWide.backgroundColor !== equal.backgroundColor
    && startWide.borderWidth !== endWide.borderWidth
    && three.backgroundColor === endWide.backgroundColor
    && three.borderWidth === endWide.borderWidth;
  const stacked = (reading) =>
    reading !== undefined
    && reading.widths.length > 0
    && reading.widths.every((width) => close(width, reading.widths[0]))
    && reading.tops.length === reading.widths.length
    && reading.tops.every((top, index) => index === 0 || top > reading.tops[index - 1]);
  const narrowStacked = narrow.length === COLUMNS_VARIANTS.length && narrow.every(stacked);
  const overflow = [...wide, ...narrow].reduce((worst, reading) => Math.max(worst, reading.overflow), 0);
  const ok = equalWide && startOk && endOk && threeOk && surfaceOk && narrowStacked && overflow === 0;
  return {
    ok,
    detail: JSON.stringify({
      equalWide,
      startOk,
      endOk,
      threeOk,
      surfaceOk,
      narrowStacked,
      overflow,
      widths: wide.map((reading) => [reading.id, reading.widths]),
    }),
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

