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

import {
  FAMILY_PLATE,
  FAMILY_PLATE_ALT,
  FAMILY_PLATE_ALT_SIZE,
  FAMILY_PLATE_SIZE,
} from "./family-fixture.mjs";

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
 * them onto **two** owned Page plates, which is exactly what a migration that consolidates donor artwork onto owned assets
 * declares. Each occurrence still receives its own served locator, so item order is observable end to end.
 */
export const GALLERY_SOURCES = Object.freeze(
  Array.from({ length: 24 }, (_unused, index) => `/assets/wo121-plate-${index}.png`),
);

/**
 * The migration binding for those identities: twenty-four unique sources across two owned Page plates.
 *
 * `UNO-WO-121 / R02`: the last two identities are bound to a deliberately different second plate, so the twenty-four
 * occurrences carry two distinguishable byte sets, intrinsic sizes and served locators. Repeated occurrences of one identity
 * still share that identity's own bytes, exactly as declared.
 */
export const GALLERY_BINDINGS = Object.freeze({
  images: Object.freeze(
    GALLERY_SOURCES.map((source, index) => Object.freeze({
      source,
      owned: Object.freeze({ zone: "page", path: index >= 22 ? FAMILY_PLATE_ALT : FAMILY_PLATE }),
    })),
  ),
});

/** The owned path one donor identity is bound to, or `null` when the fixture declares it to neither plate. */
export function galleryOwnedPathFor(source) {
  const entry = GALLERY_BINDINGS.images.find((candidate) => candidate.source === source);
  return entry === undefined ? null : entry.owned.path;
}

/** The intrinsic size a served occurrence of one donor identity must carry. */
export function galleryExpectedSizeFor(source) {
  const path = galleryOwnedPathFor(source);
  if (path === FAMILY_PLATE) return FAMILY_PLATE_SIZE;
  if (path === FAMILY_PLATE_ALT) return FAMILY_PLATE_ALT_SIZE;
  return null;
}

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
 * 1. the rich section — heading, Markdown lede, the **muted** surface, a Markdown caption and a decorative figure, **no**
 *    column intent, so the donor's three/two/one default is what a visitor sees;
 * 2. the two-column intent with an explicitly authored **plain** surface;
 * 3. the three-column intent with an explicitly authored **bordered** surface;
 * 4. the four-column intent with **no** surface, so the absent case is measured beside the two emphases;
 * 5. the bare list — no heading, no lede, no surface, no column intent, so nothing is invented;
 * 6. the donor's own ceiling: twenty-four figures, each its own bound identity and its own served occurrence.
 *
 * `UNO-WO-121 / R02` authors `plain` and `bordered` explicitly (R01 authored only `muted` and absent), which is what lets the
 * executed evidence prove the donor's whole closed surface *and* that an authored `plain` has no effect at all.
 */
export const GALLERY_VARIANTS = Object.freeze([
  Object.freeze({ ...GALLERY_SOURCE }),
  Object.freeze({
    type: "gallery",
    heading: "Two columns",
    columns: 2,
    surface: "plain",
    items: Object.freeze([item(2), item(3), item(4)]),
  }),
  Object.freeze({
    type: "gallery",
    heading: "Three columns",
    columns: 3,
    surface: "bordered",
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

/** The surface each variant authors, in variant order: `null` is the absent case that must have no effect. */
export const GALLERY_SURFACES = Object.freeze(GALLERY_VARIANTS.map((variant) => variant.surface ?? null));

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

/**
 * The alternative each item must be announced with: the authored text, or the empty string for the explicitly decorative one.
 * Ownership is per item, never inherited from a neighbour.
 */
function expectedAlts(variant) {
  return variant.items.map((entry) => (entry.image.decorative === true ? "" : entry.image.alt));
}

/** Whether each item must own a caption at all — an absent caption is never invented. */
function expectedCaptionPresence(variant) {
  return variant.items.map((entry) => entry.caption !== undefined);
}

/** The intrinsic size each item must load, taken from the owned plate its own donor identity is bound to. */
function expectedSizes(variant) {
  return variant.items.map((entry) => {
    const size = galleryExpectedSizeFor(entry.image.src);
    return size === null ? null : [size.width, size.height];
  });
}

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

  // The reading must be the case it claims to be: no duplicate, missing or mislabelled observation.
  expect(reading.case === testCase.key, `case:${reading.case}`);
  expect(reading.width === testCase.width, `width:${reading.width}`);
  expect(reading.dark === (testCase.scheme === "dark"), `scheme:${reading.dark}`);
  expect(reading.reduce === (testCase.motion === "reduce"), `motion:${reading.reduce}`);
  expect(reading.media?.wide640 === (testCase.width >= 640), `mq640:${reading.media?.wide640}`);
  expect(reading.media?.wide1024 === (testCase.width >= 1024), `mq1024:${reading.media?.wide1024}`);

  const variants = reading.variants ?? [];
  expect(variants.length === GALLERY_IDS.length, `variants=${variants.length}`);
  GALLERY_VARIANTS.forEach((variant, index) => {
    const seen = variants[index];
    if (seen === undefined) {
      problems.push(`missing:${index}`);
      return;
    }
    const columns = expectedColumns(index, testCase.width);
    const authored = variant.columns === undefined ? null : String(variant.columns);
    expect(seen.id === GALLERY_IDS[index], `id:${index}`);
    expect(seen.listCount === 1, `list:${index}`);
    expect(seen.itemCount === variant.items.length, `items:${index}:${seen.itemCount}`);
    expect(seen.imageCount === variant.items.length, `images:${index}:${seen.imageCount}`);
    expect(seen.figuresPerItem === variant.items.length, `figures:${index}:${seen.figuresPerItem}`);
    // An unauthored intent has no attribute at all and the donor default applies; an authored one must be its own literal.
    expect(seen.intent === authored, `intent:${index}:${seen.intent}`);
    expect(seen.trackCount === columns, `tracks:${index}:${seen.trackCount}`);
    expect(seen.imagesLoaded === true, `loaded:${index}`);
    expect(seen.overflow === 0, `overflow:${index}`);
    expect(seen.hasControls === false, `controls:${index}`);
    // Equal track widths and real row geometry: `columns` cells per row, rows descending, order kept within a row.
    expect(
      seen.widths.length === variant.items.length
        && seen.widths.every((width) => Math.abs(width - seen.widths[0]) <= 1),
      `widths:${index}`,
    );
    expect(seen.rowCount === Math.ceil(variant.items.length / columns), `rows:${index}:${seen.rowCount}`);
    expect(seen.geometryOk === true, `geometry:${index}`);
    // Distinct, owned, ascending same-Page occurrence identity, in authored order.
    expect(new Set(seen.srcs).size === seen.srcs.length, `distinct:${index}`);
    expect(seen.srcs.every((src) => /^\/uno-media\//u.test(src)), `owned:${index}`);
    expect(seen.ascending === true, `order:${index}`);
    // Per-item alternative and caption ownership, exactly as authored; no raw Markdown syntax reaches a caption.
    expect(JSON.stringify(seen.alts) === JSON.stringify(expectedAlts(variant)), `alts:${index}`);
    expect(JSON.stringify(seen.captionPresence) === JSON.stringify(expectedCaptionPresence(variant)), `captions:${index}`);
    expect(
      seen.captionTexts.every((caption) => caption === null || !/(\*\*|\[[^\]]*\]\()/u.test(caption)),
      `caption-syntax:${index}`,
    );
    // Each item loads its own bound plate, at that plate's own intrinsic size.
    expect(JSON.stringify(seen.sizes) === JSON.stringify(expectedSizes(variant)), `sizes:${index}`);
  });

  const rich = variants[0];
  if (rich !== undefined) {
    expect(rich.heading === GALLERY_EXPECTED.heading, "heading");
    expect(rich.ledeStrong === GALLERY_EXPECTED.ledeStrong, "lede");
    expect(rich.captionEm === GALLERY_EXPECTED.captionEm, "caption");
    expect(rich.captionLinkHref === GALLERY_EXPECTED.captionLinkHref, "caption-link");
  }
  for (const index of [1, 2, 3]) {
    const seen = variants[index];
    if (seen === undefined) continue;
    expect(seen.heading === GALLERY_VARIANTS[index].heading, `heading:${index}`);
  }
  const bare = variants[4];
  if (bare !== undefined) {
    // The bare list invents nothing: no heading, no lede and no surface attribute at all.
    expect(bare.heading === null, "bare-heading");
    expect(bare.lede === null, "bare-lede");
    expect(bare.surface === null, "bare-surface");
  }

  // --- the closed surface, measured against its own tokens -----------------------------------------------------
  const plainIndex = GALLERY_SURFACES.indexOf("plain");
  const borderedIndex = GALLERY_SURFACES.indexOf("bordered");
  const mutedIndex = GALLERY_SURFACES.indexOf("muted");
  const absentIndex = GALLERY_SURFACES.indexOf(null);
  const plain = variants[plainIndex];
  const bordered = variants[borderedIndex];
  const muted = variants[mutedIndex];
  const absent = variants[absentIndex];
  const tokens = reading.tokens ?? {};
  if (plain !== undefined && bordered !== undefined && muted !== undefined && absent !== undefined) {
    expect(plain.surface === "plain", "plain-attr");
    expect(bordered.surface === "bordered", "bordered-attr");
    expect(muted.surface === "muted", "muted-attr");
    expect(absent.surface === null, "absent-attr");
    // An authored `plain` is the absence of emphasis: it computes exactly like the section that authors nothing.
    expect(
      plain.backgroundColor === absent.backgroundColor
        && plain.borderWidth === absent.borderWidth
        && plain.padding === absent.padding
        && plain.borderRadius === absent.borderRadius,
      `plain-inert:${plain.backgroundColor}/${plain.borderWidth}/${plain.padding}`,
    );
    // `muted` paints the surface token and pads; it never draws a border.
    expect(muted.backgroundColor === tokens.surface, `muted-token:${muted.backgroundColor}/${tokens.surface}`);
    expect(muted.borderWidth === "0px", `muted-border:${muted.borderWidth}`);
    expect(muted.padding !== plain.padding, `muted-padding:${muted.padding}`);
    expect(muted.borderRadius !== plain.borderRadius, `muted-radius:${muted.borderRadius}`);
    // `bordered` paints the background token and draws the border token, with the same padding and radius as `muted`.
    expect(bordered.backgroundColor === tokens.background, `bordered-token:${bordered.backgroundColor}`);
    expect(bordered.borderWidth === "1px", `bordered-border:${bordered.borderWidth}`);
    expect(bordered.padding === muted.padding, `bordered-padding:${bordered.padding}`);
    expect(bordered.borderRadius === muted.borderRadius, `bordered-radius:${bordered.borderRadius}`);
    // The three emphases are genuinely distinct from one another and from the absent case.
    expect(
      new Set([plain.backgroundColor, muted.backgroundColor, bordered.backgroundColor]).size === 3,
      "surfaces-distinct",
    );
  }

  expect(reading.keyboard?.reached === true, "keyboard");
  expect(reading.keyboard?.leftAfterTab === true, "keyboard-leave");
  expect(reading.keyboard?.pageUrlBefore === reading.keyboard?.pageUrlAfter, "keyboard-nav");
  expect(reading.errors === 0, `errors=${reading.errors}`);
  expect(reading.foreignRequests === 0, `foreign=${reading.foreignRequests}`);
  return Object.freeze({ ok: problems.length === 0, detail: problems.slice(0, 10).join(",") });
}

/**
 * The executed column geometry and surface measurements, so the run log itself records what each width and scheme produced.
 * A set of readings that is not exactly the six declared cases — once each — is not evidence, so it reports `ok: false`.
 */
export function galleryGeometryReport(readings) {
  const rows = [];
  for (const reading of readings) {
    const row = (reading.variants ?? []).map((variant, index) => [
      variant.id,
      expectedColumns(index, reading.width),
      variant.trackCount,
      variant.intent,
      variant.surface,
      variant.padding,
    ]);
    rows.push([reading.case, reading.width, reading.dark, reading.reduce, row]);
  }
  // A repeated or missing case is not evidence: the six declared keys must each appear exactly once.
  const keys = readings.map((reading) => reading.case);
  const distinct = new Set(keys).size === keys.length && keys.length === GALLERY_CASES.length;
  const ok = distinct
    && readings.every((reading) => {
      const testCase = GALLERY_CASES.find((item) => item.key === reading.case);
      return testCase !== undefined && galleryCaseVerdict(reading, testCase).ok;
    });
  return Object.freeze({ ok, detail: JSON.stringify(rows.slice(0, 2)) });
}
