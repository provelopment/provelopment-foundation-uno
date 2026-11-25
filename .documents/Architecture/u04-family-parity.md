# U04 — bounded Foundation→Uno family composition (source and rights ledger)

**Scope of this record.** It documents the **seventeen** donor source shapes Uno currently composes into its own v1 Page
document — `prose`, `callout`, `table`, `list`, `divider`, `hero`, `stats`, `steps`, `quote`, `faq`, `columns`, `cards`,
`features`, `actions`, `media`, `gallery`, `contactForm` — out of the donor's **seventeen** families. It is a narrow
provenance and rights ledger, not a parity record: **seventeen bounded source mappings; zero entirely unimplemented donor
families; twelve of seventeen fully parity-evidenced candidates (`divider`, `prose`/`callout` under `UNO-WO-084 / R01`
checkpoint A1, `table` under `UNO-WO-110 / R01`, `list` under `UNO-WO-111 / R01` at the earned `5/17` / `47/59` A2 row,
`hero` under `UNO-WO-112 / R01` at `6/17` / `48/59`, `stats` under `UNO-WO-113 / R01` at `7/17` / `49/59`, `steps` under
`UNO-WO-114 / R01` at the earned **B1** `8/17` / `50/59` row, `quote` under `UNO-WO-117 / R01` at `9/17` / `51/59`,
`faq` under `UNO-WO-118 / R01` at the checkpoint-free interim `10/17` / `52/59`, `columns` under `UNO-WO-119 / R01` at the
earned **B2** `11/17` / `53/59` row, and `media` under `UNO-WO-120 / R02` at the checkpoint-free twelve-family `12/17` /
`54/59` row), five still bounded/non-parity (with the
bounded authored-heading and plain-text-lede modes for `cards`/`features`, which add no parity credit); one **durable** family composition published on the existing committed
Components Page under `UNO-WO-078 / R01`**, verified over real production HTTP and Chromium and still a bounded
composition, never a parity uplift.** U04 remains OPEN. **B2 (`11/17` / `53/59`) is earned by `UNO-WO-119 / R01`** with
`quote`, `faq` and `columns` all credited by executed evidence, and `UNO-WO-120 / R02` credits `media` without moving that row:
the checkpoint-free twelve-family result is `12/17` / `54/59`. Earlier rows (`B1` `8/17` / `50/59` and the nine-, ten- and
eleven-family interims `9/17` / `51/59`, `10/17` / `52/59`, `11/17` / `53/59`) are retained as regressions, and no later
checkpoint target — `C1` included — is asserted here.
That one `divider` candidate was independently accepted under `UNO-WO-069 / R01` and is not Owner closure.

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
| `prose` | `text-sections.tsx` `caeee577…`; `page-document.ts` `a12d964c…` (schema spreads `headingFields`) | `PARITY (A1, UNO-WO-084 / R01)` | `type`, `body`, optional Markdown `lede`, optional plain-text `heading` (≤160 code points), optional closed `align`/`surface` | `links`/`visibility`, HTML, scripts, images, unsafe destinations, unknown keys | rich form: one `content.prose {text, markdown:true, heading?, lede?, align?, surface?}` rendering `<section class="uno-json-prose" data-uno-align data-uno-surface>` with an authored `<h2 class="uno-json-prose-heading">`, a Markdown lede and the parsed Markdown body (`strong`/`em`/`code`/lists/headings/classified links); no authored rich field: the previous plain paragraph and outline stack stay byte-identical | composed + reader round-trip + refused markup/image/script-scheme + served-HTTP markup + twenty 390/1280 light/dark Chromium checks (h2/lede/emphasis/code/link/focus/overflow/no external request) |
| `callout` | `text-sections.tsx` `caeee577…`; `page-document.ts` `a12d964c…` (schema spreads `headingFields`) | `PARITY (A1, UNO-WO-084 / R01)` | `type`, `body`, optional `tone` (note/info/warning), optional Markdown `lede`, optional plain-text `heading`, optional closed `align`/`surface` | other tones, surrogate `role="alert"` severity, HTML, scripts, images, unsafe destinations, unknown keys | the authored heading and lede now compose **inside** the accent: one `content.prose {variant:"callout", tone?, heading?, lede?, markdown?, align?, surface?}` rendering `<section class="uno-json-callout" data-uno-tone …>` whose own `<h2 class="uno-json-prose-heading">` and Markdown lede precede the Markdown body; a tone-only callout keeps its previous markup byte-identically | composed + reader round-trip + refused markup/image + served-HTTP markup with inside-heading order + twelve 390/1280 light/dark Chromium checks (tone, inside heading, no alert role, no overflow) |
| `table` | `structure-sections.tsx` `65d254e1…`; `page-document.ts` `a12d964c…` (schema spreads `headingFields`) | `PARITY (UNO-WO-110 / R01)` | `type`, `columns`, `rows`, optional Markdown `caption` (≤320 code points), optional closed `surface`, optional plain-text `heading` (≤160 code points) and Markdown `lede` (≤4000 code points) | sorting, spans, merged cells, Markdown in **cells**, links, unsafe constructs in `caption`/`lede`, unknown keys | no text: unchanged `content.prose {variant:"table",…}` → scroll wrapper, `<caption>`, `<th scope="col">`; authored heading/Markdown lede/caption/surface: one `layout.stack {}` whose heading precedes one native `uno-json-table-section` carrying `data-uno-surface`, the Markdown lede and the unchanged `<table>` inside a `tabindex="0"` scroll control | nine no-text baselines + composed/refusal/markup + reader round-trip + four malformed-table whole-Page refusals + served-HTTP rich DOM + four 390/1280 light and dark/reduced-motion Chromium observations with the focused scroll control |
| `list` | `items-sections.tsx` `bc729d6a…`; `page-document.ts` `a12d964c…` (schema spreads `headingFields`) | `PARITY (UNO-WO-111 / R01)` | `type`, `items[{label, detail?}]` with at most one destination — a proven-classifier `href`, a same-Site published `route`, or one declared application `link`; optional `ordered`, optional closed `surface`, optional plain-text `heading` (≤160 code points) and Markdown `lede` (≤4000 code points) | icons, nested lists, unsafe schemes, undeclared `link` ids, and every unresolvable `route` (cross-Site or cross-Facet, wrong locale, unlisted, draft, ambiguous or mismatching) which refuses the **whole Page**; Markdown in `label` | no text: unchanged `content.prose {variant:"list",…}` → `<ul>`/`<ol class="uno-json-list">`; authored heading/Markdown lede/surface: one `layout.stack {}` whose heading precedes one native `uno-json-list-section` carrying `data-uno-surface`, the Markdown lede and the list; an `href` renders one anchor with `rel="noreferrer noopener"`, a proven `route` renders the serving boundary's own canonical URL, an inactive `link` renders inert label text | nine no-text baselines + composed/refusal/markup + reader round-trip + served-HTTP anchors + four 390/1280 light and dark/reduced-motion Chromium observations + the three-Site P6 destination proof (root, `/docs/` prefix and nested route), its cross-Site/cross-Facet/wrong-locale/unlisted/draft whole-Page refusals, and both declaration phases |
| `divider` | `page-document.ts` `a12d964c…` (schema), `text-sections.tsx` `caeee577…` (renderer), `section-support.tsx` `19c9bee3…` (theme border) | `ADAPT (divider semantic parity candidate)` | `type` only — the pinned donor schema is `z.strictObject({ type: z.literal("divider") })` | content, heading, lede, surface, align, spacing, children, `href`, `style`, handlers, raw HTML or script | `content.prose {variant:"divider"}` → one native `<hr class="uno-json-divider">`, no content, no focus, no interaction, no delivery behaviour; 1px `var(--uno-border)` top rule and a 2.5rem section offset (1.5rem root flex `gap` + 1rem own margin) matching the donor's `mt-10` | donor schema/renderer read-only pins; strict-shape and 12 invented-key refusals; getter-zero proof; composed/reader/HTTP/Chromium (`DIVIDER_PARITY_*`) at 390 and 1280 px in light and dark/reduced-motion |
| `hero` | `page-document.ts` `a12d964c…` (`heroSectionSchema`: optional `eyebrow`, `lede`, `actions`, `support`, `align`, `surface`; `PAGE_MARKDOWN_FIELDS` lists `hero.lede` and `hero.support`); `media-sections.tsx` `e3f3a12e…` | `PARITY (UNO-WO-112 / R01)` | `type`, at least one of the Markdown-capable `lede`/`support` (≤4000 code points each), optional plain-text `eyebrow` (≤160 code points), optional closed `align`/`surface`, and 1–3 `actions[{label, href, variant?}]` whose single destination is a static `mailto`/`https` `href` classified by the unchanged safe-destination policy, each with the closed `primary`/`secondary`/`link` variant | donor `route`/`link` action destinations (site-local route projection belongs to the serving boundary, and an application link is inert elsewhere), a body-less hero, four or more actions, unknown variants, unsafe or relative action destinations, Markdown in `eyebrow`, unknown keys | `content.hero {eyebrow?, lede?, support?, markdown?, align?, surface?, actions?}` → `<section class="uno-json-hero" data-uno-align data-uno-surface>` whose plain field stays the byte-identical `<p>`, whose Markdown-capable `lede`/`support` render through the shared family Markdown renderer inside `uno-json-hero-lede`/`-support` when the adapter set `markdown`, and whose actions render one `<ul class="uno-json-actions uno-json-hero-actions">` of ordinary anchors (`rel="noreferrer noopener"`, `data-uno-variant`) or same-document `#<section-id>` anchors | composed + reader round-trip + markup (plain byte-identical, Markdown, both actions) + six whole-source hero refusals + served-HTTP region predicate with both actions parsed independently + four 390/1280 light and dark/reduced-motion Chromium observations asserting both Markdown bodies, both actions' href/rel/variant/focus and no control |
| `stats` | `page-document.ts` `a12d964c…` (`statsSectionSchema` spreads `headingFields` — optional `heading`, Markdown-capable `lede` — and `surfaceField`; `statItemSchema.detail` is `markdownTextSchema`); `items-sections.tsx` `bc729d6a…` (`StatsSection` renders `SectionHeading` before the stat list, each item a value, a label and an optional Markdown detail) | `PARITY (UNO-WO-113 / R01)` | `type`, `items[1..6]{value,label,detail?}` with a Markdown-capable `detail` (≤320 code points), optional plain-text `heading` (≤160 code points), optional **Markdown** `lede` (≤4000 code points) and the donor's closed `surface` | donor `heading` **Markdown**, item `href`/`icon`/`route`/`link`, embedded images or markup in any field, seven or more entries, blank values or labels, unknown keys or surfaces, and the donor's own heading/lede typography | no text: unchanged `content.stats {items}` → `<section class="uno-json-stats">` with `<dl>`/`<dt>`/`<dd>`; heading/lede/surface: one `layout.stack {}` on the same family id holding the authored `content.heading {level:2}` at `${id}-heading`, the Markdown-capable `content.prose {text, markdown?}` at `${id}-lede`, then `content.stats {items, surface?, markdown?}` at `${id}-stats` | one authored `<h2>`, the Markdown lede through the shared family renderer, and the unchanged `<dl class="uno-json-stats-list">` whose first item's Markdown detail renders `<div class="uno-json-stat-detail">` while a plain detail keeps the escaped `<span>`; no invented heading, second list, link, currency or control | composed (legacy JSON byte-identical, plain lede byte-identical) + reader round-trip + markup (plain and Markdown) + six whole-source stats refusals + served-HTTP region predicate and pair parser + four 390/1280 light and dark/reduced-motion Chromium observations asserting both Markdown bodies, the surface and the pairs |
| `steps` | `page-document.ts` `a12d964c…` (`stepsSectionSchema` spreads `headingFields` — optional `heading`, Markdown-capable `lede` — and `surfaceField`; `stepItemSchema.body` is `markdownTextSchema`; `itemsOf(stepItemSchema, 12)`); `items-sections.tsx` `bc729d6a…` (`StepsSection` renders `SectionHeading` before a native `<ol>` whose items are a level-3 title plus an optional Markdown body) | `PARITY (UNO-WO-114 / R01)` | `type`, `items[1..12]{title, body?}` with a Markdown-capable `body` (≤320 code points), optional plain-text `heading` (≤160 code points), optional **Markdown** `lede` (≤4000 code points) and the donor's closed `surface` | donor `heading` **Markdown**, item `href`/`route`/`link`/`status`/`dateLabel`/`icon`, embedded images or markup in any field, thirteen or more entries, blank titles, unknown keys or surfaces, and the donor's own ordinal-marker presentation | no text: unchanged `content.timeline {items,surface?}` → `<ol class="uno-json-timeline-list">`, one `<li>` per authored step in source order; heading/lede/surface: one `layout.stack {}` on the same family id holding `content.heading {level:2}` at `${id}-heading`, the Markdown-capable `content.prose {text, markdown?}` at `${id}-lede`, then `content.timeline {items, surface?, itemHeadingLevel:3, markdown?}` at `${id}-timeline` | one authored `<h2>`, the Markdown lede through the shared family renderer, and the unchanged native `<ol>`/`<li>` sequence carrying one `<h3 class="uno-json-timeline-title">` per authored step and the authored Markdown body as `<div class="uno-json-timeline-description">` (a plain body keeps the escaped `<p>`); no invented status, current step, date, icon, heading, second list, control or link | composed (legacy JSON byte-identical incl. `surface`, plain lede/body byte-identical) + reader round-trip + markup (plain and Markdown) + seven whole-source steps refusals + served-HTTP region and ordered-item predicates + four 390/1280 light and dark/reduced-motion Chromium observations asserting both Markdown bodies, the surface and the ordered titles |
| `quote` | `page-document.ts` `a12d964c…` (`quoteSectionSchema`: required Markdown-capable `body`, optional plain `attribution`/`role`, `align`, `surface`, no `heading`/`lede`; `PAGE_MARKDOWN_FIELDS` lists `quote.body`); `text-sections.tsx` `caeee577…` (`QuoteSection` renders one `<figure>` with a `<blockquote>` and a caption that appears **only** when an attribution exists, so a role-only caption is suppressed) | `PARITY (UNO-WO-117 / R01)` | `type`, required Markdown-capable `body` (≤4000 code points), optional plain-text `attribution` (≤160 code points) and `role` (≤160 code points, drawn only beside an attribution), and the donor's closed `align`/`surface` | donor `heading`/`lede`, a role-only **caption** (suppressed by the donor, not rendered), item collections, links/HTML/images inside the quotation, an unsafe or protocol-relative destination, Markdown in `attribution`/`role`, unknown keys | `content.testimonials {items:[{quote, attribution?, role?}], align?, surface?, markdown?}` → one `<figure class="uno-json-testimonial">` holding one `<blockquote class="uno-json-testimonial-quote">` whose quotation renders through the shared family Markdown renderer when the adapter flagged it (and as the byte-identical escaped text otherwise), plus one `<figcaption>` with separate attribution and role spans only when a caption is authored | composed (plain form byte-identical, Markdown form declared) + reader round-trip from data and JSON text + twelve whole-source quote refusals + four direct-document refusals (declared Markdown, Unicode in both forms, closed flag) with the native role-only caption still accepted + served-HTTP region predicate and item parser + four 390/1280 light and dark/reduced-motion Chromium observations asserting the parsed quotation, the closed presentation pair, both caption spans and no invented heading or control |
| `faq` | `structure-sections.tsx` `65d254e1…` (donor `FaqSection`: optional plain `heading`, **Markdown** `lede`, closed `surface`, 1–24 ordered `{question, answer}` items, each question rendered as a **level-3 heading inside its own native `<details>/<summary>`** and each answer as Markdown); `page-document.ts` `a12d964c…` (schema spreads `headingFields`, `surfaceField`, `itemsOf(faqItemSchema, 24)`; `PAGE_MARKDOWN_FIELDS` lists `faq.answer` and `faq.lede`) | `PARITY (UNO-WO-118 / R01)` | `type`, `items[1..24]{question, answer}` with a plain `question` (≤160 code points) and a **Markdown-capable** `answer` (≤4000 code points), optional plain `heading` (≤160 code points), optional **Markdown** `lede` (≤4000 code points) and the donor's closed `surface` | donor item `href`/`icon`/`open`, an authored open state, Markdown in `question`, markup/images/unsafe or protocol-relative destinations in `answer`/`lede`, an authored `align`, unknown keys or surfaces, twenty-five or more entries, and a hand-authored accordion beyond its ordinary eight panels | one native `interaction.accordion` per authored group of at most **eight** items (1–8 = one group, 9–24 = consecutive groups), each carrying `summaryHeadingLevel: 3` and the donor's closed `surface`; authored heading/lede precede the group(s) in the documented stack; a Markdown answer is one `content.prose {text, markdown: true}` child, a plain answer the byte-identical escaped paragraph | one `<div class="uno-json-accordion" data-uno-surface>` holding one native `<details class="uno-json-disclosure">` per authored item, in order, each with `<summary><h3>question</h3></summary>` and its own `uno-json-disclosure-body`; the Markdown answer renders through the shared family renderer (real `<strong>`, `<a rel="noopener noreferrer">`), an answer without Markdown stays one escaped `<p>`; no `<button>`, form, frame, `open` attribute or invented heading | `composed (plain and Markdown, plus the 1/8/9/24/25 boundary) + reader round-trip + thirteen whole-source refusals + served-HTTP region and disclosure parsers + four 390/1280 light and dark/reduced-motion Chromium observations asserting the questions, the closed surface, the owned Markdown answer, every disclosure initially closed, both opened and closed by keyboard independently, and no inventable state or control; `UNO-WO-118 / R02` adds the executed stylesheet contract, the computed `getComputedStyle` comparison of `plain`/`muted`/`bordered`/absent in the same four cases, and a served 24-item page proving all three groups present the authored surface |
| `columns` | `page-document.ts` `a12d964c…`; `structure-sections.tsx` `65d254e1…` (donor `ColumnsSection`: optional plain `heading`, **Markdown** `lede`, closed `surface`, closed `ratio`, 2–3 ordered columns each a plain title with one Markdown body or one list of up to 24 plain labels); `section-support.tsx` `19c9bee3…` (`SectionHeading`, Markdown body, native list) | `PARITY (UNO-WO-119 / R01)` | `type`, `items[2..3]` of `{title, body}` **or** `{title, items[1..24]}`, optional plain `heading` (≤160 code points), optional **Markdown** `lede` (≤4000 code points), the closed `surface` and the closed `ratio` (`equal`/`start-wide`/`end-wide`, validated for two **and** three columns) | item `href`/`icon`/`style`, nested donor sections, Markdown in a title or label, one or four columns, a ratio outside the closed set, twenty-five labels, an empty list, both or neither body/list, unknown keys or surfaces, and unsafe/ill-formed Markdown or Unicode | a bare `layout.grid {columns, ratio?}` at the family anchor when nothing else is authored (byte-identical legacy output), otherwise one `layout.stack {surface?}` at the anchor holding the authored `content.heading {level:2}`, the Markdown lede and a `layout.grid` at `${id}-grid`; each column is a `layout.stack {gap:"tight"}` with a `content.heading {level:3}` title then one Markdown `content.prose` body or up to two **consecutive** native lists of at most twelve labels; the authored ratio reaches the grid only for two columns (three columns are equal by the donor's own rule) | `<div class="uno-json-stack" data-uno-surface>` with `<h2>`, Markdown lede, `<div class="uno-json-grid" data-uno-columns data-uno-ratio>` of `.uno-json-cell`s holding `<h3>`, Markdown body with `<a rel="noopener noreferrer">` or `<ul class="uno-json-list">` of plain `<span>` labels; no `<button>`, form, frame or invented heading | composed (legacy byte-identity + rich + 1/12/13/24/25 labels + 2/3 columns + ratio suppression) + reader round-trip + native non-two-column ratio refusal + ten whole-Page refusals + served-HTTP markup and label parsing + four served variants measured in real Chromium at 1280 and 390 px in light and dark/reduced motion (equal/start-wide/end-wide/three-equal geometry, mobile reading order, computed surfaces, no overflow) + rights |
| `cards` | `page-document.ts` `a12d964c…` (strict `cardsSectionSchema`, `cardItemSchema`, `headingFields` with optional `heading` and Markdown-capable `lede`, `itemColumnsField`); `media-sections.tsx` `e3f3a12e…` (native `<li>` cards with optional media/meta/action, `SectionHeading` `<h2>` + Markdown lede, `ItemTitle` `<h3>`); `section-support.tsx` `19c9bee3…` (`SectionHeading`, `ItemTitle`, `columnsClass` default) | `ADAPT (bounded grid plus authored section heading and plain-text lede)` | `type`, required `columns` 2\|3\|4, `items[1..8]{title,body?}`, optional plain-text `heading` (nonempty, unpadded, ≤160 code points, no Markdown or markup), optional plain-text `lede` (nonempty, unpadded, ≤4000 code points, no Markdown, markup, control text or unpaired surrogate) | donor `surface`, an omitted `columns`, item `image`/`meta`/`action`/`href`/`icon`/`style`, Markdown and links — including the donor's Markdown-capable `lede` — donor borders, and the donor heading-less `<h3>` outline | **no-lede** (heading-less or headed-only) is byte-identical to the previously accepted output; `heading+lede` is one `layout.stack {}` holding `content.heading {level:2}`, one `content.prose {text}` at `${id}-lede` and the grid, whose item titles are `content.heading {level:3}`; `lede-only` is the same stack with `[content.prose {text}, layout.grid]` and heading-less level-2 item titles, inventing no heading | heading-less `<ul data-uno-item-semantics="list" role="list">` of `<li>` with `<h2>` titles; headed `<div class="uno-json-stack">` with one authored `<h2>`, then exactly one escaped `<p class="uno-json-prose" id="family-N-cards-lede">` in source order before the native `<ul>/<li>` list of `<h3>` titles; lede-only renders the paragraph before the list with no invented `<h2>` and only authored card bodies as further paragraphs | composed (four pre-WO-071 baselines byte-identical + `heading+lede` + `lede-only`) + required-columns/count/Markdown/heading/lede refusal + `<h2>/<p>/<h3>` order and markup |
| `features` | `page-document.ts` `a12d964c…` (strict `featuresSectionSchema`, `featureItemSchema`, `headingFields` with optional `heading` and Markdown-capable `lede`, `itemColumnsField`); `media-sections.tsx` `e3f3a12e…` (native `<li>` features with optional decorative icon, `SectionHeading` `<h2>` + Markdown lede, `ItemTitle` `<h3>`); `section-support.tsx` `19c9bee3…` | `ADAPT (bounded grid plus authored section heading and plain-text lede)` | `type`, required `columns` 2\|3\|4, `items[1..8]{title,body?}`, optional plain-text `heading` (nonempty, unpadded, ≤160 code points, no Markdown or markup), optional plain-text `lede` (nonempty, unpadded, ≤4000 code points, no Markdown, markup, control text or unpaired surrogate) | donor `surface`, an omitted `columns`, item `icon`/`image`/`href`/`style`, Markdown and links — including the donor's Markdown-capable `lede` — donor icon rendering, and the donor heading-less `<h3>` outline | the same three lede modes: **no-lede** byte-identical; `heading+lede` one `layout.stack {}` with `content.heading {level:2}`, `content.prose {text}` at `${id}-lede` then the grid with level-3 item titles; `lede-only` `[content.prose {text}, layout.grid]` with level-2 item titles and no invented heading | the same native `<ul role="list">`/`<li>` structure, with exactly one escaped `<p class="uno-json-prose" id="family-N-features-lede">` after the authored `<h2>` and before the list; per-feature `<h3>` titles in headed mode and `<h2>` titles in lede-only mode | composed (four pre-WO-071 baselines byte-identical + `heading+lede` + `lede-only`) + required-columns/count/Markdown/heading/lede refusal + `<h2>/<p>/<h3>` order and markup |
| `actions` | `page-document.ts` `a12d964c…` (strict `actionsSectionSchema`, `actionSchema`, destination and variant forms); `text-sections.tsx` `caeee577…` (donor `ActionsSection` genuine link list); `section-support.tsx` `19c9bee3…` (donor `ActionLinks` item presentation) | `COMPOSE (same-document anchor subset)` | `type`, required `actions[1..8]{label,href}` where the label is plain text and `href` is a literal `#family-<index>-<name>` fragment naming an existing **top-level** composed section | donor `href`/`route`/`link` destination alternatives, action `variant`, section `heading`/`lede`/`align`/`surface`, Markdown labels, external/`mailto:`/`tel:`/site-route destinations, percent-encoded, suffixed, whitespace or missing/nested targets | `content.actions {items:[{label,targetId}]}`, preserving authored order and each authored anchor one-to-one; the composer's own exact top-level ID equality check runs before the Uno reader | `<ul class="uno-json-actions" id="family-13-actions">` with one direct `<li class="uno-json-action-item">` and one native `<a class="uno-json-action" href="#<targetId>">` per authored action | composed + destination/label refusal + native-anchor markup |
| `media` | `page-document.ts` `a12d964c…` (strict `imageSchema`, `mediaSectionSchema`, donor `src`, alt/decorative, optional caption, heading/lede/position/surface); `media-sections.tsx` `e3f3a12e…` (donor `<figure>` image and caption, optional `position`); `section-support.tsx` `19c9bee3…` (donor image presentation and alt semantics); local Uno `src/core/assets/uno-owned-media.ts` `f988a0e5…` (`UnoOwnedAssetRef`, `readUnoOwnedAssetRef`, `readUnoOwnedMediaPath`, four zones, per-purpose extension/MIME, generated-SHA policy) | `COMPOSE (explicit owned-image binding subset)` | `type`, required `image{src,alt}` with a literal donor `/assets/…` identity (lowercase raster extension, path accepted by the local owned-media policy) and an authored nonblank descriptive alt, optional plain `caption`; a caller-supplied `{images:[{source,owned}]}` binding maps each consumed donor identity to a separately authored `{zone,path,integrity?}` image ref | donor decorative images (empty alt), donor `heading`/`lede`/`position`/`surface`, remote or protocol-relative sources, SVG, uppercase extensions, percent-encoding, query/fragment, donor Markdown caption and any automatic URL-to-asset migration, unbound/missing/extra/duplicate bindings, Markdown text | `media.image {asset,alt,caption?}` where `asset` is the validated owned ref from the binding; donor `src` never becomes a rendered URL, and the binding is validated before a candidate exists | real `<figure class="uno-json-media" id="family-14-media">` only when the server supplies a resolved image projection; without that projection no figure and no image is emitted, and the donor path never appears as a `src` | PARITY (UNO-WO-120 / R02): heading, Markdown lede and caption to 4,000 including unformatted text, closed position/surface with textless placement, the donor's optional decorative boolean normalized to the native empty alt, and an authored `plain` surface proven against its absence; composed + fourteen closed refusals + six-variant four-case Chromium |
| `gallery` | `page-document.ts` `a12d964c…` (strict `gallerySectionSchema`: `items[2..12]{image,caption?}`, `imageSchema` `src`/`alt`/decorative, optional `columns`, heading/lede/surface); `media-sections.tsx` `e3f3a12e…` (donor native `<ul>`/`<li>` grouping, a `<figure>` per image, Markdown caption); `section-support.tsx` `19c9bee3…` (donor image alternative contract and column defaults); local Uno `src/core/assets/uno-owned-media.ts` `f988a0e5…` (owned-ref policy); local Uno `src/core/page-document.ts` `2d968300…` (`media.gallery {columns:2|3|4,items[2..12]{asset,alt,caption?}}`) and `src/components/uno-page-sections.tsx` `cde15a6b…` (`<div class="uno-json-gallery">` of `<figure class="uno-json-media-item">` children) | `COMPOSE (explicit owned-gallery binding subset)` | `type`, required `columns` exactly `2`, `3` or `4`, required `items[2..8]` each exactly `{image:{src,alt},caption?}` with a literal donor `/assets/…` identity and an authored nonblank descriptive alt; the same caller-supplied `{images:[{source,owned}]}` binding as `media`, whose unique source set must equal the set consumed across **both** families | donor optional `heading`/`lede`/`surface`, implicit column default, decorative images (empty alt), donor `position`/`align`, item `href`/`meta`/`action`/`icon`, image `width`/`height`/`srcset`/`style`, remote or protocol-relative sources, SVG, uppercase extensions, Markdown text, unbound/missing/extra/duplicate bindings | `media.gallery {columns,items:[{asset,alt,caption?}]}` built in authored item order, with each missing caption kept absent; donor `src` never becomes a rendered URL | one `<div class="uno-json-gallery" data-uno-columns="…" id="family-N-gallery">` with exactly one `<figure class="uno-json-media-item">` per projected item, and no gallery at all without a matching server projection | composed + explicit-binding refusal + projection-gated markup |
| `contactForm` | donor `src/core/page-document.ts` `a12d964c…` (strict `contactForm` section = `{type, formRef}`; `formRef` trimmed, nonempty, max 64, `/^[a-z0-9][a-z0-9-]*$/`, an intent reference only); donor `src/components/site/page-document-content.tsx` `fc35a52d…` (`renderContactForm?.(section.formRef) ?? null` — a per-render caller seam, absent means nothing rendered); local Uno `src/core/page-document.ts` `2d968300…` (`interaction.contact` with empty props `{}` and optional heading/description/fields/submitLabel, no `formRef`) and local `src/components/uno-page-sections.tsx` `cde15a6b…` (fixed `Delivery is switched off. Nothing entered here is sent or stored.` notice, no form) | `COMPOSE (acknowledged delivery-OFF notice subset)` | `type` and a literal `formRef` in the pinned donor grammar, plus a separate caller acknowledgement `{contactForms:[{formRef, mode:"delivery-off"}]}` matching it exactly; output is one `interaction.contact` node with empty props and nothing else. The generated node id is `family-<index>-contactform`: the donor `type` stays canonical `contactForm`, while only the target suffix is lowercase because the frozen Uno section-id grammar `/^[a-z][a-z0-9-]{0,47}$/u` admits no uppercase | donor `formRef` trim semantics, any `heading`/`description`/`fields`/`submitLabel`, any provider/recipient/URL/webhook/token/secret/status/method/action key, an unacknowledged or mismatched reference, a non-`delivery-off` mode, and any donor form UI or delivery behaviour | `interaction.contact {props:{}}`; the donor `formRef` is validated, acknowledged, then **discarded**, so it never reaches the Page, HTML, client props, id suffix, log or URL | one `<section class="uno-json-contact">` whose only content is the existing fixed OFF status line: no `<form>`, `<input>`, `<textarea>`, `<button>`, `action`, `method`, handler, iframe, script or echoed reference | composed + acknowledgement and refusal tests + real React markup proof |

Each accepted output is one validated, deep-frozen `UnoPageDocument` with `version: 1`, the donor title and one node
per input section (`family-<index>-<type>`). Absent optional fields stay absent; the renderer owns visual defaults.
No donor Markdown, link destination, image or media form reaches a visitor except through the separately credited families;
every credited family renders only what its own row above admits, and an uncredited family still renders none of it.

**The FAQ family and the donor's twenty-four items (`UNO-WO-118 / R01`).** The pinned donor `faq` schema spreads
`headingFields`, carries the closed `surfaceField`, and accepts 1–24 ordered `{question, answer}` items whose question is
plain and whose answer is Markdown; its renderer draws each question as a level-3 heading inside its own native
`<details>/<summary>` and each answer as Markdown. This order adopts all of that. Two native additions make it representable:
the disclosure group gained the closed `surface` (one `data-uno-surface` on the group wrapper, absent means no attribute),
and an answer is read as Markdown at the donor's own 4,000 code-point limit, flagged `markdown: true` only when it actually
authors Markdown so a plain answer stays the byte-identical escaped paragraph; the lede is now Markdown too, read by the
same lede reader the five `headingFields` families have always used, so their refusal vocabulary is unchanged.
**The 24-item ceiling is represented without raising a bound.** The ordinary `interaction.accordion` group is *still* 1–8
panels — a hand-authored nine-panel accordion is refused by the strict reader exactly as before. An authored FAQ of 9–24
entries is instead composed as **consecutive ordinary groups** of at most eight, in authored order, each entry naming the
answer child it owns by the identity it already had (`family-N-faq-answer-<i>`); one group keeps the documented root identity
(`family-N-faq`, or `family-N-faq-accordion` beneath an authored heading/lede), so every input that fitted before is
byte-identical. The container of several groups is a plain `layout.stack` whose children are those groups, and the authored
`surface` is carried by each group rather than once around all of them — the one presentation consequence of splitting a
24-item donor list, disclosed here rather than smoothed over. **Question bound audit:** the donor question is a plain
summary label, and Uno's positional label bound is 160 code points, which is enforced explicitly in the adapter so the
refusal is this family's own; the donor's own question length is not widened by this order. The donor's custom open state,
item links/icons, an authored `align` and any Markdown in the question remain refused, and no disclosure is ever rendered
open: the platform's `<details>` state stays untouched and independent per item.

**The Columns family in full (`UNO-WO-119 / R01`).** The donor's `ColumnsSection` carries an optional plain heading, a
**Markdown** lede, a closed `surface`, a closed `ratio`, and two or three ordered columns, each a plain title with exactly one
Markdown body **or** one list of up to twenty-four plain labels. All of it now composes through the existing modules. Three
adaptations are recorded rather than smoothed over. **(1) Ratio on three columns.** The donor validates the ratio and then lays
three columns out equally; Uno's native grid refuses a ratio on anything but two columns. The value is therefore validated for
two *and* three columns, and only a two-column authored ratio reaches the grid — the native refusal is untouched and proven.
**(2) Twenty-four labels.** The native prose list is bounded at twelve, so a column with 13–24 labels composes as **two
consecutive native lists** of at most twelve in the same column: order, plain list semantics and column ownership are preserved,
the global cap is not moved, and the twenty-fifth label refuses the whole Page. **(3) Section surface.** The closed surface sits
on the section **wrapper**, so it covers the authored heading, the Markdown lede **and** the column grid — the whole authored
section, as the donor's own outer section does. `plain` keeps the ordinary stack, the absence convention every Uno surface
module follows, and the bare grid without a heading, lede or surface is byte-identical to the previously accepted output. The
browser proof for these four served variants is **completed by `UNO-WO-119 / R02`** below, which executes all four
width × scheme cases; R01 measured only the light/normal pair and asked merely which cell was wider.

**The Media family in full (`UNO-WO-120 / R02`; R01 superseded).** The donor's `MediaSection` carries an optional plain `heading`,
a Markdown-capable `lede`, a figure with a Markdown-capable `caption` and an optional `decorative` boolean, plus the closed
`position` and `surface`. Uno now expresses all of that **through the existing `media.image` module and the section stack**, with
no new module id and no new asset authority: the composer composes a `layout.stack` at the family anchor whose children are the
figure and one owned text stack — `position: "start"` puts the figure first, `end` the text first — and `surface` sits on the
wrapper, so it covers the heading, the lede **and** the figure, exactly as the donor's own outer section does. `layout.stack`
gained one closed optional `position` (`start`/`end`); the shipped stylesheet lays such a stack out as **two equal tracks** above
`64rem` and as one column, in the same authored order, below it. `media.image` gained one closed optional `markdown` literal.

**The five corrections R02 makes to R01, each executed.** (1) **The optional boolean is adopted as the donor declares it**:
`decorative` may be absent, `false` or `true`; an explicitly `true` flag may **omit** `alt`, and the accepted node is normalized to
the native empty alternative, while R01's explicit `alt: ""` form still composes. A wrong type, a nonempty alt beside `true`, and
an absent or empty alt without `true` all still refuse. (2) **Every donor-supported caption is representable to 4,000**,
including text carrying no Markdown at all: the adapter declares that caption through the **accepted Markdown-capable form**
instead of padding, wrapping or formatting the words to fit, so 321–4,000 unformatted characters compose, 4,001 refuses, and a
caption the unflagged 320-point bound already accepted is byte-identical. (3) **The shared Unicode decision covers both native
caption forms** — a lone or reversed surrogate refuses in the plain and the declared form alike, while a valid supplementary pair
still counts once and is accepted in each; the newline and unsafe-text policies are unchanged. (4) **A textless position is
accepted**: `start`/`end` with no heading and no lede composes one figure in the donor's own track — the first, or the second at a
wide viewport — with no invented heading, no invented text, no duplicate image and no new module. (5) **`plain` is proven
authored, not inferred**: one served variant authors `surface: "plain"` while another authors no surface at all, so the closed
literal is compared with the donor's own absence instead of with a second unauthored stack.

Recorded adaptations, none concealed: (1) **alt bound** — Uno keeps its own 320 code points where the donor allows 400, so a
longer donor description refuses rather than widening any other media contract; (2) **a described image needs a description** —
the omission is admitted only beside the explicitly true decorative flag, so no empty string is ever read as decorative on its
own; (3) **remote and SVG sources stay out** — the donor identity is a migration key, never a rendered `src`, and every image is
the separately authored owned reference served from `/uno-media/...`; (4) **gallery, carousel and video are untouched** — their
own caption and alt contracts are unchanged, and the new Unicode decision is confined to the native `media.image` caption.

The browser proof executes **four cases** — 390 and 1280 in light/normal motion and in dark/reduced motion — against **six** served
variants (the committed rich section; `end` with the other surface and a plain caption; an explicitly decorative figure whose alt
is omitted and whose surface is genuinely authored `plain`; the bare previously accepted composition; and both textless
positions). Each case proves, from the actual page: the real media settings; every image **loaded** with its 64×64 intrinsic size
and served from this Page's own owned locator; the authored `alt`, or the normalized empty alt with **no** accessible name of any
kind for the decorative form; the caption **owned by the figure that owns the image**, rendered from the shared AST with its
emphasis and its classified link, and never carrying raw syntax; at 1280 the two **equal tracks** of a positioned section in the
authored DOM order, and for a textless position the one figure filling its own track and starting exactly where that track starts
(measured: `start` at the section's content edge, `end` one track plus the gap to its right); at 390 one column in the same
authored order with every child flush to the content edge; a `muted` and a `bordered` surface that really paint while the
authored `plain` and the absent surface paint nothing; no horizontal overflow; and real keyboard access to the family's own
caption link — reached by Tab, left again by Tab, no navigation and no foreign request, with no new console error. `browser` is
the conjunction of the four cases, and both temporary fixture transactions (Columns and Media) are restored in `finally` and
re-verified by digest **and** by a fresh response that serves the committed Page without any variant anchor.

**The Columns browser evidence in full (`UNO-WO-119 / R02`).** R01's dedicated Columns transaction measured only light/normal
motion at 1280 and 390, and its asymmetric predicate merely asked which cell was wider. R02 **supersedes** that: the same
production HTTP/Chromium transaction now executes **four independent cases** — 390 and 1280 in light/normal motion and in
dark/reduced motion — and each case proves, from the actual page: the real media settings (`prefers-color-scheme`,
`prefers-reduced-motion`, no forced colours); the four served variants in authored order with their native ratio attributes
(three columns carry none); every cell a positive nonzero box with no horizontal overflow; at 1280 equal two-column and equal
three-column widths, and **exact 2:1 / 1:2** asymmetry within a documented ±2 px rounding tolerance (`wider ≈ 2 × narrower`,
never merely wider); at 390 a single column per variant, the authored cell count, the authored DOM order and the same visual order;
the 24 plain labels in two native lists; and the computed surfaces in both schemes — `plain` identical to no surface at all, with
no background, border or padding effect, while `muted` and `bordered` differ from it and from each other with real background,
1 px border and token padding/radius. Each case also walks the browser's own focus order to the real rich safe link, asserts its
exact destination and `rel="noopener noreferrer"`, proves focus can leave it again without trapping, and confirms the visit never
navigated and made no foreign request, with no new console or page error. `browser` is the conjunction of the four cases: a
missing, failed or duplicated case leaves it false, and the fixture bytes are restored in `finally` and re-verified by digest.

**The FAQ surface is presentation, not an attribute (`UNO-WO-118 / R02`).** R01 closed the schema and composed the donor's
`surface` onto every disclosure group, but the shipped stylesheet had no rule for it, so `plain`, `muted` and `bordered`
presented identically. `src/app/globals.css` now carries exactly two token-only rules scoped to
`.uno-json-accordion[data-uno-surface="…"]`: `muted` lifts the group onto `--uno-surface-strong` with `0.75rem` padding and
`--uno-radius-lg`, and `bordered` keeps `--uno-background` and draws `1px solid var(--uno-border)` with the same padding and
radius. `plain` carries **no** rule: it denotes "no emphasis", which is what every other Uno surface module already does, so
`plain` and an absent surface present identically and the ordinary accordion is untouched — no colour, font, image or external
resource is introduced. Two coverage differences from the donor's outer section are recorded rather than smoothed over:
the surface is applied to the **disclosure group(s)** and **not** to the authored heading and lede, which sit above the group
in the documented stack; and a 9–24-item FAQ (consecutive groups, sometimes one wrapper deeper under an authored heading/lede)
surfaces **each** group, so a long list shows grouped surfaced blocks rather than one uninterrupted panel. The proof is real
`getComputedStyle` output in production Chromium at 390 px and 1280 px, light and dark/reduced motion: fresh sibling clones are
measured for the authored value, `plain`, `muted`, `bordered` and an absent surface, `muted` must differ from `plain` in
background and padding, `bordered` in border width and background, `plain` must equal the absent accordion, and the authored
group must match the `muted` reading; the twenty-four-item FAQ is served (temporary fixture swap, byte-exact restore) to prove
all three groups present the same surface, 24 disclosures stay closed and nothing overflows.

**The Quote family and the donor's caption rule (`UNO-WO-117 / R01`).** The pinned donor `quote` schema requires a
Markdown-capable `body`, accepts optional plain `attribution` and `role` beside the closed `align`/`surface`, and has no
`heading` or `lede` at all (`PAGE_MARKDOWN_FIELDS` lists `quote.body`). Its renderer draws **one** `<figure>` with one
`<blockquote>` for the quotation, and a caption only when an `attribution` is present — so a role supplied without an
attribution produces **no caption at all**. This order adopts that presentation rule instead of refusing the shape it
previously refused: the role is read, **validated** through the strict reader's own caption contract, and then not
composed, because presenting it would invent a caption the donor never draws. Validation is not skipped by suppression — a
role over the label bound, or one carrying Markdown, still refuses the whole source. Ordinary **native** testimonials keep
their previous contract, including a role-only caption, because that native shape is Uno's own and this order changes only
the donor mapping. The composed node declares `markdown: true` only when the authored body actually carries Markdown, so a
plain quotation stays byte-identical to what was published before. **Bound audit:** the donor's 4,000 code-point body limit
is exactly Uno's existing `textCodePoints`, so the body contract is neither widened nor narrowed; the donor caps
`attribution`/`role` at 120 code points while Uno's established label bound is 160, so an accepted donor caption may be up to
40 code points longer than the donor itself would render. That is a **pre-existing** Uno bound, retained deliberately
rather than narrowed here, and it is recorded rather than smoothed over. No donor Markdown feature, destination policy,
heading or link is added by this mapping.

**Bounded authored plain-text heading and lede, five families (`UNO-WO-075 / R01`).** The pinned donor schema spreads the
same optional `heading`/`lede` pair into `prose`, `callout`, `list`, `faq` and `table` (`src/core/page-document.ts`
`a12d964c…`), and the donor renders that pair before each family's own content (`text-sections.tsx` `caeee577…`,
`items-sections.tsx` `bc729d6a…`, `structure-sections.tsx` `65d254e1…`, `section-support.tsx` `19c9bee3…`). This adapter
reads each field through the already established shared readers — `heading` 1..160 and `lede` 1..4000 Unicode code points
— as trimmed literal plain text, refusing Markdown, `<`/`>` markup, line breaks, control characters, padding, emptiness,
over-length text, non-string values, unpaired surrogates and accessor-driven sources through the documented
`family:unsupported-feature`, `family:target-refused` and `family:unsafe-source` vocabulary. One valid field wraps the
unchanged native node in a single `layout.stack {}` under the unchanged family anchor id; the original node keeps every
prop, child id and optional-absence and moves only to `${id}-prose`, `-callout`, `-list`, `-accordion` or `-table`. Nine
captured pre-change serializations (plain `prose`; `callout` with and without `tone`; ordered and unordered `list`; `faq`
with one and two entries; `table` with and without `caption`) stay byte-identical when neither field is authored. Authored
text is escaped by React and adds no media, provider or delivery semantic. `faq` still places any authored heading and lede
**outside** its disclosure container, so it remains bounded; `table` and `list` no longer do — `UNO-WO-103 / R01` keeps
their authored heading above the family and renders their Markdown lede **inside** their own `uno-json-table-section` or
`uno-json-list-section`. `prose` and `callout` likewise no longer do: `UNO-WO-084 / R01` checkpoint A1 composes their
authored `lede` and `body` as parsed Markdown (emphasis, code, lists, in-field headings and classified `mailto`/`https`
links) with the closed `align`/`surface` pair, and puts a callout's heading and lede inside its own accent — proven by
source, reader, renderer, served-HTTP, refusal and real 390/1280 light/dark Chromium evidence, so `prose`, `callout`,
`table` and `list` are credited parity candidates while the remaining twelve stay explicitly non-parity. Evidence: per-family composition, refusal and React-markup unit proof, the existing temporary seventeen-shape
production HTTP fixture, and 390/1280 CSS px Chromium assertions inside the same hermetic runner. The source fixture stays
ephemeral: it is not a durable published family Page and adds no parity or stage credit.

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
  a hero `route`/`link` action destination, a stats entry link, a `steps` item state/date, a `faq` item `href`/`icon`/`open`, a `columns` item
  `href`/`icon`/`style`, a `cards`/`features` item `image`/`meta`/`action`/`icon`, an `actions` entry `variant`/`route`/
  `link`/`target`/`rel`/`download`, a `media` section `heading`/`lede`/`position`/`surface` or image `href` or a
  non-boolean `decorative` (an authored `true`/`false` is the donor's own form),
  a `gallery` parent `heading`/`lede`/`surface`/`align`/`position`/`links`/`visibility`/`style`/`onClick`, a gallery item
  `href`/`meta`/`action`/`icon` or image `decorative`/`width`/`height`/`srcset`/`style`,
  a `contactForm` section without a string `formRef` or with any other key, a `contactForms` acknowledgement that is
  missing, malformed, non-array, unacknowledged for an authored reference, duplicated, unused, or carrying a mode other
  than the literal `delivery-off` or any extra key such as `recipient`/`url`/`provider`/`token`/`status`, an empty `{}`
  binding envelope,
  a section `ratio` on
  `cards`/`features`, a `ratio` authored on three columns, a column declaring both `body` and `items` or neither,
  any extra key), a missing subset body (hero with neither `lede` nor `support`, a
  `cards`/`features` section without its required `columns`, `media` without `image.src`, without an `image.alt` and without the
explicit decorative flag, `gallery` without
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
  action target, an empty/whitespace/321-code-point/safe-text-refused `media` or `gallery` alt, an undeclared `media` caption
  past its own bound or a refused `gallery` caption, a `gallery`
  `columns` other than literally `2`/`3`/`4` or an item count outside 2..8, an invalid owned ref
  (zone/path/extension/purpose/generated digest), a `formRef` that is empty, whitespace-padded, longer than 64
  characters or outside the pinned donor grammar (upper case, `_`, `/`, `.`, `@` or a leading hyphen; a trailing hyphen is
  permitted by that grammar), a zero or nine-entry `contactForms` list, a zero or nine-entry image binding, empty or
  thirteen column labels, blank
  label/value, unsafe script or scheme) and any candidate above the Uno 64 KiB source cap. The whole document refuses; no partial Page is
  ever returned.

### 4a. Shared Markdown validation — Unicode well-formedness (`UNO-WO-116 / R01`) and R02 corrections

A JavaScript string is a UTF-16 code-unit sequence, so it can hold a lone high surrogate, a lone low surrogate, a reversed
pair or an interrupted pair. None of those can be encoded as UTF-8 or rendered faithfully — a browser shows a replacement
character or drops the code unit — so exactly **one** decision governs them: `isWellFormedUnicodeText` in
`src/core/page-document.ts`. The reader, the Markdown field reader and the family composer all consume that one function, and
the two duplicated surrogate scans the composer used to carry were deleted, so nothing in the Markdown-capable path is a
per-family patch. (`src/core/efs/uno-page-header.ts` keeps its own pre-existing scan; that module is outside this order's
authorized ledger and is unchanged.) Nothing is ever replaced, trimmed, normalised or silently dropped: a malformed value
refuses, and every well-formed value is published byte-exactly.

- **The Markdown reader** refuses the whole field with the new closed reason `markdown:ill-formed-unicode`, before parsing
  and before the size cap, so the reason is never a cap or a parse artefact. `requireFamilyMarkdown` therefore refuses the
  document (`document:invalid-props`) for a `markdown: true` field.
- **The strict Page reader** refuses the whole Page for every Markdown-capable field in **both** its forms — with and without
  the `markdown` switch — because the plain form is a publication form too: hero `lede`/`support`, stats item `detail`,
  timeline item `description`, prose and callout `text`/`lede`, list item `detail` and `lede`, table `caption` and `lede`. Both
  entry points are covered: plain own data and raw JSON text, where the strict reader decodes an authored `\uD800` escape into
  the same lone code unit.
- **The composer** refuses the whole source with its established reasons and never a partial Page:
  `family:unsupported-feature` where the field is read through the shared Markdown reader (prose/callout body, table caption,
  list `detail`, hero `lede`/`support`, stats `detail`/`lede`, steps body/`lede`), and `family:target-refused` where it is read
  by the bounded lede reader (`prose`/`list`/`table` `lede`). The refusal does not depend on Markdown punctuation: a value with
  no Markdown character at all is refused the same way, so no field can fall back to literal rendering.
- **What stays accepted.** Valid astral pairs, combining sequences, zero-width-joiner sequences and any mixture of scripts
  (Latin, CJK, Hebrew, Arabic, Devanagari, Thai) remain accepted everywhere, unchanged and byte-identical, and a supplementary
  pair still counts as **one** code point against the declared bound — 4,000 accepted and 4,001 refused for a body,
  320 accepted and 321 refused for an item detail.

#### 4a.1 `UNO-WO-116 / R02` — two corrections on top of R01

1. **The pre-R01 plain lede single-line policy is restored.** R01 held an undeclared prose/callout `lede` to the multi-line
   body policy by mistake. At `1bf835f` that field refused CR, LF and CRLF with `document:unsafe-text`; it refuses them again,
   while R01's Unicode decision still applies to the same field. `requireFamilyMarkdown` now takes the field's own newline
   policy instead of always allowing line breaks, so a declared-Markdown lede keeps its authored lines (it is parsed as
   Markdown) and the body keeps the multi-line policy it has always had.
2. **Declared Markdown is validated at the strict Page reader.** When `markdown: true` is declared, every present native hero
   `lede`/`support`, stats item `detail` and timeline item `description` must now parse by the same shared `readUnoFamilyMarkdown`
   the composer and the renderer use. Unsupported or unbalanced Markdown — raw HTML, image syntax, unbalanced emphasis, an
   unsafe or protocol-relative destination — refuses the whole Page instead of being printed as literal syntax. Bounds, the
   per-field newline policies (hero bodies multi-line, stats/timeline item text single-line), the closed literal flag, optional
   absence, the reason vocabulary (`document:unsafe-text` for the plain-text layer, `document:invalid-props` for the Markdown
   layer) and every valid authored output are unchanged. The renderer keeps its literal branch, but that branch is now
   unreachable for an accepted Page: the reader validated exactly the bytes the renderer will parse.

**Remaining scope, stated rather than implied.** Native *plain* fields keep their previous contract and are deliberately
outside both rounds: a `title`, `description`, testimonial `quote`, `heading`, item `label`/`value`, media `alt`, media caption,
price `amount`/`unit`, contact `description`, action label and similar field still counts a lone surrogate once and accepts it
— the counting contract is unchanged and pinned by its own tests. Also unchanged: a *declared* Markdown field is validated as
Markdown but not rewritten, so no Markdown feature, destination policy or renderer redesign was added by either round; native
plain-only fields are still not subject to the Unicode decision, and no universal text validation is claimed.

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
  middle appended families plus the hero matrix (hero application link, stats `href`, steps `status`, quote role-only, empty hero lede) and eight
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
  in strict order and no duplicate; each appended family is checked inside its own region only — hero alignment `center`,
  surface `muted`, the authored eyebrow with both Markdown bodies rendered through the shared family renderer, and exactly
  its two approved static actions with their `rel`, closed variant and focus box; `stats` one authored `<h2>`, the Markdown
  lede through the shared renderer, the closed `muted` surface and one `<dl>` with two `dt`/`dd` pairs whose first item's
  Markdown detail is a real `<strong>`, with no manufactured heading, currency or invented control; `steps` one authored
  `<h2>`, the Markdown lede through the shared renderer, the closed `muted` surface and one native `<ol>` of two `<li>` items
  whose titles `Draft` then `Review` are `<h3>`s and whose first item's Markdown body is a real `<strong>`, with no
  `data-uno-status`, `aria-current` or date; quote one
  `figure`/`blockquote`/`figcaption` whose quotation is the authored Markdown parsed by the shared renderer (a real
  `<strong>`, never its source syntax), with separate attribution and role spans and the authored
  `center`/`bordered` presentation; `table` one keyboard-focusable `.uno-json-table-scroll` wrapping a genuine
  `<table class="uno-json-table">` with one authored `<caption>Synthetic table</caption>`, two `<th scope="col">` headers
  in `Phase`/`Count` order and a 2×2 `<tbody>` in `First/1`, `Second/2` order; `columns` one
  `data-uno-columns="2" data-uno-item-semantics="plain"` grid carrying the authored `data-uno-ratio="start-wide"` with two
  tight stacks, `<h2>` `Left column`/`Right column`, the left paragraph and the right native two-entry list; `cards` a
  headed `uno-json-stack` root carrying the authored `<h2>Synthetic cards</h2>` before its native two-column `<ul>`
  list grid of two `<li>`, two `<h3>` titles and exactly one body; `features` a separately scoped headed stack with the
  authored `<h2>Synthetic features</h2>` before its native three-column list grid of two `<li>`, two `<h3>` titles, one
  body and no ratio, article, link, image, icon or fabricated content. Chromium at 390 px and 1280 px repeats those per-family assertions on the real DOM with
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
  down by the existing reversible transaction. **This classification was independently accepted by the Architect under
  `UNO-WO-069 / R01`; it is not Owner stage closure, changes no other family and raises no stage proxy.**
* **Authored section lede for `cards` and `features` (`UNO-WO-071 / R01`).** The donor's optional `lede` is accepted for
  exactly these two families as one literal plain-text string (nonempty, unpadded, at most the Uno target's 4000 code
  points, well-formed surrogate pairs) and composed as one `content.prose {text}` node — never Markdown, never a
  synthesized default and never an inferred destination. Three shapes are exact: **no-lede** reproduces the previously
  accepted output byte-for-byte (proved against four pre-WO-071 serialized sections: heading-less and headed-only for each
  family); **heading+lede** is one `layout.stack {}` with ordered `[heading(level 2), lede prose at ${id}-lede, grid]`
  whose item titles are level 3; **lede-only** is the same stack with `[lede prose, grid]` whose item titles stay level 2,
  inventing no section heading. The donor's `lede` is Markdown-capable, so evident Markdown (`**`, `*`, `_`, `~~`,
  backticks, links/images, ATX headings, list and blockquote syntax), raw HTML/angle-bracket markup, hard line breaks,
  control characters and unpaired surrogates are refused rather than printed as inert syntax; wrong types refuse as
  `family:unsupported-feature`, blank/padded/overlength text and ill-formed Unicode as `family:target-refused`, and an
  accessor `lede` as `family:unsafe-source` without invoking a getter. Ordinary `&`, quotes, punctuation and non-ASCII or
  astral text stay valid and are React-escaped. The literal `&`, `"` and `—` cases and the 4000/4001 code-point bounds are
  covered by executed tests. Real evidence: `FAMILY_LEDE_SOURCE` (ordered [heading, lede, grid], authored text, level-3
  items, unchanged ids/deep freeze/reader re-accept), `FAMILY_LEDE_REFUSALS` (executed whole-Page probes including a
  zero-getter accessor), `FAMILY_LEDE_HTTP` (one exact lede paragraph per family between the authored `<h2>` and the
  native list on a real 200 response) and `FAMILY_LEDE_BROWSER` at 390 px and 1280 px. **This remains a bounded
  capability:** the donor `lede` renders Markdown, its heading-less item titles are `<h3>`, and `surface`, card media/
  meta/actions/borders and feature icons stay absent, so neither family gains parity credit.
* **Authored section heading and lede for `stats` and `steps` (`UNO-WO-072 / R01`).** Both donor schemas spread
  `headingFields`, so each of these two families accepts one optional authored `heading` (1..160 code points) and one
  optional `lede` (1..4000 code points) beside its existing keys — `type`/`items` for `stats`, plus `surface` for `steps`.
  Composition reuses the same pinned readers as the grid families: neither field authored returns the original one-node
  output **byte-identically** (proved against four pre-change serialized sections, including `steps.surface`), a
  heading-only or lede-only input yields one `layout.stack {}` on the unchanged family id with the authored
  `content.heading {level:2}` at `${id}-heading` and/or `content.prose {text}` at `${id}-lede` before the original
  `content.stats` at `${id}-stats` or `content.timeline` at `${id}-timeline`, and heading plus lede yields those three
  children in that order. No heading, wrapper or default is invented. **`UNO-WO-113 / R01` and `UNO-WO-114 / R01` supersede
  the bounded half of this paragraph for both families:** each now renders its donor Markdown-capable `lede` through the same
  shared renderer, accepts the donor `surface`, and carries its own Markdown-capable item field (`stats.detail`,
  `steps.body`) — `stats` is credited at `PARITY (UNO-WO-113 / R01)` and `steps` at `PARITY (UNO-WO-114 / R01)`. Per-item
  links, lifecycle status/date/icon and any extra key still refuse, so nothing beyond the donor's own surface was widened.
  Real evidence: `FAMILY_STATS_STEPS_SOURCE`, `FAMILY_STATS_STEPS_REFUSALS` (executed whole-Page probes including a
  zero-getter accessor), `FAMILY_STATS_STEPS_HTTP` (both families' extracted served predicates) and
  `FAMILY_STATS_STEPS_BROWSER` at 390 px and 1280 px.
* **Authored section heading for `cards` and `features` (`UNO-WO-070 / R01`).** The donor's optional plain-text
  section `heading` is now accepted for exactly these two families and composed from existing Uno modules only: one
  `layout.stack {}` root keeps the stable `family-N-cards`/`family-N-features` anchor, its first child is the authored
  `content.heading {level:2}`, and its second is the nested `layout.grid {columns,itemSemantics:"list"}`: its item titles step to `content.heading {level:3}`, the donor's
  `SectionHeading` `<h2>` → `ItemTitle` `<h3>` outline, with
  the native `<ul>/<li>` list meaning unchanged. When no heading is authored the previous grid — level-2 item titles,
  no section heading, original ids and order — is emitted **byte-identically**, proved against output captured before
  the change. The new `heading` is one literal plain-text string: nonempty, unpadded, at most 160 code points, with no
  Markdown, markup, line break, control character or unpaired surrogate. Wrong types refuse as `family:unsupported-feature`,
  blank/padded/overlength text and unsafe surrogates as `family:target-refused`, and accessors as `family:unsafe-source`
  without invoking a getter. Real evidence: `FAMILY_ITEM_OUTLINE_SOURCE` (composed stack, empty props, authored h2 before
  the nested grid, level-3 item titles, unchanged other fifteen families, deep freeze, reader re-accept),
  `FAMILY_ITEM_OUTLINE_HTTP` (exactly one authored h2 before two nested h3 titles, one native list, two `<li>`, no
  duplicate id, no second `main`/`h1`) and the headed cards/features Chromium assertions at 390 px and 1280 px
  (one h2 first, two h3, two direct `<li>`, no control, no overflow). **This is a bounded capability milestone, not full
  parity:** donor `lede`/`surface`, the omitted-columns default, Markdown item bodies, card media/meta/action/borders and
  feature icons remain absent, and the heading-less variant still differs from the donor outline.
* **No parity follows from this.** The acknowledged `formRef` is still consumed and discarded, and the donor's own
  absent-seam null render still differs from Uno's visible OFF notice. The donor `steps` outline uses `<h3>` headings where
  this bounded target renders `<p>` titles, the heading-less variants of `cards`/`features` and the `faq` and `columns`
  heading outlines still differ (Uno renders nested `<h2>`), the donor gallery list wrapper is not reproduced, and
  Markdown, links, remote media and every authored form/delivery semantic remain unimplemented. The last four families are bounded structural samples:
  `table` is not a donor Markdown table and carries no links, sorting or merged cells, `columns` discloses the
  h2-versus-h3 outline difference, and `cards`/`features` deliberately share one list-grid target with no donor borders,
  media, meta, actions or icons even when they now carry an authored section heading. This is **one temporary seventeen-shape integration slice** with
  all seventeen bounded shapes sampled over the temporary Page; sixteen of the seventeen remain bounded and non-parity,
  and the single `divider` candidate above is locally evidenced only — headed `cards`/`features` raise no full-parity
  count beyond that one. The **durable** evidence added by `UNO-WO-078 / R01` is recorded in section 7 below.

## 6. Remaining obligations

No donor family is entirely unimplemented (the exact line in section 2). **Five of the seventeen remain bounded subsets,
not parity**; the twelve parity-evidenced candidates are listed in section 2, while the authored-text modes for
`cards`/`features` are a bounded capability, not parity, and give neither family parity credit.
Outstanding for those five shapes: donor Markdown rendering, link/destination representation beyond
same-document fragments, rich donor forms, the
other columns, cards, features and actions options, the heading-less `cards`/`features`
outline, the donor `faq` and `columns` heading outlines, donor card borders/media/meta/actions and feature icons, the
donor native gallery list wrapper with its optional heading/lede/surface and implicit column default, remote image sources,
the donor per-render
contact seam and every authored form/delivery semantic, and full-parity browser proof of those donor semantics (the
durable bounded composition Page of section 7 now exists, but it evidences the bounded subset only). Any
future order must add those explicitly; this ledger authorises no new module ID, no new schema
variant and no publication
authority. The **B2** row is earned: its three declared families (`quote`, `faq` and `columns`) are all credited by
executed evidence at the declared `11/17` / `53/59`, and `UNO-WO-120 / R02` credits `media` beyond it at the
checkpoint-free `12/17` / `54/59`. The `C1` row is **not** claimed: its declared families are `media` and `gallery`, and
`gallery` remains bounded.

## 7. Durable family Page (`UNO-WO-078 / R01`)

The committed Components Page (`deployment/efs/content/components.en-001.json`, Page `components`, route
`["components"]`, `/en-001/components`, `publication:"published"`, JSON `visibility:"public"`) keeps its **six native
sections value-identical and first** (`components-intro`, `components-copy`, `components-list`, `components-stack`,
`components-faq`, `components-callout`) and appends **exactly seventeen** bounded family compositions in the ledger
order: `family-0-prose` through `family-16-features`. The appended nodes are the literal output of the unchanged
`composeUnoFoundationSubset`, not a hand-mapped proxy: `tests/fixtures/u04-durable-family-source.json` is an original
test-only donor-shaped v1 source, `tests/fixtures/u04-durable-family-bindings.json` is its separate migration binding,
and the committed Page's appended suffix equals the composer's `document.sections` byte for byte (proved in the unit
suite, in the hosted runner before any fixture, and again in the hosted CI).

Evidence, all from the committed head:

* **Source and bindings.** The composer accepts the seventeen-family source with one image binding
  (`/assets/wo078-family-plate.png` → `{zone:"page",path:"wo078-family-plate.png"}`) and one contact acknowledgement
  (`{formRef:"wo078-contact",mode:"delivery-off"}`); the accepted document is one deeply frozen v1 Page and the source
  and bindings are never mutated.
* **Owned asset.** One original, deterministic 64×40 RGB PNG (`wo078-family-plate.png`, 191 bytes, SHA-256
  `25bde641ce447275f7eff9d03859d07062ae34f9e3597eff18cf07bb384eae47`) is created exclusively inside this Page's own
  `capsule/<entity>/<facet>/<site>` zone — no brand, text, font or third-party pixel. It backs the three declared
  occurrences (the `media` sample and the two `gallery` items) through `/uno-media/en-001/components/{0,1,2}`.
* **Real HTTP.** The three locators answer `200 image/png` with the exact bytes, `nosniff` and matching `HEAD`;
  `/uno-media/en-001/components/3`, another Page's locator, an unknown Page, a guessed storage filename, `-1`, `00`, the
  reserved `home` alias and a foreign locale are real `404`s with no body and no redirect.
* **Rendered semantics.** One `main`, one `h1`, twenty-three unique section ids in order, a native `<hr>`,
  `<blockquote>`, `<table>` with `scope="col"` headers, `<details>`/`<summary>` disclosures, a native ordered timeline
  list and unordered list, gallery `<figure>`/`<figcaption>`, three owned `<img>` elements with authored `alt`, and the
  inert "Delivery is switched off" notice with **no** form, input, textarea, button or iframe.
* **Chromium.** The same Page is measured in real Chromium at 390 and 1280 CSS pixels, light and dark, and under
  `prefers-reduced-motion: reduce`: seventeen family ids in order, native semantics present, every image decoded with
  alternative text and addressed only by this Page's own locators, no form control, no horizontal overflow, no console
  or page error, no off-origin request, and the pre-existing disclosure toggled from the keyboard.
* **Refusals.** Rich Markdown, remote or unbound images, unknown/generated zones, non-OFF or absent contact
  acknowledgement, an eighteenth family, external action destinations, unsupported keys, an accessor source and an
  over-count source each refuse the whole document with one closed reason and no partial Page.
* **Trace and restoration.** The bounded build trace ships the three declared sources and nothing from `.documents/`,
  `.temp/`, `tests/`, `scripts/` or the parent workspace; the committed Page and the owned plate remain byte-identical
  after every reversible fixture runner.

**No parity uplift and no stage closure follow from this.** It is one durable bounded composition of sixteen
still-incomplete families plus the single `divider` candidate: the donor Markdown, links, rich forms, card
media/meta/actions, feature icons, gallery list wrapper, heading outlines and delivery semantics
listed in section 6 remain absent. The accounting is unchanged at **22/22** module IDs, **4/4** asset zones,
**16/16** browser matrix, **17/17** bounded mappings, **1/17** accepted full parity (`divider`) and **43/59 =
72.88%** proxy. The reserved `.example` canonical is illustrative sample data, not a domain, deployment or ownership
claim, and U04 remains OPEN.

## 8. Three bounded donor heading outlines (`UNO-WO-080 / R01`)

The pinned donor renders item-level titles as level-3 headings: `StepsSection` emits a native `ol`/`li` list whose
`ItemTitle` is `<h3>`, `FaqSection` places `ItemTitle` inside the native `summary`, and `ColumnsSection` uses one
`ItemTitle` per column, all beneath an authored section heading. Uno previously flattened those three to a `<p>` title,
a bare summary label and a level-2 column heading. This order `ADAPTs` the semantic outline only, with original Uno code.

**Two closed, optional presentation switches** carry the difference, both literal-only and absent by default:

| Module | Optional prop | Absent behaviour |
| --- | --- | --- |
| `content.timeline` | `itemHeadingLevel?: 3` | the previous `<p class="uno-json-timeline-title">`, byte-identical |
| `interaction.accordion` | `summaryHeadingLevel?: 3` | the previous plain `<summary class="uno-json-disclosure-summary">label</summary>`, byte-identical |

Any other authored value — `null`, an own `undefined`, `0`–`2`, `4`, `"3"`, `false`, `NaN`, a duplicate JSON member, an
accessor or a wrong-module key — refuses the whole document with the existing closed `document:invalid-props`,
`document:input-not-plain` or `document:json-duplicate-key` reason. No default prop is injected into an older document,
so every pre-existing authored Page keeps its exact serialization and markup.

**Composer mapping (only these three families changed):** `steps` always sets `itemHeadingLevel: 3` on its
`content.timeline` node; `faq` always sets `summaryHeadingLevel: 3` on its native `interaction.accordion`; `columns`
child titles became `content.heading {level: 3}` (the two/three titles, no wrapper, no new id). No donor field was added,
no refusal vocabulary changed and no other family mapping moved.

**Outline consequence, recorded truthfully:** a columns family composed with **no** preceding authored level-2 heading
now violates Uno's existing document outline rule and refuses as `family:target-refused`, because Uno never invents a
section heading. The committed Components Page and both family fixtures author an `h2` above the columns family, so they
compose; a columns-only donor source is not an accepted document. This is a document-level invariant, not a silent
weakening: the reader still refuses a skipped outline level exactly as before.

**Evidence.** Unit: strict-reader acceptance/refusal, absent-key serialization baseline, accessor and duplicate-member
refusals, React static markup for the legacy and switched forms, the three family source shapes, and the fourteen
untouched committed family sections compared with their recorded before-state digests. HTTP: the served committed Page,
the temporary seventeen-family fixture (`9 h2` / `10 h3`, from `11`/`4`) and the composed fixture all assert heading
ownership inside the native `li`, `summary` and column containers. Chromium: the same regions at 390 and 1280 CSS px,
light and dark, and under reduced motion, with one `main`, one `h1`, no `h4`, no invented heading role, no extra control
and no overflow.

**Still absent (unchanged):** donor Markdown, links and target resolution, rich forms and transport, card media/meta/
actions, feature icons and gallery list wrapper, other optional donor types, and the lifecycle and
design semantics listed in section 6. Three families gained one heading level; nothing became full parity.

Accounting is unchanged: **22/22** module IDs, **4/4** asset zones, **16/16** browser matrix, **17/17** bounded mappings,
**1/17** accepted full parity (`divider`), **43/59 = 72.88%** proxy. U04 stays OPEN and no stage credit follows.
