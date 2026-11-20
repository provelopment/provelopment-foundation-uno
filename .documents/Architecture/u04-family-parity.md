# U04 — bounded Foundation→Uno family composition (source and rights ledger)

**Scope of this record.** It documents the **seven** donor source shapes Uno currently composes into its own v1 Page
document — `prose`, `callout`, `table`, `list`, `divider`, `hero`, `stats` — out of the donor's **seventeen** families.
It is a narrow provenance and rights ledger, not a parity record: **seven bounded mappings implemented; ten donor
families entirely unimplemented; zero of seventeen full semantic parity; no family production HTTP/browser proof.**
U04 remains OPEN.

## 1. Provenance and licence

These seven mappings are an **original Uno-owned** implementation
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

Seven of these are composed as bounded subsets (section 3). The other ten are not implemented at all:

**UNIMPLEMENTED (10):** `media`, `gallery`, `actions`, `cards`, `features`, `columns`, `steps`, `quote`, `faq`, `contactForm`.

Uno module ids such as `content.heading`, `content.testimonials` or `content.pricing` are Uno concepts or renderer
features; they are **not** additional donor family keys and must never be listed as an eighteenth family.

## 3. Seven composed source shapes

| Donor family | Donor evidence | Disposition | Accepted donor fields | Deliberately unsupported | Uno output | Unit proof |
| --- | --- | --- | --- | --- | --- | --- |
| `prose` | `text-sections.tsx` `caeee577…` | `COMPOSE (plain-text subset)` | `type`, `body` | heading/lede/align/surface/links/visibility, Markdown, HTML, links | `content.prose {text}` → `<p class="uno-json-prose">` | composed + refusal + markup |
| `callout` | `text-sections.tsx` `caeee577…` | `COMPOSE (plain-text subset)` | `type`, `body`, optional `tone` | other tones, role/alert semantics, links, Markdown | `content.prose {variant:"callout",text,tone?}` → `<section class="uno-json-callout">` | composed + refusal + markup |
| `table` | `structure-sections.tsx` `65d254e1…` | `COMPOSE (plain-text subset)` | `type`, `columns`, `rows`, optional `caption` | sorting, spans, merged cells, Markdown, links | `content.prose {variant:"table",…}` → scroll wrapper, `<caption>`, `<th scope="col">` | composed + rectangularity refusal + markup |
| `list` | `items-sections.tsx` `bc729d6a…` | `COMPOSE (plain-text subset)` | `type`, `items`, optional `ordered` | item destinations/hrefs, icons, Markdown, nested lists | `content.prose {variant:"list",…}` → `<ol>`/`<ul class="uno-json-list">` | composed + destination refusal + markup |
| `divider` | `text-sections.tsx` `caeee577…` | `COMPOSE (plain-text subset)` | `type` | any content, tone, spacing | `content.prose {variant:"divider"}` → `<hr class="uno-json-divider">` | composed + content refusal + markup |
| `hero` | `page-document.ts` `a12d964c…`; `media-sections.tsx` `e3f3a12e…` | `COMPOSE (plain-text subset)` | `type`, `lede` (required by this subset), optional `eyebrow`, `support`, `align`, `surface` | donor `actions`, hero forms with only `support`/`eyebrow`, Markdown, links/routes | `content.hero {lede,eyebrow?,support?,align?,surface?}` → `<section class="uno-json-hero" data-uno-align data-uno-surface>` with plain eyebrow/lede/support | composed + form/align refusal + markup |
| `stats` | `page-document.ts` `a12d964c…`; `items-sections.tsx` `bc729d6a…` | `COMPOSE (plain-text subset)` | `type`, `items[1..6]{value,label,detail?}` | donor heading/lede/surface, embedded links, Markdown, extra keys or entries | `content.stats {items}` → `<section class="uno-json-stats">` with `<dl>`/`<dt>`/`<dd>` | composed + count/link refusal + markup |

Each accepted output is one validated, deep-frozen `UnoPageDocument` with `version: 1`, the donor title and one node
per input section (`family-<index>-<type>`). Absent optional fields stay absent; the renderer owns visual defaults.
No donor Markdown, link destination, image or media form is rendered by this subset.

## 4. Refusal policy

- **Unsupported family** (`family:unsupported-family`): any of the ten unimplemented donor families, or any unknown
  type. Nothing is degraded into a paragraph.
- **Unsupported feature** (`family:unsupported-feature`): a supported family carrying an out-of-subset field
  (`heading`, `lede`, `align`, `surface`, `links`, `visibility`, `href`, `route`, `link`, `html`, `style`, `onClick`,
  hero `actions`, a stats entry link, any extra key), a missing required subset field (hero without `lede`), or a
  Markdown construct (`**bold**`, `[label](destination)`, backticks, leading Markdown headings).
- **Unsafe source** (`family:unsafe-source`): hostile or unreadable input — accessors (never invoked), foreign
  prototypes, symbol keys, prototype-rewriting keys, cycles, sparse or overloaded arrays, functions, `undefined`,
  non-finite numbers, over-deep or over-budget structures.
- **Target refused** (`family:target-refused`): malformed values inside accepted fields (empty/overlong text, bad
  `align`/`surface` literal, zero or seven stats items, blank label/value, unsafe script or scheme) and any candidate
  above the Uno 64 KiB source cap. The whole document refuses; no partial Page is ever returned.

## 5. Remaining obligations

Ten donor families are entirely unimplemented (the exact line in section 2). Also outstanding for the seven composed
shapes: donor Markdown rendering, link/destination representation, rich donor forms, the other hero and stats options,
a composition Page, and real published HTTP/browser proof. Any future order must add those explicitly; this ledger
authorises no new module ID, no new schema variant and no publication authority.
