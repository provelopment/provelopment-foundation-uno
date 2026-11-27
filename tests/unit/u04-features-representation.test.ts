import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  isUnoLayoutGridFeatures,
  readUnoPageDocument,
  type UnoPageDocument,
} from "../../src/core/page-document";
import { UnoPageSections } from "../../src/components/uno-page-sections";

/** Render one document exactly as the page component would, with no media projection and no JSX in a `.ts` file. */
function render(document: UnoPageDocument): string {
  return renderToStaticMarkup(createElement(UnoPageSections, { document }));
}

/** The one stylesheet the production Page actually ships. */
function stylesheet(): string {
  return readFileSync(fileURLToPath(new URL("../../src/app/globals.css", import.meta.url)), "utf8");
}

/** One accepted document from plain data, failing loudly when the fixture itself is invalid. */
function accept(document: Record<string, unknown>): UnoPageDocument {
  const result = readUnoPageDocument(document);
  if (!result.accepted) throw new Error(`fixture refused: ${result.reason}`);
  return result.document;
}

/** The reason one document is refused, failing loudly when it is accepted instead. */
function refusal(document: Record<string, unknown>): string {
  const result = readUnoPageDocument(document);
  if (result.accepted) throw new Error("fixture was accepted but should have been refused");
  return result.reason;
}

/** Wrap one section in the smallest acceptable Page envelope. */
function page(section: Record<string, unknown>): Record<string, unknown> {
  return {
    version: 1,
    title: "Features fixture",
    description: "One synthetic features section.",
    sections: [section],
  };
}

/** The icon identity every fixture binds to an owned Page asset. */
const ICON = Object.freeze({ zone: "page", path: "feature-icon.png" });

/** The full features section: heading, Markdown lede, surface, explicit columns and three units. */
function featuresSection(): Record<string, unknown> {
  return {
    id: "feat",
    module: "layout.grid",
    props: {
      features: [
        { title: "One", body: "First **strong** body.", bodyMarkdown: true, icon: ICON },
        { title: "Two" },
        { title: "Three", body: "Third body." },
      ],
      columns: 3,
      heading: "What we do",
      level: 2,
      lede: "A **lede** in Markdown.",
      ledeMarkdown: true,
      surface: "muted",
    },
  };
}

describe("the native features representation (`UNO-WO-125 / R02`)", () => {
  it("reads one childless node with its heading, Markdown lede, surface, columns and ordered units", () => {
    const document = accept(page(featuresSection()));
    const node = document.sections[0];
    expect(node?.module).toBe("layout.grid");
    if (node === undefined || node.module !== "layout.grid" || !isUnoLayoutGridFeatures(node.props)) {
      throw new Error("expected a features grid");
    }
    const props = node.props;
    expect(props.columns).toBe(3);
    expect(props.heading).toBe("What we do");
    expect(props.level).toBe(2);
    expect(props.surface).toBe("muted");
    expect(props.lede).toBe("A **lede** in Markdown.");
    expect(props.ledeMarkdown).toBe(true);
    expect(props.features).toHaveLength(3);
    // Nothing is manufactured: the second unit authored no body and no icon, so it carries neither key.
    expect(props.features[0]).toEqual({
      title: "One",
      body: "First **strong** body.",
      bodyMarkdown: true,
      icon: { zone: "page", path: "feature-icon.png" },
    });
    expect(props.features[1]).toEqual({ title: "Two" });
    expect(props.features[2]).toEqual({ title: "Three", body: "Third body." });
  });

  it("keeps the features node authentically childless in its serialized form", () => {
    const document = accept(page(featuresSection()));
    const node = document.sections[0];
    if (node === undefined || node.module !== "layout.grid" || !isUnoLayoutGridFeatures(node.props)) {
      throw new Error("expected a features grid");
    }
    // The empty `children` list exists for the grid contract's consumers but is not authored, so it never serializes.
    expect(node.children).toHaveLength(0);
    expect(JSON.stringify(node)).not.toContain("children");
    // Re-reading the serialized document must succeed rather than refuse it as authored `children`.
    expect(readUnoPageDocument(JSON.parse(JSON.stringify(document))).accepted).toBe(true);
  });

  it("accepts a headingless, ledeless, columnless features node and a single unit", () => {
    const document = accept(
      page({ id: "bare", module: "layout.grid", props: { features: [{ title: "Only" }] } }),
    );
    const node = document.sections[0];
    if (node === undefined || node.module !== "layout.grid" || !isUnoLayoutGridFeatures(node.props)) {
      throw new Error("expected a features grid");
    }
    // No default is invented here: the renderer's own three/two/one intent applies to an absent `columns`.
    expect(node.props.columns).toBeUndefined();
    expect(node.props.heading).toBeUndefined();
    expect(node.props.lede).toBeUndefined();
    expect(node.props.surface).toBeUndefined();
    expect(node.props.features).toEqual([{ title: "Only" }]);
  });

  it("accepts the donor ceiling of twenty-four units and refuses a twenty-fifth", () => {
    const units = (count: number): Record<string, unknown>[] =>
      Array.from({ length: count }, (_unused, index) => ({ title: `Unit ${index}` }));
    const accepted = accept(page({ id: "twenty-four", module: "layout.grid", props: { features: units(24) } }));
    const node = accepted.sections[0];
    if (node === undefined || node.module !== "layout.grid" || !isUnoLayoutGridFeatures(node.props)) {
      throw new Error("expected a features grid");
    }
    expect(node.props.features).toHaveLength(24);
    expect(refusal(page({ id: "twenty-five", module: "layout.grid", props: { features: units(25) } }))).toBe(
      "document:invalid-props",
    );
    expect(refusal(page({ id: "none", module: "layout.grid", props: { features: [] } }))).toBe(
      "document:invalid-props",
    );
  });

  it("refuses every crossed or unauthored feature shape rather than dropping a field", () => {
    // A features grid owns its content: an explicitly empty `children` array is the same crossed shape as a real one.
    expect(refusal(page({ ...featuresSection(), children: [] }))).toBe("document:invalid-section");
    expect(
      refusal(
        page({
          ...featuresSection(),
          children: [{ id: "kid", module: "content.prose", props: { text: "Text." } }],
        }),
      ),
    ).toBe("document:invalid-section");
    // An icon never carries an authored alternative: it is decorative by contract.
    expect(
      refusal(
        page({
          id: "alt-icon",
          module: "layout.grid",
          props: { features: [{ title: "One", icon: { ...ICON, alt: "A described icon" } }] },
        }),
      ),
    ).toBe("document:invalid-props");
    // An external or provider icon identity is not an owned asset and is not representable.
    expect(
      refusal(
        page({
          id: "external-icon",
          module: "layout.grid",
          props: { features: [{ title: "One", icon: { zone: "external", url: "https://example.com/i.png" } }] },
        }),
      ),
    ).toBe("document:invalid-props");
    // A Markdown declaration without a body, and any unknown unit field, both refuse.
    expect(
      refusal(
        page({ id: "markdown-only", module: "layout.grid", props: { features: [{ title: "One", bodyMarkdown: true }] } }),
      ),
    ).toBe("document:invalid-props");
    expect(
      refusal(
        page({
          id: "unknown-unit",
          module: "layout.grid",
          props: { features: [{ title: "One", action: { label: "Go" } }] },
        }),
      ),
    ).toBe("document:invalid-props");
    // The cards and features representations are separate closed shapes and never combine.
    expect(
      refusal(
        page({
          id: "both",
          module: "layout.grid",
          props: { cards: [{ title: "A card" }], features: [{ title: "One" }] },
        }),
      ),
    ).toBe("document:invalid-props");
    // A lede declared as Markdown without a lede, and the ordinary grid's own semantics beside features, both refuse.
    expect(
      refusal(
        page({ id: "lede-only", module: "layout.grid", props: { features: [{ title: "One" }], ledeMarkdown: true } }),
      ),
    ).toBe("document:invalid-props");
    expect(
      refusal(
        page({
          id: "unknown-prop",
          module: "layout.grid",
          props: { features: [{ title: "One" }], itemSemantics: "list" },
        }),
      ),
    ).toBe("document:invalid-props");
  });
});

describe("the native features presentation (`UNO-WO-125 / R02`)", () => {
  it("renders one authored section, one list and one border-free unit per feature", () => {
    const markup = render(accept(page(featuresSection())));
    expect(markup).toContain('class="uno-json-features-section"');
    expect(markup).toContain('data-uno-surface="muted"');
    expect(markup).toContain('id="feat"');
    // The donor outline: an authored heading is the section `<h2>` and the unit titles are its `<h3>`.
    expect(markup).toContain('class="uno-json-heading"');
    expect(markup).toContain('id="feat-heading"');
    expect(markup).toContain("What we do");
    // The lede is Markdown because it was authored as Markdown.
    expect(markup).toContain("uno-json-features-lede");
    expect(markup.toLowerCase()).toContain("in markdown.");
    expect(markup).toContain('class="uno-json-features"');
    expect(markup).toContain('data-uno-columns="3"');
    expect(markup).toContain('id="feat-list"');
    expect(markup).toContain('role="list"');
    expect((markup.match(/class="uno-json-feature"/g) ?? []).length).toBe(3);
    expect(markup).toContain('<h3 class="uno-json-feature-title">One</h3>');
    // A Markdown body renders as Markdown; a plain body stays one paragraph.
    expect(markup).not.toContain("**");
    expect(markup).toContain('<p class="uno-json-feature-body">Third body.</p>');
    // No icon is invented: with no server-resolved projection the units carry no image element at all.
    expect(markup).not.toContain("<img");
    // It is never the bordered card treatment.
    expect(markup).not.toContain("uno-json-card");
  });

  it("renders a headingless, columnless features node at level two and invents no intent", () => {
    const markup = render(
      accept(page({ id: "bare", module: "layout.grid", props: { features: [{ title: "Only" }] } })),
    );
    expect(markup).toContain('<h2 class="uno-json-feature-title">Only</h2>');
    expect(markup).not.toContain("uno-json-heading");
    expect(markup).not.toContain("data-uno-columns");
    expect(markup).not.toContain("data-uno-surface");
  });

  it("ships the features list, its three/two/one default and its closed surfaces in the one stylesheet", () => {
    const css = stylesheet();
    expect(css).toContain(".uno-json-features {");
    expect(css).toContain('.uno-json-features[data-uno-columns="2"]');
    expect(css).toContain('.uno-json-features[data-uno-columns="4"]');
    expect(css).toContain('.uno-json-features-section[data-uno-surface="muted"]');
    expect(css).toContain(".uno-json-feature-icon {");
  });
});
