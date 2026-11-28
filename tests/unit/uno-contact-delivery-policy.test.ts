/**
 * `U05`: the private delivery policy, explicit form enablement and placement.
 *
 * These are the rules that keep publication and delivery independent. A public contact fact is content; a form is an
 * operator decision; the recipient, sender and Reply-To are server configuration. None of the three implies another, and
 * this suite proves each boundary.
 */
import { describe, expect, it } from "vitest";

import {
  readUnoContactDeliveryPolicy,
  type UnoContactPolicyInput,
} from "../../src/core/contact/uno-contact-delivery-policy";
import { authorizeUnoContactRender, authorizeUnoContactSubmission } from "../../src/core/contact/uno-contact-authorization";

const policy = (overrides: Partial<UnoContactPolicyInput> = {}): UnoContactPolicyInput => ({
  recipients: "owner@example.test",
  sender: "noreply@mail.example.test",
  senderDomains: "mail.example.test",
  replyTo: null,
  ...overrides,
});

describe("the private delivery policy", () => {
  it("accepts a complete, authorised policy and defaults Reply-To to the visitor", () => {
    const result = readUnoContactDeliveryPolicy(policy());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.policy).toEqual({
      recipients: ["owner@example.test"],
      sender: "noreply@mail.example.test",
      replyTo: "visitor",
    });
  });

  it("honours an explicit refusal to carry a Reply-To", () => {
    const result = readUnoContactDeliveryPolicy(policy({ replyTo: "none" }));
    expect(result.ok && result.policy.replyTo).toBe("none");
  });

  it("refuses an absent, malformed, foreign or unbounded policy, naming the first failed step", () => {
    const cases: readonly [Partial<UnoContactPolicyInput>, string][] = [
      [{ recipients: null }, "contact:policy-not-configured"],
      [{ sender: null }, "contact:policy-not-configured"],
      [{ sender: "not-a-mailbox" }, "contact:policy-invalid"],
      [{ replyTo: "sometimes" }, "contact:policy-invalid"],
      [{ senderDomains: null }, "contact:policy-unauthorized-sender"],
      [{ senderDomains: "other.example" }, "contact:policy-unauthorized-sender"],
      [{ recipients: "" }, "contact:policy-unauthorized-recipient"],
      [{ recipients: "owner@example.test,second@example.test,third@example.test,fourth@example.test,fifth@example.test,sixth@example.test" }, "contact:policy-unauthorized-recipient"],
      [{ recipients: "not-a-mailbox" }, "contact:policy-unauthorized-recipient"],
    ];
    for (const [overrides, reason] of cases) {
      const result = readUnoContactDeliveryPolicy(policy(overrides));
      expect(result.ok, JSON.stringify(overrides)).toBe(false);
      if (result.ok) continue;
      expect(result.reason).toBe(reason);
    }
  });
});

describe("explicit form enablement and placement", () => {
  const publication = {
    served: true,
    public: true,
    siteId: "main",
    facetId: "foundation",
    routePath: "/en-001/contact",
    localeTag: "en-001",
  };
  const declaration = { declared: true, formRef: "home-contact-form" };
  const submission = { formRef: "home-contact-form", page: "/en-001/contact", siteId: "main" };

  it("does not render or accept a form that no operator enabled, however the Site's facts read", () => {
    const disabled = { site: "undeclared" as const, form: "enabled" as const, placement: "undeclared" as const, transport: "provider" as const };
    expect(authorizeUnoContactRender({ publication, declaration, enablement: disabled })).toMatchObject({
      kind: "refused",
      reason: "contact:site-disabled",
    });
    expect(authorizeUnoContactSubmission({ publication, declaration, enablement: disabled, submission })).toMatchObject({
      kind: "refused",
      outcome: "off",
    });
  });

  it("refuses a form that is enabled but not placed on this Page", () => {
    const unplaced = { site: "enabled" as const, form: "enabled" as const, placement: "unauthorized" as const, transport: "provider" as const };
    expect(authorizeUnoContactRender({ publication, declaration, enablement: unplaced })).toMatchObject({
      kind: "refused",
      reason: "contact:form-placement",
    });
    const decision = authorizeUnoContactSubmission({ publication, declaration, enablement: unplaced, submission });
    expect(decision.kind).toBe("refused");
    if (decision.kind !== "refused") return;
    expect(decision.outcome).toBe("unauthorized");
    expect(decision.reason).toBe("contact:form-placement");
  });

  it("accepts only the fully declared, placed and transported case", () => {
    const enabled = { site: "enabled" as const, form: "enabled" as const, placement: "authorized" as const, transport: "provider" as const };
    expect(authorizeUnoContactRender({ publication, declaration, enablement: enabled }).kind).toBe("allowed");
    expect(authorizeUnoContactSubmission({ publication, declaration, enablement: enabled, submission }).kind).toBe("allowed");
  });
});
