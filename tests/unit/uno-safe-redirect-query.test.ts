import { describe, expect, it } from "vitest";

import {
  UNO_SAFE_REDIRECT_QUERY_LIMITS,
  validateUnoSafeRedirectQuery,
} from "../../src/config/uno-safe-redirect-query";

/**
 * Safe redirect-query validation (`UNO-WO-099 / R01`).
 *
 * The contract is total and pure: one untrusted suffix in, one verdict out. Accepted means "append these exact bytes";
 * refused means "answer the approved 404". Nothing here may name a destination, decode-and-re-encode a value or consult a
 * Site, so these cases are the whole lexical truth of the rule.
 *
 * Each case is mutation-sensitive: widening the value grammar, dropping the leading-`?` requirement, allowing a second `?`
 * or `#`, permitting any percent triplet, re-serialising through `URLSearchParams`, or removing a bound turns at least one
 * case red.
 */

/** Accepted verdicts must carry the *same* bytes, not a rebuilt spelling. */
describe("accepted safe queries", () => {
  it("accepts the absence of a query as an empty suffix", () => {
    expect(validateUnoSafeRedirectQuery("")).toEqual({ status: "accepted", query: "" });
  });

  it("preserves an ordinary two-parameter query byte for byte", () => {
    const raw = "?ref=alpha%20beta&view=compact";
    const verdict = validateUnoSafeRedirectQuery(raw);
    expect(verdict).toEqual({ status: "accepted", query: raw });
    if (verdict.status !== "accepted") throw new Error("unreachable");
    expect(verdict.query).toBe(raw);
    expect(verdict.query).not.toContain("+");
  });

  it("preserves parameter order, duplicates and unreserved ASCII exactly", () => {
    for (const raw of [
      "?b=2&a=1",
      "?tag=x&tag=y",
      "?q=x.y-z_~",
      "?ref=alpha%20beta%20gamma",
      "?utm_source=newsletter&utm_medium=email",
      "?empty=",
    ]) {
      expect(validateUnoSafeRedirectQuery(raw)).toEqual({ status: "accepted", query: raw });
    }
  });

  it("accepts a query at exactly the documented budget and refuses one byte more", () => {
    const valueAtLimit = "a".repeat(UNO_SAFE_REDIRECT_QUERY_LIMITS.valueBytes);
    expect(validateUnoSafeRedirectQuery(`?v=${valueAtLimit}`).status).toBe("accepted");

    // Two values sized so the whole suffix lands exactly on the byte budget.
    const half = "a".repeat(UNO_SAFE_REDIRECT_QUERY_LIMITS.bytes / 2 - 3);
    const queryAtLimit = `?a=${half}&b=${half}`;
    expect(queryAtLimit.length).toBe(UNO_SAFE_REDIRECT_QUERY_LIMITS.bytes);
    expect(validateUnoSafeRedirectQuery(queryAtLimit).status).toBe("accepted");
    expect(validateUnoSafeRedirectQuery(`${queryAtLimit}a`)).toEqual({
      status: "refused",
      reason: "query:too-long",
    });
  });

  it("accepts exactly the documented parameter count and refuses one more", () => {
    const atLimit = `?${Array.from({ length: UNO_SAFE_REDIRECT_QUERY_LIMITS.parameters }, (_, i) => `k${i}=1`).join("&")}`;
    expect(validateUnoSafeRedirectQuery(atLimit).status).toBe("accepted");
    expect(validateUnoSafeRedirectQuery(`${atLimit}&k9=1`)).toEqual({
      status: "refused",
      reason: "query:too-many-parameters",
    });
  });
});

describe("refused hostile and malformed queries", () => {
  it("refuses every encoded structural, control and recursion triplet", () => {
    for (const triplet of ["%0d", "%0a", "%00", "%2f", "%2F", "%5c", "%26", "%3d", "%25", "%2e", "%41", "%09"]) {
      expect(validateUnoSafeRedirectQuery(`?a=x${triplet}y`)).toEqual({
        status: "refused",
        reason: "query:unsafe-value",
      });
    }
  });

  it("refuses raw controls, spaces, fragments and a second question mark", () => {
    for (const raw of ["?a=x\r\ny", "?a=x\ny", "?a=x\u0000y", "?a=x y", "?a=1 ", "?a=x#frag", "?a=1?b=2", "?a=\u00fc"]) {
      expect(validateUnoSafeRedirectQuery(raw).status).toBe("refused");
    }
  });

  it("refuses open-redirect and protocol shapes inside a value", () => {
    for (const raw of ["?url=https://evil.example", "?next=//evil.example", "?u=javascript:alert(1)", "?p=/docs/de-de"]) {
      expect(validateUnoSafeRedirectQuery(raw)).toEqual({ status: "refused", reason: "query:unsafe-value" });
    }
    // A dot-only token is an opaque value, never a destination: it carries no slash, colon or scheme, so it can only ever
    // stay inside the accepted query of an already granted location.
    expect(validateUnoSafeRedirectQuery("?r=evil.example")).toEqual({ status: "accepted", query: "?r=evil.example" });
  });

  it("emits a space in the unambiguous %20 spelling and is idempotent", () => {
    // The framework hands user code `+` for a wire `%20`; the accepted form is always `%20`.
    expect(validateUnoSafeRedirectQuery("?ref=alpha+beta")).toEqual({
      status: "accepted",
      query: "?ref=alpha%20beta",
    });
    expect(validateUnoSafeRedirectQuery("?ref=alpha%20beta")).toEqual({
      status: "accepted",
      query: "?ref=alpha%20beta",
    });
    expect(validateUnoSafeRedirectQuery("?a=1+2&b=3+4")).toEqual({ status: "accepted", query: "?a=1%202&b=3%204" });
    // A query that needs no normalization is returned as the same value, never rebuilt.
    const untouched = "?b=2&a=1";
    expect(validateUnoSafeRedirectQuery(untouched)).toEqual({ status: "accepted", query: untouched });
  });

  it("refuses malformed structure: no leading marker, bare marker, missing key or doubled equality", () => {
    expect(validateUnoSafeRedirectQuery("ref=alpha")).toEqual({ status: "refused", reason: "query:not-a-query" });
    expect(validateUnoSafeRedirectQuery("?")).toEqual({ status: "refused", reason: "query:not-a-query" });
    expect(validateUnoSafeRedirectQuery("?a")).toEqual({ status: "refused", reason: "query:not-a-query" });
    expect(validateUnoSafeRedirectQuery("?=1")).toEqual({ status: "refused", reason: "query:not-a-query" });
    expect(validateUnoSafeRedirectQuery("?a=1=2")).toEqual({ status: "refused", reason: "query:not-a-query" });
    expect(validateUnoSafeRedirectQuery("?a=1&&b=2")).toEqual({ status: "refused", reason: "query:empty-parameter" });
    expect(validateUnoSafeRedirectQuery("?a=1&")).toEqual({ status: "refused", reason: "query:empty-parameter" });
  });

  it("refuses an unsafe or oversized key", () => {
    for (const raw of ["?-a=1", "?.a=1", "?a%20b=1", `?${"a".repeat(33)}=1`]) {
      expect(validateUnoSafeRedirectQuery(raw)).toEqual({ status: "refused", reason: "query:unsafe-key" });
    }
  });

  it("refuses an oversized value and a non-string input", () => {
    expect(validateUnoSafeRedirectQuery(`?a=${"b".repeat(UNO_SAFE_REDIRECT_QUERY_LIMITS.valueBytes + 1)}`)).toEqual({
      status: "refused",
      reason: "query:too-long",
    });
    for (const raw of [undefined, null, 42, ["?a=1"], { query: "?a=1" }]) {
      expect(validateUnoSafeRedirectQuery(raw)).toEqual({ status: "refused", reason: "query:not-a-query" });
    }
  });

  it("never returns a destination or a rebuilt spelling", () => {
    const verdict = validateUnoSafeRedirectQuery("?a=1");
    expect(Object.keys(verdict).sort()).toEqual(["query", "status"]);
    expect(JSON.stringify(verdict)).not.toContain("http");
  });
});
