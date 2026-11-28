/**
 * Foundation Uno — the mail transport selection (`U05`).
 *
 * WHAT THIS IS. The one place an operator's choice of delivery is read. `UNO_CONTACT_TRANSPORT` is the only
 * selector: absent means no transport at all (the shipped state), `offline` means the non-transmitting
 * demonstration adapter, `resend` means the provider adapter — and only when its own configuration validates.
 *
 * FAIL-CLOSED. An unknown selector, or `resend` with an incomplete or refused configuration, selects nothing and
 * reports why. There is no "best effort" branch and no fallback from one adapter to another: a Site that asked for
 * a provider and did not configure one gets `unavailable`, never a silent offline acceptance.
 */
import type { UnoMailTransport } from "../../core/ports/uno-mail-transport";
import { createUnoOfflineMailTransport } from "./uno-offline-mail-transport";
import { createUnoResendMailTransport, resolveUnoResendConfig } from "./uno-resend-mail-transport";
import { createUnoWebhookMailTransport } from "./uno-webhook-mail-transport";
import { resolveUnoContactWebhookConfig } from "../contact/uno-contact-webhook";

/** The exact environment name this selection reads. */
export const UNO_MAIL_SELECTION_ENV = Object.freeze({ transport: "UNO_CONTACT_TRANSPORT" } as const);

/** The two selectable adapters. */
export const UNO_MAIL_SELECTIONS = Object.freeze(["offline", "resend"] as const);
export type UnoMailSelectionName = (typeof UNO_MAIL_SELECTIONS)[number];

/** The selection: nothing, a chosen adapter, or the closed reason nothing was chosen. */
export type UnoMailSelection =
  | { readonly status: "none" }
  | { readonly status: "invalid"; readonly reason: "mail:configuration-invalid" | "mail:unauthorized-sender" | "mail:unauthorized-recipient" | "mail:not-configured" }
  | {
      readonly status: "selected";
      readonly transport: UnoMailTransport;
      /** `provider` transmits; `offline` demonstrably does not. */
      readonly kind: "offline" | "provider";
    };

/** A bounded environment read, so a hostile `process.env` cannot throw across the boundary. */
function readSelection(): string | null {
  try {
    const value = process.env[UNO_MAIL_SELECTION_ENV.transport];
    return typeof value === "string" && value.trim().length > 0 ? value.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the transport an operator selected, or the reason none is available.
 *
 * Called per request, deliberately: the selector is read at call time so a redeploy is the only way it changes, and
 * no adapter instance is shared across requests.
 */
export function selectUnoMailTransport(): UnoMailSelection {
  const selected = readSelection();
  if (selected === null) {
    // Backwards compatibility with the pre-existing U05 webhook: an operator who configured it keeps it, and the
    // selection stays "none" only when nothing at all is configured.
    if (resolveUnoContactWebhookConfig().status === "configured") {
      return { status: "selected", transport: createUnoWebhookMailTransport(), kind: "provider" };
    }
    return { status: "none" };
  }
  if (selected === "offline") {
    return { status: "selected", transport: createUnoOfflineMailTransport(), kind: "offline" };
  }
  if (selected === "resend") {
    const configuration = resolveUnoResendConfig();
    if (configuration.status === "not-configured") return { status: "invalid", reason: "mail:not-configured" };
    if (configuration.status !== "configured") {
      const reason = configuration.reason;
      const closed =
        reason === "mail:unauthorized-sender" || reason === "mail:unauthorized-recipient"
          ? reason
          : "mail:configuration-invalid";
      return { status: "invalid", reason: closed };
    }
    return { status: "selected", transport: createUnoResendMailTransport(), kind: "provider" };
  }
  // An unrecognised selector is refused rather than ignored: a typo must not silently disable a configured provider.
  return { status: "invalid", reason: "mail:configuration-invalid" };
}
