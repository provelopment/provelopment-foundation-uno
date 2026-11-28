/**
 * Foundation Uno — the U05 enabled-state production proof (`U05`).
 *
 * WHAT THIS IS. The proof that the approved capability works when an operator turns it on, executed through the **real production
 * build** and real Chromium rather than a unit harness. It installs a temporary synthetic configuration — a validated loopback
 * destination for the server-only webhook, a one-boolean analytics opt-in for the fixture Site, and the three closed contact fields
 * on the existing contact node — drives every state a visitor can meet, and then restores every byte it touched.
 *
 * WHAT IT PROVES. The interface is accessible and meaningful when delivery is off and when it is on; client and server validation
 * both refuse bad input; keyboard order and focus management follow the form; the pending state is observable; acceptance,
 * rejection, redirect refusal, failure and timeout each produce their own honest message; each submission reaches the receiver
 * exactly once; analytics fire once per Page view only when opted in and never when off; no cookie is written and no foreign host is
 * contacted; and the committed configuration is byte-identical afterwards.
 *
 * WHAT IT DOES NOT DO. It never contacts a real provider, never uses a real credential (the token is a synthetic literal), never
 * activates live tracking and never publishes anything. The loopback destination is reachable only through the documented test seam,
 * and the run asserts that seam is required: the same loopback URL is refused when the seam is off.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const ROOT = process.cwd();
const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 120_000;
const REQUEST_TIMEOUT_MS = 15_000;
const PAGE_PATH = "/en-001/components";
const CONTENT = resolve(ROOT, "deployment/efs/content/components.en-001.json");
const PRESENTATION = resolve(ROOT, "deployment/site.config.json");

/** A tiny reporter, matching the shape the other gates print. */
function createReport() {
  const passes = [];
  const failures = [];
  return {
    passes,
    failures,
    check(name, condition, detail) {
      if (condition) passes.push(name);
      else failures.push(detail === undefined ? name : `${name} — ${detail}`);
    },
  };
}

/** A free loopback port, asked of the platform rather than guessed. */
function freePort() {
  return new Promise((done, fail) => {
    const probe = createNetServer();
    probe.once("error", fail);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => done(port));
    });
  });
}

/**
 * The deterministic receiver.
 *
 * One path answers the contact webhook and one answers the analytics forward, and a control path switches the contact behaviour
 * between accept, reject, redirect, hang and oversized. Every request is recorded so the run can assert exactly-one and never-followed.
 */
function startReceiver() {
  const state = { mode: "accept", delayMs: 0, contact: [], analytics: [], redirected: 0 };
  const server = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const url = new URL(request.url ?? "/", `http://${HOST}`);
      if (url.pathname === "/control") {
        const parsed = JSON.parse(body.length === 0 ? "{}" : body);
        if (typeof parsed.mode === "string") state.mode = parsed.mode;
        if (typeof parsed.delayMs === "number") state.delayMs = parsed.delayMs;
        response.writeHead(200, { "content-type": "application/json" });
        response.end("{}");
        return;
      }
      if (url.pathname === "/stats") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ contact: state.contact, analytics: state.analytics, redirected: state.redirected }));
        return;
      }
      if (url.pathname === "/contact-accepted") {
        state.redirected += 1;
        response.writeHead(200, { "content-type": "application/json" });
        response.end("{}");
        return;
      }
      if (url.pathname === "/analytics") {
        state.analytics.push({ method: request.method, body, contentType: request.headers["content-type"] ?? "" });
        response.writeHead(204);
        response.end();
        return;
      }
      state.contact.push({
        method: request.method,
        body,
        contentType: request.headers["content-type"] ?? "",
        authorization: request.headers["authorization"] ?? "",
        host: request.headers["host"] ?? "",
      });
      const respond = () => {
        if (state.mode === "reject") {
          response.writeHead(422, { "content-type": "application/json" });
          response.end("{\"error\":\"no\"}");
          return;
        }
        if (state.mode === "redirect") {
          response.writeHead(302, { location: "/contact-accepted" });
          response.end();
          return;
        }
        if (state.mode === "oversized") {
          response.writeHead(200, { "content-type": "application/json" });
          response.end("x".repeat(4096));
          return;
        }
        // "hang" never answers: the connector's own bound must end the exchange.
        if (state.mode === "hang") return;
        response.writeHead(202, { "content-type": "application/json" });
        response.end("{}");
      };
      if (state.delayMs > 0) setTimeout(respond, state.delayMs);
      else respond();
    });
  });
  return new Promise((done, fail) => {
    server.once("error", fail);
    server.listen(0, HOST, () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      done({ server, port, state });
    });
  });
}

/** Start the production server with one environment, and wait until it answers the fixture Page. */
async function startServer(env) {
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [resolve(ROOT, "node_modules/next/dist/bin/next"), "start", "-H", HOST, "-p", String(port)],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production", ...env }, windowsHide: true },
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    output += String(chunk);
  });
  const base = `http://${HOST}:${port}`;
  const started = Date.now();
  for (;;) {
    if (Date.now() - started > READY_TIMEOUT_MS) throw new Error(`server did not start: ${output.slice(-2000)}`);
    try {
      const response = await fetch(`${base}${PAGE_PATH}`, { redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (response.status === 200) return { child, base, stop: () => child.kill() };
    } catch {
      // Not listening yet.
    }
    await delay(250);
  }
}

/** The SHA-256 of one file, so restoration can be asserted rather than assumed. */
function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/** Install the temporary synthetic contact fields, keeping the original bytes for the restore. */
function installContactFields() {
  const before = readFileSync(CONTENT);
  const document = JSON.parse(before.toString("utf8"));
  const node = document.sections.find((section) => section.module === "interaction.contact");
  if (node === undefined) throw new Error("the fixture Page has no contact node to extend");
  node.props = {
    heading: "Contact the fixture",
    description: "A synthetic contact surface used only by the U05 enabled-state proof.",
    fields: ["name", "email", "message"],
    submitLabel: "Send message",
  };
  writeFileSync(CONTENT, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  return before;
}

/** Install the one-boolean analytics opt-in for the fixture Site, keeping the original bytes for the restore. */
function installAnalyticsOptIn() {
  const before = readFileSync(PRESENTATION);
  const document = JSON.parse(before.toString("utf8"));
  const site = document.sites[0];
  if (site === undefined) throw new Error("the fixture presentation declares no Site");
  site.analytics = { enabled: true };
  writeFileSync(PRESENTATION, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  return before;
}


/** Record what one Page view asks for, so "exactly one request" and "no foreign host" are measured rather than assumed. */
function watch(page, base) {
  const record = { api: [], foreign: [], pageErrors: [] };
  const origin = new URL(base).origin;
  page.on("pageerror", (error) => record.pageErrors.push(String(error.message ?? error)));
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("data:") || url.startsWith("blob:")) return;
    const parsed = new URL(url);
    if (parsed.origin !== origin) record.foreign.push(parsed.origin);
    if (/^\/api\/(?:contact|analytics)$/u.test(parsed.pathname)) record.api.push(parsed.pathname);
  });
  return record;
}

/** The status line the visitor is shown, trimmed. */
function statusText(page) {
  return page.$eval(".uno-contact-status", (element) => (element.textContent ?? "").trim());
}

/** Wait until the status region carries a phrase, or return what it actually said. */
async function waitForStatus(page, phrase) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const text = await statusText(page);
    if (text.includes(phrase)) return text;
    await delay(100);
  }
  return statusText(page);
}

/** Ask the receiver what it has actually seen. */
async function stats(port) {
  const response = await fetch(`http://${HOST}:${port}/stats`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  return response.json();
}

/** Poll the receiver until one of its counters reaches the expected value. */
async function waitForCount(port, key, expected) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const snapshot = await stats(port);
    if (snapshot[key].length >= expected) return snapshot[key];
    await delay(100);
  }
  return (await stats(port))[key];
}

/** Switch the receiver's contact behaviour. */
async function setMode(port, mode, delayMs = 0) {
  await fetch(`http://${HOST}:${port}/control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode, delayMs }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

/** Fill the three fields with a valid submission. */
async function fillValid(page, suffix = "") {
  await page.fill("#uno-contact-name", `Ada${suffix}`);
  await page.fill("#uno-contact-email", "ada@example.com");
  await page.fill("#uno-contact-message", `A synthetic message${suffix}`);
}


/** One Page view in the shipped state: delivery off, analytics off, and the interface still truthful. */
async function runOffState(browser, receiver, report) {
  const server = await startServer({});
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const record = watch(page, server.base);
    await page.goto(`${server.base}${PAGE_PATH}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".uno-json-contact", { timeout: 15000 });

    report.check(
      "U05_OFF the shipped state still states delivery is off",
      (await page.$eval(".uno-json-contact-status", (element) => (element.textContent ?? "").trim())).includes("Delivery is switched off"),
    );
    report.check("U05_OFF no live form exists when delivery is unconfigured", (await page.$$(".uno-contact-form")).length === 0);
    report.check(
      "U05_OFF the inert controls are read-only and the submit is disabled and described",
      (await page.$$eval(".uno-json-contact-input", (elements) => elements.every((element) => element.readOnly))) &&
        (await page.$$eval(".uno-json-contact-submit", (elements) =>
          elements.every((element) => element.disabled && element.getAttribute("aria-describedby") !== null))),
    );
    report.check("U05_OFF a Page view asks for no submission or measurement", record.api.length === 0, record.api.join(", "));
    report.check("U05_OFF a Page view contacts no foreign host", record.foreign.length === 0, record.foreign.join(", "));
    report.check("U05_OFF a Page view raises no script error", record.pageErrors.length === 0, record.pageErrors.join("; "));

    const refusedContact = await fetch(`${server.base}/api/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@example.com", message: "x" }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    report.check(
      "U05_OFF an unconfigured submission is refused with no delivery claim",
      refusedContact.status === 503 && (await refusedContact.json()).status === "not-configured",
    );
    const refusedAnalytics = await fetch(`${server.base}/api/analytics`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "page-view", path: PAGE_PATH }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    report.check(
      "U05_OFF analytics accepts nothing when no destination is configured",
      refusedAnalytics.status === 503,
      String(refusedAnalytics.status),
    );
    await context.close();
  } finally {
    server.stop();
  }
  void receiver;
}

/** The documented test seam is the only way a loopback destination can be reached, and it is refused without it. */
async function runSeamRefusal(browser, receiver, report, webhookUrl, token) {
  const server = await startServer({
    UNO_CONTACT_WEBHOOK_URL: webhookUrl,
    UNO_CONTACT_WEBHOOK_HOSTS: HOST,
    UNO_CONTACT_WEBHOOK_TOKEN: token,
  });
  try {
    const before = (await stats(receiver.port)).contact.length;
    const response = await fetch(`${server.base}/api/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@example.com", message: "x" }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await response.json();
    report.check(
      "U05_SEAM a loopback destination is refused while the documented test seam is off",
      response.status === 503 && body.status === "unavailable" && body.reason === "destination:not-https",
      `${response.status} ${JSON.stringify(body)}`,
    );
    report.check("U05_SEAM no request reaches the refused destination", (await stats(receiver.port)).contact.length === before);
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${server.base}${PAGE_PATH}`, { waitUntil: "domcontentloaded" });
    report.check("U05_SEAM a refused configuration still renders no live form", (await page.$$(".uno-contact-form")).length === 0);
    await context.close();
  } finally {
    server.stop();
  }
}


/** The enabled run: every state a visitor can meet, with exactly-one delivery measured at the receiver. */
async function runEnabledState(browser, receiver, report, env) {
  const server = await startServer(env);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    const record = watch(page, server.base);
    await page.goto(`${server.base}${PAGE_PATH}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".uno-contact-form", { timeout: 15000 });

    report.check("U05_ON the configured Site renders the live contact form", (await page.$$(".uno-contact-form")).length === 1);
    const labels = await page.$$eval(".uno-contact-form label", (elements) => elements.map((element) => (element.textContent ?? "").trim()));
    report.check(
      "U05_ON every field has its own visible label, in the authored order",
      JSON.stringify(labels) === JSON.stringify(["Name", "Email", "Message"]),
      JSON.stringify(labels),
    );
    report.check(
      "U05_ON each control is required and described by a hint",
      await page.$$eval(".uno-contact-form input, .uno-contact-form textarea", (elements) =>
        elements.every((element) => element.required && element.getAttribute("aria-describedby") !== null)),
    );

    // Keyboard order: tabbing from the top must meet name, email, message and then the submit control.
    const order = [];
    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => {
        const active = document.activeElement;
        return active === null ? "" : active.id.length > 0 ? active.id : active.className;
      });
      if (id !== "" && !order.includes(id)) order.push(id);
    }
    const positions = ["uno-contact-name", "uno-contact-email", "uno-contact-message"].map((id) => order.indexOf(id));
    report.check(
      "U05_ON keyboard order reaches name, email and message in order",
      positions.every((position) => position >= 0) && positions[0] < positions[1] && positions[1] < positions[2],
      JSON.stringify(positions),
    );
    report.check(
      "U05_ON the submit control follows the last field in the tab order",
      order.indexOf("uno-contact-submit") > positions[2],
      JSON.stringify(order),
    );

    // Client-side validation: an obviously bad form never reaches the network.
    const beforeInvalid = (await stats(receiver.port)).contact.length;
    await page.click(".uno-contact-submit");
    await page.waitForSelector(".uno-contact-summary[role=\"alert\"]", { timeout: 5000 });
    let summaryFocused = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      summaryFocused = await page.evaluate(() => (document.activeElement?.className ?? "").includes("uno-contact-summary"));
      if (summaryFocused) break;
      await delay(50);
    }
    report.check("U05_ON an empty submit is refused locally and moves focus to the alert summary", summaryFocused);
    report.check(
      "U05_ON every refused field is marked invalid for assistive technology",
      (await page.$$(".uno-contact-form [aria-invalid=\"true\"]")).length === 3,
    );
    await page.fill("#uno-contact-name", "Ada");
    await page.fill("#uno-contact-email", "ada");
    await page.fill("#uno-contact-message", "x");
    await page.click(".uno-contact-submit");
    await delay(300);
    const invalidText = await page.$$eval(".uno-contact-summary", (elements) => (elements[0]?.textContent ?? "").trim());
    report.check(
      "U05_ON a malformed mailbox is refused locally, before any request",
      (await stats(receiver.port)).contact.length === beforeInvalid && invalidText.includes("need attention"),
      invalidText,
    );

    // Server-side validation: the endpoint refuses the same input even when the client is bypassed.
    const serverRefusal = await fetch(`${server.base}/api/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada", message: "x" }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    report.check(
      "U05_ON the endpoint refuses a malformed mailbox independently of the client",
      serverRefusal.status === 400 && (await serverRefusal.json()).reason === "contact:email-invalid",
    );
    report.check("U05_ON a refused request reaches no destination", (await stats(receiver.port)).contact.length === beforeInvalid);

    // Pending state, then honest acceptance, measured at the receiver.
    await setMode(receiver.port, "accept", 400);
    await fillValid(page);
    const beforeAccept = (await stats(receiver.port)).contact.length;
    await page.click(".uno-contact-submit");
    let sawPending = false;
    try {
      await page.locator('.uno-contact-submit[aria-busy="true"][disabled]').waitFor({ timeout: 3000 });
      sawPending = true;
    } catch {
      sawPending = false;
    }
    report.check("U05_ON the submit control reports its pending state", sawPending);
    const pendingText = await waitForStatus(page, "Sending this message now");
    report.check("U05_ON the pending state is announced through the status region", pendingText.includes("Sending this message now"), pendingText);
    const acceptedText = await waitForStatus(page, "reached the configured receiving endpoint");
    report.check(
      "U05_ON an accepted submission is described as reaching the configured endpoint",
      acceptedText.includes("reached the configured receiving endpoint"),
      acceptedText,
    );
    const accepted = await stats(receiver.port);
    report.check(
      "U05_ON exactly one request reaches the destination",
      accepted.contact.length === beforeAccept + 1,
      String(accepted.contact.length - beforeAccept),
    );
    const delivered = accepted.contact.at(-1);
    const deliveredBody = delivered === undefined ? null : JSON.parse(delivered.body);
    report.check(
      "U05_ON the request carries the synthetic credential and the three fields only",
      delivered?.authorization === "Bearer uno-synthetic-token" &&
        JSON.stringify(Object.keys(deliveredBody?.submission ?? {})) === JSON.stringify(["name", "email", "message"]),
      delivered?.authorization ?? "none",
    );
    report.check(
      "U05_ON the forwarded body carries no address, agent, cookie or clock",
      delivered !== undefined && !/cookie|user-agent|x-forwarded|\d{4}-\d{2}-\d{2}T/u.test(delivered.body),
    );
    report.check(
      "U05_ON a Page view makes exactly one measurement request",
      record.api.filter((entry) => entry === "/api/analytics").length === 1,
      record.api.join(", "),
    );
    report.check("U05_ON the collector forwards the single page-view event once", (await stats(receiver.port)).analytics.length === 1);
    report.check("U05_ON no cookie is written by the contact or analytics path", (await page.evaluate(() => document.cookie)) === "");
    report.check("U05_ON no foreign host is contacted", record.foreign.length === 0, record.foreign.join(", "));

    // Rejection, redirect refusal and an oversized answer each say what actually happened, exactly once.
    for (const [mode, label] of [["reject", "a provider rejection"], ["redirect", "a refused redirect"], ["oversized", "an oversized answer"]]) {
      await setMode(receiver.port, mode, 0);
      const before = (await stats(receiver.port)).contact.length;
      await fillValid(page, ` ${mode}`);
      await page.click(".uno-contact-submit");
      const text = await waitForStatus(page, "was not delivered");
      report.check(`U05_ON ${label} is reported honestly to the visitor`, text.includes("was not delivered"), text);
      report.check(`U05_ON ${label} produces exactly one request`, (await stats(receiver.port)).contact.length === before + 1);
      report.check(`U05_ON ${label} is never described as accepted`, !text.includes("reached the configured"));
    }
    report.check("U05_ON a redirect target is never followed", (await stats(receiver.port)).redirected === 0);

  } finally {
    await context.close();
    server.stop();
  }
}


/** A timeout is the connector's own bound doing its job, proven on a fresh process so no limiter budget is shared. */
async function runTimeoutState(browser, receiver, report, env) {
  const server = await startServer(env);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(`${server.base}${PAGE_PATH}`, { waitUntil: "load" });
    await page.waitForSelector(".uno-contact-form", { timeout: 15000 });
    await delay(300);
    await setMode(receiver.port, "hang", 0);
    const before = (await stats(receiver.port)).contact.length;
    await fillValid(page, " timeout");
    await page.click(".uno-contact-submit");
    const timedOut = await waitForStatus(page, "was not delivered");
    const delta = (await stats(receiver.port)).contact.length - before;
    report.check("U05_TIMEOUT a timeout is reported honestly to the visitor", timedOut.includes("was not delivered"), timedOut);
    report.check("U05_TIMEOUT a timeout produces exactly one request", delta === 1, String(delta));
    report.check("U05_TIMEOUT a timeout is never retried automatically", delta === 1, String(delta));
    report.check("U05_TIMEOUT a timed-out submission is not described as accepted", !timedOut.includes("reached the configured"));
  } finally {
    await context.close();
    server.stop();
  }
}

/** The bounded limiter refuses the sixth rapid submission from one caller, and a restart starts a fresh budget. */
async function runLimiterState(receiver, report, env) {
  const server = await startServer(env);
  try {
    await setMode(receiver.port, "accept", 0);
    const before = (await stats(receiver.port)).contact.length;
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(`${server.base}/api/contact`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.200" },
        body: JSON.stringify({ name: "Ada", email: "ada@example.com", message: "limiter probe" }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      statuses.push(response.status);
    }
    report.check(
      "U05_LIMITER five rapid submissions are accepted and the sixth is refused",
      statuses.slice(0, 5).every((status) => status === 202) && statuses[5] === 429,
      JSON.stringify(statuses),
    );
    report.check(
      "U05_LIMITER the refused submission never reaches the destination",
      (await stats(receiver.port)).contact.length - before === 5,
      String((await stats(receiver.port)).contact.length - before),
    );
  } finally {
    server.stop();
  }
}

/** The analytics opt-in is per Site and per Page view: off elsewhere, once here, and restorable. */
async function runAnalyticsAndRestore(browser, receiver, report, env, contentBefore, presentationBefore, digests) {
  const server = await startServer(env);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const baseline = (await stats(receiver.port)).analytics.length;
  try {
    const page = await context.newPage();
    const record = watch(page, server.base);
    await page.goto(`${server.base}${PAGE_PATH}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".uno-contact-form", { timeout: 15000 });
    const firstForwarded = await waitForCount(receiver.port, "analytics", baseline + 1);

    report.check(
      "U05_ANALYTICS an opted-in Page view sends exactly one page-view",
      record.api.filter((entry) => entry === "/api/analytics").length === 1,
      record.api.join(", "),
    );
    const forwarded = firstForwarded;
    report.check(
      "U05_ANALYTICS the collector forwards exactly one event",
      forwarded.length === baseline + 1,
      `${forwarded.length} vs ${baseline + 1}`,
    );
    report.check(
      "U05_ANALYTICS the event is one name and one bounded Path, with nothing identifying",
      forwarded[0]?.body === JSON.stringify({ event: "page-view", path: PAGE_PATH }),
      forwarded[0]?.body ?? "none",
    );
    report.check("U05_ANALYTICS no cookie is set by measurement", (await page.evaluate(() => document.cookie)) === "");

    // The opt-in is a Site-wide declaration: a second Page of the same Site beacons once, and only once.
    const other = await context.newPage();
    const otherRecord = watch(other, server.base);
    await other.goto(`${server.base}/en-001/about`, { waitUntil: "domcontentloaded" });
    await waitForCount(receiver.port, "analytics", baseline + 2);
    report.check(
      "U05_ANALYTICS every Page of the opted-in Site sends exactly one measurement",
      otherRecord.api.filter((entry) => entry === "/api/analytics").length === 1,
      otherRecord.api.join(", "),
    );
    await other.close();

    // A reload is a new Page view, never a duplicate of the previous one.
    await page.reload({ waitUntil: "domcontentloaded" });
    const afterReload = await waitForCount(receiver.port, "analytics", baseline + 3);
    report.check(
      "U05_ANALYTICS a reload is a second Page view, not a duplicate of the first",
      afterReload.length === baseline + 3,
      `${afterReload.length} vs ${baseline + 3}`,
    );
  } finally {
    await context.close();
    server.stop();
  }

  // --- Restoration: every byte the run touched goes back, and the committed build stops carrying the fixture ----------------
  writeFileSync(CONTENT, contentBefore);
  writeFileSync(PRESENTATION, presentationBefore);
  report.check(
    "U05_RESTORE the fixture Page is byte-identical after the enabled run",
    digest(CONTENT) === digests.content,
    digest(CONTENT),
  );
  report.check(
    "U05_RESTORE the presentation is byte-identical after the enabled run",
    digest(PRESENTATION) === digests.presentation,
    digest(PRESENTATION),
  );

  const after = await startServer({});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const record = watch(page, after.base);
    await page.goto(`${after.base}${PAGE_PATH}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".uno-json-contact", { timeout: 15000 });
    report.check("U05_RESTORE the restored configuration renders the honest off state again", (await page.$$(".uno-contact-form")).length === 0);
    report.check("U05_RESTORE the restored configuration asks for nothing", record.api.length === 0, record.api.join(", "));
    await context.close();
  } finally {
    after.stop();
  }
}

/** Run the whole gate, print the report and exit non-zero on any failure. */
export async function main() {
  const report = createReport();
  const receiver = await startReceiver();
  const contentBefore = readFileSync(CONTENT);
  const presentationBefore = readFileSync(PRESENTATION);
  const digests = { content: digest(CONTENT), presentation: digest(PRESENTATION) };
  let browser;
  try {
    installContactFields();
    installAnalyticsOptIn();
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ args: ["--no-sandbox"] });

    await runOffState(browser, receiver, report);
    await runSeamRefusal(browser, receiver, report, `http://${HOST}:${receiver.port}/contact`, "uno-synthetic-token");
    await runEnabledState(browser, receiver, report, {
      UNO_CONTACT_WEBHOOK_URL: `http://${HOST}:${receiver.port}/contact`,
      UNO_CONTACT_WEBHOOK_HOSTS: HOST,
      UNO_CONTACT_WEBHOOK_TOKEN: "uno-synthetic-token",
      UNO_CONTACT_WEBHOOK_TEST_LOOPBACK: "1",
      UNO_CONTACT_WEBHOOK_TIMEOUT_MS: "1200",
      UNO_ANALYTICS_FORWARD_URL: `http://${HOST}:${receiver.port}/analytics`,
      UNO_ANALYTICS_FORWARD_HOSTS: HOST,
      UNO_ANALYTICS_TEST_LOOPBACK: "1",
    });
    await runTimeoutState(browser, receiver, report, {
      UNO_CONTACT_WEBHOOK_URL: `http://${HOST}:${receiver.port}/contact`,
      UNO_CONTACT_WEBHOOK_HOSTS: HOST,
      UNO_CONTACT_WEBHOOK_TEST_LOOPBACK: "1",
      UNO_CONTACT_WEBHOOK_TIMEOUT_MS: "1200",
    });
    await runLimiterState(receiver, report, {
      UNO_CONTACT_WEBHOOK_URL: `http://${HOST}:${receiver.port}/contact`,
      UNO_CONTACT_WEBHOOK_HOSTS: HOST,
      UNO_CONTACT_WEBHOOK_TEST_LOOPBACK: "1",
    });
    await runAnalyticsAndRestore(browser, receiver, report, {
      UNO_CONTACT_WEBHOOK_URL: `http://${HOST}:${receiver.port}/contact`,
      UNO_CONTACT_WEBHOOK_HOSTS: HOST,
      UNO_CONTACT_WEBHOOK_TEST_LOOPBACK: "1",
      UNO_ANALYTICS_FORWARD_URL: `http://${HOST}:${receiver.port}/analytics`,
      UNO_ANALYTICS_FORWARD_HOSTS: HOST,
      UNO_ANALYTICS_TEST_LOOPBACK: "1",
    }, contentBefore, presentationBefore, digests);
  } finally {
    writeFileSync(CONTENT, contentBefore);
    writeFileSync(PRESENTATION, presentationBefore);
    await browser?.close();
    receiver.server.close();
  }

  for (const name of report.passes) console.log(`  PASS  ${name}`);
  for (const name of report.failures) console.log(`FAIL  ${name}`);
  console.log(`verify-u05-enabled-states: ${report.passes.length} passed, ${report.failures.length} failed`);
  if (report.failures.length > 0) process.exitCode = 1;
}

await main();
