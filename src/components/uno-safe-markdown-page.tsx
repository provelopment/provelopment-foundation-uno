/**
 * Foundation Uno — safe Markdown presentation (`UNO-WO-028 / R01`, U03).
 *
 * WHAT THIS IS. A deliberately small Markdown subset renderer for an authored Page body that the Page-header
 * contract has already accepted: ATX headings (`##`–`######`), paragraphs, unordered and ordered lists and
 * fenced code blocks. Every fragment is passed to React as a **text node**, so no authored string can become
 * markup, an attribute, a style, a script or a link.
 *
 * WHAT IT REFUSES. Raw HTML (`<`, `>`), images (`![`), links (`](`), block quotes, tables, a second level-one
 * heading (the Page title is the single visible `h1`), an unclosed fence, an unsupported fence language and
 * any block beyond the declared caps all fail the whole parse. The caller answers a real 404 rather than
 * rendering a partial or best-effort document. There is no sanitising regex to get wrong, because nothing is
 * ever interpreted as HTML in the first place.
 *
 * WHAT IT IS NOT. No `dangerouslySetInnerHTML`, no Markdown library, no remote asset, no executable content, no
 * client component, no provider and no dependency. It renders a body; it publishes nothing.
 */
import type { ReactElement } from "react";

/** Declared bounds. A limit, not a default: exceeding one fails the parse instead of truncating. */
export const UNO_SAFE_MARKDOWN_LIMITS = Object.freeze({
  blocks: 512,
  blockChars: 4000,
  listItems: 64,
  fenceLanguageChars: 20,
});

/** One safe, presentation-ready block. */
export type UnoSafeMarkdownBlock =
  | { readonly kind: "heading"; readonly level: 2 | 3 | 4 | 5 | 6; readonly text: string }
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "list"; readonly ordered: boolean; readonly items: readonly string[] }
  | { readonly kind: "code"; readonly language: string; readonly text: string };

/** The parser result: every block, or nothing at all. */
export type UnoSafeMarkdownParse =
  | { readonly ok: true; readonly blocks: readonly UnoSafeMarkdownBlock[] }
  | { readonly ok: false };

/** Fragments that would introduce markup, an image or a link. Any one fails the whole document. */
const UNSAFE_MARKERS: readonly string[] = Object.freeze(["<", ">", "](", "!["]);

/** A fence language this subset will label. Only an identifier-shaped hint is accepted. */
const FENCE_LANGUAGE_PATTERN = /^[A-Za-z0-9+#._-]*$/u;

/** True when one fragment cannot be rendered as inert text. */
function isUnsafeText(text: string): boolean {
  if (text.length === 0 || text.length > UNO_SAFE_MARKDOWN_LIMITS.blockChars) return true;
  for (const marker of UNSAFE_MARKERS) {
    if (text.includes(marker)) return true;
  }
  return false;
}

/**
 * Parse one already-accepted Markdown body into inert blocks.
 *
 * The body never contains the Page title: the header projector removes that `# ` line, so a level-one heading
 * here means the document would render two `h1` elements and is refused. Line endings are normalised first, so
 * the same source parses identically on every host.
 */
export function parseUnoSafeMarkdown(source: unknown): UnoSafeMarkdownParse {
  if (typeof source !== "string" || source.length === 0) return { ok: false };
  const lines = source.replace(/\r\n/gu, "\n").replace(/\r/gu, "\n").split("\n");

  const blocks: UnoSafeMarkdownBlock[] = [];
  let paragraph: string[] = [];
  let index = 0;

  const flushParagraph = (): boolean => {
    if (paragraph.length === 0) return true;
    const text = paragraph.join(" ");
    paragraph = [];
    if (isUnsafeText(text)) return false;
    blocks.push({ kind: "paragraph", text });
    return true;
  };

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      if (!flushParagraph()) return { ok: false };
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      if (!flushParagraph()) return { ok: false };
      const language = trimmed.slice(3).trim();
      if (
        language.length > UNO_SAFE_MARKDOWN_LIMITS.fenceLanguageChars ||
        !FENCE_LANGUAGE_PATTERN.test(language)
      ) {
        return { ok: false };
      }
      const code: string[] = [];
      let closed = false;
      index += 1;
      while (index < lines.length) {
        const inner = lines[index] ?? "";
        if (inner.trim().startsWith("```")) {
          closed = true;
          index += 1;
          break;
        }
        code.push(inner);
        index += 1;
      }
      if (!closed) return { ok: false };
      const text = code.join("\n");
      if (isUnsafeText(text)) return { ok: false };
      blocks.push({ kind: "code", language, text });
      continue;
    }

    if (trimmed.startsWith("|") || trimmed.startsWith(">")) return { ok: false };

    const heading = /^(#{1,6})\s+(.+)$/u.exec(trimmed);
    if (heading !== null) {
      if (!flushParagraph()) return { ok: false };
      const level = (heading[1] ?? "").length;
      const text = (heading[2] ?? "").trim();
      if (level < 2 || level > 6 || isUnsafeText(text)) return { ok: false };
      blocks.push({ kind: "heading", level: level as 2 | 3 | 4 | 5 | 6, text });
      index += 1;
      continue;
    }


    const bullet = /^[-*]\s+(.+)$/u.exec(trimmed);
    const ordered = /^\d{1,9}\.\s+(.+)$/u.exec(trimmed);
    if (bullet !== null || ordered !== null) {
      if (!flushParagraph()) return { ok: false };
      const isOrdered = ordered !== null;
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = (lines[index] ?? "").trim();
        const match = isOrdered
          ? /^\d{1,9}\.\s+(.+)$/u.exec(candidate)
          : /^[-*]\s+(.+)$/u.exec(candidate);
        if (match === null) break;
        const item = (match[1] ?? "").trim();
        if (isUnsafeText(item)) return { ok: false };
        items.push(item);
        index += 1;
        if (items.length > UNO_SAFE_MARKDOWN_LIMITS.listItems) return { ok: false };
      }
      blocks.push({ kind: "list", ordered: isOrdered, items });
      continue;
    }

    if (isUnsafeText(trimmed)) return { ok: false };
    paragraph.push(trimmed);
    index += 1;
  }

  if (!flushParagraph()) return { ok: false };
  if (blocks.length === 0 || blocks.length > UNO_SAFE_MARKDOWN_LIMITS.blocks) return { ok: false };

  return { ok: true, blocks: Object.freeze(blocks.map((block) => Object.freeze(block))) };
}

/**
 * Render one parsed body.
 *
 * Every authored string becomes a React child, which React escapes, so a title or a paragraph cannot inject
 * markup even if it reaches this component unexpectedly. The component takes blocks rather than Markdown so a
 * caller must have parsed — and therefore accepted or refused — the document first.
 */
export function UnoSafeMarkdownPage({
  blocks,
}: {
  readonly blocks: readonly UnoSafeMarkdownBlock[];
}): ReactElement {
  return (
    <article className="uno-prose">
      {blocks.map((block, blockIndex) => {
        if (block.kind === "heading") {
          if (block.level === 2) return <h2 key={blockIndex}>{block.text}</h2>;
          if (block.level === 3) return <h3 key={blockIndex}>{block.text}</h3>;
          if (block.level === 4) return <h4 key={blockIndex}>{block.text}</h4>;
          if (block.level === 5) return <h5 key={blockIndex}>{block.text}</h5>;
          return <h6 key={blockIndex}>{block.text}</h6>;
        }
        if (block.kind === "code") {
          return (
            <pre key={blockIndex}>
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.kind === "list") {
          const items = block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>);
          return block.ordered ? <ol key={blockIndex}>{items}</ol> : <ul key={blockIndex}>{items}</ul>;
        }
        return <p key={blockIndex}>{block.text}</p>;
      })}
    </article>
  );
}
