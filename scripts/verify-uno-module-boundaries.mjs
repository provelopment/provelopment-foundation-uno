#!/usr/bin/env node
/**
 * Foundation Uno — resolved dependency-boundary gate (`U02`, strengthened).
 *
 * WHAT THIS PROVES. Every authored module's imports are RESOLVED to a real file and mapped to its architectural
 * layer, so the check runs on edges rather than on the text of a specifier. It covers static imports, type-only
 * imports, `export … from` re-exports, side-effect imports and dynamic `import()`.
 *
 * WHAT IT REFUSES. An inward layer reaching outward, a framework or Node import inside the framework-free core, a
 * client module importing a server-only adapter or a config module, an unresolved specifier, and any import cycle.
 *
 * HOW IT IS PROVEN SENSITIVE. `--self-test` copies nothing from the repository: it builds a temporary tree with one
 * violation of each kind and fails unless every one is reported. A gate that cannot fail is not a gate.
 */
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The layer of one authored file, by directory. */
const LAYERS = [
  ["src/core/", "core"],
  ["src/connect/", "connect"],
  ["src/application/", "application"],
  ["src/adapters/", "adapters"],
  ["src/config/", "config"],
  ["src/composition/", "composition"],
  ["src/components/", "components"],
  ["src/app/", "app"],
];

/** The layers each layer may import. Everything points inward; the app is the driving edge. */
const ALLOWED = {
  core: ["core"],
  connect: ["connect"],
  application: ["core", "connect", "application"],
  adapters: ["core", "connect", "application", "adapters"],
  config: ["core", "connect", "application", "adapters", "config", "composition"],
  composition: ["core", "connect", "composition"],
  components: ["core", "connect", "application", "components"],
  app: ["core", "connect", "application", "adapters", "config", "composition", "components", "app"],
};

/** Bare specifiers the framework-free core must never use. */
const CORE_FORBIDDEN = [/^react$/u, /^react-dom/u, /^next(\/|$)/u, /^@vercel\//u, /^node(:|$)/u];

/** The layer of one repository-relative path, or `null` when the file is outside every layer. */
function layerOf(path) {
  for (const [prefix, layer] of LAYERS) if (path.startsWith(prefix)) return layer;
  return null;
}

/** Every authored source file, repository-relative with forward slashes. */
function sourceFiles(root) {
  const files = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|mts)$/u.test(entry.name)) files.push(full);
    }
  };
  for (const layer of LAYERS) {
    const directory = join(root, layer[0]);
    try {
      if (statSync(directory).isDirectory()) walk(directory);
    } catch {
      // A layer that does not exist in this tree contributes nothing.
    }
  }
  return files;
}

/** Every specifier one file references, whichever syntax family carried it. */
function specifiersOf(source) {
  const found = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/gu,
    /\bexport\s+(?:type\s+)?[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/gu,
    /\bimport\s*['"]([^'"]+)['"]/gu,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/gu,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }
  return [...new Set(found)];
}

/** Resolve one specifier to a repository-relative file, `null` for a bare specifier, `"unresolved"` when nothing exists. */
function resolveSpecifier(fromFile, specifier, root) {
  if (!specifier.startsWith(".")) return null;
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isFile()) return relative(root, candidate).split(sep).join("/");
    } catch {
      // Try the next candidate.
    }
  }
  return "unresolved";
}

/** The full analysis of one tree: how many files, how many resolved edges, and every violation. */
function analyze(root) {
  const violations = [];
  const edges = new Map();
  const files = sourceFiles(root).map((file) => relative(root, file).split(sep).join("/"));

  for (const path of files) {
    const layer = layerOf(path);
    if (layer === null) continue;
    const source = readFileSync(join(root, path), "utf8");
    const client = /^\s*['"]use client['"]/mu.test(source);
    const targets = [];

    for (const specifier of specifiersOf(source)) {
      if (layer === "core" && CORE_FORBIDDEN.some((pattern) => pattern.test(specifier))) {
        violations.push({ path, kind: "core-framework", detail: specifier });
      }
      const target = resolveSpecifier(join(root, path), specifier, root);
      // A directory import resolves under TypeScript but NOT under the Node ESM loader the gates use, so the same source
      // can work in a build and crash a verification runner. File-level specifiers are required everywhere.
      if (
        target !== null &&
        target !== "unresolved" &&
        /(^|\/)index\.(ts|tsx|mts)$/u.test(target) &&
        !/\/index(\.(ts|tsx|mts))?$/u.test(specifier)
      ) {
        violations.push({ path, kind: "directory-import", detail: `${specifier} -> ${target}` });
      }
      if (target === "unresolved") {
        violations.push({ path, kind: "unresolved", detail: specifier });
        continue;
      }
      if (target === null) continue;
      targets.push(target);
      const targetLayer = layerOf(target);
      if (targetLayer === null) continue;
      if (!ALLOWED[layer].includes(targetLayer)) {
        violations.push({ path, kind: "layer", detail: `${layer} -> ${targetLayer} (${target})` });
      }
      if (client && (targetLayer === "adapters" || targetLayer === "config" || targetLayer === "composition")) {
        violations.push({ path, kind: "client-server", detail: target });
      }
    }
    edges.set(path, targets);
  }

  // Cycles: one depth-first walk over the resolved edges.
  const state = new Map();
  const stack = [];
  const visit = (node) => {
    if (state.get(node) === "done") return;
    if (state.get(node) === "open") {
      const start = stack.indexOf(node);
      violations.push({ path: node, kind: "cycle", detail: [...stack.slice(start), node].join(" -> ") });
      return;
    }
    state.set(node, "open");
    stack.push(node);
    for (const next of edges.get(node) ?? []) visit(next);
    stack.pop();
    state.set(node, "done");
  };
  for (const node of edges.keys()) visit(node);

  const edgeCount = [...edges.values()].reduce((total, list) => total + list.length, 0);
  return { files: files.length, edges: edgeCount, violations };
}

/** Build a temporary tree with one violation of each kind and prove every kind is reported. */
function selfTest() {
  const root = mkdtempSync(join(tmpdir(), "uno-boundaries-"));
  try {
    const write = (path, content) => {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content, "utf8");
    };
    write("src/core/ports/probe.ts", 'import { readFileSync } from "node:fs";\nexport const probe = readFileSync;\n');
    write("src/core/ports/missing.ts", 'import { nope } from "./nope";\nexport const n = nope;\n');
    write("src/core/modules/probe.ts", 'import { x } from "../../adapters/mail/probe";\nexport const y = x;\n');
    write("src/adapters/mail/probe.ts", 'import { z } from "../../components/probe";\nexport const x = z;\n');
    write("src/components/probe.tsx", 'import { w } from "../config/probe";\nexport const z = w;\n');
    write("src/config/probe.ts", 'import { y } from "../core/modules/probe";\nexport const w = y;\n');
    write("src/app/probe.ts", '"use client";\nimport { x } from "../adapters/mail/probe";\nexport const c = x;\n');
    write("src/connect/index.ts", "export const connectProbe = 1;\n");
    write("src/core/ports/directory.ts", 'import { connectProbe } from "../../connect";\nexport const d = connectProbe;\n');

    const { violations } = analyze(root);
    const kinds = new Set(violations.map((violation) => violation.kind));
    const expected = ["core-framework", "layer", "unresolved", "client-server", "cycle", "directory-import"];
    const missing = expected.filter((kind) => !kinds.has(kind));
    if (missing.length > 0) {
      console.error(`boundary self-test: the scanner missed ${missing.join(", ")}`);
      return 1;
    }
    console.log(`boundary self-test: ${violations.length} injected violations across ${expected.length} kinds were reported`);
    return 0;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

if (process.argv.includes("--self-test")) {
  process.exitCode = selfTest();
} else {

  const { files, edges, violations } = analyze(ROOT);
  if (violations.length > 0) {
    console.error(`boundary check failed: ${violations.length} violation(s)`);
    for (const violation of violations.slice(0, 20)) {
      console.error(`  ${violation.kind}: ${violation.path} -> ${violation.detail}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`boundary check: ${files} files, ${edges} resolved edges, 0 violations`);
  }
}

