/**
 * Foundation Uno — the private contact delivery policy (`U05`).
 *
 * WHAT THIS IS. The server-only decision about where an enquiry may be sent, who it may appear to come from, and whether
 * the visitor's address may be used as a reply address. It is deliberately separate from every public contact fact: a
 * Site can publish a `mailto:` without enabling a form, and can enable a form without publishing any address.
 *
 * WHY IT IS SEPARATE. Deriving the recipient from a resolved `contact.email` property made one authored fact do two
 * unrelated jobs — publication and delivery — so changing what the site shows would silently change where enquiries go.
 * Nothing here reads a property, a Page or a document; the caller supplies the operator's configuration and this module
 * decides whether it is usable.
 *
 * FAIL-CLOSED. An absent, partial, malformed or unauthorised policy yields a closed reason and no recipients, so the
 * caller answers `unavailable` and no message is composed. A policy can never widen itself: the sender must belong to a
 * listed domain, and every recipient must be a bare mailbox.
 */
import { isUnoMailAddress, unoMailDomain } from "./uno-contact-address";

/** The declared bounds. Each is a limit, never a default. */
export const UNO_CONTACT_POLICY_LIMITS = Object.freeze({ recipients: 5, domains: 10 });

/** How a visitor's address may be used. `none` sends no Reply-To at all. */
export type UnoContactReplyTo = "visitor" | "none";

/** A validated policy: every value is already a bare, admissible mailbox. */
export interface UnoContactDeliveryPolicy {
  readonly recipients: readonly string[];
  readonly sender: string;
  readonly replyTo: UnoContactReplyTo;
}

/** Why a policy is unusable. Closed, and safe to answer with. */
export type UnoContactPolicyRefusal =
  | "contact:policy-not-configured"
  | "contact:policy-invalid"
  | "contact:policy-unauthorized-sender"
  | "contact:policy-unauthorized-recipient";

/** The raw operator configuration, exactly as an adapter read it. */
export interface UnoContactPolicyInput {
  readonly recipients: string | null;
  readonly sender: string | null;
  readonly senderDomains: string | null;
  readonly replyTo: string | null;
}

/** A usable policy, or the closed reason it is not. */
export type UnoContactPolicyResult =
  | { readonly ok: true; readonly policy: UnoContactDeliveryPolicy }
  | { readonly ok: false; readonly reason: UnoContactPolicyRefusal };

/** Split one comma list, trimmed and bounded. */
function splitList(value: string | null): string[] {
  if (value === null) return [];
  return value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

/**
 * Validate one operator configuration.
 *
 * Order of proof: presence, then the sender's domain against the declared allowlist, then the recipient list. A refusal
 * names the first failed step only, so an operator learns one thing at a time and a caller cannot probe the rest.
 */
export function readUnoContactDeliveryPolicy(input: UnoContactPolicyInput): UnoContactPolicyResult {
  if (input.recipients === null || input.sender === null) {
    return { ok: false, reason: "contact:policy-not-configured" };
  }
  if (!isUnoMailAddress(input.sender)) return { ok: false, reason: "contact:policy-invalid" };

  const domains = splitList(input.senderDomains).map((domain) => domain.toLowerCase());
  if (domains.length === 0 || domains.length > UNO_CONTACT_POLICY_LIMITS.domains) {
    return { ok: false, reason: "contact:policy-unauthorized-sender" };
  }
  if (!domains.includes(unoMailDomain(input.sender))) {
    return { ok: false, reason: "contact:policy-unauthorized-sender" };
  }

  const recipients = splitList(input.recipients);
  if (recipients.length === 0 || recipients.length > UNO_CONTACT_POLICY_LIMITS.recipients) {
    return { ok: false, reason: "contact:policy-unauthorized-recipient" };
  }
  if (!recipients.every(isUnoMailAddress)) return { ok: false, reason: "contact:policy-unauthorized-recipient" };

  const replyTo: UnoContactReplyTo = input.replyTo === "none" ? "none" : "visitor";
  if (input.replyTo !== null && input.replyTo !== "visitor" && input.replyTo !== "none") {
    return { ok: false, reason: "contact:policy-invalid" };
  }

  return {
    ok: true,
    policy: Object.freeze({
      recipients: Object.freeze([...new Set(recipients)]),
      sender: input.sender,
      replyTo,
    }),
  };
}
