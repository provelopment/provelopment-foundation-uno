/**
 * Foundation Uno — the extracted U04 verification modules (`UNO-WO-112 / R01`).
 *
 * WHAT THIS IS. A direct, hermetic test of the four modules the production gate now orchestrates: the composed family
 * fixture, the seven-dimension evidence record, the Hero's shared expectations and the process harness. Each is exercised
 * on its own — no server, no browser, no declaration replacement — so a regression is named by module rather than hidden
 * inside a four-thousand-line run.
 *
 * WHY IT MATTERS. The gate's own audit can only read source text. These tests execute the real adapter against the real
 * fixture and the real predicates, which is what makes the extracted modules a tested unit of the delivery rather than a
 * refactor of convenience.
 */
import { describe, expect, it } from "vitest";

import { composeUnoFoundationSubset } from "../../src/application/compose-uno-foundation-families";
import {
  conjunction,
  conjunctionDetail,
  createFamilyEvidence,
  isCreditable,
  missingDimensions,
  FAMILY_EVIDENCE_KEYS,
} from "../../scripts/u04/family-evidence.mjs";
import {
  FAMILY_DONOR_SOURCE,
  FAMILY_IDS,
  FAMILY_PLATE,
  HERO_ACTIONS,
  composeFamilyFixture,
  familyBindings,
  familySource,
} from "../../scripts/u04/family-fixture.mjs";
import {
  HERO_EXPECTED,
  HERO_REFUSAL_CASES,
  heroActionsOf,
  heroRegionOf,
  heroServed,
} from "../../scripts/u04/hero-evidence.mjs";
import {
  STATS_EXPECTED,
  STATS_REFUSAL_CASES,
  statsNodeProps,
  statsPairsOf,
  statsRegionOf,
  statsServed,
} from "../../scripts/u04/stats-evidence.mjs";
import {
  STEPS_EXPECTED,
  STEPS_REFUSAL_CASES,
  stepsItemsOf,
  stepsNodeProps,
  stepsRegionOf,
  stepsServed,
} from "../../scripts/u04/steps-evidence.mjs";
// `UNO-WO-119 / R01`: the Columns evidence module, exercised on its own below.
import {
  COLUMNS_CASES,
  COLUMNS_EXPECTED,
  COLUMNS_REFUSAL_CASES,
  COLUMNS_RICH,
  COLUMNS_VARIANTS,
  columnsGeometryReport,
  columnsLabelsOf,
} from "../../scripts/u04/columns-evidence.mjs";
import { freeLoopbackPort, killChild, nextBinPath, runChild, waitForServer } from "../../scripts/u04/serving-harness.mjs";

const ROOT = process.cwd();

/** A served hero region shaped exactly as the renderer emits it, used only to prove the parser and the predicate. */
function servedHeroRegion(overrides = {}) {
  const actions = HERO_EXPECTED.actions
    .map(
      (action) =>
        `<li class="uno-json-action-item"><a class="uno-json-action" href="${action.href}" rel="${overrides.rel ?? "noreferrer noopener"}" data-uno-variant="${action.variant}">${action.label}</a></li>`,
    )
    .join("");
  return [
    `<section class="uno-json-hero" data-uno-align="center" data-uno-surface="muted" id="family-9-hero">`,
    `<p class="uno-json-eyebrow">Synthetic introduction</p>`,
    overrides.lede ?? `<div class="uno-json-hero-lede"><div class="uno-family-md"><p>A <strong class="uno-family-md-strong">visible</strong> page.</p></div></div>`,
    `<ul class="uno-json-actions uno-json-hero-actions">${actions}</ul>`,
    `<div class="uno-json-hero-support"><div class="uno-family-md"><p>A <em class="uno-family-md-em">bounded</em> example.</p></div></div>`,
    overrides.extra ?? "",
    `</section>`,
  ].join("");
}

describe("the extracted family fixture module", () => {
  it("authors seventeen donor sections with the approved hero surface at index nine", () => {
    const source = familySource();
    expect(source.version).toBe(1);
    expect(source.sections).toHaveLength(17);
    const hero = source.sections[9];
    expect(hero.type).toBe("hero");
    expect(hero.markdown).toBeUndefined();
    expect(hero.actions).toEqual(HERO_ACTIONS.map((action) => ({ ...action })));
    expect(HERO_ACTIONS).toHaveLength(2);
    expect(familyBindings()).toEqual({
      images: [{ source: FAMILY_DONOR_SOURCE, owned: { zone: "page", path: FAMILY_PLATE } }],
      contactForms: [{ formRef: "wo066-contact", mode: "delivery-off" }],
    });
  });

  it("composes through the real adapter into the exact seventeen ids, with a frozen Markdown hero", () => {
    const outcome = composeFamilyFixture(composeUnoFoundationSubset);
    expect(outcome.status).toBe("composed");
    if (outcome.status !== "composed") return;
    expect(outcome.document.sections.map((section) => section.id)).toEqual([...FAMILY_IDS]);
    const hero = outcome.document.sections[9];
    expect(hero?.module).toBe("content.hero");
    if (hero?.module !== "content.hero") return;
    expect(hero.props.markdown).toBe(true);
    expect(hero.props.actions).toEqual(HERO_EXPECTED.actions.map((action) => ({ ...action })));
    expect(Object.isFrozen(hero.props)).toBe(true);
    expect(Object.isFrozen(hero.props.actions)).toBe(true);
  });

  it("refuses to run without the real adapter instead of inventing a Page", () => {
    expect(() => composeFamilyFixture(undefined)).toThrow(/requires the loaded/u);
    expect(() => composeFamilyFixture({})).toThrow(/requires the loaded/u);
  });
});

describe("the extracted family evidence module", () => {
  it("starts every record incomplete and only credits all seven dimensions", () => {
    const record = createFamilyEvidence();
    expect(Object.keys(record)).toEqual([...FAMILY_EVIDENCE_KEYS]);
    expect(Object.values(record).every((value) => value === false)).toBe(true);
    expect(isCreditable(record)).toBe(false);
    expect(missingDimensions(record)).toEqual([...FAMILY_EVIDENCE_KEYS]);
    for (const key of FAMILY_EVIDENCE_KEYS) record[key] = true;
    expect(isCreditable(record)).toBe(true);
    expect(missingDimensions(record)).toEqual([]);
  });

  it("refuses a truthy stand-in, a short record and an extra key", () => {
    const record = createFamilyEvidence();
    for (const key of FAMILY_EVIDENCE_KEYS) record[key] = true;
    record.browser = "true";
    expect(isCreditable(record)).toBe(false);
    expect(missingDimensions(record)).toEqual(["browser"]);
    expect(isCreditable({ source: true, reader: true })).toBe(false);
    const extra = createFamilyEvidence();
    for (const key of FAMILY_EVIDENCE_KEYS) extra[key] = true;
    extra.invented = true;
    expect(isCreditable(extra)).toBe(false);
  });

  it("requires every browser case, and names the absent one", () => {
    const cases = new Set(["light:390", "light:1280", "dark:390"]);
    expect(conjunction(cases)).toBe(false);
    expect(conjunctionDetail(cases)).toBe(
      JSON.stringify([["light:390", true], ["light:1280", true], ["dark:390", true], ["dark:1280", false]]),
    );
    cases.add("dark:1280");
    expect(conjunction(cases)).toBe(true);
    expect(conjunction([])).toBe(false);
    expect(conjunction(["light:390", "light:1280", "dark:390", "dark:1280"])).toBe(true);
  });
});


describe("the extracted Hero evidence module", () => {
  it("parses the served region and accepts exactly the approved surface", () => {
    const region = servedHeroRegion();
    const extracted = heroRegionOf(`<main><div>${region}</div><section id="other"></section></main>`);
    expect(extracted).toBe(region);
    expect(heroActionsOf(extracted)).toEqual([
      { href: HERO_EXPECTED.actions[0].href, rel: "noreferrer noopener", variant: "primary", label: "Read the notes" },
      { href: HERO_EXPECTED.actions[1].href, rel: "noreferrer noopener", variant: "secondary", label: "Write to the desk" },
    ]);
    expect(heroServed(extracted).ok).toBe(true);
    expect(heroRegionOf("<main>no hero</main>")).toBe("");
  });

  it("rejects a plain lede, a lost rel, a donor path and a control", () => {
    const plainLede = servedHeroRegion({
      lede: '<p class="uno-json-hero-lede">A plain lede.</p>',
    });
    expect(heroServed(plainLede).ok).toBe(false);
    expect(heroServed(servedHeroRegion({ rel: "noopener" })).ok).toBe(false);
    expect(heroServed(`${servedHeroRegion()}<p>/assets/wo066-donor-plate.png</p>`).ok).toBe(false);
    expect(heroServed(servedHeroRegion({ extra: "<button>Go</button>" })).ok).toBe(false);
  });

  it("refuses every malformed hero as a whole source with the documented reason", () => {
    for (const probe of HERO_REFUSAL_CASES) {
      const source = familySource();
      probe.mutate(source);
      const outcome = composeUnoFoundationSubset(source, familyBindings());
      expect(outcome.status, probe.label).toBe("refused");
      if (outcome.status !== "refused") continue;
      expect(outcome.reason, probe.label).toBe(probe.expected);
      expect(Object.prototype.hasOwnProperty.call(outcome, "document"), probe.label).toBe(false);
    }
  });
});

describe("the extracted serving harness module", () => {
  it("locates the pinned Next CLI inside the checkout", () => {
    const nextBin = nextBinPath(ROOT);
    expect(typeof nextBin).toBe("string");
    expect(nextBin.replace(/\\/gu, "/")).toMatch(/node_modules\/next\/dist\/bin\/next(\.js)?$/u);
    expect(nextBinPath(`${ROOT}/does-not-exist`)).toBeNull();
  });

  it("runs a child, keeps its output and returns its exit code", async () => {
    const failed = await runChild({ root: ROOT, args: ["-e", "process.stdout.write('hello'); process.exit(3)"], timeoutMs: 30_000 });
    expect(failed.code).toBe(3);
    expect(failed.output).toContain("hello");
  });

  it("takes a real free loopback port and never throws while cleaning up", async () => {
    const port = await freeLoopbackPort("127.0.0.1");
    expect(Number.isInteger(port)).toBe(true);
    expect(port).toBeGreaterThan(0);
    expect(() => killChild(null)).not.toThrow();
    expect(() => killChild({ exitCode: 0, kill: () => { throw new Error("already gone"); } })).not.toThrow();
  });

  it("reports an already-exited child as not ready instead of waiting", async () => {
    const ready = await waitForServer({
      base: "http://127.0.0.1:1",
      child: { exitCode: 1 },
      readyPath: "/never",
      timeoutMs: 5_000,
      intervalMs: 10,
    });
    expect(ready).toBe(false);
  });
});


/** A served stats stack shaped exactly as the renderer emits it, used only to prove the parser and the predicate. */
function servedStatsRegion(overrides = {}) {
  const pairs = STATS_EXPECTED.items
    .map((item) => {
      const detail =
        item.detail === ""
          ? ""
          : overrides.plainDetail === true
            ? `<span class="uno-json-stat-detail">${item.detail.replace(/\*\*/gu, "")}</span>`
            : `<div class="uno-json-stat-detail"><div class="uno-family-md"><p class="uno-family-md-paragraph">${item.detail.replace(
                /\*\*(.+?)\*\*/gu,
                '<strong class="uno-family-md-strong">$1</strong>',
              )}</p></div></div>`;
      return `<div class="uno-json-stat"><dt class="uno-json-stat-label">${item.label}</dt><dd class="uno-json-stat-value">${item.value}${detail}</dd></div>`;
    })
    .join("");
  return [
    `<div class="uno-json-stack" data-uno-gap="normal" id="${STATS_EXPECTED.id}">`,
    `<h2 class="uno-json-heading" id="${STATS_EXPECTED.id}-heading">${STATS_EXPECTED.heading}</h2>`,
    `<section class="uno-json-prose" id="${STATS_EXPECTED.id}-lede"><div class="uno-family-md"><p class="uno-family-md-paragraph">${STATS_EXPECTED.lede.replace(
      /\*\*(.+?)\*\*/gu,
      '<strong class="uno-family-md-strong">$1</strong>',
    )}</p></div></section>`,
    `<section class="uno-json-stats" data-uno-surface="${overrides.surface ?? STATS_EXPECTED.surface}" id="${STATS_EXPECTED.id}-stats">`,
    `<dl class="uno-json-stats-list">${pairs}</dl></section></div>`,
    `<div class="uno-json-stack" data-uno-gap="normal" id="family-11-steps"></div>`,
  ].join("");
}

describe("the extracted Stats evidence module", () => {
  it("derives the expected surface and the native node props from the one fixture definition", () => {
    expect(STATS_EXPECTED.id).toBe("family-10-stats");
    expect(STATS_EXPECTED.heading).toBe("Synthetic numbers");
    expect(STATS_EXPECTED.surface).toBe("muted");
    expect(STATS_EXPECTED.lede).toContain("**summarise**");
    expect(STATS_EXPECTED.items).toHaveLength(2);
    expect(STATS_EXPECTED.items[0].detailStrong).toBe("only");
    expect(STATS_EXPECTED.items[1].detail).toBe("");
    expect(statsNodeProps()).toEqual({
      items: [
        { value: "13", label: "Sampled sections", detail: "Fixture **only**." },
        { value: "4", label: "New examples" },
      ],
      surface: "muted",
      markdown: true,
    });
    // Every call returns its own objects, so a caller can never mutate the frozen fixture through it.
    expect(statsNodeProps().items).not.toBe(statsNodeProps().items);
  });

  it("extracts the stats region and its served pairs", () => {
    const region = servedStatsRegion();
    expect(statsRegionOf(`<main>${region}</main>`)).toBe(
      region.slice(0, region.indexOf('<div class="uno-json-stack" data-uno-gap="normal" id="family-11-steps">')),
    );
    expect(statsRegionOf("<main>no stats</main>")).toBe("");
    const pairs = statsPairsOf(region);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toMatchObject({ label: "Sampled sections", value: "13", markdownDetail: true });
    expect(pairs[0].detail).toContain('<strong class="uno-family-md-strong">only</strong>');
    expect(pairs[1]).toMatchObject({ label: "New examples", value: "4", detail: "", markdownDetail: false });
  });

  it("accepts the approved surface and rejects a plain detail, a lost surface, a control or a currency", () => {
    expect(statsServed(servedStatsRegion()).ok).toBe(true);
    expect(statsServed(servedStatsRegion({ plainDetail: true })).ok).toBe(false);
    expect(statsServed(servedStatsRegion({ surface: "plain" })).ok).toBe(false);
    expect(statsServed(`${servedStatsRegion()}<button>Go</button>`).ok).toBe(false);
    expect(statsServed(`${servedStatsRegion()}$12`).ok).toBe(false);
  });

  it("refuses every malformed stats source with the documented reason and no partial Page", () => {
    for (const probe of STATS_REFUSAL_CASES) {
      const source = familySource();
      probe.mutate(source);
      const outcome = composeUnoFoundationSubset(source, familyBindings());
      expect(outcome.status, probe.label).toBe("refused");
      if (outcome.status !== "refused") continue;
      expect(outcome.reason, probe.label).toBe(probe.expected);
      expect(Object.prototype.hasOwnProperty.call(outcome, "document"), probe.label).toBe(false);
    }
  });
});


/** A served steps stack shaped exactly as the renderer emits it, used only to prove the parser and the predicate. */
function servedStepsRegion(overrides = {}) {
  const items = STEPS_EXPECTED.items
    .map((item) => {
      const body =
        item.body === ""
          ? ""
          : overrides.plainBody === true
            ? `<p class="uno-json-timeline-description">${item.body.replace(/\*\*/gu, "")}</p>`
            : `<div class="uno-json-timeline-description"><div class="uno-family-md"><p class="uno-family-md-paragraph">${item.body.replace(
                /\*\*(.+?)\*\*/gu,
                '<strong class="uno-family-md-strong">$1</strong>',
              )}</p></div></div>`;
      return `<li class="uno-json-timeline-item"><span aria-hidden="true" class="uno-json-timeline-marker"></span><h3 class="uno-json-timeline-title">${item.title}</h3>${body}</li>`;
    })
    .join("");
  return [
    `<div class="uno-json-stack" data-uno-gap="normal" id="${STEPS_EXPECTED.id}">`,
    `<h2 class="uno-json-heading" id="${STEPS_EXPECTED.id}-heading">${STEPS_EXPECTED.heading}</h2>`,
    `<section class="uno-json-prose" id="${STEPS_EXPECTED.id}-lede"><div class="uno-family-md"><p class="uno-family-md-paragraph">${STEPS_EXPECTED.lede.replace(
      /\*\*(.+?)\*\*/gu,
      '<strong class="uno-family-md-strong">$1</strong>',
    )}</p></div></section>`,
    `<section class="uno-json-timeline" data-uno-surface="${overrides.surface ?? STEPS_EXPECTED.surface}" id="${STEPS_EXPECTED.id}-timeline">`,
    `<ol class="uno-json-timeline-list">${items}</ol></section></div>`,
    `<section class="uno-json-testimonials" id="family-12-quote"></section>`,
  ].join("");
}

describe("the extracted Steps evidence module", () => {
  it("derives the expected surface and the native node props from the one fixture definition", () => {
    expect(STEPS_EXPECTED.id).toBe("family-11-steps");
    expect(STEPS_EXPECTED.heading).toBe("Synthetic sequence");
    expect(STEPS_EXPECTED.surface).toBe("muted");
    expect(STEPS_EXPECTED.lede).toContain("**authored**");
    expect(STEPS_EXPECTED.items).toHaveLength(2);
    expect(STEPS_EXPECTED.items[0].bodyStrong).toBe("source");
    expect(STEPS_EXPECTED.items[1].body).toBe("");
    expect(stepsNodeProps()).toEqual({
      items: [
        { title: "Draft", description: "Prepare the fixture **source**." },
        { title: "Review" },
      ],
      surface: "muted",
      itemHeadingLevel: 3,
      markdown: true,
    });
    expect(stepsNodeProps().items).not.toBe(stepsNodeProps().items);
  });

  it("extracts the steps region and its ordered items", () => {
    const region = servedStepsRegion();
    expect(stepsRegionOf(`<main>${region}</main>`)).toBe(
      region.slice(0, region.indexOf('<section class="uno-json-testimonials" id="family-12-quote">')),
    );
    expect(stepsRegionOf("<main>no steps</main>")).toBe("");
    const items = stepsItemsOf(region);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: "Draft", description: "", hasStatus: false, ariaCurrent: false, hasDate: false });
    expect(items[0].markdownDescription).toContain('<strong class="uno-family-md-strong">source</strong>');
    expect(items[1]).toMatchObject({ title: "Review", description: "", markdownDescription: "", hasMarker: true });
  });

  it("accepts the approved surface and rejects a plain body, a lost surface, a control or an invented status", () => {
    expect(stepsServed(servedStepsRegion()).ok).toBe(true);
    expect(stepsServed(servedStepsRegion({ plainBody: true })).ok).toBe(false);
    expect(stepsServed(servedStepsRegion({ surface: "plain" })).ok).toBe(false);
    expect(stepsServed(servedStepsRegion().replace("<li class=\"uno-json-timeline-item\">", '<li class="uno-json-timeline-item" data-uno-status="current">')).ok).toBe(false);
    expect(stepsServed(`${servedStepsRegion()}<a href="https://example.org">Go</a>`).ok).toBe(false);
  });

  it("refuses every malformed steps source with the documented reason and no partial Page", () => {
    for (const probe of STEPS_REFUSAL_CASES) {
      const source = familySource();
      probe.mutate(source);
      const outcome = composeUnoFoundationSubset(source, familyBindings());
      expect(outcome.status, probe.label).toBe("refused");
      if (outcome.status !== "refused") continue;
      expect(outcome.reason, probe.label).toBe(probe.expected);
      expect(Object.prototype.hasOwnProperty.call(outcome, "document"), probe.label).toBe(false);
    }
  });

/**
 * `UNO-WO-116 / R01`: the malformed-Unicode probes are a permanent part of the three Markdown-capable family matrices, and
 * they prove the shared decision rather than a per-family patch: a field with no Markdown punctuation at all is refused by
 * the one well-formedness rule the reader, the Markdown field reader and the composer all consume.
 */
describe("u04 family evidence — shared Unicode well-formedness probes", () => {
  const matrices = [
    ["hero", HERO_REFUSAL_CASES],
    ["stats", STATS_REFUSAL_CASES],
    ["steps", STEPS_REFUSAL_CASES],
  ];

  it("keeps at least one surrogate probe per family and never drops an earlier refusal case", () => {
    const totals = { hero: 6, stats: 6, steps: 7 };
    for (const [family, cases] of matrices) {
      const unicode = cases.filter((probe) => /surrogate/u.test(probe.label));
      expect(unicode.length, family).toBeGreaterThanOrEqual(family === "steps" ? 2 : 1);
      expect(cases.length, family).toBeGreaterThanOrEqual(totals[family]);
      for (const probe of unicode) expect(probe.expected, probe.label).toBe("family:unsupported-feature");
    }
  });

  it("refuses each surrogate probe as a whole source with no partial Page", () => {
    for (const [family, cases] of matrices) {
      for (const probe of cases.filter((candidate) => /surrogate/u.test(candidate.label))) {
        const source = familySource();
        probe.mutate(source);
        const outcome = composeUnoFoundationSubset(source, familyBindings());
        expect(outcome.status, `${family} / ${probe.label}`).toBe("refused");
        if (outcome.status !== "refused") continue;
        expect(outcome.reason, `${family} / ${probe.label}`).toBe(probe.expected);
        expect(Object.prototype.hasOwnProperty.call(outcome, "document"), probe.label).toBe(false);
      }
    }
  });
});

});

// `UNO-WO-119 / R01`: the Columns evidence module on its own — the four served variants, the shared label parser and the one
// geometry comparison, exercised without a browser so a regression names its own reason.
describe("the extracted Columns evidence module", () => {
  it("derives the four served variants from the one fixture definition", () => {
    expect(COLUMNS_VARIANTS.map((variant) => variant.id)).toEqual([
      "family-14-columns",
      "family-17-columns",
      "family-18-columns",
      "family-19-columns",
    ]);
    expect(COLUMNS_VARIANTS.map((variant) => variant.columns)).toEqual([2, 2, 2, 3]);
    expect(COLUMNS_VARIANTS.map((variant) => variant.ratio)).toEqual(["equal", "start-wide", "end-wide", "start-wide"]);
    expect(COLUMNS_VARIANTS.map((variant) => variant.surface)).toEqual(["muted", "bordered", "plain", null]);
    expect(COLUMNS_RICH.labels).toHaveLength(24);
    expect(COLUMNS_RICH.listChunks).toEqual([12, 12]);
    expect(COLUMNS_EXPECTED.titles).toEqual(["Left column", "Right column"]);
  });

  it("parses the plain labels of a served region in document order", () => {
    const region = [
      '<ul class="uno-json-list"><li><span>One</span></li><li><span>Two</span></li></ul>',
      '<ul class="uno-json-list"><li><span>Three</span></li></ul>',
    ].join("");
    expect(columnsLabelsOf(region)).toEqual(["One", "Two", "Three"]);
    expect(columnsLabelsOf('<ul class="uno-json-list"></ul>')).toEqual([]);
  });
  /**
   * One faithful reading for one case, so a test can weaken exactly one property and see the verdict refuse it.
   *
   * The widths are the ones production Chromium reported at 1280 (`[246,246]`, `[327,163]`, `[177,355]`, `[171,171,171]`) and at
   * 390 (a single column per variant). The surfaces are each scheme's computed token values.
   */
  const caseReading = (testCase, overrides = {}) => {
    const narrow = testCase.width < 1000;
    const light = testCase.scheme === "light";
    const muted = light ? "rgb(245, 247, 251)" : "rgb(20, 27, 36)";
    const bordered = light ? "rgb(255, 255, 255)" : "rgb(12, 17, 24)";
    const authored = [
      { id: "family-14-columns", ratioAttribute: "equal", surface: "muted", backgroundColor: muted },
      { id: "family-17-columns", ratioAttribute: "start-wide", surface: "bordered", backgroundColor: bordered },
      { id: "family-18-columns", ratioAttribute: "end-wide", surface: "plain", backgroundColor: "rgba(0, 0, 0, 0)" },
      { id: "family-19-columns", ratioAttribute: null, surface: null, backgroundColor: "rgba(0, 0, 0, 0)" },
    ];
    const titlesByVariant = [
      ["Rich left", "Rich right"],
      ["Start-wide left", "Start-wide right"],
      ["End-wide left", "End-wide right"],
      ["Three one", "Three two", "Three three"],
    ];
    const widthsByVariant = [[246, 246], [327, 163], [177, 355], [171, 171, 171]];
    const variants = authored.map((variant, index) => {
      const titles = titlesByVariant[index];
      const surfaced = variant.surface === "muted" || variant.surface === "bordered";
      return {
        ...variant,
        columns: titles.length,
        widths: narrow ? titles.map(() => 350) : widthsByVariant[index],
        tops: narrow ? titles.map((_, cell) => 10 + cell * 90) : titles.map(() => 10),
        titles,
        labels: index === 0 ? [...COLUMNS_RICH.labels] : [],
        labelLists: index === 0 ? 2 : 0,
        bodyLinkHref: index === 0 ? COLUMNS_RICH.bodyLink : null,
        bodyLinkRel: index === 0 ? "noopener noreferrer" : null,
        borderWidth: variant.surface === "bordered" ? "1px" : "0px",
        borderRadius: surfaced ? "20px" : "0px",
        padding: surfaced ? "16px 20px 16px 20px" : "0px 0px 0px 0px",
        overflow: 0,
      };
    });
    return {
      case: testCase.key,
      width: testCase.width,
      dark: testCase.scheme === "dark",
      reduce: testCase.motion === "reduce",
      forced: false,
      variants,
      keyboard: {
        reached: true,
        href: COLUMNS_RICH.bodyLink,
        rel: "noopener noreferrer",
        visible: true,
        leftAfterTab: true,
        presses: 12,
        pageUrlBefore: "http://127.0.0.1/x/en-001/wo066-family-composition",
        pageUrlAfter: "http://127.0.0.1/x/en-001/wo066-family-composition",
        foreignRequests: 0,
      },
      ...overrides,
    };
  };
  const readingsForAllCases = () => COLUMNS_CASES.map((testCase) => caseReading(testCase));
  const weaken = (readings, key, mutate) =>
    readings.map((reading) =>
      reading.case === key
        ? mutate({ ...reading, variants: reading.variants.map((variant) => ({ ...variant })) })
        : reading,
    );
  it("accepts exactly the four executed cases and refuses a missing, duplicated or mislabelled case", () => {
    const readings = readingsForAllCases();
    expect(columnsGeometryReport(readings).ok).toBe(true);
    expect(COLUMNS_CASES.map((entry) => entry.key)).toEqual(["light:390", "light:1280", "dark:390", "dark:1280"]);
    // Three good cases are not four: each of the four is required on its own.
    expect(columnsGeometryReport(readings.filter((reading) => reading.case !== "dark:390")).ok).toBe(false);
    expect(columnsGeometryReport(readings.filter((reading) => reading.case !== "light:1280")).ok).toBe(false);
    // A duplicate case does not stand in for the missing one.
    expect(columnsGeometryReport([...readings, readings[0]]).ok).toBe(false);
    expect(columnsGeometryReport([]).ok).toBe(false);
    expect(columnsGeometryReport([{ ...readings[0], case: undefined }]).ok).toBe(false);
    // A mislabelled case is refused by the media check itself.
    expect(columnsGeometryReport(weaken(readings, "dark:1280", (reading) => ({ ...reading, dark: false }))).ok).toBe(false);
    expect(columnsGeometryReport(weaken(readings, "dark:390", (reading) => ({ ...reading, reduce: false }))).ok).toBe(false);
    expect(columnsGeometryReport(weaken(readings, "light:1280", (reading) => ({ ...reading, width: 1024 }))).ok).toBe(false);
  });

  it("refuses every wrong asymmetric proportion, including merely wider", () => {
    const readings = readingsForAllCases();
    const withWidths = (key, id, widths) =>
      weaken(readings, key, (reading) => ({
        ...reading,
        variants: reading.variants.map((variant) => (variant.id === id ? { ...variant, widths } : variant)),
      }));
    // `start-wide` that is merely wider than its neighbour is not 2:1, and 3:1 is not either.
    expect(columnsGeometryReport(withWidths("light:1280", "family-17-columns", [250, 240])).ok).toBe(false);
    expect(columnsGeometryReport(withWidths("light:1280", "family-17-columns", [360, 120])).ok).toBe(false);
    // `end-wide` the wrong way round is refused, and so are unequal equal-grids and a ragged three-column grid.
    expect(columnsGeometryReport(withWidths("light:1280", "family-18-columns", [355, 177])).ok).toBe(false);
    expect(columnsGeometryReport(withWidths("light:1280", "family-14-columns", [260, 232])).ok).toBe(false);
    expect(columnsGeometryReport(withWidths("light:1280", "family-19-columns", [171, 171, 150])).ok).toBe(false);
    // A two-pixel rounding difference is inside the documented tolerance and still passes.
    expect(columnsGeometryReport(withWidths("light:1280", "family-17-columns", [326, 164])).ok).toBe(true);
    // A ratio attribute on the three-column grid is refused at either width.
    const keptRatio = weaken(readings, "dark:1280", (reading) => ({
      ...reading,
      variants: reading.variants.map((variant) =>
        variant.id === "family-19-columns" ? { ...variant, ratioAttribute: "start-wide" } : variant,
      ),
    }));
    expect(columnsGeometryReport(keptRatio).ok).toBe(false);
  });
  it("refuses a narrow case that is not one column in authored order, and any zero width or overflow", () => {
    const readings = readingsForAllCases();
    const withVariant = (key, id, patch) =>
      weaken(readings, key, (reading) => ({
        ...reading,
        variants: reading.variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
      }));
    // Two cells side by side at 390 refuse: the narrow layout must be one column in authored order.
    expect(columnsGeometryReport(withVariant("light:390", "family-19-columns", { tops: [10, 10, 10] })).ok).toBe(false);
    expect(columnsGeometryReport(withVariant("dark:390", "family-17-columns", { tops: [100, 10] })).ok).toBe(false);
    // A zero-width cell is never a laid-out column, at either width.
    expect(columnsGeometryReport(withVariant("light:1280", "family-14-columns", { widths: [0, 0] })).ok).toBe(false);
    expect(columnsGeometryReport(withVariant("dark:390", "family-17-columns", { widths: [0, 0] })).ok).toBe(false);
    // Any horizontal overflow refuses.
    expect(columnsGeometryReport(withVariant("dark:390", "family-19-columns", { overflow: 8 })).ok).toBe(false);
    // A wrong cell count or a reordered DOM refuses, at both widths.
    expect(columnsGeometryReport(withVariant("light:1280", "family-19-columns", { columns: 2 })).ok).toBe(false);
    expect(
      columnsGeometryReport(withVariant("light:1280", "family-14-columns", { titles: ["Rich right", "Rich left"] })).ok,
    ).toBe(false);
    expect(columnsGeometryReport(withVariant("dark:390", "family-18-columns", { columns: 3 })).ok).toBe(false);
  });

  it("refuses incorrect surface effects and a weakened keyboard access", () => {
    const readings = readingsForAllCases();
    const withSurface = (value, patch) =>
      weaken(readings, "light:1280", (reading) => ({
        ...reading,
        variants: reading.variants.map((variant) => (variant.surface === value ? { ...variant, ...patch } : variant)),
      }));
    // `plain` must present exactly like the absent surface, and neither may carry an effect.
    expect(columnsGeometryReport(withSurface("plain", { padding: "16px 20px 16px 20px" })).ok).toBe(false);
    expect(columnsGeometryReport(withSurface("plain", { borderWidth: "1px" })).ok).toBe(false);
    expect(columnsGeometryReport(withSurface("muted", { backgroundColor: "rgba(0, 0, 0, 0)" })).ok).toBe(false);
    // The two emphasised values cannot collapse into one another or into plain.
    expect(columnsGeometryReport(withSurface("bordered", { backgroundColor: "rgb(245, 247, 251)" })).ok).toBe(false);
    expect(columnsGeometryReport(withSurface("muted", { backgroundColor: "rgb(255, 255, 255)" })).ok).toBe(false);
    // Border, padding and radius are the shipped token effects, so losing any of them refuses.
    expect(columnsGeometryReport(withSurface("bordered", { borderWidth: "0px" })).ok).toBe(false);
    expect(columnsGeometryReport(withSurface("muted", { padding: "0px 0px 0px 0px" })).ok).toBe(false);
    expect(columnsGeometryReport(withSurface("muted", { borderRadius: "0px" })).ok).toBe(false);
    // Keyboard: unreachable, wrong destination, wrong rel, trapped focus, a navigation or a foreign request all refuse.
    const keyboard = (patch) =>
      weaken(readings, "dark:1280", (reading) => ({ ...reading, keyboard: { ...reading.keyboard, ...patch } }));
    expect(columnsGeometryReport(keyboard({ reached: false })).ok).toBe(false);
    expect(columnsGeometryReport(keyboard({ href: "https://example.org/notes" })).ok).toBe(false);
    expect(columnsGeometryReport(keyboard({ rel: "" })).ok).toBe(false);
    expect(columnsGeometryReport(keyboard({ visible: false })).ok).toBe(false);
    expect(columnsGeometryReport(keyboard({ leftAfterTab: false })).ok).toBe(false);
    expect(columnsGeometryReport(keyboard({ pageUrlAfter: "https://example.org/columns" })).ok).toBe(false);
    expect(columnsGeometryReport(keyboard({ foreignRequests: 1 })).ok).toBe(false);
    // The served rich content is part of the case: dropping a label, a list or the safe rel refuses.
    const labels = weaken(readings, "light:390", (reading) => ({
      ...reading,
      variants: reading.variants.map((variant) =>
        variant.id === "family-14-columns" ? { ...variant, labels: variant.labels.slice(1) } : variant,
      ),
    }));
    expect(columnsGeometryReport(labels).ok).toBe(false);
    const list = weaken(readings, "dark:390", (reading) => ({
      ...reading,
      variants: reading.variants.map((variant) => (variant.id === "family-14-columns" ? { ...variant, labelLists: 1 } : variant)),
    }));
    expect(columnsGeometryReport(list).ok).toBe(false);
    const link = weaken(readings, "light:1280", (reading) => ({
      ...reading,
      variants: reading.variants.map((variant) =>
        variant.id === "family-14-columns" ? { ...variant, bodyLinkRel: "" } : variant,
      ),
    }));
    expect(columnsGeometryReport(link).ok).toBe(false);
  });




  it("publishes the ten closed refusal probes with their own literal reasons", () => {
    expect(COLUMNS_REFUSAL_CASES).toHaveLength(10);
    expect(COLUMNS_REFUSAL_CASES.every((probe) => probe.expected.startsWith("family:"))).toBe(true);
    const section = {
      type: "columns",
      lede: "A **lede**.",
      surface: "muted",
      ratio: "equal",
      items: [{ title: "A", body: "B" }, { title: "C", items: ["One"] }],
    };
    for (const probe of COLUMNS_REFUSAL_CASES) {
      const copy = { ...section, items: section.items.map((item) => ({ ...item, ...(item.items === undefined ? {} : { items: [...item.items] }) })) };
      probe.mutate(copy);
      const outcome = composeUnoFoundationSubset({ version: 1, title: "Columns refusal", sections: [copy] }, undefined);
      expect(outcome.status).toBe("refused");
      if (outcome.status === "refused") expect(outcome.reason).toBe(probe.expected);
    }
  });
});


