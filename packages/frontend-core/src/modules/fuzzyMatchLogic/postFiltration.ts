import type {
  FuzzySearchInputEntry
} from './types'
import { normalize } from './utils'

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
