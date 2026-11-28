/**
 * Foundation Uno — the contact submission endpoint (`U05`, strengthened).
 *
 * WHAT THIS IS. One server-only App Router handler. It re-establishes the publication for the Page the visitor
 * says it used, reads the form reference from that Page's own validated document, applies the shared authorization
 * policy, validates the bounded submission, composes one plain-text message and hands it to exactly one transport
 * adapter — once.
 *
 * THE CLIENT IS NEVER THE AUTHORITY. The posted page path, form reference and Site are *claims*. The handler plans
 * the Page through the same publication authority that served it, refuses a claim that disagrees with what the
 * server proved, and reads the form identity from the Page itself instead of trusting a hidden field.
 *
 * HONESTY. `accepted` means a provider accepted the message; `accepted-not-sent` means the offline demonstration
 * took it and nothing left the process; `refused` means a known refusal; `ambiguous` means the result is unknown.
 * There is no retry, no queue, no store and no fallback adapter: one authorised attempt, one outcome.
 *
 * PRIVACY. Nothing is logged — not the body, a field, the caller's address, the recipient or the key. The response
 * is `no-store`, carries no cookie and echoes no value.
 */
import {
  isUnoContactSubmissionWithinBodyBound,
  UNO_CONTACT_LIMITS,
  validateUnoContactSubmission,
} from "../../../core/contact/uno-contact-submission";
import { createUnoContactRateLimiter } from "../../../core/contact/uno-contact-rate-limit";
import { authorizeUnoContactSubmission } from "../../../core/contact/uno-contact-authorization";
import { composeUnoContactMessage } from "../../../core/contact/uno-contact-message";
import { planUnoServingPage, readUnoServingContactFacts } from "../../../config/uno-serving";
import { selectUnoMailTransport } from "../../../adapters/mail/uno-mail-transport-selection";
import { readUnoContactPolicy } from "../../../adapters/mail/uno-contact-delivery-environment";

/** Nothing about this route may be cached, prerendered or shared between visitors. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One bounded limiter for the process. The caller key is never stored beyond the bucket map. */
const takeToken = createUnoContactRateLimiter();

/** The closed response vocabulary of the endpoint. */
type UnoContactResponse =
  | { readonly status: "accepted" }
  | { readonly status: "accepted-not-sent" }
  | { readonly status: "invalid"; readonly reason: string }
  | { readonly status: "off"; readonly reason: string }
  | { readonly status: "unauthorized"; readonly reason: string }
  | { readonly status: "unavailable"; readonly reason: string }
  | { readonly status: "refused"; readonly reason: string }
  | { readonly status: "ambiguous"; readonly reason: string }
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

/** The verified request host, preferring the platform's forwarded host over the internal address. */
function requestHost(request: Request): string {
  try {
    const forwarded = request.headers.get("x-forwarded-host");
    if (forwarded !== null) {
      const first = forwarded.split(",")[0]?.trim() ?? "";
      if (first.length > 0 && first.length <= 255) return first;
    }
    return new URL(request.url).host;
  } catch {
    return "";
  }
}

/**
 * Request integrity: when a browser sends `Origin`, its host must be the host this request arrived on.
 *
 * An absent `Origin` is not refused — a non-browser client legitimately sends none, and the only effect of this
 * endpoint is one message to the Site's own recipient.
 */
function originAgrees(request: Request, host: string): boolean {
  try {
    const origin = request.headers.get("origin");
    if (origin === null) return true;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}


/** Read the body as a bounded stream: stop reading the moment the declared bound is exceeded. */
async function readBoundedBody(
  request: Request,
): Promise<{ readonly ok: true; readonly text: string } | { readonly ok: false; readonly reason: "too-large" | "unreadable" }> {
  const body = request.body;
  if (body === null) return { ok: false, reason: "unreadable" };
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined) continue;
      total += value.byteLength;
      if (total > UNO_CONTACT_LIMITS.bodyBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: "too-large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "unreadable" };
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (!isUnoContactSubmissionWithinBodyBound(text)) return { ok: false, reason: "too-large" };
  return { ok: true, text };
}

/** One bounded claim from the body: a string of at most `limit` characters matching `pattern`, or `null`. */
function claim(value: unknown, limit: number, pattern: RegExp): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= limit && pattern.test(value) ? value : null;
}


/** Accept one submission. The only side effect in the product that can reach a third party. */
export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return answer({ status: "unsupported-media-type" }, 415);

  const host = requestHost(request);
  if (host.length === 0) return answer({ status: "unauthorized", reason: "contact:publication-unproven" }, 403);
  if (!originAgrees(request, host)) return answer({ status: "unauthorized", reason: "contact:origin-refused" }, 403);

  const verdict = takeToken(callerKey(request));
  if (!verdict.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil(verdict.retryAfterMs / 1000));
    return answer({ status: "too-many-requests", retryAfterSeconds }, 429, { "retry-after": String(retryAfterSeconds) });
  }

  const body = await readBoundedBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? answer({ status: "too-large" }, 413)
      : answer({ status: "invalid", reason: "contact:not-an-object" }, 400);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text) as unknown;
  } catch {
    return answer({ status: "invalid", reason: "contact:not-an-object" }, 400);
  }
  const record =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  if (record === null) return answer({ status: "invalid", reason: "contact:not-an-object" }, 400);

  // The three routing claims, bounded and shape-checked before anything is planned.
  const claimedPage = claim(record["page"], 160, /^\/[A-Za-z0-9/_-]{0,120}$/u);
  const claimedForm = claim(record["formRef"], 64, /^[a-z0-9][a-z0-9-]{0,63}$/u);
  const claimedSite =
    record["siteId"] === undefined ? null : claim(record["siteId"], 64, /^[a-z0-9][a-z0-9-]{0,63}$/u);
  if (claimedPage === null) return answer({ status: "unauthorized", reason: "contact:page-mismatch" }, 403);

  // Re-establish the publication the visitor claims to have used. A refusal here ends the request.
  const planned = await planUnoServingPage({ host, pathname: claimedPage });
  if (planned.status !== "served") {
    return answer({ status: "unauthorized", reason: "contact:publication-unproven" }, 403);
  }
  const page = planned.page;
  const sections = page.document.kind === "json" ? page.document.pageDocument?.sections : undefined;
  const facts = readUnoServingContactFacts({
    facetId: page.identity.facetId,
    siteId: page.identity.siteId,
    host,
    canonicalUrl: page.delivery.canonicalUrl,
    publicPage: page.delivery.public,
    routePath: claimedPage,
    pageId: page.identity.pageId,
    sections,
  });

  const authorization = authorizeUnoContactSubmission({
    publication: {
      served: true,
      public: page.delivery.public,
      siteId: page.identity.siteId,
      facetId: page.identity.facetId,
      routePath: claimedPage,
      localeTag: page.identity.localeTag,
    },
    declaration: { declared: facts.formRef !== null, formRef: facts.formRef },
    enablement: {
      site: facts.formEnabled ? "enabled" : "undeclared",
      form: facts.formRef === null ? "undeclared" : "enabled",
      placement: facts.placement,
      transport: facts.transport,
    },
    submission: { formRef: claimedForm, page: claimedPage, siteId: claimedSite },
  });
  if (authorization.kind === "refused") {
    const status = authorization.outcome === "unavailable" ? 503 : authorization.outcome === "off" ? 409 : 403;
    return answer({ status: authorization.outcome, reason: authorization.reason }, status);
  }
  const identity = authorization.identity;

  // The closed field contract still owns shape: the routing claims are removed and every other key must be known.
  const submissionInput = Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== "page" && key !== "formRef" && key !== "siteId"),
  );
  const validated = validateUnoContactSubmission(submissionInput);
  if (!validated.accepted) return answer({ status: "invalid", reason: validated.reason }, 400);

  const composed = composeUnoContactMessage({ identity, submission: validated.submission, siteName: null });
  if (!composed.ok) return answer({ status: "invalid", reason: composed.reason }, 413);

  const selection = selectUnoMailTransport();
  if (selection.status !== "selected") {
    return answer(
      { status: "unavailable", reason: selection.status === "invalid" ? selection.reason : "mail:not-configured" },
      503,
    );
  }

  // The delivery policy is server configuration, independent of every public contact fact: the recipient, the sender
  // and whether a Reply-To is used are decided here and nowhere else.
  const policyResult = readUnoContactPolicy();
  if (!policyResult.ok) {
    return answer({ status: "unavailable", reason: policyResult.reason }, 503);
  }
  const policy = policyResult.policy;

  const outcome = await selection.transport.send({
    to: policy.recipients,
    from: policy.sender,
    ...(policy.replyTo === "visitor" ? { replyTo: validated.submission.email } : {}),
    subject: composed.message.subject,
    text: composed.message.text,
    idempotencyKey: composed.message.idempotencyKey,
  });

  switch (outcome.kind) {
    case "accepted":
      return answer({ status: "accepted" }, 202);
    case "offline-accepted":
      return answer({ status: "accepted-not-sent" }, 202);
    case "refused":
      return answer({ status: "refused", reason: outcome.reason }, 502);
    case "unavailable":
      return answer({ status: "unavailable", reason: outcome.reason }, 503);
    default:
      return answer({ status: "ambiguous", reason: outcome.reason }, 504);
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

