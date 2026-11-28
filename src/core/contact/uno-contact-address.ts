/**
 * Foundation Uno — the address shapes the mail path accepts (`U05`).
 *
 * WHAT THIS IS. One strict mailbox predicate and one parser for the `From` value an operator configures. Both are
 * pure and closed, and they exist so the submission contract, the sender policy and the provider adapter agree on
 * what an address is instead of each keeping a near-copy.
 *
 * WHY NARROW. This is a public contact form's reply address and one operator sender, not an SMTP implementation. A
 * quoted local part, a comment, a bare label, an internationalised domain or a header continuation is refused
 * rather than guessed, because each one is a way to smuggle a separator into a field that later becomes a header.
 */

/** The declared bound on one mailbox. */
export const UNO_MAIL_ADDRESS_MAX_LENGTH = 254;

const MAILBOX_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/u;

/** Anything that could end a header or start a second one. */
const SEPARATORS = /[\s,;:<>()[\]\\"'\u0000-\u001f\u007f]/u;

/** True when `value` is exactly one bare mailbox. */
export function isUnoMailAddress(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= UNO_MAIL_ADDRESS_MAX_LENGTH &&
    !SEPARATORS.test(value) &&
    MAILBOX_PATTERN.test(value)
  );
}

/** A parsed `From`: the display name an operator wrote, and the bare address the provider will verify. */
export interface UnoParsedSender {
  readonly address: string;
  readonly displayName: string | null;
}

/**
 * Parse one configured `From` value: a bare mailbox, or `Display Name <mailbox>`.
 *
 * The display name is bounded and stripped of separators; the address must be a bare mailbox. Anything else —
 * a second address, a quoted string containing `<`, a trailing comment — is refused rather than repaired.
 */
export function parseUnoSender(value: unknown): UnoParsedSender | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > UNO_MAIL_ADDRESS_MAX_LENGTH + 80) return null;

  const angled = /^([^<>]{1,80})<([^<>]+)>$/u.exec(trimmed);
  if (angled !== null) {
    const address = angled[2]?.trim() ?? "";
    if (!isUnoMailAddress(address)) return null;
    const rawName = (angled[1] ?? "").trim().replace(/^"+|"+$/gu, "").trim();
    // A display name may contain ordinary punctuation but never a separator that would end the header.
    if (rawName.length === 0) return { address, displayName: null };
    if (/[\r\n\u0000-\u001f\u007f<>]/u.test(rawName)) return null;
    return { address, displayName: rawName };
  }

  return isUnoMailAddress(trimmed) ? { address: trimmed, displayName: null } : null;
}

/** The domain of a validated mailbox, lowercased. */
export function unoMailDomain(address: string): string {
  const at = address.lastIndexOf("@");
  return at === -1 ? "" : address.slice(at + 1).toLowerCase();
}
