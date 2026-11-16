/**
 * Foundation Uno — the declared Page-source resolution use case.
 *
 * NEW UNO-OWNED ADAPTATION at the application layer. The separation between *which declared source
 * answers* and *how a concrete reader produces it* is adapted in concept from the pinned Foundation
 * GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`:
 * `src/application/page-source-resolution.ts` (blob `05060f116a7f2703db42d8e7c10d57bc2e5748ed`,
 * 4,261 bytes, class **REWRITE**) and, behind it, `src/core/page-source.ts`
 * (blob `8071f0a425dcbb5422d25be308ae2135cfd64219`, 12,614 bytes, class **ADAPT**). No upstream source
 * text, test code or fixture is copied, and its site codes, bare-locale lookup, provider layout and
 * default-locale fallback are **not** part of this contract.
 *
 * WHAT THIS MODULE DECIDES. Given one to two *declared* source observers for ONE already-identified
 * Page representation, it asks the approved pure policy in
 * `src/core/page-authoring-policy.ts` which declared kind answers, and it returns the opaque winning
 * source it was handed. It never re-implements that precedence: the core function
 * `selectDeclaredPageSource` remains the single decision authority, and this module calls it for the
 * accepted, the invalid and the empty cases alike.
 *
 * WHAT IT IS NOT. There is no EFS manifest, schema, graph, Site or Page locator here; no file path,
 * directory, locale mapping, parser, sanitiser, renderer, envelope or module prop; no URL, route,
 * metadata, sitemap, canonical, redirect or publication decision; no filesystem, network, provider or
 * environment access. Nothing here establishes that a Page exists, is published or is served. A
 * `valid` observation is a trusted dependency's report that a declared file was confined, read and
 * validated somewhere else. A declared file that is `invalid` is never silently treated as `absent`;
 * a failed preferred JSON observer is never followed by a Markdown attempt.
 *
 * TRUST BOUNDARY. `input` is a collection of injected ports — caller-supplied functions — never raw
 * author JSON, and never serialised content. The ports are validated *as data* before any of them is
 * invoked; a hostile record may not run code during that validation and a throwing port may not
 * escape as an exception. The opaque `source` value is pass-through only: it is never parsed,
 * sanitised, cloned, frozen, stringified, logged or compared.
 */
import { selectDeclaredPageSource } from "../core/page-authoring-policy";
import type {
  DeclaredPageSourceState,
  PageSourceKind,
  PageSourceSelectionRefusal,
} from "../core/page-authoring-policy";

/**
 * One trusted observation of a DECLARED source candidate.
 *
 * `absent` means the declared candidate was genuinely looked for and not found; `invalid` means it
 * was found and failed validation; `valid` carries the already-validated opaque body. The union is
 * closed on purpose: a source may not travel with `absent` or `invalid`, and `valid` may not travel
 * without one.
 */
export type DeclaredSourceObservation<TSource> =
  | { readonly state: "absent" }
  | { readonly state: "invalid" }
  | { readonly state: "valid"; readonly source: TSource };

/**
 * One injected observer port for one declared source kind.
 *
 * The port is constructed by a future trusted adapter after ownership and confinement checks, and is
 * never deserialised from authored content. It may be synchronous or asynchronous; either way it is
 * invoked at most once per resolution and only when the core precedence requires it.
 */
export interface DeclaredSourceObserver<TSource> {
  readonly kind: PageSourceKind;
  readonly observe: () =>
    | DeclaredSourceObservation<TSource>
    | Promise<DeclaredSourceObservation<TSource>>;
}

/**
 * Bounded refusals. The four local reasons describe the request itself; every other value is an exact
 * reason carried by the core policy, so a core refusal is never restated in different words.
 */
export type DeclaredPageSourceRefusal =
  | "invalid-input"
  | "invalid-observer"
  | "invalid-observation"
  | "observer-failed"
  | PageSourceSelectionRefusal;

/**
 * The resolved outcome for one representation: the selected kind with the caller's own source value,
 * or a bounded refusal. There is never a third shape and never a diagnostic payload.
 */
export type ResolvedDeclaredPageSource<TSource> =
  | { readonly accepted: true; readonly kind: PageSourceKind; readonly source: TSource }
  | { readonly accepted: false; readonly reason: DeclaredPageSourceRefusal };

/** A refused outcome, used for every bounded early exit. */
type RefusedResolution = { readonly accepted: false; readonly reason: DeclaredPageSourceRefusal };

function refused(reason: DeclaredPageSourceRefusal): RefusedResolution {
  return { accepted: false, reason };
}

/** True for a plain data record only: no array, no class instance, no exotic prototype. */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Copy a record's own enumerable data properties, or answer `null` when any of them is an accessor or
 * a symbol key. Descriptor reads never invoke a getter, so a hostile record cannot run code while it
 * is being classified — and `record.kind` is never accessed directly.
 */
function plainDataFields(record: Record<string, unknown>): Record<string, unknown> | null {
  if (Object.getOwnPropertySymbols(record).length > 0) return null;
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (descriptor === undefined || !("value" in descriptor)) return null;
    fields[key] = descriptor.value;
  }
  return fields;
}

/**
 * Read one observation record, or answer `null` when it is not exactly one of the three closed
 * shapes. `absent`/`invalid` may not carry a source, and `valid` may not omit one or carry
 * `undefined`/`null`: an unusable body is a malformed observation, never an absence.
 */
function readObservation<TSource>(value: unknown): DeclaredSourceObservation<TSource> | null {
  if (!isPlainRecord(value)) return null;
  const fields = plainDataFields(value);
  if (fields === null) return null;

  const keys = Object.keys(fields);
  const state = fields["state"];
  if (state === "absent" || state === "invalid") {
    return keys.length === 1 ? { state } : null;
  }
  if (state !== "valid") return null;
  if (keys.length !== 2 || !keys.includes("source")) return null;

  const source = fields["source"];
  if (source === undefined || source === null) return null;
  // Pass-through only: the value is never parsed, copied or coerced.
  return { state: "valid", source: source as TSource };
}

/** What one observer attempt produced: a usable observation, a failure, or a malformed payload. */
type ObservationAttempt<TSource> =
  | { readonly outcome: "observed"; readonly observation: DeclaredSourceObservation<TSource> }
  | { readonly outcome: "failed" }
  | { readonly outcome: "malformed" };

/**
 * Invoke one trusted observer exactly once and classify what it produced.
 *
 * A synchronous throw, a rejected promise or a hostile thenable all become `failed`; they never
 * escape as an exception and are never confused with an observed `absent`. The caller decides whether
 * falling through to another source is allowed — for JSON it is not.
 */
async function attemptObservation<TSource>(
  port: DeclaredSourceObserver<TSource>,
): Promise<ObservationAttempt<TSource>> {
  let raw: unknown;
  try {
    raw = await port.observe();
  } catch {
    return { outcome: "failed" };
  }
  const observation = readObservation<TSource>(raw);
  return observation === null
    ? { outcome: "malformed" }
    : { outcome: "observed", observation };
}

/** One declaration/observation pair handed to the core policy. */
type DeclaredState = { readonly kind: PageSourceKind; readonly state: DeclaredPageSourceState };

/**
 * Ask the single decision authority. The records are rebuilt here so the core receives exactly the
 * two own keys it accepts, and its answer — accepted kind or bounded reason — is returned unchanged.
 */
function askCorePolicy(
  declarations: readonly DeclaredState[],
): { readonly accepted: true; readonly kind: PageSourceKind } | RefusedResolution {
  const selection = selectDeclaredPageSource(
    declarations.map((declaration) => ({
      kind: declaration.kind,
      state: declaration.state,
    })),
  );
  if (!selection.accepted) return refused(selection.reason);
  return { accepted: true, kind: selection.kind };
}

/** The validated ports of one request, or a bounded refusal. */
type PortsResult<TSource> =
  | { readonly accepted: true; readonly ports: readonly DeclaredSourceObserver<TSource>[] }
  | RefusedResolution;

/**
 * Validate the whole collection as DATA before any observer is invoked.
 *
 * Each port must be a plain record with exactly `kind` and `observe`; `kind` must be exactly `json`
 * or `markdown` (unique), and `observe` must be a function. Accessors, symbol keys, exotic prototypes,
 * duplicate kinds, unknown casing, extra or missing keys and non-function observers all refuse here,
 * so a malformed request can never cause an observer to run.
 */
function readObserverPorts<TSource>(input: unknown): PortsResult<TSource> {
  if (!Array.isArray(input)) return refused("invalid-input");
  if (input.length < 1 || input.length > 2) return refused("invalid-input");

  const ports: DeclaredSourceObserver<TSource>[] = [];
  const kinds = new Set<PageSourceKind>();
  for (const candidate of input) {
    if (!isPlainRecord(candidate)) return refused("invalid-observer");
    const fields = plainDataFields(candidate);
    if (fields === null) return refused("invalid-observer");

    const keys = Object.keys(fields);
    if (keys.length !== 2 || !keys.includes("kind") || !keys.includes("observe")) {
      return refused("invalid-observer");
    }

    const kind = fields["kind"];
    if (kind !== "json" && kind !== "markdown") return refused("invalid-observer");
    if (kinds.has(kind)) return refused("invalid-observer");

    const observe = fields["observe"];
    if (typeof observe !== "function") return refused("invalid-observer");

    kinds.add(kind);
    ports.push({ kind, observe: observe as DeclaredSourceObserver<TSource>["observe"] });
  }

  return { accepted: true, ports };
}

/**
 * Ask the core policy for a refusal it is expected to give. If a future core change ever accepted
 * this declaration set, the use case still fails closed instead of inventing a source, and the
 * integration test that asserts the core's reason fails loudly.
 */
function refuseViaCorePolicy(
  declarations: readonly DeclaredState[],
  fallback: DeclaredPageSourceRefusal,
): RefusedResolution {
  const selection = askCorePolicy(declarations);
  return selection.accepted ? refused(fallback) : selection;
}

/**
 * Resolve ONE already-identified Page representation from trusted, injected observer ports.
 *
 * Order of work, which is the material invariant of this use case:
 *
 * 1. The whole port collection is validated before anything runs; the request is refused if it is
 *    not one or two plain port records with unique `json`/`markdown` kinds and function observers.
 * 2. A declared JSON observer is invoked once. A throw, a rejected promise, a malformed observation
 *    or an `invalid` observation refuses immediately and Markdown is never consulted — a declared
 *    but broken preferred source is not an absence.
 * 3. A `valid` JSON observation is confirmed through the core policy and returned with the caller's
 *    own source value, by reference.
 * 4. Only a declared-and-`absent` JSON (or no JSON declaration at all) allows the declared Markdown
 *    observer to run, once; the core policy confirms the selection from the actually observed states.
 * 5. Otherwise the core policy supplies the bounded refusal. No source is fabricated, no undeclared
 *    kind is consulted and no fallback identity is invented.
 */
export async function resolveDeclaredPageSource<TSource>(
  input: unknown,
): Promise<ResolvedDeclaredPageSource<TSource>> {
  let ports: readonly DeclaredSourceObserver<TSource>[];
  try {
    const validated = readObserverPorts<TSource>(input);
    if (!validated.accepted) return validated;
    ports = validated.ports;
  } catch {
    // A hostile collection or proxy trap may throw while being classified. Never propagate it.
    return refused("invalid-input");
  }

  const json = ports.find((port) => port.kind === "json");
  const markdown = ports.find((port) => port.kind === "markdown");
  const observed: DeclaredState[] = [];

  if (json !== undefined) {
    const attempt = await attemptObservation(json);
    if (attempt.outcome === "failed") return refused("observer-failed");
    if (attempt.outcome === "malformed") return refused("invalid-observation");

    const observation = attempt.observation;
    observed.push({ kind: "json", state: observation.state });

    if (observation.state === "invalid") {
      // Declared-but-invalid preferred JSON refuses: Markdown is never consulted, and the core
      // policy supplies the exact `invalid-json-source` reason.
      return refuseViaCorePolicy(observed, "invalid-json-source");
    }
    if (observation.state === "valid") {
      const selection = askCorePolicy(observed);
      if (!selection.accepted) return selection;
      return { accepted: true, kind: "json", source: observation.source };
    }
    // Declared and absent: a declared Markdown candidate may still answer.
  }

  if (markdown !== undefined) {
    const attempt = await attemptObservation(markdown);
    if (attempt.outcome === "failed") return refused("observer-failed");
    if (attempt.outcome === "malformed") return refused("invalid-observation");

    const observation = attempt.observation;
    observed.push({ kind: "markdown", state: observation.state });

    const selection = askCorePolicy(observed);
    if (!selection.accepted) return selection;
    if (observation.state !== "valid") {
      // The core selects only a valid Markdown candidate; never hand back an unvalidated body.
      return refused("invalid-observation");
    }
    return { accepted: true, kind: "markdown", source: observation.source };
  }

  // Nothing declared can answer: the core policy derives the bounded `no-valid-source` refusal.
  return refuseViaCorePolicy(observed, "no-valid-source");
}
