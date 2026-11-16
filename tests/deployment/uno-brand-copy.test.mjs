import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

/**
 * Foundation Uno — brand and copy contract (UNO-WO-016 / R01).
 *
 * Pure checks over committed inputs: the benefits-led visitor copy, the metadata, the official
 * network-derived vector, its favicon twin and the design tokens. No network, no provider, no
 * external asset. Every refusal is also proved against a SYNTHETIC fixture.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (relative) => readFileSync(`${ROOT}/${relative}`, 'utf8');

const COPY = Object.freeze({
  eyebrow: 'A Provelopment initiative · Open source · Next.js + TypeScript',
  heading: 'One organisation. One connected digital presence.',
  lead: 'Foundation Uno will bring an organisation',
  note: 'This is the live single-page introduction to Foundation Uno.',
  approach: 'A clear structure. Less duplication. Better decisions.',
  examples: 'What this will mean in practice',
  source: 'Built in the open. Designed for long-term ownership.',
  sourceLink: 'View Foundation Uno on GitHub',
  licence: 'The source is available under the Apache-2.0 licence.',
  footer: '© 2026 Provelopment. Foundation Uno is an open-source website foundation and a',
  title: 'Foundation Uno | One organisation. One connected digital presence.',
  description:
    'Foundation Uno by Provelopment will give organisations clear ownership, structured content, reliable publishing and intentionally authored regional editions.',
});

const LEVELS = Object.freeze([
  ['One Entity', 'One organisation will own the entire foundation.'],
  ['Purposeful Facets', 'Services, programmes and other areas of work will have distinct places within'],
  ['Deliberate Sites', 'Each Site will serve a defined purpose.'],
  ['Reliable Pages', 'Pages will draw from explicitly authored content sources, including Markdown'],
  ['Thoughtful regional editions', 'Language-and-region editions will be written and maintained deliberately.'],
]);

const EXAMPLE_LABELS = Object.freeze([
  'Example: a community organisation',
  'Example: a service provider with regional audiences',
]);

const EXAMPLE_BULLETS = Object.freeze([
  'Members will find the right service faster through clear organisation.',
  'Editors will maintain one accountable source for each page.',
  'The organisation will keep a consistent identity across its programmes.',
  'Visitors will receive relevant wording and guidance by region.',
  'Editors will control each edition instead of relying on automatic guesses.',
  'Teams will review changes with predictable, testable publishing rules.',
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

/** The light and dark colour tokens the approved design depends on (CSS must not change). */
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

/** The approved official-source derivative. */
const LOGO = Object.freeze({
  bytes: 8247,
  sha256: 'bd804ce683824ad85852615b0e0a700badb80cf2cdff38dd642d9f1947d57d9c',
  viewBox: '0 0 2048 2048',
  network: '#1f6f6b',
  numeral: '#000000',
  supersededColours: Object.freeze(['#101620', '#36454f']),
});

/** Canonical LF form so a Windows checkout and a Linux checkout hash identically. */
const canonical = (svg) => svg.replace(/\r\n/g, '\n');

/** Remove comments and decode entities so a wrapped sentence still matches the approved copy. */
const flat = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\s)\/\/[^\n]*/g, ' ')
    .replace(/&apos;|&#39;|&#x27;|&rsquo;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();


/** Every copy/brand violation of one page + layout + asset fixture. */
export function auditBrandCopy(fixture) {
  const problems = [];
  const page = flat(fixture.page);
  const layout = flat(fixture.layout);

  for (const [key, value] of Object.entries(fixture.copy)) {
    if (!page.includes(flat(value)) && !layout.includes(flat(value))) problems.push(`copy:${key}`);
  }
  for (const [heading, description] of fixture.levels) {
    if (!page.includes(flat(heading))) problems.push(`copy:level:${heading}`);
    if (!page.includes(flat(description))) problems.push(`copy:benefit:${heading}`);
  }
  for (const label of fixture.exampleLabels) {
    if (!page.includes(flat(label))) problems.push(`copy:example:${label}`);
  }
  for (const bullet of fixture.exampleBullets) {
    if (!page.includes(flat(bullet))) problems.push('copy:example-bullet');
  }
  for (const phrase of fixture.retired) {
    if (page.includes(phrase)) problems.push(`retired:${phrase}`);
  }
  if (!fixture.page.includes(`src="${fixture.logoPath}"`)) problems.push('brand:mark-missing');
  if (!fixture.page.includes('alt="Foundation Uno"')) problems.push('brand:alt-missing');
  if (!fixture.page.includes('unoptimized')) problems.push('brand:optimizer');

  const logo = fixture.logo;
  if (!/^<svg[\s>]/.test(logo) || !logo.trimEnd().endsWith('</svg>')) problems.push('brand:svg-invalid');
  if (!logo.includes(`viewBox="${LOGO.viewBox}"`)) problems.push('brand:svg-viewbox');
  if (!logo.includes(LOGO.network)) problems.push('brand:svg-network');
  if (!logo.includes(LOGO.numeral)) problems.push('brand:svg-numeral');
  for (const colour of LOGO.supersededColours) {
    if (logo.includes(colour)) problems.push('brand:svg-superseded');
  }
  if (ACTIVE_SVG.test(logo)) problems.push('brand:svg-unsafe');
  if ((logo.match(/<path/g) ?? []).length < 10) problems.push('brand:svg-geometry');
  if (Buffer.byteLength(canonical(logo), 'utf8') !== LOGO.bytes) problems.push('brand:svg-bytes');
  if (createHash('sha256').update(canonical(logo)).digest('hex') !== LOGO.sha256) {
    problems.push('brand:svg-digest');
  }
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
  exampleLabels: EXAMPLE_LABELS,
  exampleBullets: EXAMPLE_BULLETS,
  retired: RETIRED,
  logoPath: '/uno-logo.svg',
  tokens: REQUIRED_TOKENS,
});

const withChange = (key, mutate) => {
  const fixture = realFixture();
  fixture[key] = mutate(fixture[key]);
  return fixture;
};

const withAssets = (mutate) => {
  const fixture = realFixture();
  fixture.logo = mutate(fixture.logo);
  fixture.icon = fixture.logo;
  return fixture;
};

// --- Positive proof over the committed inputs ----------------------------------------

test('the committed copy, official vector and design tokens satisfy the contract', () => {
  assert.deepEqual(auditBrandCopy(realFixture()), []);
});

test('the hero states the product promise in forward-looking language', () => {
  const page = flat(read('src/app/page.tsx'));
  assert.equal(page.includes(COPY.eyebrow), true);
  assert.equal(page.includes(COPY.heading), true);
  assert.equal(page.includes(COPY.lead), true);
  assert.equal(page.includes(COPY.note), true);
  assert.equal(/will bring an organisation's websites/.test(page), true);
});

test('all five features pair a capability with a user benefit', () => {
  const page = flat(read('src/app/page.tsx'));
  for (const [heading, description] of LEVELS) {
    assert.equal(page.includes(heading), true, heading);
    assert.equal(page.includes(description), true, description);
  }
});

test('the two illustrative examples and their benefits are the approved copy', () => {
  const page = flat(read('src/app/page.tsx'));
  for (const label of EXAMPLE_LABELS) assert.equal(page.includes(label), true, label);
  for (const bullet of EXAMPLE_BULLETS) assert.equal(page.includes(bullet), true, bullet);
  assert.equal(
    /illustrations of the intended product experience, not descriptions of existing customers/.test(page),
    true,
  );
});

test('the source, licence and footer copy is approved', () => {
  const page = flat(read('src/app/page.tsx'));
  assert.equal(page.includes(COPY.source), true);
  assert.equal(page.includes(COPY.sourceLink), true);
  assert.equal(page.includes(COPY.licence), true);
  assert.equal(page.includes(COPY.footer), true);
  assert.equal((page.match(/href=\{SOURCE_URL\}/g) ?? []).length, 2);
});

test('the metadata is the approved pair and the robots policy is intact', () => {
  const layout = read('src/app/layout.tsx');
  assert.equal(layout.includes(COPY.title), true);
  assert.equal(layout.includes(COPY.description), true);
  assert.match(layout, /index:\s*false/);
  assert.match(layout, /follow:\s*false/);
  assert.match(layout, /nocache:\s*true/);
});

test('no retired internal claim survives in the visible page copy', () => {
  const page = flat(read('src/app/page.tsx'));
  for (const phrase of RETIRED) assert.equal(page.includes(phrase), false, phrase);
});

test('the vector is the official network with the enlarged black numeral', () => {
  const logo = read('public/uno-logo.svg');
  assert.equal(logo.startsWith('<svg'), true);
  assert.equal(logo.trimEnd().endsWith('</svg>'), true);
  assert.equal(logo.includes(`viewBox="${LOGO.viewBox}"`), true);
  assert.equal(logo.includes(LOGO.network), true, 'green network');
  assert.equal(logo.includes('fill="#000000"'), true, 'true black numeral');
  for (const colour of LOGO.supersededColours) {
    assert.equal(logo.includes(colour), false, `no superseded colour ${colour}`);
  }
  assert.equal((logo.match(/<path/g) ?? []).length, 11, 'ten network paths and one numeral');
  assert.equal(ACTIVE_SVG.test(logo), false);
});

test('the vector matches the pinned digest and byte length', () => {
  const logo = canonical(read('public/uno-logo.svg'));
  assert.equal(Buffer.byteLength(logo, 'utf8'), LOGO.bytes);
  assert.equal(createHash('sha256').update(logo).digest('hex'), LOGO.sha256);
});

test('the header mark and the favicon are the same bytes on disk', () => {
  const logo = read('public/uno-logo.svg');
  const icon = read('src/app/icon.svg');
  assert.equal(icon, logo);
  assert.equal(statSync(`${ROOT}/public/uno-logo.svg`).size, statSync(`${ROOT}/src/app/icon.svg`).size);
});

test('the header renders the local vector through the unoptimized image component', () => {
  const page = read('src/app/page.tsx');
  assert.equal(page.includes("from 'next/image'"), true);
  assert.equal(page.includes('src="/uno-logo.svg"'), true);
  assert.equal(page.includes('alt="Foundation Uno"'), true);
  assert.equal(page.includes('width={30}'), true);
  assert.equal(page.includes('height={30}'), true);
  assert.equal(page.includes('unoptimized'), true);
  assert.equal(page.includes('/_next/image'), false);
});

test('the favicon lives on the App Router icon route', () => {
  assert.equal(statSync(`${ROOT}/src/app/icon.svg`).isFile(), true);
  assert.equal(read('src/app/page.tsx').includes('/icon.svg'), false);
});

test('the approved colour tokens and responsive rules are untouched', () => {
  const css = read('src/app/globals.css');
  for (const token of REQUIRED_TOKENS) assert.equal(css.includes(token), true, token);
  assert.equal(css.includes('@media (max-width: 34rem)'), true);
  assert.equal(css.includes('prefers-reduced-motion'), true);
  assert.equal(css.includes('prefers-contrast'), true);
});


// --- Synthetic negatives: each drift must be caught ----------------------------------

test('negative fixture: a drifted headline is refused', () => {
  const fixture = realFixture();
  fixture.copy = { ...COPY, heading: 'Foundation Uno — a focused foundation for the web' };
  assert.deepEqual(auditBrandCopy(fixture), ['copy:heading']);
});

test('negative fixture: a retired claim reappearing is refused', () => {
  const fixture = withChange('page', (text) => `${text}<p>This page is not deployed.</p>\n`);
  assert.deepEqual(auditBrandCopy(fixture), ['retired:not deployed']);
});

test('negative fixture: an official-vector digest drift is refused', () => {
  const fixture = withAssets((text) => text.replace('<path', '<path data-drift="1"'));
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes('brand:svg-digest'), true);
  assert.equal(problems.includes('brand:svg-bytes'), true);
});

test('negative fixture: the superseded concept canvas is refused', () => {
  const fixture = withAssets((text) => text.replaceAll('0 0 2048 2048', '0 0 128 128'));
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes('brand:svg-viewbox'), true);
});

test('negative fixture: the superseded charcoal numeral is refused', () => {
  const fixture = withAssets((text) => text.replaceAll(LOGO.numeral, '#36454f'));
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes('brand:svg-numeral'), true);
  assert.equal(problems.includes('brand:svg-superseded'), true);
});

test('negative fixture: an SVG with a handler is refused', () => {
  const fixture = withAssets((text) => text.replace('<svg ', '<svg onload="alert(1)" '));
  assert.equal(auditBrandCopy(fixture).includes('brand:svg-unsafe'), true);
});

test('negative fixture: a divergent favicon is refused', () => {
  const fixture = withChange('icon', (text) => text.replaceAll('2048', '2049'));
  assert.deepEqual(auditBrandCopy(fixture), ['brand:favicon-parity']);
});

test('negative fixture: a recoloured design token is refused', () => {
  const fixture = withChange('css', (text) => text.replace('--uno-accent: #1f6f6b;', '--uno-accent: #d22;'));
  assert.equal(auditBrandCopy(fixture).includes('css:token-drift'), true);
});

test('negative fixture: a missing illustrative example label is refused', () => {
  const fixture = withChange('page', (text) => text.replace(EXAMPLE_LABELS[0], 'A community organisation'));
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes(`copy:example:${EXAMPLE_LABELS[0]}`), true);
});

test('negative fixture: a dropped benefit sentence is refused', () => {
  const fixture = withChange('page', (text) => text.replace(LEVELS[0][1], 'Ownership.'));
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes(`copy:benefit:${LEVELS[0][0]}`), true);
});

test('negative fixture: an image optimizer rewrite is refused', () => {
  const fixture = withChange('page', (text) =>
    text.replace('src="/uno-logo.svg"', 'src="/_next/image?url=%2Funo-logo.svg"'),
  );
  assert.equal(auditBrandCopy(fixture).includes('brand:mark-missing'), true);
});

// --- UNO-WO-017 / R01: the black numeral, and the withdrawn charcoal -------------------

test('a CRLF working-tree copy canonicalises to the same black vector digest', () => {
  const logo = read('public/uno-logo.svg');
  const crlf = canonical(logo).replace(/\n/g, '\r\n');
  assert.equal(crlf.includes('\r\n'), true, 'the variant really carries CRLF');
  assert.equal(crlf.includes('\r\r'), false, 'the variant is well-formed CRLF');
  assert.equal(Buffer.byteLength(canonical(crlf), 'utf8'), LOGO.bytes);
  assert.equal(createHash('sha256').update(canonical(crlf)).digest('hex'), LOGO.sha256);
});

test('the approved numeral is true black, not the withdrawn charcoal', () => {
  const logo = read('public/uno-logo.svg');
  assert.equal(logo.includes('fill="#000000"'), true);
  assert.equal(logo.includes('#36454f'), false);
  assert.equal(logo.includes('Enlarged black 1'), true);
  assert.equal(logo.includes('charcoal'), false);
});

test('negative fixture: the withdrawn charcoal asset is refused by digest and colour', () => {
  const fixture = withAssets((text) =>
    text.replaceAll('#000000', '#36454f').replace('Enlarged black 1', 'Enlarged charcoal 1'),
  );
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes('brand:svg-superseded'), true);
  assert.equal(problems.includes('brand:svg-digest'), true);
  assert.equal(problems.includes('brand:svg-bytes'), true, 'the withdrawn asset was three bytes longer');
});

test('negative fixture: a near-black numeral is refused', () => {
  const fixture = withAssets((text) => text.replace('fill="#000000"', 'fill="#0a0a0a"'));
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes('brand:svg-numeral'), true);
  assert.equal(problems.includes('brand:svg-digest'), true);
});

test('negative fixture: a single drifted network coordinate is refused', () => {
  const fixture = withAssets((text) => text.replace('M9792 18850', 'M9793 18850'));
  const problems = auditBrandCopy(fixture);
  assert.equal(problems.includes('brand:svg-digest'), true);
  assert.equal(problems.includes('brand:svg-geometry'), false, 'the path count is unchanged');
  assert.equal(problems.includes('brand:svg-numeral'), false, 'the numeral is untouched');
});
