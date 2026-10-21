import { describe, expect, it } from 'vitest';
import { escapeLikePattern, requireIsoDate } from './validation.js';

describe('escapeLikePattern', () => {
  it('leaves plain text untouched', () => {
    expect(escapeLikePattern('hello world')).toBe('hello world');
  });

  it('escapes %, _ and backslash so they are treated literally in ILIKE', () => {
    expect(escapeLikePattern('100%_done\\now')).toBe('100\\%\\_done\\\\now');
  });
});

describe('requireIsoDate', () => {
  it('normalizes a valid date-time string', () => {
    expect(requireIsoDate('2030-01-02T03:04:05.000Z', 'startsAt')).toBe(
      '2030-01-02T03:04:05.000Z',
    );
  });

  it('rejects an unparsable string', () => {
    expect(() => requireIsoDate('not-a-date', 'startsAt')).toThrow();
  });
});
