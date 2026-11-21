import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import { loadUnoCandidateSource } from "../../src/adapters/efs/uno-confined-source-reader";
import {
  UNO_PAGE_HEADER_APPLICATION_REFUSAL_REASONS,
  resolveUnoPageHeader,
  type UnoPageHeaderApplicationRefusal,
  type UnoPageHeaderApplicationResult,
} from "../../src/application/resolve-uno-page-header";
import { projectUnoSelectedPageHeader } from "../../src/core/efs/uno-page-header";

/**
 * U03 confined-source → Page-header pipeline tests (`UNO-WO-021 / R01`).
 *
 * These cases drive the **real** accepted loader (`loadUnoCandidateSource`) over the real checkout and
 * over isolated scratch repositories, then the **real** application use case, and assert the bounded
 * header plus exact closed refusals. Nothing here fakes a candidate, fabricates a Page or activates a
 * route: the address `/en-001` stays an HTTP 404 outside these tests.
 */

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCRATCH_ROOT = join(REPO_ROOT, ".temp");
const HOME_SOURCE = "deployment/efs/content/home.en-001.md";
/** The declared JSON Home candidate of the committed starter. */
const HOME_JSON_SOURCE = "deployment/efs/content/home.en-001.json";
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

const createdRoots: string[] = [];

function scratchRoot(): string {
  mkdirSync(SCRATCH_ROOT, { recursive: true });
  const root = mkdtempSync(join(SCRATCH_ROOT, "wo021-header-"));
  createdRoots.push(root);
  return root;
}

function selection(): Record<string, unknown> {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
  };
}

/** Materialise one scratch repository with the two fixed declarations and any content files. */
function makeRepo(manifest: unknown, files: Record<string, string | Buffer>): string {
  const root = scratchRoot();
  mkdirSync(join(root, "deployment", "efs", "content"), { recursive: true });
  writeFileSync(join(root, "deployment", "efs", "manifest.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(join(root, "deployment", "uno.config.json"), JSON.stringify(selection(), null, 2));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "deployment", "efs", "content", name), body);
  }
  return root;
}

/** One single-Facet/Site manifest holding the given Pages. */
function manifestWith(pages: readonly unknown[]): unknown {
  return {
    entities: [{ id: ENTITY_ID, facets: [{ id: "foundation", sites: [{ id: "main", pages }] }] }],
  };
}

function homePage(sources: readonly { kind: string; path: string }[]): unknown {
  return { id: "home", route: ["home"], representations: [{ locale: "en-001", sources }] };
}

/** A repository whose Home is Markdown and whose `offers/home` Page is JSON. */
function twoPageRepo(offersJson: unknown): string {
  return makeRepo(
    manifestWith([
      homePage([{ kind: "markdown", path: HOME_SOURCE }]),
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
      "offers.home.en-001.json": JSON.stringify(offersJson),
    },
  );
}

function expectRefused(result: UnoPageHeaderApplicationResult, reason: UnoPageHeaderApplicationRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(UNO_PAGE_HEADER_APPLICATION_REFUSAL_REASONS).toContain(result.reason);
}

afterAll(() => {
  for (const root of createdRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("the committed repository through the real loader", () => {
  it("projects the real JSON Home header from disk", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(loaded.accepted).toBe(true);
    if (!loaded.accepted) return;

    const header = resolveUnoPageHeader(loaded);
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.kind).toBe("json");
    expect(header.title).toBe("Foundation Uno");
    expect(header.visibility).toBe("public");
    expect(header.markdownBody).toBeUndefined();
    expect(header.description).toBe(
      "A neutral sample of one Entity, one selected Site and three published Pages.",
    );

    // The header is projected from the declared JSON source actually on disk, not from any Markdown body.
    const onDisk = readFileSync(join(REPO_ROOT, HOME_JSON_SOURCE), "utf8");
    expect(loaded.text).toBe(onDisk);
    expect(JSON.parse(onDisk).title).toBe(header.title);
  });

  it("projects the committed About Markdown header from disk", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001/about" });
    expect(loaded.accepted).toBe(true);
    if (!loaded.accepted) return;

    const header = resolveUnoPageHeader(loaded);
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.kind).toBe("markdown");
    expect(header.title).toBe("About this starter");
    expect(header.visibility).toBe("public");
    expect(typeof header.markdownBody).toBe("string");
    expect((header.markdownBody as string).length).toBeGreaterThan(200);
    expect((header.markdownBody as string).startsWith("# ")).toBe(false);
  });

  it("returns a header with no address, publication or metadata authority", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    const header = resolveUnoPageHeader(loaded);
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;

    expect(Object.keys(header).sort()).toEqual(["accepted", "description", "kind", "title", "visibility"]);
    const serialised = JSON.stringify(header);
    for (const forbidden of [
      '"published"',
      '"pathname"',
      '"canonical"',
      '"hreflang"',
      '"sitemap"',
      '"redirect"',
      '"headers"',
      '"entityId"',
      '"en-001"',
    ]) {
      expect(serialised.includes(forbidden)).toBe(false);
    }
  });

  it("agrees with the pure projector for the same source text", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(loaded.accepted).toBe(true);
    if (!loaded.accepted) return;

    const direct = projectUnoSelectedPageHeader({ kind: loaded.kind, text: loaded.text, routePath: "home" });
    const viaUseCase = resolveUnoPageHeader(loaded);
    expect(viaUseCase).toEqual(direct);
  });

  it("leaves the committed source bytes untouched", async () => {
    const absolute = join(REPO_ROOT, HOME_SOURCE);
    const before = readFileSync(absolute);
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    resolveUnoPageHeader(loaded);
    expect(readFileSync(absolute).equals(before)).toBe(true);
  });

  it("does not mutate the loader result it consumes", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(loaded.accepted).toBe(true);
    const before = JSON.stringify(loaded);
    resolveUnoPageHeader(loaded);
    expect(JSON.stringify(loaded)).toBe(before);
  });
});

describe("a scratch repository through the real loader", () => {
  it("follows an edited source instead of a hardcoded header", async () => {
    const root = makeRepo(manifestWith([homePage([{ kind: "markdown", path: HOME_SOURCE }])]), {
      "home.en-001.md": "# First scratch title\n\nFirst body.\n",
    });

    const first = resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }));
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(first.title).toBe("First scratch title");

    writeFileSync(
      join(root, "deployment", "efs", "content", "home.en-001.md"),
      "# Second scratch title\n\nSecond body.\n",
    );
    const second = resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }));
    expect(second.accepted).toBe(true);
    if (!second.accepted) return;
    expect(second.title).toBe("Second scratch title");
    expect(second.markdownBody).toBe("Second body.");
  });

  it("opens no undeclared file in the content root", async () => {
    const root = makeRepo(manifestWith([homePage([{ kind: "markdown", path: HOME_SOURCE }])]), {
      "home.en-001.md": "# Declared title\n\nDeclared body.\n",
      "stray-undeclared.json": '{"title":"Stray authority"}',
    });
    const header = resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }));
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.title).toBe("Declared title");
    expect(JSON.stringify(header).includes("Stray")).toBe(false);
  });
});


describe("forwarded loader refusals", () => {
  it("forwards an unmatched address refusal verbatim", async () => {
    expectRefused(resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en" })), "route:unmatched");
  });

  it("forwards an invalid pathname refusal verbatim", async () => {
    expectRefused(
      resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/EN-001" })),
      "route:invalid-pathname",
    );
  });

  it("forwards a no-valid-source refusal and never parses it", async () => {
    const root = makeRepo(manifestWith([homePage([{ kind: "markdown", path: HOME_SOURCE }])]), {});
    expectRefused(
      resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" })),
      "no-valid-source",
    );
  });

  it("refuses an unknown or non-string loader refusal literal", () => {
    expectRefused(resolveUnoPageHeader({ accepted: false, reason: "route:made-up" }), "page-header:load-refusal-unknown");
    expectRefused(resolveUnoPageHeader({ accepted: false, reason: 7 }), "page-header:load-refusal-unknown");
    expectRefused(resolveUnoPageHeader({ accepted: false }), "page-header:input-shape");
  });
});

describe("declared precedence seen through the header", () => {
  it("projects JSON when JSON and Markdown are both declared, Markdown first", async () => {
    const root = makeRepo(
      manifestWith([
        homePage([
          { kind: "markdown", path: HOME_SOURCE },
          { kind: "json", path: "deployment/efs/content/home.en-001.json" },
        ]),
      ]),
      {
        "home.en-001.md": "# Markdown title\n\nMarkdown body.\n",
        "home.en-001.json": '{"title":"JSON title"}',
      },
    );
    const header = resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }));
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.kind).toBe("json");
    expect(header.title).toBe("JSON title");
    expect("markdownBody" in header).toBe(false);
  });

  it("never falls back to Markdown when the declared JSON is invalid", async () => {
    const root = makeRepo(
      manifestWith([
        homePage([
          { kind: "json", path: "deployment/efs/content/home.en-001.json" },
          { kind: "markdown", path: HOME_SOURCE },
        ]),
      ]),
      {
        "home.en-001.json": '{"title":',
        "home.en-001.md": "# Markdown title\n\nMarkdown body.\n",
      },
    );
    expectRefused(
      resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" })),
      "invalid-json-source",
    );
  });

  it("gives a JSON public flag no publication authority end to end", async () => {
    const root = makeRepo(manifestWith([homePage([{ kind: "json", path: "deployment/efs/content/home.en-001.json" }])]), {
      "home.en-001.json": '{"title":"Header","public":true,"published":true,"visibility":"public"}',
    });
    const header = resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" }));
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(Object.keys(header).sort()).toEqual(["accepted", "kind", "title", "visibility"]);
    const serialised = JSON.stringify(header);
    expect(serialised.includes('"published"')).toBe(false);
    expect(serialised.includes('"public":')).toBe(false);
  });

  it("accepts an explicit unlisted visibility for a non-Home Page", async () => {
    const root = twoPageRepo({ title: "Offers", description: "Offers summary.", visibility: "unlisted" });
    const header = resolveUnoPageHeader(
      await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001/offers/home" }),
    );
    expect(header.accepted).toBe(true);
    if (!header.accepted) return;
    expect(header.kind).toBe("json");
    expect(header.title).toBe("Offers");
    expect(header.description).toBe("Offers summary.");
    expect(header.visibility).toBe("unlisted");
  });

  it("refuses unlisted for the reserved Home Page from the real loader", async () => {
    const root = makeRepo(manifestWith([homePage([{ kind: "json", path: "deployment/efs/content/home.en-001.json" }])]), {
      "home.en-001.json": '{"title":"Home","visibility":"unlisted"}',
    });
    expectRefused(
      resolveUnoPageHeader(await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" })),
      "home-cannot-be-unlisted",
    );
  });
});


describe("candidate trust and hostile application input", () => {
  /** A real loader result, widened into a mutable plain copy for forged-candidate cases. */
  async function realLoaded(): Promise<{ accepted: true; candidate: Record<string, unknown>; kind: string; text: string }> {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    expect(loaded.accepted).toBe(true);
    if (!loaded.accepted) throw new Error("the committed Home candidate must load");
    return {
      accepted: true,
      candidate: { ...loaded.candidate },
      kind: loaded.kind,
      text: loaded.text,
    };
  }

  it("refuses a Home candidate carrying a non-empty route", async () => {
    const loaded = await realLoaded();
    loaded.candidate["routePath"] = "offers/home";
    expectRefused(resolveUnoPageHeader(loaded), "page-header:home-inconsistent");
  });

  it("refuses a non-Home candidate carrying the reserved Home authoring route", async () => {
    const loaded = await realLoaded();
    loaded.candidate["pageId"] = "offers";
    loaded.candidate["routePath"] = "home";
    loaded.candidate["pathname"] = "/en-001/home";
    expectRefused(resolveUnoPageHeader(loaded), "page-header:home-inconsistent");
  });

  it("refuses a candidate whose pathname does not follow from its own identity", async () => {
    const loaded = await realLoaded();
    loaded.candidate["pathname"] = "/en-001/offers/home";
    expectRefused(resolveUnoPageHeader(loaded), "page-header:candidate-invalid");

    const mismatched = await realLoaded();
    mismatched.candidate["localePathKey"] = "en-002";
    expectRefused(resolveUnoPageHeader(mismatched), "page-header:candidate-invalid");
  });

  it("refuses a candidate that does not declare the supplied kind", async () => {
    const loaded = await realLoaded();
    loaded.kind = "markdown";
    expectRefused(resolveUnoPageHeader(loaded), "page-header:kind-inconsistent");

    const unknown = await realLoaded();
    unknown.kind = "yaml";
    expectRefused(resolveUnoPageHeader(unknown), "page-header:kind-inconsistent");
  });

  it("refuses a traversal route in an otherwise well-formed candidate", async () => {
    const loaded = await realLoaded();
    loaded.candidate["pageId"] = "offers";
    loaded.candidate["routePath"] = "../escape";
    loaded.candidate["pathname"] = "/en-001/../escape";
    expectRefused(resolveUnoPageHeader(loaded), "page-header:route-invalid");
  });

  it("refuses a malformed candidate shape", async () => {
    const noPage = await realLoaded();
    delete noPage.candidate["pageId"];
    expectRefused(resolveUnoPageHeader(noPage), "page-header:candidate-invalid");

    const noSources = await realLoaded();
    noSources.candidate["sources"] = [];
    expectRefused(resolveUnoPageHeader(noSources), "page-header:candidate-invalid");

    const badSource = await realLoaded();
    badSource.candidate["sources"] = [{ kind: "markdown" }];
    expectRefused(resolveUnoPageHeader(badSource), "page-header:candidate-invalid");
  });

  it("refuses an unexpected loader-result shape", async () => {
    const loaded = await realLoaded();
    const extra = { ...loaded, extra: 1 };
    expectRefused(resolveUnoPageHeader(extra), "page-header:input-shape");

    const missingText = { accepted: true, candidate: loaded.candidate, kind: loaded.kind };
    expectRefused(resolveUnoPageHeader(missingText), "page-header:input-shape");

    const wrongAccepted = { ...loaded, accepted: "yes" };
    expectRefused(resolveUnoPageHeader(wrongAccepted), "page-header:input-shape");

    const nonStringText = { ...loaded, text: 7 };
    expectRefused(resolveUnoPageHeader(nonStringText), "page-header:input-shape");
  });

  it("refuses hostile input without invoking code", async () => {
    let reads = 0;
    const accessor = {
      get accepted(): boolean {
        reads += 1;
        return true;
      },
      candidate: {},
      kind: "markdown",
      text: "# T\n\nB\n",
    };
    expectRefused(resolveUnoPageHeader(accessor), "page-header:input-not-plain");
    expect(reads).toBe(0);

    const withSymbol: Record<PropertyKey, unknown> = { accepted: false, reason: "route:unmatched" };
    withSymbol[Symbol("extra")] = true;
    expectRefused(resolveUnoPageHeader(withSymbol), "page-header:input-not-plain");

    class Exotic {
      accepted = false;
      reason = "route:unmatched";
    }
    expectRefused(resolveUnoPageHeader(new Exotic()), "page-header:input-not-plain");

    const hostile = new Proxy(
      { accepted: false, reason: "route:unmatched" },
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    expectRefused(resolveUnoPageHeader(hostile), "page-header:input-not-plain");

    for (const value of [undefined, null, 0, [], "text"]) {
      expectRefused(resolveUnoPageHeader(value), "page-header:input-not-plain");
    }
  });
});
