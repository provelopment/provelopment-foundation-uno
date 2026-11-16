import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

/**
 * Foundation Uno — brand and copy contract (UNO-WO-015 / R01).
 *
 * Pure, dependency-free checks over committed inputs: the visitor copy, the metadata, the SVG
 * mark, its favicon twin and the design tokens. No network, no provider, no external asset.
 * Every refusal is also proved against a SYNTHETIC fixture, so an always-passing test cannot
 * satisfy this file.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (relative) => readFileSync(`${ROOT}/${relative}`, 'utf8');

const COPY = Object.freeze({
  eyebrow: 'A Provelopment initiative · Open source · Next.js + TypeScript',
  heading: 'Foundation Uno — a focused foundation for the web',
  lead: 'Foundation Uno is a working, open-source website demonstration from Provelopment',
  note: 'You are viewing a live, single-page example of Foundation Uno.',
  architecture: 'A clear structure for everything you publish',
  progress: 'Working today. Designed to grow.',
  source: 'Explore the source',
  sourceLink: 'View Foundation Uno on GitHub',
  footer: 'Foundation Uno is a Provelopment initiative. A live, open-source demonstration of a',
  title: 'Foundation Uno | A focused website foundation by Provelopment',
  description:
    'Explore Foundation Uno, a live, open-source single-page demonstration of a website foundation',
});

const LEVELS = Object.freeze([
  'The single organization that owns the website and its content.',
  "Distinct areas of the organization's work, organized under the same owner.",
  'Individual web presences with clearly defined responsibilities and a deliberate publication choice.',
  'Structured content with explicit sources, designed to support reliable publishing as the platform grows.',
  "Language-and-region-specific content authored intentionally, rather than inferred from a visitor's location.",
]);

const AVAILABLE = Object.freeze([
  'A live, responsive single-page website built with Next.js, React and TypeScript.',
  'A validated single-Entity content graph with an authored English Home source.',
  'Tested rules for content identity, safe URLs, source selection and authored locale declarations.',
  'Automated checks across Windows and Linux, including production HTTP and dependency-security tests.',
  'Publicly reviewable source code released under the Apache-2.0 licence.',
]);

const IN_DEVELOPMENT = Object.freeze([
  'Serving authored JSON and Markdown content through the website.',
  'Locale-aware page addresses, visibility controls and publication metadata.',
  'A wider library of layouts, content and interactive components.',
  'Reproducible setup, upgrades and release workflows for independent installations.',
]);

const RETIRED = Object.freeze([
  'A1',
  'P05',
  'technical placeholder',
  'not deployed',
  'no live deployment',
  'no manifest',
  'only the smallest pure primitives',
  'not a finished website',
  'no publication',
]);

const ACTIVE_SVG = /<script|<foreignObject|<image|xlink:href|\son[a-z]+\s*=|<!ENTITY|base64,/i;

/** The light and dark colour tokens the approved design depends on. */
const REQUIRED_TOKENS = Object.freeze([
  '--uno-accent: #1f6f6b;',
  '--uno-background: #ffffff;',
  '--uno-foreground: #101620;',
  '--uno-surface: #f5f7fb;',
  '--uno-border: #d7dee9;',
  '--uno-accent: #6fd3c9;',
  '--uno-surface: #141b24;',
  '--uno-border: #27313f;',
]);

/** Remove comments so a copy check judges visible words, not maintainer notes. */
const visible = (source) => source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, ' ');

/** Collapse source formatting and decode entities so a wrapped sentence still matches. */
const flat = (text) =>
  text
    .replace(/&apos;|&#39;|&#x27;|&rsquo;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Every copy/brand violation of one page + layout + asset fixture. */
export function auditBrandCopy(fixture) {
  const problems = [];
  const page = flat(visible(fixture.page));
  const layout = flat(fixture.layout);
  for (const [key, value] of Object.entries(fixture.copy)) {
    if (!page.includes(flat(value)) && !layout.includes(flat(value))) problems.push(`copy:${key}`);
  }
  for (const level of fixture.levels) {
    if (!page.includes(flat(level))) problems.push('copy:level');
  }
  for (const bullet of [...fixture.available, ...fixture.inDevelopment]) {
    if (!page.includes(flat(bullet))) problems.push('copy:bullet');
  }
  for (const phrase of fixture.retired) {
    if (page.includes(phrase)) problems.push(`retired:${phrase}`);
  }
  if (!fixture.page.includes(`src="${fixture.logoPath}"`)) problems.push('brand:mark-missing');
  if (!fixture.page.includes('alt="Foundation Uno"')) problems.push('brand:alt-missing');
  if (!/^<svg[\s>]/.test(fixture.logo) || !fixture.logo.trimEnd().endsWith('</svg>')) {
    problems.push('brand:svg-invalid');
  }
  if (!fixture.logo.includes('viewBox="0 0 128 128"')) problems.push('brand:svg-viewbox');
  if (!fixture.logo.includes('#1f6f6b') || !fixture.logo.includes('#101620')) {
    problems.push('brand:svg-palette');
  }
  if (ACTIVE_SVG.test(fixture.logo)) problems.push('brand:svg-unsafe');
  if (fixture.icon !== fixture.logo) problems.push('brand:favicon-parity');
  for (const token of fixture.tokens) {
    if (!fixture.css.includes(token)) problems.push('css:token-drift');
  }
  if (!fixture.css.includes('.uno-brand__mark')) problems.push('css:logo-rule-missing');
  return problems;
}

const realFixture = () => ({
  page: read('src/app/page.tsx'),
  layout: read('src/app/layout.tsx'),
  css: read('src/app/globals.css'),
  logo: read('public/uno-logo.svg'),
  icon: read('src/app/icon.svg'),
  copy: COPY,
  levels: LEVELS,
  available: AVAILABLE,
  inDevelopment: IN_DEVELOPMENT,
  retired: RETIRED,
  logoPath: '/uno-logo.svg',
  tokens: REQUIRED_TOKENS,
});

const withChange = (key, mutate) => {
  const fixture = realFixture();
  fixture[key] = mutate(fixture[key]);
  return fixture;
};


// --- Positive proof over the committed inputs ----------------------------------------

test('the committed copy, brand assets and design tokens satisfy the contract', () => {
  assert.deepEqual(auditBrandCopy(realFixture()), []);
});

test('the hero, eyebrow and disclosure are the approved sentences', () => {
  const page = read('src/app/page.tsx');
  assert.equal(page.includes(COPY.eyebrow), true);
  assert.equal(page.includes(COPY.heading), true);
  assert.equal(page.includes(COPY.lead), true);
  assert.equal(page.includes(COPY.note), true);
});

test('the three section headings are the approved copy', () => {
  const page = read('src/app/page.tsx');
  for (const heading of [COPY.architecture, COPY.progress, COPY.source]) {
    assert.equal(page.includes(heading), true, heading);
  }
});

test('all five architecture levels carry the approved descriptions', () => {
  const page = flat(read('src/app/page.tsx'));
  for (const description of LEVELS) assert.equal(page.includes(description), true, description);
  assert.equal((page.match(/<h3>/g) ?? []).length >= 7, true, 'five levels and two status cards');
});

test('the available and in-development lists are the approved sentences', () => {
  const page = flat(read('src/app/page.tsx'));
  for (const bullet of AVAILABLE) assert.equal(page.includes(bullet), true, bullet);
  for (const bullet of IN_DEVELOPMENT) assert.equal(page.includes(bullet), true, bullet);
});

test('the footer and the two source anchors are the approved copy', () => {
  const page = flat(read('src/app/page.tsx'));
  assert.equal(page.includes(COPY.footer), true);
  assert.equal(page.includes(COPY.sourceLink), true);
  assert.equal((page.match(/href=\{SOURCE_URL\}/g) ?? []).length, 2);
});

test('the metadata title and description are the approved copy', () => {
  const layout = read('src/app/layout.tsx');
  assert.equal(layout.includes(COPY.title), true);
  assert.equal(layout.includes(COPY.description), true);
  assert.match(layout, /index:\s*false/);
  assert.match(layout, /follow:\s*false/);
});

test('no retired status claim survives in the visible page copy', () => {
  const page = visible(read('src/app/page.tsx'));
  for (const phrase of RETIRED) assert.equal(page.includes(phrase), false, phrase);
});

test('the mark is a static, sanitised SVG with the approved palette', () => {
  const logo = read('public/uno-logo.svg');
  assert.equal(logo.startsWith('<svg'), true);
  assert.equal(logo.trimEnd().endsWith('</svg>'), true);
  assert.equal(logo.includes('viewBox="0 0 128 128"'), true);
  assert.equal(logo.includes('#1f6f6b'), true, 'green network');
  assert.equal(logo.includes('#101620'), true, 'dark numeral');
  assert.equal(logo.includes('#ffffff'), true, 'white keyline');
  assert.equal(ACTIVE_SVG.test(logo), false);
});

test('the header mark and the favicon are the same bytes on disk', () => {
  const logo = read('public/uno-logo.svg');
  const icon = read('src/app/icon.svg');
  assert.equal(icon, logo);
  assert.equal(statSync(`${ROOT}/public/uno-logo.svg`).size, statSync(`${ROOT}/src/app/icon.svg`).size);
});

test('the favicon lives on the App Router icon route and the header uses the public mark', () => {
  const page = read('src/app/page.tsx');
  assert.equal(page.includes('src="/uno-logo.svg"'), true);
  assert.equal(page.includes('alt="Foundation Uno"'), true);
  assert.equal(statSync(`${ROOT}/src/app/icon.svg`).isFile(), true);
  assert.equal(page.includes('/icon.svg'), false, 'the page never hard-codes the icon route');
});

test('the approved colour tokens and responsive rules are intact', () => {
  const css = read('src/app/globals.css');
  for (const token of REQUIRED_TOKENS) assert.equal(css.includes(token), true, token);
  assert.equal(css.includes('@media (max-width: 34rem)'), true);
  assert.equal(css.includes('prefers-reduced-motion'), true);
  assert.equal(css.includes('prefers-contrast'), true);
});


// --- Synthetic negatives: each drift must be caught ----------------------------------

test('negative fixture: a drifted hero heading is refused', () => {
  const fixture = realFixture();
  fixture.copy = { ...COPY, heading: 'Foundation Uno — a single-Entity website foundation' };
  assert.deepEqual(auditBrandCopy(fixture), ['copy:heading']);
});

test('negative fixture: a retired claim reappearing is refused', () => {
  const fixture = withChange('page', (text) => `${text}<p>This page is not deployed.</p>\n`);
  assert.deepEqual(auditBrandCopy(fixture), ['retired:not deployed']);
});

test('negative fixture: an SVG with a handler is refused', () => {
  const fixture = withChange('logo', (text) => text.replace('<svg ', '<svg onload="alert(1)" '));
  assert.equal(auditBrandCopy(fixture).includes('brand:svg-unsafe'), true);
});

test('negative fixture: a divergent favicon is refused', () => {
  const fixture = withChange('icon', (text) => text.replace('r="6.5"', 'r="7"'));
  assert.deepEqual(auditBrandCopy(fixture), ['brand:favicon-parity']);
});

test('negative fixture: a recoloured design token is refused', () => {
  const fixture = withChange('css', (text) => text.replace('--uno-accent: #1f6f6b;', '--uno-accent: #d22;'));
  assert.equal(auditBrandCopy(fixture).includes('css:token-drift'), true);
});
