import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readUnoPageDocument, type UnoPageDocument } from "../../src/core/page-document";
import { UnoPageSections } from "../../src/components/uno-page-sections";

/** Render one document exactly as the page component would (no JSX in a `.ts` test file). */
function render(document: UnoPageDocument): string {
  return renderToStaticMarkup(createElement(UnoPageSections, { document }));
}

/** Build one accepted document from plain data, failing loudly if the fixture itself is invalid. */
function accept(document: Record<string, unknown>): UnoPageDocument {
  const result = readUnoPageDocument(document);
  if (!result.accepted) throw new Error(`fixture refused: ${result.reason}`);
  return result.document;
}

/** The two-card article grid this slice is proved on. */
function twoCardDocument(): UnoPageDocument {
  return accept({
    version: 1,
    title: "Listing fixture",
    description: "Two synthetic cards.",
    sections: [
      {
        id: "listing",
        module: "layout.grid",
        props: { columns: 2, itemSemantics: "article" },
        children: [
          {
            id: "card-one",
            module: "layout.stack",
            props: { gap: "tight" },
            children: [
              { id: "card-one-title", module: "content.heading", props: { text: "Card one", level: 2 } },
              { id: "card-one-body", module: "content.prose", props: { text: "Tom & Jerry's \"first\" card." } },
            ],
          },
          {
            id: "card-two",
            module: "layout.stack",
            props: { gap: "tight" },
            children: [
              { id: "card-two-title", module: "content.heading", props: { text: "Card two", level: 2 } },
              { id: "card-two-body", module: "content.prose", props: { text: "Second card body & notes." } },
            ],
          },
        ],
      },
      {
        id: "listing-actions",
        module: "content.actions",
        props: { items: [{ label: "Jump to card one", targetId: "card-one" }] },
      },
    ],
  });
}

describe("UnoPageSections — static server markup", () => {
  it("renders the card grid as two semantic articles with unique headings and bodies", () => {
    const markup = render(twoCardDocument());
    expect(markup.match(/<article /gu)?.length).toBe(2);
    expect(markup).toContain('data-uno-card-id="card-one"');
    expect(markup).toContain('data-uno-card-id="card-two"');
    expect(markup).toContain('data-uno-columns="2"');
    expect(markup).toContain('data-uno-item-semantics="article"');
    expect(markup).toContain("<h2");
    expect(markup).toContain(">Card one</h2>");
    expect(markup).toContain(">Card two</h2>");
    expect(markup).toContain("Second card body &amp; notes.");
  });

  it("renders a real focusable same-page anchor and escapes authored text", () => {
    const markup = render(twoCardDocument());
    expect(markup).toContain('<a class="uno-json-action" href="#card-one">');
    expect(markup).toContain("Jump to card one");
    // React text escaping, not authored HTML: the ampersand and the quotes are encoded.
    expect(markup).toContain("Tom &amp; Jerry&#x27;s &quot;first&quot; card.");
    expect(markup).not.toContain("<script");
  });

  it("never emits a second h1, a main landmark, or any client marker", () => {
    const markup = render(twoCardDocument());
    expect(markup).not.toContain("<h1");
    expect(markup).not.toContain("<main");
    expect(markup).not.toContain("dangerouslySetInnerHTML");
    const source = readFileSync(
      fileURLToPath(new URL("../../src/components/uno-page-sections.tsx", import.meta.url)),
      "utf8",
    );
    // Block comments are documentation, not code: strip them so the guard tests what actually executes.
    const code = source.replace(/\/\*[\s\S]*?\*\//gu, "");
    expect(code).not.toContain('"use client"');
    expect(code).not.toContain("dangerouslySetInnerHTML");
    expect(code).not.toContain("uno-interactions-client");
  });

  it("renders plain grid cells without article semantics when asked", () => {
    const document = accept({
      version: 1,
      title: "Plain grid",
      sections: [
        {
          id: "cells",
          module: "layout.grid",
          props: { columns: 3 },
          children: [{ id: "cell-body", module: "content.prose", props: { text: "Cell body." } }],
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('data-uno-columns="3"');
    expect(markup).toContain('data-uno-item-semantics="plain"');
    expect(markup).toContain('class="uno-json-cell"');
    expect(markup).not.toContain("<article");
  });

  it("renders the stack gap variant and nested headings", () => {
    const document = accept({
      version: 1,
      title: "Stack",
      sections: [
        {
          id: "stack",
          module: "layout.stack",
          props: { gap: "wide" },
          children: [
            { id: "stack-heading", module: "content.heading", props: { text: "Section", level: 2 } },
            { id: "stack-sub", module: "content.heading", props: { text: "Subsection", level: 3 } },
          ],
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('data-uno-gap="wide"');
    expect(markup).toContain("<h3");
    expect(markup).toContain(">Subsection</h3>");
  });

  it("renders nothing at all for a document that no longer validates", () => {
    const invalid = {
      version: 2,
      title: "Unsupported",
      sections: [{ id: "intro", module: "content.prose", props: { text: "Body." } }],
    } as unknown as UnoPageDocument;
    expect(render(invalid)).toBe("");
  });
});

/**
 * The three modules added by `UNO-WO-037 / R01`. Every assertion here is made on the real server markup string, so
 * the semantics are proved on what a reader actually receives — not on a source-code convention.
 */
describe("UnoPageSections — hero, statistics and testimonials", () => {
  it("renders a semantic hero with an inert eyebrow, lede, support and a same-page action", () => {
    const document = accept({
      version: 1,
      title: "Hero fixture",
      sections: [
        {
          id: "opening",
          module: "content.hero",
          props: {
            eyebrow: "Overview",
            lede: "A lede with & and \"quotes\" and an apostrophe's mark.",
            support: "A support line.",
            align: "center",
            surface: "bordered",
            actions: [{ label: "Jump to the figures", targetId: "figures" }],
          },
        },
        {
          id: "figures",
          module: "content.stats",
          props: { items: [{ value: "8", label: "Renderable IDs" }] },
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('<section class="uno-json-hero"');
    expect(markup).toContain('data-uno-align="center"');
    expect(markup).toContain('data-uno-surface="bordered"');
    expect(markup).toContain('<p class="uno-json-eyebrow">Overview</p>');
    expect(markup).toContain("A lede with &amp; and &quot;quotes&quot; and an apostrophe&#x27;s mark.");
    expect(markup).toContain('<p class="uno-json-hero-support">A support line.</p>');
    expect(markup).toContain('<a class="uno-json-action" href="#figures">');
    expect(markup).not.toContain("<h1");
    expect(markup).not.toContain("<main");
    expect(markup).not.toContain("<script");
  });

  it("renders a hero without optional parts, using the default alignment and surface", () => {
    const document = accept({
      version: 1,
      title: "Hero defaults",
      sections: [{ id: "opening", module: "content.hero", props: { lede: "Body only." } }],
    });
    const markup = render(document);
    expect(markup).toContain('data-uno-align="start"');
    expect(markup).toContain('data-uno-surface="plain"');
    expect(markup).toContain('<p class="uno-json-hero-lede">Body only.</p>');
    expect(markup).not.toContain("uno-json-eyebrow");
    expect(markup).not.toContain("uno-json-actions");
    expect((markup.match(/<section /gu) ?? []).length).toBe(1);
  });

  it("renders statistics as a real description list linked to its heading", () => {
    const document = accept({
      version: 1,
      title: "Stats fixture",
      sections: [
        {
          id: "figures",
          module: "content.stats",
          props: {
            heading: "Programme figures",
            level: 2,
            surface: "muted",
            items: [
              { value: "3", label: "New modules", detail: "Hero, stats, testimonials." },
              { value: "8", label: "Renderable IDs" },
            ],
          },
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('<section class="uno-json-stats"');
    expect(markup).toContain('data-uno-surface="muted"');
    expect(markup).toContain('aria-labelledby="figures-title"');
    expect(markup).toContain('<h2 class="uno-json-stats-heading" id="figures-title">Programme figures</h2>');
    expect(markup).toContain('<dl class="uno-json-stats-list">');
    expect(markup).toContain('<dt class="uno-json-stat-label">New modules</dt>');
    expect(markup).toContain('<dd class="uno-json-stat-value">3');
    expect(markup).toContain('<span class="uno-json-stat-detail">Hero, stats, testimonials.</span>');
    expect((markup.match(/<dt /gu) ?? []).length).toBe(2);
    expect((markup.match(/<dd /gu) ?? []).length).toBe(2);
    expect(markup).not.toContain("uno-json-heading");
  });

  it("renders statistics without a heading and without a dangling label reference", () => {
    const document = accept({
      version: 1,
      title: "Stats defaults",
      sections: [{ id: "figures", module: "content.stats", props: { items: [{ value: "1", label: "One" }] } }],
    });
    const markup = render(document);
    expect(markup).toContain('data-uno-surface="plain"');
    expect(markup).not.toContain("aria-labelledby");
    expect(markup).not.toContain("uno-json-stats-heading");
  });

  it("renders quotations as figure, blockquote and an optional caption", () => {
    const document = accept({
      version: 1,
      title: "Quote fixture",
      sections: [
        {
          id: "voices",
          module: "content.testimonials",
          props: {
            align: "center",
            items: [
              { quote: "A quoted & escaped line.", attribution: "Contributor A", role: "Reviewer" },
              { quote: "An unattributed line." },
              { quote: "A role only line.", role: "Editor" },
            ],
          },
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('<section class="uno-json-testimonials"');
    expect(markup).toContain('data-uno-align="center"');
    expect((markup.match(/<figure class="uno-json-testimonial">/gu) ?? []).length).toBe(3);
    expect((markup.match(/<blockquote class="uno-json-testimonial-quote">/gu) ?? []).length).toBe(3);
    expect(markup).toContain("A quoted &amp; escaped line.");
    expect(markup).toContain('<span class="uno-json-testimonial-attribution">Contributor A</span>');
    expect(markup).toContain('<span class="uno-json-testimonial-role">Reviewer</span>');
    expect(markup).toContain('<span class="uno-json-testimonial-role">Editor</span>');
    // Two of the three items carry a caption; the unattributed one must not invent a person.
    expect((markup.match(/<figcaption /gu) ?? []).length).toBe(2);
    expect(markup).not.toContain("cite");
  });
});
