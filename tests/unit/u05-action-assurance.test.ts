/**
 * Foundation Uno — the U05 action and property assurance.
 *
 * The approved action capabilities are mail, maps, directions and external booking links. They were already representable
 * through the unchanged authored-action contract, and these tests pin that: an authored `mailto:` and an authored `https:`
 * destination are admitted everywhere actions are allowed, every unsafe scheme or laundering shape is refused by the same
 * policy, and the rendered anchor carries the authored destination rather than a computed one. The property boundary is pinned
 * too: the contact facts exist as authored keys and none of them is public, so no contact value can reach a served Page.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { readUnoPageDocument } from "../../src/core/page-document";
import { UNO_PROPERTY_KEYS } from "../../src/core/efs/properties";

/** The four approved authored destinations, in the shape an author would write them. */
const APPROVED = Object.freeze([
  ["a contact address", "mailto:hello@example.com"],
  ["a maps link", "https://maps.example.com/?q=Foundation+Uno"],
  ["a directions link", "https://www.google.com/maps/dir/?api=1&destination=Foundation+Uno"],
  ["a booking link", "https://cal.example.com/team/intro-session"],
] as const);

/** One `content.actions` document carrying the given destinations. */
function actionsDocument(hrefs: readonly string[]) {
  return {
    version: 1,
    title: "Actions",
    sections: [
      {
        id: "actions",
        module: "content.actions",
        props: { items: hrefs.map((href, index) => ({ label: `Action ${index + 1}`, href })) },
      },
    ],
  };
}

describe("the approved authored actions are supported as authored", () => {
  it("admits a contact address, a maps link, a directions link and a booking link", () => {
    for (const [label, href] of APPROVED) {
      const result = readUnoPageDocument(actionsDocument([href]));
      expect(result.accepted, `${label}: ${href}`).toBe(true);
    }
    const all = readUnoPageDocument(actionsDocument(APPROVED.map(([, href]) => href)));
    expect(all.accepted).toBe(true);
    if (!all.accepted) return;
    const sections = all.document.sections;
    const first = sections[0];
    expect(first).toBeDefined();
    if (first === undefined || first.module !== "content.actions") return;
    expect(first.props.items.map((item) => ("href" in item ? item.href : "")).filter((href) => href.length > 0)).toEqual(
      APPROVED.map(([, href]) => href),
    );
  });

  it("routes every action position through the one unchanged classifier", () => {
    // Hero, card, list-item and stand-alone action readers all delegate to `classifyAuthorDestination`; none of them adds a second
    // destination rule, which is why the approved use cases need no new contract.
    const contract = readFileSync("src/core/page-document.ts", "utf8");
    const delegations = contract.match(/classifyAuthorDestination\(/gu) ?? [];
    expect(delegations.length).toBeGreaterThanOrEqual(4);
    for (const reader of ["readActionItems", "readCardAction", "readContentActions"]) {
      expect(contract.includes(reader)).toBe(true);
    }
  });

  it("refuses every destination the established policy refuses, wherever it is authored", () => {
    for (const href of [
      "tel:+441234567890",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "http://maps.example.com/",
      "//evil.example.com/",
      "https://user:pass@maps.example.com/",
      "https://maps.example.com/#&#x3C;script>",
      "/relative",
      "booking",
    ]) {
      const result = readUnoPageDocument(actionsDocument([href]));
      expect(result.accepted, href).toBe(false);
      if (result.accepted) return;
      expect(result.reason, href).toBe("document:unsafe-link");
    }
  });
});

describe("the contact facts exist as authored keys and none of them is public", () => {
  it("declares the canonical contact keys in the closed property vocabulary", () => {
    for (const key of ["contact.name", "contact.email", "contact.phone"]) {
      expect(UNO_PROPERTY_KEYS).toContain(key);
    }
  });

  it("keeps every declared contact property non-public in the committed manifest", () => {
    const manifest = JSON.parse(readFileSync("deployment/efs/manifest.json", "utf8"));
    const entries: { key: string; value: unknown }[] = [];
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) {
        for (const item of value) walk(item);
        return;
      }
      if (typeof value !== "object" || value === null) return;
      for (const [key, child] of Object.entries(value)) {
        if (key.startsWith("contact.")) entries.push({ key, value: child as unknown });
        walk(child);
      }
    };
    walk(manifest);
    for (const entry of entries) {
      expect(entry.value, entry.key).toMatchObject({ public: false });
    }
  });

  it("never builds a contact destination in the renderer", () => {
    const renderer = readFileSync("src/components/uno-page-sections.tsx", "utf8");
    expect(renderer.includes("mailto:")).toBe(false);
    expect(renderer.includes("tel:")).toBe(false);
    const island = readFileSync("src/components/uno-interaction-island.tsx", "utf8");
    expect(island.includes("mailto:")).toBe(false);
    expect(island.includes("tel:")).toBe(false);
  });
});
