/**
 * Foundation Uno — the bounded Foundation→Uno family composition adapter (`UNO-WO-057 / R01`, U04).
 *
 * WHAT THIS IS. One pure, inward application function that translates a deliberately small **plain-text subset** of
 * five Foundation section families into the already accepted Uno v1 JSON Page document. It closes the gap between a
 * donor source shape and Uno's own validated document: the caller supplies untrusted donor data, this module either
 * returns one accepted, deep-frozen `UnoPageDocument` or one closed refusal, and it never returns a partial Page.
 *
 * WHY IT EXISTS. Uno's Page document is the single publication authority, and the Foundation families are the
 * vocabulary the migration must express. Composing that vocabulary by hand in a route or a component would spread
 * trust decisions across the product, so the translation lives here as one framework-free use case whose whole input
 * surface is enumerable, bounded and refusable.
 *
 * WHAT IT IS NOT. It does not read a file, a manifest, a host, an environment variable or a provider; it publishes
 * nothing, routes nothing, renders nothing and owns no locale, Site, visibility or delivery authority. It implements
 * **five** subset mappings only. It is not a Markdown parser, a link or media converter, and it is not the seventeen
 * family parity work: no full `FAMILY_PARITY` result may be derived from it.
 *
 * PROVENANCE. Original **Uno-owned** implementation, adaptation class **NEW / COMPOSE (plain-text subset)**. Concepts
 * — never copied source, CSS, components or assets — are adapted from `provelopment/provelopment-foundation` at
 * commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` (Apache-2.0, `LICENSE` blob
 * `d645695673349e3947e8e5ae42332d0ac3164cd7`): the donor source-family schema
 * (`src/core/page-document.ts`, blob `a12d964c43626c6313a621bf628f5cc24b65d444`), the native
 * table/caption structure (`structure-sections.tsx`, blob `65d254e192a6a8ef4886590026c2ea58e02264be`), the
 * prose/callout/divider semantics (`text-sections.tsx`, blob `caeee57798bdd533867e5bef350422618187612f`) and the
 * list semantics (`items-sections.tsx`, blob `bc729d6a2e6484dc2c26ed997e65ee644bc8a7e6`). No donor runtime code,
 * package, image or trademark is imported. See `.documents/Architecture/u04-family-parity.md`.
 */
import { readUnoPageDocument, type UnoPageDocument } from "../core/page-document";

/** The five donor source families this bounded adapter accepts, in the order the ledger documents them. */
export const UNO_FOUNDATION_SUBSET_FAMILIES = Object.freeze([
  "prose",
  "callout",
  "table",
  "list",
  "divider",
] as const);

/** One accepted donor family name. */
export type UnoFoundationSubsetFamily = (typeof UNO_FOUNDATION_SUBSET_FAMILIES)[number];

/**
 * The closed refusal vocabulary.
 *
 * `unsafe-source` — the input is not plain readable data (hostile object, accessor, cycle, sparse array, oversize).
 * `unsupported-family` — a real donor family outside these five, never silently dropped.
 * `unsupported-feature` — a supported family carrying an out-of-subset field or Markdown this subset cannot render.
 * `target-refused` — the composed candidate is not an acceptable Uno Page; no partial document is ever returned.
 */
export type UnoFoundationSubsetRefusal =
  | "family:unsafe-source"
  | "family:unsupported-family"
  | "family:unsupported-feature"
  | "family:target-refused";

/** The one result shape: a fully validated document, or one closed reason and nothing else. */
export type UnoFoundationSubsetOutcome =
  | { readonly status: "composed"; readonly document: UnoPageDocument }
  | { readonly status: "refused"; readonly reason: UnoFoundationSubsetRefusal };

/**
 * The bounds applied to the untrusted source *before* any candidate is built.
 *
 * These are the adapter's own resource guards, deliberately tighter than the Uno Page limits they feed: the subset is
 * small, so a source that needs more than this is either outside the subset or hostile. `targetSourceBytes` mirrors
 * the Uno Page source cap so an object candidate cannot smuggle in a document the JSON path would have refused.
 */
const SUBSET_LIMITS = Object.freeze({
  depth: 8,
  nodes: 512,
  sections: 32,
  stringCodePoints: 4096,
  keyCodePoints: 64,
  arrayLength: 64,
  targetSourceBytes: 64 * 1024,
});

/** The three donor keys that could rewrite an object's prototype rather than describe data. */
const FORBIDDEN_SOURCE_KEYS: readonly string[] = Object.freeze(["__proto__", "constructor", "prototype"]);

/** One closed refusal thrown while composing; never escapes this module. */
class SourceRefusal extends Error {
  readonly reason: UnoFoundationSubsetRefusal;

  constructor(reason: UnoFoundationSubsetRefusal) {
    super(reason);
    this.reason = reason;
  }
}

/** A snapshotted plain object: own enumerable data properties only, no prototype chain. */
interface PlainRecord {
  readonly [key: string]: PlainValue;
}

/** One snapshotted plain value: text, a flag, a finite number (the envelope version) or nested plain data. */
type PlainValue = number | string | boolean | null | readonly PlainValue[] | PlainRecord;

/** The code-point length of one string, matching the Uno text bounds rather than UTF-16 units. */
function codePointLength(value: string): number {
  return Array.from(value).length;
}

/** The UTF-8 byte length of one string, so the target cap stays a byte cap exactly as the Uno reader defines it. */
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

/** Refuse the whole source as unreadable plain data. */
function refuseUnsafeSource(): never {
  throw new SourceRefusal("family:unsafe-source");
}

/** Refuse one supported family because it carries a field or construct this subset does not render. */
function refuseUnsupportedFeature(): never {
  throw new SourceRefusal("family:unsupported-feature");
}

/** The running node budget of one snapshot pass. */
interface SnapshotBudget {
  nodes: number;
}

/**
 * Snapshot one untrusted value into new plain data, or refuse.
 *
 * The snapshot never invokes an authored accessor: every index and key is read through its own property descriptor,
 * so a hostile getter cannot run while the source is being classified. A foreign prototype, a symbol key, a
 * prototype-rewriting key, a cycle, a sparse or overloaded array, a function, `undefined`, a number or a string above
 * the copy bound all refuse the whole input. Nothing is mutated and nothing from the source is retained by reference.
 */
function snapshotPlainSource(
  value: unknown,
  depth: number,
  budget: SnapshotBudget,
  seen: WeakSet<object>,
): PlainValue {
  if (depth > SUBSET_LIMITS.depth) refuseUnsafeSource();
  budget.nodes += 1;
  if (budget.nodes > SUBSET_LIMITS.nodes) refuseUnsafeSource();

  if (value === null) return null;

  const kind = typeof value;
  if (kind === "string") {
    const text = value as string;
    if (codePointLength(text) > SUBSET_LIMITS.stringCodePoints) refuseUnsafeSource();
    return text;
  }
  if (kind === "boolean") return value as boolean;
  if (kind === "number") {
    const numeric = value as number;
    // A non-finite number (or -0 semantics) is refused rather than coerced; the subset has no numeric field but the
    // envelope's `version` must still be read as a real JSON number.
    if (!Number.isFinite(numeric)) refuseUnsafeSource();
    return numeric;
  }
  // Functions, symbols, bigints and `undefined` are not part of the subset and are never coerced.
  if (kind !== "object") refuseUnsafeSource();

  const source = value as object;
  if (seen.has(source)) refuseUnsafeSource();
  seen.add(source);

  if (Object.getOwnPropertySymbols(source).length > 0) refuseUnsafeSource();
  const prototype = Object.getPrototypeOf(source);

  if (Array.isArray(source)) {
    if (prototype !== Array.prototype && prototype !== null) refuseUnsafeSource();
    const length = (source as readonly unknown[]).length;
    if (length > SUBSET_LIMITS.arrayLength) refuseUnsafeSource();
    // A dense array owns exactly its indices plus `length`; anything else is an overloaded or sparse array.
    if (Object.getOwnPropertyNames(source).length !== length + 1) refuseUnsafeSource();
    const items: PlainValue[] = [];
    for (let index = 0; index < length; index += 1) {
      const slot = Object.getOwnPropertyDescriptor(source, String(index));
      if (slot === undefined || !("value" in slot)) refuseUnsafeSource();
      items.push(snapshotPlainSource(slot.value, depth + 1, budget, seen));
    }
    return items;
  }

  if (prototype !== Object.prototype && prototype !== null) refuseUnsafeSource();
  const record = Object.create(null) as Record<string, PlainValue>;
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_SOURCE_KEYS.includes(key)) refuseUnsafeSource();
    if (codePointLength(key) > SUBSET_LIMITS.keyCodePoints) refuseUnsafeSource();
    const slot = Object.getOwnPropertyDescriptor(source, key);
    if (slot === undefined || !("value" in slot)) refuseUnsafeSource();
    record[key] = snapshotPlainSource(slot.value, depth + 1, budget, seen);
  }
  return record as PlainRecord;
}

/** True when the record owns exactly this key as a data property. */
function ownsKey(record: PlainRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/**
 * Exactly the declared keys, no more and no fewer.
 *
 * An extra key is never silently dropped: `heading`, `lede`, `align`, `surface`, `links`, `visibility`, `href`,
 * `html`, `style` or any other out-of-subset field makes the donor section something this adapter cannot represent,
 * so the whole source is refused as an unsupported feature.
 */
function requireExactKeys(record: PlainRecord, required: readonly string[], optional: readonly string[]): void {
  for (const key of Object.keys(record)) {
    if (!required.includes(key) && !optional.includes(key)) refuseUnsupportedFeature();
  }
  for (const key of required) {
    if (!ownsKey(record, key)) refuseUnsupportedFeature();
  }
}

/**
 * The Markdown constructs this plain-text subset deliberately does not render.
 *
 * Emitting `**bold**` or `[label](destination)` as inert prose would look faithful while silently discarding its
 * meaning and its destination, so the source is refused instead. This is a small refusal list, not a Markdown parser.
 */
const MARKDOWN_MARKERS: readonly RegExp[] = Object.freeze([
  /\*\*/u,
  /`/u,
  /\[[^\]\n]*\]\([^)\n]*\)/u,
  /(?:^|\n)[ \t]{0,3}#{1,6}[ \t]/u,
]);

/** Refuse one Markdown-capable donor text this subset would otherwise render as apparently faithful prose. */
function refuseMarkdown(text: string): void {
  for (const marker of MARKDOWN_MARKERS) {
    if (marker.test(text)) refuseUnsupportedFeature();
  }
}

/** Refuse any Markdown-capable entry inside one donor text array (table columns, one table row). */
function refuseMarkdownArray(values: readonly PlainValue[]): void {
  for (const value of values) {
    if (typeof value === "string") refuseMarkdown(value);
  }
}

/** One composed Uno section node, still to be validated by the Uno reader. */
interface CandidateSection {
  readonly id: string;
  readonly module: "content.prose";
  readonly props: Record<string, unknown>;
}

/** Read one donor string field, refusing a non-string rather than coercing it. */
function readDonorText(value: PlainValue | undefined, markdownCapable: boolean): string {
  if (typeof value !== "string") refuseUnsupportedFeature();
  if (markdownCapable) refuseMarkdown(value);
  return value;
}

/**
 * Map one donor section to exactly one Uno `content.prose` node.
 *
 * The donor family is decided by the closed `type` literal. An unsupported family refuses the whole source and is
 * never degraded to a paragraph; a supported family carrying any extra field refuses as a feature. Section ids are
 * `family-<index>-<type>`, which stays inside Uno's own closed section-id grammar.
 */
function composeSection(section: PlainValue, index: number): CandidateSection {
  if (section === null || typeof section !== "object" || Array.isArray(section)) refuseUnsafeSource();
  const record = section as PlainRecord;

  const type = record["type"];
  if (typeof type !== "string") refuseUnsupportedFeature();
  if (!(UNO_FOUNDATION_SUBSET_FAMILIES as readonly string[]).includes(type)) {
    throw new SourceRefusal("family:unsupported-family");
  }

  const id = `family-${index}-${type}`;

  switch (type) {
    case "prose": {
      requireExactKeys(record, ["type", "body"], []);
      const body = readDonorText(record["body"], true);
      return { id, module: "content.prose", props: { text: body } };
    }
    case "callout": {
      requireExactKeys(record, ["type", "body"], ["tone"]);
      const body = readDonorText(record["body"], true);
      const props: Record<string, unknown> = { variant: "callout", text: body };
      // An absent tone stays absent: the display default belongs to the renderer, not to a manufactured field.
      if (ownsKey(record, "tone")) props["tone"] = record["tone"];
      return { id, module: "content.prose", props };
    }
    case "table": {
      requireExactKeys(record, ["type", "columns", "rows"], ["caption"]);
      const columns = record["columns"];
      const rows = record["rows"];
      if (!Array.isArray(columns) || !Array.isArray(rows)) refuseUnsupportedFeature();
      refuseMarkdownArray(columns);
      for (const row of rows) {
        if (!Array.isArray(row)) refuseUnsupportedFeature();
        refuseMarkdownArray(row);
      }
      const props: Record<string, unknown> = { variant: "table", columns, rows };
      if (ownsKey(record, "caption")) {
        const caption = record["caption"];
        if (typeof caption === "string") refuseMarkdown(caption);
        props["caption"] = caption;
      }
      return { id, module: "content.prose", props };
    }
    case "list": {
      requireExactKeys(record, ["type", "items"], ["ordered"]);
      const items = record["items"];
      if (!Array.isArray(items)) refuseUnsupportedFeature();
      const normalized: Record<string, unknown>[] = [];
      for (const item of items) {
        if (typeof item === "string") {
          refuseMarkdown(item);
          normalized.push({ label: item });
          continue;
        }
        if (item === null || typeof item !== "object" || Array.isArray(item)) refuseUnsupportedFeature();
        const entry = item as PlainRecord;
        // Each object entry is EXACTLY `{label, detail?}`: a destination, link or any other key is a feature refusal.
        requireExactKeys(entry, ["label"], ["detail"]);
        const label = readDonorText(entry["label"], true);
        const output: Record<string, unknown> = { label };
        if (ownsKey(entry, "detail")) output["detail"] = readDonorText(entry["detail"], true);
        normalized.push(output);
      }
      const props: Record<string, unknown> = { variant: "list", items: normalized };
      if (ownsKey(record, "ordered")) props["ordered"] = record["ordered"];
      return { id, module: "content.prose", props };
    }
    case "divider": {
      requireExactKeys(record, ["type"], []);
      return { id, module: "content.prose", props: { variant: "divider" } };
    }
    default:
      throw new SourceRefusal("family:unsupported-family");
  }
}

/**
 * Compose one bounded Foundation source subset into one accepted Uno Page document.
 *
 * Returns `{status:"composed", document}` only when every donor section mapped inside the subset *and* the Uno reader
 * accepted the assembled document; the returned Page is the reader's own deep-frozen value. Anything else returns
 * `{status:"refused", reason}` with one closed literal and no document at all, so a caller can never publish a
 * partially translated Page or mistake a refusal for empty content.
 */
export function composeUnoFoundationSubset(input: unknown): UnoFoundationSubsetOutcome {
  try {
    const source = snapshotPlainSource(input, 1, { nodes: 0 }, new WeakSet<object>());
    if (source === null || typeof source !== "object" || Array.isArray(source)) refuseUnsafeSource();
    const envelope = source as PlainRecord;

    // The envelope is exactly `{version, title, sections}`: a donor envelope variant with any other key is refused.
    requireExactKeys(envelope, ["version", "title", "sections"], []);
    if (envelope["version"] !== 1) refuseUnsupportedFeature();

    const title = envelope["title"];
    if (typeof title !== "string") refuseUnsupportedFeature();

    const sections = envelope["sections"];
    if (!Array.isArray(sections)) refuseUnsupportedFeature();
    if (sections.length < 1 || sections.length > SUBSET_LIMITS.sections) refuseUnsupportedFeature();

    const nodes: CandidateSection[] = [];
    for (let index = 0; index < sections.length; index += 1) {
      const section = sections[index];
      if (section === undefined) refuseUnsafeSource();
      nodes.push(composeSection(section, index));
    }

    // Exactly the Uno envelope: the same title, `version: 1` and one node per source section. No description,
    // visibility, route, locale, Site or publication field is invented, and the 22 module IDs are untouched.
    const candidate = { version: 1, title, sections: nodes };

    // The Uno reader applies its 64 KiB source cap to JSON *text* only, so an object candidate is measured here with
    // the same UTF-8 byte rule; the candidate is this module's own plain data, so serializing it runs no source code.
    if (utf8ByteLength(JSON.stringify(candidate)) > SUBSET_LIMITS.targetSourceBytes) {
      throw new SourceRefusal("family:target-refused");
    }

    const parsed = readUnoPageDocument(candidate, { reservedHome: false });
    if (!parsed.accepted) throw new SourceRefusal("family:target-refused");

    return { status: "composed", document: parsed.document };
  } catch (error) {
    if (error instanceof SourceRefusal) return { status: "refused", reason: error.reason };
    // A proxy trap, or any other unexpected host failure, is an unreadable source — never a partial document.
    return { status: "refused", reason: "family:unsafe-source" };
  }
}




