import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  UNO_COMMITTED_BASE_INPUT_KEYS,
  UNO_COMMITTED_BASE_REFUSAL_REASONS,
  resolveUnoCommittedBase,
  type UnoCommittedBaseRefusal,
  type UnoCommittedBaseResult,
} from "../../src/application/resolve-uno-committed-base";

/**
 * U03 committed canonical-base reader tests (`UNO-WO-027 / R02`).
 *
 * The committed declaration and manifest are read once as *data*; the reader never touches the filesystem.
 * Every refusal asserts one exact closed code, so a reader that supplied a domain, defaulted a base or
 * echoed an authored value could not pass. The committed declaration states no base, and that must be
 * reported as `committed-base:missing` rather than repaired.
 */

const REPO_ROOT = new URL("../../", import.meta.url);
const CONFIG_URL = new URL("deployment/uno.config.json", REPO_ROOT);
const MANIFEST_URL = new URL("deployment/efs/manifest.json", REPO_ROOT);

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

const readSelection = (): Record<string, unknown> =>
  JSON.parse(readFileSync(CONFIG_URL, "utf8")) as Record<string, unknown>;
const readManifest = (): unknown => JSON.parse(readFileSync(MANIFEST_URL, "utf8"));

/** A minimal valid manifest with one Entity, one Facet and one Site. */
function manifest(facetId = "foundation", siteId = "main"): Record<string, unknown> {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: facetId,
            sites: [
              {
                id: siteId,
                pages: [
                  {
                    id: "home",
                    route: ["home"],
                    representations: [
                      {
                        locale: "en-001",
                        sources: [{ kind: "markdown", path: "deployment/efs/content/home.en-001.md" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** A valid declaration for the committed identifiers, optionally carrying a declared base. */
function selection(base?: unknown): Record<string, unknown> {
  const declared: Record<string, unknown> = {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
  };
  if (base !== undefined) declared["base"] = base;
  return declared;
}

function expectRefused(result: UnoCommittedBaseResult, code: UnoCommittedBaseRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(UNO_COMMITTED_BASE_REFUSAL_REASONS).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

describe("the committed declaration", () => {
  it("accepts the reserved sample canonical with no aliases", () => {
    const result = resolveUnoCommittedBase({ manifest: readManifest(), selection: readSelection() });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result).sort()).toEqual(["accepted", "base", "site"]);
    expect(result.base.canonical).toBe("https://uno-starter.example");
    expect(result.base.aliases).toEqual([]);
    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
  });

  it("still reports a missing base on a synthetic base-free declaration", () => {
    // A separate synthetic fixture: the reader refuses a declaration with no base and never supplies a domain.
    const result = resolveUnoCommittedBase({ manifest: manifest(), selection: selection() });
    expectRefused(result, "committed-base:missing");
    expect(JSON.stringify(result).includes("https://")).toBe(false);
  });

  it("does not read the committed files itself", () => {
    // The reader is pure: an empty manifest refuses on selection, and the committed files are untouched.
    const before = readFileSync(CONFIG_URL, "utf8");
    expectRefused(
      resolveUnoCommittedBase({ manifest: {}, selection: readSelection() }),
      "committed-base:selection-invalid",
    );
    expect(readFileSync(CONFIG_URL, "utf8")).toBe(before);
  });
});

describe("a declared base through the selection validator", () => {
  it("returns the accepted root base with the selected Site", () => {
    const result = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "https://example.org", aliases: [] }),
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(result.base).toEqual({ canonical: "https://example.org", aliases: [] });
    expect(Object.keys(result).sort()).toEqual(["accepted", "base", "site"]);
    expect(Object.keys(result.base)).toEqual(["canonical", "aliases"]);
  });

  it("returns a sub-path base and its aliases in declared order", () => {
    const aliases = ["https://alias.example.net", "https://other.example.net"];
    const result = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "https://example.org/site", aliases }),
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.base.canonical).toBe("https://example.org/site");
    expect(result.base.aliases).toEqual(aliases);
    expect(result.base.aliases).not.toBe(aliases);
  });

  it("returns a loopback base unchanged", () => {
    const result = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "http://localhost:3000/site", aliases: [] }),
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.base.canonical).toBe("http://localhost:3000/site");
  });

  it("maps a policy-refused base to committed-base:invalid", () => {
    for (const base of [
      { canonical: "ftp://example.org", aliases: [] },
      { canonical: "https://example.org/?q=1", aliases: [] },
      { canonical: "https://example.org", aliases: ["https://example.org"] },
      { canonical: "https://example.org/site", aliases: ["https://example.org"] },
      { canonical: "https://example.org", aliases: [], extra: true },
    ]) {
      expectRefused(
        resolveUnoCommittedBase({ manifest: manifest(), selection: selection(base) }),
        "committed-base:invalid",
      );
    }
  });

  it("maps an unreadable declaration to committed-base:unreadable", () => {
    const hostileSelection = Object.create({}) as Record<string, unknown>;
    hostileSelection["version"] = 1;
    hostileSelection["entityId"] = ENTITY_ID;
    hostileSelection["selectedSite"] = { facetId: "foundation", siteId: "main" };
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest(), selection: hostileSelection }),
      "committed-base:unreadable",
    );
  });

  it("maps every other selection failure to committed-base:selection-invalid", () => {
    for (const declared of [
      { ...selection(), version: 2 },
      { ...selection(), entityId: "e_otherentityotherentity00000001" },
      { ...selection(), selectedSite: { facetId: "foundation", siteId: "absent" } },
      { ...selection(), extra: 1 },
    ]) {
      expectRefused(
        resolveUnoCommittedBase({ manifest: manifest("foundation", "main"), selection: declared }),
        "committed-base:selection-invalid",
      );
    }
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest("other", "main"), selection: selection() }),
      "committed-base:selection-invalid",
    );
    expectRefused(
      resolveUnoCommittedBase({ manifest: {}, selection: selection() }),
      "committed-base:selection-invalid",
    );
  });
});


describe("request shape and hostile input", () => {
  it("refuses a request that is not exactly the two declared keys", () => {
    for (const value of [null, undefined, [], 0, "", true]) {
      expectRefused(resolveUnoCommittedBase(value), "committed-base:input-invalid");
    }
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest(), selection: selection(), base: {} }),
      "committed-base:input-invalid",
    );
    expectRefused(resolveUnoCommittedBase({ manifest: manifest() }), "committed-base:input-invalid");
    expectRefused(resolveUnoCommittedBase({ selection: selection() }), "committed-base:input-invalid");
    expectRefused(
      resolveUnoCommittedBase({ manifest: "deployment/efs/manifest.json", selection: selection() }),
      "committed-base:input-invalid",
    );
    expectRefused(
      resolveUnoCommittedBase({ manifest: manifest(), selection: "deployment/uno.config.json" }),
      "committed-base:input-invalid",
    );
  });

  it("refuses an accessor, symbol or exotic request without invoking anything", () => {
    let reads = 0;
    expectRefused(
      resolveUnoCommittedBase({
        manifest: manifest(),
        get selection(): unknown {
          reads += 1;
          return selection({ canonical: "https://example.org", aliases: [] });
        },
      }),
      "committed-base:input-invalid",
    );
    expect(reads).toBe(0);

    const withSymbol = { manifest: manifest(), selection: selection() } as Record<PropertyKey, unknown>;
    withSymbol[Symbol("extra")] = true;
    expectRefused(resolveUnoCommittedBase(withSymbol), "committed-base:input-invalid");

    class ExoticRequest {
      manifest = manifest();
      selection = selection();
    }
    expectRefused(resolveUnoCommittedBase(new ExoticRequest()), "committed-base:input-invalid");
  });

  it("refuses a throwing proxy as a bounded unreadable refusal", () => {
    expectRefused(
      resolveUnoCommittedBase(
        new Proxy(
          {},
          {
            ownKeys(): string[] {
              throw new Error("hostile");
            },
          },
        ),
      ),
      "committed-base:unreadable",
    );
  });

  it("returns a fresh frozen answer and never mutates the caller's data", () => {
    const declared = { canonical: "https://example.org/site", aliases: ["https://alias.example.net"] };
    const manifestInput = manifest();
    const selectionInput = selection(declared);
    const snapshot = JSON.stringify({ manifest: manifestInput, selection: selectionInput });

    const first = resolveUnoCommittedBase({ manifest: manifestInput, selection: selectionInput });
    const second = resolveUnoCommittedBase({ manifest: manifestInput, selection: selectionInput });
    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;

    expect(first).not.toBe(second);
    expect(first.site).not.toBe(second.site);
    expect(first.base).not.toBe(second.base);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.site)).toBe(true);
    expect(Object.isFrozen(first.base)).toBe(true);
    expect(Object.isFrozen(first.base.aliases)).toBe(true);
    expect(JSON.stringify({ manifest: manifestInput, selection: selectionInput })).toBe(snapshot);
  });

  it("keeps one closed vocabulary and echoes nothing when refusing", () => {
    expect(UNO_COMMITTED_BASE_REFUSAL_REASONS).toHaveLength(5);
    expect(new Set(UNO_COMMITTED_BASE_REFUSAL_REASONS).size).toBe(5);
    expect(Object.isFrozen(UNO_COMMITTED_BASE_REFUSAL_REASONS)).toBe(true);
    expect(UNO_COMMITTED_BASE_INPUT_KEYS).toEqual(["manifest", "selection"]);
    expect(Object.isFrozen(UNO_COMMITTED_BASE_INPUT_KEYS)).toBe(true);

    const rejected = resolveUnoCommittedBase({
      manifest: manifest(),
      selection: selection({ canonical: "https://secret-host.example/secret-path?q=1", aliases: [] }),
    });
    expectRefused(rejected, "committed-base:invalid");
    expect(JSON.stringify(rejected)).toBe('{"accepted":false,"reason":"committed-base:invalid"}');
    expect(JSON.stringify(rejected).includes("secret-path")).toBe(false);
    expect(JSON.stringify(rejected).includes("secret-host")).toBe(false);
  });
});
