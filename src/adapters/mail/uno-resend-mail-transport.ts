/**
 * Foundation Uno — the optional Resend mail adapter (`U05`).
 *
 * WHAT THIS IS. One server-only driven adapter behind `UnoMailTransport`. It is OFF by default, it is selected only
 * by an operator, it reads only its own five environment names, and it talks to exactly one fixed, validated HTTPS
 * destination through the pinned connector (`src/adapters/net/uno-pinned-https-transport.ts`) — which resolves the
 * host, refuses any private answer and dials only the address it validated.
 *
 * LEAST PRIVILEGE. The API key is read at call time (never baked into a build), sent only as a bearer header to the
 * fixed endpoint, and never returned, logged or echoed. The sender is a server-configured address that must belong
 * to a domain the operator listed as verified; the recipients are a server-allowlisted list; the visitor's address
 * is only ever a `Reply-To`. A visitor can therefore never choose a recipient or a sender.
 *
 * BOUNDED. One attempt, one request, one deadline, no redirect, no retry, no pool. A `3xx` is a refusal; a status
 * outside `2xx` is a refusal; an oversized answer is ambiguous; a timeout is ambiguous; the response body is never
 * parsed, echoed or stored.
 *
 * HONESTY. `accepted` means Resend accepted the message for delivery. It never means delivered, read or stored.
 * Nothing about the message, the key or the failure is written anywhere.
 */
import {
  isUnoMailAddress,
  parseUnoSender,
  unoMailDomain,
  type UnoParsedSender,
} from "../../core/contact/uno-contact-address";
import type { UnoMailMessage, UnoMailOutcome, UnoMailTransport } from "../../core/ports/uno-mail-transport";
import {
  createUnoPinnedTransport,
  type UnoHostResolver,
  type UnoPinnedOutcome,
  type UnoRequestFunction,
} from "../net/uno-pinned-https-transport";

/** The one destination this adapter will ever dial. Fixed by contract, not configurable from the environment. */
export const UNO_RESEND_ENDPOINT = "https://api.resend.com/emails";

/** The exact environment names this adapter reads. Nothing else is consulted. */
export const UNO_RESEND_ENV = Object.freeze({
  transport: "UNO_CONTACT_TRANSPORT",
  apiKey: "RESEND_API_KEY",
  from: "UNO_CONTACT_FROM",
  to: "UNO_CONTACT_TO",
  fromDomains: "UNO_CONTACT_FROM_DOMAINS",
} as const);

/** The declared bounds. Each is a limit, never a default. */
export const UNO_RESEND_LIMITS = Object.freeze({
  apiKeyLength: 200,
  recipients: 5,
  requestBytes: 8 * 1024,
  timeoutMs: 8000,
  responseBytes: 2048,
});

/** The validated configuration. Never logged, never returned to a visitor. */
export interface UnoResendConfig {
  readonly apiKey: string;
  readonly sender: UnoParsedSender;
  readonly recipients: readonly string[];
  readonly fromDomains: readonly string[];
}

/** A bounded environment read, so a hostile `process.env` cannot throw across the boundary. */
function readEnv(name: string): string | null {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

/** Split a comma list, bounded. */
function splitList(value: string | null): string[] {
  if (value === null) return [];
  return value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

/**
 * Resolve the adapter's configuration.
 *
 * `not-configured` is the normal shipped state. `configuration-invalid` means an operator set something the policy
 * refuses; delivery then stays off, never "try anyway", and the reason names the refusal class rather than a value.
 */
export function resolveUnoResendConfig(): {
  readonly status: "not-configured" | "configuration-invalid" | "configured";
  readonly config?: UnoResendConfig;
  readonly reason?: string;
} {
  const apiKey = readEnv(UNO_RESEND_ENV.apiKey);
  const from = readEnv(UNO_RESEND_ENV.from);
  const to = splitList(readEnv(UNO_RESEND_ENV.to));
  const fromDomains = splitList(readEnv(UNO_RESEND_ENV.fromDomains)).map((domain) => domain.toLowerCase());

  if (apiKey === null && from === null && to.length === 0) return { status: "not-configured" };

  if (apiKey === null || apiKey.length > UNO_RESEND_LIMITS.apiKeyLength || !apiKey.startsWith("re_")) {
    return { status: "configuration-invalid", reason: "mail:configuration-invalid" };
  }
  const sender = parseUnoSender(from);
  if (sender === null) return { status: "configuration-invalid", reason: "mail:configuration-invalid" };
  if (fromDomains.length === 0) return { status: "configuration-invalid", reason: "mail:configuration-invalid" };
  if (!fromDomains.includes(unoMailDomain(sender.address))) {
    return { status: "configuration-invalid", reason: "mail:unauthorized-sender" };
  }
  if (to.length === 0 || to.length > UNO_RESEND_LIMITS.recipients || !to.every(isUnoMailAddress)) {
    return { status: "configuration-invalid", reason: "mail:unauthorized-recipient" };
  }

  return {
    status: "configured",
    config: Object.freeze({
      apiKey,
      sender: Object.freeze({ address: sender.address, displayName: sender.displayName }),
      recipients: Object.freeze(to),
      fromDomains: Object.freeze(fromDomains),
    }),
  };
}


/** Compose the exact JSON body the provider receives. Plain text only: no HTML part, no attachment, no `cc`/`bcc`. */
function composeBody(config: UnoResendConfig, message: UnoMailMessage): string {
  return JSON.stringify({
    from: config.sender.displayName === null
      ? config.sender.address
      : `${config.sender.displayName} <${config.sender.address}>`,
    to: [...message.to],
    subject: message.subject,
    text: message.text,
    ...(message.replyTo === undefined ? {} : { reply_to: message.replyTo }),
  });
}

/** Map one pinned outcome onto the port's closed vocabulary. No provider text is read, so none can leak. */
function mapOutcome(outcome: UnoPinnedOutcome): UnoMailOutcome {
  if (outcome.kind === "refused") return { kind: "refused", reason: "mail:configuration-invalid" };
  if (outcome.kind === "timeout") return { kind: "ambiguous", reason: "mail:timeout" };
  if (outcome.kind === "error") return { kind: "ambiguous", reason: "mail:transport-error" };

  const status = outcome.status;
  if (status >= 300 && status < 400) return { kind: "ambiguous", reason: "mail:redirect-refused" };
  if (status >= 200 && status < 300) return { kind: "accepted", providerRef: null };
  if (status === 401 || status === 403) return { kind: "refused", reason: "mail:unauthorized-sender" };
  if (status === 422) return { kind: "refused", reason: "mail:invalid-message" };
  return { kind: "refused", reason: "mail:provider-rejected" };
}

/**
 * Create the Resend adapter.
 *
 * The request function and the configuration reader are injectable so a test proves every branch — acceptance,
 * refusal, redirect, timeout, oversized answer — with deterministic responses and without a key, a network or a
 * live send. Production resolves both at call time, never at import.
 */
export function createUnoResendMailTransport(options: {
  readonly request?: UnoRequestFunction;
  readonly resolve?: UnoHostResolver;
  readonly configuration?: () => ReturnType<typeof resolveUnoResendConfig>;
} = {}): UnoMailTransport {
  const send = createUnoPinnedTransport({
    ...(options.request === undefined ? {} : { request: options.request }),
    ...(options.resolve === undefined ? {} : { resolve: options.resolve }),
  });
  const readConfiguration = options.configuration ?? resolveUnoResendConfig;

  return Object.freeze({
    name: "resend" as const,
    transmits: true,
    async send(message: UnoMailMessage): Promise<UnoMailOutcome> {
      const resolved = readConfiguration();
      if (resolved.status === "not-configured") return { kind: "unavailable", reason: "mail:not-configured" };
      if (resolved.status !== "configured" || resolved.config === undefined) {
        return { kind: "unavailable", reason: "mail:configuration-invalid" };
      }
      const config = resolved.config;

      // Sender and recipients are policy, not input: the message may only name what the operator allowed.
      if (message.to.length === 0 || message.to.length > UNO_RESEND_LIMITS.recipients) {
        return { kind: "refused", reason: "mail:unauthorized-recipient" };
      }
      if (!message.to.every((recipient) => isUnoMailAddress(recipient) && config.recipients.includes(recipient))) {
        return { kind: "refused", reason: "mail:unauthorized-recipient" };
      }
      if (!isUnoMailAddress(message.from) || message.from !== config.sender.address) {
        return { kind: "refused", reason: "mail:unauthorized-sender" };
      }
      if (message.replyTo !== undefined && !isUnoMailAddress(message.replyTo)) {
        return { kind: "refused", reason: "mail:invalid-message" };
      }
      if (/[\r\n]/u.test(message.subject) || message.subject.length === 0) {
        return { kind: "refused", reason: "mail:invalid-message" };
      }

      const body = composeBody(config, message);
      if (new TextEncoder().encode(body).length > UNO_RESEND_LIMITS.requestBytes) {
        return { kind: "refused", reason: "mail:invalid-message" };
      }

      const outcome = await send(UNO_RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
          "idempotency-key": message.idempotencyKey,
        },
        body,
        totalTimeoutMs: UNO_RESEND_LIMITS.timeoutMs,
      });
      return mapOutcome(outcome);
    },
  });
}
