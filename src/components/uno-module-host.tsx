/**
 * Foundation Uno — the module renderer host (`U02`, strengthened).
 *
 * WHAT THIS IS. The one bridge between the framework-free registry and React. A host is created from a registry and
 * a binding table (render key → renderer), and it renders exactly one module: the one whose id is enabled and whose
 * render key has a binding.
 *
 * FAIL-CLOSED. A disabled module, an unknown id, an unbound render key and refused props all render nothing at all
 * — never a placeholder, never partial markup, never a thrown error that would become an error page.
 *
 * WHAT IT IS NOT. It does not own routing, publication, the Page document or the built-in section renderer. It exists
 * so an added module can be rendered without editing the built-in switch, which is what module extensibility means
 * in practice.
 */
import type { ReactNode } from "react";

import { isCapabilityId, type UnoModuleRegistry } from "../core/modules/module-registry";

/** What one renderer receives: the descriptor that admitted it, and its validated props. */
export interface UnoModuleRendererInput {
  readonly renderKey: string;
  readonly props: unknown;
}

/** A renderer. A plain function, so nothing here depends on a component convention. */
export type UnoModuleRenderer = (input: UnoModuleRendererInput) => ReactNode;

/** The host: render one module by id, or nothing. */
export type UnoModuleHost = (id: string, input: unknown) => ReactNode | null;

/**
 * Create a host bound to one registry and one binding table.
 *
 * The binding table is a frozen record keyed by `renderKey`, so a module cannot be rendered by guessing an id, and
 * two descriptors cannot share one renderer unless the composition says so explicitly.
 */
export function createUnoModuleHost(
  registry: UnoModuleRegistry,
  bindings: Readonly<Record<string, UnoModuleRenderer>>,
): UnoModuleHost {
  return function renderModule(id, input) {
    const descriptor = isCapabilityId(id) && registry.isEnabled(id) ? registry.get(id) : undefined;
    if (descriptor === undefined) return null;
    const renderer = bindings[descriptor.renderKey];
    if (renderer === undefined) return null;
    const validated = registry.validate(descriptor.id, input);
    if (!validated.ok) return null;
    return renderer({ renderKey: descriptor.renderKey, props: validated.props });
  };
}
