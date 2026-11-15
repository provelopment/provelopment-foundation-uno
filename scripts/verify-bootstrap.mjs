#!/usr/bin/env node
/**
 * Foundation Uno — U00 bootstrap validator.
 *
 * Dependency-free. `validateBootstrap(root)` is a pure function over the filesystem:
 * it reads, never writes, and returns an array of human-readable issue strings. An
 * empty array means the scaffold is correct.
 *
 * This validator answers one question only: "is this repository still the intended
 * U00 project scaffold, and has nothing private or out-of-scope slipped in?"
 *
 * It does NOT build, test or evaluate a Next.js application. There is no application
 * at U00. It proves a governance scaffold, nothing about runtime behaviour.
 *
 * Usage:
 *   node scripts/verify-bootstrap.mjs          # validates this checkout
 *   import { validateBootstrap } from './scripts/verify-bootstrap.mjs'
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Files that must exist, be ordinary files, and be non-empty. */
export const REQUIRED_FILES = Object.freeze([
  'README.md',
  'AGENTS.md',
  'LICENSE',
  '.gitignore',
  '.documents/Architecture/source-inventory.md',
  '.github/workflows/verify-bootstrap.yml',
  'tests/bootstrap.test.mjs',
]);

/** The canonical Uno documentation folder (identity only — never mirrored here). */
export const CANONICAL_DOCS_FOLDER_ID = '1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0';

/** The Owner-installed order filename and the exact ignore rule that must screen it. */
export const WORK_ORDER_FILE = 'workorder-active.md';
export const WORK_ORDER_IGNORE_PATH = '.documents/WIP/workorder-active.md';

/**
 * Public prose that must never carry secrets or a machine-specific private path.
 * Scoped to published documents, where a leak would realistically occur.
 */
export const PUBLIC_DOCUMENTS = Object.freeze([
  'README.md',
  'AGENTS.md',
  '.documents/Architecture/source-inventory.md',
  '.documents/Reports/execution-report.md',
]);

/** Paths that must not exist at all: Hub/Spoke data and copied upstream runtime. */
export const FORBIDDEN_PATHS = Object.freeze([
  {
    path: 'deployment/spokes.json',
    issue:
      'Hub/Spoke deployment data must not enter the U00 scaffold (found deployment/spokes.json)',
  },
  {
    path: 'deployment/spokes',
    issue:
      'the upstream Spoke deployment tree must not be copied into U00 (found deployment/spokes/)',
  },
  {
    path: '00.foundation-template',
    issue:
      'a copy of the upstream template must not exist inside the Uno root (found 00.foundation-template)',
  },
  {
    path: 'src/core/efs/publication.ts',
    issue:
      'upstream Foundation runtime source must not be copied at U00 (found src/core/efs/publication.ts)',
  },
]);

/**
 * Shapes that indicate a real credential leak, and machine-specific private paths.
 * Assembled from fragments so this file can never match itself.
 */
const CREDENTIAL_PATTERNS = Object.freeze([
  { label: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  {
    label: 'GitHub fine-grained token',
    // Assembled at runtime so no token-shaped literal appears in this file.
    re: new RegExp(['github', 'pat'].join('_') + '_[A-Za-z0-9_]{20,}'),
  },
  { label: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: 'OpenAI-style secret key', re: /\bsk-[A-Za-z0-9]{32,}\b/ },
  {
    label: 'PEM private key block',
    re: new RegExp(['BEGIN', 'PRIVATE KEY'].join('[ -]')),
  },
  { label: 'JSON Web Token', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./ },
]);

const PRIVATE_PATH_PATTERNS = Object.freeze([
  { label: 'Windows user-profile path', re: /[A-Za-z]:[\\/]{1,2}Users[\\/]{1,2}/ },
  { label: 'WSL Windows-mount path', re: /[\\/]mnt[\\/][a-z][\\/]/ },
]);

/** Read a file with line endings normalised, so assertions are platform-independent. */
function readText(path) {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function isNonEmptyFile(path) {
  try {
    return statSync(path).isFile() && readFileSync(path).length > 0;
  } catch {
    return false;
  }
}

/** Return the ignore rules of a .gitignore as bare, slash-trimmed values. */
function gitignoreRules(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.replace(/^\/+/, '').replace(/\/+$/, ''));
}

/**
 * Validate the Foundation Uno U00 bootstrap scaffold.
 *
 * @param {string} root absolute path to the Uno project root
 * @returns {string[]} descriptive issues; empty when the scaffold is correct
 */
export function validateBootstrap(root) {
  const issues = [];

  if (typeof root !== 'string' || root.trim() === '') {
    return ['root must be a non-empty path string'];
  }

  const base = resolve(root);
  if (!existsSync(base)) {
    return [`root does not exist: ${base}`];
  }
  try {
    if (!statSync(base).isDirectory()) {
      return [`root is not a directory: ${base}`];
    }
  } catch {
    return [`root is not readable: ${base}`];
  }

  const at = (rel) => resolve(base, rel);
  const text = (rel) => {
    try {
      return readText(at(rel));
    } catch {
      return '';
    }
  };

  // --- 1. Required files exist, are ordinary files, and are non-empty ----------
  for (const rel of REQUIRED_FILES) {
    if (!isNonEmptyFile(at(rel))) {
      issues.push(`missing, not a regular file, or empty: ${rel}`);
    }
  }

  // --- 2. README tells the truth about the stage ------------------------------
  const readme = text('README.md');
  if (readme && !/not implemented yet/i.test(readme)) {
    issues.push('README.md must state that the Uno runtime is not implemented yet');
  }

  // --- 3. AGENTS anchors to the canonical records and the physical order ------
  const agents = text('AGENTS.md');
  if (agents) {
    if (!agents.includes(CANONICAL_DOCS_FOLDER_ID)) {
      issues.push('AGENTS.md must reference the canonical Uno documentation folder');
    }
    if (!agents.includes(WORK_ORDER_FILE)) {
      issues.push(`AGENTS.md must reference the local work order filename (${WORK_ORDER_FILE})`);
    }
  }

  // --- 4. The licence is the real Apache-2.0 text -----------------------------
  const license = text('LICENSE');
  if (license) {
    if (!license.includes('Apache License')) {
      issues.push('LICENSE must contain the Apache License text');
    }
    if (!license.includes('Version 2.0')) {
      issues.push('LICENSE must contain "Version 2.0" (Apache License, Version 2.0)');
    }
  }

  // --- 5. Private authority and task scratch are screened from publication ----
  if (isNonEmptyFile(at('.gitignore'))) {
    const rules = gitignoreRules(text('.gitignore'));

    if (!rules.includes(WORK_ORDER_IGNORE_PATH)) {
      issues.push(
        `.gitignore must exclude the exact Owner work order path (${WORK_ORDER_IGNORE_PATH})`,
      );
    }
    if (!rules.includes('.temp')) {
      issues.push('.gitignore must exclude .temp (agent task scratch)');
    }
  }

  // --- 6. No Hub/Spoke data and no copied upstream source ---------------------
  for (const { path: rel, issue } of FORBIDDEN_PATHS) {
    if (existsSync(at(rel))) {
      issues.push(issue);
    }
  }

  // --- 7. Published documents carry no secrets or private machine paths -------
  for (const rel of PUBLIC_DOCUMENTS) {
    if (!existsSync(at(rel))) continue; // optional documents are skipped when absent
    const body = text(rel);
    for (const { label, re } of CREDENTIAL_PATTERNS) {
      if (re.test(body)) {
        issues.push(`public document may contain a credential (${label}): ${rel}`);
      }
    }
    for (const { label, re } of PRIVATE_PATH_PATTERNS) {
      if (re.test(body)) {
        issues.push(
          `public document must not contain a machine-specific private path (${label}): ${rel}`,
        );
      }
    }
  }

  return issues;
}

/** Run the validator against a checkout and print a diagnostic summary. */
export function main(root = process.cwd()) {
  const issues = validateBootstrap(root);
  if (issues.length === 0) {
    process.stdout.write(
      'verify-bootstrap: OK - ' +
        `${REQUIRED_FILES.length} required files present, licence verified, ` +
        'private authority screened, no Hub/Spoke data, ' +
        'no credential or private-path leaks.\n',
    );
    return 0;
  }

  process.stderr.write(`verify-bootstrap: ${issues.length} issue(s) found in ${resolve(root)}\n`);
  for (const issue of issues) {
    process.stderr.write(`  - ${issue}\n`);
  }
  process.stderr.write('verify-bootstrap: FAILED - the U00 scaffold is not in its intended state.\n');
  return 1;
}

// CLI entry point only when executed directly: importing this module (as the tests do)
// must never validate the current working directory as a side effect.
const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = main();
}
