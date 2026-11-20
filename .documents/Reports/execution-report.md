# UNO-WO-049 / R01 — STOPPED: four-zone Page refused at publication before any build

**Status: STOPPED, no functional delivery. Working tree restored to `1e547c55c33cab13516252875fce4fa0d4d90dd5`,
zero entries, declarations at their pinned digests. U04 remains OPEN.**

## 1. Authority and starting state (verified)

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-049 / R01`, `FINAL — EXECUTE` |
| Private ACTIVE | 31,045 bytes, SHA-256 `7f5777cd69e09ff290c600a875d596698f2d35687226dfc277fad637df1ae268` — matches; ignored, untracked, in no ref |
| Start `main` | `1e547c55c33cab13516252875fce4fa0d4d90dd5` at `HEAD`, `main`, `origin/main`, `ls-remote` |
| Checkout | one checkout, one worktree, one branch `main`, one `origin`, no stash |
| Final tree | 0 entries, 0 staged |

## 2. What was attempted (single ledger path, never committed)

All work was in authorised path A01, `scripts/verify-u04-22-module-consent.mjs`, and was discarded before handback:

- Seven named test-owned inputs created with exclusive/no-overwrite semantics and digest-verified on write: page-zone
  `wo049-native.mp4` (28-byte `ftyp` box), `wo049-native.webm` (EBML header naming its DocType), `wo049-native.vtt`
  (`WEBVTT` + one cue), `wo049-native-poster.png`; theme `wo049-theme.png`; platform `wo049-platform.png`; generated
  `wo049-generated.png` with its exact SHA-256 as `integrity`.
- Five accepted v1 sections appended to the existing 22-ID Page: `wo049-theme-image`, `wo049-platform-image`,
  `wo049-generated-image`, `wo049-native-mp4`, `wo049-native-webm` (native mode, no `source` literal).
- A pre-build probe of the real serving composition and of the real adapter for all seven refs.

## 3. The blocking finding

| Evidence | Result |
| --- | --- |
| `readUnoPageDocument` on the extended 22-ID document | **accepted** |
| `readUnoOwnedAssetRef` for all seven authored refs | **accepted** |
| `readUnoOwnedMedia` for theme, platform, generated, MP4, WebM, VTT, poster | **7/7 read** under their frozen zone roots |
| `readUnoServingMedia(["en-001","wo044-all-modules","0"])` before any build | **`serving:publication-refused`** |
| Real production HTTP for the fixture Page | **404** (whole Page refused, not one module) |

The document is valid and every declared asset is physically readable, yet the **publication/planning stage** refuses the
Page. `serving:publication-refused` is returned from two distinct internal sites (document load and plan), so the refusal
family could not be localised from the served surface, which is deliberately closed.

Localising it needs repeated fixture install/build cycles in which a refusal is indistinguishable from a defect until the
Page serves. Two such cycles did leave the fixture installed when the probe threw; both were recovered from the
transaction's own `.temp/tx-*/…original` recovery copies with the declarations verified back to `ba232d46…` / `4f656c93…`,
and the enumerated `wo049-*`/`wo044-*` fixtures removed. No `git restore/checkout/reset` was used as a fixture rollback.
Continuing that loop inside this order would have risked handing back a contaminated declaration set, so execution stopped
as the order permits.

## 4. Not delivered

1. `FOUR_ZONE_HTTP=4/4` — no four-zone positive GET/HEAD proof exists.
2. `NATIVE_VIDEO_HTTP=MP4+WEBM+VTT+POSTER` — no native GET/HEAD/206/416/VTT/poster proof exists.
3. The 16-way viewport/theme/motion matrix and its interaction assertions — not attempted, because Phase A never passed.
4. Strengthened hermetic mutations for the above — not attempted.

Nothing was claimed as passing, no check was weakened or skipped, and no product file, test, workflow, declaration or
provider setting was changed.

## 5. Required next step

The blocker is a publication/projection refusal of an accepted document that declares theme, platform and generated
occurrences plus two native video containers (the two containers share one owned VTT, which the order explicitly permits).
A new Owner order should authorise **A07/A05 diagnosis with a temporary, non-destructive instrumented probe** of
`planUnoPublishedPage`/`planUnoPageAssets` (reason-code visibility at the two internal sites), or authorise the specific
product fix once the refusing family is named. Until then the four-zone, native-video and matrix obligations stand.

**Disposition: STOPPED. No self-acceptance claimed.**