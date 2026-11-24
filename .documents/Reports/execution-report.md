# Execution Report — UNO-WO-110 / R01

**Outcome: DELIVERED — `4/17` credited families, `46/59` proxy, with `table` newly credited and `list` still `PENDING`, proven at the exact product SHA on both hosted operating systems.**

| | |
| --- | --- |
| Order | `UNO-WO-110 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **4,040 bytes**, SHA-256 `3ee574bf09be9a03478ee1f6ee951b8f0fd03ba835d74606b559eabf0fd8ff5d` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `caa45811d98c737f4080bf1e3c2f4014812066d5` (`HEAD` = `main` = `origin/main` = `ls-remote`, clean tree, one worktree, one Uno `origin`) |
| Product SHA | **`0184a12a0c18400cda79d96399b952e24b785679`** |
| Credited families | `prose`, `callout`, **`table`**, `divider` → **`U04_PARITY=4/17`**, **`U04_PROXY=46/59`** |
| Still pending | `list` (its executed local evidence is retained but uncredited), plus `hero`, `stats`, `steps`, `quote`, `faq`, `columns`, `media`, `gallery`, `cards`, `features`, `actions`, `contactForm` |
| Frozen `A2` row (`5/17`, `47/59`) | **not claimed**; the oracle and its `A2` checkpoint are unmodified |
| WO-108 work | preserved in full: rich four-item `list`, `links.help`, `wo108-target` Page, six fixture sources, the rich `table` with lede `The **table** explains synthetic totals.` |

## 1. What was implemented

Only the two authorized product paths changed: `scripts/verify-u04-22-module-consent.mjs` and `tests/deployment/u04-22-module-consent.test.mjs`.

- **`table.refusal` now comes from malformed tables, not the list's link refusals.** Four probes mutate exactly one authored table field — Markdown in a cell, a non-array row, non-array `columns`, and a whitespace-only `lede` — and each must refuse the whole source Page with a `family:*` reason and **no** partial document (`A2_LOCAL_REFUSAL`). The list's two link refusals remain as its own witness.
- **`table.http` is the real production response.** The flag now requires HTTP 200 from the family Page *and* the checked rich table DOM as served: `uno-json-table-section` with `data-uno-surface="muted"`, a `tabindex="0"` scroll wrapper, the Markdown lede, a Markdown `<caption>` carrying `<strong>synthetic</strong>`, two `<th scope="col">` headers and four `<td>` cells.
- **`table.browser` is a four-case conjunction, not one observation.** A case is recorded only by an assertion that actually ran and passed: light at 390 px and 1280 px (heading, Markdown lede, caption, two columns, four cells, zero links, scroll control focused) and dark + `prefers-reduced-motion: reduce` at both widths (same DOM, `data-uno-surface`, `tabindex="0"`, focus actually landing on the scroll control, no overflow). The flag is set after the dark sweep only when all four keys exist (`A2_LOCAL_BROWSER`).
- **The fourth credit is a separate, checkpoint-omitted evaluation.** The `checkpoint:"A1"` call stays as a regression assertion and is now pinned to `3/17`, `45/59`. A second `evaluateU04FamilyClosure` call passes the same three executed records **plus `localA2.table`** with no checkpoint, and must return `ok`, the exact credited set `prose,callout,table,divider`, `parity===4`, `proxy===46`, `list` pending, `PARITY_TABLE=PASS` and `PARITY_LIST=PENDING`. Every printed `PARITY_*` / `U04_*` label is re-derived from that four-family result, so the A1 regression can no longer print the row. The oracle file itself is untouched.
- **The deployment guard follows the new evidence.** Fifteen new tokens pin the malformed-table refusal, the HTTP predicate, the four-case browser conjunction, the 14/14 local total and the four-family credit, and one A1 predicate is re-pinned from `closure.ok === true && familyOk && dividerOk` to the exact `3/17` / `45/59` row; a new mutant test proves each can be neutered only into a failing audit, and asserts no `checkpoint: "A2"` can appear.

## 2. Local gates (all green)

| Gate | Result |
| --- | --- |
| `verify-u04-22-module-consent.mjs` (real `next build`, `next start`, Chromium) | **818 passed / 0 failed**, declarations restored, fixture sources removed |
| `tests/deployment/u04-22-module-consent.test.mjs` + `u04-family-closure.test.mjs` | **65 passed / 0 failed** |
| `pnpm test` | **1,287 / 1,287** |
| `pnpm test:architecture` | **47 / 0** |

## 3. Hosted proof at `0184a12`

Both required workflows were green at the exact product SHA, on both hosted operating systems:

| Workflow | Run | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- | --- |
| `Verify U01 baseline` | **45358299201** | success | success |
| `Uno Bootstrap Verify` | **45358299221** | success | success |

The four required lines were read out of the **actual** `Verify U01 baseline` step log, in the `Verify U04 22-module and four-provider consent (real production HTTP and Chromium)` step, on each OS:

```text
verify (ubuntu-24.04)   PASS  U04_LABEL PARITY_TABLE=PASS
verify (ubuntu-24.04)   PASS  U04_LABEL PARITY_LIST=PENDING
verify (ubuntu-24.04)   PASS  U04_LABEL U04_PARITY=4/17
verify (ubuntu-24.04)   PASS  U04_LABEL U04_PROXY=46/59
verify (ubuntu-24.04)   verify-u04-22-module-consent: 818 passed, 0 failed

verify (windows-2025)   PASS  U04_LABEL PARITY_TABLE=PASS
verify (windows-2025)   PASS  U04_LABEL PARITY_LIST=PENDING
verify (windows-2025)   PASS  U04_LABEL U04_PARITY=4/17
verify (windows-2025)   PASS  U04_LABEL U04_PROXY=46/59
verify (windows-2025)   verify-u04-22-module-consent: 818 passed, 0 failed
```

The same hosted logs also report the untouched regression gates at this SHA: `verify-u01-http` 105/0, `verify-u03-http` 135/0, `verify-u03-published-http` 999/0, `verify-u03-multisite-http` 154/0 and `verify-u04-json-slice` 477/0 on both operating systems.

## 4. Documentation

Exactly one row changed in `.documents/Architecture/u04-family-parity.md`: `table`'s disposition now records the `UNO-WO-110 / R01` credit at the interim `4/17` / `46/59` row, its accepted fields now name the Markdown `caption`, the closed `surface`, the plain-text `heading` and the Markdown `lede`, its unsupported list now names Markdown **cells** instead of `surface`/caption Markdown, and its proof column names the reader round-trip, four malformed-table whole-Page refusals, the served-HTTP rich DOM and the four 390/1280 light and dark/reduced-motion Chromium observations. No other family row was touched.

**Disclosed limitation.** The ledger's aggregate sentence still reads `three of seventeen … fourteen still bounded`, and the `table` row keeps its original `ADAPT (bounded plain-text heading/lede)` clause ahead of the new credit, because `tests/unit/uno-foundation-families.test.ts` pins those exact strings (three occurrences of the `ADAPT` clause, two of `PARITY (A1, …)`, the `three of seventeen` phrase and `fourteen still bounded`) and the unit test file is **outside** this order's authorized edit list. Rewriting the aggregate is a one-line change for a future order that authorizes that test; the authoritative, evidence-derived counts for this delivery are the printed `4/17` / `46/59` and the per-row credit above. The unit suite is green (1,287/1,287) with the row as recorded.

## 5. State and next

`U04` remains **OPEN** at `4/17`. The frozen `A2` checkpoint (`5/17`, `47/59` over `table` + `list`) is **not** claimed: `list` keeps its executed local evidence but stays `PENDING` until the separate three-Site P6 proof and a later Owner order. No stage closure, merge, release, deployment, provider, DNS or settings operation was performed; only the two product files and the two authorized documentation paths changed, and the product commit was pushed non-force. This report is the single sanitized record; the run stops here for independent Architect review.

| `pnpm typecheck`, `pnpm lint` | exit 0 |
