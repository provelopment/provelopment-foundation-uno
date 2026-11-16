/**
 * Foundation Uno — the author-destination safety classifier.
 *
 * NEW UNO-OWNED ADAPTATION. The concept — allowlist what an author may link to and fail closed
 * on anything disguised — is adapted from the pinned Foundation GEO-03 commit
 * `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, file `src/core/safe-url.ts`
 * (Git blob `d19b6c8ecb2f1bb3d3a163260ca2afeb87b89493`, 8,195 bytes), with its unit tests
 * (blob `13343cf06cd3dca1768edcb8ae46480325dc1391`, 3,503 bytes) read only as reference cases.
 * No Foundation source or test is copied, and this file has no imports at all.
 *
 * DELIBERATE, NARROWER DIFFERENCES from that upstream helper:
 *
 * - the accepted `href` is the ORIGINAL input, byte for byte — never trimmed, decoded,
 *   entity-unescaped or URL-reserialised, so what is validated is exactly what is emitted;
 * - HTML character references are REFUSED rather than decoded, so a value can never mean one
 *   thing here and another thing to an attribute parser;
 * - `tel:` is not an admitted link. A phone action must come from a separately validated public
 *   property projection in a later stage, never from author-typed text;
 * - absolute `http(s)` origins are validated lexically first, and only then cross-checked with
 *   the in-memory `URL` constructor, so its normalisation can never rescue a malformed origin;
 * - a relative reference containing a colon is refused: authoring never needs `./a:b`, and it
 *   makes the intended destination ambiguous.
 *
 * WHAT THIS DOES NOT DECIDE. A syntactically safe destination is not an authorised target. This
 * module cannot see the Page graph, the selected public Site, locale routing, visibility,
 * unlisted resources or published state, so its verdict is never proof that a destination
 * exists, is public, is reachable or is permitted. Those checks belong to later stages. It
 * performs no I/O, resolves no route, fetches nothing, renders nothing and confers no
 * provider, mail, capability or publishing authority.
 */

/** The longest author destination admitted here, in UTF-16 code units. */
export const AUTHOR_DESTINATION_MAX_LENGTH = 2000;

/** Scheme names that may appear in an admitted absolute destination. */
export const ADMITTED_ABSOLUTE_SCHEMES = Object.freeze(["http", "https", "mailto"] as const);

/** How many percent-decode passes are inspected before a value is refused as nested. */
const PERCENT_DECODE_ROUNDS = 3;

/** The admitted destination shapes. A category describes SYNTAX ONLY, never a target. */
export type AuthorDestinationCategory =
  | "root-relative"
  | "fragment"
  | "query"
  | "relative"
  | "http"
  | "https"
  | "mailto";

/** Why a destination was refused. Every reason means "do not emit it". */
export type AuthorDestinationRefusal =
  | "not-a-string"
  | "empty"
  | "too-long"
  | "whitespace"
  | "control-character"
  | "backslash"
  | "markup-character"
  | "character-reference"
  | "malformed-escape"
  | "nested-encoding"
  | "encoded-control-character"
  | "encoded-markup-character"
  | "encoded-scheme"
  | "protocol-relative"
  | "disallowed-scheme"
  | "malformed-origin"
  | "credentials-in-origin"
  | "invalid-host"
  | "invalid-port"
  | "mailto-recipient-missing"
  | "mailto-recipient-invalid"
  | "mailto-encoded-control"
  | "ambiguous-relative";

/** An admitted destination: the category, and the original accepted string unchanged. */
export interface AuthorDestinationAccepted {
  readonly accepted: true;
  readonly category: AuthorDestinationCategory;
  readonly href: string;
}

/** A refused destination: a bounded reason and no publishable href. */
export interface AuthorDestinationRejected {
  readonly accepted: false;
  readonly reason: AuthorDestinationRefusal;
}

export type AuthorDestinationVerdict = AuthorDestinationAccepted | AuthorDestinationRejected;

/** Raw C0/C1 controls and DEL are refused, never stripped. */
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;

/** Any whitespace, including the Unicode separators, is refused. */
const WHITESPACE_PATTERN = /\s/;

/** Attribute-breaking characters. A backslash is refused separately, with its own reason. */
const MARKUP_CHARACTER_PATTERN = /[<>"'`]/;

/** A numeric or named character reference: refused rather than decoded. */
const CHARACTER_REFERENCE_PATTERN = /&(?:#[0-9]+|#[xX][0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]*);/;

/** One well-formed percent escape, and every escape in a value. */
const VALID_ESCAPE_PATTERN = /%[0-9A-Fa-f]{2}/;
const ESCAPE_PATTERN = /%[0-9A-Fa-f]{2}/g;

/** A leading scheme: the only place a colon may introduce an absolute destination. */
const SCHEME_PATTERN = /^([A-Za-z][A-Za-z0-9+.-]*):/;

/** A hostname of ordinary DNS labels, or a bracketed IPv6 literal. */
const HOSTNAME_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*$/;
const IPV6_HOST_PATTERN = /^\[[0-9A-Fa-f:.]+\]$/;
const PORT_PATTERN = /^[0-9]{1,5}$/;

/** Conservative mailbox parts: no quoted local part, no dot-only domain. */
const MAILBOX_LOCAL_PATTERN = /^[A-Za-z0-9._%+-]+$/;
const MAILBOX_DOMAIN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/;

/** Raw or percent-encoded CR/LF anywhere in a mailto value is refused. */
const MAILTO_ENCODED_CONTROL_PATTERN = /%(?:0d|0a)/i;

function accepted(category: AuthorDestinationCategory, href: string): AuthorDestinationAccepted {
  return { accepted: true, category, href };
}

function refused(reason: AuthorDestinationRefusal): AuthorDestinationRejected {
  return { accepted: false, reason };
}

/** True when a `%` survives outside a well-formed two-hex-digit escape. */
function hasMalformedEscape(value: string): boolean {
  return value.replace(ESCAPE_PATTERN, "").includes("%");
}

/**
 * Decode percent escapes a bounded number of times, as a browser could, so a nested encoding
 * cannot hide a scheme. A sequence that is not valid UTF-8 is reported as malformed rather than
 * decoded into something else.
 */
function decodePercentRounds(value: string): {
  readonly text: string;
  readonly complete: boolean;
  readonly malformed: boolean;
} {
  let text = value;
  for (let round = 0; round < PERCENT_DECODE_ROUNDS; round += 1) {
    if (!VALID_ESCAPE_PATTERN.test(text)) return { text, complete: true, malformed: false };
    try {
      text = decodeURIComponent(text);
    } catch {
      return { text: value, complete: true, malformed: true };
    }
  }
  return { text, complete: !VALID_ESCAPE_PATTERN.test(text), malformed: false };
}

/**
 * What a decoded value must never become: a control, a fake attribute break, a character
 * reference or a scheme. An encoded SPACE is deliberately admitted: `?q=hello%20world` and a
 * percent-encoded mail subject are ordinary destinations, and an attribute parser does not split
 * on `%20`. Only real control bytes, markup and structure-changing decodings are refused.
 */
function encodedRefusal(
  decoded: string,
  rawScheme: string | null,
): AuthorDestinationRefusal | null {
  if (CONTROL_CHARACTER_PATTERN.test(decoded)) return "encoded-control-character";
  if (MARKUP_CHARACTER_PATTERN.test(decoded) || decoded.includes("\\")) {
    return "encoded-markup-character";
  }
  if (CHARACTER_REFERENCE_PATTERN.test(decoded)) return "character-reference";
  if (decoded.startsWith("//")) return "protocol-relative";

  // A scheme that only appears AFTER decoding is a disguised absolute destination, unless it is
  // the very scheme the raw value already declared and that scheme is admitted (`mailto:` with a
  // percent-encoded space in its subject header is ordinary, not an obfuscation).
  const decodedScheme = SCHEME_PATTERN.exec(decoded);
  if (decodedScheme !== null) {
    const name = (decodedScheme[1] ?? "").toLowerCase();
    if (rawScheme === null || name !== rawScheme) return "encoded-scheme";
  }
  return null;
}

/** Validate one URL authority lexically: no userinfo, a real host, a real port. */
function authorityRefusal(authority: string): AuthorDestinationRefusal | null {
  let host = authority;
  let port: string | null = null;

  if (authority.startsWith("[")) {
    const closing = authority.indexOf("]");
    if (closing === -1) return "malformed-origin";
    host = authority.slice(0, closing + 1);
    const afterHost = authority.slice(closing + 1);
    if (afterHost.length > 0) {
      if (!afterHost.startsWith(":")) return "malformed-origin";
      port = afterHost.slice(1);
    }
    if (!IPV6_HOST_PATTERN.test(host)) return "invalid-host";
  } else {
    const colon = authority.lastIndexOf(":");
    if (colon !== -1) {
      host = authority.slice(0, colon);
      port = authority.slice(colon + 1);
    }
    if (host.length === 0) return "malformed-origin";
    if (!HOSTNAME_PATTERN.test(host)) return "invalid-host";
  }

  if (port !== null) {
    if (!PORT_PATTERN.test(port)) return "invalid-port";
    const numeric = Number.parseInt(port, 10);
    if (numeric < 1 || numeric > 65535) return "invalid-port";
  }
  return null;
}

/**
 * Validate an absolute `http(s)` destination. Lexical checks run first, so the `URL`
 * constructor is only ever a cross-check: its normalisation cannot turn a malformed origin into
 * an acceptable one.
 */
function originRefusal(value: string, schemeName: string): AuthorDestinationRefusal | null {
  const remainder = value.slice(schemeName.length + 1);
  if (!remainder.startsWith("//")) return "malformed-origin";

  const authorityAndRest = remainder.slice(2);
  const terminator = authorityAndRest.search(/[/?#]/);
  const authority = terminator === -1 ? authorityAndRest : authorityAndRest.slice(0, terminator);
  if (authority.length === 0) return "malformed-origin";
  if (authority.includes("@")) return "credentials-in-origin";

  const authorityVerdict = authorityRefusal(authority);
  if (authorityVerdict !== null) return authorityVerdict;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "malformed-origin";
  }
  if (parsed.protocol !== `${schemeName}:`) return "malformed-origin";
  if (parsed.username !== "" || parsed.password !== "") return "credentials-in-origin";
  if (parsed.hostname === "") return "malformed-origin";
  return null;
}

/** True when a mailbox component is not conservative enough for an authored link. */
function isRefusedMailbox(recipient: string): boolean {
  const at = recipient.lastIndexOf("@");
  if (at < 1) return true;
  const local = recipient.slice(0, at);
  const domain = recipient.slice(at + 1);
  if (!MAILBOX_LOCAL_PATTERN.test(local)) return true;
  if (!MAILBOX_DOMAIN_PATTERN.test(domain)) return true;
  return domain.includes("..");
}

/** Validate an explicit `mailto:` destination: a recipient, and no encoded CR/LF. */
function mailtoRefusal(value: string): AuthorDestinationRefusal | null {
  const remainder = value.slice("mailto:".length);
  if (remainder.length === 0) return "mailto-recipient-missing";
  if (MAILTO_ENCODED_CONTROL_PATTERN.test(remainder)) return "mailto-encoded-control";

  const queryStart = remainder.indexOf("?");
  const recipients = queryStart === -1 ? remainder : remainder.slice(0, queryStart);
  if (recipients.length === 0) return "mailto-recipient-missing";
  for (const recipient of recipients.split(",")) {
    if (isRefusedMailbox(recipient)) return "mailto-recipient-invalid";
  }
  return null;
}

/**
 * Classify one author-controlled destination.
 *
 * The parameter is `unknown` on purpose: an untrusted caller may pass anything, and the answer is
 * a verdict rather than a throw. A non-string is refused before any lookup, so no value is ever
 * coerced and a hostile object's `toString` or `Symbol.toPrimitive` is never invoked.
 *
 * An accepted verdict carries the ORIGINAL string unchanged: this classifier validates, it never
 * repairs. A refused verdict carries a bounded reason and no href, and never interpolates the
 * offending value.
 */
export function classifyAuthorDestination(input: unknown): AuthorDestinationVerdict {
  if (typeof input !== "string") return refused("not-a-string");
  if (input.length === 0) return refused("empty");
  if (input.length > AUTHOR_DESTINATION_MAX_LENGTH) return refused("too-long");
  if (CONTROL_CHARACTER_PATTERN.test(input)) return refused("control-character");
  if (WHITESPACE_PATTERN.test(input)) return refused("whitespace");
  if (input.includes("\\")) return refused("backslash");
  if (MARKUP_CHARACTER_PATTERN.test(input)) return refused("markup-character");
  if (CHARACTER_REFERENCE_PATTERN.test(input)) return refused("character-reference");
  if (hasMalformedEscape(input)) return refused("malformed-escape");

  const rawSchemeMatch = SCHEME_PATTERN.exec(input);
  const rawScheme = rawSchemeMatch === null ? null : (rawSchemeMatch[1] ?? "").toLowerCase();

  // Checked before decoding so the refusal names the actual risk (CR/LF injection into mail
  // headers) rather than reporting it as a generic encoded control.
  if (rawScheme === "mailto" && MAILTO_ENCODED_CONTROL_PATTERN.test(input)) {
    return refused("mailto-encoded-control");
  }

  const decoded = decodePercentRounds(input);
  if (decoded.malformed) return refused("malformed-escape");
  if (!decoded.complete) return refused("nested-encoding");
  if (decoded.text !== input) {
    const encodedVerdict = encodedRefusal(decoded.text, rawScheme);
    if (encodedVerdict !== null) return refused(encodedVerdict);
  }

  if (input.startsWith("//")) return refused("protocol-relative");

  if (rawScheme !== null) {
    if (rawScheme === "http" || rawScheme === "https") {
      const originVerdict = originRefusal(input, rawScheme);
      if (originVerdict !== null) return refused(originVerdict);
      return accepted(rawScheme, input);
    }
    if (rawScheme === "mailto") {
      const mailVerdict = mailtoRefusal(input);
      if (mailVerdict !== null) return refused(mailVerdict);
      return accepted("mailto", input);
    }
    return refused("disallowed-scheme");
  }

  if (input.startsWith("#")) return accepted("fragment", input);
  if (input.startsWith("?")) return accepted("query", input);
  if (input.startsWith("/")) return accepted("root-relative", input);
  if (input.includes(":")) return refused("ambiguous-relative");
  return accepted("relative", input);
}

/** True when a destination may be emitted. A separate guard may delegate, and does. */
export function isSafeAuthorHref(input: unknown): boolean {
  return classifyAuthorDestination(input).accepted;
}
