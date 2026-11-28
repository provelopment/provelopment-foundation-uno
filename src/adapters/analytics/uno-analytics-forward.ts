/**
 * Foundation Uno — the opt-in analytics forwarder (`U05`).
 *
 * WHAT THIS IS. The server half of the product's one analytics mechanism. A Site can only *declare* analytics; this adapter holds
 * the **destination**, in the environment, and it is the only thing that can send an event. Both halves must be present before a
 * beacon is rendered, so an enabled declaration with no destination produces no request, and a destination with no declaration
 * produces no beacon.
 *
 * WHAT IT REFUSES. A destination that is not public HTTPS, a host outside the operator's allowlist, a name that resolves to a
 * private, loopback, link-local, reserved or mapped address, and any redirect. It shares the pinned connector with the contact
 * webhook, so the address that is checked is the address that is dialled.
 *
 * WHAT IT NEVER DOES. It stores nothing, writes no cookie, generates no identifier, logs nothing and retries nothing. The event it
 * forwards is one name and one bounded Page path — never an address, a user agent, a referrer or a session.
 */
import {
  classifyPublicHttpsDestination,
  isUnoAllowlistedHost,
} from "../../core/efs/uno-public-destination";
import {
  createUnoPinnedTransport,
  type UnoHostResolver,
  type UnoPinnedOutcome,
  type UnoRequestFunction,
} from "../net/uno-pinned-https-transport";

/** The exact environment names the forwarder reads. */
export const UNO_ANALYTICS_FORWARD_ENV = Object.freeze({
  url: "UNO_ANALYTICS_FORWARD_URL",
  hosts: "UNO_ANALYTICS_FORWARD_HOSTS",
  testLoopback: "UNO_ANALYTICS_TEST_LOOPBACK",
} as const);

/** Why analytics are off, or the validated destination they are forwarded to. */
export type UnoAnalyticsForwardState =
  | { readonly status: "not-enabled" }
  | { readonly status: "configuration-invalid"; readonly reason: string }
  | { readonly status: "enabled"; readonly url: string; readonly host: string; readonly testLoopback: boolean };

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
 * Resolve the forward destination.
 *
 * Unset is the shipped state and means analytics are not enabled: the collector refuses, so the product has no analytics service
 * pretending to work. A destination that fails the policy is a configuration error, reported as one.
 */
export function resolveUnoAnalyticsForward(): UnoAnalyticsForwardState {
  const url = readEnv(UNO_ANALYTICS_FORWARD_ENV.url);
  if (url === null) return { status: "not-enabled" };

  const hostsText = readEnv(UNO_ANALYTICS_FORWARD_ENV.hosts);
  if (hostsText === null) return { status: "configuration-invalid", reason: "analytics:allowlist-missing" };
  const allowlist = hostsText.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (allowlist.length === 0) return { status: "configuration-invalid", reason: "analytics:allowlist-missing" };

  const testLoopback = readEnv(UNO_ANALYTICS_FORWARD_ENV.testLoopback) === "1";
  const destination = classifyPublicHttpsDestination(url);
  if (!destination.accepted) {
    const seam = testLoopback ? /^http:\/\/127\.0\.0\.1:(\d{1,5})\/[A-Za-z0-9./_-]*$/u.exec(url) : null;
    if (seam === null) return { status: "configuration-invalid", reason: destination.reason };
    if (!isUnoAllowlistedHost("127.0.0.1", allowlist)) {
      return { status: "configuration-invalid", reason: "destination:not-allowlisted" };
    }
    return { status: "enabled", url, host: "127.0.0.1", testLoopback: true };
  }
  if (!isUnoAllowlistedHost(destination.host, allowlist)) {
    return { status: "configuration-invalid", reason: "destination:not-allowlisted" };
  }
  return { status: "enabled", url: destination.href, host: destination.host, testLoopback: false };
}

/** The injected connector, so a test can prove the enabled path without a network. */
export type UnoAnalyticsTransport = (
  url: string,
  init: {
    readonly method: "POST";
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly allowLoopback: boolean;
    readonly totalTimeoutMs: number;
  },
) => Promise<UnoPinnedOutcome>;

/** Build the production forwarder on the pinned connector. */
export function createUnoAnalyticsTransport(seams: {
  readonly resolve?: UnoHostResolver;
  readonly request?: UnoRequestFunction;
} = {}): UnoAnalyticsTransport {
  const send = createUnoPinnedTransport(seams);
  return (url, init) => send(url, init);
}

/** Forward one validated event. The result is closed and carries no event value. */
export async function forwardUnoAnalyticsEvent(
  body: string,
  transport: UnoAnalyticsTransport,
): Promise<{ readonly status: "forwarded" | "not-enabled" | "refused" | "failed"; readonly reason?: string }> {
  const state = resolveUnoAnalyticsForward();
  if (state.status === "not-enabled") return { status: "not-enabled" };
  if (state.status === "configuration-invalid") return { status: "failed", reason: state.reason };

  const outcome = await transport(state.url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    allowLoopback: state.testLoopback,
    totalTimeoutMs: 2000,
  });
  if (outcome.kind === "response" && outcome.status >= 200 && outcome.status <= 299) return { status: "forwarded" };
  if (outcome.kind === "refused") return { status: "refused", reason: outcome.reason };
  return { status: "failed" };
}
