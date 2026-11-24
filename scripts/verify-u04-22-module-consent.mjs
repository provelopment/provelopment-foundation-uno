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
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { deflateSync } from "node:zlib";

import { prepareUnoU03FixtureTransaction } from "./uno-u03-fixture-transaction.mjs";
import { evaluateU04FamilyClosure } from "./verify-u04-family-closure.mjs";
// `UNO-WO-112 / R01`: the cohesive verification modules this entrypoint orchestrates. The fixture, the Hero expectations,
// the seven-dimension record and the process harness each live in one testable file under `scripts/u04/`.
import {
  FAMILY_DONOR_SOURCE,
  FAMILY_IDS,
  FAMILY_PLATE,
  FAMILY_ROUTE,
  composeFamilyFixture,
  familyBindings,
  familySource,
} from "./u04/family-fixture.mjs";
import { conjunction, conjunctionDetail, createFamilyEvidence, isCreditable } from "./u04/family-evidence.mjs";
import { HERO_EXPECTED, HERO_REFUSAL_CASES, heroActionsOf, heroRegionOf, heroServed } from "./u04/hero-evidence.mjs";
import {
  STATS_EXPECTED,
  STATS_REFUSAL_CASES,
  statsNodeProps,
  statsPairsOf,
  statsRegionOf,
  statsServed,
} from "./u04/stats-evidence.mjs";
import {
  STEPS_EXPECTED,
  STEPS_REFUSAL_CASES,
  stepsItemsOf,
  stepsNodeProps,
  stepsRegionOf,
  stepsServed,
} from "./u04/steps-evidence.mjs";
import { freeLoopbackPort, killChild, nextBinPath, runChild, waitForServer } from "./u04/serving-harness.mjs";

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
// `UNO-WO-112 / R01`: `FAMILY_ROUTE`, `FAMILY_PLATE`, `FAMILY_DONOR_SOURCE`, the authored source and its bindings are now
// imported from `scripts/u04/family-fixture.mjs`, where the composition can also be asserted on its own.

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
  [MANIFEST, "b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925"],
  [SELECTION, "58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952"],
]);

const SOURCES = Object.freeze([
  `${CONTENT}/wo044-home.en-001.json`,
  `${CONTENT}/wo044-all-modules.en-001.json`,
  `${CONTENT}/wo044-invalid.en-001.json`,
  `${CONTENT}/wo053-bad-generated.en-001.json`,
  `${CONTENT}/wo066-family-composition.en-001.json`,
  `${CONTENT}/wo108-target.en-001.json`,
]);

// `UNO-WO-084 / R01` (checkpoint A1): where each newly proven family's executed evidence is recorded. Every flag starts
// false and is only set by a check that actually ran, so a deleted probe can never leave a passing label behind.
// `UNO-WO-108 / R01`: the local Table/List evidence dimensions. `UNO-WO-111 / R01` credits both families: the destinations
// themselves are proven under each Site's own authority by the three-Site P6 gate
// (`scripts/verify-u03-multisite-http.mjs`). `UNO-WO-112 / R01` adds the credited Hero's own record, and every record is
// built by the extracted `createFamilyEvidence()` so the seven-dimension contract has exactly one definition.
const localA2 = {
  table: createFamilyEvidence(),
  list: createFamilyEvidence(),
  hero: createFamilyEvidence(),
  stats: createFamilyEvidence(),
  steps: createFamilyEvidence(),
};
// Diagnostics only: the executed refusal codes, so a red `refusal` dimension names its own reason.
let refusalReasons = "";
// `UNO-WO-110 / R01` (§2 `browser`): every key here is added only by a Chromium assertion that actually ran and passed at
// that exact viewport and colour scheme, so `browser` cannot be satisfied by one superficial observation.
const tableBrowserCases = new Set();
// `UNO-WO-111 / R01`: the same keyed conjunction for the credited List — light and dark/reduced-motion at both viewports.
const listBrowserCases = new Set();
// `UNO-WO-112 / R01`: and for the credited Hero, whose Markdown bodies and two static actions must hold in all four cases.
const heroBrowserCases = new Set();
// `UNO-WO-113 / R01`: and for the credited Stats family, whose Markdown lede, Markdown detail and `<dl>` pairs must hold in
// all four cases at both viewports.
const statsBrowserCases = new Set();
// `UNO-WO-114 / R01`: and for the credited Steps family, whose Markdown lede, Markdown body, ordered titles and closed surface
// must hold in all four cases at both viewports.
const stepsBrowserCases = new Set();
const a1Evidence = {
  prose: { source: false, reader: false, renderer: false, http: false, browser: false, refusal: false, rights: true },
  callout: { source: false, reader: false, renderer: false, http: false, browser: false, refusal: false, rights: true },
};

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
                  {
                    // `UNO-WO-108 / R01`: the published same-Site Page that the authored route item resolves to.
                    id: "wo108-target",
                    route: ["wo108-target"],
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(SOURCES[5])])],
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
      {
        // `UNO-WO-108 / R01`: the same-Site published target for the authored route item, installed and removed by the
        // same recovery-armed transaction as the other five fixture sources.
        path: SOURCES[5],
        bytes: Buffer.from(`${JSON.stringify({
          version: 1,
          title: "Synthetic local A2 target",
          visibility: "public",
          sections: [{ id: "body", module: "content.prose", props: { text: "Same-Site published target." } }],
        }, null, 2)}\n`, "utf8"),
      },
    ],
  };
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
  const nextBin = nextBinPath(ROOT);
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
  const familyComposed = composeFamilyFixture(composeUnoFoundationSubset);
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
        && serialized.includes(`"path": "${FAMILY_PLATE}"`)
        // `UNO-WO-084 / R01`: authored Markdown may carry a classified `https` link, but no asset field may be remote.
        && !/"url":\s*"?https?:/u.test(serialized),
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
        // `UNO-WO-112 / R01`: the hero's own matrix now covers its route, unsafe and malformed cases exhaustively; this
        // representative probe keeps one appended-family example of a destination form the composed subset still refuses.
        label: "hero actions with an application link",
        expected: "family:unsupported-feature",
        mutate: (source) => { source.sections[9].actions = [{ label: "Open", link: "help" }]; },
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
    // `UNO-WO-080 / R01`: the three donor heading outlines as composed, plus the closed refusal of any donor field that
    // would try to author its own heading level. The composed document itself is read back so this is not a string claim.
    {
      const composedFamily = familyAccepted;
      const stepsNode = composedFamily?.sections.find((node) => node.id === "family-11-steps");
      const stepsTimeline =
        stepsNode?.module === "layout.stack"
          ? stepsNode.children.find((child) => child.module === "content.timeline")
          : stepsNode;
      const faqNode = composedFamily?.sections.find((node) => node.id === "family-3-faq");
      const faqAccordion =
        faqNode?.module === "layout.stack"
          ? faqNode.children.find((child) => child.module === "interaction.accordion")
          : faqNode;
      const columnsNode = composedFamily?.sections.find((node) => node.id === "family-14-columns");
      const columnTitles =
        columnsNode?.module === "layout.grid"
          ? columnsNode.children.map((column) =>
              column.module === "layout.stack"
                ? column.children.find((child) => child.module === "content.heading")
                : undefined,
            )
          : [];
      const authoredLevelProbe = familySource();
      authoredLevelProbe.sections[14].level = 3;
      const authoredLevelOutcome = composeUnoFoundationSubset(authoredLevelProbe, familyBindings());
      check(
        "FAMILY_OUTLINE_THREE_SOURCE steps, faq and columns compose the documented level-3 item outline and refuse an authored level",
        stepsTimeline?.module === "content.timeline"
          && stepsTimeline.props.itemHeadingLevel === 3
          && stepsTimeline.props.items.length === 2
          && faqAccordion?.module === "interaction.accordion"
          && faqAccordion.props.summaryHeadingLevel === 3
          && faqAccordion.children.length === 1
          && columnTitles.length === 2
          && columnTitles.every((title) => title?.module === "content.heading" && title.props.level === 3)
          && authoredLevelOutcome.status === "refused"
          && authoredLevelOutcome.reason === "family:unsupported-feature"
          && Object.prototype.hasOwnProperty.call(authoredLevelOutcome, "document") === false,
        JSON.stringify({
          steps: stepsTimeline?.module === "content.timeline" ? stepsTimeline.props.itemHeadingLevel : null,
          faq: faqAccordion?.module === "interaction.accordion" ? faqAccordion.props.summaryHeadingLevel : null,
          columns: columnTitles.map((title) => (title?.module === "content.heading" ? title.props.level : null)),
          authoredLevel: authoredLevelOutcome.status === "refused" ? authoredLevelOutcome.reason : authoredLevelOutcome.status,
        }),
      );
    }

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

    // `UNO-WO-071 / R01`: eight further whole-Page refusals over the two newly lede-bearing families, each from a fresh
    // source, plus a zero-invocation accessor probe. Every probe mutates exactly one authored lede.
    const ledeProbes = [
      ["card lede Markdown emphasis", "family:unsupported-feature", (s) => { s.sections[15].lede = "**Bold** lede"; }],
      ["card lede Markdown link", "family:unsupported-feature", (s) => { s.sections[15].lede = "[label](https://example.test)"; }],
      ["card lede markup", "family:unsupported-feature", (s) => { s.sections[15].lede = "<b>bold</b>"; }],
      ["card lede wrong type", "family:unsupported-feature", (s) => { s.sections[15].lede = 7; }],
      ["feature lede blank", "family:target-refused", (s) => { s.sections[16].lede = ""; }],
      ["feature lede padded", "family:target-refused", (s) => { s.sections[16].lede = " Padded lede"; }],
      ["feature lede oversize", "family:target-refused", (s) => { s.sections[16].lede = "x".repeat(4001); }],
      ["feature lede unpaired surrogate", "family:target-refused", (s) => { s.sections[16].lede = "Lead \uD800 tail"; }],
    ].map(([expectedLabel, expected, mutate]) => {
      const ledeSource = familySource();
      mutate(ledeSource);
      const outcome = composeUnoFoundationSubset(ledeSource, familyBindings());
      return {
        label: expectedLabel,
        expected,
        actual: String(outcome.status === "refused" ? outcome.reason : outcome.status),
        partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
      };
    });
    check(
      "FAMILY_LEDE_REFUSALS each lede probe refuses the whole Page with its documented reason and no partial document",
      ledeProbes.every((probe) => probe.actual === probe.expected && probe.partial === false),
      JSON.stringify(ledeProbes),
    );
    const ledeGetterSource = familySource();
    let ledeGetterCalls = 0;
    Object.defineProperty(ledeGetterSource.sections[15], "lede", {
      enumerable: true,
      get() { ledeGetterCalls += 1; return "Read me"; },
    });
    const ledeGetterOutcome = composeUnoFoundationSubset(ledeGetterSource, familyBindings());
    check(
      "FAMILY_LEDE_REFUSALS an authored card lede getter yields family:unsafe-source with zero invocations",
      ledeGetterOutcome.status === "refused" && ledeGetterOutcome.reason === "family:unsafe-source"
        && ledeGetterCalls === 0 && !Object.prototype.hasOwnProperty.call(ledeGetterOutcome, "document"),
      `${String(ledeGetterOutcome.status === "refused" ? ledeGetterOutcome.reason : ledeGetterOutcome.status)} calls=${ledeGetterCalls}`,
    );

    // `UNO-WO-072 / R01`: eight further whole-Page refusals over the two newly authored-text sequence families, plus a
    // zero-invocation accessor probe. Each probe mutates exactly one authored text field.
    const sequenceProbes = [
      ["stats heading Markdown emphasis", "family:unsupported-feature", (s) => { s.sections[10].heading = "**Bold** heading"; }],
      ["stats lede Markdown image", "family:unsupported-feature", (s) => { s.sections[10].lede = "![alt](https://example.test/i.png)"; }],
      ["stats heading markup", "family:unsupported-feature", (s) => { s.sections[10].heading = "<b>bold</b>"; }],
      ["stats lede wrong type", "family:unsupported-feature", (s) => { s.sections[10].lede = 7; }],
      ["steps heading blank", "family:target-refused", (s) => { s.sections[11].heading = ""; }],
      ["steps lede padded", "family:target-refused", (s) => { s.sections[11].lede = " Padded lede"; }],
      ["steps heading oversize", "family:target-refused", (s) => { s.sections[11].heading = "x".repeat(161); }],
      // `UNO-WO-114 / R01`: the steps lede is Markdown-capable now, so a shared-reader refusal replaces the plain-text
      // well-formedness probe (the rich Markdown path is the same one the credited table, list, hero and stats families use).
      ["steps lede markup", "family:unsupported-feature", (s) => { s.sections[11].lede = "<b>bold</b>"; }],
    ].map(([expectedLabel, expected, mutate]) => {
      const sequenceSource = familySource();
      mutate(sequenceSource);
      const outcome = composeUnoFoundationSubset(sequenceSource, familyBindings());
      return {
        label: expectedLabel,
        expected,
        actual: String(outcome.status === "refused" ? outcome.reason : outcome.status),
        partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
      };
    });
    check(
      "FAMILY_STATS_STEPS_REFUSALS each sequence probe refuses the whole Page with its documented reason",
      sequenceProbes.every((probe) => probe.actual === probe.expected && probe.partial === false),
      JSON.stringify(sequenceProbes),
    );
    const sequenceGetterSource = familySource();
    let sequenceGetterCalls = 0;
    Object.defineProperty(sequenceGetterSource.sections[11], "heading", {
      enumerable: true,
      get() { sequenceGetterCalls += 1; return "Read me"; },
    });
    const sequenceGetterOutcome = composeUnoFoundationSubset(sequenceGetterSource, familyBindings());
    check(
      "FAMILY_STATS_STEPS_REFUSALS an authored steps heading getter yields family:unsafe-source with zero invocations",
      sequenceGetterOutcome.status === "refused" && sequenceGetterOutcome.reason === "family:unsafe-source"
        && sequenceGetterCalls === 0 && !Object.prototype.hasOwnProperty.call(sequenceGetterOutcome, "document"),
      `${String(sequenceGetterOutcome.status === "refused" ? sequenceGetterOutcome.reason : sequenceGetterOutcome.status)} calls=${sequenceGetterCalls}`,
    );

    // `UNO-WO-075 / R01`: ten further whole-Page refusals across the five newly authored-text families, plus one
    // zero-invocation accessor probe and one valid-sibling probe. Each probe mutates exactly one authored text field.
    const textFiveProbes = [
      ["prose heading Markdown emphasis", "family:unsupported-feature", (s) => { s.sections[0].heading = "**Bold** heading"; }],
      ["prose lede markup", "family:unsupported-feature", (s) => { s.sections[0].lede = "<b>bold</b>"; }],
      ["callout heading blank", "family:target-refused", (s) => { s.sections[1].heading = ""; }],
      ["callout lede padded", "family:target-refused", (s) => { s.sections[1].lede = " Padded lede"; }],
      ["list heading oversize", "family:target-refused", (s) => { s.sections[2].heading = "x".repeat(161); }],
      ["list lede wrong type", "family:unsupported-feature", (s) => { s.sections[2].lede = 7; }],
      ["faq heading unpaired surrogate", "family:target-refused", (s) => { s.sections[3].heading = "Lead \uD800 tail"; }],
      ["faq lede Markdown link", "family:unsupported-feature", (s) => { s.sections[3].lede = "[label](https://example.test)"; }],
      ["table heading Markdown code", "family:unsupported-feature", (s) => { s.sections[13].heading = "`code` heading"; }],
      ["table lede oversize", "family:target-refused", (s) => { s.sections[13].lede = "y".repeat(4001); }],
    ].map(([expectedLabel, expected, mutate]) => {
      const source = familySource();
      mutate(source);
      const outcome = composeUnoFoundationSubset(source, familyBindings());
      return {
        label: expectedLabel,
        expected,
        actual: String(outcome.status === "refused" ? outcome.reason : outcome.status),
        partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
      };
    });
    check(
      "FAMILY_TEXT_FIVE_REFUSALS each authored-text probe refuses the whole Page with its documented reason",
      textFiveProbes.every((probe) => probe.actual === probe.expected && probe.partial === false),
      JSON.stringify(textFiveProbes),
    );
    const textFiveGetterSource = familySource();
    let textFiveGetterCalls = 0;
    Object.defineProperty(textFiveGetterSource.sections[0], "heading", {
      enumerable: true,
      get() { textFiveGetterCalls += 1; return "Read me"; },
    });
    const textFiveGetterOutcome = composeUnoFoundationSubset(textFiveGetterSource, familyBindings());
    check(
      "FAMILY_TEXT_FIVE_REFUSALS an authored prose heading getter yields family:unsafe-source with zero invocations",
      textFiveGetterOutcome.status === "refused" && textFiveGetterOutcome.reason === "family:unsafe-source"
        && textFiveGetterCalls === 0 && !Object.prototype.hasOwnProperty.call(textFiveGetterOutcome, "document"),
      `${String(textFiveGetterOutcome.status === "refused" ? textFiveGetterOutcome.reason : textFiveGetterOutcome.status)} calls=${textFiveGetterCalls}`,
    );
    const textFiveSiblingSource = familySource();
    textFiveSiblingSource.sections[13].lede = "   ";
    const textFiveSiblingOutcome = composeUnoFoundationSubset(textFiveSiblingSource, familyBindings());
    check(
      "FAMILY_TEXT_FIVE_REFUSALS a whitespace-only table lede refuses the whole Page despite four valid siblings",
      textFiveSiblingOutcome.status === "refused" && textFiveSiblingOutcome.reason === "family:target-refused"
        && !Object.prototype.hasOwnProperty.call(textFiveSiblingOutcome, "document"),
      String(textFiveSiblingOutcome.status === "refused" ? textFiveSiblingOutcome.reason : textFiveSiblingOutcome.status),
    );

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
    // `UNO-WO-084 / R01` (checkpoint A1): source, reader, renderer-contract and refusal evidence for prose + callout.
    {
      const richProse = familyAccepted.sections[0];
      const richCallout = familyAccepted.sections[1];
      a1Evidence.prose.source = richProse !== undefined
        && richProse.id === "family-0-prose"
        && richProse.module === "content.prose"
        && richProse.props.markdown === true
        && richProse.props.heading === "Synthetic prose heading"
        && richProse.props.align === "center"
        && richProse.props.surface === "muted"
        && typeof richProse.props.lede === "string"
        && richProse.props.lede.includes("*emphasis*")
        && typeof richProse.props.text === "string"
        && richProse.props.text.includes("**strong**");
      check(
        "A1_SOURCE the composed family-0-prose carries the authored heading, Markdown lede/body, align and surface",
        a1Evidence.prose.source,
        richProse === undefined ? "missing" : `${richProse.id}/${JSON.stringify(richProse.props)}`,
      );
      a1Evidence.callout.source = richCallout !== undefined
        && richCallout.id === "family-1-callout"
        && richCallout.module === "content.prose"
        && richCallout.props.variant === "callout"
        && richCallout.props.tone === "warning"
        && richCallout.props.heading === "Synthetic callout heading"
        && richCallout.props.markdown === true
        && richCallout.props.align === "start"
        && richCallout.props.surface === "bordered"
        && typeof richCallout.props.text === "string"
        && richCallout.props.text.includes("**bounded**");
      check(
        "A1_SOURCE the composed family-1-callout keeps its tone and carries an inside heading and Markdown body",
        a1Evidence.callout.source,
        richCallout === undefined ? "missing" : `${richCallout.id}/${JSON.stringify(richCallout.props)}`,
      );
      // The real reader re-reads both nodes from the serialized bytes: the document, not the composer's memory, is proof.
      const reread = familyReparsed.accepted === true ? familyReparsed.document.sections : [];
      a1Evidence.prose.reader = a1Evidence.prose.source
        && JSON.stringify(reread[0]?.props) === JSON.stringify(richProse?.props);
      a1Evidence.callout.reader = a1Evidence.callout.source
        && JSON.stringify(reread[1]?.props) === JSON.stringify(richCallout?.props);
      check("A1_READER the real reader re-reads both rich family nodes from the serialized buffer",
        a1Evidence.prose.reader && a1Evidence.callout.reader,
        `prose=${a1Evidence.prose.reader} callout=${a1Evidence.callout.reader}`);
      // The renderer contract: exactly the closed props the rich renderer consumes — no surrogate role, tone or attribute.
      const closedProse = Object.keys(richProse?.props ?? {}).sort().join(",");
      const closedCallout = Object.keys(richCallout?.props ?? {}).sort().join(",");
      a1Evidence.prose.renderer = closedProse === "align,heading,lede,markdown,surface,text";
      a1Evidence.callout.renderer = closedCallout === "align,heading,lede,markdown,surface,text,tone,variant";
      check("A1_RENDERER both rich family nodes carry exactly the closed renderer contract",
        a1Evidence.prose.renderer && a1Evidence.callout.renderer,
        `${closedProse} | ${closedCallout}`);
      // Refusal: a construct Uno cannot render safely refuses the whole source, never printing apparent text.
      const unsafeMarkup = composeUnoFoundationSubset(
        { version: 1, title: "Unsafe markup fixture", sections: [{ type: "prose", body: "Text <b>markup</b>" }] },
        familyBindings(),
      );
      const unsafeImage = composeUnoFoundationSubset(
        { version: 1, title: "Unsafe image fixture", sections: [{ type: "callout", body: "An ![x](https://example.org/i.png)" }] },
        familyBindings(),
      );
      const unsafeScheme = composeUnoFoundationSubset(
        { version: 1, title: "Unsafe scheme fixture", sections: [{ type: "prose", body: "See [x](javascript:alert(1))" }] },
        familyBindings(),
      );
      a1Evidence.prose.refusal = unsafeMarkup.status === "refused" && unsafeScheme.status === "refused";
      a1Evidence.callout.refusal = unsafeImage.status === "refused";
      check(
        "A1_REFUSAL raw markup, an image and a script scheme each refuse the whole source",
        a1Evidence.prose.refusal && a1Evidence.callout.refusal,
        `${unsafeMarkup.status}/${unsafeImage.status}/${unsafeScheme.status}`,
      );
    }
    // `UNO-WO-070 / R01`: the two headed grid families on the composed document itself.
    {
      const outline = (index, type, headingText, columns) => {
        const section = familyAccepted.sections[index];
        if (section === undefined) return { ok: false, detail: `missing index ${index}` };
        const stackOk = section.module === "layout.stack"
          && section.id === `family-${index}-${type}`
          && JSON.stringify(section.props) === "{}"
          && Array.isArray(section.children)
          && section.children.length === 3;
        const detail = `${section.id}/${section.module}/${JSON.stringify(section.props)}`;
        if (!stackOk) return { ok: false, detail };
        const [heading, lede, grid] = section.children;
        const headingOk = heading.module === "content.heading"
          && heading.id === `family-${index}-${type}-heading`
          && JSON.stringify(heading.props) === JSON.stringify({ text: headingText, level: 2 });
        const ledeOk = lede.module === "content.prose"
          && lede.id === `family-${index}-${type}-lede`
          && typeof lede.props.text === "string"
          && lede.props.text.length > 0;
        const gridOk = grid.module === "layout.grid"
          && grid.id === `family-${index}-${type}-grid`
          && JSON.stringify(grid.props) === JSON.stringify({ columns, itemSemantics: "list" })
          && Array.isArray(grid.children)
          && grid.children.length === 2;
        if (!headingOk || !ledeOk || !gridOk) {
          return { ok: false, detail: `${detail} heading=${headingOk} lede=${ledeOk} grid=${gridOk}` };
        }
        const itemsOk = grid.children.every((item, itemIndex) => {
          const title = item.children?.[0];
          const idsOk = item.module === "layout.stack"
            && item.id === `family-${index}-${type}-item-${itemIndex}`
            && JSON.stringify(item.props) === JSON.stringify({ gap: "tight" })
            && title !== undefined
            && title.module === "content.heading"
            && title.id === `family-${index}-${type}-item-${itemIndex}-title`
            && title.props.level === 3;
          const bodyCount = (item.children ?? []).filter((child) => child.module === "content.prose").length;
          return idsOk && bodyCount === (itemIndex === 0 ? 1 : 0);
        });
        return {
          ok: itemsOk && Object.isFrozen(section) && Object.isFrozen(grid) && Object.isFrozen(section.children),
          detail,
        };
      };
      const cards = outline(15, "cards", "Synthetic cards", 2);
      const features = outline(16, "features", "Synthetic features", 3);
      check(
        "FAMILY_ITEM_OUTLINE_SOURCE cards compose one frozen top-level stack with an authored h2 before a nested list grid of level-3 item titles",
        cards.ok,
        cards.detail,
      );
      check(
        "FAMILY_ITEM_OUTLINE_SOURCE features compose the same stack, authored h2 and nested level-3 item outline",
        features.ok,
        features.detail,
      );
      const topIds = familyAccepted.sections.map((section) => section.id);
      check(
        "FAMILY_ITEM_OUTLINE_SOURCE the seventeen top-level ids and all other fifteen families are unchanged",
        JSON.stringify(topIds) === JSON.stringify(FAMILY_IDS)
          && familyAccepted.sections[8]?.module === "content.prose"
          && JSON.stringify(familyAccepted.sections[8]?.props) === JSON.stringify({ variant: "divider" })
          && familyAccepted.sections[7]?.module === "content.actions"
          && familyAccepted.sections[9]?.module === "content.hero",
        topIds.join(","),
      );
      const reCards = familyReparsed.accepted === true ? familyReparsed.document.sections[15] : undefined;
      const reFeatures = familyReparsed.accepted === true ? familyReparsed.document.sections[16] : undefined;
      check(
        "FAMILY_ITEM_OUTLINE_SOURCE the real reader re-accepts both headed families from the serialized JSON",
        reCards?.module === "layout.stack"
          && reFeatures?.module === "layout.stack"
          && reCards?.children?.[0]?.props?.level === 2
          && reFeatures?.children?.[0]?.props?.level === 2
          && reCards?.children?.[2]?.children?.every((item) => item.children?.[0]?.props?.level === 3) === true
          && reFeatures?.children?.[2]?.children?.every((item) => item.children?.[0]?.props?.level === 3) === true,
        `${reCards?.module ?? "missing"}/${reFeatures?.module ?? "missing"}`,
      );
    }
    // `UNO-WO-071 / R01`: the two authored plain-text ledes on the composed document and the installed buffer.
    {
      const ledeEvidence = (index, type, expectedText) => {
        const section = familyAccepted.sections[index];
        if (section === undefined || section.module !== "layout.stack") return { ok: false, detail: `missing ${index}` };
        const [heading, lede, grid] = section.children ?? [];
        const shapeOk = section.id === `family-${index}-${type}`
          && JSON.stringify(section.props) === "{}"
          && (section.children ?? []).length === 3
          && heading?.module === "content.heading"
          && heading?.props?.level === 2
          && lede?.module === "content.prose"
          && lede?.id === `family-${index}-${type}-lede`
          && JSON.stringify(lede?.props) === JSON.stringify({ text: expectedText })
          && grid?.module === "layout.grid"
          && grid?.id === `family-${index}-${type}-grid`
          && grid?.props?.itemSemantics === "list";
        const itemsOk = grid?.children?.every((item) => item?.children?.[0]?.props?.level === 3) === true;
        return {
          ok: shapeOk && itemsOk && Object.isFrozen(section) && Object.isFrozen(section.children) && Object.isFrozen(lede?.props),
          detail: `${section.id} children=${(section.children ?? []).length} lede=${String(lede?.props?.text ?? "missing")}`,
        };
      };
      const cardsLede = ledeEvidence(15, "cards", "Synthetic cards explain the choices.");
      const featuresLede = ledeEvidence(16, "features", "Synthetic features describe the work.");
      check(
        "FAMILY_LEDE_SOURCE cards compose exactly one lede paragraph in the ordered heading, lede and grid stack",
        cardsLede.ok,
        cardsLede.detail,
      );
      check(
        "FAMILY_LEDE_SOURCE features compose exactly one lede paragraph in the same ordered stack",
        featuresLede.ok,
        featuresLede.detail,
      );
      const ledeIds = familyAccepted.sections.map((section) => section.id);
      check(
        "FAMILY_LEDE_SOURCE the ledes add no node outside the two families and keep the seventeen top-level ids",
        JSON.stringify(ledeIds) === JSON.stringify(FAMILY_IDS)
          // `UNO-WO-075 / R01` wraps five further families, so the fixture now holds nine top-level stacks.
          && familyAccepted.sections.filter((section) => section.module === "layout.stack").length === 7
          && familyAccepted.sections[8]?.id === "family-8-divider"
          && JSON.stringify(familyAccepted.sections[8]?.props) === JSON.stringify({ variant: "divider" }),
        `${ledeIds.length}/${ledeIds.join(",")}`,
      );
      const ledeSource = familySource();
      const ledeSourceSnapshot = JSON.stringify(ledeSource);
      const recomposed = composeUnoFoundationSubset(ledeSource, familyBindings());
      check(
        "FAMILY_LEDE_SOURCE the composed JSON matches the installed buffer and the caller source is unmutated",
        recomposed.status === "composed"
          && JSON.stringify(recomposed.document) === JSON.stringify(familyAccepted)
          && JSON.stringify(ledeSource) === ledeSourceSnapshot
          && familyJsonBytes.toString("utf8") === `${JSON.stringify(familyAccepted, null, 2)}\n`
          && JSON.parse(familyJsonBytes.toString("utf8")).sections.length === 17
          && familyReparsed.accepted === true,
        recomposed.status === "composed" ? `${familyJsonBytes.length}B` : String(recomposed.reason),
      );
    }
    // `UNO-WO-072 / R01`: the authored heading and lede on the two bounded sequence families.
    {
      const sequenceEvidence = (index, type, childSuffix, expectedHeading, expectedLedeProps, expectedChildModule, expectedChildProps) => {
        const section = familyAccepted.sections[index];
        const expectedChild = { id: `family-${index}-${type}-${childSuffix}`, module: expectedChildModule, props: expectedChildProps };
        const shapeOk = section !== undefined
          && section.module === "layout.stack"
          && section.id === `family-${index}-${type}`
          && JSON.stringify(section.props) === "{}"
          && (section.children ?? []).length === 3
          && section.children[0]?.module === "content.heading"
          && section.children[0]?.id === `family-${index}-${type}-heading`
          && JSON.stringify(section.children[0]?.props) === JSON.stringify({ text: expectedHeading, level: 2 })
          && section.children[1]?.module === "content.prose"
          && section.children[1]?.id === `family-${index}-${type}-lede`
          && JSON.stringify(section.children[1]?.props) === JSON.stringify(expectedLedeProps)
          && JSON.stringify(section.children[2]) === JSON.stringify(expectedChild);
        return {
          ok: shapeOk && Object.isFrozen(section) && Object.isFrozen(section.children),
          detail: shapeOk ? `${section.id} ok` : `${String(section?.id)} ${JSON.stringify(section?.children?.map((child) => child.id))}`,
        };
      };
      // `UNO-WO-113 / R01`: the stats family now composes the donor's Markdown-capable lede and its own closed `surface`, so
      // its expected lede props and native node props come from the extracted stats module rather than being retyped here.
      const statsEvidence = sequenceEvidence(
        10, "stats", "stats", STATS_EXPECTED.heading,
        { text: STATS_EXPECTED.lede, markdown: true },
        "content.stats", statsNodeProps(),
      );
      const stepsEvidence = sequenceEvidence(
        11, "steps", "timeline", STEPS_EXPECTED.heading,
        { text: STEPS_EXPECTED.lede, markdown: true },
        "content.timeline", stepsNodeProps(),
      );
      check(
        "FAMILY_STATS_STEPS_SOURCE stats compose one authored heading and lede before the unchanged stat list",
        statsEvidence.ok,
        statsEvidence.detail,
      );
      check(
        "FAMILY_STATS_STEPS_SOURCE steps compose the same ordered text before the unchanged timeline node",
        stepsEvidence.ok,
        stepsEvidence.detail,
      );
      check(
        "FAMILY_STATS_STEPS_SOURCE the authored-text families keep the seventeen ids and no other family changes",
        JSON.stringify(familyAccepted.sections.map((section) => section.id)) === JSON.stringify(FAMILY_IDS)
          && familyAccepted.sections.filter((section) => section.module === "layout.stack").length === 7
          && familyAccepted.sections[7]?.module === "content.actions"
          && familyAccepted.sections[8]?.id === "family-8-divider"
          && familyAccepted.sections[12]?.module === "content.testimonials",
        `${familyAccepted.sections.filter((section) => section.module === "layout.stack").length} stacks`,
      );
      const sequenceSource = familySource();
      const sequenceSnapshot = JSON.stringify(sequenceSource);
      const recomposedSequence = composeUnoFoundationSubset(sequenceSource, familyBindings());
      check(
        "FAMILY_STATS_STEPS_SOURCE the sequence JSON matches the installed buffer and the caller source is unmutated",
        recomposedSequence.status === "composed"
          && JSON.stringify(recomposedSequence.document) === JSON.stringify(familyAccepted)
          && JSON.stringify(sequenceSource) === sequenceSnapshot
          && familyJsonBytes.toString("utf8") === `${JSON.stringify(familyAccepted, null, 2)}\n`
          && familyReparsed.accepted === true,
        recomposedSequence.status === "composed" ? `${familyJsonBytes.length}B` : String(recomposedSequence.reason),
      );
    // `UNO-WO-075 / R01`: the five newly authored-text families as composed, one scoped check per family plus a
    // whole-Page summary. The native child is compared against the adapter's own output for the same source with the two
    // authored fields removed, so "the original node is unchanged apart from its documented id" is measured, not asserted.
    {
      const TEXT_FIVE = [
        [2, "list", "list"],
        [3, "faq", "accordion"],
        [13, "table", "table"],
      ];
      // `UNO-WO-108 / R01` (R1): the rich families intentionally compose a heading-only outer stack (two children) and
      // carry the Markdown lede inside their native node, so the earlier three-child heading/plain-lede/native equality
      // is retained verbatim for the unchanged FAQ at index 3 and replaced by field-level proof for indices 2 and 13.
      const richItemKeys = (item) => Object.keys(item ?? {}).sort().join(",");
      const richFieldsOk = (index, child) => {
        const props = child?.props ?? {};
        const surface = index === 2 ? "bordered" : "muted";
        const common = props.variant === (index === 2 ? "list" : "table")
          && props.markdown === true
          && props.lede === (index === 2
            ? "A **bounded list** on one published Page."
            : "The **table** explains synthetic totals.")
          && props.surface === surface
          && Object.isFrozen(props);
        if (index === 2) {
          const items = props.items ?? [];
          return common
            && props.ordered === true
            && items.length === 4
            && richItemKeys(items[0]) === "label" && items[0].label === "Prepare"
            && items[1].label === "Reference"
            && items[1].href === "https://example.org/notes"
            && items[1].detail === "An *authored* note."
            && richItemKeys(items[2]) === "detail,label,routeTarget"
            && items[2].routeTarget === "wo108-target"
            && items[2].detail === "A **published** Page."
            && richItemKeys(items[3]) === "label,linkId"
            && items[3].linkId === "help"
            && items[3].label === "Help unavailable"
            && items.every((item) => typeof item.url !== "string");
        }
        return common
          && JSON.stringify(props.columns) === JSON.stringify(["Phase", "Count"])
          && JSON.stringify(props.rows) === JSON.stringify([["First", "1"], ["Second", "2"]])
          && props.caption === "Two **synthetic** records";
      };
      const textFiveEvidence = TEXT_FIVE.map(([index, type, suffix]) => {
        const id = `family-${index}-${type}`;
        const rich = index === 2 || index === 13;
        const source = familySource();
        const section = familyAccepted.sections[index];
        const headingText = source.sections[index].heading;
        const ledeText = source.sections[index].lede;
        const nativeOnly = familySource();
        delete nativeOnly.sections[index].heading;
        delete nativeOnly.sections[index].lede;
        const nativeOutcome = composeUnoFoundationSubset(nativeOnly, familyBindings());
        const nativeChild = nativeOutcome.status === "composed" ? nativeOutcome.document.sections[index] : null;
        const expected = nativeChild === null ? null : JSON.parse(JSON.stringify(nativeChild));
        if (expected !== null) expected.id = `${id}-${suffix}`;
        const child = (section?.children ?? [])[rich ? 1 : 2];
        const common = section?.module === "layout.stack"
          && section.id === id
          && JSON.stringify(section.props) === "{}"
          && (section.children ?? []).length === (rich ? 2 : 3)
          && section.children[0]?.module === "content.heading"
          && section.children[0]?.id === `${id}-heading`
          && JSON.stringify(section.children[0]?.props) === JSON.stringify({ text: headingText, level: 2 })
          && Object.isFrozen(section)
          && Object.isFrozen(section.children)
          && section.children.every((node) => Object.isFrozen(node) && Object.isFrozen(node.props));
        const richOK = child?.module === "content.prose"
          && child.id === `${id}-${suffix}`
          && richFieldsOk(index, child);
        const faqLede = (section?.children ?? [])[1];
        const faqExactOK = faqLede?.module === "content.prose"
          && faqLede.id === `${id}-lede`
          && JSON.stringify(faqLede.props) === JSON.stringify({ text: ledeText })
          && section.children[2]?.id === `${id}-${suffix}`
          && expected !== null
          && JSON.stringify(section.children[2]) === JSON.stringify(expected);
        const shapeOk = common && (rich ? richOK : faqExactOK);
        return {
          id,
          ok: shapeOk,
          detail: shapeOk ? `${id} ok` : `${id} ${JSON.stringify(section?.children?.map((node) => node.id))}`,
        };
      });
      for (const evidence of textFiveEvidence) {
        check(
          `FAMILY_TEXT_FIVE_SOURCE ${evidence.id} composes one frozen stack with the authored heading, the authored lede and the unchanged native node`,
          evidence.ok,
          evidence.detail,
        );
      }
      // `UNO-WO-108 / R01` (R4 + §4): the local dimensions start with the adapter's own accepted source.
      localA2.list.source = textFiveEvidence.find((evidence) => evidence.id === "family-2-list")?.ok === true;
      localA2.table.source = textFiveEvidence.find((evidence) => evidence.id === "family-13-table")?.ok === true;
      // `UNO-WO-112 / R01`: the hero's own accepted composition — one native `content.hero` carrying the two Markdown body
      // fields, the closed switch and exactly the two approved static actions.
      localA2.hero.source = familyAccepted.sections[9]?.module === "content.hero"
        && familyAccepted.sections[9]?.id === HERO_EXPECTED.id
        && familyAccepted.sections[9]?.props?.markdown === true
        && JSON.stringify(familyAccepted.sections[9]?.props?.actions) === JSON.stringify(HERO_EXPECTED.actions);
      // `UNO-WO-113 / R01`: the stats family's accepted composition — one authored stack whose heading precedes the
      // Markdown-capable lede and the native stats node carrying the donor's `surface` and Markdown detail switch.
      localA2.stats.source = familyAccepted.sections[10]?.module === "layout.stack"
        && familyAccepted.sections[10]?.id === STATS_EXPECTED.id
        && familyAccepted.sections[10]?.children?.[0]?.id === `${STATS_EXPECTED.id}-heading`
        && JSON.stringify(familyAccepted.sections[10]?.children?.[1]?.props)
          === JSON.stringify({ text: STATS_EXPECTED.lede, markdown: true })
        && JSON.stringify(familyAccepted.sections[10]?.children?.[2]?.props) === JSON.stringify(statsNodeProps());
      // `UNO-WO-114 / R01`: the steps family's accepted composition — one authored stack whose heading precedes the
      // Markdown-capable lede and the native timeline node carrying the closed surface, the level-3 outline and Markdown bodies.
      localA2.steps.source = familyAccepted.sections[11]?.module === "layout.stack"
        && familyAccepted.sections[11]?.id === STEPS_EXPECTED.id
        && familyAccepted.sections[11]?.children?.[0]?.id === `${STEPS_EXPECTED.id}-heading`
        && JSON.stringify(familyAccepted.sections[11]?.children?.[1]?.props)
          === JSON.stringify({ text: STEPS_EXPECTED.lede, markdown: true })
        && JSON.stringify(familyAccepted.sections[11]?.children?.[2]?.props) === JSON.stringify(stepsNodeProps());
      // `UNO-WO-108 / R01` (R4): the strict reader is compared field by field, because a re-read record may order its own
      // keys differently. The composed props and the re-read props must still describe exactly the same authored surface.
      {
        const composedOf = (index) => familyAccepted.sections[index]?.children?.[1]?.props;
        const rereadOf = (index) => (familyReparsed.accepted === true
          ? familyReparsed.document.sections[index]?.children?.[1]?.props
          : null);
        const composedList = composedOf(2);
        const rereadList = rereadOf(2);
        const composedTable = composedOf(13);
        const rereadTable = rereadOf(13);
        const sameKeys = (actual, expected) => JSON.stringify(Object.keys(actual ?? {}).sort())
          === JSON.stringify(Object.keys(expected ?? {}).sort());
        const listItems = rereadList?.items ?? [];
        const listReaderOk = rereadList !== null
          && rereadList.variant === "list"
          && rereadList.surface === "bordered"
          && rereadList.markdown === true
          && rereadList.lede === "A **bounded list** on one published Page."
          && rereadList.ordered === true
          && listItems.length === 4
          && JSON.stringify(listItems[0]) === "{\"label\":\"Prepare\"}"
          && listItems[1]?.href === "https://example.org/notes"
          && listItems[1]?.detail === "An *authored* note."
          && listItems[2]?.routeTarget === "wo108-target"
          && listItems[2]?.detail === "A **published** Page."
          && listItems[2]?.url === undefined && listItems[2]?.href === undefined
          && listItems[3]?.linkId === "help"
          && Object.keys(listItems[3] ?? {}).sort().join(",") === "label,linkId"
          && sameKeys(rereadList, composedList)
          && Object.isFrozen(familyReparsed.document);
        const tableReaderOk = rereadTable !== null
          && rereadTable.variant === "table"
          && rereadTable.surface === "muted"
          && rereadTable.markdown === true
          && rereadTable.lede === "The **table** explains synthetic totals."
          && rereadTable.caption === "Two **synthetic** records"
          && JSON.stringify(rereadTable.columns) === JSON.stringify(["Phase", "Count"])
          && JSON.stringify(rereadTable.rows) === JSON.stringify([["First", "1"], ["Second", "2"]])
          && sameKeys(rereadTable, composedTable)
          && Object.isFrozen(familyReparsed.document);
        localA2.list.reader = listReaderOk;
        localA2.table.reader = tableReaderOk;
        // `UNO-WO-112 / R01`: the hero is one native node rather than a stack, so its re-read props are compared field by
        // field against what was authored — including both actions' exact static destinations and closed variants.
        const composedHero = familyAccepted.sections[9]?.props;
        const rereadHero = familyReparsed.accepted === true ? familyReparsed.document.sections[9]?.props : null;
        const rereadHeroActions = rereadHero?.actions ?? [];
        const heroReaderOk = rereadHero !== null
          && familyReparsed.accepted === true
          && familyReparsed.document.sections[9]?.module === "content.hero"
          && rereadHero.eyebrow === HERO_EXPECTED.eyebrow
          && rereadHero.lede === HERO_EXPECTED.lede
          && rereadHero.support === HERO_EXPECTED.support
          && rereadHero.markdown === true
          && rereadHero.align === HERO_EXPECTED.align
          && rereadHero.surface === HERO_EXPECTED.surface
          && rereadHeroActions.length === HERO_EXPECTED.actions.length
          && HERO_EXPECTED.actions.every((action, index) =>
            rereadHeroActions[index]?.label === action.label
            && rereadHeroActions[index]?.href === action.href
            && rereadHeroActions[index]?.variant === action.variant
            && rereadHeroActions[index]?.targetId === undefined)
          && sameKeys(rereadHero, composedHero)
          && Object.isFrozen(familyReparsed.document);
        localA2.hero.reader = heroReaderOk;
        // `UNO-WO-113 / R01`: the strict reader round-trip of the stats family — the Markdown-lede child re-reads with its own
        // switch, and the native node re-reads with exactly the authored items, surface and Markdown detail flag.
        const rereadStats = familyReparsed.accepted === true ? familyReparsed.document.sections[10] : undefined;
        const rereadStatsNode = rereadStats?.module === "layout.stack" ? rereadStats.children?.[2] : undefined;
        const statsReaderOk = rereadStats !== undefined
          && rereadStats.module === "layout.stack"
          && rereadStats.children?.[0]?.module === "content.heading"
          && rereadStats.children?.[1]?.module === "content.prose"
          && JSON.stringify(rereadStats.children?.[1]?.props)
            === JSON.stringify({ text: STATS_EXPECTED.lede, markdown: true })
          && rereadStatsNode?.module === "content.stats"
          && JSON.stringify(rereadStatsNode.props) === JSON.stringify(statsNodeProps())
          && sameKeys(rereadStatsNode.props, familyAccepted.sections[10]?.children?.[2]?.props)
          && Object.isFrozen(familyReparsed.document);
        localA2.stats.reader = statsReaderOk;
        // `UNO-WO-114 / R01`: the strict reader round-trip of the steps family — the Markdown-lede child re-reads with its own
        // switch, and the native timeline node re-reads with exactly the authored items, surface, outline and Markdown flag.
        const rereadSteps = familyReparsed.accepted === true ? familyReparsed.document.sections[11] : undefined;
        const rereadStepsNode = rereadSteps?.module === "layout.stack" ? rereadSteps.children?.[2] : undefined;
        const stepsReaderOk = rereadSteps !== undefined
          && rereadSteps.module === "layout.stack"
          && rereadSteps.children?.[0]?.module === "content.heading"
          && rereadSteps.children?.[1]?.module === "content.prose"
          && JSON.stringify(rereadSteps.children?.[1]?.props)
            === JSON.stringify({ text: STEPS_EXPECTED.lede, markdown: true })
          && rereadStepsNode?.module === "content.timeline"
          && JSON.stringify(rereadStepsNode.props) === JSON.stringify(stepsNodeProps())
          && sameKeys(rereadStepsNode.props, familyAccepted.sections[11]?.children?.[2]?.props)
          && Object.isFrozen(familyReparsed.document);
        localA2.steps.reader = stepsReaderOk;
        // `UNO-WO-108 / R01` (§4 `refusal`): two real refusals are executed against the authored source — an undeclared
        // `link` id and an unsafe URL scheme — and the rich list depends on them.
        const undeclaredLink = familySource();
        undeclaredLink.sections[2].items[3] = { label: "Help unavailable", link: "absent" };
        const undeclaredLinkOutcome = composeUnoFoundationSubset(undeclaredLink, familyBindings());
        const unsafeHref = familySource();
        unsafeHref.sections[2].items[1] = { label: "Reference", href: "javascript:alert(1)" };
        const unsafeHrefOutcome = composeUnoFoundationSubset(unsafeHref, familyBindings());
        const refusalOk = undeclaredLinkOutcome.status === "refused"
          && unsafeHrefOutcome.status === "refused"
          && [undeclaredLinkOutcome.reason, unsafeHrefOutcome.reason]
            .every((reason) => typeof reason === "string" && reason.startsWith("family:"));
        // `UNO-WO-110 / R01` (§2 `refusal`): the table's own refusal evidence is a malformed **table**, not the list's link
        // refusals. Each probe mutates exactly one authored table field and must refuse the whole source Page with a family
        // reason and no partial document, so a half-composed table can never be served as apparent evidence.
        const tableRefusalProbes = [
          ["cell Markdown", (source) => { source.sections[13].rows[0][0] = "**First**"; }],
          ["row not an array", (source) => { source.sections[13].rows[1] = "Second"; }],
          ["columns not an array", (source) => { source.sections[13].columns = "Phase"; }],
          ["lede whitespace only", (source) => { source.sections[13].lede = "   "; }],
        ].map(([label, mutate]) => {
          const source = familySource();
          mutate(source);
          const outcome = composeUnoFoundationSubset(source, familyBindings());
          return {
            label,
            reason: String(outcome.status === "refused" ? outcome.reason : outcome.status),
            partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
          };
        });
        const tableRefusalOk = tableRefusalProbes.every(
          (probe) => probe.reason.startsWith("family:") && probe.partial === false,
        );
        check(
          "A2_LOCAL_REFUSAL each malformed table refuses the whole source Page with a family reason and no partial document",
          tableRefusalOk,
          JSON.stringify(tableRefusalProbes),
        );
        // `UNO-WO-112 / R01`: the hero's whole-source refusal matrix, executed by the extracted module's own cases so the
        // fixture, the runner and the unit tests cannot disagree about what a malformed hero is.
        const heroRefusalProbes = HERO_REFUSAL_CASES.map((probe) => {
          const source = familySource();
          probe.mutate(source);
          const outcome = composeUnoFoundationSubset(source, familyBindings());
          return {
            label: probe.label,
            expected: probe.expected,
            reason: String(outcome.status === "refused" ? outcome.reason : outcome.status),
            partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
          };
        });
        const heroRefusalOk = heroRefusalProbes.every(
          (probe) => probe.reason === probe.expected && probe.partial === false,
        );
        check(
          "A2_LOCAL_REFUSAL every malformed hero refuses the whole source Page with the family's own reason",
          heroRefusalOk,
          JSON.stringify(heroRefusalProbes),
        );
        localA2.list.refusal = refusalOk;
        localA2.table.refusal = tableRefusalOk;
        localA2.hero.refusal = heroRefusalOk;
        // `UNO-WO-113 / R01`: the stats family's whole-source refusal matrix, executed from the extracted module's own cases.
        const statsRefusalProbes = STATS_REFUSAL_CASES.map((probe) => {
          const source = familySource();
          probe.mutate(source);
          const outcome = composeUnoFoundationSubset(source, familyBindings());
          return {
            label: probe.label,
            expected: probe.expected,
            reason: String(outcome.status === "refused" ? outcome.reason : outcome.status),
            partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
          };
        });
        const statsRefusalOk = statsRefusalProbes.every(
          (probe) => probe.reason === probe.expected && probe.partial === false,
        );
        check(
          "A2_LOCAL_REFUSAL every malformed stats family refuses the whole source Page with the family's own reason",
          statsRefusalOk,
          JSON.stringify(statsRefusalProbes),
        );
        localA2.stats.refusal = statsRefusalOk;
        // `UNO-WO-114 / R01`: the steps family's whole-source refusal matrix, executed from the extracted module's own cases.
        const stepsRefusalProbes = STEPS_REFUSAL_CASES.map((probe) => {
          const source = familySource();
          probe.mutate(source);
          const outcome = composeUnoFoundationSubset(source, familyBindings());
          return {
            label: probe.label,
            expected: probe.expected,
            reason: String(outcome.status === "refused" ? outcome.reason : outcome.status),
            partial: Object.prototype.hasOwnProperty.call(outcome, "document"),
          };
        });
        const stepsRefusalOk = stepsRefusalProbes.every(
          (probe) => probe.reason === probe.expected && probe.partial === false,
        );
        check(
          "A2_LOCAL_REFUSAL every malformed steps family refuses the whole source Page with the family's own reason",
          stepsRefusalOk,
          JSON.stringify(stepsRefusalProbes),
        );
        localA2.steps.refusal = stepsRefusalOk;
        refusalReasons = JSON.stringify({
          undeclared: undeclaredLinkOutcome.status === "refused" ? undeclaredLinkOutcome.reason : undeclaredLinkOutcome.status,
          unsafeHref: unsafeHrefOutcome.status === "refused" ? unsafeHrefOutcome.reason : unsafeHrefOutcome.status,
          table: tableRefusalProbes,
          hero: heroRefusalProbes,
          stats: statsRefusalProbes,
          steps: stepsRefusalProbes,
        });
        const links = familyReparsed.accepted === true ? familyReparsed.document.links : undefined;
        check(
          "A2_LOCAL_READER the installed bytes re-read to the same rich list, table and hero, with the one approved declaration",
          listReaderOk && tableReaderOk && heroReaderOk && statsReaderOk
            && JSON.stringify(links) === JSON.stringify({ help: { reference: "applicationLink", key: "example.help" } })
            && JSON.stringify(familyReparsed.document.sections.map((section) => section.id)) === JSON.stringify(FAMILY_IDS),
          JSON.stringify({ list: localA2.list.reader, table: localA2.table.reader, hero: localA2.hero.reader, stats: localA2.stats.reader, links }),
        );
      }
      check(
        "FAMILY_TEXT_FIVE_SOURCE the three remaining authored-text families add no top-level node and keep the seventeen ids",
        JSON.stringify(familyAccepted.sections.map((section) => section.id)) === JSON.stringify(FAMILY_IDS)
          && familyAccepted.sections.filter((section) => section.module === "layout.stack").length === 7
          && textFiveEvidence.every((evidence) => evidence.ok),
        `${familyAccepted.sections.filter((section) => section.module === "layout.stack").length} stacks`,
      );
    }
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
  const build = await runChild({ root: ROOT, args: [nextBin, "build"], timeoutMs: BUILD_TIMEOUT_MS });
  if (!check("the production build of the fixture succeeds", build.code === 0, `exit ${build.code}`)) {
    process.stderr.write(build.output.slice(-3000));
    return 1;
  }
  check("the fixture build reports no build error", !/Failed to compile/iu.test(build.output));

  const port = await freeLoopbackPort(HOST);
  const base = `http://${HOST}:${port}`;
  child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
    windowsHide: true,
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  if (!check("the production server answers on loopback", await waitForServer({ base, child, readyPath: "/en-001/wo044-all-modules" }))) return 1;

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
      "FAMILY_HTTP=200 prose and warning callout render their authored Markdown inside the family",
      // `UNO-WO-084 / R01`: both families now render one rich node — an authored h2, a Markdown lede and body, and a callout
      // whose accent wraps its own heading and lede instead of an outer stack.
      familyHtml.includes(
        '<section class="uno-json-prose" id="family-0-prose" data-uno-align="center" data-uno-surface="muted">',
      )
        && familyHtml.includes('<h2 class="uno-json-prose-heading">Synthetic prose heading</h2>')
        && familyHtml.includes('<strong class="uno-family-md-strong">strong</strong>')
        && familyHtml.includes('<code class="uno-family-md-code">inline code</code>')
        && familyHtml.includes(
          '<a class="uno-family-md-link" href="https://example.org/notes" rel="noopener noreferrer">safe link</a>',
        )
        && familyHtml.includes(
          '<section class="uno-json-callout" data-uno-tone="warning" id="family-1-callout" data-uno-align="start" data-uno-surface="bordered">',
        )
        && familyHtml.includes('<h2 class="uno-json-prose-heading">Synthetic callout heading</h2>')
        && familyHtml.includes('<strong class="uno-family-md-strong">bounded</strong>'),
    );
    // `UNO-WO-108 / R01` (R2): the rich list is bounded by its authoring section, carries four authored entries and
    // exactly the two safe destinations — the authored `https` note and the stored same-Site canonical for the route
    // item — while the authorized-but-OFF `help` declaration stays inert and leaks no opaque key.
    const listRegion = familyRegionOf("family-2-list");
    const listAnchors = listRegion.match(/<a class="uno-json-list-link"[^>]*>/gu) ?? [];
    check(
      "FAMILY_HTTP=200 the ordered list carries exactly the four authored entries and two safe destinations",
      listRegion.includes('<section class="uno-json-list-section" id="family-2-list-list" data-uno-surface="bordered">')
        && listRegion.includes('<ol class="uno-json-list"')
        && (listRegion.match(/<li>/gu) ?? []).length === 4
        && listRegion.indexOf("Prepare") < listRegion.indexOf("Reference")
        && listRegion.indexOf("Reference") < listRegion.indexOf("Target")
        && listRegion.indexOf("Target") < listRegion.indexOf("Help unavailable")
        && listAnchors.length === 2
        && listAnchors.every((anchor) => anchor.includes("noopener") && anchor.includes("noreferrer"))
        && listRegion.includes('href="https://example.org/notes"')
        && listRegion.includes("en-001/wo108-target")
        && listRegion.includes("Help unavailable")
        && !listRegion.includes("example.help")
        && listRegion.includes("uno-json-list-lede")
        && listRegion.includes(">bounded list</strong>")
        && listRegion.includes(">authored</em>")
        && listRegion.includes(">published</strong>")
    );
    check(
      "FAMILY_HTTP=200 the FAQ renders as a native disclosure with the authored question",
      familyHtml.includes('<div class="uno-json-accordion" id="family-3-faq-accordion">')
        && familyHtml.includes("<details") && familyHtml.includes("<summary")
        && familyHtml.includes("Can this contact notice send anything?")
        // `UNO-WO-080 / R01`: the donor's FAQ questions are level-3 headings inside their own native summaries.
        && familyHtml.includes(
          '<summary class="uno-json-disclosure-summary"><h3>Can this contact notice send anything?</h3></summary>',
        ),
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
    // never satisfy a new claim. `UNO-WO-072 / R01` adds one case: an authored-text family is a `layout.stack` wrapper, so
    // that region starts at the wrapper and ends at the next top-level family anchor instead of an inner `</section>`.
    function familyRegionOf(id) {
      const at = familyHtml.indexOf(`id="${id}"`);
      if (at < 0) return "";
      const wrapperOpen = familyHtml.lastIndexOf('<div class="uno-json-stack" data-uno-gap="normal"', at);
      const sectionOpen = familyHtml.lastIndexOf("<section", at);
      if (wrapperOpen >= 0 && wrapperOpen > sectionOpen) {
        const index = FAMILY_IDS.indexOf(id);
        const nextId = index >= 0 && index + 1 < FAMILY_IDS.length ? FAMILY_IDS[index + 1] : null;
        const nextAt = nextId === null ? -1 : familyHtml.indexOf(`id="${nextId}"`);
        if (nextAt < 0) return "";
        const nextOpen = Math.max(
          familyHtml.lastIndexOf('<div class="uno-json-stack" data-uno-gap="normal"', nextAt),
          familyHtml.lastIndexOf('<div class="uno-json-grid"', nextAt),
          familyHtml.lastIndexOf("<section", nextAt),
          // `UNO-WO-075 / R01`: the five wrapped families can now sit directly before a `media` neighbour, whose root is
          // one `<figure>` rather than a `<section>`, so that opening tag also bounds the region.
          familyHtml.lastIndexOf("<figure", nextAt),
        );
        return nextOpen <= at ? "" : familyHtml.slice(wrapperOpen, nextOpen);
      }
      const end = sectionOpen < 0 ? -1 : familyHtml.indexOf("</section>", at);
      return sectionOpen < 0 || end < 0 ? "" : familyHtml.slice(sectionOpen, end);
    };
    check(
      "FAMILY_STEPS_HTTP the steps region is one authored heading, Markdown lede and one ordered list of two titled items",
      (() => {
        const stepsRegion = stepsRegionOf(familyHtml);
        const items = stepsItemsOf(stepsRegion);
        return stepsServed(stepsRegion).ok
          && items.length === 2
          && items[0].title === "Draft" && items[1].title === "Review"
          && (stepsRegion.match(/<li class="uno-json-timeline-item"/gu) ?? []).length === 2
          && stepsRegion.includes('<h3 class="uno-json-timeline-title">Draft</h3>')
          && stepsRegion.includes('<h3 class="uno-json-timeline-title">Review</h3>')
          && (stepsRegion.match(/<h3 class="uno-json-timeline-title">/gu) ?? []).length === 2
          && !stepsRegion.includes('<p class="uno-json-timeline-title">')
          && stepsRegion.indexOf(">Draft</h3>") < stepsRegion.indexOf(">Review</h3>")
          && (stepsRegion.match(/uno-json-timeline-description/gu) ?? []).length === 1
          && stepsRegion.indexOf("family-11-steps-heading") < stepsRegion.indexOf("family-11-steps-lede")
          && stepsRegion.indexOf("family-11-steps-lede") < stepsRegion.indexOf("family-11-steps-timeline")
          && (stepsRegion.match(/<h2 class="uno-json-heading"/gu) ?? []).length === 1
          && !/data-uno-status|aria-current|uno-json-timeline-date|uno-json-timeline-heading|<h1\b|<h4\b/iu.test(stepsRegion);
      })(),
      stepsRegionOf(familyHtml).slice(0, 200),
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
    // `UNO-WO-108 / R01` (R2): the rich table is now a native section that owns the surface; the scroll control lives
    // inside it without an id of its own, so the region is bounded by the family id and its nested scroll is inspected.
    const tableRegion = familyRegionOf("family-13-table");
    check(
      "FAMILY_TABLE_HTTP the table region is one scroll wrapper with a genuine captioned two-column table",
      tableRegion.includes('<section class="uno-json-table-section" id="family-13-table-table" data-uno-surface="muted">')
        && tableRegion.includes('<div class="uno-json-table-scroll" tabindex="0">')
        && tableRegion.includes('<table class="uno-json-table">')
        && /<caption>[\s\S]*?<strong[^>]*>synthetic<\/strong>[\s\S]*?<\/caption>/u.test(tableRegion)
        && (tableRegion.match(/<th scope="col">/gu) ?? []).length === 2
        && tableRegion.indexOf("<th scope=\"col\">Phase</th>") < tableRegion.indexOf("<th scope=\"col\">Count</th>")
        && tableRegion.includes("<tbody>")
        && (tableRegion.match(/<tr>/gu) ?? []).length === 3
        && (tableRegion.match(/<td>/gu) ?? []).length === 4
        && tableRegion.indexOf("<td>First</td><td>1</td>") > 0
        && tableRegion.indexOf("<td>Second</td><td>2</td>") > tableRegion.indexOf("<td>First</td><td>1</td>")
        && /<strong class="uno-family-md-strong">table<\/strong>/u.test(tableRegion)
        && !/<a\b|<img\b|<script\b|<form\b|<button\b/iu.test(tableRegion),
      tableRegion.slice(0, 200),
    );
    const columnsStart = familyHtml.indexOf('id="family-14-columns"');
    const cardsStart = familyHtml.indexOf('id="family-15-cards"');
    const cardsOpen = cardsStart < 0 ? -1 : familyHtml.lastIndexOf("<div", cardsStart);
    const featuresStart = familyHtml.indexOf('id="family-16-features"');
    const featuresOpen = featuresStart < 0 ? -1 : familyHtml.lastIndexOf("<div", featuresStart);
    const columnsRegion = columnsStart < 0 || cardsOpen < 0 ? "" : familyHtml.slice(columnsStart, cardsOpen);
    check(
      "FAMILY_COLUMNS_HTTP the columns region is an authored plain two-column grid of two tight stacks",
      columnsRegion.length > 0
        && familyHtml.includes('<div class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="plain" data-uno-ratio="start-wide" id="family-14-columns">')
        && (columnsRegion.match(/<div class="uno-json-cell"/gu) ?? []).length === 2
        && (columnsRegion.match(/<div class="uno-json-stack" data-uno-gap="tight"/gu) ?? []).length === 2
        // `UNO-WO-080 / R01`: the donor's column titles are level-3 headings beneath the authored section heading.
        && (columnsRegion.match(/<h3 class="uno-json-heading"/gu) ?? []).length === 2
        && columnsRegion.indexOf(">Left column</h3>") > 0
        && columnsRegion.indexOf(">Left column</h3>") < columnsRegion.indexOf(">Right column</h3>")
        && columnsRegion.includes(">The left text.</p>")
        && columnsRegion.includes('<ul class="uno-json-list"')
        && columnsRegion.indexOf(">Check one</span>") < columnsRegion.indexOf(">Check two</span>")
        && !/<h2\b|<h4\b|<a\b|<img\b|<button\b|<form\b/iu.test(columnsRegion),
      columnsRegion.slice(0, 200),
    );
    const cardsRegion = cardsOpen < 0 || featuresOpen < 0 ? "" : familyHtml.slice(cardsOpen, featuresOpen);
    check(
      "FAMILY_CARDS_HTTP the cards region is a headed top-level stack with a native two-column list grid and one body",
      cardsRegion.length > 0
        && cardsRegion.includes('<div class="uno-json-stack" data-uno-gap="normal" id="family-15-cards">')
        && cardsRegion.includes('<h2 class="uno-json-heading" id="family-15-cards-heading">Synthetic cards</h2>')
        && /<ul class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="list" id="family-15-cards-grid" role="list">/u.test(cardsRegion)
        && (cardsRegion.match(/<li class="uno-json-cell"/gu) ?? []).length === 2
        && (cardsRegion.match(/<div class="uno-json-stack" data-uno-gap="tight"/gu) ?? []).length === 2
        && (cardsRegion.match(/<h3 class="uno-json-heading"/gu) ?? []).length === 2
        && cardsRegion.indexOf(">Card one</h3>") > 0
        && cardsRegion.indexOf(">Card one</h3>") < cardsRegion.indexOf(">Card two</h3>")
        && (cardsRegion.match(/<p class="uno-json-prose"/gu) ?? []).length === 2
        && cardsRegion.includes('<p class="uno-json-prose" id="family-15-cards-lede">Synthetic cards explain the choices.</p>')
        && cardsRegion.includes(">First card body.</p>")
        && !/data-uno-ratio|<article\b|<a\b|<img\b|<button\b|<form\b|icon/iu.test(cardsRegion),
      cardsRegion.slice(0, 240),
    );
    const featuresRegion = featuresOpen < 0 ? "" : familyHtml.slice(featuresOpen, familyHtml.indexOf("</main>", featuresOpen));
    check(
      "FAMILY_FEATURES_HTTP the features region is a separate headed top-level stack with a native three-column list grid",
      featuresRegion.length > 0
        && featuresRegion.includes('<div class="uno-json-stack" data-uno-gap="normal" id="family-16-features">')
        && featuresRegion.includes('<h2 class="uno-json-heading" id="family-16-features-heading">Synthetic features</h2>')
        && /<ul class="uno-json-grid" data-uno-columns="3" data-uno-item-semantics="list" id="family-16-features-grid" role="list">/u.test(featuresRegion)
        && (featuresRegion.match(/<li class="uno-json-cell"/gu) ?? []).length === 2
        && (featuresRegion.match(/<h3 class="uno-json-heading"/gu) ?? []).length === 2
        && featuresRegion.indexOf(">Feature one</h3>") > 0
        && featuresRegion.indexOf(">Feature one</h3>") < featuresRegion.indexOf(">Feature two</h3>")
        && (featuresRegion.match(/<p class="uno-json-prose"/gu) ?? []).length === 2
        && featuresRegion.includes('<p class="uno-json-prose" id="family-16-features-lede">Synthetic features describe the work.</p>')
        && featuresRegion.includes(">First feature body.</p>")
        && !/data-uno-ratio|<article\b|<a\b|<img\b|<button\b|<form\b|icon/iu.test(featuresRegion),
      featuresRegion.slice(0, 240),
    );
    // `UNO-WO-070 / R01`: the authored h2 → h3 outline as actually served, for both headed families.
    {
      const regionIds = (region) => [...region.matchAll(/(?<![-\w])id="([^"]+)"/gu)].map((match) => match[1]);
      const cardsIds = regionIds(cardsRegion);
      const featuresIds = regionIds(featuresRegion);
      const allIds = [...cardsIds, ...featuresIds];
      const outlineOk = (region, type, headingText, columns) => {
        const h2 = [...region.matchAll(/<h2 class="uno-json-heading" id="([^"]+)">([^<]*)<\/h2>/gu)];
        const h3 = [...region.matchAll(/<h3 class="uno-json-heading" id="([^"]+)">([^<]*)<\/h3>/gu)];
        return h2.length === 1
          && h2[0][1] === `family-${type === "cards" ? 15 : 16}-${type}-heading`
          && h2[0][2] === headingText
          && h3.length === 2
          && h3.every((match, index) => match[1] === `family-${type === "cards" ? 15 : 16}-${type}-item-${index}-title`)
          && region.indexOf("<h2") < region.indexOf("<h3")
          && (region.match(/<ul\b/gu) ?? []).length === 1
          && (region.match(/<li class="uno-json-cell"/gu) ?? []).length === 2
          && region.includes(`data-uno-columns="${columns}"`)
          && !/<main\b|<h1\b|<script\b|<iframe\b/iu.test(region);
      };
      check(
        "FAMILY_ITEM_OUTLINE_HTTP both headed families serve exactly one authored h2 before two nested h3 titles, one list and no duplicate id",
        outlineOk(cardsRegion, "cards", "Synthetic cards", 2)
          && outlineOk(featuresRegion, "features", "Synthetic features", 3)
          && new Set(allIds).size === allIds.length
          && (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1,
        `cards=${cardsIds.length} features=${featuresIds.length} unique=${new Set(allIds).size}`,
      );
    }
    // `UNO-WO-071 / R01`: the two authored ledes exactly as served, in source order inside each family root.
    {
      const ledeOk = (region, index, type, text) => {
        const ledeTag = `<p class="uno-json-prose" id="family-${index}-${type}-lede">${text}</p>`;
        const headingEnd = region.indexOf("</h2>");
        const ledeAt = region.indexOf(ledeTag);
        const listAt = region.indexOf(`id="family-${index}-${type}-grid"`);
        return (region.match(new RegExp(`id="family-${index}-${type}-lede"`, "gu")) ?? []).length === 1
          && ledeAt > 0
          && headingEnd > 0
          && ledeAt > headingEnd
          && listAt > 0
          && ledeAt < listAt
          && (region.match(/<h2 class="uno-json-heading"/gu) ?? []).length === 1
          && (region.match(/<h3 class="uno-json-heading"/gu) ?? []).length === 2
          && (region.match(/<li class="uno-json-cell"/gu) ?? []).length === 2
          && (region.match(/<p class="uno-json-prose"/gu) ?? []).length === 2
          && !/<main\b|<h1\b|<script\b|<a\b|<iframe\b|<form\b|<button\b|<img\b|example\.test|donor/iu.test(region);
      };
      check(
        "FAMILY_LEDE_HTTP each headed family serves exactly one lede paragraph after its h2 and before its native list",
        ledeOk(cardsRegion, 15, "cards", "Synthetic cards explain the choices.")
          && ledeOk(featuresRegion, 16, "features", "Synthetic features describe the work.")
          && (familyHtml.match(/<p class="uno-json-prose" id="family-\d+-(?:cards|features)-lede"/gu) ?? []).length === 2,
        `cards=${cardsRegion.length} features=${featuresRegion.length}`,
      );
    }
    // `UNO-WO-072 / R01`: the two authored-text sequence families exactly as served, in one scoped check each.
    // `UNO-WO-113 / R01` and `UNO-WO-114 / R01`: both families now render the donor's Markdown-capable lede inside the authored
    // stack, so their served proof is the extracted family predicate rather than a plain `<p>` fragment match.
    check(
      "FAMILY_STATS_STEPS_HTTP each sequence family serves its authored Markdown lede before its unchanged native list",
      statsServed(statsRegionOf(familyHtml)).ok
        && stepsServed(stepsRegionOf(familyHtml)).ok
        && (familyHtml.match(/<section class="uno-json-prose" id="family-1[01]-(?:stats|steps)-lede"/gu) ?? []).length === 2
        && (familyHtml.match(/<h2 class="uno-json-heading" id="family-1[01]-(?:stats|steps)-heading"/gu) ?? []).length === 2
        && new Set([...familyHtml.matchAll(/id="(family-\d+-[a-z]+)"/gu)].map((match) => match[1])).size
          === (familyHtml.match(/id="family-\d+-[a-z]+"/gu) ?? []).length,
      `stats=${familyRegionOf("family-10-stats").length} steps=${familyRegionOf("family-11-steps").length}`,
    );
    // `UNO-WO-075 / R01`: the five authored-text families exactly as served, one scoped check each plus a whole-Page one.
    {
      const servedFive = [
        [2, "list", "Synthetic list heading", '<ol class="uno-json-list">'],
        [3, "faq", "Synthetic FAQ heading", '<div class="uno-json-accordion" id="family-3-faq-accordion">'],
        [13, "table", "Synthetic table heading", '<div class="uno-json-table-scroll" tabindex="0">'],
      ];
      // `UNO-WO-108 / R01` (R2): three distinct arms, because the rich list and table carry the Markdown lede inside a
      // native section while the unchanged FAQ keeps its plain sibling `<p id="…-lede">`. No arm is skipped.
      const servedFiveOk = (index, type, headingText, nativeOpen) => {
        const id = `family-${index}-${type}`;
        const region = familyRegionOf(id);
        const common = region.startsWith(`<div class="uno-json-stack" data-uno-gap="normal" id="${id}">`)
          && region.includes(`<h2 class="uno-json-heading" id="${id}-heading">${headingText}</h2>`)
          && region.indexOf(`${id}-heading`) < region.indexOf(nativeOpen)
          && region.includes(nativeOpen)
          && (region.match(/<h2 class="uno-json-heading"/gu) ?? []).length === 1
          && !/<main\b|<h1\b|<h4\b|<script\b|<iframe\b|<form\b|<button\b|<input\b/iu.test(region);
        if (index === 3) {
          return common
            && (region.match(new RegExp(`id="${id}-lede"`, "gu")) ?? []).length === 1
            && region.includes(`<p class="uno-json-prose" id="${id}-lede">Synthetic FAQ introduction.</p>`)
            && region.indexOf(`${id}-lede`) < region.indexOf(nativeOpen)
            && (region.match(/<h3[\s>]/giu) ?? []).length === 1
            && !/<a\b/iu.test(region);
        }
        if (index === 2) {
          return common
            && region.includes('<section class="uno-json-list-section" id="family-2-list-list" data-uno-surface="bordered">')
            && region.includes("uno-json-list-lede")
            && (region.match(/<li>/gu) ?? []).length === 4
            && (region.match(/<a class="uno-json-list-link"/gu) ?? []).length === 2
            && region.includes("Help unavailable") && !region.includes("example.help")
            && region.includes(">bounded list</strong>")
            && region.indexOf(`${id}-heading`) < region.indexOf("uno-json-list-lede");
        }
        return common
          && region.includes('<section class="uno-json-table-section" id="family-13-table-table" data-uno-surface="muted">')
          && region.includes("uno-json-table-lede")
          && /<caption>[\s\S]*?<strong[^>]*>synthetic<\/strong>[\s\S]*?<\/caption>/u.test(region)
          && (region.match(/<td>/gu) ?? []).length === 4
          && region.includes(">table</strong>")
          && !/<a\b|<img\b/iu.test(region);
      };
      for (const [index, type, headingText, nativeOpen] of servedFive) {
        const servedOK = servedFiveOk(index, type, headingText, nativeOpen);
        // `UNO-WO-108 / R01` (§4): `renderer` is the scoped semantic DOM contract exactly as served for these two families.
        if (type === "list" || type === "table") localA2[type].renderer = servedOK;
        check(
          `FAMILY_TEXT_FIVE_HTTP family-${index}-${type} serves one authored h2 and one lede before its native node`,
          servedOK,
          JSON.stringify((() => {
            const region = familyRegionOf(`family-${index}-${type}`);
            const id = `family-${index}-${type}`;
            return {
              stack: region.startsWith(`<div class="uno-json-stack" data-uno-gap="normal" id="${id}">`),
              heading: region.includes(`<h2 class="uno-json-heading" id="${id}-heading">${headingText}</h2>`),
              beforeNative: region.indexOf(`${id}-heading`) < region.indexOf(nativeOpen),
              native: region.includes(nativeOpen),
              h2Once: (region.match(/<h2 class="uno-json-heading"/gu) ?? []).length === 1,
              clean: !/<main\b|<h1\b|<h4\b|<script\b|<iframe\b|<form\b|<button\b|<input\b/iu.test(region),
              section: region.includes('<section class="uno-json-list-section" id="family-2-list-list" data-uno-surface="bordered">'),
              lede: region.includes("uno-json-list-lede"),
              items: (region.match(/<li>/gu) ?? []).length,
              anchors: (region.match(/<a class="uno-json-list-link"/gu) ?? []).length,
              help: region.includes("Help unavailable"),
              leak: region.includes("example.help"),
              bounded: region.includes(">bounded list</strong>"),
              order: region.indexOf(`${id}-heading`) < region.indexOf("uno-json-list-lede"),
            };
          })()),
        );
      }
      // `UNO-WO-108 / R01` (§4 `http`): the stored Site-qualified target answers from the ephemeral test base, and an
      // undeclared route stays a closed 404 — no Page is invented by the router.
      {
        const targetResponse = await fetch(`${base}/en-001/wo108-target`);
        const targetHtml = await targetResponse.text();
        const missingResponse = await fetch(`${base}/en-001/wo108-absent`);
        const missingHtml = await missingResponse.text();
        localA2.list.http = listRegion.includes('href="http://localhost:3000/en-001/wo108-target"')
          && !listRegion.includes("example.help");
        // `UNO-WO-110 / R01` (§2 `http`): the dimension is the real production response — HTTP 200 plus the checked rich
        // table DOM exactly as served (surface, scroll control, Markdown lede, Markdown caption, two columns, four cells) —
        // not the presence of one attribute.
        localA2.table.http = familyHtmlResponse.status === 200
          && tableRegion.includes('<section class="uno-json-table-section" id="family-13-table-table" data-uno-surface="muted">')
          && tableRegion.includes('<div class="uno-json-table-scroll" tabindex="0">')
          && tableRegion.includes("uno-json-table-lede")
          && /<caption>[\s\S]*?<strong[^>]*>synthetic<\/strong>[\s\S]*?<\/caption>/u.test(tableRegion)
          && (tableRegion.match(/<th scope="col">/gu) ?? []).length === 2
          && (tableRegion.match(/<td>/gu) ?? []).length === 4;
        // `UNO-WO-108 / R01` (§4 `rights`): no donor copy, no opaque declaration key and no off-origin destination.
        localA2.list.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE) && !listRegion.includes("example.help");
        localA2.table.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE) && !tableRegion.includes("example.help");
        check(
          "A2_LOCAL_HTTP the published same-Site target answers 200 and an undeclared route stays a closed 404",
          targetResponse.status === 200
            && targetHtml.includes("Same-Site published target.")
            && missingResponse.status === 404
            && !missingHtml.includes("Same-Site published target."),
          `${targetResponse.status}/${missingResponse.status}`,
        );
      }
      check(
        "FAMILY_TEXT_FIVE_HTTP the three remaining authored-text families add seven stacks and three headings with no duplicate id, extra main or external destination",
        (familyHtml.match(/<div class="uno-json-stack" data-uno-gap="normal"/gu) ?? []).length === 7
          && (familyHtml.match(/<h2 class="uno-json-heading" id="family-(?:2-list|3-faq|13-table)-heading"/gu) ?? []).length === 3
          && (familyHtml.match(/<p class="uno-json-prose" id="family-3-faq-lede"/gu) ?? []).length === 1
          && (familyHtml.match(/<div class="uno-family-md uno-json-list-lede">/gu) ?? []).length === 1
          && (familyHtml.match(/<div class="uno-family-md uno-json-table-lede">/gu) ?? []).length === 1
          && servedFive.every(([index, type, headingText, nativeOpen]) => servedFiveOk(index, type, headingText, nativeOpen))
          && (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1
          && !familyHtml.includes(FAMILY_DONOR_SOURCE),
        `stacks=${(familyHtml.match(/<div class="uno-json-stack" data-uno-gap="normal"/gu) ?? []).length} h2=${(familyHtml.match(/<h2 class="uno-json-heading" id="family-(?:2-list|3-faq|13-table)-heading"/gu) ?? []).length} faqLede=${(familyHtml.match(/<p class="uno-json-prose" id="family-3-faq-lede"/gu) ?? []).length} listLede=${(familyHtml.match(/uno-json-list-lede/gu) ?? []).length} tableLede=${(familyHtml.match(/uno-json-table-lede/gu) ?? []).length} main=${(familyHtml.match(/<main[\s>]/giu) ?? []).length} h1=${(familyHtml.match(/<h1[\s>]/giu) ?? []).length} donor=${familyHtml.includes(FAMILY_DONOR_SOURCE)}`,
      );
      // `UNO-WO-084 / R01` (A1): the two rich families exactly as served, and only once each.
      const proseServed = familyRegionOf("family-0-prose");
      const calloutServed = familyRegionOf("family-1-callout");
      a1Evidence.prose.http = proseServed.startsWith(
        '<section class="uno-json-prose" id="family-0-prose" data-uno-align="center" data-uno-surface="muted">',
      )
        && proseServed.includes('<h2 class="uno-json-prose-heading">Synthetic prose heading</h2>')
        && proseServed.includes('<div class="uno-family-md uno-json-prose-lede">')
        && proseServed.includes('<em class="uno-family-md-em">emphasis</em>')
        && proseServed.includes('<div class="uno-family-md uno-json-prose-text">')
        && proseServed.includes('<strong class="uno-family-md-strong">strong</strong>')
        && proseServed.includes('<code class="uno-family-md-code">inline code</code>')
        && proseServed.includes('<a class="uno-family-md-link" href="https://example.org/notes" rel="noopener noreferrer">safe link</a>')
        && !/<script\b|javascript:|data:|target=|onclick/iu.test(proseServed);
      a1Evidence.callout.http = calloutServed.startsWith(
        '<section class="uno-json-callout" data-uno-tone="warning" id="family-1-callout" data-uno-align="start" data-uno-surface="bordered">',
      )
        && calloutServed.includes('<h2 class="uno-json-prose-heading">Synthetic callout heading</h2>')
        && calloutServed.includes('<div class="uno-family-md uno-json-prose-lede">')
        && calloutServed.includes("Synthetic callout introduction.")
        && calloutServed.includes('<strong class="uno-family-md-strong">bounded</strong>')
        && calloutServed.indexOf("Synthetic callout heading") < calloutServed.indexOf("bounded")
        && calloutServed.includes('role="alert"') === false;
      check(
        "A1_HTTP the served family-0-prose keeps its authored heading, Markdown lede and body, align and surface",
        a1Evidence.prose.http,
        proseServed.slice(0, 200),
      );
      check(
        "A1_HTTP the served family-1-callout keeps its accent, tone and inside heading and lede",
        a1Evidence.callout.http,
        calloutServed.slice(0, 200),
      );
    }
    {
      const lastFourRegions = [tableRegion, columnsRegion, cardsRegion, featuresRegion];
      check(
        "FAMILY_SEVENTEEN_HTTP the last four regions add no second main, h1, script, frame or form control",
        lastFourRegions.every((region) => region.length > 0)
          && lastFourRegions.every((region) => !/<main\b|<h1\b|<script\b|<iframe\b|<form\b|<input\b|<textarea\b|<button\b/iu.test(region))
          && (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1
          // `UNO-WO-080 / R01`: the fixture FAQ authors one question, so its own level-3 heading is expected once — the
          // two former column `h2`s and the two step titles are now `h3` as well, giving nine `h2` and nine `h3`.
          && (familyHtml.match(/<h2[\s>]/giu) ?? []).length === 9
          && (familyHtml.match(/<h3[\s>]/giu) ?? []).length === 9
          && !familyHtml.includes(FAMILY_DONOR_SOURCE)
          && !familyHtml.includes("formRef"),
        `${lastFourRegions.map((region) => region.length).join("/")} h2=${(familyHtml.match(/<h2[\s>]/giu) ?? []).length} h3=${(familyHtml.match(/<h3[\s>]/giu) ?? []).length}`,
      );
    }
    // `UNO-WO-080 / R01`: the three composed donor outlines as actually served — heading ownership, not a count alone.
    {
      const stepsServed = familyRegionOf("family-11-steps");
      const faqServed = familyHtml.slice(
        familyHtml.indexOf('id="family-3-faq-accordion"'),
        familyHtml.indexOf('id="family-2-list"') > familyHtml.indexOf('id="family-3-faq-accordion"')
          ? familyHtml.indexOf('id="family-4-media"')
          : -1,
      );
      const columnsServed = columnsRegion;
      const stepsOwnedByListItems =
        (stepsServed.match(/<li class="uno-json-timeline-item"[^>]*>(?:(?!<\/li>)[\s\S])*?<h3 class="uno-json-timeline-title">/gu) ?? [])
          .length === 2;
      const faqOwnedBySummaries =
        (faqServed.match(/<summary class="uno-json-disclosure-summary"><h3>[^<]+<\/h3><\/summary>/gu) ?? []).length === 1
        && faqServed.includes("<h3>Can this contact notice send anything?</h3>");
      const columnsOwnedByCells =
        (columnsServed.match(/<div class="uno-json-cell"[^>]*>\s*<div class="uno-json-stack"[^>]*>\s*<h3 class="uno-json-heading"[^>]*>/gu) ?? [])
          .length === 2;
      check(
        "FAMILY_OUTLINE_THREE_HTTP the served Page puts the step titles, FAQ questions and column titles in level-3 headings of their own regions",
        stepsOwnedByListItems
          && faqOwnedBySummaries
          && columnsOwnedByCells
          && stepsServed.indexOf(">Draft</h3>") < stepsServed.indexOf(">Review</h3>")
          && columnsServed.indexOf(">Left column</h3>") < columnsServed.indexOf(">Right column</h3>")
          && (familyHtml.match(/<h1[\s>]/giu) ?? []).length === 1
          && (familyHtml.match(/<main[\s>]/giu) ?? []).length === 1
          && !/<h4\b|role="heading"|aria-level/iu.test(familyHtml),
        JSON.stringify({ stepsOwnedByListItems, faqOwnedBySummaries, columnsOwnedByCells }),
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

    // `UNO-WO-112 / R01` (§2 `http`/`renderer`/`rights`): the hero dimension is the real production response — the authored
    // alignment and surface, both Markdown bodies through the shared renderer, and exactly the two approved static actions
    // with their `rel` and variants — evaluated by the extracted predicate rather than by one attribute.
    const heroRegion = heroRegionOf(familyHtml);
    const heroFacts = heroServed(heroRegion);
    localA2.hero.renderer = heroRegion.length > 0 && heroFacts.ok;
    localA2.hero.http = familyHtmlResponse.status === 200 && heroFacts.ok;
    localA2.hero.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE)
      && !heroRegion.includes("example.help")
      && !heroRegion.includes("wo066-donor")
      && (heroRegion.match(/rel="noreferrer noopener"/gu) ?? []).length === HERO_EXPECTED.actions.length;
    check(
      "FAMILY_HERO_HTTP the served hero carries its authored surface, both Markdown bodies and both approved actions",
      localA2.hero.http,
      heroFacts.detail,
    );
    check(
      "FAMILY_HERO_HTTP the hero holds no donor identity, declaration key, form control or frame",
      localA2.hero.rights && !/<button\b|<form\b|<iframe\b/iu.test(heroRegion),
      heroRegion.slice(0, 200),
    );
    // The extracted parser is asserted directly too, so the served order, labels, variants and `rel` are proven even if the
    // composite predicate were ever weakened.
    const heroServedActions = heroActionsOf(heroRegion);
    check(
      "FAMILY_HERO_HTTP the hero serves exactly its two approved actions in authored order",
      heroServedActions.length === HERO_EXPECTED.actions.length
        && HERO_EXPECTED.actions.every((action, index) =>
          heroServedActions[index].href === action.href
          && heroServedActions[index].label === action.label
          && heroServedActions[index].variant === action.variant
          && heroServedActions[index].rel === "noreferrer noopener"),
      JSON.stringify(heroServedActions),
    );
    // `UNO-WO-113 / R01` (§2 `renderer`/`http`/`rights`): the stats family's served proof is the extracted predicate — the
    // authored heading, the Markdown lede, the closed surface, one native `<dl>` with exactly the authored pairs, the first
    // item's Markdown detail, and no invented heading, currency, control or frame. The pairs are asserted directly as well.
    const statsRegion = statsRegionOf(familyHtml);
    const statsFacts = statsServed(statsRegion);
    const statsPairs = statsPairsOf(statsRegion);
    localA2.stats.renderer = statsRegion.length > 0 && statsFacts.ok;
    localA2.stats.http = familyHtmlResponse.status === 200 && statsFacts.ok;
    localA2.stats.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE)
      && !statsRegion.includes("example.help")
      && !statsRegion.includes("wo066-donor")
      && (statsRegion.match(/class="uno-json-stat-detail"/gu) ?? []).length === 1;
    check(
      "FAMILY_STATS_HTTP the served stats family carries its heading, Markdown lede, closed surface, pairs and Markdown detail",
      localA2.stats.http,
      statsFacts.detail,
    );
    check(
      "FAMILY_STATS_HTTP the stats pairs are exactly the authored values, labels and detail in order",
      statsPairs.length === STATS_EXPECTED.items.length
        && STATS_EXPECTED.items.every(
          (item, index) => statsPairs[index].label === item.label && statsPairs[index].value === item.value,
        )
        && statsPairs[0]?.markdownDetail === true,
      JSON.stringify(statsPairs),
    );
    // `UNO-WO-114 / R01` (§2 `renderer`/`http`/`rights`): the credited steps family's served proof is the extracted predicate —
    // the authored heading, the Markdown lede, the closed surface, one native ordered list with exactly the authored level-3
    // titles and one Markdown body, and no invented status, current step, date, icon, destination, control or frame.
    const stepsRegion = stepsRegionOf(familyHtml);
    const stepsFacts = stepsServed(stepsRegion);
    const stepsItems = stepsItemsOf(stepsRegion);
    localA2.steps.renderer = stepsRegion.length > 0 && stepsFacts.ok;
    localA2.steps.http = familyHtmlResponse.status === 200 && stepsFacts.ok;
    localA2.steps.rights = !familyHtml.includes(FAMILY_DONOR_SOURCE)
      && !stepsRegion.includes("example.help")
      && !stepsRegion.includes("wo066-donor")
      && (stepsRegion.match(/class="uno-json-timeline-description"/gu) ?? []).length === 1;
    check(
      "FAMILY_STEPS_HTTP the served steps family carries its heading, Markdown lede, closed surface, ordered titles and Markdown body",
      localA2.steps.http,
      stepsFacts.detail,
    );
    check(
      "FAMILY_STEPS_HTTP the step titles and body are exactly the authored ones in order, with no invented status, current step or date",
      stepsItems.length === STEPS_EXPECTED.items.length
        && STEPS_EXPECTED.items.every((item, index) => stepsItems[index].title === item.title)
        && stepsItems[0]?.markdownDescription.length > 0
        && stepsItems[1]?.markdownDescription === ""
        && stepsItems.every((item) => !item.hasStatus && !item.ariaCurrent && !item.hasDate),
      JSON.stringify(stepsItems),
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
  const { UNO_RENDERABLE_MODULES } = await import("../src/core/page-document.ts");
  const { UNO_OWNED_MEDIA_ZONES } = await import("../src/core/assets/uno-owned-media.ts");
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
    // `UNO-WO-071 / R01`: the lede evidence is counted under its own label and still gates `FAMILY_BROWSER=PASS`, so a
    // deleted or neutered lede assertion both fails the runner and withholds the overall family label.
    let ledeBrowserOk = true;
    let ledeBrowserChecks = 0;
    const ledeCheck = (label, ok, detail = "") => {
      ledeBrowserChecks += 1;
      if (!ok) {
        ledeBrowserOk = false;
        familyOk = false;
      }
      return check(`FAMILY_LEDE_BROWSER ${label}`, ok, detail);
    };
    // `UNO-WO-072 / R01`: the sequence-family evidence is counted separately and still gates `FAMILY_BROWSER=PASS`.
    let sequenceBrowserOk = true;
    let sequenceBrowserChecks = 0;
    const sequenceCheck = (label, ok, detail = "") => {
      sequenceBrowserChecks += 1;
      if (!ok) {
        sequenceBrowserOk = false;
        familyOk = false;
      }
      return check(`FAMILY_STATS_STEPS_BROWSER ${label}`, ok, detail);
    };
    // `UNO-WO-075 / R01`: the five-family authored-text evidence is counted separately and still gates `FAMILY_BROWSER=PASS`.
    let textFiveBrowserOk = true;
    let textFiveBrowserChecks = 0;
    const textFiveCheck = (label, ok, detail = "") => {
      textFiveBrowserChecks += 1;
      if (!ok) {
        textFiveBrowserOk = false;
        familyOk = false;
      }
      return check(`FAMILY_TEXT_FIVE_BROWSER ${label}`, ok, detail);
    };
    // `UNO-WO-080 / R01`: the three donor heading outlines are counted and gated separately, so a deleted or neutered
    // outline check both fails the runner and withholds the overall family label.
    let outlineBrowserOk = true;
    let outlineBrowserChecks = 0;
    const outlineCheck = (label, ok, detail = "") => {
      outlineBrowserChecks += 1;
      if (!ok) {
        outlineBrowserOk = false;
        familyOk = false;
      }
      return check(`FAMILY_OUTLINE_THREE_BROWSER ${label}`, ok, detail);
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
        // `UNO-WO-084 / R01`: both families render as one rich node, so the probes address the family anchor itself.
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
          listItems: [...document.querySelectorAll("#family-2-list-list li")].map((item) => item.textContent?.trim() ?? ""),
          // `UNO-WO-108 / R01` (R3): the two safe destinations are measured as real anchors, and the OFF declaration
          // must leave no anchor and no opaque key anywhere in the rich list.
          listAnchors: document.querySelectorAll("#family-2-list-list a.uno-json-list-link").length,
          listAnchorHrefs: [...document.querySelectorAll("#family-2-list-list a.uno-json-list-link")]
            .map((anchor) => anchor.getAttribute("href") ?? ""),
          listAnchorRels: [...document.querySelectorAll("#family-2-list-list a.uno-json-list-link")]
            .map((anchor) => anchor.getAttribute("rel") ?? ""),
          listHelpAnchors: [...document.querySelectorAll("#family-2-list-list a")]
            .filter((anchor) => (anchor.textContent ?? "").includes("Help unavailable")).length,
          listLeaksKey: (document.querySelector("#family-2-list-list")?.outerHTML ?? "").includes("example.help"),
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
            const links = [...(region?.querySelectorAll("ul.uno-json-hero-actions a.uno-json-action") ?? [])];
            const box = region?.getBoundingClientRect();
            return {
              align: region?.getAttribute("data-uno-align") ?? "",
              surface: region?.getAttribute("data-uno-surface") ?? "",
              eyebrow: region?.querySelector(".uno-json-eyebrow")?.textContent ?? "",
              ledeStrong: region?.querySelector(".uno-json-hero-lede strong.uno-family-md-strong")?.textContent ?? "",
              supportEm: region?.querySelector(".uno-json-hero-support em.uno-family-md-em")?.textContent ?? "",
              // `UNO-WO-112 / R01`: exactly the two approved static actions, each an ordinary focusable anchor with its own
              // `rel`, closed variant and visible label — and no other control anywhere in the hero.
              actions: links.map((anchor) => ({
                href: anchor.getAttribute("href"),
                rel: anchor.getAttribute("rel") ?? "",
                variant: anchor.getAttribute("data-uno-variant") ?? "",
                label: (anchor.textContent ?? "").trim(),
                focusable: anchor.tabIndex === 0 && anchor.getBoundingClientRect().height > 0,
              })),
              controls: region?.querySelectorAll("button, form, iframe, input, select, textarea").length ?? -1,
              overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
              visible: box === undefined ? false : box.height > 0,
            };
          })(),
          stats: (() => {
            const region = document.querySelector("#family-10-stats");
            const authored = region?.querySelector("#family-10-stats-heading") ?? null;
            const lede = region?.querySelector("#family-10-stats-lede") ?? null;
            const ledeRect = lede?.getBoundingClientRect();
            const list = region?.querySelector(".uno-json-stats-list") ?? null;
            const native = region?.querySelector(".uno-json-stats") ?? null;
            const detail = region?.querySelector(".uno-json-stat .uno-json-stat-detail") ?? null;
            return {
              dts: [...(region?.querySelectorAll("dt") ?? [])].map((node) => node.textContent ?? ""),
              dds: [...(region?.querySelectorAll("dd") ?? [])].map((node) => node.textContent ?? ""),
              details: region?.querySelectorAll(".uno-json-stat-detail").length ?? -1,
              firstItemDetail: detail?.textContent ?? "",
              // `UNO-WO-113 / R01`: the donor's Markdown-capable detail renders through the shared family renderer, so the
              // detail is a block container carrying a real `<strong>`; a plain detail would stay an escaped `<span>`.
              detailTag: detail?.tagName ?? "",
              detailStrong: detail?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
              ledeStrong: lede?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
              surface: native?.getAttribute("data-uno-surface") ?? "",
              pairs: region?.querySelectorAll(".uno-json-stat").length ?? -1,
              controls: region?.querySelectorAll("button, form, iframe, input, select, textarea, a").length ?? -1,
              overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
              heading: region?.querySelectorAll("h1, h2, h3, h4, h5, h6").length ?? -1,
              headingTag: authored?.tagName ?? "",
              headingText: authored?.textContent ?? "",
              ledeTag: lede?.tagName ?? "",
              ledeText: lede?.textContent ?? "",
              ledeVisible: ledeRect !== undefined && ledeRect.height > 0 && ledeRect.width > 0,
              ledeAfterHeading: authored !== null && lede !== null
                && (authored.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
              ledeBeforeList: list !== null && lede !== null
                && (lede.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
            };
          })(),
          steps: (() => {
            const region = document.querySelector("#family-11-steps");
            const items = [...(region?.querySelectorAll("li.uno-json-timeline-item") ?? [])];
            const authored = region?.querySelector("#family-11-steps-heading") ?? null;
            const lede = region?.querySelector("#family-11-steps-lede") ?? null;
            const ledeRect = lede?.getBoundingClientRect();
            const list = region?.querySelector(".uno-json-timeline-list") ?? null;
            const native = region?.querySelector(".uno-json-timeline") ?? null;
            const body = region?.querySelector(".uno-json-timeline-description") ?? null;
            return {
              items: items.length,
              titles: items.map((item) => item.querySelector(".uno-json-timeline-title")?.textContent ?? ""),
              descriptions: region?.querySelectorAll(".uno-json-timeline-description").length ?? -1,
              // `UNO-WO-114 / R01`: the donor's step `body` is Markdown-capable, so the authored body renders through the shared
              // family renderer as a block container carrying a real `<strong>`; a plain body would stay an escaped `<p>`.
              bodyTag: body?.tagName ?? "",
              bodyStrong: body?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
              ledeStrong: lede?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
              surface: native?.getAttribute("data-uno-surface") ?? "",
              listTag: list?.tagName ?? "",
              markers: region?.querySelectorAll(".uno-json-timeline-marker").length ?? -1,
              heading: region?.querySelectorAll("h1, h2, h3, h4, h5, h6").length ?? -1,
              controls: region?.querySelectorAll("button, form, iframe, input, select, textarea, a").length ?? -1,
              overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
              ariaCurrent: items.filter((item) => item.hasAttribute("aria-current")).length,
              statuses: items.filter((item) => item.hasAttribute("data-uno-status")).length,
              dates: region?.querySelectorAll(".uno-json-timeline-date").length ?? -1,
              headingTag: authored?.tagName ?? "",
              headingText: authored?.textContent ?? "",
              ledeTag: lede?.tagName ?? "",
              ledeText: lede?.textContent ?? "",
              ledeVisible: ledeRect !== undefined && ledeRect.height > 0 && ledeRect.width > 0,
              ledeAfterHeading: authored !== null && lede !== null
                && (authored.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
              ledeBeforeList: list !== null && lede !== null
                && (lede.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
            };
          })(),
          table: (() => {
            // `UNO-WO-108 / R01` (R3): the family id is on the authored section, so the scroll control and the native
            // table are reached through it; every semantic probe below is unchanged.
            const region = document.querySelector("#family-13-table-table");
            const scroll = region?.querySelector(".uno-json-table-scroll") ?? null;
            const table = scroll?.querySelector("table.uno-json-table") ?? null;
            return {
              isSection: region?.classList.contains("uno-json-table-section") ?? false,
              isScroll: scroll?.classList.contains("uno-json-table-scroll") ?? false,
              focusable: scroll?.getAttribute("tabindex") ?? "",
              wrapperTag: table?.tagName ?? "",
              wrapperClass: table?.classList.contains("uno-json-table") ?? false,
              captions: [...(table?.querySelectorAll(":scope > caption") ?? [])].map((node) => node.textContent ?? ""),
              captionStrong: table?.querySelector("caption strong")?.textContent ?? "",
              headers: [...(table?.querySelectorAll("thead th") ?? [])].map((node) => ({
                text: node.textContent ?? "", scope: node.getAttribute("scope") ?? "",
              })),
              rows: [...(table?.querySelectorAll("tbody tr") ?? [])].map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent ?? "")),
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
              // `UNO-WO-080 / R01`: the two column titles are level-3 headings of their own columns, and there are no others.
        headings: [...(region?.querySelectorAll("h3.uno-json-heading") ?? [])].map((node) => node.textContent ?? ""),
              paragraphs: [...(region?.querySelectorAll("p.uno-json-prose") ?? [])].map((node) => node.textContent ?? ""),
              listItems: [...(region?.querySelectorAll("ul.uno-json-list > li") ?? [])].map((node) => node.textContent ?? ""),
              h3: region?.querySelectorAll("h3").length ?? -1,
              controls: region?.querySelectorAll("a, input, textarea, button, select, iframe").length ?? -1,
            };
          })(),
          cards: (() => {
            const root = document.querySelector("#family-15-cards");
            const heading = root?.querySelector(":scope > h2.uno-json-heading") ?? null;
            const grid = root?.querySelector(":scope > ul.uno-json-grid") ?? null;
            const items = [...(grid?.children ?? [])];
            const ids = [...(root?.querySelectorAll("[id]") ?? [])].map((node) => node.id);
            const lede = root?.querySelector("#family-15-cards-lede") ?? null;
            const ledeRect = lede?.getBoundingClientRect();
            return {
              rootTag: root?.tagName ?? "",
              rootGap: root?.getAttribute("data-uno-gap") ?? "",
              headingTag: heading?.tagName ?? "",
              headingId: heading?.id ?? "",
              headingText: heading?.textContent ?? "",
              headingIsFirst: root !== null && root.firstElementChild === heading,
              ledeTag: lede?.tagName ?? "",
              ledeId: lede?.id ?? "",
              ledeText: lede?.textContent ?? "",
              ledeVisible: ledeRect !== undefined && ledeRect.height > 0 && ledeRect.width > 0,
              ledeAfterHeading: heading !== null && lede !== null
                && (heading.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
              ledeBeforeGrid: grid !== null && lede !== null
                && (lede.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
              gridTag: grid?.tagName ?? "",
              gridId: grid?.id ?? "",
              columns: grid?.getAttribute("data-uno-columns") ?? "",
              semantics: grid?.getAttribute("data-uno-item-semantics") ?? "",
              ratio: grid?.getAttribute("data-uno-ratio") ?? "",
              items: items.length,
              itemsAreCells: items.every((item) => item.classList.contains("uno-json-cell")),
              itemTitles: [...(grid?.querySelectorAll("h3.uno-json-heading") ?? [])].map((node) => node.textContent ?? ""),
              itemTitleIds: [...(grid?.querySelectorAll("h3.uno-json-heading") ?? [])].map((node) => node.id),
              h2: root?.querySelectorAll("h2").length ?? -1,
              h3: root?.querySelectorAll("h3").length ?? -1,
              paragraphs: [...(root?.querySelectorAll("p.uno-json-prose") ?? [])].map((node) => node.textContent ?? ""),
              articles: root?.querySelectorAll("article").length ?? -1,
              controls: root?.querySelectorAll("a, img, form, button, input, textarea, select, iframe").length ?? -1,
              uniqueIds: new Set(ids).size === ids.length,
            };
          })(),
          features: (() => {
            const root = document.querySelector("#family-16-features");
            const heading = root?.querySelector(":scope > h2.uno-json-heading") ?? null;
            const grid = root?.querySelector(":scope > ul.uno-json-grid") ?? null;
            const items = [...(grid?.children ?? [])];
            const ids = [...(root?.querySelectorAll("[id]") ?? [])].map((node) => node.id);
            const lede = root?.querySelector("#family-16-features-lede") ?? null;
            const ledeRect = lede?.getBoundingClientRect();
            return {
              rootTag: root?.tagName ?? "",
              rootGap: root?.getAttribute("data-uno-gap") ?? "",
              headingTag: heading?.tagName ?? "",
              headingId: heading?.id ?? "",
              headingText: heading?.textContent ?? "",
              headingIsFirst: root !== null && root.firstElementChild === heading,
              ledeTag: lede?.tagName ?? "",
              ledeId: lede?.id ?? "",
              ledeText: lede?.textContent ?? "",
              ledeVisible: ledeRect !== undefined && ledeRect.height > 0 && ledeRect.width > 0,
              ledeAfterHeading: heading !== null && lede !== null
                && (heading.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
              ledeBeforeGrid: grid !== null && lede !== null
                && (lede.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
              gridTag: grid?.tagName ?? "",
              gridId: grid?.id ?? "",
              columns: grid?.getAttribute("data-uno-columns") ?? "",
              semantics: grid?.getAttribute("data-uno-item-semantics") ?? "",
              ratio: grid?.getAttribute("data-uno-ratio") ?? "",
              items: items.length,
              itemsAreCells: items.every((item) => item.classList.contains("uno-json-cell")),
              itemTitles: [...(grid?.querySelectorAll("h3.uno-json-heading") ?? [])].map((node) => node.textContent ?? ""),
              itemTitleIds: [...(grid?.querySelectorAll("h3.uno-json-heading") ?? [])].map((node) => node.id),
              h2: root?.querySelectorAll("h2").length ?? -1,
              h3: root?.querySelectorAll("h3").length ?? -1,
              paragraphs: [...(root?.querySelectorAll("p.uno-json-prose") ?? [])].map((node) => node.textContent ?? ""),
              articles: root?.querySelectorAll("article").length ?? -1,
              controls: root?.querySelectorAll("a, img, form, button, input, textarea, select, iframe").length ?? -1,
              uniqueIds: new Set(ids).size === ids.length,
            };
          })(),
          tableFocus: (() => {
            // `UNO-WO-108 / R01` (R3): the keyboard stop is the inner scroll control, not the authored section.
            const scroll = document.querySelector("#family-13-table-table")?.querySelector(".uno-json-table-scroll");
            scroll?.focus();
            return document.activeElement === scroll;
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
      familyCheck(`${width}px the ordered list shows all four authored entries and two safe destinations`,
        seen.listItems.length === 4
          && seen.listItems[0] === "Prepare"
          && seen.listItems[1].startsWith("Reference") && seen.listItems[1].includes("An authored note.")
          && seen.listItems[2].startsWith("Target") && seen.listItems[2].includes("A published Page.")
          && seen.listItems[3] === "Help unavailable"
          && seen.listAnchors === 2
          && seen.listHelpAnchors === 0 && seen.listLeaksKey === false
          && seen.listAnchorHrefs.includes("https://example.org/notes")
          && seen.listAnchorHrefs.includes("http://localhost:3000/en-001/wo108-target")
          && seen.listAnchorRels.every((rel) => rel.includes("noopener") && rel.includes("noreferrer")),
        JSON.stringify({ items: seen.listItems, hrefs: seen.listAnchorHrefs }));
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
      // `UNO-WO-112 / R01`: the hero check is now the credited surface — both Markdown bodies through the shared renderer
      // and exactly the two approved static actions, each focusable with its own `rel` and variant — and it records the
      // per-viewport key the four-case conjunction is built from.
      const heroLightOk = familyCheck(`${width}px hero shows both Markdown bodies and both approved static actions`,
        seen.hero.align === "center" && seen.hero.surface === "muted" && seen.hero.visible
          && seen.hero.eyebrow === HERO_EXPECTED.eyebrow
          && seen.hero.ledeStrong === HERO_EXPECTED.ledeStrong
          && seen.hero.supportEm === HERO_EXPECTED.supportEm
          && seen.hero.actions.length === HERO_EXPECTED.actions.length
          && HERO_EXPECTED.actions.every((action, index) =>
            seen.hero.actions[index].href === action.href
            && seen.hero.actions[index].label === action.label
            && seen.hero.actions[index].variant === action.variant
            && seen.hero.actions[index].rel === "noreferrer noopener"
            && seen.hero.actions[index].focusable)
          && seen.hero.controls === 0 && seen.hero.overflow === 0,
        JSON.stringify(seen.hero));
      if (heroLightOk) heroBrowserCases.add(`light:${width}`);
      // `UNO-WO-113 / R01`: the credited stats surface in the browser — both Markdown bodies through the shared renderer, the
      // closed surface, and exactly the authored value/label pairs with one Markdown detail on the first item.
      const statsLightOk = familyCheck(`${width}px stats show both Markdown bodies, the closed surface and two authored pairs`,
        seen.stats.dts.length === STATS_EXPECTED.items.length && seen.stats.dds.length === STATS_EXPECTED.items.length
          && STATS_EXPECTED.items.every((item, index) =>
            seen.stats.dts[index] === item.label
            && seen.stats.dds[index].replace(item.detail === "" ? "" : item.detail.replace(/\*\*/gu, ""), "").trim() === item.value)
          && seen.stats.details === 1 && seen.stats.detailTag === "DIV"
          && seen.stats.detailStrong === STATS_EXPECTED.items[0].detailStrong
          && seen.stats.ledeStrong === STATS_EXPECTED.ledeStrong
          && seen.stats.surface === STATS_EXPECTED.surface
          && seen.stats.heading === 1 && seen.stats.headingTag === "H2"
          && seen.stats.controls === 0 && seen.stats.overflow === 0,
        JSON.stringify(seen.stats));
      if (statsLightOk) statsBrowserCases.add(`light:${width}`);
      // `UNO-WO-114 / R01`: the credited steps surface in the browser — both Markdown bodies through the shared renderer, the
      // closed surface, the native ordered list and exactly the authored titles in order with no invented state or date.
      const stepsLightOk = familyCheck(`${width}px steps show both Markdown bodies, the closed surface and two ordered titles`,
        seen.steps.items === STEPS_EXPECTED.items.length
          && JSON.stringify(seen.steps.titles) === JSON.stringify(STEPS_EXPECTED.items.map((item) => item.title))
          && seen.steps.descriptions === 1 && seen.steps.bodyTag === "DIV"
          && seen.steps.bodyStrong === STEPS_EXPECTED.items[0].bodyStrong
          && seen.steps.ledeStrong === STEPS_EXPECTED.ledeStrong
          && seen.steps.surface === STEPS_EXPECTED.surface
          && seen.steps.listTag === "OL" && seen.steps.markers === STEPS_EXPECTED.items.length
          && seen.steps.ariaCurrent === 0 && seen.steps.statuses === 0 && seen.steps.dates === 0
          && seen.steps.heading === 3 && seen.steps.controls === 0 && seen.steps.overflow === 0,
        JSON.stringify(seen.steps));
      if (stepsLightOk) stepsBrowserCases.add(`light:${width}`);
      // `UNO-WO-072 / R01`: the authored heading and lede as the browser lays them out at this viewport.
      // `UNO-WO-113 / R01`: the stats lede is now Markdown-capable, so it is the prose `<section>` around the shared renderer
      // rather than the plain sibling `<p>` the still-bounded steps family keeps.
      sequenceCheck(`${width}px each sequence family shows its authored heading and one visible lede before its list`,
        [seen.stats, seen.steps].every((family) =>
          family.headingTag === "H2"
          && family.headingText.length > 0
          && family.ledeVisible
          && family.ledeAfterHeading
          && family.ledeBeforeList)
          && seen.stats.ledeTag === "SECTION" && seen.steps.ledeTag === "SECTION"
          && seen.stats.headingText === STATS_EXPECTED.heading
          && seen.stats.ledeText === STATS_EXPECTED.lede.replace(/\*\*/gu, "")
          && seen.steps.headingText === STEPS_EXPECTED.heading
          && seen.steps.ledeText === STEPS_EXPECTED.lede.replace(/\*\*/gu, "")
          && seen.mains === 1 && seen.h1s === 1 && seen.overflow === 0,
        JSON.stringify({
          stats: [seen.stats.headingTag, seen.stats.ledeTag, seen.stats.ledeAfterHeading, seen.stats.ledeBeforeList],
          steps: [seen.steps.headingTag, seen.steps.ledeTag, seen.steps.ledeAfterHeading, seen.steps.ledeBeforeList],
          overflow: seen.overflow,
        }));
      familyCheck(`${width}px quote shows one figure, blockquote and caption with separate attribution and role`,
        seen.quote.figures === 1 && seen.quote.quotes.length === 1
          && seen.quote.quotes[0] === "The fixture does not establish full parity."
          && seen.quote.captions === 1 && seen.quote.attribution === "Synthetic contributor"
          && seen.quote.role === "Reviewer" && seen.quote.align === "center" && seen.quote.surface === "bordered"
          && seen.quote.anchors === 0,
        JSON.stringify(seen.quote));
      // `UNO-WO-068 / R03`: the last four families, each scoped to its own composed region.
      // `UNO-WO-110 / R01` (§2 `browser`): the light-viewport observation is recorded under its own key only when this exact
      // assertion passed at this width — heading, Markdown lede and caption, two columns, four cells, no link, and the
      // scroll control actually receiving focus.
      const tableLightOk = familyCheck(`${width}px table shows a captioned two-column table and its scroll control takes focus`,
        seen.table.isSection && seen.table.isScroll && seen.table.focusable === "0" && seen.tableFocus
          && seen.table.wrapperTag === "TABLE" && seen.table.wrapperClass
          && JSON.stringify(seen.table.captions) === JSON.stringify(["Two synthetic records"])
          && seen.table.captionStrong === "synthetic"
          && JSON.stringify(seen.table.headers) === JSON.stringify([
            { text: "Phase", scope: "col" }, { text: "Count", scope: "col" },
          ])
          && JSON.stringify(seen.table.rows) === JSON.stringify([["First", "1"], ["Second", "2"]])
          && seen.table.links === 0,
        JSON.stringify(seen.table));
      if (tableLightOk) tableBrowserCases.add(`light:${width}`);
      familyCheck(`${width}px columns show two authored tight stacks with one paragraph and one native list`,
        seen.columns.isDiv === "DIV" && seen.columns.columns === "2" && seen.columns.semantics === "plain"
          && seen.columns.ratio === "start-wide" && seen.columns.cells === 2 && seen.columns.cellsAreCells
          && seen.columns.stacks.every(Boolean)
          && JSON.stringify(seen.columns.headings) === JSON.stringify(["Left column", "Right column"])
          && JSON.stringify(seen.columns.paragraphs) === JSON.stringify(["The left text."])
          && JSON.stringify(seen.columns.listItems) === JSON.stringify(["Check one", "Check two"])
          && seen.columns.h3 === 2 && seen.columns.controls === 0,
        JSON.stringify(seen.columns));
      familyCheck(`${width}px cards show a headed stack with one authored h2, a two-column list grid and two h3 titles`,
        seen.cards.rootTag === "DIV" && seen.cards.rootGap === "normal"
          && seen.cards.headingTag === "H2" && seen.cards.headingId === "family-15-cards-heading"
          && seen.cards.headingText === "Synthetic cards" && seen.cards.headingIsFirst
          && seen.cards.gridTag === "UL" && seen.cards.gridId === "family-15-cards-grid"
          && seen.cards.columns === "2" && seen.cards.semantics === "list" && seen.cards.ratio === ""
          && seen.cards.items === 2 && seen.cards.itemsAreCells
          && JSON.stringify(seen.cards.itemTitles) === JSON.stringify(["Card one", "Card two"])
          && JSON.stringify(seen.cards.itemTitleIds) === JSON.stringify(["family-15-cards-item-0-title", "family-15-cards-item-1-title"])
          && seen.cards.h2 === 1 && seen.cards.h3 === 2
          && JSON.stringify(seen.cards.paragraphs) === JSON.stringify(["Synthetic cards explain the choices.", "First card body."])
          && seen.cards.ledeTag === "P" && seen.cards.ledeId === "family-15-cards-lede"
          && seen.cards.ledeText === "Synthetic cards explain the choices."
          && seen.cards.articles === 0 && seen.cards.controls === 0 && seen.cards.uniqueIds,
        JSON.stringify(seen.cards).slice(0, 240));
      familyCheck(`${width}px features show a separate headed stack with one authored h2, a three-column list grid and two h3 titles`,
        seen.features.rootTag === "DIV" && seen.features.rootGap === "normal"
          && seen.features.headingTag === "H2" && seen.features.headingId === "family-16-features-heading"
          && seen.features.headingText === "Synthetic features" && seen.features.headingIsFirst
          && seen.features.gridTag === "UL" && seen.features.gridId === "family-16-features-grid"
          && seen.features.columns === "3" && seen.features.semantics === "list" && seen.features.ratio === ""
          && seen.features.items === 2 && seen.features.itemsAreCells
          && JSON.stringify(seen.features.itemTitles) === JSON.stringify(["Feature one", "Feature two"])
          && JSON.stringify(seen.features.itemTitleIds) === JSON.stringify(["family-16-features-item-0-title", "family-16-features-item-1-title"])
          && seen.features.h2 === 1 && seen.features.h3 === 2
          && JSON.stringify(seen.features.paragraphs) === JSON.stringify(["Synthetic features describe the work.", "First feature body."])
          && seen.features.ledeTag === "P" && seen.features.ledeId === "family-16-features-lede"
          && seen.features.ledeText === "Synthetic features describe the work."
          && seen.features.articles === 0 && seen.features.controls === 0 && seen.features.uniqueIds,
        JSON.stringify(seen.features).slice(0, 240));
      // `UNO-WO-070 / R01`: the accessible document outline of the two headed families, measured in the real browser.
      familyCheck(`${width}px the headed families keep one h2 before every item h3 with no invented control or overflow`,
        [seen.cards, seen.features].every((family) =>
          family.rootTag === "DIV"
          && family.headingTag === "H2"
          && family.headingIsFirst
          && family.gridTag === "UL"
          && family.items === 2
          && family.h3 === 2
          && family.h2 === 1
          && family.uniqueIds
          && family.articles === 0
          && family.controls === 0)
          && seen.cards.h3 + seen.features.h3 === 4
          && seen.mains === 1 && seen.h1s === 1 && seen.overflow === 0,
        JSON.stringify({
          cards: [seen.cards.h2, seen.cards.h3], features: [seen.features.h2, seen.features.h3],
          mains: seen.mains, h1: seen.h1s, overflow: seen.overflow,
        }));
      // `UNO-WO-071 / R01`: the authored lede paragraphs as the browser lays them out at this viewport.
      ledeCheck(`${width}px each headed family shows its authored lede as one visible paragraph between the h2 and the list`,
        [seen.cards, seen.features].every((family) =>
          family.ledeTag === "P"
          && family.ledeVisible
          && family.ledeAfterHeading
          && family.ledeBeforeGrid
          && family.paragraphs.length === 2
          && family.paragraphs[0].length > 0
          && family.controls === 0)
          && seen.cards.ledeText === "Synthetic cards explain the choices."
          && seen.features.ledeText === "Synthetic features describe the work."
          && seen.cards.ledeId !== seen.features.ledeId
          && seen.overflow === 0,
        JSON.stringify({
          cards: [seen.cards.ledeId, seen.cards.ledeVisible, seen.cards.ledeAfterHeading, seen.cards.ledeBeforeGrid],
          features: [seen.features.ledeId, seen.features.ledeVisible, seen.features.ledeAfterHeading, seen.features.ledeBeforeGrid],
          overflow: seen.overflow,
        }));
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

      // `UNO-WO-075 / R01`: the five authored-text families as this browser actually lays them out at this viewport.
      const textFiveSeen = await tab.evaluate(() => {
        const ids = ["family-2-list", "family-3-faq", "family-13-table"];
        return ids.map((id) => {
          const root = document.getElementById(id);
          const rich = id === "family-2-list" || id === "family-13-table";
          const nativeId = `${id}-${id === "family-2-list" ? "list" : "table"}`;
          const heading = root?.querySelector(":scope > h2.uno-json-heading") ?? null;
          // `UNO-WO-108 / R01` (R3): the rich families carry their Markdown lede inside the native section, so the lede and
          // the native node are read there; the unchanged FAQ keeps its plain sibling lede and last-child native node.
          const native = rich ? (root?.querySelector(`#${nativeId}`) ?? null) : (root?.lastElementChild ?? null);
          const lede = rich
            ? (native?.querySelector(id === "family-2-list" ? ".uno-json-list-lede" : ".uno-json-table-lede") ?? null)
            : (root?.querySelector(":scope > p.uno-json-prose") ?? null);
          const insideNative = rich ? (native?.querySelector("ol, .uno-json-table-scroll") ?? null) : null;
          const headingBox = heading?.getBoundingClientRect() ?? null;
          const ledeBox = lede?.getBoundingClientRect() ?? null;
          return {
            id,
            isStack: root?.classList.contains("uno-json-stack") ?? false,
            headingText: heading?.textContent ?? "",
            headingVisible: headingBox !== null && headingBox.height > 0 && headingBox.width > 0,
            ledeText: lede?.textContent ?? "",
            ledeVisible: ledeBox !== null && ledeBox.height > 0 && ledeBox.width > 0,
            ledeStrong: lede?.querySelector("strong")?.textContent ?? "",
            headingBeforeLede: rich
              ? heading !== null && native !== null
                && (heading.compareDocumentPosition(native) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
              : heading !== null && lede !== null
                && (heading.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
            ledeBeforeNative: rich
              ? lede !== null && insideNative !== null
                && (lede.compareDocumentPosition(insideNative) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
              : lede !== null && native !== null && native !== lede
                && (lede.compareDocumentPosition(native) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
            nativeId: native?.id ?? "",
            nativeTag: native?.tagName ?? "",
            h2Count: root?.querySelectorAll("h2").length ?? -1,
            controls: root?.querySelectorAll("a, button, input, select, textarea, iframe").length ?? -1,
            safeAnchors: root?.querySelectorAll("a.uno-json-list-link").length ?? 0,
          };
        });
      });
      const expectedFive = [
        ["family-2-list", "Synthetic list heading", "A bounded list on one published Page.",
          "family-2-list-list", "SECTION", "bounded list", 2],
        ["family-3-faq", "Synthetic FAQ heading", "Synthetic FAQ introduction.",
          "family-3-faq-accordion", "DIV", "", 0],
        ["family-13-table", "Synthetic table heading", "The table explains synthetic totals.",
          "family-13-table-table", "SECTION", "table", 0],
      ];
      textFiveCheck(`${width}px the three remaining authored-text families show a visible heading and lede before their native node`,
        textFiveSeen.length === 3
          && expectedFive.every(([id, headingText, ledeText, nativeId, nativeTag, ledeStrong, safeAnchors]) => {
            const found = textFiveSeen.find((entry) => entry.id === id);
            return found !== undefined
              && found.isStack
              && found.headingText === headingText
              && found.headingVisible
              && found.ledeText === ledeText
              && found.ledeVisible
              && found.ledeStrong === ledeStrong
              && found.headingBeforeLede
              && found.ledeBeforeNative
              && found.nativeId === nativeId
              && found.nativeTag === nativeTag
              && found.h2Count === 1
              && found.safeAnchors === safeAnchors
              && found.controls === safeAnchors;
          })
          && seen.overflow === 0,
        JSON.stringify(textFiveSeen.filter((entry) => entry.id !== "family-3-faq")
          .map((entry) => [entry.id, entry.isStack, entry.ledeText, entry.ledeStrong, entry.ledeVisible,
            entry.headingBeforeLede, entry.ledeBeforeNative, entry.nativeTag, entry.h2Count, entry.controls])));
      // `UNO-WO-108 / R01` (§4 `browser`): the list must show its two safe anchors and no other control. `UNO-WO-111 / R01`
      // records the pass under a per-viewport key instead of a sticky flag, so the credit rests on four executed cases.
      for (const entry of textFiveSeen) {
        if (entry.id === "family-2-list" && entry.safeAnchors === 2 && entry.controls === 2 && entry.nativeTag === "SECTION") {
          listBrowserCases.add(`light:${width}`);
        }
      }

      // `UNO-WO-080 / R01`: the composed donor outlines as live DOM at this viewport, in native containers only.
      const outlineSeen = await tab.evaluate(() => {
        const steps = document.getElementById("family-11-steps-timeline");
        const faq = document.getElementById("family-3-faq-accordion");
        const columns = document.getElementById("family-14-columns");
        const text = (nodes) => nodes.map((node) => node.textContent ?? "");
        const columnCells = columns ? [...columns.children] : [];
        return {
          stepHeadings: steps ? text([...steps.querySelectorAll("ol > li > h3.uno-json-timeline-title")]) : [],
          stepParagraphTitles: steps ? steps.querySelectorAll("ol > li > p.uno-json-timeline-title").length : -1,
          faqHeadings: faq ? text([...faq.querySelectorAll("details > summary > h3")]) : [],
          faqSummaryText: faq ? text([...faq.querySelectorAll("details > summary")]) : [],
          columnHeadings: text(columnCells.map((cell) => cell.querySelector(":scope > div > h3.uno-json-heading"))),
          columnFirstChildIsHeading: columnCells.every(
            (cell) => cell.querySelector(":scope > div")?.firstElementChild?.tagName === "H3",
          ),
          h1Count: document.querySelectorAll("h1").length,
          mainCount: document.querySelectorAll("main").length,
          h4Count: document.querySelectorAll("h4").length,
          headingRoles: document.querySelectorAll('[role="heading"], [aria-level]').length,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          controlsInOutline: document.querySelectorAll(
            "#family-11-steps-timeline button, #family-3-faq-accordion button, #family-14-columns button",
          ).length,
        };
      });
      outlineCheck(`${width}px two step headings sit inside their own list items`,
        outlineSeen.stepHeadings.length === 2 && outlineSeen.stepParagraphTitles === 0, JSON.stringify(outlineSeen.stepHeadings));
      outlineCheck(`${width}px the step headings keep authored order`,
        outlineSeen.stepHeadings[0] === "Draft" && outlineSeen.stepHeadings[1] === "Review",
        JSON.stringify(outlineSeen.stepHeadings));
      outlineCheck(`${width}px one FAQ question heading sits inside its own native summary`,
        outlineSeen.faqHeadings.length === 1
          && outlineSeen.faqHeadings[0] === "Can this contact notice send anything?"
          && outlineSeen.faqSummaryText.length === 1,
        JSON.stringify({ headings: outlineSeen.faqHeadings, summaries: outlineSeen.faqSummaryText }));
      outlineCheck(`${width}px each column title is the first level-3 heading of its own column`,
        outlineSeen.columnHeadings.length === 2
          && outlineSeen.columnHeadings[0] === "Left column"
          && outlineSeen.columnHeadings[1] === "Right column"
          && outlineSeen.columnFirstChildIsHeading,
        JSON.stringify(outlineSeen.columnHeadings));
      outlineCheck(`${width}px the outlined Page keeps one main, one h1, no h4 or invented heading role, no control and no overflow`,
        outlineSeen.h1Count === 1 && outlineSeen.mainCount === 1 && outlineSeen.h4Count === 0
          && outlineSeen.headingRoles === 0 && outlineSeen.controlsInOutline === 0 && outlineSeen.overflow === 0,
        JSON.stringify(outlineSeen));

      const familySummary = tab.locator("#family-3-faq-accordion summary").first();
      const familyDetails = tab.locator("#family-3-faq-accordion details").first();
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
      // `UNO-WO-080 / R01`: the same three level-3 outline regions survive the dark, reduced-motion scheme.
      const darkOutline = await tab.evaluate(() => {
        const steps = document.getElementById("family-11-steps-timeline");
        const faq = document.getElementById("family-3-faq-accordion");
        const columns = document.getElementById("family-14-columns");
        return {
          scheme: matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          steps: steps ? steps.querySelectorAll("ol > li > h3.uno-json-timeline-title").length : -1,
          faq: faq ? faq.querySelectorAll("details > summary > h3").length : -1,
          columns: columns
            ? [...columns.children].filter(
                (cell) => cell.querySelector(":scope > div")?.firstElementChild?.tagName === "H3",
              ).length
            : -1,
          h4s: document.querySelectorAll("h4").length,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        };
      });
      outlineCheck(`dark ${width}px the three level-3 outline regions survive dark and reduced motion`,
        darkOutline.scheme && darkOutline.reducedMotion && darkOutline.steps === 2 && darkOutline.faq === 1
          && darkOutline.columns === 2 && darkOutline.h4s === 0 && darkOutline.overflow === 0,
        JSON.stringify(darkOutline));
      // `UNO-WO-110 / R01` (§2 `browser`): the rich table under `prefers-color-scheme: dark` and
      // `prefers-reduced-motion: reduce` at this exact viewport, including its focusable scroll control — the same real DOM
      // the light pass measured, so the flag rests on four executed observations rather than one.
      const darkTable = await tab.evaluate(() => {
        const root = document.getElementById("family-13-table");
        const section = document.getElementById("family-13-table-table");
        const scroll = section?.querySelector(".uno-json-table-scroll") ?? null;
        const table = scroll?.querySelector("table.uno-json-table") ?? null;
        scroll?.focus();
        return {
          scheme: matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          isStack: root?.classList.contains("uno-json-stack") ?? false,
          surface: section?.getAttribute("data-uno-surface") ?? "",
          focusable: scroll?.getAttribute("tabindex") ?? "",
          focused: document.activeElement === scroll,
          caption: table?.querySelector("caption")?.textContent ?? "",
          captionStrong: table?.querySelector("caption strong")?.textContent ?? "",
          headers: table === null ? -1 : table.querySelectorAll("th[scope=col]").length,
          cells: table === null ? -1 : table.querySelectorAll("tbody td").length,
          links: section === null ? -1 : section.querySelectorAll("a").length,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        };
      });
      const darkTableOk = familyCheck(
        `dark ${width}px the rich table keeps its caption, two columns, four cells and a focused scroll control`,
        darkTable.scheme && darkTable.reducedMotion && darkTable.isStack && darkTable.surface === "muted"
          && darkTable.focusable === "0" && darkTable.focused
          && darkTable.caption === "Two synthetic records" && darkTable.captionStrong === "synthetic"
          && darkTable.headers === 2 && darkTable.cells === 4 && darkTable.links === 0 && darkTable.overflow === 0,
        JSON.stringify(darkTable),
      );
      if (darkTableOk) tableBrowserCases.add(`dark:${width}`);
      // `UNO-WO-111 / R01` (§2 `browser`): the rich List under dark and reduced motion at this viewport — its two proven
      // anchors keep their hrefs and `rel`, the declared-but-inactive item stays inert text, and no declaration key leaks.
      const darkList = await tab.evaluate(() => {
        const section = document.getElementById("family-2-list-list");
        const anchors = section === null ? [] : [...section.querySelectorAll("a.uno-json-list-link")];
        return {
          scheme: matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          surface: section?.getAttribute("data-uno-surface") ?? "",
          count: anchors.length,
          hrefs: anchors.map((anchor) => anchor.getAttribute("href")),
          rels: anchors.map((anchor) => anchor.getAttribute("rel") ?? ""),
          focusable: anchors.length > 0 && anchors.every((anchor) => anchor.tabIndex === 0),
          inert: [...(section?.querySelectorAll("span") ?? [])].map((span) => (span.textContent ?? "").trim()),
          leaks: section === null || section.innerHTML.includes("example.help"),
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        };
      });
      const darkListOk = familyCheck(
        `dark ${width}px the rich list keeps its two proven anchors, rel and inert label`,
        darkList.scheme && darkList.reducedMotion && darkList.surface === "bordered"
          && darkList.count === 2 && darkList.focusable
          && darkList.hrefs.includes("https://example.org/notes")
          && darkList.hrefs.includes("http://localhost:3000/en-001/wo108-target")
          && darkList.rels.every((rel) => rel.includes("noopener") && rel.includes("noreferrer"))
          && darkList.inert.includes("Help unavailable") && darkList.leaks === false && darkList.overflow === 0,
        JSON.stringify(darkList),
      );
      if (darkListOk) listBrowserCases.add(`dark:${width}`);
      // `UNO-WO-112 / R01` (§2 `browser`): the credited hero under dark and reduced motion at this viewport — both Markdown
      // bodies still render through the shared renderer, and both approved static actions keep their href, `rel`, variant
      // and a real focus box, with no control and no overflow.
      const darkHero = await tab.evaluate(() => {
        const region = document.querySelector("#family-9-hero");
        const links = [...(region?.querySelectorAll("ul.uno-json-hero-actions a.uno-json-action") ?? [])];
        return {
          scheme: matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          surface: region?.getAttribute("data-uno-surface") ?? "",
          ledeStrong: region?.querySelector(".uno-json-hero-lede strong.uno-family-md-strong")?.textContent ?? "",
          supportEm: region?.querySelector(".uno-json-hero-support em.uno-family-md-em")?.textContent ?? "",
          actions: links.map((anchor) => ({
            href: anchor.getAttribute("href"),
            rel: anchor.getAttribute("rel") ?? "",
            variant: anchor.getAttribute("data-uno-variant") ?? "",
            label: (anchor.textContent ?? "").trim(),
            focusable: anchor.tabIndex === 0 && anchor.getBoundingClientRect().height > 0,
          })),
          controls: region?.querySelectorAll("button, form, iframe, input, select, textarea").length ?? -1,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        };
      });
      const darkHeroOk = familyCheck(
        `dark ${width}px the hero keeps both Markdown bodies and both approved static actions`,
        darkHero.scheme && darkHero.reducedMotion && darkHero.surface === "muted"
          && darkHero.ledeStrong === HERO_EXPECTED.ledeStrong && darkHero.supportEm === HERO_EXPECTED.supportEm
          && darkHero.actions.length === HERO_EXPECTED.actions.length
          && HERO_EXPECTED.actions.every((action, index) =>
            darkHero.actions[index].href === action.href
            && darkHero.actions[index].label === action.label
            && darkHero.actions[index].variant === action.variant
            && darkHero.actions[index].rel === "noreferrer noopener"
            && darkHero.actions[index].focusable)
          && darkHero.controls === 0 && darkHero.overflow === 0,
        JSON.stringify(darkHero),
      );
      if (darkHeroOk) heroBrowserCases.add(`dark:${width}`);
      // `UNO-WO-113 / R01` (§2 `browser`): the credited stats family under dark and reduced motion at this viewport — both
      // Markdown bodies through the shared renderer, the closed surface, the authored pairs and no control or overflow.
      const darkStats = await tab.evaluate((expected) => {
        const region = document.querySelector("#family-10-stats");
        const native = region?.querySelector(".uno-json-stats") ?? null;
        const detail = region?.querySelector(".uno-json-stat .uno-json-stat-detail") ?? null;
        return {
          scheme: matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          surface: native?.getAttribute("data-uno-surface") ?? "",
          ledeStrong: region?.querySelector("#family-10-stats-lede strong.uno-family-md-strong")?.textContent ?? "",
          detailTag: detail?.tagName ?? "",
          detailStrong: detail?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
          dts: [...(region?.querySelectorAll("dt") ?? [])].map((node) => node.textContent ?? ""),
          dds: [...(region?.querySelectorAll("dd") ?? [])].map((node) => node.textContent ?? ""),
          pairs: region?.querySelectorAll(".uno-json-stat").length ?? -1,
          details: region?.querySelectorAll(".uno-json-stat-detail").length ?? -1,
          controls: region?.querySelectorAll("button, form, iframe, input, select, textarea, a").length ?? -1,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          expectedLabels: expected,
        };
      }, STATS_EXPECTED.items.map((item) => item.label));
      const darkStatsOk = familyCheck(
        `dark ${width}px the stats family keeps both Markdown bodies, the closed surface and its pairs`,
        darkStats.scheme && darkStats.reducedMotion && darkStats.surface === STATS_EXPECTED.surface
          && darkStats.ledeStrong === STATS_EXPECTED.ledeStrong
          && darkStats.detailTag === "DIV" && darkStats.detailStrong === STATS_EXPECTED.items[0].detailStrong
          && darkStats.pairs === STATS_EXPECTED.items.length && darkStats.details === 1
          && JSON.stringify(darkStats.dts) === JSON.stringify(darkStats.expectedLabels)
          && darkStats.controls === 0 && darkStats.overflow === 0,
        JSON.stringify(darkStats),
      );
      if (darkStatsOk) statsBrowserCases.add(`dark:${width}`);
      // `UNO-WO-114 / R01` (§2 `browser`): the credited steps family under dark and reduced motion at this viewport — both
      // Markdown bodies through the shared renderer, the closed surface, the ordered titles and no invented state or control.
      const darkSteps = await tab.evaluate((expected) => {
        const region = document.querySelector("#family-11-steps");
        const native = region?.querySelector(".uno-json-timeline") ?? null;
        const items = [...(region?.querySelectorAll("li.uno-json-timeline-item") ?? [])];
        const body = region?.querySelector(".uno-json-timeline-description") ?? null;
        return {
          scheme: matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          surface: native?.getAttribute("data-uno-surface") ?? "",
          ledeStrong: region?.querySelector("#family-11-steps-lede strong.uno-family-md-strong")?.textContent ?? "",
          bodyTag: body?.tagName ?? "",
          bodyStrong: body?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
          titles: items.map((item) => item.querySelector(".uno-json-timeline-title")?.textContent ?? ""),
          descriptions: region?.querySelectorAll(".uno-json-timeline-description").length ?? -1,
          statuses: items.filter((item) => item.hasAttribute("data-uno-status")).length,
          ariaCurrent: items.filter((item) => item.hasAttribute("aria-current")).length,
          dates: region?.querySelectorAll(".uno-json-timeline-date").length ?? -1,
          controls: region?.querySelectorAll("button, form, iframe, input, select, textarea, a").length ?? -1,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          expectedTitles: expected,
        };
      }, STEPS_EXPECTED.items.map((item) => item.title));
      const darkStepsOk = familyCheck(
        `dark ${width}px the steps family keeps its ordered titles and both Markdown bodies with no invented state`,
        darkSteps.scheme && darkSteps.reducedMotion && darkSteps.surface === STEPS_EXPECTED.surface
          && darkSteps.ledeStrong === STEPS_EXPECTED.ledeStrong
          && darkSteps.bodyTag === "DIV" && darkSteps.bodyStrong === STEPS_EXPECTED.items[0].bodyStrong
          && JSON.stringify(darkSteps.titles) === JSON.stringify(darkSteps.expectedTitles)
          && darkSteps.descriptions === 1 && darkSteps.statuses === 0 && darkSteps.ariaCurrent === 0
          && darkSteps.dates === 0 && darkSteps.controls === 0 && darkSteps.overflow === 0,
        JSON.stringify(darkSteps),
      );
      if (darkStepsOk) stepsBrowserCases.add(`dark:${width}`);
    }
    // `UNO-WO-111 / R01` (§2 `browser`): `list.browser` is the conjunction of the same four executed observations, so a
    // deleted, skipped or superficial case can never leave the credited family true. `UNO-WO-112 / R01` moves the rule into
    // the extracted `conjunction()` helper so all three credited families share one definition.
    localA2.list.browser = conjunction(listBrowserCases);
    check(
      "A2_LOCAL_BROWSER the rich list was observed at 390px and 1280px in light and dark/reduced motion with both proven anchors",
      localA2.list.browser,
      conjunctionDetail(listBrowserCases),
    );
    // `UNO-WO-110 / R01` (§2 `browser`): `table.browser` is the conjunction of four executed observations — light and
    // dark/reduced-motion at 390px and 1280px — so a deleted, skipped or superficial case can never leave it true.
    localA2.table.browser = conjunction(tableBrowserCases);
    check(
      "A2_LOCAL_BROWSER the rich table was observed at 390px and 1280px in light and dark/reduced motion with its scroll control focused",
      localA2.table.browser,
      conjunctionDetail(tableBrowserCases),
    );
    // `UNO-WO-112 / R01` (§2 `browser`): `hero.browser` is the same four-case conjunction, and each key is added only by a
    // real Chromium assertion that the hero's Markdown bodies and its two approved static actions survived that case.
    localA2.hero.browser = conjunction(heroBrowserCases);
    check(
      "A2_LOCAL_BROWSER the rich hero was observed at 390px and 1280px in light and dark/reduced motion with both actions intact",
      localA2.hero.browser,
      conjunctionDetail(heroBrowserCases),
    );
    // `UNO-WO-113 / R01` (§2 `browser`): the credited stats family's four-case conjunction, each key added only by a real
    // Chromium assertion that its Markdown lede, Markdown detail, closed surface and pairs survived that case.
    localA2.stats.browser = conjunction(statsBrowserCases);
    check(
      "A2_LOCAL_BROWSER the rich stats family was observed at 390px and 1280px in light and dark/reduced motion with both Markdown bodies",
      localA2.stats.browser,
      conjunctionDetail(statsBrowserCases),
    );
    // `UNO-WO-114 / R01` (§2 `browser`): the credited steps family's four-case conjunction, each key added only by a real
    // Chromium assertion that its Markdown lede, Markdown body, closed surface and ordered titles survived that case.
    localA2.steps.browser = conjunction(stepsBrowserCases);
    check(
      "A2_LOCAL_BROWSER the rich steps family was observed at 390px and 1280px in light and dark/reduced motion with both Markdown bodies",
      localA2.steps.browser,
      conjunctionDetail(stepsBrowserCases),
    );
    await tab.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
    familyCheck("the family Page raised no new console or page error", consoleErrors.length === errorsBefore,
      consoleErrors.slice(errorsBefore).join(" | ").slice(0, 180));
    check(
      "FAMILY_LEDE_BROWSER the authored ledes were measured in real Chromium at both viewports",
      ledeBrowserOk && ledeBrowserChecks === 2,
      `checks=${ledeBrowserChecks}`,
    );
    check(
      "FAMILY_STATS_STEPS_BROWSER the sequence headings and ledes were measured in real Chromium at both viewports",
      sequenceBrowserOk && sequenceBrowserChecks === 2,
      `checks=${sequenceBrowserChecks}`,
    );
    check(
      "FAMILY_TEXT_FIVE_BROWSER the five authored-text families were measured in real Chromium at both viewports",
      textFiveBrowserOk && textFiveBrowserChecks === 2,
      `checks=${textFiveBrowserChecks}`,
    );
    // `UNO-WO-080 / R01`: five light-viewport checks per width plus one dark/reduced-motion check per width, all gated.
    check(
      "FAMILY_OUTLINE_THREE_BROWSER=PASS the three level-3 outline regions were measured in real Chromium at both viewports",
      outlineBrowserOk && outlineBrowserChecks === 12,
      `checks=${outlineBrowserChecks} ok=${outlineBrowserOk}`,
    );
    check(
      "FAMILY_BROWSER=PASS the composed family Page passed every Chromium assertion at 390px and 1280px",
      familyOk && ledeBrowserOk && ledeBrowserChecks === 2 && sequenceBrowserOk && sequenceBrowserChecks === 2
        && textFiveBrowserOk && textFiveBrowserChecks === 2 && outlineBrowserOk && outlineBrowserChecks === 12,
    );
    // `UNO-WO-112 / R01`: every credited family's record is built by the extracted `createFamilyEvidence()` and can only be
    // complete when all seven dimensions executed. `isCreditable()` is the one definition of "complete", so a missing or
    // mistyped dimension can never be counted here.
    {
      const records = { list: localA2.list, table: localA2.table, hero: localA2.hero, stats: localA2.stats, steps: localA2.steps };
      const dimensions = Object.values(records).reduce((total, record) => total + Object.keys(record).length, 0);
      check(
        "A2_LOCAL_TABLE_LIST_HERO_STATS_STEPS_EVIDENCE=35/35 (table, list, hero, stats and steps credited; P6 destination proof in the three-Site gate)",
        records.list && records.table && records.hero && records.stats && records.steps
          && dimensions === 35
          && Object.values(localA2).every((record) => isCreditable(record)),
        JSON.stringify({ ...records, refusalReasons }),
      );
    }
    check(
      "DIVIDER_PARITY=PASS the divider passed source, HTTP and light/dark Chromium evidence",
      dividerOk === true && familyOk === true && dividerChecks === 12,
      `checks=${dividerChecks} dividerOk=${dividerOk} familyOk=${familyOk}`,
    );

    // --- `UNO-WO-084 / R01` checkpoint A1: prose + callout in real Chromium at both viewports ----------------------
    // Every flag is set only by a probe that actually ran; a deleted probe leaves the evidence false and suppresses the
    // parity label, so the served-HTML proof alone can never stand in for the browser proof.
    let a1ProseBrowserOk = true;
    let a1ProseBrowserChecks = 0;
    let a1CalloutBrowserOk = true;
    let a1CalloutBrowserChecks = 0;
    const a1ProseCheck = (label, ok, detail = "") => {
      a1ProseBrowserChecks += 1;
      if (!ok) a1ProseBrowserOk = false;
      return check(`A1_BROWSER_PROSE ${label}`, ok, detail);
    };
    const a1CalloutCheck = (label, ok, detail = "") => {
      a1CalloutBrowserChecks += 1;
      if (!ok) a1CalloutBrowserOk = false;
      return check(`A1_BROWSER_CALLOUT ${label}`, ok, detail);
    };
    for (const width of [390, 1280]) {
      for (const scheme of ["light", "dark"]) {
        requests.length = 0;
        await tab.setViewportSize({ width, height: 900 });
        await tab.emulateMedia({ colorScheme: scheme, reducedMotion: scheme === "dark" ? "reduce" : "no-preference" });
        await tab.goto(FAMILY_URL, { waitUntil: "load" });
        await delay(300);
        const rich = await tab.evaluate(() => {
          const prose = document.getElementById("family-0-prose");
          const callout = document.getElementById("family-1-callout");
          const box = (node) => {
            const rect = node?.getBoundingClientRect() ?? null;
            return rect !== null && rect.width > 0 && rect.height > 0;
          };
          const heading = prose?.querySelector("h2.uno-json-prose-heading") ?? null;
          const lede = prose?.querySelector(".uno-json-prose-lede") ?? null;
          const link = prose?.querySelector("a.uno-family-md-link") ?? null;
          const insideHeading = callout?.querySelector("h2.uno-json-prose-heading") ?? null;
          return {
            scheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
            reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
            proseFound: prose !== null,
            proseBox: box(prose),
            surface: prose?.getAttribute("data-uno-surface") ?? "",
            align: prose?.getAttribute("data-uno-align") ?? "",
            headingText: heading?.textContent ?? "",
            headingBox: box(heading),
            ledeText: lede?.textContent ?? "",
            ledeBox: box(lede),
            strong: prose?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
            code: prose?.querySelector("code.uno-family-md-code")?.textContent ?? "",
            linkHref: link?.getAttribute("href") ?? "",
            linkRel: link?.getAttribute("rel") ?? "",
            linkBox: box(link),
            headingBeforeLede: heading !== null && lede !== null
              && (heading.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
            calloutFound: callout !== null,
            calloutBox: box(callout),
            tone: callout?.getAttribute("data-uno-tone") ?? "",
            insideHeadingText: insideHeading?.textContent ?? "",
            insideHeadingBox: box(insideHeading),
            calloutStrong: callout?.querySelector("strong.uno-family-md-strong")?.textContent ?? "",
            alert: callout?.getAttribute("role") ?? "",
            overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
            controls: document.querySelectorAll("#family-0-prose form, #family-0-prose input, #family-0-prose button").length,
          };
        });
        const focused = await tab.evaluate(() => {
          const link = document.querySelector("#family-0-prose a.uno-family-md-link");
          if (link === null) return "";
          link.focus();
          return document.activeElement === link ? link.getAttribute("href") ?? "" : "";
        });
        const externalRequest = requests.some((entry) => String(entry).includes("example.org"));
        a1ProseCheck(`${scheme} ${width}px the rich prose renders its authored h2, lede and surface`,
          rich.proseFound && rich.proseBox && rich.headingText === "Synthetic prose heading" && rich.headingBox
            && rich.ledeText.startsWith("Synthetic prose introduction") && rich.ledeBox
            && rich.headingBeforeLede && rich.align === "center" && rich.surface === "muted",
          JSON.stringify({ heading: rich.headingText, align: rich.align, surface: rich.surface }));
        a1ProseCheck(`${scheme} ${width}px the Markdown emphasis, code span and link are real elements`,
          rich.strong === "strong" && rich.code === "inline code"
            && rich.linkHref === "https://example.org/notes" && rich.linkRel === "noopener noreferrer" && rich.linkBox,
          JSON.stringify({ strong: rich.strong, href: rich.linkHref, rel: rich.linkRel }));
        a1ProseCheck(`${scheme} ${width}px the classified link is focusable and keeps its exact destination`,
          focused === "https://example.org/notes", focused);
        a1ProseCheck(`${scheme} ${width}px the prose adds no form control and no horizontal overflow`,
          rich.controls === 0 && rich.overflow === 0, `controls=${rich.controls} overflow=${rich.overflow}`);
        a1ProseCheck(`${scheme} ${width}px the prose makes no request to the authored destination`,
          externalRequest === false, `external=${externalRequest}`);

        a1CalloutCheck(`${scheme} ${width}px the callout renders its accent, tone and inside heading`,
          rich.calloutFound && rich.calloutBox && rich.tone === "warning"
            && rich.insideHeadingText === "Synthetic callout heading" && rich.insideHeadingBox
            && rich.calloutStrong === "bounded",
          JSON.stringify({ tone: rich.tone, heading: rich.insideHeadingText, strong: rich.calloutStrong }));
        a1CalloutCheck(`${scheme} ${width}px the callout keeps no surrogate alert role and no overflow`,
          rich.alert === "" && rich.overflow === 0, `role=${rich.alert} overflow=${rich.overflow}`);
        a1CalloutCheck(`${scheme} ${width}px the colour scheme and motion preference were really applied`,
          rich.scheme === scheme && (scheme === "light" ? rich.reduced === false : rich.reduced === true),
          JSON.stringify({ scheme: rich.scheme, reduced: rich.reduced }));
      }
    }
    await tab.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
    a1Evidence.prose.browser = a1ProseBrowserOk && a1ProseBrowserChecks === 20;
    a1Evidence.callout.browser = a1CalloutBrowserOk && a1CalloutBrowserChecks === 12;
    check(
      "A1_BROWSER=PASS prose passed twenty real-Chromium checks at 390px and 1280px in light and dark",
      a1Evidence.prose.browser,
      `checks=${a1ProseBrowserChecks} ok=${a1ProseBrowserOk}`,
    );
    check(
      "A1_BROWSER=PASS callout passed twelve real-Chromium checks at 390px and 1280px in light and dark",
      a1Evidence.callout.browser,
      `checks=${a1CalloutBrowserChecks} ok=${a1CalloutBrowserOk}`,
    );
    // `UNO-WO-084 / R01` (checkpoint A1): the cumulative oracle still reads the three baseline records and prints exactly
    // its own row. `UNO-WO-110 / R01` (§2) keeps this call as a regression assertion and prints the credited labels from the
    // checkpoint-omitted four-family evaluation below, so the A1 row can never stand in for the fourth credit.
    const closure = evaluateU04FamilyClosure({
      families: {
        divider: { source: true, reader: true, renderer: true, http: true, browser: true, refusal: true, rights: true },
        prose: a1Evidence.prose,
        callout: a1Evidence.callout,
      },
      modules: UNO_RENDERABLE_MODULES.length,
      zones: UNO_OWNED_MEDIA_ZONES.length,
      browserMatrix: matrixCases.length,
      checkpoint: "A1",
    });
    check(
      "U04_CLOSURE_ORACLE the cumulative oracle accepts the A1 row from the executed evidence",
      closure.ok === true && closure.parity === 3 && closure.proxy === 45 && familyOk && dividerOk,
      closure.ok ? `${closure.parity}/17 ${closure.proxy}/59` : String(closure.reason),
    );
    // `UNO-WO-110 / R01` (§2): the four-family row stays as a regression of the prior delivery — the same executed records
    // plus `localA2.table`, checkpoint-omitted, must still be exactly `4/17` / `46/59` with `list` pending.
    const closureFour = evaluateU04FamilyClosure({
      families: {
        divider: { source: true, reader: true, renderer: true, http: true, browser: true, refusal: true, rights: true },
        prose: a1Evidence.prose,
        callout: a1Evidence.callout,
        table: localA2.table,
      },
      modules: UNO_RENDERABLE_MODULES.length,
      zones: UNO_OWNED_MEDIA_ZONES.length,
      browserMatrix: matrixCases.length,
    });
    check(
      "U04_CLOSURE_ORACLE the checkpoint-omitted oracle credits exactly prose, callout, table and divider",
      closureFour.ok === true
        && JSON.stringify(closureFour.credited) === JSON.stringify(["prose", "callout", "table", "divider"])
        && closureFour.parity === 4
        && closureFour.proxy === 46
        && closureFour.pending.includes("list")
        && closureFour.labels.includes("PARITY_TABLE=PASS")
        && closureFour.labels.includes("PARITY_LIST=PENDING")
        && familyOk
        && dividerOk,
      closureFour.ok
        ? `${closureFour.parity}/17 ${closureFour.proxy}/59 ${closureFour.credited.join(",")}`
        : String(closureFour.reason),
    );
    // `UNO-WO-111 / R01` (§3): the declared **A2 checkpoint** is now earnable. The same executed records plus the executed
    // `localA2.table` and `localA2.list` go into one `checkpoint:"A2"` evaluation, whose frozen target is `5/17` / `47/59`
    // over exactly `table` and `list`; the oracle itself is unchanged and refuses any other score.
    const closureA2 = evaluateU04FamilyClosure({
      families: {
        divider: { source: true, reader: true, renderer: true, http: true, browser: true, refusal: true, rights: true },
        prose: a1Evidence.prose,
        callout: a1Evidence.callout,
        table: localA2.table,
        list: localA2.list,
      },
      modules: UNO_RENDERABLE_MODULES.length,
      zones: UNO_OWNED_MEDIA_ZONES.length,
      browserMatrix: matrixCases.length,
      checkpoint: "A2",
    });
    check(
      "U04_CLOSURE_ORACLE the A2 checkpoint credits exactly prose, callout, table, list and divider at 5/17 and 47/59",
      closureA2.ok === true
        && JSON.stringify(closureA2.credited) === JSON.stringify(["prose", "callout", "table", "list", "divider"])
        && closureA2.parity === 5
        && closureA2.proxy === 47
        && closureA2.labels.includes("PARITY_TABLE=PASS")
        && closureA2.labels.includes("PARITY_LIST=PASS")
        && familyOk
        && dividerOk,
      closureA2.ok
        ? `${closureA2.parity}/17 ${closureA2.proxy}/59 ${closureA2.credited.join(",")}`
        : String(closureA2.reason),
    );
    // `UNO-WO-114 / R01` (§3): the newly credited **Steps** family completes the declared B1 row. The same executed records
    // plus the executed `localA2.steps` go into one checkpoint-selected evaluation: the unchanged oracle itself enforces the
    // B1 target (`8/17`, `50/59`, and the presence of `hero`, `stats` and `steps`), so a lower score is an incomplete
    // checkpoint and a higher one is a mismatch. Nothing here loosens or re-declares the target.
    const closureB1 = evaluateU04FamilyClosure({
      families: {
        divider: { source: true, reader: true, renderer: true, http: true, browser: true, refusal: true, rights: true },
        prose: a1Evidence.prose,
        callout: a1Evidence.callout,
        table: localA2.table,
        list: localA2.list,
        hero: localA2.hero,
        stats: localA2.stats,
        steps: localA2.steps,
      },
      modules: UNO_RENDERABLE_MODULES.length,
      zones: UNO_OWNED_MEDIA_ZONES.length,
      browserMatrix: matrixCases.length,
      checkpoint: "B1",
    });
    check(
      "U04_CLOSURE_ORACLE the unchanged oracle credits exactly prose, callout, table, list, hero, stats, steps and divider at B1 8/17 and 50/59",
      closureB1.ok === true
        && JSON.stringify(closureB1.credited)
          === JSON.stringify(["prose", "callout", "table", "list", "hero", "stats", "steps", "divider"])
        && closureB1.parity === 8
        && closureB1.proxy === 50
        && closureB1.labels.includes("PARITY_STEPS=PASS")
        && closureB1.labels.includes("PARITY_HERO=PASS")
        && closureB1.labels.includes("PARITY_STATS=PASS")
        && familyOk
        && dividerOk,
      closureB1.ok
        ? `${closureB1.parity}/17 ${closureB1.proxy}/59 ${closureB1.credited.join(",")}`
        : String(closureB1.reason),
    );
    if (closureB1.ok) {
      // Every printed label is re-derived from the B1 result's own credit set, so a label cannot appear without its reason and
      // no earlier row can print a fuller one.
      const creditedNames = new Set(closureB1.credited.map((family) => `PARITY_${family.toUpperCase()}`));
      const pendingNames = new Set(closureB1.pending.map((family) => `PARITY_${family.toUpperCase()}`));
      for (const label of closureB1.labels) {
        const equals = label.lastIndexOf("=");
        const name = label.slice(0, equals);
        const value = label.slice(equals + 1);
        const honest = creditedNames.has(name)
          ? value === "PASS"
          : pendingNames.has(name)
            ? value === "PENDING"
            : name === "U04_PARITY"
              ? value === `${closureB1.parity}/17`
              : name === "U04_PROXY"
                ? value === `${closureB1.proxy}/59`
                : value === `${UNO_RENDERABLE_MODULES.length}/${UNO_RENDERABLE_MODULES.length}`
                  || value === `${UNO_OWNED_MEDIA_ZONES.length}/${UNO_OWNED_MEDIA_ZONES.length}`
                  || value === `${matrixCases.length}/${matrixCases.length}`;
        check(`U04_LABEL ${label}`, honest);
      }
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
  killChild(child);
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

