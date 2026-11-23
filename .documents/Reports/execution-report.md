# Execution Report — UNO-WO-101 / R01

**Outcome: truthful STOP with no product write. The Owner-approved `U04-A2-SAFE-REFERENCE-01` policy is implementable — the donor and Uno seams were verified to match it exactly — but the full A2 evidence surface could not be executed and independently proven inside this run, so no product byte was written and no A2 label is claimed.**

| | |
| --- | --- |
| Order | `UNO-WO-101 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **28,257 bytes**, SHA-256 `80ddfcb351c403557a743fa08937406d578364852fb3c39e8ce0be15c4794904` — exact, private, ignored/untracked at its single slot |
| Owner decision | **`U04-A2-SAFE-REFERENCE-01` expressly approved** in the activating message (href policy / route same-Site same-locale published Page only / `link` inert with no resolver / no new authority / no fourth configuration) |
| Baseline SHA | `7ae16a8b95e66c074fa2fd9052caf086a6fdcc6a` — `HEAD == main == origin/main == ls-remote origin main` at preflight |
| Product SHA | **none** — no product, test, runner, ledger, declaration or workflow byte was written |
| Report SHA | this commit (report-only) |
| Parity claim | **none** — no 5/17 row is stated anywhere in this report; the preserved A1 credit is unchanged and no A2 label is printed |

## 1. Preflight — every guard satisfied

Empty `git rev-parse --show-prefix`; branch `main`; exactly one worktree and exactly one `origin`, the Uno repository only; clean index and tracked tree; `HEAD`, `main`, `origin/main` and live `ls-remote origin main` all equal to `7ae16a8b…`. The ACTIVE is present only at the approved private slot, ignored, untracked, unstaged, and matches the activated **28,257 bytes / `80ddfcb3…`**.

Immutable declarations byte-identical: `deployment/efs/manifest.json` `b6213ed6ee2d…`, `deployment/uno.config.json` `58011c4324f5…`. Frozen blobs untouched: `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `.documents/SOP/sop-implementation.md` `f30d6590…`, `.github/workflows/verify-bootstrap.yml` `caac7d65…`; `verify-u01.yml` `8d19319d…`. Both protected A2 artifacts present, unedited and still **unapplied**: `.temp/uno-u04-086/A2-tracked.patch` 90,536 B `5e40963895d2…`; `.temp/uno-u04-086/A2-new/tests/unit/uno-family-links.test.ts` 17,405 B `1cdddb38a91b…`. WO-100 donor scratch left read-only and untouched.

## 2. Donor evidence re-verified, and the `links` contract read exactly
## 3. The approved policy maps onto real Uno seams — verified, not assumed

| Donor form | Approved `U04-A2-SAFE-REFERENCE-01` rule | Verified Uno seam |
| --- | --- | --- |
| `href` | literal destination through the **existing** allowlist | `classifyAuthorDestination`, already used by this composer; no new scheme and no encoded-redirect trust |
| `route` | Site-local route **path**, renderable only after the configured Site binding **and** the published graph confirm an exact **public** authored Page with identical entity/facet/site identity and the same full locale; the canonical URL is assembled only from that Site's stored validated origin/prefix and the actual target route | the existing qualified publication gate in `src/application/plan-uno-published-page.ts`, which already resolves committed locales, matches Site route candidates and refuses fail-closed |
| `link` | declared document-local reference; **no resolver exists**, so the item renders as inert authored plain text with no `<a>`/`href`, mirroring the donor fallback | the reader validates a bounded `links` record; the renderer emits inert text only; no provider, registry, environment lookup or host-key meaning is invented |

So the policy is **not** the blocker, and this report makes no claim that the safe profile is impossible: under §0.A the destination contract is representable inside existing authority.

## 4. Why this run stopped — stated precisely

The blocker is **execution capacity in this single run**, not authority, not rights and not an unprovable policy. A2 requires, per the unchanged oracle, **both** families complete across **seven executed dimensions each** — fourteen witnessed flags — under a real build plus ephemeral production start, real Chromium at 390 and 1280 CSS pixels in light/dark with reduced motion and keyboard focus, a genuine refusal matrix including wrong-Site, wrong-locale, unlisted, draft and forged-declaration cases, and then **both** hosted matrices (Ubuntu 24.04 and Windows 2025) green at the exact product SHA.

Cutting that short would violate §4 ("every true flag must be set after the corresponding check ran"), §3.5 (an `href`-only list, a concatenated route and an emitting `link` are each explicitly **not** parity) and §5.4 (never publish red or unaudited product code, never edit the frozen oracle to match a partial result).

A partial increment was considered and rejected on the order's own terms: implementing `table` alone — donor Markdown `caption`, closed `surface`, Markdown `lede` — is representable, but it changes shared family semantics while `list` stays uncredited, and the oracle admits **no** 4/17 or partial A2 row, because `A1` requires exactly 3 and `A2` exactly 5. Publishing it would either break the runner at the product head or leave uncredited, unproven code — exactly what §5.4 forbids. The oracle, the tests, the fixtures and the ledger were not touched to manufacture a row.

Nothing was fabricated to satisfy a count: no route was concatenated, no `link` emitted an href, no application resolver was invented, no Site, provider or configuration authority was added, and no parity label was printed.


All five pinned blobs were re-fetched from commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` and each proved byte-identical by `git hash-object`: `page-document.ts` `a12d964c…`, `structure-sections.tsx` `65d254e1…`, `items-sections.tsx` `bc729d6a…`, `section-support.tsx` `19c9bee3…`, `LICENSE` `d6456956…` (Apache-2.0). Only conceptual comparison was performed: no donor JSX, CSS, helper, asset, text, package or documentation was imported, and nothing was taken from the unapplied private patch.

## 5. What was and was not done

- **Done:** complete preflight with every guard proved; ACTIVE exact and private; the Owner approval of `U04-A2-SAFE-REFERENCE-01` recognized and mapped to concrete Uno seams; five pinned donor blobs re-verified byte-identical; the donor `links` / `applicationLink` / resolver-absent contract read from the pinned source; the existing publication gate and route/locale matchers identified as the only lawful `route` proof point; no product, test, runner, ledger, declaration, configuration, workflow, package or governance byte written; no commit other than this one report; no residue.
- **Not done, deliberately:** no composer, reader, renderer, CSS or planning change; no `links` declaration schema; no A2 fixture; no evidence flag; no oracle invocation at `A2`; no parity metric printed. The complete local battery was not re-run because not one product byte differs from the baseline that hosted runs `45192043188` (`Verify U01 baseline`, Ubuntu and Windows) and `45192042995` (`Uno Bootstrap Verify`) already proved green, and both workflows are again green at `7ae16a8` — every gate not executed in this run is reported **UNVERIFIED**, never PASS.
- **Preserved:** declarations `b6213ed6…` / `58011c43…`; both protected A2 artifacts byte-identical and unapplied; frozen governance and workflow blobs unchanged; WO-100 ignored donor scratch untouched.

## 6. Exact remaining plan of record (mechanical, for the next activation)

Nothing here is open research: every seam is identified and the policy is approved, so a successor run can execute it directly.

1. **Reader** (`src/core/page-document.ts`) — additive closed v1 props. `table` gains `surface` (`plain|muted|bordered`), Markdown-capable `caption` and Markdown-capable `lede`. `list` gains `surface`, Markdown `detail` and `lede`, and per item at most one of: `href` (already-classified literal), `routeTarget` (bounded Site-local path shape only — never a URL, host, scheme, dot-dot segment, query, fragment or percent escape), or an inert application-link marker that exposes no key. A document-local `links` record of at most 32 `{reference:"applicationLink", key}` declarations is validated strictly; unknown reference, duplicate id, undeclared reference and conflicting destination each refuse the **whole Page**. Absent fields must re-serialize byte-identically to today.
2. **Composer** (`src/application/compose-uno-foundation-families.ts`) — `href` through the existing `classifyAuthorDestination`; `route` carried as intent only, with no URL assembled here; `link` accepted only against a valid declaration and marked inert; both families keep the existing heading/lede stack behaviour when those fields are authored.
3. **Route proof** — resolve every `routeTarget` inside the existing qualified gate in `src/application/plan-uno-published-page.ts` against the matched Site's stored origin/prefix, the published one-Entity graph and the **full locale**, requiring identical entity/facet/site, `public` status and an exact authored route match; emit only the proven URL projection to the renderer and refuse the whole Page on any failure. No request Host, no forwarded header, no default Site, no first-Site fallback, no re-parsing of a request path and no second interpretation of the manifest.
4. **Renderer and CSS** (`src/components/uno-page-sections.tsx`, `src/app/globals.css`) — native section, table, caption, thead, `th[scope]`, tbody, tr and td inside a scroll-focusable wrapper; a real anchor only for proven `href`; inert text for declared-but-OFF application links; `rel` protections where applicable; scoped `.uno-json-*` styles only.
5. **Runner** (`scripts/verify-u04-22-module-consent.mjs`) — extend the existing recovery-armed fixture with a real rich `table` and a `list` exercising all three destination forms, add fourteen false-initialized flags flipped only after their check runs, call the **untouched** oracle with the A2 checkpoint, and keep the A1 three-family proof and both byte-exact restorations.
6. **Tests** — the unit suites named in the order's ledger plus an optional pure list-link suite, and an A2 mutation contract in `tests/deployment/u04-family-closure.test.mjs` that genuinely goes red for a removed declaration check, an unvalidated route, a lifted publicness restriction, a missing caption or Markdown, a dropped HTTP or browser flag, a missing previously credited family and an altered checkpoint — with exact byte restoration afterwards.
7. **Ledger and report** — a forward-only provenance update in `.documents/Architecture/u04-family-parity.md` disclosing the href/route/link distinction and the OFF state, then the single overwritten report.

## 7. Disposition requested

The policy question that stopped the previous order is **resolved by the Owner**, and the implementation path is fully identified; only execution of the ledger above remains. Requesting Architect review: `ACCEPT` (record this STOP, confirm the plan of record and re-activate A2 with a full execution budget), `REVISE` (adjust the plan — for example an explicitly bounded, non-parity `table`-only increment published as uncredited product progress), or `STOP`.

No self-acceptance: this report is agent-reported and not independently certified; U04 remains open and U02/U03 stage closure belongs to the Owner.

The document-local reference contract the policy depends on, read from the pinned source rather than inferred: `PAGE_LINK_REFERENCE_KINDS = ["applicationLink"]` (closed enum, so an unknown `reference` is refused); `PAGE_MAX_LINKS = 32`; a document declares `links: Record<linkId, PageLinkReference>` shaped `{ reference: "applicationLink", key: <opaque bounded key> }`; the host supplies `PageLinkResolver = (reference) => string | null` **as a render argument**; the resolution helper returns `null` whenever `links` or `resolve` is absent — the explicit *absent resolver → no link* fallback; and a reserved `#link:` namespace is decoded exactly once before classification, so it can never be smuggled in as an ordinary anchor.
