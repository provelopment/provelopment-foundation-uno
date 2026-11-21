import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import {
  UNO_DELIVERY_CANONICAL_URL_MAX_BYTES,
  UNO_DELIVERY_INPUT_KEYS,
  UNO_DELIVERY_LOADED_SOURCE_KEYS,
  UNO_DELIVERY_REFUSAL_REASONS,
  prepareUnoPageDeliveryCandidate,
  type UnoDeliveryRefusal,
  type UnoDeliveryResult,
} from "../../src/application/prepare-uno-page-delivery-candidate";
import { loadUnoCandidateSource } from "../../src/adapters/efs/uno-confined-source-reader";

/**
 * U03 prepared Page-delivery candidate tests (`UNO-WO-026 / R01`).
 *
 * These cases drive the **real** confined loader over the real checkout and over isolated scratch repositories,
 * then the real use case, and assert one bounded non-serving record or one exact closed literal. Nothing here
 * creates a route, a response or a redirect: `/en-001` stays an HTTP 404 outside these tests.
 */

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCRATCH_ROOT = join(REPO_ROOT, ".temp");
const HOME_SOURCE = "deployment/efs/content/home.en-001.md";
/** The declared JSON Home candidate of the committed starter. */
const HOME_JSON_SOURCE = "deployment/efs/content/home.en-001.json";
const MANIFEST_SOURCE = "deployment/efs/manifest.json";
const SELECTION_SOURCE = "deployment/uno.config.json";
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const LOOPBACK = { canonical: "http://localhost:3000", aliases: [] as string[] };
const SITE_BASE = { canonical: "https://example.org/site", aliases: [] as string[] };

const createdRoots: string[] = [];

afterAll(() => {
  for (const root of createdRoots) rmSync(root, { recursive: true, force: true });
});

function scratchRoot(): string {
  mkdirSync(SCRATCH_ROOT, { recursive: true });
  const root = mkdtempSync(join(SCRATCH_ROOT, "wo026-delivery-"));
  createdRoots.push(root);
  return root;
}

function readJson(relative: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(REPO_ROOT, relative), "utf8")) as Record<string, unknown>;
}

/** The same read, against an isolated scratch repository root. */
function readJsonFrom(root: string, relative: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, relative), "utf8")) as Record<string, unknown>;
}

function digest(relative: string): string {
  return createHash("sha256").update(readFileSync(join(REPO_ROOT, relative))).digest("hex");
}

/** The committed selection, plus the stored mapping the committed file already declares. */
function committedSelection(): Record<string, unknown> {
  return readJson(SELECTION_SOURCE);
}

/** One scratch repository: declarations plus content, all under an isolated ignored root. */
function makeRepo(
  manifest: unknown,
  selection: unknown,
  files: Record<string, string>,
): string {
  const root = scratchRoot();
  mkdirSync(join(root, "deployment", "efs", "content"), { recursive: true });
  writeFileSync(join(root, "deployment", "efs", "manifest.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(join(root, "deployment", "uno.config.json"), JSON.stringify(selection, null, 2));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "deployment", "efs", "content", name), body);
  }
  return root;
}

function scratchSelection(): Record<string, unknown> {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
    languagePreferences: { en: "en-001" },
  };
}

/** One single-Facet/Site manifest with a declared locale authority and the given Pages. */
function manifestWith(pages: readonly unknown[]): unknown {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: "foundation",
            sites: [{ id: "main", locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" }, pages }],
          },
        ],
      },
    ],
  };
}

function pageOf(id: string, route: readonly string[], sources: readonly { kind: string; path: string }[]): unknown {
  return { id, route, representations: [{ locale: "en-001", sources }] };
}

function expectRefused(result: UnoDeliveryResult, code: UnoDeliveryRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(UNO_DELIVERY_REFUSAL_REASONS).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

describe("the committed Home through the real confined loader", () => {
  it("prepares the one bounded candidate without serving anything", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJson(MANIFEST_SOURCE),
      selection: committedSelection(),
      base: LOOPBACK,
      pathname: "/en-001",
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity).toEqual({
      entityId: ENTITY_ID,
      facetId: "foundation",
      siteId: "main",
      pageId: "home",
      localeTag: "en-001",
      pathname: "/en-001",
    });
    expect(result.document.kind).toBe("json");
    expect(result.document.title).toBe("Foundation Uno");
    expect(result.document.visibility).toBe("public");
    expect(result.document.markdownBody).toBeUndefined();
    expect(result.document.pageDocument?.sections.length).toBe(4);
    expect(result.ifServed.canonicalUrl).toBe("http://localhost:3000/en-001");
    expect(result.ifServed.robots).toBeNull();
    expect(Object.keys(result).sort()).toEqual(["accepted", "document", "identity", "ifServed"]);
    expect(Object.keys(result.document).sort()).toEqual([
      "description",
      "kind",
      "pageDocument",
      "title",
      "visibility",
    ]);
  });

  it("carries a validated JSON document and no publication, response or route authority", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJson(MANIFEST_SOURCE),
      selection: committedSelection(),
      base: LOOPBACK,
      pathname: "/en-001",
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    // The candidate carries the validated document, never the raw authored text of any file.
    const onDisk = readFileSync(join(REPO_ROOT, HOME_JSON_SOURCE), "utf8");
    const document = result.document.pageDocument;
    expect(document).toBeDefined();
    expect(document?.title).toBe(JSON.parse(onDisk).title);
    expect(JSON.stringify(result).includes(onDisk)).toBe(false);
    expect(result.document.markdownBody).toBeUndefined();

    const serialised = JSON.stringify(result);
    for (const forbidden of ["published", "authorized", "live", "status", "redirect", "html"]) {
      expect(Object.keys(result)).not.toContain(forbidden);
      expect(serialised.includes(`"${forbidden}"`)).toBe(false);
    }
    expect(serialised).not.toMatch(/<link|<script|<meta/);
    // The six eligibility answers are booleans, never emitted `hreflang` markup or a sitemap entry.
    expect(typeof result.ifServed.eligibleIfPublished.hreflang).toBe("boolean");
    expect(serialised).not.toMatch(/<link[^>]*hreflang/);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.identity)).toBe(true);
    expect(Object.isFrozen(result.document)).toBe(true);
    expect(Object.isFrozen(result.ifServed)).toBe(true);
    expect(Object.isFrozen(result.ifServed.eligibleIfPublished)).toBe(true);
  });

  it("reads the committed files without mutating any of them", () => {
    const before = [digest(MANIFEST_SOURCE), digest(SELECTION_SOURCE), digest(HOME_SOURCE)];
    const manifest = readJson(MANIFEST_SOURCE);
    const selection = committedSelection();
    const snapshot = [JSON.stringify(manifest), JSON.stringify(selection)];
    const call = prepareUnoPageDeliveryCandidate({
      manifest,
      selection,
      base: LOOPBACK,
      pathname: "/en-001",
      loadedSource: { accepted: false, reason: "source:input-invalid" },
    });
    expect(call.accepted).toBe(false);
    expect([digest(MANIFEST_SOURCE), digest(SELECTION_SOURCE), digest(HOME_SOURCE)]).toEqual(before);
    expect([JSON.stringify(manifest), JSON.stringify(selection)]).toEqual(snapshot);
  });

  it("uses a proposed sub-path base for the canonical address and never an alias", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJson(MANIFEST_SOURCE),
      selection: committedSelection(),
      base: { canonical: "https://example.org/site", aliases: ["https://alias.example.net"] },
      pathname: "/en-001",
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.ifServed.canonicalUrl).toBe("https://example.org/site/en-001");
    expect(result.ifServed.canonicalUrl.includes("alias.example.net")).toBe(false);
  });
});


/** One scratch repository whose Home is the reserved Markdown Page. */
function scratchRepo(pages: readonly unknown[], files: Record<string, string>): string {
  return makeRepo(
    manifestWith([pageOf("home", ["home"], [{ kind: "markdown", path: HOME_SOURCE }]), ...pages]),
    scratchSelection(),
    { "home.en-001.md": "# Scratch home\n\nScratch home body.\n", ...files },
  );
}

describe("ordinary candidates in a scratch repository", () => {
  it("prepares an unlisted non-Home JSON candidate with every flag false", async () => {
    const root = scratchRepo(
      [pageOf("offers", ["offers", "home"], [{ kind: "json", path: "deployment/efs/content/offers.home.en-001.json" }])],
      {
        "offers.home.en-001.json": JSON.stringify({
          title: "Offers",
          description: "Offers summary.",
          visibility: "unlisted",
        }),
      },
    );
    const pathname = "/en-001/offers/home";
    const loaded = await loadUnoCandidateSource({ repoRoot: root, pathname });
    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJsonFrom(root, MANIFEST_SOURCE),
      selection: readJsonFrom(root, SELECTION_SOURCE),
      base: SITE_BASE,
      pathname,
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity.pageId).toBe("offers");
    expect(result.identity.localeTag).toBe("en-001");
    expect(result.identity.pathname).toBe(pathname);
    expect(result.document).toEqual({
      kind: "json",
      title: "Offers",
      description: "Offers summary.",
      visibility: "unlisted",
      // The fixture is a valid *header* but not a version-1 Page document (no `version`, no `sections`), so the
      // candidate carries the closed document outcome instead of a renderable body. This is the new, stronger
      // assertion of `UNO-WO-035 / R01`: publication and renderability are separate decisions.
      pageDocumentRefusal: "document:unsupported-version",
    });
    expect(result.document.pageDocument).toBeUndefined();
    expect(result.ifServed.canonicalUrl).toBe("https://example.org/site/en-001/offers/home");
    expect(result.ifServed.robots).toBe("noindex,nofollow");
    expect(result.ifServed.eligibleIfPublished).toEqual({
      navigation: false,
      sitemap: false,
      hreflang: false,
      xDefault: false,
      languageSwitch: false,
      automaticLocaleRedirectTarget: false,
    });
  });

  it("prepares a public non-Home Markdown candidate with every flag true", async () => {
    const root = scratchRepo(
      [pageOf("notes", ["notes"], [{ kind: "markdown", path: "deployment/efs/content/notes.en-001.md" }])],
      { "notes.en-001.md": "# Notes\n\nA short note.\n" },
    );
    const pathname = "/en-001/notes";
    const loaded = await loadUnoCandidateSource({ repoRoot: root, pathname });
    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJsonFrom(root, MANIFEST_SOURCE),
      selection: readJsonFrom(root, SELECTION_SOURCE),
      base: SITE_BASE,
      pathname,
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity.pageId).toBe("notes");
    expect(result.document.kind).toBe("markdown");
    expect(result.document.title).toBe("Notes");
    expect(result.document.markdownBody).toBe("A short note.");
    expect(result.document.description).toBeUndefined();
    expect(result.ifServed.robots).toBeNull();
    expect(result.ifServed.eligibleIfPublished).toEqual({
      navigation: true,
      sitemap: true,
      hreflang: true,
      xDefault: true,
      languageSwitch: true,
      automaticLocaleRedirectTarget: true,
    });
  });

  it("keeps the declared JSON-before-Markdown precedence", async () => {
    const root = scratchRepo(
      [
        pageOf("deals", ["deals"], [
          { kind: "json", path: "deployment/efs/content/deals.en-001.json" },
          { kind: "markdown", path: "deployment/efs/content/deals.en-001.md" },
        ]),
      ],
      {
        "deals.en-001.json": JSON.stringify({ title: "Deals", visibility: "unlisted" }),
        "deals.en-001.md": "# Markdown Deals\n",
      },
    );
    const pathname = "/en-001/deals";
    const loaded = await loadUnoCandidateSource({ repoRoot: root, pathname });
    expect(loaded.accepted).toBe(true);
    if (!loaded.accepted) return;
    expect(loaded.kind).toBe("json");

    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJsonFrom(root, MANIFEST_SOURCE),
      selection: readJsonFrom(root, SELECTION_SOURCE),
      base: SITE_BASE,
      pathname,
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.document.kind).toBe("json");
    expect(result.document.title).toBe("Deals");
    expect(result.document.markdownBody).toBeUndefined();
  });

  it("refuses a malformed preferred JSON rather than falling back to the valid Markdown", async () => {
    const root = scratchRepo(
      [
        pageOf("deals", ["deals"], [
          { kind: "json", path: "deployment/efs/content/deals.en-001.json" },
          { kind: "markdown", path: "deployment/efs/content/deals.en-001.md" },
        ]),
      ],
      { "deals.en-001.json": "{ not json", "deals.en-001.md": "# Markdown Deals\n" },
    );
    const pathname = "/en-001/deals";
    const loaded = await loadUnoCandidateSource({ repoRoot: root, pathname });
    expect(loaded.accepted).toBe(false);

    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJsonFrom(root, MANIFEST_SOURCE),
      selection: readJsonFrom(root, SELECTION_SOURCE),
      base: SITE_BASE,
      pathname,
      loadedSource: loaded,
    });
    expectRefused(result, "delivery:load-refused");
  });
});


/** The accepted committed loader result, reused by the request-shaped cases. */
async function committedLoad(): Promise<unknown> {
  return loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001" });
}

function request(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    manifest: readJson(MANIFEST_SOURCE),
    selection: committedSelection(),
    base: LOOPBACK,
    pathname: "/en-001",
    loadedSource: { accepted: false, reason: "source:input-invalid" },
    ...overrides,
  };
}

describe("stored authority and proposed base refusals", () => {
  it("refuses a manifest without a declared Site locale authority", () => {
    const manifest = readJson(MANIFEST_SOURCE) as {
      entities: { facets: { sites: Record<string, unknown>[] }[] }[];
    };
    delete manifest.entities[0]!.facets[0]!.sites[0]!["locales"];
    expectRefused(prepareUnoPageDeliveryCandidate(request({ manifest })), "delivery:committed-locales-invalid");
  });

  it("refuses a selection that states no mapping", () => {
    const selection = committedSelection();
    delete selection["languagePreferences"];
    expectRefused(prepareUnoPageDeliveryCandidate(request({ selection })), "delivery:committed-locales-invalid");
  });

  it("refuses an invalid proposed canonical base", () => {
    for (const base of [
      { canonical: "not a url", aliases: [] },
      { canonical: "https://example.org/site/", aliases: [] },
      { canonical: "http://example.org", aliases: ["ftp://alias.example"] },
      { canonical: "https://example.org", aliases: [], extra: true },
    ]) {
      expectRefused(prepareUnoPageDeliveryCandidate(request({ base })), "delivery:site-inputs-invalid");
    }
  });

  it("refuses a canonical address beyond the total byte cap instead of truncating it", async () => {
    const segment = "a".repeat(31);
    const route = [segment, segment, segment, segment];
    const manifest = manifestWith([
      pageOf("home", ["home"], [{ kind: "markdown", path: HOME_SOURCE }]),
      pageOf("long", route, [{ kind: "markdown", path: "deployment/efs/content/long.en-001.md" }]),
    ]);
    const root = makeRepo(manifest, scratchSelection(), {
      "home.en-001.md": "# Scratch home\n\nScratch home body.\n",
      "long.en-001.md": "# Long\n\nA long route.\n",
    });
    const pathname = `/en-001/${route.join("/")}`;
    const label = "a".repeat(60);
    const base = { canonical: `https://${[label, label, label, label].join(".")}`, aliases: [] };
    expect(`${base.canonical}${pathname}`.length).toBeGreaterThan(UNO_DELIVERY_CANONICAL_URL_MAX_BYTES);

    const loaded = await loadUnoCandidateSource({ repoRoot: root, pathname });
    expect(loaded.accepted).toBe(true);
    expectRefused(
      prepareUnoPageDeliveryCandidate({
        manifest,
        selection: scratchSelection(),
        base,
        pathname,
        loadedSource: loaded,
      }),
      "delivery:canonical-too-long",
    );
  });
});


describe("route and loader refusals", () => {
  it("refuses a missing, unknown or malformed pathname", async () => {
    const loaded = await committedLoad();
    expectRefused(
      prepareUnoPageDeliveryCandidate({
        manifest: readJson(MANIFEST_SOURCE),
        selection: committedSelection(),
        base: LOOPBACK,
        loadedSource: loaded,
      }),
      "delivery:input-invalid",
    );
    for (const pathname of ["/en-001/absent", "/EN-001", "en-001", "/en-001/"]) {
      expectRefused(prepareUnoPageDeliveryCandidate(request({ pathname })), "delivery:route-invalid");
    }
  });

  it("refuses a loader refusal at a declared address instead of searching a nearby route", async () => {
    const unknown = await loadUnoCandidateSource({ repoRoot: REPO_ROOT, pathname: "/en-001/absent" });
    expect(unknown.accepted).toBe(false);
    expectRefused(
      prepareUnoPageDeliveryCandidate(request({ pathname: "/en-001/absent", loadedSource: unknown })),
      "delivery:route-invalid",
    );

    // A declared address whose own source cannot be read refuses at the load boundary, never by substitution.
    const root = makeRepo(
      manifestWith([pageOf("home", ["home"], [{ kind: "markdown", path: HOME_SOURCE }])]),
      scratchSelection(),
      {},
    );
    const refused = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001" });
    expect(refused.accepted).toBe(false);
    expectRefused(
      prepareUnoPageDeliveryCandidate({
        manifest: readJsonFrom(root, MANIFEST_SOURCE),
        selection: readJsonFrom(root, SELECTION_SOURCE),
        base: SITE_BASE,
        pathname: "/en-001",
        loadedSource: refused,
      }),
      "delivery:load-refused",
    );
  });

  it("refuses a loader result that is not the accepted loader shape", async () => {
    const loaded = (await committedLoad()) as Record<string, unknown>;
    const extra = { ...loaded, note: "extra" };
    const missing = { accepted: true, candidate: loaded["candidate"], kind: loaded["kind"] };
    for (const loadedSource of [{ accepted: false, reason: "source:input-invalid" }, extra, missing]) {
      expectRefused(prepareUnoPageDeliveryCandidate(request({ loadedSource })), "delivery:load-refused");
    }
  });
});


describe("candidate identity refusals", () => {
  it("refuses a candidate that disagrees with the authoritative one", async () => {
    const loaded = (await committedLoad()) as {
      accepted: true;
      candidate: Record<string, unknown>;
      kind: string;
      text: string;
    };
    const variants: ((candidate: Record<string, unknown>) => Record<string, unknown>)[] = [
      (candidate) => ({ ...candidate, entityId: "e_otherentityotherentity00000001" }),
      (candidate) => ({ ...candidate, siteId: "other" }),
      (candidate) => ({ ...candidate, pageId: "offers" }),
      (candidate) => ({ ...candidate, localeTag: "de-DE" }),
      (candidate) => ({ ...candidate, routePath: "offers" }),
      (candidate) => ({ ...candidate, pathname: "/en-001/offers" }),
      (candidate) => ({
        ...candidate,
        sources: (candidate["sources"] as { kind: string; path: string }[]).map((source) => ({
          ...source,
          kind: source.kind === "markdown" ? "json" : "markdown",
        })),
      }),
      (candidate) => ({
        ...candidate,
        sources: [{ kind: "markdown", path: "deployment/efs/content/home.de-DE.md" }],
      }),
      (candidate) => ({ ...candidate, sources: [] }),
      (candidate) => ({ ...candidate, sources: [{ kind: "markdown" }] }),
    ];
    for (const mutate of variants) {
      const tampered = { ...loaded, candidate: mutate(loaded.candidate) };
      expectRefused(
        prepareUnoPageDeliveryCandidate(request({ loadedSource: tampered })),
        "delivery:candidate-mismatch",
      );
    }
  });

  it("refuses a swapped source order for a two-source candidate", async () => {
    const root = scratchRepo(
      [
        pageOf("deals", ["deals"], [
          { kind: "json", path: "deployment/efs/content/deals.en-001.json" },
          { kind: "markdown", path: "deployment/efs/content/deals.en-001.md" },
        ]),
      ],
      {
        "deals.en-001.json": JSON.stringify({ title: "Deals", visibility: "unlisted" }),
        "deals.en-001.md": "# Markdown Deals\n",
      },
    );
    const pathname = "/en-001/deals";
    const loaded = (await loadUnoCandidateSource({ repoRoot: root, pathname })) as unknown as {
      accepted: true;
      candidate: { sources: { kind: string; path: string }[] };
      kind: string;
      text: string;
    };
    expect(loaded.accepted).toBe(true);
    const swapped = {
      ...loaded,
      candidate: { ...loaded.candidate, sources: [...loaded.candidate.sources].reverse() },
    };
    expectRefused(
      prepareUnoPageDeliveryCandidate({
        manifest: readJsonFrom(root, MANIFEST_SOURCE),
        selection: readJsonFrom(root, SELECTION_SOURCE),
        base: SITE_BASE,
        pathname,
        loadedSource: swapped,
      }),
      "delivery:candidate-mismatch",
    );
  });
});

describe("header, discoverability and request-shape refusals", () => {
  it("refuses an unlisted Home, which the Page-header policy already forbids", async () => {
    const unlistedHome = makeRepo(
      manifestWith([pageOf("home", ["home"], [{ kind: "json", path: "deployment/efs/content/home.en-001.json" }])]),
      scratchSelection(),
      { "home.en-001.json": JSON.stringify({ title: "Home", visibility: "unlisted" }) },
    );
    const homeLoad = await loadUnoCandidateSource({ repoRoot: unlistedHome, pathname: "/en-001" });
    expect(homeLoad.accepted).toBe(true);
    expectRefused(
      prepareUnoPageDeliveryCandidate({
        manifest: readJsonFrom(unlistedHome, MANIFEST_SOURCE),
        selection: readJsonFrom(unlistedHome, SELECTION_SOURCE),
        base: SITE_BASE,
        pathname: "/en-001",
        loadedSource: homeLoad,
      }),
      "delivery:header-invalid",
    );
  });

  it("refuses a request that is not exactly the five declared keys", async () => {
    const loaded = await committedLoad();
    for (const value of [null, undefined, [], 0, "", true]) {
      expectRefused(prepareUnoPageDeliveryCandidate(value), "delivery:input-invalid");
    }
    expectRefused(
      prepareUnoPageDeliveryCandidate({ ...request({ loadedSource: loaded }), localePolicy: {} }),
      "delivery:input-invalid",
    );
    const withoutBase = request({ loadedSource: loaded }) as Record<string, unknown>;
    delete withoutBase["base"];
    expectRefused(prepareUnoPageDeliveryCandidate(withoutBase), "delivery:input-invalid");
    expectRefused(
      prepareUnoPageDeliveryCandidate(request({ manifest: "deployment/efs/manifest.json" })),
      "delivery:input-invalid",
    );
  });

  it("refuses an accessor, symbol or exotic request without invoking anything", async () => {
    const loaded = await committedLoad();
    let reads = 0;
    const hostile = {
      manifest: readJson(MANIFEST_SOURCE),
      selection: committedSelection(),
      base: LOOPBACK,
      pathname: "/en-001",
      get loadedSource(): unknown {
        reads += 1;
        return loaded;
      },
    };
    expectRefused(prepareUnoPageDeliveryCandidate(hostile), "delivery:input-invalid");
    expect(reads).toBe(0);

    const withSymbol = request({ loadedSource: loaded }) as Record<PropertyKey, unknown>;
    withSymbol[Symbol("extra")] = true;
    expectRefused(prepareUnoPageDeliveryCandidate(withSymbol), "delivery:input-invalid");

    class Exotic {
      manifest = readJson(MANIFEST_SOURCE);
      selection = committedSelection();
      base = LOOPBACK;
      pathname = "/en-001";
      loadedSource = loaded;
    }
    expectRefused(prepareUnoPageDeliveryCandidate(new Exotic()), "delivery:input-invalid");

    expectRefused(
      prepareUnoPageDeliveryCandidate(
        new Proxy(
          {},
          {
            ownKeys(): string[] {
              throw new Error("hostile");
            },
          },
        ),
      ),
      "delivery:unreadable",
    );
  });

  it("keeps one closed duplicate-free vocabulary and echoes nothing", () => {
    expect(UNO_DELIVERY_REFUSAL_REASONS).toHaveLength(11);
    expect(new Set(UNO_DELIVERY_REFUSAL_REASONS).size).toBe(11);
    // The one literal this order adds, so a document/header mismatch can never be silently repaired.
    expect(UNO_DELIVERY_REFUSAL_REASONS).toContain("delivery:document-invalid");
    expect(Object.isFrozen(UNO_DELIVERY_REFUSAL_REASONS)).toBe(true);
    expect(UNO_DELIVERY_INPUT_KEYS).toEqual(["manifest", "selection", "base", "pathname", "loadedSource"]);
    expect(UNO_DELIVERY_LOADED_SOURCE_KEYS).toEqual(["accepted", "candidate", "kind", "text"]);
    expect(UNO_DELIVERY_CANONICAL_URL_MAX_BYTES).toBe(384);

    const rejected = prepareUnoPageDeliveryCandidate(request({ pathname: "/en-001/absent" }));
    expectRefused(rejected, "delivery:route-invalid");
    expect(JSON.stringify(rejected)).toBe('{"accepted":false,"reason":"delivery:route-invalid"}');
    expect(JSON.stringify(rejected).includes("absent")).toBe(false);
  });
});


describe("record freshness and the canonical byte boundary", () => {
  it("prepares a public JSON candidate without a description or a body", async () => {
    const root = makeRepo(
      manifestWith([
        pageOf("home", ["home"], [{ kind: "markdown", path: HOME_SOURCE }]),
        pageOf("notice", ["notice"], [{ kind: "json", path: "deployment/efs/content/notice.en-001.json" }]),
      ]),
      scratchSelection(),
      {
        "home.en-001.md": "# Scratch home\n\nScratch home body.\n",
        "notice.en-001.json": JSON.stringify({ title: "Notice", visibility: "public" }),
      },
    );
    const pathname = "/en-001/notice";
    const loaded = await loadUnoCandidateSource({ repoRoot: root, pathname });
    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJsonFrom(root, MANIFEST_SOURCE),
      selection: readJsonFrom(root, SELECTION_SOURCE),
      base: SITE_BASE,
      pathname,
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    // The header keys are unchanged; the candidate now also carries the closed document outcome, which is what the
    // serving gate reads before it will render a JSON Page.
    expect(Object.keys(result.document)).toEqual(["kind", "title", "visibility", "pageDocumentRefusal"]);
    expect(result.document.pageDocument).toBeUndefined();
    expect(result.document.pageDocumentRefusal).toBe("document:unsupported-version");
    expect(result.document.description).toBeUndefined();
    expect(result.document.markdownBody).toBeUndefined();
    expect(result.ifServed.robots).toBeNull();
  });

  it("carries a validated version-1 JSON document and freezes it", async () => {
    const document = {
      version: 1,
      title: "Notice",
      sections: [{ id: "body", module: "content.prose", props: { text: "Published body." } }],
    };
    const root = makeRepo(
      manifestWith([
        pageOf("home", ["home"], [{ kind: "markdown", path: HOME_SOURCE }]),
        pageOf("notice", ["notice"], [{ kind: "json", path: "deployment/efs/content/notice.en-001.json" }]),
      ]),
      scratchSelection(),
      {
        "home.en-001.md": "# Scratch home\n\nScratch home body.\n",
        "notice.en-001.json": JSON.stringify(document),
      },
    );
    const loaded = await loadUnoCandidateSource({ repoRoot: root, pathname: "/en-001/notice" });
    const result = prepareUnoPageDeliveryCandidate({
      manifest: readJsonFrom(root, MANIFEST_SOURCE),
      selection: readJsonFrom(root, SELECTION_SOURCE),
      base: SITE_BASE,
      pathname: "/en-001/notice",
      loadedSource: loaded,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    // The contract materializes the default `public` visibility, so the accepted document is fully explicit and
    // byte-deterministic rather than depending on an absent key.
    expect(result.document.pageDocument).toEqual({ ...document, visibility: "public" });
    expect(result.document.pageDocumentRefusal).toBeUndefined();
    expect(Object.isFrozen(result.document.pageDocument)).toBe(true);
    expect(Object.isFrozen(result.document.pageDocument?.sections)).toBe(true);
    expect(Object.isFrozen(result.document.pageDocument?.sections[0]?.props)).toBe(true);
  });

  it("returns a fresh record that no caller reference can reach", async () => {
    const manifest = readJson(MANIFEST_SOURCE);
    const selection = committedSelection();
    const loaded = await committedLoad();
    const first = prepareUnoPageDeliveryCandidate({
      manifest,
      selection,
      base: LOOPBACK,
      pathname: "/en-001",
      loadedSource: loaded,
    });
    const second = prepareUnoPageDeliveryCandidate({
      manifest,
      selection,
      base: LOOPBACK,
      pathname: "/en-001",
      loadedSource: loaded,
    });
    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;

    expect(first).not.toBe(second);
    expect(first.identity).not.toBe(second.identity);
    expect(first.document).not.toBe(second.document);

    // A later edit of the caller's own manifest cannot reach an already accepted record.
    const editable = manifest as { entities: { facets: { sites: { locales: unknown }[] }[] }[] };
    editable.entities[0]!.facets[0]!.sites[0]!.locales = {
      supportedLocales: ["de-DE"],
      defaultLocale: "de-DE",
    };
    expect(first.identity.localeTag).toBe("en-001");
    expect(first.document.title).toBe("Foundation Uno");
  });

  it("accepts exactly the byte cap and refuses one byte beyond it", async () => {
    const base = { canonical: `https://${["a".repeat(60), "a".repeat(60), "a".repeat(60), "a".repeat(60)].join(".")}`, aliases: [] };
    expect(base.canonical.length).toBe(251);

    const fitting = "b".repeat(41);
    const fittingRoute = [fitting, fitting, fitting];
    const fittingPath = `/en-001/${fittingRoute.join("/")}`;
    expect(base.canonical.length + fittingPath.length).toBe(UNO_DELIVERY_CANONICAL_URL_MAX_BYTES);

    const fittingRoot = makeRepo(
      manifestWith([
        pageOf("home", ["home"], [{ kind: "markdown", path: HOME_SOURCE }]),
        pageOf("edge", fittingRoute, [{ kind: "markdown", path: "deployment/efs/content/edge.en-001.md" }]),
      ]),
      scratchSelection(),
      { "home.en-001.md": "# Scratch home\n\nScratch home body.\n", "edge.en-001.md": "# Edge\n\nOn the cap.\n" },
    );
    const fittingLoad = await loadUnoCandidateSource({ repoRoot: fittingRoot, pathname: fittingPath });
    const accepted = prepareUnoPageDeliveryCandidate({
      manifest: readJsonFrom(fittingRoot, MANIFEST_SOURCE),
      selection: readJsonFrom(fittingRoot, SELECTION_SOURCE),
      base,
      pathname: fittingPath,
      loadedSource: fittingLoad,
    });
    expect(accepted.accepted).toBe(true);
    if (!accepted.accepted) return;
    expect(accepted.ifServed.canonicalUrl.length).toBe(UNO_DELIVERY_CANONICAL_URL_MAX_BYTES);
    expect(accepted.ifServed.canonicalUrl).toBe(`${base.canonical}${fittingPath}`);

    const overflowing = "b".repeat(42);
    const overflowRoute = [overflowing, overflowing, overflowing];
    const overflowPath = `/en-001/${overflowRoute.join("/")}`;
    expect(base.canonical.length + overflowPath.length).toBeGreaterThan(UNO_DELIVERY_CANONICAL_URL_MAX_BYTES);
    const overflowRoot = makeRepo(
      manifestWith([
        pageOf("home", ["home"], [{ kind: "markdown", path: HOME_SOURCE }]),
        pageOf("edge", overflowRoute, [{ kind: "markdown", path: "deployment/efs/content/edge.en-001.md" }]),
      ]),
      scratchSelection(),
      { "home.en-001.md": "# Scratch home\n\nScratch home body.\n", "edge.en-001.md": "# Edge\n\nOver the cap.\n" },
    );
    const overflowLoad = await loadUnoCandidateSource({ repoRoot: overflowRoot, pathname: overflowPath });
    expect(overflowLoad.accepted).toBe(true);
    expectRefused(
      prepareUnoPageDeliveryCandidate({
        manifest: readJsonFrom(overflowRoot, MANIFEST_SOURCE),
        selection: readJsonFrom(overflowRoot, SELECTION_SOURCE),
        base,
        pathname: overflowPath,
        loadedSource: overflowLoad,
      }),
      "delivery:canonical-too-long",
    );
  });
});
