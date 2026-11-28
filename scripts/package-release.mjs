/**
 * Foundation Uno — the release-candidate packager (`U06`).
 *
 * WHAT THIS IS. One deterministic assembler that turns a verified working tree into an **identifiable** distribution: a directory of
 * exactly the files an independent installation needs, a per-file `MANIFEST.sha256`, a `SHA256SUMS` digest of every artefact, a
 * `RELEASE.json` naming the version, the git commit and the tree digest, and the licence and attribution notices the distribution
 * must carry.
 *
 * WHAT IT DELIBERATELY EXCLUDES. The development workspace: `node_modules`, `.next`, `.git`, `.temp`, the test suites, the CI
 * configuration and the WIP documents. An installation therefore cannot borrow anything from the environment the release was built in,
 * and an adopter receives a product rather than a checkout.
 *
 * DETERMINISM. File order is sorted and the archive is written with the timestamp and ownership pinned, so the same inputs produce the
 * same digests on the same platform. The digests, not the archive bytes, are the identity an operator verifies.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = process.cwd();

/** The directories and files an installation needs, in a fixed order. */
const INCLUDE = Object.freeze([
  "LICENSE",
  "README.md",
  "OPERATIONS.md",
  "next.config.ts",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "eslint.config.mjs",
  "src",
  "deployment",
  "public",
  ".documents/Architecture",
  ".documents/SOP",
]);

/** Workspace material an installation must never ship. */
const EXCLUDE_NAMES = Object.freeze([".DS_Store", "Thumbs.db", "tsconfig.tsbuildinfo"]);
const EXCLUDE_SEGMENTS = Object.freeze(["node_modules", ".next", ".git", ".temp", ".vercel", ".pnpm-store"]);

/** Every file under one path, in sorted order, skipping the excluded material. */
function collect(path) {
  const absolute = resolve(ROOT, path);
  let stats;
  try {
    stats = statSync(absolute);
  } catch {
    return [];
  }
  if (stats.isFile()) return EXCLUDE_NAMES.includes(path) ? [] : [path.replaceAll("\\", "/")];
  const found = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true }).sort((left, right) => (left.name < right.name ? -1 : 1))) {
    if (EXCLUDE_SEGMENTS.includes(entry.name) || EXCLUDE_NAMES.includes(entry.name)) continue;
    found.push(...collect(join(path, entry.name)));
  }
  return found;
}

/** The SHA-256 of one file. */
function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/** The SHA-256 of a digest list, so the whole tree has one identity. */
export function hashList(entries) {
  return createHash("sha256").update(entries.map(([path, digest]) => `${digest}  ${path}`).join("\n")).digest("hex");
}

/** The production runtime dependencies, read from disk so no network is needed. */
function runtimeDependencies() {
  const manifest = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  const names = Object.keys(manifest.dependencies ?? {}).sort();
  const notices = [];
  for (const name of names) {
    try {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, "node_modules", name, "package.json"), "utf8"));
      notices.push({ name, version: String(pkg.version ?? ""), licence: String(pkg.license ?? "UNSPECIFIED") });
    } catch {
      notices.push({ name, version: String(manifest.dependencies[name]), licence: "UNSPECIFIED" });
    }
  }
  return { manifest, notices };
}

/** Write the attribution notice the distribution must carry. */
function writeNotice(target) {
  const { manifest, notices } = runtimeDependencies();
  const lines = [
    "# Foundation Uno — attribution notice",
    "",
    `Release \`${manifest.name}@${manifest.version}\`. This distribution is licensed under the terms in \`LICENSE\`.`,
    "",
    "Foundation Uno is an independent implementation. It contains no copied Foundation source, no donor component and no",
    "provider SDK: the modules in `src/` are Uno-owned, and the runtime dependencies below are consumed under their own licences.",
    "",
    "## Runtime dependencies",
    "",
    "| Package | Version | Licence |",
    "| --- | --- | --- |",
    ...notices.map((entry) => `| \`${entry.name}\` | \`${entry.version}\` | ${entry.licence} |`),
    "",
    "## Content and media",
    "",
    "No third-party copy, photograph, icon set, font file or trademark is shipped. Every authored Page in `deployment/efs/content/`",
    "is synthetic starter text written for this distribution, and every image an installation serves must be owned by the operator.",
    "",
  ];
  writeFileSync(target, `${lines.join("\n")}\n`, "utf8");
}

/** The version, commit and digest facts an operator records and re-verifies. */
function releaseFacts(files, digest) {
  let commit = "uncommitted";
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    commit = "uncommitted";
  }
  const manifest = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  const engines = manifest.engines ?? {};
  return {
    name: manifest.name,
    version: manifest.version,
    commit,
    digest,
    files: files.length,
    node: String(engines.node ?? ">=22"),
    pnpm: String(manifest.packageManager ?? "pnpm"),
    builtAt: "1970-01-01T00:00:00.000Z",
    notes: [
      "Verify this release by recomputing MANIFEST.sha256 and comparing the digest recorded here.",
      "Install with scripts/install-release.mjs; never edit a release directory in place.",
    ],
  };
}

/** Assemble one release directory, then its archive and digests. */
export function packageRelease(options = {}) {
  const outputRoot = resolve(ROOT, options.outputRoot ?? "release");
  const files = [...new Set(INCLUDE.flatMap((entry) => collect(entry)))].sort();
  const manifest = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  const releaseDir = join(outputRoot, `${manifest.name}-${manifest.version}`);

  rmSync(releaseDir, { recursive: true, force: true });
  mkdirSync(releaseDir, { recursive: true });
  for (const path of files) {
    mkdirSync(dirname(join(releaseDir, path)), { recursive: true });
    copyFileSync(resolve(ROOT, path), join(releaseDir, path));
  }
  writeNotice(join(releaseDir, "NOTICE.md"));

  // Digests cover the release exactly as an adopter receives it, including the notice generated here.
  const shipped = [...files, "NOTICE.md"].sort();
  const entries = shipped.map((path) => [path, hashFile(join(releaseDir, path))]);
  const digest = hashList(entries);
  writeFileSync(
    join(releaseDir, "MANIFEST.sha256"),
    `${entries.map(([path, hash]) => `${hash}  ${path}`).join("\n")}\n`,
    "utf8",
  );
  const facts = releaseFacts(shipped, digest);
  writeFileSync(join(releaseDir, "RELEASE.json"), `${JSON.stringify(facts, null, 2)}\n`, "utf8");

  // The archive is a convenience: the digests are the identity, and they are computed from the directory it packages.
  const archive = join(outputRoot, `foundation-uno-${manifest.version}.tar.gz`);
  rmSync(archive, { force: true });
  let archived = true;
  try {
    execFileSync(
      "tar",
      ["-czf", archive, "--mtime=1970-01-01", "--owner=0", "--group=0", "-C", outputRoot, `${manifest.name}-${manifest.version}`],
      { cwd: ROOT, stdio: "ignore" },
    );
  } catch {
    archived = false;
  }
  const sums = [`${digest}  RELEASE-DIGEST`];
  if (archived) {
    sums.push(`${createHash("sha256").update(readFileSync(archive)).digest("hex")}  ${relative(outputRoot, archive).replaceAll("\\", "/")}`);
  }
  writeFileSync(join(outputRoot, "SHA256SUMS"), `${sums.join("\n")}\n`, "utf8");

  return { releaseDir, archive: archived ? archive : null, digest, files: shipped.length, facts };
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(ROOT, "scripts/package-release.mjs")) {
  const result = packageRelease();
  console.log(`package-release: ${result.facts.name}@${result.facts.version}`);
  console.log(`package-release: ${result.files} files, digest ${result.digest}`);
  console.log(`package-release: ${result.releaseDir}`);
  if (result.archive !== null) console.log(`package-release: ${result.archive}`);
}
