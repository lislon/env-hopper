import { describe, expect, it } from 'vitest'
import { tokenize } from '~/modules/fuzzyMatchLogic/tokenize'

describe('tokenize', () => {
  it('at the start start', () => {
    const result = tokenize('# 12foo')
    expect(result).toMatchInlineSnapshot(`
        [
          "12",
          "foo",
        ]
      `)
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
