import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

import { inspectTrace } from "../../scripts/verify-u03-trace.mjs";

/**
 * Foundation Uno — bounded file-trace inspector fixtures (`UNO-WO-033 / R01`).
 *
 * Every case below is synthetic: a temporary root with its own declarations and `.nft.json` files. Nothing
 * here reads the real repository, the network or a provider. Each refusal is proven by a fixture that only
 * that rule can catch, so an inspector that always passed — or one that merely searched build log text —
 * could not satisfy this file.
 */

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const SCRATCH_BASE = resolve(ROOT, ".temp");
const MANIFEST = "deployment/efs/manifest.json";
const SELECTION = "deployment/uno.config.json";
const CONTENT = "deployment/efs/content";

/** One published Page with two authored sources, as the fixture build declares it. */
const PUBLISHED_MANIFEST = {
  entities: [
    {
      id: "e_7a3knkx60eacyhca7a0cr1k6e1",
      facets: [
        {
          id: "foundation",
          sites: [
            {
              id: "main",
              pages: [
                {
                  id: "events",
                  publication: "published",
                  route: ["programmes", "events"],
                  representations: [
                    {
                      locale: "en-001",
                      sources: [{ kind: "markdown", path: `${CONTENT}/wo032-events.en-001.md` }],
                    },
                    {
                      locale: "de-DE",
                      sources: [{ kind: "markdown", path: `${CONTENT}/wo032-events.de-de.md` }],
                    },
                  ],
                },
                {
                  id: "draft",
                  publication: "draft",
                  route: ["draft"],
                  representations: [{ locale: "en-001", sources: [{ kind: "markdown", path: `${CONTENT}/draft.en-001.md` }] }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** The committed, unpublished manifest: one Page, no publication. */
const COMMITTED_MANIFEST = {
  entities: [
    {
      id: "e_7a3knkx60eacyhca7a0cr1k6e1",
      facets: [
        {
          id: "foundation",
          sites: [
            {
              id: "main",
              pages: [
                {
                  id: "home",
                  publication: null,
                  route: ["home"],
                  representations: [{ locale: "en-001", sources: [{ kind: "markdown", path: `${CONTENT}/home.en-001.md` }] }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** A temporary synthetic project root plus a `.next` build directory. */
function makeRoot({ manifest = COMMITTED_MANIFEST, declarations = true } = {}) {
  const root = mkdtempSync(resolve(SCRATCH_BASE, "wo033-trace-"));
  mkdirSync(resolve(root, "deployment/efs"), { recursive: true });
  mkdirSync(resolve(root, CONTENT), { recursive: true });
  mkdirSync(resolve(root, ".next/server/app"), { recursive: true });
  if (declarations) {
    writeFileSync(resolve(root, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    writeFileSync(resolve(root, SELECTION), `${JSON.stringify({ version: 1 }, null, 2)}\n`, "utf8");
  }
  return root;
}

/** Write one `.nft.json` under `<root>/.next/server/app/<name>`, entries taken verbatim. */
function writeTrace(root, name, entries) {
  const directory = resolve(root, ".next/server/app");
  mkdirSync(directory, { recursive: true });
  const file = resolve(directory, `${name}.js.nft.json`);
  writeFileSync(file, JSON.stringify({ version: 1, files: entries }), "utf8");
  return file;
}

/** Entries pointing at a project-relative path from `.next/server/app`. */
function entriesFor(paths) {
  return paths.map((path) => `../../../${path}`);
}

/** A bounded, correct synthetic trace: the two declarations plus the authored Home source. */
function boundedEntries() {
  return entriesFor([MANIFEST, SELECTION, `${CONTENT}/home.en-001.md`]);
}

/** Inspect one synthetic root, cleaning it up afterwards. */
function inspect(root, options = {}) {
  try {
    return inspectTrace({ root, buildDir: resolve(root, ".next"), ...options });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** Assert exactly one closed reason. */
function assertRefused(result, code) {
  assert.equal(result.accepted, false, `expected refusal ${code}`);
  assert.deepEqual(result.reasons, [code]);
}

// --- Positive paths -------------------------------------------------------------------

test('accepts a bounded committed build: declarations traced, nothing else', () => {
  const root = makeRoot();
  writeTrace(root, "page", boundedEntries());
  const result = inspect(root);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.accepted, true);
  assert.equal(result.notes.manifests, 1);
  assert.equal(result.notes.projectEntries, 3);
});

test('accepts a bounded fixture build: every published source traced', () => {
  const root = makeRoot({ manifest: PUBLISHED_MANIFEST });
  writeTrace(
    root,
    "page",
    entriesFor([
      MANIFEST,
      SELECTION,
      `${CONTENT}/wo032-events.en-001.md`,
      `${CONTENT}/wo032-events.de-de.md`,
    ]),
  );
  const result = inspect(root, { expectPublishedSources: true });
  assert.deepEqual(result.reasons, []);
  assert.equal(result.accepted, true);
  assert.equal(result.notes.publishedSources, 2);
});

test('normalizes Windows separators to the same bounded inventory', () => {
  const root = makeRoot();
  writeTrace(root, "page", [
    "..\\..\\..\\deployment\\efs\\manifest.json",
    "..\\..\\..\\deployment\\uno.config.json",
    "..\\..\\..\\deployment\\efs\\content\\home.en-001.md",
  ]);
  const result = inspect(root);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.notes.projectEntries, 3);
});

// --- Negative paths: whole-project and private content --------------------------------

test('refuses a root-wide trace of project documentation and the test harness', () => {
  const root = makeRoot();
  writeTrace(root, "page", entriesFor([MANIFEST, SELECTION, "AGENTS.md", "tests/deployment/u03-trace.test.mjs"]));
  const result = inspect(root);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes("trace:forbidden-path"), true);
  assert.equal(result.reasons.includes("trace:private-path"), true);
});

test('refuses the private ACTIVE work order inside the payload', () => {
  const root = makeRoot();
  writeTrace(root, "page", [...boundedEntries(), "../../../.documents/WIP/workorder-active.md"]);
  assertRefused(inspect(root), "trace:private-path");
});

test('refuses task scratch and git internals in the payload', () => {
  for (const leaked of [".temp/wo033-build.log", ".git/config"]) {
    const root = makeRoot();
    writeTrace(root, "page", [...boundedEntries(), `../../../${leaked}`]);
    assertRefused(inspect(root), "trace:private-path");
  }
});

test('refuses scripts and the public folder in a server payload', () => {
  for (const leaked of ["scripts/verify-u03-http.mjs", "public/uno-logo.svg"]) {
    const root = makeRoot();
    writeTrace(root, "page", [...boundedEntries(), `../../../${leaked}`]);
    assertRefused(inspect(root), "trace:private-path");
  }
});

test('refuses an undeclared deployment declaration', () => {
  const root = makeRoot();
  writeTrace(root, "page", [...boundedEntries(), "../../../deployment/site.config.json"]);
  assertRefused(inspect(root), "trace:forbidden-path");
});

test('refuses an unexpected project path outside every allowlisted subtree', () => {
  const root = makeRoot();
  writeTrace(root, "page", [...boundedEntries(), "../../../notes/private.md"]);
  assertRefused(inspect(root), "trace:unexpected-project-path");
});

test('refuses a trace that escapes the physical root', () => {
  const root = makeRoot();
  writeTrace(root, "page", [...boundedEntries(), "../../../../../../etc/passwd"]);
  assertRefused(inspect(root), "trace:outside-root");
});

test('refuses a root-wide trace even when no warning was printed at all', () => {
  // The inspector never reads build log text: a silent but unbounded payload is still refused.
  const root = makeRoot();
  writeTrace(root, "page", entriesFor([MANIFEST, SELECTION, "README.md", "pnpm-lock.yaml", "eslint.config.mjs"]));
  const result = inspect(root);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes("trace:forbidden-path"), true);
});


// --- Negative paths: missing, malformed and incomplete evidence -------------------------

test('refuses missing committed declarations', () => {
  const root = makeRoot({ declarations: false });
  writeTrace(root, "page", entriesFor([MANIFEST, SELECTION]));
  assertRefused(inspect(root), "declaration:missing");
});

test('refuses a build with no trace evidence at all', () => {
  const root = makeRoot();
  assertRefused(inspect(root), "trace:missing");
});

test('refuses malformed and non-JSON trace evidence', () => {
  const root = makeRoot();
  writeTrace(root, "page", boundedEntries());
  writeFileSync(resolve(root, ".next/server/app/broken.js.nft.json"), "{ not json", "utf8");
  assertRefused(inspect(root), "trace:malformed");
});

test('refuses an empty trace that would otherwise look like success', () => {
  const root = makeRoot();
  writeTrace(root, "page", []);
  const result = inspect(root);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes("trace:empty"), true);
});

test('refuses declarations that a bounded trace omits', () => {
  const root = makeRoot();
  writeTrace(root, "page", entriesFor([`${CONTENT}/home.en-001.md`]));
  assertRefused(inspect(root), "source:not-traced");
});

test('refuses a fixture build whose published source is not shipped', () => {
  const root = makeRoot({ manifest: PUBLISHED_MANIFEST });
  writeTrace(root, "page", entriesFor([MANIFEST, SELECTION, `${CONTENT}/wo032-events.en-001.md`]));
  const result = inspect(root, { expectPublishedSources: true });
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes("source:not-traced"), true);
});

test('refuses a fixture build with no published source declared at all', () => {
  const root = makeRoot({ manifest: COMMITTED_MANIFEST });
  writeTrace(root, "page", boundedEntries());
  assertRefused(inspect(root, { expectPublishedSources: true }), "source:missing");
});

test('refuses an unreadable declaration during a fixture inspection', () => {
  const root = makeRoot({ manifest: PUBLISHED_MANIFEST });
  writeFileSync(resolve(root, MANIFEST), "{ broken", "utf8");
  writeTrace(root, "page", boundedEntries());
  const result = inspect(root, { expectPublishedSources: true });
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes("declaration:unreadable"), true);
});

test('refuses a payload over the project-entry ceiling', () => {
  const root = makeRoot();
  const many = [MANIFEST, SELECTION];
  for (let index = 0; index < 260; index += 1) many.push(`${CONTENT}/synthetic-${index}.md`);
  writeTrace(root, "page", entriesFor(many));
  const result = inspect(root);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes("trace:root-wide"), true);
});


// --- The configuration that decides what is included ------------------------------------

/** The include list declared in `next.config.ts`, as project-relative globs. */
function configuredIncludes() {
  const text = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
  const block = /const UNO_DEPLOYMENT_INPUTS = \[([\s\S]*?)\];/u.exec(text)?.[1] ?? "";
  return [...block.matchAll(/'([^']+)'/gu)].map((match) => match[1]).sort();
}

/** The four owned-media zone roots declared in `next.config.ts`, as project-relative globs. */
function configuredMediaIncludes() {
  const text = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
  const block = /const UNO_MEDIA_ZONE_INPUTS = \[([\s\S]*?)\];/u.exec(text)?.[1] ?? "";
  return [...block.matchAll(/'([^']+)'/gu)].map((match) => match[1]).sort();
}

test('the next config declares exactly the narrow deployment inputs', () => {
  assert.deepEqual(configuredIncludes(), [
    "./deployment/efs/content/**/*.json",
    "./deployment/efs/content/**/*.md",
    "./deployment/efs/manifest.json",
    "./deployment/uno.config.json",
  ]);
});

test('the next config declares exactly the four owned-media zone roots', () => {
  assert.deepEqual(configuredMediaIncludes(), [
    "./deployment/content/assets/**/*",
    "./deployment/efs/capsule/**/*",
    "./public/_uno-generated/**/*",
    "./public/platform/**/*",
  ]);
});

test('the next config refuses a root-wide or escaping include', () => {
  for (const include of [...configuredIncludes(), ...configuredMediaIncludes()]) {
    assert.equal(include.startsWith("./"), true, `${include} must be project-relative`);
    assert.equal(/^(\.\/)?\*\*/u.test(include), false, `${include} must not be a root-wide glob`);
    assert.equal(include.includes(".."), false, `${include} must not escape the project`);
    // A zone wildcard must stay inside its named root: never `./deployment/**` or `./public/**`.
    assert.equal(include.startsWith("./deployment/**"), false, `${include} must not widen to the deployment root`);
    assert.equal(include.startsWith("./public/**"), false, `${include} must not widen to the public root`);
  }
});

test('the next config scopes its includes to the routes that read the declarations', () => {
  const text = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
  const keys = [
    ...text.matchAll(
      /^\s*'(\/[^']*)':\s*(?:UNO_DEPLOYMENT_INPUTS|\[\.\.\.UNO_DEPLOYMENT_INPUTS,\s*\.\.\.UNO_MEDIA_ZONE_INPUTS\]),/gmu,
    ),
  ].map((match) => match[1]);
  assert.deepEqual(keys.sort(), [
    "/[locale]/[[...segments]]",
    "/robots.txt",
    "/sitemap.xml",
    "/uno-media/[...segments]",
  ]);
  // `experimental` must not gain an unbounded tracing override, and no webpack escape may appear.
  assert.equal(/outputFileTracingRoot/u.test(text), false);
  assert.equal(/experimental\s*:\s*\{[^}]*outputFileTracing/u.test(text), false);
});

// --- The command surface --------------------------------------------------------------

test('the command exits non-zero on a bounded failure and zero on success', () => {
  const script = resolve(ROOT, "scripts/verify-u03-trace.mjs");

  const goodRoot = makeRoot();
  try {
    writeTrace(goodRoot, "page", boundedEntries());
    const good = spawnSync(process.execPath, [script, "--root", goodRoot, "--expect", "committed"], { encoding: "utf8" });
    assert.equal(good.status, 0, good.stderr);
    assert.match(good.stdout, /verify-u03-trace: OK/u);
  } finally {
    rmSync(goodRoot, { recursive: true, force: true });
  }

  const badRoot = makeRoot();
  try {
    writeTrace(badRoot, "page", [...boundedEntries(), "../../../AGENTS.md"]);
    const bad = spawnSync(process.execPath, [script, "--root", badRoot, "--json"], { encoding: "utf8" });
    assert.equal(bad.status, 1);
    const report = JSON.parse(bad.stdout);
    assert.equal(report.accepted, false);
    assert.equal(report.reasons.includes("trace:forbidden-path"), true);
  } finally {
    rmSync(badRoot, { recursive: true, force: true });
  }
});

test('the command refuses an unknown argument instead of guessing', () => {
  const script = resolve(ROOT, "scripts/verify-u03-trace.mjs");
  const result = spawnSync(process.execPath, [script, "--allow-everything"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown argument/u);
});
