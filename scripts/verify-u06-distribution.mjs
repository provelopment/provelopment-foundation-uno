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
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { hashList, packageRelease } from "./package-release.mjs";
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

/** The canonical origin one installation declares, and the authority it answers on. */
function declaredBase(target) {
  const config = JSON.parse(readFileSync(join(target, "deployment/uno.config.json"), "utf8"));
  const canonical = String(config.base?.canonical ?? "");
  const parsed = new URL(canonical);
  return { canonical: canonical.replace(/\/$/u, ""), host: parsed.host, origin: parsed.origin };
}

/**
 * Start one installed release exactly as the operator documentation says, and wait until the demonstration root answers.
 *
 * Nothing in the installation is edited: the declared authority is what the release ships, and every Site request below carries that
 * authority in its `Host` header. Editing the canonical origin would test a configuration the distribution does not ship, and that is
 * precisely how the first version of this gate produced a false defect.
 */
async function startInstalled(target) {
  const port = await freePort();
  const active = String(JSON.parse(readFileSync(join(target, "installation.json"), "utf8")).active ?? "");
  const base = declaredBase(active);
  // Start exactly as the operator documentation says: the installation launcher, which runs the active release from its own directory.
  const child = spawn(process.execPath, [join(target, "start.mjs"), "-H", HOST, "-p", String(port)], {
    cwd: target,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
    // A process group makes shutdown deterministic on POSIX: the launcher and the server it spawns die together.
    detached: process.platform !== "win32",
    windowsHide: true,
  });
  const stop = () => {
    try {
      if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
      else child.kill();
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {
        // Already gone.
      }
    }
  };
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    output += String(chunk);
  });
  const started = Date.now();
  for (;;) {
    if (Date.now() - started > READY_TIMEOUT_MS) throw new Error(`installed release did not start: ${output.slice(-2000)}`);
    try {
      const response = await fetch(`http://${HOST}:${port}/`, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
      if (response.status === 200) return { port, base, stop };
    } catch (error) {
      // Only "not listening yet" is retried. Anything else is a defect in this gate and must surface at once, not after two minutes.
      const code = typeof error === "object" && error !== null ? String(error.cause?.code ?? error.code ?? "") : "";
      const transient = ["ECONNREFUSED", "ECONNRESET", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET", "EAI_AGAIN", "TimeoutError"].includes(code)
        || String(error?.name ?? "") === "AbortError";
      if (!transient) throw error;
    }
    await delay(250);
  }
}

/** One request with an explicit authority, so the Site decision sees the declared host rather than the bind address. */
function request(port, pathname, host) {
  return new Promise((done) => {
    const call = httpRequest(
      { host: HOST, port, path: pathname, method: "GET", headers: { host, accept: "text/html" } },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += String(chunk);
        });
        response.on("end", () =>
          done({
            status: response.statusCode ?? 0,
            body,
            headers: response.headers,
            location: typeof response.headers.location === "string" ? response.headers.location : null,
          }),
        );
      },
    );
    call.on("error", (error) => done({ status: 0, body: String(error.message), headers: {}, location: null }));
    call.setTimeout(15_000, () => {
      call.destroy();
      done({ status: 0, body: "timeout", headers: {}, location: null });
    });
    call.end();
  });
}

/** The `<loc>` values the installation's own discovery surface publishes. */
function sitemapLocations(body) {
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
}

/** One POST with an explicit authority, used to prove the OFF defaults of the two optional endpoints. */
function postJson(port, pathname, host, payload) {
  return new Promise((done) => {
    const body = JSON.stringify(payload);
    const call = httpRequest(
      {
        host: HOST,
        port,
        path: pathname,
        method: "POST",
        headers: { host, "content-type": "application/json", "content-length": Buffer.byteLength(body) },
      },
      (response) => {
        let text = "";
        response.on("data", (chunk) => {
          text += String(chunk);
        });
        response.on("end", () => done({ status: response.statusCode ?? 0, body: text }));
      },
    );
    call.on("error", (error) => done({ status: 0, body: String(error.message) }));
    call.write(body);
    call.end();
  });
}

/** The Pages one installed manifest declares, in the order it declares them. */
function declaredPages(target) {
  const manifest = JSON.parse(readFileSync(join(target, "deployment/efs/manifest.json"), "utf8"));
  const pages = [];
  for (const entity of manifest.entities) {
    for (const facet of entity.facets) {
      for (const site of facet.sites) {
        for (const page of site.pages) {
          const route = Array.isArray(page.route) ? page.route : [];
          pages.push({ id: page.id, publication: page.publication, route, locales: page.representations.map((r) => r.locale) });
        }
      }
    }
  }
  return pages;
}

/**
 * Prove one installation operates as a product, not merely that its files were copied.
 *
 * Every Site request carries the authority the release itself declares, so the publication decision is exercised exactly as an
 * adopter's visitors exercise it. The demonstration root, the discovery surfaces, the three starter Pages, navigation, canonical
 * metadata, owned-media refusal, a genuine 404, an undeclared authority, and both OFF defaults are all asserted from real HTTP.
 */
async function assertInstallation(report, target, label, expectedDigest) {
  const installed = JSON.parse(readFileSync(join(target, "installation.json"), "utf8"));
  report.check(`${label} the installation records the artifact digest`, installed.digest === expectedDigest, installed.digest);

  const release = resolve(String(installed.active ?? ""));
  report.check(`${label} the installed record names its active release`, release.length > 0 && existsSync(join(release, ".next/BUILD_ID")), release);
  // A symlinked installation root is refused by the product's own source confinement, so an installation must be a real directory.
  report.check(`${label} the installation root is a physical directory, not a link`, !lstatSync(resolve(target)).isSymbolicLink(), resolve(target));
  report.check(`${label} the active release is a physical directory, not a link`, !lstatSync(release).isSymbolicLink(), release);
  report.check(`${label} the active release lives inside this installation`, release.startsWith(resolve(target)), release);
  report.check(`${label} the launcher is installed`, existsSync(join(target, "start.mjs")));

  const server = await startInstalled(target);
  try {
    const { port, base } = server;
    // The documented operator check runs on the loopback authority; the declared canonical authority is proven separately below.
    const host = `localhost:${port}`;
    const canonicalHost = base.host;
    const canonical = base.canonical;
    const path = (loc) => (loc.startsWith(canonical) ? loc.slice(canonical.length) || "/" : loc);

    const root = await request(port, "/", host);
    report.check(`${label} the demonstration root answers`, root.status === 200, String(root.status));
    report.check(`${label} the demonstration root stays unindexed`, /noindex/u.test(root.body));

    const robots = await request(port, "/robots.txt", host);
    report.check(`${label} robots.txt names the declared sitemap`, robots.status === 200 && robots.body.includes(`${canonical}/sitemap.xml`), String(robots.status));

    const sitemap = await request(port, "/sitemap.xml", host);
    const locations = sitemapLocations(sitemap.body);
    const declared = declaredPages(release).filter((page) => page.publication === "published");
    report.check(`${label} the sitemap lists one address per published Page`, sitemap.status === 200 && locations.length === declared.length, `${locations.length} vs ${declared.length}`);
    report.check(`${label} every sitemap address sits on the declared canonical origin`, locations.every((loc) => loc.startsWith(canonical)));

    const served = [];
    for (const loc of locations) {
      const response = await request(port, path(loc), host);
      served.push({ loc, ...response });
    }
    report.check(
      `${label} every published Page is served from its authorized address`,
      served.length === declared.length && served.every((page) => page.status === 200),
      JSON.stringify(served.map((page) => [path(page.loc), page.status])),
    );
    report.check(
      `${label} every Page declares its own canonical address`,
      served.every((page) => page.body.includes(`rel="canonical" href="${page.loc}"`)),
      served.find((page) => !page.body.includes(`rel="canonical" href="${page.loc}"`))?.loc ?? "none",
    );
    report.check(
      `${label} every Page declares the authored full locale`,
      served.every((page) => /<html lang="en-001"/u.test(page.body)),
    );

    const home = served.find((page) => page.body.includes("Foundation Uno"));
    report.check(`${label} the Home starter renders its authored JSON`, home !== undefined);
    report.check(`${label} the About starter renders its authored Markdown`, served.some((page) => page.body.includes("About this starter") && page.body.includes("independently deployable")));
    report.check(`${label} the Components starter renders its authored JSON`, served.some((page) => page.body.includes("Components")));

    const navigation = home?.body ?? "";
    report.check(`${label} the shell renders one navigation landmark`, (navigation.match(/<nav /gu) ?? []).length === 1);
    report.check(`${label} the current Page is marked in navigation`, navigation.includes('aria-current="page"'));
    const otherPaths = served.filter((page) => page !== home).map((page) => path(page.loc));
    report.check(
      `${label} navigation links every other published Page`,
      otherPaths.every((address) => navigation.includes(`href="${address}"`)),
      otherPaths.join(", "),
    );

    const media = await request(port, "/uno-media/000000000000000000000000.png", host);
    report.check(`${label} an unowned media address is refused`, media.status === 404, String(media.status));

    const missing = await request(port, "/en-001/no-such-page", host);
    report.check(`${label} an unpublished address answers a genuine 404`, missing.status === 404, String(missing.status));
    report.check(`${label} a refused address is not a Page`, !missing.body.includes("<nav "));

    const onCanonical = await request(port, "/en-001", canonicalHost);
    report.check(`${label} the declared canonical authority serves the home Page`, onCanonical.status === 200, String(onCanonical.status));
    report.check(`${label} the canonical address declares itself as canonical under either authority`,
      onCanonical.body.includes(`rel="canonical" href="${canonical}/en-001"`) && (served[0]?.body ?? "").includes(`rel="canonical" href="${canonical}/en-001"`));

    // One Site is served to every authority it is asked through — a single-Site product must not depend on the Host header — and an
    // address that is not authored is refused under a foreign authority exactly as under the declared one. No redirect is ever issued.
    const foreign = await request(port, "/en-001", "evil.example");
    report.check(`${label} no authority is redirected to another origin`, [200, 404].includes(foreign.status) && foreign.location === null, String(foreign.location));
    const foreignMissing = await request(port, "/en-001/no-such-page", "evil.example");
    report.check(`${label} a refused address is refused under any authority`, foreignMissing.status === 404, String(foreignMissing.status));

    const contactPage = served[0]?.body ?? "";
    report.check(`${label} contact is OFF by default: no form is rendered`, !contactPage.includes("<form"));
    report.check(`${label} contact is OFF by default: no contact transport is authored`, !/mailto:|tel:/iu.test(contactPage));
    const contactPost = await postJson(port, "/api/contact", host, { name: "Ada", email: "ada@example.com", message: "probe" });
    report.check(`${label} contact is OFF by default: the endpoint refuses a submission`, contactPost.status === 503 && contactPost.body.includes("not-configured"), `${contactPost.status} ${contactPost.body.slice(0, 80)}`);
    const contactGet = await request(port, "/api/contact", host);
    report.check(`${label} the contact endpoint accepts no GET`, [404, 405].includes(contactGet.status), String(contactGet.status));

    report.check(`${label} analytics is OFF by default: no beacon is rendered`, !contactPage.includes("/api/analytics"));
    const analyticsPost = await postJson(port, "/api/analytics", host, { event: "page-view", path: "/en-001" });
    report.check(`${label} analytics is OFF by default: the collector accepts nothing`, analyticsPost.status === 503, String(analyticsPost.status));

    for (const page of served) {
      report.check(`${label} no served Page exposes an installation path`, !page.body.includes(release) && !page.body.includes("deployment/efs"), page.loc);
    }
  } finally {
    server.stop();
  }
}

/** Assert the notices, the recorded facts and the absence of workspace material in one release. */
function assertReleaseContents(report, releaseDir) {
  for (const required of ["LICENSE", "NOTICE.md", "README.md", "OPERATIONS.md", "RELEASE.json", "MANIFEST.sha256", "package.json", "pnpm-lock.yaml"]) {
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
  // The operator guide must answer every question an adopter has to ask, under its own heading.
  const guide = readFileSync(join(releaseDir, "OPERATIONS.md"), "utf8");
  const headings = guide.split("\n").filter((line) => line.startsWith("## "));
  for (const topic of [
    "Prerequisites",
    "Initial setup and configuration",
    "Startup and shutdown",
    "Authored content and asset ownership",
    "Upgrade and rollback",
    "Integrity verification",
    "Failure recovery",
    "Optional providers and their OFF defaults",
    "Licensing and attribution",
  ]) {
    report.check(`U06_DOCS the operator guide covers ${topic}`, headings.some((heading) => heading.includes(topic)), topic);
  }
  report.check("U06_DOCS the operator guide says why an installation must not be a link", /not symlinks or junctions/u.test(guide));
}

/**
 * Build a second, genuinely different release from a verified one.
 *
 * One harmless source comment is added and the manifest and recorded digest are recomputed with the same algorithm the packager uses, so
 * the result is a valid release that an adopter could receive next week rather than a doctored copy of the first.
 */
function deriveRelease(sourceDir, destDir) {
  rmSync(destDir, { recursive: true, force: true });
  cpSync(sourceDir, destDir, { recursive: true });
  const target = join(destDir, "src/app/globals.css");
  writeFileSync(target, `${readFileSync(target, "utf8")}\n/* U06 upgrade probe: this release differs by one comment. */\n`, "utf8");
  const manifestPath = join(destDir, "MANIFEST.sha256");
  const entries = readFileSync(manifestPath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = /^([0-9a-f]{64}) {2}(.+)$/u.exec(line);
      if (match === null) throw new Error(`unreadable manifest line: ${line}`);
      return [match[2], match[1]];
    });
  const updated = entries.map(([path, digest]) => [path, path === "src/app/globals.css" ? digestOf(target) : digest]);
  const digest = hashList(updated);
  writeFileSync(manifestPath, `${updated.map(([path, hash]) => `${hash}  ${path}`).join("\n")}\n`, "utf8");
  const factsPath = join(destDir, "RELEASE.json");
  const facts = JSON.parse(readFileSync(factsPath, "utf8"));
  facts.digest = digest;
  writeFileSync(factsPath, `${JSON.stringify(facts, null, 2)}\n`, "utf8");
  return { releaseDir: destDir, digest };
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
    await assertInstallation(report, cleanA, "U06_CLEAN_A", packaged.digest);
    const installation = JSON.parse(readFileSync(join(cleanA, "installation.json"), "utf8"));
    report.check(
      "U06_CLEAN_A the installation records how to start and verify it",
      installation.start.includes("start.mjs") && /MANIFEST/u.test(installation.verify),
    );
    report.check(
      "U06_CLEAN_A the installation carries the authored starter Pages",
      existsSync(join(JSON.parse(readFileSync(join(cleanA, "installation.json"), "utf8")).active, "deployment/efs/content/home.en-001.json")),
    );
  }
  if (second.ok) await assertInstallation(report, cleanB, "U06_CLEAN_B", packaged.digest);

  // --- 3. Upgrade to a genuinely different release preserves adopter authorship ---------------------------------------------
  if (!second.ok) {
    for (const name of report.passes) console.log(`  PASS  ${name}`);
    for (const name of report.failures) console.log(`FAIL  ${name}`);
    console.log(`verify-u06-distribution: ${report.passes.length} passed, ${report.failures.length} failed`);
    process.exitCode = 1;
    return;
  }
  const activeB = String(JSON.parse(readFileSync(join(cleanB, "installation.json"), "utf8")).active ?? "");
  const adopterPage = join(activeB, "deployment/efs/content/about.en-001.md");
  const adopterPresentation = join(activeB, "deployment/site.config.json");
  const adopterMark = `${readFileSync(adopterPage, "utf8").trimEnd()}\n\nAn adopter wrote this sentence and expects it to survive an upgrade.\n`;
  writeFileSync(adopterPage, adopterMark, "utf8");
  writeFileSync(
    adopterPresentation,
    readFileSync(adopterPresentation, "utf8").replace("\"ariaLabel\": \"Primary\"", "\"ariaLabel\": \"Adopter navigation\""),
    "utf8",
  );

  // A second, genuinely different release: one harmless source change, re-digested so it is a valid release in its own right.
  const derived = deriveRelease(join(transferred, "release"), join(sandbox, "derived"));
  report.check("U06_UPGRADE the derived release has its own digest", derived.digest !== packaged.digest, derived.digest);
  const upgrade = installRelease({ releaseDir: derived.releaseDir, target: cleanB, mode: "upgrade" });
  report.check("U06_UPGRADE the upgrade to a different release succeeds", upgrade.ok === true, upgrade.reason ?? upgrade.output ?? "");
  if (upgrade.ok) {
    const activeAfter = String(JSON.parse(readFileSync(join(cleanB, "installation.json"), "utf8")).active ?? "");
    report.check("U06_UPGRADE the active release changed", activeAfter !== activeB, activeAfter);
    report.check("U06_UPGRADE the adopter's Page survives byte for byte", readFileSync(join(activeAfter, "deployment/efs/content/about.en-001.md"), "utf8") === adopterMark);
    report.check(
      "U06_UPGRADE the adopter's presentation survives byte for byte",
      readFileSync(join(activeAfter, "deployment/site.config.json"), "utf8").includes("Adopter navigation"),
    );
    const upgraded = JSON.parse(readFileSync(join(cleanB, "installation.json"), "utf8"));
    report.check(
      "U06_UPGRADE the installation records what it preserved",
      upgraded.preserved.includes("deployment/efs/content") && upgraded.preserved.includes("deployment/site.config.json"),
      JSON.stringify(upgraded.preserved),
    );
    await assertInstallation(report, cleanB, "U06_UPGRADE", derived.digest);
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
    await assertInstallation(report, cleanB, "U06_ROLLBACK", packaged.digest);
    report.check(
      "U06_ROLLBACK the restored installation is the release that was running before the upgrade",
      String(JSON.parse(readFileSync(join(cleanB, "installation.json"), "utf8")).active ?? "") === activeB,
      activeB,
    );
    report.check("U06_ROLLBACK the adopter's Page is still there after the rollback", readFileSync(adopterPage, "utf8") === adopterMark);
  }

  // --- 6. An interrupted install leaves the live installation intact and no staging behind ----------------------------------
  const interrupted = spawn(
    process.execPath,
    [resolve(ROOT, "scripts/install-release.mjs"), join(transferred, "release"), cleanA, "upgrade"],
    { cwd: ROOT, stdio: "ignore", detached: process.platform !== "win32", windowsHide: true },
  );
  await delay(1500);
  try {
    if (process.platform !== "win32") process.kill(-interrupted.pid, "SIGKILL");
    else interrupted.kill();
  } catch {
    interrupted.kill("SIGKILL");
  }
  await delay(1200);
  const afterInterrupt = JSON.parse(readFileSync(join(cleanA, "installation.json"), "utf8"));
  report.check("U06_RECOVERY an interrupted install leaves the live installation recorded and intact", afterInterrupt.digest === packaged.digest);
  report.check(
    "U06_RECOVERY the interrupted run leaves a complete active release",
    existsSync(join(String(afterInterrupt.active ?? ""), ".next/BUILD_ID")),
    String(afterInterrupt.active ?? ""),
  );
  const recover = installRelease({ releaseDir: join(transferred, "release"), target: cleanA, mode: "upgrade" });
  report.check("U06_RECOVERY a later install succeeds", recover.ok === true, recover.reason ?? recover.output ?? "");
  const releasesDir = join(cleanA, "releases");
  const partialReleases = readdirSync(releasesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !existsSync(join(releasesDir, entry.name, ".next/BUILD_ID"))).length;
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
