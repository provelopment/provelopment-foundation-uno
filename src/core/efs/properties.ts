/**
 * Foundation Uno — the closed typed-property contract (U02, `UNO-WO-018 / R01`).
 *
 * WHAT THIS IS. A *declaration* vocabulary for five optional authored properties, and one
 * deterministic nearest-ancestor cascade over the fixed ownership chain
 * Entity → Facet → Site → Page → representation. It is authorship metadata: nothing here
 * selects a public Site, opens a route, resolves a URL, reads a file, parses content or
 * authorises publication. An accepted value cannot make anything live.
 *
 * PROVENANCE. REWRITE for Uno, informed by the pinned Foundation GEO-03 commit
 * `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`: `src/core/efs/properties.ts`
 * (Git blob `c0b6346e720e1d57315a4d583ae8cd2ce92203ee`) supplied the five-level
 * nearest-explicit cascade idea, and `src/core/efs/property-contract.ts`
 * (Git blob `f45ec31b6e61f83b90dde1067f32e6a748633c43`) supplied the typed-string fact idea.
 * This is an original Uno implementation, not a copy: no upstream byte runs here, no upstream
 * blob identity is carried, and the upstream Spoke bindings, generalized property values,
 * IANA timezone data, opening-hours models, rendering code and file I/O are deliberately absent.
 *
 * PURITY. Framework-free and dependency-free within Uno's own core: no `fs`, no `process`,
 * environment, clock, network, adapter, Next.js, React or Node built-in. Importing this module
 * executes nothing.
 *
 * HOSTILE INPUT. Only own enumerable **data** properties are read; an accessor is refused without
 * ever being invoked, symbol properties and non-plain prototypes are refused, and a throwing
 * Proxy trap becomes a bounded refusal because the whole walk is guarded. Copies are built on
 * null-prototype records so an authored `__proto__` key can never reach a prototype setter.
 * Nothing is mutated, no caller value is stringified into a diagnostic, and every refusal is one
 * of the closed literals in `PROPERTY_REFUSAL_REASONS`.
 */

import { isContentSlug } from "../page-content";
import { isEntityId } from "./identity";
import { canonicalLocaleTag, localeTagIssue } from "./uno-locales";

/**
 * The closed authored property-key vocabulary for this increment.
 *
 * A key outside this list is refused rather than stored, so no generic arbitrary-JSON property
 * surface exists. `timezone`, `openingSchedule` and every other structured fact require a
 * separate researched contract.
 */
export const UNO_PROPERTY_KEYS = Object.freeze([
  "brand.name",
  "contact.name",
  "contact.email",
  "contact.phone",
] as const);

/** One allowed authored property key. */
export type UnoPropertyKey = (typeof UNO_PROPERTY_KEYS)[number];

/** The five ownership levels, in their one legal order. */
export const UNO_PROPERTY_LEVELS = Object.freeze([
  "entity",
  "facet",
  "site",
  "page",
  "representation",
] as const);

/** One ownership level of the authored chain. */
export type UnoPropertyLevel = (typeof UNO_PROPERTY_LEVELS)[number];

/** Declared bounds: limits, never defaults. Exceeding one is a refusal, not a truncation. */
export const UNO_PROPERTY_LIMITS = Object.freeze({
  valueLength: 240,
  keysPerBag: 4,
  ancestryDepth: 5,
});


/**
 * The closed refusal vocabulary. Every reason a caller can receive is one of these literals, so a
 * diagnostic can never echo an authored value, a contact detail or a caller's own message.
 */
export type UnoPropertyRefusal =
  | "property:unreadable"
  | "property:invalid-bag"
  | "property:unknown-key"
  | "property:too-many-keys"
  | "property:invalid-declaration"
  | "property:invalid-value"
  | "property:invalid-public"
  | "property:invalid-id"
  | "property:invalid-ancestry";

/** The closed refusal vocabulary as data, for callers that must enumerate or document it. */
export const PROPERTY_REFUSAL_REASONS: readonly UnoPropertyRefusal[] = Object.freeze([
  "property:unreadable",
  "property:invalid-bag",
  "property:unknown-key",
  "property:too-many-keys",
  "property:invalid-declaration",
  "property:invalid-value",
  "property:invalid-public",
  "property:invalid-id",
  "property:invalid-ancestry",
]);

/**
 * One authored declaration: a bounded string, or literal `null` as an explicit suppression of an
 * inherited value. `public` is authorship metadata only — in U02 it never projects anywhere.
 */
export interface UnoPropertyDeclaration {
  readonly value: string | null;
  readonly public: boolean;
}

/** One validated property bag. An absent bag is valid; a present bag is bounded and closed. */
export type UnoPropertyBag = Readonly<Partial<Record<UnoPropertyKey, UnoPropertyDeclaration>>>;

/** Where a resolved value came from: the declaring level and its authored identifier. */
export interface UnoPropertyOrigin {
  readonly level: UnoPropertyLevel;
  readonly id: string;
}

/** How a key resolved: declared here, inherited from an ancestor, or suppressed by `null`. */
export type UnoPropertyStatus = "declared" | "inherited" | "suppressed";

/** One resolved property: its origin, status, value and authored `public` metadata. */
export interface UnoPropertyResolution {
  readonly status: UnoPropertyStatus;
  readonly value: string | null;
  readonly public: boolean;
  readonly origin: UnoPropertyOrigin;
}

/** The full resolution of one ancestry walk. Keys with no declaration anywhere are absent. */
export interface UnoResolvedProperties {
  readonly properties: Readonly<Partial<Record<UnoPropertyKey, UnoPropertyResolution>>>;
}

/** One authored chain link supplied by the caller. `properties` is omitted when not authored. */
export interface UnoPropertyAncestryEntry {
  readonly level: UnoPropertyLevel;
  readonly id: string;
  readonly properties?: unknown;
}

/** A tagged result: one validated bag, or one closed reason and no partial bag. */
export type UnoPropertyBagResult =
  | { readonly accepted: true; readonly bag: UnoPropertyBag }
  | { readonly accepted: false; readonly reason: UnoPropertyRefusal };

/** A tagged result: one resolved set, or one closed reason and no partial resolution. */
export type UnoPropertyResolutionResult =
  | { readonly accepted: true; readonly resolved: UnoResolvedProperties }
  | { readonly accepted: false; readonly reason: UnoPropertyRefusal };

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for input that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/** One validated declaration, or one closed reason. */
type Step<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: UnoPropertyRefusal };

/** The empty bag, used when a chain link authors no properties at all. */
const EMPTY_BAG: UnoPropertyBag = Object.freeze(Object.create(null) as UnoPropertyBag);

/**
 * Read an untrusted value as a plain record of own enumerable data properties.
 *
 * A non-object (including `null` and an array) is reported as `null` so the caller can answer
 * `property:invalid-bag` / `property:invalid-ancestry`. Hostile structure — a non-plain prototype,
 * any symbol property, or any accessor — throws `HostileInput`, which the public entry point turns
 * into the bounded `property:unreadable` refusal **without ever invoking a getter**. The copy is a
 * null-prototype record, so an own `__proto__` key stays an inert data key instead of reaching a
 * prototype setter.
 */
function readOwnData(value: unknown): DataRecord | null {
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

/** Deep-freeze a freshly built structure so no caller can later rewrite accepted metadata. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/** Whether `value` is one of the closed authored property keys. */
function isUnoPropertyKey(value: string): value is UnoPropertyKey {
  return (UNO_PROPERTY_KEYS as readonly string[]).includes(value);
}

/** The bounded bag refusal. No partial bag, no echoed value. */
function refuseBag(reason: UnoPropertyRefusal): UnoPropertyBagResult {
  return Object.freeze({ accepted: false, reason });
}

/** The bounded resolution refusal. No partial selection, no echoed value. */
function refuseResolution(reason: UnoPropertyRefusal): UnoPropertyResolutionResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Validate one authored property bag.
 *
 * An absent bag is the caller's decision (`undefined` is refused here rather than read as empty),
 * a present bag is a plain object of at most four allowed keys, and every declaration is exactly
 * `{ value }` or `{ value, public }`. Nothing is coerced: a non-boolean `public`, a blank or
 * over-long value, a non-string value and an unknown descriptor field are all refused.
 */
export function validateUnoPropertyBag(input: unknown): UnoPropertyBagResult {
  try {
    return analyzeBag(input);
  } catch {
    return refuseBag("property:unreadable");
  }
}

/** The guarded bag walk. Every failure returns before any bag is produced. */
function analyzeBag(input: unknown): UnoPropertyBagResult {
  const record = readOwnData(input);
  if (record === null) return refuseBag("property:invalid-bag");

  const keys = Object.keys(record);
  if (keys.length > UNO_PROPERTY_LIMITS.keysPerBag) return refuseBag("property:too-many-keys");

  const bag = Object.create(null) as Record<string, UnoPropertyDeclaration>;
  for (const key of keys) {
    if (!isUnoPropertyKey(key)) return refuseBag("property:unknown-key");
    const declaration = readDeclaration(record[key]);
    if (!declaration.ok) return refuseBag(declaration.reason);
    bag[key] = declaration.value;
  }
  return Object.freeze({ accepted: true, bag: deepFreeze(bag) as UnoPropertyBag });
}

/**
 * Validate one declaration: exactly one `value` of a bounded, non-blank string or literal `null`,
 * plus an optional boolean `public`. An unknown descriptor field is refused rather than ignored, so
 * a misspelt `isPublic` cannot silently mean "private".
 */
function readDeclaration(raw: unknown): Step<UnoPropertyDeclaration> {
  const record = readOwnData(raw);
  if (record === null) return { ok: false, reason: "property:invalid-declaration" };

  for (const key of Object.keys(record)) {
    if (key !== "value" && key !== "public") return { ok: false, reason: "property:invalid-declaration" };
  }
  if (!Object.prototype.hasOwnProperty.call(record, "value")) {
    return { ok: false, reason: "property:invalid-declaration" };
  }

  let declaredPublic = false;
  if (Object.prototype.hasOwnProperty.call(record, "public")) {
    if (typeof record.public !== "boolean") return { ok: false, reason: "property:invalid-public" };
    declaredPublic = record.public;
  }

  const value = record.value;
  if (value === null) {
    return { ok: true, value: Object.freeze({ value: null, public: declaredPublic }) };
  }
  if (typeof value !== "string") return { ok: false, reason: "property:invalid-value" };
  if (value.length === 0 || value.length > UNO_PROPERTY_LIMITS.valueLength) {
    return { ok: false, reason: "property:invalid-value" };
  }
  if (value.trim().length === 0) return { ok: false, reason: "property:invalid-value" };

  return { ok: true, value: Object.freeze({ value, public: declaredPublic }) };
}


/**
 * Validate one ancestry identifier against its level's own contract.
 *
 * The identifier is *authored* identity, never a name, URL, host or locale guess: an Entity must
 * be a canonical EntityID, a Facet/Site/Page must be a content slug, and a representation must be a
 * canonical full-region locale spelling. A near miss is refused, not repaired.
 */
function ancestryIdIssue(level: UnoPropertyLevel, id: unknown): UnoPropertyRefusal | null {
  if (level === "entity") return isEntityId(id) ? null : "property:invalid-id";
  if (level === "representation") {
    if (localeTagIssue(id) !== null) return "property:invalid-id";
    try {
      return canonicalLocaleTag(id) === id ? null : "property:invalid-id";
    } catch {
      return "property:invalid-id";
    }
  }
  return isContentSlug(id) ? null : "property:invalid-id";
}

/**
 * Resolve the typed properties of one authored chain.
 *
 * The caller supplies a **contiguous** ancestry in the fixed order Entity → Facet → Site → Page →
 * representation. The walk never searches the manifest for nearby identifiers, never crosses a
 * sibling Facet, Site, Page or representation, never guesses a missing level and never publishes:
 * for each allowed key the nearest explicit declaration wins, omission inherits, and literal `null`
 * suppresses — including against a grandparent, so a suppression cannot be undone from above. The
 * accepted result is freshly owned and deeply frozen, never a reference to caller data.
 */
export function resolveUnoProperties(ancestry: unknown): UnoPropertyResolutionResult {
  try {
    return analyzeAncestry(ancestry);
  } catch {
    return refuseResolution("property:unreadable");
  }
}

/** The guarded ancestry walk. Every failure returns before any resolution is produced. */
function analyzeAncestry(input: unknown): UnoPropertyResolutionResult {
  if (!Array.isArray(input)) return refuseResolution("property:invalid-ancestry");
  if (input.length === 0 || input.length > UNO_PROPERTY_LIMITS.ancestryDepth) {
    return refuseResolution("property:invalid-ancestry");
  }

  const levels: UnoPropertyLevel[] = [];
  const ids: string[] = [];
  const bags: UnoPropertyBag[] = [];

  for (let index = 0; index < input.length; index += 1) {
    const expected = UNO_PROPERTY_LEVELS[index];
    if (expected === undefined) return refuseResolution("property:invalid-ancestry");

    const record = readOwnData(input[index]);
    if (record === null) return refuseResolution("property:invalid-ancestry");
    for (const key of Object.keys(record)) {
      if (key !== "level" && key !== "id" && key !== "properties") {
        return refuseResolution("property:invalid-ancestry");
      }
    }
    if (!Object.prototype.hasOwnProperty.call(record, "level")) {
      return refuseResolution("property:invalid-ancestry");
    }
    if (!Object.prototype.hasOwnProperty.call(record, "id")) {
      return refuseResolution("property:invalid-ancestry");
    }
    if (record.level !== expected) return refuseResolution("property:invalid-ancestry");

    const idIssue = ancestryIdIssue(expected, record.id);
    if (idIssue !== null) return refuseResolution(idIssue);

    let bag = EMPTY_BAG;
    if (Object.prototype.hasOwnProperty.call(record, "properties")) {
      const validated = validateUnoPropertyBag(record.properties);
      if (!validated.accepted) return refuseResolution(validated.reason);
      bag = validated.bag;
    }

    levels.push(expected);
    ids.push(record.id as string);
    bags.push(bag);
  }

  const properties = Object.create(null) as Record<string, UnoPropertyResolution>;
  for (const key of UNO_PROPERTY_KEYS) {
    for (let index = levels.length - 1; index >= 0; index -= 1) {
      const bag = bags[index];
      const level = levels[index];
      const id = ids[index];
      if (bag === undefined || level === undefined || id === undefined) continue;
      const declaration = bag[key];
      if (declaration === undefined) continue;

      const nearest = index === levels.length - 1;
      const status: UnoPropertyStatus =
        declaration.value === null ? "suppressed" : nearest ? "declared" : "inherited";
      properties[key] = Object.freeze({
        status,
        value: declaration.value,
        public: declaration.public,
        origin: Object.freeze({ level, id }),
      });
      break;
    }
  }

  return Object.freeze({
    accepted: true,
    resolved: Object.freeze({ properties: deepFreeze(properties) as UnoResolvedProperties["properties"] }),
  });
}

/**
 * Project only the non-suppressed resolved values, for a caller that needs a flat value record.
 *
 * This is a *declaration* projection used by tests and later stages; it authorises no rendering,
 * no metadata and no public surface. A suppressed key is absent by construction, so a suppression
 * can never fall back to a grandparent's value.
 */
export function projectUnoPropertyValues(
  resolved: UnoResolvedProperties,
): Readonly<Partial<Record<UnoPropertyKey, string>>> {
  const projected = Object.create(null) as Record<string, string>;
  try {
    for (const key of UNO_PROPERTY_KEYS) {
      const resolution = resolved.properties[key];
      if (resolution === undefined) continue;
      if (resolution.status === "suppressed" || resolution.value === null) continue;
      projected[key] = resolution.value;
    }
  } catch {
    return Object.freeze(Object.create(null) as Partial<Record<UnoPropertyKey, string>>);
  }
  return Object.freeze(projected) as Readonly<Partial<Record<UnoPropertyKey, string>>>;
}
