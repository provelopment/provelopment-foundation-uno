# Execution report — UNO-WO-038 / R03

**Order:** UNO-WO-038 / R03 — FINAL — EXECUTE. One bounded recovery of the stopped U04 module increment plus the
Owner-approved dependency-security remediation and one named, expiring development-only advisory exception.
**Stage:** U04 **OPEN**. This order does not close the stage.
**Starting HEAD = local `main` = `origin/main` = GitHub REST:** `9c578a50e58eb71e257285d083b3b18b61f4eafb`.
**Product commit:** `81bb3134c23672b9dae189a62b0123f4a21bcfc3` (sole parent `9c578a50e`, 21 files).
**Report commit:** this commit, the sole child of the product commit; its diff contains only this file.

## 1. What this increment delivers

Commit-backed renderability moves from **8/22 to 11/22** approved A1 module IDs. `layout.bento`, `content.pricing`
and `content.timeline` are now implemented, typed, tested and served by the real production build. The other
eleven approved IDs still refuse as `document:renderer-unavailable`; an unknown ID still refuses as
`document:unknown-module`. Exactly **22** immutable capability IDs remain; **17-family Option A composition remains
0/17** and is not claimed.

Alongside the modules, the authorised dependency-security migration lands: `next` `16.4.2` → **`16.4.6`**, removal of
the vulnerable `eslint-config-next` resolver chain, and reconstitution of its effective lint ruleset from direct
pinned plugins at measured parity. One advisory that cannot be repaired because no fixed release exists is carried
as a **single named, development-only, expiring exception** — never as a claim of zero.

## 2. The twenty-one-path product ledger

| # | Path | Operation | Result |
|---|---|---|---|
| 1 | `src/core/page-document.ts` | EDIT | 11-ID tuple, typed bento/pricing/timeline alternatives, three validator branches, three item readers, code-point counting with no unused binding |
| 2 | `src/components/uno-page-sections.tsx` | EDIT | Three exhaustive server cases; no client code, no raw HTML |
| 3 | `src/app/globals.css` | EDIT | Scoped `.uno-json-bento/-pricing/-timeline` rules from existing tokens; 320/390/768/1280 reflow, dark mode, reduced motion |
| 4 | `tests/unit/page-document.test.ts` | EDIT | Eleven-ID contract, deep freeze, code-point semantics, unique per-module refusals |
| 5 | `tests/unit/uno-page-sections.test.ts` | EDIT | Semantic DOM, inert authored facts, single `h1`/`main`, invalid-document refusal |
| 6 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | Next pin updated; new gate rejecting `eslint-config-next`, the resolver chain and direct graph masking |
| 7 | `scripts/verify-u04-json-slice.mjs` | EDIT | 308 prior checks preserved + 156 added = **464**, nine new negative Pages, byte-exact restoration |
| 8 | `tests/deployment/u04-json-slice.test.mjs` | EDIT | 12 hermetic guards retained and strengthened |
| 9 | `.documents/Architecture/source-inventory.md` | EDIT | Foundation decision/rights table, 11/22 and 0/17 truth, dependency provenance, exception protocol |
| 10 | `.documents/WIP/plan-roadmap.md` | EDIT | Truthful 11/22 checkpoint; no stage closure |
| 11 | `.documents/WIP/plan-next.md` | OVERWRITE | One forward-looking U04 handoff plus the security follow-up |
| 12 | `package.json` | EDIT | `next@16.4.6`; `eslint-config-next` dropped; nine exact direct lint pins added |
| 13 | `pnpm-lock.yaml` | REGENERATE | pnpm 11.6.0, deterministic; resolver chain eliminated |
| 14 | `eslint.config.mjs` | EDIT | Direct-plugin flat config at measured parity |
| 15 | `scripts/verify-vercel-readiness.mjs` | EDIT | Next pin `16.4.6`; three new blocking workflow requirements |
| 16 | `tests/deployment/verify-vercel-readiness.test.mjs` | EDIT | 86 → **88** checks; old-pin and dropped-guard negatives |
| 17 | `tests/deployment/node26-security-floor.test.mjs` | EDIT | 22 → **30** checks; exception, lock and masking assertions |
| 18 | `.github/workflows/verify-u01.yml` | EDIT | Three blocking steps added **before** the unchanged full audit |
| 19 | `pnpm-workspace.yaml` | CREATE | One root package; exactly one `auditConfig.ignoreGhsas` entry |
| 20 | `scripts/verify-u04-security-exception.mjs` | CREATE | Pure-Node expiry, isolation, unfiltered/production/registry guard |
| 21 | `tests/deployment/u04-security-exception.test.mjs` | CREATE | 26 deterministic positive and mutation-negative cases |

**Attribution.** Paths 1–8 are the eight modifications inherited from the stopped predecessor, verified byte-for-byte
against their recorded working hashes and against the order's own contracts before adoption; they are Owner-approved
inherited work, not a new Git base. Paths 9–21 are this order's work. No other path was written, deleted or renamed.

## 3. Dependency security: before, after, and the one exception

**Exact pins.** Node **26** (`engines: 26.x`, asserted at runtime in CI), pnpm **11.6.0** (from `packageManager`),
React/ReactDOM **19.2.9**, Playwright **1.65.1**, TypeScript **5.9.3**, ESLint **9.39.5**, `@vercel/analytics`
**2.0.1**, `next` **16.4.6**, `@next/eslint-plugin-next` **16.4.6**, `typescript-eslint` **8.72.2**,
`@typescript-eslint/parser` **8.72.2**, `eslint-plugin-react` **7.37.5**, `eslint-plugin-react-hooks` **7.1.1**,
`eslint-plugin-jsx-a11y` **6.10.2**, `eslint-plugin-import` **2.32.0**, `eslint-import-resolver-node` **0.3.10**,
`globals` **16.4.0**. No ranged pin, no postinstall, no provider or SDK addition.

**Graph change.** The removed route was `eslint-config-next → eslint-import-resolver-typescript → tinyglobby → fdir
→ picomatch@4.0.7`. After regeneration `pnpm why eslint-import-resolver-typescript` resolves nothing and the
lockfile carries no `eslint-config-next` entry. What legitimately remains is development-only `picomatch@2.3.2`
(via `@next/eslint-plugin-next → fast-glob → micromatch`) and `picomatch@4.0.7` (via `typescript-eslint`,
`eslint-plugin-import` and the preserved `vite`/`vitest`). Neither is reachable from `dependencies`.

**Lint parity, measured not asserted.** `eslint --print-config` was captured for a `.ts` core file, a `.tsx`
component and an `.mjs` gate *before* any dependency change, and re-captured afterwards.

| Selection | Before | After | Missing | Demoted | Added |
|---|---|---|---|---|---|
| `src/core/page-document.ts` (`.ts`) | 86 | 89 | **0** | **0** | 3 |
| `src/components/uno-page-sections.tsx` (`.tsx`) | 86 | 89 | **0** | **0** | 3 |
| `scripts/verify-u04-json-slice.mjs` (`.mjs`) | 82 | 85 | **0** | **0** | 3 |

The three additions are `react/jsx-no-target-blank`, `react/no-unknown-property` and `react/prop-types` — strictly
stronger than the inherited preset. The obsolete `react/react-in-jsx-scope` rule, which the inherited preset never
enabled and which cannot hold under the automatic JSX runtime, is explicitly off; that is parity restoration, not a
demotion. Every previously active Next core-web-vitals, React, React-hooks, TypeScript, JSX-a11y and import rule
remains active at equal or higher severity. `pnpm lint` and `pnpm exec eslint . --max-warnings 0` both exit zero
with zero warnings; no rule was suppressed and no authored path was ignored.

**The exception.** `GHSA-fc5q-39xc-vjpf` (high, `picomatch` ReDoS via single-branch repeated extglobs) affects
**every published release**: the registry's newest version is `4.0.7`, `4.0.8` is not published, and the advisory
lists no patched version. No dependency arrangement can repair it, and the only alternatives were to fabricate a
version, remove the mandated lint/test toolchain, or record a named, expiring, independently verifiable exception.
The Owner authorised the third, expiring **`2026-12-18T00:00:00Z` (exclusive)**.

It is declared once, in `pnpm-workspace.yaml`, using the pnpm 11.6.0 `auditConfig.ignoreGhsas` key, with
`packages: ["."]` keeping Uno a single root package. The comment enforces nothing; `scripts/verify-u04-security-exception.mjs`
enforces the expiry against the system UTC clock with no environment override, and refuses an expired date, a second
or substituted identifier, a forbidden alternative ignore key, extra root packages, lockfile drift, an unreadable or
unknown-schema report, a raw audit that no longer finds the advisory, a second high, any critical, a non-dev
reachable finding, a dirty production audit, an unavailable registry, an empty version list, a removed or muted CI
step, and a newly published repaired release.

Because a filtered audit cannot see what it filtered, the guard copies `package.json` and `pnpm-lock.yaml`
byte-for-byte into an isolated directory with its own ignore-free workspace config and audits there:

| Measurement | Exit | Result |
|---|---|---|
| Unfiltered full graph, no exemption | 1 | **exactly one HIGH** — `GHSA-fc5q-39xc-vjpf` on `picomatch`, `devOnly=true`, 2 occurrences; **0 critical, 0 other high** |
| Filtered full graph, exception applied | 0 | reports `1 high (1 ignored)`; never described as zero |
| Strict production graph, no exemption | 0 | **no known vulnerabilities** — 0 high, 0 critical, 0 moderate |

The named HIGH is still present and is reported as present. One moderate `minimatch` advisory
(`GHSA-g3hv-75wg-m249`, development-only) is disclosed rather than force-overridden, because no compatible patched
resolution could be proved without risking the lint rule set. The two Next.js root-parameter advisories are gone at
`16.4.6`. The old defectively published report object remains a provider-controlled cache issue, tracked separately
and **not** reproduced here.

## 4. The three modules: contracts, rendering and evidence

| Module | Accepted shape | Bounds and refusals | Rendered as |
|---|---|---|---|
| `layout.bento` | `{tiles, heading?, level?}`; tile `{title, span, body?}` | 2–8 tiles; named spans only; unknown key, empty title, bad span, ninth tile refuse | `<section>` of semantic tiles preserving authored DOM order at every width |
| `content.pricing` | `{options, heading?, level?}`; option `{name, price, detail?, featured?}` | 1–6 options; **at most one** featured; inert authored amounts; no currency inference, no checkout, no provider | `<section>` price list; the featured option is marked, not linked |
| `content.timeline` | `{entries, heading?, level?}`; entry `{title, at?, detail?, current?}` | 1–12 entries; **at most one** `current`; no fabricated dates | Ordered milestone list; exactly the authored current entry carries `aria-current="step"` |

All three reject authored markup, unknown props and duplicate negatives through the **existing** closed reason
vocabulary (`document:invalid-props`, `document:invalid-section`, `document:heading-order`,
`document:unsafe-text`); no new refusal literal was invented, every accepted tree is deeply frozen, and each module
owns a unique negative Page that answers a genuine 404.

**Evidence.** `scripts/verify-u04-json-slice.mjs` reports **464 checks, 0 failed** over real production HTTP and a
real Chromium DOM. The 308 previously accepted checks are all preserved and 156 are added, including nine new
distinct negative Pages alongside the retained refusals. Viewports 320/390/768/1280 are asserted for layout,
computed style, overflow, focus, dark mode and reduced motion; browser console and external-network restrictions are
asserted; the synthetic fixture is restored **byte-for-byte** and the committed input is rebuilt and re-traced
afterwards. Two page-wide selectors were narrowed to `article.uno-json-card` because bento tiles now also match an
article selector; the count of two grid cards is unchanged and the narrowing carries its own positive and
mutation-negative proof.

## 5. Foundation provenance and rights

The audited donor remains `provelopment/provelopment-foundation` at commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, read-only, Apache-2.0 `LICENSE` blob unchanged. Recorded decisions:
`StepsSection` **ADAPT** (ordered `<ol>/<li>` semantics and `aria-hidden` visual index only; its Markdown chain,
Tailwind classes and link resolver **REJECT**), `ColumnsSection` **ADAPT** (controlled ratios and reading order;
arbitrary CSS **REJECT**), `CardsSection` **ADAPT** (repeated semantic items and grid/contrast; every image and
action dependency **REJECT**), the donor `page-document.ts` **REWRITE** (Uno's own strict contract), and
`section-support.tsx` / `page-document-content.tsx` **REJECT** (dependency chains and a Foundation Page dispatcher
would violate Uno's Ports-and-Adapters and provider-off boundary). `content.pricing` and `content.timeline` are
**REWRITE**: the pinned donor has no first-class counterpart, and the pricing presentation is original Uno work with
no currency, payment, checkout, provider or rating vocabulary. No Foundation asset, copy, image or third-party
material was copied.

## 6. Verification — local, then exact-head hosted

**Local (final candidate bytes):** units **802/802**; U04 hermetic **12/12**; architecture **46/46**; Node 26
security floor **30/30**; readiness fixtures **88/88**; exception guard mutation tests **26/26**; governance
**9/9** + CLI; bootstrap **19/19** + CLI; fixture transaction **27/27**; trace **25/25**; `pnpm lint` and
`eslint . --max-warnings 0` **0 errors, 0 warnings**; typecheck clean; build **0 warnings**; bounded trace OK; U01
HTTP **103**; U03 HTTP **91**; U03 published **542**; U04 **464**; readiness CLI **PASS**; brand **29/29**; frozen
lock install exit 0 with no drift and no postinstall; `git diff --check` clean.

**Hosted at product SHA `81bb3134`:** `Verify U01 baseline` **success on ubuntu-24.04 (job 134505111368) and
windows-2025 (job 134505110886)** — all 30 steps green, including the three new security steps ahead of the
unchanged full audit; `Uno Bootstrap Verify` **success** (run 44215778132). Raw logs on both hosts show
`result: ACCEPTED (one named, dev-only, time-bounded advisory exception)`, unfiltered
`exit 1 counts={"high":1,"critical":0}` with `devOnly=true`, production `No known vulnerabilities found`, full audit
`1 moderate | 1 high (1 ignored)`, and `103 / 91 / 542 / 464` production and browser checks passing with zero
failures.

**Provider.** Vercel deployment behaviour is **UNVERIFIED** by the Agent: no dashboard or provider API was
consulted, and no manual provider, DNS, alias or publication action was taken. Only Git-triggered deployments could
follow from the authorised pushes.

## 7. What remains, and the decision requested

**Still 11/22 and 0/17.** The typed `uno-family-composition.ts` translator covering all seventeen Foundation Page
families is not implemented; the remaining eleven module renderers (including the single tabs/modal/carousel client
island and the display-only honest contact state) are not implemented; `deployment/site.config.json`, the
presentation shell (header, nav, main, footer, skip link) and the four-zone owned-asset policy and reader are not
implemented. The eleven unimplemented IDs refuse truthfully as `document:renderer-unavailable`. U04 is **not**
closed.

**Security follow-up.** The exception expires **2026-12-18T00:00:00Z**. The guard fails closed the moment a repaired
`picomatch` is published, so the exception cannot be silently prolonged: either such a release is adopted, or the
Owner must issue a fresh, separately reasoned order before expiry. The development `minimatch` moderate remains
disclosed.

**No release, tag, merge, deployment, provider setting or stage closure was performed or claimed.**

**Requested from the independent Architect:** one verdict — `ACCEPT`, `REVISE`, or `STOP` — on the evidence above.
This report is not self-accepted.
