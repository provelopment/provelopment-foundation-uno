/**
 * Foundation Uno — the Quote family's shared verification expectations (`UNO-WO-117 / R01`).
 *
 * WHY THIS IS A MODULE. The authored Quote fixture, its served figure/blockquote/caption region and its whole-source
 * refusal matrix are read by the production gate's HTTP check, its Chromium check and the unit tests. One definition means
 * the fixture, the assertions and the tests cannot drift apart, and a family change is edited once — exactly as the
 * credited Hero, Stats and Steps families proved.
 *
 * WHAT IT IS NOT. No authority and no I/O: every function here is a pure predicate over a string or over inert authored
 * data, so it can be exercised without a server, a browser or a file.
 */
import { QUOTE_SOURCE } from "./family-fixture.mjs";

/** The one composed Quote region this proof reads. */
export const QUOTE_ID = "family-12-quote";

/** The authored Quote surface, derived from the single fixture definition at `family-fixture.mjs`. */
export const QUOTE_EXPECTED = Object.freeze({
  id: QUOTE_ID,
  body: QUOTE_SOURCE.body,
  bodyText: QUOTE_SOURCE.body.replace(/\*\*/gu, ""),
  bodyStrong: "bounded",
  attribution: QUOTE_SOURCE.attribution,
  role: QUOTE_SOURCE.role,
  align: QUOTE_SOURCE.align,
  surface: QUOTE_SOURCE.surface,
});

/** The exact props the adapter must compose for the native testimonials node, derived — never retyped — from the fixture. */
export function quoteNodeProps() {
  return {
    items: [{ quote: QUOTE_SOURCE.body, attribution: QUOTE_SOURCE.attribution, role: QUOTE_SOURCE.role }],
    align: QUOTE_SOURCE.align,
    surface: QUOTE_SOURCE.surface,
    markdown: true,
  };
}

/** The served Quote section, bounded by the family id and its own closing section tag. */
export function quoteRegionOf(html, id = QUOTE_ID) {
  const marker = `id="${id}"`;
  const tagged = html.indexOf(marker);
  if (tagged < 0) return "";
  const open = html.lastIndexOf("<section", tagged);
  if (open < 0) return "";
  const close = html.indexOf("</section>", tagged);
  return close < 0 ? "" : html.slice(open, close + "</section>".length);
}

/** The served quotations and captions of one Quote region, in authored order. */
export function quoteItemsOf(region) {
  const quotes = [...region.matchAll(/<blockquote class="uno-json-testimonial-quote">([\s\S]*?)<\/blockquote>/gu)]
    .map((match) => match[1]);
  const captions = [...region.matchAll(/<figcaption class="uno-json-testimonial-caption">([\s\S]*?)<\/figcaption>/gu)]
    .map((match) => match[1]);
  const attribution = /<span class="uno-json-testimonial-attribution">([^<]*)<\/span>/u.exec(region);
  const role = /<span class="uno-json-testimonial-role">([^<]*)<\/span>/u.exec(region);
  return {
    figures: [...region.matchAll(/<figure class="uno-json-testimonial">/gu)].length,
    quotes,
    captions,
    attribution: attribution === null ? "" : attribution[1],
    role: role === null ? "" : role[1],
  };
}


/**
 * The seven-dimension Quote region predicate: one figure whose single `<blockquote>` holds the authored Markdown through the
 * shared renderer, one caption with separate attribution and role spans, the closed `align`/`surface` pair, and no invented
 * heading, caption, quotation, destination, control, frame, donor identity or declaration key.
 */
export function quoteServed(region, expected = QUOTE_EXPECTED) {
  const items = quoteItemsOf(region);
  const quote = items.quotes[0] ?? "";
  const ok =
    region.startsWith(
      `<section class="uno-json-testimonials" data-uno-align="${expected.align}" data-uno-surface="${expected.surface}" id="${expected.id}">`,
    )
    && items.figures === 1
    && items.quotes.length === 1
    && quote.includes('<div class="uno-family-md">')
    && quote.includes(`<strong class="uno-family-md-strong">${expected.bodyStrong}</strong>`)
    && !quote.includes("**")
    && items.captions.length === 1
    && items.attribution === expected.attribution
    && items.role === expected.role
    && (region.match(/<h1\b|<h2\b|<h3\b/gu) ?? []).length === 0
    && !/<a\b|<img\b|<button\b|<form\b|<iframe\b|<script\b/iu.test(region)
    && !region.includes("/assets/wo066-donor-plate.png")
    && !region.includes("example.help")
    && !region.includes("wo066-donor");
  return { ok, detail: JSON.stringify({ items, quote: quote.slice(0, 200) }) };
}

/**
 * The whole-source Quote refusal matrix. Each case mutates one authored value of a fresh fixture source and expects the
 * adapter's own closed reason, with no partial document. The donor authors no `heading`/`lede`, so those stay out of subset;
 * the Markdown body is now accepted, so what refuses here is Markdown the shared reader itself rejects, a bound, or a
 * malformed value — including a **suppressed** role-only caption, which is still validated.
 */
export const QUOTE_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "quote body carrying raw markup",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].body = "A <script>alert(1)</script> quotation.";
    },
  }),
  Object.freeze({
    label: "quote body carrying an image",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].body = "A quotation ![alt](https://example.org/i.png).";
    },
  }),
  Object.freeze({
    label: "quote body carrying an unbalanced strong construct",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].body = "An **unbalanced quotation.";
    },
  }),
  Object.freeze({
    label: "quote body carrying a script-scheme destination",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].body = "A quotation [x](javascript:alert(1)).";
    },
  }),
  Object.freeze({
    label: "quote body carrying a protocol-relative destination",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].body = "A quotation [x](//example.org/p).";
    },
  }),
  Object.freeze({
    label: "quote with a donor heading",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].heading = "Invented heading";
    },
  }),
  Object.freeze({
    label: "quote with a Markdown role",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].role = "**Reviewer**";
    },
  }),
  Object.freeze({
    label: "quote body carrying an unpaired surrogate",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[12].body = "A synthetic quotation \uD800 tail.";
    },
  }),
  Object.freeze({
    label: "quote body over the 4,000 code-point bound",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[12].body = "q".repeat(4001);
    },
  }),
  Object.freeze({
    label: "quote with an empty body",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[12].body = "";
    },
  }),
  Object.freeze({
    label: "quote with an unknown surface",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[12].surface = "loud";
    },
  }),
  Object.freeze({
    label: "quote with a suppressed role outside the label bound",
    expected: "family:target-refused",
    mutate: (source) => {
      // The caption is suppressed because no attribution is authored — the role is validated all the same.
      delete source.sections[12].attribution;
      source.sections[12].role = "r".repeat(161);
    },
  }),
]);
