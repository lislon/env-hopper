import { prefixFrac } from './features/prefixFrac'
import type {
  FuzzySearchPreliminaryResult,
  FuzzySearchReturnItem,
} from './types'

const W = {
  prefixFrac: 1.3,
  prefixFracTokenMiddles: 0.1,
}

export function score(
  raw: Array<FuzzySearchPreliminaryResult>,
  needle: string,
): Array<FuzzySearchReturnItem> {
  const qLen = needle.length

  const scored = raw.map(({ entry }) => {
    const label = entry.displayName
    const norm = label

    const pf = prefixFrac(needle, norm, qLen)
    // const pfTokens = prefixFracTokenMiddles(entry, foundTokens)

    // const tc = tokenCoverage(qTokens, norm);
    // const pb = positionBonus(q, norm, W.positionDecayAlpha);

    let scoreValue = 0
    scoreValue += W.prefixFrac * pf

    return { entry, score: scoreValue }
  })

  // stable sort by score desc, then by displayName
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.entry.displayName.localeCompare(b.entry.displayName),
  )

  return scored
}
