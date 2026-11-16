/**
 * Foundation Uno — the selected Page-header resolution use case (`UNO-WO-021 / R01`, U03).
 *
 * WHAT THIS IS. One pure application entry point that consumes the **already accepted, non-serving**
 * result of `loadUnoCandidateSource` — `{ accepted: true, candidate, kind, text }` — and returns the
 * bounded Page header produced by `projectUnoSelectedPageHeader`. It is the only place that translates a
 * matched candidate into the authoring identity the projector expects: the reserved Home candidate
 * `{ pageId: "home", routePath: "" }` becomes the authoring `routePath: "home"`, and every other Page
 * passes its validated relative route.
 *
 * WHAT IT IS NOT. It never reads a file, recomputes source precedence, creates a candidate, publishes a
 * Page, or imports `src/adapters/**` or any `node:` built-in. A `pathname` is never used as a publication
 * selector: the address must already have been resolved by the accepted loader, and this module
 * re-verifies that the candidate's own identity, locale spelling and route spelling agree before
 * projecting. A refused load stays refused and is never parsed.
 *
 * NONPUBLICATION. A successful result is a header only. It carries no URL, canonical, `hreflang`,
 * rendered HTML, sitemap entry, redirect, response, host, provider, secret or `published` flag, and it
 * does not mean the Page is routed or public. A JSON property such as `public: true` remains
 * non-authoritative.
 */
import { HOME_CONTENT_SLUG } from "../core/page-content";
import { isPageRoutePath } from "../core/page-route-path";
import { UNO_ROUTE_REFUSAL_REASONS, type UnoRouteRefusal } from "../core/efs/uno-route-address";
import {
  UNO_PAGE_HEADER_REFUSAL_REASONS,
  projectUnoSelectedPageHeader,
  type UnoPageHeaderRefusal,
  type UnoProjectedPageHeader,
} from "../core/efs/uno-page-header";
import type { PageSourceSelectionRefusal } from "../core/page-authoring-policy";

/**
 * The closed loader refusals this layer is willing to forward.
 *
 * The `route:*` and selection literals come from the accepted core contracts. The four `source:` literals
 * and the four local use-case literals are mirrored from the accepted loader vocabulary because an
 * application module may not import a concrete adapter; an unknown literal is refused rather than
 * forwarded, so a refusal can never be invented here.
 */
export const UNO_PAGE_HEADER_LOAD_REFUSAL_REASONS: readonly UnoCandidateSourceLoadRefusal[] = Object.freeze([
  ...UNO_ROUTE_REFUSAL_REASONS,
  "source:input-invalid",
  "source:root-invalid",
  "source:declarations-unreadable",
  "source:declarations-invalid",
  "invalid-input",
  "invalid-observer",
  "invalid-observation",
  "observer-failed",
  "invalid-json-source",
  "invalid-markdown-source",
  "no-valid-source",
  "unreadable-input",
]);

/** One forwarded loader refusal: an exact literal from the closed loader vocabulary. */
export type UnoCandidateSourceLoadRefusal =
  | UnoRouteRefusal
  | PageSourceSelectionRefusal
  | "source:input-invalid"
  | "source:root-invalid"
  | "source:declarations-unreadable"
  | "source:declarations-invalid"
  | "invalid-input"
  | "invalid-observer"
  | "invalid-observation"
  | "observer-failed";

/** The closed refusals this use case may answer. */
export type UnoPageHeaderApplicationRefusal =
  | "page-header:input-not-plain"
  | "page-header:input-shape"
  | "page-header:candidate-invalid"
  | "page-header:kind-inconsistent"
  | "page-header:home-inconsistent"
  | "page-header:route-invalid"
  | "page-header:load-refusal-unknown"
  | UnoCandidateSourceLoadRefusal
  | UnoPageHeaderRefusal;

/** The closed application vocabulary as data: use-case literals, loader literals, projector literals. */
export const UNO_PAGE_HEADER_APPLICATION_REFUSAL_REASONS: readonly string[] = Object.freeze([
  "page-header:input-not-plain",
  "page-header:input-shape",
  "page-header:candidate-invalid",
  "page-header:kind-inconsistent",
  "page-header:home-inconsistent",
  "page-header:route-invalid",
  "page-header:load-refusal-unknown",
  ...UNO_PAGE_HEADER_LOAD_REFUSAL_REASONS,
  ...UNO_PAGE_HEADER_REFUSAL_REASONS,
]);

/** The use case result: the bounded header, or one closed literal and no partial data. */
export type UnoPageHeaderApplicationResult =
  | ({ readonly accepted: true } & UnoProjectedPageHeader)
  | { readonly accepted: false; readonly reason: UnoPageHeaderApplicationRefusal };

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/** One bounded refusal, used for every early exit. */
function refuseResolution(reason: UnoPageHeaderApplicationRefusal): UnoPageHeaderApplicationResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object answers `null`; a non-plain prototype, a symbol key or any accessor throws, so no getter is
 * ever invoked while the loader result is being classified.
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

/** The candidate fields this layer depends on, as validated primitives. */
interface TrustedCandidate {
  readonly pageId: string;
  readonly localeTag: string;
  readonly localePathKey: string;
  readonly routePath: string;
  readonly pathname: string;
  readonly sourceKinds: readonly string[];
}

/**
 * Re-verify a loader candidate as data.
 *
 * Every field is re-read here rather than trusted by position, and the locale spelling, the route
 * spelling and the pathname must agree with each other. A candidate whose `pathname` does not follow from
 * its own locale key and route is refused, so no caller can smuggle an address into a header.
 */
function readCandidate(value: unknown): TrustedCandidate | null {
  const record = readPlainData(value);
  if (record === null) return null;

  const pageId = record["pageId"];
  const localeTag = record["localeTag"];
  const localePathKey = record["localePathKey"];
  const routePath = record["routePath"];
  const pathname = record["pathname"];
  const sources = record["sources"];

  if (
    typeof pageId !== "string" ||
    typeof localeTag !== "string" ||
    typeof localePathKey !== "string" ||
    typeof routePath !== "string" ||
    typeof pathname !== "string"
  ) {
    return null;
  }
  if (pageId.length === 0 || localeTag.length === 0 || localePathKey.length === 0) return null;
  if (localePathKey !== localeTag.toLowerCase()) return null;
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > 2) return null;

  const sourceKinds: string[] = [];
  for (const entry of sources) {
    const source = readPlainData(entry);
    if (source === null) return null;
    const kind = source["kind"];
    const path = source["path"];
    if (typeof kind !== "string" || typeof path !== "string") return null;
    sourceKinds.push(kind);
  }

  return Object.freeze({ pageId, localeTag, localePathKey, routePath, pathname, sourceKinds });
}

/** One forwarded loader refusal, or the closed "unknown literal" refusal. */
function forwardLoadRefusal(reason: unknown): UnoPageHeaderApplicationResult {
  if (typeof reason === "string" && UNO_PAGE_HEADER_LOAD_REFUSAL_REASONS.includes(reason as UnoCandidateSourceLoadRefusal)) {
    return refuseResolution(reason as UnoCandidateSourceLoadRefusal);
  }
  return refuseResolution("page-header:load-refusal-unknown");
}


/**
 * Resolve the bounded header of the Page an accepted loader result already identified.
 *
 * The input must be exactly the accepted, non-serving loader shape
 * `{ accepted: true, candidate, kind, text }`, or the loader's refused shape `{ accepted: false, reason }`.
 * A refusal is forwarded verbatim when its literal belongs to the closed loader vocabulary and is refused
 * as unknown otherwise; a refusal is never parsed, upgraded or turned into a header.
 *
 * The reserved Home candidate `{ pageId: "home", routePath: "" }` is mapped to the authoring
 * `routePath: "home"`. Any other Page must carry a validated nonempty relative route, and the pair
 * `home`/empty must agree, so an inconsistent candidate can never borrow the Home rule.
 */
export function resolveUnoPageHeader(input: unknown): UnoPageHeaderApplicationResult {
  try {
    const result = readPlainData(input);
    if (result === null) return refuseResolution("page-header:input-not-plain");

    const keys = Object.keys(result);
    const acceptedField = result["accepted"];

    if (acceptedField === false) {
      if (keys.length !== 2 || !keys.includes("reason")) return refuseResolution("page-header:input-shape");
      return forwardLoadRefusal(result["reason"]);
    }
    if (acceptedField !== true) return refuseResolution("page-header:input-shape");
    if (keys.length !== 4 || !keys.includes("candidate") || !keys.includes("kind") || !keys.includes("text")) {
      return refuseResolution("page-header:input-shape");
    }

    const candidate = readCandidate(result["candidate"]);
    if (candidate === null) return refuseResolution("page-header:candidate-invalid");

    const kind = result["kind"];
    if (kind !== "json" && kind !== "markdown") return refuseResolution("page-header:kind-inconsistent");
    if (!candidate.sourceKinds.includes(kind)) return refuseResolution("page-header:kind-inconsistent");

    const text = result["text"];
    if (typeof text !== "string") return refuseResolution("page-header:input-shape");

    const isHome = candidate.pageId === HOME_CONTENT_SLUG;
    if (isHome !== (candidate.routePath === "")) return refuseResolution("page-header:home-inconsistent");

    let authoringRoutePath: string;
    if (isHome) {
      if (candidate.pathname !== `/${candidate.localePathKey}`) {
        return refuseResolution("page-header:candidate-invalid");
      }
      authoringRoutePath = HOME_CONTENT_SLUG;
    } else {
      if (candidate.routePath === HOME_CONTENT_SLUG) return refuseResolution("page-header:home-inconsistent");
      if (!isPageRoutePath(candidate.routePath)) return refuseResolution("page-header:route-invalid");
      if (candidate.pathname !== `/${candidate.localePathKey}/${candidate.routePath}`) {
        return refuseResolution("page-header:candidate-invalid");
      }
      authoringRoutePath = candidate.routePath;
    }

    return projectUnoSelectedPageHeader({ kind, text, routePath: authoringRoutePath });
  } catch {
    return refuseResolution("page-header:input-not-plain");
  }
}
