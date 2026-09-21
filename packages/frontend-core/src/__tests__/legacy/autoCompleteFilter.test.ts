import { describe, expect, it } from 'vitest'
import { makeAutoCompleteFilter } from '~/legacy/lib/autoComplete/autoCompleteFilter'
import type { SourceItem } from '~/legacy/ui/AutoComplete/common'

/**
 * Parity fixture for the adapter that puts the previous UI's call signature over
 * the current matcher. The matcher's own ranking is covered in
 * `../modules/fuzzyMatchLogic/autoCompleteFilter.test.ts`, including the one
 * ranking divergence pinned there; this file covers only what the adapter is
 * responsible for — that a `SourceItem`'s favourite and recent flags still reach
 * the ranking, and that matching reads the title.
 *
 * Cases below are the previous implementation's own spec cases, brought over
 * verbatim except for ids: it left every `id` as `''`, which the adapter cannot
 * do because it keys results back to items by id.
 */
function toItem(title: string): SourceItem {
  return {
    id: title,
    title,
    favorite: title.includes('favorite'),
    recent: title.includes('recent'),
  }
}

function search(titles: Array<string>, needle: string): Array<string> {
  const db = titles.map(toItem)
  return makeAutoCompleteFilter(db)(needle, db).map((x) => x.title)
}

describe('legacy autocomplete adapter', () => {
  it('favourites, then recent, rank first — case sensitive', () => {
    expect(
      search(['a order', 'a order - recent', 'a order - favorite'], 'a'),
    ).toEqual(['a order - favorite', 'a order - recent', 'a order'])
  })

  it('favourites, then recent, rank first — case insensitive', () => {
    expect(
      search(['A order', 'A order - recent', 'A order - favorite'], 'a'),
    ).toEqual(['A order - favorite', 'A order - recent', 'A order'])
  })

  it('favourites, then recent, rank first — substring match', () => {
    expect(
      search(['A order', 'A order - recent', 'A order - favorite'], 'rd'),
    ).toEqual(['A order - favorite', 'A order - recent', 'A order'])
  })

  /**
   * The id is deliberately unsearchable here. Typing a slug and getting nothing
   * is correct, and has been mistaken for a broken list before.
   */
  it('matches the title, not the id', () => {
    const db: Array<SourceItem> = [
      { id: 'clinrev', title: 'Clinical Review' },
      { id: 'other', title: 'Something Else' },
    ]
    const filter = makeAutoCompleteFilter(db)
    expect(filter('Clinical', db).map((x) => x.id)).toEqual(['clinrev'])
    expect(filter('zzzz', db)).toEqual([])
  })

  it('returns whole items, so the section split still sees the flags', () => {
    const db = [toItem('a order - favorite')]
    expect(makeAutoCompleteFilter(db)('a', db)).toEqual([
      {
        id: 'a order - favorite',
        title: 'a order - favorite',
        favorite: true,
        recent: false,
      },
    ])
  })
})
