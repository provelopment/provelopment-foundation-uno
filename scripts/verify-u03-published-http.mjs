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
 * SAFETY. The two committed declaration files are backed up to ignored task scratch, replaced, and restored in an
 * unconditional `finally` that verifies SHA-256 and byte equality; the five fixture sources are created only when
 * physically absent and removed in the same `finally`. A failed build or HTTP check therefore still restores. If
 * restoration cannot be proven the script fails loudly and never reports success.
 */

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { registerHooks } from "node:module";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Node prints a "typeless package.json" notice for the repository's TypeScript modules. It is expected and benign;
// this handler keeps the gate's own output readable without hiding a real warning from another module.
process.on("warning", () => {});

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
  [MANIFEST, "ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0"],
  [SELECTION, "4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c"],
]);

/** The five fixture sources: created only if absent, removed again in the same `finally`. */
const FIXTURE_SOURCES = Object.freeze([
  `${CONTENT}/wo029-home.de-de.md`,
  `${CONTENT}/wo029-about.en-001.md`,
  `${CONTENT}/wo029-about.de-de.md`,
  `${CONTENT}/wo029-draft.en-001.md`,
  `${CONTENT}/wo029-hidden.en-001.json`,
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

/** A collision-resistant, task-owned scratch directory under the ignored `.temp/`. */
function scratchDir() {
  const name = `.temp/wo029-published-${process.pid}-${Date.now().toString(36)}`;
  const absolute = resolve(ROOT, name);
  mkdirSync(absolute, { recursive: true });
  return absolute;
}

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

/** The five short, original fixture documents. ASCII only, no HTML, no links, no images. */
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
]);

/** The four public addresses the accepted discovery plan must advertise, and their authored titles. */
const PUBLIC_PAGES = Object.freeze([
  { pathname: "/en-001", locale: "en-001", title: "Foundation Uno", canonical: `${TEST_BASE}/en-001` },
  { pathname: "/de-de", locale: "de-DE", title: "Startseite", canonical: `${TEST_BASE}/de-de` },
  {
    pathname: "/en-001/about",
    locale: "en-001",
    title: "About this fixture",
    canonical: `${TEST_BASE}/en-001/about`,
  },
  {
    pathname: "/de-de/about",
    locale: "de-DE",
    title: "Ueber diese Testseite",
    canonical: `${TEST_BASE}/de-de/about`,
  },
]);

/** Every address the fixture must refuse, with a real 404 and no advertised link. */
const REFUSED_PAGES = Object.freeze([
  "/en-001/draft",
  "/de-de/draft",
  "/en-001/hidden",
  "/de-de/hidden",
  "/en-001/wo029-about",
  "/xx-001",
  "/en-001/does-not-exist",
  "/en-us",
  "/en-001/about/extra",
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
    body,
  };
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
      "the discovery plan holds exactly the four public entries",
      discovery.plan.sitemapUrls.length === 4,
      discovery.plan.sitemapUrls.join(","),
    );
    check(
      "the discovery plan never advertises draft or unlisted content",
      !discovery.plan.sitemapUrls.some((url) => url.includes("/draft") || url.includes("/hidden")),
    );
  }

  const addresses = await listUnoServingAddresses();
  check("the build-time address set holds the four Pages and the alias", addresses.length === 5, `${addresses.length}`);
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
  check("the committed Home Markdown is present", existsSync(resolve(ROOT, `${CONTENT}/home.en-001.md`)));

  const staged = spawnSync("git", ["--no-optional-locks", "diff", "--cached", "--name-only"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("nothing is staged before the fixture", staged.stdout.trim() === "", staged.stdout.trim());
  const deployment = spawnSync("git", ["--no-optional-locks", "status", "--porcelain=v1", "--", "deployment"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check(
    "no committed deployment input is modified before the fixture",
    deployment.stdout.trim() === "",
    deployment.stdout.trim(),
  );
  const active = spawnSync("git", ["check-ignore", "--", ".documents/WIP/workorder-active.md"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("the private ACTIVE stays ignored", active.status === 0);
}

/** Replace the two declarations and create the five fixture sources. */
function installFixture() {
  writeFileSync(resolve(ROOT, MANIFEST), `${JSON.stringify(FIXTURE_MANIFEST, null, 2)}\n`, "utf8");
  writeFileSync(resolve(ROOT, SELECTION), `${JSON.stringify(FIXTURE_SELECTION, null, 2)}\n`, "utf8");
  for (const [relativePath, contents] of FIXTURE_CONTENT) {
    writeFileSync(resolve(ROOT, relativePath), contents, "utf8");
  }
  check("the fixture manifest is installed", sha256Of(MANIFEST) !== PINNED_DECLARATIONS.get(MANIFEST));
  check("the fixture declaration is installed", sha256Of(SELECTION) !== PINNED_DECLARATIONS.get(SELECTION));
}

/** Restore the exact original bytes and remove only the fixture-created sources. Never throws. */
function restore(scratch) {
  const problems = [];
  for (const [relativePath] of PINNED_DECLARATIONS) {
    const backup = join(scratch, relativePath.replace(/[\\/]/gu, "__"));
    try {
      writeFileSync(resolve(ROOT, relativePath), readFileSync(backup));
    } catch {
      problems.push(`restore:${relativePath}`);
    }
  }
  for (const relativePath of FIXTURE_SOURCES) {
    try {
      rmSync(resolve(ROOT, relativePath), { force: true });
    } catch {
      problems.push(`remove:${relativePath}`);
    }
  }
  for (const [relativePath, digest] of PINNED_DECLARATIONS) {
    if (sha256Of(relativePath) !== digest) problems.push(`digest:${relativePath}`);
    if (statSync(resolve(ROOT, relativePath)).size === 0) problems.push(`empty:${relativePath}`);
  }
  for (const relativePath of FIXTURE_SOURCES) {
    if (existsSync(resolve(ROOT, relativePath))) problems.push(`leftover:${relativePath}`);
  }
  return problems;
}

/** Back the two declarations up into task-owned scratch before anything is replaced. */
function backup(scratch) {
  for (const [relativePath] of PINNED_DECLARATIONS) {
    const backupPath = join(scratch, relativePath.replace(/[\\/]/gu, "__"));
    writeFileSync(backupPath, readFileSync(resolve(ROOT, relativePath)));
    check(
      `the backup of ${relativePath} is byte-identical`,
      createHash("sha256").update(readFileSync(backupPath)).digest("hex") === PINNED_DECLARATIONS.get(relativePath),
    );
  }
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
  check("/sitemap.xml lists exactly the four public URLs", locations.length === 4, locations.join(","));
  for (const page of PUBLIC_PAGES) {
    check(`/sitemap.xml lists ${page.canonical}`, locations.includes(page.canonical));
  }
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

  const scratch = scratchDir();
  let child = null;
  let port = 0;
  let installed = false;
  let restored = false;

  try {
    preflight();
    if (failures.length > 0) {
      process.stderr.write("verify-u03-published-http: preflight refused; nothing was changed.\n");
      return 1;
    }

    backup(scratch);
    installFixture();
    installed = true;

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
    const problems = installed ? restore(scratch) : [];
    restored = problems.length === 0;
    for (const problem of problems) {
      failures.push(problem);
      process.stdout.write(`  FAIL  ${problem}\n`);
    }
    rmSync(scratch, { recursive: true, force: true });
    process.stdout.write(
      restored
        ? "  PASS  the committed declarations and sources are restored byte-for-byte\n"
        : "  FAIL  restoration could not be proven\n",
    );
    if (restored) passes.push("restoration");
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

  const u01 = await runChild([resolve(ROOT, "scripts/verify-u01-http.mjs")], BUILD_TIMEOUT_MS);
  check("the original U01 HTTP gate still passes", u01.code === 0, `exit ${u01.code}`);

  const u03 = await runChild([resolve(ROOT, "scripts/verify-u03-http.mjs")], BUILD_TIMEOUT_MS);
  check("the original U03 fail-closed gate still passes", u03.code === 0, `exit ${u03.code}`);

  const status = spawnSync(
    "git",
    ["--no-optional-locks", "status", "--porcelain=v1", "--", "deployment"],
    { cwd: ROOT, encoding: "utf8" },
  );
  check(
    "no committed deployment input is modified after restoration",
    status.stdout.trim() === "",
    status.stdout.trim(),
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
