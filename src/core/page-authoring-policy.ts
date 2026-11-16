/**
 * Foundation Uno — the Page-authoring policy.
 *
 * NEW UNO-OWNED ADAPTATION. Two pure decisions are adapted at the concept level from the pinned
 * Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`:
 *
 * - `src/core/page-source.ts` (Git blob `8071f0a425dcbb5422d25be308ae2135cfd64219`, 12,614 bytes)
 *   — ADAPT: the idea of a declared JSON-before-Markdown order and of failing closed. Its source
 *   layout, site codes, bare-locale lookup and default-locale fallback are **rejected** here.
 * - `src/application/page-source-resolution.ts` (blob `05060f116a7f2703db42d8e7c10d57bc2e5748ed`,
 *   4,261 bytes) — REWRITE as one pure, observation-only policy with no provider, no reader and no
 *   I/O; its test categories (blob `ca3abff92116ea9157f00dd355fe5c7eda5da883`, 4,710 bytes) were
 *   read only as reference, never copied.
 * - `src/core/page-document.ts` (blob `a12d964c43626c6313a621bf628f5cc24b65d444`, 45,106 bytes) —
 *   DEFER: its Page schema, section families and document fields are **not** adopted here. Only
 *   the approved `public | unlisted` vocabulary and the reserved Home rule appear.
 *
 * No upstream source, fixture, asset or prose block is copied.
 *
 * TWO NARROW DECISIONS, NOTHING ELSE
 * ----------------------------------
 * A. Which declared source answers ONE already-identified representation. The caller supplies a
 *    finite list of 1-2 declaration records (`kind` + observed `state`), produced by a future,
 *    trusted adapter AFTER it has confined and read real files. A first valid JSON record wins; a
 *    declared-but-invalid JSON refuses even when valid Markdown exists; valid Markdown may answer
 *    only when JSON is declared absent or not declared at all.
 * B. Which visibility vocabulary the selected source may carry: JSON may say `public` or
 *    `unlisted` (default `public`), Markdown may say nothing at all and is `public`, and the
 *    reserved Home representation can never be `unlisted`.
 *
 * WHAT THESE FUNCTIONS CANNOT KNOW. Neither establishes that any source exists, is owned, is
 * readable, is confined to a directory, or belongs to the selected public Site. `absent` is the
 * adapter's observation, never something these functions may test. A visibility value is a
 * vocabulary decision only: it grants no access control, no routing, no indexing change, no
 * sitemap entry, no redirect, no body and no publication. Unlisted content is not protected
 * content. Locale mapping, JSON structure/section validation, Site selection and Markdown
 * sanitisation all remain later-stage work.
 *
 * Both entry points accept `unknown`, never throw for malformed input, never coerce a value
 * (so no `toString`, `valueOf` or `Symbol.toPrimitive` is invoked), never interpolate caller data
 * into a refusal, and never mutate their argument.
 */
import { HOME_CONTENT_SLUG } from "./page-content";
import { isPageRoutePath } from "./page-route-path";

/** The only source kinds an author may declare for one representation, in precedence order. */
export const DECLARED_PAGE_SOURCE_KINDS = Object.freeze(["json", "markdown"] as const);

/** The only observations an adapter may report for a declared candidate. */
export const DECLARED_PAGE_SOURCE_STATES = Object.freeze(["absent", "valid", "invalid"] as const);

/** The only Page-document visibility values in this stage's vocabulary. */
export const PAGE_VISIBILITIES = Object.freeze(["public", "unlisted"] as const);

export type PageSourceKind = (typeof DECLARED_PAGE_SOURCE_KINDS)[number];
export type DeclaredPageSourceState = (typeof DECLARED_PAGE_SOURCE_STATES)[number];
export type PageVisibility = (typeof PAGE_VISIBILITIES)[number];

/** Why a source selection was refused. Every reason means "no source answers". */
export type PageSourceSelectionRefusal =
  | "candidates-not-an-array"
  | "no-candidates"
  | "too-many-candidates"
  | "candidate-not-a-plain-object"
  | "candidate-not-plain-data"
  | "candidate-shape"
  | "unknown-source-kind"
  | "unknown-source-state"
  | "duplicate-source-kind"
  | "invalid-json-source"
  | "invalid-markdown-source"
  | "no-valid-source"
  | "unreadable-input";

/** Why a visibility decision was refused. Each is bounded and carries no caller data. */
export type PageVisibilityRefusal =
  | "input-not-a-plain-object"
  | "input-not-plain-data"
  | "unexpected-key"
  | "missing-field"
  | "unknown-source-kind"
  | "invalid-route-path"
  | "unknown-visibility"
  | "markdown-visibility-not-allowed"
  | "home-cannot-be-unlisted"
  | "unreadable-input";

/** The one declared source that answers, or a bounded refusal. Never a Page object or a body. */
export type PageSourceSelection =
  | { readonly accepted: true; readonly kind: PageSourceKind }
  | { readonly accepted: false; readonly reason: PageSourceSelectionRefusal };

/** The visibility vocabulary decision, or a bounded refusal. Never a serving instruction. */
export type PageVisibilityDecision =
  | { readonly accepted: true; readonly visibility: PageVisibility }
  | { readonly accepted: false; readonly reason: PageVisibilityRefusal };

function selectRefused(reason: PageSourceSelectionRefusal): PageSourceSelection {
  return { accepted: false, reason };
}

function visibilityRefused(reason: PageVisibilityRefusal): PageVisibilityDecision {
  return { accepted: false, reason };
}

/** True for a plain data record only: no array, no class instance, no exotic prototype. */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Copy a record's own enumerable data properties, or answer `null` when any of them is an
 * accessor or a symbol key. Reading descriptors never invokes a getter, so a hostile record cannot
 * run code during classification.
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

function isPageSourceKind(value: unknown): value is PageSourceKind {
  return value === "json" || value === "markdown";
}

function isDeclaredPageSourceState(value: unknown): value is DeclaredPageSourceState {
  return value === "absent" || value === "valid" || value === "invalid";
}

function isPageVisibility(value: unknown): value is PageVisibility {
  return value === "public" || value === "unlisted";
}

/**
 * Select the one declared source that answers ONE already-identified representation.
 *
 * `input` is a finite array of 1-2 plain records that each carry exactly `kind` and `state`. It is
 * internal function-input modelling, **not** a manifest schema: it carries no path, locale, owner,
 * body or validation detail, and it says nothing about whether a declared file really exists. The
 * caller's adapter establishes that, and reports it as `absent`, independently.
 *
 * Precedence, applied per representation only: `json` observed `valid` wins (even if Markdown is
 * `invalid`); `json` observed `invalid` refuses outright; `json` observed `absent` (or not
 * declared) lets a declared `valid` Markdown answer; nothing else answers. There is no fallback to
 * another locale, Site, directory or Page, because this function has no such input and invents none.
 */
export function selectDeclaredPageSource(input: unknown): PageSourceSelection {
  try {
    if (!Array.isArray(input)) return selectRefused("candidates-not-an-array");
    if (input.length === 0) return selectRefused("no-candidates");
    if (input.length > 2) return selectRefused("too-many-candidates");

    const states = new Map<PageSourceKind, DeclaredPageSourceState>();
    for (const candidate of input) {
      if (!isPlainRecord(candidate)) return selectRefused("candidate-not-a-plain-object");
      const fields = plainDataFields(candidate);
      if (fields === null) return selectRefused("candidate-not-plain-data");

      const keys = Object.keys(fields);
      if (keys.length !== 2 || !keys.includes("kind") || !keys.includes("state")) {
        return selectRefused("candidate-shape");
      }

      const kind = fields["kind"];
      const state = fields["state"];
      if (!isPageSourceKind(kind)) return selectRefused("unknown-source-kind");
      if (!isDeclaredPageSourceState(state)) return selectRefused("unknown-source-state");
      if (states.has(kind)) return selectRefused("duplicate-source-kind");
      states.set(kind, state);
    }

    if (states.get("json") === "valid") return { accepted: true, kind: "json" };
    if (states.get("json") === "invalid") return selectRefused("invalid-json-source");
    if (states.get("markdown") === "valid") return { accepted: true, kind: "markdown" };
    if (states.get("markdown") === "invalid") return selectRefused("invalid-markdown-source");
    return selectRefused("no-valid-source");
  } catch {
    // A hostile record or proxy can throw from a trap. Malformed input never propagates a throw.
    return selectRefused("unreadable-input");
  }
}

/**
 * Decide the visibility vocabulary for the source that was already selected.
 *
 * The caller passes the selected kind, a validated Uno authoring `routePath` and, for a JSON
 * selection only, an optional document `visibility`. A Markdown source has no visibility metadata
 * at all: its only valid declaration is the absence of one, and the outcome is `public`, because
 * Markdown must never acquire a field it cannot honour. The reserved root Home representation
 * (`routePath === HOME_CONTENT_SLUG`) may be `public` but never `unlisted`; a nested path such as
 * `offers/home` is an ordinary Route, not the reserved Home.
 *
 * This is a vocabulary decision and nothing more. It cannot say whether the JSON document was
 * validated, where any file came from, which Site owns the Page, whether the Page is reachable,
 * indexable, listed or protected. `unlisted` is not access control: only a later stage may decide
 * whether such a Page is routed at all, and no result here produces a URL, header, redirect, body,
 * sitemap entry or publication state.
 */
export function decideSelectedPageVisibility(input: unknown): PageVisibilityDecision {
  try {
    if (!isPlainRecord(input)) return visibilityRefused("input-not-a-plain-object");
    const fields = plainDataFields(input);
    if (fields === null) return visibilityRefused("input-not-plain-data");

    const keys = Object.keys(fields);
    for (const key of keys) {
      if (key !== "source" && key !== "routePath" && key !== "visibility") {
        return visibilityRefused("unexpected-key");
      }
    }
    if (!keys.includes("source") || !keys.includes("routePath")) {
      return visibilityRefused("missing-field");
    }

    const source = fields["source"];
    if (!isPageSourceKind(source)) return visibilityRefused("unknown-source-kind");

    const routePath = fields["routePath"];
    if (typeof routePath !== "string" || !isPageRoutePath(routePath)) {
      return visibilityRefused("invalid-route-path");
    }

    // `visibility: undefined` is a DECLARATION with an unusable value, not an omission.
    const declaresVisibility = keys.includes("visibility");
    const visibility = fields["visibility"];
    if (declaresVisibility && !isPageVisibility(visibility)) {
      return visibilityRefused("unknown-visibility");
    }

    if (source === "markdown") {
      // Even `visibility: "public"` would be Markdown metadata authority it must never have.
      if (declaresVisibility) return visibilityRefused("markdown-visibility-not-allowed");
      return { accepted: true, visibility: "public" };
    }

    if (!declaresVisibility) return { accepted: true, visibility: "public" };
    if (visibility === "unlisted") {
      if (routePath === HOME_CONTENT_SLUG) return visibilityRefused("home-cannot-be-unlisted");
      return { accepted: true, visibility: "unlisted" };
    }
    return { accepted: true, visibility: "public" };
  } catch {
    return visibilityRefused("unreadable-input");
  }
}
