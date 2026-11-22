import { describe, expect, it } from 'vitest';

import {
  UNO_FAMILY_MARKDOWN_LIMITS,
  readUnoFamilyMarkdown,
  type UnoFamilyBlock,
  type UnoFamilyInline,
} from '../../src/core/page-document';

/** The accepted paragraph children of a single-paragraph document. */
function paragraphChildren(source: string): readonly UnoFamilyInline[] {
  const result = readUnoFamilyMarkdown(source);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected acceptance');
  expect(result.blocks).toHaveLength(1);
  const block = result.blocks[0] as UnoFamilyBlock;
  expect(block.kind).toBe('paragraph');
  if (block.kind !== 'paragraph') throw new Error('expected paragraph');
  return block.children;
}

describe('readUnoFamilyMarkdown — positive donor formatting', () => {
  it('keeps inert text and classifies an https link without rewriting it', () => {
    const children = paragraphChildren('See [the map](https://maps.example/directions?to=sample) today.');
    expect(children.map((node) => node.kind)).toEqual(['text', 'link', 'text']);
    const link = children[1];
    expect(link).toMatchObject({
      kind: 'link',
      href: 'https://maps.example/directions?to=sample',
      category: 'https',
    });
    expect((link as { children: readonly UnoFamilyInline[] }).children).toEqual([
      { kind: 'text', text: 'the map' },
    ]);
  });

  it('admits a mailto link and preserves its exact accepted string', () => {
    const children = paragraphChildren('[Write to us](mailto:contact@example.invalid)');
    expect(children[0]).toMatchObject({
      kind: 'link',
      href: 'mailto:contact@example.invalid',
      category: 'mailto',
    });
  });

  it('parses strong, emphasis and a code span', () => {
    const children = paragraphChildren('**bold** and *soft* and `code`');
    expect(children.map((node) => node.kind)).toEqual(['strong', 'text', 'em', 'text', 'code']);
    expect(children[0]).toEqual({ kind: 'strong', children: [{ kind: 'text', text: 'bold' }] });
    expect(children[4]).toEqual({ kind: 'code', text: 'code' });
  });

  it('treats a backslash escape as literal text', () => {
    const children = paragraphChildren('a \\* b');
    expect(children).toEqual([{ kind: 'text', text: 'a * b' }]);
  });

  it('parses an unordered list in source order', () => {
    const result = readUnoFamilyMarkdown('- first\n- second\n- third');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toEqual({
      kind: 'list',
      ordered: false,
      items: [
        [{ kind: 'text', text: 'first' }],
        [{ kind: 'text', text: 'second' }],
        [{ kind: 'text', text: 'third' }],
      ],
    });
  });

  it('parses an ordered list, a heading and a fenced block', () => {
    const result = readUnoFamilyMarkdown('### Steps\n\n1. one\n2. two\n\n```ts\nconst a = 1;\n```');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.blocks.map((block) => block.kind)).toEqual(['heading', 'list', 'code']);
    expect(result.blocks[0]).toMatchObject({ kind: 'heading', level: 3 });
    expect(result.blocks[1]).toMatchObject({ kind: 'list', ordered: true });
    expect(result.blocks[2]).toEqual({ kind: 'code', language: 'ts', text: 'const a = 1;' });
  });

  it('treats a bare angle bracket as inert text', () => {
    expect(paragraphChildren('A & B "quoted" < not markup')).toEqual([
      { kind: 'text', text: 'A & B "quoted" < not markup' },
    ]);
    expect(paragraphChildren('a > b')).toEqual([{ kind: 'text', text: 'a > b' }]);
  });

  it('normalises CRLF so one source parses identically on every host', () => {
    expect(readUnoFamilyMarkdown('- one\r\n- two')).toEqual(readUnoFamilyMarkdown('- one\n- two'));
  });

describe('readUnoFamilyMarkdown — hostile and malformed refusal matrix', () => {
  const hostile: readonly (readonly [string, string])[] = [
    ['raw element', 'hello <b>bold</b>'],
    ['closing tag', 'a </div> b'],
    ['image', '![alt](https://example.invalid/a.png)'],
    ['script scheme', '[x](javascript:alert(1))'],
    ['data scheme', '[x](data:text/html,script)'],
    ['blob scheme', '[x](blob:https://example.invalid/id)'],
    ['protocol relative', '[x](//example.invalid/path)'],
    ['percent-encoded scheme', '[x](%6a%61%76%61%73%63%72%69%70%74:alert(1))'],
    ['nested encoding', '[x](%256a%2561vascript:alert(1))'],
    ['tel scheme', '[x](tel:+15550100)'],
    ['credentials in origin', '[x](https://user:pass@example.invalid/p)'],
    ['unbalanced strong', '**unclosed'],
    ['unbalanced emphasis', '*unclosed'],
    ['unbalanced code span', 'a `code'],
    ['malformed link', '[label](https://example.invalid/p'],
    ['reference link', '[[ref]]'],
    ['unclosed fence', '```ts\nconst a = 1;'],
    ['empty', ''],
  ];

  it.each(hostile)('refuses %s', (_label, source) => {
    const result = readUnoFamilyMarkdown(source);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.startsWith('markdown:')).toBe(true);
  });

  it('refuses a non-string field', () => {
    expect(readUnoFamilyMarkdown(undefined)).toEqual({ ok: false, reason: 'markdown:not-a-string' });
    expect(readUnoFamilyMarkdown(42)).toEqual({ ok: false, reason: 'markdown:not-a-string' });
  });

  it('refuses a control character', () => {
    expect(readUnoFamilyMarkdown('a\u0007b')).toEqual({ ok: false, reason: 'markdown:unsupported-html' });
  });

  it('refuses a field beyond the declared character cap', () => {
    const oversized = 'a'.repeat(UNO_FAMILY_MARKDOWN_LIMITS.blockChars + 1);
    expect(readUnoFamilyMarkdown(oversized)).toEqual({ ok: false, reason: 'markdown:too-large' });
  });

  it('refuses more list items than the declared bound', () => {
    const lines = Array.from({ length: UNO_FAMILY_MARKDOWN_LIMITS.listItems + 1 }, (_, i) => `- item ${i}`);
    expect(readUnoFamilyMarkdown(lines.join('\n'))).toEqual({ ok: false, reason: 'markdown:too-large' });
  });

  it('refuses a construct nested beyond the declared bound', () => {
    expect(readUnoFamilyMarkdown('**'.repeat(3) + 'x' + '**'.repeat(3))).toEqual({
      ok: false,
      reason: 'markdown:unbalanced',
    });
  });
});


  it('returns a deep-frozen accepted document', () => {
    const result = readUnoFamilyMarkdown('**strong** and [link](https://example.invalid/p)');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.blocks)).toBe(true);
    const block = result.blocks[0];
    if (block === undefined) throw new Error('expected one block');
    expect(Object.isFrozen(block)).toBe(true);
    if (block.kind !== 'paragraph') return;
    expect(Object.isFrozen(block.children)).toBe(true);
    expect(Object.isFrozen(block.children[0])).toBe(true);
  });
});
