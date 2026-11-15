#!/usr/bin/env node
/**
 * Foundation Uno — real production HTTP proof for the U01 technical placeholder.
 *
 * Node built-ins only. It requires an already-built `.next` (run `pnpm build` first), starts
 * the EXISTING unchanged Next server through the pinned local Next CLI with `node` and no
 * shell, on `127.0.0.1` and an ephemeral loopback port, waits for readiness within a bounded
 * deadline, makes real `fetch` requests, and always terminates the exact child process —
 * including on failure paths.
 *
 * Deliberate non-goals: no CDP/browser dependency, no provider call, no non-loopback request,
 * no write outside the repository, and no claim about later real EFS routing. This proves the
 * technical placeholder only.
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

const EXPECTED_HEADING = "<h1>Foundation Uno</h1>";
const EXPECTED_SENTENCE = "U01 technical baseline — the authored public Site is not configured.";

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
  return { status: response.status, body };
}

async function main() {
  process.stdout.write("verify-u01-http: real production HTTP assertions\n");

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
    const lower = home.body.toLowerCase();

    check("/ returns 200", home.status === 200, `status ${home.status}`);
    check("served HTML carries the exact h1 heading", home.body.includes(EXPECTED_HEADING));
    check("served HTML carries the exact technical sentence", home.body.includes(EXPECTED_SENTENCE));
    check("robots directive is noindex", /<meta[^>]+name="robots"[^>]+noindex/i.test(home.body));
    check("robots directive is nofollow", /<meta[^>]+name="robots"[^>]+nofollow/i.test(home.body));

    for (const path of [
      "/en",
      "/en-001",
      "/about",
      "/does-not-exist-9f3",
      "/robots.txt",
      "/sitemap.xml",
    ]) {
      const response = await fetchText(`${base}${path}`);
      check(`${path} returns 404`, response.status === 404, `status ${response.status}`);
    }

    for (const forbidden of [
      "hreflang",
      'rel="canonical"',
      "sitemap",
      "analytics",
      "googletagmanager",
      "@vercel",
      "modules/connect",
    ]) {
      check(`served HTML does not advertise "${forbidden}"`, !lower.includes(forbidden));
    }

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
    "verify-u01-http: OK - the technical placeholder served correctly over real HTTP.\n",
  );
  return 0;
}

process.exitCode = await main();
