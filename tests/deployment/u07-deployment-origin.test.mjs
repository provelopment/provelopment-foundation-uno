/**
 * Foundation Uno — the deployment-origin wiring guard (`U07`).
 *
 * A deployment states the origin it is served on. That statement is only trustworthy while every clause around it holds: the
 * engine consults it through the one serving authority, never through a request header, never from a client bundle, and the
 * hosting repository's own origin never leaks into the engine or into the distributable. This guard requires each clause and
 * reads the real files, so a silent regression fails here rather than on the live domain.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(join(ROOT, path), "utf8");

/** Every source file under one directory, so a guard cannot be satisfied by inspecting a single file. */
const sources = (directory) => {
  const found = [];
  for (const entry of readdirSync(join(ROOT, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...sources(path));
    else if (/\.(ts|tsx|mjs|js)$/u.test(entry.name)) found.push(path);
  }
  return found;
};

describe("the deployment-specific origin is deliberate, server-only and absent from the engine", () => {
  it("is resolved by one module that the single serving authority consults", () => {
    const serving = read("src/config/uno-serving.ts");
    assert.ok(serving.includes('from "./uno-deploy-origin"'), "the serving authority imports the resolver");
    assert.ok(serving.includes("resolveUnoDeployOrigin({"), "the serving authority calls the resolver");
    assert.ok(serving.includes("serving:deploy-origin-invalid"), "an invalid statement has its own refusal reason");
    assert.ok(serving.includes("committedCanonical: committed.base.canonical"), "the committed declaration is passed in");
  });

  it("is never read from a request, a forwarded header or a client bundle", () => {
    for (const path of ["src/config/uno-deploy-origin.ts", "src/config/uno-serving.ts"]) {
      // Comments explain what the module never does, so they are stripped before the code itself is judged.
      const text = read(path).replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");
      assert.ok(!/x-forwarded-host/iu.test(text), `${path} must not read a forwarded host`);
      assert.ok(!text.includes("next/headers"), `${path} must not import the request headers`);
      assert.ok(!/cookies\(\)/u.test(text), `${path} must not read a cookie`);
    }
    assert.ok(!read("src/config/uno-deploy-origin.ts").includes("NEXT_PUBLIC_"), "the origin is server-only");
  });

  it("keeps the engine neutral: the hosting repository's domain appears in no tracked source file", () => {
    for (const path of [...sources("src"), ...sources("scripts")]) {
      assert.ok(!read(path).includes("provelopment.com"), `${path} must not name the hosting domain`);
    }
  });

  it("keeps the distributable neutral: the shipped declaration still states the reserved example origin", () => {
    const declaration = JSON.parse(read("deployment/uno.config.json"));
    assert.equal(declaration.base.canonical, "https://uno-starter.example");
  });

  it("keeps the hosting profile out of the distributable by declaration, not by luck", () => {
    assert.ok(read("scripts/package-release.mjs").includes("deployment/uno.deploy.json"), "packaging excludes the profile");
    assert.ok(statSync(join(ROOT, "deployment/uno.deploy.json")).isFile(), "the hosting profile exists in this repository");
    const profile = JSON.parse(read("deployment/uno.deploy.json"));
    assert.deepEqual(Object.keys(profile).sort(), ["canonical", "version"]);
    assert.equal(profile.version, 1);
    assert.match(profile.canonical, /^https:\/\/[a-z0-9.-]+$/u);
  });

  it("documents the operator override next to the canonical origin it replaces", () => {
    const guide = read("OPERATIONS.md");
    assert.ok(guide.includes("UNO_CANONICAL_ORIGIN"), "the operator variable is documented");
    assert.ok(guide.includes("VERCEL_PROJECT_PRODUCTION_URL"), "the platform statement is documented");
    assert.ok(guide.includes("uno.deploy.json"), "the hosting profile is documented");
  });
});
