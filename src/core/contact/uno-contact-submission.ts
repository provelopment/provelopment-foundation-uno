/**
 * Foundation Uno — the contact submission contract (`U05`).
 *
 * WHAT THIS IS. One pure, closed description of what a contact submission may contain: three authored fields with declared
 * bounds and a fixed shape, plus the one closed refusal vocabulary for everything else. It decides *shape*, never delivery:
 * nothing here sends, stores, logs or authorises a transport, and an accepted submission is not a delivered message.
 *
 * THE BOUNDS ARE LIMITS, NOT DEFAULTS. A field at its limit is accepted, one code point past it is refused — never truncated,
 * never padded, never re-encoded. Values are normalized (outer whitespace removed, CRLF folded to LF) so what is validated is
 * exactly what any later transport would carry, and control characters are refused rather than stripped: a value that could
 * mean one thing here and another in a mail header or a JSON body is never admitted.
 *
 * HOSTILE INPUT. The parameter is `unknown` and every read is guarded, so a Proxy trap, an accessor or a non-object becomes a
 * bounded refusal instead of a throw. Only the three known keys plus one optional honeypot are read; anything else refuses the
 * whole submission rather than being ignored, so a caller cannot smuggle an extra field into a downstream request.
 */
import type { UnoContactField } from "../page-document";

/** The declared field bounds, in Unicode code points. */
export const UNO_CONTACT_LIMITS = Object.freeze({
  nameCodePoints: 100,
  emailCodePoints: 254,
  messageCodePoints: 4000,
  bodyBytes: 8 * 1024,
});

/** The exact keys one submission may carry: the closed fields, plus the honeypot no real person fills in. */
export const UNO_CONTACT_SUBMISSION_KEYS: readonly string[] = Object.freeze([
  "name",
  "email",
  "message",
  "website",
] as const);

/** Every reason a submission is refused. One literal per failure family, never widened at a call site. */
export type UnoContactRefusal =
  | "contact:not-an-object"
  | "contact:unknown-field"
  | "contact:missing-field"
  | "contact:not-text"
  | "contact:empty"
  | "contact:too-long"
  | "contact:control-character"
  | "contact:email-invalid"
  | "contact:honeypot-filled";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_CONTACT_REFUSAL_REASONS: readonly UnoContactRefusal[] = Object.freeze([
  "contact:not-an-object",
  "contact:unknown-field",
  "contact:missing-field",
  "contact:not-text",
  "contact:empty",
  "contact:too-long",
  "contact:control-character",
  "contact:email-invalid",
  "contact:honeypot-filled",
] as const);

/** An accepted submission: normalized values, in the order the form declares them. */
export interface UnoContactSubmissionAccepted {
  readonly accepted: true;
  readonly submission: {
    readonly name: string;
    readonly email: string;
    readonly message: string;
  };
  /** The fields the form offered, so a caller can report which ones carried a value. */
  readonly fields: readonly UnoContactField[];
}

/** A refused submission: one closed reason and no partial values. */
export interface UnoContactSubmissionRejected {
  readonly accepted: false;
  readonly reason: UnoContactRefusal;
}

export type UnoContactSubmissionResult = UnoContactSubmissionAccepted | UnoContactSubmissionRejected;

/** C0/C1 controls and DEL. Tab and line feed are admitted inside the message only, and folded before use. */
const CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u;

/**
 * A conservative mailbox: a dot-atom local part and a dotted domain of ordinary labels. Deliberately narrower than RFC 5322,
 * because this address is only ever a reply address for one human, and a quoted local part or a bare label is not something a
 * public form needs to accept.
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/u;

function rejected(reason: UnoContactRefusal): UnoContactSubmissionRejected {
  return { accepted: false, reason };
}

/** Count code points rather than UTF-16 units, so an authored emoji costs one character and not two. */
function codePoints(value: string): number {
  return [...value].length;
}

/** Normalize one text field: fold CRLF, drop trailing spaces on each line, trim the outside. */
function normalize(value: string): string {
  return value
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/u, ""))
    .join("\n")
    .trim();
}

/** The verdict of reading one field: a normalized value, or the closed refusal that stops the submission. */
type FieldRead = { readonly ok: true; readonly value: string } | { readonly ok: false; readonly reason: UnoContactRefusal };

/** Read one required text field with its own bound, or the closed refusal that stops the submission. */
function readText(
  source: Record<string, unknown>,
  key: string,
  limit: number,
  allowLineFeeds: boolean,
): FieldRead {
  if (!Object.hasOwn(source, key)) return { ok: false, reason: "contact:missing-field" };
  const raw = source[key];
  if (typeof raw !== "string") return { ok: false, reason: "contact:not-text" };
  if (CONTROL_PATTERN.test(raw)) return { ok: false, reason: "contact:control-character" };
  if (!allowLineFeeds && /[\n\r]/u.test(raw)) return { ok: false, reason: "contact:control-character" };
  const value = normalize(raw);
  if (value.length === 0) return { ok: false, reason: "contact:empty" };
  if (codePoints(value) > limit) return { ok: false, reason: "contact:too-long" };
  return { ok: true, value };
}

/**
 * Validate one contact submission.
 *
 * The honeypot is checked first: a filled trap is refused before any field is read, so a bot's payload never reaches a
 * transport, and the refusal never echoes what it contained.
 */
export function validateUnoContactSubmission(input: unknown): UnoContactSubmissionResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return rejected("contact:not-an-object");

  let source: Record<string, unknown>;
  try {
    source = input as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      if (!UNO_CONTACT_SUBMISSION_KEYS.includes(key)) return rejected("contact:unknown-field");
    }
    const trap = source["website"];
    if (trap !== undefined && trap !== null && trap !== "") return rejected("contact:honeypot-filled");
  } catch {
    return rejected("contact:not-an-object");
  }

  const name = readText(source, "name", UNO_CONTACT_LIMITS.nameCodePoints, false);
  if (!name.ok) return rejected(name.reason);
  const email = readText(source, "email", UNO_CONTACT_LIMITS.emailCodePoints, false);
  if (!email.ok) return rejected(email.reason);
  if (!EMAIL_PATTERN.test(email.value)) return rejected("contact:email-invalid");
  const message = readText(source, "message", UNO_CONTACT_LIMITS.messageCodePoints, true);
  if (!message.ok) return rejected(message.reason);

  return {
    accepted: true,
    submission: Object.freeze({ name: name.value, email: email.value, message: message.value }),
    fields: Object.freeze(["name", "email", "message"] as const),
  };
}

/** True when the serialized submission fits the declared body bound, measured as UTF-8 bytes. */
export function isUnoContactSubmissionWithinBodyBound(text: string): boolean {
  return new TextEncoder().encode(text).length <= UNO_CONTACT_LIMITS.bodyBytes;
}

