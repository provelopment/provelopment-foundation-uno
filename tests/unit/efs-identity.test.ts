import { describe, expect, it } from 'vitest';

import {
  ENTITY_ID_ENTROPY_BYTES,
  ENTITY_ID_PATTERN,
  ENTITY_ID_PREFIX,
  entityIdIssue,
  isEntityId,
  mintEntityId,
  mintEntityIdForTest,
} from '../../src/core/efs/identity';

/**
 * Focused regression tests for the adopted GEO-03 EntityID codec (blob
 * 7e6f8e0a4f0b9ba7b90f66c44205ff67befb7d20).
 *
 * Scope note: these tests prove the ID *grammar* and its determinism only. They do not
 * claim that a single-Entity graph, an EFS cascade or any Site/Page identity exists.
 */

const ZERO_PAYLOAD = '0'.repeat(26);
const MAX_ENTITY_ID = `e_7${'z'.repeat(25)}`;

describe('EntityID grammar — accepted form', () => {
  it('accepts "e_" plus 26 lowercase Crockford characters with an 0-7 first symbol', () => {
    const id = `e_${ZERO_PAYLOAD}`;
    expect(entityIdIssue(id)).toBeNull();
    expect(isEntityId(id)).toBe(true);
    expect(ENTITY_ID_PATTERN.test(id)).toBe(true);
  });

  it('accepts a payload using only permitted letters', () => {
    // Crockford excludes i, l, o and u; every other lowercase letter is legal.
    const payload = `0${'bcdfghjkmnpqrstvwxyz'.repeat(2).slice(0, 25)}`;
    expect(payload).toHaveLength(26);
    expect(isEntityId(`${ENTITY_ID_PREFIX}${payload}`)).toBe(true);
  });

  it('declares the documented prefix and entropy size', () => {
    expect(ENTITY_ID_PREFIX).toBe('e_');
    expect(ENTITY_ID_ENTROPY_BYTES).toBe(16);
  });
});

describe('EntityID grammar — refusals are never repaired', () => {
  it('refuses the retired "b_" prefix', () => {
    const id = `b_${ZERO_PAYLOAD}`;
    expect(entityIdIssue(id)).toContain('e_');
    expect(isEntityId(id)).toBe(false);
  });

  it('refuses an uppercase prefix and uppercase payload', () => {
    expect(isEntityId(`E_${ZERO_PAYLOAD}`)).toBe(false);
    expect(isEntityId(`e_${'A'.repeat(26)}`)).toBe(false);
    expect(isEntityId(`e_${'0'.repeat(25)}A`)).toBe(false);
  });

  it('refuses each forbidden Crockford letter (i, l, o, u)', () => {
    for (const letter of ['i', 'l', 'o', 'u']) {
      const id = `e_0${letter}${'0'.repeat(24)}`;
      expect(id).toHaveLength(28);
      expect(isEntityId(id)).toBe(false);
    }
  });

  it('refuses a payload of the wrong length', () => {
    expect(isEntityId(`${ENTITY_ID_PREFIX}${'0'.repeat(25)}`)).toBe(false);
    expect(isEntityId(`${ENTITY_ID_PREFIX}${'0'.repeat(27)}`)).toBe(false);
    expect(isEntityId(ENTITY_ID_PREFIX)).toBe(false);
  });

  it('refuses a first payload character outside 0-7', () => {
    // 26 symbols encode 130 bits; the two leading padding bits force the first symbol to 0-7.
    for (const first of ['8', '9', 'a', 'z']) {
      expect(isEntityId(`e_${first}${'0'.repeat(25)}`)).toBe(false);
    }
  });

  it('refuses non-string, null, array and empty values', () => {
    expect(entityIdIssue(null)).toBe('An EntityID must be a string, received null.');
    expect(entityIdIssue(['e_00000000000000000000000000'])).toBe(
      'An EntityID must be a string, received an array.',
    );
    expect(entityIdIssue(42)).toBe('An EntityID must be a string, received number.');
    expect(entityIdIssue(undefined)).toBe('An EntityID must be a string, received undefined.');
    expect(entityIdIssue('')).toBe('An EntityID must not be empty.');
  });

  it('refuses hyphen and space spellings', () => {
    expect(isEntityId('e_0000-00000000000000000000')).toBe(false);
    expect(isEntityId('e_0000 0000000000000000000')).toBe(false);
  });
});

describe('EntityID minting — deterministic 16-byte encoding', () => {
  it('mints the all-zero id from all-zero entropy', () => {
    expect(mintEntityId(new Uint8Array(16))).toBe(`e_${ZERO_PAYLOAD}`);
  });

  it('mints the maximum id from all-ones entropy', () => {
    expect(mintEntityId(new Uint8Array(16).fill(0xff))).toBe(MAX_ENTITY_ID);
  });

  it('mints a distinct, stable id from non-zero entropy', () => {
    const entropy = new Uint8Array(16);
    entropy[15] = 1;
    const first = mintEntityId(entropy);
    const second = mintEntityId(entropy);
    expect(first).toBe(`e_${'0'.repeat(25)}1`);
    expect(second).toBe(first);
    expect(isEntityId(first)).toBe(true);
  });

  it('refuses entropy that is not exactly 16 bytes', () => {
    expect(() => mintEntityId(new Uint8Array(15))).toThrow(
      'EntityID entropy must be exactly 16 bytes, received 15.',
    );
    expect(() => mintEntityId(new Uint8Array(17))).toThrow(
      'EntityID entropy must be exactly 16 bytes, received 17.',
    );
    expect(() => mintEntityId(new Uint8Array(0))).toThrow(
      'EntityID entropy must be exactly 16 bytes, received 0.',
    );
  });

  it('every minted id satisfies the published pattern', () => {
    for (let seed = 0; seed < 64; seed += 1) {
      const id = mintEntityIdForTest(seed);
      expect(ENTITY_ID_PATTERN.test(id)).toBe(true);
    }
  });
});

describe('EntityID test mints — seed refusal', () => {
  it('is deterministic for a given seed', () => {
    expect(mintEntityIdForTest(0)).toBe(mintEntityIdForTest(0));
    expect(mintEntityIdForTest(1)).toBe(mintEntityIdForTest(1));
    expect(mintEntityIdForTest(1)).not.toBe(mintEntityIdForTest(2));
  });

  it('refuses a negative seed', () => {
    expect(() => mintEntityIdForTest(-1)).toThrow(
      'The test seed must be a non-negative safe integer.',
    );
  });

  it('refuses a non-integer seed', () => {
    expect(() => mintEntityIdForTest(1.5)).toThrow(
      'The test seed must be a non-negative safe integer.',
    );
    expect(() => mintEntityIdForTest(Number.NaN)).toThrow(
      'The test seed must be a non-negative safe integer.',
    );
  });

  it('refuses an unsafe integer seed', () => {
    expect(() => mintEntityIdForTest(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      'The test seed must be a non-negative safe integer.',
    );
    expect(() => mintEntityIdForTest(Number.POSITIVE_INFINITY)).toThrow(
      'The test seed must be a non-negative safe integer.',
    );
  });
});
