import type { FuzzySearchInputEntry } from '~/modules/fuzzyMatchLogic/types'

export function makeInputEntry(displayName: string): FuzzySearchInputEntry {
  return {
    slug: displayName,
    displayName,
  }
}
