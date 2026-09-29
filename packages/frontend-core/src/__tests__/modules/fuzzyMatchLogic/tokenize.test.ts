import { describe, expect, it } from 'vitest'
import { tokenize } from '~/modules/fuzzyMatchLogic/tokenize'

describe('tokenize', () => {
  /**
   * Divergences from the implementation this was ported from
   * (`apps/frontend/src/app/lib/autoComplete/tokenize.ts` in the v1 tree), kept as
   * `it.fails` so they are recorded rather than either deleted or quietly
   * re-recorded. Each asserts what the original produced; each therefore starts
   * passing — and so fails, loudly — the moment the port is brought back in line,
   * which is the signal to promote it to a plain `it`.
   *
   * The original's full contract, for reference; the port agrees only on the
   * third and fourth, i.e. only when '#' already happens to land last:
   *
   *   '# 12foo'     -> ['#', '12', 'foo']
   *   'abc # 12foo' -> ['abc', '#', '12', 'foo']
   *   '12foo #'     -> ['12', 'foo', '#']      (port agrees)
   *   '#12foo'      -> ['12', 'foo']
   *   '12-FOO'      -> ['12', 'foo']           (port agrees)
   *
   * A standalone '#' is searchable on purpose: a page title that takes a
   * substitution parameter is suffixed with ' #' by convention, and that is how
   * people find those entries. The port keeps the token but loses both its
   * position and the standalone test, because it collects every '#' in the
   * string and appends them.
   */
  describe('parity with the original tokenizer', () => {
    it.fails("keeps a standalone '#' in the position it appeared", () => {
      expect(tokenize('# 12foo')).toEqual(['#', '12', 'foo'])
      // The port returns ['12', 'foo', '#'] — appended, not positioned.
      // Same root cause for 'abc # 12foo', which it returns as
      // ['abc', '12', 'foo', '#'] instead of ['abc', '#', '12', 'foo'].
    })

    it.fails("emits no token for a '#' that is part of a word", () => {
      expect(tokenize('#12foo')).toEqual(['12', 'foo'])
      // The port returns ['12', 'foo', '#'], so a '#' query also matches
      // entries where '#' is attached to a word rather than standing alone.
    })
  })

  it('Tokenize complex expression', () => {
    const result = tokenize('123abc12 CamelABCCaseX foo-bar_baz,HelloWorld')
    expect(result).toMatchInlineSnapshot(`
        [
          "123",
          "abc",
          "12",
          "camel",
          "abc",
          "case",
          "x",
          "foo",
          "bar",
          "baz",
          "hello",
          "world",
        ]
      `)
  })

  it('in the end', () => {
    const result = tokenize('12foo #')
    expect(result).toMatchInlineSnapshot(`
      [
        "12",
        "foo",
        "#",
      ]
    `)
  })

  it('camelCase', () => {
    const result = tokenize('camelCase')
    expect(result).toMatchInlineSnapshot(`
      [
        "camel",
        "case",
      ]
    `)
  })

  it('international', () => {
    const result = tokenize('РусскийТекстΣ')
    expect(result).toMatchInlineSnapshot(`
        [
          "русский",
          "текст",
          "σ",
        ]
      `)
  })
})
