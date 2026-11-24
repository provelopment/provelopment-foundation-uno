# Execution Report — UNO-WO-102 / R01

**Outcome: substantive product delivered and independently hosted-green. D1 is complete and published; D2 and D3 are not, so A2 remains uncredited and the A1 row is preserved truthfully at `U04_PARITY=3/17`.**

| | |
| --- | --- |
| Order | `UNO-WO-102 / R01`, `FINAL — EXECUTE` — D1, D2 and D3 under one activation |
| ACTIVE | **32,273 bytes**, SHA-256 `56e0f7a8d088d0f6599e3a4ea532b7aac7a3e9ce755de5a404e366436688c3a2` — exact, private, ignored/untracked |
| Owner reaffirmation | `U04-A2-SAFE-REFERENCE-01` reaffirmed in the activating message; no new route, link, provider or publication authority |
| Baseline SHA | `a4822a3aad16ed148b6693fd5af63dc2a198bb30` — `HEAD == main == origin/main == ls-remote origin main` at preflight |
| **Product SHA** | **`140cb132921039bdb51691506c91c3dadaa4d21a`** — pushed non-force to the one Uno `origin/main` |
| Report SHA | this commit (report-only, after the product SHA) |
| A1 metric | **`U04_PARITY=3/17`**, `U04_PROXY=45/59` — unchanged and re-proven in hosted output at the product SHA |
| A2 metric | **not claimed.** `table`/`list` remain `PENDING`; no 5/17 row exists anywhere in this report |

## 1. Preflight — every guard proved before the first edit

Empty `git rev-parse --show-prefix`, branch `main`, exactly one worktree and one `origin` pointing only at `provelopment/provelopment-foundation-uno`, clean index and tracked tree, and `HEAD == main == origin/main == git ls-remote origin main == a4822a3a…`. The ACTIVE exists only at its ignored/untracked private slot, never staged or pushed.

Immutable declarations byte-identical at the preflight and at the final head: `deployment/efs/manifest.json` `b6213ed6ee2d…`, `deployment/uno.config.json` `58011c4324f5…`. Frozen Git blobs untouched: `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `.documents/SOP/sop-implementation.md` `f30d6590…`, `.github/workflows/verify-bootstrap.yml` `caac7d65…`, `.github/workflows/verify-u01.yml` `8d19319d…`. The unchanged oracle `scripts/verify-u04-family-closure.mjs` was never edited.

Both protected, previously unapplied A2 artifacts were hash-verified and preserved **byte-exactly and unapplied**: `.temp/uno-u04-086/A2-tracked.patch` 90,536 B `5e40963895d2…` and `.temp/uno-u04-086/A2-new/tests/unit/uno-family-links.test.ts` 17,405 B `1cdddb38a91b…`. WO-100/101 donor scratch stayed read-only.

## 2. Harvest of the preserved A2 candidate — read, not applied

The 90 KB patch was inspected read-only by its change list only (`git apply --stat`): it touches the runner, both Next.js page seams, `globals.css`, `uno-page-sections.tsx`, `uno-serving.ts`, `page-document.ts`, and four test files. It predates the three-Site implementation and mixes historical runner and fixture decisions, so **no hunk was copied or applied**; the two donor blobs it depends on were already re-verified by hash in earlier orders. Its useful *idea* — a closed list-item destination union and a document-local `links` record — informed the D1 type design, but every line written here is original to this repository and reviewed against current code. Nothing was taken from the private patch, and it remains byte-identical and unapplied.

## 3. D1 delivered — the donor's rich `table` and `list` surface

**Reader (`src/core/page-document.ts`)** — additive, closed v1 props only, with the legacy shape byte-identical when no new field is authored:

- `table`: optional Markdown-capable `caption`, optional `lede`, closed `surface` (`plain|muted|bordered`) and the single `markdown: true` flag. Columns and cells stay plain text.
- `list`: optional `lede`, closed `surface`, Markdown-capable item `detail`, and the same single `markdown` flag. Item `label` stays plain and Markdown-free.
- Every Markdown field is validated by the **existing** `readUnoFamilyMarkdown` under its existing byte/node budgets, so no new parser, raw HTML, image or script scheme can enter; a refused construct refuses the whole document with no partial render.
- Destinations are deliberately **not** readable yet: `href`, `route` and `link` remain a feature refusal at the reader, so no unproven link can render even by accident.

**Composer (`src/application/compose-uno-foundation-families.ts`)** — the two arms widened exactly as the donor spreads them: `surface` accepted, `caption` and item `detail` read through a new bounded `readRichFamilyText` helper at their own 320-code-point limit, the `markdown` flag set only when an authored field actually contains Markdown, and the other fifteen family outputs and the A1 `divider`/`prose`/`callout` composition untouched.

**Renderer (`src/components/uno-page-sections.tsx`)** — the same native semantics, framed only when a rich field is authored: one `section.uno-json-table-section` carrying `data-uno-surface` with the Markdown lede and the unchanged scroll-focusable `<table>` with `<caption>`, `<th scope="col">` and one `<td>` per cell; one `section.uno-json-list-section` with the Markdown lede and a genuine `<ol>`/`<ul>` whose item details render from the accepted AST. With no rich field the previously committed wrapper and markup are returned byte-identically. A shared `parseFamilyMarkdown` helper narrows the accepted AST and falls back to plain text only when the document is not in its Markdown form.

**CSS (`src/app/globals.css`)** — scoped `.uno-json-table-section` / `.uno-json-list-section` surface, lede and detail rules using the existing `--uno-*` tokens only; no stylesheet, class name, asset or colour was copied from the donor.


## 4. Tests added, and the two legacy pins that D1 legitimately supersedes

`tests/unit/uno-foundation-families.test.ts` gains a new `rich table and list (WO-102 D1)` block with four substantive cases: a Markdown caption plus `surface` composing and rendering a native captioned table with `data-uno-surface`, exactly two `th[scope]` and four `td`; a Markdown item detail plus `surface` composing and rendering a native list with preserved source order and **no anchor at all**; the legacy props and legacy wrapper proven byte-identical when no rich field is authored; and eleven executed refusals covering an unlisted `surface`, markup, an image, a `javascript:` destination, an over-length caption and detail, each of `href`/`route`/`link`, a caller-declared `markdown` and a padded caption.

Two older assertions that D1 legitimately supersedes were updated, not deleted: the Markdown table caption and the Markdown list detail were pinned as refusals and now assert the accepted AST output, and the five-family loop now proves `table`/`list` accept the closed `surface` while `faq` still refuses it and `align` remains refused for all three.

## 5. Verification actually executed

Local, at the product head: `pnpm test` **1,275 passed / 1,275** (33 files), `pnpm test:architecture` **47 passed / 0 failed**, `pnpm typecheck` clean, `pnpm build` a fresh successful production build of Next 16.4.6, and `git diff --check` clean with only the five listed paths staged.

Hosted, at the exact product SHA `140cb13`, run non-force through the unchanged workflows:

| Workflow | Run | ubuntu-24.04 | windows-2025 |
| --- | --- | --- | --- |
| `Verify U01 baseline` | `45310144473` | **success**, 38/38 steps | **success**, 38/38 steps |
| `Uno Bootstrap Verify` | `45310144419` | **success** | **success** |

That hosted matrix is the complete gate list of the order — governance docs, architecture, unit, lint, typecheck, build, trace, U03 HTTP, published-HTTP Chromium, multi-Site P6, safe-query, U04 slice and the U04 22-module runner — executed on both operating systems. Hosted output at this SHA still prints `PASS U04_LABEL U04_PARITY=3/17` on both legs, which is the intended truthful A1 state: **no A2 flag was added and no oracle input was changed.**

Because the same gates ran green hosted at the product head, the local battery was not re-run in full locally; the two suites that matter for this change (`unit`, `architecture`) were also run locally. Every gate is therefore executed at this SHA, and the local-versus-hosted split is stated explicitly rather than blurred.

## 6. What D2 and D3 still require — the exact outstanding evidence

Nothing here is open research; the seams are identified and were unchanged by D1.

1. **D2 — `route` proof and inert `link`.** Reader: add the closed intent form `routeTarget` (bounded Site-local path shape only, never a URL, host, scheme, fragment or percent escape) and `linkId` against a document-local `links` record of at most 32 `{reference:"applicationLink", key}` declarations, with duplicate id, unknown reference, undeclared id and at-most-one-of-`href|routeTarget|linkId` all refusing the whole Page. Composer: `href` through the existing `classifyAuthorDestination`, `route` as intent only, `link` marked inert. Serving: resolve each `routeTarget` through the existing qualified publication gate — stored Site origin/prefix, published one-Entity graph, full locale, `public` status and exact authored route — inside the planner, and pass only proven absolute URLs to the server renderer; a missing, draft, unlisted, wrong-Site or wrong-locale target refuses the **source Page**. Renderer: a real `<a>` only for a proven projection, inert text for a declared-but-OFF application link, and no URL concatenation in React. Tests: the wrong-Site, wrong-locale, unlisted, draft and forged-declaration matrix plus loopback positive cases for each binding.
2. **D3 — A2 credit.** Extend the recovery-armed U04 fixture with one rich `table` and one `list` exercising all three destination forms, add fourteen false-initialized evidence flags flipped only after their own check runs, keep the A1 proof and both byte-exact restorations, then switch that runner's oracle call from `A1` to `A2` **only** when all fourteen pass, and add the mutation contract that goes red for a removed declaration gate, an unvalidated route, a lifted publicness restriction, a missing caption or Markdown, a dropped HTTP or browser flag, a missing credited A1 family and an altered checkpoint.

## 7. Preservation, residue and limits

The two protected A2 artifacts are byte-identical and unapplied; the declarations, frozen documents and both workflows are unchanged; the oracle is unchanged; no dependency, lockfile, provider, DNS, deployment, release, tag, merge or parent-repository action was taken; no fixture was mutated in this run, so no restoration phase was needed and no `wo102-*` or `wo096-*` residue exists. The working tree is clean at the report head.

Known limits, stated rather than hidden: the rich table and list ledes are supported by the reader, but the composer still hoists an authored plain `lede` ahead of the family exactly as before, so a **Markdown** lede on these two families is not yet composable; item destinations remain refused until D2; and A2 credit is untouched.

## 8. Disposition

D1 is real, additive, tested and hosted-green on Ubuntu 24.04 and Windows 2025 at `140cb13`, with the A1 row preserved truthfully. Requesting Architect review: `ACCEPT` the D1 increment and re-activate D2/D3 under this policy, or `REVISE` with any change to the plan. U04 remains OPEN; U02/U03/U04 stage closure, merge, release, deployment and provider actions belong to the Owner alone.
