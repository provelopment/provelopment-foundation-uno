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
  /^203\.0\.113\./u,
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

/** The verdict on one *resolved* address: the same question, asked after DNS rather than before it. */
export type UnoResolvedAddressVerdict =
  | { readonly public: true; readonly family: 4 | 6 }
  | { readonly public: false; readonly reason: "destination:private-address" | "destination:unsafe-syntax" };

/** Expand one IPv6 literal into eight hextets, or `null` when it is not one. */
function expandIpv6(input: string): readonly number[] | null {
  let text = input.toLowerCase();
  // An IPv4-mapped tail is written with dots; fold it into two hextets before the generic expansion.
  const lastColon = text.lastIndexOf(":");
  if (text.includes(".") && lastColon !== -1) {
    const tail = text.slice(lastColon + 1);
    const quad = IPV4_LITERAL.exec(tail);
    if (quad === null) return null;
    const octets = quad.slice(1).map((octet) => Number(octet));
    if (octets.some((value) => value > 255)) return null;
    const high = ((octets[0] ?? 0) * 256 + (octets[1] ?? 0)).toString(16);
    const low = ((octets[2] ?? 0) * 256 + (octets[3] ?? 0)).toString(16);
    text = text.slice(0, lastColon + 1) + high + ":" + low;
  }
  if (!/^[0-9a-f:.]+$/u.test(text)) return null;
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const parse = (part: string): number[] | null => {
    if (part.length === 0) return [];
    const groups: number[] = [];
    for (const group of part.split(":")) {
      if (!/^[0-9a-f]{1,4}$/u.test(group)) return null;
      groups.push(Number.parseInt(group, 16));
    }
    return groups;
  };
  const head = parse(halves[0] ?? "");
  const tail = halves.length === 2 ? parse(halves[1] ?? "") : [];
  if (head === null || tail === null) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;
  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;
  return [...head, ...Array.from({ length: missing }, () => 0), ...tail];
}

/** Render four groups of an IPv6 expanded form back into a dotted quad, for mapped/NAT64 addresses. */
function embeddedIpv4(groups: readonly number[], offset: number): string {
  return [0, 1, 2, 3].map((index) => String(((groups[offset + index] ?? 0) >> 8) & 0xff) + "." + String((groups[offset + index] ?? 0) & 0xff)).join(".");
}

/** True for an expanded IPv6 address inside loopback, ULA, link-local, multicast, documentation or IPv4-mapped space. */
function isPrivateIpv6(groups: readonly number[]): boolean {
  const first = groups[0] ?? 0;
  if (groups.every((group) => group === 0)) return true; // ::
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) return true; // ::1
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (first === 0x2001 && groups[1] === 0x0db8) return true; // 2001:db8::/32 documentation
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) return true; // ::ffff:0:0/96 mapped
  if (first === 0x0064 && groups[1] === 0xff9b) return true; // 64:ff9b::/96 NAT64
  return false;
}

/**
 * Classify one address the resolver returned, **after** resolution.
 *
 * This is the check lexical validation cannot make: a name that reads like a public service can resolve to loopback, to an
 * RFC 1918 host, to a link-local metadata address or to an IPv4-mapped IPv6 form of any of them. Both address families are
 * covered, mapped and NAT64 forms are unwrapped rather than trusted, and an unparseable value is refused instead of assumed
 * public.
 */
export function classifyResolvedAddress(input: unknown): UnoResolvedAddressVerdict {
  if (typeof input !== "string" || input.length === 0 || input.length > 64) {
    return { public: false, reason: "destination:unsafe-syntax" };
  }
  const address = input.trim().toLowerCase();

  if (IPV4_LITERAL.test(address)) {
    return isPrivateIpv4(address)
      ? { public: false, reason: "destination:private-address" }
      : { public: true, family: 4 };
  }

  const groups = expandIpv6(address);
  if (groups === null) return { public: false, reason: "destination:unsafe-syntax" };
  if (isPrivateIpv6(groups)) {
    // Unwrap a mapped or NAT64 tail so the refusal names the IPv4 block the address actually reaches.
    const tail = groups.slice(4);
    if (tail.slice(0, 3).every((group) => group === 0) && (tail[3] === 0xffff || tail[3] === 0x0)) {
      const mapped = embeddedIpv4(groups, 4);
      if (isPrivateIpv4(mapped)) return { public: false, reason: "destination:private-address" };
    }
    return { public: false, reason: "destination:private-address" };
  }
  return { public: true, family: 6 };
}
