import { describe, expect, it } from 'vitest';

import { selectDeclaredPageSource } from '../../src/core/page-authoring-policy';
import type { PageSourceKind } from '../../src/core/page-authoring-policy';
import {
  resolveDeclaredPageSource,
  type DeclaredPageSourceRefusal,
  type DeclaredSourceObserver,
  type ResolvedDeclaredPageSource,
} from '../../src/application/resolve-declared-page-source';

/**
 * Proof tests for the injected-observer resolution use case (`UNO-WO-010 / R01`).
 *
 * Fixtures are written from the ORDER'S contract, not from the implementation, so the behaviour
 * cannot silently redefine itself. Every test also records which observers ran and in what order:
 * the invocation sequence is the material invariant here, not only the answer.
 */

type Calls = string[];

/** One counting observer port. `observation` is deliberately `unknown` so malformed payloads can be
 *  supplied on purpose. */
function port(
  kind: PageSourceKind,
  calls: Calls,
  observation: unknown,
): DeclaredSourceObserver<unknown> {
  return {
    kind,
    observe: () => {
      calls.push(kind);
      return observation as never;
    },
  };
}

/** One observer that answers asynchronously. */
function asyncPort(
  kind: PageSourceKind,
  calls: Calls,
  observation: unknown,
): DeclaredSourceObserver<unknown> {
  return {
    kind,
    observe: async () => {
      calls.push(kind);
      return observation as never;
    },
  };
}

function throwingPort(kind: PageSourceKind, calls: Calls): DeclaredSourceObserver<unknown> {
  return {
    kind,
    observe: () => {
      calls.push(kind);
      throw new Error(`leaked-${kind}-failure`);
    },
  };
}

function rejectingPort(kind: PageSourceKind, calls: Calls): DeclaredSourceObserver<unknown> {
  return {
    kind,
    observe: () => {
      calls.push(kind);
      return Promise.reject(new Error(`leaked-${kind}-rejection`));
    },
  };
}

const absent = { state: 'absent' };
const invalid = { state: 'invalid' };
const valid = (source: unknown): unknown => ({ state: 'valid', source });

function expectAccepted(
  result: ResolvedDeclaredPageSource<unknown>,
  kind: PageSourceKind,
  source: unknown,
): void {
  expect(result.accepted).toBe(true);
  if (!result.accepted) return;
  expect(result.kind).toBe(kind);
  expect(result.source).toBe(source);
  expect(Object.keys(result).sort()).toEqual(['accepted', 'kind', 'source']);
}

function expectRefused(
  result: ResolvedDeclaredPageSource<unknown>,
  reason: DeclaredPageSourceRefusal,
): void {
  expect(result.accepted).toBe(false);
  if (result.accepted) return;
  expect(result.reason).toBe(reason);
  expect(Object.keys(result).sort()).toEqual(['accepted', 'reason']);
  // A refusal never leaks a thrown message, a path or a candidate value.
  expect(result.reason).not.toMatch(/leaked|Error|node_modules|\//);
}

describe('declared precedence and observer invocation', () => {
  it('selects valid JSON and never invokes the declared Markdown observer, in both orders', async () => {
    const body = { title: 'JSON body' };
    const markdownBody = { title: 'Markdown body' };

    for (const order of ['json-first', 'markdown-first'] as const) {
      const calls: Calls = [];
      const jsonPort = port('json', calls, valid(body));
      const markdownPort = port('markdown', calls, valid(markdownBody));
      const ports = order === 'json-first' ? [jsonPort, markdownPort] : [markdownPort, jsonPort];

      const result = await resolveDeclaredPageSource<unknown>(ports);

      expectAccepted(result, 'json', body);
      expect(calls).toEqual(['json']);
    }
  });

  it('refuses declared-but-invalid JSON without consulting Markdown, in both orders', async () => {
    for (const order of ['json-first', 'markdown-first'] as const) {
      const calls: Calls = [];
      const jsonPort = port('json', calls, invalid);
      const markdownPort = port('markdown', calls, valid({ title: 'md' }));
      const ports = order === 'json-first' ? [jsonPort, markdownPort] : [markdownPort, jsonPort];

      const result = await resolveDeclaredPageSource<unknown>(ports);

      expectRefused(result, 'invalid-json-source');
      expect(calls).toEqual(['json']);
    }
  });

  it('refuses when the JSON observer throws and never falls through to Markdown', async () => {
    const calls: Calls = [];
    const result = await resolveDeclaredPageSource<unknown>([
      throwingPort('json', calls),
      port('markdown', calls, valid({ title: 'md' })),
    ]);

    expectRefused(result, 'observer-failed');
    expect(calls).toEqual(['json']);
    expect(JSON.stringify(result)).not.toContain('leaked');
  });

  it('refuses when the JSON observer rejects a promise, with no leaked message', async () => {
    const calls: Calls = [];
    const result = await resolveDeclaredPageSource<unknown>([
      rejectingPort('json', calls),
      port('markdown', calls, valid({ title: 'md' })),
    ]);

    expectRefused(result, 'observer-failed');
    expect(calls).toEqual(['json']);
    expect(JSON.stringify(result)).not.toContain('leaked');
  });

  it('selects Markdown only after a declared-and-absent JSON, in the order json then markdown', async () => {
    const calls: Calls = [];
    const body = { title: 'Markdown body' };

    const result = await resolveDeclaredPageSource<unknown>([
      port('markdown', calls, valid(body)),
      port('json', calls, absent),
    ]);

    expectAccepted(result, 'markdown', body);
    expect(calls).toEqual(['json', 'markdown']);
  });

  it('selects Markdown when JSON is not declared at all', async () => {
    const calls: Calls = [];
    const body = { title: 'Markdown only' };

    const result = await resolveDeclaredPageSource<unknown>([port('markdown', calls, valid(body))]);

    expectAccepted(result, 'markdown', body);
    expect(calls).toEqual(['markdown']);
  });
});

describe('bounded refusals without invention', () => {
  it('selects a single declared valid JSON observation', async () => {
    const calls: Calls = [];
    const body = { title: 'JSON only' };
    const result = await resolveDeclaredPageSource<unknown>([port('json', calls, valid(body))]);
    expectAccepted(result, 'json', body);
    expect(calls).toEqual(['json']);
  });

  it('refuses a JSON-only absent declaration without fabricating a source', async () => {
    const calls: Calls = [];
    const result = await resolveDeclaredPageSource<unknown>([port('json', calls, absent)]);
    expectRefused(result, 'no-valid-source');
    expect(calls).toEqual(['json']);
  });

  it('refuses a Markdown-only invalid declaration with the core reason', async () => {
    const calls: Calls = [];
    const result = await resolveDeclaredPageSource<unknown>([port('markdown', calls, invalid)]);
    expectRefused(result, 'invalid-markdown-source');
    expect(calls).toEqual(['markdown']);
  });

  it('refuses when both declared candidates are absent', async () => {
    const calls: Calls = [];
    const result = await resolveDeclaredPageSource<unknown>([
      port('json', calls, absent),
      port('markdown', calls, absent),
    ]);
    expectRefused(result, 'no-valid-source');
    expect(calls).toEqual(['json', 'markdown']);
  });

  it('refuses a valid observation whose source is missing, undefined or null', async () => {
    for (const observation of [{ state: 'valid' }, { state: 'valid', source: undefined }, { state: 'valid', source: null }]) {
      const calls: Calls = [];
      const result = await resolveDeclaredPageSource<unknown>([
        port('json', calls, observation),
        port('markdown', calls, valid({ title: 'md' })),
      ]);
      expectRefused(result, 'invalid-observation');
      expect(calls).toEqual(['json']);
    }
  });

  it('refuses an absent or invalid observation that carries a source', async () => {
    for (const observation of [
      { state: 'absent', source: { title: 'smuggled' } },
      { state: 'invalid', source: { title: 'smuggled' } },
    ]) {
      const calls: Calls = [];
      const result = await resolveDeclaredPageSource<unknown>([port('markdown', calls, observation)]);
      expectRefused(result, 'invalid-observation');
      expect(calls).toEqual(['markdown']);
    }
  });

  it('refuses missing, surplus or unknown observation fields', async () => {
    for (const observation of [
      {},
      { source: { title: 'no state' } },
      { state: 'present' },
      { state: 'VALID' },
      { state: 'absent', extra: true },
      { state: 'valid', source: { title: 'x' }, extra: true },
    ]) {
      const calls: Calls = [];
      const result = await resolveDeclaredPageSource<unknown>([port('json', calls, observation)]);
      expectRefused(result, 'invalid-observation');
      expect(calls).toEqual(['json']);
    }
  });

  it('refuses a non-object, accessor-bearing or symbol-keyed observation', async () => {
    let getterCalls = 0;
    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, 'state', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'valid';
      },
    });

    const symbolKeyed: Record<string, unknown> = { state: 'absent' };
    Object.defineProperty(symbolKeyed, Symbol('extra'), { enumerable: true, value: true });

    for (const observation of ['absent', null, 5, [], accessor, symbolKeyed]) {
      const calls: Calls = [];
      const result = await resolveDeclaredPageSource<unknown>([port('markdown', calls, observation)]);
      expectRefused(result, 'invalid-observation');
      expect(calls).toEqual(['markdown']);
    }
    expect(getterCalls).toBe(0);
  });
});

describe('port validation before any observer runs', () => {
  it('refuses wrong outer types and zero or three ports without calling an observer', async () => {
    for (const value of [null, undefined, 'ports', 5, {}, new Map()]) {
      expectRefused(await resolveDeclaredPageSource<unknown>(value), 'invalid-input');
    }

    expectRefused(await resolveDeclaredPageSource<unknown>([]), 'invalid-input');

    const three: Calls = [];
    const result = await resolveDeclaredPageSource<unknown>([
      port('json', three, valid({ title: 'a' })),
      port('markdown', three, valid({ title: 'b' })),
      port('json', three, absent),
    ]);
    expectRefused(result, 'invalid-input');
    expect(three).toEqual([]);
  });

  it('refuses duplicate, unknown and wrongly-cased kinds without running an observer', async () => {
    const duplicate: Calls = [];
    expectRefused(
      await resolveDeclaredPageSource<unknown>([
        port('json', duplicate, valid({ title: 'a' })),
        port('json', duplicate, absent),
      ]),
      'invalid-observer',
    );
    expect(duplicate).toEqual([]);

    for (const kind of ['yaml', 'JSON', 'Markdown', '', null, 5]) {
      const calls: Calls = [];
      const result = await resolveDeclaredPageSource<unknown>([
        { kind, observe: () => calls.push('called') } as unknown as DeclaredSourceObserver<unknown>,
      ]);
      expectRefused(result, 'invalid-observer');
      expect(calls).toEqual([]);
    }
  });

  it('refuses non-function observers and missing or extra port fields', async () => {
    const candidates: unknown[] = [
      [{ kind: 'json', observe: 5 }],
      [{ kind: 'json' }],
      [{ observe: () => absent }],
      [{ kind: 'json', observe: () => absent, path: 'content/page.json' }],
      [{ kind: 'json', observe: () => absent, locale: 'en-GB' }],
    ];

    for (const ports of candidates) {
      expectRefused(await resolveDeclaredPageSource<unknown>(ports), 'invalid-observer');
    }
  });

  it('refuses accessor, symbol and hostile-prototype ports without running their code', async () => {
    let getterCalls = 0;
    let coercionCalls = 0;

    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, 'kind', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'json';
      },
    });
    Object.defineProperty(accessor, 'observe', { enumerable: true, value: () => absent });

    const symbolKeyed = { kind: 'json', observe: () => absent } as Record<string, unknown>;
    Object.defineProperty(symbolKeyed, Symbol('extra'), { enumerable: true, value: true });

    const hostilePrototype = {
      toString(): string {
        coercionCalls += 1;
        return 'json';
      },
      valueOf(): string {
        coercionCalls += 1;
        return 'json';
      },
      [Symbol.toPrimitive](): string {
        coercionCalls += 1;
        return 'json';
      },
    };
    const hostile = Object.create(hostilePrototype) as Record<string, unknown>;
    hostile["kind"] = "json";
    hostile["observe"] = () => absent;

    for (const candidate of [accessor, symbolKeyed, hostile, 'json', null, []]) {
      expectRefused(await resolveDeclaredPageSource<unknown>([candidate]), 'invalid-observer');
    }
    expect(getterCalls).toBe(0);
    expect(coercionCalls).toBe(0);
  });

  it('answers a bounded refusal for a hostile proxy collection or port', async () => {
    const hostileCollection = new Proxy([] as unknown[], {
      get(target, property, receiver) {
        if (property === 'length') throw new Error('leaked-length-trap');
        return Reflect.get(target, property, receiver) as never;
      },
    });
    expectRefused(await resolveDeclaredPageSource<unknown>(hostileCollection), 'invalid-input');

    const hostilePort = new Proxy(
      {},
      {
        getPrototypeOf(): object {
          throw new Error('leaked-prototype-trap');
        },
      },
    );
    expectRefused(await resolveDeclaredPageSource<unknown>([hostilePort]), 'invalid-input');

    // No exception escaped and no trap message reached the caller.
    expect(() => resolveDeclaredPageSource<unknown>(hostilePort)).not.toThrow();
  });
});

describe('transparency, identity and core authority', () => {
  it("returns the caller's own source by reference without copying, freezing or serialising", async () => {
    const body = { title: 'Opaque body', sections: [{ heading: 'Intro' }] };
    const snapshot = JSON.stringify(body);
    const calls: Calls = [];

    const result = await resolveDeclaredPageSource<typeof body>([
      port('json', calls, { state: 'valid', source: body }),
    ]);

    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.source).toBe(body);
    expect(result.source.sections).toBe(body.sections);
    expect(Object.isFrozen(body)).toBe(false);
    expect(JSON.stringify(body)).toBe(snapshot);
  });

  it('returns only accepted/kind/source or accepted/reason, with no path, url, locale or metadata', async () => {
    const forbidden = /url|path|locale|visibility|publish|metadata|sitemap|route|canonical|redirect/i;

    const accepted = await resolveDeclaredPageSource<unknown>([port('json', [], valid({}))]);
    const refused = await resolveDeclaredPageSource<unknown>([]);

    for (const result of [accepted, refused]) {
      const keys = Object.keys(result);
      expect(keys.length).toBeLessThanOrEqual(3);
      for (const key of keys) {
        if (key === 'accepted' || key === 'kind' || key === 'source' || key === 'reason') continue;
        expect(key).not.toMatch(forbidden);
      }
    }
  });

  it('supports synchronous and asynchronous observers deterministically, without caching', async () => {
    const synchronous = await resolveDeclaredPageSource<unknown>([
      port('json', [], valid({ id: 1 })),
    ]);
    const asynchronous = await resolveDeclaredPageSource<unknown>([
      asyncPort('json', [], valid({ id: 2 })),
    ]);
    expect(synchronous.accepted).toBe(true);
    expect(asynchronous.accepted).toBe(true);

    const first = await resolveDeclaredPageSource<unknown>([asyncPort('json', [], valid({ id: 3 }))]);
    const second = await resolveDeclaredPageSource<unknown>([asyncPort('json', [], valid({ id: 3 }))]);
    expect(second).toEqual(first);

    // No module-level memory: the next request is answered from its own observations.
    const third = await resolveDeclaredPageSource<unknown>([port('json', [], absent)]);
    expect(third.accepted).toBe(false);
  });

  it('takes its precedence and refusal reasons from the real core policy', async () => {
    const coreJsonInvalid = selectDeclaredPageSource([{ kind: 'json', state: 'invalid' }]);
    const coreMarkdownInvalid = selectDeclaredPageSource([{ kind: 'markdown', state: 'invalid' }]);
    const coreNoWinner = selectDeclaredPageSource([{ kind: 'json', state: 'absent' }]);
    expect(coreJsonInvalid.accepted).toBe(false);
    expect(coreMarkdownInvalid.accepted).toBe(false);
    expect(coreNoWinner.accepted).toBe(false);

    const jsonInvalid = await resolveDeclaredPageSource<unknown>([
      port('json', [], invalid),
      port('markdown', [], valid({ title: 'md' })),
    ]);
    const markdownInvalid = await resolveDeclaredPageSource<unknown>([port('markdown', [], invalid)]);
    const noWinner = await resolveDeclaredPageSource<unknown>([port('json', [], absent)]);

    if (!coreJsonInvalid.accepted && !jsonInvalid.accepted) {
      expect(jsonInvalid.reason).toBe(coreJsonInvalid.reason);
    }
    if (!coreMarkdownInvalid.accepted && !markdownInvalid.accepted) {
      expect(markdownInvalid.reason).toBe(coreMarkdownInvalid.reason);
    }
    if (!coreNoWinner.accepted && !noWinner.accepted) {
      expect(noWinner.reason).toBe(coreNoWinner.reason);
    }

    // And the positive direction is the core's too.
    const coreJsonValid = selectDeclaredPageSource([{ kind: 'json', state: 'valid' }]);
    expect(coreJsonValid.accepted).toBe(true);
  });
});
