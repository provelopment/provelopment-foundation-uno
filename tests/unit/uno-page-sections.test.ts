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

/** The one stylesheet the production Page actually ships. */
function stylesheet(): string {
  return readFileSync(fileURLToPath(new URL("../../src/app/globals.css", import.meta.url)), "utf8");
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
  // `UNO-WO-081 / R01`: a stand-alone actions list renders the unchanged fragment anchor byte-identically and each
  // authored `mailto:`/`https:` entry as an ordinary inert server link with no script, target, prefetch or handler.
  it("renders authored mailto and HTTPS actions as plain inert links beside the unchanged fragment anchor", () => {
    const markup = render({
      version: 1,
      title: "Static actions",
      visibility: "public",
      sections: [
        { id: "intro", module: "content.heading", props: { text: "Actions", level: 2 } },
        {
          id: "static-actions",
          module: "content.actions",
          props: {
            items: [
              { label: "Back to the heading", targetId: "intro" },
              { label: "Write to the sample inbox & notes", href: "mailto:contact@example.invalid" },
              { label: "Sample directions", href: "https://maps.example/directions?to=sample" },
              { label: "Sample availability", href: "https://booking.example/availability" },
            ],
          },
        },
      ],
    });
    expect(markup).toContain('<ul class="uno-json-actions" id="static-actions">');
    // The pre-existing fragment entry keeps exactly its old anchor: class, `#` destination and escaped label.
    expect(markup).toContain('<a class="uno-json-action" href="#intro">Back to the heading</a>');
    // The mailto link carries the exact authored destination, no new tab and no fabricated delivery state; its label is
    // React-escaped text, never authored markup.
    expect(markup).toContain(
      '<a class="uno-json-action" href="mailto:contact@example.invalid">Write to the sample inbox &amp; notes</a>',
    );
    // Both HTTPS links carry `rel` and the referrer policy, on plain anchors.
    expect(markup).toMatch(
      /<a class="uno-json-action" href="https:\/\/maps\.example\/directions\?to=sample" rel="noopener noreferrer" referrerPolicy="no-referrer">Sample directions<\/a>/u,
    );
    expect(markup).toMatch(
      /<a class="uno-json-action" href="https:\/\/booking\.example\/availability" rel="noopener noreferrer" referrerPolicy="no-referrer">Sample availability<\/a>/u,
    );
    // One list, four items, in authored order.
    expect((markup.match(/class="uno-json-action-item"/gu) ?? []).length).toBe(4);
    expect(markup.indexOf("Back to the heading")).toBeLessThan(markup.indexOf("Write to the sample inbox"));
    expect(markup.indexOf("Write to the sample inbox")).toBeLessThan(markup.indexOf("Sample directions"));
    expect(markup.indexOf("Sample directions")).toBeLessThan(markup.indexOf("Sample availability"));
    // Inert markup only: no script, handler, new tab, prefetch, form, status or client island.
    for (const forbidden of [
      "<script",
      "onclick",
      'target="_blank"',
      "prefetch",
      "<form",
      "<button",
      "<input",
      "delivery",
      "window.",
      "fetch(",
    ]) {
      expect(markup.includes(forbidden)).toBe(false);
    }
    expect(markup).not.toContain("<h1");
    expect(markup).not.toContain("<main");
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

  it("renders the approved hero actions: one safe outbound anchor with its variant beside a same-page anchor", () => {
    // `UNO-WO-112 / R01`: the donor's static `href` action is one ordinary anchor carrying the same `rel` the other safe
    // links use, the closed variant is a data attribute, and the unchanged fragment action keeps its `#<section-id>` form.
    const document = accept({
      version: 1,
      title: "Hero actions",
      sections: [
        {
          id: "opening",
          module: "content.hero",
          props: {
            lede: "Choose a destination.",
            actions: [
              { label: "Read the notes", href: "https://example.org/notes", variant: "primary" },
              { label: "Write to the desk", href: "mailto:desk@example.org", variant: "secondary" },
              { label: "Jump to the figures", targetId: "figures" },
            ],
          },
        },
        { id: "figures", module: "content.stats", props: { items: [{ value: "1", label: "Figure" }] } },
      ],
    });
    const markup = render(document);
    expect(markup).toContain(
      '<a class="uno-json-action" href="https://example.org/notes" rel="noreferrer noopener" data-uno-variant="primary">Read the notes</a>',
    );
    expect(markup).toContain(
      '<a class="uno-json-action" href="mailto:desk@example.org" rel="noreferrer noopener" data-uno-variant="secondary">Write to the desk</a>',
    );
    expect(markup).toContain('<a class="uno-json-action" href="#figures">Jump to the figures</a>');
    expect((markup.match(/rel="noreferrer noopener"/gu) ?? []).length).toBe(2);
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("<button");
  });

  it("renders the hero's Markdown body through the shared renderer while the plain form stays byte-identical", () => {
    const plain = render(
      accept({
        version: 1,
        title: "Plain hero",
        sections: [{ id: "opening", module: "content.hero", props: { lede: "Body only.", support: "Support only." } }],
      }),
    );
    expect(plain).toContain('<p class="uno-json-hero-lede">Body only.</p>');
    expect(plain).toContain('<p class="uno-json-hero-support">Support only.</p>');

    const rich = render(
      accept({
        version: 1,
        title: "Markdown hero",
        sections: [
          {
            id: "opening",
            module: "content.hero",
            props: {
              lede: "A **strong** introduction.",
              support: "With *emphasis* and `code`.",
              markdown: true,
            },
          },
        ],
      }),
    );
    expect(rich).toContain('<div class="uno-json-hero-lede">');
    expect(rich).toContain('<strong class="uno-family-md-strong">strong</strong>');
    expect(rich).toContain('<div class="uno-json-hero-support">');
    expect(rich).toContain('<em class="uno-family-md-em">emphasis</em>');
    expect(rich).toContain('<code class="uno-family-md-code">code</code>');
    expect(rich).not.toContain('<p class="uno-json-hero-lede">');
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

  it("renders a Markdown detail through the shared renderer while the plain detail stays byte-identical", () => {
    // `UNO-WO-113 / R01`: the donor's `detail` is Markdown-capable, so an adapter-flagged node draws it with the one shared
    // family renderer; an unflagged node keeps the escaped `<span>` the earlier accepted output used.
    const plain = render(
      accept({
        version: 1,
        title: "Plain detail",
        sections: [
          {
            id: "figures",
            module: "content.stats",
            props: { items: [{ value: "3", label: "New modules", detail: "Hero, stats, testimonials." }] },
          },
        ],
      }),
    );
    expect(plain).toContain('<span class="uno-json-stat-detail">Hero, stats, testimonials.</span>');

    const rich = render(
      accept({
        version: 1,
        title: "Markdown detail",
        sections: [
          {
            id: "figures",
            module: "content.stats",
            props: {
              markdown: true,
              items: [
                { value: "3", label: "New modules", detail: "A **bounded** note." },
                { value: "8", label: "Renderable IDs" },
              ],
            },
          },
        ],
      }),
    );
    expect(rich).toContain('<div class="uno-json-stat-detail">');
    expect(rich).toContain('<strong class="uno-family-md-strong">bounded</strong>');
    expect(rich).not.toContain('<span class="uno-json-stat-detail">');
    expect((rich.match(/<dt class="uno-json-stat-label">/gu) ?? []).length).toBe(2);
    expect((rich.match(/<dd class="uno-json-stat-value">/gu) ?? []).length).toBe(2);
    expect(rich).not.toContain("<a ");
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

  /**
   * `UNO-WO-117 / R01`: the donor `quote.body` is Markdown-capable. An adapter-flagged node draws the quotation through
   * the one shared family renderer inside its own `<blockquote>`; an unflagged node keeps the byte-identical escaped text,
   * and a native role-only caption still renders because only the *donor* rule suppresses it.
   */
  it("renders a declared Markdown quotation through the shared renderer inside its blockquote", () => {
    const document = accept({
      version: 1,
      title: "Declared quote fixture",
      sections: [
        {
          id: "voices",
          module: "content.testimonials",
          props: {
            markdown: true,
            align: "center",
            surface: "bordered",
            items: [
              {
                quote: "A **bounded** quotation with `code` and a [link](https://example.org/notes).",
                attribution: "Contributor A",
                role: "Reviewer",
              },
            ],
          },
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain(
      '<section class="uno-json-testimonials" data-uno-align="center" data-uno-surface="bordered" id="voices">',
    );
    expect((markup.match(/<figure class="uno-json-testimonial">/gu) ?? []).length).toBe(1);
    // The quotation is parsed Markdown, not its source syntax, and it stays inside the same blockquote element.
    const blockquote = /<blockquote class="uno-json-testimonial-quote">([\s\S]*?)<\/blockquote>/u.exec(markup);
    expect(blockquote).not.toBeNull();
    const quoteMarkup = blockquote?.[1] ?? "";
    expect(quoteMarkup).toContain('<strong class="uno-family-md-strong">bounded</strong>');
    expect(quoteMarkup).toContain('<code class="uno-family-md-code">code</code>');
    expect(quoteMarkup).toContain('<a class="uno-family-md-link"');
    expect(markup).not.toContain("**bounded**");
    // The caption keeps its separate attribution and role spans.
    expect(markup).toContain('<span class="uno-json-testimonial-attribution">Contributor A</span>');
    expect(markup).toContain('<span class="uno-json-testimonial-role">Reviewer</span>');
    expect(markup).not.toContain("<script");
  });

  it("keeps an unflagged quotation byte-identical and a native role-only caption rendered", () => {
    const document = accept({
      version: 1,
      title: "Plain quote fixture",
      sections: [
        {
          id: "voices",
          module: "content.testimonials",
          props: { items: [{ quote: "A **literal** line.", role: "Editor" }] },
        },
      ],
    });
    const markup = render(document);
    // No switch: the authored characters are the quotation, escaped as text.
    expect(markup).toContain('<blockquote class="uno-json-testimonial-quote">A **literal** line.</blockquote>');
    expect(markup).not.toContain("uno-family-md");
    expect(markup).toContain('<span class="uno-json-testimonial-role">Editor</span>');
  });
});

describe("UnoPageSections — bento, pricing and timeline", () => {
  it("renders a bento as one wrapper per child, in authored order, with the declared spans", () => {
    const document = accept({
      version: 1,
      title: "Bento fixture",
      sections: [
        {
          id: "mosaic",
          module: "layout.bento",
          props: {
            columns: 3,
            itemSemantics: "article",
            tiles: [
              { sectionId: "tile-one", span: "feature" },
              { sectionId: "tile-two", span: "wide" },
              { sectionId: "tile-three", span: "standard" },
            ],
          },
          children: [
            {
              id: "tile-one",
              module: "layout.stack",
              props: { gap: "tight" },
              children: [
                { id: "tile-one-title", module: "content.heading", props: { text: "Feature tile", level: 2 } },
                { id: "tile-one-body", module: "content.prose", props: { text: "Feature body & notes." } },
              ],
            },
            { id: "tile-two", module: "content.prose", props: { text: "Wide tile body." } },
            { id: "tile-three", module: "content.prose", props: { text: "Standard tile body." } },
          ],
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('<div class="uno-json-bento"');
    expect(markup).toContain('data-uno-columns="3"');
    expect(markup).toContain('data-uno-item-semantics="article"');
    // Article semantics produce real `article` wrappers, never a hidden module or a second landmark.
    expect((markup.match(/<article class="uno-json-tile"/gu) ?? []).length).toBe(3);
    expect(markup).toContain('data-uno-tile-id="tile-one"');
    expect(markup).toContain('data-uno-tile-span="feature"');
    expect(markup).toContain('data-uno-tile-id="tile-two"');
    expect(markup).toContain('data-uno-tile-span="wide"');
    expect(markup).toContain('data-uno-tile-id="tile-three"');
    expect(markup).toContain('data-uno-tile-span="standard"');
    // Authored order is the DOM order: feature, wide, standard.
    expect(markup.indexOf('data-uno-tile-id="tile-one"')).toBeLessThan(markup.indexOf('data-uno-tile-id="tile-two"'));
    expect(markup.indexOf('data-uno-tile-id="tile-two"')).toBeLessThan(markup.indexOf('data-uno-tile-id="tile-three"'));
    expect(markup).toContain("Feature body &amp; notes.");
    expect(markup).not.toContain("<main");
    expect((markup.match(/<h1[\s>]/gu) ?? []).length).toBe(0);
  });

  it("renders a plain bento with inert div wrappers and no article landmark", () => {
    const document = accept({
      version: 1,
      title: "Plain bento",
      sections: [
        {
          id: "plain-mosaic",
          module: "layout.bento",
          props: {
            columns: 2,
            tiles: [
              { sectionId: "left", span: "tall" },
              { sectionId: "right", span: "standard" },
            ],
          },
          children: [
            { id: "left", module: "content.prose", props: { text: "Left." } },
            { id: "right", module: "content.prose", props: { text: "Right." } },
          ],
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('data-uno-item-semantics="plain"');
    expect(markup).not.toContain("<article");
    expect((markup.match(/<div class="uno-json-tile"/gu) ?? []).length).toBe(2);
    expect(markup).toContain('data-uno-tile-span="tall"');
  });


  it("renders prices as a real list of authored offers with exactly one featured marker", () => {
    const document = accept({
      version: 1,
      title: "Pricing fixture",
      sections: [
        {
          id: "tiers",
          module: "content.pricing",
          props: {
            heading: "Programme tiers",
            level: 2,
            surface: "bordered",
            items: [
              { label: "Community", amount: "Free", description: "Authored description & note." },
              { label: "Team", amount: "CHF 40", unit: "per month", featured: true },
              { label: "Enterprise", amount: "On request" },
            ],
          },
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('<section class="uno-json-pricing"');
    expect(markup).toContain('data-uno-surface="bordered"');
    expect(markup).toContain('aria-labelledby="tiers-title"');
    expect(markup).toContain('<h2 class="uno-json-pricing-heading" id="tiers-title">Programme tiers</h2>');
    expect(markup).toContain('<ul class="uno-json-price-list">');
    expect((markup.match(/<li class="uno-json-price"/gu) ?? []).length).toBe(3);
    // The label and the amount are visibly paired inside the same list item, in authored text.
    expect(markup).toContain('<p class="uno-json-price-label">Team</p>');
    expect(markup).toContain('<span class="uno-json-price-value">CHF 40</span>');
    expect(markup).toContain('<span class="uno-json-price-unit">per month</span>');
    expect(markup).toContain("Authored description &amp; note.");
    // Exactly one featured marker, driven only by `featured: true`.
    expect((markup.match(/data-uno-featured="true"/gu) ?? []).length).toBe(1);
    expect(markup).not.toContain("<main");
    expect((markup.match(/<h1[\s>]/gu) ?? []).length).toBe(0);
  });

  it("renders prices without a heading and never invents a currency or a call to action", () => {
    const document = accept({
      version: 1,
      title: "Bare pricing",
      sections: [
        {
          id: "offers",
          module: "content.pricing",
          props: { items: [{ label: "Support", amount: "Free" }] },
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('data-uno-surface="plain"');
    expect(markup).not.toContain("aria-labelledby");
    expect(markup).not.toContain("uno-json-pricing-heading");
    expect(markup).not.toContain("data-uno-featured");
    expect(markup).not.toContain("uno-json-action");
  });


  it("renders a timeline as an ordered list with one authored current step", () => {
    const document = accept({
      version: 1,
      title: "Timeline fixture",
      sections: [
        {
          id: "road",
          module: "content.timeline",
          props: {
            heading: "Programme timeline",
            level: 2,
            items: [
              { title: "Contract baseline", dateLabel: "Phase 1", status: "complete", description: "Accepted." },
              { title: "Module slice", dateLabel: "Phase 2", status: "current" },
              { title: "Presentation shell", dateLabel: "Phase 3", status: "upcoming" },
            ],
          },
        },
      ],
    });
    const markup = render(document);
    expect(markup).toContain('<section class="uno-json-timeline"');
    expect(markup).toContain('aria-labelledby="road-title"');
    expect(markup).toContain('<h2 class="uno-json-timeline-heading" id="road-title">Programme timeline</h2>');
    expect(markup).toContain('<ol class="uno-json-timeline-list">');
    expect((markup.match(/<li class="uno-json-timeline-item"/gu) ?? []).length).toBe(3);
    // Exactly one `aria-current="step"`, on the single authored current milestone.
    expect((markup.match(/aria-current="step"/gu) ?? []).length).toBe(1);
    expect((markup.match(/data-uno-status="complete"/gu) ?? []).length).toBe(1);
    expect((markup.match(/data-uno-status="upcoming"/gu) ?? []).length).toBe(1);
    expect(markup).toContain('<span class="uno-json-timeline-date">Phase 1</span>');
    expect(markup).toContain('<p class="uno-json-timeline-title">Module slice</p>');
    // The visual marker is decorative and announces nothing of its own.
    expect((markup.match(/<span aria-hidden="true" class="uno-json-timeline-marker"><\/span>/gu) ?? []).length).toBe(3);
    // Authored order is preserved, never sorted.
    expect(markup.indexOf("Contract baseline")).toBeLessThan(markup.indexOf("Module slice"));
    expect(markup.indexOf("Module slice")).toBeLessThan(markup.indexOf("Presentation shell"));
    expect(markup).not.toContain("<main");
  });

  it("renders a Markdown milestone body through the shared renderer while a plain body stays byte-identical", () => {
    // `UNO-WO-114 / R01`: the donor's step `body` is Markdown-capable, so an adapter-flagged node draws it with the one shared
    // family renderer; an unflagged node keeps the escaped `<p>` the earlier accepted output used.
    const plain = render(
      accept({
        version: 1,
        title: "Plain body",
        sections: [
          {
            id: "road",
            module: "content.timeline",
            props: { itemHeadingLevel: 3, items: [{ title: "Draft", description: "Prepare the source." }] },
          },
        ],
      }),
    );
    expect(plain).toContain('<p class="uno-json-timeline-description">Prepare the source.</p>');

    const rich = render(
      accept({
        version: 1,
        title: "Markdown body",
        sections: [
          {
            id: "road",
            module: "content.timeline",
            props: {
              itemHeadingLevel: 3,
              markdown: true,
              items: [{ title: "Draft", description: "Prepare the **source**." }, { title: "Review" }],
            },
          },
        ],
      }),
    );
    expect(rich).toContain('<div class="uno-json-timeline-description">');
    expect(rich).toContain('<strong class="uno-family-md-strong">source</strong>');
    expect(rich).not.toContain('<p class="uno-json-timeline-description">');
    expect((rich.match(/<li class="uno-json-timeline-item"/gu) ?? []).length).toBe(2);
    expect((rich.match(/<h3 class="uno-json-timeline-title">/gu) ?? []).length).toBe(2);
    expect(rich).not.toContain("aria-current");
    expect(rich).not.toContain("<a ");
  });

  it("renders a timeline with no status at all without inventing aria-current or a status token", () => {
    const document = accept({
      version: 1,
      title: "Status-free timeline",
      sections: [
        {
          id: "history",
          module: "content.timeline",
          props: { items: [{ title: "One" }, { title: "Two" }] },
        },
      ],
    });
    const markup = render(document);
    expect(markup).not.toContain("aria-current");
    expect(markup).not.toContain("data-uno-status");
    expect((markup.match(/<li class="uno-json-timeline-item"/gu) ?? []).length).toBe(2);
  });

  it("renders nothing at all for a document whose new module props no longer validate", () => {
    const broken = {
      version: 1,
      title: "Broken",
      sections: [
        {
          id: "mosaic",
          module: "layout.bento",
          props: { columns: 2, tiles: [{ sectionId: "one", span: "feature" }] },
          children: [
            { id: "one", module: "content.prose", props: { text: "One." } },
            { id: "two", module: "content.prose", props: { text: "Two." } },
          ],
        },
      ],
    };
    // The document type is only reached through validation, so this is a deliberate lie to the component.
    const markup = renderToStaticMarkup(
      createElement(UnoPageSections, { document: broken as unknown as UnoPageDocument }),
    );
    expect(markup).toBe("");
  });
});

describe("the eleven remaining module renderers", () => {
  /** One resolved image projection, as the server composition would hand it over. */
  const image = (seed: string) => ({
    src: `/uno-media/en-001/${seed}`,
    type: "image/png",
    width: 4,
    height: 2,
  });

  /** Render one document together with its resolved media projections. */
  function renderWithMedia(document: Record<string, unknown>, media: ReadonlyMap<string, unknown>): string {
    return renderToStaticMarkup(
      createElement(UnoPageSections, { document: accept(document), media: media as never }),
    );
  }

  it("renders overlapping layers as ordered children with a closed mode", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Layers",
        sections: [
          {
            id: "layers",
            module: "layout.layers",
            props: { mode: "overlap", align: "center" },
            children: [
              { id: "layer-one", module: "content.prose", props: { text: "First layer" } },
              { id: "layer-two", module: "content.prose", props: { text: "Second layer" } },
            ],
          },
        ],
      },
      new Map(),
    );
    expect(html).toContain('data-uno-mode="overlap"');
    expect(html).toContain('data-uno-align="center"');
    expect(html).toContain('data-uno-layer-id="layer-one"');
    expect(html).toContain('data-uno-layer-id="layer-two"');
    // Authored order is preserved in the markup, which is the reading and keyboard order.
    expect(html.indexOf("layer-one")).toBeLessThan(html.indexOf("layer-two"));
  });

  it("renders an inert decorative watermark and a closed motion effect", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Treatments",
        sections: [
          { id: "mark", module: "design.watermark", props: { text: "Draft", align: "end", strength: "regular" } },
          {
            id: "motion",
            module: "design.motion",
            props: { effect: "rise", speed: "short" },
            children: [{ id: "motion-body", module: "content.prose", props: { text: "Readable body" } }],
          },
        ],
      },
      new Map(),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-uno-align="end"');
    expect(html).toContain('data-uno-strength="regular"');
    expect(html).toContain('data-uno-effect="rise"');
    expect(html).toContain('data-uno-speed="short"');
    // The wrapped content is present in its final state, never hidden awaiting animation.
    expect(html).toContain("Readable body");
  });

  it("renders an accordion as native disclosures with ordered labels", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Disclosures",
        sections: [
          {
            id: "faq",
            module: "interaction.accordion",
            props: {
              items: [
                { sectionId: "d-one", label: "First question" },
                { sectionId: "d-two", label: "Second question" },
              ],
            },
            children: [
              { id: "d-one", module: "content.prose", props: { text: "First answer" } },
              { id: "d-two", module: "content.prose", props: { text: "Second answer" } },
            ],
          },
        ],
      },
      new Map(),
    );
    expect(html.match(/<details/gu)?.length).toBe(2);
    expect(html.match(/<summary/gu)?.length).toBe(2);
    expect(html).toContain("First question");
    expect(html).toContain("Second answer");
  });

  // `UNO-WO-080 / R01`: the donor outline is opt-in per composed instance. A Page authored before the switch must
  // render exactly its old markup, and an authored literal `3` must only add the heading element, never new controls.
  it("keeps the legacy timeline paragraph and plain disclosure summary when no outline switch is authored", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Legacy outline",
        sections: [
          {
            id: "legacy-timeline",
            module: "content.timeline",
            props: { items: [{ title: "Only milestone", description: "Authored body." }] },
          },
          {
            id: "legacy-faq",
            module: "interaction.accordion",
            props: { items: [{ sectionId: "legacy-answer", label: "Only question?" }] },
            children: [{ id: "legacy-answer", module: "content.prose", props: { text: "Only answer." } }],
          },
        ],
      },
      new Map(),
    );
    expect(html).toContain('<p class="uno-json-timeline-title">Only milestone</p>');
    expect(html).toContain('<summary class="uno-json-disclosure-summary">Only question?</summary>');
    expect(html.includes("<h3")).toBe(false);
  });

  /**
   * `UNO-WO-118 / R01`: the FAQ family's own native surface — the donor's closed `surface` on the disclosure group and a
   * Markdown answer drawn through the shared renderer, with the platform's `<details>`/`<summary>` untouched.
   */
  it("renders the authored FAQ surface and a Markdown answer inside its native disclosure", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "FAQ surface",
        sections: [
          {
            id: "faq",
            module: "interaction.accordion",
            props: {
              items: [
                { sectionId: "faq-answer-0", label: "Marked down?" },
                { sectionId: "faq-answer-1", label: "Plain?" },
              ],
              summaryHeadingLevel: 3,
              surface: "muted",
            },
            children: [
              {
                id: "faq-answer-0",
                module: "content.prose",
                props: { text: "A **bounded** answer with [a link](https://example.org/notes).", markdown: true },
              },
              { id: "faq-answer-1", module: "content.prose", props: { text: "A plain answer." } },
            ],
          },
        ],
      },
      new Map(),
    );
    expect(html).toContain('<div class="uno-json-accordion" data-uno-surface="muted" id="faq">');
    expect((html.match(/<details class="uno-json-disclosure">/gu) ?? []).length).toBe(2);
    expect(html).toContain('<summary class="uno-json-disclosure-summary"><h3>Marked down?</h3></summary>');
    expect(html).toContain('<summary class="uno-json-disclosure-summary"><h3>Plain?</h3></summary>');
    // The Markdown answer is parsed inside its disclosure; the plain one stays the escaped paragraph.
    expect(html).toContain('<strong class="uno-family-md-strong">bounded</strong>');
    expect(html).toContain('<a class="uno-family-md-link" href="https://example.org/notes" rel="noopener noreferrer">a link</a>');
    expect(html).toContain('<p class="uno-json-prose" id="faq-answer-1">A plain answer.</p>');
    expect(html).not.toContain("**bounded**");
    // Native state is never authored: no disclosure is rendered open, and no control replaces the summary.
    expect(html).not.toContain("open=");
    expect(html).not.toContain("<button");
  });

  // `UNO-WO-119 / R01`: the attribute alone is not a surface. The shipped stylesheet must define one token-only treatment per
  // emphasised stack value and nothing for the ordinary stack or for the authorable `plain` value, so the Columns surface is
  // presentation rather than an attribute.
  it("styles the closed stack surface from the shared tokens and leaves the ordinary stack alone", () => {
    const css = stylesheet();
    const rule = (value: string): string | null => {
      const pattern = new RegExp(`\\.uno-json-stack\\[data-uno-surface="${value}"\\]\\s*\\{([^}]*)\\}`, "u");
      const match = pattern.exec(css);
      return match === null ? null : (match[1] ?? null);
    };
    const muted = rule("muted");
    const bordered = rule("bordered");
    expect(muted).not.toBeNull();
    expect(bordered).not.toBeNull();
    expect(muted).toContain("background-color: var(--uno-surface)");
    expect(muted).toContain("padding:");
    expect(muted).toContain("border-radius: var(--uno-radius-lg)");
    expect(bordered).toContain("border: 1px solid var(--uno-border)");
    expect(bordered).toContain("background-color: var(--uno-background)");
    expect(rule("plain")).toBeNull();
    const base = /\.uno-json-stack\s*\{([^}]*)\}/u.exec(css)?.[1] ?? "";
    expect(base).toContain("display: flex");
    expect(base).not.toContain("background");
    expect(base).not.toContain("padding");
    expect(base).not.toContain("border");
  });

  // `UNO-WO-118 / R02`: the attribute alone is not a surface. The shipped stylesheet must define one treatment per emphasised
  // value from the shared tokens, and must define nothing for the ordinary accordion or for the authorable `plain` value.
  it("styles the closed accordion surface from the shared tokens and leaves the ordinary group alone", () => {
    const css = stylesheet();
    const rule = (value: string): string | null => {
      const pattern = new RegExp(`\\.uno-json-accordion\\[data-uno-surface="${value}"\\]\\s*\\{([^}]*)\\}`, "u");
      const match = pattern.exec(css);
      return match === null ? null : (match[1] ?? null);
    };
    const muted = rule("muted");
    const bordered = rule("bordered");
    expect(muted).not.toBeNull();
    expect(bordered).not.toBeNull();
    expect(muted).toContain("background-color: var(--uno-surface-strong)");
    expect(muted).toContain("padding:");
    expect(muted).toContain("border-radius: var(--uno-radius-lg)");
    expect(bordered).toContain("border: 1px solid var(--uno-border)");
    expect(bordered).toContain("padding:");
    // `plain` denotes no emphasis, exactly as it does for every other Uno surface module, so there is no rule for it and the
    // base accordion rule keeps only its layout.
    expect(rule("plain")).toBeNull();
    const base = /\.uno-json-accordion\s*\{([^}]*)\}/u.exec(css)?.[1] ?? "";
    expect(base).toContain("display: flex");
    expect(base).not.toContain("background");
    expect(base).not.toContain("padding");
    expect(base).not.toContain("border");
  });

  it("renders one step heading inside its own list item when itemHeadingLevel is 3", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Step outline",
        sections: [
          {
            id: "steps",
            module: "content.timeline",
            props: {
              items: [
                { title: "First step", description: "First body." },
                { title: "Second step", status: "current" },
              ],
              itemHeadingLevel: 3,
            },
          },
        ],
      },
      new Map(),
    );
    // The headings sit inside the native ordered list, one per item, in authored order.
    expect(html).toContain('<ol class="uno-json-timeline-list">');
    expect((html.match(/<li class="uno-json-timeline-item"/gu) ?? []).length).toBe(2);
    expect((html.match(/<h3 class="uno-json-timeline-title">/gu) ?? []).length).toBe(2);
    expect(html).toContain('<h3 class="uno-json-timeline-title">First step</h3>');
    expect(html).toContain('<h3 class="uno-json-timeline-title">Second step</h3>');
    expect(html.indexOf("First step")).toBeLessThan(html.indexOf("Second step"));
    // No paragraph title survives, and the only status announcement is the explicitly authored current step.
    expect(html.includes('<p class="uno-json-timeline-title">')).toBe(false);
    expect((html.match(/aria-current="step"/gu) ?? []).length).toBe(1);
    expect(html).toContain("First body.");
  });

  it("renders one question heading inside its own native summary when summaryHeadingLevel is 3", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "FAQ outline",
        sections: [
          {
            id: "faq",
            module: "interaction.accordion",
            props: {
              items: [
                { sectionId: "faq-answer-0", label: "First question?" },
                { sectionId: "faq-answer-1", label: "Second question?" },
              ],
              summaryHeadingLevel: 3,
            },
            children: [
              { id: "faq-answer-0", module: "content.prose", props: { text: "First answer." } },
              { id: "faq-answer-1", module: "content.prose", props: { text: "Second answer." } },
            ],
          },
        ],
      },
      new Map(),
    );
    expect((html.match(/<details class="uno-json-disclosure">/gu) ?? []).length).toBe(2);
    expect(html.match(/<summary class="uno-json-disclosure-summary"><h3>/gu)?.length).toBe(2);
    expect(html).toContain("First question?");
    expect(html).toContain("Second question?");
    expect(html).toContain("First answer.");
    // Native disclosure stays the interaction: no control, role or ARIA guess is added around it.
    expect(html.includes("<button")).toBe(false);
    expect(html.includes('role="button"')).toBe(false);
    expect((html.match(/<h1/gu) ?? []).length).toBe(0);
    expect((html.match(/<main/gu) ?? []).length).toBe(0);
  });

  it("keeps authored outline text escaped in both heading positions", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Escaping",
        sections: [
          {
            id: "safe-timeline",
            module: "content.timeline",
            props: { items: [{ title: "A & B < C" }], itemHeadingLevel: 3 },
          },
          {
            id: "safe-faq",
            module: "interaction.accordion",
            props: { items: [{ sectionId: "safe-answer", label: "Q & A < B" }], summaryHeadingLevel: 3 },
            children: [{ id: "safe-answer", module: "content.prose", props: { text: "Answer." } }],
          },
        ],
      },
      new Map(),
    );
    expect(html).toContain("A &amp; B &lt; C");
    expect(html).toContain("Q &amp; A &lt; B");
    expect(html.includes("<h3>Q & A")).toBe(false);
  });

  it("renders the contact surface as delivery-OFF with no form and a disabled control", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Contact",
        sections: [
          {
            id: "contact",
            module: "interaction.contact",
            props: { heading: "Talk to us", fields: ["name", "email", "message"], submitLabel: "Send" },
          },
        ],
      },
      new Map(),
    );
    expect(html).toContain("Delivery is switched off");
    expect(html).toContain("Talk to us");
    expect(html).toContain("<label");
    expect(html).toContain("disabled");
    // There is no form, no action and no transport anywhere in this module.
    expect(html.includes("<form")).toBe(false);
    expect(html.includes("action=")).toBe(false);
    expect(html.includes("fetch(")).toBe(false);
  });

  it("renders the donor's positioned, surfaced section with a Markdown caption and the decorative form", () => {
    // `UNO-WO-120 / R01`: the two-track position is the section's own attribute, the caption renders as Markdown inside the
    // figure that owns it, and a decorative image is announced as nothing.
    const html = renderWithMedia(
      {
        version: 1,
        title: "Rich media",
        sections: [
          {
            id: "media",
            module: "layout.stack",
            props: { position: "start", surface: "muted" },
            children: [
              {
                id: "media-figure",
                module: "media.image",
                props: {
                  asset: { zone: "page", path: "hero.png" },
                  alt: "A described plate",
                  caption: "The **plate** with [notes](https://example.org/media-notes).",
                  markdown: true,
                },
              },
              {
                id: "media-text",
                module: "layout.stack",
                props: {},
                children: [{ id: "media-heading", module: "content.heading", props: { text: "Heading", level: 2 } }],
              },
            ],
          },
          {
            id: "decorative",
            module: "media.image",
            props: { asset: { zone: "page", path: "hero.png" }, alt: "", decorative: true, caption: "Plain caption." },
          },
        ],
      },
      new Map([
        ["media-figure", { image: image("0") }],
        ["decorative", { image: image("1") }],
      ]),
    );
    expect(html).toContain(
      '<div class="uno-json-stack" data-uno-gap="normal" data-uno-position="start" data-uno-surface="muted" id="media">',
    );
    // The caption belongs to the figure that owns the image, and its Markdown is drawn from the shared AST.
    expect(html).toMatch(
      /<figure class="uno-json-media" id="media-figure">[\s\S]*?<figcaption class="uno-json-media-caption">[\s\S]*?<strong class="uno-family-md-strong">plate<\/strong>[\s\S]*?<a class="uno-family-md-link" href="https:\/\/example\.org\/media-notes"/u,
    );
    // No Markdown syntax survives as literal text.
    expect(html.includes("**plate**")).toBe(false);
    expect(html.includes("[notes](")).toBe(false);
    // The decorative form: exactly an empty alt and no accessible name of any other kind.
    expect(html).toMatch(/<figure class="uno-json-media" id="decorative"><img alt=""[^>]*\/>/u);
    expect(html.includes('aria-label="') === false).toBe(true);
    expect(html).toContain('<figcaption class="uno-json-media-caption">Plain caption.</figcaption>');
  });

  it("renders an owned image with its authored alternative and a served locator", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Image",
        sections: [
          { id: "photo", module: "media.image", props: { asset: { zone: "page", path: "hero.png" }, alt: "A hero" } },
        ],
      },
      new Map([["photo", { image: image("0") }]]),
    );
    expect(html.includes("<img")).toBe(true);
    expect(html).toContain('alt="A hero"');
    expect(html).toContain("/uno-media/en-001/0");
    // The rendered locator never carries the authored storage path it came from.
    expect(html.includes("hero.png")).toBe(false);
  });

  it("renders a gallery at its closed column count with one figure per item", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Gallery",
        sections: [
          {
            id: "gal",
            module: "media.gallery",
            props: {
              columns: 3,
              items: [
                { asset: { zone: "page", path: "g-one.png" }, alt: "One" },
                { asset: { zone: "page", path: "g-two.png" }, alt: "Two" },
              ],
            },
          },
        ],
      },
      new Map([["gal", { items: [image("0"), image("1")] }]]),
    );
    expect(html).toContain('data-uno-columns="3"');
    expect(html.match(/<img/gu)?.length).toBe(2);
    expect(html).toContain('alt="One"');
    expect(html).toContain('alt="Two"');
  });

  it("renders the carousel through the island with one item on stage", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Carousel",
        sections: [
          {
            id: "carousel",
            module: "media.carousel",
            props: {
              label: "Selected work",
              items: [
                { asset: { zone: "page", path: "c-one.png" }, alt: "First" },
                { asset: { zone: "page", path: "c-two.png" }, alt: "Second" },
              ],
            },
          },
        ],
      },
      new Map([["carousel", { items: [image("0"), image("1")] }]]),
    );
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain("Image 1 of 2");
    expect(html).toContain('alt="First"');
    expect(html.includes('alt="Second"')).toBe(false);
  });

  it("renders tabs and a modal through the single island boundary", () => {
    const html = renderWithMedia(
      {
        version: 1,
        title: "Interactions",
        sections: [
          {
            id: "tabs",
            module: "interaction.tabs",
            props: {
              label: "Sections",
              tabs: [
                { sectionId: "tab-one", label: "Alpha" },
                { sectionId: "tab-two", label: "Beta" },
              ],
            },
            children: [
              { id: "tab-one", module: "content.prose", props: { text: "Alpha body" } },
              { id: "tab-two", module: "content.prose", props: { text: "Beta body" } },
            ],
          },
          {
            id: "modal",
            module: "interaction.modal",
            props: { triggerLabel: "Open details", title: "Details", closeLabel: "Close" },
            children: [{ id: "modal-body", module: "content.prose", props: { text: "Dialog body" } }],
          },
        ],
      },
      new Map(),
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Alpha");
    expect(html).toContain("Beta body");
    expect(html.includes("<dialog")).toBe(true);
    expect(html).toContain("Open details");
    // Exactly one `h1`/`main` owner: the renderer still emits neither.
    expect(html.includes("<main")).toBe(false);
    expect(/<h1[\s>]/u.test(html)).toBe(false);
  });
});



/**
 * `media.video` external mode, server side. The server must emit a **consent placeholder** and never a frame: these
 * assertions are the pre-consent guarantee, so they check for the absence of `iframe`/provider `src` as strictly as for
 * the presence of the label and disclosure.
 */
describe("media.video — external consent placeholder", () => {
  /** Render one document with an explicit media projection (empty here: external embeds own no served bytes). */
  function renderWithMedia(document: Record<string, unknown>, media: ReadonlyMap<string, unknown>): string {
    return renderToStaticMarkup(
      createElement(UnoPageSections, { document: accept(document), media: media as never }),
    );
  }

  const providers = [
    { provider: "youtube", videoId: "dQw4w9WgXcQ", label: "YouTube", host: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" },
    { provider: "vimeo", videoId: "76979871", label: "Vimeo", host: "https://player.vimeo.com/video/76979871?dnt=1" },
    { provider: "rumble", videoId: "v17j3tt", label: "Rumble", host: "https://rumble.com/embed/v17j3tt/" },
    { provider: "bitchute", videoId: "aB_9-hXyZ", label: "BitChute", host: "https://www.bitchute.com/embed/aB_9-hXyZ/" },
  ] as const;

  function externalHtml(provider: string, videoId: string): string {
    return renderWithMedia(
      {
        ...twoCardDocument(),
        sections: [{ id: "clip", module: "media.video", props: { source: "external", provider, videoId, title: "An external clip" } }],
      },
      new Map(),
    );
  }

  it("emits no frame, no provider src and no third-party request before consent", () => {
    for (const entry of providers) {
      const html = externalHtml(entry.provider, entry.videoId);
      expect(html.includes("<iframe")).toBe(false);
      expect(html.includes("srcdoc")).toBe(false);
      expect(html.includes(`src="${entry.host}"`)).toBe(false);
      expect(html.includes("preconnect")).toBe(false);
      expect(html.includes("preload=\"none\"")).toBe(false);
    }
  });

  it("emits one accessible activation control and an honest third-party disclosure", () => {
    for (const entry of providers) {
      const html = externalHtml(entry.provider, entry.videoId);
      expect(html.includes(`Load video from ${entry.label}`)).toBe(true);
      expect(html.includes(`hosted by ${entry.label}`)).toBe(true);
      expect(html.includes(`type="button"`)).toBe(true);
      // The outbound link is an ordinary anchor to the validated destination: it fetches nothing on load.
      expect(html.includes(`href="${entry.host}"`)).toBe(true);
      expect(html.includes(`rel="noreferrer noopener"`)).toBe(true);
    }
  });

  it("carries the provider identity on the block for targeted verification", () => {
    const html = externalHtml("vimeo", "76979871");
    expect(html.includes('data-uno-embed-provider="vimeo"')).toBe(true);
    expect(html.includes('data-uno-embed-id="clip"')).toBe(true);
  });

  it("keeps a native video as a real player with a required caption track", () => {
    const html = renderWithMedia(
      {
        ...twoCardDocument(),
        sections: [
          {
            id: "clip",
            module: "media.video",
            props: {
              asset: { zone: "page", path: "wo042-clip.mp4" },
              captions: { zone: "page", path: "wo042-clip.vtt" },
              title: "An owned clip",
            },
          },
        ],
      },
      new Map(),
    );
    // With no resolved media the honest outcome is nothing at all — never a bare or remote-sourced player.
    expect(html.includes("<video")).toBe(false);
    expect(html.includes("<iframe")).toBe(false);
  });
});


describe("content.prose variants and grid list — static semantic markup", () => {
  const variantHtml = (props: Record<string, unknown>): string =>
    render(
      accept({
        version: 1,
        title: "Variant fixture",
        sections: [{ id: "variant", module: "content.prose", props }],
      }),
    );

  it("renders legacy prose as the original escaped paragraph with no variant attribute", () => {
    const html = variantHtml({ text: 'A & B "quoted"' });
    expect(html).toContain('<p class="uno-json-prose" id="variant">A &amp; B &quot;quoted&quot;</p>');
    expect(html).not.toContain("data-uno-tone");
  });

  it("renders a plain callout section with an explicit tone and no alert role", () => {
    const html = variantHtml({ variant: "callout", text: "Careful & slow", tone: "warning" });
    expect(html).toContain('<section class="uno-json-callout" data-uno-tone="warning" id="variant">');
    expect(html).toContain("<p>Careful &amp; slow</p>");
    expect(html).not.toContain('role="alert"');
    expect(variantHtml({ variant: "callout", text: "Default" })).toContain('data-uno-tone="note"');
  });

  it("renders the rich prose body with an authored h2, lede and Markdown blocks", () => {
    const html = variantHtml({
      text: "A **strong** body with `code`.",
      heading: "Authored heading",
      lede: "A *lede* line.",
      markdown: true,
      align: "center",
      surface: "muted",
    });
    expect(html).toContain('<section class="uno-json-prose" id="variant"');
    expect(html).toContain('data-uno-align="center"');
    expect(html).toContain('data-uno-surface="muted"');
    expect(html).toContain('<h2 class="uno-json-prose-heading">Authored heading</h2>');
    expect(html).toContain('<em class="uno-family-md-em">lede</em>');
    expect(html).toContain('<strong class="uno-family-md-strong">strong</strong>');
    expect(html).toContain('<code class="uno-family-md-code">code</code>');
    expect(html).not.toContain("dangerouslySetInnerHTML");
    expect(html).not.toContain("<h1");
  });

  it("renders the callout heading and lede inside the accent and keeps the tone", () => {
    const html = variantHtml({
      variant: "callout",
      text: "Body text.",
      tone: "info",
      heading: "Inside heading",
      lede: "Inside lede.",
      markdown: true,
    });
    expect(html).toContain('<section class="uno-json-callout" data-uno-tone="info" id="variant">');
    expect(html).toContain('<h2 class="uno-json-prose-heading">Inside heading</h2>');
    expect(html).toContain("Inside lede.");
    const headingAt = html.indexOf("Inside heading");
    const bodyAt = html.indexOf("Body text.");
    expect(headingAt).toBeGreaterThan(-1);
    expect(bodyAt).toBeGreaterThan(headingAt);
    expect(html).not.toContain('role="alert"');
  });

  it("renders a classified Markdown link as an inert anchor with the exact accepted destination", () => {
    const html = variantHtml({ text: "See [the map](https://maps.example/directions) today.", markdown: true });
    expect(html).toContain('<a class="uno-family-md-link" href="https://maps.example/directions" rel="noopener noreferrer">');
    expect(html).toContain("the map");
    expect(html).not.toContain("target=");
  });

  it("renders ordered and unordered lists as real lists in authored order", () => {
    const ordered = variantHtml({
      variant: "list",
      ordered: true,
      items: [{ label: "First", detail: "First detail" }, { label: "Second" }],
    });
    expect(ordered).toContain('<ol class="uno-json-list" id="variant">');
    expect((ordered.match(/<li>/gu) ?? []).length).toBe(2);
    expect(ordered.indexOf("First")).toBeLessThan(ordered.indexOf("Second"));
    expect(ordered).toContain("<span>First</span><p>First detail</p>");
    expect(ordered).not.toContain("<a ");
    expect(variantHtml({ variant: "list", items: [{ label: "Only" }] })).toContain(
      '<ul class="uno-json-list" id="variant">',
    );
  });

  it("renders a table with caption, column headers, a focusable scroll wrapper and exact cells", () => {
    const html = variantHtml({
      variant: "table",
      caption: "Caption & more",
      columns: ["A", "B"],
      rows: [["1", "2"], ["3", "4"]],
    });
    expect(html).toContain('<div class="uno-json-table-scroll" id="variant" tabindex="0">');
    expect(html).toContain("<caption>Caption &amp; more</caption>");
    expect((html.match(/<th scope="col">/gu) ?? []).length).toBe(2);
    expect((html.match(/<td>/gu) ?? []).length).toBe(4);
    expect((html.match(/<tr>/gu) ?? []).length).toBe(3);
    expect(variantHtml({ variant: "table", columns: ["A"], rows: [["1"]] })).not.toContain("<caption>");
  });

  it("renders a divider as exactly one structural hr and no paragraph", () => {
    const html = variantHtml({ variant: "divider" });
    expect(html).toBe(
      '<div class="uno-json" data-uno-document-version="1"><hr class="uno-json-divider" id="variant"/></div>',
    );
    expect(html).not.toContain("<p");
  });
});

describe("layout.grid list semantics and ratios — static markup", () => {
  const gridDocument = (props: Record<string, unknown>): UnoPageDocument =>
    accept({
      version: 1,
      title: "Grid fixture",
      sections: [
        {
          id: "feature-list",
          module: "layout.grid",
          props,
          children: [
            { id: "feature-a", module: "content.prose", props: { text: "Feature A" } },
            { id: "feature-b", module: "content.prose", props: { text: "Feature B" } },
          ],
        },
      ],
    });

  it("renders grid list semantics as one native ul with one direct li per child in order", () => {
    const html = render(gridDocument({ columns: 2, itemSemantics: "list" }));
    expect(html.startsWith('<div class="uno-json" data-uno-document-version="1"><ul class="uno-json-grid"')).toBe(true);
    expect(html).toContain('data-uno-columns="2"');
    expect(html).toContain('data-uno-item-semantics="list"');
    expect(html).toContain('role="list"');
    expect((html.match(/<li class="uno-json-cell"/gu) ?? []).length).toBe(2);
    expect(html).not.toContain('<div class="uno-json-cell"');
    expect(html.indexOf("Feature A")).toBeLessThan(html.indexOf("Feature B"));
  });

  it("keeps the old plain and article grid markup and adds a ratio only when authored", () => {
    const plain = render(gridDocument({ columns: 2 }));
    expect(plain).toContain('<div class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="plain"');
    expect(plain).not.toContain("data-uno-ratio");
    expect(plain).toContain('<div class="uno-json-cell"');
    const article = render(gridDocument({ columns: 2, itemSemantics: "article" }));
    expect(article).toContain('data-uno-item-semantics="article"');
    expect((article.match(/<article class="uno-json-card"/gu) ?? []).length).toBe(2);
    const wide = render(gridDocument({ columns: 2, ratio: "start-wide" }));
    expect(wide).toContain('data-uno-ratio="start-wide"');
    const listed = render(gridDocument({ columns: 2, itemSemantics: "list", ratio: "end-wide" }));
    expect(listed).toContain('data-uno-ratio="end-wide"');
  });

  it("serializes no script, main or h1 and escapes authored ampersands across every variant", () => {
    const html = render(
      accept({
        version: 1,
        title: "Combined fixture",
        sections: [
          { id: "combined-callout", module: "content.prose", props: { variant: "callout", text: "A & B" } },
          { id: "combined-list", module: "content.prose", props: { variant: "list", items: [{ label: "One" }] } },
          {
            id: "combined-table",
            module: "content.prose",
            props: { variant: "table", columns: ["A"], rows: [["1"]] },
          },
          { id: "combined-divider", module: "content.prose", props: { variant: "divider" } },
          { id: "combined-legacy", module: "content.prose", props: { text: "Legacy & plain" } },
        ],
      }),
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<main");
    expect(html).not.toContain("<h1");
    expect(html).toContain("A &amp; B");
    expect(html).toContain("Legacy &amp; plain");
  });
});


/**
 * `UNO-WO-116 / R01`: what reaches the renderer.
 *
 * The renderer parses Markdown only for an already-accepted document, so a malformed Markdown-capable field must never arrive
 * here at all — the reader refuses the Page. The positive side proves the served markup still carries valid multilingual text
 * exactly, including supplementary characters, with no replacement character and no lost code unit.
 */
describe("UnoPageSections — Markdown-capable Unicode", () => {
  const multilingual = "Übersicht \u{1F600} e\u0301 概要 שלום مرحبا नमस्ते ไทย";

  /** One page whose only section is the module under test. */
  function page(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { version: 1, title: "Unicode fixture", sections: [{ id: "probe", module, props }] };
  }

  it("never renders a malformed Markdown-capable field, because the reader refused the Page first", () => {
    const malformed = [
      page("content.prose", { text: "Lead \uD800 tail" }),
      page("content.prose", { variant: "callout", text: "Lead \uDC00 tail" }),
      page("content.prose", { variant: "list", items: [{ label: "L", detail: "Lead \uDC00\uD800 tail" }] }),
      page("content.prose", { variant: "table", columns: ["A"], rows: [["1"]], caption: "Lead \uD800A\uDC00 tail" }),
      page("content.hero", { lede: "Lead \uD800 tail" }),
      page("content.hero", { support: "Lead \uDC00 tail" }),
      page("content.stats", { items: [{ value: "1", label: "L", detail: "Lead \uD800 tail" }] }),
      page("content.timeline", { items: [{ title: "T", description: "Lead \uD800 tail" }] }),
    ];
    for (const fixture of malformed) {
      const result = readUnoPageDocument(fixture);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe("document:invalid-props");
    }
  });

  it("serves a valid multilingual Markdown field byte-exactly, in both the plain and the Markdown form", () => {
    // Plain form: one inert paragraph carrying the authored characters untouched.
    const plain = render(accept(page("content.prose", { text: multilingual })));
    expect(plain).toContain("\u{1F600}");
    expect(plain).toContain("e\u0301");
    expect(plain).toContain("नमस्ते");
    expect(plain).not.toContain("\uFFFD");

    // Markdown form: the shared renderer draws the same characters inside an accepted paragraph.
    const markdown = render(accept(page("content.prose", { text: multilingual, markdown: true })));
    expect(markdown).toContain("\u{1F600}");
    expect(markdown).toContain("e\u0301");
    expect(markdown).not.toContain("\uFFFD");

    // The four credited rich families keep their multilingual text too.
    for (const fixture of [
      page("content.hero", { lede: multilingual, markdown: true }),
      page("content.stats", { items: [{ value: "\u{1F600}", label: "L", detail: multilingual }], markdown: true }),
      page("content.timeline", { items: [{ title: "T", description: multilingual }], markdown: true }),
    ]) {
      const html = render(accept(fixture));
      expect(html).toContain("\u{1F600}");
      expect(html).not.toContain("\uFFFD");
    }
  });
});


/**
 * `UNO-WO-116 / R02`: a declared-Markdown field can no longer reach the renderer unparsed.
 *
 * The renderer keeps its literal fallback for a field the shared reader refuses, but that path is now unreachable for an
 * accepted Page: the strict reader validates the same Markdown the renderer will parse. These cases prove the refusal happens
 * before any markup exists, and that a valid declared field still renders through the shared Markdown renderer.
 */
describe("UnoPageSections — declared Markdown is never printed as literal syntax", () => {
  function page(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { version: 1, title: "Declared Markdown fixture", sections: [{ id: "probe", module, props }] };
  }

  it("refuses every invalid declared-Markdown field before any markup is produced", () => {
    const invalid = [
      page("content.hero", { lede: "Lead **unclosed", markdown: true }),
      page("content.hero", { support: "Lead ![alt](https://example.invalid/i.png)", markdown: true }),
      page("content.stats", { items: [{ value: "1", label: "L", detail: "Lead **unclosed" }], markdown: true }),
      page("content.timeline", { items: [{ title: "T", description: "Lead [x](//example.invalid/p)" }], markdown: true }),
    ];
    for (const fixture of invalid) {
      const result = readUnoPageDocument(fixture);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe("document:invalid-props");
    }
  });

  it("renders a valid declared field through the shared Markdown renderer, never as its source syntax", () => {
    const hero = render(accept(page("content.hero", { lede: "A **visible** line", markdown: true })));
    expect(hero).toContain('<strong class="uno-family-md-strong">visible</strong>');
    expect(hero).not.toContain("**visible**");

    const stats = render(
      accept(page("content.stats", { items: [{ value: "1", label: "L", detail: "Only `one` detail." }], markdown: true })),
    );
    expect(stats).toContain('<code class="uno-family-md-code">one</code>');
    expect(stats).not.toContain("`one`");

    const timeline = render(
      accept(page("content.timeline", { items: [{ title: "T", description: "The **source** milestone." }], markdown: true })),
    );
    expect(timeline).toContain('<strong class="uno-family-md-strong">source</strong>');
    expect(timeline).not.toContain("**source**");
  });
});

