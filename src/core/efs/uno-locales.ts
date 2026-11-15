/**
 * Foundation Uno — the authored locale policy (U01 pure kernel).
 *
 * NEW UNO-OWNED ADAPTATION, informed by the pinned Foundation GEO-03 commit
 * `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, file `src/core/efs/locales.ts`
 * (Git blob `3cbe1dbe3b684c5cfc79d1df7e5fc5a61db3c24f`). This file is NOT a copy of that
 * file and carries no upstream blob identity.
 *
 * Two Foundation behaviours are deliberately **excluded**:
 *
 * 1. its implicit *preference-prefix* selection, where a bare preference resolves to a sole
 *    authored representation whose subtag sequence extends it. Uno admits a short language
 *    ONLY through an explicit, validated Site mapping to declared full locales.
 * 2. its script-only "publication qualification" reasoning. Uno has one rule: a published
 *    representation needs an authored BCP 47 language **plus region**.
 *
 * The authoritative Uno A1 rules are the Owner's R1 and P04: a published representation
 * needs an authored language **and region** (`en-001`, `de-DE`, `fr-FR`, `id-ID`,
 * `zh-Hans-CN`); the URL key is the lower-case full tag; short `/en`, `/de`, `/fr` and bare
 * browser language preferences resolve ONLY through an explicit validated Site mapping to
 * declared supported full locales; never IP, country, hostname or script inference.
 *
 * SCOPE. Pure functions only: no I/O, no framework, no clock, no redirect. Nothing here
 * creates a route, a Page URL, a published representation, a fallback or a `hreflang` tag.
 * Actual HTTP canonical redirects, unlisted targets and per-Page fallback remain U03, so R4
 * (never redirect or discover to unlisted Pages) is NOT satisfied here.
 */

/** A validated locale policy for one Site: full locales plus explicit short-language maps. */
export interface UnoLocalePolicy {
  /** Declared supported locales, in canonical full-region spelling. */
  readonly supportedLocales: readonly string[];
  /** The declared default; must be one of `supportedLocales`. */
  readonly defaultLocale: string;
  /** Explicit short-language (`en`) to declared full locale (`en-001`) mappings. */
  readonly languagePreferences: Readonly<Record<string, string>>;
}

/** The outcome of resolving a locale for a locale-less entry address. */
export type UnoEntryLocaleResult =
  | {
      readonly kind: "selected";
      readonly locale: string;
      readonly source: "explicit" | "saved" | "accept-language" | "default";
    }
  | { readonly kind: "rejected"; readonly reason: string };

/**
 * The lexical shape of an acceptable incoming locale tag.
 *
 * language `[a-z]{2,3}` · optional script `[a-z]{4}` · **required** region
 * (`[a-z]{2}` or `[0-9]{3}`) · zero or more variant subtags (`[a-z0-9]{5,8}` or digit plus
 * three alphanumerics). Matching is case-insensitive so a well-shaped mixed-case *incoming*
 * tag is accepted; canonical *stored* spelling is enforced separately by
 * `localePolicyIssue`.
 */
const LOCALE_PATTERN =
  /^[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|[0-9]{3}))(?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*$/i;

/** The longest accepted tag, in ASCII characters. */
const MAX_LOCALE_TAG_LENGTH = 64;

/** A short language key that may appear in an explicit Site mapping. */
const SHORT_LANGUAGE_PATTERN = /^[a-z]{2,3}$/;

/** Bounds on a browser `Accept-Language` header, so nothing unbounded reaches the parser. */
const MAX_ACCEPT_LANGUAGE_LENGTH = 1024;
const MAX_ACCEPT_LANGUAGE_ENTRIES = 20;

/** Keys that would be prototype pollution if they were treated as ordinary mappings. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const POLICY_KEYS = ["defaultLocale", "languagePreferences", "supportedLocales"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): string | null {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) return `${label} must not carry the unknown field "${key}".`;
  }
  return null;
}

/**
 * Diagnose a locale tag without repairing it.
 *
 * Refuses: nonstrings, surrounding whitespace, a bare language (`en`, `de`), a bare script
 * (`zh-Hans`), variants only, malformed separators, invalid subtags, non-ASCII or control
 * characters, private/extension subtags, over-long tags, and any tag without a two-letter or
 * three-digit region.
 */
export function localeTagIssue(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return "A locale must be a non-empty BCP 47-style language tag.";
  }
  if (value.trim() !== value) {
    return "A locale must not carry leading or trailing whitespace.";
  }
  if (value.length > MAX_LOCALE_TAG_LENGTH) {
    return `A locale must be at most ${MAX_LOCALE_TAG_LENGTH} characters.`;
  }
  if (!/^[\x20-\x7e]+$/.test(value)) {
    return "A locale must be ASCII: no Unicode or control characters are accepted.";
  }
  if (!LOCALE_PATTERN.test(value)) {
    return `"${value}" must be a language plus region (for example "en-001" or "zh-Hans-CN").`;
  }
  return null;
}

/**
 * The conventional canonical spelling: lower-case language and variants, Titlecase script,
 * upper-case alpha region, numeric region unchanged.
 *
 * A well-shaped mixed-case input is accepted and normalised; an invalid tag throws. Authored
 * identifiers are never silently normalised — `localePolicyIssue` rejects a non-canonical
 * *stored* spelling instead.
 */
export function canonicalLocaleTag(value: unknown): string {
  const issue = localeTagIssue(value);
  if (issue) throw new Error(issue);

  const parts = (value as string).split("-");
  const canonical: string[] = [(parts[0] as string).toLowerCase()];

  let index = 1;
  const script = parts[index];
  if (script !== undefined && /^[A-Za-z]{4}$/.test(script)) {
    canonical.push(script.charAt(0).toUpperCase() + script.slice(1).toLowerCase());
    index += 1;
  }
  const region = parts[index] as string;
  canonical.push(/^[0-9]{3}$/.test(region) ? region : region.toUpperCase());
  index += 1;
  for (; index < parts.length; index += 1) {
    canonical.push((parts[index] as string).toLowerCase());
  }

  return canonical.join("-");
}

export function localePolicyIssue(value: unknown): string | null {
  if (!isPlainObject(value)) return "A locale policy must be a plain object.";
  const unknownField = hasOnlyKeys(value, POLICY_KEYS, "A locale policy");
  if (unknownField) return unknownField;

  const supported = value.supportedLocales;
  if (!Array.isArray(supported) || supported.length === 0) {
    return "supportedLocales must be a non-empty array of canonical full locales.";
  }
  const stored = new Set<string>();
  const pathKeys = new Set<string>();
  for (const entry of supported) {
    const issue = localeTagIssue(entry);
    if (issue) return `supportedLocales: ${issue}`;
    const canonical = canonicalLocaleTag(entry);
    if (canonical !== entry) {
      return `supportedLocales must store the canonical spelling "${canonical}", received "${String(entry)}".`;
    }
    if (stored.has(entry)) return `supportedLocales must not repeat "${entry}".`;
    stored.add(entry);
    const key = entry.toLowerCase();
    if (pathKeys.has(key)) return `supportedLocales collide on the path key "${key}".`;
    pathKeys.add(key);
  }

  const declaredDefault = value.defaultLocale;
  const defaultIssue = localeTagIssue(declaredDefault);
  if (defaultIssue) return `defaultLocale: ${defaultIssue}`;
  if (canonicalLocaleTag(declaredDefault) !== declaredDefault) {
    return `defaultLocale must be stored canonically, received "${String(declaredDefault)}".`;
  }
  if (!stored.has(declaredDefault as string)) {
    return `defaultLocale "${String(declaredDefault)}" must be one of supportedLocales.`;
  }

  const preferences = value.languagePreferences;
  if (!isPlainObject(preferences)) return "languagePreferences must be a plain object.";
  for (const [key, target] of Object.entries(preferences)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return `languagePreferences must not declare the key "${key}".`;
    }
    if (!SHORT_LANGUAGE_PATTERN.test(key)) {
      return `languagePreferences keys must be lower-case two- or three-letter languages, received "${key}".`;
    }
    const targetIssue = localeTagIssue(target);
    if (targetIssue) return `languagePreferences["${key}"]: ${targetIssue}`;
    if (canonicalLocaleTag(target) !== target) {
      return `languagePreferences["${key}"] must target a canonical spelling, received "${String(target)}".`;
    }
    if (!stored.has(target as string)) {
      return `languagePreferences["${key}"] must target a declared supported locale, received "${String(target)}".`;
    }
    if (key === "en" && target !== "en-001") {
      return 'languagePreferences["en"] must map to "en-001".';
    }
  }

  return null;
}

/** The lower-case full tag used as a URL path key. */
export function localePathKey(value: unknown): string {
  return canonicalLocaleTag(value).toLowerCase();
}

/**
 * Parse a bounded browser `Accept-Language` header into ordered tags.
 *
 * Bounds: at most `MAX_ACCEPT_LANGUAGE_LENGTH` characters and
 * `MAX_ACCEPT_LANGUAGE_ENTRIES` entries; an over-long header is ignored entirely rather than
 * treated as an error. `q` must be a finite number in 0–1; `q=0` and `*` are excluded; a
 * malformed `q` excludes that entry. Ordering is by descending `q`, then original position,
 * so ties are deterministic. Well-shaped full tags and short languages are both returned —
 * the caller resolves them, and only an exact or explicitly mapped value ever matches.
 */
function orderedAcceptLanguages(header: unknown): readonly string[] {
  if (typeof header !== "string" || header.length === 0) return [];
  if (header.length > MAX_ACCEPT_LANGUAGE_LENGTH) return [];

  const parts = header.split(",").slice(0, MAX_ACCEPT_LANGUAGE_ENTRIES);
  const entries: { tag: string; q: number; order: number }[] = [];

  parts.forEach((part, order) => {
    const segments = part.split(";").map((segment) => segment.trim());
    const tag = segments[0] ?? "";
    if (tag.length === 0 || tag === "*") return;

    let quality = 1;
    let usable = true;
    for (const segment of segments.slice(1)) {
      if (segment.length === 0) continue;
      const qualityParameter = /^q=(.+)$/i.exec(segment);
      if (qualityParameter === null) continue; // other parameters are not our concern
      const parsed = Number(qualityParameter[1]);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
        usable = false;
        break;
      }
      quality = parsed;
    }
    if (!usable || quality <= 0) return;

    entries.push({ tag, q: quality, order });
  });

  entries.sort((left, right) => right.q - left.q || left.order - right.order);
  return entries.map((entry) => entry.tag);
}

/** Path-key index of the declared supported locales. */
function supportedIndex(policy: UnoLocalePolicy): Map<string, string> {
  const index = new Map<string, string>();
  for (const locale of policy.supportedLocales) index.set(locale.toLowerCase(), locale);
  return index;
}

/**
 * Resolve one visitor-supplied key against the DECLARED policy only.
 *
 * A full tag must match a declared locale exactly (case-insensitively). A short language
 * resolves only through an explicit mapping. Nothing is prefix-matched, extended or guessed,
 * so `en-US` can never become `en-001` and `de` can never become `de-DE`.
 */
function resolveDeclaredKey(
  policy: UnoLocalePolicy,
  index: Map<string, string>,
  raw: string,
): string | undefined {
  const lowered = raw.toLowerCase();
  if (SHORT_LANGUAGE_PATTERN.test(lowered)) {
    if (FORBIDDEN_KEYS.has(lowered)) return undefined;
    const preferences = policy.languagePreferences;
    if (!Object.prototype.hasOwnProperty.call(preferences, lowered)) return undefined;
    return index.get((preferences[lowered] as string).toLowerCase());
  }
  if (localeTagIssue(raw) !== null) return undefined;
  return index.get(canonicalLocaleTag(raw).toLowerCase());
}

/**
 * Resolve the locale for a locale-less entry address.
 *
 * Order, exactly:
 *
 * 1. An **explicit** value wins outright. It must resolve against the declared policy — a
 *    full tag to its declared canonical match, or a short key through the explicit map —
 *    and otherwise the result is `rejected`. An invalid or unsupported explicit value is
 *    NEVER overwritten by a saved preference, a header or the default.
 * 2. A **saved** preference is tried next; a bad or unknown value is ignored.
 * 3. A bounded `Accept-Language` header is tried after that; the first resolving entry wins.
 * 4. The declared **default**.
 *
 * A rejected policy, a malformed input object or an unknown input field yields `rejected`
 * rather than throwing. No Page URL, slug, fallback, redirect or published representation is
 * produced here: this function returns a locale decision only.
 */
export function selectUnoEntryLocale(input: {
  readonly policy: UnoLocalePolicy;
  readonly explicit?: string;
  readonly savedPreference?: string;
  readonly acceptLanguage?: string | null;
}): UnoEntryLocaleResult {
  if (!isPlainObject(input)) {
    return { kind: "rejected", reason: "The entry-locale input must be a plain object." };
  }
  const unknownField = hasOnlyKeys(
    input,
    ["acceptLanguage", "explicit", "policy", "savedPreference"],
    "The entry-locale input",
  );
  if (unknownField) return { kind: "rejected", reason: unknownField };

  const policyIssue = localePolicyIssue(input.policy);
  if (policyIssue) return { kind: "rejected", reason: policyIssue };

  const policy = input.policy;
  const index = supportedIndex(policy);

  const explicit = input.explicit;
  if (explicit !== undefined) {
    if (typeof explicit !== "string") {
      return { kind: "rejected", reason: "The explicit locale must be a string." };
    }
    const selected = resolveDeclaredKey(policy, index, explicit);
    if (selected !== undefined) {
      return { kind: "selected", locale: selected, source: "explicit" };
    }
    return {
      kind: "rejected",
      reason: `The explicit locale "${explicit}" is not a declared supported full locale.`,
    };
  }

  const saved = input.savedPreference;
  if (typeof saved === "string" && saved.length > 0) {
    const selected = resolveDeclaredKey(policy, index, saved);
    if (selected !== undefined) {
      return { kind: "selected", locale: selected, source: "saved" };
    }
  }

  for (const tag of orderedAcceptLanguages(input.acceptLanguage)) {
    const selected = resolveDeclaredKey(policy, index, tag);
    if (selected !== undefined) {
      return { kind: "selected", locale: selected, source: "accept-language" };
    }
  }

  return { kind: "selected", locale: policy.defaultLocale, source: "default" };
}
