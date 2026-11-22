# U06 — Neutral three-Page starter: source, ownership, route, visibility and SEO evidence

**Scope.** This ledger records the committed starter declaration authorised by `UNO-WO-077 / R01`. It is evidence about
three authored Pages of the existing one-Entity / one-Facet / one-selected-Site graph. It is not a release, a
deployment, an independent Installation or donor-family parity credit, and it closes no stage.

## Declared graph (unchanged identifiers)

- Entity `e_7a3knkx60eacyhca7a0cr1k6e1`, Facet `foundation`, Site `main`.
- Supported and default locale `en-001`; language preference `en → en-001`.
- Three Pages, each with exactly one declared `en-001` source and an explicit `publication: "published"`.

| Page ID | Route | Source kind | Declared source |
|---|---|---|---|
| `home` | `["home"]` (reserved; serves `/en-001`) | JSON | `deployment/efs/content/home.en-001.json` |
| `about` | `["about"]` (serves `/en-001/about`) | Markdown | `deployment/efs/content/about.en-001.md` |
| `components` | `["components"]` (serves `/en-001/components`) | JSON | `deployment/efs/content/components.en-001.json` |

The Components Page carries **twenty-three** top-level sections: its six original native sections
(`components-intro`, `components-copy`, `components-list`, `components-stack`, `components-faq`,
`components-callout`) unchanged and first, followed by seventeen bounded Foundation family samples
(`family-0-prose` … `family-16-features`) composed by the unchanged `composeUnoFoundationSubset` from the test-only
source and bindings in `tests/fixtures/`. Those samples are bounded compositions, not full donor parity; three of them
address one original Page-owned PNG
(`deployment/efs/capsule/e_7a3knkx60eacyhca7a0cr1k6e1/foundation/main/wo078-family-plate.png`, 191 bytes, SHA-256
`25bde641ce447275f7eff9d03859d07062ae34f9e3597eff18cf07bb384eae47`) through `/uno-media/en-001/components/{0,1,2}`.
Evidence and limits are recorded in `.documents/Architecture/u04-family-parity.md` section 7.

## Selection and reserved canonical

`deployment/uno.config.json` keeps `version: 1`, the Entity/selected-Site fields and the language preferences, and adds
`base: { "canonical": "https://uno-starter.example", "aliases": [] }`. `.example` is a reserved illustrative namespace:
the value is inert declaration data used only for local and hosted proof. It is not an owned domain, a DNS or TLS
provision, an environment binding, a Vercel setting or a deployment, and no committed alias exists.

## Preserved, deliberately undeclared source

`deployment/efs/content/home.en-001.md` remains byte-identical at Git blob `ef4254a37778c38a575c4924901760a36650ad05`
and is **not** declared by any Page. It is neither moved, renamed, republished nor granted fallback: removing or
corrupting the selected Home JSON refuses the whole Page instead of rescuing it from that file.

## Visibility, publication and discovery

- Publication authority is the manifest Page's own `publication: "published"`, evaluated with the selected Site, the
  committed canonical base and the validated source — never a filename, a directory listing or a filesystem check.
- JSON Pages declare `visibility: "public"`; Markdown may never declare a visibility and is public by policy.
- The reserved Home cannot be `unlisted`; `unlisted` remains a non-discoverable intent, not access control.
- Only public Pages reach `sitemap.xml`, `robots.txt`, the canonical tag, `hreflang` alternates and `x-default`.

## Proven positive and negative behaviour

- Real production HTTP on loopback: `/en-001`, `/en-001/about` and `/en-001/components` each answer `200` with exactly
  one `<main>` and one `<h1>`, the authored title, `robots: index, follow`, the reserved canonical, a matching
  `og:url`, an `en-001` alternate and `x-default` only on the default Page; `HEAD` agrees with `GET`.
- `/en` answers one explicit redirect to the published `en-001` root; no other short alias is invented.
- `robots.txt` names `https://uno-starter.example/sitemap.xml`; `sitemap.xml` lists exactly the three canonical URLs and
  never the preserved Markdown file, the suppressed `home` segment or an unknown route.
- Real Chromium at 390px and 1280px: unique `h1`, no horizontal overflow, keyboard-reachable controls, a native
  disclosure operable without script or provider, and zero requests outside loopback.
- Refusals that remain real 404s: `/en-001/home`, `/de-001`, `/en-001/about/extra`, `/en-001/components/extra`,
  unknown segments and a percent-escaped segment. Malformed preferred JSON, duplicate declarations, wrong owner or
  locale, unsupported modules, unlisted Home, hostile keys and traversal continue to refuse through the existing
  contract.
- All twenty-two modules, the four asset zones, the seventeen bounded donor family mappings, the sixteen-case browser
  matrix and the `FAMILY_TEXT_FIVE_*` labels continue to execute in the existing U04 runner.

## Ownership and rights

Uno-owned authored copy only: no donor implementation, no Foundation Solo Rust, no separately licensed
`modules/connect/**`, no brands, art, stock copy, external provider, analytics, webhook, geolocation or delivery
promise. Donor reference remains the pinned read-only `provelopment/provelopment-foundation` commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c` with its Apache-2.0 `LICENSE` blob
`d645695673349e3947e8e5ae42332d0ac3164cd7`; nothing from it is used here. No new dependency, notice exception or
licence waiver was added.

## What remains open

- **U04:** 16 of 17 bounded donor families remain below full parity (1/17 fully evidenced, `divider`); the proxy
  remains 43/59. The Components Page now carries one durable bounded composition of those seventeen sample shapes, which
  is starter evidence and not a donor-parity Page.
- **U05:** safe actions and provider gating are out of scope.
- **U06:** two independent installs, clean-room/upgrade/rollback proof and Owner closure are still required; this run
  provides committed starter and publication evidence only.
- **U07:** the security and release audit is out of scope.
- Historical private-path exposure remains unresolved and is an Owner decision; this order performed no history
  rewrite, log purge or disclosure operation.
