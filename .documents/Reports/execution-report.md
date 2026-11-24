# Execution Report — UNO-WO-109 / R01

**Outcome: STOPPED before any write. `4/17` / `46/59` was NOT delivered.** The installed order's own mandatory Git pin and its scope prohibitions contradict the committed state of this checkout, so the run could not lawfully begin. This is a governance-conflict STOP required by `AGENTS.md` and by the implementation SOP's pre-write guard, **not** a capacity stop and **not** a claim of delivery.

| | |
| --- | --- |
| Order | `UNO-WO-109 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **29,673 bytes**, SHA-256 `8c43d9678ccd94e411898bc73c17b42cd789920fa4a87651695f39e7a21b3e92` — matches the activation exactly; private, ignored, never staged |
| Start SHA required by the order | `edc0dc238f19d4679252d43bf99a0ae6a48758e6` |
| Actual `HEAD` = `main` = `origin/main` = `git ls-remote origin refs/heads/main` | **`e0a6910174bb0c387b3a4935cec3ad17db5594fb`** |
| Files changed by this run (product, test, oracle, workflow, declaration, architecture) | **none** |
| Credited families | unchanged at **3/17**, `45/59` — no credit claimed, none spent |

## 1. Blocker A — the mandated Git start pin does not hold

Order §1 requires, verbatim, `HEAD == main == origin/main == git ls-remote origin refs/heads/main == edc0dc238f19d4679252d43bf99a0ae6a48758e6`. The measured state is `e0a6910174bb0c387b3a4935cec3ad17db5594fb` on all four, because **two commits already exist on top of `edc0dc2`**:

- `9e03936` `test(u04): prove rich list/table A2 evidence in real HTTP and Chromium`
- `e0a6910` `docs(report): publish the single sanitized WO-108 report`

The runner at the required start SHA is blob **`bbc228b053621e7f91acfc1151bc39a72959be6e`** — the exact blob WO-109 §2 names. The runner at `HEAD` is blob **`00bb80d7b09c1b9788a10d0be82714768b1399c4`**. The order was therefore authored against a tree that no longer exists, and no authorized operation can restore it: force-push, history rewrite and unauthorised overwrite of delivered work are all forbidden, and reverting the two commits would discard product that a prior Owner activation explicitly authorized and that has since passed both hosted workflows.

## 2. Blocker B — the order declares "unactivated" a work order this repository shows as activated and delivered

WO-109's header states: *"Supersedes: unactivated WO-108/R01; prior agent WO-107/R01 produced only a report at the starting SHA."* That is not what the recorded history shows. The previous turn carried an explicit **`OWNER ACTIVATION — UNO-WO-108 / R01 — FINAL — EXECUTE`** with its own ACTIVE size (`32,035` bytes) and SHA-256 (`186d9637…61fd8d1`), and produced two commits that are now on `origin/main` and hosted-green.

The two activations cannot both be true. Worse, WO-109 §0/§2 then prohibit precisely what that activated order lawfully committed and what is present at `HEAD`:

- §2: *"Keep list index 2 exactly as currently committed: two ordinary items, plain lede, no destination or new target."* — index 2 at `HEAD` is the four-entry rich list (`Prepare`, a classified `https` note, a published same-Site route item, one authorized-but-OFF `link`).
- §0/§2: *"Do NOT create `wo106-target`, `wo108-target`, a sixth source, a `links.help` declaration…"* — `HEAD` already contains `${CONTENT}/wo108-target.en-001.json` as a sixth source, `links: { help: { reference: "applicationLink", key: "example.help" } }`, the `wo108-target` published Page and its route item.

Delivering `4/17` on the current tree therefore required either violating those explicit prohibitions, or silently reverting a delivered, hosted-green product commit. Neither is authorized, and either would be an unreviewable scope breach. The table itself also differs: the order specifies `lede: "Synthetic table introduction with *emphasis*."`, while the committed table carries `lede: "The **table** explains synthetic totals."`.


## 3. What was verified before stopping

The ACTIVE file matched its activation byte-for-byte and by digest; there is one checkout, one worktree, on `main`, with a single `origin` pointing only at the Uno repository; the tracked and index state was clean (`dirty=0`) and no scratch was staged. Frozen surfaces are unchanged: `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `.documents/SOP/sop-implementation.md` `f30d6590…`, `verify-u01.yml` `8d19319d…`, `verify-bootstrap.yml` `caac7d65…`, the closure oracle `f6a54850…`, and both committed declarations `b6213ed6…` / `58011c43…`. No build, runner, Chromium, mutation or recovery transaction was started, and `.documents/Architecture/u04-family-parity.md` was deliberately left untouched because §2 permits its table row only in the report commit that follows proven hosted product green.

## 4. What the Owner must decide

1. **Re-pin and keep WO-108's list.** Re-issue the order against `e0a6910` (or its successor), withdraw the "unactivated WO-108" premise, delete §0/§2's list prohibitions, and keep the table-only scope: earn `source`, `reader`, `renderer`, `http`, `browser`, `refusal`, `rights` for `table`, leave `list` `PENDING`, and take the interim no-checkpoint `4/17` / `46/59` from the unchanged oracle. Only the table lede wording would need re-pinning to the committed value (or the committed lede changed deliberately).
2. **Authorize a revert instead.** Explicitly authorize reverting `9e03936` (with `e0a6910` superseded) so the runner returns to `bbc228b0` and WO-109 `§2` applies literally. This discards a delivered, hosted-green A2 evidence commit and must be named as such by the Owner.
3. **Amend the scope.** Keep the rich list committed and authorize table credit alongside it, with the list's local evidence remaining uncredited until the separate P6 order.

**Disposition:** no code, test, oracle, workflow or declaration was modified; `PARITY_TABLE` stays `PENDING` and the tally stays `3/17` / `45/59`; delivery of `4/17` is recorded as **not achieved**, caused by the conflict above. The run stops here for the Owner's corrected order and independent Architect review.
