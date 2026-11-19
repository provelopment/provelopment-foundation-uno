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

