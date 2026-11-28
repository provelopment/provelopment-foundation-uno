/**
 * The published-declaration baseline (`scripts/uno-published-baseline.mjs`).
 *
 * This suite exists because the HTTP and browser gates now rely on it instead of an opaque manifest digest: it proves
 * the semantic expectation accepts the committed graph, refuses each mutation the baseline exists to catch, and that
 * the restore proof is sensitive to a single changed byte.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  HISTORICAL_DECLARATION_DIGESTS,
  MANIFEST,
  SELECTION,
  captureDeclarationDigests,
  declarationDriftAfter,
  manifestMutationProof,
  manifestSemanticIssue,
} from "../../scripts/uno-published-baseline.mjs";

const root = process.cwd();
const manifest = JSON.parse(readFileSync(`${root}/${MANIFEST}`, "utf8"));

describe("the published-declaration baseline", () => {
  it("accepts the committed graph exactly", () => {
    expect(manifestSemanticIssue(manifest)).toBeNull();
  });

  it("refuses every mutation it exists to refuse", () => {
    const proof = manifestMutationProof(manifest);
    expect(proof.length).toBeGreaterThanOrEqual(9);
    const accepted = proof.filter((entry) => entry.issue === null);
    expect(accepted.map((entry) => entry.rule)).toEqual([]);
    // Each case names the rule it attacks, so a failure report is actionable rather than a bare hash mismatch.
    expect(proof.every((entry) => typeof entry.issue === "string" && entry.issue.startsWith("manifest:"))).toBe(true);
  });

  it("refuses a manifest that is not an object, or declares no entities", () => {
    expect(manifestSemanticIssue(null)).toBe("manifest:not-an-object");
    expect(manifestSemanticIssue({})).toBe("manifest:entities-missing");
    expect(manifestSemanticIssue({ entities: [] })).toBe("manifest:expected-one-entity:0");
  });

  it("keeps the retired digest as evidence rather than as an assertion", () => {
    // The manifest digest was retired by the authorised public-contact declaration; the selection digest still holds.
    expect(HISTORICAL_DECLARATION_DIGESTS[MANIFEST]).toMatch(/^[0-9a-f]{64}$/u);
    const captured = captureDeclarationDigests(root, [SELECTION]);
    expect(captured.get(SELECTION)).toBe(HISTORICAL_DECLARATION_DIGESTS[SELECTION]);
    expect(declarationDriftAfter(root, captured)).toEqual([]);
    expect(declarationDriftAfter(root, new Map([[MANIFEST, "0".repeat(64)]]))).toHaveLength(1);
  });
});
