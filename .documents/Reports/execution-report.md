# Execution Report — UNO-WO-111 / R01

**Outcome: DELIVERED — `U04_PARITY=5/17`, `U04_PROXY=47/59`, with `PARITY_TABLE=PASS` and `PARITY_LIST=PASS` proven at the exact product SHA on both hosted operating systems.**

| | |
| --- | --- |
| Order | `UNO-WO-111 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **2,743 bytes**, SHA-256 `6534493cc3aaecf8bda962a7b055e458926ac3e9a70985e50bdd5f13e2395b0c` — matched the activation exactly; private, ignored, never staged |
| Start SHA | `ff6e1bbcfe0d34b8f916b0d755b3a624b4fe8bd3` (`HEAD` = `main` = `origin/main` = `ls-remote`, clean tree, one worktree, one Uno `origin`) |
| Product SHA | **`46c1c72d663ff085acf0f70e79a8c8c53b4c8ae4`** |
| Credited families | `prose`, `callout`, `table`, **`list`**, `divider` → **`U04_PARITY=5/17`**, **`U04_PROXY=47/59`** (the declared `A2` row) |
| Preserved | WO-108's rich four-item `list`, `links.help`, `wo108-target` Page and six-source fixture; WO-110's credited `table`; the unchanged closure oracle |

## 1. What was implemented

Six authorized paths changed; `src/**` was not touched because no List behaviour defect was observed.

**Three-Site P6 destination proof (`scripts/verify-u03-multisite-http.mjs`, 154 → 179 checks).**
- Each Site's home Page now carries one **donor-authored** rich List, composed at fixture-build time by the real `composeUnoFoundationSubset` (the adapter's TypeScript modules are loaded through the same `registerHooks` resolver the other production runners use). No list node is hand-built.
- The three Lists deliberately target different site-local routes so a resolved href can only come from the requesting Site's own graph: `about` at the prefix-less root, `about` under the `/docs/` whole-segment prefix, and the nested `field/notes` route on the unrelated Facet domain.
- **`G06` HTTP proofs** assert, per Site, the canonical, the composed `uno-json-list-section` with `data-uno-surface`, the authored heading, the plain lede, the exact anchor count, the external `https` href, the server-projected route href, `rel="noreferrer noopener"`, the inert label as plain text, and that no *other* Site's projected href ever appears.
- **`G06` refusal matrix** — a real `next start` still running — temporarily rewrites one installed source, proves the **whole Page** is refused with no list markup for a **cross-Site** target (`privacy`), a **cross-Facet** target (`brief`), an **unlisted** target (`brief`) and a **draft** target (`draft`), then proves the restored Page serves again. A fifth probe **transplants** the same authored List onto the Site's `en-001` representation, whose `about` route exists only in `de-DE`, and proves the **wrong-locale** refusal plus its restoration. Every mutation is restored in a `finally` from the original bytes.
- **Chromium** opens all three Pages and asserts the real DOM: anchor count, both hrefs, both `rel` tokens, the inert label as a `span`, focusability, visibility and zero horizontal overflow.
- The **no-default phase** repeats the destination proof on a fresh build/server (`5/17` hrefs per Site, no borrowing of the declared default) and one unauthorised-target refusal plus its restoration.

**Earned A2 credit (`scripts/verify-u04-22-module-consent.mjs`).**
- `localA2.list.browser` is now a **four-case conjunction** (light and dark/reduced-motion at 390 px and 1280 px), recorded per exact viewport/scheme — the same discipline the credited table uses — so a single superficial pass cannot set it.
- The run feeds the executed `localA2.table` **and** `localA2.list` into one `checkpoint:"A2"` evaluation of the unchanged oracle, which must return the exact credited set `prose, callout, table, list, divider` at `5/17` / `47/59`. The A1 (`3/17`) and four-family (`4/17`) evaluations remain as regressions. Every printed label is re-derived from the A2 result.

**Guards.** `tests/deployment/u03-multisite-contract.test.mjs` gained a List rule set (real composition, exactly three compositions, both G06 groups, each of the five probes, the mutation restore, the no-default proof) plus four mutation tests; `tests/deployment/u04-22-module-consent.test.mjs` gained sixteen A2 tokens and mutation cases and now asserts the declared checkpoints are exactly `A1` and `A2`.


## 4. Hosted proof at `46c1c72`

Both required workflows were green at the exact product SHA, on both hosted operating systems:

| Workflow | Run | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- | --- |
| `Verify U01 baseline` | **45365186896** | success | success |
| `Uno Bootstrap Verify` | **45365186840** | success | success |

The four required lines were read out of the **actual** `Verify U01 baseline` step logs:

```text
verify (ubuntu-24.04)   verify-u03-multisite-http: 179 passed, 0 failed
verify (ubuntu-24.04)   PASS  U04_LABEL PARITY_TABLE=PASS
verify (ubuntu-24.04)   PASS  U04_LABEL PARITY_LIST=PASS
verify (ubuntu-24.04)   PASS  U04_LABEL U04_PARITY=5/17
verify (ubuntu-24.04)   PASS  U04_LABEL U04_PROXY=47/59
verify (ubuntu-24.04)   verify-u04-22-module-consent: 822 passed, 0 failed

verify (windows-2025)   verify-u03-multisite-http: 179 passed, 0 failed
verify (windows-2025)   PASS  U04_LABEL PARITY_TABLE=PASS
verify (windows-2025)   PASS  U04_LABEL PARITY_LIST=PASS
verify (windows-2025)   PASS  U04_LABEL U04_PARITY=5/17
verify (windows-2025)   PASS  U04_LABEL U04_PROXY=47/59
verify (windows-2025)   verify-u04-22-module-consent: 822 passed, 0 failed
```

The same logs report the untouched regression gates green on both systems: `verify-u01-http` 105/0, `verify-u03-http` 135/0, `verify-u03-published-http` 999/0 and `verify-u04-json-slice` 477/0.

## 5. State and next

The declared **A2 row is earned**: `5/17` and `47/59`, with `table` and `list` both credited and the twelve remaining families still explicit `PENDING`. `U04` itself remains **OPEN** — `U04_PARITY` is an interim family count, not stage closure, and the Owner separately decides closure, merge, release and deployment. No workflow, oracle, permanent declaration, `src/**` or provider change was made; the product commit was pushed non-force and the single sanitized report is overwritten. The run stops here for independent Architect review.

## 2. Documentation

`.documents/Architecture/u04-family-parity.md`: the aggregate now reads **five** fully parity-evidenced candidates with **twelve** still bounded, the bounded plain-text group names only `faq`/`stats`/`steps`, `table` carries a clean `PARITY (UNO-WO-110 / R01)` disposition, and the `list` row is rewritten for its real surface (safe `href`, same-Site proven `route`, inert `link`, Markdown lede/detail, closed `surface`) with its refusal matrix and three-Site evidence. The four unit tests that pinned the stale wording were updated for the new counts and row dispositions, all green.

## 3. Local gates (all green)

| Gate | Result |
| --- | --- |
| `verify-u03-multisite-http.mjs` (three Sites, both phases, real build/server/Chromium) | **179 passed / 0 failed**, both phases restored byte-exactly |
| `verify-u04-22-module-consent.mjs` (real build/start + Chromium) | **822 passed / 0 failed**; `5/17`, `47/59` |
| `u03-multisite-contract` + `u04-22-module-consent` + `u04-family-closure` | **101 passed / 0 failed** |
| `pnpm test` | **1,287 / 1,287** |
| `pnpm test:architecture`, `pnpm typecheck`, `pnpm lint` | **47 / 0**, exit 0, exit 0 |
| Declarations after every run | `manifest` `b6213ed6…`, `config` `58011c43…` |
