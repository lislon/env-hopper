import { normalize } from './utils'
import type { Id } from 'flexsearch'
import type { FuzzySearchInputEntry } from './types'
import { tokenize } from '~/modules/fuzzyMatchLogic/tokenize'

export type FuzzySearchPostFilterRow = {
  id: Id
  entry: FuzzySearchInputEntry
}

export function isTokensConsequent(
  foundTokens: Array<string>,
  entry: FuzzySearchInputEntry,
): boolean {
  const entryNormalized = normalize(entry.displayName)

  for (let index = 0; index < entryNormalized.length; index++) {
    const nextToken = foundTokens.shift()
    if (nextToken === undefined) {
      break
    }

    const nextIndex = entryNormalized.indexOf(nextToken, index)
    if (nextIndex === -1) {
      return false
    }
    index = nextIndex + nextToken.length - 1
  }

  return foundTokens.length === 0
}

/**
 * Post-filter + promote highest-intent matches for the current FlexSearch-based pipeline.
 *
 * Rules:
 * - Always require a basic in-order match.
 * - For multi-token queries, require exact token matches in-order (so standalone symbols like '#'
 *   are respected).
 * - Keep only rows with the maximum number of matched tokens (so "order #" prefers entries
 *   containing both tokens over entries containing only "order").
 */
export function postFiltration(
  raw: Array<FuzzySearchPostFilterRow>,
  needle: string,
): Array<FuzzySearchPostFilterRow> {
  const needleTokenList = tokenize(needle)

  function matchNeedleTokenAt(
    entryTokens: Array<string>,
    startIndex: number,
    needleToken: string,
  ): { ok: boolean; nextIndex: number } {
    if (startIndex >= entryTokens.length) {
      return { ok: false, nextIndex: startIndex }
    }

    let remaining = needleToken
    let j = startIndex

    while (j < entryTokens.length) {
      const eTok = entryTokens[j]!

      // Entry token fully covers the remaining needle token.
      if (eTok.startsWith(remaining)) {
        return { ok: true, nextIndex: j + 1 }
      }

      // Entry token can consume the next part of the needle token.
      if (remaining.startsWith(eTok)) {
        remaining = remaining.slice(eTok.length)
        j++
        if (remaining.length === 0) {
          return { ok: true, nextIndex: j }
        }
        continue
      }

      // Mismatch: once we've started consuming, require consecutive tokens.
      return { ok: false, nextIndex: startIndex }
    }

    return { ok: false, nextIndex: startIndex }
  }

  const passed: Array<FuzzySearchPostFilterRow & { tokenMatches: number }> = []

  for (const row of raw) {
    const entryTokenList = tokenize(row.entry.displayName)
    entryTokenList.join('')

    // Baseline filter:
    // - multi-token query: require exact standalone-token matches in order
    // - single-token query: allow character-in-order matching (permits env1 -> env-xxx-1)
    let matchedTokens = 0
    for (let i = 0, j = 0; i < needleTokenList.length; i++) {
      const nTok = needleTokenList[i]!

      let matchedThisNeedleToken = false
      while (j < entryTokenList.length) {
        const eTok = entryTokenList[j]!

        if (eTok.startsWith(nTok)) {
          matchedThisNeedleToken = true
          matchedTokens++
          j++
          break
        }

        // Allow a single needle token (e.g. "abcdev") to be satisfied by multiple
        // consecutive entry tokens (e.g. "abc" + "dev") by consuming them in order.
        if (nTok.startsWith(eTok)) {
          const res = matchNeedleTokenAt(entryTokenList, j, nTok)
          if (res.ok) {
            matchedThisNeedleToken = true
            matchedTokens++
            j = res.nextIndex
            break
          }
        }

        j++
      }

      if (!matchedThisNeedleToken) {
        break
      }
    }
    if (matchedTokens !== needleTokenList.length) {
      continue
    }

    // Token coverage: count how many needle tokens match entry tokens in-order.
    let matched = 0
    for (
      let i = 0, j = 0;
      i < needleTokenList.length && j < entryTokenList.length;
    ) {
      const nTok = needleTokenList[i]!
      const eTok = entryTokenList[j]!
      if (eTok === nTok) {
        matched++
        i++
        j++
      } else {
        j++
      }
    }

    passed.push({ ...row, tokenMatches: matched })
  }

  const maxMatches = passed.reduce((acc, r) => Math.max(acc, r.tokenMatches), 0)
  return passed
    .filter((r) => r.tokenMatches === maxMatches)
    .map(({ id, entry }) => ({ id, entry }))
}

// export function postFiltration(
//   raw: Array<FuzzySearchPreliminaryResult>,
// ): Array<FuzzySearchPreliminaryResult> {
//   return raw.filter(({ entry, foundTokens }) => {
//     if (foundTokens.length > 1 && !isTokensConsequent(foundTokens, entry)) {
//       return false
//     }
//     return true
//   })
// }
