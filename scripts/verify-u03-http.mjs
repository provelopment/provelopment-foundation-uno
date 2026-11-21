#!/usr/bin/env node
/**
 * Foundation Uno — real production HTTP proof for the U03 fail-closed surface.
 *
 * Node built-ins only. It requires an already-built `.next` (run `pnpm build` first), starts the EXISTING
 * unchanged Next server through the pinned local Next CLI with `node` and no shell, on `127.0.0.1` and an
 * ephemeral loopback port, waits for readiness within a bounded deadline, makes real `fetch` requests against
 * the production output, and always terminates the exact child process — including on failure paths.
 *
 * WHAT IT PROVES. The committed declaration now carries the reserved sample canonical base and publishes exactly
 * three `en-001` starter Pages, so `/en-001`, `/en-001/about` and `/en-001/components` must answer a real 200 with
 * one `main`, one `h1`, the reserved canonical, agreeing OpenGraph/hreflang metadata and a sitemap that lists the
 * same three addresses. Every other address — the suppressed `home` alias, another locale, a child of a leaf Page,
 * a query, a percent escape or an unknown route — must still answer a genuine 404, not an empty 200 and not a
 * redirect. The English demonstration at `/` must keep its 200, its noindex policy and its single `h1`, so this
 * gate cannot be passed by breaking the page an earlier order froze.
 *
 * WHAT IT DOES NOT CLAIM. The `.example` origin is reserved illustrative metadata: nothing here proves DNS, TLS, an
 * owned domain or a deployment. No browser, no screenshot, no provider call, no non-loopback request, no write
 * outside the repository.
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

/** The reserved, illustrative sample origin. Never a deployment, a DNS record or an owned domain. */
const SAMPLE_ORIGIN = "https://uno-starter.example";

/** Every address that must stay a real 404 even though three starter Pages are published. */
const REFUSED_PATHS = Object.freeze([
  "/en-001/home",
  "/de",
  "/de-001",
  "/en-001/does-not-exist",
  "/en-001/about/extra",
  "/en-001/components/extra",
]);

/** Every published starter Page and the exact text its single `h1` must carry. */
const PUBLISHED_PAGES = Object.freeze([
  { path: "/en-001", title: "Foundation Uno", localeTag: "en-001", canonical: `${SAMPLE_ORIGIN}/en-001` },
  {
    path: "/en-001/about",
    title: "About this starter",
    localeTag: "en-001",
    canonical: `${SAMPLE_ORIGIN}/en-001/about`,
  },
  {
    path: "/en-001/components",
    title: "Components",
    localeTag: "en-001",
    canonical: `${SAMPLE_ORIGIN}/en-001/components`,
  },
]);

/** Fragments a 404 body must never carry: they would advertise a site nothing publishes. */
const FORBIDDEN_IN_REFUSAL = Object.freeze([
  'rel="canonical"',
  "hreflang",
  "<urlset",
  "Sitemap:",
  "Disallow:",
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

/** Collapse whitespace for prose assertions against the served document. */
function normalise(html) {
  return html
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");
}

/** Strip script payloads so a copy assertion judges what a visitor can read. */
function visibleHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
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

async function request(url, method = "GET") {
  const response = await fetch(url, {
    method,
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    location: response.headers.get("location"),
    robotsTag: response.headers.get("x-robots-tag"),
    cacheControl: response.headers.get("cache-control") ?? "",
    body,
  };
}

/** The preserved English demonstration homepage, asserted only enough to prove it was not broken. */
function checkHomePage(home) {
  const raw = home.body;
  const text = normalise(visibleHtml(raw));
  const headings = raw.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];

  check("/ returns 200", home.status === 200, `status ${home.status}`);
  check("/ is served as HTML", /text\/html/i.test(home.contentType), home.contentType);
  check("exactly one h1 is served at /", headings.length === 1, `${headings.length} h1 elements`);
  check(
    "the hero heading is still the approved copy",
    text.includes("One organisation. One connected digital presence."),
  );
  check("the demonstration keeps its noindex policy", /<meta[^>]+name="robots"[^>]+noindex/i.test(raw));
  check("the demonstration keeps its nofollow policy", /<meta[^>]+name="robots"[^>]+nofollow/i.test(raw));
  check(
    "the unpublished demonstration advertises no canonical URL",
    !raw.includes('rel="canonical"') && !/hreflang/i.test(raw),
  );
}

/** One published starter Page: real 200, one main, one h1, agreeing canonical/OpenGraph/hreflang metadata. */
async function checkPublishedPage(base, entry, index) {
  const response = await request(`${base}${entry.path}`);
  const raw = response.body;
  const mains = raw.match(/<main\b/gi) ?? [];
  const headings = raw.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
  const h1Text = normalise(visibleHtml((headings[0] ?? "").replace(/<[^>]+>/g, " "))).trim();

  check(`${entry.path} returns 200`, response.status === 200, `status ${response.status}`);
  check(`${entry.path} is served as HTML`, /text\/html/i.test(response.contentType), response.contentType);
  check(`${entry.path} renders exactly one main`, mains.length === 1, `${mains.length} main elements`);
  check(`${entry.path} renders exactly one h1`, headings.length === 1, `${headings.length} h1 elements`);
  check(`${entry.path} keeps its authored title`, h1Text === entry.title, h1Text);
  check(
    `${entry.path} advertises the reserved canonical`,
    raw.includes(`rel="canonical" href="${entry.canonical}"`),
  );
  check(`${entry.path} advertises a matching OpenGraph URL`, raw.includes(`property="og:url" content="${entry.canonical}"`));
  const alternate = new RegExp(`<link[^>]+hreflang="${entry.localeTag}"[^>]+href="${entry.canonical}"`, "i");
  const defaultAlternate = new RegExp(`<link[^>]+hreflang="x-default"[^>]+href="${entry.canonical}"`, "i");
  check(`${entry.path} carries an ${entry.localeTag} alternate`, alternate.test(raw));
  check(
    `${entry.path} advertises the default alternate only on the default Page`,
    index === 0 ? defaultAlternate.test(raw) : !/x-default/iu.test(raw),
  );
  check(`${entry.path} is indexable`, /<meta[^>]+name="robots"[^>]+content="index, follow"/i.test(raw));
  check(`${entry.path} is not noindex`, !/<meta[^>]+name="robots"[^>]+noindex/i.test(raw));
  check(
    `${entry.path} keeps the reserved origin out of every other host`,
    !/https?:\/\/(?!uno-starter\.example)[a-z0-9.-]+/i.test(raw.replace(/https?:\/\/uno-starter\.example/gi, "")),
  );

  // HEAD must agree with GET and must never stream a body of its own.
  const head = await request(`${base}${entry.path}`, "HEAD");
  check(`${entry.path} HEAD status matches GET`, head.status === response.status, `status ${head.status}`);
  check(`${entry.path} HEAD body stays empty`, head.body.length === 0, `${head.body.length} bytes`);
}

/** The short language alias redirects to the real published root, and never to an invented address. */
async function checkShortAlias(base) {
  const response = await request(`${base}/en`);
  check(
    "/en answers one explicit redirect to the published root",
    response.status === 307 || response.status === 308,
    `status ${response.status}`,
  );
  check(
    "/en redirects to the published en-001 root",
    response.location === `/en-001` || response.location === `${SAMPLE_ORIGIN}/en-001`,
    `location ${response.location}`,
  );
}

/** `robots.txt` and `sitemap.xml` must advertise exactly the three committed addresses. */
async function checkDiscovery(base) {
  const robots = await request(`${base}/robots.txt`);
  check("/robots.txt returns 200", robots.status === 200, `status ${robots.status}`);
  check(
    "/robots.txt names the reserved sitemap",
    robots.body.includes(`Sitemap: ${SAMPLE_ORIGIN}/sitemap.xml`),
  );
  check("/robots.txt never disallows a published Page", !/Disallow:\s*\/en-001/u.test(robots.body));

  const sitemap = await request(`${base}/sitemap.xml`);
  check("/sitemap.xml returns 200", sitemap.status === 200, `status ${sitemap.status}`);
  check("/sitemap.xml is XML", /xml/i.test(sitemap.contentType), sitemap.contentType);
  const locations = sitemap.body.match(/<loc>[^<]+<\/loc>/gu) ?? [];
  check("/sitemap.xml lists exactly three addresses", locations.length === 3, `${locations.length} loc elements`);
  for (const entry of PUBLISHED_PAGES) {
    check(`/sitemap.xml lists ${entry.canonical}`, sitemap.body.includes(`<loc>${entry.canonical}</loc>`));
  }
  check(
    "/sitemap.xml lists no suppressed or unknown address",
    !sitemap.body.includes("/en-001/home") && !sitemap.body.includes("/en-001/does-not-exist"),
  );
}

/** Every refused path: a real 404 with no redirect and no advertising of any kind. */
async function checkRefusal(base, path, expectHtml) {
  const response = await request(`${base}${path}`);
  check(`${path} returns 404`, response.status === 404, `status ${response.status}`);
  check(`${path} is not a redirect`, response.location === null, `location ${response.location}`);
  if (expectHtml) {
    check(`${path} is served as HTML`, /text\/html/i.test(response.contentType), response.contentType);
  } else {
    // A refused non-HTML surface answers 404 with no document type of its own; it must never be a 200.
    check(
      `${path} advertises no content type for a refused document`,
      !/application\/(?:xml|text)|text\/plain/i.test(response.contentType),
      response.contentType,
    );
  }

  for (const fragment of FORBIDDEN_IN_REFUSAL) {
    check(`${path} does not carry "${fragment}"`, !response.body.includes(fragment));
  }
  check(
    `${path} does not claim an indexable response`,
    response.robotsTag === null || !/index(?!.*noindex)/i.test(response.robotsTag),
    `x-robots-tag ${response.robotsTag}`,
  );
  check(
    `${path} does not render a Page body`,
    !/<article\b/i.test(response.body),
  );
}

async function main() {
  process.stdout.write("verify-u03-http: real production HTTP assertions for the U03 fail-closed surface\n");

  if (!existsSync(".next")) {
    process.stderr.write("verify-u03-http: FAILED - .next is missing; run `pnpm build` first.\n");
    return 1;
  }
  const nextBin = nextBinPath();
  if (nextBin === null) {
    process.stderr.write("verify-u03-http: FAILED - the pinned local Next CLI was not found.\n");
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
        await request(`${base}/`);
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

    checkHomePage(await request(`${base}/`));

    for (const [index, entry] of PUBLISHED_PAGES.entries()) {
      await checkPublishedPage(base, entry, index);
    }
    await checkShortAlias(base);
    await checkDiscovery(base);

    for (const path of REFUSED_PATHS) {
      await checkRefusal(base, path, true);
    }
    // A percent-encoded space never becomes a different published address.
    await checkRefusal(base, "/en-001/a%20b", true);

    const root = await request(`${base}/`);
    check(
      "the refusal surface did not disturb the demonstration",
      root.status === 200 && /text\/html/i.test(root.contentType),
    );
    check("server stayed up for the whole run", child.exitCode === null && child.signalCode === null);
  } finally {
    await stopChild(child);
  }

  check("loopback port released after shutdown", (await portStillOpen(port)) === false);

  process.stdout.write(`\nverify-u03-http: ${passes.length} passed, ${failures.length} failed\n`);
  if (failures.length > 0) {
    process.stderr.write(
      `verify-u03-http: FAILED\n${failures.map((failure) => `  - ${failure}`).join("\n")}\n`,
    );
    return 1;
  }
  process.stdout.write(
    "verify-u03-http: OK - the three committed starter Pages are served with the reserved canonical and every other address is a real 404.\n",
  );
  return 0;
}

process.exitCode = await main();
