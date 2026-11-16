import { describe, expect, it } from 'vitest';

import * as safeAuthorUrl from '../../src/core/safe-author-url';
import {
  ADMITTED_ABSOLUTE_SCHEMES,
  AUTHOR_DESTINATION_MAX_LENGTH,
  classifyAuthorDestination,
  isSafeAuthorHref,
  type AuthorDestinationCategory,
  type AuthorDestinationRefusal,
} from '../../src/core/safe-author-url';

/**
 * Focused positive and refusal tests for the Uno author-destination classifier
 * (`UNO-WO-008 / R02`).
 *
 * Scope note: these tests prove a SYNTAX contract only. A category says what shape a string is,
 * never that its target exists, is a Page, is public, is listed, is reachable or is permitted.
 * No fixture here asserts routing, visibility, publication, delivery or provider behaviour.
 */

/** Assert an admitted destination, and that its href is the original string unchanged. */
function expectAccepted(href: string, category: AuthorDestinationCategory): void {
  const verdict = classifyAuthorDestination(href);
  expect(verdict.accepted, `expected ${JSON.stringify(href)} to be admitted`).toBe(true);
  if (!verdict.accepted) return;
  expect(verdict.category).toBe(category);
  expect(verdict.href).toBe(href);
  expect(isSafeAuthorHref(href)).toBe(true);
}

/** Assert a refusal, its bounded reason, and that no href is published. */
function expectRefused(value: unknown, reason: AuthorDestinationRefusal): void {
  const verdict = classifyAuthorDestination(value);
  expect(verdict.accepted, `expected a refusal, got acceptance`).toBe(false);
  if (verdict.accepted) return;
  expect(verdict.reason).toBe(reason);
  expect(Object.prototype.hasOwnProperty.call(verdict, 'href')).toBe(false);
  expect(isSafeAuthorHref(value)).toBe(false);
}

describe('admitted destinations preserve the original bytes', () => {
  it('admits ordinary same-site root-relative paths', () => {
    expectAccepted('/', 'root-relative');
    expectAccepted('/about', 'root-relative');
    expectAccepted('/about/team', 'root-relative');
    expectAccepted('/about?ref=nav#team', 'root-relative');
    expectAccepted('/a/b/c?q=100%25&r=%2F', 'root-relative');
  });

  it('admits fragment-only and query-only references', () => {
    expectAccepted('#', 'fragment');
    expectAccepted('#team', 'fragment');
    expectAccepted('#a-b_c', 'fragment');
    expectAccepted('?', 'query');
    expectAccepted('?a=1&b=2', 'query');
    expectAccepted('?a=1&b=2#c', 'query');
    expectAccepted('?a=1;b=2', 'query');
  });

  it('admits conservative relative references', () => {
    expectAccepted('about', 'relative');
    expectAccepted('./about', 'relative');
    expectAccepted('../about', 'relative');
    expectAccepted('a/b/c', 'relative');
    expectAccepted('.', 'relative');
    expectAccepted('..', 'relative');
  });

  it('admits absolute http and https destinations that have a real origin', () => {
    expectAccepted('http://example.org', 'http');
    expectAccepted('http://example.org:8080/a?x=1#y', 'http');
    expectAccepted('https://example.org', 'https');
    expectAccepted('https://sub.example.org/a/b?x=1#y', 'https');
    expectAccepted('https://[::1]:8443/x', 'https');
    expectAccepted('HTTPS://EXAMPLE.ORG/Path', 'https');
  });

  it('admits an explicit mailto destination with a real recipient', () => {
    expectAccepted('mailto:hello@example.org', 'mailto');
    expectAccepted('mailto:first.last+tag@example.co.uk', 'mailto');
    expectAccepted('mailto:a@b', 'mailto');
    expectAccepted('mailto:a@b.com,c@d.com', 'mailto');
    expectAccepted('mailto:a@b.com?subject=Hello%20there', 'mailto');
  });

  it('keeps benign separators and encodings instead of over-refusing them', () => {
    expectAccepted('?a=1&b=2&c=3', 'query');
    expectAccepted('/search?q=a%26b', 'root-relative');
    expectAccepted('?q=100%25', 'query');
    expectAccepted('?q=%E2%82%AC', 'query');
    expectAccepted('?q=hello%20world', 'query');
    expectAccepted('/a%20b/c', 'root-relative');
  });
});

describe('executable, unsupported and telephony schemes are refused', () => {
  it('refuses every non-admitted scheme, including disguised case and tel', () => {
    for (const value of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'vbscript:msgbox(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'blob:https://example.org/abc',
      'file:///etc/passwd',
      'ftp://example.org/file',
      'ws://example.org/socket',
      'wss://example.org/socket',
      'about:blank',
      'view-source:https://example.org',
      'jar:http://example.org/a.jar!/',
      'tel:+15551234',
      'Tel:+15551234',
      'x-unknown:value',
      'custom:thing',
    ]) {
      expectRefused(value, 'disallowed-scheme');
    }
  });

  it('refuses protocol-relative destinations in raw and encoded form', () => {
    expectRefused('//example.org', 'protocol-relative');
    expectRefused('//example.org/a/b', 'protocol-relative');
    expectRefused('///example.org', 'protocol-relative');
    expectRefused('/%2f%2fexample.org', 'protocol-relative');
    expectRefused('%2F%2Fexample.org', 'protocol-relative');
  });
});

describe('controls, whitespace and attribute-breaking bytes are refused', () => {
  it('refuses raw C0/C1 controls and DEL rather than stripping them', () => {
    expectRefused('\u0000', 'control-character');
    expectRefused('/a\u001fb', 'control-character');
    expectRefused('/a\u007fb', 'control-character');
    expectRefused('/a\u009fb', 'control-character');
    expectRefused('java\tscript:alert(1)', 'control-character');
    expectRefused('java\nscript:alert(1)', 'control-character');
    expectRefused('java\rscript:alert(1)', 'control-character');
  });

  it('refuses whitespace, so a padded or spaced value is never repaired', () => {
    expectRefused(' /about', 'whitespace');
    expectRefused('/about ', 'whitespace');
    expectRefused('/a b', 'whitespace');
    expectRefused('\u00a0/about', 'whitespace');
    expectRefused('/about\u2028', 'whitespace');
  });

  it('refuses backslashes and attribute-breaking characters', () => {
    expectRefused('a\\b', 'backslash');
    expectRefused('/a\\b', 'backslash');
    expectRefused('https://example.org\\@evil.example', 'backslash');
    expectRefused('/a<b', 'markup-character');
    expectRefused('/a>b', 'markup-character');
    expectRefused('/a"b', 'markup-character');
    expectRefused("/a'b", 'markup-character');
    expectRefused('/a`b', 'markup-character');
  });

  it('refuses empty and over-long values', () => {
    expectRefused('', 'empty');
    expectRefused('x'.repeat(AUTHOR_DESTINATION_MAX_LENGTH + 1), 'too-long');
    expectAccepted('/' + 'a'.repeat(AUTHOR_DESTINATION_MAX_LENGTH - 1), 'root-relative');
  });
});

describe('character references and nested encodings cannot hide a scheme', () => {
  it('refuses numeric and named character references instead of decoding them', () => {
    expectRefused('jav&#x61;script:alert(1)', 'character-reference');
    expectRefused('jav&#97;script:alert(1)', 'character-reference');
    expectRefused('javascript&colon;alert(1)', 'character-reference');
    expectRefused('&amp;#x6a;avascript:alert(1)', 'character-reference');
    expectRefused('/a&nbsp;b', 'character-reference');
  });

  it('refuses percent-encoded and double-encoded schemes', () => {
    expectRefused('%6a%61vascript:alert(1)', 'encoded-scheme');
    expectRefused('%256a%2561vascript:alert(1)', 'encoded-scheme');
    expectRefused('%25256a%252561vascript:alert(1)', 'encoded-scheme');
    expectRefused('%2525256a%25252561vascript:alert(1)', 'nested-encoding');
  });

  it('refuses malformed escapes and invalid UTF-8 sequences', () => {
    expectRefused('%zz', 'malformed-escape');
    expectRefused('/a%2', 'malformed-escape');
    expectRefused('%E2', 'malformed-escape');
  });

  it('refuses encoded controls and encoded markup', () => {
    expectRefused('/%00', 'encoded-control-character');
    expectRefused('/a%0d%0a', 'encoded-control-character');
    expectRefused('/a%3Cscript%3E', 'encoded-markup-character');
    expectRefused('/a%22b', 'encoded-markup-character');
  });
});

describe('malformed web origins are refused, not normalised', () => {
  it('refuses an origin that has no explicit double slash', () => {
    expectRefused('https:example.org', 'malformed-origin');
    expectRefused('http:example.org', 'malformed-origin');
    expectRefused('https:///example.org', 'malformed-origin');
    expectRefused('https://', 'malformed-origin');
    expectRefused('http://', 'malformed-origin');
    expectRefused('https://[::1', 'malformed-origin');
  });

  it('refuses userinfo, invalid ports and impossible hosts', () => {
    expectRefused('https://user@example.org', 'credentials-in-origin');
    expectRefused('https://user:pass@example.org', 'credentials-in-origin');
    expectRefused('https://example.org:99999', 'invalid-port');
    expectRefused('https://example.org:0', 'invalid-port');
    expectRefused('https://example.org:abc', 'invalid-port');
    expectRefused('https://example.org:/x', 'invalid-port');
    expectRefused('https://exa_mple.org', 'invalid-host');
    expectRefused('https://-example.org', 'invalid-host');
    expectRefused('https://example..org', 'invalid-host');
    expectRefused('https://example.org.', 'invalid-host');
  });
});

describe('mailto requires a real recipient and no encoded control bytes', () => {
  it('refuses a missing or unusable recipient', () => {
    expectRefused('mailto:', 'mailto-recipient-missing');
    expectRefused('mailto:?subject=x', 'mailto-recipient-missing');
    expectRefused('mailto:not-an-address', 'mailto-recipient-invalid');
    expectRefused('mailto:a@', 'mailto-recipient-invalid');
    expectRefused('mailto:@b.com', 'mailto-recipient-invalid');
    expectRefused('mailto:a@b..com', 'mailto-recipient-invalid');
    expectRefused('mailto:a@b.com,a@', 'mailto-recipient-invalid');
  });

  it('refuses raw or encoded CR/LF anywhere in the value', () => {
    expectRefused('mailto:a@b.com%0d%0aBcc:x@y.com', 'mailto-encoded-control');
    expectRefused('mailto:a@b.com?body=%0A', 'mailto-encoded-control');
    expectRefused('mailto:a@b.com%0D', 'mailto-encoded-control');
  });
});

describe('non-string input is refused without coercion', () => {
  it('refuses every non-string primitive and container', () => {
    for (const value of [null, undefined, 0, 1, true, false, [], ['/x'], {}, Symbol('x'), 10n]) {
      expectRefused(value, 'not-a-string');
    }
  });

  it('never invokes a hostile toString or Symbol.toPrimitive', () => {
    let toStringCalls = 0;
    let primitiveCalls = 0;
    let valueOfCalls = 0;

    const hostile = {
      toString(): string {
        toStringCalls += 1;
        return 'https://example.org';
      },
      valueOf(): string {
        valueOfCalls += 1;
        return 'https://example.org';
      },
      [Symbol.toPrimitive](): string {
        primitiveCalls += 1;
        return 'https://example.org';
      },
    };

    expectRefused(hostile, 'not-a-string');
    expect(toStringCalls).toBe(0);
    expect(valueOfCalls).toBe(0);
    expect(primitiveCalls).toBe(0);
  });
});

describe('the verdict stays deterministic and non-authorising', () => {
  it('returns the same verdict twice and never rewrites an accepted href', () => {
    for (const value of [
      '/a?b=1#c',
      'https://example.org/x',
      'mailto:a@b.com',
      '#x',
      '?q=1',
      'rel/path',
    ]) {
      const first = classifyAuthorDestination(value);
      const second = classifyAuthorDestination(value);
      expect(second).toEqual(first);
      expect(first.accepted).toBe(true);
      if (!first.accepted) continue;
      expect(first.href).toBe(value);
    }
  });

  it('does not leak the offending value into a refusal', () => {
    const verdict = classifyAuthorDestination('javascript:secret-token-abc');
    expect(verdict.accepted).toBe(false);
    if (verdict.accepted) return;
    expect(JSON.stringify(verdict)).not.toContain('secret-token-abc');
  });

  it('never claims a destination exists, is public or is permitted', () => {
    for (const value of [
      '/admin',
      '/unlisted/secret',
      'https://evil.example/secret',
      'mailto:anyone@example.org',
    ]) {
      const verdict = classifyAuthorDestination(value);
      expect(verdict.accepted).toBe(true);
      if (!verdict.accepted) continue;
      expect(Object.keys(verdict).sort()).toEqual(['accepted', 'category', 'href']);
      expect(Object.prototype.hasOwnProperty.call(verdict, 'exists')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(verdict, 'visible')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(verdict, 'authorized')).toBe(false);
    }
  });

  it('exposes no resolver, fetcher, renderer or provider surface', () => {
    expect(Object.keys(safeAuthorUrl).sort()).toEqual([
      'ADMITTED_ABSOLUTE_SCHEMES',
      'AUTHOR_DESTINATION_MAX_LENGTH',
      'classifyAuthorDestination',
      'isSafeAuthorHref',
    ]);
    expect(ADMITTED_ABSOLUTE_SCHEMES).toEqual(['http', 'https', 'mailto']);
    expect(Object.isFrozen(ADMITTED_ABSOLUTE_SCHEMES)).toBe(true);
  });

  it('keeps the boolean guard in exact agreement with the classifier', () => {
    for (const value of [
      '/ok',
      'javascript:alert(1)',
      'mailto:a@b',
      '//evil.example',
      '#f',
      'tel:+15551234',
      'https://example.org:99999',
      42,
      null,
    ]) {
      expect(isSafeAuthorHref(value)).toBe(classifyAuthorDestination(value).accepted);
    }
  });
});
