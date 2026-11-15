import { describe, expect, it } from "vitest";

import { CONTENT_SLUG_PATTERN, HOME_CONTENT_SLUG, isContentSlug } from "../../src/core/page-content";
import {
  PAGE_ROUTE_PATH_MAX_LENGTH,
  PAGE_ROUTE_PATH_MAX_SEGMENTS,
  isPageRoutePath,
  pageRouteChildDirectories,
  pageRouteLeaf,
  pageRoutePath,
  pageRoutePathFromFile,
  pageRoutePathSegments,
} from "../../src/core/page-route-path";

/**
 * Regression tests for the adapted Uno relative route-path contract.
 *
 * ADAPTED from pinned GEO-03 `tests/unit/page-route-path.test.ts`
 * (blob `9edb01de6a42d5d989c82113e207dff6e8af91f9`) as EVIDENCE of the intended behaviour.
 * No fixture is copied; every case below is written for Uno's address shape, which has no
 * Site code, no country segment and no `/ww` prefix.
 *
 * These cases prove the internal authoring limits only. They do not settle public Page
 * routing policy, and a valid route path does not publish anything.
 */

const LONG_160 = "a".repeat(160);
const LONG_161 = "a".repeat(161);

describe("content slug rule", () => {
  it("pins the conservative grammar and the reserved home slug", () => {
    expect(CONTENT_SLUG_PATTERN.source).toBe("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    expect(HOME_CONTENT_SLUG).toBe("home");
  });

  it("accepts lowercase hyphen-separated words", () => {
    for (const value of ["a", "about", "website-design", "2024-report", "a1-b2"]) {
      expect(isContentSlug(value)).toBe(true);
    }
  });

  it("refuses anything that is not a slug", () => {
    for (const value of [
      "",
      "About",
      "ABOUT",
      "about us",
      "about_us",
      "-about",
      "about-",
      "a--b",
      "%2e%2e",
      "../about",
      "about.md",
      ".gitkeep",
      "about/page",
    ]) {
      expect(isContentSlug(value)).toBe(false);
    }
  });

  it("accepts a plain lowercase word such as readme, and refuses its uppercase form", () => {
    // The rule is lexical: lowercase `readme` IS a valid slug. Only `README` is refused,
    // which is what keeps a conventional documentation file non-routable.
    expect(isContentSlug("readme")).toBe(true);
    expect(isContentSlug("README")).toBe(false);
  });

  it("refuses non-strings without coercion or throwing", () => {
    const coercible = { toString: () => "about" };
    for (const value of [null, undefined, 42, 0, true, [], ["about"], coercible]) {
      expect(isContentSlug(value)).toBe(false);
    }
  });
});

describe("page route path — accepted shapes", () => {
  it("accepts one to four slug segments", () => {
    expect(pageRoutePathSegments("about")).toEqual(["about"]);
    expect(pageRoutePathSegments("offerings/website-design")).toEqual([
      "offerings",
      "website-design",
    ]);
    expect(pageRoutePathSegments("a/b/c/d")).toEqual(["a", "b", "c", "d"]);
    expect(isPageRoutePath("offerings/website-design")).toBe(true);
  });

  it("builds canonical paths through the only constructor", () => {
    expect(pageRoutePath("about")).toBe("about");
    expect(pageRoutePath("offerings", "website-design")).toBe("offerings/website-design");
    expect(pageRoutePath("a", "b", "c", "d")).toBe("a/b/c/d");
  });

  it("returns the leaf, or an empty string for a bad route", () => {
    expect(pageRouteLeaf("offerings/website-design")).toBe("website-design");
    expect(pageRouteLeaf("about")).toBe("about");
    expect(pageRouteLeaf("About")).toBe("");
    expect(pageRouteLeaf("")).toBe("");
  });

  it("declares the documented caps", () => {
    expect(PAGE_ROUTE_PATH_MAX_SEGMENTS).toBe(4);
    expect(PAGE_ROUTE_PATH_MAX_LENGTH).toBe(160);
    expect(isPageRoutePath(LONG_160)).toBe(true);
  });
});

describe("page route path — refusals", () => {
  it("refuses more than four levels and more than 160 characters", () => {
    expect(pageRoutePathSegments("a/b/c/d/e")).toEqual([]);
    expect(isPageRoutePath("a/b/c/d/e")).toBe(false);
    expect(pageRoutePathSegments(LONG_161)).toEqual([]);
    expect(isPageRoutePath(LONG_161)).toBe(false);
  });

  it("refuses a separator smuggled through one constructor argument", () => {
    expect(pageRoutePath("offers/website-design")).toBeNull();
    expect(pageRoutePath("")).toBeNull();
    expect(pageRoutePath()).toBeNull();
    expect(pageRoutePath("a", "", "b")).toBeNull();
    expect(pageRoutePath("a", "b", "c", "d", "e")).toBeNull();
  });

  it("refuses leading, trailing and doubled separators", () => {
    for (const value of ["/about", "about/", "/about/", "a//b", "a/b/"]) {
      expect(pageRoutePathSegments(value)).toEqual([]);
    }
  });

  it("refuses traversal, encoded traversal, case, spaces and backslashes", () => {
    for (const value of [
      "..",
      "../about",
      "a/../b",
      "a/..",
      "%2e%2e",
      "a/%2e%2e",
      "About",
      "a/B",
      "about us",
      "a\\b",
      "a\\..\\b",
      ".",
      "./about",
    ]) {
      expect(isPageRoutePath(value)).toBe(false);
    }
  });

  it("refuses non-string and untrusted values without throwing", () => {
    const coercible = { toString: () => "about" };
    expect(pageRoutePathSegments(42 as unknown as string)).toEqual([]);
    expect(pageRoutePathSegments(null as unknown as string)).toEqual([]);
    expect(pageRoutePathSegments(coercible as unknown as string)).toEqual([]);
    expect(isPageRoutePath(undefined as unknown as string)).toBe(false);
    expect(pageRoutePath(42 as unknown as string)).toBeNull();
    expect(pageRouteChildDirectories("", "nope" as unknown as never)).toEqual([]);
  });
});

describe("page route path from a file", () => {
  it("maps a valid page file at the locale root", () => {
    expect(pageRoutePathFromFile("", "about.md", "md")).toBe("about");
    expect(pageRoutePathFromFile("", "website-design.json", "json")).toBe("website-design");
  });

  it("maps a valid page file inside folders", () => {
    expect(pageRoutePathFromFile("offerings", "website-design.md", "md")).toBe(
      "offerings/website-design",
    );
    expect(pageRoutePathFromFile("a/b/c", "d.md", "md")).toBe("a/b/c/d");
  });

  it("keeps documentation and placeholders inert", () => {
    // `README.md` and `.gitkeep` are inert; a lowercase `readme.md` is, by the lexical rule,
    // a routable page name — asserted explicitly rather than implied.
    for (const name of ["README.md", ".gitkeep", "notes.txt", "About.md", "a b.md"]) {
      expect(pageRoutePathFromFile("", name, "md")).toBeNull();
    }
    expect(pageRoutePathFromFile("", "readme.md", "md")).toBe("readme");
  });

  it("refuses a wrong extension and an unroutable directory", () => {
    expect(pageRoutePathFromFile("", "about.md", "json")).toBeNull();
    expect(pageRoutePathFromFile("", "about.json", "md")).toBeNull();
    expect(pageRoutePathFromFile("", "about", "md")).toBeNull();
    expect(pageRoutePathFromFile("Offerings", "about.md", "md")).toBeNull();
    expect(pageRoutePathFromFile("a/b/c/d", "e.md", "md")).toBeNull();
  });

  it("refuses non-string arguments without throwing", () => {
    expect(pageRoutePathFromFile(null as unknown as string, "about.md", "md")).toBeNull();
    expect(pageRoutePathFromFile("", null as unknown as string, "md")).toBeNull();
    expect(pageRoutePathFromFile("", "about.md", "" as string)).toBeNull();
  });
});

describe("child directories of an authoring folder", () => {
  it("keeps only well-formed, in-limit directories", () => {
    const entries = [
      { name: "offers", directory: true },
      { name: "blog", directory: true },
      { name: "README.md", directory: false },
      { name: "Notes", directory: true },
      { name: ".gitkeep", directory: true },
    ];
    expect(pageRouteChildDirectories("", entries)).toEqual(["blog", "offers"]);
  });

  it("returns sorted unique paths and refuses to go too deep", () => {
    const entries = [
      { name: "b", directory: true },
      { name: "a", directory: true },
      { name: "a", directory: true },
    ];
    expect(pageRouteChildDirectories("", entries)).toEqual(["a", "b"]);
    expect(pageRouteChildDirectories("x", entries)).toEqual(["x/a", "x/b"]);

    const deep = [{ name: "e", directory: true }];
    expect(pageRouteChildDirectories("a/b/c/d", deep)).toEqual([]);
  });

  it("publishes nothing for an unusable listing", () => {
    expect(pageRouteChildDirectories("", [])).toEqual([]);
    expect(pageRouteChildDirectories("", [{ name: "sp ace", directory: true }])).toEqual([]);
  });
});
