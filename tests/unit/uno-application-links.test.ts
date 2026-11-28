/**
 * `U05`: the generic application-link boundary.
 *
 * The point of these tests is that the boundary is generic: the renderer sees declaration ids only, a resolver sees
 * application keys only, and an unauthorised, revoked, suppressed or foreign destination produces no link at all.
 */
import { describe, expect, it } from "vitest";

import {
  isAdmissibleApplicationHref,
  resolveUnoApplicationLinks,
  type UnoApplicationLinkResolver,
} from "../../src/core/links/uno-application-link";
import { createUnoApplicationLinkResolvers, UNO_APPLICATION_KEYS } from "../../src/composition/uno-application-links";
import { projectPublicContact } from "../../src/connect";

const declarations = {
  "contact-slot": { key: UNO_APPLICATION_KEYS.publicContactEmail },
  "unknown-slot": { key: "public-contact-something-else" },
} as const;

/** A resolver that answers one key with one destination. */
const answers = (key: string, href: string): UnoApplicationLinkResolver => (asked) =>
  asked === key ? { key, href } : null;

describe("the generic application-link boundary", () => {
  it("resolves a declaration through the key its resolver owns, and leaves the rest absent", () => {
    const table = resolveUnoApplicationLinks(declarations, [answers(UNO_APPLICATION_KEYS.publicContactEmail, "mailto:a@example.test")]);
    expect(table.get("contact-slot")).toBe("mailto:a@example.test");
    expect(table.has("unknown-slot")).toBe(false);
  });

  it("ignores a resolver that answers for a different key than it was asked about", () => {
    // A resolver can never widen its authority by returning another capability's key.
    const confused: UnoApplicationLinkResolver = () => ({ key: "another-key", href: "mailto:a@example.test" });
    expect(resolveUnoApplicationLinks(declarations, [confused]).size).toBe(0);
  });

  it("refuses inadmissible destinations instead of rendering them", () => {
    for (const href of [
      "javascript:alert(1)",
      "data:text/html,x",
      "http://example.test/",
      "//evil.example/",
      "https://user:pass@example.test/",
      "tel:+441234567890",
      "mailto:a@example.test?bcc=evil@example.test",
      "mailto:a@example.test\nBcc: evil@example.test",
      "/relative",
    ]) {
      expect(isAdmissibleApplicationHref(href), href).toBe(false);
      expect(resolveUnoApplicationLinks(declarations, [answers(UNO_APPLICATION_KEYS.publicContactEmail, href)]).size, href).toBe(0);
    }
    expect(isAdmissibleApplicationHref("https://example.test/contact")).toBe(true);
    expect(isAdmissibleApplicationHref("mailto:hello@example.test")).toBe(true);
  });

  it("resolves nothing when the Connect projection is absent, unavailable or scoped elsewhere", () => {
    const absent = projectPublicContact({ authority: authority(), configuration: undefined });
    expect(createUnoApplicationLinkResolvers({ publicContact: absent })).toHaveLength(1);
    expect(resolveUnoApplicationLinks(declarations, createUnoApplicationLinkResolvers({ publicContact: absent })).size).toBe(0);

    const suppressed = projectPublicContact({
      authority: authority(),
      configuration: {
        sites: {
          main: {
            siteId: "main",
            authorizationRef: REF,
            methods: [{ channel: "email", value: "hello@example.test", expose: ["publicContact"], suppressed: true }],
          },
        },
      },
    });
    expect(resolveUnoApplicationLinks(declarations, createUnoApplicationLinkResolvers({ publicContact: suppressed })).size).toBe(0);

    // A projection authorised for another Site cannot answer for this render, because it contains nothing to answer with.
    const foreign = projectPublicContact({
      authority: authority({ siteId: "other" }),
      configuration: {
        sites: { main: { siteId: "main", authorizationRef: REF, methods: [{ channel: "email", value: "a@example.test", expose: ["publicContact"] }] } },
      },
    });
    expect(foreign.kind).toBe("absent");
    expect(resolveUnoApplicationLinks(declarations, createUnoApplicationLinkResolvers({ publicContact: foreign })).size).toBe(0);
  });

  it("resolves an authorised projection to the destination Connect built", () => {
    const available = projectPublicContact({
      authority: authority(),
      configuration: {
        sites: {
          main: {
            siteId: "main",
            authorizationRef: REF,
            methods: [{ channel: "email", value: "hello@example.test", expose: ["publicContact"] }],
          },
        },
      },
    });
    const table = resolveUnoApplicationLinks(declarations, createUnoApplicationLinkResolvers({ publicContact: available }));
    expect(table.get("contact-slot")).toBe("mailto:hello@example.test");
    expect(table.has("unknown-slot")).toBe(false);
  });
});

const REF = "https://example.test/en-001";
const authority = (overrides: Record<string, unknown> = {}) => ({
  deploymentId: "example.test",
  ownerId: "owner-1",
  siteId: "main",
  authorizationRef: REF,
  publicationPublic: true,
  ...overrides,
});
