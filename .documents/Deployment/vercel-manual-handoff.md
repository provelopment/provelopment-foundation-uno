# Manual Vercel deployment handoff — Foundation Uno English demonstration

**Audience:** the Owner only. Written by the Implementation Agent under `UNO-WO-012 / R02` and revised
under `UNO-WO-014 / R01` for Node 26 and the approved analytics integration.
**Status of this document:** stable instruction, **not** an execution log. It records no account, no
token, no project ID, no URL and no deployment result produced by the Agent, which performed **zero**
Vercel write actions and cannot observe them.

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
| Node.js version | **26.x** (`engines.node` is `"26.x"`; `packageManager` is `pnpm@11.6.0`). A project-level Node setting of `26.x` agrees with `package.json`, so the historic "`engines.node` overrides the project version" warning no longer applies |
| Environment variables | none required — no secrets, no API keys, no contact integration. Web Analytics needs **no** environment variable; it needs the dashboard feature you control |

Do not disable type checking, linting or tests to make a build pass. If the provider build fails, that
is a real finding to report, not something to mask. Node 26 availability:
<https://vercel.com/docs/functions/runtimes/node-js/node-js-versions>.

## 5. pnpm 11 in Vercel — now observed, not assumed

Uno pins `pnpm@11.6.0` in `package.json` (`packageManager`) with a committed
`pnpm-lock.yaml` (`lockfileVersion: '9.0'`).

An earlier revision of this document listed pnpm 11 as an untested compatibility risk. That risk is now
**observed**: the existing Uno project's build log for the pre-correction deployment records
`pnpm v11.6.0` installing successfully, followed by Next 16.4.2 building and generating three static
pages. No `ENABLE_EXPERIMENTAL_COREPACK` decision is required for the observed behaviour.

If a future provider change breaks that, the rule stays: **do not** silently downgrade pnpm or rewrite
`pnpm-lock.yaml` to fit the provider. Stop and request a separate, bounded correction order, because a
rewritten lockfile invalidates the reviewed, tested artifact this handoff describes.

## 5b. What now happens automatically, and the one thing that does not

| Behaviour | Who controls it | Effect |
| --- | --- | --- |
| `main` → production build | you, through the project's existing Git integration | every push to Uno `main` triggers a production deployment of that exact commit; the Agent pushes nothing without your explicit activation |
| Node version actually used | `package.json` `engines.node` + the project setting | both now read 26.x; the effective runtime must be confirmed in a build log, not assumed |
| Web Analytics collection | **you only**, in the Vercel dashboard | source code imports and renders the official `<Analytics />`; until the project's Web Analytics feature is enabled, no visitor data is collected |

The Agent cannot toggle Analytics and never will: that is a provider setting, not a repository change.


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

The repository contains no token, no customer content, no contact form, no third-party script and no
tracking beyond the single first-party Vercel Analytics integration described in §5b. Keep it that way
in project settings as well.

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
6. **Build log.** Confirm the effective **Node 26** runtime, the pnpm version, that the install was
   frozen, and that `next build` succeeded. The pre-correction log warned that `engines.node` overrode
   the project's Node choice; after this correction that warning must be gone, and the effective runtime
   in the same log must read 26.x.
7. **Analytics, two separate facts.** (a) Source: the HTML may reference the first-party
   `/_vercel/insights/script.js` route once — it appears only when the deployment runs on Vercel, so its
   absence on a local server proves nothing either way. (b) Collection: open the project's Vercel
   **Analytics** page. Unless you enabled Web Analytics there, the script may load but no visitor data is
   collected. Neither fact is certified by the Agent.
8. **No invented surface.** Confirm there is no canonical tag, no `hreflang` alternate, no sitemap, no
   third-party analytics or advertising host, and no unexpected redirect on `/`.


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
