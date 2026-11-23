# Execution Report — UNO-WO-094 / R01

**STOPPED — the 404 blocker is solved; a frozen architecture rule now blocks the mandated product.**

This file replaces its previous contents under the one authorized overwrite. Two results matter. First, the defect that ended the last two runs is **fixed and proven on the real pinned Next 16.4.6**: an unknown address now returns a real `404` carrying the approved heading, sentence and literal `<a href="/">`, with no `__next_error__` shell, and the unchanged U01 gate passes **105/105**. Second, the multi-Site product that would consume that fix is blocked by a protected architecture assertion this ledger forbids me to edit: `tests/architecture/u01-boundaries.test.mjs` requires that `src/config/uno-serving.ts` contain **no occurrence of the substring `host` at all**. Host-qualified multi-Site placement cannot exist inside that constraint. The implementation was reverted rather than published with a rewritten test, a renamed evasion of the rule, or a red gate.

## 1. Authority and preflight

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-094 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **19,829 bytes**, SHA-256 `7c913a7c14d100543634744520a23a9507b5768a9bf300e0f59ce283b5c54a82` — exact match; sole ACTIVE; ignored, untracked, unstaged |
| Start | `8e8efd6d8cb0ae2d8a1e170be7dc36e4fe8e1900` — `HEAD`, `main`, `origin/main` and remote `main` equal |
| Physical | sole checkout (private path withheld), empty `--show-prefix`, one worktree, one `origin`, clean index and worktree |
| A2 | `A2-tracked.patch` `5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87`, `uno-family-links.test.ts` `1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f` — unchanged, unapplied |
| Declarations | `manifest.json` `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`, `uno.config.json` `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` — byte-identical at start and end; no fixture transaction was armed, so no fixture exists and nothing required restoration |

## 2. The 404 blocker is solved and proven

The authorized narrow refusal responder was implemented exactly as ordered: `src/proxy.ts` plus `src/config/uno-not-found-response.ts`, with the approved boundary additionally placed at `src/app/(site)/not-found.tsx`. The responder has only two outcomes — **continue** to the App Router, which keeps all of its own validation and the alias redirect, or **refuse** with the approved static document — and it never creates a 200, binds a Site, trusts a forwarded Host, rewrites a source path or sends an open redirect. `/`, `/_next`, owned media, `robots.txt`, `sitemap.xml`, the icon and every file-extension asset are excluded twice: by the declared matcher and by an explicit guard inside the responder.

Measured on real `next build && next start`, with `ƒ Proxy (Middleware)` present in the build output:

| Address | Status | `__next_error__` | Approved heading | `href="/"` |
| --- | --- | --- | --- | --- |
| `/does-not-exist-9f3` | 404 | absent | present | present |
| `/about` | 404 | absent | present | present |
| `/en-001` | 200 | absent | — | — |
| `/en` | 307 → `https://uno-starter.example/en-001` | — | — | — |
| `/` | 200 | absent | — | — |

The document is byte-stable static markup with `content-type: text/html; charset=utf-8`, `cache-control: no-store`, `noindex, nofollow` and a restrictive CSP, and it interpolates nothing, so no request value can be reflected. `pnpm test:http` reported **105 passed, 0 failed** — the unchanged U01 gate, with no U01 file, assertion or 404 copy edited.

## 3. Why the mandated product could not be published

The complete qualified runtime was built and green on every other gate: one authority validated once, `{host, pathname}` input under a strict grammar, exact comparison against configured origins only, Site identity threaded match → loader → planner with canonical equality enforced, per-Site locale policy, host-scoped discovery, media re-authorised per Host, host-scoped `robots.txt`/`sitemap.xml`, and the route tree adapted to the pinned segment names. `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm exec eslint . --max-warnings 0`, `pnpm test:bootstrap`, all **31** unit files plus the **2** new authorized unit files, and the U01 HTTP gate were all green.

`pnpm test:architecture` then reported **44 passed, 2 failed**, and both failures are frozen rules in the read-only architecture suite rather than defects in the change:

1. `tests/architecture/u01-boundaries.test.mjs:1304` — `for (const forbidden of ['process.env', 'headers(', 'cookies(', 'next/headers', 'x-forwarded', 'host'])`, message *"the composition must not read host"*. It is a substring test on `src/config/uno-serving.ts`, so an identifier, a field name or even a documented parameter named after the request authority fails it. Multi-Site placement requires exactly that value as its lookup key; the rule is the version-1 single-Site design decision, not an incidental detail.
2. `tests/architecture/u01-boundaries.test.mjs:1365` — the locale layout must call `resolveUnoServingLocaleTag`. This one is satisfiable (the layout can cross-check the requested locale key through that resolver) and is not the blocker.

Satisfying rule 1 inside this ledger is impossible. The two remaining routes are both forbidden: editing the architecture suite, or renaming the request authority to a token that evades a substring ban. The second would leave the suite green while destroying the rule it exists to enforce — the definition of weakening a mandatory gate — so it was not done. Nothing was published, and no test, assertion, threshold, workflow or permission was changed at any point.

## 4. Withdrawal

Every runtime file was restored from `8e8efd6` and every created file removed: `src/config/uno-serving.ts`, `src/config/uno-not-found-response.ts`, `src/proxy.ts`, `next.config.ts`, `src/app/robots.txt/route.ts`, `src/app/sitemap.xml/route.ts`, `src/app/uno-media/[...segments]/route.ts`, `src/app/(site)/[locale]/layout.tsx`, `src/app/(site)/[locale]/[[...segments]]/page.tsx`, `src/app/(site)/not-found.tsx`, `src/app/(site)/[locale]/[[...segments]]/not-found.tsx`, `tests/unit/uno-404-response.test.ts` and `tests/unit/efs-uno-multisite-serving.test.ts`. The worktree and index are clean at `8e8efd6d8cb0ae2d8a1e170be7dc36e4fe8e1900`, the committed route tree is back byte-identical, and both declarations and both A2 artifacts are unchanged.

No CI run is claimed for this run, because no product commit was made.

## 5. Requested disposition

One Owner/Architect decision unblocks the whole of P4–P6, and the solution is already proven. Revise `tests/architecture/u01-boundaries.test.mjs` lines 1299–1310 so the composition may accept a **validated request authority as an untrusted lookup key**, keeping every other rule intact: exactly one `process.cwd()`, no `process.env`, no `headers(`/`cookies(`, no `x-forwarded`, and no origin constructed from the request. Alternatively, authorize one additional named host-resolution module outside the composition. With that single amendment, the runtime described in §3 plus the proven §2 responder can be committed, and P6 can proceed in the same run without further design work.

Not requested: A2/M2 activation, stage closure, parity credit, merge, tag, release or deployment.
