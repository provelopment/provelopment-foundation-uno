/**
 * Foundation Uno — the contact delivery environment adapter (`U05`).
 *
 * WHAT THIS IS. The one place that reads the operator's private delivery configuration and the explicit form
 * enablement. It returns plain values; the pure policy in `src/core/contact/uno-contact-delivery-policy.ts` judges them.
 *
 * ENABLEMENT IS EXPLICIT AND BOUND. A form exists only when an operator (a) enables it, (b) names the exact
 * `facetId/siteId` it may serve, and (c) names the exact Page id whose declared form may submit. A public or private
 * contact property never enables anything: publication and delivery are separate capabilities, and neither implies the
 * other.
 *
 * WHAT IT IS NOT. It does not publish, render, compose or send, and it never logs or returns a value to a visitor.
 */
import {
  readUnoContactDeliveryPolicy,
  type UnoContactPolicyInput,
  type UnoContactPolicyResult,
} from "../../core/contact/uno-contact-delivery-policy";

/** The exact environment names this adapter reads. Nothing else is consulted. */
export const UNO_CONTACT_DELIVERY_ENV = Object.freeze({
  recipients: "UNO_CONTACT_RECIPIENT",
  sender: "UNO_CONTACT_SENDER",
  senderDomains: "UNO_CONTACT_SENDER_DOMAINS",
  replyTo: "UNO_CONTACT_REPLY_TO",
  formEnabled: "UNO_CONTACT_FORM_ENABLED",
  formSite: "UNO_CONTACT_FORM_SITE",
  formPage: "UNO_CONTACT_FORM_PAGE",
} as const);

/** A bounded environment read, so a hostile `process.env` cannot throw across the boundary. */
function readEnv(name: string): string | null {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

/** The operator's private delivery configuration, unjudged. */
export function readUnoContactPolicyInput(): UnoContactPolicyInput {
  return Object.freeze({
    recipients: readEnv(UNO_CONTACT_DELIVERY_ENV.recipients),
    sender: readEnv(UNO_CONTACT_DELIVERY_ENV.sender),
    senderDomains: readEnv(UNO_CONTACT_DELIVERY_ENV.senderDomains),
    replyTo: readEnv(UNO_CONTACT_DELIVERY_ENV.replyTo),
  });
}

/** The validated private delivery policy, or the closed reason there is none. */
export function readUnoContactPolicy(): UnoContactPolicyResult {
  return readUnoContactDeliveryPolicy(readUnoContactPolicyInput());
}

/** The explicit form declaration: whether a form may exist, for which Site, and on which Page. */
export interface UnoContactFormEnablement {
  readonly declared: boolean;
  /** `facetId/siteId`, or `null` when the operator declared none. */
  readonly site: string | null;
  /** The Page id whose declared form may submit, or `null`. */
  readonly page: string | null;
}

/** Read the explicit form declaration. The value `1` or `true` enables; anything else, or nothing, does not. */
export function readUnoContactFormEnablement(): UnoContactFormEnablement {
  const enabled = readEnv(UNO_CONTACT_DELIVERY_ENV.formEnabled);
  const declared = enabled === "1" || enabled?.toLowerCase() === "true";
  return Object.freeze({
    declared,
    site: readEnv(UNO_CONTACT_DELIVERY_ENV.formSite),
    page: readEnv(UNO_CONTACT_DELIVERY_ENV.formPage),
  });
}
