/**
 * Foundation Uno — the U05 outbound-connector security proof.
 *
 * These tests answer a question lexical URL validation cannot: what happens *after* the name is resolved? They drive the pinned
 * connector with a fixed resolver and a recorded request function, so the refusal path is proven without a network, and the pinning
 * is proven by inspecting exactly which address the socket was told to dial. No public name, credential or live endpoint is used.
 */
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

import { classifyResolvedAddress } from "../../src/core/efs/uno-public-destination";
import {
  UNO_PINNED_HTTPS_LIMITS,
  createUnoPinnedTransport,
  type UnoRequestFunction,
  type UnoResolvedTarget,
} from "../../src/adapters/net/uno-pinned-https-transport";

/** A fixed resolver that answers with the given addresses. */
const resolving = (addresses: readonly UnoResolvedTarget[]) => async () => addresses;

/** A request function that records its call and never completes, so a test only inspects what was asked for. */
function recorder() {
  const calls: { options: Record<string, unknown>; body: string }[] = [];
  const request = vi.fn((options: Record<string, unknown>) => {
    const emitter = new EventEmitter() as EventEmitter & { end: (body: string) => void; destroy: () => void };
    emitter.end = (body: string) => calls.push({ options, body });
    emitter.destroy = () => undefined;
    return emitter;
  });
  return { calls, request: request as unknown as UnoRequestFunction };
}

/** The header map a real call would carry. */
const HEADERS = Object.freeze({ "content-type": "application/json", authorization: "Bearer s3cret" });

describe("an address is judged after resolution, in both families", () => {
  it("admits ordinary public IPv4 and IPv6 addresses", () => {
    expect(classifyResolvedAddress("93.184.216.34")).toEqual({ public: true, family: 4 });
    expect(classifyResolvedAddress("2606:2800:220:1:248:1893:25c8:1946")).toEqual({ public: true, family: 6 });
  });

  it("refuses loopback, RFC 1918, link-local, CGNAT, reserved, multicast and documentation IPv4", () => {
    for (const address of [
      "127.0.0.1",
      "127.255.255.254",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.0.1",
      "169.254.169.254",
      "100.64.0.1",
      "192.0.2.1",
      "198.18.0.1",
      "198.51.100.7",
      "203.0.113.9",
      "224.0.0.1",
      "240.0.0.1",
      "0.0.0.0",
    ]) {
      expect(classifyResolvedAddress(address), address).toEqual({ public: false, reason: "destination:private-address" });
    }
  });

  it("refuses loopback, ULA, link-local, multicast, documentation and mapped IPv6", () => {
    for (const address of [
      "::",
      "::1",
      "fc00::1",
      "fd12:3456:789a::1",
      "fe80::1",
      "ff02::1",
      "2001:db8::1",
      "::ffff:127.0.0.1",
      "::ffff:169.254.169.254",
      "64:ff9b::a00:1",
    ]) {
      expect(classifyResolvedAddress(address), address).toEqual({ public: false, reason: "destination:private-address" });
    }
  });

  it("refuses anything that is not an address rather than assuming it is public", () => {
    for (const value of ["", "not-an-address", "1.2.3", "999.1.1.1", null, 42]) {
      expect(classifyResolvedAddress(value), String(value)).toMatchObject({ public: false });
    }
  });
});

describe("the connector refuses before it dials", () => {
  it("opens no request when the name resolves to a private, link-local or mapped address", async () => {
    for (const answer of ["127.0.0.1", "10.0.0.5", "169.254.169.254", "::1", "fe80::1", "::ffff:10.0.0.5"]) {
      const { request, calls } = recorder();
      const send = createUnoPinnedTransport({
        resolve: resolving([{ address: answer, family: answer.includes(":") ? 6 : 4 }]),
        request,
      });
      const outcome = await send("https://hooks.example.com/collect", {
        method: "POST",
        headers: HEADERS,
        body: "{}",
        totalTimeoutMs: 500,
      });
      expect(outcome.kind, answer).toBe("refused");
      expect(calls, answer).toHaveLength(0);
    }
  });

  it("refuses a name that answers with both a public and a private address, in either order", async () => {
    for (const answers of [
      [{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }],
      [{ address: "127.0.0.1", family: 4 }, { address: "93.184.216.34", family: 4 }],
    ]) {
      const { request, calls } = recorder();
      const send = createUnoPinnedTransport({ resolve: resolving(answers), request });
      const outcome = await send("https://hooks.example.com/collect", {
        method: "POST",
        headers: HEADERS,
        body: "{}",
        totalTimeoutMs: 500,
      });
      expect(outcome).toEqual({ kind: "refused", reason: "destination:private-address" });
      expect(calls).toHaveLength(0);
    }
  });

  it("refuses an empty answer and a failing resolver", async () => {
    const { request, calls } = recorder();
    const empty = createUnoPinnedTransport({ resolve: resolving([]), request });
    expect(await empty("https://hooks.example.com/collect", { method: "POST", headers: HEADERS, body: "{}", totalTimeoutMs: 500 }))
      .toEqual({ kind: "refused", reason: "destination:dns-unresolved" });
    const thrown = createUnoPinnedTransport({
      resolve: async () => {
        throw new Error("ENOTFOUND");
      },
      request,
    });
    expect(await thrown("https://hooks.example.com/collect", { method: "POST", headers: HEADERS, body: "{}", totalTimeoutMs: 500 }))
      .toEqual({ kind: "refused", reason: "destination:dns-unresolved" });
    expect(calls).toHaveLength(0);
  });

  it("refuses a plaintext destination unless the documented test seam is on", async () => {
    const { request, calls } = recorder();
    const send = createUnoPinnedTransport({ resolve: resolving([{ address: "127.0.0.1", family: 4 }]), request });
    expect(await send("http://127.0.0.1:9000/collect", { method: "POST", headers: HEADERS, body: "{}", totalTimeoutMs: 500 }))
      .toEqual({ kind: "refused", reason: "destination:not-https" });
    expect(calls).toHaveLength(0);
  });
});

describe("the connector dials only the address it validated", () => {
  it("pins the resolver to the checked address and disables pooling", async () => {
    const { request, calls } = recorder();
    const send = createUnoPinnedTransport({
      resolve: resolving([{ address: "93.184.216.34", family: 4 }]),
      request,
    });
    await send("https://hooks.example.com/collect", {
      method: "POST",
      headers: HEADERS,
      body: "{\"x\":1}",
      totalTimeoutMs: 500,
    });

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call).toBeDefined();
    if (call === undefined) return;
    expect(call.options["hostname"]).toBe("hooks.example.com");
    expect(call.options["servername"]).toBe("hooks.example.com");
    expect(call.options["agent"]).toBe(false);
    expect(call.options["maxHeaderSize"]).toBe(UNO_PINNED_HTTPS_LIMITS.headerBytes);
    expect(call.options["timeout"]).toBe(UNO_PINNED_HTTPS_LIMITS.connectTimeoutMs);
    expect((call.options["headers"] as Record<string, string>)["host"]).toBe("hooks.example.com");
    expect(call.body).toBe("{\"x\":1}");

    // The pinned lookup is the protection: it must answer with the validated address and with nothing else.
    const lookup = call.options["lookup"] as unknown as (
      host: string,
      options: unknown,
      callback: (error: Error | null, address: string, family: number) => void,
    ) => void;
    const answers: [string, number][] = [];
    lookup("hooks.example.com", {}, (_error, address, family) => answers.push([address, family]));
    expect(answers).toEqual([["93.184.216.34", 4]]);
  });

  it("bounds the whole exchange so no request can hang", async () => {
    const { request } = recorder();
    const send = createUnoPinnedTransport({ resolve: resolving([{ address: "93.184.216.34", family: 4 }]), request });
    const started = Date.now();
    const outcome = await send("https://hooks.example.com/collect", {
      method: "POST",
      headers: HEADERS,
      body: "{}",
      totalTimeoutMs: 120,
    });
    expect(outcome).toEqual({ kind: "timeout" });
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
