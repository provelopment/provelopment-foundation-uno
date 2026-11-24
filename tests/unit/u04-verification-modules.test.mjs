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

