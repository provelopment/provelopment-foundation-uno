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

/** The only accepted declaration version. */
export const UNO_CONFIG_VERSION = 1;

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
  | "config:ambiguous-site";

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
function shapeIssue(record: DataRecord, required: readonly string[]): UnoConfigRefusal | null {
  for (const key of Object.keys(record)) {
    if (!required.includes(key)) return "config:unknown-field";
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return "config:missing-field";
  }
  return null;
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

  const rootShape = shapeIssue(root, ["version", "entityId", "selectedSite"]);
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

  const selected: UnoSelectedSiteConfig = {
    version: UNO_CONFIG_VERSION,
    entityId,
    selectedSite: { facetId, siteId },
  };
  return Object.freeze({ accepted: true, config: deepFreeze(selected) });
}
