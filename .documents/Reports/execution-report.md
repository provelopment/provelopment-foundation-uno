# UNO-WO-048 / R01 — Native-video transport, fail-closed readiness, honest scope

**Status: PARTIAL DELIVERY — product landed and green on both hosts; the four-zone and viewport-matrix portions of this
order are NOT delivered. U04 remains OPEN.**

## 1. Authority and physical facts

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-048 / R01`, `FINAL — EXECUTE` |
| Private ACTIVE | 33,815 bytes, SHA-256 `eccf3532175de2c02116b739eba9267b48c5a3f17d73790de142e723f9965e56` — matches the activation; ignored, untracked, in no ref |
| Starting `main` | `cc00926041b8e4afded4d065b84cf90091ab3547` at `HEAD`, `main`, `origin/main`, `ls-remote` |
| Checkout | one checkout, one worktree, one branch `main`, one `origin`, no stash |
| **Product SHA** | **`ae2435869b84b53b051e4b924b9721e05cc230be`** |
| Final `git status` | **0 entries** |

## 2. Changed-path ledger (5 tracked edits, all in ledger)

| # | Path | Change |
|---|---|---|
| 01 | `src/app/uno-media/[...segments]/route.ts` | Explicit `HEAD` from the identical authorisation and media preflight (no body); `accept-ranges: bytes` and one bounded RFC single range for authorised `video/mp4`/`video/webm` only; `206` exact slice with `content-range`; `416` metadata-only (`content-range` names only the total) for malformed, reversed, suffix-zero, overflowing or multi-range; `If-Range` ignored because no validator is published; non-video ignores a range; unauthorised locator is a closed `404` decided before any range or size. Existing MIME, `nosniff`, no-referrer, `default-src none; sandbox` and cache policy preserved; no CORS added. |
| 11 | `scripts/verify-u04-22-module-consent.mjs` | Real production-HTTP owned-media phase: locator read from the served Page, authorised `200` with allowlisted MIME and PNG signature, served bytes byte-identical to the fixture plate, `HEAD` 200 with empty body, non-video does not advertise ranges and ignores a range, unauthorised locator `404` before range inspection with no bytes, out-of-range occurrence `404`. |
| 12 | `tests/deployment/u04-22-module-consent.test.mjs` | Eight new `REQUIRED` invariants so the media phase cannot be deleted from the runner. |
| 13 | `scripts/verify-vercel-readiness.mjs` | New reason codes `workflow:no-u04-consent-unit`, `workflow:no-u04-consent-browser`, `workflow:u04-consent-env`; per-step block reading so a comment, passive mention or wrong entry cannot satisfy the gate; per-step browser-path enforcement replacing the old global occurrence count. |
| 14 | `tests/deployment/verify-vercel-readiness.test.mjs` | Fixture workflow updated to the committed workflow; three unique negative mutations (deleted hermetic step, muted browser step, missing pinned browser path); the browser-path mutation retargeted to the steps that own the path. |

No new file was created, no frozen governance or deployment authority was touched, and the capability registry still holds
exactly twenty-two IDs.

## 3. Local verification

PASS (exit 0): `pnpm typecheck`, `eslint . --max-warnings 0`, `pnpm test:architecture`, bare `pnpm test`
(**870/870, 29 files**), `pnpm test:bootstrap`, governance test and script, security guard plus its mutation suite,
`node26-security-floor`, `u03-fixture-transaction`, `u03-trace`, the 464 hermetic guard, the 130 hermetic guard,
readiness CLI (**132 checks**) and its suite, `pnpm build`, `verify-u03-trace --expect committed`,
`verify-u04-json-slice` (**464/464**), `verify-u03-published-http` (**542/542**),
`verify-u04-22-module-consent` (**147/147**, up from 130), `verify-u01-http` (**103/103**) and `verify-u03-http`
(**91/91**) — the last two re-run **after** both fixture suites restored the declarations and the committed build was
rebuilt, with `/en` a genuine 404 throughout.

Declarations byte-identical before and after every fixture (`ba232d46…`, `4f656c93…`), no `wo04*` residue, nothing
staged by any runner.

## 4. Hosted CI at the product head `ae24358`

| Workflow | Run | Result |
| --- | --- | --- |
| Uno Bootstrap Verify | `44645421989` | **success** |
| Verify U01 baseline | `44645422037` | **success** |

Jobs `verify (ubuntu-24.04)` `135986635992` and `verify (windows-2025)` `135986636349` are both **success**, each with
successful architecture, unit, English production HTTP, U03 refusal HTTP, **U04 22-module hermetic guard**, **U04
22-module real production HTTP and Chromium gate**, readiness fixtures and readiness CLI. Nothing muted or tolerated.

## 5. NOT delivered in this run (explicit)

1. **Four-zone production media proof** (§3.1/§3.2): only the `page` zone is exercised. `theme`, `platform` and
   `generated` have no served-occurrence proof in this gate.
2. **Native-video HTTP transport proof**: the route implements `206`/`416`/`HEAD` for video, but this fixture contains no
   `video/mp4` or `video/webm` occurrence, so those paths are **implemented and unit-shape-checked only — not proved over
   HTTP**. No decoded playback is claimed anywhere.
3. **VTT/poster over HTTP**, and the **320/390/768/1280 × light/dark × normal/reduced 16-combination matrix** with
   interaction keyboard/mouse coverage (§4 accessibility/matrix): not implemented in the runner this run.
4. Consequently the order's headline goal — “all FOUR owned-asset zones genuinely serve” — is **not** met.

## 6. Remaining U04 obligations

Four-zone served-occurrence proof and the exhaustive four-zone fault matrix; native video range/HEAD/VTT/poster proof
(and a decodable transport fixture); the full viewport/theme/motion and interaction matrix; the **17 Foundation-family
compositions (0/17)**; installation/presentation shell. `media.map`, geolocation, sensors, BLE and Wi-Fi positioning
remain explicitly out of scope. U04 is OPEN; no release, tag, merge, manual deployment or Drive edit was made.

**Requested disposition: ACCEPT / REVISE / STOP.** No self-acceptance is claimed.