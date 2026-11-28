# Foundation Uno — operator guide

This is the operator documentation for an installation of Foundation Uno. It covers prerequisites, first setup, startup and
shutdown, authored content and asset ownership, upgrades and rollback, integrity verification, failure recovery, the optional
provider configuration and its OFF defaults, and licensing and attribution.

Nothing here requires a provider account, a credential, a hosted service or a network call. An installation is a website one
organisation runs on its own machine or platform.

## 1. Prerequisites

| Requirement | Value | Why |
| --- | --- | --- |
| Node.js | 26.x | the release is built and run on Node 26 |
| pnpm | 11.6.0 (the `packageManager` value in `package.json`) | dependencies come from the committed lockfile |
| Disk | about 1 GB per release directory | `node_modules` and a production build live inside the release |
| Network | none at run time | the product calls no provider unless an operator configures one |
| Platform | Linux or Windows, x64 | verified on Ubuntu 24.04 and Windows Server 2025 |

An installation is a directory containing `installation.json`, `start.mjs` and a `releases/` directory. Each release inside
`releases/` is a complete, self-contained product directory. **The installation and every release in it must be real directories,
not symlinks or junctions**: Foundation Uno refuses a source root that is a link, because a link could be repointed behind the
product's back. The installer creates real directories; a link in the path is a defect to fix, not a state to work around.

## 2. Initial setup and configuration

1. Obtain the release: `foundation-uno-<version>.tar.gz`, or its unpacked directory, together with `SHA256SUMS`.
2. Verify it before installing (section 6).
3. Install into an empty target directory:

   ```bash
   node scripts/install-release.mjs <release-dir> <installation-dir> fresh
   ```

4. Configure the origin the installation answers on, by editing `deployment/uno.config.json` inside the **active release**:

   ```json
   {
     "version": 1,
     "entityId": "e_7a3knkx60eacyhca7a0cr1k6e1",
     "selectedSite": { "facetId": "foundation", "siteId": "main" },
     "languagePreferences": { "en": "en-001" },
     "base": { "canonical": "https://www.example.org", "aliases": [] }
   }
   ```

   `base.canonical` **must be an `https` origin**. It is the origin every canonical link, `hreflang`, sitemap entry and
   `robots.txt` reference is built from, and an `http` or malformed value is refused rather than repaired: the installation answers
   `404` rather than publish an untruthful canonical address.

**A hosted deployment states its own origin.** The neutral distribution ships the reserved, non-routable
`https://uno-starter.example`, which a real installation replaces. Three statements are honoured, strongest first:

1. `UNO_CANONICAL_ORIGIN` — a server-only environment variable naming the exact origin the installation is served on
   (`https://www.example.org`).
2. `deployment/uno.deploy.json` — an optional committed profile `{ "version": 1, "canonical": "https://www.example.org" }`.
   It belongs to the hosting repository and is **never shipped** in the distributable artefact.
3. `VERCEL_PROJECT_PRODUCTION_URL` — the platform's statement of the production host, consulted only when `VERCEL_ENV` is
   `production`. A preview never claims the production canonical address.

Every candidate is judged by the same canonical validator as `base.canonical`, and the profile and platform statements apply
**only while the committed base is still the reserved example origin** — a committed base that names a real origin is your own
deliberate declaration and is never overwritten. An origin is never inferred from a request, a `Host` header or a forwarded
header, and a statement that is present and invalid refuses the whole Site rather than quietly falling back.


5. Edit the three starter Pages in `deployment/efs/content/` (`home.en-001.json`, `about.en-001.md`, `components.en-001.json`) and
   the Site presentation in `deployment/site.config.json`. They are neutral placeholders: an illustrative foundation, not a real
   organisation.

6. Start the installation (section 3) and check `/`, `/en-001`, `/en-001/about`, `/en-001/components`, `/robots.txt`, `/sitemap.xml`.

## 3. Startup and shutdown

```bash
node start.mjs -H 127.0.0.1 -p 3000
```

`start.mjs` reads `installation.json`, starts the **active release** from that release's own directory, and passes every argument to
`next start`. Running the server from the release directory matters: the product reads its declarations and content relative to the
process working directory, and refuses a symlinked root.

Stop it with `Ctrl+C` or with whatever your process supervisor uses. The server holds no state that must be flushed: it writes
nothing, and every request is served from the files on disk.

## 4. Authored content and asset ownership

- **Pages.** A Page is a JSON or Markdown file in `deployment/efs/content/`, declared in `deployment/efs/manifest.json` with a route,
  a publication state (`published`, `unlisted`, `draft`) and one representation per locale. Only `published` Pages are served;
  `unlisted` Pages render but are excluded from discovery; `draft` Pages are refused.
- **Locale identity.** A locale is the authored full tag (`en-001`, `de-DE`). It is never inferred from `Accept-Language`, a cookie
  or an environment value, and a locale that is not authored is refused.
- **Media.** Every image must be owned by the operator, placed under `deployment/efs/assets/` and recorded in the manifest. A media
  address that is not owned and declared is refused; there is no fallback image, no remote fetch and no proxy.
- **Properties.** `deployment/efs/manifest.json` also holds authored properties. `public` is authorship metadata: marking a property
  public does **not** project it into any Page. A fact you want visitors to see must be authored **as content** — for example a
  `mailto:` action in a `content.actions` section for a contact address.
- **Navigation.** `deployment/site.config.json` may order and name navigation entries and declare analytics, but it is presentation,
  not authority: it cannot publish, unlist, translate or invent an address.

## 5. Upgrade and rollback

```bash
node scripts/install-release.mjs <next-release-dir> <installation-dir> upgrade
```

An upgrade materialises the new release at its own path, installs dependencies, builds it, copies the adopter-owned paths forward
(`deployment/efs/content`, `deployment/efs/assets`, `deployment/efs/manifest.json`, `deployment/site.config.json`,
`deployment/uno.config.json`), and only then rewrites `installation.json` to name it. The previous release stays on disk, so rollback
is a record change:

```bash
node scripts/install-release.mjs --rollback <installation-dir>
```

Rollback points `installation.json` back at the most recent other complete release — including that release's own digest, version and
preserved list — and leaves the replaced release in place for inspection.

## 6. Integrity verification

Every release carries `MANIFEST.sha256` (one line per file) and `RELEASE.json` (name, version, commit, tree digest, file count, Node
and pnpm floors). Verify before installing and after transferring:

```bash
cd <release-dir>
sha256sum -c MANIFEST.sha256                       # Linux
Get-FileHash -Algorithm SHA256 -Path <file>        # Windows: compare each line by hand
node -e "const c=require('node:crypto'),f=require('node:fs');const l=f.readFileSync('MANIFEST.sha256','utf8').trim().split('\n').map(x=>x.split(/  /)).map(([h,p])=>[p,h]);console.log(c.createHash('sha256').update(l.map(([p,h])=>h+'  '+p).join('\n')).digest('hex'))"
```

The printed digest must equal `RELEASE.json.digest`. The installer performs the same verification and refuses a modified file
(`install:file-mismatch:<path>`), a file the manifest does not name (`install:unexpected-file:<path>`) or a digest that disagrees with
`RELEASE.json` (`install:digest-mismatch`) **before it writes anything**.

### Health check

`GET /api/uno-health` answers a small JSON document and is the first thing to read when an address that should be published is not:

```json
{ "status": "serving", "address": "/en-001", "locale": "en-001", "canonical": "https://www.example.org/en-001", "origin": "declared" }
```

It answers `503` with a closed `reason` code when nothing is served (`serving:authority-unavailable` means the declarations could not be
read; `serving:deploy-origin-invalid` means the stated origin was refused; `serving:publication-refused` means the authored Page is not
published for that address). It carries no content, no path, no environment value and no caller value, is never cached and is never
indexed.

## 7. Failure recovery

- **A refused or interrupted install.** `installation.json` is not rewritten until the release has built successfully, so the running
  installation keeps running. A partial release directory is discarded or rebuilt by the next install; a complete release is reused.
- **A failed upgrade.** Re-run the install, or roll back (section 5).
- **Every Site address answers `404` while `/` answers `200`.** Ask `/api/uno-health` first. `serving:authority-unavailable` means the
  declarations were not readable (check that `deployment/` shipped and that the path holds no symlink); `serving:deploy-origin-invalid`
  means the stated origin was refused (check `UNO_CANONICAL_ORIGIN`, the hosting profile and that `base.canonical` is a valid `https`
  origin); `serving:publication-refused` means the Page is not published for that address.
- **A dependency problem.** The installer prefers the local store (`pnpm install --offline --frozen-lockfile`) and falls back to the
  registry with the same frozen lockfile; the release records which happened in `.uno-dependencies`.

## 8. Optional providers and their OFF defaults

Both optional capabilities are **OFF by default**, and neither can be switched on by authored copy.

**Contact delivery.** Unset, nothing is sent and the interface says so: the fields are read-only, there is no form, and no request
leaves the server. To enable it, set server-only environment variables:

| Variable | Meaning |
| --- | --- |
| `UNO_CONTACT_WEBHOOK_URL` | public `https` endpoint that receives one validated submission |
| `UNO_CONTACT_WEBHOOK_HOSTS` | comma-separated allowlist; the destination host must match an entry or a subdomain of one |
| `UNO_CONTACT_WEBHOOK_TOKEN` | optional bearer token sent to that endpoint |

The destination is resolved before it is dialled, every resolved address is classified, and any private, loopback, link-local,
reserved, multicast, documentation or IPv4-mapped answer refuses the send. The address that was validated is the address that is
connected to. A `3xx` is refused, never followed; connect, headers, body and the whole exchange are bounded; the submission is never
logged, stored, retried or queued. "Accepted" means the endpoint answered `2xx` for that one attempt — never "delivered to an inbox".

The abuse limiter is per process: five submissions per caller per minute, bounded to 2,048 tracked callers. It does not survive a
restart and is not shared between instances; several instances each hold their own budget.

**Analytics.** Unset, no measurement happens: no beacon is rendered and the collector answers `503` rather than accepting and
discarding events. To enable it, set `UNO_ANALYTICS_FORWARD_URL` and `UNO_ANALYTICS_FORWARD_HOSTS` (same policy, same pinned
connector as contact) **and** declare `"analytics": { "enabled": true }` for the Site in `deployment/site.config.json`. Both are
required. The event is one name and one bounded Page path: no cookie, no identifier, no address, no user agent, no referrer, and Uno
stores nothing.

The demonstration route's separately approved `@vercel/analytics` integration renders only when `UNO_DEMO_ANALYTICS=1` is set; it is
off otherwise.

## 9. Licensing and attribution

`LICENSE` states the terms this distribution is offered under. `NOTICE.md` names every runtime dependency with its version and
licence, and records that this distribution contains no copied Foundation source, no donor component, no provider SDK and no
third-party copy, photograph, icon set, font file or trademark. Every image an installation serves must be owned by the operator.
