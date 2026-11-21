import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import {
  UNO_CANDIDATE_SOURCE_REFUSAL_REASONS,
  loadUnoCandidateSource,
  traceUnoCandidateSource,
  type UnoCandidateSourceRefusal,
} from "../../src/adapters/efs/uno-confined-source-reader";

/**
 * U03 source-resolution pipeline tests (`UNO-WO-020 / R01`).
 *
 * These cases drive the **production** end-to-end loader: trusted root → the two fixed declaration
 * files → the real candidate matcher → one confined observer per declared source → the existing
 * `resolveDeclaredPageSource` use case. The real checkout is used for the committed Home Markdown, and
 * isolated scratch repositories under the ignored `.temp/` root control precedence, absence and
 * refusal cases.
 *
 * Every refusal asserts the exact closed literal and that it belongs to
 * `UNO_CANDIDATE_SOURCE_REFUSAL_REASONS`. Nothing here asserts a route, a response, a redirect or a
 * publication state.
 */

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCRATCH_ROOT = join(REPO_ROOT, ".temp");
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

const createdRoots: string[] = [];

function scratchRoot(): string {
  mkdirSync(SCRATCH_ROOT, { recursive: true });
  const root = mkdtempSync(join(SCRATCH_ROOT, "wo020-pipeline-"));
  createdRoots.push(root);
  return root;
}

/** One authored home Page with the given declared sources, in the given order. */
function homePage(sources: readonly { kind: string; path: string }[]): unknown {
  return {
    id: "home",
    route: ["home"],
    representations: [{ locale: "en-001", sources }],
  };
}

/** One single-Entity / single-Facet / single-Site manifest holding the given Pages. */
function manifestWith(pages: readonly unknown[]): unknown {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [{ id: "foundation", sites: [{ id: "main", pages }] }],
      },
    ],
  };
}

function selection(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
    ...overrides,
  };
}

/** Materialise one scratch repository: the two fixed declarations plus any content files. */
function makeRepo(
  options: {
    readonly manifest?: unknown;
    readonly config?: unknown;
    readonly files?: Record<string, string | Buffer>;
  } = {},
): string {
  const root = scratchRoot();
  mkdirSync(join(root, "deployment", "efs", "content"), { recursive: true });
  const manifestText =
    typeof options.manifest === "string"
      ? options.manifest
      : JSON.stringify(options.manifest ?? manifestWith([homePage([{ kind: "markdown", path: "deployment/efs/content/home.en-001.md" }])]), null, 2);
  writeFileSync(join(root, "deployment", "efs", "manifest.json"), manifestText);
  const configText =
    typeof options.config === "string" ? options.config : JSON.stringify(options.config ?? selection(), null, 2);
  writeFileSync(join(root, "deployment", "uno.config.json"), configText);
  for (const [name, body] of Object.entries(options.files ?? {})) {
    writeFileSync(join(root, "deployment", "efs", "content", name), body);
  }
  return root;
}

function expectRefused(
  result: { accepted: boolean; reason?: UnoCandidateSourceRefusal },
  reason: UnoCandidateSourceRefusal,
): void {
  expect(result.accepted).toBe(false);
  expect(result.reason).toBe(reason);
  expect(UNO_CANDIDATE_SOURCE_REFUSAL_REASONS).toContain(reason as UnoCandidateSourceRefusal);
}

afterAll(() => {
  for (const root of createdRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("the committed repository, end to end", () => {
  it("loads /en-001 from the real checkout as a real JSON read", async () => {
    const result = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.kind).toBe("json");
    expect(result.text).toBe(
      readFileSync(join(REPO_ROOT, "deployment/efs/content/home.en-001.json"), "utf8"),
    );
    expect(JSON.parse(result.text).title).toBe("Foundation Uno");
    // The preserved legacy Markdown Home is not the served body.
    expect(result.text).not.toBe(
      readFileSync(join(REPO_ROOT, "deployment/efs/content/home.en-001.md"), "utf8"),
    );
  });

  it("loads /en-001/about from the real checkout as a real Markdown read", async () => {
    const result = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001/about" });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.kind).toBe("markdown");
    expect(result.candidate.pageId).toBe("about");
    expect(result.text.startsWith("# About this starter")).toBe(true);
    expect(result.text).toBe(
      readFileSync(join(REPO_ROOT, "deployment/efs/content/about.en-001.md"), "utf8"),
    );
  });

  it("returns the exact matched candidate identity", async () => {
    const result = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.candidate.entityId).toBe(ENTITY_ID);
    expect(result.candidate.facetId).toBe("foundation");
    expect(result.candidate.siteId).toBe("main");
    expect(result.candidate.pageId).toBe("home");
    expect(result.candidate.localeTag).toBe("en-001");
    expect(result.candidate.pathname).toBe("/en-001");
  });

  it("carries no publication, visibility, routing or metadata authority", async () => {
    const result = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result).sort()).toEqual(["accepted", "candidate", "kind", "text"]);
    const serialised = JSON.stringify(result);
    for (const forbidden of [
      '"published"',
      '"public"',
      '"visibility"',
      '"redirect"',
      '"headers"',
      '"canonical"',
      '"hreflang"',
      '"sitemap"',
    ]) {
      expect(serialised.includes(forbidden)).toBe(false);
    }
  });

  it("observes only the declared JSON kind and never the undeclared legacy source", async () => {
    const traced = await traceUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(traced.result.accepted).toBe(true);
    expect(traced.observed).toEqual(["json"]);
  });

  it("observes only the declared Markdown kind for About", async () => {
    const traced = await traceUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001/about" });
    expect(traced.result.accepted).toBe(true);
    expect(traced.observed).toEqual(["markdown"]);
  });
});

describe("address refusals that happen before any content read", () => {
  it("refuses a short language key", async () => {
    expectRefused(await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en" }), "route:unmatched");
  });

  it("refuses an uppercased locale key", async () => {
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/EN-001" }),
      "route:invalid-pathname",
    );
  });

  it("refuses the suppressed Home alias and an unknown child", async () => {
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001/home" }),
      "route:unmatched",
    );
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001/unknown" }),
      "route:unmatched",
    );
  });

  it("refuses a percent escape, a query and a fragment", async () => {
    for (const pathname of ["/%65n-001", "/en-001?x=1", "/en-001#section"]) {
      expectRefused(
        await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname }),
        "route:invalid-pathname",
      );
    }
  });

  it("refuses an unmatched address without opening a source, even when content is missing", async () => {
    const root = makeRepo();
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en" }),
      "route:unmatched",
    );
    const declared = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(declared.accepted).toBe(false);
    if (declared.accepted) return;
    expect(declared.reason).toBe("no-valid-source");
  });
});


describe("declaration file refusals", () => {
  it("refuses a missing manifest", async () => {
    const root = scratchRoot();
    mkdirSync(join(root, "deployment", "efs", "content"), { recursive: true });
    writeFileSync(join(root, "deployment", "uno.config.json"), JSON.stringify(selection()));
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }),
      "source:declarations-unreadable",
    );
  });

  it("refuses a malformed manifest and a malformed selection", async () => {
    const brokenManifest = makeRepo({ manifest: '{"entities":' });
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: brokenManifest, pathname: "/en-001" }),
      "source:declarations-invalid",
    );
    const brokenConfig = makeRepo({ config: "not json" });
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: brokenConfig, pathname: "/en-001" }),
      "source:declarations-invalid",
    );
  });

  it("refuses an oversized manifest", async () => {
    const root = scratchRoot();
    mkdirSync(join(root, "deployment", "efs", "content"), { recursive: true });
    writeFileSync(join(root, "deployment", "efs", "manifest.json"), `{"pad":"${"a".repeat(128 * 1024)}"}`);
    writeFileSync(join(root, "deployment", "uno.config.json"), JSON.stringify(selection()));
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }),
      "source:declarations-unreadable",
    );
  });

  it("refuses a linked manifest", async () => {
    const root = makeRepo();
    const target = join(root, "manifest-target");
    mkdirSync(target, { recursive: true });
    rmSync(join(root, "deployment", "efs", "manifest.json"));
    symlinkSync(target, join(root, "deployment", "efs", "manifest.json"), "junction");
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }),
      "source:declarations-unreadable",
    );
  });

  it("refuses a zero-Entity manifest through the existing graph policy", async () => {
    const zero = makeRepo({ manifest: { entities: [] } });
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: zero, pathname: "/en-001" }),
      "route:manifest-invalid",
    );
  });

  it("refuses a two-Entity manifest through the existing graph policy", async () => {
    const page = homePage([{ kind: "markdown", path: "deployment/efs/content/home.en-001.md" }]);
    const two = makeRepo({
      manifest: {
        entities: [
          { id: ENTITY_ID, facets: [{ id: "foundation", sites: [{ id: "main", pages: [page] }] }] },
          {
            id: "e_00000000000000000000000000",
            facets: [{ id: "foundation", sites: [{ id: "main", pages: [page] }] }],
          },
        ],
      },
    });
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: two, pathname: "/en-001" }),
      "route:manifest-invalid",
    );
  });

  it("refuses an unknown Facet through the existing selection policy", async () => {
    const root = makeRepo({ config: selection({ selectedSite: { facetId: "studio", siteId: "main" } }) });
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }),
      "route:selection-invalid",
    );
  });

  it("refuses a wrong Site through the existing selection policy", async () => {
    const root = makeRepo({ config: selection({ selectedSite: { facetId: "foundation", siteId: "preview" } }) });
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }),
      "route:selection-invalid",
    );
  });
});


const JSON_PATH = "deployment/efs/content/home.en-001.json";
const MARKDOWN_PATH = "deployment/efs/content/home.en-001.md";
const JSON_TEXT = '{"title":"JSON title","body":"JSON body"}';
const MARKDOWN_TEXT = "# Markdown title\n\nMarkdown body.\n";

/** A scratch repository whose home Page declares both kinds, in the given order. */
function twoKindRepo(order: readonly ("json" | "markdown")[], files: Record<string, string> = {}): string {
  const declarations = order.map((kind) => ({
    kind,
    path: kind === "json" ? JSON_PATH : MARKDOWN_PATH,
  }));
  return makeRepo({
    manifest: manifestWith([homePage(declarations)]),
    files: {
      "home.en-001.json": JSON_TEXT,
      "home.en-001.md": MARKDOWN_TEXT,
      ...files,
    },
  });
}

describe("declared JSON-before-Markdown precedence", () => {
  it("accepts a valid JSON declaration when both kinds are valid", async () => {
    const root = twoKindRepo(["json", "markdown"]);
    const traced = await traceUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(traced.result.accepted).toBe(true);
    if (!traced.result.accepted) return;
    expect(traced.result.kind).toBe("json");
    expect(traced.result.text).toBe(JSON_TEXT);
    expect(traced.observed).toEqual(["json"]);
  });

  it("prefers JSON even when Markdown was declared first, without opening it", async () => {
    const root = twoKindRepo(["markdown", "json"]);
    const traced = await traceUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(traced.result.accepted).toBe(true);
    if (!traced.result.accepted) return;
    expect(traced.result.kind).toBe("json");
    expect(traced.observed).toEqual(["json"]);
  });

  it("refuses an invalid declared JSON without falling through to Markdown", async () => {
    const root = twoKindRepo(["json", "markdown"], { "home.en-001.json": '{"broken":' });
    const traced = await traceUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expectRefused(traced.result, "invalid-json-source");
    expect(traced.observed).toEqual(["json"]);
  });

  it("falls through to Markdown only when the declared JSON is absent", async () => {
    const root = makeRepo({
      manifest: manifestWith([
        homePage([
          { kind: "json", path: JSON_PATH },
          { kind: "markdown", path: MARKDOWN_PATH },
        ]),
      ]),
      files: { "home.en-001.md": MARKDOWN_TEXT },
    });
    const traced = await traceUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(traced.result.accepted).toBe(true);
    if (!traced.result.accepted) return;
    expect(traced.result.kind).toBe("markdown");
    expect(traced.result.text).toBe(MARKDOWN_TEXT);
    expect(traced.observed).toEqual(["json", "markdown"]);
  });

  it("accepts a Markdown-only declaration", async () => {
    const root = makeRepo({ files: { "home.en-001.md": MARKDOWN_TEXT } });
    const result = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.kind).toBe("markdown");
  });

  it("refuses when the declared JSON is absent and the declared Markdown is invalid", async () => {
    const root = twoKindRepo(["json", "markdown"], { "home.en-001.md": "no heading here\n" });
    rmSync(join(root, "deployment", "efs", "content", "home.en-001.json"));
    const traced = await traceUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expectRefused(traced.result, "invalid-markdown-source");
    expect(traced.observed).toEqual(["json", "markdown"]);
  });

  it("never probes an undeclared file in the content root", async () => {
    const root = makeRepo({
      files: {
        "home.en-001.md": MARKDOWN_TEXT,
        "stray-undeclared.md": "not a valid source at all\n",
      },
    });
    const traced = await traceUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(traced.result.accepted).toBe(true);
    expect(traced.observed).toEqual(["markdown"]);
    expect(JSON.stringify(traced.result).includes("stray-undeclared")).toBe(false);
  });

  it("gives a JSON public flag no publication authority", async () => {
    const root = twoKindRepo(["json"], {
      "home.en-001.json": '{"public":true,"visibility":"public","published":true,"title":"T"}',
    });
    const result = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result).sort()).toEqual(["accepted", "candidate", "kind", "text"]);
    expect(result.kind).toBe("json");
    expect(JSON.stringify(result).includes('"published"')).toBe(false);
    expect(JSON.stringify(result).includes('"visibility"')).toBe(false);
  });
});


describe("real reads follow the real file", () => {
  it("returns edited fixture text rather than a hardcoded payload", async () => {
    const root = makeRepo({ files: { "home.en-001.md": "# First title\n\nFirst body.\n" } });
    const first = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;

    writeFileSync(
      join(root, "deployment", "efs", "content", "home.en-001.md"),
      "# Second title\n\nSecond body.\n",
    );
    const second = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(second.accepted).toBe(true);
    if (!second.accepted) return;

    expect(first.text).not.toBe(second.text);
    expect(second.text.startsWith("# Second title")).toBe(true);
  });

  it("does not modify the fixture while reading it", async () => {
    const root = makeRepo({ files: { "home.en-001.md": MARKDOWN_TEXT } });
    const absolute = join(root, "deployment", "efs", "content", "home.en-001.md");
    const before = readFileSync(absolute);
    await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(readFileSync(absolute).equals(before)).toBe(true);
  });

  it("reports absent content as no valid source, never as a page", async () => {
    const root = makeRepo();
    const result = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expectRefused(result, "no-valid-source");
  });
});

describe("loader input and root hostility", () => {
  it("refuses a relative or missing root", async () => {
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: "deployment", pathname: "/en-001" }),
      "source:root-invalid",
    );
    expectRefused(
      await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001", extra: 1 }),
      "source:input-invalid",
    );
    expectRefused(await loadUnoCandidateSource(null), "source:input-invalid");
    expectRefused(await loadUnoCandidateSource({ pathname: "/en-001" }), "source:input-invalid");
  });

  it("refuses an accessor request without invoking it", async () => {
    let reads = 0;
    const request = {
      get repoRoot(): string {
        reads += 1;
        return REPO_ROOT;
      },
      pathname: "/en-001",
    };
    expectRefused(await loadUnoCandidateSource(request), "source:input-invalid");
    expect(reads).toBe(0);
  });

  it("refuses a symbol-keyed request", async () => {
    const request: Record<PropertyKey, unknown> = { repoRoot: REPO_ROOT, pathname: "/en-001" };
    request[Symbol("extra")] = true;
    expectRefused(await loadUnoCandidateSource(request), "source:input-invalid");
  });

  it("observes nothing when the address does not match", async () => {
    const traced = await traceUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001/unknown" });
    expect(traced.result.accepted).toBe(false);
    expect(traced.observed).toEqual([]);
  });

  it("never throws for any hostile value", async () => {
    const values: unknown[] = [undefined, null, 0, "", [], new Map(), Symbol("x"), () => undefined];
    for (const value of values) {
      await expect(loadUnoCandidateSource(value)).resolves.toMatchObject({ accepted: false });
    }
  });
});
