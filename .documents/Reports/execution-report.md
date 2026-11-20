# Execution Report — UNO-WO-056 / R01

**Status: DELIVERED — one verified product checkpoint published; U04 remains OPEN.**

## 1. Order and authorization

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-056 / R01`, EDITION FINAL — EXECUTE |
| ACTIVE | `.documents/WIP/workorder-active.md`, **28,274 bytes**, SHA-256 `0102b331802b60208b9c11bb9b7c4fe10f29220fd2e84f6bcfddfe53f72936f3` — byte- and hash-identical to the activation; ignored, untracked, unstaged |
| Required start | `2eb81d6e7dbc7991bbe41bb2d6e46884597dd347` — matched exactly on `HEAD`, `main`, `origin/main` and `ls-remote` |
| Owner approvals used | The §5 typed `content.prose` alternatives and `layout.grid` list/ratio extensions; one planned product commit; one report-only commit; ordinary non-force pushes; automatic Git-triggered deployments |

## 2. Physical and governance preflight — PASS

One physical checkout, **1** worktree, **1** branch (`main`), **1** remote (Uno `origin`), **0** stashes, empty index and empty `git status` before the first write. No parent, sibling, Foundation or Solo path was written; no second clone/worktree/branch/stash was created.

Protected declarations, before and after the full battery: `deployment/efs/manifest.json` = `ba232d46edcd13e95231f627f67058d383bc4479f076eb2be1ca9c576de6e3f0`, `deployment/uno.config.json` = `4f656c93a45873d85b133aa99adaec1b6821ac9983b9e9818452773952df9a0c`. Both unchanged from the pins.

## 3. Published product

**Product commit:** `46aa77044bfe1540c48d2e7466716dfbd533e46e` — `feat(u04): add closed semantic prose and grid variants (WO-056)`. Exactly the five authorised paths changed; no file added, deleted, renamed or generated:

- `src/core/page-document.ts`
- `src/components/uno-page-sections.tsx`
- `src/app/globals.css`
- `tests/unit/page-document.test.ts`
- `tests/unit/uno-page-sections.test.ts`

Frozen as required: registry and the 22 module IDs, `layout.bento` `plain|article` acceptance, package/lockfile/workspace, workflows, Next/CI/security configuration, deployment declarations, EFS/selection/site authority, assets and prior runners.

## 4. Implemented semantics

`content.prose` keeps its module ID and document `version: 1`, and its legacy `{text}` shape is byte-compatible and still renders the original `<p class="uno-json-prose">`.

| Shape | Accepted JSON props | Rendered markup |
| --- | --- | --- |
| callout | `variant,text`, optional `tone: note\|info\|warning` | `<section class="uno-json-callout" data-uno-tone=…>` with one `<p>`; no invented `role="alert"` |
| list | `variant,items[1..12]{label,detail?}`, optional `ordered` boolean | real `<ol>`/`<ul class="uno-json-list">` with one `<li>` per entry, label `<span>`, optional detail `<p>` |
| table | `variant,columns[1..6]`, `rows[1..20]` each exactly `columns.length`, optional `caption` | focusable `<div class="uno-json-table-scroll">` → `<table>` with `<caption>`, `<th scope="col">`, rectangular `<tbody>` |
| divider | `variant` only | exactly one `<hr class="uno-json-divider">`, zero content |

## 5. Tests added — 141 focused tests, all passing

Positive and backward-compatibility cases: legacy prose keys/escaping/freeze; callout with and without tone; ordered and unordered lists with details; table with and without caption; divider; JSON round-trip and deep-freeze of all five shapes; grid list semantics and all four two-column ratio combinations.

Refusals (whole document, published reason vocabulary): unknown variant, declared `variant:undefined`, stray legacy prop, crossed table+text, crossed divider+text, unknown callout tone, empty callout, `html`/`style`/`onClick` props, empty/oversized list, blank/non-string label, item `href`, string `ordered`, non-array items, sparse entry, accessor array index (getter proven not to run), hostile getter entry (`document:input-not-plain`), empty/oversized column sets, empty/oversized rows, non-array row, ragged row, blank cell, overlong cell and caption, nested object cell, extra table prop, `<script>` and `javascript:` text, ratio on 1/3/4 columns, unknown ratio, unknown semantics, extra grid key, and `list` semantics on Bento.

Markup assertions are structural, not label-only: exact `<th scope="col">` count, `<tr>` count, `<td>` count, `<caption>` presence/absence, `tabindex="0"` scroll wrapper, single `<hr>` serialization, `<ol>/<ul>` element identity, `<li>` count and order, `<ul>` grid root with `role="list"` and no `<div class="uno-json-cell">`, unchanged `plain`/`article` wrappers, absence of `data-uno-ratio` when unauthored, and zero `<script>`, `<main>` or `<h1>` output with ampersands escaped.

## 6. Local battery — every step green

`pnpm test`, `pnpm test:architecture` (46/46), `pnpm typecheck`, `eslint . --max-warnings 0`, `pnpm test:bootstrap`, governance test and `verify-governance-docs`, `u03-fixture-transaction`, `u03-trace`, `u04-json-slice`, `u04-22-module-consent` guard (19/19), `u04-security-exception`, `node26-security-floor`, `verify-vercel-readiness` (132 checks), `verify-u04-security-exception`, `verify-u03-published-http` (542), `verify-u04-json-slice` (464), `verify-u04-22-module-consent` (**565 passed, 0 failed**; `FOUR_ZONE_HTTP=4/4`, `NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER`, `BROWSER_MATRIX=16/16`), `pnpm build`, `verify-u03-trace --expect committed`, `pnpm test:http` (103), `verify-u03-http` (91). Browser runs used the repo-local `PLAYWRIGHT_BROWSERS_PATH`. Zero skipped or weakened steps; committed `/en` still 404.

## 7. Hosted CI at the product head

`46aa77044bfe1540c48d2e7466716dfbd533e46e`:

- `Uno Bootstrap Verify` run `44729790813` — ubuntu-24.04 **success**, windows-2025 **success**
- `Verify U01 baseline` run `44729790821` — ubuntu-24.04 **success**, windows-2025 **success**

## 8. Security

Zero waiver entries; no raw HIGH/CRITICAL and no production advisory above the committed floor; lockfile, waiver list and security checker untouched. The known picomatch GHSA remains **unresolved and disclosed** — it is not claimed as repaired. No provider request, SDK, analytics, webhook, external link authority, image or dependency was added.

## 9. Remaining obligations

This order deliberately implements primitives only. No family adapter, composition use case, parity ledger or family Page exists, and **no `FAMILY_PARITY` result is claimed**. The 17 Foundation-family mappings, their refusal evidence, the rights/unsupported-forms ledger and the published family Page with real HTTP/Chromium proof remain future authorised work. **U04 stays OPEN.**

The report head SHA cannot appear in this file; it and the report-head CI results are returned in the handback message.


`layout.grid` accepts `itemSemantics:"list"` (grid-only; Bento still refuses it) rendering one `<ul role="list">` root with one direct `<li class="uno-json-cell">` per child in source order, and `ratio:"equal"|"start-wide"|"end-wide"` only when `columns===2`. Old `plain` and `article` markup is unchanged, and `data-uno-ratio` appears only when authored. CSS: table scroll plus focus-visible outline, callout tones from existing `--uno-*` tokens, native list markers, and two-column ratios from 640 px upward with all grids single-column below it.

Parsing runs through the existing `readPlainData`/`hasExactlyKeys`/`readBoundedText`/`RefusedDocument` path only. Every list item, column, row and cell is read with `Object.getOwnPropertyDescriptor`, so a hostile index getter is refused without executing. Caps: text 4000, label/heading 160, cell/detail/caption 320 codepoints; 12 list entries; 6 columns; 20 rows; document limits (64 KiB, 32 sections, 128 nodes, depth 4) unchanged. Unsafe text policy is unchanged and was **not** relaxed: `<script>` and `javascript:` are still refused with `document:unsafe-text`.
