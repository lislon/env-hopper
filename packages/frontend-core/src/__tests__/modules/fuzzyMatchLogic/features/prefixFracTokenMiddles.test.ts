import { describe, expect, it } from 'vitest'
import { makeInputEntry } from '../testUtils'
import { prefixFracAcrossTokens } from '~/modules/fuzzyMatchLogic/features/prefixFracTokenMiddles'

describe('prefixFracAcrossTokens', () => {
  it('not found', () => {
    const input = makeInputEntry('env-001')
    const actual = prefixFracAcrossTokens(input, ['002'])
    expect(actual.toFixed(2)).toEqual('0.00')
  })

  it('1 token match full', () => {
    const input = makeInputEntry('env-001-abc')
    const actual = prefixFracAcrossTokens(input, ['001', 'abc'])
    expect(actual.toFixed(2)).toEqual('1.00')
  })

  it('1 token match partial l', () => {
    const input = makeInputEntry('env-001-abc')
    const actual = prefixFracAcrossTokens(input, ['001', 'ab'])
    expect(actual.toFixed(2)).toEqual('0.83')
  })
})
