/**
 * Foundation Uno — the opt-in analytics endpoint (`U05`).
 *
 * WHAT THIS IS. The same-origin collector the beacon posts to. It exists so that analytics can be **opt-in without a third
 * party**: the browser never talks to an analytics host directly, and this route decides whether anything leaves the process.
 *
 * OFF BY DEFAULT, PROVABLY. With no analytics declaration the beacon is never rendered and this route is never called; when it is
 * called anyway the route answers `204` and stores nothing. It has no storage, no cookie, no identifier, no log line and no
 * database: the only optional side effect is one forward to an **allowlisted public HTTPS** endpoint, and even then the body is
 * the validated event alone.
 *
 * WHAT IT REFUSES. A non-JSON body, an oversized body, an unknown event, a malformed path, an endpoint that is not public HTTPS or
 * not allowlisted. Every refusal is a status code with no detail about the caller.
 */
import { UNO_ANALYTICS_LIMITS, validateUnoAnalyticsEvent } from "../../../core/analytics/uno-analytics";
import { classifyPublicHttpsDestination, isUnoAllowlistedHost } from "../../../core/efs/uno-public-destination";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The exact environment names the optional forward reads. */
const FORWARD_URL_ENV = "UNO_ANALYTICS_FORWARD_URL";
const FORWARD_HOSTS_ENV = "UNO_ANALYTICS_FORWARD_HOSTS";

/** The declared forward bound: short, because no visitor is waiting on it. */
const FORWARD_TIMEOUT_MS = 2000;

/** An empty, uncached answer. Analytics never writes a body a visitor can see. */
function quiet(status: number, extra: Record<string, string> = {}): Response {
  return new Response(null, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra },
  });
}

/** Read one environment value without letting a hostile environment throw. */
function readEnv(name: string): string | null {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Forward one validated event to an operator-configured endpoint, if — and only if — that endpoint is public HTTPS and its host
 * is allowlisted. The forward is best-effort and silent: its outcome is never reported to the visitor and never stored.
 */
async function forwardEvent(body: string): Promise<void> {
  const url = readEnv(FORWARD_URL_ENV);
  const hosts = readEnv(FORWARD_HOSTS_ENV);
  if (url === null || hosts === null) return;
  const destination = classifyPublicHttpsDestination(url);
  if (!destination.accepted) return;
  const allowlist = hosts.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (!isUnoAllowlistedHost(destination.host, allowlist)) return;
  try {
    await fetch(destination.href, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });
  } catch {
    // Deliberately swallowed: measurement must never surface an error, retry or queue.
  }
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return quiet(415);

  let text: string;
  try {
    text = await request.text();
  } catch {
    return quiet(400);
  }
  if (new TextEncoder().encode(text).length > UNO_ANALYTICS_LIMITS.bodyBytes) return quiet(413);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return quiet(400);
  }

  const event = validateUnoAnalyticsEvent(parsed);
  if ("refused" in event) return quiet(400);

  await forwardEvent(JSON.stringify(event));
  return quiet(204);
}

/** Every other method is refused by name. */
function refuseMethod(): Response {
  return quiet(405, { allow: "POST" });
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
