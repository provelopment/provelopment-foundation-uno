/**
 * Foundation Uno — the one composed Foundation family fixture (`UNO-WO-112 / R01`).
 *
 * WHY THIS IS A MODULE. The seventeen-family Page, its migration bindings and the composed document are the shared input
 * of the U04 production gate and its module-level tests. Keeping them here — instead of inside a 4,000-line runner —
 * means the composition can be asserted on its own, the fixture has exactly one definition, and a change to a family
 * surface is a change to one cohesive file rather than a hunt through orchestration.
 *
 * WHAT IT IS NOT. Nothing here is authority. The donor source is inert authored data, the bindings are a migration
 * acknowledgement, and the composed document is the real adapter's own deep-frozen output. No file is written, no
 * declaration is read, and the strict reader remains the only authority on what a Page may contain.
 *
 * WHY THE ADAPTER IS PASSED IN. The adapter's own modules import each other without extensions, so a runner must install its
 * resolve hook before the adapter is loaded. This module therefore stays pure data and accepts the already-loaded adapter
 * as an argument, which keeps import order the caller's explicit decision.
 */

/** The Page route the fixture is published at, and the owned plate its single donor image identity resolves to. */
export const FAMILY_ROUTE = Object.freeze(["wo066-family-composition"]);
export const FAMILY_PLATE = "wo066-family-plate.png";
export const FAMILY_DONOR_SOURCE = "/assets/wo066-donor-plate.png";

/** `UNO-WO-112 / R01`: the donated hero actions, exactly as authored. One static `https` and one static `mailto`. */
export const HERO_ACTIONS = Object.freeze([
  Object.freeze({ label: "Read the notes", href: "https://example.org/hero-notes", variant: "primary" }),
  Object.freeze({ label: "Write to the desk", href: "mailto:desk@example.org", variant: "secondary" }),
]);

/**
 * `UNO-WO-114 / R01`: the donated Steps surface, exactly as authored — a plain heading, a Markdown-capable lede, the donor's
 * own closed `surface`, and one Markdown-capable item body beside an authored item without one. The Hero's actions and the
 * Stats surface are exported the same way, so the fixture and every expectation read one definition.
 */
export const STEPS_SOURCE = Object.freeze({
  type: "steps",
  heading: "Synthetic sequence",
  lede: "Synthetic steps keep the **authored** order.",
  surface: "muted",
  items: Object.freeze([
    Object.freeze({ title: "Draft", body: "Prepare the fixture **source**." }),
    Object.freeze({ title: "Review" }),
  ]),
});

/**
 * `UNO-WO-113 / R01`: the donated Stats surface, exactly as authored — a plain heading, a Markdown-capable lede, the donor's
 * own closed `surface`, and one Markdown-capable item detail. The Hero's actions are exported the same way, so the fixture
 * and every expectation read one definition.
 */
export const STATS_SOURCE = Object.freeze({
  type: "stats",
  heading: "Synthetic numbers",
  lede: "Synthetic numbers **summarise** the sample.",
  surface: "muted",
  items: Object.freeze([
    Object.freeze({ value: "13", label: "Sampled sections", detail: "Fixture **only**." }),
    Object.freeze({ value: "4", label: "New examples" }),
  ]),
});

/**
 * `UNO-WO-118 / R01`: the donated FAQ surface, exactly as authored — a plain heading, a Markdown-capable lede, the donor's
 * own closed `surface`, and two ordered `{question, answer}` items: one Markdown answer with an approved safe link and one
 * plain answer. Two items are what proves independent native disclosures, authored order and exact answer ownership in the
 * served Page; the donor's 24-item ceiling is proved separately by composition boundaries.
 */
export const FAQ_SOURCE = Object.freeze({
  type: "faq",
  heading: "Synthetic FAQ heading",
  lede: "Synthetic FAQ **introduction** with bounds.",
  surface: "muted",
  items: Object.freeze([
    Object.freeze({
      question: "Can this contact notice send anything?",
      answer: "No. Delivery is **off**, and [the notes](https://example.org/notes) stay read-only.",
    }),
    Object.freeze({
      question: "Is the fixture bounded?",
      answer: "Every authored value is bounded.",
    }),
  ]),
});

/**
 * `UNO-WO-118 / R02`: the long FAQ used only for the surface-coverage proof — the donor's full twenty-four-item ceiling,
 * authored exactly as a donor Page could author it. It is composed by the real adapter into three consecutive ordinary
 * groups, which is the only way to observe that the closed surface is effective on **every** group rather than on the first.
 */
export const FAQ_LONG_SOURCE = Object.freeze({
  type: "faq",
  heading: "Synthetic long FAQ",
  lede: "Twenty-four **bounded** questions.",
  surface: "muted",
  items: Object.freeze(
    Array.from({ length: 24 }, (_, index) =>
      Object.freeze({
        question: `Question ${index + 1}?`,
        answer: index === 0 ? "The **first** answer." : `Answer ${index + 1}.`,
      }),
    ),
  ),
});

/**
 * `UNO-WO-117 / R01`: the donated Quote surface, exactly as authored — a Markdown-capable `body`, a plain `attribution`
 * beside a plain `role` (the donor draws a role only with an attribution), and the donor's closed `align`/`surface` pair.
 * The donor authors no heading or lede for this family, so neither is present.
 */
export const QUOTE_SOURCE = Object.freeze({
  type: "quote",
  body: "The fixture records **bounded** evidence; it does not establish full parity.",
  attribution: "Synthetic contributor",
  role: "Reviewer",
  align: "center",
  surface: "bordered",
});

/** The exact top-level ids the unchanged adapter must produce for the fixture below, in document order. */
export const FAMILY_IDS = Object.freeze([
  "family-0-prose",
  "family-1-callout",
  "family-2-list",
  "family-3-faq",
  "family-4-media",
  "family-5-gallery",
  "family-6-contactform",
  "family-7-actions",
  "family-8-divider",
  "family-9-hero",
  "family-10-stats",
  "family-11-steps",
  "family-12-quote",
  "family-13-table",
  "family-14-columns",
  "family-15-cards",
  "family-16-features",
]);

/**
 * The deterministic donor-shaped source, in the exact order this proof depends on (`UNO-WO-066 / R01` onwards).
 *
 * Every string is original and synthetic. Indices 0–8 are the original nine families, 9–12 the `UNO-WO-067 / R01`
 * additions, 13–16 the `UNO-WO-068 / R03` additions. `UNO-WO-084`, `-103`, `-108`, `-110` and `-111` authored the richer
 * surfaces already proven; `UNO-WO-112 / R01` makes the hero carry its approved Markdown body and static actions.
 */
export function familySource() {
  return {
    version: 1,
    title: "Bounded family composition proof",
    // `UNO-WO-108 / R01`: one approved document-local declaration. It authorizes the `help` reference, so the list item
    // at index 2 must resolve it while the media/contact families stay OFF.
    links: { help: { reference: "applicationLink", key: "example.help" } },
    sections: [
      // `UNO-WO-084 / R01` (checkpoint A1): indices 0 and 1 author the donor's full surface for these two families — a real
      // Markdown lede/body, the closed `align`/`surface` pair, and a callout whose heading and lede sit inside its accent.
      {
        type: "prose",
        heading: "Synthetic prose heading",
        lede: "Synthetic prose introduction & \"quoted\" wording, with *emphasis*.",
        body: "The body carries **strong** emphasis, `inline code` and a [safe link](https://example.org/notes).",
        align: "center",
        surface: "muted",
      },
      {
        type: "callout",
        heading: "Synthetic callout heading",
        lede: "Synthetic callout introduction.",
        body: "A synthetic warning for the publication proof, with a **bounded** body.",
        tone: "warning",
        align: "start",
        surface: "bordered",
      },
      {
        // `UNO-WO-108 / R01`: the rich A2 list surface — classified `href`, a same-Site route and one authorized-but-OFF
        // `link` declaration — so the runner can observe real safe-reference behaviour instead of a plain two-item list.
        type: "list",
        heading: "Synthetic list heading",
        lede: "A **bounded list** on one published Page.",
        surface: "bordered",
        ordered: true,
        items: [
          "Prepare",
          { label: "Reference", href: "https://example.org/notes", detail: "An *authored* note." },
          { label: "Target", route: "wo108-target", detail: "A **published** Page." },
          { label: "Help unavailable", link: "help" },
        ],
      },
      {
        // `UNO-WO-118 / R01`: index 3 now authors the donor's full FAQ surface from the single exported definition — a plain
        // heading, a Markdown lede, the closed `surface` and two ordered question/answer items.
        ...FAQ_SOURCE,
        items: FAQ_SOURCE.items.map((item) => ({ ...item })),
      },
      { type: "media", image: { src: FAMILY_DONOR_SOURCE, alt: "Synthetic blue image plate" } },
      {
        type: "gallery",
        columns: 2,
        items: [
          { image: { src: FAMILY_DONOR_SOURCE, alt: "Synthetic first gallery image" }, caption: "First fixture image" },
          { image: { src: FAMILY_DONOR_SOURCE, alt: "Synthetic second gallery image" } },
        ],
      },
      { type: "contactForm", formRef: "wo066-contact" },
      {
        type: "actions",
        actions: [
          { label: "See the image", href: "#family-4-media" },
          { label: "Contact notice", href: "#family-6-contactform" },
        ],
      },
      { type: "divider" },
      // `UNO-WO-067 / R01`: appended after the unchanged nine; still donor-shaped input, never a hand-authored Uno node.
      // `UNO-WO-112 / R01`: the hero now authors both Markdown-capable body fields and its two approved static actions.
      {
        type: "hero",
        eyebrow: "Synthetic introduction",
        lede: "The composed Page is **visible** on one bounded site.",
        support: "This is a *bounded*, original fixture example.",
        align: "center",
        surface: "muted",
        actions: HERO_ACTIONS.map((action) => ({ ...action })),
      },
      {
        // `UNO-WO-072 / R01`: the authored heading and lede are the only source change at index 10.
        // `UNO-WO-113 / R01`: index 10 now authors the donor's full Stats surface from the single exported definition.
        ...STATS_SOURCE,
        items: STATS_SOURCE.items.map((item) => ({ ...item })),
      },

      {
        // `UNO-WO-072 / R01`: the authored heading and lede are the only source change at index 11; `surface` and the
        // item sequence stay exactly as before.
        // `UNO-WO-114 / R01`: index 11 now authors the donor's full Steps surface from the single exported definition.
        ...STEPS_SOURCE,
        items: STEPS_SOURCE.items.map((item) => ({ ...item })),
      },
      {
        // `UNO-WO-117 / R01`: index 12 now authors the donor's full Quote surface from the single exported definition —
        // a Markdown body, its plain attribution and role, and the closed presentation pair.
        ...QUOTE_SOURCE,
      },
      // `UNO-WO-068 / R03`: appended after the unchanged thirteen; still donor-shaped input to the real adapter.
      {
        type: "table",
        // `UNO-WO-108 / R01`: index 13 is the rich A2 table — Markdown caption and lede plus an authored surface.
        heading: "Synthetic table heading",
        lede: "The **table** explains synthetic totals.",
        surface: "muted",
        columns: ["Phase", "Count"],
        rows: [
          ["First", "1"],
          ["Second", "2"],
        ],
        caption: "Two **synthetic** records",
      },
      {
        type: "columns",
        ratio: "start-wide",
        items: [
          { title: "Left column", body: "The left text." },
          { title: "Right column", items: ["Check one", "Check two"] },
        ],
      },
      {
        type: "cards",
        // `UNO-WO-070 / R01` added the authored heading; `UNO-WO-071 / R01` adds the authored plain-text lede.
        heading: "Synthetic cards",
        lede: "Synthetic cards explain the choices.",
        columns: 2,
        items: [
          { title: "Card one", body: "First card body." },
          { title: "Card two" },
        ],
      },
      {
        type: "features",
        // `UNO-WO-070 / R01` added the authored heading; `UNO-WO-071 / R01` adds the authored plain-text lede.
        heading: "Synthetic features",
        lede: "Synthetic features describe the work.",
        columns: 3,
        items: [
          { title: "Feature one", body: "First feature body." },
          { title: "Feature two" },
        ],
      },
    ],
  };
}

/**
 * The separate migration binding for that source: one owned Page plate for the single donor image identity, and one exact
 * `delivery-off` acknowledgement. Neither key is publication, asset-servability or delivery authority.
 */
export function familyBindings() {
  return {
    images: [{ source: FAMILY_DONOR_SOURCE, owned: { zone: "page", path: FAMILY_PLATE } }],
    contactForms: [{ formRef: "wo066-contact", mode: "delivery-off" }],
  };
}

/**
 * Compose the fixture through the real adapter, which the caller passes in already loaded.
 *
 * A missing or non-callable adapter is a programming error, never a silent empty Page: the fixture can only exist as real
 * adapter output.
 */
export function composeFamilyFixture(compose) {
  if (typeof compose !== "function") {
    throw new TypeError("composeFamilyFixture requires the loaded composeUnoFoundationSubset function");
  }
  return compose(familySource(), familyBindings());
}

