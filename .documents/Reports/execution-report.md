# Execution Report — UNO-WO-095 / R01

**P4/P5 DELIVERED AND GREEN ON BOTH OPERATING SYSTEMS · P6 NOT DELIVERED.**

The host-qualified multi-Site runtime and the approved 404 refusal responder are committed, pushed and hosted-green at `7eb8f784e597783e9231dcad9939a4255130e719`. The three-Site G01–G05 production proof (P6) was **not** completed in this run; nothing was published for it and the product increment was preserved exactly as the activation directs.

## 1. Authority and preflight

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-095 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **23,671 bytes**, SHA-256 `f5abb168477572c4c43665363a5ec0eb549cfa85775abaf55e210f273742d485` — exact match |
| Start | `d3aeaa1a0552c025589c90bba748b0b9188b65e4` — `HEAD`, `main`, `origin/main` and remote `main` equal; clean tree |
| Physical | sole checkout (private path withheld), empty `--show-prefix`, one worktree, one `origin` |
| Preserved | A2 patch `5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87`, A2 file `1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f` — unchanged, unapplied |
| Declarations | `manifest.json` `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`, `uno.config.json` `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` — unchanged; no fixture transaction was armed |

## 2. The authorized architecture migration (§3.C)

Exactly the four named regions changed, with no test deleted or skipped and the total rising from 46 to 47:

1. The blanket substring ban on `host` in `src/config/uno-serving.ts` was replaced by the ordered intent: the composition may accept a plain **untrusted lookup key**, must still contain exactly one `process.cwd()`, and must still read no `process.env`, `headers(`, `cookies(`, `next/headers` or `x-forwarded`. A new assertion requires the request authority to be compared only for **exact equality** (`=== host`).
2. A **new** test, `only the thin request edge reads a request header`, requires the document layout to be the single raw-header reader and forbids `next/headers`, `headers()`, `cookies(`, `x-forwarded` and `request.headers` in every core, application, adapter and composition module.
3. The legacy route-path surfaces were replaced by the catch-all surfaces (`(site)/[...segments]/page.tsx`, `robots.txt`, `sitemap.xml`), still composition-only, still without direct file IO, environment, forwarded headers, cookies or provider calls. The document layout must derive `lang` from the accepted Page decision (`identity.localeTag`) and must contain no redirect, canonical, analytics or discovery authority. The demonstration and global-404 freeze checks are untouched, and the group now must carry `src/app/(site)/not-found.tsx`.
4. The single importer of `components/uno-page-sections` moved to `src/app/(site)/[...segments]/page.tsx`, keeping the exclusivity assertion.

`tests/deployment/u03-trace.test.mjs` was also updated (permitted as "equal/stronger coverage") because it pinned the old trace key; its expected key list is now `/[` plus `...segments]`. `scripts/verify-u03-trace.mjs` now admits the owned-media capsule prefix `deployment/efs/capsule/` that the composition legitimately traces, and keeps every existing bound: forbidden prefixes, forbidden files and the allowlist.

## 3. What was delivered

The runtime is one composition (`src/config/uno-serving.ts`) with a single validated authority. A version-2 declaration is validated **once** through `validateUnoSiteAddressConfig`; the legacy one-Site form is preserved exactly. The request authority is input only: lowercased, shape-checked (no scheme, credentials, path, space, bracket, empty label or double dot) and compared for exact equality against the origins the declaration already binds, so an unknown authority owns no binding and no default, entry position or forwarded header can select a Site. The matched `{facetId, siteId}` travels unchanged match → loader → planner, and the loader

The 404 defect that ended two earlier runs is fixed. `src/proxy.ts` answers **only** an address the same validated decision already refused, with the approved static document; it excludes `/`, the demonstration tree, `/_next`, owned media, the SEO endpoints, the icon and every file-extension asset twice — by matcher and by an internal guard. The App Router keeps its own refusal as defense in depth, at `src/app/(site)/[...segments]/not-found.tsx` and `src/app/(site)/not-found.tsx`, both re-exporting the one approved document. Measured on real `next build && next start`: an unknown address returns `404` with the approved heading, sentence and literal `href="/"`, no `__next_error__`, `text/html; charset=utf-8` and `no-store`; `/en-001` stays `200`; `/en` stays `307` to its canonical.

One deliberate correction during hosted verification: the responder first also sent `x-robots-tag: noindex, nofollow`, which the unchanged U03 gate reads as an index claim (its predicate matches the `index` substring inside `noindex`). The header was removed; the document keeps `<meta name="robots" content="noindex, nofollow">`, and the gate is green again at **135/135**. No assertion was altered to accommodate it.

## 4. Gates at `7eb8f784e597783e9231dcad9939a4255130e719`

| Gate | Result |
| --- | --- |
| `pnpm build` | pass (`ƒ Proxy (Middleware)` present) |
| `pnpm typecheck` | pass |
| `pnpm lint` / `eslint . --max-warnings 0` | pass |
| `pnpm test` (unit) | 31 files pass |
| `pnpm test:architecture` | **47 pass, 0 fail** |
| `pnpm test:bootstrap` | pass |
| `pnpm test:http` (U01) | **105 passed, 0 failed** |
| `scripts/verify-u03-http.mjs` | **135 passed, 0 failed** |
| `scripts/verify-u03-trace.mjs` | OK — only declared inputs and authored sources shipped |
| `tests/deployment/u03-trace` | 28 pass |
| `tests/deployment/u03-fixture-transaction` | 28 pass |
| `tests/deployment/u04-json-slice` | 14 pass |
| `tests/deployment/u04-22-module-consent` | 46 pass |
| `tests/deployment/verify-vercel-readiness` | 91 pass |
| Hosted `Verify U01 baseline` | **success** on `ubuntu-24.04` and `windows-2025` |
| Hosted `Uno Bootstrap Verify` | **success** |

## 5. P6 — not delivered

P6 is not done. The three-Site G01–G05 runner (`scripts/verify-u03-multisite-http.mjs`), its contract test and the two new blocking workflow steps do not exist, so the workflow file is untouched. The fixture design, the manifest/declaration shape, the refusal vocabulary and the Chromium approach were all established — including the finding that `visibility` is a **document** field (`{version, title, visibility, sections}`) and that a reserved Home can never be unlisted — but the runner itself was not completed and was therefore deleted rather than committed half-written. The architecture whitelist entry for it was reverted in the same change, so the published tree contains no reference to a script that does not exist.

Nothing in this run weakens a gate: the two edits outside `src/` were the Owner-authorized architecture migration (§2) and one legacy trace key plus one bounded trace allowlist entry, both required by the rename. Both declarations and both A2 artifacts are byte-identical at the end.

## 6. Next

A successor order needs only to complete P6: write the three-Site runner on the transaction helper with the three bindings (abc.example, abc.example/docs, xyz.example), a two-Facet manifest and the wo094-* sources; add the contract test; add the two blocking workflow steps; and re-add the runner to the architecture importer whitelist. The runtime it must exercise is already on main and green.
