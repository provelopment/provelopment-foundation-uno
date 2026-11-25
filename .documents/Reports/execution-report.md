# Execution Report — UNO-WO-118 / R02

**Outcome: COMPLETE — the FAQ surface now presents. `PARITY_FAQ=PASS`, `U04_PARITY=10/17`, `U04_PROXY=52/59`, proven by actual computed browser presentation at 390/1280 in light and dark/reduced motion, with all nine prior credits, R01's functional surface and every regression preserved. B1 remains earned; B2 and U04 remain OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-118 / R02`, `FINAL — EXECUTE` (supersedes R01, implemented on top of it — nothing reset or reverted) |
| ACTIVE | **3,956 bytes**, SHA-256 `cc621f0f25675b5a0bc753e9cbf0219f93c1cf1a7ade1e68bc0116a56890a69f` — matched the activation exactly; private, ignored, absent from the tree |
| Start SHA | `f673fe72245c90472c81e65f962090d87bf6ed65` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Donor pins | Foundation GEO-03 `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, schema `a12d964c…`, `structure-sections.tsx` `65d254e1…`, `section-support.tsx` `19c9bee3…` — read-only, unchanged |
| Oracle | unchanged `scripts/verify-u04-family-closure.mjs`: A1 `3/17`, A2 `5/17`, B1 `8/17` / `50/59`, Quote interim `9/17` / `51/59`, FAQ interim `10/17` / `52/59` |

## 1. The defect and the fix

R01 closed the donor's FAQ schema and emitted the closed `data-uno-surface` on every disclosure group, but
`src/app/globals.css` had no rule for it: `plain`, `muted` and `bordered` presented identically, so the surface was an attribute
rather than a presentation. Two token-only rules were added, scoped to the group and nothing else:

```css
.uno-json-accordion[data-uno-surface="muted"]    { padding: 0.75rem; border-radius: var(--uno-radius-lg); background-color: var(--uno-surface-strong); }
.uno-json-accordion[data-uno-surface="bordered"] { padding: 0.75rem; border: 1px solid var(--uno-border); border-radius: var(--uno-radius-lg); background-color: var(--uno-background); }
```

`plain` deliberately has **no** rule: it denotes "no emphasis", which is exactly how `prose`, `callout`, `list`, `table`, `hero`,
`stats`, `testimonials` and `timeline` already treat it. So `plain` and an absent surface present identically, the ordinary
accordion's markup **and** appearance are unchanged, and no colour, font, image, external resource or new module was introduced.

**Coverage differences from the donor's outer section, recorded rather than smoothed over.** The donor wraps heading, lede and
the disclosure list in one surfaced section; Uno applies the surface to the **disclosure group(s)** only — the authored heading
and Markdown lede sit above the group in the documented stack and are not surfaced. And because a 9–24-item FAQ is consecutive
ordinary groups (the eight-panel bound is never raised), **each** group is surfaced, so a long list reads as grouped surfaced
blocks rather than one uninterrupted panel; with an authored heading/lede those groups sit inside the family's inner container
one wrapper deeper. Both are stated in the ledger.

## 2. Acceptance evidence — computed presentation, not an attribute

| Execution | What it proves |
| --- | --- |
| `FAMILY_SURFACE_CSS` (executed in the gate over the shipped `globals.css`) | both rules exist with exactly the token declarations above, no rule exists for `plain`, and neither rule contains a literal colour, `rgb(`, or `url(` |
| light 390/1280 + dark/reduced-motion 390/1280 computed comparison | for each case one served group is measured with real `getComputedStyle` and three **fresh sibling clones** carrying `plain`, `muted`, `bordered` plus an absent-surface clone: `plain` must equal absent; `muted` must differ from `plain` in background **and** padding; `bordered` must differ from `plain` in border width and from `muted` in background; the authored group must match the `muted` reading; no overflow |
| served 24-item FAQ (temporary fixture swap, restored byte-exactly) | three consecutive groups, 24 disclosures, every group carrying the authored `muted` surface with the same computed background and the `0.75rem` padding, all closed, no overflow, authored order from `Question 1?` to `Question 24?`, and the served Page restored to its two-item fixture by digest |
| 25-item refusal + nine-panel refusal | unchanged from R01 and re-executed: `family:target-refused` for 25 entries, `document:invalid-children` for a hand-authored nine-panel accordion |
| focused unit proofs | the shipped stylesheet contract (`.uno-page-sections.test.ts`), the authored/absent/`plain` attribute output and both-group surfacing for 9 and 24 entries (`.uno-foundation-families.test.ts`), and the **positive Quote safe-link compose → read → render** regression the order asked for (`https` link composed with `markdown: true`, byte-identical through the strict reader, rendered as `<a rel="noopener noreferrer">` with no literal syntax) — no Quote product code changed |

## 3. Authorized changes (8 modified, no new product module)

| Path | Change |
| --- | --- |
| `src/app/globals.css` | the two narrowly scoped, token-only surface rules above, with the comment recording why `plain` has none and why the group (not the page) is surfaced |
| `scripts/u04/family-fixture.mjs` | new `FAQ_LONG_SOURCE` export — the donor's full 24 items, used only by the surface-coverage proof |
| `scripts/u04/faq-evidence.mjs` | `FAQ_LONG` facts and the pure `faqSurfacesDistinct(rows)` comparison (plain == absent, muted/bordered each different, muted background+padded, bordered wider border), so the browser proof and its unit-level twin share one definition |
| `scripts/verify-u04-22-module-consent.mjs` | the executed `FAMILY_SURFACE_CSS` check; the light and dark computed-surface probes on sibling clones; the temporary 24-item fixture swap with byte-exact restore and re-verification; the surface-case conjunction and its `A2_LOCAL_BROWSER` label; the long block imports the adapter through a variable specifier so the audit's single "real adapter" token stays unique |
| `tests/unit/uno-page-sections.test.ts` | the shipped-stylesheet contract: one token treatment per emphasised value, no `plain` rule, base accordion rule still layout-only |
| `tests/unit/uno-foundation-families.test.ts` | explicit `plain` output, per-group surfacing for 9 and 24 entries, and the positive Quote safe-link compose/read/render regression |
| `tests/deployment/u04-22-module-consent.test.mjs` | the new tokens (stylesheet check, both verdicts, the two surface check names, the conjunction, the long-FAQ and restoration checks, `paddingInlineStart`) plus four neutering mutations for the surface proof |
| `.documents/Architecture/u04-family-parity.md` | the R02 paragraph (rules, `plain` convention, the two coverage differences, the proof), the FAQ row's evidence cell, and the retained `10/17` / `52/59` interim with B2 still Open |

`src/core/page-document.ts`, `src/components/uno-page-sections.tsx` and `src/application/compose-uno-foundation-families.ts` were
**not** touched: R01's closed schema, composition and renderer were already correct, and the ledger allowed them only "if
necessary". No workflow, frozen governance file, closure oracle, dependency, durable Page or declaration, external repository,
provider, release or deployment was changed.

## 4. Local verification (executed sequentially in this run)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` (unit, vitest) | **1,367 / 1,367**, 35 files (R01 head: 1,364) |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `node --test tests/governance-docs.test.mjs` | **13 / 0** |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **344 / 0** (R01 head: 343) |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **872 passed / 0 failed** (R01 head: 864) — `PARITY_FAQ=PASS`, nine prior families `PASS`, `U04_PARITY=10/17`, `U04_PROXY=52/59`, `22/22`, `4/4`, `16/16` |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — both phases byte-exact |

Two earlier in-run defects were found and fixed by this work, not papered over: measuring by mutating the served node's attribute
and reading it back in the dark/reduced-motion pass returned stale values (Chromium's style invalidation for the mutated node in
that pass), so the proof now measures **fresh sibling clones** and never mutates the served group; and the long-FAQ probe's
`:scope > .uno-json-accordion` selector missed the groups when an authored heading/lede puts them one container deeper, so it
selects descendants and asserts the group count explicitly.

## 5. Risks

1. **Group-level surface, not section-level.** Heading and lede are not surfaced, and a 9–24-item FAQ surfaces each consecutive
   group, so a long list shows grouped surfaced blocks. Both are the accepted adaptation of the eight-panel bound and are
   recorded in the ledger and here.
2. **`plain` equals absent by convention.** The three authorable values are pairwise distinct (`plain` vs `muted`, `plain` vs
   `bordered`, `muted` vs `bordered`), and `plain` is deliberately identical to no surface, matching every other Uno module.
3. **Presentation is viewport-scheme dependent by design.** The proof compares computed values *within* each scheme (light and
   dark), because the tokens differ between them; it does not claim identical pixel values across schemes.
4. **B2 stays Open.** `quote` and `faq` are credited at checkpoint-free interim rows (`10/17` / `52/59`); B2 also requires
   `columns` and is deliberately not asserted.

## 6. Disposition

`U04` remains **OPEN**; ten of seventeen families are parity-evidenced, seven remain bounded, and B1 remains the earned row.
The FAQ surface now has functional, computed presentation evidence in both schemes at both viewports, its long-list coverage is
proven on a served 24-item Page, and every prior credit and regression is intact. Stopping for independent Architect review.


## 7. Hosted verification at the exact product head

Product commit `3667b8a417e6cc402882fd68b686260a60ca2305` (`f673fe7..3667b8a`), one non-force push to Uno `main`.

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45579832544](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45579832544) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |
| `Uno Bootstrap Verify` | [45579832620](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45579832620) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success |

Both workflows ran at this exact head on both operating systems, including the frozen-governance positive/refusal check, the
bootstrap and architecture gates, the unit suite, the production build, the mutation-sensitive P6 contract, the A1 slice, the
22-module hermetic guard and the real production HTTP/Chromium consent run that carries the new computed-surface evidence — so
the surface presentation, the long-FAQ coverage and every retained credit are proven on Linux and Windows, not only locally.

