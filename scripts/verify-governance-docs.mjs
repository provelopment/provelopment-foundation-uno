#!/usr/bin/env node
/** Owner-frozen public prose. Only an exact Owner-approved work order may change these bytes or this gate. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const FROZEN_GOVERNANCE_FILES = Object.freeze([
  { path: 'AGENTS.md', sha256: '6c6d5dcba44c9769df8a18db00d4791b38fc804759cb1da14e20daf9de31ca6f', maxBytes: 3200 },
  { path: 'README.md', sha256: '97f93bdaf710bac53e3be48be0365c414042e89ef4461e55e98852cd0fd1995a', maxBytes: 3200 },
  { path: '.documents/SOP/sop-implementation.md', sha256: '6d790ad43349c434297d4d8a1e98311a822d4ec31df67aa882542aeab21cb388', maxBytes: 6000 },
]);

/** Pure reader injection supports refusal tests without writing fixtures. */
export function validateGovernanceDocs(read = (relative) => readFileSync(resolve(ROOT, relative))) {
  const issues = [];
  for (const item of FROZEN_GOVERNANCE_FILES) {
    let bytes;
    try {
      bytes = read(item.path);
    } catch {
      issues.push(`${item.path}: missing/unreadable; Owner-controlled governance file`);
      continue;
    }
    if (!Buffer.isBuffer(bytes)) {
      issues.push(`${item.path}: reader must return unmodified bytes`);
      continue;
    }
    if (bytes.length > item.maxBytes) {
      issues.push(`${item.path}: exceeds Owner-approved ${item.maxBytes}-byte cap`);
    }
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== item.sha256) {
      issues.push(`${item.path}: content changed without Owner-approved SHA-256 update`);
    }
  }
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = validateGovernanceDocs();
  if (issues.length > 0) {
    for (const issue of issues) process.stderr.write(`FAIL  ${issue}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('PASS  AGENTS.md, README.md and local SOP match Owner-frozen bytes\n');
  }
}
