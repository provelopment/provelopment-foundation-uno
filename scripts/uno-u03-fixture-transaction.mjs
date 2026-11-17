/**
 * Foundation Uno — the publication-fixture transaction (`UNO-WO-030 / R01`, U03).
 *
 * WHAT THIS IS. One dependency-free module that owns the *whole* lifecycle of the temporary publication fixture the
 * positive HTTP gate needs: prove the preconditions, back the two committed declarations up, arm recovery, overwrite
 * them, create the fixture sources exclusively, and restore everything again. It exists because the previous gate
 * armed recovery only after the fixture had been installed, so an exception between the first destructive write and
 * that assignment skipped recovery entirely.
 *
 * THE INVARIANT. From the instant the first destructive action is taken — and the *intent* to take it is recorded
 * before the write, so a partial write is covered too — restoration is armed. There is no window in which a failure
 * can leave a modified declaration and no recovery path.
 *
 * FAIL-CLOSED. A failed restoration never claims success, never discards the only recovery copy, and reports a
 * bounded reason with no absolute private path, no file content and no secret. The caller must STOP and leave the
 * backups in place for the Owner.
 *
 * DEPENDENCIES AND AUTHORITY. Node `fs`/`path`/`crypto` only. No network, no provider, no framework, no runtime app
 * import, no environment-supplied policy, and no injection point in any serving code: the `writer` seam exists so an
 * isolated test can fail a specific filesystem call deterministically, and the production runner always uses the real
 * filesystem operations below.
 */
import { createHash } from "node:crypto";
import { lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

/** SHA-256 of one byte buffer, as lowercase hex. */
function digestOf(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** The real filesystem operations. Every call the transaction makes goes through this or an injected substitute. */
const DEFAULT_WRITER = Object.freeze({
  /** `lstat`, so a dangling symlink is visible instead of being reported absent. */
  lstat: (absolutePath) => lstatSync(absolutePath),
  /** Canonical physical path, used to prove no component is a symlink or junction. */
  realpath: (absolutePath) => realpathSync(absolutePath),
  readFile: (absolutePath) => readFileSync(absolutePath),
  /** Replace a declaration with the exact original bytes. */
  writeFileReplace: (absolutePath, bytes) => writeFileSync(absolutePath, bytes),
  /** Create a fixture source, refusing to overwrite anything that already exists. */
  writeFileExclusive: (absolutePath, bytes) => writeFileSync(absolutePath, bytes, { flag: "wx" }),
  removeFile: (absolutePath) => rmSync(absolutePath, { force: false }),
  makeScratch: (parent) => mkdtempSync(join(parent, "tx-")),
  removeScratch: (absolutePath) => rmSync(absolutePath, { recursive: true, force: true }),
});

/** True when `lstat` failed because nothing exists at the path — the only acceptable state for a fixture source. */
function isAbsent(error) {
  return error !== null && typeof error === "object" && error.code === "ENOENT";
}

/** A bounded, path-free reason token for the caller to report. */
function reason(code, detail) {
  return detail === undefined ? code : `${code}:${detail}`;
}

/**
 * Prove that a path and every component below `root` is physical: no symlink, no junction, no reparse escape.
 * Returns a bounded reason token, or `null` when the path is safe.
 */
function physicalEscape(writer, root, absolutePath) {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(absolutePath);
  if (!resolvedPath.toLowerCase().startsWith(resolvedRoot.toLowerCase())) return reason("path:outside-root");

  let canonicalRoot;
  try {
    canonicalRoot = writer.realpath(resolvedRoot);
  } catch {
    return reason("root:unresolvable");
  }

  // Walk from the root down, so a symlinked or junctioned parent is caught even when the leaf does not exist yet.
  const relative = resolvedPath.slice(resolvedRoot.length).split(/[\\/]+/u).filter((part) => part !== "");
  let current = canonicalRoot;
  for (const part of relative) {
    current = join(current, part);
    let stats;
    try {
      stats = writer.lstat(current);
    } catch (error) {
      if (isAbsent(error)) return null; // Nothing beyond this point exists; every ancestor above is already proven.
      return reason("path:unreadable");
    }
    if (stats.isSymbolicLink()) return reason("path:symlink");
    try {
      if (writer.realpath(current).toLowerCase() !== current.toLowerCase()) return reason("path:reparse-escape");
    } catch {
      return reason("path:unresolvable");
    }
  }
  return null;
}

/**
 * Prepare one armed fixture transaction.
 *
 * @param {object} options
 * @param {string} options.root Absolute physical repository root.
 * @param {readonly {path: string, digest: string}[]} options.declarations The two committed files to replace, with their
 *   expected original SHA-256, resolved under `root`.
 * @param {readonly {path: string, bytes: Buffer|string}[]} options.replacements The exact bytes to install, in the same
 *   order as `declarations`.
 * @param {readonly {path: string, bytes: Buffer|string}[]} options.fixtureSources Files to create; each must be absent
 *   and each is removed again on restore.
 * @param {string} options.scratchRoot Directory that holds this transaction's private scratch (Git-ignored).
 * @param {object} [options.writer] Injection point for the isolated fault-injection suite only.
 * @returns {Promise<{status: "refused", reasons: readonly string[]} | {
 *   status: "armed",
 *   install: () => Promise<object>,
 *   restore: () => Promise<object>,
 *   dispose: () => Promise<object>,
 *   describe: () => object,
 * }>}
 */
export async function prepareUnoU03FixtureTransaction(options) {
  const writer = options.writer ?? DEFAULT_WRITER;
  const reasons = [];

  if (typeof options.root !== "string" || !isAbsolute(options.root)) {
    return { status: "refused", reasons: [reason("root:not-absolute")] };
  }
  const root = resolve(options.root);
  const declarations = [...(options.declarations ?? [])];
  const replacements = [...(options.replacements ?? [])];
  const fixtureSources = [...(options.fixtureSources ?? [])];

  if (declarations.length === 0 || declarations.length !== replacements.length) {
    return { status: "refused", reasons: [reason("declarations:unspecified")] };
  }
  if (typeof options.scratchRoot !== "string" || !isAbsolute(options.scratchRoot)) {
    return { status: "refused", reasons: [reason("scratch:not-absolute")] };
  }

  // --- 1. The root and every target must be physically inside it: no symlink or junction in between ------------
  const rootEscape = physicalEscape(writer, root, root);
  if (rootEscape !== null) return { status: "refused", reasons: [rootEscape] };

  const declarationPaths = declarations.map((declaration) => ({
    absolutePath: resolve(root, declaration.path),
    relativePath: declaration.path,
    expectedDigest: declaration.digest,
  }));
  const fixturePaths = fixtureSources.map((source) => ({
    absolutePath: resolve(root, source.path),
    relativePath: source.path,
    bytes: Buffer.isBuffer(source.bytes) ? source.bytes : Buffer.from(String(source.bytes), "utf8"),
  }));

  for (const target of [...declarationPaths, ...fixturePaths]) {
    const escape = physicalEscape(writer, root, target.absolutePath);
    if (escape !== null) reasons.push(`${escape}:${target.relativePath}`);
  }
  // Every fixture source must be genuinely absent — `lstat`, so a dangling link cannot masquerade as absent.
  for (const target of fixturePaths) {
    try {
      writer.lstat(target.absolutePath);
      reasons.push(`fixture:pre-existing:${target.relativePath}`);
    } catch (error) {
      if (!isAbsent(error)) reasons.push(`fixture:unreadable:${target.relativePath}`);
    }
  }
  if (reasons.length > 0) return { status: "refused", reasons };


  // --- 2. Capture and verify the originals, in memory and on disk -----------------------------------------------
  const originals = [];
  for (const [index, target] of declarationPaths.entries()) {
    let bytes;
    try {
      bytes = writer.readFile(target.absolutePath);
    } catch {
      reasons.push(`original:unreadable:${target.relativePath}`);
      continue;
    }
    const digest = digestOf(bytes);
    if (digest !== target.expectedDigest) {
      reasons.push(`original:digest-mismatch:${target.relativePath}`);
      continue;
    }
    originals.push({
      absolutePath: target.absolutePath,
      relativePath: target.relativePath,
      digest,
      bytes,
      replacement: Buffer.isBuffer(replacements[index].bytes)
        ? replacements[index].bytes
        : Buffer.from(String(replacements[index].bytes), "utf8"),
    });
  }
  if (reasons.length > 0) return { status: "refused", reasons };

  // --- 3. Private scratch and the on-disk recovery copies -------------------------------------------------------
  try {
    writer.lstat(options.scratchRoot);
  } catch (error) {
    return { status: "refused", reasons: [reason(isAbsent(error) ? "scratch:absent" : "scratch:unreadable")] };
  }

  let scratch;
  try {
    scratch = writer.makeScratch(resolve(options.scratchRoot));
  } catch {
    return { status: "refused", reasons: [reason("scratch:not-creatable")] };
  }

  const backups = [];
  for (const original of originals) {
    const backupPath = join(scratch, `${original.relativePath.replace(/[\\/]+/gu, "__")}.original`);
    try {
      writer.writeFileExclusive(backupPath, original.bytes);
      if (digestOf(writer.readFile(backupPath)) !== original.digest) throw new Error("digest");
    } catch {
      return { status: "refused", reasons: [reason("backup:not-verified")] };
    }
    backups.push({ absolutePath: backupPath, digest: original.digest, relativePath: original.relativePath });
  }


  // --- 4. Armed state. Intent is recorded before each write, so a partial write is covered by the same rollback ---
  const intent = { declarations: [], fixtures: [] };
  let verified = false;
  let preserveScratch = false;
  let lastRestore = null;

  /** Restore the exact original bytes and remove only what this transaction created. Idempotent. */
  const restore = async () => {
    if (verified) return { ok: true, idempotent: true, backups: backups.length };

    const problems = [];
    for (const original of originals) {
      try {
        writer.writeFileReplace(original.absolutePath, original.bytes);
        const restored = writer.readFile(original.absolutePath);
        if (restored.length === 0) problems.push(reason("restore:empty", original.relativePath));
        else if (digestOf(restored) !== original.digest) problems.push(reason("restore:digest", original.relativePath));
      } catch {
        problems.push(reason("restore:write", original.relativePath));
      }
    }
    for (const created of [...intent.fixtures].reverse()) {
      try {
        writer.removeFile(created.absolutePath);
      } catch (error) {
        if (!isAbsent(error)) problems.push(reason("restore:remove", created.relativePath));
      }
      try {
        writer.lstat(created.absolutePath);
        problems.push(reason("restore:leftover", created.relativePath));
      } catch (error) {
        if (!isAbsent(error)) problems.push(reason("restore:unreadable", created.relativePath));
      }
    }

    if (problems.length > 0) {
      // Fail closed: the only recovery copy stays on disk and no success is ever reported.
      preserveScratch = true;
      lastRestore = { ok: false, reasons: problems, backupsPreserved: backups.length };
      return lastRestore;
    }

    verified = true;
    lastRestore = { ok: true, idempotent: false, backups: backups.length };
    return lastRestore;
  };

  /** Install the fixture. Any failure — including a partially completed write — triggers rollback here. */
  const install = async () => {
    if (verified) return { ok: false, reasons: [reason("install:already-restored")] };

    try {
      for (const original of originals) {
        // Recorded before the write: a throw during the write is therefore still covered by the rollback.
        intent.declarations.push(original.relativePath);
        writer.writeFileReplace(original.absolutePath, original.replacement);
      }
      for (const fixture of fixturePaths) {
        intent.fixtures.push(fixture);
        writer.writeFileExclusive(fixture.absolutePath, fixture.bytes);
      }
      return { ok: true };
    } catch (error) {
      const cause = error instanceof Error ? error.name : "unknown";
      const rollback = await restore();
      return { ok: false, cause, rollback };
    }
  };

  return {
    status: "armed",
    install,
    restore,
    /** Scratch is removed on the caller's final verified restore only; a failed one keeps it for the Owner. */
    dispose: async () => {
      if (!verified) return { ok: false, reasons: [reason("dispose:unverified")] };
      try {
        writer.removeScratch(scratch);
        return { ok: true, scratchRemoved: true };
      } catch {
        return { ok: false, reasons: [reason("dispose:scratch")] };
      }
    },
    /** Bounded diagnostics for a report: counts and outcomes only, never a path, byte or secret. */
    describe: () => ({
      declarations: originals.length,
      fixtures: fixturePaths.length,
      armed: !verified,
      verified,
      backupsPreserved: preserveScratch ? backups.length : 0,
      lastRestore,
    }),
  };
}
