/**
 * Foundation Uno — the pure discoverability-intent policy (`UNO-WO-022 / R01`, U03).
 *
 * WHAT THIS IS. One pure classifier that answers a narrower question than "may this Page be served": given
 * an already-validated Page header — its `kind`, its **authoring** route and its decided `visibility` — it
 * states what the Page would be **eligible for if an Owner later authorized publication**. It exists so a
 * future publication pipeline has one reviewed statement of intent instead of re-deriving SEO behaviour at
 * each call site.
 *
 * WHAT THIS IS NOT. It is not a publication authorization, a routing decision, a renderer, a metadata
 * endpoint, a sitemap generator or a robots writer. A `public` result does **not** publish anything, does
 * not create a route, does not emit a canonical link or `hreflang`, does not add a sitemap entry, does not
 * enable an automatic locale redirect and does not assert that a Page is already indexed. An `unlisted`
 * result is **not** access control — it only records the intent to withhold navigation, sitemap and
 * language-alternate signals from a Page that a future order might still serve.
 *
 * AUTHORITY. `decideSelectedPageVisibility` remains the sole authority for the `public | unlisted`
 * vocabulary and for the reserved Home rule; this module calls it and never restates it. Nothing here reads
 * a manifest, a JSON property, a file, an adapter, a provider or a request, and this classifier is not
 * imported by any `src/app` source in this order.
 *
 * PROVENANCE. Original **Uno-owned** code, class **NEW / REWRITE concept**: no upstream code, fixture,
 * schema or prose is copied. The historical Foundation GEO-03 reference `c05c55ea…` is read-only provenance
 * for the *concept* of visibility-conditional discoverability, never an import or a write permission.
 */
import { isPageRoutePath } from "../page-route-path";
import {
  decideSelectedPageVisibility,
  type PageSourceKind,
  type PageVisibility,
  type PageVisibilityRefusal,
} from "../page-authoring-policy";

/** The closed `discovery:` literals owned by this module. */
export type UnoDiscoveryLocalRefusal =
  | "discovery:input-not-plain"
  | "discovery:input-shape"
  | "discovery:projection-mismatch"
  | "discovery:unreadable";

/**
 * The closed classifier refusal vocabulary: this module's own literals plus the exact reasons the existing
 * visibility policy already returns, so a policy refusal is never reworded here.
 */
export type UnoDiscoveryRefusal = UnoDiscoveryLocalRefusal | PageVisibilityRefusal;

/** The closed classifier vocabulary as frozen data. */
export const UNO_DISCOVERY_REFUSAL_REASONS: readonly UnoDiscoveryRefusal[] = Object.freeze([
  "discovery:input-not-plain",
  "discovery:input-shape",
  "discovery:projection-mismatch",
  "discovery:unreadable",
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

/** The exact keys `input` may carry. Anything else is refused, not ignored. */
export const UNO_DISCOVERY_INPUT_KEYS: readonly string[] = Object.freeze(["kind", "routePath", "visibility"]);

/** The six conditional surface flags. Every one is a *constraint for a later order*, never a live effect. */
export interface UnoPublishEligibility {
  readonly navigation: boolean;
  readonly sitemap: boolean;
  readonly hreflang: boolean;
  readonly xDefault: boolean;
  readonly languageSwitch: boolean;
  readonly automaticLocaleRedirectTarget: boolean;
}

/** One accepted classification. Deeply frozen, newly allocated, and free of any address or content. */
export interface UnoPageDiscoverability {
  readonly accepted: true;
  readonly visibility: PageVisibility;
  readonly eligibleIfPublished: UnoPublishEligibility;
  readonly robotsIfDirectlyServed: "noindex,nofollow" | null;
}

/** The classifier result: the bounded intent, or one closed literal and no partial data. */
export type UnoDiscoveryResult =
  | UnoPageDiscoverability
  | { readonly accepted: false; readonly reason: UnoDiscoveryRefusal };

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/** One bounded refusal. */
function refuseClassification(reason: UnoDiscoveryRefusal): UnoDiscoveryResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object answers `null`; a non-plain prototype, a symbol key or any accessor throws, so no getter is
 * ever invoked while the request is being classified.
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

/** The six conditional flags for one decided visibility: unconditional for `public`, withheld otherwise. */
function eligibilityFor(visibility: PageVisibility): UnoPublishEligibility {
  const eligible = visibility === "public";
  return Object.freeze({
    navigation: eligible,
    sitemap: eligible,
    hreflang: eligible,
    xDefault: eligible,
    languageSwitch: eligible,
    automaticLocaleRedirectTarget: eligible,
  });
}

/** Build one fresh, deeply frozen accepted result. */
function accept(visibility: PageVisibility): UnoPageDiscoverability {
  return Object.freeze({
    accepted: true,
    visibility,
    eligibleIfPublished: eligibilityFor(visibility),
    robotsIfDirectlyServed: visibility === "unlisted" ? "noindex,nofollow" : null,
  });
}

/**
 * Classify the discoverability intent of one already-validated Page header.
 *
 * The argument must be exactly plain own data `{ kind, routePath, visibility }`: `kind` is `json` or
 * `markdown`, `routePath` is the validated **authoring** route (`home` for the reserved Home, never a
 * candidate's empty route), and `visibility` is the value an already-validated header produced.
 *
 * JSON is delegated to `decideSelectedPageVisibility` with the declared visibility. Markdown is delegated
 * without one, because Markdown may never declare a visibility, and the supplied value must then agree with
 * the `public` the policy returns — a Markdown `unlisted` is a projection mismatch, refused rather than
 * silently reclassified. The reserved Home rule is decided by the policy, not by this module.
 */
export function classifyUnoPageDiscoverability(input: unknown): UnoDiscoveryResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuseClassification("discovery:input-not-plain");

    const keys = Object.keys(request).sort();
    const expectedKeys = [...UNO_DISCOVERY_INPUT_KEYS].sort();
    if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
      return refuseClassification("discovery:input-shape");
    }

    const kindField = readOwnField(request, "kind");
    const routeField = readOwnField(request, "routePath");
    const visibilityField = readOwnField(request, "visibility");
    if (!kindField.present || !routeField.present || !visibilityField.present) {
      return refuseClassification("discovery:input-shape");
    }

    const kind = kindField.value;
    if (kind !== "json" && kind !== "markdown") return refuseClassification("discovery:input-shape");

    const routePath = routeField.value;
    if (typeof routePath !== "string" || !isPageRoutePath(routePath)) {
      return refuseClassification("invalid-route-path");
    }

    const declaredVisibility = visibilityField.value;
    if (typeof declaredVisibility !== "string") return refuseClassification("discovery:input-shape");

    const sourceKind = kind as PageSourceKind;
    const decision =
      sourceKind === "json"
        ? decideSelectedPageVisibility({ source: "json", routePath, visibility: declaredVisibility })
        : decideSelectedPageVisibility({ source: "markdown", routePath });
    if (!decision.accepted) return refuseClassification(decision.reason);

    // The supplied visibility must be the one the policy actually decided. For JSON that is a tautology
    // unless the policy changes; for Markdown it is the real guard, because Markdown may never declare a
    // visibility and a Markdown `unlisted` is a projection mismatch rather than a reclassification.
    if (declaredVisibility !== decision.visibility) {
      return refuseClassification("discovery:projection-mismatch");
    }

    return accept(decision.visibility);
  } catch (error) {
    if (error instanceof HostileInput) return refuseClassification("discovery:input-not-plain");
    return refuseClassification("discovery:unreadable");
  }
}
