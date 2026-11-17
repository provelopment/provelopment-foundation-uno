/**
 * Foundation Uno — the validated JSON Page section renderer (`UNO-WO-035 / R01`, U04).
 *
 * WHAT THIS IS. One original **server** React component that renders the five module IDs this execution
 * implements — `layout.stack`, `layout.grid`, `content.heading`, `content.prose`, `content.actions` — from a
 * document that the Page-document contract has already accepted.
 *
 * PREFLIGHT. The component re-validates the document it is handed before emitting a single node. A document that
 * no longer validates renders **nothing at all**: there is no partial output, no "render what we can" path and no
 * Markdown rescue here. The page component decides *whether* a JSON Page may be served; this component only
 * decides *how* an already accepted document is displayed.
 *
 * SAFETY. Authored text is React text, never HTML: there is no `dangerouslySetInnerHTML`, no Markdown
 * interpretation, no inline style, no authored URL and no `use client`. A same-document action is rendered as a
 * real `<a href="#<section-id>">` whose target the contract has already proved exists in this document. Nothing
 * here is interactive state, so this slice adds no client JavaScript and no hydration boundary.
 *
 * WHAT THIS IS NOT. It emits no `<main>` and no `<h1>`: the App Router page owns the single `main` landmark and
 * the single Page title, so a document can never produce a second one. It knows nothing about publication,
 * locale, canonical URLs, discovery, analytics or providers.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. The pinned Foundation GEO-03 composer
 * (`fc35a52d6cfc5f114e50470e8286a89916cde801`) was read for comprehension only; no code, markup or class name is
 * copied, and the family composition layer remains a later U04 obligation.
 */
import {
  readUnoPageDocument,
  type UnoPageDocument,
  type UnoSectionNode,
} from "../core/page-document";

/** The exact intrinsic heading element for each authored level; `h1` is deliberately absent. */
const HEADING_TAGS = Object.freeze({
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const);

/** One validated document. The type says "validated"; the component still re-checks at runtime. */
export interface UnoPageSectionsProps {
  readonly document: UnoPageDocument;
}

/** Render one validated section node, or nothing when the node is somehow not renderable. */
function SectionNode({ node }: { readonly node: UnoSectionNode }) {
  switch (node.module) {
    case "layout.stack": {
      const gap = node.props.gap ?? "normal";
      return (
        <div className="uno-json-stack" data-uno-gap={gap} id={node.id}>
          {node.children.map((child) => (
            <SectionNode key={child.id} node={child} />
          ))}
        </div>
      );
    }
    case "layout.grid": {
      const semantics = node.props.itemSemantics ?? "plain";
      return (
        <div
          className="uno-json-grid"
          data-uno-columns={node.props.columns}
          data-uno-item-semantics={semantics}
          id={node.id}
        >
          {node.children.map((child) =>
            semantics === "article" ? (
              <article className="uno-json-card" data-uno-card-id={child.id} key={child.id}>
                <SectionNode node={child} />
              </article>
            ) : (
              <div className="uno-json-cell" data-uno-cell-id={child.id} key={child.id}>
                <SectionNode node={child} />
              </div>
            ),
          )}
        </div>
      );
    }
    case "content.heading": {
      const Tag = HEADING_TAGS[node.props.level];
      return (
        <Tag className="uno-json-heading" id={node.id}>
          {node.props.text}
        </Tag>
      );
    }
    case "content.prose":
      return (
        <p className="uno-json-prose" id={node.id}>
          {node.props.text}
        </p>
      );
    case "content.actions":
      return (
        <ul className="uno-json-actions" id={node.id}>
          {node.props.items.map((item, index) => (
            <li className="uno-json-action-item" key={`${item.targetId}:${index}`}>
              <a className="uno-json-action" href={`#${item.targetId}`}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      );
    default: {
      // Exhaustive: every renderable literal is handled above, so `node` is `never` here.
      const unreachable: never = node;
      void unreachable;
      return null;
    }
  }
}

/**
 * Render an accepted JSON Page document.
 *
 * The sections are wrapped in one `div` so the App Router page keeps its own `main` and heading structure. An
 * invalid document — which the serving gate should already have refused — renders nothing rather than a partial
 * Page.
 */
export function UnoPageSections({ document }: UnoPageSectionsProps) {
  const validated = readUnoPageDocument(document);
  if (!validated.accepted) return null;

  return (
    <div className="uno-json" data-uno-document-version={validated.document.version}>
      {validated.document.sections.map((section) => (
        <SectionNode key={section.id} node={section} />
      ))}
    </div>
  );
}
