/**
 * Foundation Uno — the U05 contact, analytics and server-transport contracts.
 *
 * These tests pin what a default installation is allowed to do: nothing leaves the process, no field is accepted beyond its
 * bound, no private address can be a server destination, no redirect is followed, and analytics stay off unless an operator
 * authors them. The delivery tests drive an injected transport, so a success, a refusal, a redirect, a timeout and a network
 * failure are all exercised without a socket and without a provider.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  UNO_CONTACT_LIMITS,
  UNO_CONTACT_REFUSAL_REASONS,
  isUnoContactSubmissionWithinBodyBound,
  validateUnoContactSubmission,
} from "../../src/core/contact/uno-contact-submission";
import { UNO_CONTACT_RATE_LIMITS, createUnoContactRateLimiter } from "../../src/core/contact/uno-contact-rate-limit";
import {
  classifyPublicHttpsDestination,
  isUnoAllowlistedHost,
} from "../../src/core/efs/uno-public-destination";
import {
  UNO_ANALYTICS_EVENTS,
  validateUnoAnalyticsDeclaration,
  validateUnoAnalyticsEvent,
} from "../../src/core/analytics/uno-analytics";
import {
  UNO_CONTACT_WEBHOOK_ENV,
  deliverUnoContactSubmission,
  resolveUnoContactWebhookConfig,
  type UnoContactTransport,
} from "../../src/adapters/contact/uno-contact-webhook";

/** A minimal accepted submission for the delivery tests. */
const SUBMISSION = Object.freeze({
  page: "/en-001/about",
  submission: Object.freeze({ name: "Ada", email: "ada@example.com", message: "Hello." }),
});

/** Set the three webhook variables for one test, and always restore them afterwards. */
function configure(url: string, hosts: string, token?: string): void {
  process.env[UNO_CONTACT_WEBHOOK_ENV.url] = url;
  process.env[UNO_CONTACT_WEBHOOK_ENV.hosts] = hosts;
  if (token === undefined) delete process.env[UNO_CONTACT_WEBHOOK_ENV.token];
  else process.env[UNO_CONTACT_WEBHOOK_ENV.token] = token;
}

afterEach(() => {
  for (const name of Object.values(UNO_CONTACT_WEBHOOK_ENV)) delete process.env[name];
  delete process.env.UNO_ANALYTICS_FORWARD_URL;
  delete process.env.UNO_ANALYTICS_FORWARD_HOSTS;
  vi.restoreAllMocks();
});

describe("a contact submission is a closed shape with declared bounds", () => {
  it("accepts exactly the three fields, normalized and unchanged in meaning", () => {
    const result = validateUnoContactSubmission({
      name: "  Ada Lovelace  ",
      email: "ada@example.com",
      message: "First line\r\nSecond line  \r\n",
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.submission).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "First line\nSecond line",
    });
    expect(result.fields).toEqual(["name", "email", "message"]);
  });

  it("refuses an extra field rather than ignoring it", () => {
    expect(validateUnoContactSubmission({ name: "Ada", email: "a@b.co", message: "x", role: "admin", page: "/x" }))
      .toMatchObject({ accepted: false, reason: "contact:unknown-field" });
  });

  it("refuses a filled honeypot before reading any other field", () => {
    expect(validateUnoContactSubmission({ website: "https://spam.example", name: "", email: "", message: "" }))
      .toMatchObject({ accepted: false, reason: "contact:honeypot-filled" });
  });

  it("holds each bound exactly: the limit is accepted and one code point past it is refused", () => {
    const atLimit = validateUnoContactSubmission({
      name: "n".repeat(UNO_CONTACT_LIMITS.nameCodePoints),
      email: "a@b.co",
      message: "m".repeat(UNO_CONTACT_LIMITS.messageCodePoints),
    });
    expect(atLimit.accepted).toBe(true);
    expect(validateUnoContactSubmission({
      name: "n".repeat(UNO_CONTACT_LIMITS.nameCodePoints + 1),
      email: "a@b.co",
      message: "m",
    })).toMatchObject({ accepted: false, reason: "contact:too-long" });
    expect(validateUnoContactSubmission({
      name: "Ada",
      email: "a@b.co",
      message: "m".repeat(UNO_CONTACT_LIMITS.messageCodePoints + 1),
    })).toMatchObject({ accepted: false, reason: "contact:too-long" });
  });

  it("refuses control characters instead of stripping them", () => {
    expect(validateUnoContactSubmission({ name: "Ada\u0000", email: "a@b.co", message: "x" }))
      .toMatchObject({ accepted: false, reason: "contact:control-character" });
    expect(validateUnoContactSubmission({ name: "Ada\nLovelace", email: "a@b.co", message: "x" }))
      .toMatchObject({ accepted: false, reason: "contact:control-character" });
  });

  it("refuses a mailbox that is not conservative, and every non-object shape", () => {
    for (const email of ["ada", "ada@", "@example.com", "ada@example", "ada@@example.com", "ada@exa mple.com"]) {
      expect(validateUnoContactSubmission({ name: "Ada", email, message: "x" }))
        .toMatchObject({ accepted: false, reason: "contact:email-invalid" });
    }
    for (const input of [null, [], "string", 7]) {
      expect(validateUnoContactSubmission(input)).toMatchObject({ accepted: false, reason: "contact:not-an-object" });
    }
  });

  it("bounds the serialized body, and publishes its closed vocabulary", () => {
    expect(isUnoContactSubmissionWithinBodyBound("x".repeat(UNO_CONTACT_LIMITS.bodyBytes))).toBe(true);
    expect(isUnoContactSubmissionWithinBodyBound("x".repeat(UNO_CONTACT_LIMITS.bodyBytes + 1))).toBe(false);
    expect(UNO_CONTACT_REFUSAL_REASONS).toHaveLength(9);
  });
});

describe("abuse protection is bounded and forgets rather than grows", () => {
  it("allows the declared burst and then refuses with a bounded retry", () => {
    const clock = 0;
    const take = createUnoContactRateLimiter(() => clock);
    for (let index = 0; index < UNO_CONTACT_RATE_LIMITS.burst; index += 1) {
      expect(take("caller").allowed).toBe(true);
    }
    const refused = take("caller");
    expect(refused.allowed).toBe(false);
    if (refused.allowed) return;
    expect(refused.retryAfterMs).toBeGreaterThan(0);
    expect(refused.retryAfterMs).toBeLessThanOrEqual(UNO_CONTACT_RATE_LIMITS.windowMs);
  });

  it("refills over the window and keeps each caller independent", () => {
    let clock = 0;
    const take = createUnoContactRateLimiter(() => clock);
    for (let index = 0; index < UNO_CONTACT_RATE_LIMITS.burst; index += 1) take("first");
    expect(take("first").allowed).toBe(false);
    expect(take("second").allowed).toBe(true);
    clock += UNO_CONTACT_RATE_LIMITS.windowMs;
    expect(take("first").allowed).toBe(true);
  });

  it("never lets a flood of distinct keys grow the map without limit", () => {
    let clock = 0;
    const take = createUnoContactRateLimiter(() => clock);
    for (let index = 0; index < UNO_CONTACT_RATE_LIMITS.keys + 500; index += 1) {
      clock += 1;
      expect(take(`caller-${index}`).allowed).toBe(true);
    }
    // The limiter is still usable for a fresh caller after 2,548 distinct keys were seen.
    expect(take("fresh").allowed).toBe(true);
  });
});

describe("a server never opens a socket to a private address", () => {
  it("admits an ordinary public HTTPS endpoint and nothing else", () => {
    expect(classifyPublicHttpsDestination("https://hooks.example.com/contact")).toEqual({
      accepted: true,
      href: "https://hooks.example.com/contact",
      host: "hooks.example.com",
    });
  });

  it("refuses a non-HTTPS scheme, a credential, a port and a bare label", () => {
    expect(classifyPublicHttpsDestination("http://hooks.example.com/contact"))
      .toMatchObject({ accepted: false, reason: "destination:not-https" });
    expect(classifyPublicHttpsDestination("mailto:ada@example.com"))
      .toMatchObject({ accepted: false, reason: "destination:not-https" });
    expect(classifyPublicHttpsDestination("https://user:pass@hooks.example.com/x"))
      .toMatchObject({ accepted: false, reason: "destination:credentials" });
    expect(classifyPublicHttpsDestination("https://hooks.example.com:8443/x"))
      .toMatchObject({ accepted: false, reason: "destination:unsafe-syntax" });
    expect(classifyPublicHttpsDestination("https://intranet/x"))
      .toMatchObject({ accepted: false, reason: "destination:public-suffix-missing" });
  });

  it("refuses loopback, private, link-local, CGNAT, reserved and IPv6 literals", () => {
    const refused = [
      "https://127.0.0.1/x",
      "https://10.0.0.1/x",
      "https://172.16.4.2/x",
      "https://192.168.1.10/x",
      "https://169.254.169.254/latest/meta-data",
      "https://100.64.0.1/x",
      "https://198.18.0.1/x",
      "https://223.255.255.1/x",
      "https://0.0.0.0/x",
      "https://localhost/x",
      "https://api.localhost/x",
      "https://printer.local/x",
      "https://service.internal/x",
      "https://[::1]/x",
      "https://8.8.8.8/x",
    ];
    for (const href of refused) {
      const verdict = classifyPublicHttpsDestination(href);
      expect(verdict.accepted, href).toBe(false);
      if (verdict.accepted) return;
      expect(["destination:private-address", "destination:ip-literal"], href).toContain(verdict.reason);
    }
  });

  it("matches an allowlist by exact host or subdomain, never by suffix trickery", () => {
    const allowlist = ["hooks.example.com"];
    expect(isUnoAllowlistedHost("hooks.example.com", allowlist)).toBe(true);
    expect(isUnoAllowlistedHost("eu.hooks.example.com", allowlist)).toBe(true);
    expect(isUnoAllowlistedHost("evil-hooks.example.com", allowlist)).toBe(false);
    expect(isUnoAllowlistedHost("hooks.example.com.evil.test", allowlist)).toBe(false);
    expect(isUnoAllowlistedHost("hooks.example.com", [])).toBe(false);
  });
});


describe("delivery is off by default, and every transport outcome is closed", () => {
  it("opens no transport at all when nothing is configured", async () => {
    const transport = vi.fn() as unknown as UnoContactTransport;
    const outcome = await deliverUnoContactSubmission(SUBMISSION, transport);
    expect(outcome).toEqual({ status: "not-configured" });
    expect(transport).not.toHaveBeenCalled();
    expect(resolveUnoContactWebhookConfig()).toEqual({ status: "not-configured" });
  });

  it("refuses a configuration the destination policy rejects, without calling the transport", async () => {
    const transport = vi.fn() as unknown as UnoContactTransport;
    configure("https://127.0.0.1/collect", "127.0.0.1");
    expect(await deliverUnoContactSubmission(SUBMISSION, transport))
      .toMatchObject({ status: "configuration-invalid" });
    expect(transport).not.toHaveBeenCalled();

    configure("https://hooks.example.com/collect", "other.example.com");
    expect(await deliverUnoContactSubmission(SUBMISSION, transport))
      .toEqual({ status: "configuration-invalid", reason: "destination:not-allowlisted" });
    expect(transport).not.toHaveBeenCalled();

    configure("https://hooks.example.com/collect", "");
    expect(await deliverUnoContactSubmission(SUBMISSION, transport))
      .toEqual({ status: "configuration-invalid", reason: "contact:allowlist-missing" });
    expect(transport).not.toHaveBeenCalled();
  });

  it("accepts only a 2xx, and never follows a redirect", async () => {
    configure("https://hooks.example.com/collect", "hooks.example.com", "s3cret");

    const accepted = vi.fn(async () => ({ status: 202, text: async () => "" }));
    expect(await deliverUnoContactSubmission(SUBMISSION, accepted)).toEqual({ status: "accepted", httpStatus: 202 });
    const [url, init] = accepted.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(url).toBe("https://hooks.example.com/collect");
    expect(init["method"]).toBe("POST");
    expect(init["redirect"]).toBe("manual");
    expect(init["cache"]).toBe("no-store");
    expect((init["headers"] as Record<string, string>)["authorization"]).toBe("Bearer s3cret");
    expect(JSON.parse(String(init["body"]))).toEqual({
      source: "uno-contact",
      page: "/en-001/about",
      submission: { name: "Ada", email: "ada@example.com", message: "Hello." },
    });

    const redirect = vi.fn(async () => ({ status: 302, text: async () => "" }));
    expect(await deliverUnoContactSubmission(SUBMISSION, redirect))
      .toEqual({ status: "redirect-refused", httpStatus: 302 });

    const rejected = vi.fn(async () => ({ status: 422, text: async () => "no" }));
    expect(await deliverUnoContactSubmission(SUBMISSION, rejected))
      .toEqual({ status: "provider-rejected", httpStatus: 422 });
  });

  it("distinguishes a timeout from a network failure, and bounds the response it reads", async () => {
    configure("https://hooks.example.com/collect", "hooks.example.com");

    const timeout = vi.fn(async () => {
      const error = new Error("aborted");
      error.name = "TimeoutError";
      throw error;
    });
    expect(await deliverUnoContactSubmission(SUBMISSION, timeout)).toEqual({ status: "timeout" });

    const failure = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    expect(await deliverUnoContactSubmission(SUBMISSION, failure)).toEqual({ status: "network-error" });

    const oversized = vi.fn(async () => ({ status: 200, text: async () => "x".repeat(4096) }));
    expect(await deliverUnoContactSubmission(SUBMISSION, oversized))
      .toEqual({ status: "response-too-large", httpStatus: 200 });
  });

  it("never puts the submission or the credential in an error path", async () => {
    configure("https://hooks.example.com/collect", "hooks.example.com", "s3cret");
    const failure = vi.fn(async () => {
      throw new Error("boom");
    });
    const outcome = await deliverUnoContactSubmission(SUBMISSION, failure);
    const serialized = JSON.stringify(outcome);
    expect(serialized).not.toContain("ada@example.com");
    expect(serialized).not.toContain("Hello.");
    expect(serialized).not.toContain("s3cret");
  });
});


describe("analytics are opt-in, and off unless an operator authors them", () => {
  it("is off when absent, explicitly off when disabled, and enabled only with a public HTTPS endpoint", () => {
    expect(validateUnoAnalyticsDeclaration(undefined)).toEqual({ enabled: false, reason: "analytics:not-declared" });
    expect(validateUnoAnalyticsDeclaration({ enabled: false })).toEqual({ enabled: false, reason: "analytics:disabled" });
    expect(validateUnoAnalyticsDeclaration({ enabled: true, endpoint: "https://collect.example.com/e" }))
      .toEqual({ enabled: true, endpoint: "https://collect.example.com/e", host: "collect.example.com" });
    expect(validateUnoAnalyticsDeclaration({ enabled: true }))
      .toEqual({ enabled: false, reason: "analytics:endpoint-missing" });
    expect(validateUnoAnalyticsDeclaration({ enabled: true, endpoint: "http://collect.example.com/e" }))
      .toMatchObject({ enabled: false, reason: "destination:not-https" });
    expect(validateUnoAnalyticsDeclaration({ enabled: true, endpoint: "https://10.1.2.3/e" }))
      .toMatchObject({ enabled: false, reason: "destination:private-address" });
    expect(validateUnoAnalyticsDeclaration({ enabled: true, endpoint: "https://x.example.com/e", id: "v1" }))
      .toEqual({ enabled: false, reason: "analytics:unknown-key" });
  });

  it("admits exactly one event name and one bounded Path, and nothing identifying", () => {
    expect(UNO_ANALYTICS_EVENTS).toEqual(["page-view"]);
    expect(validateUnoAnalyticsEvent({ event: "page-view", path: "/en-001/about" }))
      .toEqual({ event: "page-view", path: "/en-001/about" });
    expect(validateUnoAnalyticsEvent({ event: "page-view", path: "/en-001", id: "abc" }))
      .toEqual({ refused: "analytics:unknown-key" });
    expect(validateUnoAnalyticsEvent({ event: "click", path: "/en-001" }))
      .toEqual({ refused: "analytics:event-invalid" });
    expect(validateUnoAnalyticsEvent({ event: "page-view", path: "https://elsewhere.test" }))
      .toEqual({ refused: "analytics:path-invalid" });
    expect(validateUnoAnalyticsEvent(null)).toEqual({ refused: "analytics:not-object" });
  });
});
