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
 * `UNO-WO-066 / R01` adds one further ephemeral proof inside this same lifecycle: a nine-family donor subset is composed
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
  const familyComposed = composeUnoFoundationSubset(familySource(), familyBindings());
  const familyAccepted = familyComposed.status === "composed" ? familyComposed.document : null;
  check(
    "FAMILY_COMPOSE_ACCEPTED the real adapter accepts the nine-section source once",
    familyAccepted !== null,
    familyComposed.status === "composed" ? "" : String(familyComposed.reason),
  );
  if (familyAccepted === null) return 1;
  const familyIds = familyAccepted.sections.map((node) => node.id);
  check(
    "FAMILY_COMPOSE_ACCEPTED exact source-index ids and no extra section",
    familyIds.length === 9 && familyIds.every((id, index) => id === FAMILY_IDS[index]),
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
      "FAMILY_HTTP=200 the Page renders the nine authored section ids in document order",
      positions.every((position) => position >= 0) && positions.every((position, index) => index === 0 || position > positions[index - 1]),
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
    const contactStart = familyHtml.indexOf('<section class="uno-json-contact" id="family-6-contactform">');
    const contactMarkup = contactStart < 0 ? "" : familyHtml.slice(contactStart, familyHtml.indexOf("</section>", contactStart));
    check(
      "FAMILY_HTTP=200 the contact section is present with the fixed delivery-OFF status",
      contactStart >= 0
        && contactMarkup.includes('<p class="uno-json-contact-status">Delivery is switched off. Nothing entered here is sent or stored.</p>'),
    );
    check("FAMILY_HTTP=200 the divider is rendered", familyHtml.includes('id="family-8-divider"') && /<hr\b/u.test(familyHtml));
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
          html: document.documentElement.outerHTML,
        };
      });
      familyCheck(`${width}px nine top-level section ids in order`,
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
    familyCheck("the family Page raised no new console or page error", consoleErrors.length === errorsBefore,
      consoleErrors.slice(errorsBefore).join(" | ").slice(0, 180));
    check("FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px", familyOk);
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

