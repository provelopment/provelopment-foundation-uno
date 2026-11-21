/**
 * Foundation Uno — the bounded Foundation→Uno family composition adapter (`UNO-WO-057 / R01`, extended by
 * `UNO-WO-058 / R01`, `UNO-WO-059 / R01`, `UNO-WO-060 / R01`, `UNO-WO-061 / R01`, `UNO-WO-062 / R01`,
 * `UNO-WO-063 / R01`, `UNO-WO-064 / R01` and `UNO-WO-065 / R02`, U04).
 *
 * WHAT THIS IS. One pure, inward application function that translates a deliberately small **plain-text and inert-notice
 * subset** of seventeen Foundation section families into the already accepted Uno v1 JSON Page document. It closes the
 * gap between a donor source shape and Uno's own validated document: the caller supplies untrusted donor data, this
 * module either returns one accepted, deep-frozen `UnoPageDocument` or one closed refusal, and it never returns a partial
 * Page.
 *
 * WHY IT EXISTS. Uno's Page document is the single publication authority, and the Foundation families are the
 * vocabulary the migration must express. Composing that vocabulary by hand in a route or a component would spread
 * trust decisions across the product, so the translation lives here as one framework-free use case whose whole input
 * surface is enumerable, bounded and refusable.
 *
 * WHAT IT IS NOT. It does not read a file, a manifest, a host, an environment variable or a provider; it publishes
 * nothing, routes nothing, renders nothing and owns no locale, Site, visibility or delivery authority. It implements
 * **seventeen** bounded subset mappings only, out of the donor's seventeen families. It is not a Markdown parser, a link or
 * media converter, and it is not the seventeen family parity work: no full `FAMILY_PARITY` result may be derived
 * from it. In particular `steps` reproduces the donor's ordered sequence and optional body as plain text, but Uno's
 * timeline title is a `<p>` where the donor step title was an `<h3>`, so the donor heading outline is deliberately
 * not reproduced and `steps` is not full parity. `faq` keeps the donor's native `<details>`/`<summary>` disclosure but
 * its summary is plain text where the donor question was an `<h3>`, and `columns` keeps each authored column title as
 * a navigable `content.heading` at **level 2** where the donor used `<h3>`; both outline differences are recorded, not
 * concealed. `cards` and `features` keep only the authored title and optional body of each entry: the donor card's
 * border, image, meta line and action, and the donor feature's decorative icon, are not composed, each item title is an
 * `<h2>` here rather than the donor `<h3>`, and the same minimal native list-grid structure can therefore express two
 * different donor concepts without being full parity for either. `actions` composes **only** an authored same-document
 * fragment that already names a top-level section this composer generated: the donor's `href`/`route`/`link` destination
 * alternatives, its action `variant`, and the section heading/lede/align/surface options are all outside this subset, so
 * no external, `mailto:`, `tel:`, site-route or provider destination can be composed, and `actions` is not full parity.
 * `media` composes **only** one descriptive image described by an authored alt plus an optional plain caption, and only
 * when the caller supplies an explicit donor-source-to-owned-asset binding: the donor `src` stays an opaque migration
 * identity, the composed asset is the separately authored owned ref, the donor decorative form, heading/lede/position/
 * surface options and any remote URL source are outside the subset, and a donor Markdown caption becomes plain text in
 * Uno's `figcaption`, so `media` is not full parity either. `gallery` composes **only** an authored grid of two to eight
 * descriptive images with an explicit authored `columns` of 2, 3 or 4 and the same kind of explicit owned-asset binding:
 * the donor's native `<ul>`/`<li>` grouping becomes Uno's `<div>` of `<figure>` children, the donor's optional heading,
 * lede, surface, decorative images and Markdown captions are outside the subset, and the donor's implicit column default
 * is never borrowed, so `gallery` is not full parity. `contactForm` composes **only** one inert `interaction.contact`
 * notice with empty props, and only when the caller separately acknowledges that exact donor `formRef` with
 * `mode:"delivery-off"`: the donor reference is an intent key, never a recipient, URL, webhook, provider or secret, it is
 * never copied into the Page, and no form field, submit control, handler, transport or storage exists. Its generated Uno
 * node id uses the legal lowercase target suffix (`family-<index>-contactform`) because the frozen Uno section-id grammar
 * admits no uppercase, while the donor `type` stays the canonical `contactForm`. Where the donor renders **nothing** when
 * it has no authorized form renderer, Uno renders a visible OFF notice, so this is a documented behavioural difference and
 * not contact parity.
 *
 * PROVENANCE. Original **Uno-owned** implementation, adaptation class **NEW / COMPOSE (plain-text subset)**. Concepts
 * — never copied source, CSS, components or assets — are adapted from `provelopment/provelopment-foundation` at
 * commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` (Apache-2.0, `LICENSE` blob
 * `d645695673349e3947e8e5ae42332d0ac3164cd7`): the donor source-family schema
 * (`src/core/page-document.ts`, blob `a12d964c43626c6313a621bf628f5cc24b65d444`), the native
 * table/caption structure (`structure-sections.tsx`, blob `65d254e192a6a8ef4886590026c2ea58e02264be`), the
 * prose/callout/divider semantics (`text-sections.tsx`, blob `caeee57798bdd533867e5bef350422618187612f`), the
 * list/statistics semantics (`items-sections.tsx`, blob `bc729d6a2e6484dc2c26ed997e65ee644bc8a7e6`) and the hero
 * presentation (`media-sections.tsx`, blob `e3f3a12e5e26cb6af9133bef79f5fa2dc0680bb2`). The ordered step sequence
 * reuses the `items-sections.tsx` ordering semantics and the quotation reuses the `text-sections.tsx`
 * figure/blockquote/figcaption semantics recorded above; the FAQ disclosure group and the two/three-column group reuse
 * the native `<details>`/`<summary>` and grouped-column semantics of `structure-sections.tsx`
 * (blob `65d254e192a6a8ef4886590026c2ea58e02264be`), and the card and feature groups reuse only the native `<li>`
 * item-group semantics of `media-sections.tsx` (blob `e3f3a12e5e26cb6af9133bef79f5fa2dc0680bb2`) and
 * `items-sections.tsx`
 * (blob `bc729d6a2e6484dc2c26ed997e65ee644bc8a7e6`), and the same-document action list reuses only the genuine
 * link-list semantics of the donor `ActionsSection` in `text-sections.tsx` (blob
 * `caeee57798bdd533867e5bef350422618187612f`) and `ActionLinks` in `section-support.tsx` (blob
 * `19c9bee3b3b200af2455813e5f842c30b062a6ac`) and the donor figure/caption image presentation of
 * `media-sections.tsx` (blob `e3f3a12e5e26cb6af9133bef79f5fa2dc0680bb2`). The binding reuses only the local Uno-owned
 * asset policy in `src/core/assets/uno-owned-media.ts` (blob `f988a0e5200a29188f5ee9c91ab1ca04755b8e72`). No donor
 * runtime code,
 * package, image or trademark is imported. See `.documents/Architecture/u04-family-parity.md`.
 */
import { readUnoPageDocument, type UnoPageDocument } from "../core/page-document";
import {
  readUnoOwnedAssetRef,
  readUnoOwnedMediaPath,
  unoOwnedMediaExtension,
  type UnoOwnedAssetRef,
} from "../core/assets/uno-owned-media";

/** The seventeen donor source families this bounded adapter accepts, in the order the ledger documents them. */
export const UNO_FOUNDATION_SUBSET_FAMILIES = Object.freeze([
  "prose",
  "callout",
  "table",
  "list",
  "divider",
  "hero",
  "stats",
  "steps",
  "quote",
  "faq",
  "columns",
  "cards",
  "features",
  "actions",
  "media",
  "gallery",
  "contactForm",
] as const);

/** One accepted donor family name. */
export type UnoFoundationSubsetFamily = (typeof UNO_FOUNDATION_SUBSET_FAMILIES)[number];

/**
 * The closed refusal vocabulary.
 *
 * `unsafe-source` — the input is not plain readable data (hostile object, accessor, cycle, sparse array, oversize).
 * `unsupported-family` — a real donor family outside these seventeen, never silently dropped.
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

/**
 * The only destination spelling `actions` accepts: a literal same-document fragment shaped like a generated top-level
 * section id — `#family-<canonical decimal source index>-<name>`.
 *
 * This is deliberately lexical only. It admits nested-looking names so that the exact top-level equality preflight,
 * not this pattern, decides resolvability; it never admits a URL, query, whitespace, percent-encoding or alternate
 * destination form the donor also offers.
 */
const ACTIONS_FRAGMENT = /^#family-(?:0|[1-9][0-9]*)-[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/u;

/** The pinned donor `formRef` identity: lowercase ASCII start, lowercase/digit/hyphen remainder, at most 64 characters. */
const CONTACT_FORM_REF = /^[a-z0-9][a-z0-9-]{0,63}$/u;

/** The single acknowledgement mode this subset understands: an inert OFF notice, never delivery. */
const CONTACT_ACKNOWLEDGEMENT_MODE = "delivery-off";

/**
 * The generated Uno node-id suffix for the donor `contactForm` family.
 *
 * The donor `type` stays canonical and camel-cased; only the composed id must satisfy the frozen Uno section-id grammar
 * `/^[a-z][a-z0-9-]{0,47}$/u`, which admits no uppercase. This is a target-id spelling, not a renamed family.
 */
const CONTACT_TARGET_SUFFIX = "contactform";

/** The donor media identity prefix. It is an opaque migration key, never an Uno-served path. */
const MEDIA_SOURCE_PREFIX = "/assets/";

/** The lowercase raster extensions this bounded subset accepts as a donor image identity. */
const MEDIA_SOURCE_EXTENSIONS: readonly string[] = Object.freeze(["png", "jpg", "jpeg", "webp", "avif"]);

/**
 * Read one donor `media` source identity, or `null`.
 *
 * The value is a donor-side identity only. It must be a literal `/assets/` prefix followed by a relative path the local
 * owned-media policy accepts, with an allowlisted lowercase raster extension, so no external URL, protocol-relative
 * form, percent-encoding, traversal, backslash, colon, whitespace, root alias, device name, uppercase extension or SVG
 * can enter. Nothing is decoded, trimmed, normalised or rewritten into an Uno reference: the returned string is the
 * authored identity unchanged, and it is used only as a binding lookup key.
 */
function readMediaSourceIdentity(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith(MEDIA_SOURCE_PREFIX)) return null;
  const suffix = readUnoOwnedMediaPath(value.slice(MEDIA_SOURCE_PREFIX.length));
  if (suffix === null) return null;
  const extension = unoOwnedMediaExtension(suffix);
  if (extension === null || !MEDIA_SOURCE_EXTENSIONS.includes(extension)) return null;
  return value;
}

/** One validated migration-binding context: the owned-ref lookup plus the donor sources actually consumed. */
interface MediaBindingContext {
  readonly lookup: ReadonlyMap<string, UnoOwnedAssetRef>;
  readonly usedSources: Set<string>;
}

/**
 * Read the optional second argument's envelope: at least one of the own keys `images` and `contactForms`.
 *
 * The whole value has already been snapshotted, so nothing here can run authored code. Neither key is authority: they are
 * migration declarations that make a donor identity representable, never a licence to serve an asset or to deliver
 * anything. `{}`, an inherited shape, a non-plain value or an extra key refuses rather than being ignored, so a caller
 * cannot smuggle a provider, recipient, URL or secret through the binder.
 */
interface MigrationBindingEnvelope {
  readonly images: PlainValue | undefined;
  readonly contactForms: PlainValue | undefined;
}

function readMigrationBindingEnvelope(value: PlainValue | undefined): MigrationBindingEnvelope | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) refuseUnsupportedFeature();
  const binder = value as PlainRecord;
  requireExactKeys(binder, [], ["images", "contactForms"]);
  const images = ownsKey(binder, "images") ? binder["images"] : undefined;
  const contactForms = ownsKey(binder, "contactForms") ? binder["contactForms"] : undefined;
  // An empty envelope is neither an image nor a contact declaration; it is refused rather than treated as absent.
  if (images === undefined && contactForms === undefined) refuseUnsupportedFeature();
  return { images, contactForms };
}

/** One validated contact-migration context: acknowledged `formRef` identities plus the ones actually consumed. */
interface ContactBindingContext {
  readonly acknowledged: ReadonlyMap<string, true>;
  readonly usedRefs: Set<string>;
}

/**
 * Read one donor `formRef` identity, or `null` when it is not the pinned donor grammar.
 *
 * The value is a donor-side intent reference, never a provider, recipient, URL, webhook or secret. It is deliberately
 * narrower than the donor's trim semantics: nothing is trimmed, lowercased, normalised or aliased, so a padded or
 * upper-case reference refuses instead of silently becoming a different form identity.
 */
function readContactFormRef(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return CONTACT_FORM_REF.test(value) ? value : null;
}

/**
 * Read the optional `contactForms` acknowledgement list: one to eight unique `{formRef, mode:"delivery-off"}` entries.
 *
 * The list is consent to render an inert notice, not consent to deliver anything. There is no entry field for a
 * recipient, URL, provider, token, secret, status or callback, and an extra key refuses rather than being dropped.
 */
function readContactAcknowledgements(value: PlainValue | undefined): ReadonlyMap<string, true> {
  const acknowledged = new Map<string, true>();
  if (value === undefined) return acknowledged;
  if (!Array.isArray(value)) refuseUnsupportedFeature();
  if (value.length < 1 || value.length > 8) refuseTarget();
  for (const rawAcknowledgement of value) {
    if (
      rawAcknowledgement === null ||
      typeof rawAcknowledgement !== "object" ||
      Array.isArray(rawAcknowledgement)
    ) {
      refuseUnsupportedFeature();
    }
    const entry = rawAcknowledgement as PlainRecord;
    requireExactKeys(entry, ["formRef", "mode"], []);
    const rawFormRef = entry["formRef"];
    if (typeof rawFormRef !== "string") refuseUnsupportedFeature();
    const formRef = readContactFormRef(rawFormRef);
    if (formRef === null) refuseTarget();
    if (entry["mode"] !== CONTACT_ACKNOWLEDGEMENT_MODE) refuseUnsupportedFeature();
    if (acknowledged.has(formRef)) refuseUnsupportedFeature();
    acknowledged.set(formRef, true);
  }
  return acknowledged;
}

/**
 * Read the optional image binding list — exactly one to eight dense `{source, owned}` entries.
 *
 * A present list is a declaration, never source or publication authority: sources are unique validated donor identities
 * and each owned value is validated by the established Uno-owned image policy *before* any candidate exists. An absent
 * list yields an empty lookup, which the `media` and `gallery` arms treat as a refusal rather than as permission to invent
 * a path.
 */
function readImageBindings(value: PlainValue | undefined): ReadonlyMap<string, UnoOwnedAssetRef> {
  const lookup = new Map<string, UnoOwnedAssetRef>();
  if (value === undefined) return lookup;
  if (!Array.isArray(value)) refuseUnsupportedFeature();
  if (value.length < 1 || value.length > 8) refuseTarget();
  for (const rawImage of value) {
    if (rawImage === null || typeof rawImage !== "object" || Array.isArray(rawImage)) {
      refuseUnsupportedFeature();
    }
    const entry = rawImage as PlainRecord;
    requireExactKeys(entry, ["source", "owned"], []);
    const source = readMediaSourceIdentity(entry["source"]);
    if (source === null) refuseUnsupportedFeature();
    if (lookup.has(source)) refuseUnsupportedFeature();
    const decision = readUnoOwnedAssetRef(entry["owned"], "image");
    if (!decision.ok) refuseTarget();
    lookup.set(source, decision.decision.ref);
  }
  return lookup;
}

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

/** Refuse one supported family because a correct-shape value is outside the Uno target's own bound. */
function refuseTarget(): never {
  throw new SourceRefusal("family:target-refused");
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
  readonly module:
    | "content.prose"
    | "content.hero"
    | "content.stats"
    | "content.timeline"
    | "content.testimonials"
    | "interaction.accordion"
    | "layout.grid"
    | "layout.stack"
    | "content.heading"
    | "content.actions"
    | "media.image"
    | "media.gallery"
    | "interaction.contact";
  readonly props: Record<string, unknown>;
  /**
   * Nested children of a child-bearing module (`interaction.accordion`, `layout.grid`, `layout.stack`).
   *
   * This is a carrier only: the Uno reader remains the sole authority on child count, child order, positional entry
   * matching and heading order, so nothing here can widen what a Page is allowed to contain.
   */
  readonly children?: readonly CandidateSection[];
}

/** Read one donor string field, refusing a non-string rather than coercing it. */
function readDonorText(value: PlainValue | undefined, markdownCapable: boolean): string {
  if (typeof value !== "string") refuseUnsupportedFeature();
  if (markdownCapable) refuseMarkdown(value);
  return value;
}

/**
 * Read one donor text field of the two newest families (`steps`, `quote`).
 *
 * These two donor fields are Markdown-capable, and the subset renders them as plain authored text. On top of the
 * constructs `refuseMarkdown` already rejects, unmistakable emphasis, strike, image, blockquote and list forms are
 * refused here rather than printed as inert punctuation. This is a conservative plain-text refusal list, not a
 * Markdown parser, and it is deliberately confined to these two families so the earlier seven keep their exact
 * accepted surface and regression behaviour.
 */
function readNewFamilyText(value: PlainValue | undefined): string {
  const text = readDonorText(value, true);
  if (
    /(?:^|[^*])\*[^*\n]+\*/u.test(text) ||
    /(?:^|[^\w])_[^_\n]+_/u.test(text) ||
    /~~[^~\n]+~~/u.test(text) ||
    /!\[[^\]\n]*\]\([^\n)]*\)/u.test(text) ||
    /(?:^|\n)[ \t]{0,3}(?:>|[-*+]|[0-9]+[.)])[ \t]+/u.test(text)
  ) {
    refuseUnsupportedFeature();
  }
  return text;
}

/**
 * Map one donor section to exactly one Uno `content.prose` node.
 *
 * The donor family is decided by the closed `type` literal. An unsupported family refuses the whole source and is
 * never degraded to a paragraph; a supported family carrying any extra field refuses as a feature. Section ids are
 * `family-<index>-<type>`, which stays inside Uno's own closed section-id grammar.
 */
function composeSection(
  section: PlainValue,
  index: number,
  media: MediaBindingContext,
  contacts: ContactBindingContext,
): CandidateSection {
  if (section === null || typeof section !== "object" || Array.isArray(section)) refuseUnsafeSource();
  const record = section as PlainRecord;

  const type = record["type"];
  if (typeof type !== "string") refuseUnsupportedFeature();
  if (!(UNO_FOUNDATION_SUBSET_FAMILIES as readonly string[]).includes(type)) {
    throw new SourceRefusal("family:unsupported-family");
  }

  // The donor `type` decides the family and stays canonical; only the generated Uno id must satisfy the frozen
  // section-id grammar, which is why the `contactForm` family's target suffix is lowercase. Every prior family keeps its
  // existing spelling byte-identically.
  const id =
    type === "contactForm" ? `family-${index}-${CONTACT_TARGET_SUFFIX}` : `family-${index}-${type}`;

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
    case "hero": {
      // This subset's hero always needs an authored `lede`: a hero-only `support`/`eyebrow` form is not this subset.
      requireExactKeys(record, ["type", "lede"], ["eyebrow", "support", "align", "surface"]);
      const props: Record<string, unknown> = { lede: readDonorText(record["lede"], true) };
      for (const field of ["eyebrow", "support", "align", "surface"] as const) {
        if (!ownsKey(record, field)) continue;
        const value = record[field];
        // Text fields are Markdown-refusing bounded text; `align`/`surface` are copied as authored closed literals and
        // the Uno reader refuses any value outside its own enumeration. Absent optionals stay truly absent.
        if (field === "eyebrow" || field === "support") props[field] = readDonorText(value, true);
        else props[field] = value;
      }
      return { id, module: "content.hero", props };
    }
    case "stats": {
      requireExactKeys(record, ["type", "items"], []);
      const items = record["items"];
      if (!Array.isArray(items)) refuseUnsupportedFeature();
      const output: Record<string, unknown>[] = [];
      for (const raw of items) {
        if (raw === null || typeof raw !== "object" || Array.isArray(raw)) refuseUnsupportedFeature();
        const entry = raw as PlainRecord;
        // Exactly `{value, label, detail?}`: an embedded link, heading or any other key is a feature refusal.
        requireExactKeys(entry, ["value", "label"], ["detail"]);
        const item: Record<string, unknown> = {
          value: readDonorText(entry["value"], true),
          label: readDonorText(entry["label"], true),
        };
        if (ownsKey(entry, "detail")) item["detail"] = readDonorText(entry["detail"], true);
        output.push(item);
      }
      return { id, module: "content.stats", props: { items: output } };
    }
    case "steps": {
      // Donor `steps` may carry `heading`/`lede`; this subset composes the sequence only, never a section heading.
      requireExactKeys(record, ["type", "items"], ["surface"]);
      const items = record["items"];
      if (!Array.isArray(items)) refuseUnsupportedFeature();
      const output: Record<string, unknown>[] = [];
      for (const raw of items) {
        if (raw === null || typeof raw !== "object" || Array.isArray(raw)) refuseUnsupportedFeature();
        const entry = raw as PlainRecord;
        // Exactly `{title, body?}`: an href, route, status, dateLabel, icon or any other key is a feature refusal.
        requireExactKeys(entry, ["title"], ["body"]);
        const item: Record<string, unknown> = { title: readNewFamilyText(entry["title"]) };
        // Donor `body` becomes Uno `description`: no date, lifecycle status or completion is ever manufactured.
        if (ownsKey(entry, "body")) item["description"] = readNewFamilyText(entry["body"]);
        output.push(item);
      }
      const props: Record<string, unknown> = { items: output };
      if (ownsKey(record, "surface")) props["surface"] = record["surface"];
      return { id, module: "content.timeline", props };
    }
    case "quote": {
      requireExactKeys(record, ["type", "body"], ["attribution", "role", "align", "surface"]);
      // The donor suppresses a role-only caption; Uno would render it, so a role without attribution refuses.
      if (ownsKey(record, "role") && !ownsKey(record, "attribution")) refuseUnsupportedFeature();
      const item: Record<string, unknown> = { quote: readNewFamilyText(record["body"]) };
      if (ownsKey(record, "attribution")) item["attribution"] = readNewFamilyText(record["attribution"]);
      if (ownsKey(record, "role")) item["role"] = readNewFamilyText(record["role"]);
      const props: Record<string, unknown> = { items: [item] };
      // `align`/`surface` are copied as authored closed literals; the Uno reader refuses anything outside its own
      // enumeration, so no permissive coercion happens here and absent optionals stay truly absent.
      for (const field of ["align", "surface"] as const) {
        if (ownsKey(record, field)) props[field] = record[field];
      }
      return { id, module: "content.testimonials", props };
    }
    case "faq": {
      // The donor FAQ also accepts heading/lede/surface and rich Markdown; this subset composes none of them.
      requireExactKeys(record, ["type", "items"], []);
      const items = record["items"];
      if (!Array.isArray(items)) refuseUnsupportedFeature();
      // Uno's accordion carries exactly 1..8 positional entries, so the source bound is that same closed bound.
      if (items.length < 1 || items.length > 8) refuseTarget();
      const entries: Record<string, unknown>[] = [];
      const answers: CandidateSection[] = [];
      for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        const raw = items[itemIndex];
        if (raw === null || typeof raw !== "object" || Array.isArray(raw)) refuseUnsupportedFeature();
        const entry = raw as PlainRecord;
        // Exactly `{question, answer}`: a link, icon, open state or any other key is a feature refusal.
        requireExactKeys(entry, ["question", "answer"], []);
        const answerId = `${id}-answer-${itemIndex}`;
        entries.push({ sectionId: answerId, label: readNewFamilyText(entry["question"]) });
        answers.push({
          id: answerId,
          module: "content.prose",
          props: { text: readNewFamilyText(entry["answer"]) },
        });
      }
      return { id, module: "interaction.accordion", props: { items: entries }, children: answers };
    }
    case "columns": {
      requireExactKeys(record, ["type", "items"], ["ratio"]);
      const items = record["items"];
      if (!Array.isArray(items)) refuseUnsupportedFeature();
      // The donor allows two or three columns; Uno's grid also allows one and four, which this subset never composes.
      if (items.length !== 2 && items.length !== 3) refuseTarget();
      const ratioAuthored = ownsKey(record, "ratio");
      // A ratio only means something for two columns: three columns plus an authored ratio refuses instead of being
      // silently discarded, because discarding it would change an authored layout decision.
      if (ratioAuthored && items.length !== 2) refuseUnsupportedFeature();
      const columns: CandidateSection[] = [];
      for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        const raw = items[itemIndex];
        if (raw === null || typeof raw !== "object" || Array.isArray(raw)) refuseUnsupportedFeature();
        const entry = raw as PlainRecord;
        const hasBody = ownsKey(entry, "body");
        const hasList = ownsKey(entry, "items");
        // Each donor column is a title with a body OR a title with a list: never both and never neither.
        if (hasBody === hasList) refuseUnsupportedFeature();
        requireExactKeys(entry, ["title"], [hasBody ? "body" : "items"]);

        const title = readNewFamilyText(entry["title"]);
        // Uno's heading text bound is wider than the donor column-title bound, so the subset's own 160-codepoint limit
        // is enforced here; the shared target reader would otherwise accept a longer heading.
        if (codePointLength(title) > 160) refuseTarget();

        const columnId = `${id}-column-${itemIndex}`;
        let content: CandidateSection;
        if (hasBody) {
          content = {
            id: `${columnId}-body`,
            module: "content.prose",
            props: { text: readNewFamilyText(entry["body"]) },
          };
        } else {
          const labels = entry["items"];
          if (!Array.isArray(labels)) refuseUnsupportedFeature();
          if (labels.length < 1 || labels.length > 12) refuseTarget();
          const list: Record<string, unknown>[] = [];
          for (const label of labels) list.push({ label: readNewFamilyText(label) });
          content = { id: `${columnId}-body`, module: "content.prose", props: { variant: "list", items: list } };
        }

        columns.push({
          id: columnId,
          module: "layout.stack",
          props: { gap: "tight" },
          children: [
            { id: `${columnId}-title`, module: "content.heading", props: { text: title, level: 2 } },
            content,
          ],
        });
      }
      const props: Record<string, unknown> = { columns: columns.length };
      // An absent ratio stays absent; an authored one is copied as a closed literal the Uno reader validates.
      if (ratioAuthored) props["ratio"] = record["ratio"];
      return { id, module: "layout.grid", props, children: columns };
    }
    case "cards":
    case "features": {
      // The donor card also accepts image/meta/action and the donor feature an icon; this subset composes neither, and
      // it requires `columns` explicitly instead of manufacturing the donor renderer's default.
      requireExactKeys(record, ["type", "columns", "items"], []);
      const cols = record["columns"];
      if (cols !== 2 && cols !== 3 && cols !== 4) refuseTarget();
      const rawItems = record["items"];
      if (!Array.isArray(rawItems)) refuseUnsupportedFeature();
      // Uno's `itemSemantics: "list"` grid carries one native `<li>` per child, within its own bounded child count.
      if (rawItems.length < 1 || rawItems.length > 8) refuseTarget();
      const children: CandidateSection[] = [];
      for (let itemIndex = 0; itemIndex < rawItems.length; itemIndex += 1) {
        const rawItem = rawItems[itemIndex];
        if (rawItem === null || typeof rawItem !== "object" || Array.isArray(rawItem)) refuseUnsupportedFeature();
        const entry = rawItem as PlainRecord;
        requireExactKeys(entry, ["title"], ["body"]);
        const title = readNewFamilyText(entry["title"]);
        // Uno's heading bound is wider than the donor item-title bound, so this subset's own limit is enforced here.
        if (codePointLength(title) > 160) refuseTarget();
        const itemId = `${id}-item-${itemIndex}`;
        const nested: CandidateSection[] = [
          { id: `${itemId}-title`, module: "content.heading", props: { text: title, level: 2 } },
        ];
        // An absent body stays absent: no manufactured paragraph, meta line, action or icon.
        if (ownsKey(entry, "body")) {
          nested.push({
            id: `${itemId}-body`,
            module: "content.prose",
            props: { text: readNewFamilyText(entry["body"]) },
          });
        }
        children.push({ id: itemId, module: "layout.stack", props: { gap: "tight" }, children: nested });
      }
      return { id, module: "layout.grid", props: { columns: cols, itemSemantics: "list" }, children };
    }
    case "actions": {
      // The donor also accepts `href`/`route`/`link` destinations, an action `variant` and section heading/lede/align/
      // surface options. This subset composes only an authored same-document fragment naming a composed section.
      requireExactKeys(record, ["type", "actions"], []);
      const sourceActions = record["actions"];
      if (!Array.isArray(sourceActions)) refuseUnsupportedFeature();
      if (sourceActions.length < 1 || sourceActions.length > 8) refuseTarget();
      const items: Record<string, unknown>[] = [];
      for (const rawAction of sourceActions) {
        if (rawAction === null || typeof rawAction !== "object" || Array.isArray(rawAction)) {
          refuseUnsupportedFeature();
        }
        const entry = rawAction as PlainRecord;
        requireExactKeys(entry, ["label", "href"], []);
        const label = readNewFamilyText(entry["label"]);
        // The donor label is Markdown-capable and its own title bound is narrower than Uno's heading bound.
        if (label.trim().length === 0 || codePointLength(label) > 160) refuseTarget();
        const href = entry["href"];
        if (typeof href !== "string") refuseUnsupportedFeature();
        // Canonical position plus donor type only: a literal fragment, never a URL to classify, decode or rewrite.
        if (!ACTIONS_FRAGMENT.test(href)) refuseUnsupportedFeature();
        items.push({ label, targetId: href.slice(1) });
      }
      return { id, module: "content.actions", props: { items } };
    }
    case "media": {
      // The donor also accepts decorative images, a remote source, heading/lede, position and surface. This subset
      // composes one descriptive owned image per section, and only from an explicit caller-supplied binding.
      requireExactKeys(record, ["type", "image"], ["caption"]);
      const rawImage = record["image"];
      if (rawImage === null || typeof rawImage !== "object" || Array.isArray(rawImage)) refuseUnsupportedFeature();
      const image = rawImage as PlainRecord;
      requireExactKeys(image, ["src", "alt"], []);
      const source = readMediaSourceIdentity(image["src"]);
      if (source === null) refuseUnsupportedFeature();
      const alt = readNewFamilyText(image["alt"]);
      // A donor decorative image (empty alt) is a different semantic and is not composed as a described image.
      if (alt.trim().length === 0) refuseTarget();
      const hasCaption = ownsKey(record, "caption");
      const caption = hasCaption ? readNewFamilyText(record["caption"]) : undefined;
      if (caption !== undefined && caption.trim().length === 0) refuseTarget();
      // An unbound source has no owned reference: refuse rather than substitute a path or an external URL.
      const owned = media.lookup.get(source);
      if (owned === undefined) refuseUnsupportedFeature();
      media.usedSources.add(source);
      return {
        id,
        module: "media.image",
        props: { asset: owned, alt, ...(caption === undefined ? {} : { caption }) },
      };
    }
    case "gallery": {
      // The donor also accepts optional heading/lede/surface, decorative images, Markdown captions and an implicit
      // column default. This subset composes an explicitly columned grid of described images only.
      requireExactKeys(record, ["type", "columns", "items"], []);
      const columns = record["columns"];
      if (columns !== 2 && columns !== 3 && columns !== 4) refuseTarget();
      const rawItems = record["items"];
      if (!Array.isArray(rawItems)) refuseUnsupportedFeature();
      // Narrower than Uno's own 2..12 gallery bound: at most the binder's eight unique source identities.
      if (rawItems.length < 2 || rawItems.length > 8) refuseTarget();
      const items: Record<string, unknown>[] = [];
      for (const rawItem of rawItems) {
        if (rawItem === null || typeof rawItem !== "object" || Array.isArray(rawItem)) {
          refuseUnsupportedFeature();
        }
        const entry = rawItem as PlainRecord;
        requireExactKeys(entry, ["image"], ["caption"]);
        const rawImage = entry["image"];
        if (rawImage === null || typeof rawImage !== "object" || Array.isArray(rawImage)) {
          refuseUnsupportedFeature();
        }
        const image = rawImage as PlainRecord;
        requireExactKeys(image, ["src", "alt"], []);
        const source = readMediaSourceIdentity(image["src"]);
        if (source === null) refuseUnsupportedFeature();
        const alt = readNewFamilyText(image["alt"]);
        // A donor decorative image is a different semantic and is not composed as a described grid item.
        if (alt.trim().length === 0) refuseTarget();
        const caption = ownsKey(entry, "caption") ? readNewFamilyText(entry["caption"]) : undefined;
        if (caption !== undefined && caption.trim().length === 0) refuseTarget();
        const owned = media.lookup.get(source);
        if (owned === undefined) refuseUnsupportedFeature();
        media.usedSources.add(source);
        items.push({ asset: owned, alt, ...(caption === undefined ? {} : { caption }) });
      }
      return { id, module: "media.gallery", props: { columns, items } };
    }
    case "contactForm": {
      // The donor accepts `{type, formRef}` only: a reference to a form renderer it may or may not have. This subset
      // composes an inert notice, never a form, so the reference must carry an exact, separate migration
      // acknowledgement; nothing about it is ever copied into the Page.
      requireExactKeys(record, ["type", "formRef"], []);
      const rawFormRef = record["formRef"];
      if (typeof rawFormRef !== "string") refuseUnsupportedFeature();
      const formRef = readContactFormRef(rawFormRef);
      if (formRef === null) refuseTarget();
      if (!contacts.acknowledged.has(formRef)) refuseUnsupportedFeature();
      contacts.usedRefs.add(formRef);
      // Empty props: the existing Uno renderer supplies its own fixed delivery-OFF notice and no form controls.
      return { id, module: "interaction.contact", props: {} };
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
export function composeUnoFoundationSubset(input: unknown, bindings?: unknown): UnoFoundationSubsetOutcome {
  try {
    const source = snapshotPlainSource(input, 1, { nodes: 0 }, new WeakSet<object>());
    // The optional migration binding is separately untrusted: its own snapshot, budget and cycle set, read before any
    // donor section so no authored accessor on either side can run.
    const bindingSource =
      bindings === undefined ? undefined : snapshotPlainSource(bindings, 1, { nodes: 0 }, new WeakSet<object>());
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
    const migration = readMigrationBindingEnvelope(bindingSource);
    const media: MediaBindingContext = {
      lookup: readImageBindings(migration?.images),
      usedSources: new Set<string>(),
    };
    const contacts: ContactBindingContext = {
      acknowledged: readContactAcknowledgements(migration?.contactForms),
      usedRefs: new Set<string>(),
    };
    for (let index = 0; index < sections.length; index += 1) {
      const section = sections[index];
      if (section === undefined) refuseUnsafeSource();
      nodes.push(composeSection(section, index, media, contacts));
    }

    // The binding must be exactly the set of donor sources the document consumed: no missing, extra or unused
    // authority, and no composed media without an owned reference. An absent binder with no media is the one allowed
    // empty case.
    if (media.usedSources.size !== media.lookup.size) refuseUnsupportedFeature();
    for (const usedSource of media.usedSources) {
      if (!media.lookup.has(usedSource)) refuseUnsupportedFeature();
    }

    // The same exact-set rule for contact acknowledgements: every acknowledged `formRef` must be consumed by an authored
    // section and every authored section must be acknowledged. An acknowledgement never becomes publication or delivery
    // authority, and a Page with no contact section may not carry one.
    if (contacts.usedRefs.size !== contacts.acknowledged.size) refuseUnsupportedFeature();
    for (const usedRef of contacts.usedRefs) {
      if (!contacts.acknowledged.has(usedRef)) refuseUnsupportedFeature();
    }

    // `content.actions` may name only a *top-level* section this composer itself just generated. This is an exact
    // equality check against its own ids — not a URL classifier — so a missing target, a mistyped name or a nested
    // generated child refuses instead of becoming a live same-document anchor.
    const topLevelIds = new Set(nodes.map((node) => node.id));
    for (const node of nodes) {
      if (node.module !== "content.actions") continue;
      const authoredItems = node.props["items"];
      if (!Array.isArray(authoredItems)) refuseTarget(); // the candidate is this module's own plain data
      for (const item of authoredItems) {
        const candidateTarget = (item as { targetId?: unknown }).targetId;
        if (typeof candidateTarget !== "string" || !topLevelIds.has(candidateTarget)) refuseTarget();
      }
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
