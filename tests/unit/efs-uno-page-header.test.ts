import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  UNO_PAGE_HEADER_LIMITS,
  UNO_PAGE_HEADER_REFUSAL_REASONS,
  projectUnoSelectedPageHeader,
  type UnoPageHeaderRefusal,
  type UnoPageHeaderResult,
} from "../../src/core/efs/uno-page-header";

/**
 * U03 selected Page-header projector tests (`UNO-WO-021 / R01`).
 *
 * These cases drive the **real** pure core projector. Every refusal asserts the exact closed literal and
 * that the literal belongs to `UNO_PAGE_HEADER_REFUSAL_REASONS`, so a projector that always accepted,
 * always refused, or refused for the wrong reason could not pass.
 */

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HOME_MARKDOWN = readFileSync(
  join(REPO_ROOT, "deployment", "efs", "content", "home.en-001.md"),
  "utf8",
);

function expectRefusal(result: UnoPageHeaderResult, reason: UnoPageHeaderRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(UNO_PAGE_HEADER_REFUSAL_REASONS).toContain(result.reason);
}

/** Project one source and require acceptance. */
function expectAccepted(kind: "json" | "markdown", text: string, routePath = "home"): UnoPageHeaderResult {
  const result = projectUnoSelectedPageHeader({ kind, text, routePath });
  expect(result.accepted).toBe(true);
  return result;
}

const TITLE_160 = "a".repeat(UNO_PAGE_HEADER_LIMITS.titleCodePoints);
const TITLE_161 = "a".repeat(UNO_PAGE_HEADER_LIMITS.titleCodePoints + 1);
const DESCRIPTION_320 = "b".repeat(UNO_PAGE_HEADER_LIMITS.descriptionCodePoints);
const DESCRIPTION_321 = "b".repeat(UNO_PAGE_HEADER_LIMITS.descriptionCodePoints + 1);

describe("Markdown projection", () => {
  it("projects the real committed Home Markdown heading and body", () => {
    const result = expectAccepted("markdown", HOME_MARKDOWN);
    if (!result.accepted) return;
    expect(result.kind).toBe("markdown");
    expect(result.title).toBe("Foundation Uno");
    expect(result.visibility).toBe("public");
    expect(typeof result.markdownBody).toBe("string");
    expect((result.markdownBody as string).length).toBeGreaterThan(200);
    expect(Object.keys(result).sort()).toEqual(["accepted", "kind", "markdownBody", "title", "visibility"]);
  });

  it("returns the body as raw unrendered Markdown, never HTML", () => {
    const result = expectAccepted("markdown", "# Title\n\n## Section\n\nSome *emphasis* and a list:\n\n- one\n");
    if (!result.accepted) return;
    expect(result.markdownBody).toBe("## Section\n\nSome *emphasis* and a list:\n\n- one");
    expect(result.markdownBody).not.toContain("<");
  });

  it("never carries a description for Markdown", () => {
    const result = expectAccepted("markdown", "# Title\n\nBody.\n");
    if (!result.accepted) return;
    expect("description" in result).toBe(false);
  });

  it("accepts CRLF line endings without inventing a title or body", () => {
    const result = expectAccepted("markdown", "# CRLF title\r\n\r\nCRLF body.\r\n");
    if (!result.accepted) return;
    expect(result.title).toBe("CRLF title");
    expect(result.markdownBody).toBe("CRLF body.");
  });

  it("accepts a body separated from the heading by blank lines", () => {
    const result = expectAccepted("markdown", "\n\n# Spaced title\n\n\nBody after spacing.\n");
    if (!result.accepted) return;
    expect(result.title).toBe("Spaced title");
    expect(result.markdownBody).toBe("Body after spacing.");
  });

  it("refuses YAML front matter", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "---\ntitle: X\n---\n\n# T\n\nB\n", routePath: "home" }),
      "header:markdown-front-matter",
    );
  });

  it("refuses a Markdown declaration claiming visibility", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "# T\n\nvisibility: unlisted\n\nB\n", routePath: "home" }),
      "header:markdown-visibility",
    );
  });

  it("refuses a source without a leading heading", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "Just a paragraph.\n\nMore.\n", routePath: "home" }),
      "header:markdown-heading",
    );
  });

  it("refuses an empty heading", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "#   \n\nBody.\n", routePath: "home" }),
      "header:title-empty",
    );
  });

  it("refuses a heading with no body", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "# Title only\n", routePath: "home" }),
      "header:markdown-body",
    );
  });

  it("refuses raw HTML in the source", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "# T\n\n<div>x</div>\n", routePath: "home" }),
      "header:text-raw-html",
    );
  });

  it("refuses an empty Markdown source", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "   \n\n", routePath: "home" }),
      "header:text-empty",
    );
  });
});

const json = (value: unknown): string => JSON.stringify(value);

describe("JSON header projection", () => {
  it("projects a title and defaults visibility to public", () => {
    const result = expectAccepted("json", json({ title: "A page" }));
    if (!result.accepted) return;
    expect(result.kind).toBe("json");
    expect(result.title).toBe("A page");
    expect(result.visibility).toBe("public");
    expect(Object.keys(result).sort()).toEqual(["accepted", "kind", "title", "visibility"]);
  });

  it("projects an optional description", () => {
    const result = expectAccepted("json", json({ title: "A page", description: "A summary." }));
    if (!result.accepted) return;
    expect(result.description).toBe("A summary.");
    expect("markdownBody" in result).toBe(false);
  });

  it("accepts an explicit unlisted visibility for a non-Home route", () => {
    const result = projectUnoSelectedPageHeader({
      kind: "json",
      text: json({ title: "Offers", visibility: "unlisted" }),
      routePath: "offers/website-design",
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.visibility).toBe("unlisted");
  });

  it("refuses unlisted for the reserved Home route through the existing policy", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({
        kind: "json",
        text: json({ title: "Home", visibility: "unlisted" }),
        routePath: "home",
      }),
      "home-cannot-be-unlisted",
    );
  });

  it("refuses an unknown visibility value", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: json({ title: "T", visibility: "secret" }), routePath: "home" }),
      "unknown-visibility",
    );
  });

  it("refuses a missing, non-string, empty and oversized title", () => {
    const cases: readonly (readonly [string, string, UnoPageHeaderRefusal])[] = [
      [json({ description: "no title" }), "home", "header:title-missing"],
      [json({ title: 7 }), "home", "header:title-not-a-string"],
      [json({ title: "   " }), "home", "header:title-empty"],
      [json({ title: TITLE_161 }), "home", "header:title-too-long"],
    ];
    for (const [text, routePath, reason] of cases) {
      expectRefusal(projectUnoSelectedPageHeader({ kind: "json", text, routePath }), reason);
    }
  });

  it("accepts a title of exactly the code-point cap", () => {
    const result = expectAccepted("json", json({ title: TITLE_160 }));
    if (!result.accepted) return;
    expect(result.title).toBe(TITLE_160);
  });

  it("refuses a multiline or markup-bearing title", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: json({ title: "a\nb" }), routePath: "home" }),
      "header:title-multiline",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: json({ title: "a < b" }), routePath: "home" }),
      "header:title-unsafe",
    );
    // A tag-shaped construct is refused earlier, at the source-text level.
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: json({ title: "<b>bold</b>" }), routePath: "home" }),
      "header:text-raw-html",
    );
  });

  it("refuses an empty, oversized or markup-bearing description", () => {
    const cases: readonly (readonly [string, UnoPageHeaderRefusal])[] = [
      [json({ title: "T", description: "" }), "header:description-empty"],
      [json({ title: "T", description: DESCRIPTION_321 }), "header:description-too-long"],
      [json({ title: "T", description: "a > b" }), "header:description-unsafe"],
      [json({ title: "T", description: 5 }), "header:description-not-a-string"],
    ];
    for (const [text, reason] of cases) {
      expectRefusal(projectUnoSelectedPageHeader({ kind: "json", text, routePath: "home" }), reason);
    }
  });

  it("accepts a description of exactly the code-point cap", () => {
    const result = expectAccepted("json", json({ title: "T", description: DESCRIPTION_320 }));
    if (!result.accepted) return;
    expect(result.description).toBe(DESCRIPTION_320);
  });
});


describe("JSON authority and hostile JSON", () => {
  it("refuses malformed JSON and non-object roots", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: '{"title":', routePath: "home" }),
      "header:json-parse",
    );
    for (const text of ["[]", "[1,2]", "5", "null", '"text"', "true"]) {
      expectRefusal(projectUnoSelectedPageHeader({ kind: "json", text, routePath: "home" }), "header:json-shape");
    }
  });

  it("refuses a repeated top-level authority key instead of letting the last value win", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: '{"title":"first","title":"second"}', routePath: "home" }),
      "header:json-duplicate-key",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({
        kind: "json",
        text: '{"title":"T","visibility":"public","visibility":"unlisted"}',
        routePath: "home",
      }),
      "header:json-duplicate-key",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({
        kind: "json",
        text: '{"description":"a","title":"T","description":"b"}',
        routePath: "home",
      }),
      "header:json-duplicate-key",
    );
  });

  it("does not refuse a repeated key nested below the top level", () => {
    const result = expectAccepted("json", '{"title":"T","modules":[{"name":"a","name":"b"}]}');
    if (!result.accepted) return;
    expect(result.title).toBe("T");
  });

  it("refuses prototype-polluting keys and excessive nesting", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: '{"title":"T","__proto__":{"x":1}}', routePath: "home" }),
      "header:json-pollution",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: '{"title":"T","a":{"constructor":1}}', routePath: "home" }),
      "header:json-pollution",
    );
    let nested = '{"leaf":1}';
    for (let level = 0; level < 12; level += 1) nested = `{"a":${nested}}`;
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "json", text: `{"title":"T","modules":${nested}}`, routePath: "home" }),
      "header:json-depth",
    );
  });

  it("keeps every other JSON key opaque and non-authoritative", () => {
    const result = expectAccepted(
      "json",
      '{"title":"T","public":true,"published":true,"modules":[{"kind":"hero"}],"host":"example.test","assets":["a"]}',
    );
    if (!result.accepted) return;
    expect(Object.keys(result).sort()).toEqual(["accepted", "kind", "title", "visibility"]);
    const serialised = JSON.stringify(result);
    for (const forbidden of ['"published"', '"modules"', '"host"', '"assets"', '"public":']) {
      expect(serialised.includes(forbidden)).toBe(false);
    }
  });
});


describe("projector input safety", () => {
  it("refuses a non-string, empty, oversized or unsafe source text", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: 7, routePath: "home" }),
      "header:text-not-a-string",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "  \n ", routePath: "home" }),
      "header:text-empty",
    );
    const oversize = `# T\n\n${"a".repeat(UNO_PAGE_HEADER_LIMITS.sourceBytes)}`;
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: oversize, routePath: "home" }),
      "header:text-too-large",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "# T\n\nBo\u0000dy\n", routePath: "home" }),
      "header:text-nul",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "# T\n\nBo\u0007dy\n", routePath: "home" }),
      "header:text-control",
    );
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "markdown", text: "# T\n\nBad \ud83d body\n", routePath: "home" }),
      "header:text-not-scalar",
    );
  });

  it("accepts a valid astral character inside the title", () => {
    const result = expectAccepted("markdown", "# Caf\u00e9 \ud83d\ude00\n\nBody.\n");
    if (!result.accepted) return;
    expect(result.title).toBe("Caf\u00e9 \ud83d\ude00");
  });

  it("refuses an unknown kind and an invalid authoring route", () => {
    expectRefusal(
      projectUnoSelectedPageHeader({ kind: "yaml", text: "# T\n\nB\n", routePath: "home" }),
      "header:unknown-kind",
    );
    for (const routePath of ["", "../escape", "/leading", "trailing/", "a//b", "a\\b", "with space"]) {
      expectRefusal(
        projectUnoSelectedPageHeader({ kind: "markdown", text: "# T\n\nB\n", routePath }),
        "header:route-invalid",
      );
    }
  });

  it("refuses an unexpected input shape", () => {
    for (const input of [
      null,
      [],
      "text",
      { kind: "markdown", text: "# T\n\nB\n" },
      { kind: "markdown", text: "# T\n\nB\n", routePath: "home", extra: 1 },
      { text: "# T\n\nB\n", routePath: "home" },
    ]) {
      const result = projectUnoSelectedPageHeader(input);
      expect(result.accepted).toBe(false);
      if (result.accepted) return;
      expect(["header:input-not-plain", "header:input-shape"]).toContain(result.reason);
    }
  });

  it("refuses hostile records without invoking code", () => {
    let reads = 0;
    const accessor = {
      get kind(): string {
        reads += 1;
        return "markdown";
      },
      text: "# T\n\nB\n",
      routePath: "home",
    };
    const accessorResult = projectUnoSelectedPageHeader(accessor);
    expect(accessorResult.accepted).toBe(false);
    expect(reads).toBe(0);

    const withSymbol: Record<PropertyKey, unknown> = {
      kind: "markdown",
      text: "# T\n\nB\n",
      routePath: "home",
    };
    withSymbol[Symbol("extra")] = true;
    expectRefusal(projectUnoSelectedPageHeader(withSymbol), "header:input-not-plain");

    class Exotic {
      kind = "markdown";
      text = "# T\n\nB\n";
      routePath = "home";
    }
    expectRefusal(projectUnoSelectedPageHeader(new Exotic()), "header:input-not-plain");

    const hostile = new Proxy(
      { kind: "markdown", text: "# T\n\nB\n", routePath: "home" },
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    expectRefusal(projectUnoSelectedPageHeader(hostile), "header:input-not-plain");
  });

  it("does not mutate its input and returns a frozen result", () => {
    const input = { kind: "json", text: '{"title":"T"}', routePath: "home" };
    const before = JSON.stringify(input);
    const result = projectUnoSelectedPageHeader(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.accepted).toBe(true);
  });

  it("exposes every refusal literal in one closed, duplicate-free vocabulary", () => {
    expect(UNO_PAGE_HEADER_REFUSAL_REASONS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(UNO_PAGE_HEADER_REFUSAL_REASONS).size).toBe(UNO_PAGE_HEADER_REFUSAL_REASONS.length);
    for (const reason of ["home-cannot-be-unlisted", "unknown-visibility", "header:json-duplicate-key"]) {
      expect(UNO_PAGE_HEADER_REFUSAL_REASONS).toContain(reason as UnoPageHeaderRefusal);
    }
  });
});
