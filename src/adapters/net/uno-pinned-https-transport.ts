/**
 * Foundation Uno — the pinned HTTPS connector (`U05`).
 *
 * WHAT THIS IS. The one place in Uno that opens an outbound socket on the product's own initiative. It resolves the configured
 * host **before** connecting, classifies every address the resolver returned, refuses the connection if any of them is private,
 * loopback, link-local, reserved, multicast, documentation or an IPv4-mapped form of one, and then connects to **exactly the
 * address it validated** by pinning the resolver callback. The value that was checked is the value that is dialled, so a name
 * that changes its answer between the check and the connection cannot be reached.
 *
 * WHAT IT ALSO DOES. It sets the TLS server name from the configured host (so the certificate is checked against the name, not the
 * address), sends the host in `Host`, keeps no connection pool (`agent: false`), bounds the connect phase, the response headers, the
 * response body and the whole exchange, and verifies the socket's own remote address against the pinned one as a second,
 * independent check. A redirect is never followed: a `3xx` is returned as a status and the caller refuses it.
 *
 * WHAT IT CANNOT DO. It cannot see a proxy the platform injects, an intercepting resolver that answers a public address for a
 * name whose certificate does not match (the TLS check still fails), or a peer that changes its behaviour after connecting. It does
 * not implement retries, redirects, caching, connection reuse or a DNS cache.
 */
import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import type { IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";

import { classifyResolvedAddress } from "../../core/efs/uno-public-destination";

/** The declared connector bounds. Each is a limit, not a default. */
export const UNO_PINNED_HTTPS_LIMITS = Object.freeze({
  connectTimeoutMs: 4000,
  totalTimeoutMs: 8000,
  responseBytes: 2048,
  headerBytes: 8192,
});

/** One resolved address, as the platform resolver reports it. */
export interface UnoResolvedTarget {
  readonly address: string;
  readonly family: number;
}

/** The injected resolver. Production passes `dns.promises.lookup`; a test passes a fixed answer. */
export type UnoHostResolver = (host: string) => Promise<readonly UnoResolvedTarget[]>;

/** The injected request function. Production passes `node:https`; a test passes a recorder. */
export type UnoRequestFunction = typeof httpsRequest;

/** The closed outcome of one connection attempt. A refusal means no socket was opened and nothing was sent. */
export type UnoPinnedOutcome =
  | { readonly kind: "response"; readonly status: number; readonly bodyBytes: number }
  | { readonly kind: "refused"; readonly reason: string }
  | { readonly kind: "timeout" }
  | { readonly kind: "error" };

/** Everything one call may read from its caller, resolved there rather than here. */
export interface UnoPinnedRequestInit {
  readonly method: "POST";
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
  /** True only when the operator enabled the documented loopback test seam; production never sets it. */
  readonly allowLoopback?: boolean;
  /** The whole-exchange bound. Omitted means the declared maximum. */
  readonly totalTimeoutMs?: number;
}

/** The default resolver: every address the platform reports, in the order it reports them. */
export const unoDefaultResolver: UnoHostResolver = async (host) => {
  const answers = await dnsLookup(host, { all: true, verbatim: true });
  return answers.map((answer) => ({ address: answer.address, family: answer.family }));
};

/** True when an address is the loopback of either family; used only by the documented test seam. */
function isLoopback(address: string): boolean {
  const text = address.trim().toLowerCase();
  return text === "127.0.0.1" || text === "::1" || text === "::ffff:127.0.0.1";
}

/** Read at most the declared number of bytes from a response, then stop listening. */
function readBounded(response: IncomingMessage): Promise<number> {
  return new Promise((resolve) => {
    let total = 0;
    response.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > UNO_PINNED_HTTPS_LIMITS.responseBytes) {
        response.destroy();
        resolve(total);
      }
    });
    response.on("end", () => resolve(total));
    response.on("error", () => resolve(total));
  });
}

/**
 * Create the pinned connector.
 *
 * The factory takes its resolver and its request function as parameters so a test can prove the refusal path without a network and
 * without a public name, and so production resolves both at call time rather than at import.
 */
export function createUnoPinnedTransport(options: {
  readonly resolve?: UnoHostResolver;
  readonly request?: UnoRequestFunction;
} = {}) {
  const resolve = options.resolve ?? unoDefaultResolver;

  return async function send(url: string, init: UnoPinnedRequestInit): Promise<UnoPinnedOutcome> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { kind: "refused", reason: "destination:unsafe-syntax" };
    }
    const plaintext = parsed.protocol === "http:";
    if (!plaintext && parsed.protocol !== "https:") return { kind: "refused", reason: "destination:not-https" };
    // The test seam is the only way a plaintext destination can reach this connector, and production never sets it.
    if (plaintext && init.allowLoopback !== true) return { kind: "refused", reason: "destination:not-https" };

    const host = parsed.hostname.toLowerCase();
    if (host.length === 0) return { kind: "refused", reason: "destination:unsafe-syntax" };

    let answers: readonly UnoResolvedTarget[];
    try {
      answers = await resolve(host);
    } catch {
      return { kind: "refused", reason: "destination:dns-unresolved" };
    }
    if (answers.length === 0) return { kind: "refused", reason: "destination:dns-unresolved" };

    // Every answer must be public: a name that answers with one public and one private address is refused outright, so no ordering,
    // retry or happy-eyeballs policy can ever reach the private one.
    let pinned: UnoResolvedTarget | null = null;
    for (const answer of answers) {
      const verdict = classifyResolvedAddress(answer.address);
      if (!verdict.public) {
        if (init.allowLoopback === true && isLoopback(answer.address)) {
          pinned = pinned ?? answer;
          continue;
        }
        return { kind: "refused", reason: verdict.reason };
      }
      pinned = pinned ?? answer;
    }
    if (pinned === null) return { kind: "refused", reason: "destination:private-address" };
    const target: UnoResolvedTarget = pinned;

    const port = parsed.port === "" ? (plaintext ? 80 : 443) : Number(parsed.port);
    const request = plaintext ? (httpRequest as UnoRequestFunction) : (options.request ?? (httpsRequest as UnoRequestFunction));

    return new Promise<UnoPinnedOutcome>((done) => {
      let settled = false;
      let outgoing: ReturnType<UnoRequestFunction> | null = null;
      const finish = (outcome: UnoPinnedOutcome) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        done(outcome);
      };

      const deadline = setTimeout(() => {
        finish({ kind: "timeout" });
        try {
          outgoing?.destroy();
        } catch {
          // The request may already be closed; the outcome is what matters.
        }
      }, init.totalTimeoutMs ?? UNO_PINNED_HTTPS_LIMITS.totalTimeoutMs);

      const call = request(
        {
          protocol: plaintext ? "http:" : "https:",
          hostname: host,
          port,
          path: `${parsed.pathname}${parsed.search}`,
          method: init.method,
          headers: { ...init.headers, host: parsed.host },
          // Pin the validated address: the resolver the socket uses is ours, and it answers only with the value already checked.
          lookup: ((_: string, __: unknown, callback: (error: Error | null, address: string, family: number) => void) => {
            callback(null, target.address, target.family);
          }) as unknown as never,
          // No pooled socket may be reused for a different destination, and no keep-alive may outlive this request.
          agent: false,
          servername: plaintext ? undefined : host,
          maxHeaderSize: UNO_PINNED_HTTPS_LIMITS.headerBytes,
          timeout: UNO_PINNED_HTTPS_LIMITS.connectTimeoutMs,
        },
        (response) => {
          const status = response.statusCode ?? 0;
          void readBounded(response).then((bodyBytes) => {
            finish({ kind: "response", status, bodyBytes });
            response.destroy();
          });
          response.on("error", () => finish({ kind: "error" }));
        },
      );
      outgoing = call;

      call.on("socket", (socket) => {
        // Second, independent check: the socket must be connected to the address that was validated.
        socket.once("connect", () => {
          const remote = socket.remoteAddress ?? "";
          const verdict = classifyResolvedAddress(remote);
          const seamLoopback = init.allowLoopback === true && isLoopback(remote) && isLoopback(target.address);
          const sameAddress = remote === target.address || seamLoopback;
          if ((!verdict.public && !seamLoopback) || !sameAddress) {
            finish({ kind: "refused", reason: verdict.public ? "destination:address-mismatch" : verdict.reason });
            socket.destroy();
          }
        });
        socket.once("timeout", () => {
          finish({ kind: "timeout" });
          socket.destroy();
        });
      });

      call.on("error", () => finish({ kind: "error" }));
      call.end(init.body);
    });
  };
}

