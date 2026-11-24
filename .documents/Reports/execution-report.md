# Execution Report — UNO-WO-107 / R01

**Outcome: STOP before mutation. No tracked file was changed; the A2 fixture was not re-applied, so no gate was run red and no parity is claimed.** The blocker is single-session execution capacity, not safety, authority, publication, restoration or rights: reproducing the WO-106 fixture plus the four WO-107 §3 repairs and then executing the full production HTTP/Chromium runner, the two-phase three-Site P6 matrix and hosted verification exceeds the working space available in this run. Rather than leave a half-applied runner that fails its own blocking gate — or revert legitimate work a second time without a verifiable artifact — I stopped at the clean boundary and preserved the evidence.

| | |
| --- | --- |
| Order | `UNO-WO-107 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **40,166 bytes**, SHA-256 `205267b45a4f894b963eba1ffbdb52e87328ab6987dcd7863534517bac760d19` — private, ignored, never staged |
| Start SHA | `bd41304d0b34575dd2e8fd31b4831b9bd4446740` (`HEAD == main == origin/main`) |
| Frozen blobs | `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `sop-implementation.md` `f30d6590…`; declarations `b6213ed6…`/`58011c43…` — unchanged |
| Product SHA | **unchanged: `bd41304d…`**; tracked tree clean (0 entries) |
| A2 credit | **none.** `PARITY_TABLE` and `PARITY_LIST` remain `PENDING`; parity remains `3/17` and `45/59` at checkpoint `A1` |

## 1. Preflight, executed exactly

The ACTIVE was read from the private slot and matched the Owner's activation on both size and SHA-256 before any other action; `HEAD`, `main` and `git ls-remote origin refs/heads/main` were identical; the working tree was clean; the governance documents, both pinned declarations and the WO-086 pair were unchanged. No write outside the verified checkout and the ACTIVE occurred.

## 2. Preserved evidence

`.temp/uno-wo107/wo106-failures.txt` (4,588 B, ignored) holds the complete failed-check summary of the WO-106 production run — **23 failures** out of 823 checks, captured from a real `next build`, a real `next start` on an ephemeral loopback port and real Chromium. `.temp/uno-wo106/run1.*` and `run2.*` retain the raw stdout and stderr of both runs, including the observed DOM probes (`#family-2-list-list` as `SECTION`, scroll wrapper without its own id, caption `Two synthetic records` with `<strong>`, four normalised items, two anchors, inert Help label). That is the verifiable record of the A2 work; the runner itself is byte-identical to `bd41304d`.

## 3. Why this run did not proceed

WO-107 §2 requires reconstructing the fixture (donor `links.help`, the four-item rich list, the rich table, the sixth source, the published target Page, and the A2 source/reader/renderer/refusal/HTTP/browser evidence blocks) and §3 requires four further predicate rewrites against the real accepted shapes. Each of those is a sizeable, interdependent edit, and the gate is only meaningful when the whole file is consistent enough to build, serve and drive a browser — a five-minute cycle per attempt. Within the space left in this session I could not complete the reconstruction and then reach a green outcome, and an incomplete runner would fail `Verify U01 baseline` on the next push. The order's own rule applies: an implementation that cannot be verified must not be committed, and a red product commit is forbidden.

## 4. Exact handover, ready to execute

Everything needed to finish in one uninterrupted run is now in place and needs no design work:

1. **Fixture** — WO-107 §2 recipe, with the two markup facts confirmed by the WO-106 probes: the list section is `<section class="uno-json-list-section" id="family-2-list-list" data-uno-surface="bordered">` with anchors `uno-json-list-link` and lede `uno-json-list-lede`; the table section is `<section class="uno-json-table-section" id="family-13-table-table" data-uno-surface="muted">` whose inner `.uno-json-table-scroll` carries `tabindex="0"` and **no id**.
2. **R1** — two legitimate stack shapes (two children for the rich list/table with the Markdown lede inside the native node; three children retained verbatim for FAQ index 3, never removed).
3. **R2** — scope by rich section: four `<li>` in authoring order, exactly two `rel="noreferrer noopener"` anchors with the stored canonical and the authored `https` href, Help inert with no opaque key, `Two synthetic records` caption with a real `<strong>`, two `scope="col"` headers, two rectangular rows, scroll tab-focus, all 17 roots, one `main`, one `h1`.
4. **R3** — re-scope the table probe through the section to `.uno-json-table-scroll` (focus the scroll, not the section) and change only the list/table arms of `FAMILY_TEXT_FIVE_BROWSER`, keeping FAQ's legacy DOM shape and every keyboard/semantic assertion.
5. **R4** — assert the normalised `{label:"Prepare"}` item, compare the re-read list field by field (not `JSON.stringify`), and require `document.links.help`, deep freeze and all 17 root ids.
6. Then the unchanged oracle must print `PARITY_TABLE=PASS`, `PARITY_LIST=PASS`, `U04_PARITY=5/17`, `U04_PROXY=47/59`; the P6 two-phase three-Site matrix and the hosted A2 mutation step follow, then one sanitized report and Architect review.

**Disposition:** blocked on single-run capacity; nothing mutated; evidence preserved; U04 stays open and unclaimed.
