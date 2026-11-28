/**
 * Foundation Uno — the optional server-only contact webhook (`U05`).
 *
 * WHAT THIS IS. One adapter that reads a **server-only** configuration from the environment, validates it against the
 * public-destination policy and a declared host allowlist, and — only then — forwards one already-validated submission through
 * the pinned connector, which resolves the host, refuses any private answer and dials only the address it checked. Delivery is OFF
 * by default: with no configuration the adapter answers `not-configured` and no socket is opened, so the shipped product has no
 * transport at all.
 *
 * WHAT IT REFUSES. A non-`https` URL, a URL carrying credentials, a port, an IP literal, any private, loopback, link-local,
 * reserved or mapped address — lexically and again after resolution — a host outside the declared allowlist, a resolver that
 * answers with a private address, and any redirect the peer returns. A `3xx` is a status this adapter refuses; it is never followed.
 *
 * WHAT IT NEVER DOES. It never logs, stores, retries, queues or echoes the submission — not the body, not a field, not the caller's
 * address. It distinguishes an **accepted submission** from a **confirmed delivery** by returning one closed status, and `accepted`
 * is only ever produced by a 2xx response from the configured endpoint.
 *
 * TEST SEAM. `UNO_CONTACT_WEBHOOK_TEST_LOOPBACK` and `UNO_CONTACT_WEBHOOK_TIMEOUT_MS` exist so the enabled path can be proven end to
 * end against a deterministic local receiver through the real production build. They are read here and nowhere else, they are
 * never committed, the readiness gate refuses them, and with the seam off a loopback or plaintext destination is refused like any
 * other.
 *
 * IMPORT-CONTROL. This module is imported only by the contact route handler, which is server-only. It imports no React and no client
 * component, and it reads `process.env` inside the call rather than at module scope, so no value is baked into a build.
 */
import type { UnoContactSubmissionAccepted } from "../../core/contact/uno-contact-submission";
import {
  classifyPublicHttpsDestination,
  isUnoAllowlistedHost,
} from "../../core/efs/uno-public-destination";
import {
  UNO_PINNED_HTTPS_LIMITS,
  createUnoPinnedTransport,
  type UnoHostResolver,
  type UnoPinnedOutcome,
  type UnoRequestFunction,
} from "../net/uno-pinned-https-transport";

/** The exact environment names this adapter reads. Nothing else is consulted. */
export const UNO_CONTACT_WEBHOOK_ENV = Object.freeze({
  url: "UNO_CONTACT_WEBHOOK_URL",
  hosts: "UNO_CONTACT_WEBHOOK_HOSTS",
  token: "UNO_CONTACT_WEBHOOK_TOKEN",
  testLoopback: "UNO_CONTACT_WEBHOOK_TEST_LOOPBACK",
  timeoutMs: "UNO_CONTACT_WEBHOOK_TIMEOUT_MS",
} as const);

/** The declared transport bounds. */
export const UNO_CONTACT_WEBHOOK_LIMITS = Object.freeze({
  timeoutMs: UNO_PINNED_HTTPS_LIMITS.totalTimeoutMs,
  responseBytes: UNO_PINNED_HTTPS_LIMITS.responseBytes,
  requestBytes: 8 * 1024,
});

/** Why delivery did not happen, or that it did. Every literal is closed. */
export type UnoContactDeliveryStatus =
  | "not-configured"
  | "configuration-invalid"
  | "accepted"
  | "provider-rejected"
  | "redirect-refused"
  | "response-too-large"
  | "refused-destination"
  | "timeout"
  | "network-error";

/** The delivery outcome: one status, plus the peer's HTTP status when there was one. */
export interface UnoContactDeliveryOutcome {
  readonly status: UnoContactDeliveryStatus;
  readonly httpStatus?: number;
  /** A bounded, non-sensitive explanation for operators. Never contains a field value. */
  readonly reason?: string;
}

/** The resolved server-only configuration. */
export interface UnoContactWebhookConfig {
  /** The exact URL the connector will dial, already classified and allowlisted. */
  readonly url: string;
  readonly host: string;
  readonly token: string | null;
  /** True only under the documented test seam; production never resolves this to true. */
  readonly testLoopback: boolean;
  /** The whole-exchange bound, `UNO_CONTACT_WEBHOOK_LIMITS.timeoutMs` unless the test seam shortens it. */
  readonly totalTimeoutMs: number;
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

/** Parse the test-seam timeout, bounded to a value that keeps a gate fast without allowing an unbounded exchange. */
function testTimeout(): number {
  const raw = readEnv(UNO_CONTACT_WEBHOOK_ENV.timeoutMs);
  if (raw === null) return UNO_CONTACT_WEBHOOK_LIMITS.timeoutMs;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 100 || parsed > UNO_CONTACT_WEBHOOK_LIMITS.timeoutMs) {
    return UNO_CONTACT_WEBHOOK_LIMITS.timeoutMs;
  }
  return parsed;
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

  const testLoopback = readEnv(UNO_CONTACT_WEBHOOK_ENV.testLoopback) === "1";
  const destination = classifyPublicHttpsDestination(url);
  if (!destination.accepted) {
    // The seam admits exactly one extra shape — a loopback literal — and nothing else about the policy changes.
    const seam = testLoopback ? /^http:\/\/127\.0\.0\.1:(\d{1,5})\/[A-Za-z0-9./_-]*$/u.exec(url) : null;
    if (seam === null) return { status: "configuration-invalid", reason: destination.reason };
    const host = "127.0.0.1";
    if (!isUnoAllowlistedHost(host, allowlist)) {
      return { status: "configuration-invalid", reason: "destination:not-allowlisted" };
    }
    const token = readEnv(UNO_CONTACT_WEBHOOK_ENV.token);
    return {
      status: "configured",
      config: Object.freeze({ url, host, token, testLoopback: true, totalTimeoutMs: testTimeout() }),
    };
  }
  if (!isUnoAllowlistedHost(destination.host, allowlist)) {
    return { status: "configuration-invalid", reason: "destination:not-allowlisted" };
  }

  const token = readEnv(UNO_CONTACT_WEBHOOK_ENV.token);
  return {
    status: "configured",
    config: Object.freeze({
      url: destination.href,
      host: destination.host,
      token,
      testLoopback: false,
      totalTimeoutMs: UNO_CONTACT_WEBHOOK_LIMITS.timeoutMs,
    }),
  };
}

/** The exact body forwarded: the three validated fields plus the Page path they were authored on. No address, no agent, no clock. */
export interface UnoContactDeliveryPayload {
  /** A bounded, non-authoritative Page path supplied by the form, matching `^/[A-Za-z0-9/_-]{0,120}$`. */
  readonly page: string;
  // The validated fields, never the caller's request.
  readonly submission: UnoContactSubmissionAccepted["submission"];
}

/** The injected connector: the pinned sender, or a recorder in a test. */
export type UnoContactTransport = (
  url: string,
  init: {
    readonly method: "POST";
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly allowLoopback: boolean;
    readonly totalTimeoutMs: number;
  },
) => Promise<UnoPinnedOutcome>;


/**
 * Forward one validated submission to the configured endpoint.
 *
 * Order of proof: configuration resolved and valid (otherwise no connector exists), body serialized and bounded, then one send.
 * The connector resolves the host, refuses a private answer, pins the validated address and refuses a redirect. A 2xx is
 * `accepted`; a `3xx` is `redirect-refused`; any other status is `provider-rejected`; an oversized body is `response-too-large`; a
 * refused destination is `refused-destination`; an expired exchange is `timeout`; anything else is `network-error`. Nothing about
 * the submission is logged or returned, and the peer's body is never echoed.
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

  const outcome = await transport(resolved.config.url, {
    method: "POST",
    headers,
    body,
    allowLoopback: resolved.config.testLoopback,
    totalTimeoutMs: resolved.config.totalTimeoutMs,
  });

  switch (outcome.kind) {
    case "refused":
      return { status: "refused-destination", reason: outcome.reason };
    case "timeout":
      return { status: "timeout" };
    case "error":
      return { status: "network-error" };
    default:
      break;
  }

  if (outcome.status >= 300 && outcome.status < 400) return { status: "redirect-refused", httpStatus: outcome.status };
  if (outcome.status < 200 || outcome.status > 299) return { status: "provider-rejected", httpStatus: outcome.status };
  if (outcome.bodyBytes > UNO_CONTACT_WEBHOOK_LIMITS.responseBytes) {
    return { status: "response-too-large", httpStatus: outcome.status };
  }
  return { status: "accepted", httpStatus: outcome.status };
}

/**
 * The production connector, built on the pinned sender.
 *
 * The resolver and the request function are injected so a test can prove the refusal path and the pinning without a network, and so
 * production reads neither at import time.
 */
export function createUnoContactTransport(seams: {
  readonly resolve?: UnoHostResolver;
  readonly request?: UnoRequestFunction;
} = {}): UnoContactTransport {
  const send = createUnoPinnedTransport(seams);
  return (url, init) => send(url, init);
}

/** The transport the route handler uses: the real pinned connector, with no injected seam. */
export const unoContactTransport: UnoContactTransport = createUnoContactTransport();
