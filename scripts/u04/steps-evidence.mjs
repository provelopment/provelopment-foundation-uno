/**
 * Foundation Uno — the Steps family's shared verification expectations (`UNO-WO-114 / R01`).
 *
 * WHY THIS IS A MODULE. The authored Steps fixture, its served region, its ordered `<li>` titles and bodies and its
 * whole-source refusal matrix are read by the production gate's HTTP check, its Chromium check and the unit tests. One
 * definition means the fixture, the assertions and the tests cannot drift apart, and a family change is edited once —
 * exactly as the credited Hero and Stats families proved.
 *
 * WHAT IT IS NOT. No authority and no I/O: every function here is a pure predicate over a string or over inert authored
 * data, so it can be exercised without a server, a browser or a file.
 */
import { STEPS_SOURCE } from "./family-fixture.mjs";

/** The one composed steps region this proof reads. */
export const STEPS_ID = "family-11-steps";

/** The authored Steps surface, derived from the single fixture definition at `family-fixture.mjs`. */
export const STEPS_EXPECTED = Object.freeze({
  id: STEPS_ID,
  heading: STEPS_SOURCE.heading,
  lede: STEPS_SOURCE.lede,
  ledeStrong: "authored",
  surface: STEPS_SOURCE.surface,
  items: Object.freeze(
    STEPS_SOURCE.items.map((item) =>
      Object.freeze({
        title: item.title,
        body: item.body ?? "",
        bodyStrong: item.body === undefined ? "" : "source",
      }),
    ),
  ),
});

/** The exact props the adapter must compose for the native timeline node, derived — never retyped — from the fixture. */
export function stepsNodeProps() {
  return {
    items: STEPS_SOURCE.items.map((item) => ({
      title: item.title,
      ...(item.body === undefined ? {} : { description: item.body }),
    })),
    surface: STEPS_SOURCE.surface,
    itemHeadingLevel: 3,
    markdown: true,
  };
}

/** The composed steps stack, bounded by the next top-level family in document order. */
export function stepsRegionOf(html, id = STEPS_ID, nextId = "family-12-quote") {
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

/** The served ordered items of one steps region: their level-3 titles and their authored bodies, in order. */
export function stepsItemsOf(region) {
  const pattern = /<li class="uno-json-timeline-item"([^>]*)>([\s\S]*?)<\/li>/gu;
  return [...region.matchAll(pattern)].map((match) => {
    const attributes = match[1];
    const body = match[2];
    const title = /<h3 class="uno-json-timeline-title">([^<]*)<\/h3>/u.exec(body);
    const plainDescription = /<p class="uno-json-timeline-description">([\s\S]*?)<\/p>/u.exec(body);
    const markdownDescription = /<div class="uno-json-timeline-description">([\s\S]*?)<\/div><\/div>/u.exec(body);
    return {
      title: title === null ? "" : title[1],
      description: plainDescription === null ? "" : plainDescription[1],
      markdownDescription: markdownDescription === null ? "" : markdownDescription[1],
      hasStatus: /data-uno-status/u.test(attributes),
      ariaCurrent: /aria-current/u.test(attributes),
      hasDate: /uno-json-timeline-date/u.test(body),
      hasMarker: /uno-json-timeline-marker/u.test(body),
    };
  });
}

/**
 * The seven-dimension steps region predicate: the authored heading, the Markdown lede, the closed surface, one native
 * ordered list with exactly the authored level-3 titles and Markdown body in order, and no invented status, current step,
 * date, icon, destination, control or frame anywhere in the family.
 */
export function stepsServed(region, expected = STEPS_EXPECTED) {
  const items = stepsItemsOf(region);
  const headingAt = region.indexOf(
    `<h2 class="uno-json-heading" id="${expected.id}-heading">${expected.heading}</h2>`,
  );
  const ledeAt = region.indexOf(`<section class="uno-json-prose" id="${expected.id}-lede">`);
  const sectionAt = region.indexOf(
    `<section class="uno-json-timeline" data-uno-surface="${expected.surface}" id="${expected.id}-timeline">`,
  );
  const listAt = region.indexOf('<ol class="uno-json-timeline-list">');
  const ok =
    region.startsWith(`<div class="uno-json-stack" data-uno-gap="normal" id="${expected.id}">`)
    && headingAt > 0
    && ledeAt > headingAt
    && sectionAt > ledeAt
    && region.slice(ledeAt, sectionAt).includes(`<strong class="uno-family-md-strong">${expected.ledeStrong}</strong>`)
    && listAt > sectionAt
    && items.length === expected.items.length
    && expected.items.every(
      (item, index) =>
        items[index]?.title === item.title
        && (item.body === ""
          ? items[index]?.description === "" && items[index]?.markdownDescription === ""
          : items[index]?.description === ""
            && items[index].markdownDescription.includes(
              `<strong class="uno-family-md-strong">${item.bodyStrong}</strong>`,
            )),
    )
    && items.every((item) => item.hasStatus === false && item.ariaCurrent === false && item.hasDate === false)
    && items.every((item) => item.hasMarker === true)
    && (region.match(/<h3 class="uno-json-timeline-title">/gu) ?? []).length === expected.items.length
    && (region.match(/<h2 class="uno-json-heading"/gu) ?? []).length === 1
    && !/<h1\b|<h4\b|<a\b|<button\b|<form\b|<iframe\b|<img\b/iu.test(region)
    && !/[$€£]/u.test(region);
  return { ok, detail: JSON.stringify({ headingAt, ledeAt, sectionAt, listAt, items }) };
}

/**
 * The whole-source steps refusal matrix. Each case mutates one authored value of a fresh fixture source and expects the
 * adapter's own closed reason, with no partial document.
 */
export const STEPS_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "steps item with an out-of-subset href",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[11].items[0].href = "https://example.org";
    },
  }),
  Object.freeze({
    label: "steps item with a lifecycle status",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[11].items[0].status = "current";
    },
  }),
  Object.freeze({
    label: "steps item with a date label",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[11].items[0].dateLabel = "March";
    },
  }),
  Object.freeze({
    label: "steps body carrying markup",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[11].items[0].body = "<script>alert(1)</script>";
    },
  }),
  Object.freeze({
    label: "steps with thirteen entries",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[11].items = Array.from({ length: 13 }, (_, index) => ({ title: `Step ${index + 1}` }));
    },
  }),
  Object.freeze({
    label: "steps with an empty title",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[11].items[0].title = "";
    },
  }),
  Object.freeze({
    label: "steps with an unknown surface",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[11].surface = "loud";
    },
  }),
]);

