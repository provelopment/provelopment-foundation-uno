/**
 * Foundation Uno — the FAQ family's shared verification expectations (`UNO-WO-118 / R01`).
 *
 * WHY THIS IS A MODULE. The authored FAQ fixture, its served disclosure region, its composition boundaries and its
 * whole-source refusal matrix are read by the production gate's HTTP check, its Chromium checks and the unit tests. One
 * definition means the fixture, the assertions and the tests cannot drift apart, and a family change is edited once —
 * exactly as the credited Hero, Stats, Steps and Quote families proved.
 *
 * WHAT IT IS NOT. No authority and no I/O: every function here is a pure predicate over a string or over inert authored
 * data, so it can be exercised without a server, a browser or a file.
 */
import { FAQ_LONG_SOURCE, FAQ_SOURCE } from "./family-fixture.mjs";

/** The one composed FAQ region this proof reads, and the disclosure group inside its authored heading/lede stack. */
export const FAQ_ID = "family-3-faq";
export const FAQ_ACCORDION_ID = "family-3-faq-accordion";

/** The authored FAQ surface, derived from the single fixture definition at `family-fixture.mjs`. */
export const FAQ_EXPECTED = Object.freeze({
  id: FAQ_ID,
  accordionId: FAQ_ACCORDION_ID,
  heading: FAQ_SOURCE.heading,
  lede: FAQ_SOURCE.lede,
  ledeText: FAQ_SOURCE.lede.replace(/\*\*/gu, ""),
  ledeStrong: "introduction",
  surface: FAQ_SOURCE.surface,
  items: Object.freeze(
    FAQ_SOURCE.items.map((item, index) =>
      Object.freeze({
        question: item.question,
        answer: item.answer,
        markdown: item.answer.includes("**") || item.answer.includes("]("),
        answerStrong: item.answer.includes("**off**") ? "off" : "",
        answerHref: item.answer.includes("https://example.org/notes") ? "https://example.org/notes" : "",
        answerLinkLabel: item.answer.includes("[the notes]") ? "the notes" : "",
        answerId: `${FAQ_ID}-answer-${index}`,
      }),
    ),
  ),
});

/** The exact props the adapter must compose for the native disclosure group, derived from the fixture. */
export function faqNodeProps() {
  return {
    items: FAQ_SOURCE.items.map((item, index) => ({
      sectionId: `${FAQ_ID}-answer-${index}`,
      label: item.question,
    })),
    summaryHeadingLevel: 3,
    surface: FAQ_SOURCE.surface,
  };
}

/**
 * The whole-source FAQ refusal matrix. Each case mutates one authored value of a fresh fixture source and expects the
 * adapter's own closed reason, with no partial document.
 */
export const FAQ_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "faq item carrying a link destination",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].items[0].href = "https://example.org";
    },
  }),
  Object.freeze({
    label: "faq item carrying an authored open state",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].items[0].open = true;
    },
  }),
  Object.freeze({
    label: "faq question carrying Markdown",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].items[0].question = "A **bold** question?";
    },
  }),
  Object.freeze({
    label: "faq answer carrying raw markup",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].items[0].answer = "A <script>alert(1)</script> answer.";
    },
  }),
  Object.freeze({
    label: "faq answer carrying an image",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].items[0].answer = "An ![alt](https://example.org/i.png) answer.";
    },
  }),
  Object.freeze({
    label: "faq answer carrying a script-scheme destination",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].items[0].answer = "An answer [x](javascript:alert(1)).";
    },
  }),
  Object.freeze({
    label: "faq answer carrying an unpaired surrogate",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].items[0].answer = "An answer \uD800 tail.";
    },
  }),
  Object.freeze({
    label: "faq lede carrying an unpaired surrogate",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[3].lede = "A lead \uD800 tail.";
    },
  }),
  Object.freeze({
    label: "faq with twenty-five items",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[3].items = Array.from({ length: 25 }, (_, index) => ({
        question: `Question ${index}`,
        answer: "An answer.",
      }));
    },
  }),
  Object.freeze({
    label: "faq with an empty item list",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[3].items = [];
    },
  }),
  Object.freeze({
    label: "faq question over the label bound",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[3].items[0].question = "q".repeat(161);
    },
  }),
  Object.freeze({
    label: "faq with an unknown surface",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[3].surface = "loud";
    },
  }),
  Object.freeze({
    label: "faq with a donor align field",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[3].align = "center";
    },
  }),
]);

/** The composed FAQ region, bounded by the opening tag of the next top-level family in document order. */
export function faqRegionOf(html, id = FAQ_ID, nextId = "family-4-media") {
  const at = html.indexOf(`id="${id}"`);
  if (at < 0) return "";
  const stackOpen = html.lastIndexOf('<div class="uno-json-stack" data-uno-gap="normal"', at);
  const start = stackOpen >= 0 ? stackOpen : html.lastIndexOf("<section", at);
  if (start < 0) return "";
  const nextAt = html.indexOf(`id="${nextId}"`, at);
  if (nextAt < 0) return "";
  // The next family's own opening tag, never a nested section that belongs to this one.
  const end = html.lastIndexOf("<", nextAt);
  return end > start ? html.slice(start, end) : "";
}

/**
 * The served disclosures of one FAQ region, in authored order: the question inside its own native `<summary>` and the
 * answer body it owns. Nothing here reads a label from anywhere but the disclosure it belongs to.
 */
export function faqDisclosuresOf(region) {
  const pattern = /<details class="uno-json-disclosure">([\s\S]*?)<\/details>/gu;
  return [...region.matchAll(pattern)].map((match) => {
    const block = match[1];
    const summary = /<summary class="uno-json-disclosure-summary">([\s\S]*?)<\/summary>/u.exec(block);
    const heading = /<h3>([^<]*)<\/h3>/u.exec(summary?.[1] ?? "");
    const body = /<div class="uno-json-disclosure-body">([\s\S]*?)<\/div>/u.exec(block);
    return {
      summary: summary === null ? "" : summary[1],
      question: heading === null ? "" : heading[1],
      plainSummary: heading === null,
      answer: body === null ? "" : body[1],
    };
  });
}

/**
 * How one composed FAQ node is laid out: the single native group, or the consecutive groups a longer authored list becomes.
 * Used to prove the 1/8/9/24/25 boundaries without re-deriving the adapter's own rule.
 */
export function faqLayoutOf(node) {
  if (node === null || node === undefined) return { container: "", groups: [] };
  if (node.module === "interaction.accordion") return { container: "accordion", groups: [node] };
  if (node.module === "layout.stack") {
    const groups = (node.children ?? []).filter((child) => child?.module === "interaction.accordion");
    return { container: "stack", groups };
  }
  return { container: String(node.module), groups: [] };
}

/**
 * The seven-dimension FAQ region predicate: the authored heading, the Markdown lede through the shared renderer, the closed
 * `surface` on the disclosure group, one native `<details>` per authored item in order with its question as a level-3
 * heading in its own `<summary>`, the Markdown answer parsed inside the disclosure it owns, and no invented state, control,
 * form, frame, heading level or donor identity anywhere in the family.
 */
export function faqServed(region, expected = FAQ_EXPECTED) {
  const disclosures = faqDisclosuresOf(region);
  const headingAt = region.indexOf(
    `<h2 class="uno-json-heading" id="${expected.id}-heading">${expected.heading}</h2>`,
  );
  const ledeAt = region.indexOf(`<section class="uno-json-prose" id="${expected.id}-lede">`);
  const groupAt = region.indexOf(
    `<div class="uno-json-accordion" data-uno-surface="${expected.surface}" id="${expected.accordionId}">`,
  );
  const ok =
    region.startsWith(`<div class="uno-json-stack" data-uno-gap="normal" id="${expected.id}">`)
    && headingAt > 0
    && ledeAt > headingAt
    && groupAt > ledeAt
    && region.slice(ledeAt, groupAt).includes(`<strong class="uno-family-md-strong">${expected.ledeStrong}</strong>`)
    && disclosures.length === expected.items.length
    && expected.items.every((item, index) => {
      const found = disclosures[index];
      if (found === undefined) return false;
      if (found.question !== item.question || found.plainSummary) return false;
      if (item.markdown) {
        return found.answer.includes(`<strong class="uno-family-md-strong">${item.answerStrong}</strong>`)
          && found.answer.includes(
            `<a class="uno-family-md-link" href="${item.answerHref}" rel="noopener noreferrer">${item.answerLinkLabel}</a>`,
          )
          && !found.answer.includes("**");
      }
      return found.answer.includes(`<p class="uno-json-prose" id="${item.answerId}">${item.answer}</p>`)
        && !found.answer.includes("uno-family-md");
    })
    && (region.match(/<h2 class="uno-json-heading"/gu) ?? []).length === 1
    && (region.match(/<h3>/gu) ?? []).length === expected.items.length
    && !/<h1\b|<h4\b|<button\b|<form\b|<iframe\b|<script\b|\bopen=/iu.test(region)
    && !region.includes("/assets/wo066-donor-plate.png")
    && !region.includes("example.help")
    && !region.includes("wo066-donor");
  return { ok, detail: JSON.stringify({ headingAt, ledeAt, groupAt, disclosures: disclosures.length }) };
}


/**
 * `UNO-WO-118 / R02`: the surface-coverage facts this proof reads from the single long fixture definition.
 *
 * The donor's 24-item ceiling composes into consecutive ordinary groups of at most eight; the surface must be effective on
 * every one of them, and the twenty-fifth item must still be refused.
 */
export const FAQ_LONG = Object.freeze({
  items: FAQ_LONG_SOURCE.items.length,
  groups: Math.ceil(FAQ_LONG_SOURCE.items.length / 8),
  surface: FAQ_LONG_SOURCE.surface,
  firstQuestion: FAQ_LONG_SOURCE.items[0].question,
  lastQuestion: FAQ_LONG_SOURCE.items[FAQ_LONG_SOURCE.items.length - 1].question,
});

/**
 * The computed-appearance comparison for the closed surface, over real `getComputedStyle` readings of one served disclosure
 * group under each authored value. A missing rule, an ineffective rule, or two values that present identically fails here.
 *
 * `plain` is the ordinary accordion by convention — every other Uno surface module treats it as "no emphasis" — so it must
 * equal the absent reading; the two emphasised values must each differ from it and from each other, in the background, the
 * border or the padding, not merely in the attribute.
 */
export function faqSurfacesDistinct(rows) {
  const of = (value) => rows.find((row) => row.value === value) ?? null;
  const absent = of("");
  const plain = of("plain");
  const muted = of("muted");
  const bordered = of("bordered");
  const complete = [absent, plain, muted, bordered].every(
    (row) => row !== null && typeof row.background === "string" && row.background.length > 0
      && typeof row.borderWidth === "string" && typeof row.padding === "string",
  );
  const same = (left, right) =>
    left.background === right.background
    && left.borderWidth === right.borderWidth
    && left.padding === right.padding
    && left.borderRadius === right.borderRadius;
  const ok = complete
    && same(plain, absent)
    && !same(muted, plain)
    && !same(bordered, plain)
    && !same(muted, bordered)
    && muted.background !== plain.background
    && Number.parseFloat(bordered.borderWidth) > Number.parseFloat(plain.borderWidth)
    && bordered.background !== muted.background
    && (muted.padding !== plain.padding || bordered.padding !== plain.padding);
  return { ok, detail: JSON.stringify(rows) };
}

