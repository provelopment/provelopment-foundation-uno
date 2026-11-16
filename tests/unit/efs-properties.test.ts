import { describe, expect, it } from "vitest";

import {
  PROPERTY_REFUSAL_REASONS,
  UNO_PROPERTY_KEYS,
  UNO_PROPERTY_LIMITS,
  projectUnoPropertyValues,
  resolveUnoProperties,
  validateUnoPropertyBag,
  type UnoPropertyAncestryEntry,
  type UnoPropertyRefusal,
} from "../../src/core/efs/properties";

/**
 * U02 typed-property tests (`UNO-WO-018 / R01`).
 *
 * Every refusal case asserts the *specific* closed code and proves that code is part of the closed
 * vocabulary, so a validator that always refused (or always accepted) could not pass. Nothing here
 * asserts publication, rendering, routing or a public projection: an accepted declaration is
 * authorship metadata and nothing else.
 */

const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";
const MAX = UNO_PROPERTY_LIMITS.valueLength;

function expectBagRefused(input: unknown, reason: UnoPropertyRefusal): void {
  const result = validateUnoPropertyBag(input);
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(PROPERTY_REFUSAL_REASONS).toContain(result.reason);
}

function expectRefused(input: unknown, reason: UnoPropertyRefusal): void {
  const result = resolveUnoProperties(input);
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(PROPERTY_REFUSAL_REASONS).toContain(result.reason);
}

/** The committed five-level identity chain, carrying only the property bags under test. */
function chain(
  bags: Partial<Record<"entity" | "facet" | "site" | "page" | "representation", unknown>>,
): UnoPropertyAncestryEntry[] {
  const entries: UnoPropertyAncestryEntry[] = [
    { level: "entity", id: ENTITY_ID },
    { level: "facet", id: "foundation" },
    { level: "site", id: "main" },
    { level: "page", id: "home" },
    { level: "representation", id: "en-001" },
  ];
  return entries.map((entry) =>
    Object.prototype.hasOwnProperty.call(bags, entry.level)
      ? { ...entry, properties: bags[entry.level] }
      : entry,
  );
}

describe("the closed property bag contract", () => {
  it("accepts one declaration and freezes it", () => {
    const result = validateUnoPropertyBag({ "brand.name": { value: "Foundation Uno" } });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.isFrozen(result.bag)).toBe(true);
    expect(Object.isFrozen(result.bag["brand.name"])).toBe(true);
    expect(result.bag["brand.name"]).toEqual({ value: "Foundation Uno", public: false });
  });

  it("accepts every allowed key in one bag", () => {
    const result = validateUnoPropertyBag({
      "brand.name": { value: "Foundation Uno" },
      "contact.name": { value: "Front Desk" },
      "contact.email": { value: "desk@example.invalid" },
      "contact.phone": { value: "+00 000 0000" },
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result.bag).sort()).toEqual([...UNO_PROPERTY_KEYS].sort());
  });

  it("accepts an empty bag as 'nothing authored here'", () => {
    const result = validateUnoPropertyBag({});
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result.bag)).toEqual([]);
  });

  it("accepts literal null as an explicit suppression marker", () => {
    const result = validateUnoPropertyBag({ "brand.name": { value: null } });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.bag["brand.name"]).toEqual({ value: null, public: false });
  });

  it("keeps an explicit public flag and defaults it to false when omitted", () => {
    const result = validateUnoPropertyBag({
      "brand.name": { value: "Foundation Uno", public: true },
      "contact.name": { value: "Front Desk" },
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.bag["brand.name"]?.public).toBe(true);
    expect(result.bag["contact.name"]?.public).toBe(false);
  });

  it("returns a fresh bag rather than aliasing the caller's object", () => {
    const input = { "brand.name": { value: "Foundation Uno" } };
    const result = validateUnoPropertyBag(input);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.bag).not.toBe(input);
    expect(input["brand.name"]).toEqual({ value: "Foundation Uno" });
  });

  it("refuses a bag that is not a plain object", () => {
    expectBagRefused("brand.name", "property:invalid-bag");
    expectBagRefused(null, "property:invalid-bag");
    expectBagRefused([{ value: "Foundation Uno" }], "property:invalid-bag");
  });

  it("refuses more than the declared key bound", () => {
    expectBagRefused(
      {
        "brand.name": { value: "a" },
        "contact.name": { value: "b" },
        "contact.email": { value: "c" },
        "contact.phone": { value: "d" },
        timezone: { value: "e" },
      },
      "property:too-many-keys",
    );
  });

  it("refuses an unknown property key", () => {
    expectBagRefused({ timezone: { value: "UTC" } }, "property:unknown-key");
    expectBagRefused({ openingSchedule: { value: "9-5" } }, "property:unknown-key");
  });

  it("refuses a declaration without a value field", () => {
    expectBagRefused({ "brand.name": { public: true } }, "property:invalid-declaration");
  });

  it("refuses an unknown descriptor field instead of guessing its meaning", () => {
    expectBagRefused(
      { "brand.name": { value: "Foundation Uno", isPublic: true } },
      "property:invalid-declaration",
    );
  });

  it("refuses a declaration that is not an object", () => {
    expectBagRefused({ "brand.name": "Foundation Uno" }, "property:invalid-declaration");
    expectBagRefused({ "brand.name": null }, "property:invalid-declaration");
  });

  it("refuses a non-string, blank or over-long value", () => {
    expectBagRefused({ "brand.name": { value: 42 } }, "property:invalid-value");
    expectBagRefused({ "brand.name": { value: true } }, "property:invalid-value");
    expectBagRefused({ "brand.name": { value: ["Foundation Uno"] } }, "property:invalid-value");
    expectBagRefused({ "brand.name": { value: "" } }, "property:invalid-value");
    expectBagRefused({ "brand.name": { value: "   " } }, "property:invalid-value");
    expectBagRefused({ "brand.name": { value: "x".repeat(MAX + 1) } }, "property:invalid-value");
  });

  it("accepts a value of exactly the declared bound", () => {
    const result = validateUnoPropertyBag({ "brand.name": { value: "x".repeat(MAX) } });
    expect(result.accepted).toBe(true);
  });

  it("refuses a non-boolean public flag without coercing it", () => {
    expectBagRefused(
      { "brand.name": { value: "Foundation Uno", public: "true" } },
      "property:invalid-public",
    );
    expectBagRefused(
      { "brand.name": { value: "Foundation Uno", public: 1 } },
      "property:invalid-public",
    );
  });
});


describe("hostile bag input", () => {
  it("refuses a __proto__ key without polluting Object.prototype", () => {
    const hostile = JSON.parse('{"__proto__": {"value": "polluted"}}') as unknown;
    expectBagRefused(hostile, "property:unknown-key");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("refuses an accessor without ever invoking it", () => {
    let reads = 0;
    const bag = {
      "brand.name": {
        get value(): string {
          reads += 1;
          return "Foundation Uno";
        },
      },
    };
    expectBagRefused(bag, "property:unreadable");
    expect(reads).toBe(0);
  });

  it("refuses a symbol-keyed bag", () => {
    const bag: Record<PropertyKey, unknown> = { "brand.name": { value: "Foundation Uno" } };
    bag[Symbol("brand.name")] = { value: "shadow" };
    expectBagRefused(bag, "property:unreadable");
  });

  it("refuses a bag with a non-plain prototype", () => {
    class Bag {
      "brand.name" = { value: "Foundation Uno" };
    }
    expectBagRefused(new Bag(), "property:unreadable");
  });

  it("refuses a Proxy whose own-key trap throws", () => {
    const bag = new Proxy(
      { "brand.name": { value: "Foundation Uno" } },
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    expectBagRefused(bag, "property:unreadable");
  });

  it("reads a Proxy's data descriptors without invoking its get trap", () => {
    let getCalls = 0;
    const bag = new Proxy(
      { "brand.name": { value: "Foundation Uno" } },
      {
        get(): never {
          getCalls += 1;
          throw new Error("the get trap must not run");
        },
      },
    );
    const result = validateUnoPropertyBag(bag);
    expect(result.accepted).toBe(true);
    expect(getCalls).toBe(0);
  });
});

describe("the nearest-ancestor cascade", () => {
  it("inherits an Entity declaration down to the representation", () => {
    const result = resolveUnoProperties(
      chain({ entity: { "brand.name": { value: "Foundation Uno" } } }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const resolution = result.resolved.properties["brand.name"];
    expect(resolution?.status).toBe("inherited");
    expect(resolution?.value).toBe("Foundation Uno");
    expect(resolution?.origin).toEqual({ level: "entity", id: ENTITY_ID });
  });

  it("declares a value authored at the queried level", () => {
    const result = resolveUnoProperties(
      chain({ representation: { "brand.name": { value: "Foundation Uno" } } }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const resolution = result.resolved.properties["brand.name"];
    expect(resolution?.status).toBe("declared");
    expect(resolution?.origin).toEqual({ level: "representation", id: "en-001" });
  });

  it("lets the nearest declaration win over a farther one", () => {
    const result = resolveUnoProperties(
      chain({
        entity: { "brand.name": { value: "Entity brand" } },
        site: { "brand.name": { value: "Site brand" } },
      }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const resolution = result.resolved.properties["brand.name"];
    expect(resolution?.value).toBe("Site brand");
    expect(resolution?.status).toBe("inherited");
    expect(resolution?.origin).toEqual({ level: "site", id: "main" });
  });

  it("inherits across a skipped level", () => {
    const result = resolveUnoProperties(
      chain({ facet: { "contact.name": { value: "Front Desk" } } }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.resolved.properties["contact.name"]?.origin).toEqual({
      level: "facet",
      id: "foundation",
    });
  });

  it("suppresses an inherited value with literal null", () => {
    const result = resolveUnoProperties(
      chain({
        entity: { "brand.name": { value: "Foundation Uno" } },
        site: { "brand.name": { value: null } },
      }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const resolution = result.resolved.properties["brand.name"];
    expect(resolution?.status).toBe("suppressed");
    expect(resolution?.value).toBeNull();
    expect(resolution?.origin).toEqual({ level: "site", id: "main" });
  });

describe("ancestry shape and hostile ancestry input", () => {
  it("refuses a non-array ancestry", () => {
    expectRefused({ level: "entity", id: ENTITY_ID }, "property:invalid-ancestry");
    expectRefused(null, "property:invalid-ancestry");
  });

  it("refuses an empty ancestry", () => {
    expectRefused([], "property:invalid-ancestry");
  });

  it("refuses an ancestry that starts below the Entity", () => {
    expectRefused([{ level: "facet", id: "foundation" }], "property:invalid-ancestry");
  });

  it("refuses a skipped level", () => {
    expectRefused(
      [
        { level: "entity", id: ENTITY_ID },
        { level: "site", id: "main" },
      ],
      "property:invalid-ancestry",
    );
  });

  it("refuses a repeated level", () => {
    expectRefused(
      [
        { level: "entity", id: ENTITY_ID },
        { level: "facet", id: "foundation" },
        { level: "facet", id: "foundation" },
      ],
      "property:invalid-ancestry",
    );
  });

  it("refuses an unknown field on a chain link", () => {
    expectRefused(
      [{ level: "entity", id: ENTITY_ID, host: "example.invalid" }],
      "property:invalid-ancestry",
    );
  });

  it("refuses a missing identifier on a chain link", () => {
    expectRefused([{ level: "entity" }], "property:invalid-ancestry");
  });

  it("refuses more links than the published depth", () => {
    const tooDeep = [
      { level: "entity", id: ENTITY_ID },
      { level: "facet", id: "foundation" },
      { level: "site", id: "main" },
      { level: "page", id: "home" },
      { level: "representation", id: "en-001" },
      { level: "representation", id: "en-002" },
    ];
    expectRefused(tooDeep, "property:invalid-ancestry");
  });

  it("refuses a malformed identifier at each level", () => {
    expectRefused([{ level: "entity", id: "e_NOTCROCKFORD" }], "property:invalid-id");
    expectRefused(
      [
        { level: "entity", id: ENTITY_ID },
        { level: "facet", id: "Foundation" },
      ],
      "property:invalid-id",
    );
    expectRefused(
      [
        { level: "entity", id: ENTITY_ID },
        { level: "facet", id: "foundation" },
        { level: "site", id: "main" },
        { level: "page", id: "home" },
        { level: "representation", id: "en_US" },
      ],
      "property:invalid-id",
    );
  });

  it("propagates a bag refusal from inside the chain", () => {
    expectRefused(
      chain({ site: { timezone: { value: "UTC" } } }),
      "property:unknown-key",
    );
  });
});

describe("resolution ownership, freezing and projection", () => {
  it("returns a deeply frozen result with a frozen origin", () => {
    const result = resolveUnoProperties(
      chain({ entity: { "brand.name": { value: "Foundation Uno" } } }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.isFrozen(result.resolved)).toBe(true);
    expect(Object.isFrozen(result.resolved.properties)).toBe(true);
    expect(Object.isFrozen(result.resolved.properties["brand.name"])).toBe(true);
    expect(Object.isFrozen(result.resolved.properties["brand.name"]?.origin)).toBe(true);
  });

  it("leaves the caller's ancestry untouched", () => {
    const ancestry = chain({ entity: { "brand.name": { value: "Foundation Uno" } } });
    const before = JSON.stringify(ancestry);
    resolveUnoProperties(ancestry);
    expect(JSON.stringify(ancestry)).toBe(before);
  });

  it("projects only non-suppressed values", () => {
    const result = resolveUnoProperties(
      chain({
        entity: {
          "brand.name": { value: "Foundation Uno", public: true },
          "contact.name": { value: "Front Desk" },
        },
        site: { "contact.name": { value: null } },
      }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const projected = projectUnoPropertyValues(result.resolved);
    expect(projected).toEqual({ "brand.name": "Foundation Uno" });
    expect(Object.isFrozen(projected)).toBe(true);
    expect("contact.name" in projected).toBe(false);
  });

  it("projects the same value whether public was omitted or set false", () => {
    const omitted = resolveUnoProperties(chain({ entity: { "brand.name": { value: "Brand A" } } }));
    const explicit = resolveUnoProperties(
      chain({ entity: { "brand.name": { value: "Brand A", public: false } } }),
    );
    expect(omitted.accepted).toBe(true);
    expect(explicit.accepted).toBe(true);
    if (!omitted.accepted || !explicit.accepted) return;
    expect(projectUnoPropertyValues(omitted.resolved)).toEqual(
      projectUnoPropertyValues(explicit.resolved),
    );
  });

  it("keeps public metadata out of the value projection even when true", () => {
    const result = resolveUnoProperties(
      chain({ representation: { "brand.name": { value: "Foundation Uno", public: true } } }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.resolved.properties["brand.name"]?.public).toBe(true);
    expect(Object.keys(projectUnoPropertyValues(result.resolved))).toEqual(["brand.name"]);
    expect(projectUnoPropertyValues(result.resolved)["brand.name"]).toBe("Foundation Uno");
  });
});


  it("does not let a grandparent restore a suppressed key", () => {
    const result = resolveUnoProperties(
      chain({
        entity: { "brand.name": { value: "Entity brand" } },
        page: { "brand.name": { value: null } },
      }),
    );
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.resolved.properties["brand.name"]?.status).toBe("suppressed");
    expect(result.resolved.properties["brand.name"]?.value).toBeNull();
  });

  it("keeps two sibling chains independent", () => {
    const first = resolveUnoProperties(
      chain({ site: { "brand.name": { value: "First site brand" } } }),
    );
    const second = resolveUnoProperties(chain({}));
    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    if (!first.accepted || !second.accepted) return;
    expect(first.resolved.properties["brand.name"]?.value).toBe("First site brand");
    expect(second.resolved.properties["brand.name"]).toBeUndefined();
  });

  it("omits a key that is declared nowhere", () => {
    const result = resolveUnoProperties(chain({ entity: { "brand.name": { value: "Foundation Uno" } } }));
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(Object.keys(result.resolved.properties)).toEqual(["brand.name"]);
    expect(result.resolved.properties["contact.email"]).toBeUndefined();
  });
});
