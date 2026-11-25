import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  UNO_FOUNDATION_SUBSET_FAMILIES,
  composeUnoFoundationSubset,
} from "../../src/application/compose-uno-foundation-families";
import { UNO_RENDERABLE_MODULES, readUnoPageDocument, type UnoPageDocument, type UnoSectionNode } from "../../src/core/page-document";
import type { UnoPageMedia } from "../../src/core/assets/uno-owned-media";
import { UnoPageSections } from "../../src/components/uno-page-sections";

/** One accepted donor envelope carrying exactly one section of every supported family, in source order. */
function acceptedSource(): Record<string, unknown> {
  return {
    version: 1,
    title: "Family subset fixture",
    sections: [
      { type: "prose", body: "A plain paragraph." },
      { type: "callout", body: "A bounded note.", tone: "warning" },
      { type: "table", columns: ["Name", "Count"], rows: [["A", "1"], ["B", "2"]], caption: "Values" },
      { type: "list", items: ["First", { label: "Second", detail: "More detail." }], ordered: true },
      { type: "divider" },
    ],
  };
}

/** One valid envelope around a single donor section. */
function envelope(section: unknown): Record<string, unknown> {
  return { version: 1, title: "Refusal fixture", sections: [section] };
}

/**
 * `UNO-WO-080 / R01`: one valid envelope that authors a level-2 section heading before the probed family.
 *
 * The composed `columns` titles are level-3 headings by the donor's own outline, so a columns family only forms a legal
 * document outline when an authored h2 precedes it — exactly as the donor's own section heading does on a real page.
 */
function titledEnvelope(section: unknown): Record<string, unknown> {
  return {
    version: 1,
    title: "Refusal fixture",
    sections: [{ type: "prose", heading: "Section heading", body: "Section body." }, section],
  };
}

/** The composed, validated Page, failing loudly when the fixture itself is refused. */
function composed(input: unknown, bindings?: unknown): UnoPageDocument {
  const outcome = composeUnoFoundationSubset(input, bindings);
  if (outcome.status !== "composed") throw new Error(`fixture refused: ${outcome.reason}`);
  return outcome.document;
}

/** Render one composed Page exactly as the page component would, optionally with a server-resolved media projection. */
function render(document: UnoPageDocument, media?: UnoPageMedia): string {
  return renderToStaticMarkup(
    createElement(UnoPageSections, { document, ...(media === undefined ? {} : { media }) }),
  );
}

/** Assert one closed refusal, that it is a closed literal, and that no partial document came back. */
function expectRefusal(input: unknown, reason: string, bindings?: unknown): void {
  const outcome = composeUnoFoundationSubset(input, bindings);
  expect(outcome.status).toBe("refused");
  if (outcome.status !== "refused") return;
  expect(outcome.reason).toBe(reason);
  expect(Object.prototype.hasOwnProperty.call(outcome, "document")).toBe(false);
}

describe("composeUnoFoundationSubset — seventeen bounded source shapes", () => {
  it("declares exactly the seventeen bounded families and leaves the 22-module registry untouched", () => {
    expect([...UNO_FOUNDATION_SUBSET_FAMILIES]).toEqual([
      "prose",
      "callout",
      "table",
      "list",
      "divider",
      "hero",
      "stats",
      "steps",
      "quote",
      "faq",
      "columns",
      "cards",
      "features",
      "actions",
      "media",
      "gallery",
      "contactForm",
    ]);
    expect(Object.isFrozen(UNO_FOUNDATION_SUBSET_FAMILIES)).toBe(true);
    expect(UNO_RENDERABLE_MODULES.length).toBe(22);
  });

  it("still accepts the original five-section fixture with stable ids and module ids", () => {
    const document = composed(acceptedSource());
    expect(document.version).toBe(1);
    expect(document.title).toBe("Family subset fixture");
    expect(document.sections.length).toBe(5);
    expect(document.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
    ]);
    expect(document.sections.map((section) => section.module)).toEqual([
      "content.prose",
      "content.prose",
      "content.prose",
      "content.prose",
      "content.prose",
    ]);
    expect(document.sections[0]?.props).toEqual({ text: "A plain paragraph." });
    expect(document.sections[1]?.props).toEqual({ variant: "callout", text: "A bounded note.", tone: "warning" });
    expect(document.sections[2]?.props).toEqual({
      variant: "table",
      columns: ["Name", "Count"],
      rows: [["A", "1"], ["B", "2"]],
      caption: "Values",
    });
    expect(document.sections[3]?.props).toEqual({
      variant: "list",
      items: [{ label: "First" }, { label: "Second", detail: "More detail." }],
      ordered: true,
    });
    expect(document.sections[4]?.props).toEqual({ variant: "divider" });
  });

  it("returns a deeply frozen Page and never mutates the caller's source", () => {
    const source = acceptedSource();
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(document.sections)).toBe(true);
    for (const section of document.sections) {
      expect(Object.isFrozen(section)).toBe(true);
      expect(Object.isFrozen(section.props)).toBe(true);
    }
    const table = document.sections[2];
    if (table !== undefined && table.module === "content.prose" && table.props.variant === "table") {
      expect(Object.isFrozen(table.props.rows)).toBe(true);
      expect(Object.isFrozen(table.props.rows[0])).toBe(true);
    }
  });

  it("hands the composed Page back through the Uno reader unaltered", () => {
    const document = composed(acceptedSource());
    const reread = readUnoPageDocument(document);
    expect(reread.accepted).toBe(true);
    if (reread.accepted) expect(JSON.stringify(reread.document)).toBe(JSON.stringify(document));

    const serialized = JSON.stringify(document);
    const roundTrip = readUnoPageDocument(serialized, { reservedHome: false });
    expect(roundTrip.accepted).toBe(true);
    if (roundTrip.accepted) expect(JSON.stringify(roundTrip.document)).toBe(serialized);
  });

  it("does not manufacture absent optional fields", () => {
    const callout = composed(envelope({ type: "callout", body: "No tone here." }));
    const table = composed(envelope({ type: "table", columns: ["A"], rows: [["1"]] }));
    const list = composed(envelope({ type: "list", items: ["Only"] }));
    for (const [document, key] of [
      [callout, "tone"],
      [table, "caption"],
      [list, "ordered"],
    ] as const) {
      const props = document.sections[0]?.props as Record<string, unknown> | undefined;
      expect(props).toBeDefined();
      expect(Object.prototype.hasOwnProperty.call(props ?? {}, key)).toBe(false);
    }
    expect(callout.sections[0]?.props).toEqual({ variant: "callout", text: "No tone here." });
    expect(table.sections[0]?.props).toEqual({ variant: "table", columns: ["A"], rows: [["1"]] });
    expect(list.sections[0]?.props).toEqual({ variant: "list", items: [{ label: "Only" }] });
  });
});

describe("composeUnoFoundationSubset — actual React semantic markup", () => {
  const html = render(composed(acceptedSource()));

  it("renders the prose node through the unchanged paragraph renderer", () => {
    expect(html).toContain('<p class="uno-json-prose" id="family-0-prose">A plain paragraph.</p>');
  });

  it("renders the callout as a section with an explicit tone and no alert role", () => {
    expect(html).toContain('<section class="uno-json-callout" data-uno-tone="warning" id="family-1-callout">');
    expect(html).toContain("<p>A bounded note.</p>");
    expect(html).not.toContain('role="alert"');
  });

  it("renders the table with one caption, two column headers and exactly four body cells", () => {
    expect(html).toContain('<div class="uno-json-table-scroll" id="family-2-table" tabindex="0">');
    expect(html).toContain("<caption>Values</caption>");
    expect((html.match(/<th scope="col">/gu) ?? []).length).toBe(2);
    expect((html.match(/<tr>/gu) ?? []).length).toBe(3);
    expect(html).toContain("<tbody>");
    expect((html.match(/<td>/gu) ?? []).length).toBe(4);
  });

  it("renders the list as one ordered list with exactly two items in source order", () => {
    expect(html).toContain('<ol class="uno-json-list" id="family-3-list">');
    expect((html.match(/<li>/gu) ?? []).length).toBe(2);
    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
    expect(html).toContain("<span>Second</span><p>More detail.</p>");
  });

  it("renders the divider as one structural hr", () => {
    expect(html).toContain('<hr class="uno-json-divider" id="family-4-divider"/>');
  });

  it("keeps source order and emits no script, main, h1, iframe or handler", () => {
    expect(html.indexOf("family-0-prose")).toBeLessThan(html.indexOf("family-1-callout"));
    expect(html.indexOf("family-1-callout")).toBeLessThan(html.indexOf("family-2-table"));
    expect(html.indexOf("family-2-table")).toBeLessThan(html.indexOf("family-3-list"));
    expect(html.indexOf("family-3-list")).toBeLessThan(html.indexOf("family-4-divider"));
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<main");
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("onclick");
  });

  it("escapes authored text rather than interpreting it", () => {
    const escaped = render(composed(envelope({ type: "prose", body: 'A & B "quoted" < not markup' })));
    expect(escaped).toContain("A &amp; B &quot;quoted&quot; &lt; not markup");
    expect(escaped).not.toContain("< not markup");
  });
});

describe("composeUnoFoundationSubset — hostile source refusal", () => {
  const prose = { type: "prose", body: "Fine." };

  it("refuses null, arrays and foreign prototypes", () => {
    expectRefusal(null, "family:unsafe-source");
    expectRefusal([], "family:unsafe-source");
    expectRefusal(Object.create({ version: 1, title: "T" }), "family:unsafe-source");
  });

  it("refuses a symbol key and a prototype-rewriting key", () => {
    expectRefusal({ version: 1, title: "T", sections: [prose], [Symbol("hidden")]: 1 }, "family:unsafe-source");
    expectRefusal(
      JSON.parse('{"version":1,"title":"T","__proto__":{"polluted":true},"sections":[{"type":"prose","body":"A"}]}'),
      "family:unsafe-source",
    );
  });

  it("refuses an accessor at the envelope, a section and a list entry", () => {
    const envelopeWithGetter: Record<string, unknown> = { version: 1, sections: [prose] };
    Object.defineProperty(envelopeWithGetter, "title", { enumerable: true, get: () => "T" });
    expectRefusal(envelopeWithGetter, "family:unsafe-source");

    const sectionWithGetter: Record<string, unknown> = { type: "prose" };
    Object.defineProperty(sectionWithGetter, "body", { enumerable: true, get: () => "A" });
    expectRefusal(envelope(sectionWithGetter), "family:unsafe-source");

    const entryWithGetter: Record<string, unknown> = { detail: "D" };
    Object.defineProperty(entryWithGetter, "label", { enumerable: true, get: () => "A" });
    expectRefusal(envelope({ type: "list", items: [entryWithGetter] }), "family:unsafe-source");
  });

  it("refuses a sparse section array, a sparse table row and a cyclic section", () => {
    const sparseSections: unknown[] = [prose];
    sparseSections.length = 2;
    expectRefusal({ version: 1, title: "T", sections: sparseSections }, "family:unsafe-source");

    const sparseRow: unknown[] = ["A"];
    sparseRow.length = 2;
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [sparseRow] }), "family:unsafe-source");

    const cyclic: Record<string, unknown> = { type: "prose", body: "A" };
    cyclic["self"] = cyclic;
    expectRefusal(envelope(cyclic), "family:unsafe-source");
  });

  it("never executes an accessor at a source array index", () => {
    let ran = 0;
    const sections: unknown[] = [];
    Object.defineProperty(sections, "0", {
      enumerable: true,
      get: () => {
        ran += 1;
        return prose;
      },
    });
    sections.length = 1;
    expectRefusal({ version: 1, title: "T", sections }, "family:unsafe-source");
    expect(ran).toBe(0);
  });

  it("refuses functions, undefined members, non-finite numbers and over-deep nesting", () => {
    expectRefusal(envelope({ type: "prose", body: () => "A" }), "family:unsafe-source");
    expectRefusal(envelope({ type: "prose", body: undefined }), "family:unsafe-source");
    expectRefusal({ version: Number.POSITIVE_INFINITY, title: "T", sections: [prose] }, "family:unsafe-source");

    let deep: Record<string, unknown> = { type: "prose", body: "A" };
    for (let level = 0; level < 9; level += 1) deep = { nested: deep };
    expectRefusal(envelope(deep), "family:unsafe-source");
  });

  it("refuses a source above its node budget", () => {
    const heavy = Array.from({ length: 32 }, () => ({
      type: "table",
      columns: ["a", "b", "c", "d", "e", "f"],
      rows: Array.from({ length: 20 }, () => ["1", "2", "3", "4", "5", "6"]),
    }));
    expectRefusal({ version: 1, title: "Heavy", sections: heavy }, "family:unsafe-source");
  });
});

describe("composeUnoFoundationSubset — envelope, family and feature refusal", () => {
  const prose = { type: "prose", body: "Fine." };

  it("refuses a wrong, string or non-finite envelope version", () => {
    expectRefusal({ version: 2, title: "T", sections: [prose] }, "family:unsupported-feature");
    expectRefusal({ version: "1", title: "T", sections: [prose] }, "family:unsupported-feature");
    expectRefusal({ version: Number.NaN, title: "T", sections: [prose] }, "family:unsafe-source");
  });

  it("refuses a missing or extra envelope key", () => {
    expectRefusal({ version: 1, sections: [prose] }, "family:unsupported-feature");
    expectRefusal({ title: "T", sections: [prose] }, "family:unsupported-feature");
    expectRefusal({ version: 1, title: "T" }, "family:unsupported-feature");
    expectRefusal({ version: 1, title: "T", sections: [prose], description: "Extra" }, "family:unsupported-feature");
    expectRefusal({ version: 1, title: "T", sections: [prose], visibility: "public" }, "family:unsupported-feature");
  });

  it("refuses a non-string title, zero sections and thirty-three sections", () => {
    expectRefusal({ version: 1, title: 5, sections: [prose] }, "family:unsupported-feature");
    expectRefusal({ version: 1, title: "T", sections: [] }, "family:unsupported-feature");
    expectRefusal(
      { version: 1, title: "T", sections: Array.from({ length: 33 }, () => ({ type: "divider" })) },
      "family:unsupported-feature",
    );
    expectRefusal({ version: 1, title: "T", sections: "not-an-array" }, "family:unsupported-feature");
  });

  it("refuses a candidate above the Uno 64 KiB source cap", () => {
    const oversized = {
      version: 1,
      title: "Oversized",
      sections: Array.from({ length: 32 }, () => ({ type: "prose", body: "x".repeat(4000) })),
    };
    expectRefusal(oversized, "family:target-refused");
  });

  it("refuses every donor family outside the seventeen, never degrading it to prose", () => {
    // Every one of the donor's seventeen families is now composed, so only an unknown type can reach this refusal — and
    // the canonical `contactForm` spelling is required: the target-id suffix never becomes a source alias.
    expectRefusal(envelope({ type: "contact" }), "family:unsupported-family");
    expectRefusal(envelope({ type: "contactform", formRef: "sales-inquiry" }), "family:unsupported-family");
    expectRefusal(envelope("prose"), "family:unsafe-source");
    expectRefusal(envelope({ body: "No type." }), "family:unsupported-feature");
  });

  it("refuses an out-of-subset field on a supported family", () => {
    // `UNO-WO-084 / R01` makes `align`, `surface` and Markdown representable on `prose` and `callout`, so this case now
    // proves the refusal with the donor fields that stay outside the subset.
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [["1"]], links: [] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "list", items: ["A"], visibility: "public" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "divider", html: "<b>" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", href: "/elsewhere" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", route: "/en" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", link: "/en" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", style: "color:red" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", onClick: "go()" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "callout", body: "A", style: "color:red" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "callout", body: "A", href: "/x" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "list", items: [{ label: "A", route: "/x" }] }), "family:target-refused");
    expectRefusal(envelope({ type: "list", items: [{ label: "A", destination: "/x" }] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "list", items: ["A"], extra: true }), "family:unsupported-feature");
  });
});

describe("composeUnoFoundationSubset — malformed accepted fields and Markdown refusal", () => {
  it("refuses malformed prose, callout, table and list values through the Uno target", () => {
    expectRefusal(envelope({ type: "prose", body: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "prose", body: "<script>alert(1)</script>" }), "family:target-refused");
    expectRefusal(envelope({ type: "prose", body: "x".repeat(4001) }), "family:target-refused");
    expectRefusal(envelope({ type: "callout", body: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "callout", body: "A", tone: "danger" }), "family:target-refused");
    expectRefusal(envelope({ type: "callout", body: "A", tone: 5 }), "family:target-refused");

    expectRefusal(envelope({ type: "table", columns: [], rows: [["1"]] }), "family:target-refused");
    expectRefusal(
      envelope({
        type: "table",
        columns: ["a", "b", "c", "d", "e", "f", "g"],
        rows: [["1", "2", "3", "4", "5", "6", "7"]],
      }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: Array.from({ length: 21 }, () => ["1"]) }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "table", columns: ["A", "B"], rows: [["1"]] }), "family:target-refused");
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [[" "]] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "x".repeat(321) }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [[{ nested: true }]] }), "family:target-refused");

    expectRefusal(envelope({ type: "list", items: [] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "list", items: Array.from({ length: 13 }, (_, index) => `Item ${index}`) }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "list", items: ["  "] }), "family:target-refused");
    expectRefusal(envelope({ type: "list", items: ["A"], ordered: "yes" }), "family:target-refused");
    expectRefusal(envelope({ type: "list", items: ["A"], ordered: 1 }), "family:target-refused");
  });

  it("renders accepted Markdown on prose and callout while refusing it elsewhere", () => {
    const proseMarkdown = render(composed(envelope({ type: "prose", body: "This is **bold** and `code`." })));
    expect(proseMarkdown).toContain('<strong class="uno-family-md-strong">bold</strong>');
    expect(proseMarkdown).toContain('<code class="uno-family-md-code">code</code>');
    const linkMarkdown = render(composed(envelope({ type: "prose", body: "See [link](https://example.org) here." })));
    expect(linkMarkdown).toContain('href="https://example.org"');
    const headingMarkdown = render(composed(envelope({ type: "prose", body: "## Section\n\nBody text." })));
    expect(headingMarkdown).toContain('<h2 class="uno-family-md-heading">Section</h2>');
    const calloutMarkdown = render(composed(envelope({ type: "callout", body: "A **note** here." })));
    expect(calloutMarkdown).toContain("uno-json-callout");
    expect(calloutMarkdown).toContain('<strong class="uno-family-md-strong">note</strong>');
    // Families without a Markdown contract still refuse its punctuation rather than printing it as faithful text.
    expectRefusal(envelope({ type: "list", items: ["**bold label**"] }), "family:unsupported-feature");
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: [["[x](https://example.org)"]] }),
      "family:unsupported-feature",
    );
    // `UNO-WO-102 / R01`: the donor's Markdown-capable list `detail` and table `caption` now compose as accepted Markdown
    // instead of refusing, while a table cell stays plain text.
    const listDetail = composed(envelope({ type: "list", items: [{ label: "A", detail: "`code`" }] }));
    expect(render(listDetail)).toContain('<code class="uno-family-md-code">code</code>');
    const captionMarkdown = composed(envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "`c`" }));
    expect(render(captionMarkdown)).toContain('<code class="uno-family-md-code">c</code>');
    // A construct Uno cannot render safely refuses the whole source instead of degrading to apparent text.
    expectRefusal(envelope({ type: "prose", body: "![alt](https://example.org/a.png)" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "See [x](javascript:alert(1))" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "callout", body: "Text <b>markup</b>" }), "family:target-refused");
  });

  it("refuses a legacy Uno Page source rather than misreading it as donor input", () => {
    const legacy = {
      version: 1,
      title: "Legacy Uno Page",
      sections: [{ id: "intro", module: "content.prose", props: { text: "A legacy paragraph." } }],
    };
    expect(readUnoPageDocument(legacy).accepted).toBe(true);
    expectRefusal(legacy, "family:unsupported-feature");
  });

  it("refuses deterministically with the same closed reason for the same input", () => {
    const input = envelope({ type: "table", columns: ["A", "B"], rows: [["1"]] });
    const first = composeUnoFoundationSubset(input);
    const second = composeUnoFoundationSubset(input);
    expect(first).toEqual(second);
    expect(first.status).toBe("refused");
  });
});

/** The five-section fixture with the two new bounded families appended, in source order. */
function sevenSectionSource(): Record<string, unknown> {
  const source = acceptedSource();
  const sections = source["sections"] as readonly unknown[];
  return {
    ...source,
    sections: [
      ...sections,
      {
        type: "hero",
        lede: "A genuine introduction.",
        eyebrow: "Introduction",
        support: "Further details.",
        align: "center",
        surface: "muted",
      },
      {
        type: "stats",
        items: [
          { value: "22", label: "Modules" },
          { value: "4", label: "Asset zones", detail: "Owned delivery." },
        ],
      },
    ],
  };
}

describe("composeUnoFoundationSubset — bounded hero and stats", () => {
  it("composes seven nodes in source order, leaving the first five byte-identical", () => {
    const five = composed(acceptedSource());
    const seven = composed(sevenSectionSource());
    expect(seven.sections.length).toBe(7);
    expect(seven.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
      "family-5-hero",
      "family-6-stats",
    ]);
    expect(JSON.stringify(seven.sections.slice(0, 5))).toBe(JSON.stringify(five.sections));
    const hero = seven.sections[5];
    const stats = seven.sections[6];
    expect(hero?.module).toBe("content.hero");
    expect(stats?.module).toBe("content.stats");
    expect(hero?.props).toEqual({
      lede: "A genuine introduction.",
      eyebrow: "Introduction",
      support: "Further details.",
      align: "center",
      surface: "muted",
    });
    expect(stats?.props).toEqual({
      items: [
        { value: "22", label: "Modules" },
        { value: "4", label: "Asset zones", detail: "Owned delivery." },
      ],
    });
  });

  it("freezes the composed Page, keeps caller input unchanged and round-trips through JSON", () => {
    const source = sevenSectionSource();
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(document.sections)).toBe(true);
    for (const section of document.sections) expect(Object.isFrozen(section.props)).toBe(true);
    const serialized = JSON.stringify(document);
    const reread = readUnoPageDocument(serialized, { reservedHome: false });
    expect(reread.accepted).toBe(true);
    if (reread.accepted) expect(JSON.stringify(reread.document)).toBe(serialized);
  });

  it("does not manufacture absent hero optionals or absent stats detail", () => {
    const hero = composed(envelope({ type: "hero", lede: "Only a lede." }));
    const stats = composed(envelope({ type: "stats", items: [{ value: "1", label: "One" }] }));
    expect(hero.sections[0]?.props).toEqual({ lede: "Only a lede." });
    expect(stats.sections[0]?.props).toEqual({ items: [{ value: "1", label: "One" }] });
  });
});

describe("composeUnoFoundationSubset — hero and stats React markup", () => {
  const html = render(composed(sevenSectionSource()));

  it("renders the hero section with authored align, surface and no invented action", () => {
    expect(html).toContain(
      '<section class="uno-json-hero" data-uno-align="center" data-uno-surface="muted" id="family-5-hero">',
    );
    expect(html).toContain('<p class="uno-json-eyebrow">Introduction</p>');
    expect(html).toContain('<p class="uno-json-hero-lede">A genuine introduction.</p>');
    expect(html).toContain('<p class="uno-json-hero-support">Further details.</p>');
    expect(html).not.toContain("uno-json-hero-actions");
    expect(html).not.toContain("<iframe");
  });

  it("renders the stats section as a real description list in authored order", () => {
    expect(html).toContain('<section class="uno-json-stats" data-uno-surface="plain" id="family-6-stats">');
    expect(html).toContain('<dl class="uno-json-stats-list">');
    expect((html.match(/<dt class="uno-json-stat-label">/gu) ?? []).length).toBe(2);
    expect((html.match(/<dd class="uno-json-stat-value">/gu) ?? []).length).toBe(2);
    expect(html.indexOf("Modules")).toBeLessThan(html.indexOf("Asset zones"));
    expect((html.match(/<span class="uno-json-stat-detail">/gu) ?? []).length).toBe(1);
    expect(html).toContain("Owned delivery.");
    expect(html).not.toContain("uno-json-stats-heading");
    expect(html).not.toContain("€");
  });

  it("supplies no second main or h1 from this component", () => {
    expect((html.match(/<h1/gu) ?? []).length).toBe(0);
    expect((html.match(/<main/gu) ?? []).length).toBe(0);
  });
});

/** The seven-section fixture with the two newest bounded families appended, in source order. */
function nineSectionSource(): Record<string, unknown> {
  const source = sevenSectionSource();
  const sections = source["sections"] as readonly unknown[];
  return {
    ...source,
    sections: [
      ...sections,
      {
        type: "steps",
        surface: "muted",
        items: [
          { title: "Prepare", body: "Review the content." },
          { title: "Publish" },
        ],
      },
      {
        type: "quote",
        body: "The exact words.",
        attribution: "Example speaker",
        role: "Reviewer",
        align: "center",
        surface: "bordered",
      },
    ],
  };
}

describe("composeUnoFoundationSubset — bounded steps and quote", () => {
  it("composes nine nodes in source order, leaving the first seven byte-identical", () => {
    const seven = composed(sevenSectionSource());
    const nine = composed(nineSectionSource());
    expect(nine.sections.length).toBe(9);
    expect(nine.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
      "family-5-hero",
      "family-6-stats",
      "family-7-steps",
      "family-8-quote",
    ]);
    expect(JSON.stringify(nine.sections.slice(0, 7))).toBe(JSON.stringify(seven.sections));
    const steps = nine.sections[7];
    const quote = nine.sections[8];
    expect(steps?.module).toBe("content.timeline");
    expect(quote?.module).toBe("content.testimonials");
    expect(steps?.props).toEqual({
      items: [{ title: "Prepare", description: "Review the content." }, { title: "Publish" }],
      surface: "muted",
      // `UNO-WO-080 / R01`: the donor step titles are level-3 headings, so the composed timeline always carries the
      // closed literal presentation switch alongside its authored surface.
      itemHeadingLevel: 3,
    });
    expect(quote?.props).toEqual({
      items: [{ quote: "The exact words.", attribution: "Example speaker", role: "Reviewer" }],
      align: "center",
      surface: "bordered",
    });
  });

  it("freezes the nine-node Page, keeps caller input unchanged and round-trips both forms", () => {
    const source = nineSectionSource();
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(document.sections)).toBe(true);
    for (const section of document.sections) {
      expect(Object.isFrozen(section)).toBe(true);
      expect(Object.isFrozen(section.props)).toBe(true);
    }
    const steps = document.sections[7];
    if (steps?.module === "content.timeline") expect(Object.isFrozen(steps.props.items)).toBe(true);
    const quote = document.sections[8];
    if (quote?.module === "content.testimonials") expect(Object.isFrozen(quote.props.items[0])).toBe(true);

    // The Uno reader accepts the composed object itself and the same document as JSON text, unaltered.
    const reread = readUnoPageDocument(document);
    expect(reread.accepted).toBe(true);
    if (reread.accepted) expect(JSON.stringify(reread.document)).toBe(JSON.stringify(document));
    const serialized = JSON.stringify(document);
    const roundTrip = readUnoPageDocument(serialized, { reservedHome: false });
    expect(roundTrip.accepted).toBe(true);
    if (roundTrip.accepted) expect(JSON.stringify(roundTrip.document)).toBe(serialized);
  });

  it("manufactures no absent step or quote field", () => {
    const steps = composed(envelope({ type: "steps", items: [{ title: "A" }] }));
    const quote = composed(envelope({ type: "quote", body: "Q" }));
    const attributed = composed(envelope({ type: "quote", body: "Q", attribution: "Only a name" }));
    const described = composed(envelope({ type: "steps", items: [{ title: "A", body: "B" }] }));
    expect(steps.sections[0]?.props).toEqual({ items: [{ title: "A" }], itemHeadingLevel: 3 });
    expect(quote.sections[0]?.props).toEqual({ items: [{ quote: "Q" }] });
    expect(attributed.sections[0]?.props).toEqual({ items: [{ quote: "Q", attribution: "Only a name" }] });
    expect(described.sections[0]?.props).toEqual({ items: [{ title: "A", description: "B" }], itemHeadingLevel: 3 });
  });
});

describe("composeUnoFoundationSubset — hero and stats refusal", () => {
  it("accepts the approved hero surface and refuses every out-of-subset hero field", () => {
    // `UNO-WO-112 / R01`: the donor's static `href` action composes; a `route` or `link` destination stays outside this
    // subset, an extra field is still refused, and Markdown in the plain eyebrow is still refused.
    const composed = composeUnoFoundationSubset(
      envelope({
        type: "hero",
        eyebrow: "Introduction",
        lede: "A **Markdown** lede.",
        support: "Plain support.",
        align: "center",
        surface: "muted",
        actions: [{ label: "Read the notes", href: "https://example.org/notes", variant: "primary" }],
      }),
    );
    expect(composed.status).toBe("composed");
    if (composed.status === "composed") {
      expect(composed.document.sections[0]?.props).toEqual({
        eyebrow: "Introduction",
        lede: "A **Markdown** lede.",
        support: "Plain support.",
        markdown: true,
        align: "center",
        surface: "muted",
        actions: [{ label: "Read the notes", href: "https://example.org/notes", variant: "primary" }],
      });
    }
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", route: "target" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", link: "help" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", href: "https://example.org/a", route: "b" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", targetId: "probe" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(envelope({ type: "hero", lede: "A", eyebrow: "[x](https://example.org)" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", eyebrow: "Only an eyebrow" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "A", href: "/x" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "A", route: "/en" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "A", actions: [] }), "family:unsupported-feature");
  });

  it("supports a hero without a lede and refuses every malformed hero value through the Uno target", () => {
    // The donor's `lede` is optional; one authored body field is the Uno target's own minimum.
    const supportOnly = composeUnoFoundationSubset(envelope({ type: "hero", support: "Only support" }));
    expect(supportOnly.status).toBe("composed");
    if (supportOnly.status === "composed") {
      expect(supportOnly.document.sections[0]?.props).toEqual({ support: "Only support" });
    }
    expectRefusal(envelope({ type: "hero", lede: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "A", align: "end" }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "A", surface: "loud" }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "x".repeat(4001) }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "A", eyebrow: "x".repeat(161) }), "family:target-refused");
    // An unsafe or non-string action destination and an unknown variant refuse the whole source, never a partial Page.
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", href: "javascript:alert(1)" }] }),
      "family:target-refused",
    );
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", href: "/relative" }] }),
      "family:target-refused",
    );
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", href: "https://example.org/a", variant: "loud" }] }),
      "family:target-refused",
    );
    expectRefusal(
      envelope({
        type: "hero",
        lede: "A",
        actions: [
          { label: "A", href: "https://example.org/a" },
          { label: "B", href: "https://example.org/b" },
          { label: "C", href: "https://example.org/c" },
          { label: "D", href: "https://example.org/d" },
        ],
      }),
      "family:unsupported-feature",
    );
  });

  it("refuses stats fields and links outside the bounded subset", () => {
    // `UNO-WO-072 / R01` accepts the donor's optional authored `heading`/`lede` here, so they are no longer extra keys;
    // their own strictness, refusal reasons and byte-compatible absence are proved in the dedicated sequence section.
    // `UNO-WO-113 / R01`: the donor's `detail` is Markdown-capable, so a classified link now renders; markup and unsafe
    // constructs are still refused.
    expectRefusal(envelope({ type: "stats", items: [{ value: "1", label: "X", href: "/x" }] }), "family:unsupported-feature");
    const linked = composeUnoFoundationSubset(
      envelope({ type: "stats", items: [{ value: "1", label: "X", detail: "[x](https://example.org)" }] }),
    );
    expect(linked.status).toBe("composed");
    if (linked.status === "composed") {
      const node = linked.document.sections[0];
      expect(node?.module).toBe("content.stats");
      if (node?.module === "content.stats") {
        expect(node.props.markdown).toBe(true);
        expect(node.props.items[0]?.detail).toBe("[x](https://example.org)");
      }
    }
    expectRefusal(
      envelope({ type: "stats", items: [{ value: "1", label: "X", detail: "<script>alert(1)</script>" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(envelope({ type: "stats", items: "not-an-array" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "stats", items: ["string"] }), "family:unsupported-feature");
  });

  it("refuses malformed stats values through the Uno target", () => {
    expectRefusal(envelope({ type: "stats", items: [] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "stats", items: Array.from({ length: 7 }, () => ({ value: "1", label: "X" })) }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "stats", items: [{ value: "1", label: "" }] }), "family:target-refused");
    expectRefusal(envelope({ type: "stats", items: [{ value: "", label: "X" }] }), "family:target-refused");
  });

  it("refuses the whole Page when a later stats entry is hostile, without running its getter", () => {
    let ran = 0;
    const hostileItem: Record<string, unknown> = { label: "X" };
    Object.defineProperty(hostileItem, "value", {
      enumerable: true,
      get: () => {
        ran += 1;
        return "1";
      },
    });
    const outcome = composeUnoFoundationSubset({
      version: 1,
      title: "Mixed fixture",
      sections: [
        { type: "prose", body: "A valid leading section." },
        { type: "stats", items: [hostileItem] },
      ],
    });
    expect(outcome.status).toBe("refused");
    if (outcome.status === "refused") expect(outcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(outcome, "document")).toBe(false);
    expect(ran).toBe(0);
  });
});

/** The donor's exact ordered family roster (`PAGE_SECTION_TYPES`), independent of the Uno module registry. */
const DONOR_17 = [
  "hero",
  "prose",
  "media",
  "gallery",
  "actions",
  "callout",
  "cards",
  "features",
  "columns",
  "steps",
  "stats",
  "quote",
  "table",
  "faq",
  "list",
  "divider",
  "contactForm",
] as const;
/** The seventeen bounded subsets this adapter composes, in adapter order. */
const MAPPED_17 = [
  "prose",
  "callout",
  "table",
  "list",
  "divider",
  "hero",
  "stats",
  "steps",
  "quote",
  "faq",
  "columns",
  "cards",
  "features",
  "actions",
  "media",
  "gallery",
  "contactForm",
] as const;

describe("composeUnoFoundationSubset — steps and quote React markup", () => {
  const html = render(composed(nineSectionSource()));

  it("renders the steps as one real ordered timeline list in authored order", () => {
    expect(html).toContain('<section class="uno-json-timeline" data-uno-surface="muted" id="family-7-steps">');
    expect((html.match(/<ol class="uno-json-timeline-list">/gu) ?? []).length).toBe(1);
    expect((html.match(/class="uno-json-timeline-item"/gu) ?? []).length).toBe(2);
    expect(html).toContain('<h3 class="uno-json-timeline-title">Prepare</h3>');
    expect(html).toContain('<h3 class="uno-json-timeline-title">Publish</h3>');
    expect((html.match(/class="uno-json-timeline-description"/gu) ?? []).length).toBe(1);
    expect(html).toContain('<p class="uno-json-timeline-description">Review the content.</p>');
    expect(html.indexOf("Prepare")).toBeLessThan(html.indexOf("Publish"));
    expect(html).not.toContain('aria-current="step"');
    expect(html).not.toContain("data-uno-status");
    expect(html).not.toContain("uno-json-timeline-date");
    expect(html).not.toContain("uno-json-timeline-heading");
  });

  it("renders the quote as a figure with blockquote and an authored caption", () => {
    expect(html).toContain(
      '<section class="uno-json-testimonials" data-uno-align="center" data-uno-surface="bordered" id="family-8-quote">',
    );
    expect((html.match(/<figure class="uno-json-testimonial">/gu) ?? []).length).toBe(1);
    expect(html).toContain('<blockquote class="uno-json-testimonial-quote">The exact words.</blockquote>');
    expect(html).toContain('<figcaption class="uno-json-testimonial-caption">');
    expect(html).toContain('<span class="uno-json-testimonial-attribution">Example speaker</span>');
    expect(html).toContain('<span class="uno-json-testimonial-role">Reviewer</span>');
  });

  it("composes, re-reads and renders a quote whose Markdown body carries one approved safe link", () => {
    // `UNO-WO-118 / R02` (§4): the positive half of the Quote destination proof. The R01 credit rests on refusals; this case
    // proves the same path accepts an authored safe `https` link, keeps it byte-identically through the strict reader, and
    // renders it as a real anchor with `rel="noopener noreferrer"` and no literal Markdown syntax. No product code changes.
    const body = "A **linked** quotation, see [the notes](https://example.org/notes).";
    const outcome = composeUnoFoundationSubset(
      envelope({ type: "quote", body, attribution: "Synthetic contributor", surface: "muted" }),
    );
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const node = outcome.document.sections[0];
    expect(node?.module).toBe("content.testimonials");
    if (node?.module !== "content.testimonials") return;
    expect(node.props).toEqual({
      items: [{ quote: body, attribution: "Synthetic contributor" }],
      surface: "muted",
      markdown: true,
    });
    // Read: the strict reader accepts the composed node and the same document as JSON text, unchanged.
    const reread = readUnoPageDocument(outcome.document);
    expect(reread.accepted).toBe(true);
    if (reread.accepted) expect(JSON.stringify(reread.document)).toBe(JSON.stringify(outcome.document));
    // Render: one real anchor with the approved destination, no literal Markdown left behind.
    const html = render(outcome.document);
    expect(html).toContain(
      '<a class="uno-family-md-link" href="https://example.org/notes" rel="noopener noreferrer">the notes</a>',
    );
    expect(html).toContain('<strong class="uno-family-md-strong">linked</strong>');
    expect(html).not.toContain("](");
    expect(html).not.toContain("**linked**");
    expect(html).not.toContain("target=");
  });

  it("supplies no second main, h1, script, iframe or handler from these two families", () => {
    expect((html.match(/<main/gu) ?? []).length).toBe(0);
    expect((html.match(/<h1/gu) ?? []).length).toBe(0);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("onclick");
  });

  it("escapes authored quotation text rather than interpreting it", () => {
    const escaped = render(composed(envelope({ type: "quote", body: 'A & B "quoted"' })));
    expect(escaped).toContain("A &amp; B &quot;quoted&quot;");
  });
});

describe("composeUnoFoundationSubset — quote refusal", () => {
  it("refuses quote fields and invalid Markdown outside the bounded subset", () => {
    // `UNO-WO-117 / R01`: the donor authors no `heading`/`lede`, so those stay out-of-subset keys; a link, handler or any
    // other extra key is refused the same way. The donor's Markdown `body` now composes, so what refuses here is Markdown
    // the shared reader itself rejects — never a literal render of it.
    for (const extra of ["heading", "lede", "href", "onClick"]) {
      expectRefusal(envelope({ type: "quote", body: "Q", [extra]: "X" }), "family:unsupported-feature");
    }
    for (const body of [
      "<script>alert(1)</script>",
      "![alt](https://example.org/i.png)",
      "An **unbalanced body",
      "[x](javascript:alert(1))",
      "[x](//example.org/protocol-relative)",
    ]) {
      expectRefusal(envelope({ type: "quote", body }), "family:unsupported-feature");
    }
    // The caption fields stay single-line plain text: Markdown in a role or an attribution is still out of subset.
    expectRefusal(
      envelope({ type: "quote", body: "Q", attribution: "A", role: "**bold**" }),
      "family:unsupported-feature",
    );
  });

  it("refuses malformed quote values through the Uno target", () => {
    expectRefusal(envelope({ type: "quote", body: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "q".repeat(4001) }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: " Q" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", align: "end" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", surface: "loud" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", attribution: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", attribution: "a".repeat(161) }), "family:target-refused");
    // A suppressed role-only caption is still validated: its bound is the same label bound.
    expectRefusal(envelope({ type: "quote", body: "Q", role: "r".repeat(161) }), "family:target-refused");
  });
});

/**
 * `UNO-WO-117 / R01`: the donor's Markdown quotation and its own caption presentation rule.
 *
 * The donor `quote.body` is Markdown-capable, so the composed node declares Markdown only when the body authors it. The
 * donor draws a role **only** beside an attribution, so a role-only caption is suppressed — after the supplied role has
 * still been validated, so a malformed role can never be hidden by the suppression. No attribution, role, caption or
 * Markdown feature is ever invented.
 */
describe("composeUnoFoundationSubset — quote Markdown and caption presentation", () => {
  it("composes a Markdown body as the declared rich quotation and keeps a plain body byte-identical", () => {
    const rich = composed(envelope({ type: "quote", body: "A **bounded** quotation." }));
    expect(rich.sections[0]?.props).toEqual({ items: [{ quote: "A **bounded** quotation." }], markdown: true });
    const plain = composed(envelope({ type: "quote", body: "A bounded quotation." }));
    expect(plain.sections[0]?.props).toEqual({ items: [{ quote: "A bounded quotation." }] });
    // An authored multi-line body is Markdown too, and the shared reader accepts it as such.
    const multiline = composed(envelope({ type: "quote", body: "First line\n\nSecond *line*." }));
    expect(multiline.sections[0]?.props).toEqual({
      items: [{ quote: "First line\n\nSecond *line*." }],
      markdown: true,
    });
  });

  it("keeps an attribution with its role and suppresses a role-only caption after validating it", () => {
    const attributed = composed(envelope({ type: "quote", body: "Q", attribution: "A name", role: "Reviewer" }));
    expect(attributed.sections[0]?.props).toEqual({ items: [{ quote: "Q", attribution: "A name", role: "Reviewer" }] });
    // The donor presents nothing for a role without an attribution: the role is validated, then not composed.
    const roleOnly = composed(envelope({ type: "quote", body: "Q", role: "Reviewer" }));
    expect(roleOnly.sections[0]?.props).toEqual({ items: [{ quote: "Q" }] });
    // No attribution is ever invented, and the bare quotation stays exactly that.
    const bare = composed(envelope({ type: "quote", body: "Q" }));
    expect(bare.sections[0]?.props).toEqual({ items: [{ quote: "Q" }] });
  });

  /**
   * `UNO-WO-117 / R01`: the donor's Markdown quotation and its caption rule as the real renderer draws them — parsed
   * Markdown inside the one `<blockquote>`, separate attribution and role spans, and nothing presented for a role-only
   * donor input.
   */
  it("renders the donor's Markdown quotation as parsed Markdown and suppresses a role-only caption", () => {
    const html = render(composed(envelope({ type: "quote", body: "A **bounded** quotation.", attribution: "A", role: "R" })));
    const quote = /<blockquote class="uno-json-testimonial-quote">([\s\S]*?)<\/blockquote>/u.exec(html)?.[1] ?? "";
    expect(quote).toContain('<strong class="uno-family-md-strong">bounded</strong>');
    expect(html).not.toContain("**bounded**");
    expect(html).toContain('<span class="uno-json-testimonial-attribution">A</span>');
    expect(html).toContain('<span class="uno-json-testimonial-role">R</span>');
    // A role without an attribution is presented as nothing at all: no caption element is created for it.
    const roleOnly = render(composed(envelope({ type: "quote", body: "A bounded quotation.", role: "Reviewer" })));
    expect(roleOnly).toContain('<blockquote class="uno-json-testimonial-quote">A bounded quotation.</blockquote>');
    expect(roleOnly).not.toContain("uno-json-testimonial-caption");
    expect(roleOnly).not.toContain("Reviewer");
  });
});

describe("composeUnoFoundationSubset — steps refusal", () => {
  it("refuses steps fields and item states outside the bounded subset, and accepts the donor's Markdown body", () => {
    // `UNO-WO-072 / R01` accepts `heading`/`lede` on `steps`; the remaining donor fields stay out of this subset.
    // `UNO-WO-114 / R01`: the donor's `body` is `markdownTextSchema`, so an emphasised body now composes; markup, an image
    // and an out-of-subset item key still refuse.
    for (const extra of ["href", "status", "dateLabel"]) {
      expectRefusal(
        envelope({ type: "steps", items: [{ title: "A", [extra]: "X" }] }),
        "family:unsupported-feature",
      );
    }
    expectRefusal(envelope({ type: "steps", items: "A" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "steps", items: ["A"] }), "family:unsupported-feature");
    const emphasised = composeUnoFoundationSubset(envelope({ type: "steps", items: [{ title: "A", body: "*i*" }] }));
    expect(emphasised.status).toBe("composed");
    if (emphasised.status === "composed") {
      const node = emphasised.document.sections[0];
      expect(node?.module).toBe("content.timeline");
      if (node?.module === "content.timeline") {
        expect(node.props.markdown).toBe(true);
        expect(node.props.items[0]?.description).toBe("*i*");
      }
    }
    expectRefusal(envelope({ type: "steps", items: [{ title: "A", body: "<script>alert(1)</script>" }] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "steps", items: [{ title: "A", body: "![alt](https://example.org/i.png)" }] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "steps", items: [{ title: "**b**" }] }), "family:unsupported-feature");
  });

  it("refuses malformed steps values through the Uno target", () => {
    expectRefusal(envelope({ type: "steps", items: [] }), "family:target-refused");
    const thirteen = Array.from({ length: 13 }, (_, index) => ({ title: `Step ${index + 1}` }));
    expectRefusal(envelope({ type: "steps", items: thirteen }), "family:target-refused");
    expectRefusal(envelope({ type: "steps", items: [{ title: "" }] }), "family:target-refused");
    expectRefusal(envelope({ type: "steps", items: [{ title: "t".repeat(161) }] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "steps", items: [{ title: "A", body: "b".repeat(321) }] }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "steps", items: [{ title: "A" }], surface: "loud" }), "family:target-refused");
  });

  it("refuses the whole Page when a later steps entry is hostile, without running its getter", () => {
    let ran = 0;
    const hostileItem: Record<string, unknown> = {};
    Object.defineProperty(hostileItem, "title", {
      enumerable: true,
      get: () => {
        ran += 1;
        return "A";
      },
    });
    const outcome = composeUnoFoundationSubset({
      version: 1,
      title: "Mixed fixture",
      sections: [
        { type: "quote", body: "A valid leading section." },
        { type: "steps", items: [hostileItem] },
      ],
    });
    expect(outcome.status).toBe("refused");
    if (outcome.status === "refused") expect(outcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(outcome, "document")).toBe(false);
    expect(ran).toBe(0);
  });
});

/** The nine-section fixture with the two newest bounded families appended, in source order. */
function elevenSectionSource(): Record<string, unknown> {
  const source = nineSectionSource();
  const sections = source["sections"] as readonly unknown[];
  return {
    ...source,
    sections: [
      ...sections,
      {
        type: "faq",
        // `UNO-WO-080 / R01`: the composed columns titles are level-3 headings, so this fixture authors the section
        // heading a real donor FAQ carries; that h2 keeps the document outline legal before the columns family.
        heading: "Family questions",
        items: [
          { question: "Where?", answer: "At the selected site." },
          { question: "When?", answer: "During stated hours." },
        ],
      },
      {
        type: "columns",
        ratio: "start-wide",
        items: [
          { title: "What", body: "A short paragraph." },
          { title: "Why", items: ["Plain", "Safe"] },
        ],
      },
    ],
  };
}

describe("composeUnoFoundationSubset — bounded faq and columns", () => {
  it("composes eleven nodes in source order, leaving the first nine byte-identical", () => {
    const nine = composed(nineSectionSource());
    const eleven = composed(elevenSectionSource());
    expect(eleven.sections.length).toBe(11);
    expect(eleven.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
      "family-5-hero",
      "family-6-stats",
      "family-7-steps",
      "family-8-quote",
      "family-9-faq",
      "family-10-columns",
    ]);
    expect(JSON.stringify(eleven.sections.slice(0, 9))).toBe(JSON.stringify(nine.sections));

    const faqWrapper = eleven.sections[9];
    const columns = eleven.sections[10];
    // `UNO-WO-080 / R01`: the fixture authors a FAQ heading so the document outline is legal before the level-3 column
    // titles, so the FAQ family arrives as its documented heading + accordion stack under the same top-level id.
    expect(faqWrapper?.module).toBe("layout.stack");
    expect(columns?.module).toBe("layout.grid");
    if (faqWrapper?.module !== "layout.stack" || columns?.module !== "layout.grid") return;
    expect(faqWrapper.props).toEqual({});
    expect(faqWrapper.children.map((child) => child.id)).toEqual([
      "family-9-faq-heading",
      "family-9-faq-accordion",
    ]);
    const faq = faqWrapper.children[1];
    expect(faq?.module).toBe("interaction.accordion");
    if (faq?.module !== "interaction.accordion") return;

    // Each accordion entry names its own answer child, in the same order, with no extra field or invented default.
    expect(faq.props.items).toEqual([
      { sectionId: "family-9-faq-answer-0", label: "Where?" },
      { sectionId: "family-9-faq-answer-1", label: "When?" },
    ]);
    // The only added key is the closed literal donor-outline switch.
    expect(faq.props.summaryHeadingLevel).toBe(3);
    expect(faq.children.map((child) => child.id)).toEqual(["family-9-faq-answer-0", "family-9-faq-answer-1"]);
    expect(faq.children[0]?.props).toEqual({ text: "At the selected site." });
    expect(faq.children[1]?.props).toEqual({ text: "During stated hours." });

    // One tight stack per authored column, each a level-3 title then a body paragraph or a native list.
    expect(columns.props).toEqual({ columns: 2, ratio: "start-wide" });
    expect(columns.children.map((child) => child.id)).toEqual([
      "family-10-columns-column-0",
      "family-10-columns-column-1",
    ]);
    const first = columns.children[0];
    const second = columns.children[1];
    expect(first?.props).toEqual({ gap: "tight" });
    expect(second?.props).toEqual({ gap: "tight" });
    if (first?.module !== "layout.stack" || second?.module !== "layout.stack") return;
    expect(first.children[0]?.props).toEqual({ text: "What", level: 3 });
    expect(first.children[1]?.props).toEqual({ text: "A short paragraph." });
    expect(second.children[0]?.props).toEqual({ text: "Why", level: 3 });
    expect(second.children[1]?.props).toEqual({ variant: "list", items: [{ label: "Plain" }, { label: "Safe" }] });
  });

  it("freezes nested children, keeps input unchanged, and omits an unauthored ratio", () => {
    const source = elevenSectionSource();
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    const faqWrapper = document.sections[9];
    const columns = document.sections[10];
    if (faqWrapper?.module === "layout.stack") {
      const faq = faqWrapper.children[1];
      if (faq?.module === "interaction.accordion") {
        expect(Object.isFrozen(faq.props.items)).toBe(true);
        expect(Object.isFrozen(faq.children)).toBe(true);
        expect(Object.isFrozen(faq.children[0])).toBe(true);
      }
    }
    if (columns?.module === "layout.grid") {
      expect(Object.isFrozen(columns.children)).toBe(true);
      const stack = columns.children[0];
      expect(Object.isFrozen(stack)).toBe(true);
      if (stack?.module === "layout.stack") expect(Object.isFrozen(stack.children)).toBe(true);
    }

    // A standalone columns family needs an authored level-2 heading before its level-3 titles in the document outline.
    const plain = composed(
      titledEnvelope({
        type: "columns",
        items: [{ title: "One", body: "First." }, { title: "Two", body: "Second." }],
      }),
    );
    const grid = plain.sections[1];
    expect(grid?.props).toEqual({ columns: 2 });
    if (grid?.module === "layout.grid") expect(Object.prototype.hasOwnProperty.call(grid.props, "ratio")).toBe(false);
  });
});

describe("composeUnoFoundationSubset — faq and columns React markup", () => {
  const html = render(composed(elevenSectionSource()));

  it("renders the faq as native disclosures with level-3 question headings and prose answers", () => {
    expect(html).toContain('<div class="uno-json-stack" data-uno-gap="normal" id="family-9-faq">');
    expect(html).toContain('<h2 class="uno-json-heading" id="family-9-faq-heading">Family questions</h2>');
    expect(html).toContain('<div class="uno-json-accordion" id="family-9-faq-accordion">');
    expect((html.match(/<details class="uno-json-disclosure">/gu) ?? []).length).toBe(2);
    expect((html.match(/<summary class="uno-json-disclosure-summary"><h3>/gu) ?? []).length).toBe(2);
    expect(html).toContain('<summary class="uno-json-disclosure-summary"><h3>Where?</h3></summary>');
    expect(html).toContain('<summary class="uno-json-disclosure-summary"><h3>When?</h3></summary>');
    expect(html.indexOf("Where?")).toBeLessThan(html.indexOf("When?"));
    expect(html).toContain('<p class="uno-json-prose" id="family-9-faq-answer-0">At the selected site.</p>');
    expect(html).toContain('<p class="uno-json-prose" id="family-9-faq-answer-1">During stated hours.</p>');
    expect((html.match(/class="uno-json-disclosure-body"/gu) ?? []).length).toBe(2);
    // No invented section heading, form, frame or automatic open state: the disclosure stays the platform's native
    // element, and the only h3 elements are the two authored question labels inside their own summaries.
    expect((html.match(/<h3>/gu) ?? []).length).toBe(2);
    expect((html.match(/<h2 class="uno-json-heading"/gu) ?? []).length).toBe(1);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("open=");
  });

  it("renders the columns as one grid of stacks with headings, a paragraph and a native list", () => {
    expect(html).toContain(
      '<div class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="plain" data-uno-ratio="start-wide" id="family-10-columns">',
    );
    expect((html.match(/class="uno-json-cell"/gu) ?? []).length).toBe(2);
    // Two column stacks inside the grid, plus the FAQ's own authored heading wrapper elsewhere on the Page.
    const columnsRegion = html.slice(html.indexOf('id="family-10-columns"'));
    expect((columnsRegion.match(/class="uno-json-stack"/gu) ?? []).length).toBe(2);
    // `UNO-WO-080 / R01`: the donor column titles are level-3 headings beneath the authored section heading.
    expect((html.match(/<h3 class="uno-json-heading"/gu) ?? []).length).toBe(2);
    expect(html).toContain('<h3 class="uno-json-heading" id="family-10-columns-column-0-title">What</h3>');
    expect(html).toContain('<h3 class="uno-json-heading" id="family-10-columns-column-1-title">Why</h3>');
    expect(html).toContain('<p class="uno-json-prose" id="family-10-columns-column-0-body">A short paragraph.</p>');
    expect(html).toContain(
      '<ul class="uno-json-list" id="family-10-columns-column-1-body"><li><span>Plain</span></li><li><span>Safe</span></li></ul>',
    );
    expect(html.indexOf("Plain")).toBeLessThan(html.indexOf("Safe"));
  });

  it("renders three columns with no ratio attribute at all", () => {
    const three = render(
      composed(
        titledEnvelope({
          type: "columns",
          items: [
            { title: "One", body: "First." },
            { title: "Two", body: "Second." },
            { title: "Three", items: ["Alpha", "Beta", "Gamma"] },
          ],
        }),
      ),
    );
    expect(three).toContain('data-uno-columns="3"');
    expect(three).not.toContain("data-uno-ratio");
    expect((three.match(/class="uno-json-cell"/gu) ?? []).length).toBe(3);
    expect((three.match(/<h3 class="uno-json-heading"/gu) ?? []).length).toBe(3);
    expect(three).not.toContain("<h1");
    expect((three.match(/<main/gu) ?? []).length).toBe(0);
  });

  it("supplies no script, handler or extra heading level from these two families", () => {
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect((html.match(/<h1/gu) ?? []).length).toBe(0);
    expect((html.match(/<main/gu) ?? []).length).toBe(0);
    // Only the authored FAQ heading is a level-2 heading; the six level-3 headings are the two step titles, the two
    // FAQ questions and the two column titles, and no other heading level appears.
    expect((html.match(/<h2 class="uno-json-heading"/gu) ?? []).length).toBe(1);
    expect((html.match(/<h3/gu) ?? []).length).toBe(6);
  });
});

describe("composeUnoFoundationSubset — faq refusal", () => {
  it("refuses faq fields, item states and invalid Markdown outside the bounded subset", () => {
    expectRefusal(envelope({ type: "faq" }), "family:unsupported-feature");
    // `UNO-WO-075 / R01` accepts the optional `heading`/`lede` on `faq` and `UNO-WO-118 / R01` accepts the donor `surface`,
    // so the remaining out-of-subset keys prove the refusal here while the accepted fields are covered elsewhere.
    expectRefusal(
      envelope({ type: "faq", items: [{ question: "Q", answer: "A" }], align: "center" }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "faq", items: [{ question: "Q", answer: "A" }], eyebrow: "L" }),
      "family:unsupported-feature",
    );
    for (const extra of ["href", "open", "icon"]) {
      expectRefusal(
        envelope({ type: "faq", items: [{ question: "Q", answer: "A", [extra]: "X" }] }),
        "family:unsupported-feature",
      );
    }
    expectRefusal(envelope({ type: "faq", items: ["Q"] }), "family:unsupported-feature");
    // A question stays plain text, and an answer must be Markdown the shared reader accepts — never a literal rendering.
    for (const [question, answer] of [
      ["**q**", "A"],
      ["Q", "<script>alert(1)</script>"],
      ["Q", "An ![alt](https://example.org/i.png) image."],
      ["Q", "An **unbalanced answer."],
      ["Q", "[x](javascript:alert(1))"],
      ["Q", "[x](//example.org/protocol-relative)"],
    ] as const) {
      expectRefusal(envelope({ type: "faq", items: [{ question, answer }] }), "family:unsupported-feature");
    }
  });

  it("refuses malformed faq values through the Uno target and keeps the getter count at zero", () => {
    expectRefusal(envelope({ type: "faq", items: [] }), "family:target-refused");
    // `UNO-WO-118 / R01`: the donor ceiling is 24, so nine entries now compose and twenty-five refuse.
    const twentyFive = Array.from({ length: 25 }, (_, index) => ({ question: `Q${index}`, answer: "A" }));
    expectRefusal(envelope({ type: "faq", items: twentyFive }), "family:target-refused");
    expectRefusal(envelope({ type: "faq", items: [{ question: "", answer: "A" }] }), "family:target-refused");
    expectRefusal(envelope({ type: "faq", items: [{ question: "q".repeat(161), answer: "A" }] }), "family:target-refused");
    expectRefusal(envelope({ type: "faq", items: [{ question: "Q", answer: "" }] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "faq", items: [{ question: "Q", answer: "a".repeat(4001) }] }),
      "family:target-refused",
    );

    let ran = 0;
    const hostile: Record<string, unknown> = { answer: "A" };
    Object.defineProperty(hostile, "question", {
      enumerable: true,
      get: () => {
        ran += 1;
        return "Q";
      },
    });
    const outcome = composeUnoFoundationSubset(envelope({ type: "faq", items: [hostile] }));
    expect(outcome.status).toBe("refused");
    if (outcome.status === "refused") expect(outcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(outcome, "document")).toBe(false);
    expect(ran).toBe(0);
  });
});

describe("composeUnoFoundationSubset — columns refusal", () => {

/**
 * `UNO-WO-118 / R01`: the donor FAQ surface as this adapter composes it.
 *
 * The donor carries an optional plain `heading`, a **Markdown** `lede`, the closed `surface` and 1–24 ordered
 * `{question, answer}` items whose answer is Markdown-capable. The 24-item ceiling exceeds the ordinary 1–8 disclosure
 * group, so a longer authored list becomes consecutive ordinary groups — the group bound itself is never raised. Every
 * input that fitted before keeps its byte-identical output.
 */
describe("composeUnoFoundationSubset — faq parity, Markdown and the donor item ceiling", () => {
  const faq = (items: readonly unknown[], extra: Record<string, unknown> = {}) =>
    composed(envelope({ type: "faq", items, ...extra }));
  const items = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ question: `Question ${index}`, answer: `Answer ${index}.` }));

  it("keeps a one-to-eight-item FAQ as one group with its documented identity", () => {
    // No authored text: the family anchor is the group itself, exactly as before.
    for (const count of [1, 8]) {
      const node = faq(items(count)).sections[0];
      expect(node?.module).toBe("interaction.accordion");
      expect(node?.id).toBe("family-0-faq");
      if (node?.module !== "interaction.accordion") continue;
      expect(node.props.items).toEqual(
        items(count).map((item, index) => ({ sectionId: `family-0-faq-answer-${index}`, label: item.question })),
      );
      expect(node.props.summaryHeadingLevel).toBe(3);
      expect(Object.prototype.hasOwnProperty.call(node.props, "surface")).toBe(false);
      expect(node.children.map((child) => child.id)).toEqual(items(count).map((_, index) => `family-0-faq-answer-${index}`));
      // A plain answer keeps the byte-identical escaped paragraph.
      expect(node.children[0]?.props).toEqual({ text: "Answer 0." });
    }
    // Authored heading/lede: the pre-existing heading + lede + accordion stack under the same anchor.
    const wrapped = faq(items(2), { heading: "Questions", lede: "A **bounded** lede." }).sections[0];
    expect(wrapped?.module).toBe("layout.stack");
    if (wrapped?.module !== "layout.stack") return;
    expect(wrapped.children.map((child) => child.id)).toEqual([
      "family-0-faq-heading",
      "family-0-faq-lede",
      "family-0-faq-accordion",
    ]);
    expect(wrapped.children[1]?.props).toEqual({ text: "A **bounded** lede.", markdown: true });
    const group = wrapped.children[2];
    expect(group?.module).toBe("interaction.accordion");
    if (group?.module === "interaction.accordion") {
      expect(group.children.map((child) => child.id)).toEqual([
        "family-0-faq-answer-0",
        "family-0-faq-answer-1",
      ]);
    }
  });
});

  it("refuses crossed column shapes and unsupported column fields", () => {
    expectRefusal(envelope({ type: "columns", items: "A" }), "family:unsupported-feature");
    for (const extra of ["href", "icon", "style", "align"]) {
      expectRefusal(
        envelope({
          type: "columns",
          items: [{ title: "A", body: "B", [extra]: "X" }, { title: "C", body: "D" }],
        }),
        "family:unsupported-feature",
      );
    }
    // A column is a body OR a list: both, or neither, is a crossed shape.
    expectRefusal(
      envelope({
        type: "columns",
        items: [{ title: "A", body: "B", items: ["x"] }, { title: "C", body: "D" }],
      }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "columns", items: [{ title: "A" }, { title: "C", body: "D" }] }),
      "family:unsupported-feature",
    );
    // `UNO-WO-119 / R01`: Markdown in a column *title* and in a *label* stays outside the subset; only the body and the lede
    // are Markdown-capable in the donor.
    expectRefusal(
      envelope({ type: "columns", items: [{ title: "**A**", body: "B" }, { title: "C", body: "D" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "columns", items: [{ title: "A", items: ["[x](https://example.org)"] }, { title: "C", body: "D" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "columns", items: [{ title: "A", items: [1] }, { title: "C", body: "D" }] }),
      "family:unsupported-feature",
    );
    // Nested donor sections and an invented column count stay unsupported rather than reinterpreted.
    expectRefusal(
      envelope({ type: "columns", items: [{ title: "A", body: "B", sections: [] }, { title: "C", body: "D" }] }),
      "family:unsupported-feature",
    );
  });
});

/**
 * `UNO-WO-119 / R01`: the donor Columns family in full — optional plain `heading`, **Markdown** `lede`, closed `surface` and
 * closed `ratio`, two or three ordered columns, each a plain title with one Markdown body or one list of up to twenty-four
 * plain labels. The legacy two-column, body-plus-list shape composes byte-identically; the richer donor fields add the
 * documented wrapper rather than changing any existing node.
 */
describe("composeUnoFoundationSubset — columns parity, Markdown, ratios and the donor label ceiling", () => {
  // A columns family only forms a legal outline with an authored h2 before it (its titles are h3 by the donor's own outline),
  // so every positive case here composes one — the same shape the served fixture uses.
  const columnsPage = (section: unknown) => composed(titledEnvelope(section));
  const columnsNode = (section: unknown) => columnsPage(section).sections[1];
  const pair = (left: Record<string, unknown>, right: Record<string, unknown>) => [left, right];
  const labels = (count: number) => Array.from({ length: count }, (_, index) => `Label ${index + 1}`);
  /** The child sections of a node that carries them, or an empty list for a leaf. */
  const childrenOf = (node: unknown) =>
    node !== null && typeof node === "object" && "children" in node
      ? ((node as { children: readonly UnoSectionNode[] }).children)
      : [];

  it("keeps the legacy plain two-column grid byte-identical, including its authored ratio", () => {
    const node = columnsNode(
      {
        type: "columns",
        ratio: "start-wide",
        items: pair({ title: "Left", body: "The left text." }, { title: "Right", items: ["One", "Two"] }),
      },
    );
    expect(node?.module).toBe("layout.grid");
    expect(node?.id).toBe("family-1-columns");
    if (node?.module !== "layout.grid") return;
    expect(node.props).toEqual({ columns: 2, ratio: "start-wide" });
    expect(node.children.map((child) => child.id)).toEqual(["family-1-columns-column-0", "family-1-columns-column-1"]);
    expect(node.children[0]?.props).toEqual({ gap: "tight" });
    expect(childrenOf(node.children[0]).map((child) => child.props)).toEqual([
      { text: "Left", level: 3 },
      { text: "The left text." },
    ]);
    expect(childrenOf(node.children[1])[1]?.props).toEqual({
      variant: "list",
      items: [{ label: "One" }, { label: "Two" }],
    });
  });

  it("wraps heading, Markdown lede, surface and grid in one surfaced section stack", () => {
    const items = pair(
      { title: "Left", body: "Read [the notes](https://example.org/notes)." },
      { title: "Right", items: ["One"] },
    );
    const node = columnsNode({
      type: "columns",
      heading: "Synthetic columns",
      lede: "Two **authored** columns.",
      surface: "muted",
      ratio: "equal",
      items,
    });
    expect(node?.module).toBe("layout.stack");
    expect(node?.id).toBe("family-1-columns");
    if (node?.module !== "layout.stack") return;
    expect(node.props).toEqual({ surface: "muted" });
    expect(node.children.map((child) => child.id)).toEqual([
      "family-1-columns-heading",
      "family-1-columns-lede",
      "family-1-columns-grid",
    ]);
    expect(node.children[0]?.props).toEqual({ text: "Synthetic columns", level: 2 });
    expect(node.children[1]?.props).toEqual({ text: "Two **authored** columns.", markdown: true });
    const grid = node.children[2];
    expect(grid?.module).toBe("layout.grid");
    if (grid?.module !== "layout.grid") return;
    expect(grid.props).toEqual({ columns: 2, ratio: "equal" });
    // A Markdown body is one Markdown prose child; a plain body stays the byte-identical escaped paragraph.
    expect(childrenOf(grid.children[0])[1]?.props).toEqual({
      text: "Read [the notes](https://example.org/notes).",
      markdown: true,
    });
    // The composed Page re-reads byte-identically through the strict reader, surface and all.
    const reread = readUnoPageDocument(columnsPage({
      type: "columns",
      heading: "Synthetic columns",
      lede: "Two **authored** columns.",
      surface: "muted",
      ratio: "equal",
      items,
    }));
    expect(reread.accepted).toBe(true);
  });

  it("keeps up to twenty-four labels as consecutive native lists and refuses the twenty-fifth", () => {
    // `UNO-WO-119 / R01`: the donor's 24-label ceiling exceeds the native 12-item list bound, so a longer list composes as
    // consecutive native lists of at most twelve — same column, same order, plain list semantics, no global cap change.
    for (const count of [1, 12, 13, 24]) {
      const node = columnsNode({
        type: "columns",
        items: pair({ title: "A", body: "B" }, { title: "C", items: labels(count) }),
      });
      if (node?.module !== "layout.grid") throw new Error("expected the legacy grid");
      const lists = childrenOf(node.children[1]).filter((child) => child.module === "content.prose");
      expect(lists.length).toBe(count > 12 ? 2 : 1);
      const flattened = lists.flatMap((list) =>
        list.module === "content.prose" && list.props.variant === "list"
          ? list.props.items.map((item: { label: string }) => item.label)
          : [],
      );
      expect(flattened).toEqual(labels(count));
      expect(lists[0]?.id).toBe("family-1-columns-column-1-body");
      if (lists.length === 2) expect(lists[1]?.id).toBe("family-1-columns-column-1-body-2");
    }
    expectRefusal(
      titledEnvelope({ type: "columns", items: pair({ title: "A", body: "B" }, { title: "C", items: labels(25) }) }),
      "family:target-refused",
    );
    expectRefusal(
      titledEnvelope({ type: "columns", items: pair({ title: "A", body: "B" }, { title: "C", items: [] }) }),
      "family:target-refused",
    );
  });

  it("validates the closed ratio for three columns and suppresses only its layout effect", () => {
    const three = columnsNode({
      type: "columns",
      ratio: "start-wide",
      items: [
        { title: "A", body: "B" },
        { title: "C", body: "D" },
        { title: "E", body: "F" },
      ],
    });
    expect(three?.module).toBe("layout.grid");
    if (three?.module !== "layout.grid") return;
    // Valid and validated, but deliberately without a layout effect: the donor lays three columns out equally.
    expect(three.props).toEqual({ columns: 3 });
    expect(Object.prototype.hasOwnProperty.call(three.props, "ratio")).toBe(false);
    // The value itself is still closed: an out-of-set ratio refuses for two *and* three columns.
    expectRefusal(
      titledEnvelope({
        type: "columns",
        ratio: "wide",
        items: [
          { title: "A", body: "B" },
          { title: "C", body: "D" },
          { title: "E", body: "F" },
        ],
      }),
      "family:target-refused",
    );
  });

  it("renders the surfaced section, the Markdown body and both label lists as native markup", () => {
    const html = render(
      columnsPage({
        type: "columns",
        heading: "Synthetic columns",
        lede: "Two **authored** columns.",
        surface: "muted",
        ratio: "end-wide",
        items: pair(
          { title: "Left", body: "Read [the notes](https://example.org/notes)." },
          { title: "Right", items: labels(13) },
        ),
      }),
    );
    expect(html).toContain(
      '<div class="uno-json-stack" data-uno-gap="normal" data-uno-surface="muted" id="family-1-columns">',
    );
    expect(html).toContain('<h2 class="uno-json-heading" id="family-1-columns-heading">Synthetic columns</h2>');
    expect(html).toContain('<strong class="uno-family-md-strong">authored</strong>');
    expect(html).toContain(
      '<div class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="plain" data-uno-ratio="end-wide" id="family-1-columns-grid">',
    );
    expect(html).toContain(
      '<a class="uno-family-md-link" href="https://example.org/notes" rel="noopener noreferrer">the notes</a>',
    );
    expect((html.match(/<ul class="uno-json-list"/gu) ?? []).length).toBe(2);
    expect((html.match(/<li>/gu) ?? []).length).toBe(13);
    expect(html.indexOf("Label 1<") < html.indexOf("Label 13<")).toBe(true);
    expect((html.match(/<h3 class="uno-json-heading"/gu) ?? []).length).toBe(2);
    expect(html).not.toContain("<button");
  });
});


describe("composeUnoFoundationSubset — columns target bounds and hostile source", () => {
  it("refuses column counts and ratios outside the two-or-three subset", () => {
    expectRefusal(envelope({ type: "columns", items: [] }), "family:target-refused");
    expectRefusal(envelope({ type: "columns", items: [{ title: "A", body: "B" }] }), "family:target-refused");
    const four = Array.from({ length: 4 }, (_, index) => ({ title: `T${index}`, body: "B" }));
    expectRefusal(envelope({ type: "columns", items: four }), "family:target-refused");
    expectRefusal(
      envelope({ type: "columns", ratio: "wide", items: [{ title: "A", body: "B" }, { title: "C", body: "D" }] }),
      "family:target-refused",
    );
  });

  it("refuses malformed titles, bodies and labels through the Uno target", () => {
    const pair = (first: Record<string, unknown>) => envelope({ type: "columns", items: [first, { title: "C", body: "D" }] });
    expectRefusal(pair({ title: "", body: "B" }), "family:target-refused");
    expectRefusal(pair({ title: "t".repeat(161), body: "B" }), "family:target-refused");
    expectRefusal(pair({ title: "A", body: "" }), "family:target-refused");
    expectRefusal(pair({ title: "A", body: "b".repeat(4001) }), "family:target-refused");
    expectRefusal(pair({ title: "A", items: [] }), "family:target-refused");
    expectRefusal(pair({ title: "A", items: Array.from({ length: 13 }, (_, index) => `L${index}`) }), "family:target-refused");
    expectRefusal(pair({ title: "A", items: [""] }), "family:target-refused");
    expectRefusal(pair({ title: "A", items: ["l".repeat(161)] }), "family:target-refused");
  });

  it("refuses the whole Page for hostile or sparse column source, with no getter invoked", () => {
    let ran = 0;
    const hostileColumn: Record<string, unknown> = { body: "B" };
    Object.defineProperty(hostileColumn, "title", {
      enumerable: true,
      get: () => {
        ran += 1;
        return "A";
      },
    });
    const outcome = composeUnoFoundationSubset(
      envelope({ type: "columns", items: [hostileColumn, { title: "C", body: "D" }] }),
    );
    expect(outcome.status).toBe("refused");
    if (outcome.status === "refused") expect(outcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(outcome, "document")).toBe(false);
    expect(ran).toBe(0);

    const sparse: unknown[] = [{ title: "A", body: "B" }, , { title: "C", body: "D" }];
    expectRefusal(envelope({ type: "columns", items: sparse }), "family:unsafe-source");

    // A valid leading FAQ followed by a bad column refuses the WHOLE Page: no partially composed document survives.
    const mixed = composeUnoFoundationSubset({
      version: 1,
      title: "Mixed fixture",
      sections: [
        { type: "faq", items: [{ question: "Q", answer: "A" }] },
        { type: "columns", items: [{ title: "A", body: "B" }] },
      ],
    });
    expect(mixed.status).toBe("refused");
    if (mixed.status === "refused") expect(mixed.reason).toBe("family:target-refused");
    expect(Object.prototype.hasOwnProperty.call(mixed, "document")).toBe(false);
  });
});

/** The eleven-section fixture with the two newest bounded families appended, in source order. */
function thirteenSectionSource(): Record<string, unknown> {
  const source = elevenSectionSource();
  const sections = source["sections"] as readonly unknown[];
  return {
    ...source,
    sections: [
      ...sections,
      {
        type: "cards",
        columns: 2,
        items: [
          { title: "First card", body: "Description." },
          { title: "Second card" },
        ],
      },
      {
        type: "features",
        columns: 3,
        items: [
          { title: "First feature", body: "Benefit." },
          { title: "Second feature" },
        ],
      },
    ],
  };
}

describe("composeUnoFoundationSubset — bounded cards and features", () => {
  it("composes thirteen nodes in source order, leaving the first eleven byte-identical", () => {
    const eleven = composed(elevenSectionSource());
    const thirteen = composed(thirteenSectionSource());
    expect(thirteen.sections.length).toBe(13);
    expect(thirteen.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
      "family-5-hero",
      "family-6-stats",
      "family-7-steps",
      "family-8-quote",
      "family-9-faq",
      "family-10-columns",
      "family-11-cards",
      "family-12-features",
    ]);
    expect(JSON.stringify(thirteen.sections.slice(0, 11))).toBe(JSON.stringify(eleven.sections));

    const cards = thirteen.sections[11];
    const features = thirteen.sections[12];
    expect(cards?.module).toBe("layout.grid");
    expect(features?.module).toBe("layout.grid");
    if (cards?.module !== "layout.grid" || features?.module !== "layout.grid") return;

    // Native list-grid semantics only: no article wrapper, no ratio, no invented card decoration.
    expect(cards.props).toEqual({ columns: 2, itemSemantics: "list" });
    expect(features.props).toEqual({ columns: 3, itemSemantics: "list" });

    expect(cards.children.map((child) => child.id)).toEqual([
      "family-11-cards-item-0",
      "family-11-cards-item-1",
    ]);
    const firstCard = cards.children[0];
    const secondCard = cards.children[1];
    if (firstCard?.module !== "layout.stack" || secondCard?.module !== "layout.stack") return;
    expect(firstCard.props).toEqual({ gap: "tight" });
    expect(firstCard.children.map((child) => child.id)).toEqual([
      "family-11-cards-item-0-title",
      "family-11-cards-item-0-body",
    ]);
    expect(firstCard.children[0]?.props).toEqual({ text: "First card", level: 2 });
    expect(firstCard.children[1]?.props).toEqual({ text: "Description." });
    // An absent body stays absent: one title child only, no manufactured paragraph.
    expect(secondCard.children.map((child) => child.id)).toEqual(["family-11-cards-item-1-title"]);
    expect(secondCard.children[0]?.props).toEqual({ text: "Second card", level: 2 });

    expect(features.children.map((child) => child.id)).toEqual([
      "family-12-features-item-0",
      "family-12-features-item-1",
    ]);
    const firstFeature = features.children[0];
    const secondFeature = features.children[1];
    if (firstFeature?.module !== "layout.stack" || secondFeature?.module !== "layout.stack") return;
    expect(firstFeature.children.map((child) => child.id)).toEqual([
      "family-12-features-item-0-title",
      "family-12-features-item-0-body",
    ]);
    expect(firstFeature.children[1]?.props).toEqual({ text: "Benefit." });
    expect(secondFeature.children.length).toBe(1);
    expect(secondFeature.children[0]?.props).toEqual({ text: "Second feature", level: 2 });
  });

  it("freezes every nested grid, item and props object, keeps input unchanged and re-accepts both forms", () => {
    const source = thirteenSectionSource();
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    for (const section of document.sections.slice(11)) {
      expect(Object.isFrozen(section)).toBe(true);
      expect(Object.isFrozen(section.props)).toBe(true);
      if (section.module !== "layout.grid") continue;
      expect(Object.isFrozen(section.children)).toBe(true);
      for (const stack of section.children) {
        expect(Object.isFrozen(stack)).toBe(true);
        if (stack.module !== "layout.stack") continue;
        expect(Object.isFrozen(stack.children)).toBe(true);
        for (const child of stack.children) expect(Object.isFrozen(child.props)).toBe(true);
      }
    }
    expect(() => readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown)).not.toThrow();
    expect(() => readUnoPageDocument(JSON.stringify(document))).not.toThrow();
  });
});

/**
 * The markup of one grid, sliced from its own `<ul>` by id, so older list, timeline, accordion and columns markup
 * cannot inflate the counts.
 */
function gridMarkup(html: string, id: string): string {
  const marker = `id="${id}"`;
  const idIndex = html.indexOf(marker);
  expect(idIndex).toBeGreaterThanOrEqual(0);
  const start = html.lastIndexOf("<ul ", idIndex);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = html.indexOf("</ul>", idIndex);
  expect(end).toBeGreaterThan(start);
  return html.slice(start, end + "</ul>".length);
}

describe("composeUnoFoundationSubset — cards and features React markup", () => {
  const html = render(composed(thirteenSectionSource()));
  const cards = gridMarkup(html, "family-11-cards");
  const features = gridMarkup(html, "family-12-features");

  it("renders each card as one native list item of a native list-grid", () => {
    expect(cards).toContain(
      '<ul class="uno-json-grid" data-uno-columns="2" data-uno-item-semantics="list" id="family-11-cards" role="list">',
    );
    expect((cards.match(/<li class="uno-json-cell"/gu) ?? []).length).toBe(2);
    expect((cards.match(/class="uno-json-stack"/gu) ?? []).length).toBe(2);
    expect((cards.match(/<h2 class="uno-json-heading"/gu) ?? []).length).toBe(2);
    expect((cards.match(/<p class="uno-json-prose"/gu) ?? []).length).toBe(1);
    expect(cards).toContain('<h2 class="uno-json-heading" id="family-11-cards-item-0-title">First card</h2>');
    expect(cards).toContain('<h2 class="uno-json-heading" id="family-11-cards-item-1-title">Second card</h2>');
    expect(cards).toContain('<p class="uno-json-prose" id="family-11-cards-item-0-body">Description.</p>');
    // The card authored without a body gains no paragraph of its own.
    expect(cards).not.toContain("family-11-cards-item-1-body");
    expect(cards.indexOf("First card")).toBeLessThan(cards.indexOf("Second card"));
  });

  it("renders each feature the same bounded way with its authored three columns", () => {
    expect(features).toContain(
      '<ul class="uno-json-grid" data-uno-columns="3" data-uno-item-semantics="list" id="family-12-features" role="list">',
    );
    expect((features.match(/<li class="uno-json-cell"/gu) ?? []).length).toBe(2);
    expect((features.match(/<h2 class="uno-json-heading"/gu) ?? []).length).toBe(2);
    expect((features.match(/<p class="uno-json-prose"/gu) ?? []).length).toBe(1);
    expect(features).toContain('<p class="uno-json-prose" id="family-12-features-item-0-body">Benefit.</p>');
    expect(features).not.toContain("family-12-features-item-1-body");
    expect(features.indexOf("First feature")).toBeLessThan(features.indexOf("Second feature"));
  });

  it("invents no link, image, icon, action, meta text, extra heading or handler", () => {
    for (const markup of [cards, features]) {
      expect(markup).not.toContain("<a ");
      expect(markup).not.toContain("<img");
      expect(markup).not.toContain("<iframe");
      expect(markup).not.toContain("<button");
      expect(markup).not.toContain("onclick");
      expect(markup).not.toContain("<h3");
      expect((markup.match(/<h1/gu) ?? []).length).toBe(0);
    }
    expect((html.match(/<main/gu) ?? []).length).toBe(0);
  });

  it("escapes ampersands and quotes and renders an inert angle bracket as text", () => {
    const escaped = render(
      composed(
        envelope({
          type: "cards",
          columns: 2,
          items: [{ title: 'A & B "quoted" < 3', body: "Safe & sound." }],
        }),
      ),
    );
    expect(escaped).toContain("A &amp; B &quot;quoted&quot; &lt; 3");
    expect(escaped).toContain("Safe &amp; sound.");
    expect(() =>
      composed(
        envelope({
          type: "features",
          columns: 2,
          items: [{ title: "<script>alert(1)</script>" }],
        }),
      ),
    ).toThrow();
  });
});

describe("composeUnoFoundationSubset — cards and features refusal", () => {
  it.each(["cards", "features"] as const)("refuses %s fields outside the bounded subset", (type) => {
    const base = { type, items: [{ title: "A", body: "B" }] };
    // `columns` is required here even though the donor renderer defaults an omitted value.
    expectRefusal(envelope(base), "family:unsupported-feature");
    // `UNO-WO-070 / R01` accepts the donor's optional authored `heading`, and `UNO-WO-071 / R01` its optional authored
    // `lede`, so neither is an extra key; both are proved by their own dedicated sections below.
    for (const extra of ["surface", "align", "ratio", "href", "route", "link", "style", "onClick", "visibility"]) {
      expectRefusal(
        envelope({ ...base, columns: 2, [extra]: extra === "align" ? "center" : "X" }),
        "family:unsupported-feature",
      );
    }
    for (const extra of ["image", "meta", "action", "icon", "href", "route", "link", "style", "onClick"]) {
      expectRefusal(
        envelope({ type, columns: 2, items: [{ title: "A", [extra]: "X" }] }),
        "family:unsupported-feature",
      );
    }
    expectRefusal(envelope({ type, columns: 2, items: ["A"] }), "family:unsupported-feature");
    expectRefusal(envelope({ type, columns: 2, items: "A" }), "family:unsupported-feature");
    expectRefusal(envelope({ type, columns: 2, items: [{ title: 5 }] }), "family:unsupported-feature");
    expectRefusal(envelope({ type, columns: 2, items: [{ title: "A", body: 5 }] }), "family:unsupported-feature");
    for (const [field, value] of [
      ["title", "**bold**"],
      ["title", "*italic*"],
      ["title", "[x](https://example.org)"],
      ["title", "`code`"],
      ["title", "~~strike~~"],
      ["title", "![alt](https://example.org/i.png)"],
      ["title", "- item"],
      ["body", "**bold**"],
      ["body", "[x](https://example.org)"],
    ] as const) {
      expectRefusal(
        envelope({ type, columns: 2, items: [{ title: "A", body: "B", [field]: value }] }),
        "family:unsupported-feature",
      );
    }
  });

  it.each(["cards", "features"] as const)("refuses malformed %s values through the Uno target", (type) => {
    const items = [{ title: "A", body: "B" }];
    for (const columns of [1, 5, 0]) {
      expectRefusal(envelope({ type, columns, items }), "family:target-refused");
    }
    expectRefusal(envelope({ type, columns: "2", items }), "family:target-refused");
    expectRefusal(envelope({ type, columns: 2, items: [] }), "family:target-refused");
    const nine = Array.from({ length: 9 }, (_, index) => ({ title: `T${index}` }));
    expectRefusal(envelope({ type, columns: 2, items: nine }), "family:target-refused");
    expectRefusal(envelope({ type, columns: 2, items: [{ title: "" }] }), "family:target-refused");
    expectRefusal(envelope({ type, columns: 2, items: [{ title: "t".repeat(161) }] }), "family:target-refused");
    expectRefusal(envelope({ type, columns: 2, items: [{ title: "A", body: "" }] }), "family:target-refused");
    expectRefusal(
      envelope({ type, columns: 2, items: [{ title: "A", body: "b".repeat(4001) }] }),
      "family:target-refused",
    );
    expectRefusal(
      envelope({ type, columns: 2, items: [{ title: "A", body: "<script>alert(1)</script>" }] }),
      "family:target-refused",
    );
  });

  it("refuses a candidate above the Uno 64 KiB text cap rather than truncating it", () => {
    const bulky = {
      version: 1,
      title: "Oversized fixture",
      sections: [
        { type: "cards", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
        { type: "features", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
      ],
    };
    expectRefusal(bulky, "family:target-refused");
  });

  it("refuses hostile card and feature source with no getter invoked and no partial Page", () => {
    let ran = 0;
    const hostileItem: Record<string, unknown> = { body: "B" };
    Object.defineProperty(hostileItem, "title", {
      enumerable: true,
      get: () => {
        ran += 1;
        return "A";
      },
    });
    const outcome = composeUnoFoundationSubset(envelope({ type: "cards", columns: 2, items: [hostileItem] }));
    expect(outcome.status).toBe("refused");
    if (outcome.status === "refused") expect(outcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(outcome, "document")).toBe(false);
    expect(ran).toBe(0);

    const sparse: unknown[] = [{ title: "A" }, , { title: "C" }];
    expectRefusal(envelope({ type: "features", columns: 2, items: sparse }), "family:unsafe-source");

    // A valid leading `cards` followed by a hostile `features` item refuses the WHOLE Page.
    const mixed = composeUnoFoundationSubset({
      version: 1,
      title: "Mixed fixture",
      sections: [
        { type: "cards", columns: 2, items: [{ title: "A", body: "B" }] },
        { type: "features", columns: 2, items: [{ title: "C" }, hostileItem] },
      ],
    });
    expect(mixed.status).toBe("refused");
    if (mixed.status === "refused") expect(mixed.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(mixed, "document")).toBe(false);
    expect(ran).toBe(0);
  });
});

/** The thirteen-section fixture with the new bounded `actions` family appended at source index 13. */
function fourteenSectionSource(): Record<string, unknown> {
  const source = thirteenSectionSource();
  const sections = source["sections"] as readonly unknown[];
  return {
    ...source,
    sections: [
      ...sections,
      {
        type: "actions",
        actions: [
          { label: "Read the introduction", href: "#family-0-prose" },
          { label: "Explore features", href: "#family-12-features" },
        ],
      },
    ],
  };
}

describe("composeUnoFoundationSubset — bounded actions", () => {
  it("composes fourteen nodes in source order, leaving the first thirteen byte-identical", () => {
    const thirteen = composed(thirteenSectionSource());
    const fourteen = composed(fourteenSectionSource());
    expect(fourteen.sections.length).toBe(14);
    expect(fourteen.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
      "family-5-hero",
      "family-6-stats",
      "family-7-steps",
      "family-8-quote",
      "family-9-faq",
      "family-10-columns",
      "family-11-cards",
      "family-12-features",
      "family-13-actions",
    ]);
    expect(JSON.stringify(fourteen.sections.slice(0, 13))).toBe(JSON.stringify(thirteen.sections));

    // Exactly one `content.actions` node, with only the authored labels and their literal targets.
    expect(fourteen.sections[13]).toEqual({
      id: "family-13-actions",
      module: "content.actions",
      props: {
        items: [
          { label: "Read the introduction", targetId: "family-0-prose" },
          { label: "Explore features", targetId: "family-12-features" },
        ],
      },
    });
    // No synthesized route, href passthrough, variant or second destination was added beside the target id.
    expect(JSON.stringify(fourteen.sections[13])).not.toContain("variant");
    expect(JSON.stringify(fourteen.sections[13])).not.toContain("href");
  });

  it("accepts a forward reference to a later top-level section and the one/eight item bounds", () => {
    const forward = composed({
      version: 1,
      title: "Forward fixture",
      sections: [
        { type: "actions", actions: [{ label: "Go on", href: "#family-1-prose" }] },
        { type: "prose", body: "The destination." },
      ],
    });
    expect(forward.sections.map((section) => section.id)).toEqual(["family-0-actions", "family-1-prose"]);
    expect(forward.sections[0]?.props).toEqual({ items: [{ label: "Go on", targetId: "family-1-prose" }] });

    const eight = Array.from({ length: 8 }, (_, index) => ({
      label: `Action ${index}`,
      href: "#family-0-actions",
    }));
    const bounded = composed(envelope({ type: "actions", actions: eight }));
    expect(bounded.sections).toHaveLength(1);
    const only = bounded.sections[0];
    if (only?.module !== "content.actions") return;
    expect(only.props.items).toHaveLength(8);
  });

  it("keeps the caller's input unchanged, freezes nested items and re-accepts object and JSON text", () => {
    const source = fourteenSectionSource();
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    const actions = document.sections[13];
    expect(actions === undefined ? false : Object.isFrozen(actions)).toBe(true);
    if (actions?.module !== "content.actions") return;
    expect(Object.isFrozen(actions.props)).toBe(true);
    expect(Object.isFrozen(actions.props.items)).toBe(true);
    for (const item of actions.props.items) expect(Object.isFrozen(item)).toBe(true);
    expect(() => readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown)).not.toThrow();
    expect(() => readUnoPageDocument(JSON.stringify(document))).not.toThrow();
  });
});

describe("composeUnoFoundationSubset — actions React markup", () => {
  const html = render(composed(fourteenSectionSource()));
  const idIndex = html.indexOf('id="family-13-actions"');
  const start = html.lastIndexOf("<ul ", idIndex);
  const end = html.indexOf("</ul>", idIndex);
  const markup = start >= 0 && end > start ? html.slice(start, end + "</ul>".length) : "";

  it("renders one native anchor per authored action, in order, to real section ids", () => {
    expect(idIndex).toBeGreaterThanOrEqual(0);
    expect(markup.startsWith('<ul class="uno-json-actions" id="family-13-actions">')).toBe(true);
    expect((markup.match(/<li class="uno-json-action-item">/gu) ?? []).length).toBe(2);
    expect((markup.match(/<a class="uno-json-action" /gu) ?? []).length).toBe(2);
    expect(markup).toContain('<a class="uno-json-action" href="#family-0-prose">Read the introduction</a>');
    expect(markup).toContain('<a class="uno-json-action" href="#family-12-features">Explore features</a>');
    expect(markup.indexOf("Read the introduction")).toBeLessThan(markup.indexOf("Explore features"));
    // Every fragment must land on an id that really exists in this document.
    for (const target of ["family-0-prose", "family-12-features"]) {
      expect(html).toContain(`id="${target}"`);
    }
  });

  it("emits no external, routed, mailed or scripted destination and no invented attribute", () => {
    expect(markup).not.toContain("http");
    expect(markup).not.toContain("mailto:");
    expect(markup).not.toContain("tel:");
    expect(markup).not.toContain("iframe");
    expect(markup).not.toContain("target=");
    expect(markup).not.toContain("rel=");
    expect(markup).not.toContain("download");
    expect(markup).not.toContain("onclick");
    expect(markup).not.toContain("<script");
    expect((markup.match(/<a /gu) ?? []).length).toBe(2);
  });

  it("escapes ampersands and quotes in a label and renders an inert angle bracket as text", () => {
    const escaped = render(
      composed(
        envelope({
          type: "actions",
          actions: [{ label: 'A & B "quoted" < 3', href: "#family-0-actions" }],
        }),
      ),
    );
    expect(escaped).toContain('>A &amp; B &quot;quoted&quot; &lt; 3</a>');
    expect(() =>
      composed(
        envelope({
          type: "actions",
          actions: [{ label: "<script>alert(1)</script>", href: "#family-0-actions" }],
        }),
      ),
    ).toThrow();
  });
});

describe("composeUnoFoundationSubset — actions refusals", () => {
  const ok = [{ label: "Go", href: "#family-0-actions" }];

  it("refuses donor action fields and destination forms outside the same-document subset", () => {
    expectRefusal(envelope({ type: "actions" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "actions", actions: "Go" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "actions", actions: ["Go"] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "actions", actions: [{ href: "#family-0-actions" }] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "actions", actions: [{ label: "Go" }] }), "family:unsupported-feature");
    for (const entryExtra of ["variant", "route", "link", "target", "rel", "download", "onClick", "style"]) {
      expectRefusal(
        envelope({ type: "actions", actions: [{ label: "Go", href: "#family-0-actions", [entryExtra]: "X" }] }),
        "family:unsupported-feature",
      );
    }
    for (const sectionExtra of ["heading", "lede", "align", "surface", "links", "visibility"]) {
      expectRefusal(envelope({ type: "actions", actions: ok, [sectionExtra]: "X" }), "family:unsupported-feature");
    }
    expectRefusal(
      envelope({ type: "actions", actions: [{ label: 5, href: "#family-0-actions" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(envelope({ type: "actions", actions: [{ label: "Go", href: 5 }] }), "family:unsupported-feature");
    for (const label of ["**bold**", "*italic*", "[x](https://example.org)", "`code`"]) {
      expectRefusal(
        envelope({ type: "actions", actions: [{ label, href: "#family-0-actions" }] }),
        "family:unsupported-feature",
      );
    }
    // Valid to the donor, but not expressible as a same-document fragment here.
    for (const href of [
      "https://example.org",
      "/contact",
      "mailto:hello@example.org",
      "tel:+61123456789",
      "#link:foo",
      "#other",
      "#family-%30-prose",
      "#family-0-prose ",
      "#family-0-prose?x=1",
    ]) {
      expectRefusal(envelope({ type: "actions", actions: [{ label: "Go", href }] }), "family:unsupported-feature");
    }
  });

  it("refuses unresolvable, nested, blank or oversized action targets through the Uno target", () => {
    expectRefusal(envelope({ type: "actions", actions: [] }), "family:target-refused");
    const nine = Array.from({ length: 9 }, (_, index) => ({ label: `A${index}`, href: "#family-0-actions" }));
    expectRefusal(envelope({ type: "actions", actions: nine }), "family:target-refused");
    for (const label of ["", "   ", "t".repeat(161), "<script>alert(1)</script>"]) {
      expectRefusal(
        envelope({ type: "actions", actions: [{ label, href: "#family-0-actions" }] }),
        "family:target-refused",
      );
    }
    for (const href of ["#family-99-prose", "#family-0-hero", "#family-1-actions"]) {
      expectRefusal(envelope({ type: "actions", actions: [{ label: "Go", href }] }), "family:target-refused");
    }
    // A nested generated child id exists in the output but is NOT a top-level section, so it must refuse. The authored
    // heading keeps the columns family's level-3 titles inside a legal document outline.
    const nestedSource = {
      version: 1,
      title: "Nested target fixture",
      sections: [
        { type: "prose", heading: "Section heading", body: "Section body." },
        { type: "columns", items: [{ title: "Left", body: "L" }, { title: "Right", body: "R" }] },
        { type: "actions", actions: [{ label: "Nested", href: "#family-1-columns-column-0" }] },
      ],
    };
    // The nested id really does exist in a composed columns document, so only the top-level equality guard can refuse.
    const composedColumns = composed({
      version: 1,
      title: "Nested id evidence",
      sections: [
        { type: "prose", heading: "Section heading", body: "Section body." },
        { type: "columns", items: [{ title: "Left", body: "L" }, { title: "Right", body: "R" }] },
      ],
    });
    expect(JSON.stringify(composedColumns)).toContain('"family-1-columns-column-0"');
    expectRefusal(nestedSource, "family:target-refused");
  });

  it("refuses a candidate above the Uno 64 KiB text cap rather than truncating it", () => {
    const bulky = {
      version: 1,
      title: "Oversized action fixture",
      sections: [
        { type: "cards", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
        { type: "features", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
        { type: "actions", actions: [{ label: "Go", href: "#family-0-cards" }] },
      ],
    };
    expectRefusal(bulky, "family:target-refused");
  });

  it("refuses hostile action source with no getter invoked and no partial Page", () => {
    let ran = 0;
    const labelEntry: Record<string, unknown> = { href: "#family-0-actions" };
    Object.defineProperty(labelEntry, "label", {
      enumerable: true,
      get: () => {
        ran += 1;
        return "Go";
      },
    });
    const labelOutcome = composeUnoFoundationSubset(envelope({ type: "actions", actions: [labelEntry] }));
    expect(labelOutcome.status).toBe("refused");
    if (labelOutcome.status === "refused") expect(labelOutcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(labelOutcome, "document")).toBe(false);
    expect(ran).toBe(0);

    const hrefEntry: Record<string, unknown> = { label: "Go" };
    Object.defineProperty(hrefEntry, "href", {
      enumerable: true,
      get: () => {
        ran += 1;
        return "#family-0-actions";
      },
    });
    const hrefOutcome = composeUnoFoundationSubset(envelope({ type: "actions", actions: [hrefEntry] }));
    expect(hrefOutcome.status).toBe("refused");
    if (hrefOutcome.status === "refused") expect(hrefOutcome.reason).toBe("family:unsafe-source");
    expect(ran).toBe(0);

    const sparse: unknown[] = [{ label: "A", href: "#family-0-actions" }, , { label: "C", href: "#family-0-actions" }];
    expectRefusal(envelope({ type: "actions", actions: sparse }), "family:unsafe-source");

    // One valid prose followed by hostile actions refuses the WHOLE Page with no partial content.
    const mixed = composeUnoFoundationSubset({
      version: 1,
      title: "Mixed action fixture",
      sections: [
        { type: "prose", body: "Kept?" },
        { type: "actions", actions: [{ label: "A", href: "#family-0-prose" }, labelEntry] },
      ],
    });
    expect(mixed.status).toBe("refused");
    if (mixed.status === "refused") expect(mixed.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(mixed, "document")).toBe(false);
    expect(ran).toBe(0);
  });
});

/** One supported donor media section, at any source index. */
const FIFTEEN_MEDIA_SECTION = {
  type: "media",
  image: { src: "/assets/portrait.png", alt: "Author-described portrait" },
  caption: "Author caption",
};

/** The fourteen-section fixture plus the new bound `media` family at source index 14. */
function fifteenSectionSource(): Record<string, unknown> {
  const source = fourteenSectionSource();
  const sections = source["sections"] as readonly unknown[];
  return { ...source, sections: [...sections, FIFTEEN_MEDIA_SECTION] };
}

/** One valid migration binding for the media fixture above. */
function portraitBinding(): Record<string, unknown> {
  return { images: [{ source: "/assets/portrait.png", owned: { zone: "page", path: "images/portrait.png" } }] };
}

/** One supported donor gallery section: two ordered described images with an explicit authored column count. */
const GALLERY_SECTION = {
  type: "gallery",
  columns: 3,
  items: [
    { image: { src: "/assets/portrait.png", alt: "Portrait by the author" }, caption: "First caption" },
    { image: { src: "/assets/scene.webp", alt: "Described scene" } },
  ],
};

/** The fifteen-section fixture plus the new bound `gallery` family at source index 15. */
function sixteenSectionSource(): Record<string, unknown> {
  const source = fifteenSectionSource();
  const sections = source["sections"] as readonly unknown[];
  return { ...source, sections: [...sections, GALLERY_SECTION] };
}

/** One valid migration binding covering every image the sixteen-section fixture consumes. */
function galleryBinding(): Record<string, unknown> {
  return {
    images: [
      { source: "/assets/portrait.png", owned: { zone: "page", path: "images/portrait.png" } },
      { source: "/assets/scene.webp", owned: { zone: "theme", path: "gallery/scene.webp" } },
    ],
  };
}
/** One supported donor contact section: an intent reference only, never a destination. */
const CONTACT_SECTION = { type: "contactForm", formRef: "sales-inquiry" };

/** The sixteen-section fixture plus the newly mapped `contactForm` family at source index 16. */
function seventeenSectionSource(): Record<string, unknown> {
  const source = sixteenSectionSource();
  const sections = source["sections"] as readonly unknown[];
  return { ...source, sections: [...sections, CONTACT_SECTION] };
}

/** The separate migration acknowledgement for that reference: consent to an inert notice, never delivery. */
function contactBinding(formRef = "sales-inquiry"): Record<string, unknown> {
  return { contactForms: [{ formRef, mode: "delivery-off" }] };
}

/** One combined binder covering the images and the acknowledgement the seventeen-section fixture needs. */
function combinedBinding(): Record<string, unknown> {
  return {
    images: galleryBinding()["images"],
    contactForms: contactBinding()["contactForms"],
  };
}

/** One contact-only source, so a single contact notice can be asserted in isolation. */
function contactOnlySource(): Record<string, unknown> {
  return { version: 1, title: "Contact-only", sections: [CONTACT_SECTION] };
}


describe("composeUnoFoundationSubset — explicitly bound media", () => {
  it("composes fifteen nodes and keeps the first fourteen byte-identical", () => {
    const fourteen = composed(fourteenSectionSource());
    const fifteen = composed(fifteenSectionSource(), portraitBinding());
    expect(fifteen.sections.length).toBe(15);
    expect(fifteen.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
      "family-5-hero",
      "family-6-stats",
      "family-7-steps",
      "family-8-quote",
      "family-9-faq",
      "family-10-columns",
      "family-11-cards",
      "family-12-features",
      "family-13-actions",
      "family-14-media",
    ]);
    expect(JSON.stringify(fifteen.sections.slice(0, 14))).toBe(JSON.stringify(fourteen.sections));
    expect(fifteen.sections[14]).toEqual({
      id: "family-14-media",
      module: "media.image",
      props: {
        asset: { zone: "page", path: "images/portrait.png" },
        alt: "Author-described portrait",
        caption: "Author caption",
      },
    });
  });

  it("keeps the donor source out of the composed document and never invents decorative", () => {
    const only = composed(envelope(FIFTEEN_MEDIA_SECTION), portraitBinding()).sections[0];
    expect(JSON.stringify(only)).not.toContain("/assets/");
    expect(JSON.stringify(only)).not.toContain("decorative");
    const withoutCaption = composed(
      envelope({ type: "media", image: { src: "/assets/portrait.png", alt: "Author-described portrait" } }),
      portraitBinding(),
    ).sections[0];
    expect(withoutCaption?.props).toEqual({
      asset: { zone: "page", path: "images/portrait.png" },
      alt: "Author-described portrait",
    });
  });

  it("accepts generated, theme and platform owned refs under the unchanged zone policy", () => {
    const digest = "a".repeat(64);
    const generated = composed(envelope(FIFTEEN_MEDIA_SECTION), {
      images: [{ source: "/assets/portrait.png", owned: { zone: "generated", path: "images/x.png", integrity: digest } }],
    });
    expect(generated.sections[0]?.props).toEqual({
      asset: { zone: "generated", path: "images/x.png", integrity: digest },
      alt: "Author-described portrait",
      caption: "Author caption",
    });
    for (const zone of ["theme", "platform"]) {
      const owned = composed(envelope(FIFTEEN_MEDIA_SECTION), {
        images: [{ source: "/assets/portrait.png", owned: { zone, path: "images/x.webp" } }],
      });
      expect(owned.sections[0]?.props).toEqual({
        asset: { zone, path: "images/x.webp" },
        alt: "Author-described portrait",
        caption: "Author caption",
      });
    }
  });

  it("lets one repeated source share a single binding while distinct sources need their own", () => {
    const repeated = composed(
      {
        version: 1,
        title: "Repeated source",
        sections: [FIFTEEN_MEDIA_SECTION, JSON.parse(JSON.stringify(FIFTEEN_MEDIA_SECTION)) as unknown],
      },
      portraitBinding(),
    );
    expect(repeated.sections.map((section) => section.id)).toEqual(["family-0-media", "family-1-media"]);
    expect(repeated.sections[0]?.props).toEqual(repeated.sections[1]?.props);

    const distinct = {
      version: 1,
      title: "Distinct sources",
      sections: [
        FIFTEEN_MEDIA_SECTION,
        { type: "media", image: { src: "/assets/second.webp", alt: "Second described image" } },
      ],
    };
    expectRefusal(distinct, "family:unsupported-feature", portraitBinding());
    const both = composed(distinct, {
      images: [
        { source: "/assets/portrait.png", owned: { zone: "page", path: "images/portrait.png" } },
        { source: "/assets/second.webp", owned: { zone: "page", path: "images/second.webp" } },
      ],
    });
    expect(both.sections.map((section) => section.id)).toEqual(["family-0-media", "family-1-media"]);
  });

  it("keeps the caller's input and binder unchanged, freezes the result and re-accepts object or JSON text", () => {
    const source = fifteenSectionSource();
    const binder = portraitBinding();
    const before = JSON.stringify([source, binder]);
    const document = composed(source, binder);
    expect(JSON.stringify([source, binder])).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    const media = document.sections[14];
    expect(media === undefined ? false : Object.isFrozen(media)).toBe(true);
    if (media?.module !== "media.image") return;
    expect(Object.isFrozen(media.props)).toBe(true);
    expect(Object.isFrozen(media.props.asset)).toBe(true);
    expect(() => readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown)).not.toThrow();
    expect(() => readUnoPageDocument(JSON.stringify(document))).not.toThrow();
  });
});

describe("composeUnoFoundationSubset — media React markup", () => {
  it("renders one real figure, image and caption from a server-resolved projection", () => {
    const document = composed(envelope(FIFTEEN_MEDIA_SECTION), portraitBinding());
    const media: UnoPageMedia = new Map([
      ["family-0-media", { image: { src: "/uno-media/en-001/example/0", type: "image/png", width: 2, height: 2 } }],
    ]);
    const html = render(document, media);
    expect(html).toContain('<figure class="uno-json-media" id="family-0-media">');
    expect(html).toContain('alt="Author-described portrait"');
    expect(html).toContain('<figcaption class="uno-json-media-caption">Author caption</figcaption>');
    expect(html).toContain("/uno-media/en-001/example/0");
    // The donor identity is never a rendered source.
    expect(html).not.toContain("/assets/portrait.png");
    expect((html.match(/<figure /gu) ?? []).length).toBe(1);
  });

  it("renders no figure or image at all when no projection is supplied, and leaks no donor path", () => {
    const document = composed(envelope(FIFTEEN_MEDIA_SECTION), portraitBinding());
    const html = render(document);
    expect(html).not.toContain("uno-json-media");
    expect(html).not.toContain("<figure");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("/assets/portrait.png");
    expect(html).not.toContain("Author caption");
  });
});

describe("composeUnoFoundationSubset — media binding refusals", () => {
  it("refuses a missing, unused, extra, duplicate or malformed image binding", () => {
    // No binder at all: there is no owned ref to compose, and no fallback path is invented.
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsupported-feature");
    // A binder for a document that consumed no media is unused authority.
    expectRefusal(envelope({ type: "prose", body: "No media here." }), "family:unsupported-feature", portraitBinding());
    // Extra unused source alongside the one that is consumed.
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsupported-feature", {
      images: [
        { source: "/assets/portrait.png", owned: { zone: "page", path: "images/portrait.png" } },
        { source: "/assets/spare.png", owned: { zone: "page", path: "images/spare.png" } },
      ],
    });
    // Duplicate sources, a wrong source, and unknown binder/entry keys.
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsupported-feature", {
      images: [
        { source: "/assets/portrait.png", owned: { zone: "page", path: "images/portrait.png" } },
        { source: "/assets/portrait.png", owned: { zone: "page", path: "images/other.png" } },
      ],
    });
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsupported-feature", {
      images: [{ source: "/assets/other.png", owned: { zone: "page", path: "images/portrait.png" } }],
    });
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsupported-feature", {
      ...portraitBinding(),
      extra: 1,
    });
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsupported-feature", {
      images: [{ source: "/assets/portrait.png", owned: { zone: "page", path: "images/portrait.png" }, extra: 1 }],
    });
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsupported-feature", { images: "nope" });
  });

  it("refuses binding counts and invalid owned refs through the target reason", () => {
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:target-refused", { images: [] });
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:target-refused", {
      images: Array.from({ length: 9 }, () => ({
        source: "/assets/portrait.png",
        owned: { zone: "page", path: "images/portrait.png" },
      })),
    });
    for (const owned of [
      { zone: "unknown", path: "images/x.png" },
      { zone: "page", path: "../x.png" },
      { zone: "page", path: "/images/x.png" },
      { zone: "page", path: "images/x.svg" },
      { zone: "page", path: "images/x.mp4" },
      { zone: "generated", path: "images/x.png" },
      { zone: "generated", path: "images/x.png", integrity: "A".repeat(64) },
      { zone: "page", path: "images/x.png", integrity: "a".repeat(64) },
    ]) {
      expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:target-refused", {
        images: [{ source: "/assets/portrait.png", owned }],
      });
    }
  });

  it("refuses donor media source identities outside the literal raster identity", () => {
    for (const src of [
      "https://example.org/portrait.png",
      "//example.org/portrait.png",
      "/assets/../secret.png",
      "/assets/%2e%2e/secret.png",
      "/assets/images\\portrait.png",
      "/assets/portrait.png?x=1",
      "/assets/portrait.png#frag",
      "/assets/portrait.svg",
      "/assets/portrait.PNG",
      "/assets/con.png",
      "assets/portrait.png",
      "/assets/",
      "/assets/a" + "b".repeat(200) + ".png",
    ]) {
      expectRefusal(
        envelope({ type: "media", image: { src, alt: "Described" } }),
        "family:unsupported-feature",
        {
          images: [{ source: src, owned: { zone: "page", path: "images/x.png" } }],
        },
      );
    }
  });
});

describe("composeUnoFoundationSubset — media donor-shape refusals", () => {
  it("refuses donor media fields outside the described-image subset", () => {
    const cases: unknown[] = [
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described" }, heading: "Title" },
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described" }, lede: "Lede" },
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described" }, position: "start" },
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described" }, surface: "raised" },
      { type: "media", image: { src: "/assets/portrait.png" } },
      { type: "media", image: { alt: "Described" } },
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described", decorative: true } },
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described", href: "/elsewhere" } },
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described", width: 2 } },
      { type: "media", image: "portrait" },
      { type: "media", image: { src: "/assets/portrait.png", alt: 5 } },
      { type: "media", image: { src: "/assets/portrait.png", alt: "**bold**" } },
      { type: "media", image: { src: "/assets/portrait.png", alt: "Described" }, caption: "`code`" },
      { type: "media" },
    ];
    for (const section of cases) {
      expectRefusal(envelope(section), "family:unsupported-feature", portraitBinding());
    }
  });

  it("refuses malformed alt or caption values and oversized candidates through the Uno target", () => {
    for (const alt of ["", "   ", "t".repeat(321), "<script>alert(1)</script>"]) {
      expectRefusal(
        envelope({ type: "media", image: { src: "/assets/portrait.png", alt } }),
        "family:target-refused",
        portraitBinding(),
      );
    }
    for (const caption of ["   ", "c".repeat(321), "<script>alert(1)</script>"]) {
      expectRefusal(
        envelope({ type: "media", image: { src: "/assets/portrait.png", alt: "Described" }, caption }),
        "family:target-refused",
        portraitBinding(),
      );
    }
    const bulky = {
      version: 1,
      title: "Oversized media fixture",
      sections: [
        { type: "features", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
        { type: "features", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
        FIFTEEN_MEDIA_SECTION,
      ],
    };
    expectRefusal(bulky, "family:target-refused", portraitBinding());
  });
});

describe("composeUnoFoundationSubset — hostile media source", () => {
  it("refuses hostile media or binder accessors with a zero getter count and no partial Page", () => {
    let ran = 0;
    const count = (): number => {
      ran += 1;
      return 0;
    };
    const hostileImage: Record<string, unknown> = { alt: "Described" };
    Object.defineProperty(hostileImage, "src", {
      enumerable: true,
      get: () => {
        count();
        return "/assets/portrait.png";
      },
    });
    const imageOutcome = composeUnoFoundationSubset(envelope({ type: "media", image: hostileImage }), portraitBinding());
    expect(imageOutcome.status).toBe("refused");
    if (imageOutcome.status === "refused") expect(imageOutcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(imageOutcome, "document")).toBe(false);

    const hostileAlt: Record<string, unknown> = { src: "/assets/portrait.png" };
    Object.defineProperty(hostileAlt, "alt", {
      enumerable: true,
      get: () => {
        count();
        return "Described";
      },
    });
    const altOutcome = composeUnoFoundationSubset(envelope({ type: "media", image: hostileAlt }), portraitBinding());
    expect(altOutcome.status).toBe("refused");
    if (altOutcome.status === "refused") expect(altOutcome.reason).toBe("family:unsafe-source");

    const hostileEntry: Record<string, unknown> = { owned: { zone: "page", path: "images/portrait.png" } };
    Object.defineProperty(hostileEntry, "source", {
      enumerable: true,
      get: () => {
        count();
        return "/assets/portrait.png";
      },
    });
    const sourceOutcome = composeUnoFoundationSubset(envelope(FIFTEEN_MEDIA_SECTION), { images: [hostileEntry] });
    expect(sourceOutcome.status).toBe("refused");
    if (sourceOutcome.status === "refused") expect(sourceOutcome.reason).toBe("family:unsafe-source");

    const hostileOwned: Record<string, unknown> = { source: "/assets/portrait.png" };
    Object.defineProperty(hostileOwned, "owned", {
      enumerable: true,
      get: () => {
        count();
        return { zone: "page", path: "images/portrait.png" };
      },
    });
    const ownedOutcome = composeUnoFoundationSubset(envelope(FIFTEEN_MEDIA_SECTION), { images: [hostileOwned] });
    expect(ownedOutcome.status).toBe("refused");
    if (ownedOutcome.status === "refused") expect(ownedOutcome.reason).toBe("family:unsafe-source");

    const hostileAsset: Record<string, unknown> = { path: "images/portrait.png" };
    Object.defineProperty(hostileAsset, "zone", {
      enumerable: true,
      get: () => {
        count();
        return "page";
      },
    });
    const assetOutcome = composeUnoFoundationSubset(envelope(FIFTEEN_MEDIA_SECTION), {
      images: [{ source: "/assets/portrait.png", owned: hostileAsset }],
    });
    expect(assetOutcome.status).toBe("refused");
    if (assetOutcome.status === "refused") expect(assetOutcome.reason).toBe("family:unsafe-source");

    const sparseBinder = { images: [{ source: "/assets/portrait.png", owned: { zone: "page", path: "images/x.png" } }, ,] };
    expectRefusal(envelope(FIFTEEN_MEDIA_SECTION), "family:unsafe-source", sparseBinder);

    // A valid prose followed by hostile media refuses the WHOLE Page, never a partial document.
    const mixed = composeUnoFoundationSubset(
      {
        version: 1,
        title: "Mixed media fixture",
        sections: [{ type: "prose", body: "Kept?" }, { type: "media", image: hostileImage }],
      },
      portraitBinding(),
    );
    expect(mixed.status).toBe("refused");
    if (mixed.status === "refused") expect(mixed.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(mixed, "document")).toBe(false);
    expect(ran).toBe(0);
  });
});

describe("composeUnoFoundationSubset — canonical donor inventory", () => {
  it("maps all seventeen donor families and leaves none unimplemented", () => {
    const left = DONOR_17.filter((name) => !(MAPPED_17 as readonly string[]).includes(name));
    expect([...UNO_FOUNDATION_SUBSET_FAMILIES]).toEqual([...MAPPED_17]);
    expect(left).toEqual([]);
  });

  it("keeps the committed ledger identical to the canonical inventory", () => {
    const ledger = readFileSync(
      fileURLToPath(new URL("../../.documents/Architecture/u04-family-parity.md", import.meta.url)),
      "utf8",
    );
    const unimplemented = "**UNIMPLEMENTED (0):** none.";
    expect(ledger.split(unimplemented).length - 1).toBe(1);
    expect(ledger).not.toContain("UNIMPLEMENTED (1)");
    expect(ledger).not.toContain("UNIMPLEMENTED (2)");
    expect(ledger).not.toContain("UNIMPLEMENTED (3)");
    expect(ledger).not.toContain("UNIMPLEMENTED (4)");
    expect(ledger).not.toContain("These thirteen mappings");
    expect(ledger).not.toContain("These fifteen mappings");
    expect(ledger).not.toContain("seven bounded");
    expect(ledger).not.toContain("nine bounded");
    expect(ledger).not.toContain("eleven bounded");
    expect(ledger).not.toContain("thirteen bounded");
    expect(ledger).not.toContain("fourteen bounded");
    expect(ledger).not.toContain("fourteen composed");
    expect(ledger).not.toContain("fifteen bounded");
    expect(ledger).not.toContain("fifteen composed");
    expect(ledger).not.toContain("sixteen bounded");
    expect(ledger).not.toContain("These sixteen mappings");
    expect(ledger).not.toContain("one donor family entirely unimplemented");
    expect(ledger).not.toContain("sixteen composed");
    expect(ledger).not.toContain("four donor families");
    expect(ledger).not.toContain("three donor families");
    expect(ledger).not.toContain("two donor families");
    expect(ledger).not.toContain("Two donor families");
    expect(ledger).not.toContain("UNIMPLEMENTED**: `heading`");
    expect(ledger).not.toMatch(/FAMILY_PARITY=(17\/17|16\/17|15\/17|14\/17|13\/17|11\/17|9\/17|7\/17)/u);
    for (const family of [
      "hero",
      "stats",
      "steps",
      "quote",
      "faq",
      "columns",
      "cards",
      "features",
      "actions",
      "media",
      "gallery",
      "contactForm",
    ]) {
      expect(ledger).toContain(`| \`${family}\` |`);
    }
    // Each newest row names its own disposition, donor and local Uno evidence.
    expect(ledger).toContain("`COMPOSE (explicit owned-image binding subset)`");
    expect(ledger).toContain("`COMPOSE (explicit owned-gallery binding subset)`");
    expect(ledger).toContain("`COMPOSE (acknowledged delivery-OFF notice subset)`");
    expect(ledger).toContain("f988a0e5");
    expect(ledger).toContain("e3f3a12e");
    expect(ledger).toContain("2d968300");
    expect(ledger).toContain("cde15a6b");
    expect(ledger).toContain("a12d964c");
    expect(ledger).toContain("fc35a52d");
    expect(ledger).toContain("These seventeen mappings");
    expect(ledger).toContain("seventeen bounded");
    expect(ledger).toContain("zero entirely unimplemented");
    // `UNO-WO-066 / R01`: one temporary fixture Page is now proven over production HTTP and Chromium, so the older
    // blanket claim of no family-Page evidence must be gone and replaced by the exact, bounded positive words.
    expect(ledger).toContain("one **durable** family composition published on the existing committed");
    expect(ledger).toContain("never a parity uplift");
    // `UNO-WO-078 / R01`: the durable composition Page now exists, so the older blanket absence claim must be gone.
    expect(ledger).not.toContain("no durable published family Page");
    expect(ledger).not.toContain("zero published family Page acceptance evidence");
    // `UNO-WO-067 / R01`: the same temporary Page now carries thirteen bounded shapes, and exactly four remain without
    // fixture-Page HTTP/browser proof. The stale nine-shape accounting must not survive.
    expect(ledger).toContain("appended `hero`, `stats`, `steps`, `quote`");
    expect(ledger).not.toContain("one temporary nine-shape integration slice");
    expect(ledger).not.toContain("eight bounded shapes keep their validator/renderer tests only");
    // `UNO-WO-068 / R03`: all seventeen bounded shapes are now sampled over the one temporary Page, so neither the
    // thirteen-shape accounting nor the "four without fixture evidence" claim may survive.
    expect(ledger).toContain("one temporary seventeen-shape integration slice");
    expect(ledger).toContain("all seventeen bounded shapes sampled over the temporary Page");
    // `UNO-WO-078 / R01`: the durable composition exists and is recorded as bounded, never as parity or closure.
    expect(ledger).toContain("## 7. Durable family Page");
    expect(ledger).toContain("No parity uplift and no stage closure follow from this");
    expect(ledger).not.toContain("one temporary thirteen-shape integration slice");
    expect(ledger).not.toContain("four bounded shapes keep their validator/renderer tests only");
    expect(ledger).not.toContain("zero bounded shapes lacking temporary Page evidence");
    // `UNO-WO-069 / R01`: one family is now a parity candidate, so the obsolete blanket zero claim must be gone and
    // the ledger may never assert Owner closure, universal parity or a self-awarded stage proxy.
    expect(ledger).not.toContain("zero of seventeen full semantic parity");
    expect(ledger).not.toContain("Owner closed U04");
    expect(ledger).not.toContain("17/17 full semantic parity");
    expect(ledger).not.toMatch(/FAMILY_PARITY=17\/17/u);
    expect(ledger).toContain("ADAPT (divider semantic parity candidate)");
    expect(ledger).toContain("eleven of seventeen fully parity-evidenced candidates");
    // `UNO-WO-071 / R01` normalizes the divider wording to its already independently accepted status.
    expect(ledger).toContain("independently accepted under `UNO-WO-069 / R01`");
    expect(ledger).not.toContain("awaiting independent Architect acceptance");
    expect(ledger).toContain("six still bounded");
    // `UNO-WO-070 / R01`: the two grid families gained a bounded authored-heading mode, which must never be recorded as
    // full parity, a second/third accepted family or a closed stage.
    expect(ledger).toContain("ADAPT (bounded grid plus authored section heading and plain-text lede)");
    expect(ledger.split("ADAPT (bounded grid plus authored section heading and plain-text lede)").length - 1).toBe(2);
    expect(ledger).toContain("authored section heading");
    expect(ledger).toContain("item titles step to `content.heading {level:3}`");
    expect(ledger).toContain("byte-identically");
    expect(ledger).toContain("heading-less");
    expect(ledger).toContain("bounded capability, not parity");
    expect(ledger).toContain("Seven of the seventeen remain bounded");
    expect(ledger).not.toContain("2/17");
    expect(ledger).not.toContain("3/17");
    expect(ledger).not.toMatch(/cards[^.\n]*full semantic parity/u);
    expect(ledger).not.toMatch(/features[^.\n]*full semantic parity/u);
    expect(ledger).toContain("family-<index>-contactform");
    expect(ledger).toContain("Deliberately absent donor design (media and its binding)");
    expect(ledger).toContain("Deliberately absent donor design (gallery)");
    expect(ledger).toContain("Deliberately absent donor design (actions)");
    expect(ledger).toContain("Deliberately absent donor design (contactForm)");
  });
});

describe("composeUnoFoundationSubset — explicitly bound gallery", () => {
  it("composes sixteen nodes and keeps the first fifteen byte-identical", () => {
    const fifteen = composed(fifteenSectionSource(), portraitBinding());
    const sixteen = composed(sixteenSectionSource(), galleryBinding());
    expect(sixteen.sections.map((section) => section.id)).toEqual([
      "family-0-prose",
      "family-1-callout",
      "family-2-table",
      "family-3-list",
      "family-4-divider",
      "family-5-hero",
      "family-6-stats",
      "family-7-steps",
      "family-8-quote",
      "family-9-faq",
      "family-10-columns",
      "family-11-cards",
      "family-12-features",
      "family-13-actions",
      "family-14-media",
      "family-15-gallery",
    ]);
    expect(JSON.stringify(sixteen.sections.slice(0, 15))).toBe(JSON.stringify(fifteen.sections));
    expect(sixteen.sections[15]).toEqual({
      id: "family-15-gallery",
      module: "media.gallery",
      props: {
        columns: 3,
        items: [
          {
            asset: { zone: "page", path: "images/portrait.png" },
            alt: "Portrait by the author",
            caption: "First caption",
          },
          { asset: { zone: "theme", path: "gallery/scene.webp" }, alt: "Described scene" },
        ],
      },
    });
    expect(JSON.stringify(sixteen)).not.toContain("/assets/");
    expect(JSON.stringify(sixteen)).not.toContain("decorative");
  });

  it("composes a gallery alone at its own index with two exact owned refs and no invented fields", () => {
    const document = composed(envelope(GALLERY_SECTION), galleryBinding());
    expect(document.sections[0]).toEqual({
      id: "family-0-gallery",
      module: "media.gallery",
      props: {
        columns: 3,
        items: [
          {
            asset: { zone: "page", path: "images/portrait.png" },
            alt: "Portrait by the author",
            caption: "First caption",
          },
          { asset: { zone: "theme", path: "gallery/scene.webp" }, alt: "Described scene" },
        ],
      },
    });
    // The item without an authored caption carries no own caption key at all.
    const props = document.sections[0]?.props as { readonly items: readonly Record<string, unknown>[] };
    expect(Object.prototype.hasOwnProperty.call(props.items[1], "caption")).toBe(false);
  });

  it("keeps authored item order when the binding order is reversed", () => {
    const reversed = { images: [...(galleryBinding()["images"] as readonly unknown[])].reverse() };
    const document = composed(envelope(GALLERY_SECTION), reversed);
    const props = document.sections[0]?.props as { readonly items: readonly Record<string, unknown>[] };
    expect(props.items.map((item) => item["alt"])).toEqual(["Portrait by the author", "Described scene"]);
    expect(props.items.map((item) => item["asset"])).toEqual([
      { zone: "page", path: "images/portrait.png" },
      { zone: "theme", path: "gallery/scene.webp" },
    ]);
  });
});

describe("composeUnoFoundationSubset — gallery binding reuse", () => {
  it("uses one binding for a repeated source while distinct sources still need their own", () => {
    const repeated = composed(
      envelope({
        type: "gallery",
        columns: 2,
        items: [
          { image: { src: "/assets/portrait.png", alt: "First view" } },
          { image: { src: "/assets/portrait.png", alt: "Second view" } },
        ],
      }),
      portraitBinding(),
    );
    const items = (repeated.sections[0]?.props as { readonly items: readonly Record<string, unknown>[] }).items;
    expect(items.length).toBe(2);
    expect(items[0]?.["asset"]).toEqual(items[1]?.["asset"]);
    expectRefusal(
      envelope({
        type: "gallery",
        columns: 2,
        items: [
          { image: { src: "/assets/portrait.png", alt: "First view" } },
          { image: { src: "/assets/scene.webp", alt: "Second view" } },
        ],
      }),
      "family:unsupported-feature",
      portraitBinding(),
    );
  });

  it("reuses one binding across a media section and a gallery item and refuses unused authority", () => {
    const shared = composed(
      {
        version: 1,
        title: "Shared source",
        sections: [
          FIFTEEN_MEDIA_SECTION,
          {
            type: "gallery",
            columns: 2,
            items: [
              { image: { src: "/assets/portrait.png", alt: "First view" } },
              { image: { src: "/assets/scene.webp", alt: "Second view" } },
            ],
          },
        ],
      },
      galleryBinding(),
    );
    expect(shared.sections.map((section) => section.id)).toEqual(["family-0-media", "family-1-gallery"]);
    const spare = {
      images: [
        ...(galleryBinding()["images"] as readonly unknown[]),
        { source: "/assets/spare.png", owned: { zone: "page", path: "images/spare.png" } },
      ],
    };
    expectRefusal(envelope(GALLERY_SECTION), "family:unsupported-feature", spare);
    // A binder for a Page that consumed no image is unused authority too.
    expectRefusal(envelope({ type: "prose", body: "No images." }), "family:unsupported-feature", galleryBinding());
  });
});

describe("composeUnoFoundationSubset — gallery bounds and immutability", () => {
  it("accepts exactly two through eight items and all three column literals", () => {
    const item = (index: number): Record<string, unknown> => ({
      image: { src: "/assets/portrait.png", alt: `View ${index}` },
    });
    for (const columns of [2, 3, 4]) {
      const document = composed(
        envelope({ type: "gallery", columns, items: [item(0), item(1)] }),
        portraitBinding(),
      );
      expect((document.sections[0]?.props as { readonly columns: number }).columns).toBe(columns);
    }
    const eight = composed(
      envelope({ type: "gallery", columns: 4, items: Array.from({ length: 8 }, (_unused, index) => item(index)) }),
      portraitBinding(),
    );
    expect((eight.sections[0]?.props as { readonly items: readonly unknown[] }).items.length).toBe(8);
    expectRefusal(
      envelope({ type: "gallery", columns: 3, items: Array.from({ length: 9 }, (_unused, index) => item(index)) }),
      "family:target-refused",
      portraitBinding(),
    );
  });

  it("freezes the gallery node and its parts, leaves caller data unchanged and re-accepts JSON", () => {
    const source = { version: 1, title: "Gallery fixture", sections: [GALLERY_SECTION] };
    const binder = galleryBinding();
    const before = JSON.stringify([source, binder]);
    const document = composed(source, binder);
    expect(JSON.stringify([source, binder])).toBe(before);
    expect(Object.isFrozen(document)).toBe(true);
    const node = document.sections[0];
    expect(node === undefined ? false : Object.isFrozen(node)).toBe(true);
    if (node?.module !== "media.gallery") return;
    expect(Object.isFrozen(node.props)).toBe(true);
    expect(Object.isFrozen(node.props.items)).toBe(true);
    expect(Object.isFrozen(node.props.items[0])).toBe(true);
    expect(Object.isFrozen(node.props.items[0]?.asset)).toBe(true);
    expect(() => readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown)).not.toThrow();
    expect(() => readUnoPageDocument(JSON.stringify(document))).not.toThrow();
  });
});

describe("composeUnoFoundationSubset — gallery React markup", () => {
  it("renders one Uno gallery div with exactly two figures, two images and one authored caption", () => {
    const document = composed(envelope(GALLERY_SECTION), galleryBinding());
    const media: UnoPageMedia = new Map([
      [
        "family-0-gallery",
        {
          items: [
            { src: "/uno-media/en-001/example/0", type: "image/png", width: 2, height: 2 },
            { src: "/uno-media/en-001/example/1", type: "image/webp", width: 2, height: 2 },
          ],
        },
      ],
    ]);
    const html = render(document, media);
    expect(html).toContain('<div class="uno-json-gallery" data-uno-columns="3" id="family-0-gallery">');
    const start = html.indexOf('<div class="uno-json-gallery"');
    const region = html.slice(start);
    expect((region.match(/<figure class="uno-json-media-item">/gu) ?? []).length).toBe(2);
    expect((region.match(/<img /gu) ?? []).length).toBe(2);
    expect(region).toContain('alt="Portrait by the author"');
    expect(region).toContain('alt="Described scene"');
    expect(region).toContain("/uno-media/en-001/example/0");
    expect(region).toContain("/uno-media/en-001/example/1");
    expect((region.match(/<figcaption class="uno-json-media-caption">/gu) ?? []).length).toBe(1);
    expect(region).toContain('<figcaption class="uno-json-media-caption">First caption</figcaption>');
    // Uno renders a div of figures; the donor's native list wrapper is deliberately different.
    expect(region).not.toContain("<ul");
    expect(region).not.toContain("<li");
    expect(region).not.toContain("carousel");
    expect(html).not.toContain("/assets/portrait.png");
    expect(html).not.toContain("/assets/scene.webp");
  });

  it("emits no gallery, figure or image without a matching server projection", () => {
    const document = composed(envelope(GALLERY_SECTION), galleryBinding());
    const withoutProjection = render(document);
    expect(withoutProjection).not.toContain("uno-json-gallery");
    expect(withoutProjection).not.toContain("<figure");
    expect(withoutProjection).not.toContain("<img");
    expect(withoutProjection).not.toContain("/assets/");

    const mismatched: UnoPageMedia = new Map([
      ["family-0-gallery", { items: [{ src: "/uno-media/en-001/example/0", type: "image/png", width: 2, height: 2 }] }],
    ]);
    const html = render(document, mismatched);
    expect(html).not.toContain("uno-json-gallery");
    expect(html).not.toContain("<figure");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("First caption");
  });
});


describe("composeUnoFoundationSubset — gallery donor-shape refusals", () => {
  const gallery = (overrides: Record<string, unknown>): Record<string, unknown> => ({
    type: "gallery",
    columns: 3,
    items: [
      { image: { src: "/assets/portrait.png", alt: "First view" } },
      { image: { src: "/assets/scene.webp", alt: "Second view" } },
    ],
    ...overrides,
  });

  it("refuses donor gallery fields outside the described-grid subset", () => {
    const cases: unknown[] = [
      gallery({ heading: "Title" }),
      gallery({ lede: "Lede" }),
      gallery({ surface: "raised" }),
      gallery({ align: "center" }),
      gallery({ position: "start" }),
      gallery({ links: [] }),
      gallery({ visibility: "public" }),
      gallery({ style: "color:red" }),
      gallery({ items: "nope" }),
      { type: "gallery", columns: 3 },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: { src: "/assets/portrait.png", alt: "A" }, href: "/elsewhere" }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: { src: "/assets/portrait.png", alt: "A" }, meta: "Meta" }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: { src: "/assets/portrait.png", alt: "A", decorative: true } }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: { src: "/assets/portrait.png", alt: "A", width: 2 } }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: "portrait" }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: { src: "/assets/portrait.png", alt: 5 } }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: { src: "/assets/portrait.png", alt: "**bold**" } }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
      {
        type: "gallery",
        columns: 3,
        items: [{ image: { src: "/assets/portrait.png", alt: "A" }, caption: "`code`" }, { image: { src: "/assets/portrait.png", alt: "B" } }],
      },
    ];
    for (const section of cases) {
      expectRefusal(envelope(section), "family:unsupported-feature", galleryBinding());
    }
  });

  it("refuses gallery source identities outside the literal raster identity", () => {
    for (const src of [
      "https://example.org/portrait.png",
      "//example.org/portrait.png",
      "/assets/../scene.webp",
      "/assets/%2e%2e/scene.webp",
      "/assets/scene.png?x=1",
      "/assets/scene.png#frag",
      "/assets/scene.svg",
      "/assets/scene.PNG",
      "/assets/images\\scene.png",
      "/assets/con.png",
    ]) {
      const source = {
        type: "gallery",
        columns: 2,
        items: [{ image: { src, alt: "Described" } }, { image: { src, alt: "Second" } }],
      };
      expectRefusal(envelope(source), "family:unsupported-feature", {
        images: [{ source: src, owned: { zone: "page", path: "images/x.png" } }],
      });
    }
  });
});


describe("composeUnoFoundationSubset — gallery target refusals", () => {
  const item = (src: string, alt: string, caption?: string): Record<string, unknown> => ({
    image: { src, alt },
    ...(caption === undefined ? {} : { caption }),
  });
  const source = (overrides: Record<string, unknown>): Record<string, unknown> => ({
    type: "gallery",
    columns: 3,
    items: [item("/assets/portrait.png", "First view"), item("/assets/scene.webp", "Second view")],
    ...overrides,
  });

  it("refuses authored columns, item counts and text values the Uno target cannot accept", () => {
    for (const columns of [0, 1, 5, "2", 2.5, null, true]) {
      expectRefusal(envelope(source({ columns })), "family:target-refused", galleryBinding());
    }
    expectRefusal(envelope(source({ items: [] })), "family:target-refused", galleryBinding());
    expectRefusal(
      envelope(source({ items: [item("/assets/portrait.png", "Only one")] })),
      "family:target-refused",
      galleryBinding(),
    );
    expectRefusal(
      envelope(source({ items: Array.from({ length: 9 }, () => item("/assets/portrait.png", "Repeated")) })),
      "family:target-refused",
      portraitBinding(),
    );
    for (const alt of ["", "   ", "t".repeat(321), "<script>alert(1)</script>"]) {
      expectRefusal(
        envelope({ type: "gallery", columns: 2, items: [item("/assets/portrait.png", alt), item("/assets/portrait.png", "Second")] }),
        "family:target-refused",
        portraitBinding(),
      );
    }
    for (const caption of ["", "   ", "c".repeat(321), "<script>alert(1)</script>"]) {
      expectRefusal(
        envelope({
          type: "gallery",
          columns: 2,
          items: [item("/assets/portrait.png", "First", caption), item("/assets/portrait.png", "Second")],
        }),
        "family:target-refused",
        portraitBinding(),
      );
    }
  });

  it("refuses invalid owned targets and oversized candidates through the same policy", () => {
    for (const owned of [
      { zone: "unknown", path: "images/x.png" },
      { zone: "page", path: "../x.png" },
      { zone: "page", path: "images/x.svg" },
      { zone: "page", path: "images/x.mp4" },
      { zone: "generated", path: "images/x.png" },
      { zone: "page", path: "images/x.png", integrity: "a".repeat(64) },
    ]) {
      expectRefusal(
        envelope(source({ items: [item("/assets/portrait.png", "First view"), item("/assets/portrait.png", "Second view")] })),
        "family:target-refused",
        { images: [{ source: "/assets/portrait.png", owned }] },
      );
    }
    const bulky = {
      version: 1,
      title: "Oversized gallery fixture",
      sections: [
        { type: "features", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
        { type: "features", columns: 2, items: Array.from({ length: 8 }, () => ({ title: "T", body: "b".repeat(4000) })) },
        source({ items: [item("/assets/portrait.png", "First view"), item("/assets/portrait.png", "Second view")] }),
      ],
    };
    expectRefusal(bulky, "family:target-refused", portraitBinding());
  });
});


describe("composeUnoFoundationSubset — hostile gallery source", () => {
  it("refuses hostile gallery or binder accessors with zero getter invocations and no partial Page", () => {
    let ran = 0;
    const count = (): number => {
      ran += 1;
      return 0;
    };
    const hostileSrc: Record<string, unknown> = { alt: "Described" };
    Object.defineProperty(hostileSrc, "src", {
      enumerable: true,
      get: () => {
        count();
        return "/assets/portrait.png";
      },
    });
    const imageOutcome = composeUnoFoundationSubset(
      envelope({
        type: "gallery",
        columns: 2,
        items: [{ image: hostileSrc }, { image: { src: "/assets/portrait.png", alt: "Second" } }],
      }),
      portraitBinding(),
    );
    expect(imageOutcome.status).toBe("refused");
    if (imageOutcome.status === "refused") expect(imageOutcome.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(imageOutcome, "document")).toBe(false);

    const hostileAlt: Record<string, unknown> = { src: "/assets/portrait.png" };
    Object.defineProperty(hostileAlt, "alt", {
      enumerable: true,
      get: () => {
        count();
        return "Described";
      },
    });
    const altOutcome = composeUnoFoundationSubset(
      envelope({
        type: "gallery",
        columns: 2,
        items: [{ image: hostileAlt }, { image: { src: "/assets/portrait.png", alt: "Second" } }],
      }),
      portraitBinding(),
    );
    expect(altOutcome.status).toBe("refused");
    if (altOutcome.status === "refused") expect(altOutcome.reason).toBe("family:unsafe-source");

    const hostileItems: Record<string, unknown> = { type: "gallery", columns: 2 };
    Object.defineProperty(hostileItems, "items", {
      enumerable: true,
      get: () => {
        count();
        return [];
      },
    });
    const itemsOutcome = composeUnoFoundationSubset(envelope(hostileItems), portraitBinding());
    expect(itemsOutcome.status).toBe("refused");
    if (itemsOutcome.status === "refused") expect(itemsOutcome.reason).toBe("family:unsafe-source");

    const hostileOwnedPath: Record<string, unknown> = { zone: "page" };
    Object.defineProperty(hostileOwnedPath, "path", {
      enumerable: true,
      get: () => {
        count();
        return "images/portrait.png";
      },
    });
    const ownedOutcome = composeUnoFoundationSubset(envelope(GALLERY_SECTION), {
      images: [
        { source: "/assets/portrait.png", owned: hostileOwnedPath },
        { source: "/assets/scene.webp", owned: { zone: "theme", path: "gallery/scene.webp" } },
      ],
    });
    expect(ownedOutcome.status).toBe("refused");
    if (ownedOutcome.status === "refused") expect(ownedOutcome.reason).toBe("family:unsafe-source");

    // A valid prose followed by a hostile gallery refuses the whole Page, never a partial document.
    const mixed = composeUnoFoundationSubset(
      {
        version: 1,
        title: "Mixed gallery fixture",
        sections: [
          { type: "prose", body: "Kept?" },
          { type: "gallery", columns: 2, items: [{ image: hostileSrc }, { image: hostileAlt }] },
        ],
      },
      portraitBinding(),
    );
    expect(mixed.status).toBe("refused");
    if (mixed.status === "refused") expect(mixed.reason).toBe("family:unsafe-source");
    expect(Object.prototype.hasOwnProperty.call(mixed, "document")).toBe(false);
    expect(ran).toBe(0);
  });
});

describe("composeUnoFoundationSubset — acknowledged delivery-OFF contact", () => {
  it("composes seventeen nodes and keeps the first sixteen byte-identical", () => {
    const sixteen = composed(sixteenSectionSource(), galleryBinding());
    const seventeen = composed(seventeenSectionSource(), combinedBinding());
    expect(seventeen.sections.length).toBe(17);
    expect(seventeen.sections[16]).toEqual({
      id: "family-16-contactform",
      module: "interaction.contact",
      props: {},
    });
    expect(JSON.stringify(seventeen.sections.slice(0, 16))).toBe(JSON.stringify(sixteen.sections));
    // The sixteen-shape source with its image-only binder (no `contactForms` key) still yields identical bytes.
    expect(JSON.stringify(composed(sixteenSectionSource(), galleryBinding()))).toBe(JSON.stringify(sixteen));
  });

  it("composes one minimal contact notice, keeps both inputs unchanged and leaks nothing", () => {
    const source = contactOnlySource();
    const bindings = contactBinding();
    const before = JSON.stringify([source, bindings]);
    const outcome = composeUnoFoundationSubset(source, bindings);
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    expect(outcome.document.sections).toEqual([
      { id: "family-0-contactform", module: "interaction.contact", props: {} },
    ]);
    const node = outcome.document.sections[0];
    expect(node === undefined ? null : Object.keys(node)).toEqual(["id", "module", "props"]);
    expect(JSON.stringify([source, bindings])).toBe(before);
    expect(Object.isFrozen(outcome.document)).toBe(true);
    expect(node === undefined ? false : Object.isFrozen(node)).toBe(true);
    expect(node === undefined ? false : Object.isFrozen(node.props)).toBe(true);
    // The unchanged Uno reader reaccepts both the object and its JSON text.
    expect(readUnoPageDocument(JSON.parse(JSON.stringify(outcome.document)) as unknown).accepted).toBe(true);
    expect(readUnoPageDocument(JSON.stringify(outcome.document)).accepted).toBe(true);
    const serialized = JSON.stringify(outcome.document);
    for (const forbidden of [
      "sales-inquiry",
      "contactForms",
      "delivery-off",
      "webhook",
      "provider",
      "recipient",
      "formRef",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("keeps the frozen id grammar: camel-case target refuses, lowercase target is accepted", () => {
    const camel = readUnoPageDocument({
      version: 1,
      title: "ID grammar",
      sections: [{ id: "family-0-contactForm", module: "interaction.contact", props: {} }],
    });
    expect(camel.accepted).toBe(false);
    if (camel.accepted) return;
    expect(camel.reason).toBe("document:invalid-section-id");
    const lower = readUnoPageDocument({
      version: 1,
      title: "ID grammar",
      sections: [{ id: "family-0-contactform", module: "interaction.contact", props: {} }],
    });
    expect(lower.accepted).toBe(true);
    if (!lower.accepted) return;
    expect(lower.document.sections[0]?.id).toBe("family-0-contactform");
    // The canonical donor `type` remains required; the target suffix is never a source alias.
    expectRefusal(
      envelope({ type: "contactform", formRef: "sales-inquiry" }),
      "family:unsupported-family",
      contactBinding(),
    );
  });

  it("renders only the fixed delivery-OFF notice and no form, control or transport", () => {
    const document = composed(contactOnlySource(), contactBinding());
    const html = render(document);
    expect(html).toContain('<section class="uno-json-contact" id="family-0-contactform">');
    expect(html).toContain(
      '<p class="uno-json-contact-status">Delivery is switched off. Nothing entered here is sent or stored.</p>',
    );
    const region = html.slice(html.indexOf('<section class="uno-json-contact"'));
    for (const forbidden of [
      "<form",
      "<input",
      "<textarea",
      "<button",
      "submit",
      "action=",
      "method=",
      "onSubmit",
      "href=",
      "<iframe",
      "<script",
      "sales-inquiry",
      "contactForms",
      'role="alert"',
    ]) {
      expect(region).not.toContain(forbidden);
    }
    // The contact section is the whole body: no second landmark or heading is manufactured.
    expect(html.split("<main").length - 1).toBe(0);
    expect(html.split("<h1").length - 1).toBe(0);
  });

  it("requires an exact acknowledgement for every contact reference", () => {
    // No binder at all: the acknowledgement is mandatory even though every notice is inert.
    expectRefusal(contactOnlySource(), "family:unsupported-feature");
    expectRefusal(contactOnlySource(), "family:unsupported-feature", {});
    expectRefusal(contactOnlySource(), "family:target-refused", { images: [] });
    // Wrong, extra, duplicate and mismatched acknowledgements.
    expectRefusal(contactOnlySource(), "family:unsupported-feature", contactBinding("other-form"));
    expectRefusal(
      contactOnlySource(),
      "family:unsupported-feature",
      { contactForms: [{ formRef: "sales-inquiry", mode: "delivery-off" }, { formRef: "extra", mode: "delivery-off" }] },
    );
    expectRefusal(
      contactOnlySource(),
      "family:unsupported-feature",
      {
        contactForms: [
          { formRef: "sales-inquiry", mode: "delivery-off" },
          { formRef: "sales-inquiry", mode: "delivery-off" },
        ],
      },
    );
    // A binder on a Page that authored no contact section is unused authority.
    expectRefusal(envelope({ type: "prose", body: "A" }), "family:unsupported-feature", contactBinding());
    // Modes other than the single literal, and any extra entry key.
    for (const mode of ["on", "preview", "webhook", "enabled", true, 1, null]) {
      expectRefusal(
        contactOnlySource(),
        "family:unsupported-feature",
        { contactForms: [{ formRef: "sales-inquiry", mode }] },
      );
    }
    // An explicit `undefined` mode is not plain data at all.
    expectRefusal(
      contactOnlySource(),
      "family:unsafe-source",
      { contactForms: [{ formRef: "sales-inquiry", mode: undefined }] },
    );
    expectRefusal(
      contactOnlySource(),
      "family:unsupported-feature",
      { contactForms: [{ formRef: "sales-inquiry", mode: "delivery-off", recipient: "team@example.test" }] },
    );
    expectRefusal(
      contactOnlySource(),
      "family:unsupported-feature",
      { contactForms: [{ formRef: "sales-inquiry", mode: "delivery-off", url: "https://example.test" }] },
    );
    // Envelope shape: non-plain, extra keys and inherited keys.
    expectRefusal(contactOnlySource(), "family:unsupported-feature", null);
    expectRefusal(contactOnlySource(), "family:unsupported-feature", "contactForms");
    expectRefusal(contactOnlySource(), "family:unsupported-feature", { contactForms: "sales-inquiry" });
    expectRefusal(contactOnlySource(), "family:unsupported-feature", {
      contactForms: [{ formRef: "sales-inquiry", mode: "delivery-off" }],
      provider: "acme",
    });
  });

  it("lets one acknowledgement serve repeated references but not two distinct ones", () => {
    const shared = composed(
      {
        version: 1,
        title: "Two contacts",
        sections: [
          { type: "contactForm", formRef: "sales-inquiry" },
          { type: "contactForm", formRef: "sales-inquiry" },
        ],
      },
      contactBinding(),
    );
    expect(shared.sections.map((section) => section.id)).toEqual([
      "family-0-contactform",
      "family-1-contactform",
    ]);
    expect(JSON.stringify(shared)).not.toContain("sales-inquiry");
    // Two distinct references need two distinct acknowledgements, and order does not matter.
    const twoDistinctSource = {
      version: 1,
      title: "Two contacts",
      sections: [
        { type: "contactForm", formRef: "sales-inquiry" },
        { type: "contactForm", formRef: "support-request" },
      ],
    };
    expectRefusal(twoDistinctSource, "family:unsupported-feature", contactBinding());
    const twoAcknowledgements = {
      contactForms: [
        { formRef: "sales-inquiry", mode: "delivery-off" },
        { formRef: "support-request", mode: "delivery-off" },
      ],
    };
    const reversed = {
      contactForms: [
        { formRef: "support-request", mode: "delivery-off" },
        { formRef: "sales-inquiry", mode: "delivery-off" },
      ],
    };
    const forward = composed(twoDistinctSource, twoAcknowledgements);
    expect(JSON.stringify(composed(twoDistinctSource, reversed))).toBe(JSON.stringify(forward));
    expect(forward.sections.map((section) => section.id)).toEqual([
      "family-0-contactform",
      "family-1-contactform",
    ]);
  });

  it("refuses source-authored contact fields, labels and delivery metadata instead of dropping them", () => {
    for (const extra of [
      { fields: [{ name: "email", type: "email" }] },
      { heading: "Contact" },
      { description: "Tell us." },
      { submitLabel: "Send" },
      { title: "Contact" },
      { delivery: "on" },
      { recipient: "team@example.test" },
      { webhook: "https://example.test/hook" },
      { transport: "email" },
      { method: "POST" },
      { action: "/api/contact" },
      { onSubmit: "handler" },
      { style: "color:red" },
      { html: "<form>" },
      { text: "Default copy" },
      { interactive: true },
      { metadata: { provider: "acme" } },
      { provider: "acme" },
      { token: "secret" },
      { name: "sales" },
    ]) {
      expectRefusal(
        envelope({ type: "contactForm", formRef: "sales-inquiry", ...extra }),
        "family:unsupported-feature",
        contactBinding(),
      );
    }
    // A missing or non-string reference is a feature refusal; a malformed one is a target refusal, and an explicit
    // `undefined` is not plain data at all.
    expectRefusal(envelope({ type: "contactForm" }), "family:unsupported-feature", contactBinding());
    expectRefusal(
      envelope({ type: "contactForm", formRef: undefined }),
      "family:unsafe-source",
      contactBinding(),
    );
    for (const formRef of [1, true, null, ["sales-inquiry"], { ref: "sales-inquiry" }]) {
      expectRefusal(envelope({ type: "contactForm", formRef }), "family:unsupported-feature", contactBinding());
    }
    for (const formRef of [
      "",
      "   ",
      " sales-inquiry",
      "sales-inquiry ",
      "Sales-Inquiry",
      "sales_inquiry",
      "sales/inquiry",
      "sales.inquiry",
      "sales@inquiry",
      "-sales-inquiry",
      "s".repeat(65),
    ]) {
      expectRefusal(envelope({ type: "contactForm", formRef }), "family:target-refused", {
        contactForms: [{ formRef, mode: "delivery-off" }],
      });
    }
  });

  it("accepts the full pinned grammar and refuses a ninth acknowledgement or a ninth reference", () => {
    const ref64 = "a".repeat(64);
    const full = composed(
      envelope({ type: "contactForm", formRef: ref64 }),
      { contactForms: [{ formRef: ref64, mode: "delivery-off" }] },
    );
    expect(full.sections[0]?.id).toBe("family-0-contactform");
    expect(JSON.stringify(full)).not.toContain(ref64);
    // Internal and trailing hyphens are inside the pinned donor grammar; the subset never trims or normalises.
    for (const formRef of ["sales-inquiry", "sales-inquiry-", "a-1-b", "9lives"]) {
      expect(
        composed(envelope({ type: "contactForm", formRef }), {
          contactForms: [{ formRef, mode: "delivery-off" }],
        }).sections.length,
      ).toBe(1);
    }
    // One to eight acknowledgements, matching one to eight authored sections.
    const contacts = (count: number): Record<string, unknown>[] =>
      Array.from({ length: count }, (_unused, position) => ({
        type: "contactForm",
        formRef: `form-${position}`,
      }));
    const acknowledgement = (count: number): Record<string, unknown> => ({
      contactForms: Array.from({ length: count }, (_unused, position) => ({
        formRef: `form-${position}`,
        mode: "delivery-off",
      })),
    });
    expect(composed({ version: 1, title: "Eight", sections: contacts(1) }, acknowledgement(1)).sections.length).toBe(1);
    expect(composed({ version: 1, title: "Eight", sections: contacts(8) }, acknowledgement(8)).sections.length).toBe(8);
    expectRefusal({ version: 1, title: "Nine", sections: contacts(8) }, "family:target-refused", acknowledgement(9));
    expectRefusal({ version: 1, title: "Zero", sections: contacts(1) }, "family:target-refused", { contactForms: [] });
    // Nine authored contact sections exceed the acknowledgement bound, so the binder refuses before composition.
    expectRefusal({ version: 1, title: "Nine", sections: contacts(9) }, "family:target-refused", acknowledgement(9));
  });




  it("shares one binder across images and contacts without weakening either exact set", () => {
    const source = {
      version: 1,
      title: "Media and contact",
      sections: [
        { type: "media", image: { src: "/assets/portrait.png", alt: "Portrait of the founder" } },
        {
          type: "gallery",
          columns: 2,
          items: [
            { image: { src: "/assets/scene.webp", alt: "A city square" } },
            { image: { src: "/assets/portrait.png", alt: "Portrait of the founder" } },
          ],
        },
        { type: "contactForm", formRef: "sales-inquiry" },
      ],
    };
    const shared = {
      images: [
        { source: "/assets/portrait.png", owned: { zone: "page", path: "images/portrait.png" } },
        { source: "/assets/scene.webp", owned: { zone: "theme", path: "gallery/scene.webp" } },
      ],
      contactForms: [{ formRef: "sales-inquiry", mode: "delivery-off" }],
    };
    const document = composed(source, shared);
    expect(document.sections.map((section) => section.id)).toEqual([
      "family-0-media",
      "family-1-gallery",
      "family-2-contactform",
    ]);
    // Removing either key leaves unused authority on the other side and refuses the whole Page.
    expectRefusal(source, "family:unsupported-feature", { images: shared.images });
    expectRefusal(source, "family:unsupported-feature", { contactForms: shared.contactForms });
    // Extra image or contact authority refuses too.
    expectRefusal(source, "family:unsupported-feature", {
      ...shared,
      contactForms: [...shared.contactForms, { formRef: "extra-form", mode: "delivery-off" }],
    });
    expectRefusal(source, "family:unsupported-feature", {
      images: [...shared.images, { source: "/assets/spare.png", owned: { zone: "page", path: "images/spare.png" } }],
      contactForms: shared.contactForms,
    });
  });

  it("never invokes a source accessor and refuses hostile contact data as unsafe", () => {
    let getterRuns = 0;
    const hostileSection = (): Record<string, unknown> => {
      const section: Record<string, unknown> = { type: "contactForm" };
      Object.defineProperty(section, "formRef", {
        enumerable: true,
        get() {
          getterRuns += 1;
          return "sales-inquiry";
        },
      });
      return section;
    };
    expectRefusal(envelope(hostileSection()), "family:unsafe-source", contactBinding());
    expectRefusal(contactOnlySource(), "family:unsafe-source", {
      get contactForms() {
        getterRuns += 1;
        return [{ formRef: "sales-inquiry", mode: "delivery-off" }];
      },
    });
    // Entry-level accessors on `formRef` and on `mode`.
    const entryAccessor: Record<string, unknown> = { mode: "delivery-off" };
    Object.defineProperty(entryAccessor, "formRef", {
      enumerable: true,
      get() {
        getterRuns += 1;
        return "sales-inquiry";
      },
    });
    expectRefusal(contactOnlySource(), "family:unsafe-source", { contactForms: [entryAccessor] });
    const modeAccessor: Record<string, unknown> = { formRef: "sales-inquiry" };
    Object.defineProperty(modeAccessor, "mode", {
      enumerable: true,
      get() {
        getterRuns += 1;
        return "delivery-off";
      },
    });
    expectRefusal(contactOnlySource(), "family:unsafe-source", { contactForms: [modeAccessor] });
    // An accessor on the array index itself, a sparse array, a foreign prototype, `__proto__` and a cycle.
    const indexAccessor: unknown[] = [];
    Object.defineProperty(indexAccessor, "0", {
      enumerable: true,
      get() {
        getterRuns += 1;
        return { formRef: "sales-inquiry", mode: "delivery-off" };
      },
    });
    indexAccessor.length = 1;
    expectRefusal(contactOnlySource(), "family:unsafe-source", { contactForms: indexAccessor });
    const sparse: unknown[] = [];
    sparse[1] = { formRef: "sales-inquiry", mode: "delivery-off" };
    expectRefusal(contactOnlySource(), "family:unsafe-source", { contactForms: sparse });
    expectRefusal(
      contactOnlySource(),
      "family:unsafe-source",
      Object.create({ contactForms: [] }) as Record<string, unknown>,
    );
    expectRefusal(contactOnlySource(), "family:unsafe-source", JSON.parse('{"__proto__":{}}') as unknown);
    const cycle: Record<string, unknown> = { contactForms: [] };
    (cycle["contactForms"] as unknown[]).push(cycle);
    expectRefusal(contactOnlySource(), "family:unsafe-source", cycle);
    // A valid older family before or after malicious contact data still refuses the whole Page.
    expectRefusal(
      { version: 1, title: "Mixed", sections: [{ type: "prose", body: "Before." }, hostileSection()] },
      "family:unsafe-source",
      contactBinding(),
    );
    expectRefusal(
      { version: 1, title: "Mixed", sections: [CONTACT_SECTION, { type: "divider", html: "<b>" }] },
      "family:unsupported-feature",
      contactBinding(),
    );
    expect(getterRuns).toBe(0);
  });

  it("keeps the adapter commentary current and never widens the Uno contact renderer", () => {
    const adapter = readFileSync(
      fileURLToPath(new URL("../../src/application/compose-uno-foundation-families.ts", import.meta.url)),
      "utf8",
    );
    expect(adapter).toContain("seventeen Foundation section families");
    expect(adapter).toContain("inert-notice");
    expect(adapter).not.toContain("sixteen Foundation section families");
    expect(adapter).not.toContain("plain-text subset** of seventeen");
    expect(adapter).not.toContain("family-${index}-contactForm");
    // The generated target id is lowercase and conditional, so no prior family id changes spelling.
    expect(adapter).toContain('type === "contactForm" ? `family-${index}-${CONTACT_TARGET_SUFFIX}`');
    const renderer = readFileSync(
      fileURLToPath(new URL("../../src/components/uno-page-sections.tsx", import.meta.url)),
      "utf8",
    );
    expect(renderer).toContain("Delivery is switched off. Nothing entered here is sent or stored.");
    expect(renderer).not.toContain("formRef");
  });
});

/**
 * `UNO-WO-069 / R01`: the `divider` parity candidate.
 *
 * Pinned donor `src/core/page-document.ts` `a12d964c…` declares `z.strictObject({ type: z.literal("divider") })`, and
 * pinned `text-sections.tsx` `caeee577…` renders `DividerSection()` as one native `<hr>` inside an unlabelled `<div>`
 * carrying the `mt-10` (2.5rem) section offset. These cases prove the same authored vocabulary, the same native
 * separator semantics and the same closed refusals on the real adapter, reader and renderer — never a mock node.
 */
describe("composeUnoFoundationSubset — divider semantic parity candidate", () => {
  function dividerSource(): Record<string, unknown> {
    return { version: 1, title: "Divider parity fixture", sections: [{ type: "divider" }] };
  }

  it("composes the complete donor shape {type:\"divider\"} into one frozen divider prose node", () => {
    const source = dividerSource();
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(document.sections).toHaveLength(1);
    const node = document.sections[0]!;
    expect(node.id).toBe("family-0-divider");
    expect(node.module).toBe("content.prose");
    expect(node.props).toEqual({ variant: "divider" });
    expect(Object.keys(node.props)).toEqual(["variant"]);
    expect("children" in node).toBe(false);
    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(node)).toBe(true);
    expect(Object.isFrozen(node.props)).toBe(true);
    expect(() => readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown)).not.toThrow();
    expect(() => readUnoPageDocument(JSON.stringify(document))).not.toThrow();
  });

  it("renders exactly one native, contentless, noninteractive horizontal rule", () => {
    const html = render(composed(dividerSource()));
    const rule = '<hr class="uno-json-divider" id="family-0-divider"/>';
    expect(html).toContain(rule);
    expect(html.match(/<hr/gu) ?? []).toHaveLength(1);
    for (const forbidden of ["<h1", "<h2", "<h3", "<p", "<a ", "<img", "<button", "<form", "<iframe", "tabindex", "role=", "aria-", "href", "src="]) {
      expect(html).not.toContain(forbidden);
    }
    // The root `.uno-json` wrapper carries the one rule and nothing else.
    expect(html.startsWith('<div class="uno-json"')).toBe(true);
    expect(html.endsWith(`>${rule}</div>`)).toBe(true);
  });

  it("refuses every invented divider key, field and nested value with a closed reason and no partial Page", () => {
    const invented: Array<[string, Record<string, unknown>]> = [
      ["a heading", { type: "divider", heading: "Break" }],
      ["a lede", { type: "divider", lede: "Between things." }],
      ["a surface", { type: "divider", surface: "muted" }],
      ["an align", { type: "divider", align: "center" }],
      ["a spacing", { type: "divider", spacing: "lg" }],
      ["children", { type: "divider", children: [] }],
      ["an href", { type: "divider", href: "#next" }],
      ["a style", { type: "divider", style: "color:red" }],
      ["an onClick", { type: "divider", onClick: "run()" }],
      ["raw html", { type: "divider", html: "<hr/>" }],
      ["a script", { type: "divider", script: "alert(1)" }],
      ["a text body", { type: "divider", body: "Not a divider." }],
    ];
    for (const [label, section] of invented) {
      expectRefusal(envelope(section), "family:unsupported-feature");
      // The refusal must be about this section, not a silent drop: the same envelope with a real divider composes.
      expect(composed(envelope({ type: "divider" })).sections).toHaveLength(1);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("refuses a malformed or non-string divider type before composing any node", () => {
    // Strings that are not the exact donor literal are outside the family vocabulary; non-string types are refused
    // as an out-of-subset feature. Both are closed literals and neither returns a partial Page.
    for (const type of ["Divider", "DIVIDER", "divider ", ""]) {
      expectRefusal(envelope({ type }), "family:unsupported-family");
    }
    for (const type of [7, null, { type: "divider" }, ["divider"]]) {
      expectRefusal(envelope({ type }), "family:unsupported-feature");
    }
  });

  it("refuses an accessor divider and a hostile sibling without invoking any getter", () => {
    let runs = 0;
    const hostile: Record<string, unknown> = { type: "divider" };
    Object.defineProperty(hostile, "heading", { enumerable: true, get() { runs += 1; return "Break"; } });
    expectRefusal(envelope(hostile), "family:unsafe-source");
    expect(runs).toBe(0);
    // A valid neighbour plus a hostile divider refuses the WHOLE Page: the good section is never partially returned.
    expectRefusal(
      {
        version: 1,
        title: "Mixed divider fixture",
        sections: [{ type: "prose", body: "A plain paragraph." }, hostile],
      },
      "family:unsafe-source",
    );
    expect(runs).toBe(0);
  });

  it("keeps the divider between list and hero in the real thirteen-section fixture order", () => {
    const document = composed(thirteenSectionSource());
    expect(document.sections).toHaveLength(13);
    const divider = document.sections[4]!;
    expect(divider.id).toBe("family-4-divider");
    expect(divider.module).toBe("content.prose");
    expect(divider.props).toEqual({ variant: "divider" });
    expect(document.sections[3]!.id).toBe("family-3-list");
    expect(document.sections[5]!.id).toBe("family-5-hero");
    const html = render(document);
    expect(html).toContain('<hr class="uno-json-divider" id="family-4-divider"/>');
    expect(html.match(/<hr/gu) ?? []).toHaveLength(1);
  });
});

/**
 * `UNO-WO-069 / R01`: the single authorized presentation correction, asserted at source level.
 *
 * The donor expresses a 2.5rem section offset (`mt-10`). Uno's root is a 1.5rem flex column, so the divider's own
 * vertical margin must be 1rem to reach 2.5rem on each side without inventing a wrapper. Nothing else may change.
 */
describe("divider presentation contract in the Uno stylesheet", () => {
  const css = readFileSync(fileURLToPath(new URL("../../src/app/globals.css", import.meta.url)), "utf8");

  function block(selector: string): string {
    const start = css.indexOf(`\n${selector} {`);
    expect(start).toBeGreaterThan(-1);
    const end = css.indexOf("}", start);
    return css.slice(start, end + 1);
  }

  it("keeps the one divider rule scoped, themed and corrected to a 1rem vertical margin", () => {
    const divider = block(".uno-json-divider");
    expect(css.split(".uno-json-divider {").length - 1).toBe(1);
    expect(divider).toContain("margin: 1rem 0;");
    expect(divider).toContain("border: 0;");
    expect(divider).toContain("border-top: 1px solid var(--uno-border);");
    expect(divider).not.toContain("1.5rem 0");
    expect(css).not.toContain("margin: 1.5rem 0;");
    // The 1.5rem flex gap and the vertical column root are unchanged, so 1.5 + 1 = 2.5rem is the whole offset.
    const root = block(".uno-json");
    expect(root).toContain("display: flex;");
    expect(root).toContain("flex-direction: column;");
    expect(root).toContain("gap: 1.5rem;");
  });

  it("declares no animation, transition, focus or width override for the divider", () => {
    const divider = block(".uno-json-divider");
    for (const forbidden of ["animation", "transition", ":focus", "width", "height", "position", "cursor"]) {
      expect(divider).not.toContain(forbidden);
    }
  });
});

/**
 * `UNO-WO-070 / R01`: the donor's optional authored section heading for the two bounded grid families.
 *
 * Pinned donor `page-document.ts` `a12d964c…` gives `cards` and `features` `headingFields` (optional `heading`), and
 * `section-support.tsx` `19c9bee3…` renders `SectionHeading` as the section `<h2>` while `ItemTitle` renders each item
 * `<h3>`. Uno already owns `layout.stack`, `content.heading`, `layout.grid` and `content.prose`, so the new mode is a
 * composition, never a new module. When no heading is authored the old grid — with level-2 item titles and no section
 * heading — must stay byte-identical.
 */
describe("composeUnoFoundationSubset — cards and features authored heading", () => {
  /** The committed pre-WO-070 output for the identical unheaded cards source, captured before the change. */
  const LEGACY_CARDS =
    '{"id":"family-0-cards","module":"layout.grid","props":{"columns":2,"itemSemantics":"list"},"children":[{"id":"family-0-cards-item-0","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-cards-item-0-title","module":"content.heading","props":{"text":"Card one","level":2}},{"id":"family-0-cards-item-0-body","module":"content.prose","props":{"text":"First card body."}}]},{"id":"family-0-cards-item-1","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-cards-item-1-title","module":"content.heading","props":{"text":"Card two","level":2}}]}]}';
  const LEGACY_FEATURES =
    '{"id":"family-0-features","module":"layout.grid","props":{"columns":3,"itemSemantics":"list"},"children":[{"id":"family-0-features-item-0","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-features-item-0-title","module":"content.heading","props":{"text":"Feature one","level":2}},{"id":"family-0-features-item-0-body","module":"content.prose","props":{"text":"First feature body."}}]},{"id":"family-0-features-item-1","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-features-item-1-title","module":"content.heading","props":{"text":"Feature two","level":2}}]}]}';

  /** One unheaded cards Page, exactly the source used for the captured baseline. */
  function unheadedCards(): Record<string, unknown> {
    return {
      version: 1,
      title: "Baseline",
      sections: [
        {
          type: "cards",
          columns: 2,
          items: [
            { title: "Card one", body: "First card body." },
            { title: "Card two" },
          ],
        },
      ],
    };
  }

  /** One unheaded features Page, exactly the source used for the captured baseline. */
  function unheadedFeatures(): Record<string, unknown> {
    return {
      version: 1,
      title: "Baseline",
      sections: [
        {
          type: "features",
          columns: 3,
          items: [
            { title: "Feature one", body: "First feature body." },
            { title: "Feature two" },
          ],
        },
      ],
    };
  }

  /** One headed source of either grid family, with two titles and one authored body. */
  function headedSource(type: "cards" | "features", columns: 2 | 3 | 4, heading: unknown = "Synthetic cards"): Record<string, unknown> {
    return {
      version: 1,
      title: "Headed fixture",
      sections: [
        {
          type,
          heading,
          columns,
          items: [
            { title: type === "cards" ? "Card one" : "Feature one", body: type === "cards" ? "First card body." : "First feature body." },
            { title: type === "cards" ? "Card two" : "Feature two" },
          ],
        },
      ],
    };
  }

  it("keeps the heading-less cards node byte-identical to the pre-WO-070 committed output", () => {
    const document = composed(unheadedCards());
    expect(JSON.stringify(document.sections[0])).toBe(LEGACY_CARDS);
    expect(document.sections[0]!.module).toBe("layout.grid");
    expect(document.sections[0]!.id).toBe("family-0-cards");
    expect(Object.keys(document.sections[0]!.props)).toEqual(["columns", "itemSemantics"]);
  });

  it("keeps the heading-less features node byte-identical to the pre-WO-070 committed output", () => {
    const document = composed(unheadedFeatures());
    expect(JSON.stringify(document.sections[0])).toBe(LEGACY_FEATURES);
    expect(document.sections[0]!.module).toBe("layout.grid");
    expect(document.sections[0]!.id).toBe("family-0-features");
  });



  it("composes the headed cards source into one stack with an authored h2 and level-3 item titles", () => {
    const source = headedSource("cards", 2, "Synthetic cards");
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(document.sections).toHaveLength(1);
    const section = document.sections[0]!;
    expect(section.id).toBe("family-0-cards");
    expect(section.module).toBe("layout.stack");
    expect(JSON.stringify(section.props)).toBe("{}");
    if (section.module !== "layout.stack") return;
    expect(section.children).toHaveLength(2);
    const [heading, grid] = section.children;
    expect(heading!.id).toBe("family-0-cards-heading");
    expect(heading!.module).toBe("content.heading");
    expect(heading!.props).toEqual({ text: "Synthetic cards", level: 2 });
    expect(grid!.id).toBe("family-0-cards-grid");
    expect(grid!.module).toBe("layout.grid");
    expect(grid!.props).toEqual({ columns: 2, itemSemantics: "list" });
    if (grid!.module !== "layout.grid") return;
    expect(grid!.children.map((item) => item.id)).toEqual(["family-0-cards-item-0", "family-0-cards-item-1"]);
    const [first, second] = grid!.children;
    expect(first!.props).toEqual({ gap: "tight" });
    if (first!.module !== "layout.stack") return;
    expect(first!.children.map((child) => child.id)).toEqual(["family-0-cards-item-0-title", "family-0-cards-item-0-body"]);
    expect(first!.children[0]!.props).toEqual({ text: "Card one", level: 3 });
    expect(first!.children[1]!.props).toEqual({ text: "First card body." });
    if (second!.module !== "layout.stack") return;
    expect(second!.children).toHaveLength(1);
    expect(second!.children[0]!.props).toEqual({ text: "Card two", level: 3 });
    // Deep freeze down to the item props, and the real reader accepts both forms.
    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(section)).toBe(true);
    expect(Object.isFrozen(section.props)).toBe(true);
    expect(Object.isFrozen(section.children)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.props)).toBe(true);
    expect(Object.isFrozen(first.children[0]!.props)).toBe(true);
    expect(readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown).accepted).toBe(true);
    expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
  });

  it("composes the headed features source with the same stack, h2 and level-3 item outline", () => {
    const document = composed(headedSource("features", 3, "Synthetic features"));
    const section = document.sections[0]!;
    expect(section.id).toBe("family-0-features");
    expect(section.module).toBe("layout.stack");
    expect(JSON.stringify(section.props)).toBe("{}");
    if (section.module !== "layout.stack") return;
    expect(section.children[0]!.id).toBe("family-0-features-heading");
    expect(section.children[0]!.props).toEqual({ text: "Synthetic features", level: 2 });
    expect(section.children[1]!.id).toBe("family-0-features-grid");
    expect(section.children[1]!.props).toEqual({ columns: 3, itemSemantics: "list" });
    if (section.children[1]!.module !== "layout.grid") return;
    expect(section.children[1]!.children.map((item) => item.id)).toEqual(["family-0-features-item-0", "family-0-features-item-1"]);
    expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
  });


  it("accepts a standalone headed family as the first Page section and keeps the h2-before-h3 order honest", () => {
    for (const type of ["cards", "features"] as const) {
      const document = composed(headedSource(type, type === "cards" ? 2 : 3));
      const outcome = readUnoPageDocument(JSON.stringify(document));
      expect(outcome.accepted).toBe(true);
      if (outcome.accepted !== true) continue;
      expect(outcome.document.sections).toHaveLength(1);
      // The risk this case exists for: a level-3 item title with no authored level-2 heading is refused by the reader.
      const orphaned = {
        version: 1,
        title: "Orphaned outline",
        sections: [
          {
            id: `family-0-${type}`,
            module: "layout.grid",
            props: { columns: 2, itemSemantics: "list" },
            children: [
              {
                id: `family-0-${type}-item-0`,
                module: "layout.stack",
                props: { gap: "tight" },
                children: [
                  { id: `family-0-${type}-item-0-title`, module: "content.heading", props: { text: "Orphan", level: 3 } },
                ],
              },
            ],
          },
        ],
      };
      const refused = readUnoPageDocument(JSON.stringify(orphaned));
      expect(refused.accepted).toBe(false);
      if (refused.accepted === false) expect(refused.reason).toBe("document:heading-order");
    }
  });

  it("resets the authored heading order across a mixed two-family Page in both orders", () => {
    const both = (order: readonly ("cards" | "features")[]) => ({
      version: 1,
      title: "Mixed headed",
      sections: order.map((type) => ({
        type,
        heading: type === "cards" ? "Synthetic cards" : "Synthetic features",
        columns: 2,
        items: [{ title: `${type} one` }, { title: `${type} two` }],
      })),
    });
    for (const order of [["cards", "features"], ["features", "cards"]] as const) {
      const document = composed(both(order));
      expect(document.sections.map((section) => section.id)).toEqual(order.map((type, index) => `family-${index}-${type}`));
      for (const [index, type] of order.entries()) {
        const section = document.sections[index]!;
        expect(section.module).toBe("layout.stack");
        if (section.module !== "layout.stack") continue;
        expect(section.children[0]!.props).toEqual({
          text: type === "cards" ? "Synthetic cards" : "Synthetic features",
          level: 2,
        });
        const grid = section.children[1]!;
        if (grid.module !== "layout.grid") continue;
        expect(grid.children.map((item) => item.id)).toEqual([`family-${index}-${type}-item-0`, `family-${index}-${type}-item-1`]);
        for (const [itemIndex, item] of grid.children.entries()) {
          if (item.module !== "layout.stack") continue;
          expect(item.children[0]!.props).toEqual({ text: `${type} ${itemIndex === 0 ? "one" : "two"}`, level: 3 });
        }
      }
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });

  it("renders the headed regions with one authored h2, one h3 per item and no invented markup", () => {
    const html = render(composed(headedSource("cards", 2, 'Plans & "prices"')));
    const start = html.indexOf('id="family-0-cards"');
    expect(start).toBeGreaterThan(0);
    const region = html.slice(start - 60, html.length);
    expect(region).toContain('<div class="uno-json-stack" data-uno-gap="normal" id="family-0-cards">');
    expect(region).toContain('<h2 class="uno-json-heading" id="family-0-cards-heading">Plans &amp; &quot;prices&quot;</h2>');
    expect(region).toContain('id="family-0-cards-grid"');
    expect(region).toContain('data-uno-item-semantics="list"');
    expect(region).toContain('role="list"');
    expect((region.match(/<li class="uno-json-cell"/gu) ?? []).length).toBe(2);
    expect(region).toContain('<h3 class="uno-json-heading" id="family-0-cards-item-0-title">Card one</h3>');
    expect(region).toContain('<h3 class="uno-json-heading" id="family-0-cards-item-1-title">Card two</h3>');
    expect((region.match(/<p class="uno-json-prose"/gu) ?? []).length).toBe(1);
    expect(region).toContain('<p class="uno-json-prose" id="family-0-cards-item-0-body">First card body.</p>');
    expect(region.indexOf("<h2")).toBeGreaterThan(0);
    expect(region.indexOf("<h2")).toBeLessThan(region.indexOf("<h3"));
    expect((region.match(/<h2/gu) ?? []).length).toBe(1);
    expect((region.match(/<h3/gu) ?? []).length).toBe(2);
    for (const forbidden of ["<h1", "<h4", "<a ", "<img", "<script", "<iframe", "<button", "<form", "onclick", "<article"]) {
      expect(region).not.toContain(forbidden);
    }
  });

  it("invents no section heading and keeps level-2 item titles for an unheaded source", () => {
    for (const type of ["cards", "features"] as const) {
      const document = composed(type === "cards" ? unheadedCards() : unheadedFeatures());
      const html = render(document);
      expect(html).not.toContain(`id="family-0-${type}-heading"`);
      expect(html).not.toContain(`id="family-0-${type}-grid"`);
      expect(html).toContain(`id="family-0-${type}"`);
      expect((html.match(/<h2 class="uno-json-heading"/gu) ?? []).length).toBe(2);
      expect(html).not.toContain("<h3");
      expect(html).not.toContain("uno-json-stack\" data-uno-gap=\"normal\"");
    }
  });


  it("accepts exactly 160 code points, counting astral characters once each", () => {
    const bmp = "x".repeat(160);
    const astral = "\u{1F600}".repeat(160);
    expect(Array.from(astral)).toHaveLength(160);
    for (const type of ["cards", "features"] as const) {
      const bmpDocument = composed(headedSource(type, 2, bmp));
      const section = bmpDocument.sections[0]!;
      expect(section.module).toBe("layout.stack");
      if (section.module === "layout.stack") expect(section.children[0]!.props).toEqual({ text: bmp, level: 2 });
      const astralDocument = composed(headedSource(type, 2, astral));
      const astralSection = astralDocument.sections[0]!;
      expect(astralSection.module).toBe("layout.stack");
      if (astralSection.module === "layout.stack") expect(astralSection.children[0]!.props).toEqual({ text: astral, level: 2 });
      expect(readUnoPageDocument(JSON.stringify(astralDocument)).accepted).toBe(true);
    }
  });

  it("refuses every malformed heading with the closed reason that matches its cause", () => {
    const cases: Array<[string, unknown, string]> = [
      ["a number", 7, "family:unsupported-feature"],
      ["null", null, "family:unsupported-feature"],
      ["an object", { text: "Heading" }, "family:unsupported-feature"],
      ["an empty string", "", "family:target-refused"],
      ["whitespace only", "   ", "family:target-refused"],
      ["a leading space", " Heading", "family:target-refused"],
      ["a trailing space", "Heading ", "family:target-refused"],
      ["161 code points", "x".repeat(161), "family:target-refused"],
      ["bold", "**Bold**", "family:unsupported-feature"],
      ["italic", "*Italic*", "family:unsupported-feature"],
      ["a backtick", "`code`", "family:unsupported-feature"],
      ["a link", "[label](https://example.com)", "family:unsupported-feature"],
      ["an ATX heading", "# Heading", "family:unsupported-feature"],
    ];
    for (const type of ["cards", "features"] as const) {
      for (const [label, heading, reason] of cases) {
        expectRefusal(envelope({ type, heading, columns: 2, items: [{ title: "One" }] }), reason);
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });

  it("refuses unsafe heading text, an accessor heading and a hostile neighbour without running a getter", () => {
    for (const type of ["cards", "features"] as const) {
      expectRefusal(envelope({ type, heading: "<script>alert(1)</script>", columns: 2, items: [{ title: "One" }] }), "family:unsupported-feature");
      expectRefusal(envelope({ type, heading: "Two\nlines", columns: 2, items: [{ title: "One" }] }), "family:unsupported-feature");
      expectRefusal(envelope({ type, heading: "Lead \uD800 tail", columns: 2, items: [{ title: "One" }] }), "family:target-refused");
    }
    let runs = 0;
    const hostile: Record<string, unknown> = { type: "cards", columns: 2, items: [{ title: "One" }] };
    Object.defineProperty(hostile, "heading", { enumerable: true, get() { runs += 1; return "Read me"; } });
    expectRefusal(envelope(hostile), "family:unsafe-source");
    expect(runs).toBe(0);
    expectRefusal(
      {
        version: 1,
        title: "Mixed headed fixture",
        sections: [{ type: "prose", body: "A plain paragraph." }, hostile],
      },
      "family:unsafe-source",
    );
    expect(runs).toBe(0);
  });

  it("still refuses every out-of-subset cards and features donor field, headed or not", () => {
    for (const type of ["cards", "features"] as const) {
      const base = { type, heading: "Headed", columns: 2, items: [{ title: "One" }] };
      // `lede` is now accepted (see the dedicated lede section); every other donor field stays out of this subset.
      expectRefusal(envelope({ ...base, surface: "muted" }), "family:unsupported-feature");
      expectRefusal(envelope({ ...base, href: "#next" }), "family:unsupported-feature");
      expectRefusal(envelope({ ...base, style: "color:red" }), "family:unsupported-feature");
      expectRefusal(envelope({ ...base, onClick: "run()" }), "family:unsupported-feature");
      expectRefusal(envelope({ type, heading: "Headed", items: [{ title: "One" }] }), "family:unsupported-feature");
      expectRefusal(envelope({ ...base, columns: 5 }), "family:target-refused");
      expectRefusal(
        envelope({ ...base, items: [{ title: "One", image: { src: "/x.png", alt: "x" } }] }),
        "family:unsupported-feature",
      );
      expectRefusal(envelope({ ...base, items: [{ title: "One", meta: "Meta" }] }), "family:unsupported-feature");
      expectRefusal(envelope({ ...base, items: [{ title: "One", action: { label: "Go", href: "#go" } }] }), "family:unsupported-feature");
      expectRefusal(envelope({ ...base, items: [{ title: "One", icon: "star" }] }), "family:unsupported-feature");
    }
  });
});

/**
 * `UNO-WO-071 / R01`: the donor's optional authored section lede for the two bounded grid families.
 *
 * The donor `lede` is Markdown-capable (`markdownTextSchema`); this subset accepts one literal plain-text string and
 * renders it as `content.prose {text}` in source order above the native item list. No heading is ever synthesized and no
 * input without a lede changes its JSON.
 */
describe("composeUnoFoundationSubset — cards and features authored lede", () => {
  /** The four pre-WO-071 section baselines, captured from the committed output before this change. */
  const PRE_WO071_CARDSUNHEADED =
    '{"id":"family-0-cards","module":"layout.grid","props":{"columns":2,"itemSemantics":"list"},"children":[{"id":"family-0-cards-item-0","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-cards-item-0-title","module":"content.heading","props":{"text":"Card one","level":2}},{"id":"family-0-cards-item-0-body","module":"content.prose","props":{"text":"First card body."}}]},{"id":"family-0-cards-item-1","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-cards-item-1-title","module":"content.heading","props":{"text":"Card two","level":2}}]}]}';
  const PRE_WO071_CARDSHEADEDONLY =
    '{"id":"family-0-cards","module":"layout.stack","props":{},"children":[{"id":"family-0-cards-heading","module":"content.heading","props":{"text":"Synthetic cards","level":2}},{"id":"family-0-cards-grid","module":"layout.grid","props":{"columns":2,"itemSemantics":"list"},"children":[{"id":"family-0-cards-item-0","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-cards-item-0-title","module":"content.heading","props":{"text":"Card one","level":3}},{"id":"family-0-cards-item-0-body","module":"content.prose","props":{"text":"First card body."}}]},{"id":"family-0-cards-item-1","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-cards-item-1-title","module":"content.heading","props":{"text":"Card two","level":3}}]}]}]}';
  const PRE_WO071_FEATURESUNHEADED =
    '{"id":"family-0-features","module":"layout.grid","props":{"columns":3,"itemSemantics":"list"},"children":[{"id":"family-0-features-item-0","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-features-item-0-title","module":"content.heading","props":{"text":"Feature one","level":2}},{"id":"family-0-features-item-0-body","module":"content.prose","props":{"text":"First feature body."}}]},{"id":"family-0-features-item-1","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-features-item-1-title","module":"content.heading","props":{"text":"Feature two","level":2}}]}]}';
  const PRE_WO071_FEATURESHEADEDONLY =
    '{"id":"family-0-features","module":"layout.stack","props":{},"children":[{"id":"family-0-features-heading","module":"content.heading","props":{"text":"Synthetic features","level":2}},{"id":"family-0-features-grid","module":"layout.grid","props":{"columns":3,"itemSemantics":"list"},"children":[{"id":"family-0-features-item-0","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-features-item-0-title","module":"content.heading","props":{"text":"Feature one","level":3}},{"id":"family-0-features-item-0-body","module":"content.prose","props":{"text":"First feature body."}}]},{"id":"family-0-features-item-1","module":"layout.stack","props":{"gap":"tight"},"children":[{"id":"family-0-features-item-1-title","module":"content.heading","props":{"text":"Feature two","level":3}}]}]}]}';

  /** One cards/features source with the caller-chosen heading and lede fields. */
  function ledePage(
    type: "cards" | "features",
    fields: Record<string, unknown>,
    columns: 2 | 3 | 4 = type === "cards" ? 2 : 3,
  ): Record<string, unknown> {
    const titled = type === "cards"
      ? [{ title: "Card one", body: "First card body." }, { title: "Card two" }]
      : [{ title: "Feature one", body: "First feature body." }, { title: "Feature two" }];
    return { version: 1, title: "Lede fixture", sections: [{ type, ...fields, columns, items: titled }] };
  }

  it("keeps all four pre-WO-071 baselines byte-identical when no lede is authored", () => {
    expect(JSON.stringify(composed(ledePage("cards", {})).sections[0])).toBe(PRE_WO071_CARDSUNHEADED);
    expect(JSON.stringify(composed(ledePage("cards", { heading: "Synthetic cards" })).sections[0])).toBe(PRE_WO071_CARDSHEADEDONLY);
    expect(JSON.stringify(composed(ledePage("features", {})).sections[0])).toBe(PRE_WO071_FEATURESUNHEADED);
    expect(JSON.stringify(composed(ledePage("features", { heading: "Synthetic features" })).sections[0])).toBe(PRE_WO071_FEATURESHEADEDONLY);
  });



  it("composes heading+lede for cards as an ordered heading, lede paragraph and grid", () => {
    const source = ledePage("cards", { heading: "Synthetic cards", lede: "Synthetic cards explain the choices." });
    const before = JSON.stringify(source);
    const document = composed(source);
    expect(JSON.stringify(source)).toBe(before);
    const section = document.sections[0]!;
    expect(section.id).toBe("family-0-cards");
    expect(section.module).toBe("layout.stack");
    expect(JSON.stringify(section.props)).toBe("{}");
    if (section.module !== "layout.stack") return;
    expect(section.children).toHaveLength(3);
    const [heading, lede, grid] = section.children;
    expect(heading!.id).toBe("family-0-cards-heading");
    expect(heading!.module).toBe("content.heading");
    expect(heading!.props).toEqual({ text: "Synthetic cards", level: 2 });
    expect(lede!.id).toBe("family-0-cards-lede");
    expect(lede!.module).toBe("content.prose");
    expect(lede!.props).toEqual({ text: "Synthetic cards explain the choices." });
    expect(grid!.id).toBe("family-0-cards-grid");
    expect(grid!.props).toEqual({ columns: 2, itemSemantics: "list" });
    if (grid!.module !== "layout.grid") return;
    expect(grid!.children.map((item) => item.id)).toEqual(["family-0-cards-item-0", "family-0-cards-item-1"]);
    for (const [index, item] of grid!.children.entries()) {
      if (item.module !== "layout.stack") continue;
      expect(item.children[0]!.props).toEqual({ text: index === 0 ? "Card one" : "Card two", level: 3 });
      expect(item.children.filter((child) => child.module === "content.prose")).toHaveLength(index === 0 ? 1 : 0);
    }
    // Deep freeze, real reader re-acceptance as object and JSON, and JSON roundtrip stability.
    expect(Object.isFrozen(section)).toBe(true);
    expect(Object.isFrozen(section.children)).toBe(true);
    expect(Object.isFrozen(lede!.props)).toBe(true);
    expect(Object.isFrozen(grid!.props)).toBe(true);
    const asObject = readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown);
    const asJson = readUnoPageDocument(JSON.stringify(document));
    expect(asObject.accepted).toBe(true);
    expect(asJson.accepted).toBe(true);
    expect(JSON.stringify(document)).toBe(JSON.stringify(JSON.parse(JSON.stringify(document)) as unknown));
  });

  it("composes heading+lede for features with the same three ordered children", () => {
    const document = composed(ledePage("features", { heading: "Synthetic features", lede: "Synthetic features describe the work." }));
    const section = document.sections[0]!;
    expect(section.id).toBe("family-0-features");
    expect(section.module).toBe("layout.stack");
    if (section.module !== "layout.stack") return;
    expect(section.children.map((child) => child.id)).toEqual([
      "family-0-features-heading",
      "family-0-features-lede",
      "family-0-features-grid",
    ]);
    expect(section.children[1]!.props).toEqual({ text: "Synthetic features describe the work." });
    expect(section.children[2]!.props).toEqual({ columns: 3, itemSemantics: "list" });
    expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
  });

  it("composes lede-only for both families with level-2 item titles and no synthetic heading", () => {
    for (const type of ["cards", "features"] as const) {
      const page = ledePage(type, { lede: "A plain authored lede." });
      const document = composed(page);
      const section = document.sections[0]!;
      expect(document.sections).toHaveLength(1);
      expect(section.id).toBe(`family-0-${type}`);
      expect(section.module).toBe("layout.stack");
      expect(JSON.stringify(section.props)).toBe("{}");
      if (section.module !== "layout.stack") continue;
      expect(section.children).toHaveLength(2);
      const [lede, grid] = section.children;
      expect(lede!.id).toBe(`family-0-${type}-lede`);
      expect(lede!.module).toBe("content.prose");
      expect(lede!.props).toEqual({ text: "A plain authored lede." });
      expect(grid!.id).toBe(`family-0-${type}-grid`);
      if (grid!.module !== "layout.grid") continue;
      // The heading-less outline is preserved: item titles stay level 2 and no heading is invented.
      for (const [index, item] of grid!.children.entries()) {
        if (item.module !== "layout.stack") continue;
        const title = item.children[0]!;
        expect(title.module).toBe("content.heading");
        expect(title.props).toEqual({ text: type === "cards" ? (index === 0 ? "Card one" : "Card two") : (index === 0 ? "Feature one" : "Feature two"), level: 2 });
        expect(title.id).toBe(`family-0-${type}-item-${index}-title`);
      }
      expect(section.children.some((child) => child.module === "content.heading")).toBe(false);
      // Standalone as the first Page section, and accepted by the unchanged reader as object and JSON.
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      expect(readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown).accepted).toBe(true);
    }
  });

  it("keeps authored order and ids for lede-bearing families mixed with the divider in either order", () => {
    const divider = { type: "divider" };
    const cards = { type: "cards", heading: "Synthetic cards", lede: "A cards lede.", columns: 2, items: [{ title: "Card one" }] };
    const features = { type: "features", lede: "A features lede.", columns: 3, items: [{ title: "Feature one" }] };
    for (const sections of [[divider, cards, features], [features, divider, cards]] as const) {
      const document = composed({ version: 1, title: "Mixed lede", sections });
      expect(document.sections.map((section) => section.id)).toEqual(
        sections.map((section, index) => `family-${index}-${section.type}`),
      );
      expect(document.sections.filter((section) => section.module === "layout.stack")).toHaveLength(2);
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });


  it("renders exactly one escaped lede paragraph between the authored heading and the native list", () => {
    const document = composed(ledePage("cards", { heading: "Synthetic cards", lede: 'Plans & "prices" stay plain' }));
    const html = render(document);
    const start = html.indexOf('id="family-0-cards"');
    expect(start).toBeGreaterThan(0);
    const region = html.slice(start - 60, html.length);
    expect(region).toContain('<p class="uno-json-prose" id="family-0-cards-lede">Plans &amp; &quot;prices&quot; stay plain</p>');
    expect((region.match(/family-0-cards-lede/gu) ?? []).length).toBe(1);
    expect((region.match(/<p class="uno-json-prose"/gu) ?? []).length).toBe(2);
    expect(region.indexOf("<h2")).toBeGreaterThan(0);
    expect(region.indexOf("<h2")).toBeLessThan(region.indexOf("family-0-cards-lede"));
    expect(region.indexOf("family-0-cards-lede")).toBeLessThan(region.indexOf("<ul"));
    expect((region.match(/<h2/gu) ?? []).length).toBe(1);
    expect((region.match(/<h3/gu) ?? []).length).toBe(2);
    for (const forbidden of ["<h1", "<h4", "<a ", "<img", "<script", "<iframe", "<button", "<form", "onclick", "<article"]) {
      expect(region).not.toContain(forbidden);
    }
  });

  it("renders lede-only as one paragraph before the list with level-2 item titles and no invented heading", () => {
    for (const type of ["cards", "features"] as const) {
      const html = render(composed(ledePage(type, { lede: "A plain authored lede." })));
      const start = html.indexOf(`id="family-0-${type}"`);
      expect(start).toBeGreaterThan(0);
      const region = html.slice(start - 60, html.length);
      expect(region).toContain(`<p class="uno-json-prose" id="family-0-${type}-lede">A plain authored lede.</p>`);
      expect(region.indexOf(`family-0-${type}-lede`)).toBeLessThan(region.indexOf("<ul"));
      expect((region.match(/<h2 class="uno-json-heading"/gu) ?? []).length).toBe(2);
      expect(region).not.toContain("<h3");
      expect(region).not.toContain(`id="family-0-${type}-heading"`);
      expect((region.match(/<li class="uno-json-cell"/gu) ?? []).length).toBe(2);
    }
  });

  it("accepts 4000 code points, including astral characters, and refuses 4001", () => {
    const bmp = "x".repeat(4000);
    const astral = "\u{1F600}".repeat(4000);
    expect(Array.from(astral)).toHaveLength(4000);
    for (const type of ["cards", "features"] as const) {
      for (const text of [bmp, astral, "Grüße — 日本語 ✓"]) {
        const document = composed(ledePage(type, { lede: text }));
        const section = document.sections[0]!;
        expect(section.module).toBe("layout.stack");
        if (section.module === "layout.stack") expect(section.children[0]!.props).toEqual({ text });
        expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      }
      expectRefusal(ledePage(type, { lede: `${bmp}x` }), "family:target-refused");
      expectRefusal(ledePage(type, { lede: `${astral}\u{1F600}` }), "family:target-refused");
    }
  });


  it("refuses every malformed lede with the closed reason that matches its cause", () => {
    const cases: Array<[string, unknown, string]> = [
      ["a number", 7, "family:unsupported-feature"],
      ["null", null, "family:unsupported-feature"],
      ["an array", ["A lede."], "family:unsupported-feature"],
      ["an object", { text: "A lede." }, "family:unsupported-feature"],
      ["a boolean", true, "family:unsupported-feature"],
      ["an empty string", "", "family:target-refused"],
      ["whitespace only", "   ", "family:target-refused"],
      ["a leading space", " Lede", "family:target-refused"],
      ["a trailing space", "Lede ", "family:target-refused"],
      ["bold", "**Bold**", "family:unsupported-feature"],
      ["asterisk italic", "*Italic*", "family:unsupported-feature"],
      ["underscore italic", "_Italic_", "family:unsupported-feature"],
      ["strike", "~~Strike~~", "family:unsupported-feature"],
      ["a backtick", "`code`", "family:unsupported-feature"],
      ["a link", "[label](https://example.com)", "family:unsupported-feature"],
      ["an image", "![alt](https://example.com/i.png)", "family:unsupported-feature"],
      ["a heading", "# Heading", "family:unsupported-feature"],
      ["a bullet entry", "- entry", "family:unsupported-feature"],
      ["an ordered entry", "1. entry", "family:unsupported-feature"],
      ["a blockquote", "> quote", "family:unsupported-feature"],
    ];
    for (const type of ["cards", "features"] as const) {
      for (const [label, lede, reason] of cases) {
        expectRefusal(ledePage(type, { lede }), reason);
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });

  it("refuses markup, control characters, unpaired surrogates and an accessor lede with zero getter runs", () => {
    for (const type of ["cards", "features"] as const) {
      expectRefusal(ledePage(type, { lede: "<script>alert(1)</script>" }), "family:unsupported-feature");
      expectRefusal(ledePage(type, { lede: "a < b" }), "family:unsupported-feature");
      expectRefusal(ledePage(type, { lede: "Two\nlines" }), "family:unsupported-feature");
      expectRefusal(ledePage(type, { lede: "Tabbed\ttext" }), "family:unsupported-feature");
      expectRefusal(ledePage(type, { lede: "Nul\u0000text" }), "family:unsupported-feature");
      expectRefusal(ledePage(type, { lede: "Lead \uD800 tail" }), "family:target-refused");
    }
    for (const type of ["cards", "features"] as const) {
      let runs = 0;
      const hostile: Record<string, unknown> = { type, columns: 2, items: [{ title: "One" }] };
      Object.defineProperty(hostile, "lede", { enumerable: true, get() { runs += 1; return "Read me"; } });
      expectRefusal(envelope(hostile), "family:unsafe-source");
      expect(runs).toBe(0);
      expectRefusal(
        { version: 1, title: "Hostile lede fixture", sections: [{ type: "prose", body: "A plain paragraph." }, hostile] },
        "family:unsafe-source",
      );
      expect(runs).toBe(0);
      expectRefusal(
        {
          version: 1,
          title: "Hostile lede fixture",
          sections: [hostile, { type, heading: "Header", columns: 2, items: [{ title: "One" }] }],
        },
        "family:unsafe-source",
      );
      expect(runs).toBe(0);
    }
  });

  it("keeps the lede subset recorded in the ledger without claiming a second parity family", () => {
    const ledger = readFileSync(".documents/Architecture/u04-family-parity.md", "utf8");
    expect(ledger.split("plain-text `lede`").length - 1).toBeGreaterThanOrEqual(2);
    expect(ledger).toContain("heading+lede");
    expect(ledger).toContain("lede-only");
    expect(ledger).toContain("no-lede");
    expect(ledger).toContain("**UNIMPLEMENTED (0):** none.");
    expect(ledger).toContain("eleven of seventeen fully parity-evidenced candidates");
    expect(ledger).not.toContain("2/17");
    expect(ledger).not.toContain("3/17");
    expect(ledger).not.toMatch(/cards[^.\n]*full semantic parity/u);
    expect(ledger).not.toMatch(/features[^.\n]*full semantic parity/u);
  });
});

/**
 * `UNO-WO-072 / R01`: the donor's optional authored heading and lede for the two bounded sequence families.
 *
 * The donor spreads `headingFields` into `statsSectionSchema` and `stepsSectionSchema`, so both accept an optional
 * `heading` and a Markdown-capable `lede`. This subset accepts one literal plain-text value for each and renders it with
 * the existing heading and prose modules; no input without those fields changes its JSON.
 */
describe("composeUnoFoundationSubset — stats and steps authored heading and lede", () => {
  /** The four pre-WO-072 section baselines, captured from the committed output before this change. */
  const PRE_WO072_STATS =
    '{"id":"family-0-stats","module":"content.stats","props":{"items":[{"value":"13","label":"Sampled sections","detail":"Fixture only"},{"value":"4","label":"New examples"}]}}';
  const PRE_WO072_STEPS =
    '{"id":"family-0-steps","module":"content.timeline","props":{"items":[{"title":"Draft","description":"Prepare the fixture source."},{"title":"Review"}]}}';
  const PRE_WO072_STEPSSURFACE =
    '{"id":"family-0-steps","module":"content.timeline","props":{"items":[{"title":"Draft","description":"Prepare the fixture source."},{"title":"Review"}],"surface":"muted"}}';
  const PRE_WO072_STEPSBORDERED =
    '{"id":"family-0-steps","module":"content.timeline","props":{"items":[{"title":"Draft","description":"Prepare the fixture source."},{"title":"Review"}],"surface":"bordered"}}';

  const statsItems = [
    { value: "13", label: "Sampled sections", detail: "Fixture only" },
    { value: "4", label: "New examples" },
  ];
  const stepItems = [
    { title: "Draft", body: "Prepare the fixture source." },
    { title: "Review" },
  ];

  /**
   * `UNO-WO-080 / R01`: the four baselines above stay the historical pre-WO-072 record. The only difference the steps
   * family now carries is the documented `content.timeline` outline switch the donor's own `<h3>` item titles need.
   */
  function withStepsOutline(baseline: string): string {
    const node = JSON.parse(baseline) as { props: Record<string, unknown> };
    return JSON.stringify({ ...node, props: { ...node.props, itemHeadingLevel: 3 } });
  }

  /** One stats/steps source carrying exactly the caller-chosen fields. */
  function sequencePage(type: "stats" | "steps", fields: Record<string, unknown>): Record<string, unknown> {
    return {
      version: 1,
      title: "Sequence fixture",
      sections: [{ type, items: type === "stats" ? statsItems : stepItems, ...fields }],
    };
  }

  /** The original one-node child that a wrapper must carry unchanged apart from its documented id. */
  function originalChildNode(type: "stats" | "steps", surface?: string): Record<string, unknown> {
    const baseline = type === "stats"
      ? PRE_WO072_STATS
      : surface === "muted"
        ? PRE_WO072_STEPSSURFACE
        : surface === "bordered"
          ? PRE_WO072_STEPSBORDERED
          : PRE_WO072_STEPS;
    // A steps child still carries the documented outline switch; a stats child is untouched.
    return JSON.parse(type === "steps" ? withStepsOutline(baseline) : baseline) as Record<string, unknown>;
  }

  it("keeps all four pre-WO-072 baselines byte-identical apart from the documented steps outline switch", () => {
    expect(JSON.stringify(composed(sequencePage("stats", {})).sections[0])).toBe(PRE_WO072_STATS);
    expect(JSON.stringify(composed(sequencePage("steps", {})).sections[0])).toBe(withStepsOutline(PRE_WO072_STEPS));
    expect(JSON.stringify(composed(sequencePage("steps", { surface: "muted" })).sections[0])).toBe(
      withStepsOutline(PRE_WO072_STEPSSURFACE),
    );
    expect(JSON.stringify(composed(sequencePage("steps", { surface: "bordered" })).sections[0])).toBe(
      withStepsOutline(PRE_WO072_STEPSBORDERED),
    );
  });


  it("composes a heading-only wrapper that carries the original child unchanged apart from its documented id", () => {
    for (const type of ["stats", "steps"] as const) {
      const surface = type === "steps" ? "muted" : undefined;
      const document = composed(sequencePage(type, { heading: "Synthetic sequence", ...(surface === undefined ? {} : { surface }) }));
      const section = document.sections[0]!;
      expect(section.id).toBe(`family-0-${type}`);
      expect(section.module).toBe("layout.stack");
      expect(JSON.stringify(section.props)).toBe("{}");
      if (section.module !== "layout.stack") continue;
      expect(section.children).toHaveLength(2);
      const [heading, child] = section.children;
      expect(heading!.id).toBe(`family-0-${type}-heading`);
      expect(heading!.module).toBe("content.heading");
      expect(heading!.props).toEqual({ text: "Synthetic sequence", level: 2 });
      const expected = originalChildNode(type, surface);
      expected["id"] = `family-0-${type}-${type === "stats" ? "stats" : "timeline"}`;
      expect(JSON.stringify(child)).toBe(JSON.stringify(expected));
      expect(Object.isFrozen(section)).toBe(true);
      expect(Object.isFrozen(section.children)).toBe(true);
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });

  it("composes a lede-only wrapper with no invented heading", () => {
    for (const type of ["stats", "steps"] as const) {
      const document = composed(sequencePage(type, { lede: "A plain authored lede." }));
      const section = document.sections[0]!;
      expect(section.id).toBe(`family-0-${type}`);
      expect(section.module).toBe("layout.stack");
      if (section.module !== "layout.stack") continue;
      expect(section.children).toHaveLength(2);
      const [lede, child] = section.children;
      expect(lede!.id).toBe(`family-0-${type}-lede`);
      expect(lede!.module).toBe("content.prose");
      expect(lede!.props).toEqual({ text: "A plain authored lede." });
      const expected = originalChildNode(type);
      expected["id"] = `family-0-${type}-${type === "stats" ? "stats" : "timeline"}`;
      expect(JSON.stringify(child)).toBe(JSON.stringify(expected));
      expect(section.children.some((node) => node.module === "content.heading")).toBe(false);
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });

  it("composes heading plus lede as three ordered children before the original sequence node", () => {
    for (const type of ["stats", "steps"] as const) {
      const source = sequencePage(type, { heading: "Synthetic sequence", lede: "A plain authored lede." });
      const before = JSON.stringify(source);
      const document = composed(source);
      expect(JSON.stringify(source)).toBe(before);
      const section = document.sections[0]!;
      if (section.module !== "layout.stack") continue;
      expect(section.children.map((node) => node.id)).toEqual([
        `family-0-${type}-heading`,
        `family-0-${type}-lede`,
        `family-0-${type}-${type === "stats" ? "stats" : "timeline"}`,
      ]);
      expect(section.children[0]!.props).toEqual({ text: "Synthetic sequence", level: 2 });
      expect(section.children[1]!.props).toEqual({ text: "A plain authored lede." });
      const asObject = readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown);
      expect(asObject.accepted).toBe(true);
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      expect(JSON.stringify(document)).toBe(JSON.stringify(JSON.parse(JSON.stringify(document)) as unknown));
    }
  });

  it("keeps authored order and ids when a headed sequence is mixed with the divider in either order", () => {
    const divider = { type: "divider" };
    for (const sections of [
      [divider, { type: "stats", heading: "Numbers", lede: "Counted here.", items: statsItems }],
      [{ type: "steps", lede: "Sequenced here.", items: stepItems }, divider],
    ] as const) {
      const document = composed({ version: 1, title: "Mixed sequence", sections });
      expect(document.sections.map((section) => section.id)).toEqual(
        sections.map((section, index) => `family-${index}-${section.type}`),
      );
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });


  it("accepts the documented code-point bounds for both fields on both families", () => {
    const heading160 = "h".repeat(160);
    const astralHeading = "\u{1F4CA}".repeat(160);
    const lede4000 = "l".repeat(4000);
    const astralLede = "\u{1F680}".repeat(4000);
    for (const type of ["stats", "steps"] as const) {
      for (const heading of [heading160, astralHeading, "Grüße — 日本語 ✓"]) {
        const document = composed(sequencePage(type, { heading }));
        const section = document.sections[0]!;
        if (section.module === "layout.stack") expect(section.children[0]!.props).toEqual({ text: heading, level: 2 });
        expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      }
      for (const lede of [lede4000, astralLede, "Sätze mit & \"Anführungszeichen\" bleiben Text."]) {
        const document = composed(sequencePage(type, { lede }));
        const section = document.sections[0]!;
        if (section.module === "layout.stack") expect(section.children[0]!.props).toEqual({ text: lede });
        expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      }
      expectRefusal(sequencePage(type, { heading: `${heading160}h` }), "family:target-refused");
      expectRefusal(sequencePage(type, { heading: `${astralHeading}\u{1F4CA}` }), "family:target-refused");
      expectRefusal(sequencePage(type, { lede: `${lede4000}l` }), "family:target-refused");
      expectRefusal(sequencePage(type, { lede: `${astralLede}\u{1F680}` }), "family:target-refused");
    }
  });

  it("refuses every malformed text field with the closed reason that matches its cause", () => {
    const cases: Array<[unknown, string]> = [
      [7, "family:unsupported-feature"],
      [null, "family:unsupported-feature"],
      [["Text"], "family:unsupported-feature"],
      [{ text: "Text" }, "family:unsupported-feature"],
      [true, "family:unsupported-feature"],
      ["", "family:target-refused"],
      ["   ", "family:target-refused"],
      [" Padded", "family:target-refused"],
      ["Padded ", "family:target-refused"],
      ["![alt](https://example.com/i.png)", "family:unsupported-feature"],
      ["<script>alert(1)</script>", "family:unsupported-feature"],
      ["Carriage\rreturn", "family:unsupported-feature"],
      ["Tabbed\ttext", "family:unsupported-feature"],
      ["Nul\u0000text", "family:unsupported-feature"],
      ["Lead \uD800 tail", "family:target-refused"],
    ];
    // `UNO-WO-113 / R01` and `UNO-WO-114 / R01`: both `stats` and `steps` ledes are Markdown-capable now, so only the two
    // `heading` fields keep the plain-text matrix below; the Markdown cases are proved separately.
    for (const [value, reason] of cases) {
      for (const type of ["stats", "steps"] as const) {
        expectRefusal(sequencePage(type, { heading: value }), reason);
      }
    }
    const plainMarkdownCases: Array<[string, string]> = [
      ["**Bold**", "family:unsupported-feature"],
      ["_Italic_", "family:unsupported-feature"],
      ["`code`", "family:unsupported-feature"],
      ["[label](https://example.com)", "family:unsupported-feature"],
      ["# Heading", "family:unsupported-feature"],
      ["- entry", "family:unsupported-feature"],
      ["> quote", "family:unsupported-feature"],
      ["Two\nlines", "family:unsupported-feature"],
    ];
    for (const [value, reason] of plainMarkdownCases) {
      for (const type of ["stats", "steps"] as const) {
        expectRefusal(sequencePage(type, { heading: value }), reason);
      }
    }
  });

  it("accepts the Markdown-capable sequence lede the donor authors, and refuses what the shared reader refuses", () => {
    // `UNO-WO-113 / R01` and `UNO-WO-114 / R01`: `statsSectionSchema.lede` and `stepsSectionSchema.lede` are both
    // `markdownTextSchema`, so the same shared reader that serves the rich `prose`, `table`, `list` and `hero` families
    // decides them too — accepted constructs compose, refused ones refuse, and a plain lede stays byte-identical.
    for (const type of ["stats", "steps"] as const) {
      for (const lede of ["**Bold**", "_Italic_", "`code`", "[label](https://example.com)", "Two\nlines", "a < b"]) {
        const outcome = composeUnoFoundationSubset(sequencePage(type, { lede }));
        expect(outcome.status, `${type}: ${lede}`).toBe("composed");
      }
      for (const lede of ["![alt](https://example.com/i.png)", "<script>alert(1)</script>", ""]) {
        const outcome = composeUnoFoundationSubset(sequencePage(type, { lede }));
        expect(outcome.status, `${type}: ${lede}`).toBe("refused");
      }
    }
    const rich = composeUnoFoundationSubset(sequencePage("stats", { lede: "A **bounded** lede." }));
    expect(rich.status).toBe("composed");
    if (rich.status !== "composed") return;
    const stack = rich.document.sections[0];
    expect(stack?.module).toBe("layout.stack");
    if (stack?.module !== "layout.stack") return;
    expect(stack.children[0]).toEqual({
      id: "family-0-stats-lede",
      module: "content.prose",
      props: { text: "A **bounded** lede.", markdown: true },
    });
    expect(stack.children[1]?.module).toBe("content.stats");
    // The same holds for `steps`, whose child keeps its documented timeline module and level-3 item outline.
    const richSteps = composeUnoFoundationSubset(sequencePage("steps", { lede: "A **bounded** lede." }));
    expect(richSteps.status).toBe("composed");
    if (richSteps.status !== "composed") return;
    const stepsStack = richSteps.document.sections[0];
    expect(stepsStack?.module).toBe("layout.stack");
    if (stepsStack?.module !== "layout.stack") return;
    expect(stepsStack.children[0]).toEqual({
      id: "family-0-steps-lede",
      module: "content.prose",
      props: { text: "A **bounded** lede.", markdown: true },
    });
    expect(stepsStack.children[1]?.module).toBe("content.timeline");
    // A plain lede keeps the byte-identical child, so every previously accepted composition is unchanged.
    const plain = composeUnoFoundationSubset(sequencePage("stats", { lede: "A plain lede." }));
    expect(plain.status).toBe("composed");
    if (plain.status !== "composed") return;
    const plainStack = plain.document.sections[0];
    expect(plainStack?.module).toBe("layout.stack");
    if (plainStack?.module !== "layout.stack") return;
    expect(plainStack.children[0]).toEqual({
      id: "family-0-stats-lede",
      module: "content.prose",
      props: { text: "A plain lede." },
    });
  });


  it("refuses hostile text sources without executing a getter and never returns a partial Page", () => {
    for (const type of ["stats", "steps"] as const) {
      for (const field of ["heading", "lede"] as const) {
        let runs = 0;
        const hostile: Record<string, unknown> = { type, items: type === "stats" ? statsItems : stepItems };
        Object.defineProperty(hostile, field, { enumerable: true, get() { runs += 1; return "Read me"; } });
        expectRefusal(envelope(hostile), "family:unsafe-source");
        expect(runs).toBe(0);
        expectRefusal(
          { version: 1, title: "Hostile sequence fixture", sections: [{ type: "prose", body: "A plain paragraph." }, hostile] },
          "family:unsafe-source",
        );
        expect(runs).toBe(0);
        // A valid sibling cannot rescue the hostile family, and no refusal exposes an own `document` key.
        const refused = composeUnoFoundationSubset({
          version: 1,
          title: "Hostile sequence fixture",
          sections: [{ type, heading: "Valid", items: type === "stats" ? statsItems : stepItems }, hostile],
        });
        expect(refused.status).toBe("refused");
        expect(Object.prototype.hasOwnProperty.call(refused, "document")).toBe(false);
        expect(runs).toBe(0);
      }
    }
  });

  it("preserves the older stats and steps refusals and does not widen neighbouring families", () => {
    for (const type of ["stats", "steps"] as const) {
      expectRefusal(sequencePage(type, { eyebrow: "X" }), "family:unsupported-feature");
      expectRefusal(sequencePage(type, { align: "center" }), "family:unsupported-feature");
    }
    // `UNO-WO-113 / R01`: `stats` now accepts the donor's own closed `surface` literal, while `steps` keeps its accepted form.
    const statsSurface = composeUnoFoundationSubset(sequencePage("stats", { surface: "muted" }));
    expect(statsSurface.status).toBe("composed");
    if (statsSurface.status === "composed") {
      const node = statsSurface.document.sections[0];
      expect(node?.module).toBe("content.stats");
      if (node?.module === "content.stats") expect(node.props.surface).toBe("muted");
    }
    expectRefusal(sequencePage("stats", { surface: "loud" }), "family:target-refused");
    expect(composed(sequencePage("steps", { surface: "bordered" })).sections[0]!.props).toEqual({
      items: [{ title: "Draft", description: "Prepare the fixture source." }, { title: "Review" }],
      surface: "bordered",
      itemHeadingLevel: 3,
    });
    expectRefusal(
      envelope({ type: "stats", items: [{ value: "1", label: "One", href: "https://example.test" }] }),
      "family:unsupported-feature",
    );
    for (const extra of [{ status: "current" }, { dateLabel: "March" }, { icon: "star" }, { href: "#family-0-steps" }]) {
      expectRefusal(envelope({ type: "steps", items: [{ title: "Draft", ...extra }] }), "family:unsupported-feature");
    }
    // The two new optional keys stay family-specific; neighbouring families still refuse them. `faq` accepted them from
    // `UNO-WO-075 / R01` onward, so a still-unmapped neighbour (`divider`) carries this assertion.
    expectRefusal(envelope({ type: "quote", body: "A quote.", heading: "X" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "divider", lede: "L" }), "family:unsupported-feature");
  });

  it("renders the authored heading and lede before the existing stats list and steps list", () => {
    const statsHtml = render(composed(sequencePage("stats", { heading: "Synthetic numbers", lede: 'Plans & "prices" stay plain' })));
    const statsStart = statsHtml.indexOf('id="family-0-stats"');
    const statsRegion = statsHtml.slice(statsStart - 60);
    expect(statsRegion).toContain('<h2 class="uno-json-heading" id="family-0-stats-heading">Synthetic numbers</h2>');
    expect(statsRegion).toContain('<p class="uno-json-prose" id="family-0-stats-lede">Plans &amp; &quot;prices&quot; stay plain</p>');
    expect(statsRegion).toContain('<dl class="uno-json-stats-list"');
    expect(statsRegion).toContain(">Sampled sections</dt>");
    expect(statsRegion).toContain(">13<");
    expect(statsRegion.indexOf("family-0-stats-heading")).toBeLessThan(statsRegion.indexOf("family-0-stats-lede"));
    expect(statsRegion.indexOf("family-0-stats-lede")).toBeLessThan(statsRegion.indexOf("family-0-stats-stats"));
    for (const forbidden of ["<h1", "<h3", "<ol", "<script", "<iframe", "<form", "<button", "<a ", "<img", "onclick"]) {
      expect(statsRegion).not.toContain(forbidden);
    }

    const stepsHtml = render(composed(sequencePage("steps", { heading: "Synthetic sequence", lede: "A plain authored lede." })));
    const stepsStart = stepsHtml.indexOf('id="family-0-steps"');
    const stepsRegion = stepsHtml.slice(stepsStart - 60);
    expect(stepsRegion).toContain('<h2 class="uno-json-heading" id="family-0-steps-heading">Synthetic sequence</h2>');
    expect(stepsRegion).toContain('<p class="uno-json-prose" id="family-0-steps-lede">A plain authored lede.</p>');
    expect(stepsRegion).toContain('<ol class="uno-json-timeline-list"');
    expect(stepsRegion.indexOf("family-0-steps-heading")).toBeLessThan(stepsRegion.indexOf("family-0-steps-lede"));
    expect(stepsRegion.indexOf("family-0-steps-lede")).toBeLessThan(stepsRegion.indexOf("family-0-steps-timeline"));
    // `UNO-WO-080 / R01`: the steps region now carries its documented item headings, so the outline assertions are
    // exact rather than a blanket ban on `<h3`.
    expect((stepsRegion.match(/<h3 class="uno-json-timeline-title">/gu) ?? []).length).toBe(2);
    expect((stepsRegion.match(/<h3/gu) ?? []).length).toBe(2);
    for (const forbidden of ["<h1", "<h4", "<dl", "<script", "<iframe", "<form", "<button", "<a ", "<img", "onclick"]) {
      expect(stepsRegion).not.toContain(forbidden);
    }
  });

  it("keeps the stats and steps subset recorded in the ledger without claiming further parity", () => {
    const ledger = readFileSync(".documents/Architecture/u04-family-parity.md", "utf8");
    expect(ledger.split("ADAPT (bounded authored plain-text heading/lede)").length - 1).toBe(0);
    expect(ledger).toContain("**UNIMPLEMENTED (0):** none.");
    expect(ledger).toContain("eleven of seventeen fully parity-evidenced candidates");
    expect(ledger).not.toContain("2/17");
    expect(ledger).not.toContain("3/17");
    expect(ledger).not.toMatch(/stats[^.\n]*full semantic parity/u);
    expect(ledger).not.toMatch(/steps[^.\n]*full semantic parity/u);
  });
});

describe("composeUnoFoundationSubset — prose, callout, list, faq and table authored heading and lede", () => {
  /** The nine pre-WO-075 section baselines, captured from the committed output before this change. */
  const PRE_WO075_PROSE =
    '{"id":"family-0-prose","module":"content.prose","props":{"text":"A plain paragraph."}}';
  const PRE_WO075_CALLOUT =
    '{"id":"family-0-callout","module":"content.prose","props":{"variant":"callout","text":"A bounded note."}}';
  const PRE_WO075_CALLOUTTONE =
    '{"id":"family-0-callout","module":"content.prose","props":{"variant":"callout","text":"A bounded note.","tone":"warning"}}';
  const PRE_WO075_LIST =
    '{"id":"family-0-list","module":"content.prose","props":{"variant":"list","items":[{"label":"First"},{"label":"Second","detail":"More detail."}]}}';
  const PRE_WO075_LISTORDERED =
    '{"id":"family-0-list","module":"content.prose","props":{"variant":"list","items":[{"label":"First"},{"label":"Second","detail":"More detail."}],"ordered":true}}';
  const PRE_WO075_FAQONE =
    '{"id":"family-0-faq","module":"interaction.accordion","props":{"items":[{"sectionId":"family-0-faq-answer-0","label":"Is it bounded?"}]},"children":[{"id":"family-0-faq-answer-0","module":"content.prose","props":{"text":"Yes."}}]}';
  const PRE_WO075_FAQTWQ =
    '{"id":"family-0-faq","module":"interaction.accordion","props":{"items":[{"sectionId":"family-0-faq-answer-0","label":"Is it bounded?"},{"sectionId":"family-0-faq-answer-1","label":"Is it plain?"}]},"children":[{"id":"family-0-faq-answer-0","module":"content.prose","props":{"text":"Yes."}},{"id":"family-0-faq-answer-1","module":"content.prose","props":{"text":"Also yes."}}]}';
  const PRE_WO075_TABLE =
    '{"id":"family-0-table","module":"content.prose","props":{"variant":"table","columns":["Name","Count"],"rows":[["A","1"],["B","2"]]}}';
  const PRE_WO075_TABLECAPTION =
    '{"id":"family-0-table","module":"content.prose","props":{"variant":"table","columns":["Name","Count"],"rows":[["A","1"],["B","2"]],"caption":"Values"}}';

  const LIST_ITEMS: readonly unknown[] = ["First", { label: "Second", detail: "More detail." }];
  const TABLE_COLUMNS = ["Name", "Count"];
  const TABLE_ROWS = [["A", "1"], ["B", "2"]];
  const FAQ_ONE = [{ question: "Is it bounded?", answer: "Yes." }];
  const FAQ_TWO = [...FAQ_ONE, { question: "Is it plain?", answer: "Also yes." }];

  type FiveType = "prose" | "callout" | "list" | "faq" | "table";
  const FIVE_TYPES: readonly FiveType[] = ["prose", "callout", "list", "faq", "table"];
  // `UNO-WO-084 / R01`: an authored callout heading/lede now belongs inside the notice rather than in an outer stack,
  // so the wrapper assertions below cover the four families that still compose one.
  const WRAPPED_TYPES: readonly FiveType[] = FIVE_TYPES.filter((type) => type !== "callout");

  /** The documented original-child suffix of each of the five wrapped families. */
  const CHILD_SUFFIX: Record<FiveType, string> = {
    prose: "prose",
    callout: "callout",
    list: "list",
    faq: "accordion",
    table: "table",
  };


  /** The unchanged native node of each family, as one donor section without any authored text field. */
  function nativeSection(type: FiveType, variant?: string): Record<string, unknown> {
    if (type === "prose") return { type: "prose", body: "A plain paragraph." };
    if (type === "callout") {
      return { type: "callout", body: "A bounded note.", ...(variant === "tone" ? { tone: "warning" } : {}) };
    }
    if (type === "list") return { type: "list", items: LIST_ITEMS, ...(variant === "ordered" ? { ordered: true } : {}) };
    if (type === "faq") return { type: "faq", items: variant === "two" ? FAQ_TWO : FAQ_ONE };
    return {
      type: "table",
      columns: TABLE_COLUMNS,
      rows: TABLE_ROWS,
      ...(variant === "caption" ? { caption: "Values" } : {}),
    };
  }

  /** One single-family source carrying exactly the caller-chosen fields. */
  function fivePage(type: FiveType, fields: Record<string, unknown>, variant?: string): Record<string, unknown> {
    return envelope({ ...nativeSection(type, variant), ...fields });
  }

  /** The original one-node child a wrapper must carry unchanged apart from its documented id. */
  function originalChild(type: FiveType, variant?: string): Record<string, unknown> {
    const baseline =
      type === "prose"
        ? PRE_WO075_PROSE
        : type === "callout"
          ? variant === "tone"
            ? PRE_WO075_CALLOUTTONE
            : PRE_WO075_CALLOUT
          : type === "list"
            ? variant === "ordered"
              ? PRE_WO075_LISTORDERED
              : PRE_WO075_LIST
            : type === "faq"
              ? variant === "two"
                ? PRE_WO075_FAQTWQ
                : PRE_WO075_FAQONE
              : variant === "caption"
                ? PRE_WO075_TABLECAPTION
                : PRE_WO075_TABLE;
    // `UNO-WO-080 / R01`: a FAQ child still carries the documented summary outline switch; the other four families are
    // untransformed, so the historical baseline above remains the recorded before-state.
    const node = JSON.parse(baseline) as Record<string, unknown>;
    if (type !== "faq") return node;
    const props = node["props"] as Record<string, unknown>;
    return { ...node, props: { ...props, summaryHeadingLevel: 3 } };
  }

  it("keeps all nine pre-WO-075 baselines byte-identical apart from the documented faq outline switch", () => {
    expect(JSON.stringify(composed(fivePage("prose", {})).sections[0])).toBe(PRE_WO075_PROSE);
    expect(JSON.stringify(composed(fivePage("callout", {})).sections[0])).toBe(PRE_WO075_CALLOUT);
    expect(JSON.stringify(composed(fivePage("callout", {}, "tone")).sections[0])).toBe(PRE_WO075_CALLOUTTONE);
    expect(JSON.stringify(composed(fivePage("list", {})).sections[0])).toBe(PRE_WO075_LIST);
    expect(JSON.stringify(composed(fivePage("list", {}, "ordered")).sections[0])).toBe(PRE_WO075_LISTORDERED);
    expect(JSON.stringify(composed(fivePage("faq", {})).sections[0])).toBe(JSON.stringify(originalChild("faq")));
    expect(JSON.stringify(composed(fivePage("faq", {}, "two")).sections[0])).toBe(
      JSON.stringify(originalChild("faq", "two")),
    );
    expect(JSON.stringify(composed(fivePage("table", {})).sections[0])).toBe(PRE_WO075_TABLE);
    expect(JSON.stringify(composed(fivePage("table", {}, "caption")).sections[0])).toBe(PRE_WO075_TABLECAPTION);
  });


  it("composes a heading-only wrapper that carries the original child unchanged apart from its documented id", () => {
    for (const type of WRAPPED_TYPES) {
      const variant =
        type === "callout" ? "tone" : type === "list" ? "ordered" : type === "faq" ? "two" : type === "table" ? "caption" : undefined;
      const document = composed(fivePage(type, { heading: "Synthetic section" }, variant));
      const section = document.sections[0]!;
      expect(section.id).toBe(`family-0-${type}`);
      expect(section.module).toBe("layout.stack");
      expect(JSON.stringify(section.props)).toBe("{}");
      if (section.module !== "layout.stack") continue;
      expect(section.children).toHaveLength(2);
      const [heading, child] = section.children;
      expect(heading!.id).toBe(`family-0-${type}-heading`);
      expect(heading!.module).toBe("content.heading");
      expect(heading!.props).toEqual({ text: "Synthetic section", level: 2 });
      expect(child!.id).toBe(`family-0-${type}-${CHILD_SUFFIX[type]}`);
      const expected = originalChild(type, variant);
      expected["id"] = `family-0-${type}-${CHILD_SUFFIX[type]}`;
      expect(JSON.stringify(child)).toBe(JSON.stringify(expected));
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });

  it("composes a lede-only wrapper without inventing a heading", () => {
    for (const type of WRAPPED_TYPES) {
      const document = composed(fivePage(type, { lede: "A plain authored lede." }));
      const section = document.sections[0]!;
      if (section.module !== "layout.stack") continue;
      expect(section.children).toHaveLength(2);
      const [lede, child] = section.children;
      expect(lede!.id).toBe(`family-0-${type}-lede`);
      expect(lede!.module).toBe("content.prose");
      expect(lede!.props).toEqual({ text: "A plain authored lede." });
      expect(section.children.some((node) => node.module === "content.heading")).toBe(false);
      expect(child!.id).toBe(`family-0-${type}-${CHILD_SUFFIX[type]}`);
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });

  it("composes heading plus lede as three ordered children before the original native node", () => {
    for (const type of WRAPPED_TYPES) {
      const source = fivePage(type, { heading: "Synthetic section", lede: "A plain authored lede." });
      const before = JSON.stringify(source);
      const document = composed(source);
      expect(JSON.stringify(source)).toBe(before);
      const section = document.sections[0]!;
      if (section.module !== "layout.stack") continue;
      expect(section.children.map((node) => node.id)).toEqual([
        `family-0-${type}-heading`,
        `family-0-${type}-lede`,
        `family-0-${type}-${CHILD_SUFFIX[type]}`,
      ]);
      expect(section.children[0]!.module).toBe("content.heading");
      expect(section.children[1]!.module).toBe("content.prose");
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      expect(readUnoPageDocument(JSON.parse(JSON.stringify(document)) as unknown).accepted).toBe(true);
    }
  });


  it("keeps an authored callout heading and lede inside the notice", () => {
    const document = composed(
      fivePage("callout", { heading: "Synthetic section", lede: "A plain authored lede." }, "tone"),
    );
    const section = document.sections[0]!;
    expect(section.id).toBe("family-0-callout");
    expect(section.module).toBe("content.prose");
    if (section.module !== "content.prose") return;
    expect(section.props).toMatchObject({
      variant: "callout",
      text: "A bounded note.",
      tone: "warning",
      heading: "Synthetic section",
      lede: "A plain authored lede.",
    });
    expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
  });

  it("keeps authored ids and source order when a headed family is mixed with the divider in either order", () => {
    const divider = { type: "divider" };
    for (const sections of [
      [divider, { type: "prose", heading: "Notes", lede: "Plain words.", body: "A plain paragraph." }],
      [{ type: "table", lede: "Tabulated here.", columns: TABLE_COLUMNS, rows: TABLE_ROWS }, divider],
    ] as const) {
      const document = composed({ version: 1, title: "Mixed five-family fixture", sections });
      expect(document.sections.map((section) => section.id)).toEqual(
        sections.map((section, index) => `family-${index}-${section.type}`),
      );
      expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
    }
  });

  it("accepts the documented code-point bounds for both fields on all five families", () => {
    const heading160 = "h".repeat(160);
    const astralHeading = "\u{1F4CA}".repeat(160);
    const lede4000 = "l".repeat(4000);
    const astralLede = "\u{1F680}".repeat(4000);
    for (const type of FIVE_TYPES) {
      for (const heading of [heading160, astralHeading, "Grüße — 日本語 ✓"]) {
        const document = composed(fivePage(type, { heading }));
        expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      }
      for (const lede of [lede4000, astralLede, "Sätze mit & \"Anführungszeichen\" bleiben Text."]) {
        const document = composed(fivePage(type, { lede }));
        expect(readUnoPageDocument(JSON.stringify(document)).accepted).toBe(true);
      }
    }
  });

  it("does not mutate the caller source and keeps the authored text outside the native node", () => {
    for (const type of FIVE_TYPES) {
      const source = fivePage(type, { heading: "Synthetic section", lede: "A plain authored lede." });
      const snapshot = JSON.stringify(source);
      const outcome = composeUnoFoundationSubset(source);
      expect(outcome.status).toBe("composed");
      expect(JSON.stringify(source)).toBe(snapshot);
      const section = (JSON.parse(snapshot) as { sections: Record<string, unknown>[] }).sections[0]!;
      // The caller's own authored fields survive untouched: nothing is trimmed, rewritten or deleted in place.
      expect(Object.keys(section)).toContain("heading");
      expect(Object.keys(section)).toContain("lede");
      expect(section["heading"]).toBe("Synthetic section");
      expect(section["lede"]).toBe("A plain authored lede.");
      // The native node stays inside the wrapper without gaining either authored field.
      if (outcome.status === "composed") {
        const wrapper = outcome.document.sections[0]!;
        if (wrapper.module === "layout.stack") {
          const native = JSON.stringify(wrapper.children.at(-1));
          expect(native).not.toContain("heading");
          expect(native).not.toContain("lede");
        }
      }
    }
  });


  it("refuses invalid heading and lede text on every family and on both fields", () => {
    const cases: readonly (readonly [unknown, string])[] = [
      [null, "family:unsupported-feature"],
      [42, "family:unsupported-feature"],
      [true, "family:unsupported-feature"],
      [["Text"], "family:unsupported-feature"],
      [{ text: "Text" }, "family:unsupported-feature"],
      ["", "family:target-refused"],
      ["   ", "family:target-refused"],
      [" Padded", "family:target-refused"],
      ["Padded ", "family:target-refused"],
      ["**Bold**", "family:unsupported-feature"],
      ["_Italic_", "family:unsupported-feature"],
      ["~~Gone~~", "family:unsupported-feature"],
      ["`code`", "family:unsupported-feature"],
      ["[label](https://example.com)", "family:unsupported-feature"],
      ["![alt](https://example.com/i.png)", "family:unsupported-feature"],
      ["# Heading", "family:unsupported-feature"],
      ["- entry", "family:unsupported-feature"],
      ["> quote", "family:unsupported-feature"],
      ["a < b", "family:unsupported-feature"],
      ["<script>alert(1)</script>", "family:unsupported-feature"],
      ["Two\nlines", "family:unsupported-feature"],
      ["Carriage\rreturn", "family:unsupported-feature"],
      ["Tabbed\ttext", "family:unsupported-feature"],
      ["Nul\u0000text", "family:unsupported-feature"],
      ["Lead \uD800 tail", "family:target-refused"],
    ];
    for (const type of FIVE_TYPES) {
      for (const [value, reason] of cases) {
        expectRefusal(fivePage(type, { heading: value }), reason);
        {
          // `UNO-WO-084 / R01`: a `prose`/`callout` lede is Markdown-capable, and `UNO-WO-118 / R01` brings the donor's
          // Markdown `faq` lede to the same shared reader, so all five ledes now share one rule. Non-text, blank, padded,
          // oversized, surrogate-bearing and unsafe-Markdown values still refuse; every other value is an accepted lede.
          const refusesAsLede =
            typeof value !== "string" ||
            value.trim().length === 0 ||
            value.trim() !== value ||
            /!\[/u.test(value) ||
            /<[a-zA-Z/!?]/u.test(value) ||
            /(?:^|\n)#{1}[ \t]/u.test(value) ||
            /\u0000/u.test(value) ||
            /[\uD800-\uDFFF]/u.test(value);
          if (!refusesAsLede) {
            expect(composeUnoFoundationSubset(fivePage(type, { lede: value })).status).toBe("composed");
            continue;
          }
        }
        expectRefusal(fivePage(type, { lede: value }), reason);
      }
      expectRefusal(fivePage(type, { heading: "h".repeat(161) }), "family:target-refused");
      expectRefusal(fivePage(type, { lede: "l".repeat(4001) }), "family:target-refused");
    }
  });

  it("refuses hostile text sources without executing a getter and never returns a partial Page", () => {
    for (const type of FIVE_TYPES) {
      for (const field of ["heading", "lede"] as const) {
        let runs = 0;
        const hostile: Record<string, unknown> = nativeSection(type);
        Object.defineProperty(hostile, field, {
          enumerable: true,
          get() {
            runs += 1;
            return "Read me";
          },
        });
        expectRefusal(envelope(hostile), "family:unsafe-source");
        expect(runs).toBe(0);
        // A valid neighbour cannot rescue the hostile family, and no refusal exposes an own `document` key.
        const refused = composeUnoFoundationSubset({
          version: 1,
          title: "Hostile five-family fixture",
          sections: [{ type: "prose", heading: "Valid", body: "A plain paragraph." }, hostile],
        });
        expect(refused.status).toBe("refused");
        expect(Object.prototype.hasOwnProperty.call(refused, "document")).toBe(false);
        expect(runs).toBe(0);
      }
    }
  });

  it("preserves the earlier native refusals and does not widen neighbouring families", () => {
    for (const type of FIVE_TYPES) {
      // `UNO-WO-084 / R01` widens only `prose` and `callout`; the other three still refuse the closed alignment field.
      if (type !== "prose" && type !== "callout") {
        expectRefusal(fivePage(type, { align: "center" }), "family:unsupported-feature");
        // `UNO-WO-102 / R01`: `table` and `list` carry the donor's closed `surface`; `UNO-WO-118 / R01` gives `faq` its own.
        expect(composeUnoFoundationSubset(fivePage(type, { surface: "muted" })).status).toBe("composed");
      }
      expectRefusal(fivePage(type, { eyebrow: "X" }), "family:unsupported-feature");
      expectRefusal(fivePage(type, { heading: "Valid", markdown: "# no" }), "family:unsupported-feature");
    }
    // The newly accepted presentation fields stay closed: an unlisted value is still refused by the Uno reader.
    expectRefusal(envelope({ type: "prose", body: "A", align: "right" }), "family:target-refused");
    expectRefusal(envelope({ type: "prose", body: "A", surface: "shadow" }), "family:target-refused");
    expectRefusal(
      envelope({ type: "faq", items: [{ question: "Q", answer: "A" }], surface: "shadow" }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "list", items: [{ label: "Linked", route: "../about" }] }), "family:target-refused");
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [["1"]], align: "center" }), "family:unsupported-feature");
    // The two new optional keys stay family-specific: unmapped neighbouring families still refuse them.
    expectRefusal(envelope({ type: "divider", heading: "X" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "quote", body: "A quote.", lede: "L" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "A hero.", heading: "X" }), "family:unsupported-feature");
  });


  it("renders the authored heading and lede before each family's unchanged native markup", () => {
    const native: Record<FiveType, string> = {
      prose: '<p class="uno-json-prose" id="family-0-prose-prose">A plain paragraph.</p>',
      callout: '<section class="uno-json-callout" data-uno-tone="warning" id="family-0-callout-callout">',
      list: '<ul class="uno-json-list" id="family-0-list-list">',
      faq: '<div class="uno-json-accordion" id="family-0-faq-accordion">',
      table: '<div class="uno-json-table-scroll" id="family-0-table-table" tabindex="0">',
    };
    for (const type of WRAPPED_TYPES) {
      const html = render(
        composed(fivePage(type, { heading: "Synthetic section", lede: "A lede & \"quoted\" text." }, type === "callout" ? "tone" : undefined)),
      );
      const start = html.indexOf(`id="family-0-${type}"`);
      expect(start).toBeGreaterThan(-1);
      const region = html.slice(start - 80);
      const heading = `<h2 class="uno-json-heading" id="family-0-${type}-heading">Synthetic section</h2>`;
      const lede = `<p class="uno-json-prose" id="family-0-${type}-lede">A lede &amp; &quot;quoted&quot; text.</p>`;
      expect(region).toContain(heading);
      expect(region).toContain(lede);
      expect(region).toContain(native[type]);
      expect(region.indexOf(heading)).toBeLessThan(region.indexOf(lede));
      expect(region.indexOf(lede)).toBeLessThan(region.indexOf(native[type]));
      // `UNO-WO-080 / R01`: only the FAQ family in this five-family loop carries heading output of its own, so the
      // exact level-3 count is asserted per type instead of banning `<h3` outright.
      const expectedH3 = type === "faq" ? FAQ_ONE.length : 0;
      expect((region.match(/<h3/gu) ?? []).length).toBe(expectedH3);
      for (const forbidden of ["<h1", "<h4", "<script", "<iframe", "<form", "<button", "<a ", "<img", "onclick"]) {
        expect(region).not.toContain(forbidden);
      }
    }
    // `UNO-WO-084 / R01`: the callout keeps its accent and carries the authored heading and lede inside it, in order.
    const calloutHtml = render(
      composed(fivePage("callout", { heading: "Synthetic section", lede: "A lede & \"quoted\" text." }, "tone")),
    );
    const calloutStart = calloutHtml.indexOf('id="family-0-callout"');
    expect(calloutStart).toBeGreaterThan(-1);
    const calloutRegion = calloutHtml.slice(calloutStart - 80);
    expect(calloutRegion).toContain('data-uno-tone="warning"');
    expect(calloutRegion).toContain('<h2 class="uno-json-prose-heading">Synthetic section</h2>');
    expect(calloutRegion).toContain('<p class="uno-json-prose-lede">A lede &amp; &quot;quoted&quot; text.</p>');
    expect(calloutRegion.indexOf("Synthetic section")).toBeLessThan(calloutRegion.indexOf("A lede"));
    expect(calloutRegion).not.toContain("<script");
    expect(calloutRegion).not.toContain("<form");
  });

  it("keeps the five-family subset recorded in the ledger without claiming further parity", () => {
    const ledger = readFileSync(".documents/Architecture/u04-family-parity.md", "utf8");
    // `UNO-WO-084 / R01` (A1) credited prose and callout; `UNO-WO-110 / R01` credited table and `UNO-WO-111 / R01` credited
    // list, so only `faq` keeps the earlier bounded authored-text treatment while the two new rows carry their own parity
    // disposition and evidence.
    // `UNO-WO-118 / R01` credited `faq`, so no row carries the earlier bounded authored-text disposition any more; the two
    // A1 credits, the two A2 credits and the two newest parity rows are each present exactly once.
    expect(ledger.split("ADAPT (bounded plain-text heading/lede)").length - 1).toBe(0);
    expect(ledger.split("PARITY (A1, UNO-WO-084 / R01)").length - 1).toBe(2);
    expect(ledger.split("PARITY (UNO-WO-110 / R01)").length - 1).toBe(1);
    expect(ledger.split("PARITY (UNO-WO-111 / R01)").length - 1).toBe(1);
    // `UNO-WO-117 / R01` credited quote and `UNO-WO-118 / R01` credited faq, so exactly one row carries each order's
    // parity disposition.
    expect(ledger.split("PARITY (UNO-WO-117 / R01)").length - 1).toBe(1);
    expect(ledger.split("PARITY (UNO-WO-118 / R01)").length - 1).toBe(1);
    expect(ledger).toContain("**UNIMPLEMENTED (0):** none.");
    expect(ledger).toContain("eleven of seventeen fully parity-evidenced candidates");
    expect(ledger).not.toContain("sixteen still bounded");
    expect(ledger).toContain("six still bounded");
    expect(ledger).toContain("Seven of the seventeen remain bounded");
    expect(ledger).not.toContain("2/17");
    expect(ledger).not.toContain("16/17");
    // `UNO-WO-114 / R01`: the ledger records the delivered B1 row (`8/17` / `50/59`); `UNO-WO-117 / R01` records the
    // checkpoint-free nine-family interim (`9/17` / `51/59`); `UNO-WO-119 / R01` records the earned B2 row (`11/17` / `53/59`).
    // What it must never claim is any later row, so those counts stay forbidden while every delivered count is pinned positively.
    expect(ledger).toContain("6/17");
    expect(ledger).toContain("7/17");
    expect(ledger).toContain("8/17");
    expect(ledger).toContain("50/59");
    expect(ledger).toContain("9/17");
    expect(ledger).toContain("51/59");
    expect(ledger).toContain("11/17");
    expect(ledger).toContain("53/59");
    expect(ledger).not.toContain("13/17");
    expect(ledger).not.toContain("15/17");
    expect(ledger).not.toContain("17/17 full semantic parity");
    expect(ledger).not.toMatch(/prose[^.\n]*full semantic parity/u);
    expect(ledger).not.toMatch(/table[^.\n]*full semantic parity/u);
  });
});
describe("the committed durable family Page (`UNO-WO-078 / R01`)", () => {
  const durableSource = JSON.parse(readFileSync("tests/fixtures/u04-durable-family-source.json", "utf8"));
  const durableBindings = JSON.parse(readFileSync("tests/fixtures/u04-durable-family-bindings.json", "utf8"));
  const committedPage = JSON.parse(readFileSync("deployment/efs/content/components.en-001.json", "utf8"));

  /** The six native sections exactly as they serialized before this order appended the seventeen families. */
  const SIX_DIGEST = "bbc5416a5b8e2f1f8b419e33bb535de1ef283a9a777764e16562b975c6bd1901";
  const FAMILY_IDS = [
    "family-0-prose",
    "family-1-callout",
    "family-2-list",
    "family-3-faq",
    "family-4-media",
    "family-5-gallery",
    "family-6-contactform",
    "family-7-actions",
    "family-8-divider",
    "family-9-hero",
    "family-10-stats",
    "family-11-steps",
    "family-12-quote",
    "family-13-table",
    "family-14-columns",
    "family-15-cards",
    "family-16-features",
  ];
  const FAMILY_TYPES = [
    "prose",
    "callout",
    "list",
    "faq",
    "media",
    "gallery",
    "contactForm",
    "actions",
    "divider",
    "hero",
    "stats",
    "steps",
    "quote",
    "table",
    "columns",
    "cards",
    "features",
  ];
  const digestOf = (value: string): string => createHash("sha256").update(value).digest("hex");

  it("reads the inert source and bindings as exactly seventeen families in order", () => {
    expect(durableSource.version).toBe(1);
    expect(durableSource.sections).toHaveLength(17);
    expect(durableSource.sections.map((section: { type: string }) => section.type)).toEqual(FAMILY_TYPES);
    expect(durableBindings.images).toHaveLength(1);
    expect(durableBindings.images[0].source).toBe("/assets/wo078-family-plate.png");
    expect(durableBindings.images[0].owned).toEqual({ zone: "page", path: "wo078-family-plate.png" });
    expect(durableBindings.contactForms).toEqual([{ formRef: "wo078-contact", mode: "delivery-off" }]);
  });

  it("composes the source into one deeply frozen document with the seventeen stable ids", () => {
    const outcome = composeUnoFoundationSubset(durableSource, durableBindings);
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    expect(outcome.document.sections.map((node) => node.id)).toEqual(FAMILY_IDS);
    expect(Object.isFrozen(outcome.document)).toBe(true);
    expect(Object.isFrozen(outcome.document.sections)).toBe(true);
    for (const node of outcome.document.sections) expect(Object.isFrozen(node)).toBe(true);
  });

  it("does not mutate the inert source or bindings while composing", () => {
    const sourceBefore = JSON.stringify(durableSource);
    const bindingsBefore = JSON.stringify(durableBindings);
    composeUnoFoundationSubset(durableSource, durableBindings);
    expect(JSON.stringify(durableSource)).toBe(sourceBefore);
    expect(JSON.stringify(durableBindings)).toBe(bindingsBefore);
  });

  it("keeps the committed Page's appended sections byte-identical to the composer output", () => {
    const outcome = composeUnoFoundationSubset(durableSource, durableBindings);
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const committed = readUnoPageDocument(JSON.stringify(committedPage));
    expect(committed.accepted).toBe(true);
    if (!committed.accepted) return;
    expect(committed.document.sections).toHaveLength(23);
    expect(JSON.stringify(committed.document.sections.slice(6))).toBe(JSON.stringify(outcome.document.sections));
    expect(committed.document.sections.slice(6).map((node) => node.id)).toEqual(FAMILY_IDS);
  });

  it("keeps the six original sections value-identical to the starting committed blob", () => {
    expect(committedPage.sections).toHaveLength(23);
    expect(digestOf(JSON.stringify(committedPage.sections.slice(0, 6)))).toBe(SIX_DIGEST);
    expect(committedPage.sections.slice(0, 6).map((section: { id: string }) => section.id)).toEqual([
      "components-intro",
      "components-copy",
      "components-list",
      "components-stack",
      "components-faq",
      "components-callout",
    ]);
  });

  it("binds every owned image to the one Page-owned plate and nothing else", () => {
    const outcome = composeUnoFoundationSubset(durableSource, durableBindings);
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const media = outcome.document.sections.find((node) => node.id === "family-4-media");
    const gallery = outcome.document.sections.find((node) => node.id === "family-5-gallery");
    expect(media?.module).toBe("media.image");
    expect(gallery?.module).toBe("media.gallery");
    if (media?.module === "media.image") {
      expect(media.props.asset).toEqual({ zone: "page", path: "wo078-family-plate.png" });
    }
    if (gallery?.module === "media.gallery") {
      for (const item of gallery.props.items) {
        expect(item.asset).toEqual({ zone: "page", path: "wo078-family-plate.png" });
      }
    }
  });

  it("refuses a wrong or absent contact acknowledgement without a partial document", () => {
    const section = { type: "contactForm", formRef: "wo078-contact" };
    expect(
      composeUnoFoundationSubset(envelope(section), {
        contactForms: [{ formRef: "wo078-contact", mode: "delivery-on" }],
      }),
    ).toEqual({ status: "refused", reason: "family:unsupported-feature" });
    expect(composeUnoFoundationSubset(envelope(section))).toEqual({
      status: "refused",
      reason: "family:unsupported-feature",
    });
    expect(
      composeUnoFoundationSubset(envelope(section), {
        contactForms: [{ formRef: "another-form", mode: "delivery-off" }],
      }),
    ).toEqual({ status: "refused", reason: "family:unsupported-feature" });
  });

  it("refuses a false, misowned or missing image binding", () => {
    const media = { type: "media", image: { src: "/assets/wo078-family-plate.png", alt: "A plate" } };
    expect(composeUnoFoundationSubset(envelope(media))).toEqual({
      status: "refused",
      reason: "family:unsupported-feature",
    });
    expect(
      composeUnoFoundationSubset(envelope(media), {
        images: [{ source: "/assets/other.png", owned: { zone: "page", path: "wo078-family-plate.png" } }],
      }),
    ).toEqual({ status: "refused", reason: "family:unsupported-feature" });
    expect(
      composeUnoFoundationSubset(envelope(media), {
        images: [{ source: "/assets/wo078-family-plate.png", owned: { zone: "cdn", path: "wo078-family-plate.png" } }],
      }),
    ).toEqual({ status: "refused", reason: "family:target-refused" });
    expect(
      composeUnoFoundationSubset(envelope(media), {
        images: [{ source: "/assets/wo078-family-plate.png", owned: { zone: "generated", path: "plate.png" } }],
      }),
    ).toEqual({ status: "refused", reason: "family:target-refused" });
  });

  it("refuses a hostile source and an outside family without publishing anything", () => {
    let invoked = false;
    const hostile: Record<string, unknown> = { version: 1, title: "T", sections: [] };
    Object.defineProperty(hostile, "sections", {
      enumerable: true,
      get() {
        invoked = true;
        return [];
      },
    });
    expect(composeUnoFoundationSubset(hostile)).toEqual({ status: "refused", reason: "family:unsafe-source" });
    expect(invoked).toBe(false);
    expect(composeUnoFoundationSubset(envelope({ type: "carousel", items: [] }))).toEqual({
      status: "refused",
      reason: "family:unsupported-family",
    });
    // `UNO-WO-084 / R01`: `prose`/`callout` Markdown is now composed rather than refused; unsafe constructs still refuse.
    const markdownProse = composeUnoFoundationSubset(envelope({ type: "prose", body: "A **bold** claim" }));
    expect(markdownProse.status).toBe("composed");
    if (markdownProse.status === "composed") {
      const proseNode = markdownProse.document.sections[0]!;
      expect(proseNode.module).toBe("content.prose");
      expect(proseNode.id).not.toContain("undefined");
    }
    const refused = composeUnoFoundationSubset(envelope({ type: "prose", body: "A ![img](https://example.org/i.png) claim" }));
    expect(refused.status).toBe("refused");
    expect("document" in refused).toBe(false);
  });

  it("renders the composed suffix with native semantics and no interactive or external surface", () => {
    const outcome = composeUnoFoundationSubset(durableSource, durableBindings);
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const image = (src: string) => ({ src, type: "image/png", width: 64, height: 40 });
    const media: UnoPageMedia = new Map([
      ["family-4-media", { image: image("/uno-media/en-001/components/0") }],
      [
        "family-5-gallery",
        { items: [image("/uno-media/en-001/components/1"), image("/uno-media/en-001/components/2")] },
      ],
    ]);
    const html = renderToStaticMarkup(createElement(UnoPageSections, { document: outcome.document, media }));
    for (const marker of [
      'class="uno-json-divider"',
      'class="uno-json-testimonial-quote"',
      'class="uno-json-table"',
      'scope="col"',
      "<details",
      "<summary",
      'class="uno-json-timeline-list"',
      'class="uno-json-media-image"',
      "Delivery is switched off.",
    ]) {
      expect(html).toContain(marker);
    }
    for (const forbidden of ["<form", "<input", "<textarea", "<button", "<iframe", "<script"]) {
      expect(html).not.toContain(forbidden);
    }
    expect(html).not.toMatch(/src="https?:\/\//u);
  });
});

describe("the three donor heading outlines (`UNO-WO-080 / R01`)", () => {
  const digestOf = (value: string): string => createHash("sha256").update(value).digest("hex");
  const committedPage = JSON.parse(readFileSync("deployment/efs/content/components.en-001.json", "utf8"));
  const durableSource = JSON.parse(readFileSync("tests/fixtures/u04-durable-family-source.json", "utf8"));
  const durableBindings = JSON.parse(readFileSync("tests/fixtures/u04-durable-family-bindings.json", "utf8"));

  /**
   * The fourteen appended family sections this order did not touch, hashed from the committed Page *before* any edit of
   * this order and recorded here as an independent before-state. A drift in any of them is a failure, not a refresh.
   */
  const UNAFFECTED_DIGESTS: Readonly<Record<string, string>> = {
    "family-0-prose": "87c744b233ea5fe783bb7389332c2a74f406eaaf569d3182e463b1ec4407c70a",
    "family-1-callout": "53d6fce0fc9ba681c9734b53b1f9557ee544a6bfcd0f9767bb2b630767dd3a70",
    "family-2-list": "4a45f6018a5c7243f88056049edf0eec4205603d9b3b61954162c28eb2df0b1b",
    "family-4-media": "4171a9bc3d2246e34f18169512071ff17f263639b53ea4285a54b8d20589e310",
    "family-5-gallery": "bc2c81ae13e45e3793bd71df2c3bb0f0a33674f6418860fdf10f3d59716b8132",
    "family-6-contactform": "3f4754331eed37d16bb05351430b22dd5f6dda221795b02d955a615d6d40da05",
    "family-7-actions": "da9fd847bf307b9cc571890cea1385f8f9f3e1a0094576a7a4a882b6610741da",
    "family-8-divider": "3656311d722ded1ac2c86f34e35caa85879502299d40e258c628ada5b2fc82a3",
    "family-9-hero": "4b8d7831d356d2ce7610b423a34bd639c1d6a2976f2cef9b7d6d9fc13f6c3f83",
    "family-10-stats": "9cc437c93759820210bd316aeb99a00f346488f18fb5d460c12d3e8b4ba6777b",
    "family-12-quote": "7271422166b1b5c94d71803989d7ea5cae3b334cbd91296c5315c137271b51e6",
    "family-13-table": "30d076359a38ca8673aab08cea2a042bae31524a74f82ccdae97aa5c1ed70540",
    "family-15-cards": "4ca9f095a4122b1622fad760b01e884f8ba3c3e9a50115b188e71bdb30cf89e8",
    "family-16-features": "7873cb6c2abcf7e88ec32c31180d7f63088d1c442983179666c115a6b7bb6d7c",
  };
  it("composes the donor steps as a timeline whose item titles are level-3 headings", () => {
    const outcome = composeUnoFoundationSubset(
      envelope({ type: "steps", items: [{ title: "One", body: "First body." }, { title: "Two" }] }),
    );
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const node = outcome.document.sections[0];
    expect(node?.module).toBe("content.timeline");
    if (node?.module !== "content.timeline") return;
    // The switch is the only addition: same items, same ids, and no invented status, date or extra heading.
    expect(JSON.stringify(node.props)).toBe(
      '{"items":[{"title":"One","description":"First body."},{"title":"Two"}],"itemHeadingLevel":3}',
    );
    expect(Object.isFrozen(node.props)).toBe(true);
  });

  it("composes the donor faq as a native accordion whose questions are level-3 headings", () => {
    const items = [
      { question: "Why?", answer: "Because." },
      { question: "How?", answer: "Plainly." },
    ];
    const outcome = composeUnoFoundationSubset(envelope({ type: "faq", items }));
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const node = outcome.document.sections[0];
    expect(node?.module).toBe("interaction.accordion");
    if (node?.module !== "interaction.accordion") return;
    expect(node.props.items).toEqual([
      { sectionId: "family-0-faq-answer-0", label: "Why?" },
      { sectionId: "family-0-faq-answer-1", label: "How?" },
    ]);
    expect(node.props.summaryHeadingLevel).toBe(3);
    expect(node.children.map((child) => child.id)).toEqual(["family-0-faq-answer-0", "family-0-faq-answer-1"]);
  });


  it("composes the donor columns as level-3 titles under an authored section heading", () => {
    const outcome = composeUnoFoundationSubset(
      titledEnvelope({
        type: "columns",
        items: [{ title: "Left", body: "L" }, { title: "Right", items: ["A", "B"] }],
      }),
    );
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const grid = outcome.document.sections[1];
    expect(grid?.module).toBe("layout.grid");
    if (grid?.module !== "layout.grid") return;
    expect(grid.children.map((child) => child.id)).toEqual(["family-1-columns-column-0", "family-1-columns-column-1"]);
    for (const column of grid.children) {
      if (column.module !== "layout.stack") continue;
      const heading = column.children[0];
      expect(heading?.module).toBe("content.heading");
      if (heading?.module === "content.heading") expect(heading.props.level).toBe(3);
    }
  });

  it("refuses any donor field that would try to author its own heading level", () => {
    for (const extra of [{ level: 3 }, { itemHeadingLevel: 3 }, { summaryHeadingLevel: 3 }, { open: true }]) {
      expectRefusal(envelope({ type: "steps", items: [{ title: "One" }], ...extra }), "family:unsupported-feature");
      expectRefusal(
        envelope({ type: "faq", items: [{ question: "Why?", answer: "Because." }], ...extra }),
        "family:unsupported-feature",
      );
      expectRefusal(
        envelope({ type: "columns", items: [{ title: "A", body: "B" }, { title: "C", body: "D" }], ...extra }),
        "family:unsupported-feature",
      );
    }
  });

  it("keeps the fourteen untouched family sections byte-identical to their recorded before-state", () => {
    const byId = new Map(committedPage.sections.map((section: { id: string }) => [section.id, section]));
    expect(Object.keys(UNAFFECTED_DIGESTS)).toHaveLength(14);
    for (const [id, digest] of Object.entries(UNAFFECTED_DIGESTS)) {
      const section = byId.get(id);
      expect(section).toBeDefined();
      expect(digestOf(JSON.stringify(section))).toBe(digest);
    }
  });

  it("keeps exactly the three documented family sections recomposed and nothing else", () => {
    const outcome = composeUnoFoundationSubset(durableSource, durableBindings);
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    const parsed = readUnoPageDocument(JSON.stringify(committedPage));
    expect(parsed.accepted).toBe(true);
    if (!parsed.accepted) return;
    expect(parsed.document.sections).toHaveLength(23);
    expect(JSON.stringify(parsed.document.sections.slice(6))).toBe(JSON.stringify(outcome.document.sections));
    const changed = parsed.document.sections
      .slice(6)
      .filter((node) => !(node.id in UNAFFECTED_DIGESTS))
      .map((node) => node.id);
    expect(changed).toEqual(["family-3-faq", "family-11-steps", "family-14-columns"]);
  });

});

// `UNO-WO-102 / R01` D1: the donor's rich `table` and `list` surface — Markdown caption/detail, closed `surface` and a
// Markdown `markdown` flag — composing to native semantic markup while every malformed or unsafe form still refuses the
// whole source with no partial render.
describe("rich table and list (WO-102 D1)", () => {
  it("composes and renders a Markdown caption and closed surface on the native table", () => {
    const html = render(
      composed(
        envelope({
          type: "table",
          columns: ["Item", "Note"],
          rows: [
            ["First", "Kept"],
            ["Second", "Kept"],
          ],
          caption: "A **safe** caption.",
          surface: "muted",
        }),
      ),
    );
    expect(html).toContain('<section class="uno-json-table-section"');
    expect(html).toContain('data-uno-surface="muted"');
    expect(html).toContain("<caption>");
    expect(html).toContain('<strong class="uno-family-md-strong">safe</strong>');
    expect((html.match(/<th scope="col">/gu) ?? []).length).toBe(2);
    expect((html.match(/<td>/gu) ?? []).length).toBe(4);
    expect(html).toContain("uno-json-table-scroll");
  });

  it("composes and renders Markdown detail and a closed surface on a native list", () => {
    const html = render(
      composed(
        envelope({
          type: "list",
          ordered: true,
          surface: "bordered",
          items: [{ label: "First", detail: "**Safe** detail." }, "Plain entry"],
        }),
      ),
    );
    expect(html).toContain('<section class="uno-json-list-section"');
    expect(html).toContain('data-uno-surface="bordered"');
    expect((html.match(/<li>/gu) ?? []).length).toBe(2);
    expect(html).toContain('<strong class="uno-family-md-strong">Safe</strong>');
    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Plain entry"));
    expect(html).not.toContain("<a ");
  });

  it("keeps the exact legacy props and markup when no rich field is authored", () => {
    const legacyTable = composed(envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "Plain" }));
    expect(legacyTable.sections[0]?.props).toEqual({ variant: "table", columns: ["A"], rows: [["1"]], caption: "Plain" });
    expect(render(legacyTable)).toContain('<div class="uno-json-table-scroll" id="family-0-table" tabindex="0">');
    const legacyList = composed(envelope({ type: "list", items: [{ label: "Only", detail: "Plain" }] }));
    expect(legacyList.sections[0]?.props).toEqual({ variant: "list", items: [{ label: "Only", detail: "Plain" }] });
  });

  it("refuses every malformed, unsafe or out-of-subset rich form", () => {
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [["1"]], surface: "raised" }), "family:target-refused");
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "Text <b>x</b>" }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "![alt](https://example.org/a.png)" }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "[x](javascript:alert(1))" }),
      "family:unsupported-feature",
    );
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "x".repeat(321) }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "list", items: [{ label: "A", detail: "x".repeat(321) }] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "list", items: [{ label: "A", link: "contact" }] }),
      "family:target-refused",
    );
    expectRefusal(envelope({ type: "list", items: [{ label: "A", route: "about?x" }] }), "family:target-refused");
    expectRefusal(
      envelope({ type: "list", items: [{ label: "A", href: "/x", link: "contact" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [["1"]], markdown: true }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: " Padded" }), "family:target-refused");
  });
});

/**
 * `UNO-WO-116 / R01`: the composer refuses a malformed Markdown-capable field (even without a single Markdown character) and
 * never falls back to literal rendering, while valid multilingual content still composes, round-trips and serves unchanged.
 *
 * The four malformed shapes are the same ones the shared reader refuses; the point here is that no family can be the exception
 * and that the refusal is the whole source, never a partial Page.
 */
describe("composeUnoFoundationSubset — shared Unicode well-formedness", () => {
  const MALFORMED = [
    "Lead \uD800 tail",
    "Lead \uDC00 tail",
    "Lead \uDC00\uD800 tail",
    "Lead \uD800A\uDC00 tail",
  ] as const;

  /** Every Markdown-capable donor surface of the eight credited families, with its established refusal reason. */
  const SURFACES: readonly (readonly [string, (value: string) => unknown, string])[] = [
    ["prose body", (value) => envelope({ type: "prose", body: value }), "family:unsupported-feature"],
    ["callout body", (value) => envelope({ type: "callout", body: value }), "family:unsupported-feature"],
    [
      "table caption",
      (value) => envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: value }),
      "family:unsupported-feature",
    ],
    [
      "list item detail",
      (value) => envelope({ type: "list", items: [{ label: "L", detail: value }] }),
      "family:unsupported-feature",
    ],
    ["hero lede", (value) => envelope({ type: "hero", lede: value }), "family:unsupported-feature"],
    ["hero support", (value) => envelope({ type: "hero", support: value }), "family:unsupported-feature"],
    [
      "stats item detail",
      (value) => envelope({ type: "stats", items: [{ value: "1", label: "L", detail: value }] }),
      "family:unsupported-feature",
    ],
    [
      "stats lede",
      (value) => envelope({ type: "stats", items: [{ value: "1", label: "L" }], lede: value }),
      "family:unsupported-feature",
    ],
    [
      "steps item body",
      (value) => envelope({ type: "steps", items: [{ title: "T", body: value }] }),
      "family:unsupported-feature",
    ],
    [
      "steps lede",
      (value) => envelope({ type: "steps", items: [{ title: "T" }], lede: value }),
      "family:unsupported-feature",
    ],
    // The four ledes that keep their previous closed target refusal.
    ["prose lede", (value) => envelope({ type: "prose", body: "Body.", lede: value }), "family:target-refused"],
    ["list lede", (value) => envelope({ type: "list", items: ["One"], lede: value }), "family:target-refused"],
    [
      "table lede",
      (value) => envelope({ type: "table", columns: ["A"], rows: [["1"]], lede: value }),
      "family:target-refused",
    ],
  ];

  it("refuses every malformed Markdown-capable field without any Markdown punctuation in the source", () => {
    for (const [label, build, reason] of SURFACES) {
      for (const value of MALFORMED) {
        // The value carries no Markdown marker at all: `hasFamilyMarkdown` is false, so only the shared read can catch it.
        expect(/[*`[\]_~#>-]/u.test(value), `${label} must not carry Markdown punctuation`).toBe(false);
        expectRefusal(build(value), reason);
      }
    }
  });

  it("keeps valid astral pairs, combining sequences and mixed scripts composed, round-tripped and served", () => {
    const multilingual = "Übersicht \u{1F600} e\u0301 概要 שלום مرحبا नमस्ते ไทย";
    for (const [label, build] of SURFACES) {
      const document = composed(build(multilingual));
      // The document re-reads from its own serialized JSON, and the authored text is preserved byte-for-byte.
      expect(readUnoPageDocument(JSON.stringify(document)).accepted, label).toBe(true);
      expect(JSON.stringify(document), label).toContain("\u{1F600}");
    }
    // Served markup carries the supplementary pair instead of a replacement character.
    const proseHtml = render(composed(envelope({ type: "prose", body: multilingual })));
    expect(proseHtml).toContain("\u{1F600}");
    expect(proseHtml).toContain("e\u0301");
    expect(proseHtml).not.toContain("\uFFFD");
  });
});


/**
 * `UNO-WO-116 / R02`: the corrections must not change a valid composition.
 *
 * The composer already reads every Markdown-capable field through the shared reader before it sets the closed flag, so its own
 * output always satisfies the strict reader's new declared-Markdown validation. These cases pin that: a plain single-line lede
 * keeps its byte-identical hoisted paragraph, a Markdown or multi-line lede keeps the declared form, and the three native
 * families whose fields are now validated compose, re-read and render exactly as before.
 */
describe("composeUnoFoundationSubset — R02 keeps valid compositions unchanged", () => {
  it("keeps a plain single-line lede byte-identically hoisted", () => {
    const document = composed(envelope({ type: "prose", body: "Body.", lede: "A single line." }));
    const section = document.sections[0];
    expect(section?.module).toBe("layout.stack");
    if (section?.module !== "layout.stack") return;
    expect(section.children.map((child) => child.module)).toEqual(["content.prose", "content.prose"]);
    expect(section.children[0]?.props).toEqual({ text: "A single line." });
    expect(section.children[1]?.props).toEqual({ text: "Body." });
  });

  it("keeps a multi-line or Markdown lede in the declared form and re-reads it", () => {
    for (const lede of ["One\nTwo", "A **visible** lede"]) {
      const document = composed(envelope({ type: "prose", body: "Body.", lede }));
      const props = document.sections[0]?.props as { text?: string; lede?: string; markdown?: true } | undefined;
      expect(props?.markdown, lede).toBe(true);
      expect(props?.lede, lede).toBe(lede);
      expect(readUnoPageDocument(JSON.stringify(document)).accepted, lede).toBe(true);
    }
    // A callout keeps the same declared Markdown lede inside its own accent.
    const callout = composed(envelope({ type: "callout", body: "Body.", lede: "One\nTwo", tone: "info" }));
    const props = callout.sections[0]?.props as { variant?: string; lede?: string; markdown?: true } | undefined;
    expect(props?.variant).toBe("callout");
    expect(props?.markdown).toBe(true);
    expect(props?.lede).toBe("One\nTwo");
  });

  it("keeps the credited hero, stats and steps Markdown fields composing, re-reading and rendering", () => {
    const hero = composed(envelope({ type: "hero", lede: "A **visible** line", support: "This is *bounded*." }));
    const stats = composed(
      envelope({ type: "stats", items: [{ value: "1", label: "One", detail: "Only **one** detail." }] }),
    );
    const steps = composed(envelope({ type: "steps", items: [{ title: "Draft", body: "The **source** step." }] }));
    for (const [label, document] of [
      ["hero", hero],
      ["stats", stats],
      ["steps", steps],
    ] as const) {
      expect(readUnoPageDocument(JSON.stringify(document)).accepted, label).toBe(true);
      const html = render(document);
      expect(html, label).toContain('<strong class="uno-family-md-strong">');
      expect(html, label).not.toContain("**");
    }
  });
});

/**
 * `UNO-WO-118 / R01`, second half: the FAQ splitting, Markdown answers and the closed surface.
 *
 * The donor's 24-item ceiling is represented by consecutive ordinary disclosure groups, never by raising the group bound:
 * the document reader still refuses nine panels in one accordion, and the composed Page keeps authored order, exact answer
 * ownership and the byte-identical plain output for every input that fitted before.
 */
describe("composeUnoFoundationSubset — faq groups, Markdown answers and the closed surface", () => {
  const faq = (items: readonly unknown[], extra: Record<string, unknown> = {}) =>
    composed(envelope({ type: "faq", items, ...extra }));
  const items = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ question: `Question ${index}`, answer: `Answer ${index}.` }));
  /** The number of disclosures one composed child carries, or -1 when it is not a disclosure group at all. */
  const panels = (node: { readonly module: string; readonly children?: readonly unknown[] } | undefined) =>
    node?.module === "interaction.accordion" ? (node.children?.length ?? -1) : -1;

  it("splits nine to twenty-four items into consecutive ordinary groups without raising the group bound", () => {
    const nine = faq(items(9)).sections[0];
    expect(nine?.module).toBe("layout.stack");
    expect(nine?.id).toBe("family-0-faq");
    if (nine?.module !== "layout.stack") return;
    expect(nine.children.map((child) => child.id)).toEqual(["family-0-faq-accordion-1", "family-0-faq-accordion-2"]);
    expect(nine.children.map(panels)).toEqual([8, 1]);
    // Authored order and exact answer ownership survive the split: each entry names its own child, in order.
    const first = nine.children[0];
    const second = nine.children[1];
    const firstEntry = first?.module === "interaction.accordion" ? first.props.items : [];
    const secondEntry = second?.module === "interaction.accordion" ? second.props.items : [];
    expect(firstEntry.length).toBe(8);
    expect(secondEntry).toEqual([{ sectionId: "family-0-faq-answer-8", label: "Question 8" }]);
    expect(second?.module === "interaction.accordion" ? second.children[0]?.id : "").toBe(
      secondEntry[0]?.sectionId,
    );

    const twentyFour = faq(items(24), { surface: "muted" }).sections[0];
    expect(twentyFour?.module).toBe("layout.stack");
    if (twentyFour?.module !== "layout.stack") return;
    expect(twentyFour.children.map((child) => child.id)).toEqual([
      "family-0-faq-accordion-1",
      "family-0-faq-accordion-2",
      "family-0-faq-accordion-3",
    ]);
    expect(twentyFour.children.map(panels)).toEqual([8, 8, 8]);
    // The closed surface is carried by each disclosure group; the container itself adds nothing.
    expect(twentyFour.props).toEqual({});
    for (const group of twentyFour.children) {
      if (group?.module !== "interaction.accordion") continue;
      expect(group.props.surface).toBe("muted");
      expect(group.props.summaryHeadingLevel).toBe(3);
      expect(group.children.length).toBeLessThanOrEqual(8);
    }
    // The ordinary accordion bound is untouched: a hand-authored document still refuses nine panels.
    const ninePanels = readUnoPageDocument({
      version: 1,
      title: "Accordion bound",
      sections: [
        {
          id: "accordion",
          module: "interaction.accordion",
          props: { items: Array.from({ length: 9 }, (_, index) => ({ sectionId: `p${index}`, label: `L${index}` })) },
          children: Array.from({ length: 9 }, (_, index) => ({
            id: `p${index}`,
            module: "content.prose",
            props: { text: "A." },
          })),
        },
      ],
    });
    expect(ninePanels.accepted).toBe(false);
  });

  it("reads a Markdown answer as the declared rich body and a plain answer as escaped text", () => {
    const node = faq([
      { question: "Marked down?", answer: "A **bounded** answer with [a link](https://example.org/notes)." },
      { question: "Plain?", answer: "A plain answer." },
    ]).sections[0];
    if (node?.module !== "interaction.accordion") throw new Error("expected an accordion");
    expect(node.children[0]?.props).toEqual({
      text: "A **bounded** answer with [a link](https://example.org/notes).",
      markdown: true,
    });
    expect(node.children[1]?.props).toEqual({ text: "A plain answer." });
    const html = render(
      composed(
        envelope({
          type: "faq",
          items: [{ question: "Marked down?", answer: "A **bounded** answer with [a link](https://example.org/notes)." }],
        }),
      ),
    );
    expect(html).toContain('<div class="uno-json-accordion" id="family-0-faq">');
    expect(html).toContain('<strong class="uno-family-md-strong">bounded</strong>');
    expect(html).toContain(
      '<a class="uno-family-md-link" href="https://example.org/notes" rel="noopener noreferrer">a link</a>',
    );
    expect(html).not.toContain("**bounded**");
    expect(html).not.toContain("open=");
  });

  it("renders the closed surface on the disclosure group only when it is authored", () => {
    const surfaced = render(
      composed(
        envelope({
          type: "faq",
          items: [{ question: "Where?", answer: "At the selected site." }],
          surface: "muted",
        }),
      ),
    );
    expect(surfaced).toContain('<div class="uno-json-accordion" data-uno-surface="muted" id="family-0-faq">');
    const plain = render(
      composed(envelope({ type: "faq", items: [{ question: "Where?", answer: "At the selected site." }] })),
    );
    expect(plain).toContain('<div class="uno-json-accordion" id="family-0-faq">');
    expect(plain).not.toContain("data-uno-surface");
    // `UNO-WO-118 / R02`: `plain` is authored explicitly and is still the ordinary accordion — the closed value is emitted,
    // but it carries no treatment of its own, which is exactly what the surface stylesheet must honour.
    const explicit = render(
      composed(
        envelope({
          type: "faq",
          items: [{ question: "Where?", answer: "At the selected site." }],
          surface: "plain",
        }),
      ),
    );
    expect(explicit).toContain('<div class="uno-json-accordion" data-uno-surface="plain" id="family-0-faq">');
  });

  it("applies the authored surface to every consecutive group of a long FAQ", () => {
    // `UNO-WO-118 / R02`: nine entries compose two ordinary groups, and both must carry the same closed surface so the
    // stylesheet can present the whole authored list as one surfacing choice rather than only the first group.
    const nine = render(
      composed(
        envelope({
          type: "faq",
          surface: "bordered",
          items: Array.from({ length: 9 }, (_, index) => ({ question: `Q${index}`, answer: `A${index}.` })),
        }),
      ),
    );
    expect(nine).toContain('<div class="uno-json-accordion" data-uno-surface="bordered" id="family-0-faq-accordion-1">');
    expect(nine).toContain('<div class="uno-json-accordion" data-uno-surface="bordered" id="family-0-faq-accordion-2">');
    expect((nine.match(/data-uno-surface="bordered"/gu) ?? []).length).toBe(2);
    expect((nine.match(/<details class="uno-json-disclosure">/gu) ?? []).length).toBe(9);
    expect(nine).toContain("<summary class=\"uno-json-disclosure-summary\"><h3>Q0</h3></summary>");
    expect(nine).toContain("<summary class=\"uno-json-disclosure-summary\"><h3>Q8</h3></summary>");
    expect(nine.indexOf("Q0")).toBeLessThan(nine.indexOf("Q8"));
    // The twenty-four-entry ceiling renders three surfaced groups, still never more than eight panels each.
    const twentyFour = render(
      composed(
        envelope({
          type: "faq",
          surface: "muted",
          items: Array.from({ length: 24 }, (_, index) => ({ question: `Q${index}`, answer: `A${index}.` })),
        }),
      ),
    );
    expect((twentyFour.match(/data-uno-surface="muted"/gu) ?? []).length).toBe(3);
    expect((twentyFour.match(/<details class="uno-json-disclosure">/gu) ?? []).length).toBe(24);
  });
});


