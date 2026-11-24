/**
 * Foundation Uno — the process/HTTP harness the production gates share (`UNO-WO-112 / R01`).
 *
 * WHY THIS IS A MODULE. Every production gate does the same four mechanical things: locate the pinned Next CLI, take a free
 * loopback port, run one child process with a bounded timeout, and wait for the server to answer. Those four had been
 * copied into each runner; here they are one reviewed implementation with explicit inputs, so a runner reads as
 * orchestration and a harness change is made once.
 *
 * WHAT IT IS NOT. Nothing here weakens a gate: `runChild` still fails on a non-zero exit, `waitForServer` still returns
 * `false` on a dead or silent child, and `killChild` is still best effort. None of it decides an assertion.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

/** The pinned Next CLI inside one checkout, or `null` when the dependency is not installed. */
export function nextBinPath(root) {
  for (const candidate of [
    resolve(root, "node_modules/next/dist/bin/next"),
    resolve(root, "node_modules/next/dist/bin/next.js"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** One free loopback port, released before it is returned. */
export function freeLoopbackPort(host) {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.once("error", rejectPort);
    server.listen(0, host, () => {
      const address = server.address();
      const port = address === null || typeof address === "string" ? 0 : address.port;
      server.close(() => resolvePort(port));
    });
  });
}

/**
 * Run one child process to completion with a hard timeout, returning its exit code and the bounded console output.
 *
 * The timeout kills the child rather than waiting, so a hang is a failure and never a stalled gate.
 */
export function runChild({ root, args, timeoutMs, env }) {
  return new Promise((resolveRun) => {
    const childProcess = spawn(process.execPath, args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production", ...(env ?? {}) },
      windowsHide: true,
    });
    const limit = timeoutMs === undefined ? 600_000 : timeoutMs;
    let output = "";
    const timer = setTimeout(() => childProcess.kill("SIGKILL"), limit);
    childProcess.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    childProcess.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    childProcess.on("close", (code) => {
      clearTimeout(timer);
      resolveRun({ code, output });
    });
  });
}

/**
 * Wait until the server answers one known path, the child exits, or the deadline passes.
 *
 * A non-zero status still counts as an answer: the point of readiness is that the process is serving, not that the probe
 * path itself is a success.
 */
export async function waitForServer({ base, child, readyPath, timeoutMs = 120_000, intervalMs = 250 }) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) return false;
    try {
      const response = await fetch(`${base}${readyPath}`, { redirect: "manual" });
      if (response.status > 0) return true;
    } catch {
      await delay(intervalMs);
    }
  }
  return false;
}

/** Best-effort hard stop of one child process; never throws into a `finally`. */
export function killChild(child) {
  if (child === null || child === undefined || child.exitCode !== null) return;
  try {
    child.kill("SIGKILL");
  } catch {
    /* A process that has already gone is exactly what this wants. */
  }
}

/** One HTTP GET (or any method) as text, with the small amount of transport detail a gate actually asserts on. */
export async function fetchText(url, init) {
  const response = await fetch(url, init);
  return { status: response.status, headers: response.headers, body: await response.text() };
}
