# Execution Report — UNO-WO-096 / R01

**P6 NOT DELIVERED. NO PRODUCT COMMIT. NO HOSTED RUN.**

This run built the complete three-Site fixture and the G01–G05 runner and executed it against a real production build and a real Chromium, but the runner reports **119 passed, 1 failed**, and that failure is a measured product defect rather than a test defect. Because the work order forbids publishing a red candidate and forbids wiring a failing step into CI, the mandatory local battery and both hosted workflows were **not** run and are **not** claimed. The one substantive artefact is committed as inspectable test code only; no CI step, gate, workflow, product source or declaration was changed.

## 1. Authority, preflight and boundaries

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-096 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **23,596 bytes**, SHA-256 `5a368737e21e69836f15ac4736a06303062f113cf3d5bea68fb56bd248b9af7d` — exact match |
| Start | `8449c4417d9f647800210d4c7f7d8e353009a1e1` — `HEAD`, `main`, `origin/main` and remote `main` equal; clean tree |
| Physical | sole checkout (private path withheld), one worktree, one `origin` |
| Declarations | `manifest.json` `b6213ed6…c9925`, `uno.config.json` `58011c43…8c952` — proved before and after every fixture, restored byte-exactly |
| A2 | `5e409638…0ffaf87` and `1cdddb38…070cf70f` — unchanged, unapplied, asserted by the runner itself |
| Governance | `AGENTS.md`, `README.md`, SOP blobs and the bootstrap workflow untouched |


## 2. What was built

`scripts/verify-u03-multisite-http.mjs` is one test-only orchestrator. It installs a three-Site version-2 fixture through the **existing** `prepareUnoU03FixtureTransaction` (its writes are never reimplemented), runs a real `next build` and a real `next start` on an ephemeral loopback port, and proves G01–G05 over that process. Requests use `node:http` directly so a synthetic `Host` is genuinely sent, because `fetch` forbids setting `Host`. Chromium cannot be given a per-navigation Host, so navigation uses the fixture origin while every request is intercepted and forwarded to `127.0.0.1` carrying the real Host: a real DOM, real CSS, real focus and layout over a loopback socket, and no DNS resolution of `example` at any point.

The fixture is one synthetic Entity, two Facets and three simultaneously active Sites: `corporate/main` at `abc.example` (root), `corporate/docs` at `abc.example/docs` (same Host, whole-segment prefix, one declared address alias) and `services/main` at `xyz.example` (unrelated Host, same `siteId`). Distinct authored locales (`de-DE`, `en-001`), an explicit default naming `services/main` while the requests arrive on `abc.example`, twelve `wo096-*` content files, an invalid preferred JSON beside a valid Markdown sibling, a genuinely absent preferred JSON, an unlisted Page, a draft Page and a nested two-segment Page. Three `wo096-*` plates reuse the committed plate bytes at distinct owned paths inside the existing `page` zone; the runner creates those three directories only when absent and prunes them only when empty.

## 3. Measured result

`next build` of the three-Site fixture: success. Real production server on loopback: started and answered. **120 assertions: 119 passed, 1 failed.** Restoration: verified byte-exactly. Fixture residue: none. A2 hashes: unchanged.

Representative passing evidence: three 200s for `/de-de` and `/docs/de-de` on `abc.example` and `/en-001` on `xyz.example`, each with its own canonical origin, title and body fingerprint; the same slug and locale under two Facets differing by origin and by body; JSON and Markdown both served as authored; a nested Page served at its nested address and refused at its parent; an unlisted Page directly reachable with `noindex, nofollow`; a draft refused with its text never leaking; an invalid preferred JSON refused with the Markdown not rescuing it; a genuinely absent JSON leaving Markdown serving; per-Host `robots.txt` and `sitemap.xml` listing only their own Sites and never an unlisted, draft or aliased address, and never an unreachable prefixed sitemap; `og:url` equal to canonical; `en → /en-001` redirecting on its own Site and never into `/docs`; unknown, lookalike, port-suffixed, punycode and duplicated authorities all refused with the approved 404 document and no filesystem path; the uniquely owned media served as `image/png` with exactly the committed bytes, HEAD without a body, and a locator two same-Host Sites both own refused rather than guessed; and real Chromium assertions for title, language, canonical, `og:url`, native Markdown semantics, four viewports without horizontal overflow, dark and reduced-motion preferences, a no-JavaScript 404 that still shows the literal `href="/"`, and no console error or foreign request.

## 4. The one failure, and why it stopped the run

> `G01 with no declared default every Site stays active` — a second fixture phase installs the same three bindings with the `default` entry removed, starts a fresh production server, and requests `/de-de` on `abc.example`. The answer is **404** (the approved refusal), not a Page.

The design record states that an explicit default is optional and nonexclusive and that with several Sites and no `default` every Site stays active, and `src/core/efs/uno-config.ts` documents exactly that. The measurement contradicts the documentation: with the default removed the qualified authority refuses the whole declaration, so no Site answers. That is a product defect in the multi-Site composition, not a fixture error, and the order classifies such a defect as repairable inside its own bounded ledger.

Publishing that state would either put a failing step into Ubuntu and Windows CI or require the two new steps to be added unrun or non-blocking, both explicitly forbidden. Neither happened.

## 5. Deliberately not done

- No `.github/workflows/verify-u01.yml` change: the two blocking steps were not added because the runner they would invoke is still red, and adding them unrun or non-blocking is forbidden. The bootstrap workflow and its pinned blob are unchanged.
- No `tests/deployment/u03-multisite-contract.test.mjs`: a mutation contract must certify a runner that passes, and the ledger forbids fabricated labels to raise a pass count.
- The mandatory local battery was **not** run beyond one gate: `pnpm test:architecture` was executed and passes with the single authorized importer addition. No unit, bootstrap, governance, lint, typecheck, trace, U01/U03/U04 HTTP or published-HTTP gate was executed on this candidate. Its last known green state is product SHA `7eb8f784…`, which this run did not touch and which remains published and green on both operating systems.
- No A2/M2, stage closure, merge, release, deployment, DNS or provider action. No product source, declaration or gate was altered.

## 6. Requested disposition

The blocker is now narrow and precisely measured: a version-2 declaration with several Sites and **no** `default` must leave every Site active, exactly as the design record and `uno-config.ts` already state. Under this order that repair sits inside ledger C (`src/config/uno-serving.ts`, `src/core/efs/uno-route-address.ts`, `src/core/efs/uno-config.ts`) and needs a regression test plus a rerun of this runner to 120 of 120; the contract suite, the two blocking CI steps and the full battery then follow. An order that names that repair as its scope, or confirms it is in scope for a continued WO-096, lets P6 finish without re-deriving any of this work: the fixture, the G01–G05 runner, the Chromium transport, the restoration guard and the measured failure are all reproducible from the committed script.
