/**
 * `U05`: Connect's public-contact decision, the property exposure gate in front of it, the shared authorization
 * policy, the composed message and the localized copy.
 *
 * These are the contracts the contact capability rests on. Nothing here reads the environment or opens a socket.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { primaryPublicContactHref, projectPublicContact, type PublicContactConfiguration } from "../../src/connect";
import { projectUnoPublicContact } from "../../src/application/project-uno-public-contact";
import {
  authorizeUnoContactRender,
  authorizeUnoContactSubmission,
} from "../../src/core/contact/uno-contact-authorization";
import { composeUnoContactMessage } from "../../src/core/contact/uno-contact-message";
import { unoContactCopy, unoContactLengthHint } from "../../src/core/contact/uno-contact-copy";
import { parseUnoSender } from "../../src/core/contact/uno-contact-address";

const SITE = "main";
const REF = "https://example.test/en-001";

const authority = (overrides: Record<string, unknown> = {}) => ({
  deploymentId: "example.test",
  ownerId: "owner-1",
  siteId: SITE,
  authorizationRef: REF,
  publicationPublic: true,
  ...overrides,
});

const configuration = (
  methods: readonly Record<string, unknown>[],
  overrides: { siteId?: string; authorizationRef?: string } = {},
): PublicContactConfiguration => ({
  sites: {
    [SITE]: {
      siteId: overrides.siteId ?? SITE,
      authorizationRef: overrides.authorizationRef ?? REF,
      methods: methods as never,
    },
  },
});

describe("Connect projectPublicContact", () => {
  it("publishes exposed methods as finished destinations, in authored order", () => {
    const projection = projectPublicContact({
      authority: authority(),
      configuration: configuration([
        { channel: "telephone", value: "+44 20 7946 0958", label: "Call", expose: ["publicContact"] },
        { channel: "email", value: "hello@example.test", label: "Email", expose: ["publicContact"] },
      ]),
    });
    expect(projection.kind).toBe("available");
    if (projection.kind !== "available") return;
    expect(projection.methods.map((method) => method.href)).toEqual([
      "tel:+442079460958",
      "mailto:hello@example.test",
    ]);
    expect(primaryPublicContactHref(projection)).toBe("mailto:hello@example.test");
  });

  it("is absent when nothing is declared, and when every method is withheld", () => {
    expect(projectPublicContact({ authority: authority(), configuration: undefined })).toEqual({
      kind: "absent",
      reason: "not-declared",
    });
    expect(
      projectPublicContact({
        authority: authority(),
        configuration: configuration([
          { channel: "email", value: "gone@example.test", expose: ["publicContact"], suppressed: true },
          { channel: "email", value: "old@example.test", expose: ["publicContact"], revoked: true },
          { channel: "telephone", value: "+442079460958" },
        ]),
      }),
    ).toEqual({ kind: "absent", reason: "nothing-exposed" });
  });

  it("refuses a foreign scope, an unauthorised publication and a non-public Page", () => {
    const method = [{ channel: "email", value: "a@example.test", expose: ["publicContact"] }];
    expect(
      projectPublicContact({ authority: authority(), configuration: configuration(method, { siteId: "other" }) }),
    ).toEqual({ kind: "unavailable", reason: "scope-mismatch" });
    expect(
      projectPublicContact({
        authority: authority(),
        configuration: configuration(method, { authorizationRef: "https://example.test/elsewhere" }),
      }),
    ).toEqual({ kind: "unavailable", reason: "publication-mismatch" });
    expect(
      projectPublicContact({
        authority: authority({ publicationPublic: false }),
        configuration: configuration(method),
      }),
    ).toEqual({ kind: "unavailable", reason: "unauthorized" });
  });

  it("refuses every address a mailto could turn into a header or a second recipient", () => {
    for (const value of [
      "hello@example.test?bcc=evil@example.test",
      "hello@example.test,evil@example.test",
      "hello@example.test\nBcc: evil@example.test",
      "hello%0a@example.test",
    ]) {
      expect(
        projectPublicContact({
          authority: authority(),
          configuration: configuration([{ channel: "email", value, expose: ["publicContact"] }]),
        }),
        value,
      ).toEqual({ kind: "unavailable", reason: "malformed" });
    }
  });

describe("the property exposure gate in front of Connect", () => {
  const base = { facetId: "foundation", siteId: SITE, host: "example.test", canonicalUrl: REF, publicationPublic: true };

  /** The committed manifest, read fresh, so the test proves the shipped declaration rather than a fixture. */
  const committed = () => JSON.parse(readFileSync("deployment/efs/manifest.json", "utf8"));

  it("publishes the committed public contact fact with its provenance", () => {
    const projection = projectUnoPublicContact({ ...base, manifest: committed() });
    expect(projection.kind).toBe("available");
    if (projection.kind !== "available") return;
    expect(projection.methods[0]?.href).toBe("mailto:hello@example.com");
    expect(projection.methods[0]?.origin?.level).toBe("entity");
  });

  it("publishes nothing when the same fact names no exposure surface", () => {
    const manifest = committed();
    delete manifest.entities[0].properties["contact.email"].expose;
    expect(projectUnoPublicContact({ ...base, manifest })).toEqual({ kind: "absent", reason: "not-declared" });
  });

  it("lets a Site suppression win over the Entity grant", () => {
    const manifest = committed();
    manifest.entities[0].facets[0].sites[0].properties = { "contact.email": { value: null, public: false } };
    expect(projectUnoPublicContact({ ...base, manifest })).toEqual({ kind: "absent", reason: "not-declared" });
  });
});

describe("the shared contact authorization policy", () => {
  const publication = {
    served: true,
    public: true,
    siteId: SITE,
    facetId: "foundation",
    routePath: "/en-001/contact",
    localeTag: "en-001",
  };
  const declaration = { declared: true, formRef: "contact-form" };
  const enabled = { site: "enabled", form: "enabled", transport: "provider" } as const;
  const submission = { formRef: "contact-form", page: "/en-001/contact", siteId: SITE };

  it("allows exactly the submission the served Page declared, and binds the server identity", () => {
    const decision = authorizeUnoContactSubmission({ publication, declaration, enablement: enabled, submission });
    expect(decision.kind).toBe("allowed");
    if (decision.kind !== "allowed") return;
    expect(decision.identity).toMatchObject({ siteId: SITE, formRef: "contact-form", transport: "provider" });
  });

  it("refuses an unproven publication, a foreign form, an invented path and a disabled Site", () => {
    const cases: readonly [Record<string, unknown>, string][] = [
      [{ publication: { ...publication, served: false } }, "contact:publication-unproven"],
      [{ submission: { ...submission, formRef: "someone-else" } }, "contact:form-mismatch"],
      [{ submission: { ...submission, page: "/en-001" } }, "contact:page-mismatch"],
      [{ submission: { ...submission, siteId: "other" } }, "contact:publication-unproven"],
      [{ enablement: { ...enabled, site: "disabled" } }, "contact:site-disabled"],
      [{ enablement: { ...enabled, form: "undeclared" } }, "contact:form-disabled"],
      [{ enablement: { ...enabled, transport: "none" } }, "contact:transport-unavailable"],
    ];
    for (const [override, reason] of cases) {
      const decision = authorizeUnoContactSubmission({
        publication,
        declaration,
        enablement: enabled,
        submission,
        ...override,
      } as never);
      expect(decision.kind, reason).toBe("refused");
      if (decision.kind !== "refused") continue;
      expect(decision.reason).toBe(reason);
    }
  });

  it("hides the render surface for exactly the same facts that hide the submit path", () => {
    expect(authorizeUnoContactRender({ publication, declaration, enablement: enabled }).kind).toBe("allowed");
    expect(
      authorizeUnoContactRender({ publication, declaration, enablement: { ...enabled, transport: "none" } }),
    ).toMatchObject({ kind: "refused", outcome: "unavailable" });
  });
});

});

describe("the composed message and the localized copy", () => {
  const identity = {
    siteId: SITE,
    facetId: "foundation",
    formRef: "contact-form",
    routePath: "/en-001/contact",
    localeTag: "en-001",
    transport: "provider" as const,
  };

  it("keeps a single-line subject, a plain-text body and a stable non-PII key", () => {
    const composed = composeUnoContactMessage({
      identity,
      submission: { name: "Ada", email: "ada@example.test", message: "Hello\nthere" },
      siteName: "Example\nSite",
    });
    expect(composed.ok).toBe(true);
    if (!composed.ok) return;
    expect(composed.message.subject).not.toMatch(/[\r\n]/u);
    expect(composed.message.text).toContain("Name: Ada");
    expect(composed.message.idempotencyKey).toMatch(/^uno-[0-9a-f]{8}$/u);
    expect(composed.message.idempotencyKey).not.toContain("ada");
  });

  it("refuses a body past the declared bound", () => {
    expect(
      composeUnoContactMessage({
        identity,
        submission: { name: "Ada", email: "ada@example.test", message: "x".repeat(9000) },
        siteName: null,
      }),
    ).toEqual({ ok: false, reason: "contact:message-too-large" });
  });

  it("translates a known language and falls back to English for an unknown one", () => {
    expect(unoContactCopy("es-ES").submit).toBe("Enviar mensaje");
    expect(unoContactCopy("pt-BR").submit).toBe("Send message");
    expect(unoContactLengthHint(unoContactCopy("en-001"), 4000)).toBe("Up to 4000 characters.");
  });

  it("parses a bare and a display-name sender, and refuses anything that could split a header", () => {
    expect(parseUnoSender("Example Site <noreply@example.test>")).toEqual({
      address: "noreply@example.test",
      displayName: "Example Site",
    });
    for (const value of ["a@example.test, b@example.test", "Example\nBcc: x", "<>", ""]) {
      expect(parseUnoSender(value), value).toBeNull();
    }
  });
});
