#!/usr/bin/env node
/**
 * Foundation Uno — bounded file-trace inspector (`UNO-WO-033 / R01`).
 *
 * WHAT THIS PROVES. The pinned Next 16 build's own output tracing (`.nft.json`) ships the files the server
 * routes actually read — the two fixed declarations and the authored EFS sources — and ships **nothing
 * else from this repository**: no `.documents/`, no private ACTIVE, no `.temp/`, no test harness, no
 * scripts, no `public/`, no root documentation, no lockfile, no parent or sibling path. It exists because
 * the `Dynamic filesystem access causes tracing of the whole project` warning could be silenced while the
 * payload still contained the whole project: a warning-free build is not, on its own, a bounded build.
 *
 * HOW IT JUDGES. Read-only and dependency-free. It reads the declarations from the inspected root, reads
 * every `.nft.json` under the inspected build directory, resolves each entry against that manifest's own
 * directory, normalizes Windows and POSIX separators, and applies closed codes. It never reads source
 * bytes, never decides publication, and never re-implements the confined reader's authorization: it only
 * compares what was traced against what the declarations name.
 *
 * WHAT IT IS NOT. It is not a publication authority, a deployment, a provider call or a substitute for the
 * HTTP/browser proof. On missing, unreadable or malformed trace evidence it FAILS — never skips.
 */

import { readFileSync, readdirSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Declared project-relative inputs the server routes read at runtime. */
const DECLARATION_PATHS = Object.freeze(["deployment/efs/manifest.json", "deployment/uno.config.json"]);
const CONTENT_ROOT = "deployment/efs/content";

/** Project-relative prefixes that may legitimately appear in a bounded server trace. */
const ALLOWED_PROJECT_PREFIXES = Object.freeze([
  "src/",
  "deployment/efs/capsule/",
  "deployment/efs/manifest.json",
  "deployment/uno.config.json",
  `${CONTENT_ROOT}/`,
]);

/** Project-relative prefixes and files that prove a root-wide trace: no server route reads them. */
const FORBIDDEN_PROJECT_PREFIXES = Object.freeze([
  ".documents/",
  ".temp/",
  ".git/",
  "tests/",
  "scripts/",
  "public/",
]);
const FORBIDDEN_PROJECT_FILES = Object.freeze([
  "AGENTS.md",
  "README.md",
  "LICENSE",
  "eslint.config.mjs",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "tsconfig.tsbuildinfo",
  "deployment/site.config.json",
  "workorder-active.md",
]);

/** A bounded server payload is counted, not trusted: these ceilings are far above a correct trace. */
const MAX_TRACED_FILES = 20_000;
const MAX_PROJECT_ENTRIES = 250;

/** Normalize a traced path to a project-relative POSIX path, or `null` when it escapes the root. */
function projectRelative(root, absolutePath) {
  const relativePath = relative(root, absolutePath);
  if (relativePath.length === 0) return "";
  const escaped = isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${"/"}`) || relativePath.startsWith("..\\");
  if (escaped) return null;
  return relativePath.replaceAll("\\", "/");
}

/** Every `.nft.json` under one build directory, as absolute paths, deterministically ordered. */
function traceManifests(buildDir) {
  const found = [];
  const walk = (directory) => {
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of [...entries].sort((left, right) => (left.name < right.name ? -1 : 1))) {
      const full = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".nft.json")) found.push(full);
    }
  };
  walk(buildDir);
  return found.sort();
}

/** Read one JSON file, returning `null` on any failure. */
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/** Every declared source path of every *published* representation in a manifest. */
function publishedSources(manifest) {
  const sources = [];
  for (const entity of Array.isArray(manifest?.entities) ? manifest.entities : []) {
    for (const facet of Array.isArray(entity?.facets) ? entity.facets : []) {
      for (const site of Array.isArray(facet?.sites) ? facet.sites : []) {
        for (const page of Array.isArray(site?.pages) ? site.pages : []) {
          if (page?.publication !== "published") continue;
          for (const representation of Array.isArray(page?.representations) ? page.representations : []) {
            for (const source of Array.isArray(representation?.sources) ? representation.sources : []) {
              if (typeof source?.path === "string") sources.push(source.path);
            }
          }
        }
      }
    }
  }
  return [...new Set(sources)].sort();
}

/** Whether a project-relative entry is inside an allowed prefix, or is one of them exactly. */
function isAllowedProjectEntry(path) {
  return ALLOWED_PROJECT_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

/** Classify one project-relative entry against the bounded allowlist, or `null` when it is bounded. */
function classify(rawPath) {
  const path = rawPath.startsWith("./") ? rawPath.slice(2) : rawPath;
  if (FORBIDDEN_PROJECT_PREFIXES.some((prefix) => path.startsWith(prefix))) return "trace:private-path";
  if (FORBIDDEN_PROJECT_FILES.includes(path)) return "trace:forbidden-path";
  if (!isAllowedProjectEntry(path)) return "trace:unexpected-project-path";
  return null;
}


/**
 * Inspect one build's tracing evidence.
 *
 * `expectPublishedSources` is `true` when the inspected build must ship the sources of the published Pages
 * the declarations name (the synthetic publication fixture), and `false` for the committed unpublished
 * build, where no Page is published and only the declarations themselves are required.
 *
 * Returns counters plus closed reasons. Nothing here decides publication or reads source bytes.
 */
export function inspectTrace({ root, buildDir, expectPublishedSources = false }) {
  const reasons = [];
  const physicalRoot = resolve(root);
  const physicalBuild = resolve(buildDir);
  const notes = { manifests: 0, tracedFiles: 0, projectEntries: 0, names: [], digests: [] };

  for (const declarationPath of DECLARATION_PATHS) {
    const absolute = resolve(physicalRoot, declarationPath);
    let bytes;
    try {
      bytes = readFileSync(absolute);
    } catch {
      reasons.push("declaration:missing");
      continue;
    }
    notes.digests.push(`${declarationPath}:${bytes.length}`);
  }

  const manifests = traceManifests(physicalBuild);
  notes.manifests = manifests.length;
  if (manifests.length === 0) {
    reasons.push("trace:missing");
    return Object.freeze({ accepted: false, reasons: Object.freeze([...new Set(reasons)].sort()), notes: Object.freeze(notes) });
  }

  const project = new Set();
  let total = 0;
  for (const manifest of manifests) {
    let text;
    try {
      text = readFileSync(manifest, "utf8");
    } catch {
      reasons.push("trace:unreadable");
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      reasons.push("trace:malformed");
      continue;
    }
    const entries = parsed?.files;
    if (!Array.isArray(entries) || entries.some((entry) => typeof entry !== "string")) {
      reasons.push("trace:malformed");
      continue;
    }
    const manifestDir = resolve(manifest, "..");
    for (const entry of entries) {
      total += 1;
      const absolute = resolve(manifestDir, entry);
      const relativePath = projectRelative(physicalRoot, absolute);
      if (relativePath === null) {
        reasons.push("trace:outside-root");
        continue;
      }
      if (relativePath.startsWith("node_modules/") || relativePath.startsWith(".next/")) continue;
      project.add(relativePath);
    }
  }

  notes.tracedFiles = total;
  notes.projectEntries = project.size;
  if (total === 0) reasons.push("trace:empty");

  for (const entry of [...project].sort()) {
    const code = classify(entry);
    if (code !== null) reasons.push(code);
  }
  if (project.size > MAX_PROJECT_ENTRIES || total > MAX_TRACED_FILES) reasons.push("trace:root-wide");

  for (const declarationPath of DECLARATION_PATHS) {
    if (!project.has(declarationPath)) reasons.push("source:not-traced");
  }

  if (expectPublishedSources) {
    const manifest = readJson(resolve(physicalRoot, DECLARATION_PATHS[0]));
    if (manifest === null) {
      reasons.push("declaration:unreadable");
    } else {
      const required = publishedSources(manifest);
      if (required.length === 0) reasons.push("source:missing");
      for (const source of required) {
        if (!project.has(source)) reasons.push("source:not-traced");
      }
      notes.publishedSources = required.length;
    }
  }

  notes.names = [...project].sort().slice(0, 12);
  const unique = [...new Set(reasons)].sort();
  return Object.freeze({
    accepted: unique.length === 0,
    reasons: Object.freeze(unique),
    notes: Object.freeze(notes),
  });
}


/** Parse the closed CLI surface: `--root`, `--build`, `--expect`, `--json`. */
function parseArguments(argv) {
  const options = { root: process.cwd(), buildDir: null, expectPublishedSources: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") options.root = resolve(argv[(index += 1)]);
    else if (argument === "--build") options.buildDir = resolve(options.root, argv[(index += 1)]);
    else if (argument === "--expect") {
      const value = argv[(index += 1)];
      if (value === "fixture") options.expectPublishedSources = true;
      else if (value === "committed") options.expectPublishedSources = false;
      else throw new Error(`unknown --expect value: ${value}`);
    } else if (argument === "--json") options.json = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  // The build directory always defaults to the inspected root's own `.next`, never the caller's.
  if (options.buildDir === null) options.buildDir = resolve(options.root, ".next");
  return options;
}

/** Run the inspector as a command, printing a bounded, sanitized summary. */
function main(argv) {
  let options;
  try {
    options = parseArguments(argv);
  } catch (error) {
    process.stderr.write(`verify-u03-trace: FAILED - ${String(error.message ?? error)}\n`);
    return 2;
  }

  const result = inspectTrace(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ accepted: result.accepted, reasons: result.reasons, notes: result.notes })}\n`);
  } else {
    process.stdout.write("verify-u03-trace: bounded Next output tracing\n");
    process.stdout.write(`  trace manifests: ${result.notes.manifests}\n`);
    process.stdout.write(`  traced files: ${result.notes.tracedFiles}\n`);
    process.stdout.write(`  project entries: ${result.notes.projectEntries}\n`);
    for (const digest of result.notes.digests) process.stdout.write(`  declaration ${digest}\n`);
    for (const name of result.notes.names) process.stdout.write(`  project ${name}\n`);
    process.stdout.write(
      result.accepted
        ? "verify-u03-trace: OK - only the declared inputs and authored sources are shipped\n"
        : `verify-u03-trace: FAILED\n${result.reasons.map((reason) => `  - ${reason}`).join("\n")}\n`,
    );
  }
  return result.accepted ? 0 : 1;
}

const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) process.exitCode = main(process.argv.slice(2));
