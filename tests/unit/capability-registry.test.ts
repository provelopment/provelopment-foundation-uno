import { describe, expect, it } from 'vitest';

import {
  CAPABILITIES_BY_GROUP,
  CAPABILITY_GROUPS,
  CAPABILITY_IDS,
  FOUNDATION_PAGE_SECTION_FAMILIES,
  type CapabilityGroup,
  type CapabilityId,
  capabilityGroupFor,
  isCapabilityId,
} from '../../src/core/modules/capability-registry';

/**
 * Focused positive and refusal tests for the Uno A1 capability vocabulary
 * (`UNO-WO-007 / R01`).
 *
 * Scope note: these tests prove the *contract vocabulary* only — the exact 22 approved IDs,
 * their single owning group, membership/refusal behaviour, and the separation of the 17
 * observed Foundation families from those IDs. They prove no renderer, props, schema,
 * route, provider or delivery exists, and none is claimed.
 */

/**
 * Expected approved IDs, written out independently of the module under test so a change to
 * the registry cannot silently redefine its own fixture. The `Record<CapabilityGroup, …>`
 * type also makes group exhaustiveness a compile-time requirement.
 */
const EXPECTED_BY_GROUP: Record<CapabilityGroup, readonly CapabilityId[]> = {
  layout: ['layout.stack', 'layout.grid', 'layout.bento', 'layout.layers'],
  content: [
    'content.heading',
    'content.prose',
    'content.actions',
    'content.hero',
    'content.stats',
    'content.testimonials',
    'content.pricing',
    'content.timeline',
  ],
  media: ['media.image', 'media.video', 'media.gallery', 'media.carousel'],
  design: ['design.watermark', 'design.motion'],
  interaction: [
    'interaction.tabs',
    'interaction.accordion',
    'interaction.modal',
    'interaction.contact',
  ],
};

const EXPECTED_IDS = Object.values(EXPECTED_BY_GROUP).flat();

const EXPECTED_FAMILIES = [
  'hero',
  'prose',
  'media',
  'gallery',
  'actions',
  'callout',
  'cards',
  'features',
  'columns',
  'steps',
  'stats',
  'quote',
  'table',
  'faq',
  'list',
  'divider',
  'contactForm',
];

/** Identifiers that must never be accepted: near-misses, coercion bait and prototype keys. */
const REFUSED_VALUES: readonly unknown[] = [
  'layout',
  'content',
  'layout.',
  '.stack',
  'layout..stack',
  'layout.stack.',
  'layout.unknown',
  'component.card',
  'interaction.contactForm',
  'content.table',
  'content.hero.primary',
  'content.hero ',
  ' content.hero',
  ' content.hero ',
  '',
  ' ',
  '\n',
  'content.hero\n',
  'Layout.Stack',
  'LAYOUT.STACK',
  'Content.Hero',
  'layout_stack',
  'layout stack',
  'layout/stack',
  'constructor',
  '__proto__',
  'prototype',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'undefined',
  'null',
];

describe('A1 capability registry — the exact approved vocabulary', () => {
  it('declares exactly the five approved groups in canonical order', () => {
    expect([...CAPABILITY_GROUPS]).toEqual(['layout', 'content', 'media', 'design', 'interaction']);
    expect(CAPABILITY_GROUPS).toHaveLength(5);
  });

  it('holds all and only the 22 approved IDs, grouped 4 / 8 / 4 / 2 / 4', () => {
    for (const group of CAPABILITY_GROUPS) {
      expect([...CAPABILITIES_BY_GROUP[group]]).toEqual([...EXPECTED_BY_GROUP[group]]);
      expect(CAPABILITIES_BY_GROUP[group]).toHaveLength(EXPECTED_BY_GROUP[group].length);
    }

    expect([...CAPABILITY_IDS]).toEqual(EXPECTED_IDS);
    expect(CAPABILITY_IDS).toHaveLength(22);
  });

  it('flattens exactly the approved group contents with no duplicate or missing entry', () => {
    const flattened = CAPABILITY_GROUPS.flatMap((group) => [...CAPABILITIES_BY_GROUP[group]]);
    expect(flattened).toEqual([...CAPABILITY_IDS]);
    expect(new Set(CAPABILITY_IDS).size).toBe(CAPABILITY_IDS.length);
    expect(new Set(EXPECTED_IDS).size).toBe(22);

    for (const group of CAPABILITY_GROUPS) {
      const ids = CAPABILITIES_BY_GROUP[group];
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('gives every ID exactly one owning group, matching its own prefix', () => {
    for (const group of CAPABILITY_GROUPS) {
      for (const id of CAPABILITIES_BY_GROUP[group]) {
        const owners = CAPABILITY_GROUPS.filter((candidate) =>
          (CAPABILITIES_BY_GROUP[candidate] as readonly string[]).includes(id),
        );
        expect(owners).toEqual([group]);
        expect(id.startsWith(`${group}.`)).toBe(true);
      }
    }
  });

  it('exposes a frozen, immutable representation', () => {
    expect(Object.isFrozen(CAPABILITY_GROUPS)).toBe(true);
    expect(Object.isFrozen(CAPABILITY_IDS)).toBe(true);
    expect(Object.isFrozen(CAPABILITIES_BY_GROUP)).toBe(true);
    for (const group of CAPABILITY_GROUPS) {
      expect(Object.isFrozen(CAPABILITIES_BY_GROUP[group])).toBe(true);
    }

    expect(() => (CAPABILITY_IDS as unknown as string[]).push('layout.extra')).toThrow(TypeError);
    expect(() => {
      (CAPABILITIES_BY_GROUP as unknown as Record<string, unknown>).layout = [];
    }).toThrow(TypeError);
    expect([...CAPABILITY_IDS]).toEqual(EXPECTED_IDS);
    expect([...CAPABILITIES_BY_GROUP.layout]).toEqual([...EXPECTED_BY_GROUP.layout]);
  });
});

describe('A1 capability registry — membership', () => {
  it('accepts each of the 22 approved IDs and reports its single group', () => {
    for (const group of CAPABILITY_GROUPS) {
      for (const id of EXPECTED_BY_GROUP[group]) {
        expect(isCapabilityId(id)).toBe(true);
        expect(capabilityGroupFor(id)).toBe(group);
      }
    }
  });
});

describe('A1 capability registry — refusals are never repaired or coerced', () => {
  it('refuses unknown, malformed, case-variant and near-match identifiers', () => {
    for (const value of REFUSED_VALUES) {
      expect(isCapabilityId(value)).toBe(false);
      expect(capabilityGroupFor(value)).toBeUndefined();
    }
  });

  it('refuses every bare Foundation family name as a module ID', () => {
    for (const family of EXPECTED_FAMILIES) {
      expect(isCapabilityId(family)).toBe(false);
      expect(capabilityGroupFor(family)).toBeUndefined();
    }
  });

  it('refuses non-string values without throwing', () => {
    const values: readonly unknown[] = [
      null,
      undefined,
      0,
      1,
      Number.NaN,
      true,
      false,
      [],
      ['content.hero'],
      {},
      Symbol('content.hero'),
      10n,
    ];

    for (const value of values) {
      expect(isCapabilityId(value)).toBe(false);
      expect(capabilityGroupFor(value)).toBeUndefined();
    }
  });

  it('never coerces an object with custom toString or Symbol.toPrimitive', () => {
    let toStringCalls = 0;
    const withToString = {
      toString() {
        toStringCalls += 1;
        return 'content.hero';
      },
    };

    let primitiveCalls = 0;
    const withSymbolToPrimitive = {
      [Symbol.toPrimitive]() {
        primitiveCalls += 1;
        return 'layout.stack';
      },
    };

    expect(isCapabilityId(withToString)).toBe(false);
    expect(capabilityGroupFor(withToString)).toBeUndefined();
    expect(isCapabilityId(withSymbolToPrimitive)).toBe(false);
    expect(capabilityGroupFor(withSymbolToPrimitive)).toBeUndefined();

    // A type guard must inspect the value itself, never call hostile methods on it.
    expect(toStringCalls).toBe(0);
    expect(primitiveCalls).toBe(0);
  });

  it('does not derive a group by splitting an unregistered string', () => {
    expect(capabilityGroupFor('layout.unknown')).toBeUndefined();
    expect(capabilityGroupFor('interaction.')).toBeUndefined();
    expect(capabilityGroupFor('media.image.extra')).toBeUndefined();
    expect(capabilityGroupFor('design')).toBeUndefined();
  });
});

describe('Foundation Page-section families — a separate namespace', () => {
  it('lists exactly the 17 source-evidenced families in observed order', () => {
    expect([...FOUNDATION_PAGE_SECTION_FAMILIES]).toEqual(EXPECTED_FAMILIES);
    expect(FOUNDATION_PAGE_SECTION_FAMILIES).toHaveLength(17);
    expect(new Set(FOUNDATION_PAGE_SECTION_FAMILIES).size).toBe(17);
    expect(Object.isFrozen(FOUNDATION_PAGE_SECTION_FAMILIES)).toBe(true);
  });

  it('shares no member with the 22 approved capability IDs in either direction', () => {
    for (const family of FOUNDATION_PAGE_SECTION_FAMILIES) {
      expect(CAPABILITY_IDS as readonly string[]).not.toContain(family);
      expect(isCapabilityId(family)).toBe(false);
    }

    for (const id of CAPABILITY_IDS) {
      expect(FOUNDATION_PAGE_SECTION_FAMILIES as readonly string[]).not.toContain(id);
    }
  });

  it('does not equate the contactForm family with the interaction.contact module ID', () => {
    expect(FOUNDATION_PAGE_SECTION_FAMILIES as readonly string[]).toContain('contactForm');
    expect(isCapabilityId('contactForm')).toBe(false);
    expect(capabilityGroupFor('contactForm')).toBeUndefined();

    expect(isCapabilityId('interaction.contact')).toBe(true);
    expect(capabilityGroupFor('interaction.contact')).toBe('interaction');

    // The registry exposes no delivery, adapter or capability equivalence for either name.
    expect(capabilityGroupFor('interaction.contactForm')).toBeUndefined();
    expect(capabilityGroupFor('contact.form')).toBeUndefined();
  });
});
