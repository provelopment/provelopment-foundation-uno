/**
 * Foundation Uno — the pure canonical-base and alias validator (`UNO-WO-023 / R01`, U03).
 *
 * WHAT THIS IS. One fail-closed validator for a *proposed* Owner-declared canonical HTTP(S) base: a
 * canonical origin with an optional path prefix, plus at most eight explicit alternative bases. It answers
 * only "is this a well-formed, unambiguous, lexically safe declaration?" so a **future** order can integrate
 * a `base` value into the single-Site configuration without re-deriving URL rules at each call site.
 *
 * WHAT THIS IS NOT. It reads and writes nothing. It does not read or migrate `deployment/uno.config.json`,
 * select a Site or an Entity, choose a real production domain, publish a Page, interpret a locale header,
 * issue a redirect, create a route, emit a canonical tag, sitemap entry or `hreflang`, resolve DNS, verify
 * TLS or claim that any origin is owned by Uno. Every hostname in these tests is synthetic data. Validation
 * is **not** publication, and an alias is a note for a later Owner-authorized redirect order — not a
 * redirect, not a domain claim and not an ownership assertion.
 *
 * AUTHORITY. `validateUnoSiteSelection`, the manifest graph, the locale candidate matcher, the Page-header
 * projector and the discoverability classifier remain untouched and authoritative in their own scopes; this
 * module adds one independent building block and changes none of them.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW / ABSTRACT DESIGN**: no upstream code or
 * fixture was copied. Historical Foundation GEO-03 commit `c05c55ea…` is read-only design context for the
 * *concept* of an absolute base, never an import or a write permission. No dependency, asset or schema is
 * added.
 */
import { isContentSlug } from "../page-content";

/** The closed refusal vocabulary. One member per failure family; never widened at a call site. */
export type UnoCanonicalBaseRefusalCode =
  | "base:input-not-plain"
  | "base:input-shape"
  | "base:unreadable"
  | "base:canonical-url"
  | "base:alias-url"
  | "base:alias-count"
  | "base:alias-duplicate"
  | "base:alias-overlap";

/** The same vocabulary as frozen data, so a caller can assert membership without duplicating literals. */
export const UNO_CANONICAL_BASE_REFUSAL_CODES: readonly UnoCanonicalBaseRefusalCode[] = Object.freeze([
  "base:input-not-plain",
  "base:input-shape",
  "base:unreadable",
  "base:canonical-url",
  "base:alias-url",
  "base:alias-count",
  "base:alias-duplicate",
  "base:alias-overlap",
] as const);

/** The exact keys the request may carry. Anything else refuses; nothing extra is ignored. */
export const UNO_CANONICAL_BASE_INPUT_KEYS: readonly string[] = Object.freeze(["canonical", "aliases"]);

/** Limits, exported so tests and a later integrator share one authority. */
export const UNO_CANONICAL_BASE_LIMITS = Object.freeze({
  /** One URL, in ASCII bytes. */
  maxUrlBytes: 255,
  /** Explicit alternatives per declaration. */
  maxAliases: 8,
  /** One DNS label. */
  maxLabelLength: 63,
  /** A whole dotted host. */
  maxHostLength: 253,
  /** Path-prefix segments. */
  maxPrefixSegments: 8,
  /** A whole path prefix, including its leading slash. */
  maxPrefixLength: 160,
});

/** One validated base: an origin plus a prefix that is `""` at the root. */
export interface UnoCanonicalBase {
  readonly origin: string;
  readonly pathPrefix: string;
}

/** The accepted declaration. Deeply frozen, freshly allocated, and free of any caller text beyond the URL. */
export interface UnoValidatedCanonicalBase {
  readonly accepted: true;
  readonly canonical: UnoCanonicalBase;
  readonly aliases: readonly UnoCanonicalBase[];
}

/** The refused declaration: one closed code and no partial accepted data. */
export type UnoCanonicalBaseRefusal = {
  readonly accepted: false;
  readonly reason: UnoCanonicalBaseRefusalCode;
};

/** Anything this validator returns. */
export type UnoCanonicalBaseResult = UnoValidatedCanonicalBase | UnoCanonicalBaseRefusal;

/** Internal marker for hostile structure that must never be read. Never escapes this module. */
class HostileStructure extends Error {}

type DataRecord = Readonly<Record<string, unknown>>;

const LOOPBACK_HTTP_HOSTS: readonly string[] = Object.freeze(["localhost", "127.0.0.1", "[::1]"]);

const LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function refuse(reason: UnoCanonicalBaseRefusalCode): UnoCanonicalBaseRefusal {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Read an untrusted value as a record of own enumerable **data** properties.
 *
 * Non-objects answer `null`. A non-plain prototype, a symbol key or any accessor throws `HostileStructure`
 * before a value is seen, so no getter runs and no coercion happens.
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
function readOwnField(record: DataRecord, key: string): { readonly present: boolean; readonly value: unknown } {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined) return { present: false, value: undefined };
  if (!("value" in descriptor)) throw new HostileStructure();
  return { present: true, value: descriptor.value };
}

/**
 * Read a dense own-data array of strings without invoking an accessor or trusting `Array.isArray` alone.
 * A hole, an accessor, a symbol key, an exotic prototype or a non-string entry all refuse.
 */
function readDenseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (Object.getPrototypeOf(value) !== Array.prototype) throw new HostileStructure();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileStructure();
  const length = value.length as number;
  const items: string[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined) throw new HostileStructure();
    if (!("value" in descriptor)) throw new HostileStructure();
    if (typeof descriptor.value !== "string") return null;
    items.push(descriptor.value);
  }
  for (const key of Object.keys(value)) {
    if (key !== "length" && !/^(?:0|[1-9][0-9]*)$/.test(key)) throw new HostileStructure();
  }
  return items;
}

/** True when every byte is printable, non-space ASCII: no controls, no NUL, no whitespace, no Unicode. */
function isPrintableAscii(value: string): boolean {
  if (value.length === 0 || value.length > UNO_CANONICAL_BASE_LIMITS.maxUrlBytes) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x21 || code > 0x7e) return false;
  }
  return true;
}

/** Lexical screening that runs before the platform parser sees anything. */
function screenLexically(value: string): boolean {
  if (!isPrintableAscii(value)) return false;
  for (const forbidden of ["\\", "@", "%", "?", "#"]) {
    if (value.includes(forbidden)) return false;
  }
  return value.startsWith("https://") || value.startsWith("http://");
}

/** One dotted lowercase hostname: 2..255 labels, each 1..63 `[a-z0-9-]`, no edges, not all-numeric. */
function isDnsHostname(host: string): boolean {
  if (host.length === 0 || host.length > UNO_CANONICAL_BASE_LIMITS.maxHostLength) return false;
  const labels = host.split(".");
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length === 0 || label.length > UNO_CANONICAL_BASE_LIMITS.maxLabelLength) return false;
    if (!LABEL_PATTERN.test(label)) return false;
  }
  // An all-numeric final label is an IPv4 literal, not a DNS name; other literals never reach here.
  return !/^[0-9]+$/.test(labels[labels.length - 1] as string);
}

/** A path prefix of 1..8 lowercase content-slug segments, or `""` for the root. */
function readPathPrefix(prefix: string): string | null {
  if (prefix === "") return "";
  if (prefix.length > UNO_CANONICAL_BASE_LIMITS.maxPrefixLength) return null;
  if (!prefix.startsWith("/") || prefix.endsWith("/")) return null;
  const segments = prefix.slice(1).split("/");
  if (segments.length > UNO_CANONICAL_BASE_LIMITS.maxPrefixSegments) return null;
  for (const segment of segments) {
    if (!isContentSlug(segment)) return null;
    if (segment.startsWith("_")) return null;
  }
  return prefix;
}

/**
 * Parse one screened base string into `{origin, pathPrefix}`, or `null`.
 *
 * The platform parser is consulted **after** lexical and structural screening, and only to confirm that it
 * would not change the accepted spelling. The single permitted parser change is a bare-origin root gaining
 * `pathname === "/"`, which is read as `pathPrefix: ""` and never as an authored trailing slash.
 */
function parseBase(value: string): UnoCanonicalBase | null {
  if (!screenLexically(value)) return null;

  const scheme = value.startsWith("https://") ? "https" : "http";
  const afterScheme = value.slice(scheme.length + 3);
  if (afterScheme.includes("//")) return null;

  const slash = afterScheme.indexOf("/");
  const authority = slash === -1 ? afterScheme : afterScheme.slice(0, slash);
  const rawPrefix = slash === -1 ? "" : afterScheme.slice(slash);
  if (authority.length === 0) return null;
  if (rawPrefix !== "" && rawPrefix.endsWith("/")) return null;

  let host = authority;
  let explicitPort: string | null = null;
  const bracketEnd = authority.startsWith("[") ? authority.indexOf("]") : -1;
  if (bracketEnd !== -1) {
    host = authority.slice(0, bracketEnd + 1);
    const rest = authority.slice(bracketEnd + 1);
    if (rest !== "") {
      if (!rest.startsWith(":")) return null;
      explicitPort = rest.slice(1);
    }
  } else if (authority.includes(":")) {
    const parts = authority.split(":");
    if (parts.length !== 2) return null;
    host = parts[0] as string;
    explicitPort = parts[1] as string;
  }

  if (explicitPort !== null) {
    if (!/^[1-9][0-9]{0,4}$/.test(explicitPort)) return null;
    if (Number(explicitPort) > 65535) return null;
    // A deployed HTTPS origin must use the standard port implicitly: an explicit port is redundant or
    // nonstandard, and an explicit `:443`/`:80` is exactly the spelling drift this contract refuses.
    if (scheme === "https") return null;
  }

  if (scheme === "https") {
    if (!isDnsHostname(host)) return null;
  } else if (!LOOPBACK_HTTP_HOSTS.includes(host)) {
    // Plain HTTP is permitted only for the exact loopback hosts, optionally with an explicit port.
    return null;
  }

  const pathPrefix = readPathPrefix(rawPrefix);
  if (pathPrefix === null) return null;

  const origin = `${scheme}://${host}${explicitPort === null ? "" : `:${explicitPort}`}`;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  const expectedPathname = pathPrefix === "" ? "/" : pathPrefix;
  const unchanged =
    parsed.protocol === `${scheme}:` &&
    parsed.username === "" &&
    parsed.password === "" &&
    parsed.search === "" &&
    parsed.hash === "" &&
    parsed.host === authority &&
    parsed.hostname === host &&
    parsed.pathname === expectedPathname &&
    parsed.origin === origin &&
    parsed.href === `${origin}${expectedPathname}`;
  if (!unchanged) return null;

  return Object.freeze({ origin, pathPrefix });
}

/** Whole-segment ancestry: the root is an ancestor of everything; `a` is an ancestor of `a/b`. */
function isAncestorPrefix(ancestor: string, descendant: string): boolean {
  if (ancestor === descendant) return false;
  if (ancestor === "") return true;
  return descendant.startsWith(`${ancestor}/`);
}

/**
 * Report the first conflict between two accepted bases, under the rule their aliases already obey: on one origin, the
 * same prefix twice is a duplicate and a whole-segment prefix of another is an overlap; two different origins never
 * conflict, so unrelated Facet domains are untouched.
 *
 * Exported for the cross-Site address authority (`UNO-WO-086 / R01`, M4). Two Sites bound to one origin must have
 * disjoint whole-segment prefixes, otherwise no request path could be assigned to exactly one Site. This adds no lexical
 * rule of its own: it reuses the conflict test the alias walk already applies.
 */
export function canonicalBaseConflict(
  first: UnoCanonicalBase,
  second: UnoCanonicalBase,
): "duplicate" | "overlap" | null {
  if (first.origin !== second.origin) return null;
  if (first.pathPrefix === second.pathPrefix) return "duplicate";
  // `""` is the origin root, so it contains every other prefix; otherwise containment is whole-segment only, which is
  // what keeps `/docs` and `/docsy` unrelated.
  const contains = (outer: string, inner: string): boolean =>
    outer === "" || inner === outer || inner.startsWith(`${outer}/`);
  if (contains(first.pathPrefix, second.pathPrefix)) return "overlap";
  if (contains(second.pathPrefix, first.pathPrefix)) return "overlap";
  return null;
}

/** Two bases conflict only on one origin: the same prefix twice, or a whole-segment overlap. */
function classifyPair(
  first: UnoCanonicalBase,
  second: UnoCanonicalBase,
): "duplicate" | "overlap" | null {
  if (first.origin !== second.origin) return null;
  if (first.pathPrefix === second.pathPrefix) return "duplicate";
  if (isAncestorPrefix(first.pathPrefix, second.pathPrefix)) return "overlap";
  if (isAncestorPrefix(second.pathPrefix, first.pathPrefix)) return "overlap";
  return null;
}

/**
 * Validate one proposed canonical base and its explicit aliases.
 *
 * Returns a freshly allocated, deeply frozen `{accepted: true, canonical, aliases}` on success, or a single
 * closed `{accepted: false, reason}`. The caller's value is never mutated, no getter is invoked, no exception
 * escapes, and no rejected URL, host, path or stack is echoed back.
 */
export function validateUnoCanonicalBase(input: unknown): UnoCanonicalBaseResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuse("base:input-not-plain");

    const keys = Object.keys(request).sort();
    const expectedKeys = [...UNO_CANONICAL_BASE_INPUT_KEYS].sort();
    if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
      return refuse("base:input-shape");
    }

    const canonicalField = readOwnField(request, "canonical");
    const aliasesField = readOwnField(request, "aliases");
    if (!canonicalField.present || !aliasesField.present) return refuse("base:input-shape");
    if (typeof canonicalField.value !== "string") return refuse("base:input-shape");

    const aliasValues = readDenseStringArray(aliasesField.value);
    if (aliasValues === null) return refuse("base:input-shape");
    if (aliasValues.length > UNO_CANONICAL_BASE_LIMITS.maxAliases) return refuse("base:alias-count");

    const canonical = parseBase(canonicalField.value);
    if (canonical === null) return refuse("base:canonical-url");

    const aliases: UnoCanonicalBase[] = [];
    for (const aliasValue of aliasValues) {
      const alias = parseBase(aliasValue);
      if (alias === null) return refuse("base:alias-url");
      aliases.push(alias);
    }

    for (let index = 0; index < aliases.length; index += 1) {
      const alias = aliases[index] as UnoCanonicalBase;
      for (let earlier = 0; earlier < index; earlier += 1) {
        const pair = classifyPair(aliases[earlier] as UnoCanonicalBase, alias);
        if (pair === "duplicate") return refuse("base:alias-duplicate");
        if (pair === "overlap") return refuse("base:alias-overlap");
      }
      const againstCanonical = classifyPair(canonical, alias);
      if (againstCanonical === "duplicate") return refuse("base:alias-duplicate");
      if (againstCanonical === "overlap") return refuse("base:alias-overlap");
    }

    return Object.freeze({
      accepted: true as const,
      canonical,
      aliases: Object.freeze(aliases),
    });
  } catch (error) {
    if (error instanceof HostileStructure) return refuse("base:input-not-plain");
    return refuse("base:unreadable");
  }
}
