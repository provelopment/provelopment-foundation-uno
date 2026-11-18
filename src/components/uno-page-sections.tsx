/**
 * Foundation Uno — the validated JSON Page section renderer (`UNO-WO-035 / R01`, U04).
 *
 * WHAT THIS IS. One original **server** React component that renders the eleven module IDs this execution
 * implements — `layout.stack`, `layout.grid`, `layout.bento`, `content.heading`, `content.prose`, `content.actions`,
 * `content.hero`, `content.stats`, `content.testimonials`, `content.pricing`, `content.timeline` — from a document
 * that the Page-document contract has already accepted.
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
 * (`fc35a52d6cfc5f114e50470e8286a89916cde801`) and the audited `hero`, `stats` and `quote` section implementations
 * were read for their semantic structure only (`UNO-WO-037 / R01`). No code, class name, Markdown pipeline, link
 * resolver or Tailwind token is copied: Uno renders inert text, its own `--uno-*` palette and same-document anchors.
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
    case "layout.bento": {
      const semantics = node.props.itemSemantics ?? "plain";
      // One wrapper per authored child in authored order: DOM order is the reading and keyboard order, so no span
      // may ever reorder it, and the span is a styling hook only.
      return (
        <div
          className="uno-json-bento"
          data-uno-columns={node.props.columns}
          data-uno-item-semantics={semantics}
          id={node.id}
        >
          {node.children.map((child, index) => {
            const span = node.props.tiles[index]?.span ?? "standard";
            if (semantics === "article") {
              return (
                <article
                  className="uno-json-tile"
                  data-uno-tile-id={child.id}
                  data-uno-tile-span={span}
                  key={child.id}
                >
                  <SectionNode node={child} />
                </article>
              );
            }
            return (
              <div className="uno-json-tile" data-uno-tile-id={child.id} data-uno-tile-span={span} key={child.id}>
                <SectionNode node={child} />
              </div>
            );
          })}
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
    case "content.hero": {
      const { eyebrow, lede, support, align, surface, actions } = node.props;
      return (
        <section
          className="uno-json-hero"
          data-uno-align={align ?? "start"}
          data-uno-surface={surface ?? "plain"}
          id={node.id}
        >
          {eyebrow === undefined ? null : <p className="uno-json-eyebrow">{eyebrow}</p>}
          {lede === undefined ? null : <p className="uno-json-hero-lede">{lede}</p>}
          {actions === undefined ? null : (
            <ul className="uno-json-actions uno-json-hero-actions">
              {actions.map((item, index) => (
                <li className="uno-json-action-item" key={`${item.targetId}:${index}`}>
                  <a className="uno-json-action" href={`#${item.targetId}`}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {support === undefined ? null : <p className="uno-json-hero-support">{support}</p>}
        </section>
      );
    }
    case "content.stats": {
      const { items, heading, level, surface } = node.props;
      const Tag = level === undefined ? null : HEADING_TAGS[level];
      const headingId = `${node.id}-title`;
      return (
        <section
          className="uno-json-stats"
          data-uno-surface={surface ?? "plain"}
          aria-labelledby={Tag === null ? undefined : headingId}
          id={node.id}
        >
          {Tag === null ? null : (
            <Tag className="uno-json-stats-heading" id={headingId}>
              {heading}
            </Tag>
          )}
          <dl className="uno-json-stats-list">
            {items.map((item, index) => (
              <div className="uno-json-stat" key={`${item.label}:${index}`}>
                <dt className="uno-json-stat-label">{item.label}</dt>
                <dd className="uno-json-stat-value">
                  {item.value}
                  {item.detail === undefined ? null : (
                    <span className="uno-json-stat-detail">{item.detail}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }
    case "content.testimonials": {
      const { items, align, surface } = node.props;
      return (
        <section
          className="uno-json-testimonials"
          data-uno-align={align ?? "start"}
          data-uno-surface={surface ?? "plain"}
          id={node.id}
        >
          {items.map((item, index) => (
            <figure className="uno-json-testimonial" key={`${item.quote}:${index}`}>
              <blockquote className="uno-json-testimonial-quote">{item.quote}</blockquote>
              {item.attribution === undefined && item.role === undefined ? null : (
                <figcaption className="uno-json-testimonial-caption">
                  {item.attribution === undefined ? null : (
                    <span className="uno-json-testimonial-attribution">{item.attribution}</span>
                  )}
                  {item.role === undefined ? null : (
                    <span className="uno-json-testimonial-role">{item.role}</span>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </section>
      );
    }
    case "content.pricing": {
      const { items, heading, level, surface } = node.props;
      const Tag = level === undefined ? null : HEADING_TAGS[level];
      const headingId = `${node.id}-title`;
      return (
        <section
          className="uno-json-pricing"
          data-uno-surface={surface ?? "plain"}
          aria-labelledby={Tag === null ? undefined : headingId}
          id={node.id}
        >
          {Tag === null ? null : (
            <Tag className="uno-json-pricing-heading" id={headingId}>
              {heading}
            </Tag>
          )}
          <ul className="uno-json-price-list">
            {items.map((item, index) => (
              <li
                className="uno-json-price"
                data-uno-featured={item.featured === true ? "true" : undefined}
                key={`${item.label}:${index}`}
              >
                <p className="uno-json-price-label">{item.label}</p>
                {/* The amount is authored text, printed exactly as written: no currency, total or offer is derived. */}
                <p className="uno-json-price-amount">
                  <span className="uno-json-price-value">{item.amount}</span>
                  {item.unit === undefined ? null : <span className="uno-json-price-unit">{item.unit}</span>}
                </p>
                {item.description === undefined ? null : (
                  <p className="uno-json-price-description">{item.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case "content.timeline": {
      const { items, heading, level, surface } = node.props;
      const Tag = level === undefined ? null : HEADING_TAGS[level];
      const headingId = `${node.id}-title`;
      return (
        <section
          className="uno-json-timeline"
          data-uno-surface={surface ?? "plain"}
          aria-labelledby={Tag === null ? undefined : headingId}
          id={node.id}
        >
          {Tag === null ? null : (
            <Tag className="uno-json-timeline-heading" id={headingId}>
              {heading}
            </Tag>
          )}
          <ol className="uno-json-timeline-list">
            {items.map((item, index) => (
              <li
                className="uno-json-timeline-item"
                // Only an explicitly authored `current` milestone is announced as the current step. An unauthored or
                // non-current milestone carries no `aria-current` at all rather than an invented one.
                aria-current={item.status === "current" ? "step" : undefined}
                data-uno-status={item.status}
                key={`${item.title}:${index}`}
              >
                {/* Decorative marker: it repeats nothing, and the ordered list already narrates position. */}
                <span aria-hidden="true" className="uno-json-timeline-marker" />
                {item.dateLabel === undefined ? null : (
                  <span className="uno-json-timeline-date">{item.dateLabel}</span>
                )}
                <p className="uno-json-timeline-title">{item.title}</p>
                {item.description === undefined ? null : (
                  <p className="uno-json-timeline-description">{item.description}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      );
    }
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
