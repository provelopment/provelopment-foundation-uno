import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { UnoPageSections } from "../../src/components/uno-page-sections";
import { readUnoPageDocument, type UnoPageDocument } from "../../src/core/page-document";

/** One minimal v1 envelope: exactly one list section, plus whatever this test needs to add. */
function listDocument(items: readonly unknown[], links?: unknown) {
  return {
    version: 1,
    title: "Synthetic A2 destination specimen",
    ...(links === undefined ? {} : { links }),
    sections: [{ id: "links", module: "content.prose", props: { variant: "list", items } }],
  };
}

function render(document: UnoPageDocument): string {
  return renderToStaticMarkup(createElement(UnoPageSections, { document }));
}

function accepted(source: unknown): UnoPageDocument {
  const outcome = readUnoPageDocument(source);
  if (!outcome.accepted) throw new Error(`expected acceptance, received ${outcome.reason}`);
  return outcome.document;
}

function refusal(source: unknown): string {
  const outcome = readUnoPageDocument(source);
  return outcome.accepted ? "accepted" : outcome.reason;
}

describe("UNO-WO-103 / R01 — document-local application links and list destinations", () => {
  it("accepts one declared application link, keeps its opaque key out of the section data and renders it inert", () => {
    const document = accepted(
      listDocument([{ label: "Contact", linkId: "contact" }], {
        contact: { reference: "applicationLink", key: "public-contact-email" },
      }),
    );
    expect(document.links).toEqual({ contact: { reference: "applicationLink", key: "public-contact-email" } });
    const sections = JSON.stringify(document.sections);
    expect(sections).toContain('"linkId":"contact"');
    expect(sections).not.toContain("public-contact-email");
    const html = render(document);
    expect(html).toContain("Contact");
    expect(html).toContain("uno-json-list-application-label");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("public-contact-email");
    expect(html).not.toContain("href");
    expect(Object.isFrozen(document.links)).toBe(true);
  });

  it("accepts a classified href as one ordinary anchor and keeps the authored string literal", () => {
    const document = accepted(
      listDocument([
        { label: "Notice", href: "https://example.org/notice" },
        { label: "Write", href: "mailto:contact@example.invalid" },
        { label: "Root", href: "/notice" },
      ]),
    );
    const section = document.sections[0];
    expect(JSON.stringify(section?.module === "content.prose" ? section.props : null)).toBe(
      '{"variant":"list","items":[{"label":"Notice","href":"https://example.org/notice"},' +
        '{"label":"Write","href":"mailto:contact@example.invalid"},{"label":"Root","href":"/notice"}]}',
    );
    const html = render(document);
    expect(html).toContain('<a class="uno-json-list-link" href="https://example.org/notice" rel="noreferrer noopener">');
    expect(html).toContain(
      '<a class="uno-json-list-link" href="mailto:contact@example.invalid" rel="noreferrer noopener">',
    );
    expect(html).toContain('<a class="uno-json-list-link" href="/notice" rel="noreferrer noopener">');
  });

  it("refuses the reserved marker namespace however it is obfuscated, and every unsafe scheme", () => {
    for (const href of [
      "#link:contact",
      "#LINK:contact",
      "%23link:contact",
      "&#35;link:contact",
      "&#x23;link:contact",
      "javascript:alert(1)",
      "data:text/html,<b>x</b>",
      "vbscript:msgbox(1)",
      "",
      "https://example.org/a b",
    ]) {
      expect(refusal(listDocument([{ label: "A", href }]))).toBe("document:unsafe-link");
    }
  });

  it("refuses a crossed, undeclared, malformed or oversized declaration set", () => {
    expect(refusal(listDocument([{ label: "A", href: "/x", linkId: "contact" }]))).toBe("document:invalid-props");
    expect(refusal(listDocument([{ label: "A", linkId: "contact" }]))).toBe("document:unresolved-target");
    expect(
      refusal(listDocument([{ label: "A", linkId: "Contact" }], { Contact: { reference: "applicationLink", key: "k" } })),
    ).toBe("document:invalid-props");
    expect(
      refusal(listDocument([{ label: "A", linkId: "contact" }], { contact: { reference: "webhook", key: "k" } })),
    ).toBe("document:invalid-props");
    expect(
      refusal(listDocument([{ label: "A", linkId: "contact" }], { contact: { reference: "applicationLink", key: "PUBLIC" } })),
    ).toBe("document:invalid-props");
    expect(
      refusal(
        listDocument(
          [{ label: "A", linkId: "contact" }],
          { contact: { reference: "applicationLink", key: "k", href: "https://example.org" } },
        ),
      ),
    ).toBe("document:invalid-props");
    expect(refusal(listDocument([{ label: "A", linkId: "a".repeat(65) }]))).toBe("document:invalid-props");
    expect(refusal(listDocument([{ label: "A" }], "contact"))).toBe("document:invalid-props");
    const many: Record<string, unknown> = {};
    for (let index = 0; index < 33; index += 1) many[`link-${index}`] = { reference: "applicationLink", key: "k" };
    expect(refusal(listDocument([{ label: "A" }], many))).toBe("document:invalid-props");
    // A duplicate JSON member is refused by the strict reader before any object is built.
    const duplicated = JSON.stringify(listDocument([{ label: "A", linkId: "contact" }])).replace(
      '"sections"',
      '"links":{"contact":{"reference":"applicationLink","key":"k"}},' +
        '"links":{"contact":{"reference":"applicationLink","key":"k"}},"sections"',
    );
    expect(refusal(duplicated)).toBe("document:json-duplicate-key");
  });

  it("keeps the exact legacy JSON bytes and markup when no new field is authored", () => {
    const document = accepted(listDocument([{ label: "Only", detail: "Plain" }]));
    expect(JSON.stringify(document)).toBe(
      '{"version":1,"title":"Synthetic A2 destination specimen","visibility":"public","sections":' +
        '[{"id":"links","module":"content.prose","props":{"variant":"list","items":[{"label":"Only","detail":"Plain"}]}}]}',
    );
    expect(render(document)).toBe(
      '<div class="uno-json" data-uno-document-version="1">' +
        '<ul class="uno-json-list" id="links"><li><span>Only</span><p>Plain</p></li></ul></div>',
    );
  });
});
