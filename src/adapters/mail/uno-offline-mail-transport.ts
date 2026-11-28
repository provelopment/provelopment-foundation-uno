/**
 * Foundation Uno — the offline mail adapter (`U05`).
 *
 * WHAT THIS IS. A driven adapter that implements the mail port without transmitting anything. It is selected only
 * when an operator explicitly asks for a non-transmitting demonstration, and it proves the whole authorised path —
 * publication, form identity, validation, composition, outcome mapping — with a provider-shaped result that says
 * plainly that nothing was sent.
 *
 * WHY IT EXISTS. Two reasons, both honest. The contact capability must be demonstrable and testable without a live
 * provider, and the direction forbids queueing, persistence and retry — so there is nothing to fake: the adapter
 * takes the message, reports `offline-accepted`, and keeps no copy, no log and no marker.
 *
 * WHAT IT IS NOT. Not a store, not a queue, not a mail catcher and not a silent success. `transmits` is `false`, and
 * the outcome literal is `offline-accepted`, so a caller cannot mistake it for delivery.
 */
import type { UnoMailMessage, UnoMailOutcome, UnoMailTransport } from "../../core/ports/uno-mail-transport";

/** The declared bound on what a demonstration will accept, so it cannot be used as an unbounded sink. */
export const UNO_OFFLINE_MAIL_LIMITS = Object.freeze({ textBytes: 8 * 1024, recipients: 5 });

/**
 * Create the offline adapter.
 *
 * `observed` is an optional recorder a test supplies to assert the composed message. It is never used in a
 * production composition, it stores nothing by itself, and the adapter keeps no reference after the call.
 */
export function createUnoOfflineMailTransport(observed?: (message: UnoMailMessage) => void): UnoMailTransport {
  return Object.freeze({
    name: "offline" as const,
    transmits: false,
    async send(message: UnoMailMessage): Promise<UnoMailOutcome> {
      if (message.to.length === 0 || message.to.length > UNO_OFFLINE_MAIL_LIMITS.recipients) {
        return { kind: "refused", reason: "mail:unauthorized-recipient" };
      }
      if (new TextEncoder().encode(message.text).length > UNO_OFFLINE_MAIL_LIMITS.textBytes) {
        return { kind: "refused", reason: "mail:invalid-message" };
      }
      if (observed !== undefined) {
        try {
          observed(message);
        } catch {
          // An observer's failure is the observer's; the demonstration outcome must not depend on it.
        }
      }
      return { kind: "offline-accepted" };
    },
  });
}
