/**
 * Foundation Uno — the committed Site-locale policy reader (`UNO-WO-025 / R01`, U03).
 *
 * WHAT THIS IS. One pure, read-only application composition that turns the two *stored* authorities —
 * a manifest Site declaring `locales` and a selected-Site declaration carrying `languagePreferences` —
 * into the single locale policy those files actually claim.
 *
 * WHAT THIS IS NOT. It opens no file, network, clock, environment or provider; it creates no route,
 * redirect, canonical URL, `hreflang`, sitemap entry or metadata; and it grants no publication. It does not
 * choose a production origin, re-implement source precedence or Site selection, or infer a mapping: a
 * missing stored authority refuses instead of being defaulted. Selecting a Site stays a declaration, not a
 * publication decision.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW / REWRITE concept**; the pinned read-only
 * Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains conceptual context only. No
 * Foundation, Solo, Connect code, media or brand is imported, and Apache-2.0 notices are unchanged.
 */
import { validateUnoManifestGraph } from "../core/efs/manifest-graph";
import { validateUnoSiteSelection } from "../core/efs/uno-config";
import { localePolicyIssue } from "../core/efs/uno-locales";

/** The closed refusal vocabulary: one member per failure family, never a caller's own value. */
export type UnoCommittedLocalesRefusal =
  | "committed-locales:input-invalid"
  | "committed-locales:unreadable"
  | "committed-locales:manifest-invalid"
  | "committed-locales:selection-invalid"
  | "committed-locales:site-locales-missing"
  | "committed-locales:mapping-missing"
  | "committed-locales:policy-invalid";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_COMMITTED_LOCALES_REFUSALS: readonly UnoCommittedLocalesRefusal[] = Object.freeze([
  "committed-locales:input-invalid",
  "committed-locales:unreadable",
  "committed-locales:manifest-invalid",
  "committed-locales:selection-invalid",
  "committed-locales:site-locales-missing",
  "committed-locales:mapping-missing",
  "committed-locales:policy-invalid",
] as const);

/** The two stored authorities this composition reads, and nothing else. */
export const UNO_COMMITTED_LOCALES_INPUT_KEYS: readonly string[] = Object.freeze(["manifest", "selection"]);

/** The accepted stored policy for the one selected Site. */
export interface UnoCommittedLocalesAccepted {
  readonly accepted: true;
  readonly site: { readonly entityId: string; readonly facetId: string; readonly siteId: string };
  readonly localePolicy: {
    readonly supportedLocales: readonly string[];
    readonly defaultLocale: string;
    readonly languagePreferences: Readonly<Record<string, string>>;
  };
}

/** The refused read: one closed code and no partial policy. */
export type UnoCommittedLocalesRefusalResult = {
  readonly accepted: false;
  readonly reason: UnoCommittedLocalesRefusal;
};

/** Anything this reader returns. */
export type UnoCommittedLocalesResult = UnoCommittedLocalesAccepted | UnoCommittedLocalesRefusalResult;

/** Internal marker for hostile structure that must never be read. Never escapes this module. */
class HostileStructure extends Error {}

type DataRecord = Readonly<Record<string, unknown>>;

function refuse(reason: UnoCommittedLocalesRefusal): UnoCommittedLocalesRefusalResult {
  return Object.freeze({ accepted: false, reason });
}

/** Read an untrusted value as own enumerable data properties; `null` when it is not a record. */
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

/** Deep-freeze a freshly built structure so no caller can rewrite an accepted policy. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/**
 * Read the stored locale policy of the one selected Site from the committed authorities.
 *
 * Returns a fresh, deeply frozen `{accepted: true, site, localePolicy}` only when the manifest declares a
 * valid Site `locales` policy *and* the selection states an explicit `languagePreferences` mapping (an empty
 * mapping is explicit and valid). The assembled policy is confirmed once more by `localePolicyIssue`, so the
 * accepted locale contract stays the only authority on tag spelling, membership and the approved alias.
 * Nothing is defaulted, inferred or echoed.
 */
export function resolveUnoCommittedLocales(input: unknown): UnoCommittedLocalesResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuse("committed-locales:input-invalid");
    const keys = Object.keys(request);
    if (keys.length !== UNO_COMMITTED_LOCALES_INPUT_KEYS.length) {
      return refuse("committed-locales:input-invalid");
    }
    for (const key of UNO_COMMITTED_LOCALES_INPUT_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(request, key)) {
        return refuse("committed-locales:input-invalid");
      }
    }

    const manifest = request.manifest;
    const selection = request.selection;
    for (const value of [manifest, selection]) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return refuse("committed-locales:input-invalid");
      }
    }

    const graph = validateUnoManifestGraph(manifest);
    if (!graph.accepted) {
      return refuse(
        graph.reason === "input:unreadable"
          ? "committed-locales:unreadable"
          : "committed-locales:manifest-invalid",
      );
    }

    const selected = validateUnoSiteSelection(selection, manifest);
    if (!selected.accepted) {
      // The selection validator owns declaration shape and Site ownership; its two locale-authority
      // refusals are reported here as the precise stored-authority failures they are.
      if (selected.reason === "config:unreadable") return refuse("committed-locales:unreadable");
      if (selected.reason === "config:locale-authority-missing") {
        return refuse("committed-locales:site-locales-missing");
      }
      if (selected.reason === "config:invalid-language-preferences") {
        return refuse("committed-locales:policy-invalid");
      }
      return refuse("committed-locales:selection-invalid");
    }

    // Only the validated, frozen graph is read, so no caller value reaches this walk unvalidated.
    const entity = graph.graph.entities[0];
    const facetId = selected.config.selectedSite.facetId;
    const siteId = selected.config.selectedSite.siteId;
    const facet = entity?.facets.find((candidate) => candidate.id === facetId);
    const site = facet?.sites.find((candidate) => candidate.id === siteId);
    if (entity === undefined || site === undefined) return refuse("committed-locales:selection-invalid");

    const siteLocales = site.locales;
    if (siteLocales === undefined) return refuse("committed-locales:site-locales-missing");
    const mapping = selected.config.languagePreferences;
    if (mapping === undefined) return refuse("committed-locales:mapping-missing");

    const supportedLocales = [...siteLocales.supportedLocales].sort();
    const languagePreferences = Object.create(null) as Record<string, string>;
    for (const key of Object.keys(mapping).sort()) {
      languagePreferences[key] = mapping[key] as string;
    }

    if (
      localePolicyIssue({
        supportedLocales,
        defaultLocale: siteLocales.defaultLocale,
        languagePreferences,
      }) !== null
    ) {
      return refuse("committed-locales:policy-invalid");
    }

    return deepFreeze({
      accepted: true as const,
      site: { entityId: entity.id, facetId, siteId },
      localePolicy: {
        supportedLocales,
        defaultLocale: siteLocales.defaultLocale,
        languagePreferences,
      },
    });
  } catch (error) {
    if (error instanceof HostileStructure) return refuse("committed-locales:input-invalid");
    return refuse("committed-locales:unreadable");
  }
}
