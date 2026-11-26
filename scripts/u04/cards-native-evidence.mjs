/**
 * Foundation Uno — the native Cards evidence and its one production transaction (`UNO-WO-122 / R04`).
 *
 * WHAT THIS IS. The donor Cards family's text and presentation contract, adopted as a **native JSON** representation of the
 * existing `layout.grid` module: one closed, props-only, childless alternative carrying one to twenty-four ordered cards, an
 * optional authored heading at an explicit level, an optional Markdown-capable lede, an optional `2`/`3`/`4` column intent and
 * the whole-section closed surface. This module owns the shapes (the served native test Page, the exact facts it must show, the
 * closed refusal probes, the readers and the case verdict) **and** the one transaction that proves them over real production
 * HTTP and Chromium — so the focused entrypoint and the U04 gate execute the same proof, never two implementations of it.
 *
 * WHAT IT IS NOT. No composer, no family fixture, no durable Page, no credit. The Foundation composer is untouched: these
 * sections are authored JSON, served by the ordinary loader and renderer, and the unchanged closure oracle still reports
 * `PARITY_CARDS=PENDING`.
 */
import { deflateSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** The Page route the native cards test Page is served from: the test-owned family fixture zone, restored afterwards. */
export const NATIVE_CARDS_ROUTE_URL = "wo066-family-composition";

/** The four native sections, in served order. */
export const NATIVE_CARDS_IDS = Object.freeze([
  "native-cards-rich",
  "native-cards-four",
  "native-cards-plain",
  "native-cards-absent",
]);

/** The one safe destination a card body carries, reached by keyboard in every browser case. */
export const NATIVE_CARDS_LINK_HREF = "https://example.org/wo122-notes";
export const NATIVE_CARDS_LINK_TEXT = "the notes";

/**
 * `UNO-WO-124 / R04`: the two runtime-only synthetic plates this proof installs in the verified test-owned Page capsule zone,
 * and their deliberately different intrinsic sizes — so a served occurrence's dimensions identify its own file rather than
 * any single fixture. The identities are authored JSON references; the bytes exist only while the transaction runs.
 */
export const NATIVE_CARDS_OWNED_IMAGE = Object.freeze({ zone: "page", path: "cards/plate.png" });
export const NATIVE_CARDS_OWNED_ALT_IMAGE = Object.freeze({ zone: "page", path: "cards/alt-plate.png" });

/** The capsule zone the two task-owned files are created in, relative to the checkout root, and the per-identity sizes. */
export const NATIVE_CARDS_MEDIA_ROOT = "deployment/efs/capsule/e_7a3knkx60eacyhca7a0cr1k6e1/foundation/main";
export const NATIVE_CARDS_IMAGE_SIZE = Object.freeze({
  plate: Object.freeze({ width: 64, height: 64 }),
  altPlate: Object.freeze({ width: 96, height: 40 }),
});

/** The authored alternatives the image cases carry: one described, one explicitly decorative (exactly empty). */
export const NATIVE_CARDS_IMAGE_ALT = Object.freeze({
  descriptive: "A bordered plate",
  decorative: "",
});

/** The shipped card presentation, measured at the fixture's 16px root. */
export const NATIVE_CARDS_PADDING = "20px 20px 20px 20px";
export const NATIVE_CARDS_SECTION_PADDING = "16px 20px 16px 20px";
/** The computed inert surface: no paint, no edge and no padding at all. */
export const NATIVE_CARDS_INERT_PADDING = "0px 0px 0px 0px";

/** One authored card of the rich section, in source order. Card one owns a described plate, card three owns the same plate
 * again as an explicitly decorative image, and card two deliberately authors no image at all — the omission a reader must see. */
export const NATIVE_CARDS_RICH_CARDS = Object.freeze([
  Object.freeze({
    title: "Ownership",
    meta: "Card one",
    body: `A **bounded** body with [${NATIVE_CARDS_LINK_TEXT}](${NATIVE_CARDS_LINK_HREF}).`,
    bodyMarkdown: true,
    asset: NATIVE_CARDS_OWNED_IMAGE,
    alt: NATIVE_CARDS_IMAGE_ALT.descriptive,
  }),
  Object.freeze({ title: "Presence", body: "A plain body." }),
  Object.freeze({
    title: "Omission",
    asset: NATIVE_CARDS_OWNED_IMAGE,
    alt: NATIVE_CARDS_IMAGE_ALT.decorative,
    decorative: true,
  }),
]);

/**
 * The twenty-four-card section: every title distinct, every meta and body deliberately partial, so a card that inherits a
 * neighbour's field, loses its own or reorders changes the exact text a reader must find in that exact place.
 */
export const NATIVE_CARDS_FOUR_TITLES = Object.freeze(
  Array.from({ length: 24 }, (_unused, index) => `Plate ${index}`),
);

export const NATIVE_CARDS_FOUR_CARDS = Object.freeze(
  NATIVE_CARDS_FOUR_TITLES.map((title, index) =>
    Object.freeze({
      title,
      ...(index % 2 === 0 ? { meta: `Set ${index}` } : {}),
      ...(index % 3 === 0 ? { body: `Detail ${index}.` } : {}),
    }),
  ),
);

/**
 * The exact per-card image ownership the served sections must show, in card order: `null` is a card that must carry **no** image,
 * so an invented, shifted or inherited figure fails the proof exactly as a missing one does.
 */
export const NATIVE_CARDS_CARD_IMAGES = Object.freeze([
  Object.freeze([
    Object.freeze({ alt: NATIVE_CARDS_IMAGE_ALT.descriptive, size: "plate" }),
    null,
    Object.freeze({ alt: NATIVE_CARDS_IMAGE_ALT.decorative, size: "plate" }),
  ]),
  Object.freeze(NATIVE_CARDS_FOUR_CARDS.map(() => null)),
  Object.freeze([Object.freeze({ alt: NATIVE_CARDS_IMAGE_ALT.descriptive, size: "altPlate" })]),
  Object.freeze([null]),
]);

/**
 * The native test Page itself: authored JSON, no composer and no bindings. It authors a rich default-column list on the muted
 * surface, the donor's twenty-four-card ceiling at an explicit four columns on the bordered surface, an explicitly `plain`
 * surface at two columns, and one section with no surface at all — the inert comparison beside the two emphases.
 */
export const NATIVE_CARDS_DOCUMENT = Object.freeze({
  version: 1,
  title: "Native cards",
  sections: Object.freeze([
    Object.freeze({
      id: NATIVE_CARDS_IDS[0],
      module: "layout.grid",
      props: Object.freeze({
        heading: "Native cards",
        level: 2,
        lede: "A **bounded** lede.",
        ledeMarkdown: true,
        surface: "muted",
        cards: NATIVE_CARDS_RICH_CARDS,
      }),
    }),
    Object.freeze({
      id: NATIVE_CARDS_IDS[1],
      module: "layout.grid",
      props: Object.freeze({ columns: 4, surface: "bordered", cards: NATIVE_CARDS_FOUR_CARDS }),
    }),
    Object.freeze({
      id: NATIVE_CARDS_IDS[2],
      module: "layout.grid",
      props: Object.freeze({
        heading: "Plain cards",
        level: 2,
        columns: 2,
        surface: "plain",
        cards: Object.freeze([
          Object.freeze({
            title: "Plain one",
            body: "Plain body.",
            asset: NATIVE_CARDS_OWNED_ALT_IMAGE,
            alt: NATIVE_CARDS_IMAGE_ALT.descriptive,
          }),
        ]),
      }),
    }),
    Object.freeze({
      id: NATIVE_CARDS_IDS[3],
      module: "layout.grid",
      props: Object.freeze({ cards: Object.freeze([Object.freeze({ title: "Absent surface" })]) }),
    }),
  ]),
});

/**
 * The distinct "before" Page installed for the test-owned route at build time. It shares no anchor with the native document, so a
 * served response can be attributed to exactly one of the two documents, and a restored response is provably the original.
 */
export const NATIVE_CARDS_BEFORE_DOCUMENT = Object.freeze({
  version: 1,
  title: "Native cards before",
  sections: Object.freeze([
    Object.freeze({
      id: "native-cards-before",
      module: "content.prose",
      props: Object.freeze({ text: "The committed before document." }),
    }),
  ]),
});

/** The exact text that identifies the before document in a fresh, restored response. */
export const NATIVE_CARDS_BEFORE_MARKER = "The committed before document.";

/** The exact text every served card must show, in section and card order; `null` is a field that must not be emitted. */
export const NATIVE_CARDS_EXPECTED = Object.freeze({
  heading: "Native cards",
  surfaces: Object.freeze(["muted", "bordered", "plain", null]),
  cards: Object.freeze([
    Object.freeze([
      Object.freeze({ meta: "Card one", title: "Ownership", body: "A bounded body with the notes." }),
      Object.freeze({ meta: null, title: "Presence", body: "A plain body." }),
      Object.freeze({ meta: null, title: "Omission", body: null }),
    ]),
    Object.freeze(
      NATIVE_CARDS_FOUR_CARDS.map((card) =>
        Object.freeze({
          meta: card.meta ?? null,
          title: card.title,
          body: card.body ?? null,
        }),
      ),
    ),
    Object.freeze([Object.freeze({ meta: null, title: "Plain one", body: "Plain body." })]),
    Object.freeze([Object.freeze({ meta: null, title: "Absent surface", body: null })]),
  ]),
});

/**
 * The column count each section must actually resolve at 390, 768 and 1280: the donor's default of one, two and three when no
 * intent is authored, and the authored `2` or `4` otherwise. A narrow viewport is always one column, so an authored intent can
 * never overflow it.
 */
export const NATIVE_CARDS_COLUMNS = Object.freeze([
  Object.freeze({ at390: 1, at768: 2, at1280: 3 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 4 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 2 }),
  Object.freeze({ at390: 1, at768: 2, at1280: 3 }),
]);

/** The three executed Chromium cases; the six-case matrix stays deferred to a later Cards adoption review. */
export const NATIVE_CARDS_CASES = Object.freeze([
  Object.freeze({ key: "light:390", width: 390, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "light:768", width: 768, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "light:1280", width: 1280, scheme: "light", motion: "no-preference" }),
]);


/** One closed refusal probe over the native reader: a label, the closed reason it must earn, and its mutation. */
function refusal(label, expected, mutate) {
  return Object.freeze({ label, expected, mutate });
}

function cloneDocument() {
  return JSON.parse(JSON.stringify(NATIVE_CARDS_DOCUMENT));
}

function richProps(mutate) {
  const document = cloneDocument();
  mutate(document.sections[0].props);
  return document;
}

/**
 * `UNO-WO-124 / R04`: the probes mutate the rich section's **image-free** card (index 1), because card one and card three now own
 * authored images. Mutating an image-free sibling keeps every refusal proving the boundary it names instead of inheriting one.
 */
function richCard(mutate) {
  const document = cloneDocument();
  mutate(document.sections[0].props.cards[1]);
  return document;
}

function fourCardDocument(count) {
  const document = cloneDocument();
  document.sections[1].props.cards = Array.from({ length: count }, (_unused, index) => ({ title: `Plate ${index}` }));
  return document;
}

/**
 * The closed refusal probes. Each one mutates exactly one authored fact of the native document and must refuse the **whole Page**
 * with the closed reason its own shape earns — never a partial document and never a silent default.
 */
export const NATIVE_CARDS_REFUSALS = Object.freeze([
  refusal("no cards at all", "document:invalid-props", () => {
    const document = cloneDocument();
    document.sections[0].props.cards = [];
    return document;
  }),
  refusal("twenty-five cards", "document:invalid-props", () => fourCardDocument(25)),
  refusal("a title above the donor's 160 points", "document:invalid-props", () =>
    richCard((card) => {
      card.title = "t".repeat(161);
    }),
  ),
  refusal("a meta line above the donor's 120 points", "document:invalid-props", () =>
    richCard((card) => {
      card.meta = "m".repeat(121);
    }),
  ),
  refusal("a body above the donor's 4,000 points", "document:invalid-props", () =>
    richCard((card) => {
      card.body = "b".repeat(4001);
      card.bodyMarkdown = true;
    }),
  ),
  refusal("an absent title", "document:invalid-props", () =>
    richCard((card) => {
      delete card.title;
    }),
  ),
  refusal("a cards grid that also declares children", "document:invalid-section", () => {
    const document = cloneDocument();
    document.sections[0].children = [];
    return document;
  }),
  // `UNO-WO-124 / R01`: a card image is now representable, but only as an **owned** reference with an authored alternative.
  // Every boundary below is still refused rather than repaired, inferred or defaulted, and a card action stays deferred.
  refusal("a card image without an alternative", "document:invalid-props", () =>
    richCard((card) => {
      card.asset = NATIVE_CARDS_OWNED_IMAGE;
    }),
  ),
  refusal("a decorative card image with an alternative", "document:invalid-props", () =>
    richCard((card) => {
      card.asset = NATIVE_CARDS_OWNED_IMAGE;
      card.alt = "A plate";
      card.decorative = true;
    }),
  ),
  refusal("an alternative without an asset", "document:invalid-props", () =>
    richCard((card) => {
      card.alt = "A plate";
    }),
  ),
  refusal("a decorative flag without an asset", "document:invalid-props", () =>
    richCard((card) => {
      card.decorative = true;
    }),
  ),
  refusal("a card asset in an unknown zone", "document:invalid-props", () =>
    richCard((card) => {
      card.asset = { zone: "elsewhere", path: "plate.png" };
      card.alt = "A plate";
    }),
  ),
  refusal("a card asset with an unsafe path", "document:invalid-props", () =>
    richCard((card) => {
      card.asset = { zone: "page", path: "../plate.png" };
      card.alt = "A plate";
    }),
  ),
  refusal("a deferred card action", "document:invalid-props", () =>
    richCard((card) => {
      card.action = { label: "Go", href: NATIVE_CARDS_LINK_HREF };
    }),
  ),
  refusal("a card member outside the adopted shape", "document:invalid-props", () =>
    richCard((card) => {
      card.icon = "star";
    }),
  ),
  refusal("a Markdown body flag without a body", "document:invalid-props", () =>
    richCard((card) => {
      delete card.body;
      card.bodyMarkdown = true;
    }),
  ),
  refusal("a Markdown lede flag without a lede", "document:invalid-props", () =>
    richProps((props) => {
      delete props.lede;
    }),
  ),
  refusal("a column intent outside the closed set", "document:invalid-props", () =>
    richProps((props) => {
      props.columns = 5;
    }),
  ),
  refusal("a surface outside the closed set", "document:invalid-props", () =>
    richProps((props) => {
      props.surface = "raised";
    }),
  ),
  refusal("a heading level outside the closed set", "document:invalid-props", () =>
    richProps((props) => {
      props.level = 7;
    }),
  ),
  refusal("a heading member outside the adopted shape", "document:invalid-props", () =>
    richProps((props) => {
      props.align = "center";
    }),
  ),
  refusal("an unsafe Markdown destination", "document:unsafe-text", () =>
    richCard((card) => {
      card.body = "[x](javascript:alert(1))";
      card.bodyMarkdown = true;
    }),
  ),
  refusal("raw markup in a Markdown body", "document:unsafe-text", () =>
    richCard((card) => {
      card.body = "<script>alert(1)</script>";
      card.bodyMarkdown = true;
    }),
  ),
  refusal("an unpaired surrogate in a title", "document:invalid-props", () =>
    richCard((card) => {
      card.title = "Lead \uD800 tail";
    }),
  ),
]);

/** The accepted boundary cases: the donor's own bounds, and one, eight, nine and twenty-four cards. */
export const NATIVE_CARDS_ACCEPTED = Object.freeze([
  Object.freeze({ label: "one card", document: () => fourCardDocument(1) }),
  Object.freeze({ label: "eight cards", document: () => fourCardDocument(8) }),
  Object.freeze({ label: "nine cards", document: () => fourCardDocument(9) }),
  Object.freeze({ label: "twenty-four cards", document: () => fourCardDocument(24) }),
  Object.freeze({
    label: "the exact donor bounds",
    document: () =>
      richCard((card) => {
        card.title = "t".repeat(160);
        card.meta = "m".repeat(120);
        card.body = "b".repeat(4000);
      }),
  }),
  Object.freeze({
    label: "supplementary characters counted once each",
    document: () =>
      richCard((card) => {
        card.title = "𝒜".repeat(160);
      }),
  }),
  Object.freeze({
    // `UNO-WO-124 / R01`: the donor's optional owned image — one card described, one explicitly decorative — is now accepted at
    // exactly the authored values, on a clone, so the shared accepted document and every served proof stay untouched.
    label: "one descriptive and one decorative owned card image",
    document: () => {
      const document = cloneDocument();
      // `UNO-WO-124 / R04`: card one already owns the described plate in the served document, so this clone re-asserts those exact
      // authored values rather than adding a second image to a card the unit reader pins as image-free.
      const rich = document.sections[0].props.cards[0];
      rich.asset = NATIVE_CARDS_OWNED_IMAGE;
      rich.alt = NATIVE_CARDS_IMAGE_ALT.descriptive;
      const fourth = document.sections[1].props.cards[0];
      fourth.asset = NATIVE_CARDS_OWNED_IMAGE;
      fourth.alt = NATIVE_CARDS_IMAGE_ALT.decorative;
      fourth.decorative = true;
      return document;
    },
  }),
]);


/** One closed extraction of a served native cards section: its own wrapper and list, and nothing of the page after it. */
export function nativeCardsRegionOf(html, id) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) return "";
  const open = html.lastIndexOf("<div", start);
  const listClose = html.indexOf("</ul>", start);
  const wrapperClose = listClose < 0 ? html.indexOf("</div>", start) : html.indexOf("</div>", listClose);
  return html.slice(open, wrapperClose < 0 ? html.length : wrapperClose + 6);
}

/** The ordered list facts of one served native cards region: one `ul`, one direct `li` per card, in authored order. */
export function nativeCardsListOf(region) {
  const lists = [...region.matchAll(/<ul class="uno-json-cards"([^>]*)>/gu)];
  const items = region.match(/<li class="uno-json-card">/gu) ?? [];
  // `UNO-WO-124 / R04`: each card's own figure, read from that card's own `<li>` — never from a neighbour, and never borrowed from
  // a section-wide match. `firstInItem` records that the figure is the card's first element, `count` that it is the only one.
  const chunks = region.split('<li class="uno-json-card">').slice(1);
  const attribute = (attributes, name) => new RegExp(`${name}="([^"]*)"`, "u").exec(attributes ?? "")?.[1] ?? null;
  const images = chunks.map((chunk) => {
    const figures = [...chunk.matchAll(/<img\b([^>]*)>/giu)];
    const first = figures[0]?.[1] ?? "";
    return {
      count: figures.length,
      src: attribute(first, "src"),
      alt: attribute(first, "alt"),
      className: attribute(first, "class"),
      firstInItem: figures.length > 0 && chunk.trimStart().startsWith("<img"),
    };
  });
  // A card's fields are read as **text**: markup is stripped and whitespace collapsed, so a plain field and a Markdown-rendered
  // one compare equal only when they carry the same readable text, and a wrapper element can never masquerade as content.
  const plain = (value) => value.replace(/<[^>]*>/gu, "").replace(/\s+/gu, " ").trim();
  return {
    listCount: lists.length,
    listAttributes: lists[0]?.[1] ?? null,
    columns: lists[0] === undefined ? null : /data-uno-columns="(\d)"/u.exec(lists[0][1] ?? "")?.[1] ?? null,
    itemCount: items.length,
    metas: [...region.matchAll(/<p class="uno-json-card-meta">([\s\S]*?)<\/p>/gu)].map((match) => plain(match[1] ?? "")),
    titles: [...region.matchAll(/<h[2-6] class="uno-json-heading">([\s\S]*?)<\/h[2-6]>/gu)].map((match) => plain(match[1] ?? "")),
    bodies: [...region.matchAll(/<(?:p|div) class="[^"]*uno-json-card-body[^"]*">([\s\S]*?)<\/(?:p|div)>/gu)].map((match) =>
      plain(match[1] ?? ""),
    ),
    surface: /data-uno-surface="([a-z]+)"/u.exec(region)?.[1] ?? null,
    heading:
      plain(/<h2 class="uno-json-heading" id="[^"]+-heading">([\s\S]*?)<\/h2>/u.exec(region)?.[1] ?? "") || null,
    hasControls: /<button\b|<form\b|<input\b|<iframe\b|<script\b/iu.test(region),
    hasImage: /<img\b/iu.test(region),
    images,
  };
}

/**
 * `UNO-WO-124 / R04`: the two synthetic PNG fixtures this transaction owns.
 *
 * A PNG is written here rather than committed so no durable asset byte and no binary enters the repository: the bytes exist only
 * for the duration of one run, in the verified test-owned Page capsule zone, created exclusively into a directory that must be
 * absent beforehand and removed file-by-file and then as an empty directory afterwards. The generator is deterministic — the same
 * input always yields the same bytes — so an occurrence's byte count and IHDR dimensions identify its own file.
 */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = Array.from({ length: 256 }, (_unused, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** One opaque RGB PNG of exactly the requested size, filled with one flat colour. */
export function pngBytes(width, height, color) {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const at = row + 1 + x * 3;
      raw[at] = color[0];
      raw[at + 1] = color[1];
      raw[at + 2] = color[2];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** The two fixtures, their authored identities, their sizes and their flat colours. */
const CARD_PLATES = Object.freeze([
  Object.freeze({ key: "plate", name: "plate.png", size: NATIVE_CARDS_IMAGE_SIZE.plate, color: [32, 96, 160] }),
  Object.freeze({ key: "altPlate", name: "alt-plate.png", size: NATIVE_CARDS_IMAGE_SIZE.altPlate, color: [160, 96, 32] }),
]);

/**
 * Create the fixtures exclusively. A `cards/` directory that already exists is **not** reused and **not** removed: the run reports
 * `absent: false` and installs nothing, so this proof can never delete a file it did not create.
 */
export function installCardPlates(mediaRoot) {
  const directory = resolve(mediaRoot, "cards");
  // Fail closed: a directory that already exists is never reused, never written into and never removed.
  if (existsSync(directory)) return { absent: false, directory, installed: [] };
  mkdirSync(directory);
  const installed = [];
  try {
    for (const plate of CARD_PLATES) {
      const path = resolve(directory, plate.name);
      const bytes = pngBytes(plate.size.width, plate.size.height, plate.color);
      writeFileSync(path, bytes, { flag: "wx" });
      installed.push({ key: plate.key, name: plate.name, path, size: plate.size, byteLength: bytes.length });
    }
  } catch (error) {
    // Exception-safe from the first successful write: a partial install removes exactly what it created, so a failed run can never
    // leave a plate or its directory behind for the next one to trip over.
    for (const plate of installed) rmSync(plate.path, { force: true });
    if (existsSync(directory)) rmdirSync(directory);
    throw error;
  }
  return { absent: true, directory, installed };
}

/** Remove only the task-owned files, then the directory only if the fixture made it empty; returns whether the zone is clear. */
export function removeCardPlates(state) {
  for (const plate of state.installed) rmSync(plate.path, { force: true });
  if (state.installed.length > 0 && existsSync(state.directory)) rmdirSync(state.directory);
  return !existsSync(state.directory) && state.installed.every((plate) => !existsSync(plate.path));
}

/** The column count one section must actually lay out at one executed width. */
function expectedColumns(index, width) {
  const want = NATIVE_CARDS_COLUMNS[index] ?? NATIVE_CARDS_COLUMNS[0];
  if (width >= 1024) return want.at1280;
  if (width >= 640) return want.at768;
  return want.at390;
}


/**
 * Judge one browser reading of all four served native sections at one width.
 *
 * The reading must be the case it claims to be; each section must hold one ordered list with one direct card per authored item;
 * the resolved tracks must be finite, positive, equal within a rounding pixel and equal in count to the authored intent or the
 * donor default; each card must occupy its own cell in real row order; every card must carry exactly its own authored meta,
 * title and body and nothing where the document authored nothing; every card must show the family's border and padding; each
 * section must present its authored surface and, for the two inert cases, compute nothing at all; the safe link must be the only
 * interactive element and must be reachable and left again by keyboard without navigating; and nothing may overflow, error or
 * reach a foreign host.
 */
export function nativeCardsCaseVerdict(reading, testCase) {
  const problems = [];
  const expect = (ok, label) => {
    if (!ok) problems.push(label);
  };
  const isTransparent = (value) => value === "rgba(0, 0, 0, 0)" || value === "transparent";
  const sections = Array.isArray(reading.sections) ? reading.sections : [];

  expect(reading.case === testCase.key, `case:${reading.case}`);
  expect(reading.width === testCase.width, `width:${reading.width}`);
  expect(sections.length === NATIVE_CARDS_IDS.length, `sections:${sections.length}`);

  NATIVE_CARDS_IDS.forEach((id, index) => {
    const section = sections[index];
    if (section === undefined) {
      problems.push(`missing:${id}`);
      return;
    }
    const expected = NATIVE_CARDS_EXPECTED.cards[index] ?? [];
    const columns = expectedColumns(index, testCase.width);
    const surface = NATIVE_CARDS_EXPECTED.surfaces[index];

    expect(section.id === id, `id:${id}`);
    expect(section.listCount === 1, `${id}:lists=${section.listCount}`);
    expect(section.itemCount === expected.length, `${id}:items=${section.itemCount}`);
    expect(section.trackCount === columns, `${id}:tracks=${section.trackCount}!=${columns}`);
    expect(section.tracksPositive === true, `${id}:tracks-not-positive`);
    expect(section.tracksEqual === true, `${id}:tracks-unequal`);
    expect(section.rowOrder === true, `${id}:row-order`);
    expect(section.distinctCells === true, `${id}:cells-share-a-cell`);

    expect(
      JSON.stringify(section.metas) === JSON.stringify(expected.filter((card) => card.meta !== null).map((card) => card.meta)),
      `${id}:meta`,
    );
    expect(JSON.stringify(section.titles) === JSON.stringify(expected.map((card) => card.title)), `${id}:titles`);
    expect(
      JSON.stringify(section.bodies) === JSON.stringify(expected.filter((card) => card.body !== null).map((card) => card.body)),
      `${id}:bodies`,
    );

    // `UNO-WO-124 / R04`: the card's own figure — loaded, owned, at its own intrinsic size, carrying its own authored
    // alternative (`""` when explicitly decorative, which is exactly empty) — and no figure at all on an image-free card.
    const expectedImages = NATIVE_CARDS_CARD_IMAGES[index] ?? [];
    const images = Array.isArray(section.images) ? section.images : [];
    expect(images.length === expected.length, `${id}:images=${images.length}`);
    expectedImages.forEach((want, cardIndex) => {
      const got = images[cardIndex];
      if (want === null) {
        expect(got?.count === 0, `${id}:card${cardIndex}:unexpected-image`);
        return;
      }
      const size = NATIVE_CARDS_IMAGE_SIZE[want.size];
      expect(got?.count === 1, `${id}:card${cardIndex}:image-count=${got?.count}`);
      expect(got?.first === true, `${id}:card${cardIndex}:image-not-first`);
      expect(got?.alt === want.alt, `${id}:card${cardIndex}:alt=${JSON.stringify(got?.alt)}`);
      expect(got?.complete === true, `${id}:card${cardIndex}:image-not-loaded`);
      expect(
        got?.naturalWidth === size.width && got?.naturalHeight === size.height,
        `${id}:card${cardIndex}:natural=${got?.naturalWidth}x${got?.naturalHeight}`,
      );
    });

    expect(
      section.borders.every((width) => Number.isFinite(width) && width >= 1),
      `${id}:card-border:${JSON.stringify(section.borders)}`,
    );
    expect(
      section.paddings.every((padding) => padding === NATIVE_CARDS_PADDING),
      `${id}:card-padding:${JSON.stringify(section.paddings)}`,
    );

    expect(section.surface === surface, `${id}:surface:${section.surface}`);
    if (surface === "muted" || surface === "bordered") {
      expect(section.surfacePadding === NATIVE_CARDS_SECTION_PADDING, `${id}:section-padding:${section.surfacePadding}`);
      expect(section.surfacePaint === true, `${id}:surface-paint`);
      if (surface === "muted") expect(section.surfaceBackground === reading.tokens?.surface, `${id}:muted-token`);
      if (surface === "bordered") expect(section.surfaceBorder >= 1, `${id}:bordered-edge:${section.surfaceBorder}`);
    } else {
      // `plain` and the absent case are inert: no paint, no edge and no section padding at all.
      expect(isTransparent(section.surfaceBackground), `${id}:inert-background:${section.surfaceBackground}`);
      expect(section.surfaceBorderWidth === "0px", `${id}:inert-edge:${section.surfaceBorderWidth}`);
      expect(section.surfacePadding === NATIVE_CARDS_INERT_PADDING, `${id}:inert-padding:${section.surfacePadding}`);
      expect(section.surfacePaint === false, `${id}:inert-paint`);
    }

    expect(section.overflow === false, `${id}:overflow`);
  });

  // The rich section is the only one that authors a destination, and the only one that may hold any interactive element.
  expect(sections[0]?.linkCount === 1, `link-count:${sections[0]?.linkCount}`);
  expect(sections[0]?.linkHref === NATIVE_CARDS_LINK_HREF, `link-href:${sections[0]?.linkHref}`);
  expect(sections[0]?.linkRel === "noopener noreferrer", `link-rel:${sections[0]?.linkRel}`);
  for (const index of [1, 2, 3]) {
    expect(sections[index]?.linkCount === 0, `${NATIVE_CARDS_IDS[index]}:unexpected-link`);
  }
  expect(reading.keyboard?.reached === true, "keyboard:not-reached");
  expect(reading.keyboard?.visible === true, "keyboard:not-visible");
  expect(reading.keyboard?.leftAfterTab === true, "keyboard:trapped");
  expect(reading.keyboard?.samePage === true, "keyboard:navigated");
  expect(reading.foreignRequests === 0, `foreign:${reading.foreignRequests}`);
  expect(reading.errors === 0, `errors:${reading.errors}`);

  return {
    ok: problems.length === 0,
    detail: problems.length === 0 ? `${testCase.key} native cards ok` : `${testCase.key} ${problems.join(" ")}`,
    problems,
  };
}


/**
 * The one browser reading of the served native Cards Page, executed inside the page.
 *
 * It reads only what a visitor's browser can observe: one ordered list per section, its cards in DOM order, the resolved grid
 * tracks, each card's own computed border and padding, the wrapper's authored surface and paint, the one authored destination,
 * and whether anything overflows.
 */
export function readNativeCardsCase(input) {
  const probe = document.createElement("div");
  probe.style.backgroundColor = "var(--uno-surface)";
  document.body.appendChild(probe);
  const surfaceToken = getComputedStyle(probe).backgroundColor;
  probe.remove();

  const sections = input.ids.map((id) => {
    const wrapper = document.getElementById(id);
    const list = wrapper === null ? null : wrapper.querySelector(":scope > ul.uno-json-cards");
    const cards = list === null ? [] : [...list.children];
    const listStyle = list === null ? null : getComputedStyle(list);
    const tracks = listStyle === null ? "" : listStyle.gridTemplateColumns;
    const trackWidths = tracks === "" || tracks === "none"
      ? []
      : tracks.split(/\s+/u).map((track) => Number.parseFloat(track)).filter((value) => Number.isFinite(value));
    const boxes = cards.map((card) => {
      const box = card.getBoundingClientRect();
      return { top: Math.round(box.top), left: Math.round(box.left) };
    });
    const rowOrder = boxes.every((box, index) => {
      if (index === 0) return true;
      const previous = boxes[index - 1];
      if (box.top > previous.top) return true;
      return box.top === previous.top && box.left > previous.left;
    });
    const wrapperStyle = wrapper === null ? null : getComputedStyle(wrapper);
    const background = wrapperStyle === null ? "" : wrapperStyle.backgroundColor;
    const cardStyles = cards.map((card) => getComputedStyle(card));
    const link = wrapper === null ? null : wrapper.querySelector("a");
    const padding = (style) => [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].join(" ");
    return {
      id,
      listCount: wrapper === null ? 0 : wrapper.querySelectorAll("ul.uno-json-cards").length,
      itemCount: cards.length,
      trackCount: trackWidths.length,
      trackWidths,
      tracksPositive: trackWidths.length > 0 && trackWidths.every((width) => width > 0),
      tracksEqual: trackWidths.length > 0 && trackWidths.every((width) => Math.abs(width - trackWidths[0]) <= 1),
      rowOrder,
      distinctCells: new Set(boxes.map((box) => `${box.top}:${box.left}`)).size === boxes.length,
      metas: [...(list === null ? [] : list.querySelectorAll(":scope > li > p.uno-json-card-meta"))].map(
        (node) => node.textContent ?? "",
      ),
      titles: [...(list === null ? [] : list.querySelectorAll(":scope > li > h2, :scope > li > h3"))].map(
        (node) => node.textContent ?? "",
      ),
      bodies: [
        ...(list === null
          ? []
          : list.querySelectorAll(":scope > li > p.uno-json-card-body, :scope > li > div.uno-json-card-body")),
      ].map((node) => node.textContent ?? ""),
      borders: cardStyles.map((style) => Number.parseFloat(style.borderTopWidth) || 0),
      paddings: cardStyles.map(padding),
      surface: wrapper === null ? null : wrapper.getAttribute("data-uno-surface"),
      surfaceBackground: background,
      surfaceBorder: wrapperStyle === null ? 0 : Number.parseFloat(wrapperStyle.borderTopWidth) || 0,
      surfaceBorderWidth: wrapperStyle === null ? "" : wrapperStyle.borderTopWidth,
      surfacePadding: wrapperStyle === null ? "" : padding(wrapperStyle),
      surfacePaint: background !== "rgba(0, 0, 0, 0)" && background !== "transparent",
      linkCount: wrapper === null ? 0 : wrapper.querySelectorAll("a").length,
      linkHref: link === null ? "" : link.getAttribute("href") ?? "",
      linkRel: link === null ? "" : link.getAttribute("rel") ?? "",
      images: cards.map((card) => {
        const nodes = [...card.querySelectorAll("img")];
        const figure = nodes[0] ?? null;
        return {
          count: nodes.length,
          first: figure !== null && card.firstElementChild === figure,
          alt: figure === null ? null : figure.getAttribute("alt"),
          src: figure === null ? null : figure.getAttribute("src"),
          complete: figure instanceof HTMLImageElement ? figure.complete && figure.naturalWidth > 0 : false,
          naturalWidth: figure instanceof HTMLImageElement ? figure.naturalWidth : 0,
          naturalHeight: figure instanceof HTMLImageElement ? figure.naturalHeight : 0,
        };
      }),
      overflow:
        document.documentElement.scrollWidth > window.innerWidth + 1
        || (wrapper !== null && wrapper.scrollWidth > wrapper.clientWidth + 1),
    };
  });

  return { case: input.case, width: window.innerWidth, tokens: { surface: surfaceToken }, sections };
}


/**
 * Reach the one authored destination with the keyboard alone, then leave it again, without ever following it.
 *
 * Tab presses are bounded, every stop is recorded, and the walk stops as soon as the authored link holds focus. The final Tab
 * proves focus is not trapped on that anchor, and the caller compares the URL afterwards to prove nothing navigated.
 */
async function walkToAuthoredLink(page, expectedHref) {
  await page.evaluate(() => {
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
    window.scrollTo(0, 0);
  });
  const trace = [];
  let at = { reached: false, visible: false, href: "" };
  for (let press = 1; press <= 120; press += 1) {
    await page.keyboard.press("Tab");
    at = await page.evaluate((expected) => {
      const active = document.activeElement;
      const isLink = active instanceof HTMLAnchorElement;
      const href = isLink ? (active.getAttribute("href") ?? "") : "";
      return {
        reached: isLink && href === expected,
        visible: isLink && active.getBoundingClientRect().width > 0,
        href,
        at: isLink ? `A[${href}]` : active === null ? "none" : active.tagName,
      };
    }, expectedHref);
    if (trace.length < 6) trace.push(at.at);
    if (at.reached) break;
  }
  await page.keyboard.press("Tab");
  const departure = await page.evaluate((expected) => {
    const active = document.activeElement;
    return {
      left: !(active instanceof HTMLAnchorElement && active.getAttribute("href") === expected),
      url: window.location.href,
    };
  }, expectedHref);
  return { reached: at.reached, visible: at.visible, href: at.href, leftAfterTab: departure.left, pageUrlAfter: departure.url, trace };
}


/**
 * The one native Cards transaction: swap the test-owned fixture Page for the authored native document, prove it over real
 * production HTTP and Chromium, and restore the committed bytes in `finally` with a fresh original response.
 *
 * Both entrypoints execute **this** function — the focused `scripts/verify-u04-cards-native.mjs` and the mandatory U04 gate
 * transaction — so there is exactly one implementation of the proof and no second source of authority. When the caller already
 * owns a page (the gate), it is reused and left as the caller expects; when it does not (the focused entrypoint), a browser is
 * launched and closed here.
 */
export async function runNativeCardsTransaction({
  familyUrl,
  fixturePath,
  mediaRoot = resolve(process.cwd(), NATIVE_CARDS_MEDIA_ROOT),
  digestOf,
  check,
  tab = null,
  prefix = "U04_NATIVE_CARDS",
  originalMarker = NATIVE_CARDS_BEFORE_MARKER,
}) {
  const owned = tab === null;
  const { chromium } = owned ? await import("playwright") : { chromium: null };
  const browser = owned ? await chromium.launch() : null;
  const page = owned ? await browser.newPage() : tab;
  const original = readFileSync(fixturePath);
  const originalDigest = digestOf();
  // `UNO-WO-124 / R04`: the two synthetic plates are created exclusively into a `cards/` directory that must be absent, so the
  // served cards resolve real bytes for the first time — and the run can never reuse or delete an asset it did not create.
  const plates = installCardPlates(mediaRoot);

  const errors = [];
  const foreign = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(message.text());
  };
  const onPageError = (error) => errors.push(String(error));
  const onRequest = (request) => {
    const url = request.url();
    if (/^https?:\/\//u.test(url) && !/^https?:\/\/127\.0\.0\.1[:/]/u.test(url)) foreign.push(url);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("request", onRequest);

  let passed = 0;
  let failed = 0;
  const assert = (label, ok, detail = "") => {
    const result = check(label, ok, detail);
    if (result === true) passed += 1;
    else failed += 1;
    return result === true;
  };
  const restore = () => {
    writeFileSync(fixturePath, original);
    return digestOf() === originalDigest;
  };

  try {
    assert(
      `${prefix}_FIXTURE the two task-owned card plates were created exclusively in a previously absent cards/ directory, at their distinct authored sizes`,
      plates.absent === true
        && plates.installed.length === CARD_PLATES.length
        && CARD_PLATES.every(
          (plate, index) =>
            plates.installed[index]?.size.width === plate.size.width
            && plates.installed[index]?.size.height === plate.size.height
            && plates.installed[index]?.byteLength > PNG_SIGNATURE.length,
        ),
      `absent=${plates.absent} installed=${plates.installed
        .map((plate) => `${plate.name}:${plate.size.width}x${plate.size.height}:${plate.byteLength}`)
        .join(",")}`,
    );
    // `UNO-WO-124 / R05`: the original response is captured **before** the swap, so restoration is compared with the state the run
    // actually found rather than with a response taken after this run had already written its own document.
    const originalResponse = await fetch(`${familyUrl}?wo122r05=original`, { redirect: "manual" });
    // The authored JSON goes into the fixture zone exactly as an author would commit it: pretty-printed and deterministic.
    writeFileSync(fixturePath, `${JSON.stringify(NATIVE_CARDS_DOCUMENT, null, 2)}\n`, "utf8");
    const { readUnoPageDocument } = await import("../../src/core/page-document.ts");

    // (a) Production HTTP: four native sections, one list each, the authored column intents and surfaces, and no deferred
    // action markup anywhere. The response served *before* the swap was captured above, so the restoration in (f) can prove the
    // served status is unchanged and the fixture digest returns to the authored bytes.
    const response = await fetch(`${familyUrl}?wo122r05=native`, { redirect: "manual" });
    const html = response.status === 200 ? await response.text() : "";
    const facts = NATIVE_CARDS_IDS.map((id) => nativeCardsListOf(nativeCardsRegionOf(html, id)));
    assert(
      `${prefix}_HTTP the served native Page renders four cards sections, one native list each, with the authored column intents and surfaces`,
      response.status === 200
        && facts.every((entry, index) => entry.listCount === 1 && entry.itemCount === NATIVE_CARDS_EXPECTED.cards[index].length)
        && facts[0].columns === null
        && facts[1].columns === "4"
        && facts[2].columns === "2"
        && facts[3].columns === null
        && facts[0].surface === "muted"
        && facts[1].surface === "bordered"
        && facts[2].surface === "plain"
        && facts[3].surface === null
        && facts.every((entry) => entry.hasControls === false),
      `${response.status} ${facts.map((entry) => `${entry.itemCount}/${entry.columns}/${entry.surface}`).join(" ")}`,
    );


    // (b) The exact authored text and ownership, in section and card order, with every omission preserved as an omission.
    assert(
      `${prefix}_HTTP every card shows exactly its own authored meta, title and body, in order, and nothing where the document authored nothing`,
      facts.every((entry, index) => {
        const expected = NATIVE_CARDS_EXPECTED.cards[index] ?? [];
        return JSON.stringify(entry.metas) === JSON.stringify(expected.filter((card) => card.meta !== null).map((card) => card.meta))
          && JSON.stringify(entry.titles) === JSON.stringify(expected.map((card) => card.title))
          && JSON.stringify(entry.bodies) === JSON.stringify(expected.filter((card) => card.body !== null).map((card) => card.body));
      }),
      JSON.stringify(facts.map((entry) => [entry.metas.length, entry.titles.length, entry.bodies.length])),
    );

    // (c) One authored heading and the shared Markdown lede, and no invented heading where none was authored.
    const richRegion = nativeCardsRegionOf(html, NATIVE_CARDS_IDS[0]);
    assert(
      `${prefix}_HTTP the rich section serves its authored heading and Markdown lede, and the heading-less sections invent none`,
      facts[0].heading === NATIVE_CARDS_EXPECTED.heading
        && /<strong[^>]*>bounded<\/strong>/u.test(richRegion)
        && facts[1].heading === null
        && facts[3].heading === null
        && !html.includes(`${NATIVE_CARDS_IDS[1]}-heading`)
        && !html.includes(`${NATIVE_CARDS_IDS[3]}-heading`),
      `heading=${facts[0].heading} strong=${/<strong[^>]*>bounded<\/strong>/u.test(richRegion)} ${richRegion.length}`,
    );

    // (c2) `UNO-WO-124 / R04`: the two owned plates are actually delivered. Each image is read from its own card, its own authored
    // alternative is preserved (an explicitly decorative one is exactly empty), it is the card's first element, the omitted card
    // carries none, the third card repeats the first identity, and the served bytes — status, PNG MIME, exact fixture length and
    // intrinsic dimensions — are fetched over the same production HTTP the Page was served from.
    const cardImages = facts.map((entry) => entry.images);
    const shapeOk = NATIVE_CARDS_CARD_IMAGES.every(
      (expected, sectionIndex) =>
        expected.length === (cardImages[sectionIndex]?.length ?? 0)
        && expected.every((want, cardIndex) => {
          const got = cardImages[sectionIndex]?.[cardIndex];
          if (want === null) return got?.count === 0;
          return got?.count === 1
            && got.firstInItem === true
            && got.alt === want.alt
            && (got.className ?? "").split(/\s+/u).includes("uno-json-card-image")
            && typeof got.src === "string"
            && got.src.length > 0;
        }),
    );
    const primarySource = facts[0].images[0]?.src;
    const repeatSource = facts[0].images[2]?.src;
    const secondSource = facts[2].images[0]?.src;
    const fetched = [];
    for (const src of new Set([primarySource, repeatSource, secondSource])) {
      if (typeof src !== "string" || src.length === 0) continue;
      const asset = await fetch(new URL(src, familyUrl), { redirect: "manual" });
      const bytes = Buffer.from(await asset.arrayBuffer());
      fetched.push({
        src,
        status: asset.status,
        type: asset.headers.get("content-type") ?? "",
        bytes,
        byteLength: bytes.length,
        width: bytes.length > 24 ? bytes.readUInt32BE(16) : 0,
        height: bytes.length > 24 ? bytes.readUInt32BE(20) : 0,
      });
    }
    const servedOk = (src, key) => {
      const got = fetched.find((entry) => entry.src === src);
      const installed = plates.installed.find((entry) => entry.key === key);
      return got !== undefined
        && installed !== undefined
        && got.status === 200
        && got.type.toLowerCase().startsWith("image/png")
        // `UNO-WO-124 / R05`: actual byte equality against the installed file, never a length-only comparison.
        && got.bytes.equals(readFileSync(installed.path))
        && got.bytes.length > PNG_SIGNATURE.length
        && got.width === installed.size.width
        && got.height === installed.size.height;
    };
    // The media route namespaces a served locator by Page **occurrence**, so two cards authoring the same identity are served two
    // distinct locators over identical bytes. Repetition is therefore proved by byte and dimension equality across the two cards,
    // and the second identity by the opposite of that comparison — never by string equality of URLs, which would prove nothing.
    const sameFixture = (left, right) => {
      const a = fetched.find((entry) => entry.src === left);
      const b = fetched.find((entry) => entry.src === right);
      return a !== undefined
        && b !== undefined
        && a.status === 200
        && b.status === 200
        && a.byteLength === b.byteLength
        && a.width === b.width
        && a.height === b.height;
    };
    assert(
      `${prefix}_IMAGES both owned plates are delivered: exact per-card locator, authored and exactly-empty alternatives, image-first order, none on the omitted card, the same fixture delivered twice for the repeated occurrence, and HTTP 200 image/png with the exact fixture bytes and intrinsic dimensions`,
      shapeOk
        // `UNO-WO-124 / R05`: only an authoritative locator on the Page's own origin may be fetched, and the media route must hand
        // each occurrence its own locator — proven here rather than assumed, before any bytes are requested.
        && [primarySource, repeatSource, secondSource].every(
          (src) => typeof src === "string" && src.length > 0 && new URL(src, familyUrl).origin === new URL(familyUrl).origin,
        )
        && primarySource !== repeatSource
        && primarySource !== secondSource
        && repeatSource !== secondSource
        && servedOk(primarySource, "plate")
        && servedOk(repeatSource, "plate")
        && servedOk(secondSource, "altPlate")
        && sameFixture(primarySource, repeatSource)
        && !sameFixture(primarySource, secondSource),
      JSON.stringify({
        shapeOk,
        primarySource,
        repeatSource,
        repeated: sameFixture(primarySource, repeatSource),
        distinct: !sameFixture(primarySource, secondSource),
        fetched,
        installed: plates.installed.map((plate) => `${plate.name}:${plate.byteLength}:${plate.size.width}x${plate.size.height}`),
        alts: cardImages.map((entry) => entry.map((image) => image.alt)),
      }),
    );

    const refusals = NATIVE_CARDS_REFUSALS.map((probe) => {
      const outcome = readUnoPageDocument(JSON.stringify(probe.mutate()));
      return { label: probe.label, expected: probe.expected, actual: outcome.accepted ? "accepted" : outcome.reason };
    });
    assert(
      `${prefix}_REFUSALS all ${NATIVE_CARDS_REFUSALS.length} native Cards probes refuse the whole Page with the closed reason their shape earns`,
      refusals.every((entry) => entry.actual === entry.expected),
      JSON.stringify(refusals.filter((entry) => entry.actual !== entry.expected)),
    );
    const accepted = NATIVE_CARDS_ACCEPTED.map((probe) => ({
      label: probe.label,
      accepted: readUnoPageDocument(JSON.stringify(probe.document())).accepted,
    }));
    assert(
      `${prefix}_BOUNDS the native reader accepts one, eight, nine and twenty-four cards, the donor's exact field bounds and supplementary characters`,
      accepted.every((entry) => entry.accepted === true),
      JSON.stringify(accepted.filter((entry) => entry.accepted !== true)),
    );

    // (e) Chromium at 390, 768 and 1280.
    for (const testCase of NATIVE_CARDS_CASES) {
      await page.setViewportSize({ width: testCase.width, height: 900 });
      await page.emulateMedia({ colorScheme: testCase.scheme, reducedMotion: testCase.motion });
      const errorsBefore = errors.length;
      const foreignBefore = foreign.length;
      await page.goto(`${familyUrl}?wo122r04=${testCase.key}`, { waitUntil: "networkidle" });
      const reading = await page.evaluate(readNativeCardsCase, { case: testCase.key, ids: [...NATIVE_CARDS_IDS] });
      const urlBefore = page.url();
      const keyboard = await walkToAuthoredLink(page, NATIVE_CARDS_LINK_HREF);
      reading.keyboard = {
        reached: keyboard.reached,
        visible: keyboard.visible,
        leftAfterTab: keyboard.leftAfterTab,
        samePage: page.url() === urlBefore,
      };
      reading.foreignRequests = foreign.length - foreignBefore;
      reading.errors = errors.length - errorsBefore;
      const verdict = nativeCardsCaseVerdict(reading, testCase);
      assert(
        `${prefix}_BROWSER ${testCase.key} the native Page resolves the authored tracks, keeps row order, owns every card's text, border, padding and surface, and reaches then leaves its safe link by keyboard`,
        verdict.ok,
        verdict.detail,
      );
    }

    // (f) Restore now, and prove a fresh response serves the original document again — its own content marker present when the
    // caller knows one, none of the temporary anchors left behind, and the same status — so restoration is proven by content and
    // bytes, never inferred from a status code alone.
    const restoredNow = restore();
    const fresh = await fetch(`${familyUrl}?wo122r05=restored`, { redirect: "manual" });
    const freshHtml = fresh.status === 200 ? await fresh.text() : "";
    assert(
      `${prefix}_RESTORE the fixture bytes are restored, the digest matches, and a fresh response serves the original document with none of the temporary anchors`,
      restoredNow
        && fresh.status === originalResponse.status
        && (originalMarker === null || freshHtml.includes(originalMarker))
        && NATIVE_CARDS_IDS.every((id) => !freshHtml.includes(`id="${id}"`)),
      `digest=${restoredNow} status=${fresh.status}/${originalResponse.status} marker=${originalMarker === null ? "n/a" : freshHtml.includes(originalMarker)} fresh=${freshHtml.length}`,
    );

    // The two task-owned files and their directory are removed, so the capsule zone is exactly as it was found — proven by a
    // readback of the zone, never inferred from the delete calls having been made.
    const cleared = removeCardPlates(plates);
    assert(
      `${prefix}_CLEANUP the task-owned card plates and their cards/ directory are removed and the capsule zone is exactly as it was found`,
      cleared === true,
      `cleared=${cleared} directory=${existsSync(plates.directory)}`,
    );
  } finally {
    restore();
    removeCardPlates(plates);
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("request", onRequest);
    if (browser !== null) await browser.close();
  }

  return { passed, failed };
}

