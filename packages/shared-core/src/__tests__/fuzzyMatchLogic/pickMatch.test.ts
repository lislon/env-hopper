import { describe, expect, it } from 'vitest'
import { pickMatch } from '../../fuzzyMatchLogic/pickMatch'

const envs = [
  { slug: 'alpha-integration-01', name: 'alpha-integration-01' },
  { slug: 'alphabox-01', name: 'alphabox-01' },
  { slug: 'beta-02', name: 'beta-02' },
]
const pages = [
  { slug: 'view', name: 'View case #' },
  { slug: 'review', name: 'Review case #', aliases: ['dossier'] },
  { slug: 'order', name: 'Order #' },
]

describe('pickMatch', () => {
  it('exact slug, name or alias, ignoring case and punctuation: picked alone', () => {
    expect(pickMatch('Beta 02', envs)).toEqual({
      picked: 'beta-02',
      options: [],
    })
    expect(pickMatch('Dossier', pages)).toEqual({
      picked: 'review',
      options: [],
    })
  })

  it('a clear winner: picked, with the runner-up', () => {
    expect(pickMatch('alpha', envs)).toEqual({
      picked: 'alpha-integration-01',
      options: [{ slug: 'alphabox-01', name: 'alphabox-01' }],
    })
  })

  it('a close call: nothing picked, the equally good ones as options', () => {
    expect(pickMatch('case', pages)).toEqual({
      picked: null,
      options: [
        { slug: 'review', name: 'Review case #' },
        { slug: 'view', name: 'View case #' },
      ],
    })
  })

  it('a preference breaks a tie but never beats a better match', () => {
    expect(pickMatch('case', pages, { prefer: (s) => s === 'view' })).toEqual({
      picked: 'view',
      options: [{ slug: 'review', name: 'Review case #' }],
    })
    expect(
      pickMatch('alpha', envs, { prefer: (s) => s === 'alphabox-01' }).picked,
    ).toBe('alpha-integration-01')
  })

  it('aliases count only when exact: a fuzzy alias hit does not outrank names', () => {
    expect(pickMatch('doss', pages).picked).toBeNull()
  })

  it('nothing matches: nothing picked, the closest spellings as options', () => {
    expect(pickMatch('betta-2', envs)).toEqual({
      picked: null,
      options: [{ slug: 'beta-02', name: 'beta-02' }],
    })
  })

  it('two exact matches are a close call', () => {
    expect(
      pickMatch('ops', [
        { slug: 'a', name: 'A', aliases: ['ops'] },
        { slug: 'b', name: 'B', aliases: ['OPS'] },
      ]).picked,
    ).toBeNull()
  })
})
