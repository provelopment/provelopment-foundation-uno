# UNO-WO-050 / R01 — STOPPED: `generated`-zone asset blocks the published document envelope

**Disposition: STOPPED, no functional delivery landed. Tree restored to `91ead2c34abd6084cd1affb274567543e4bbca6f`,
zero entries, declarations at `ba232d46…` / `4f656c93…`. U04 remains OPEN.**

## 1. Authority and preconditions (verified)

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-050 / R01`, `FINAL — EXECUTE` |
| Private ACTIVE | 30,634 bytes, SHA-256 `55c91152bb4098cc185bfa5828fc1cc2947d67c45a810be4c3db149120a80868` — matches; ignored, untracked, in no ref |
| Start `main` | `91ead2c34abd6084cd1affb274567543e4bbca6f` at `HEAD`, `main`, `origin/main`, `ls-remote` |
| Checkout | one checkout, one worktree, one branch `main`, one `origin`, no stash |

## 2. Correction of the WO-049 diagnosis — confirmed

The Order was right that `readUnoServingMedia` collapses distinct outcomes. Replacing that probe with the trusted stages
gave a different, specific answer:

| Trusted stage | Result |
| --- | --- |
| `readUnoPageDocument(in-memory document)` | **accepted** |
| `readUnoPageDocument(exact pretty-printed JSON text)` | **accepted, equivalent** |
| `readUnoOwnedAssetRef` × 8 named refs (real purposes) | **accepted** |
| `readUnoOwnedMedia`, signature preflight (`full:false` for video) | **8/8 accepted** |
| `readUnoOwnedMedia`, `full:true` for MP4 and WebM | **accepted** |
| `planUnoPageAssets(...)` on the extended Page | **`planned`** — every zone and both native containers projected |
| `planUnoServingPage("/en-001/wo044-all-modules")` | **`not-served` / `serving:renderer-unavailable`** |

So the media contract is **not** the blocker. In committed `src/config/uno-serving.ts` the only path to
`renderer-unavailable` after an accepted plan is line 262: `planned.document.pageDocument === undefined`, i.e. the
**published planner produced a JSON envelope without a validated `pageDocument`** while the same document text validates
when passed to `readUnoPageDocument` directly.

## 3. Single-variable bisect (each a fresh process, restored fixture)

| Appended sections | Serving result |
| --- | --- |
| `wo050-page-image` + `wo050-native-mp4` | **served** — runner `172 passed, 0 failed` |
| `+ wo050-theme-image` | **served** — `172 passed, 0 failed` |
| `+ wo050-platform-image` | **served** — `172 passed, 0 failed` |
| `+ wo050-generated-image` (`integrity` = SHA-256 of its exact bytes) | **`serving:renderer-unavailable`** |

`generated` is the sole discriminator. Its bytes, digest, reference shape, signature preflight, full read and asset-plan
projection all pass, so the refusal is confined to the **published document envelope** for an authored `generated`-zone
asset, not to the media reader, the zone root, the occurrence planner or the route.

The native MP4 container plus one page-owned plate, theme plate and platform plate are therefore proven to serve end to end
through the real Next production build, real HTTP and the real Chromium phase — those runs printed `172 passed, 0 failed`
with the retained 147 checks intact.

## 4. Why execution stopped here

Narrowing the envelope refusal needs `planUnoPublishedPage` internals (`pageDocumentRefusal` visibility) and then a product
decision on whether an authored `generated`-zone asset is admissible in a published JSON Page at all — a T03/T07 boundary
question, not a fixture question. Landing that change without the full local battery and both-host CI could not be
completed inside this run, and the Order forbids an unverified functional commit, so no product file was committed.

All trial work lived only in T01 and was discarded: `git checkout -- scripts/verify-u04-22-module-consent.mjs`. Every
fixture was created exclusively (`wx`), digest-verified on read-back, and removed in `finally`; both declarations were
re-verified at their pinned digests after every attempt. No `git restore/checkout/reset` was used for fixture rollback and
no owner file was overwritten.

## 5. Remaining obligations

1. Resolve the `generated`-zone published-envelope refusal (T03 or T07, reason-coded first).
2. Re-add `wo050-native-webm` and prove the shared owned VTT contributes two distinct occurrences.
3. `FOUR_ZONE_HTTP=4/4` positive GET/HEAD/range-ignored proof, then MP4/WebM GET/HEAD/206/416/VTT/poster.
4. The 16 viewport/colour-scheme/motion Chromium combinations with keyboard, focus, modal, tab, carousel and consent
   assertions.
5. Hermetic mutations for all of the above; full local battery; both-host CI.

**No self-acceptance claimed.** U04 remains OPEN; no release, tag, merge, deployment, provider or stage-closure action was
taken.