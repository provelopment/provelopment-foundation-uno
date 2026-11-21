import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import { loadUnoCandidateSource } from "../../src/adapters/efs/uno-confined-source-reader";
import { resolveUnoPageHeader } from "../../src/application/resolve-uno-page-header";
import {
  UNO_DISCOVERY_INPUT_KEYS,
  UNO_DISCOVERY_REFUSAL_REASONS,
  classifyUnoPageDiscoverability,
  type UnoDiscoveryRefusal,
  type UnoDiscoveryResult,
} from "../../src/core/efs/uno-discovery-policy";

/**
 * U03 discoverability-intent policy tests (`UNO-WO-022 / R01`).
 *
 * These cases drive the **real** pure classifier, and the last block drives the real confined loader and
 * the real header use case before classifying. A `public` classification is an eligibility statement for a
 * later Owner-authorized pipeline only: nothing here publishes, routes or serves a Page.
 */

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCRATCH_ROOT = join(REPO_ROOT, ".temp");
const HOME_SOURCE = "deployment/efs/content/home.en-001.md";
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const FLAGS = [
  "navigation",
  "sitemap",
  "hreflang",
  "xDefault",
  "languageSwitch",
  "automaticLocaleRedirectTarget",
] as const;

const createdRoots: string[] = [];

function expectRefused(result: UnoDiscoveryResult, reason: UnoDiscoveryRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(UNO_DISCOVERY_REFUSAL_REASONS).toContain(result.reason);
}

function expectAllFlags(result: UnoDiscoveryResult, expected: boolean): void {
  expect(result.accepted).toBe(true);
  if (!result.accepted) return;
  expect(Object.keys(result.eligibleIfPublished).sort()).toEqual([...FLAGS].sort());
  for (const flag of FLAGS) {
    expect(result.eligibleIfPublished[flag]).toBe(expected);
  }
}

function scratchRoot(): string {
  mkdirSync(SCRATCH_ROOT, { recursive: true });
  const root = mkdtempSync(join(SCRATCH_ROOT, "wo022-discovery-"));
  createdRoots.push(root);
  return root;
}

function selection(): Record<string, unknown> {
  return { version: 1, entityId: ENTITY_ID, selectedSite: { facetId: "foundation", siteId: "main" } };
}

function makeRepo(manifest: unknown, files: Record<string, string>): string {
  const root = scratchRoot();
  mkdirSync(join(root, "deployment", "efs", "content"), { recursive: true });
  writeFileSync(join(root, "deployment", "efs", "manifest.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(join(root, "deployment", "uno.config.json"), JSON.stringify(selection(), null, 2));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "deployment", "efs", "content", name), body);
  }
  return root;
}

function manifestWith(pages: readonly unknown[]): unknown {
  return {
    entities: [{ id: ENTITY_ID, facets: [{ id: "foundation", sites: [{ id: "main", pages }] }] }],
  };
}

afterAll(() => {
  for (const root of createdRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("eligibility for a public Page", () => {
  it("marks every conditional surface eligible for public JSON", () => {
    const result = classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: "public" });
    expectAllFlags(result, true);
    if (!result.accepted) return;
    expect(result.visibility).toBe("public");
    expect(result.robotsIfDirectlyServed).toBeNull();
    expect(Object.keys(result).sort()).toEqual([
      "accepted",
      "eligibleIfPublished",
      "robotsIfDirectlyServed",
      "visibility",
    ]);
  });

  it("marks every conditional surface eligible for public Markdown", () => {
    const result = classifyUnoPageDiscoverability({ kind: "markdown", routePath: "home", visibility: "public" });
    expectAllFlags(result, true);
    if (!result.accepted) return;
    expect(result.visibility).toBe("public");
    expect(result.robotsIfDirectlyServed).toBeNull();
  });

  it("treats a non-Home authoring route the same way", () => {
    const result = classifyUnoPageDiscoverability({
      kind: "json",
      routePath: "offers/website-design",
      visibility: "public",
    });
    expectAllFlags(result, true);
  });
});

describe("eligibility for an unlisted Page", () => {
  it("withholds every surface and states noindex,nofollow for JSON unlisted", () => {
    const result = classifyUnoPageDiscoverability({
      kind: "json",
      routePath: "offers/website-design",
      visibility: "unlisted",
    });
    expectAllFlags(result, false);
    if (!result.accepted) return;
    expect(result.visibility).toBe("unlisted");
    expect(result.robotsIfDirectlyServed).toBe("noindex,nofollow");
  });

  it("refuses unlisted for the reserved Home using the existing exact policy literal", () => {
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: "unlisted" }),
      "home-cannot-be-unlisted",
    );
  });

  it("refuses Markdown claiming unlisted as a projection mismatch", () => {
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "markdown", routePath: "offers/website-design", visibility: "unlisted" }),
      "discovery:projection-mismatch",
    );
  });
});

describe("refusal vocabulary", () => {
  it("refuses an invalid authoring route through the existing policy literal", () => {
    for (const routePath of ["", "../escape", "/leading", "trailing/", "a//b", "a\\b", "with space"]) {
      expectRefused(
        classifyUnoPageDiscoverability({ kind: "json", routePath, visibility: "public" }),
        "invalid-route-path",
      );
    }
  });

  it("refuses an unknown visibility, kind, or non-string value", () => {
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: "secret" }),
      "unknown-visibility",
    );
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "yaml", routePath: "home", visibility: "public" }),
      "discovery:input-shape",
    );
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: 7 }),
      "discovery:input-shape",
    );
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "json", routePath: 7, visibility: "public" }),
      "invalid-route-path",
    );
  });

  it("refuses a missing or extra key instead of ignoring it", () => {
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "json", routePath: "home" }),
      "discovery:input-shape",
    );
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: "public", published: true }),
      "discovery:input-shape",
    );
    expectRefused(classifyUnoPageDiscoverability({}), "discovery:input-shape");
  });

  it("refuses non-objects without throwing", () => {
    for (const value of [null, undefined, [], ["json"], 0, "json", true]) {
      const result = classifyUnoPageDiscoverability(value);
      expect(result.accepted).toBe(false);
      if (result.accepted) return;
      expect(UNO_DISCOVERY_REFUSAL_REASONS).toContain(result.reason);
    }
  });

  it("refuses hostile records without invoking code", () => {
    let reads = 0;
    const accessor = {
      get kind(): string {
        reads += 1;
        return "json";
      },
      routePath: "home",
      visibility: "public",
    };
    expectRefused(classifyUnoPageDiscoverability(accessor), "discovery:input-not-plain");
    expect(reads).toBe(0);

    const withSymbol: Record<PropertyKey, unknown> = { kind: "json", routePath: "home", visibility: "public" };
    withSymbol[Symbol("extra")] = true;
    expectRefused(classifyUnoPageDiscoverability(withSymbol), "discovery:input-not-plain");

    class Exotic {
      kind = "json";
      routePath = "home";
      visibility = "public";
    }
    expectRefused(classifyUnoPageDiscoverability(new Exotic()), "discovery:input-not-plain");

    const hostile = new Proxy(
      { kind: "json", routePath: "home", visibility: "public" },
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    // A trap that throws makes the record unreadable rather than non-plain; both are closed literals.
    expectRefused(classifyUnoPageDiscoverability(hostile), "discovery:unreadable");
  });

  it("exposes one closed, duplicate-free refusal vocabulary", () => {
    expect(UNO_DISCOVERY_REFUSAL_REASONS.length).toBe(14);
    expect(new Set(UNO_DISCOVERY_REFUSAL_REASONS).size).toBe(UNO_DISCOVERY_REFUSAL_REASONS.length);
    for (const reason of ["discovery:input-shape", "discovery:projection-mismatch", "home-cannot-be-unlisted"]) {
      expect(UNO_DISCOVERY_REFUSAL_REASONS).toContain(reason as UnoDiscoveryRefusal);
    }
    expect([...UNO_DISCOVERY_INPUT_KEYS].sort()).toEqual(["kind", "routePath", "visibility"]);
  });
});


describe("result integrity", () => {
  it("returns a freshly allocated, deeply frozen result with no shared objects", () => {
    const first = classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: "public" });
    const second = classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: "public" });
    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;

    expect(first).not.toBe(second);
    expect(first.eligibleIfPublished).not.toBe(second.eligibleIfPublished);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.eligibleIfPublished)).toBe(true);
    expect(() => {
      (first.eligibleIfPublished as { navigation: boolean }).navigation = false;
    }).toThrow();
  });

  it("leaks no address, content, locale target or publication authority", () => {
    const result = classifyUnoPageDiscoverability({ kind: "json", routePath: "offers/website-design", visibility: "public" });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const serialised = JSON.stringify(result);
    for (const forbidden of [
      '"published"',
      '"url"',
      '"pathname"',
      '"canonical"',
      '"siteId"',
      '"offers/website-design"',
      '"en-001"',
      '"markdownBody"',
    ]) {
      expect(serialised.includes(forbidden)).toBe(false);
    }
  });

  it("does not mutate the request it was given", () => {
    const input = { kind: "json", routePath: "home", visibility: "public" };
    const before = JSON.stringify(input);
    classifyUnoPageDiscoverability(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("real source through the confined loader and the header use case", () => {
  it("classifies the committed Home as public eligibility only", async () => {
    const absolute = join(REPO_ROOT, HOME_SOURCE);
    const before = readFileSync(absolute);

    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    const header = resolveUnoPageHeader(loaded);
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.title).toBe("Foundation Uno");

    const result = classifyUnoPageDiscoverability({
      kind: header.kind,
      routePath: "home",
      visibility: header.visibility,
    });
    expectAllFlags(result, true);
    if (!result.accepted) return;
    expect(result.visibility).toBe("public");
    expect(result.robotsIfDirectlyServed).toBeNull();

    expect(readFileSync(absolute).equals(before)).toBe(true);
  });

  it("refuses a forged unlisted visibility on the committed JSON Home", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    const header = resolveUnoPageHeader(loaded);
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.kind).toBe("json");
    expect(header.visibility).toBe("public");

    // The committed Home carries the reserved route, so an unlisted claim is refused by the Home rule.
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "json", routePath: "home", visibility: "unlisted" }),
      "home-cannot-be-unlisted",
    );
  });

  it("classifies the committed About Markdown and Components JSON as public eligibility", async () => {
    for (const [pathname, routePath, expectedKind] of [
      ["/en-001/about", "about", "markdown"],
      ["/en-001/components", "components", "json"],
    ] as const) {
      const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname });
      const header = resolveUnoPageHeader(loaded);
      expect(header.accepted).toBe(true);
      if (!header.accepted) return;
      expect(header.kind).toBe(expectedKind);
      expect(header.visibility).toBe("public");

      const result = classifyUnoPageDiscoverability({
        kind: header.kind,
        routePath,
        visibility: header.visibility,
      });
      expectAllFlags(result, true);
      if (!result.accepted) return;
      expect(result.robotsIfDirectlyServed).toBeNull();
    }

    // Markdown can never declare a visibility of its own: a forged value is a projection mismatch.
    expectRefused(
      classifyUnoPageDiscoverability({ kind: "markdown", routePath: "about", visibility: "unlisted" }),
      "discovery:projection-mismatch",
    );
  });

  it("excludes a real non-Home unlisted JSON Page from every surface", async () => {
    const root = makeRepo(
      manifestWith([
        {
          id: "home",
          route: ["home"],
          representations: [{ locale: "en-001", sources: [{ kind: "markdown", path: HOME_SOURCE }] }],
        },
        {
          id: "offers",
          route: ["offers", "home"],
          representations: [
            {
              locale: "en-001",
              sources: [{ kind: "json", path: "deployment/efs/content/offers.home.en-001.json" }],
            },
          ],
        },
      ]),
      {
        "home.en-001.md": "# Scratch home\n\nScratch home body.\n",
        "offers.home.en-001.json": JSON.stringify({ title: "Offers", visibility: "unlisted" }),
      },
    );

    const header = resolveUnoPageHeader(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001/offers/home" }),
    );
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.visibility).toBe("unlisted");

    const result = classifyUnoPageDiscoverability({
      kind: header.kind,
      routePath: "offers/home",
      visibility: header.visibility,
    });
    expectAllFlags(result, false);
    if (!result.accepted) return;
    expect(result.robotsIfDirectlyServed).toBe("noindex,nofollow");
  });
});
