import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * Foundation Uno — U01 architecture boundary tests (Node-native, dependency-free).
 *
 * These tests scan only the authored U01 surfaces: `src/core/**`, `src/application/**`,
 * `src/app/**` and `package.json`. Historical documentation elsewhere in `.documents/**` is
 * deliberately NOT treated as active source, so upstream references recorded there cannot create a
 * false violation.
 *
 * The scanners are pure functions over a `{ path: content }` map so that a synthetic
 * negative fixture can prove the scanner actually refuses a violation instead of always
 * returning PASS.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Modules a framework-free `src/core` module must never import. */
export const CORE_FORBIDDEN_MODULES = Object.freeze([
  'next',
  'react',
  'react-dom',
  'node:fs',
  'node:child_process',
  'fs',
  'child_process',
]);

/** Markers that must never appear in the `src/app` placeholder layer. */
export const APP_FORBIDDEN_MARKERS = Object.freeze([
  'SpokeRuntimeContext',
  'spokeRuntime',
  'spokeMembership',
  'spokeSelector',
  'ownerSelector',
  'multiOwner',
  '@vercel/analytics',
  'modules/connect',
  'deployment/',
]);

/**
 * Modules an application use case must never import.
 *
 * `src/application/**` may depend on core contracts and on its own siblings; it is not allowed to
 * reach a framework, the Node filesystem/process/network surface, an adapter, `src/app/**`, the
 * deployment layer or a separately licensed module. Those belong behind an injected port.
 */
export const APPLICATION_FORBIDDEN_MODULES = Object.freeze([
  'next',
  'react',
  'react-dom',
  'node:fs',
  'node:fs/promises',
  'node:child_process',
  'node:net',
  'node:http',
  'node:https',
  'node:dns',
  'node:os',
  'node:worker_threads',
  'fs',
  'fs/promises',
  'child_process',
  'net',
  'http',
  'https',
  'dns',
  'worker_threads',
]);

/**
 * Legacy Foundation address/locale machinery that must never re-enter Uno `src/core` code.
 * Checked against CODE ONLY (comments stripped), so provenance prose such as "there is no
 * `/ww` segment" cannot create a false violation.
 */
export const LEGACY_ADDRESS_MARKERS = Object.freeze([
  '/ww/',
  'siteCode',
  'countryCode',
  'geoIp',
  'geo-ip',
  'acceptLanguagePrefix',
  'preferencePrefixMatch',
]);

/** The exact authored `src/core` kernel this baseline declares. */
export const CORE_AUTHORED_FILES = Object.freeze([
  'src/core/efs/identity.ts',
  'src/core/efs/manifest-graph.ts',
  'src/core/efs/uno-locales.ts',
  'src/core/modules/capability-registry.ts',
  'src/core/page-authoring-policy.ts',
  'src/core/page-content.ts',
  'src/core/page-route-path.ts',
  'src/core/safe-author-url.ts',
]);

/**
 * Strip block and line comments so marker scanning sees executable code only.
 * A lexical approximation, deliberately simple: this is a boundary test, not a parser.
 */
export function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

const SPECIFIER_RE = /(?:from\s*|require\s*\(\s*|import\s*)['"]([^'"]+)['"]/g;

function specifiersOf(source) {
  const found = [];
  SPECIFIER_RE.lastIndex = 0;
  let match = SPECIFIER_RE.exec(source);
  while (match !== null) {
    found.push(match[1]);
    match = SPECIFIER_RE.exec(source);
  }
  return found;
}

function isForbiddenCoreSpecifier(specifier) {
  if (
    CORE_FORBIDDEN_MODULES.some((name) => specifier === name || specifier.startsWith(`${name}/`))
  ) {
    return true;
  }
  // A pure core module must not reach into a concrete adapter implementation.
  return specifier.includes('/adapters/') || specifier.startsWith('@/adapters');
}

/**
 * An application use case may import core contracts and sibling application modules only. It must
 * not import a framework, Node I/O, an adapter, the app/router layer, the deployment layer or the
 * separately licensed module tree.
 */
function isForbiddenApplicationSpecifier(specifier) {
  if (
    APPLICATION_FORBIDDEN_MODULES.some(
      (name) => specifier === name || specifier.startsWith(`${name}/`),
    )
  ) {
    return true;
  }
  return (
    specifier.includes('/adapters/') ||
    specifier.startsWith('@/adapters') ||
    specifier.includes('/app/') ||
    specifier.startsWith('@/app') ||
    specifier.includes('deployment/') ||
    specifier.startsWith('@/deployment') ||
    specifier.includes('modules/connect')
  );
}

/**
 * Scan a `{ path: content }` map for U01 boundary violations.
 * @returns {string[]} one message per violation; empty means clean
 */
export function scanSources(files) {
  const violations = [];
  for (const [path, content] of Object.entries(files)) {
    const normalised = path.split('\\').join('/');

    if (normalised.startsWith('src/core/')) {
      for (const specifier of specifiersOf(content)) {
        if (isForbiddenCoreSpecifier(specifier)) {
          violations.push(`${normalised}: src/core must stay pure but imports "${specifier}"`);
        }
      }
      const code = stripComments(content);
      for (const marker of LEGACY_ADDRESS_MARKERS) {
        if (code.includes(marker)) {
          violations.push(`${normalised}: src/core must not reintroduce legacy "${marker}"`);
        }
      }
    }

    if (normalised.startsWith('src/application/')) {
      for (const specifier of specifiersOf(content)) {
        if (isForbiddenApplicationSpecifier(specifier)) {
          violations.push(
            `${normalised}: src/application must stay adapter-free but imports "${specifier}"`,
          );
        }
      }
    }

    if (normalised.startsWith('src/app/')) {
      for (const marker of APP_FORBIDDEN_MARKERS) {
        if (content.includes(marker)) {
          violations.push(`${normalised}: the app layer must not reference "${marker}"`);
        }
      }
    }
  }
  return violations;
}

const PACKAGE_FORBIDDEN_MARKERS = Object.freeze([
  '@vercel/analytics',
  'modules/connect',
  'postinstall',
  'spoke',
  'provelopment-foundation.git',
  'provelopment-foundation#',
]);

// Assembled from fragments so this test file never contains a private absolute path itself.
const PRIVATE_PATH_RE = new RegExp(['[A-Za-z]:', '[\\\\/]{1,2}', 'Users', '[\\\\/]'].join(''));

/** Scan a package.json text for forbidden dependencies, scripts and remotes. */
export function scanPackageJson(raw) {
  const violations = [];
  const lower = raw.toLowerCase();
  for (const marker of PACKAGE_FORBIDDEN_MARKERS) {
    if (lower.includes(marker.toLowerCase())) {
      violations.push(`package.json must not contain "${marker}"`);
    }
  }
  if (PRIVATE_PATH_RE.test(raw)) {
    violations.push('package.json must not embed a private absolute path');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [...violations, 'package.json must be valid JSON'];
  }

  const direct = { ...(parsed.dependencies ?? {}), ...(parsed.devDependencies ?? {}) };
  for (const [name, range] of Object.entries(direct)) {
    // A direct dependency must pin an exact version: x.y.z, optionally with a prerelease tag.
    if (typeof range !== 'string' || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(range)) {
      violations.push(`package.json: direct dependency "${name}" must use an exact version`);
    }
  }
  return violations;
}

function readTree(dir, prefix) {
  const files = {};
  const walk = (absolute, relative) => {
    for (const entry of readdirSync(absolute)) {
      const abs = join(absolute, entry);
      const rel = `${relative}/${entry}`;
      if (statSync(abs).isDirectory()) walk(abs, rel);
      else files[rel] = readFileSync(abs, 'utf8');
    }
  };
  walk(resolve(ROOT, dir), prefix);
  return files;
}

const authoredSources = () => ({
  ...readTree('src/core', 'src/core'),
  ...readTree('src/application', 'src/application'),
  ...readTree('src/app', 'src/app'),
});
const packageJson = () => readFileSync(resolve(ROOT, 'package.json'), 'utf8');
const doc = (name) => readFileSync(resolve(ROOT, name), 'utf8');

// --- Refusal proof: the scanners must reject synthetic violations --------------

test('the boundary scanner refuses a framework import in src/core', () => {
  const clean = { 'src/core/efs/pure.ts': 'export const value = 1;\n' };
  assert.deepEqual(scanSources(clean), []);

  const dirty = {
    'src/core/efs/dirty.ts':
      "import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n",
  };
  const violations = scanSources(dirty);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /node:fs/);
});

test('the boundary scanner refuses React, Next and adapters inside src/core', () => {
  assert.equal(
    scanSources({ 'src/core/a.ts': "import { useState } from 'react';\nexport {};\n" }).length,
    1,
  );
  assert.equal(
    scanSources({ 'src/core/b.ts': "import Link from 'next/link';\nexport default Link;\n" }).length,
    1,
  );
  assert.equal(
    scanSources({
      'src/core/c.ts': "import { x } from '@/adapters/content/json-page';\nexport { x };\n",
    }).length,
    1,
  );
  assert.equal(
    scanSources({ 'src/core/d.ts': "const cp = require('node:child_process');\nexport { cp };\n" })
      .length,
    1,
  );
});

test('the boundary scanner refuses Node I/O, framework and adapter imports in src/application', () => {
  const clean = {
    'src/application/use-case.ts':
      "import { selectDeclaredPageSource } from '../core/page-authoring-policy';\nexport { selectDeclaredPageSource };\n",
  };
  assert.deepEqual(scanSources(clean), []);

  const ioViolations = scanSources({
    'src/application/io.ts':
      "import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n",
  });
  assert.equal(ioViolations.length, 1);
  assert.match(ioViolations[0], /node:fs/);

  const adapterViolations = scanSources({
    'src/application/adapter.ts':
      "import { reader } from '../adapters/content/json-page';\nexport { reader };\n",
  });
  assert.equal(adapterViolations.length, 1);
  assert.match(adapterViolations[0], /adapters/);

  assert.equal(
    scanSources({ 'src/application/next.ts': "import Link from 'next/link';\nexport default Link;\n" })
      .length,
    1,
  );
  assert.equal(
    scanSources({ 'src/application/ui.ts': "import { page } from '../app/page';\nexport { page };\n" })
      .length,
    1,
  );

  // The real application tree is genuinely inspected, not merely declared.
  assert.ok(
    Object.keys(authoredSources()).includes('src/application/resolve-declared-page-source.ts'),
  );
});

test('the boundary scanner refuses Spoke and provider markers in src/app', () => {
  const spoke = scanSources({
    'src/app/page.tsx': 'export const ctx: SpokeRuntimeContext = {} as never;\nexport {};\n',
  });
  assert.equal(spoke.length, 1);
  assert.match(spoke[0], /SpokeRuntimeContext/);

  assert.equal(
    scanSources({ 'src/app/x.tsx': "import '@vercel/analytics';\nexport {};\n" }).length,
    1,
  );
  assert.equal(
    scanSources({ 'src/app/y.tsx': "import { m } from 'deployment/efs/manifest';\nexport { m };\n" })
      .length,
    1,
  );
});

test('the package scanner refuses postinstall and an analytics dependency', () => {
  const dirty = JSON.stringify({
    scripts: { postinstall: 'node evil.mjs' },
    dependencies: { '@vercel/analytics': '1.0.0' },
  });
  const violations = scanPackageJson(dirty);
  assert.ok(violations.length >= 2);
  assert.ok(violations.some((line) => line.includes('postinstall')));
  assert.ok(violations.some((line) => line.includes('@vercel/analytics')));
});

test('the package scanner refuses a non-exact direct dependency', () => {
  assert.equal(scanPackageJson(JSON.stringify({ dependencies: { next: '^16.4.2' } })).length, 1);
  assert.equal(scanPackageJson(JSON.stringify({ dependencies: { next: '16.x' } })).length, 1);
  assert.deepEqual(scanPackageJson(JSON.stringify({ dependencies: { next: '16.4.2' } })), []);
});

// --- Positive proof over the real authored tree -------------------------------

test('the real authored sources contain no boundary violation', () => {
  assert.deepEqual(scanSources(authoredSources()), []);
});

test('the real package.json is exact, boundary clean and pinned', () => {
  assert.deepEqual(scanPackageJson(packageJson()), []);

  const parsed = JSON.parse(packageJson());
  assert.equal(parsed.private, true);
  assert.equal(parsed.version, '0.1.0');
  assert.equal(parsed.license, 'Apache-2.0');
  assert.equal(parsed.packageManager, 'pnpm@11.6.0');
  assert.equal(parsed.engines.node, '24.x');
  assert.equal(parsed.dependencies.next, '16.4.2');
  assert.equal(parsed.dependencies.react, '19.2.9');
  assert.equal(parsed.dependencies['react-dom'], '19.2.9');
});

test('README and AGENTS label U01 truthfully as a technical baseline', () => {
  const readme = doc('README.md');
  const agents = doc('AGENTS.md');

  assert.ok(
    readme.includes('The authored public Uno A1 website is not implemented yet.'),
    'README.md must carry the exact truthful sentence about the A1 website',
  );
  assert.match(readme, /technical baseline/i);
  assert.match(agents, /technical baseline/i);

  for (const [name, body] of [
    ['README.md', readme],
    ['AGENTS.md', agents],
  ]) {
    assert.doesNotMatch(body, PRIVATE_PATH_RE, `${name} must not embed a private absolute path`);
    assert.doesNotMatch(
      body,
      /is a published (Uno )?website/i,
      `${name} must not claim a published website`,
    );
  }
});

test('the authored core kernel is exactly the declared file set', () => {
  const core = readTree('src/core', 'src/core');
  assert.deepEqual(Object.keys(core).sort(), [...CORE_AUTHORED_FILES].sort());
});

test('only the identity codec is a verbatim copy; the kernel declares adaptation', () => {
  const core = readTree('src/core', 'src/core');

  for (const path of [
    'src/core/page-content.ts',
    'src/core/page-route-path.ts',
    'src/core/efs/uno-locales.ts',
  ]) {
    assert.match(core[path], /ADAPTED|NEW UNO-OWNED ADAPTATION/i, `${path} must declare provenance`);
    assert.match(
      core[path],
      /not a byte-for-byte copy|NOT a copy/i,
      `${path} must state that it is not a verbatim copy`,
    );
  }

  // The upstream codec keeps its own contract text and is never relabelled as an adaptation.
  assert.doesNotMatch(core['src/core/efs/identity.ts'], /ADAPTED for Uno/i);
});

test('the kernel refuses legacy address machinery in code but not in provenance prose', () => {
  // Provenance prose that mentions the rejected shape must NOT trip the scanner.
  assert.deepEqual(
    scanSources({
      'src/core/notes.ts':
        '/** there is no `/ww/` segment and no siteCode, countryCode or geoIp here */\nexport const x = 1;\n',
    }),
    [],
  );

  // The same markers in executable code must be refused.
  for (const source of [
    'export const siteCode = "ww";\n',
    'export const path = "/ww/" + locale;\n',
    'export const countryCode = header.slice(0, 2);\n',
    'export const geoIp = lookupCountry;\n',
  ]) {
    const violations = scanSources({ 'src/core/legacy.ts': source });
    assert.equal(violations.length, 1, source);
    assert.match(violations[0], /legacy/);
  }
});
