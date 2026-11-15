/**
 * Foundation Uno — the content-slug contract.
 *
 * ADAPTED for Uno from the pinned Foundation GEO-03 commit
 * `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, file `src/core/page-content.ts`
 * (Git blob `49014ecbe5152244ffb40eceee56359f0b9d55d1`). The slug grammar is retained as
 * the same contract; the Foundation Site/country selectors around it are NOT adopted.
 *
 * This file is an adaptation, not a byte-for-byte copy. In Uno only
 * `src/core/efs/identity.ts` carries upstream Git blob identity.
 *
 * A content slug is simultaneously a **filename** and a **URL path segment**, so the rule
 * is declared once here and imported by everything that must agree on it. The rule is
 * deliberately conservative: lowercase alphanumerics in hyphen-separated words. That keeps
 * a slug safe as a filename on every filesystem, safe to join into a path without escaping,
 * and stable as a URL. It also makes a file such as `README.md`, `.gitkeep` or any other
 * placeholder intrinsically non-routable.
 *
 * The slug decides what an AUTHORING file may be called. It does not publish anything: no
 * route, Site, locale representation or manifest is implied by a valid slug.
 */

/** THE ONE CONTENT-SLUG RULE: lowercase alphanumerics in hyphen-separated words. */
export const CONTENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * True when `value` may be used as a content slug (and therefore as a page filename).
 *
 * The `unknown` signature is deliberate: the type guard refuses a non-string BEFORE any
 * regular-expression coercion, so an object with a custom `toString` can never be read as
 * an authored slug.
 */
export function isContentSlug(value: unknown): value is string {
  return typeof value === "string" && CONTENT_SLUG_PATTERN.test(value);
}

/**
 * The RESERVED content slug for a Site's HOME page.
 *
 * Declared once so no caller can re-derive its own literal and drift. As in the upstream
 * contract this reserves the authoring slug only; Uno has no home route, no locale root and
 * no sitemap yet, and this constant authorises none of them.
 */
export const HOME_CONTENT_SLUG = "home";

/**
 * An internal authoring value for one Page representation.
 *
 * Two deliberate differences from the upstream type, so it cannot be mistaken for runtime
 * publication truth:
 *
 * 1. `locale` must be an **authored, canonical, full-region** locale (see
 *    `src/core/efs/uno-locales.ts`). Uno does not record a locale chosen by fallback, so
 *    the field never means "the locale actually served after a fallback".
 * 2. `routePath` is a **relative authoring path** only. It carries no Site code, no country
 *    folder and no leading or trailing separator.
 *
 * The body stays raw Markdown: converting Markdown to HTML is a presentation concern.
 */
export interface PageContent {
  /** The page's route path inside its locale directory, e.g. `offerings/website-design`. */
  readonly routePath: string;
  /** The authored, canonical, full-region locale of this representation. */
  readonly locale: string;
  readonly title: string;
  readonly body: string;
  /** Optional author-supplied search/social summary; purely additive. */
  readonly description?: string;
}
