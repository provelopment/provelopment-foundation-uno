/**
 * Foundation Uno — the U04 JSON Page vertical-slice gate (`UNO-WO-035 / R01`).
 *
 * WHAT THIS IS. One end-to-end proof that the version-1 JSON Page document is really served by the real Next.js
 * production build: it installs a synthetic, exclusively-claimed publication fixture through the accepted,
 * immutable U03 transaction helper, validates it with the real loader/planner, builds, starts the production
 * server on loopback, and checks the Page over real HTTP and a real Chromium DOM. It then restores the committed
 * unpublished declarations byte for byte, rebuilds them, and re-runs the existing fail-closed gates.
 *
 * WHAT THIS IS NOT. No provider, no network beyond loopback, no deployment, no published Page, no change to the
 * committed manifest, selection, Home Markdown or demonstration. Every fixture source is task-owned and removed
 * again; the committed declarations are pinned by SHA-256 before and after.
 *
 * FAIL-CLOSED. A refused fixture, an unclean build, a missing browser, a failed assertion or an unproven
 * restoration is a failure of this gate — never a skip, never a silent pass.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { registerHooks } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { prepareUnoU03FixtureTransaction } from "./uno-u03-fixture-transaction.mjs";

// The repository's TypeScript uses extensionless relative imports; this hook resolves `.ts` for relative
// specifiers only, so this gate calls the REAL validator, planner and serving composition.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/iu.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        return nextResolve(specifier, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 120_000;
const BUILD_TIMEOUT_MS = 600_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

const ROOT = process.cwd();
const MANIFEST = "deployment/efs/manifest.json";
const SELECTION = "deployment/uno.config.json";
const CONTENT = "deployment/efs/content";
const TEST_BASE = "http://localhost:3000";
const ENTITY_ID = "e_7a3knkx60eacyhca7a0cr1k6e1";

/** The committed declaration digests this gate requires before it will touch anything. */
const PINNED_DECLARATIONS = new Map([
  [MANIFEST, "b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925"],
  [SELECTION, "58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952"],
]);

/** The five authorized starter paths: the two declarations and the three authored starter sources. */
const STARTER_PATHS = Object.freeze([
  MANIFEST,
  SELECTION,
  `${CONTENT}/home.en-001.json`,
  `${CONTENT}/about.en-001.md`,
  `${CONTENT}/components.en-001.json`,
]);

/** The twenty-one synthetic sources: created only if absent, removed again in the same `finally`. */
const FIXTURE_SOURCES = Object.freeze([
  `${CONTENT}/wo035-home.en-001.json`,
  `${CONTENT}/wo035-home.de-de.json`,
  `${CONTENT}/wo035-components.en-001.json`,
  `${CONTENT}/wo035-components.de-de.json`,
  `${CONTENT}/wo035-notes.en-001.md`,
  `${CONTENT}/wo035-preview.en-001.json`,
  `${CONTENT}/wo035-unsupported.en-001.json`,
  `${CONTENT}/wo035-unknown.en-001.json`,
  `${CONTENT}/wo035-version.en-001.json`,
  `${CONTENT}/wo035-extrakey.en-001.json`,
  `${CONTENT}/wo035-unsafe.en-001.json`,
  `${CONTENT}/wo035-target.en-001.json`,
  `${CONTENT}/wo035-duplicate.en-001.json`,
  `${CONTENT}/wo035-deep.en-001.json`,
  `${CONTENT}/wo035-wide.en-001.json`,
  `${CONTENT}/wo035-broken.en-001.json`,
  `${CONTENT}/wo035-broken.en-001.md`,
  `${CONTENT}/wo035-draft.en-001.md`,
  `${CONTENT}/wo035-other.en-001.json`,
  `${CONTENT}/wo037-herobody.en-001.json`,
  `${CONTENT}/wo037-statslevel.en-001.json`,
  `${CONTENT}/wo037-quotemarkup.en-001.json`,
  `${CONTENT}/wo038-bentocount.en-001.json`,
  `${CONTENT}/wo038-bentotile.en-001.json`,
  `${CONTENT}/wo038-bentoone.en-001.json`,
  `${CONTENT}/wo038-pricedouble.en-001.json`,
  `${CONTENT}/wo038-priceamount.en-001.json`,
  `${CONTENT}/wo038-pricelevel.en-001.json`,
  `${CONTENT}/wo038-timelinedouble.en-001.json`,
  `${CONTENT}/wo038-timelinestatus.en-001.json`,
  `${CONTENT}/wo038-timelinemarkup.en-001.json`,
]);

const failures = [];
const passes = [];

/** Record one assertion. A failure is always printed; a pass never hides a failure. */
function check(name, condition, detail) {
  if (condition) {
    passes.push(name);
    process.stdout.write(`  PASS  ${name}\n`);
    return true;
  }
  const line = detail ? `${name} (${detail})` : name;
  failures.push(line);
  process.stdout.write(`  FAIL  ${line}\n`);
  return false;
}

/** One valid two-card article grid plus the three added modules (`UNO-WO-037 / R01`). */
function componentSections(locale) {
  const german = locale === "de-DE";
  return [
    {
      id: "opening",
      module: "content.hero",
      props: {
        eyebrow: german ? "Ueberblick zum Schritt" : "Increment overview",
        lede: german ? "Drei Module ergaenzen den geprueften Schnitt." : "Three modules join the validated slice here.",
        support: german
          ? "Jeder Wert unten ist verfasster Text, keine Live-Zahl."
          : "Every figure below is authored text, never a live number.",
        align: "center",
        surface: "bordered",
        actions: [{ label: german ? "Zu den Zahlen" : "Jump to the figures", targetId: "figures" }],
      },
    },
    {
      id: "listing",
      module: "layout.grid",
      props: { columns: 2, itemSemantics: "article" },
      children: [
        {
          id: "card-one",
          module: "layout.stack",
          props: { gap: "tight" },
          children: [
            { id: "card-one-title", module: "content.heading", props: { text: german ? "Erste Karte" : "Card one", level: 2 } },
            {
              id: "card-one-body",
              module: "content.prose",
              props: { text: german ? "Erster Kartentext." : "First card body text." },
            },
          ],
        },
        {
          id: "card-two",
          module: "layout.stack",
          props: { gap: "tight" },
          children: [
            { id: "card-two-title", module: "content.heading", props: { text: german ? "Zweite Karte" : "Card two", level: 2 } },
            {
              id: "card-two-body",
              module: "content.prose",
              props: { text: german ? "Zweiter Kartentext." : "Second card body text." },
            },
          ],
        },
      ],
    },
    {
      id: "figures",
      module: "content.stats",
      props: {
        heading: german ? "Zahlen zum Schritt" : "Increment figures",
        level: 2,
        surface: "muted",
        items: [
          {
            value: "11",
            label: german ? "Darstellbare Modul-IDs" : "Renderable module IDs",
            detail: german ? "Acht akzeptiert, drei hier ergaenzt." : "Eight accepted, three added here.",
          },
          { value: "11", label: german ? "Weiterhin ohne Renderer" : "Still unrenderable" },
          { value: "0", label: german ? "Erfundene Werte" : "Fabricated values" },
        ],
      },
    },
    {
      id: "voices",
      module: "content.testimonials",
      props: {
        align: "center",
        surface: "bordered",
        items: [
          {
            quote: german
              ? "Die Ablehnungen des Vertrags sind die Funktion, nicht das Hindernis."
              : "The contract refusals are the feature, not the obstacle.",
            attribution: german ? "Pruefnotiz A" : "Review note A",
            role: german ? "Architekturpruefung" : "Architecture review",
          },
          {
            quote: german
              ? "Verfasster Text bleibt vom Dokument bis zum DOM inaktiv."
              : "Authored text stays inert from the document to the DOM.",
          },
        ],
      },
    },
    {
      id: "mosaic",
      module: "layout.bento",
      props: {
        columns: 3,
        itemSemantics: "article",
        tiles: [
          { sectionId: "mosaic-lead", span: "feature" },
          { sectionId: "mosaic-note", span: "wide" },
          { sectionId: "mosaic-side", span: "standard" },
        ],
      },
      children: [
        {
          id: "mosaic-lead",
          module: "layout.stack",
          props: { gap: "tight" },
          children: [
            {
              id: "mosaic-lead-title",
              module: "content.heading",
              props: { text: german ? "Mosaik" : "Mosaic", level: 2 },
            },
            {
              id: "mosaic-lead-body",
              module: "content.prose",
              props: { text: german ? "Ein grosses Feld mit Text." : "A feature tile with body text." },
            },
          ],
        },
        {
          id: "mosaic-note",
          module: "content.prose",
          props: { text: german ? "Ein breites Feld." : "A wide tile body." },
        },
        {
          id: "mosaic-side",
          module: "content.prose",
          props: { text: german ? "Ein normales Feld." : "A standard tile body." },
        },
      ],
    },
    {
      id: "tiers",
      module: "content.pricing",
      props: {
        heading: german ? "Stufen" : "Programme tiers",
        level: 2,
        surface: "bordered",
        items: [
          {
            label: german ? "Gemeinschaft" : "Community",
            amount: "Free",
            description: german ? "Nur verfasster Text, kein Preisalarm." : "Authored text only, no price alert.",
          },
          {
            label: german ? "Team" : "Team",
            amount: "CHF 40",
            unit: german ? "pro Monat" : "per month",
            featured: true,
          },
          { label: german ? "Unternehmen" : "Enterprise", amount: german ? "Auf Anfrage" : "On request" },
        ],
      },
    },
    {
      id: "road",
      module: "content.timeline",
      props: {
        heading: german ? "Ablauf" : "Programme timeline",
        level: 2,
        surface: "muted",
        items: [
          {
            title: german ? "Vertragsbasis" : "Contract baseline",
            dateLabel: "Phase 1",
            status: "complete",
            description: german ? "Angenommen und geprueft." : "Accepted and reviewed.",
          },
          { title: german ? "Modulschnitt" : "Module slice", dateLabel: "Phase 2", status: "current" },
          { title: german ? "Praesentationshuelle" : "Presentation shell", dateLabel: "Phase 3", status: "upcoming" },
        ],
      },
    },
    {
      id: "listing-actions",
      module: "content.actions",
      props: { items: [{ label: german ? "Zur ersten Karte" : "Jump to card one", targetId: "card-one" }] },
    },
  ];
}

/** The fixture documents. Every one is original, synthetic and ASCII-safe except the German umlauts. */
const JSON_DOCUMENTS = Object.freeze({
  homeEn: {
    version: 1,
    title: "Uno listing fixture",
    description: "A synthetic Home Page served from a validated JSON document.",
    sections: [
      { id: "intro", module: "content.heading", props: { text: "Published JSON Home", level: 2 } },
      { id: "body", module: "content.prose", props: { text: "This body is inert plain text from a version-1 document." } },
      { id: "links", module: "content.actions", props: { items: [{ label: "Back to the heading", targetId: "intro" }] } },
    ],
  },
  homeDe: {
    version: 1,
    title: "Uno Listenseite",
    description: "Eine synthetische Startseite aus einem geprueften JSON-Dokument.",
    sections: [
      { id: "intro", module: "content.heading", props: { text: "Veroeffentlichte JSON-Startseite", level: 2 } },
      { id: "body", module: "content.prose", props: { text: "Dieser Text ist unveraenderlicher Klartext." } },
    ],
  },
  componentsEn: { version: 1, title: "Component listing", sections: componentSections("en-001") },
  componentsDe: { version: 1, title: "Komponentenliste", sections: componentSections("de-DE") },
  preview: {
    version: 1,
    title: "Direct preview",
    visibility: "unlisted",
    sections: [{ id: "body", module: "content.prose", props: { text: "This Page is reachable only by its exact address." } }],
  },
  unsupported: {
    version: 1,
    title: "Unrenderable module",
    sections: [{ id: "figure", module: "media.image", props: {} }],
  },
  unknown: {
    version: 1,
    title: "Unknown module",
    sections: [{ id: "band", module: "layout.marquee", props: {} }],
  },
  versionUnsupported: {
    version: 2,
    title: "Unsupported version",
    sections: [{ id: "body", module: "content.prose", props: { text: "Never rendered." } }],
  },
  extraKey: {
    version: 1,
    title: "Extra authority",
    canonical: `${TEST_BASE}/en-001/extrakey`,
    sections: [{ id: "body", module: "content.prose", props: { text: "Never rendered." } }],
  },
  unsafeLink: {
    version: 1,
    title: "Unsafe action",
    sections: [{ id: "go", module: "content.actions", props: { items: [{ label: "Escape", targetId: "../escape" }] } }],
  },
  unresolvedTarget: {
    version: 1,
    title: "Dead action",
    sections: [{ id: "go", module: "content.actions", props: { items: [{ label: "Nowhere", targetId: "missing" }] } }],
  },
  duplicateId: {
    version: 1,
    title: "Duplicate identifier",
    sections: [
      { id: "same", module: "content.prose", props: { text: "One." } },
      { id: "same", module: "content.prose", props: { text: "Two." } },
    ],
  },
  heroBodyMissing: {
    version: 1,
    title: "Hero without body",
    sections: [{ id: "opening", module: "content.hero", props: { eyebrow: "No body authored" } }],
  },
  statsHeadingSkip: {
    version: 1,
    title: "Stats heading skip",
    sections: [
      {
        id: "figures",
        module: "content.stats",
        props: { heading: "Skips a level", level: 4, items: [{ value: "1", label: "One" }] },
      },
    ],
  },
  quoteMarkup: {
    version: 1,
    title: "Quote with markup",
    sections: [
      {
        id: "voices",
        module: "content.testimonials",
        props: { items: [{ quote: "<b>Bold</b> quotation." }] },
      },
    ],
  },
  // The nine unique negatives of the modules added by UNO-WO-038 / R01: three distinct invalid Pages per module.
  bentoCountMismatch: {
    version: 1,
    title: "Bento tile count mismatch",
    sections: [
      {
        id: "mosaic",
        module: "layout.bento",
        props: { columns: 2, tiles: [{ sectionId: "mosaic-a", span: "feature" }] },
        children: [
          { id: "mosaic-a", module: "content.prose", props: { text: "A." } },
          { id: "mosaic-b", module: "content.prose", props: { text: "B." } },
        ],
      },
    ],
  },
  bentoForeignTile: {
    version: 1,
    title: "Bento tile names a stranger",
    sections: [
      {
        id: "mosaic",
        module: "layout.bento",
        props: {
          columns: 2,
          tiles: [
            { sectionId: "mosaic-a", span: "feature" },
            { sectionId: "mosaic-elsewhere", span: "standard" },
          ],
        },
        children: [
          { id: "mosaic-a", module: "content.prose", props: { text: "A." } },
          { id: "mosaic-b", module: "content.prose", props: { text: "B." } },
        ],
      },
    ],
  },
  bentoSingleChild: {
    version: 1,
    title: "Bento with a single tile",
    sections: [
      {
        id: "mosaic",
        module: "layout.bento",
        props: { columns: 2, tiles: [{ sectionId: "mosaic-a", span: "feature" }] },
        children: [{ id: "mosaic-a", module: "content.prose", props: { text: "Alone." } }],
      },
    ],
  },
  priceDoubleFeatured: {
    version: 1,
    title: "Two highlighted prices",
    sections: [
      {
        id: "tiers",
        module: "content.pricing",
        props: {
          items: [
            { label: "One", amount: "1", featured: true },
            { label: "Two", amount: "2", featured: true },
          ],
        },
      },
    ],
  },
  priceEmptyAmount: {
    version: 1,
    title: "Price without an amount",
    sections: [
      { id: "tiers", module: "content.pricing", props: { items: [{ label: "One", amount: "  " }] } },
    ],
  },
  priceHeadingSkip: {
    version: 1,
    title: "Pricing heading skip",
    sections: [
      {
        id: "tiers",
        module: "content.pricing",
        props: { heading: "Skips a level", level: 4, items: [{ label: "One", amount: "1" }] },
      },
    ],
  },
  timelineDoubleCurrent: {
    version: 1,
    title: "Two current milestones",
    sections: [
      {
        id: "road",
        module: "content.timeline",
        props: {
          items: [
            { title: "One", status: "current" },
            { title: "Two", status: "current" },
          ],
        },
      },
    ],
  },
  timelineBadStatus: {
    version: 1,
    title: "Malformed milestone status",
    sections: [
      { id: "road", module: "content.timeline", props: { items: [{ title: "One", status: "in-progress" }] } },
    ],
  },
  timelineMarkup: {
    version: 1,
    title: "Milestone with markup",
    sections: [
      { id: "road", module: "content.timeline", props: { items: [{ title: "<b>Bold</b> milestone" }] } },
    ],
  },
  tooDeep: {
    version: 1,
    title: "Too deep",
    sections: [
      {
        id: "d1",
        module: "layout.stack",
        props: {},
        children: [
          {
            id: "d2",
            module: "layout.stack",
            props: {},
            children: [
              {
                id: "d3",
                module: "layout.stack",
                props: {},
                children: [
                  {
                    id: "d4",
                    module: "layout.stack",
                    props: {},
                    children: [{ id: "leaf", module: "content.prose", props: { text: "Leaf." } }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  tooWide: {
    version: 1,
    title: "Too wide",
    sections: Array.from({ length: 32 }, (_value, index) => ({
      id: `stack-${index}`,
      module: "layout.stack",
      props: {},
      children: Array.from({ length: 4 }, (_child, child) => ({
        id: `node-${index}-${child}`,
        module: "content.prose",
        props: { text: "Node." },
      })),
    })),
  },
  other: {
    version: 1,
    title: "Archive Site Page",
    sections: [{ id: "body", module: "content.prose", props: { text: "Never served by the selected Site." } }],
  },
});

/** The three Markdown sources: one valid Page, one alternative under malformed JSON, one draft. */
const MARKDOWN_DOCUMENTS = Object.freeze({
  notes: "# Notes\n\nA valid Markdown Page next to the JSON Pages.\n",
  brokenAlternative: "# Broken alternative\n\nThis Markdown must never rescue the malformed JSON.\n",
  draft: "# Draft\n\nNever published.\n",
});

/** SHA-256 of one repository-relative file, or `null` when it cannot be read. */
function sha256Of(relativePath) {
  try {
    return createHash("sha256").update(readFileSync(resolve(ROOT, relativePath))).digest("hex");
  } catch {
    return null;
  }
}

/** One representation of one locale. */
const representation = (locale, sources) => ({ locale, sources });
const jsonSource = (path) => ({ kind: "json", path });
const markdownSource = (path) => ({ kind: "markdown", path });

/** Every fixture Page this gate declares. Publication is the manifest's own gate, never the document's. */
function fixturePages() {
  const published = (id, route, representations) => ({ id, route, publication: "published", representations });
  return [
    published("home", ["home"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-home.en-001.json`)]),
      representation("de-DE", [jsonSource(`${CONTENT}/wo035-home.de-de.json`)]),
    ]),
    published("components", ["programmes", "components"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-components.en-001.json`)]),
      representation("de-DE", [jsonSource(`${CONTENT}/wo035-components.de-de.json`)]),
    ]),
    published("notes", ["notes"], [representation("en-001", [markdownSource(`${CONTENT}/wo035-notes.en-001.md`)])]),
    published("preview", ["preview"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-preview.en-001.json`)])]),
    published("unsupported", ["unsupported"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-unsupported.en-001.json`)]),
    ]),
    published("unknown", ["unknown"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-unknown.en-001.json`)])]),
    published("version", ["version"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-version.en-001.json`)])]),
    published("extrakey", ["extrakey"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-extrakey.en-001.json`)])]),
    published("unsafe", ["unsafe"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-unsafe.en-001.json`)])]),
    published("target", ["target"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-target.en-001.json`)])]),
    published("duplicate", ["duplicate"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo035-duplicate.en-001.json`)]),
    ]),
    published("deep", ["deep"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-deep.en-001.json`)])]),
    published("wide", ["wide"], [representation("en-001", [jsonSource(`${CONTENT}/wo035-wide.en-001.json`)])]),
    published("broken", ["broken"], [
      representation("en-001", [
        jsonSource(`${CONTENT}/wo035-broken.en-001.json`),
        markdownSource(`${CONTENT}/wo035-broken.en-001.md`),
      ]),
    ]),
    {
      id: "draft",
      route: ["draft"],
      publication: "draft",
      representations: [representation("en-001", [markdownSource(`${CONTENT}/wo035-draft.en-001.md`)])],
    },
    published("herobody", ["herobody"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo037-herobody.en-001.json`)]),
    ]),
    published("statslevel", ["statslevel"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo037-statslevel.en-001.json`)]),
    ]),
    published("quotemarkup", ["quotemarkup"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo037-quotemarkup.en-001.json`)]),
    ]),
    published("bentocount", ["bentocount"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-bentocount.en-001.json`)]),
    ]),
    published("bentotile", ["bentotile"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-bentotile.en-001.json`)]),
    ]),
    published("bentoone", ["bentoone"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-bentoone.en-001.json`)]),
    ]),
    published("pricedouble", ["pricedouble"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-pricedouble.en-001.json`)]),
    ]),
    published("priceamount", ["priceamount"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-priceamount.en-001.json`)]),
    ]),
    published("pricelevel", ["pricelevel"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-pricelevel.en-001.json`)]),
    ]),
    published("timelinedouble", ["timelinedouble"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-timelinedouble.en-001.json`)]),
    ]),
    published("timelinestatus", ["timelinestatus"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-timelinestatus.en-001.json`)]),
    ]),
    published("timelinemarkup", ["timelinemarkup"], [
      representation("en-001", [jsonSource(`${CONTENT}/wo038-timelinemarkup.en-001.json`)]),
    ]),
  ];
}

/** The fixture manifest: one Entity, the selected Site plus one unselected Site for the wrong-Site refusal. */
function fixtureManifest() {
  return {
    entities: [
      {
        id: ENTITY_ID,
        facets: [
          {
            id: "foundation",
            sites: [
              {
                id: "main",
                locales: { supportedLocales: ["en-001", "de-DE"], defaultLocale: "en-001" },
                pages: fixturePages(),
              },
              {
                id: "archive",
                locales: { supportedLocales: ["en-001"], defaultLocale: "en-001" },
                pages: [
                  {
                    id: "other",
                    route: ["other"],
                    publication: "published",
                    representations: [representation("en-001", [jsonSource(`${CONTENT}/wo035-other.en-001.json`)])],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** The fixture selection: a test-only canonical base, the declared short alias and the selected Site. */
function fixtureSelection() {
  return {
    version: 1,
    entityId: ENTITY_ID,
    selectedSite: { facetId: "foundation", siteId: "main" },
    languagePreferences: { en: "en-001" },
    base: { canonical: TEST_BASE, aliases: [] },
  };
}

/** The pinned local Next CLI entry point. */
function nextBinPath() {
  for (const candidate of [
    resolve(ROOT, "node_modules/next/dist/bin/next"),
    resolve(ROOT, "node_modules/next/dist/bin/next.js"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** An ephemeral loopback port, chosen and released by the OS. */
async function freeLoopbackPort() {
  return new Promise((resolvePort, rejectPort) => {
    const probe = createServer();
    probe.once("error", rejectPort);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => resolvePort(port));
    });
  });
}

/** True when something is still listening on the port. */
async function portStillOpen(port) {
  return new Promise((resolveOpen) => {
    const probe = createServer();
    probe.once("error", () => resolveOpen(true));
    probe.listen(port, HOST, () => probe.close(() => resolveOpen(false)));
  });
}

/** Run one child to completion with a bounded deadline, capturing output. */
async function runChild(args, timeoutMs) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", CI: "1" },
    windowsHide: true,
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  const deadline = Date.now() + timeoutMs;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
    await delay(200);
  }
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await delay(500);
    return { code: -1, output: output.join("") };
  }
  return { code: child.exitCode ?? -1, output: output.join("") };
}

/** Stop exactly the child this gate spawned, and wait for it, on every path. */
async function stopChild(child) {
  if (child === null) return;
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  let deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
    await delay(100);
  }
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
    while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
      await delay(100);
    }
  }
}

/** One real HTTP request against the loopback production server. */
async function request(url, extraHeaders) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { "user-agent": "uno-u04-gate/1.0", ...(extraHeaders ?? {}) },
  });
  const body = await response.text();
  return { status: response.status, location: response.headers.get("location"), body };
}

/** Build markers that must never appear in a clean production build. */
const BUILD_WARNING_MARKERS = Object.freeze([
  "Warning:",
  "Failed to compile",
  "Dynamic filesystem access causes tracing of the whole project",
  "Turbopack build encountered",
]);

/** Assert that one real production build printed neither warnings nor errors. */
function checkBuildClean(label, output) {
  const warningLines = (output.match(/^\s*Warning:/gmu) ?? []).length;
  const errorLines = (output.match(/^\s*Error:/gmu) ?? []).length;
  check(`${label} prints no build warning`, warningLines === 0, `${warningLines} warning lines`);
  check(`${label} prints no build error`, errorLines === 0, `${errorLines} error lines`);
  for (const marker of BUILD_WARNING_MARKERS) {
    check(`${label} never reports "${marker}"`, !output.includes(marker));
  }
}

/** Run the bounded trace inspector against one real build. */
function checkTrace(label, expectation) {
  const result = spawnSync(
    process.execPath,
    [resolve(ROOT, "scripts/verify-u03-trace.mjs"), "--root", ROOT, "--expect", expectation, "--json"],
    { cwd: ROOT, encoding: "utf8" },
  );
  let report = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    report = null;
  }
  check(
    `${label} passes the bounded trace inspection`,
    result.status === 0 && report !== null && report.accepted === true,
    report === null ? `exit ${result.status}` : report.reasons.join(", "),
  );
}

/** Assert every precondition: pinned declarations, absent fixture sources, clean tracked tree. */
function preflight() {
  check("the gate runs from the Uno checkout root", existsSync(resolve(ROOT, "package.json")));
  for (const [relativePath, digest] of PINNED_DECLARATIONS) {
    check(
      `${relativePath} is byte-identical to the pinned committed declaration`,
      sha256Of(relativePath) === digest,
    );
  }
  for (const relativePath of FIXTURE_SOURCES) {
    check(`the fixture source ${relativePath} is absent`, !existsSync(resolve(ROOT, relativePath)));
  }
  check("the committed Home Markdown is present", existsSync(resolve(ROOT, `${CONTENT}/home.en-001.md`)));

  const staged = spawnSync("git", ["--no-optional-locks", "diff", "--cached", "--name-only"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("nothing is staged before the fixture", staged.stdout.trim() === "", staged.stdout.trim());
  const deployment = spawnSync("git", ["--no-optional-locks", "status", "--porcelain=v1", "--", "deployment"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const unexpected = deployment.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !STARTER_PATHS.some((starterPath) => line.endsWith(` ${starterPath}`)));
  check(
    "no committed deployment input outside the authorized starter paths is modified before the fixture",
    unexpected.length === 0,
    unexpected.join(" | "),
  );
  const active = spawnSync("git", ["check-ignore", "--", ".documents/WIP/workorder-active.md"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("the private ACTIVE stays ignored", active.status === 0);
}

/** The public Pages this fixture declares, and the exact canonical each one must advertise. */
const PUBLIC_PAGES = Object.freeze([
  { pathname: "/en-001", locale: "en-001", title: "Uno listing fixture", canonical: `${TEST_BASE}/en-001` },
  { pathname: "/de-de", locale: "de-DE", title: "Uno Listenseite", canonical: `${TEST_BASE}/de-de` },
  {
    pathname: "/en-001/programmes/components",
    locale: "en-001",
    title: "Component listing",
    canonical: `${TEST_BASE}/en-001/programmes/components`,
  },
  {
    pathname: "/de-de/programmes/components",
    locale: "de-DE",
    title: "Komponentenliste",
    canonical: `${TEST_BASE}/de-de/programmes/components`,
  },
  { pathname: "/en-001/notes", locale: "en-001", title: "Notes", canonical: `${TEST_BASE}/en-001/notes` },
]);

/** Every address this fixture must refuse with a real 404, and the plan-level reason it is refused. */
const REFUSED_PAGES = Object.freeze([
  { pathname: "/en-001/unsupported", reason: "renderer-unavailable" },
  { pathname: "/en-001/unknown", reason: "unknown-module" },
  { pathname: "/en-001/version", reason: "unsupported-version" },
  { pathname: "/en-001/extrakey", reason: "unexpected-key" },
  { pathname: "/en-001/unsafe", reason: "unsafe-link" },
  { pathname: "/en-001/target", reason: "unresolved-target" },
  { pathname: "/en-001/duplicate", reason: "duplicate-section-id" },
  { pathname: "/en-001/deep", reason: "too-deep" },
  { pathname: "/en-001/wide", reason: "too-many-nodes" },
  { pathname: "/en-001/broken", reason: "malformed-preferred-json" },
  { pathname: "/en-001/draft", reason: "draft" },
  { pathname: "/en-001/other", reason: "wrong-site" },
  { pathname: "/fr-fr", reason: "undeclared-locale" },
  { pathname: "/de-de/notes", reason: "missing-locale" },
  { pathname: "/en-001/missing", reason: "unknown-page" },
  { pathname: "/en-001/NOTES", reason: "case-mismatch" },
  // The three unique negatives of the modules added by UNO-WO-037 / R01.
  { pathname: "/en-001/herobody", reason: "invalid-props" },
  { pathname: "/en-001/statslevel", reason: "heading-order" },
  { pathname: "/en-001/quotemarkup", reason: "unsafe-text" },
  // The nine unique negatives of the modules added by UNO-WO-038 / R01: three distinct Pages per module.
  { pathname: "/en-001/bentocount", reason: "invalid-props" },
  { pathname: "/en-001/bentotile", reason: "invalid-props" },
  { pathname: "/en-001/bentoone", reason: "invalid-children" },
  { pathname: "/en-001/pricedouble", reason: "invalid-props" },
  { pathname: "/en-001/priceamount", reason: "invalid-props" },
  { pathname: "/en-001/pricelevel", reason: "heading-order" },
  { pathname: "/en-001/timelinedouble", reason: "invalid-props" },
  { pathname: "/en-001/timelinestatus", reason: "invalid-props" },
  { pathname: "/en-001/timelinemarkup", reason: "unsafe-text" },
]);

/**
 * Validate the installed fixture with the REAL loader, planner and serving composition, before any build.
 *
 * A fixture that does not behave here is never built, so a build failure can never be confused with a rule
 * failure.
 */
async function validateFixtureInProcess() {
  const { loadUnoCandidateSource } = await import("../src/adapters/efs/uno-confined-source-reader.ts");
  const { planUnoPublishedPage } = await import("../src/application/plan-uno-published-page.ts");
  const { listUnoServingAddresses, planUnoServingDiscovery } = await import("../src/config/uno-serving.ts");
  const { readUnoPageDocument } = await import("../src/core/page-document.ts");

  const manifest = JSON.parse(readFileSync(resolve(ROOT, MANIFEST), "utf8"));
  const selection = JSON.parse(readFileSync(resolve(ROOT, SELECTION), "utf8"));
  const base = { canonical: TEST_BASE, aliases: [] };

  /** Plan one address exactly as the server does. */
  const plan = async (pathname) => {
    const loaded = await loadUnoCandidateSource({ repoRoot: ROOT, pathname });
    if (!loaded.accepted) return { accepted: false, stage: "load" };
    const planned = planUnoPublishedPage({
      manifest,
      selection,
      base,
      pathname,
      loadedSource: { accepted: true, candidate: loaded.candidate, kind: loaded.kind, text: loaded.text },
    });
    return planned.accepted ? { accepted: true, stage: "plan", planned } : { accepted: false, stage: "plan" };
  };

  for (const page of PUBLIC_PAGES) {
    const outcome = await plan(page.pathname);
    check(`the fixture planner accepts ${page.pathname}`, outcome.accepted === true);
    if (!outcome.accepted) continue;
    check(
      `${page.pathname} carries a validated JSON document or a Markdown body`,
      outcome.planned.document.pageDocument !== undefined || outcome.planned.document.markdownBody !== undefined,
    );
    check(`${page.pathname} canonical is exact`, outcome.planned.delivery.canonicalUrl === page.canonical);
  }

  const preview = await plan("/en-001/preview");
  check(
    "the unlisted Page plans as published and unlisted",
    preview.accepted === true && preview.planned.delivery.unlisted === true,
  );
  if (preview.accepted) {
    check("the unlisted Page carries its validated document", preview.planned.document.pageDocument !== undefined);
    check("the unlisted Page is not indexable", preview.planned.delivery.indexable === false);
    check("the unlisted Page is excluded from the sitemap", preview.planned.delivery.eligible.sitemap === false);
    check("the unlisted Page advertises no alternate", preview.planned.delivery.eligible.hreflang === false);
  }

  // The three modules added by UNO-WO-037 / R01 are proved with the REAL contract, not a string match.
  const components = await plan("/en-001/programmes/components");
  const componentModules =
    components.accepted && components.planned.document.pageDocument !== undefined
      ? components.planned.document.pageDocument.sections.map((node) => node.module)
      : [];
  for (const moduleId of [
    "content.hero",
    "content.stats",
    "content.testimonials",
    "layout.bento",
    "content.pricing",
    "content.timeline",
  ]) {
    check(`the accepted components Page carries ${moduleId}`, componentModules.includes(moduleId));
  }
  check(
    "the accepted components Page keeps exactly one actions module",
    componentModules.filter((moduleId) => moduleId === "content.actions").length === 1,
  );

  // Each added module refuses its OWN negative document with its own closed reason.
  for (const [moduleId, negativeDocument, reason] of [
    ["content.hero", JSON_DOCUMENTS.heroBodyMissing, "document:invalid-props"],
    ["content.stats", JSON_DOCUMENTS.statsHeadingSkip, "document:heading-order"],
    ["content.testimonials", JSON_DOCUMENTS.quoteMarkup, "document:unsafe-text"],
    ["layout.bento", JSON_DOCUMENTS.bentoCountMismatch, "document:invalid-props"],
    ["layout.bento", JSON_DOCUMENTS.bentoForeignTile, "document:invalid-props"],
    ["layout.bento", JSON_DOCUMENTS.bentoSingleChild, "document:invalid-children"],
    ["content.pricing", JSON_DOCUMENTS.priceDoubleFeatured, "document:invalid-props"],
    ["content.pricing", JSON_DOCUMENTS.priceEmptyAmount, "document:invalid-props"],
    ["content.pricing", JSON_DOCUMENTS.priceHeadingSkip, "document:heading-order"],
    ["content.timeline", JSON_DOCUMENTS.timelineDoubleCurrent, "document:invalid-props"],
    ["content.timeline", JSON_DOCUMENTS.timelineBadStatus, "document:invalid-props"],
    ["content.timeline", JSON_DOCUMENTS.timelineMarkup, "document:unsafe-text"],
  ]) {
    const verdict = readUnoPageDocument(negativeDocument);
    check(
      `${moduleId} refuses its unique negative with ${reason}`,
      verdict.accepted === false && verdict.reason === reason,
      verdict.accepted ? "accepted" : verdict.reason,
    );
  }

  for (const refused of REFUSED_PAGES) {
    const outcome = await plan(refused.pathname);
    const refusedThere = outcome.accepted === false || outcome.planned.document.pageDocument === undefined;
    check(`the fixture planner refuses ${refused.pathname} (${refused.reason})`, refusedThere);
  }

  const discovery = await planUnoServingDiscovery();
  check("the fixture discovery plan is accepted", discovery.status === "planned");
  if (discovery.status === "planned") {
    const urls = discovery.plan.sitemapUrls;
    check("the fixture discovery plan holds exactly the five public entries", urls.length === 5, urls.join(", "));
    for (const page of PUBLIC_PAGES) {
      check(`discovery advertises ${page.canonical}`, urls.includes(page.canonical));
    }
    check(
      "discovery never advertises an unlisted, draft or refused Page",
      !urls.some((url) =>
        /\/(preview|draft|unsupported|unknown|version|extrakey|unsafe|target|duplicate|deep|wide|broken|other|absent)$/u.test(url),
      ),
    );
  }

  const addresses = await listUnoServingAddresses();
  const keys = addresses.map((address) => `${address.locale}/${address.segments.join("/")}`);
  check("the build enumerates the unlisted Page so its exact address can be served", keys.includes("en-001/preview"));
  check("the build never enumerates a refused Page", !keys.includes("en-001/unsupported") && !keys.includes("en-001/broken"));

  // The reserved Home rule cannot be expressed over HTTP without sacrificing the positive Home, so it is proved
  // here against the real validator with the real reserved-Home flag.
  const unlistedHome = readUnoPageDocument({ ...JSON_DOCUMENTS.homeEn, visibility: "unlisted" }, { reservedHome: true });
  check(
    "the reserved Home refuses an unlisted JSON document",
    unlistedHome.accepted === false && unlistedHome.reason === "document:home-cannot-be-unlisted",
  );
}

/** Count non-overlapping occurrences of one regular expression in a string. */
function countOf(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

/** Assert one served public Page over real HTTP. */
async function assertPublicPage(base, entry) {
  const response = await request(`${base}${entry.pathname}`);
  if (!check(`${entry.pathname} answers 200`, response.status === 200, `status ${response.status}`)) return;
  const body = response.body;

  check(`${entry.pathname} declares the truthful html lang`, body.includes(`<html lang="${entry.locale}"`));
  check(`${entry.pathname} renders exactly one h1`, countOf(body, /<h1[\s>]/gu) === 1);
  check(`${entry.pathname} renders its own title`, body.includes(`>${entry.title}</h1>`));
  check(`${entry.pathname} declares the exact canonical URL`, body.includes(`<link rel="canonical" href="${entry.canonical}"/>`));
  check(`${entry.pathname} declares the exact og:url`, body.includes(`<meta property="og:url" content="${entry.canonical}"/>`));
  check(`${entry.pathname} renders no second main landmark`, countOf(body, /<main[\s>]/gu) === 1);

  if (entry.pathname.endsWith("/programmes/components")) {
    const german = entry.locale === "de-DE";
    check(
      `${entry.pathname} renders two semantic article cards`,
      countOf(body, /<article class="uno-json-card"/gu) === 2,
      `${countOf(body, /<article class="uno-json-card"/gu)}`,
    );
    check(
      `${entry.pathname} declares a two-column article grid`,
      body.includes('data-uno-columns="2"') && body.includes('data-uno-item-semantics="article"'),
    );
    check(`${entry.pathname} renders a real same-page action link`, body.includes('href="#card-one"'));
    check(
      `${entry.pathname} renders both card headings`,
      body.includes(german ? ">Erste Karte</h2>" : ">Card one</h2>") &&
        body.includes(german ? ">Zweite Karte</h2>" : ">Card two</h2>"),
    );

    // --- The three modules added by UNO-WO-037 / R01, proved in the REAL served markup ----------------
    check(`${entry.pathname} renders the hero section`, body.includes('class="uno-json-hero"'));
    check(
      `${entry.pathname} renders the hero with its closed alignment and surface`,
      body.includes('data-uno-align="center"') && body.includes('data-uno-surface="bordered"'),
    );
    check(
      `${entry.pathname} renders the authored hero eyebrow`,
      body.includes(german ? "Ueberblick zum Schritt" : "Increment overview"),
    );
    check(
      `${entry.pathname} renders the authored hero lede`,
      body.includes(german ? "Drei Module ergaenzen den geprueften Schnitt." : "Three modules join the validated slice here."),
    );
    check(
      `${entry.pathname} renders the authored hero support line`,
      body.includes(
        german ? "Jeder Wert unten ist verfasster Text, keine Live-Zahl." : "Every figure below is authored text, never a live number.",
      ),
    );
    check(
      `${entry.pathname} renders the hero action as a same-document anchor`,
      body.includes('href="#figures"') && body.includes(german ? "Zu den Zahlen" : "Jump to the figures"),
    );
    check(`${entry.pathname} renders the statistics description list`, body.includes('class="uno-json-stats-list"'));
    check(
      `${entry.pathname} links the statistics section to its own heading`,
      body.includes('aria-labelledby="figures-title"') && body.includes('id="figures-title"'),
    );
    check(
      `${entry.pathname} renders the authored statistics heading`,
      body.includes(german ? "Zahlen zum Schritt" : "Increment figures"),
    );
    check(`${entry.pathname} renders three statistic labels`, countOf(body, /<dt class="uno-json-stat-label">/gu) === 3);
    check(`${entry.pathname} renders three statistic values`, countOf(body, /<dd class="uno-json-stat-value">/gu) === 3);
    check(
      `${entry.pathname} renders the authored statistic detail`,
      body.includes(german ? "Acht akzeptiert, drei hier ergaenzt." : "Eight accepted, three added here."),
    );
    check(
      `${entry.pathname} renders two semantic quotation figures`,
      countOf(body, /<figure class="uno-json-testimonial">/gu) === 2,
    );
    check(
      `${entry.pathname} renders two quotation blockquotes`,
      countOf(body, /<blockquote class="uno-json-testimonial-quote">/gu) === 2,
    );
    check(
      `${entry.pathname} renders one quotation caption and no invented second one`,
      countOf(body, /<figcaption class="uno-json-testimonial-caption">/gu) === 1,
    );
    check(
      `${entry.pathname} keeps the authored quotation text`,
      body.includes(
        german ? "Die Ablehnungen des Vertrags sind die Funktion, nicht das Hindernis." : "The contract refusals are the feature, not the obstacle.",
      ),
    );
    check(
      `${entry.pathname} keeps authored markup out of the quotation`,
      !body.includes("<b>Bold</b>") && !body.includes("&lt;b&gt;Bold&lt;/b&gt;"),
    );

    // --- The three modules added by UNO-WO-038 / R01, proved in the REAL served markup ------------------
    check(`${entry.pathname} renders the bento container`, body.includes('class="uno-json-bento"'));
    check(
      `${entry.pathname} declares the authored three-column bento`,
      body.includes('data-uno-columns="3"') && body.includes('data-uno-item-semantics="article"'),
    );
    check(
      `${entry.pathname} renders one article tile per bento child`,
      countOf(body, /<article class="uno-json-tile"/gu) === 3,
      `${countOf(body, /<article class="uno-json-tile"/gu)}`,
    );
    check(
      `${entry.pathname} keeps the authored tile spans`,
      body.includes('data-uno-tile-span="feature"') &&
        body.includes('data-uno-tile-span="wide"') &&
        body.includes('data-uno-tile-span="standard"'),
    );
    check(
      `${entry.pathname} keeps the tile DOM order identical to the authored order`,
      body.indexOf('data-uno-tile-id="mosaic-lead"') < body.indexOf('data-uno-tile-id="mosaic-note"') &&
        body.indexOf('data-uno-tile-id="mosaic-note"') < body.indexOf('data-uno-tile-id="mosaic-side"'),
    );
    check(
      `${entry.pathname} renders the bento child heading and body`,
      body.includes(german ? "Mosaik" : "Mosaic") &&
        body.includes(german ? "Ein grosses Feld mit Text." : "A feature tile with body text."),
    );
    check(
      `${entry.pathname} renders the wide and standard tile bodies`,
      body.includes(german ? "Ein breites Feld." : "A wide tile body.") &&
        body.includes(german ? "Ein normales Feld." : "A standard tile body."),
    );
    check(`${entry.pathname} renders the pricing section`, body.includes('class="uno-json-pricing"'));
    check(
      `${entry.pathname} renders the pricing surface and heading reference`,
      body.includes('data-uno-surface="bordered"') &&
        body.includes('aria-labelledby="tiers-title"') &&
        body.includes('id="tiers-title"'),
    );
    check(
      `${entry.pathname} renders the authored pricing heading`,
      body.includes(german ? ">Stufen</h2>" : ">Programme tiers</h2>"),
    );
    check(`${entry.pathname} renders a real price list`, body.includes('<ul class="uno-json-price-list">'));
    check(
      `${entry.pathname} renders three priced list items`,
      countOf(body, /<li class="uno-json-price"/gu) === 3,
      `${countOf(body, /<li class="uno-json-price"/gu)}`,
    );
    check(
      `${entry.pathname} marks exactly one authored featured price`,
      countOf(body, /data-uno-featured="true"/gu) === 1,
      `${countOf(body, /data-uno-featured="true"/gu)}`,
    );
    check(`${entry.pathname} prints the authored amount verbatim`, body.includes(">CHF 40</span>"));
    check(
      `${entry.pathname} prints the authored unit and the unformatted remaining amount`,
      body.includes(german ? ">pro Monat</span>" : ">per month</span>") &&
        body.includes(german ? ">Auf Anfrage</span>" : ">On request</span>"),
    );
    check(
      `${entry.pathname} prints the authored price description`,
      body.includes(german ? "Nur verfasster Text, kein Preisalarm." : "Authored text only, no price alert."),
    );
    check(
      `${entry.pathname} derives no offer, rating or currency claim`,
      !body.includes("schema.org/Offer") && !body.includes("itemprop=\"price\"") && !body.includes("Add to cart"),
    );

    check(`${entry.pathname} renders the timeline section`, body.includes('class="uno-json-timeline"'));
    check(
      `${entry.pathname} renders the timeline surface and heading reference`,
      body.includes('data-uno-surface="muted"') &&
        body.includes('aria-labelledby="road-title"') &&
        body.includes('id="road-title"'),
    );
    check(
      `${entry.pathname} renders the authored timeline heading`,
      body.includes(german ? ">Ablauf</h2>" : ">Programme timeline</h2>"),
    );
    check(`${entry.pathname} renders a real ordered milestone list`, body.includes('<ol class="uno-json-timeline-list">'));
    check(
      `${entry.pathname} renders three milestone items`,
      countOf(body, /<li class="uno-json-timeline-item"/gu) === 3,
      `${countOf(body, /<li class="uno-json-timeline-item"/gu)}`,
    );
    check(
      `${entry.pathname} marks exactly one authored current step`,
      countOf(body, /aria-current="step"/gu) === 1,
      `${countOf(body, /aria-current="step"/gu)}`,
    );
    check(
      `${entry.pathname} keeps the three declared statuses distinct`,
      countOf(body, /data-uno-status="complete"/gu) === 1 &&
        countOf(body, /data-uno-status="current"/gu) === 1 &&
        countOf(body, /data-uno-status="upcoming"/gu) === 1,
    );
    check(
      `${entry.pathname} renders the authored milestone titles and date labels`,
      body.includes(german ? ">Vertragsbasis</p>" : ">Contract baseline</p>") &&
        body.includes(">Phase 1</span>") &&
        body.includes(german ? ">Modulschnitt</p>" : ">Module slice</p>"),
    );
    check(
      `${entry.pathname} renders the authored milestone description`,
      body.includes(german ? "Angenommen und geprueft." : "Accepted and reviewed."),
    );
    check(
      `${entry.pathname} renders a decorative marker per milestone and no ordered-list narration duplication`,
      countOf(body, /<span aria-hidden="true" class="uno-json-timeline-marker"><\/span>/gu) === 3,
    );
    check(
      `${entry.pathname} keeps the milestone DOM order identical to the authored order`,
      body.indexOf(german ? "Vertragsbasis" : "Contract baseline") <
        body.indexOf(german ? "Modulschnitt" : "Module slice") &&
        body.indexOf(german ? "Modulschnitt" : "Module slice") <
          body.indexOf(german ? "Praesentationshuelle" : "Presentation shell"),
    );
    check(
      `${entry.pathname} keeps eleven renderable modules and one h1 in the served document`,
      body.includes('class="uno-json-bento"') &&
        body.includes('class="uno-json-pricing"') &&
        body.includes('class="uno-json-timeline"') &&
        countOf(body, /<h1[\s>]/gu) === 1,
    );
  }
}

/** Assert the whole fixture over the running production server. */
async function assertOverHttp(base) {
  for (const entry of PUBLIC_PAGES) {
    await assertPublicPage(base, entry);
  }

  // The unlisted Page is directly addressable, canonical to itself, and absent from every discovery surface.
  const preview = await request(`${base}/en-001/preview`);
  check("/en-001/preview answers 200 at its exact address", preview.status === 200, `status ${preview.status}`);
  check(
    "/en-001/preview declares its own canonical URL",
    preview.body.includes(`<link rel="canonical" href="${TEST_BASE}/en-001/preview"/>`),
  );
  check("/en-001/preview is noindex,nofollow", /content="noindex,\s*nofollow/u.test(preview.body));
  check("/en-001/preview advertises no hreflang alternate", !preview.body.includes("hreflang"));
  check("/en-001/preview renders exactly one h1", countOf(preview.body, /<h1[\s>]/gu) === 1);

  // Every refusal is a genuine 404 with no leaked metadata, and no Markdown rescue for the malformed JSON Page.
  for (const refused of REFUSED_PAGES) {
    const response = await request(`${base}${refused.pathname}`);
    check(`${refused.pathname} answers a genuine 404 (${refused.reason})`, response.status === 404, `status ${response.status}`);
    check(
      `${refused.pathname} leaks no canonical, alternate or OG URL`,
      !response.body.includes('rel="canonical"') &&
        !response.body.includes("hreflang") &&
        !response.body.includes("og:url"),
    );
    check(
      `${refused.pathname} leaks no fixture Page title`,
      !response.body.includes("Unrenderable module") &&
        !response.body.includes("Broken alternative") &&
        !response.body.includes("Never published") &&
        !response.body.includes("Archive Site Page"),
    );
  }

  // The declared short alias still redirects a JSON Home, and only to the exact canonical address.
  const alias = await request(`${base}/en`);
  check("/en redirects to the declared canonical Home", alias.status >= 300 && alias.status < 400, `status ${alias.status}`);
  check("/en redirects to the exact Home canonical", alias.location === `${TEST_BASE}/en-001`, alias.location ?? "none");

  // robots.txt and sitemap.xml must agree with discovery, and must never name an unlisted or refused Page.
  const robots = await request(`${base}/robots.txt`);
  check("/robots.txt answers 200", robots.status === 200);
  check("/robots.txt names the canonical sitemap", robots.body.includes(`Sitemap: ${TEST_BASE}/sitemap.xml`));
  const sitemap = await request(`${base}/sitemap.xml`);
  check("/sitemap.xml answers 200", sitemap.status === 200);
  for (const entry of PUBLIC_PAGES) {
    check(`/sitemap.xml lists ${entry.canonical}`, sitemap.body.includes(entry.canonical));
  }
  check(
    "/sitemap.xml lists no unlisted, draft or refused Page",
    !sitemap.body.includes("/en-001/preview") &&
      !sitemap.body.includes("/en-001/draft") &&
      !sitemap.body.includes("/en-001/broken") &&
      !sitemap.body.includes("/en-001/unsupported"),
  );

  // Crawler parity: a Googlebot-shaped request sees the same document and the same privacy policy.
  const botHeaders = { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" };
  const asBot = await request(`${base}/en-001/programmes/components`, botHeaders);
  const asBrowser = await request(`${base}/en-001/programmes/components`);
  check("a crawler receives the same status as a browser", asBot.status === asBrowser.status);
  check(
    "a crawler receives the same canonical URL as a browser",
    asBot.body.includes(`<link rel="canonical" href="${TEST_BASE}/en-001/programmes/components"/>`) &&
      asBrowser.body.includes(`<link rel="canonical" href="${TEST_BASE}/en-001/programmes/components"/>`),
  );
  const botPreview = await request(`${base}/en-001/preview`, { "user-agent": "Googlebot/2.1" });
  check("an unlisted Page keeps noindex,nofollow for a crawler", /noindex,\s*nofollow/u.test(botPreview.body));

  // The Owner-accepted demonstration remains untouched.
  const demo = await request(`${base}/`);
  check("the demonstration still answers 200", demo.status === 200);
  check("the demonstration advertises no canonical URL", !demo.body.includes('rel="canonical"'));
  check("the demonstration remains noindex", /noindex/u.test(demo.body));
}

/**
 * Prove the Page in a real Chromium DOM at 320, 390, 768 and 1280 CSS pixels, in light and dark, with reduced
 * motion, and with no console error, page error or external request.
 */
async function assertInBrowser(base) {
  const { chromium } = await import("playwright");
  let browser = null;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const external = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("request", (requestEvent) => {
      const url = requestEvent.url();
      if (!url.startsWith(base) && !url.startsWith("data:")) external.push(url);
    });

    const target = `${base}/en-001/programmes/components`;
    const navigation = await page.goto(target, { waitUntil: "load" });
    check("the JSON Page answers 200 in a real browser", navigation !== null && navigation.status() === 200);

    const structure = await page.evaluate(() => ({
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main").length,
      articles: document.querySelectorAll("article.uno-json-card").length,
      headings: [...document.querySelectorAll("article.uno-json-card .uno-json-heading")].map((node) => node.textContent),
      gridColumns: document.querySelector(".uno-json-grid")?.getAttribute("data-uno-columns") ?? null,
      actionHref: document.querySelector("#listing-actions a.uno-json-action")?.getAttribute("href") ?? null,
    }));
    check("the browser DOM holds exactly one h1", structure.h1 === 1);
    check("the browser DOM holds exactly one main landmark", structure.main === 1);
    check("the browser DOM holds two semantic article cards", structure.articles === 2);
    check("the two cards carry unique headings", structure.headings.length === 2 && new Set(structure.headings).size === 2);
    check("the grid declares two columns", structure.gridColumns === "2");
    check("the action is a real same-page anchor", structure.actionHref === "#card-one");

    // The three modules added by UNO-WO-037 / R01, measured in the real rendered DOM.
    const added = await page.evaluate(() => {
      const hero = document.querySelector("section.uno-json-hero");
      const stats = document.querySelector("section.uno-json-stats");
      const voices = document.querySelector("section.uno-json-testimonials");
      const heroAction = hero?.querySelector("a.uno-json-action") ?? null;
      const statsHeading = stats?.querySelector(".uno-json-stats-heading") ?? null;
      return {
        heroAlign: hero?.getAttribute("data-uno-align") ?? null,
        heroSurface: hero?.getAttribute("data-uno-surface") ?? null,
        eyebrow: hero?.querySelector(".uno-json-eyebrow")?.textContent ?? null,
        lede: hero?.querySelector(".uno-json-hero-lede")?.textContent ?? null,
        support: hero?.querySelector(".uno-json-hero-support")?.textContent ?? null,
        heroActionHref: heroAction?.getAttribute("href") ?? null,
        statsLabelledBy: stats?.getAttribute("aria-labelledby") ?? null,
        statsHeadingId: statsHeading?.getAttribute("id") ?? null,
        statsHeadingText: statsHeading?.textContent ?? null,
        terms: stats?.querySelectorAll("dt.uno-json-stat-label").length ?? 0,
        definitions: stats?.querySelectorAll("dd.uno-json-stat-value").length ?? 0,
        details: stats?.querySelectorAll(".uno-json-stat-detail").length ?? 0,
        figures: voices?.querySelectorAll("figure.uno-json-testimonial").length ?? 0,
        quotes: voices?.querySelectorAll("blockquote.uno-json-testimonial-quote").length ?? 0,
        captions: voices?.querySelectorAll("figcaption.uno-json-testimonial-caption").length ?? 0,
        attribution: voices?.querySelector(".uno-json-testimonial-attribution")?.textContent ?? null,
        role: voices?.querySelector(".uno-json-testimonial-role")?.textContent ?? null,
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        articles: document.querySelectorAll("article.uno-json-card").length,
      };
    });
    check(
      "the hero renders in the DOM with its closed alignment and surface",
      added.heroAlign === "center" && added.heroSurface === "bordered",
    );
    check(
      "the hero carries its authored eyebrow, lede and support text",
      added.eyebrow === "Increment overview" &&
        (added.lede ?? "").includes("Three modules join the validated slice here.") &&
        (added.support ?? "").includes("Every figure below is authored text"),
    );
    check("the hero action targets the statistics section", added.heroActionHref === "#figures");
    check(
      "the statistics heading labels its own section without a dangling reference",
      added.statsHeadingId !== null && added.statsLabelledBy === added.statsHeadingId,
      `${added.statsLabelledBy}/${added.statsHeadingId}`,
    );
    check("the statistics heading text is the authored heading", added.statsHeadingText === "Increment figures");
    check(
      "the statistics list holds three terms and three descriptions",
      added.terms === 3 && added.definitions === 3,
      `${added.terms}/${added.definitions}`,
    );
    check("exactly one statistic carries authored detail", added.details === 1);
    check("the quotations render as figures with blockquotes", added.figures === 2 && added.quotes === 2);
    check("only the attributed quotation carries a caption", added.captions === 1, `${added.captions}`);
    check(
      "the attribution and role are rendered as authored data",
      added.attribution === "Review note A" && added.role === "Architecture review",
    );
    check(
      "the added modules keep one h1, one main landmark and two article cards",
      added.h1 === 1 && added.main === 1 && added.articles === 2,
      `${added.h1}/${added.main}/${added.articles}`,
    );

    // The three modules added by UNO-WO-038 / R01, measured in the real rendered DOM.
    const structure038 = await page.evaluate(() => {
      const bento = document.querySelector("div.uno-json-bento");
      const pricing = document.querySelector("section.uno-json-pricing");
      const timeline = document.querySelector("section.uno-json-timeline");
      const tiles = [...(bento?.querySelectorAll(".uno-json-tile") ?? [])];
      const prices = [...(pricing?.querySelectorAll("li.uno-json-price") ?? [])];
      const milestones = [...(timeline?.querySelectorAll("li.uno-json-timeline-item") ?? [])];
      return {
        bentoColumns: bento?.getAttribute("data-uno-columns") ?? null,
        bentoSemantics: bento?.getAttribute("data-uno-item-semantics") ?? null,
        tileCount: tiles.length,
        tileIds: tiles.map((tile) => tile.getAttribute("data-uno-tile-id")),
        tileSpans: tiles.map((tile) => tile.getAttribute("data-uno-tile-span")),
        articleTiles: tiles.filter((tile) => tile.tagName === "ARTICLE").length,
        bentoHeadings: bento?.querySelectorAll("h2").length ?? 0,
        priceItems: prices.length,
        priceList: pricing?.querySelector("ul.uno-json-price-list") !== null,
        featured: prices.filter((item) => item.getAttribute("data-uno-featured") === "true").length,
        priceLabels: prices.map((item) => item.querySelector(".uno-json-price-label")?.textContent ?? null),
        priceAmounts: prices.map((item) => item.querySelector(".uno-json-price-value")?.textContent ?? null),
        priceUnits: prices.map((item) => item.querySelector(".uno-json-price-unit")?.textContent ?? null),
        pricingLabelledBy: pricing?.getAttribute("aria-labelledby") ?? null,
        timelineList: timeline?.querySelector("ol.uno-json-timeline-list") !== null,
        milestones: milestones.length,
        milestoneTitles: milestones.map((item) => item.querySelector(".uno-json-timeline-title")?.textContent ?? null),
        currentSteps: milestones.filter((item) => item.getAttribute("aria-current") === "step").length,
        statuses: milestones.map((item) => item.getAttribute("data-uno-status")),
        markers: timeline?.querySelectorAll('span[aria-hidden="true"].uno-json-timeline-marker').length ?? 0,
        timelineLabelledBy: timeline?.getAttribute("aria-labelledby") ?? null,
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
      };
    });
    check("the bento declares three columns and article semantics", structure038.bentoColumns === "3" && structure038.bentoSemantics === "article");
    check("the bento renders one tile per child", structure038.tileCount === 3, `${structure038.tileCount}`);
    check(
      "the tiles carry the authored ids and spans in authored order",
      structure038.tileIds.join(",") === "mosaic-lead,mosaic-note,mosaic-side" &&
        structure038.tileSpans.join(",") === "feature,wide,standard",
      `${structure038.tileIds.join(",")}|${structure038.tileSpans.join(",")}`,
    );
    check("every bento tile is a real article element", structure038.articleTiles === 3, `${structure038.articleTiles}`);
    check("the bento child heading is a single h2 inside its tile", structure038.bentoHeadings === 1, `${structure038.bentoHeadings}`);
    check("the price list is a real unordered list", structure038.priceList === true);
    check("the price list holds three items", structure038.priceItems === 3, `${structure038.priceItems}`);
    check("exactly one price is marked featured", structure038.featured === 1, `${structure038.featured}`);
    check(
      "the price labels and amounts stay visibly paired and authored",
      structure038.priceLabels.join(",") === "Community,Team,Enterprise" &&
        structure038.priceAmounts.join(",") === "Free,CHF 40,On request",
      `${structure038.priceLabels.join(",")}|${structure038.priceAmounts.join(",")}`,
    );
    check("only the featured price carries the authored unit", structure038.priceUnits[1] === "per month" && structure038.priceUnits[0] === null);
    check("the pricing section is labelled by its own heading", structure038.pricingLabelledBy !== null && structure038.pricingLabelledBy === "tiers-title");
    check("the timeline is a real ordered list", structure038.timelineList === true);
    check("the timeline holds three authored milestones", structure038.milestones === 3, `${structure038.milestones}`);
    check(
      "the milestones keep the authored order",
      structure038.milestoneTitles.join(",") === "Contract baseline,Module slice,Presentation shell",
      structure038.milestoneTitles.join(","),
    );
    check("exactly one milestone is the current step", structure038.currentSteps === 1, `${structure038.currentSteps}`);
    check(
      "the three declared statuses are distinct and authored",
      structure038.statuses.join(",") === "complete,current,upcoming",
      structure038.statuses.join(","),
    );
    check("every milestone carries one decorative marker", structure038.markers === 3, `${structure038.markers}`);
    check("the timeline section is labelled by its own heading", structure038.timelineLabelledBy === "road-title");
    check(
      "the new modules keep one h1 and one main landmark",
      structure038.h1 === 1 && structure038.main === 1,
      `${structure038.h1}/${structure038.main}`,
    );

    const heroFocused = await page.evaluate(() => {
      const anchor = document.querySelector("section.uno-json-hero a.uno-json-action");
      if (anchor === null) return null;
      anchor.focus();
      return document.activeElement === anchor ? anchor.getAttribute("href") : null;
    });
    check("the hero action receives keyboard focus", heroFocused === "#figures");

    const focused = await page.evaluate(() => {
      const anchor = document.querySelector("#listing-actions a.uno-json-action");
      if (anchor === null) return null;
      anchor.focus();
      return document.activeElement === anchor ? anchor.getAttribute("href") : null;
    });
    check("the action receives keyboard focus", focused === "#card-one");

    // Responsive behaviour at the four required widths, with no horizontal overflow.
    for (const width of [1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const box = (node) => {
          const rect = node.getBoundingClientRect();
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        };
        const cards = [...document.querySelectorAll("article.uno-json-card")].map(box);
        const tiles = [...document.querySelectorAll(".uno-json-tile")].map(box);
        const prices = [...document.querySelectorAll("li.uno-json-price")].map(box);
        const milestones = [...document.querySelectorAll("li.uno-json-timeline-item")].map(box);
        const bento = document.querySelector(".uno-json-bento");
        const tracks = bento === null ? "" : getComputedStyle(bento).gridTemplateColumns;
        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          cards,
          tiles,
          prices,
          milestones,
          columns: tracks.trim().split(/\s+/u).filter((part) => part.length > 0).length,
        };
      });
      check(
        `${width}px has no horizontal overflow`,
        metrics.scrollWidth <= metrics.clientWidth + 1,
        `${metrics.scrollWidth}/${metrics.clientWidth}`,
      );
      if (width >= 768) {
        check(
          `${width}px places the two cards side by side`,
          metrics.cards.length === 2 && metrics.cards[0].y === metrics.cards[1].y && metrics.cards[0].x !== metrics.cards[1].x,
        );
      } else {
        check(`${width}px stacks the two cards`, metrics.cards.length === 2 && metrics.cards[0].y !== metrics.cards[1].y);
      }

      // The bento: the authored column count is honoured only where it fits, and a span never overflows.
      const expectedColumns = width >= 1280 ? 3 : width >= 768 ? 2 : 1;
      check(
        `${width}px resolves the bento to ${expectedColumns} column(s)`,
        metrics.columns === expectedColumns,
        `${metrics.columns}`,
      );
      check(
        `${width}px keeps every bento tile inside the viewport`,
        metrics.tiles.length === 3 && metrics.tiles.every((tile) => tile.right <= metrics.clientWidth + 1),
        metrics.tiles.map((tile) => `${tile.x}+${tile.width}`).join(" "),
      );
      if (width >= 768) {
        check(
          `${width}px applies the named spans, so the feature tile is wider than the standard tile`,
          metrics.tiles[0].width > metrics.tiles[2].width,
          `${metrics.tiles[0].width}/${metrics.tiles[2].width}`,
        );
      } else {
        check(
          `${width}px collapses every bento span to one column in authored order`,
          metrics.tiles.every((tile) => tile.x === metrics.tiles[0].x) &&
            metrics.tiles[1].y > metrics.tiles[0].y &&
            metrics.tiles[2].y > metrics.tiles[1].y,
          metrics.tiles.map((tile) => `${tile.x},${tile.y}`).join(" "),
        );
      }

      // Pricing: stacked on the narrow widths, at least two side by side where there is room.
      if (width >= 768) {
        check(
          `${width}px places at least two priced offers side by side`,
          metrics.prices.length === 3 && metrics.prices[0].y === metrics.prices[1].y && metrics.prices[0].x !== metrics.prices[1].x,
          metrics.prices.map((price) => `${price.x},${price.y}`).join(" "),
        );
      } else {
        check(
          `${width}px stacks the priced offers in authored order`,
          metrics.prices.length === 3 && metrics.prices[0].x === metrics.prices[1].x && metrics.prices[0].y < metrics.prices[1].y,
          metrics.prices.map((price) => `${price.x},${price.y}`).join(" "),
        );
      }

      // The timeline stays one truthful vertical column at every width, in authored order.
      check(
        `${width}px keeps the milestones in one vertical column in authored order`,
        metrics.milestones.length === 3 &&
          metrics.milestones.every((milestone, index) => {
            if (milestone.x !== metrics.milestones[0].x) return false;
            return index === 0 || milestone.y > metrics.milestones[index - 1].y;
          }),
        metrics.milestones.map((milestone) => `${milestone.x},${milestone.y}`).join(" "),
      );
    }

    // Dark mode legibility and reduced motion, measured in a fresh context created in that mode: a context-level
    // preference is what a real user has at first paint, and it is the reliable way to assert a CSS media query.
    const darkContext = await browser.newContext({
      viewport: { width: 390, height: 900 },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const darkPage = await darkContext.newPage();
    await darkPage.goto(target, { waitUntil: "load" });
    const dark = await darkPage.evaluate(() => {
      const body = getComputedStyle(document.body);
      const prose = document.querySelector(".uno-json-prose");
      const action = document.querySelector("a.uno-json-action");
      const token = getComputedStyle(document.documentElement).getPropertyValue("--uno-background").trim();
      const parse = (value) => (value.match(/\d+/gu) ?? []).slice(0, 3).map(Number);
      const luminance = ([r, g, b]) => {
        const channel = (value) => {
          const scaled = value / 255;
          return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const background = parse(body.backgroundColor);
      const foreground = parse(prose === null ? body.color : getComputedStyle(prose).color);
      const lighter = Math.max(luminance(background), luminance(foreground));
      const darker = Math.min(luminance(background), luminance(foreground));
      // The statistics value is the largest new text on the Page, so it carries its own contrast proof.
      const statSection = document.querySelector(".uno-json-stats");
      const statValue = document.querySelector(".uno-json-stat-value");
      const statBackground = parse(statSection === null ? "" : getComputedStyle(statSection).backgroundColor);
      const statForeground = parse(statValue === null ? "" : getComputedStyle(statValue).color);
      const statContrast =
        Number(((Math.max(luminance(statBackground), luminance(statForeground)) + 0.05) /
          (Math.min(luminance(statBackground), luminance(statForeground)) + 0.05)).toFixed(2));
      // The authored price amount and the milestone title carry their own contrast proofs in dark mode.
      const priceItem = document.querySelector("li.uno-json-price[data-uno-featured=\"true\"]");
      const priceValue = priceItem?.querySelector(".uno-json-price-value") ?? null;
      const priceBackground = parse(priceItem === null ? "" : getComputedStyle(priceItem).backgroundColor);
      const priceForeground = parse(priceValue === null ? "" : getComputedStyle(priceValue).color);
      const priceContrast =
        Number(((Math.max(luminance(priceBackground), luminance(priceForeground)) + 0.05) /
          (Math.min(luminance(priceBackground), luminance(priceForeground)) + 0.05)).toFixed(2));
      const milestoneTitle = document.querySelector(".uno-json-timeline-title");
      const milestoneForeground = parse(milestoneTitle === null ? "" : getComputedStyle(milestoneTitle).color);
      const milestoneContrast =
        Number(((Math.max(luminance(background), luminance(milestoneForeground)) + 0.05) /
          (Math.min(luminance(background), luminance(milestoneForeground)) + 0.05)).toFixed(2));
      return {
        prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
        prefersReduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        token,
        background,
        contrast: Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2)),
        statContrast,
        priceContrast,
        milestoneContrast,
        transition: action === null ? "none" : getComputedStyle(action).transitionDuration,
      };
    });
    await darkContext.close();

    check("the dark context reports a dark colour-scheme preference", dark.prefersDark === true);
    check("the dark context reports a reduced-motion preference", dark.prefersReduced === true);
    check("dark mode resolves the dark background token", dark.token.toLowerCase() === "#0c1118", dark.token);
    check("dark mode paints a dark background", dark.background.length === 3 && dark.background[0] < 60, dark.background.join(","));
    check("dark mode keeps body text above a 4.5:1 contrast ratio", dark.contrast >= 4.5, `${dark.contrast}`);
    check(
      "dark mode keeps the statistic value above a 4.5:1 contrast ratio",
      dark.statContrast >= 4.5,
      `${dark.statContrast}`,
    );
    check(
      "dark mode keeps the featured price amount above a 4.5:1 contrast ratio",
      dark.priceContrast >= 4.5,
      `${dark.priceContrast}`,
    );
    check(
      "dark mode keeps a milestone title above a 4.5:1 contrast ratio",
      dark.milestoneContrast >= 4.5,
      `${dark.milestoneContrast}`,
    );
    // The accepted demo already collapses every transition to `0.01ms !important` under reduced motion, so the
    // assertion is "effectively zero" and strictly far shorter than the animated default, not a literal `0s`.
    const normalTransition = await page.evaluate(() => {
      const anchor = document.querySelector("#listing-actions a.uno-json-action");
      return anchor === null ? "none" : getComputedStyle(anchor).transitionDuration;
    });
    const reducedSeconds = Number.parseFloat(dark.transition);
    const normalSeconds = Number.parseFloat(normalTransition);
    check("reduced motion collapses the action transition to at most 1ms", reducedSeconds <= 0.001, dark.transition);
    check(
      "reduced motion is far shorter than the animated default",
      Number.isFinite(normalSeconds) && reducedSeconds < normalSeconds / 50,
      `${dark.transition} vs ${normalTransition}`,
    );

    check("the Page logs no console error", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
    check("the Page throws no uncaught error", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));
    check("the Page makes no external request", external.length === 0, external.slice(0, 3).join(" | "));
  } catch (error) {
    check("the real browser proof ran without an exception", false, error instanceof Error ? error.message : String(error));
  } finally {
    if (browser !== null) await browser.close();
  }
}

async function main() {
  process.stdout.write("verify-u04-json-slice: the JSON Page vertical slice over a real production build\n");

  const nextBin = nextBinPath();
  if (nextBin === null) {
    process.stderr.write("verify-u04-json-slice: FAILED - the pinned local Next CLI was not found.\n");
    return 1;
  }

  mkdirSync(resolve(ROOT, ".temp"), { recursive: true });
  let child = null;
  let port = 0;
  let transaction = null;
  let restored = false;

  try {
    preflight();
    if (failures.length > 0) {
      process.stderr.write("verify-u04-json-slice: preflight refused; nothing was changed.\n");
      return 1;
    }

    const plan = fixturePlan();
    transaction = await prepareUnoU03FixtureTransaction({
      root: ROOT,
      declarations: plan.declarations,
      replacements: plan.replacements,
      fixtureSources: plan.fixtureSources,
      scratchRoot: resolve(ROOT, ".temp"),
    });
    if (transaction.status !== "armed") {
      for (const refusal of transaction.reasons) {
        check(`the fixture transaction refuses to start (${refusal})`, false, refusal);
      }
      process.stderr.write("verify-u04-json-slice: the transaction refused; nothing was changed.\n");
      return 1;
    }
    check("the fixture transaction is armed before any write", true);

    const installed = await transaction.install();
    if (!check("the fixture installs without a write failure", installed.ok === true, installed.cause ?? "")) {
      return 1;
    }
    check("the fixture manifest is installed", sha256Of(MANIFEST) !== PINNED_DECLARATIONS.get(MANIFEST));
    check("the fixture declaration is installed", sha256Of(SELECTION) !== PINNED_DECLARATIONS.get(SELECTION));

    await validateFixtureInProcess();
    if (failures.length > 0) {
      process.stderr.write("verify-u04-json-slice: the fixture failed validation; no build was attempted.\n");
      return 1;
    }

    // --- One real production build of the fixture -------------------------------------------------
    rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
    const build = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
    if (!check("the production build of the fixture succeeds", build.code === 0, `exit ${build.code}`)) {
      process.stderr.write(build.output.slice(-4000));
      return 1;
    }
    checkBuildClean("the fixture production build", build.output);
    checkTrace("the fixture production build", "fixture");
    if (failures.length > 0) {
      process.stderr.write(build.output.slice(-4000));
      process.stderr.write("verify-u04-json-slice: the fixture build is not clean or not bounded.\n");
      return 1;
    }

    port = await freeLoopbackPort();
    const base = `http://${HOST}:${port}`;
    child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
      windowsHide: true,
    });
    let serverOutput = "";
    child.stdout.on("data", (chunk) => (serverOutput += String(chunk)));
    child.stderr.on("data", (chunk) => (serverOutput += String(chunk)));

    let ready = false;
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) break;
      try {
        await request(`${base}/`);
        ready = true;
        break;
      } catch {
        await delay(250);
      }
    }
    if (!check("the production server reached readiness on loopback", ready, serverOutput.slice(-500))) {
      return 1;
    }

    await assertOverHttp(base);
    await assertInBrowser(base);

    check("server stayed up for the whole run", child.exitCode === null && child.signalCode === null);
    return 0;
  } finally {
    await stopChild(child);
    if (port !== 0) {
      check("loopback port released after shutdown", (await portStillOpen(port)) === false);
    }

    // Unconditional verification: the originals must be byte-exact and only transaction-created files may be gone.
    let restoreOutcome = null;
    if (transaction !== null && transaction.status === "armed") {
      restoreOutcome = await transaction.restore();
    }
    const problems = restoreOutcome !== null && restoreOutcome.ok === false ? restoreOutcome.reasons : [];
    restored = transaction === null ? failures.length > 0 : restoreOutcome !== null && restoreOutcome.ok === true;
    for (const problem of problems) {
      failures.push(problem);
      process.stdout.write(`  FAIL  ${problem}\n`);
    }
    if (restored && transaction !== null && transaction.status === "armed") {
      const disposed = await transaction.dispose();
      if (!disposed.ok) {
        restored = false;
        process.stdout.write("  FAIL  the transaction scratch could not be removed\n");
      }
    }
    process.stdout.write(
      restored
        ? "  PASS  the committed declarations and sources are restored byte-for-byte\n"
        : "  FAIL  restoration could not be proven; the recovery copies are preserved and the run must STOP\n",
    );
    if (restored) passes.push("restoration");
  }
}

function fixturePlan() {
  const sources = [
    [`${CONTENT}/wo035-home.en-001.json`, JSON.stringify(JSON_DOCUMENTS.homeEn, null, 2)],
    [`${CONTENT}/wo035-home.de-de.json`, JSON.stringify(JSON_DOCUMENTS.homeDe, null, 2)],
    [`${CONTENT}/wo035-components.en-001.json`, JSON.stringify(JSON_DOCUMENTS.componentsEn, null, 2)],
    [`${CONTENT}/wo035-components.de-de.json`, JSON.stringify(JSON_DOCUMENTS.componentsDe, null, 2)],
    [`${CONTENT}/wo035-notes.en-001.md`, MARKDOWN_DOCUMENTS.notes],
    [`${CONTENT}/wo035-preview.en-001.json`, JSON.stringify(JSON_DOCUMENTS.preview, null, 2)],
    [`${CONTENT}/wo035-unsupported.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unsupported, null, 2)],
    [`${CONTENT}/wo035-unknown.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unknown, null, 2)],
    [`${CONTENT}/wo035-version.en-001.json`, JSON.stringify(JSON_DOCUMENTS.versionUnsupported, null, 2)],
    [`${CONTENT}/wo035-extrakey.en-001.json`, JSON.stringify(JSON_DOCUMENTS.extraKey, null, 2)],
    [`${CONTENT}/wo035-unsafe.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unsafeLink, null, 2)],
    [`${CONTENT}/wo035-target.en-001.json`, JSON.stringify(JSON_DOCUMENTS.unresolvedTarget, null, 2)],
    [`${CONTENT}/wo035-duplicate.en-001.json`, JSON.stringify(JSON_DOCUMENTS.duplicateId, null, 2)],
    [`${CONTENT}/wo035-deep.en-001.json`, JSON.stringify(JSON_DOCUMENTS.tooDeep, null, 2)],
    [`${CONTENT}/wo035-wide.en-001.json`, JSON.stringify(JSON_DOCUMENTS.tooWide, null, 2)],
    // Deliberately truncated: declared *and* unparseable, so no Markdown may rescue it.
    [`${CONTENT}/wo035-broken.en-001.json`, '{ "version": 1, "title": "Broken", "sections": ['],
    [`${CONTENT}/wo035-broken.en-001.md`, MARKDOWN_DOCUMENTS.brokenAlternative],
    [`${CONTENT}/wo035-draft.en-001.md`, MARKDOWN_DOCUMENTS.draft],
    [`${CONTENT}/wo035-other.en-001.json`, JSON.stringify(JSON_DOCUMENTS.other, null, 2)],
    [`${CONTENT}/wo037-herobody.en-001.json`, JSON.stringify(JSON_DOCUMENTS.heroBodyMissing, null, 2)],
    [`${CONTENT}/wo037-statslevel.en-001.json`, JSON.stringify(JSON_DOCUMENTS.statsHeadingSkip, null, 2)],
    [`${CONTENT}/wo037-quotemarkup.en-001.json`, JSON.stringify(JSON_DOCUMENTS.quoteMarkup, null, 2)],
    [`${CONTENT}/wo038-bentocount.en-001.json`, JSON.stringify(JSON_DOCUMENTS.bentoCountMismatch, null, 2)],
    [`${CONTENT}/wo038-bentotile.en-001.json`, JSON.stringify(JSON_DOCUMENTS.bentoForeignTile, null, 2)],
    [`${CONTENT}/wo038-bentoone.en-001.json`, JSON.stringify(JSON_DOCUMENTS.bentoSingleChild, null, 2)],
    [`${CONTENT}/wo038-pricedouble.en-001.json`, JSON.stringify(JSON_DOCUMENTS.priceDoubleFeatured, null, 2)],
    [`${CONTENT}/wo038-priceamount.en-001.json`, JSON.stringify(JSON_DOCUMENTS.priceEmptyAmount, null, 2)],
    [`${CONTENT}/wo038-pricelevel.en-001.json`, JSON.stringify(JSON_DOCUMENTS.priceHeadingSkip, null, 2)],
    [`${CONTENT}/wo038-timelinedouble.en-001.json`, JSON.stringify(JSON_DOCUMENTS.timelineDoubleCurrent, null, 2)],
    [`${CONTENT}/wo038-timelinestatus.en-001.json`, JSON.stringify(JSON_DOCUMENTS.timelineBadStatus, null, 2)],
    [`${CONTENT}/wo038-timelinemarkup.en-001.json`, JSON.stringify(JSON_DOCUMENTS.timelineMarkup, null, 2)],
  ];
  return {
    declarations: [MANIFEST, SELECTION].map((path) => ({ path, digest: PINNED_DECLARATIONS.get(path) })),
    replacements: [
      { path: MANIFEST, bytes: Buffer.from(`${JSON.stringify(fixtureManifest(), null, 2)}\n`, "utf8") },
      { path: SELECTION, bytes: Buffer.from(`${JSON.stringify(fixtureSelection(), null, 2)}\n`, "utf8") },
    ],
    fixtureSources: sources.map(([path, text]) => ({ path, bytes: Buffer.from(text, "utf8") })),
  };
}

// Step 4: the final `.next` must correspond to the ORIGINAL unpublished sources, so the committed configuration is
// rebuilt and the existing fail-closed gate is re-run against it. Nothing here can succeed on a stale fixture.
const outcome = await main();

const declarationsRestored =
  sha256Of(MANIFEST) === PINNED_DECLARATIONS.get(MANIFEST) &&
  sha256Of(SELECTION) === PINNED_DECLARATIONS.get(SELECTION);

if (outcome === 0 && declarationsRestored) {
  process.stdout.write("\nverify-u04-json-slice: rebuilding the committed unpublished configuration\n");
  const nextBin = nextBinPath();
  rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
  const rebuild = await runChild([nextBin, "build"], BUILD_TIMEOUT_MS);
  check("the rebuild of the committed configuration succeeds", rebuild.code === 0, `exit ${rebuild.code}`);
  checkBuildClean("the committed rebuild", rebuild.output);
  checkTrace("the committed rebuild", "committed");

  const u03 = await runChild([resolve(ROOT, "scripts/verify-u03-http.mjs")], BUILD_TIMEOUT_MS);
  check("the original U03 fail-closed gate still passes", u03.code === 0, `exit ${u03.code}`);

  const status = spawnSync("git", ["--no-optional-locks", "status", "--porcelain=v1", "--", "deployment"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const unexpectedAfter = status.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !STARTER_PATHS.some((starterPath) => line.endsWith(` ${starterPath}`)));
  check(
    "no committed deployment input outside the authorized starter paths is modified after restoration",
    unexpectedAfter.length === 0,
    unexpectedAfter.join(" | "),
  );
  const staged = spawnSync("git", ["--no-optional-locks", "diff", "--cached", "--name-only"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  check("nothing was staged by the gate", staged.stdout.trim() === "", staged.stdout.trim());
} else if (outcome === 0) {
  check("the committed declarations are restored before the final rebuild", false, "digest mismatch");
}

process.stdout.write(`\nverify-u04-json-slice: ${passes.length} passed, ${failures.length} failed\n`);
if (failures.length > 0 || outcome !== 0) {
  process.stderr.write(
    `verify-u04-json-slice: FAILED\n${failures.map((failure) => `  - ${failure}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    "verify-u04-json-slice: OK - a validated JSON Page with its two-card article grid, hero, statistics and testimonials, unlisted privacy, strict refusals and a byte-exact restoration are proved over real production HTTP and Chromium.\n",
  );
  process.exitCode = 0;
}


