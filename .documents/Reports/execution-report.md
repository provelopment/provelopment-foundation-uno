# Execution Report — UNO-WO-097 / R01

**M1 P6 delivered: three-Site production HTTP/Chromium evidence is green on GitHub at the exact product SHA, on Ubuntu 24.04 and Windows 2025, including the default-free case.**

| | |
| --- | --- |
| Order | `UNO-WO-097 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **27,354 bytes**, SHA-256 `aa0adb6e458b50ff86417584d4ae8be030e6ce9c82f9397060a90797715eb70a` — exact match, ignored/untracked |
| Starting SHA | `4698f7bb70bb80b2518239133017eacf5ec440b7` — `HEAD`, `main`, `origin/main` and remote `main` equal |
| **Product SHA** | **`729c585f383730a16f53716b941e9e93aeca81e1`** |
| Hosted, exact head | `Verify U01 baseline` run `45179428391` — **success**; `ubuntu-24.04` **success**, `windows-2025` **success** |
| Hosted, second workflow | `Uno Bootstrap Verify` run `45179428398` — **success** |
| New blocking steps | `Multi-Site P6 contract (mutation-sensitive)` **success**; `Run production HTTP and browser (three-Site P6, …)` **success** — both on both operating systems |

## 1. Preflight

Proven before any write: `git rev-parse --show-prefix` empty, branch `main`, exactly one worktree, exactly one `origin` at the Uno repository, clean tracked worktree and index, no unexplained untracked files, and local/remote equality at the required start SHA. The single ACTIVE is this edition, ignored, untracked and unstaged in the four-slot WIP directory, and its measured byte count and digest match the Owner activation exactly.

Preserved by digest before **and** after every fixture and build: `deployment/efs/manifest.json` `b6213ed6ee2d…`, `deployment/uno.config.json` `58011c4324f5…`, A2 patch `5e40963895d2…`, A2 test `1cdddb38a91b…` (both still unapplied), plus the frozen governance blobs, which no commit touched.

## 2. The fixture defect, and the truth about the previous failure

The previous report claimed a product defect because the default-free phase answered 404. That claim was **wrong**, and this run proves it. Phase one installs the twelve authored `wo096-*` sources and three owned plates through the recovery-armed transaction; its verified `restore()` then removes exactly those owned files. Phase two re-declared the same Pages but passed `fixtureSources: []`, so it declared content it never installed. A 404 there was the correct answer to an incomplete fixture.

Correction, in the committed runner only: phase two now installs the **same authored source bytes and plates** through its own fresh, recovery-armed transaction, declares the **same bindings in a deliberately permuted order** (so a sorted declaration order cannot become an implicit default), executes a **separate real `next build` with the default-free declaration installed**, starts a **fresh** `next start`, and requests all three Sites plus a foreign Host. No product source was changed, no default was invented, `sites[0]` was never selected, and no publication authority was bypassed — exactly as the order requires when a valid fixture passes.

## 3. Changed-path ledger

| Commit | Paths | Purpose |
| --- | --- | --- |
| `eb3952e` | `scripts/verify-u03-multisite-http.mjs`, `tests/deployment/u03-multisite-contract.test.mjs`, `.github/workflows/verify-u01.yml` | complete two-phase fixture lifecycle; new hermetic mutation-sensitive contract; two unconditional blocking steps |
| `aeb0b5b` | runner | bounded, sanitised hosted annotations for failed checks |
| `1783da3` | runner | name the failing requirement group; annotate unhandled termination |
| `729c585` | runner | fail only on an *altered* protected A2 artifact, never on a clean-checkout absence |
| report commit | `.documents/Reports/execution-report.md` | this single sanitized report |


## 4. Gate results

### Focused harness and contract

| Gate | Result |
| --- | --- |
| `node --test tests/deployment/u03-multisite-contract.test.mjs` | **PASS** — 14 tests, 0 failed |
| Demonstrated red mutation of the committed runner (`fixtureSources: sources` → `[]` in phase two) | **PASS as a negative** — the suite failed with exit 1 (`the committed runner satisfies every contract rule` and `… rejects an empty second-phase source collection` red), and the runner was then restored **byte-identically** (digest equal) and the suite returned to 14/14 |
| Three-Site runner, local, default-bearing + default-free | **PASS** — 125 checks, 0 failed, both restorations verified byte-exactly, repeated |

### The complete local battery (run at `eb3952e`; essential subset re-run at `729c585`)

| Gate | Result |
| --- | --- |
| `pnpm test:bootstrap` | PASS |
| `node --test tests/governance-docs.test.mjs` · `node scripts/verify-governance-docs.mjs` | PASS · PASS |
| `pnpm test:architecture` | PASS (with the single authorized test-only importer entry) |
| `pnpm test` | PASS |
| `pnpm lint` · `pnpm exec eslint . --max-warnings 0` | PASS · PASS |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS |
| `node scripts/verify-u03-trace.mjs --expect committed` | PASS |
| `pnpm test:http` | PASS — **105 passed, 0 failed** |
| `node scripts/verify-u03-http.mjs` | PASS — **135 passed, 0 failed** |
| `u03-fixture-transaction` · `u03-trace` · `u04-json-slice` (node --test) | PASS · PASS · PASS |
| `node scripts/verify-u03-published-http.mjs` | PASS — **999 passed, 0 failed** (real HTTP + Chromium) |
| `node scripts/verify-u04-json-slice.mjs` | PASS |
| `u04-22-module-consent` tests · script | PASS · PASS |
| `verify-vercel-readiness` tests · script | PASS · PASS — 132 checks, 0 failed |
| Security-floor, brand-copy and advisory-exception gates | PASS (unchanged, hosted) |

### Hosted, exact product SHA `729c585`

| Workflow | Ubuntu 24.04 | Windows 2025 |
| --- | --- | --- |
| `Verify U01 baseline` | **success** | **success** |
| `Uno Bootstrap Verify` | **success** | **success** |

The two new steps are the only added steps, they are unconditional, and both were observed green on both legs. The hosted runner itself printed **125 passed, 0 failed** on each leg with **both** restorations verified byte-exactly, so the default-free three-Site case is proven in hosted production HTTP and Chromium — not merely locally.

## 5. Coverage statement, precisely

**Passing:** independent Facet domains (`abc.example` root and `xyz.example`), a shared-Host whole-segment prefix Site (`abc.example/docs`), repeated `siteId` with distinct authority, three distinct locales/bodies/canonical origins, a declared default on a different Host that never steals an address, a default-free declaration **in permuted order** with all three Sites active and a foreign Host still refused, disjoint prefixes and lookalike-prefix refusals, Home/About/nested routes, JSON and safe Markdown both served as authored, `public` and directly-reachable-but-`noindex,nofollow` unlisted, draft 404, valid preferred JSON, invalid present JSON refusing without the Markdown rescuing it, genuinely absent JSON leaving the declared Markdown serving, truthful `<html lang>`, canonical and OG, same-Site alternates with no cross-Facet leakage, `en → en-001` on its own origin only, Host-scoped `robots.txt`/`sitemap.xml` with no unlisted, draft or alias leakage and no impossible `/docs/sitemap.xml`, hostile authorities (unknown, suffix lookalike, port, punycode, mixed case, duplicate `Host`, forwarded-Host), encoded slash and traversal, owned-media GET/HEAD with exact MIME and bytes, a same-Host ambiguous locator **refused rather than assigned to the first Site**, cross-owner media refused, approved real HTML 404 with literal `href="/"` and no `__next_error__`, no filesystem path or secret in any refusal, and real Chromium at 320/390/768/1280 in light and dark with reduced motion, keyboard focus, a JavaScript-disabled refusal, zero console errors and zero foreign requests.

**Not applicable:** native-video byte-Range, because this fixture declares no video source; no unexecuted case is claimed as proven.

**Known remaining product gap, reported not hidden:** the declared address alias `https://abc.example/docs-old` does **not** redirect; it resolves to the approved refusal. The runner therefore asserts only the safety property (it is never served as a second owner, never appears in `sitemap.xml`, and can never supply an alias destination for a sibling Site) and records the observed status. Alias *routing* remains unimplemented and is not claimed.

## 6. Preservation and disposition

Declarations restored to `b6213ed6ee2d…` / `58011c4324f5…` after every phase, in the runner and again at the end; A2 artifacts unchanged and unapplied; zero `wo096-*` residue; clean index with only the intentional ledger paths; no installs or builds outside the checkout, no provider, DNS, deployment, merge, tag or release action, and no stage closure or U04 parity credit is claimed. Handing this to the Architect for independent review: `ACCEPT`, `REVISE` or `STOP`.
