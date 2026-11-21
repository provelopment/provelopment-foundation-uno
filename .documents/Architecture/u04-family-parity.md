# U04 — bounded Foundation→Uno family composition (source and rights ledger)

**Scope of this record.** It documents the **seventeen** donor source shapes Uno currently composes into its own v1 Page
document — `prose`, `callout`, `table`, `list`, `divider`, `hero`, `stats`, `steps`, `quote`, `faq`, `columns`, `cards`,
`features`, `actions`, `media`, `gallery`, `contactForm` — out of the donor's **seventeen** families. It is a narrow
provenance and rights ledger, not a parity record: **seventeen bounded source mappings; zero entirely unimplemented donor
families; one of seventeen fully parity-evidenced candidates (`divider`), sixteen still bounded/non-parity, subject to
independent Architect acceptance; one temporary family-composition fixture verified over production HTTP and
Chromium; no durable published family Page.** U04 remains OPEN.
This one candidate remains subject to independent Architect acceptance and is not Owner closure.

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
| `divider` | `page-document.ts` `a12d964c…` (schema), `text-sections.tsx` `caeee577…` (renderer), `section-support.tsx` `19c9bee3…` (theme border) | `ADAPT (divider semantic parity candidate)` | `type` only — the pinned donor schema is `z.strictObject({ type: z.literal("divider") })` | content, heading, lede, surface, align, spacing, children, `href`, `style`, handlers, raw HTML or script | `content.prose {variant:"divider"}` → one native `<hr class="uno-json-divider">`, no content, no focus, no interaction, no delivery behaviour; 1px `var(--uno-border)` top rule and a 2.5rem section offset (1.5rem root flex `gap` + 1rem own margin) matching the donor's `mt-10` | donor schema/renderer read-only pins; strict-shape and 12 invented-key refusals; getter-zero proof; composed/reader/HTTP/Chromium (`DIVIDER_PARITY_*`) at 390 and 1280 px in light and dark/reduced-motion |
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

## 5. WO-066/WO-067/WO-068 temporary composed-family production proof

`UNO-WO-066 / R01` closed one narrow evidence gap — that the **adapter's own output** can be accepted, installed, loaded,
served, fetched over production HTTP and inspected in Chromium — and `UNO-WO-067 / R01` widened the same single fixture to
thirteen donor shapes. `UNO-WO-068 / R03` widened that same one fixture to all **seventeen**, after repairing the two
ingress JSON-depth bounds that disagreed with the frozen Page-document contract (see the depth note below). It proves one
**temporary family-composition fixture verified over production HTTP and Chromium**, and nothing more.

* **Two bounded ingress repairs, no behaviour widening.** `UNO_SOURCE_LIMITS.jsonDepth` in
  `src/adapters/efs/uno-confined-source-reader.ts` and `UNO_PAGE_HEADER_LIMITS.jsonDepth` in
  `src/core/efs/uno-page-header.ts` were each raised from `8` to the already published
  `UNO_PAGE_DOCUMENT_LIMITS.jsonDepth: 16`. Both recursive walkers, their `depth >` refusal conditions, the `64 KiB`
  source byte caps, the `4096` node budgets, the `512` keys-per-object bound, the duplicate top-level authority-key
  scan, the prototype-pollution refusal and every confinement, Markdown, visibility and publication gate are unchanged,
  and depth 17 still refuses (`content:json-depth` / `header:json-depth`). The header projector still returns an accepted
  **header**, never a publication verdict. Without the alignment a Page the document reader accepts (for example
  `columns` with a native list, at depth 10) was refused as `content:json-depth` and then `header:json-depth`.
* **Composition, once.** The existing `scripts/verify-u04-22-module-consent.mjs` fixture runner imports the unchanged
  `src/application/compose-uno-foundation-families.ts` (`24e30fca…`) and calls `composeUnoFoundationSubset(source,
  bindings)` exactly once. The source is seventeen deterministic donor-shaped sections of original synthetic test copy —
  the original nine, unchanged in value and order (prose, warning callout, ordered list, one-item FAQ, media, two-item
  gallery, `contactForm`, two same-document actions, divider), plus appended `hero`, `stats`, `steps`, `quote`, then
  `table`, `columns` (with its authored right-hand native list), `cards` and `features` — with a
  separate binding of one owned Page plate and one `delivery-off` acknowledgement. The produced Page is
  `family-0-prose`, `family-1-callout`, `family-2-list`, `family-3-faq`, `family-4-media`, `family-5-gallery`,
  `family-6-contactform`, `family-7-actions`, `family-8-divider`, `family-9-hero`, `family-10-stats`,
  `family-11-steps`, `family-12-quote`, `family-13-table`, `family-14-columns`, `family-15-cards`,
  `family-16-features`. Every grid cell/stack child id is generated by the adapter, never authored by the test, and no
  `src/**` mapping, binding grammar, module registry or renderer file is changed for it. Five whole-Page probes over the
  middle appended families (hero `actions`, stats `href`, steps `status`, quote role-only, empty hero lede) and eight
  further probes over the last four (`table` links, ragged table row, column body-plus-list, blank column title, card
  media, card column count, feature icon, empty feature body) refuse with `family:unsupported-feature` /
  `family:target-refused` and never return a partial `document`; one authored getter on an appended item is classified
  `family:unsafe-source` with **zero** invocations.
* **Fixture, not publication.** The accepted, frozen document is serialized once to UTF-8 and installed through the
  existing reversible `prepareUnoU03FixtureTransaction` as the fifth temporary source
  `deployment/efs/content/wo066-family-composition.en-001.json`, declared at the test-only EFS route
  `/en-001/wo066-family-composition` on the one already selected Entity/Site (`e_7a3knkx60eacyhca7a0cr1k6e1` /
  `foundation` / `main`). No Entity, Site, facet, locale, selection, origin or committed content Page is added; the
  transaction restores both protected declarations byte-exactly and deletes the temporary source and plate in its
  unconditional `finally`. This is **not** a durable published family Page and creates no publication permission.
* **Header, serving and bytes.** The same composed buffer is projected by `projectUnoSelectedPageHeader` **before**
  installation and again from the **loaded** text, both times accepted with the authored title, `visibility: "public"`
  and no publication or transport field. The confined loader then accepts the installed bytes, the serving planner returns
  `served` with exactly three owned image occurrences in document order (`family-4-media#0`, `family-5-gallery#0`,
  `family-5-gallery#1`) from one donor identity bound to one Page-owned synthetic plate, and each distinct
  `/uno-media/en-001/wo066-family-composition/<n>` locator answers 200 with exactly the generated plate bytes and a
  matching `HEAD`, while wrong-occurrence, wrong-locale and unlisted paths stay closed 404s. The four last families
  contain no owned media. The plate is a generated 64×64 PNG deleted by the fixture: it is not third-party artwork and
  carries no licence claim beyond the test.
* **HTTP and browser.** Over real loopback production HTTP the composed Page answers 200 with all seventeen top-level ids
  in strict order and no duplicate; each appended family is checked inside its own region only — hero alignment
  `center`, surface `muted`, eyebrow/lede/support text and no action control; stats one `<dl>` with two `dt`/`dd` pairs and
  exactly one detail span on the first item, with no manufactured heading or currency; steps one native `<ol>` with two
  items, titles `Draft` then `Review`, one description and no `data-uno-status`, `aria-current` or date; quote one
  `figure`/`blockquote`/`figcaption` with separate attribution and role spans and the authored
  `center`/`bordered` presentation; `table` one keyboard-focusable `.uno-json-table-scroll` wrapping a genuine
  `<table class="uno-json-table">` with one authored `<caption>Synthetic table</caption>`, two `<th scope="col">` headers
  in `Phase`/`Count` order and a 2×2 `<tbody>` in `First/1`, `Second/2` order; `columns` one
  `data-uno-columns="2" data-uno-item-semantics="plain"` grid carrying the authored `data-uno-ratio="start-wide"` with two
  tight stacks, `<h2>` `Left column`/`Right column`, the left paragraph and the right native two-entry list; `cards` a
  native `<ul>` two-column list grid with two `<li>`, two `<h2>` titles and exactly one body; `features` a separately
  scoped native three-column list grid with two `<li>`, two titles, one body and no ratio, article, link, image, icon or
  fabricated content. Chromium at 390 px and 1280 px repeats those per-family assertions on the real DOM with
  direct-child counts and the table wrapper's focus state, keeps nine previous semantics (ids in order, one `main`/`h1`,
  no horizontal overflow, visible prose and warning callout, both list entries, two decoded gallery images at
  server-owned locators with one caption, keyboard FAQ focus with Enter/Space, the same-document contact action), and
  records zero foreign or provider requests and no new console error.
  The contact region still shows only the fixed delivery-OFF notice: zero forms, controls, handlers or destinations, and
  neither the donor identity nor the acknowledgement appears in the DOM.
* **`divider` is the one locally evidenced parity candidate.** The pinned donor divider is a strict `{type:"divider"}`
  object rendered as a native `<hr>` inside an unlabelled layout wrapper carrying the `mt-10` (2.5rem) section offset;
  it has no authoring id, text, heading, action, media, form, route, styling override or lifecycle field. Uno composes
  the identical authored shape into `content.prose {variant:"divider"}`, which renders one native
  `<hr class="uno-json-divider" id="family-8-divider">` — the extra anchor is Uno's own stable section id and adds no
  authoring authority or accessible name, and the omitted donor wrapper is a nonsemantic implementation detail, so the
  separator's role, content and behaviour are unchanged. Measured evidence, all executed by
  `scripts/verify-u04-22-module-consent.mjs`: `DIVIDER_PARITY_SOURCE` (frozen node, `props` exactly `{variant:"divider"}`,
  no children, neighbours `family-7-actions`/`family-9-hero`, reader re-accept), `DIVIDER_PARITY_HTTP` (exactly one
  native rule, direct child of `.uno-json`, no wrapper/label/control attribute, one `main`/`h1`) and
  `DIVIDER_PARITY_BROWSER` at 390 and 1280 px in light **and** dark/reduced-motion: computed `1px solid` theme-token
  border with all other border widths `0px`, `margin-top`/`margin-bottom` `1rem`, root flex `gap` `1.5rem`, measured
  space of `2.5rem` ±1.5 px on both sides against the browser's own root font size, `tabIndex -1`, no role, no
  controls, no animation and no perceptible transition. `DIVIDER_PARITY=PASS` is emitted only when every one of those
  executed checks passed and the surrounding family gates held. The 1rem margin is the single authorized presentation
  correction in `.uno-json-divider`; the fixture, temporary source and generated plate remain test-only and are torn
  down by the existing reversible transaction. **This classification is a local evidence claim awaiting independent
  Architect acceptance; it is not Owner stage closure, changes no other family and raises no stage proxy.**
* **No parity follows from this.** The acknowledged `formRef` is still consumed and discarded, and the donor's own
  absent-seam null render still differs from Uno's visible OFF notice. The donor `steps` outline uses `<h3>` headings where
  this bounded target renders `<p>` titles, the donor `faq`, `columns`, `cards` and `features` heading outlines differ
  (Uno renders nested `<h2>`), the donor gallery list wrapper is not reproduced, and Markdown, links, remote media and
  every authored form/delivery semantic remain unimplemented. The last four families are bounded structural samples:
  `table` is not a donor Markdown table and carries no links, sorting or merged cells, `columns` discloses the
  h2-versus-h3 outline difference, and `cards`/`features` deliberately share one list-grid target with no donor borders,
  media, meta, actions or icons. This is **one temporary seventeen-shape integration slice** with
  all seventeen bounded shapes sampled over the temporary Page; sixteen of the seventeen remain bounded and non-parity,
  and the single `divider` candidate above is locally evidenced only. There is **no durable published family Page**, no
  deployment and no owner Site decision.

## 6. Remaining obligations

No donor family is entirely unimplemented (the exact line in section 2). **Sixteen of the seventeen remain bounded
subsets, not parity**; the single `divider` candidate is locally evidenced and awaits independent Architect acceptance.
Outstanding for those sixteen shapes: donor Markdown rendering, link/destination representation beyond
same-document fragments, rich donor forms, the
other hero, stats, steps, quote, FAQ, columns, cards, features and actions options, the donor `steps`, `faq`, `columns`,
`cards` and `features` heading outlines, donor card borders/media/meta/actions and feature icons, the donor decorative
media form, media headings/lede/position/surface, the donor native gallery list wrapper with its optional
heading/lede/surface and implicit column default, remote image sources and Markdown captions, the donor per-render
contact seam and every authored form/delivery semantic, a durable composition Page and family-Page
browser proof beyond the one temporary fixture in section 5. Any
future order must add those explicitly; this ledger authorises no new module ID, no new schema
variant and no publication
authority.
