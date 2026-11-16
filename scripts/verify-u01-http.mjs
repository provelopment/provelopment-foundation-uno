#!/usr/bin/env node
/**
 * Foundation Uno — real production HTTP proof for the English demonstration homepage.
 *
 * Node built-ins only. It requires an already-built `.next` (run `pnpm build` first), starts the
 * EXISTING unchanged Next server through the pinned local Next CLI with `node` and no shell, on
 * `127.0.0.1` and an ephemeral loopback port, waits for readiness within a bounded deadline, makes
 * real `fetch` requests against the production output, and always terminates the exact child
 * process — including on failure paths.
 *
 * The assertions describe what a visitor receives, not what a source file contains: content type,
 * the single `h1`, the title and description actually served, the explanatory sections, the source
 * link, in-page anchor integrity, the preserved `noindex, nofollow` policy, the absence of
 * fabricated metadata and analytics, and the six declared 404 refusals. Each check is separately
 * counted, and a negative check fails if the page regresses to the old placeholder or starts
 * implying a published Site.
 *
 * Deliberate non-goals: no CDP/browser dependency, no screenshot claim, no provider call, no
 * non-loopback request, no write outside the repository, and no claim about later real EFS routing
 * or a live deployment. This proves the GitHub-built production output only.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;

const SOURCE_URL = "https://github.com/provelopment/provelopment-foundation-uno";
const EXPECTED_TITLE = "Foundation Uno | A focused website foundation by Provelopment";
const EXPECTED_DESCRIPTION =
  "Explore Foundation Uno, a live, open-source single-page demonstration of a website foundation designed around one organization and developed by Provelopment.";
const EYEBROW = "A Provelopment initiative · Open source · Next.js + TypeScript";
const HERO_HEADING = "Foundation Uno — a focused foundation for the web";
const HERO_LEAD =
  "Foundation Uno is a working, open-source website demonstration from Provelopment, designed around a simple principle: one organization, one clear ownership model. Its foundation brings together structured content, modern web technology and a deliberate approach to extending what a website can do.";
const HERO_NOTE =
  "You are viewing a live, single-page example of Foundation Uno. The wider content-publishing system is being developed in stages.";
const ARCHITECTURE_HEADING = "A clear structure for everything you publish";
const ARCHITECTURE_INTRO =
  "Uno organizes a website around one accountable owner. Content can be arranged into distinct areas, websites, pages and authored language versions without introducing competing ownership models.";
const ARCHITECTURE_NOTE =
  "The single-Entity content structure and an English Home source are already defined and validated in the codebase. Content-driven publishing and locale-aware routes are forthcoming.";
const PROGRESS_HEADING = "Working today. Designed to grow.";
const PROGRESS_INTRO =
  "This deployed page demonstrates Uno's current web foundation. The next capabilities are being added with explicit contracts, automated tests and clear ownership.";
const SOURCE_HEADING = "Explore the source";
const SOURCE_INTRO =
  "Foundation Uno is developed in the open. Review the implementation, tests and architecture in its GitHub repository, and follow how the foundation evolves.";
const SOURCE_LINK_TEXT = "View Foundation Uno on GitHub";
const SOURCE_NOTE =
  "The page you are viewing is a self-contained demonstration; the authored content engine will power more of the experience as development continues.";
const FOOTER_COPY =
  "Foundation Uno is a Provelopment initiative. A live, open-source demonstration of a focused, single-owner website foundation. © 2026 Provelopment.";
const LEVEL_DESCRIPTIONS = Object.freeze([
  ["Entity", "The single organization that owns the website and its content."],
  ["Facets", "Distinct areas of the organization's work, organized under the same owner."],
  [
    "Sites",
    "Individual web presences with clearly defined responsibilities and a deliberate publication choice.",
  ],
  [
    "Pages",
    "Structured content with explicit sources, designed to support reliable publishing as the platform grows.",
  ],
  [
    "Localized representations",
    "Language-and-region-specific content authored intentionally, rather than inferred from a visitor's location.",
  ],
]);
const AVAILABLE_BULLETS = Object.freeze([
  "A live, responsive single-page website built with Next.js, React and TypeScript.",
  "A validated single-Entity content graph with an authored English Home source.",
  "Tested rules for content identity, safe URLs, source selection and authored locale declarations.",
  "Automated checks across Windows and Linux, including production HTTP and dependency-security tests.",
  "Publicly reviewable source code released under the Apache-2.0 licence.",
]);
const IN_DEVELOPMENT_BULLETS = Object.freeze([
  "Serving authored JSON and Markdown content through the website.",
  "Locale-aware page addresses, visibility controls and publication metadata.",
  "A wider library of layouts, content and interactive components.",
  "Reproducible setup, upgrades and release workflows for independent installations.",
]);
const OBSOLETE_PHRASES = Object.freeze([
  "A1",
  "P05",
  "technical placeholder",
  "not deployed",
  "no live deployment",
  "no manifest",
  "only the smallest pure primitives",
  "not a finished website",
  "no publication",
]);
const RETIRED_DISCLOSURE = "English demonstration — full authored Site publication is not yet enabled.";
const LOGO_SRC = "/uno-logo.svg";
const ICON_SRC = "/icon.svg";
const REFUSED_PATHS = Object.freeze([
  "/en",
  "/en-001",
  "/about",
  "/does-not-exist-9f3",
  "/robots.txt",
  "/sitemap.xml",
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

/**
 * Normalise the served document for text assertions: entity references and typographic
 * apostrophes become plain characters, and whitespace is collapsed. Structure is asserted against
 * the raw HTML; only prose comparisons use this view.
 */
function normalise(html) {
  return html
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&mdash;/gi, "—")
    .replace(/&rsquo;/gi, "'")
    .replace(/\s+/g, " ");
}

function textOf(fragment) {
  return normalise(fragment.replace(/<[^>]+>/g, " ")).trim();
}

/** The pinned local Next CLI entry point. */
function nextBinPath() {
  for (const candidate of [
    resolve("node_modules/next/dist/bin/next"),
    resolve("node_modules/next/dist/bin/next.js"),
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

/** Stop exactly the child we spawned, and wait for it, on every path. */
async function stopChild(child) {
  if (child === null) return;
  if (child.exitCode !== null || child.signalCode !== null) return;

  // No shell was involved, so this is the Next server process itself.
  child.kill();
  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
    await delay(100);
  }
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    const hardDeadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
    while (child.exitCode === null && child.signalCode === null && Date.now() < hardDeadline) {
      await delay(100);
    }
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await response.text();
  return { status: response.status, contentType: response.headers.get("content-type") ?? "", body };
}

/** Assert the visitor-facing content of the served homepage. */
function checkHomePage(home) {
  const raw = home.body;
  const text = normalise(raw);
  const headings = raw.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
  const title = raw.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description =
    raw.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] ?? "";

  check("/ returns 200", home.status === 200, `status ${home.status}`);
  check("/ is served as HTML", /text\/html/i.test(home.contentType), home.contentType);
  check('document declares lang="en"', /<html[^>]+lang="en"/i.test(raw));

  check("/ carries exactly one h1", headings.length === 1, `found ${headings.length}`);
  const heroTitle = textOf(headings[0] ?? "");
  check("the h1 is the approved headline", heroTitle === HERO_HEADING, heroTitle);
  check("the served title is the approved metadata title", title === EXPECTED_TITLE, title);
  check(
    "the served meta description is the approved description",
    description === EXPECTED_DESCRIPTION,
    description,
  );
  check("the eyebrow is the approved copy", text.includes(EYEBROW));
  check("the hero lead is the approved copy", text.includes(HERO_LEAD));
  check("the primary call to action is the approved copy", text.includes("Explore the source on GitHub"));
  check("the secondary call to action is the approved copy", text.includes("See the progress"));
  check("the hero note is the approved copy", text.includes(HERO_NOTE));

  check("the architecture heading is the approved copy", text.includes(ARCHITECTURE_HEADING));
  check("the architecture intro is the approved copy", text.includes(ARCHITECTURE_INTRO));
  for (const [name, description] of LEVEL_DESCRIPTIONS) {
    check("the " + name + " description is the approved copy", text.includes(description), name);
  }
  check("the architecture note is the approved copy", text.includes(ARCHITECTURE_NOTE));
  check(
    "the architecture list names all five levels",
    ["Entity", "Facets", "Sites", "Pages", "Localized representations"].every((level) =>
      text.includes(level),
    ),
  );

  check("the progress heading is the approved copy", text.includes(PROGRESS_HEADING));
  check("the progress intro is the approved copy", text.includes(PROGRESS_INTRO));
  check('the "Available today" column is present', text.includes("Available today"));
  check('the "In development" column is present', text.includes("In development"));
  for (const bullet of AVAILABLE_BULLETS) {
    check('an "Available today" bullet is the approved copy', text.includes(bullet), bullet.slice(0, 40));
  }
  for (const bullet of IN_DEVELOPMENT_BULLETS) {
    check('an "In development" bullet is the approved copy', text.includes(bullet), bullet.slice(0, 40));
  }
  check(
    "each status column carries a real list",
    (raw.match(/<h3>Available today<\/h3>\s*<ul>[\s\S]*?<\/ul>/i)?.[0].match(/<li>/g) ?? []).length >= 5 &&
      (raw.match(/<h3>In development<\/h3>\s*<ul>[\s\S]*?<\/ul>/i)?.[0].match(/<li>/g) ?? []).length >= 4,
  );

  check("the source heading is the approved copy", text.includes(SOURCE_HEADING));
  check("the source intro is the approved copy", text.includes(SOURCE_INTRO));
  check("the source link text is the approved copy", text.includes(SOURCE_LINK_TEXT));
  check("the source note is the approved copy", text.includes(SOURCE_NOTE));
  check("the footer is the approved copy", text.includes(FOOTER_COPY));

  for (const phrase of OBSOLETE_PHRASES) {
    check('no obsolete or false phrase "' + phrase + '" is visible', !text.includes(phrase));
  }
  check("the retired disclosure sentence is gone", !text.includes(RETIRED_DISCLOSURE));
  check(
    "the page does not claim the EFS content runtime is live",
    !/content engine (?:is|are) (?:live|serving)|EFS (?:publication|runtime) is live|locale routes are live|authored Site is published/i.test(
      text,
    ),
  );

  check(
    "the brand row shows the approved mark",
    raw.includes('src="' + LOGO_SRC + '"') && raw.includes('alt="Foundation Uno"'),
  );
  check(
    "the mark is a static SVG image element",
    new RegExp('<img[^>]+src="' + LOGO_SRC + '"[^>]*>').test(raw),
  );
  check(
    "the favicon is served from the App Router icon route",
    /<link[^>]+rel="icon"[^>]+href="\/icon\.svg/.test(raw) && /type="image\/svg\+xml"/.test(raw),
  );

  check(
    "the source link points at the one public Uno repository",
    raw.includes('href="' + SOURCE_URL + '"'),
  );
  check(
    "both approved GitHub source anchors are present",
    (raw.match(new RegExp('href="' + SOURCE_URL + '"', "g")) ?? []).length === 2,
    (raw.match(new RegExp('href="' + SOURCE_URL + '"', "g")) ?? []).length + " anchors",
  );
  check(
    "the only absolute links are the two approved repository anchors",
    (raw.match(/href="https?:\/\//g) ?? []).length === 2,
    (raw.match(/href="https?:\/\//g) ?? []).length + " absolute links",
  );

  const anchors = [...raw.matchAll(/<a\b[^>]*href="#([^"]+)"/g)].map((match) => match[1]);
  const ids = new Set([...raw.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const brokenAnchors = anchors.filter((anchor) => !ids.has(anchor));
  check(
    "every in-page anchor resolves to a present id",
    anchors.length >= 4 && brokenAnchors.length === 0,
    `anchors=${anchors.length} broken=${brokenAnchors.join(",")}`,
  );

  check("robots directive is noindex", /<meta[^>]+name="robots"[^>]+noindex/i.test(raw));
  check("robots directive is nofollow", /<meta[^>]+name="robots"[^>]+nofollow/i.test(raw));

  for (const forbidden of [
    'rel="canonical"',
    "hreflang",
    "sitemap",
    "googletagmanager",
    "modules/connect",
    "plausible.io",
    "posthog",
    "matomo",
    "google-analytics.com",
    "doubleclick",
  ]) {
    check(`served HTML does not advertise "${forbidden}"`, !text.toLowerCase().includes(forbidden));
  }

  // The ONE approved analytics integration (UNO-WO-014 / R01). Next renders the provider script
  // only when the deployment runs on Vercel, so a loopback production server legitimately shows
  // no script at all: the assertion is exact in both cases rather than tuned to one host.
  const insightsReferences = (raw.match(/\/_vercel\/insights\/script\.js/g) ?? []).length;
  check(
    "the approved analytics script is referenced at most once",
    insightsReferences <= 1,
    `${insightsReferences} references`,
  );
  const vercelRoutes = [...new Set(raw.match(/\/_vercel\/[a-z0-9-]+/gi) ?? [])];
  check(
    "only the approved provider route is referenced",
    vercelRoutes.every((route) => route === "/_vercel/insights"),
    vercelRoutes.join(",") || "none",
  );
  check(
    "no analytics or advertising provider host is referenced",
    !/(?:https?:)?\/\/(?:[a-z0-9-]+\.)*(?:google-analytics|googletagmanager|doubleclick|plausible|posthog|matomo|segment)\./i.test(
      raw,
    ),
  );

  check(
    "no external stylesheet, script, font or image is referenced",
    !/(?:src|srcSet)="https?:\/\//i.test(raw) &&
      !/<link\b[^>]*href="https?:\/\//i.test(raw) &&
      !/@import/i.test(raw),
  );
  check(
    "the served page is substantial enough to inform a visitor",
    text.length >= 1500,
    `${text.length} characters`,
  );
}

async function main() {
  process.stdout.write("verify-u01-http: real production HTTP assertions for GET /\n");

  if (!existsSync(".next")) {
    process.stderr.write("verify-u01-http: FAILED - .next is missing; run `pnpm build` first.\n");
    return 1;
  }
  const nextBin = nextBinPath();
  if (nextBin === null) {
    process.stderr.write("verify-u01-http: FAILED - the pinned local Next CLI was not found.\n");
    return 1;
  }

  const port = await freeLoopbackPort();
  const base = `http://${HOST}:${port}`;
  const output = [];
  let child = null;

  try {
    child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => output.push(String(chunk)));
    child.stderr.on("data", (chunk) => output.push(String(chunk)));

    let ready = false;
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) break;
      try {
        await fetchText(`${base}/`);
        ready = true;
        break;
      } catch {
        // Not accepting connections yet — bounded by the deadline above.
      }
      await delay(250);
    }

    if (!check("server reached readiness on loopback", ready, `child exit=${child.exitCode}`)) {
      process.stderr.write(output.join("").slice(0, 4000));
      return 1;
    }

    const home = await fetchText(`${base}/`);
    checkHomePage(home);

    // --- Brand assets over real HTTP --------------------------------------------------
    const logo = await fetchText(base + LOGO_SRC);
    const icon = await fetchText(base + ICON_SRC);
    check(LOGO_SRC + " returns 200", logo.status === 200, "status " + logo.status);
    check(LOGO_SRC + " is served as SVG", /image\/svg\+xml/i.test(logo.contentType), logo.contentType);
    check(ICON_SRC + " returns 200", icon.status === 200, "status " + icon.status);
    check(ICON_SRC + " is served as SVG", /image\/svg\+xml/i.test(icon.contentType), icon.contentType);
    check(
      "the header mark and the favicon are byte-identical",
      logo.body === icon.body && logo.body.length > 0,
      logo.body.length + " vs " + icon.body.length + " bytes",
    );
    check(
      "the served mark is the committed vector",
      logo.body === readFileSync("public/uno-logo.svg", "utf8"),
    );
    check(
      "the served mark carries no script, handler or remote reference",
      !/<script|<foreignObject|<image|xlink:href|\son[a-z]+=/i.test(logo.body),
    );
    check(
      "the served mark keeps the approved palette",
      logo.body.includes("#1f6f6b") && logo.body.includes("#101620"),
    );

    // Every declared refusal must stay a real 404: not a redirect, not invisible content.
    for (const path of REFUSED_PATHS) {
      const response = await fetchText(`${base}${path}`);
      check(`${path} returns 404`, response.status === 404, `status ${response.status}`);
    }

    const notFound = await fetchText(`${base}/does-not-exist-9f3`);
    const notFoundText = normalise(notFound.body);
    check(
      "the 404 page offers the demonstration homepage as its way back",
      notFoundText.includes("Go to the Foundation Uno homepage") &&
        notFound.body.includes('href="/"'),
    );
    check(
      "the 404 page no longer mentions the old technical baseline",
      !/technical baseline/i.test(notFoundText),
    );
    check(
      "the 404 page does not advertise a published Site or Page",
      !/publish/i.test(notFoundText) && !/live (?:site|website)/i.test(notFoundText),
    );

    check(
      "server stayed up for the whole run",
      child.exitCode === null && child.signalCode === null,
    );
  } finally {
    await stopChild(child);
  }

  check("loopback port released after shutdown", (await portStillOpen(port)) === false);

  process.stdout.write(`\nverify-u01-http: ${passes.length} passed, ${failures.length} failed\n`);
  if (failures.length > 0) {
    process.stderr.write(
      `verify-u01-http: FAILED\n${failures.map((failure) => `  - ${failure}`).join("\n")}\n`,
    );
    return 1;
  }
  process.stdout.write(
    "verify-u01-http: OK - the English demonstration page served correctly over real HTTP.\n",
  );
  return 0;
}

process.exitCode = await main();
