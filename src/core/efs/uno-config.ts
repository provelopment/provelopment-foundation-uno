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
 * THE OPTIONAL DECLARED BASE. A declaration may also name a canonical base for its selected Site. That
 * value is *declared intent only*: it binds no host, configures no runtime, builds no `basePath` and
 * publishes nothing. Its URL, prefix, alias and overlap rules belong entirely to
 * `validateUnoCanonicalBase`, which this module delegates to and never restates; a base that policy
 * refuses becomes one closed `config:` code, and the rejected value is never returned or echoed.
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
import { canonicalBaseConflict, validateUnoCanonicalBase, type UnoCanonicalBase, type UnoCanonicalBaseResult } from "./uno-canonical-base";

/** The only accepted declaration version of the legacy single-Site form. */
export const UNO_CONFIG_VERSION = 1;

/**
 * The multi-Facet / multi-Site address declaration version (`UNO-WO-086 / R01`, checkpoint M1).
 *
 * This is a *superset* declaration, not a replacement: version 1 keeps its exact meaning and is still accepted, so a
 * legacy one-Site installation is untouched. Version 2 replaces the single `selectedSite` target with an explicit map
 * from every declared `{facetId, siteId}` to its own public address, so that every valid Site is independently active.
 * An optional `default` names the entry used to resolve an otherwise ambiguous request; it never deactivates a Site.
 */
export const UNO_SITE_ADDRESS_CONFIG_VERSION = 2;

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
  | "config:locale-authority-missing"
  | "config:invalid-base"
  | "config:invalid-site-address"
  | "config:duplicate-site-address"
  | "config:incomplete-site-bindings"
  | "config:invalid-default";

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
  "config:invalid-base",
  "config:invalid-site-address",
  "config:duplicate-site-address",
  "config:incomplete-site-bindings",
  "config:invalid-default",
]);

/** One declared future publication target: an authored Facet id and an authored Site id. */
export interface UnoSelectedSite {
  readonly facetId: string;
  readonly siteId: string;
}

/**
 * The optional canonical base a declaration may state for its selected Site.
 *
 * It is a *declaration*: one canonical absolute URL string plus explicit alias strings. Nothing here
 * binds a host, sets a runtime base path, redirects a request or authorises publication; the accepted
 * canonical-base contract owns every lexical and overlap rule, and this shape only carries its
 * validated result back in the caller's own single-string form.
 */
export interface UnoDeclaredBase {
  readonly canonical: string;
  readonly aliases: readonly string[];
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
  /**
   * The optional canonical base this declaration states for the selected Site.
   *
   * Absent means the declaration selects no base at all — never an implicit or inferred one, and never
   * an environment or host default. When present it is the accepted canonical-base policy's own
   * validated answer, re-expressed as one canonical string plus its aliases in validated order.
   */
  readonly base?: UnoDeclaredBase;
}

/**
 * One Site's declared public address: the exact pair that makes that Site independently active.
 *
 * `origin` is a validated absolute origin with no trailing slash; `pathPrefix` is the accepted policy's own prefix form
 * — `""` at the root, otherwise a leading `/` with no trailing slash — so two Sites may share one origin only when their
 * prefixes are disjoint. `aliases` are further addresses that resolve to this same Site and never to a second one.
 */
export interface UnoSiteAddressBinding {
  readonly facetId: string;
  readonly siteId: string;
  readonly origin: string;
  readonly pathPrefix: string;
  readonly aliases: readonly string[];
}

/**
 * The validated version-2 declaration: every Site's own address, plus an optional nonexclusive entry default.
 *
 * `selectedSite` is retained so the unchanged consumers keep one well-defined entry target — the declared `default`, or
 * the only binding when exactly one exists. It is never an exclusivity claim: `sites` is authoritative, and a default
 * must never be read as deactivating another Site.
 */
export interface UnoSiteAddressConfig {
  readonly version: typeof UNO_SITE_ADDRESS_CONFIG_VERSION;
  readonly entityId: string;
  readonly sites: readonly UnoSiteAddressBinding[];
  /**
   * The entry target, present **only** when the declaration authored `default` (`UNO-WO-092 / R01`).
   *
   * It used to be filled with `sites[0]` when no default was authored, which made declaration order decide which Site
   * looked like the publisher and let a language mapping be checked against an arbitrary Site. A default is a declared
   * entry choice, not an implication: with several Sites and no `default` this field is absent, every Site stays active,
   * and an ambiguous entry refuses instead of silently selecting index zero.
   */
  readonly selectedSite?: UnoSelectedSite;
  readonly defaultSite?: UnoSelectedSite;
  readonly languagePreferences?: Readonly<Record<string, string>>;
}

/** The refusal branch both declaration validators share: one closed reason and no partial value. */
export interface UnoConfigRefusalResult {
  readonly accepted: false;
  readonly reason: UnoConfigRefusal;
}

/** A tagged result: the validated legacy declaration, or one closed reason and no partial selection. */
export type UnoConfigValidationResult =
  | { readonly accepted: true; readonly config: UnoSelectedSiteConfig }
  | UnoConfigRefusalResult;

/** A tagged result: the validated multi-Site address declaration, or one closed reason and no partial authority. */
export type UnoSiteAddressValidationResult =
  | { readonly accepted: true; readonly config: UnoSiteAddressConfig }
  | UnoConfigRefusalResult;

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for input that must not be read at all; never escapes this module. */
class HostileInput extends Error {}

/** The bounded refusal. No partial selection, no echoed value, no stack. */
function refuse(reason: UnoConfigRefusal): UnoConfigRefusalResult {
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

/** Re-express one validated base as the single canonical string form the declaration carries. */
function declaredBaseString(base: UnoCanonicalBase): string {
  return `${base.origin}${base.pathPrefix}`;
}

/** One internal verdict for the optional base: absent, accepted, or one closed config refusal. */
type DeclaredBaseOutcome =
  | { readonly state: "accepted"; readonly base: UnoDeclaredBase }
  | { readonly state: "refused"; readonly reason: UnoConfigRefusal };

/**
 * Validate the optional declared base through the canonical-base policy and re-express its answer.
 *
 * Every URL, prefix, alias and overlap rule stays in `validateUnoCanonicalBase`; this function adds no
 * lexical rule of its own. A policy refusal is reported as `config:invalid-base`, except the policy's
 * own unreadable outcome, which keeps this module's existing `config:unreadable` meaning so a hostile
 * structure is not misreported as an authored mistake. Neither branch returns the rejected value.
 */
/**
 * The single call site of the accepted canonical-base policy in this module.
 *
 * Both the legacy `base` field and every version-2 Site address are validated only through this one delegation, so no
 * lexical URL, prefix, alias or overlap rule is ever restated here (`UNO-WO-090 / R01`, P3). The structured policy answer
 * is returned unchanged, because a version-2 binding needs the accepted `origin` and `pathPrefix` separately.
 */
function readValidatedBase(value: unknown): UnoCanonicalBaseResult {
  return validateUnoCanonicalBase(value);
}

function readDeclaredBase(value: unknown): DeclaredBaseOutcome {
  const validated = readValidatedBase(value);
  if (!validated.accepted) {
    if (validated.reason === "base:unreadable") {
      return { state: "refused", reason: "config:unreadable" };
    }
    return { state: "refused", reason: "config:invalid-base" };
  }

  return {
    state: "accepted",
    base: Object.freeze({
      canonical: declaredBaseString(validated.canonical),
      aliases: Object.freeze(validated.aliases.map(declaredBaseString)),
    }),
  };
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

/**
 * Validate the version-2 multi-Site address declaration (`UNO-WO-086 / R01`, checkpoint M1).
 *
 * This is a separate entry point by design. `validateUnoSiteSelection` keeps its exact version-1 contract and refusal
 * order, so an existing one-Site installation is never re-interpreted; a caller that needs every Site's own address asks
 * this function instead. A declaration that is not version 2 refuses with `config:version`, and a hostile structure
 * becomes `config:unreadable` without any accessor ever being invoked.
 */
export function validateUnoSiteAddressConfig(
  input: unknown,
  manifest: unknown,
): UnoSiteAddressValidationResult {
  try {
    const root = readOwnData(input);
    if (root === null) return refuse("config:invalid-shape");
    if (root["version"] !== UNO_SITE_ADDRESS_CONFIG_VERSION) return refuse("config:version");
    return analyzeAddressConfiguration(root, manifest);
  } catch {
    return refuse("config:unreadable");
  }
}

/**
 * Validate a version-2 multi-Site address declaration against the caller's manifest.
 *
 * Every URL, prefix and alias lexical rule is delegated to `validateUnoCanonicalBase`; this walk adds only what a
 * per-Site policy cannot see: no duplicated address, no origin shared by two Sites with the same prefix, no alias
 * pointing at a second Site, and complete coverage of the manifest's own Sites so no declared Site is silently
 * unreachable. Nothing is inferred: an unbound Site, an unnamed default for an ambiguous entry, or a Site that does not
 * exist under the named Facet all refuse rather than being guessed.
 */
function analyzeAddressConfiguration(input: DataRecord, manifest: unknown): UnoSiteAddressValidationResult {
  const shape = shapeIssue(input, ["version", "entityId", "sites"], ["default", "languagePreferences"]);
  if (shape) return refuse(shape);

  const entityId = input["entityId"];
  if (!isEntityId(entityId)) return refuse("config:invalid-entity");

  const sitesValue = input["sites"];
  if (!Array.isArray(sitesValue) || sitesValue.length === 0) return refuse("config:invalid-site-address");

  const validatedManifest = validateUnoManifestGraph(manifest);
  if (!validatedManifest.accepted) return refuse("config:manifest-invalid");
  const entity = validatedManifest.graph.entities[0];
  if (entity === undefined || entity.id !== entityId) return refuse("config:entity-mismatch");

  const bindings: UnoSiteAddressBinding[] = [];
  const prefixesByOrigin = new Map<string, string[]>();
  /**
   * One normalized ownership index across **every** canonical and alias address (`UNO-WO-092 / R01`, §4.A1).
   *
   * The earlier walk compared a new canonical only against older *canonicals* and a new alias only against older
   * canonicals and aliases, so `A.alias = B.canonical` escaped whenever A was declared first: declaration order decided
   * validity. One index refuses the exact collision in either order, still permits two Sites to share a host under
   * disjoint whole-segment prefixes, and stays fail-closed for cross-owner overlap.
   */
  const ownerOfAddress = new Map<string, string>();

  for (const rawEntry of sitesValue as readonly unknown[]) {
    const entry = readOwnData(rawEntry);
    if (entry === null) return refuse("config:invalid-site-address");
    const entryShape = shapeIssue(entry, ["facetId", "siteId", "origin"], ["pathPrefix", "aliases"]);
    if (entryShape) return refuse(entryShape);

    const facetId = entry["facetId"];
    const siteId = entry["siteId"];
    const origin = entry["origin"];
    if (!isContentSlug(facetId) || !isContentSlug(siteId)) return refuse("config:invalid-site-address");
    if (typeof origin !== "string") return refuse("config:invalid-site-address");

    const prefix = entry["pathPrefix"];
    if (prefix !== undefined) {
      // A declared prefix is an explicit routing segment, so it must be spelled as one: leading and trailing slash, no
      // query, fragment, backslash or traversal. The policy below still owns every URL rule; this only refuses a shape
      // it could never mean.
      if (typeof prefix !== "string" || !prefix.startsWith("/") || !prefix.endsWith("/")) {
        return refuse("config:invalid-site-address");
      }
      if (prefix.length > 1 && (prefix.slice(1, -1).length === 0 || /[\\?#]|(?:^|\/)\.\.?(?:\/|$)/u.test(prefix.slice(1, -1)))) {
        return refuse("config:invalid-site-address");
      }
    }
    const aliases = entry["aliases"];
    if (aliases !== undefined && !Array.isArray(aliases)) return refuse("config:invalid-site-address");

    // The declaration states host and prefix separately for clarity; the accepted canonical policy takes one URL, so the
    // two are joined exactly here and nowhere else, and the policy's own answer is the only form stored.
    const canonical = typeof prefix === "string" && prefix.length > 1 ? `${origin}${prefix.slice(0, -1)}` : origin;
    const validated = readValidatedBase({ canonical, aliases: aliases ?? [] });
    if (!validated.accepted) {
      return refuse(validated.reason === "base:unreadable" ? "config:unreadable" : "config:invalid-site-address");
    }

    const facet = entity.facets.find((candidate) => candidate.id === facetId);
    if (facet === undefined) return refuse("config:facet-not-found");
    // A version-2 binding is fully qualified by `facetId` + `siteId`, so the same Site id may legitimately exist under two
    // Facets. Only the pair itself must be unique, which the duplicate check below enforces.
    if (facet.sites.filter((candidate) => candidate.id === siteId).length !== 1) {
      return refuse("config:site-not-found");
    }
    if (bindings.some((bound) => bound.facetId === facetId && bound.siteId === siteId)) {
      return refuse("config:duplicate-site-address");
    }

    const owner = `${facetId}\u0000${siteId}`;
    const address = `${validated.canonical.origin}${validated.canonical.pathPrefix}`;
    if (ownerOfAddress.has(address)) return refuse("config:duplicate-site-address");
    ownerOfAddress.set(address, owner);

    const originPrefixes = prefixesByOrigin.get(validated.canonical.origin) ?? [];
    if (originPrefixes.includes(validated.canonical.pathPrefix)) return refuse("config:duplicate-site-address");
    originPrefixes.push(validated.canonical.pathPrefix);
    prefixesByOrigin.set(validated.canonical.origin, originPrefixes);

    // `UNO-WO-086 / R01` (M4): on one origin two Sites must not claim the *same* prefix — that is a duplicate, and no
    // request path could be assigned. A nested prefix is not a duplicate: the longer prefix owns its own subtree, which is
    // the "at most one longest matching unambiguous prefix" rule the address contract requires.
    for (const bound of bindings) {
      if (bound.origin !== validated.canonical.origin) continue;
      if (canonicalBaseConflict(bound, validated.canonical) === "duplicate") {
        return refuse("config:duplicate-site-address");
      }
    }

    const aliasStrings: string[] = [];
    for (const alias of validated.aliases) {
      const aliasString = `${alias.origin}${alias.pathPrefix}`;
      if (ownerOfAddress.has(aliasString)) return refuse("config:duplicate-site-address");
      ownerOfAddress.set(aliasString, owner);
      aliasStrings.push(aliasString);
    }

    bindings.push(Object.freeze({
      facetId,
      siteId,
      origin: validated.canonical.origin,
      pathPrefix: validated.canonical.pathPrefix,
      aliases: Object.freeze(aliasStrings),
    }));
  }

  // Fail closed on partial authority: a declared Site without its own address would otherwise be silently unreachable,
  // which is the opposite of "every valid configured Site is active".
  const boundSites = new Set(bindings.map((bound) => `${bound.facetId}/${bound.siteId}`));
  const unbound = entity.facets
    .flatMap((facet) => facet.sites.map((site) => `${facet.id}/${site.id}`))
    .find((site) => !boundSites.has(site));
  if (unbound !== undefined) return refuse("config:incomplete-site-bindings");

  let defaultSite: UnoSelectedSite | undefined;
  if (Object.prototype.hasOwnProperty.call(input, "default")) {
    const declaredDefault = readOwnData(input["default"]);
    if (declaredDefault === null) return refuse("config:invalid-default");
    if (shapeIssue(declaredDefault, ["facetId", "siteId"]) !== null) return refuse("config:invalid-default");
    const defaultFacetId = declaredDefault["facetId"];
    const defaultSiteId = declaredDefault["siteId"];
    if (!isContentSlug(defaultFacetId) || !isContentSlug(defaultSiteId)) return refuse("config:invalid-default");
    if (!bindings.some((bound) => bound.facetId === defaultFacetId && bound.siteId === defaultSiteId)) {
      return refuse("config:invalid-default");
    }
    defaultSite = Object.freeze({ facetId: defaultFacetId, siteId: defaultSiteId });
  }

  // `UNO-WO-092 / R01` (§4.A2): no implicit entry Site for a multi-Site declaration. `sites[0]` is never promoted to
  // `selectedSite`, so a no-default declaration validates identically under any `sites[]` permutation, keeps every Site
  // active, and an ambiguous entry refuses elsewhere rather than silently selecting index zero. A declaration with
  // exactly one binding is not ambiguous, so the single-Site version-2 case keeps its one well-defined entry target.
  const selectedSite: UnoSelectedSite | undefined =
    defaultSite ??
    (bindings.length === 1
      ? Object.freeze({ facetId: bindings[0]!.facetId, siteId: bindings[0]!.siteId })
      : undefined);

  let languagePreferences: Record<string, string> | null = null;
  if (Object.prototype.hasOwnProperty.call(input, "languagePreferences")) {
    languagePreferences = readLanguagePreferences(input["languagePreferences"]);
    if (languagePreferences === null) return refuse("config:invalid-language-preferences");

    // A mapping is installation-level, but each entry is applied only to the Sites that own its target locale. It is
    // therefore checked per Site against that Site's own projection: an alias can never be validated against a sibling
    // Site's locales, no per-Site preference or translation is synthesized, and a target no bound Site authors refuses.
    const coveredKeys = new Set<string>();
    let siteWithLocales = 0;
    for (const bound of bindings) {
      const boundFacet = entity.facets.find((facet) => facet.id === bound.facetId);
      const boundSite = boundFacet?.sites.find((site) => site.id === bound.siteId);
      const boundLocales = boundSite?.locales;
      if (boundLocales === undefined) continue;
      siteWithLocales += 1;

      const supported = [...boundLocales.supportedLocales];
      const owned = new Set(supported);
      const projection = Object.create(null) as Record<string, string>;
      for (const key of Object.keys(languagePreferences).sort()) {
        const target = languagePreferences[key] as string;
        if (!owned.has(target)) continue;
        projection[key] = target;
        coveredKeys.add(key);
      }
      const policyIssue = localePolicyIssue({
        supportedLocales: supported,
        defaultLocale: boundLocales.defaultLocale,
        languagePreferences: projection,
      });
      if (policyIssue !== null) return refuse("config:invalid-language-preferences");
    }
    if (siteWithLocales === 0) return refuse("config:locale-authority-missing");
    for (const key of Object.keys(languagePreferences)) {
      if (!coveredKeys.has(key)) return refuse("config:invalid-language-preferences");
    }
  }

  const config: {
    version: typeof UNO_SITE_ADDRESS_CONFIG_VERSION;
    entityId: string;
    sites: readonly UnoSiteAddressBinding[];
    selectedSite?: UnoSelectedSite;
    defaultSite?: UnoSelectedSite;
    languagePreferences?: Record<string, string>;
  } = {
    version: UNO_SITE_ADDRESS_CONFIG_VERSION,
    entityId,
    sites: Object.freeze(bindings),
  };
  if (selectedSite !== undefined) config.selectedSite = selectedSite;
  if (defaultSite !== undefined) config.defaultSite = defaultSite;
  if (languagePreferences !== null) {
    const sorted = Object.create(null) as Record<string, string>;
    for (const key of Object.keys(languagePreferences).sort()) {
      sorted[key] = languagePreferences[key] as string;
    }
    config.languagePreferences = sorted;
  }
  return Object.freeze({ accepted: true, config: deepFreeze(config) });
}

/** The guarded selection walk. Every failure returns before any selection is produced. */
function analyzeSelection(input: unknown, manifest: unknown): UnoConfigValidationResult {
  const root = readOwnData(input);
  if (root === null) return refuse("config:invalid-shape");

  const rootShape = shapeIssue(root, ["version", "entityId", "selectedSite"], ["languagePreferences", "base"]);
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
    base?: UnoDeclaredBase;
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

  // The base is optional but never inferred: when the declaration states one, the accepted canonical-base
  // policy decides it, and its validated answer is the only thing stored.
  if (Object.prototype.hasOwnProperty.call(root, "base")) {
    const declaredBase = readDeclaredBase(root.base);
    if (declaredBase.state === "refused") return refuse(declaredBase.reason);
    selected.base = declaredBase.base;
  }
  return Object.freeze({ accepted: true, config: deepFreeze(selected) });
}
