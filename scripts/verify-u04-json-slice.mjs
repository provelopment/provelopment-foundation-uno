/**
 * Foundation Uno — the U04 JSON Page vertical-slice gate (`UNO-WO-035 / R01`).
 *
 * WHAT THIS IS. One end-to-end proof that the version-1 JSON Page document is really served by the real Next.js
 * production build: it installs a synthetic, exclusively-claimed publication fixture through the accepted,
 * immutable U03 transaction helper, validates it with the real loader/planner, builds, starts the production
 * server on loopback, and checks the Page over real HTTP and a real Chromium DOM. It then restores the committed
 * unpublished declarations byte for byte, rebuilds them, and re-runs the existing fail-closed gates.
 *
 * WHAT THIS IS NOT. No provider, no network beyond loopback, no deployment, no published Page, no change to the
 * committed manifest, selection, Home Markdown or demonstration. Every fixture source is task-owned and removed
 * again; the committed declarations are pinned by SHA-256 before and after.
 *
 * FAIL-CLOSED. A refused fixture, an unclean build, a missing browser, a failed assertion or an unproven
 * restoration is a failure of this gate — never a skip, never a silent pass.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { registerHooks } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { prepareUnoU03FixtureTransaction } from "./uno-u03-fixture-transaction.mjs";

// The repository's TypeScript uses extensionless relative imports; this hook resolves `.ts` for relative
// specifiers only, so this gate calls the REAL validator, planner and serving composition.
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
const SHUTDOWN_TIMEOUT_MS = 10_000;

const ROOT = process.cwd();
const MANIFEST = "deployment/efs/manifest.json";
const SELECTION = "deployment/uno.config.json";
const CONTENT = "deployment/efs/content";
const TEST_BASE = "http://localhost:3000";
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

/** The committed declaration digests this gate requires before it will touch anything. */
const PINNED_DECLARATIONS = new Map([
  [MANIFEST, "ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0"],
  [SELECTION, "4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c"],
]);

/** The eighteen synthetic sources: created only if absent, removed again in the same `finally`. */
const FIXTURE_SOURCES = Object.freeze([
  `${CONTENT}/wo035-home.en-001.json`,
  `${CONTENT}/wo035-home.de-de.json`,
  `${CONTENT}/wo035-components.en-001.json`,
  `${CONTENT}/wo035-components.de-de.json`,
  `${CONTENT}/wo035-notes.en-001.md`,
  `${CONTENT}/wo035-preview.en-001.json`,
  `${CONTENT}/wo035-unsupported.en-001.json`,
  `${CONTENT}/wo035-unknown.en-001.json`,
  `${CONTENT}/wo035-version.en-001.json`,
  `${CONTENT}/wo035-extrakey.en-001.json`,
  `${CONTENT}/wo035-unsafe.en-001.json`,
  `${CONTENT}/wo035-target.en-001.json`,
  `${CONTENT}/wo035-duplicate.en-001.json`,
  `${CONTENT}/wo035-deep.en-001.json`,
  `${CONTENT}/wo035-wide.en-001.json`,
  `${CONTENT}/wo035-broken.en-001.json`,
  `${CONTENT}/wo035-broken.en-001.md`,
  `${CONTENT}/wo035-draft.en-001.md`,
  `${CONTENT}/wo035-other.en-001.json`,
]);

const failures = [];
const passes = [];

/** Record one assertion. A failure is always printed; a pass never hides a failure. */
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

/** One valid two-card article grid: the listing pattern this slice is proved on. */
function componentSections(locale) {
  const german = locale === "de-DE";
  return [
    {
      id: "listing",
      module: "layout.grid",
      props: { columns: 2, itemSemantics: "article" },
      children: [
        {
          id: "card-one",
          module: "layout.stack",
          props: { gap: "tight" },
          children: [
            { id: "card-one-title", module: "content.heading", props: { text: german ? "Erste Karte" : "Card one", level: 2 } },
            {
              id: "card-one-body",
              module: "content.prose",
              props: { text: german ? "Erster Kartentext." : "First card body text." },
            },
          ],
        },
        {
          id: "card-two",
          module: "layout.stack",
          props: { gap: "tight" },
          children: [
            { id: "card-two-title", module: "content.heading", props: { text: german ? "Zweite Karte" : "Card two", level: 2 } },
            {
              id: "card-two-body",
              module: "content.prose",
              props: { text: german ? "Zweiter Kartentext." : "Second card body text." },
            },
          ],
        },
      ],
    },
    {
      id: "listing-actions",
      module: "content.actions",
      props: { items: [{ label: german ? "Zur ersten Karte" : "Jump to card one", targetId: "card-one" }] },
    },
  ];
}

/** The fixture documents. Every one is original, synthetic and ASCII-safe except the German umlauts. */
const JSON_DOCUMENTS = Object.freeze({
  homeEn: {
    version: 1,
    title: "Uno listing fixture",
    description: "A synthetic Home Page served from a validated JSON document.",
    sections: [
      { id: "intro", module: "content.heading", props: { text: "Published JSON Home", level: 2 } },
      { id: "body", module: "content.prose", props: { text: "This body is inert plain text from a version-1 document." } },
      { id: "links", module: "content.actions", props: { items: [{ label: "Back to the heading", targetId: "intro" }] } },
    ],
  },
  homeDe: {
    version: 1,
    title: "Uno Listenseite",
    description: "Eine synthetische Startseite aus einem geprueften JSON-Dokument.",
    sections: [
      { id: "intro", module: "content.heading", props: { text: "Veroeffentlichte JSON-Startseite", level: 2 } },
      { id: "body", module: "content.prose", props: { text: "Dieser Text ist unveraenderlicher Klartext." } },
    ],
  },
  componentsEn: { version: 1, title: "Component listing", sections: componentSections("en-001") },
  componentsDe: { version: 1, title: "Komponentenliste", sections: componentSections("de-DE") },
  preview: {
    version: 1,
    title: "Direct preview",
    visibility: "unlisted",
    sections: [{ id: "body", module: "content.prose", props: { text: "This Page is reachable only by its exact address." } }],
  },
  unsupported: {
    version: 1,
    title: "Unrenderable module",
    sections: [{ id: "figure", module: "media.image", props: {} }],
  },
  unknown: {
    version: 1,
    title: "Unknown module",
    sections: [{ id: "band", module: "layout.marquee", props: {} }],
  },
  versionUnsupported: {
    version: 2,
    title: "Unsupported version",
    sections: [{ id: "body", module: "content.prose", props: { text: "Never rendered." } }],
  },
  extraKey: {
    version: 1,
    title: "Extra authority",
    canonical: `${TEST_BASE}/en-001/extrakey`,
    sections: [{ id: "body", module: "content.prose", props: { text: "Never rendered." } }],
  },
  unsafeLink: {
    version: 1,
    title: "Unsafe action",
    sections: [{ id: "go", module: "content.actions", props: { items: [{ label: "Escape", targetId: "../escape" }] } }],
  },
  unresolvedTarget: {
    version: 1,
    title: "Dead action",
    sections: [{ id: "go", module: "content.actions", props: { items: [{ label: "Nowhere", targetId: "missing" }] } }],
  },
  duplicateId: {
    version: 1,
    title: "Duplicate identifier",
    sections: [
      { id: "same", module: "content.prose", props: { text: "One." } },
      { id: "same", module: "content.prose", props: { text: "Two." } },
    ],
  },
  tooDeep: {
    version: 1,
    title: "Too deep",
    sections: [
      {
        id: "d1",
        module: "layout.stack",
        props: {},
        children: [
          {
            id: "d2",
            module: "layout.stack",
            props: {},
            children: [
              {
                id: "d3",
                module: "layout.stack",
                props: {},
                children: [
                  {
                    id: "d4",
                    module: "layout.stack",
                    props: {},
                    children: [{ id: "leaf", module: "content.prose", props: { text: "Leaf." } }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  tooWide: {
    version: 1,
    title: "Too wide",
    sections: Array.from({ length: 32 }, (_value, index) => ({
      id: `stack-${index}`,
      module: "layout.stack",
      props: {},
      children: Array.from({ length: 4 }, (_child, child) => ({
        id: `node-${index}-${child}`,
        module: "content.prose",
        props: { text: "Node." },
      })),
    })),
  },
  other: {
    version: 1,
    title: "Archive Site Page",
    sections: [{ id: "body", module: "content.prose", props: { text: "Never served by the selected Site." } }],
  },
});

/** The three Markdown sources: one valid Page, one alternative under malformed JSON, one draft. */
const MARKDOWN_DOCUMENTS = Object.freeze({
  notes: "# Notes\n\nA valid Markdown Page next to the JSON Pages.\n",
  brokenAlternative: "# Broken alternative\n\nThis Markdown must never rescue the malformed JSON.\n",
  draft: "# Draft\n\nNever published.\n",
});

/** SHA-256 of one repository-relative file, or `null` when it cannot be read. */
function sha256Of(relativePath) {
  try {
    return createHash("sha256").update(readFileSync(resolve(ROOT, relativePath))).digest("hex");
  } catch {
    return null;
  }
}

/** One representation of one locale. */
const representation = (locale, sources) => ({ locale, sources });
const jsonSource = (path) => ({ kind: "json", path });
const markdownSource = (path) => ({ kind: "markdown", path });

/** Every fixture Page this gate declares. Publication is the manifest's own gate, never the document's. */
function fixturePages() {
  const published = (id, route, representations) => ({ id, route, publication: "published", representations });
  return [
    published("home", ["home"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-home.en-001.json`)]),
      representation("de-DE", [jsonSource(`${CONTENT}/wo035-home.de-de.json`)]),
    ]),
    published("components", ["programmes", "components"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-components.en-001.json`)]),
      representation("de-DE", [jsonSource(`${CONTENT}/wo035-components.de-de.json`)]),
    ]),
    published("notes", ["notes"], [representation("en-001", [markdownSource(`${CONTENT}/wo035-notes.en-001.md`)])]),
    published("preview", ["preview"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-preview.en-001.json`)])]),
    published("unsupported", ["unsupported"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-unsupported.en-001.json`)]),
    ]),
    published("unknown", ["unknown"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-unknown.en-001.json`)])]),
    published("version", ["version"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-version.en-001.json`)])]),
    published("extrakey", ["extrakey"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-extrakey.en-001.json`)])]),
    published("unsafe", ["unsafe"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-unsafe.en-001.json`)])]),
    published("target", ["target"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-target.en-001.json`)])]),
    published("duplicate", ["duplicate"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-duplicate.en-001.json`)]),
    ]),
    published("deep", ["deep"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-deep.en-001.json`)])]),
    published("wide", ["wide"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-wide.en-001.json`)])]),
    published("broken", ["broken"], [
      representation("en-001", [
        jsonSource(`${CONTENT}/wo035-broken.en-001.json`),
        markdownSource(`${CONTENT}/wo035-broken.en-001.md`),
      ]),
    ]),
    {
      id: "draft",
      route: ["draft"],
      publication: "draft",
      representations: [representation("en-001", [markdownSource(`${CONTENT}/wo035-draft.en-001.md`)])],
    },
  ];
}

/** The fixture manifest: one Entity, the selected Site plus one unselected Site for the wrong-Site refusal. */
function fixtureManifest() {
  return {
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
                pages: fixturePages(),
              },
              {
                id: "archive",
                locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
                pages: [
                  {
                    id: "other",
                    route: ["other"],
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(`${CONTENT}/wo035-other.en-001.json`)])],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** The fixture selection: a test-only canonical base, the declared short alias and the selected Site. */
function fixtureSelection() {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
    languagePreferences: { en: "en-001" },
    base: { canonical: TEST_BASE, aliases: [] },
  };
}

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

/** Stop exactly the child this gate spawned, and wait for it, on every path. */
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
    signal: AbortSignal.timeout(15_000),
    headers: { "user-agent": "uno-u04-gate/1.0", ...(extraHeaders ?? {}) },
  });
  const body = await response.text();
  return { status: response.status, location: response.headers.get("location"), body };
}

/** Build markers that must never appear in a clean production build. */
const BUILD_WARNING_MARKERS = Object.freeze([
  "Warning:",
  "Failed to compile",
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

/** Run the bounded trace inspector against one real build. */
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
    report === null ? `exit ${result.status}` : report.reasons.join(", "),
  );
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

/** The public Pages this fixture declares, and the exact canonical each one must advertise. */
const PUBLIC_PAGES = Object.freeze([
  { pathname: "/en-001", locale: "en-001", title: "Uno listing fixture", canonical: `${TEST_BASE}/en-001` },
  { pathname: "/de-de", locale: "de-DE", title: "Uno Listenseite", canonical: `${TEST_BASE}/de-de` },
  {
    pathname: "/en-001/programmes/components",
    locale: "en-001",
    title: "Component listing",
    canonical: `${TEST_BASE}/en-001/programmes/components`,
  },
  {
    pathname: "/de-de/programmes/components",
    locale: "de-DE",
    title: "Komponentenliste",
    canonical: `${TEST_BASE}/de-de/programmes/components`,
  },
  { pathname: "/en-001/notes", locale: "en-001", title: "Notes", canonical: `${TEST_BASE}/en-001/notes` },
]);

/** Every address this fixture must refuse with a real 404, and the plan-level reason it is refused. */
const REFUSED_PAGES = Object.freeze([
  { pathname: "/en-001/unsupported", reason: "renderer-unavailable" },
  { pathname: "/en-001/unknown", reason: "unknown-module" },
  { pathname: "/en-001/version", reason: "unsupported-version" },
  { pathname: "/en-001/extrakey", reason: "unexpected-key" },
  { pathname: "/en-001/unsafe", reason: "unsafe-link" },
  { pathname: "/en-001/target", reason: "unresolved-target" },
  { pathname: "/en-001/duplicate", reason: "duplicate-section-id" },
  { pathname: "/en-001/deep", reason: "too-deep" },
  { pathname: "/en-001/wide", reason: "too-many-nodes" },
  { pathname: "/en-001/broken", reason: "malformed-preferred-json" },
  { pathname: "/en-001/draft", reason: "draft" },
  { pathname: "/en-001/other", reason: "wrong-site" },
  { pathname: "/fr-fr", reason: "undeclared-locale" },
  { pathname: "/de-de/notes", reason: "missing-locale" },
  { pathname: "/en-001/missing", reason: "unknown-page" },
  { pathname: "/en-001/NOTES", reason: "case-mismatch" },
]);

/**
 * Validate the installed fixture with the REAL loader, planner and serving composition, before any build.
 *
 * A fixture that does not behave here is never built, so a build failure can never be confused with a rule
 * failure.
 */
async function validateFixtureInProcess() {
  const { loadUnoCandidateSource } = await import("../src/adapters/efs/uno-confined-source-reader.ts");
  const { planUnoPublishedPage } = await import("../src/application/plan-uno-published-page.ts");
  const { listUnoServingAddresses, planUnoServingDiscovery } = await import("../src/config/uno-serving.ts");
  const { readUnoPageDocument } = await import("../src/core/page-document.ts");

  const manifest = JSON.parse(readFileSync(resolve(ROOT, MANIFEST), "utf8"));
  const selection = JSON.parse(readFileSync(resolve(ROOT, SELECTION), "utf8"));
  const base = { canonical: TEST_BASE, aliases: [] };

  /** Plan one address exactly as the server does. */
  const plan = async (pathname) => {
    const loaded = await loadUnoCandidateSource({ repoRoot: ROOT, pathname });
    if (!loaded.accepted) return { accepted: false, stage: "load" };
    const planned = planUnoPublishedPage({
      manifest,
      selection,
      base,
      pathname,
      loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
    });
    return planned.accepted ? { accepted: true, stage: "plan", planned } : { accepted: false, stage: "plan" };
  };

  for (const page of PUBLIC_PAGES) {
    const outcome = await plan(page.pathname);
    check(`the fixture planner accepts ${page.pathname}`, outcome.accepted === true);
    if (!outcome.accepted) continue;
    check(
      `${page.pathname} carries a validated JSON document or a Markdown body`,
      outcome.planned.document.pageDocument !== undefined || outcome.planned.document.markdownBody !== undefined,
    );
    check(`${page.pathname} canonical is exact`, outcome.planned.delivery.canonicalUrl === page.canonical);
  }

  const preview = await plan("/en-001/preview");
  check(
    "the unlisted Page plans as published and unlisted",
    preview.accepted === true && preview.planned.delivery.unlisted === true,
  );
  if (preview.accepted) {
    check("the unlisted Page carries its validated document", preview.planned.document.pageDocument !== undefined);
    check("the unlisted Page is not indexable", preview.planned.delivery.indexable === false);
    check("the unlisted Page is excluded from the sitemap", preview.planned.delivery.eligible.sitemap === false);
    check("the unlisted Page advertises no alternate", preview.planned.delivery.eligible.hreflang === false);
  }

  for (const refused of REFUSED_PAGES) {
    const outcome = await plan(refused.pathname);
    const refusedThere = outcome.accepted === false || outcome.planned.document.pageDocument === undefined;
    check(`the fixture planner refuses ${refused.pathname} (${refused.reason})`, refusedThere);
  }

  const discovery = await planUnoServingDiscovery();
  check("the fixture discovery plan is accepted", discovery.status === "planned");
  if (discovery.status === "planned") {
    const urls = discovery.plan.sitemapUrls;
    check("the fixture discovery plan holds exactly the five public entries", urls.length === 5, urls.join(", "));
    for (const page of PUBLIC_PAGES) {
      check(`discovery advertises ${page.canonical}`, urls.includes(page.canonical));
    }
    check(
      "discovery never advertises an unlisted, draft or refused Page",
      !urls.some((url) =>
        /\/(preview|draft|unsupported|unknown|version|extrakey|unsafe|target|duplicate|deep|wide|broken|other|absent)$/u.test(url),
      ),
    );
  }

  const addresses = await listUnoServingAddresses();
  const keys = addresses.map((address) => `${address.locale}/${address.segments.join("/")}`);
  check("the build enumerates the unlisted Page so its exact address can be served", keys.includes("en-001/preview"));
  check("the build never enumerates a refused Page", !keys.includes("en-001/unsupported") && !keys.includes("en-001/broken"));

  // The reserved Home rule cannot be expressed over HTTP without sacrificing the positive Home, so it is proved
  // here against the real validator with the real reserved-Home flag.
  const unlistedHome = readUnoPageDocument({ ...JSON_DOCUMENTS.homeEn, visibility: "unlisted" }, { reservedHome: true });
  check(
    "the reserved Home refuses an unlisted JSON document",
    unlistedHome.accepted === false && unlistedHome.reason === "document:home-cannot-be-unlisted",
  );
}

/** Count non-overlapping occurrences of one regular expression in a string. */
function countOf(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

/** Assert one served public Page over real HTTP. */
async function assertPublicPage(base, entry) {
  const response = await request(`${base}${entry.pathname}`);
  if (!check(`${entry.pathname} answers 200`, response.status === 200, `status ${response.status}`)) return;
  const body = response.body;

  check(`${entry.pathname} declares the truthful html lang`, body.includes(`<html lang="${entry.locale}"`));
  check(`${entry.pathname} renders exactly one h1`, countOf(body, /<h1[\s>]/gu) === 1);
  check(`${entry.pathname} renders its own title`, body.includes(`>${entry.title}</h1>`));
  check(`${entry.pathname} declares the exact canonical URL`, body.includes(`<link rel="canonical" href="${entry.canonical}"/>`));
  check(`${entry.pathname} declares the exact og:url`, body.includes(`<meta property="og:url" content="${entry.canonical}"/>`));
  check(`${entry.pathname} renders no second main landmark`, countOf(body, /<main[\s>]/gu) === 1);

  if (entry.pathname.endsWith("/programmes/components")) {
    check(`${entry.pathname} renders two semantic article cards`, countOf(body, /<article /gu) === 2);
    check(
      `${entry.pathname} declares a two-column article grid`,
      body.includes('data-uno-columns="2"') && body.includes('data-uno-item-semantics="article"'),
    );
    check(`${entry.pathname} renders a real same-page action link`, body.includes('href="#card-one"'));
    check(`${entry.pathname} renders both card headings`, countOf(body, /class="uno-json-heading"/gu) === 2);
  }
}

/** Assert the whole fixture over the running production server. */
async function assertOverHttp(base) {
  for (const entry of PUBLIC_PAGES) {
    await assertPublicPage(base, entry);
  }

  // The unlisted Page is directly addressable, canonical to itself, and absent from every discovery surface.
  const preview = await request(`${base}/en-001/preview`);
  check("/en-001/preview answers 200 at its exact address", preview.status === 200, `status ${preview.status}`);
  check(
    "/en-001/preview declares its own canonical URL",
    preview.body.includes(`<link rel="canonical" href="${TEST_BASE}/en-001/preview"/>`),
  );
  check("/en-001/preview is noindex,nofollow", /content="noindex,\s*nofollow/u.test(preview.body));
  check("/en-001/preview advertises no hreflang alternate", !preview.body.includes("hreflang"));
  check("/en-001/preview renders exactly one h1", countOf(preview.body, /<h1[\s>]/gu) === 1);

  // Every refusal is a genuine 404 with no leaked metadata, and no Markdown rescue for the malformed JSON Page.
  for (const refused of REFUSED_PAGES) {
    const response = await request(`${base}${refused.pathname}`);
    check(`${refused.pathname} answers a genuine 404 (${refused.reason})`, response.status === 404, `status ${response.status}`);
    check(
      `${refused.pathname} leaks no canonical, alternate or OG URL`,
      !response.body.includes('rel="canonical"') &&
        !response.body.includes("hreflang") &&
        !response.body.includes("og:url"),
    );
    check(
      `${refused.pathname} leaks no fixture Page title`,
      !response.body.includes("Unrenderable module") &&
        !response.body.includes("Broken alternative") &&
        !response.body.includes("Never published") &&
        !response.body.includes("Archive Site Page"),
    );
  }

  // The declared short alias still redirects a JSON Home, and only to the exact canonical address.
  const alias = await request(`${base}/en`);
  check("/en redirects to the declared canonical Home", alias.status >= 300 && alias.status < 400, `status ${alias.status}`);
  check("/en redirects to the exact Home canonical", alias.location === `${TEST_BASE}/en-001`, alias.location ?? "none");

  // robots.txt and sitemap.xml must agree with discovery, and must never name an unlisted or refused Page.
  const robots = await request(`${base}/robots.txt`);
  check("/robots.txt answers 200", robots.status === 200);
  check("/robots.txt names the canonical sitemap", robots.body.includes(`Sitemap: ${TEST_BASE}/sitemap.xml`));
  const sitemap = await request(`${base}/sitemap.xml`);
  check("/sitemap.xml answers 200", sitemap.status === 200);
  for (const entry of PUBLIC_PAGES) {
    check(`/sitemap.xml lists ${entry.canonical}`, sitemap.body.includes(entry.canonical));
  }
  check(
    "/sitemap.xml lists no unlisted, draft or refused Page",
    !sitemap.body.includes("/en-001/preview") &&
      !sitemap.body.includes("/en-001/draft") &&
      !sitemap.body.includes("/en-001/broken") &&
      !sitemap.body.includes("/en-001/unsupported"),
  );

  // Crawler parity: a Googlebot-shaped request sees the same document and the same privacy policy.
  const botHeaders = { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" };
  const asBot = await request(`${base}/en-001/programmes/components`, botHeaders);
  const asBrowser = await request(`${base}/en-001/programmes/components`);
  check("a crawler receives the same status as a browser", asBot.status === asBrowser.status);
  check(
    "a crawler receives the same canonical URL as a browser",
    asBot.body.includes(`<link rel="canonical" href="${TEST_BASE}/en-001/programmes/components"/>`) &&
      asBrowser.body.includes(`<link rel="canonical" href="${TEST_BASE}/en-001/programmes/components"/>`),
  );
  const botPreview = await request(`${base}/en-001/preview`, { "user-agent": "Googlebot/2.1" });
  check("an unlisted Page keeps noindex,nofollow for a crawler", /noindex,\s*nofollow/u.test(botPreview.body));

  // The Owner-accepted demonstration remains untouched.
  const demo = await request(`${base}/`);
  check("the demonstration still answers 200", demo.status === 200);
  check("the demonstration advertises no canonical URL", !demo.body.includes('rel="canonical"'));
  check("the demonstration remains noindex", /noindex/u.test(demo.body));
}

/**
 * Prove the Page in a real Chromium DOM at 320, 390, 768 and 1280 CSS pixels, in light and dark, with reduced
 * motion, and with no console error, page error or external request.
 */
async function assertInBrowser(base) {
  const { chromium } = await import("playwright");
  let browser = null;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const external = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("request", (requestEvent) => {
      const url = requestEvent.url();
      if (!url.startsWith(base) && !url.startsWith("data:")) external.push(url);
    });

    const target = `${base}/en-001/programmes/components`;
    const navigation = await page.goto(target, { waitUntil: "load" });
    check("the JSON Page answers 200 in a real browser", navigation !== null && navigation.status() === 200);

    const structure = await page.evaluate(() => ({
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main").length,
      articles: document.querySelectorAll("article.uno-json-card").length,
      headings: [...document.querySelectorAll(".uno-json-heading")].map((node) => node.textContent),
      gridColumns: document.querySelector(".uno-json-grid")?.getAttribute("data-uno-columns") ?? null,
      actionHref: document.querySelector("a.uno-json-action")?.getAttribute("href") ?? null,
    }));
    check("the browser DOM holds exactly one h1", structure.h1 === 1);
    check("the browser DOM holds exactly one main landmark", structure.main === 1);
    check("the browser DOM holds two semantic article cards", structure.articles === 2);
    check("the two cards carry unique headings", structure.headings.length === 2 && new Set(structure.headings).size === 2);
    check("the grid declares two columns", structure.gridColumns === "2");
    check("the action is a real same-page anchor", structure.actionHref === "#card-one");

    const focused = await page.evaluate(() => {
      const anchor = document.querySelector("a.uno-json-action");
      if (anchor === null) return null;
      anchor.focus();
      return document.activeElement === anchor ? anchor.getAttribute("href") : null;
    });
    check("the action receives keyboard focus", focused === "#card-one");

    // Responsive behaviour at the four required widths, with no horizontal overflow.
    for (const width of [1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const cards = [...document.querySelectorAll("article.uno-json-card")].map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y) };
        });
        return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, cards };
      });
      check(
        `${width}px has no horizontal overflow`,
        metrics.scrollWidth <= metrics.clientWidth + 1,
        `${metrics.scrollWidth}/${metrics.clientWidth}`,
      );
      if (width >= 768) {
        check(
          `${width}px places the two cards side by side`,
          metrics.cards.length === 2 && metrics.cards[0].y === metrics.cards[1].y && metrics.cards[0].x !== metrics.cards[1].x,
        );
      } else {
        check(`${width}px stacks the two cards`, metrics.cards.length === 2 && metrics.cards[0].y !== metrics.cards[1].y);
      }
    }

    // Dark mode legibility and reduced motion, measured in a fresh context created in that mode: a context-level
    // preference is what a real user has at first paint, and it is the reliable way to assert a CSS media query.
    const darkContext = await browser.newContext({
      viewport: { width: 390, height: 900 },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const darkPage = await darkContext.newPage();
    await darkPage.goto(target, { waitUntil: "load" });
    const dark = await darkPage.evaluate(() => {
      const body = getComputedStyle(document.body);
      const prose = document.querySelector(".uno-json-prose");
      const action = document.querySelector("a.uno-json-action");
      const token = getComputedStyle(document.documentElement).getPropertyValue("--uno-background").trim();
      const parse = (value) => (value.match(/\d+/gu) ?? []).slice(0, 3).map(Number);
      const luminance = ([r, g, b]) => {
        const channel = (value) => {
          const scaled = value / 255;
          return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const background = parse(body.backgroundColor);
      const foreground = parse(prose === null ? body.color : getComputedStyle(prose).color);
      const lighter = Math.max(luminance(background), luminance(foreground));
      const darker = Math.min(luminance(background), luminance(foreground));
      return {
        prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
        prefersReduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        token,
        background,
        contrast: Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2)),
        transition: action === null ? "none" : getComputedStyle(action).transitionDuration,
      };
    });
    await darkContext.close();

    check("the dark context reports a dark colour-scheme preference", dark.prefersDark === true);
    check("the dark context reports a reduced-motion preference", dark.prefersReduced === true);
    check("dark mode resolves the dark background token", dark.token.toLowerCase() === "#0c1118", dark.token);
    check("dark mode paints a dark background", dark.background.length === 3 && dark.background[0] < 60, dark.background.join(","));
    check("dark mode keeps body text above a 4.5:1 contrast ratio", dark.contrast >= 4.5, `${dark.contrast}`);
    // The accepted demo already collapses every transition to `0.01ms !important` under reduced motion, so the
    // assertion is "effectively zero" and strictly far shorter than the animated default, not a literal `0s`.
    const normalTransition = await page.evaluate(() => {
      const anchor = document.querySelector("a.uno-json-action");
      return anchor === null ? "none" : getComputedStyle(anchor).transitionDuration;
    });
    const reducedSeconds = Number.parseFloat(dark.transition);
    const normalSeconds = Number.parseFloat(normalTransition);
    check("reduced motion collapses the action transition to at most 1ms", reducedSeconds <= 0.001, dark.transition);
    check(
      "reduced motion is far shorter than the animated default",
      Number.isFinite(normalSeconds) && reducedSeconds < normalSeconds / 50,
      `${dark.transition} vs ${normalTransition}`,
    );

    check("the Page logs no console error", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
    check("the Page throws no uncaught error", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));
    check("the Page makes no external request", external.length === 0, external.slice(0, 3).join(" | "));
  } catch (error) {
    check("the real browser proof ran without an exception", false, error instanceof Error ? error.message : String(error));
  } finally {
    if (browser !== null) await browser.close();
  }
}

async function main() {
  process.stdout.write("verify-u04-json-slice: the JSON Page vertical slice over a real production build\n");

  const nextBin = nextBinPath();
  if (nextBin === null) {
    process.stderr.write("verify-u04-json-slice: FAILED - the pinned local Next CLI was not found.\n");
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
      process.stderr.write("verify-u04-json-slice: preflight refused; nothing was changed.\n");
      return 1;
    }

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
      process.stderr.write("verify-u04-json-slice: the transaction refused; nothing was changed.\n");
      return 1;
    }
    check("the fixture transaction is armed before any write", true);

    const installed = await transaction.install();
    if (!check("the fixture installs without a write failure", installed.ok === true, installed.cause ?? "")) {
      return 1;
    }
    check("the fixture manifest is installed", sha256Of(MANIFEST) !== PINNED_DECLARATIONS.get(MANIFEST));
    check("the fixture declaration is installed", sha256Of(SELECTION) !== PINNED_DECLARATIONS.get(SELECTION));

    await validateFixtureInProcess();
    if (failures.length > 0) {
      process.stderr.write("verify-u04-json-slice: the fixture failed validation; no build was attempted.\n");
      return 1;
    }

    // --- One real production build of the fixture -------------------------------------------------
    rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
    const build = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
    if (!check("the production build of the fixture succeeds", build.code === 0, `exit ${build.code}`)) {
      process.stderr.write(build.output.slice(-4000));
      return 1;
    }
    checkBuildClean("the fixture production build", build.output);
    checkTrace("the fixture production build", "fixture");
    if (failures.length > 0) {
      process.stderr.write(build.output.slice(-4000));
      process.stderr.write("verify-u04-json-slice: the fixture build is not clean or not bounded.\n");
      return 1;
    }

    port = await freeLoopbackPort();
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

    await assertOverHttp(base);
    await assertInBrowser(base);

    check("server stayed up for the whole run", child.exitCode === null && child.signalCode === null);
    return 0;
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
  }
}

function fixturePlan() {
  const sources = [
    [`${CONTENT}/wo035-home.en-001.json`, JSON.stringify(JSON_DOCUMENTS.homeEn, null, 2)],
    [`${CONTENT}/wo035-home.de-de.json`, JSON.stringify(JSON_DOCUMENTS.homeDe, null, 2)],
    [`${CONTENT}/wo035-components.en-001.json`, JSON.stringify(JSON_DOCUMENTS.componentsEn, null, 2)],
    [`${CONTENT}/wo035-components.de-de.json`, JSON.stringify(JSON_DOCUMENTS.componentsDe, null, 2)],
    [`${CONTENT}/wo035-notes.en-001.md`, MARKDOWN_DOCUMENTS.notes],
    [`${CONTENT}/wo035-preview.en-001.json`, JSON.stringify(JSON_DOCUMENTS.preview, null, 2)],
    [`${CONTENT}/wo035-unsupported.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unsupported, null, 2)],
    [`${CONTENT}/wo035-unknown.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unknown, null, 2)],
    [`${CONTENT}/wo035-version.en-001.json`, JSON.stringify(JSON_DOCUMENTS.versionUnsupported, null, 2)],
    [`${CONTENT}/wo035-extrakey.en-001.json`, JSON.stringify(JSON_DOCUMENTS.extraKey, null, 2)],
    [`${CONTENT}/wo035-unsafe.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unsafeLink, null, 2)],
    [`${CONTENT}/wo035-target.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unresolvedTarget, null, 2)],
    [`${CONTENT}/wo035-duplicate.en-001.json`, JSON.stringify(JSON_DOCUMENTS.duplicateId, null, 2)],
    [`${CONTENT}/wo035-deep.en-001.json`, JSON.stringify(JSON_DOCUMENTS.tooDeep, null, 2)],
    [`${CONTENT}/wo035-wide.en-001.json`, JSON.stringify(JSON_DOCUMENTS.tooWide, null, 2)],
    // Deliberately truncated: declared *and* unparseable, so no Markdown may rescue it.
    [`${CONTENT}/wo035-broken.en-001.json`, '{ "version": 1, "title": "Broken", "sections": ['],
    [`${CONTENT}/wo035-broken.en-001.md`, MARKDOWN_DOCUMENTS.brokenAlternative],
    [`${CONTENT}/wo035-draft.en-001.md`, MARKDOWN_DOCUMENTS.draft],
    [`${CONTENT}/wo035-other.en-001.json`, JSON.stringify(JSON_DOCUMENTS.other, null, 2)],
  ];
  return {
    declarations: [MANIFEST, SELECTION].map((path) => ({ path, digest: PINNED_DECLARATIONS.get(path) })),
    replacements: [
      { path: MANIFEST, bytes: Buffer.from(`${JSON.stringify(fixtureManifest(), null, 2)}\n`, "utf8") },
      { path: SELECTION, bytes: Buffer.from(`${JSON.stringify(fixtureSelection(), null, 2)}\n`, "utf8") },
    ],
    fixtureSources: sources.map(([path, text]) => ({ path, bytes: Buffer.from(text, "utf8") })),
  };
}

// Step 4: the final `.next` must correspond to the ORIGINAL unpublished sources, so the committed configuration is
// rebuilt and the existing fail-closed gate is re-run against it. Nothing here can succeed on a stale fixture.
const outcome = await main();

const declarationsRestored =
  sha256Of(MANIFEST) === PINNED_DECLARATIONS.get(MANIFEST) &&
  sha256Of(SELECTION) === PINNED_DECLARATIONS.get(SELECTION);

if (outcome === 0 && declarationsRestored) {
  process.stdout.write("\nverify-u04-json-slice: rebuilding the committed unpublished configuration\n");
  const nextBin = nextBinPath();
  rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
  const rebuild = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
  check("the rebuild of the committed configuration succeeds", rebuild.code === 0, `exit ${rebuild.code}`);
  checkBuildClean("the committed rebuild", rebuild.output);
  checkTrace("the committed rebuild", "committed");

  const u03 = await runChild([resolve(ROOT, "scripts/verify-u03-http.mjs")], BUILD_TIMEOUT_MS);
  check("the original U03 fail-closed gate still passes", u03.code === 0, `exit ${u03.code}`);

  const status = spawnSync("git", ["--no-optional-locks", "status", "--porcelain=v1", "--", "deployment"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("no committed deployment input is modified after restoration", status.stdout.trim() === "", status.stdout.trim());
  const staged = spawnSync("git", ["--no-optional-locks", "diff", "--cached", "--name-only"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("nothing was staged by the gate", staged.stdout.trim() === "", staged.stdout.trim());
} else if (outcome === 0) {
  check("the committed declarations are restored before the final rebuild", false, "digest mismatch");
}

process.stdout.write(`\nverify-u04-json-slice: ${passes.length} passed, ${failures.length} failed\n`);
if (failures.length > 0 || outcome !== 0) {
  process.stderr.write(
    `verify-u04-json-slice: FAILED\n${failures.map((failure) => `  - ${failure}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    "verify-u04-json-slice: OK - a validated JSON Page, its two-card article grid, unlisted privacy, strict refusals and a byte-exact restoration are proved over real production HTTP and Chromium.\n",
  );
  process.exitCode = 0;
}


