# Execution Report — UNO-WO-054 / R01

**Status: the sixteen-case U04 browser matrix is implemented, executed and published. U04 remains OPEN.**

## 1. Activation and guards

| Item | Observed |
| --- | --- |
| ACTIVE | `.documents/WIP/workorder-active.md`, **27,569 bytes**, SHA-256 `ce45a6e5155a881ce9bc7d4c8a9b7c3933e1020788b34d77aa6dc4174255aca3` — matches the activation; ignored, untracked, unstaged |
| Starting `HEAD` = `main` = `origin/main` | `27ec4474276efbd6d7bc93e2fdb636ce1c661743` |
| Baseline blobs | T01 `e8df3f26…8371`, T02 `dc7cb7b8…b1bd` |
| Checkouts / worktrees / branches / remotes / stash | 1 / 1 / 1 (`main`) / 1 (`origin`) / none |
| Baseline guard before editing | `node --test …u04-22-module-consent.test.mjs` — 14 pass, 0 fail |
| Pinned declarations | `ba232d46…e3f0`, `4f656c93…9a0c` — unchanged throughout |
| Existing gates preserved | `FOUR_ZONE_HTTP=4/4`, `NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER`, `INSTALL_PARITY`, `LOAD_PARITY`, `SERVING_SERVED`, 22 IDs, four providers — all still present and passing |

## 2. Changed paths

- `scripts/verify-u04-22-module-consent.mjs` (T01)
- `tests/deployment/u04-22-module-consent.test.mjs` (T02)

Nothing else. No production source, declaration, module, provider, workflow, dependency or governance file changed.

## 3. The executed matrix

`node scripts/verify-u04-22-module-consent.mjs` (real `next build`, real loopback server, real Chromium): **565 passed, 0 failed**.

Sixteen distinct `MATRIX_CASE … PASS` lines, each a fresh navigation at the requested width with emulated colour scheme and motion:

| Case | Result | Case | Result |
| --- | --- | --- | --- |
| 320/light/no-preference | PASS | 768/light/no-preference | PASS |
| 320/light/reduce | PASS | 768/light/reduce | PASS |
| 320/dark/no-preference | PASS | 768/dark/no-preference | PASS |
| 320/dark/reduce | PASS | 768/dark/reduce | PASS |
| 390/light/no-preference | PASS | 1280/light/no-preference | PASS |
| 390/light/reduce | PASS | 1280/light/reduce | PASS |
| 390/dark/no-preference | PASS | 1280/dark/no-preference | PASS |
| 390/dark/reduce | PASS | 1280/dark/reduce | PASS |

`BROWSER_MATRIX 16 distinct case IDs` PASS · **`BROWSER_MATRIX=16/16` PASS**.

Per case, measured rather than assumed: `innerWidth` equals the requested width; `matchMedia` reports the emulated scheme and motion; `scrollWidth − clientWidth ≤ 2`; exactly one `main` and one `h1`; prose text present, visible, with computed colour and a body background; `#wo044-motion` computes `animation-name: none` under reduce and `uno-json-fade` otherwise; exactly two `.uno-json-video video` elements with `controls`, no `autoplay`, owned `/uno-media/en-001/wo044-all-modules/<n>` source, `kind="captions"` track and poster, distinct sources; tabs respond to `ArrowRight` (B selected, focused, B panel visible, A hidden) and `Home` (A restored and focused); accordion opens with `Enter` and closes with `Space`; modal opens, `Escape` closes it and focus returns to the trigger; carousel live status moves `Image 1 of 2 → 2 of 2 → 1 of 2`; zero iframes and zero provider requests before consent, exactly one governed YouTube frame and one intercepted provider request after activation, then unload removes the frame and returns focus to the consent control.

Two harness corrections were needed and are disclosed: provider frames are now fulfilled with `cache-control: no-store` so every activation is a real intercepted request rather than a memory-cache hit, and the arming window now spans the observed request instead of ending at iframe attachment. Both are test-harness changes; no product code was altered and no assertion was weakened.

## 4. Guard

`node --test tests/deployment/u04-22-module-consent.test.mjs` — **19 pass, 0 fail**: the fourteen Phase A cases plus five Phase B families that each mutate the runner and must change `audit()` — removing a width, `dark`, `reduce`, `emulateMedia`, `MATRIX_URL` navigation, overflow or reduced-motion checks, `ArrowRight`/`Home`/accordion/modal/carousel assertions, consent/unload/native-media coverage, and weakening `matrixPassed`, `MATRIX_CASE` or the `BROWSER_MATRIX=16/16` gate. `PHASE_B_REQUIRED` is audited alongside `REQUIRED` and `PHASE_A_REQUIRED`.

## 5. Local battery (final bytes)

`pnpm test`, `test:architecture`, `typecheck`, `lint`, `test:bootstrap`, readiness test + CLI, security test + CLI, node26 floor, u03 fixture transaction, u03 trace test, u04 slice test + CLI, `verify-u03-published-http`, `pnpm build` (after all fixture restorations), `verify-u03-trace --expect committed`, `pnpm test:http`, `verify-u03-http` — **all green**; `BATTERY_FAILED=` empty. Security posture unchanged: 0 waivers, 0 raw HIGH/critical, clean production audit; `picomatch ≤ 4.0.7` disclosed, not repaired.

## 6. Restoration and residue

Each runner run installed and restored both declarations through `prepareUnoU03FixtureTransaction` and removed every `wo052-*`/`wo053-*` file via the `createdMedia` ledger after digest verification. After the battery: **0** `wo052-*`/`wo053-*` files outside ignored `.next`, declarations back to `ba232d46…e3f0` / `4f656c93…9a0c`.

## 7. Published heads

| SHA | Content | Uno Bootstrap Verify | Verify U01 baseline |
| --- | --- | --- | --- |
| `973a787838726474908aa915ce914483a846e6f5` | **product (Phase B)** | `44716726002` ubuntu ✅ windows ✅ | `44716726048` ubuntu ✅ windows ✅ |
| report head | this report only | see handback | see handback |

No skip, mute, `continue-on-error` or bypass exists in either workflow. No decoded-playback claim is made for the synthetic MP4/WebM fixtures, and no WCAG contrast ratio is claimed from computed colour strings.

## 8. Remaining

The 17 Foundation family compositions and the neutral installation shell remain outstanding for later U04 work. No map, geolocation, BLE, Wi-Fi or fleet surface, no 23rd module, no stage closure, merge, tag, release, manual deployment or provider setting was added or changed.

**U04 OPEN.**
