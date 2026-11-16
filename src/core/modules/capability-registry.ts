/**
 * Foundation Uno — the A1 capability vocabulary.
 *
 * NEW UNO-OWNED ADAPTATION. The 22 identifiers below are written by Uno from the
 * Owner-approved vocabulary (`BLUEPRINT.md` §5, restated exactly in `UNO-WO-007 / R01` §3).
 * No Foundation module, renderer, composer, prop schema, asset or test is copied here, and
 * no upstream file is imported: this file has no imports at all.
 *
 * This is a **contract vocabulary**, not a module framework. It answers exactly two
 * questions — "is this string one approved A1 capability ID?" and "which single approved
 * group owns it?" — and authorises nothing beyond that. There is no renderer, no authored
 * props or envelope schema, no routing, no filesystem access, no provider and no execution
 * path. A registered ID does not mean a module can render, execute or publish anything.
 *
 * A second, deliberately separate export lists the 17 Foundation Page-section families that
 * the pinned schema actually evidences. Those names live in a **different namespace**: a
 * family is a source observation and a future obligation, never a module ID, and the two
 * lists are never interchangeable even where words overlap — `contactForm` is a Foundation
 * family, not `interaction.contact`, and it implies no mail, provider or authorization
 * adapter.
 */

/** The five approved A1 capability groups, in canonical order. */
export const CAPABILITY_GROUPS = Object.freeze([
  "layout",
  "content",
  "media",
  "design",
  "interaction",
] as const);

export type CapabilityGroup = (typeof CAPABILITY_GROUPS)[number];

/** 4 approved layout capabilities. */
const LAYOUT_CAPABILITY_IDS = Object.freeze([
  "layout.stack",
  "layout.grid",
  "layout.bento",
  "layout.layers",
] as const);

/** 8 approved content capabilities. */
const CONTENT_CAPABILITY_IDS = Object.freeze([
  "content.heading",
  "content.prose",
  "content.actions",
  "content.hero",
  "content.stats",
  "content.testimonials",
  "content.pricing",
  "content.timeline",
] as const);

/** 4 approved media capabilities. */
const MEDIA_CAPABILITY_IDS = Object.freeze([
  "media.image",
  "media.video",
  "media.gallery",
  "media.carousel",
] as const);

/** 2 approved design capabilities. */
const DESIGN_CAPABILITY_IDS = Object.freeze([
  "design.watermark",
  "design.motion",
] as const);

/** 4 approved interaction capabilities. */
const INTERACTION_CAPABILITY_IDS = Object.freeze([
  "interaction.tabs",
  "interaction.accordion",
  "interaction.modal",
  "interaction.contact",
] as const);

/**
 * The 22 approved A1 capability IDs, grouped 4 / 8 / 4 / 2 / 4.
 *
 * The record and every array in it are frozen, so a caller cannot append, replace or reorder
 * an approved identifier at runtime.
 */
export const CAPABILITIES_BY_GROUP = Object.freeze({
  layout: LAYOUT_CAPABILITY_IDS,
  content: CONTENT_CAPABILITY_IDS,
  media: MEDIA_CAPABILITY_IDS,
  design: DESIGN_CAPABILITY_IDS,
  interaction: INTERACTION_CAPABILITY_IDS,
} as const);

/**
 * Every approved A1 capability ID in canonical group order — exactly 22 entries.
 *
 * The element type is inferred from the literal tuples above, so `CapabilityId` is the exact
 * union of the 22 string literals and a misspelling cannot be hidden behind `string`.
 */
export const CAPABILITY_IDS = Object.freeze([
  ...LAYOUT_CAPABILITY_IDS,
  ...CONTENT_CAPABILITY_IDS,
  ...MEDIA_CAPABILITY_IDS,
  ...DESIGN_CAPABILITY_IDS,
  ...INTERACTION_CAPABILITY_IDS,
] as const);

export type CapabilityId = (typeof CAPABILITY_IDS)[number];

/**
 * The single approved group owning each ID, built from the same literals the exports expose.
 * A `Map` is used deliberately: membership and lookup then never depend on object prototypes,
 * so `constructor`, `__proto__` or `toString` can never be read as an approved identifier.
 */
const CAPABILITY_GROUP_BY_ID = new Map<string, CapabilityGroup>();
for (const group of CAPABILITY_GROUPS) {
  for (const id of CAPABILITIES_BY_GROUP[group]) {
    CAPABILITY_GROUP_BY_ID.set(id, group);
  }
}

/**
 * True when `value` is exactly one approved A1 capability ID.
 *
 * The `unknown` signature is deliberate: a non-string is refused before any lookup, so no
 * value is coerced and an object with a custom `toString` or `Symbol.toPrimitive` can never
 * be read as an approved identifier.
 */
export function isCapabilityId(value: unknown): value is CapabilityId {
  return typeof value === "string" && CAPABILITY_GROUP_BY_ID.has(value);
}

/**
 * The one approved group that owns `value`, or `undefined` when it is not an approved ID.
 *
 * The group is never derived by splitting an unregistered string: `layout.unknown` has no
 * group, and no near-miss, case variant or Foundation family name is repaired or guessed.
 */
export function capabilityGroupFor(value: unknown): CapabilityGroup | undefined {
  if (typeof value !== "string") return undefined;
  return CAPABILITY_GROUP_BY_ID.get(value);
}

/**
 * The 17 Foundation Page-section families evidenced by the pinned GEO-03 source:
 * `src/core/page-document.ts` (`PAGE_SECTION_TYPES`, Git blob
 * `a12d964c43626c6313a621bf628f5cc24b65d444`) and its composer
 * `src/components/site/page-document-content.tsx` (exhaustive section switch, Git blob
 * `fc35a52d6cfc5f114e50470e8286a89916cde801`).
 *
 * These are **obligations, not registered module IDs**, and none is implemented in Uno. They
 * are listed here only so that the two namespaces can be compared without being conflated;
 * an uncertain family-to-ID mapping is a recorded gap, never permission to invent an ID.
 */
export const FOUNDATION_PAGE_SECTION_FAMILIES = Object.freeze([
  "hero",
  "prose",
  "media",
  "gallery",
  "actions",
  "callout",
  "cards",
  "features",
  "columns",
  "steps",
  "stats",
  "quote",
  "table",
  "faq",
  "list",
  "divider",
  "contactForm",
] as const);

export type FoundationPageSectionFamily = (typeof FOUNDATION_PAGE_SECTION_FAMILIES)[number];
