# Execution Report — UNO-WO-099 / R01

**Authorized redirects now keep a bounded harmless query exactly, and refuse a hostile one with the approved 404: `GET /docs-old/de-de?ref=alpha%20beta&view=compact` answers `307` with `Location: https://abc.example/docs/de-de?ref=alpha%20beta&view=compact` in real production HTTP on both operating systems.**

| | |
| --- | --- |
| Order | `UNO-WO-099 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **26,450 bytes**, SHA-256 `5c68690c1474ef92e495b63666c096d3f06d4aa73c2066081ac5d09fb52c71a2` — exact, ignored/untracked |
| Starting SHA | `1d8c5771ea97c03148c69850e21c900e6e7111b2` — `HEAD == main == origin/main == ls-remote origin/main`; parent `ab4e91e2…` |
| **Product SHA** | **`bf1d530054b66441c53ba905ae450f6800d3f63c`** |
| Hosted | `Verify U01 baseline` run `45192043188` — **success**; `ubuntu-24.04` and `windows-2025`, 38 steps each |
| Hosted | `Uno Bootstrap Verify` run `45192042995` — **success** |
| Hosted P6 | **`154 passed, 0 failed`** on each leg, both fixture restorations verified byte-exactly; both P6 steps `success` on both legs |

## 1. Preflight and preservation

Verified before any write: empty `git rev-parse --show-prefix`, branch `main`, one worktree, one `origin` (the Uno repository only), clean index and tree, the four frozen governance blobs unchanged (`AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `sop-implementation.md` `f30d6590…`, `verify-bootstrap.yml` `caac7d65…`), every current product anchor matching the order byte for byte (`src/proxy.ts` `cd45922b…`, `src/config/uno-serving.ts` `9d0a6cf2…`, `src/config/uno-not-found-response.ts` `9928250f…`, runner `0a9174ab…`, contract `55223bdf…`, alias unit `e0a7e6f3…`, workflow `8d19319d…`), and the ACTIVE exact in size and digest.

Preserved before and after every build, transaction and at STOP: `deployment/efs/manifest.json` `b6213ed6ee2d…`, `deployment/uno.config.json` `58011c4324f5…`, A2 patch `5e40963895d2…` (90,536 B) and A2 test `1cdddb38a91b…` (17,405 B) — untouched and still unapplied — with zero `wo096-*` residue and a clean index after the product commit.

## 2. What was implemented

- **`src/config/uno-safe-redirect-query.ts` (new, pure).** One function, `validateUnoSafeRedirectQuery(raw)`, with fixed budgets — 512 suffix bytes, 8 parameters, 32-byte keys, 256-byte values — and a strict grammar: exactly `?key=value(&key=value)*`, a non-empty safe key, and a value of unreserved ASCII plus `%20`. Everything else is a closed refusal: any other percent triplet (`%0d`, `%0a`, `%00`, `%2f`, `%5c`, `%26`, `%3d`, `%25`, `%2e` and every recursion of them), raw controls, raw spaces, a second `?`, `#`, non-ASCII, malformed structure, empty parameters and oversize input. No Site, host, locale, file, clock, environment, header, cookie or network is read, and it cannot name a destination.

## 3. Real production evidence (both phases, both legs)

- `/docs-old/de-de?ref=alpha%20beta&view=compact` → `307`, `Location` exactly `https://abc.example/docs/de-de?ref=alpha%20beta&view=compact`, `cache-control: no-store`, no `+` downgrade.
- `/docs-old/de-de/notes?ref=alpha%20beta&view=compact` → `307` to the same Site's authored nested Page with the query intact.
- `docs.example/handbook/de-de?ref=alpha%20beta&view=compact` → `307` to the **configured** canonical host with the query intact.
- `/en?ref=alpha%20beta` → `307` to `https://abc.example/en-001?ref=alpha%20beta` — the short-language alias obeys the same rule on its own Site.
- `/docs/de-de?ref=alpha%20beta&view=compact` → `200`, same document, canonical still `https://abc.example/docs/de-de`; a query never changes identity, publication or metadata.
- `/docs-old/de-de?x=%0d%0aLocation:%20https://evil.example` → **approved 404**, no `Location`, no reflected bytes, no injected header.
- Encoded slash, encoded backslash, encoded `%`, encoded `&`, encoded `=`, a doubled `?` and a 600-byte value → each **approved 404** with no `Location`.
- `/docs-old/de-de?a=1#frag` → `307` to `https://abc.example/docs/de-de?a=1`: a fragment is never sent by an HTTP client, and none ever appears in a `Location`.
- Unchanged and still green: alias root refuses, lookalike prefix refuses, foreign Host refuses, undeclared locale refuses, the unlisted Page serves only its canonical `200 noindex` and is never an alias destination, and the canonical destination still serves its own document.
- Phase two — full sources re-installed, **no declared default**, **permuted bindings**, fresh build and fresh server — the safe-query alias still redirects to the owning canonical Site, the foreign Host still refuses, and all three Sites stay active.

## 4. Gates

| Gate | Result |
| --- | --- |
| `tests/unit/uno-safe-redirect-query.test.ts` (new, pure) | **PASS** — 13 tests: byte-exact `%20`, idempotent space spelling, order/duplicates preserved, exact byte and parameter budgets with the next byte refused, every encoded control/delimiter/recursion triplet, raw controls and spaces, open-redirect shapes, malformed structure, unsafe and oversized keys, non-string input, and no destination ever returned |
| `tests/deployment/u03-multisite-contract.test.mjs` | **PASS** — **32 tests**: all 23 previous cases retained, plus validator/edge/runner gates and 8 new mutations |
| Demonstrated red mutation (product) | Building the `Location` from the raw request query turned the committed-policy test **and** the corresponding mutation test red (30/32); the file was restored **byte-identically** (digest equal) and the suite returned to 32/32 |
| `node scripts/verify-u03-multisite-http.mjs` (local, twice) | **PASS** — **154 passed, 0 failed** (all 139 previous checks retained, 15 added), both phases, both restorations byte-exactly |
| `pnpm test:bootstrap` · governance test · governance verifier | PASS · PASS · PASS |
| `pnpm test:architecture` | PASS — 47/47, no new exception and no gate edit |
| `pnpm test` | **PASS** — **1,271 passed** |
| `pnpm lint` · `pnpm exec eslint . --max-warnings 0` · `pnpm typecheck` · `pnpm build` | PASS · PASS · PASS · PASS |
| `node scripts/verify-u03-trace.mjs --expect committed` | PASS |
| `pnpm test:http` · `node scripts/verify-u03-http.mjs` | **105/0** · **135/0** |
| `u03-fixture-transaction` · `u03-trace` · `u04-json-slice` tests | PASS · PASS · PASS |
| `node scripts/verify-u03-published-http.mjs` | **999 passed, 0 failed** |
| U04 JSON slice script · U04 22-module test and script · readiness test and script | PASS · PASS · PASS · PASS · PASS |
| Security floor · advisory-exception test and script · brand copy · `pnpm audit --prod --audit-level high` | PASS · PASS · PASS · PASS · **0** |

## 5. Disposition

Changed paths, exactly the ledger: `src/proxy.ts`, `src/config/uno-safe-redirect-query.ts` (new), `scripts/verify-u03-multisite-http.mjs`, `tests/deployment/u03-multisite-contract.test.mjs`, `tests/unit/uno-safe-redirect-query.test.ts` (new) — then this one report. No workflow, dependency, lockfile, declaration, governance, protected-repository or A2 change; no provider, DNS, merge, tag, release or deployment action; no stage closure or parity credit claimed.

Stated limits, not hidden: the framework erases the wire spelling of a space, so a client that literally sends `+` receives `%20` (semantic identity, one-way, idempotent); an alias root still refuses rather than inventing a locale; a duplicate alias declaration is still refused by the validator rather than resolved; and native-video byte-Range remains NOT APPLICABLE for a fixture that declares no video. Handing to the Architect for independent review: `ACCEPT`, `REVISE` or `STOP`.
