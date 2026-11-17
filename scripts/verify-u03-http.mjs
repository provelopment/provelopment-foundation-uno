#!/usr/bin/env node
/**
 * Foundation Uno — real production HTTP proof for the U03 fail-closed surface.
 *
 * Node built-ins only. It requires an already-built `.next` (run `pnpm build` first), starts the EXISTING
 * unchanged Next server through the pinned local Next CLI with `node` and no shell, on `127.0.0.1` and an
 * ephemeral loopback port, waits for readiness within a bounded deadline, makes real `fetch` requests against
 * the production output, and always terminates the exact child process — including on failure paths.
 *
 * WHAT IT PROVES. The committed deployment declares no canonical base and publishes no Page, so every localized
 * address, `robots.txt` and `sitemap.xml` must answer a genuine 404 — not an empty 200, not a redirect, not a
 * soft page carrying metadata. The English demonstration at `/` must keep its 200, its noindex policy and its
 * single `h1`, so this gate cannot be passed by breaking the page an earlier order froze.
 *
 * WHAT IT DOES NOT CLAIM. No positive public Page is served by this build: a positive decision needs a chosen
 * canonical domain and an explicit publication of a real Page, neither of which exists. Positive serving is
 * proved in the focused suites against synthetic confined fixtures instead. No browser, no screenshot, no
 * provider call, no non-loopback request, no write outside the repository.
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

/** Every address that must stay a real 404 while the committed declaration publishes nothing. */
const REFUSED_PATHS = Object.freeze([
  "/en",
  "/en-001",
  "/en-001/about",
  "/en-001/home",
  "/de",
  "/en-001/does-not-exist",
  "/robots.txt",
  "/sitemap.xml",
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

async function request(url) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    location: response.headers.get("location"),
    robotsTag: response.headers.get("x-robots-tag"),
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

/** One refusal: a real 404 with no redirect and no advertising of any kind. */
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

    for (const path of REFUSED_PATHS) {
      const isHtmlSurface = path !== "/robots.txt" && path !== "/sitemap.xml";
      await checkRefusal(base, path, isHtmlSurface);
    }

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
    "verify-u03-http: OK - every unpublished address is a real 404 and the demonstration is intact.\n",
  );
  return 0;
}

process.exitCode = await main();
