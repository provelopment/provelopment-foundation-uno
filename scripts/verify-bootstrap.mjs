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

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Files that must exist, be ordinary files, and be non-empty. */
export const REQUIRED_FILES = Object.freeze([
  'README.md',
  'AGENTS.md',
  'LICENSE',
  '.gitignore',
  '.documents/SOP/sop-implementation.md',
  '.documents/Architecture/source-inventory.md',
  '.documents/WIP/plan-roadmap.md',
  '.documents/WIP/plan-next.md',
  '.documents/WIP/plan-outlook.md',
  '.github/workflows/verify-bootstrap.yml',
  'tests/bootstrap.test.mjs',
]);

/** The canonical Uno documentation folder (identity only — never mirrored here). */
export const CANONICAL_DOCS_FOLDER_ID = '1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0';

/** The Owner-installed order filename and the exact ignore rule that must screen it. */
export const WORK_ORDER_FILE = 'workorder-active.md';
export const WORK_ORDER_IGNORE_PATH = '.documents/WIP/workorder-active.md';

/**
 * The three public planning slots that must be tracked.
 *
 * The fourth WIP slot is the private ACTIVE order. It must never be *required*: it does not
 * exist in a hosted CI checkout and must never be published. This validator therefore never
 * requires it and never reads its body.
 */
export const PUBLIC_PLAN_SLOTS = Object.freeze([
  '.documents/WIP/plan-roadmap.md',
  '.documents/WIP/plan-next.md',
  '.documents/WIP/plan-outlook.md',
]);

/** The complete, closed set of entries permitted in `.documents/WIP/`. */
const ALLOWED_WIP_ENTRIES = new Set([
  'plan-roadmap.md',
  'plan-next.md',
  'plan-outlook.md',
  WORK_ORDER_FILE,
]);

/** Distinct diagnostics for the local SOP and the tracked planning slots. */
const REQUIRED_FILE_MESSAGES = new Map([
  ['.documents/SOP/sop-implementation.md', 'missing or empty local implementation SOP'],
  ['.documents/WIP/plan-roadmap.md', 'missing or empty tracked planning slot'],
  ['.documents/WIP/plan-next.md', 'missing or empty tracked planning slot'],
  ['.documents/WIP/plan-outlook.md', 'missing or empty tracked planning slot'],
]);

/**
 * Public prose that must never carry secrets or a machine-specific private path.
 * Scoped to published documents, where a leak would realistically occur.
 */
export const PUBLIC_DOCUMENTS = Object.freeze([
  'README.md',
  'AGENTS.md',
  '.documents/SOP/sop-implementation.md',
  '.documents/Architecture/source-inventory.md',
  '.documents/WIP/plan-roadmap.md',
  '.documents/WIP/plan-next.md',
  '.documents/WIP/plan-outlook.md',
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

/**
 * Durable public truth rules for `README.md`.
 *
 * The README is not a status log: progress authority is current `main` plus the single execution
 * report, the repository is a technical baseline, and no declaration or passing test may be read as
 * a published website, release or deployment. Both this validator and the architecture gate consume
 * this list, so the two gates cannot drift apart. Superseded stage wording is refused so an old
 * claim cannot come back and quietly contradict the current governance contract.
 */
export const OBSOLETE_README_CLAIMS = Object.freeze([
  'not implemented yet',
  'projected Page header',
  'exactly one public Site',
  'one selected public Site',
  'U01 remains open',
  'U03 is open',
  'Node.js 24',
]);

export const README_TRUTH_RULES = Object.freeze([
  { label: 'missing-baseline', ok: (body) => /technical baseline/i.test(body) },
  {
    label: 'missing-progress-authority',
    ok: (body) => body.includes('provelopment/provelopment-foundation-uno'),
  },
  { label: 'missing-current-main', ok: (body) => /current\s+`?main\b/i.test(body) },
  { label: 'missing-report-link', ok: (body) => /execution-report\.md/.test(body) },
  {
    label: 'missing-publication-disclaimer',
    ok: (body) => /does not establish a published website/i.test(body),
  },
  {
    label: 'missing-release-disclaimer',
    ok: (body) => /does not authorize (a )?release or deployment/i.test(body),
  },
  { label: 'published-website-claim', ok: (body) => !/is a published (Uno )?website/i.test(body) },
  {
    label: 'pinned-commit',
    ok: (body) => !/(?=[0-9a-f]*[0-9])[0-9a-f]{7,40}/.test(body),
  },
  {
    label: 'obsolete-claim',
    ok: (body) =>
      !OBSOLETE_README_CLAIMS.some((claim) => body.toLowerCase().includes(claim.toLowerCase())),
  },
]);

/**
 * Evaluate the durable README truth rules against one README body.
 *
 * @param {string} body normalised README text
 * @returns {Array<{ label: string, issue: string }>} violations; empty when the README is truthful
 */
export function README_TRUTH_ISSUES(body) {
  const issues = [];
  for (const { label, ok } of README_TRUTH_RULES) {
    if (!ok(body)) {
      issues.push({ label, issue: `README.md violates the durable truth rule (${label})` });
    }
  }
  for (const claim of OBSOLETE_README_CLAIMS) {
    if (body.toLowerCase().includes(claim.toLowerCase())) {
      issues.push({
        label: 'obsolete-claim',
        issue: `README.md must not reintroduce the superseded claim (${claim})`,
      });
    }
  }
  return issues;
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
      const specific = REQUIRED_FILE_MESSAGES.get(rel);
      issues.push(
        specific ? `${specific}: ${rel}` : `missing, not a regular file, or empty: ${rel}`,
      );
    }
  }

  // --- 2. README states the durable public truth, not a frozen stage ----------
  const readme = text('README.md');
  if (readme) {
    for (const { issue } of README_TRUTH_ISSUES(readme)) issues.push(issue);
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
    if (rules.includes('.documents/WIP')) {
      issues.push(
        'the entire .documents/WIP directory must not be ignored: ' +
          'only the private work order is screened, the three plan-*.md slots must stay trackable',
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

  // --- 8. Exactly four WIP slots, and nothing else ----------------------------
  // The private ACTIVE order is permitted here but never required and never read: a hosted
  // CI checkout legitimately contains only the three public plan files. No allowlist
  // exceptions are granted for any other file or subdirectory.
  const wipDir = at('.documents/WIP');
  if (existsSync(wipDir)) {
    let entries = [];
    try {
      entries = readdirSync(wipDir);
    } catch {
      issues.push('.documents/WIP exists but is not readable');
    }
    for (const name of entries) {
      if (!ALLOWED_WIP_ENTRIES.has(name)) {
        issues.push(
          'unexpected entry in .documents/WIP (only plan-roadmap.md, plan-next.md, ' +
            `plan-outlook.md and the private ${WORK_ORDER_FILE} are permitted): ${name}`,
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
        'four-slot WIP discipline intact, private authority screened, no Hub/Spoke data, ' +
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
