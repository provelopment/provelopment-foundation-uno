import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  UNO_FOUNDATION_SUBSET_FAMILIES,
  composeUnoFoundationSubset,
} from "../../src/application/compose-uno-foundation-families";
import { UNO_RENDERABLE_MODULES, readUnoPageDocument, type UnoPageDocument } from "../../src/core/page-document";
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

/** The composed, validated Page, failing loudly when the fixture itself is refused. */
function composed(input: unknown): UnoPageDocument {
  const outcome = composeUnoFoundationSubset(input);
  if (outcome.status !== "composed") throw new Error(`fixture refused: ${outcome.reason}`);
  return outcome.document;
}

/** Render one composed Page exactly as the page component would. */
function render(document: UnoPageDocument): string {
  return renderToStaticMarkup(createElement(UnoPageSections, { document }));
}

/** Assert one closed refusal, that it is a closed literal, and that no partial document came back. */
function expectRefusal(input: unknown, reason: string): void {
  const outcome = composeUnoFoundationSubset(input);
  expect(outcome.status).toBe("refused");
  if (outcome.status !== "refused") return;
  expect(outcome.reason).toBe(reason);
  expect(Object.prototype.hasOwnProperty.call(outcome, "document")).toBe(false);
}

describe("composeUnoFoundationSubset — nine bounded source shapes", () => {
  it("declares exactly the nine bounded families and leaves the 22-module registry untouched", () => {
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

  it("refuses every donor family outside the nine, never degrading it to prose", () => {
    for (const type of [
      "media",
      "gallery",
      "actions",
      "cards",
      "features",
      "columns",
      "faq",
      "contactForm",
    ]) {
      expectRefusal(envelope({ type }), "family:unsupported-family");
    }
    // `steps` and `quote` are composed now, so an unsupported-family refusal must never be claimed for them.
    expectRefusal(envelope({ type: "heading" }), "family:unsupported-family");
    expectRefusal(envelope("prose"), "family:unsafe-source");
    expectRefusal(envelope({ body: "No type." }), "family:unsupported-feature");
  });

  it("refuses an out-of-subset field on a supported family", () => {
    expectRefusal(envelope({ type: "prose", body: "A", heading: "H" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", lede: "L" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "callout", body: "A", align: "start" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "callout", body: "A", surface: "muted" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [["1"]], links: [] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "list", items: ["A"], visibility: "public" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "divider", html: "<b>" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", href: "/elsewhere" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", route: "/en" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", link: "/en" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", style: "color:red" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "A", onClick: "go()" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "list", items: [{ label: "A", href: "/x" }] }), "family:unsupported-feature");
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

  it("refuses Markdown instead of emitting its punctuation as faithful prose", () => {
    expectRefusal(envelope({ type: "prose", body: "This is **bold** text." }), "family:unsupported-feature");
    expectRefusal(
      envelope({ type: "prose", body: "See [link](https://example.org) here." }),
      "family:unsupported-feature",
    );
    expectRefusal(envelope({ type: "prose", body: "Run `command` now." }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "prose", body: "# Heading\nBody text." }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "callout", body: "A **note** here." }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "list", items: ["**bold label**"] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "list", items: [{ label: "A", detail: "`code`" }] }), "family:unsupported-feature");
    expectRefusal(
      envelope({ type: "table", columns: ["A"], rows: [["[x](https://example.org)"]] }),
      "family:unsupported-feature",
    );
    expectRefusal(envelope({ type: "table", columns: ["A"], rows: [["1"]], caption: "`c`" }), "family:unsupported-feature");
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
    expect(steps.sections[0]?.props).toEqual({ items: [{ title: "A" }] });
    expect(quote.sections[0]?.props).toEqual({ items: [{ quote: "Q" }] });
    expect(attributed.sections[0]?.props).toEqual({ items: [{ quote: "Q", attribution: "Only a name" }] });
    expect(described.sections[0]?.props).toEqual({ items: [{ title: "A", description: "B" }] });
  });
});

describe("composeUnoFoundationSubset — hero and stats refusal", () => {
  it("refuses hero fields and Markdown outside the bounded subset", () => {
    expectRefusal(
      envelope({ type: "hero", lede: "A", actions: [{ label: "X", href: "/x" }] }),
      "family:unsupported-feature",
    );
    expectRefusal(envelope({ type: "hero", support: "Only support" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "**bold**" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "A", eyebrow: "[x](https://example.org)" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "A", href: "/x" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "hero", lede: "A", route: "/en" }), "family:unsupported-feature");
  });

  it("refuses malformed hero values through the Uno target", () => {
    expectRefusal(envelope({ type: "hero", lede: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "A", align: "end" }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "A", surface: "loud" }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "x".repeat(4001) }), "family:target-refused");
    expectRefusal(envelope({ type: "hero", lede: "A", eyebrow: "x".repeat(161) }), "family:target-refused");
  });

  it("refuses stats fields, links and Markdown outside the bounded subset", () => {
    expectRefusal(envelope({ type: "stats", items: [], heading: "H" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "stats", items: [{ value: "1", label: "X", href: "/x" }] }), "family:unsupported-feature");
    expectRefusal(
      envelope({ type: "stats", items: [{ value: "1", label: "X", detail: "[x](https://example.org)" }] }),
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
/** The nine bounded subsets this adapter composes, in adapter order. */
const MAPPED_9 = ["prose", "callout", "table", "list", "divider", "hero", "stats", "steps", "quote"] as const;

describe("composeUnoFoundationSubset — steps and quote React markup", () => {
  const html = render(composed(nineSectionSource()));

  it("renders the steps as one real ordered timeline list in authored order", () => {
    expect(html).toContain('<section class="uno-json-timeline" data-uno-surface="muted" id="family-7-steps">');
    expect((html.match(/<ol class="uno-json-timeline-list">/gu) ?? []).length).toBe(1);
    expect((html.match(/class="uno-json-timeline-item"/gu) ?? []).length).toBe(2);
    expect(html).toContain('<p class="uno-json-timeline-title">Prepare</p>');
    expect(html).toContain('<p class="uno-json-timeline-title">Publish</p>');
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
  it("refuses quote fields, caption semantics and Markdown outside the bounded subset", () => {
    for (const extra of ["heading", "lede", "href", "onClick"]) {
      expectRefusal(envelope({ type: "quote", body: "Q", [extra]: "X" }), "family:unsupported-feature");
    }
    expectRefusal(envelope({ type: "quote", body: "Q", role: "Reviewer" }), "family:unsupported-feature");
    for (const body of ["**bold**", "*italic*", "[x](https://example.org)", "a `code` span", "~~strike~~"]) {
      expectRefusal(envelope({ type: "quote", body }), "family:unsupported-feature");
    }
  });

  it("refuses malformed quote values through the Uno target", () => {
    expectRefusal(envelope({ type: "quote", body: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "q".repeat(4001) }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", align: "end" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", surface: "loud" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", attribution: "" }), "family:target-refused");
    expectRefusal(envelope({ type: "quote", body: "Q", attribution: "a".repeat(161) }), "family:target-refused");
  });
});

describe("composeUnoFoundationSubset — steps refusal", () => {
  it("refuses steps fields, item states and Markdown outside the bounded subset", () => {
    expectRefusal(envelope({ type: "steps", items: [{ title: "A" }], heading: "H" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "steps", items: [{ title: "A" }], lede: "L" }), "family:unsupported-feature");
    for (const extra of ["href", "status", "dateLabel"]) {
      expectRefusal(
        envelope({ type: "steps", items: [{ title: "A", [extra]: "X" }] }),
        "family:unsupported-feature",
      );
    }
    expectRefusal(envelope({ type: "steps", items: "A" }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "steps", items: ["A"] }), "family:unsupported-feature");
    expectRefusal(envelope({ type: "steps", items: [{ title: "A", body: "*i*" }] }), "family:unsupported-feature");
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

describe("composeUnoFoundationSubset — canonical donor inventory", () => {
  it("maps exactly nine of the donor's seventeen families and leaves eight unimplemented", () => {
    const left = DONOR_17.filter((name) => !(MAPPED_9 as readonly string[]).includes(name));
    expect([...UNO_FOUNDATION_SUBSET_FAMILIES]).toEqual([...MAPPED_9]);
    expect(left).toEqual([
      "media",
      "gallery",
      "actions",
      "cards",
      "features",
      "columns",
      "faq",
      "contactForm",
    ]);
  });

  it("keeps the committed ledger identical to the canonical inventory", () => {
    const ledger = readFileSync(
      fileURLToPath(new URL("../../.documents/Architecture/u04-family-parity.md", import.meta.url)),
      "utf8",
    );
    const unimplemented =
      "**UNIMPLEMENTED (8):** `media`, `gallery`, `actions`, `cards`, `features`, `columns`, `faq`, `contactForm`.";
    expect(ledger.split(unimplemented).length - 1).toBe(1);
    expect(ledger).not.toContain("UNIMPLEMENTED (10)");
    expect(ledger).not.toContain("seven bounded");
    expect(ledger).not.toContain("ten donor families entirely unimplemented");
    expect(ledger).not.toContain("UNIMPLEMENTED**: `heading`");
    expect(ledger).not.toMatch(/FAMILY_PARITY=(17\/17|9\/17|7\/17)/u);
    for (const family of ["hero", "stats", "steps", "quote"]) expect(ledger).toContain(`| \`${family}\` |`);
    expect(ledger).toContain("nine bounded");
    expect(ledger).toContain("zero of seventeen full semantic parity");
  });
});
