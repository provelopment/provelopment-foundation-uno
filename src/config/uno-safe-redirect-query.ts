/**
 * Foundation Uno — the pure safe-redirect-query validator (`UNO-WO-099 / R01`).
 *
 * WHY. A declared Site-address alias and a stored short-language alias both redirect to a canonical address the validated
 * serving decision already granted. A harmless query (`?ref=alpha%20beta&view=compact`) is ordinary campaign metadata and
 * must survive that redirect **byte for byte**; a hostile query must never become a `Location`, a body, a header or a log
 * line. This module is the whole lexical answer to that question.
 *
 * IT IS A SHAPE CHECK, NOT AN AUTHORITY. It takes no Site, host, locale, pathname, file, clock, environment, header,
 * cookie or network, and it can never name a destination: the thin edge alone appends its own accepted answer to a
 * location the serving decision already proved. It returns the accepted query unchanged except for one documented,
 * idempotent space normalization (`+` → `%20`) that exists because the framework re-serialises the query before the edge
 * runs, so the wire spelling of a space is no longer visible; order, duplicates and every other byte are never rewritten.
 *
 * THE BUDGET. The limits below are security budgets — how much untrusted bytes may ride on one redirect — not a product
 * cap on Sites, Pages, locales or content. A refusal is a refusal of that query only; it says nothing about whether the
 * destination Page is public.
 */

/** The finite bounds one accepted query must fit: total bytes, parameters, one key, one value. */
export const UNO_SAFE_REDIRECT_QUERY_LIMITS = Object.freeze({
  /** The whole suffix, including its leading `?`. */
  bytes: 512,
  parameters: 8,
  keyBytes: 32,
  valueBytes: 256,
});

/** The closed refusal vocabulary of this validator: one literal per failure family. */
export type UnoSafeRedirectQueryRefusal =
  | "query:not-a-query"
  | "query:too-long"
  | "query:too-many-parameters"
  | "query:empty-parameter"
  | "query:unsafe-key"
  | "query:unsafe-value";

/** One verdict: the query to append exactly as it arrived, or a closed refusal and no value. */
export type UnoSafeRedirectQueryResult =
  | { readonly status: "accepted"; readonly query: string }
  | { readonly status: "refused"; readonly reason: UnoSafeRedirectQueryRefusal };

/**
 * One parameter key: alphanumeric first, then lowercase-safe ASCII only. A key is never percent-encoded and never empty,
 * so `?=x`, `?a b=1`, `?%61=1` and `?a.b=1;evil` are all refused rather than guessed at.
 */
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,31}$/u;

/**
 * One parameter value: unreserved ASCII only, plus the two spellings a space may legitimately take.
 *
 * Deliberately narrow. A percent triplet other than `%20` is refused, so `%2f`, `%5c`, `%26`, `%3d`, `%25` (recursion),
 * `%2e` (dot recursion), `%0d`, `%0a` and `%00` cannot cross. `+` is accepted **only** because the framework has already
 * rewritten `%20` into `+` before this code runs (measured against real `node:http` requests through `next start`: the
 * request URL surfaces `?ref=alpha+beta` for a wire request of `?ref=alpha%20beta`, and no raw target is exposed), and it
 * is emitted back in the unambiguous `%20` spelling by `normalizeSpaceSpelling` below.
 */
const SAFE_VALUE = /^(?:[A-Za-z0-9._~+-]|%20)*$/u;

/**
 * The one normalization this validator performs, and the only reason it is not a pure pass-through.
 *
 * A space reaches user code as `+` because the framework re-serialises the query before the proxy sees it, so the wire
 * spelling is no longer available. `+` is the form-encoded spelling of a space and is emitted as `%20` instead: that is
 * idempotent (`%20` is never touched), it is the spelling the requester most likely sent, it never creates a character
 * that was not already a space, and it keeps `%20` from being downgraded to `+`. Every other byte is returned untouched.
 */
function normalizeSpaceSpelling(part: string): string {
  return part.includes("+") ? part.split("+").join("%20") : part;
}

/** Whether one parameter part is a single non-empty `key=value` with a safe key and a safe, bounded value. */
function classifyParameter(
  part: string,
): { readonly ok: true } | { readonly ok: false; readonly reason: UnoSafeRedirectQueryRefusal } {
  const separator = part.indexOf("=");
  if (separator <= 0 || part.indexOf("=", separator + 1) >= 0) return { ok: false, reason: "query:not-a-query" };

  const key = part.slice(0, separator);
  const value = part.slice(separator + 1);
  if (!SAFE_KEY.test(key)) return { ok: false, reason: "query:unsafe-key" };
  if (value.length > UNO_SAFE_REDIRECT_QUERY_LIMITS.valueBytes) return { ok: false, reason: "query:too-long" };
  if (!SAFE_VALUE.test(value)) return { ok: false, reason: "query:unsafe-value" };
  return { ok: true };
}

/**
 * Validate one untrusted raw query suffix.
 *
 * `""` is the accepted absence of a query, so a no-query redirect keeps its exact previous behaviour. Anything else must be
 * exactly `?key=value(&key=value)*` within the documented budget, with a single `?`, no fragment and no character outside
 * the two narrow grammars above. The accepted value is the **input string itself** — this function never rebuilds it.
 */
export function validateUnoSafeRedirectQuery(raw: unknown): UnoSafeRedirectQueryResult {
  if (typeof raw !== "string") return { status: "refused", reason: "query:not-a-query" };
  if (raw === "") return { status: "accepted", query: "" };
  if (!raw.startsWith("?")) return { status: "refused", reason: "query:not-a-query" };
  if (raw.length > UNO_SAFE_REDIRECT_QUERY_LIMITS.bytes) return { status: "refused", reason: "query:too-long" };

  const body = raw.slice(1);
  if (body.length === 0) return { status: "refused", reason: "query:not-a-query" };
  // A second `?`, a fragment or any non-ASCII byte is refused before parameters are even considered.
  if (body.includes("?") || body.includes("#")) return { status: "refused", reason: "query:not-a-query" };
  for (let index = 0; index < body.length; index += 1) {
    const code = body.charCodeAt(index);
    if (code < 0x21 || code > 0x7e) return { status: "refused", reason: "query:unsafe-value" };
  }

  const parts = body.split("&");
  if (parts.length > UNO_SAFE_REDIRECT_QUERY_LIMITS.parameters) {
    return { status: "refused", reason: "query:too-many-parameters" };
  }
  let normalized = false;
  const accepted: string[] = [];
  for (const part of parts) {
    if (part.length === 0) return { status: "refused", reason: "query:empty-parameter" };
    const verdict = classifyParameter(part);
    if (!verdict.ok) return { status: "refused", reason: verdict.reason };
    const spelled = normalizeSpaceSpelling(part);
    if (spelled !== part) normalized = true;
    accepted.push(spelled);
  }

  // No rebuild when nothing needed the one space normalization: the caller receives the very same string it passed in.
  return { status: "accepted", query: normalized ? `?${accepted.join("&")}` : raw };
}
