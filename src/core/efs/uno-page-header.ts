/**
 * Foundation Uno — the selected Page-header and visibility projector (`UNO-WO-021 / R01`, U03).
 *
 * WHAT THIS IS. One pure, closed projection from an **already loaded** authored source payload to a
 * bounded, **non-serving** Page header: the display `title`, an optional `description`, the already
 * decided `visibility`, and — for Markdown only — the raw, unrendered `markdownBody`. It is the first
 * Uno-owned statement of what a Page *header* means, and it is deliberately far smaller than a Page
 * document.
 *
 * WHAT IT IS NOT. It is not a Page, a module system, a renderer or a publication decision. It returns no
 * URL, canonical, `hreflang`, rendered HTML, sitemap entry, redirect, response, host, provider or
 * release data, and it never says a Page exists, is routed or is published. A successful projection
 * explicitly does **not** mean the JSON `modules` array, or the whole Page document, is valid: every
 * other JSON key stays opaque, unvalidated and non-authoritative, and only the three bounded header keys
 * are read.
 *
 * PROVENANCE. Original **Uno-owned** code, class **REWRITE concept / DEFER**. The read-only comparator
 * was Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`,
 * `src/core/page-document.ts` (Git blob `a12d964c43626c6313a621bf628f5cc24b65d444`, 45,106 bytes), whose
 * Page schema, section families, module AST and document fields are **not** adopted and whose text is
 * never copied. Only the already-approved `public | unlisted` vocabulary and the reserved Home rule
 * appear here, and both live in `src/core/page-authoring-policy.ts` — this module **calls** that policy
 * instead of restating it. The 17 module families and the full document schema remain U04 obligations.
 *
 * TRUST BOUNDARY. `input` is untrusted `unknown`. It is classified as plain own data before any field is
 * read, so a getter, a symbol key, an exotic prototype or a throwing Proxy trap cannot run code or escape
 * as an exception, and no refusal ever interpolates a caller value, a path, a source body or a stack.
 * The module is pure: it imports no `node:` built-in, no framework, no adapter, no deployment file and no
 * provider, performs no I/O and mutates nothing it was given.
 */
import { isPageRoutePath } from "../page-route-path";
import {
  decideSelectedPageVisibility,
  type PageSourceKind,
  type PageVisibility,
  type PageVisibilityRefusal,
} from "../page-authoring-policy";

/** The bounded caps this projection enforces. Documented, and applied as refusals, never truncation. */
export const UNO_PAGE_HEADER_LIMITS = Object.freeze({
  sourceBytes: 64 * 1024,
  titleCodePoints: 160,
  descriptionCodePoints: 320,
  jsonDepth: 8,
  jsonNodes: 4096,
});

/**
 * The closed projector refusal vocabulary.
 *
 * The `header:` literals belong to this module. The remaining members are the exact reasons the existing
 * visibility policy already returns, so a policy refusal is never restated in different words.
 */
export type UnoPageHeaderRefusal =
  | "header:input-not-plain"
  | "header:input-shape"
  | "header:unknown-kind"
  | "header:route-invalid"
  | "header:text-not-a-string"
  | "header:text-empty"
  | "header:text-too-large"
  | "header:text-not-scalar"
  | "header:text-nul"
  | "header:text-control"
  | "header:text-raw-html"
  | "header:markdown-front-matter"
  | "header:markdown-visibility"
  | "header:markdown-heading"
  | "header:markdown-body"
  | "header:json-parse"
  | "header:json-shape"
  | "header:json-duplicate-key"
  | "header:json-pollution"
  | "header:json-depth"
  | "header:json-width"
  | "header:title-missing"
  | "header:title-not-a-string"
  | "header:title-empty"
  | "header:title-too-long"
  | "header:title-multiline"
  | "header:title-unsafe"
  | "header:description-not-a-string"
  | "header:description-empty"
  | "header:description-too-long"
  | "header:description-multiline"
  | "header:description-unsafe"
  | PageVisibilityRefusal;

/** The closed projector vocabulary as data. */
export const UNO_PAGE_HEADER_REFUSAL_REASONS: readonly UnoPageHeaderRefusal[] = Object.freeze([
  "header:input-not-plain",
  "header:input-shape",
  "header:unknown-kind",
  "header:route-invalid",
  "header:text-not-a-string",
  "header:text-empty",
  "header:text-too-large",
  "header:text-not-scalar",
  "header:text-nul",
  "header:text-control",
  "header:text-raw-html",
  "header:markdown-front-matter",
  "header:markdown-visibility",
  "header:markdown-heading",
  "header:markdown-body",
  "header:json-parse",
  "header:json-shape",
  "header:json-duplicate-key",
  "header:json-pollution",
  "header:json-depth",
  "header:json-width",
  "header:title-missing",
  "header:title-not-a-string",
  "header:title-empty",
  "header:title-too-long",
  "header:title-multiline",
  "header:title-unsafe",
  "header:description-not-a-string",
  "header:description-empty",
  "header:description-too-long",
  "header:description-multiline",
  "header:description-unsafe",
  "input-not-a-plain-object",
  "input-not-plain-data",
  "unexpected-key",
  "missing-field",
  "unknown-source-kind",
  "invalid-route-path",
  "unknown-visibility",
  "markdown-visibility-not-allowed",
  "home-cannot-be-unlisted",
  "unreadable-input",
] as const);

/**
 * The bounded projected header.
 *
 * Only these fields exist. `markdownBody` appears for Markdown only and is raw text, never HTML; there is
 * no `published`, `url`, `route`, `canonical`, `hreflang`, `modules`, `sitemap` or provider field, and no
 * field may be added without a new Owner order.
 */
export interface UnoProjectedPageHeader {
  readonly kind: PageSourceKind;
  readonly title: string;
  readonly description?: string;
  readonly visibility: PageVisibility;
  readonly markdownBody?: string;
}

/** The projector result: the bounded header, or one closed literal and no partial data. */
export type UnoPageHeaderResult =
  | ({ readonly accepted: true } & UnoProjectedPageHeader)
  | { readonly accepted: false; readonly reason: UnoPageHeaderRefusal };

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/** One bounded refusal, used for every early exit. */
function refuseProjection(reason: UnoPageHeaderRefusal): UnoPageHeaderResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object (including `null` and an array) answers `null`. A non-plain prototype, a symbol key or any
 * accessor throws `HostileInput`, so no getter is invoked while the request is classified.
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

/** One own data property, read without invoking an accessor. */
function readOwnField(record: DataRecord, key: string): { readonly present: boolean; readonly value: unknown } {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined) return { present: false, value: undefined };
  if (!("value" in descriptor)) throw new HostileInput();
  return { present: true, value: descriptor.value };
}

/** The number of UTF-8 bytes a validated scalar string occupies, computed without any Node API. */
function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit < 0x80) {
      bytes += 1;
    } else if (unit < 0x800) {
      bytes += 2;
    } else if (unit >= 0xd800 && unit <= 0xdbff) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * Refuse NUL, forbidden ASCII control characters and unpaired surrogates.
 *
 * `\t`, `\n` and `\r` are permitted here so that Markdown structure and CRLF fixtures survive; the field
 * rules below still refuse a line break inside a single-line title or description.
 */
function sourceTextIssue(text: string): UnoPageHeaderRefusal | null {
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit === 0) return "header:text-nul";
    if (unit >= 0xdc00 && unit <= 0xdfff) return "header:text-not-scalar";
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = index + 1 < text.length ? text.charCodeAt(index + 1) : 0;
      if (next < 0xdc00 || next > 0xdfff) return "header:text-not-scalar";
      index += 1;
      continue;
    }
    if (unit === 0x09 || unit === 0x0a || unit === 0x0d) continue;
    if (unit < 0x20 || unit === 0x7f) return "header:text-control";
  }
  return null;
}


/** The maximum code points of one header field. */
function fieldLimit(field: "title" | "description"): number {
  return field === "title" ? UNO_PAGE_HEADER_LIMITS.titleCodePoints : UNO_PAGE_HEADER_LIMITS.descriptionCodePoints;
}

/** One validated single-line field, or the exact refusal. */
type FieldResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: UnoPageHeaderRefusal };

/**
 * Validate one single-line header field and return its trimmed value.
 *
 * `title` is required and `description` optional, but both share every safety rule: plain text only, no
 * markup characters, no NUL or control, no unpaired surrogate, no line break, and a code-point cap.
 */
function validateField(value: unknown, field: "title" | "description"): FieldResult {
  const prefix = field === "title" ? "header:title" : "header:description";
  if (typeof value !== "string") return { ok: false, reason: `${prefix}-not-a-string` as UnoPageHeaderRefusal };

  const trimmed = value.trim();
  if (trimmed.length === 0) return { ok: false, reason: `${prefix}-empty` as UnoPageHeaderRefusal };
  // A UTF-16 length above twice the code-point cap is unambiguously above the cap.
  if (trimmed.length > fieldLimit(field) * 2) {
    return { ok: false, reason: `${prefix}-too-long` as UnoPageHeaderRefusal };
  }

  const unsafe = sourceTextIssue(trimmed);
  if (unsafe !== null) return { ok: false, reason: `${prefix}-unsafe` as UnoPageHeaderRefusal };
  if (trimmed.includes("\n") || trimmed.includes("\r") || trimmed.includes("\t")) {
    return { ok: false, reason: `${prefix}-multiline` as UnoPageHeaderRefusal };
  }
  if (trimmed.includes("<") || trimmed.includes(">")) {
    return { ok: false, reason: `${prefix}-unsafe` as UnoPageHeaderRefusal };
  }
  if (Array.from(trimmed).length > fieldLimit(field)) {
    return { ok: false, reason: `${prefix}-too-long` as UnoPageHeaderRefusal };
  }
  return { ok: true, text: trimmed };
}

/** Split Markdown into LF-normalised lines without inventing or dropping content. */
function markdownLines(text: string): readonly string[] {
  return text
    .split("\n")
    .map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
}

/** The index of the first line with visible content, or `-1`. */
function firstMeaningfulLine(lines: readonly string[]): number {
  for (let index = 0; index < lines.length; index += 1) {
    if ((lines[index] as string).trim().length > 0) return index;
  }
  return -1;
}

/**
 * Ask the existing visibility policy and unwrap its answer.
 *
 * The policy — not this module — owns the reserved Home rule and the rule that Markdown may never declare
 * a visibility. A `visibility` argument is passed only for JSON, and only when the source declared one.
 */
function decideVisibility(
  kind: PageSourceKind,
  routePath: string,
  declaresVisibility: boolean,
  visibility: unknown,
): { readonly ok: true; readonly visibility: PageVisibility } | { readonly ok: false; readonly reason: UnoPageHeaderRefusal } {
  const decision = decideSelectedPageVisibility(
    declaresVisibility
      ? { source: kind, routePath, visibility }
      : { source: kind, routePath },
  );
  if (!decision.accepted) return { ok: false, reason: decision.reason };
  return { ok: true, visibility: decision.visibility };
}

/**
 * Project one Markdown source.
 *
 * The first meaningful line must be a single simple `# ` title, and the remaining nonempty text is the raw
 * body. YAML front matter, raw HTML and any front-matter-style `visibility:` declaration are refused, and
 * the body is returned as unrendered text only.
 */
function projectMarkdown(
  text: string,
  routePath: string,
): UnoPageHeaderResult {
  const lines = markdownLines(text);
  const first = firstMeaningfulLine(lines);
  if (first === -1) return refuseProjection("header:text-empty");
  if ((lines[first] as string).trim().startsWith("---")) return refuseProjection("header:markdown-front-matter");

  for (const line of lines) {
    if (/^\s*visibility\s*:/i.test(line)) return refuseProjection("header:markdown-visibility");
  }

  const headingLine = lines[first] as string;
  if (!headingLine.startsWith("# ")) return refuseProjection("header:markdown-heading");
  const title = validateField(headingLine.slice(2), "title");
  if (!title.ok) return refuseProjection(title.reason);

  const body = lines.slice(first + 1).join("\n").trim();
  if (body.length === 0) return refuseProjection("header:markdown-body");

  const visibility = decideVisibility("markdown", routePath, false, undefined);
  if (!visibility.ok) return refuseProjection(visibility.reason);

  return Object.freeze({
    accepted: true,
    kind: "markdown" as PageSourceKind,
    title: title.text,
    visibility: visibility.visibility,
    markdownBody: body,
  });
}

/** Whether one character is JSON insignificant whitespace. */
function isJsonSpace(character: string | undefined): boolean {
  return character === " " || character === "\t" || character === "\n" || character === "\r";
}

/** Read one JSON string literal from `start`, returning its decoded value and end offset. */
function readJsonString(text: string, start: number): { readonly value: string; readonly end: number } | null {
  if (text[start] !== '"') return null;
  let index = start + 1;
  while (index < text.length) {
    const character = text[index];
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === '"') {
      try {
        return { value: JSON.parse(text.slice(start, index + 1)) as string, end: index + 1 };
      } catch {
        return null;
      }
    }
    index += 1;
  }
  return null;
}

/** Skip one JSON value, returning the offset after it. */
function skipJsonValue(text: string, start: number): number | null {
  const first = text[start];
  if (first === '"') {
    const literal = readJsonString(text, start);
    return literal === null ? null : literal.end;
  }
  if (first === "{" || first === "[") {
    let depth = 0;
    let index = start;
    while (index < text.length) {
      const character = text[index];
      if (character === '"') {
        const literal = readJsonString(text, index);
        if (literal === null) return null;
        index = literal.end;
        continue;
      }
      if (character === "{" || character === "[") depth += 1;
      else if (character === "}" || character === "]") {
        depth -= 1;
        if (depth === 0) return index + 1;
      }
      index += 1;
    }
    return null;
  }
  let index = start;
  while (index < text.length) {
    const character = text[index] as string;
    if (character === "," || character === "}" || character === "]" || isJsonSpace(character)) break;
    index += 1;
  }
  return index > start ? index : null;
}

/**
 * Refuse a repeated **top-level** `title`, `description` or `visibility` key.
 *
 * `JSON.parse` silently keeps the last of two identical keys, which would let a later value quietly win
 * authority over an earlier one. This raw scan reads the top-level keys from the same text and fails the
 * whole source closed instead, so the same bytes can never mean two different headers.
 */
function duplicateAuthorityKeyIssue(text: string): UnoPageHeaderRefusal | null {
  const authority = new Set(["title", "description", "visibility"]);
  const seen = new Set<string>();

  let index = 0;
  while (index < text.length && isJsonSpace(text[index])) index += 1;
  if (text[index] !== "{") return null;
  index += 1;

  for (;;) {
    while (index < text.length && isJsonSpace(text[index])) index += 1;
    if (index >= text.length || text[index] === "}") return null;
    const key = readJsonString(text, index);
    if (key === null) return null;
    index = key.end;

    while (index < text.length && isJsonSpace(text[index])) index += 1;
    if (text[index] !== ":") return null;
    index += 1;
    const next = skipJsonValue(text, index);
    if (next === null) return null;
    index = next;

    if (authority.has(key.value)) {
      if (seen.has(key.value)) return "header:json-duplicate-key";
      seen.add(key.value);
    }

    while (index < text.length && isJsonSpace(text[index])) index += 1;
    if (text[index] === ",") {
      index += 1;
      continue;
    }
    return null;
  }
}

/** Walk parsed JSON for prototype keys and bounded depth/width. */
function jsonSafetyIssue(value: unknown, depth: number, budget: { nodes: number }): UnoPageHeaderRefusal | null {
  if (depth > UNO_PAGE_HEADER_LIMITS.jsonDepth) return "header:json-depth";
  budget.nodes += 1;
  if (budget.nodes > UNO_PAGE_HEADER_LIMITS.jsonNodes) return "header:json-width";

  if (Array.isArray(value)) {
    for (const item of value) {
      const issue = jsonSafetyIssue(item, depth + 1, budget);
      if (issue !== null) return issue;
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") return "header:json-pollution";
      const issue = jsonSafetyIssue(record[key], depth + 1, budget);
      if (issue !== null) return issue;
    }
  }
  return null;
}

/**
 * Project one JSON source.
 *
 * Only the top-level `title`, `description` and `visibility` are read. Every other key — `modules`,
 * `public`, host, provider, assets, ownership, release and anything else — stays opaque, unvalidated and
 * **non-authoritative**, and is neither returned nor interpreted. Visibility is decided by the existing
 * policy, so the reserved Home rule and the `public | unlisted` vocabulary are never restated here.
 */
function projectJson(text: string, routePath: string): UnoPageHeaderResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return refuseProjection("header:json-parse");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return refuseProjection("header:json-shape");
  }

  const duplicate = duplicateAuthorityKeyIssue(text);
  if (duplicate !== null) return refuseProjection(duplicate);

  const safety = jsonSafetyIssue(parsed, 0, { nodes: 0 });
  if (safety !== null) return refuseProjection(safety);

  const record = parsed as Record<string, unknown>;
  const titleField = readOwnField(record, "title");
  if (!titleField.present) return refuseProjection("header:title-missing");
  const title = validateField(titleField.value, "title");
  if (!title.ok) return refuseProjection(title.reason);

  const descriptionField = readOwnField(record, "description");
  let description: string | undefined;
  if (descriptionField.present) {
    const checked = validateField(descriptionField.value, "description");
    if (!checked.ok) return refuseProjection(checked.reason);
    description = checked.text;
  }

  const visibilityField = readOwnField(record, "visibility");
  const visibility = decideVisibility("json", routePath, visibilityField.present, visibilityField.value);
  if (!visibility.ok) return refuseProjection(visibility.reason);

  const header: {
    accepted: true;
    kind: PageSourceKind;
    title: string;
    description?: string;
    visibility: PageVisibility;
  } = {
    accepted: true,
    kind: "json",
    title: title.text,
    visibility: visibility.visibility,
  };
  if (description !== undefined) header.description = description;
  return Object.freeze(header);
}

/**
 * Project the bounded, non-serving header of one **selected** Page representation.
 *
 * The input must be exactly plain own data `{ kind, text, routePath }` where `kind` is `json` or
 * `markdown`, `text` is the already loaded source payload, and `routePath` is the validated **authoring**
 * path — the reserved Home is `"home"`, and every other Page is a nonempty relative route. The candidate
 * pathname is never accepted here: an address is not an authoring identity.
 *
 * A successful projection is a header only. It is not a Page document, it is not a module schema, and it
 * never means the Page is published, routed or indexable.
 */
export function projectUnoSelectedPageHeader(input: unknown): UnoPageHeaderResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuseProjection("header:input-not-plain");

    const keys = Object.keys(request);
    if (
      keys.length !== 3 ||
      !keys.includes("kind") ||
      !keys.includes("text") ||
      !keys.includes("routePath")
    ) {
      return refuseProjection("header:input-shape");
    }

    const kind = request["kind"];
    if (kind !== "json" && kind !== "markdown") return refuseProjection("header:unknown-kind");

    const routePath = request["routePath"];
    if (typeof routePath !== "string" || !isPageRoutePath(routePath)) {
      return refuseProjection("header:route-invalid");
    }

    const text = request["text"];
    if (typeof text !== "string") return refuseProjection("header:text-not-a-string");
    if (text.trim().length === 0) return refuseProjection("header:text-empty");
    if (utf8ByteLength(text) > UNO_PAGE_HEADER_LIMITS.sourceBytes) {
      return refuseProjection("header:text-too-large");
    }
    const textIssue = sourceTextIssue(text);
    if (textIssue !== null) return refuseProjection(textIssue);
    if (/<[a-zA-Z/!]/.test(text)) return refuseProjection("header:text-raw-html");

    return kind === "markdown" ? projectMarkdown(text, routePath) : projectJson(text, routePath);
  } catch {
    return refuseProjection("header:input-not-plain");
  }
}
