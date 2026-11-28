/**
 * Foundation Uno — the release installer and upgrader (`U06`).
 *
 * WHAT THIS IS. The one supported way to put a Foundation Uno release on a machine, and the only thing that writes to an installation
 * directory. It verifies the release before it touches anything, installs into a staging directory, builds there, and only then swaps
 * the staged tree into place. A failed or interrupted run therefore leaves the previous installation exactly as it was.
 *
 * WHAT IT REFUSES. A missing manifest, a digest that does not match, a file the manifest does not name, a file the manifest names and
 * the directory does not carry, and a release whose `RELEASE.json` digest disagrees with its manifest. Every refusal carries one closed
 * reason and no partial write.
 *
 * WHAT IT PRESERVES. Adopter authorship: Pages, media, the Site presentation and the EFS manifest are copied from the live installation
 * into the new release, recorded in `installation.json`, so an upgrade never discards them. A rollback restores the previous release
 * together with its own preserved set.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The paths an adopter owns, and which an upgrade must therefore carry forward. */
export const ADOPTER_PATHS = Object.freeze([
  "deployment/efs/content",
  "deployment/efs/assets",
  "deployment/efs/manifest.json",
  "deployment/site.config.json",
  "deployment/uno.config.json",
]);

/** Every reason an installation is refused. */

const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** Read `MANIFEST.sha256` into `[path, digest]` pairs, or refuse. */
function readManifest(releaseDir) {
  const manifestPath = join(releaseDir, "MANIFEST.sha256");
  if (!existsSync(manifestPath)) return { ok: false, reason: "install:manifest-missing" };
  const entries = [];
  for (const line of readFileSync(manifestPath, "utf8").split("\n")) {
    if (line.trim().length === 0) continue;
    const match = /^([0-9a-f]{64}) {2}(.+)$/u.exec(line);
    if (match === null) return { ok: false, reason: "install:manifest-malformed" };
    entries.push([match[2], match[1]]);
  }
  if (entries.length === 0) return { ok: false, reason: "install:manifest-malformed" };
  return { ok: true, entries };
}

/** Verify every file, the tree digest and the recorded facts before anything is written. */
export function verifyRelease(releaseDir) {
  const manifest = readManifest(releaseDir);
  if (!manifest.ok) return manifest;
  const { entries } = manifest;
  for (const [path, digest] of entries) {
    const absolute = join(releaseDir, path);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) return { ok: false, reason: `install:missing-file:${path}` };
    if (hash(absolute) !== digest) return { ok: false, reason: `install:file-mismatch:${path}` };
  }
  const listed = new Set(entries.map(([path]) => path));
  const walk = (path, prefix) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(path, entry.name), relative);
      else if (!listed.has(relative) && relative !== "MANIFEST.sha256" && relative !== "RELEASE.json") {
        throw new Error(`install:unexpected-file:${relative}`);
      }
    }
  };
  try {
    walk(releaseDir, "");
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "install:unexpected-file" };
  }
  const digest = createHash("sha256")
    .update(entries.map(([path, fileDigest]) => `${fileDigest}  ${path}`).join("\n"))
    .digest("hex");
  const factsPath = join(releaseDir, "RELEASE.json");
  if (!existsSync(factsPath)) return { ok: false, reason: "install:facts-missing" };
  const facts = JSON.parse(readFileSync(factsPath, "utf8"));
  if (facts.digest !== digest) return { ok: false, reason: "install:digest-mismatch" };
  return { ok: true, digest, facts };
}


/** Run one command in a directory, and return whether it succeeded with its last output lines. */
function run(command, args, cwd) {
  // `CI=1` makes pnpm non-interactive: without a TTY it refuses to purge or re-link a modules directory unattended.
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, CI: "1" },
    // A bounded command can fail; it can never hang the installer or the gate that drives it.
    timeout: 900_000,
    killSignal: "SIGKILL",
  });
  return { ok: result.status === 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(-4000) };
}

/** Copy one adopter-owned path from a live installation into the staged release, if it exists. */

/** Copy one adopter-owned path from a live installation into the new release, if it exists. */
function preserve(releaseDir, liveDir, preserved) {
  for (const path of ADOPTER_PATHS) {
    const from = join(liveDir, path);
    if (!existsSync(from)) continue;
    cpSync(from, join(releaseDir, path), { recursive: true });
    preserved.push(path);
  }
}

/**
 * Write the operator launcher.
 *
 * WHY A LAUNCHER AND NOT A LINK. The product refuses a **symlinked source root** on purpose: a confined read whose root is a link could
 * be repointed behind the product's back. An installation that was entered through a link therefore served nothing, which is how this
 * design was found. The installation is a real directory, the active release is a real directory inside it, and the launcher reads the
 * record and starts the server **in that directory**, so `process.cwd()` is always a physical path.
 */
function writeLauncher(root) {
  const body = [
    "#!/usr/bin/env node",
    "/** Foundation Uno — the installation launcher. Starts the active release from its own physical directory. */",
    'import { readFileSync } from "node:fs";',
    'import { spawn } from "node:child_process";',
    "import { dirname, join, resolve } from \"node:path\";",
    "",
    'import { fileURLToPath } from "node:url";',
    "const root = dirname(fileURLToPath(import.meta.url));",
    "const record = JSON.parse(readFileSync(join(root, \"installation.json\"), \"utf8\"));",
    "const active = resolve(record.active);",
    "const args = [join(active, \"node_modules/next/dist/bin/next\"), \"start\", ...process.argv.slice(2)];",
    "const child = spawn(process.execPath, args, { cwd: active, stdio: \"inherit\", env: { ...process.env, NODE_ENV: \"production\" } });",
    "child.on(\"exit\", (code) => { process.exitCode = code ?? 0; });",
    "",
  ];
  writeFileSync(join(root, "start.mjs"), body.join("\n"), "utf8");
}

/** The record that names the active release, readable by an operator and by the launcher. */
function writeRecord(root, active, digest, facts, preserved, mode) {
  const record = {
    name: facts.name,
    version: facts.version,
    commit: facts.commit,
    digest,
    mode,
    active,
    preserved,
    installedAt: new Date().toISOString(),
    start: "node start.mjs -H 127.0.0.1 -p 3000",
    verify: "recompute MANIFEST.sha256 and compare it with RELEASE.json",
  };
  writeFileSync(join(root, "installation.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  writeFileSync(join(active, "installation.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

/** The active release of an installation, or `null` when nothing is installed. */
function activeRelease(root) {
  try {
    const record = JSON.parse(readFileSync(join(root, "installation.json"), "utf8"));
    const active = resolve(String(record.active ?? ""));
    return existsSync(join(active, ".next/BUILD_ID")) ? active : null;
  } catch {
    return null;
  }
}

/**
 * Install or upgrade one release.
 *
 * The release is materialised at its own permanent, **physical** path and built there, so no package-manager link ever dangles and no
 * served decision ever sees a symlinked root. The record is the only thing that points at a release, and a rollback is a record change.
 * A failure before the record is written leaves the running installation untouched.
 */
export function installRelease({ releaseDir, target, mode = "fresh" }) {
  const verified = verifyRelease(releaseDir);
  if (!verified.ok) return { ok: false, reason: verified.reason };

  const root = resolve(target);
  const releasesRoot = join(root, "releases");
  const releasePath = join(releasesRoot, `${verified.facts.name}-${verified.facts.version}-${verified.digest.slice(0, 12)}`);
  const previous = activeRelease(root);
  mkdirSync(releasesRoot, { recursive: true });
  let preserved = [];

  if (!existsSync(join(releasePath, ".next/BUILD_ID"))) {
    rmSync(releasePath, { recursive: true, force: true });
    mkdirSync(releasePath, { recursive: true });
    cpSync(releaseDir, releasePath, {
      recursive: true,
      filter: (source) => !source.endsWith("MANIFEST.sha256") && !source.endsWith("RELEASE.json"),
    });
    if (previous !== null) preserve(releasePath, previous, preserved);

    // Dependencies come from the lockfile. The offline attempt is preferred and is what a machine with a populated store uses; a
    // machine without one falls back to the registry, and the record says which happened.
    let install = run("pnpm", ["install", "--offline", "--frozen-lockfile"], releasePath);
    let dependencyMode = "offline";
    if (!install.ok) {
      install = run("pnpm", ["install", "--frozen-lockfile"], releasePath);
      dependencyMode = "registry";
    }
    if (!install.ok) {
      rmSync(releasePath, { recursive: true, force: true });
      return { ok: false, reason: "install:dependency-install-failed", output: install.output };
    }
    writeFileSync(join(releasePath, ".uno-dependencies"), `${dependencyMode}
`, "utf8");
    const build = run("pnpm", ["build"], releasePath);
    if (!build.ok) {
      rmSync(releasePath, { recursive: true, force: true });
      return { ok: false, reason: "install:build-failed", output: build.output };
    }
    for (const required of ["node_modules/next/package.json", ".next/BUILD_ID"]) {
      if (!existsSync(join(releasePath, required))) {
        rmSync(releasePath, { recursive: true, force: true });
        return { ok: false, reason: `install:build-incomplete:${required}` };
      }
    }
    // The release must be entered at a physical path: the product refuses a symlinked source root, so this is a product requirement.
    if (lstatSync(releasePath).isSymbolicLink()) {
      rmSync(releasePath, { recursive: true, force: true });
      return { ok: false, reason: "install:release-path-is-a-link" };
    }
  }

  writeLauncher(root);
  const record = writeRecord(root, releasePath, verified.digest, verified.facts, preserved, mode);
  return { ok: true, digest: verified.digest, facts: verified.facts, releasePath, previous, target: root, record };
}

/** Point the installation at the most recent other complete release. */
export function rollbackRelease({ target }) {
  const root = resolve(target);
  const releasesRoot = join(root, "releases");
  if (!existsSync(releasesRoot)) return { ok: false, reason: "rollback:nothing-to-restore" };
  const current = activeRelease(root);
  const candidates = readdirSync(releasesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && join(releasesRoot, entry.name) !== current)
    .filter((entry) => existsSync(join(releasesRoot, entry.name, ".next/BUILD_ID")))
    .map((entry) => ({ path: join(releasesRoot, entry.name), at: statSync(join(releasesRoot, entry.name)).mtimeMs }))
    .sort((left, right) => right.at - left.at);
  const previous = candidates[0];
  if (previous === undefined) return { ok: false, reason: "rollback:nothing-to-restore" };
  // The restored release carries its own record, written when it was built, so a rollback restores that release's identity rather than
  // inheriting the identity of the release it is replacing.
  let own = { digest: "", name: "", version: "", commit: "", preserved: [] };
  try {
    own = JSON.parse(readFileSync(join(previous.path, "installation.json"), "utf8"));
  } catch {
    own = { digest: "", name: "", version: "", commit: "", preserved: [] };
  }
  const restored = writeRecord(root, previous.path, String(own.digest ?? ""), own, own.preserved ?? [], "rollback");
  return { ok: true, restored: previous.path, kept: current, record: restored };
}

const SCRIPT = fileURLToPath(import.meta.url);

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(SCRIPT)) {
  const [releaseDir, target, mode] = process.argv.slice(2);
  if (releaseDir === undefined || target === undefined) {
    console.error("usage: install-release.mjs <release dir> <target dir> [fresh|upgrade]");
    process.exit(2);
  }
  const result = installRelease({ releaseDir: resolve(releaseDir), target: resolve(target), mode: mode ?? "fresh" });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
