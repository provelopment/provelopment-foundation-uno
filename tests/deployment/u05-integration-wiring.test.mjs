/**
 * Foundation Uno — the U05 wiring guard.
 *
 * A capability that is "off by default" is only trustworthy while the clauses that keep it off stay in place: an endpoint that
 * stops validating, an adapter that stops allowlisting, a route that stops refusing an unconfigured installation, an island that
 * reaches a foreign host, or a presentation file that silently enables analytics would each leave the product claiming a
 * guarantee it no longer executes. This guard requires every clause, and proves its own sensitivity by removing each one.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();
const read = (relativePath) => readFileSync(resolve(ROOT, relativePath), "utf8");

/** Every clause the U05 capability depends on, with the file that must keep it. */
const REQUIRED = Object.freeze([
  ["src/core/contact/uno-contact-submission.ts", "export function validateUnoContactSubmission"],
  ["src/core/contact/uno-contact-submission.ts", "contact:honeypot-filled"],
  ["src/core/contact/uno-contact-submission.ts", 'reason: "contact:too-long"'],
  ["src/core/contact/uno-contact-submission.ts", "const EMAIL_PATTERN"],
  ["src/core/contact/uno-contact-rate-limit.ts", "UNO_CONTACT_RATE_LIMITS"],
  ["src/core/contact/uno-contact-rate-limit.ts", "buckets.delete(oldestKey)"],
  ["src/core/efs/uno-public-destination.ts", "export function classifyPublicHttpsDestination"],
  ["src/core/efs/uno-public-destination.ts", "const PRIVATE_IPV4"],
  ["src/core/efs/uno-public-destination.ts", "export function isUnoAllowlistedHost"],
  ["src/adapters/contact/uno-contact-webhook.ts", 'url: "UNO_CONTACT_WEBHOOK_URL"'],
  ["src/adapters/contact/uno-contact-webhook.ts", 'hosts: "UNO_CONTACT_WEBHOOK_HOSTS"'],
  ["src/adapters/contact/uno-contact-webhook.ts", 'token: "UNO_CONTACT_WEBHOOK_TOKEN"'],
  ["src/adapters/contact/uno-contact-webhook.ts", 'return { status: "redirect-refused", httpStatus: outcome.status };'],
  ["src/adapters/contact/uno-contact-webhook.ts", "totalTimeoutMs: resolved.config.totalTimeoutMs"],
  ["src/adapters/net/uno-pinned-https-transport.ts", "classifyResolvedAddress"],
  ["src/adapters/net/uno-pinned-https-transport.ts", "agent: false"],
  ["src/adapters/net/uno-pinned-https-transport.ts", "maxHeaderSize: UNO_PINNED_HTTPS_LIMITS.headerBytes"],
  ["src/adapters/net/uno-pinned-https-transport.ts", "callback(null, target.address, target.family)"],
  ["src/adapters/net/uno-pinned-https-transport.ts", "destination:address-mismatch"],
  ["src/adapters/contact/uno-contact-webhook.ts", 'return { status: "not-configured" };'],
  ["src/app/api/contact/route.ts", 'export const dynamic = "force-dynamic";'],
  ["src/app/api/contact/route.ts", 'return answer({ status: "unavailable", reason: policyResult.reason }, 503);'],
  ["src/app/api/contact/route.ts", '"cache-control": "no-store"'],
  ["src/app/api/contact/route.ts", 'contentType.toLowerCase().startsWith("application/json")'],
  ["src/app/api/contact/route.ts", "isUnoContactSubmissionWithinBodyBound(text)"],
  ["src/app/api/contact/route.ts", "takeToken(callerKey(request))"],
  ["src/app/api/analytics/route.ts", 'if ("refused" in event) return quiet(400);'],
  ["src/app/api/analytics/route.ts", 'return quiet(503)'],
  ["src/adapters/analytics/uno-analytics-forward.ts", "classifyPublicHttpsDestination(url)"],
  ["src/adapters/analytics/uno-analytics-forward.ts", 'return { status: "not-enabled" };'],
  ["src/core/analytics/uno-analytics.ts", 'reason: "analytics:disabled"'],
  ["src/core/analytics/uno-analytics.ts", 'reason: "analytics:not-declared"'],
  ["src/core/efs/uno-presentation.ts", 'return "presentation:analytics-invalid";'],
  ["src/components/uno-interaction-island.tsx", 'fetch("/api/contact"'],
  ["src/components/uno-interaction-island.tsx", 'fetch("/api/analytics"'],
  ["src/components/uno-interaction-island.tsx", 'credentials: "omit"'],
  ["src/components/uno-interaction-island.tsx", 'role="status"'],
  ["src/app/(site)/[...segments]/page.tsx", "readUnoServingPresentationFacts("],
  ["src/app/(site)/[...segments]/page.tsx", "facts.analyticsPath === null ? null : <UnoAnalyticsBeacon"],
  ["src/components/uno-page-sections.tsx", "contact?.formEnabled === true &&"],
  ["src/config/uno-serving.ts", 'contactDelivery: resolveUnoContactWebhookConfig().status === "configured"'],
]);

const missing = (text, tokens) => tokens.filter((token) => !text.includes(token));


describe("the U05 capability is wired end to end", () => {
  it("keeps every clause in the file that owns it", () => {
    for (const [file, token] of REQUIRED) {
      assert.deepEqual(missing(read(file), [token]), [], `${file} :: ${token}`);
    }
  });

  it("fails the same audit when any clause is removed", () => {
    for (const [file, token] of REQUIRED) {
      const text = read(file);
      const mutated = text.split(token).join("REMOVED");
      assert.notEqual(mutated, text, `${file} :: ${token}`);
      assert.ok(missing(mutated, [token]).includes(token), `${file} :: ${token}`);
    }
  });

  it("fails the same audit when the OFF default is neutered", () => {
    const declaration = read("src/core/analytics/uno-analytics.ts");
    for (const [clause, neutered] of [
      ['if (value === undefined) return { enabled: false, reason: "analytics:not-declared" };', "if (value === undefined) return { enabled: true, endpoint: \"x\", host: \"x\" };"],
      ['if (record["enabled"] === false) return { enabled: false, reason: "analytics:disabled" };', "void 0;"],
    ]) {
      const mutated = declaration.split(clause).join(neutered);
      assert.notEqual(mutated, declaration, clause);
      assert.ok(missing(mutated, [clause]).includes(clause), clause);
    }
    // The allowlist itself is the other half of the OFF default: without it, any enabled declaration would be admitted.
    const adapter = read("src/adapters/contact/uno-contact-webhook.ts");
    const unallowlisted = adapter.replace("if (!isUnoAllowlistedHost(destination.host, allowlist)) {", "if (false) {");
    assert.notEqual(unallowlisted, adapter);
    assert.ok(missing(unallowlisted, ["if (!isUnoAllowlistedHost(destination.host, allowlist)) {"]).length === 1);
  });
});

describe("the committed product ships with the capability off", () => {
  const presentation = JSON.parse(read("deployment/site.config.json"));

  it("declares no analytics entry, so no beacon is rendered and no event is sent", () => {
    for (const site of presentation.sites) {
      assert.equal(Object.hasOwn(site, "analytics"), false, JSON.stringify(site.site));
    }
  });

  it("commits no webhook URL, token or provider identifier anywhere in the declarations", () => {
    for (const path of [
      "deployment/site.config.json",
      "deployment/uno.config.json",
      "deployment/efs/manifest.json",
    ]) {
      const text = read(path);
      assert.equal(/UNO_CONTACT_WEBHOOK|hooks\.|webhook|api[_-]?key/iu.test(text), false, path);
    }
  });
});
