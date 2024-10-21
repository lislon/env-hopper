import { tokenize } from './tokenize';
import { describe } from 'vitest';

describe('tokenize', () => {
  describe('special symbols standalone', () => {
    it('at the start start', () => {
      const result = tokenize('# 12foo');
      expect(result).toMatchInlineSnapshot(`
        [
          "#",
          "12",
          "foo",
        ]
      `);
    });

    it('at the middle', () => {
      const result = tokenize('abc # 12foo');
      expect(result).toMatchInlineSnapshot(`
        [
          "abc",
          "#",
          "12",
          "foo",
        ]
      `);
    });

    it('in the end', () => {
      const result = tokenize('12foo #');
      expect(result).toMatchInlineSnapshot(`
        [
          "12",
          "foo",
          "#",
        ]
      `);
    });

    it('as part of word - no', () => {
      const result = tokenize('#12foo');
      expect(result).toMatchInlineSnapshot(`
        [
          "12",
          "foo",
        ]
      `);
    });
  });

  it('lowercase', () => {
    const result = tokenize('12-FOO');
    expect(result).toEqual(['12', 'foo']);
  });

  it('camelCase', () => {
    const result = tokenize('camelCase');
    expect(result).toEqual(['case', 'camelcase']);
  });
});
