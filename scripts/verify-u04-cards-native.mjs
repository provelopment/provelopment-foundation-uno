/**
 * Foundation Uno — the focused native Cards production proof (`UNO-WO-122 / R05`).
 *
 * WHAT THIS IS. One runnable entrypoint that installs a **test-owned** published route through the proven fixture transaction,
 * builds the real production Next.js app, serves it on loopback, and executes the **same** transaction the U04 gate executes
 * (`runNativeCardsTransaction`): production HTTP, the closed reader probes, and real Chromium at 390, 768 and 1280, with the
 * fixture bytes restored in `finally` and a fresh original response proven by its own content.
 *
 * WHAT THIS IS NOT. It is not the U04 gate and never claims U04 success: it proves one module's capability, prints its own focused
 * verdict, and leaves every credit (`PARITY_CARDS=PENDING`, `U04_PARITY=13/17`, `U04_PROXY=55/59`) untouched.
 *
 * THE ROUTE IS TEST-OWNED. `wo122-native-cards` is declared by the transaction for the length of this run only, then removed with
 * its source; the committed `components` Page and every durable declaration are untouched. The route is installed **before** the
 * build because a declaration has to exist when the app is built, while the *document* it serves is swapped after the server is
 * running — the same sequence the gate already relies on for Gallery, Media and Columns evidence.
 *
 * STALENESS. The build directory is removed before building, and the server only starts after that build succeeds.
 */
import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";

// The production reader is TypeScript. The focused entrypoint resolves its extensionless relative imports exactly as the U04
// gate does, so both entrypoints load the same source rather than a copy of it.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/iu.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        return nextResolve(specifier, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

import {
  NATIVE_CARDS_BEFORE_DOCUMENT,
  NATIVE_CARDS_BEFORE_MARKER,
  NATIVE_CARDS_IDS,
  runNativeCardsTransaction,
} from "./u04/cards-native-evidence.mjs";
import { freeLoopbackPort, killChild, nextBinPath, runChild, waitForServer } from "./u04/serving-harness.mjs";
import { prepareUnoU03FixtureTransaction } from "./uno-u03-fixture-transaction.mjs";

const ROOT = process.cwd();
const HOST = "127.0.0.1";
const BUILD_TIMEOUT_MS = 15 * 60 * 1000;
const MANIFEST = "deployment/efs/manifest.json";
const ROUTE = "wo122-native-cards";
const SOURCE = `deployment/efs/content/${ROUTE}.en-001.json`;

let failures = 0;
function check(label, ok, detail = "") {
  const passed = ok === true;
  if (!passed) failures += 1;
  process.stdout.write(`${passed ? "PASS" : "FAIL"}  ${label}${detail === "" ? "" : `  [${detail}]`}\n`);
  return passed;
}

function digestOf() {
  return createHash("sha256").update(readFileSync(resolve(ROOT, SOURCE))).digest("hex");
}

/** The committed manifest plus exactly one test-owned published Page, and nothing else changed. */
function fixtureManifestBytes() {
  const manifest = JSON.parse(readFileSync(resolve(ROOT, MANIFEST), "utf8"));
  const site = manifest.entities?.[0]?.facets?.[0]?.sites?.[0];
  if (site === undefined) throw new Error("manifest shape: no entity/facet/site");
  const pages = site.pages ?? [];
  if (pages.some((page) => page.id === ROUTE)) throw new Error("manifest already declares the test route");
  site.pages = [
    ...pages,
    {
      id: ROUTE,
      route: [ROUTE],
      publication: "published",
      representations: [{ locale: "en-001", sources: [{ kind: "json", path: SOURCE }] }],
    },
  ];
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function sourceExists() {
  try {
    readFileSync(resolve(ROOT, SOURCE));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  process.stdout.write("Foundation Uno — FOCUSED native Cards production proof (not the U04 gate)\n");
  const nextBin = nextBinPath(ROOT);
  const manifestPath = resolve(ROOT, MANIFEST);
  const committedManifest = readFileSync(manifestPath);
  const transaction = await prepareUnoU03FixtureTransaction({
    root: ROOT,
    declarations: [{ path: MANIFEST, digest: createHash("sha256").update(committedManifest).digest("hex") }],
    replacements: [{ path: MANIFEST, bytes: fixtureManifestBytes() }],
    fixtureSources: [
      { path: SOURCE, bytes: Buffer.from(`${JSON.stringify(NATIVE_CARDS_BEFORE_DOCUMENT, null, 2)}\n`, "utf8") },
    ],
    scratchRoot: resolve(ROOT, ".temp"),
  });
  if (transaction.status !== "armed") {
    check("the fixture transaction arms", false, transaction.reasons.join(","));
    return;
  }
  const installed = await transaction.install();
  if (!check("the test-owned route installs without a write failure", installed.ok === true, installed.cause ?? "")) return;

  let child = null;
  try {
    rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
    const build = await runChild({ root: ROOT, args: [nextBin, "build"], timeoutMs: BUILD_TIMEOUT_MS });
    if (!check("the production build succeeds, so no stale build can answer", build.code === 0, `exit ${build.code}`)) {
      process.stderr.write(build.output.slice(-3000));
      return;
    }

    const port = await freeLoopbackPort(HOST);
    const base = `http://${HOST}:${port}`;
    const { spawn } = await import("node:child_process");
    child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
      windowsHide: true,
    });
    child.stdout.on("data", () => {});
    child.stderr.on("data", () => {});
    // The readiness probe stays off the route under test; the installed "before" document is then fetched exactly once, so the
    // served content can be attributed to the document that was installed rather than to any status code.
    if (!check("the production server answers on loopback", await waitForServer({ base, child, readyPath: "/" }))) return;

    const before = await fetch(`${base}/en-001/${ROUTE}`, { redirect: "manual" });
    const beforeHtml = before.status === 200 ? await before.text() : "";
    check(
      "the test-owned route serves the installed before document, and no native anchor",
      before.status === 200
        && beforeHtml.includes(NATIVE_CARDS_BEFORE_MARKER)
        && !beforeHtml.includes(`id="${NATIVE_CARDS_IDS[0]}"`),
      `${before.status} marker=${beforeHtml.includes(NATIVE_CARDS_BEFORE_MARKER)} ${beforeHtml.length}`,
    );

    const digestBefore = digestOf();
    const outcome = await runNativeCardsTransaction({
      familyUrl: `${base}/en-001/${ROUTE}`,
      fixturePath: resolve(ROOT, SOURCE),
      digestOf,
      check,
      prefix: "FOCUSED_CARDS",
    });
    check("the fixture is byte-identical after the transaction", digestOf() === digestBefore);
    check(
      "every focused native Cards check passed",
      outcome.failed === 0 && outcome.passed > 0,
      `${outcome.passed} passed, ${outcome.failed} failed, ${NATIVE_CARDS_IDS.length} sections`,
    );
  } finally {
    if (child !== null) killChild(child);
    // The transaction's contract: a verified `restore()` first, then `dispose()` may remove its scratch. Doing them in that
    // order is what keeps the committed manifest and the test-owned source from ever outliving the run.
    const restored = await transaction.restore();
    const disposed = await transaction.dispose();
    check(
      "the test-owned declaration is restored and its source removed",
      restored.ok === true && disposed.ok === true,
      [...(restored.reasons ?? []), ...(disposed.reasons ?? [])].join(","),
    );
    check("the committed manifest is byte-identical again", readFileSync(manifestPath).equals(committedManifest));
    check("the test-owned source no longer exists", sourceExists() === false);
  }
}

main()
  .catch((error) => {
    failures += 1;
    process.stderr.write(`${String(error?.stack ?? error)}\n`);
  })
  .finally(() => {
    process.stdout.write(`FOCUSED native Cards proof: ${failures === 0 ? "PASS" : "FAIL"} (${failures} failed)\n`);
    process.stdout.write("Focused proof only — PARITY_CARDS=PENDING, U04_PARITY=13/17, U04_PROXY=55/59 remain unchanged.\n");
    process.exitCode = failures === 0 ? 0 : 1;
  });

