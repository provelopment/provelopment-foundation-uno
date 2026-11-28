/**
 * Foundation Uno — the owned-media reader (`UNO-WO-040 / R01`, U04).
 *
 * WHAT THIS IS. The **single** server-only adapter that turns one validated `OwnedAssetRef` into bytes. It resolves
 * exactly four constant zone roots inside this repository, proves physical containment, refuses symlink and junction
 * escape, checks file identity across `open`, reads a bounded number of bytes, verifies the container signature against
 * the declared purpose and extension, and — for the `generated` zone only — verifies the declared SHA-256.
 *
 * WHAT IT IS NOT. It does not decide whether an asset may be *published*: it is called only with an occurrence that the
 * accepted published Page already declared, and calling it proves nothing about discovery. It never lists a directory,
 * never globs a media root, never writes, renames or purges a file, and never accepts a path that did not arrive as an
 * already-validated reference. Nothing here is reachable from a request except through the narrow media route.
 *
 * ROOT. `repoRoot` is supplied once by the server composition — never by a request — and every root below is a frozen
 * constant list, so the reads are statically scoped and no incoming value can select a directory.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No Foundation, Solo or Connect reader, helper or
 * asset is copied; containment, identity and bounded-read technique follow this repository's own accepted EFS reader.
 */
import { createHash } from "node:crypto";
import { closeSync, fstatSync, lstatSync, openSync, readSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import {
  UNO_OWNED_MEDIA_LIMITS,
  unoOwnedMediaByteCap,
  unoOwnedMediaSignatureIssue,
  unoOwnedMediaZoneRoot,
  type UnoOwnedAssetDecision,
  type UnoOwnedMediaRefusal,
} from "../../core/assets/uno-owned-media";

/** The identity a `page`-zone asset must sit under. Only these three fields select a capsule directory. */
export interface UnoOwnedMediaOwner {
  readonly entityId: string;
  readonly facetId: string;
  readonly siteId: string;
}

/** One read request. `full` is false for a preflight that only needs existence, size and signature. */
export interface UnoOwnedMediaReadRequest {
  readonly repoRoot: unknown;
  readonly owner: UnoOwnedMediaOwner;
  readonly decision: UnoOwnedAssetDecision;
  readonly full: boolean;
}

/** The bytes of one accepted asset, or one closed refusal. */
export type UnoOwnedMediaReadResult =
  | { readonly accepted: true; readonly bytes: Uint8Array; readonly mime: string; readonly size: number }
  | { readonly accepted: false; readonly reason: UnoOwnedMediaRefusal };

/** An identity segment must be a plain, bounded, lowercase-safe identifier; anything else refuses. */
const OWNER_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/u;

/** Refuse with one closed literal. */
function refuse(reason: UnoOwnedMediaRefusal): UnoOwnedMediaReadResult {
  return Object.freeze({ accepted: false, reason });
}

/** True when `child` is strictly inside `parent` after both were canonicalised. */
function isContained(parent: string, child: string): boolean {
  const withSeparator = parent.endsWith(sep) ? parent : `${parent}${sep}`;
  return child === parent || child.startsWith(withSeparator);
}

/** Map a filesystem error onto the closed vocabulary without ever surfacing its message or path. */
function classifyFsError(error: unknown): UnoOwnedMediaRefusal {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "ENOENT" || code === "ENOTDIR") return "media:absent";
  if (code === "ELOOP") return "media:escape";
  return "media:unreadable";
}

/**
 * The absolute path of one asset, with every lexical and physical containment rule already applied.
 *
 * The relative components are appended one at a time to the constant zone root, so no segment can be interpreted as a
 * root, a drive or a parent. The `page` zone additionally requires the accepted Page's own entity, facet and Site.
 */
function resolveContainedPath(
  repoRoot: string,
  request: UnoOwnedMediaReadRequest,
): { readonly ok: true; readonly absolute: string; readonly rootReal: string } | { readonly ok: false; readonly reason: UnoOwnedMediaRefusal } {
  const { ref } = request.decision;
  const rootComponents = unoOwnedMediaZoneRoot(ref.zone).split("/");
  const components: string[] = [...rootComponents];

  if (ref.zone === "page") {
    const { entityId, facetId, siteId } = request.owner;
    for (const segment of [entityId, facetId, siteId]) {
      if (typeof segment !== "string" || !OWNER_SEGMENT.test(segment)) return { ok: false, reason: "media:owner-mismatch" };
      components.push(segment);
    }
  }
  components.push(...ref.path.split("/"));

  // The zone root is selected with literal components, because a hosting platform decides what a function carries from the build's file
  // trace and a trace follows literal components only. `unoOwnedMediaZoneRoot` stays the single authority for the declared root, and the
  // literal selection is required to agree with it before anything is read.
  const literalRoot =
    ref.zone === "page"
      ? join(repoRoot, "deployment", "efs", "capsule")
      : ref.zone === "theme"
        ? join(repoRoot, "deployment", "content", "assets")
        : ref.zone === "platform"
          ? join(repoRoot, "public", "platform")
          : join(repoRoot, "public", "_uno-generated");
  const rootAbsolute = resolve(repoRoot, ...rootComponents);
  if (resolve(literalRoot) !== rootAbsolute) return { ok: false, reason: "media:escape" };
  const absolute = join(literalRoot, ...components.slice(rootComponents.length));
  // Lexical containment first: a resolved path must still sit under its own zone root.
  if (!isContained(rootAbsolute, absolute)) return { ok: false, reason: "media:escape" };

  let rootReal: string;
  try {
    rootReal = realpathSync.native(rootAbsolute);
  } catch (error) {
    return { ok: false, reason: classifyFsError(error) };
  }
  return { ok: true, absolute, rootReal };
}

/**
 * Read one validated owned asset.
 *
 * The order is deliberate: root, containment and link checks first; then the file's own identity and size; then a
 * single handle whose `fstat` must match what was inspected; then a bounded read; then the signature. A `full` read
 * also verifies a declared SHA-256, which is how a `generated` asset proves its bytes are the ones the declaration
 * names. Every failure is one closed literal and no caller value.
 */
export function readUnoOwnedMedia(request: UnoOwnedMediaReadRequest): UnoOwnedMediaReadResult {
  try {
    if (typeof request !== "object" || request === null) return refuse("media:ref-invalid");
    const repoRoot = request.repoRoot;
    if (typeof repoRoot !== "string" || repoRoot.length === 0) return refuse("media:unreadable");
    const decision = request.decision;
    if (typeof decision !== "object" || decision === null) return refuse("media:ref-invalid");

    const located = resolveContainedPath(repoRoot, request);
    if (!located.ok) return refuse(located.reason);

    // Canonicalise through every symlink and junction the platform may have inserted, then re-check containment.
    let realFile: string;
    try {
      realFile = realpathSync.native(located.absolute);
    } catch (error) {
      return refuse(classifyFsError(error));
    }
    if (!isContained(located.rootReal, realFile)) return refuse("media:escape");

    const linkStat = lstatSync(located.absolute);
    if (linkStat.isSymbolicLink()) return refuse("media:escape");
    if (!linkStat.isFile()) return refuse("media:not-a-file");

    const cap = unoOwnedMediaByteCap(decision.purpose);
    if (linkStat.size > cap) return refuse("media:too-large");
    if (linkStat.size === 0) return refuse("media:not-a-file");

    // One handle, and the opened object must be exactly the one just inspected — no swap between check and read.
    const descriptor = openSync(realFile, "r");
    try {
      const opened = fstatSync(descriptor);
      if (opened.dev !== linkStat.dev || opened.ino !== linkStat.ino) return refuse("media:unreadable");
      if (!opened.isFile()) return refuse("media:not-a-file");
      if (opened.size > cap) return refuse("media:too-large");

      const limit = request.full
        ? opened.size
        : Math.min(opened.size, UNO_OWNED_MEDIA_LIMITS.signatureBytes);
      const buffer = Buffer.allocUnsafe(limit);
      let read = 0;
      while (read < limit) {
        const chunk = readSync(descriptor, buffer, read, limit - read, read);
        if (chunk <= 0) break;
        read += chunk;
      }
      if (read !== limit) return refuse("media:unreadable");

      const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, read);
      const signature = unoOwnedMediaSignatureIssue(bytes, decision.purpose, decision.extension);
      if (signature !== null) return refuse(signature);

      if (request.full && decision.ref.integrity !== undefined) {
        const digest = createHash("sha256").update(bytes).digest("hex");
        if (digest !== decision.ref.integrity) return refuse("media:integrity-mismatch");
      }

      return Object.freeze({ accepted: true as const, bytes, mime: decision.mime, size: opened.size });
    } finally {
      closeSync(descriptor);
    }
  } catch (error) {
    return refuse(classifyFsError(error));
  }
}
