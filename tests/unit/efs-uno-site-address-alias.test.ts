import { describe, expect, it } from "vitest";

import {
  matchUnoServingAliasAddress,
  type UnoServingAliasTarget,
} from "../../src/config/uno-serving";
import type { UnoSiteAddressBinding } from "../../src/core/efs/uno-config";

/**
 * Declared Site-address alias translation (`UNO-WO-098 / R01`).
 *
 * The contract under test is deliberately tiny and total: a request authority plus a path is translated — or it is not.
 * No file, no environment, no request header and no clock participates, so these cases are the whole lexical truth of the
 * alias layer. Ownership, publication and rendering are proven separately by the production runner.
 *
 * Every case here is mutation-sensitive: removing the alias branch, loosening the whole-segment rule, deriving the
 * destination authority from the request, or resolving ambiguity by position turns at least one case red.
 */

/** The published declaration's own binding shape: one shared host, a root Site and a nested-prefix Site with one alias. */
const MAIN: UnoSiteAddressBinding = {
  facetId: "corporate",
  siteId: "main",
  origin: "https://abc.example",
  pathPrefix: "",
  aliases: [],
};
const DOCS: UnoSiteAddressBinding = {
  facetId: "corporate",
  siteId: "docs",
  origin: "https://abc.example",
  pathPrefix: "/docs",
  aliases: ["https://abc.example/docs-old"],
};
const SERVICES: UnoSiteAddressBinding = {
  facetId: "services",
  siteId: "main",
  origin: "https://xyz.example",
  pathPrefix: "",
  aliases: [],
};
const BINDINGS: readonly UnoSiteAddressBinding[] = [MAIN, DOCS, SERVICES];

/** One matched target, asserted whole so no field can drift unnoticed. */
function expectTarget(result: ReturnType<typeof matchUnoServingAliasAddress>): UnoServingAliasTarget {
  expect(result.status).toBe("match");
  if (result.status !== "match") throw new Error("unreachable");
  return result.match;
}

describe("declared Site-address aliases", () => {
  it("translates the declared shared-host alias onto its own Site's canonical address", () => {
    expect(expectTarget(matchUnoServingAliasAddress(BINDINGS, "abc.example", "/docs-old/de-de"))).toEqual({
      facetId: "corporate",
      siteId: "docs",
      host: "abc.example",
      pathname: "/docs/de-de",
      canonicalUrl: "https://abc.example/docs/de-de",
    });
  });

  it("carries an authored nested suffix across unchanged", () => {
    expect(expectTarget(matchUnoServingAliasAddress(BINDINGS, "abc.example", "/docs-old/de-de/notes")).pathname).toBe(
      "/docs/de-de/notes",
    );
  });

  it("matches only whole segments, so the lookalike prefix owns nothing", () => {
    expect(matchUnoServingAliasAddress(BINDINGS, "abc.example", "/docs-older/de-de").status).toBe("none");
    expect(matchUnoServingAliasAddress(BINDINGS, "abc.example", "/docs-oldish").status).toBe("none");
  });

  it("never synthesises a locale for an alias root", () => {
    expect(matchUnoServingAliasAddress(BINDINGS, "abc.example", "/docs-old").status).toBe("none");
  });

  it("matches nothing on an authority the declaration does not bind", () => {
    expect(matchUnoServingAliasAddress(BINDINGS, "xyz.example", "/docs-old/de-de").status).toBe("none");
    expect(matchUnoServingAliasAddress(BINDINGS, "unknown.example", "/docs-old/de-de").status).toBe("none");
    expect(matchUnoServingAliasAddress(BINDINGS, "abc.example:8443", "/docs-old/de-de").status).toBe("none");
    expect(matchUnoServingAliasAddress(BINDINGS, "ABC.EXAMPLE", "/docs-old/de-de").status).toBe("match");
  });

  it("takes the destination authority from the stored origin, not from the request", () => {
    const other: readonly UnoSiteAddressBinding[] = [
      {
        facetId: "corporate",
        siteId: "docs",
        origin: "https://abc.example",
        pathPrefix: "/docs",
        aliases: ["https://alt.example/handbook"],
      },
    ];
    const target = expectTarget(matchUnoServingAliasAddress(other, "alt.example", "/handbook/en-001"));
    expect(target.host).toBe("abc.example");
    expect(target.canonicalUrl).toBe("https://abc.example/docs/en-001");
  });

  it("refuses to choose when two declared aliases claim one request", () => {
    const twin: UnoSiteAddressBinding = {
      facetId: "corporate",
      siteId: "docs",
      origin: "https://abc.example",
      pathPrefix: "/documentation",
      aliases: ["https://abc.example/docs-old"],
    };
    const doubled: readonly UnoSiteAddressBinding[] = [MAIN, DOCS, SERVICES, twin];
    expect(matchUnoServingAliasAddress(doubled, "abc.example", "/docs-old/de-de").status).toBe("ambiguous");
    expect(matchUnoServingAliasAddress([twin, SERVICES, DOCS, MAIN], "abc.example", "/docs-old/de-de").status).toBe(
      "ambiguous",
    );
  });

  it("is declaration-order independent", () => {
    const reversed: readonly UnoSiteAddressBinding[] = [SERVICES, DOCS, MAIN];
    expect(expectTarget(matchUnoServingAliasAddress(reversed, "abc.example", "/docs-old/de-de"))).toEqual(
      expectTarget(matchUnoServingAliasAddress(BINDINGS, "abc.example", "/docs-old/de-de")),
    );
  });

  it("claims nothing for malformed, encoded, query-bearing or oversized input", () => {
    for (const pathname of [
      "/docs-old/%2e%2e/en-001",
      "/docs-old/de-de?x=1",
      "/docs-old/../docs/de-de",
      "/docs-old//de-de",
      "/Docs-old/de-de",
      `/${"a".repeat(250)}`,
      "",
      "docs-old/de-de",
    ]) {
      expect(matchUnoServingAliasAddress(BINDINGS, "abc.example", pathname).status).toBe("none");
    }
    for (const host of ["", " abc.example", "abc.example.", "abc..example", "user@abc.example", "abc.example/x"]) {
      expect(matchUnoServingAliasAddress(BINDINGS, host, "/docs-old/de-de").status).toBe("none");
    }
  });

  it("claims nothing at all when no binding declares an alias", () => {
    expect(matchUnoServingAliasAddress([MAIN, SERVICES], "abc.example", "/docs-old/de-de").status).toBe("none");
    expect(matchUnoServingAliasAddress([], "abc.example", "/docs-old/de-de").status).toBe("none");
  });
});
