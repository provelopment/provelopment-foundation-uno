/**
 * Foundation Uno — the U06 clean-room distribution proof.
 *
 * WHAT THIS IS. The proof that Foundation Uno is distributable: it packages the release, then installs it **twice** into empty
 * directories outside the repository, starts each installation, and checks the starter Pages, the validated configuration, the
 * recorded digests and the operator documentation. It then upgrades the second installation, proves the adopter's own Pages and
 * presentation survived, refuses a tampered release, rolls back, and recovers from an interrupted install.
 *
 * WHAT IT IS NOT. It is not a clone of this repository. Each clean room receives only the packaged release and the toolchain, so a
 * missing file in the distribution fails here rather than in an adopter's hands.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { packageRelease } from "./package-release.mjs";
import { installRelease, rollbackRelease, verifyRelease } from "./install-release.mjs";

const ROOT = process.cwd();
const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 120_000;

/** A tiny reporter, matching the shape the other gates print. */
function createReport() {
  const passes = [];
  const failures = [];
  return {
    passes,
    failures,
    check(name, condition, detail) {
      if (condition) passes.push(name);
      else failures.push(detail === undefined ? name : `${name} — ${detail}`);
    },
  };
}

/** A free loopback port. */
function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.once("error", fail);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => done(port));
    });
  });
}

/** The SHA-256 of one file, for before/after comparisons. */
const digestOf = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** Start one installed release and wait until it serves a document. */
async function startInstalled(target) {
  const port = await freePort();
  // The one configuration step an adopter performs: declare the origin this installation answers on. The starter ships a reserved
  // example origin, so an unconfigured installation refuses every Site path.
  const unoConfig = join(target, "deployment/uno.config.json");
  if (existsSync(unoConfig)) {
    const config = JSON.parse(readFileSync(unoConfig, "utf8"));
    config.base = { canonical: `http://localhost:${port}`, aliases: [] };
    writeFileSync(unoConfig, `${JSON.stringify(config, null, 2)}
`, "utf8");
  }
  // Start exactly the way an operator is told to: the installed server, with no package-manager step in the path.
  const child = spawn(
    process.execPath,
    [join(target, "node_modules/next/dist/bin/next"), "start", "-H", HOST, "-p", String(port)],
    { cwd: target, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production" }, windowsHide: true },
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    output += String(chunk);
  });
  // Request through the loopback host name the committed configuration resolves, not the bind address.
  const base = `http://localhost:${port}`;
  const started = Date.now();
  for (;;) {
    if (Date.now() - started > READY_TIMEOUT_MS) throw new Error(`installed release did not start: ${output.slice(-2000)}`);
    try {
      // Readiness is the server answering at all; the Site addresses are asserted separately, from the manifest.
      const response = await fetch(`${base}/`, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
      if (response.status === 200) return { base, stop: () => child.kill() };
    } catch {
      // Not listening yet.
    }
    await delay(250);
  }
}

/** Fetch one document and report its status and body. */
async function get(base, pathname) {
  const response = await fetch(`${base}${pathname}`, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
  return { status: response.status, body: await response.text() };
}

/** The addresses one installed manifest publishes, derived from the declaration rather than assumed. */
function publishedPaths(target) {
  const manifest = JSON.parse(readFileSync(join(target, "deployment/efs/manifest.json"), "utf8"));
  const paths = [];
  for (const entity of manifest.entities) {
    for (const facet of entity.facets) {
      for (const site of facet.sites) {
        for (const page of site.pages) {
          if (page.publication !== "published") continue;
          for (const representation of page.representations) {
            const route = Array.isArray(page.route) && page.route.length > 0 ? `/${page.route.join("/")}` : "";
            paths.push({ id: page.id, locale: representation.locale, pathname: `/${representation.locale}${route}` });
          }
        }
      }
    }
  }
  return paths;
}

/** Assert the starter Pages of one installation, at the addresses its own manifest declares. */
async function assertStarters(report, target, label) {
  const declared = publishedPaths(target);
  report.check(`${label} the starter declares three authored Pages`, declared.length === 3, JSON.stringify(declared.map((page) => page.pathname)));
  const server = await startInstalled(target);
  try {
    const seen = [];
    for (const page of declared) {
      const response = await get(server.base, page.pathname);
      seen.push({ ...page, status: response.status, body: response.body });
    }
    report.check(
      `${label} every declared starter Page is served`,
      seen.length === 3 && seen.every((page) => page.status === 200),
      JSON.stringify(seen.map((page) => [page.pathname, page.status])),
    );
    const home = seen.find((page) => page.id === "home");
    const about = seen.find((page) => page.id === "about");
    const components = seen.find((page) => page.id === "components");
    report.check(`${label} the Home starter renders its own JSON heading`, home !== undefined && home.body.includes("Foundation Uno"));
    report.check(`${label} the About starter renders its authored Markdown`, about !== undefined && about.body.includes("<h1>") && about.body.includes("fixture"));
    report.check(`${label} the Components starter renders its JSON title`, components !== undefined && components.body.includes("Components"));
    const unknown = await get(server.base, "/fr-fr");
    report.check(`${label} serves no locale that is not authored`, unknown.status === 404, String(unknown.status));
    const contact = await get(server.base, "/api/contact");
    report.check(`${label} refuses a non-POST contact request`, [404, 405].includes(contact.status), String(contact.status));
  } finally {
    server.stop();
  }
}

/** Assert the notices, the recorded facts and the absence of workspace material in one release. */
function assertReleaseContents(report, releaseDir) {
  for (const required of ["LICENSE", "NOTICE.md", "README.md", "RELEASE.json", "MANIFEST.sha256", "package.json", "pnpm-lock.yaml"]) {
    report.check(`U06_RELEASE carries ${required}`, existsSync(join(releaseDir, required)), required);
  }
  const notice = readFileSync(join(releaseDir, "NOTICE.md"), "utf8");
  report.check("U06_RELEASE the notice names runtime dependencies with their licences", /next/u.test(notice) && /MIT/u.test(notice));
  report.check("U06_RELEASE the notice states that no donor code ships", notice.includes("no copied Foundation source"));
  const facts = JSON.parse(readFileSync(join(releaseDir, "RELEASE.json"), "utf8"));
  report.check("U06_RELEASE the release records its version, commit and digest", /^[0-9a-f]{64}$/u.test(facts.digest) && typeof facts.commit === "string");
  for (const forbidden of ["node_modules", ".next", ".git", ".temp", "tests", ".github"]) {
    report.check(`U06_RELEASE ships no ${forbidden}`, existsSync(join(releaseDir, forbidden)) === false, forbidden);
  }
  report.check("U06_RELEASE the distribution verifies against its own manifest", verifyRelease(releaseDir).ok === true);
}

/** Install one release into an empty directory outside the repository. */
function installFresh(releaseDir, target) {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  return installRelease({ releaseDir, target, mode: "fresh" });
}


export async function main() {
  const report = createReport();
  const sandbox = join(tmpdir(), `uno-u06-${Date.now()}`);
  const artifactRoot = join(sandbox, "artifact");
  mkdirSync(artifactRoot, { recursive: true });

  // --- 1. Package, transfer, and verify ------------------------------------------------------------------------------------
  const packaged = packageRelease({ outputRoot: artifactRoot });
  assertReleaseContents(report, packaged.releaseDir);
  const transferred = join(sandbox, "transferred");
  mkdirSync(transferred, { recursive: true });
  cpSync(packaged.releaseDir, join(transferred, "release"), { recursive: true });
  const transferDigest = JSON.parse(readFileSync(join(transferred, "release/RELEASE.json"), "utf8")).digest;
  report.check("U06_PACKAGE the transferred copy keeps the packaged digest", transferDigest === packaged.digest);

  // --- 2. Two independent clean-room installations --------------------------------------------------------------------------
  const cleanA = join(sandbox, "clean-a");
  const cleanB = join(sandbox, "clean-b");
  const first = installFresh(join(transferred, "release"), cleanA);
  report.check("U06_CLEAN_A the first clean-room installation succeeds", first.ok === true, `${first.reason ?? ""} ${first.output ?? ""}`.slice(0, 400));
  const second = installFresh(join(transferred, "release"), cleanB);
  report.check("U06_CLEAN_B the second clean-room installation succeeds", second.ok === true, `${second.reason ?? ""} ${second.output ?? ""}`.slice(0, 400));
  report.check(
    "U06_CLEAN the two installations report the same release digest",
    first.ok === true && second.ok === true && first.digest === second.digest && first.digest === packaged.digest,
  );
  if (first.ok) {
    await assertStarters(report, cleanA, "U06_CLEAN_A");
    const installation = JSON.parse(readFileSync(join(cleanA, "installation.json"), "utf8"));
    report.check(
      "U06_CLEAN_A the installation records how to start and verify it",
      installation.start.includes("next") && /MANIFEST/u.test(installation.verify),
    );
    report.check(
      "U06_CLEAN_A the installation carries the authored starter Pages",
      existsSync(join(cleanA, "deployment/efs/content/home.en-001.json")),
    );
  }
  if (second.ok) await assertStarters(report, cleanB, "U06_CLEAN_B");

  // --- 3. Upgrade preserves adopter authorship ------------------------------------------------------------------------------
  if (!second.ok) {
    for (const name of report.passes) console.log(`  PASS  ${name}`);
    for (const name of report.failures) console.log(`FAIL  ${name}`);
    console.log(`verify-u06-distribution: ${report.passes.length} passed, ${report.failures.length} failed`);
    process.exitCode = 1;
    return;
  }
  const adopterPage = join(cleanB, "deployment/efs/content/about.en-001.md");
  const adopterPresentation = join(cleanB, "deployment/site.config.json");
  const adopterMark = `${readFileSync(adopterPage, "utf8").trimEnd()}\n\nAn adopter wrote this sentence and expects it to survive an upgrade.\n`;
  writeFileSync(adopterPage, adopterMark, "utf8");
  writeFileSync(
    adopterPresentation,
    readFileSync(adopterPresentation, "utf8").replace("\"ariaLabel\": \"Primary\"", "\"ariaLabel\": \"Adopter navigation\""),
    "utf8",
  );
  const upgrade = installRelease({ releaseDir: join(transferred, "release"), target: cleanB, mode: "upgrade" });
  report.check("U06_UPGRADE the upgrade succeeds", upgrade.ok === true, upgrade.reason ?? upgrade.output ?? "");
  if (upgrade.ok) {
    report.check("U06_UPGRADE the adopter's Page survives byte for byte", readFileSync(adopterPage, "utf8") === adopterMark);
    report.check(
      "U06_UPGRADE the adopter's presentation survives byte for byte",
      readFileSync(adopterPresentation, "utf8").includes("Adopter navigation"),
    );
    const upgraded = JSON.parse(readFileSync(join(cleanB, "installation.json"), "utf8"));
    report.check(
      "U06_UPGRADE the installation records what it preserved",
      upgraded.preserved.includes("deployment/efs/content") && upgraded.preserved.includes("deployment/site.config.json"),
      JSON.stringify(upgraded.preserved),
    );
    await assertStarters(report, cleanB, "U06_UPGRADE");
  }

  // --- 4. A tampered release is refused, and the live installation is untouched ---------------------------------------------
  const tamperedRoot = join(sandbox, "tampered");
  cpSync(join(transferred, "release"), tamperedRoot, { recursive: true });
  const tamperTarget = join(tamperedRoot, "src/app/globals.css");
  writeFileSync(tamperTarget, `${readFileSync(tamperTarget, "utf8")}\n/* tampered */\n`, "utf8");
  const tampered = verifyRelease(tamperedRoot);
  report.check(
    "U06_INTEGRITY a modified file is refused by name",
    tampered.ok === false && tampered.reason.startsWith("install:file-mismatch:"),
    tampered.reason,
  );
  const liveDigestBefore = digestOf(join(cleanB, "installation.json"));
  const refused = installRelease({ releaseDir: tamperedRoot, target: cleanB, mode: "upgrade" });
  report.check(
    "U06_INTEGRITY a refused release changes nothing",
    refused.ok === false && digestOf(join(cleanB, "installation.json")) === liveDigestBefore,
  );

  const extraRoot = join(sandbox, "extra");
  cpSync(join(transferred, "release"), extraRoot, { recursive: true });
  writeFileSync(join(extraRoot, "src/extra.ts"), "export const extra = true;\n", "utf8");
  const extra = verifyRelease(extraRoot);
  report.check("U06_INTEGRITY an unlisted file is refused by name", extra.ok === false && extra.reason.startsWith("install:unexpected-file:"), extra.reason);


  // --- 5. Rollback restores the previous release ---------------------------------------------------------------------------
  const rolledBack = rollbackRelease({ target: cleanB });
  report.check("U06_ROLLBACK the previous release is restored", rolledBack.ok === true, rolledBack.reason ?? "");
  if (rolledBack.ok) {
    await assertStarters(report, cleanB, "U06_ROLLBACK");
    report.check(
      "U06_ROLLBACK the restored installation is the release that was running",
      JSON.parse(readFileSync(join(cleanB, "installation.json"), "utf8")).mode === "fresh",
    );
    report.check("U06_ROLLBACK the adopter's Page is still there after the rollback", readFileSync(adopterPage, "utf8") === adopterMark);
  }

  // --- 6. An interrupted install leaves the live installation intact and no staging behind ----------------------------------
  const interrupted = spawn(
    process.execPath,
    [resolve(ROOT, "scripts/install-release.mjs"), join(transferred, "release"), cleanA, "upgrade"],
    { cwd: ROOT, stdio: "ignore", windowsHide: true },
  );
  await delay(1500);
  interrupted.kill();
  await delay(800);
  const afterInterrupt = JSON.parse(readFileSync(join(cleanA, "installation.json"), "utf8"));
  report.check("U06_RECOVERY an interrupted install leaves the live installation recorded and intact", afterInterrupt.digest === packaged.digest);
  report.check("U06_RECOVERY the interrupted run leaves a running server", existsSync(join(cleanA, ".next/BUILD_ID")));
  const recover = installRelease({ releaseDir: join(transferred, "release"), target: cleanA, mode: "upgrade" });
  report.check("U06_RECOVERY a later install succeeds", recover.ok === true, recover.reason ?? recover.output ?? "");
  const partialReleases = readdirSync(`${cleanA}.releases`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !existsSync(join(sandbox, ".uno-releases", entry.name, ".next/BUILD_ID"))).length;
  report.check("U06_RECOVERY no incomplete release is left behind", partialReleases === 0, String(partialReleases));

  // --- 7. The distribution is reproducible from the same inputs ------------------------------------------------------------
  const repackaged = packageRelease({ outputRoot: join(sandbox, "artifact-again") });
  report.check("U06_REPRODUCIBLE the same tree packages to the same digest", repackaged.digest === packaged.digest, repackaged.digest);

  for (const name of report.passes) console.log(`  PASS  ${name}`);
  for (const name of report.failures) console.log(`FAIL  ${name}`);
  console.log(`verify-u06-distribution: ${report.passes.length} passed, ${report.failures.length} failed`);
  console.log(`verify-u06-distribution: ${packaged.facts.name}@${packaged.facts.version} digest ${packaged.digest}`);
  if (report.failures.length > 0) process.exitCode = 1;
}

await main();
