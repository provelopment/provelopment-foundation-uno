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
import { readUnoFamilyMarkdown, readUnoPageDocument, isUnoExternalVideoProps, isUnoLayoutGridCards, isUnoLayoutGridFeatures, type UnoContentProseBody, type UnoPageDocument, type UnoSectionNode } from "../core/page-document";
import { readUnoVideoEmbed } from "../core/video/uno-video-embeds";
import { UnoFamilyMarkdown } from "./uno-family-markdown";
import { UnoCarouselIsland, UnoContactForm, UnoExternalVideoIsland, UnoModalIsland, UnoTabsIsland } from "./uno-interaction-island";

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
  /**
   * `U05`: true only when the server holds a validated contact webhook configuration. It gates the one live form, so with
   * delivery off (the shipped state) the contact module keeps rendering its inert, honest notice.
   */
  readonly contactDelivery?: boolean;
}

/** The resolved media of one section, or an empty record when the Page published none for it. */
function mediaOf(media: UnoPageMedia | undefined, id: string): UnoSectionMedia {
  return media?.get(id) ?? {};
}

/**
 * One resolved figure: a real owned image with its authored alternative and optional caption.
 *
 * `UNO-WO-120 / R01`: a caption the document declared as Markdown is drawn from the same accepted AST the rest of the family
 * uses, inside the same owning `figcaption`; a plain caption stays one escaped string. A caption that no longer parses renders
 * no caption text rather than half a sentence.
 */
function MediaFigure({
  id,
  image,
  alt,
  caption,
  markdown,
}: {
  readonly id: string;
  readonly image: UnoResolvedImage;
  readonly alt: string;
  readonly caption: string | undefined;
  readonly markdown?: true;
}) {
  const parsed = markdown === true && caption !== undefined ? readUnoFamilyMarkdown(caption) : null;
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
      {caption === undefined ? null : (
        <figcaption className="uno-json-media-caption">
          {parsed !== null && parsed.ok ? (
            <UnoFamilyMarkdown blocks={parsed.blocks} className="uno-json-media-caption-body" />
          ) : parsed === null ? (
            caption
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}

/** One gallery or carousel item, rendered without an `id` so an item never duplicates a section anchor. */
function MediaItemFigure({
  image,
  alt,
  caption,
  markdown,
}: {
  readonly image: UnoResolvedImage;
  readonly alt: string;
  readonly caption: string | undefined;
  /**
   * `UNO-WO-121 / R01`: true only for an item whose caption was declared as the donor's Markdown-capable form. The parsed AST
   * is rendered when it is accepted, and the authored text is otherwise emitted as one escaped node — never a partial render.
   */
  readonly markdown?: boolean;
}) {
  const parsed = markdown === true ? parseFamilyMarkdown(caption) : null;
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
      {caption === undefined ? null : parsed !== null ? (
        <figcaption className="uno-json-media-caption">
          <UnoFamilyMarkdown blocks={parsed} className="uno-json-media-caption-body" />
        </figcaption>
      ) : (
        <figcaption className="uno-json-media-caption">{caption}</figcaption>
      )}
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
  contactDelivery = false,
}: {
  readonly node: UnoSectionNode;
  readonly media: UnoPageMedia | undefined;
  readonly routeHrefs?: ReadonlyMap<string, string>;
  /** `U05`: true only when a validated webhook exists, so a contact module can render its real form. */
  readonly contactDelivery?: boolean;
}) {


  switch (node.module) {
    case "layout.stack": {
      const gap = node.props.gap ?? "normal";
      return (
        <div
          className="uno-json-stack"
          data-uno-gap={gap}
          data-uno-position={node.props.position}
          data-uno-surface={node.props.surface}
          id={node.id}
        >
          {node.children.map((child) => (
            <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
          ))}
        </div>
      );
    }
    case "layout.grid": {
      // `UNO-WO-122 / R04`: the native closed opt-in **text-only** cards grid. One native `<ul>` whose every direct `<li>` is one
      // card in the donor's own shipped treatment (`.uno-json-card`: bordered, padded, rounded), carrying its own meta line,
      // title and body in the authored order, beneath only the authored heading and lede. Nothing is manufactured: an absent
      // field emits no element, and the deferred image/action capabilities have no key, so nothing can be drawn that the
      // document did not author.
      // `UNO-WO-125 / R02`: the native features representation is its own presentation — icon-led, border-free units in one list —
      // never a bordered card. The icon is decorative by contract, so it is rendered with the exactly empty alternative and is
      // hidden from assistive technology; the title states the item and its own heading level follows the authored section outline.
      if (isUnoLayoutGridFeatures(node.props)) {
        const { features, columns, heading, level, lede, ledeMarkdown, surface } = node.props;
        const Tag = level === undefined ? null : HEADING_TAGS[level];
        const itemLevel = (level === undefined ? 2 : Math.min(level + 1, 6)) as 2 | 3 | 4 | 5 | 6;
        const ItemTag = HEADING_TAGS[itemLevel];
        const ledeParsed = ledeMarkdown === true ? parseFamilyMarkdown(lede) : null;
        // `UNO-WO-125 / R02`: this section's own server-resolved icon projection, indexed by feature position. A feature without an
        // authored icon has no entry and therefore emits no image element at all.
        const images = mediaOf(media, node.id).items;
        return (
          <div className="uno-json-features-section" data-uno-surface={surface} id={node.id}>
            {Tag === null || heading === undefined ? null : (
              <Tag className="uno-json-heading" id={`${node.id}-heading`}>
                {heading}
              </Tag>
            )}
            {lede === undefined ? null : ledeParsed === null ? (
              <p className="uno-json-features-lede">{lede}</p>
            ) : (
              <UnoFamilyMarkdown blocks={ledeParsed} className="uno-json-features-lede" />
            )}
            <ul className="uno-json-features" data-uno-columns={columns} id={`${node.id}-list`} role="list">
              {features.map((feature, index) => {
                const bodyParsed = feature.bodyMarkdown === true ? parseFamilyMarkdown(feature.body) : null;
                const icon = images?.[index];
                return (
                  <li className="uno-json-feature" key={`${feature.title}:${index}`}>
                    {icon === undefined ? null : (
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="uno-json-feature-icon"
                        height={icon.height}
                        src={icon.src}
                        unoptimized
                        width={icon.width}
                      />
                    )}
                    <ItemTag className="uno-json-feature-title">{feature.title}</ItemTag>
                    {feature.body === undefined ? null : bodyParsed !== null ? (
                      <UnoFamilyMarkdown blocks={bodyParsed} className="uno-json-feature-body" />
                    ) : (
                      <p className="uno-json-feature-body">{feature.body}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      if (isUnoLayoutGridCards(node.props)) {
        const { cards, columns, heading, level, lede, ledeMarkdown, surface } = node.props;
        const Tag = level === undefined ? null : HEADING_TAGS[level];
        // The donor item title is level 3 beneath an authored section heading and level 2 without one — the accepted outline
        // adaptation for a heading-less cards section.
        const ItemTag = HEADING_TAGS[(level === undefined ? 2 : Math.min(6, level + 1)) as 2 | 3 | 4 | 5 | 6];
        const ledeParsed = ledeMarkdown === true ? parseFamilyMarkdown(lede) : null;
        // `UNO-WO-124 / R01`: the server-resolved projection of this section's own card images, indexed by card position. A card
        // that authored no image has no entry here and therefore emits no element at all.
        const images = mediaOf(media, node.id).items;
        return (
          <div className="uno-json-cards-section" data-uno-surface={surface} id={node.id}>
            {Tag === null || heading === undefined ? null : (
              <Tag className="uno-json-heading" id={`${node.id}-heading`}>
                {heading}
              </Tag>
            )}
            {lede === undefined ? null : ledeParsed !== null ? (
              <section className="uno-json-prose" id={`${node.id}-lede`}>
                <UnoFamilyMarkdown blocks={ledeParsed} className="uno-json-cards-lede" />
              </section>
            ) : (
              <p className="uno-json-prose" id={`${node.id}-lede`}>
                {lede}
              </p>
            )}
            <ul className="uno-json-cards" data-uno-columns={columns} id={`${node.id}-list`} role="list">
              {cards.map((card, index) => {
                const bodyParsed = card.bodyMarkdown === true ? parseFamilyMarkdown(card.body) : null;
                const image = images?.[index];
                return (
                  <li className="uno-json-card" key={`${card.title}:${index}`}>
                    {image === undefined ? null : (
                      <Image
                        alt={card.alt ?? ""}
                        className="uno-json-card-image"
                        height={image.height}
                        src={image.src}
                        unoptimized
                        width={image.width}
                      />
                    )}
                    {card.meta === undefined ? null : <p className="uno-json-card-meta">{card.meta}</p>}
                    <ItemTag className="uno-json-heading">{card.title}</ItemTag>
                    {card.body === undefined ? null : bodyParsed !== null ? (
                      <UnoFamilyMarkdown blocks={bodyParsed} className="uno-json-card-body" />
                    ) : (
                      <p className="uno-json-card-body">{card.body}</p>
                    )}
                    {card.action === undefined ? null : (
                      // `UNO-WO-124 / R07`: the card's own single action is one ordinary anchor to an already-classified static
                      // destination — never a button, never a fragment, never an inline handler. Its closed variant is a
                      // presentation attribute, and the anchor is keyboard-reachable and visibly focused by the stylesheet.
                      <a
                        className="uno-json-card-action"
                        data-uno-variant={card.action.variant ?? "primary"}
                        href={card.action.href}
                        rel="noreferrer noopener"
                      >
                        {card.action.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      // The ordinary native grid is the child-bearing shape; a cards grid returned above and never reaches this line.
      if (!("children" in node)) return null;
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
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
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
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
              </article>
            ) : (
              <div className="uno-json-cell" data-uno-cell-id={child.id} key={child.id}>
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
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
                  <SectionNode media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
                </article>
              );
            }
            return (
              <div className="uno-json-tile" data-uno-tile-id={child.id} data-uno-tile-span={span} key={child.id}>
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
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
              <SectionNode media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
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
      const { eyebrow, lede, support, align, surface, actions, markdown } = node.props;
      // `UNO-WO-112 / R01`: the donor marks both body fields Markdown-capable, so the adapter's own switch selects the
      // shared Markdown renderer; without it the served markup stays byte-identical to the earlier plain form.
      const ledeBlocks = markdown === true ? parseFamilyMarkdown(lede) : null;
      const supportBlocks = markdown === true ? parseFamilyMarkdown(support) : null;
      return (
        <section
          className="uno-json-hero"
          data-uno-align={align ?? "start"}
          data-uno-surface={surface ?? "plain"}
          id={node.id}
        >
          {eyebrow === undefined ? null : <p className="uno-json-eyebrow">{eyebrow}</p>}
          {lede === undefined ? null : ledeBlocks === null ? (
            <p className="uno-json-hero-lede">{lede}</p>
          ) : (
            <div className="uno-json-hero-lede">
              <UnoFamilyMarkdown blocks={ledeBlocks} />
            </div>
          )}
          {actions === undefined ? null : (
            <ul className="uno-json-actions uno-json-hero-actions">
              {actions.map((item, index) => {
                // `UNO-WO-112 / R01`: a same-document fragment keeps its `#<section-id>` anchor; the donor's static
                // outbound form is one ordinary safe anchor with the same `rel` the list and prose links already carry.
                const outbound = "href" in item;
                return (
                  <li className="uno-json-action-item" key={index}>
                    <a
                      className="uno-json-action"
                      href={outbound ? item.href : `#${item.targetId}`}
                      rel={outbound ? "noreferrer noopener" : undefined}
                      data-uno-variant={item.variant}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          {support === undefined ? null : supportBlocks === null ? (
            <p className="uno-json-hero-support">{support}</p>
          ) : (
            <div className="uno-json-hero-support">
              <UnoFamilyMarkdown blocks={supportBlocks} />
            </div>
          )}
        </section>
      );
    }
    case "content.stats": {
      const { items, heading, level, surface, markdown } = node.props;
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
            {items.map((item, index) => {
              // `UNO-WO-113 / R01`: the donor's `detail` is Markdown-capable, so an adapter-flagged node draws it with the one
              // shared family renderer; an unflagged node keeps the byte-identical escaped `<span>`.
              const detailBlocks = markdown === true ? parseFamilyMarkdown(item.detail) : null;
              return (
                <div className="uno-json-stat" key={`${item.label}:${index}`}>
                  <dt className="uno-json-stat-label">{item.label}</dt>
                  <dd className="uno-json-stat-value">
                    {item.value}
                    {item.detail === undefined ? null : detailBlocks === null ? (
                      <span className="uno-json-stat-detail">{item.detail}</span>
                    ) : (
                      <div className="uno-json-stat-detail">
                        <UnoFamilyMarkdown blocks={detailBlocks} />
                      </div>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      );
    }
    case "content.testimonials": {
      const { items, align, surface, markdown } = node.props;
      return (
        <section
          className="uno-json-testimonials"
          data-uno-align={align ?? "start"}
          data-uno-surface={surface ?? "plain"}
          id={node.id}
        >
          {items.map((item, index) => {
            // `UNO-WO-117 / R01`: the donor's quotation body is Markdown-capable, so an adapter-flagged node draws it with
            // the one shared family renderer; an unflagged node keeps the byte-identical escaped `<blockquote>` text.
            const quoteBlocks = markdown === true ? parseFamilyMarkdown(item.quote) : null;
            return (
              <figure className="uno-json-testimonial" key={`${item.quote}:${index}`}>
                <blockquote className="uno-json-testimonial-quote">
                  {quoteBlocks === null ? item.quote : <UnoFamilyMarkdown blocks={quoteBlocks} />}
                </blockquote>
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
            );
          })}
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
      const { items, heading, level, surface, itemHeadingLevel, markdown } = node.props;
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
            {items.map((item, index) => {
              // `UNO-WO-114 / R01`: the donor's step `body` is Markdown-capable, so an adapter-flagged node draws each authored
              // body through the one shared family renderer; an unflagged node keeps the byte-identical escaped `<p>`.
              const descriptionBlocks = markdown === true ? parseFamilyMarkdown(item.description) : null;
              return (
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
                  {item.description === undefined ? null : descriptionBlocks === null ? (
                    <p className="uno-json-timeline-description">{item.description}</p>
                  ) : (
                    <div className="uno-json-timeline-description">
                      <UnoFamilyMarkdown blocks={descriptionBlocks} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      );
    }

    case "media.image": {
      const resolved = mediaOf(media, node.id).image;
      // Serving already refused the Page when a declared asset was unreadable, so an unresolved image here means the
      // document changed after acceptance; rendering nothing is the honest outcome.
      if (resolved === undefined) return null;
      return <MediaFigure alt={node.props.alt} caption={node.props.caption} id={node.id} image={resolved} markdown={node.props.markdown} />;
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
      // `UNO-WO-121 / R01`: the closed opt-in **list** representation. One ordered `<ul>` whose every direct `<li>` owns exactly
      // one figure carrying that item's own image and caption, beneath only the authored heading and lede — no control, no
      // invented heading, no invented text and no duplicated anchor.
      if ("list" in node.props && node.props.list === true) {
        const listProps = node.props;
        const { heading, level, lede, ledeMarkdown, surface, columns } = listProps;
        const Tag = level === undefined ? null : HEADING_TAGS[level];
        const ledeParsed = ledeMarkdown === true ? parseFamilyMarkdown(lede) : null;
        return (
          <div className="uno-json-gallery-section" data-uno-surface={surface} id={node.id}>
            {Tag === null || heading === undefined ? null : (
              <Tag className="uno-json-heading" id={`${node.id}-heading`}>
                {heading}
              </Tag>
            )}
            {lede === undefined ? null : ledeParsed !== null ? (
              <section className="uno-json-prose" id={`${node.id}-lede`}>
                <UnoFamilyMarkdown blocks={ledeParsed} className="uno-json-gallery-lede" />
              </section>
            ) : (
              <p className="uno-json-prose" id={`${node.id}-lede`}>
                {lede}
              </p>
            )}
            <ul className="uno-json-gallery-list" data-uno-columns={columns} id={`${node.id}-list`} role="list">
              {listProps.items.map((item, index) => {
                const image = resolved[index];
                if (image === undefined) return null;
                return (
                  <li className="uno-json-gallery-entry" key={`${item.alt}:${index}`}>
                    <MediaItemFigure
                      alt={item.alt}
                      caption={item.caption}
                      image={image}
                      markdown={item.markdown === true}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
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
            <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
          ))}
        </div>
      );
    }
    case "interaction.tabs": {
      const panels = node.children.map((child) => <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />);
      return <UnoTabsIsland id={node.id} label={node.props.label} panels={panels} tabs={node.props.tabs} />;
    }
    case "interaction.accordion": {
      // Native `<details>`/`<summary>`: keyboard behaviour, expanded state and the disclosure roles are the platform's,
      // and each disclosure opens independently of the others.
      // `UNO-WO-080 / R01`: only an explicitly authored literal `3` wraps the label in one level-3 heading inside its
      // own `<summary>`; an accordion authored before that switch keeps its plain summary text byte-identically.
      const summaryHeadingLevel = node.props.summaryHeadingLevel;
      // `UNO-WO-118 / R01`: the donor's closed section surface is carried by the group wrapper; an accordion without one
      // keeps exactly its previous attributes.
      const surface = node.props.surface;
      return (
        <div
          className="uno-json-accordion"
          {...(surface === undefined ? {} : { "data-uno-surface": surface })}
          id={node.id}
        >
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
                <SectionNode media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
              </div>
            </details>
          ))}
        </div>
      );
    }

    case "interaction.modal": {
      const content = node.children.map((child) => <SectionNode key={child.id} media={media} node={child} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />);
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
            `U05`: when — and only when — the server holds a validated webhook configuration, the module hands the three fields
            to the one contact island, which owns native validation, the status region and the single POST. With delivery off
            (the shipped state) the honest notice below is rendered instead, so "not sent" stays a structural fact.
          */}
          {contactDelivery && selected.length > 0 ? (
            <UnoContactForm fields={selected} page={`/${node.id}`} submitLabel={submitLabel ?? "Send message"} />
          ) : (
            <p className="uno-json-contact-status">Delivery is switched off. Nothing entered here is sent or stored.</p>
          )}
          {contactDelivery && selected.length > 0 ? null : (
            <>
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
            </>
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
export function UnoPageSections({ document, media, routeHrefs, contactDelivery = false }: UnoPageSectionsProps) {
  const validated = readUnoPageDocument(document);
  if (!validated.accepted) return null;

  return (
    <div className="uno-json" data-uno-document-version={validated.document.version}>
      {validated.document.sections.map((section) => (
        <SectionNode key={section.id} media={media} node={section} routeHrefs={routeHrefs} contactDelivery={contactDelivery} />
      ))}
    </div>
  );
}
