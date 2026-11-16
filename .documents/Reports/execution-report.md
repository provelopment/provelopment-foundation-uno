# UNO-WO-020 / R01 — U03 physically confined source reader and declared-source integration

**Order:** `UNO-WO-020 / R01` · FINAL — EXECUTE · **Activated order bytes:** 26,143 bytes, SHA-256
`3a2b7f5fb8748ed8dcd9bd39cade14745f3ac6651c7720e0900452aa64553c03` (verified before any work).
**Required start:** `08eaefc13bde945ec8a2f1bbd685ff0c4681190a` — matched `origin/main`, clean tree, one
worktree; all 24 pinned start guards matched.
**Stage:** U00, U01, U02 **CLOSED**; **U03 OPEN**. No closure, publication, route activation, release or
later stage is claimed.
**Provider write actions by the Agent: ZERO.**

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `REAL_CONFINED_READER` | **PASS** | `src/adapters/efs/uno-confined-source-reader.ts`, 30,816 B, blob `3321c485…`; Node `fs`/`path` only, no framework, provider, app or deployment import |
| `REAL_FILESYSTEM_EVIDENCE` | **PASS** | The committed `deployment/efs/content/home.en-001.md` (2,085 bytes, SHA-256 `2ffd423d…7513`) is opened and returned byte-identically; the payload changes when the on-disk fixture is edited |
| `PHYSICAL_CONFINEMENT` | **PASS** | Symlink/junction refusal on every component (intermediate, final and content root), realpath containment, regular-file check, `O_NOFOLLOW` where supported, post-open identity and size re-check |
| `BOUNDED_READS` | **PASS** | 128 KiB manifest, 8 KiB selection, 64 KiB content; exactly-at-cap accepted by design, cap+1 refused; growth after stat still refused |
| `STRICT_UTF8_AND_CONTENT` | **PASS** | Fatal `TextDecoder`; NUL/control refused; Markdown heading/body/raw-HTML rules; JSON object/parse/prototype/depth/width rules |
| `JSON_BEFORE_MARKDOWN` | **PASS** | Decided by the existing `resolveDeclaredPageSource` use case; JSON wins even when Markdown is declared first, invalid JSON aborts before Markdown, absent JSON may fall through |
| `NON_PUBLICATION` | **PASS** | Adapter imported only by its two test files; build route table still `/`, `/_not-found`, `/icon.svg`; zero `en-001` occurrences in build output; `/en-001` remains a 404 |
| `EXISTING_SITE_PRESERVED` | **PASS** | 19 immutable paths blob-identical including page, layout, CSS, both SVGs, manifest, selection, Home Markdown, workflows, scripts, governance |
| `LOCAL_GATES` | **PASS** | §6 — unit **455**, HTTP 103, readiness 100, fixtures 66, brand 29, security 16, architecture **20**, bootstrap 19, governance 6, lint 0/0, build 3 routes |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | §7 — four jobs, both hosts, zero non-success steps |
| `PROVIDER_INSPECTION` | **UNVERIFIED** | No Vercel tool exists in this session (discovery returned only GitLab, GitHub and Sentry, none connected); nothing was read and no connection was initiated |
| `STAGE` | U03 **OPEN** | No stage transition, credit or release is asserted here |

## 2. The two authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`6f03e6d0b8a133b460bdcd1870b476fed9844c20`** | exactly seven ledger paths; direct child of `08eaefc` |
| Report | the report-only child of the product commit; its SHA is in the Owner handback | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Before → after blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/adapters/efs/uno-confined-source-reader.ts` | CREATE | *(absent)* → `3321c485…` | 30,816 |
| 2 | `tests/unit/efs-confined-source-reader.test.ts` | CREATE | *(absent)* → `6721ee4a…` | 20,965 |
| 3 | `tests/unit/efs-source-resolution-pipeline.test.ts` | CREATE | *(absent)* → `3877007d…` | 19,086 |
| 4 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | `23060855…` → `09985b01…` | 27,464 |
| 5 | `.documents/WIP/plan-roadmap.md` | EDIT | `87847654…` → `30c6d42f…` | 8,394 |
| 6 | `.documents/WIP/plan-next.md` | OVERWRITE | `08fbf365…` → `a2315b2e…` | 1,232 |
| 7 | `.documents/Architecture/source-inventory.md` | EDIT | `5fbee6d1…` → `4a387437…` | 100,379 |

No other tracked path changed in the product commit. `src/app/**`, `src/core/**`, `src/application/**`,
`public/**`, `deployment/**`, `scripts/**`, `package.json`, the lockfile, both workflows and every frozen
governance file are byte-identical. Scratch stayed inside the ignored `.temp/` root and is neither staged
nor required.

## 3. Actual filesystem-read evidence

The committed Home source is really read, not assumed:

| Observation | Value |
| --- | --- |
| Declared candidate | `deployment/efs/content/home.en-001.md`, kind `markdown` |
| File on disk | 2,085 bytes, SHA-256 `2ffd423d8efa8b732ac236085bdd098c1d0a92be855d7f4aed675922c6f57513`, LF only |
| Returned payload | byte-identical to the file; first line `# Foundation Uno`; length > 400 |
| Selected kind | `markdown` (the only declared kind of the committed representation) |
| Address | `/en-001`, matched through `matchUnoCandidateRoute` → Page `home`, locale `en-001` |

Additional real-read proofs:

- **The read follows the file.** A scratch repository's Markdown is loaded, rewritten on disk from
  `# First title` to `# Second title`, and loaded again: the two payloads differ and the second begins with
  the new heading — so nothing is hardcoded.
- **Reads never write.** Fixture bytes before and after a load are equal, and the committed file is
  unchanged after every suite run.
- **Absence is not invention.** A declared but missing candidate observes `absent`; the loader then returns
  `no-valid-source`. A directory, a wrong suffix, a broken encoding or an oversize file observes `invalid`.

## 4. Confinement and read-safety actually proved

| Rule | Proof |
| --- | --- |
| Trusted root | absolute, existing, real directory only; missing/relative/non-string/file/junction root refused |
| Component walk | `lstat` on every segment; a linked intermediate folder, a linked final component named `x.md` and a linked content root each refuse `path:symlink` |
| Physical containment | `realpath` of content root and target must be inside the trusted root by path-relative containment; a common-prefix sibling (`content-evil`) is not inside `content` |
| Regular file only | a directory target refuses `path:not-a-regular-file` |
| Single open | `O_NOFOLLOW` where the platform supports it; post-open `fstat` re-checks kind, size and device/inode identity |
| Bounded read | the read loop stops at the cap, so a file that grows after the first stat is still refused; exactly-at-cap accepted, cap+1 refused |
| Strict UTF-8 | fatal decode; malformed bytes refused, never replaced |
| Content rules | Markdown heading + body, no raw HTML, no NUL/control; JSON ordinary object, strict parse, no prototype keys, bounded depth/width |
| No leakage | refusals carry one closed literal; no path, body, system message or stack is exposed |

**Honest limitations.** Portable Node cannot prove absolute race freedom on every filesystem. Windows lacks
POSIX file-symlink semantics without elevation, so symlink refusal is proved with **junctions** — real
reparse aliases covering an intermediate folder, a final component and the content root — rather than a
simulated check; no symlink case is skipped or passed by absence of setup.

## 5. Declared precedence, observed

Precedence is decided by the existing `resolveDeclaredPageSource` use case, and a bounded trace records which
declared kinds were actually observed:

| Declared | Files on disk | Result | Observed |
| --- | --- | --- | --- |
| JSON then Markdown | both valid | `json` | `["json"]` |
| Markdown then JSON | both valid | `json` | `["json"]` — Markdown never opened |
| JSON then Markdown | invalid JSON, valid Markdown | refused `invalid-json-source` | `["json"]` — no fall-through |
| JSON then Markdown | JSON absent, Markdown valid | `markdown` | `["json","markdown"]` |
| JSON then Markdown | JSON absent, Markdown invalid | refused `invalid-markdown-source` | `["json","markdown"]` |
| Markdown only | valid | `markdown` | `["markdown"]` |
| An undeclared stray file exists | declared Markdown valid | `markdown` | `["markdown"]` — undeclared files are never probed |

## 6. Local gates (Node 26, pnpm 11.6.0) — all before the product commit

| Gate | Observed result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — no package or lockfile change |
| governance verifier + `tests/governance-docs.test.mjs` | PASS — **6 / 6** |
| `pnpm test:bootstrap` | **19 / 19** + script OK |
| `pnpm test:architecture` | **20 / 20** (16 previous + 4 new adapter-boundary checks) |
| `pnpm lint` | exit 0 — **0 errors, 0 warnings** |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **455 passed / 455** across 13 files — 374 previous + **81 new** (48 reader, 33 pipeline), **69 of them refusal/negative cases** |
| `pnpm build` | PASS — `/`, `/_not-found`, `/icon.svg`; **no `/en-001` anywhere in the build output** |
| `pnpm test:http` | **103 passed, 0 failed** — live `/` and six 404s unchanged |
| readiness fixtures | **66 pass, 0 fail** |
| readiness CLI | **PASS — 100 checks** |
| security floors | **16 pass, 0 fail** |
| brand/copy contract | **29 pass, 0 fail** |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical**; one moderate dev-only `minimatch` advisory (GHSA-g3hv-75wg-m249) unchanged and not waived |
| `git diff --check` | clean |


## 7. Hosted CI

**Product head `6f03e6d0b8a133b460bdcd1870b476fed9844c20` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | `43876571315` | success | success | 10 / **0** |
| Verify U01 baseline | `43876571170` | success | success | 24 / **0** |

The blocking `Unit tests` step ran both new Vitest files on both hosts, so the real filesystem,
junction-refusal and precedence cases are proven on Ubuntu and Windows. **Full log text is UNVERIFIED** —
this client's GitHub API returns job and step conclusions, not downloadable logs. The report-only head
repeats the same four jobs; its run IDs are in the Owner handback.

## 8. Provider state, warnings and non-claims

| Item | Disposition |
| --- | --- |
| Vercel inspection | **UNVERIFIED** — tool discovery returned only GitLab, GitHub and Sentry with **no Vercel toolkit**, none connected; no deployment, build log, alias, domain or Analytics state was read, and no connection was initiated |
| Provider writes | **ZERO** — no provider tool was called; the only provider effect is the automatic Git-linked build the Owner authorised |
| `/en-001` on the live site | **Not claimed** — the local production build contains no such route, and the existing 404 behaviour is unchanged; no live observation was made |
| Dev-only `minimatch` moderate advisory | Disclosed and unchanged; the high/critical gate still exits 0 |
| Race freedom | Portable Node cannot guarantee it; the adapter refuses symlinks, re-verifies identity and documents the residual risk instead of claiming absolute safety |
| Source payload authority | An accepted payload carries no URL, host, visibility, release, cache or index authority; a JSON `public: true` grants nothing |
| Stage | U03 **OPEN**; U00/U01/U02 remain CLOSED; no later stage, release, route or publication is authorised |

## 9. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for the U03 confined-source
checkpoint: one real Node adapter that reads a declared authored source from a trusted root inside a
physical confinement boundary, bounds the read at 64 KiB, decodes strictly as UTF-8, validates Markdown or
JSON minimally and safely, and hands the observation to the existing `resolveDeclaredPageSource` use case so
declared JSON-before-Markdown precedence genuinely governs reads. The committed `en-001` Home Markdown is
opened and returned unrendered; nothing is routed, published, indexed or rendered, and the live landing
page, benefits copy, black emblem, favicon, CSS, Analytics and `noindex, nofollow, nocache` remain
byte-identical to the required start.
