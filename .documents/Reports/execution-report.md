# UNO-WO-011 / R01 — English informational homepage at `/` with production HTTP proof

**Order / disposition:** `UNO-WO-011 / R01` · FINAL — EXECUTE · **Executed:** 2026-11-16
**Private ACTIVE:** `.documents/WIP/workorder-active.md` — matching private installation and the Owner's separate activation were both checked before any write; ACTIVE content, digest and size are withheld from this report
**Starting Uno `main`:** `833611297fe5f26d245f73189000dad0c13fbd3b` · **Product head:** `5323439f90d5dd1543bde15e0f06f287b0271d51`
**Stage:** U01 — English informational demonstration · **U01 remains OPEN**, formal closed stages **1 / 8**
**Disposition requested:** Chief Master Architect `ACCEPT / REVISE / STOP`

## 1. What a visitor now receives at `GET /`

The served production document is 17,665 bytes of static HTML, built by the pinned Next 16.4.2 toolchain and
verified over real loopback HTTP. Its outline:

| Served element | Actual value |
| --- | --- |
| `<html>` | `lang="en"` — the demonstration page language, never the authored locale id |
| `<title>` | `Foundation Uno — a single-Entity website foundation` |
| meta description | `English demonstration of Foundation Uno, an independent Apache-2.0 Next.js and TypeScript website foundation built for one Entity. Full authored Site publication is not yet enabled.` |
| meta robots | `noindex, nofollow, nocache` (pre-publication policy preserved) |
| `h1` (exactly one) | `Foundation Uno — a single-Entity website foundation` |
| `h2` order | `How it is organized` → `What works today and what comes next` → `Explore the code` |
| `h3` order | `Entity`, `Facets`, `Sites`, `Pages`, `Localized representations`, `What works today`, `What's next` |
| anchor targets | `#main`, `#hero-title`, `#how-it-is-organized`, `#organized-title`, `#status`, `#status-title`, `#explore`, `#explore-title` — all seven in-page links resolve |
| external links | exactly two, both `https://github.com/provelopment/provelopment-foundation-uno`, with readable text |

**Content map.** A hero states that Uno is an independent Apache-2.0 Next.js/TypeScript foundation
built around **one Entity**; a numbered "How it is organized" panel presents
`Entity → Facets → Sites → Pages → localized representations` and labels it a **planned contract**,
including that locales such as `en-001` are explicitly authored and never guessed; a two-column split
separates **What works today** (reproducible baseline, pure tested primitives, declared-source policy
and application resolver, architecture refusals, two-host CI, Apache-2.0) from **What's next** (EFS
manifest and confined readers, authored rendering and the 22-module / 17-family presentation system,
locale routing and route authority, publication, release, Owner-controlled deployment); an
"Explore the code" section links the one public repository. A visible disclosure reads
**"English demonstration — full authored Site publication is not yet enabled."**

**Honest boundary.** This is an informational demonstration surface. It is **not** the P05 authored
EFS Home Page, **not** a validated one-Entity publication, and **not** evidence that modules render or
that any family has been migrated. It does not claim a published Site, a live site or a deployment.

## 2. Ledger — six product paths plus one report path

| # | Path | Operation | What changed |
| --- | --- | --- | --- |
| 1 | `src/app/page.tsx` | EDIT | Sentence-only placeholder replaced by the full static English page: skip link, header nav, hero, planned-contract stack, status split, source section, footer disclosure |
| 2 | `src/app/layout.tsx` | EDIT | Truthful demonstration `title`/`description`; `lang="en"` retained; `noindex, nofollow, nocache` and `googleBot` policy unchanged; no canonical or alternate invented |
| 3 | `src/app/globals.css` | EDIT | Original dependency-free styling: light/dark tokens, `focus-visible` ring, `prefers-reduced-motion` and `prefers-contrast`, card/stack rhythm, one-column collapse below 34rem |
| 4 | `src/app/not-found.tsx` | EDIT | Ordinary 404 restored to accurate copy with a link to the demonstration homepage; no implied publication |
| 5 | `scripts/verify-u01-http.mjs` | EDIT | Placeholder assertions replaced by **51 counted production-HTTP assertions**; bounded loopback lifecycle, readiness, real `fetch`, teardown and port-release checks preserved |
| 6 | `.documents/Architecture/source-inventory.md` | EDIT | One appended, titled U01 English-demonstration adoption/boundary note with an explicit non-claims paragraph |
| 7 | `.documents/Reports/execution-report.md` | OVERWRITE | This report only, in its own single-path commit; its own SHA is not predicted here |

Product commit `5323439…`: exactly paths 1–6, **+845/−94**, direct parent `8336112…`, non-force
fast-forward push. No other tracked path, dependency, asset, font, image, manifest, workflow, lockfile,
config or governance file changed.

## 3. The production HTTP gate — what it actually proves

`pnpm test:http` starts the built application with the pinned local Next CLI on `127.0.0.1` and an
ephemeral port, waits for readiness, issues real `fetch` requests, then stops that exact child and
confirms the port is released. **51 assertions pass, 0 fail** — up from 21, and no earlier safety check
was dropped.

**Grouped coverage (51):** 1 readiness · 4 document identity (`200`, `text/html`, `lang="en"`, exactly
one `h1`) · 3 `h1`/title truthfulness · 2 served description checks · 1 obsolete-sentence absence ·
3 introduction facts (Apache-2.0 + Next.js + TypeScript, one Entity, Facets/Sites/Pages/locales) ·
4 planned-contract checks (section, four levels + localized representations, region-qualified `en-001`
never guessed, labelled planned) · 4 status-split checks (both columns, real lists of ≥4 items each,
"not a finished website") · 1 visible disclosure · 1 no-publication-claim negative · 3 source-link
checks (exact URL, readable text, and it is the only absolute link) · 1 anchor-integrity check (7 links,
0 broken) · 2 robots directives · 7 absent-fabrication markers (`canonical`, `hreflang`, `sitemap`,
`analytics`, `googletagmanager`, `@vercel`, `modules/connect`) · 1 no-external-subresource check ·
1 substance check · **six 404 refusals** (`/en`, `/en-001`, `/about`, `/does-not-exist-9f3`,
`/robots.txt`, `/sitemap.xml`) · 3 404-page checks (homepage link, stale copy gone, no publication
language) · 1 server-stayed-up · 1 port-released.

**Negative assertions are not decorative.** The old placeholder would fail three of them. A throwaway
in-memory proof (no tracked file) applied the same expressions to the superseded markup and reported
`DETECTED` for: obsolete-sentence detection, missing single-Entity `h1`, stale 404 copy, and 404
publication language — `negatives-non-vacuous=true`. A regression to the old page, to `/en` routing or
to premature metadata therefore fails this gate rather than passing silently.

## 4. Local verification

Node v24.22.1, pnpm 11.6.0, Next 16.4.2, React 19.2.9; frozen lockfile unchanged.

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | `PASS` — up to date |
| `node scripts/verify-governance-docs.mjs` | `PASS` — frozen bytes match |
| `node --test tests/governance-docs.test.mjs` | `PASS` — 6 / 6 |
| `pnpm test:bootstrap` | `PASS` — 19 / 19 |
| `pnpm test:architecture` | `PASS` — 12 / 12 |
| `pnpm lint` | `PASS` — exit 0 |
| `pnpm typecheck` | `PASS` — exit 0 |
| `pnpm test` (Vitest) | `PASS` — 167 / 167 retained |
| `pnpm build` | `PASS` — 3 / 3 static pages, `/` prerendered |
| `pnpm test:http` | `PASS` — **51 / 51**, up from 21 |
| Local WSL | `UNVERIFIED` — not attempted |
| Browser render, screenshot, axe/a11y scan | **NOT APPLICABLE / NOT EXECUTED** — this order is GitHub-only; no browser or a11y tool ran, and nothing here claims one did |
| Vercel preview, production URL, live HTTP to a deployed host | **NOT APPLICABLE** — no deployment exists or is authorized |

**Warnings, disclosed.** The CI workflow step is still named "Run production HTTP (technical
placeholder)"; workflows are outside this ledger and were not edited, so the label is stale while the
command it runs is the new 51-assertion gate. pnpm prints a cosmetic version notice. One trailing blank
line was removed from five files and line endings normalised before committing, with
`git diff --check` and `git diff --cached --check` clean. `DEP0190`, Next cache notices and pnpm
shim-layout warnings were not observed on this machine.

## 5. Exact-head hosted verification

Both unchanged workflows ran on both operating systems at the product head `5323439…`.

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43821721955 | success | success | 9 / **0** |
| Verify U01 baseline | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43821721896 | success | success | 18 / **0** |

Each run reported `completed/success` with `head_sha` `5323439…`. Job and step conclusions were read
per host and confirm the pipeline actually exercised this change: `Architecture boundaries`,
`Production build` and `Run production HTTP` all `success` on **Windows 2025** and **Ubuntu 24.04** —
i.e. the 51-assertion production gate passed in hosted CI on both platforms, not only locally.
**Full log text is `UNVERIFIED`:** the logs endpoint was not readable to this client, so no log line is
quoted. No workflow was edited, rerun, cancelled or retried. Both workflows also run at the
report-only head; those run identities are given in the handback for this order, since this report
cannot contain its own commit SHA.

## 6. Security, privacy, rights and cleanup

- **Frozen governance untouched and still verified:** `AGENTS.md`, `README.md` and
  `.documents/SOP/sop-implementation.md` are byte-identical; `verify-governance-docs.mjs` passes and the
  governance test count is unchanged at 6. No planning slot, workflow, lockfile, `package.json`,
  `next.config.ts`, `tsconfig.json`, `src/core/**`, `src/application/**`, `deployment/**` or `public/**`
  path changed.
- **Pre-publication state preserved:** `noindex, nofollow, nocache` remain; the six declared paths still
  return real 404s (never a redirect); no canonical, `hreflang`, sitemap, analytics, tag manager,
  provider marker, middleware, `route.ts`, `robots.ts` or `sitemap.ts` was added.
- **No external surface:** the page is static HTML/CSS with zero external subresources, zero client
  fetch, zero environment-driven display and no contact form; the only outbound references are two
  ordinary links to the public Uno repository. Light and dark both remain readable; motion is limited
  to a preference-gated smooth scroll; focus is always visible.
- **Privacy:** no ACTIVE byte or digest, no machine path, no credential, no token, no Vercel project or
  provider detail and no personal datum appears in this report or any changed file. ACTIVE stayed
  ignored, untracked and unstaged throughout.
- **Rights:** all page copy and CSS are original Uno-authored work. No Foundation trademark, imagery,
  demo copy, testimonial, Connect asset, third-party font, icon or dependency was copied or added.
- **External state:** no Vercel or provider action of any kind was taken; no deployment, preview,
  promotion, domain, secret or release exists from this run. Foundation `8789a45…`, Solo and the parent
  workspace were read-only and unwritten.
- **Cleanup:** build output stayed in ignored Uno paths; the only scratch was a `.temp/uno-wo-011-r01/`
  directory (one empty hooks dir plus the throwaway negative proof), removed after use; no listener or
  server was left running and the loopback port release is asserted by the gate itself.

## 7. Progress measurement (milestone credit)

| Item | Before | After |
| --- | --- | --- |
| U00 (Owner-closed) | 12.50 | 12.50 |
| U01 outcomes 1–8 | 8 × 1.25 = 10.00 | 10.00 |
| **U01 outcome 9** — visitor-useful English page at `/`, CSS/accessibility, ≥25 production HTTP proofs | 0.00 | **1.25** |
| U01 outcome 10 — full stage exit | 0.00 | 0.00 (not authorized) |
| U02–U07 | 0.00 | 0.00 |
| **Earned total** | **22.50%** | **23.75%** |
| Formal closed stages | 1 / 8 | **1 / 8 — U01 remains OPEN** |

The claimed increment is earned only by the delivered page, styling and real production HTTP evidence.
It is **not** a proportion of hours, an indexation claim, or a statement that full A1 functionality is
23.75% coded. No point is claimed for commits or tests alone.

## 8. Remaining blockers and the next decision

1. **Independent Architect review** of this bounded deliverable is the open decision now:
   `ACCEPT` / `REVISE` / `STOP`. The Agent neither self-accepts nor closes U01.
2. **Vercel deployment is the immediately subsequent Owner-controlled gate** and is not authorized here.
   It needs its own order naming the project/team, preview-versus-production target, Git-integration
   policy, access controls and an externally checked HTTPS URL. The page is deliberately `noindex`,
   which is a search directive and not access control.
3. **Further languages** require a later Owner decision after the English demonstration is live; this
   order adds no locale route and does not touch `en-001`.
4. **U02–U07** remain not started, and the canonical governance consolidation question stays with the
   Owner. U01 exit still requires its tenth outcome and express Owner closure.
