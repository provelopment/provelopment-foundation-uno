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
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;

const SOURCE_URL = "https://github.com/provelopment/provelopment-foundation-uno";
const EXPECTED_TITLE = "Foundation Uno — a single-Entity website foundation";
const OBSOLETE_SENTENCE = "U01 technical baseline — the authored public Site is not configured.";
const DISCLOSURE =
  "English demonstration — full authored Site publication is not yet enabled.";
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
  check("the h1 names Foundation Uno", /Foundat?ion Uno/i.test(heroTitle), heroTitle);
  check(
    "the h1 describes the single-Entity foundation direction",
    /single-entity/i.test(heroTitle) && /foundation/i.test(heroTitle),
    heroTitle,
  );

  check("the served title reflects the demonstration page", title.includes(EXPECTED_TITLE), title);
  check("the served title is not the obsolete placeholder", !/technical baseline/i.test(title));
  check(
    "the meta description is present and truthful",
    /Foundat?ion Uno/i.test(description) && /one Entity/i.test(description),
    description,
  );
  check(
    "the meta description is not the obsolete placeholder",
    description.length > 0 && !/authored public Site is not configured/i.test(description),
  );

  check("the obsolete placeholder sentence is gone", !text.includes(OBSOLETE_SENTENCE));
  check(
    "the introduction names the Apache-2.0 Next.js and TypeScript foundation",
    text.includes("Apache-2.0") && text.includes("Next.js") && text.includes("TypeScript"),
  );
  check("the introduction is built around one Entity", /one Entity/i.test(text));
  check(
    "the introduction mentions Facets, Sites, Pages and locales",
    text.includes("Facets") && text.includes("Sites") && text.includes("Pages") &&
      text.includes("locales"),
  );

  check('the "How it is organized" section is present', text.includes("How it is organized"));
  check(
    "the planned model names all four contract levels",
    text.includes("Entity") && text.includes("Facets") && text.includes("Sites") &&
      text.includes("Pages") && /localized representations/i.test(text),
  );
  check(
    "the planned model names region-qualified locales rather than guessed ones",
    /region-qualified locales/i.test(text) && /en-001/.test(text) && /never guessed/i.test(text),
  );
  check("the model is labelled as a planned contract", /planned contract/i.test(text));

  check('the "What works today" column is present', text.includes("What works today"));
  check("the \"What's next\" column is present", text.includes("What's next"));
  check(
    "each status column carries a real list of items",
    (raw.match(/<h3>What works today<\/h3>\s*<ul>[\s\S]*?<\/ul>/i)?.[0].match(/<li>/g) ?? [])
      .length >= 4 &&
      (
        raw.match(/<h3>What(?:&rsquo;|&#x27;|&#39;|[\u2018\u2019'])s next<\/h3>\s*<ul>[\s\S]*?<\/ul>/i)?.[0]
          .match(/<li>/g) ?? []
      ).length >= 4,
  );
  check(
    "the page states that Uno is a foundation, not a finished website",
    /not a finished website/i.test(text),
  );
  check(
    "the informational-demo disclosure is visible",
    text.includes(DISCLOSURE),
  );
  check(
    "the page makes no publication or live-site claim",
    !/(?:\bis|\bare|\bnow)\s+(?:live|published)\b|deployed at|\blive (?:site|website)\b|\blaunched\b|published (?:website|Uno website|demonstration site)/i.test(
      text,
    ),
    "publication claim",
  );

  check(
    "the source link points at the one public Uno repository",
    raw.includes(`href="${SOURCE_URL}"`),
  );
  check(
    "the source link has readable link text",
    /<a[^>]+href="https:\/\/github\.com\/provelopment\/provelopment-foundation-uno"[^>]*>[\s\S]{0,80}?(Explore the code|repository on GitHub)/i.test(
      raw,
    ),
  );
  check(
    "the source link is the only absolute link on the page",
    (raw.match(/href="https?:\/\//g) ?? []).length === 2,
    `${(raw.match(/href="https?:\/\//g) ?? []).length} absolute links`,
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
    "analytics",
    "googletagmanager",
    "@vercel",
    "modules/connect",
  ]) {
    check(`served HTML does not advertise "${forbidden}"`, !text.toLowerCase().includes(forbidden));
  }

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
