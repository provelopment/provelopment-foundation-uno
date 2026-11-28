/**
 * Foundation Uno — the optional server-only contact webhook (`U05`).
 *
 * WHAT THIS IS. One adapter that reads a **server-only** configuration from the environment, validates it against the
 * public-destination policy and a declared host allowlist, and — only then — forwards one already-validated submission to that
 * exact `https` endpoint. Delivery is OFF by default: with no configuration the adapter answers `not-configured` and no
 * socket is opened, so the shipped product has no transport at all.
 *
 * WHAT IT REFUSES. A non-`https` URL, a URL carrying credentials, a port, an IP literal, any private or link-local address, a
 * host outside the declared allowlist, and any redirect the peer returns (`redirect: "manual"`, so a 3xx is a refusal and never
 * a second request). A response body is read only after a successful status and only up to a small bound; nothing from it is
 * echoed to the caller.
 *
 * WHAT IT NEVER DOES. It never logs, stores, retries, queues or echoes the submission — not the body, not a field, not the
 * caller's address. It distinguishes an **accepted submission** from a **confirmed delivery** by returning one closed status,
 * and `accepted` is only ever produced by a 2xx response from the configured endpoint.
 *
 * IMPORT-CONTROL. This module is imported only by the contact route handler, which is server-only. It imports no React and no
 * client component, and it reads `process.env` inside the call rather than at module scope, so no value is baked into a build.
 */
import { isUnoAllowlistedHost, classifyPublicHttpsDestination } from "../../core/efs/uno-public-destination";
import type { UnoContactSubmissionAccepted } from "../../core/contact/uno-contact-submission";

/** The exact environment names this adapter reads. Nothing else is consulted. */
export const UNO_CONTACT_WEBHOOK_ENV = Object.freeze({
  url: "UNO_CONTACT_WEBHOOK_URL",
  hosts: "UNO_CONTACT_WEBHOOK_HOSTS",
  token: "UNO_CONTACT_WEBHOOK_TOKEN",
} as const);

/** The declared transport bounds. */
export const UNO_CONTACT_WEBHOOK_LIMITS = Object.freeze({
  timeoutMs: 8000,
  responseBytes: 2048,
  requestBytes: 8 * 1024,
});

/** Why delivery did not happen, or that it did. Every literal is closed. */
export type UnoContactDeliveryStatus =
  | "not-configured"
  | "configuration-invalid"
  | "accepted"
  | "provider-rejected"
  | "redirect-refused"
  | "timeout"
  | "network-error"
  | "response-too-large";

/** The delivery outcome: one status, plus the peer's HTTP status when there was one. */
export interface UnoContactDeliveryOutcome {
  readonly status: UnoContactDeliveryStatus;
  readonly httpStatus?: number;
  /** A bounded, non-sensitive explanation for operators. Never contains a field value. */
  readonly reason?: string;
}

/** The resolved server-only configuration. `null` means delivery is off. */
export interface UnoContactWebhookConfig {
  readonly url: string;
  readonly host: string;
  readonly token: string | null;
}

/** A bounded environment accessor, so a hostile `process.env` cannot throw across the boundary. */
function readEnv(name: string): string | null {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the webhook configuration.
 *
 * `{ status: "not-configured" }` is the normal shipped state. `{ status: "configuration-invalid" }` means an operator set
 * something the policy refuses: delivery stays off — never "try anyway" — and the reason names the refusal class, not the value.
 */
export function resolveUnoContactWebhookConfig(): {
  readonly status: "not-configured" | "configuration-invalid" | "configured";
  readonly config?: UnoContactWebhookConfig;
  readonly reason?: string;
} {
  const url = readEnv(UNO_CONTACT_WEBHOOK_ENV.url);
  if (url === null) return { status: "not-configured" };

  const allowlistText = readEnv(UNO_CONTACT_WEBHOOK_ENV.hosts);
  if (allowlistText === null) return { status: "configuration-invalid", reason: "contact:allowlist-missing" };
  const allowlist = allowlistText.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (allowlist.length === 0) return { status: "configuration-invalid", reason: "contact:allowlist-missing" };

  const destination = classifyPublicHttpsDestination(url);
  if (!destination.accepted) return { status: "configuration-invalid", reason: destination.reason };
  if (!isUnoAllowlistedHost(destination.host, allowlist)) {
    return { status: "configuration-invalid", reason: "destination:not-allowlisted" };
  }

  const token = readEnv(UNO_CONTACT_WEBHOOK_ENV.token);
  return { status: "configured", config: Object.freeze({ url: destination.href, host: destination.host, token }) };
}

/** The exact body forwarded: the three validated fields plus the Page path they were authored on. No address, no agent, no clock. */
export interface UnoContactDeliveryPayload {
  /** A bounded, non-authoritative Page path supplied by the form, matching `^/[A-Za-z0-9/_-]{0,120}$`. */
  readonly page: string;
  // The validated fields, never the caller's request.
  readonly submission: UnoContactSubmissionAccepted["submission"];
}

/** The injected transport: exactly the two `fetch` facts this adapter needs, so a test can drive it without a socket. */
export type UnoContactTransport = (
  url: string,
  init: {
    readonly method: "POST";
    readonly headers: Record<string, string>;
    readonly body: string;
    readonly redirect: "manual";
    readonly signal: AbortSignal;
    readonly cache: "no-store";
  },
) => Promise<{ readonly status: number; readonly text: () => Promise<string> }>;

/** Read at most the declared number of bytes from one response body. */
async function readBoundedBody(response: { text: () => Promise<string> }): Promise<string | null> {
  try {
    const text = await response.text();
    return new TextEncoder().encode(text).length <= UNO_CONTACT_WEBHOOK_LIMITS.responseBytes ? text : null;
  } catch {
    return "";
  }
}

/**
 * Forward one validated submission to the configured endpoint.
 *
 * Order of proof: configuration resolved and valid (otherwise no transport exists), body serialized and bounded, then one POST
 * with redirects forbidden and a hard timeout. A 2xx is `accepted`; a 3xx is `redirect-refused`; any other status is
 * `provider-rejected`; an abort is `timeout`; anything else is `network-error`. Nothing about the submission is logged or
 * returned, and the peer's body is never echoed.
 */
export async function deliverUnoContactSubmission(
  payload: UnoContactDeliveryPayload,
  transport: UnoContactTransport,
): Promise<UnoContactDeliveryOutcome> {
  const resolved = resolveUnoContactWebhookConfig();
  if (resolved.status === "not-configured") return { status: "not-configured" };
  if (resolved.status !== "configured" || resolved.config === undefined) {
    return { status: "configuration-invalid", reason: resolved.reason ?? "contact:configuration-invalid" };
  }

  const body = JSON.stringify({
    source: "uno-contact",
    page: payload.page,
    submission: payload.submission,
  });
  if (new TextEncoder().encode(body).length > UNO_CONTACT_WEBHOOK_LIMITS.requestBytes) {
    return { status: "configuration-invalid", reason: "contact:payload-too-large" };
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (resolved.config.token !== null) headers["authorization"] = `Bearer ${resolved.config.token}`;

  let response: { readonly status: number; readonly text: () => Promise<string> };
  try {
    response = await transport(resolved.config.url, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(UNO_CONTACT_WEBHOOK_LIMITS.timeoutMs),
    });
  } catch (error) {
    const name = typeof error === "object" && error !== null ? (error as { name?: unknown }).name : null;
    return name === "TimeoutError" || name === "AbortError" ? { status: "timeout" } : { status: "network-error" };
  }

  if (response.status >= 300 && response.status < 400) return { status: "redirect-refused", httpStatus: response.status };
  if (response.status >= 400) return { status: "provider-rejected", httpStatus: response.status };
  if (response.status < 200 || response.status > 299) return { status: "provider-rejected", httpStatus: response.status };

  const text = await readBoundedBody(response);
  if (text === null) return { status: "response-too-large", httpStatus: response.status };
  return { status: "accepted", httpStatus: response.status };
}

/** The real transport: the platform `fetch`, resolved at call time so no test can leak into production. */
export const unoContactFetchTransport: UnoContactTransport = (url, init) => fetch(url, init);

