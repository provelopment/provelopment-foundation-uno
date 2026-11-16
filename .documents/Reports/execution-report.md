# UNO-WO-012 / R02 — deployment-ready repository prepared; no Vercel action by the Agent

**Order:** `UNO-WO-012 / R02` · FINAL — EXECUTE · **Executed:** 2026-11-16
**Workstream:** manual-Vercel deployment readiness — repository only
**Result:** **COMPLETE for this order's scope** (deployment preparation, not a deployment)
**U01:** remains **OPEN** · formal closed stages **1 / 8** · U02–U07 not started
**Scorecard:** prior earned **23.75%**; this report **proposes 23.75% → 24.00% (+0.25 pp)** for the
independently reviewable readiness checkpoint · the **0.50** public-deployment points and the **0.50**
U01-exit points remain **unearned** · Architect acceptance required

```text
VERCEL_NOT_DEPLOYED_BY_AGENT
MANUAL_DEPLOYMENT_PENDING_OWNER
```

The only artifact produced here is an auditable, deployment-ready GitHub revision of the existing
English homepage plus the instruction the Owner needs to deploy it manually. **No Vercel command,
login, project, inspection, credential, deployment, protection change or URL exists** — the Agent has
performed zero provider actions, as this edition requires.

## 1. Lineage and closed ledger

| Item | Value |
| --- | --- |
| Required start (`main`) | `6de130cff699f6b70540cd20e58a1cef6fa16a4d` — verified equal to `origin/main`, clean tree |
| Predecessor | `UNO-WO-012 / R01`, correctly stopped report-only at that same commit (no target, no channel) |
| **Product commit** | **`8a733db2ff2c9242a486baf60e4de4dba7932e74`** — six product paths, direct child of the start commit |
| **Report commit** | the report-only child of the product commit; its SHA is stated in the Owner handback because a report cannot contain its own commit |
| Accepted homepage origin | `UNO-WO-011 / R01`, product `5323439f90d5dd1543bde15e0f06f287b0271d51`, report `3b642e12648c4c43b39542aec4d5be0ff41f2b59` |

Exactly six product paths plus this one report path changed. Nothing else was written, staged or pushed.

| # | Path | Operation | What it now is |
| --- | --- | --- | --- |
| 1 | `.vercelignore` | CREATE | Conservative CLI-upload exclusion: `.documents/**` (private ACTIVE included), `.temp/`, `.git/`, `.vercel/`, `.env`/`.env.*`, certificates, `node_modules/`, `.next/`, `out/`, `build/`, `dist/`, `next-env.d.ts`, `*.tsbuildinfo`, caches and logs. `src/`, `next.config.ts`, `package.json`, `pnpm-lock.yaml` and `tsconfig.json` stay eligible |
| 2 | `scripts/verify-vercel-readiness.mjs` | CREATE | Offline readiness verifier: pure exported `analyzeReadiness()` over eight enumerated committed files, 70 executed checks, 74 closed reason codes, deterministic marker, no network and no provider |
| 3 | `tests/deployment/verify-vercel-readiness.test.mjs` | CREATE | 44 Node-native in-memory fixtures: one complete positive fixture plus targeted refusals and hostile-snapshot handling |
| 4 | `.documents/Deployment/vercel-manual-handoff.md` | CREATE | Owner-only manual Vercel guide: source commit, framework/root/Node/build settings, pnpm-11 platform risk, Git-versus-CLI payload boundaries, post-deployment checks, division of responsibility, provider documentation links |
| 5 | `.github/workflows/verify-u01.yml` | EDIT narrowly | Adds the readiness fixtures and the readiness CLI to **both** existing hosts after the production HTTP gate, and corrects the stale `technical placeholder` HTTP step label. Triggers, permissions (`contents: read`), installs and every pre-existing gate are untouched |
| 6 | `.documents/Architecture/source-inventory.md` | EDIT narrowly | One labelled *U01 manual-deployment-readiness* adoption note; earlier U01/U02 inventory and the 22-module/17-family evidence preserved above it |

Unchanged and re-verified by blob identity at the product commit: `src/app/page.tsx`
`7b7c883b3d3c92edfbfefd1f0614a192ed1814fc`, `src/app/layout.tsx`
`012f28c58ebdfb0bdda48cf7c80d147d1ff5ab98`, `scripts/verify-u01-http.mjs`
`6c9f4b1ab191c5883a8216389ff5f595ba87ca55`, plus `package.json` `27da575c1c…`,
`pnpm-lock.yaml` `8252753664…`, `next.config.ts` `ad198a023a…`, `.gitignore` `a8f3f5e4cc…`,
`AGENTS.md` `94f962d1f6…`, `README.md` `8f5f4e15ee…`,
`.documents/SOP/sop-implementation.md` `f30d65901c…` and the bootstrap workflow.

## 2. The readiness contract that was actually built

`analyzeReadiness(snapshot)` accepts an in-memory text snapshot of exactly these eight files and returns
`{ accepted, reasons, checks, failed }` — frozen, bounded, sorted and de-duplicated:

```text
package.json · pnpm-lock.yaml · next.config.ts · src/app/page.tsx
src/app/layout.tsx · .gitignore · .vercelignore · .github/workflows/verify-u01.yml
```

Positive assertions (executed on every run):

1. `package.json` parses; `private: true`; Apache-2.0; version `0.1.0`; `engines.node: "24.x"`;
   `packageManager: "pnpm@11.6.0"`; Next.js exactly `16.4.2`; React **and** React DOM exactly `19.2.9`;
   every declared dependency and devDependency pinned to an exact `x.y.z`; `build` is `next build` and
   `test:http` is `node scripts/verify-u01-http.mjs`.
2. `pnpm-lock.yaml` is nonempty and carries a `lockfileVersion`; the frozen install stays the operational
   guarantee on both CI hosts. No version string is asserted that the lockfile does not contain.
3. `next.config.ts` has no `output: 'export'`, no `ignoreBuildErrors`, no `redirects`/`rewrites`, no
   remote loader or `images` block and no secret or `process.env` reference. These are lexical checks,
   not a TypeScript parse, and nothing more is claimed.
4. The page keeps the accepted English demonstration: one `h1` with the truthful title, the
   English-demonstration disclosure, exactly one external URL — the approved repository link — no
   `http://` URL and none of four fabrication markers. Runtime behaviour is still proven separately by
   the 51-assertion loopback gate; the static scan reads source intent only.
5. The layout keeps `lang="en"`, `index: false`, `follow: false`, `nocache: true`, the truthful
   title/description, and no `alternates` (no canonical, no `hreflang`).
6. `.gitignore` keeps the private ACTIVE screened, plus `.temp/`, `.vercel/`, `.env`/`.env.*` and Next
   output.
7. `.vercelignore` excludes private and scratch paths, is not a match-all list, and does not hide a
   protected build input.
8. The U01 workflow still runs frozen install, governance, bootstrap, architecture, lint, typecheck, unit,
   production build, production HTTP **and** both readiness steps, on `ubuntu-24.04` **and**
   `windows-2025`, with `contents: read`, no bypass token, no provider command and no secret reference.

Safety properties proven by fixtures: only own **data** properties of the caller object are read
(`Object.getOwnPropertyDescriptor`), so a getter is reported as malformed and **never invoked**; a throwing
property trap is caught; results contain only closed literal codes, so no file text, path, username or
hostile value can echo into a diagnostic; importing the module never runs the check.

## 3. Refusals proven, not assumed

44 fixtures, all in memory, no repository read, no network, no provider tooling. Each refusal asserts
`accepted: false`, a nonempty failure count, the **exact** expected code, and a nonzero executed-check
count — so a refusal cannot come from an empty or always-true scan.

| Group | Fixtures |
| --- | --- |
| Package metadata | unparseable JSON; not `private`; wrong Node major (`20.x`); wrong pnpm (`10.4.0`); drifted Next (`16.3.0`); unpinned dependency (`^5.9.3`); replaced `test:http` script |
| Lockfile | missing; present but without `lockfileVersion` |
| `next.config.ts` | `output: 'export'`; `ignoreBuildErrors`; `redirects` rules |
| Page and layout | obsolete `technical placeholder`; `<h1>` demoted to `<h2>`; disclosure removed; approved source link replaced; extra external URL; an invented success marker; `lang="en-US"`; `index: true`; `follow: true`; `nocache` removed; invented `alternates` |
| Payload | `.gitignore` without the ACTIVE rule; `.vercelignore` without `.documents/`; match-all `*`; `src/` hidden |
| CI | `npx vercel deploy`; `secrets.VERCEL_TOKEN`; `continue-on-error`; stale `technical placeholder` label; dropped `pnpm test:http`; dropped readiness CLI; single-host matrix; `contents: write` |
| Hostile input | accessor snapshot (getter count stays **0**); throwing `getOwnPropertyDescriptor` trap (error text never surfaces); non-string field; missing field; `null`; closed-code whitelist; no-echo check; deterministic formatting with no deployed claim |

## 4. Local evidence — the exact order sequence, on Windows with the pinned toolchain

Node **v24.22.1** · pnpm **11.6.0** · Next.js **16.4.2** · `pnpm-lock.yaml` unchanged.

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — "Already up to date", 403 ms, exit 0 |
| `node --test tests/governance-docs.test.mjs` | PASS — **6 / 6** |
| `node scripts/verify-governance-docs.mjs` | PASS — AGENTS.md, README.md and local SOP match Owner-frozen bytes |
| `pnpm test:bootstrap` | PASS — **19 / 19** |
| `pnpm test:architecture` | PASS — **12 / 12** |
| `pnpm lint` | PASS — `eslint .`, exit 0, no findings |
| `pnpm typecheck` | PASS — `tsc --noEmit`, exit 0 |
| `pnpm test` | PASS — **167 / 167** across 7 files |
| `pnpm build` | PASS — exit 0, **3 static pages** reported by `next build` |
| `pnpm test:http` | PASS — **51 passed, 0 failed** (`/` 200 HTML, English text, six refused routes, `noindex`) |
| `node --test tests/deployment/verify-vercel-readiness.test.mjs` | PASS — **44 / 44** |
| `node scripts/verify-vercel-readiness.mjs` | PASS — **70 checks, 0 failed**, exit 0 |

The CLI's full success output, verbatim:

```text
verify-vercel-readiness: PASS — 70 checks, 0 failed
VERCEL_NOT_DEPLOYED_BY_AGENT
verify-vercel-readiness: PASS — GitHub/offline inputs only; VERCEL_NOT_DEPLOYED_BY_AGENT
```

Nothing was skipped, softened or made tolerant of failure. No `continue-on-error`, no `|| true`, no
disabled test, no network call and no provider process ran at any point.

## 5. Exact-head hosted evidence

**Product head `8a733db2ff2c9242a486baf60e4de4dba7932e74`** — four jobs, all green:

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43827649594 | success | success | 9 / **0** each |
| Verify U01 baseline | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43827649726 | success | success | 20 / **0** each |

The amended workflow grew from 18 to **20** steps on each host, and the two new steps are observed
`success` on Ubuntu: `Deployment readiness fixtures (offline, in-memory)` and
`Deployment readiness (offline; VERCEL_NOT_DEPLOYED_BY_AGENT)`, alongside the now-correctly-labelled
`Run production HTTP (English demonstration)`.

The final report-only head re-runs the same two workflows on both hosts; its four run identities and
eight job conclusions are stated in the Owner handback for this order, because this report cannot know
its own commit SHA. **Job log text remains `UNVERIFIED`**: the logs endpoint returned 403 to this client,
so no log line is quoted; only job and step conclusions are claimed as PASS.

## 6. What was deliberately *not* changed

`src/app/page.tsx`, `layout.tsx`, `globals.css` and `not-found.tsx` are byte-identical: the homepage,
its CSS, the `lang="en"` declaration, the `noindex, nofollow, nocache` policy and the honest 404 all
stand as accepted. `scripts/verify-u01-http.mjs` is untouched and still counts 51 real assertions over a
loopback production server. `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `.gitignore`,
`tsconfig.json`, `public/**` (absent), `AGENTS.md`, `README.md`, the SOP and the bootstrap workflow are
untouched. No dependency, asset, route, locale, analytics, client script or npm script was added, and no
`vercel.json` was created — the order forbids one, and the committed project settings are plain Next.js
defaults.



## 7. Residual risk register (Owner decisions, not Agent fixes)

| # | Risk | Evidence today | What only the Owner can resolve |
| --- | --- | --- | --- |
| 1 | **pnpm 11 on Vercel.** The project pins `pnpm@11.6.0`; Vercel's published table (observed 2026-11-16) lists built-in pnpm **6–10**. `ENABLE_EXPERIMENTAL_COREPACK=1` is documented but experimental and **not tested by this order** | `pnpm install --frozen-lockfile` passes on Node 24 locally and on both CI hosts; nothing here tests the provider | Choose Corepack, inspect the real build log, or request a bounded correction. Never silently downgrade pnpm or rewrite the lockfile |
| 2 | **Provider build != our CI build.** Green Actions cannot certify Next.js on Vercel's image, its cache, or its install step | Local `next build` produced 3 static pages; both CI hosts built successfully | Read the provider build log |
| 3 | **Deployment protection.** A protected project returns a login or SSO page instead of the homepage | Not observable by the Agent, and no protection setting was read or changed | Choose the project's access setting deliberately |
| 4 | **Git integration auto-deploys.** A linked project redeploys on every push to the branch | Not configured by the Agent; no Git integration exists because no project exists | Decide whether to link Git at all |
| 5 | **`.vercelignore` is CLI-only.** A Git-imported project uploads the tracked commit; the ignore list cannot filter it | The private ACTIVE is untracked and gitignored; the tracked set contains no secret | Confirm the imported commit is the accepted one |
| 6 | **No live proof exists.** No URL, no deployment ID, no provider attestation | Zero provider actions by the Agent | Deploy, then authorize separate verification if wanted |

## 8. Honest limitations and non-claims

- **This is not a deployment.** No Vercel account, team, project, deployment, protection setting, domain,
  DNS record, environment variable or URL was created, inspected, read or changed by the Agent, and none
  is asserted anywhere in this report.
- **Offline readiness is not provider compatibility.** Every provider-specific statement is `UNVERIFIED`
  until the Owner deploys.
- **`noindex, nofollow, nocache` is unchanged and mandatory.** A shareable preview URL is not
  search-index authorization.
- **The readiness scanner is lexical.** It reads committed text; it is not a TypeScript parser, not a
  bundler and not a security proof. Its value is that it fails loudly when the *shape* regresses.
- **Nothing here publishes an EFS Site.** `/` remains an English informational demonstration; `/en`,
  `/en-001`, `/about`, `/robots.txt` and `/sitemap.xml` remain 404 by design; no manifest, reader,
  locale route or publication decision exists.
- **No stage closes, nothing is released, and the Agent cannot self-accept.**

## 9. Owner handoff and requested decision

The deployable revision is **`8a733db2ff2c9242a486baf60e4de4dba7932e74`**, and the final accepted head is
the report-only commit that contains this report.

**Read `.documents/Deployment/vercel-manual-handoff.md` at the final accepted GitHub SHA** before
touching Vercel. It contains the import source, the framework/root/Node/build settings, the pnpm-11
decision points, the Git-versus-CLI payload distinction, and the exact post-deployment checks to run
yourself (`/` 200 with English content and `noindex`; six real 404 refusals).

Summary of what the Owner does next:

1. Import `provelopment/provelopment-foundation-uno`, branch `main`, at the accepted commit, root at the
   repository root, Next.js preset, Node 24.x, and no application secrets or environment values (the only
   optional setting is the Corepack flag described in step 2).
2. Decide the pnpm question deliberately (Corepack experimental flag, or inspect the build log and stop if
   incompatible).
3. Decide visibility/protection — only you can make the preview openly visitable.
4. After the build, verify the checks in §7 of the handoff and record the real results separately.
5. Authorize a separate bounded order if you want GitHub-hosted external HTTP verification of the live
   URL; the Agent must not deploy or access the provider to do it.

**Requested decision:** independent Chief Master Architect **`ACCEPT` / `REVISE` / `STOP`** on this
deployment-readiness checkpoint, including the proposed **+0.25 pp** toward readiness. U01 remains OPEN;
the 0.50 public-deployment and 0.50 U01-exit points stay unearned, and no stage is closed by this report.
