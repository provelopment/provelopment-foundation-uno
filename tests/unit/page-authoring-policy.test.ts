import { describe, expect, it } from 'vitest';

import * as policy from '../../src/core/page-authoring-policy';
import {
  DECLARED_PAGE_SOURCE_KINDS,
  DECLARED_PAGE_SOURCE_STATES,
  PAGE_VISIBILITIES,
  decideSelectedPageVisibility,
  selectDeclaredPageSource,
  type PageSourceSelectionRefusal,
  type PageVisibilityRefusal,
} from '../../src/core/page-authoring-policy';
import { classifyAuthorDestination } from '../../src/core/safe-author-url';

/**
 * Focused positive and refusal tests for the Uno Page-authoring policy (`UNO-WO-009 / R01`).
 *
 * Every expectation below is written from the ORDER'S contract, not from the implementation, so a
 * change to the policy cannot silently redefine its own fixture. These tests prove two pure
 * decisions — declared-source precedence and visibility vocabulary — and nothing else: no Page
 * exists, no file is read, no route is published, no sitemap or header is produced.
 */

type Json = 'json';
type Markdown = 'markdown';

function expectSelected(candidates: unknown, kind: Json | Markdown): void {
  const verdict = selectDeclaredPageSource(candidates);
  expect(verdict.accepted).toBe(true);
  if (!verdict.accepted) return;
  expect(verdict.kind).toBe(kind);
  expect(Object.keys(verdict).sort()).toEqual(['accepted', 'kind']);
}

function expectSelectionRefused(candidates: unknown, reason: PageSourceSelectionRefusal): void {
  const verdict = selectDeclaredPageSource(candidates);
  expect(verdict.accepted).toBe(false);
  if (verdict.accepted) return;
  expect(verdict.reason).toBe(reason);
  expect(Object.keys(verdict).sort()).toEqual(['accepted', 'reason']);
}

function expectVisibility(input: unknown, visibility: 'public' | 'unlisted'): void {
  const verdict = decideSelectedPageVisibility(input);
  expect(verdict.accepted).toBe(true);
  if (!verdict.accepted) return;
  expect(verdict.visibility).toBe(visibility);
  expect(Object.keys(verdict).sort()).toEqual(['accepted', 'visibility']);
}

function expectVisibilityRefused(input: unknown, reason: PageVisibilityRefusal): void {
  const verdict = decideSelectedPageVisibility(input);
  expect(verdict.accepted).toBe(false);
  if (verdict.accepted) return;
  expect(verdict.reason).toBe(reason);
  expect(Object.keys(verdict).sort()).toEqual(['accepted', 'reason']);
}

const json = (state: string): Record<string, unknown> => ({ kind: 'json', state });
const markdown = (state: string): Record<string, unknown> => ({ kind: 'markdown', state });

describe('declared source precedence within one representation', () => {
  it('selects valid JSON over valid Markdown, in either array order', () => {
    expectSelected([json('valid'), markdown('valid')], 'json');
    expectSelected([markdown('valid'), json('valid')], 'json');
  });

  it('selects valid JSON even when the lower-priority Markdown is invalid or absent', () => {
    expectSelected([json('valid'), markdown('invalid')], 'json');
    expectSelected([json('valid'), markdown('absent')], 'json');
    expectSelected([json('valid')], 'json');
  });

  it('selects declared valid Markdown only when JSON is absent or undeclared', () => {
    expectSelected([json('absent'), markdown('valid')], 'markdown');
    expectSelected([markdown('valid'), json('absent')], 'markdown');
    expectSelected([markdown('valid')], 'markdown');
  });

  it('refuses a declared-but-invalid JSON even when valid Markdown is available', () => {
    expectSelectionRefused([json('invalid'), markdown('valid')], 'invalid-json-source');
    expectSelectionRefused([markdown('valid'), json('invalid')], 'invalid-json-source');
    expectSelectionRefused([json('invalid'), markdown('absent')], 'invalid-json-source');
    expectSelectionRefused([json('invalid')], 'invalid-json-source');
  });

  it('refuses when no declared candidate can answer', () => {
    expectSelectionRefused([json('absent')], 'no-valid-source');
    expectSelectionRefused([json('absent'), markdown('absent')], 'no-valid-source');
    expectSelectionRefused([markdown('absent')], 'no-valid-source');
    expectSelectionRefused([markdown('invalid')], 'invalid-markdown-source');
    expectSelectionRefused([json('absent'), markdown('invalid')], 'invalid-markdown-source');
  });
});

describe('no undeclared source, fallback or document is ever invented', () => {
  it('answers with the kind only — never a body, path, locale or fallback', () => {
    const verdict = selectDeclaredPageSource([json('valid')]);
    expect(verdict.accepted).toBe(true);
    if (!verdict.accepted) return;
    for (const forbidden of ['path', 'body', 'locale', 'fallback', 'siteId', 'published']) {
      expect(Object.prototype.hasOwnProperty.call(verdict, forbidden)).toBe(false);
    }
  });

  it('refuses an absent JSON rather than consulting an undeclared Markdown', () => {
    expectSelectionRefused([json('absent')], 'no-valid-source');
    expectSelectionRefused([json('absent'), markdown('absent')], 'no-valid-source');
  });
});

describe('malformed and hostile candidate input is refused without coercion', () => {
  it('refuses a non-array, an empty declaration list and more than two declarations', () => {
    for (const value of [null, undefined, 'json', 5, {}, new Map(), () => undefined]) {
      expectSelectionRefused(value, 'candidates-not-an-array');
    }
    expectSelectionRefused([], 'no-candidates');
    expectSelectionRefused([json('valid'), markdown('valid'), json('absent')], 'too-many-candidates');
  });

  it('refuses duplicate kinds, unknown kinds, unknown states and wrong casing', () => {
    expectSelectionRefused([json('valid'), json('absent')], 'duplicate-source-kind');
    expectSelectionRefused([markdown('valid'), markdown('valid')], 'duplicate-source-kind');
    expectSelectionRefused([{ kind: 'yaml', state: 'valid' }], 'unknown-source-kind');
    expectSelectionRefused([{ kind: 'JSON', state: 'valid' }], 'unknown-source-kind');
    expectSelectionRefused([{ kind: null, state: 'valid' }], 'unknown-source-kind');
    expectSelectionRefused([{ kind: 5, state: 'valid' }], 'unknown-source-kind');
    expectSelectionRefused([{ kind: 'json', state: 'present' }], 'unknown-source-state');
    expectSelectionRefused([{ kind: 'json', state: 'VALID' }], 'unknown-source-state');
    expectSelectionRefused([{ kind: 'json', state: 'src/page.json' }], 'unknown-source-state');
    expectSelectionRefused([{ kind: 'json', state: null }], 'unknown-source-state');
  });

  it('refuses extra keys, missing keys and non-plain candidate objects', () => {
    expectSelectionRefused([{ kind: 'json', state: 'valid', path: 'page.json' }], 'candidate-shape');
    expectSelectionRefused([{ kind: 'json' }], 'candidate-shape');
    expectSelectionRefused([{ state: 'valid' }], 'candidate-shape');
    expectSelectionRefused([null], 'candidate-not-a-plain-object');
    expectSelectionRefused([[]], 'candidate-not-a-plain-object');
    expectSelectionRefused(['json'], 'candidate-not-a-plain-object');
    expectSelectionRefused([new Date(0)], 'candidate-not-a-plain-object');
    expectSelectionRefused([new (class Candidate {})()], 'candidate-not-a-plain-object');
  });

  it('accepts a null-prototype record as plain data and refuses accessor or symbol fields', () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare["kind"] = "json";
    bare["state"] = "valid";
    expectSelected([bare], 'json');

    let getterCalls = 0;
    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, 'kind', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'json';
      },
    });
    Object.defineProperty(accessor, 'state', { enumerable: true, value: 'valid' });
    expectSelectionRefused([accessor], 'candidate-not-plain-data');
    expect(getterCalls).toBe(0);

    const symlinked: Record<string, unknown> = { kind: 'json', state: 'valid' };
    Object.defineProperty(symlinked, Symbol('extra'), { enumerable: true, value: true });
    expectSelectionRefused([symlinked], 'candidate-not-plain-data');
  });

  it('refuses a prototype-pollution-shaped candidate instead of reading its prototype', () => {
    const polluted = JSON.parse(
      '{"__proto__":{"state":"valid"},"kind":"json","state":"valid"}',
    ) as unknown;
    expectSelectionRefused([polluted], 'candidate-shape');
  });

  it('never invokes toString, valueOf or Symbol.toPrimitive', () => {
    let calls = 0;
    const prototype = {
      toString(): string {
        calls += 1;
        return 'json';
      },
      valueOf(): string {
        calls += 1;
        return 'json';
      },
      [Symbol.toPrimitive](): string {
        calls += 1;
        return 'json';
      },
    };
    const hostile = Object.create(prototype) as Record<string, unknown>;
    hostile["kind"] = "json";
    hostile["state"] = "valid";
    expectSelectionRefused([hostile], 'candidate-not-a-plain-object');
    expect(calls).toBe(0);
  });

  it('answers a bounded refusal instead of throwing for unreadable input', () => {
    const throwing = new Proxy(
      {},
      {
        getPrototypeOf(): object {
          throw new Error('hostile trap');
        },
      },
    );
    expectSelectionRefused([throwing], 'unreadable-input');

    const battery: unknown[] = [
      null,
      undefined,
      Symbol('x'),
      10n,
      () => undefined,
      [[]],
      [{ kind: 'json', state: 'valid' }, null],
      new Proxy([], { get: () => { throw new Error('trap'); } }),
    ];
    for (const value of battery) {
      expect(() => selectDeclaredPageSource(value)).not.toThrow();
    }
  });
});

describe('both decisions are deterministic and leave the caller’s data untouched', () => {
  it('returns an identical verdict for identical input and never mutates it', () => {
    const candidates = Object.freeze([
      Object.freeze({ kind: 'json', state: 'absent' }),
      Object.freeze({ kind: 'markdown', state: 'valid' }),
    ]);
    const snapshot = JSON.stringify(candidates);
    const first = selectDeclaredPageSource(candidates);
    const second = selectDeclaredPageSource(candidates);
    expect(second).toEqual(first);
    expect(JSON.stringify(candidates)).toBe(snapshot);
    expect(candidates.length).toBe(2);

    const input = Object.freeze({ source: 'json', routePath: 'about', visibility: 'unlisted' });
    const visibilitySnapshot = JSON.stringify(input);
    expect(decideSelectedPageVisibility(input)).toEqual(decideSelectedPageVisibility(input));
    expect(JSON.stringify(input)).toBe(visibilitySnapshot);
  });
});

describe('JSON-selected visibility', () => {
  it('defaults to public and accepts explicit public or unlisted', () => {
    expectVisibility({ source: 'json', routePath: 'about' }, 'public');
    expectVisibility({ source: 'json', routePath: 'about', visibility: 'public' }, 'public');
    expectVisibility({ source: 'json', routePath: 'about', visibility: 'unlisted' }, 'unlisted');
    expectVisibility({ source: 'json', routePath: 'offers/home', visibility: 'unlisted' }, 'unlisted');
  });

  it('allows a public root Home but never an unlisted one', () => {
    expectVisibility({ source: 'json', routePath: 'home' }, 'public');
    expectVisibility({ source: 'json', routePath: 'home', visibility: 'public' }, 'public');
    expectVisibilityRefused(
      { source: 'json', routePath: 'home', visibility: 'unlisted' },
      'home-cannot-be-unlisted',
    );
  });
});

describe('Markdown-selected visibility', () => {
  it('is public by definition and carries no visibility declaration', () => {
    expectVisibility({ source: 'markdown', routePath: 'about' }, 'public');
    expectVisibility({ source: 'markdown', routePath: 'home' }, 'public');
  });

  it('refuses ANY explicit visibility, including public', () => {
    expectVisibilityRefused(
      { source: 'markdown', routePath: 'about', visibility: 'public' },
      'markdown-visibility-not-allowed',
    );
    expectVisibilityRefused(
      { source: 'markdown', routePath: 'about', visibility: 'unlisted' },
      'markdown-visibility-not-allowed',
    );
  });
});

describe('visibility input refusals', () => {
  it('refuses non-objects, non-plain objects and accessor fields', () => {
    for (const value of [null, undefined, 'json', 5, [], new Date(0)]) {
      expectVisibilityRefused(value, 'input-not-a-plain-object');
    }

    let getterCalls = 0;
    const accessor: Record<string, unknown> = { source: 'json', routePath: 'about' };
    Object.defineProperty(accessor, 'visibility', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'unlisted';
      },
    });
    expectVisibilityRefused(accessor, 'input-not-plain-data');
    expect(getterCalls).toBe(0);
  });

  it('refuses unknown keys and missing required fields', () => {
    expectVisibilityRefused(
      { source: 'json', routePath: 'about', siteId: 'site-1' },
      'unexpected-key',
    );
    expectVisibilityRefused(
      { source: 'json', routePath: 'about', published: true },
      'unexpected-key',
    );
    expectVisibilityRefused({ source: 'json' }, 'missing-field');
    expectVisibilityRefused({ routePath: 'about' }, 'missing-field');
    expectVisibilityRefused({}, 'missing-field');

    const polluted = JSON.parse(
      '{"__proto__":{"visibility":"unlisted"},"source":"json","routePath":"about"}',
    ) as unknown;
    expectVisibilityRefused(polluted, 'unexpected-key');
  });
});

describe('visibility input refusals, continued', () => {
  it('refuses an unknown source kind and every malformed route path', () => {
    expectVisibilityRefused({ source: 'yaml', routePath: 'about' }, 'unknown-source-kind');
    expectVisibilityRefused({ source: 'JSON', routePath: 'about' }, 'unknown-source-kind');

    for (const routePath of [
      '',
      '/about',
      'about/',
      'About',
      'a//b',
      '../x',
      'a/../../x',
      'a%2fb',
      'a%20b',
      'a b',
      'a\\b',
      'a/b/c/d/e',
      'a'.repeat(161),
    ]) {
      expectVisibilityRefused({ source: 'json', routePath }, 'invalid-route-path');
    }
    for (const routePath of [5, null, undefined, ['about'], { path: 'about' }]) {
      expectVisibilityRefused({ source: 'json', routePath }, 'invalid-route-path');
    }
  });

  it('refuses unknown or explicitly unusable visibility values', () => {
    for (const visibility of ['hidden', 'Public', 'UNLISTED', '', null, 5, true]) {
      expectVisibilityRefused(
        { source: 'json', routePath: 'about', visibility },
        'unknown-visibility',
      );
    }
    expectVisibilityRefused(
      { source: 'json', routePath: 'about', visibility: undefined },
      'unknown-visibility',
    );
  });
});

describe('the results grant no publication, routing or access authority', () => {
  it('exposes exactly two functions and three frozen vocabularies', () => {
    expect(Object.keys(policy).sort()).toEqual([
      'DECLARED_PAGE_SOURCE_KINDS',
      'DECLARED_PAGE_SOURCE_STATES',
      'PAGE_VISIBILITIES',
      'decideSelectedPageVisibility',
      'selectDeclaredPageSource',
    ]);
    expect(DECLARED_PAGE_SOURCE_KINDS).toEqual(['json', 'markdown']);
    expect(DECLARED_PAGE_SOURCE_STATES).toEqual(['absent', 'valid', 'invalid']);
    expect(PAGE_VISIBILITIES).toEqual(['public', 'unlisted']);
    expect(Object.isFrozen(DECLARED_PAGE_SOURCE_KINDS)).toBe(true);
    expect(Object.isFrozen(DECLARED_PAGE_SOURCE_STATES)).toBe(true);
    expect(Object.isFrozen(PAGE_VISIBILITIES)).toBe(true);
  });

  it('never returns a URL, header, body, sitemap, index or publication flag', () => {
    const forbidden = /url|path|header|sitemap|serve|publish|redirect|body|index|auth|access/i;
    const results = [
      selectDeclaredPageSource([{ kind: 'json', state: 'valid' }]),
      selectDeclaredPageSource([{ kind: 'json', state: 'invalid' }]),
      decideSelectedPageVisibility({ source: 'json', routePath: 'about', visibility: 'unlisted' }),
      decideSelectedPageVisibility({ source: 'markdown', routePath: 'about' }),
    ];
    for (const result of results) {
      const keys = Object.keys(result);
      expect(keys.length).toBeLessThanOrEqual(2);
      for (const key of keys) {
        if (key === 'reason' || key === 'kind' || key === 'visibility') continue;
        expect(key).not.toMatch(forbidden);
      }
    }
  });

  it('unlisted is a vocabulary value, not access control or discovery', () => {
    const decision = decideSelectedPageVisibility({
      source: 'json',
      routePath: 'admin/secret',
      visibility: 'unlisted',
    });
    expect(decision).toEqual({ accepted: true, visibility: 'unlisted' });

    // The separate R02 syntax classifier may accept a hand-written href to a private path; that
    // acceptance says nothing about Page existence, ownership, routing or permission either.
    const href = classifyAuthorDestination('/admin/secret');
    expect(href.accepted).toBe(true);
    expect(Object.keys(decision).sort()).toEqual(['accepted', 'visibility']);
  });
});
