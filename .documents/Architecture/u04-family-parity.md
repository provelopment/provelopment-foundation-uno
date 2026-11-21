# U04 — bounded Foundation→Uno family composition (source and rights ledger)

**Scope of this record.** It documents the **seventeen** donor source shapes Uno currently composes into its own v1 Page
document — `prose`, `callout`, `table`, `list`, `divider`, `hero`, `stats`, `steps`, `quote`, `faq`, `columns`, `cards`,
`features`, `actions`, `media`, `gallery`, `contactForm` — out of the donor's **seventeen** families. It is a narrow
provenance and rights ledger, not a parity record: **seventeen bounded source mappings; zero entirely unimplemented donor
families; zero of seventeen full semantic parity; zero published family Page acceptance evidence.** U04 remains OPEN.

## 1. Provenance and licence

These seventeen mappings are an **original Uno-owned** implementation
(`src/application/compose-uno-foundation-families.ts`, adaptation class `COMPOSE (plain-text subset)`). Only
**concepts and semantics** were adapted — never donor source, components, CSS, Tailwind classes, images, Connect code
or trademarks — from `provelopment/provelopment-foundation` at commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, which is licensed **Apache-2.0** (`LICENSE`, Git blob
`d645695673349e3947e8e5ae42332d0ac3164cd7`). The donor is read-only evidence: no donor package, runtime module, asset
or build configuration is imported into Uno, and no donor file was copied. The converter, its refusal vocabulary, its
bounds and its tests are Uno's own.

Donor evidence blobs: the source schemas and the exact `PAGE_SECTION_TYPES` roster in
`src/core/page-document.ts` (`a12d964c43626c6313a621bf628f5cc24b65d444`); `structure-sections.tsx`
(`65d254e192a6a8ef4886590026c2ea58e02264be`); `text-sections.tsx` (`caeee57798bdd533867e5bef350422618187612f`);
`items-sections.tsx` (`bc729d6a2e6484dc2c26ed997e65ee644bc8a7e6`); `media-sections.tsx`
(`e3f3a12e5e26cb6af9133bef79f5fa2dc0680bb2`).

## 2. Canonical donor inventory — exactly seventeen ordered families

`hero`, `prose`, `media`, `gallery`, `actions`, `callout`, `cards`, `features`, `columns`, `steps`, `stats`, `quote`,
`table`, `faq`, `list`, `divider`, `contactForm`.

Seventeen of these are composed as bounded subsets (section 3). None remains unmapped:

**UNIMPLEMENTED (0):** none.

Uno module ids such as `content.heading`, `content.testimonials` or `content.pricing` are Uno concepts or renderer
features; they are **not** additional donor family keys and must never be listed as an eighteenth family.

## 3. Seventeen composed source shapes

| Donor family | Donor evidence | Disposition | Accepted donor fields | Deliberately unsupported | Uno output | Unit proof |
| --- | --- | --- | --- | --- | --- | --- |
| `prose` | `text-sections.tsx` `caeee577…` | `COMPOSE (plain-text subset)` | `type`, `body` | heading/lede/align/surface/links/visibility, Markdown, HTML, links | `content.prose {text}` → `<p class="uno-json-prose">` | composed + refusal + markup |
| `callout` | `text-sections.tsx` `caeee577…` | `COMPOSE (plain-text subset)` | `type`, `body`, optional `tone` | other tones, role/alert semantics, links, Markdown | `content.prose {variant:"callout",text,tone?}` → `<section class="uno-json-callout">` | composed + refusal + markup |
| `table` | `structure-sections.tsx` `65d254e1…` | `COMPOSE (plain-text subset)` | `type`, `columns`, `rows`, optional `caption` | sorting, spans, merged cells, Markdown, links | `content.prose {variant:"table",…}` → scroll wrapper, `<caption>`, `<th scope="col">` | composed + rectangularity refusal + markup |
| `list` | `items-sections.tsx` `bc729d6a…` | `COMPOSE (plain-text subset)` | `type`, `items`, optional `ordered` | item destinations/hrefs, icons, Markdown, nested lists | `content.prose {variant:"list",…}` → `<ol>`/`<ul class="uno-json-list">` | composed + destination refusal + markup |
| `divider` | `text-sections.tsx` `caeee577…` | `COMPOSE (plain-text subset)` | `type` | any content, tone, spacing | `content.prose {variant:"divider"}` → `<hr class="uno-json-divider">` | composed + content refusal + markup |
| `hero` | `page-document.ts` `a12d964c…`; `media-sections.tsx` `e3f3a12e…` | `COMPOSE (plain-text subset)` | `type`, `lede` (required by this subset), optional `eyebrow`, `support`, `align`, `surface` | donor `actions`, hero forms with only `support`/`eyebrow`, Markdown, links/routes | `content.hero {lede,eyebrow?,support?,align?,surface?}` → `<section class="uno-json-hero" data-uno-align data-uno-surface>` with plain eyebrow/lede/support | composed + form/align refusal + markup |
| `stats` | `page-document.ts` `a12d964c…`; `items-sections.tsx` `bc729d6a…` | `COMPOSE (plain-text subset)` | `type`, `items[1..6]{value,label,detail?}` | donor heading/lede/surface, embedded links, Markdown, extra keys or entries | `content.stats {items}` → `<section class="uno-json-stats">` with `<dl>`/`<dt>`/`<dd>` | composed + count/link refusal + markup |
| `steps` | `page-document.ts` `a12d964c…`; `items-sections.tsx` `bc729d6a…` | `COMPOSE (ordered plain-text subset)` | `type`, `items[1..12]{title,body?}`, optional `surface` | donor `heading`/`lede`, item `href`/`route`/`link`/`status`/`dateLabel`/`icon`, Markdown, links, states and dates | `content.timeline {items,surface?}` → `<ol class="uno-json-timeline-list">`, one `<li>` per authored step in source order | composed + order/count/state refusal + markup |
| `quote` | `page-document.ts` `a12d964c…`; `text-sections.tsx` `caeee577…` | `COMPOSE (plain-text figure subset)` | `type`, `body`, optional `attribution`, `role` (only with `attribution`), `align`, `surface` | donor `heading`/`lede`, Markdown, links, and the donor's role-only caption suppression | `content.testimonials {items:[{quote,attribution?,role?}],align?,surface?}` → one `<figure>` with `<blockquote>` and an authored `<figcaption>` | composed + caption/Markdown refusal + markup |
| `faq` | `page-document.ts` `a12d964c…`; `structure-sections.tsx` `65d254e1…` | `COMPOSE (bounded FAQ)` | `type`, `items[1..8]{question,answer}` | donor `heading`/`lede`/`surface`, Markdown and links, item `href`/`icon`/`open`, any delivery or independent state | one `interaction.accordion {items:[{sectionId,label}]}` with one `content.prose` answer child per entry, `sectionId` equal to that child's own id | one `<details class="uno-json-disclosure">`/`<summary>` per entry in source order, answers as prose paragraphs inside `.uno-json-disclosure-body` | composed + cap/feature/Markdown refusal + markup |
| `columns` | `page-document.ts` `a12d964c…`; `structure-sections.tsx` `65d254e1…` | `COMPOSE (bounded columns)` | `type`, `items[2..3]` of `{title,body}` **or** `{title,items[1..12]}`, optional `ratio` (`equal`/`start-wide`/`end-wide`, two columns only) | donor `heading`/`lede`/`surface`, Markdown and links, item `href`/`icon`/`style`, one or four columns, a ratio on three columns | one `layout.grid {columns,ratio?}` holding one `layout.stack {gap:"tight"}` per column, each with `content.heading {level:2}` then one `content.prose` body or native list | `data-uno-columns`, `data-uno-ratio` only when authored, `.uno-json-cell`, `<h2>`, paragraph and native `<ul class="uno-json-list">` | composed + count/ratio/Markdown refusal + markup |
| `cards` | `page-document.ts` `a12d964c…` (strict `cardsSectionSchema`, `cardItemSchema`); `media-sections.tsx` `e3f3a12e…` (native `<li>` cards with optional media/meta/action); `section-support.tsx` `19c9bee3…` (`columnsClass` default, `<h3>` item title) | `COMPOSE (bounded cards)` | `type`, required `columns` 2|3|4, `items[1..8]{title,body?}` | donor `heading`/`lede`/`surface`, an omitted `columns`, item `image`/`meta`/`action`/`href`/`icon`/`style`, Markdown and links, donor border styling and `<h3>` item outline | one `layout.grid {columns,itemSemantics:"list"}` with one `layout.stack {gap:"tight"}` per card: `content.heading {level:2}` and, only when authored, one `content.prose` body | `<ul class="uno-json-grid" data-uno-item-semantics="list" role="list">`, one direct `<li class="uno-json-cell">` per card, `<h2 class="uno-json-heading">` and only authored `<p class="uno-json-prose">` | composed + required-columns/count/Markdown refusal + markup |
| `features` | `page-document.ts` `a12d964c…` (strict `featuresSectionSchema`, `featureItemSchema`); `items-sections.tsx` `bc729d6a…` (native `<li>` features with optional decorative icon); `section-support.tsx` `19c9bee3…` | `COMPOSE (bounded features)` | `type`, required `columns` 2|3|4, `items[1..8]{title,body?}` | donor `heading`/`lede`/`surface`, an omitted `columns`, item `icon`/`image`/`href`/`style`, Markdown and links, donor icon rendering and `<h3>` item outline | the same native list-grid: `layout.grid {columns,itemSemantics:"list"}` of tight stacks, each `content.heading {level:2}` and only an authored body | the same `<ul role="list">`/`<li>` structure with per-feature `<h2>` and only authored paragraphs | composed + required-columns/count/Markdown refusal + markup |
| `actions` | `page-document.ts` `a12d964c…` (strict `actionsSectionSchema`, `actionSchema`, destination and variant forms); `text-sections.tsx` `caeee577…` (donor `ActionsSection` genuine link list); `section-support.tsx` `19c9bee3…` (donor `ActionLinks` item presentation) | `COMPOSE (same-document anchor subset)` | `type`, required `actions[1..8]{label,href}` where the label is plain text and `href` is a literal `#family-<index>-<name>` fragment naming an existing **top-level** composed section | donor `href`/`route`/`link` destination alternatives, action `variant`, section `heading`/`lede`/`align`/`surface`, Markdown labels, external/`mailto:`/`tel:`/site-route destinations, percent-encoded, suffixed, whitespace or missing/nested targets | `content.actions {items:[{label,targetId}]}`, preserving authored order and each authored anchor one-to-one; the composer's own exact top-level ID equality check runs before the Uno reader | `<ul class="uno-json-actions" id="family-13-actions">` with one direct `<li class="uno-json-action-item">` and one native `<a class="uno-json-action" href="#<targetId>">` per authored action | composed + destination/label refusal + native-anchor markup |
| `media` | `page-document.ts` `a12d964c…` (strict `imageSchema`, `mediaSectionSchema`, donor `src`, alt/decorative, optional caption, heading/lede/position/surface); `media-sections.tsx` `e3f3a12e…` (donor `<figure>` image and caption, optional `position`); `section-support.tsx` `19c9bee3…` (donor image presentation and alt semantics); local Uno `src/core/assets/uno-owned-media.ts` `f988a0e5…` (`UnoOwnedAssetRef`, `readUnoOwnedAssetRef`, `readUnoOwnedMediaPath`, four zones, per-purpose extension/MIME, generated-SHA policy) | `COMPOSE (explicit owned-image binding subset)` | `type`, required `image{src,alt}` with a literal donor `/assets/…` identity (lowercase raster extension, path accepted by the local owned-media policy) and an authored nonblank descriptive alt, optional plain `caption`; a caller-supplied `{images:[{source,owned}]}` binding maps each consumed donor identity to a separately authored `{zone,path,integrity?}` image ref | donor decorative images (empty alt), donor `heading`/`lede`/`position`/`surface`, remote or protocol-relative sources, SVG, uppercase extensions, percent-encoding, query/fragment, donor Markdown caption and any automatic URL-to-asset migration, unbound/missing/extra/duplicate bindings, Markdown text | `media.image {asset,alt,caption?}` where `asset` is the validated owned ref from the binding; donor `src` never becomes a rendered URL, and the binding is validated before a candidate exists | real `<figure class="uno-json-media" id="family-14-media">` only when the server supplies a resolved image projection; without that projection no figure and no image is emitted, and the donor path never appears as a `src` | composed + explicit-binding refusal + projection-gated markup |
| `gallery` | `page-document.ts` `a12d964c…` (strict `gallerySectionSchema`: `items[2..12]{image,caption?}`, `imageSchema` `src`/`alt`/decorative, optional `columns`, heading/lede/surface); `media-sections.tsx` `e3f3a12e…` (donor native `<ul>`/`<li>` grouping, a `<figure>` per image, Markdown caption); `section-support.tsx` `19c9bee3…` (donor image alternative contract and column defaults); local Uno `src/core/assets/uno-owned-media.ts` `f988a0e5…` (owned-ref policy); local Uno `src/core/page-document.ts` `2d968300…` (`media.gallery {columns:2|3|4,items[2..12]{asset,alt,caption?}}`) and `src/components/uno-page-sections.tsx` `cde15a6b…` (`<div class="uno-json-gallery">` of `<figure class="uno-json-media-item">` children) | `COMPOSE (explicit owned-gallery binding subset)` | `type`, required `columns` exactly `2`, `3` or `4`, required `items[2..8]` each exactly `{image:{src,alt},caption?}` with a literal donor `/assets/…` identity and an authored nonblank descriptive alt; the same caller-supplied `{images:[{source,owned}]}` binding as `media`, whose unique source set must equal the set consumed across **both** families | donor optional `heading`/`lede`/`surface`, implicit column default, decorative images (empty alt), donor `position`/`align`, item `href`/`meta`/`action`/`icon`, image `width`/`height`/`srcset`/`style`, remote or protocol-relative sources, SVG, uppercase extensions, Markdown text, unbound/missing/extra/duplicate bindings | `media.gallery {columns,items:[{asset,alt,caption?}]}` built in authored item order, with each missing caption kept absent; donor `src` never becomes a rendered URL | one `<div class="uno-json-gallery" data-uno-columns="…" id="family-N-gallery">` with exactly one `<figure class="uno-json-media-item">` per projected item, and no gallery at all without a matching server projection | composed + explicit-binding refusal + projection-gated markup |
| `contactForm` | donor `src/core/page-document.ts` `a12d964c…` (strict `contactForm` section = `{type, formRef}`; `formRef` trimmed, nonempty, max 64, `/^[a-z0-9][a-z0-9-]*$/`, an intent reference only); donor `src/components/site/page-document-content.tsx` `fc35a52d…` (`renderContactForm?.(section.formRef) ?? null` — a per-render caller seam, absent means nothing rendered); local Uno `src/core/page-document.ts` `2d968300…` (`interaction.contact` with empty props `{}` and optional heading/description/fields/submitLabel, no `formRef`) and local `src/components/uno-page-sections.tsx` `cde15a6b…` (fixed `Delivery is switched off. Nothing entered here is sent or stored.` notice, no form) | `COMPOSE (acknowledged delivery-OFF notice subset)` | `type` and a literal `formRef` in the pinned donor grammar, plus a separate caller acknowledgement `{contactForms:[{formRef, mode:"delivery-off"}]}` matching it exactly; output is one `interaction.contact` node with empty props and nothing else. The generated node id is `family-<index>-contactform`: the donor `type` stays canonical `contactForm`, while only the target suffix is lowercase because the frozen Uno section-id grammar `/^[a-z][a-z0-9-]{0,47}$/u` admits no uppercase | donor `formRef` trim semantics, any `heading`/`description`/`fields`/`submitLabel`, any provider/recipient/URL/webhook/token/secret/status/method/action key, an unacknowledged or mismatched reference, a non-`delivery-off` mode, and any donor form UI or delivery behaviour | `interaction.contact {props:{}}`; the donor `formRef` is validated, acknowledged, then **discarded**, so it never reaches the Page, HTML, client props, id suffix, log or URL | one `<section class="uno-json-contact">` whose only content is the existing fixed OFF status line: no `<form>`, `<input>`, `<textarea>`, `<button>`, `action`, `method`, handler, iframe, script or echoed reference | composed + acknowledgement and refusal tests + real React markup proof |

Each accepted output is one validated, deep-frozen `UnoPageDocument` with `version: 1`, the donor title and one node
per input section (`family-<index>-<type>`). Absent optional fields stay absent; the renderer owns visual defaults.
No donor Markdown, link destination, image or media form is rendered by this subset.

**Known outline limitations (recorded, not concealed).** The donor `steps` item title renders through the donor's item
heading (`<h3>`) while Uno's existing timeline title is a `<p>`. The donor `faq` question is an `<h3>` inside its
`<summary>`, while Uno's disclosure summary is plain text. The donor `columns` column title is an `<h3>`, while the
composed `content.heading` is **level 2** so that the Page keeps a valid heading order without inventing a donor
section heading. The donor `cards` and `features` item titles are also `<h3>`, while the composed item title is an
`<h2>`. These bounded mappings reproduce authored order, labels and body meaning only; none of them reproduces the donor
heading outline, so each is explicitly not full parity.

**Deliberately absent donor design (cards and features).** The donor card's rounded border, image, short meta line and
single action are **not** composed, and the donor feature's decorative icon is **not** composed: this subset keeps only
the authored title and optional body. The donor's own renderer defaults an omitted `columns` value, while this subset
requires `columns` explicitly and refuses an omitted one rather than manufacturing that default. Because both donor
families reduce to the same native list-grid, two different donor concepts can produce the same minimal structure; that
is a bounded structural choice, not visual or semantic parity for either family.

**Deliberately absent donor design (media and its binding).** The donor `media` section accepts a remote or local `src`,
a decorative image with empty alt, a Markdown caption, and heading/lede/position/surface layout options; its figure also
renders the caption as Markdown. This subset composes none of that richness. A donor `src` such as `/assets/portrait.png`
remains an **opaque migration identity**: it is never decoded, trimmed, prefix-rewritten or turned into an Uno path, and
it is used only to look up an explicit caller-supplied binding. The composed asset is the separately authored
`{zone,path,integrity?}` reference the established `readUnoOwnedAssetRef(…, "image")` policy accepted, and an absent,
unused, extra or duplicate binding refuses the whole Page instead of inventing one. Captions and alts are plain text in a
native `figcaption`, so a donor Markdown caption is *not* literal markup parity, and the renderer emits a figure only when
a server-built `UnoPageMedia` projection exists for the section — a validated document alone can never fabricate an
image. The binding is a declaration for later independent verification: it grants no filesystem read, source licence,
stored bytes, availability, rights or publication authority, and no asset HTTP or browser proof is claimed here.

**Deliberately absent donor design (gallery).** The donor gallery groups its figures in a native `<ul>` of `<li>` items,
accepts an optional `heading`, `lede` and `surface`, an optional `columns` with its own default, decorative images with
empty alt, and Markdown captions. This subset composes only an explicitly authored grid: `columns` must be literally
`2`, `3` or `4` (no borrowed default) and `items` must hold two to eight described images. The composed Page uses Uno's
`media.gallery`, which renders one `<div class="uno-json-gallery">` of `<figure class="uno-json-media-item">` children and,
like `media`, emits nothing without a matching server-built `UnoPageMedia` projection. The native list wrapper is therefore
**different** from the donor's, even though authored order, alt text, figure and caption meaning survive; that outline
difference is disclosed rather than smoothed over. Decorative images, donor headings/lede/surface, Markdown captions,
`href`/`meta`/`action`/`icon`, image dimension hints, remote sources and unbound identities are refused, not dropped. The
shared binding is the same declaration as for `media`: no file read, licence, rights, byte availability, source URL
pass-through or publication authority follows from an accepted reference, and no gallery HTTP or browser image proof is
claimed.

**Deliberately absent donor design (contactForm).** The donor `contactForm` section carries only `{type, formRef}` and
delegates the actual form to `renderContactForm?.(section.formRef) ?? null`, a **per-render caller seam**. When the caller
authorizes no renderer the donor displays **nothing at all**; `formRef` names an intent and is never a recipient, URL,
webhook, provider, secret or delivery permission. This subset composes Uno's existing `interaction.contact` with **empty
props**, so the published Page shows a fixed, honest **delivery-OFF** notice — `Delivery is switched off. Nothing entered
here is sent or stored.` — with no `<form>`, field, submit control, handler, transport or storage. That is a deliberate
**difference** from the donor's empty output, not equivalent rendering and therefore not full `contactForm` parity. The
required migration acknowledgement is consent to show an inert notice: it is consumed during composition and discarded, so
the reference cannot be recovered from the Page, HTML, client props, ids, logs or URLs, and it neither activates a provider
nor authorizes collection of any personal data. Donor form authorization, field authoring, submit copy, confirmation states
and any delivery semantics remain outside this subset. No donor callback, form registry, Connect client, route, recipient
or notice text is imported. The composed node id is `family-<index>-contactform` — deliberately lowercase because the frozen
Uno section-id grammar admits no uppercase — which is a target-id spelling only: the donor `type` `contactForm`, the
acknowledgement key `contactForms` and every other prior family id are unchanged.

**Deliberately absent donor design (actions).** The donor action accepts `href`, `route` **or** `link` destinations, an
optional `variant`, and the section accepts `heading`/`lede`/`align`/`surface`. This subset composes none of those: it
accepts only a literal, unencoded `#family-<index>-<name>` fragment that names a top-level section the composer itself
generated, and it refuses every other donor-supported destination rather than degrading, resolving or guessing one.
The native anchor and its authored label are preserved, and the authored order is kept one-to-one, but no external,
`mailto:`, `tel:`, site-route, provider or locale-derived destination can be expressed, so `actions` is not full parity
and this ledger claims no link engine, route resolver or publication authority.

## 4. Refusal policy

- **Unsupported family** (`family:unsupported-family`): an unknown donor `type` — every one of the donor's seventeen
  families is composed, and `contactform` is never accepted as a source alias for `contactForm`. Nothing is degraded into
  a paragraph.
- **Unsupported feature** (`family:unsupported-feature`): a supported family carrying an out-of-subset field
  (`heading`, `lede`, `align`, `surface`, `links`, `visibility`, `href`, `route`, `link`, `html`, `style`, `onClick`,
  hero `actions`, a stats entry link, a `steps` item state/date, a `faq` item `href`/`icon`/`open`, a `columns` item
  `href`/`icon`/`style`, a `cards`/`features` item `image`/`meta`/`action`/`icon`, an `actions` entry `variant`/`route`/
  `link`/`target`/`rel`/`download`, a `media` section `heading`/`lede`/`position`/`surface` or image `decorative`/`href`,
  a `gallery` parent `heading`/`lede`/`surface`/`align`/`position`/`links`/`visibility`/`style`/`onClick`, a gallery item
  `href`/`meta`/`action`/`icon` or image `decorative`/`width`/`height`/`srcset`/`style`,
  a `contactForm` section without a string `formRef` or with any other key, a `contactForms` acknowledgement that is
  missing, malformed, non-array, unacknowledged for an authored reference, duplicated, unused, or carrying a mode other
  than the literal `delivery-off` or any extra key such as `recipient`/`url`/`provider`/`token`/`status`, an empty `{}`
  binding envelope,
  a section `ratio` on
  `cards`/`features`, a `ratio` authored on three columns, a column declaring both `body` and `items` or neither,
  any extra key), a missing required subset field (hero without `lede`, `quote` `role` without `attribution`, a
  `cards`/`features` section without its required `columns`, `media` without `image.src`/`image.alt`, `gallery` without
  `columns` or with a non-array `items`), an `actions`
  destination outside the accepted literal
  fragment spelling (external URL, site route, `mailto:`, `tel:`, percent-encoded, whitespace/query/suffix), a `media` or
  `gallery`
  source that is not a literal lowercase `/assets/…` raster identity, a `media`/`gallery` document with no binding, a binder
  passed
  for a document that consumed no image, an unused/extra/duplicate binding source, or a
  Markdown construct (`**bold**`,
  `[label](destination)`, backticks, leading Markdown headings, and — for the newest six families only — unmistakable
  emphasis, strike, image, blockquote or list forms).
- **Unsafe source** (`family:unsafe-source`): hostile or unreadable input — accessors (never invoked), foreign
  prototypes, symbol keys, prototype-rewriting keys, cycles, sparse or overloaded arrays, functions, `undefined`,
  non-finite numbers, over-deep or over-budget structures.
- **Target refused** (`family:target-refused`): malformed values inside accepted fields (empty/overlong text, bad
  `align`/`surface`/`ratio`/`columns` literal, zero or seven stats items, zero or nine FAQ entries, one/four or more
  than three columns, zero or nine card/feature/action items, blank or 160-plus action label, unresolved or nested
  action target, an empty/whitespace/321-code-point/safe-text-refused `media` or `gallery` alt or caption, a `gallery`
  `columns` other than literally `2`/`3`/`4` or an item count outside 2..8, an invalid owned ref
  (zone/path/extension/purpose/generated digest), a `formRef` that is empty, whitespace-padded, longer than 64
  characters or outside the pinned donor grammar (upper case, `_`, `/`, `.`, `@` or a leading hyphen; a trailing hyphen is
  permitted by that grammar), a zero or nine-entry `contactForms` list, a zero or nine-entry image binding, empty or
  thirteen column labels, blank
  label/value, unsafe script or scheme) and any candidate above the Uno 64 KiB source cap. The whole document refuses; no partial Page is
  ever returned.

## 5. Remaining obligations

No donor family is entirely unimplemented (the exact line in section 2), but **all seventeen remain bounded subsets, not
parity**. Outstanding for the seventeen composed shapes: donor Markdown rendering, link/destination representation beyond
same-document fragments, rich donor forms, the
other hero, stats, steps, quote, FAQ, columns, cards, features and actions options, the donor `steps`, `faq`, `columns`,
`cards` and `features` heading outlines, donor card borders/media/meta/actions and feature icons, the donor decorative
media form, media headings/lede/position/surface, the donor native gallery list wrapper with its optional
heading/lede/surface and implicit column default, remote image sources and Markdown captions, the donor per-render
contact seam and every authored form/delivery semantic, a composition Page, and
real published HTTP/browser proof. Any
future order must add those explicitly; this ledger authorises no new module ID, no new schema
variant and no publication
authority.
