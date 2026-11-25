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
      {
        id: "hero",
        module: "content.hero",
        props: {
          eyebrow: "Overview",
          lede: "A bounded lede.",
          support: "A bounded support line.",
          align: "center",
          surface: "muted",
          actions: [{ label: "Read card A", targetId: "card-a" }],
        },
      },
      {
        id: "figures",
        module: "content.stats",
        props: {
          heading: "Figures",
          level: 2,
          surface: "bordered",
          items: [
            { value: "3", label: "Modules", detail: "Added in this increment." },
            { value: "8", label: "Renderable IDs" },
          ],
        },
      },
      {
        id: "voices",
        module: "content.testimonials",
        props: {
          align: "start",
          items: [
            { quote: "A bounded quotation.", attribution: "Contributor A", role: "Reviewer" },
            { quote: "A second bounded quotation." },
          ],
        },
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

  it("accepts exactly the twenty-two registered module IDs as renderable", () => {
    expect([...UNO_RENDERABLE_MODULES]).toEqual([
      "layout.stack",
      "layout.grid",
      "layout.bento",
      "layout.layers",
      "content.heading",
      "content.prose",
      "content.actions",
      "content.hero",
      "content.stats",
      "content.testimonials",
      "content.pricing",
      "content.timeline",
      "media.image",
      "media.video",
      "media.gallery",
      "media.carousel",
      "design.watermark",
      "design.motion",
      "interaction.tabs",
      "interaction.accordion",
      "interaction.modal",
      "interaction.contact",
    ]);
    expect(UNO_RENDERABLE_MODULES).toHaveLength(22);
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
  it("distinguishes an unregistered module from a registered one with invalid props", () => {
    // A near-miss module literal is never repaired or guessed at.
    expectRefusal({ ...minimal(), sections: [section("x", "layout.marquee", {})] }, "document:unknown-module");
    // Every registered ID now has a renderer, so `document:renderer-unavailable` is unreachable for one and a
    // registered module with missing props is a *props* refusal. The two reasons stay distinguishable.
    expectRefusal({ ...minimal(), sections: [section("x", "media.image", {})] }, "document:invalid-props");
    // A leaf module with missing required props is a props refusal, not an availability refusal.
    expectRefusal({ ...minimal(), sections: [section("x", "media.gallery", {})] }, "document:invalid-props");
    // A child-bearing module without its `children` key is refused as a children problem, before props are read.
    expectRefusal({ ...minimal(), sections: [section("x", "design.motion", {})] }, "document:invalid-children");
    expect(UNO_RENDERABLE_MODULES).toHaveLength(22);
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
  // `UNO-WO-081 / R01`: the stand-alone `content.actions` list accepts a strictly disjoint union of the unchanged
  // same-document fragment and one literal `mailto:`/`https:` outbound link. The classifier is not modified here.
  it("content.actions: accepts the fragment, mailto and HTTPS forms with exact literal roundtrips", () => {
    const fragmentOnly = readUnoPageDocument({
      ...minimal(),
      sections: [
        section("intro", "content.prose", { text: "Body." }),
        section("a", "content.actions", { items: [{ label: "Jump", targetId: "intro" }] }),
      ],
    });
    if (!fragmentOnly.accepted) throw new Error(`fragment refused: ${fragmentOnly.reason}`);
    expect(JSON.stringify(fragmentOnly)).toContain('{"label":"Jump","targetId":"intro"}');

    const mixed = readUnoPageDocument({
      ...minimal(),
      sections: [
        section("intro", "content.prose", { text: "Body." }),
        section("a", "content.actions", {
          items: [
            { label: "Jump", targetId: "intro" },
            { label: "Write to the sample inbox", href: "mailto:contact@example.invalid" },
            { label: "Sample directions", href: "https://maps.example/directions?to=sample" },
            { label: "Sample availability", href: "https://booking.example/availability" },
          ],
        }),
      ],
    });
    expect(mixed.accepted).toBe(true);
    if (!mixed.accepted) return;
    const actions = mixed.document.sections[1];
    expect(actions?.module).toBe("content.actions");
    if (actions?.module !== "content.actions") return;
    expect(actions.props.items).toEqual([
      { label: "Jump", targetId: "intro" },
      { label: "Write to the sample inbox", href: "mailto:contact@example.invalid" },
      { label: "Sample directions", href: "https://maps.example/directions?to=sample" },
      { label: "Sample availability", href: "https://booking.example/availability" },
    ]);
    expect(JSON.stringify(actions.props)).toBe(
      '{"items":[{"label":"Jump","targetId":"intro"},' +
        '{"label":"Write to the sample inbox","href":"mailto:contact@example.invalid"},' +
        '{"label":"Sample directions","href":"https://maps.example/directions?to=sample"},' +
        '{"label":"Sample availability","href":"https://booking.example/availability"}]}',
    );
    expect(Object.isFrozen(actions.props)).toBe(true);
    expect(Object.isFrozen(actions.props.items)).toBe(true);

    // Eight entries is the unchanged cap and may mix both shapes freely, in authored order.
    const eight = Array.from({ length: 8 }, (_value, index) =>
      index % 2 === 0
        ? { label: `Link ${index}`, href: `https://example.invalid/${index}` }
        : { label: `Jump ${index}`, targetId: "intro" },
    );
    const capped = readUnoPageDocument({
      ...minimal(),
      sections: [section("intro", "content.prose", { text: "Body." }), section("a", "content.actions", { items: eight })],
    });
    expect(capped.accepted).toBe(true);
  });


  it("content.actions: refuses every outbound destination that is not exactly mailto or https", () => {
    const outbound = (href: unknown, label: unknown = "Go") => ({
      ...minimal(),
      sections: [section("a", "content.actions", { items: [{ label, href }] })],
    });
    for (const href of [
      // `http` is a category the unchanged classifier accepts, so only this module's exact-two-category rule refuses it.
      "http://example.invalid/x",
      "tel:+15550100",
      "javascript:alert(1)",
      "data:text/html,x",
      "blob:https://example.invalid/x",
      "//evil.example/x",
      "/root",
      "?q=1",
      "relative",
      "#frag",
      "%6dailto:x@example.invalid",
      "mailto:",
      "mailto:a@example.invalid\r\nBcc:x@example.invalid",
      "https://user:pass@example.invalid/",
      "https://example.invalid/%zz",
      "https://example.invalid/<x>",
      "https://example.invalid/x y",
      "https:///nohost",
      "",
      `https://example.invalid/${"a".repeat(2100)}`,
    ]) {
      expectRefusal(outbound(href), "document:unsafe-link");
    }
    // Only the label and the two exact shapes are accepted: an empty or overlong label, a wrong label type, an own
    // `undefined`, an extra key and a label-only entry each refuse the whole Page without a partial document.
    expectRefusal(outbound("https://example.invalid/x", ""), "document:invalid-props");
    expectRefusal(outbound("https://example.invalid/x", "x".repeat(161)), "document:invalid-props");
    expectRefusal(outbound("https://example.invalid/x", 7), "document:invalid-props");
    expectRefusal(outbound(undefined), "document:invalid-props");
    expectRefusal(
      {
        ...minimal(),
        sections: [section("a", "content.actions", { items: [{ label: "Go", href: "https://example.invalid/x", rel: "noopener" }] })],
      },
      "document:invalid-props",
    );
    expectRefusal(
      { ...minimal(), sections: [section("a", "content.actions", { items: [{ label: "Go" }] })] },
      "document:invalid-props",
    );
    // A malformed fragment target never falls through to a supplied `href`, and a dead one stays an unresolved target.
    expectRefusal(
      {
        ...minimal(),
        sections: [section("a", "content.actions", { items: [{ label: "Go", targetId: 5, href: "https://example.invalid/x" }] })],
      },
      "document:invalid-props",
    );
    expectRefusal(
      { ...minimal(), sections: [section("a", "content.actions", { items: [{ label: "Go", targetId: "missing" }] })] },
      "document:unresolved-target",
    );
    // Nine entries exceed the unchanged eight-entry cap.
    expectRefusal(
      {
        ...minimal(),
        sections: [
          section("a", "content.actions", {
            items: Array.from({ length: 9 }, (_value, index) => ({ label: `L${index}`, href: `https://example.invalid/${index}` })),
          }),
        ],
      },
      "document:invalid-props",
    );
  });


  it("content.actions: refuses hostile outbound input — accessors, duplicate JSON members and hero outbound forms", () => {
    let invoked = false;
    const accessorEntry: Record<string, unknown> = { label: "Go" };
    Object.defineProperty(accessorEntry, "href", {
      enumerable: true,
      get() {
        invoked = true;
        return "https://example.invalid/x";
      },
    });
    expectRefusal(
      { ...minimal(), sections: [section("a", "content.actions", { items: [accessorEntry] })] },
      "document:input-not-plain",
    );
    expect(invoked).toBe(false);

    const duplicated =
      '{"version":1,"title":"T","sections":[{"id":"a","module":"content.actions","props":{"items":[' +
      '{"label":"Go","href":"https://example.invalid/x","href":"https://evil.example/y"}]}}]}';
    expectRefusal(duplicated, "document:json-duplicate-key");

    // A throwing proxy cannot be read as plain data and never yields a partial document.
    const hostile = new Proxy(
      { label: "Go", href: "https://example.invalid/x" },
      {
        get() {
          throw new Error("hostile");
        },
        getPrototypeOf() {
          throw new Error("hostile");
        },
      },
    );
    const hostileResult = readUnoPageDocument({
      ...minimal(),
      sections: [section("a", "content.actions", { items: [hostile] })],
    });
    expect(hostileResult.accepted).toBe(false);

    // `UNO-WO-112 / R01`: the hero's outbound form is now the donor's own approved action — one static `mailto`/`https`
    // anchor with its closed optional variant — while a mixed entry stays a props refusal and an unsafe scheme a link
    // refusal. The fragment form keeps its `#<section-id>` anchor and still registers its target.
    const outboundHero = readUnoPageDocument({
      ...minimal(),
      sections: [
        section("hero", "content.hero", {
          lede: "Lead.",
          actions: [{ label: "Go", href: "https://example.invalid/x", variant: "primary" }],
        }),
      ],
    });
    expect(outboundHero.accepted).toBe(true);
    if (outboundHero.accepted) {
      const node = outboundHero.document.sections[0];
      expect(node?.module).toBe("content.hero");
      if (node?.module === "content.hero") {
        expect(node.props.actions).toEqual([
          { label: "Go", href: "https://example.invalid/x", variant: "primary" },
        ]);
      }
    }
    expectRefusal(
      {
        ...minimal(),
        sections: [
          section("hero", "content.hero", {
            lede: "Lead.",
            actions: [{ label: "Go", targetId: "probe", href: "https://example.invalid/x" }],
          }),
        ],
      },
      "document:invalid-props",
    );
    expectRefusal(
      {
        ...minimal(),
        sections: [
          section("hero", "content.hero", { lede: "Lead.", actions: [{ label: "Go", href: "javascript:alert(1)" }] }),
        ],
      },
      "document:unsafe-link",
    );
    expectRefusal(
      {
        ...minimal(),
        sections: [
          section("hero", "content.hero", {
            lede: "Lead.",
            actions: [{ label: "Go", href: "https://example.invalid/x", variant: "loud" }],
          }),
        ],
      },
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

/**
 * The three modules this increment adds (`UNO-WO-037 / R01`). Each has several accepted shapes and its own closed
 * negative case, so a regression in one module can never be mistaken for a regression in another.
 */
describe("readUnoPageDocument — content.hero, content.stats and content.testimonials", () => {
  /** One accepted document whose single section is the module under test. */
  function single(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { ...minimal(), sections: [section("probe", module, props)] };
  }

  it("content.hero: accepts a lede-only, a support-only and a fully styled variant", () => {
    expect(readUnoPageDocument(single("content.hero", { lede: "A bounded lede." })).accepted).toBe(true);
    expect(readUnoPageDocument(single("content.hero", { support: "A bounded support line." })).accepted).toBe(true);
    const styled = readUnoPageDocument(
      single("content.hero", {
        eyebrow: "Overview",
        lede: "A bounded lede.",
        support: "A bounded support line.",
        align: "center",
        surface: "bordered",
        actions: [{ label: "Go to the hero", targetId: "probe" }],
      }),
    );
    expect(styled.accepted).toBe(true);
    if (!styled.accepted) return;
    const node = styled.document.sections[0];
    expect(node?.module).toBe("content.hero");
    expect(Object.isFrozen(node?.props)).toBe(true);
  });

  it("content.hero: refuses a body-less hero, empty text, a fourth action and any heading attempt", () => {
    // Unique hero negative: an eyebrow alone is not an authored body.
    expectRefusal(single("content.hero", { eyebrow: "Only an eyebrow" }), "document:invalid-props");
    expectRefusal(single("content.hero", { lede: "   " }), "document:invalid-props");
    expectRefusal(
      single("content.hero", {
        lede: "Body.",
        actions: [1, 2, 3, 4].map((index) => ({ label: `Go ${index}`, targetId: "probe" })),
      }),
      "document:invalid-props",
    );
    expectRefusal(single("content.hero", { lede: "Body.", title: "An h1 attempt" }), "document:invalid-props");
    expectRefusal(single("content.hero", { lede: "Body.", level: 2 }), "document:invalid-props");
    expectRefusal(single("content.hero", { lede: "<b>HTML</b>" }), "document:unsafe-text");
    expectRefusal(single("content.hero", { lede: "Body.", align: "left" }), "document:invalid-props");
    expectRefusal(single("content.hero", { lede: "Body.", surface: "dark" }), "document:invalid-props");
    expectRefusal(
      single("content.hero", { lede: "Body.", actions: [{ label: "Go", targetId: "missing" }] }),
      "document:unresolved-target",
    );
    expectRefusal(
      single("content.hero", { lede: "Body.", actions: [{ label: "Go", targetId: "probe", href: "https://x.test" }] }),
      "document:invalid-props",
    );
  });

  it("content.stats: accepts one to six items, with and without a linked heading", () => {
    expect(readUnoPageDocument(single("content.stats", { items: [{ value: "1", label: "One" }] })).accepted).toBe(true);
    expect(
      readUnoPageDocument(single("content.stats", { items: [{ value: "2", label: "Two", detail: "A bounded detail." }] }))
        .accepted,
    ).toBe(true);
    expect(
      readUnoPageDocument(
        single("content.stats", { heading: "Figures", level: 2, items: [{ value: "3", label: "Three" }] }),
      ).accepted,
    ).toBe(true);
    const six = Array.from({ length: 6 }, (_value, index) => ({
      value: String(index + 1),
      label: `Label ${index + 1}`,
    }));
    const bounded = readUnoPageDocument(single("content.stats", { surface: "muted", items: six }));
    expect(bounded.accepted).toBe(true);
    if (!bounded.accepted) return;
    const node = bounded.document.sections[0];
    if (node?.module !== "content.stats") throw new Error("expected a stats node");
    expect(node.props.items.length).toBe(6);
    expect(node.props.surface).toBe("muted");
  });

  it("content.stats: refuses zero, seven, empty text, a stray level and a skipped heading level", () => {
    expectRefusal(single("content.stats", { items: [] }), "document:invalid-props");
    expectRefusal(
      single("content.stats", {
        items: Array.from({ length: 7 }, (_value, index) => ({ value: `${index}`, label: `L${index}` })),
      }),
      "document:invalid-props",
    );
    expectRefusal(single("content.stats", { items: [{ value: "", label: "Label" }] }), "document:invalid-props");
    expectRefusal(single("content.stats", { items: [{ value: "1", label: "   " }] }), "document:invalid-props");
    expectRefusal(single("content.stats", { items: [{ value: "1", label: "L", unit: "kg" }] }), "document:invalid-props");
    expectRefusal(single("content.stats", { level: 2, items: [{ value: "1", label: "L" }] }), "document:invalid-props");
    expectRefusal(
      single("content.stats", { heading: "Figures", items: [{ value: "1", label: "L" }] }),
      "document:invalid-props",
    );
    expectRefusal(
      single("content.stats", { heading: "Figures", level: 7, items: [{ value: "1", label: "L" }] }),
      "document:invalid-props",
    );
    // Unique stats negative: a level-4 heading directly under the Page h1 skips a level.
    expectRefusal(
      single("content.stats", { heading: "Figures", level: 4, items: [{ value: "1", label: "L" }] }),
      "document:heading-order",
    );
    expectRefusal(single("content.stats", { items: [{ value: "<b>1</b>", label: "L" }] }), "document:unsafe-text");
  });

  it("content.testimonials: accepts a bare quote and attributed variants", () => {
    expect(
      readUnoPageDocument(single("content.testimonials", { items: [{ quote: "A bounded quotation." }] })).accepted,
    ).toBe(true);
    const attributed = readUnoPageDocument(
      single("content.testimonials", {
        align: "center",
        surface: "bordered",
        items: [{ quote: "A bounded quotation.", attribution: "Contributor A", role: "Reviewer" }],
      }),
    );
    expect(attributed.accepted).toBe(true);
    if (!attributed.accepted) return;
    const node = attributed.document.sections[0];
    if (node?.module !== "content.testimonials") throw new Error("expected a testimonials node");
    expect(node.props.items[0]?.attribution).toBe("Contributor A");
    expect(node.props.items[0]?.role).toBe("Reviewer");
    expect(node.props.align).toBe("center");
  });

  it("content.testimonials: refuses empty, unbounded, fabricated and hostile items", () => {
    expectRefusal(single("content.testimonials", { items: [] }), "document:invalid-props");
    expectRefusal(
      single("content.testimonials", { items: Array.from({ length: 7 }, () => ({ quote: "Q" })) }),
      "document:invalid-props",
    );
    expectRefusal(single("content.testimonials", { items: [{ quote: "   " }] }), "document:invalid-props");
    expectRefusal(
      single("content.testimonials", { items: [{ quote: "Q", author: "Invented" }] }),
      "document:invalid-props",
    );
    expectRefusal(
      single("content.testimonials", { items: [{ quote: "Q", attribution: "" }] }),
      "document:invalid-props",
    );
    expectRefusal(single("content.testimonials", { items: [{ quote: "Q" }], reviews: 5 }), "document:invalid-props");
    expectRefusal(single("content.testimonials", { align: "end", items: [{ quote: "Q" }] }), "document:invalid-props");
    // Unique testimonials negative: authored markup inside a quotation.
    expectRefusal(
      single("content.testimonials", { items: [{ quote: "<script>alert(1)</script>" }] }),
      "document:unsafe-text",
    );
  });

  it("keeps an ordinary native role-only testimonial caption", () => {
    // `UNO-WO-117 / R01`: the *donor* suppresses a role-only caption; an ordinary native testimonial keeps rendering the
    // caption it always did, because the native contract is unchanged and this order only adopts the donor's rule.
    const roleOnly = readUnoPageDocument(
      single("content.testimonials", { items: [{ quote: "A role only line.", role: "Editor" }] }),
    );
    expect(roleOnly.accepted).toBe(true);
    if (!roleOnly.accepted) return;
    const node = roleOnly.document.sections[0];
    if (node?.module !== "content.testimonials") throw new Error("expected a testimonials node");
    expect(node.props.items[0]).toEqual({ quote: "A role only line.", role: "Editor" });
    expect(node.props.markdown).toBeUndefined();
  });

  it("refuses hostile structure inside the new item lists", () => {
    // A `__proto__` own key can only arrive as JSON text, so the reader is proved on its real threat surface.
    const hostile =
      '{"version":1,"title":"Hostile","sections":[{"id":"probe","module":"content.stats","props":{"items":[{"value":"1","label":"L","__proto__":{"polluted":true}}]}}]}';
    expectRefusal(hostile, "document:json-unsafe");

    const sparse: unknown[] = new Array(1);
    expectRefusal(single("content.testimonials", { items: sparse }), "document:invalid-props");

    const accessor: Record<string, unknown> = { quote: "Q" };
    Object.defineProperty(accessor, "role", { get: () => "R", enumerable: true });
    expectRefusal(single("content.testimonials", { items: [accessor] }), "document:input-not-plain");

    expectRefusal(single("content.hero", { lede: "Body.", actions: "none" }), "document:invalid-props");
  });
});




/**
 * The three modules this increment adds (`UNO-WO-038 / R01`): `layout.bento`, `content.pricing` and
 * `content.timeline`. Each has its accepted shapes and its own closed negative cases, so a regression in one module
 * can never be mistaken for a regression in another.
 */
describe("readUnoPageDocument — layout.bento, content.pricing and content.timeline", () => {
  /** One accepted document whose single section is the module under test. */
  function single(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { ...minimal(), sections: [section("probe", module, props)] };
  }

  /** One bento with three children, so a tile list can be proved positional against real sibling ids. */
  function bento(tiles: unknown, props: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      ...minimal(),
      sections: [
        {
          id: "mosaic",
          module: "layout.bento",
          props: { columns: 3, ...props, tiles },
          children: [
            { id: "tile-one", module: "content.prose", props: { text: "One." } },
            { id: "tile-two", module: "content.prose", props: { text: "Two." } },
            { id: "tile-three", module: "content.prose", props: { text: "Three." } },
          ],
        },
      ],
    };
  }

  /** The accepted tile list: one feature, one wide and one standard span in authored order. */
  const TILES = [
    { sectionId: "tile-one", span: "feature" },
    { sectionId: "tile-two", span: "wide" },
    { sectionId: "tile-three", span: "standard" },
  ];

  it("layout.bento: accepts an asymmetric composition with and without article semantics", () => {
    const plain = readUnoPageDocument(bento(TILES));
    expect(plain.accepted).toBe(true);
    if (!plain.accepted) return;
    const node = plain.document.sections[0];
    expect(node?.module).toBe("layout.bento");
    if (node?.module !== "layout.bento") return;
    expect(node.props.columns).toBe(3);
    expect(node.props.itemSemantics).toBeUndefined();
    expect(node.props.tiles.map((tile) => tile.span)).toEqual(["feature", "wide", "standard"]);
    expect(node.props.tiles.map((tile) => tile.sectionId)).toEqual(["tile-one", "tile-two", "tile-three"]);
    expect(node.children).toHaveLength(3);
    expect(Object.isFrozen(node.props.tiles)).toBe(true);
    expect(Object.isFrozen(node.props.tiles[0])).toBe(true);

    const articles = readUnoPageDocument(bento(TILES, { itemSemantics: "article", columns: 4 }));
    expect(articles.accepted).toBe(true);
    if (!articles.accepted) return;
    const articleNode = articles.document.sections[0];
    expect(articleNode?.module).toBe("layout.bento");
    if (articleNode?.module !== "layout.bento") return;
    expect(articleNode.props.itemSemantics).toBe("article");
    expect(articleNode.props.columns).toBe(4);
  });

  it("layout.bento: accepts every documented column count and span", () => {
    for (const columns of [2, 3, 4] as const) {
      for (const span of ["standard", "wide", "tall", "feature"] as const) {
        const document = bento(
          [
            { sectionId: "tile-one", span },
            { sectionId: "tile-two", span: "standard" },
            { sectionId: "tile-three", span: "standard" },
          ],
          { columns },
        );
        if (span === "standard") {
          // Four standard tiles would be an even grid, not a bento, so this one shape is refused by design.
          expectRefusal(document, "document:invalid-props");
          continue;
        }
        expect(readUnoPageDocument(document).accepted).toBe(true);
      }
    }
  });


  it("layout.bento: refuses every malformed tile list and every impossible composition", () => {
    // Missing, empty, non-array and sparse tile lists.
    expectRefusal(bento(undefined), "document:invalid-props");
    expectRefusal(bento([]), "document:invalid-props");
    expectRefusal(bento("tiles"), "document:invalid-props");
    // Length mismatch in both directions: one tile short, and one tile too many.
    expectRefusal(bento(TILES.slice(0, 2)), "document:invalid-props");
    expectRefusal(bento([...TILES, { sectionId: "tile-three", span: "wide" }]), "document:invalid-props");
    // A tile that names a sibling it does not correspond to, and a tile that names a non-sibling.
    expectRefusal(
      bento([
        { sectionId: "tile-two", span: "feature" },
        { sectionId: "tile-one", span: "wide" },
        { sectionId: "tile-three", span: "standard" },
      ]),
      "document:invalid-props",
    );
    expectRefusal(
      bento([{ sectionId: "ghost", span: "feature" }, TILES[1], TILES[2]]),
      "document:invalid-props",
    );
    // A duplicate tile id, an unrecognised span, an extra key and a non-plain tile.
    expectRefusal(
      bento([{ sectionId: "tile-one", span: "feature" }, { sectionId: "tile-one", span: "wide" }, TILES[2]]),
      "document:invalid-props",
    );
    expectRefusal(
      bento([{ sectionId: "tile-one", span: "huge" }, TILES[1], TILES[2]]),
      "document:invalid-props",
    );
    expectRefusal(
      bento([{ sectionId: "tile-one", span: "feature", css: "grid-column: 9" }, TILES[1], TILES[2]]),
      "document:invalid-props",
    );
    expectRefusal(bento([null, TILES[1], TILES[2]]), "document:invalid-props");
    // An even grid wearing a bento name, an undeclared column count and a level-1 column count.
    expectRefusal(
      bento([
        { sectionId: "tile-one", span: "standard" },
        { sectionId: "tile-two", span: "standard" },
        { sectionId: "tile-three", span: "standard" },
      ]),
      "document:invalid-props",
    );
    expectRefusal(bento(TILES, { columns: 5 }), "document:invalid-props");
    expectRefusal(bento(TILES, { columns: 1 }), "document:invalid-props");
    expectRefusal(bento(TILES, { itemSemantics: "figure" }), "document:invalid-props");
  });

  it("layout.bento: refuses one child, a ninth child and children on a content module", () => {
    const oneChild = {
      ...minimal(),
      sections: [
        {
          id: "mosaic",
          module: "layout.bento",
          props: { columns: 2, tiles: [{ sectionId: "only", span: "feature" }] },
          children: [{ id: "only", module: "content.prose", props: { text: "Alone." } }],
        },
      ],
    };
    expectRefusal(oneChild, "document:invalid-children");

    const nine = {
      ...minimal(),
      sections: [
        {
          id: "mosaic",
          module: "layout.bento",
          props: {
            columns: 3,
            tiles: Array.from({ length: 9 }, (_value, index) => ({
              sectionId: `tile-${index}`,
              span: index === 0 ? "feature" : "standard",
            })),
          },
          children: Array.from({ length: 9 }, (_value, index) => ({
            id: `tile-${index}`,
            module: "content.prose",
            props: { text: "Tile." },
          })),
        },
      ],
    };
    expectRefusal(nine, "document:invalid-children");

    // `content.pricing` is not a layout, so authored children are refused rather than silently dropped.
    expectRefusal(
      {
        ...minimal(),
        sections: [
          {
            id: "prices",
            module: "content.pricing",
            props: { items: [{ label: "One", amount: "1" }] },
            children: [{ id: "extra", module: "content.prose", props: { text: "Extra." } }],
          },
        ],
      },
      "document:invalid-section",
    );
  });


  it("content.pricing: accepts one to six authored prices, with and without a linked heading", () => {
    const bare = readUnoPageDocument(
      single("content.pricing", { items: [{ label: "Support", amount: "Free" }] }),
    );
    expect(bare.accepted).toBe(true);
    if (!bare.accepted) return;
    const bareNode = bare.document.sections[0];
    expect(bareNode?.module).toBe("content.pricing");
    if (bareNode?.module !== "content.pricing") return;
    expect(bareNode.props.items).toEqual([{ label: "Support", amount: "Free" }]);
    expect(bareNode.props.heading).toBeUndefined();
    expect(bareNode.props.level).toBeUndefined();

    const full = readUnoPageDocument(
      single("content.pricing", {
        heading: "Programme tiers",
        level: 2,
        surface: "bordered",
        items: [
          { label: "Community", amount: "Free", description: "Authored text only." },
          { label: "Team", amount: "CHF 40", unit: "per month", featured: true },
          { label: "Enterprise", amount: "On request", unit: "per engagement", description: "Direct agreement." },
        ],
      }),
    );
    expect(full.accepted).toBe(true);
    if (!full.accepted) return;
    const fullNode = full.document.sections[0];
    expect(fullNode?.module).toBe("content.pricing");
    if (fullNode?.module !== "content.pricing") return;
    expect(fullNode.props.heading).toBe("Programme tiers");
    expect(fullNode.props.level).toBe(2);
    expect(fullNode.props.surface).toBe("bordered");
    expect(fullNode.props.items).toHaveLength(3);
    expect(fullNode.props.items[1]).toEqual({ label: "Team", amount: "CHF 40", unit: "per month", featured: true });
    expect(fullNode.props.items[2]?.description).toBe("Direct agreement.");
    expect(Object.isFrozen(fullNode.props.items)).toBe(true);

    // Six is the documented cap and seven is refused, so the bound is exact rather than approximate.
    const six = { items: Array.from({ length: 6 }, (_value, index) => ({ label: `Tier ${index}`, amount: `${index}` })) };
    expect(readUnoPageDocument(single("content.pricing", six)).accepted).toBe(true);
    const seven = { items: Array.from({ length: 7 }, (_value, index) => ({ label: `Tier ${index}`, amount: `${index}` })) };
    expectRefusal(single("content.pricing", seven), "document:invalid-props");
  });

  it("content.pricing: refuses empty, oversized, double-featured and malformed prices", () => {
    expectRefusal(single("content.pricing", { items: [] }), "document:invalid-props");
    expectRefusal(single("content.pricing", { items: "none" }), "document:invalid-props");
    expectRefusal(single("content.pricing", { items: [{ label: "Only a label" }] }), "document:invalid-props");
    expectRefusal(single("content.pricing", { items: [{ amount: "1" }] }), "document:invalid-props");
    expectRefusal(single("content.pricing", { items: [{ label: "   ", amount: "1" }] }), "document:invalid-props");
    expectRefusal(single("content.pricing", { items: [{ label: "Empty amount", amount: "" }] }), "document:invalid-props");
    // A price that exceeds its own bound, and one that carries an undeclared key.
    expectRefusal(
      single("content.pricing", { items: [{ label: "Long", amount: "9".repeat(65) }] }),
      "document:invalid-props",
    );
    expectRefusal(
      single("content.pricing", { items: [{ label: "Taxed", amount: "1", currency: "CHF" }] }),
      "document:invalid-props",
    );
    // Two highlighted offers would state two priorities at once.
    expectRefusal(
      single("content.pricing", {
        items: [
          { label: "One", amount: "1", featured: true },
          { label: "Two", amount: "2", featured: true },
        ],
      }),
      "document:invalid-props",
    );
    // A non-boolean feature flag, and executable markup inside an authored price string.
    expectRefusal(
      single("content.pricing", { items: [{ label: "One", amount: "1", featured: "yes" }] }),
      "document:invalid-props",
    );
    expectRefusal(
      single("content.pricing", { items: [{ label: "One", amount: "<script>alert(1)</script>" }] }),
      "document:unsafe-text",
    );
    // Heading rules: level without a heading, heading without a level, and a skipped level.
    expectRefusal(single("content.pricing", { items: [{ label: "One", amount: "1" }], level: 2 }), "document:invalid-props");
    expectRefusal(single("content.pricing", { items: [{ label: "One", amount: "1" }], heading: "Tiers" }), "document:invalid-props");
    expectRefusal(
      single("content.pricing", { items: [{ label: "One", amount: "1" }], heading: "Tiers", level: 4 }),
      "document:heading-order",
    );
    expectRefusal(
      single("content.pricing", { items: [{ label: "One", amount: "1" }], heading: "Tiers", level: 2, align: "center" }),
      "document:invalid-props",
    );
  });


  it("content.timeline: accepts one to twelve authored milestones and declares at most one current", () => {
    const bare = readUnoPageDocument(single("content.timeline", { items: [{ title: "Kickoff" }] }));
    expect(bare.accepted).toBe(true);
    if (!bare.accepted) return;
    const bareNode = bare.document.sections[0];
    expect(bareNode?.module).toBe("content.timeline");
    if (bareNode?.module !== "content.timeline") return;
    expect(bareNode.props.items).toEqual([{ title: "Kickoff" }]);

    const full = readUnoPageDocument(
      single("content.timeline", {
        heading: "Programme timeline",
        level: 2,
        surface: "muted",
        items: [
          { title: "Contract baseline", dateLabel: "Phase 1", status: "complete", description: "Accepted." },
          { title: "Module slice", dateLabel: "Phase 2", status: "current" },
          { title: "Presentation shell", dateLabel: "Phase 3", status: "upcoming" },
        ],
      }),
    );
    expect(full.accepted).toBe(true);
    if (!full.accepted) return;
    const fullNode = full.document.sections[0];
    expect(fullNode?.module).toBe("content.timeline");
    if (fullNode?.module !== "content.timeline") return;
    // Authored order is preserved exactly: the contract never sorts a timeline.
    expect(fullNode.props.items.map((item) => item.title)).toEqual([
      "Contract baseline",
      "Module slice",
      "Presentation shell",
    ]);
    expect(fullNode.props.items[1]?.status).toBe("current");
    expect(fullNode.props.items[1]?.description).toBeUndefined();
    expect(fullNode.props.items[0]?.dateLabel).toBe("Phase 1");
    expect(Object.isFrozen(fullNode.props.items)).toBe(true);

    // Twelve is the documented cap and thirteen is refused, so the bound is exact.
    const twelve = {
      items: Array.from({ length: 12 }, (_value, index) => ({ title: `Milestone ${index}` })),
    };
    expect(readUnoPageDocument(single("content.timeline", twelve)).accepted).toBe(true);
    const thirteen = {
      items: Array.from({ length: 13 }, (_value, index) => ({ title: `Milestone ${index}` })),
    };
    expectRefusal(single("content.timeline", thirteen), "document:invalid-props");
  });

  it("content.timeline: refuses empty, malformed, double-current and oversized milestones", () => {
    expectRefusal(single("content.timeline", { items: [] }), "document:invalid-props");
    expectRefusal(single("content.timeline", { items: "later" }), "document:invalid-props");
    expectRefusal(single("content.timeline", { items: [{ title: "" }] }), "document:invalid-props");
    expectRefusal(single("content.timeline", { items: [{ title: "   " }] }), "document:invalid-props");
    expectRefusal(single("content.timeline", { items: [{ description: "No title." }] }), "document:invalid-props");
    // A status outside the closed three, and two simultaneous current milestones.
    expectRefusal(
      single("content.timeline", { items: [{ title: "One", status: "in-progress" }] }),
      "document:invalid-props",
    );
    expectRefusal(
      single("content.timeline", {
        items: [
          { title: "One", status: "current" },
          { title: "Two", status: "current" },
        ],
      }),
      "document:invalid-props",
    );
    // An undeclared key, an overlong title and an overlong date label.
    expectRefusal(
      single("content.timeline", { items: [{ title: "One", duration: "3 weeks" }] }),
      "document:invalid-props",
    );
    expectRefusal(
      single("content.timeline", { items: [{ title: "9".repeat(161) }] }),
      "document:invalid-props",
    );
    expectRefusal(
      single("content.timeline", { items: [{ title: "One", dateLabel: "9".repeat(121) }] }),
      "document:invalid-props",
    );
    // Executable markup in either authored text field.
    expectRefusal(
      single("content.timeline", { items: [{ title: "<img src=x onerror=alert(1)>" }] }),
      "document:unsafe-text",
    );
    expectRefusal(
      single("content.timeline", { items: [{ title: "One", description: "javascript: alert(1)" }] }),
      "document:unsafe-text",
    );
    // Heading rules and the closed surface vocabulary.
    expectRefusal(single("content.timeline", { items: [{ title: "One" }], level: 3 }), "document:invalid-props");
    expectRefusal(single("content.timeline", { items: [{ title: "One" }], heading: "Timeline" }), "document:invalid-props");
    expectRefusal(
      single("content.timeline", { items: [{ title: "One" }], heading: "Timeline", level: 5 }),
      "document:heading-order",
    );
    expectRefusal(
      single("content.timeline", { items: [{ title: "One" }], surface: "shadowed" }),
      "document:invalid-props",
    );
  });

  it("refuses hostile structure inside the three new prop lists", () => {
    const sparseTiles: unknown[] = new Array(3);
    expectRefusal(bento(sparseTiles), "document:invalid-props");

    const sparsePrices: unknown[] = new Array(2);
    expectRefusal(single("content.pricing", { items: sparsePrices }), "document:invalid-props");

    const accessorPrice: Record<string, unknown> = { label: "One", amount: "1" };
    Object.defineProperty(accessorPrice, "featured", { get: () => true, enumerable: true });
    expectRefusal(single("content.pricing", { items: [accessorPrice] }), "document:input-not-plain");

    // A `__proto__` own key can only arrive as JSON text, so the reader is proved on its real threat surface.
    const hostileTimeline =
      '{"version":1,"title":"Hostile","sections":[{"id":"road","module":"content.timeline","props":{"items":[{"title":"T","__proto__ {"polluted":true}}]}}]}';
    expectRefusal(hostileTimeline, "document:json-parse");
    const hostileTimelineKey =
      '{"version":1,"title":"Hostile","sections":[{"id":"road","module":"content.timeline","props":{"items":[{"title":"T","__proto__":{"polluted":true}}]}}]}';
    expectRefusal(hostileTimelineKey, "document:json-unsafe");
  });
});

/**
 * The inherited lint notice (`UNO-WO-038 / R01`, §6D). `codePointLength` used to walk the string with an unused
 * binding, which the lint job reported. It is now an explicit Unicode scalar walk, so these cases pin the exact
 * counting semantics that replacement must keep: code points, never UTF-16 code units, and never grapheme clusters.
 */
describe("readUnoPageDocument — codepoint counting after the lint repair", () => {
  /** One prose text of exactly `count` code points, built from the given unit repeated. */
  function repeated(unit: string, count: number): string {
    return unit.repeat(count);
  }

  /** One document whose single section is the module under test, so a bound is proved without any other noise. */
  function probe(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { ...minimal(), sections: [section("probe", module, props)] };
  }

  it("counts an astral character once, so a 160-code-point title bound is not doubled", () => {
    // U+1F600 is one code point and two code units. 160 of them are exactly the 160-code-point title bound but 320
    // UTF-16 code units, so a naive code-unit count would have refused a title that is inside the documented bound.
    const astral = repeated("\u{1F600}", 160);
    expect(astral.length).toBe(320);
    expect(readUnoPageDocument({ ...minimal(), title: astral }).accepted).toBe(true);

    // 161 astral characters exceed the 160-code-point title bound.
    const overTitle = repeated("\u{1F600}", 161);
    expectRefusal({ ...minimal(), title: overTitle }, "document:invalid-title");

    // Exactly 4000 code points of astral text is accepted as a section body, and 4001 is refused.
    const bodyCap = repeated("\u{1F600}", 4000);
    expect(
      readUnoPageDocument(probe("content.prose", { text: bodyCap })).accepted,
    ).toBe(true);
    expectRefusal(probe("content.prose", { text: repeated("\u{1F600}", 4001) }), "document:invalid-props");
  });

  it("counts a combining mark separately, because a code point is not a grapheme cluster", () => {
    // "e" + combining acute is two code points; 4000 of each pair is 8000 and must be refused.
    const pairs = repeated("e\u0301", 2000);
    expect(pairs.length).toBe(4000);
    expect(readUnoPageDocument(probe("content.prose", { text: pairs })).accepted).toBe(true);
    expectRefusal(probe("content.prose", { text: repeated("e\u0301", 2001) }), "document:invalid-props");
  });

  it("counts a lone surrogate once, never repairs it, and only refuses it where the field is Markdown-capable", () => {
    // `UNO-WO-116 / R01`: the plain-text counting contract is unchanged. A non-Markdown-capable field still counts a lone
    // surrogate as one code point, neither throwing nor merging it into a pair.
    // `UNO-WO-117 / R01`: the probe moved from the testimonial quotation — which is now Markdown-capable — to its plain
    // single-line `attribution` label, so the counting contract is proven on a field that is still genuinely plain-only.
    const plainLabel = (text: string) =>
      probe("content.testimonials", { items: [{ quote: "A bounded quotation.", attribution: text }] });
    expect(readUnoPageDocument(plainLabel("a\uD800b")).accepted).toBe(true);
    expect(readUnoPageDocument(plainLabel(repeated("\uD800", 160))).accepted).toBe(true);
    expectRefusal(plainLabel(repeated("\uD800", 161)), "document:invalid-props");

    // The same value in a Markdown-capable field refuses the whole document: the field can be published as Markdown or as
    // literal text, so it can never carry text that no renderer can represent faithfully.
    expectRefusal(probe("content.prose", { text: "a\uD800b" }), "document:invalid-props");
    expectRefusal(probe("content.prose", { text: repeated("\uD800", 4000) }), "document:invalid-props");
    // `UNO-WO-117 / R01`: the newly Markdown-capable quotation is refused in both forms, flagged and unflagged.
    expectRefusal(probe("content.testimonials", { items: [{ quote: "a\uD800b" }] }), "document:invalid-props");
    expectRefusal(
      probe("content.testimonials", { items: [{ quote: "a\uD800b" }], markdown: true }),
      "document:invalid-props",
    );
  });

  it("keeps the bounded-string caps exact for the three new modules", () => {
    // amount <= 64, unit <= 64, description <= 320, pricing heading <= 160.
    const amount64 = "9".repeat(64);
    expect(readUnoPageDocument(probe("content.pricing", { items: [{ label: "L", amount: amount64 }] })).accepted).toBe(
      true,
    );
    expectRefusal(
      probe("content.pricing", { items: [{ label: "L", amount: "9".repeat(65) }] }),
      "document:invalid-props",
    );
    expect(
      readUnoPageDocument(
        probe("content.pricing", { items: [{ label: "L", amount: "1", unit: "u".repeat(64) }] }),
      ).accepted,
    ).toBe(true);
    expectRefusal(
      probe("content.pricing", { items: [{ label: "L", amount: "1", unit: "u".repeat(65) }] }),
      "document:invalid-props",
    );
    expect(
      readUnoPageDocument(
        probe("content.pricing", { items: [{ label: "L", amount: "1", description: "d".repeat(320) }] }),
      ).accepted,
    ).toBe(true);
    expectRefusal(
      probe("content.pricing", { items: [{ label: "L", amount: "1", description: "d".repeat(321) }] }),
      "document:invalid-props",
    );
    expect(
      readUnoPageDocument(probe("content.pricing", { heading: "h".repeat(160), level: 2, items: [{ label: "L", amount: "1" }] }))
        .accepted,
    ).toBe(true);

    // timeline title <= 160, description <= 320, dateLabel <= 120.
    expect(
      readUnoPageDocument(probe("content.timeline", { items: [{ title: "t".repeat(160) }] })).accepted,
    ).toBe(true);
    expect(
      readUnoPageDocument(
        probe("content.timeline", { items: [{ title: "T", description: "d".repeat(320), dateLabel: "l".repeat(120) }] }),
      ).accepted,
    ).toBe(true);
    expectRefusal(
      probe("content.timeline", { items: [{ title: "T", dateLabel: "l".repeat(121) }] }),
      "document:invalid-props",
    );
  });
});


describe("readUnoPageDocument — the eleven remaining owned modules", () => {
  /** One document whose single top-level section is the module under test. */
  function probe(module: string, props: unknown, children?: readonly unknown[]): unknown {
    const node: Record<string, unknown> = { id: "subject", module, props };
    if (children !== undefined) node.children = children;
    return { version: 1, title: "Module probe", sections: [node] };
  }

  /** A minimal valid leaf child, used wherever a module needs typed children. */
  function leaf(id: string): unknown {
    return { id, module: "content.prose", props: { text: `Body ${id}` } };
  }

  /** One authored asset reference. */
  function asset(path: string, zone = "page", integrity?: string): Record<string, unknown> {
    return integrity === undefined ? { zone, path } : { zone, path, integrity };
  }

  describe("layout.layers", () => {
    it("accepts two to four layers and refuses anything outside that bound", () => {
      expect(
        readUnoPageDocument(
          probe("layout.layers", { mode: "overlap", align: "center" }, [leaf("l-one"), leaf("l-two")]),
        ).accepted,
      ).toBe(true);
      expect(
        readUnoPageDocument(
          probe("layout.layers", { mode: "stack" }, [leaf("l-one"), leaf("l-two"), leaf("l-three"), leaf("l-four")]),
        ).accepted,
      ).toBe(true);
      expectRefusal(probe("layout.layers", { mode: "stack" }, [leaf("l-one")]), "document:invalid-children");
      expectRefusal(
        probe("layout.layers", { mode: "stack" }, [
          leaf("l-one"),
          leaf("l-two"),
          leaf("l-three"),
          leaf("l-four"),
          leaf("l-five"),
        ]),
        "document:invalid-children",
      );
      expectRefusal(
        probe("layout.layers", { mode: "float" }, [leaf("l-one"), leaf("l-two")]),
        "document:invalid-props",
      );
    });
  });

  describe("media.image", () => {
    it("accepts an authored alt, and requires exactly an empty alt when decorative", () => {
      expect(readUnoPageDocument(probe("media.image", { asset: asset("hero.png"), alt: "A hero" })).accepted).toBe(true);
      expect(
        readUnoPageDocument(probe("media.image", { asset: asset("hero.png"), alt: "", decorative: true })).accepted,
      ).toBe(true);
      // A decorative image that still says something, and a meaningful image that says nothing, both refuse.
      expectRefusal(
        probe("media.image", { asset: asset("hero.png"), alt: "Say", decorative: true }),
        "document:invalid-props",
      );
      expectRefusal(probe("media.image", { asset: asset("hero.png"), alt: "" }), "document:invalid-props");
      expectRefusal(
        probe("media.image", { asset: asset("hero.png"), alt: "A", decorative: "yes" }),
        "document:invalid-props",
      );
    });

    it("refuses an unsupported type, an unrelated purpose and a hostile path", () => {
      expectRefusal(probe("media.image", { asset: asset("logo.svg"), alt: "A" }), "document:invalid-props");
      expectRefusal(probe("media.image", { asset: asset("clip.mp4"), alt: "A" }), "document:invalid-props");
      for (const hostile of [
        "../escape.png",
        "/absolute.png",
        "a/../../b.png",
        "C:/win.png",
        "a\\b.png",
        "a%2e%2e/b.png",
        "a/b.png?x=1",
        "a//b.png",
        "con.png",
        "hero.PNG",
      ]) {
        expectRefusal(probe("media.image", { asset: asset(hostile), alt: "A" }), "document:invalid-props");
      }
    });

    it("requires integrity only for the generated zone", () => {
      const digest = "a".repeat(64);
      expect(
        readUnoPageDocument(probe("media.image", { asset: asset("g.png", "generated", digest), alt: "A" })).accepted,
      ).toBe(true);
      expectRefusal(probe("media.image", { asset: asset("g.png", "generated"), alt: "A" }), "document:invalid-props");
      expectRefusal(
        probe("media.image", { asset: asset("g.png", "generated", "A".repeat(64)), alt: "A" }),
        "document:invalid-props",
      );
      expectRefusal(
        probe("media.image", { asset: asset("g.png", "page", digest), alt: "A" }),
        "document:invalid-props",
      );
      expectRefusal(probe("media.image", { asset: asset("g.png", "elsewhere"), alt: "A" }), "document:invalid-props");
    });
  });

  describe("media.video", () => {
    it("accepts a video with its required caption track and refuses the wrong kinds", () => {
      expect(
        readUnoPageDocument(
          probe("media.video", {
            asset: asset("clip.mp4"),
            captions: asset("clip.vtt"),
            title: "A clip",
            poster: asset("poster.webp"),
          }),
        ).accepted,
      ).toBe(true);
      // The caption track cannot be the video, and the video cannot be the caption track.
      expectRefusal(
        probe("media.video", { asset: asset("clip.mp4"), captions: asset("clip.mp4"), title: "A" }),
        "document:invalid-props",
      );
      expectRefusal(
        probe("media.video", { asset: asset("clip.vtt"), captions: asset("clip.vtt"), title: "A" }),
        "document:invalid-props",
      );
      expectRefusal(probe("media.video", { asset: asset("clip.mp4"), title: "A" }), "document:invalid-props");
    });
  });

  describe("media.gallery and media.carousel", () => {
    const items = (count: number) =>
      Array.from({ length: count }, (_unused, index) => ({ asset: asset(`g-${index}.png`), alt: `Image ${index}` }));

    it("bounds a gallery to two through twelve items at one of three column counts", () => {
      expect(readUnoPageDocument(probe("media.gallery", { columns: 3, items: items(2) })).accepted).toBe(true);
      expect(readUnoPageDocument(probe("media.gallery", { columns: 4, items: items(12) })).accepted).toBe(true);
      expectRefusal(probe("media.gallery", { columns: 3, items: items(1) }), "document:invalid-props");
      expectRefusal(probe("media.gallery", { columns: 3, items: items(13) }), "document:invalid-props");
      expectRefusal(probe("media.gallery", { columns: 5, items: items(2) }), "document:invalid-props");
    });

    it("bounds a carousel to two through eight items and requires a label", () => {
      expect(readUnoPageDocument(probe("media.carousel", { label: "Work", items: items(2) })).accepted).toBe(true);
      expect(readUnoPageDocument(probe("media.carousel", { label: "Work", items: items(8) })).accepted).toBe(true);
      expectRefusal(probe("media.carousel", { label: "Work", items: items(1) }), "document:invalid-props");
      expectRefusal(probe("media.carousel", { label: "Work", items: items(9) }), "document:invalid-props");
      expectRefusal(probe("media.carousel", { items: items(2) }), "document:invalid-props");
      // An item without its own alternative is refused rather than inheriting a neighbour's.
      expectRefusal(
        probe("media.carousel", { label: "Work", items: [{ asset: asset("a.png"), alt: "" }, ...items(1)] }),
        "document:invalid-props",
      );
    });
  });

  describe("design.watermark and design.motion", () => {
    it("accepts bounded watermark text with closed placement and strength", () => {
      expect(
        readUnoPageDocument(probe("design.watermark", { text: "Draft", align: "end", strength: "regular" })).accepted,
      ).toBe(true);
      expectRefusal(probe("design.watermark", { text: "t".repeat(161) }), "document:invalid-props");
      expectRefusal(probe("design.watermark", { text: "Draft", align: "middle" }), "document:invalid-props");
      expectRefusal(probe("design.watermark", { text: "Draft", strength: "loud" }), "document:invalid-props");
    });

    it("accepts one to four motion children and refuses an unknown effect", () => {
      expect(readUnoPageDocument(probe("design.motion", { effect: "fade" }, [leaf("m-one")])).accepted).toBe(true);
      expect(
        readUnoPageDocument(
          probe("design.motion", { effect: "rise", speed: "short" }, [
            leaf("m-one"),
            leaf("m-two"),
            leaf("m-three"),
            leaf("m-four"),
          ]),
        ).accepted,
      ).toBe(true);
      expectRefusal(probe("design.motion", { effect: "fade" }, []), "document:invalid-children");
      expectRefusal(
        probe("design.motion", { effect: "fade" }, [
          leaf("m-one"),
          leaf("m-two"),
          leaf("m-three"),
          leaf("m-four"),
          leaf("m-five"),
        ]),
        "document:invalid-children",
      );
      expectRefusal(probe("design.motion", { effect: "spin" }, [leaf("m-one")]), "document:invalid-props");
    });
  });

  describe("interaction.tabs and interaction.accordion", () => {
    const panels = [leaf("panel-a"), leaf("panel-b")];
    const tabEntries = [
      { sectionId: "panel-a", label: "A" },
      { sectionId: "panel-b", label: "B" },
    ];

    it("binds positional tab entries to their own children exactly", () => {
      expect(
        readUnoPageDocument(probe("interaction.tabs", { label: "Sections", tabs: tabEntries }, panels)).accepted,
      ).toBe(true);
      // A tab naming a different child, a short list and a mismatched count all refuse.
      expectRefusal(
        probe(
          "interaction.tabs",
          {
            label: "S",
            tabs: [
              { sectionId: "panel-b", label: "A" },
              { sectionId: "panel-b", label: "B" },
            ],
          },
          panels,
        ),
        "document:invalid-props",
      );
      expectRefusal(
        probe("interaction.tabs", { label: "S", tabs: [{ sectionId: "panel-a", label: "A" }] }, panels),
        "document:invalid-props",
      );
      // A single panel violates the two-panel minimum before the entry list is even read.
      expectRefusal(
        probe("interaction.tabs", { label: "S", tabs: tabEntries }, [leaf("panel-a")]),
        "document:invalid-children",
      );
      // Seven panels exceed the closed six-panel bound.
      const seven = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];
      expectRefusal(
        probe(
          "interaction.tabs",
          { label: "S", tabs: seven.map((id) => ({ sectionId: id, label: id })) },
          seven.map((id) => leaf(id)),
        ),
        "document:invalid-children",
      );
    });

    it("binds accordion entries to one through eight children", () => {
      expect(
        readUnoPageDocument(
          probe("interaction.accordion", { items: [{ sectionId: "d-one", label: "One" }] }, [leaf("d-one")]),
        ).accepted,
      ).toBe(true);
      expectRefusal(
        probe("interaction.accordion", { items: [{ sectionId: "d-two", label: "One" }] }, [leaf("d-one")]),
        "document:invalid-props",
      );
    });
  });
  // `UNO-WO-080 / R01`: the two optional donor-outline switches are closed numeric literals. Absence must keep the
  // previous serialization exactly, and every other authored value must refuse the whole document.
  describe("content.timeline and interaction.accordion — optional level-3 outline switches", () => {
    const timelineProbe = (props: Record<string, unknown>): unknown => probe("content.timeline", props);
    const accordionProbe = (props: Record<string, unknown>): unknown =>
      probe("interaction.accordion", props, [leaf("d-one")]);

    it("keeps an unauthored timeline and accordion byte-identical, with no injected default", () => {
      const timeline = readUnoPageDocument(timelineProbe({ items: [{ title: "One" }] }));
      expect(timeline.accepted).toBe(true);
      if (!timeline.accepted) return;
      const timelineNode = timeline.document.sections[0];
      expect(timelineNode?.module).toBe("content.timeline");
      if (timelineNode?.module !== "content.timeline") return;
      expect(JSON.stringify(timelineNode.props)).toBe('{"items":[{"title":"One"}]}');
      expect(Object.prototype.hasOwnProperty.call(timelineNode.props, "itemHeadingLevel")).toBe(false);

      const accordion = readUnoPageDocument(accordionProbe({ items: [{ sectionId: "d-one", label: "One" }] }));
      expect(accordion.accepted).toBe(true);
      if (!accordion.accepted) return;
      const accordionNode = accordion.document.sections[0];
      expect(accordionNode?.module).toBe("interaction.accordion");
      if (accordionNode?.module !== "interaction.accordion") return;
      expect(JSON.stringify(accordionNode.props)).toBe('{"items":[{"sectionId":"d-one","label":"One"}]}');
      expect(Object.prototype.hasOwnProperty.call(accordionNode.props, "summaryHeadingLevel")).toBe(false);
    });

    it("accepts the authored literal 3 once, freezes it and re-reads the same JSON text identically", () => {
      const timelineText = JSON.stringify(
        timelineProbe({
          items: [{ title: "One" }, { title: "Two", description: "Still authored." }],
          itemHeadingLevel: 3,
        }),
      );
      const timeline = readUnoPageDocument(timelineText);
      expect(timeline.accepted).toBe(true);
      if (!timeline.accepted) return;
      const timelineNode = timeline.document.sections[0];
      if (timelineNode?.module !== "content.timeline") return;
      expect(timelineNode.props.itemHeadingLevel).toBe(3);
      expect(Object.isFrozen(timelineNode.props)).toBe(true);
      // The switch changes presentation only: the milestone sequence and its text are untouched.
      expect(timelineNode.props.items.map((item) => item.title)).toEqual(["One", "Two"]);
      expect(JSON.stringify(readUnoPageDocument(timelineText))).toBe(JSON.stringify(timeline));

      const accordionText = JSON.stringify(
        accordionProbe({ items: [{ sectionId: "d-one", label: "One" }], summaryHeadingLevel: 3 }),
      );
      const accordion = readUnoPageDocument(accordionText);
      expect(accordion.accepted).toBe(true);
      if (!accordion.accepted) return;
      const accordionNode = accordion.document.sections[0];
      if (accordionNode?.module !== "interaction.accordion") return;
      expect(accordionNode.props.summaryHeadingLevel).toBe(3);
      expect(Object.isFrozen(accordionNode.props)).toBe(true);
      expect(accordionNode.props.items).toEqual([{ sectionId: "d-one", label: "One" }]);
      expect(JSON.stringify(readUnoPageDocument(accordionText))).toBe(JSON.stringify(accordion));
    });

    it("refuses every authored value except the literal 3, without a partial document", () => {
      const wrongValues: unknown[] = [
        null,
        0,
        1,
        2,
        4,
        -3,
        3.5,
        "3",
        false,
        true,
        [],
        {},
        Number.NaN,
        Number.POSITIVE_INFINITY,
      ];
      for (const wrong of wrongValues) {
        expectRefusal(
          timelineProbe({ items: [{ title: "One" }], itemHeadingLevel: wrong }),
          "document:invalid-props",
        );
        expectRefusal(
          accordionProbe({ items: [{ sectionId: "d-one", label: "One" }], summaryHeadingLevel: wrong }),
          "document:invalid-props",
        );
      }
      // An authored own `undefined` is a key, not an absence, so it refuses rather than silently disappearing.
      expectRefusal(timelineProbe({ items: [{ title: "One" }], itemHeadingLevel: undefined }), "document:invalid-props");
      expectRefusal(
        accordionProbe({ items: [{ sectionId: "d-one", label: "One" }], summaryHeadingLevel: undefined }),
        "document:invalid-props",
      );
      // Neither switch may appear on the other module, and no second outline key is accepted on either.
      expectRefusal(
        accordionProbe({ items: [{ sectionId: "d-one", label: "One" }], itemHeadingLevel: 3 }),
        "document:invalid-props",
      );
      expectRefusal(timelineProbe({ items: [{ title: "One" }], summaryHeadingLevel: 3 }), "document:invalid-props");
      // The switch never stands in for a section heading: an authored level alone still follows the heading contract,
      // and a real authored heading keeps its own level alongside the item switch.
      expectRefusal(
        timelineProbe({ items: [{ title: "One" }], itemHeadingLevel: 3, level: 3 }),
        "document:invalid-props",
      );
      const withHeading = readUnoPageDocument(
        timelineProbe({ items: [{ title: "One" }], heading: "Sequence", level: 2, itemHeadingLevel: 3 }),
      );
      expect(withHeading.accepted).toBe(true);
      if (withHeading.accepted) {
        const headingNode = withHeading.document.sections[0];
        if (headingNode?.module === "content.timeline") {
          expect(headingNode.props.heading).toBe("Sequence");
          expect(headingNode.props.level).toBe(2);
          expect(headingNode.props.itemHeadingLevel).toBe(3);
        }
      }
      // An accessor is refused as a hostile structure without ever invoking the getter.
      let invoked = false;
      const accessorProps: Record<string, unknown> = { items: [{ title: "One" }] };
      Object.defineProperty(accessorProps, "itemHeadingLevel", {
        enumerable: true,
        get() {
          invoked = true;
          return 3;
        },
      });
      expectRefusal(
        { ...minimal(), sections: [section("subject", "content.timeline", accessorProps)] },
        "document:input-not-plain",
      );
      expect(invoked).toBe(false);
    });

    it("refuses a duplicated outline member in JSON text exactly like any other duplicate key", () => {
      const duplicated =
        '{"version":1,"title":"T","sections":[{"id":"subject","module":"content.timeline","props":' +
        '{"items":[{"title":"One"}],"itemHeadingLevel":3,"itemHeadingLevel":3}}]}';
      expectRefusal(duplicated, "document:json-duplicate-key");
    });
  });

  /**
   * `UNO-WO-118 / R01`: the FAQ family's two native additions — the donor's closed `surface` on the disclosure group, and a
   * Markdown-capable answer — with the ordinary 1–8 panel bound untouched.
   */
  describe("interaction.accordion — the FAQ surface and the unchanged panel bound", () => {
    const panels = (count: number) => ({
      items: Array.from({ length: count }, (_, index) => ({ sectionId: `d-${index}`, label: `L${index}` })),
      children: Array.from({ length: count }, (_, index) => leaf(`d-${index}`)),
    });
    const accordion = (props: Record<string, unknown>, children?: readonly unknown[]): unknown =>
      probe("interaction.accordion", props, children);
    const sized = (count: number, extra: Record<string, unknown> = {}): unknown => {
      const shape = panels(count);
      return accordion({ items: shape.items, ...extra }, shape.children);
    };

    it("accepts the closed surface, keeps its absence exact and refuses any other value", () => {
      const one = { items: [{ sectionId: "d-one", label: "One" }] };
      const surfaced = readUnoPageDocument(accordion({ ...one, surface: "muted" }, [leaf("d-one")]));
      expect(surfaced.accepted).toBe(true);
      if (!surfaced.accepted) return;
      const node = surfaced.document.sections[0];
      if (node?.module !== "interaction.accordion") throw new Error("expected an accordion");
      expect(node.props.surface).toBe("muted");
      expect(Object.isFrozen(node.props)).toBe(true);
      // The same JSON text re-reads identically.
      expect(JSON.stringify(readUnoPageDocument(JSON.stringify(surfaced.document)))).toBe(JSON.stringify(surfaced));
      // Absent stays absent, so an accordion authored before the switch keeps its exact props.
      const plain = readUnoPageDocument(accordion(one, [leaf("d-one")]));
      expect(plain.accepted).toBe(true);
      if (plain.accepted) {
        const plainNode = plain.document.sections[0];
        if (plainNode?.module === "interaction.accordion") {
          expect(Object.prototype.hasOwnProperty.call(plainNode.props, "surface")).toBe(false);
        }
      }
      for (const wrong of ["shadow", "raised", "", 1, null, true, ["muted"], { surface: "muted" }]) {
        expectRefusal(accordion({ ...one, surface: wrong }, [leaf("d-one")]), "document:invalid-props");
      }
    });

    it("keeps the ordinary one-to-eight panel bound exactly where it was", () => {
      expect(readUnoPageDocument(sized(1)).accepted).toBe(true);
      expect(readUnoPageDocument(sized(8)).accepted).toBe(true);
      expect(readUnoPageDocument(sized(8, { surface: "bordered" })).accepted).toBe(true);
      expectRefusal(sized(9), "document:invalid-children");
      expectRefusal(accordion({ items: [], surface: "muted" }, []), "document:invalid-children");
    });
  });



  describe("interaction.modal and interaction.contact", () => {
    const labels = { triggerLabel: "Open", title: "Details", closeLabel: "Close" };

    it("accepts exactly one modal content node", () => {
      expect(readUnoPageDocument(probe("interaction.modal", labels, [leaf("modal-body")])).accepted).toBe(true);
      expectRefusal(
        probe("interaction.modal", labels, [leaf("modal-a"), leaf("modal-b")]),
        "document:invalid-children",
      );
      expectRefusal(probe("interaction.modal", labels, []), "document:invalid-children");
    });

    it("accepts the delivery-OFF contact surface with and without fields", () => {
      expect(readUnoPageDocument(probe("interaction.contact", {})).accepted).toBe(true);
      expect(
        readUnoPageDocument(
          probe("interaction.contact", {
            heading: "Contact",
            fields: ["name", "email", "message"],
            submitLabel: "Send",
          }),
        ).accepted,
      ).toBe(true);
      expectRefusal(probe("interaction.contact", { fields: ["name", "name"] }), "document:invalid-props");
      expectRefusal(probe("interaction.contact", { fields: ["phone"] }), "document:invalid-props");
      expectRefusal(probe("interaction.contact", { fields: [] }), "document:invalid-props");
    });
  });



});


/**
 * `media.video` is one strict discriminated union: an owned native player, or a consent-gated external embed whose
 * destination is constructed only by the pure four-provider policy. These cases prove both alternatives and, just as
 * importantly, that a mixed or hostile form refuses the **whole Page** rather than degrading to a partial render.
 */
describe("media.video — native/external discriminated union", () => {
  const page = (props: Record<string, unknown>) => ({
    ...minimal(),
    sections: [section("clip", "media.video", props)],
  });

  it("accepts the four governed providers with their own identifier grammars", () => {
    const accepted: readonly Record<string, unknown>[] = [
      { source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "A YouTube clip" },
      { source: "external", provider: "vimeo", videoId: "76979871", title: "A Vimeo clip" },
      { source: "external", provider: "rumble", videoId: "v17j3tt", title: "A Rumble clip" },
      { source: "external", provider: "bitchute", videoId: "aB_9-hXyZ", title: "A BitChute clip" },
    ];
    for (const props of accepted) {
      expect(readUnoPageDocument(page(props)).accepted).toBe(true);
    }
  });

  it("keeps mixed-case provider video IDs valid where the provider allows them", () => {
    expect(
      readUnoPageDocument(page({ source: "external", provider: "youtube", videoId: "AbCdEfGh-_1", title: "Mixed" }))
        .accepted,
    ).toBe(true);
    expect(
      readUnoPageDocument(page({ source: "external", provider: "bitchute", videoId: "AbCd_-1", title: "Mixed" }))
        .accepted,
    ).toBe(true);
  });

  it("accepts a Vimeo unlisted privacy hash and keeps it only for Vimeo", () => {
    const withHash = page({
      source: "external",
      provider: "vimeo",
      videoId: "76979871",
      privacyHash: "abcdef12",
      title: "Unlisted",
    });
    const accepted = readUnoPageDocument(withHash);
    expect(accepted.accepted).toBe(true);
    if (accepted.accepted) {
      const node = accepted.document.sections[0];
      expect(node?.module).toBe("media.video");
      expect(node?.props).toMatchObject({ source: "external", privacyHash: "abcdef12" });
    }
    // A hash is Vimeo-only: on every other provider it refuses the entire Page.
    for (const provider of ["youtube", "rumble", "bitchute"]) {
      expectRefusal(
        page({
          source: "external",
          provider,
          videoId: provider === "youtube" ? "dQw4w9WgXcQ" : provider === "rumble" ? "v17j3tt" : "abcde",
          privacyHash: "abcdef12",
          title: "Hash elsewhere",
        }),
        "document:invalid-props",
      );
    }
  });

  it("refuses a mixed native/external form in both directions", () => {
    const owned = { zone: "page", path: "wo042-clip.mp4" };
    // External mode carrying native asset fields is not repaired into native mode.
    expectRefusal(
      page({ source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "Mixed", asset: owned }),
      "document:invalid-props",
    );
    expectRefusal(
      page({
        source: "external",
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
        title: "Mixed",
        captions: owned,
      }),
      "document:invalid-props",
    );
    // Native mode carrying an external field is likewise refused.
    expectRefusal(
      page({ asset: owned, captions: owned, title: "Native", provider: "youtube" }),
      "document:invalid-props",
    );
    // And an unknown value for the discriminator is not a third mode.
    expectRefusal(
      page({ source: "embedded", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "Third mode" }),
      "document:invalid-props",
    );
  });

  it("refuses host, URL, markup, scheme and key injection in external mode", () => {
    const hostile: readonly Record<string, unknown>[] = [
      { source: "external", provider: "youtube", videoId: "javascript:alert(1)", title: "Scheme" },
      { source: "external", provider: "youtube", videoId: "data:text/html,x", title: "Data" },
      { source: "external", provider: "youtube", videoId: "//evil.example/x", title: "Protocol relative" },
      { source: "external", provider: "youtube", videoId: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "URL" },
      { source: "external", provider: "youtube", videoId: "<script>x</script>", title: "Markup" },
      { source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "Extra", src: "https://evil.example" },
      { source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "Extra", allow: "autoplay" },
      { source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "Extra", sandbox: "allow-forms" },
      { source: "external", provider: "YouTube", videoId: "dQw4w9WgXcQ", title: "Case" },
      { source: "external", provider: "youtube2", videoId: "dQw4w9WgXcQ", title: "Typo" },
      { source: "external", provider: "dailymotion", videoId: "x8x8x8", title: "Unsupported" },
      { source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "" },
      { source: "external", provider: "youtube", title: "No id" },
      { source: "external", provider: "vimeo", videoId: "76979871", privacyHash: "ABCDEF12", title: "Hash case" },
    ];
    for (const props of hostile) expectRefusal(page(props), "document:invalid-props");
  });

  it("still refuses an unavailable module and a duplicate id", () => {
    expectRefusal({ ...minimal(), sections: [section("x", "layout.marquee", {})] }, "document:unknown-module");
    const twice = [
      section("clip", "media.video", { source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "A" }),
      section("clip", "media.video", { source: "external", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "B" }),
    ];
    expectRefusal({ ...minimal(), sections: twice }, "document:duplicate-section-id");
  });
});


describe("content.prose variants and layout.grid list/ratio — accepted shapes", () => {
  const prosePage = (props: unknown): Record<string, unknown> => ({
    ...minimal(),
    sections: [{ id: "variant-prose", module: "content.prose", props }],
  });
  const acceptedProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const result = readUnoPageDocument(prosePage(props));
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error(result.reason);
    const section = result.document.sections[0];
    if (section === undefined || section.module !== "content.prose") throw new Error("unexpected section");
    return section.props as unknown as Record<string, unknown>;
  };

  it("keeps the legacy prose props byte-compatible and deep-frozen", () => {
    const props = acceptedProps({ text: "A & B" });
    expect(Object.keys(props)).toEqual(["text"]);
    expect(props).toEqual({ text: "A & B" });
    expect(Object.isFrozen(props)).toBe(true);
  });

  it("accepts a callout with and without an authored tone", () => {
    expect(acceptedProps({ variant: "callout", text: "Note body" })).toEqual({ variant: "callout", text: "Note body" });
    expect(acceptedProps({ variant: "callout", text: "Careful", tone: "warning" })).toEqual({
      variant: "callout",
      text: "Careful",
      tone: "warning",
    });
  });

  it("accepts the rich prose and callout body: heading, Markdown lede, align and surface", () => {
    expect(
      acceptedProps({
        text: "A **strong** body.",
        heading: "Authored heading",
        lede: "A *marked* lede.",
        markdown: true,
        align: "center",
        surface: "muted",
      }),
    ).toEqual({
      text: "A **strong** body.",
      heading: "Authored heading",
      lede: "A *marked* lede.",
      markdown: true,
      align: "center",
      surface: "muted",
    });
    expect(
      acceptedProps({
        variant: "callout",
        text: "Body.",
        tone: "info",
        heading: "Inside",
        lede: "Inside lede.",
        markdown: true,
        align: "start",
        surface: "bordered",
      }),
    ).toEqual({
      variant: "callout",
      text: "Body.",
      tone: "info",
      heading: "Inside",
      lede: "Inside lede.",
      markdown: true,
      align: "start",
      surface: "bordered",
    });
  });

  it("refuses an unparseable Markdown field, a declared false and any unlisted presentation value", () => {
    const reason = (props: Record<string, unknown>): string => {
      const result = readUnoPageDocument(prosePage(props));
      expect(result.accepted).toBe(false);
      if (result.accepted) throw new Error("expected a refusal");
      return result.reason;
    };
    expect(reason({ text: "Text <b>markup</b>", markdown: true })).toBe("document:unsafe-text");
    expect(reason({ text: "An ![image](https://example.invalid/i.png)", markdown: true })).toBe(
      "document:invalid-props",
    );
    expect(reason({ text: "Text", markdown: false })).toBe("document:invalid-props");
    expect(reason({ text: "Text", markdown: "true" })).toBe("document:invalid-props");
    expect(reason({ text: "Text", align: "right" })).toBe("document:invalid-props");
    expect(reason({ text: "Text", surface: "shadow" })).toBe("document:invalid-props");
    expect(reason({ text: "Text", heading: "" })).toBe("document:invalid-props");
    expect(reason({ text: "Text", href: "/elsewhere" })).toBe("document:invalid-props");
    expect(reason({ variant: "callout", text: "Text", style: "color:red" })).toBe("document:invalid-props");
  });

  it("keeps the plain path byte-identical when no rich field is authored", () => {
    expect(Object.keys(acceptedProps({ text: "Plain" }))).toEqual(["text"]);
    expect(Object.keys(acceptedProps({ variant: "callout", text: "Plain" }))).toEqual(["variant", "text"]);
  });

  it("accepts ordered and unordered list variants with optional details", () => {
    expect(
      acceptedProps({ variant: "list", items: [{ label: "One" }, { label: "Two", detail: "Second detail" }] }),
    ).toEqual({ variant: "list", items: [{ label: "One" }, { label: "Two", detail: "Second detail" }] });
    expect(acceptedProps({ variant: "list", ordered: true, items: [{ label: "Only" }] })).toEqual({
      variant: "list",
      ordered: true,
      items: [{ label: "Only" }],
    });
  });

  it("accepts a rectangular table with and without a caption", () => {
    const table = { variant: "table", columns: ["A", "B"], rows: [["1", "2"], ["3", "4"]] };
    expect(acceptedProps(table)).toEqual(table);
    expect(acceptedProps({ ...table, caption: "Bounded caption" })).toEqual({ ...table, caption: "Bounded caption" });
  });

  it("accepts a content-free divider and round-trips every variant through JSON", () => {
    expect(acceptedProps({ variant: "divider" })).toEqual({ variant: "divider" });
    const variants: readonly Record<string, unknown>[] = [
      { text: "Legacy" },
      { variant: "callout", text: "Body", tone: "info" },
      { variant: "list", items: [{ label: "One" }] },
      { variant: "table", columns: ["A"], rows: [["1"]] },
      { variant: "divider" },
    ];
    for (const variant of variants) {
      const first = readUnoPageDocument(prosePage(variant));
      expect(first.accepted).toBe(true);
      if (!first.accepted) continue;
      const serialized = JSON.stringify(first.document);
      const second = readUnoPageDocument(serialized, { reservedHome: false });
      expect(second.accepted).toBe(true);
      if (!second.accepted) continue;
      expect(JSON.stringify(second.document)).toBe(serialized);
      expect(Object.isFrozen(second.document)).toBe(true);
    }
  });

  it("accepts grid list semantics and a ratio only on two columns", () => {
    const gridPage = (props: Record<string, unknown>): Record<string, unknown> => ({
      ...minimal(),
      sections: [
        {
          id: "grid",
          module: "layout.grid",
          props,
          children: [{ id: "grid-cell", module: "content.prose", props: { text: "Cell" } }],
        },
      ],
    });
    for (const props of [
      { columns: 2, itemSemantics: "list" },
      { columns: 2, ratio: "equal" },
      { columns: 2, ratio: "start-wide" },
      { columns: 2, ratio: "end-wide" },
      { columns: 2, itemSemantics: "list", ratio: "end-wide" },
    ]) {
      expect(readUnoPageDocument(gridPage(props)).accepted).toBe(true);
    }
    const listed = readUnoPageDocument(gridPage({ columns: 2, itemSemantics: "list", ratio: "end-wide" }));
    expect(listed.accepted).toBe(true);
    if (listed.accepted) {
      expect(listed.document.sections[0]).toMatchObject({
        module: "layout.grid",
        props: { columns: 2, itemSemantics: "list", ratio: "end-wide" },
      });
    }
  });
});

describe("content.prose variants and layout.grid list/ratio — closed refusals", () => {
  const prosePage = (props: unknown): Record<string, unknown> => ({
    ...minimal(),
    sections: [{ id: "variant-prose", module: "content.prose", props }],
  });
  const gridPage = (props: Record<string, unknown>): Record<string, unknown> => ({
    ...minimal(),
    sections: [
      {
        id: "grid",
        module: "layout.grid",
        props,
        children: [{ id: "grid-cell", module: "content.prose", props: { text: "Cell" } }],
      },
    ],
  });
  const refusals: readonly { readonly name: string; readonly props: unknown; readonly reason: string }[] = [
    { name: "an unknown prose variant", props: { variant: "embed" }, reason: "document:invalid-props" },
    { name: "a declared but undefined variant", props: { variant: undefined, text: "A" }, reason: "document:invalid-props" },
    { name: "a stray prop on legacy prose", props: { text: "A", href: "/elsewhere" }, reason: "document:invalid-props" },
    {
      name: "a crossed table and text shape",
      props: { variant: "table", text: "A", columns: ["A"], rows: [["1"]] },
      reason: "document:invalid-props",
    },
    { name: "a crossed divider and text shape", props: { variant: "divider", text: "A" }, reason: "document:invalid-props" },
    { name: "an unknown callout tone", props: { variant: "callout", text: "A", tone: "danger" }, reason: "document:invalid-props" },
    { name: "an empty callout body", props: { variant: "callout", text: "   " }, reason: "document:invalid-props" },
    { name: "a callout html prop", props: { variant: "callout", text: "A", html: "x" }, reason: "document:invalid-props" },
    { name: "a callout style prop", props: { variant: "callout", text: "A", style: "x" }, reason: "document:invalid-props" },
    { name: "a callout onClick prop", props: { variant: "callout", text: "A", onClick: "x" }, reason: "document:invalid-props" },
    { name: "an empty list", props: { variant: "list", items: [] }, reason: "document:invalid-props" },
    {
      name: "thirteen list entries",
      props: { variant: "list", items: Array.from({ length: 13 }, (_, index) => ({ label: `Item ${index}` })) },
      reason: "document:invalid-props",
    },
    { name: "an empty list label", props: { variant: "list", items: [{ label: "  " }] }, reason: "document:invalid-props" },
    { name: "a non-string list label", props: { variant: "list", items: [{ label: 5 }] }, reason: "document:invalid-props" },
    { name: "a list item href of the wrong type", props: { variant: "list", items: [{ label: "A", href: 5 }] }, reason: "document:invalid-props" },
    // `UNO-WO-103 / R01`: an authored `href` now composes, but only through the unchanged classifier; two destination
    // forms on one item, an unsafe scheme and an undeclared `linkId` all still refuse the whole Page.
    { name: "two list item destinations", props: { variant: "list", items: [{ label: "A", href: "/x", linkId: "contact" }] }, reason: "document:invalid-props" },
    { name: "a script list item href", props: { variant: "list", items: [{ label: "A", href: "javascript:alert(1)" }] }, reason: "document:unsafe-link" },
    { name: "an undeclared list item linkId", props: { variant: "list", items: [{ label: "A", linkId: "contact" }] }, reason: "document:unresolved-target" },
    {
      name: "a string ordered flag",
      props: { variant: "list", ordered: "true", items: [{ label: "A" }] },
      reason: "document:invalid-props",
    },
    { name: "non-array list items", props: { variant: "list", items: "A" }, reason: "document:invalid-props" },
    { name: "empty table columns", props: { variant: "table", columns: [], rows: [["1"]] }, reason: "document:invalid-props" },
    {
      name: "seven table columns",
      props: {
        variant: "table",
        columns: ["a", "b", "c", "d", "e", "f", "g"],
        rows: [["1", "2", "3", "4", "5", "6", "7"]],
      },
      reason: "document:invalid-props",
    },
    { name: "empty table rows", props: { variant: "table", columns: ["A"], rows: [] }, reason: "document:invalid-props" },
    {
      name: "twenty-one table rows",
      props: { variant: "table", columns: ["A"], rows: Array.from({ length: 21 }, () => ["1"]) },
      reason: "document:invalid-props",
    },
    {
      name: "a non-array table row",
      props: { variant: "table", columns: ["A"], rows: ["1"] },
      reason: "document:invalid-props",
    },
    {
      name: "a ragged table row",
      props: { variant: "table", columns: ["A", "B"], rows: [["1"]] },
      reason: "document:invalid-props",
    },
    { name: "a blank table cell", props: { variant: "table", columns: ["A"], rows: [[" "]] }, reason: "document:invalid-props" },
    {
      name: "an overlong table cell",
      props: { variant: "table", columns: ["A"], rows: [["x".repeat(321)]] },
      reason: "document:invalid-props",
    },
    {
      name: "an overlong table caption",
      props: { variant: "table", columns: ["A"], rows: [["1"]], caption: "x".repeat(321) },
      reason: "document:invalid-props",
    },
    {
      name: "a nested object table cell",
      props: { variant: "table", columns: ["A"], rows: [[{ nested: true }]] },
      reason: "document:invalid-props",
    },
    {
      name: "a table extra prop",
      props: { variant: "table", columns: ["A"], rows: [["1"]], sort: "asc" },
      reason: "document:invalid-props",
    },
    {
      name: "script text in a callout",
      props: { variant: "callout", text: "<script>alert(1)</script>" },
      reason: "document:unsafe-text",
    },
    {
      name: "a javascript destination in a list label",
      props: { variant: "list", items: [{ label: "javascript:alert(1)" }] },
      reason: "document:unsafe-text",
    },
  ];
  for (const { name, props, reason } of refusals) {
    it(`refuses ${name}`, () => {
      expectRefusal(prosePage(props), reason);
    });
  }

  it("refuses a sparse list entry and never runs an accessor array index", () => {
    const sparse: unknown[] = [{ label: "Present" }];
    sparse.length = 2;
    expectRefusal(prosePage({ variant: "list", items: sparse }), "document:invalid-props");

    let ran = false;
    const accessed: unknown[] = [];
    Object.defineProperty(accessed, "0", {
      enumerable: true,
      get: () => {
        ran = true;
        return { label: "Getter" };
      },
    });
    accessed.length = 1;
    expectRefusal(prosePage({ variant: "list", items: accessed }), "document:invalid-props");
    expect(ran).toBe(false);
  });

  it("refuses a hostile accessor inside a list entry", () => {
    const hostile = {
      get label(): string {
        throw new Error("getter ran");
      },
    };
    expectRefusal(prosePage({ variant: "list", items: [hostile] }), "document:input-not-plain");
  });

  it("refuses ratio on one, three and four columns, unknown ratios and unknown semantics", () => {
    for (const columns of [1, 3, 4]) expectRefusal(gridPage({ columns, ratio: "equal" }), "document:invalid-props");
    expectRefusal(gridPage({ columns: 2, ratio: "wide" }), "document:invalid-props");
    expectRefusal(gridPage({ columns: 2, itemSemantics: "grid" }), "document:invalid-props");
    expectRefusal(gridPage({ columns: 2, ratio: "equal", align: "start" }), "document:invalid-props");
  });

  it("keeps list semantics out of layout.bento", () => {
    expectRefusal(
      {
        ...minimal(),
        sections: [
          {
            id: "bento",
            module: "layout.bento",
            props: {
              columns: 2,
              itemSemantics: "list",
              tiles: [
                { sectionId: "tile-a", span: "wide" },
                { sectionId: "tile-b", span: "standard" },
              ],
            },
            children: [
              { id: "tile-a", module: "content.prose", props: { text: "A" } },
              { id: "tile-b", module: "content.prose", props: { text: "B" } },
            ],
          },
        ],
      },
      "document:invalid-props",
    );
  });
});


/**
 * `UNO-WO-116 / R01`: the shared Unicode well-formedness decision at the strict reader.
 *
 * One rule, exercised across every Markdown-capable authored field and through **both** entry points — plain own data and
 * raw JSON text — plus the positive side: valid astral pairs, combining sequences and mixed scripts must stay accepted, and
 * valid supplementary characters must still count as one code point against their declared bound.
 */
describe("readUnoPageDocument — Markdown-capable Unicode well-formedness", () => {
  /** One document whose single section is the module under test. */
  function probe(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { ...minimal(), sections: [section("probe", module, props)] };
  }

  /** The four malformed shapes, each named, so a refusal is never mistaken for another. */
  const MALFORMED: readonly (readonly [string, string])[] = [
    ["lone high surrogate", "Lead \uD800 tail"],
    ["lone low surrogate", "Lead \uDC00 tail"],
    ["reversed pair", "Lead \uDC00\uD800 tail"],
    ["interrupted pair", "Lead \uD800A\uDC00 tail"],
  ];

  /** Every Markdown-capable authored field of the reader, as a fresh document per value. */
  const FIELDS: readonly (readonly [string, (value: string) => Record<string, unknown>])[] = [
    ["prose text", (value) => probe("content.prose", { text: value })],
    ["prose text with markdown", (value) => probe("content.prose", { text: value, markdown: true })],
    ["prose lede with markdown", (value) => probe("content.prose", { text: "Body.", lede: value, markdown: true })],
    ["prose lede without markdown", (value) => probe("content.prose", { text: "Body.", lede: value })],
    ["callout text", (value) => probe("content.prose", { variant: "callout", text: value })],
    [
      "callout lede with markdown",
      (value) => probe("content.prose", { variant: "callout", text: "Body.", lede: value, markdown: true }),
    ],
    [
      "callout lede without markdown",
      (value) => probe("content.prose", { variant: "callout", text: "Body.", lede: value }),
    ],
    [
      "list item detail",
      (value) => probe("content.prose", { variant: "list", items: [{ label: "L", detail: value }] }),
    ],
    [
      "list item detail with markdown",
      (value) => probe("content.prose", { variant: "list", items: [{ label: "L", detail: value }], markdown: true }),
    ],
    [
      "list lede without markdown",
      (value) => probe("content.prose", { variant: "list", items: [{ label: "One" }], lede: value }),
    ],
    [
      "list lede with markdown",
      (value) => probe("content.prose", { variant: "list", items: [{ label: "One" }], lede: value, markdown: true }),
    ],
    [
      "table caption",
      (value) => probe("content.prose", { variant: "table", columns: ["A"], rows: [["b"]], caption: value }),
    ],
    [
      "table lede without markdown",
      (value) => probe("content.prose", { variant: "table", columns: ["A"], rows: [["b"]], lede: value }),
    ],
    [
      "table lede with markdown",
      (value) => probe("content.prose", { variant: "table", columns: ["A"], rows: [["b"]], lede: value, markdown: true }),
    ],
    ["hero lede", (value) => probe("content.hero", { lede: value })],
    ["hero support", (value) => probe("content.hero", { support: value })],
    ["hero lede with markdown", (value) => probe("content.hero", { lede: value, markdown: true })],
    ["stats detail", (value) => probe("content.stats", { items: [{ value: "1", label: "L", detail: value }] })],
    [
      "stats detail with markdown",
      (value) => probe("content.stats", { items: [{ value: "1", label: "L", detail: value }], markdown: true }),
    ],
    ["timeline description", (value) => probe("content.timeline", { items: [{ title: "T", description: value }] })],
    [
      "timeline description with markdown",
      (value) => probe("content.timeline", { items: [{ title: "T", description: value }], markdown: true }),
    ],
  ];


  it("refuses every malformed shape in every Markdown-capable field, from plain data", () => {
    for (const [fieldLabel, build] of FIELDS) {
      for (const [shapeLabel, value] of MALFORMED) {
        const result = readUnoPageDocument(build(value));
        const where = `${fieldLabel} / ${shapeLabel}`;
        expect(result.accepted, where).toBe(false);
        if (!result.accepted) expect(result.reason, where).toBe("document:invalid-props");
      }
    }
  });

  it("refuses the same values through the raw JSON-text entry point, including escaped lone surrogates", () => {
    // `JSON.stringify` emits a lone surrogate as its own `\uD800`-style escape, so this is a real authored JSON source: the
    // strict reader decodes it to the same code unit, and the field decision refuses the whole Page rather than a fragment.
    for (const [fieldLabel, build] of FIELDS) {
      for (const [shapeLabel, value] of MALFORMED) {
        const text = JSON.stringify(build(value));
        expect(text.includes("\\u"), `${fieldLabel} / ${shapeLabel} must be an escaped JSON source`).toBe(true);
        const result = readUnoPageDocument(text);
        const where = `${fieldLabel} / ${shapeLabel} / JSON text`;
        expect(result.accepted, where).toBe(false);
        if (!result.accepted) expect(result.reason, where).toBe("document:invalid-props");
      }
    }
  });

  it("keeps valid astral pairs, combining sequences and mixed scripts accepted in every Markdown-capable field", () => {
    // One value mixing a supplementary pair (emoji), a combining sequence, CJK, Hebrew, Arabic, Devanagari and Thai text.
    const multilingual = "Übersicht \u{1F600} e\u0301 概要 שלום مرحبا नमस्ते ไทย";
    expect(multilingual.includes("\u{1F600}")).toBe(true);
    for (const [fieldLabel, build] of FIELDS) {
      const result = readUnoPageDocument(build(multilingual));
      expect(result.accepted, fieldLabel).toBe(true);
      if (!result.accepted) continue;
      // The accepted document keeps the authored text exactly: nothing is replaced, trimmed or normalised.
      expect(JSON.stringify(result.document), fieldLabel).toContain("\u{1F600}");
      expect(JSON.stringify(result.document), fieldLabel).toContain("e\u0301");
    }
  });

  it("counts a valid supplementary pair once against the declared field bound", () => {
    const astral = "\u{1F600}";
    // Exactly 4000 code points (8000 UTF-16 units) is inside the prose bound and stays accepted.
    expect(readUnoPageDocument(probe("content.prose", { text: astral.repeat(4000) })).accepted).toBe(true);
    // One code point past the bound is refused, proving the pair is counted once rather than as two units.
    expectRefusal(probe("content.prose", { text: astral.repeat(4001) }), "document:invalid-props");
    // Exactly 320 code points is inside the item-detail bound, and 321 is refused.
    const detail = (text: string) => probe("content.stats", { items: [{ value: "1", label: "L", detail: text }] });
    expect(readUnoPageDocument(detail(astral.repeat(320))).accepted).toBe(true);
    expectRefusal(detail(astral.repeat(321)), "document:invalid-props");
  });

  it("leaves non-Markdown-capable plain fields on their previous contract", () => {
    // Native plain fields are explicitly outside this order: they keep counting a lone surrogate once and accepting it.
    expect(readUnoPageDocument({ ...minimal(), title: "a\uD800b" }).accepted).toBe(true);
    // `UNO-WO-117 / R01`: the probe moved from the quotation (now Markdown-capable) to the plain-only caption labels.
    expect(
      readUnoPageDocument(probe("content.testimonials", { items: [{ quote: "Q", attribution: "a\uD800b" }] })).accepted,
    ).toBe(true);
    expect(
      readUnoPageDocument(probe("content.testimonials", { items: [{ quote: "Q", attribution: "A", role: "a\uD800b" }] }))
        .accepted,
    ).toBe(true);
    expect(readUnoPageDocument(probe("content.heading", { text: "a\uD800b", level: 2 })).accepted).toBe(true);
  });
});


/**
 * `UNO-WO-116 / R02`, correction one: the pre-R01 plain prose/callout lede newline refusal.
 *
 * At `1bf835f` an undeclared lede was read with `allowNewlines: false`, so CR, LF and CRLF refused; R01 accidentally widened
 * it. The single-line refusal is restored without losing R01's Unicode decision, while the body keeps the multi-line policy
 * it has always had and a declared-Markdown lede may still span lines because it is parsed as authored Markdown.
 */
describe("readUnoPageDocument — plain prose and callout lede newline policy", () => {
  function probe(props: Record<string, unknown>): Record<string, unknown> {
    return { ...minimal(), sections: [section("probe", "content.prose", props)] };
  }

  /** The three authored line endings, each named. */
  const BREAKS: readonly (readonly [string, string])[] = [
    ["line feed", "Two\nlines"],
    ["carriage return", "Two\rlines"],
    ["CRLF", "Two\r\nlines"],
  ];

  it("refuses a CR, LF or CRLF in an undeclared prose or callout lede, from plain data and JSON text", () => {
    for (const [label, lede] of BREAKS) {
      for (const props of [
        { text: "Body.", lede },
        { variant: "callout", text: "Body.", lede },
      ]) {
        const where = `${label} / ${props.variant ?? "prose"}`;
        // The pre-R01 reason is retained: the bounded text reader owns the control-character refusal, so a line break in a
        // single-line field is `document:unsafe-text`, exactly as it was at `1bf835f`.
        const direct = readUnoPageDocument(probe(props));
        expect(direct.accepted, where).toBe(false);
        if (!direct.accepted) expect(direct.reason, where).toBe("document:unsafe-text");
        // The same bytes as authored JSON text: the strict reader decodes the escape and the field refuses identically.
        const text = JSON.stringify(probe(props));
        const viaText = readUnoPageDocument(text);
        expect(viaText.accepted, `${where} / JSON text`).toBe(false);
        if (!viaText.accepted) expect(viaText.reason, `${where} / JSON text`).toBe("document:unsafe-text");
      }
    }
  });

  it("keeps the multi-line body policy in both forms", () => {
    // The body has always allowed newlines as plain text, and still does — plain and declared-Markdown alike.
    const body = "First line\nSecond line";
    const plain = readUnoPageDocument(probe({ text: body }));
    expect(plain.accepted).toBe(true);
    if (plain.accepted) expect((plain.document.sections[0]?.props as { text?: string }).text).toBe(body);
    const marked = readUnoPageDocument(probe({ text: body, markdown: true }));
    expect(marked.accepted).toBe(true);
    if (marked.accepted) expect((marked.document.sections[0]?.props as { text?: string }).text).toBe(body);
  });

  it("keeps the previously valid declared-Markdown lede behavior", () => {
    // A lede that declares Markdown is parsed as Markdown, so its authored line break is a paragraph break, not a refusal.
    for (const lede of ["First line\nSecond line", "Two **strong** lines"]) {
      const result = readUnoPageDocument(probe({ text: "Body.", lede, markdown: true }));
      expect(result.accepted, lede).toBe(true);
      if (!result.accepted) continue;
      expect((result.document.sections[0]?.props as { lede?: string }).lede).toBe(lede);
    }
    // A callout keeps the same accepted Markdown lede inside the accent.
    const callout = readUnoPageDocument(
      probe({ variant: "callout", text: "Body.", lede: "First line\nSecond line", markdown: true }),
    );
    expect(callout.accepted).toBe(true);
  });

  it("keeps R01's Unicode refusal in the plain lede", () => {
    expectRefusal(probe({ text: "Body.", lede: "Lead \uD800 tail" }), "document:invalid-props");
    expectRefusal(probe({ variant: "callout", text: "Body.", lede: "Lead \uDC00 tail" }), "document:invalid-props");
  });
});


/**
 * `UNO-WO-116 / R02`, correction two: declared Markdown is validated at the strict Page reader.
 *
 * Before this correction a native hero/stats/timeline node could declare `markdown: true` and carry Markdown the shared reader
 * refuses; the renderer then printed the raw syntax as literal text. Declaring Markdown now means the field **must** parse by
 * the same shared reader the composer and the renderer use, so the fallback is unreachable for an accepted Page. Bounds,
 * newline policies, the closed flag, optional absence, the reason vocabulary and every valid authored output are retained;
 * without the flag, previously accepted well-formed literal text is unchanged.
 */
describe("readUnoPageDocument — declared Markdown is validated for hero, stats and timeline", () => {
  function probe(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { ...minimal(), sections: [section("probe", module, props)] };
  }

  /**
   * Markdown the shared reader refuses, each named with the closed reason the strict reader already owns for it: the
   * plain-text layer keeps `document:unsafe-text` for raw markup and an encoded scheme, and the Markdown layer refuses the
   * rest with `document:invalid-props`.
   */
  const INVALID: readonly (readonly [string, string, string])[] = [
    ["raw element", "Lead <b>bold</b> tail", "document:unsafe-text"],
    ["image", "Lead ![alt](https://example.invalid/i.png) tail", "document:invalid-props"],
    ["unbalanced strong", "Lead **unclosed", "document:invalid-props"],
    ["script destination", "Lead [x](javascript:alert(1)) tail", "document:unsafe-text"],
    ["protocol-relative destination", "Lead [x](//example.invalid/p) tail", "document:invalid-props"],
  ];

  /** Every declared-Markdown native surface, each built from one value. */
  const SURFACES: readonly (readonly [string, (value: string) => Record<string, unknown>])[] = [
    ["hero lede", (value) => probe("content.hero", { lede: value, markdown: true })],
    ["hero support", (value) => probe("content.hero", { support: value, markdown: true })],
    [
      "stats detail",
      (value) => probe("content.stats", { items: [{ value: "1", label: "L", detail: value }], markdown: true }),
    ],
    [
      "timeline description",
      (value) => probe("content.timeline", { items: [{ title: "T", description: value }], markdown: true }),
    ],
  ];

  it("refuses the whole Page for each invalid declared-Markdown field, from plain data and JSON text", () => {
    for (const [surface, build] of SURFACES) {
      for (const [label, value, expected] of INVALID) {
        const where = `${surface} / ${label}`;
        const direct = readUnoPageDocument(build(value));
        expect(direct.accepted, where).toBe(false);
        // Nothing partial ever comes back: the result is exactly one closed refusal with the documented reason.
        expect(Object.keys(direct).sort(), where).toEqual(["accepted", "reason"]);
        if (!direct.accepted) expect(direct.reason, where).toBe(expected);
        const viaText = readUnoPageDocument(JSON.stringify(build(value)));
        expect(viaText.accepted, `${where} / JSON text`).toBe(false);
        if (!viaText.accepted) expect(viaText.reason, `${where} / JSON text`).toBe(expected);
      }
    }
  });


  it("accepts valid declared Markdown and keeps the authored text exactly", () => {
    const cases: readonly (readonly [string, string, Record<string, unknown>, string])[] = [
      ["hero lede", "content.hero", { lede: "A **visible** line\n\nand a second paragraph", markdown: true }, "lede"],
      ["hero support", "content.hero", { support: "This is *bounded* support.", markdown: true }, "support"],
      [
        "stats detail",
        "content.stats",
        { items: [{ value: "1", label: "L", detail: "Only `one` detail." }], markdown: true },
        "detail",
      ],
      [
        "timeline description",
        "content.timeline",
        { items: [{ title: "T", description: "The **source** milestone." }], markdown: true },
        "description",
      ],
    ];
    for (const [label, module, props, field] of cases) {
      const result = readUnoPageDocument(probe(module, props));
      expect(result.accepted, label).toBe(true);
      if (!result.accepted) continue;
      const section = (result.document.sections as readonly { props: Record<string, unknown> }[])[0];
      if (section === undefined) throw new Error("expected one section");
      const authored =
        field === "detail" || field === "description"
          ? ((section.props["items"] as readonly Record<string, unknown>[])[0] ?? {})[field]
          : section.props[field];
      const expected =
        field === "detail" || field === "description"
          ? ((props["items"] as readonly Record<string, unknown>[])[0] ?? {})[field]
          : props[field];
      expect(authored, label).toBe(expected);
      // The accepted document round-trips through its own serialization.
      expect(readUnoPageDocument(JSON.stringify(result.document)).accepted, `${label} round trip`).toBe(true);
    }
  });

  it("retains each field's own newline policy when Markdown is declared", () => {
    // A hero body field is multi-line by contract, so an authored blank line is a paragraph break.
    expect(readUnoPageDocument(probe("content.hero", { lede: "One\n\nTwo", markdown: true })).accepted).toBe(true);
    // A stats detail and a timeline description stay single-line: declaring Markdown does not widen them.
    expectRefusal(
      probe("content.stats", { items: [{ value: "1", label: "L", detail: "One\nTwo" }], markdown: true }),
      "document:unsafe-text",
    );
    expectRefusal(
      probe("content.timeline", { items: [{ title: "T", description: "One\nTwo" }], markdown: true }),
      "document:unsafe-text",
    );
  });

  it("leaves the undeclared form exactly as lax or strict as it was", () => {
    // Well-formed literal text that happens to look like Markdown stays accepted when no Markdown is declared.
    const literal = "Lead **unclosed ![alt](https://example.invalid/i.png) tail";
    const undeclared: readonly (readonly [string, Record<string, unknown>])[] = [
      ["hero lede", { lede: literal }],
      ["hero support", { support: literal }],
      ["stats detail", { items: [{ value: "1", label: "L", detail: literal }] }],
      ["timeline description", { items: [{ title: "T", description: literal }] }],
    ];
    const modules = ["content.hero", "content.hero", "content.stats", "content.timeline"];
    undeclared.forEach(([label, props], index) => {
      const result = readUnoPageDocument(probe(modules[index] ?? "content.hero", props));
      expect(result.accepted, `${label} without the flag`).toBe(true);
    });
    // The R01 Unicode refusal and the closed flag are unchanged.
    expectRefusal(probe("content.hero", { lede: "Lead \uD800 tail" }), "document:invalid-props");
    expectRefusal(
      probe("content.stats", { items: [{ value: "1", label: "L" }], markdown: false }),
      "document:invalid-props",
    );
    expectRefusal(probe("content.timeline", { items: [{ title: "T" }], markdown: "true" }), "document:invalid-props");
  });
});


/**
 * `UNO-WO-117 / R01`: the donor `quote.body` is Markdown-capable, so the strict reader owns the quotation's Markdown too.
 *
 * The plain form keeps the byte-identical literal text and, because the field can be published as Markdown, both forms are
 * held to the one Unicode decision. A node that declares `markdown: true` must also parse by the shared reader, so the
 * renderer can never fall back to printing raw syntax as if it were the authored quotation.
 */
describe("readUnoPageDocument — content.testimonials declared Markdown", () => {
  function probe(module: string, props: Record<string, unknown>): Record<string, unknown> {
    return { ...minimal(), sections: [section("probe", module, props)] };
  }
  const quote = (props: Record<string, unknown>) => probe("content.testimonials", props);

  it("accepts a declared Markdown quotation, keeps its text exactly and round-trips it", () => {
    const rich = "A **bounded** quotation with a [safe link](https://example.org/notes).";
    const result = readUnoPageDocument(quote({ items: [{ quote: rich }], markdown: true, align: "center" }));
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const node = result.document.sections[0];
    if (node?.module !== "content.testimonials") throw new Error("expected a testimonials node");
    expect(node.props.markdown).toBe(true);
    expect(node.props.items[0]?.quote).toBe(rich);
    // The accepted document re-reads from its own serialization without a change.
    const roundTrip = readUnoPageDocument(JSON.stringify(result.document));
    expect(roundTrip.accepted).toBe(true);
    if (roundTrip.accepted) expect(JSON.stringify(roundTrip.document)).toBe(JSON.stringify(result.document));
  });

  it("keeps plain literal text accepted when no Markdown is declared", () => {
    // Without the flag the field keeps its previous contract: well-formed literal text that resembles Markdown stays text.
    for (const literal of [
      "An **unbalanced quotation",
      "A ![plate](https://example.org/i.png) reference",
      "A `code` span and a ~~strike~~",
    ]) {
      const result = readUnoPageDocument(quote({ items: [{ quote: literal }] }));
      expect(result.accepted, literal).toBe(true);
      if (result.accepted) {
        const node = result.document.sections[0];
        if (node?.module === "content.testimonials") expect(node.props.items[0]?.quote).toBe(literal);
      }
    }
    // The plain-text layer still refuses raw markup in both forms, so declaring Markdown adds no way past it.
    expectRefusal(quote({ items: [{ quote: "A <b>t</b> tail" }] }), "document:unsafe-text");
  });

  it("refuses invalid declared Markdown in the quotation, from plain data and JSON text", () => {
    const invalid: readonly (readonly [string, string, string])[] = [
      ["raw element", "A <b>bold</b> tail", "document:unsafe-text"],
      ["image", "A ![plate](https://example.org/i.png) tail", "document:invalid-props"],
      ["unbalanced strong", "An **unclosed quotation", "document:invalid-props"],
      ["script destination", "A [x](javascript:alert(1)) tail", "document:unsafe-text"],
      ["protocol-relative destination", "A [x](//example.org/p) tail", "document:invalid-props"],
    ];
    for (const [label, value, expected] of invalid) {
      const document = quote({ items: [{ quote: value }], markdown: true });
      const direct = readUnoPageDocument(document);
      expect(direct.accepted, label).toBe(false);
      if (!direct.accepted) expect(direct.reason, label).toBe(expected);
      const viaText = readUnoPageDocument(JSON.stringify(document));
      expect(viaText.accepted, `${label} / JSON text`).toBe(false);
      if (!viaText.accepted) expect(viaText.reason, `${label} / JSON text`).toBe(expected);
    }
  });

  it("keeps the closed flag, the multi-line policy and the 4,000 code-point bound", () => {
    // Only the literal `true` is the switch.
    expectRefusal(quote({ items: [{ quote: "Q" }], markdown: false }), "document:invalid-props");
    expectRefusal(quote({ items: [{ quote: "Q" }], markdown: "true" }), "document:invalid-props");
    // A quotation may span lines in both forms: the donor body is multi-paragraph text.
    expect(readUnoPageDocument(quote({ items: [{ quote: "One\n\nTwo" }] })).accepted).toBe(true);
    expect(readUnoPageDocument(quote({ items: [{ quote: "One\n\nTwo" }], markdown: true })).accepted).toBe(true);
    // The donor's 4,000 code-point body limit is the existing Uno text bound: it is neither widened nor narrowed.
    const astral = "\u{1F600}";
    expect(readUnoPageDocument(quote({ items: [{ quote: astral.repeat(4000) }], markdown: true })).accepted).toBe(true);
    expectRefusal(quote({ items: [{ quote: astral.repeat(4001) }], markdown: true }), "document:invalid-props");
  });
});

