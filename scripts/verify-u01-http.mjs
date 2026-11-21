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
 * fabricated metadata and analytics, and the declared 404 refusals. The committed neutral starter now owns
 * `/en-001`, the `/en` short-alias redirect and the two discovery documents, so those are asserted as explicit
 * positives instead of refusals. Each check is separately counted, and a negative check fails if the page regresses
 * to the old placeholder or starts implying an unlisted Site.
 *
 * Deliberate non-goals: no CDP/browser dependency, no screenshot claim, no provider call, no
 * non-loopback request, no write outside the repository, and no claim about later real EFS routing
 * or a live deployment. This proves the GitHub-built production output only.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;

const SOURCE_URL = "https://github.com/provelopment/provelopment-foundation-uno";
const EXPECTED_TITLE = "Foundation Uno | One organisation. One connected digital presence.";
const EXPECTED_DESCRIPTION =
  "Foundation Uno by Provelopment will give organisations clear ownership, structured content, reliable publishing and intentionally authored regional editions. Explore the live single-page example.";
const EYEBROW = "A Provelopment initiative · Open source · Next.js + TypeScript";
const HERO_HEADING = "One organisation. One connected digital presence.";
const HERO_LEAD =
  "Foundation Uno will bring an organisation's websites, information and regional editions into one coherent publishing foundation.";
const HERO_NOTE = "This is the live single-page introduction to Foundation Uno.";
const APPROACH_HEADING = "A clear structure. Less duplication. Better decisions.";
const APPROACH_INTRO = "Every part of the web presence will belong to one accountable organisation.";
const EXAMPLES_HEADING = "What this will mean in practice";
const EXAMPLES_INTRO = "Foundation Uno is designed for organisations that want clear communication,";
const EXAMPLE_LABELS = Object.freeze([
  "Example: a community organisation",
  "Example: a service provider with regional audiences",
]);
const SOURCE_HEADING = "Built in the open. Designed for long-term ownership.";
const SOURCE_INTRO = "Foundation Uno is a Provelopment open-source initiative.";
const SOURCE_LINK_TEXT = "View Foundation Uno on GitHub";
const LICENCE_NOTE = "The source is available under the Apache-2.0 licence.";
const FOOTER_COPY =
  "© 2026 Provelopment. Foundation Uno is an open-source website foundation and a";
const LEVEL_HEADINGS = Object.freeze([
  "One Entity",
  "Purposeful Facets",
  "Deliberate Sites",
  "Reliable Pages",
  "Thoughtful regional editions",
]);
const EXAMPLE_BULLETS = Object.freeze([
  "Members will find the right service faster through clear organisation.",
  "Editors will maintain one accountable source for each page.",
  "The organisation will keep a consistent identity across its programmes.",
  "Visitors will receive relevant wording and guidance by region.",
  "Editors will control each edition instead of relying on automatic guesses.",
  "Teams will review changes with predictable, testable publishing rules.",
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
const LOGO_BYTES = 8247;
const LOGO_SHA256 = "bd804ce683824ad85852615b0e0a700badb80cf2cdff38dd642d9f1947d57d9c";

/**
 * Canonical LF form. The committed vector is stored with LF and the pinned digest covers those
 * bytes; a Windows checkout may deliver CRLF for the same content.
 */
const canonicalSvg = (text) => text.replace(/\r\n/g, "\n");
/**
 * Addresses that must stay genuine 404s for this gate. The committed starter owns `/en-001`, the `/en` short-alias
 * redirect, `/robots.txt` and `/sitemap.xml`; those are asserted as explicit positives below rather than refusals.
 */
const REFUSED_PATHS = Object.freeze([
  "/about",
  "/does-not-exist-9f3",
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

/**
 * Strip script payloads so a copy assertion judges what a visitor can read, not the RSC data
 * that duplicates the same strings inside the document.
 */
function visibleHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
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
  const text = normalise(visibleHtml(raw));
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
  check("the hero lead uses forward-looking language", /will bring/i.test(text));
  check("the primary call to action is the approved copy", text.includes("Explore the open-source project"));
  check("the secondary call to action is the approved copy", text.includes("See how it will work"));
  check("the hero note states this is the live single-page introduction", text.includes(HERO_NOTE));

  check("the approach heading is the approved copy", text.includes(APPROACH_HEADING));
  check("the approach intro is the approved copy", text.includes(APPROACH_INTRO));
  for (const heading of LEVEL_HEADINGS) {
    check("the " + heading + " feature is described", text.includes(heading), heading);
  }
  check(
    "all five feature-benefit descriptions are forward-looking",
    ["will own the entire foundation", "will have distinct places", "will serve a defined purpose",
      "will draw from explicitly authored content sources", "will be written and maintained deliberately"]
      .every((phrase) => text.includes(phrase)),
  );
  check(
    "each described layer connects a capability to a benefit",
    ["without competing owners", "without\\s+losing the connection", "clear, intentional experience",
      "transparent record", "without\\s+the site guessing"]
      .every((pattern) => new RegExp(pattern).test(text)),
  );

  check("the examples heading is the approved copy", text.includes(EXAMPLES_HEADING));
  check("the examples intro is the approved copy", text.includes(EXAMPLES_INTRO));
  for (const label of EXAMPLE_LABELS) {
    check("the illustrative example \"" + label + "\" is present", text.includes(label), label);
  }
  check("both scenario cards are explicitly labelled as examples", (text.match(/Example:/g) ?? []).length === 2);
  for (const bullet of EXAMPLE_BULLETS) {
    check("an example bullet is the approved copy", text.includes(bullet), bullet.slice(0, 40));
  }
  check(
    "the page states the scenarios are illustrations, not customers",
    /illustrations of the intended product experience, not\s+descriptions of existing customers/i.test(text),
  );

  check("the source heading is the approved copy", text.includes(SOURCE_HEADING));
  check("the source intro is the approved copy", text.includes(SOURCE_INTRO));
  check("the source link text is the approved copy", text.includes(SOURCE_LINK_TEXT));
  check("the licence note is the approved copy", text.includes(LICENCE_NOTE));
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
    "no fabricated testimonial, client or measured result is claimed",
    !/testimonial|case study|our client|customers include|\d+%\s+(?:faster|more|increase)/i.test(text),
  );

  check(
    "the brand mark keeps the approved attributes",
    /<img[^>]+alt="Foundation Uno"[^>]*width="30"[^>]*height="30"[^>]*src="\/uno-logo\.svg"/.test(raw),
    "img attributes",
  );
  check(
    "the brand mark is served without an image optimizer rewrite",
    !/_next\/image/.test(raw) && !/srcSet=/.test(raw),
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
    "exactly two approved GitHub source anchors are present",
    (raw.match(new RegExp('href="' + SOURCE_URL + '"', "g")) ?? []).length === 2,
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
      "the served numeral is exactly one true-black fill",
      (logo.body.match(/fill="#000000"/g) ?? []).length === 1,
      (logo.body.match(/fill="#000000"/g) ?? []).length + " black fills",
    );
    check(
      "the served network keeps exactly one approved green fill",
      (logo.body.match(/fill="#1f6f6b"/g) ?? []).length === 1,
      (logo.body.match(/fill="#1f6f6b"/g) ?? []).length + " green fills",
    );
    check(
      "the served mark keeps the approved palette",
      logo.body.includes("#1f6f6b") && logo.body.includes('fill="#000000"'),
    );
    check(
      "the served mark is the approved official-source vector by digest",
      createHash("sha256").update(canonicalSvg(logo.body)).digest("hex") === LOGO_SHA256,
    );
    check(
      "the served mark is exactly the approved byte length",
      Buffer.byteLength(canonicalSvg(logo.body), "utf8") === LOGO_BYTES,
      String(Buffer.byteLength(canonicalSvg(logo.body), "utf8")),
    );
    check(
      "the served mark uses the large official canvas",
      /viewBox="0 0 2048 2048"/.test(logo.body),
    );
    check(
      "the served mark keeps the official network geometry",
      (logo.body.match(/<path/g) ?? []).length >= 10,
      (logo.body.match(/<path/g) ?? []).length + " paths",
    );
    check(
      "the served mark has no solid background and no embedded raster",
      !/<rect[^>]*fill="#/i.test(logo.body) && !/base64,/i.test(logo.body),
    );
    check(
      "the superseded concept and charcoal marks are gone",
      !logo.body.includes("#101620") &&
        !logo.body.includes("#36454f") &&
        !logo.body.includes('viewBox="0 0 128 128"'),
    );

    // Every declared refusal must stay a real 404: not a redirect, not invisible content.
    for (const path of REFUSED_PATHS) {
      const response = await fetchText(`${base}${path}`);
      check(`${path} returns 404`, response.status === 404, `status ${response.status}`);
    }

    // The committed neutral starter now owns these addresses: they must answer as real positives, never as
    // refusals, and the redirect must point only at the published root.
    const starterRoot = await fetchText(`${base}/en-001`);
    check("/en-001 serves the committed starter root", starterRoot.status === 200, `status ${starterRoot.status}`);
    check(
      "/en-001 declares the reserved canonical",
      starterRoot.body.includes('<link rel="canonical" href="https://uno-starter.example/en-001"/>'),
    );
    const shortAlias = await fetch(`${base}/en`, { redirect: "manual" });
    check("/en answers one explicit redirect", [307, 308].includes(shortAlias.status), `status ${shortAlias.status}`);
    check(
      "/en redirects only to the published en-001 root",
      (shortAlias.headers.get("location") ?? "").endsWith("/en-001"),
      String(shortAlias.headers.get("location")),
    );
    const robotsDocument = await fetchText(`${base}/robots.txt`);
    check("/robots.txt is published", robotsDocument.status === 200, `status ${robotsDocument.status}`);
    const sitemapDocument = await fetchText(`${base}/sitemap.xml`);
    check("/sitemap.xml is published", sitemapDocument.status === 200, `status ${sitemapDocument.status}`);

    const notFound = await fetchText(`${base}/does-not-exist-9f3`);
    const notFoundText = normalise(
      visibleHtml(notFound.body.replace(/<head[\s\S]*?<\/head>/i, "")),
    );
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
