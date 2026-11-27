/**
 * `UNO-WO-127 / R03` — the durable Features equivalence proof is mutation-sensitive.
 *
 * The published-Pages gate credits the committed Features wrapper and the composed native features node as one authored
 * family. That credit is only honest if the comparison actually decides every field, so this suite feeds the comparator the
 * real committed node and the real composed node, then mutates one authored thing at a time — an altered title, a missing
 * unit, a reordered list, an invented icon, body, surface, meta or action, a changed heading, level, lede or column intent, a
 * crossed module and an authored `children` list — and requires the corresponding clause to fail. A comparison that could be
 * satisfied by an exception list cannot pass this suite.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { describe, it } from "node:test";

import {
  FEATURES_SECTION_ID,
  featuresEquivalenceDelta,
  featuresEquivalenceHolds,
} from "../../scripts/u03/durable-features-equivalence.mjs";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/iu.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        return nextResolve(specifier, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const { composeUnoFoundationSubset } = await import("../../src/application/compose-uno-foundation-families.ts");

/** The real committed wrapper and the real composed native node, read from the repository's own fixtures. */
function subjects() {
  const source = JSON.parse(readFileSync("tests/fixtures/u04-durable-family-source.json", "utf8"));
  const bindings = JSON.parse(readFileSync("tests/fixtures/u04-durable-family-bindings.json", "utf8"));
  const composed = composeUnoFoundationSubset(source, bindings);
  assert.equal(composed.status, "composed");
  const page = JSON.parse(readFileSync("deployment/efs/content/components.en-001.json", "utf8"));
  const committed = page.sections.find((node) => node.id === FEATURES_SECTION_ID);
  const native = composed.document.sections.find((node) => node.id === FEATURES_SECTION_ID);
  assert.ok(committed !== undefined && native !== undefined);
  return { committed, native };
}

/** A fresh native node: enumerable props copied and the consumer list restored exactly as the reader defines it. */
function nativeCopy(overrides = {}) {
  const node = {
    id: FEATURES_SECTION_ID,
    module: "layout.grid",
    props: structuredClone(subjects().native.props),
    ...overrides,
  };
  Object.defineProperty(node, "children", { value: Object.freeze([]), enumerable: false, writable: false });
  return node;
}

const holds = (committed, native) => featuresEquivalenceHolds(featuresEquivalenceDelta(committed, native));

const CLAUSES = Object.freeze([
  "anchor",
  "representation",
  "heading",
  "lede",
  "columns",
  "items",
  "absence",
  "fields",
]);

describe("the durable Features equivalence (`UNO-WO-127 / R01`)", () => {
  it("holds on the real committed wrapper and the real composed native node", () => {
    const { committed, native } = subjects();
    const delta = featuresEquivalenceDelta(committed, native);
    assert.deepEqual(Object.keys(delta).sort(), [...CLAUSES].sort());
    assert.deepEqual(delta, Object.fromEntries(CLAUSES.map((clause) => [clause, true])));
    assert.equal(featuresEquivalenceHolds(delta), true);
  });

  it("refuses a missing node instead of treating absence as agreement", () => {
    const { committed, native } = subjects();
    for (const delta of [
      featuresEquivalenceDelta(undefined, native),
      featuresEquivalenceDelta(committed, undefined),
      featuresEquivalenceDelta(null, null),
    ]) {
      assert.equal(featuresEquivalenceHolds(delta), false);
      assert.equal(Object.values(delta).every((value) => value === false), true);
    }
  });
});


/** One mutation case: a label, a mutation over fresh copies, and the clause that must fail. */
const NATIVE = (next) => next.native;
const PROPS = (next) => next.native.props;
const FEATURES = (next) => next.native.props.features;
const GRID = (next) => next.committed.children[2];
const UNITS = (next) => next.committed.children[2].children;

const CASES = Object.freeze([
  ["an altered native unit title", (next) => { FEATURES(next)[0].title = "Altered"; }, "items"],
  ["a reordered native unit list", (next) => {
    const units = FEATURES(next);
    [units[0], units[1]] = [units[1], units[0]];
  }, "items"],
  ["a dropped native unit", (next) => { FEATURES(next).pop(); }, "items"],
  ["an added native unit", (next) => { FEATURES(next).push({ title: "Extra" }); }, "items"],
  ["a reordered committed unit list", (next) => {
    const units = UNITS(next);
    [units[0], units[1]] = [units[1], units[0]];
  }, "items"],
  ["an altered committed unit title", (next) => { UNITS(next)[0].children[0].props.text = "Altered"; }, "items"],
  ["a changed committed unit title level", (next) => { UNITS(next)[0].children[0].props.level = 2; }, "items"],
  ["an altered native heading", (next) => { PROPS(next).heading = "Other"; }, "heading"],
  ["a dropped native heading", (next) => { delete PROPS(next).heading; }, "heading"],
  ["a changed native heading level", (next) => { PROPS(next).level = 3; }, "heading"],
  ["an altered committed heading", (next) => { next.committed.children[0].props.text = "Other"; }, "heading"],
  ["a changed committed heading level", (next) => { next.committed.children[0].props.level = 3; }, "heading"],
  ["an altered native lede", (next) => { PROPS(next).lede = "Other lede."; }, "lede"],
  ["a dropped native lede", (next) => { delete PROPS(next).lede; }, "lede"],
  ["an invented Markdown lede declaration", (next) => { PROPS(next).ledeMarkdown = true; }, "lede"],
  ["an altered committed lede", (next) => { next.committed.children[1].props.text = "Other lede."; }, "lede"],
  ["a changed column intent", (next) => { PROPS(next).columns = 4; }, "columns"],
  ["a dropped column intent", (next) => { delete PROPS(next).columns; }, "columns"],
  ["a changed committed column intent", (next) => { GRID(next).props.columns = 2; }, "columns"],
  ["an invented feature icon", (next) => { FEATURES(next)[0].icon = { zone: "page", path: "icon.png" }; }, "absence"],
  ["an invented feature body", (next) => { FEATURES(next)[0].body = "Invented body."; }, "absence"],
  ["an invented Markdown body declaration", (next) => { FEATURES(next)[0].bodyMarkdown = true; }, "absence"],
  ["an invented feature meta", (next) => { FEATURES(next)[0].meta = "Invented meta"; }, "absence"],
  ["an invented feature action", (next) => { FEATURES(next)[0].action = { label: "Go" }; }, "absence"],
  ["an invented section surface", (next) => { PROPS(next).surface = "muted"; }, "absence"],
  ["an unknown native prop", (next) => { PROPS(next).itemSemantics = "list"; }, "fields"],
  ["an unknown committed grid prop", (next) => { GRID(next).props.list = true; }, "fields"],
  ["a changed committed grid item semantics", (next) => { GRID(next).props.itemSemantics = "grid"; }, "fields"],
  ["an unknown committed unit prop", (next) => { UNITS(next)[0].props.surface = "muted"; }, "fields"],
  ["a crossed native module", (next) => { NATIVE(next).module = "layout.stack"; }, "anchor"],
  ["a crossed committed module", (next) => { next.committed.module = "content.prose"; }, "anchor"],
  ["a foreign section id", (next) => { NATIVE(next).id = "family-15-cards"; }, "anchor"],
  ["an authored native children list", (next) => {
    next.native = { id: FEATURES_SECTION_ID, module: "layout.grid", props: PROPS(next), children: [] };
  }, "representation"],
  ["an extra committed wrapper child", (next) => {
    next.committed.children.push(structuredClone(next.committed.children[0]));
  }, "representation"],
  ["an invented committed wrapper prop", (next) => { next.committed.props.surface = "muted"; }, "representation"],
  ["a dropped committed grid", (next) => { next.committed.children.pop(); }, "representation"],
]);

describe("the durable Features equivalence detects mutation", () => {
  for (const [label, mutate, clause] of CASES) {
    it(`fails on ${label} at the ${clause} clause`, () => {
      const { committed } = subjects();
      const next = { committed: structuredClone(committed), native: nativeCopy() };
      assert.equal(holds(next.committed, next.native), true, `baseline for ${label}`);
      mutate(next);
      const delta = featuresEquivalenceDelta(next.committed, next.native);
      assert.equal(delta[clause], false, `${label}: ${JSON.stringify(delta)}`);
      assert.equal(featuresEquivalenceHolds(delta), false, label);
    });
  }
});
