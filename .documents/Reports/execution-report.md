# Execution Report — UNO-WO-062 / R01

**Status: DELIVERED — fourteen bounded source-shape mappings published and verified. U04 remains OPEN.**
**Accounting: 14/17 bounded source-family mappings, 3 entirely unimplemented, 0/17 fully accepted Foundation-family parity.**

## 1. Authority and observed start state

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-062 / R01`, EDITION FINAL — EXECUTE |
| ACTIVE | `.documents/WIP/workorder-active.md` — **28,149 bytes**, SHA-256 `a2279a2283515d4cb3f9ddd8fd363a3418ce675e4ccd2bf4f6c0ddb461af3bc1`, ignored, untracked, unstaged, in its one private WIP slot |
| Required start | `fbbf38d66f1e376a76753d13b634903e86fb4f0d` — matched on `HEAD`, local `main`, `origin/main` and `git ls-remote` |
| Start blobs | A01 `f0afe5a1341a8e66af71c278e5b4e83af9563f96`, A02 `e3b0a84f882950092c2689e4a1861436fac21ae8`, A03 `24bd6ec9edd1bf4e597d792c12e82aba393779b6` — all matched, so no Owner work was overwritten |
| Physical/Git | one checkout, **1** worktree, **1** branch (`main`), **1** remote `origin` → `provelopment/provelopment-foundation-uno` only, **0** stashes, empty index and clean status before the first write |
| Declarations | `deployment/efs/manifest.json` `ba232d46…e3f0`, `deployment/uno.config.json` `4f656c93…9a0c` — byte-identical before and after every stateful suite |
| Toolchain | Node 26.x, pnpm 11.6.0, Next 16.4.6, React 19.2.9, Playwright 1.65.1 from the live repository; nothing installed, no lockfile edit |

## 2. Published product — one complete commit, audited before push

| Commit | Contents |
| --- | --- |
| **`de8631aac88954cd69d522dc64452586689b72ad`** `feat(u04): compose bounded same-document actions subset` | A01 `03747bf5e3a647c04d41f6184dde2e234d41003e`, A02 `a40e426f4b6c94c75b6a0abc2e55d0f89cd2d707`, A03 `125cc714bad8a264da472a13527aa0249c174f18` |

Gate order actually used: unstaged `git diff --check` exit 0 with no output → the three paths staged by explicit path
(never `.`) → staged `--check` exit 0 → staged name-status exactly three `M` and a strict set compare → **index-byte
audit** (`git show :<path>`: A01 has the `case "actions"` arm, the tuple entry and the `topLevelIds` preflight; A02 has
`MAPPED_14` and the exact `UNIMPLEMENTED (3)` line; A03 has exactly one `UNIMPLEMENTED (3)`, no `(4)`, one
`fourteen bounded`, no stale `thirteen bounded` and no `FAMILY_PARITY=` claim) → commit → **committed-tree audit**
(`git diff-tree --name-status -r HEAD` exactly three `M`) → `git show HEAD:<ledger>` re-checked → status empty → focused
A02 and architecture re-run against HEAD with clean tree/index → non-force push. The commit was complete before
publication, so the amendment clause and any corrective commit were **not used**.


## 3. Fourteen bounded source-shape results

Unchanged in kind: one inward `src/core/page-document` import, no IO, React, Next, provider, environment, host,
link-resolver or publication authority; one validated deep-frozen `UnoPageDocument` or one closed refusal with no
`document`.

| # | Donor family | Accepted subset | Composed Uno structure |
| --- | --- | --- | --- |
| 0–10 | `prose`, `callout`, `table`, `list`, `divider`, `hero`, `stats`, `steps`, `quote`, `faq`, `columns` | unchanged | unchanged — byte-identical to the previously accepted output |
| 11 | `cards` | required `columns` 2|3|4, `items[1..8]{title,body?}` | native list-grid of tight stacks, level-2 heading plus only an authored body |
| 12 | `features` | same narrow subset | the same native list-grid per feature |
| **13** | **`actions`** | `type`, required `actions[1..8]{label,href}`; label plain text ≤160 code points; `href` a literal unencoded `#family-<index>-<name>` fragment naming an **existing top-level** composed section | `content.actions {items:[{label,targetId}]}`, authored order and every anchor kept one-to-one |

Deterministic ids `family-0-prose` … `family-12-features`, then `family-13-actions`. The first **thirteen** nodes are
**JSON byte-identical** to the thirteen-shape result. Output is deeply frozen including nested action items, caller input
is unchanged, and both the object and its JSON text re-accept through `readUnoPageDocument`. No `variant`, `href`
passthrough, route, locale, second destination or synthesized anchor exists in the composed node.

**Exact destination trust boundary.** The adapter first applies a lexical gate — literal fragment spelling only — and
then, before the Uno reader, compiles the ids of the nodes it just generated and requires every `targetId` to equal one of
them. Missing targets, mistyped family names and **nested generated children** therefore refuse even though a nested id
such as `family-0-columns-column-0` really does exist in a composed columns document; that existence is proven in this
very suite. The Uno reader's own end-of-document target resolution is left intact and unchanged.

**Renderer evidence** (`renderToStaticMarkup(createElement(UnoPageSections,{document}))`, measured only in the fragment
starting at `id="family-13-actions"`): `<ul class="uno-json-actions" id="family-13-actions">` with exactly two direct
`<li class="uno-json-action-item">` and exactly two `<a class="uno-json-action" href="#…">`, in authored order, pointing at
`#family-0-prose` and `#family-12-features`, both of which exist as real `id` attributes in the same document. No `http`,
`mailto:`, `tel:`, `/contact` route, `iframe`, `script`, `target=`, `rel=`, `download` or handler appears; a second
`<main>`/`<h1>` is absent. Escaped `&`, quotation marks and an inert `<` render as text; real script-like labels refuse.

### Deliberate limitations (recorded, not concealed)

The donor action also accepts `route` and `link` destinations and an optional `variant`, and the donor section accepts
`heading`/`lede`/`align`/`surface`. None of those are composed: they are refused, never degraded, resolved or guessed.
The earlier recorded limitations still stand — donor `steps`/`faq`/`columns`/`cards`/`features` heading outlines, card
borders/media/meta/actions, feature icons. This is `COMPOSE (same-document anchor subset)`, not full `actions` parity, and
no link engine, route resolver, media or publication authority is claimed.


## 4. Focused tests — 88 cases (78 retained, 10 added)

Retained: every earlier family, envelope/feature, malformed-value, Markdown, determinism, hostile-source,
zero-getter-invocation and ledger case, unchanged in intent. Added: the fourteen-name frozen tuple with the 22-module
registry untouched; fourteen-node composition and exact `family-13-actions` identity; first-thirteen byte-identity; a
forward reference to a later section; the one- and eight-action bounds; deep freeze of nested items plus object/JSON
re-acceptance; per-fragment native-anchor markup; the no-external-destination assertions; escaping; and the corrected
14/3/0 ledger guard.

Exact refusals proved, each with the closed reason and no own `document` key:

| Input | Reason |
| --- | --- |
| `actions` omitted, non-array, string entry; omitted `label`/`href`; entry `variant`/`route`/`link`/`target`/`rel`/`download`/`onClick`/`style`; section `heading`/`lede`/`align`/`surface`/`links`/`visibility`; non-string label/href; Markdown labels `**bold**`, `*italic*`, `[x](url)`, backticks; `https://example.org`, `/contact`, `mailto:`, `tel:`, `#link:foo`, `#other`, `#family-%30-prose`, trailing whitespace, query suffix | `family:unsupported-feature` |
| zero or nine actions; blank/whitespace label; 161-code-point label; `<script>` label; `#family-99-prose`, `#family-0-hero`, `#family-1-actions`; nested `#family-0-columns-column-0`; candidate above the 64 KiB cap | `family:target-refused` |
| `label` accessor and `href` accessor (getter counter **0**), sparse actions array, and a valid `prose` followed by hostile `actions` (whole Page refuses, no partial content) | `family:unsafe-source` |
| exactly `media`, `gallery`, `contactForm` and unknown `heading` | `family:unsupported-family` |

## 5. Corrected ledger

A03 keeps every earlier row and donor pin, adds a distinct `actions` row marked `COMPOSE (same-document anchor subset)`
citing `a12d964c…`, `caeee577…` and `19c9bee3…`, and records exactly one line:
**UNIMPLEMENTED (3):** `media`, `gallery`, `contactForm`. It states **fourteen bounded mappings**, **three entirely
unimplemented**, **zero of seventeen full semantic parity**, no published family-Page HTTP/browser proof, a dedicated
"Deliberately absent donor design (actions)" paragraph, and no stale `(4)`/`(6)`/`(8)`/`thirteen bounded` claim. The guard
fails on any `FAMILY_PARITY=14/17`, `13/17` or `17/17` marker.

## 6. Local battery — sequential, green on the final bytes

`pnpm test` **1,006 passed / 30 files** (focused **88**); architecture **46/46**; typecheck 0; `eslint . --max-warnings 0`
0; bootstrap OK; governance test and CLI pass; the seven deployment unit suites pass; readiness **PASS**
(`VERCEL_NOT_DEPLOYED_BY_AGENT`); security **ACCEPTED** (zero waivers, zero HIGH/critical); U03 published HTTP **542/0**;
U04 JSON slice **464/0**; U04 22-module runner **565/0** with `FOUR_ZONE_HTTP=4/4`,
`NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER`, `BROWSER_MATRIX=16/16` (16 distinct case ids), fixture teardown, *nothing staged*
by the gate, no residue; `pnpm build` 0; U03 trace `--expect committed` OK; `pnpm test:http` **103/0**;
`verify-u03-http` **91/0** with the committed unpublished `/en` still a real 404. Fixture suites ran strictly **one at a
time**. Both `git diff --check` and `git diff --cached --check` exited 0 with no output. Adapter-specific HTTP is **NOT
APPLICABLE** — a pure translator, no published Page.

## 7. Hosted CI at the product head

`de8631aac88954cd69d522dc64452586689b72ad`: `Uno Bootstrap Verify` run `44829014394` — `verify (ubuntu-24.04)`
**success**, `verify (windows-2025)` **success**; `Verify U01 baseline` run `44829014399` — `verify (ubuntu-24.04)`
**success**, `verify (windows-2025)` **success**. No failed, muted or skipped step.

## 8. Source rights

Donor read-only at `provelopment/provelopment-foundation` @ `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, Apache-2.0
(`LICENSE` `d645695673349e3947e8e5ae42332d0ac3164cd7`, 11,358 bytes). Verified evidence: `src/core/page-document.ts`
`a12d964c…` (exact 17-type roster; `actionsSectionSchema`, `actionSchema`, destination and variant forms),
`text-sections.tsx` `caeee577…` (donor `ActionsSection` genuine link list), `section-support.tsx` `19c9bee3…` (donor
`ActionLinks` item presentation), plus the earlier `items-sections.tsx` `bc729d6a…`, `media-sections.tsx` `e3f3a12e…`
and `structure-sections.tsx` `65d254e1…` evidence. Concepts and native semantics only: no donor TypeScript, JSX, CSS,
Tailwind, assets, icons, packages, notices, logos or Connect code copied; no dependency, licence extension or module ID
(registry stays 22); zero waivers. The transitive picomatch GHSA remains unresolved and is disclosed, not claimed fixed.

## 9. Remaining obligations

Three donor families are entirely unimplemented. Outstanding for the fourteen bounded shapes: full donor Markdown,
link/route/locale resolution, media and contact delivery, the remaining destination and appearance options, the recorded
heading-outline differences, a composition Page, real published family HTTP/browser proof, and the neutral installation
and presentation shell. **U04 stays OPEN**: no stage closure, merge, tag, release, manual deployment, provider/secret/
config change or 23rd module occurred, and no full-family-parity claim is made.

The report commit SHA and its own CI results cannot appear in this file; both are returned in the handback message.
