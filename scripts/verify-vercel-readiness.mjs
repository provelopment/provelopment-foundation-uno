/**
 * Foundation Uno — offline Vercel *readiness* verifier (UNO-WO-012 / R02).
 *
 * What this proves, and what it cannot prove.
 *
 * It proves that the committed GitHub revision has the shape a manual Vercel deployment
 * needs: a pinned private Apache-2.0 Node 26 / pnpm 11 / Next.js 16 package, a nonempty
 * committed lockfile, a bounded `next.config.ts` with no static export or suppressed type
 * errors, the accepted English demonstration page and its language + robots guards, a
 * Git-level ignore rule for the private ACTIVE, a conservative CLI upload exclusion, and a
 * CI workflow that runs every mandatory gate on both hosts with no bypass.
 *
 * It cannot prove anything about the provider. No static file can certify Vercel's builder,
 * its effective Node/pnpm/Corepack behaviour, access protection, deployment source or URL.
 * This module therefore never contacts a network, never reads provider credentials, never
 * invokes a provider CLI, and never prints a deployed/success claim. Its only verdict is
 * `VERCEL_NOT_DEPLOYED_BY_AGENT`.
 *
 * Design constraints:
 *   * Node 26 built-ins only; no dependency, no subprocess, no environment secret read.
 *   * The exported `analyzeReadiness()` is pure: it reads only own data properties of the
 *     supplied snapshot, never invokes getters, never mutates, and never copies untrusted
 *     text into a result. Every reason code is a closed literal from `REASONS`.
 *   * Importing this module must not run the check; only direct execution does.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Repository root, resolved from this file's own location (`scripts/`). */
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Snapshot keys the analysis understands. Anything else on a supplied object is ignored and
 * never read, which is what keeps a hostile snapshot from steering the analysis.
 */
export const SNAPSHOT_KEYS = Object.freeze([
  'packageJson',
  'lockfile',
  'nextConfig',
  'page',
  'layout',
  'logo',
  'icon',
  'gitignore',
  'vercelignore',
  'u01Workflow',
]);

/** The enumerated repository files the CLI reads. Nothing outside this list is opened. */
export const SNAPSHOT_FILES = Object.freeze({
  packageJson: 'package.json',
  lockfile: 'pnpm-lock.yaml',
  nextConfig: 'next.config.ts',
  page: 'src/app/(demo)/page.tsx',
  layout: 'src/app/(demo)/layout.tsx',
  logo: 'public/uno-logo.svg',
  icon: 'src/app/icon.svg',
  gitignore: '.gitignore',
  vercelignore: '.vercelignore',
  u01Workflow: '.github/workflows/verify-u01.yml',
});

/** The approved public source link; the page may carry exactly this one external URL. */
const SOURCE_URL = 'https://github.com/provelopment/provelopment-foundation-uno';

/** Approved visitor-facing copy (UNO-WO-016 / R01). Compared literally, never fuzzily. */
const HERO_HEADING = 'One organisation. One connected digital presence.';
const HERO_LEAD = 'Foundation Uno brings an organisation';
const HERO_NOTE = 'This is the non-indexable introduction to Foundation Uno.';
const FOOTER_COPY = '© 2026 Provelopment. Foundation Uno is an open-source website foundation and a';
const META_TITLE = 'Foundation Uno | One organisation. One connected digital presence.';

/** The approved vector: official-source geometry, true-black numeral, enlarged canvas. */
const LOGO_SHA256 = 'bd804ce683824ad85852615b0e0a700badb80cf2cdff38dd642d9f1947d57d9c';
const LOGO_BYTES = 8247;
const LOGO_VIEWBOX = '0 0 2048 2048';

/**
 * Canonical LF form. The repository stores the vector with LF and the pinned digest is over those
 * bytes; a Windows checkout may hand the file back with CRLF, which is the same content.
 */
const canonicalSvg = (text) => text.replace(/\r\n/g, '\n');

/** Visible phrases that would resurrect a retired or false status claim. */
const RETIRED_COPY = Object.freeze([
  'A1',
  'P05',
  'not deployed',
  'no live deployment',
  'no manifest',
  'only the smallest pure primitives',
  'not a finished website',
  'no publication',
]);

/** Brand asset rules: one vector, approved palette, no active content. */
const LOGO_PATH = '/uno-logo.svg';
const LOGO_ACTIVE_CONTENT = /<script|<foreignObject|<image|xlink:href|\son[a-z]+\s*=/i;

/** Exact dependency pins the accepted baseline ships, including the one approved provider. */
const EXPECTED_DEPENDENCIES = Object.freeze({
  '@vercel/analytics': '2.0.1',
  next: '16.4.6',
  react: '19.2.9',
  'react-dom': '19.2.9',
});

/** The single approved analytics integration, and how it must appear in the root layout. */
const APPROVED_ANALYTICS_SPECIFIER = '@vercel/analytics/next';
const APPROVED_ANALYTICS_COMPONENT = '<Analytics';

/** Any `@vercel/*` module specifier written as a static import in a source file. */
const VERCEL_IMPORT_RE = /from\s*['"](@vercel\/[^'"]+)['"]/g;

/** Third-party analytics/advertising packages that are never approved for Uno. */
const UNAPPROVED_ANALYTICS_PACKAGES = Object.freeze([
  '@vercel/speed-insights',
  'posthog-js',
  'plausible-tracker',
  'react-ga',
  'react-ga4',
  'matomo',
]);

/** Claims that would turn the live demo page into a false publication claim. */
const FABRICATION_MARKERS = Object.freeze([
  'PUBLIC_PREVIEW_READY',
  'VERCEL_DEPLOYED',
  'VERCEL_BUILD_PASSED',
  'is a published Site',
  'EFS publication is live',
  'content engine is live',
  'locale routes are live',
]);

/** Patterns that would make a `.vercelignore` hide the build inputs themselves. */
const PROTECTED_UPLOAD_INPUTS = Object.freeze([
  'src',
  'package.json',
  'pnpm-lock.yaml',
  'next.config.ts',
  'tsconfig.json',
]);

/** Bare patterns that would exclude the entire repository. */
const MATCH_ALL_PATTERNS = Object.freeze(['*', '**', '/*', '**/*', '/', '.']);

/**
 * The complete closed vocabulary of refusal reasons. A result may never contain a string
 * outside this set, so diagnostics cannot leak file bytes, paths, usernames or values.
 */
export const REASONS = Object.freeze([
  'snapshot:malformed',
  'snapshot:missing-field',
  'package:missing',
  'package:malformed',
  'package:private',
  'package:license',
  'package:version',
  'package:engines-node',
  'package:package-manager',
  'package:next-version',
  'package:react-version',
  'package:build-script',
  'package:http-script',
  'package:unpinned-dependency',
  'package:analytics-version',
  'package:unapproved-provider',
  'lockfile:missing',
  'lockfile:no-lockfile-version',
  'next-config:missing',
  'next-config:static-export',
  'next-config:ignored-build-errors',
  'next-config:redirects-or-rewrites',
  'next-config:remote-loader',
  'next-config:secret-reference',
  'next-config:unapproved-experimental-flag',
  'page:missing',
  'page:obsolete-placeholder',
  'page:missing-heading',
  'page:hero-heading',
  'page:hero-lead',
  'page:footer-copy',
  'page:brand-mark',
  'page:brand-alt',
  'page:retired-claim',
  'page:example-labels',
  'page:missing-title-copy',
  'page:missing-disclosure',
  'page:source-link',
  'page:source-url-once',
  'page:unauthorized-external-url',
  'page:fabricated-publication',
  'brand:logo-missing',
  'brand:logo-not-svg',
  'brand:logo-viewbox',
  'brand:logo-palette',
  'brand:logo-geometry',
  'brand:logo-bytes',
  'brand:logo-superseded',
  'brand:logo-digest',
  'brand:logo-unsafe',
  'brand:favicon-parity',
  'layout:missing',
  'layout:lang',
  'layout:index-guard',
  'layout:follow-guard',
  'layout:nocache-guard',
  'layout:title',
  'layout:description',
  'layout:canonical-or-hreflang',
  'layout:analytics-missing',
  'layout:analytics-duplicate',
  'layout:unapproved-provider',
  'gitignore:missing',
  'gitignore:active-order',
  'gitignore:temp',
  'gitignore:vercel-dir',
  'gitignore:env',
  'gitignore:next-output',
  'vercelignore:missing',
  'vercelignore:documents',
  'vercelignore:scratch',
  'vercelignore:git-dir',
  'vercelignore:provider-dir',
  'vercelignore:env',
  'vercelignore:node-modules',
  'vercelignore:next-output',
  'vercelignore:overbroad-match-all',
  'vercelignore:overbroad-source',
  'workflow:missing',
  'workflow:no-frozen-install',
  'workflow:no-bootstrap',
  'workflow:no-architecture',
  'workflow:no-lint',
  'workflow:no-typecheck',
  'workflow:no-unit',
  'workflow:no-build',
  'workflow:no-http',
  'workflow:no-readiness-unit',
  'workflow:no-readiness-cli',
  'workflow:no-two-host-matrix',
  'workflow:no-node26',
  'workflow:no-security-floor',
  'workflow:no-audit-gate',
  'workflow:no-brand-test',
  'workflow:permissions',
  'workflow:bypass',
  'workflow:provider-command',
  'workflow:secret-reference',
  'workflow:stale-http-label',
  'workflow:no-browser-install',
  'workflow:no-browser-path',
  'workflow:no-browser-runner',
  'workflow:no-u04-consent-unit',
  'workflow:no-u04-consent-browser',
  'workflow:u04-consent-env',
  'workflow:no-u04-slice',
  'workflow:no-u04-hermetic-test',
  'workflow:browser-system-deps',
  'package:playwright-not-dev-only',
  'package:playwright-wrong-pin',
  'workflow:no-trace-inspector',
  'workflow:trace-root-override',
  'trace:no-includes',
  'trace:root-override',
  'trace:excludes',
  'trace:include-allowlist',
  'trace:root-wide-include',
]);

/**
 * Read one own *data* property without ever running caller code.
 *
 * `Object.getOwnPropertyDescriptor` reports an accessor instead of invoking it, so a getter
 * cannot execute; a Proxy trap that throws is caught. The caller-supplied snapshot is the
 * only untrusted object in this module, and its values are only ever compared, never
 * returned.
 */
function readOwnString(holder, key) {
  const descriptor = Object.getOwnPropertyDescriptor(holder, key);
  if (descriptor === undefined) return { state: 'missing' };
  if (!('value' in descriptor)) return { state: 'accessor' };
  if (typeof descriptor.value !== 'string') return { state: 'not-a-string' };
  return { state: 'string', value: descriptor.value };
}

/** Validate the snapshot shell and lift its fields into plain local strings. */
function readSnapshot(snapshot) {
  if (snapshot === null || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return { ok: false, reason: 'snapshot:malformed' };
  }
  const fields = {};
  try {
    for (const key of SNAPSHOT_KEYS) {
      const read = readOwnString(snapshot, key);
      if (read.state === 'accessor' || read.state === 'not-a-string') {
        return { ok: false, reason: 'snapshot:malformed' };
      }
      if (read.state === 'missing') return { ok: false, reason: 'snapshot:missing-field' };
      fields[key] = read.value;
    }
  } catch {
    return { ok: false, reason: 'snapshot:malformed' };
  }
  return { ok: true, fields };
}

/** Own data properties of a parsed-JSON object; parsed JSON carries no accessor. */
function asRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** Count non-overlapping occurrences of a literal substring. */
function countOf(text, needle) {
  return text.split(needle).length - 1;
}

/**
 * Remove JSX/TS block and line comments so a lexical copy check judges what a visitor could
 * read, not what a maintainer wrote beside it.
 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, ' ');
}

/** Non-comment, non-blank lines of a dotfile-style ignore list. */
function ignorePatterns(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

/** Does any ignore pattern name a protected build input or its subtree? */
function patternsHideProtectedInput(patterns) {
  return patterns.some((pattern) => {
    const normalized = pattern.replace(/^[!/]+/, '').replace(/\/+$/, '');
    return PROTECTED_UPLOAD_INPUTS.some(
      (input) => normalized === input || normalized.startsWith(`${input}/`) || normalized === `/${input}`,
    );
  });
}

/**
 * Analyse one snapshot of committed text and return a bounded verdict.
 *
 * @param {unknown} snapshot Object with the `SNAPSHOT_KEYS` string fields.
 * @returns {{ accepted: boolean, reasons: readonly string[], checks: number, failed: number }}
 */
export function analyzeReadiness(snapshot) {
  let checks = 0;
  const reasons = [];
  const expect = (ok, code) => {
    checks += 1;
    if (!ok) reasons.push(code);
  };

  const read = readSnapshot(snapshot);
  if (!read.ok) {
    expect(false, read.reason);
    return finish(checks, reasons);
  }
  const { packageJson, lockfile, nextConfig, page, layout, logo, icon, gitignore, vercelignore, u01Workflow } =
    read.fields;

  // --- 1. package.json: the pinned private Apache-2.0 Node 24 / pnpm 11 / Next 16 shape ---
  const packageText = packageJson.trim();
  expect(packageText !== '', 'package:missing');
  let pkg = null;
  if (packageText !== '') {
    try {
      const parsed = JSON.parse(packageText);
      pkg = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      pkg = null;
    }
    expect(pkg !== null, 'package:malformed');
  }
  if (pkg !== null) {
    const dependencies = asRecord(pkg.dependencies);
    const devDependencies = asRecord(pkg.devDependencies);
    const scripts = asRecord(pkg.scripts);
    const engines = asRecord(pkg.engines);
    expect(pkg.private === true, 'package:private');
    expect(pkg.license === 'Apache-2.0', 'package:license');
    expect(pkg.version === '0.1.0', 'package:version');
    expect(engines.node === '26.x', 'package:engines-node');
    expect(pkg.packageManager === 'pnpm@11.6.0', 'package:package-manager');
    expect(dependencies.next === EXPECTED_DEPENDENCIES.next, 'package:next-version');
    expect(dependencies.react === EXPECTED_DEPENDENCIES.react, 'package:react-version');
    expect(
      dependencies['@vercel/analytics'] === EXPECTED_DEPENDENCIES['@vercel/analytics'],
      'package:analytics-version',
    );
    expect(scripts.build === 'next build', 'package:build-script');
    expect(scripts['test:http'] === 'node scripts/verify-u01-http.mjs', 'package:http-script');

    const pinned = /^\d+\.\d+\.\d+$/;
    const declared = { ...dependencies, ...devDependencies };
    const names = Object.keys(declared);
    const allExact = names.length > 0 && names.every((name) => {
      const value = declared[name];
      return typeof value === 'string' && pinned.test(value);
    });
    expect(allExact, 'package:unpinned-dependency');

    // One provider only: the approved package, and no other Vercel or analytics package.
    const unapprovedProviders = names.filter(
      (name) =>
        (name.startsWith('@vercel/') && name !== '@vercel/analytics') ||
        UNAPPROVED_ANALYTICS_PACKAGES.includes(name),
    );
    expect(unapprovedProviders.length === 0, 'package:unapproved-provider');
  }

  // --- 2. The committed lockfile exists and is a real lockfile, not an empty placeholder ---
  const lockText = lockfile.trim();
  expect(lockText.length > 0, 'lockfile:missing');
  expect(lockText.includes('lockfileVersion:'), 'lockfile:no-lockfile-version');

  // --- 3. next.config.ts stays small and predictable: no export mode, no suppressed types ---
  const nextConfigText = nextConfig.trim();
  expect(nextConfigText !== '', 'next-config:missing');
  expect(!/output\s*:\s*['"]export['"]/.test(nextConfigText), 'next-config:static-export');
  expect(!/ignoreBuildErrors/.test(nextConfigText), 'next-config:ignored-build-errors');
  expect(!/(redirects|rewrites)\s*:/.test(nextConfigText), 'next-config:redirects-or-rewrites');
  expect(!/remotePatterns|loader\s*:/.test(nextConfigText), 'next-config:remote-loader');
  expect(!/process\.env|NEXT_PUBLIC_|apiKey|api_key|password|accessToken/.test(nextConfigText),
    'next-config:secret-reference');

  // The only experimental flag this baseline may carry is the supported global 404 document (UNO-WO-029 / R01).
  // Anything else in that block is an unreviewed routing or rendering change, so it is refused rather than ignored.
  const experimentalBlock = /experimental\s*:\s*\{([^}]*)\}/.exec(nextConfigText)?.[1] ?? '';
  if (experimentalBlock.trim() !== '') {
    expect(
      experimentalBlock.replace(/\s+/g, ' ').trim().replace(/,$/u, '') === 'globalNotFound: true',
      'next-config:unapproved-experimental-flag',
    );
  }

  // --- 4. The accepted English demonstration is present, not the superseded placeholder ----
  const pageText = page.trim();
  expect(pageText !== '', 'page:missing');
  expect(!/technical placeholder|runtime is not implemented yet/i.test(pageText),
    'page:obsolete-placeholder');
  expect(/<h1[\s>]/.test(pageText), 'page:missing-heading');
  expect(pageText.includes(HERO_HEADING), 'page:hero-heading');
  expect(pageText.includes(HERO_LEAD), 'page:hero-lead');
  expect(pageText.includes(HERO_NOTE), 'page:missing-disclosure');
  expect(pageText.includes('Example: a community organisation'), 'page:example-labels');
  expect(
    pageText.includes('Example: a service provider with regional audiences'),
    'page:example-labels',
  );
  expect(pageText.includes(FOOTER_COPY), 'page:footer-copy');
  expect(pageText.includes(`src="${LOGO_PATH}"`), 'page:brand-mark');
  expect(pageText.includes('alt="Foundation Uno"'), 'page:brand-alt');
  const sourceLinks = countOf(pageText, 'href={SOURCE_URL}');
  expect(sourceLinks === 2, 'page:source-link');
  expect(countOf(pageText, SOURCE_URL) === 1, 'page:source-url-once');
  const httpsCount = countOf(pageText, 'https://');
  const httpCount = countOf(pageText, 'http://');
  expect(httpsCount === 1 && httpCount === 0, 'page:unauthorized-external-url');
  const pageCopy = stripComments(pageText);
  expect(
    !FABRICATION_MARKERS.some((marker) => pageCopy.includes(marker)),
    'page:fabricated-publication',
  );
  expect(
    !RETIRED_COPY.some((phrase) => pageCopy.includes(phrase)),
    'page:retired-claim',
  );

  // --- 4b. Brand assets: official-source vector, identical favicon, no active content -----
  const logoText = logo.trim();
  const iconText = icon.trim();
  expect(logoText.length > 0, 'brand:logo-missing');
  expect(/^<svg[\s>]/.test(logoText) && logoText.endsWith('</svg>'), 'brand:logo-not-svg');
  expect(logoText.includes(`viewBox="${LOGO_VIEWBOX}"`), 'brand:logo-viewbox');
  expect(logoText.includes('#1f6f6b') && logoText.includes('#000000'), 'brand:logo-palette');
  expect(!LOGO_ACTIVE_CONTENT.test(logoText), 'brand:logo-unsafe');
  expect((logoText.match(/<path/g) ?? []).length >= 10, 'brand:logo-geometry');
  expect(Buffer.byteLength(canonicalSvg(logo), 'utf8') === LOGO_BYTES, 'brand:logo-bytes');
  expect(iconText === logoText, 'brand:favicon-parity');
  expect(!logoText.includes('#101620'), 'brand:logo-superseded');
  expect(!logoText.includes('#36454f'), 'brand:logo-superseded');
  expect(
    createHash('sha256').update(canonicalSvg(logo)).digest('hex') === LOGO_SHA256,
    'brand:logo-digest',
  );

  // --- 5. Language and robots guards in the root layout --------------------------------
  const layoutText = layout.trim();
  expect(layoutText !== '', 'layout:missing');
  expect(/<html\s+lang="en"/.test(layoutText), 'layout:lang');
  expect(/index:\s*false/.test(layoutText), 'layout:index-guard');
  expect(/follow:\s*false/.test(layoutText), 'layout:follow-guard');
  expect(/nocache:\s*true/.test(layoutText), 'layout:nocache-guard');
  expect(layoutText.includes(`title: '${META_TITLE}'`), 'layout:title');
  expect(
    layoutText.includes('Foundation Uno by Provelopment gives organisations'),
    'layout:description',
  );
  expect(!/alternates\s*:/.test(layoutText), 'layout:canonical-or-hreflang');

  // --- 5b. Exactly one approved analytics integration, rendered once -------------------
  expect(
    layoutText.includes(`from '${APPROVED_ANALYTICS_SPECIFIER}'`) ||
      layoutText.includes(`from "${APPROVED_ANALYTICS_SPECIFIER}"`),
    'layout:analytics-missing',
  );
  const analyticsRenders = countOf(layoutText, APPROVED_ANALYTICS_COMPONENT);
  expect(analyticsRenders >= 1, 'layout:analytics-missing');
  expect(analyticsRenders <= 1, 'layout:analytics-duplicate');
  const vercelImports = [...layoutText.matchAll(VERCEL_IMPORT_RE)].map((match) => match[1]);
  expect(
    vercelImports.every((specifier) => specifier === APPROVED_ANALYTICS_SPECIFIER),
    'layout:unapproved-provider',
  );
  expect(
    !UNAPPROVED_ANALYTICS_PACKAGES.some((name) => layoutText.includes(name)),
    'layout:unapproved-provider',
  );

  // --- 6. Git must keep the private ACTIVE out of the public tree ----------------------
  const gitignoreText = gitignore;
  expect(gitignoreText.trim() !== '', 'gitignore:missing');
  expect(gitignoreText.includes('/.documents/WIP/workorder-active.md'), 'gitignore:active-order');
  expect(gitignoreText.includes('/.temp/'), 'gitignore:temp');
  expect(gitignoreText.includes('/.vercel/'), 'gitignore:vercel-dir');
  expect(gitignoreText.includes('.env') && gitignoreText.includes('.env.*'), 'gitignore:env');
  expect(gitignoreText.includes('/.next/'), 'gitignore:next-output');

  // --- 7. CLI upload exclusion: private/scratch out, build inputs in --------------------
  const ignoreList = ignorePatterns(vercelignore);
  const hasPattern = (needle) => ignoreList.some((pattern) => pattern.includes(needle));
  expect(ignoreList.length > 0, 'vercelignore:missing');
  expect(hasPattern('.documents'), 'vercelignore:documents');
  expect(hasPattern('.temp'), 'vercelignore:scratch');
  expect(hasPattern('.git'), 'vercelignore:git-dir');
  expect(hasPattern('.vercel'), 'vercelignore:provider-dir');
  expect(hasPattern('.env'), 'vercelignore:env');
  expect(hasPattern('node_modules'), 'vercelignore:node-modules');
  expect(hasPattern('.next'), 'vercelignore:next-output');
  expect(
    !ignoreList.some((pattern) => MATCH_ALL_PATTERNS.includes(pattern.replace(/\/+$/, ''))),
    'vercelignore:overbroad-match-all',
  );
  expect(!patternsHideProtectedInput(ignoreList), 'vercelignore:overbroad-source');

  // --- 8. CI must run every mandatory gate on two hosts without bypass ----------------
  const workflowText = u01Workflow;
  expect(workflowText.trim() !== '', 'workflow:missing');
  expect(workflowText.includes('pnpm install --frozen-lockfile'), 'workflow:no-frozen-install');
  expect(workflowText.includes('pnpm test:bootstrap'), 'workflow:no-bootstrap');
  expect(workflowText.includes('pnpm test:architecture'), 'workflow:no-architecture');
  expect(/run:\s*pnpm lint\b/.test(workflowText), 'workflow:no-lint');
  expect(/run:\s*pnpm typecheck\b/.test(workflowText), 'workflow:no-typecheck');
  expect(/run:\s*pnpm test\s*$/m.test(workflowText), 'workflow:no-unit');
  expect(/run:\s*pnpm build\b/.test(workflowText), 'workflow:no-build');
  expect(/run:\s*pnpm test:http\b/.test(workflowText), 'workflow:no-http');
  expect(
    workflowText.includes('tests/deployment/verify-vercel-readiness.test.mjs'),
    'workflow:no-readiness-unit',
  );
  expect(
    workflowText.includes('node scripts/verify-vercel-readiness.mjs'),
    'workflow:no-readiness-cli',
  );
  expect(
    workflowText.includes('ubuntu-24.04') && workflowText.includes('windows-2025'),
    'workflow:no-two-host-matrix',
  );
  expect(/node-version:\s*'26'/.test(workflowText), 'workflow:no-node26');
  expect(
    workflowText.includes('tests/deployment/node26-security-floor.test.mjs'),
    'workflow:no-security-floor',
  );
  expect(/pnpm audit --audit-level high/.test(workflowText), 'workflow:no-audit-gate');
  // The full-graph audit can no longer see the one time-bounded exception, so the workflow
  // must also carry the independent guard, its mutation tests and a strict production audit.
  expect(
    workflowText.includes('node scripts/verify-u04-security-exception.mjs'),
    'workflow:no-security-exception-guard',
  );
  expect(
    workflowText.includes('tests/deployment/u04-security-exception.test.mjs'),
    'workflow:no-security-exception-tests',
  );
  expect(
    /pnpm audit --prod --audit-level high/.test(workflowText),
    'workflow:no-production-audit',
  );
  expect(
    workflowText.includes('tests/deployment/uno-brand-copy.test.mjs'),
    'workflow:no-brand-test',
  );
  expect(
    /contents:\s*read/.test(workflowText) && !/contents:\s*write/.test(workflowText),
    'workflow:permissions',
  );
  expect(
    !/continue-on-error|\|\|\s*true|--passWithNoTests|set\s+\+e/.test(workflowText),
    'workflow:bypass',
  );
  expect(
    !/(^|\s)(npx\s+)?vercel\s+(deploy|build|pull|link|login|promote|alias)/mi.test(workflowText),
    'workflow:provider-command',
  );
  expect(!/secrets\.|VERCEL_TOKEN/.test(workflowText), 'workflow:secret-reference');
  expect(!/technical placeholder/i.test(workflowText), 'workflow:stale-http-label');

  // --- 8c. The existing two-host U04 22-module gate must remain a blocking step -------------
  // `UNO-WO-048 / R01`. The hermetic guard and the real production-HTTP/Chromium runner are already the `run:` of
  // named steps on both hosts. Readiness must fail closed if either command is deleted, muted into a comment, moved
  // onto a passive mention or a different entry, given failure tolerance, or stripped of the pinned repo-local
  // Chromium path. The block is read from the command's own `run:` line to the next step, so a quoted comment, a
  // stale string elsewhere in the file or a bare mention in prose cannot satisfy it.
  const consentUnit = stepForCommand('node --test tests/deployment/u04-22-module-consent\\.test\\.mjs');
  expect(consentUnit !== null, 'workflow:no-u04-consent-unit');
  expect(consentUnit !== null ? !/\|\|\s*true|continue-on-error|if:\s*false/u.test(consentUnit) : true, 'workflow:bypass');
  const consentBrowser = stepForCommand('node scripts/verify-u04-22-module-consent\\.mjs');
  expect(consentBrowser !== null, 'workflow:no-u04-consent-browser');
  expect(
    consentBrowser !== null ? !/\|\|\s*true|continue-on-error|if:\s*false/u.test(consentBrowser) : true,
    'workflow:bypass',
  );
  expect(
    consentBrowser === null || /PLAYWRIGHT_BROWSERS_PATH:\s*\.temp\/uno-u03-browsers/u.test(consentBrowser),
    'workflow:u04-consent-env',
  );

  // --- 8b. The test-only browser proof must be installed hermetically inside Uno -------------
  // The pinned Playwright browser stays a *dev* dependency with one exact version; it is installed only into the
  // repository's ignored `.temp` path (never a shared user cache, never an OS package), and the publication runner that
  // drives it stays in its blocking place.
  expect(
    workflowText.includes('pnpm exec playwright install --only-shell chromium'),
    'workflow:no-browser-install',
  );
  // The pinned repo-local browser path must be the `env:` of the real steps that need it, not merely a string that
  // appears somewhere in the file. `UNO-WO-048 / R01` reads each step's own block, so a passive mention cannot pass.
  function stepForCommand(command) {
    const lines = workflowText.split(/\r?\n/u);
    const pattern = new RegExp(`^\\s*run:\\s*${command}\\s*$`, 'u');
    const index = lines.findIndex((line) => pattern.test(line));
    if (index < 0) return null;
    let start = index;
    while (start > 0 && !/^\s*-\s+(name|uses|run):/u.test(lines[start])) start -= 1;
    let end = index + 1;
    while (end < lines.length && !/^\s*-\s+(name|uses|run):/u.test(lines[end])) end += 1;
    return lines.slice(start, end).join('\n');
  }
  const installStep = stepForCommand('pnpm exec playwright install --only-shell chromium');
  const publishedStep = stepForCommand('node scripts/verify-u03-published-http\\.mjs');
  const carriesPath = (block) => block !== null && block.includes('PLAYWRIGHT_BROWSERS_PATH: .temp/uno-u03-browsers');
  // A step that is absent altogether is refused by its own reason code, so the path check only speaks for the steps
  // that do exist: each of them must carry the pinned path in its own block.
  expect(
    (installStep === null || carriesPath(installStep)) && (publishedStep === null || carriesPath(publishedStep)),
    'workflow:no-browser-path',
  );
  expect(workflowText.includes('node scripts/verify-u03-published-http.mjs'), 'workflow:no-browser-runner');

  // --- 8b2. The U04 JSON-slice gate must stay installed, blocking and browser-backed (UNO-WO-035 / R01) ------
  // Deleting the step, renaming it away from the order's name, replacing its command with a no-op or dropping its
  // browser path is refused by name, so a missing increment can never look like a pass.
  expect(workflowText.includes('Verify U04 A1 JSON Page vertical slice'), 'workflow:no-u04-slice');
  expect(workflowText.includes('node scripts/verify-u04-json-slice.mjs'), 'workflow:no-u04-slice');
  expect(
    /name: Verify U04 A1 JSON Page vertical slice[\s\S]{0,400}PLAYWRIGHT_BROWSERS_PATH: \.temp\/uno-u03-browsers/u.test(
      stripComments(workflowText),
    ),
    'workflow:no-u04-slice',
  );
  expect(!/(?:install-deps|--with-deps)/.test(stripComments(workflowText)), 'workflow:browser-system-deps');

  // --- 8b3. The hermetic U04 contract test must stay a separate blocking CI step (UNO-WO-036 / R02) ----------
  // The browser runner proves real rendering; the hermetic test proves the runner's own contract and its refusals.
  // They are complementary and both mandatory, so a deleted, renamed, muted or replaced step is refused by name.
  const uncommentedWorkflow = stripComments(workflowText);
  const hermeticStepName = 'U04 JSON-slice hermetic contract and refusal tests';
  const hermeticCommand = 'node --test tests/deployment/u04-json-slice.test.mjs';
  const hermeticStepIndex = uncommentedWorkflow.indexOf(`name: ${hermeticStepName}`);
  const hermeticCommandIndex = uncommentedWorkflow.indexOf(
    `run: ${hermeticCommand}`,
    Math.max(hermeticStepIndex, 0),
  );
  const buildStepIndex = uncommentedWorkflow.indexOf('name: Production build');
  // The named step must exist, carry its exact command inside its own block, and run before the production build.
  expect(hermeticStepIndex >= 0, 'workflow:no-u04-hermetic-test');
  expect(
    hermeticCommandIndex > hermeticStepIndex && hermeticCommandIndex - hermeticStepIndex <= 400,
    'workflow:no-u04-hermetic-test',
  );
  expect(buildStepIndex > hermeticStepIndex, 'workflow:no-u04-hermetic-test');
  // A muted condition would keep the command but never run it, so any false guard in uncommented text is refused.
  expect(!uncommentedWorkflow.toLowerCase().includes('if: false'), 'workflow:no-u04-hermetic-test');

  let declaredPackage = {};
  try {
    declaredPackage = asRecord(JSON.parse(packageText)) ?? {};
  } catch {
    declaredPackage = {};
  }
  const declaredDependencies = asRecord(declaredPackage.dependencies) ?? {};
  const declaredDevDependencies = asRecord(declaredPackage.devDependencies) ?? {};
  // Only judge the browser pin when the package metadata parsed: malformed metadata is already reported once above.
  if (Object.keys(declaredDevDependencies).length > 0) {
    expect(declaredDependencies.playwright === undefined, 'package:playwright-not-dev-only');
    expect(declaredDevDependencies.playwright === '1.65.1', 'package:playwright-wrong-pin');
  }

  // --- 8c. The bounded file-trace gate must exist and stay narrow (UNO-WO-033 / R01) -------
  // The traced payload is only trustworthy while three things hold: the blocking inspector step exists, the Next
  // config declares *exactly* the narrow deployment inputs for the routes that read them, and no root-wide or
  // escaping override appears. Each is refused by name, so deleting a gate cannot look like a pass.
  expect(workflowText.includes('node scripts/verify-u03-trace.mjs --expect committed'), 'workflow:no-trace-inspector');
  expect(!/outputFileTracingRoot/u.test(workflowText), 'workflow:trace-root-override');
  const nextConfigSource = typeof nextConfig === 'string' ? nextConfig : '';
  expect(nextConfigSource.includes('outputFileTracingIncludes'), 'trace:no-includes');
  expect(!/outputFileTracingRoot/u.test(nextConfigSource), 'trace:root-override');
  expect(!/outputFileTracingExcludes/u.test(nextConfigSource), 'trace:excludes');
  const includeBlock = /UNO_DEPLOYMENT_INPUTS\s*=\s*\[([\s\S]*?)\]/u.exec(nextConfigSource)?.[1] ?? '';
  const includeGlobs = [...includeBlock.matchAll(/'(\.[^']*)'/gu)].map((match) => match[1]).sort();
  expect(
    JSON.stringify(includeGlobs) ===
      JSON.stringify([
        './deployment/efs/content/**/*.json',
        './deployment/efs/content/**/*.md',
        './deployment/efs/manifest.json',
        './deployment/site.config.json',
        './deployment/uno.config.json',
      ]),
    'trace:include-allowlist',
  );
  for (const glob of includeGlobs) {
    expect(!/^\.?\/?\*\*/u.test(glob) && !glob.includes('..'), 'trace:root-wide-include');
  }

  return finish(checks, reasons);
}

/** Bounded, sorted, de-duplicated result. */
function finish(checks, reasons) {
  const unique = [...new Set(reasons)].sort();
  return Object.freeze({
    accepted: unique.length === 0,
    reasons: Object.freeze(unique),
    checks,
    failed: unique.length,
  });
}

/**
 * Read the enumerated committed files of this checkout. A file that cannot be read becomes an
 * empty string so the analysis reports the specific refusal instead of crashing.
 */
export function readRepositorySnapshot(root = ROOT) {
  const snapshot = {};
  for (const key of SNAPSHOT_KEYS) {
    try {
      snapshot[key] = readFileSync(join(root, SNAPSHOT_FILES[key]), 'utf8');
    } catch {
      snapshot[key] = '';
    }
  }
  return snapshot;
}

/** The single deterministic success line required by the order. */
export const PASS_MARKER =
  'verify-vercel-readiness: PASS — GitHub/offline inputs only; VERCEL_NOT_DEPLOYED_BY_AGENT';

/** Format a verdict for a CI log: counts, bounded reasons, and the not-deployed statement. */
export function formatResult(result) {
  const head = `verify-vercel-readiness: ${result.accepted ? 'PASS' : 'FAIL'} — ${
    result.checks
  } checks, ${result.failed} failed`;
  const lines = [head];
  if (!result.accepted) {
    for (const reason of result.reasons) lines.push(`  - ${reason}`);
  }
  lines.push('VERCEL_NOT_DEPLOYED_BY_AGENT');
  return lines.join('\n');
}

/** CLI entry point: one read of this checkout, one verdict, no network and no provider. */
function main() {
  const result = analyzeReadiness(readRepositorySnapshot());
  console.log(formatResult(result));
  if (result.accepted) console.log(PASS_MARKER);
  process.exitCode = result.accepted ? 0 : 1;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && pathToFileURL(invokedPath).href === import.meta.url) {
  main();
}
