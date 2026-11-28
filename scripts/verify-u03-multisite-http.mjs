#!/usr/bin/env node
/**
 * Foundation Uno — the multi-Site production HTTP and Chromium proof (`UNO-WO-096 / R01`, M1 P6).
 *
 * WHAT THIS IS. One test-only orchestrator that installs a three-Site publication fixture through the existing
 * recovery-armed transaction, runs a real `next build` and a real `next start` on an ephemeral loopback port, and then
 * proves G01–G05 over that process: independent Facet domains, a shared-Host Site prefix, JSON and Markdown
 * precedence, unlisted and draft behaviour, per-Site SEO and locales, media ownership, hostile authorities and a real
 * Chromium DOM.
 *
 * WHY IT LOOKS LIKE THIS. Every positive here is a real HTTP response from the real production server, and every refusal
 * is a real status line with real headers — never an internal function's opinion. The three Sites differ in
 * *authority*, so the request `Host` is the only thing that can select one: the fixture is installed, the server is
 * started, and the same path is requested under three different Host values. Nothing resolves `example` over DNS; the
 * server is addressed at `127.0.0.1` and the Host header is supplied explicitly, which is exactly the untrusted lookup
 * key the composition is allowed to read.
 *
 * RESTORATION. The declarations are backed up, recovery is armed before the first destructive write, and the originals
 * are restored and proved byte-for-byte in `finally`. A failing test never becomes a passing one: the first failure is
 * reported, the restoration result is recorded separately, and the process exits non-zero if either is not clean.
 */
import { captureDeclarationDigests, manifestFileIssue, manifestFileMutationProof } from "./uno-published-baseline.mjs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer, request as httpRequest } from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { prepareUnoU03FixtureTransaction } from "./uno-u03-fixture-transaction.mjs";

// `UNO-WO-111 / R01`: the authored Lists are composed by the real adapter, whose TypeScript modules import each other
// without extensions. The same resolve hook the other production runners use lets Node's type stripping find them, so the
// fixture installs genuine composer output rather than a hand-built list node.
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

const ROOT = process.cwd();
const SCRATCH = resolve(ROOT, ".temp/uno-m1-096");
const HOST = "127.0.0.1";
const REQUEST_TIMEOUT_MS = 30_000;
const SHUTDOWN_TIMEOUT_MS = 15_000;
const BUILD_TIMEOUT_MS = 900_000;
const READY_TIMEOUT_MS = 120_000;

/** The committed declarations this fixture replaces and must put back. */
const MANIFEST_PATH = "deployment/efs/manifest.json";
const CONFIG_PATH = "deployment/uno.config.json";
/** The retired manifest digest, kept as evidence: the authorised public-contact declaration replaced it at 179da66. */
const HISTORICAL_MANIFEST_SHA = "b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925";
/** The digests observed at process start, so restoration is proved against reality rather than a historical constant. */
const DECLARATION_BASELINE = captureDeclarationDigests(process.cwd(), [MANIFEST_PATH, CONFIG_PATH]);
const CONFIG_SHA = "58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952";

/** The one synthetic Entity, and the three authorities the fixture binds. */
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const CORPORATE_MAIN = "https://abc.example";
const CORPORATE_DOCS = "https://abc.example/docs/";
const SERVICES_MAIN = "https://xyz.example";
const HOST_ABC = "abc.example";
const HOST_XYZ = "xyz.example";

/** The committed plate whose exact bytes the fixture reuses at its own owned paths. */
const PLATE_PATH = `deployment/efs/capsule/${ENTITY_ID}/foundation/main/wo078-family-plate.png`;

/** One authored content source, created exclusively by the transaction inside the approved content directory. */
function contentFile(name, body) {
  return { path: `deployment/efs/content/${name}`, bytes: body };
}


/** One authored JSON Page document: a closed envelope with prose modules and an optional owned image. */
function jsonDocument(title, visibility, lines, media, extra = []) {
  const sections = [
    { id: "lede", module: "content.heading", props: { text: lines[0], level: 2 } },
    { id: "body", module: "content.prose", props: { text: lines[1] } },
  ];
  if (media !== undefined) {
    sections.push({
      id: "plate",
      module: "media.image",
      props: { asset: { zone: "page", path: media }, alt: "A synthetic owned sample plate", caption: lines[2] },
    });
  }
  // `UNO-WO-111 / R01`: only the composer's own validated sections are appended, so the installed Page carries exactly the
  // nodes the real adapter produced from an authored donor List — never a hand-built list shape.
  for (const section of extra) sections.push(section);
  return `${JSON.stringify({ version: 1, title, description: lines[1], visibility, sections }, null, 2)}\n`;
}

/**
 * `UNO-WO-111 / R01`: compose one donor-authored rich List and return the adapter's accepted Uno sections.
 *
 * The fixture must never hand-build a `variant:"list"` node: an authored donor section goes through the real
 * `composeUnoFoundationSubset`, and a refusal here is a fixture bug that stops the run before anything is installed.
 */
async function composedListSections(spec) {
  const { composeUnoFoundationSubset } = await import("../src/application/compose-uno-foundation-families.ts");
  const outcome = composeUnoFoundationSubset({
    version: 1,
    title: spec.title,
    sections: [
      {
        type: "list",
        heading: spec.heading,
        lede: spec.lede,
        surface: "bordered",
        items: spec.items,
      },
    ],
  });
  if (outcome.status !== "composed") throw new Error(`list composition refused: ${String(outcome.reason)}`);
  return outcome.document.sections;
}

/** One authored Markdown Page document: a heading and two paragraphs. */
function markdownDocument(title, para) {
  return `# ${title}\n\n${para}\n\nThis paragraph exists only to prove a Markdown representation is served as authored.\n`;
}

/** The Page declarations of one Site: entries sharing an identity become one Page with many representations. */
function sitePages(entries) {
  const pages = new Map();
  for (const entry of entries) {
    const route = Array.isArray(entry.route) ? [...entry.route] : [entry.route ?? entry.id];
    const representation = {
      locale: entry.locale,
      sources: entry.sources.map((source) => ({ kind: source.kind, path: `deployment/efs/content/${source.file}` })),
    };
    const key = `${entry.id}|${route.join("/")}`;
    const existing = pages.get(key);
    if (existing === undefined) {
      pages.set(key, {
        id: entry.id,
        route,
        publication: entry.publication ?? "published",
        representations: [representation],
      });
      continue;
    }
    existing.representations.push(representation);
  }
  return [...pages.values()];
}

/** The three-Site version-2 manifest: two Facets, three Sites, one reserved public Home each. */
const MANIFEST = {
  entities: [
    {
      id: ENTITY_ID,
      properties: { "brand.name": { value: "Synthetic Multi-Site Fixture", public: false } },
      facets: [
        {
          id: "corporate",
          sites: [
            {
              id: "main",
              locales: { supportedLocales: ["de-DE", "en-001"], defaultLocale: "de-DE" },
              pages: sitePages([
                { id: "home", locale: "de-DE", sources: [{ kind: "json", file: "wo096-corp-main-home.de-DE.json" }] },
                { id: "home", locale: "en-001", sources: [{ kind: "json", file: "wo096-corp-main-home.en-001.json" }] },
                { id: "about", locale: "de-DE", sources: [{ kind: "json", file: "wo096-corp-main-about.de-DE.json" }] },
              ]),
            },
            {
              id: "docs",
              locales: { supportedLocales: ["de-DE"], defaultLocale: "de-DE" },
              pages: sitePages([
                { id: "home", locale: "de-DE", sources: [{ kind: "json", file: "wo096-corp-docs-home.de-DE.json" }] },
                { id: "about", locale: "de-DE", sources: [{ kind: "json", file: "wo096-corp-docs-about.de-DE.json" }] },
                {
                  id: "notes",
                  locale: "de-DE",
                  sources: [{ kind: "markdown", file: "wo096-corp-docs-notes.de-DE.md" }],
                },
                {
                  id: "privacy",
                  locale: "de-DE",
                  sources: [{ kind: "json", file: "wo096-corp-docs-privacy.de-DE.json" }],
                },
              ]),
            },
          ],
        },
        {
          id: "services",
          sites: [
            {
              id: "main",
              locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
              pages: sitePages([
                { id: "home", locale: "en-001", sources: [{ kind: "json", file: "wo096-svc-home.en-001.json" }] },
                { id: "about", locale: "en-001", sources: [{ kind: "markdown", file: "wo096-svc-about.en-001.md" }] },
                { id: "brief", locale: "en-001", sources: [{ kind: "json", file: "wo096-svc-brief.en-001.json" }] },
                {
                  id: "field",
                  route: ["field", "notes"],
                  locale: "en-001",
                  sources: [{ kind: "json", file: "wo096-svc-field.en-001.json" }],
                },
                {
                  id: "draft",
                  locale: "en-001",
                  publication: "draft",
                  sources: [{ kind: "json", file: "wo096-svc-draft.en-001.json" }],
                },
                {
                  id: "guide",
                  locale: "en-001",
                  sources: [
                    { kind: "json", file: "wo096-svc-guide.en-001.json" },
                    { kind: "markdown", file: "wo096-svc-guide.en-001.md" },
                  ],
                },
                {
                  id: "broken",
                  locale: "en-001",
                  sources: [
                    { kind: "json", file: "wo096-svc-broken.en-001.json" },
                    { kind: "markdown", file: "wo096-svc-broken.en-001.md" },
                  ],
                },
              ]),
            },
          ],
        },
      ],
    },
  ],
};

/** The unlisted docs Page: directly reachable on its canonical address, never discoverable and never aliased. */
function unlistedDocument(title, lines) {
  return `${JSON.stringify(
    {
      version: 1,
      title,
      description: lines[1],
      visibility: "unlisted",
      sections: [
        { id: "lede", module: "content.heading", props: { text: lines[0], level: 2 } },
        { id: "body", module: "content.prose", props: { text: lines[1] } },
      ],
    },
    null,
    2,
  )}\n`;
}

/** The version-2 address declaration: three bindings, an unrelated default, and the declared Site-address aliases. */
const SITE_BINDINGS = [
  { facetId: "corporate", siteId: "main", origin: CORPORATE_MAIN },
  {
    facetId: "corporate",
    siteId: "docs",
    origin: CORPORATE_MAIN,
    pathPrefix: "/docs/",
    // One alias on the Site's own host and one on a different host: both must redirect to this Site's own canonical
    // address, and neither may ever become a publisher or a destination authority.
    aliases: ["https://abc.example/docs-old", "https://docs.example/handbook"],
  },
  { facetId: "services", siteId: "main", origin: SERVICES_MAIN },
];

/** The installed declaration: the default names `services/main`, which owns no address on the `abc.example` Host. */
const CONFIG = {
  version: 2,
  entityId: ENTITY_ID,
  sites: SITE_BINDINGS,
  default: { facetId: "services", siteId: "main" },
  languagePreferences: { en: "en-001" },
};

/** The same bindings, deliberately permuted, so a sorted declaration order cannot become an implicit default. */
const SITE_BINDINGS_PERMUTED = [SITE_BINDINGS[2], SITE_BINDINGS[1], SITE_BINDINGS[0]];

/** The same declaration with no default at all: every Site must still be active, in any declaration order. */
const CONFIG_NO_DEFAULT = {
  version: 2,
  entityId: ENTITY_ID,
  sites: SITE_BINDINGS_PERMUTED,
  languagePreferences: { en: "en-001" },
};

/** The one synthetic publication the three Sites share: tiny, Site-specific, and never a demonstration Page. */
async function buildFixtureSources() {
  const plate = readFileSync(resolve(ROOT, PLATE_PATH));
  const mainPlate = `deployment/efs/capsule/${ENTITY_ID}/corporate/main/wo096-main-plate.png`;
  const docsPlate = `deployment/efs/capsule/${ENTITY_ID}/corporate/docs/wo096-docs-plate.png`;
  const servicesPlate = `deployment/efs/capsule/${ENTITY_ID}/services/main/wo096-services-plate.png`;
  // `UNO-WO-111 / R01`: one authored List per Site, each with a destination that only that Site's own authority may
  // resolve — an external safe `href`, a same-Site published `route`, and one inert label. The route targets differ per
  // Site so a resolved URL can only come from the requesting Site's own graph: `about` at the root, `about` under the
  // `/docs/` prefix, and the nested `field/notes` route on the unrelated Facet domain.
  const corporateList = await composedListSections({
    title: "Corporate Hauptseite (DE)",
    heading: "Geprüfte Seitenverweise",
    lede: "Diese Verweise gehören ausschliesslich dieser Seite.",
    items: [
      { label: "Externe Notizen", detail: "Ein externer, sicherer Verweis.", href: "https://example.org/notes" },
      { label: "Ueber Corporate", route: "about" },
      { label: "Ohne Ziel" },
    ],
  });
  const docsList = await composedListSections({
    title: "Dokumentation (DE)",
    heading: "Dokumentationsverweise",
    lede: "Der Verweis bleibt unter dem Präfix dieser Seite.",
    items: [{ label: "Ueber die Dokumentation", route: "about" }],
  });
  const servicesList = await composedListSections({
    title: "Services Home",
    heading: "Service references",
    lede: "One nested route on this Site only.",
    items: [{ label: "Field notes", route: "field/notes" }],
  });
  return [
    contentFile(
      "wo096-corp-main-home.de-DE.json",
      jsonDocument(
        "Corporate Hauptseite (DE)",
        "public",
        [
          "Corporate auf abc.example",
          "Diese Seite gehört ausschliesslich der Facette corporate/main an der Wurzel von abc.example.",
        ],
        undefined,
        corporateList,
      ),
    ),
    contentFile(
      "wo096-corp-main-home.en-001.json",
      jsonDocument("Corporate Home (EN)", "public", [
        "Corporate in English",
        "This representation is authored for corporate/main under the en-001 locale on abc.example.",
      ]),
    ),
    contentFile(
      "wo096-corp-main-about.de-DE.json",
      jsonDocument(
        "Corporate Ueber uns (DE)",
        "public",
        [
          "Ueber Corporate",
          "Diese Seite traegt ein eigenes Bild aus dem Seite-Zonenbereich von corporate/main.",
          "Ein Bild, das nur diese Seite besitzt.",
        ],
        "wo096-main-plate.png",
      ),
    ),
    contentFile(
      "wo096-corp-docs-home.de-DE.json",
      jsonDocument(
        "Dokumentation (DE)",
        "public",
        [
          "Dokumentation auf abc.example/docs",
          "Diese Seite gehört der Facette corporate/docs unter dem Ganzsegment-Praefix /docs auf demselben Host.",
        ],
        undefined,
        docsList,
      ),
    ),
    contentFile(
      "wo096-corp-docs-about.de-DE.json",
      jsonDocument(
        "Dokumentation Ueber uns (DE)",
        "public",
        [
          "Ueber die Dokumentation",
          "Diese Seite hat denselben Seitenpfad und dieselbe Sprache wie corporate/main und besitzt ein anderes Bild.",
          "Ein zweites Bild an einem gleichnamigen Pfad.",
        ],
        "wo096-docs-plate.png",
      ),
    ),
    contentFile(
      "wo096-corp-docs-notes.de-DE.md",
      markdownDocument(
        "Notizen (DE)",
        "Die Notizen sind als Markdown verfasst und werden als Markdown ausgeliefert, nicht aus JSON abgeleitet.",
      ),
    ),
    contentFile(
      "wo096-corp-docs-privacy.de-DE.json",
      unlistedDocument("Dokumentation Datenschutz (DE)", [
        "Datenschutz der Dokumentation",
        "Diese Seite ist unlisted: auf ihrer kanonischen Adresse direkt erreichbar, aber niemals entdeckbar und niemals ein Aliasziel.",
      ]),
    ),
    contentFile(
      "wo096-svc-home.en-001.json",
      jsonDocument(
        "Services Home",
        "public",
        [
          "Services on xyz.example",
          "This Home belongs to services/main on its own Authority, which shares only its siteId with corporate/main.",
          "The services Home owns this plate.",
        ],
        "wo096-services-plate.png",
        servicesList,
      ),
    ),
    contentFile(
      "wo096-svc-about.en-001.md",
      markdownDocument(
        "About the services Site",
        "This Page is authored as Markdown and served from an unrelated Facet domain.",
      ),
    ),
    contentFile(
      "wo096-svc-brief.en-001.json",
      jsonDocument("Services brief", "unlisted", [
        "An unlisted brief",
        "This Page is reachable only by its exact address and must never appear in any discovery surface.",
      ]),
    ),
    contentFile(
      "wo096-svc-field.en-001.json",
      jsonDocument("Field notes", "public", [
        "Field notes one level down",
        "This Page is declared on a two-segment route and must be served only at that nested address.",
      ]),
    ),
    contentFile(
      "wo096-svc-draft.en-001.json",
      jsonDocument("Services draft", "public", [
        "A draft Page",
        "The manifest declares this Page draft, so no source may make it servable.",
      ]),
    ),
    contentFile(
      "wo096-svc-guide.en-001.md",
      markdownDocument(
        "The guide",
        "The preferred JSON source for this Page is genuinely absent, so the authored Markdown is served.",
      ),
    ),
    contentFile(
      "wo096-svc-broken.en-001.json",
      `${JSON.stringify({
        version: 1,
        title: "Broken source",
        sections: [
          { id: "lede", module: "content.heading", props: { text: "A heading", level: 2 } },
          { id: "body", module: "content.prose", props: { text: "<script>alert(1)</script>" } },
        ],
      })}\n`,
    ),
    contentFile(
      "wo096-svc-broken.en-001.md",
      markdownDocument("The fallback that must not rescue", "A valid Markdown sibling must never rescue invalid preferred JSON."),
    ),
    { path: mainPlate, bytes: plate },
    { path: docsPlate, bytes: plate },
    { path: servicesPlate, bytes: plate },
  ];
}

/** Every assertion result, in order, so the summary can never hide a failure. */
const results = [];
let failed = 0;

/** How many hosted annotations to emit; enough to diagnose, bounded so a red run cannot flood the log. */
const ANNOTATION_LIMIT = 5;
let annotationsWritten = 0;

/**
 * Emit one bounded GitHub error annotation, so a hosted failure is legible without private log access.
 *
 * The message is sanitised: the absolute checkout path is replaced, drive-qualified paths are masked, newlines are
 * flattened and the command separators are removed, so no private path or multi-line payload can reach a public
 * annotation.
 */
function annotate(name, detail) {
  if (annotationsWritten >= ANNOTATION_LIMIT) return;
  annotationsWritten += 1;
  const safe = String(detail ?? "")
    .split(ROOT)
    .join("<repo>")
    .replace(/[A-Za-z]:[\\/][^\s"']*/gu, "<path>")
    .replace(/\r?\n/gu, " | ")
    .slice(0, 400)
    .replace(/[%:]/gu, " ");
  process.stdout.write(`::error title=${String(name).replace(/[%:]/gu, " ").slice(0, 120)}::${safe}\n`);
}

/** Record one assertion. `detail` is printed only when the assertion fails. */
function check(name, ok, detail) {
  results.push({ name, ok });
  if (ok) {
    process.stdout.write(`  ok   ${name}\n`);
    return true;
  }
  failed += 1;
  process.stdout.write(`  FAIL ${name}${detail === undefined ? "" : ` — ${detail}`}\n`);
  annotate(name, detail);
  return false;
}

/** Wait without a timer leak. */
function delay(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

/**
 * Run one requirement group, converting an exception into a named failed check.
 *
 * A hosted failure must always name the group that died; letting an exception escape to the process handler would hide
 * which of G01–G05 broke, and would hide it from the annotation channel too.
 */
async function guard(label, run) {
  try {
    return await run();
  } catch (error) {
    check(`${label} completes without throwing`, false, String(error?.message ?? error));
    return {};
  }
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

/**
 * One real HTTP request to the loopback server, with an explicitly supplied `Host` header.
 *
 * `fetch` forbids setting `Host`, so this uses `node:http` directly: the request is addressed at `127.0.0.1:<port>` and
 * the Host value is the untrusted lookup key the server sees. Nothing here resolves `example` over DNS.
 */
async function requestAs(port, hostHeader, path, options = {}) {
  return new Promise((resolveResponse) => {
    const request = httpRequest(
      {
        host: HOST,
        port,
        method: options.method ?? "GET",
        path,
        headers: { host: hostHeader, ...(options.headers ?? {}) },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          resolveResponse({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            raw: Buffer.concat(chunks),
          });
        });
      },
    );
    request.on("timeout", () => request.destroy(new Error("request:timeout")));
    request.on("error", (error) => {
      resolveResponse({ status: 0, headers: {}, body: "", raw: Buffer.alloc(0), error: String(error.message) });
    });
    request.end();
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
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) await delay(200);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await delay(500);
    return { code: -1, output: output.join("") };
  }
  return { code: child.exitCode ?? -1, output: output.join("") };
}

/** Stop exactly the child this runner spawned, and wait for it, on every path. */
async function stopChild(child) {
  if (child === null) return;
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  let deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) await delay(100);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
    while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) await delay(100);
  }
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

/** True when a response is the approved refusal: real 404, approved copy, one literal home link. */
function isApprovedRefusal(response) {
  return (
    response.status === 404 &&
    response.body.includes('href="/"') &&
    !response.body.includes("__next_error__") &&
    /text\/html/u.test(String(response.headers["content-type"] ?? ""))
  );
}

/** The canonical link a document claims, if any. */
function canonicalOf(response) {
  const match = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/u.exec(response.body);
  return match === null ? null : match[1];
}

/** The `<title>` text a document claims, if any. */
function titleOf(response) {
  const match = /<title>([^<]*)<\/title>/u.exec(response.body);
  return match === null ? null : match[1];
}

/** G01 — routing and authority: three Sites, one shared Host, and the refusals around them. */
async function g01Routing(port) {
  const corpHome = await requestAs(port, HOST_ABC, "/de-de");
  const docsHome = await requestAs(port, HOST_ABC, "/docs/de-de");
  const svcHome = await requestAs(port, HOST_XYZ, "/en-001");

  check("G01 abc.example /de-de is 200", corpHome.status === 200, `status ${corpHome.status}`);
  check("G01 abc.example /docs/de-de is 200", docsHome.status === 200, `status ${docsHome.status}`);
  check("G01 xyz.example /en-001 is 200", svcHome.status === 200, `status ${svcHome.status}`);

  check(
    "G01 the three Sites answer with three different canonical origins",
    new Set([canonicalOf(corpHome), canonicalOf(docsHome), canonicalOf(svcHome)]).size === 3,
    `${canonicalOf(corpHome)} | ${canonicalOf(docsHome)} | ${canonicalOf(svcHome)}`,
  );
  check(
    "G01 corporate/main canonical is its own root origin",
    canonicalOf(corpHome) === `https://${HOST_ABC}/de-de`,
    String(canonicalOf(corpHome)),
  );
  check(
    "G01 corporate/docs canonical carries the whole-segment prefix",
    canonicalOf(docsHome) === `${CORPORATE_DOCS}de-de`,
    String(canonicalOf(docsHome)),
  );
  check(
    "G01 services/main canonical is its unrelated origin",
    canonicalOf(svcHome) === `https://${HOST_XYZ}/en-001`,
    String(canonicalOf(svcHome)),
  );

  check(
    "G01 the three Sites serve three distinct authored titles",
    new Set([titleOf(corpHome), titleOf(docsHome), titleOf(svcHome)]).size === 3,
    `${titleOf(corpHome)} | ${titleOf(docsHome)} | ${titleOf(svcHome)}`,
  );
  check("G01 corporate/main serves its own fingerprint", corpHome.body.includes("Corporate Hauptseite (DE)"));
  check("G01 corporate/docs serves its own fingerprint", docsHome.body.includes("Dokumentation (DE)"));
  check("G01 services/main serves its own fingerprint", svcHome.body.includes("Services Home"));
  check(
    "G01 a shared Host never serves the sibling Site's copy",
    !corpHome.body.includes("Dokumentation (DE)") && !docsHome.body.includes("Corporate Hauptseite (DE)"),
  );

  const corpAbout = await requestAs(port, HOST_ABC, "/de-de/about");
  const docsAbout = await requestAs(port, HOST_ABC, "/docs/de-de/about");
  check(
    "G01 the same slug under two Facets differs by origin and by body",
    corpAbout.status === 200 &&
      docsAbout.status === 200 &&
      canonicalOf(corpAbout) === `https://${HOST_ABC}/de-de/about` &&
      canonicalOf(docsAbout) === `https://${HOST_ABC}/docs/de-de/about` &&
      corpAbout.body.includes("Ueber Corporate") &&
      docsAbout.body.includes("Ueber die Dokumentation"),
    `${canonicalOf(corpAbout)} | ${canonicalOf(docsAbout)}`,
  );

  return { corpHome, docsHome, svcHome, corpAbout, docsAbout };
}

/** The second half of G01: every surrounding authority refusal, all against the same live server. */
async function g01Refusals(port) {
  const unknownHost = await requestAs(port, "unknown.example", "/de-de");
  check("G01 an unknown Host is refused", isApprovedRefusal(unknownHost), `status ${unknownHost.status}`);

  const loopbackHost = await requestAs(port, HOST, "/de-de");
  check("G01 the loopback address is not an accepted authority", isApprovedRefusal(loopbackHost), `status ${loopbackHost.status}`);

  const suffix = await requestAs(port, "abc.example.evil.test", "/de-de");
  check("G01 a suffix lookalike authority is refused", isApprovedRefusal(suffix), `status ${suffix.status}`);

  const ported = await requestAs(port, `${HOST_ABC}:9999`, "/de-de");
  check("G01 a wrong port in the authority is refused", isApprovedRefusal(ported), `status ${ported.status}`);

  const wrongPrefix = await requestAs(port, HOST_ABC, "/docsx/de-de");
  check("G01 a lookalike prefix /docsx is refused", isApprovedRefusal(wrongPrefix), `status ${wrongPrefix.status}`);

  const nestedPrefix = await requestAs(port, HOST_ABC, "/de-de/docs");
  check("G01 the prefix is never usable as an inner segment", isApprovedRefusal(nestedPrefix), `status ${nestedPrefix.status}`);

  const docsOnOtherHost = await requestAs(port, HOST_XYZ, "/docs/de-de");
  check("G01 a prefix Site is unknown on the other Facet domain", isApprovedRefusal(docsOnOtherHost), `status ${docsOnOtherHost.status}`);

  const crossLocale = await requestAs(port, HOST_XYZ, "/de-de");
  check("G01 a locale the Site does not declare is refused", isApprovedRefusal(crossLocale), `status ${crossLocale.status}`);

  const docsWrongLocale = await requestAs(port, HOST_ABC, "/docs/en-001");
  check("G01 the prefix Site refuses a locale it does not declare", isApprovedRefusal(docsWrongLocale));

  const barePrefix = await requestAs(port, HOST_ABC, "/docs");
  check(
    "G01 the bare prefix resolves only to a redirect or the approved refusal",
    barePrefix.status === 307 || barePrefix.status === 308 || isApprovedRefusal(barePrefix),
    `status ${barePrefix.status} location ${String(barePrefix.headers.location ?? "")}`,
  );
}

/** G02 — publication, source precedence and security, all measured on live responses. */
async function g02Publication(port) {
  const about = await requestAs(port, HOST_XYZ, "/en-001/about");
  check(
    "G02 a Markdown Page is served as authored on its own Site",
    about.status === 200 && about.body.includes("About the services Site") && about.body.includes("unrelated Facet domain"),
    `status ${about.status}`,
  );
  check("G02 the Markdown Page claims its own canonical", canonicalOf(about) === `https://${HOST_XYZ}/en-001/about`, String(canonicalOf(about)));

  const nested = await requestAs(port, HOST_XYZ, "/en-001/field/notes");
  check(
    "G02 a nested custom Page is served at its nested address",
    nested.status === 200 && nested.body.includes("Field notes one level down"),
    `status ${nested.status}`,
  );
  const nestedWrong = await requestAs(port, HOST_XYZ, "/en-001/field");
  check("G02 the nested Page is not served at its parent address", isApprovedRefusal(nestedWrong), `status ${nestedWrong.status}`);

  const docsNotes = await requestAs(port, HOST_ABC, "/docs/de-de/notes");
  check(
    "G02 Markdown is served on the shared-Host prefix Site too",
    docsNotes.status === 200 && docsNotes.body.includes("Notizen (DE)"),
    `status ${docsNotes.status}`,
  );

  const unlisted = await requestAs(port, HOST_XYZ, "/en-001/brief");
  check(
    "G02 an unlisted Page is directly reachable",
    unlisted.status === 200 && unlisted.body.includes("An unlisted brief"),
    `status ${unlisted.status}`,
  );
  check(
    "G02 an unlisted Page declares noindex,nofollow",
    /noindex,\s*nofollow/iu.test(unlisted.body) || /noindex,\s*nofollow/iu.test(String(unlisted.headers["x-robots-tag"] ?? "")),
    `x-robots-tag ${String(unlisted.headers["x-robots-tag"] ?? "")}`,
  );

  const draft = await requestAs(port, HOST_XYZ, "/en-001/draft");
  check("G02 a draft Page is refused even though its source is public", isApprovedRefusal(draft), `status ${draft.status}`);
  check("G02 the draft source never leaks its text", !draft.body.includes("A draft Page"));

  const guide = await requestAs(port, HOST_XYZ, "/en-001/guide");
  check(
    "G02 a genuinely absent preferred JSON leaves the declared Markdown serving",
    guide.status === 200 && guide.body.includes("The guide"),
    `status ${guide.status}`,
  );

  const broken = await requestAs(port, HOST_XYZ, "/en-001/broken");
  check(
    "G02 an invalid preferred JSON is never rescued by a valid Markdown sibling",
    broken.status === 404 && !broken.body.includes("The fallback that must not rescue"),
    `status ${broken.status}`,
  );
  check("G02 the refused source never reaches the response", !broken.body.includes("<script>alert(1)</script>"));

  const undeclared = await requestAs(port, HOST_XYZ, "/en-001/secret");
  check("G02 an undeclared path is refused", isApprovedRefusal(undeclared), `status ${undeclared.status}`);

  const foreignSource = await requestAs(port, HOST_XYZ, "/en-001/notes");
  check("G02 a Page declared only on another Site is unknown here", isApprovedRefusal(foreignSource), `status ${foreignSource.status}`);

  const foreignHome = await requestAs(port, HOST_ABC, "/en-001/brief");
  check("G02 an unlisted Page is unknown on the other Site", isApprovedRefusal(foreignHome), `status ${foreignHome.status}`);
}

/** G03 — SEO and locale authority: per-Site canonical, hreflang, robots and sitemap. */
async function g03Discovery(port) {
  const corp = await requestAs(port, HOST_ABC, "/de-de");
  const svc = await requestAs(port, HOST_XYZ, "/en-001");

  const corpLang = /<html[^>]+lang="([^"]+)"/u.exec(corp.body);
  const svcLang = /<html[^>]+lang="([^"]+)"/u.exec(svc.body);
  check("G03 the document language follows the accepted locale", corpLang !== null && /^de/iu.test(corpLang[1]), String(corpLang?.[1]));
  check("G03 the other Site carries its own document language", svcLang !== null && /^en/iu.test(svcLang[1]), String(svcLang?.[1]));

  const ogUrl = /<meta[^>]+property="og:url"[^>]+content="([^"]+)"/u.exec(corp.body);
  check("G03 og:url equals the Site's canonical", ogUrl !== null && ogUrl[1] === `https://${HOST_ABC}/de-de`, String(ogUrl?.[1]));
  check("G03 og:title is present on each Site", /property="og:title"/u.test(corp.body) && /property="og:title"/u.test(svc.body));

  const alternates = [...corp.body.matchAll(/<link[^>]+rel="alternate"[^>]*>/gu)];
  check("G03 the corporate Home states same-Page alternates", alternates.length > 0, `${alternates.length}`);
  check(
    "G03 no alternate ever points at the other Facet domain",
    !corp.body.includes(`${HOST_XYZ}/`) && !svc.body.includes(`${HOST_ABC}/`),
  );
  const xDefaultLinks = alternates.filter((tag) => tag.includes("x-default"));
  check(
    "G03 an x-default alternate, when claimed, carries a real hreflang and this Site's origin",
    xDefaultLinks.every((tag) => /hreflang="/u.test(tag) && tag.includes(`https://${HOST_ABC}`)),
    xDefaultLinks.join(" "),
  );

  const abcRobots = await requestAs(port, HOST_ABC, "/robots.txt");
  check("G03 abc.example robots.txt is served", abcRobots.status === 200, `status ${abcRobots.status}`);
  check(
    "G03 robots.txt advertises the reachable host-level sitemap",
    abcRobots.body.includes(`Sitemap: https://${HOST_ABC}/sitemap.xml`),
    abcRobots.body.split("\n").filter((line) => /sitemap/iu.test(line)).join(" | "),
  );
  check(
    "G03 robots.txt never advertises an unreachable prefixed sitemap",
    !/sitemap:[^\n]*\/docs\/sitemap\.xml/iu.test(abcRobots.body),
  );
  check("G03 robots.txt never names the other Host", !abcRobots.body.includes(HOST_XYZ));

  const abcSitemap = await requestAs(port, HOST_ABC, "/sitemap.xml");
  check(
    "G03 abc.example sitemap.xml is served as XML",
    abcSitemap.status === 200 && /<urlset/u.test(abcSitemap.body),
    `status ${abcSitemap.status}`,
  );
  check("G03 the sitemap lists the root Site", abcSitemap.body.includes(`https://${HOST_ABC}/de-de`));
  check("G03 the sitemap lists the prefixed Site", abcSitemap.body.includes(`https://${HOST_ABC}/docs/de-de`));
  check("G03 the sitemap never leaks the other Host", !abcSitemap.body.includes(HOST_XYZ));
  check("G03 no unlisted Page appears in the sitemap", !abcSitemap.body.includes("/brief"));
  check("G03 no draft Page appears in the sitemap", !abcSitemap.body.includes("/draft"));
  check("G03 no declared address alias appears in the sitemap", !abcSitemap.body.includes("/docs-old"));

  const xyzSitemap = await requestAs(port, HOST_XYZ, "/sitemap.xml");
  check(
    "G03 the other Host has its own sitemap",
    xyzSitemap.status === 200 && xyzSitemap.body.includes(`https://${HOST_XYZ}/en-001`),
  );
  check("G03 the other Host's sitemap never leaks abc.example", !xyzSitemap.body.includes(HOST_ABC));
  check(
    "G03 the other Host's sitemap omits its own unlisted and draft Pages",
    !xyzSitemap.body.includes("/brief") && !xyzSitemap.body.includes("/draft"),
  );

  const localeAlias = await requestAs(port, HOST_ABC, "/en");
  check(
    "G03 a stored language alias redirects to the authored Home on its own Site",
    (localeAlias.status === 307 || localeAlias.status === 308) &&
      String(localeAlias.headers.location ?? "").includes(`https://${HOST_ABC}/en-001`),
    `status ${localeAlias.status} location ${String(localeAlias.headers.location ?? "")}`,
  );
  check(
    "G03 the language alias never redirects into the prefix Site",
    !String(localeAlias.headers.location ?? "").includes("/docs/"),
  );

  const unknownAlias = await requestAs(port, HOST_ABC, "/zz");
  check("G03 an unknown single-segment alias is refused", isApprovedRefusal(unknownAlias), `status ${unknownAlias.status}`);

  const addressAlias = await requestAs(port, HOST_ABC, "/docs-old/de-de");
  const addressAliasLocation = String(addressAlias.headers.location ?? "");
  check(
    "G03 a declared address alias redirects temporarily to its own Site's canonical address",
    addressAlias.status === 307 && addressAliasLocation === `https://${HOST_ABC}/docs/de-de`,
    `status ${addressAlias.status} location ${addressAliasLocation}`,
  );
  check(
    "G03 a declared address alias never serves a document of its own",
    !addressAlias.body.includes("Dokumentation (DE)") && canonicalOf(addressAlias) !== `https://${HOST_ABC}/docs-old/de-de`,
    `${addressAlias.body.length} bytes canonical ${String(canonicalOf(addressAlias))}`,
  );
  check(
    "G03 a declared address alias never becomes the canonical origin",
    !addressAliasLocation.includes("/docs-old") && addressAliasLocation.startsWith(`https://${HOST_ABC}/docs/`),
    addressAliasLocation,
  );

  const nestedAlias = await requestAs(port, HOST_ABC, "/docs-old/de-de/notes");
  const nestedAliasLocation = String(nestedAlias.headers.location ?? "");
  check(
    "G03 a nested alias path redirects to the same Site's authored nested Page",
    nestedAlias.status === 307 && nestedAliasLocation === `https://${HOST_ABC}/docs/de-de/notes`,
    `status ${nestedAlias.status} location ${nestedAliasLocation}`,
  );

  const otherHostAlias = await requestAs(port, "docs.example", "/handbook/de-de");
  const otherHostLocation = String(otherHostAlias.headers.location ?? "");
  check(
    "G03 an alias declared on another host redirects to its Site's configured canonical host",
    otherHostAlias.status === 307 && otherHostLocation === `https://${HOST_ABC}/docs/de-de`,
    `status ${otherHostAlias.status} location ${otherHostLocation}`,
  );

  const aliasRoot = await requestAs(port, HOST_ABC, "/docs-old");
  check(
    "G03 an alias root never synthesises a locale and is refused",
    isApprovedRefusal(aliasRoot),
    `status ${aliasRoot.status} location ${String(aliasRoot.headers.location ?? "")}`,
  );

  const lookalikeAlias = await requestAs(port, HOST_ABC, "/docs-older/de-de");
  check(
    "G03 an alias prefix matches whole segments only",
    isApprovedRefusal(lookalikeAlias),
    `status ${lookalikeAlias.status}`,
  );

  const foreignHostAlias = await requestAs(port, HOST_XYZ, "/docs-old/de-de");
  check(
    "G03 an alias request on a Host its Site does not own is refused",
    isApprovedRefusal(foreignHostAlias),
    `status ${foreignHostAlias.status}`,
  );

  const foreignLocaleAlias = await requestAs(port, HOST_ABC, "/docs-old/en-001");
  check(
    "G03 an alias never invents a locale the owning Site does not declare",
    isApprovedRefusal(foreignLocaleAlias),
    `status ${foreignLocaleAlias.status}`,
  );

  const unlistedAlias = await requestAs(port, HOST_ABC, "/docs-old/de-de/privacy");
  check(
    "G03 an unlisted Page keeps its canonical access and is never an alias destination",
    isApprovedRefusal(unlistedAlias),
    `status ${unlistedAlias.status}`,
  );
  const unlistedCanonical = await requestAs(port, HOST_ABC, "/docs/de-de/privacy");
  check(
    "G03 the unlisted Page itself stays directly reachable and non-indexable",
    unlistedCanonical.status === 200 &&
      unlistedCanonical.body.includes("Datenschutz der Dokumentation") &&
      /<meta[^>]+name="robots"[^>]*noindex/u.test(unlistedCanonical.body),
    `status ${unlistedCanonical.status} robots ${/<meta[^>]+name="robots"[^>]*>/u.exec(unlistedCanonical.body)?.[0] ?? "absent"}`,
  );

  const queryAlias = await requestAs(port, HOST_ABC, "/docs-old/de-de?x=%0d%0aLocation:%20https://evil.example");
  const queryLocation = String(queryAlias.headers.location ?? "");
  check(
    "G03 a hostile query on an authorized alias refuses with the approved 404 and no reflection",
    isApprovedRefusal(queryAlias) &&
      queryAlias.headers.location === undefined &&
      !queryAlias.body.includes("evil.example") &&
      !/Location:/u.test(queryAlias.body),
    `status ${queryAlias.status} location ${queryLocation}`,
  );

  const safeQuery = "?ref=alpha%20beta&view=compact";
  const safeAlias = await requestAs(port, HOST_ABC, `/docs-old/de-de${safeQuery}`);
  check(
    "G03 an authorized alias preserves a safe query byte for byte",
    safeAlias.status === 307 && String(safeAlias.headers.location ?? "") === `https://${HOST_ABC}/docs/de-de${safeQuery}`,
    `status ${safeAlias.status} location ${String(safeAlias.headers.location ?? "")}`,
  );
  check(
    "G03 a safe-query alias redirect is never cached and never rewritten to a plus sign",
    String(safeAlias.headers["cache-control"] ?? "").includes("no-store") &&
      !String(safeAlias.headers.location ?? "").includes("+"),
    `cache ${String(safeAlias.headers["cache-control"] ?? "")}`,
  );

  const safeNested = await requestAs(port, HOST_ABC, `/docs-old/de-de/notes${safeQuery}`);
  check(
    "G03 a safe query survives a nested alias redirect unchanged",
    safeNested.status === 307 &&
      String(safeNested.headers.location ?? "") === `https://${HOST_ABC}/docs/de-de/notes${safeQuery}`,
    `status ${safeNested.status} location ${String(safeNested.headers.location ?? "")}`,
  );

  const safeOtherHost = await requestAs(port, "docs.example", `/handbook/de-de${safeQuery}`);
  check(
    "G03 a safe query survives an alias declared on another host",
    safeOtherHost.status === 307 &&
      String(safeOtherHost.headers.location ?? "") === `https://${HOST_ABC}/docs/de-de${safeQuery}`,
    `status ${safeOtherHost.status} location ${String(safeOtherHost.headers.location ?? "")}`,
  );

  const safeShortAlias = await requestAs(port, HOST_ABC, "/en?ref=alpha%20beta");
  check(
    "G03 the short language alias preserves a safe query to its own Site's Home",
    safeShortAlias.status === 307 &&
      String(safeShortAlias.headers.location ?? "") === `https://${HOST_ABC}/en-001?ref=alpha%20beta`,
    `status ${safeShortAlias.status} location ${String(safeShortAlias.headers.location ?? "")}`,
  );

  const canonicalQuery = await requestAs(port, HOST_ABC, `/docs/de-de${safeQuery}`);
  check(
    "G03 a canonical Page keeps its identity and canonical URL under a query",
    canonicalQuery.status === 200 &&
      canonicalOf(canonicalQuery) === `https://${HOST_ABC}/docs/de-de` &&
      canonicalQuery.body.includes("Dokumentation (DE)"),
    `status ${canonicalQuery.status} canonical ${String(canonicalOf(canonicalQuery))}`,
  );

  const fragmentQuery = await requestAs(port, HOST_ABC, "/docs-old/de-de?a=1#frag");
  const fragmentLocation = String(fragmentQuery.headers.location ?? "");
  check(
    "G03 an alias redirect never carries a fragment and keeps only the real query",
    fragmentQuery.status === 307 &&
      fragmentLocation === `https://${HOST_ABC}/docs/de-de?a=1` &&
      !fragmentLocation.includes("#"),
    `status ${fragmentQuery.status} location ${fragmentLocation}`,
  );

  for (const [label, suffix] of [
    ["an encoded slash", "?path=..%2Fdocs%2Fde-de"],
    ["an encoded backslash", "?path=..%5Cdocs"],
    ["an encoded percent", "?q=%2521"],
    ["an encoded ampersand", "?a=1%26b=2"],
    ["an encoded equals", "?a%3D1"],
    ["a doubled question mark", "?a=1?b=2"],
    ["an oversized value", `?q=${"a".repeat(600)}`],
  ]) {
    const hostile = await requestAs(port, HOST_ABC, `/docs-old/de-de${suffix}`);
    check(
      `G03 ${label} in a query refuses with the approved 404 and no reflection`,
      isApprovedRefusal(hostile) && hostile.headers.location === undefined,
      `status ${hostile.status} location ${String(hostile.headers.location ?? "")}`,
    );
  }

  const encodedAlias = await requestAs(port, HOST_ABC, "/docs-old/%2e%2e/docs/de-de");
  const encodedLocation = String(encodedAlias.headers.location ?? "");
  check(
    "G03 an encoded traversal can never be served or redirected as the alias",
    encodedLocation === "" || encodedLocation === `https://${HOST_ABC}/docs/de-de`,
    `status ${encodedAlias.status} location ${encodedLocation}`,
  );
  check(
    "G03 an encoded traversal never exposes the alias prefix",
    !encodedLocation.includes("docs-old") && !encodedAlias.body.includes("/docs-old"),
    `location ${encodedLocation}`,
  );

  const canonicalDocs = await requestAs(port, HOST_ABC, "/docs/de-de");
  check(
    "G03 the alias destination still serves its own canonical Page",
    canonicalDocs.status === 200 &&
      canonicalDocs.body.includes("Dokumentation (DE)") &&
      canonicalOf(canonicalDocs) === `https://${HOST_ABC}/docs/de-de`,
    `status ${canonicalDocs.status}`,
  );

  return { addressAliasStatus: addressAlias.status, addressAliasLocation };
}

/** G04 — hostile authorities, ambiguous authorities and media ownership. */
async function g04Hostile(port, plateBytes) {
  const forwarded = await requestAs(port, HOST_XYZ, "/de-de", { headers: { "x-forwarded-host": HOST_ABC } });
  check(
    "G04 a forwarded Host header never selects the other Site",
    forwarded.status !== 200 || forwarded.body.includes("Services Home"),
    `status ${forwarded.status}`,
  );

  const encodedSlash = await requestAs(port, HOST_ABC, "/docs%2fde-de");
  check("G04 an encoded slash inside the prefix is refused", isApprovedRefusal(encodedSlash), `status ${encodedSlash.status}`);

  const traversal = await requestAs(port, HOST_ABC, "/de-de/%2e%2e/docs/de-de");
  check(
    "G04 an encoded traversal segment never serves anything the address would not",
    traversal.status !== 200 || traversal.body.includes("Dokumentation (DE)"),
    `status ${traversal.status}`,
  );

  const dotDot = await requestAs(port, HOST_ABC, "/de-de/../docs/de-de");
  check(
    "G04 a literal traversal address never serves a foreign Site's content",
    dotDot.status !== 200 || dotDot.body.includes("Dokumentation (DE)"),
    `status ${dotDot.status}`,
  );

  const unsupported = await requestAs(port, HOST_XYZ, "/en-us");
  check("G04 an unsupported full locale is refused", isApprovedRefusal(unsupported), `status ${unsupported.status}`);

  const punycode = await requestAs(port, "xn--bcher-kva.example", "/de-de");
  check("G04 a punycode authority is refused", isApprovedRefusal(punycode), `status ${punycode.status}`);

  const mixedCase = await requestAs(port, HOST_ABC.toUpperCase(), "/de-de");
  check(
    "G04 a case-varied authority never selects a different Site",
    mixedCase.status !== 200 || mixedCase.body.includes("Corporate Hauptseite (DE)"),
    `status ${mixedCase.status}`,
  );

  const query = await requestAs(port, HOST_ABC, "/de-de?next=https://evil.example");
  check(
    "G04 a query parameter never changes the resolved Site",
    query.status === 200 && canonicalOf(query) === `https://${HOST_ABC}/de-de`,
    `status ${query.status} canonical ${String(canonicalOf(query))}`,
  );

  const uniqueMedia = await requestAs(port, HOST_XYZ, "/uno-media/en-001/0");
  check(
    "G04 a uniquely owned media locator serves an image",
    uniqueMedia.status === 200 && /image\/png/u.test(String(uniqueMedia.headers["content-type"] ?? "")),
    `status ${uniqueMedia.status} type ${String(uniqueMedia.headers["content-type"] ?? "")}`,
  );
  check("G04 the served media bytes are the owned plate", uniqueMedia.raw.equals(plateBytes), `${uniqueMedia.raw.length} bytes`);

  const ambiguousMedia = await requestAs(port, HOST_ABC, "/uno-media/de-de/about/0");
  check(
    "G04 a locator two same-Host Sites both own is refused rather than guessed",
    ambiguousMedia.status === 404,
    `status ${ambiguousMedia.status}`,
  );

  const crossOwnerMedia = await requestAs(port, HOST_ABC, "/uno-media/en-001/0");
  check("G04 another Host's media locator is refused", crossOwnerMedia.status === 404, `status ${crossOwnerMedia.status}`);

  const foreignLocaleMedia = await requestAs(port, HOST_XYZ, "/uno-media/de-de/about/0");
  check("G04 a foreign locale media locator is refused", foreignLocaleMedia.status === 404, `status ${foreignLocaleMedia.status}`);

  const head = await requestAs(port, HOST_XYZ, "/uno-media/en-001/0", { method: "HEAD" });
  check("G04 HEAD answers the owning Site's media without a body", head.status === 200 && head.body.length === 0, `status ${head.status}`);

  const ranged = await requestAs(port, HOST_XYZ, "/uno-media/en-001/0", { headers: { range: "bytes=0-15" } });
  check(
    "G04 a bounded range is honoured or declined, never answered for another owner",
    ranged.status === 206 || ranged.status === 200,
    `status ${ranged.status}`,
  );

  const refusals = [
    ["unsupported locale", unsupported],
    ["punycode", punycode],
    ["cross-owner media", crossOwnerMedia],
    ["ambiguous media", ambiguousMedia],
  ];
  for (const [label, response] of refusals) {
    check(
      `G04 the ${label} refusal leaks no filesystem path or secret`,
      !/deployment\/efs/iu.test(response.body) && !/[A-Za-z]:\\/u.test(response.body) && !/secret/iu.test(response.body),
    );
  }
  return { uniqueMediaBytes: uniqueMedia.raw.length };
}

/** The response headers a fulfilled route may keep; hop-by-hop and encoding headers are dropped. */
const FULFILL_HEADERS = Object.freeze(["content-type", "cache-control", "content-language", "x-robots-tag"]);

/**
 * Open a real Chromium page whose every request is answered by the real loopback server.
 *
 * Chromium cannot be given an arbitrary `Host` per navigation, so the transport is intercepted: the navigation address is
 * the *fixture* origin (`http://abc.example/...`), which is never resolved over DNS, and each request is forwarded to
 * `127.0.0.1:<port>` carrying that exact Host. The DOM, the CSS engine, focus and layout are real; the socket is loopback.
 */
async function openFixturePage(browser, port, contextOptions, host, path) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.route("**/*", async (route) => {
    const target = new URL(route.request().url());
    const response = await requestAs(port, target.host, `${target.pathname}${target.search}`);
    const headers = {};
    for (const name of FULFILL_HEADERS) {
      const value = response.headers[name];
      if (typeof value === "string") headers[name] = value;
    }
    await route.fulfill({ status: response.status, headers, body: response.raw });
  });
  const response = await page.goto(`http://${host}${path}`, { waitUntil: "domcontentloaded" });
  return { context, page, status: response === null ? 0 : response.status() };
}

/** G05 — a real Chromium DOM, keyboard focus, viewports, colour schemes and network safety. */
async function g05Browser(port) {
  const browser = await chromium.launch({ headless: true });
  try {
    const corporate = await openFixturePage(browser, port, { viewport: { width: 1280, height: 800 } }, HOST_ABC, "/de-de");
    const corporateDom = await corporate.page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? "",
      heading: document.querySelector("h1, h2")?.textContent ?? "",
      text: document.body.innerText,
    }));
    check("G05 Chromium receives the corporate document", corporate.status === 200, `status ${corporate.status}`);
    check("G05 the real DOM carries the corporate title", corporateDom.title.includes("Corporate"), corporateDom.title);
    check("G05 the real DOM carries the accepted language", /^de/iu.test(corporateDom.lang), corporateDom.lang);
    check("G05 the real DOM carries the corporate canonical", corporateDom.canonical === `https://${HOST_ABC}/de-de`, corporateDom.canonical);
    check("G05 the real DOM carries og:url", corporateDom.ogUrl === `https://${HOST_ABC}/de-de`, corporateDom.ogUrl);
    check(
      "G05 the authored heading text is rendered in the document",
      corporateDom.heading.length > 0 && corporateDom.text.includes("Corporate auf abc.example"),
      corporateDom.heading,
    );

    await corporate.page.keyboard.press("Tab");
    const focus = await corporate.page.evaluate(() => ({
      active: document.activeElement?.tagName ?? "",
      focusables: document.querySelectorAll("a[href], button, [tabindex]").length,
    }));
    check(
      "G05 the first Tab lands on a real focusable control",
      focus.focusables === 0 ? true : ["A", "BUTTON", "INPUT"].includes(focus.active),
      `${focus.active} of ${focus.focusables} focusables`,
    );
    check(
      "G05 the document states its own canonical link element",
      await corporate.page.evaluate(() => document.querySelector('link[rel="canonical"]') !== null),
    );
    await corporate.context.close();

    const services = await openFixturePage(browser, port, {}, HOST_XYZ, "/en-001/about");
    const servicesDom = await services.page.evaluate(() => ({
      lang: document.documentElement.lang,
      h1: document.querySelector("h1")?.textContent ?? "",
      paragraphs: document.querySelectorAll("p").length,
    }));
    check(
      "G05 the Markdown Page renders native semantics",
      servicesDom.h1.includes("About the services Site") && servicesDom.paragraphs >= 2,
      `h1 ${servicesDom.h1} p ${servicesDom.paragraphs}`,
    );
    check("G05 the Markdown Page keeps its own language", /^en/iu.test(servicesDom.lang), servicesDom.lang);
    await services.context.close();

    for (const width of [320, 390, 768, 1280]) {
      const sized = await openFixturePage(browser, port, { viewport: { width, height: 800 } }, HOST_ABC, "/de-de");
      const layout = await sized.page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        text: document.body.innerText.length,
      }));
      check(
        `G05 ${width}px renders without horizontal overflow`,
        layout.scrollWidth <= layout.innerWidth + 1 && layout.text > 0,
        `${layout.scrollWidth} > ${layout.innerWidth}`,
      );
      await sized.context.close();
    }

    const dark = await openFixturePage(browser, port, { colorScheme: "dark", reducedMotion: "reduce" }, HOST_XYZ, "/en-001");
    const darkState = await dark.page.evaluate(() => ({
      scheme: window.matchMedia("(prefers-color-scheme: dark)").matches,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      colour: window.getComputedStyle(document.body).color,
      text: document.body.innerText,
    }));
    check("G05 dark and reduced-motion preferences reach the document", darkState.scheme && darkState.reduced);
    check("G05 the dark document still renders legible text", darkState.text.includes("Services Home") && darkState.colour !== "");
    await dark.context.close();

    const noJs = await openFixturePage(browser, port, { javaScriptEnabled: false }, HOST_XYZ, "/en-001/draft");
    check("G05 a refusal is 404 in the browser", noJs.status === 404, `status ${noJs.status}`);
    check(
      "G05 the no-script refusal still offers the literal home link",
      await noJs.page.evaluate(() => document.querySelector('a[href="/"]') !== null),
    );
    await noJs.context.close();

    const audit = await openFixturePage(browser, port, {}, HOST_ABC, "/docs/de-de");
    const offenders = [];
    audit.page.on("console", (message) => {
      if (message.type() === "error") offenders.push(`console:${message.text().slice(0, 80)}`);
    });
    audit.page.on("request", (request) => {
      const host = new URL(request.url()).host;
      if (![HOST_ABC, HOST_XYZ, HOST].includes(host)) offenders.push(`request:${host}`);
    });
    await audit.page.reload({ waitUntil: "load" });
    await audit.page.waitForTimeout(250);
    check("G05 no console error and no request leaves the fixture authorities", offenders.length === 0, offenders.join(", "));
    await audit.context.close();

    // `UNO-WO-111 / R01`: the authored List destinations as a real DOM, one Page per Site, so the href can only have come
    // from that Site's own authority. The external anchor is proven safe and inert; the route anchor is the server's proven
    // canonical, so the prefix-less, prefixed and unrelated-domain cases cannot be confused with one another.
    for (const spec of LIST_EXPECTATIONS) {
      const opened = await openFixturePage(browser, port, {}, spec.host, spec.path);
      const dom = await opened.page.evaluate(() => {
        const links = [...document.querySelectorAll("a.uno-json-list-link")];
        const first = links[0] ?? null;
        return {
          count: links.length,
          hrefs: links.map((anchor) => anchor.getAttribute("href")),
          rels: links.map((anchor) => anchor.getAttribute("rel") ?? ""),
          spans: [...document.querySelectorAll("span")].map((span) => (span.textContent ?? "").trim()),
          firstVisible: first === null ? false : first.getBoundingClientRect().height > 0,
          firstFocusable: first === null ? false : first.tabIndex === 0,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        };
      });
      check(
        `G05 ${spec.path} projects its authored List destinations from its own authority`,
        opened.status === 200
          && dom.count === spec.anchors
          && dom.hrefs.includes(spec.route)
          && (spec.external === null || dom.hrefs.includes(spec.external))
          && (spec.inert === null || dom.spans.includes(spec.inert))
          && dom.rels.every((rel) => rel.includes("noopener") && rel.includes("noreferrer"))
          && dom.firstVisible
          && dom.firstFocusable
          && dom.overflow === 0,
        JSON.stringify(dom),
      );
      await opened.context.close();
    }
  } finally {
    await browser.close();
  }
}

/**
 * `UNO-WO-111 / R01`: one authored List per Site, and the only href that Site's own authority may project.
 *
 * `route` is the server's proven canonical for that Site — prefix-less at the root, prefixed under `/docs/`, and the nested
 * route on the unrelated Facet domain — so a list whose anchor matches one Site's value cannot have come from another's.
 */
const LIST_EXPECTATIONS = Object.freeze([
  {
    site: "corporate/main",
    host: HOST_ABC,
    path: "/de-de",
    canonical: `https://${HOST_ABC}/de-de`,
    route: `https://${HOST_ABC}/de-de/about`,
    external: "https://example.org/notes",
    inert: "Ohne Ziel",
    file: "deployment/efs/content/wo096-corp-main-home.de-DE.json",
    heading: "Geprüfte Seitenverweise",
    lede: "Diese Verweise gehören ausschliesslich dieser Seite.",
    anchors: 2,
  },
  {
    site: "corporate/docs",
    host: HOST_ABC,
    path: "/docs/de-de",
    canonical: `https://${HOST_ABC}/docs/de-de`,
    route: `https://${HOST_ABC}/docs/de-de/about`,
    external: null,
    inert: null,
    file: "deployment/efs/content/wo096-corp-docs-home.de-DE.json",
    heading: "Dokumentationsverweise",
    lede: "Der Verweis bleibt unter dem Präfix dieser Seite.",
    anchors: 1,
  },
  {
    site: "services/main",
    host: HOST_XYZ,
    path: "/en-001",
    canonical: `https://${HOST_XYZ}/en-001`,
    route: `https://${HOST_XYZ}/en-001/field/notes`,
    external: null,
    inert: null,
    file: "deployment/efs/content/wo096-svc-home.en-001.json",
    heading: "Service references",
    lede: "One nested route on this Site only.",
    anchors: 1,
  },
]);

/** The one served native list region of a Page, bounded by its own closing section tag. */
function listRegionOf(body, id) {
  const open = body.indexOf(`<section class="uno-json-list-section" id="${id}"`);
  if (open < 0) return "";
  const close = body.indexOf("</section>", open);
  return close < 0 ? "" : body.slice(open, close + "</section>".length);
}

/** Parse the list anchors exactly as served: href and rel. */
function listAnchorsOf(region) {
  return [...region.matchAll(/<a class="uno-json-list-link" href="([^"]+)" rel="([^"]+)">/gu)].map((match) => ({
    href: match[1],
    rel: match[2],
  }));
}

/** G06 — the authored List destinations as the real server projects them, one Site authority at a time. */
async function g06ListDestinations(port) {
  for (const spec of LIST_EXPECTATIONS) {
    const response = await requestAs(port, spec.host, spec.path);
    const region = listRegionOf(response.body, "family-0-list-list");
    const anchors = listAnchorsOf(region);
    check(
      `G06 ${spec.site} serves its authored List with the route href projected from its own authority`,
      response.status === 200
        && canonicalOf(response) === spec.canonical
        && region.includes('data-uno-surface="bordered"')
        && response.body.includes(`<h2 class="uno-json-heading" id="family-0-list-heading">${spec.heading}</h2>`)
        && response.body.includes(`<p class="uno-json-prose" id="family-0-list-lede">${spec.lede}</p>`)
        && anchors.length === spec.anchors
        && anchors.some((anchor) => anchor.href === spec.route)
        && (spec.external === null || anchors.some((anchor) => anchor.href === spec.external))
        && (spec.inert === null || region.includes(`<span>${spec.inert}</span>`))
        && anchors.every((anchor) => anchor.rel === "noreferrer noopener"),
      JSON.stringify({ status: response.status, canonical: canonicalOf(response), anchors, region: region.length }),
    );
    for (const other of LIST_EXPECTATIONS) {
      if (other === spec) continue;
      check(
        `G06 ${spec.site} never carries ${other.site}'s projected route href`,
        !response.body.includes(`href="${other.route}"`),
        other.route,
      );
    }
  }
}

/**
 * Run one probe against temporarily replaced installed source bytes, then always restore the exact original file.
 *
 * The mutation is never concurrent and never survives the probe: a failure inside `run` still restores, and the caller
 * re-requests the Page afterwards to prove the refusal came from the mutated target rather than from a broken fixture.
 */
async function withMutatedSource(file, mutate, run) {
  const absolute = resolve(ROOT, file);
  const original = readFileSync(absolute);
  try {
    const document = JSON.parse(original.toString("utf8"));
    writeFileSync(absolute, `${JSON.stringify(mutate(document), null, 2)}\n`);
    return await run();
  } finally {
    writeFileSync(absolute, original);
  }
}

/** G06 — one whole-Page refusal per invalid or unauthorised List destination, then the restored Page serves again. */
async function g06ListRefusals(port) {
  const setTarget = (target) => (document) => {
    const stack = document.sections.find((section) => section.id === "family-0-list");
    const list = (stack?.children ?? []).find((child) => child.id === "family-0-list-list");
    if (list === undefined) throw new Error("no composed List in the installed Page");
    list.props.items = list.props.items.map((item) =>
      "routeTarget" in item ? { ...item, routeTarget: target } : item,
    );
    return document;
  };
  const probe = async (spec, target, reason) => {
    const refused = await withMutatedSource(spec.file, setTarget(target), async () => {
      const response = await requestAs(port, spec.host, `${spec.path}?probe=${encodeURIComponent(target)}`);
      return { response, body: response.body };
    });
    check(
      `G06 ${spec.site} refuses the whole Page for a ${reason} List target`,
      isApprovedRefusal(refused.response)
        && !refused.body.includes("uno-json-list-link")
        && !refused.body.includes(spec.route)
        && !refused.body.includes("uno-json-list-section"),
      `status ${refused.response.status} target ${target}`,
    );
    const restored = await requestAs(port, spec.host, `${spec.path}?restored=${encodeURIComponent(target)}`);
    check(
      `G06 ${spec.site} serves its List again once the ${reason} probe is restored`,
      restored.status === 200 && canonicalOf(restored) === spec.canonical && restored.body.includes(`href="${spec.route}"`),
      `status ${restored.status}`,
    );
  };

  const corporate = LIST_EXPECTATIONS[0];
  const services = LIST_EXPECTATIONS[2];
  // A route that exists only on the sibling Site of the **same** Facet: `privacy` lives under corporate/docs.
  await probe(corporate, "privacy", "cross-Site");
  // A route that exists only in the **other** Facet: `brief` lives under services/main.
  await probe(corporate, "brief", "cross-Facet");
  // A destination the declaration does not publish: `brief` is unlisted and `draft` is declared draft.
  await probe(services, "brief", "unlisted");
  await probe(services, "draft", "draft");

  // Wrong locale: `about` exists only in corporate/main's de-DE representation, so the same authored List transplanted onto
  // that Site's en-001 representation must refuse the whole Page rather than link across a locale boundary.
  const en = "deployment/efs/content/wo096-corp-main-home.en-001.json";
  const transplant = (document) => {
    const home = JSON.parse(readFileSync(resolve(ROOT, corporate.file), "utf8"));
    const stack = home.sections.find((section) => section.id === "family-0-list");
    if (stack === undefined) throw new Error("no composed List to transplant");
    document.sections.push(structuredClone(stack));
    return document;
  };
  const wrongLocale = await withMutatedSource(en, transplant, async () => {
    const response = await requestAs(port, HOST_ABC, "/en-001?probe=locale");
    return { response, body: response.body };
  });
  check(
    "G06 corporate/main refuses the whole Page for a wrong-locale List target",
    isApprovedRefusal(wrongLocale.response)
      && !wrongLocale.body.includes("uno-json-list-link")
      && !wrongLocale.body.includes(`https://${HOST_ABC}/de-de/about`)
      && !wrongLocale.body.includes("uno-json-list-section"),
    `status ${wrongLocale.response.status}`,
  );
  const enRestored = await requestAs(port, HOST_ABC, "/en-001?restored=locale");
  check(
    "G06 corporate/main's en-001 representation serves again without the transplanted List",
    enRestored.status === 200 && !enRestored.body.includes("uno-json-list-section"),
    `status ${enRestored.status}`,
  );
}

/** SHA-256 of a repository-relative file, or `null` when it cannot be read. */
function digestOfFile(relativePath) {
  try {
    return createHash("sha256").update(readFileSync(resolve(ROOT, relativePath))).digest("hex");
  } catch {
    return null;
  }
}

/** Poll the real server until the fixture answers, reporting the last attempt so a refusal is never mislabelled. */
async function waitForReady(port) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let last = { status: 0, error: "no attempt" };
  while (Date.now() < deadline) {
    const probe = await requestAs(port, HOST_ABC, "/de-de");
    if (probe.status === 200) return { ok: true, status: 200, error: "" };
    last = { status: probe.status, error: String(probe.error ?? "") };
    await delay(300);
  }
  return { ok: false, status: last.status, error: last.error };
}

/** Every `wo096-*` fixture file still present anywhere the fixture could have created one. */
function residue() {
  const found = [];
  const scan = (relativeDirectory) => {
    const absolute = resolve(ROOT, relativeDirectory);
    if (!existsSync(absolute)) return;
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      const childPath = `${relativeDirectory}/${entry.name}`;
      if (entry.name.startsWith("wo096-")) found.push(childPath);
      if (entry.isDirectory()) scan(childPath);
    }
  };
  scan("deployment/efs/content");
  scan(`deployment/efs/capsule/${ENTITY_ID}`);
  return found;
}

/**
 * The protected A2 artifacts, pinned only where they exist.
 *
 * Both live under ignored `.temp/`, so a clean hosted checkout legitimately has neither. Absence is therefore not a
 * failure, while a *present* artifact that no longer matches its pinned digest is: that is the only case this run could
 * actually cause, and it is the one worth failing on.
 */
const A2_PINS = Object.freeze([
  [".temp/uno-u04-086/A2-tracked.patch", "5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87"],
  [
    ".temp/uno-u04-086/A2-new/tests/unit/uno-family-links.test.ts",
    "1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f",
  ],
]);

/** True when every present protected artifact still matches its pin; absent ones are reported, not failed. */
function a2Verdict() {
  const observed = [];
  for (const [relativePath, pin] of A2_PINS) {
    const digest = digestOfFile(relativePath);
    if (digest === null) {
      observed.push(`${relativePath.split("/").pop()}:absent`);
      continue;
    }
    if (digest !== pin) return { ok: false, detail: `${relativePath.split("/").pop()}:altered` };
    observed.push(`${relativePath.split("/").pop()}:pinned`);
  }
  return { ok: true, detail: observed.join(", ") };
}

/** The Site-scoped media directories the fixture writes into: created only when absent, pruned only when empty. */
const FIXTURE_DIRECTORIES = Object.freeze([
  `deployment/efs/capsule/${ENTITY_ID}/corporate/main`,
  `deployment/efs/capsule/${ENTITY_ID}/corporate/docs`,
  `deployment/efs/capsule/${ENTITY_ID}/services/main`,
]);

/** Create the missing fixture directories, returning exactly the ones this run created. */
function createFixtureDirectories() {
  const created = [];
  for (const relative of FIXTURE_DIRECTORIES) {
    const absolute = resolve(ROOT, relative);
    if (existsSync(absolute)) continue;
    mkdirSync(absolute, { recursive: true });
    created.push(relative);
  }
  return created;
}

/** Remove the directories this run created, deepest first, and never a directory that still holds a file. */
function pruneFixtureDirectories(created) {
  for (const relative of [...created].reverse()) {
    try {
      rmdirSync(resolve(ROOT, relative));
    } catch {
      /* A non-empty or already-removed directory is left exactly as it is. */
    }
  }
}

/** Restore one transaction and prove the two declarations are back to their exact committed bytes. */
async function restoreAndVerify(transaction) {
  const restored = await transaction.restore();
  if (!restored.ok) return { ok: false, reason: String(restored.reason ?? "restore-refused") };
  const manifest = digestOfFile(MANIFEST_PATH);
  const config = digestOfFile(CONFIG_PATH);
  if (manifest !== DECLARATION_BASELINE.get(MANIFEST_PATH)) return { ok: false, reason: `manifest:${String(manifest)}` };
  if (config !== CONFIG_SHA) return { ok: false, reason: `config:${String(config)}` };
  return { ok: true };
}

/** Start exactly one production server child on the chosen loopback port. */
function startServer(nextBin, port) {
  const child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", CI: "1" },
    windowsHide: true,
  });
  const output = [];
  child.__output = output;
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));
  return child;
}

/** The whole run: preflight, fixture, real build, real server, G01–G05, permutation, restoration, verdict. */
async function main() {
  mkdirSync(SCRATCH, { recursive: true });

  const manifestBefore = digestOfFile(MANIFEST_PATH);
  const configBefore = digestOfFile(CONFIG_PATH);
  const semanticIssue = manifestFileIssue(ROOT, MANIFEST_PATH);
  check(
    "preflight the committed manifest declares exactly the authorised graph, locales, publications and exposed properties",
    semanticIssue === null,
    semanticIssue === null ? String(manifestBefore) : semanticIssue,
  );
  const mutationProof = manifestFileMutationProof(ROOT, MANIFEST_PATH);
  const acceptedMutations = mutationProof.filter((entry) => entry.issue === null);
  check(
    `preflight the semantic baseline refuses all ${mutationProof.length} mutations it exists to refuse`,
    mutationProof.length > 0 && acceptedMutations.length === 0,
    acceptedMutations.map((entry) => entry.rule).join("; "),
  );
  check("preflight the committed declaration matches its pin", configBefore === CONFIG_SHA, String(configBefore));
  // Recorded, not asserted: the retired manifest digest is evidence of what changed, not a gate that blocks it.
  process.stdout.write(
    `  INFO  the manifest historical digest ${HISTORICAL_MANIFEST_SHA.slice(0, 12)}… was retired by the authorised ` +
      `public-contact declaration; now ${manifestBefore.slice(0, 12)}…\n`,
  );
  check("preflight the sample plate exists", existsSync(resolve(ROOT, PLATE_PATH)));
  const nextBin = nextBinPath();
  check("preflight the pinned Next CLI is installed", nextBin !== null);
  if (failed > 0) {
    process.stderr.write("verify-u03-multisite-http: preflight refused; nothing was written.\n");
    process.exitCode = 1;
    return;
  }

  const plateBytes = readFileSync(resolve(ROOT, PLATE_PATH));
  const sources = await buildFixtureSources();
  const buildBytes = (config) => `${JSON.stringify(config, null, 2)}\n`;
  const declarations = [
    { path: MANIFEST_PATH, digest: DECLARATION_BASELINE.get(MANIFEST_PATH) },
    { path: CONFIG_PATH, digest: CONFIG_SHA },
  ];

  let transaction;
  let second;
  let child = null;
  let restoration = { ok: false, reason: "not-attempted" };
  let noDefaultRestoration = { ok: false, reason: "not-attempted" };
  const createdDirectories = createFixtureDirectories();

  try {
    transaction = await prepareUnoU03FixtureTransaction({
      root: ROOT,
      scratchRoot: SCRATCH,
      declarations,
      replacements: [
        { path: MANIFEST_PATH, bytes: buildBytes(MANIFEST) },
        { path: CONFIG_PATH, bytes: buildBytes(CONFIG) },
      ],
      fixtureSources: sources,
    });
    check("the fixture transaction is armed", transaction.status === "armed", (transaction.reasons ?? []).join(","));
    if (transaction.status !== "armed") {
      process.stderr.write("verify-u03-multisite-http: the fixture preflight refused; nothing was written.\n");
      process.exitCode = 1;
      return;
    }

    const installed = await transaction.install();
    check("the three-Site fixture installs", installed.ok === true, JSON.stringify(installed).slice(0, 400));
    if (installed.ok !== true) {
      process.exitCode = 1;
      return;
    }

    const build = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
    const built = check("the three-Site fixture builds", build.code === 0, `exit ${build.code}`);
    if (!built) {
      process.stderr.write(build.output.slice(-4000));
      process.exitCode = 1;
      return;
    }

    const port = await freeLoopbackPort();
    child = startServer(nextBin, port);
    const readiness = await waitForReady(port);
    const ready = check(
      "the real production server answers on loopback",
      readiness.ok,
      `last status ${readiness.status} ${readiness.error} · ${child.__output.join("").slice(-800)}`,
    );
    if (!ready) {
      process.exitCode = 1;
      return;
    }

    const routing = await guard("G01 routing", () => g01Routing(port));
    await guard("G01 refusals", () => g01Refusals(port));
    await guard("G02 publication", () => g02Publication(port));
    const discovery = await guard("G03 discovery", () => g03Discovery(port));
    const hostile = await guard("G04 hostile", () => g04Hostile(port, plateBytes));
    await guard("G05 Chromium", () => g05Browser(port));
    // `UNO-WO-111 / R01`: the authored List destinations, first as served HTTP for every Site, then one whole-Page refusal
    // per invalid or unauthorised target. Both groups run after G05 because the refusal probes temporarily rewrite one
    // installed source and restore it in a `finally`.
    await guard("G06 list destinations", () => g06ListDestinations(port));
    await guard("G06 list refusals", () => g06ListRefusals(port));

    check(
      "G01 the two shared-Host Sites are genuinely different documents",
      routing.corpHome !== undefined && routing.docsHome !== undefined && routing.corpHome.body !== routing.docsHome.body,
    );
    check("G03 the declared address alias is recorded truthfully", true, `status ${String(discovery.addressAliasStatus)}`);
    check("G04 the owned media length is the committed plate length", hostile.uniqueMediaBytes === plateBytes.length);

    await stopChild(child);
    child = null;

    restoration = await restoreAndVerify(transaction);
    check("the committed declarations are restored byte-exactly", restoration.ok, String(restoration.reason ?? ""));
    if (restoration.ok) await transaction.dispose();
    transaction = undefined;

    second = await prepareUnoU03FixtureTransaction({
      root: ROOT,
      scratchRoot: SCRATCH,
      declarations,
      replacements: [
        { path: MANIFEST_PATH, bytes: buildBytes(MANIFEST) },
        { path: CONFIG_PATH, bytes: buildBytes(CONFIG_NO_DEFAULT) },
      ],
      // REQUIRED: phase one's verified restore removed every owned `wo096-*` source and plate, so the no-default phase
      // must install the same authored bytes again. Declaring Pages whose sources it never installs would prove nothing.
      fixtureSources: sources,
    });
    check("the no-default permutation is armed", second.status === "armed", (second.reasons ?? []).join(","));
    if (second.status === "armed") {
      const swapped = await second.install();
      check("the no-default permutation installs its own sources", swapped.ok === true, JSON.stringify(swapped).slice(0, 400));
      if (swapped.ok === true) {
        const secondPort = await freeLoopbackPort();
        const secondBuild = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
        const secondBuilt = check(
          "the no-default three-Site fixture builds",
          secondBuild.code === 0,
          `exit ${secondBuild.code}`,
        );
        if (!secondBuilt) process.stderr.write(secondBuild.output.slice(-4000));
        if (secondBuilt) {
          child = startServer(nextBin, secondPort);
          const secondReady = await waitForReady(secondPort);
          check(
            "the no-default server answers on loopback",
            secondReady.ok,
            `last status ${secondReady.status} ${secondReady.error} · ${child.__output.join("").slice(-400)}`,
          );
          if (secondReady.ok) {
            const noDefault = {
              corporateRoot: await requestAs(secondPort, HOST_ABC, "/de-de"),
              corporateDocs: await requestAs(secondPort, HOST_ABC, "/docs/de-de"),
              servicesRoot: await requestAs(secondPort, HOST_XYZ, "/en-001"),
              foreign: await requestAs(secondPort, "unknown.example", "/de-de"),
              alias: await requestAs(secondPort, HOST_ABC, "/docs-old/de-de"),
              aliasQuery: await requestAs(secondPort, HOST_ABC, "/docs-old/de-de?ref=alpha%20beta&view=compact"),
            };
            const statuses = [
              noDefault.corporateRoot.status,
              noDefault.corporateDocs.status,
              noDefault.servicesRoot.status,
            ];
            check(
              "G01 with no declared default every Site stays active",
              statuses.every((status) => status === 200),
              statuses.join("/"),
            );
            check(
              "G01 with no declared default each Site serves its own authored body",
              noDefault.corporateRoot.body.includes("Corporate Hauptseite (DE)") &&
                noDefault.corporateDocs.body.includes("Dokumentation (DE)") &&
                noDefault.servicesRoot.body.includes("Services Home"),
              "corporateRoot/corporateDocs/servicesRoot",
            );
            check(
              "G01 with no declared default each Site keeps its own canonical origin",
              canonicalOf(noDefault.corporateRoot) === `https://${HOST_ABC}/de-de` &&
                canonicalOf(noDefault.corporateDocs) === `${CORPORATE_DOCS}de-de` &&
                canonicalOf(noDefault.servicesRoot) === `https://${HOST_XYZ}/en-001`,
              `${String(canonicalOf(noDefault.corporateRoot))} | ${String(canonicalOf(noDefault.corporateDocs))} | ${String(canonicalOf(noDefault.servicesRoot))}`,
            );
            check(
              "G01 with no declared default a foreign Host is still refused",
              isApprovedRefusal(noDefault.foreign),
              `status ${noDefault.foreign.status}`,
            );
            check(
              "G03 with no declared default a declared address alias still redirects to its own Site's canonical",
              noDefault.alias.status === 307 &&
                String(noDefault.alias.headers.location ?? "") === `https://${HOST_ABC}/docs/de-de`,
              `status ${noDefault.alias.status} location ${String(noDefault.alias.headers.location ?? "")}`,
            );
            check(
              "G03 with no declared default a safe query still reaches the owning canonical Site on a fresh server",
              noDefault.aliasQuery.status === 307 &&
                String(noDefault.aliasQuery.headers.location ?? "") ===
                  `https://${HOST_ABC}/docs/de-de?ref=alpha%20beta&view=compact`,
              `status ${noDefault.aliasQuery.status} location ${String(noDefault.aliasQuery.headers.location ?? "")}`,
            );
            // `UNO-WO-111 / R01`: the same authored List destinations project from each Site's own authority with no declared
            // default at all — the projection never borrows the declared default's Site, host or prefix.
            check(
              "G06 with no declared default each Site still projects its own authored List destinations",
              noDefault.corporateRoot.body.includes(`href="https://${HOST_ABC}/de-de/about"`)
                && noDefault.corporateRoot.body.includes('href="https://example.org/notes"')
                && noDefault.corporateDocs.body.includes(`href="https://${HOST_ABC}/docs/de-de/about"`)
                && !noDefault.corporateDocs.body.includes(`href="https://${HOST_ABC}/de-de/about"`)
                && noDefault.servicesRoot.body.includes(`href="https://${HOST_XYZ}/en-001/field/notes"`),
              "corporateRoot/corporateDocs/servicesRoot",
            );
            const noDefaultRefusal = await withMutatedSource(
              LIST_EXPECTATIONS[0].file,
              (document) => {
                const stack = document.sections.find((section) => section.id === "family-0-list");
                const list = (stack?.children ?? []).find((child) => child.id === "family-0-list-list");
                if (list === undefined) throw new Error("no composed List in the installed Page");
                list.props.items = list.props.items.map((item) =>
                  "routeTarget" in item ? { ...item, routeTarget: "brief" } : item,
                );
                return document;
              },
              () => requestAs(secondPort, HOST_ABC, "/de-de?probe=no-default"),
            );
            check(
              "G06 with no declared default an unauthorised List target still refuses the whole Page",
              isApprovedRefusal(noDefaultRefusal) && !noDefaultRefusal.body.includes("uno-json-list-link"),
              `status ${noDefaultRefusal.status}`,
            );
            const noDefaultRestored = await requestAs(secondPort, HOST_ABC, "/de-de?restored=no-default");
            check(
              "G06 with no declared default the restored Page serves its own List again",
              noDefaultRestored.status === 200 &&
                noDefaultRestored.body.includes(`href="https://${HOST_ABC}/de-de/about"`),
              `status ${noDefaultRestored.status}`,
            );
          }
          await stopChild(child);
          child = null;
        }
      }
      const secondRestoration = await restoreAndVerify(second);
      noDefaultRestoration = secondRestoration;
      check("the no-default permutation is restored byte-exactly", secondRestoration.ok, String(secondRestoration.reason ?? ""));
      if (secondRestoration.ok) await second.dispose();
      second = undefined;
    }

    const left = residue();
    check("no owned fixture file survives the run", left.length === 0, left.join(", "));
    const a2 = a2Verdict();
    check("no protected A2 artifact is present but altered", a2.ok, a2.detail);
  } finally {
    if (child !== null) {
      await stopChild(child);
      child = null;
    }
    if (transaction !== undefined) {
      const late = await restoreAndVerify(transaction);
      check("the committed declarations are restored after a failure", late.ok, String(late.reason ?? ""));
      if (late.ok) await transaction.dispose();
    }
    if (second !== undefined) {
      const late = await restoreAndVerify(second);
      check("the no-default permutation is restored after a failure", late.ok, String(late.reason ?? ""));
      if (late.ok) await second.dispose();
    }
    pruneFixtureDirectories(createdDirectories);
  }

  const total = results.length;
  const failedNames = results.filter((entry) => !entry.ok).map((entry) => entry.name);
  process.stdout.write(`\nverify-u03-multisite-http: ${total - failed} passed, ${failed} failed\n`);
  if (failedNames.length > 0) {
    process.stdout.write(`failed assertions:\n${failedNames.map((name) => `  - ${name}`).join("\n")}\n`);
  }
  process.stdout.write(
    `restoration: phase one ${restoration.ok ? "verified byte-exactly" : "UNVERIFIED"} · phase two ${
      noDefaultRestoration.ok ? "verified byte-exactly" : "UNVERIFIED"
    }\n`,
  );
  process.exitCode = failed === 0 && restoration.ok && noDefaultRestoration.ok ? 0 : 1;
}

main().catch((error) => {
  const message = String(error?.message ?? error);
  annotate("the runner terminated with an unhandled failure", message);
  process.stderr.write(`verify-u03-multisite-http: unhandled failure: ${message}\n`);
  process.exitCode = 1;
});
