/**
 * Foundation Uno — the function-input contract gate (`U07`).
 *
 * WHY. A hosting platform packages each server route separately, and it decides what a function carries from the build file trace. That
 * trace follows *literal* path components, and an exact-file `outputFileTracingIncludes` entry is not honoured for every bundle. A
 * declaration or an authored source read through a computed path therefore exists in the development checkout and is **absent** from an
 * independently packaged function — which is exactly how a published Page refused its own address on the platform while the same
 * decision succeeded in a route handler, and how `next start` inside the complete checkout proved nothing about the deployment.
 *
 * WHAT IT DOES. It reads the build own emitted file-trace manifests (`nft.json` under `.next/server`) — the artifact contract a platform
 * consumes — and requires that every bundle which reads a validated EFS input physically carries that input. Nothing is started and no
 * checkout path is trusted.
 *
 * WHAT IT DOES NOT DO. It does not decide publication, widen tracing, add an input to a bundle or read authored content. A missing input
 * is reported as a failure of the build, before any deployment resource is spent.
 *
 * SENSITIVITY. `--self-test` runs the same checker over synthetic bundles that each omit one required input and fails unless every
 * omission is caught. A gate that cannot fail is not a gate.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No dependency beyond Node own modules.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

/** The declarations a committed installation ships, as the trace expresses them (always `/`-separated). */
const DECLARATIONS = Object.freeze([
  "deployment/efs/manifest.json",
  "deployment/uno.config.json",
  "deployment/site.config.json",
]);

/** One authored source the starter installation publishes; the Page bundle must be able to read it. */
const AUTHORED_SOURCE = "deployment/efs/content/home.en-001.json";

/** The owned-media zone the starter Components Page declares; the Page and media bundles must carry it. */
const OWNED_MEDIA = "deployment/efs/capsule/";

/**
 * The contract: each consuming bundle and the inputs it must physically carry.
 *
 * Stated explicitly rather than derived. A bundle that starts reading a new input gains a line here, or the gate stays silent about it —
 * the honest limit of a contract written by hand.
 */
const CONSUMERS = Object.freeze([
  {
    bundle: "app/(site)/[...segments]/page.js.nft.json",
    label: "the published Page document",
    requires: [...DECLARATIONS, AUTHORED_SOURCE, OWNED_MEDIA],
  },
  { bundle: "middleware.js.nft.json", label: "the refusal responder", requires: [...DECLARATIONS] },
  { bundle: "app/api/uno-health/route.js.nft.json", label: "the operational health route", requires: [...DECLARATIONS] },
  { bundle: "app/robots.txt/route.js.nft.json", label: "the robots endpoint", requires: [...DECLARATIONS] },
  { bundle: "app/sitemap.xml/route.js.nft.json", label: "the sitemap endpoint", requires: [...DECLARATIONS] },
  {
    bundle: "app/uno-media/[...segments]/route.js.nft.json",
    label: "the owned-media route",
    requires: [...DECLARATIONS, OWNED_MEDIA],
  },
]);

/** Every traced path of one bundle in `/`-separated form, or `null` when the bundle emitted no trace. */
function tracedFiles(serverRoot, bundle) {
  const path = join(serverRoot, ...bundle.split("/"));
  if (!existsSync(path)) return null;
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  return files.map((entry) => String(entry).replaceAll("\\", "/"));
}

/** The inputs of one bundle that its trace does not carry. */
function missingInputs(traced, requires) {
  return requires.filter((needle) => !traced.some((file) => file.includes(needle)));
}

/** Check one bundle against its contract. */
function checkBundle(serverRoot, consumer) {
  const traced = tracedFiles(serverRoot, consumer.bundle);
  if (traced === null) {
    return { ok: false, message: `${consumer.label}: no file trace was emitted for ${consumer.bundle}` };
  }
  const missing = missingInputs(traced, consumer.requires);
  if (missing.length > 0) {
    return { ok: false, message: `${consumer.label} cannot read ${missing.join(", ")} — the packaged function does not carry it` };
  }
  return { ok: true, message: `${consumer.label}: carries all ${consumer.requires.length} inputs it reads` };
}

/** The self-test: a complete synthetic bundle must pass, and every individual omission must be caught. */
function selfTest() {
  const failures = [];
  const syntheticRoot = join(ROOT, ".temp", "uno-function-input-self-test");
  const consumer = {
    bundle: "synthetic.js.nft.json",
    label: "the synthetic bundle",
    requires: [...DECLARATIONS, AUTHORED_SOURCE, OWNED_MEDIA],
  };
  const complete = consumer.requires.map((entry) => `../${entry}`);
  mkdirSync(syntheticRoot, { recursive: true });

  writeFileSync(join(syntheticRoot, consumer.bundle), JSON.stringify({ files: complete }));
  if (!checkBundle(syntheticRoot, consumer).ok) failures.push("a complete synthetic bundle was rejected");

  for (const omitted of consumer.requires) {
    const files = complete.filter((entry) => !entry.includes(omitted));
    writeFileSync(join(syntheticRoot, consumer.bundle), JSON.stringify({ files }));
    if (checkBundle(syntheticRoot, consumer).ok) failures.push(`an omitted ${omitted} was not caught`);
  }

  if (checkBundle(syntheticRoot, { ...consumer, bundle: "absent.js.nft.json" }).ok) failures.push("a missing bundle was not caught");
  return failures;
}

if (process.argv.includes("--self-test")) {
  const failures = selfTest();
  for (const failure of failures) console.error(`FAIL self-test: ${failure}`);
  console.log(`verify-u07-function-inputs: self-test ${failures.length === 0 ? "passed" : "FAILED"}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

const serverRoot = join(ROOT, ".next", "server");
if (!existsSync(serverRoot)) {
  console.error("verify-u07-function-inputs: no build found — run the build first");
  process.exit(1);
}

let failed = 0;
for (const consumer of CONSUMERS) {
  const verdict = checkBundle(serverRoot, consumer);
  if (verdict.ok) console.log(`PASS ${verdict.message}`);
  else {
    failed += 1;
    console.error(`FAIL ${verdict.message}`);
  }
}
console.log(`verify-u07-function-inputs: ${CONSUMERS.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
