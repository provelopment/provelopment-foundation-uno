/**
 * Foundation Uno — mutation guards for the cumulative U04 closure oracle (`UNO-WO-084 / R01`, T18).
 *
 * These guards exist so the oracle can never print a fuller claim than the evidence it was handed: every credited label must
 * be droppable, every dimension must be independently required, the immutable baseline must be unchangeable and the declared
 * checkpoint row must be exact.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  U04_CHECKPOINT_TARGETS,
  U04_CLOSURE_FAMILIES,
  U04_EVIDENCE_DIMENSIONS,
  U04_IMMUTABLE_BASELINE,
  evaluateU04FamilyClosure,
  provenFamilyEvidence,
  selfCheckU04FamilyClosure,
} from "../../scripts/verify-u04-family-closure.mjs";

/** Complete evidence for exactly these families. */
function complete(names) {
  return Object.fromEntries(names.map((family) => [family, provenFamilyEvidence()]));
}

/** Evaluate one A1 attempt. */
function a1(families) {
  return evaluateU04FamilyClosure({ families, ...U04_IMMUTABLE_BASELINE, checkpoint: "A1" });
}

describe("U04 closure oracle — immutable shape", () => {
  it("enumerates exactly the seventeen donor families in the audited order", () => {
    assert.deepEqual([...U04_CLOSURE_FAMILIES], [
      "prose",
      "callout",
      "table",
      "list",
      "hero",
      "stats",
      "steps",
      "quote",
      "faq",
      "columns",
      "media",
      "gallery",
      "cards",
      "features",
      "actions",
      "contactForm",
      "divider",
    ]);
    assert.equal(new Set(U04_CLOSURE_FAMILIES).size, 17);
    assert.equal(Object.isFrozen(U04_CLOSURE_FAMILIES), true);
  });

  it("fixes the seven independent evidence dimensions", () => {
    assert.deepEqual([...U04_EVIDENCE_DIMENSIONS], [
      "source",
      "reader",
      "renderer",
      "http",
      "browser",
      "refusal",
      "rights",
    ]);
  });

  it("fixes the immutable 22/4/16 baseline and every declared checkpoint row", () => {
    assert.deepEqual({ ...U04_IMMUTABLE_BASELINE }, { modules: 22, zones: 4, browserMatrix: 16 });
    for (const [name, target] of Object.entries(U04_CHECKPOINT_TARGETS)) {
      assert.equal(target.proxy, 42 + target.parity, `${name} proxy must equal 42 + parity`);
    }
    assert.deepEqual({ ...U04_CHECKPOINT_TARGETS.D }, { parity: 17, proxy: 59, families: ["actions", "contactForm"] });
  });
});

describe("U04 closure oracle — the A1 row", () => {
  it("credits prose and callout only from complete evidence and prints 3/17 and 45/59", () => {
    const result = a1(complete(["divider", "prose", "callout"]));
    assert.equal(result.ok, true);
    assert.deepEqual([...result.credited], ["prose", "callout", "divider"]);
    assert.equal(result.parity, 3);
    assert.equal(result.proxy, 45);
    for (const label of [
      "PARITY_PROSE=PASS",
      "PARITY_CALLOUT=PASS",
      "PARITY_DIVIDER=PASS",
      "U04_PARITY=3/17",
      "U04_PROXY=45/59",
      "U04_MODULE_IDS=22/22",
      "U04_ASSET_ZONES=4/4",
      "U04_BROWSER_MATRIX=16/16",
    ]) {
      assert.ok(result.labels.includes(label), `missing ${label}`);
    }
    // Fourteen families stay honestly pending and no label invents them.
    assert.equal(result.pending.length, 14);
    assert.ok(result.labels.includes("PARITY_TABLE=PENDING"));
    assert.ok(result.labels.includes("PARITY_CONTACTFORM=PENDING"));
    assert.equal(result.labels.filter((label) => label.endsWith("=PASS")).length, 3);
  });

  it("keeps the divider baseline credited without any new family", () => {
    const result = evaluateU04FamilyClosure({ families: complete(["divider"]), ...U04_IMMUTABLE_BASELINE });
    assert.equal(result.ok, true);
    assert.equal(result.parity, 1);

describe("U04 closure oracle — mutants are refused", () => {
  it("refuses every single missing dimension and every single false dimension", () => {
    for (const dimension of U04_EVIDENCE_DIMENSIONS) {
      const missing = complete(["divider", "prose"]);
      missing.callout = { ...provenFamilyEvidence() };
      delete missing.callout[dimension];
      assert.equal(a1(missing).ok, false, `missing ${dimension} must refuse the A1 row`);

      const falsified = complete(["divider", "prose"]);
      falsified.callout = { ...provenFamilyEvidence(), [dimension]: false };
      assert.equal(a1(falsified).ok, false, `false ${dimension} must refuse the A1 row`);
    }
  });

  it("refuses a non-boolean that merely looks true", () => {
    for (const fake of ["true", 1, {}, []]) {
      const families = complete(["divider", "prose"]);
      families.callout = { ...provenFamilyEvidence(), browser: fake };
      assert.equal(a1(families).ok, false);
    }
  });

  it("refuses an unknown family, an unknown dimension and a crossed shape", () => {
    assert.equal(a1({ ...complete(["divider", "prose", "callout"]), banner: provenFamilyEvidence() }).ok, false);
    const extra = complete(["divider", "prose"]);
    extra.callout = { ...provenFamilyEvidence(), screenshot: true };
    assert.equal(a1(extra).ok, false);
    assert.equal(a1(complete(["divider", "prose", "callout"]).callout).ok, false);
    const arrays = complete(["divider", "prose", "callout"]);
    arrays.prose = Object.values(provenFamilyEvidence());
    assert.equal(a1(arrays).ok, false);
    assert.equal(a1(null).ok, false);
    assert.equal(a1(complete(["divider"])).reason, "closure:checkpoint-parity-mismatch");
  });

  it("refuses a broken immutable baseline", () => {
    const families = complete(["divider", "prose", "callout"]);
    assert.equal(evaluateU04FamilyClosure({ families, modules: 21, zones: 4, browserMatrix: 16, checkpoint: "A1" }).ok, false);
    assert.equal(evaluateU04FamilyClosure({ families, modules: 22, zones: 3, browserMatrix: 16, checkpoint: "A1" }).ok, false);
    assert.equal(evaluateU04FamilyClosure({ families, modules: 22, zones: 4, browserMatrix: 15, checkpoint: "A1" }).ok, false);
  });

  it("refuses an invented higher score and a dropped divider", () => {
    const inflated = complete(["divider", "prose", "callout", "table"]);
    assert.equal(a1(inflated).ok, false);
    assert.equal(
      a1({ ...complete(["divider", "prose", "callout"]), divider: { ...provenFamilyEvidence(), rights: false } }).ok,
      false,
    );
    assert.equal(a1(complete(["prose", "callout"])).ok, false);
  });

  it("refuses an unlisted checkpoint name", () => {
    const families = complete(["divider", "prose", "callout"]);
    assert.equal(evaluateU04FamilyClosure({ families, ...U04_IMMUTABLE_BASELINE, checkpoint: "A0" }).ok, false);
  });

  it("passes its own self-check without carrying any product claim", () => {
    const result = selfCheckU04FamilyClosure();
    assert.equal(result.ok, true);
    assert.equal(result.reason, null);
  });
});

    assert.equal(result.proxy, 43);
  });

  it("never mutates the caller's evidence", () => {
    const families = complete(["divider", "prose", "callout"]);
    const snapshot = JSON.stringify(families);
    a1(families);
    assert.equal(JSON.stringify(families), snapshot);
  });
});

describe("U04 closure oracle — A2 row and its mutation surface (WO-105 E3)", () => {
  /** Evaluate one A2 attempt. */
  function a2(families) {
    return evaluateU04FamilyClosure({ families, ...U04_IMMUTABLE_BASELINE, checkpoint: "A2" });
  }

  /** The three accepted A1 families plus both A2 families. */
  const credited = () => complete(["divider", "prose", "callout", "table", "list"]);

  it("fixes the A2 row at 5/17 and 47/59 over table and list only", () => {
    assert.deepEqual({ ...U04_CHECKPOINT_TARGETS.A2 }, { parity: 5, proxy: 47, families: ["table", "list"] });
    const attempt = a2(credited());
    assert.equal(attempt.ok, true);
    assert.equal(attempt.parity, 5);
    assert.equal(attempt.proxy, 47);
  });

  it("refuses A2 while either new family is still pending", () => {
    for (const dropped of ["table", "list"]) {
      const families = credited();
      delete families[dropped];
      const attempt = a2(families);
      assert.equal(attempt.ok, false);
      assert.equal(attempt.reason, "closure:checkpoint-parity-mismatch");
    }
  });

  it("refuses A2 when any single dimension of either new family is false", () => {
    for (const family of ["table", "list"]) {
      for (const dimension of U04_EVIDENCE_DIMENSIONS) {
        const families = credited();
        families[family] = { ...families[family], [dimension]: false };
        assert.equal(a2(families).ok, false, `${family}.${dimension} must be required`);
      }
    }
  });

  it("refuses A2 when a new family's evidence is crossed, incomplete or non-boolean", () => {
    const crossed = credited();
    const { source, ...withoutSource } = crossed.table;
    assert.equal(typeof source, "boolean");
    crossed.table = withoutSource;
    assert.equal(a2(crossed).ok, false);

    const truthy = credited();
    truthy.list = { ...truthy.list, browser: "yes" };
    assert.equal(a2(truthy).ok, false);

    const extra = credited();
    extra.table = { ...extra.table, screenshot: true };
    assert.equal(a2(extra).ok, false);

    const swapped = credited();
    swapped.table = { ...swapped.table, source: true };
    swapped.list = { ...swapped.list, source: false };
    assert.equal(a2(swapped).ok, false);
  });

  it("refuses A2 with an inflated family set and cannot reach A2 from the A1 row", () => {
    const inflated = complete(["divider", "prose", "callout", "table", "list", "hero"]);
    assert.equal(a2(inflated).ok, false);
    assert.equal(
      evaluateU04FamilyClosure({ families: credited(), ...U04_IMMUTABLE_BASELINE, checkpoint: "A1" }).ok,
      false,
    );
  });
});

