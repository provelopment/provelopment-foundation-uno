# Execution Report — UNO-WO-120 / R02

**Outcome: COMPLETE — the five corrections R02 authorized are implemented and executed. `PARITY_MEDIA=PASS`, `U04_PARITY=12/17`,
`U04_PROXY=54/59`; all eleven prior credits are preserved, **B2** stays earned at exactly `11/17` / `53/59`, the owned-asset
protections are unchanged, and every mandatory local and exact-head hosted gate is green. C1 and U04 remain OPEN.**

| | |
| --- | --- |
| Order | `UNO-WO-120 / R02`, `FINAL — EXECUTE` (supersedes R01) |
| ACTIVE | **4,914 bytes**, SHA-256 `d74d370c240cc06b9da137c85da075379b0633a72fc436b801202088cabc046b` — matched the activation exactly; private, ignored, absent from the tree |
| Start SHA | `3572eb8c7c5ca0df1231c909ad5e6b5eec3dc8fc` (`HEAD` = `main` = `origin/main` = `ls-remote`; one worktree; one Uno `origin`; clean tree) |
| Product head | `94fdabac4a72640500d1b1a2da690094aeb9ca3d` (`3572eb8..94fdaba`, one non-force push) |
| Oracle | **unchanged** `scripts/verify-u04-family-closure.mjs` — twelve families at **12/17** / **54/59**, selector `B2` still exactly **11/17** / **53/59** |

## 1. The five corrections, each executed

**(1) The donor's optional boolean is adopted as the donor declares it.** `decorative` may be absent, `false` or `true`. A
`true` flag may now **omit** `alt`, and the accepted node is normalized to the native empty alternative; R01's explicit
`alt: ""` form still composes. A non-boolean flag, a nonempty `alt` beside `true`, and an absent **or** empty `alt` without
`true` all still refuse the target. The described alt keeps its 320-code-point bound (the donor's 400 is documented, not
adopted).

**(2) Every donor-supported caption is representable through 4,000, including unformatted text.** A caption above the native
bound is declared through the **accepted Markdown-capable form** — no padding, no wrapping, no inserted emphasis: the composed
`caption` is the authored string byte for byte. Measured: unformatted 321 and 4,000 compose with `markdown: true`; 4,001 refuses;
an unflagged 320-point caption composes byte-identically to before; the native 320 bound and every unrelated caption limit are
untouched.

**(3) One shared Unicode decision covers both native caption forms.** A lone high surrogate, a lone low surrogate and a reversed
pair refuse in the plain **and** the declared form; a valid supplementary pair still counts once and is accepted in both; the
existing newline and unsafe-text policies are unchanged. The decision is confined to the native `media.image` caption — no other
plain field, gallery/carousel item or video caption was hardened.

**(4) A textless position is accepted.** `position: "start"`/`"end"` with no `heading` and no `lede` composes a
`layout.stack` carrying the position and **one** child — the figure — with no invented heading, no invented text, no duplicate
image and no new module. The stylesheet keeps the donor's placement: at a wide viewport the single figure keeps its own track
(`start` first, `end` second) and below `64rem` it stays one full-width column in authored order.

**(5) `plain` is proven authored, not inferred.** R01 compared `plain` with `absent` using two variants that both authored **no**
surface. One served variant now authors `surface: "plain"` and another authors none, so the closed literal is compared with the
donor's own absence: the authored node carries `data-uno-surface="plain"` while the bare one carries no attribute at all, and both
compute to `rgba(0, 0, 0, 0)` with no border and no padding.

## 2. Authorized ledger (12 modified; no other path touched)

`src/core/page-document.ts` · `src/application/compose-uno-foundation-families.ts` · `src/app/globals.css` ·
`scripts/u04/family-fixture.mjs` · `scripts/u04/media-evidence.mjs` · `scripts/verify-u04-22-module-consent.mjs` ·
`tests/unit/page-document.test.ts` · `tests/unit/uno-foundation-families.test.ts` · `tests/unit/uno-page-sections.test.ts` ·
`tests/unit/u04-verification-modules.test.mjs` · `tests/deployment/u04-22-module-consent.test.mjs` ·
`.documents/Architecture/u04-family-parity.md`, plus this single overwrite of `.documents/Reports/execution-report.md`.
`src/components/uno-page-sections.tsx` was authorized but needed no change: the position attribute and the Markdown caption were
already rendered, so the round is purely additive on the composition and style side.

Frozen governance, the closure oracle, workflows, dependencies, durable Pages and declarations, the owned-media policy,
publication authority, providers and sibling repositories were read-only and are unchanged.

## 3. What R01 got wrong, recorded rather than hidden

Four of the five corrections are corrections of R01's own record, so they are stated as such: R01 refused a position without
authored text although the donor accepts one; it required `alt` beside `decorative` although the donor's boolean makes it
optional; it left unformatted captions above 320 unrepresentable although the donor's field reaches 4,000; it applied the
well-formedness decision to the declared caption only; and it claimed a `plain`-versus-absent surface comparison from two
variants that both authored no surface. Each is now executed, and the evidence that would have caught them is part of the gate.

## 4. Seven dimensions, as executed

| Dimension | Evidence (all executed this run) |
| --- | --- |
| `source` | the real adapter composes the rich section as `layout.stack {position:"start", surface:"muted"}` with the figure first; `end` reverses the children and keeps a plain caption plain; the decorative variant — whose fixture **omits `alt`** — composes `alt: ""` with `decorative: true` and the authored `surface:"plain"`; both textless positions compose one child (`family-0-media-figure`) under the position, with no text node; the bare section stays one `media.image` at the anchor, byte-identical |
| `reader` | the composed Page round-trips; the unflagged caption accepts 320 and refuses 321, while the declared form accepts 321 and 4,000 and refuses 4,001; an unformatted 400-character caption composes with `markdown: true` and its exact authored text; lone high/low surrogates refuse in **both** forms and a supplementary pair is accepted in both; `decorative: false` composes beside a description, `{decorative: true}` alone normalizes to `alt: ""`, and contradictory or missing forms refuse |
| `renderer` | the served region is one positioned, surfaced stack whose figure owns its image **and** its `figcaption`; the caption renders from the shared AST (`<strong class="uno-family-md-strong">owned</strong>`, `<a class="uno-family-md-link" href="https://example.org/media-notes">`), never raw syntax; the decorative figure is `<img alt="">` with no `aria-label` and no `title`; a textless positioned stack renders exactly one figure and no heading or prose element |
| `http` | the committed Page's own locator answers `200 image/png` with bytes equal to the generated 64×64 plate (`IHDR` 64×64); the temporary page additionally serves the authored `data-uno-surface="plain"`, the normalized `alt=""`, both textless positions with one `<img>` each and no `h2`/`uno-json-prose`, and the byte-identical bare figure |
| `browser` | four cases — `light:390`, `light:1280`, `dark:390` (reduced motion), `dark:1280` (reduced motion) — each measuring **six** variants. 1280: rich tracks `[246,246]` at lefts `[380,646]`, `end` `[245,245]` at `[381,646]`, the authored-plain decorative stack `[552,552,552]` at `[360,360,360]`, bare `[552]` at `[360]`, **textless start `[266]` at `[360]`** and **textless end `[266]` at `[646]`** (content edge 360 + one 266 track + the 20 px gap). 390: every variant one column (`[310,310]`, `[308,308]`, `[350,…]`) in authored order, textless ones flush at the content edge. Images all loaded `64×64`; surfaces `muted` `rgb(245,247,251)` / `muted` dark `rgb(20,27,36)`, `bordered` `rgb(255,255,255)` / `rgb(12,17,24)` with a 1 px border and token padding, authored `plain` and absent both `rgba(0,0,0,0)` with no border and no padding; **6 real Tab presses** reach `A[https://example.org/media-notes]`, focus leaves again, the URL is unchanged, **0** foreign requests, **0** console/page errors |
| `refusal` | **fourteen** closed probes, each refusing the whole Page with its own literal reason and no document: unbound source, remote URL source, decorative with a nonempty alt, empty alt without the flag, missing alt without the flag, non-boolean decorative value, malformed Unicode plain caption, malformed Unicode Markdown caption, unsafe Markdown destination, malformed Markdown, caption beyond 4,000, unknown position, unknown surface, unknown image field |
| `rights` | the served region renders no donor identity, no storage path, no remote host, no provider, no `url(`/`@font-face`/frame; every `src` matches this Page's own `/uno-media/<locale>/wo066-family-composition/<n>` route |

## 5. Restore and regression proof

Both temporary fixture transactions re-request the Page after the restore and assert a **fresh** served original in addition to
the byte digest: `FAMILY_MEDIA_RESTORE` and `FAMILY_COLUMNS_RESTORE` both PASS — the committed Page, its committed region and
none of the temporary variant anchors. The committed fixture, the durable Components Page, the twenty-two module ids (22/22),
the four owned zones (4/4), the sixteen-cell browser matrix (16/16), the P6 declaration phases and the 179-check multi-Site gate
are unchanged and green.


## 6. Local verification (sequential, final head)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | exit 0 / exit 0 |
| `pnpm test` | **1,397 / 1,397**, 35 files |
| `node scripts/verify-governance-docs.mjs` | **PASS** — frozen bytes unchanged |
| `pnpm test:bootstrap` | **21 / 0** |
| `pnpm test:architecture` | **47 / 0** |
| `node --test tests/deployment` | **346 / 0** — including the four new R02 mutation shapes |
| `pnpm build` | **exit 0** — `Compiled successfully` |
| `node scripts/verify-u04-22-module-consent.mjs` | **913 passed / 0 failed** — `PARITY_MEDIA=PASS`, `U04_PARITY=12/17`, `U04_PROXY=54/59`, B2 still `11/17` / `53/59`, `22/22` modules, `4/4` zones, `16/16` browser matrix, `63/63` rich-family dimensions, fourteen refusals |
| `node scripts/verify-u03-multisite-http.mjs` | **179 passed / 0 failed** — both P6 declaration phases byte-exact |

The new coverage is mutation-sensitive in both directions: `tests/deployment/u04-22-module-consent.test.mjs` adds four shapes
that must each fail the audit when the declared unformatted caption, the shared Unicode decision, the normalized optional
alternative or the textless served shape is removed, and `tests/unit/u04-verification-modules.test.mjs` adds three suites that
refuse a textless variant which loses its track or placement or gains invented text, an authored `plain` that was never
authored, and a decorative image whose omitted alternative was not normalized.

## 7. Hosted verification at the exact product head

Both workflows ran at `94fdabac4a72640500d1b1a2da690094aeb9ca3d` on both operating systems:

| Workflow | Run | Jobs |
| --- | --- | --- |
| `Verify U01 baseline` | [45630730286](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45630730286) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 38/38 steps each: governance bytes, dependency and brand contracts, **Unit tests**, the U04 JSON-slice hermetic contract, the production build and bounded output tracing, the multi-Site P6 contract, the three-Site P6 HTTP/Chromium run, the A1 slice, the 22-module hermetic guard, the **22-module production HTTP/Chromium consent run** carrying the six-variant Media evidence, and deployment readiness |
| `Uno Bootstrap Verify` | [45630730558](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/45630730558) | `verify (ubuntu-24.04)` success, `verify (windows-2025)` success — 10/10 steps each |

## 8. Risks and limits

1. **Alt bound.** Uno keeps 320 code points where the donor allows 400; a longer donor description refuses the Page and no other
   media contract was widened.
2. **Long captions are declared, not detected.** An unformatted caption above 320 is representable because the adapter declares
   the Markdown-capable form; the plain form's own 320 bound is unchanged, so a hand-authored native node must make the same
   declaration.
3. **The decorative omission is one-way.** `alt` is optional only beside the literal `true`; an absent `alt` without it refuses
   rather than being read as decorative, and a nonempty `alt` beside it is a contradiction.
4. **Caption Unicode scope.** The shared well-formedness decision is applied to the native `media.image` caption only; gallery,
   carousel and video captions keep exactly the acceptance they had, so a lone surrogate there is unchanged behaviour and not
   covered by this order.
5. **Textless placement is CSS-scoped.** The second-track placement is a `:only-child` rule inside the wide-viewport media query,
   so a positioned stack that later gains a second child is unaffected by it; the browser evidence measures both textless cases
   in all four cases rather than inferring them.
6. **Lazy images are visited.** Every variant is scrolled into view and its own `load` awaited before measuring, so an off-screen
   figure is never reported as loaded.
7. **Checkpoints.** `B2` is earned and unchanged at `11/17` / `53/59`; the twelve-family `12/17` / `54/59` row is checkpoint-free
   and `C1` is **not** claimed because `gallery` remains bounded. No stage closure, release or deployment follows.

## 9. Disposition

Twelve of seventeen families are parity-evidenced with executed seven-dimension evidence; the five R02 corrections are each
executed and mutation-guarded; the fourteen refusal probes are closed; the browser dimension is a six-variant, four-case
conjunction; and both temporary transactions prove a fresh served original. Stopping for independent Architect review.

