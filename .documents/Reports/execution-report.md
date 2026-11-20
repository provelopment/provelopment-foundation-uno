# Execution Report — UNO-WO-063 / R01

**Status: DELIVERED — the fifteenth bounded source mapping and the ledger correction are published. U04 remains OPEN.**
**Accounting: 15/17 bounded source-family mappings, 2 entirely unimplemented (`gallery`, `contactForm`), 0/17 full semantic parity.**

## 1. Authority and observed start state

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-063 / R01`, EDITION FINAL — EXECUTE, with the Owner-approved explicit image-binding argument |
| ACTIVE | `.documents/WIP/workorder-active.md` — **35,162 bytes**, SHA-256 `60c3c8d80e6a100a3e544a68d5d2e20c202aece2296d6621836c4908a5edc6cc`, ignored, untracked, unstaged, in its one private WIP slot |
| Required start | `645602abc8c921545e312702947fece905eff5a1` — matched on `HEAD`, local `main`, `origin/main` and `git ls-remote` |
| Start blobs | A01 `03747bf5e3a647c04d41f6184dde2e234d41003e`, A02 `a40e426f4b6c94c75b6a0abc2e55d0f89cd2d707`, A03 `125cc714bad8a264da472a13527aa0249c174f18` — all matched, so no Owner work was overwritten |
| Physical/Git | one checkout, **1** worktree, **1** branch (`main`), **1** remote `origin` → `provelopment/provelopment-foundation-uno` only, **0** stashes, empty index and clean status before the first write |
| Declarations | `efs/manifest.json` `ba232d46…e3f0`, `uno.config.json` `4f656c93…9a0c` — byte-identical before and after every stateful suite and on handback |
| Toolchain | Node 26.x, pnpm 11.6.0, Next 16.4.6, React 19.2.9, Playwright 1.65.1 from the repository; nothing installed, no lockfile edit |

## 2. Published product — one complete commit, audited before push

| Commit | Contents |
| --- | --- |
| **`535c55965c3b6383b19bbbf4bd6995b58f44287d`** `feat(u04): compose explicitly bound donor media subset` | A01 `c09b2f3351d9946cde27143552fc50fa38f27ee5`, A02 `768fa043b0ba3bfb04acdd6b5c525dac0b28923e`, A03 `6ac7979b5f6989398780bc3406cf0377a4bdc05d` |

Gate order actually used: unstaged `git diff --check` exit 0 with no output → only A01–A03 staged by literal path
(never `.`) → staged name-status exactly three `M`, strict set compare → **index-byte audit** (A01: `case "media"`,
the 15-name frozen tuple, `bindings?: unknown`, `readUnoOwnedAssetRef`; A02: `MAPPED_15` and the binding tests; A03:
exactly one `UNIMPLEMENTED (2)`, no stale unimplemented-3 count, no old thirteen-line wording, one `fifteen bounded`, one
`media` row, no parity-marker assertion) → commit → **committed-tree audit** (exactly three `M`) → `git show HEAD:<ledger>`
re-checked → clean status → focused A02 and architecture re-run at HEAD → one ordinary non-force push. No amendment and
no corrective product push were used.

## 3. The fifteenth mapping and the binding

| Family | Accepted subset | Composed Uno structure |
| --- | --- | --- |
| **`media`** (index 14) | `type`, required `image{src,alt}`, optional plain `caption`; donor `src` must be a literal `/assets/` prefix plus a path the local owned-media policy accepts with a lowercase `png`/`jpg`/`jpeg`/`webp`/`avif` extension; `alt` nonblank, ≤320 code points, safe plain text | `media.image {asset, alt, caption?}` where `asset` is the owned ref taken from the caller's explicit binding |

`composeUnoFoundationSubset(input, bindings?)` keeps the one-argument API and every one of the fourteen earlier outputs
byte-identical. The binder is separately untrusted: it is snapshotted with its own fresh budget and cycle set before any
donor section is read. It must be exactly `{images:[{source,owned}]}` with 1–8 dense entries, unique valid donor
identities, and each `owned` value validated by the unchanged `readUnoOwnedAssetRef(…, "image")` policy **before a
candidate exists**. Only the accepted `ref` becomes `props.asset`. A present binder whose source set is not exactly the
set of donor sources the document consumed refuses, so missing, extra, duplicate and unused authority all fail closed.

Happy path: one node `family-14-media`, props exactly
`{asset:{zone:"page",path:"images/portrait.png"}, alt:"Author-described portrait", caption:"Author caption"}` — no donor
`src`, no `decorative`, no invented caption, no external URL. Generated refs carry the supplied lowercase 64-hex digest
unchanged; `theme` and `platform` remain ordinary digest-free zones; the four zones and the 22-module registry are
untouched. Deep freeze, caller-input immutability and object/JSON re-acceptance all hold.

## 4. Tests — 101 focused cases (88 retained, 13 added)

Retained unchanged in intent: all earlier family, markup, refusal, determinism, ledger and zero-getter cases. Added: the
fifteen-name frozen tuple; fifteen-node composition with first-fourteen byte identity; exact media props with and without
a caption; donor path absence and no invented `decorative`; generated/theme/platform refs; repeated-source sharing versus
distinct sources; input/binder immutability plus freeze and round-trip; real `<figure class="uno-json-media" id="…">` +
`<img>` + `<figcaption>` markup from a synthetic server projection with no donor path as `src`; the same document rendered
**without** a projection producing no figure, no image and no donor path; binding refusals; source identity refusals;
donor-shape and target refusals; and five hostile accessors with a getter counter of exactly **0**.

| Input | Reason |
| --- | --- |
| missing binding; binder on a no-media Page; extra unused source; duplicate source; wrong source; extra binder/entry keys; non-array images; donor `heading`/`lede`/`position`/`surface`/`decorative`/`href`/`width`; missing `src`/`alt`; non-string values; Markdown alt or caption; external, protocol-relative, traversal, percent-encoded, backslash, query/fragment, SVG, uppercase-extension, device-name or non-`/assets/` sources | `family:unsupported-feature` |
| empty or 9-entry binding; unknown zone; unsafe or absolute owned path; `.svg`/`.mp4` owned paths; missing/uppercase/wrong generated digest; digest on a non-generated zone; empty, whitespace, 321-code-point or script-like alt; whitespace, 321-code-point or script-like caption; candidate above 64 KiB | `family:target-refused` |
| `image.src`, `image.alt`, `binding.source`, `binding.owned` and nested `owned.zone` accessors (counter 0); sparse binder array; valid prose followed by hostile media | `family:unsafe-source` |
| `gallery`, `contactForm`, unknown `heading` | `family:unsupported-family` |

The synthetic projection is local test-only data. No test claims a downloaded image, owned bytes, rights, HTTP 200 or
decoding, and the adapter itself publishes no Page.



## 5. Ledger correction

A03 now states **fifteen** composed shapes, **These fifteen mappings**, **fifteen bounded mappings implemented**, **two
donor families entirely unimplemented** and exactly one line
**UNIMPLEMENTED (2):** `gallery`, `contactForm`. It adds one `media` row with disposition
`COMPOSE (explicit owned-image binding subset)` citing the donor `a12d964c…`, `e3f3a12e…`, `19c9bee3…` evidence and the
local `f988a0e5…` owned-media policy, plus a "Deliberately absent donor design (media and its binding)" paragraph that
records the refused donor decorative form, heading/lede/position/surface, remote sources and Markdown captions, and that
the binding grants no filesystem, licence, rights, availability or publication authority. Zero of seventeen full
semantic parity; no full-parity marker of any kind; the previous contradictory old-count sentence is gone and
the guard fails if it or any stale count returns.

## 6. Local battery — sequential, green on the final bytes

`pnpm test` **1,019 passed / 30 files** (focused **101**); architecture **46/46**; typecheck 0; `eslint . --max-warnings 0`
0; bootstrap OK; governance test and CLI pass; the seven deployment unit suites pass; readiness **PASS**
(`VERCEL_NOT_DEPLOYED_BY_AGENT`); security **ACCEPTED** (zero waivers, zero HIGH/critical); U03 published HTTP **542/0**;
U04 JSON slice **464/0**; U04 22-module runner **565/0** with `FOUR_ZONE_HTTP=4/4`,
`NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER`, `BROWSER_MATRIX=16/16` (16 distinct case ids), fixture teardown, *nothing staged*
by the gate; `pnpm build` 0; U03 trace `--expect committed` OK; `pnpm test:http` **103/0**; `verify-u03-http` **91/0**
with the committed unpublished `/en` still a real 404. Fixture suites ran strictly **one at a time**; both diff checks
exited 0 with no output. Media HTTP/browser proof for the new adapter is **NOT APPLICABLE**: a pure translator publishes
no Page and no asset bytes were created.

## 7. Hosted CI at the product head

`535c55965c3b6383b19bbbf4bd6995b58f44287d`: `Uno Bootstrap Verify` run `44833265692` — `verify (ubuntu-24.04)`
**success**, `verify (windows-2025)` **success**; `Verify U01 baseline` run `44833265813` — `verify (windows-2025)`
**success**, `verify (ubuntu-24.04)` **success**. No failed, muted or skipped step.

## 8. Source rights and outstanding obligations

Donor read-only at `provelopment/provelopment-foundation` @ `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, Apache-2.0
(`LICENSE` `d645695673349e3947e8e5ae42332d0ac3164cd7`). Verified donor blobs: `src/core/page-document.ts`
`a12d964c…`, `media-sections.tsx` `e3f3a12e…`, `section-support.tsx` `19c9bee3…`. Concepts and native semantics only;
no donor source, JSX, CSS, fonts, images, trademark, Connect code or packages copied, and no donor `/assets/` path was
treated as an existing Uno-owned asset. The local `src/core/assets/uno-owned-media.ts` policy was reused unchanged and
its decisive caveat respected: a valid ref is not ownership, rights, availability or publication. Test images are
synthetic names with mock projections. The transitive picomatch GHSA remains disclosed, not fixed or waived.

`gallery` and `contactForm` remain entirely unimplemented, together with full donor media semantics, real asset bytes,
a composition Page, published family HTTP/browser proof and the installation shell. **U04 stays OPEN**: no stage
closure, merge, tag, release, manual deployment, provider/secret change or 23rd module occurred, and no full-family-parity
claim is made.

The report commit SHA and its own CI results cannot appear inside this file; both are returned in the handback message.
