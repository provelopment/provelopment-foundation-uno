/**
 * Foundation Uno — the opt-in analytics contract (`U05`).
 *
 * WHAT THIS IS. One closed declaration (`analytics` on a Site's presentation entry) and one closed event shape. Analytics are
 * **OFF unless an operator authors them on**, and an enabled declaration without a validated endpoint is refused at load, so a
 * half-configured installation tracks nothing rather than tracking badly.
 *
 * WHAT AN EVENT MAY CARRY. One closed event name, one bounded Page path, and nothing else: no identifier, no cookie, no
 * session, no referrer, no address, no user agent, no timestamp from the client, no field of any other kind. The route that
 * receives it stores nothing.
 *
 * WHAT IT IS NOT. No third-party script, tag manager, SDK, pixel, cookie or cross-site call exists here. Uno's independence does
 * not depend on an analytics provider: with the declaration absent — the shipped state — no beacon component is rendered, no
 * request is made and no storage is touched.
 */
import { classifyPublicHttpsDestination, type UnoPublicDestinationRefusal } from "../efs/uno-public-destination";

/** The one event name this contract admits. */
export const UNO_ANALYTICS_EVENTS = Object.freeze(["page-view"] as const);
export type UnoAnalyticsEventName = (typeof UNO_ANALYTICS_EVENTS)[number];

/** The declared bounds. */
export const UNO_ANALYTICS_LIMITS = Object.freeze({
  pathLength: 120,
  bodyBytes: 512,
});

/** Why an analytics declaration or event is refused. */
export type UnoAnalyticsRefusal =
  | "analytics:not-object"
  | "analytics:unknown-key"
  | "analytics:enabled-not-boolean"
  | "analytics:endpoint-missing"
  | "analytics:event-invalid"
  | "analytics:path-invalid"
  | "analytics:too-large"
  | UnoPublicDestinationRefusal;

/** A validated, enabled declaration: the allowlisted public endpoint the server may forward to. */
export interface UnoAnalyticsPlan {
  readonly enabled: true;
  readonly endpoint: string;
  readonly host: string;
}

/** A validated declaration that is switched off, with the reason it is off. */
export interface UnoAnalyticsOff {
  readonly enabled: false;
  readonly reason: "analytics:disabled" | "analytics:not-declared";
}

export type UnoAnalyticsVerdict = UnoAnalyticsPlan | UnoAnalyticsOff;

/** A validated event: one name and one bounded Page path. */
export interface UnoAnalyticsEvent {
  readonly event: UnoAnalyticsEventName;
  readonly path: string;
}

/** The accepted Page-path shape: a root-relative path of ordinary characters, bounded. */
const PATH_PATTERN = /^\/[A-Za-z0-9/_.~-]{0,119}$/u;

/**
 * Validate one Site's `analytics` declaration.
 *
 * `undefined` (absent) is the shipped, off state. `{enabled: false}` is an explicit off. `{enabled: true}` requires an endpoint
 * that passes the public-destination policy; anything else refuses the declaration, and a refused declaration is treated as
 * off — never as "enabled but unvalidated".
 */
export function validateUnoAnalyticsDeclaration(value: unknown): UnoAnalyticsVerdict | { readonly enabled: false; readonly reason: UnoAnalyticsRefusal } {
  if (value === undefined) return { enabled: false, reason: "analytics:not-declared" };
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { enabled: false, reason: "analytics:not-object" };
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key !== "enabled" && key !== "endpoint") return { enabled: false, reason: "analytics:unknown-key" };
  }
  if (typeof record["enabled"] !== "boolean") return { enabled: false, reason: "analytics:enabled-not-boolean" };
  if (record["enabled"] === false) return { enabled: false, reason: "analytics:disabled" };

  const endpoint = record["endpoint"];
  if (typeof endpoint !== "string" || endpoint.length === 0) {
    return { enabled: false, reason: "analytics:endpoint-missing" };
  }
  const destination = classifyPublicHttpsDestination(endpoint);
  if (!destination.accepted) return { enabled: false, reason: destination.reason };
  return { enabled: true, endpoint: destination.href, host: destination.host };
}

/** Validate one received analytics event, refusing anything beyond the declared shape. */
export function validateUnoAnalyticsEvent(input: unknown): UnoAnalyticsEvent | { readonly refused: UnoAnalyticsRefusal } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { refused: "analytics:not-object" };
  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key !== "event" && key !== "path") return { refused: "analytics:unknown-key" };
  }
  const name = record["event"];
  if (typeof name !== "string" || !(UNO_ANALYTICS_EVENTS as readonly string[]).includes(name)) {
    return { refused: "analytics:event-invalid" };
  }
  const path = record["path"];
  if (typeof path !== "string" || !PATH_PATTERN.test(path)) return { refused: "analytics:path-invalid" };
  return { event: name as UnoAnalyticsEventName, path };
}
