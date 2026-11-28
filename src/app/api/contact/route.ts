/**
 * Foundation Uno — the contact submission endpoint (`U05`).
 *
 * WHAT THIS IS. One server-only App Router handler that accepts a bounded JSON submission, validates it with the closed contact
 * contract, applies a bounded abuse limiter, and — only when an operator has configured a validated `https` webhook — forwards
 * it once. It is the single place in the product that can transmit a visitor's words, and it is off in a default installation.
 *
 * HONESTY. The response never claims more than happened. `accepted` means the configured endpoint answered 2xx for this
 * submission; it does not claim the message was read, delivered to an inbox or stored. With no configuration the answer is
 * `not-configured` and nothing left the process. A peer refusal, a redirect, a timeout and a transport failure each answer their
 * own closed status, so a caller can never display a fabricated success.
 *
 * PRIVACY. Nothing is logged: not the body, not a field, not the caller's address, not even on failure. The forwarded payload is
 * exactly the three validated fields plus a bounded Page path — no IP, no user agent, no cookie, no clock, no identifier. The
 * response is `no-store` and carries no cookies.
 *
 * WHAT IT IS NOT. It is not a mail server, a queue, a CRM, a provider SDK, a retry engine or an analytics sink. It stores nothing
 * and holds no credential: the optional bearer token is read from the environment at call time and sent only to the already
 * allowlisted endpoint.
 */
import {
  isUnoContactSubmissionWithinBodyBound,
  validateUnoContactSubmission,
} from "../../../core/contact/uno-contact-submission";
import { createUnoContactRateLimiter } from "../../../core/contact/uno-contact-rate-limit";
import {
  deliverUnoContactSubmission,
  resolveUnoContactWebhookConfig,
  unoContactTransport,
} from "../../../adapters/contact/uno-contact-webhook";

/** Nothing about this route may be cached, prerendered or shared between visitors. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One bounded limiter for the process; the caller key is never stored beyond the bucket map. */
const takeToken = createUnoContactRateLimiter();

/** The closed response vocabulary of the endpoint. */
type UnoContactResponse =
  | { readonly status: "accepted" }
  | { readonly status: "invalid"; readonly reason: string }
  | { readonly status: "not-configured" }
  | { readonly status: "unavailable"; readonly reason: string }
  | { readonly status: "not-delivered"; readonly reason: string }
  | { readonly status: "too-many-requests"; readonly retryAfterSeconds: number }
  | { readonly status: "unsupported-media-type" }
  | { readonly status: "too-large" }
  | { readonly status: "method-not-allowed" };

/** Emit one closed JSON answer, never cached and never echoed. */
function answer(body: UnoContactResponse, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
}

/** A bounded, non-identifying caller key: the first forwarded address when present, else one shared bucket. */
function callerKey(request: Request): string {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded === null) return "unidentified";
    const first = forwarded.split(",")[0]?.trim() ?? "";
    return first.length > 0 && first.length <= 64 ? first : "unidentified";
  } catch {
    return "unidentified";
  }
}

/** The Page path the form reported, bounded and shape-checked; anything else becomes `unknown`. */
function pagePath(input: unknown): string {
  return typeof input === "string" && /^\/[A-Za-z0-9/_-]{0,120}$/u.test(input) ? input : "unknown";
}

/** Read the request body with the declared bound, or the refusal that stops the request. */
async function readBody(request: Request): Promise<string | "too-large" | "not-text"> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return "not-text";
  }
  return isUnoContactSubmissionWithinBodyBound(text) ? text : "too-large";
}

/** Accept one submission. The only side effect in the product that can reach a third party. */
export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return answer({ status: "unsupported-media-type" }, 415);

  const verdict = takeToken(callerKey(request));
  if (!verdict.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil(verdict.retryAfterMs / 1000));
    return answer({ status: "too-many-requests", retryAfterSeconds }, 429, { "retry-after": String(retryAfterSeconds) });
  }

  const body = await readBody(request);
  if (body === "too-large") return answer({ status: "too-large" }, 413);
  if (body === "not-text") return answer({ status: "invalid", reason: "contact:not-an-object" }, 400);

  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    return answer({ status: "invalid", reason: "contact:not-an-object" }, 400);
  }

  const record = typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
  // The form declares the Page it was authored on; every other key must be one of the closed fields, so the contract still refuses
  // an unexpected member rather than passing it downstream.
  const submissionInput = record === null
    ? null
    : Object.fromEntries(Object.entries(record).filter(([key]) => key !== "page"));
  const validated = validateUnoContactSubmission(submissionInput);
  if (!validated.accepted) return answer({ status: "invalid", reason: validated.reason }, 400);

  const configuration = resolveUnoContactWebhookConfig();
  if (configuration.status === "not-configured") return answer({ status: "not-configured" }, 503);
  if (configuration.status !== "configured") {
    // A present but refused configuration is an operator error, not a visitor error: nothing is sent, the reason stays bounded.
    return answer({ status: "unavailable", reason: configuration.reason ?? "contact:configuration-invalid" }, 503);
  }

  const delivery = await deliverUnoContactSubmission(
    { page: pagePath(record?.["page"]), submission: validated.submission },
    unoContactTransport,
  );

  switch (delivery.status) {
    case "accepted":
      // Accepted by the configured endpoint — never "delivered to an inbox", which this endpoint cannot know.
      return answer({ status: "accepted" }, 202);
    case "timeout":
      return answer({ status: "not-delivered", reason: "contact:timeout" }, 504);
    case "refused-destination":
      // A destination the connector refused after resolution: nothing was sent, and the reason names the refusal class only.
      return answer({ status: "not-delivered", reason: delivery.reason ?? "destination:private-address" }, 502);
    case "configuration-invalid":
      return answer({ status: "unavailable", reason: delivery.reason ?? "contact:configuration-invalid" }, 503);
    default:
      return answer({ status: "not-delivered", reason: `contact:${delivery.status}` }, 502);
  }
}

/** Every other method is refused by name, with the one method this endpoint implements. */
function refuseMethod(): Response {
  return answer({ status: "method-not-allowed" }, 405, { allow: "POST" });
}

/** One exported handler per refused method: Next's route analysis reads declared exports, not re-export aliases. */
export function GET(): Response {
  return refuseMethod();
}

export function HEAD(): Response {
  return refuseMethod();
}

export function PUT(): Response {
  return refuseMethod();
}

export function PATCH(): Response {
  return refuseMethod();
}

export function DELETE(): Response {
  return refuseMethod();
}

export function OPTIONS(): Response {
  return refuseMethod();
}
