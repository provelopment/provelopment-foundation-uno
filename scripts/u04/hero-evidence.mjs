/**
 * Foundation Uno — the Hero family's shared verification expectations (`UNO-WO-112 / R01`).
 *
 * WHY THIS IS A MODULE. The served hero region, its two approved actions and its whole-source refusal matrix are read by
 * the production gate's HTTP check, by its Chromium check and by the unit tests. One definition means the fixture, the
 * assertions and the tests cannot drift apart, and a family change is edited once.
 *
 * WHAT IT IS NOT. No authority and no I/O: every function here is a pure predicate over a string or over inert authored
 * data, so it can be exercised without a server, a browser or a file.
 */
import { HERO_ACTIONS } from "./family-fixture.mjs";

/** The one composed hero region this proof reads. */
export const HERO_ID = "family-9-hero";

/** The authored hero exactly as the fixture composes it — the single source of truth for every Hero assertion. */
export const HERO_EXPECTED = Object.freeze({
  id: HERO_ID,
  eyebrow: "Synthetic introduction",
  lede: "The composed Page is **visible** on one bounded site.",
  ledeText: "The composed Page is visible on one bounded site.",
  ledeStrong: "visible",
  support: "This is a *bounded*, original fixture example.",
  supportText: "This is a bounded, original fixture example.",
  supportEm: "bounded",
  align: "center",
  surface: "muted",
  actions: Object.freeze(HERO_ACTIONS.map((action) => Object.freeze({ ...action }))),
});

/** The served native hero section of one Page, bounded by its own closing section tag. */
export function heroRegionOf(html, id = HERO_ID) {
  const open = html.indexOf(`<section class="uno-json-hero" data-uno-align=`);
  if (open < 0) return "";
  const marker = `id="${id}"`;
  const tagged = html.indexOf(marker, open);
  if (tagged < 0) return "";
  const close = html.indexOf("</section>", tagged);
  return close < 0 ? "" : html.slice(open, close + "</section>".length);
}

/** Parse the hero's served actions in authored order: href, optional `rel`, optional variant and the label. */
export function heroActionsOf(region) {
  const pattern = /<a class="uno-json-action" href="([^"]+)"(?: rel="([^"]+)")?(?: data-uno-variant="([^"]+)")?>([^<]*)<\/a>/gu;
  return [...region.matchAll(pattern)].map((match) => ({
    href: match[1],
    rel: match[2] ?? "",
    variant: match[3] ?? "",
    label: match[4],
  }));
}

/**
 * The seven-dimension hero region predicate: the authored order, both Markdown bodies through the shared renderer, exactly
 * the two approved static actions with their `rel` and variants, and no donor identity, declaration key or control.
 */
export function heroServed(region, expected = HERO_EXPECTED) {
  const actions = heroActionsOf(region);
  const eyebrowAt = region.indexOf(`<p class="uno-json-eyebrow">${expected.eyebrow}</p>`);
  const ledeAt = region.indexOf('<div class="uno-json-hero-lede">');
  const actionsAt = region.indexOf('<ul class="uno-json-actions uno-json-hero-actions">');
  const supportAt = region.indexOf('<div class="uno-json-hero-support">');
  const ok =
    region.startsWith(
      `<section class="uno-json-hero" data-uno-align="${expected.align}" data-uno-surface="${expected.surface}" id="${expected.id}">`,
    )
    && eyebrowAt > 0
    && ledeAt > eyebrowAt
    && region.slice(ledeAt, ledeAt + 400).includes(
      `<strong class="uno-family-md-strong">${expected.ledeStrong}</strong>`,
    )
    && actionsAt > ledeAt
    && region.slice(supportAt).includes(`<em class="uno-family-md-em">${expected.supportEm}</em>`)
    && supportAt > actionsAt
    && actions.length === expected.actions.length
    && expected.actions.every(
      (action, index) =>
        actions[index]?.href === action.href
        && actions[index]?.label === action.label
        && actions[index]?.variant === action.variant
        && actions[index]?.rel === "noreferrer noopener",
    )
    && !region.includes("/assets/wo066-donor-plate.png")
    && !region.includes("example.help")
    && !/<button\b|<form\b|<iframe\b/iu.test(region);
  return { ok, detail: JSON.stringify({ eyebrowAt, ledeAt, actionsAt, supportAt, actions }) };
}

/**
 * The whole-source hero refusal matrix. Each case mutates one authored value of a fresh fixture source and expects the
 * adapter's own closed reason, with no partial document. A `route` or `link` action destination stays outside the subset;
 * an unsafe or relative `href` and an unknown variant are the strict reader's own refusals.
 */
export const HERO_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "hero action with a javascript scheme",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[9].actions = [{ label: "Open", href: "javascript:alert(1)" }];
    },
  }),
  Object.freeze({
    label: "hero action with a relative destination",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[9].actions = [{ label: "Open", href: "/outside" }];
    },
  }),
  Object.freeze({
    label: "hero action with an unknown variant",
    expected: "family:target-refused",
    mutate: (source) => {
      source.sections[9].actions = [{ label: "Open", href: "https://example.org/a", variant: "loud" }];
    },
  }),
  Object.freeze({
    label: "hero action with a site-local route",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[9].actions = [{ label: "Open", route: "wo108-target" }];
    },
  }),
  Object.freeze({
    label: "hero with four actions",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[9].actions = ["a", "b", "c", "d"].map((label) => ({ label, href: `https://example.org/${label}` }));
    },
  }),
  Object.freeze({
    label: "hero lede carrying an unpaired surrogate",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[9].lede = "Synthetic lead \uD800 tail";
    },
  }),
  Object.freeze({
    label: "hero support carrying a reversed surrogate pair",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      source.sections[9].support = "Synthetic lead \uDC00\uD800 tail";
    },
  }),
  Object.freeze({
    label: "hero with no authored body",
    expected: "family:unsupported-feature",
    mutate: (source) => {
      delete source.sections[9].lede;
      delete source.sections[9].support;
    },
  }),
]);
