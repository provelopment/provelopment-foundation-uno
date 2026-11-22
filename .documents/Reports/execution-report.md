# Execution Report — UNO-WO-081 / R01

**DELIVERED — ONE BOUNDED TRANSPORT-FREE STATIC-ACTION CAPABILITY, BOTH HOSTED WORKFLOWS GREEN AT THE PRODUCT HEAD**

This document replaces the previous contents of this path under one Owner-authorized overwrite. It records one narrowly
bounded addition to the stand-alone `content.actions` module: authored `mailto:` and `https:` links that Uno renders as
inert markup and never follows. It is not an Architect acceptance, a U05 stage exit, a release or a deployment.

## 1. Authority and starting point

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-081 / R01`, Edition `FINAL — EXECUTE` |
| Owner activation identity | ACTIVE `.documents/WIP/workorder-active.md` measured **32,911 bytes**, SHA-256 `596be4aaa85887ba08f2d7ff41d07dbfa17b458b67512f218af0478024ee2389`, 140 lines; ignored, untracked and unstaged. The installed private file matched the Owner activation in order ID, edition, start SHA, byte count and digest. Its text and the activation message are deliberately not reproduced. |
| Required start | `aa053199782bd500a979fceca97ead1ed68cdd0d`, matched by local `HEAD`, local `main`, `origin/main` and the remote `main` ref before any write |
| Prior report blob | `00482c62349e822b14a39b2c16bf1f9135053ada` |
| Product commit | **`da2702d88b8d0bbc30c9ba17a7c5940aa2e6ebb5`**, parent exactly `aa053199…`, subject `UNO-WO-081 / R01: validate transport-free authored static actions`, **seven** tracked paths, +730 / −8 |
| Product-head hosted result | `Verify U01 baseline` run `44995619498`: **success** on `ubuntu-24.04` and `windows-2025`, 36 steps per job, **zero** failed, skipped or cancelled steps. `Uno Bootstrap Verify` run `44995619469`: **success** on both. Job steps and step logs were inspected, not badges. |
| Pins | all 36 pinned Git blobs of this order matched at the required start; all 29 read-only protected blobs were still byte-identical in the final tree |
| Immutable filesystem evidence | manifest SHA-256 `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`; selected Site SHA-256 `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952`; the 191-byte Page-owned plate SHA-256 `25bde641ce447275f7eff9d03859d07062ae34f9e3597eff18cf07bb384eae47`, Git blob `70477a240ff394095e8a2cdc0639c9f77cfdb395` — all re-verified after every stateful runner and before staging |
| Toolchain | committed Node `26.13.1`, pnpm `11.6.0`, Next `16.4.6`, React `19.2.9`, Playwright `1.65.1`; the repo-local Playwright cache prescribed by the committed CI was reused; no install, dependency, lockfile, workflow or configuration change |

## 2. What changed, path by path

| Path | Change |
| --- | --- |
| `src/core/page-document.ts` | One new `UnoOutboundActionItem` (`{label,href}`) and `UnoContentActionEntry` union; `UnoActionItem` and the hero props are untouched. A new `readContentActions` reader admits exactly `{label,targetId}` or exactly `{label,href}` — never both, never neither — reusing the **unchanged** `classifyAuthorDestination` and requiring its category to be precisely `mailto` or `https`. Only the stand-alone `content.actions` arm calls it; `readActionItems` still serves `content.hero` fragment-only. Budgets, strict no-getter parsing, duplicate-JSON refusal, version-1 shape and the closed error vocabulary are unchanged. |
| `src/components/uno-page-sections.tsx` | One render arm extended. A fragment entry keeps its previous anchor markup, key and escaping; an outbound entry renders an ordinary `<a class="uno-json-action" href="...">`, with `rel="noopener noreferrer"` and `referrerPolicy="no-referrer"` for `https:` and nothing forced for `mailto:`. No script, handler, `target`, popup, prefetch, tracking, probe or hydration island; hero markup and all other renderers untouched. |
| `tests/unit/page-document.test.ts` | Accepted fragment/mailto/two-HTTPS roundtrips with exact frozen serialization, the eight-entry mixed cap, and refusals for `http`, `tel`, JS, `data`, `blob`, protocol-relative, root/query/relative/fragment text, encoded scheme, CRLF mail header, credentials, malformed escape, markup, whitespace, malformed origin, empty and over-long destinations, extra or mixed keys, own `undefined`, non-string or empty or over-long label, label-only entry, duplicate JSON member, accessor (never invoked), throwing proxy, dead and malformed targets, nine entries, and outbound forms in `content.hero`. No earlier test was deleted or relaxed. |
| `tests/unit/uno-page-sections.test.ts` | One static-render test: legacy fragment anchor byte-identical, exact `mailto:` anchor, both HTTPS anchors with `rel`/referrer policy, escaped label, authored order, and no script, handler, new tab, form, status, `main`, `h1` or client marker. |
| `scripts/verify-u04-json-slice.mjs` | The already-declared temporary `JSON_DOCUMENTS.homeEn` `links` fixture gained three **reserved-domain** static links after its original fragment. Five executed predicates: `U05_STATIC_ACTIONS_SOURCE` (strict-reader acceptance, literal roundtrip, deep freeze), `U05_STATIC_ACTIONS_HTTP` (served anchors, order, `rel`/referrer, one `main`/`h1`, no form or prefetch), `U05_STATIC_ACTIONS_BROWSER` (real DOM hrefs/labels/`rel`/referrer, keyboard focus, no new tab, no ping, zero off-loopback requests), `U05_STATIC_ACTIONS_REFUSALS` (seven-case closed matrix on copies of the same fixture), `U05_STATIC_ACTIONS_RESTORE` (declarations byte-exact, no temporary source, no reserved destination in a committed Page). The original fixture sources, Page count, locales, routes, baseline 464 assertions, negative Pages and unconditional `finally` restoration are unchanged; nothing reads Git history or contacts a test domain. |
| `tests/deployment/u04-json-slice.test.mjs` | A `STATIC_ACTION_EVIDENCE` audit binding each of the five labels to its executable predicate, plus mutation tests: deleting a label, deleting a served-anchor or residue predicate, or replacing a predicate with `true` fails the guard. The fixture keeps its original fragment first and names no real host. |
| `.documents/Architecture/u05-static-actions.md` | **New.** One original, compact ledger: provenance and `NEW / COMPOSE` rights, the two dependencies, the accepted shape and refusals, the target/hero split, rendering, security/privacy non-goals, the synthetic fixture destinations, the executed evidence and every U05 obligation still open. Not a governance file and not a parity claim. |

**Backward compatibility, observed not asserted:** an existing fragment-only actions list serializes and renders exactly
as before, because the reader adds no key, rewrites no destination and injects no default. The hero module keeps its
original `{label,targetId}`-only shape and 1–3 bound, and an outbound action there is a props refusal. A malformed

## 3. Local evidence (Agent-observed, Windows, this checkout)

| Gate | Result |
| --- | --- |
| `vitest run` on `page-document` + `safe-author-url` | PASS — **137** tests |
| `vitest run` on `uno-page-sections` | PASS — **43** tests, including the new static-action markup proof |
| `pnpm test` | PASS — 30 files, **1,146** tests (baseline 1,142 plus 4 new) |
| U04 hermetic guard (`u04-json-slice.test.mjs`) | PASS — **14** tests, including the new label and predicate mutations |
| `verify-u04-json-slice.mjs` (real production Next + Chromium) | PASS — **477 passed, 0 failed**; `U05_STATIC_ACTIONS_SOURCE` ×3, `_HTTP` ×3, `_BROWSER` ×5, `_REFUSALS` ×1 and `_RESTORE` ×1 all executed against the temporary fixture, then the committed configuration was rebuilt and the U03 fail-closed gate re-ran |
| `verify-u04-22-module-consent.mjs` | PASS — **748 passed, 0 failed** |
| `verify-u03-published-http.mjs` | PASS — **999 passed, 0 failed** |
| `verify-u01-http.mjs` / `verify-u03-http.mjs` | PASS — **105** and **135** passed, 0 failed |
| Bootstrap, governance test, `verify-governance-docs`, architecture test | PASS |
| Eight deployment suites, `verify-vercel-readiness`, `verify-u04-security-exception` | PASS, offline |
| `pnpm audit --prod --audit-level high` / `pnpm audit --audit-level high` | exit 0 / exit 0; the one known **moderate** development advisory remains unwaived |
| `pnpm typecheck`, `pnpm lint`, `pnpm exec eslint . --max-warnings 0` | PASS — no errors, no warnings |
| `pnpm build`, `verify-u03-trace.mjs --expect committed` | PASS |
| Post-run state | clean index and worktree, no `wo0*` fixture leftover, both declaration digests and the plate digest unchanged, tracked diff limited to the seven authorized paths |

**One honest local caveat:** the first local invocation of the browser runner failed because Playwright could not find a
browser executable — the environment variable the committed CI uses was not set in that shell. It was **not** skipped or
reported as a pass. The runner failed closed (`392 passed, 1 failed`, restoration proven). Re-running the exact committed
CI invocation, with the repo-local browser cache the workflow prescribes, produced `477 passed, 0 failed`. No dependency,
lockfile or configuration changed; nothing was downloaded.

Local results are Agent-observed and are not independently certified; the hosted runs in section 4 are the independent
evidence.

## 4. Product-head hosted evidence (independently inspectable)

| Item | Ubuntu 24.04 | Windows 2025 |
| --- | --- | --- |
| `Verify U01 baseline` (run `44995619498`) job | success, 36 steps, **0** failed/skipped | success, 36 steps, **0** failed/skipped |
| `pnpm test` | **1,146** passed, 30 files | **1,146** passed, 30 files |
| `verify-u03-published-http` | **999 passed, 0 failed** | **999 passed, 0 failed** |
| `verify-u04-json-slice` | **477 passed, 0 failed** | **477 passed, 0 failed** |
| `verify-u04-22-module-consent` | **748 passed, 0 failed** | **748 passed, 0 failed** |
| `verify-u01-http` / `verify-u03-http` | 105 / 135 passed, 0 failed | 105 / 135 passed, 0 failed |
| `U05_STATIC_ACTIONS_SOURCE` / `_HTTP` / `_BROWSER` / `_REFUSALS` / `_RESTORE` | 3 / 3 / 5 / 1 / 1 executed | 3 / 3 / 5 / 1 / 1 executed |
| `Uno Bootstrap Verify` (run `44995619469`) | success | success |

No `  FAIL  ` line appears in either job log. The hosted checkout is shallow, so the durable starter proofs continue to
compare pinned SHA-256 digests rather than historical Git objects.

`targetId` never falls through to `href`, and an outbound entry never becomes a synthetic `state.targets` fact.


## 5. Rights, provenance and privacy

Rights class **`NEW / COMPOSE`**: every line added here is original Uno-authored code, tests and prose. The pinned
read-only donor `provelopment/provelopment-foundation` commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` was consulted
only for context, with its Apache-2.0 `LICENSE` blob `d645695673349e3947e8e5ae42332d0ac3164cd7` and the two reference
files `text-sections.tsx` (`caeee57798bdd533867e5bef350422618187612f`) and `section-support.tsx`
(`19c9bee3b3b200af2455813e5f842c30b062a6ac`). No donor JSX, CSS, Markdown, link, asset, brand, token or fixture was
copied; `modules/connect/**`, the Foundation Solo Rust tree, SDKs, analytics and webhooks remain excluded, and no
dependency, licence exception or notice waiver was added.

`classifyAuthorDestination` remains lexical syntax safety only — not target existence, provider identity, Page ownership,
link trust, delivery success, SSRF authorization or a server fetch allowlist. This order added **visitor-initiated static
links**: Uno never fetches, pings, proxies, crawls, preconnects, resolves DNS, follows a redirect or sends a webhook, and
the three fixture destinations (`mailto:contact@example.invalid`, `https://maps.example/directions?to=sample`,
`https://booking.example/availability`) were never contacted and are claimed by nobody. No booking, availability,
directions routing, contact delivery or provider validation is implemented, and a real authored HTTPS destination may
still be unsafe, unavailable or misleading.

This report, the commit subject and every changed file are free of the private machine-specific path, profile or home
directory, personal identifier, credential, token, secret, ACTIVE text and activation text. No history rewrite, purge,
visibility or settings change, key rotation, provider contact, force push, merge, tag, release or deployment occurred,
and no real domain operation is claimed.

## 6. Prior orders, accounting and remaining warnings

`UNO-WO-071` activation evidence stays unresolved; `UNO-WO-072` privacy/report and `UNO-WO-073` write-ledger remain
`REVISE`; `UNO-WO-076` remains STOP/`REVISE`; `UNO-WO-078` remains `REVISE` with its product and report heads recorded as
**red** and not retroactively accepted; `UNO-WO-079` and `UNO-WO-080` are the separate Architect `ACCEPT`s already
recorded. None of those historical results is altered here.

One module gained a bounded capability. Accounting is unchanged at **22/22** typed module IDs, **4/4** owned asset zones,
**16/16** browser matrix, **17/17** bounded mappings, **1/17** accepted full donor-family parity (`divider`) and
**43/59 = 72.88%** proxy. U04, U05, U06 and U07 remain **OPEN**; this order is a static-link slice, not U05 stage exit,
and no stage closure, release or deployment follows from it.

**Historical private-path exposure: unresolved — Owner decision required.** The moderate development dependency advisory
remains unwaived while the production graph audits clean, and the Windows `DEP0190` deprecation warning remains a known,
reported warning observed again in the Windows hosted job.

## 7. Report-head state

| Item | Status |
| --- | --- |
| Report overwrite count | **1**, from this fully prevalidated ignored-scratch draft |
| Frozen bootstrap, governance and privacy gates re-run against this new report | PASS locally before the report-only commit |
| Report-head `Verify U01 baseline` / `Uno Bootstrap Verify` on Ubuntu and Windows | **PENDING at write time** — deliberately not predicted in this document |
| Architect `ACCEPT / REVISE / STOP` | PENDING; the Agent does not self-accept |

