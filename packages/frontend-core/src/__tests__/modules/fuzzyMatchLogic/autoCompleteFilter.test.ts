import { describe, expect, it } from 'vitest'
import { makeInputEntry } from './testUtils'
import type { FuzzySearchInputEntry } from '~/modules/fuzzyMatchLogic/types'
import {
  fuzzySearch,
  makeFuzzySearchIndex,
} from '~/modules/fuzzyMatchLogic/autoCompleteFilter'

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

describe('Autocomplete search', () => {
  let db: Array<FuzzySearchInputEntry & { frequency: number }> = []

  function given(strings: Array<string>) {
    db = strings.map((title) => makeInputEntry(title))
  }

  function searchResults(search: string) {
    const index = makeFuzzySearchIndex({
      entries: db,
    })

    return fuzzySearch(search, {
      index,
      freqGetter: (slug: string) => {
        const entry = db.find((e) => e.slug === slug)
        return entry ? entry.frequency : 0
      },
    }).map((r) => r.entry.displayName)
  }

  it('case 1', () => {
    given(['env-a', 'env-b'])
    expect(searchResults('a')).toEqual(['env-a'])
  })

  it('case 2a', () => {
    given(['x abcdev', 'abc-dev'])
    expect(searchResults('abcdev')).toMatchInlineSnapshot(`
      [
        "x abcdev",
        "abc-dev",
      ]
    `)
  })

  it('case 2b', () => {
    given(['abc-dev'])
    expect(searchResults('abcdev')).toMatchInlineSnapshot(`
      [
        "abc-dev",
      ]
    `)
  })

  it('case 2c', () => {
    given(['abc-dev'])
    expect(searchResults('abc-dev')).toMatchInlineSnapshot(`
      [
        "abc-dev",
      ]
    `)
  })

  it('case 3 - firstLetters', () => {
    given(['x abcdev', 'abcXXX-devXXX'])
    expect(searchResults('abc-dev')).toEqual(['abcXXX-devXXX'])
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
    expect(searchResults('B')).toMatchInlineSnapshot(`
      [
        "BACKUP-TEMPORAL",
        "Backup-21",
        "Backup-gammae",
        "BUILD-08",
        "Sig-betac",
        "STAGING-BETAB",
        "Staging-deployb",
      ]
    `)
  })

  it.todo('Case insensitive')

  it('prefix is priority', () => {
    given(['EPIC-ENV-A64', 'A64-ENV-01'])
    expect(searchResults('a64')).toEqual(['A64-ENV-01', 'EPIC-ENV-A64'])
  })

  // TODO: treat  numeric/letter boundaries with different priorities compared with separators like '-'
  it.todo('should respect delimiter')

  it('fuzzy will not match inverted', () => {
    given(['env-33'])
    expect(searchResults('33-env')).toEqual([])
  })

  it('Upper case is a word separator', () => {
    given(['camelCase', 'PascalCase', 'case'])
    expect(searchResults('case')).toMatchInlineSnapshot(`
      [
        "case",
        "camelCase",
        "PascalCase",
      ]
    `)
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

  it('will respect recent results first', () => {
    given(['a order', 'a order - [frequency=0.1]', 'a order - [frequency=0.5]'])
    expect(searchResults('a')).toEqual([
      'a order - [frequency=0.5]',
      'a order - [frequency=0.1]',
      'a order',
    ])
  })

  it('will rank prefixed match higher then frequency', () => {
    given(['ac [frequency=0.1]', 'abc [frequency=0.9]'])
    expect(searchResults('ac')).toMatchInlineSnapshot(`
      [
        "ac [frequency=0.1]",
        "abc [frequency=0.9]",
      ]
    `)
  })

  it('double dashes', () => {
    given(['abc-uat-01'])
    expect(searchResults('abcuat-01')).toEqual(['abc-uat-01'])
  })

  it('dash-separator', () => {
    given(['abc-uat'])
    expect(searchResults('abcuat')).toEqual(['abc-uat'])
  })
})
