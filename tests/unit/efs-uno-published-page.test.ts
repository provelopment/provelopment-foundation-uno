import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadUnoCandidateSource } from "../../src/adapters/efs/uno-confined-source-reader";

import { planUnoPublicDiscovery } from "../../src/application/plan-uno-public-discovery";
import { resolveUnoCommittedBase } from "../../src/application/resolve-uno-committed-base";
import {
  listUnoServingAddresses,
  planUnoServingDiscovery,
  planUnoServingPage,
  renderUnoServingRobots,
  renderUnoServingSitemap,
} from "../../src/config/uno-serving";
import {
  UNO_PUBLICATION_INPUT_KEYS,
  UNO_PUBLICATION_REFUSAL_REASONS,
  planUnoPublishedPage,
  type UnoPublicationRefusal,
  type UnoPublishedPageResult,
} from "../../src/application/plan-uno-published-page";

/**
 * U03 published-Page planner tests (`UNO-WO-028 / R01`).
 *
 * Every positive decision is produced from a **real synthetic Uno fixture** on disk — the fixed committed
 * declaration paths, the confined loader and the accepted route matcher — so nothing here fabricates a loader
 * result. The committed deployment's own declaration also carries three published starter Pages, which the
 * final suite proves through the real serving adapter, discovery plan, robots and sitemap.
 */

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const BASE = { canonical: "http://localhost:3000", aliases: [] as string[] };
const fixtureRoot = join(process.cwd(), ".temp", "uno-wo028-published");

const PAGE = (id: string, publication: unknown, sources: unknown[]) => {
  const page: Record<string, unknown> = {
    id,
    route: id === "home" ? ["home"] : [id],
    representations: [{ locale: "en-001", sources }],
  };
  if (publication !== undefined) page["publication"] = publication;
  return page;
};

const MANIFEST = {
  entities: [
    {
      id: ENTITY_ID,
      facets: [
        {
          id: "foundation",
          sites: [
            {
              id: "main",
              locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
              pages: [
                PAGE("home", "published", [
                  { kind: "markdown", path: "deployment/efs/content/home.en-001.md" },
                ]),
                PAGE("about", "published", [
                  { kind: "markdown", path: "deployment/efs/content/about.en-001.md" },
                ]),
                PAGE("draft", undefined, [
                  { kind: "markdown", path: "deployment/efs/content/draft.en-001.md" },
                ]),
                PAGE("hidden", "published", [
                  { kind: "json", path: "deployment/efs/content/hidden.en-001.json" },
                ]),
                PAGE("broken", "published", [
                  { kind: "json", path: "deployment/efs/content/broken.en-001.json" },
                  { kind: "markdown", path: "deployment/efs/content/broken.en-001.md" },
                ]),
              ],
            },
          ],
        },
      ],
    },
  ],
};

const SELECTION = {
  version: 1,
  entityId: ENTITY_ID,
  selectedSite: { facetId: "foundation", siteId: "main" },
  languagePreferences: { en: "en-001" },
  base: BASE,
};

/** Write one fixture file, creating its directories. */
function writeFixture(relativePath: string, contents: string): void {
  const path = join(fixtureRoot, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

/** Load one fixture address through the real confined loader and plan it. */
async function plan(
  pathname: string,
  overrides: Record<string, unknown> = {},
): Promise<UnoPublishedPageResult> {
  const loaded = await loadUnoCandidateSource({ repoRoot: fixtureRoot, pathname });
  // A refused load is forwarded as the loader's own closed refusal, exactly as a real caller would.
  const loadedSource = loaded.accepted
    ? { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text }
    : { accepted: false, reason: loaded.reason };
  return planUnoPublishedPage({
    manifest: MANIFEST,
    selection: SELECTION,
    base: BASE,
    pathname,
    loadedSource,
    ...overrides,
  });
}

/** Assert one exact closed refusal. */
function expectRefused(result: UnoPublishedPageResult, code: UnoPublicationRefusal): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(UNO_PUBLICATION_REFUSAL_REASONS).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

beforeAll(() => {
  writeFixture("deployment/efs/manifest.json", JSON.stringify(MANIFEST));
  writeFixture("deployment/uno.config.json", JSON.stringify(SELECTION));
  writeFixture(
    "deployment/efs/content/home.en-001.md",
    "# Fixture home\n\nWelcome to the fixture home page.\n\n## What this proves\n\nA published Page renders.\n\n- one\n- two\n",
  );
  writeFixture(
    "deployment/efs/content/about.en-001.md",
    "# About the fixture\n\nThis is the fixture About page.\n",
  );
  writeFixture("deployment/efs/content/draft.en-001.md", "# Draft\n\nNot published.\n");
  writeFixture(
    "deployment/efs/content/hidden.en-001.json",
    JSON.stringify({ title: "Hidden fixture page", visibility: "unlisted" }),
  );
  writeFixture("deployment/efs/content/broken.en-001.json", '{ "broken": ');
  writeFixture("deployment/efs/content/broken.en-001.md", "# Broken\n\nMust never be reached.\n");
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("published fixture Pages", () => {
  it("plans the published Home with an exact canonical URL", async () => {
    const result = await plan("/en-001");
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity).toEqual({
      entityId: ENTITY_ID,
      facetId: "foundation",
      siteId: "main",
      pageId: "home",
      localeTag: "en-001",
      localePathKey: "en-001",
      routePath: "",
      pathname: "/en-001",
    });
    expect(result.document.kind).toBe("markdown");
    expect(result.document.title).toBe("Fixture home");
    expect(result.document.visibility).toBe("public");
    expect(result.document.markdownBody).toContain("A published Page renders.");
    expect(result.delivery.canonicalUrl).toBe("http://localhost:3000/en-001");
    expect(result.delivery.robots).toBeNull();
    expect(result.delivery.public).toBe(true);
    expect(result.delivery.unlisted).toBe(false);
    expect(result.delivery.indexable).toBe(true);
    expect(result.delivery.defaultLocale).toBe("en-001");
    expect(result.delivery.supportedLocales).toEqual(["en-001"]);
    expect(result.delivery.languagePreferences).toEqual({ en: "en-001" });
  });

  it("plans a non-Home published Markdown Page at its own address", async () => {
    const result = await plan("/en-001/about");
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity.pageId).toBe("about");
    expect(result.identity.routePath).toBe("about");
    expect(result.delivery.canonicalUrl).toBe("http://localhost:3000/en-001/about");
    expect(result.document.title).toBe("About the fixture");
    expect(result.document.description).toBeUndefined();
  });

  it("plans a published unlisted JSON Page for classification only", async () => {
    const result = await plan("/en-001/hidden");
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.document.kind).toBe("json");
    expect(result.document.visibility).toBe("unlisted");
    expect(result.delivery.unlisted).toBe(true);
    expect(result.delivery.public).toBe(false);
    expect(result.delivery.robots).toBe("noindex,nofollow");
    expect(result.delivery.indexable).toBe(false);
    expect(result.delivery.eligible.sitemap).toBe(false);
    expect(result.document.markdownBody).toBeUndefined();
  });

  it("feeds its own accepted decisions into the public discovery planner", async () => {
    const home = await plan("/en-001");
    const about = await plan("/en-001/about");
    const hidden = await plan("/en-001/hidden");
    expect(home.accepted && about.accepted && hidden.accepted).toBe(true);
    if (!home.accepted || !about.accepted || !hidden.accepted) return;

    const discovery = planUnoPublicDiscovery({
      decisions: [home, about, hidden],
      locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
    });
    expect(discovery.accepted).toBe(true);
    if (!discovery.accepted) return;

    // The unlisted Page contributes nothing: no entry, no alternate, no x-default.
    expect(discovery.sitemapUrls).toEqual([
      "http://localhost:3000/en-001",
      "http://localhost:3000/en-001/about",
    ]);
    expect(JSON.stringify(discovery).includes("/hidden")).toBe(false);
    const homeEntry = discovery.entries[0];
    expect(homeEntry?.pageId).toBe("home");
    expect(homeEntry?.xDefault).toBe("http://localhost:3000/en-001");
    expect(homeEntry?.alternates).toEqual([]);
  });

  it("returns a fresh, deeply frozen plan without mutating the caller", async () => {
    const manifestSnapshot = JSON.stringify(MANIFEST);
    const first = await plan("/en-001");
    const second = await plan("/en-001");
    expect(first.accepted && second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;

    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.identity)).toBe(true);
    expect(Object.isFrozen(first.document)).toBe(true);
    expect(Object.isFrozen(first.delivery)).toBe(true);
    expect(Object.isFrozen(first.delivery.eligible)).toBe(true);
    expect(Object.isFrozen(first.delivery.supportedLocales)).toBe(true);
    expect(JSON.stringify(MANIFEST)).toBe(manifestSnapshot);
  });
});


describe("the publication gate", () => {
  it("refuses a Page that declares no publication, even when everything else accepts", async () => {
    expectRefused(await plan("/en-001/draft"), "publication:not-published");
  });

  it("refuses a Page that declares draft", async () => {
    const manifest = JSON.parse(JSON.stringify(MANIFEST)) as Record<string, unknown>;
    const entity = (manifest["entities"] as Record<string, unknown>[])[0] as Record<string, unknown>;
    const facet = (entity["facets"] as Record<string, unknown>[])[0] as Record<string, unknown>;
    const site = (facet["sites"] as Record<string, unknown>[])[0] as Record<string, unknown>;
    for (const page of site["pages"] as Record<string, unknown>[]) {
      if (page["id"] === "draft") page["publication"] = "draft";
    }

    expectRefused(await plan("/en-001/draft", { manifest }), "publication:not-published");
  });

  it("refuses an invalid publication spelling as a manifest refusal", async () => {
    for (const invalid of ["Published", "public", true, "publish"]) {
      const manifest = JSON.parse(JSON.stringify(MANIFEST)) as Record<string, unknown>;
      const entity = (manifest["entities"] as Record<string, unknown>[])[0] as Record<string, unknown>;
      const facet = (entity["facets"] as Record<string, unknown>[])[0] as Record<string, unknown>;
      const site = (facet["sites"] as Record<string, unknown>[])[0] as Record<string, unknown>;
      const home = (site["pages"] as Record<string, unknown>[])[0] as Record<string, unknown>;
      home["publication"] = invalid;
      expectRefused(await plan("/en-001", { manifest }), "publication:manifest-invalid");
    }
  });

  it("refuses a missing or invalid proposed base before any Page is considered", async () => {
    expectRefused(
      await plan("/en-001", { base: { canonical: "", aliases: [] } }),
      "publication:base-invalid",
    );
    expectRefused(
      await plan("/en-001", { base: { canonical: "ftp://localhost:3000", aliases: [] } }),
      "publication:base-invalid",
    );
  });

  it("refuses unknown, wrong-locale and non-Home addresses", async () => {
    expectRefused(await plan("/en-001/nope"), "publication:route-invalid");
    expectRefused(await plan("/de-001"), "publication:route-invalid");
    expectRefused(await plan("/en"), "publication:route-invalid");
    expectRefused(await plan("/en-001/hidden/extra"), "publication:route-invalid");
  });

  it("refuses an invalid JSON declaration without falling back to the declared Markdown", async () => {
    expectRefused(await plan("/en-001/broken"), "publication:source-refused");
  });

  it("refuses a forged loader record that does not describe the matched candidate", async () => {
    const loaded = await loadUnoCandidateSource({ repoRoot: fixtureRoot, pathname: "/en-001/about" });
    if (!loaded.accepted) throw new Error("fixture loader refused");

    for (const forged of [
      { accepted: true, candidate: { ...loaded.candidate, pageId: "home" }, kind: "markdown", text: "x" },
      { accepted: false, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
      { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text, extra: 1 },
      { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text, sources: [] },
    ]) {
      expectRefused(await plan("/en-001/about", { loadedSource: forged }), "publication:source-refused");
    }

    // A forged *kind* is caught by the header projector, the authority on a body, and still refuses the plan.
    // The body *text* itself is the confined loader's trust boundary: the serving adapter always forwards the
    // loader's own result, and the adapter's own suite proves it reads only the declared path.
    expectRefused(
      await plan("/en-001/about", {
        loadedSource: { accepted: true, candidate: loaded.candidate, kind: "json", text: loaded.text },
      }),
      "publication:header-invalid",
    );
  });
});


describe("the committed starter serves its three declared Pages", () => {
  it("serves Home, About and Components with the reserved canonical addresses", async () => {
    const expected = [
      { pathname: "/en-001", pageId: "home", kind: "json", canonical: "https://uno-starter.example/en-001" },
      { pathname: "/en-001/about", pageId: "about", kind: "markdown", canonical: "https://uno-starter.example/en-001/about" },
      {
        pathname: "/en-001/components",
        pageId: "components",
        kind: "json",
        canonical: "https://uno-starter.example/en-001/components",
      },
    ] as const;

    for (const entry of expected) {
      const page = await planUnoServingPage(entry.pathname);
      expect(page.status, entry.pathname).toBe("served");
      if (page.status !== "served") continue;
      expect(page.page.identity.pageId).toBe(entry.pageId);
      expect(page.page.identity.localeTag).toBe("en-001");
      expect(page.page.document.kind).toBe(entry.kind);
      expect(page.page.document.visibility).toBe("public");
      expect(page.page.delivery.canonicalUrl).toBe(entry.canonical);
      expect(page.page.delivery.public).toBe(true);
      expect(page.page.delivery.indexable).toBe(true);
      expect(page.page.delivery.robots).toBeNull();
      if (entry.kind === "json") expect(page.page.document.pageDocument).toBeDefined();
      else expect(typeof page.page.document.markdownBody).toBe("string");
    }
  });

  it("lists exactly the committed address shapes", async () => {
    const addresses = await listUnoServingAddresses();
    expect(addresses.map((address) => [address.locale, address.segments.join("/")])).toEqual([
      ["en", ""],
      ["en-001", ""],
      ["en-001", "about"],
      ["en-001", "components"],
    ]);
  });

  it("plans public discovery, robots and sitemap from the same authority", async () => {
    const discovery = await planUnoServingDiscovery();
    expect(discovery.status).toBe("planned");
    if (discovery.status !== "planned") return;
    expect(discovery.plan.site).toEqual({ entityId: ENTITY_ID, facetId: "foundation", siteId: "main" });
    expect(discovery.plan.defaultLocale).toBe("en-001");
    expect(discovery.plan.entries.map((entry) => entry.canonicalUrl)).toEqual([
      "https://uno-starter.example/en-001",
      "https://uno-starter.example/en-001/about",
      "https://uno-starter.example/en-001/components",
    ]);
    for (const entry of discovery.plan.entries) {
      expect(entry.localeTag).toBe("en-001");
      expect(entry.alternates).toEqual([]);
    }
    // The single authored locale makes the default entry its own x-default; the child Pages carry none.
    expect(discovery.plan.entries[0]!.xDefault).toBe("https://uno-starter.example/en-001");
    expect(discovery.plan.entries[1]!.xDefault).toBeUndefined();
    expect(discovery.plan.entries[2]!.xDefault).toBeUndefined();
    expect(discovery.plan.sitemapUrls).toEqual([
      "https://uno-starter.example/en-001",
      "https://uno-starter.example/en-001/about",
      "https://uno-starter.example/en-001/components",
    ]);

    const robots = await renderUnoServingRobots();
    expect(robots).toContain("Sitemap: https://uno-starter.example/sitemap.xml");

    const sitemap = await renderUnoServingSitemap();
    expect(sitemap).not.toBeNull();
    expect((sitemap as string).match(/<loc>/gu)?.length).toBe(3);
  });

  it("refuses every address outside the declared set", async () => {
    for (const pathname of [
      "/en-001/nope",
      "/en-001/home",
      "/en-001/about/extra",
      "/en-001/components/extra",
      "/de-001",
      "/en-001/draft",
    ]) {
      const page = await planUnoServingPage(pathname);
      expect(page.status, pathname).toBe("not-served");
    }
  });

  it("refuses an input that is not an absolute address", async () => {
    for (const pathname of ["", "en-001", "/en-001?x=1", "/en-001#x", "/en-001/a%20b", 7, null]) {
      const outcome = await planUnoServingPage(pathname);
      expect(outcome.status).toBe("not-served");
      if (outcome.status === "not-served") expect(outcome.reason).toBe("serving:input-invalid");
    }
  });

  it("still refuses everything on a base-free or unpublished synthetic declaration", async () => {
    // A separate synthetic fixture: removing every publication declaration refuses each Page on its own authority.
    const unpublished = JSON.parse(JSON.stringify(MANIFEST)) as Record<string, unknown>;
    const entity = (unpublished["entities"] as Record<string, unknown>[])[0] as Record<string, unknown>;
    const facet = (entity["facets"] as Record<string, unknown>[])[0] as Record<string, unknown>;
    const site = (facet["sites"] as Record<string, unknown>[])[0] as Record<string, unknown>;
    for (const page of site["pages"] as Record<string, unknown>[]) delete page["publication"];

    expectRefused(await plan("/en-001", { manifest: unpublished }), "publication:not-published");
    expectRefused(await plan("/en-001/about", { manifest: unpublished }), "publication:not-published");

    // A base-free selection is refused by the committed-base reader rather than defaulted to a domain.
    const baseFree = { ...SELECTION } as Record<string, unknown>;
    delete baseFree["base"];
    const stored = resolveUnoCommittedBase({ manifest: MANIFEST, selection: baseFree });
    expect(stored.accepted).toBe(false);
    if (!stored.accepted) expect(stored.reason).toBe("committed-base:missing");
  });
});

describe("hostile input and vocabulary", () => {
  it("refuses a hostile request without invoking a getter", async () => {
    let reads = 0;
    const hostile = {
      manifest: MANIFEST,
      selection: SELECTION,
      base: BASE,
      pathname: "/en-001",
      get loadedSource(): unknown {
        reads += 1;
        return { accepted: true };
      },
    };
    expectRefused(planUnoPublishedPage(hostile), "publication:input-invalid");
    expect(reads).toBe(0);

    const withSymbol = {
      manifest: MANIFEST,
      selection: SELECTION,
      base: BASE,
      pathname: "/en-001",
    } as Record<PropertyKey, unknown>;
    withSymbol[Symbol("extra")] = true;
    expectRefused(planUnoPublishedPage(withSymbol), "publication:input-invalid");

    const throwingProxy = new Proxy(
      {},
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    expectRefused(planUnoPublishedPage(throwingProxy), "publication:unreadable");
  });

  it("refuses every wrong request shape", async () => {
    for (const value of [null, [], "path", 0, true]) {
      expectRefused(planUnoPublishedPage(value), "publication:input-invalid");
    }
    expectRefused(
      planUnoPublishedPage({ manifest: MANIFEST, selection: SELECTION, base: BASE, pathname: "/en-001" }),
      "publication:input-invalid",
    );
    expectRefused(
      planUnoPublishedPage({
        manifest: MANIFEST,
        selection: SELECTION,
        base: BASE,
        pathname: "/en-001",
        loadedSource: {},
        extra: 1,
      }),
      "publication:input-invalid",
    );
    expectRefused(
      planUnoPublishedPage({
        manifest: MANIFEST,
        selection: SELECTION,
        base: BASE,
        pathname: 7,
        loadedSource: {},
      }),
      "publication:input-invalid",
    );
  });

  it("keeps one frozen, complete vocabulary and echoes nothing when refusing", async () => {
    expect(UNO_PUBLICATION_INPUT_KEYS).toEqual([
      "manifest",
      "selection",
      "base",
      "pathname",
      "loadedSource",
    ]);
    expect(Object.isFrozen(UNO_PUBLICATION_INPUT_KEYS)).toBe(true);
    expect(Object.isFrozen(UNO_PUBLICATION_REFUSAL_REASONS)).toBe(true);
    expect(new Set(UNO_PUBLICATION_REFUSAL_REASONS).size).toBe(
      UNO_PUBLICATION_REFUSAL_REASONS.length,
    );

    const refused = await plan("/en-001/secret-path");
    expectRefused(refused, "publication:route-invalid");
    expect(JSON.stringify(refused)).toBe('{"accepted":false,"reason":"publication:route-invalid"}');
    expect(JSON.stringify(refused).includes("secret-path")).toBe(false);
  });
});

/**
 * Qualified, multi-Site publication (`UNO-WO-090 / R01`, P3).
 *
 * Every decision below is produced from a real on-disk fixture through the real confined loader in its host-qualified
 * mode, so a Host is only ever compared against the three configured bindings. The fixtures deliberately give two
 * different Facets a Site with the id `main`, give two Sites the same Host with disjoint whole-segment prefixes, and
 * give those Sites disjoint locale sets, so an accidental `sites[0]`, `defaultSite` or global selection cannot pass.
 */
const MULTI_ROOT = join(process.cwd(), ".temp", "uno-wo090-multisite");

const MULTI_PAGE = (id: string, locale: string, file: string) => ({
  id,
  route: id === "home" ? ["home"] : [id],
  publication: "published",
  representations: [{ locale, sources: [{ kind: "markdown", path: `deployment/efs/content/${file}` }] }],
});

const MULTI_MANIFEST = {
  entities: [
    {
      id: ENTITY_ID,
      facets: [
        {
          id: "corporate",
          sites: [
            {
              id: "main",
              locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
              pages: [MULTI_PAGE("home", "en-001", "corp-main-home.en-001.md")],
            },
            {
              id: "docs",
              locales: { supportedLocales: ["de-DE"], defaultLocale: "de-DE" },
              pages: [MULTI_PAGE("home", "de-DE", "corp-docs-home.de-DE.md")],
            },
          ],
        },
        {
          id: "services",
          sites: [
            {
              id: "main",
              locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
              pages: [MULTI_PAGE("home", "en-001", "svc-main-home.en-001.md")],
            },
          ],
        },
      ],
    },
  ],
};

const MULTI_CONFIG = {
  version: 2,
  entityId: ENTITY_ID,
  sites: [
    { facetId: "corporate", siteId: "main", origin: "https://abc.example" },
    { facetId: "corporate", siteId: "docs", origin: "https://abc.example", pathPrefix: "/docs/" },
    { facetId: "services", siteId: "main", origin: "https://xyz.example" },
  ],
  // The default names a Site that owns neither of the first two addresses, so no fallback can rescue a failed match.
  default: { facetId: "services", siteId: "main" },
};

const CORP_MAIN = Object.freeze({ facetId: "corporate", siteId: "main" });
const CORP_DOCS = Object.freeze({ facetId: "corporate", siteId: "docs" });
const SVC_MAIN = Object.freeze({ facetId: "services", siteId: "main" });

/** Load one host-qualified address through the real confined loader and plan it for one named Site. */
async function planQualified(
  host: string,
  pathname: string,
  site: unknown,
): Promise<UnoPublishedPageResult> {
  const loaded = await loadUnoCandidateSource({ repoRoot: MULTI_ROOT, host, pathname });
  const loadedSource = loaded.accepted
    ? { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text }
    : { accepted: false, reason: loaded.reason };
  return planUnoPublishedPage({
    manifest: MULTI_MANIFEST,
    selection: MULTI_CONFIG,
    site,
    host,
    pathname,
    loadedSource,
  });
}

describe("qualified multi-Site publication", () => {
  beforeAll(() => {
    mkdirSync(join(MULTI_ROOT, "deployment", "efs", "content"), { recursive: true });
    writeFileSync(join(MULTI_ROOT, "deployment", "efs", "manifest.json"), JSON.stringify(MULTI_MANIFEST));
    writeFileSync(join(MULTI_ROOT, "deployment", "uno.config.json"), JSON.stringify(MULTI_CONFIG));
    writeFileSync(
      join(MULTI_ROOT, "deployment", "efs", "content", "corp-main-home.en-001.md"),
      "# Corporate home\n\nThe corporate root Site body.\n",
    );
    writeFileSync(
      join(MULTI_ROOT, "deployment", "efs", "content", "corp-docs-home.de-DE.md"),
      "# Docs home\n\nThe documentation Site body.\n",
    );
    writeFileSync(
      join(MULTI_ROOT, "deployment", "efs", "content", "svc-main-home.en-001.md"),
      "# Services home\n\nThe services Site body.\n",
    );
  });

  afterAll(() => {
    rmSync(MULTI_ROOT, { recursive: true, force: true });
  });

  it("serves the root Site at its own configured Host and canonical origin", async () => {
    const result = await planQualified("abc.example", "/en-001", CORP_MAIN);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity.facetId).toBe("corporate");
    expect(result.identity.siteId).toBe("main");
    expect(result.document.title).toBe("Corporate home");
    expect(result.delivery.canonicalUrl).toBe("https://abc.example/en-001");
    expect(result.delivery.supportedLocales).toEqual(["en-001"]);
  });

  it("serves a prefixed Site only below its own whole-segment prefix", async () => {
    const result = await planQualified("abc.example", "/docs/de-de", CORP_DOCS);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity.facetId).toBe("corporate");
    expect(result.identity.siteId).toBe("docs");
    expect(result.identity.localeTag).toBe("de-DE");
    expect(result.identity.pathname).toBe("/de-de");
    expect(result.document.title).toBe("Docs home");
    expect(result.delivery.canonicalUrl).toBe("https://abc.example/docs/de-de");
    expect(result.delivery.defaultLocale).toBe("de-DE");
  });

  it("keeps two Sites named main in different Facets distinct by Host", async () => {
    const result = await planQualified("xyz.example", "/en-001", SVC_MAIN);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;

    expect(result.identity.facetId).toBe("services");
    expect(result.identity.siteId).toBe("main");
    expect(result.document.title).toBe("Services home");
    expect(result.delivery.canonicalUrl).toBe("https://xyz.example/en-001");
  });

  it("refuses to let the root Site answer a prefixed Site's address", async () => {
    expectRefused(await planQualified("abc.example", "/docs/de-de", CORP_MAIN), "publication:route-invalid");
  });

  it("refuses a Host that is not a configured binding", async () => {
    expectRefused(
      await planQualified("abc.example.evil.test", "/en-001", CORP_MAIN),
      "publication:route-invalid",
    );
    expectRefused(await planQualified("localhost", "/en-001", CORP_MAIN), "publication:route-invalid");
  });

  it("refuses a prefix match that is not a whole segment", async () => {
    expectRefused(await planQualified("abc.example", "/docsx/de-de", CORP_DOCS), "publication:route-invalid");
  });

  it("refuses a locale the named Site does not author", async () => {
    expectRefused(await planQualified("abc.example", "/en-001", CORP_DOCS), "publication:route-invalid");
    expectRefused(await planQualified("abc.example", "/de-de", CORP_MAIN), "publication:route-invalid");
  });

  it("refuses a Site pair that the declaration does not bind", async () => {
    expectRefused(
      await planQualified("abc.example", "/en-001", { facetId: "corporate", siteId: "missing" }),
      "publication:committed-locales-invalid",
    );
  });

  it("refuses a selector that carries more than facetId and siteId", async () => {
    expectRefused(
      await planQualified("abc.example", "/en-001", {
        facetId: "corporate",
        siteId: "main",
        host: "abc.example",
      }),
      "publication:committed-locales-invalid",
    );
  });
});
