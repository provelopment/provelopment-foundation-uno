import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { prepareUnoU03FixtureTransaction } from '../../scripts/uno-u03-fixture-transaction.mjs';

/**
 * Foundation Uno — publication-fixture transaction fault injection (`UNO-WO-030 / R01`).
 *
 * Every case runs against an isolated, test-owned root under the checkout's ignored `.temp/wo031-*`, so no real
 * committed deployment input is touched. Each case drives the *same* exported transaction operations the positive HTTP
 * runner uses and asserts original digest parity, absence of every fixture source, refusal or failure status, and
 * either clean scratch removal or deliberate backup retention. Failures are induced with deterministic injected writer
 * callbacks — never with real permissions or timing races — and the suite executes the real helper throughout.
 */
const ROOT = resolve(process.cwd());
const SCRATCH_PARENT = join(ROOT, '.temp');

const MANIFEST = 'deployment/efs/manifest.json';
const SELECTION = 'deployment/uno.config.json';
const HOME = 'deployment/efs/content/home.en-001.md';
const HOME_BYTES = Buffer.from('# Home\n\nA synthetic Home source.\n', 'utf8');
const FIXTURE_SOURCES = [
  'deployment/efs/content/wo031-home.de-de.md',
  'deployment/efs/content/wo031-about.en-001.md',
  'deployment/efs/content/wo031-about.de-de.md',
  'deployment/efs/content/wo031-draft.en-001.md',
  'deployment/efs/content/wo031-hidden.en-001.json',
];

const ORIGINAL_MANIFEST = Buffer.from('{ "entities": [], "note": "synthetic committed declaration" }\n', 'utf8');
const ORIGINAL_SELECTION = Buffer.from('{ "version": 1, "base": null }\n', 'utf8');
const FIXTURE_MANIFEST = Buffer.from('{ "entities": [{ "id": "fixture" }] }\n', 'utf8');
const FIXTURE_SELECTION = Buffer.from('{ "version": 1, "base": { "canonical": "http://localhost:3000" } }\n', 'utf8');

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** One isolated sandbox: a private root, private scratch, both declarations and the Home source. */
function makeSandbox() {
  mkdirSync(SCRATCH_PARENT, { recursive: true });
  const sandbox = mkdtempSync(join(SCRATCH_PARENT, 'wo031-tx-'));
  const root = join(sandbox, 'root');
  const scratchRoot = join(sandbox, 'scratch');
  mkdirSync(join(root, 'deployment', 'efs', 'content'), { recursive: true });
  mkdirSync(scratchRoot, { recursive: true });
  writeFileSync(join(root, MANIFEST), ORIGINAL_MANIFEST);
  writeFileSync(join(root, SELECTION), ORIGINAL_SELECTION);
  writeFileSync(join(root, HOME), HOME_BYTES);

  return {
    sandbox,
    root,
    scratchRoot,
    declarations: [
      { path: MANIFEST, digest: sha256(ORIGINAL_MANIFEST) },
      { path: SELECTION, digest: sha256(ORIGINAL_SELECTION) },
    ],
    replacements: [
      { path: MANIFEST, bytes: FIXTURE_MANIFEST },
      { path: SELECTION, bytes: FIXTURE_SELECTION },
    ],
    fixtureSources: FIXTURE_SOURCES.map((path) => ({ path, bytes: `# ${path}\n` })),
    cleanup: () => rmSync(sandbox, { recursive: true, force: true }),
  };
}

/**
 * The real filesystem operations, with hooks that fail one chosen operation deterministically.
 *
 * `failWrite` is the 1-based index of the mutating operation that throws, counting declaration replacements and
 * *exclusive claims* in the order the transaction makes them: 1 = the manifest, 2 = the selection, 3..7 = the five
 * fixture claims. `failContentAt` fails the nth content write through an already-claimed handle, optionally after
 * writing `partialBytes` first, which is the "owned file, partial content" state.
 *
 * Scratch writes (recovery copies and the identity probe) are never fault positions: they belong to the transaction's
 * own private directory, not to the repository the fixture touches.
 */
function makeWriter({
  failWrite = 0,
  failRemove = false,
  failRestore = false,
  failContentAt = 0,
  partialBytes = 0,
} = {}) {
  let writes = 0;
  let restoring = false;
  let stopped = false;
  let contentWrites = 0;
  const recorded = [];
  const handlePaths = new Map();
  const isScratch = (path) => path.endsWith('.original') || path.endsWith('identity-probe');

  const note = (path) => {
    recorded.push(path);
    writes += 1;
    if (failWrite !== 0 && writes === failWrite) {
      stopped = true;
      throw new Error('injected write failure');
    }
  };

  return {
    lstat: (path) => lstatSync(path),
    realpath: (path) => realpathSync(path),
    readFile: (path) => readFileSync(path),
    writeFileReplace: (path, bytes) => {
      const counted = !isScratch(path);
      if (counted && restoring && failRestore) throw new Error('injected restore write failure');
      if (counted && !stopped) note(path);
      writeFileSync(path, bytes);
    },
    openExclusive: (path) => {
      const counted = !isScratch(path);
      if (counted && !stopped) note(path);
      const handle = openSync(path, 'wx');
      handlePaths.set(handle, path);
      return handle;
    },
    statOfHandle: (handle) => fstatSync(handle),
    writeToHandle: (handle, bytes) => {
      const path = handlePaths.get(handle) ?? '';
      if (!isScratch(path)) {
        contentWrites += 1;
        if (failContentAt !== 0 && contentWrites === failContentAt) {
          if (partialBytes > 0) writeSync(handle, bytes.subarray(0, partialBytes));
          throw new Error('injected content write failure');
        }
      }
      writeSync(handle, bytes);
    },
    closeHandle: (handle) => {
      handlePaths.delete(handle);
      closeSync(handle);
    },
    removeFile: (path) => {
      if (restoring && failRestore) throw new Error('injected remove failure');
      if (failRemove) throw new Error('injected remove failure');
      unlinkSync(path);
    },
    makeScratch: (parent) => mkdtempSync(join(parent, 'tx-')),
    removeScratch: (path) => rmSync(path, { recursive: true, force: true }),
    enterRestore: () => {
      restoring = true;
    },
    writes: () => writes,
    contentWrites: () => contentWrites,
    /** The counted declaration/fixture operations attempted before the injected failure, in order. */
    recorded: () => [...recorded],
  };
}

/** Assert the sandbox is back to its exact original bytes and holds no fixture source. */
function assertRestored(root) {
  assert.equal(sha256(readFileSync(join(root, MANIFEST))), sha256(ORIGINAL_MANIFEST), 'manifest restored');
  assert.equal(sha256(readFileSync(join(root, SELECTION))), sha256(ORIGINAL_SELECTION), 'selection restored');
  assert.equal(sha256(readFileSync(join(root, HOME))), sha256(HOME_BYTES), 'Home source untouched');
  for (const path of FIXTURE_SOURCES) {
    assert.equal(existsSync(join(root, path)), false, `${path} must be absent`);
  }
}

/** True when this host can create symlinks at all; individual fixtures report NOT APPLICABLE when it cannot. */
function symlinksSupported(probeDirectory) {
  const probe = join(probeDirectory, 'probe-link');
  try {
    symlinkSync(join(probeDirectory, 'missing-target'), probe);
    unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

test('happy path: install then restore returns the exact original bytes and leaves no fixture', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    if (transaction.status !== 'armed') {
      assert.deepEqual(transaction.reasons, [], 'the happy path must arm');
    }

    const installed = await transaction.install();
    assert.equal(installed.ok, true);
    assert.equal(sha256(readFileSync(join(sandbox.root, MANIFEST))), sha256(FIXTURE_MANIFEST), 'fixture installed');
    for (const path of FIXTURE_SOURCES) assert.equal(existsSync(join(sandbox.root, path)), true);

    const restored = await transaction.restore();
    assert.equal(restored.ok, true);
    assert.equal(restored.backups, 2);
    assertRestored(sandbox.root);
    assert.equal(transaction.describe().verified, true);

    const disposed = await transaction.dispose();
    assert.equal(disposed.ok, true);
    assert.deepEqual(readdirSync(sandbox.scratchRoot), [], 'scratch holds no transaction data');
  } finally {
    sandbox.cleanup();
  }
});

test('restore is idempotent: a repeated call reports success and changes nothing', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'armed');
    assert.equal((await transaction.install()).ok, true);

    const first = await transaction.restore();
    const second = await transaction.restore();
    assert.equal(first.ok, true);
    assert.equal(first.idempotent, false);
    assert.equal(second.ok, true);
    assert.equal(second.idempotent, true);
    assertRestored(sandbox.root);
  } finally {
    sandbox.cleanup();
  }
});

test('preflight refuses a wrong original digest and touches nothing', async () => {
  const sandbox = makeSandbox();
  try {
    const wrong = [
      { path: MANIFEST, digest: sha256(Buffer.from('not the original\n')) },
      { path: SELECTION, digest: sha256(ORIGINAL_SELECTION) },
    ];
    const transaction = await prepareUnoU03FixtureTransaction({
      ...sandbox,
      declarations: wrong,
      writer: makeWriter(),
    });
    assert.equal(transaction.status, 'refused');
    assert.ok(transaction.reasons.some((entry) => entry.startsWith('original:digest-mismatch')));
    assertRestored(sandbox.root);
    assert.deepEqual(readdirSync(sandbox.scratchRoot), [], 'no backups were created');
  } finally {
    sandbox.cleanup();
  }
});

test('preflight refuses a pre-existing fixture path and never deletes the unknown file', async () => {
  const sandbox = makeSandbox();
  try {
    const occupied = join(sandbox.root, FIXTURE_SOURCES[2]);
    const unknown = Buffer.from('# an unknown file the agent must not delete\n', 'utf8');
    writeFileSync(occupied, unknown);

    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'refused');
    assert.ok(transaction.reasons.some((entry) => entry.startsWith('fixture:pre-existing')));
    assert.equal(sha256(readFileSync(occupied)), sha256(unknown), 'the unknown file survives byte-for-byte');
    assert.equal(sha256(readFileSync(join(sandbox.root, MANIFEST))), sha256(ORIGINAL_MANIFEST));
  } finally {
    sandbox.cleanup();
  }
});

test('preflight refuses a dangling symlink at a fixture path', async (t) => {
  const sandbox = makeSandbox();
  try {
    if (!symlinksSupported(sandbox.sandbox)) {
      t.diagnostic('NOT APPLICABLE: this host cannot create symlinks; containment is still enforced natively.');
      assert.equal(sha256(readFileSync(join(sandbox.root, MANIFEST))), sha256(ORIGINAL_MANIFEST));
      return;
    }
    symlinkSync(join(sandbox.sandbox, 'absent-target'), join(sandbox.root, FIXTURE_SOURCES[0]));
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'refused');
    assert.ok(
      transaction.reasons.some(
        (entry) => entry.includes('path:symlink') || entry.startsWith('fixture:pre-existing'),
      ),
    );
    assert.equal(lstatSync(join(sandbox.root, FIXTURE_SOURCES[0])).isSymbolicLink(), true, 'link left alone');
  } finally {
    sandbox.cleanup();
  }
});

test('preflight refuses a symlinked parent directory', async (t) => {
  const sandbox = makeSandbox();
  try {
    if (!symlinksSupported(sandbox.sandbox)) {
      t.diagnostic('NOT APPLICABLE: this host cannot create symlinks; containment is still enforced natively.');
      assert.equal(sha256(readFileSync(join(sandbox.root, MANIFEST))), sha256(ORIGINAL_MANIFEST));
      return;
    }
    const elsewhere = join(sandbox.sandbox, 'elsewhere');
    mkdirSync(elsewhere, { recursive: true });
    const linkedParent = join(sandbox.root, 'linked-parent');
    symlinkSync(elsewhere, linkedParent, 'junction');

    const transaction = await prepareUnoU03FixtureTransaction({
      ...sandbox,
      fixtureSources: [{ path: 'linked-parent/wo031-escape.md', bytes: '# escape\n' }],
      writer: makeWriter(),
    });
    assert.equal(transaction.status, 'refused');
    assert.ok(transaction.reasons.some((entry) => entry.includes('path:symlink') || entry.includes('path:reparse')));
    assert.equal(existsSync(join(elsewhere, 'wo031-escape.md')), false, 'nothing was created through the link');
  } finally {
    sandbox.cleanup();
  }
});

test('preflight refuses an absent scratch root', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({
      ...sandbox,
      scratchRoot: join(sandbox.sandbox, 'no-such-scratch'),
      writer: makeWriter(),
    });
    assert.equal(transaction.status, 'refused');
    assert.deepEqual(transaction.reasons, ['scratch:absent']);
    assertRestored(sandbox.root);
  } finally {
    sandbox.cleanup();
  }
});


/**
 * One write-position case: the transaction must roll back from any failure once it has begun to mutate, and the
 * originals must be byte-exact afterwards. Write 1 is the manifest, 2 the selection, 3..7 the five fixture sources.
 */
async function assertWriteFaultRestores(failWrite) {
  const sandbox = makeSandbox();
  try {
    const writer = makeWriter({ failWrite });
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer });
    assert.equal(transaction.status, 'armed');

    const installed = await transaction.install();
    assert.equal(installed.ok, false, 'a failed write is never reported as success');
    // The injected failure landed on the intended position of the real write sequence.
    const expectedSequence = [MANIFEST, SELECTION, ...FIXTURE_SOURCES];
    const attempted = writer.recorded().map((path) => path.slice(sandbox.root.length + 1).replaceAll('\\', '/'));
    assert.deepEqual(attempted, expectedSequence.slice(0, failWrite), `failure at write ${failWrite}`);
    assert.equal(installed.rollback.ok, true, 'rollback ran inside install()');

    const restored = await transaction.restore();
    assert.equal(restored.ok, true, 'the caller restore also verifies');
    assertRestored(sandbox.root);
    assert.equal(transaction.describe().backupsPreserved, 0);
    assert.equal((await transaction.dispose()).ok, true);
    assert.deepEqual(readdirSync(sandbox.scratchRoot), [], 'no transaction scratch survives a verified restore');
  } finally {
    sandbox.cleanup();
  }
}

test('write fault 1: failure before the first write still restores', () => assertWriteFaultRestores(1));
test('write fault 2: failure immediately after the manifest overwrite restores', () => assertWriteFaultRestores(2));
test('write fault 3: failure after the config overwrite restores', () => assertWriteFaultRestores(3));
test('write fault 4: failure at the second fixture creation restores', () => assertWriteFaultRestores(4));
test('write fault 5: failure at the third fixture creation restores', () => assertWriteFaultRestores(5));
test('write fault 6: failure at the fourth fixture creation restores', () => assertWriteFaultRestores(6));
test('write fault 7: failure at the fifth fixture creation restores', () => assertWriteFaultRestores(7));

test('a caller exception after a complete install still restores in finally', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'armed');

    let observed = null;
    try {
      assert.equal((await transaction.install()).ok, true);
      throw new Error('stand-in for a failed production build or HTTP assertion');
    } catch (error) {
      observed = error;
    } finally {
      const restored = await transaction.restore();
      assert.equal(restored.ok, true);
    }
    assert.equal(observed?.message.includes('stand-in'), true, 'the caller exception is preserved');
    assertRestored(sandbox.root);
  } finally {
    sandbox.cleanup();
  }
});

test('a second transaction refuses a sandbox that already holds the fixture', async () => {
  const sandbox = makeSandbox();
  try {
    const first = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(first.status, 'armed');
    assert.equal((await first.install()).ok, true);

    const second = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(second.status, 'refused', 'a mid-fixture sandbox is refused, never treated as absent');
    assert.ok(second.reasons.every((entry) => entry.startsWith('fixture:') || entry.startsWith('original:')));

    assert.equal((await first.restore()).ok, true);
    assertRestored(sandbox.root);
  } finally {
    sandbox.cleanup();
  }
});


test('a restore that cannot write fails closed, keeps the backups, then succeeds once the fault is gone', async () => {
  const sandbox = makeSandbox();
  try {
    const writer = makeWriter();
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer });
    assert.equal(transaction.status, 'armed');
    assert.equal((await transaction.install()).ok, true);

    // From here every restoring write and removal fails, exactly like a read-only volume or a lost handle.
    const healthy = { writeFileReplace: writer.writeFileReplace, removeFile: writer.removeFile };
    writer.writeFileReplace = () => {
      throw new Error('injected restore write failure');
    };
    writer.removeFile = () => {
      throw new Error('injected remove failure');
    };

    const failed = await transaction.restore();
    assert.equal(failed.ok, false, 'a failed restore is never reported as success');
    assert.ok(failed.reasons.length > 0);
    assert.equal(failed.backupsPreserved, 2, 'both recovery copies stay on disk');
    assert.equal(readdirSync(sandbox.scratchRoot).length, 1, 'the transaction scratch is retained for the Owner');
    assert.equal((await transaction.dispose()).ok, false, 'unverified scratch is never discarded');
    assert.equal(transaction.describe().verified, false, 'the transaction is still unverified, not restored');
    assert.equal(transaction.describe().backupsPreserved, 2);

    // The fault is removed: the same transaction can now verify and clean up only its own scratch.
    writer.writeFileReplace = healthy.writeFileReplace;
    writer.removeFile = healthy.removeFile;
    const recovered = await transaction.restore();
    assert.equal(recovered.ok, true);
    assertRestored(sandbox.root);
    assert.equal((await transaction.dispose()).ok, true);
    assert.deepEqual(readdirSync(sandbox.scratchRoot), [], 'only transaction-owned scratch was removed');
  } finally {
    sandbox.cleanup();
  }
});

test('successful cases leave no stray .temp/wo031-* data behind', async () => {
  mkdirSync(SCRATCH_PARENT, { recursive: true });
  const sandbox = makeSandbox();
  const ownedSandbox = sandbox.sandbox;
  let transaction;
  try {
    transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'armed');
    assert.equal((await transaction.install()).ok, true);
    assert.equal((await transaction.restore()).ok, true);
    assert.equal((await transaction.dispose()).ok, true);
    // Ownership evidence, never a peer snapshot: *this* transaction's own scratch root is empty, and the only
    // directory this case created is the one about to be removed. A concurrent case owning its own `wo031-*`
    // sandbox can neither make this pass nor make it fail.
    assert.deepEqual(readdirSync(sandbox.scratchRoot), [], 'this transaction retained no scratch');
  } finally {
    sandbox.cleanup();
  }
  assert.equal(existsSync(ownedSandbox), false, 'the sandbox this case created is gone');
});

test('the ownership assertion is not vacuous: skipping dispose leaves owned scratch behind', async () => {
  mkdirSync(SCRATCH_PARENT, { recursive: true });
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'armed');
    assert.equal((await transaction.install()).ok, true);
    assert.equal((await transaction.restore()).ok, true);
    // Mutation guard: the two assertions above would be meaningless if scratch never existed. Without `dispose`
    // the transaction's own scratch must still be present, so removing `dispose()` from the positive case above
    // makes that case fail rather than silently pass.
    assert.notDeepEqual(readdirSync(sandbox.scratchRoot), [], 'owned scratch survives until dispose');
    assert.equal((await transaction.dispose()).ok, true);
    assert.deepEqual(readdirSync(sandbox.scratchRoot), [], 'dispose removes only the owned scratch');
  } finally {
    sandbox.cleanup();
  }
});

test('the transaction exposes one entry point and refuses an unauthorised call', async () => {
  const transactionModule = await import('../../scripts/uno-u03-fixture-transaction.mjs');
  assert.deepEqual(Object.keys(transactionModule).sort(), ['prepareUnoU03FixtureTransaction']);

  const noRoot = await prepareUnoU03FixtureTransaction({});
  assert.equal(noRoot.status, 'refused');
  assert.deepEqual(noRoot.reasons, ['root:not-absolute']);

  const noDeclarations = await prepareUnoU03FixtureTransaction({
    root: ROOT,
    scratchRoot: SCRATCH_PARENT,
    declarations: [],
    replacements: [],
    fixtureSources: [],
  });
  assert.equal(noDeclarations.status, 'refused');
  assert.deepEqual(noDeclarations.reasons, ['declarations:unspecified']);
});

// ---------------------------------------------------------------------------------------------------------------
// Ownership: exclusive creation is the boundary, identity is the proof, and a stranger is never removed.
// ---------------------------------------------------------------------------------------------------------------

/** The device/inode identity of a path, as the OS reports it. */
function identityOfPath(path) {
  const stats = lstatSync(path);
  return { dev: stats.dev, ino: stats.ino };
}

/** Assert only the declarations came back: a stranger keeps its own file. */
function assertDeclarationsRestored(root) {
  assert.equal(sha256(readFileSync(join(root, MANIFEST))), sha256(ORIGINAL_MANIFEST), 'manifest restored');
  assert.equal(sha256(readFileSync(join(root, SELECTION))), sha256(ORIGINAL_SELECTION), 'selection restored');
  assert.equal(sha256(readFileSync(join(root, HOME))), sha256(HOME_BYTES), 'Home source untouched');
}

test('an EEXIST at the first fixture path preserves the intervening file and claims nothing', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'armed');

    // The competitor appears after a successful arm but before install — exactly the window the previous version lost.
    const competitorPath = join(sandbox.root, FIXTURE_SOURCES[0]);
    const competitorBytes = Buffer.from('# unrelated file that appeared during the run\n', 'utf8');
    writeFileSync(competitorPath, competitorBytes);
    const competitorIdentity = identityOfPath(competitorPath);

    const installed = await transaction.install();
    assert.equal(installed.ok, false, 'a refused exclusive create is an install failure');
    assert.equal(installed.rollback.ok, true, 'the declarations still restore');
    assertDeclarationsRestored(sandbox.root);

    // The stranger survives byte-for-byte and identity-for-identity.
    assert.equal(sha256(readFileSync(competitorPath)), sha256(competitorBytes), 'competitor bytes preserved');
    assert.deepEqual(identityOfPath(competitorPath), competitorIdentity, 'competitor identity preserved');
    for (const path of FIXTURE_SOURCES.slice(1)) {
      assert.equal(existsSync(join(sandbox.root, path)), false, `${path} must be absent`);
    }
    assert.equal(transaction.describe().backupsPreserved, 0);
  } finally {
    sandbox.cleanup();
  }
});

test('an EEXIST at a later fixture path removes only the files this transaction owned', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'armed');

    const competitorPath = join(sandbox.root, FIXTURE_SOURCES[4]);
    const competitorBytes = Buffer.from('# fifth-path stranger\n', 'utf8');
    writeFileSync(competitorPath, competitorBytes);
    const competitorIdentity = identityOfPath(competitorPath);

    const installed = await transaction.install();
    assert.equal(installed.ok, false);
    assert.equal(installed.rollback.ok, true);
    assertDeclarationsRestored(sandbox.root);

    // The four files this transaction genuinely created are gone; the fifth path is the stranger's.
    for (const path of FIXTURE_SOURCES.slice(0, 4)) {
      assert.equal(existsSync(join(sandbox.root, path)), false, `${path} (owned) must be removed`);
    }
    assert.equal(sha256(readFileSync(competitorPath)), sha256(competitorBytes), 'competitor bytes preserved');
    assert.deepEqual(identityOfPath(competitorPath), competitorIdentity, 'competitor identity preserved');
    assert.equal(transaction.describe().backupsPreserved, 0);
  } finally {
    sandbox.cleanup();
  }
});


test('a partial content write after a successful claim removes the owned partial file', async () => {
  const sandbox = makeSandbox();
  try {
    const writer = makeWriter({ failContentAt: 1, partialBytes: 8 });
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer });
    assert.equal(transaction.status, 'armed');

    const installed = await transaction.install();
    assert.equal(installed.ok, false, 'a failed content write is an install failure');
    assert.equal(writer.contentWrites(), 1, 'the failure landed on the first content write');

    // The claim succeeded first, so this file is owned and its partial content must be removed.
    assert.equal(existsSync(join(sandbox.root, FIXTURE_SOURCES[0])), false, 'owned partial file removed');
    assert.equal(installed.rollback.ok, true);
    assertRestored(sandbox.root);
    assert.equal(transaction.describe().backupsPreserved, 0);
  } finally {
    sandbox.cleanup();
  }
});

test('a transaction-owned file replaced before restore is preserved and the restore fails closed', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer: makeWriter() });
    assert.equal(transaction.status, 'armed');
    assert.equal((await transaction.install()).ok, true);

    // Someone replaces an owned fixture with a different file at the same path.
    const ownedPath = join(sandbox.root, FIXTURE_SOURCES[1]);
    unlinkSync(ownedPath);
    const foreignBytes = Buffer.from('# a replacement that is not ours\n', 'utf8');
    writeFileSync(ownedPath, foreignBytes);
    const foreignIdentity = identityOfPath(ownedPath);

    const restored = await transaction.restore();
    assert.equal(restored.ok, false, 'an unprovable identity is never a clean restore');
    // A POSIX host may hand the freed inode to the replacement, so either refusal is the correct outcome.
    assert.ok(
      restored.reasons.some(
        (entry) => entry.startsWith('restore:identity:foreign') || entry.startsWith('restore:content:foreign'),
      ),
    );
    assert.equal(sha256(readFileSync(ownedPath)), sha256(foreignBytes), 'the replacement survives');
    assert.deepEqual(identityOfPath(ownedPath), foreignIdentity, 'the replacement identity survives');

    assert.equal(restored.backupsPreserved, 2, 'both recovery copies remain');
    assert.equal((await transaction.dispose()).ok, false, 'recovery scratch is never discarded unverified');
    assert.equal(transaction.describe().verified, false);

    // The bounded diagnostic must not leak a private absolute path.
    const diagnostic = JSON.stringify(transaction.describe());
    assert.equal(diagnostic.includes(sandbox.sandbox), false, 'no absolute sandbox path in the diagnostic');
    assert.equal(diagnostic.includes(sandbox.root), false, 'no absolute root in the diagnostic');
  } finally {
    sandbox.cleanup();
  }
});


test('a target in a sibling directory whose name extends the root is refused before any mutation', async () => {
  const sandbox = makeSandbox();
  try {
    // `/root-other` shares the root's leading characters, so a string prefix test would have accepted it.
    const sibling = join(sandbox.sandbox, 'root-other');
    mkdirSync(sibling, { recursive: true });
    const escaped = join(sibling, 'escape.md');

    const transaction = await prepareUnoU03FixtureTransaction({
      ...sandbox,
      fixtureSources: [{ path: escaped, bytes: '# escape\n' }],
      writer: makeWriter(),
    });
    assert.equal(transaction.status, 'refused');
    assert.ok(transaction.reasons.some((entry) => entry.startsWith('path:outside-root')));
    assert.equal(existsSync(escaped), false, 'nothing was created in the sibling');
    assertDeclarationsRestored(sandbox.root);
  } finally {
    sandbox.cleanup();
  }
});

test('a literal parent traversal is refused before any mutation', async () => {
  const sandbox = makeSandbox();
  try {
    const transaction = await prepareUnoU03FixtureTransaction({
      ...sandbox,
      fixtureSources: [{ path: '../outside.md', bytes: '# escape\n' }],
      writer: makeWriter(),
    });
    assert.equal(transaction.status, 'refused');
    assert.ok(transaction.reasons.some((entry) => entry.startsWith('path:outside-root')));
    assert.equal(existsSync(join(sandbox.sandbox, 'outside.md')), false, 'nothing was created outside the root');
    assertDeclarationsRestored(sandbox.root);
  } finally {
    sandbox.cleanup();
  }
});

test('a duplicate fixture path and a fixture colliding with a declaration are both refused', async () => {
  const sandbox = makeSandbox();
  try {
    const duplicate = await prepareUnoU03FixtureTransaction({
      ...sandbox,
      fixtureSources: [
        { path: FIXTURE_SOURCES[0], bytes: 'a\n' },
        { path: FIXTURE_SOURCES[0], bytes: 'b\n' },
      ],
      writer: makeWriter(),
    });
    assert.equal(duplicate.status, 'refused');
    assert.ok(duplicate.reasons.some((entry) => entry.startsWith('fixture:duplicate')));

    const colliding = await prepareUnoU03FixtureTransaction({
      ...sandbox,
      fixtureSources: [{ path: MANIFEST, bytes: 'collision\n' }],
      writer: makeWriter(),
    });
    assert.equal(colliding.status, 'refused');
    assert.ok(colliding.reasons.some((entry) => entry.startsWith('fixture:collides-with-declaration')));
    assertDeclarationsRestored(sandbox.root);
  } finally {
    sandbox.cleanup();
  }
});

test('a replacement that reuses the freed inode is still refused, by its content', async () => {
  const sandbox = makeSandbox();
  try {
    // ext4 hands a freed inode straight back to the next file created at the same path, so identity alone can agree
    // between this transaction's file and a stranger's replacement. This writer reproduces exactly that: for one path
    // it reports the *claimed* device/inode even though the file there is a different one.
    const base = makeWriter();
    let forced = null;
    const writer = {
      ...base,
      lstat: (path) => {
        if (forced !== null && path.toLowerCase() === forced.path.toLowerCase()) {
          const stats = lstatSync(path);
          return {
            dev: forced.identity.dev,
            ino: forced.identity.ino,
            size: stats.size,
            isSymbolicLink: () => false,
            isFile: () => true,
          };
        }
        return lstatSync(path);
      },
    };

    const transaction = await prepareUnoU03FixtureTransaction({ ...sandbox, writer });
    assert.equal(transaction.status, 'armed');
    assert.equal((await transaction.install()).ok, true);

    const ownedPath = join(sandbox.root, FIXTURE_SOURCES[2]);
    const claimedIdentity = identityOfPath(ownedPath);
    unlinkSync(ownedPath);
    const foreignBytes = Buffer.from('# stranger occupying the recycled inode\n', 'utf8');
    writeFileSync(ownedPath, foreignBytes);

    forced = { path: ownedPath, identity: claimedIdentity };

    const restored = await transaction.restore();
    assert.equal(restored.ok, false, 'content, not identity alone, decides ownership');
    assert.ok(
      restored.reasons.some(
        (entry) => entry.startsWith('restore:content:foreign') || entry.startsWith('restore:identity:foreign'),
      ),
      `expected a foreign-content refusal, saw ${JSON.stringify(restored.reasons)}`,
    );
    assert.equal(sha256(readFileSync(ownedPath)), sha256(foreignBytes), 'the stranger survives');
    assert.equal(restored.backupsPreserved, 2);
    assert.equal(transaction.describe().verified, false);
  } finally {
    sandbox.cleanup();
  }
});
