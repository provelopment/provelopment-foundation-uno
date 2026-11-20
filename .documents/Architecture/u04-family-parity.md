# U04 — bounded Foundation→Uno family composition (source and rights ledger)

**Scope of this record.** It documents **five** donor source shapes that Uno now composes into its own v1 Page
document, and nothing else. It is a narrow provenance and rights ledger, not a parity claim: **0 of 17 families are
fully accepted**, and no `FAMILY_PARITY` result may be derived from it. U04 remains OPEN.

## 1. Provenance and licence

These five mappings are an **original Uno-owned** implementation (`src/application/compose-uno-foundation-families.ts`,
adaptation class `COMPOSE (plain-text subset)`). Only **concepts and semantics** were adapted — never donor source,
components, CSS, Tailwind classes, images, Connect code or trademarks — from
`provelopment/provelopment-foundation` at commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, which is licensed
**Apache-2.0** (`LICENSE`, Git blob `d645695673349e3947e8e5ae42332d0ac3164cd7`). The donor is read-only evidence: no
donor package, runtime module, asset or build configuration is imported into Uno, and no donor file was copied. The
converter, its refusal vocabulary, its bounds and its tests are Uno's own.

## 2. Five composed source shapes

| Donor family | Donor evidence (blob) | Disposition | Accepted donor fields | Deliberately unsupported | Uno output | Unit proof |
| --- | --- | --- | --- | --- | --- | --- |
| `prose` | `src/core/page-document.ts` `a12d964c43626c6313a621bf628f5cc24b65d444`; `text-sections.tsx` `caeee57798bdd533867e5bef350422618187612f` | `COMPOSE (plain-text subset)` | `type`, `body` | heading/lede/align/surface/links/visibility, Markdown, HTML, links | `content.prose {text}` → `<p class="uno-json-prose">` | composed + refusal + markup tests |
| `callout` | `text-sections.tsx` `caeee57798bdd533867e5bef350422618187612f` | `COMPOSE (plain-text subset)` | `type`, `body`, optional `tone: note\|info\|warning` | any other tone, role/alert semantics, links, Markdown | `content.prose {variant:"callout",text,tone?}` → `<section class="uno-json-callout" data-uno-tone>` | composed + refusal + markup tests |
| `table` | `structure-sections.tsx` `65d254e192a6a8ef4886590026c2ea58e02264be` | `COMPOSE (plain-text subset)` | `type`, `columns`, `rows`, optional `caption` | sorting, spans, merged cells, Markdown, links, `<details>` | `content.prose {variant:"table",columns,rows,caption?}` → scroll wrapper + `<table>`/`<caption>`/`<th scope="col">` | composed + rectangularity refusal + markup tests |
| `list` | `items-sections.tsx` `bc729d6a2e6484dc2c26ed997e65ee644bc8a7e6` | `COMPOSE (plain-text subset)` | `type`, `items: (string \| {label, detail?})[]`, optional `ordered` | item destinations/hrefs, icons, Markdown, nested lists | `content.prose {variant:"list",items:{label,detail?}[],ordered?}` → `<ol>`/`<ul class="uno-json-list">` | composed + destination refusal + markup tests |
| `divider` | `text-sections.tsx` `caeee57798bdd533867e5bef350422618187612f` | `COMPOSE (plain-text subset)` | `type` | any content, tone, spacing props | `content.prose {variant:"divider"}` → `<hr class="uno-json-divider">` | composed + content refusal + markup test |

All five are bounded by Uno's own parser, so the accepted output is one validated, deep-frozen `UnoPageDocument` with
`version: 1`, the donor title and ids `family-<index>-<type>`; a refusal returns one closed reason and no document.

## 3. Refusal policy (why a partial mapping is not "parity")

- **Unsupported family** (`family:unsupported-family`): any donor type outside the five — including `media`, `faq`,
  `contactForm` — is refused whole. Nothing is degraded into a paragraph.
- **Unsupported feature** (`family:unsupported-feature`): a supported family carrying an out-of-subset field
  (`heading`, `lede`, `align`, `surface`, `links`, `visibility`, `href`, `route`, `link`, `html`, `style`, `onClick`,
  an item destination, any extra key) or a Markdown construct (`**bold**`, `[label](destination)`, backticks, leading
  Markdown headings). Emitting that punctuation as inert prose would look faithful while discarding its meaning.
- **Unsafe source** (`family:unsafe-source`): hostile or unreadable input — accessors (never invoked), foreign
  prototypes, symbol keys, prototype-rewriting keys, cycles, sparse/overloaded arrays, functions, `undefined`,
  non-finite numbers, over-deep or over-budget structures.
- **Target refused** (`family:target-refused`): the assembled candidate fails Uno's own validation or the 64 KiB
  source cap. A partial document is never returned.

## 4. Remaining work before any parity claim

Twelve other donor families are **UNIMPLEMENTED**: `heading`, `hero`, `media`, `gallery`, `carousel`, `stats`,
`testimonials`, `pricing`, `timeline`, `tabs`, `accordion`, `contactForm`. Also outstanding for the five composed
shapes: donor Markdown rendering, link/destination representation, rich option surfaces, a composition Page, and real
published HTTP/browser proof. Any future order must add those explicitly; this ledger authorises no new module ID, no
new schema variant and no publication authority.
