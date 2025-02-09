import { describe, expect, it } from 'vitest'
import { makeInputEntry } from './testUtils'
import { isTokensConsequent } from '~/modules/fuzzyMatchLogic/postFiltration'

describe('isTokensConsequent', () => {
  it('in order', () => {
    const actual = isTokensConsequent(['env', '3'], makeInputEntry('env-xxx-3'))
    expect(actual).toBeTruthy()
  })

  it('reversed', () => {
    const actual = isTokensConsequent(['3', 'env'], makeInputEntry('env-xxx-3'))
    expect(actual).toBeFalsy()
  })
})
