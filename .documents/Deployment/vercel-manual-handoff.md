# Manual Vercel deployment handoff — Foundation Uno English demonstration

**Audience:** the Owner only. Written by the Implementation Agent under `UNO-WO-012 / R02`.
**Status of this document:** stable instruction, **not** an execution log. It records no account, no
token, no project ID, no URL and no deployment result, because the Agent performed **zero** Vercel
actions and cannot observe them.

`VERCEL_NOT_DEPLOYED_BY_AGENT` · `MANUAL_DEPLOYMENT_PENDING_OWNER`

## 1. What is being deployed, and what it is not

The deployable artifact is the existing English informational demonstration homepage at `/`: static
server-rendered HTML, one `h1`, original dependency-free CSS, one link to the public repository, and the
pre-publication `noindex, nofollow, nocache` policy.

It is **not** the authored EFS Home Page, **not** a published Site, **not** a locale route system, and
**not** evidence that the 22 modules or 17 capability families are live. `/en`, `/en-001`, `/about`,
`/robots.txt` and `/sitemap.xml` are deliberately absent and must answer with a real 404.

Nothing here is a release. No tag, no production promotion, no custom domain and no stage closure is
implied by a successful manual preview.

## 2. Source to import

| Item | Value |
| --- | --- |
| Repository | `https://github.com/provelopment/provelopment-foundation-uno` |
| Branch | `main` |
| Commit | the **final accepted head** recorded in `.documents/Reports/execution-report.md` and stated in the Owner handback for this order |
| Root directory | repository root — **not** a subdirectory |
| Artifact | the committed source tree; never a locally built `.next` output |

Confirm the commit before importing:

```bash
git ls-remote https://github.com/provelopment/provelopment-foundation-uno refs/heads/main
```

Review the tree at that SHA yourself. Do not import from Foundation, Solo or any sibling repository,
and do not import a branch other than `main` unless you deliberately choose to.

## 3. Owner-controlled decisions (Agent has none)

Only the Owner chooses and operates: the Vercel account or team, the project, the project name, the
target environment (preview or production), the visibility, the deployment-protection setting, and
whether Git integration is linked at all.

**Git integration deploys on push.** Vercel's standard Git integration rebuilds and redeploys the linked
project whenever the branch receives a push. If you want a single, deliberate preview from one exact
commit with no automatic redeployment afterwards, do not link Git, or unlink/disable automatic
deployments before you rely on the result. Reference:
<https://vercel.com/docs/git>.

**Access protection is yours to set.** A protected deployment returns a login, SSO or interstitial page
instead of the homepage. If you want an openly visitable demonstration, the project's deployment
protection must allow unauthenticated access. The Agent changed no protection setting anywhere and did
not inspect any team policy.

## 4. Build configuration

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (auto-detected from `next` `16.4.2`) |
| Root directory | repository root |
| Install command | the project's default for the lockfile, i.e. a **frozen** pnpm install |
| Build command | the project's existing build, i.e. `pnpm build` → `next build` |
| Output | Next.js's own build output (do not switch to a static export) |
| Node.js version | **24.x** (`engines.node` is `"24.x"`; `packageManager` is `pnpm@11.6.0`) |
| Environment variables | none required — no secrets, no API keys, no analytics, no contact integration |

Do not disable type checking, linting or tests to make a build pass. If the provider build fails, that
is a real finding to report, not something to mask. Node 24 availability:
<https://vercel.com/docs/functions/runtimes/node-js/node-js-versions>.

## 5. The one known compatibility risk: pnpm 11

Uno pins `pnpm@11.6.0` in `package.json` (`packageManager`) with a committed
`pnpm-lock.yaml` (`lockfileVersion: '9.0'`).

Vercel's published package-manager table, as observed on 2026-11-16, lists built-in pnpm versions
**6 through 10** — pnpm **11** is not among them. Vercel documents an optional project setting,
`ENABLE_EXPERIMENTAL_COREPACK=1`, that makes the provider honour the `packageManager` field. That
option is experimental and was **not tested by this work order**.

Your options, all Owner decisions:

1. Set `ENABLE_EXPERIMENTAL_COREPACK=1` in the project's environment settings and accept experimental
   behaviour. Read <https://vercel.com/docs/builds/configure-a-build> and
   <https://vercel.com/docs/package-managers> first.
2. Deploy and inspect the real build log. If the provider resolves pnpm 10 against a lockfile written
   by pnpm 11, expect an install/lockfile error rather than a silent success.
3. If it is incompatible, stop and request a separate, bounded correction order. **Do not** silently
   downgrade pnpm or rewrite `pnpm-lock.yaml` to fit the provider: that would invalidate the reviewed,
   tested artifact this handoff describes.

The Agent cannot verify any of this. Provider behaviour is `UNVERIFIED` until you deploy.

## 6. Payload, privacy and what `.vercelignore` does *not* do

Two different boundaries exist, and confusing them is the usual mistake:

| Boundary | What governs it | Effect here |
| --- | --- | --- |
| A **Git import** (the dashboard path) | only *tracked* files at the imported commit, plus `.gitignore` for untracked ones | the private ACTIVE order, `.temp/`, `.env*`, `node_modules/` and `.next/` are simply not in the imported commit, so they cannot be uploaded |
| A **CLI upload** (not performed by the Agent) | the working tree filtered by `.vercelignore` | the committed `.vercelignore` excludes `.documents/**` (including the private ACTIVE), `.temp/`, `.git/`, `.vercel/`, `.env*`, `node_modules/`, `.next/`, caches and logs, while keeping `src/`, `next.config.ts`, `package.json`, `pnpm-lock.yaml` and `tsconfig.json` eligible |

`.vercelignore` is therefore **additional** protection for a CLI upload. It is **not** proof that a
Git-integrated deployment filters those paths — a Git clone contains what Git contains. Background:
<https://vercel.com/docs/deployments/vercel-ignore> and
<https://vercel.com/docs/builds/build-features>.

Before you import, confirm the private material is genuinely absent from the public commit:

```bash
git ls-files | grep -E '(^|/)workorder-active\.md$|(^|/)\.env' || echo "no private paths tracked"
```

The repository contains no token, no customer content, no analytics, no tracking, no contact form and no
third-party script. Keep it that way in project settings as well.

## 7. After the deployment exists — checks to run yourself

The Agent cannot perform these and pre-certifies nothing. Record the actual results separately.

1. **URL and identity.** Note the HTTPS URL the provider returns, the project it belongs to, and the
   deployment's source commit. The source commit must be the accepted GitHub SHA from §2 — a project that
   reports a different commit, or no commit, is not this artifact.
2. **Homepage.** `GET /` with no credentials: expect `200`, HTML, English content, one `h1`
   (`Foundation Uno — a single-Entity website foundation`), the sections *How it is organized*,
   *What works today and what comes next*, *Explore the code*, the visible English-demonstration
   disclosure, and a single link to the GitHub repository.
3. **Pre-publication policy.** The response must still carry `noindex` and `nofollow` for robots. A
   shareable preview URL is not search-index authorization, and nothing here authorizes indexing.
4. **Refusals.** Each of these must return a genuine 404 — not a 200, not a redirect to `/`:

   | Path | Expected |
   | --- | --- |
   | `/en` | 404 |
   | `/en-001` | 404 |
   | `/about` | 404 |
   | `/does-not-exist-9f3` | 404 |
   | `/robots.txt` | 404 |
   | `/sitemap.xml` | 404 |

5. **Access reality.** If a login page, SSO prompt or protection interstitial appears instead of the
   homepage, the deployment is **not** an open public demonstration — that is a project setting you
   control, not a defect in the source.
6. **Build log.** Confirm the effective Node and pnpm versions, that the install was frozen, and that
   `next build` succeeded. This is the only place the pnpm 11 question in §5 can be answered.
7. **No invented surface.** Confirm there is no canonical tag, no `hreflang` alternate, no sitemap, no
   analytics and no unexpected redirect on `/`.


## 8. Division of responsibility

| Responsibility | Owner | Agent | Architect |
| --- | --- | --- | --- |
| Choose account/team, project, visibility, protection, preview or production, Git integration | **yes** | never | never |
| Perform the import, click Deploy, read provider logs | **yes** | never | never |
| Commit, test and document the deployment-ready GitHub revision | — | **yes** | reviews |
| Publish a live URL or provider result | **yes** (as an observation) | never | reviews |
| Independent acceptance of the repository preparation | — | — | **yes** |

The Agent has not logged in to, inspected, created or deployed anything on the provider, and will not do
so under this or any earlier order. Credentials belong to the Owner and must never be pasted into chat,
committed, or placed in a workflow.

## 9. If you want the live result verified on GitHub later

Once a real public URL exists, you may authorize a **separate** bounded order in which a read-only
GitHub Actions job probes that URL unauthenticated and records counted assertions. That verification
must be its own authorized step with its own ledger: nothing in this order pre-certifies a URL, a
response, a protection state or a deployment identity.

## 10. Reference documentation (provider background, not project evidence)

- <https://vercel.com/docs/git> — Git import, reference deployments, automatic deploys on push
- <https://vercel.com/docs/builds/configure-a-build> — framework, root directory and Corepack options
- <https://vercel.com/docs/package-managers> — the observed built-in package-manager table
- <https://vercel.com/docs/functions/runtimes/node-js/node-js-versions> — Node.js version availability
- <https://vercel.com/docs/deployments/vercel-ignore> — `.vercelignore` conventions
- <https://vercel.com/docs/builds/build-features> — CLI upload versus Git-import ignored-file behaviour

These links document the provider, not this project. No claim about Uno is derived from them.
