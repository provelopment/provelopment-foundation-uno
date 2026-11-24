/**
 * Foundation Uno — the validated JSON Page section renderer (`UNO-WO-040 / R01`, U04).
 *
 * WHAT THIS IS. One original **server** React component that renders all twenty-two approved module IDs from a document
 * the Page-document contract has already accepted: the four layouts, the eight content modules, the four media modules,
 * the two design treatments and the four interactions. Owned media arrives as an already-resolved, server-built
 * projection; the component never reads a file, opens a socket or builds a URL of its own.
 *
 * PREFLIGHT. The component re-validates the document it is handed before emitting a single node. A document that no
 * longer validates renders **nothing at all**: there is no partial output, no "render what we can" path and no Markdown
 * rescue here. The page component decides *whether* a JSON Page may be served; this component only decides *how* an
 * already accepted document is displayed.
 *
 * SAFETY. Authored text is React text, never HTML: there is no `dangerouslySetInnerHTML`, no Markdown interpretation, no
 * inline style, no authored URL and no authored CSS. A same-document action is a real `<a href="#<section-id>">` whose
 * target the contract has already proved exists. Only three modules cross into client JavaScript, and they do so through
 * the single island: everything else is inert server markup.
 *
 * WHAT THIS IS NOT. It emits no `<main>` and no `<h1>`: the App Router page owns the single `main` landmark and the single
 * Page title, so a document can never produce a second one. It knows nothing about publication, locale, canonical URLs,
 * discovery, analytics or providers.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. The pinned Foundation GEO-03 composer
 * (`fc35a52d6cfc5f114e50470e8286a89916cde801`) was read for semantic structure only in `UNO-WO-037 / R01`. No code, class
 * name, Markdown pipeline, link resolver or Tailwind token is copied: Uno renders inert text, its own `--uno-*` palette,
 * its own same-document anchors and images served by its own bounded media route.
 */
import Image from "next/image";

import type { UnoPageMedia, UnoResolvedImage, UnoSectionMedia } from "../core/assets/uno-owned-media";
import { readUnoFamilyMarkdown, readUnoPageDocument, isUnoExternalVideoProps, type UnoContentProseBody, type UnoPageDocument, type UnoSectionNode } from "../core/page-document";
import { readUnoVideoEmbed } from "../core/video/uno-video-embeds";
import { UnoFamilyMarkdown } from "./uno-family-markdown";
import { UnoCarouselIsland, UnoExternalVideoIsland, UnoModalIsland, UnoTabsIsland } from "./uno-interaction-island";

/** The exact intrinsic heading element for each authored level; `h1` is deliberately absent. */
const HEADING_TAGS = Object.freeze({
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const);

/** The readable label of each closed contact field. Fixed Uno chrome, never authored copy. */
const CONTACT_FIELD_LABELS = Object.freeze({
  name: "Name",
  email: "Email",
  message: "Message",
} as const);

/** One validated document plus the server-resolved media its sections declared. */
export interface UnoPageSectionsProps {
  readonly document: UnoPageDocument;
  readonly media?: UnoPageMedia;
  /** UNO-WO-104 / R01: proven canonical URLs only; this component never computes one. */
  readonly routeHrefs?: ReadonlyMap<string, string>;
}

/** The resolved media of one section, or an empty record when the Page published none for it. */
function mediaOf(media: UnoPageMedia | undefined, id: string): UnoSectionMedia {
  return media?.get(id) ?? {};
}

/** One resolved figure: a real owned image with its authored alternative and optional caption. */
function MediaFigure({
  id,
  image,
  alt,
  caption,
}: {
  readonly id: string;
  readonly image: UnoResolvedImage;
  readonly alt: string;
  readonly caption: string | undefined;
}) {
  return (
    <figure className="uno-json-media" id={id}>
      <Image
        alt={alt}
        className="uno-json-media-image"
        height={image.height}
        src={image.src}
        unoptimized
        width={image.width}
      />
      {caption === undefined ? null : <figcaption className="uno-json-media-caption">{caption}</figcaption>}
    </figure>
  );
}

/** One gallery or carousel item, rendered without an `id` so an item never duplicates a section anchor. */
function MediaItemFigure({
  image,
  alt,
  caption,
}: {
  readonly image: UnoResolvedImage;
  readonly alt: string;
  readonly caption: string | undefined;
}) {
  return (
    <figure className="uno-json-media-item">
      <Image
        alt={alt}
        className="uno-json-media-image"
        height={image.height}
        src={image.src}
        unoptimized
        width={image.width}
      />
      {caption === undefined ? null : <figcaption className="uno-json-media-caption">{caption}</figcaption>}
    </figure>
  );
}

/** Render one validated section node, or nothing when the node is somehow not renderable. */
/** True when a prose body carries any donor-rich field; otherwise the original plain-text element is kept byte-exact. */
/**
 * One authored Markdown field of the rich `table`/`list` variants, parsed only when the document carries the accepted
 * Markdown form. A field the reader already refused can never reach here; `null` means "render the plain text instead".
 */
function parseFamilyMarkdown(text: string | undefined) {
  if (text === undefined) return null;
  const parsed = readUnoFamilyMarkdown(text);
  return parsed.ok ? parsed.blocks : null;
}

function isRichProseBody(body: UnoContentProseBody): boolean {
  return body.heading !== undefined || body.lede !== undefined || body.markdown === true;
}

/**
 * Render one rich `content.prose`/`callout` body in authored order: heading, lede, then body.
 *
 * A Markdown field is rendered from the accepted AST; a plain field stays one escaped paragraph. A field that does not
 * parse yields nothing rather than a partial or best-effort render, so a visitor never receives half a sentence.
 */
function ProseBodyContent({ body }: { readonly body: UnoContentProseBody }) {
  const lede = body.lede;
  const ledeParsed = body.markdown === true && lede !== undefined ? readUnoFamilyMarkdown(lede) : null;
  const textParsed = body.markdown === true ? readUnoFamilyMarkdown(body.text) : null;
  return (
    <>
      {body.heading === undefined ? null : <h2 className="uno-json-prose-heading">{body.heading}</h2>}
      {lede === undefined ? null : ledeParsed !== null && ledeParsed.ok ? (
        <UnoFamilyMarkdown blocks={ledeParsed.blocks} className="uno-json-prose-lede" />
      ) : (
        <p className="uno-json-prose-lede">{lede}</p>
      )}
      {textParsed !== null && textParsed.ok ? (
        <UnoFamilyMarkdown blocks={textParsed.blocks} className="uno-json-prose-text" />
      ) : (
        <p className="uno-json-prose-text">{body.text}</p>
      )}
    </>
  );
}

/** The closed optional presentation attributes, emitted only when the authored field is present. */
function prosePresentation(body: UnoContentProseBody): Record<string, string> {
  return {
    ...(body.align === undefined ? {} : { "data-uno-align": body.align }),
    ...(body.surface === undefined ? {} : { "data-uno-surface": body.surface }),
  };
}

function SectionNode({
  node,
  media,
  routeHrefs,
}: {
  readonly node: UnoSectionNode;
  readonly media: UnoPageMedia | undefined;
  readonly routeHrefs?: ReadonlyMap<string, string>;
}) {


  switch (node.module) {
    case "layout.stack": {
      const gap = node.props.gap ?? "normal";
      return (
        <div className="uno-json-stack" data-uno-gap={gap} id={node.id}>
          {node.children.map((child) => (
            <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} />
          ))}
        </div>
      );
    }
    case "layout.grid": {
      const semantics = node.props.itemSemantics ?? "plain";
      // `list` is a genuine native list: one `<ul>` root and one direct `<li>` per authored child, in source order.
      if (semantics === "list") {
        return (
          <ul
            className="uno-json-grid"
            data-uno-columns={node.props.columns}
            data-uno-item-semantics="list"
            data-uno-ratio={node.props.ratio}
            id={node.id}
            role="list"
          >
            {node.children.map((child) => (
              <li className="uno-json-cell" data-uno-cell-id={child.id} key={child.id}>
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} />
              </li>
            ))}
          </ul>
        );
      }
      return (
        <div
          className="uno-json-grid"
          data-uno-columns={node.props.columns}
          data-uno-item-semantics={semantics}
          data-uno-ratio={node.props.ratio}
          id={node.id}
        >
          {node.children.map((child) =>
            semantics === "article" ? (
              <article className="uno-json-card" data-uno-card-id={child.id} key={child.id}>
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} />
              </article>
            ) : (
              <div className="uno-json-cell" data-uno-cell-id={child.id} key={child.id}>
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} />
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
                  <SectionNode media={media} node={child} routeHrefs={routeHrefs} />
                </article>
              );
            }
            return (
              <div className="uno-json-tile" data-uno-tile-id={child.id} data-uno-tile-span={span} key={child.id}>
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} />
              </div>
            );
          })}
        </div>
      );
    }
    case "layout.layers": {
      const align = node.props.align ?? "start";
      // Every layer is a real, ordered child in authored DOM order. `overlap` changes stacking, never order, and the
      // stylesheet raises whichever layer currently holds focus, so a covered control is never unreachable by keyboard.
      return (
        <div
          className="uno-json-layers"
          data-uno-align={align}
          data-uno-mode={node.props.mode}
          id={node.id}
        >
          {node.children.map((child) => (
            <div className="uno-json-layer" data-uno-layer-id={child.id} key={child.id}>
              <SectionNode media={media} node={child} routeHrefs={routeHrefs} />
            </div>
          ))}
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
    case "content.prose": {
      const prose = node.props;
      // Exactly four validated presentation variants; the legacy `{text}` form keeps its original `<p>` output.
      if (prose.variant === "divider") return <hr className="uno-json-divider" id={node.id} />;
      if (prose.variant === "table") {
        const captionParsed = prose.markdown === true ? parseFamilyMarkdown(prose.caption) : null;
        const table = (
          <table className="uno-json-table">
            {prose.caption === undefined ? null : captionParsed === null ? (
              <caption>{prose.caption}</caption>
            ) : (
              <caption>
                <UnoFamilyMarkdown blocks={captionParsed} className="uno-json-table-caption" />
              </caption>
            )}
            <thead>
              <tr>
                {prose.columns.map((column, columnIndex) => (
                  <th key={columnIndex} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prose.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
        // `UNO-WO-102 / R01`: an authored lede or surface frames the same native table; with neither, the exact
        // previously committed scroll wrapper is returned unchanged.
        if (prose.lede === undefined && prose.surface === undefined && prose.markdown !== true) {
          return (
            <div className="uno-json-table-scroll" id={node.id} tabIndex={0}>
              {table}
            </div>
          );
        }
        const ledeParsed = prose.markdown === true ? parseFamilyMarkdown(prose.lede) : null;
        return (
          <section className="uno-json-table-section" id={node.id} data-uno-surface={prose.surface}>
            {ledeParsed === null ? null : (
              <UnoFamilyMarkdown blocks={ledeParsed} className="uno-json-table-lede" />
            )}
            <div className="uno-json-table-scroll" tabIndex={0}>
              {table}
            </div>
          </section>
        );
      }
      if (prose.variant === "list") {
        const ListTag = prose.ordered === true ? "ol" : "ul";
        const list = (
          <ListTag className="uno-json-list">
            {prose.items.map((item, itemIndex) => {
              const detailParsed = prose.markdown === true ? parseFamilyMarkdown(item.detail) : null;
              // `UNO-WO-103 / R01`: a proven-classifier `href` becomes one ordinary anchor; a declared but inactive
              // application `linkId` renders as inert label text — never an anchor, key, URL or request.
              const href = "href" in item ? item.href : undefined;
              // `UNO-WO-104 / R01`: render a route anchor only through a server-proven projection.
              const routeHref = "routeTarget" in item ? routeHrefs?.get(`${node.id}:${itemIndex}`) : undefined;
              const resolvedHref = href ?? routeHref;
              const inert = "linkId" in item || ("routeTarget" in item && routeHref === undefined);
              return (
                <li key={itemIndex}>
                  {resolvedHref === undefined ? (
                    <span className={inert ? "uno-json-list-application-label" : undefined}>{item.label}</span>
                  ) : (
                    <a className="uno-json-list-link" href={resolvedHref} rel="noreferrer noopener">
                      {item.label}
                    </a>
                  )}
                  {item.detail === undefined ? null : detailParsed === null ? (
                    <p>{item.detail}</p>
                  ) : (
                    <UnoFamilyMarkdown blocks={detailParsed} className="uno-json-list-detail" />
                  )}
                </li>
              );
            })}
          </ListTag>
        );
        if (prose.lede === undefined && prose.surface === undefined && prose.markdown !== true) {
          return (
            <ListTag className="uno-json-list" id={node.id}>
              {list.props.children}
            </ListTag>
          );
        }
        const ledeParsed = prose.markdown === true ? parseFamilyMarkdown(prose.lede) : null;
        return (
          <section className="uno-json-list-section" id={node.id} data-uno-surface={prose.surface}>
            {ledeParsed === null ? null : (
              <UnoFamilyMarkdown blocks={ledeParsed} className="uno-json-list-lede" />
            )}
            {list}
          </section>
        );
      }
      if (prose.variant === "callout") {
        // The donor's heading and lede sit inside the accent; when nothing rich is authored the original notice is kept.
        return (
          <section
            className="uno-json-callout"
            data-uno-tone={prose.tone ?? "note"}
            id={node.id}
            {...prosePresentation(prose)}
          >
            {isRichProseBody(prose) ? <ProseBodyContent body={prose} /> : <p>{prose.text}</p>}
          </section>
        );
      }
      if (isRichProseBody(prose)) {
        return (
          <section className="uno-json-prose" id={node.id} {...prosePresentation(prose)}>
            <ProseBodyContent body={prose} />
          </section>
        );
      }
      return (
        <p className="uno-json-prose" id={node.id}>
          {prose.text}
        </p>
      );
    }
    case "content.actions":
      return (
        <ul className="uno-json-actions" id={node.id}>
          {node.props.items.map((item, index) => (
            <li
              className="uno-json-action-item"
              key={`${"targetId" in item ? item.targetId : item.href}:${index}`}
            >
              {/* `UNO-WO-081 / R01`: a fragment entry keeps its exact previous anchor; an outbound entry is an ordinary
                  inert server-rendered link. No target, no script, no prefetch, no probe — the Visitor decides. */}
              {"targetId" in item ? (
                <a className="uno-json-action" href={`#${item.targetId}`}>
                  {item.label}
                </a>
              ) : (
                <a
                  className="uno-json-action"
                  href={item.href}
                  {...(/^https:/iu.test(item.href)
                    ? { rel: "noopener noreferrer", referrerPolicy: "no-referrer" as const }
                    : {})}
                >
                  {item.label}
                </a>
              )}
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
      const { items, heading, level, surface, itemHeadingLevel } = node.props;
      const Tag = level === undefined ? null : HEADING_TAGS[level];
      // `UNO-WO-080 / R01`: only an explicitly authored literal `3` turns the milestone title into a heading; every
      // timeline authored before that switch keeps the original `<p>` unchanged.
      const TitleTag = itemHeadingLevel === 3 ? "h3" : "p";
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
                <TitleTag className="uno-json-timeline-title">{item.title}</TitleTag>
                {item.description === undefined ? null : (
                  <p className="uno-json-timeline-description">{item.description}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      );
    }

    case "media.image": {
      const resolved = mediaOf(media, node.id).image;
      // Serving already refused the Page when a declared asset was unreadable, so an unresolved image here means the
      // document changed after acceptance; rendering nothing is the honest outcome.
      if (resolved === undefined) return null;
      return <MediaFigure alt={node.props.alt} caption={node.props.caption} id={node.id} image={resolved} />;
    }
    case "media.video": {
      if (isUnoExternalVideoProps(node.props)) {
        // The destination is constructed only by the pure provider policy. Acceptance already proved it valid, so a
        // refusal here means the document changed after acceptance — render nothing rather than an unvalidated frame.
        const embed = readUnoVideoEmbed({
          provider: node.props.provider,
          videoId: node.props.videoId,
          ...(node.props.privacyHash === undefined ? {} : { vimeoHash: node.props.privacyHash }),
        });
        if (!embed.ok) return null;
        return (
          <figure className="uno-json-media uno-json-video-external" id={node.id}>
            <UnoExternalVideoIsland
              description={node.props.description}
              embedUrl={embed.projection.embedUrl}
              externalFallbackUrl={embed.projection.externalFallbackUrl}
              id={node.id}
              provider={embed.projection.provider}
              providerLabel={embed.projection.providerLabel}
              title={node.props.title}
            />
          </figure>
        );
      }
      const resolved = mediaOf(media, node.id);
      if (resolved.video === undefined || resolved.captions === undefined) return null;
      return (
        <figure className="uno-json-media uno-json-video" id={node.id}>
          <video
            aria-label={node.props.title}
            className="uno-json-video-player"
            controls
            playsInline
            poster={resolved.poster?.src}
            preload="metadata"
          >
            <source src={resolved.video.src} type={resolved.video.type} />
            {/* A required, owned caption track: the video is never published without one. */}
            <track default kind="captions" label="Captions" src={resolved.captions.src} srcLang="en" />
          </video>
          {node.props.description === undefined ? null : (
            <figcaption className="uno-json-media-caption">{node.props.description}</figcaption>
          )}
        </figure>
      );
    }
    case "media.gallery": {
      const resolved = mediaOf(media, node.id).items;
      if (resolved === undefined || resolved.length !== node.props.items.length) return null;
      return (
        <div className="uno-json-gallery" data-uno-columns={node.props.columns} id={node.id}>
          {node.props.items.map((item, index) => {
            const image = resolved[index];
            if (image === undefined) return null;
            return (
              <MediaItemFigure alt={item.alt} caption={item.caption} image={image} key={`${item.alt}:${index}`} />
            );
          })}
        </div>
      );
    }
    case "media.carousel": {
      const resolved = mediaOf(media, node.id).items;
      if (resolved === undefined || resolved.length !== node.props.items.length) return null;
      // Every item is server-rendered here; the island only chooses which one is on stage and never sees a URL.
      const figures = node.props.items.map((item, index) => {
        const image = resolved[index];
        if (image === undefined) return null;
        return <MediaItemFigure alt={item.alt} caption={item.caption} image={image} key={`${item.alt}:${index}`} />;
      });
      return (
        <UnoCarouselIsland
          count={node.props.items.length}
          id={node.id}
          items={figures}
          label={node.props.label}
        />
      );
    }

    case "design.watermark": {
      // Decorative by contract: hidden from assistive technology, inert to pointer and focus, and never a replacement
      // for the content it sits behind.
      return (
        <div className="uno-json-watermark-wrap" id={node.id}>
          <p
            aria-hidden="true"
            className="uno-json-watermark"
            data-uno-align={node.props.align ?? "center"}
            data-uno-strength={node.props.strength ?? "subtle"}
          >
            {node.props.text}
          </p>
        </div>
      );
    }
    case "design.motion": {
      // The wrapped content is always rendered in its final, readable state; the effect is a stylesheet transition that
      // `prefers-reduced-motion: reduce` removes entirely, so nothing is ever hidden behind an animation.
      return (
        <div
          className="uno-json-motion"
          data-uno-effect={node.props.effect}
          data-uno-speed={node.props.speed ?? "normal"}
          id={node.id}
        >
          {node.children.map((child) => (
            <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} />
          ))}
        </div>
      );
    }
    case "interaction.tabs": {
      const panels = node.children.map((child) => <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} />);
      return <UnoTabsIsland id={node.id} label={node.props.label} panels={panels} tabs={node.props.tabs} />;
    }
    case "interaction.accordion": {
      // Native `<details>`/`<summary>`: keyboard behaviour, expanded state and the disclosure roles are the platform's,
      // and each disclosure opens independently of the others.
      // `UNO-WO-080 / R01`: only an explicitly authored literal `3` wraps the label in one level-3 heading inside its
      // own `<summary>`; an accordion authored before that switch keeps its plain summary text byte-identically.
      const summaryHeadingLevel = node.props.summaryHeadingLevel;
      return (
        <div className="uno-json-accordion" id={node.id}>
          {node.children.map((child, index) => (
            <details className="uno-json-disclosure" key={child.id}>
              <summary className="uno-json-disclosure-summary">
                {summaryHeadingLevel === 3 ? (
                  <h3>{node.props.items[index]?.label}</h3>
                ) : (
                  node.props.items[index]?.label
                )}
              </summary>
              <div className="uno-json-disclosure-body">
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} />
              </div>
            </details>
          ))}
        </div>
      );
    }

    case "interaction.modal": {
      const content = node.children.map((child) => <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} />);
      return (
        <UnoModalIsland
          closeLabel={node.props.closeLabel}
          id={node.id}
          title={node.props.title}
          triggerLabel={node.props.triggerLabel}
        >
          {content}
        </UnoModalIsland>
      );
    }
    case "interaction.contact": {
      const { heading, description, fields, submitLabel } = node.props;
      const headingId = `${node.id}-title`;
      const selected = fields ?? [];
      return (
        <section
          aria-labelledby={heading === undefined ? undefined : headingId}
          className="uno-json-contact"
          id={node.id}
        >
          {heading === undefined ? null : (
            <p className="uno-json-contact-heading" id={headingId}>
              {heading}
            </p>
          )}
          {description === undefined ? null : (
            <p className="uno-json-contact-description">{description}</p>
          )}
          {/*
            The honest delivery-OFF state is stated in the Page itself. There is no `<form>`, no action, no handler and
            no transport anywhere in this module, so "not sent" is a structural fact rather than a promise.
          */}
          <p className="uno-json-contact-status">Delivery is switched off. Nothing entered here is sent or stored.</p>
          {selected.length === 0 ? null : (
            <div className="uno-json-contact-fields">
              {selected.map((field) => (
                <div className="uno-json-contact-field" key={field}>
                  <label className="uno-json-contact-label" htmlFor={`${node.id}-${field}`}>
                    {CONTACT_FIELD_LABELS[field]}
                  </label>
                  {field === "message" ? (
                    <textarea
                      className="uno-json-contact-input"
                      id={`${node.id}-${field}`}
                      readOnly
                      rows={4}
                    />
                  ) : (
                    <input
                      className="uno-json-contact-input"
                      id={`${node.id}-${field}`}
                      readOnly
                      type={field === "email" ? "email" : "text"}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {submitLabel === undefined ? null : (
            <button className="uno-json-contact-submit" disabled type="button">
              {submitLabel}
            </button>
          )}
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
 * The sections are wrapped in one `div` so the App Router page keeps its own `main` and heading structure. An invalid
 * document — which the serving gate should already have refused — renders nothing rather than a partial Page.
 */
export function UnoPageSections({ document, media, routeHrefs }: UnoPageSectionsProps) {
  const validated = readUnoPageDocument(document);
  if (!validated.accepted) return null;

  return (
    <div className="uno-json" data-uno-document-version={validated.document.version}>
      {validated.document.sections.map((section) => (
        <SectionNode key={section.id} media={media} node={section} routeHrefs={routeHrefs} />
      ))}
    </div>
  );
}
