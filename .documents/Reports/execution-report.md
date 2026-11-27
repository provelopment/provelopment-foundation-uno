# Execution Report — deployment integrity restored, C2 preserved

**State: local work verified; one commit unpushed.** Local `main` carries `58ac18c` (published) plus this increment. Nothing was pushed, released, deployed or published in this increment. Hosted CI at the corrected SHA is therefore still unverified — see *Authorization*.

## Confirmed root cause of the hosted failure

Both hosted jobs failed at `Run production HTTP and browser (U03 published Pages, restored afterwards)` with:

```text
FAIL  DURABLE_FAMILY_SOURCE the appended sections are the composer's own output
verify-u03-published-http: the durable family source proof failed; no build was attempted.
verify-u03-published-http: 68 passed, 1 failed
```

The durable Page is deliberately never rewritten (`UNO-WO-123 / R06`), so it still carries the *historical* Features outline — a `layout.stack` wrapper with an authored level-2 heading, a plain prose lede and an ordinary `layout.grid` of `itemSemantics: "list"` stacks — while the adapter now composes the accepted native `layout.grid` **features** node (`UNO-WO-125 / R05`). The unit suite and the C2 evidence knew that three sections differ; the production verifier still permitted only two:

```text
committed vs composed differing ids: ["family-5-gallery","family-15-cards","family-16-features"]
verifier permitted:                  ["family-5-gallery","family-15-cards"]
```

Reproduced with the real gate before any edit (log above), and independently with a differential probe over the real composer and the committed bytes. The defect was a stale allow-list in one production predicate, not a fault in the Features implementation, the durable Page or the composer.

## Exact changes

- `scripts/u03/durable-features-equivalence.mjs` (new): one pure comparator, `featuresEquivalenceDelta`, deciding eight load-bearing clauses between the historical wrapper and the native node — stable identity and module pairing; representation (three committed children, authentically childless native node whose empty consumer list is non-enumerable); authored heading and its level 2 on both sides; authored lede with no invented Markdown declaration; authored column intent; unit count, order and titles against the level-3 title contract; absence of body, bodyMarkdown, icon, meta, image, action and surface; and closed authored key sets on both sides, so a dropped field and an extra field both fail.
- `scripts/verify-u03-published-http.mjs`: the appended-section predicate now permits exactly the three representation differences and still requires every other appended section to be byte-identical; a new semantic check credits Features only when the comparator holds **and** the composed node is recognised as a native features grid; a second check requires the composed node to be childless and to survive the strict Page reader round-trip; the served-HTML phase now pins the Features family to its authored heading, lede and three unit titles in order and requires the native icon treatment to be absent.
- `tests/deployment/u03-durable-features-equivalence.test.mjs` (new): 38 assertions over the real fixtures. One test pins the baseline as eight true clauses; one refuses a missing node; 36 mutation cases each require a named clause to fail after altering, dropping, adding or reordering units, altering headings, levels, lede or columns, inventing an icon, body, meta, action or surface, crossing a module or id, authoring a native `children` list, adding a wrapper child, adding a wrapper prop, or dropping the committed grid.
- `tests/deployment/u04-22-module-consent.test.mjs`: the hermetic guard now requires the new labels, the comparator import and call, the reader acceptance, the childless requirement and the served icon refusal, and its neutering list proves each clause is load-bearing.

## Security

A fresh full-graph audit reported one moderate development-only finding absent from the earlier record: `GHSA-g3hv-75wg-m249` on `minimatch` (`>=7.0.0 <11.0.1`), reachable only through `@typescript-eslint/*`. A patched range is published, so the repair was adopted instead of waived: `@typescript-eslint/parser` and `typescript-eslint` moved 8.72.2 → 8.74.0, which depends on `minimatch ^11.0.1`. No override, no suppression and no waiver was added. `pnpm audit` now reports **no known vulnerabilities** on the unfiltered graph; the production audit was already clean. The retired picomatch disclosure is preserved as history in `pnpm-workspace.yaml`; it was never repaired, only retired from the reported graph. The review date 2026-12-18 needed no extension because nothing was extended.

## Executed verification (local, Node 26.13.1, pnpm 11.6.0)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | clean |
| `pnpm audit --prod --audit-level high` / `pnpm audit --audit-level high` | clean / **no known vulnerabilities** |
| Node 26, security-floor, brand-copy and exception suites | 31 pass; exception guard ACCEPTED |
| Bootstrap | 19 tests, scaffold verifier OK |
| Architecture | 47 pass |
| Lint / typecheck | clean, no suppressions |
| Unit | 1427 pass, 36 files |
| Deployment suites | **388 pass, 0 fail** (349 + 38 new equivalence + 1 minimatch repair) |
| U04 JSON vertical slice (test + production HTTP/Chromium) | pass, byte-exact restoration |
| Production build / bounded trace | compiled, zero warnings; only declared inputs ship |
| U01 production HTTP | OK |
| U03 locale and discovery refusals | OK |
| U03 published Page HTTP + Chromium | **1005 pass, 0 fail** (was 68 passed / 1 failed before the build) |
| U03 fixture transaction | 28 pass; fixtures restored byte-exactly |
| Multi-Site contract + HTTP | pass; two-phase restoration byte-exact |
| U04 22-module and consent gate | **969 pass, 0 fail** |
| Closure oracle (unchanged) | C2 reproduced: `U04_PARITY=15/17`, `U04_PROXY=57/59`, `PARITY_FEATURES=PASS`, `PARITY_CARDS=PASS`; closed interim still 14/17 and 56/59 |
| Deployment readiness | PASS, `VERCEL_NOT_DEPLOYED_BY_AGENT` |

## Earned parity

`15/17` families and `57/59`, produced by the unchanged evaluator from evidence executed in this run. The fourteen-family Cards interim remains reproduced history. `actions` and `contactForm` remain uncredited, so checkpoint D is not claimed and U04 stays open.

## Authorization and outstanding work

- Commit: local only. Push, hosted-CI observation, release, deployment and real-site publication each need separate Owner authorization; without a push the corrected SHA cannot be verified on Ubuntu and Windows.
- Checkpoint D (`actions`, `contactForm`) is gated on exact-head CI being green, which cannot exist before that push.
- Remaining U04 obligations are unchanged: one coherent shell, accessible responsive navigation, keyboard focus, semantics, contrast/dark-mode/reduced-motion, the 320/390/768/1280 matrix, owned-asset licensing, validated configuration and fail-closed behaviour, and the U03 roadmap reconciliation.

## Next executable outcome

Push `main` under Owner authorization, verify every hosted workflow at that exact SHA on both hosts, then earn `actions` and `contactForm` through the same seven dimensions so the unchanged oracle returns `17/17` and `59/59`. Contact stays presentation-only until delivery is separately authorized.

- Gallery and Cards semantic comparisons, the six-section preservation digest, historical Page bytes, owned asset identities, refusal contracts, validation limits and the closure evaluator are unchanged.
