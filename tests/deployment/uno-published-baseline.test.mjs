/**
 * The published-declaration baseline (`scripts/uno-published-baseline.mjs`).
 *
 * The HTTP and browser gates now rely on this instead of an opaque manifest digest, so it is proved here: the semantic
 * expectation accepts the committed graph, refuses each mutation it exists to catch, and the restore proof is sensitive
 * to a single changed byte. Node-native and dependency-free, like the other hermetic guards.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

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
    assert.equal(manifestSemanticIssue(manifest), null);
  });

  it("refuses every mutation it exists to refuse", () => {
    const proof = manifestMutationProof(manifest);
    assert.ok(proof.length >= 9, `expected at least nine mutation cases, saw ${proof.length}`);
    const accepted = proof.filter((entry) => entry.issue === null);
    assert.deepEqual(accepted.map((entry) => entry.rule), []);
    assert.ok(proof.every((entry) => typeof entry.issue === "string" && entry.issue.startsWith("manifest:")));
  });

  it("refuses a manifest that is not an object, or declares no entities", () => {
    assert.equal(manifestSemanticIssue(null), "manifest:not-an-object");
    assert.equal(manifestSemanticIssue({}), "manifest:entities-missing");
    assert.equal(manifestSemanticIssue({ entities: [] }), "manifest:expected-one-entity:0");
  });

  it("keeps the retired digest as evidence rather than as an assertion", () => {
    assert.match(HISTORICAL_DECLARATION_DIGESTS[MANIFEST], /^[0-9a-f]{64}$/u);
    const captured = captureDeclarationDigests(root, [SELECTION]);
    assert.equal(captured.get(SELECTION), HISTORICAL_DECLARATION_DIGESTS[SELECTION]);
    assert.deepEqual(declarationDriftAfter(root, captured), []);
    assert.equal(declarationDriftAfter(root, new Map([[MANIFEST, "0".repeat(64)]])).length, 1);
  });
});
