/**
 * Foundation Uno — the Stats family's shared verification expectations (`UNO-WO-113 / R01`).
 *
 * WHY THIS IS A MODULE. The authored Stats fixture, its served region, its `<dl>` pairs and its whole-source refusal matrix
 * are read by the production gate's HTTP check, its Chromium check and the unit tests. One definition means the fixture,
 * the assertions and the tests cannot drift apart, and a family change is edited once — exactly as the Hero family proved.
 *
 * WHAT IT IS NOT. No authority and no I/O: every function here is a pure predicate over a string or over inert authored
 * data, so it can be exercised without a server, a browser or a file.
 */
import { STATS_SOURCE } from "./family-fixture.mjs";

/** The one composed stats region this proof reads. */
export const STATS_ID = "family-10-stats";

/** The authored Stats surface, derived from the single fixture definition at `family-fixture.mjs`. */
export const STATS_EXPECTED = Object.freeze({
  id: STATS_ID,
  heading: STATS_SOURCE.heading,
  lede: STATS_SOURCE.lede,
  ledeStrong: "summarise",
  surface: STATS_SOURCE.surface,
  items: Object.freeze(
    STATS_SOURCE.items.map((item) =>
      Object.freeze({
        value: item.value,
        label: item.label,
        detail: item.detail ?? "",
        detailStrong: item.detail === undefined ? "" : "only",
      }),
    ),
  ),
});

/** The exact props the adapter must compose for the native stats node, derived — never retyped — from the fixture. */
export function statsNodeProps() {
  return {
    items: STATS_SOURCE.items.map((item) => ({ ...item })),
    surface: STATS_SOURCE.surface,
    markdown: true,
  };
}

/** The composed stats stack, bounded by the next top-level family in document order. */
export function statsRegionOf(html, id = STATS_ID, nextId = "family-11-steps") {
  const at = html.indexOf(`id="${id}"`);
  if (at < 0) return "";
  const stackOpen = html.lastIndexOf('<div class="uno-json-stack" data-uno-gap="normal"', at);
  const start = stackOpen >= 0 ? stackOpen : html.lastIndexOf("<section", at);
  if (start < 0) return "";
  const nextAt = html.indexOf(`id="${nextId}"`, at);
  if (nextAt < 0) return "";
  const nextStack = html.lastIndexOf('<div class="uno-json-stack" data-uno-gap="normal"', nextAt);
  const nextSection = html.lastIndexOf("<section", nextAt);
  const end = Math.max(nextStack, nextSection);
  return end > start ? html.slice(start, end) : "";
}

/** The served value/label/detail triples of one stats region, in authored order. */
export function statsPairsOf(region) {
  const pattern = /<dt class="uno-json-stat-label">([^<]*)<\/dt><dd class="uno-json-stat-value">([\s\S]*?)<\/dd>/gu;
  return [...region.matchAll(pattern)].map((match) => {
    const inner = match[2];
    const detailAt = inner.indexOf('<div class="uno-json-stat-detail">');
    const plainAt = inner.indexOf('<span class="uno-json-stat-detail">');
    const cut = detailAt >= 0 ? detailAt : plainAt;
    return {
      label: match[1],
      value: (cut >= 0 ? inner.slice(0, cut) : inner).trim(),
      detail: cut < 0 ? "" : inner.slice(cut),
      markdownDetail: detailAt >= 0,
    };
  });
}

/**
 * The seven-dimension stats region predicate: the authored heading, the Markdown lede, the closed surface, one native
 * description list with exactly the authored pairs in order, the first item's Markdown detail, and no invented heading,
 * currency, control, form, frame or list other than the description list.
 */
export function statsServed(region, expected = STATS_EXPECTED) {
  const pairs = statsPairsOf(region);
  const headingAt = region.indexOf(
    `<h2 class="uno-json-heading" id="${expected.id}-heading">${expected.heading}</h2>`,
  );
  const ledeAt = region.indexOf(`<section class="uno-json-prose" id="${expected.id}-lede">`);
  const sectionAt = region.indexOf(
    `<section class="uno-json-stats" data-uno-surface="${expected.surface}" id="${expected.id}-stats">`,
  );
  const listAt = region.indexOf('<dl class="uno-json-stats-list">');
  const ok =
    region.startsWith(`<div class="uno-json-stack" data-uno-gap="normal" id="${expected.id}">`)
    && headingAt > 0
    && ledeAt > headingAt
    && sectionAt > ledeAt
    && region.slice(ledeAt, sectionAt).includes(`<strong class="uno-family-md-strong">${expected.ledeStrong}</strong>`)
    && listAt > sectionAt
    && pairs.length === expected.items.length
    && expected.items.every(
      (item, index) =>
        pairs[index]?.label === item.label
        && pairs[index]?.value === item.value
        && (item.detail === ""
          ? pairs[index]?.detail === ""
          : pairs[index]?.markdownDetail === true
            && pairs[index].detail.includes(`<strong class="uno-family-md-strong">${item.detailStrong}</strong>`)),
    )
    && !/uno-json-stats-heading|aria-labelledby/iu.test(region)
    && !/<h1\b|<h3|<button\b|<form\b|<iframe\b|<ol\b/iu.test(region)
    && !/[$€£]/u.test(region);
  return { ok, detail: JSON.stringify({ headingAt, ledeAt, sectionAt, listAt, pairs }) };
}

/**
 * The whole-source stats refusal matrix. Each case mutates one authored value of a fresh fixture source and expects the
 * adapter's own closed reason, with no partial document.
 */
export const STATS_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "stats item with an out-of-subset href",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[10].items[0].href = "https://example.org";
    },
  }),
  Object.freeze({
    label: "stats detail carrying markup",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[10].items[0].detail = "<script>alert(1)</script>";
    },
  }),
  Object.freeze({
    label: "stats detail carrying an image",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[10].items[0].detail = "![alt](https://example.org/i.png)";
    },
  }),
  Object.freeze({
    label: "stats with seven entries",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[10].items = Array.from({ length: 7 }, (_, index) => ({ value: String(index), label: "X" }));
    },
  }),
  Object.freeze({
    label: "stats with an empty value",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[10].items[0].value = "";
    },
  }),
  Object.freeze({
    label: "stats detail carrying an unpaired surrogate",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[10].items[0].detail = "Synthetic detail \uD800 tail";
    },
  }),
  Object.freeze({
    label: "stats lede carrying an interrupted surrogate pair",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[10].lede = "Synthetic lead \uD800A\uDC00 tail";
    },
  }),
  Object.freeze({
    label: "stats with an unknown surface",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[10].surface = "loud";
    },
  }),
]);

