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

function fixturePlan(allModulesJsonBytes, badJsonBytes) {
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
  const plan = fixturePlan(allModulesJsonBytes, badJsonBytes);
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
    if (provider) return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>stub</title>" });
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

