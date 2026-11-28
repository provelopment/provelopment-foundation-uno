/**
 * Foundation Uno — composed contact mail (`U05`).
 *
 * WHAT THIS IS. The one place a visitor's words become a message: a bounded plain-text body, a bounded single-line
 * subject, and an opaque idempotency key derived from the attempt. Nothing here transmits, reads the environment or
 * knows a provider.
 *
 * SAFETY. No HTML, no attachment, no header and no `Cc`/`Bcc` is constructible: the message shape has exactly one
 * recipient list the caller already allowlisted, one sender the operator configured, one `Reply-To` that was
 * validated as a mailbox, one subject and one text body. A newline can never enter a subject or an address, because
 * the submission contract refuses controls and the composition strips line breaks from the two header-bound values.
 */
import type { UnoContactFormIdentity } from "./uno-contact-authorization";

/** The declared bounds. Each is a limit, never a default. */
export const UNO_CONTACT_MESSAGE_LIMITS = Object.freeze({
  subjectCodePoints: 160,
  textBytes: 8 * 1024,
});

/** The values a composition needs, all already validated. */
export interface UnoContactMessageInput {
  readonly identity: UnoContactFormIdentity;
  readonly submission: { readonly name: string; readonly email: string; readonly message: string };
  /** The Site's authored display name, used only to make the subject readable. */
  readonly siteName: string | null;
}

/** The composed parts. The transport adds envelope fields it owns. */
export interface UnoContactComposedMessage {
  readonly subject: string;
  readonly text: string;
  readonly idempotencyKey: string;
}

/** A composed message, or the one bounded refusal. */
export type UnoContactCompositionResult =
  | { readonly ok: true; readonly message: UnoContactComposedMessage }
  | { readonly ok: false; readonly reason: "contact:message-too-large" };

/** Fold every line break and control out of a header-bound value. The input contract already refused them. */
function singleLine(value: string): string {
  return value.replace(/[\r\n\t\u0000-\u001f\u007f]+/gu, " ").replace(/\s{2,}/gu, " ").trim();
}

/** FNV-1a over the attempt's own values: stable, non-reversible enough to carry no address, and non-PII by design. */
function opaqueKey(seed: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index) & 0xff;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `uno-${hash.toString(16).padStart(8, "0")}`;
}

/**
 * Compose one message from an authorised identity and a validated submission.
 *
 * The subject names the Site and the Page the message came from — server facts, never a client claim — so an
 * operator can route it without the visitor describing anything. The body is plain text with the three values,
 * labelled with the same words the form used.
 */
export function composeUnoContactMessage(input: UnoContactMessageInput): UnoContactCompositionResult {
  const site = input.siteName === null ? "" : `${singleLine(input.siteName)} `;
  const subject = singleLine(`${site}contact — ${input.identity.routePath}`).slice(0, UNO_CONTACT_MESSAGE_LIMITS.subjectCodePoints);
  if (subject.length === 0) return { ok: false, reason: "contact:message-too-large" };

  const text = [
    `Name: ${input.submission.name}`,
    `Email: ${input.submission.email}`,
    `Page: ${input.identity.routePath}`,
    `Locale: ${input.identity.localeTag}`,
    "",
    input.submission.message,
  ].join("\n");

  if (new TextEncoder().encode(text).length > UNO_CONTACT_MESSAGE_LIMITS.textBytes) {
    return { ok: false, reason: "contact:message-too-large" };
  }

  return {
    ok: true,
    message: Object.freeze({
      subject,
      text,
      // The key covers the attempt's identity and content, so a retried request collapses and two different
      // messages never share a key. It carries no readable address.
      idempotencyKey: opaqueKey(
        `${input.identity.siteId}|${input.identity.formRef}|${input.identity.routePath}|${input.submission.email}|${input.submission.message.length}`,
      ),
    }),
  };
}
