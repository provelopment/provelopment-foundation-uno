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
import {
  closeSync,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

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
  /**
   * Claim a fixture path exclusively and return the open handle. This call IS the ownership boundary: `wx` either
   * grants the caller a brand-new file or throws `EEXIST` and grants nothing.
   */
  openExclusive: (absolutePath) => openSync(absolutePath, "wx"),
  /** The identity of the claimed file, read from the handle rather than the path. */
  statOfHandle: (handle) => fstatSync(handle),
  /** Write bytes through the claimed handle, so a partial write cannot land on a different file. */
  writeToHandle: (handle, bytes) => writeSync(handle, bytes),
  closeHandle: (handle) => closeSync(handle),
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
 * A file's platform identity: the device and inode pair the OS reports for it. It is captured from the open handle at
 * the instant exclusive creation was granted, so it describes *this* transaction's file and not whatever may later
 * occupy the same path.
 */
function identityOf(stats) {
  return { dev: stats.dev, ino: stats.ino };
}

/** True when the platform reported a usable identity — never assume one, and never unlink without it. */
function identityUsable(identity) {
  return (
    identity !== null &&
    typeof identity === "object" &&
    Number.isFinite(identity.dev) &&
    Number.isFinite(identity.ino) &&
    identity.ino !== 0
  );
}

/** True when two identities describe the same physical file. */
function identityMatches(claimed, observed) {
  return claimed.dev === observed.dev && claimed.ino === observed.ino;
}

/**
 * The bytes this transaction last observed on an owned file, used together with the OS identity.
 *
 * Identity alone is not enough on a POSIX filesystem: an inode freed by an unlink may be handed straight back to the
 * next file created at the same path, so a replacement could carry the very same device/inode pair. Removal therefore
 * requires the identity *and* the exact bytes the transaction itself wrote (or observed on its own handle after a
 * partial write). A stranger would have to reproduce both to be mistaken for ours.
 */
function digestUsable(digest) {
  return typeof digest === "string" && digest.length === 64;
}

/**
 * Component-aware containment. A string prefix test would accept a sibling such as `<root>-other`, so the target is
 * expressed relative to the verified root and rejected when it is empty, absolute, or begins with `..`.
 * Returns the relative component list, or `null` when the target is outside the root.
 */
function componentsWithin(root, absolutePath) {
  const resolvedRoot = resolve(root);
  const relativePath = relative(resolvedRoot, resolve(absolutePath));
  if (relativePath === "" || isAbsolute(relativePath)) return null;
  const parts = relativePath.split(sep).filter((part) => part !== "");
  if (parts.length === 0) return null;
  if (parts.some((part) => part === ".." || part === ".")) return null;
  return parts;
}

/**
 * Prove the root itself: it must exist, be a real directory, and be its own canonical path, so no junction or reparse
 * point can be the base of every containment decision that follows.
 */
function rootProblem(writer, root) {
  let stats;
  try {
    stats = writer.lstat(root);
  } catch (error) {
    return reason(isAbsent(error) ? "root:absent" : "root:unreadable");
  }
  if (stats.isSymbolicLink()) return reason("root:symlink");
  if (!stats.isDirectory()) return reason("root:not-directory");
  try {
    if (writer.realpath(root).toLowerCase() !== root.toLowerCase()) return reason("root:reparse-escape");
  } catch {
    return reason("root:unresolvable");
  }
  return null;
}

/**
 * Prove that a path and every component below `root` is physical: no symlink, no junction, no reparse escape.
 * Returns a bounded reason token, or `null` when the path is safe.
 */
function physicalEscape(writer, root, absolutePath) {
  const resolvedRoot = resolve(root);
  const parts = componentsWithin(resolvedRoot, absolutePath);
  if (parts === null) return reason("path:outside-root");

  let canonicalRoot;
  try {
    canonicalRoot = writer.realpath(resolvedRoot);
  } catch {
    return reason("root:unresolvable");
  }

  // Walk from the root down, so a symlinked or junctioned parent is caught even when the leaf does not exist yet.
  let current = canonicalRoot;
  for (const part of parts) {
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
  const rootEscape = rootProblem(writer, root);
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

  // A fixture may not be declared twice, and may never be one of the declarations it is supposed to leave alone.
  const declarationKeys = new Set(declarationPaths.map((target) => target.absolutePath.toLowerCase()));
  const seenFixtures = new Set();
  for (const target of fixturePaths) {
    const key = target.absolutePath.toLowerCase();
    if (seenFixtures.has(key)) reasons.push(`fixture:duplicate:${target.relativePath}`);
    seenFixtures.add(key);
    if (declarationKeys.has(key)) reasons.push(`fixture:collides-with-declaration:${target.relativePath}`);
  }

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

  // --- 2b. Prove the platform reports a usable file identity ------------------------------------------------
  // Cleanup is by identity, never by pathname alone, so a host that cannot distinguish two files at one path may not
  // begin a transaction at all. The probe file lives only in this transaction's private scratch.
  try {
    const probePath = join(scratch, "identity-probe");
    const probeHandle = writer.openExclusive(probePath);
    let probeIdentity;
    try {
      probeIdentity = identityOf(writer.statOfHandle(probeHandle));
    } finally {
      writer.closeHandle(probeHandle);
    }
    const observed = identityOf(writer.lstat(probePath));
    const usable = identityUsable(probeIdentity) && identityMatches(probeIdentity, observed);
    writer.removeFile(probePath);
    if (!usable) return { status: "refused", reasons: [reason("identity:unprovable")] };
  } catch {
    return { status: "refused", reasons: [reason("identity:unprovable")] };
  }


  const backups = [];
  for (const original of originals) {
    const backupPath = join(scratch, `${original.relativePath.replace(/[\\/]+/gu, "__")}.original`);
    try {
      const handle = writer.openExclusive(backupPath);
      try {
        writer.writeToHandle(handle, original.bytes);
      } finally {
        writer.closeHandle(handle);
      }
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

  /**
   * Restore the exact original bytes and remove only files this transaction *provably* owns.
   *
   * Ownership is proven twice: the path is only considered at all because exclusive creation succeeded, and the file
   * found there now must still carry the device/inode identity captured from the handle at that instant. A file placed
   * at the same path afterwards is a stranger — it is left untouched and the restore fails closed.
   */
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
      let observed;
      try {
        observed = writer.lstat(created.absolutePath);
      } catch (error) {
        if (isAbsent(error)) continue; // Already gone: nothing of this transaction remains at that path.
        problems.push(reason("restore:unreadable", created.relativePath));
        continue;
      }
      // Never treat a replacement, a link or an unprovable identity as this transaction's own file.
      if (observed.isSymbolicLink()) {
        problems.push(reason("restore:identity:link", created.relativePath));
        continue;
      }
      if (!identityUsable(created.identity) || !identityMatches(created.identity, identityOf(observed))) {
        problems.push(reason("restore:identity:foreign", created.relativePath));
        continue;
      }
      // An inode may be reused, so the bytes must still be the ones this transaction wrote on that very file.
      if (!digestUsable(created.digest)) {
        problems.push(reason("restore:content:unprovable", created.relativePath));
        continue;
      }
      try {
        if (digestOf(writer.readFile(created.absolutePath)) !== created.digest) {
          problems.push(reason("restore:content:foreign", created.relativePath));
          continue;
        }
      } catch {
        problems.push(reason("restore:content:unreadable", created.relativePath));
        continue;
      }
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

  /**
   * Install the fixture. Any failure — including a partially completed write — triggers rollback here.
   *
   * The exclusive create is the ownership boundary: an `EEXIST` refusal grants nothing, so the intervening stranger's
   * file is never recorded, never removed and never reported as owned. Ownership is recorded from the handle
   * immediately after the OS grants it and *before* the content write, so a partial write is still cleaned up.
   */
  const install = async () => {
    if (verified) return { ok: false, reasons: [reason("install:already-restored")] };

    try {
      for (const original of originals) {
        // Recorded before the write: a throw during the write is therefore still covered by the rollback.
        intent.declarations.push(original.relativePath);
        writer.writeFileReplace(original.absolutePath, original.replacement);
      }
      for (const fixture of fixturePaths) {
        const handle = writer.openExclusive(fixture.absolutePath);
        let identity;
        try {
          identity = identityOf(writer.statOfHandle(handle));
        } catch (error) {
          writer.closeHandle(handle);
          throw error;
        }
        if (!identityUsable(identity)) {
          // Claimed but unprovable: refuse rather than leave a file that can never be safely removed.
          writer.closeHandle(handle);
          throw new Error("identity-unprovable");
        }
        intent.fixtures.push({
          absolutePath: fixture.absolutePath,
          relativePath: fixture.relativePath,
          identity,
          digest: null,
        });
        const record = intent.fixtures[intent.fixtures.length - 1];
        try {
          writer.writeToHandle(handle, fixture.bytes);
          record.digest = digestOf(fixture.bytes);
        } catch (error) {
          // A partial write is still this transaction's file: record exactly what landed on it, then let rollback run.
          try {
            record.digest = digestOf(writer.readFile(fixture.absolutePath));
          } catch {
            record.digest = null; // Unprovable content can never be removed; the rollback will fail closed.
          }
          throw error;
        } finally {
          writer.closeHandle(handle);
        }
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
