/**
 * Foundation Uno — the executed Gallery evidence (`UNO-WO-121 / R01`).
 *
 * WHAT THIS IS. The donor Gallery is one ordered list of one to twenty-four figures beneath an optional authored heading and
 * Markdown lede, inside a whole-section closed surface, with an optional column intent that otherwise defaults to three at a
 * wide viewport, two at an intermediate one and one at a narrow one. This module holds the donor source shapes, the served
 * variants, the closed refusal probes and the readers that turn one real response or one real browser observation into
 * facts. It decides nothing: the unchanged closure oracle still turns executed dimensions into a `PARITY_GALLERY` label.
 *
 * WHAT IT IS NOT. No threshold, no credit, no fixture write. The runner owns the transaction; this module owns the shapes.
 */

import { FAMILY_PLATE } from "./family-fixture.mjs";

/** The Page route the Gallery variants are served from: the committed family composition Page, restored afterwards. */
export const GALLERY_ROUTE_URL = "wo066-family-composition";

/** The anchors of the six served variants, appended after the Media variants on the same temporary Page. */
export const GALLERY_ID = "family-22-gallery";
export const GALLERY_IDS = Object.freeze([
  "family-22-gallery",
  "family-23-gallery",
  "family-24-gallery",
  "family-25-gallery",
  "family-26-gallery",
  "family-27-gallery",
]);

/**
 * The twenty-four distinct donor identities one Gallery may legitimately bind.
 *
 * They are distinct *sources* — the binder requires unique identities and an exact consumed set — while this fixture converges
 * all of them onto the one owned Page plate, which is exactly what a migration that consolidates donor artwork onto one owned
 * asset declares. Each occurrence still receives its own served locator, so item order is observable end to end.
 */
export const GALLERY_SOURCES = Object.freeze(
  Array.from({ length: 24 }, (_unused, index) => `/assets/wo121-plate-${index}.png`),
);

/** The migration binding for those identities: twenty-four unique sources, one owned Page plate. */
export const GALLERY_BINDINGS = Object.freeze({
  images: Object.freeze(
    GALLERY_SOURCES.map((source) => Object.freeze({ source, owned: Object.freeze({ zone: "page", path: FAMILY_PLATE }) })),
  ),
});

/** The donor Gallery the seven dimensions are proven on: heading, Markdown lede, surface, a Markdown caption and decorative. */
export const GALLERY_SOURCE = Object.freeze({
  type: "gallery",
  heading: "Field notes",
  lede: "A **bounded** lede.",
  surface: "muted",
  items: Object.freeze([
    Object.freeze({
      image: Object.freeze({ src: GALLERY_SOURCES[0], alt: "The first plate" }),
      caption: "An *owned* caption with [the notes](https://example.org/wo121-notes)",
    }),
    Object.freeze({ image: Object.freeze({ src: GALLERY_SOURCES[1], decorative: true }) }),
  ]),
});

/** What the served rich Gallery must show. */
export const GALLERY_EXPECTED = Object.freeze({
  heading: "Field notes",
  ledeStrong: "bounded",
  captionEm: "owned",
  captionLinkHref: "https://example.org/wo121-notes",
  captionLinkText: "the notes",
  surface: "muted",
  intrinsicWidth: 64,
  intrinsicHeight: 64,
});

/** One authored item of the twenty-four figure Gallery. */
function item(index, extra = {}) {
  return Object.freeze({
    image: Object.freeze({ src: GALLERY_SOURCES[index], alt: `Plate ${index}` }),
    ...extra,
  });
}

/**
 * The six served variants, each exercising one dimension of the closed representation:
 *
 * 1. the rich section — heading, Markdown lede, closed surface, a Markdown caption and a decorative figure, **no** column
 *    intent, so the donor's three/two/one default is what a visitor sees;
 * 2–4. the three explicit column intents;
 * 5. the bare list — no heading, no lede, no surface, one column intent absent as well, so nothing is invented;
 * 6. the donor's own ceiling: twenty-four figures, each its own bound identity and its own served occurrence.
 */
export const GALLERY_VARIANTS = Object.freeze([
  Object.freeze({ ...GALLERY_SOURCE }),
  Object.freeze({
    type: "gallery",
    heading: "Two columns",
    columns: 2,
    items: Object.freeze([item(2), item(3), item(4)]),
  }),
  Object.freeze({
    type: "gallery",
    heading: "Three columns",
    columns: 3,
    items: Object.freeze([item(5), item(6), item(7)]),
  }),
  Object.freeze({
    type: "gallery",
    heading: "Four columns",
    columns: 4,
    items: Object.freeze([item(8), item(9), item(10), item(11)]),
  }),
  Object.freeze({ type: "gallery", items: Object.freeze([item(12)]) }),
  Object.freeze({
    type: "gallery",
    items: Object.freeze(Array.from({ length: 24 }, (_unused, index) => item(index))),
  }),
]);

/** The column counts each variant must actually lay out at 390, 768 and 1280. */
export const GALLERY_COLUMNS = Object.freeze([
  Object.freeze({ at390: 1, at768: 2, at1280: 3 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 2 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 3 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 4 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 3 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 3 }),
]);


/**
 * The closed refusal probes. Each one mutates one field of the donor Gallery and must refuse the **whole Page** with the
 * closed reason its own shape earns — never a partial document and never a silent default.
 */
export const GALLERY_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "an empty item list",
    expected: "family:target-refused",
    mutate: (section) => {
      section.items = [];
    },
  }),
  Object.freeze({
    label: "twenty-five figures",
    expected: "family:target-refused",
    mutate: (section) => {
      section.items = Array.from({ length: 25 }, () => ({ image: { src: GALLERY_SOURCES[0], alt: "Repeated" } }));
    },
  }),
  Object.freeze({
    label: "an absent description without the decorative flag",
    expected: "family:target-refused",
    mutate: (section) => {
      section.items = [{ image: { src: GALLERY_SOURCES[0] } }];
    },
  }),
  Object.freeze({
    label: "a decorative image that also carries a description",
    expected: "family:target-refused",
    mutate: (section) => {
      section.items = [{ image: { src: GALLERY_SOURCES[0], alt: "Described", decorative: true } }];
    },
  }),
  Object.freeze({
    label: "an unbound source identity",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items = [{ image: { src: "/assets/not-bound.png", alt: "Unbound" } }];
    },
  }),
  Object.freeze({
    label: "an item destination",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items = [{ image: { src: GALLERY_SOURCES[0], alt: "Described" }, href: "/elsewhere" }];
    },
  }),
  Object.freeze({
    label: "a column intent outside the closed set",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.columns = 5;
    },
  }),
  Object.freeze({
    label: "a surface outside the closed set",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.surface = "raised";
    },
  }),
  Object.freeze({
    label: "a donor member outside the adopted shape",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.align = "center";
    },
  }),
  Object.freeze({
    label: "an embedded Markdown image in a caption",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items = [
        { image: { src: GALLERY_SOURCES[0], alt: "Described" }, caption: "![alt](https://example.org/x.png)" },
      ];
    },
  }),
  Object.freeze({
    label: "a caption above the donor's own ceiling",
    expected: "family:target-refused",
    mutate: (section) => {
      section.items = [{ image: { src: GALLERY_SOURCES[0], alt: "Described" }, caption: "c".repeat(4001) }];
    },
  }),
  Object.freeze({
    label: "a remote source identity",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.items = [{ image: { src: "https://example.org/plate.png", alt: "Remote" } }];
    },
  }),
]);

/** One closed extraction of a served Gallery section: its own wrapper and list, and nothing of the page after it. */
export function galleryRegionOf(html, id) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) return "";
  const open = html.lastIndexOf("<", start);
  const listClose = html.indexOf("</ul>", start);
  if (listClose < 0) {
    const next = html.indexOf('<div class="uno-json-gallery-section"', start + 1);
    return next < 0 ? html.slice(open) : html.slice(open, next);
  }
  const wrapperClose = html.indexOf("</div>", listClose);
  return html.slice(open, wrapperClose < 0 ? html.length : wrapperClose + 6);
}

/** The ordered list facts of one served Gallery region: one `ul`, one direct `li` per figure, in authored order. */
export function galleryListOf(region) {
  const listMatches = [...region.matchAll(/<ul class="uno-json-gallery-list"([^>]*)>/gu)];
  const listMatch = listMatches[0] ?? null;
  const items = region.match(/<li class="uno-json-gallery-entry">/gu) ?? [];
  const figures = region.match(/<figure class="uno-json-media-item">/gu) ?? [];
  const images = [...region.matchAll(/<img\b[^>]*>/gu)].map((match) => match[0]);
  const srcs = images.map((tag) => /src="([^"]*)"/u.exec(tag)?.[1] ?? "");
  const alts = images.map((tag) => /alt="([^"]*)"/u.exec(tag)?.[1] ?? null);
  const captions = [...region.matchAll(/<figcaption class="uno-json-media-caption">([\s\S]*?)<\/figcaption>/gu)]
    .map((match) => match[1] ?? "");
  return {
    listCount: listMatches.length,
    listAttributes: listMatch?.[1] ?? null,
    columns: listMatch === null ? null : /data-uno-columns="(\d)"/u.exec(listMatch[1] ?? "")?.[1] ?? null,
    itemCount: items.length,
    figureCount: figures.length,
    imageCount: images.length,
    srcs,
    alts,
    captions,
    headings: [...region.matchAll(/<h[2-6] class="uno-json-heading"[^>]*>([\s\S]*?)<\/h[2-6]>/gu)].map((match) => match[1]),
    prose: [...region.matchAll(/<(?:section|p) class="uno-json-prose"[^>]*>/gu)].length,
    surface: /data-uno-surface="([a-z]+)"/u.exec(region)?.[1] ?? null,
    hasControls: /<button\b|<form\b|<input\b|<iframe\b|<script\b/iu.test(region),
  };
}


/** The six executed browser cases: three real widths, each in light/normal motion and in dark/reduced motion. */
export const GALLERY_CASES = Object.freeze([
  Object.freeze({ key: "light:390", width: 390, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "light:768", width: 768, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "light:1280", width: 1280, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "dark:390", width: 390, scheme: "dark", motion: "reduce" }),
  Object.freeze({ key: "dark:768", width: 768, scheme: "dark", motion: "reduce" }),
  Object.freeze({ key: "dark:1280", width: 1280, scheme: "dark", motion: "reduce" }),
]);

/** The four keys the shared browser conjunction requires, all of which the six cases include. */
export const GALLERY_REQUIRED_CASES = Object.freeze(["light:390", "light:1280", "dark:390", "dark:1280"]);

/** The column count one variant must actually lay out at one executed width. */
function expectedColumns(index, width) {
  const want = GALLERY_COLUMNS[index] ?? GALLERY_COLUMNS[0];
  if (width >= 1024) return want.at1280;
  if (width >= 640) return want.at768;
  return want.at390;
}

/** The closed surface colour the credited `muted` section must compute to in each colour scheme. */
const MUTED_BACKGROUND = Object.freeze({ light: "rgb(245, 247, 251)", dark: "rgb(20, 27, 36)" });

/**
 * Judge one browser reading of all six served variants at one width and colour scheme.
 *
 * Every clause is measured: the one ordered list, its item and image count, the resolved column count and track count, the
 * distinct ascending owned locators, the loaded intrinsic size, the authored heading/lede/caption, the decorative empty
 * alternative, the computed surface, the absence of any control and any overflow, and a real keyboard traversal.
 */
export function galleryCaseVerdict(reading, testCase) {
  const problems = [];
  const expect = (ok, label) => {
    if (!ok) problems.push(label);
  };
  const variants = reading.variants ?? [];
  expect(variants.length === GALLERY_IDS.length, `variants=${variants.length}`);
  GALLERY_VARIANTS.forEach((variant, index) => {
    const seen = variants[index];
    if (seen === undefined) {
      problems.push(`missing:${index}`);
      return;
    }
    const columns = expectedColumns(index, testCase.width);
    expect(seen.id === GALLERY_IDS[index], `id:${index}`);
    expect(seen.listCount === 1, `list:${index}`);
    expect(seen.itemCount === variant.items.length, `items:${index}:${seen.itemCount}`);
    expect(seen.imageCount === variant.items.length, `images:${index}:${seen.imageCount}`);
    // An unauthored intent has no attribute at all and the donor default applies; an authored one must be its own literal.
    expect(seen.columns === (variant.columns === undefined ? null : String(variant.columns)), `intent:${index}:${seen.columns}`);
    expect(seen.trackCount === columns, `tracks:${index}:${seen.trackCount}`);
    expect(seen.imagesLoaded === true, `loaded:${index}`);
    expect(seen.overflow === 0, `overflow:${index}`);
    expect(seen.hasControls === false, `controls:${index}`);
    expect(new Set(seen.srcs).size === seen.srcs.length, `distinct:${index}`);
    expect(seen.srcs.every((src) => /^\/uno-media\//u.test(src)), `owned:${index}`);
    expect(seen.ascending === true, `order:${index}`);
    if (testCase.width < 640) {
      // Narrow: one column, in authored order, so each figure begins below the previous one.
      expect(seen.topsAscending === true, `mobile-order:${index}`);
    }
  });
  const rich = variants[0];
  if (rich !== undefined) {
    expect(rich.heading === GALLERY_EXPECTED.heading, "heading");
    expect(rich.ledeStrong === GALLERY_EXPECTED.ledeStrong, "lede");
    expect(rich.captionEm === GALLERY_EXPECTED.captionEm, "caption");
    expect(rich.captionLinkHref === GALLERY_EXPECTED.captionLinkHref, "caption-link");
    expect(rich.surface === GALLERY_EXPECTED.surface, "surface-attr");
    expect(rich.backgroundColor === MUTED_BACKGROUND[testCase.scheme], `surface-paint:${rich.backgroundColor}`);
    expect(rich.alts[1] === "", `decorative-alt:${rich.alts[1]}`);
    expect(rich.naturalWidths.every((value) => value === GALLERY_EXPECTED.intrinsicWidth), "intrinsic");
  }
  for (const index of [1, 2, 3]) {
    const seen = variants[index];
    if (seen === undefined) continue;
    expect(seen.heading === GALLERY_VARIANTS[index].heading, `heading:${index}`);
    expect(seen.surface === null, `surface:${index}`);
  }
  const bare = variants[4];
  if (bare !== undefined) {
    // The bare list invents nothing: no heading, no lede and no surface attribute at all.
    expect(bare.heading === null, "bare-heading");
    expect(bare.lede === null, "bare-lede");
    expect(bare.surface === null, "bare-surface");
  }
  expect(reading.keyboard?.reached === true, "keyboard");
  expect(reading.keyboard?.leftAfterTab === true, "keyboard-leave");
  expect(reading.keyboard?.pageUrlBefore === reading.keyboard?.pageUrlAfter, "keyboard-nav");
  expect(reading.errors === 0, `errors=${reading.errors}`);
  expect(reading.foreignRequests === 0, `foreign=${reading.foreignRequests}`);
  return Object.freeze({ ok: problems.length === 0, detail: problems.slice(0, 10).join(",") });
}

/** The executed column geometry, so the run log itself records what each width produced. */
export function galleryGeometryReport(readings) {
  const rows = [];
  for (const reading of readings) {
    const row = (reading.variants ?? []).map((variant, index) => [
      variant.id,
      expectedColumns(index, reading.width),
      variant.trackCount,
      variant.columns,
    ]);
    rows.push([reading.case, reading.width, row]);
  }
  const ok = readings.length === GALLERY_CASES.length
    && readings.every((reading) => {
      const testCase = GALLERY_CASES.find((item) => item.key === reading.case);
      return testCase !== undefined && galleryCaseVerdict(reading, testCase).ok;
    });
  return Object.freeze({ ok, detail: JSON.stringify(rows.slice(0, 2)) });
}
