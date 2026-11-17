import { describe, expect, it } from "vitest";

import {
  UNO_PAGE_DOCUMENT_LIMITS,
  UNO_PAGE_DOCUMENT_REFUSAL_REASONS,
  UNO_RENDERABLE_MODULES,
  readUnoPageDocument,
  type UnoPageDocumentResult,
} from "../../src/core/page-document";

/** A minimal valid document: one prose section. */
function minimal(): Record<string, unknown> {
  return {
    version: 1,
    title: "Fixture page",
    sections: [{ id: "intro", module: "content.prose", props: { text: "A plain paragraph." } }],
  };
}

/** A representative full document exercising all five renderable IDs. */
function full(): Record<string, unknown> {
  return {
    version: 1,
    title: "Übersicht — 概要",
    description: "A bounded description.",
    visibility: "public",
    sections: [
      {
        id: "hero-stack",
        module: "layout.stack",
        props: { gap: "wide" },
        children: [
          { id: "hero-title", module: "content.heading", props: { text: "Fixture heading", level: 2 } },
          { id: "hero-body", module: "content.prose", props: { text: "Line one.\nLine two." } },
        ],
      },
      {
        id: "cards",
        module: "layout.grid",
        props: { columns: 2, itemSemantics: "article" },
        children: [
          {
            id: "card-a",
            module: "layout.stack",
            props: { gap: "tight" },
            children: [
              { id: "card-a-title", module: "content.heading", props: { text: "Card A", level: 3 } },
              { id: "card-a-body", module: "content.prose", props: { text: "Card A body." } },
            ],
          },
          {
            id: "card-b",
            module: "layout.stack",
            props: {},
            children: [
              { id: "card-b-title", module: "content.heading", props: { text: "Card B", level: 3 } },
              { id: "card-b-body", module: "content.prose", props: { text: "Card B body." } },
            ],
          },
        ],
      },
      {
        id: "card-actions",
        module: "content.actions",
        props: { items: [{ label: "Read card A", targetId: "card-a" }] },
      },
    ],
  };
}

/** Assert one closed refusal, and that the reason is a member of the published vocabulary. */
function expectRefusal(input: unknown, reason: string, options?: { reservedHome?: boolean }): void {
  const result: UnoPageDocumentResult = readUnoPageDocument(input, options ?? {});
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(UNO_PAGE_DOCUMENT_REFUSAL_REASONS).toContain(result.reason);
}

describe("readUnoPageDocument — accepted documents", () => {
  it("accepts a minimal document, defaults visibility to public and freezes the result", () => {
    const result = readUnoPageDocument(minimal());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.document.version).toBe(1);
    expect(result.document.title).toBe("Fixture page");
    expect(result.document.visibility).toBe("public");
    expect(result.document.description).toBeUndefined();
    expect(Object.isFrozen(result.document)).toBe(true);
    expect(Object.isFrozen(result.document.sections)).toBe(true);
    expect(Object.isFrozen(result.document.sections[0])).toBe(true);
  });

  it("serializes deterministically across the server/client boundary", () => {
    const first = readUnoPageDocument(full());
    const second = readUnoPageDocument(full());
    expect(first.accepted && second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;
    expect(JSON.stringify(first.document)).toBe(JSON.stringify(second.document));
    expect(JSON.parse(JSON.stringify(first.document))).toEqual(first.document);
  });

  it("accepts all five renderable module IDs and nothing else as renderable", () => {
    expect([...UNO_RENDERABLE_MODULES]).toEqual([
      "layout.stack",
      "layout.grid",
      "content.heading",
      "content.prose",
      "content.actions",
    ]);
    expect(readUnoPageDocument(full()).accepted).toBe(true);
  });

  it("parses raw JSON text, including a non-ASCII title and escapes", () => {
    const text = `{
      "version": 1,
      "title": "Übersicht \\u2014 概要",
      "sections": [
        { "id": "intro", "module": "content.prose", "props": { "text": "Quote: \\"ok\\" and tab:\\tok" } }
      ]
    }`;
    const result = readUnoPageDocument(text);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.document.title).toBe("Übersicht — 概要");
  });

  it("accepts an unlisted document off the reserved Home, and refuses the same bytes at Home", () => {
    const unlisted = { ...minimal(), visibility: "unlisted" };
    const away = readUnoPageDocument(unlisted);
    expect(away.accepted).toBe(true);
    if (away.accepted) expect(away.document.visibility).toBe("unlisted");
    expectRefusal(unlisted, "document:home-cannot-be-unlisted", { reservedHome: true });
  });

  it("accepts the documented section cap exactly and refuses one past it", () => {
    const sections = Array.from({ length: UNO_PAGE_DOCUMENT_LIMITS.sections }, (_value, index) => ({
      id: `section-${index}`,
      module: "content.prose",
      props: { text: "Body." },
    }));
    expect(readUnoPageDocument({ ...minimal(), sections }).accepted).toBe(true);
    expectRefusal({ ...minimal(), sections: [...sections, sections[0]] }, "document:too-many-sections");
  });

  it("accepts every closed stack gap and grid column count", () => {
    for (const gap of ["tight", "normal", "wide"]) {
      const result = readUnoPageDocument({
        version: 1,
        title: "Gaps",
        sections: [
          {
            id: "stack",
            module: "layout.stack",
            props: { gap },
            children: [{ id: "body", module: "content.prose", props: { text: "Body." } }],
          },
        ],
      });
      expect(result.accepted).toBe(true);
    }
    for (const columns of [1, 2, 3, 4]) {
      const result = readUnoPageDocument({
        version: 1,
        title: "Grid",
        sections: [
          {
            id: "grid",
            module: "layout.grid",
            props: { columns },
            children: [{ id: "body", module: "content.prose", props: { text: "Body." } }],
          },
        ],
      });
      expect(result.accepted).toBe(true);
    }
  });
});

/** One top-level section wrapper. */
function section(
  id: string,
  module: string,
  props: Record<string, unknown>,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return { id, module, props, ...(extra ?? {}) };
}

describe("readUnoPageDocument — closed refusals", () => {
  it("distinguishes an unregistered module from a registered-but-unrenderable one", () => {
    expectRefusal({ ...minimal(), sections: [section("x", "layout.marquee", {})] }, "document:unknown-module");
    expectRefusal({ ...minimal(), sections: [section("x", "media.image", {})] }, "document:renderer-unavailable");
    expectRefusal({ ...minimal(), sections: [section("x", "interaction.contact", {})] }, "document:renderer-unavailable");
  });

  it("refuses an unsupported version instead of upgrading or ignoring it", () => {
    expectRefusal({ ...minimal(), version: 2 }, "document:unsupported-version");
    expectRefusal({ ...minimal(), version: "1" }, "document:unsupported-version");
  });

  it("refuses any extra top-level key, so no document can carry publication authority", () => {
    expectRefusal({ ...minimal(), canonical: "https://example.test/" }, "document:unexpected-key");
    expectRefusal({ ...minimal(), publication: "published" }, "document:unexpected-key");
    expectRefusal({ ...minimal(), locale: "en-001" }, "document:unexpected-key");
  });

  it("refuses duplicate and prototype-pollution keys in raw JSON text", () => {
    const duplicate =
      '{"version":1,"title":"A","title":"B","sections":[{"id":"a","module":"content.prose","props":{"text":"B"}}]}';
    expectRefusal(duplicate, "document:json-duplicate-key");
    const proto =
      '{"version":1,"title":"A","__proto__":{"polluted":true},"sections":[{"id":"a","module":"content.prose","props":{"text":"B"}}]}';
    expectRefusal(proto, "document:json-unsafe");
    expectRefusal("{ not json", "document:json-parse");
    expectRefusal('{"version":1,}', "document:json-parse");
  });

  it("refuses a title, description and visibility outside the accepted bounds", () => {
    expectRefusal({ ...minimal(), title: "   " }, "document:invalid-title");
    expectRefusal({ ...minimal(), title: "x".repeat(UNO_PAGE_DOCUMENT_LIMITS.titleCodePoints + 1) }, "document:invalid-title");
    expectRefusal({ ...minimal(), title: "<b>bold</b>" }, "document:unsafe-text");
    expectRefusal(
      { ...minimal(), description: "x".repeat(UNO_PAGE_DOCUMENT_LIMITS.descriptionCodePoints + 1) },
      "document:invalid-description",
    );
    expectRefusal({ ...minimal(), visibility: "hidden" }, "document:invalid-visibility");
  });

  it("refuses empty, oversized and non-object documents", () => {
    expectRefusal({ ...minimal(), sections: [] }, "document:invalid-sections");
    expectRefusal({ ...minimal(), sections: "nope" }, "document:invalid-sections");
    expectRefusal([], "document:not-an-object");
    expectRefusal(null, "document:not-an-object");
    expectRefusal(undefined, "document:not-an-object");
    expectRefusal("x".repeat(UNO_PAGE_DOCUMENT_LIMITS.sourceBytes + 1), "document:text-too-large");
  });

  it("refuses identifiers that are malformed, duplicated or not unique across the document", () => {
    expectRefusal({ ...minimal(), sections: [section("Bad_Id", "content.prose", { text: "Body." })] }, "document:invalid-section-id");
    expectRefusal({ ...minimal(), sections: [section("9lead", "content.prose", { text: "Body." })] }, "document:invalid-section-id");
    expectRefusal(
      {
        ...minimal(),
        sections: [
          section("same", "content.prose", { text: "Body." }),
          section("same", "content.prose", { text: "Body." }),
        ],
      },
      "document:duplicate-section-id",
    );
  });

  it("refuses extra or missing section keys, and children on a non-layout module", () => {
    expectRefusal({ ...minimal(), sections: [section("x", "content.prose", { text: "Body." }, { children: [] })] }, "document:invalid-section");
    expectRefusal({ ...minimal(), sections: [section("x", "content.prose", { text: "Body." }, { id2: "y" })] }, "document:invalid-section");
    expectRefusal({ ...minimal(), sections: [{ id: "x", module: "content.prose" }] }, "document:invalid-section");
    expectRefusal({ ...minimal(), sections: [{ module: "content.prose", props: { text: "B" } }] }, "document:invalid-section-id");
  });

  it("refuses a layout with no children, too many children, or a child of the wrong shape", () => {
    expectRefusal({ ...minimal(), sections: [{ id: "s", module: "layout.stack", props: {} }] }, "document:invalid-children");
    const nine = Array.from({ length: 9 }, (_value, index) => section(`child-${index}`, "content.prose", { text: "Body." }));
    expectRefusal({ ...minimal(), sections: [section("s", "layout.stack", {}, { children: nine })] }, "document:invalid-children");
    expectRefusal(
      { ...minimal(), sections: [section("s", "layout.stack", {}, { children: ["nope"] })] },
      "document:invalid-section",
    );
  });
});

describe("readUnoPageDocument — per-module props and hostile input", () => {
  it("layout.stack: refuses an empty child list (unique stack negative)", () => {
    expectRefusal({ ...minimal(), sections: [section("s", "layout.stack", {}, { children: [] })] }, "document:invalid-children");
  });

  it("layout.grid: refuses an undeclared column count (unique grid negative)", () => {
    expectRefusal(
      {
        ...minimal(),
        sections: [section("g", "layout.grid", { columns: 5 }, { children: [section("c", "content.prose", { text: "B" })] })],
      },
      "document:invalid-props",
    );
  });

  it("content.heading: refuses the Page h1 and a skipped level (unique heading negative)", () => {
    expectRefusal({ ...minimal(), sections: [section("h", "content.heading", { text: "Title", level: 1 })] }, "document:invalid-props");
    expectRefusal({ ...minimal(), sections: [section("h", "content.heading", { text: "Deep", level: 5 })] }, "document:heading-order");
    expect(
      readUnoPageDocument({
        ...minimal(),
        sections: [
          section("h2", "content.heading", { text: "Two", level: 2 }),
          section("h3", "content.heading", { text: "Three", level: 3 }),
        ],
      }).accepted,
    ).toBe(true);
  });

  it("content.prose: refuses executable markup in otherwise inert text (unique prose negative)", () => {
    expectRefusal(
      { ...minimal(), sections: [section("p", "content.prose", { text: "<script>alert(1)</script>" })] },
      "document:unsafe-text",
    );
    expectRefusal(
      { ...minimal(), sections: [section("p", "content.prose", { text: "javascript:alert(1)" })] },
      "document:unsafe-text",
    );
    expectRefusal(
      { ...minimal(), sections: [section("p", "content.prose", { text: "x".repeat(UNO_PAGE_DOCUMENT_LIMITS.textCodePoints + 1) })] },
      "document:invalid-props",
    );
  });

  it("content.actions: refuses a dead, foreign or oversized destination (unique actions negative)", () => {
    expectRefusal(
      { ...minimal(), sections: [section("a", "content.actions", { items: [{ label: "Go", targetId: "missing" }] })] },
      "document:unresolved-target",
    );
    expectRefusal(
      { ...minimal(), sections: [section("a", "content.actions", { items: [{ label: "Go", targetId: "../escape" }] })] },
      "document:unsafe-link",
    );
    expectRefusal({ ...minimal(), sections: [section("a", "content.actions", { items: [] })] }, "document:invalid-props");
    expectRefusal(
      { ...minimal(), sections: [section("a", "content.actions", { items: [{ label: "Go", targetId: "intro", href: "https://evil.test" }] })] },
      "document:invalid-props",
    );
  });

  it("refuses cyclic graphs, sparse arrays, class instances, accessors and throwing proxies", () => {
    const cycle: Record<string, unknown> = { id: "loop", module: "layout.stack", props: {} };
    cycle["children"] = [cycle];
    expectRefusal({ version: 1, title: "Cycle", sections: [cycle] }, "document:cyclic");

    const sparse: unknown[] = new Array(1);
    expectRefusal({ ...minimal(), sections: [section("s", "layout.stack", {}, { children: sparse })] }, "document:invalid-children");

    class DocumentLike {
      readonly version = 1;
      readonly title = "Class instance";
      readonly sections = [{ id: "intro", module: "content.prose", props: { text: "Body." } }];
    }
    expectRefusal(new DocumentLike(), "document:input-not-plain");

    const accessor: Record<string, unknown> = { title: "Accessor", sections: minimal()["sections"] };
    Object.defineProperty(accessor, "version", { get: () => 1, enumerable: true });
    expectRefusal(accessor, "document:input-not-plain");

    const trap = new Proxy({}, { getPrototypeOf: () => { throw new Error("boom"); } });
    expectRefusal(trap, "document:unreadable");
  });

  it("refuses more depth or more nodes than the documented caps", () => {
    const leaf = section("leaf", "content.prose", { text: "Body." });
    const wrap = (id: string, children: unknown) => section(id, "layout.stack", {}, { children });
    const deep = { ...minimal(), sections: [wrap("d1", [wrap("d2", [wrap("d3", [wrap("d4", [leaf])])])])] };
    expectRefusal(deep, "document:too-deep");

    const wide = {
      ...minimal(),
      sections: Array.from({ length: 32 }, (_value, index) =>
        wrap(`stack-${index}`, Array.from({ length: 4 }, (_child, child) => section(`n-${index}-${child}`, "content.prose", { text: "B" }))),
      ),
    };
    expectRefusal(wide, "document:too-many-nodes");
  });

  it("never echoes authored text, a destination or a secret in a refusal", () => {
    const marker = "SECRET_MARKER_9f3";
    const result = readUnoPageDocument({ ...minimal(), title: `<b>${marker}</b>` });
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).not.toContain(marker);
    expect(result.reason.startsWith("document:")).toBe(true);
    expect(result.reason.length).toBeLessThan(48);

    const link = readUnoPageDocument({
      ...minimal(),
      sections: [section("a", "content.actions", { items: [{ label: marker, targetId: `../${marker}` }] })],
    });
    expect(link.accepted).toBe(false);
    if (!link.accepted) expect(link.reason).not.toContain(marker);
  });
});



