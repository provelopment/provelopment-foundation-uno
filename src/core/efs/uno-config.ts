/**
 * Foundation Uno — the closed selected-Site declaration validator (U02, `UNO-WO-018 / R01`).
 *
 * WHAT THIS IS. A validator for one *declaration* file, `deployment/uno.config.json`, that names the
 * single future publication target of the one authored Entity. `selectedSite` means a designated
 * target only. It is **not** a route, a build instruction, a host binding, a Vercel setting, a
 * metadata alternate or permission to publish anything now.
 *
 * HOW THE SELECTION IS ESTABLISHED. The caller supplies both the declaration and the manifest as
 * data; this module never reads a file, an environment variable or a provider. The manifest is
 * validated by `validateUnoManifestGraph` first and any invalid manifest refuses before a Site is
 * considered. The named Facet and Site must then exist under the one validated Entity. There is no
 * fallback to the first element of any array, no default and no repair: an unlisted Site refuses.
 *
 * PURITY. Framework-free and dependency-free within Uno's own core: no `fs`, no `process`,
 * environment, clock, network, adapter, Next.js, React or Node built-in. Importing this module
 * executes nothing and, deliberately, no `src/app` file imports it.
 *
 * HOSTILE INPUT. Only own enumerable **data** properties are read; an accessor is refused without
 * ever being invoked, symbol properties and non-plain prototypes are refused, and a throwing Proxy
 * trap becomes a bounded refusal because the whole walk is guarded. Copies use null-prototype
 * records, nothing is mutated, and no diagnostic echoes an authored value.
 */

import { isContentSlug } from "../page-content";
import { isEntityId } from "./identity";
import { validateUnoManifestGraph } from "./manifest-graph";
import { localePolicyIssue } from "./uno-locales";

/** The only accepted declaration version. */
export const UNO_CONFIG_VERSION = 1;

/** The most short-language mappings one declaration may carry. A limit, not a default. */
export const UNO_SITE_LANGUAGE_PREFERENCE_LIMIT = 16;

/**
 * The closed refusal vocabulary. Every reason a caller can receive is one of these literals.
 *
 * `config:ambiguous-site` is the one deliberately added literal: the order requires ambiguity to
 * refuse, and reporting it as "not found" would misdescribe a manifest that declares the same Site
 * id under two Facets.
 */
export type UnoConfigRefusal =
  | "config:unreadable"
  | "config:invalid-shape"
  | "config:unknown-field"
  | "config:missing-field"
  | "config:version"
  | "config:invalid-entity"
  | "config:invalid-site"
  | "config:manifest-invalid"
  | "config:entity-mismatch"
  | "config:facet-not-found"
  | "config:site-not-found"
  | "config:ambiguous-site"
  | "config:invalid-language-preferences"
  | "config:locale-authority-missing";

/** The closed refusal vocabulary as data, for callers that must enumerate or document it. */
export const CONFIG_REFUSAL_REASONS: readonly UnoConfigRefusal[] = Object.freeze([
  "config:unreadable",
  "config:invalid-shape",
  "config:unknown-field",
  "config:missing-field",
  "config:version",
  "config:invalid-entity",
  "config:invalid-site",
  "config:manifest-invalid",
  "config:entity-mismatch",
  "config:facet-not-found",
  "config:site-not-found",
  "config:ambiguous-site",
  "config:invalid-language-preferences",
  "config:locale-authority-missing",
]);

/** One declared future publication target: an authored Facet id and an authored Site id. */
export interface UnoSelectedSite {
  readonly facetId: string;
  readonly siteId: string;
}

/** The validated declaration: a version, the one Entity and the one selected Site. */
export interface UnoSelectedSiteConfig {
  readonly version: typeof UNO_CONFIG_VERSION;
  readonly entityId: string;
  readonly selectedSite: UnoSelectedSite;
  /**
   * The optional explicit short-language mapping (`en` → `en-001`) this declaration carries.
   *
   * Absent means the declaration states no mapping at all — never an implicit one. When present it is
   * checked against the selected Site's declared locales, so a mapping without a Site locale authority
   * refuses instead of being guessed.
   */
  readonly languagePreferences?: Readonly<Record<string, string>>;
}

/** A tagged result: the validated declaration, or one closed reason and no partial selection. */
export type UnoConfigValidationResult =
  | { readonly accepted: true; readonly config: UnoSelectedSiteConfig }
  | { readonly accepted: false; readonly reason: UnoConfigRefusal };

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for input that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/** The bounded refusal. No partial selection, no echoed value, no stack. */
function refuse(reason: UnoConfigRefusal): UnoConfigValidationResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Read an untrusted value as a plain record of own enumerable data properties.
 *
 * A non-object (including `null` and an array) is reported as `null`. Hostile structure — a
 * non-plain prototype, any symbol property, or any accessor — throws `HostileInput`, which the
 * public entry point turns into `config:unreadable` without ever invoking a getter.
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

/** Exactly the declared fields, no more and no fewer. */
function shapeIssue(
  record: DataRecord,
  required: readonly string[],
  optional: readonly string[] = [],
): UnoConfigRefusal | null {
  for (const key of Object.keys(record)) {
    if (!required.includes(key) && !optional.includes(key)) return "config:unknown-field";
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return "config:missing-field";
  }
  return null;
}

/**
 * Read the optional short-language mapping as a fresh plain record of strings, or `null`.
 *
 * Keys and targets are judged by the accepted locale contract, not here; this only refuses hostile
 * structure (`config:unreadable` through `HostileInput`), a non-record, a non-string target and a
 * mapping beyond the declared bound. An empty record is an explicit, valid "no mapping".
 */
function readLanguagePreferences(value: unknown): Record<string, string> | null {
  const record = readOwnData(value);
  if (record === null) return null;
  const keys = Object.keys(record);
  if (keys.length > UNO_SITE_LANGUAGE_PREFERENCE_LIMIT) return null;
  const mapping = Object.create(null) as Record<string, string>;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileInput();
    if (typeof descriptor.value !== "string") return null;
    mapping[key] = descriptor.value;
  }
  return mapping;
}

/** Deep-freeze a freshly built structure so no caller can later rewrite accepted authority. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/**
 * Validate one selected-Site declaration against the authored manifest supplied by the caller.
 *
 * The result is a freshly copied, deeply frozen `{ version, entityId, selectedSite }`, or a single
 * closed refusal code. Nothing is defaulted: the declaration must name an existing Facet and an
 * existing Site under the one validated Entity, and that Site must be owned by exactly one Facet.
 */
export function validateUnoSiteSelection(
  input: unknown,
  manifest: unknown,
): UnoConfigValidationResult {
  try {
    return analyzeSelection(input, manifest);
  } catch {
    return refuse("config:unreadable");
  }
}

/** The guarded selection walk. Every failure returns before any selection is produced. */
function analyzeSelection(input: unknown, manifest: unknown): UnoConfigValidationResult {
  const root = readOwnData(input);
  if (root === null) return refuse("config:invalid-shape");

  const rootShape = shapeIssue(root, ["version", "entityId", "selectedSite"], ["languagePreferences"]);
  if (rootShape) return refuse(rootShape);

  const version = root.version;
  if (typeof version !== "number" || !Number.isInteger(version)) return refuse("config:version");
  if (version !== UNO_CONFIG_VERSION) return refuse("config:version");

  const entityId = root.entityId;
  if (!isEntityId(entityId)) return refuse("config:invalid-entity");

  const selectedSite = readOwnData(root.selectedSite);
  if (selectedSite === null) return refuse("config:invalid-shape");
  const siteShape = shapeIssue(selectedSite, ["facetId", "siteId"]);
  if (siteShape) return refuse(siteShape);

  const facetId = selectedSite.facetId;
  const siteId = selectedSite.siteId;
  if (!isContentSlug(facetId) || !isContentSlug(siteId)) return refuse("config:invalid-site");

  const validatedManifest = validateUnoManifestGraph(manifest);
  if (!validatedManifest.accepted) return refuse("config:manifest-invalid");

  const entity = validatedManifest.graph.entities[0];
  if (entity === undefined || entity.id !== entityId) return refuse("config:entity-mismatch");

  const facet = entity.facets.find((candidate) => candidate.id === facetId);
  if (facet === undefined) return refuse("config:facet-not-found");

  const declaredElsewhere = entity.facets.reduce(
    (total, candidate) => total + candidate.sites.filter((site) => site.id === siteId).length,
    0,
  );
  const owned = facet.sites.filter((candidate) => candidate.id === siteId);
  if (declaredElsewhere > 1) return refuse("config:ambiguous-site");
  if (owned.length !== 1) return refuse("config:site-not-found");

  // A mapping is optional, but never implicit: when the declaration states one, the selected Site must
  // own a declared locale authority for it to be checked against, and the accepted locale contract then
  // decides tag spelling, membership and the one approved short-English alias.
  let languagePreferences: Record<string, string> | null = null;
  if (Object.prototype.hasOwnProperty.call(root, "languagePreferences")) {
    languagePreferences = readLanguagePreferences(root.languagePreferences);
    if (languagePreferences === null) return refuse("config:invalid-language-preferences");

    const siteLocales = owned[0]?.locales;
    if (siteLocales === undefined) return refuse("config:locale-authority-missing");
    const policyIssue = localePolicyIssue({
      supportedLocales: [...siteLocales.supportedLocales],
      defaultLocale: siteLocales.defaultLocale,
      languagePreferences,
    });
    if (policyIssue !== null) return refuse("config:invalid-language-preferences");
  }

  const selected: {
    version: typeof UNO_CONFIG_VERSION;
    entityId: string;
    selectedSite: UnoSelectedSite;
    languagePreferences?: Record<string, string>;
  } = {
    version: UNO_CONFIG_VERSION,
    entityId,
    selectedSite: { facetId, siteId },
  };
  if (languagePreferences !== null) {
    const sorted = Object.create(null) as Record<string, string>;
    for (const key of Object.keys(languagePreferences).sort()) {
      sorted[key] = languagePreferences[key] as string;
    }
    selected.languagePreferences = sorted;
  }
  return Object.freeze({ accepted: true, config: deepFreeze(selected) });
}
