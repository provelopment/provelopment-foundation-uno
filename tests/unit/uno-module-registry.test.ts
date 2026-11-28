/**
 * `U02`: the module registry and a real synthetic-module exercise.
 *
 * The exercise the direction asks for: an additional module is registered, its props are validated, it is invoked
 * and rendered, it is disabled, and it is removed — all without editing an unrelated module, the Page document
 * grammar, the routing policy or the EFS. The production composition is checked at the same time, so the registry
 * cannot pass this suite while being disconnected from the build.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  createUnoModuleRegistry,
  UNO_ALL_CAPABILITIES,
  unoModulesEnabled,
} from "../../src/core/modules/module-registry";
import { createUnoModuleHost } from "../../src/components/uno-module-host";
import { collectUnoModuleIds, unoComposition, unoPageModulesAdmitted } from "../../src/composition/uno-composition";

/** A synthetic module: an approved capability id, a private render key and its own strict props reader. */
const SYNTHETIC = {
  id: "content.stats" as const,
  version: 1 as const,
  renderKey: "synthetic.notice",
  validate: (input: unknown) => {
    if (typeof input !== "object" || input === null) return null;
    const text = (input as { readonly text?: unknown }).text;
    return typeof text === "string" && text.length > 0 && text.length <= 40 ? { text } : null;
  },
};

describe("the module registry", () => {
  it("registers, validates, renders, disables and removes one added module", () => {
    const registry = createUnoModuleRegistry();
    const host = createUnoModuleHost(registry, {
      // A renderer that knows nothing about the registry, the Page document or routing.
      "synthetic.notice": ({ props }) => createElement("p", { className: "synthetic" }, (props as { text: string }).text),
    });

    // Nothing is registered yet, so nothing renders.
    expect(host(SYNTHETIC.id, { text: "hello" })).toBeNull();

    expect(registry.register(SYNTHETIC).ok).toBe(true);
    expect(registry.isEnabled(SYNTHETIC.id)).toBe(true);
    expect(registry.enabled().map((descriptor) => descriptor.id)).toEqual([SYNTHETIC.id]);

    // Invocation goes through the module's own reader: a good value renders, a bad one renders nothing.
    expect(renderToStaticMarkup(host(SYNTHETIC.id, { text: "hello" }) as never)).toContain("hello");
    expect(host(SYNTHETIC.id, { text: "" })).toBeNull();
    expect(host(SYNTHETIC.id, { text: 42 })).toBeNull();

    // Disabled: the module stays registered but cannot be invoked or rendered.
    expect(registry.disable(SYNTHETIC.id).ok).toBe(true);
    expect(registry.isEnabled(SYNTHETIC.id)).toBe(false);
    expect(host(SYNTHETIC.id, { text: "hello" })).toBeNull();
    expect(registry.validate(SYNTHETIC.id, { text: "hello" })).toEqual({ ok: false, reason: "module:unknown-module" });

    // Re-enabled, then removed: no descriptor remains.
    expect(registry.enable(SYNTHETIC.id).ok).toBe(true);
    expect(registry.remove(SYNTHETIC.id).ok).toBe(true);
    expect(registry.get(SYNTHETIC.id)).toBeUndefined();
    expect(host(SYNTHETIC.id, { text: "hello" })).toBeNull();
  });

  it("refuses an unapproved id, a wrong version, a duplicate, an unknown or missing dependency and a needed module", () => {
    const registry = createUnoModuleRegistry();
    expect(registry.register({ ...SYNTHETIC, id: "content.unknown" as never }).ok).toBe(false);
    expect(registry.register({ ...SYNTHETIC, version: 2 as never })).toEqual({
      ok: false,
      reason: "module:incompatible-version",
    });
    expect(registry.register({ ...SYNTHETIC, renderKey: "" }).ok).toBe(false);
    expect(registry.register({ ...SYNTHETIC, requires: ["interaction.tabs"] }).ok).toBe(false);
    expect(registry.register({ ...SYNTHETIC, requires: ["content.unknown" as never] }).ok).toBe(false);

    expect(registry.register(SYNTHETIC).ok).toBe(true);
    expect(registry.register(SYNTHETIC)).toEqual({ ok: false, reason: "module:duplicate" });

    // A module another enabled module requires cannot be removed while that dependency stands.
    const dependent = {
      id: "content.pricing" as const,
      version: 1 as const,
      renderKey: "synthetic.dependent",
      requires: [SYNTHETIC.id] as const,
    };
    expect(registry.register(dependent).ok).toBe(true);
    expect(registry.remove(SYNTHETIC.id)).toEqual({ ok: false, reason: "module:still-required" });
    expect(registry.remove(dependent.id).ok).toBe(true);
    expect(registry.remove(SYNTHETIC.id).ok).toBe(true);
  });

  it("keeps every approved capability enabled in the production composition", () => {
    expect(unoComposition.enabled().map((descriptor) => descriptor.id)).toEqual([...UNO_ALL_CAPABILITIES]);
    expect(unoModulesEnabled(unoComposition, [...UNO_ALL_CAPABILITIES])).toBe(true);
    // A capability the vocabulary does not carry, or a module this build does not enable, is not admitted.
    expect(unoModulesEnabled(unoComposition, ["content.unknown"])).toBe(false);
  });

  it("admits a served Page only when every module it declares is enabled", () => {
    const sections = [
      { id: "a", module: "layout.stack", children: [{ id: "b", module: "content.heading", props: { text: "x", level: 2 } }] },
    ];
    expect(collectUnoModuleIds(sections)).toEqual(["layout.stack", "content.heading"]);
    expect(unoPageModulesAdmitted(sections)).toBe(true);
    expect(unoPageModulesAdmitted([{ id: "c", module: "content.not-a-module" }])).toBe(false);
    expect(unoPageModulesAdmitted([{ id: "d", module: 42 }])).toBe(true);
  });
});
