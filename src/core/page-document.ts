/**
 * Foundation Uno — the versioned JSON Page document (`UNO-WO-035 / R01`, U04).
 *
 * WHAT THIS IS. One pure, framework-free validator for the version-1 JSON Page document: a closed envelope
 * `{ version: 1, title, description?, visibility?, sections }` whose sections are typed module nodes drawn
 * from the immutable 22-ID capability registry. It answers exactly one question — "is this authored JSON a
 * well-formed Uno Page document?" — and returns either a deeply frozen, deterministic, serializable document
 * or **one** closed refusal literal.
 *
 * WHAT IT IS NOT. It is not a publisher, a router, a locale or Site selector, a canonical-base source, a host,
 * an analytics switch or a provider configuration. The document carries no `entity`, `facet`, `site`, `page`,
 * `locale`, `route`, `canonical`, `host`, `basePath`, `publication`, `robots`, `provider` or `secret` field,
 * and it cannot override any of them: anything outside the closed envelope is refused rather than ignored.
 * Publication remains the manifest Page's `publication: "published"` declaration; visibility is the selected
 * source's own `public`/`unlisted` intent; presentation is `deployment/site.config.json`.
 *
 * RENDERABILITY. This run implements exactly eleven module renderers: the five accepted layout/heading/prose/action
 * modules, `content.hero`, `content.stats`, `content.testimonials` (`UNO-WO-037 / R01`) and `layout.bento`,
 * `content.pricing`, `content.timeline` (`UNO-WO-038 / R01`). A `module` literal that is not one of the immutable
 * 22 IDs is `document:unknown-module`; one that *is* registered but has no renderer yet in this slice is
 * `document:renderer-unavailable`. Both refuse the entire Page, so no partially supported document can ever reach a
 * renderer or a discovery plan. The eleven remaining registered IDs stay unrenderable, and this tuple remains a
 * local availability discriminator — never a second registry.
 *
 * TRUST BOUNDARY. `input` is untrusted `unknown` (plain own data, or raw JSON text). It is classified before any
 * field is read, so a getter, a symbol key, an exotic prototype, a sparse array, a cyclic graph or a throwing
 * Proxy trap can neither run authored code nor escape as an exception. JSON text is parsed by a strict
 * recursive-descent reader below, because `JSON.parse` silently keeps the **last** of two duplicate keys — the
 * one class of hostile input this contract must still see. No refusal ever interpolates a caller value, a path,
 * a body, a title or a stack.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW / COMPOSE**. The pinned read-only Foundation
 * GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`
 * (`src/core/page-document.ts`, blob `a12d964c43626c6313a621bf628f5cc24b65d444`) was read for *semantics and
 * bounds only*; no code, schema text, fixture or asset is copied, and the family composition layer it implies
 * remains a later U04 obligation.
 */
import { readUnoOwnedAssetRef, type UnoOwnedAssetRef, type UnoOwnedMediaPurpose } from "./assets/uno-owned-media";
import { isUnoVideoProvider, readUnoVideoEmbed, type UnoVideoProvider } from "./video/uno-video-embeds";
import { isCapabilityId } from "./modules/capability-registry";
import { isPageRoutePath } from "./page-route-path";
import { classifyAuthorDestination } from "./safe-author-url";

/** The only document version this build accepts. An unknown version refuses; it is never upgraded. */
export const UNO_PAGE_DOCUMENT_VERSION = 1;

/**
 * The exact module IDs that have a real renderer in this execution.
 *
 * Every member is an existing ID from the immutable registry; this tuple is a *local availability
 * discriminator*, not a second registry. From `UNO-WO-040 / R01` all **22** registered IDs are renderable, so this
 * tuple and the registry agree exactly. It is kept as a distinct list so that a future registry addition still
 * refuses with `document:renderer-unavailable` instead of silently rendering nothing.
 */
export const UNO_RENDERABLE_MODULES = Object.freeze([
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
] as const);


/** One renderable module ID of this slice. */
export type UnoRenderableModule = (typeof UNO_RENDERABLE_MODULES)[number];

/**
 * The documented caps of this contract. Every one is a limit that **refuses**, never a truncation.
 *
 * `titleCodePoints` and `descriptionCodePoints` restate the bounds the accepted Page-header projector already
 * enforces, so a JSON Page can never pass one projection and fail the other.
 */
export const UNO_PAGE_DOCUMENT_LIMITS = Object.freeze({
  sourceBytes: 64 * 1024,
  sections: 32,
  nodes: 128,
  depth: 4,
  layoutChildren: 8,
  textCodePoints: 4000,
  titleCodePoints: 160,
  descriptionCodePoints: 320,
  actionItems: 8,
  labelCodePoints: 160,
  heroActions: 3,
  statItems: 6,
  testimonialItems: 6,
  statValueCodePoints: 48,
  statDetailCodePoints: 320,
  pricingItems: 6,
  priceAmountCodePoints: 64,
  priceUnitCodePoints: 64,
  pricingDescriptionCodePoints: 320,
  timelineItems: 12,
  timelineTitleCodePoints: 160,
  timelineDescriptionCodePoints: 320,
  timelineDateLabelCodePoints: 120,
  /** `layout.layers` and `design.motion` accept 2–4 and 1–4 children respectively. */
  layerChildren: 4,
  motionChildren: 4,
  /** `interaction.tabs`, `interaction.accordion` and `interaction.modal` child bounds. */
  tabChildren: 6,
  accordionChildren: 8,
  /**
   * `UNO-WO-118 / R01`: the donor's own 24-item `faq` ceiling. It is **not** an accordion bound — the ordinary 1–8 group
   * bound above stays exactly as it was, and an authored FAQ beyond eight entries is composed as consecutive ordinary groups.
   */
  faqItems: 24,
  /** `media.gallery` and `media.carousel` item bounds. */
  galleryItems: 12,
  carouselItems: 8,
  mediaAltCodePoints: 320,
  mediaCaptionCodePoints: 320,
  /**
   * `UNO-WO-120 / R01`: the donor's own Markdown caption bound for `media.image`. The **native plain caption keeps its
   * `mediaCaptionCodePoints` (320) bound untouched** — only a caption explicitly declared as Markdown is read at this
   * donor limit, so adopting the donor's 4,000 admits no wider contract anywhere else.
   *
   * `UNO-WO-120 / R02`: every donor-supported caption is representable through 4,000 code points, including **unformatted**
   * text, because the adapter declares any caption above the native bound through this same accepted Markdown-capable form
   * rather than padding it, wrapping it or formatting it to fit. The unflagged bound, and every unrelated caption limit,
   * stay exactly where they were.
   */
  mediaCaptionMarkdownCodePoints: 4000,
  watermarkTextCodePoints: 160,
  contactDescriptionCodePoints: 400,
  sectionIdLength: 48,
  jsonDepth: 16,
  jsonNodes: 2048,
});

/** The two declared visibility intents a selected JSON source may carry. Default is `public`. */
export type UnoPageVisibility = "public" | "unlisted";

/** The three closed stack gaps. */
export type UnoStackGap = "tight" | "normal" | "wide";

/**
 * `UNO-WO-120 / R01`: the donor's closed Media `position`. `start` puts the figure first and `end` puts the authored text
 * first; either way the two sit in one row of equal tracks at a wide viewport and keep that same order as one column on a
 * narrow one. The absence of a position is the ordinary vertical stack, never a third value.
 */
export type UnoSectionPosition = "start" | "end";
/** The two closed grid item semantics; `article` is a semantic wrapper, never a hidden module. */
export type UnoGridItemSemantics = "plain" | "article";

/** `layout.stack` props: one closed optional gap, one closed optional surface and typed children. */
export interface UnoLayoutStackProps {
  readonly gap?: UnoStackGap;
  /**
   * `UNO-WO-119 / R01`: the adopted closed section surface, so a family that composes its heading, lede and body into one
   * stack can carry an authored surface **around the whole section** rather than only around its inner grid.
   */
  readonly surface?: UnoSectionSurface;
  /**
   * `UNO-WO-120 / R01`: the donor's closed `position` for the Media family. `start` places the figure before its authored
   * text and `end` after it, both laid out as two equal tracks at a wide viewport and as one column, in the same authored
   * order, at a narrow one. An absent position keeps the ordinary vertical stack, so every other family is untouched.
   */
  readonly position?: UnoSectionPosition;
}

/** The grid-only third item semantic: one native list with one `<li>` per authored child, in source order. */
export type UnoGridListSemantics = "list";

/** The closed two-column ratio of `layout.grid`; accepted only when `columns` is exactly 2. */
export type UnoGridRatio = "equal" | "start-wide" | "end-wide";

/** `layout.grid` props: required columns, an optional item semantic (`list` is grid-only) and a two-column ratio. */
export interface UnoLayoutGridProps {
  readonly columns: 1 | 2 | 3 | 4;
  readonly itemSemantics?: UnoGridItemSemantics | UnoGridListSemantics;
  readonly ratio?: UnoGridRatio;
}

/** `content.heading` props: text plus an explicit level that can never be the Page `h1`. */
export interface UnoContentHeadingProps {
  readonly text: string;
  readonly level: 2 | 3 | 4 | 5 | 6;
}

/** The three closed callout tones of a `content.prose` callout. */
export type UnoProseCalloutTone = "note" | "info" | "warning";

/** One document-local application-link declaration: an opaque key only, never a URL and never a resolver. */
export interface UnoApplicationLink {
  readonly reference: "applicationLink";
  readonly key: string;
}

/**
 * One bounded entry of a `content.prose` list variant: a required label and optional detail, plus at most one closed
 * destination form.
 *
 * `UNO-WO-103 / R01`: `href` is an authored string the reader has already classified; `linkId` names a validated
 * document-local declaration and stays **inert** in a build without an authorised resolver. A site-local route intent is
 * not readable yet: it needs the server publication proof, so `route` remains refused rather than rendered as a guess.
 */
export type UnoProseListItem =
  | { readonly label: string; readonly detail?: string }
  | { readonly label: string; readonly detail?: string; readonly href: string }
  | { readonly label: string; readonly detail?: string; readonly linkId: string }
  | { readonly label: string; readonly detail?: string; readonly routeTarget: string };

/**
 * One bounded `content.prose` body: plain authored text, or — when `markdown` is the literal `true` — donor-authored
 * Markdown that `readUnoFamilyMarkdown` has already accepted.
 */
export interface UnoContentProseBody {
  readonly text: string;
  readonly heading?: string;
  readonly lede?: string;
  readonly align?: UnoSectionAlign;
  readonly surface?: UnoSectionSurface;
  readonly markdown?: true;
}

/**
 * `content.prose` props: the original inert plain text, or exactly one of four closed presentation variants.
 *
 * The legacy shape carries no `variant` key at all. Every variant is disjoint, bounded and rendered as React text or as
 * the accepted Markdown AST; none of them introduces raw HTML, a script, an asset or any authoring authority beyond the
 * classified `https`/`mailto` links Markdown already admits.
 */
export type UnoContentProseProps =
  | ({ readonly variant?: never } & UnoContentProseBody)
  | ({
      readonly variant: "callout";
      readonly tone?: UnoProseCalloutTone;
    } & UnoContentProseBody)
  | {
      readonly variant: "list";
      readonly items: readonly UnoProseListItem[];
      readonly ordered?: boolean;
      /** `UNO-WO-102 / R01`: an authored Markdown-capable lede, rendered before the native list. */
      readonly lede?: string;
      readonly surface?: UnoSectionSurface;
      /** Set only when at least one authored field is Markdown; then `lede`/`detail` are the accepted AST. */
      readonly markdown?: true;
    }
  | {
      readonly variant: "table";
      readonly columns: readonly string[];
      readonly rows: readonly (readonly string[])[];
      readonly caption?: string;
      /** `UNO-WO-102 / R01`: an authored Markdown-capable lede, rendered before the native table. */
      readonly lede?: string;
      readonly surface?: UnoSectionSurface;
      /** Set only when the authored `caption` or `lede` is Markdown; cells always stay plain text. */
      readonly markdown?: true;
    }
  | { readonly variant: "divider" };


/** One same-document action: a label and the exact `#<section-id>` destination it names. */
export interface UnoActionItem {
  readonly label: string;
  readonly targetId: string;
}

/**
 * `UNO-WO-081 / R01`: one authored transport-free outbound action inside a stand-alone `content.actions` list.
 *
 * `href` is the original accepted string, classified by the unchanged `classifyAuthorDestination` and admitted only for
 * the exact `mailto` or `https` categories. It is never rewritten, resolved, prefetched, probed or followed by Uno: the
 * anchor is ordinary server markup that a Visitor may choose to activate. This is a bounded static-link capability, not
 * a contact transport, directions engine, booking integration or provider validation.
 */
export interface UnoOutboundActionItem {
  readonly label: string;
  readonly href: string;
}

/** One entry of a stand-alone `content.actions` list: a same-document fragment or a static outbound link. */
export type UnoContentActionEntry = UnoActionItem | UnoOutboundActionItem;

/**
 * `UNO-WO-112 / R01`: the three closed hero-action variants the donor authors, adopted as values.
 *
 * A variant is presentation only. It never changes a destination, adds a transport, or grants a capability.
 */
export const UNO_HERO_ACTION_VARIANTS = ["primary", "secondary", "link"] as const;
export type UnoHeroActionVariant = (typeof UNO_HERO_ACTION_VARIANTS)[number];

/**
 * `UNO-WO-112 / R01`: one authored hero action.
 *
 * Either the unchanged same-document fragment (`targetId`, registered as an in-page anchor) or one static outbound link
 * admitted only through the unchanged safe-destination classifier, plus an optional closed variant. The two destination
 * forms are mutually exclusive: an entry that carried both, or neither, is a props refusal rather than a guess.
 */
export type UnoHeroActionItem =
  | (UnoActionItem & { readonly variant?: UnoHeroActionVariant })
  | (UnoOutboundActionItem & { readonly variant?: UnoHeroActionVariant });

/** `content.actions` props: one bounded list of same-document anchors and static outbound links. */
export interface UnoContentActionsProps {
  readonly items: readonly UnoContentActionEntry[];
}

/** The three closed section surfaces. Adopted as *values* from the audited Foundation schema (see the ledger). */
export type UnoSectionSurface = "plain" | "muted" | "bordered";

/** The two closed section alignments. */
export type UnoSectionAlign = "start" | "center";

/**
 * `content.hero` props: an optional eyebrow, at least one authored body field, closed styling and optional
 * same-document actions. A hero is content, not a publication declaration, and it never carries a heading level.
 *
 * `UNO-WO-112 / R01`: `actions` admits the donor's static outbound form with its closed variant, and `markdown` is set
 * only by the adapter when one of the two Markdown-capable body fields actually authors Markdown.
 */
export interface UnoContentHeroProps {
  readonly eyebrow?: string;
  readonly lede?: string;
  readonly support?: string;
  readonly align?: UnoSectionAlign;
  readonly surface?: UnoSectionSurface;
  readonly actions?: readonly UnoHeroActionItem[];
  readonly markdown?: true;
}

/** One factual statistic: a value, the label that names it, and optional bounded detail. */
export interface UnoStatItem {
  readonly value: string;
  readonly label: string;
  readonly detail?: string;
}

/**
 * `content.stats` props: 1–6 authored figures and an optional section heading. `level` is required exactly when a
 * heading is present, so a stray level can never imply a heading that does not exist.
 *
 * `UNO-WO-113 / R01`: `markdown` is the adapter's own switch for Markdown-capable item details, and `surface` is the
 * unchanged closed section surface the donor authors on this family.
 */
export interface UnoContentStatsProps {
  readonly items: readonly UnoStatItem[];
  readonly heading?: string;
  readonly level?: 2 | 3 | 4 | 5 | 6;
  readonly surface?: UnoSectionSurface;
  readonly markdown?: true;
}

/** One authored quotation with optional attribution and role. Absent fields stay absent; none is ever invented. */
export interface UnoTestimonialItem {
  readonly quote: string;
  readonly attribution?: string;
  readonly role?: string;
}

/** `content.testimonials` props: 1–6 bounded authored quotations. */
export interface UnoContentTestimonialsProps {
  readonly items: readonly UnoTestimonialItem[];
  readonly align?: UnoSectionAlign;
  readonly surface?: UnoSectionSurface;
  /**
   * `UNO-WO-117 / R01`: the closed Markdown switch for the quotation body. The donor `quote.body` is Markdown-capable, so
   * a declared node carries Markdown the shared reader accepted and the renderer draws through the shared renderer; an
   * undeclared node keeps the byte-identical escaped `<blockquote>`.
   */
  readonly markdown?: true;
}

/**
 * The four closed bento tile spans. A span is a *named* sizing intent — `standard` 1×1, `wide` two columns,
 * `tall` two rows, `feature` two columns and two rows — never an authored pixel width, grid line or CSS string.
 */
export type UnoBentoTileSpan = "standard" | "wide" | "tall" | "feature";

/** One bento tile: the exact child it sizes and the one closed span applied to that child. */
export interface UnoBentoTile {
  readonly sectionId: string;
  readonly span: UnoBentoTileSpan;
}

/**
 * `layout.bento` props: a closed column count, an optional item semantic variant and one tile for every child.
 *
 * `tiles` is positional: it is the same length as `children` and its `sectionId` must equal the id of the child at
 * the same index, so a tile can never size a section that is not its own sibling. At least one span must be
 * non-`standard`, which is what distinguishes a genuine bento from `layout.grid`.
 */
export interface UnoLayoutBentoProps {
  readonly columns: 2 | 3 | 4;
  readonly itemSemantics?: UnoGridItemSemantics;
  readonly tiles: readonly UnoBentoTile[];
}

/**
 * One authored price: the label that names what is offered, the amount exactly as the author wrote it, and optional
 * unit and description. `amount` is inert authored text — this contract never parses, computes, converts or formats
 * a number, and therefore cannot invent a currency, a tax, a discount, a total or an offer.
 */
export interface UnoPricingItem {
  readonly label: string;
  readonly amount: string;
  readonly unit?: string;
  readonly description?: string;
  readonly featured?: boolean;
}

/** `content.pricing` props: 1–6 explicitly authored prices and an optional section heading. */
export interface UnoContentPricingProps {
  readonly items: readonly UnoPricingItem[];
  readonly heading?: string;
  readonly level?: 2 | 3 | 4 | 5 | 6;
  readonly surface?: UnoSectionSurface;
}

/** The three closed author-declared milestone states. Uno never infers, schedules or advances one of them. */
export type UnoTimelineStatus = "complete" | "current" | "upcoming";

/** One authored milestone: a required title and optional bounded date label, description and declared status. */
export interface UnoTimelineItem {
  readonly title: string;
  readonly description?: string;
  readonly dateLabel?: string;
  readonly status?: UnoTimelineStatus;
}

/**
 * `content.timeline` props: 1–12 ordered authored milestones and an optional section heading.
 *
 * `UNO-WO-114 / R01`: `markdown` is the adapter's own switch for Markdown-capable milestone descriptions, matching the
 * donor's `body: markdownTextSchema`. No status, date, icon or destination is ever manufactured from it.
 */
export interface UnoContentTimelineProps {
  readonly items: readonly UnoTimelineItem[];
  readonly heading?: string;
  readonly level?: 2 | 3 | 4 | 5 | 6;
  readonly surface?: UnoSectionSurface;
  /**
   * `UNO-WO-080 / R01`: the donor renders each milestone title as a level-3 heading inside its native ordered list.
   * Only the literal `3` is accepted, and only when it is authored; an absent value keeps the original `<p>` title.
   */
  readonly itemHeadingLevel?: 3;
  readonly markdown?: true;
}

/** The two closed `layout.layers` modes. */
export type UnoLayerMode = "stack" | "overlap";

/** `layout.layers` props: a closed mode and an optional closed alignment. The children supply the layers. */
export interface UnoLayoutLayersProps {
  readonly mode: UnoLayerMode;
  readonly align?: UnoSectionAlign;
}

/** One authored media item: the owned asset, its alternative text and an optional caption. */
export interface UnoMediaItem {
  readonly asset: UnoOwnedAssetRef;
  readonly alt: string;
  readonly caption?: string;
}

/**
 * `media.image` props: one owned raster, an authored alt (empty only when decorative) and an optional caption.
 *
 * `UNO-WO-120 / R01`: a caption may be the donor's Markdown form. `markdown` is only ever the literal `true`, is set by the
 * adapter from the donor's own Markdown-capable `caption`, and is read at the donor's 4,000 bound instead of the native
 * plain caption's 320 — the two forms are disjoint, so no native caption bound is loosened.
 *
 * `UNO-WO-120 / R03`: `alt` is a **required** native key and the node always carries it. The donor may omit its own `alt`
 * beside `decorative: true`; the adapter normalizes that source shape to the native `alt: ""` before strict reading, so the
 * native boundary itself never admits an omitted alternative.
 */
export interface UnoMediaImageProps {
  readonly asset: UnoOwnedAssetRef;
  readonly alt: string;
  readonly decorative?: boolean;
  readonly caption?: string;
  readonly markdown?: true;
}

/** `media.video` props: one owned video, its **required** owned caption track and an authored accessible name. */
export interface UnoMediaVideoProps {
  readonly asset: UnoOwnedAssetRef;
  readonly captions: UnoOwnedAssetRef;
  readonly title: string;
  readonly poster?: UnoOwnedAssetRef;
  readonly description?: string;
}

/**
 * `media.video` props, external mode — the Owner-approved second alternative of the same module ID.
 *
 * It is discriminated by the `source` literal and is deliberately exclusive with native mode: it carries no `asset`,
 * `captions` or `poster`, because an external embed is **not** an owned asset, is never served from `/uno-media/...`,
 * owns no zone and grants no publication authority. `provider` is one of four exact lowercase literals and `videoId`
 * is the provider's own identifier. `privacyHash` exists for Vimeo's unlisted embeds only, and is never a secret or an
 * access grant. The validated destination is constructed exclusively by `src/core/video/uno-video-embeds.ts`.
 */
export interface UnoExternalVideoProps {
  readonly source: "external";
  readonly provider: UnoVideoProvider;
  readonly videoId: string;
  readonly title: string;
  readonly privacyHash?: string;
  readonly description?: string;
}

/** The closed `media.video` alternative set: an owned native player, or a consent-gated external embed. */
export type UnoMediaVideoAlternative = UnoMediaVideoProps | UnoExternalVideoProps;

/**
 * Narrow a validated `media.video` alternative to external mode.
 *
 * External mode is identified by the presence of the own `source` key, which native mode never carries and which the
 * validator accepts only as the literal `"external"`. Callers therefore narrow on structure, never on a value they
 * would have to trust.
 */
export function isUnoExternalVideoProps(props: UnoMediaVideoAlternative): props is UnoExternalVideoProps {
  return Object.prototype.hasOwnProperty.call(props, "source");
}

/** `media.gallery` props: 2–12 owned images at one of three closed column intents. */
export interface UnoMediaGalleryProps {
  readonly columns: 2 | 3 | 4;
  readonly items: readonly UnoMediaItem[];
}

/** `media.carousel` props: 2–8 owned images behind one authored group label. */
export interface UnoMediaCarouselProps {
  readonly label: string;
  readonly items: readonly UnoMediaItem[];
}

/** The three closed watermark alignments. */
export type UnoWatermarkAlign = "start" | "center" | "end";

/** The two closed watermark strengths. */
export type UnoWatermarkStrength = "subtle" | "regular";

/** `design.watermark` props: inert decorative text with closed placement and strength. */
export interface UnoDesignWatermarkProps {
  readonly text: string;
  readonly align?: UnoWatermarkAlign;
  readonly strength?: UnoWatermarkStrength;
}

/** The three closed motion effects; `none` is a real authored choice, never the absence of a value. */
export type UnoMotionEffect = "fade" | "rise" | "none";

/** The two closed motion durations. */
export type UnoMotionSpeed = "short" | "normal";

/** `design.motion` props: one closed effect wrapping 1–4 validated children. */
export interface UnoDesignMotionProps {
  readonly effect: UnoMotionEffect;
  readonly speed?: UnoMotionSpeed;
}

/** One tab entry: the panel child it names and the label that names it. */
export interface UnoTabEntry {
  readonly sectionId: string;
  readonly label: string;
}

/** `interaction.tabs` props: 2–6 positional entries matching the children exactly. */
export interface UnoInteractionTabsProps {
  readonly label: string;
  readonly tabs: readonly UnoTabEntry[];
}

/** One accordion entry: the disclosure child it names and the summary label. */
export interface UnoAccordionEntry {
  readonly sectionId: string;
  readonly label: string;
}

/** `interaction.accordion` props: 1–8 positional entries matching the children exactly. */
export interface UnoInteractionAccordionProps {
  readonly items: readonly UnoAccordionEntry[];
  /**
   * `UNO-WO-080 / R01`: the donor renders each FAQ question as a level-3 heading inside its native `<summary>`.
   * Only the literal `3` is accepted, and only when it is authored; an absent value keeps the plain summary label.
   */
  readonly summaryHeadingLevel?: 3;
  /**
   * `UNO-WO-118 / R01`: the donor `faq` section carries a closed `surface`, and the disclosure group is where it belongs —
   * one `data-uno-surface` on the group wrapper, exactly as a native section carries its own. Absent means no attribute at
   * all, so every accordion authored before this switch keeps its byte-identical markup.
   */
  readonly surface?: UnoSectionSurface;
}

/** `interaction.modal` props: the trigger, dialog title and close control labels. Its one child is the content. */
export interface UnoInteractionModalProps {
  readonly triggerLabel: string;
  readonly title: string;
  readonly closeLabel: string;
}

/** The three closed contact field names. Local-only while delivery is off. */
export type UnoContactField = "name" | "email" | "message";

/** `interaction.contact` props: a delivery-OFF surface with readable labels and no transport of any kind. */
export interface UnoInteractionContactProps {
  readonly heading?: string;
  readonly description?: string;
  readonly fields?: readonly UnoContactField[];
  readonly submitLabel?: string;
}

/** One validated module node. Layouts own typed children; the eight content modules own none. */
export type UnoSectionNode =
  | {
      readonly id: string;
      readonly module: "layout.stack";
      readonly props: UnoLayoutStackProps;
      readonly children: readonly UnoSectionNode[];
    }
  | {
      readonly id: string;
      readonly module: "layout.grid";
      readonly props: UnoLayoutGridProps;
      readonly children: readonly UnoSectionNode[];
    }
  | {
      readonly id: string;
      readonly module: "layout.bento";
      readonly props: UnoLayoutBentoProps;
      readonly children: readonly UnoSectionNode[];
    }
  | { readonly id: string; readonly module: "content.heading"; readonly props: UnoContentHeadingProps }
  | { readonly id: string; readonly module: "content.prose"; readonly props: UnoContentProseProps }
  | { readonly id: string; readonly module: "content.actions"; readonly props: UnoContentActionsProps }
  | { readonly id: string; readonly module: "content.hero"; readonly props: UnoContentHeroProps }
  | { readonly id: string; readonly module: "content.stats"; readonly props: UnoContentStatsProps }
  | {
      readonly id: string;
      readonly module: "content.testimonials";
      readonly props: UnoContentTestimonialsProps;
    }
  | { readonly id: string; readonly module: "content.pricing"; readonly props: UnoContentPricingProps }
  | { readonly id: string; readonly module: "content.timeline"; readonly props: UnoContentTimelineProps }
  | {
      readonly id: string;
      readonly module: "layout.layers";
      readonly props: UnoLayoutLayersProps;
      readonly children: readonly UnoSectionNode[];
    }
  | { readonly id: string; readonly module: "media.image"; readonly props: UnoMediaImageProps }
  | { readonly id: string; readonly module: "media.video"; readonly props: UnoMediaVideoAlternative }
  | { readonly id: string; readonly module: "media.gallery"; readonly props: UnoMediaGalleryProps }
  | { readonly id: string; readonly module: "media.carousel"; readonly props: UnoMediaCarouselProps }
  | { readonly id: string; readonly module: "design.watermark"; readonly props: UnoDesignWatermarkProps }
  | {
      readonly id: string;
      readonly module: "design.motion";
      readonly props: UnoDesignMotionProps;
      readonly children: readonly UnoSectionNode[];
    }
  | {
      readonly id: string;
      readonly module: "interaction.tabs";
      readonly props: UnoInteractionTabsProps;
      readonly children: readonly UnoSectionNode[];
    }
  | {
      readonly id: string;
      readonly module: "interaction.accordion";
      readonly props: UnoInteractionAccordionProps;
      readonly children: readonly UnoSectionNode[];
    }
  | {
      readonly id: string;
      readonly module: "interaction.modal";
      readonly props: UnoInteractionModalProps;
      readonly children: readonly UnoSectionNode[];
    }
  | { readonly id: string; readonly module: "interaction.contact"; readonly props: UnoInteractionContactProps };

/** The accepted, deeply frozen version-1 Page document. */
export interface UnoPageDocument {
  readonly version: 1;
  readonly title: string;
  readonly description?: string;
  readonly visibility: UnoPageVisibility;
  readonly sections: readonly UnoSectionNode[];
  /** `UNO-WO-103 / R01`: closed document-local application-link declarations, inert without a resolver. */
  readonly links?: Readonly<Record<string, UnoApplicationLink>>;
}

/**
 * The closed refusal vocabulary of this contract.
 *
 * Every literal is a fixed string this module owns, so a refusal can never echo a caller value.
 */
export type UnoPageDocumentRefusal =
  | "document:input-not-plain"
  | "document:text-not-a-string"
  | "document:text-too-large"
  | "document:json-parse"
  | "document:json-duplicate-key"
  | "document:json-unsafe"
  | "document:not-an-object"
  | "document:unexpected-key"
  | "document:unsupported-version"
  | "document:invalid-title"
  | "document:invalid-description"
  | "document:invalid-visibility"
  | "document:invalid-sections"
  | "document:unknown-module"
  | "document:renderer-unavailable"
  | "document:invalid-section"
  | "document:invalid-section-id"
  | "document:duplicate-section-id"
  | "document:invalid-props"
  | "document:invalid-children"
  | "document:too-deep"
  | "document:too-many-nodes"
  | "document:too-many-sections"
  | "document:heading-order"
  | "document:unsafe-text"
  | "document:unsafe-link"
  | "document:unresolved-target"
  | "document:home-cannot-be-unlisted"
  | "document:cyclic"
  | "document:unreadable";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_PAGE_DOCUMENT_REFUSAL_REASONS: readonly UnoPageDocumentRefusal[] = Object.freeze([
  "document:input-not-plain",
  "document:text-not-a-string",
  "document:text-too-large",
  "document:json-parse",
  "document:json-duplicate-key",
  "document:json-unsafe",
  "document:not-an-object",
  "document:unexpected-key",
  "document:unsupported-version",
  "document:invalid-title",
  "document:invalid-description",
  "document:invalid-visibility",
  "document:invalid-sections",
  "document:unknown-module",
  "document:renderer-unavailable",
  "document:invalid-section",
  "document:invalid-section-id",
  "document:duplicate-section-id",
  "document:invalid-props",
  "document:invalid-children",
  "document:too-deep",
  "document:too-many-nodes",
  "document:too-many-sections",
  "document:heading-order",
  "document:unsafe-text",
  "document:unsafe-link",
  "document:unresolved-target",
  "document:home-cannot-be-unlisted",
  "document:cyclic",
  "document:unreadable",
] as const);

/** The accepted document, or one closed refusal. */
export type UnoPageDocumentResult =
  | { readonly accepted: true; readonly document: UnoPageDocument }
  | { readonly accepted: false; readonly reason: UnoPageDocumentRefusal };

/** The one own-data option this contract reads. Anything else refuses. */
export interface UnoPageDocumentOptions {
  /** True only for the reserved Home Page, whose visibility can never be `unlisted`. */
  readonly reservedHome?: boolean;
}

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileStructure extends Error {}

/** Internal marker for a refused traversal; carries only a closed literal. */
class RefusedDocument extends Error {
  readonly reason: UnoPageDocumentRefusal;
  constructor(reason: UnoPageDocumentRefusal) {
    super(reason);
    this.reason = reason;
  }
}

/** The exact top-level key set of the v1 envelope; the two optional keys are listed too. */
const DOCUMENT_REQUIRED_KEYS: readonly string[] = Object.freeze(["version", "title", "sections"]);

/** The two optional top-level keys of the v1 envelope. */
const DOCUMENT_OPTIONAL_KEYS: readonly string[] = Object.freeze(["description", "visibility", "links"]);

/** `UNO-WO-103 / R01`: one declaration id — a lowercase hyphenated content slug, at most 64 code points. */
const APPLICATION_LINK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** One declared opaque application key: lowercase ASCII words separated by a single dot or hyphen, at most 96. */
const APPLICATION_LINK_KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/u;

/**
 * The modules that own typed children: the four layouts, `design.motion`, and the three child-bearing interactions.
 * Every other module is a leaf. A modal owns exactly one content node, tabs and accordion own labelled panels, and a
 * watermark, image, video, gallery, carousel or the contact surface owns none.
 */
const CHILD_BEARING_MODULES: readonly string[] = Object.freeze([
  "layout.stack",
  "layout.grid",
  "layout.bento",
  "layout.layers",
  "design.motion",
  "interaction.tabs",
  "interaction.accordion",
  "interaction.modal",
]);

/** The three prototype-pollution keys a JSON object may never carry. */
const FORBIDDEN_KEYS: readonly string[] = Object.freeze(["__proto__", "constructor", "prototype"]);

/** A lowercase, hyphenated section identifier. */
const SECTION_ID = /^[a-z][a-z0-9-]{0,47}$/u;

/** One bounded refusal, used for every early exit. */
function refuseDocument(reason: UnoPageDocumentRefusal): UnoPageDocumentResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Count Unicode code points — not UTF-16 code units and not grapheme clusters.
 *
 * A `for…of` iteration over a string yields one full code point per step, but the loop binding is unused here, so the
 * walk is written explicitly: an astral character occupies two code units and is counted once by skipping its low
 * surrogate, while a lone surrogate is counted once and never repaired. No array is allocated and no regular
 * expression is compiled, so a bounded 4000-code-point text costs one linear pass.
 */
function codePointLength(value: string): number {
  let count = 0;
  for (let index = 0; index < value.length; index += 1) {
    const point = value.codePointAt(index) ?? 0;
    count += 1;
    if (point > 0xffff) index += 1;
  }
  return count;
}

/**
 * `UNO-WO-116 / R01`: the one shared Unicode well-formedness decision.
 *
 * A JavaScript string is a UTF-16 code-unit sequence, so it can hold a lone high surrogate, a lone low surrogate, or a
 * reversed pair — sequences that no well-formed Unicode text can contain and that no UTF-8 encoder will accept. Such a
 * value cannot be represented faithfully, so every Markdown-capable authored field refuses it here instead of publishing a
 * replacement character, a mangled glyph or a silently dropped code unit. Valid astral pairs, combining sequences and any
 * mixture of scripts are all well-formed and stay accepted; nothing is replaced, trimmed or normalised.
 *
 * This is a decision, not a repair: the reader, the Markdown field reader and the family composer all consume this one
 * function, so there is a single definition of "well-formed" rather than a per-family patch.
 */
export function isWellFormedUnicodeText(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      // A high surrogate must be followed by a low surrogate: a lone high surrogate, or a reversed/interrupted pair, fails.
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
      continue;
    }
    // A low surrogate that was not consumed as the second half of a valid pair has no lead: it can never be well-formed.
    if (unit >= 0xdc00 && unit <= 0xdfff) return false;
  }
  return true;
}

/** The UTF-8 byte length of one string, so the source cap is a byte cap rather than a character guess. */
function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (point <= 0x7f) bytes += 1;
    else if (point <= 0x7ff) bytes += 2;
    else if (point <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object (including `null` and an array) answers `null`; a non-plain prototype, any symbol key or any
 * accessor throws `HostileStructure`, so no getter is invoked while the input is being classified.
 */
function readPlainData(value: unknown): DataRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new HostileStructure();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileStructure();
  const copy = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.includes(key)) throw new RefusedDocument("document:json-unsafe");
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileStructure();
    copy[key] = descriptor.value;
  }
  return copy;
}

/** Exactly the declared keys, no more and no fewer. */
function hasExactlyKeys(record: DataRecord, required: readonly string[], optional: readonly string[]): boolean {
  const own = Object.keys(record);
  for (const key of own) {
    if (!required.includes(key) && !optional.includes(key)) return false;
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
  }
  return true;
}

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted document. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/** The closed reasons a bounded authored text may be refused, per field family. */
type TextRefusal = "document:invalid-title" | "document:invalid-description" | "document:invalid-props" | "document:unsafe-text";

/** One bounded authored text, or the field-family refusal. Empty is refused only where required. */
function readBoundedText(
  value: unknown,
  maxCodePoints: number,
  refusal: TextRefusal,
  allowEmpty: boolean,
  allowNewlines: boolean,
): string {
  if (typeof value !== "string") throw new RefusedDocument(refusal);
  if (!allowEmpty && value.trim().length === 0) throw new RefusedDocument(refusal);
  if (codePointLength(value) > maxCodePoints) throw new RefusedDocument(refusal);
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (point === 0) throw new RefusedDocument("document:unsafe-text");
    if (point < 0x20 && point !== 0x09 && !(allowNewlines && (point === 0x0a || point === 0x0d))) {
      throw new RefusedDocument("document:unsafe-text");
    }
    if (point === 0x7f) throw new RefusedDocument("document:unsafe-text");
  }
  if (/<[a-zA-Z/!]/u.test(value)) throw new RefusedDocument("document:unsafe-text");
  if (/(?:javascript|vbscript|data)\s*:/iu.test(value)) throw new RefusedDocument("document:unsafe-text");
  return value;
}

/**
 * A strict JSON reader.
 *
 * `JSON.parse` is deliberately not used for authored text: it keeps the **last** duplicate key without telling
 * anyone, so `{"title":"A","title":"B"}` would silently become one document. This reader refuses duplicates,
 * refuses the three prototype-pollution keys, refuses unescaped control characters, caps depth and node count,
 * and never evaluates anything. Numbers are read with the exact JSON grammar and converted once.
 */
class StrictJsonReader {
  private readonly text: string;
  private index = 0;
  private nodes = 0;

  constructor(text: string) {
    this.text = text;
  }

  /** The whole text as one value, or a closed refusal. */
  read(): unknown {
    this.skipWhitespace();
    const value = this.readValue(0);
    this.skipWhitespace();
    if (this.index !== this.text.length) throw new RefusedDocument("document:json-parse");
    return value;
  }

  private skipWhitespace(): void {
    while (this.index < this.text.length) {
      const code = this.text.charCodeAt(this.index);
      if (code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) this.index += 1;
      else return;
    }
  }

  private readValue(depth: number): unknown {
    if (depth > UNO_PAGE_DOCUMENT_LIMITS.jsonDepth) throw new RefusedDocument("document:json-parse");
    this.nodes += 1;
    if (this.nodes > UNO_PAGE_DOCUMENT_LIMITS.jsonNodes) throw new RefusedDocument("document:json-parse");
    const character = this.text.charAt(this.index);
    if (character === "") throw new RefusedDocument("document:json-parse");
    if (character === "{") return this.readObject(depth + 1);
    if (character === "[") return this.readArray(depth + 1);
    if (character === '"') return this.readString();
    if (character === "t") return this.readLiteral("true", true);
    if (character === "f") return this.readLiteral("false", false);
    if (character === "n") return this.readLiteral("null", null);
    if (character === "-" || (character >= "0" && character <= "9")) return this.readNumber();
    throw new RefusedDocument("document:json-parse");
  }

  private readObject(depth: number): Record<string, unknown> {
    this.index += 1;
    const record = Object.create(null) as Record<string, unknown>;
    const seen = new Set<string>();
    this.skipWhitespace();
    if (this.text.charAt(this.index) === "}") {
      this.index += 1;
      return record;
    }
    for (;;) {
      this.skipWhitespace();
      if (this.text.charAt(this.index) !== '"') throw new RefusedDocument("document:json-parse");
      const key = this.readString();
      if (FORBIDDEN_KEYS.includes(key)) throw new RefusedDocument("document:json-unsafe");
      if (seen.has(key)) throw new RefusedDocument("document:json-duplicate-key");
      seen.add(key);
      this.skipWhitespace();
      if (this.text.charAt(this.index) !== ":") throw new RefusedDocument("document:json-parse");
      this.index += 1;
      this.skipWhitespace();
      record[key] = this.readValue(depth);
      this.skipWhitespace();
      const next = this.text.charAt(this.index);
      if (next === ",") {
        this.index += 1;
        continue;
      }
      if (next === "}") {
        this.index += 1;
        return record;
      }
      throw new RefusedDocument("document:json-parse");
    }
  }

  private readArray(depth: number): unknown[] {
    this.index += 1;
    const entries: unknown[] = [];
    this.skipWhitespace();
    if (this.text.charAt(this.index) === "]") {
      this.index += 1;
      return entries;
    }
    for (;;) {
      this.skipWhitespace();
      entries.push(this.readValue(depth));
      this.skipWhitespace();
      const next = this.text.charAt(this.index);
      if (next === ",") {
        this.index += 1;
        continue;
      }
      if (next === "]") {
        this.index += 1;
        return entries;
      }
      throw new RefusedDocument("document:json-parse");
    }
  }

  private readString(): string {
    this.index += 1;
    let value = "";
    for (;;) {
      if (this.index >= this.text.length) throw new RefusedDocument("document:json-parse");
      const character = this.text.charAt(this.index);
      const code = this.text.charCodeAt(this.index);
      if (character === '"') {
        this.index += 1;
        return value;
      }
      if (character === "\\") {
        this.index += 1;
        const escape = this.text.charAt(this.index);
        this.index += 1;
        if (escape === '"') value += '"';
        else if (escape === "\\") value += "\\";
        else if (escape === "/") value += "/";
        else if (escape === "b") value += "\b";
        else if (escape === "f") value += "\f";
        else if (escape === "n") value += "\n";
        else if (escape === "r") value += "\r";
        else if (escape === "t") value += "\t";
        else if (escape === "u") {
          const hex = this.text.slice(this.index, this.index + 4);
          if (!/^[0-9a-fA-F]{4}$/u.test(hex)) throw new RefusedDocument("document:json-parse");
          value += String.fromCharCode(Number.parseInt(hex, 16));
          this.index += 4;
        } else {
          throw new RefusedDocument("document:json-parse");
        }
        continue;
      }
      if (code < 0x20) throw new RefusedDocument("document:json-parse");
      value += character;
      this.index += 1;
    }
  }

  private readLiteral(token: string, value: boolean | null): boolean | null {
    if (this.text.slice(this.index, this.index + token.length) !== token) {
      throw new RefusedDocument("document:json-parse");
    }
    this.index += token.length;
    return value;
  }

  private readNumber(): number {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u.exec(this.text.slice(this.index));
    if (match === null || match[0].length === 0) throw new RefusedDocument("document:json-parse");
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new RefusedDocument("document:json-parse");
    return value;
  }
}

/** The one mutable traversal state of a single validation. */
interface WalkState {
  readonly ids: Set<string>;
  readonly targets: string[];
  /** `UNO-WO-103 / R01`: every `linkId` actually used, checked against the document's own declarations. */
  readonly linkIds: string[];
  nodes: number;
  lastHeadingLevel: number;
}

/** One bounded, non-sparse list of typed children. The bounds are the module's own, never a global guess. */
function readChildren(
  value: unknown,
  depth: number,
  state: WalkState,
  seen: WeakSet<object>,
  min: number = 1,
  max: number = UNO_PAGE_DOCUMENT_LIMITS.layoutChildren,
): UnoSectionNode[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-children");
  if (value.length < min || value.length > max) {
    throw new RefusedDocument("document:invalid-children");
  }
  const children: UnoSectionNode[] = [];
  for (let index = 0; index < value.length; index += 1) {
    // Sparse arrays are refused rather than read as `undefined`.
    if (!(index in value)) throw new RefusedDocument("document:invalid-children");
    children.push(readNode(value[index], depth, state, seen));
  }
  return children;
}

/**
 * One closed hero action list: bounded, plain, and exactly one destination per entry.
 *
 * `UNO-WO-112 / R01`: the entry is either the unchanged same-document fragment `{label,targetId}` — which still registers
 * its target for the existing anchor check — or one static outbound `{label,href}` admitted only through the unchanged
 * `classifyAuthorDestination` as exactly `mailto` or `https`. Both forms accept the closed optional `variant`. A mixed or
 * destination-less entry is a props refusal before any label is read, so a malformed entry can never be reinterpreted.
 */
function readActionItems(
  value: unknown,
  state: WalkState,
  max: number = UNO_PAGE_DOCUMENT_LIMITS.actionItems,
): UnoHeroActionItem[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < 1 || value.length > max) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoHeroActionItem[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    const isFragment = hasExactlyKeys(item, ["label", "targetId"], ["variant"]);
    const isOutbound = hasExactlyKeys(item, ["label", "href"], ["variant"]);
    // Exactly one destination shape, never both and never neither.
    if (isFragment === isOutbound) throw new RefusedDocument("document:invalid-props");
    const label = readBoundedText(
      item["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const variant = optionalHeroActionVariant(item["variant"]);
    if (isFragment) {
      const targetId = item["targetId"];
      if (typeof targetId !== "string" || !SECTION_ID.test(targetId)) {
        throw new RefusedDocument("document:unsafe-link");
      }
      items.push({ label, targetId, ...(variant === undefined ? {} : { variant }) });
      state.targets.push(targetId);
      continue;
    }
    // A destination that is not even a string is a *shape* refusal; only a string can be an unsafe-link refusal.
    const href = item["href"];
    if (typeof href !== "string") throw new RefusedDocument("document:invalid-props");
    const verdict = classifyAuthorDestination(href);
    if (!verdict.accepted || (verdict.category !== "mailto" && verdict.category !== "https")) {
      throw new RefusedDocument("document:unsafe-link");
    }
    items.push({ label, href: verdict.href, ...(variant === undefined ? {} : { variant }) });
  }
  return items;
}

/** The closed optional hero-action variant, or a props refusal for any other value. */
function optionalHeroActionVariant(value: unknown): UnoHeroActionVariant | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !(UNO_HERO_ACTION_VARIANTS as readonly string[]).includes(value)) {
    throw new RefusedDocument("document:invalid-props");
  }
  return value as UnoHeroActionVariant;
}
/**
 * `UNO-WO-081 / R01`: one closed stand-alone `content.actions` list that accepts a strictly disjoint union.
 *
 * Each entry is exactly `{label,targetId}` — the unchanged same-document fragment, which still registers its target for
 * the existing target verification — or exactly `{label,href}`, whose destination must be classified by the unchanged
 * `classifyAuthorDestination` as precisely `mailto` or `https`. A superset, a mixed pair, an empty entry, a wrong
 * category, an encoded scheme or any other classifier refusal refuses the **whole** Page: no entry is ever dropped, no
 * `targetId` ever falls through to `href`, and no outbound entry invents a `state.targets` fact.
 */
function readContentActions(value: unknown, state: WalkState): UnoContentActionEntry[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < 1 || value.length > UNO_PAGE_DOCUMENT_LIMITS.actionItems) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoContentActionEntry[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    const isFragment = hasExactlyKeys(item, ["label", "targetId"], []);
    const isOutbound = hasExactlyKeys(item, ["label", "href"], []);
    // Exactly one shape, never both and never neither: a mixed or superset entry is a props refusal before any label or
    // destination is read, so a malformed entry can never be reinterpreted as the other form.
    if (isFragment === isOutbound) throw new RefusedDocument("document:invalid-props");
    const label = readBoundedText(
      item["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    if (isFragment) {
      const targetId = item["targetId"];
      if (typeof targetId !== "string" || !SECTION_ID.test(targetId)) {
        throw new RefusedDocument("document:unsafe-link");
      }
      items.push({ label, targetId });
      state.targets.push(targetId);
      continue;
    }
    // A destination that is not even a string is a *shape* refusal; only a string can be a link refusal. This keeps
    // "no destination at all" distinguishable from "a destination Uno refuses to emit".
    const href = item["href"];
    if (typeof href !== "string") throw new RefusedDocument("document:invalid-props");
    const verdict = classifyAuthorDestination(href);
    if (!verdict.accepted || (verdict.category !== "mailto" && verdict.category !== "https")) {
      throw new RefusedDocument("document:unsafe-link");
    }
    items.push({ label, href: verdict.href });
  }
  return items;
}



/** The three optional-value helpers that keep `exactOptionalPropertyTypes` honest. */
function optionalStackProps(gap: unknown, surface: unknown, position: unknown): UnoLayoutStackProps {
  const resolvedSurface = optionalProseSurface(surface);
  const resolvedPosition = optionalSectionPosition(position);
  const props: { gap?: UnoStackGap; surface?: UnoSectionSurface; position?: UnoSectionPosition } = {};
  if (gap !== undefined) {
    if (gap !== "tight" && gap !== "normal" && gap !== "wide") throw new RefusedDocument("document:invalid-props");
    props.gap = gap;
  }
  if (resolvedSurface !== undefined) props.surface = resolvedSurface;
  if (resolvedPosition !== undefined) props.position = resolvedPosition;
  return props;
}

/** `UNO-WO-120 / R01`: the closed two-track section position, or its honest absence. */
function optionalSectionPosition(value: unknown): UnoSectionPosition | undefined {
  if (value === undefined) return undefined;
  if (value === "start" || value === "end") return value;
  throw new RefusedDocument("document:invalid-props");
}

function optionalGridSemantics(itemSemantics: unknown): UnoGridItemSemantics | undefined {
  if (itemSemantics === undefined) return undefined;
  if (itemSemantics === "plain" || itemSemantics === "article") return itemSemantics;
  throw new RefusedDocument("document:invalid-props");
}

/** The grid-only item semantics: the two shared ones plus `list`, which `layout.bento` never accepts. */
function optionalGridItemSemantics(
  itemSemantics: unknown,
): UnoGridItemSemantics | UnoGridListSemantics | undefined {
  if (itemSemantics === undefined) return undefined;
  if (itemSemantics === "plain" || itemSemantics === "article" || itemSemantics === "list") return itemSemantics;
  throw new RefusedDocument("document:invalid-props");
}

/** A two-column ratio; any declared ratio on one, three or four columns is refused rather than ignored. */
function optionalGridRatio(columns: 1 | 2 | 3 | 4, ratio: unknown): UnoGridRatio | undefined {
  if (ratio === undefined) return undefined;
  if (columns !== 2) throw new RefusedDocument("document:invalid-props");
  if (ratio === "equal" || ratio === "start-wide" || ratio === "end-wide") return ratio;
  throw new RefusedDocument("document:invalid-props");
}

/**
 * One array index read as an own **data** property.
 *
 * A sparse index, a getter, or an inherited value is refused, so parsing never executes authored code.
 */
function ownArrayItem(array: readonly unknown[], index: number): unknown {
  const slot = Object.getOwnPropertyDescriptor(array, String(index));
  if (slot === undefined || !("value" in slot)) throw new RefusedDocument("document:invalid-props");
  return slot.value;
}

/** The closed optional callout tone; absent stays absent so no authored field is ever manufactured. */
function optionalProseTone(tone: unknown): UnoProseCalloutTone | undefined {
  if (tone === undefined) return undefined;
  if (tone === "note" || tone === "info" || tone === "warning") return tone;
  throw new RefusedDocument("document:invalid-props");
}

/** One optional non-empty bounded text: absent stays absent, a present value must be safe plain text. */
function optionalProseText(value: unknown, maxCodePoints: number): string | undefined {
  if (value === undefined) return undefined;
  return readBoundedText(value, maxCodePoints, "document:invalid-props", false, false);
}

/**
 * `UNO-WO-116 / R01`: one **Markdown-capable** authored field in its plain form.
 *
 * Every Markdown-capable field is published either as the accepted Markdown AST or as inert plain text; the two forms are
 * one contract, so the plain form cannot be laxer than the Markdown form. A lone or reversed surrogate refuses the field
 * here — by the single shared decision — rather than reaching a visitor as a literal replacement character. Nothing about
 * the plain-text counting contract changes: a well-formed astral pair still counts once, and a plain field that is not
 * Markdown-capable keeps its previous acceptance exactly.
 */
function readMarkdownCapableText(value: unknown, maxCodePoints: number, allowNewlines: boolean): string {
  const text = readBoundedText(value, maxCodePoints, "document:invalid-props", false, allowNewlines);
  if (!isWellFormedUnicodeText(text)) throw new RefusedDocument("document:invalid-props");
  return text;
}

/** One optional Markdown-capable field: absent stays absent, a present value must be safe plain and well-formed text. */
function optionalMarkdownCapableText(
  value: unknown,
  maxCodePoints: number,
  allowNewlines: boolean,
): string | undefined {
  if (value === undefined) return undefined;
  return readMarkdownCapableText(value, maxCodePoints, allowNewlines);
}

/** The closed optional section alignment adopted from the audited Foundation schema. */
function optionalProseAlign(value: unknown): UnoSectionAlign | undefined {
  if (value === undefined) return undefined;
  if (value === "start" || value === "center") return value;
  throw new RefusedDocument("document:invalid-props");
}

/** The closed optional section surface adopted from the audited Foundation schema. */
function optionalProseSurface(value: unknown): UnoSectionSurface | undefined {
  if (value === undefined) return undefined;
  if (value === "plain" || value === "muted" || value === "bordered") return value;
  throw new RefusedDocument("document:invalid-props");
}

/** `markdown` is the literal `true` or absent; a declared `false` is a crossed shape and is refused. */
function optionalProseMarkdown(value: unknown): true | undefined {
  if (value === undefined) return undefined;
  if (value === true) return true;
  throw new RefusedDocument("document:invalid-props");
}

/**
 * One Markdown field, validated by the shared bounded reader.
 *
 * The plain-text reader still runs first, so control characters, markup and encoded schemes are refused by the same rules
 * as every other authored field. A field the Markdown reader refuses (raw HTML, an image, an unsafe destination, an
 * unbalanced construct, ill-formed Unicode or a cap) refuses the document rather than yielding a partial render.
 *
 * `UNO-WO-116 / R02`: the caller passes the field's own newline policy, so a declared-Markdown field keeps exactly the
 * newline rules it had as text instead of borrowing the most permissive one.
 */
function requireFamilyMarkdown(value: unknown, codePointLimit: number, allowNewlines = true): string {
  const text = readBoundedText(value, codePointLimit, "document:invalid-props", false, allowNewlines);
  if (!readUnoFamilyMarkdown(text).ok) throw new RefusedDocument("document:invalid-props");
  return text;
}

/** Read the shared body fields of the legacy and `callout` shapes, preserving exact optional absence. */
function readProseBody(props: DataRecord): UnoContentProseBody {
  const markdown = optionalProseMarkdown(props["markdown"]);
  const text =
    markdown === true
      ? requireFamilyMarkdown(props["text"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints)
      : readMarkdownCapableText(props["text"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, true);
  const heading = optionalProseText(props["heading"], UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints);
  // `UNO-WO-116 / R02`: the plain lede restores its single-line refusal. Only a declared-Markdown lede may span lines —
  // it is parsed as authored Markdown — so a CR, LF or CRLF in an undeclared lede refuses exactly as it did before R01.
  const lede =
    props["lede"] === undefined
      ? undefined
      : markdown === true
        ? requireFamilyMarkdown(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints)
        : optionalMarkdownCapableText(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, false);
  const align = optionalProseAlign(props["align"]);
  const surface = optionalProseSurface(props["surface"]);
  return {
    text,
    ...(heading === undefined ? {} : { heading }),
    ...(lede === undefined ? {} : { lede }),
    ...(align === undefined ? {} : { align }),
    ...(surface === undefined ? {} : { surface }),
    ...(markdown === undefined ? {} : { markdown }),
  };
}

/**
 * Read `content.prose` props as the legacy text form or exactly one of the four closed presentation variants.
 *
 * The legacy form is the **absence** of an own `variant` key, not a `variant:undefined` key: a declared but undefined
 * variant is a crossed shape and is refused. Every variant requires exactly its own keys, so a `table` carrying
 * `text`, a `divider` carrying content, or any extra `href`/`html`/`style` prop refuses the whole document.
 */
function readProseProps(props: DataRecord, state: WalkState): UnoContentProseProps {
  if (!Object.prototype.hasOwnProperty.call(props, "variant")) {
    if (!hasExactlyKeys(props, ["text"], ["heading", "lede", "align", "surface", "markdown"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    return readProseBody(props);
  }

  const variant = props["variant"];

  if (variant === "divider") {
    if (!hasExactlyKeys(props, ["variant"], [])) throw new RefusedDocument("document:invalid-props");
    return { variant: "divider" };
  }

  if (variant === "callout") {
    if (
      !hasExactlyKeys(
        props,
        ["variant", "text"],
        ["tone", "heading", "lede", "align", "surface", "markdown"],
      )
    ) {
      throw new RefusedDocument("document:invalid-props");
    }
    const body = readProseBody(props);
    const tone = optionalProseTone(props["tone"]);
    return tone === undefined ? { variant: "callout", ...body } : { variant: "callout", ...body, tone };
  }

  if (variant === "list") return readProseList(props, state);
  if (variant === "table") return readProseTable(props);

  throw new RefusedDocument("document:invalid-props");
}

/**
 * `UNO-WO-103 / R01`: one authored list-item `href`, admitted only through the unchanged `classifyAuthorDestination`.
 *
 * The reserved `#link:` marker namespace is refused, including percent-encoded and numeric-character-reference
 * obfuscation, so a declared application link can never be laundered into a clickable fragment that merely looks local.
 */
function readListItemHref(value: unknown): string {
  if (typeof value !== "string") throw new RefusedDocument("document:invalid-props");
  const verdict = classifyAuthorDestination(value);
  if (!verdict.accepted) throw new RefusedDocument("document:unsafe-link");
  const probe = verdict.href
    .replace(/&#x([0-9a-f]{1,6});/giu, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]{1,7});/gu, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/%([0-9a-f]{2})/giu, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .toLowerCase();
  if (probe.includes("#link:")) throw new RefusedDocument("document:unsafe-link");
  return verdict.href;
}

/** One `linkId`: a bounded lowercase content slug, never a URL, key, host or scheme. */
function readListItemLinkId(value: unknown): string {
  if (typeof value !== "string") throw new RefusedDocument("document:invalid-props");
  if (value.length === 0 || value.length > 64) throw new RefusedDocument("document:invalid-props");
  if (!APPLICATION_LINK_ID_PATTERN.test(value)) throw new RefusedDocument("document:invalid-props");
  return value;
}

/**
 * `UNO-WO-103 / R01`: the document-local `links` record — at most 32 closed `applicationLink` declarations.
 *
 * A declaration carries only an opaque lowercase key; it can never name a Site, Facet, route, locale, publication state
 * or resolver. Duplicate ids are impossible in an own-data record, and any duplicate JSON member was already refused by
 * the strict reader before this function ran. A declaration nobody references is legal and simply never activates.
 */
function readDocumentLinks(value: unknown): Readonly<Record<string, UnoApplicationLink>> | undefined {
  if (value === undefined) return undefined;
  const record = readPlainData(value);
  if (record === null) throw new RefusedDocument("document:invalid-props");
  const ids = Object.keys(record);
  if (ids.length > 32) throw new RefusedDocument("document:invalid-props");
  const links: Record<string, UnoApplicationLink> = {};
  for (const id of ids) {
    if (id.length === 0 || id.length > 64 || !APPLICATION_LINK_ID_PATTERN.test(id)) {
      throw new RefusedDocument("document:invalid-props");
    }
    const entry = readPlainData(record[id]);
    if (entry === null || !hasExactlyKeys(entry, ["reference", "key"], [])) {
      throw new RefusedDocument("document:invalid-props");
    }
    if (entry["reference"] !== "applicationLink") throw new RefusedDocument("document:invalid-props");
    const key = entry["key"];
    if (typeof key !== "string" || key.length === 0 || key.length > 96 || !APPLICATION_LINK_KEY_PATTERN.test(key)) {
      throw new RefusedDocument("document:invalid-props");
    }
    links[id] = Object.freeze({ reference: "applicationLink" as const, key });
  }
  return Object.freeze(links);
}

/**
 * The bounded `list` variant: 1..12 label/detail entries in authored order, never a raw HTML shape.
 *
 * `UNO-WO-102 / R01`: the donor's `lede` and item `detail` are Markdown-capable and it carries a closed `surface`. When
 * any authored field is Markdown the whole variant switches to the accepted Markdown AST under the single `markdown`
 * flag, so no field is silently printed as syntax. Destinations are **not** read here: `href`/`route`/`link` stay a
 * feature refusal until this build's destination projections are implemented, so no unproven link can ever render.
 */
function readProseList(props: DataRecord, state: WalkState): UnoContentProseProps {
  if (!hasExactlyKeys(props, ["variant", "items"], ["ordered", "lede", "surface", "markdown"])) {
    throw new RefusedDocument("document:invalid-props");
  }
  const markdown = optionalProseMarkdown(props["markdown"]);
  const rawItems = props["items"];
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 12) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoProseListItem[] = [];
  for (let index = 0; index < rawItems.length; index += 1) {
    const entry = readPlainData(ownArrayItem(rawItems, index));
    if (entry === null || !hasExactlyKeys(entry, ["label"], ["detail", "href", "linkId", "routeTarget"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    // Exactly one destination form, or none: two destinations on one item is a crossed shape and is refused.
    const destinations = ["href", "linkId", "routeTarget"].filter((name) =>
      Object.prototype.hasOwnProperty.call(entry, name),
    );
    if (destinations.length > 1) throw new RefusedDocument("document:invalid-props");
    const label = readBoundedText(
      entry["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const detail =
      entry["detail"] === undefined
        ? undefined
        : markdown === true
          ? requireFamilyMarkdown(entry["detail"], UNO_PAGE_DOCUMENT_LIMITS.statDetailCodePoints)
          : optionalMarkdownCapableText(entry["detail"], UNO_PAGE_DOCUMENT_LIMITS.statDetailCodePoints, false);
    const base = detail === undefined ? { label } : { label, detail };
    if (Object.prototype.hasOwnProperty.call(entry, "href")) {
      items.push({ ...base, href: readListItemHref(entry["href"]) });
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(entry, "linkId")) {
      const linkId = readListItemLinkId(entry["linkId"]);
      state.linkIds.push(linkId);
      items.push({ ...base, linkId });
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(entry, "routeTarget")) {
      // `UNO-WO-104 / R01`: a purely lexical site-local intent. It never becomes an `href` here; the serving boundary must
      // prove the same-Site, same-locale, public publication separately or refuse the whole Page.
      const routeTarget = entry["routeTarget"];
      if (typeof routeTarget !== "string" || !isPageRoutePath(routeTarget)) {
        throw new RefusedDocument("document:invalid-props");
      }
      items.push({ ...base, routeTarget });
      continue;
    }
    items.push(base);
  }
  const ordered = props["ordered"];
  if (ordered !== undefined && typeof ordered !== "boolean") throw new RefusedDocument("document:invalid-props");
  const lede =
    props["lede"] === undefined
      ? undefined
      : markdown === true
        ? requireFamilyMarkdown(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints)
        : optionalMarkdownCapableText(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, false);
  const surface = optionalProseSurface(props["surface"]);
  return {
    variant: "list",
    items,
    ...(ordered === undefined ? {} : { ordered }),
    ...(lede === undefined ? {} : { lede }),
    ...(surface === undefined ? {} : { surface }),
    ...(markdown === undefined ? {} : { markdown }),
  };
}

/**
 * The bounded `table` variant: 1..6 plain-text column labels and 1..20 rows of exactly that width.
 *
 * A ragged, sparse, empty or non-array row refuses the document; nothing is sorted, padded or reinterpreted.
 */
function readProseTable(props: DataRecord): UnoContentProseProps {
  if (!hasExactlyKeys(props, ["variant", "columns", "rows"], ["caption", "lede", "surface", "markdown"])) {
    throw new RefusedDocument("document:invalid-props");
  }
  const markdown = optionalProseMarkdown(props["markdown"]);
  const rawColumns = props["columns"];
  const rawRows = props["rows"];
  if (!Array.isArray(rawColumns) || rawColumns.length < 1 || rawColumns.length > 6) {
    throw new RefusedDocument("document:invalid-props");
  }
  if (!Array.isArray(rawRows) || rawRows.length < 1 || rawRows.length > 20) {
    throw new RefusedDocument("document:invalid-props");
  }
  const columns: string[] = [];
  for (let index = 0; index < rawColumns.length; index += 1) {
    columns.push(
      readBoundedText(
        ownArrayItem(rawColumns, index),
        UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
        "document:invalid-props",
        false,
        false,
      ),
    );
  }
  const rows: string[][] = [];
  for (let index = 0; index < rawRows.length; index += 1) {
    const rawRow = ownArrayItem(rawRows, index);
    if (!Array.isArray(rawRow) || rawRow.length !== columns.length) {
      throw new RefusedDocument("document:invalid-props");
    }
    const row: string[] = [];
    for (let column = 0; column < columns.length; column += 1) {
      row.push(
        readBoundedText(
          ownArrayItem(rawRow, column),
          UNO_PAGE_DOCUMENT_LIMITS.statDetailCodePoints,
          "document:invalid-props",
          false,
          false,
        ),
      );
    }
    rows.push(row);
  }
  const caption =
    props["caption"] === undefined
      ? undefined
      : markdown === true
        ? requireFamilyMarkdown(props["caption"], UNO_PAGE_DOCUMENT_LIMITS.statDetailCodePoints)
        : optionalMarkdownCapableText(props["caption"], UNO_PAGE_DOCUMENT_LIMITS.statDetailCodePoints, false);
  const lede =
    props["lede"] === undefined
      ? undefined
      : markdown === true
        ? requireFamilyMarkdown(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints)
        : optionalMarkdownCapableText(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, false);
  const surface = optionalProseSurface(props["surface"]);
  return {
    variant: "table",
    columns,
    rows,
    ...(caption === undefined ? {} : { caption }),
    ...(lede === undefined ? {} : { lede }),
    ...(surface === undefined ? {} : { surface }),
    ...(markdown === undefined ? {} : { markdown }),
  };
}

/** The closed optional surface of the three new content modules. */
function optionalSurface(surface: unknown): UnoSectionSurface | undefined {
  if (surface === undefined) return undefined;
  if (surface === "plain" || surface === "muted" || surface === "bordered") return surface;
  throw new RefusedDocument("document:invalid-props");
}

/** The closed optional alignment of the three new content modules. */
function optionalAlign(align: unknown): UnoSectionAlign | undefined {
  if (align === undefined) return undefined;
  if (align === "start" || align === "center") return align;
  throw new RefusedDocument("document:invalid-props");
}

/**
 * `UNO-WO-080 / R01`: one optional presentation switch that can only ever mean "render this item title as an `<h3>`".
 *
 * Absence is decided by the own key, not by the read value, so an authored `undefined`, `null`, `0`–`2`, `4`, `"3"`,
 * `false` or `NaN` is the same closed props refusal as any other malformed props record. Only the numeric literal `3`
 * is accepted, and a record without the key keeps its exact previous shape and serialization.
 */
function optionalLevelThree(record: DataRecord, key: string): 3 | undefined {
  if (!Object.prototype.hasOwnProperty.call(record, key)) return undefined;
  if (record[key] !== 3) throw new RefusedDocument("document:invalid-props");
  return 3;
}

/**
 * One optional authored text: absent stays absent, and a present value must be safe and non-empty.
 *
 * `undefined` is the ONLY way to be absent. An empty or whitespace-only string is an authored mistake that would
 * render an empty element, so it refuses instead of disappearing silently.
 */
function optionalBoundedText(
  value: unknown,
  maxCodePoints: number,
  allowNewlines: boolean,
): string | undefined {
  if (value === undefined) return undefined;
  return readBoundedText(value, maxCodePoints, "document:invalid-props", false, allowNewlines);
}

/** 1–6 factual statistics, each exactly `{value, label, detail?}`. Numbers are authored text, never computed. */
function readStatItems(value: unknown, markdown: boolean): UnoStatItem[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < 1 || value.length > UNO_PAGE_DOCUMENT_LIMITS.statItems) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoStatItem[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(item, ["value", "label"], ["detail"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const statValue = readBoundedText(
      item["value"],
      UNO_PAGE_DOCUMENT_LIMITS.statValueCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const label = readBoundedText(
      item["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    // `UNO-WO-116 / R01`: the item detail is Markdown-capable, so its plain form must be well-formed too.
    // `UNO-WO-116 / R02`: a declared-Markdown detail must parse by the shared reader, under the same single-line policy.
    const detail =
      item["detail"] === undefined
        ? undefined
        : markdown
          ? requireFamilyMarkdown(item["detail"], UNO_PAGE_DOCUMENT_LIMITS.statDetailCodePoints, false)
          : optionalMarkdownCapableText(item["detail"], UNO_PAGE_DOCUMENT_LIMITS.statDetailCodePoints, false);
    items.push(detail === undefined ? { value: statValue, label } : { value: statValue, label, detail });
  }
  return items;
}

/**
 * 1–6 bounded authored quotations, each exactly `{quote, attribution?, role?}`; nothing is ever fabricated.
 *
 * `UNO-WO-117 / R01`: the donor `quote.body` is Markdown-capable, so the quotation is read as a Markdown-capable field —
 * its plain form is held to the same Unicode well-formedness decision, and a node that declares `markdown: true` must
 * also parse by the shared reader, so no accepted Page can fall back to printing raw syntax. `attribution` and `role`
 * stay plain single-line labels: the donor authors them as plain text and a role is a caption, never a quotation.
 */
function readTestimonialItems(value: unknown, markdown: boolean): UnoTestimonialItem[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < 1 || value.length > UNO_PAGE_DOCUMENT_LIMITS.testimonialItems) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoTestimonialItem[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(item, ["quote"], ["attribution", "role"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    // The quotation keeps the multi-line policy it has always had; declaring Markdown adds the parse requirement only.
    const quote = markdown
      ? requireFamilyMarkdown(item["quote"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints)
      : readMarkdownCapableText(item["quote"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, true);
    const attribution = optionalBoundedText(item["attribution"], UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints, false);
    const role = optionalBoundedText(item["role"], UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints, false);
    items.push({
      quote,
      ...(attribution === undefined ? {} : { attribution }),
      ...(role === undefined ? {} : { role }),
    });
  }
  return items;
}

/**
 * One authored price list, each entry exactly `{label, amount, unit?, description?, featured?}`.
 *
 * `amount` is authored text, so this contract cannot compute, convert, discount or format it; at most one entry may
 * declare `featured: true`, because a price list with two highlighted offers states two priorities at once.
 */
function readPricingItems(value: unknown): UnoPricingItem[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < 1 || value.length > UNO_PAGE_DOCUMENT_LIMITS.pricingItems) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoPricingItem[] = [];
  let featuredCount = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(item, ["label", "amount"], ["unit", "description", "featured"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const label = readBoundedText(
      item["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const amount = readBoundedText(
      item["amount"],
      UNO_PAGE_DOCUMENT_LIMITS.priceAmountCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const unit = optionalBoundedText(item["unit"], UNO_PAGE_DOCUMENT_LIMITS.priceUnitCodePoints, false);
    const itemDescription = optionalBoundedText(
      item["description"],
      UNO_PAGE_DOCUMENT_LIMITS.pricingDescriptionCodePoints,
      false,
    );
    const rawFeatured = item["featured"];
    if (rawFeatured !== undefined && typeof rawFeatured !== "boolean") {
      throw new RefusedDocument("document:invalid-props");
    }
    if (rawFeatured === true) {
      featuredCount += 1;
      if (featuredCount > 1) throw new RefusedDocument("document:invalid-props");
    }
    items.push({
      label,
      amount,
      ...(unit === undefined ? {} : { unit }),
      ...(itemDescription === undefined ? {} : { description: itemDescription }),
      ...(rawFeatured === undefined ? {} : { featured: rawFeatured }),
    });
  }
  return items;
}

/** The three closed milestone statuses, read as one literal so a misspelling can never reach the renderer. */
function optionalTimelineStatus(value: unknown): UnoTimelineStatus | undefined {
  if (value === undefined) return undefined;
  if (value === "complete" || value === "current" || value === "upcoming") return value;
  throw new RefusedDocument("document:invalid-props");
}

/**
 * One authored ordered milestone list, each entry exactly `{title, description?, dateLabel?, status?}`.
 *
 * Order is the author's own and is never sorted, and at most one entry may be `current`: two simultaneous "current"
 * milestones would be a contradictory statement about the programme this Page describes.
 */
function readTimelineItems(value: unknown, markdown: boolean): UnoTimelineItem[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < 1 || value.length > UNO_PAGE_DOCUMENT_LIMITS.timelineItems) {
    throw new RefusedDocument("document:invalid-props");
  }
  const items: UnoTimelineItem[] = [];
  let currentCount = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(item, ["title"], ["description", "dateLabel", "status"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const title = readBoundedText(
      item["title"],
      UNO_PAGE_DOCUMENT_LIMITS.timelineTitleCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    // `UNO-WO-116 / R01`: the milestone description is Markdown-capable, so its plain form must be well-formed too.
    // `UNO-WO-116 / R02`: a declared-Markdown description must parse by the shared reader, under the same single-line policy.
    const itemDescription =
      item["description"] === undefined
        ? undefined
        : markdown
          ? requireFamilyMarkdown(item["description"], UNO_PAGE_DOCUMENT_LIMITS.timelineDescriptionCodePoints, false)
          : optionalMarkdownCapableText(
              item["description"],
              UNO_PAGE_DOCUMENT_LIMITS.timelineDescriptionCodePoints,
              false,
            );
    const dateLabel = optionalBoundedText(item["dateLabel"], UNO_PAGE_DOCUMENT_LIMITS.timelineDateLabelCodePoints, false);
    const status = optionalTimelineStatus(item["status"]);
    if (status === "current") {
      currentCount += 1;
      if (currentCount > 1) throw new RefusedDocument("document:invalid-props");
    }
    items.push({
      title,
      ...(itemDescription === undefined ? {} : { description: itemDescription }),
      ...(dateLabel === undefined ? {} : { dateLabel }),
      ...(status === undefined ? {} : { status }),
    });
  }
  return items;
}

/**
 * One positional bento tile list: exactly one tile per child, in child order, naming that same child.
 *
 * The tile cannot introduce a section, omit one, repeat one or size a section that is not its own sibling, and at
 * least one span must be non-`standard` so a "bento" that is really an even grid is refused rather than mislabelled.
 */
function readBentoTiles(value: unknown, children: readonly UnoSectionNode[]): UnoBentoTile[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length !== children.length) throw new RefusedDocument("document:invalid-props");
  const tiles: UnoBentoTile[] = [];
  const claimed = new Set<string>();
  let hasAsymmetricSpan = false;
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const tile = readPlainData(value[index]);
    if (tile === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(tile, ["sectionId", "span"], [])) throw new RefusedDocument("document:invalid-props");
    const child = children[index];
    if (child === undefined) throw new RefusedDocument("document:invalid-props");
    const sectionId = tile["sectionId"];
    if (typeof sectionId !== "string" || !SECTION_ID.test(sectionId)) {
      throw new RefusedDocument("document:invalid-props");
    }
    if (sectionId !== child.id) throw new RefusedDocument("document:invalid-props");
    if (claimed.has(sectionId)) throw new RefusedDocument("document:invalid-props");
    claimed.add(sectionId);
    const span = tile["span"];
    if (span !== "standard" && span !== "wide" && span !== "tall" && span !== "feature") {
      throw new RefusedDocument("document:invalid-props");
    }
    if (span !== "standard") hasAsymmetricSpan = true;
    tiles.push({ sectionId, span });
  }
  if (!hasAsymmetricSpan) throw new RefusedDocument("document:invalid-props");
  return tiles;
}

/**
 * One optional authored section heading and its closed level, obeying the incremental Page heading contract.
 *
 * `level` is required exactly when a heading is authored: a level with no heading would imply a heading this module
 * does not render, and a heading with no level would leave its rank to guesswork. A present heading must also obey
 * `lastHeadingLevel + 1`, exactly as `content.heading` does, so no module can skip a level in the outline.
 */
function readOptionalHeading(
  props: DataRecord,
  state: WalkState,
): { readonly heading: string | undefined; readonly level: 2 | 3 | 4 | 5 | 6 | undefined } {
  const heading = optionalBoundedText(props["heading"], UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints, true);
  const rawLevel = props["level"];
  if (heading === undefined) {
    if (rawLevel !== undefined) throw new RefusedDocument("document:invalid-props");
    return { heading, level: undefined };
  }
  if (rawLevel !== 2 && rawLevel !== 3 && rawLevel !== 4 && rawLevel !== 5 && rawLevel !== 6) {
    throw new RefusedDocument("document:invalid-props");
  }
  if (rawLevel > state.lastHeadingLevel + 1) throw new RefusedDocument("document:heading-order");
  state.lastHeadingLevel = rawLevel;
  return { heading, level: rawLevel };
}

/** One authored owned-asset reference for one purpose, or a props refusal. */
function readOwnedAsset(value: unknown, purpose: UnoOwnedMediaPurpose): UnoOwnedAssetRef {
  const decision = readUnoOwnedAssetRef(value, purpose);
  if (!decision.ok) throw new RefusedDocument("document:invalid-props");
  return decision.decision.ref;
}

/**
 * One optional `media.image` caption in its **native plain** form; an absent caption stays absent rather than becoming an
 * empty string.
 *
 * `UNO-WO-120 / R02`: this form keeps its 320-point bound and its newline and unsafe-text policies exactly, and now shares the
 * one well-formedness decision with the declared-Markdown form — an unpaired surrogate refuses here too instead of reaching a
 * visitor as a literal replacement character. Only this native `media.image` field gains the decision; no other plain field,
 * gallery item, carousel item or video caption changes.
 */
function optionalMediaCaption(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return readMarkdownCapableText(value, UNO_PAGE_DOCUMENT_LIMITS.mediaCaptionCodePoints, true);
}

/** One optional media caption; an absent caption stays absent rather than becoming an empty string. */
function readOptionalCaption(value: unknown): string | undefined {
  return optionalBoundedText(value, UNO_PAGE_DOCUMENT_LIMITS.mediaCaptionCodePoints, true);
}

/**
 * One bounded ordered media item list for `media.gallery` and `media.carousel`.
 *
 * Every item carries its own owned asset and its own non-empty authored alternative, so no item can inherit, borrow or
 * silently reuse a neighbour's description. Captions are optional and never invented.
 */
function readMediaItems(value: unknown, min: number, max: number): UnoMediaItem[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length < min || value.length > max) throw new RefusedDocument("document:invalid-props");
  const items: UnoMediaItem[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const item = readPlainData(value[index]);
    if (item === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(item, ["asset", "alt"], ["caption"])) throw new RefusedDocument("document:invalid-props");
    const asset = readOwnedAsset(item["asset"], "image");
    const alt = readBoundedText(
      item["alt"],
      UNO_PAGE_DOCUMENT_LIMITS.mediaAltCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const caption = readOptionalCaption(item["caption"]);
    items.push({ asset, alt, ...(caption === undefined ? {} : { caption }) });
  }
  return items;
}

/**
 * One positional panel-entry list for `interaction.tabs` and `interaction.accordion`.
 *
 * Exactly one entry per child, in child order, naming that same child: a tab list cannot introduce a panel, omit one,
 * repeat one or point at a sibling that is not its own child. Labels are bounded authored text and never derived from
 * the child's content, so a tab label cannot silently borrow a heading.
 */
function readPanelEntries(
  value: unknown,
  children: readonly UnoSectionNode[],
  min: number,
  max: number,
): { readonly sectionId: string; readonly label: string }[] {
  if (!Array.isArray(value)) throw new RefusedDocument("document:invalid-props");
  if (value.length !== children.length) throw new RefusedDocument("document:invalid-props");
  if (value.length < min || value.length > max) throw new RefusedDocument("document:invalid-props");
  const entries: { readonly sectionId: string; readonly label: string }[] = [];
  const claimed = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) throw new RefusedDocument("document:invalid-props");
    const entry = readPlainData(value[index]);
    if (entry === null) throw new RefusedDocument("document:invalid-props");
    if (!hasExactlyKeys(entry, ["sectionId", "label"], [])) throw new RefusedDocument("document:invalid-props");
    const child = children[index];
    if (child === undefined) throw new RefusedDocument("document:invalid-props");
    const sectionId = entry["sectionId"];
    if (typeof sectionId !== "string" || !SECTION_ID.test(sectionId)) {
      throw new RefusedDocument("document:invalid-props");
    }
    if (sectionId !== child.id) throw new RefusedDocument("document:invalid-props");
    if (claimed.has(sectionId)) throw new RefusedDocument("document:invalid-props");
    claimed.add(sectionId);
    const label = readBoundedText(
      entry["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    entries.push({ sectionId, label });
  }
  return entries;
}

/** One bounded, duplicate-free contact field list. Absent means "no fields", never "all fields". */
function readContactFields(value: unknown): UnoContactField[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    throw new RefusedDocument("document:invalid-props");
  }
  const fields: UnoContactField[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const field = value[index];
    if (field !== "name" && field !== "email" && field !== "message") {
      throw new RefusedDocument("document:invalid-props");
    }
    if (seen.has(field)) throw new RefusedDocument("document:invalid-props");
    seen.add(field);
    fields.push(field);
  }
  return fields;
}

/** The three closed watermark alignments, or `undefined`. */
function optionalWatermarkAlign(value: unknown): UnoWatermarkAlign | undefined {
  if (value === undefined) return undefined;
  if (value === "start" || value === "center" || value === "end") return value;
  throw new RefusedDocument("document:invalid-props");
}

/** The two closed watermark strengths, or `undefined`. */
function optionalWatermarkStrength(value: unknown): UnoWatermarkStrength | undefined {
  if (value === undefined) return undefined;
  if (value === "subtle" || value === "regular") return value;
  throw new RefusedDocument("document:invalid-props");
}

/** The three closed motion effects, or `undefined`. */
function optionalMotionEffect(value: unknown): UnoMotionEffect | undefined {
  if (value === undefined) return undefined;
  if (value === "fade" || value === "rise" || value === "none") return value;
  throw new RefusedDocument("document:invalid-props");
}

/** The two closed motion speeds, or `undefined`. */
function optionalMotionSpeed(value: unknown): UnoMotionSpeed | undefined {
  if (value === undefined) return undefined;
  if (value === "short" || value === "normal") return value;
  throw new RefusedDocument("document:invalid-props");
}


/**
 * Validate one section node, its closed props and — for the two layouts — its typed children.
 *
 * Order matters: the identifier is claimed first so a duplicate is reported as a duplicate rather than as
 * whatever else is wrong with the node, and the module literal is checked against the immutable registry
 * before `document:renderer-unavailable` can be claimed, so the two module refusals stay distinguishable.
 */
function readNode(value: unknown, depth: number, state: WalkState, seen: WeakSet<object>): UnoSectionNode {
  if (depth > UNO_PAGE_DOCUMENT_LIMITS.depth) throw new RefusedDocument("document:too-deep");
  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) throw new RefusedDocument("document:cyclic");
    seen.add(value);
  }

  const record = readPlainData(value);
  if (record === null) throw new RefusedDocument("document:invalid-section");

  state.nodes += 1;
  if (state.nodes > UNO_PAGE_DOCUMENT_LIMITS.nodes) throw new RefusedDocument("document:too-many-nodes");

  const id = record["id"];
  if (typeof id !== "string" || !SECTION_ID.test(id)) throw new RefusedDocument("document:invalid-section-id");
  if (state.ids.has(id)) throw new RefusedDocument("document:duplicate-section-id");
  state.ids.add(id);

  const moduleName = record["module"];
  if (typeof moduleName !== "string" || moduleName.length === 0) {
    throw new RefusedDocument("document:invalid-section");
  }
  if (!isCapabilityId(moduleName)) throw new RefusedDocument("document:unknown-module");
  if (!(UNO_RENDERABLE_MODULES as readonly string[]).includes(moduleName)) {
    throw new RefusedDocument("document:renderer-unavailable");
  }

  const ownsChildren = CHILD_BEARING_MODULES.includes(moduleName);
  const requiredKeys = ownsChildren ? ["id", "module", "props", "children"] : ["id", "module", "props"];
  if (!hasExactlyKeys(record, requiredKeys, [])) {
    throw new RefusedDocument(ownsChildren ? "document:invalid-children" : "document:invalid-section");
  }

  const props = readPlainData(record["props"]);
  if (props === null) throw new RefusedDocument("document:invalid-props");

  if (moduleName === "layout.stack") {
    if (!hasExactlyKeys(props, [], ["gap", "surface", "position"])) throw new RefusedDocument("document:invalid-props");
    const stackProps = optionalStackProps(props["gap"], props["surface"], props["position"]);
    const children = readChildren(record["children"], depth + 1, state, seen);
    return { id, module: "layout.stack", props: stackProps, children };
  }

  if (moduleName === "layout.grid") {
    if (!hasExactlyKeys(props, ["columns"], ["itemSemantics", "ratio"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const columns = props["columns"];
    if (columns !== 1 && columns !== 2 && columns !== 3 && columns !== 4) {
      throw new RefusedDocument("document:invalid-props");
    }
    const itemSemantics = optionalGridItemSemantics(props["itemSemantics"]);
    const ratio = optionalGridRatio(columns, props["ratio"]);
    const children = readChildren(record["children"], depth + 1, state, seen);
    const gridProps: UnoLayoutGridProps = {
      columns,
      ...(itemSemantics === undefined ? {} : { itemSemantics }),
      ...(ratio === undefined ? {} : { ratio }),
    };
    return { id, module: "layout.grid", props: gridProps, children };
  }

  if (moduleName === "layout.bento") {
    if (!hasExactlyKeys(props, ["columns", "tiles"], ["itemSemantics"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const columns = props["columns"];
    if (columns !== 2 && columns !== 3 && columns !== 4) {
      throw new RefusedDocument("document:invalid-props");
    }
    const itemSemantics = optionalGridSemantics(props["itemSemantics"]);
    const children = readChildren(record["children"], depth + 1, state, seen);
    // A bento is an asymmetric composition, so a single tile or a single column count it cannot express is refused.
    if (children.length < 2) throw new RefusedDocument("document:invalid-children");
    const tiles = readBentoTiles(props["tiles"], children);
    const bentoProps: UnoLayoutBentoProps =
      itemSemantics === undefined ? { columns, tiles } : { columns, itemSemantics, tiles };
    return { id, module: "layout.bento", props: bentoProps, children };
  }

  if (moduleName === "content.heading") {
    if (!hasExactlyKeys(props, ["text", "level"], [])) throw new RefusedDocument("document:invalid-props");
    const text = readBoundedText(
      props["text"],
      UNO_PAGE_DOCUMENT_LIMITS.textCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const level = props["level"];
    if (level !== 2 && level !== 3 && level !== 4 && level !== 5 && level !== 6) {
      throw new RefusedDocument("document:invalid-props");
    }
    // The Page `h1` is the App Router's alone, so a document may never begin below it by more than one level.
    if (level > state.lastHeadingLevel + 1) throw new RefusedDocument("document:heading-order");
    state.lastHeadingLevel = level;
    return { id, module: "content.heading", props: { text, level } };
  }

  if (moduleName === "content.prose") {
    return { id, module: "content.prose", props: readProseProps(props, state) };
  }

  if (moduleName === "content.actions") {
    if (!hasExactlyKeys(props, ["items"], [])) throw new RefusedDocument("document:invalid-props");
    // `UNO-WO-081 / R01`: only this stand-alone module reads the disjoint union; `content.hero` keeps `readActionItems`.
    const items = readContentActions(props["items"], state);
    return { id, module: "content.actions", props: { items } };
  }

  if (moduleName === "content.hero") {
    if (
      !hasExactlyKeys(props, [], ["eyebrow", "lede", "support", "align", "surface", "actions", "markdown"])
    ) {
      throw new RefusedDocument("document:invalid-props");
    }
    const eyebrow = optionalBoundedText(props["eyebrow"], UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints, false);
    // `UNO-WO-112 / R01`: the closed Markdown switch — only ever the literal `true`, never a truthy stand-in.
    const markdown = optionalProseMarkdown(props["markdown"]);
    // `UNO-WO-116 / R01`: both body fields are Markdown-capable, so their plain form is held to the same
    // well-formedness decision as the Markdown form — a malformed field refuses the Page instead of rendering literally.
    // `UNO-WO-116 / R02`: a declared-Markdown field must also *parse* here, so the renderer can never fall back to printing
    // raw syntax as if it were the authored meaning.
    const lede =
      props["lede"] === undefined
        ? undefined
        : markdown === true
          ? requireFamilyMarkdown(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints)
          : optionalMarkdownCapableText(props["lede"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, true);
    const support =
      props["support"] === undefined
        ? undefined
        : markdown === true
          ? requireFamilyMarkdown(props["support"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints)
          : optionalMarkdownCapableText(props["support"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, true);
    // A hero with no authored body would be an empty decorative band, so at least one body field is required.
    if (lede === undefined && support === undefined) throw new RefusedDocument("document:invalid-props");
    const align = optionalAlign(props["align"]);
    const surface = optionalSurface(props["surface"]);
    const actions =
      props["actions"] === undefined
        ? undefined
        : readActionItems(props["actions"], state, UNO_PAGE_DOCUMENT_LIMITS.heroActions);
    return {
      id,
      module: "content.hero",
      props: {
        ...(eyebrow === undefined ? {} : { eyebrow }),
        ...(lede === undefined ? {} : { lede }),
        ...(support === undefined ? {} : { support }),
        ...(align === undefined ? {} : { align }),
        ...(surface === undefined ? {} : { surface }),
        ...(actions === undefined ? {} : { actions }),
        ...(markdown === undefined ? {} : { markdown }),
      },
    };
  }

  if (moduleName === "content.stats") {
    if (!hasExactlyKeys(props, ["items"], ["heading", "level", "surface", "markdown"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    // `UNO-WO-113 / R01`: the closed Markdown switch for item details — only ever the literal `true`.
    const markdown = optionalProseMarkdown(props["markdown"]);
    const items = readStatItems(props["items"], markdown === true);
    const surface = optionalSurface(props["surface"]);
    // Items first, then surface, then heading: a stats item refusal always outranks a heading-level refusal.
    const { heading, level } = readOptionalHeading(props, state);
    return {
      id,
      module: "content.stats",
      props: {
        items,
        ...(heading === undefined ? {} : { heading }),
        ...(level === undefined ? {} : { level }),
        ...(surface === undefined ? {} : { surface }),
        ...(markdown === undefined ? {} : { markdown }),
      },
    };
  }

  if (moduleName === "content.testimonials") {
    if (!hasExactlyKeys(props, ["items"], ["align", "surface", "markdown"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    // `UNO-WO-117 / R01`: the closed Markdown switch for the quotation body — only ever the literal `true`.
    const markdown = optionalProseMarkdown(props["markdown"]);
    const items = readTestimonialItems(props["items"], markdown === true);
    const align = optionalAlign(props["align"]);
    const surface = optionalSurface(props["surface"]);
    return {
      id,
      module: "content.testimonials",
      props: {
        items,
        ...(align === undefined ? {} : { align }),
        ...(surface === undefined ? {} : { surface }),
        ...(markdown === undefined ? {} : { markdown }),
      },
    };
  }

  if (moduleName === "content.pricing") {
    if (!hasExactlyKeys(props, ["items"], ["heading", "level", "surface"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const items = readPricingItems(props["items"]);
    const surface = optionalSurface(props["surface"]);
    const { heading, level } = readOptionalHeading(props, state);
    return {
      id,
      module: "content.pricing",
      props: {
        items,
        ...(heading === undefined ? {} : { heading }),
        ...(level === undefined ? {} : { level }),
        ...(surface === undefined ? {} : { surface }),
      },
    };
  }

  if (moduleName === "content.timeline") {
    if (!hasExactlyKeys(props, ["items"], ["heading", "level", "surface", "itemHeadingLevel", "markdown"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    // `UNO-WO-114 / R01`: the closed Markdown switch for milestone descriptions — only ever the literal `true`.
    const markdown = optionalProseMarkdown(props["markdown"]);
    const items = readTimelineItems(props["items"], markdown === true);
    const surface = optionalSurface(props["surface"]);
    const { heading, level } = readOptionalHeading(props, state);
    const itemHeadingLevel = optionalLevelThree(props, "itemHeadingLevel");
    return {
      id,
      module: "content.timeline",
      props: {
        items,
        ...(heading === undefined ? {} : { heading }),
        ...(level === undefined ? {} : { level }),
        ...(surface === undefined ? {} : { surface }),
        ...(itemHeadingLevel === undefined ? {} : { itemHeadingLevel }),
        ...(markdown === undefined ? {} : { markdown }),
      },
    };
  }

  if (moduleName === "layout.layers") {
    if (!hasExactlyKeys(props, ["mode"], ["align"])) throw new RefusedDocument("document:invalid-props");
    const mode = props["mode"];
    if (mode !== "stack" && mode !== "overlap") throw new RefusedDocument("document:invalid-props");
    const align = optionalAlign(props["align"]);
    const children = readChildren(
      record["children"],
      depth + 1,
      state,
      seen,
      2,
      UNO_PAGE_DOCUMENT_LIMITS.layerChildren,
    );
    const layersProps: UnoLayoutLayersProps = align === undefined ? { mode } : { mode, align };
    return { id, module: "layout.layers", props: layersProps, children };
  }

  if (moduleName === "media.image") {
    // `UNO-WO-120 / R03`: the **native input boundary is unchanged** — both `asset` and `alt` are required keys, exactly as they
    // were before the donor family was adopted. The donor's own optional boolean is a *source* shape: the adapter reads an
    // omitted donor `alt` beside `decorative: true` and emits the native `alt: ""` before this reader ever sees it. A direct
    // native object or raw JSON document that omits `alt` therefore refuses here even with the decorative flag, so adopting the
    // donor capability never widened what a native document may say.
    if (!hasExactlyKeys(props, ["asset", "alt"], ["decorative", "caption", "markdown"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const rawDecorative = props["decorative"];
    if (rawDecorative !== undefined && typeof rawDecorative !== "boolean") {
      throw new RefusedDocument("document:invalid-props");
    }
    const decorative = rawDecorative === true;
    const asset = readOwnedAsset(props["asset"], "image");
    // A decorative image is announced as nothing, so its `alt` must be exactly empty; a meaningful one must say something.
    // `UNO-WO-120 / R03`: this is the original native semantics, restored verbatim — the empty value is authored or normalized
    // by the adapter, never borrowed from absence, and the 320-code-point bound is untouched.
    const alt = readBoundedText(
      props["alt"],
      UNO_PAGE_DOCUMENT_LIMITS.mediaAltCodePoints,
      "document:invalid-props",
      decorative,
      false,
    );
    if (decorative && alt.length !== 0) throw new RefusedDocument("document:invalid-props");
    // `UNO-WO-120 / R01`: the two caption forms are disjoint. A declared Markdown caption is the donor's form and is read at
    // the donor's bound; anything else keeps the native plain caption and its unchanged 320-point bound.
    // `UNO-WO-120 / R02`: both forms share the one well-formedness decision, so no lone surrogate reaches a visitor as a
    // literal replacement character through the unflagged form while the flagged one refuses it.
    const markdown = optionalProseMarkdown(props["markdown"]);
    if (markdown === true && props["caption"] === undefined) throw new RefusedDocument("document:invalid-props");
    const caption =
      markdown === true
        ? requireFamilyMarkdown(props["caption"], UNO_PAGE_DOCUMENT_LIMITS.mediaCaptionMarkdownCodePoints)
        : optionalMediaCaption(props["caption"]);
    return {
      id,
      module: "media.image",
      props: {
        asset,
        alt,
        ...(rawDecorative === undefined ? {} : { decorative }),
        ...(caption === undefined ? {} : { caption }),
        ...(markdown === undefined ? {} : { markdown }),
      },
    };
  }

  if (moduleName === "media.video") {
    // One strict discriminated union. `source` selects external mode; native mode is the absence of `source` and keeps
    // its original shape. A mixed form is not repaired: it fails `hasExactlyKeys` in whichever branch it lands in.
    if (Object.prototype.hasOwnProperty.call(props, "source")) {
      if (!hasExactlyKeys(props, ["source", "provider", "videoId", "title"], ["privacyHash", "description"])) {
        throw new RefusedDocument("document:invalid-props");
      }
      if (props["source"] !== "external") throw new RefusedDocument("document:invalid-props");
      const provider = props["provider"];
      if (!isUnoVideoProvider(provider)) throw new RefusedDocument("document:invalid-props");
      const videoId = props["videoId"];
      if (typeof videoId !== "string") throw new RefusedDocument("document:invalid-props");
      const rawPrivacyHash = props["privacyHash"];
      if (rawPrivacyHash !== undefined && typeof rawPrivacyHash !== "string") {
        throw new RefusedDocument("document:invalid-props");
      }
      // The pure policy is the only place a provider destination is constructed. `privacyHash` is the authored name;
      // the policy's `vimeoHash` is the same value under its own vocabulary.
      const embed = readUnoVideoEmbed({
        provider,
        videoId,
        ...(rawPrivacyHash === undefined ? {} : { vimeoHash: rawPrivacyHash }),
      });
      if (!embed.ok) throw new RefusedDocument("document:invalid-props");
      const externalTitle = readBoundedText(
        props["title"],
        UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
        "document:invalid-props",
        false,
        false,
      );
      const externalDescription = optionalBoundedText(
        props["description"],
        UNO_PAGE_DOCUMENT_LIMITS.textCodePoints,
        true,
      );
      return {
        id,
        module: "media.video",
        props: {
          source: "external",
          provider,
          videoId,
          title: externalTitle,
          ...(rawPrivacyHash === undefined ? {} : { privacyHash: rawPrivacyHash }),
          ...(externalDescription === undefined ? {} : { description: externalDescription }),
        },
      };
    }
    if (!hasExactlyKeys(props, ["asset", "captions", "title"], ["poster", "description"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    // Video, caption track and poster are three strictly distinguished purposes: a `.vtt` can never become the video.
    const asset = readOwnedAsset(props["asset"], "video");
    const captions = readOwnedAsset(props["captions"], "captions");
    const title = readBoundedText(
      props["title"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const poster = props["poster"] === undefined ? undefined : readOwnedAsset(props["poster"], "poster");
    const description = optionalBoundedText(props["description"], UNO_PAGE_DOCUMENT_LIMITS.textCodePoints, true);
    return {
      id,
      module: "media.video",
      props: {
        asset,
        captions,
        title,
        ...(poster === undefined ? {} : { poster }),
        ...(description === undefined ? {} : { description }),
      },
    };
  }

  if (moduleName === "media.gallery") {
    if (!hasExactlyKeys(props, ["columns", "items"], [])) throw new RefusedDocument("document:invalid-props");
    const columns = props["columns"];
    if (columns !== 2 && columns !== 3 && columns !== 4) throw new RefusedDocument("document:invalid-props");
    const items = readMediaItems(props["items"], 2, UNO_PAGE_DOCUMENT_LIMITS.galleryItems);
    return { id, module: "media.gallery", props: { columns, items } };
  }

  if (moduleName === "media.carousel") {
    if (!hasExactlyKeys(props, ["label", "items"], [])) throw new RefusedDocument("document:invalid-props");
    const label = readBoundedText(
      props["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const items = readMediaItems(props["items"], 2, UNO_PAGE_DOCUMENT_LIMITS.carouselItems);
    return { id, module: "media.carousel", props: { label, items } };
  }

  if (moduleName === "design.watermark") {
    if (!hasExactlyKeys(props, ["text"], ["align", "strength"])) throw new RefusedDocument("document:invalid-props");
    const text = readBoundedText(
      props["text"],
      UNO_PAGE_DOCUMENT_LIMITS.watermarkTextCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const align = optionalWatermarkAlign(props["align"]);
    const strength = optionalWatermarkStrength(props["strength"]);
    return {
      id,
      module: "design.watermark",
      props: {
        text,
        ...(align === undefined ? {} : { align }),
        ...(strength === undefined ? {} : { strength }),
      },
    };
  }

  if (moduleName === "design.motion") {
    if (!hasExactlyKeys(props, ["effect"], ["speed"])) throw new RefusedDocument("document:invalid-props");
    const effect = optionalMotionEffect(props["effect"]);
    if (effect === undefined) throw new RefusedDocument("document:invalid-props");
    const speed = optionalMotionSpeed(props["speed"]);
    const children = readChildren(
      record["children"],
      depth + 1,
      state,
      seen,
      1,
      UNO_PAGE_DOCUMENT_LIMITS.motionChildren,
    );
    const motionProps: UnoDesignMotionProps = speed === undefined ? { effect } : { effect, speed };
    return { id, module: "design.motion", props: motionProps, children };
  }

  if (moduleName === "interaction.tabs") {
    if (!hasExactlyKeys(props, ["label", "tabs"], [])) throw new RefusedDocument("document:invalid-props");
    const label = readBoundedText(
      props["label"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const children = readChildren(
      record["children"],
      depth + 1,
      state,
      seen,
      2,
      UNO_PAGE_DOCUMENT_LIMITS.tabChildren,
    );
    const tabs = readPanelEntries(props["tabs"], children, 2, UNO_PAGE_DOCUMENT_LIMITS.tabChildren);
    return { id, module: "interaction.tabs", props: { label, tabs }, children };
  }

  if (moduleName === "interaction.accordion") {
    if (!hasExactlyKeys(props, ["items"], ["summaryHeadingLevel", "surface"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const children = readChildren(
      record["children"],
      depth + 1,
      state,
      seen,
      1,
      UNO_PAGE_DOCUMENT_LIMITS.accordionChildren,
    );
    const items = readPanelEntries(props["items"], children, 1, UNO_PAGE_DOCUMENT_LIMITS.accordionChildren);
    const summaryHeadingLevel = optionalLevelThree(props, "summaryHeadingLevel");
    // `UNO-WO-118 / R01`: the donor's closed section surface, carried by the disclosure group itself.
    const surface = optionalSurface(props["surface"]);
    return {
      id,
      module: "interaction.accordion",
      props: {
        items,
        ...(summaryHeadingLevel === undefined ? {} : { summaryHeadingLevel }),
        ...(surface === undefined ? {} : { surface }),
      },
      children,
    };
  }

  if (moduleName === "interaction.modal") {
    if (!hasExactlyKeys(props, ["triggerLabel", "title", "closeLabel"], [])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const triggerLabel = readBoundedText(
      props["triggerLabel"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const title = readBoundedText(
      props["title"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    const closeLabel = readBoundedText(
      props["closeLabel"],
      UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints,
      "document:invalid-props",
      false,
      false,
    );
    // A dialog owns exactly one content node: zero would be an empty dialog and two would need a wrapper this order
    // does not authorise, so the bound is exact rather than merely bounded.
    const children = readChildren(record["children"], depth + 1, state, seen, 1, 1);
    return { id, module: "interaction.modal", props: { triggerLabel, title, closeLabel }, children };
  }

  if (moduleName === "interaction.contact") {
    if (!hasExactlyKeys(props, [], ["heading", "description", "fields", "submitLabel"])) {
      throw new RefusedDocument("document:invalid-props");
    }
    const heading = optionalBoundedText(props["heading"], UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints, true);
    const description = optionalBoundedText(
      props["description"],
      UNO_PAGE_DOCUMENT_LIMITS.contactDescriptionCodePoints,
      true,
    );
    const fields = readContactFields(props["fields"]);
    const submitLabel = optionalBoundedText(props["submitLabel"], UNO_PAGE_DOCUMENT_LIMITS.labelCodePoints, false);
    return {
      id,
      module: "interaction.contact",
      props: {
        ...(heading === undefined ? {} : { heading }),
        ...(description === undefined ? {} : { description }),
        ...(fields === undefined ? {} : { fields }),
        ...(submitLabel === undefined ? {} : { submitLabel }),
      },
    };
  }

  // Unreachable: the renderable tuple and this switch are kept in step by the `document:renderer-unavailable`
  // check above. Refusing here keeps a future registry addition from silently rendering nothing.
  throw new RefusedDocument("document:renderer-unavailable");
}

/** The trusted option record: absent, or one boolean `reservedHome`. Anything else refuses. */
function readOptions(value: unknown): { readonly reservedHome: boolean } {
  const record = readPlainData(value);
  if (record === null) throw new RefusedDocument("document:input-not-plain");
  if (!hasExactlyKeys(record, [], ["reservedHome"])) throw new RefusedDocument("document:input-not-plain");
  const reservedHome = record["reservedHome"];
  if (reservedHome === undefined) return { reservedHome: false };
  if (typeof reservedHome !== "boolean") throw new RefusedDocument("document:input-not-plain");
  return { reservedHome };
}

/**
 * Validate one version-1 JSON Page document from plain own data **or** raw JSON text.
 *
 * The envelope is closed: `version`, `title` and `sections` are required; `description` and `visibility` are
 * optional; nothing else may appear. The result is deeply frozen and safe to hand to a server component or to
 * serialize across the server/client boundary — it holds no function, class instance, accessor or opaque object.
 *
 * `reservedHome` is the caller's *already accepted* knowledge that this document belongs to the reserved Home
 * Page; it never comes from the document itself, so an authored `visibility` cannot borrow or escape the Home
 * rule. This function publishes nothing: it does not know a Site, a locale, a route or a URL.
 */
export function readUnoPageDocument(
  input: unknown,
  options: UnoPageDocumentOptions = {},
): UnoPageDocumentResult {
  try {
    const settings = readOptions(options);

    let parsed: unknown;
    if (typeof input === "string") {
      if (utf8ByteLength(input) > UNO_PAGE_DOCUMENT_LIMITS.sourceBytes) {
        return refuseDocument("document:text-too-large");
      }
      parsed = new StrictJsonReader(input).read();
    } else {
      if (input === null || typeof input !== "object") return refuseDocument("document:not-an-object");
      parsed = input;
    }

    const record = readPlainData(parsed);
    if (record === null) return refuseDocument("document:not-an-object");

    for (const key of Object.keys(record)) {
      if (!DOCUMENT_REQUIRED_KEYS.includes(key) && !DOCUMENT_OPTIONAL_KEYS.includes(key)) {
        return refuseDocument("document:unexpected-key");
      }
    }
    if (!Object.prototype.hasOwnProperty.call(record, "version")) {
      return refuseDocument("document:unsupported-version");
    }
    if (record["version"] !== UNO_PAGE_DOCUMENT_VERSION) {
      return refuseDocument("document:unsupported-version");
    }
    if (!Object.prototype.hasOwnProperty.call(record, "title")) return refuseDocument("document:invalid-title");
    if (!Object.prototype.hasOwnProperty.call(record, "sections")) {
      return refuseDocument("document:invalid-sections");
    }

    const title = readBoundedText(
      record["title"],
      UNO_PAGE_DOCUMENT_LIMITS.titleCodePoints,
      "document:invalid-title",
      false,
      false,
    );

    let description: string | undefined;
    if (Object.prototype.hasOwnProperty.call(record, "description")) {
      description = readBoundedText(
        record["description"],
        UNO_PAGE_DOCUMENT_LIMITS.descriptionCodePoints,
        "document:invalid-description",
        true,
        true,
      );
    }

    let visibility: UnoPageVisibility = "public";
    if (Object.prototype.hasOwnProperty.call(record, "visibility")) {
      const declared = record["visibility"];
      if (declared !== "public" && declared !== "unlisted") {
        return refuseDocument("document:invalid-visibility");
      }
      visibility = declared;
    }
    if (visibility === "unlisted" && settings.reservedHome) {
      return refuseDocument("document:home-cannot-be-unlisted");
    }

    const rawSections = record["sections"];
    if (!Array.isArray(rawSections) || rawSections.length < 1) {
      return refuseDocument("document:invalid-sections");
    }
    if (rawSections.length > UNO_PAGE_DOCUMENT_LIMITS.sections) {
      return refuseDocument("document:too-many-sections");
    }

    const state: WalkState = {
      ids: new Set<string>(),
      linkIds: [],
      targets: [],
      nodes: 0,
      lastHeadingLevel: 1,
    };
    const seen = new WeakSet<object>();
    const sections: UnoSectionNode[] = [];
    for (let index = 0; index < rawSections.length; index += 1) {
      if (!(index in rawSections)) return refuseDocument("document:invalid-sections");
      sections.push(readNode(rawSections[index], 1, state, seen));
    }

    // A same-document action must name a section that actually exists in *this* document.
    for (const target of state.targets) {
      if (!state.ids.has(target)) return refuseDocument("document:unresolved-target");
    }

    // `UNO-WO-103 / R01`: every used `linkId` must name a declaration this same document carries. An undeclared
    // reference refuses the whole Page; an unused declaration is inert and is never activated by the document alone.
    const links = readDocumentLinks(record["links"]);
    for (const linkId of state.linkIds) {
      if (links === undefined || !Object.prototype.hasOwnProperty.call(links, linkId)) {
        return refuseDocument("document:unresolved-target");
      }
    }

    const document: UnoPageDocument = {
      version: UNO_PAGE_DOCUMENT_VERSION,
      title,
      ...(description === undefined ? {} : { description }),
      visibility,
      sections,
      ...(links === undefined ? {} : { links }),
    };

    return Object.freeze({ accepted: true as const, document: deepFreeze(document) });
  } catch (error) {
    if (error instanceof RefusedDocument) return refuseDocument(error.reason);
    if (error instanceof HostileStructure) return refuseDocument("document:input-not-plain");
    return refuseDocument("document:unreadable");
  }
}








/**
 * Foundation Uno — bounded, allowlisted Markdown for authored Foundation family fields (`UNO-WO-083 / R01`, Wave A, U04).
 *
 * WHAT THIS IS. One pure translation from an authored Markdown string into a small, closed, presentation-ready AST that a
 * React renderer can walk without ever interpreting authored text as markup. It exists because the donor families author
 * real Markdown — emphasis, code, lists and classified links — and the accepted Uno plain-text subset could not represent
 * that without flattening it.
 *
 * WHAT IT REFUSES, AND WHY BY NAME. Raw HTML, images, attribute-bearing markup, an unbalanced or malformed construct, a
 * document beyond the declared caps, ill-formed Unicode (a lone, reversed or interrupted surrogate pair, `UNO-WO-116 / R01`)
 * and any link destination that the unchanged `classifyAuthorDestination` does not admit as `mailto` or `https` are all
 * refused with one closed reason. A partial parse is never returned: the caller either renders the whole accepted AST or
 * refuses the whole field, so a half-read sentence cannot reach a visitor.
 *
 * WHAT IT IS NOT. No dependency, no `dangerouslySetInnerHTML`, no sanitiser regex over HTML (nothing is ever treated as
 * HTML), no I/O, no locale, no publication, no link resolution, no fetch and no publisher authority. A classified `href`
 * is *syntax only*: whether a Visitor may reach it is the caller's business, and this module neither proves ownership nor
 * reachability.
 */

/** Declared bounds. Limits, never defaults: exceeding one refuses the field instead of truncating it. */
export const UNO_FAMILY_MARKDOWN_LIMITS = Object.freeze({
  blocks: 256,
  blockChars: 4000,
  inlineNodes: 768,
  nesting: 2,
  linkLabelChars: 200,
  codeChars: 2000,
  listItems: 24,
});

/** One inline fragment: inert text, one approved emphasis, one code span, or one classified link. */
export type UnoFamilyInline =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "strong"; readonly children: readonly UnoFamilyInline[] }
  | { readonly kind: "em"; readonly children: readonly UnoFamilyInline[] }
  | { readonly kind: "code"; readonly text: string }
  | {
      readonly kind: "link";
      readonly href: string;
      readonly category: "mailto" | "https";
      readonly children: readonly UnoFamilyInline[];
    };

/** One block: a paragraph, an in-field heading, a native list or a fenced code block. */
export type UnoFamilyBlock =
  | { readonly kind: "paragraph"; readonly children: readonly UnoFamilyInline[] }
  | { readonly kind: "heading"; readonly level: 2 | 3 | 4 | 5 | 6; readonly children: readonly UnoFamilyInline[] }
  | { readonly kind: "list"; readonly ordered: boolean; readonly items: readonly (readonly UnoFamilyInline[])[] }
  | { readonly kind: "code"; readonly language: string; readonly text: string };

/** The closed refusal vocabulary. Every failure a caller can receive is one of these literals. */
export type UnoFamilyMarkdownRefusal =
  | "markdown:not-a-string"
  | "markdown:empty"
  | "markdown:too-large"
  | "markdown:ill-formed-unicode"
  | "markdown:unsupported-html"
  | "markdown:unbalanced"
  | "markdown:malformed-link"
  | "markdown:unsafe-destination";

/** The whole field, or nothing at all. */
export type UnoFamilyMarkdownResult =
  | { readonly ok: true; readonly blocks: readonly UnoFamilyBlock[] }
  | { readonly ok: false; readonly reason: UnoFamilyMarkdownRefusal };

/** A tag-like `<` opener: the only angle-bracket form that could ever look like markup; a bare `<` is inert text. */
const MARKUP_OPENER_PATTERN = /<[a-zA-Z/!?]/u;

/** Count Unicode code points, so an astral character costs one unit like the donor's own bound does. */
function codePointCount(text: string): number {
  let count = 0;
  for (const character of text) {
    if (character.length > 0) count += 1;
  }
  return count;
}

/** A fence language this subset will label. An identifier-shaped hint only. */
const FENCE_LANGUAGE_PATTERN = /^[A-Za-z0-9+#._-]*$/u;

/** Controls other than newline and tab are refused: they can corrupt a terminal, a log or a header. */
const CONTROL_PATTERN = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/u;

/** A heading line. A level-one heading is refused because the Page title is the single `h1`. */
const HEADING_PATTERN = /^(#{1,6})[ \t]+(.+)$/u;

/** A bullet or ordered list item. */
const BULLET_PATTERN = /^[-*+][ \t]+(.+)$/u;
const ORDERED_PATTERN = /^\d{1,9}[.)][ \t]+(.+)$/u;

function frozen<T extends object>(value: T): T {
  return Object.freeze(value);
}



/**
 * Parse one inline run. Returns `null` for every refusal so the block parser can fail the whole field.
 *
 * Precedence is deliberate and small: an escape is literal, a code span is literal, a link is classified, `**` is strong,
 * `*` is emphasis, and anything else is text. There is no HTML pass at all, so there is no sanitiser to bypass.
 */
function parseInline(
  source: string,
  depth: number,
  budget: { nodes: number },
): readonly UnoFamilyInline[] | null {
  if (depth > UNO_FAMILY_MARKDOWN_LIMITS.nesting) return null;
  const nodes: UnoFamilyInline[] = [];
  let text = "";
  let index = 0;

  const pushText = (): void => {
    if (text.length === 0) return;
    nodes.push(frozen({ kind: "text" as const, text }));
    budget.nodes += 1;
    text = "";
  };

  while (index < source.length) {
    const character = source[index] ?? "";

    if ((character === "!" && source[index + 1] === "[") || (character === "<" && MARKUP_OPENER_PATTERN.test(source.slice(index, index + 2)))) {
      return null; // raw HTML or an image: refused before anything is emitted
    }

    if (character === "\\") {
      const escaped = source[index + 1];
      if (escaped === undefined) return null;
      text += escaped;
      index += 2;
      continue;
    }

    if (character === "`") {
      const close = source.indexOf("`", index + 1);
      if (close === -1) return null;
      const code = source.slice(index + 1, close);
      if (code.length === 0 || code.length > UNO_FAMILY_MARKDOWN_LIMITS.codeChars) return null;
      if (code.includes("\n")) return null;
      pushText();
      nodes.push(frozen({ kind: "code" as const, text: code }));
      budget.nodes += 1;
      index = close + 1;
      continue;
    }

    if (character === "[") {
      if (source[index + 1] === "[") return null; // reference-style links are outside the subset
      const labelEnd = source.indexOf("](", index + 1);
      if (labelEnd === -1) return null;
      const close = source.indexOf(")", labelEnd + 2);
      if (close === -1) return null;
      const label = source.slice(index + 1, labelEnd);
      const destination = source.slice(labelEnd + 2, close);
      if (label.length === 0 || label.length > UNO_FAMILY_MARKDOWN_LIMITS.linkLabelChars) return null;
      if (label.includes("[") || label.includes("]")) return null;
      if (destination.includes("(") || destination.includes(")")) return null;
      const children = parseInline(label, depth + 1, budget);
      if (children === null) return null;
      const verdict = classifyAuthorDestination(destination);
      if (!verdict.accepted) return null;
      if (verdict.category !== "mailto" && verdict.category !== "https") return null;
      pushText();
      nodes.push(
        frozen({ kind: "link" as const, href: verdict.href, category: verdict.category, children }),
      );
      budget.nodes += 1;
      index = close + 1;
      continue;
    }

    if (character === "_") {
      // Donor Markdown emphasis: an underscore pair, but never inside a word (`some_name_here` stays literal text).
      const strong = source[index + 1] === "_";
      const marker = strong ? "__" : "_";
      const before = index === 0 ? "" : (source[index - 1] ?? "");
      const boundaryBefore = before === "" || !/[\p{L}\p{N}]/u.test(before);
      if (boundaryBefore) {
        const close = source.indexOf(marker, index + marker.length);
        if (close !== -1) {
          const inner = source.slice(index + marker.length, close);
          const after = source[close + marker.length] ?? "";
          const boundaryAfter = after === "" || !/[\p{L}\p{N}]/u.test(after);
          if (inner.length > 0 && boundaryAfter) {
            const children = parseInline(inner, depth + 1, budget);
            if (children !== null) {
              pushText();
              nodes.push(frozen({ kind: strong ? ("strong" as const) : ("em" as const), children }));
              budget.nodes += 1;
              index = close + marker.length;
              continue;
            }
            return null;
          }
        }
      }
      text += character;
      index += 1;
      continue;
    }

    if (character === "*") {
      const strong = source[index + 1] === "*";
      const marker = strong ? "**" : "*";
      const close = source.indexOf(marker, index + marker.length);
      if (close === -1) return null;
      const inner = source.slice(index + marker.length, close);
      if (inner.length === 0) return null;
      const children = parseInline(inner, depth + 1, budget);
      if (children === null) return null;
      pushText();
      nodes.push(frozen({ kind: strong ? ("strong" as const) : ("em" as const), children }));
      budget.nodes += 1;
      index = close + marker.length;
      continue;
    }

    text += character;
    index += 1;
    if (budget.nodes > UNO_FAMILY_MARKDOWN_LIMITS.inlineNodes) return null;
  }

  pushText();
  if (budget.nodes > UNO_FAMILY_MARKDOWN_LIMITS.inlineNodes) return null;
  return Object.freeze(nodes);
}
/**
 * Read one authored family Markdown field.
 *
 * The whole value is accepted or refused as a unit. Line endings are normalised first so one source parses identically on
 * every host, and a level-one heading is refused because the Page title is the only `h1`.
 */
export function readUnoFamilyMarkdown(source: unknown): UnoFamilyMarkdownResult {
  if (typeof source !== "string") return { ok: false, reason: "markdown:not-a-string" };
  if (source.length === 0) return { ok: false, reason: "markdown:empty" };
  // `UNO-WO-116 / R01`: a lone, reversed or interrupted surrogate pair is not text any renderer can represent, so the
  // whole field is refused before parsing — never replaced, trimmed, normalised or partially rendered.
  if (!isWellFormedUnicodeText(source)) return { ok: false, reason: "markdown:ill-formed-unicode" };
  if (codePointCount(source) > UNO_FAMILY_MARKDOWN_LIMITS.blockChars) return { ok: false, reason: "markdown:too-large" };
  const normalised = source.replace(/\r\n/gu, "\n").replace(/\r/gu, "\n");
  if (CONTROL_PATTERN.test(normalised)) return { ok: false, reason: "markdown:unsupported-html" };
  if (normalised.includes("![") || MARKUP_OPENER_PATTERN.test(normalised)) {
    return { ok: false, reason: "markdown:unsupported-html" };
  }

  const lines = normalised.split("\n");
  const blocks: UnoFamilyBlock[] = [];
  const budget = { nodes: 0 };
  let paragraph: string[] = [];
  let index = 0;

  const flushParagraph = (): boolean => {
    if (paragraph.length === 0) return true;
    const joined = paragraph.join(" ").trim();
    paragraph = [];
    if (joined.length === 0) return true;
    const children = parseInline(joined, 1, budget);
    if (children === null || children.length === 0) return false;
    blocks.push(frozen({ kind: "paragraph" as const, children }));
    return true;
  };

  while (index < lines.length) {
    const line = (lines[index] ?? "").trim();
    if (line.length === 0) {
      if (!flushParagraph()) return { ok: false, reason: "markdown:unbalanced" };
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      if (!flushParagraph()) return { ok: false, reason: "markdown:unbalanced" };
      const language = line.slice(3).trim();
      if (language.length > 20 || !FENCE_LANGUAGE_PATTERN.test(language)) {
        return { ok: false, reason: "markdown:malformed-link" };
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
      if (!closed) return { ok: false, reason: "markdown:unbalanced" };
      const text = code.join("\n");
      if (codePointCount(text) > UNO_FAMILY_MARKDOWN_LIMITS.codeChars) return { ok: false, reason: "markdown:too-large" };
      blocks.push(frozen({ kind: "code" as const, language, text }));
      continue;
    }

    const heading = HEADING_PATTERN.exec(line);
    if (heading !== null) {
      if (!flushParagraph()) return { ok: false, reason: "markdown:unbalanced" };
      const level = (heading[1] ?? "").length;
      if (level < 2 || level > 6) return { ok: false, reason: "markdown:unbalanced" };
      const children = parseInline((heading[2] ?? "").trim(), 1, budget);
      if (children === null || children.length === 0) return { ok: false, reason: "markdown:unbalanced" };
      blocks.push(frozen({ kind: "heading" as const, level: level as 2 | 3 | 4 | 5 | 6, children }));
      index += 1;
      continue;
    }

    const bullet = BULLET_PATTERN.exec(line);
    const ordered = ORDERED_PATTERN.exec(line);
    if (bullet !== null || ordered !== null) {
      if (!flushParagraph()) return { ok: false, reason: "markdown:unbalanced" };
      const isOrdered = ordered !== null;
      const items: (readonly UnoFamilyInline[])[] = [];
      while (index < lines.length) {
        const candidate = (lines[index] ?? "").trim();
        const match = isOrdered ? ORDERED_PATTERN.exec(candidate) : BULLET_PATTERN.exec(candidate);
        if (match === null) break;
        const children = parseInline((match[1] ?? "").trim(), 1, budget);
        if (children === null || children.length === 0) return { ok: false, reason: "markdown:unbalanced" };
        items.push(children);
        index += 1;
        if (items.length > UNO_FAMILY_MARKDOWN_LIMITS.listItems) {
          return { ok: false, reason: "markdown:too-large" };
        }
      }
      blocks.push(frozen({ kind: "list" as const, ordered: isOrdered, items: Object.freeze(items) }));
      continue;
    }

    paragraph.push(line);
    index += 1;
  }

  if (!flushParagraph()) return { ok: false, reason: "markdown:unbalanced" };
  if (blocks.length === 0 || blocks.length > UNO_FAMILY_MARKDOWN_LIMITS.blocks) {
    return { ok: false, reason: "markdown:too-large" };
  }
  return { ok: true, blocks: Object.freeze(blocks) };
}

