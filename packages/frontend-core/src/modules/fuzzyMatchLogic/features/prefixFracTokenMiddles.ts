import { sum } from 'radashi'
import { tokenize } from '../tokenize'
import { longestCommonPrefix } from '../utils'
import type { FuzzySearchInputEntry } from '../types'

export function prefixFracAcrossTokens(
  entry: FuzzySearchInputEntry,
  needleTokens: Array<string>,
): number {
  const entryTokens = tokenize(entry.displayName)

  const scores = []

  for (let i = 0, j = 0; i < needleTokens.length && j < entryTokens.length; ) {
    const needleToken = needleTokens[i]!
    const entryToken = entryTokens[j]!

    if (entryToken.includes(needleToken)) {
      const lcp = longestCommonPrefix(entryToken, needleToken)
      scores.push((1.0 * lcp) / entryToken.length)
      i++
      j++
    } else {
      j++
    }
  }

  return needleTokens.length > 0 ? sum(scores) / needleTokens.length : 0
}
