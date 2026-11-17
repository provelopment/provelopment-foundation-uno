/**
 * Foundation Uno — the versioned JSON Page document (`UNO-WO-035 / R01`, U04).
 *
 * WHAT THIS IS. One pure, framework-free validator for the version-1 JSON Page document: a closed envelope
 * `{ version: 1, title, description?, visibility?, sections }` whose sections are typed module nodes drawn
 * from the immutable 22-ID capability registry. It answers exactly one question — "is this authored JSON a
 * well-formed Uno Page document?" — and returns either a deeply frozen, deterministic, serializable document
 * or **one** closed refusal literal.
 *
 * WHAT IT IS NOT. It is not a publisher, a router, a locale or Site selector, a canonical-base source, a host,
 * an analytics switch or a provider configuration. The document carries no `entity`, `facet`, `site`, `page`,
 * `locale`, `route`, `canonical`, `host`, `basePath`, `publication`, `robots`, `provider` or `secret` field,
 * and it cannot override any of them: anything outside the closed envelope is refused rather than ignored.
 * Publication remains the manifest Page's `publication: "published"` declaration; visibility is the selected
 * source's own `public`/`unlisted` intent; presentation is `deployment/site.config.json`.
 *
 * RENDERABILITY. This run implements exactly five module renderers. A `module` literal that is not one of the
 * immutable 22 IDs is `document:unknown-module`; one that *is* registered but has no renderer yet in this slice
 * is `document:renderer-unavailable`. Both refuse the entire Page, so no partially supported document can ever
 * reach a renderer or a discovery plan.
 *
 * TRUST BOUNDARY. `input` is untrusted `unknown` (plain own data, or raw JSON text). It is classified before any
 * field is read, so a getter, a symbol key, an exotic prototype, a sparse array, a cyclic graph or a throwing
 * Proxy trap can neither run authored code nor escape as an exception. JSON text is parsed by a strict
 * recursive-descent reader below, because `JSON.parse` silently keeps the **last** of two duplicate keys — the
 * one class of hostile input this contract must still see. No refusal ever interpolates a caller value, a path,
 * a body, a title or a stack.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW / COMPOSE**. The pinned read-only Foundation
 * GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`
 * (`src/core/page-document.ts`, blob `a12d964c43626c6313a621bf628f5cc24b65d444`) was read for *semantics and
 * bounds only*; no code, schema text, fixture or asset is copied, and the family composition layer it implies
 * remains a later U04 obligation.
 */
import { isCapabilityId } from "./modules/capability-registry";

/** The only document version this build accepts. An unknown version refuses; it is never upgraded. */
export const UNO_PAGE_DOCUMENT_VERSION = 1;

/**
 * The exact module IDs that have a real renderer in this execution.
 *
 * Every member is an existing ID from the immutable registry; this tuple is a *local availability
 * discriminator* for one bounded slice, not a second registry. The registry itself stays byte-identical.
 */
export const UNO_RENDERABLE_MODULES = Object.freeze([
  "layout.stack",
  "layout.grid",
  "content.heading",
  "content.prose",
  "content.actions",
] as const);

/** One renderable module ID of this slice. */
export type UnoRenderableModule = (typeof UNO_RENDERABLE_MODULES)[number];

/**
 * The documented caps of this contract. Every one is a limit that **refuses**, never a truncation.
 *
 * `titleCodePoints` and `descriptionCodePoints` restate the bounds the accepted Page-header projector already
 * enforces, so a JSON Page can never pass one projection and fail the other.
 */
export const UNO_PAGE_DOCUMENT_LIMITS = Object.freeze({
  sourceBytes: 64 * 1024,
  sections: 32,
  nodes: 128,
  depth: 4,
  layoutChildren: 8,
  textCodePoints: 4000,
  titleCodePoints: 160,
  descriptionCodePoints: 320,
  actionItems: 8,
  labelCodePoints: 160,
  sectionIdLength: 48,
  jsonDepth: 16,
  jsonNodes: 2048,
});

/** The two declared visibility intents a selected JSON source may carry. Default is `public`. */
export type UnoPageVisibility = "public" | "unlisted";

/** The three closed stack gaps. */
export type UnoStackGap = "tight" | "normal" | "wide";

/** The two closed grid item semantics; `article` is a semantic wrapper, never a hidden module. */
export type UnoGridItemSemantics = "plain" | "article";

/** `layout.stack` props: one closed optional gap and typed children. */
export interface UnoLayoutStackProps {
  readonly gap?: UnoStackGap;
}

/** `layout.grid` props: a required column count and an optional item semantic variant. */
export interface UnoLayoutGridProps {
  readonly columns: 1 | 2 | 3 | 4;
  readonly itemSemantics?: UnoGridItemSemantics;
}

/** `content.heading` props: text plus an explicit level that can never be the Page `h1`. */
export interface UnoContentHeadingProps {
  readonly text: string;
  readonly level: 2 | 3 | 4 | 5 | 6;
}

/** `content.prose` props: bounded inert plain text, rendered as React text and never interpreted. */
export interface UnoContentProseProps {
  readonly text: string;
}

/** One same-document action: a label and the exact `#<section-id>` destination it names. */
export interface UnoActionItem {
  readonly label: string;
  readonly targetId: string;
}

/** `content.actions` props: one bounded list of same-document anchors. */
export interface UnoContentActionsProps {
  readonly items: readonly UnoActionItem[];
}

/** One validated module node. Layouts own typed children; the three content modules own none. */
export type UnoSectionNode =
  | {
      readonly id: string;
      readonly module: "layout.stack";
      readonly props: UnoLayoutStackProps;
      readonly children: readonly UnoSectionNode[];
    }
  | {
      readonly id: string;
      readonly module: "layout.grid";
      readonly props: UnoLayoutGridProps;
      readonly children: readonly UnoSectionNode[];
    }
  | { readonly id: string; readonly module: "content.heading"; readonly props: UnoContentHeadingProps }
  | { readonly id: string; readonly module: "content.prose"; readonly props: UnoContentProseProps }
  | { readonly id: string; readonly module: "content.actions"; readonly props: UnoContentActionsProps };

/** The accepted, deeply frozen version-1 Page document. */
export interface UnoPageDocument {
  readonly version: 1;
  readonly title: string;
  readonly description?: string;
  readonly visibility: UnoPageVisibility;
  readonly sections: readonly UnoSectionNode[];
}

/**
 * The closed refusal vocabulary of this contract.
 *
 * Every literal is a fixed string this module owns, so a refusal can never echo a caller value.
 */
export type UnoPageDocumentRefusal =
  | "document:input-not-plain"
  | "document:text-not-a-string"
  | "document:text-too-large"
  | "document:json-parse"
  | "document:json-duplicate-key"
  | "document:json-unsafe"
  | "document:not-an-object"
  | "document:unexpected-key"
  | "document:unsupported-version"
  | "document:invalid-title"
  | "document:invalid-description"
  | "document:invalid-visibility"
  | "document:invalid-sections"
  | "document:unknown-module"
  | "document:renderer-unavailable"
  | "document:invalid-section"
  | "document:invalid-section-id"
  | "document:duplicate-section-id"
  | "document:invalid-props"
  | "document:invalid-children"
  | "document:too-deep"
  | "document:too-many-nodes"
  | "document:too-many-sections"
  | "document:heading-order"
  | "document:unsafe-text"
  | "document:unsafe-link"
  | "document:unresolved-target"
  | "document:home-cannot-be-unlisted"
  | "document:cyclic"
  | "document:unreadable";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_PAGE_DOCUMENT_REFUSAL_REASONS: readonly UnoPageDocumentRefusal[] = Object.freeze([
  "document:input-not-plain",
  "document:text-not-a-string",
  "document:text-too-large",
  "document:json-parse",
  "document:json-duplicate-key",
  "document:json-unsafe",
  "document:not-an-object",
  "document:unexpected-key",
  "document:unsupported-version",
  "document:invalid-title",
  "document:invalid-description",
  "document:invalid-visibility",
  "document:invalid-sections",
  "document:unknown-module",
  "document:renderer-unavailable",
  "document:invalid-section",
  "document:invalid-section-id",
  "document:duplicate-section-id",
  "document:invalid-props",
  "document:invalid-children",
  "document:too-deep",
  "document:too-many-nodes",
  "document:too-many-sections",
  "document:heading-order",
  "document:unsafe-text",
  "document:unsafe-link",
  "document:unresolved-target",
  "document:home-cannot-be-unlisted",
  "document:cyclic",
  "document:unreadable",
] as const);

/** The accepted document, or one closed refusal. */
export type UnoPageDocumentResult =
  | { readonly accepted: true; readonly document: UnoPageDocument }
  | { readonly accepted: false; readonly reason: UnoPageDocumentRefusal };

/** The one own-data option this contract reads. Anything else refuses. */
export interface UnoPageDocumentOptions {
  /** True only for the reserved Home Page, whose visibility can never be `unlisted`. */
  readonly reservedHome?: boolean;
}

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileStructure extends Error {}

/** Internal marker for a refused traversal; carries only a closed literal. */
class RefusedDocument extends Error {
  readonly reason: UnoPageDocumentRefusal;
  constructor(reason: UnoPageDocumentRefusal) {
    super(reason);
    this.reason = reason;
  }
}

/** The exact top-level key set of the v1 envelope; the two optional keys are listed too. */
const DOCUMENT_REQUIRED_KEYS: readonly string[] = Object.freeze(["version", "title", "sections"]);

/** The two optional top-level keys of the v1 envelope. */
const DOCUMENT_OPTIONAL_KEYS: readonly string[] = Object.freeze(["description", "visibility"]);

/** The two layout modules own typed children; every other module owns none. */
const LAYOUT_MODULES: readonly string[] = Object.freeze(["layout.stack", "layout.grid"]);

/** The three prototype-pollution keys a JSON object may never carry. */
const FORBIDDEN_KEYS: readonly string[] = Object.freeze(["__proto__", "constructor", "prototype"]);

/** A lowercase, hyphenated section identifier. */
const SECTION_ID = /^[a-z][a-z0-9-]{0,47}$/u;

/** One bounded refusal, used for every early exit. */
function refuseDocument(reason: UnoPageDocumentRefusal): UnoPageDocumentResult {
  return Object.freeze({ accepted: false, reason });
}

/** Count Unicode code points without allocating an array. */
function codePointLength(value: string): number {
  let count = 0;
  for (const _character of value) count += 1;
  return count;
}

/** The UTF-8 byte length of one string, so the source cap is a byte cap rather than a character guess. */
function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (point <= 0x7f) bytes += 1;
    else if (point <= 0x7ff) bytes += 2;
    else if (point <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object (including `null` and an array) answers `null`; a non-plain prototype, any symbol key or any
 * accessor throws `HostileStructure`, so no getter is invoked while the input is being classified.
 */
function readPlainData(value: unknown): DataRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new HostileStructure();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileStructure();
  const copy = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.includes(key)) throw new RefusedDocument("document:json-unsafe");
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileStructure();
    copy[key] = descriptor.value;
  }
  return copy;
}

/** Exactly the declared keys, no more and no fewer. */
function hasExactlyKeys(record: DataRecord, required: readonly string[], optional: readonly string[]): boolean {
  const own = Object.keys(record);
  for (const key of own) {
    if (!required.includes(key) && !optional.includes(key)) return false;
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
  }
  return true;
}

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted document. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/** The closed reasons a bounded authored text may be refused, per field family. */
type TextRefusal = "document:invalid-title" | "document:invalid-description" | "document:invalid-props" | "document:unsafe-text";

/** One bounded authored text, or the field-family refusal. Empty is refused only where required. */
function readBoundedText(
  value: unknown,
  maxCodePoints: number,
  refusal: TextRefusal,
  allowEmpty: boolean,
  allowNewlines: boolean,
): string {
  if (typeof value !== "string") throw new RefusedDocument(refusal);
  if (!allowEmpty && value.trim().length === 0) throw new RefusedDocument(refusal);
  if (codePointLength(value) > maxCodePoints) throw new RefusedDocument(refusal);
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (point === 0) throw new RefusedDocument("document:unsafe-text");
    if (point < 0x20 && point !== 0x09 && !(allowNewlines && (point === 0x0a || point === 0x0d))) {
      throw new RefusedDocument("document:unsafe-text");
    }
    if (point === 0x7f) throw new RefusedDocument("document:unsafe-text");
  }
  if (/<[a-zA-Z/!]/u.test(value)) throw new RefusedDocument("document:unsafe-text");
  if (/(?:javascript|vbscript|data)\s*:/iu.test(value)) throw new RefusedDocument("document:unsafe-text");
  return value;
}

/**
 * A strict JSON reader.
 *
 * `JSON.parse` is deliberately not used for authored text: it keeps the **last** duplicate key without telling
 * anyone, so `{"title":"A","title":"B"}` would silently become one document. This reader refuses duplicates,
 * refuses the three prototype-pollution keys, refuses unescaped control characters, caps depth and node count,
 * and never evaluates anything. Numbers are read with the exact JSON grammar and converted once.
 */
class StrictJsonReader {
  private readonly text: string;
  private index = 0;
  private nodes = 0;

  constructor(text: string) {
    this.text = text;
  }

  /** The whole text as one value, or a closed refusal. */
  read(): unknown {
    this.skipWhitespace();
    const value = this.readValue(0);
    this.skipWhitespace();
    if (this.index !== this.text.length) throw new RefusedDocument("document:json-parse");
    return value;
  }

  private skipWhitespace(): void {
    while (this.index < this.text.length) {
      const code = this.text.charCodeAt(this.index);
      if (code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) this.index += 1;
      else return;
    }
  }

  private readValue(depth: number): unknown {
    if (depth > UNO_PAGE_DOCUMENT_LIMITS.jsonDepth) throw new RefusedDocument("document:json-parse");
    this.nodes += 1;
    if (this.nodes > UNO_PAGE_DOCUMENT_LIMITS.jsonNodes) throw new RefusedDocument("document:json-parse");
    const character = this.text.charAt(this.index);
    if (character === "") throw new RefusedDocument("document:json-parse");
    if (character === "{") return this.readObject(depth + 1);
    if (character === "[") return this.readArray(depth + 1);
    if (character === '"') return this.readString();
    if (character === "t") return this.readLiteral("true", true);
    if (character === "f") return this.readLiteral("false", false);
    if (character === "n") return this.readLiteral("null", null);
    if (character === "-" || (character >= "0" && character <= "9")) return this.readNumber();
    throw new RefusedDocument("document:json-parse");
  }

  private readObject(depth: number): Record<string, unknown> {
    this.index += 1;
    const record = Object.create(null) as Record<string, unknown>;
    const seen = new Set<string>();
    this.skipWhitespace();
    if (this.text.charAt(this.index) === "}") {
      this.index += 1;
      return record;
    }
    for (;;) {
      this.skipWhitespace();
      if (this.text.charAt(this.index) !== '"') throw new RefusedDocument("document:json-parse");
      const key = this.readString();
      if (FORBIDDEN_KEYS.includes(key)) throw new RefusedDocument("document:json-unsafe");
      if (seen.has(key)) throw new RefusedDocument("document:json-duplicate-key");
      seen.add(key);
      this.skipWhitespace();
      if (this.text.charAt(this.index) !== ":") throw new RefusedDocument("document:json-parse");
      this.index += 1;
      this.skipWhitespace();
      record[key] = this.readValue(depth);
      this.skipWhitespace();
      const next = this.text.charAt(this.index);
      if (next === ",") {
        this.index += 1;
        continue;
      }
      if (next === "}") {
        this.index += 1;
        return record;
      }
      throw new RefusedDocument("document:json-parse");
    }
  }

  private readArray(depth: number): unknown[] {
    this.index += 1;
    const entries: unknown[] = [];
    this.skipWhitespace();
    if (this.text.charAt(this.index) === "]") {
      this.index += 1;
      return entries;
    }
    for (;;) {
      this.skipWhitespace();
      entries.push(this.readValue(depth));
      this.skipWhitespace();
      const next = this.text.charAt(this.index);
      if (next === ",") {
        this.index += 1;
        continue;
      }
      if (next === "]") {
        this.index += 1;
        return entries;
      }
      throw new RefusedDocument("document:json-parse");
    }
  }

  private readString(): string {
    this.index += 1;
    let value = "";
    for (;;) {
      if (this.index >= this.text.length) throw new RefusedDocument("document:json-parse");
      const character = this.text.charAt(this.index);
      const code = this.text.charCodeAt(this.index);
      if (character === '"') {
        this.index += 1;
        return value;
      }
      if (character === "\\") {
        this.index += 1;
        const escape = this.text.charAt(this.index);
        this.index += 1;
        if (escape === '"') value += '"';
        else if (escape === "\\") value += "\\";
        else if (escape === "/") value += "/";
        else if (escape === "b") value += "\b";
        else if (escape === "f") value += "\f";
        else if (escape === "n") value += "\n";
        else if (escape === "r") value += "\r";
        else if (escape === "t") value += "\t";
        else if (escape === "u") {
          const hex = this.text.slice(this.index, this.index + 4);
          if (!/^[0-9a-fA-F]{4}$/u.test(hex)) throw new RefusedDocument("document:json-parse");
          value += String.fromCharCode(Number.parseInt(hex, 16));
          this.index += 4;
        } else {
          throw new RefusedDocument("document:json-parse");
        }
        continue;
      }
      if (code < 0x20) throw new RefusedDocument("document:json-parse");
      value += character;
      this.index += 1;
    }
  }

  private readLiteral(token: string, value: boolean | null): boolean | null {
    if (this.text.slice(this.index, this.index + token.length) !== token) {
      throw new RefusedDocument("document:json-parse");
    }
    this.index += token.length;
    return value;
  }

  private readNumber(): number {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u.exec(this.text.slice(this.index));
    if (match === null || match[0].length === 0) throw new RefusedDocument("document:json-parse");
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new RefusedDocument("document:json-parse");
    return value;
  }
}

/** The one mutable traversal state of a single validation. */
interface WalkState {
  readonly ids: Set<string>;
  readonly targets: string[];
  nodes: number;
  lastHeadingLevel: number;
}

/** One bounded, non-sparse list of layout children. */
function readChildren(
  value: unknown,
  depth: number,
  state: WalkState,
  seen: WeakSet<object>,
): UnoSectionNode[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-children");
  if (value.length < 1 || value.length > UNO_PAGE_DOCUMENT_LIMITS.layoutChildren) {
    throw new RefusedDocument("document:invalid-children");
  }
  const children: UnoSectionNode[] = [];
  for (let index = 0; index < value.length; index += 1) {
    // Sparse arrays are refused rather than read as `undefined`.
    if (!(index in value)) throw new RefusedDocument("document:invalid-children");
    children.push(readNode(value[index], depth, state, seen));
  }
  return children;
}

/** One closed `content.actions` list: bounded, plain, and every target a valid identifier shape. */
function readActionItems(value: unknown, state: WalkState): UnoActionItem[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < 1 || value.length > UNO_PAGE_DOCUMENT_LIMITS.actionItems) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoActionItem[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(item, ["label", "targetId"], [])) throw new RefusedDocument("document:invalid-props");
    const label = readBoundedText(
      item["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const targetId = item["targetId"];
    if (typeof targetId !== "string" || !SECTION_ID.test(targetId)) {
      throw new RefusedDocument("document:unsafe-link");
    }
    items.push({ label, targetId });
    state.targets.push(targetId);
  }
  return items;
}

/** The three optional-value helpers that keep `exactOptionalPropertyTypes` honest. */
function optionalStackProps(gap: unknown): UnoLayoutStackProps {
  if (gap === undefined) return {};
  if (gap === "tight" || gap === "normal" || gap === "wide") return { gap };
  throw new RefusedDocument("document:invalid-props");
}

function optionalGridSemantics(itemSemantics: unknown): UnoGridItemSemantics | undefined {
  if (itemSemantics === undefined) return undefined;
  if (itemSemantics === "plain" || itemSemantics === "article") return itemSemantics;
  throw new RefusedDocument("document:invalid-props");
}

/**
 * Validate one section node, its closed props and — for the two layouts — its typed children.
 *
 * Order matters: the identifier is claimed first so a duplicate is reported as a duplicate rather than as
 * whatever else is wrong with the node, and the module literal is checked against the immutable registry
 * before `document:renderer-unavailable` can be claimed, so the two module refusals stay distinguishable.
 */
function readNode(value: unknown, depth: number, state: WalkState, seen: WeakSet<object>): UnoSectionNode {
  if (depth > UNO_PAGE_DOCUMENT_LIMITS.depth) throw new RefusedDocument("document:too-deep");
  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) throw new RefusedDocument("document:cyclic");
    seen.add(value);
  }

  const record = readPlainData(value);
  if (record === null) throw new RefusedDocument("document:invalid-section");

  state.nodes += 1;
  if (state.nodes > UNO_PAGE_DOCUMENT_LIMITS.nodes) throw new RefusedDocument("document:too-many-nodes");

  const id = record["id"];
  if (typeof id !== "string" || !SECTION_ID.test(id)) throw new RefusedDocument("document:invalid-section-id");
  if (state.ids.has(id)) throw new RefusedDocument("document:duplicate-section-id");
  state.ids.add(id);

  const moduleName = record["module"];
  if (typeof moduleName !== "string" || moduleName.length === 0) {
    throw new RefusedDocument("document:invalid-section");
  }
  if (!isCapabilityId(moduleName)) throw new RefusedDocument("document:unknown-module");
  if (!(UNO_RENDERABLE_MODULES as readonly string[]).includes(moduleName)) {
    throw new RefusedDocument("document:renderer-unavailable");
  }

  const isLayout = LAYOUT_MODULES.includes(moduleName);
  const requiredKeys = isLayout ? ["id", "module", "props", "children"] : ["id", "module", "props"];
  if (!hasExactlyKeys(record, requiredKeys, [])) {
    throw new RefusedDocument(isLayout ? "document:invalid-children" : "document:invalid-section");
  }

  const props = readPlainData(record["props"]);
  if (props === null) throw new RefusedDocument("document:invalid-props");

  if (moduleName === "layout.stack") {
    if (!hasExactlyKeys(props, [], ["gap"])) throw new RefusedDocument("document:invalid-props");
    const stackProps = optionalStackProps(props["gap"]);
    const children = readChildren(record["children"], depth + 1, state, seen);
    return { id, module: "layout.stack", props: stackProps, children };
  }

  if (moduleName === "layout.grid") {
    if (!hasExactlyKeys(props, ["columns"], ["itemSemantics"])) throw new RefusedDocument("document:invalid-props");
    const columns = props["columns"];
    if (columns !== 1 && columns !== 2 && columns !== 3 && columns !== 4) {
      throw new RefusedDocument("document:invalid-props");
    }
    const itemSemantics = optionalGridSemantics(props["itemSemantics"]);
    const gridProps: UnoLayoutGridProps =
      itemSemantics === undefined ? { columns } : { columns, itemSemantics };
    const children = readChildren(record["children"], depth + 1, state, seen);
    return { id, module: "layout.grid", props: gridProps, children };
  }

  if (moduleName === "content.heading") {
    if (!hasExactlyKeys(props, ["text", "level"], [])) throw new RefusedDocument("document:invalid-props");
    const text = readBoundedText(
      props["text"],
      UNO_PAGE_DOCUMENT_LIMITS.textCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const level = props["level"];
    if (level !== 2 && level !== 3 && level !== 4 && level !== 5 && level !== 6) {
      throw new RefusedDocument("document:invalid-props");
    }
    // The Page `h1` is the App Router's alone, so a document may never begin below it by more than one level.
    if (level > state.lastHeadingLevel + 1) throw new RefusedDocument("document:heading-order");
    state.lastHeadingLevel = level;
    return { id, module: "content.heading", props: { text, level } };
  }

  if (moduleName === "content.prose") {
    if (!hasExactlyKeys(props, ["text"], [])) throw new RefusedDocument("document:invalid-props");
    const text = readBoundedText(
      props["text"],
      UNO_PAGE_DOCUMENT_LIMITS.textCodePoints,
      "document:invalid-props",
      false,
      true,
    );
    return { id, module: "content.prose", props: { text } };
  }

  if (moduleName === "content.actions") {
    if (!hasExactlyKeys(props, ["items"], [])) throw new RefusedDocument("document:invalid-props");
    const items = readActionItems(props["items"], state);
    return { id, module: "content.actions", props: { items } };
  }

  // Unreachable: the renderable tuple and this switch are kept in step by the `document:renderer-unavailable`
  // check above. Refusing here keeps a future registry addition from silently rendering nothing.
  throw new RefusedDocument("document:renderer-unavailable");
}

/** The trusted option record: absent, or one boolean `reservedHome`. Anything else refuses. */
function readOptions(value: unknown): { readonly reservedHome: boolean } {
  const record = readPlainData(value);
  if (record === null) throw new RefusedDocument("document:input-not-plain");
  if (!hasExactlyKeys(record, [], ["reservedHome"])) throw new RefusedDocument("document:input-not-plain");
  const reservedHome = record["reservedHome"];
  if (reservedHome === undefined) return { reservedHome: false };
  if (typeof reservedHome !== "boolean") throw new RefusedDocument("document:input-not-plain");
  return { reservedHome };
}

/**
 * Validate one version-1 JSON Page document from plain own data **or** raw JSON text.
 *
 * The envelope is closed: `version`, `title` and `sections` are required; `description` and `visibility` are
 * optional; nothing else may appear. The result is deeply frozen and safe to hand to a server component or to
 * serialize across the server/client boundary — it holds no function, class instance, accessor or opaque object.
 *
 * `reservedHome` is the caller's *already accepted* knowledge that this document belongs to the reserved Home
 * Page; it never comes from the document itself, so an authored `visibility` cannot borrow or escape the Home
 * rule. This function publishes nothing: it does not know a Site, a locale, a route or a URL.
 */
export function readUnoPageDocument(
  input: unknown,
  options: UnoPageDocumentOptions = {},
): UnoPageDocumentResult {
  try {
    const settings = readOptions(options);

    let parsed: unknown;
    if (typeof input === "string") {
      if (utf8ByteLength(input) > UNO_PAGE_DOCUMENT_LIMITS.sourceBytes) {
        return refuseDocument("document:text-too-large");
      }
      parsed = new StrictJsonReader(input).read();
    } else {
      if (input === null || typeof input !== "object") return refuseDocument("document:not-an-object");
      parsed = input;
    }

    const record = readPlainData(parsed);
    if (record === null) return refuseDocument("document:not-an-object");

    for (const key of Object.keys(record)) {
      if (!DOCUMENT_REQUIRED_KEYS.includes(key) && !DOCUMENT_OPTIONAL_KEYS.includes(key)) {
        return refuseDocument("document:unexpected-key");
      }
    }
    if (!Object.prototype.hasOwnProperty.call(record, "version")) {
      return refuseDocument("document:unsupported-version");
    }
    if (record["version"] !== UNO_PAGE_DOCUMENT_VERSION) {
      return refuseDocument("document:unsupported-version");
    }
    if (!Object.prototype.hasOwnProperty.call(record, "title")) return refuseDocument("document:invalid-title");
    if (!Object.prototype.hasOwnProperty.call(record, "sections")) {
      return refuseDocument("document:invalid-sections");
    }

    const title = readBoundedText(
      record["title"],
      UNO_PAGE_DOCUMENT_LIMITS.titleCodePoints,
      "document:invalid-title",
      false,
      false,
    );

    let description: string | undefined;
    if (Object.prototype.hasOwnProperty.call(record, "description")) {
      description = readBoundedText(
        record["description"],
        UNO_PAGE_DOCUMENT_LIMITS.descriptionCodePoints,
        "document:invalid-description",
        true,
        true,
      );
    }

    let visibility: UnoPageVisibility = "public";
    if (Object.prototype.hasOwnProperty.call(record, "visibility")) {
      const declared = record["visibility"];
      if (declared !== "public" && declared !== "unlisted") {
        return refuseDocument("document:invalid-visibility");
      }
      visibility = declared;
    }
    if (visibility === "unlisted" && settings.reservedHome) {
      return refuseDocument("document:home-cannot-be-unlisted");
    }

    const rawSections = record["sections"];
    if (!Array.isArray(rawSections) || rawSections.length < 1) {
      return refuseDocument("document:invalid-sections");
    }
    if (rawSections.length > UNO_PAGE_DOCUMENT_LIMITS.sections) {
      return refuseDocument("document:too-many-sections");
    }

    const state: WalkState = {
      ids: new Set<string>(),
      targets: [],
      nodes: 0,
      lastHeadingLevel: 1,
    };
    const seen = new WeakSet<object>();
    const sections: UnoSectionNode[] = [];
    for (let index = 0; index < rawSections.length; index += 1) {
      if (!(index in rawSections)) return refuseDocument("document:invalid-sections");
      sections.push(readNode(rawSections[index], 1, state, seen));
    }

    // A same-document action must name a section that actually exists in *this* document.
    for (const target of state.targets) {
      if (!state.ids.has(target)) return refuseDocument("document:unresolved-target");
    }

    const document: UnoPageDocument =
      description === undefined
        ? { version: UNO_PAGE_DOCUMENT_VERSION, title, visibility, sections }
        : { version: UNO_PAGE_DOCUMENT_VERSION, title, description, visibility, sections };

    return Object.freeze({ accepted: true as const, document: deepFreeze(document) });
  } catch (error) {
    if (error instanceof RefusedDocument) return refuseDocument(error.reason);
    if (error instanceof HostileStructure) return refuseDocument("document:input-not-plain");
    return refuseDocument("document:unreadable");
  }
}







