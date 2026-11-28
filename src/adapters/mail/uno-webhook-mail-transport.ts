/**
 * Foundation Uno — the pre-existing webhook as a mail transport (`U05`).
 *
 * WHAT THIS IS. The U05 webhook adapter, adapted to the mail port rather than replaced by it. An operator who
 * already configured `UNO_CONTACT_WEBHOOK_URL` keeps that path, through the same pinned connector and the same
 * destination policy, and the submission route stops needing to know which adapter answered.
 *
 * WHY KEEP IT. Removing a working, evidence-backed delivery option would be a regression dressed as progress. The
 * webhook remains the "bring your own receiver" choice; Resend is the provider choice; offline is the
 * non-transmitting demonstration. All three satisfy one port, so the application has one path.
 *
 * WHAT IT DOES NOT DO. It does not retry, queue, store, log or echo. It forwards the composed message once and
 * reports the closed outcome the pinned connector produced.
 */
import type { UnoMailMessage, UnoMailOutcome, UnoMailTransport } from "../../core/ports/uno-mail-transport";
import {
  createUnoContactTransport,
  deliverUnoContactSubmission,
  resolveUnoContactWebhookConfig,
  type UnoContactTransport,
} from "../contact/uno-contact-webhook";

/** The webhook transport: one POST of the composed message to the operator's allowlisted receiver. */
export function createUnoWebhookMailTransport(
  transport: UnoContactTransport = createUnoContactTransport(),
): UnoMailTransport {
  return Object.freeze({
    name: "webhook" as const,
    transmits: true,
    async send(message: UnoMailMessage): Promise<UnoMailOutcome> {
      const configuration = resolveUnoContactWebhookConfig();
      if (configuration.status === "not-configured") return { kind: "unavailable", reason: "mail:not-configured" };
      if (configuration.status !== "configured") {
        return { kind: "unavailable", reason: "mail:configuration-invalid" };
      }

      // The receiver gets the composed envelope plus the Reply-To, and never a provider secret.
      const delivery = await deliverUnoContactSubmission(
        {
          page: message.idempotencyKey,
          // The receiver gets the composed envelope; the reply address is only present when the private policy allows one.
          submission: { name: message.subject, email: message.replyTo ?? "", message: message.text },
        },
        transport,
      );

      switch (delivery.status) {
        case "accepted":
          return { kind: "accepted", providerRef: null };
        case "not-configured":
          return { kind: "unavailable", reason: "mail:not-configured" };
        case "configuration-invalid":
          return { kind: "unavailable", reason: "mail:configuration-invalid" };
        case "timeout":
          return { kind: "ambiguous", reason: "mail:timeout" };
        case "redirect-refused":
          return { kind: "ambiguous", reason: "mail:redirect-refused" };
        case "response-too-large":
          return { kind: "ambiguous", reason: "mail:response-too-large" };
        case "refused-destination":
          return { kind: "refused", reason: "mail:configuration-invalid" };
        case "network-error":
          return { kind: "ambiguous", reason: "mail:transport-error" };
        default:
          return { kind: "refused", reason: "mail:provider-rejected" };
      }
    },
  });
}
