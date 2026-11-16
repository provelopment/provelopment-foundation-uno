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
  page: 'src/app/page.tsx',
  layout: 'src/app/layout.tsx',
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
const HERO_LEAD = 'Foundation Uno will bring an organisation';
const HERO_NOTE = 'This is the live single-page introduction to Foundation Uno.';
const FOOTER_COPY = '© 2026 Provelopment. Foundation Uno is an open-source website foundation and a';
const META_TITLE = 'Foundation Uno | One organisation. One connected digital presence.';

/** The approved vector: official-source geometry, charcoal numeral, enlarged canvas. */
const LOGO_SHA256 = 'de749e41347a043691b3dd82ced90a2d53f80c240993057388cdfaee20a0a568';
const LOGO_BYTES = 8250;
const LOGO_VIEWBOX = '0 0 2048 2048';

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
  next: '16.4.2',
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
  'workflow:no-governance',
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
  expect(logoText.includes('#1f6f6b') && logoText.includes('#36454f'), 'brand:logo-palette');
  expect(!LOGO_ACTIVE_CONTENT.test(logoText), 'brand:logo-unsafe');
  expect((logoText.match(/<path/g) ?? []).length >= 10, 'brand:logo-geometry');
  expect(logo.length === LOGO_BYTES, 'brand:logo-bytes');
  expect(iconText === logoText, 'brand:favicon-parity');
  expect(!logoText.includes('#101620'), 'brand:logo-superseded');
  expect(
    createHash('sha256').update(logo).digest('hex') === LOGO_SHA256,
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
    layoutText.includes('Foundation Uno by Provelopment will give organisations'),
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
  expect(workflowText.includes('verify-governance-docs.mjs'), 'workflow:no-governance');
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
