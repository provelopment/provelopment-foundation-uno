/**
 * Foundation Uno — the bounded 22-module and four-provider consent gate (`UNO-WO-044 / R01`).
 *
 * WHAT THIS IS. One end-to-end proof, over the real Next.js production build and a real Chromium browser, that a
 * temporarily published version-1 JSON Page can carry all twenty-two registered module IDs at once, and that the four
 * governed external `media.video` providers load nothing at all until the Visitor explicitly consents.
 *
 * WHAT THIS IS NOT. It is not provider playback. No third-party network call is ever permitted: every non-loopback
 * request is aborted before navigation and the iframe response is a local stub. It does not prove the four-zone
 * owned-media refusal matrix, native video/range/VTT, or the full viewport matrix — those remain outstanding.
 *
 * FAIL-CLOSED. A refused fixture, an unclean build, a missing browser, a pre-consent provider request, a failed
 * assertion or an unproven restoration fails this gate. Nothing here can pass on a stale build.
 *
 * `UNO-WO-066 / R01` adds one further ephemeral proof inside this same lifecycle: a donor subset is composed
 * by the real, unmodified `composeUnoFoundationSubset`, installed as a fifth temporary fixture source, and then accepted
 * by the confined loader, the serving planner, real production HTTP and Chromium. It is a test fixture at a loopback
 * server — not a durable Page, not a deployment and not publication authority — and it is removed in the same `finally`.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { deflateSync } from "node:zlib";

import { prepareUnoU03FixtureTransaction } from "./uno-u03-fixture-transaction.mjs";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/iu.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        return nextResolve(specifier, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 120_000;
const BUILD_TIMEOUT_MS = 600_000;
const ROOT = process.cwd();
const CONTENT = "deployment/efs/content";
const MANIFEST = "deployment/efs/manifest.json";
const SELECTION = "deployment/uno.config.json";
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const ALL_ROUTE = ["wo044-all-modules"];
const INVALID_ROUTE = ["wo044-invalid"];
/** `UNO-WO-053 / R01`: a separately published Page whose generated asset carries a well-formed but wrong digest. */
const BAD_ROUTE = ["wo053-bad-generated"];
/** `UNO-WO-066 / R01`: one temporary Page whose document is produced by the real family adapter, never authored here. */
const FAMILY_ROUTE = ["wo066-family-composition"];
/** The one Page-owned plate the composed Page references; generated, published and deleted only inside this gate. */
const FAMILY_PLATE = "wo066-family-plate.png";
/** The donor migration identity the composed source names. It is a binding key, never an emitted or served URL. */
const FAMILY_DONOR_SOURCE = "/assets/wo066-donor-plate.png";

/** `UNO-WO-052 / R01`: the exclusive `wo052-*` ledger of named original synthetic inputs across four owned zones. */
const THEME_DIR = "deployment/content/assets";
const PLATFORM_DIR = "public/platform";
const GENERATED_DIR = "public/_uno-generated";
const MEDIA = Object.freeze({
  page: "wo052-page.png",
  theme: "wo052-theme.png",
  platform: "wo052-platform.png",
  generated: "wo052-generated.png",
  mp4: "wo052-native.mp4",
  captions: "wo052-native.vtt",
  webm: "wo053-native.webm",
  poster: "wo052-native-poster.png",
});

/** One bounded `ftyp` MP4 transport box: original bytes, transport MIME/signature only, never a decodability claim. */
function mp4Bytes() {
  return Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, 0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
    0x69, 0x73, 0x6f, 0x35,
  ]);
}

/** One original EBML/WebM transport header: correct signature and DocType, never a decodability claim. */
function webmBytes() {
  return Buffer.from("1a45dfa39f4282867765626d4287810142858102", "hex");
}

/** One original UTF-8 WebVTT track with a single sane cue. */
function vttBytes() {
  return Buffer.from("WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nSynthetic transport cue.\n", "utf8");
}

/** Every test-owned media file this run created, with the exact bytes written. */
const createdMedia = new Map();

/**
 * Create one test-owned fixture with exclusive semantics, so the gate can never proceed on an overwritten Owner file or a
 * partially written plate: a pre-existing path or a digest mismatch on read-back refuses immediately.
 */
function createMedia(relativePath, bytes) {
  const absolute = resolve(ROOT, relativePath);
  if (existsSync(absolute)) throw new Error(`the fixture path ${relativePath} already exists`);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes, { flag: "wx" });
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (createHash("sha256").update(readFileSync(absolute)).digest("hex") !== digest) {
    throw new Error(`the fixture path ${relativePath} did not keep its bytes`);
  }
  createdMedia.set(relativePath, bytes);
  return bytes;
}

/** The committed declaration digests this gate requires before it will touch anything. */
const PINNED_DECLARATIONS = new Map([
  [MANIFEST, "ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0"],
  [SELECTION, "4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c"],
]);

const SOURCES = Object.freeze([
  `${CONTENT}/wo044-home.en-001.json`,
  `${CONTENT}/wo044-all-modules.en-001.json`,
  `${CONTENT}/wo044-invalid.en-001.json`,
  `${CONTENT}/wo053-bad-generated.en-001.json`,
  `${CONTENT}/wo066-family-composition.en-001.json`,
]);

const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) {
    passes.push(name);
    process.stdout.write(`  PASS  ${name}\n`);
    return true;
  }
  failures.push({ name, detail });
  process.stdout.write(`  FAIL  ${name}${detail ? ` - ${detail}` : ""}\n`);
  return false;
}

function sha256Of(relativePath) {
  return createHash("sha256")
    .update(readFileSync(resolve(ROOT, relativePath)))
    .digest("hex");
}

const section = (id, module, props, children) => {
  const node = { id, module, props };
  if (children !== undefined) node.children = children;
  return node;
};
const leaf = (id) => section(id, "content.prose", { text: `Body ${id}.` });
const plate = (path) => ({ zone: "page", path });

/** The Page-owned zone root: `deployment/efs/capsule/<entity>/<facet>/<site>/`. */
const CAPSULE_DIR = `deployment/efs/capsule/${ENTITY_ID}/foundation/main`;
const CAPSULE_FILES = Object.freeze([
  "wo044-plate.png",
  "wo044-gallery-a.png",
  "wo044-gallery-b.png",
  "wo044-carousel-a.png",
  "wo044-carousel-b.png",
  FAMILY_PLATE,
]);

function crc32(buffer) {
  const table = [];
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buffer) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** One original, rights-cleared synthetic RGB plate: no third-party artwork, generated here from nothing. */
function pngBytes(width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let row = 0; row < height; row += 1) {
    const offset = row * (1 + width * 3);
    for (let column = 0; column < width; column += 1) {
      raw[offset + 1 + column * 3] = 0x2a;
      raw[offset + 2 + column * 3] = 0x5c;
      raw[offset + 3 + column * 3] = 0x8a;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * The fixture Page: every one of the twenty-two registered module IDs, authored with published props only, plus the
 * three further external video instances needed to reach all four governed providers.
 */
function allModulesDocument(generatedIntegrity) {
  return {
    version: 1,
    title: "All modules - consent proof",
    description: "A bounded fixture Page carrying every registered module.",
    visibility: "public",
    sections: [
      section("wo044-heading", "content.heading", { text: "Every module, once", level: 2 }),
      section("wo044-stack", "layout.stack", { gap: "wide" }, [leaf("wo044-stack-one"), leaf("wo044-stack-two")]),
      section("wo044-grid", "layout.grid", { columns: 2, itemSemantics: "article" }, [
        section("wo044-grid-a", "layout.stack", { gap: "tight" }, [leaf("wo044-grid-a-body")]),
        section("wo044-grid-b", "layout.stack", {}, [leaf("wo044-grid-b-body")]),
      ]),
      section("wo044-bento", "layout.bento", {
        columns: 3,
        tiles: [
          { sectionId: "wo044-tile-one", span: "feature" },
          { sectionId: "wo044-tile-two", span: "wide" },
          { sectionId: "wo044-tile-three", span: "standard" },
        ],
      }, [leaf("wo044-tile-one"), leaf("wo044-tile-two"), leaf("wo044-tile-three")]),
      section("wo044-layers", "layout.layers", { mode: "overlap", align: "center" }, [
        leaf("wo044-layer-one"),
        leaf("wo044-layer-two"),
      ]),
      section("wo044-prose", "content.prose", { text: "A bounded paragraph." }),
      section("wo044-actions", "content.actions", { items: [{ label: "Read the heading", targetId: "wo044-heading" }] }),
      section("wo044-hero", "content.hero", {
        eyebrow: "Fixture",
        lede: "A bounded lede.",
        support: "A bounded support line.",
        align: "center",
        surface: "muted",
        actions: [{ label: "Read the heading", targetId: "wo044-heading" }],
      }),
      section("wo044-stats", "content.stats", {
        heading: "Figures",
        level: 2,
        surface: "bordered",
        items: [{ value: "22", label: "Module IDs" }, { value: "4", label: "Providers" }],
      }),
      section("wo044-testimonials", "content.testimonials", {
        align: "start",
        items: [{ quote: "A bounded quotation.", attribution: "Contributor A", role: "Reviewer" }],
      }),
      section("wo044-pricing", "content.pricing", {
        heading: "Programme tiers",
        level: 2,
        surface: "muted",
        items: [{ label: "One", amount: "1", featured: true }, { label: "Two", amount: "2" }],
      }),
      section("wo044-timeline", "content.timeline", {
        heading: "Programme timeline",
        level: 2,
        surface: "muted",
        items: [
          { title: "Contract baseline", dateLabel: "Phase 1", status: "complete", description: "Accepted." },
          { title: "Module slice", dateLabel: "Phase 2", status: "current" },
        ],
      }),
      section("wo044-image", "media.image", { asset: plate("wo044-plate.png"), alt: "A synthetic plate" }),
      section("wo044-gallery", "media.gallery", {
        columns: 2,
        items: [
          { asset: plate("wo044-gallery-a.png"), alt: "Gallery A" },
          { asset: plate("wo044-gallery-b.png"), alt: "Gallery B" },
        ],
      }),
      section("wo044-carousel", "media.carousel", {
        label: "Work",
        items: [
          { asset: plate("wo044-carousel-a.png"), alt: "Carousel A" },
          { asset: plate("wo044-carousel-b.png"), alt: "Carousel B" },
        ],
      }),
      section("wo044-watermark", "design.watermark", { text: "Draft", align: "end", strength: "regular" }),
      section("wo044-motion", "design.motion", { effect: "fade" }, [leaf("wo044-motion-body")]),
      section("wo044-tabs", "interaction.tabs", {
        label: "Sections",
        tabs: [{ sectionId: "wo044-tab-a", label: "A" }, { sectionId: "wo044-tab-b", label: "B" }],
      }, [leaf("wo044-tab-a"), leaf("wo044-tab-b")]),
      section("wo044-accordion", "interaction.accordion", {
        items: [{ sectionId: "wo044-fold-a", label: "Alpha" }, { sectionId: "wo044-fold-b", label: "Beta" }],
      }, [leaf("wo044-fold-a"), leaf("wo044-fold-b")]),
      section("wo044-modal", "interaction.modal", { triggerLabel: "Open details", title: "Details", closeLabel: "Close" }, [
        leaf("wo044-modal-body"),
      ]),
      section("wo044-contact", "interaction.contact", {
        heading: "Contact",
        fields: ["name", "email", "message"],
        submitLabel: "Send",
      }),
      // The governed external `media.video` instances: one per provider, consent-gated, never auto-loaded.
      section("wo044-video-youtube", "media.video", {
        source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "A YouTube clip",
      }),
      section("wo044-video-vimeo", "media.video", {
        source: "external", provider: "vimeo", videoId: "76979871", title: "A Vimeo clip",
      }),
      section("wo044-video-rumble", "media.video", {
        source: "external", provider: "rumble", videoId: "v17j3tt", title: "A Rumble clip",
      }),
      section("wo044-video-bitchute", "media.video", {
        source: "external", provider: "bitchute", videoId: "aB_9-hXyZ", title: "A BitChute clip",
      }),
      // `UNO-WO-052 / R01`: one named occurrence per owned zone plus one native MP4 transport carrying its own VTT and
      // poster. The generated zone is the discriminator: its `integrity` must reach the installed bytes verbatim.
      section("wo052-page-image", "media.image", { asset: plate(MEDIA.page), alt: "A synthetic Page plate" }),
      section("wo052-theme-image", "media.image", {
        asset: { zone: "theme", path: MEDIA.theme },
        alt: "A synthetic theme-zone plate",
      }),
      section("wo052-platform-image", "media.image", {
        asset: { zone: "platform", path: MEDIA.platform },
        alt: "A synthetic platform-zone plate",
      }),
      section("wo052-generated-image", "media.image", {
        asset: { zone: "generated", path: MEDIA.generated, integrity: generatedIntegrity },
        alt: "A synthetic generated-zone plate",
      }),
      section("wo052-native-mp4", "media.video", {
        asset: { zone: "page", path: MEDIA.mp4 },
        captions: { zone: "page", path: MEDIA.captions },
        poster: { zone: "page", path: MEDIA.poster },
        title: "Synthetic MP4 transport",
      }),
      // `UNO-WO-053 / R01`: the second native container on the same Page, sharing the VTT and poster fixtures so their
      // occurrence numbers must differ per section.
      section("wo053-native-webm", "media.video", {
        asset: { zone: "page", path: MEDIA.webm },
        captions: { zone: "page", path: MEDIA.captions },
        poster: { zone: "page", path: MEDIA.poster },
        title: "WebM transport fixture",
      }),
    ],
  };
}

/**
 * `UNO-WO-066 / R01`: one deterministic donor-shaped source, in the exact order this proof depends on. Every string is
 * original synthetic test copy; no donor text, asset or code is reproduced. The adapter — not this file — decides the
 * resulting Uno ids, modules and props.
 */
function familySource() {
  return {
    version: 1,
    title: "Bounded family composition proof",
    sections: [
      { type: "prose", body: "This Page came from a bounded donor subset." },
      { type: "callout", body: "A synthetic warning for the publication proof.", tone: "warning" },
      { type: "list", ordered: true, items: ["Prepare", "Publish"] },
      {
        type: "faq",
        items: [{ question: "Can this contact notice send anything?", answer: "No. Delivery is off." }],
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
      {
        type: "hero",
        eyebrow: "Synthetic introduction",
        lede: "The composed Page is visible.",
        support: "This is a bounded, original fixture example.",
        align: "center",
        surface: "muted",
      },
      {
        type: "stats",
        items: [
          { value: "13", label: "Sampled sections", detail: "Fixture only" },
          { value: "4", label: "New examples" },
        ],
      },
      {
        type: "steps",
        surface: "muted",
        items: [
          { title: "Draft", body: "Prepare the fixture source." },
          { title: "Review" },
        ],
      },
      {
        type: "quote",
        body: "The fixture does not establish full parity.",
        attribution: "Synthetic contributor",
        role: "Reviewer",
        align: "center",
        surface: "bordered",
      },
      // `UNO-WO-068 / R03`: appended after the unchanged thirteen; still donor-shaped input to the real adapter.
      {
        type: "table",
        columns: ["Phase", "Count"],
        rows: [["First", "1"], ["Second", "2"]],
        caption: "Synthetic table",
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
        columns: 2,
        items: [
          { title: "Card one", body: "First card body." },
          { title: "Card two" },
        ],
      },
      {
        type: "features",
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
 * The separate migration binding for that source: one owned Page plate for the single donor image identity, and one
 * exact `delivery-off` acknowledgement. Neither key is publication, asset-servability or delivery authority.
 */
function familyBindings() {
  return {
    images: [{ source: FAMILY_DONOR_SOURCE, owned: plate(FAMILY_PLATE) }],
    contactForms: [{ formRef: "wo066-contact", mode: "delivery-off" }],
  };
}

/** The exact top-level ids the unchanged adapter must produce for the fixture above, in document order. */
const FAMILY_IDS = Object.freeze([
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

/** Recursively frozen: an accepted Page must not be rewritten after composition. */
function deepFrozen(value) {
  if (value === null || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value).every((entry) => deepFrozen(entry));
}

/** The selected Site's Home Page: a minimal published JSON representation, so the Site has its required anchor. */
function homeDocument() {
  return {
    version: 1,
    title: "Fixture home",
    visibility: "public",
    sections: [section("wo044-home-body", "content.prose", { text: "The fixture home representation." })],
  };
}

/** One genuinely refused Page: an unregistered module ID. It must 404 rather than rescue to Markdown. */
function invalidDocument() {
  return {
    version: 1,
    title: "Unknown module",
    sections: [section("wo044-unknown", "layout.unknown", {})],
  };
}

const representation = (locale, sources) => ({ locale, sources });
const jsonSource = (path) => ({ kind: "json", path });

/** One Entity, the selected Site, and the two test-only Pages this gate publishes. */
function fixtureManifest() {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: "foundation",
            sites: [
              {
                id: "main",
                locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
                pages: [
                  {
                    id: "home",
                    route: ["home"],
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(SOURCES[0])])],
                  },
                  {
                    id: "all-modules",
                    route: ALL_ROUTE,
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(SOURCES[1])])],
                  },
                  {
                    id: "invalid",
                    route: INVALID_ROUTE,
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(SOURCES[2])])],
                  },
                  {
                    id: "bad-generated",
                    route: BAD_ROUTE,
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(SOURCES[3])])],
                  },
                  {
                    id: "family-composition",
                    route: FAMILY_ROUTE,
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(SOURCES[4])])],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function fixtureSelection() {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
    languagePreferences: { en: "en-001" },
    base: { canonical: "http://localhost:3000", aliases: [] },
  };
}

function fixturePlan(allModulesJsonBytes, badJsonBytes, familyJsonBytes) {
  return {
    declarations: [MANIFEST, SELECTION].map((path) => ({ path, digest: PINNED_DECLARATIONS.get(path) })),
    replacements: [
      { path: MANIFEST, bytes: Buffer.from(`${JSON.stringify(fixtureManifest(), null, 2)}\n`, "utf8") },
      { path: SELECTION, bytes: Buffer.from(`${JSON.stringify(fixtureSelection(), null, 2)}\n`, "utf8") },
    ],
    fixtureSources: [
      { path: SOURCES[0], bytes: Buffer.from(`${JSON.stringify(homeDocument(), null, 2)}\n`, "utf8") },
      { path: SOURCES[1], bytes: allModulesJsonBytes },
      { path: SOURCES[2], bytes: Buffer.from(`${JSON.stringify(invalidDocument(), null, 2)}\n`, "utf8") },
      { path: SOURCES[3], bytes: badJsonBytes },
      { path: SOURCES[4], bytes: familyJsonBytes },
    ],
  };
}


function nextBinPath() {
  for (const candidate of [resolve(ROOT, "node_modules/next/dist/bin/next"), resolve(ROOT, "node_modules/next/dist/bin/next.js")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function freeLoopbackPort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.once("error", rejectPort);
    server.listen(0, HOST, () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

function runChild(args, timeoutMs) {
  return new Promise((resolveRun) => {
    const childProcess = spawn(process.execPath, args, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
      windowsHide: true,
    });
    let output = "";
    const timer = setTimeout(() => childProcess.kill("SIGKILL"), timeoutMs);
    childProcess.stdout.on("data", (chunk) => { output += chunk.toString(); });
    childProcess.stderr.on("data", (chunk) => { output += chunk.toString(); });
    childProcess.on("close", (code) => { clearTimeout(timer); resolveRun({ code, output }); });
  });
}

/** `UNO-WO-053 / R01` Phase A: exact-bytes transport helpers, all driven by the served occurrence ledger. */
const asBytes = async (response) => Buffer.from(await response.arrayBuffer());

function oneOccurrence(assets, sectionId, slot) {
  const matches = assets.occurrences.filter((item) => item.sectionId === sectionId && item.slot === slot);
  if (matches.length !== 1) throw new Error(`ambiguous occurrence: ${sectionId}/${slot}`);
  return matches[0];
}

async function expectOwnedGetHead(base, item, expected, label, html) {
  const url = `${base}${item.url}`;
  const response = await fetch(url);
  const bytes = await asBytes(response);
  const head = await fetch(url, { method: "HEAD" });
  const headBytes = await asBytes(head);
  const isVideo = expected.mime === "video/mp4" || expected.mime === "video/webm";
  const facts = {
    status: `${response.status}/${head.status}`,
    body: bytes.equals(expected.bytes),
    headEmpty: headBytes.length === 0,
    mime: `${response.headers.get("content-type")}/${head.headers.get("content-type")}`,
    nosniff: `${response.headers.get("x-content-type-options")}/${head.headers.get("x-content-type-options")}`,
    length: `${response.headers.get("content-length")}/${head.headers.get("content-length")}/${bytes.length}`,    ranges: `${response.headers.get("accept-ranges")}/${head.headers.get("accept-ranges")}`,
    inHtml: html.includes(item.url),
    url: item.url,
  };
  const ok = response.status === 200 && head.status === 200
    && facts.body && facts.headEmpty
    && response.headers.get("content-type") === expected.mime
    && head.headers.get("content-type") === expected.mime
    && response.headers.get("x-content-type-options") === "nosniff"
    && head.headers.get("x-content-type-options") === "nosniff"
    && (response.headers.get("content-length") === null || response.headers.get("content-length") === String(bytes.length))
    && (head.headers.get("content-length") === null || head.headers.get("content-length") === String(bytes.length))
    && response.headers.get("accept-ranges") === (isVideo ? "bytes" : null)
    && head.headers.get("accept-ranges") === (isVideo ? "bytes" : null)
    && facts.inHtml;
  check(`${label} GET/HEAD 200 MIME exact bytes and advertised HTML`, ok, JSON.stringify(facts));
  return { url, ok, total: bytes.length };
}

async function expectVideoRanges(url, bytes, label) {
  const total = bytes.length;
  const positive = [["bytes=0-3", 0, 3], ["bytes=4-", 4, total - 1], ["bytes=-4", total - 4, total - 1]];
  for (const [header, start, end] of positive) {
    const response = await fetch(url, { headers: { range: header } });
    const got = await asBytes(response);
    check(`${label} 206 ${header}`,
      response.status === 206 && got.equals(bytes.subarray(start, end + 1))
      && response.headers.get("content-range") === `bytes ${start}-${end}/${total}`
      && (response.headers.get("content-length") === null || response.headers.get("content-length") === String(end - start + 1))
      && response.headers.get("accept-ranges") === "bytes",
      `${response.status} ${got.length}/${end - start + 1} body=${got.equals(bytes.subarray(start, end + 1))} cr=${response.headers.get("content-range")} len=${response.headers.get("content-length")} ar=${response.headers.get("accept-ranges")}`);
  }
  for (const header of ["bytes=3-1", "bytes=-0", "bytes=99999-", "bytes=0-1,3-4"]) {
    const response = await fetch(url, { headers: { range: header } });
    const got = await asBytes(response);
    check(`${label} 416 ${header}`,
      response.status === 416 && got.length === 0
      && response.headers.get("content-range") === `bytes */${total}`
      && response.headers.get("accept-ranges") === "bytes",
      `${response.status} ${got.length} bytes`);
  }
  const noValidator = await fetch(url, { headers: { range: "bytes=0-3", "if-range": '"no-validator"' } });
  const full = await asBytes(noValidator);
  check(`${label} If-Range ignored without published validator`,
    noValidator.status === 200 && full.equals(bytes), `${noValidator.status}/${full.length}`);
  const headRange = await fetch(url, { method: "HEAD", headers: { range: "bytes=0-3" } });
  check(`${label} ranged HEAD remains full HEAD`, headRange.status === 200
    && (await asBytes(headRange)).length === 0
    && (headRange.headers.get("content-length") === null || headRange.headers.get("content-length") === String(total)),
    `${headRange.status} len=${headRange.headers.get("content-length")}/${total} ar=${headRange.headers.get("accept-ranges")}`);
}

async function expectClosed404(url, label, init = {}) {
  const response = await fetch(url, init);
  const body = await asBytes(response);
  check(`${label} 404 no bytes/no disclosure`,
    response.status === 404 && body.length === 0
    && response.headers.get("content-range") === null
    && response.headers.get("accept-ranges") === null,
    `${response.status} ${body.length} bytes`);
}

async function waitForServer(base, childProcess) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (childProcess.exitCode !== null) return false;
    try {
      const response = await fetch(`${base}/en-001/wo044-all-modules`, { redirect: "manual" });
      if (response.status > 0) return true;
    } catch {
      await delay(250);
    }
  }
  return false;
}

const PROVIDER_CASES = Object.freeze([
  { provider: "youtube", videoId: "dQw4w9WgXcQ" },
  { provider: "vimeo", videoId: "76979871" },
  { provider: "rumble", videoId: "v17j3tt" },
  { provider: "bitchute", videoId: "aB_9-hXyZ" },
]);

const PROVIDER_REQUEST = /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtube-nocookie\.com|vimeo\.com|rumble\.com|bitchute\.com)\//iu;

let transaction = null;
let child = null;
let browser = null;

async function main() {
  const nextBin = nextBinPath();
  if (!check("the pinned local Next.js CLI is present", nextBin !== null)) return 1;

  for (const [path, digest] of PINNED_DECLARATIONS) {
    if (!check(`${path} matches its pinned digest before the fixture`, sha256Of(path) === digest, sha256Of(path))) return 1;
  }
  const staged = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: ROOT, encoding: "utf8" });
  if (!check("nothing is staged before the fixture", (staged.stdout ?? "").trim() === "", (staged.stdout ?? "").trim())) return 1;
  for (const path of SOURCES) {
    if (!check(`the fixture source ${path} is absent`, !existsSync(resolve(ROOT, path)))) return 1;
  }
  for (const name of CAPSULE_FILES) {
    if (!check(`the Page-owned plate ${name} is absent before the gate`, !existsSync(resolve(ROOT, CAPSULE_DIR, name)))) return 1;
  }
  mkdirSync(resolve(ROOT, CAPSULE_DIR), { recursive: true });
  for (const name of CAPSULE_FILES) {
    writeFileSync(resolve(ROOT, CAPSULE_DIR, name), pngBytes(64, 64));
  }
  const plateBytes = readFileSync(resolve(ROOT, CAPSULE_DIR, CAPSULE_FILES[0]));
  check("the generated plate is a real PNG with the right signature", plateBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
  check("the generated plate declares 64x64 dimensions", plateBytes.readUInt32BE(16) === 64 && plateBytes.readUInt32BE(20) === 64);

  const { readUnoPageDocument, UNO_RENDERABLE_MODULES } = await import("../src/core/page-document.ts");
  // `UNO-WO-052 / R01` §2: the seven named synthetic inputs, created exclusively and digest-verified on read-back, then
  // ONE authored JSON buffer used for validation, installation, loader parity and serving. No second producer call.
  const generatedBytes = createMedia(`${GENERATED_DIR}/${MEDIA.generated}`, pngBytes(64, 64));
  createMedia(`${THEME_DIR}/${MEDIA.theme}`, pngBytes(64, 64));
  createMedia(`${PLATFORM_DIR}/${MEDIA.platform}`, pngBytes(32, 32));
  createMedia(`${CAPSULE_DIR}/${MEDIA.page}`, pngBytes(48, 48));
  createMedia(`${CAPSULE_DIR}/${MEDIA.mp4}`, mp4Bytes());
  createMedia(`${CAPSULE_DIR}/${MEDIA.webm}`, webmBytes());
  createMedia(`${CAPSULE_DIR}/${MEDIA.captions}`, vttBytes());
  createMedia(`${CAPSULE_DIR}/${MEDIA.poster}`, pngBytes(8, 8));
  const generatedIntegrity = createHash("sha256").update(generatedBytes).digest("hex");
  const allModulesJsonBytes = Buffer.from(`${JSON.stringify(allModulesDocument(generatedIntegrity), null, 2)}\n`, "utf8");
  check("INSTALL_BYTES_WITHIN_BOUND", allModulesJsonBytes.length <= 64 * 1024, String(allModulesJsonBytes.length));
  const parsedExact = readUnoPageDocument(allModulesJsonBytes.toString("utf8"), { reservedHome: false });
  check("INSTALL_DOCUMENT_ACCEPTED", parsedExact.accepted === true, parsedExact.accepted ? "" : String(parsedExact.reason));
  check(
    "INSTALL_DOCUMENT_HAS_DIGEST",
    allModulesJsonBytes.toString("utf8").includes(`"integrity": "${generatedIntegrity}"`),
    generatedIntegrity.slice(0, 12),
  );
  const accepted = parsedExact;
  check("the authored fixture Page is accepted by the real validator", accepted.accepted === true, accepted.reason ?? "");
  if (accepted.accepted) {
    const present = new Set();
    const walk = (node) => {
      present.add(node.module);
      for (const childNode of node.children ?? []) walk(childNode);
    };
    for (const node of accepted.document.sections) walk(node);
    const missing = UNO_RENDERABLE_MODULES.filter((id) => !present.has(id));
    check(`the fixture carries all ${UNO_RENDERABLE_MODULES.length} registered module IDs`, missing.length === 0, missing.join(","));
    check("the fixture carries exactly twenty-two distinct IDs", present.size === 22, String(present.size));
  }
  const refused = readUnoPageDocument(invalidDocument());
  check("an unregistered module ID refuses the whole Page", refused.accepted === false, "accepted");

  // `UNO-WO-053 / R01` §3: the wrong-digest Page is the authored text with only that one integrity replaced, so its
  // syntax is guaranteed valid and the sole difference is the digest the owned-media reader must refuse.
  const forgedIntegrity = "0".repeat(64);
  const badJsonBytes = Buffer.from(
    allModulesJsonBytes.toString("utf8").replace(`"integrity": "${generatedIntegrity}"`, `"integrity": "${forgedIntegrity}"`),
    "utf8",
  );
  const badParsed = readUnoPageDocument(badJsonBytes.toString("utf8"), { reservedHome: false });
  check("BAD_DOCUMENT_VALID the wrong-digest Page is syntactically accepted", badParsed.accepted === true, badParsed.accepted ? "" : String(badParsed.reason));
  check(
    "BAD_DOCUMENT_DIGEST differs from the real generated digest",
    badJsonBytes.toString("utf8").includes(`"integrity": "${forgedIntegrity}"`) && forgedIntegrity !== generatedIntegrity,
  );
  // --- `UNO-WO-066 / R01`: one adapter-produced family Page, composed ONCE before any transaction ----------------
  // The adapter is imported unchanged and invoked exactly once. Its one accepted, frozen document is serialized to a
  // single UTF-8 buffer that is then the only authority for installation, loading, serving and HTTP.
  const { composeUnoFoundationSubset } = await import("../src/application/compose-uno-foundation-families.ts");
  const { projectUnoSelectedPageHeader } = await import("../src/core/efs/uno-page-header.ts");
  const familyComposed = composeUnoFoundationSubset(familySource(), familyBindings());
  const familyAccepted = familyComposed.status === "composed" ? familyComposed.document : null;
  check(
    "FAMILY_COMPOSE_ACCEPTED the real adapter accepts the seventeen-section source once",
    familyAccepted !== null,
    familyComposed.status === "composed" ? "" : String(familyComposed.reason),
  );
  if (familyAccepted === null) return 1;
  const familyIds = familyAccepted.sections.map((node) => node.id);
  check(
    "FAMILY_COMPOSE_ACCEPTED exact source-index ids and no extra section",
    familyIds.length === 17 && familyIds.every((id, index) => id === FAMILY_IDS[index]),
    familyIds.join(","),
  );
  check(
    "FAMILY_COMPOSE_ACCEPTED the accepted document is deeply frozen",
    deepFrozen(familyAccepted) && Object.isFrozen(familyAccepted.sections),
  );
  const familyJsonBytes = Buffer.from(`${JSON.stringify(familyAccepted, null, 2)}\n`, "utf8");
  check("FAMILY_COMPOSE_ACCEPTED the serialized buffer stays inside the 64 KiB Page bound", familyJsonBytes.length <= 64 * 1024, String(familyJsonBytes.length));
  const familyReparsed = readUnoPageDocument(familyJsonBytes.toString("utf8"), { reservedHome: false });
  check(
    "FAMILY_DOCUMENT_REACCEPTED the real reader reaccepts the same bytes with equal values",
    familyReparsed.accepted === true && JSON.stringify(familyReparsed.document) === JSON.stringify(familyAccepted),
    familyReparsed.accepted ? "" : String(familyReparsed.reason),
  );
  {
    // `UNO-WO-068 / R03` §2B: the same serialized buffer must project an accepted header BEFORE installation, so a
    // loader-versus-header depth disagreement is diagnosed here rather than surfacing later as a serving refusal.
    const header = projectUnoSelectedPageHeader({
      kind: "json",
      text: familyJsonBytes.toString("utf8"),
      routePath: "wo066-family-composition",
    });
    const headerKeys = header.accepted ? Object.keys(header).sort() : [];
    check(
      "FAMILY_HEADER_ACCEPTED the composed buffer projects one accepted authored header before installation",
      header.accepted === true
        && header.kind === "json"
        && header.title === familyAccepted.title
        && header.visibility === "public"
        && headerKeys.every((key) => ["accepted", "description", "kind", "title", "visibility"].includes(key))
        && !JSON.stringify(header).includes("published"),
      header.accepted ? headerKeys.join(",") : String(header.reason),
    );
  }
  {
    const serialized = familyJsonBytes.toString("utf8");
    const leaked = ["contactForms", "wo066-contact", "delivery-off", "formRef", "recipient", "webhook", "provider", FAMILY_DONOR_SOURCE]
      .filter((token) => serialized.includes(token));
    check("FAMILY_SOURCE_NOT_SERIALIZED the donor identity and the acknowledgement never reach the Page", leaked.length === 0, leaked.join(","));
    check(
      "FAMILY_SOURCE_NOT_SERIALIZED the Page carries the real Uno modules and the owned ref, not a donor path",
      serialized.includes('"interaction.contact"') && serialized.includes('"media.gallery"')
        && serialized.includes(`"path": "${FAMILY_PLATE}"`) && !/https?:/u.test(serialized),
    );
    const refusals = [
      ["without bindings", undefined],
      ["with image-only bindings", { images: familyBindings().images }],
      ["with contact-only bindings", { contactForms: familyBindings().contactForms }],
    ].map(([label, bindings]) => {
      const outcome = composeUnoFoundationSubset(familySource(), bindings);
      return {
        label,
        refused: outcome.status === "refused" && outcome.reason === "family:unsupported-feature",
        partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
      };
    });
    check(
      "FAMILY_BINDING_REFUSED the identical source refuses with every incomplete binding",
      refusals.every((entry) => entry.refused && entry.partial === false),
      JSON.stringify(refusals),
    );

    // `UNO-WO-067 / R01`: five representative whole-Page refusals in the four newly appended families. Each probe gets a
    // fresh source, mutates one value, and must refuse with the adapter's own vocabulary and no own `document` key.
    const familyProbes = [
      {
        label: "hero actions with a route destination",
        expected: "family:unsupported-feature",
        mutate: (source) => { source.sections[9].actions = [{ label: "Open", href: "/outside" }]; },
      },
      {
        label: "stats item carrying a remote href",
        expected: "family:unsupported-feature",
        mutate: (source) => { source.sections[10].items[0].href = "https://example.test"; },
      },
      {
        label: "steps item carrying a lifecycle status",
        expected: "family:unsupported-feature",
        mutate: (source) => { source.sections[11].items[0].status = "current"; },
      },
      {
        label: "quote role without an attribution",
        expected: "family:unsupported-feature",
        mutate: (source) => { source.sections[12] = { type: "quote", body: "Q", role: "Reviewer" }; },
      },
      {
        label: "hero with an empty lede",
        expected: "family:target-refused",
        mutate: (source) => { source.sections[9].lede = ""; },
      },
    ].map((probe) => {
      const probeSource = familySource();
      probe.mutate(probeSource);
      const outcome = composeUnoFoundationSubset(probeSource, familyBindings());
      return {
        label: probe.label,
        expected: probe.expected,
        actual: String(outcome.status === "refused" ? outcome.reason : outcome.status),
        partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
      };
    });
    check(
      "FAMILY_FOUR_REFUSALS each appended-family probe refuses the whole Page with its documented reason",
      familyProbes.every((probe) => probe.actual === probe.expected && probe.partial === false),
      JSON.stringify(familyProbes),
    );

    // `UNO-WO-068 / R03`: eight further whole-Page refusals over the last four families, each from a fresh source.
    const lastFourProbes = [
      ["table link authority", "family:unsupported-feature", (s) => { s.sections[13].links = []; }],
      ["ragged table row", "family:target-refused", (s) => { s.sections[13].rows[1] = ["Only one cell"]; }],
      ["column body plus list", "family:unsupported-feature", (s) => { s.sections[14].items[0].items = ["Conflicting list"]; }],
      ["blank column title", "family:target-refused", (s) => { s.sections[14].items[0].title = ""; }],
      ["card media", "family:unsupported-feature", (s) => { s.sections[15].items[0].image = { src: "/assets/extra.png" }; }],
      ["card column count", "family:target-refused", (s) => { s.sections[15].columns = 5; }],
      ["feature icon", "family:unsupported-feature", (s) => { s.sections[16].items[0].icon = "star"; }],
      ["empty feature body", "family:target-refused", (s) => { s.sections[16].items[0].body = ""; }],
    ].map(([expectedLabel, expected, mutate]) => {
      const lastFourSource = familySource();
      mutate(lastFourSource);
      const outcome = composeUnoFoundationSubset(lastFourSource, familyBindings());
      return {
        label: expectedLabel,
        expected,
        actual: String(outcome.status === "refused" ? outcome.reason : outcome.status),
        partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
      };
    });
    check(
      "FAMILY_LAST_FOUR_REFUSALS each last-four probe refuses the whole Page with its documented reason",
      lastFourProbes.every((probe) => probe.actual === probe.expected && probe.partial === false),
      JSON.stringify(lastFourProbes),
    );

    // A hostile accessor on an appended item must be classified, never executed: zero invocations and no partial Page.
    const getterSource = familySource();
    let getterCalls = 0;
    Object.defineProperty(getterSource.sections[16].items[0], "title", {
      enumerable: true,
      get() { getterCalls += 1; return "Feature one"; },
    });
    const getterOutcome = composeUnoFoundationSubset(getterSource, familyBindings());
    check(
      "FAMILY_LAST_FOUR_REFUSALS an authored getter yields family:unsafe-source with zero invocations",
      getterOutcome.status === "refused" && getterOutcome.reason === "family:unsafe-source"
        && getterCalls === 0 && !Object.prototype.hasOwnProperty.call(getterOutcome, "document"),
      `${String(getterOutcome.status === "refused" ? getterOutcome.reason : getterOutcome.status)} calls=${getterCalls}`,
    );
  }

  const plan = fixturePlan(allModulesJsonBytes, badJsonBytes, familyJsonBytes);
  transaction = await prepareUnoU03FixtureTransaction({
    root: ROOT,
    declarations: plan.declarations,
    replacements: plan.replacements,
    fixtureSources: plan.fixtureSources,
    scratchRoot: resolve(ROOT, ".temp"),
  });
  if (transaction.status !== "armed") {
    check("the fixture transaction arms", false, transaction.reasons.join(","));
    return 1;
  }
  check("the fixture transaction is armed before any write", true);
  const installed = await transaction.install();
  if (!check("the fixture installs without a write failure", installed.ok === true, installed.cause ?? "")) return 1;

  // `UNO-WO-052 / R01`: installed bytes, loaded text and serving are one authority, proven before any production build.
  {
    const installedSource = readFileSync(resolve(ROOT, SOURCES[1]));
    check(
      "INSTALL_PARITY the installed source is the single authored buffer",
      installedSource.equals(allModulesJsonBytes),
      `${installedSource.length}/${allModulesJsonBytes.length}`,
    );
    const { loadUnoCandidateSource } = await import("../src/adapters/efs/uno-confined-source-reader.ts");
    const loaded = await loadUnoCandidateSource({ repoRoot: ROOT, pathname: "/en-001/wo044-all-modules" });
    check("LOAD_ACCEPTED the confined candidate loader accepts", loaded.accepted === true, loaded.accepted ? "" : String(loaded.reason));
    if (loaded.accepted) {
      check("LOAD_PARITY the loaded text is the installed bytes", Buffer.from(loaded.text, "utf8").equals(allModulesJsonBytes));
      const { planUnoServingPage } = await import("../src/config/uno-serving.ts");
      const serving = await planUnoServingPage("/en-001/wo044-all-modules");
      check("SERVING_SERVED the trusted serving planner serves the Page", serving.status === "served", serving.status === "served" ? "" : String(serving.reason));
    }

    // `UNO-WO-066 / R01`: the same three authorities, applied to the adapter-produced family Page.
    const installedFamily = readFileSync(resolve(ROOT, SOURCES[4]));
    check(
      "FAMILY_INSTALL_PARITY the installed family source is the one composed buffer",
      installedFamily.equals(familyJsonBytes),
      `${installedFamily.length}/${familyJsonBytes.length}`,
    );
    const loadedFamily = await loadUnoCandidateSource({ repoRoot: ROOT, pathname: "/en-001/wo066-family-composition" });
    check(
      "FAMILY_LOAD_PARITY the confined loader accepts and returns the installed bytes",
      loadedFamily.accepted === true && Buffer.from(loadedFamily.text ?? "", "utf8").equals(familyJsonBytes),
      loadedFamily.accepted ? "" : String(loadedFamily.reason),
    );
    // `UNO-WO-068 / R03` §2B(c): the header is projected from the LOADED text, not a cached buffer, and must agree.
    const loadedFamilyText = loadedFamily.accepted ? loadedFamily.text : "";
    const loadedHeader = projectUnoSelectedPageHeader({
      kind: "json",
      text: loadedFamilyText,
      routePath: "wo066-family-composition",
    });
    check(
      "FAMILY_HEADER_ACCEPTED the loaded text projects the same accepted header with no extra authority",
      loadedHeader.accepted === true
        && loadedHeader.title === familyAccepted.title
        && loadedHeader.visibility === "public"
        && Object.keys(loadedHeader).every((key) => ["accepted", "description", "kind", "title", "visibility"].includes(key)),
      loadedHeader.accepted ? Object.keys(loadedHeader).sort().join(",") : String(loadedHeader.reason),
    );
    // `UNO-WO-069 / R01`: the unchanged composed divider node, read from the same accepted document and the same bytes.
    {
      const divider = familyAccepted.sections[8];
      const dividerNode = divider === undefined ? null : divider;
      check(
        "DIVIDER_PARITY_SOURCE the composed family-8-divider is one frozen content.prose {variant:\"divider\"} with no children",
        dividerNode !== null
          && dividerNode.id === "family-8-divider"
          && dividerNode.module === "content.prose"
          && JSON.stringify(dividerNode.props) === JSON.stringify({ variant: "divider" })
          && Object.keys(dividerNode.props).length === 1
          && Object.prototype.hasOwnProperty.call(dividerNode, "children") === false
          && Object.isFrozen(dividerNode) === true
          && Object.isFrozen(dividerNode.props) === true
          && familyAccepted.sections[7]?.id === "family-7-actions"
          && familyAccepted.sections[9]?.id === "family-9-hero",
        dividerNode === null ? "missing" : `${dividerNode.id}/${dividerNode.module}/${JSON.stringify(dividerNode.props)}`,
      );
      check(
        "DIVIDER_PARITY_SOURCE the serialized buffer carries that one divider node and no authored divider content",
        familyJsonBytes.toString("utf8").includes('"id": "family-8-divider"')
          && familyJsonBytes.toString("utf8").includes('"variant": "divider"')
          && familyJsonBytes.toString("utf8").split('"variant": "divider"').length - 1 === 1,
      );
      const reDivider = familyReparsed.accepted === true ? familyReparsed.document.sections[8] : undefined;
      check(
        "DIVIDER_PARITY_SOURCE the real reader re-reads the same divider node from serialized JSON",
        reDivider !== undefined
          && reDivider.id === "family-8-divider"
          && reDivider.module === "content.prose"
          && JSON.stringify(reDivider.props) === JSON.stringify({ variant: "divider" }),
        reDivider === undefined ? "missing" : reDivider.id,
      );
    }
    const { planUnoServingPage: planFamily } = await import("../src/config/uno-serving.ts");
    const familyServing = await planFamily("/en-001/wo066-family-composition");
    if (
      !check(
        "FAMILY_SERVING_SERVED the trusted serving planner serves the composed Page",
        familyServing.status === "served",
        familyServing.status === "served" ? "" : String(familyServing.reason),
      )
    ) {
      return 1;
    }
    if (familyServing.status === "served") {
      const occurrences = familyServing.assets.occurrences;
      const labelled = occurrences.map((entry) => `${entry.sectionId}#${entry.itemIndex === -1 ? 0 : entry.itemIndex}`);
      check(
        "FAMILY_SERVING_SERVED one JSON Page and exactly three owned image occurrences in document order",
        occurrences.length === 3
          && JSON.stringify(labelled) === JSON.stringify(["family-4-media#0", "family-5-gallery#0", "family-5-gallery#1"])
          && occurrences.every((entry) => entry.slot === "image"),
        labelled.join(","),
      );
      check(
        "FAMILY_SERVING_SERVED every occurrence is the one Page-owned plate at a distinct locator",
        new Set(occurrences.map((entry) => entry.url)).size === 3
          && occurrences.every((entry) => entry.url.startsWith("/uno-media/en-001/wo066-family-composition/")),
        occurrences.map((entry) => entry.url).join(","),
      );
    }
  }

  rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
  const build = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
  if (!check("the production build of the fixture succeeds", build.code === 0, `exit ${build.code}`)) {
    process.stderr.write(build.output.slice(-3000));
    return 1;
  }
  check("the fixture build reports no build error", !/Failed to compile/iu.test(build.output));

  const port = await freeLoopbackPort();
  const base = `http://${HOST}:${port}`;
  child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
    windowsHide: true,
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  if (!check("the production server answers on loopback", await waitForServer(base, child))) return 1;

  const pageResponse = await fetch(`${base}/en-001/wo044-all-modules`);
  const html = await pageResponse.text();
  check("the fixture Page answers HTTP 200", pageResponse.status === 200, String(pageResponse.status));
  check("the served Page is the declared JSON representation, not a Home fallback", html.includes("Every module, once") && !html.includes("The fixture home representation."));
  check("the served Page has exactly one main landmark", (html.match(/<main[\s>]/giu) ?? []).length === 1);
  check("the served Page has exactly one h1", (html.match(/<h1[\s>]/giu) ?? []).length === 1);
  for (const nodeId of ["wo044-bento", "wo044-timeline", "wo044-carousel", "wo044-contact", "wo044-layers"]) {
    check(`the served Page renders the authored ${nodeId} node`, html.includes(`id="${nodeId}"`));
  }
  check("the served Page shows no unknown-module placeholder", !/unknown module|unsupported module/iu.test(html));
  check("the served Page carries no provider iframe", !/<iframe/iu.test(html));
  for (const { provider } of PROVIDER_CASES) {
    check(`the served Page names the ${provider} third party before consent`, new RegExp(provider, "iu").test(html));
  }
  const refusedResponse = await fetch(`${base}/en-001/wo044-invalid`);
  check("the unregistered-module Page answers HTTP 404", refusedResponse.status === 404, String(refusedResponse.status));
  check("the refused Page does not rescue to Markdown", !(await refusedResponse.text()).includes("Unknown module"));

  // --- Owned media over real production HTTP (`UNO-WO-048 / R01`) --------------------------------
  // The locator is read from the served Page itself, never guessed from an index. This proves the authorised GET,
  // the explicit HEAD, closed refusal ordering and non-video range behaviour. No native video occurrence exists in
  // this fixture yet, so the video `206`/`416` paths remain outstanding and are not claimed.
  const locator = /\/uno-media\/[A-Za-z0-9/_-]+/u.exec(html);
  if (!check("the served Page advertises an owned-media locator", locator !== null)) return 1;
  const mediaUrl = `${base}${locator[0]}`;
  const mediaResponse = await fetch(mediaUrl);
  const mediaBytes = Buffer.from(await mediaResponse.arrayBuffer());
  check("the authorised owned occurrence answers HTTP 200", mediaResponse.status === 200, String(mediaResponse.status));
  check(
    "it declares the allowlisted image MIME type",
    mediaResponse.headers.get("content-type") === "image/png",
    mediaResponse.headers.get("content-type") ?? "",
  );
  check("it forbids MIME sniffing", mediaResponse.headers.get("x-content-type-options") === "nosniff");
  check("it carries a real PNG signature", mediaBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
  const plateOnDisk = readFileSync(resolve(ROOT, CAPSULE_DIR, CAPSULE_FILES[0]));
  check(
    "the served bytes are exactly the fixture plate's bytes",
    mediaBytes.equals(plateOnDisk),
    `${mediaBytes.byteLength}/${plateOnDisk.byteLength}`,
  );
  const declaredLength = mediaResponse.headers.get("content-length");
  check(
    "any declared length agrees with the authorised bytes",
    declaredLength === null || declaredLength === String(mediaBytes.byteLength),
    `${declaredLength ?? ""}/${mediaBytes.byteLength}`,
  );
  const headMedia = await fetch(mediaUrl, { method: "HEAD" });
  check("HEAD answers HTTP 200 for the same authorised occurrence", headMedia.status === 200, String(headMedia.status));
  check("HEAD carries the same MIME type", headMedia.headers.get("content-type") === "image/png");
  const headLength = headMedia.headers.get("content-length");
  check(
    "HEAD declares the authorised length or streams with none",
    headLength === null || headLength === String(mediaBytes.byteLength),
    `${headLength ?? ""}/${mediaBytes.byteLength}`,
  );
  check("HEAD returns no body at all", (await headMedia.arrayBuffer()).byteLength === 0);
  check("a non-video resource does not advertise byte ranges", headMedia.headers.get("accept-ranges") === null);
  const rangedMedia = await fetch(mediaUrl, { headers: { range: "bytes=0-3" } });
  const rangedBytes = Buffer.from(await rangedMedia.arrayBuffer());
  check(
    "a non-video resource ignores a range and serves the full authorised 200",
    rangedMedia.status === 200 && rangedBytes.byteLength === mediaBytes.byteLength,
    `${rangedMedia.status}/${rangedBytes.byteLength}`,
  );
  const unauthorised = `${base}/uno-media/en-001/wo044-invalid/0`;
  check("HEAD on an unauthorised locator is a closed 404", (await fetch(unauthorised, { method: "HEAD" })).status === 404);
  const unauthorisedRange = await fetch(unauthorised, { headers: { range: "bytes=0-1" } });
  check("an unauthorised locator is refused before any range is inspected", unauthorisedRange.status === 404, String(unauthorisedRange.status));
  check("a refused locator returns no media bytes", (await unauthorisedRange.arrayBuffer()).byteLength === 0);
  const wrongOccurrence = `${base}${locator[0].replace(/\/\d+$/u, "/99")}`;
  check("an out-of-range occurrence is a closed 404", (await fetch(wrongOccurrence, { method: "HEAD" })).status === 404);

  // --- `UNO-WO-066 / R01`: the adapter-produced family Page over real production HTTP ----------------------------
  {
    const { planUnoServingPage: planFamily } = await import("../src/config/uno-serving.ts");
    const familyPlan = await planFamily("/en-001/wo066-family-composition");
    const familyHtmlResponse = await fetch(`${base}/en-001/wo066-family-composition`);
    const familyHtml = await familyHtmlResponse.text();
    check("FAMILY_HTTP=200 the composed Page answers HTTP 200", familyHtmlResponse.status === 200, String(familyHtmlResponse.status));
    const positions = FAMILY_IDS.map((id) => familyHtml.indexOf(`id="${id}"`));
    check(
      "FAMILY_HTTP=200 the Page renders the seventeen authored section ids in document order",
      positions.every((position) => position >= 0)
        && positions.every((position, index) => index === 0 || position > positions[index - 1])
        && FAMILY_IDS.every((id) => familyHtml.split(`id="${id}"`).length - 1 === 1),
      positions.join(","),
    );
    check(
      "FAMILY_HTTP=200 the composed Page is the declared document, not a Home fallback or a placeholder",
      familyHtml.includes("Bounded family composition proof") && !familyHtml.includes("The fixture home representation.")
        && !/unknown module|unsupported module/iu.test(familyHtml),
    );
    check(
      "FAMILY_HTTP=200 exactly one main landmark and one h1",
      (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1 && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1,
      `${(familyHtml.match(/<main[\s>]/giu) ?? []).length}/${(familyHtml.match(/<h1[\s>]/giu) ?? []).length}`,
    );
    check(
      "FAMILY_HTTP=200 prose and warning callout are rendered",
      familyHtml.includes('<p class="uno-json-prose" id="family-0-prose">This Page came from a bounded donor subset.</p>')
        && familyHtml.includes('<section class="uno-json-callout" data-uno-tone="warning" id="family-1-callout">')
        && familyHtml.includes("A synthetic warning for the publication proof."),
    );
    const listStart = familyHtml.indexOf('<ol class="uno-json-list" id="family-2-list">');
    const listMarkup = listStart < 0 ? "" : familyHtml.slice(listStart, familyHtml.indexOf("</ol>", listStart));
    check(
      "FAMILY_HTTP=200 the ordered list carries exactly the two authored entries",
      listStart >= 0 && (listMarkup.match(/<li>/gu) ?? []).length === 2
        && listMarkup.includes("<span>Prepare</span>") && listMarkup.includes("<span>Publish</span>"),
    );
    check(
      "FAMILY_HTTP=200 the FAQ renders as a native disclosure with the authored question",
      familyHtml.includes('<div class="uno-json-accordion" id="family-3-faq">')
        && familyHtml.includes("<details") && familyHtml.includes("<summary")
        && familyHtml.includes("Can this contact notice send anything?"),
    );
    const galleryStart = familyHtml.indexOf('<div class="uno-json-gallery" data-uno-columns="2" id="family-5-gallery">');
    const galleryMarkup = galleryStart < 0 ? "" : familyHtml.slice(galleryStart, familyHtml.indexOf("</div>", galleryStart));
    check(
      "FAMILY_HTTP=200 the gallery renders two figures and exactly one caption",
      galleryStart >= 0 && (galleryMarkup.match(/<figure class="uno-json-media-item">/gu) ?? []).length === 2
        && (galleryMarkup.match(/<figcaption class="uno-json-media-caption">/gu) ?? []).length === 1
        && galleryMarkup.includes("First fixture image"),
    );
    check(
      "FAMILY_HTTP=200 the composed actions point at real same-document targets",
      familyHtml.includes('<a class="uno-json-action" href="#family-4-media">See the image</a>')
        && familyHtml.includes('<a class="uno-json-action" href="#family-6-contactform">Contact notice</a>'),
    );
    // `UNO-WO-067 / R01`: each appended family is inspected only inside its own top-level region, so an older module can
    // never satisfy a new claim. These four sections nest no further `<section>`, so their own close tag ends the region.
    const familyRegionOf = (id) => {
      const at = familyHtml.indexOf(`id="${id}"`);
      const start = at < 0 ? -1 : familyHtml.lastIndexOf("<section", at);
      const end = at < 0 ? -1 : familyHtml.indexOf("</section>", at);
      return start < 0 || end < 0 ? "" : familyHtml.slice(start, end);
    };
    check(
      "FAMILY_STEPS_HTTP the steps region is one ordered list of two authored items with no invented status",
      (() => {
        const stepsRegion = familyRegionOf("family-11-steps");
        return stepsRegion.startsWith('<section class="uno-json-timeline" data-uno-surface="muted" id="family-11-steps">')
          && stepsRegion.includes('<ol class="uno-json-timeline-list">')
          && (stepsRegion.match(/<li class="uno-json-timeline-item"[^>]*>/gu) ?? []).length === 2
          && stepsRegion.includes('<p class="uno-json-timeline-title">Draft</p>')
          && stepsRegion.includes('<p class="uno-json-timeline-title">Review</p>')
          && stepsRegion.indexOf(">Draft</p>") < stepsRegion.indexOf(">Review</p>")
          && (stepsRegion.match(/<p class="uno-json-timeline-description">/gu) ?? []).length === 1
          && stepsRegion.includes('<p class="uno-json-timeline-description">Prepare the fixture source.</p>')
          && !/data-uno-status|aria-current|uno-json-timeline-date|uno-json-timeline-heading|<h[1-6]\b|<h3/iu.test(stepsRegion);
      })(),
      familyRegionOf("family-11-steps").slice(0, 200),
    );
    check(
      "FAMILY_QUOTE_HTTP the quote region is one figure, blockquote and caption with separate attribution and role",
      (() => {
        const quoteRegion = familyRegionOf("family-12-quote");
        return quoteRegion.startsWith('<section class="uno-json-testimonials" data-uno-align="center" data-uno-surface="bordered" id="family-12-quote">')
          && (quoteRegion.match(/<figure class="uno-json-testimonial">/gu) ?? []).length === 1
          && (quoteRegion.match(/<blockquote class="uno-json-testimonial-quote">/gu) ?? []).length === 1
          && quoteRegion.includes("The fixture does not establish full parity.")
          && (quoteRegion.match(/<figcaption class="uno-json-testimonial-caption">/gu) ?? []).length === 1
          && quoteRegion.includes('<span class="uno-json-testimonial-attribution">Synthetic contributor</span>')
          && quoteRegion.includes('<span class="uno-json-testimonial-role">Reviewer</span>')
          && !/<a\b|<iframe\b|<form\b|<button\b/iu.test(quoteRegion);
      })(),
      familyRegionOf("family-12-quote").slice(0, 200),
    );
    {
      const appendedRegions = ["family-9-hero", "family-10-stats", "family-11-steps", "family-12-quote"].map(familyRegionOf);
      check(
        "FAMILY_HTTP=200 the four appended regions add no second main, h1, script or frame",
        appendedRegions.every((region) => region.length > 0)
          && appendedRegions.every((region) => !/<main\b|<h1\b|<script\b|<iframe\b/iu.test(region))
          && (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1,
      );
    }
    // `UNO-WO-068 / R03`: the last four families. The table nests no container, so its own close tag bounds it; the two
    // grids nest cells and stacks, so each is bounded by the next top-level id and its direct-child counts are checked
    // only on the classes that belong to that grid (exact child structure is proved by the scoped Chromium assertions).
    const tableRegionStart = familyHtml.indexOf('<div class="uno-json-table-scroll" id="family-13-table" tabindex="0">');
    const tableRegionEnd = tableRegionStart < 0 ? -1 : familyHtml.indexOf("</table></div>", tableRegionStart);
    const tableRegion = tableRegionStart < 0 || tableRegionEnd < 0
      ? ""
      : familyHtml.slice(tableRegionStart, tableRegionEnd + "</table></div>".length);
    check(
      "FAMILY_TABLE_HTTP the table region is one scroll wrapper with a genuine captioned two-column table",
      tableRegion.length > 0
        && tableRegion.includes('<table class="uno-json-table">')
        && (tableRegion.match(/<caption>Synthetic table<\/caption>/gu) ?? []).length === 1
        && (tableRegion.match(/<th scope="col">/gu) ?? []).length === 2
        && tableRegion.indexOf("<th scope=\"col\">Phase</th>") < tableRegion.indexOf("<th scope=\"col\">Count</th>")
        && tableRegion.includes("<tbody>")
        && (tableRegion.match(/<tr>/gu) ?? []).length === 3
        && (tableRegion.match(/<td>/gu) ?? []).length === 4
        && tableRegion.indexOf("<td>First</td><td>1</td>") > 0
        && tableRegion.indexOf("<td>Second</td><td>2</td>") > tableRegion.indexOf("<td>First</td><td>1</td>")
        && !/<a\b|<img\b|<script\b|<form\b|<button\b/iu.test(tableRegion),
      tableRegion.slice(0, 200),
    );
    const columnsStart = familyHtml.indexOf('id="family-14-columns"');
    const cardsStart = familyHtml.indexOf('id="family-15-cards"');
    const featuresStart = familyHtml.indexOf('id="family-16-features"');
    const columnsRegion = columnsStart < 0 || cardsStart < 0 ? "" : familyHtml.slice(columnsStart, cardsStart);
    check(
      "FAMILY_COLUMNS_HTTP the columns region is an authored plain two-column grid of two tight stacks",
      columnsRegion.length > 0
        && familyHtml.includes('<div class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="plain" data-uno-ratio="start-wide" id="family-14-columns">')
        && (columnsRegion.match(/<div class="uno-json-cell"/gu) ?? []).length === 2
        && (columnsRegion.match(/<div class="uno-json-stack" data-uno-gap="tight"/gu) ?? []).length === 2
        && (columnsRegion.match(/<h2 class="uno-json-heading"/gu) ?? []).length === 2
        && columnsRegion.indexOf(">Left column</h2>") > 0
        && columnsRegion.indexOf(">Left column</h2>") < columnsRegion.indexOf(">Right column</h2>")
        && columnsRegion.includes(">The left text.</p>")
        && columnsRegion.includes('<ul class="uno-json-list"')
        && columnsRegion.indexOf(">Check one</span>") < columnsRegion.indexOf(">Check two</span>")
        && !/<h3\b|<a\b|<img\b|<button\b|<form\b/iu.test(columnsRegion),
      columnsRegion.slice(0, 200),
    );
    const cardsRegion = cardsStart < 0 || featuresStart < 0 ? "" : familyHtml.slice(cardsStart, featuresStart);
    check(
      "FAMILY_CARDS_HTTP the cards region is a native two-column list grid with one body only",
      cardsRegion.length > 0
        && familyHtml.includes('<ul class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="list" id="family-15-cards" role="list">')
        && (cardsRegion.match(/<li class="uno-json-cell"/gu) ?? []).length === 2
        && (cardsRegion.match(/<div class="uno-json-stack" data-uno-gap="tight"/gu) ?? []).length === 2
        && cardsRegion.indexOf(">Card one</h2>") > 0
        && cardsRegion.indexOf(">Card one</h2>") < cardsRegion.indexOf(">Card two</h2>")
        && (cardsRegion.match(/<p class="uno-json-prose"/gu) ?? []).length === 1
        && cardsRegion.includes(">First card body.</p>")
        && !/data-uno-ratio|<article\b|<a\b|<img\b|<button\b|<form\b|icon/iu.test(cardsRegion),
      cardsRegion.slice(0, 200),
    );
    const featuresRegion = featuresStart < 0 ? "" : familyHtml.slice(featuresStart, familyHtml.indexOf("</main>", featuresStart));
    check(
      "FAMILY_FEATURES_HTTP the features region is a separate native three-column list grid with one body",
      featuresRegion.length > 0
        && familyHtml.includes('<ul class="uno-json-grid" data-uno-columns="3" data-uno-item-semantics="list" id="family-16-features" role="list">')
        && (featuresRegion.match(/<li class="uno-json-cell"/gu) ?? []).length === 2
        && featuresRegion.indexOf(">Feature one</h2>") > 0
        && featuresRegion.indexOf(">Feature one</h2>") < featuresRegion.indexOf(">Feature two</h2>")
        && (featuresRegion.match(/<p class="uno-json-prose"/gu) ?? []).length === 1
        && featuresRegion.includes(">First feature body.</p>")
        && !/data-uno-ratio|<article\b|<a\b|<img\b|<button\b|<form\b|icon/iu.test(featuresRegion),
      featuresRegion.slice(0, 200),
    );
    {
      const lastFourRegions = [tableRegion, columnsRegion, cardsRegion, featuresRegion];
      check(
        "FAMILY_SEVENTEEN_HTTP the last four regions add no second main, h1, script, frame or form control",
        lastFourRegions.every((region) => region.length > 0)
          && lastFourRegions.every((region) => !/<main\b|<h1\b|<script\b|<iframe\b|<form\b|<input\b|<textarea\b|<button\b/iu.test(region))
          && (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<h2[\s>]/giu) ?? []).length === 6
          && !familyHtml.includes(FAMILY_DONOR_SOURCE)
          && !familyHtml.includes("formRef"),
        `${lastFourRegions.map((region) => region.length).join("/")} h2=${(familyHtml.match(/<h2[\s>]/giu) ?? []).length}`,
      );
    }
    // `UNO-WO-069 / R01`: the divider as served. The donor authors `{type:"divider"}` and renders one native `<hr>`;
    // here the same element must be the direct child of the Uno root, with no wrapper, label, text or control.
    {
      const tag = '<hr class="uno-json-divider" id="family-8-divider"/>';
      const occurrences = familyHtml.split(tag).length - 1;
      const actionsAt = familyHtml.indexOf('id="family-7-actions"');
      const dividerAt = familyHtml.indexOf(tag);
      const heroAt = familyHtml.indexOf('id="family-9-hero"');
      const beforeTag = dividerAt < 0 ? "" : familyHtml.slice(0, dividerAt);
      const afterTag = dividerAt < 0 ? "" : familyHtml.slice(dividerAt + tag.length);
      check(
        "DIVIDER_PARITY_HTTP the composed Page serves exactly one native hr divider directly in the Uno root",
        occurrences === 1
          && dividerAt > 0
          // The donor puts the rule between the actions block and the hero block; in Uno's root flex column the
          // previous element is the authored actions list and the next is the hero section, with no wrapper between.
          && beforeTag.endsWith("</ul>")
          && afterTag.startsWith("<section")
          && beforeTag.lastIndexOf('id="family-7-actions"') > 0
          && actionsAt > 0 && actionsAt < dividerAt
          && dividerAt < heroAt
          && familyHtml.split('id="family-8-divider"').length - 1 === 1,
        `occurrences=${occurrences} actions=${actionsAt} divider=${dividerAt} hero=${heroAt} near=${familyHtml.slice(Math.max(0, dividerAt - 26), dividerAt + 70)}`,
      );
      check(
        "DIVIDER_PARITY_HTTP the served divider carries no heading, text, focus, interactive or media attribute",
        occurrences === 1
          && !/aria-|role=|tabindex|href|src=|title=|id="family-8-divider"[^>]*\s(class|style)/iu.test(tag)
          && (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1
          && !familyHtml.includes("/assets/"),
        tag,
      );
    }
    const contactStart = familyHtml.indexOf('<section class="uno-json-contact" id="family-6-contactform">');
    const contactMarkup = contactStart < 0 ? "" : familyHtml.slice(contactStart, familyHtml.indexOf("</section>", contactStart));
    check(
      "FAMILY_HTTP=200 the contact section is present with the fixed delivery-OFF status",
      contactStart >= 0
        && contactMarkup.includes('<p class="uno-json-contact-status">Delivery is switched off. Nothing entered here is sent or stored.</p>'),
    );
    check("FAMILY_HTTP=200 the divider is rendered", familyHtml.includes('id="family-8-divider"') && /<hr\b/u.test(familyHtml));

    const heroRegion = familyRegionOf("family-9-hero");
    check(
      "FAMILY_HERO_HTTP the hero region carries the authored alignment, surface and text in order",
      heroRegion.startsWith('<section class="uno-json-hero" data-uno-align="center" data-uno-surface="muted" id="family-9-hero">')
        && heroRegion.includes('<p class="uno-json-eyebrow">Synthetic introduction</p>')
        && heroRegion.includes('<p class="uno-json-hero-lede">The composed Page is visible.</p>')
        && heroRegion.includes('<p class="uno-json-hero-support">This is a bounded, original fixture example.</p>')
        && heroRegion.indexOf("Synthetic introduction") < heroRegion.indexOf("The composed Page is visible.")
        && heroRegion.indexOf("The composed Page is visible.") < heroRegion.indexOf("This is a bounded, original fixture example."),
      heroRegion.slice(0, 160),
    );
    check(
      "FAMILY_HERO_HTTP the hero region holds no link, action list, control or frame",
      heroRegion.length > 0 && !/<a\b|<ul\b|<iframe\b|<button\b|<form\b/iu.test(heroRegion),
      heroRegion.slice(0, 160),
    );
    const statsRegion = familyRegionOf("family-10-stats");
    const statsDetailAt = statsRegion.indexOf('<span class="uno-json-stat-detail">Fixture only</span>');
    check(
      "FAMILY_STATS_HTTP the stats region is one definition list with two authored pairs in order",
      statsRegion.includes('class="uno-json-stats"') && statsRegion.includes('<dl class="uno-json-stats-list">')
        && (statsRegion.match(/<dt class="uno-json-stat-label">/gu) ?? []).length === 2
        && (statsRegion.match(/<dd class="uno-json-stat-value">/gu) ?? []).length === 2
        && statsRegion.includes(">Sampled sections</dt>") && statsRegion.includes('>13<span class="uno-json-stat-detail">')
        && statsRegion.includes(">New examples</dt>") && statsRegion.includes(">4</dd>")
        && statsRegion.indexOf("Sampled sections") < statsRegion.indexOf("New examples"),
      statsRegion.slice(0, 200),
    );
    check(
      "FAMILY_STATS_HTTP exactly one detail span, attached to the first item, with no invented heading or currency",
      statsDetailAt > 0
        && statsDetailAt < statsRegion.indexOf('<dt class="uno-json-stat-label">New examples</dt>')
        && (statsRegion.match(/uno-json-stat-detail/gu) ?? []).length === 1
        && !/uno-json-stats-heading|<h[1-6]\b|[$€£]|aria-labelledby/iu.test(statsRegion),
      statsRegion.slice(0, 200),
    );
    check(
      "FAMILY_CONTACT_OFF_HTTP the contact subtree carries no form, control, handler or destination",
      ["<form", "<input", "<textarea", "<button", "action=", "method=", "href=", "onSubmit", "wo066-contact", "contactForms"]
        .every((token) => !contactMarkup.includes(token)),
      ["<form", "<input", "<textarea", "<button", "action=", "method=", "href=", "onSubmit", "wo066-contact", "contactForms"]
        .filter((token) => contactMarkup.includes(token)).join(","),
    );
    check(
      "FAMILY_CONTACT_OFF_HTTP neither the donor identity nor the acknowledgement appears anywhere in the HTML",
      !familyHtml.includes(FAMILY_DONOR_SOURCE) && !familyHtml.includes("wo066-contact") && !familyHtml.includes("contactForms"),
    );

    if (familyPlan.status !== "served") {
      check("FAMILY_MEDIA=3/3 the composed Page plans three owned image occurrences", false, String(familyPlan.reason));
    } else {
      const familyPlate = readFileSync(resolve(ROOT, CAPSULE_DIR, FAMILY_PLATE));
      const occurrences = familyPlan.assets.occurrences;
      let familyServed = 0;
      for (const occurrence of occurrences) {
        const occurrenceUrl = `${base}${occurrence.url}`;
        const response = await fetch(occurrenceUrl);
        const bytes = Buffer.from(await response.arrayBuffer());
        const head = await fetch(occurrenceUrl, { method: "HEAD" });
        const headLength = head.headers.get("content-length");
        const label = `${occurrence.sectionId}#${occurrence.itemIndex === -1 ? 0 : occurrence.itemIndex}`;
        const ok = response.status === 200 && head.status === 200
          && response.headers.get("content-type") === "image/png"
          && head.headers.get("content-type") === "image/png"
          && bytes.equals(familyPlate)
          && (await head.arrayBuffer()).byteLength === 0
          && (headLength === null || headLength === String(familyPlate.length))
          && familyHtml.includes(occurrence.url);
        check(
          `FAMILY_MEDIA=3/3 occurrence ${label} serves exactly the generated plate`,
          ok,
          `${response.status}/${head.status} ${bytes.length}/${familyPlate.length}`,
        );
        if (ok) familyServed += 1;
      }
      check(
        "FAMILY_MEDIA=3/3 three distinct locators serve the one Page-owned plate with GET and HEAD",
        familyServed === 3 && occurrences.length === 3 && new Set(occurrences.map((entry) => entry.url)).size === 3,
        `${familyServed}/${occurrences.length}`,
      );
      await expectClosed404(`${base}/uno-media/en-001/wo066-family-composition/99`, "FAMILY_UNPUBLISHED_404 wrong-occurrence media locator");
      await expectClosed404(`${base}/uno-media/en-002/wo066-family-composition/0`, "FAMILY_UNPUBLISHED_404 wrong-locale media locator");
    }
    const familyUnbound = await fetch(`${base}/en-001/wo066-unbound`, { redirect: "manual" });
    check("FAMILY_UNPUBLISHED_404 an unlisted path stays a closed 404", familyUnbound.status === 404, String(familyUnbound.status));
    const familyWrongLocale = await fetch(`${base}/en-002/wo066-family-composition`, { redirect: "manual" });
    check("FAMILY_UNPUBLISHED_404 a wrong-locale path stays a closed 404", familyWrongLocale.status === 404, String(familyWrongLocale.status));
  }

  // --- Phase A: four-zone, native-video and closed-refusal proof over real production HTTP (`UNO-WO-053 / R01`) ------
  {
    const { planUnoServingPage } = await import("../src/config/uno-serving.ts");
    const badServing = await planUnoServingPage("/en-001/wo053-bad-generated");
    check(
      "BAD_PAGE serving refuses the wrong generated digest",
      badServing.status !== "served" && String(badServing.reason ?? "").includes("media-unavailable"),
      String(badServing.reason ?? badServing.status),
    );
    const badPage = await fetch(`${base}/en-001/wo053-bad-generated`, { redirect: "manual" });
    const badPageBody = await badPage.text();
    check("BAD_PAGE answers HTTP 404", badPage.status === 404, String(badPage.status));
    check(
      "BAD_PAGE discloses no authored content, path or integrity",
      !badPageBody.includes("Bad integrity test") && !badPageBody.includes("wo052-generated.png") && !/users[\\/]/iu.test(badPageBody),
    );
    await expectClosed404(`${base}/uno-media/en-001/wo053-bad-generated/0`, "BAD_PAGE media locator GET");
    await expectClosed404(`${base}/uno-media/en-001/wo053-bad-generated/0`, "BAD_PAGE media locator HEAD", { method: "HEAD" });

    const published = await planUnoServingPage("/en-001/wo044-all-modules");
    if (!check("PHASE_A the served Page carries an asset ledger", published.status === "served" && published.assets.occurrences.length > 0, String(published.reason ?? published.status))) return 1;

    const specs = [
      ["page", "wo044-image", "image", "image/png", readFileSync(resolve(ROOT, CAPSULE_DIR, CAPSULE_FILES[0]))],
      ["theme", "wo052-theme-image", "image", "image/png", readFileSync(resolve(ROOT, THEME_DIR, MEDIA.theme))],
      ["platform", "wo052-platform-image", "image", "image/png", readFileSync(resolve(ROOT, PLATFORM_DIR, MEDIA.platform))],
      ["generated", "wo052-generated-image", "image", "image/png", readFileSync(resolve(ROOT, GENERATED_DIR, MEDIA.generated))],
    ];
    let fourZones = 0;
    for (const [zone, id, slot, mime, bytes] of specs) {
      const occurrence = oneOccurrence(published.assets, id, slot);
      check(`ZONE ${zone} ledger zone`, occurrence.ref.zone === zone, String(occurrence.ref.zone));
      const fetched = await expectOwnedGetHead(base, occurrence, { mime, bytes }, `ZONE ${zone}`, html);
      const ranged = await fetch(fetched.url, { headers: { range: "bytes=0-3" } });
      const rangedBody = await asBytes(ranged);
      const goodRange = ranged.status === 200 && rangedBody.equals(bytes) && ranged.headers.get("accept-ranges") === null;
      check(`ZONE ${zone} ignores non-video Range`, goodRange, `${ranged.status}/${rangedBody.length}`);
      if (fetched.ok && occurrence.ref.zone === zone && goodRange) fourZones += 1;
    }
    check(
      "generated ref integrity matches the exact generated bytes",
      oneOccurrence(published.assets, "wo052-generated-image", "image").ref.integrity === generatedIntegrity,
    );
    check("FOUR_ZONE_HTTP=4/4", fourZones === 4, `${fourZones}/4`);
    const seen = new Map();
    let nativeVideo = 0;
    for (const [id, name, mime] of [["wo052-native-mp4", MEDIA.mp4, "video/mp4"], ["wo053-native-webm", MEDIA.webm, "video/webm"]]) {
      const bytes = readFileSync(resolve(ROOT, CAPSULE_DIR, name));
      const video = oneOccurrence(published.assets, id, "video");
      const fetched = await expectOwnedGetHead(base, video, { mime, bytes }, `VIDEO ${id}`, html);
      await expectVideoRanges(fetched.url, bytes, `VIDEO ${id}`);
      const captions = oneOccurrence(published.assets, id, "captions");
      const captionsBytes = readFileSync(resolve(ROOT, CAPSULE_DIR, MEDIA.captions));
      const captionsFetched = await expectOwnedGetHead(base, captions, { mime: "text/vtt", bytes: captionsBytes }, `CAPTIONS ${id}`, html);
      const poster = oneOccurrence(published.assets, id, "poster");
      const posterBytes = readFileSync(resolve(ROOT, CAPSULE_DIR, MEDIA.poster));
      const posterFetched = await expectOwnedGetHead(base, poster, { mime: "image/png", bytes: posterBytes }, `POSTER ${id}`, html);
      check(
        `CAPTIONS ${id} begin WEBVTT and carry one bounded cue`,
        captionsBytes.subarray(0, 6).toString("ascii") === "WEBVTT" && captionsBytes.toString("utf8").includes("-->"),
      );
      for (const key of ["video", "captions", "poster"]) {
        const occurrence = oneOccurrence(published.assets, id, key);
        const previous = seen.get(key);
        check(`OCCURRENCE ${id} ${key} is distinct`, previous === undefined || previous !== occurrence.occurrence, `${key}=${occurrence.occurrence}`);
        seen.set(key, occurrence.occurrence);
      }
      check(
        `VIDEO ${id} is controlled, never autoplaying, and advertises its own source, track and poster`,
        /<video\b[^>]*\bcontrols\b/iu.test(html) && !/<video\b[^>]*\bautoplay\b/iu.test(html)
        && html.includes(video.url) && html.includes(captions.url) && html.includes(poster.url),
        `videos=${(html.match(/<video\b/giu) ?? []).length} controls=${/<video\b[^>]*\bcontrols\b/iu.test(html)} src=${html.includes(video.url)} track=${html.includes(captions.url)} poster=${html.includes(poster.url)}`,
      );
      if (fetched.ok && captionsFetched.ok && posterFetched.ok) nativeVideo += 1;
    }
    check("NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER", nativeVideo === 2, `${nativeVideo}/2`);

    const unknownPage = await fetch(`${base}/en-001/wo053-unknown-module`, { redirect: "manual" });
    check("unknown-module Page is a closed 404", unknownPage.status === 404, String(unknownPage.status));
    const wrongLocale = await fetch(`${base}/en-002/wo044-all-modules`, { redirect: "manual" });
    check("an unpublished locale Page is a closed 404", wrongLocale.status === 404, String(wrongLocale.status));
    await expectClosed404(`${base}/uno-media/en-002/wo044-all-modules/0`, "wrong-locale media locator");
    await expectClosed404(`${base}/uno-media/en-001/wo044-all-modules/999`, "wrong-occurrence media locator");
    await expectClosed404(`${base}/uno-media/en-001/wo044-all-modules/0%2e%2e%2fwo052-generated.png`, "encoded traversal media locator");
    await expectClosed404(`${base}/uno-media/en-001/wo044-invalid/0`, "unauthorised Page media locator with Range", { headers: { range: "bytes=0-1" } });
  }

  return base;
}

/** Everything that needs a real browser: zero pre-consent network, then one activation per provider and input mode. */
async function consentPhase(base) {
  const { UNO_VIDEO_EMBED_ORIGINS, unoVideoProviderLabel } = await import("../src/core/video/uno-video-embeds.ts");
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
  const context = await browser.newContext();
  let consentArmed = false;
  const requests = [];
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith(base)) return route.continue();
    const provider = PROVIDER_REQUEST.test(url);
    requests.push({ url, consentArmed, provider, foreign: !provider });
    if (provider) return route.fulfill({ status: 200, contentType: "text/html", headers: { "cache-control": "no-store" }, body: "<!doctype html><title>stub</title>" });
    return route.abort();
  });

  const tab = await context.newPage();
  const consoleErrors = [];
  tab.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  tab.on("pageerror", (error) => consoleErrors.push(String(error)));

  const url = `${base}/en-001/wo044-all-modules`;
  await tab.goto(url, { waitUntil: "load" });
  await delay(700);
  check("pre-consent Chromium DOM has zero iframes", (await tab.locator("iframe").count()) === 0);
  check("pre-consent made no provider request at all", requests.length === 0, JSON.stringify(requests.slice(0, 3)));
  for (const { provider } of PROVIDER_CASES) {
    const control = tab.getByRole("button", { name: new RegExp(`load video from\\s+${unoVideoProviderLabel(provider)}`, "iu") });
    check(`the ${provider} consent control is present and named`, (await control.count()) === 1);
  }

  for (const { provider, videoId } of PROVIDER_CASES) {
    for (const mode of ["mouse", "keyboard"]) {
      requests.length = 0;
      await tab.goto(url, { waitUntil: "load" });
      await delay(250);
      check(`${provider} (${mode}) starts with no iframe`, (await tab.locator("iframe").count()) === 0);
      const control = tab.getByRole("button", { name: new RegExp(`load video from\\s+${unoVideoProviderLabel(provider)}`, "iu") }).first();
      consentArmed = true;
      if (mode === "mouse") await control.click();
      else { await control.focus(); await tab.keyboard.press("Enter"); }
      await tab.waitForSelector("iframe", { timeout: 15_000 });
      await delay(250);
      consentArmed = false;
      const frames = tab.locator("iframe");
      check(`${provider} (${mode}) mounts exactly one iframe`, (await frames.count()) === 1);
      const src = (await frames.first().getAttribute("src")) ?? "";
      const origin = (() => { try { return new URL(src).origin; } catch { return ""; } })();
      check(`${provider} (${mode}) uses a governed fixed origin`, UNO_VIDEO_EMBED_ORIGINS.includes(origin), origin || src);
      check(`${provider} (${mode}) carries its own identifier`, src.includes(videoId), src);
      const activated = requests.filter((entry) => entry.provider);
      check(`${provider} (${mode}) made exactly one provider request`, activated.length === 1, String(activated.length));
      check(`${provider} (${mode}) made no foreign network request`, requests.every((entry) => !entry.foreign));
      const unload = tab.getByRole("button", { name: /unload video/iu }).first();
      check(`${provider} (${mode}) offers an unload control`, (await unload.count()) === 1);
      await unload.click();
      await delay(250);
      check(`${provider} (${mode}) unload removes the iframe`, (await tab.locator("iframe").count()) === 0);
      const focused = await tab.evaluate(() => document.activeElement?.textContent ?? "");
      check(`${provider} (${mode}) unload restores focus to the consent control`, /load video/iu.test(focused), focused.slice(0, 60));
    }
  }
  // --- Phase B: the sixteen-case viewport × colour-scheme × motion matrix (`UNO-WO-054 / R01`) ----------------
  const MATRIX_WIDTHS = Object.freeze([320, 390, 768, 1280]);
  const MATRIX_SCHEMES = Object.freeze(["light", "dark"]);
  const MATRIX_MOTIONS = Object.freeze(["no-preference", "reduce"]);
  const MATRIX_URL = url;
  const matrixCases = [];
  let matrixPassed = 0;
  for (const width of MATRIX_WIDTHS) {
    for (const colorScheme of MATRIX_SCHEMES) {
      for (const reducedMotion of MATRIX_MOTIONS) {
        const caseId = `${width}/${colorScheme}/${reducedMotion}`;
        matrixCases.push(caseId);
        const failuresBefore = failures.length;
        const errorsBefore = consoleErrors.length;
        try {
          await tab.setViewportSize({ width, height: 900 });
          await tab.emulateMedia({ colorScheme, reducedMotion });
          requests.length = 0;
          consentArmed = false;
          await tab.goto(MATRIX_URL, { waitUntil: "load" });
          await delay(250);
          const measurements = await tab.evaluate(() => {
            const root = document.documentElement;
            const motion = document.querySelector("#wo044-motion");
            const motionStyle = motion ? getComputedStyle(motion) : null;
            const prose = document.querySelector("#wo044-prose");
            const style = prose ? getComputedStyle(prose) : null;
            return {
              width: window.innerWidth,
              clientWidth: root.clientWidth,
              scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
              dark: matchMedia("(prefers-color-scheme: dark)").matches,
              reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
              mains: document.querySelectorAll("main").length,
              h1s: document.querySelectorAll("h1").length,
              proseText: prose?.textContent?.trim() ?? "",
              proseVisibility: style?.visibility ?? "",
              proseColor: style?.color ?? "",
              proseBackground: getComputedStyle(document.body).backgroundColor,
              motionAnimation: motionStyle?.animationName ?? "",
              motionTransition: motionStyle?.transitionDuration ?? "",
            };
          });
          check(`${caseId} actual viewport`, measurements.width === width, JSON.stringify(measurements));
          check(`${caseId} actual browser media`, measurements.dark === (colorScheme === "dark")
            && measurements.reduce === (reducedMotion === "reduce"), JSON.stringify(measurements));
          check(`${caseId} no document horizontal overflow`, measurements.scrollWidth - measurements.clientWidth <= 2,
            `${measurements.scrollWidth}/${measurements.clientWidth}`);
          check(`${caseId} one main and one h1`, measurements.mains === 1 && measurements.h1s === 1,
            `${measurements.mains}/${measurements.h1s}`);
          check(`${caseId} prose is visible/readable`, measurements.proseText.length > 0
            && measurements.proseVisibility === "visible" && measurements.proseColor !== ""
            && measurements.proseBackground !== "", JSON.stringify(measurements));
          check(`${caseId} reduced-motion CSS`, reducedMotion === "reduce"
            ? measurements.motionAnimation === "none" : measurements.motionAnimation.includes("uno-json-fade"),
            measurements.motionAnimation);
          const native = await tab.locator(".uno-json-video video").evaluateAll((nodes) => nodes.map((v) => ({
            controls: v.hasAttribute("controls"),
            autoplay: v.autoplay,
            source: v.querySelector("source")?.getAttribute("src") ?? "",
            track: v.querySelector("track")?.getAttribute("src") ?? "",
            trackKind: v.querySelector("track")?.getAttribute("kind") ?? "",
            poster: v.getAttribute("poster") ?? "",
          })));
          const isOwned = (value) => /^\/uno-media\/en-001\/wo044-all-modules\/[0-9]+$/u.test(value);
          check(`${caseId} two native controls and source/track/poster`, native.length === 2
            && native.every((v) => v.controls && !v.autoplay && isOwned(v.source) && isOwned(v.track)
              && isOwned(v.poster) && v.trackKind === "captions") && native[0].source !== native[1].source,
          JSON.stringify(native));

          const tabA = tab.getByRole("tab", { name: "A", exact: true });
          const tabB = tab.getByRole("tab", { name: "B", exact: true });
          await tabA.focus();
          await tab.keyboard.press("ArrowRight");
          check(`${caseId} ArrowRight selects B and focuses it`,
            (await tabB.getAttribute("aria-selected")) === "true" && await tabB.evaluate((el) => document.activeElement === el));
          check(`${caseId} selected B panel visible and A hidden`,
            await tab.locator("#wo044-tabs-panel-wo044-tab-b").isVisible()
            && !(await tab.locator("#wo044-tabs-panel-wo044-tab-a").isVisible()));
          await tab.keyboard.press("Home");
          check(`${caseId} Home restores A and focus`,
            (await tabA.getAttribute("aria-selected")) === "true" && await tabA.evaluate((el) => document.activeElement === el));
          const summary = tab.locator("#wo044-accordion summary").first();
          const details = tab.locator("#wo044-accordion details").first();
          await summary.focus();
          await tab.keyboard.press("Enter");
          check(`${caseId} accordion Enter opens`, await details.evaluate((el) => el.open),
            String(await details.evaluate((el) => el.open)));
          await tab.keyboard.press("Space");
          check(`${caseId} accordion Space closes`, !(await details.evaluate((el) => el.open)),
            String(await details.evaluate((el) => el.open)));

          const trigger = tab.getByRole("button", { name: "Open details", exact: true });
          await trigger.click();
          const dialog = tab.getByRole("dialog", { name: "Details" });
          await dialog.waitFor({ state: "visible", timeout: 10_000 });
          check(`${caseId} modal opens`, await dialog.isVisible());
          await tab.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden", timeout: 10_000 });
          check(`${caseId} Escape closes modal and restores focus`,
            !(await dialog.isVisible()) && await trigger.evaluate((el) => document.activeElement === el));

          const carousel = tab.locator("#wo044-carousel");
          const liveStatus = async () => ((await carousel.locator('[aria-live="polite"]').textContent()) ?? "").trim();
          check(`${caseId} carousel starts at image 1`, (await liveStatus()).includes("Image 1 of 2"), await liveStatus());
          await carousel.getByRole("button", { name: "Next image" }).click();
          check(`${caseId} carousel next changes live status`, (await liveStatus()).includes("Image 2 of 2"), await liveStatus());
          await carousel.getByRole("button", { name: "Previous image" }).click();
          check(`${caseId} carousel previous restores status`, (await liveStatus()).includes("Image 1 of 2"), await liveStatus());

          check(`${caseId} zero iframe/provider requests before consent`,
            (await tab.locator("iframe").count()) === 0 && requests.length === 0, String(requests.length));
          const activate = tab.getByRole("button", { name: /load video from\s+youtube/iu }).first();
          consentArmed = true;
          await activate.click();
          await tab.waitForSelector("iframe", { state: "attached", timeout: 15_000 });
          for (let waitForProvider = 0; waitForProvider < 60 && !requests.some((entry) => entry.provider); waitForProvider += 1) await delay(100);
          consentArmed = false;
          const frameSrc = (await tab.locator("iframe").first().getAttribute("src")) ?? "";
          let frameOrigin = "";
          try { frameOrigin = new URL(frameSrc).origin; } catch { frameOrigin = ""; }
          const providerCalls = requests.filter((entry) => entry.provider);
          check(`${caseId} YouTube consent creates one governed frame/request`,
            (await tab.locator("iframe").count()) === 1 && UNO_VIDEO_EMBED_ORIGINS.includes(frameOrigin)
            && providerCalls.length === 1 && providerCalls[0].consentArmed === true
            && requests.every((entry) => !entry.foreign), JSON.stringify({ frameOrigin, requests }));
          await tab.getByRole("button", { name: /unload video/iu }).first().click();
          await tab.locator("iframe").first().waitFor({ state: "detached", timeout: 15_000 });
          const focusedAfterUnload = await tab.evaluate(() => document.activeElement?.textContent ?? "");
          check(`${caseId} unload removes frame and restores focus`,
            (await tab.locator("iframe").count()) === 0 && /load video from\s+youtube/iu.test(focusedAfterUnload),
            `${await tab.locator("iframe").count()} frames, focus=${focusedAfterUnload.slice(0, 60)}`);
        } catch (error) {
          check(`${caseId} uncaught case failure`, false, String(error?.message ?? error).slice(0, 180));
        } finally {
          consentArmed = false;
        }
        check(`${caseId} no new console/page errors`, consoleErrors.length === errorsBefore,
          consoleErrors.slice(errorsBefore).join(" | ").slice(0, 180));
        if (failures.length === failuresBefore) matrixPassed += 1;
        process.stdout.write(`MATRIX_CASE ${caseId}: ${failures.length === failuresBefore ? "PASS" : "FAIL"}\n`);
      }
    }
  }
  check("BROWSER_MATRIX 16 distinct case IDs", new Set(matrixCases).size === 16, String(new Set(matrixCases).size));
  check("BROWSER_MATRIX=16/16", matrixPassed === 16 && new Set(matrixCases).size === 16, `${matrixPassed}/16`);

  // --- `UNO-WO-066 / R01`: the composed family Page in real Chromium at a compact and a desktop viewport ----------
  const FAMILY_URL = `${base}/en-001/wo066-family-composition`;
  {
    const errorsBefore = consoleErrors.length;
    let familyOk = true;
    const familyCheck = (label, ok, detail = "") => {
      if (!ok) familyOk = false;
      return check(`FAMILY_BROWSER ${label}`, ok, detail);
    };
    // `UNO-WO-069 / R01`: the divider evidence is counted and gated separately, so a deleted or neutered divider check
    // both fails the runner and suppresses the overall parity label.
    let dividerOk = true;
    let dividerChecks = 0;
    const dividerCheck = (label, ok, detail = "") => {
      dividerChecks += 1;
      if (!ok) dividerOk = false;
      return check(`DIVIDER_PARITY_BROWSER ${label}`, ok, detail);
    };
    for (const width of [390, 1280]) {
      requests.length = 0;
      await tab.setViewportSize({ width, height: 900 });
      await tab.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
      await tab.goto(FAMILY_URL, { waitUntil: "load" });
      await delay(400);
      const seen = await tab.evaluate(() => {
        const tops = [...document.querySelectorAll('[id^="family-"]')]
          .filter((element) => element.parentElement?.closest('[id^="family-"]') === null)
          .map((element) => element.id);
        const prose = document.querySelector("#family-0-prose");
        const callout = document.querySelector("#family-1-callout");
        const galleryImages = [...document.querySelectorAll("#family-5-gallery img")];
        const contact = document.querySelector(".uno-json-contact");
        return {
          tops,
          mains: document.querySelectorAll("main").length,
          h1s: document.querySelectorAll("h1").length,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          proseText: (prose?.textContent ?? "").trim(),
          proseVisible: prose === null ? "" : getComputedStyle(prose).visibility,
          calloutText: (callout?.textContent ?? "").trim(),
          calloutTone: callout?.getAttribute("data-uno-tone") ?? "",
          listItems: [...document.querySelectorAll("#family-2-list li")].map((item) => item.textContent?.trim() ?? ""),
          gallerySources: galleryImages.map((image) => image.getAttribute("src") ?? ""),
          galleryAlts: galleryImages.map((image) => image.getAttribute("alt") ?? ""),
          galleryDecoded: galleryImages.map((image) => image.naturalWidth),
          mediaSource: document.querySelector("#family-4-media img")?.getAttribute("src") ?? "",
          mediaAlt: document.querySelector("#family-4-media img")?.getAttribute("alt") ?? "",
          captions: [...document.querySelectorAll("#family-5-gallery figcaption")].map((node) => node.textContent?.trim() ?? ""),
          contactStatus: contact?.querySelector(".uno-json-contact-status")?.textContent ?? "",
          contactControls: contact?.querySelectorAll("form, input, textarea, button").length ?? -1,
          contactHandlers: contact === null ? true : [...contact.querySelectorAll("*")]
            .some((element) => ["action", "method", "href", "onsubmit", "onclick"].some((name) => element.hasAttribute(name))),
          contactHtml: contact?.outerHTML ?? "",
          actionCount: document.querySelectorAll("#family-7-actions a").length,
          divider: (() => {
            const el = document.getElementById("family-8-divider");
            if (el === null) return { found: false };
            const style = getComputedStyle(el);
            const parent = el.parentElement;
            const parentStyle = parent === null ? null : getComputedStyle(parent);
            const previous = el.previousElementSibling;
            const next = el.nextElementSibling;
            const box = el.getBoundingClientRect();
            const previousBox = previous === null ? null : previous.getBoundingClientRect();
            const nextBox = next === null ? null : next.getBoundingClientRect();
            const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const beforeCount = document.body.childElementCount;
            const probe = document.createElement("span");
            probe.style.color = "var(--uno-border)";
            document.body.appendChild(probe);
            const tokenColor = getComputedStyle(probe).color;
            probe.remove();
            return {
              found: true,
              tag: el.tagName,
              childCount: el.childElementCount,
              text: (el.textContent ?? "").trim(),
              parentIsRoot: parent?.classList.contains("uno-json") ?? false,
              parentGap: parentStyle?.rowGap ?? "",
              previousId: previous?.id ?? "",
              nextId: next?.id ?? "",
              marginTop: style.marginTop,
              marginBottom: style.marginBottom,
              borderTopWidth: style.borderTopWidth,
              borderTopStyle: style.borderTopStyle,
              borderTopColor: style.borderTopColor,
              otherBorderWidths: [style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
              tabIndex: el.tabIndex,
              hasTabIndexAttribute: el.hasAttribute("tabindex"),
              role: el.getAttribute("role") ?? "",
              controls: el.querySelectorAll("a, img, button, form, input, textarea, select, iframe").length,
              transitionDuration: style.transitionDuration,
              animationName: style.animationName,
              width: box.width,
              parentWidth: parent?.clientWidth ?? 0,
              spaceBefore: previousBox === null ? null : box.top - previousBox.bottom,
              spaceAfter: nextBox === null ? null : nextBox.top - box.bottom,
              rootFont,
              tokenDefined: getComputedStyle(document.documentElement).getPropertyValue("--uno-border").trim(),
              tokenColor,
              probeCleaned: document.body.childElementCount === beforeCount,
            };
          })(),
          hero: (() => {
            const region = document.querySelector("#family-9-hero");
            return {
              align: region?.getAttribute("data-uno-align") ?? "",
              surface: region?.getAttribute("data-uno-surface") ?? "",
              eyebrow: region?.querySelector(".uno-json-eyebrow")?.textContent ?? "",
              lede: region?.querySelector(".uno-json-hero-lede")?.textContent ?? "",
              support: region?.querySelector(".uno-json-hero-support")?.textContent ?? "",
              anchors: region?.querySelectorAll("a, ul, iframe, button").length ?? -1,
              visible: region === null ? false : region.getBoundingClientRect().height > 0,
            };
          })(),
          stats: (() => {
            const region = document.querySelector("#family-10-stats");
            return {
              dts: [...(region?.querySelectorAll("dt") ?? [])].map((node) => node.textContent ?? ""),
              dds: [...(region?.querySelectorAll("dd") ?? [])].map((node) => node.textContent ?? ""),
              details: region?.querySelectorAll(".uno-json-stat-detail").length ?? -1,
              firstItemDetail: region?.querySelector(".uno-json-stat .uno-json-stat-detail")?.textContent ?? "",
              heading: region?.querySelectorAll("h1, h2, h3, h4, h5, h6").length ?? -1,
            };
          })(),
          steps: (() => {
            const region = document.querySelector("#family-11-steps");
            const items = [...(region?.querySelectorAll("li.uno-json-timeline-item") ?? [])];
            return {
              items: items.length,
              titles: items.map((item) => item.querySelector(".uno-json-timeline-title")?.textContent ?? ""),
              descriptions: region?.querySelectorAll(".uno-json-timeline-description").length ?? -1,
              ariaCurrent: items.filter((item) => item.hasAttribute("aria-current")).length,
              statuses: items.filter((item) => item.hasAttribute("data-uno-status")).length,
              dates: region?.querySelectorAll(".uno-json-timeline-date").length ?? -1,
            };
          })(),
          table: (() => {
            const region = document.querySelector("#family-13-table");
            const wrapper = region?.firstElementChild ?? null;
            return {
              isScroll: region?.classList.contains("uno-json-table-scroll") ?? false,
              focusable: region?.getAttribute("tabindex") ?? "",
              wrapperTag: wrapper?.tagName ?? "",
              wrapperClass: wrapper?.classList.contains("uno-json-table") ?? false,
              captions: [...(region?.querySelectorAll("table > caption") ?? [])].map((node) => node.textContent ?? ""),
              headers: [...(region?.querySelectorAll("thead th") ?? [])].map((node) => ({
                text: node.textContent ?? "", scope: node.getAttribute("scope") ?? "",
              })),
              rows: [...(region?.querySelectorAll("tbody tr") ?? [])].map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent ?? "")),
              links: region?.querySelectorAll("a, img, form, button").length ?? -1,
            };
          })(),
          columns: (() => {
            const region = document.querySelector("#family-14-columns");
            const cells = [...(region?.children ?? [])];
            return {
              isDiv: region?.tagName ?? "",
              columns: region?.getAttribute("data-uno-columns") ?? "",
              semantics: region?.getAttribute("data-uno-item-semantics") ?? "",
              ratio: region?.getAttribute("data-uno-ratio") ?? "",
              cells: cells.length,
              cellsAreCells: cells.every((cell) => cell.classList.contains("uno-json-cell")),
              stacks: cells.map((cell) => cell.firstElementChild?.classList.contains("uno-json-stack") ?? false),
              headings: [...(region?.querySelectorAll("h2.uno-json-heading") ?? [])].map((node) => node.textContent ?? ""),
              paragraphs: [...(region?.querySelectorAll("p.uno-json-prose") ?? [])].map((node) => node.textContent ?? ""),
              listItems: [...(region?.querySelectorAll("ul.uno-json-list > li") ?? [])].map((node) => node.textContent ?? ""),
              h3: region?.querySelectorAll("h3").length ?? -1,
              controls: region?.querySelectorAll("a, input, textarea, button, select, iframe").length ?? -1,
            };
          })(),
          cards: (() => {
            const region = document.querySelector("#family-15-cards");
            const items = [...(region?.children ?? [])];
            return {
              isList: region?.tagName ?? "",
              columns: region?.getAttribute("data-uno-columns") ?? "",
              semantics: region?.getAttribute("data-uno-item-semantics") ?? "",
              ratio: region?.getAttribute("data-uno-ratio") ?? "",
              items: items.length,
              itemsAreCells: items.every((item) => item.classList.contains("uno-json-cell")),
              headings: [...(region?.querySelectorAll("h2.uno-json-heading") ?? [])].map((node) => node.textContent ?? ""),
              paragraphs: [...(region?.querySelectorAll("p.uno-json-prose") ?? [])].map((node) => node.textContent ?? ""),
              articles: region?.querySelectorAll("article").length ?? -1,
              controls: region?.querySelectorAll("a, img, form, button, input").length ?? -1,
            };
          })(),
          features: (() => {
            const region = document.querySelector("#family-16-features");
            const items = [...(region?.children ?? [])];
            return {
              isList: region?.tagName ?? "",
              columns: region?.getAttribute("data-uno-columns") ?? "",
              semantics: region?.getAttribute("data-uno-item-semantics") ?? "",
              ratio: region?.getAttribute("data-uno-ratio") ?? "",
              items: items.length,
              itemsAreCells: items.every((item) => item.classList.contains("uno-json-cell")),
              headings: [...(region?.querySelectorAll("h2.uno-json-heading") ?? [])].map((node) => node.textContent ?? ""),
              paragraphs: [...(region?.querySelectorAll("p.uno-json-prose") ?? [])].map((node) => node.textContent ?? ""),
              articles: region?.querySelectorAll("article").length ?? -1,
              controls: region?.querySelectorAll("a, img, form, button, input").length ?? -1,
            };
          })(),
          tableFocus: (() => {
            const region = document.querySelector("#family-13-table");
            region?.focus();
            return document.activeElement === region;
          })(),
          quote: (() => {
            const region = document.querySelector("#family-12-quote");
            return {
              align: region?.getAttribute("data-uno-align") ?? "",
              surface: region?.getAttribute("data-uno-surface") ?? "",
              figures: region?.querySelectorAll("figure.uno-json-testimonial").length ?? -1,
              quotes: [...(region?.querySelectorAll("blockquote.uno-json-testimonial-quote") ?? [])]
                .map((node) => node.textContent ?? ""),
              captions: region?.querySelectorAll("figcaption.uno-json-testimonial-caption").length ?? -1,
              attribution: region?.querySelector(".uno-json-testimonial-attribution")?.textContent ?? "",
              role: region?.querySelector(".uno-json-testimonial-role")?.textContent ?? "",
              anchors: region?.querySelectorAll("a, iframe, form").length ?? -1,
            };
          })(),
          html: document.documentElement.outerHTML,
        };
      });
      familyCheck(`${width}px seventeen top-level section ids in order`,
        JSON.stringify(seen.tops) === JSON.stringify(FAMILY_IDS), seen.tops.join(","));
      familyCheck(`${width}px one main and one h1`, seen.mains === 1 && seen.h1s === 1, `${seen.mains}/${seen.h1s}`);
      familyCheck(`${width}px no horizontal document overflow`, seen.overflow <= 2, String(seen.overflow));
      familyCheck(`${width}px prose and warning callout are visible`,
        seen.proseText.length > 0 && seen.proseVisible === "visible" && seen.calloutTone === "warning"
          && seen.calloutText.includes("A synthetic warning"),
        JSON.stringify({ proseText: seen.proseText, proseVisible: seen.proseVisible, calloutTone: seen.calloutTone }));
      familyCheck(`${width}px the ordered list shows both authored entries`,
        seen.listItems.length === 2 && seen.listItems[0] === "Prepare" && seen.listItems[1] === "Publish", seen.listItems.join(","));
      const ownedLocator = /^\/uno-media\/en-001\/wo066-family-composition\/\d+$/u;
      familyCheck(`${width}px two gallery images use server-owned locators with alt text`,
        seen.gallerySources.length === 2 && seen.gallerySources.every((source) => ownedLocator.test(source))
          && seen.galleryAlts.every((alt) => alt.trim().length > 0)
          && !seen.html.includes("/assets/wo066-donor-plate.png"),
        JSON.stringify({ gallerySources: seen.gallerySources, galleryAlts: seen.galleryAlts }));
      familyCheck(`${width}px both images decode and the single caption is authored`,
        seen.galleryDecoded.every((value) => value > 0) && seen.captions.length === 1 && seen.captions[0] === "First fixture image",
        JSON.stringify({ decoded: seen.galleryDecoded, captions: seen.captions }));
      familyCheck(`${width}px the media family uses a server-owned locator`,
        ownedLocator.test(seen.mediaSource) && seen.mediaAlt.trim().length > 0, seen.mediaSource);
      familyCheck(`${width}px the contact notice is visible and inert`,
        seen.contactStatus === "Delivery is switched off. Nothing entered here is sent or stored."
          && seen.contactControls === 0 && seen.contactHandlers === false
          && !seen.contactHtml.includes("wo066-contact") && !seen.contactHtml.includes("contactForms"),
        JSON.stringify({ status: seen.contactStatus, controls: seen.contactControls, handlers: seen.contactHandlers }));
      familyCheck(`${width}px the composed actions are two real same-document links`,
        seen.actionCount === 2 && seen.html.includes('href="#family-4-media"') && seen.html.includes('href="#family-6-contactform"'),
        String(seen.actionCount));

      // `UNO-WO-067 / R01`: hero, stats, steps and quote are each verified inside their own composed section only.
      familyCheck(`${width}px hero shows the authored eyebrow, lede and support with no action control`,
        seen.hero.align === "center" && seen.hero.surface === "muted" && seen.hero.visible
          && seen.hero.eyebrow === "Synthetic introduction" && seen.hero.lede === "The composed Page is visible."
          && seen.hero.support === "This is a bounded, original fixture example." && seen.hero.anchors === 0,
        JSON.stringify(seen.hero));
      familyCheck(`${width}px stats show two authored pairs with one detail on the first item`,
        seen.stats.dts.length === 2 && seen.stats.dds.length === 2
          && seen.stats.dts[0] === "Sampled sections" && seen.stats.dts[1] === "New examples"
          && seen.stats.dds[0].replace("Fixture only", "") === "13" && seen.stats.dds[1] === "4"
          && seen.stats.details === 1 && seen.stats.firstItemDetail === "Fixture only" && seen.stats.heading === 0,
        JSON.stringify(seen.stats));
      familyCheck(`${width}px steps show two ordered titles and one description with no invented status`,
        seen.steps.items === 2 && seen.steps.titles[0] === "Draft" && seen.steps.titles[1] === "Review"
          && seen.steps.descriptions === 1 && seen.steps.ariaCurrent === 0 && seen.steps.statuses === 0 && seen.steps.dates === 0,
        JSON.stringify(seen.steps));
      familyCheck(`${width}px quote shows one figure, blockquote and caption with separate attribution and role`,
        seen.quote.figures === 1 && seen.quote.quotes.length === 1
          && seen.quote.quotes[0] === "The fixture does not establish full parity."
          && seen.quote.captions === 1 && seen.quote.attribution === "Synthetic contributor"
          && seen.quote.role === "Reviewer" && seen.quote.align === "center" && seen.quote.surface === "bordered"
          && seen.quote.anchors === 0,
        JSON.stringify(seen.quote));
      // `UNO-WO-068 / R03`: the last four families, each scoped to its own composed region.
      familyCheck(`${width}px table shows a captioned two-column table and its wrapper takes focus`,
        seen.table.isScroll && seen.table.focusable === "0" && seen.tableFocus
          && seen.table.wrapperTag === "TABLE" && seen.table.wrapperClass
          && JSON.stringify(seen.table.captions) === JSON.stringify(["Synthetic table"])
          && JSON.stringify(seen.table.headers) === JSON.stringify([
            { text: "Phase", scope: "col" }, { text: "Count", scope: "col" },
          ])
          && JSON.stringify(seen.table.rows) === JSON.stringify([["First", "1"], ["Second", "2"]])
          && seen.table.links === 0,
        JSON.stringify(seen.table));
      familyCheck(`${width}px columns show two authored tight stacks with one paragraph and one native list`,
        seen.columns.isDiv === "DIV" && seen.columns.columns === "2" && seen.columns.semantics === "plain"
          && seen.columns.ratio === "start-wide" && seen.columns.cells === 2 && seen.columns.cellsAreCells
          && seen.columns.stacks.every(Boolean)
          && JSON.stringify(seen.columns.headings) === JSON.stringify(["Left column", "Right column"])
          && JSON.stringify(seen.columns.paragraphs) === JSON.stringify(["The left text."])
          && JSON.stringify(seen.columns.listItems) === JSON.stringify(["Check one", "Check two"])
          && seen.columns.h3 === 0 && seen.columns.controls === 0,
        JSON.stringify(seen.columns));
      familyCheck(`${width}px cards show a native two-column list grid with exactly one authored body`,
        seen.cards.isList === "UL" && seen.cards.columns === "2" && seen.cards.semantics === "list"
          && seen.cards.ratio === "" && seen.cards.items === 2 && seen.cards.itemsAreCells
          && JSON.stringify(seen.cards.headings) === JSON.stringify(["Card one", "Card two"])
          && JSON.stringify(seen.cards.paragraphs) === JSON.stringify(["First card body."])
          && seen.cards.articles === 0 && seen.cards.controls === 0,
        JSON.stringify(seen.cards));
      familyCheck(`${width}px features show a separate native three-column list grid with one authored body`,
        seen.features.isList === "UL" && seen.features.columns === "3" && seen.features.semantics === "list"
          && seen.features.ratio === "" && seen.features.items === 2 && seen.features.itemsAreCells
          && JSON.stringify(seen.features.headings) === JSON.stringify(["Feature one", "Feature two"])
          && JSON.stringify(seen.features.paragraphs) === JSON.stringify(["First feature body."])
          && seen.features.articles === 0 && seen.features.controls === 0,
        JSON.stringify(seen.features));
      // `UNO-WO-069 / R01`: the divider region, measured in the real browser at this viewport.
      const gap = parseFloat(seen.divider.parentGap ?? "NaN");
      const marginTop = parseFloat(String(seen.divider.marginTop).replace("px", ""));
      const marginBottom = parseFloat(String(seen.divider.marginBottom).replace("px", ""));
      const expectedOffset = 2.5 * seen.divider.rootFont;
      const near = (value, wanted, tolerance) => Number.isFinite(value) && Math.abs(value - wanted) <= tolerance;
      dividerCheck(`${width}px divider is one native non-focusable hr directly in a 1.5rem flex column`,
        seen.divider.found === true
          && seen.divider.tag === "HR"
          && seen.divider.parentIsRoot === true
          && near(gap, 1.5 * seen.divider.rootFont, 0.5)
          && seen.divider.tabIndex === -1
          && seen.divider.hasTabIndexAttribute === false
          && seen.divider.role === ""
          && seen.divider.controls === 0
          && seen.divider.childCount === 0
          && seen.divider.text === ""
          && seen.divider.probeCleaned === true,
        JSON.stringify({ tag: seen.divider.tag, gap, rootFont: seen.divider.rootFont, role: seen.divider.role }));
      dividerCheck(`${width}px divider is a 1px theme-token rule with 1rem margins and 2.5rem separation each side`,
        seen.divider.borderTopWidth === "1px"
          && seen.divider.borderTopStyle === "solid"
          && seen.divider.otherBorderWidths.every((value) => value === "0px")
          && seen.divider.borderTopColor === seen.divider.tokenColor
          && seen.divider.borderTopColor !== "rgba(0, 0, 0, 0)"
          && seen.divider.tokenDefined.length > 0
          && near(marginTop, seen.divider.rootFont, 0.5)
          && near(marginBottom, seen.divider.rootFont, 0.5)
          && near(seen.divider.spaceBefore, expectedOffset, 1.5)
          && near(seen.divider.spaceAfter, expectedOffset, 1.5)
          && seen.divider.transitionDuration === "0s"
          && seen.divider.animationName === "none"
          && near(seen.divider.width, seen.divider.parentWidth, 1.5),
        JSON.stringify({
          border: `${seen.divider.borderTopWidth} ${seen.divider.borderTopStyle} ${seen.divider.borderTopColor}`,
          token: seen.divider.tokenColor,
          margins: [marginTop, marginBottom],
          spaces: [seen.divider.spaceBefore, seen.divider.spaceAfter],
          expected: expectedOffset,
        }));
      dividerCheck(`${width}px divider sits exactly between the actions and hero siblings`,
        seen.divider.previousId === "family-7-actions" && seen.divider.nextId === "family-9-hero",
        `${seen.divider.previousId}/${seen.divider.nextId}`);
      familyCheck(`${width}px the composed Page carries seventeen unique top-level sections with no nested inflation`,

        seen.tops.length === 17 && new Set(seen.tops).size === 17
          && seen.mains === 1 && seen.h1s === 1 && seen.overflow === 0,
        `${seen.tops.length}/${new Set(seen.tops).size} mains=${seen.mains} h1=${seen.h1s} overflow=${seen.overflow}`);

      const familySummary = tab.locator("#family-3-faq summary").first();
      const familyDetails = tab.locator("#family-3-faq details").first();
      await familySummary.focus();
      familyCheck(`${width}px the FAQ summary takes keyboard focus`,
        await familySummary.evaluate((element) => document.activeElement === element));
      await tab.keyboard.press("Enter");
      familyCheck(`${width}px Enter opens the FAQ disclosure`, await familyDetails.evaluate((element) => element.open),
        String(await familyDetails.evaluate((element) => element.open)));
      await tab.keyboard.press("Space");
      familyCheck(`${width}px Space closes the FAQ disclosure and keeps focus`,
        !(await familyDetails.evaluate((element) => element.open))
          && await familySummary.evaluate((element) => document.activeElement === element),
        String(await familyDetails.evaluate((element) => element.open)));

      await tab.getByRole("link", { name: "Contact notice", exact: true }).click();
      await delay(200);
      const reached = await tab.evaluate(() => ({
        hash: window.location.hash,
        path: window.location.pathname,
        targetVisible: (() => {
          const target = document.getElementById("family-6-contactform");
          return target !== null && target.getBoundingClientRect().height > 0;
        })(),
      }));
      familyCheck(`${width}px the contact action stays in the same document and reaches its target`,
        reached.hash === "#family-6-contactform" && reached.path === "/en-001/wo066-family-composition" && reached.targetVisible,
        JSON.stringify(reached));
      familyCheck(`${width}px the family visit made no foreign or provider request`,
        requests.length === 0 && requests.every((entry) => !entry.foreign && !entry.provider), JSON.stringify(requests.slice(0, 3)));
    }
    // `UNO-WO-069 / R01`: the same separator invariants under `prefers-color-scheme: dark` and
    // `prefers-reduced-motion: reduce`, at both viewports, then the regular media settings are restored.
    for (const width of [390, 1280]) {
      requests.length = 0;
      await tab.setViewportSize({ width, height: 900 });
      await tab.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await tab.goto(FAMILY_URL, { waitUntil: "load" });
      await delay(300);
      const dark = await tab.evaluate(() => {
        const el = document.getElementById("family-8-divider");
        if (el === null) return { found: false };
        const style = getComputedStyle(el);
        const parent = el.parentElement;
        const box = el.getBoundingClientRect();
        const previous = el.previousElementSibling;
        const next = el.nextElementSibling;
        const previousBox = previous === null ? null : previous.getBoundingClientRect();
        const nextBox = next === null ? null : next.getBoundingClientRect();
        const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const probe = document.createElement("span");
        probe.style.color = "var(--uno-border)";
        document.body.appendChild(probe);
        const tokenColor = getComputedStyle(probe).color;
        probe.remove();
        return {
          found: true,
          scheme: matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          tag: el.tagName,
          role: el.getAttribute("role") ?? "",
          tabIndex: el.tabIndex,
          borderTopWidth: style.borderTopWidth,
          borderTopStyle: style.borderTopStyle,
          borderTopColor: style.borderTopColor,
          otherBorderWidths: [style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
          marginTop: parseFloat(style.marginTop),
          marginBottom: parseFloat(style.marginBottom),
          parentGap: parseFloat(parent === null ? "NaN" : getComputedStyle(parent).rowGap),
          spaceBefore: previousBox === null ? null : box.top - previousBox.bottom,
          spaceAfter: nextBox === null ? null : nextBox.top - box.bottom,
          transitionDuration: style.transitionDuration,
          animationName: style.animationName,
          rootFont,
          tokenDefined: getComputedStyle(document.documentElement).getPropertyValue("--uno-border").trim(),
          tokenColor,
          mains: document.querySelectorAll("main").length,
          h1s: document.querySelectorAll("h1").length,
        };
      });
      dividerCheck(`dark ${width}px divider keeps its native role, 1px theme rule and no focus or motion`,
        dark.found === true
          && dark.scheme === true
          && dark.reducedMotion === true
          && dark.tag === "HR"
          && dark.role === ""
          && dark.tabIndex === -1
          && dark.borderTopWidth === "1px"
          && dark.borderTopStyle === "solid"
          && dark.borderTopColor === dark.tokenColor
          && dark.borderTopColor !== "rgba(0, 0, 0, 0)"
          && dark.tokenDefined.length > 0
          && dark.otherBorderWidths.every((value) => value === "0px")
          // Under `prefers-reduced-motion: reduce` the stylesheet clamps transitions to an effectively zero duration
          // (measured `1e-05s`), so the truthful assertion is "no perceptible transition and no animation", not the
          // literal `0s` the default scheme reports.
          && parseFloat(dark.transitionDuration) <= 1e-4
          && dark.animationName === "none"
          && dark.mains === 1
          && dark.h1s === 1,
        JSON.stringify({
          scheme: dark.scheme, motion: dark.reducedMotion, border: `${dark.borderTopWidth} ${dark.borderTopColor}`,
          token: dark.tokenColor, transition: dark.transitionDuration, animation: dark.animationName,
        }));
      dividerCheck(`dark ${width}px divider keeps 1rem margins and 2.5rem separation on both sides`,
        Math.abs(dark.marginTop - dark.rootFont) <= 0.5
          && Math.abs(dark.marginBottom - dark.rootFont) <= 0.5
          && Math.abs(dark.parentGap - 1.5 * dark.rootFont) <= 0.5
          && Math.abs(dark.spaceBefore - 2.5 * dark.rootFont) <= 1.5
          && Math.abs(dark.spaceAfter - 2.5 * dark.rootFont) <= 1.5,
        JSON.stringify({
          margins: [dark.marginTop, dark.marginBottom], gap: dark.parentGap,
          spaces: [dark.spaceBefore, dark.spaceAfter], rootFont: dark.rootFont,
        }));
      dividerCheck(`dark ${width}px divider visit made no foreign or provider request`,
        requests.length === 0 && requests.every((entry) => !entry.foreign && !entry.provider),
        JSON.stringify(requests.slice(0, 3)));
    }
    await tab.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
    familyCheck("the family Page raised no new console or page error", consoleErrors.length === errorsBefore,
      consoleErrors.slice(errorsBefore).join(" | ").slice(0, 180));
    check("FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px", familyOk);
    // `UNO-WO-069 / R01`: the divider parity gate. It depends on every executed divider check (three per light viewport
    // and three per dark/reduced-motion viewport) AND on the surrounding family gates, so no single label can stand
    // in for the evidence.
    check(
      "DIVIDER_PARITY=PASS the divider passed source, HTTP and light/dark Chromium evidence",
      dividerOk === true && familyOk === true && dividerChecks === 12,
      `checks=${dividerChecks} dividerOk=${dividerOk} familyOk=${familyOk}`,
    );
  }

  check("the Page logged no console error", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
}

let exitCode = 1;
try {
  const outcome = await main();
  if (typeof outcome === "string") {
    await consentPhase(outcome);
    exitCode = 0;
  } else {
    exitCode = outcome;
  }
} catch (error) {
  check("the gate completes without an unexpected failure", false, String(error?.stack ?? error));
  exitCode = 1;
} finally {
  try { if (browser) await browser.close(); } catch { /* best effort */ }
  if (child && child.exitCode === null) { try { child.kill("SIGKILL"); } catch { /* best effort */ } }
  if (transaction) {
    try { await transaction.restore(); } catch (error) { check("the fixture restores", false, String(error)); }
    try { await transaction.dispose(); } catch { /* best effort */ }
  }
  for (const [path, digest] of PINNED_DECLARATIONS) {
    check(`${path} is restored to its committed bytes`, sha256Of(path) === digest, sha256Of(path));
  }
  for (const path of SOURCES) {
    check(`the fixture source ${path} is removed`, !existsSync(resolve(ROOT, path)));
  }
  for (const name of CAPSULE_FILES) {
    try { rmSync(resolve(ROOT, CAPSULE_DIR, name), { force: true }); } catch { /* best effort */ }
    check(`the Page-owned plate ${name} is removed`, !existsSync(resolve(ROOT, CAPSULE_DIR, name)));
  }
  try { rmdirSync(resolve(ROOT, CAPSULE_DIR)); } catch { /* the directory was already absent or not empty */ }
  for (const [relativePath] of createdMedia) {
    try { rmSync(resolve(ROOT, relativePath), { force: true }); } catch { /* best effort */ }
    check(`the owned media fixture ${relativePath} is removed`, !existsSync(resolve(ROOT, relativePath)));
  }
  for (const directory of [THEME_DIR, PLATFORM_DIR, GENERATED_DIR]) {
    try { rmdirSync(resolve(ROOT, directory)); } catch { /* not created by this run, or not empty */ }
  }
  const stagedAtEnd = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: ROOT, encoding: "utf8" });
  check("nothing was staged by the gate", (stagedAtEnd.stdout ?? "").trim() === "");
  process.stdout.write(`\nverify-u04-22-module-consent: ${passes.length} passed, ${failures.length} failed\n`);
  for (const failure of failures) {
    process.stdout.write(`  failed: ${failure.name}${failure.detail ? ` - ${failure.detail}` : ""}\n`);
  }
  process.exitCode = failures.length === 0 ? exitCode : 1;
}

