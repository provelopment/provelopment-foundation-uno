# Execution Report — UNO-WO-123 / R07

**Outcome: acceptance COMPLETE. Every mandatory local gate is green and both hosted workflows pass at the exact head
`43409df` on `ubuntu-24.04` and `windows-2025` — 38 of 38 steps on each, the U03 published-Pages step included.**

| | |
| --- | --- |
| Order | `UNO-WO-123 / R07`, `FINAL — EXECUTE` (supersedes R06) |
| ACTIVE | **3,107 bytes**, SHA-256 `3a434fd6f09c586abe548f90f6f0e5460cc050e890fc657d96772d95135e0628` — matched; private, ignored, untracked |
| Start SHA | `a8287698622bfacb0fee3c5973a8f8403a398c25`, empty index, clean tree |

## 1. The defect and its correction

R06 added a durable-Cards comparator to `scripts/verify-u03-published-http.mjs` that assumed the superseded wrapper. The committed and
recomposed contracts, read from the real files, are:

- **committed** `family-15-cards` (`deployment/efs/content/components.en-001.json`): `layout.grid`, props `{columns: 2,
  itemSemantics: "list"}`, two per-card `layout.stack` children whose first child is a `content.heading` with `level: 2`, the body as a
  `content.prose` child on the first card only, and **no** section heading or lede;
- **composed** (the real composer over `tests/fixtures/u04-durable-family-source.json`): `layout.grid`, props `{cards: [{title, body},
  {title}], columns: 2}`, childless, **no** section heading, lede, surface or `level` override;
- **donor source**: `{type: "cards", columns: 2, items: [{title, body}, {title}]}` — the same authored fields, the same absences.

The comparator now walks the committed outline against the composed `cards[]` and asserts equality **and absence**: same anchor,
`layout.grid` on both sides, equal numeric `columns`, `itemSemantics: "list"` on the committed side, a childless native node, no
`level`/`heading`/`lede`/`ledeMarkdown`/`surface` on either side, equal card counts, per-index equal title text at committed
`level: 2`, equal body presence and text, and only `title`/`meta`/`body` keys with `meta` absent. Neither durable source was touched.

**Regression evidence** (a temporary local harness, not committed): the comparator passes on the real committed Page and real composer
output and returns false for an altered title, a missing body, an invented `meta`, an invented `icon`, an invented section heading and a
wrapper `layout.stack`. The differing-set check beside it still requires exactly `[family-5-gallery, family-15-cards]`, so every
unaffected appended section remains byte-identical and the Gallery comparison is unchanged.

## 2. Local gates — actual results

| Gate | Result |
| --- | --- |
| Unit suite — `pnpm test` | **PASS — 35 of 35 files** |
| Lint — `npm run lint` | **PASS — 0 problems** |
| Typecheck — `npx tsc --noEmit` | **0 errors** |
| Architecture boundaries | **PASS** |
| Deployment suite — `node --test tests/deployment` | **PASS** |
| Focused native Cards proof | **PASS — 18 PASS, 0 FAIL** |
| Governance bytes | **PASS — frozen bytes** |
| **Mandatory U04 gate** — `node scripts/verify-u04-22-module-consent.mjs` | **PASS — 953 passed, 0 failed** |
| U03 published-Pages runner, local | **cannot execute here**: local Node `v26.13.1` refuses the composer's extensionless TS import (`ERR_MODULE_NOT_FOUND`), an environment limit rather than a code defect. Hosted runs the same file unmodified and is the authoritative result in §3. |

The rich Cards proof (text, meta, Markdown lede and body, optional columns, surfaces, every refusal) stays test-owned in
`tests/unit/uno-foundation-families.test.ts` and the U04 gate; no durable rewrite was performed.

## 3. Hosted verification — exact head `43409df`

| Workflow | `ubuntu-24.04` | `windows-2025` |
| --- | --- | --- |
| `Verify U01 baseline` | **success** — 38 steps, 0 failed | **success** — 38 steps, 0 failed |
| `Uno Bootstrap Verify` | **success** — 10 steps, 0 failed | **success** — 10 steps, 0 failed |

Steps confirmed green on both systems, including the ones this order concerns: `Run production HTTP (English demonstration)`,
`Run production HTTP (U03 locale and discovery refusals)`, **`Run production HTTP and browser (U03 published Pages, restored
afterwards)`**, `Run production HTTP and browser (three-Site P6, default-bearing and default-free, restored afterwards)` and
`Verify U04 22-module and four-provider consent (real production HTTP and Chromium)`. The durable Page and its declarations are
byte-restored after every run; the ACTIVE order stayed ignored and untracked.

## 4. Commits

```
43409df  fix(u03): compare the real durable Cards contracts including absence
a828769  docs(report): correct the R06 outcome to local-green, hosted-red
9569f31  fix(u03): prove the durable Cards semantic equivalence in the published-Page runner
4057b57  feat(cards): adopt native Cards in the Foundation composer with migrated production evidence
```

## 5. Disposition

Bounded adoption, not parity. `PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`; C1 earned, C2 and U04 OPEN. Cards is a
text-only composer capability — no images, actions, six-case browser matrix or full Cards parity is claimed. Delivered implementation,
donor alignment, Features, ordinary grids, every refusal, restoration, prior family evidence and concurrent multi-Facet/Site/Page/locale
publication are preserved.

This is the **STOP for independent Architect review**.
