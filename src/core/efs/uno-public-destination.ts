/**
 * Foundation Uno — the public-destination policy for server-side transport (`U05`).
 *
 * WHAT THIS IS. One narrow predicate for a destination a **server** will connect to on Uno's behalf — the contact webhook and
 * the optional analytics endpoint. It requires an absolute `https` origin and refuses every address shape that could reach back
 * into the host or its private neighbourhood: loopback, any RFC 1918 range, link-local (including the cloud metadata address),
* carrier-grade NAT, IPv6 literals, multicast, reserved and documentation ranges, and bare single-label hosts.
 *
 * WHY A SECOND PREDICATE. `classifyAuthorDestination` answers "may an author *link* here?", which is a browser question and
 * correctly admits any well-formed public host. This one answers "may *our server* open a socket here?", which is an SSRF
 * question, so it must be narrower — an authored link to `https://127.0.0.1/` is a content mistake, while a webhook configured
 * to that address is a privilege escalation.
 *
 * WHAT IT CANNOT DO. It sees the literal host only. DNS rebinding, a redirect issued by the remote peer and a proxy in between
 * are outside any lexical check, so callers must also refuse redirects and bound the response — which the transport adapter
 * does. This module performs no lookup, no connection and no DNS resolution.
 */

/** The closed refusal vocabulary: one literal per failure family. */
export type UnoPublicDestinationRefusal =
  | "destination:not-text"
  | "destination:not-https"
  | "destination:unsafe-syntax"
  | "destination:credentials"
  | "destination:ip-literal"
  | "destination:private-address"
  | "destination:public-suffix-missing";

/** An accepted destination: the exact original string plus its lowercased host, for allowlist comparison. */
export interface UnoPublicDestinationAccepted {
  readonly accepted: true;
  readonly href: string;
  readonly host: string;
}

export interface UnoPublicDestinationRejected {
  readonly accepted: false;
  readonly reason: UnoPublicDestinationRefusal;
}

export type UnoPublicDestinationVerdict = UnoPublicDestinationAccepted | UnoPublicDestinationRejected;

/** Every private, loopback, link-local, CGNAT, multicast, reserved, benchmark and documentation IPv4 block we refuse. */
const PRIVATE_IPV4 = [
  /^0\./u,
  /^10\./u,
  /^100\.(?:6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./u,
  /^127\./u,
  /^169\.254\./u,
  /^172\.(?:1[6-9]|2[0-9]|3[01])\./u,
  /^192\.0\.(?:0|2)\./u,
  /^192\.168\./u,
  /^198\.(?:1[89]|2[0-9]|3[01])\./u,
  /^19[89]\.51\.100\./u,
  /^20[0-9]\.51\.100\./u,
  /^22[3-9]\./u,
  /^2[3-5][0-9]\./u,
] as const;

/** Hosts that name the machine itself or a name-resolution neighbourhood rather than a public service. */
const RESERVED_HOSTNAMES: readonly string[] = Object.freeze([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
]);

/** A dotted quad of decimal octets, checked for shape only; the ranges above decide admission. */
const IPV4_LITERAL = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u;

function rejected(reason: UnoPublicDestinationRefusal): UnoPublicDestinationRejected {
  return { accepted: false, reason };
}

/** True for any IPv4 literal inside a block a server must never be pointed at. */
function isPrivateIpv4(host: string): boolean {
  const match = IPV4_LITERAL.exec(host);
  if (match === null) return false;
  for (const octet of match.slice(1)) {
    const value = Number(octet);
    if (!Number.isInteger(value) || value < 0 || value > 255) return true;
  }
  return PRIVATE_IPV4.some((pattern) => pattern.test(host));
}

/**
 * Classify one server-side destination.
 *
 * The string is never repaired: an accepted verdict carries the original value and its host, and a refusal carries one reason
 * and no value at all.
 */
export function classifyPublicHttpsDestination(input: unknown): UnoPublicDestinationVerdict {
  if (typeof input !== "string") return rejected("destination:not-text");
  if (!input.toLowerCase().startsWith("https://")) {
    return input.includes(":") ? rejected("destination:not-https") : rejected("destination:unsafe-syntax");
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return rejected("destination:unsafe-syntax");
  }
  if (parsed.protocol !== "https:") return rejected("destination:not-https");
  if (parsed.username !== "" || parsed.password !== "") return rejected("destination:credentials");
  if (parsed.port !== "") return rejected("destination:unsafe-syntax");

  const host = parsed.hostname.toLowerCase();
  if (host.length === 0) return rejected("destination:unsafe-syntax");
  if (host.startsWith("[") || host.includes(":")) return rejected("destination:ip-literal");
  if (RESERVED_HOSTNAMES.includes(host)) return rejected("destination:private-address");
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return rejected("destination:private-address");
  }
  if (IPV4_LITERAL.test(host)) {
    return isPrivateIpv4(host) ? rejected("destination:private-address") : rejected("destination:ip-literal");
  }
  // A public service has a dotted name with a real suffix; a bare label is a search-domain or intranet name.
  if (!host.includes(".")) return rejected("destination:public-suffix-missing");

  return { accepted: true, href: input, host };
}

/** True when a host is exactly one of the declared allowlist entries or a subdomain of one. */
export function isUnoAllowlistedHost(host: string, allowlist: readonly string[]): boolean {
  const candidate = host.toLowerCase();
  return allowlist.some((entry) => {
    const allowed = entry.trim().toLowerCase();
    if (allowed.length === 0) return false;
    return candidate === allowed || candidate.endsWith(`.${allowed}`);
  });
}
