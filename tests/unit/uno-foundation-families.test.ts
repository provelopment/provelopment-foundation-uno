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

describe("composeUnoFoundationSubset — five accepted source shapes", () => {
  it("declares exactly the five supported families and leaves the 22-module registry untouched", () => {
    expect([...UNO_FOUNDATION_SUBSET_FAMILIES]).toEqual(["prose", "callout", "table", "list", "divider"]);
    expect(Object.isFrozen(UNO_FOUNDATION_SUBSET_FAMILIES)).toBe(true);
    expect(UNO_RENDERABLE_MODULES.length).toBe(22);
  });

  it("composes one validated node per section with stable ids and module ids", () => {
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

  it("refuses every donor family outside the five, never degrading it to prose", () => {
    for (const type of ["media", "faq", "contactForm", "heading", "hero", "pricing", "timeline", "gallery"]) {
      expectRefusal(envelope({ type }), "family:unsupported-family");
    }
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



