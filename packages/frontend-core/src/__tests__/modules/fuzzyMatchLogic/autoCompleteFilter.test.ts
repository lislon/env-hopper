import { Encoder, Index } from 'flexsearch'
import { describe, expect, it } from 'vitest'
import {
  fuzzySearch,
  makeFuzzySearchIndex,
} from '~/modules/fuzzyMatchLogic/autoCompleteFilter'
import type { FuzzySearchInputEntry } from '~/modules/fuzzyMatchLogic/types'
import { makeInputEntry } from './testUtils'

const randomEnvironmentNames = [
  'uat-0916',
  'Prod-02a',
  'Pipeline-delta11',
  'BUILD-08',
  'Dev-107',
  'staging-envc',
  'Backup-gammae',
  'Infra-temporale',
  'STAGING-BETAB',
  'Backup-21',
  'Sig-betac',
  'Prod-production14',
  'Staging-deployb',
  'BACKUP-TEMPORAL',
  'acc-2198',
  'node-productiona',
  'shared-21',
  'Sig-deploy',
  'SIG-01',
  'uat-temporal',
]

describe('env search a bit fuzzy', () => {
  it('me', () => {
    const encoder = new Encoder({})
    const index = new Index({
      tokenize: 'forward',
      encoder: encoder,
    })
    index.add(0, 'lisa.slon')
    index.add(1, 'slon')
    index.add(2, 'lisa')

    const resa = index.searchCache('lisa slon')
    console.dir(resa)
  })

  let db: Array<FuzzySearchInputEntry> = []

  function given(strings: Array<string>) {
    db = strings.map((title) => makeInputEntry(title))
  }

  function searchResults(search: string) {
    const index = makeFuzzySearchIndex({
      entries: db,
    })
    return fuzzySearch(search, { index })
  }

  it('case 1', () => {
    given(['env-a', 'env-b'])
    expect(searchResults('a')).toEqual(['env-a'])
  })

  it('case 2', () => {
    given(['x abcdev', 'abc-dev'])
    expect(searchResults('abcdev')).toMatchInlineSnapshot(`
      [
        "abc-dev",
        "x abcdev",
      ]
    `)
  })

  it('case 3 - firstLetters', () => {
    given(['x abcdev', 'abcXXX-devXXX'])
    expect(searchResults('abc-dev')).toEqual(['abcXXX-devXXX', 'x abcdev'])
  })

  it('case 4', () => {
    given(['env-xxx-1', 'env-xxx-3'])
    expect(searchResults('env1')).toEqual(['env-xxx-1'])
  })

  it('case 5', () => {
    given(['env-xxxx-33', 'env-xxx-33', 'env-xxx-3'])
    expect(searchResults('env-xxx-3')).toEqual([
      'env-xxx-3',
      'env-xxx-33',
      'env-xxxx-33',
    ])
  })

  it('user can find split text without splitters', () => {
    given(['Abc-Rev'])
    expect(searchResults('Abcrev')).toEqual(['Abc-Rev'])
  })

  it('case 6', () => {
    given(randomEnvironmentNames)
    expect(searchResults('pro14')).toEqual(['Prod-production14'])
  })

  it('case 7', () => {
    given(randomEnvironmentNames)
    expect(searchResults('B')).toEqual([
      'BUILD-08',
      'Backup-21',
      'Backup-gammae',
      'BACKUP-TEMPORAL',
      'Sig-betac',
      'STAGING-BETAB',
      'Staging-deployb',
    ])
  })

  it('Case insensitive', () => {
    given(['Abc Review', 'AbcRev'])
    expect(searchResults('Rev')).toEqual(['AbcRev', 'Abc Review'])
  })

  it('prefix is priority', () => {
    given(['EPIC-ENV-A64', 'A64-ENV-01'])
    expect(searchResults('a64')).toEqual(['A64-ENV-01', 'EPIC-ENV-A64'])
  })

  // TODO: treat  numeric/letter boundaries with different priorities compared with separators like '-'
  it.skip('should respect delimiter', () => {
    given(['g32pe-01', 'g32-dev-01'])
    expect(searchResults('g32')).toEqual(['g32-dev-01', 'g32pe-01'])
  })

  it('fuzzy will not match inverted', () => {
    given(['env-33'])
    expect(searchResults('33-env')).toEqual([])
  })

  it('Upper case is a word separator', () => {
    given(['camelCase', 'PascalCase', 'case'])
    expect(searchResults('case')).toEqual(['case', 'camelCase', 'PascalCase'])
  })

  it('000 Leading zeros can be omitted', () => {
    given(['env-001', 'env-1'])
    expect(searchResults('1')).toEqual(['env-1', 'env-001'])
  })

  it('ru keyboard layout is working too', () => {
    given(['env-001'])
    expect(searchResults('утм')).toEqual(['env-001'])
  })

  it('special symbols will be working if they are standalone', () => {
    given(['a order', 'b order #', 'c order'])
    expect(searchResults('order #')).toEqual(['b order #'])
  })

  it('favorites, then recent, are priority - case sensitive', () => {
    given(['a order', 'a order - recent', 'a order - favorite'])
    expect(searchResults('a')).toEqual([
      'a order - favorite',
      'a order - recent',
      'a order',
    ])
  })

  it('favorites, then recent, are priority - case insensitive', () => {
    given(['A order', 'A order - recent', 'A order - favorite'])
    expect(searchResults('a')).toEqual([
      'A order - favorite',
      'A order - recent',
      'A order',
    ])
  })

  it('favorites, then recent, are priority - substring', () => {
    given(['A order', 'A order - recent', 'A order - favorite'])
    expect(searchResults('rd')).toEqual([
      'A order - favorite',
      'A order - recent',
      'A order',
    ])
  })

  it('doubl dashes', () => {
    given(['abc-uat-01'])
    expect(searchResults('abcuat-01')).toEqual(['abc-uat-01'])
  })

  it('dash-separator', () => {
    given(['abc-uat'])
    expect(searchResults('abcuat')).toEqual(['abc-uat'])
  })

  it('does not match substrings', () => {
    given(['abc'])
    expect(searchResults('b')).toEqual([])
  })
})
