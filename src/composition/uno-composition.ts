/**
 * Foundation Uno — the composition root.
 *
 * WHAT THIS IS. The one place that decides which modules this build enables. It is deliberately thin: it registers
 * the approved capability vocabulary, exposes the page-admission check the serving path uses, and nothing else. It
 * owns no business rule, no rendering, no transport and no request handling.
 *
 * WHY A COMPOSITION ROOT. Dependencies point inward everywhere else. A module does not know whether it is enabled,
 * an adapter does not know who calls it, and the serving path does not know how a module is built. Only this file
 * puts them together, so "which modules exist in this build" has exactly one answer a reviewer can read.
 */
import {
  UNO_ALL_CAPABILITIES,
  createUnoModuleRegistry,
  isCapabilityId,
  type UnoModuleRegistry,
} from "../core/modules/module-registry";

/**
 * The registrations of the production composition.
 *
 * The 22 approved capabilities are registered with a render key equal to their own id, and no props reader: the
 * validated Page document remains the authority for built-in props, so a reader here would be a second, weaker
 * copy of rules the validator already enforces.
 */
export function createUnoComposition(): UnoModuleRegistry {
  const registry = createUnoModuleRegistry();
  for (const id of UNO_ALL_CAPABILITIES) {
    const registered = registry.register({ id, version: 1, renderKey: id });
    // A duplicate or unknown registration can only mean the vocabulary itself is broken, which the type system and
    // this loop together make impossible; throwing here would be a build-time defect, not a runtime condition.
    if (!registered.ok) throw new Error(`uno-composition:${registered.reason}`);
  }
  return registry;
}

/** The production composition, built once per process. */
export const unoComposition: UnoModuleRegistry = createUnoComposition();

/** Collect every module id a validated section tree declares, in document order. */
export function collectUnoModuleIds(sections: unknown, into: string[] = []): readonly string[] {
  if (!Array.isArray(sections)) return into;
  for (const section of sections) {
    if (typeof section !== "object" || section === null) continue;
    const record = section as { readonly module?: unknown; readonly children?: unknown };
    if (typeof record.module === "string") into.push(record.module);
    if (Array.isArray(record.children)) collectUnoModuleIds(record.children, into);
  }
  return into;
}

/**
 * True when this build enables every module one Page declares.
 *
 * Used by the serving path as the renderer admission check: a Page whose document names a module this composition
 * does not enable is not served, rather than rendered partially. With the full vocabulary registered the answer is
 * always true for a valid document, so the check costs a reviewable guarantee and changes no behaviour.
 */
export function unoPageModulesAdmitted(sections: unknown): boolean {
  for (const id of collectUnoModuleIds(sections)) {
    if (!isCapabilityId(id) || !unoComposition.isEnabled(id)) return false;
  }
  return true;
}
