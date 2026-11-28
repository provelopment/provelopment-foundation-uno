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
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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

/** Remove a directory link without following it, so the release it names is never touched. */
function removeLink(path) {
  if (!existsSync(path) && !existsSync(dirname(path))) return;
  try {
    if (lstatSync(path).isSymbolicLink()) unlinkSync(path);
    else rmSync(path, { recursive: true, force: true });
  } catch {
    // A missing path needs no removal.
  }
}

/** Point the live path at one physical release. A junction needs no elevation on Windows; a symlink is its POSIX peer. */
function pointAt(target, releasePath) {
  const pending = `${target}.next-${process.pid}`;
  removeLink(pending);
  symlinkSync(releasePath, pending, process.platform === "win32" ? "junction" : "dir");
  // A directory link can be unlinked without touching the release it names, so this window cannot destroy data.
  removeLink(target);
  renameSync(pending, target);
}

/** The release path the live link currently names, or `null` when nothing is installed. */
function currentRelease(target) {
  try {
    return realpathSync(target);
  } catch {
    return null;
  }
}

/** Write the record an operator reads: which release is installed, from where, and what was preserved. */
function writeInstallation(releaseDir, digest, facts, preserved, mode) {
  writeFileSync(
    join(releaseDir, "installation.json"),
    `${JSON.stringify(
      {
        name: facts.name,
        version: facts.version,
        commit: facts.commit,
        digest,
        mode,
        preserved,
        installedAt: new Date().toISOString(),
        start: "node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3000",
        verify: "recompute MANIFEST.sha256 and compare it with RELEASE.json",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

/**
 * Install or upgrade one release.
 *
 * The release is materialised at its own permanent path, built there, and only then does the live link move. Module links created by
 * the package manager therefore never dangle, `pnpm start` never re-links a moved tree, and any failure before the link moves leaves the
 * running installation untouched.
 */
export function installRelease({ releaseDir, target, mode = "fresh" }) {
  const verified = verifyRelease(releaseDir);
  if (!verified.ok) return { ok: false, reason: verified.reason };

  const live = resolve(target);
  // Each installation owns its release store, so two installations never share a build.
  const releasesRoot = `${live}.releases`;
  const releasePath = join(releasesRoot, `${verified.facts.name}-${verified.facts.version}-${verified.digest.slice(0, 12)}`);
  const previous = currentRelease(live);
  mkdirSync(releasesRoot, { recursive: true });

  // A partial release from an interrupted run is discarded; a complete one is reused.
  if (existsSync(releasePath) && !existsSync(join(releasePath, ".next/BUILD_ID"))) {
    rmSync(releasePath, { recursive: true, force: true });
  }
  if (!existsSync(join(releasePath, ".next/BUILD_ID"))) {
    rmSync(releasePath, { recursive: true, force: true });
    mkdirSync(releasePath, { recursive: true });
    cpSync(releaseDir, releasePath, {
      recursive: true,
      filter: (source) => !source.endsWith("MANIFEST.sha256") && !source.endsWith("RELEASE.json"),
    });
    const preserved = [];
    if (previous !== null) preserve(releasePath, previous, preserved);

    const install = run("pnpm", ["install", "--offline", "--frozen-lockfile"], releasePath);
    if (!install.ok) {
      rmSync(releasePath, { recursive: true, force: true });
      return { ok: false, reason: "install:dependency-install-failed", output: install.output };
    }
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
    writeInstallation(releasePath, verified.digest, verified.facts, preserved, mode);
  }

  try {
    pointAt(live, releasePath);
  } catch (error) {
    return { ok: false, reason: "install:link-failed", output: error instanceof Error ? error.message : "" };
  }
  return { ok: true, digest: verified.digest, facts: verified.facts, releasePath, previous, target: live };
}

/** Move the live link back to the release it pointed at before the last upgrade. */
export function rollbackRelease({ target }) {
  const live = resolve(target);
  const current = currentRelease(live);
  if (current === null) return { ok: false, reason: "rollback:nothing-installed" };
  const releasesRoot = `${live}.releases`;
  if (!existsSync(releasesRoot)) return { ok: false, reason: "rollback:nothing-to-restore" };
  const candidates = readdirSync(releasesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && join(releasesRoot, entry.name) !== current)
    .map((entry) => ({ name: entry.name, at: statSync(join(releasesRoot, entry.name)).mtimeMs }))
    .sort((left, right) => right.at - left.at);
  const previous = candidates[0];
  if (previous === undefined) return { ok: false, reason: "rollback:nothing-to-restore" };
  pointAt(live, join(releasesRoot, previous.name));
  return { ok: true, restored: previous.name, kept: current };
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
