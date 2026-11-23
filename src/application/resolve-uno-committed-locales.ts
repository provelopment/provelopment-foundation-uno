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
import { validateUnoSiteAddressConfig, validateUnoSiteSelection } from "../core/efs/uno-config";
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
function resolveCommittedLocalesV1(input: unknown): UnoCommittedLocalesResult {
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

/** The three own-data keys a version-2, Site-qualified request may carry; nothing else is read. */
export const UNO_COMMITTED_LOCALES_INPUT_KEYS_V2: readonly string[] = Object.freeze([
  "manifest",
  "selection",
  "site",
] as const);

/** The exact pair that names one qualified Site. */
const COMMITTED_LOCALES_SITE_KEYS: readonly string[] = Object.freeze(["facetId", "siteId"] as const);

/** Read the qualified Site selector as a fresh pair of ids, or `null`; accessors and symbols throw. */
function readQualifiedSite(value: unknown): { facetId: string; siteId: string } | null {
  const record = readPlainData(value);
  if (record === null) return null;
  const keys = Object.keys(record);
  if (keys.length !== COMMITTED_LOCALES_SITE_KEYS.length) return null;
  for (const key of COMMITTED_LOCALES_SITE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return null;
  }
  const facetId = record["facetId"];
  const siteId = record["siteId"];
  if (typeof facetId !== "string" || facetId.length === 0) return null;
  if (typeof siteId !== "string" || siteId.length === 0) return null;
  return { facetId, siteId };
}

/**
 * Read the stored locale policy of one **explicitly named qualified Site** (`UNO-WO-086 / R01`, M11).
 *
 * The pair is resolved inside the validated v2 address declaration and then against the validated manifest graph, so
 * the locale authority is that Site's own `locales` declaration: no locale is collected from a sibling Site, no
 * default Site filters a publisher, and no other Site's Home can supply a missing locale.
 *
 * An installation-level v2 language mapping applies here only through the entries whose target is one of *this* Site's
 * declared locales. A sibling-targeted alias is not this Site's redirect and is dropped rather than inherited; an
 * absent mapping means no short aliases, never a guessed default.
 */
function resolveCommittedLocalesV2(request: DataRecord): UnoCommittedLocalesResult {
  const keys = Object.keys(request);
  if (keys.length !== UNO_COMMITTED_LOCALES_INPUT_KEYS_V2.length) {
    return refuse("committed-locales:input-invalid");
  }
  for (const key of UNO_COMMITTED_LOCALES_INPUT_KEYS_V2) {
    if (!Object.prototype.hasOwnProperty.call(request, key)) {
      return refuse("committed-locales:input-invalid");
    }
  }

  const manifest = request["manifest"];
  const selection = request["selection"];
  const siteRequest = request["site"];
  for (const value of [manifest, selection, siteRequest]) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return refuse("committed-locales:input-invalid");
    }
  }

  const requested = readQualifiedSite(siteRequest);
  if (requested === null) return refuse("committed-locales:input-invalid");

  const graph = validateUnoManifestGraph(manifest);
  if (!graph.accepted) {
    return refuse(
      graph.reason === "input:unreadable"
        ? "committed-locales:unreadable"
        : "committed-locales:manifest-invalid",
    );
  }

  const address = validateUnoSiteAddressConfig(selection, manifest);
  if (!address.accepted) {
    return refuse(
      address.reason === "config:unreadable"
        ? "committed-locales:unreadable"
        : "committed-locales:selection-invalid",
    );
  }

  const binding = address.config.sites.find(
    (candidate) =>
      candidate.facetId === requested.facetId && candidate.siteId === requested.siteId,
  );
  if (binding === undefined) return refuse("committed-locales:selection-invalid");

  const entity = graph.graph.entities[0];
  const facet = entity?.facets.find((candidate) => candidate.id === binding.facetId);
  const site = facet?.sites.find((candidate) => candidate.id === binding.siteId);
  if (entity === undefined || site === undefined) {
    return refuse("committed-locales:selection-invalid");
  }

  const siteLocales = site.locales;
  if (siteLocales === undefined) return refuse("committed-locales:site-locales-missing");

  const supportedLocales = [...siteLocales.supportedLocales].sort();
  const supportedSet = new Set(supportedLocales);

  // A mapping entry is this Site's only when its target is one of this Site's own declared locales.
  const languagePreferences = Object.create(null) as Record<string, string>;
  const declaredMapping = address.config.languagePreferences;
  if (declaredMapping !== undefined) {
    for (const key of Object.keys(declaredMapping).sort()) {
      const target = declaredMapping[key];
      if (typeof target === "string" && supportedSet.has(target)) {
        languagePreferences[key] = target;
      }
    }
  }

  // The accepted locale contract stays the only authority on tag spelling, membership, aliases and mapping bounds.
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
    site: { entityId: entity.id, facetId: binding.facetId, siteId: binding.siteId },
    localePolicy: {
      supportedLocales,
      defaultLocale: siteLocales.defaultLocale,
      languagePreferences,
    },
  });
}

/**
 * Read the stored locale policy of the publishing Site.
 *
 * Two request shapes are accepted, each with its own exact-key validation: the legacy `{manifest, selection}` v1
 * request, which still requires an explicit `languagePreferences` mapping, and the v2
 * `{manifest, selection, site}` request, whose `selection` is the multi-Site address declaration and whose Site is
 * named explicitly. A v1 request is never reinterpreted, and a v2 declaration is never read as a legacy selection.
 */
export function resolveUnoCommittedLocales(input: unknown): UnoCommittedLocalesResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuse("committed-locales:input-invalid");
    if (Object.prototype.hasOwnProperty.call(request, "site")) {
      return resolveCommittedLocalesV2(request);
    }
    return resolveCommittedLocalesV1(request);
  } catch (error) {
    if (error instanceof HostileStructure) return refuse("committed-locales:input-invalid");
    return refuse("committed-locales:unreadable");
  }
}
