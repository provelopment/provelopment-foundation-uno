/**
 * Foundation Uno — the pure Site publication-inputs composition (`UNO-WO-024 / R01`, U03).
 *
 * WHAT THIS IS. One application-layer consistency check that composes inputs which are each already
 * validated elsewhere — the one-Entity EFS manifest graph, the explicit selected Site, a *proposed*
 * canonical base and an explicit full-locale policy — and proves that they agree: the same single Site
 * authors every locale the policy proposes to support, and it authors a reserved Home at the declared
 * default locale.
 *
 * WHAT THIS IS NOT. It reads no file, opens no socket, reads no clock, environment or provider, and it
 * creates no route, redirect, canonical URL, `hreflang`, sitemap entry or metadata. It grants no Page
 * publication, owns no host and migrates no configuration. The `base` and `localePolicy` it receives are
 * **proposed data** from a trusted future caller, not a committed configuration file and not an approval
 * of any live origin; a synthetic `http://localhost:3000` or `https://example.org` in a test is a fixture,
 * never a deployment decision. A `candidateCount` counts declared candidate addresses, never published
 * Pages.
 *
 * AUTHORITY. `validateUnoManifestGraph`, `validateUnoSiteSelection`, `validateUnoCanonicalBase`,
 * `localePolicyIssue` and `buildUnoCandidateRouteIndex` stay authoritative in their own domains; this
 * module calls them, re-validates none of their rules and weakens none of their contracts. It is a
 * compatibility use case, not a fourth configuration authority, and it does not supply the Site
 * locale-authority fields the manifest still lacks.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW / REWRITE concept**: the composition idea
 * is informed by, but never copied from, the pinned Foundation GEO-03 commit
 * `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`. No Foundation, Solo Rust, GEO-04, Connect, mark or asset is
 * imported, and no dependency or schema is added.
 */
import { validateUnoManifestGraph } from "../core/efs/manifest-graph";
import { validateUnoSiteSelection } from "../core/efs/uno-config";
import { validateUnoCanonicalBase } from "../core/efs/uno-canonical-base";
import { localePolicyIssue } from "../core/efs/uno-locales";
import { buildUnoCandidateRouteIndex } from "../core/efs/uno-route-address";
import { HOME_CONTENT_SLUG } from "../core/page-content";

/** The exact proposed inputs one future publication decision would consume. */
export interface UnoSitePublicationInputs {
  readonly manifest: unknown;
  readonly selection: unknown;
  readonly base: unknown;
  readonly localePolicy: unknown;
}

/**
 * The closed refusal vocabulary. One member per failure family, so a refusal can never echo an authored
 * value, a host, a path, a header, a body or an exception.
 */
export type UnoSitePublicationInputsRefusal =
  | "publication-inputs:input-not-plain"
  | "publication-inputs:input-shape"
  | "publication-inputs:unreadable"
  | "publication-inputs:manifest-invalid"
  | "publication-inputs:selection-invalid"
  | "publication-inputs:base-invalid"
  | "publication-inputs:locale-policy-invalid"
  | "publication-inputs:unsupported-representation"
  | "publication-inputs:unrepresented-supported-locale"
  | "publication-inputs:default-home-missing"
  | "publication-inputs:route-index-invalid";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_SITE_PUBLICATION_INPUT_REFUSALS: readonly UnoSitePublicationInputsRefusal[] = Object.freeze([
  "publication-inputs:input-not-plain",
  "publication-inputs:input-shape",
  "publication-inputs:unreadable",
  "publication-inputs:manifest-invalid",
  "publication-inputs:selection-invalid",
  "publication-inputs:base-invalid",
  "publication-inputs:locale-policy-invalid",
  "publication-inputs:unsupported-representation",
  "publication-inputs:unrepresented-supported-locale",
  "publication-inputs:default-home-missing",
  "publication-inputs:route-index-invalid",
] as const);

/** The exact keys the request may carry; anything else refuses rather than being ignored. */
export const UNO_SITE_PUBLICATION_INPUT_KEYS: readonly string[] = Object.freeze([
  "manifest",
  "selection",
  "base",
  "localePolicy",
]);

/** Declared bounds for the proposed locale policy. A limit, not a default: exceeding it refuses. */
export const UNO_SITE_PUBLICATION_INPUT_LIMITS = Object.freeze({
  supportedLocales: 32,
  languagePreferences: 16,
});

/** The one selected Site, its validated base and the policy that agrees with it. */
export interface UnoSitePublicationAccepted {
  readonly accepted: true;
  readonly site: { readonly entityId: string; readonly facetId: string; readonly siteId: string };
  readonly canonicalBase: { readonly origin: string; readonly pathPrefix: string };
  readonly aliases: readonly { readonly origin: string; readonly pathPrefix: string }[];
  readonly localePolicy: {
    readonly supportedLocales: readonly string[];
    readonly defaultLocale: string;
    readonly languagePreferences: Readonly<Record<string, string>>;
  };
  /** Declared candidate addresses of the selected Site — not a count of published Pages. */
  readonly candidateCount: number;
}

/** The refused composition: one closed code and no partial accepted data. */
export type UnoSitePublicationRefusal = {
  readonly accepted: false;
  readonly reason: UnoSitePublicationInputsRefusal;
};

/** Anything this composition returns. */
export type UnoSitePublicationResult = UnoSitePublicationAccepted | UnoSitePublicationRefusal;

/** Internal marker for hostile structure that must never be read. Never escapes this module. */
class HostileStructure extends Error {}

type DataRecord = Readonly<Record<string, unknown>>;

const POLICY_KEYS: readonly string[] = Object.freeze([
  "supportedLocales",
  "defaultLocale",
  "languagePreferences",
]);

function refuse(reason: UnoSitePublicationInputsRefusal): UnoSitePublicationRefusal {
  return Object.freeze({ accepted: false, reason });
}


/**
 * Read an untrusted value as a record of own enumerable **data** properties.
 *
 * A non-object, `null` and an array answer `null`; a non-plain prototype, a symbol key or any accessor
 * throws `HostileStructure` before a value is seen, so no getter runs and nothing is coerced.
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

/** One own data property, read by descriptor so an accessor is refused rather than invoked. */
function readOwnField(record: DataRecord, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) throw new HostileStructure();
  return descriptor.value;
}

/** True when the record carries exactly these keys, no more and no fewer. */
function hasExactKeys(record: DataRecord, expected: readonly string[]): boolean {
  const keys = Object.keys(record);
  if (keys.length !== expected.length) return false;
  return expected.every((key) => Object.prototype.hasOwnProperty.call(record, key));
}

/**
 * Read a dense own-data array of strings: a hole, an accessor, a symbol key, an exotic prototype or a
 * non-string entry refuses instead of being skipped or read.
 */
function readDenseStrings(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (Object.getPrototypeOf(value) !== Array.prototype) throw new HostileStructure();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileStructure();
  const items: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined) throw new HostileStructure();
    if (!("value" in descriptor)) throw new HostileStructure();
    if (typeof descriptor.value !== "string") return null;
    items.push(descriptor.value);
  }
  return items;
}

/** Read a plain own-data map of string to string; accessors, symbols and non-strings refuse. */
function readDenseMap(value: unknown): Record<string, string> | null {
  const record = readPlainData(value);
  if (record === null) return null;
  const pairs: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const key of Object.keys(record)) {
    const entry = readOwnField(record, key);
    if (typeof entry !== "string") return null;
    pairs[key] = entry;
  }
  return pairs;
}

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted composition. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}


/**
 * Read the proposed locale policy as a fresh plain-data value, or `null`.
 *
 * Every policy failure is one domain refusal: a missing or unknown member, a wrong kind, a count outside
 * the declared bounds, or any tag/mapping problem `localePolicyIssue` reports. Nothing is repaired, no
 * language is guessed from geography and no locale is enrolled implicitly. `null` also covers a non-object,
 * because a policy that is not a record cannot be a record of proposed locales.
 */
function readLocalePolicy(value: unknown): {
  supportedLocales: string[];
  defaultLocale: string;
  languagePreferences: Record<string, string>;
} | null {
  const record = readPlainData(value);
  if (record === null) return null;
  if (!hasExactKeys(record, POLICY_KEYS)) return null;

  const supported = readDenseStrings(readOwnField(record, "supportedLocales"));
  if (supported === null || supported.length === 0) return null;
  if (supported.length > UNO_SITE_PUBLICATION_INPUT_LIMITS.supportedLocales) return null;

  const defaultLocale = readOwnField(record, "defaultLocale");
  if (typeof defaultLocale !== "string") return null;

  const languagePreferences = readDenseMap(readOwnField(record, "languagePreferences"));
  if (languagePreferences === null) return null;
  if (
    Object.keys(languagePreferences).length > UNO_SITE_PUBLICATION_INPUT_LIMITS.languagePreferences
  ) {
    return null;
  }

  const policy = { supportedLocales: supported, defaultLocale, languagePreferences };
  // The authored policy contract stays the only authority on tags, case, mappings and the `en` alias.
  if (localePolicyIssue(policy) !== null) return null;
  return policy;
}


/**
 * Compose the proposed publication inputs and prove that they agree.
 *
 * Returns a freshly allocated, deeply frozen `{accepted: true, site, canonicalBase, aliases,
 * localePolicy, candidateCount}` when the one selected Site authors exactly the proposed locales and a
 * reserved Home at the declared default; otherwise one closed `{accepted: false, reason}`. No file, network,
 * clock, environment or provider is touched, the caller's value is never mutated, no getter is invoked and
 * no rejected value is echoed back.
 */
export function validateUnoSitePublicationInputs(input: unknown): UnoSitePublicationResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuse("publication-inputs:input-not-plain");
    if (!hasExactKeys(request, UNO_SITE_PUBLICATION_INPUT_KEYS)) {
      return refuse("publication-inputs:input-shape");
    }

    const manifest = readOwnField(request, "manifest");
    const selection = readOwnField(request, "selection");
    const base = readOwnField(request, "base");
    const localePolicy = readOwnField(request, "localePolicy");
    for (const value of [manifest, selection, base, localePolicy]) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return refuse("publication-inputs:input-shape");
      }
    }

    const graph = validateUnoManifestGraph(manifest);
    if (!graph.accepted) {
      return refuse(
        graph.reason === "input:unreadable"
          ? "publication-inputs:unreadable"
          : "publication-inputs:manifest-invalid",
      );
    }

    const selected = validateUnoSiteSelection(selection, manifest);
    if (!selected.accepted) {
      return refuse(
        selected.reason === "config:unreadable"
          ? "publication-inputs:unreadable"
          : "publication-inputs:selection-invalid",
      );
    }

    const canonical = validateUnoCanonicalBase(base);
    if (!canonical.accepted) {
      return refuse(
        canonical.reason === "base:unreadable"
          ? "publication-inputs:unreadable"
          : "publication-inputs:base-invalid",
      );
    }

    const policy = readLocalePolicy(localePolicy);
    if (policy === null) return refuse("publication-inputs:locale-policy-invalid");

    const index = buildUnoCandidateRouteIndex(manifest, selection);
    if (!index.accepted) {
      return refuse(
        index.reason === "route:unreadable"
          ? "publication-inputs:unreadable"
          : "publication-inputs:route-index-invalid",
      );
    }

    const entity = graph.graph.entities[0];
    const facetId = selected.config.selectedSite.facetId;
    const siteId = selected.config.selectedSite.siteId;
    if (entity === undefined || entity.id !== selected.config.entityId) {
      return refuse("publication-inputs:selection-invalid");
    }

    const supported = [...policy.supportedLocales].sort();
    const supportedSet = new Set(supported);
    const authored = new Set<string>();
    for (const candidate of index.candidates) authored.add(candidate.localeTag);

    // Both directions matter: an authored locale no policy mentions, and a promised locale nobody authors.
    for (const locale of authored) {
      if (!supportedSet.has(locale)) return refuse("publication-inputs:unsupported-representation");
    }
    for (const locale of supported) {
      if (!authored.has(locale)) {
        return refuse("publication-inputs:unrepresented-supported-locale");
      }
    }

    const defaultHome = index.candidates.some(
      (candidate) =>
        candidate.pageId === HOME_CONTENT_SLUG &&
        candidate.routePath === "" &&
        candidate.localeTag === policy.defaultLocale,
    );
    if (!defaultHome) return refuse("publication-inputs:default-home-missing");

    const languagePreferences = Object.create(null) as Record<string, string>;
    for (const key of Object.keys(policy.languagePreferences).sort()) {
      languagePreferences[key] = policy.languagePreferences[key] as string;
    }

    return deepFreeze({
      accepted: true as const,
      site: { entityId: selected.config.entityId, facetId, siteId },
      canonicalBase: { origin: canonical.canonical.origin, pathPrefix: canonical.canonical.pathPrefix },
      aliases: canonical.aliases.map((alias) => ({ origin: alias.origin, pathPrefix: alias.pathPrefix })),
      localePolicy: {
        supportedLocales: supported,
        defaultLocale: policy.defaultLocale,
        languagePreferences,
      },
      candidateCount: index.candidates.length,
    });
  } catch (error) {
    if (error instanceof HostileStructure) return refuse("publication-inputs:input-not-plain");
    return refuse("publication-inputs:unreadable");
  }
}
