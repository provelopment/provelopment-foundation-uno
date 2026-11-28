/**
 * `U05`: the optional Resend adapter, proved with deterministic mocked provider responses.
 *
 * No key, no DNS and no socket: the pinned connector is given a fixed resolver and a request function that answers
 * exactly what each case needs. The suite asserts the closed outcome, the fixed destination, the policy refusals that
 * happen before any request, and that neither the key nor the body is ever returned.
 */
import { describe, expect, it } from "vitest";

import { createUnoResendMailTransport, UNO_RESEND_ENDPOINT } from "../../src/adapters/mail/uno-resend-mail-transport";
import type { UnoMailMessage } from "../../src/core/ports/uno-mail-transport";

const message: UnoMailMessage = {
  to: ["owner@example.test"],
  from: "noreply@example.test",
  replyTo: "visitor@example.net",
  subject: "Example contact — /en-001",
  text: "Name: Ada\nEmail: visitor@example.net\n\nHello.",
  idempotencyKey: "uno-1234abcd",
};

const configured = () => ({
  status: "configured" as const,
  config: {
    apiKey: "re_test_key_only",
    sender: { address: "noreply@example.test", displayName: "Example" },
    recipients: ["owner@example.test"],
    fromDomains: ["example.test"],
  },
});

const resolver = async () => [{ address: "93.184.216.34", family: 4 }];

/** One request function that answers with a status, an error, or nothing at all, and records what it was given. */
function fakeRequest(outcome: { status: number; bytes?: number } | "error") {
  const calls: Record<string, unknown>[] = [];
  const bodies: unknown[] = [];
  const fn = ((options: Record<string, unknown>, callback: (response: unknown) => void) => {
    calls.push(options);
    const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
    const request = {
      on(event: string, handler: (...args: unknown[]) => void) {
        (handlers[event] ??= []).push(handler);
        return request;
      },
      end(body?: unknown) {
        bodies.push(body);
        if (outcome === "error") {
          for (const handler of handlers["error"] ?? []) handler(new Error("boom"));
          return;
        }
        const response = {
          statusCode: outcome.status,
          on(event: string, handler: (...args: unknown[]) => void) {
            if (event === "end") setTimeout(() => handler(), 0);
            return response;
          },
          destroy() {},
        };
        callback(response);
      },
      destroy() {},
    };
    return request as never;
  }) as never;
  return { fn, calls, bodies };
}

describe("the Resend adapter", () => {
  it("posts one fixed-endpoint, plain-text, idempotent request and reports provider acceptance", async () => {
    const capture = fakeRequest({ status: 200, bytes: 40 });
    const transport = createUnoResendMailTransport({
      request: capture.fn,
      resolve: resolver,
      configuration: configured,
    });

    const outcome = await transport.send(message);

    expect(outcome).toEqual({ kind: "accepted", providerRef: null });
    expect(capture.calls).toHaveLength(1);
    const options = capture.calls[0];
    expect(options?.["hostname"]).toBe("api.resend.com");
    expect(options?.["path"]).toBe("/emails");
    expect(String(options?.["servername"])).toBe("api.resend.com");
    const headers = options?.["headers"] as Record<string, string>;
    expect(headers["idempotency-key"]).toBe("uno-1234abcd");
    expect(headers["authorization"]).toBe("Bearer re_test_key_only");
    const body = JSON.parse(String(capture.bodies[0])) as Record<string, unknown>;
    expect(body).toMatchObject({ to: ["owner@example.test"], reply_to: "visitor@example.net" });
    expect(body["text"]).toContain("Hello.");
    expect(body["html"]).toBeUndefined();
    expect(String(capture.bodies[0])).not.toContain("re_test_key_only");
    expect(UNO_RESEND_ENDPOINT).toBe("https://api.resend.com/emails");
  });

  it("maps each provider answer onto one closed outcome", async () => {
    const cases: readonly [{ status: number; bytes?: number } | "error", string][] = [
      [{ status: 302 }, "ambiguous:mail:redirect-refused"],
      [{ status: 401 }, "refused:mail:unauthorized-sender"],
      [{ status: 403 }, "refused:mail:unauthorized-sender"],
      [{ status: 422 }, "refused:mail:invalid-message"],
      [{ status: 429 }, "refused:mail:provider-rejected"],
      [{ status: 500 }, "refused:mail:provider-rejected"],
      ["error", "ambiguous:mail:transport-error"],
    ];
    for (const [answer, expected] of cases) {
      const transport = createUnoResendMailTransport({
        request: fakeRequest(answer).fn,
        resolve: resolver,
        configuration: configured,
      });
      const outcome = await transport.send(message);
      expect(`${outcome.kind}:${"reason" in outcome ? outcome.reason : ""}`, JSON.stringify(answer)).toBe(expected);
    }
  });

  it("refuses a foreign recipient, a foreign sender and a missing configuration without any request", async () => {
    const capture = fakeRequest({ status: 200 });
    const transport = createUnoResendMailTransport({
      request: capture.fn,
      resolve: resolver,
      configuration: configured,
    });

    expect(await transport.send({ ...message, to: ["attacker@example.net"] })).toEqual({
      kind: "refused",
      reason: "mail:unauthorized-recipient",
    });
    expect(await transport.send({ ...message, from: "other@example.test" })).toEqual({
      kind: "refused",
      reason: "mail:unauthorized-sender",
    });
    expect(capture.calls).toHaveLength(0);

    const unconfigured = createUnoResendMailTransport({
      request: capture.fn,
      resolve: resolver,
      configuration: () => ({ status: "not-configured" as const }),
    });
    expect(await unconfigured.send(message)).toEqual({ kind: "unavailable", reason: "mail:not-configured" });
    expect(capture.calls).toHaveLength(0);
  });
});
