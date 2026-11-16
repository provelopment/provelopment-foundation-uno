/**
 * Foundation Uno — the physically confined authored-source reader (`UNO-WO-020 / R01`, U03).
 *
 * WHAT THIS IS. The first **real** Node-side reader of authored EFS source candidates. It turns the
 * already accepted candidate-address index into an actual, bounded, physically confined filesystem
 * read, and it feeds that read through Uno's existing `resolveDeclaredPageSource` use case so the
 * declared **JSON-before-Markdown** policy — not a lookalike and not `sources[0]` — decides which
 * source answers.
 *
 * WHAT IT IS NOT. It is not a route, a Page, a renderer, a publication decision or an app integration.
 * Nothing imports it from `src/app`; no App Router segment, middleware, redirect, sitemap, `robots.txt`,
 * metadata alternate or host mapping is created. The candidate `/en-001` stays a real HTTP 404, and an
 * accepted source payload carries no visibility, indexing, cache or publication authority. A property
 * `public: true` never means "published".
 *
 * PROVENANCE. NEW UNO-OWNED code. It composes only Uno's own contracts — `matchUnoCandidateRoute` for
 * the address, the authored graph and Site selection validators it invokes, and
 * `resolveDeclaredPageSource` / `selectDeclaredPageSource` for precedence. The bounded confinement and
 * UTF-8 rules are Uno's own; no Foundation or Solo reader, layout, site code or fallback is adopted,
 * and no upstream byte runs here.
 *
 * TRUST BOUNDARY. The caller's `repoRoot` is a **trusted absolute argument** supplied explicitly by a
 * server-side caller or a test — never `process.cwd()`, never a request value. The `pathname` is
 * untrusted and is used only as an address lookup; no cookie, header, hostname, query string, country
 * or environment value ever becomes a filename or an authority. A caller-supplied object that merely
 * *looks like* a candidate is never enough to read a file: `loadUnoCandidateSource` validates the graph
 * and the Site selection and obtains the candidate itself.
 *
 * CONFINEMENT HONESTY. Portable Node cannot prove absolute race freedom on every filesystem, and a
 * Windows checkout may not support POSIX symlink semantics for every test. This adapter therefore
 * refuses symlinks/junctions by `lstat` on every component, re-verifies identity after open, refuses
 * an unsupported critical check instead of falling back to an unsafe open, and documents that residual
 * risk rather than claiming an unimpeachable boundary.
 */

import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

import {
  resolveDeclaredPageSource,
  type DeclaredPageSourceRefusal,
  type DeclaredSourceObservation,
  type DeclaredSourceObserver,
} from "../../application/resolve-declared-page-source";
import type { PageSourceKind } from "../../core/page-authoring-policy";
import {
  matchUnoCandidateRoute,
  UNO_ROUTE_REFUSAL_REASONS,
  type UnoRouteCandidate,
  type UnoRouteRefusal,
} from "../../core/efs/uno-route-address";

/** Declared read bounds. A limit is a refusal boundary, never a truncation. */
export const UNO_SOURCE_LIMITS = Object.freeze({
  manifestBytes: 128 * 1024,
  configBytes: 8 * 1024,
  contentBytes: 64 * 1024,
  declarationPathLength: 240,
  jsonDepth: 8,
  jsonKeysPerObject: 512,
  jsonNodes: 4096,
});

/** The fixed declaration files, relative to the trusted root. Never overridable by a caller. */
export const UNO_MANIFEST_PATH = "deployment/efs/manifest.json";
export const UNO_SELECTION_PATH = "deployment/uno.config.json";
export const UNO_CONTENT_ROOT = "deployment/efs/content";

/**
 * The closed diagnostic vocabulary.
 *
 * It exists so tests can prove *why* an observation failed without the adapter ever echoing a path,
 * a file body or a system exception. Every value is a literal; nothing here is interpolated.
 */
export type UnoSourceReaderCode =
  | "root:not-a-string"
  | "root:not-absolute"
  | "root:unresolvable"
  | "root:not-a-directory"
  | "root:symlink"
  | "input:not-plain"
  | "input:unexpected-shape"
  | "declaration:invalid-kind"
  | "declaration:invalid-path"
  | "path:outside-content-root"
  | "path:absent"
  | "path:symlink"
  | "path:not-a-regular-file"
  | "path:permission-denied"
  | "path:too-large"
  | "path:identity-changed"
  | "path:unreadable"
  | "content:empty"
  | "content:nul"
  | "content:control"
  | "decode:invalid-utf8"
  | "content:raw-html"
  | "content:markdown-heading"
  | "content:markdown-body"
  | "content:json-parse"
  | "content:json-shape"
  | "content:json-pollution"
  | "content:json-depth"
  | "content:json-width"
  | "source:valid";

/** The closed diagnostic vocabulary as data. */
export const UNO_SOURCE_READER_CODES: readonly UnoSourceReaderCode[] = Object.freeze([
  "root:not-a-string",
  "root:not-absolute",
  "root:unresolvable",
  "root:not-a-directory",
  "root:symlink",
  "input:not-plain",
  "input:unexpected-shape",
  "declaration:invalid-kind",
  "declaration:invalid-path",
  "path:outside-content-root",
  "path:absent",
  "path:symlink",
  "path:not-a-regular-file",
  "path:permission-denied",
  "path:too-large",
  "path:identity-changed",
  "path:unreadable",
  "content:empty",
  "content:nul",
  "content:control",
  "decode:invalid-utf8",
  "content:raw-html",
  "content:markdown-heading",
  "content:markdown-body",
  "content:json-parse",
  "content:json-shape",
  "content:json-pollution",
  "content:json-depth",
  "content:json-width",
  "source:valid",
]);

/** The bounded, non-rendered payload an accepted observation carries. No path is included. */
export interface UnoConfinedSourceText {
  readonly kind: PageSourceKind;
  readonly text: string;
}

/** One observation of one declared candidate, in the shape the use case already accepts. */
export type UnoConfinedSourceObservation = DeclaredSourceObservation<UnoConfinedSourceText>;

/** The test-facing diagnosis: the same state plus a closed code, never a path or an exception. */
export interface UnoConfinedSourceDiagnosis {
  readonly state: "absent" | "invalid" | "valid";
  readonly code: UnoSourceReaderCode;
}

/**
 * The closed refusal vocabulary of the end-to-end loader.
 *
 * The four `source:` literals belong to this adapter; every other member is an exact literal carried
 * by the route matcher or by the declared-source use case, so no refusal is ever restated in
 * different words and none can carry a pathname, a body or a system message.
 */
export type UnoCandidateSourceRefusal =
  | "source:input-invalid"
  | "source:root-invalid"
  | "source:declarations-unreadable"
  | "source:declarations-invalid"
  | UnoRouteRefusal
  | DeclaredPageSourceRefusal;

/** The closed loader vocabulary as data. */
export const UNO_CANDIDATE_SOURCE_REFUSAL_REASONS: readonly UnoCandidateSourceRefusal[] = Object.freeze([
  "source:input-invalid",
  "source:root-invalid",
  "source:declarations-unreadable",
  "source:declarations-invalid",
  ...UNO_ROUTE_REFUSAL_REASONS,
  "invalid-input",
  "invalid-observer",
  "invalid-observation",
  "observer-failed",
  "invalid-json-source",
  "invalid-markdown-source",
  "no-valid-source",
  "unreadable-input",
] as const);

/**
 * The end-to-end result: the exact matched candidate with its selected kind and bounded text, or one
 * closed literal. There is no third shape, no URL, no response, no header and no `published` flag.
 */
export type UnoCandidateSourceResult =
  | {
      readonly accepted: true;
      readonly candidate: UnoRouteCandidate;
      readonly kind: PageSourceKind;
      readonly text: string;
    }
  | { readonly accepted: false; readonly reason: UnoCandidateSourceRefusal };

/** One internal verdict: a state, a closed code and, only when valid, the payload. */
interface Verdict {
  readonly state: "absent" | "invalid" | "valid";
  readonly code: UnoSourceReaderCode;
  readonly text?: string;
  readonly kind?: PageSourceKind;
}

/** One guarded bounded read. */
type ReadResult =
  | { readonly ok: true; readonly bytes: Buffer }
  | { readonly ok: false; readonly code: UnoSourceReaderCode };

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/** The absent verdict, used for a declared candidate that genuinely does not exist. */
const ABSENT: Verdict = Object.freeze({ state: "absent", code: "path:absent" });

/** A bounded invalid verdict. */
function invalid(code: UnoSourceReaderCode): Verdict {
  return Object.freeze({ state: "invalid", code });
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object (including `null` and an array) answers `null`. A non-plain prototype, a symbol key or
 * any accessor throws `HostileInput`, so a getter is never invoked while the request is classified.
 */
function readPlainData(value: unknown): DataRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new HostileInput();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileInput();
  const copy = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileInput();
    copy[key] = descriptor.value;
  }
  return copy;
}

/** Whether `value` is one of the two declared source kinds. */
function isSourceKind(value: unknown): value is PageSourceKind {
  return value === "json" || value === "markdown";
}


/** The one lexical grammar an authored declaration path must satisfy, mirroring the graph rule. */
const DECLARATION_PATTERN = /^[A-Za-z0-9._/-]+$/;

/**
 * Validate one declaration path lexically, before any filesystem call.
 *
 * This mirrors — and never loosens — `manifest-graph.ts`'s own `sourcePathIssue` rule: printable
 * ASCII, the exact content root, forward slashes only, no traversal, no hidden segment, and the suffix
 * its kind requires. An unsafe declaration is refused, never normalised into a permissible one.
 */
function declarationPathIssue(path: unknown, kind: PageSourceKind): UnoSourceReaderCode | null {
  if (typeof path !== "string") return "declaration:invalid-path";
  if (path.length === 0 || path.length > UNO_SOURCE_LIMITS.declarationPathLength) {
    return "declaration:invalid-path";
  }
  if (path.includes("\u0000")) return "declaration:invalid-path";
  if (!DECLARATION_PATTERN.test(path)) return "declaration:invalid-path";
  if (path.startsWith("/") || path.includes(":")) return "declaration:invalid-path";
  if (!path.startsWith(`${UNO_CONTENT_ROOT}/`)) return "path:outside-content-root";

  const relativePath = path.slice(UNO_CONTENT_ROOT.length + 1);
  if (relativePath.length === 0) return "declaration:invalid-path";
  for (const segment of relativePath.split("/")) {
    if (segment.length === 0 || segment === "." || segment === "..") return "declaration:invalid-path";
    if (segment.startsWith(".")) return "declaration:invalid-path";
  }
  return path.endsWith(kind === "markdown" ? ".md" : ".json") ? null : "declaration:invalid-path";
}

/** Classify one filesystem error without echoing its message. */
function classifyFsError(error: unknown): UnoSourceReaderCode {
  const code = typeof error === "object" && error !== null ? (error as { code?: unknown }).code : undefined;
  if (code === "ENOENT" || code === "ENOTDIR") return "path:absent";
  if (code === "EACCES" || code === "EPERM") return "path:permission-denied";
  if (code === "ELOOP") return "path:symlink";
  return "path:unreadable";
}

/** Whether `child` is physically inside `parent` by real path-relative containment. */
function isContained(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  if (rel.length === 0) return false;
  if (isAbsolute(rel)) return false;
  return rel !== ".." && !rel.startsWith(`..${sep}`);
}

/**
 * Resolve the caller's trusted root physically.
 *
 * The root must be an absolute string, must exist, must be a real directory (never a symlink), and its
 * `realpath` must still be that directory. Nothing here defaults to `process.cwd()`.
 */
function resolveTrustedRoot(repoRoot: unknown): { readonly ok: true; readonly root: string } | { readonly ok: false; readonly code: UnoSourceReaderCode } {
  if (typeof repoRoot !== "string" || repoRoot.length === 0) return { ok: false, code: "root:not-a-string" };
  if (repoRoot.includes("\u0000")) return { ok: false, code: "root:not-absolute" };
  if (!isAbsolute(repoRoot)) return { ok: false, code: "root:not-absolute" };

  let stats: ReturnType<typeof lstatSync>;
  try {
    stats = lstatSync(repoRoot);
  } catch {
    return { ok: false, code: "root:unresolvable" };
  }
  if (stats.isSymbolicLink()) return { ok: false, code: "root:symlink" };
  if (!stats.isDirectory()) return { ok: false, code: "root:not-a-directory" };

  let physical: string;
  try {
    physical = realpathSync(repoRoot);
  } catch {
    return { ok: false, code: "root:unresolvable" };
  }
  return { ok: true, root: physical };
}

/**
 * Walk every path component under the trusted root and refuse a symlink or junction anywhere.
 *
 * Returns `null` when the whole chain is physically ordinary, otherwise the first closed code. A
 * missing final component is `absent`; a missing intermediate component is `absent` too, because the
 * declared candidate cannot exist behind it.
 */
function componentIssue(root: string, segments: readonly string[]): UnoSourceReaderCode | null {
  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (segment === undefined) return "declaration:invalid-path";
    current = join(current, segment);

    let stats: ReturnType<typeof lstatSync>;
    try {
      stats = lstatSync(current);
    } catch (error) {
      return classifyFsError(error);
    }
    if (stats.isSymbolicLink()) return "path:symlink";
    const isLast = index === segments.length - 1;
    if (!isLast && !stats.isDirectory()) return "path:not-a-regular-file";
  }
  return null;
}

/** The ordinary-path segments of a validated declaration, excluding the content root itself. */
function declarationSegments(path: string): readonly string[] {
  return path.split("/");
}


/**
 * Read one ordinary file with a hard byte budget, refusing anything but a regular file.
 *
 * The pre-`lstat` establishes kind and size, `O_NOFOLLOW` (where the platform supports it) refuses a
 * swapped-in link, the post-open `fstat` re-checks kind, size and identity, and the read loop stops at
 * the cap even if the file grows after the first stat. Every failure is one closed code.
 */
function readBoundedFile(absolutePath: string, cap: number): ReadResult {
  let before: ReturnType<typeof lstatSync>;
  try {
    before = lstatSync(absolutePath);
  } catch (error) {
    return { ok: false, code: classifyFsError(error) };
  }
  if (before.isSymbolicLink()) return { ok: false, code: "path:symlink" };
  if (!before.isFile()) return { ok: false, code: "path:not-a-regular-file" };
  if (before.size > cap) return { ok: false, code: "path:too-large" };

  const noFollow =
    typeof fsConstants.O_NOFOLLOW === "number" && Number.isFinite(fsConstants.O_NOFOLLOW)
      ? fsConstants.O_NOFOLLOW
      : 0;

  let descriptor: number;
  try {
    descriptor = openSync(absolutePath, fsConstants.O_RDONLY | noFollow);
  } catch (error) {
    return { ok: false, code: classifyFsError(error) };
  }

  try {
    const after = fstatSync(descriptor);
    if (!after.isFile()) return { ok: false, code: "path:not-a-regular-file" };
    if (after.size > cap) return { ok: false, code: "path:too-large" };
    if (before.ino !== 0 && after.ino !== 0) {
      if (before.ino !== after.ino || before.dev !== after.dev) {
        return { ok: false, code: "path:identity-changed" };
      }
    }

    const chunks: Buffer[] = [];
    let total = 0;
    const buffer = Buffer.alloc(8192);
    for (;;) {
      const read = readSync(descriptor, buffer, 0, buffer.length, null);
      if (read <= 0) break;
      total += read;
      if (total > cap) return { ok: false, code: "path:too-large" };
      chunks.push(Buffer.from(buffer.subarray(0, read)));
    }
    return { ok: true, bytes: Buffer.concat(chunks, total) };
  } catch {
    return { ok: false, code: "path:unreadable" };
  } finally {
    try {
      closeSync(descriptor);
    } catch {
      // A close failure cannot make a refused or already-read payload unsafe to classify.
    }
  }
}

/** Decode strictly as UTF-8: malformed bytes are a refusal, never a replacement character. */
function decodeUtf8(bytes: Buffer): { readonly ok: true; readonly text: string } | { readonly ok: false; readonly code: UnoSourceReaderCode } {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });
    return { ok: true, text: decoder.decode(bytes) };
  } catch {
    return { ok: false, code: "decode:invalid-utf8" };
  }
}

/** Refuse NUL and control characters that no authored Markdown or JSON source may carry. */
function controlIssue(text: string): UnoSourceReaderCode | null {
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit === 0) return "content:nul";
    if (unit === 0x09 || unit === 0x0a || unit === 0x0d) continue;
    if (unit < 0x20 || unit === 0x7f) return "content:control";
  }
  return null;
}

/**
 * Validate a Markdown source minimally and safely: non-empty, one leading `# ` heading, a real body,
 * no raw HTML. The text stays opaque — it is never rendered, escaped into HTML or parsed further.
 */
function markdownIssue(text: string): UnoSourceReaderCode | null {
  if (text.trim().length === 0) return "content:empty";
  if (/<[a-zA-Z/!]/.test(text)) return "content:raw-html";

  const lines = text.split("\n").map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
  let index = 0;
  while (index < lines.length && (lines[index] as string).trim().length === 0) index += 1;
  const heading = lines[index];
  if (heading === undefined || !heading.startsWith("# ") || heading.slice(2).trim().length === 0) {
    return "content:markdown-heading";
  }
  const body = lines.slice(index + 1).join("\n").trim();
  return body.length === 0 ? "content:markdown-body" : null;
}

/** Walk parsed JSON for the closed safety properties: no prototype keys, bounded depth and width. */
function jsonSafetyIssue(value: unknown, depth: number, budget: { nodes: number }): UnoSourceReaderCode | null {
  if (depth > UNO_SOURCE_LIMITS.jsonDepth) return "content:json-depth";
  budget.nodes += 1;
  if (budget.nodes > UNO_SOURCE_LIMITS.jsonNodes) return "content:json-width";

  if (Array.isArray(value)) {
    for (const item of value) {
      const issue = jsonSafetyIssue(item, depth + 1, budget);
      if (issue !== null) return issue;
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length > UNO_SOURCE_LIMITS.jsonKeysPerObject) return "content:json-width";
    for (const key of keys) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return "content:json-pollution";
      }
      const issue = jsonSafetyIssue(record[key], depth + 1, budget);
      if (issue !== null) return issue;
    }
  }
  return null;
}

/**
 * Validate a JSON source as syntax and safety only: one ordinary top-level object, strict parse and a
 * bounded, prototype-safe body. No document schema, canonical, visibility or `published` flag is read,
 * and the caller receives the original text rather than promoted fields.
 */
function jsonIssue(text: string): UnoSourceReaderCode | null {
  if (text.trim().length === 0) return "content:empty";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return "content:json-parse";
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "content:json-shape";
  }
  return jsonSafetyIssue(parsed, 0, { nodes: 0 });
}


/**
 * The guarded observation walk: one request, one closed verdict.
 *
 * Order matters and is itself the protection: classify the request, resolve the root physically,
 * validate the declaration lexically, walk every component for symlinks, confirm physical containment
 * of the content root and of the file, then perform one bounded read and one content validation.
 */
function observeWithCode(input: unknown): Verdict {
  let request: DataRecord | null;
  let declaration: DataRecord | null;
  try {
    request = readPlainData(input);
    if (request === null) return invalid("input:not-plain");
    const keys = Object.keys(request);
    if (keys.length !== 2 || !keys.includes("repoRoot") || !keys.includes("declaration")) {
      return invalid("input:unexpected-shape");
    }
    declaration = readPlainData(request["declaration"]);
    if (declaration === null) return invalid("input:unexpected-shape");
  } catch {
    return invalid("input:not-plain");
  }

  const declarationKeys = Object.keys(declaration);
  if (
    declarationKeys.length !== 2 ||
    !declarationKeys.includes("kind") ||
    !declarationKeys.includes("path")
  ) {
    return invalid("input:unexpected-shape");
  }

  const kind = declaration["kind"];
  if (!isSourceKind(kind)) return invalid("declaration:invalid-kind");

  const declaredPath = declaration["path"];
  const pathIssue = declarationPathIssue(declaredPath, kind);
  if (pathIssue !== null) return invalid(pathIssue);
  const segmentList = declarationSegments(declaredPath as string);

  const root = resolveTrustedRoot(request["repoRoot"]);
  if (!root.ok) return invalid(root.code);

  const walkIssue = componentIssue(root.root, segmentList);
  if (walkIssue !== null) return walkIssue === "path:absent" ? ABSENT : invalid(walkIssue);

  const contentRootPath = join(root.root, ...UNO_CONTENT_ROOT.split("/"));
  let physicalContentRoot: string;
  try {
    physicalContentRoot = realpathSync(contentRootPath);
  } catch (error) {
    const code = classifyFsError(error);
    return code === "path:absent" ? ABSENT : invalid(code);
  }
  if (!isContained(root.root, physicalContentRoot)) return invalid("path:outside-content-root");

  const absolutePath = join(root.root, ...segmentList);
  let physicalFile: string;
  try {
    physicalFile = realpathSync(absolutePath);
  } catch (error) {
    const code = classifyFsError(error);
    return code === "path:absent" ? ABSENT : invalid(code);
  }
  if (!isContained(physicalContentRoot, physicalFile)) return invalid("path:outside-content-root");
  if (!isContained(root.root, physicalFile)) return invalid("path:outside-content-root");

  const read = readBoundedFile(absolutePath, UNO_SOURCE_LIMITS.contentBytes);
  if (!read.ok) return invalid(read.code);

  const decoded = decodeUtf8(read.bytes);
  if (!decoded.ok) return invalid(decoded.code);

  const controlFailure = controlIssue(decoded.text);
  if (controlFailure !== null) return invalid(controlFailure);

  const contentFailure = kind === "markdown" ? markdownIssue(decoded.text) : jsonIssue(decoded.text);
  if (contentFailure !== null) return invalid(contentFailure);

  return Object.freeze({ state: "valid", code: "source:valid", text: decoded.text, kind });
}

/**
 * Observe one previously declared source candidate.
 *
 * Returns `absent` only when the declared file genuinely does not exist, `invalid` when anything about
 * the request, the confinement or the content failed, and `valid` with the bounded text. An `invalid`
 * observation is never downgraded to `absent`, and no absolute path crosses the boundary.
 */
export function observeUnoConfinedSource(input: unknown): UnoConfinedSourceObservation {
  const verdict = observeWithCodeSafe(input);
  if (verdict.state === "absent") return { state: "absent" };
  if (verdict.state === "invalid") return { state: "invalid" };
  return {
    state: "valid",
    source: { kind: verdict.kind as PageSourceKind, text: verdict.text as string },
  };
}

/**
 * The closed-code diagnosis used by tests to prove *which* rule refused.
 *
 * It runs exactly the same walk as `observeUnoConfinedSource` and returns the state with its literal
 * code. It never returns a path, a body, a system message or a stack.
 */
export function diagnoseUnoConfinedSource(input: unknown): UnoConfinedSourceDiagnosis {
  const verdict = observeWithCodeSafe(input);
  return Object.freeze({ state: verdict.state, code: verdict.code });
}

/** Run the walk without letting any unexpected throw escape as an exception. */
function observeWithCodeSafe(input: unknown): Verdict {
  try {
    return observeWithCode(input);
  } catch {
    return invalid("path:unreadable");
  }
}


/** The bounded loader refusal. No partial payload, no echoed value. */
function refuseLoad(reason: UnoCandidateSourceRefusal): UnoCandidateSourceResult {
  return Object.freeze({ accepted: false, reason });
}

/** One fixed declaration file, read under the same confinement as any authored source. */
type FixedJsonResult =
  | { readonly ok: true; readonly data: unknown }
  | { readonly ok: false; readonly code: UnoSourceReaderCode };

/**
 * Read one of the two FIXED declaration files and parse it strictly.
 *
 * The name is never caller-controlled: the only paths this loader can read first are
 * `deployment/efs/manifest.json` and `deployment/uno.config.json`. A confinement failure, an oversize
 * file, malformed UTF-8 or invalid JSON is a refusal — never an absence and never a fallback.
 */
function readFixedJson(root: string, relativePath: string, cap: number): FixedJsonResult {
  const segments = relativePath.split("/");
  const walkIssue = componentIssue(root, segments);
  if (walkIssue !== null) return { ok: false, code: walkIssue };

  const read = readBoundedFile(join(root, ...segments), cap);
  if (!read.ok) return { ok: false, code: read.code };

  const decoded = decodeUtf8(read.bytes);
  if (!decoded.ok) return { ok: false, code: decoded.code };

  try {
    return { ok: true, data: JSON.parse(decoded.text) as unknown };
  } catch {
    return { ok: false, code: "content:json-parse" };
  }
}

/** Closed reason codes for the fixed declaration reads, kept distinct from a source refusal. */
function declarationRefusal(code: UnoSourceReaderCode): UnoCandidateSourceRefusal {
  return code === "content:json-parse" ? "source:declarations-invalid" : "source:declarations-unreadable";
}

/**
 * Load the source a candidate address declares, end to end, from a real filesystem.
 *
 * Steps, in this order: validate the request; resolve the trusted root physically; read the two FIXED
 * declaration files; obtain the candidate **only** through `matchUnoCandidateRoute`; create one
 * observer per declared source; and let the existing `resolveDeclaredPageSource` use case decide
 * precedence. A valid JSON declaration wins even when Markdown was listed first, an invalid JSON
 * declaration refuses before Markdown is opened, an absent JSON may let declared Markdown answer, and
 * an undeclared file is never probed.
 */
export async function loadUnoCandidateSource(input: unknown): Promise<UnoCandidateSourceResult> {
  try {
    return await analyzeLoad(input, null);
  } catch {
    return refuseLoad("source:input-invalid");
  }
}

/**
 * The same load with an observable trace of which declared kinds were actually observed.
 *
 * This exists for tests to prove the precedence contract — that Markdown was never opened after a
 * valid or invalid JSON, for example — without weakening the production API or reimplementing the
 * policy. The trace is the kinds whose observer ran, in order.
 */
export async function traceUnoCandidateSource(
  input: unknown,
): Promise<{ readonly result: UnoCandidateSourceResult; readonly observed: readonly PageSourceKind[] }> {
  const observed: PageSourceKind[] = [];
  try {
    const result = await analyzeLoad(input, observed);
    return Object.freeze({ result, observed: Object.freeze(observed.slice()) });
  } catch {
    return Object.freeze({ result: refuseLoad("source:input-invalid"), observed: Object.freeze(observed.slice()) });
  }
}

/** The guarded end-to-end walk. */
async function analyzeLoad(
  input: unknown,
  trace: PageSourceKind[] | null,
): Promise<UnoCandidateSourceResult> {
  const request = readPlainData(input);
  if (request === null) return refuseLoad("source:input-invalid");
  const requestKeys = Object.keys(request);
  if (requestKeys.length !== 2 || !requestKeys.includes("repoRoot") || !requestKeys.includes("pathname")) {
    return refuseLoad("source:input-invalid");
  }

  const root = resolveTrustedRoot(request["repoRoot"]);
  if (!root.ok) return refuseLoad("source:root-invalid");

  const manifest = readFixedJson(root.root, UNO_MANIFEST_PATH, UNO_SOURCE_LIMITS.manifestBytes);
  if (!manifest.ok) return refuseLoad(declarationRefusal(manifest.code));

  const selection = readFixedJson(root.root, UNO_SELECTION_PATH, UNO_SOURCE_LIMITS.configBytes);
  if (!selection.ok) return refuseLoad(declarationRefusal(selection.code));

  const matched = matchUnoCandidateRoute(request["pathname"], manifest.data, selection.data);
  if (!matched.accepted) return refuseLoad(matched.reason);
  const candidate = matched.candidate;

  const observers: DeclaredSourceObserver<UnoConfinedSourceText>[] = [];
  const kinds = new Set<PageSourceKind>();
  for (const declared of candidate.sources) {
    const kind = declared.kind;
    if (!isSourceKind(kind)) return refuseLoad("source:declarations-invalid");
    if (kinds.has(kind)) return refuseLoad("source:declarations-invalid");
    kinds.add(kind);

    const declaration = Object.freeze({ kind, path: declared.path });
    observers.push({
      kind,
      observe: () => {
        if (trace !== null) trace.push(kind);
        return observeUnoConfinedSource({ repoRoot: root.root, declaration });
      },
    });
  }
  if (observers.length === 0) return refuseLoad("source:declarations-invalid");

  const resolved = await resolveDeclaredPageSource<UnoConfinedSourceText>(observers);
  if (!resolved.accepted) return refuseLoad(resolved.reason);
  if (resolved.source.kind !== resolved.kind) return refuseLoad("invalid-observation");

  return Object.freeze({
    accepted: true,
    candidate,
    kind: resolved.kind,
    text: resolved.source.text,
  });
}
