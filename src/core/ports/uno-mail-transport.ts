/**
 * Foundation Uno — the mail transport port (`U05`).
 *
 * WHAT THIS IS. The inward-owned contract a contact delivery adapter must satisfy. The application asks the port
 * to send one already-composed message and receives one closed outcome; it never learns which provider answered,
 * never sees a credential and never reads a provider body.
 *
 * WHY A PORT. The domain must not depend on a provider. `src/adapters/mail/uno-resend-mail-transport.ts` is one
 * driven adapter; `src/adapters/mail/uno-offline-mail-transport.ts` is another. The composition root chooses, and
 * an unconfigured installation chooses neither, so the shipped default has no network path at all.
 *
 * WHAT THIS PORT IS NOT. Not a queue, not a retry engine, not a scheduler and not a store. `send` is called at most
 * once per authorised submission, by the caller, and a failure is reported rather than retried.
 */

/** One fully composed message. Every field is server-decided; none is visitor-controlled except `replyTo`, which is validated. */
export interface UnoMailMessage {
  /** Server-allowlisted recipients. Never a visitor-selected address, never an authored free field. */
  readonly to: readonly string[];
  /** The verified sender identity an operator configured. */
  readonly from: string;
  /** The visitor's validated address, used only as `Reply-To`. */
  readonly replyTo?: string;
  /** A server-composed subject line. Bounded, single-line, no header separators. */
  readonly subject: string;
  /** The plain-text body. No HTML, no attachments, no headers. */
  readonly text: string;
  /**
   * An opaque, non-PII key for one authorised attempt, so a duplicate request cannot become a duplicate message.
   * It is derived from the attempt, never from the visitor's identity, and carries no address or body content.
   */
  readonly idempotencyKey: string;
}

/** Why a transport could not accept a message. Closed; no provider text and no credential is ever included. */
export type UnoMailRefusalReason =
  | "mail:not-configured"
  | "mail:configuration-invalid"
  | "mail:invalid-message"
  | "mail:unauthorized-sender"
  | "mail:unauthorized-recipient"
  | "mail:provider-rejected"
  | "mail:redirect-refused"
  | "mail:response-too-large"
  | "mail:timeout"
  | "mail:transport-error";

/**
 * One transport outcome.
 *
 * `accepted` means the provider accepted the message for delivery — never that it was delivered. `offline-accepted`
 * means the offline adapter took it and **nothing was sent**, which is the state a non-transmitting demonstration
 * reports. `ambiguous` means the exchange failed in a way that leaves the result unknown; it is never retried here
 * and never reported as success.
 */
export type UnoMailOutcome =
  | { readonly kind: "accepted"; readonly providerRef: string | null }
  | { readonly kind: "offline-accepted" }
  | { readonly kind: "refused"; readonly reason: UnoMailRefusalReason }
  | { readonly kind: "unavailable"; readonly reason: "mail:not-configured" | "mail:configuration-invalid" }
  | {
      readonly kind: "ambiguous";
      readonly reason: "mail:timeout" | "mail:transport-error" | "mail:response-too-large" | "mail:redirect-refused";
    };

/** The port. One call, one outcome, no state. */
export interface UnoMailTransport {
  /** Which adapter answered, for operator diagnostics. Never a provider secret. */
  readonly name: "resend" | "offline" | "webhook";
  /** True when this adapter can actually transmit. The offline adapter answers `false` and says so. */
  readonly transmits: boolean;
  send(message: UnoMailMessage): Promise<UnoMailOutcome>;
}
