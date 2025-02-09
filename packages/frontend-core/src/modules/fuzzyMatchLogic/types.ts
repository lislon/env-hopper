import type { Index } from 'flexsearch'

export interface FuzzySearchInputEntry {
  slug: string
  displayName: string
}

export interface FuzzySearchContext {
  index: FuzzySearchIndex
}

export interface FuzzySearchIndex {
  flexIndex: Index
  entries: Array<FuzzySearchInputEntry>
}

export interface FuzzySearchIndexEntry {
  inputEntry: FuzzySearchInputEntry
  tokens: Array<string>
}

export interface FuzzySearchPrepareIndexParams {
  entries: Array<FuzzySearchInputEntry>
}

export interface FuzzySearchPreliminaryResult {
  entry: FuzzySearchInputEntry
  // foundTokens: string[]
}

export interface FuzzySearchReturnItem {
  entry: FuzzySearchInputEntry
}
