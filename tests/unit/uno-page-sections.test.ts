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
