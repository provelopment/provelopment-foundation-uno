/**
 * Foundation Uno — React rendering of the bounded family Markdown AST (`UNO-WO-084 / R01`, checkpoint A1, U04).
 *
 * WHAT THIS IS. A pure, server-only renderer for `readUnoFamilyMarkdown` output. Every fragment arrives from the closed
 * AST as a text node or one of five approved elements, so nothing here needs to sanitise a string: authored text can never
 * become markup, an attribute, a style, a URL or a script.
 *
 * WHAT IT REFUSES. There is no `dangerouslySetInnerHTML`, no raw HTML pass, no remote fetch, no client directive, no
 * provider and no destination rewriting. A link is emitted only for the `mailto`/`https` categories the parser already
 * classified, and its `href` is the exact accepted string.
 */
import type { ReactElement, ReactNode } from "react";

import type { UnoFamilyBlock, UnoFamilyInline } from "../core/page-document";

/** Render one inline run as React text and approved inline elements. */
function renderInline(nodes: readonly UnoFamilyInline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-i${index}`;
    if (node.kind === "text") return node.text;
    if (node.kind === "code") {
      return (
        <code className="uno-family-md-code" key={key}>
          {node.text}
        </code>
      );
    }
    if (node.kind === "strong") {
      return (
        <strong key={key} className="uno-family-md-strong">
          {renderInline(node.children, key)}
        </strong>
      );
    }
    if (node.kind === "em") {
      return (
        <em key={key} className="uno-family-md-em">
          {renderInline(node.children, key)}
        </em>
      );
    }
    return (
      <a
        className="uno-family-md-link"
        href={node.href}
        key={key}
        {...(node.category === "https" ? { rel: "noopener noreferrer" } : {})}
      >
        {renderInline(node.children, key)}
      </a>
    );
  });
}

/** Render one block as its native element. */
function renderBlock(block: UnoFamilyBlock, index: number): ReactElement {
  const key = `b${index}`;
  if (block.kind === "heading") {
    const Tag = `h${block.level}` as "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Tag className="uno-family-md-heading" key={key}>
        {renderInline(block.children, key)}
      </Tag>
    );
  }
  if (block.kind === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag className="uno-family-md-list" key={key}>
        {block.items.map((item, itemIndex) => (
          <li key={`${key}-l${itemIndex}`}>{renderInline(item, `${key}-l${itemIndex}`)}</li>
        ))}
      </ListTag>
    );
  }
  if (block.kind === "code") {
    return (
      <pre className="uno-family-md-pre" key={key}>
        <code className={block.language.length === 0 ? undefined : `language-${block.language}`}>
          {block.text}
        </code>
      </pre>
    );
  }
  return (
    <p className="uno-family-md-paragraph" key={key}>
      {renderInline(block.children, key)}
    </p>
  );
}

/** Render one already-accepted Markdown field. */
export function UnoFamilyMarkdown({
  blocks,
  className,
}: {
  readonly blocks: readonly UnoFamilyBlock[];
  readonly className?: string;
}): ReactElement {
  return (
    <div className={className === undefined ? "uno-family-md" : `uno-family-md ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
