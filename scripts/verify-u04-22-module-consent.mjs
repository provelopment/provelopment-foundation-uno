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
import { resolve } from "node:path";
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

/** The committed declaration digests this gate requires before it will touch anything. */
const PINNED_DECLARATIONS = new Map([
  [MANIFEST, "ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0"],
  [SELECTION, "4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c"],
]);

const SOURCES = Object.freeze([
  `${CONTENT}/wo044-home.en-001.json`,
  `${CONTENT}/wo044-all-modules.en-001.json`,
  `${CONTENT}/wo044-invalid.en-001.json`,
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
function allModulesDocument() {
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

function fixturePlan() {
  return {
    declarations: [MANIFEST, SELECTION].map((path) => ({ path, digest: PINNED_DECLARATIONS.get(path) })),
    replacements: [
      { path: MANIFEST, bytes: Buffer.from(`${JSON.stringify(fixtureManifest(), null, 2)}\n`, "utf8") },
      { path: SELECTION, bytes: Buffer.from(`${JSON.stringify(fixtureSelection(), null, 2)}\n`, "utf8") },
    ],
    fixtureSources: [
      { path: SOURCES[0], bytes: Buffer.from(`${JSON.stringify(homeDocument(), null, 2)}\n`, "utf8") },
      { path: SOURCES[1], bytes: Buffer.from(`${JSON.stringify(allModulesDocument(), null, 2)}\n`, "utf8") },
      { path: SOURCES[2], bytes: Buffer.from(`${JSON.stringify(invalidDocument(), null, 2)}\n`, "utf8") },
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
  const accepted = readUnoPageDocument(allModulesDocument());
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

  const plan = fixturePlan();
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
  const stagedAtEnd = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: ROOT, encoding: "utf8" });
  check("nothing was staged by the gate", (stagedAtEnd.stdout ?? "").trim() === "");
  process.stdout.write(`\nverify-u04-22-module-consent: ${passes.length} passed, ${failures.length} failed\n`);
  for (const failure of failures) {
    process.stdout.write(`  failed: ${failure.name}${failure.detail ? ` - ${failure.detail}` : ""}\n`);
  }
  process.exitCode = failures.length === 0 ? exitCode : 1;
}

