#!/usr/bin/env node
/**
 * Foundation Uno — positive U03 publication proof over a real production build (`UNO-WO-029 / R01`).
 *
 * WHAT THIS PROVES. This checkout's own publication engine, with a **temporary** synthetic publication fixture,
 * renders published Pages over real HTTP: a truthful `<html lang>` per authored full locale, published Markdown
 * Home and About in two locales, one temporary alias redirect, public-only canonical/`hreflang`/OG, a `robots.txt`
 * and `sitemap.xml` that agree with the HTML, and strict refusals for draft, unlisted, unknown and malformed
 * addresses. It then restores the committed declarations, proves the restoration byte-for-byte, rebuilds the
 * **unpublished** configuration and re-runs the original fail-closed HTTP suites.
 *
 * WHAT IT IS NOT. No production domain, no permanent publication, no provider call, no manual deploy, no rewrite or
 * proxy, no browser claim, no external hostname. The fixture base is the literal test-only
 * `http://localhost:3000`; it is not a chosen public origin and it is never committed.
 *
 * SAFETY. Every mutation is owned by `./uno-u03-fixture-transaction.mjs`. It backs the two committed declarations
 * up, arms recovery *before* the first destructive write, claims each fixture source by exclusive creation (so a file
 * that appears in the meantime is never claimed and never removed), and is restored in an unconditional `finally` that
 * verifies SHA-256 and byte equality. A file at a claimed path is removed only while it still proves the identity the
 * OS granted at claim time; a replacement is preserved, and an unverifiable restore fails closed with its recovery
 * copies kept. A failed build or HTTP check therefore still restores, and no success is ever reported without proof.
 */

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { registerHooks } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { prepareUnoU03FixtureTransaction } from "./uno-u03-fixture-transaction.mjs";
import { verifyUnoU03Browser } from "./verify-u03-browser.mjs";

// Node prints a benign "typeless package.json" notice for the repository's TypeScript modules. It is expected, is
// classified in the report, and is deliberately NOT suppressed: this gate listens to no warning event and consumes no
// stderr, so a real warning or audit failure can never be hidden.

// The repository's own TypeScript uses TypeScript-style extensionless relative imports, which Node's type stripping
// does not resolve. This hook adds the `.ts` extension for relative specifiers only, so the gate can call the REAL
// loader, planner and serving composition instead of reimplementing any of their rules.
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
const REQUEST_TIMEOUT_MS = 15_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

const ROOT = process.cwd();
const MANIFEST = "deployment/efs/manifest.json";
const SELECTION = "deployment/uno.config.json";
const CONTENT = "deployment/efs/content";
const TEST_BASE = "http://localhost:3000";
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

/** SHA-256 of the two committed declarations, asserted before and after the temporary substitution. */
const PINNED_DECLARATIONS = new Map([
  [MANIFEST, "b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925"],
  [SELECTION, "58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952"],
]);

/** The nine fixture sources: created only if absent, removed again in the same `finally`. */
const FIXTURE_SOURCES = Object.freeze([
  `${CONTENT}/wo029-home.de-de.md`,
  `${CONTENT}/wo029-about.en-001.md`,
  `${CONTENT}/wo029-about.de-de.md`,
  `${CONTENT}/wo029-draft.en-001.md`,
  `${CONTENT}/wo029-hidden.en-001.json`,
  `${CONTENT}/wo032-events.en-001.md`,
  `${CONTENT}/wo032-events.de-de.md`,
  `${CONTENT}/wo032-broken.en-001.json`,
  `${CONTENT}/wo032-broken.en-001.md`,
]);

const failures = [];
const passes = [];

function check(name, condition, detail) {
  if (condition) {
    passes.push(name);
    process.stdout.write(`  PASS  ${name}\n`);
    return true;
  }
  const line = detail ? `${name} (${detail})` : name;
  failures.push(line);
  process.stdout.write(`  FAIL  ${line}\n`);
  return false;
}

/** SHA-256 of one repository-relative file, or `null` when it cannot be read. */
function sha256Of(relativePath) {
  try {
    return createHash("sha256").update(readFileSync(resolve(ROOT, relativePath))).digest("hex");
  } catch {
    return null;
  }
}

/**
 * Every mutation below belongs to the transaction module: it proves the preconditions, backs the declarations up, arms
 * recovery before the first destructive write, installs the fixture exclusively and restores it again.
 */

/** The temporary publication fixture, declared as data. Never a public deployment. */
const FIXTURE_MANIFEST = {
  entities: [
    {
      id: ENTITY_ID,
      facets: [
        {
          id: "foundation",
          sites: [
            {
              id: "main",
              locales: { supportedLocales: ["en-001", "de-DE"], defaultLocale: "en-001" },
              pages: [
                {
                  id: "home",
                  route: ["home"],
                  publication: "published",
                  representations: [
                    {
                      locale: "en-001",
                      sources: [{ kind: "markdown", path: "deployment/efs/content/home.en-001.md" }],
                    },
                    {
                      locale: "de-DE",
                      sources: [{ kind: "markdown", path: "deployment/efs/content/wo029-home.de-de.md" }],
                    },
                  ],
                },
                {
                  id: "about",
                  route: ["about"],
                  publication: "published",
                  representations: [
                    {
                      locale: "en-001",
                      sources: [{ kind: "markdown", path: "deployment/efs/content/wo029-about.en-001.md" }],
                    },
                    {
                      locale: "de-DE",
                      sources: [{ kind: "markdown", path: "deployment/efs/content/wo029-about.de-de.md" }],
                    },
                  ],
                },
                {
                  id: "draft",
                  route: ["draft"],
                  publication: "draft",
                  representations: [
                    {
                      locale: "en-001",
                      sources: [{ kind: "markdown", path: "deployment/efs/content/wo029-draft.en-001.md" }],
                    },
                  ],
                },
                {
                  id: "hidden",
                  route: ["hidden"],
                  publication: "published",
                  representations: [
                    {
                      locale: "en-001",
                      sources: [{ kind: "json", path: "deployment/efs/content/wo029-hidden.en-001.json" }],
                    },
                  ],
                },
                {
                  // A custom multi-segment Page: explicit ID, explicit nested route, two authored full locales.
                  id: "events",
                  route: ["programmes", "events"],
                  publication: "published",
                  representations: [
                    {
                      locale: "en-001",
                      sources: [{ kind: "markdown", path: "deployment/efs/content/wo032-events.en-001.md" }],
                    },
                    {
                      locale: "de-DE",
                      sources: [{ kind: "markdown", path: "deployment/efs/content/wo032-events.de-de.md" }],
                    },
                  ],
                },
                {
                  // Preferred JSON is declared and malformed, with a valid Markdown alternative: the declared
                  // JSON-before-Markdown policy must refuse outright rather than rescue through Markdown.
                  id: "broken",
                  route: ["broken"],
                  publication: "published",
                  representations: [
                    {
                      locale: "en-001",
                      sources: [
                        { kind: "json", path: "deployment/efs/content/wo032-broken.en-001.json" },
                        { kind: "markdown", path: "deployment/efs/content/wo032-broken.en-001.md" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const FIXTURE_SELECTION = {
  version: 1,
  entityId: ENTITY_ID,
  selectedSite: { facetId: "foundation", siteId: "main" },
  languagePreferences: { en: "en-001" },
  base: { canonical: TEST_BASE, aliases: [] },
};

/** The nine short, original fixture documents. ASCII only, no HTML, no links, no images. */
const FIXTURE_CONTENT = new Map([
  [
    `${CONTENT}/wo029-home.de-de.md`,
    "# Startseite\n\nWillkommen auf der Teststartseite von Foundation Uno.\n\n## Zweck\n\nDiese Seite belegt die veroeffentlichte Darstellung.\n",
  ],
  [
    `${CONTENT}/wo029-about.en-001.md`,
    "# About this fixture\n\nA short synthetic About page for the published proof.\n\n- one published item\n- a second published item\n",
  ],
  [
    `${CONTENT}/wo029-about.de-de.md`,
    "# Ueber diese Testseite\n\nEine kurze synthetische Seite fuer den veroeffentlichten Nachweis.\n",
  ],
  [`${CONTENT}/wo029-draft.en-001.md`, "# Draft page\n\nThis page must never be served.\n"],
  [
    `${CONTENT}/wo029-hidden.en-001.json`,
    '{ "title": "Hidden fixture page", "visibility": "unlisted" }\n',
  ],
  [
    `${CONTENT}/wo032-events.en-001.md`,
    "# Programmes and events\n\nA synthetic events page for the published proof.\n\n- first synthetic event\n- second synthetic event\n",
  ],
  [
    `${CONTENT}/wo032-events.de-de.md`,
    "# Programme und Veranstaltungen\n\nEine synthetische Veranstaltungsseite fuer den veroeffentlichten Nachweis.\n",
  ],
  // Deliberately truncated JSON: it is declared *and* unparseable, so the policy must refuse the Page outright.
  [`${CONTENT}/wo032-broken.en-001.json`, '{ "title": "Broken fixture page", "visibility": '],
  [
    `${CONTENT}/wo032-broken.en-001.md`,
    "# Broken fixture page\n\nThis Markdown must never rescue a malformed JSON source.\n",
  ],
]);

/**
 * The six public addresses the accepted discovery plan must advertise, with the authored title and one distinctive
 * sentence of their own source, so every 200 is proven to serve its own content rather than a neighbour's.
 */
const PUBLIC_PAGES = Object.freeze([
  {
    pathname: "/en-001",
    locale: "en-001",
    title: "Foundation Uno",
    body: "One organisation. One connected digital presence.",
    xDefault: `${TEST_BASE}/en-001`,
    canonical: `${TEST_BASE}/en-001`,
  },
  {
    pathname: "/de-de",
    locale: "de-DE",
    title: "Startseite",
    body: "Willkommen auf der Teststartseite von Foundation Uno.",
    xDefault: `${TEST_BASE}/en-001`,
    canonical: `${TEST_BASE}/de-de`,
  },
  {
    pathname: "/en-001/about",
    locale: "en-001",
    title: "About this fixture",
    body: "A short synthetic About page for the published proof.",
    canonical: `${TEST_BASE}/en-001/about`,
  },
  {
    pathname: "/de-de/about",
    locale: "de-DE",
    title: "Ueber diese Testseite",
    body: "Eine kurze synthetische Seite fuer den veroeffentlichten Nachweis.",
    canonical: `${TEST_BASE}/de-de/about`,
  },
  {
    pathname: "/en-001/programmes/events",
    locale: "en-001",
    title: "Programmes and events",
    body: "A synthetic events page for the published proof.",
    canonical: `${TEST_BASE}/en-001/programmes/events`,
  },
  {
    pathname: "/de-de/programmes/events",
    locale: "de-DE",
    title: "Programme und Veranstaltungen",
    body: "Eine synthetische Veranstaltungsseite fuer den veroeffentlichten Nachweis.",
    canonical: `${TEST_BASE}/de-de/programmes/events`,
  },
]);

/** Every address the fixture must refuse, with a real 404 and no advertised link. */
const REFUSED_PAGES = Object.freeze([
  "/en-001/draft",
  "/de-de/draft",
  "/en-001/hidden",
  "/de-de/hidden",
  "/en-001/wo029-about",
  "/en-001/broken",
  "/de-de/broken",
  "/xx-001",
  "/en-001/does-not-exist",
  "/en-us",
  "/en-001/about/extra",
  "/en-001/programmes/events/extra",
  "/en-001/programmes/about",
  "/en-001/programmes",
  "/de",
]);


/** The pinned local Next CLI entry point. */
function nextBinPath() {
  for (const candidate of [
    resolve(ROOT, "node_modules/next/dist/bin/next"),
    resolve(ROOT, "node_modules/next/dist/bin/next.js"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** An ephemeral loopback port, chosen and released by the OS. */
async function freeLoopbackPort() {
  return new Promise((resolvePort, rejectPort) => {
    const probe = createServer();
    probe.once("error", rejectPort);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => resolvePort(port));
    });
  });
}

/** True when something is still listening on the port. */
async function portStillOpen(port) {
  return new Promise((resolveOpen) => {
    const probe = createServer();
    probe.once("error", () => resolveOpen(true));
    probe.listen(port, HOST, () => probe.close(() => resolveOpen(false)));
  });
}

/** Run one child to completion with a bounded deadline, capturing output. */
async function runChild(args, timeoutMs) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", CI: "1" },
    windowsHide: true,
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  const deadline = Date.now() + timeoutMs;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
    await delay(200);
  }
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await delay(500);
    return { code: -1, output: output.join("") };
  }
  return { code: child.exitCode ?? -1, output: output.join("") };
}

/** Stop exactly the child we spawned, and wait for it, on every path. */
async function stopChild(child) {
  if (child === null) return;
  if (child.exitCode !== null || child.signalCode !== null) return;

  child.kill();
  let deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
    await delay(100);
  }
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
    while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
      await delay(100);
    }
  }
}

/** One real HTTP request against the loopback production server. */
async function request(url, extraHeaders) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...(extraHeaders === undefined ? {} : { headers: extraHeaders }),
  });
  const body = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    location: response.headers.get("location"),
    body,
  };
}

/** The reserved, illustrative sample origin. Never a deployment, a DNS record or an owned domain. */
const SAMPLE_ORIGIN = "https://uno-starter.example";

/** The five authorized starter paths: the two declarations and the three authored starter sources. */
const STARTER_PATHS = Object.freeze([
  MANIFEST,
  SELECTION,
  `${CONTENT}/home.en-001.json`,
  `${CONTENT}/about.en-001.md`,
  `${CONTENT}/components.en-001.json`,
  // `UNO-WO-078 / R01`: the one exact owner-qualified Page asset the durable Components Page declares.
  "deployment/efs/capsule/e_7a3knkx60eacyhca7a0cr1k6e1/foundation/main/wo078-family-plate.png",
]);

/** The three committed starter Pages, proven at the committed head before the reversible fixture replaces them. */
const COMMITTED_PAGES = Object.freeze([
  {
    pathname: "/en-001",
    locale: "en-001",
    title: "Foundation Uno",
    body: "One organisation. One connected digital presence.",
    xDefault: `${SAMPLE_ORIGIN}/en-001`,
    canonical: `${SAMPLE_ORIGIN}/en-001`,
  },
  {
    pathname: "/en-001/about",
    locale: "en-001",
    title: "About this starter",
    body: "This sample installation is an illustrative placeholder",
    canonical: `${SAMPLE_ORIGIN}/en-001/about`,
  },
  {
    pathname: "/en-001/components",
    locale: "en-001",
    title: "Components",
    body: "A JSON Page is an ordered list of validated sections.",
    canonical: `${SAMPLE_ORIGIN}/en-001/components`,
  },
]);

/** Every address the committed starter must refuse, with a real 404 and no advertised link. */
const COMMITTED_REFUSALS = Object.freeze([
  "/en-001/home",
  "/en-001/does-not-exist",
  "/de-001",
  "/en-001/about/extra",
]);

/** `UNO-WO-078 / R01`: the durable family source, its migration bindings and the one Page-owned plate. */
const DURABLE_SOURCE = "tests/fixtures/u04-durable-family-source.json";
const DURABLE_BINDINGS = "tests/fixtures/u04-durable-family-bindings.json";
const DURABLE_COMPONENTS = `${CONTENT}/components.en-001.json`;
const DURABLE_ASSET =
  "deployment/efs/capsule/e_7a3knkx60eacyhca7a0cr1k6e1/foundation/main/wo078-family-plate.png";
const DURABLE_PLATE_BYTES = 191;
const DURABLE_PLATE_SHA256 = "25bde641ce447275f7eff9d03859d07062ae34f9e3597eff18cf07bb384eae47";
/**
 * `UNO-WO-079 / R01`: the pinned SHA-256 of `JSON.stringify(page.sections.slice(0, 6))` as it was committed *before*
 * this family work appended the seventeen samples. The value is an independent historical literal (also pinned by the
 * unit suite in `tests/unit/uno-foundation-families.test.ts`), never re-derived from the Page under test, and it
 * replaces the earlier `git cat-file` lookup of the predecessor blob `f215b094…` — an object a shallow hosted checkout
 * need not contain. Provenance only; nothing here reads Git history.
 */
const DURABLE_PREFIX_SHA256 = "bbc5416a5b8e2f1f8b419e33bb535de1ef283a9a777764e16562b975c6bd1901";
const DURABLE_PREFIX_IDS = Object.freeze([
  "components-intro",
  "components-copy",
  "components-list",
  "components-stack",
  "components-faq",
  "components-callout",
]);
const DURABLE_FAMILY_IDS = Object.freeze([
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

/** Digests captured once, before any stateful runner, so `DURABLE_FAMILY_RESTORE` can prove survival. */
const durableBaseline = new Map();

/** The two user agents the parity proof compares: an ordinary browser and a crawler-shaped one. */
const CRAWLER_AGENTS = Object.freeze([
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
]);

/** The policy facts that must never depend on who is asking. */
function policyOf(html) {
  const canonical = /<link rel="canonical" href="([^"]+)"/u.exec(html)?.[1] ?? "none";
  const robots = /<meta name="robots" content="([^"]+)"/u.exec(html)?.[1] ?? "none";
  const ogUrl = /<meta property="og:url" content="([^"]+)"/u.exec(html)?.[1] ?? "none";
  const alternates = [...html.matchAll(/<link[^>]+rel="alternate"[^>]*hreflang="([^"]+)"[^>]*>/gu)]
    .map((match) => match[1])
    .sort()
    .join(",");
  return { canonical, robots, ogUrl, alternates };
}

/**
 * Crawler parity: an ordinary browser and a crawler-shaped user agent must receive the same status, the same document
 * and the same discovery policy. Nothing here claims a real search engine indexed the site.
 */
async function checkCrawlerParity(base) {
  const [browserAgent, crawlerAgent] = CRAWLER_AGENTS;
  for (const page of PUBLIC_PAGES) {
    const asBrowser = await request(`${base}${page.pathname}`, { "user-agent": browserAgent });
    const asCrawler = await request(`${base}${page.pathname}`, { "user-agent": crawlerAgent });
    check(
      `${page.pathname} answers both user agents identically`,
      asBrowser.status === 200 && asCrawler.status === asBrowser.status,
      `${asBrowser.status}/${asCrawler.status}`,
    );
    check(
      `${page.pathname} serves the same document to both user agents`,
      sha256Text(asCrawler.body) === sha256Text(asBrowser.body),
    );
    check(
      `${page.pathname} applies the same discovery policy to both user agents`,
      JSON.stringify(policyOf(asCrawler.body)) === JSON.stringify(policyOf(asBrowser.body)),
    );
    check(
      `${page.pathname} serves its own source text to both user agents`,
      normalise(visibleHtml(asBrowser.body)).includes(page.body) &&
        normalise(visibleHtml(asCrawler.body)).includes(page.body),
    );
    // A cookie or a forged hint must not change what is served.
    const withCookie = await request(`${base}${page.pathname}`, {
      "user-agent": crawlerAgent,
      cookie: "uno_locale=de-DE; uno_site=other",
    });
    check(
      `${page.pathname} ignores a forged cookie hint`,
      withCookie.status === 200 && sha256Text(withCookie.body) === sha256Text(asBrowser.body),
    );
  }

  const refusedPath = "/en-001/broken";
  const refusedBrowser = await request(`${base}${refusedPath}`, { "user-agent": browserAgent });
  const refusedCrawler = await request(`${base}${refusedPath}`, { "user-agent": crawlerAgent });
  check(
    "a malformed-source address is a 404 for both user agents",
    refusedBrowser.status === 404 && refusedCrawler.status === 404,
    `${refusedBrowser.status}/${refusedCrawler.status}`,
  );
  check(
    "a malformed-source refusal is identical for both user agents",
    sha256Text(refusedCrawler.body) === sha256Text(refusedBrowser.body),
  );
}

/** SHA-256 of one string, used only for byte-level comparisons inside this gate. */
function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Build output that must never appear (`UNO-WO-033 / R01`): a Next/Turbopack warning or error means the build is not
 * clean, and the whole-project tracing banner proves the server payload was unbounded even if the text is cosmetic.
 */
const BUILD_WARNING_MARKERS = Object.freeze([
  "Dynamic filesystem access causes tracing of the whole project",
  "Turbopack build encountered",
]);

/** Assert that one real production build printed neither warnings nor errors. */
function checkBuildClean(label, output) {
  const warningLines = (output.match(/^\s*Warning:/gmu) ?? []).length;
  const errorLines = (output.match(/^\s*Error:/gmu) ?? []).length;
  check(`${label} prints no build warning`, warningLines === 0, `${warningLines} warning lines`);
  check(`${label} prints no build error`, errorLines === 0, `${errorLines} error lines`);
  for (const marker of BUILD_WARNING_MARKERS) {
    check(`${label} never reports "${marker}"`, !output.includes(marker));
  }
}

/**
 * Run the bounded trace inspector against one real build. `expectation` is `fixture` for the synthetic publication
 * build (every published source must be shipped) and `committed` for the restored unpublished build.
 */
function checkTrace(label, expectation) {
  const result = spawnSync(
    process.execPath,
    [resolve(ROOT, "scripts/verify-u03-trace.mjs"), "--root", ROOT, "--expect", expectation, "--json"],
    { cwd: ROOT, encoding: "utf8" },
  );
  let report = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    report = null;
  }
  check(
    `${label} passes the bounded trace inspection`,
    result.status === 0 && report !== null && report.accepted === true,
    report === null ? `exit ${result.status}` : report.reasons.join(","),
  );
  if (report !== null && typeof report.notes === "object" && report.notes !== null) {
    check(
      `${label} ships a bounded project payload`,
      report.notes.projectEntries <= 250,
      `${report.notes.projectEntries} project entries`,
    );
  }
}

/** Collapse whitespace and decode the entities Next emits, for prose assertions. */
function normalise(html) {
  return html
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ");
}

/** Strip script payloads so prose assertions judge what a visitor can read. */
function visibleHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

/** Every `hreflang` alternation in a served document, as tag → href. */
function alternatesOf(html) {
  const found = new Map();
  for (const match of html.matchAll(/<link[^>]+rel="alternate"[^>]*>/gi)) {
    const tag = /hreflang="([^"]+)"/i.exec(match[0])?.[1];
    const href = /href="([^"]+)"/i.exec(match[0])?.[1];
    if (tag !== undefined && href !== undefined) found.set(tag, href.replace(/&amp;/g, "&"));
  }
  return found;
}


/** Assert one published public Page: status, title, one `h1`, language, canonical, OG and alternates. */
function checkPublicPage(pathname, page, response) {
  const raw = response.body;
  const text = normalise(visibleHtml(raw));
  const headings = raw.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
  const alternates = alternatesOf(raw);

  check(`${pathname} returns 200`, response.status === 200, `status ${response.status}`);
  check(`${pathname} is served as HTML`, /text\/html/i.test(response.contentType), response.contentType);
  check(`${pathname} serves exactly one h1`, headings.length === 1, `${headings.length} h1 elements`);
  check(`${pathname} serves the authored title`, text.includes(page.title), page.title);
  check(`${pathname} serves its own source text`, text.includes(page.body), page.body);
  check(`${pathname} declares its authored language`, raw.includes(`<html lang="${page.locale}"`));
  check(
    `${pathname} declares the exact canonical URL`,
    raw.includes(`<link rel="canonical" href="${page.canonical}"/>`),
    page.canonical,
  );
  check(
    `${pathname} declares the matching OG URL`,
    raw.includes(`<meta property="og:url" content="${page.canonical}"/>`),
  );
  check(`${pathname} advertises its own locale alternate`, alternates.get(page.locale) === page.canonical);
  check(`${pathname} is indexable`, /<meta name="robots" content="index, follow"/i.test(raw));
  check(
    `${pathname} never advertises a draft or unlisted address`,
    !raw.includes("/draft") && !raw.includes("/hidden"),
  );
  return alternates;
}


/** Assert one refusal: a real 404 with the approved copy and no advertised link of any kind. */
async function checkRefusal(base, pathname) {
  const response = await request(`${base}${pathname}`);
  check(`${pathname} returns 404`, response.status === 404, `status ${response.status}`);
  check(`${pathname} is not a redirect`, response.location === null, `location ${response.location}`);
  for (const fragment of ['rel="canonical"', "hreflang", "og:url"]) {
    check(`${pathname} does not carry ${fragment}`, !response.body.includes(fragment));
  }
  check(
    `${pathname} does not render a Page body`,
    !/<article\b/i.test(response.body) && !/<h1>About this fixture<\/h1>/i.test(response.body),
  );
  check(
    `${pathname} answers the approved 404 document`,
    normalise(visibleHtml(response.body)).includes("Go to the Foundation Uno homepage"),
  );
}

/** Validate the fixture through the REAL loader, planner and serving composition, before any build. */
async function validateFixtureInProcess() {
  const { loadUnoCandidateSource } = await import("../src/adapters/efs/uno-confined-source-reader.ts");
  const { planUnoPublishedPage } = await import("../src/application/plan-uno-published-page.ts");
  const { listUnoServingAddresses, planUnoServingDiscovery, resolveUnoServingLocaleTag } = await import(
    "../src/config/uno-serving.ts"
  );

  const manifest = JSON.parse(readFileSync(resolve(ROOT, MANIFEST), "utf8"));
  const selection = JSON.parse(readFileSync(resolve(ROOT, SELECTION), "utf8"));
  const base = { canonical: TEST_BASE, aliases: [] };

  for (const page of PUBLIC_PAGES) {
    const loaded = await loadUnoCandidateSource({ repoRoot: ROOT, pathname: page.pathname });
    if (!check(`the confined loader reads ${page.pathname}`, loaded.accepted)) continue;
    const planned = planUnoPublishedPage({
      manifest,
      selection,
      base,
      pathname: page.pathname,
      loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
    });
    check(`the planner publishes ${page.pathname}`, planned.accepted);
    if (planned.accepted) {
      check(`${page.pathname} is public`, planned.delivery.public);
      check(`${page.pathname} canonical is exact`, planned.delivery.canonicalUrl === page.canonical);
      check(`${page.pathname} authored title is ${page.title}`, planned.document.title === page.title);
    }
  }

  // A draft never plans; an unlisted Page is classified but is excluded from serving and discovery.
  const draftLoaded = await loadUnoCandidateSource({ repoRoot: ROOT, pathname: "/en-001/draft" });
  const draftRefused =
    !draftLoaded.accepted ||
    !planUnoPublishedPage({
      manifest,
      selection,
      base,
      pathname: "/en-001/draft",
      loadedSource: {
        accepted: true,
        candidate: draftLoaded.candidate,
        kind: draftLoaded.kind,
        text: draftLoaded.text,
      },
    }).accepted;
  check("the planner refuses /en-001/draft", draftRefused);

  const hiddenLoaded = await loadUnoCandidateSource({ repoRoot: ROOT, pathname: "/en-001/hidden" });
  const hidden = hiddenLoaded.accepted
    ? planUnoPublishedPage({
        manifest,
        selection,
        base,
        pathname: "/en-001/hidden",
        loadedSource: {
          accepted: true,
          candidate: hiddenLoaded.candidate,
          kind: hiddenLoaded.kind,
          text: hiddenLoaded.text,
        },
      })
    : { accepted: false };
  check(
    "the planner classifies /en-001/hidden as published but unlisted",
    hidden.accepted === true && hidden.delivery.unlisted === true && hidden.delivery.public === false,
  );

  check("the stored locale maps de-de to the authored de-DE", resolveUnoServingLocaleTag("de-de").tag === "de-DE");
  check("the stored short alias en stays a redirect-only alias", resolveUnoServingLocaleTag("en").status === "alias");
  check("an undeclared locale key is unknown", resolveUnoServingLocaleTag("fr-fr").status === "unknown");

  const discovery = await planUnoServingDiscovery();
  check("the serving discovery plan is accepted", discovery.status === "planned");
  if (discovery.status === "planned") {
    check(
      "the discovery plan holds exactly the six public entries",
      discovery.plan.sitemapUrls.length === 6,
      discovery.plan.sitemapUrls.join(","),
    );
    check(
      "the discovery plan never advertises draft or unlisted content",
      !discovery.plan.sitemapUrls.some((url) => url.includes("/draft") || url.includes("/hidden")),
    );
    check(
      "the discovery plan never advertises the malformed-source Page",
      !discovery.plan.sitemapUrls.some((url) => url.includes("/broken")),
    );
  }

  const addresses = await listUnoServingAddresses();
  check("the build-time address set holds the six Pages and the alias", addresses.length === 7, `${addresses.length}`);

  // A declared-but-malformed JSON source refuses even though a valid Markdown alternative exists: no rescue.
  const brokenLoaded = await loadUnoCandidateSource({ repoRoot: ROOT, pathname: "/en-001/broken" });
  const broken = brokenLoaded.accepted
    ? planUnoPublishedPage({
        manifest,
        selection,
        base,
        pathname: "/en-001/broken",
        loadedSource: {
          accepted: true,
          candidate: brokenLoaded.candidate,
          kind: brokenLoaded.kind,
          text: brokenLoaded.text,
        },
      })
    : { accepted: false };
  check("the confined loader refuses the malformed preferred JSON", brokenLoaded.accepted === false);
  check("the planner never rescues the malformed JSON through Markdown", broken.accepted === false);
}


/**
 * `DURABLE_FAMILY_SOURCE` — recompose the committed durable source with the real composer before any build, and prove
 * the committed Page is exactly the six original sections plus those seventeen composed nodes.
 */
async function durableFamilySourcePhase() {
  const { composeUnoFoundationSubset } = await import(
    "../src/application/compose-uno-foundation-families.ts"
  );
  const { readUnoPageDocument } = await import("../src/core/page-document.ts");

  for (const relativePath of [DURABLE_SOURCE, DURABLE_BINDINGS, DURABLE_COMPONENTS, DURABLE_ASSET]) {
    check(`DURABLE_FAMILY_SOURCE ${relativePath} exists`, existsSync(resolve(ROOT, relativePath)));
    durableBaseline.set(relativePath, sha256Of(relativePath));
  }
  if (failures.length > 0) return;

  const source = JSON.parse(readFileSync(resolve(ROOT, DURABLE_SOURCE), "utf8"));
  const bindings = JSON.parse(readFileSync(resolve(ROOT, DURABLE_BINDINGS), "utf8"));
  const pageRaw = readFileSync(resolve(ROOT, DURABLE_COMPONENTS), "utf8");
  const page = JSON.parse(pageRaw);

  check(
    "DURABLE_FAMILY_SOURCE the source declares exactly seventeen family sections",
    Array.isArray(source.sections) && source.sections.length === 17,
    String(source.sections?.length),
  );
  check(
    "DURABLE_FAMILY_SOURCE the source families appear in the documented order",
    Array.isArray(source.sections) &&
      JSON.stringify(source.sections.map((section) => section.type)) ===
        JSON.stringify([
          "prose",
          "callout",
          "list",
          "faq",
          "media",
          "gallery",
          "contactForm",
          "actions",
          "divider",
          "hero",
          "stats",
          "steps",
          "quote",
          "table",
          "columns",
          "cards",
          "features",
        ]),
  );

  const composed = composeUnoFoundationSubset(source, bindings);
  check(
    "DURABLE_FAMILY_SOURCE the real composer accepts the source and its bindings",
    composed.status === "composed",
    composed.status === "refused" ? composed.reason : "",
  );
  if (composed.status !== "composed") return;

  check(
    "DURABLE_FAMILY_SOURCE the composed document has the seventeen stable family ids",
    JSON.stringify(composed.document.sections.map((node) => node.id)) === JSON.stringify(DURABLE_FAMILY_IDS),
  );
  check("DURABLE_FAMILY_SOURCE the composed document sections are frozen", Object.isFrozen(composed.document.sections));

  const parsed = readUnoPageDocument(pageRaw);
  check(
    "DURABLE_FAMILY_SOURCE the committed Components Page is an accepted version-1 document",
    parsed.accepted,
    parsed.accepted ? "" : parsed.reason,
  );
  if (parsed.accepted) {
    check(
      "DURABLE_FAMILY_SOURCE the committed Page has twenty-three top-level sections",
      parsed.document.sections.length === 23,
      String(parsed.document.sections.length),
    );
    check(
      "DURABLE_FAMILY_SOURCE the six original section ids are unchanged and come first",
      JSON.stringify(parsed.document.sections.slice(0, 6).map((node) => node.id)) ===
        JSON.stringify(DURABLE_PREFIX_IDS),
    );
    check(
      // `UNO-WO-121 / R01`: the committed durable Page is **not** rewritten. It keeps its ordinary native gallery grid while
      // the adapter now composes the donor's opt-in list, so the two are distinguished rather than conflated: every other
      // appended section must still be the composer's own output, and only the Gallery section may differ.
      "DURABLE_FAMILY_SOURCE the appended sections are the composer's own output",
      (() => {
        const committed = parsed.document.sections.slice(6);
        const recomposed = composed.document.sections;
        if (committed.length !== recomposed.length) return false;
        const differing = committed
          .filter((node, index) => JSON.stringify(node) !== JSON.stringify(recomposed[index]))
          .map((node) => node.id);
        return JSON.stringify(differing) === JSON.stringify(["family-5-gallery"]);
      })(),
    );
    // The composed Gallery is the adopted list shape, and the committed Page still carries the ordinary grid it shipped with.
    const committedGallery = parsed.document.sections.find((node) => node.id === "family-5-gallery");
    const composedGallery = composed.document.sections.find((node) => node.id === "family-5-gallery");
    check(
      "DURABLE_FAMILY_SOURCE the composed Gallery is the opt-in list while the committed Page keeps its ordinary grid",
      composedGallery?.module === "media.gallery"
        && composedGallery?.props?.list === true
        && committedGallery?.module === "media.gallery"
        && committedGallery?.props?.list === undefined
        && Array.isArray(committedGallery?.props?.items)
        && committedGallery?.props?.items?.length === 2,
      JSON.stringify({ composed: composedGallery?.props?.list, committed: committedGallery?.props?.list }),
    );
  }

  // `UNO-WO-079 / R01`: the preservation oracle is the pinned historical digest of the six-section JSON, computed here
  // from the committed Page with the already imported `createHash`. It never reads Git history, so a shallow checkout
  // cannot make a legitimate preservation assertion fail, and a changed prefix can never satisfy it.
  const prefixDigest = createHash("sha256")
    .update(JSON.stringify(page.sections.slice(0, 6)))
    .digest("hex");
  check(
    "DURABLE_FAMILY_SOURCE the six original sections still equal the starting committed blob",
    prefixDigest === DURABLE_PREFIX_SHA256,
    prefixDigest,
  );

  const plate = readFileSync(resolve(ROOT, DURABLE_ASSET));
  check(
    "DURABLE_FAMILY_MEDIA the owned plate is the exact expected PNG byte length",
    plate.length === DURABLE_PLATE_BYTES,
    String(plate.length),
  );
  check("DURABLE_FAMILY_MEDIA the owned plate digest is exact", sha256Of(DURABLE_ASSET) === DURABLE_PLATE_SHA256);
  check(
    "DURABLE_FAMILY_MEDIA the owned plate starts with the PNG signature",
    [...plate.subarray(0, 8)].map((byte) => byte.toString(16).padStart(2, "0")).join("") === "89504e470d0a1a0a",
  );
}



/**
 * `DURABLE_FAMILY_REFUSALS` — the composer must still refuse everything outside the bounded subset, with one closed
 * reason and never a partial document.
 */
async function durableFamilyRefusalPhase() {
  const { composeUnoFoundationSubset } = await import(
    "../src/application/compose-uno-foundation-families.ts"
  );
  const plate = "/assets/wo078-family-plate.png";
  const refusals = [
    [
      "a remote image source",
      { version: 1, title: "T", sections: [{ type: "media", image: { src: "https://example.com/a.png", alt: "Remote" } }] },
      undefined,
      "family:unsupported-feature",
    ],
    [
      "an unbound owned image",
      { version: 1, title: "T", sections: [{ type: "media", image: { src: plate, alt: "A" } }] },
      undefined,
      "family:unsupported-feature",
    ],
    [
      "an owned ref in an unknown zone",
      { version: 1, title: "T", sections: [{ type: "media", image: { src: plate, alt: "A" } }] },
      { images: [{ source: plate, owned: { zone: "cdn", path: "wo078-family-plate.png" } }] },
      "family:target-refused",
    ],
    [
      "a generated-zone ref without integrity",
      { version: 1, title: "T", sections: [{ type: "media", image: { src: plate, alt: "A" } }] },
      { images: [{ source: plate, owned: { zone: "generated", path: "wo078-family-plate.png" } }] },
      "family:target-refused",
    ],
    [
      "a non-OFF contact acknowledgement",
      { version: 1, title: "T", sections: [{ type: "contactForm", formRef: "wo078-contact" }] },
      { contactForms: [{ formRef: "wo078-contact", mode: "delivery-on" }] },
      "family:unsupported-feature",
    ],
    [
      "a contact section with no acknowledgement",
      { version: 1, title: "T", sections: [{ type: "contactForm", formRef: "wo078-contact" }] },
      undefined,
      "family:unsupported-feature",
    ],
    [
      "an eighteenth family outside the subset",
      { version: 1, title: "T", sections: [{ type: "carousel", items: [] }] },
      undefined,
      "family:unsupported-family",
    ],
    [
      // `UNO-WO-084 / R01` (A1): `prose`/`callout` now accept authored Markdown, so the durable refusal case uses a
      // construct Uno still refuses — an image — instead of emphasis.
      "an image inside authored prose",
      { version: 1, title: "T", sections: [{ type: "prose", body: "An ![x](https://example.com/i.png) claim" }] },
      undefined,
      "family:unsupported-feature",
    ],
    [
      "an external action destination",
      { version: 1, title: "T", sections: [{ type: "actions", actions: [{ label: "Go", href: "https://example.com" }] }] },
      undefined,
      "family:unsupported-feature",
    ],
    [
      "an unsupported extra key",
      { version: 1, title: "T", sections: [{ type: "prose", body: "Text", style: "color:red" }] },
      undefined,
      "family:unsupported-feature",
    ],
  ];
  for (const [label, input, binder, reason] of refusals) {
    const outcome = composeUnoFoundationSubset(input, binder);
    check(
      `DURABLE_FAMILY_REFUSALS the composer refuses ${label}`,
      outcome.status === "refused" && outcome.reason === reason,
      outcome.status === "refused" ? outcome.reason : "composed",
    );
    check(
      `DURABLE_FAMILY_REFUSALS the refusal of ${label} carries no document`,
      outcome.status === "refused" && !("document" in outcome),
    );
  }

  let invoked = false;
  const hostile = { version: 1, title: "T", sections: [] };
  Object.defineProperty(hostile, "sections", {
    enumerable: true,
    get() {
      invoked = true;
      return [];
    },
  });
  const hostileOutcome = composeUnoFoundationSubset(hostile);
  check(
    "DURABLE_FAMILY_REFUSALS an accessor source refuses as unsafe without running it",
    hostileOutcome.status === "refused" && hostileOutcome.reason === "family:unsafe-source" && invoked === false,
  );

  const tooMany = {
    version: 1,
    title: "T",
    sections: Array.from({ length: 33 }, () => ({ type: "divider" })),
  };
  const tooManyOutcome = composeUnoFoundationSubset(tooMany);
  check(
    "DURABLE_FAMILY_REFUSALS a thirty-three-section source is refused",
    tooManyOutcome.status === "refused" && tooManyOutcome.reason === "family:unsupported-feature",
  );
}


/** Count non-overlapping occurrences of a literal in one document. */
function countOf(haystack, needle) {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index >= 0) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

/** `DURABLE_FAMILY_HTTP` — the committed Components Page serves all twenty-three sections with native semantics. */
async function checkDurableFamilyHttp(base) {
  const response = await request(`${base}/en-001/components`);
  const raw = response.body;
  check("DURABLE_FAMILY_HTTP the Components Page answers 200", response.status === 200, `status ${response.status}`);
  check("DURABLE_FAMILY_HTTP exactly one main is served", (raw.match(/<main\b/giu) ?? []).length === 1);
  check("DURABLE_FAMILY_HTTP exactly one h1 is served", (raw.match(/<h1\b/giu) ?? []).length === 1);

  const ids = [...DURABLE_PREFIX_IDS, ...DURABLE_FAMILY_IDS];
  let previous = -1;
  let ordered = true;
  let unique = true;
  for (const id of ids) {
    const marker = `id="${id}"`;
    const at = raw.indexOf(marker);
    if (at < 0 || at <= previous) ordered = false;
    if (countOf(raw, marker) !== 1) unique = false;
    if (at >= 0) previous = at;
  }
  check("DURABLE_FAMILY_HTTP all twenty-three section ids are served in order", ordered);
  check("DURABLE_FAMILY_HTTP every served section id is unique", unique);

  const families = [
    ["a native divider rule", /<hr\b[^>]*class="uno-json-divider"/iu],
    ["a native blockquote quotation", /<blockquote\b[^>]*class="uno-json-testimonial-quote"/iu],
    ["a native table", /<table\b[^>]*class="uno-json-table"/iu],
    ["table header cells with column scope", /<th\b[^>]*scope="col"/iu],
    ["an ordered timeline list", /<ol\b[^>]*class="uno-json-timeline-list"/iu],
    ["a native unordered list", /<ul\b[^>]*class="uno-json-list"/iu],
    ["a native FAQ disclosure", /<details\b/iu],
    ["a native disclosure summary", /<summary\b/iu],
    ["a gallery figure", /<figure\b[^>]*class="uno-json-media-item"/iu],
    ["a figure caption", /<figcaption\b[^>]*class="uno-json-media-caption"/iu],
    ["a card group", /data-uno-card-id="family-15-cards-item-0"|data-uno-cell-id="family-15-cards-item-0"/iu],
    ["an authored feature item", /data-uno-cell-id="family-16-features-item-0"/iu],
  ];
  for (const [label, pattern] of families) {
    check(`DURABLE_FAMILY_HTTP the Page renders ${label}`, pattern.test(raw));
  }

  check(
    "DURABLE_FAMILY_HTTP the contact family renders only the inert delivery-OFF notice",
    raw.includes("Delivery is switched off. Nothing entered here is sent or stored."),
  );
  for (const [label, pattern] of [
    ["a form", /<form\b/iu],
    ["an input control", /<input\b/iu],
    ["a textarea", /<textarea\b/iu],
    ["a submit button", /<button\b/iu],
    ["an iframe", /<iframe\b/iu],
  ]) {
    check(`DURABLE_FAMILY_HTTP the Page carries no ${label}`, !pattern.test(raw));
  }

  const images = raw.match(/<img\b[^>]*class="uno-json-media-image"[^>]*>/giu) ?? [];
  check("DURABLE_FAMILY_HTTP exactly three owned images are served", images.length === 3, String(images.length));
  check(
    "DURABLE_FAMILY_HTTP every owned image is addressed by its own occurrence locator",
    ["0", "1", "2"].every((index) => raw.includes(`src="/uno-media/en-001/components/${index}"`)),
  );
  check(
    "DURABLE_FAMILY_HTTP every owned image carries authored alternative text",
    images.every((tag) => /alt="[^"]+"/u.test(tag)),
  );
  check(
    "DURABLE_FAMILY_HTTP the Page advertises no external asset host",
    !/src="https?:\/\//iu.test(raw) && !/src="\/\//u.test(raw),
  );

  // `UNO-WO-080 / R01`: the three donor level-3 outlines as actually served on the committed Page. Each assertion is
  // confined to its own family region, so an unrelated heading can never satisfy it.
  const regionBetween = (startMarker, endMarker) => {
    const start = raw.indexOf(startMarker);
    const end = raw.indexOf(endMarker);
    return start < 0 || end <= start ? "" : raw.slice(start, end);
  };
  const outlineRegions = {
    steps: regionBetween('id="family-11-steps"', 'id="family-12-quote"'),
    faq: regionBetween('id="family-3-faq"', 'id="family-4-media"'),
    columns: regionBetween('id="family-14-columns"', 'id="family-15-cards"'),
  };
  const stepsOutline =
    (outlineRegions.steps.match(/<li class="uno-json-timeline-item"[^>]*>(?:(?!<\/li>)[\s\S])*?<h3 class="uno-json-timeline-title">/gu) ?? [])
      .length === 3
    && !outlineRegions.steps.includes('<p class="uno-json-timeline-title">');
  const faqOutline =
    (outlineRegions.faq.match(/<summary class="uno-json-disclosure-summary"><h3>[^<]+<\/h3><\/summary>/gu) ?? []).length === 2
    && outlineRegions.faq.includes("<h3>Does a disclosure need a script?</h3>")
    && outlineRegions.faq.includes("<h3>Can an answer carry markup?</h3>")
    && outlineRegions.faq.indexOf(">Does a disclosure need a script?</h3>")
      < outlineRegions.faq.indexOf(">Can an answer carry markup?</h3>");
  const columnsOutline =
    (outlineRegions.columns.match(/<div class="uno-json-cell"[^>]*>\s*<div class="uno-json-stack"[^>]*>\s*<h3 class="uno-json-heading"[^>]*>/gu) ?? [])
      .length === 2
    && outlineRegions.columns.includes(">A column with a body</h3>")
    && outlineRegions.columns.includes(">A column with a list</h3>")
    && outlineRegions.columns.indexOf(">A column with a body</h3>")
      < outlineRegions.columns.indexOf(">A column with a list</h3>");
  check(
    "DURABLE_OUTLINE_THREE_HTTP the committed Page serves the step titles, FAQ questions and column titles as level-3 headings in their own regions",
    stepsOutline
      && faqOutline
      && columnsOutline
      && (raw.match(/<h1\b/giu) ?? []).length === 1
      && (raw.match(/<main\b/giu) ?? []).length === 1
      && (raw.match(/<h4\b/giu) ?? []).length === 0
      && !/<button\b[^>]*>[\s\S]*?family-3-faq/iu.test(raw),
    JSON.stringify({ stepsOutline, faqOutline, columnsOutline }),
  );

  const about = await request(`${base}/en-001/about`);
  check("DURABLE_FAMILY_HTTP the About Page still answers 200", about.status === 200, `status ${about.status}`);
  const sitemap = await request(`${base}/sitemap.xml`);
  check(
    "DURABLE_FAMILY_HTTP the sitemap still lists exactly three addresses",
    (sitemap.body.match(/<loc>[^<]+<\/loc>/gu) ?? []).length === 3,
  );
}


/** `DURABLE_FAMILY_MEDIA` — real GET/HEAD media plus the denial of every locator this Page does not own. */
async function checkDurableFamilyMedia(base) {
  const expected = readFileSync(resolve(ROOT, DURABLE_ASSET));
  for (const index of [0, 1, 2]) {
    const response = await fetch(`${base}/uno-media/en-001/components/${index}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    check(
      `DURABLE_FAMILY_MEDIA /uno-media/en-001/components/${index} answers 200`,
      response.status === 200,
      `status ${response.status}`,
    );
    check(
      `DURABLE_FAMILY_MEDIA occurrence ${index} is served as PNG`,
      /^image\/png$/iu.test(response.headers.get("content-type") ?? ""),
      String(response.headers.get("content-type")),
    );
    check(
      `DURABLE_FAMILY_MEDIA occurrence ${index} is the exact owned bytes`,
      bytes.equals(expected) && createHash("sha256").update(bytes).digest("hex") === DURABLE_PLATE_SHA256,
    );
    check(
      `DURABLE_FAMILY_MEDIA occurrence ${index} declares no-sniff`,
      (response.headers.get("x-content-type-options") ?? "") === "nosniff",
    );

    const head = await fetch(`${base}/uno-media/en-001/components/${index}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    check(
      `DURABLE_FAMILY_MEDIA occurrence ${index} HEAD agrees with GET`,
      head.status === 200 &&
        head.headers.get("content-type") === response.headers.get("content-type") &&
        (head.headers.get("x-content-type-options") ?? "") === "nosniff",
      `status ${head.status}`,
    );
  }

  const denied = [
    "/uno-media/en-001/components/3",
    "/uno-media/en-001/about/0",
    "/uno-media/en-001/nope/0",
    "/uno-media/en-001/components/wo078-family-plate.png",
    "/uno-media/en-001/components/-1",
    "/uno-media/en-001/components/00",
    "/uno-media/en-001/home/0",
    "/uno-media/de-001/components/0",
  ];
  for (const path of denied) {
    const response = await fetch(`${base}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await response.text();
    check(
      `DURABLE_FAMILY_MEDIA ${path} is a real 404`,
      response.status === 404 && response.headers.get("location") === null && body.length === 0,
      `status ${response.status}`,
    );
  }
}


async function committedStarterPhase(nextBin) {
  process.stdout.write("\nverify-u03-published-http: committed-starter proof before the reversible fixture\n");
  await durableFamilySourcePhase();
  await durableFamilyRefusalPhase();
  if (failures.length > 0) {
    process.stderr.write("verify-u03-published-http: the durable family source proof failed; no build was attempted.\n");
    return;
  }
  rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
  const build = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
  if (!check("the committed starter production build succeeds", build.code === 0, `exit ${build.code}`)) {
    process.stderr.write(build.output.slice(-4000));
    return;
  }
  checkBuildClean("the committed starter build", build.output);
  checkTrace("the committed starter build", "committed");
  if (failures.length > 0) {
    process.stderr.write("verify-u03-published-http: the committed starter build is not clean or not bounded.\n");
    return;
  }

  const starterPort = await freeLoopbackPort();
  const base = `http://${HOST}:${starterPort}`;
  const child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(starterPort)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
    windowsHide: true,
  });
  let serverOutput = "";
  child.stdout.on("data", (chunk) => (serverOutput += String(chunk)));
  child.stderr.on("data", (chunk) => (serverOutput += String(chunk)));
  try {
    let ready = false;
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) break;
      try {
        await request(`${base}/`);
        ready = true;
        break;
      } catch {
        await delay(250);
      }
    }
    if (!check("the committed starter server reached readiness", ready, serverOutput.slice(-500))) return;

    const alternates = new Map();
    for (const page of COMMITTED_PAGES) {
      const response = await request(`${base}${page.pathname}`);
      alternates.set(page.pathname, checkPublicPage(page.pathname, page, response));
    }
    check(
      "the committed Home carries the reserved x-default",
      alternates.get("/en-001")?.get("x-default") === `${SAMPLE_ORIGIN}/en-001`,
    );
    for (const pathname of ["/en-001/about", "/en-001/components"]) {
      check(`the committed ${pathname} carries no x-default`, alternates.get(pathname)?.get("x-default") === undefined);
    }

    const robots = await request(`${base}/robots.txt`);
    check("the committed robots.txt answers 200", robots.status === 200, `status ${robots.status}`);
    check(
      "the committed robots.txt names the reserved sitemap",
      robots.body.includes(`Sitemap: ${SAMPLE_ORIGIN}/sitemap.xml`),
    );
    const sitemap = await request(`${base}/sitemap.xml`);
    check("the committed sitemap.xml answers 200", sitemap.status === 200, `status ${sitemap.status}`);
    const locations = sitemap.body.match(/<loc>[^<]+<\/loc>/gu) ?? [];
    check("the committed sitemap.xml lists exactly three addresses", locations.length === 3, `${locations.length}`);
    for (const page of COMMITTED_PAGES) {
      check(`the committed sitemap lists ${page.canonical}`, sitemap.body.includes(`<loc>${page.canonical}</loc>`));
    }
    check(
      "the committed sitemap never lists the undeclared legacy Home or a suppressed alias",
      !sitemap.body.includes("home.en-001.md") && !sitemap.body.includes("/en-001/home"),
    );

    const shortAlias = await request(`${base}/en`);
    check(
      "the committed /en answers one explicit redirect to the published root",
      [307, 308].includes(shortAlias.status),
      `status ${shortAlias.status}`,
    );

    for (const pathname of COMMITTED_REFUSALS) {
      await checkRefusal(base, pathname);
    }

    await checkDurableFamilyHttp(base);
    await checkDurableFamilyMedia(base);

    const browserProof = await verifyUnoU03Browser({
      base,
      pages: COMMITTED_PAGES,
      refusedPaths: COMMITTED_REFUSALS,
      keyboardPage: COMMITTED_PAGES[2],
      durableFamilyPage: COMMITTED_PAGES[2],
      durableFamilyIds: DURABLE_FAMILY_IDS,
    });
    for (const name of browserProof.passes) check(name, true);
    for (const failure of browserProof.failures) {
      failures.push(failure);
      process.stdout.write(`  FAIL  ${failure}\n`);
    }
    check(
      "DURABLE_FAMILY_BROWSER the real browser proof executed its durable family cases",
      browserProof.passes.some((name) => name.startsWith("DURABLE_FAMILY_BROWSER")) &&
        !browserProof.failures.some((name) => name.startsWith("DURABLE_FAMILY_BROWSER")),
    );
    // `UNO-WO-080 / R01`: the three level-3 outlines must be executed in real Chromium by the durable browser proof, not
    // merely declared here — all four of its assertions per case must have passed.
    const outlineBrowserPasses = browserProof.passes.filter((name) => name.startsWith("DURABLE_OUTLINE_THREE_BROWSER"));
    check(
      "DURABLE_OUTLINE_THREE_HTTP the durable browser proof executed the three level-3 outline assertions",
      outlineBrowserPasses.length >= 4 &&
        !browserProof.failures.some((name) => name.startsWith("DURABLE_OUTLINE_THREE_BROWSER")),
      String(outlineBrowserPasses.length),
    );
    check("the committed starter server stayed up", child.exitCode === null && child.signalCode === null);
  } finally {
    await stopChild(child);
    check("the committed starter port was released", (await portStillOpen(starterPort)) === false);
  }
}


/** Assert every precondition: pinned declarations, absent fixture sources, clean tracked tree. */
function preflight() {
  check("the gate runs from the Uno checkout root", existsSync(resolve(ROOT, "package.json")));

  for (const [relativePath, digest] of PINNED_DECLARATIONS) {
    check(
      `${relativePath} is byte-identical to the pinned committed declaration`,
      sha256Of(relativePath) === digest,
    );
  }
  for (const relativePath of FIXTURE_SOURCES) {
    check(`the fixture source ${relativePath} is absent`, !existsSync(resolve(ROOT, relativePath)));
  }
  check("the preserved legacy Home Markdown is present", existsSync(resolve(ROOT, `${CONTENT}/home.en-001.md`)));
  for (const starterPath of STARTER_PATHS) {
    check(`the authorized starter path ${starterPath} exists`, existsSync(resolve(ROOT, starterPath)));
  }

  const staged = spawnSync("git", ["--no-optional-locks", "diff", "--cached", "--name-only"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("nothing is staged before the fixture", staged.stdout.trim() === "", staged.stdout.trim());
  const deployment = spawnSync("git", ["--no-optional-locks", "status", "--porcelain=v1", "--untracked-files=all", "--", "deployment"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const unexpected = deployment.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !STARTER_PATHS.some((starterPath) => line.endsWith(` ${starterPath}`)));
  check(
    "no committed deployment input outside the authorized starter paths is modified before the fixture",
    unexpected.length === 0,
    unexpected.join(" | "),
  );
  const active = spawnSync("git", ["check-ignore", "--", ".documents/WIP/workorder-active.md"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("the private ACTIVE stays ignored", active.status === 0);
}


/**
 * Build the exact fixture bytes this transaction installs: two declarations and nine short, original sources.
 */
function fixturePlan() {
  return {
    declarations: [...PINNED_DECLARATIONS].map(([path, digest]) => ({ path, digest })),
    replacements: [
      { path: MANIFEST, bytes: Buffer.from(`${JSON.stringify(FIXTURE_MANIFEST, null, 2)}\n`, "utf8") },
      { path: SELECTION, bytes: Buffer.from(`${JSON.stringify(FIXTURE_SELECTION, null, 2)}\n`, "utf8") },
    ],
    fixtureSources: [...FIXTURE_CONTENT].map(([path, contents]) => ({
      path,
      bytes: Buffer.from(contents, "utf8"),
    })),
  };
}
/** All real HTTP assertions against the running production server. */
async function assertOverHttp(base, child) {
  const alternatesByPath = new Map();
  for (const page of PUBLIC_PAGES) {
    const response = await request(`${base}${page.pathname}`);
    alternatesByPath.set(page.pathname, checkPublicPage(page.pathname, page, response));
  }

  const homeEn = alternatesByPath.get("/en-001") ?? new Map();
  const homeDe = alternatesByPath.get("/de-de") ?? new Map();
  const aboutEn = alternatesByPath.get("/en-001/about") ?? new Map();
  const aboutDe = alternatesByPath.get("/de-de/about") ?? new Map();

  check(
    "the Home advertises both authored locales",
    homeEn.get("en-001") === `${TEST_BASE}/en-001` && homeEn.get("de-DE") === `${TEST_BASE}/de-de`,
  );
  check("the published default Home carries x-default", homeEn.get("x-default") === `${TEST_BASE}/en-001`);
  check(
    "the About Page advertises both authored locales",
    aboutEn.get("en-001") === `${TEST_BASE}/en-001/about` && aboutEn.get("de-DE") === `${TEST_BASE}/de-de/about`,
  );
  check(
    "the About Page carries no x-default",
    aboutEn.get("x-default") === undefined && aboutDe.get("x-default") === undefined,
  );
  check("the German Home advertises the same alternates", homeDe.get("en-001") === `${TEST_BASE}/en-001`);

  const alias = await request(`${base}/en`);
  check("/en answers a temporary redirect", alias.status === 307, `status ${alias.status}`);
  // A duplicated `Location` header is joined with a comma by `fetch`; every value must name the same target.
  const aliasTargets = (alias.location ?? "").split(",").map((value) => value.trim());
  check(
    "/en redirects to the declared canonical Home",
    aliasTargets.length > 0 && aliasTargets.every((value) => value === `${TEST_BASE}/en-001`),
    alias.location ?? "none",
  );

  const robots = await request(`${base}/robots.txt`);
  check("/robots.txt returns 200", robots.status === 200, `status ${robots.status}`);
  check("/robots.txt is plain text", /text\/plain/i.test(robots.contentType), robots.contentType);
  check("/robots.txt names the canonical sitemap", robots.body.includes(`Sitemap: ${TEST_BASE}/sitemap.xml`));
  check("/robots.txt disallows no Page", !robots.body.includes("Disallow:"));

  const sitemap = await request(`${base}/sitemap.xml`);
  check("/sitemap.xml returns 200", sitemap.status === 200, `status ${sitemap.status}`);
  check("/sitemap.xml is XML", /application\/xml/i.test(sitemap.contentType), sitemap.contentType);
  const locations = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
  check("/sitemap.xml lists exactly the six public URLs", locations.length === 6, locations.join(","));
  for (const page of PUBLIC_PAGES) {
    check(`/sitemap.xml lists ${page.canonical}`, locations.includes(page.canonical));
  }
  check(
    "/sitemap.xml lists the custom nested-route Page",
    locations.includes(`${TEST_BASE}/en-001/programmes/events`) &&
      locations.includes(`${TEST_BASE}/de-de/programmes/events`),
  );
  check(
    "/sitemap.xml alternates both authored locales",
    sitemap.body.includes('hreflang="en-001"') && sitemap.body.includes('hreflang="de-DE"'),
  );
  const xDefaults = [...sitemap.body.matchAll(/hreflang="x-default" href="([^"]+)"/gu)].map((match) => match[1]);
  check(
    "/sitemap.xml declares x-default only for the published default Home",
    xDefaults.length > 0 && xDefaults.every((href) => href === `${TEST_BASE}/en-001`),
    xDefaults.join(","),
  );
  check(
    "/sitemap.xml never lists draft or unlisted content",
    !sitemap.body.includes("/draft") && !sitemap.body.includes("/hidden"),
  );
  check(
    "/sitemap.xml is well formed at both ends",
    sitemap.body.trimStart().startsWith("<?xml") && sitemap.body.trimEnd().endsWith("</urlset>"),
  );

  const demo = await request(`${base}/`);
  const demoText = normalise(visibleHtml(demo.body));
  check("/ returns 200 with the demonstration", demo.status === 200 && /text\/html/i.test(demo.contentType));
  check("/ serves exactly one h1", (demo.body.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? []).length === 1);
  check(
    "/ keeps the approved hero heading",
    demoText.includes("One organisation. One connected digital presence."),
  );
  check("/ keeps its English language attribute", demo.body.includes('<html lang="en"'));
  check("/ keeps its noindex policy", /<meta[^>]+name="robots"[^>]+noindex/i.test(demo.body));
  check("/ keeps its nofollow policy", /<meta[^>]+name="robots"[^>]+nofollow/i.test(demo.body));
  check("/ advertises no canonical URL", !demo.body.includes('rel="canonical"'));
  check("/ advertises no hreflang link", !demo.body.includes("hreflang="));

  for (const pathname of REFUSED_PAGES) {
    await checkRefusal(base, pathname);
  }

  await checkCrawlerParity(base);

  // --- Real browser proof on the same running production server ---------------------------------
  // Every assertion below comes from a real Chromium DOM. A launch failure or a failed assertion is a failure of this
  // gate, never a skip, and the surrounding `finally` still restores the fixture.
  const browserProof = await verifyUnoU03Browser({
    base,
    pages: PUBLIC_PAGES,
    refusedPaths: REFUSED_PAGES,
  });
  for (const name of browserProof.passes) check(name, true);
  for (const failure of browserProof.failures) {
    failures.push(failure);
    process.stdout.write(`  FAIL  ${failure}\n`);
  }

  check("server stayed up for the whole run", child.exitCode === null && child.signalCode === null);
  return 0;
}


async function main() {
  process.stdout.write("verify-u03-published-http: positive publication over a real production build\n");

  const nextBin = nextBinPath();
  if (nextBin === null) {
    process.stderr.write("verify-u03-published-http: FAILED - the pinned local Next CLI was not found.\n");
    return 1;
  }

  mkdirSync(resolve(ROOT, ".temp"), { recursive: true });
  let child = null;
  let port = 0;
  let transaction = null;
  let restored = false;

  try {
    preflight();
    if (failures.length > 0) {
      process.stderr.write("verify-u03-published-http: preflight refused; nothing was changed.\n");
      return 1;
    }

    // --- The committed starter head is proven first, before any fixture replaces it --------------
    await committedStarterPhase(nextBin);
    if (failures.length > 0) {
      process.stderr.write(
        "verify-u03-published-http: the committed starter head failed; the fixture was never installed.\n",
      );
      return 1;
    }

    // --- Armed transaction: preconditions, verified backups, exclusive writes -------------------
    // Restoration is armed before the first destructive write, so no failure position can leave a modified
    // declaration without a recovery path.
    const plan = fixturePlan();
    transaction = await prepareUnoU03FixtureTransaction({
      root: ROOT,
      declarations: plan.declarations,
      replacements: plan.replacements,
      fixtureSources: plan.fixtureSources,
      scratchRoot: resolve(ROOT, ".temp"),
    });
    if (transaction.status !== "armed") {
      for (const refusal of transaction.reasons) {
        check(`the fixture transaction refuses to start (${refusal})`, false, refusal);
      }
      process.stderr.write("verify-u03-published-http: the transaction refused; nothing was changed.\n");
      return 1;
    }
    check("the fixture transaction is armed before any write", true);

    const installed = await transaction.install();
    if (!check("the fixture installs without a write failure", installed.ok === true, installed.cause ?? "")) {
      // install() attempted its own rollback; the outer finally verifies it and keeps any recovery copy it needed.
      return 1;
    }
    check("the fixture manifest is installed", sha256Of(MANIFEST) !== PINNED_DECLARATIONS.get(MANIFEST));
    check("the fixture declaration is installed", sha256Of(SELECTION) !== PINNED_DECLARATIONS.get(SELECTION));

    await validateFixtureInProcess();
    if (failures.length > 0) {
      process.stderr.write("verify-u03-published-http: the fixture failed validation; no build was attempted.\n");
      return 1;
    }

    // --- A real production build of the fixture -------------------------------------------
    // Any previous output is removed first: a stale prerender from the committed configuration must never be
    // mistaken for the fixture's result, and vice versa.
    rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
    const build = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
    if (!check("the production build of the fixture succeeds", build.code === 0, `exit ${build.code}`)) {
      process.stderr.write(build.output.slice(-4000));
      return 1;
    }
    // A warning-free build is required here, not merely a zero exit code, and the payload must stay bounded with every
    // published source shipped. Either failure stops before any HTTP or browser evidence is claimed.
    checkBuildClean("the fixture production build", build.output);
    checkTrace("the fixture production build", "fixture");
    if (failures.length > 0) {
      process.stderr.write(build.output.slice(-4000));
      process.stderr.write("verify-u03-published-http: the fixture build is not clean or not bounded.\n");
      return 1;
    }

    const port_ = await freeLoopbackPort();
    port = port_;
    const base = `http://${HOST}:${port}`;
    child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
      windowsHide: true,
    });
    let serverOutput = "";
    child.stdout.on("data", (chunk) => (serverOutput += String(chunk)));
    child.stderr.on("data", (chunk) => (serverOutput += String(chunk)));

    let ready = false;
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) break;
      try {
        await request(`${base}/`);
        ready = true;
        break;
      } catch {
        await delay(250);
      }
    }
    if (!check("the production server reached readiness on loopback", ready, serverOutput.slice(-500))) {
      return 1;
    }

    return await assertOverHttp(base, child);
  } finally {
    await stopChild(child);
    if (port !== 0) {
      check("loopback port released after shutdown", (await portStillOpen(port)) === false);
    }

    // Unconditional verification: the originals must be byte-exact and only transaction-created files may be gone.
    let restoreOutcome = null;
    if (transaction !== null && transaction.status === "armed") {
      restoreOutcome = await transaction.restore();
    }
    const problems = restoreOutcome !== null && restoreOutcome.ok === false ? restoreOutcome.reasons : [];
    restored = transaction === null ? failures.length > 0 : restoreOutcome !== null && restoreOutcome.ok === true;
    for (const problem of problems) {
      failures.push(problem);
      process.stdout.write(`  FAIL  ${problem}\n`);
    }

    if (restored && transaction !== null && transaction.status === "armed") {
      const disposed = await transaction.dispose();
      if (!disposed.ok) {
        restored = false;
        process.stdout.write("  FAIL  the transaction scratch could not be removed\n");
      }
    }
    process.stdout.write(
      restored
        ? "  PASS  the committed declarations and sources are restored byte-for-byte\n"
        : "  FAIL  restoration could not be proven; the recovery copies are preserved and the run must STOP\n",
    );
    if (restored) passes.push("restoration");
    if (restored && durableBaseline.size > 0) {
      for (const [relativePath, digest] of durableBaseline) {
        check(
          `DURABLE_FAMILY_RESTORE ${relativePath} is byte-identical after the fixture run`,
          sha256Of(relativePath) === digest,
        );
      }
    }
    if (restored) {
      check(
        "DURABLE_FAMILY_RESTORE the three-Page graph is unchanged after the fixture run",
        sha256Of(MANIFEST) === PINNED_DECLARATIONS.get(MANIFEST) && sha256Of(SELECTION) === PINNED_DECLARATIONS.get(SELECTION),
      );
    }
  }
}


const outcome = await main();

// Step 4: the final `.next` must correspond to the ORIGINAL unpublished sources, so the committed configuration is
// rebuilt and the two existing fail-closed gates are re-run against it. Nothing here can succeed on a stale fixture.
const declarationsRestored =
  sha256Of(MANIFEST) === PINNED_DECLARATIONS.get(MANIFEST) &&
  sha256Of(SELECTION) === PINNED_DECLARATIONS.get(SELECTION);

if (outcome === 0 && declarationsRestored) {
  process.stdout.write("\nverify-u03-published-http: rebuilding the committed unpublished configuration\n");
  const nextBin = nextBinPath();

  rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
  const rebuild = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
  check("the rebuild of the committed configuration succeeds", rebuild.code === 0, `exit ${rebuild.code}`);
  checkBuildClean("the committed rebuild", rebuild.output);
  checkTrace("the committed rebuild", "committed");

  const u01 = await runChild([resolve(ROOT, "scripts/verify-u01-http.mjs")], BUILD_TIMEOUT_MS);
  check("the original U01 HTTP gate still passes", u01.code === 0, `exit ${u01.code}`);

  const u03 = await runChild([resolve(ROOT, "scripts/verify-u03-http.mjs")], BUILD_TIMEOUT_MS);
  check("the original U03 fail-closed gate still passes", u03.code === 0, `exit ${u03.code}`);

  const status = spawnSync(
    "git",
    ["--no-optional-locks", "status", "--porcelain=v1", "--untracked-files=all", "--", "deployment"],
    { cwd: ROOT, encoding: "utf8" },
  );
  const unexpectedAfter = status.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !STARTER_PATHS.some((starterPath) => line.endsWith(` ${starterPath}`)));
  check(
    "no committed deployment input outside the authorized starter paths is modified after restoration",
    unexpectedAfter.length === 0,
    unexpectedAfter.join(" | "),
  );
  const staged = spawnSync("git", ["--no-optional-locks", "diff", "--cached", "--name-only"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("nothing was staged by the gate", staged.stdout.trim() === "", staged.stdout.trim());
} else if (outcome === 0) {
  check("the committed declarations are restored before the final rebuild", false, "digest mismatch");
}

process.stdout.write(`\nverify-u03-published-http: ${passes.length} passed, ${failures.length} failed\n`);
if (failures.length > 0 || outcome !== 0) {
  process.stderr.write(
    `verify-u03-published-http: FAILED\n${failures.map((failure) => `  - ${failure}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    "verify-u03-published-http: OK - published Pages, truthful locale documents, canonical/hreflang/sitemap and strict refusals proved over real HTTP, with the committed declarations restored.\n",
  );
  process.exitCode = 0;
}
