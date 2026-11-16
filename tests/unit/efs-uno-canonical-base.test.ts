import { describe, expect, it } from "vitest";

import {
  UNO_CANONICAL_BASE_INPUT_KEYS,
  UNO_CANONICAL_BASE_LIMITS,
  UNO_CANONICAL_BASE_REFUSAL_CODES,
  validateUnoCanonicalBase,
  type UnoCanonicalBaseRefusalCode,
  type UnoCanonicalBaseResult,
} from "../../src/core/efs/uno-canonical-base";

/**
 * U03 canonical-base and alias validation (`UNO-WO-023 / R01`).
 *
 * Every hostname below is synthetic test data. Validating a base is not choosing a production domain,
 * publishing a Page, serving a route or issuing a redirect, and no case here proves any real HTTP behaviour.
 */

const CODES = UNO_CANONICAL_BASE_REFUSAL_CODES;
const LONG_LABEL = "a".repeat(63);
/** Exactly 255 ASCII bytes: the accepted upper bound. */
const URL_255 = `https://${LONG_LABEL}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(55)}`;
/** One byte more than the contract allows. */
const URL_256 = `https://${LONG_LABEL}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(56)}`;

function expectAccepted(result: UnoCanonicalBaseResult): asserts result is Extract<UnoCanonicalBaseResult, { accepted: true }> {
  expect(result.accepted).toBe(true);
}

function expectRefused(result: UnoCanonicalBaseResult, code: UnoCanonicalBaseRefusalCode): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(code);
  expect(CODES).toContain(result.reason);
  expect(Object.keys(result).sort()).toEqual(["accepted", "reason"]);
}

function refusalFor(canonical: unknown, aliases: unknown = []): UnoCanonicalBaseResult {
  return validateUnoCanonicalBase({ canonical, aliases });
}

describe("accepted bases", () => {
  it("accepts a bare origin and reports the root prefix as empty", () => {
    const result = validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: [] });
    expectAccepted(result);
    expect(result.canonical).toEqual({ origin: "https://uno.example.org", pathPrefix: "" });
    expect(result.aliases).toEqual([]);
  });

  it("accepts a path prefix of lowercase content-slug segments", () => {
    const result = validateUnoCanonicalBase({ canonical: "https://uno.example.org/site", aliases: [] });
    expectAccepted(result);
    expect(result.canonical).toEqual({ origin: "https://uno.example.org", pathPrefix: "/site" });
  });

  it("accepts explicit aliases on other origins", () => {
    const result = validateUnoCanonicalBase({
      canonical: "https://uno.example.org",
      aliases: ["https://old.example.org", "https://alt.example.org/site"],
    });
    expectAccepted(result);
    expect(result.aliases).toEqual([
      { origin: "https://old.example.org", pathPrefix: "" },
      { origin: "https://alt.example.org", pathPrefix: "/site" },
    ]);
  });

  it("accepts loopback HTTP for local tests, with and without an explicit port", () => {
    for (const base of ["http://localhost", "http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
      const result = validateUnoCanonicalBase({ canonical: base, aliases: [] });
      expectAccepted(result);
      expect(result.canonical.origin).toBe(base);
      expect(result.canonical.pathPrefix).toBe("");
    }
  });

  it("does not treat /site2 as an overlap of /site on one origin", () => {
    const result = validateUnoCanonicalBase({
      canonical: "https://uno.example.org/site",
      aliases: ["https://uno.example.org/site2"],
    });
    expectAccepted(result);
    expect(result.aliases[0]?.pathPrefix).toBe("/site2");
  });

  it("accepts an already-canonical punycode label as a label", () => {
    expectAccepted(refusalFor("https://xn--bcher-kva.example.org"));
  });

  it("accepts up to eight aliases and an empty alias list", () => {
    const eight = Array.from({ length: 8 }, (_, index) => `https://alt${index + 1}.example.org`);
    const result = validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: eight });
    expectAccepted(result);
    expect(result.aliases).toHaveLength(8);
    expectAccepted(refusalFor("https://uno.example.org", []));
  });

  it("accepts exactly 255 bytes and refuses 256", () => {
    expect(URL_255.length).toBe(255);
    expect(URL_256.length).toBe(256);
    expectAccepted(refusalFor(URL_255));
    expectRefused(refusalFor(URL_256), "base:canonical-url");
  });

  it("returns a fresh deeply frozen result without mutating the caller", () => {
    const canonical = "https://uno.example.org/site";
    const aliases = ["https://old.example.org"];
    const request = { canonical, aliases };
    const first = validateUnoCanonicalBase(request);
    const second = validateUnoCanonicalBase(request);
    expectAccepted(first);
    expectAccepted(second);

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.canonical)).toBe(true);
    expect(Object.isFrozen(first.aliases)).toBe(true);
    expect(first.aliases[0]).not.toBe(second.aliases[0]);
    expect(() => {
      (first.canonical as { origin: string }).origin = "https://evil.example.org";
    }).toThrow();
    expect(request).toEqual({ canonical, aliases });
    expect(aliases).toEqual(["https://old.example.org"]);
  });
});

describe("refused canonical URLs", () => {
  const cases: Array<[string, string]> = [
    ["unknown protocol", "ftp://uno.example.org"],
    ["external plain HTTP", "http://uno.example.org"],
    ["loopback lookalike under HTTP", "http://localhost.evil.org"],
    ["credentials in the authority", "https://user:pass@uno.example.org"],
    ["empty host", "https:///site"],
    ["uppercase host", "https://Uno.Example.org"],
    ["wildcard label", "https://*.example.org"],
    ["trailing dot", "https://uno.example.org."],
    ["explicit HTTPS port", "https://uno.example.org:8443"],
    ["redundant HTTPS port", "https://uno.example.org:443"],
    ["query string", "https://uno.example.org?x=1"],
    ["fragment", "https://uno.example.org#x"],
    ["percent escape", "https://uno.example.org/%41"],
    ["raw backslash", "https://uno.example.org\\site"],
    ["Unicode host", "https://uno.ex\u00e4mple.org"],
    ["NUL byte", "https://uno.example.org/site\u0000"],
    ["leading whitespace", " https://uno.example.org"],
    ["trailing whitespace", "https://uno.example.org "],
    ["protocol-relative reference", "//uno.example.org"],
    ["relative reference", "/site"],
    ["trailing slash", "https://uno.example.org/"],
    ["duplicated slash", "https://uno.example.org//site"],
    ["dot segment", "https://uno.example.org/./site"],
    ["parent segment", "https://uno.example.org/a/../site"],
    ["uppercase path segment", "https://uno.example.org/Site"],
    ["framework-reserved underscore segment", "https://uno.example.org/_next"],
    ["too many prefix segments", "https://uno.example.org/a/b/c/d/e/f/g/h/i"],
    ["prefix over 160 characters", `https://uno.example.org/${Array.from({ length: 8 }, () => "a".repeat(20)).join("/")}`],
    ["IP literal instead of a DNS name", "https://127.0.0.1"],
    ["single-label HTTPS host", "https://localhost"],
    ["label longer than 63 characters", `https://${"a".repeat(64)}.example.org`],
  ];

  it.each(cases)("refuses %s", (_label, value) => {
    expectRefused(refusalFor(value), "base:canonical-url");
  });

  it("refuses an empty canonical string", () => {
    expectRefused(refusalFor(""), "base:canonical-url");
  });
});

describe("refused aliases", () => {
  it("refuses an invalid alias as an alias failure, not a canonical one", () => {
    expectRefused(
      validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: ["ftp://old.example.org"] }),
      "base:alias-url",
    );
    expectRefused(
      validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: ["https://old.example.org/"] }),
      "base:alias-url",
    );
  });

  it("refuses a ninth alias", () => {
    const nine = Array.from({ length: 9 }, (_, index) => `https://alt${index + 1}.example.org`);
    expectRefused(validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: nine }), "base:alias-count");
    expect(UNO_CANONICAL_BASE_LIMITS.maxAliases).toBe(8);
  });

  it("refuses an alias identical to the canonical base", () => {
    expectRefused(
      validateUnoCanonicalBase({
        canonical: "https://uno.example.org/site",
        aliases: ["https://uno.example.org/site"],
      }),
      "base:alias-duplicate",
    );
  });

  it("refuses duplicate aliases", () => {
    expectRefused(
      validateUnoCanonicalBase({
        canonical: "https://uno.example.org",
        aliases: ["https://old.example.org", "https://old.example.org"],
      }),
      "base:alias-duplicate",
    );
  });

  it("refuses ancestor/child prefix overlap on one origin", () => {
    expectRefused(
      validateUnoCanonicalBase({
        canonical: "https://uno.example.org/site",
        aliases: ["https://uno.example.org/site/team"],
      }),
      "base:alias-overlap",
    );
    expectRefused(
      validateUnoCanonicalBase({
        canonical: "https://uno.example.org",
        aliases: ["https://uno.example.org/site"],
      }),
      "base:alias-overlap",
    );
    expectRefused(
      validateUnoCanonicalBase({
        canonical: "https://uno.example.org",
        aliases: ["https://uno.example.org/a", "https://uno.example.org/a/b"],
      }),
      "base:alias-overlap",
    );
  });

  it("keeps different hosts and ports independent", () => {
    expectAccepted(
      validateUnoCanonicalBase({
        canonical: "http://localhost:3000",
        aliases: ["http://localhost:3001", "http://127.0.0.1:3000"],
      }),
    );
  });

  it("refuses a duplicate reached through the same origin and prefix spelling", () => {
    expectRefused(
      validateUnoCanonicalBase({
        canonical: "http://localhost:3000",
        aliases: ["http://localhost:3000/"],
      }),
      "base:alias-url",
    );
  });
});


describe("untrusted input discipline", () => {
  it("refuses non-object roots without throwing", () => {
    for (const value of [null, undefined, [], ["https://uno.example.org"], 0, "", true, "https://uno.example.org"]) {
      const result = validateUnoCanonicalBase(value);
      expect(result.accepted).toBe(false);
      if (result.accepted) return;
      expect(CODES).toContain(result.reason);
    }
  });

  it("refuses a missing or extra field instead of ignoring it", () => {
    expectRefused(validateUnoCanonicalBase({ canonical: "https://uno.example.org" }), "base:input-shape");
    expectRefused(validateUnoCanonicalBase({ aliases: [] }), "base:input-shape");
    expectRefused(validateUnoCanonicalBase({}), "base:input-shape");
    expectRefused(
      validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: [], published: true }),
      "base:input-shape",
    );
    expect(UNO_CANONICAL_BASE_INPUT_KEYS).toEqual(["canonical", "aliases"]);
  });

  it("refuses wrong field types", () => {
    expectRefused(validateUnoCanonicalBase({ canonical: 7, aliases: [] }), "base:input-shape");
    expectRefused(validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: "https://a.example.org" }), "base:input-shape");
    expectRefused(validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: [7] }), "base:input-shape");
    expectRefused(validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: [null] }), "base:input-shape");
  });

  it("refuses an accessor root with zero getter invocations", () => {
    let reads = 0;
    const root = {
      get canonical(): string {
        reads += 1;
        return "https://uno.example.org";
      },
      aliases: [] as string[],
    };
    expectRefused(validateUnoCanonicalBase(root), "base:input-not-plain");
    expect(reads).toBe(0);
  });

  it("refuses symbol keys, exotic prototypes and a throwing Proxy", () => {
    const withSymbol: Record<PropertyKey, unknown> = { canonical: "https://uno.example.org", aliases: [] };
    withSymbol[Symbol("extra")] = true;
    expectRefused(validateUnoCanonicalBase(withSymbol), "base:input-not-plain");

    class Exotic {
      canonical = "https://uno.example.org";
      aliases: string[] = [];
    }
    expectRefused(validateUnoCanonicalBase(new Exotic()), "base:input-not-plain");

    const hostile = new Proxy(
      { canonical: "https://uno.example.org", aliases: [] },
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    // A trap that throws makes the record unreadable rather than non-plain; both are closed codes.
    expectRefused(validateUnoCanonicalBase(hostile), "base:unreadable");
  });

  it("refuses a sparse array and an accessor array entry", () => {
    const sparse: string[] = ["https://old.example.org"];
    sparse.length = 2;
    expectRefused(validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: sparse }), "base:input-not-plain");

    const trap = ["https://old.example.org"] as unknown as string[];
    Object.defineProperty(trap, "0", {
      get(): string {
        throw new Error("accessor");
      },
      enumerable: true,
      configurable: true,
    });
    expectRefused(validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: trap }), "base:input-not-plain");
  });

  it("exposes one closed, duplicate-free refusal vocabulary", () => {
    expect(CODES).toHaveLength(8);
    expect(new Set(CODES).size).toBe(8);
    expect(Object.isFrozen(CODES)).toBe(true);
    for (const code of [
      "base:input-not-plain",
      "base:input-shape",
      "base:unreadable",
      "base:canonical-url",
      "base:alias-url",
      "base:alias-count",
      "base:alias-duplicate",
      "base:alias-overlap",
    ]) {
      expect(CODES).toContain(code as UnoCanonicalBaseRefusalCode);
    }
  });

  it("echoes no rejected URL, host or path back to the caller", () => {
    const rejected = validateUnoCanonicalBase({
      canonical: "https://UPPER.example.org/site",
      aliases: ["ftp://leak.example.org"],
    });
    expectRefused(rejected, "base:canonical-url");
    const serialised = JSON.stringify(rejected);
    expect(serialised).toBe('{"accepted":false,"reason":"base:canonical-url"}');
    for (const leak of ["UPPER", "leak.example.org", "ftp:", "/site"]) {
      expect(serialised.includes(leak)).toBe(false);
    }
  });

  it("refuses without throwing when the alias list is huge", () => {
    const many = Array.from({ length: 12 }, (_, index) => `https://alt${index + 1}.example.org`);
    const result = validateUnoCanonicalBase({ canonical: "https://uno.example.org", aliases: many });
    expectRefused(result, "base:alias-count");
  });
});
