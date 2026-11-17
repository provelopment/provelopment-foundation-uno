/**
 * Foundation Uno — the committed canonical base reader (`UNO-WO-027 / R02`, U03).
 *
 * WHAT THIS IS. One pure application use case that answers a single question about the repository's own
 * declared data: *which canonical base, if any, has the selected Site stated?* The answer is the validated
 * base plus the Site identity it belongs to, or one closed refusal.
 *
 * WHAT THIS IS NOT. It is not a host binding, a runtime `basePath`, a redirect table, a deployment target or
 * a publication decision. It reads no file, no environment, no clock, no network and no provider; the caller
 * supplies the manifest and the declaration as data. A committed declaration that states no base is answered
 * with `committed-base:missing` — this module never invents, infers or defaults a domain.
 *
 * DELEGATION. Selection, manifest graph, the optional short-language mapping and the newly integrated
 * optional base are all decided by `validateUnoSiteSelection`, which itself delegates every URL, prefix,
 * alias and overlap rule to `validateUnoCanonicalBase`. This module restates none of those rules; it maps the
 * validator's closed codes onto its own closed vocabulary and copies nothing from a rejected value.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**; the pinned read-only Foundation GEO-03
 * commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` is conceptual context only. No Foundation, Solo or
 * Connect code, media or brand is imported, and Apache-2.0 notices are unchanged.
 */
import { validateUnoSiteSelection } from "../core/efs/uno-config";

/** The closed refusal vocabulary: one literal per failure family, never widened at a call site. */
export type UnoCommittedBaseRefusal =
  | "committed-base:input-invalid"
  | "committed-base:unreadable"
  | "committed-base:selection-invalid"
  | "committed-base:missing"
  | "committed-base:invalid";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_COMMITTED_BASE_REFUSAL_REASONS: readonly UnoCommittedBaseRefusal[] = Object.freeze([
  "committed-base:input-invalid",
  "committed-base:unreadable",
  "committed-base:selection-invalid",
  "committed-base:missing",
  "committed-base:invalid",
] as const);

/** The two own-data keys the request may carry; anything else refuses rather than being ignored. */
export const UNO_COMMITTED_BASE_INPUT_KEYS: readonly string[] = Object.freeze(["manifest", "selection"] as const);

/** The one selected Site this answer belongs to. */
export interface UnoCommittedBaseSite {
  readonly entityId: string;
  readonly facetId: string;
  readonly siteId: string;
}

/** The declared base, in the declaration's own single-string form. */
export interface UnoCommittedBaseValue {
  readonly canonical: string;
  readonly aliases: readonly string[];
}

/** The stored base of the selected Site. */
export interface UnoCommittedBaseAccepted {
  readonly accepted: true;
  readonly site: UnoCommittedBaseSite;
  readonly base: UnoCommittedBaseValue;
}

/** The refused read: one closed literal and no partial answer. */
export type UnoCommittedBaseRefused = {
  readonly accepted: false;
  readonly reason: UnoCommittedBaseRefusal;
};

/** Anything this use case returns. */
export type UnoCommittedBaseResult = UnoCommittedBaseAccepted | UnoCommittedBaseRefused;

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileStructure extends Error {}

/** One bounded refusal, used for every early exit. */
function refuseResolution(reason: UnoCommittedBaseRefusal): UnoCommittedBaseRefused {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object (including `null` and an array) answers `null`; a non-plain prototype, any symbol key or any
 * accessor throws `HostileStructure`, so no getter is invoked while the request is being classified.
 */
function readPlainData(value: unknown): DataRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new HostileStructure();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileStructure();
  const copy = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileStructure();
    copy[key] = descriptor.value;
  }
  return copy;
}

/** Exactly the two declared keys, no more and no fewer. */
function hasExactlyKeys(record: DataRecord, keys: readonly string[]): boolean {
  const own = Object.keys(record);
  if (own.length !== keys.length) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
  }
  return true;
}

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted answer. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}


/**
 * Read the canonical base the committed declaration states for the selected Site.
 *
 * The request must be exactly `{manifest, selection}`. The selected-Site validator owns the manifest graph,
 * the selection, the optional language mapping and the optional base, so this use case only translates its
 * closed codes: a policy-refused base is `committed-base:invalid`, an unreadable declaration or base keeps the
 * unreadable meaning, and any other selection failure is `committed-base:selection-invalid`. An accepted
 * declaration that states no base is `committed-base:missing`, never a default.
 */
export function resolveUnoCommittedBase(input: unknown): UnoCommittedBaseResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuseResolution("committed-base:input-invalid");
    if (!hasExactlyKeys(request, UNO_COMMITTED_BASE_INPUT_KEYS)) {
      return refuseResolution("committed-base:input-invalid");
    }

    const manifest = request["manifest"];
    const selection = request["selection"];
    for (const value of [manifest, selection]) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return refuseResolution("committed-base:input-invalid");
      }
    }

    const validated = validateUnoSiteSelection(selection, manifest);
    if (!validated.accepted) {
      if (validated.reason === "config:invalid-base") return refuseResolution("committed-base:invalid");
      if (validated.reason === "config:unreadable") return refuseResolution("committed-base:unreadable");
      return refuseResolution("committed-base:selection-invalid");
    }

    const storedBase = validated.config.base;
    if (storedBase === undefined) return refuseResolution("committed-base:missing");

    return deepFreeze({
      accepted: true as const,
      site: {
        entityId: validated.config.entityId,
        facetId: validated.config.selectedSite.facetId,
        siteId: validated.config.selectedSite.siteId,
      },
      base: {
        canonical: storedBase.canonical,
        aliases: [...storedBase.aliases],
      },
    });
  } catch (error) {
    if (error instanceof HostileStructure) return refuseResolution("committed-base:input-invalid");
    return refuseResolution("committed-base:unreadable");
  }
}
