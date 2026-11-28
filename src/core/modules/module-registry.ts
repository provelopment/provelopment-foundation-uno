/**
 * Foundation Uno — the module registry (`U02`, strengthened).
 *
 * WHAT THIS IS. A typed, versioned, compile-time registration surface for Uno's modules. It answers four
 * questions and nothing else: may this module be registered, which modules are currently enabled, what props does
 * one module accept, and may this module be removed.
 *
 * FAIL-CLOSED. An unapproved capability id, an unsupported version, a duplicate registration, a missing or unknown
 * dependency and a removal another module still needs are all refused with a closed reason. A module is never
 * silently replaced, never inferred from a directory name and never enabled by importing it.
 *
 * WHY THIS IS SAFE. Registration is code, not data: there is no authored plugin manifest, no dynamic evaluation,
 * no filesystem discovery and no arbitrary executable content. A module added at build time is a TypeScript value a
 * reviewer can read.
 *
 * WHAT IT IS NOT. Not a renderer, not a route table, not a capability grant and not a sandbox. Publication,
 * identity, ownership, visibility and privacy authority stay outside it — a registered module cannot publish,
 * cannot address a request and cannot widen a Site's authority.
 */
import { CAPABILITY_IDS, isCapabilityId, type CapabilityId } from "./capability-registry";

export { isCapabilityId } from "./capability-registry";
export type { CapabilityId } from "./capability-registry";

/** The one registration version this build understands. */
export const UNO_MODULE_VERSION = 1 as const;

/** A module's declared props reader: a pure function from untrusted input to props, or `null` when refused. */
export type UnoModulePropsReader<Props = unknown> = (input: unknown) => Props | null;

/** One module descriptor. Everything about a module that the registry needs to know. */
export interface UnoModuleDescriptor {
  /** The approved capability id this module implements. */
  readonly id: CapabilityId;
  /** The registration version. Bumped only when the descriptor's own shape changes. */
  readonly version: typeof UNO_MODULE_VERSION;
  /** The opaque key a renderer host resolves. Never a path, a package name or a URL. */
  readonly renderKey: string;
  /** Modules that must already be registered and enabled. Declared, never inferred. */
  readonly requires?: readonly CapabilityId[];
  /** The props reader, when the module accepts props. Omitted means "the document validator is the authority". */
  readonly validate?: UnoModulePropsReader;
}

/** A closed registration/removal failure. */
export type UnoModuleIssue =
  | "module:unknown-capability"
  | "module:incompatible-version"
  | "module:invalid-descriptor"
  | "module:duplicate"
  | "module:missing-dependency"
  | "module:unknown-module"
  | "module:still-required";

/** A tagged result: the value, or one closed reason and no partial state. */
export type UnoModuleResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: UnoModuleIssue };

/** A props validation result. */
export type UnoModulePropsResult<Props> =
  | { readonly ok: true; readonly props: Props }
  | { readonly ok: false; readonly reason: "module:props-refused" | "module:unknown-module" };

/** The registry surface. */
export interface UnoModuleRegistry {
  register(descriptor: UnoModuleDescriptor): UnoModuleResult<UnoModuleDescriptor>;
  disable(id: CapabilityId): UnoModuleResult<UnoModuleDescriptor>;
  enable(id: CapabilityId): UnoModuleResult<UnoModuleDescriptor>;
  remove(id: CapabilityId): UnoModuleResult<UnoModuleDescriptor>;
  get(id: CapabilityId): UnoModuleDescriptor | undefined;
  isEnabled(id: CapabilityId): boolean;
  /** Every enabled descriptor, in registration order. Deterministic by construction. */
  enabled(): readonly UnoModuleDescriptor[];
  /** Validate one module's props through its own reader, or refuse. */
  validate(id: CapabilityId, input: unknown): UnoModulePropsResult<unknown>;
}

/** Validate a descriptor's own shape before it can enter the registry. */
function descriptorIssue(descriptor: UnoModuleDescriptor): UnoModuleIssue | null {
  if (!isCapabilityId(descriptor.id)) return "module:unknown-capability";
  if (descriptor.version !== UNO_MODULE_VERSION) return "module:incompatible-version";
  if (typeof descriptor.renderKey !== "string" || descriptor.renderKey.length === 0) {
    return "module:invalid-descriptor";
  }
  for (const dependency of descriptor.requires ?? []) {
    if (!isCapabilityId(dependency)) return "module:unknown-capability";
    if (dependency === descriptor.id) return "module:invalid-descriptor";
  }
  if (descriptor.validate !== undefined && typeof descriptor.validate !== "function") {
    return "module:invalid-descriptor";
  }
  return null;
}

/** Every approved capability id, in canonical order. Exported so a composition can register the whole vocabulary. */

/**
 * Create an empty registry.
 *
 * Each registry is independent, so a test can build one with a synthetic module without touching the production
 * composition, and the production composition cannot be widened by a test.
 */
export function createUnoModuleRegistry(): UnoModuleRegistry {
  const registered = new Map<CapabilityId, UnoModuleDescriptor>();
  const disabled = new Set<CapabilityId>();
  const order: CapabilityId[] = [];

  const fail = (reason: UnoModuleIssue) => ({ ok: false as const, reason });

  return {
    register(descriptor) {
      const issue = descriptorIssue(descriptor);
      if (issue !== null) return fail(issue);
      if (registered.has(descriptor.id)) return fail("module:duplicate");
      for (const dependency of descriptor.requires ?? []) {
        if (!registered.has(dependency)) return fail("module:missing-dependency");
      }
      registered.set(descriptor.id, Object.freeze({ ...descriptor }));
      order.push(descriptor.id);
      return { ok: true, value: registered.get(descriptor.id) as UnoModuleDescriptor };
    },

    disable(id) {
      const descriptor = registered.get(id);
      if (descriptor === undefined) return fail("module:unknown-module");
      disabled.add(id);
      return { ok: true, value: descriptor };
    },

    enable(id) {
      const descriptor = registered.get(id);
      if (descriptor === undefined) return fail("module:unknown-module");
      disabled.delete(id);
      return { ok: true, value: descriptor };
    },

    remove(id) {
      const descriptor = registered.get(id);
      if (descriptor === undefined) return fail("module:unknown-module");
      // A module another enabled module declares as a dependency cannot be removed: the graph stays consistent.
      for (const candidate of registered.values()) {
        if (candidate.id === id) continue;
        if (disabled.has(candidate.id)) continue;
        if ((candidate.requires ?? []).includes(id)) return fail("module:still-required");
      }
      registered.delete(id);
      disabled.delete(id);
      const index = order.indexOf(id);
      if (index !== -1) order.splice(index, 1);
      return { ok: true, value: descriptor };
    },

    get(id) {
      return registered.get(id);
    },

    isEnabled(id) {
      return registered.has(id) && !disabled.has(id);
    },

    enabled() {
      const list: UnoModuleDescriptor[] = [];
      for (const id of order) {
        const descriptor = registered.get(id);
        if (descriptor !== undefined && !disabled.has(id)) list.push(descriptor);
      }
      return Object.freeze(list);
    },

    validate(id, input) {
      const descriptor = registered.get(id);
      if (descriptor === undefined || disabled.has(id)) return { ok: false, reason: "module:unknown-module" };
      if (descriptor.validate === undefined) return { ok: true, props: input };
      const props = descriptor.validate(input);
      return props === null ? { ok: false, reason: "module:props-refused" } : { ok: true, props };
    },
  };
}

/** The registered capability ids of one registry, for a caller that needs to compare against the vocabulary. */
export function unoRegisteredCapabilities(registry: UnoModuleRegistry): readonly CapabilityId[] {
  return registry.enabled().map((descriptor) => descriptor.id);
}

/** True when every id in `ids` is an approved capability that this registry currently enables. */
export function unoModulesEnabled(registry: UnoModuleRegistry, ids: readonly string[]): boolean {
  return ids.every((id) => isCapabilityId(id) && registry.isEnabled(id));
}

export const UNO_ALL_CAPABILITIES: readonly CapabilityId[] = CAPABILITY_IDS;
