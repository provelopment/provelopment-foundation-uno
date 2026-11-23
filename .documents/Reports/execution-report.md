# Execution Report — UNO-WO-098 / R01

**The declared Site-address alias now routes: `https://abc.example/docs-old/de-de` answers a real `307` to `https://abc.example/docs/de-de` in production HTTP on both operating systems, with the original P6 assertions intact and green.**

| | |
| --- | --- |
| Order | `UNO-WO-098 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **25,433 bytes**, SHA-256 `54b61656da8f35c4d914707dab26e8e2adb42f1d4c7c6634970817c5aee44eaf` — exact match, ignored/untracked |
| Starting SHA | `08c5177eeb11263f675c2cac5037f6230940448c` — `HEAD`, `main`, `origin/main`, remote `main` equal; parent `729c585f…` |
| **Product SHA** | **`ab4e91e2e13357e8d08dd01721a21f497bf8a8fc`** |
| Hosted | `Verify U01 baseline` run `45186190308` — **success**; `ubuntu-24.04` + `windows-2025` both success, 38 steps each |
| Hosted | `Uno Bootstrap Verify` run `45186190078` — **success** |
| Both P6 steps | `Multi-Site P6 contract (mutation-sensitive)` and the three-Site two-phase runner — **success on both legs** |
| Hosted runner output | **`139 passed, 0 failed`** on each leg, **both** fixture restorations verified byte-exactly |

## 1. Preflight

Proven before any write: empty `git rev-parse --show-prefix`, branch `main`, exactly one worktree, exactly one `origin` (the Uno repository only), clean index and worktree, `HEAD == main == origin/main == ls-remote origin/main`, and the single ACTIVE ignored, untracked and unstaged in the four-slot WIP directory with the exact measured size and digest above.

Preserved by digest before **and** after every transaction and build: `deployment/efs/manifest.json` `b6213ed6ee2d…`, `deployment/uno.config.json` `58011c4324f5…`, A2 patch `5e40963895d2…` (90,536 B) and A2 test `1cdddb38a91b…` (17,405 B), both still unapplied; governance blobs `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `sop-implementation.md` `f30d6590…`, `verify-bootstrap.yml` `caac7d65…` unchanged, since no commit touched them.

## 2. What the implementation does

One authorized product file changed: `src/config/uno-serving.ts`. The alias layer is a **translation**, not a publisher.

- A request matches a declared alias only by **exact authority equality** against the alias origin and a **whole-segment** prefix: `/docs-old/de-de` matches, `/docs-older/de-de` does not, and a request on a Host the binding does not own matches nothing.
- The suffix is carried across unchanged and the **stored alias prefix is replaced by that same binding's stored canonical prefix**, so `/docs-old/de-de` becomes `/docs/de-de` and `/docs-old/de-de/notes` becomes `/docs/de-de/notes`. No locale, path or default is ever synthesised.
- The candidate is then planned through the **existing** qualified publication gate using the owning Site's **canonical host taken from its stored origin** — never the request authority — and becomes a redirect only if the plan is `served`, the Page is `public`, the planned `{facetId, siteId}` equals the translated owner, and the planned canonical URL equals the address assembled from stored values.
- The **canonical Page is always tried first**, so an alias can never displace an accepted canonical owner; then one declared-alias translation; only then the pre-existing single-segment short-language alias. A refused, unlisted, draft or absent target yields the ordinary refusal, never a redirect.
- Two declared aliases claiming one request are reported **ambiguous** and claim nothing; declaration order, array position and any `default` are never consulted. Alias roots (no suffix) claim nothing, so no locale is invented.
- Version 1 and every request without a version-2 alias are byte-equivalent to before: the alias resolver returns immediately for the legacy authority.

No edge file was needed: `src/app/(site)/[...segments]/page.tsx` already delivers `kind: "redirect"` through the App Router `redirect()`, which is what produces the observed `307`. `src/proxy.ts` is untouched and remains only the static refusal responder. No committed declaration, dependency, lockfile, workflow or governance file changed.

## 3. What this does **not** claim

- **Query bytes are not preserved.** The redirect target is the canonical URL only; request query bytes are neither forwarded nor reflected, and a hostile query cannot reach the `Location` header. This is stated, not silently assumed.
- **No alias appears in discovery.** No alias is a `<loc>`, `hreflang`, `x-default`, robots sitemap, navigational link or media locator; the sitemap assertion is unchanged and green.
- **No alias root routing.** `/docs-old` alone refuses, because naming a locale there would mean synthesising one.
- The second-host alias (`https://docs.example/handbook`) exists **only** in the temporary test fixture; no new committed domain was declared.
- A declaration that duplicates an address is still rejected by the validator (`config:duplicate-site-address`) rather than routed, so ambiguity at the declaration level refuses the whole declaration; the in-memory ambiguity path is unit-proven.

## 4. Evidence

| Gate | Result |
| --- | --- |
| `tests/unit/efs-uno-site-address-alias.test.ts` (new, pure, no scratch) | **PASS** — 10 tests: positive translation, nested suffix, whole-segment refusal, alias-root refusal, foreign authority/port, case-insensitivity, stored-origin destination, ambiguity in two orders, declaration-order independence, malformed/encoded/oversized input, no-alias declarations |
| `pnpm test` (full unit suite) | **PASS** — **1,258 passed** |
| `tests/deployment/u03-multisite-contract.test.mjs` | **PASS** — 23 tests: the **14 previous cases preserved unchanged**, plus 9 alias cases |
| Demonstrated red mutation (product) | Removing the `public` gate from `src/config/uno-serving.ts` turned the committed-source test **and** the mutation test red (2 failures); the file was then restored **byte-identically** (digest equal) and the suite returned to 23/23 |
| `node scripts/verify-u03-multisite-http.mjs` (local, twice) | **PASS** — **139 passed, 0 failed** (the 125 previous assertions retained, 14 added), both phases, both restorations byte-exactly |
| `pnpm test:bootstrap` · governance test · governance verifier | PASS · PASS · PASS |
| `pnpm test:architecture` | PASS |
| `pnpm lint` · `pnpm exec eslint . --max-warnings 0` | PASS · PASS |
| `pnpm typecheck` · `pnpm build` | PASS · PASS |
| `node scripts/verify-u03-trace.mjs --expect committed` | PASS |
| `pnpm test:http` | PASS — **105 passed, 0 failed** |
| `node scripts/verify-u03-http.mjs` | PASS — **135 passed, 0 failed** |
| `u03-fixture-transaction` · `u03-trace` · `u04-json-slice` tests | PASS · PASS · PASS |
| `node scripts/verify-u03-published-http.mjs` | PASS — **999 passed, 0 failed** |
| U04 JSON slice script · U04 22-module test and script | PASS · PASS · PASS |
| Deployment-readiness test and script | PASS · PASS |
| Security-floor · advisory-exception test and script · brand-copy | PASS · PASS · PASS · PASS |

The real production proof, from the runner's own output on both hosted legs: `/docs-old/de-de` → `307` with `Location: https://abc.example/docs/de-de`; `/docs-old/de-de/notes` → the same Site's authored nested Page; `docs.example/handbook/de-de` → the configured canonical host, not the request host; `/docs-old` and `/docs-older/de-de` and `/docs-old/en-001` → the approved 404; the `docs.example` alias on an unowned Host → 404; `/docs-old/de-de/privacy` (unlisted) → 404 while `/docs/de-de/privacy` still serves `200` with `noindex`; a hostile encoded query → a clean `307` with no reflected bytes; the canonical `/docs/de-de` still serves its own document and canonical URL; and with **no declared default in a permuted declaration order** the alias still redirects to the same canonical address.

## 5. Preservation and disposition

Declarations restored to `b6213ed6ee2d…` / `58011c4324f5…`; A2 artifacts intact and unapplied; zero `wo096-*` residue; clean index with only the four ledger paths committed and one report path pending; no provider, DNS, deployment, merge, tag or release action; no A2/M2 execution; no stage closure or parity credit claimed.

Remaining U02/U03 gaps, stated plainly: alias roots never redirect, request query bytes are dropped rather than preserved, and a duplicate alias declaration is refused by the validator instead of being resolved. Handing to the Architect for independent review: `ACCEPT`, `REVISE` or `STOP`; the stage decision belongs to the Owner.
