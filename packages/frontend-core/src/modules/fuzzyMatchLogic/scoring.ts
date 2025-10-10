import { positionBonus } from './features/positionBonus'
import { prefixFrac } from './features/prefixFrac'
import type {
  FuzzySearchPreliminaryResult,
  FuzzySearchReturnItem,
} from './types'

const W = {
  prefixFrac: 1.3,
  prefixFracTokenMiddles: 0.1,
  positionBonus: 0.08,
  // How fast the bonus decays as the first match appears later in the string.
  // Higher = harsher penalty for late matches.
  positionDecayAlpha: 0.08,
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
    const pb = positionBonus(needle, norm, W.positionDecayAlpha)

    let scoreValue = 0
    scoreValue += W.prefixFrac * pf
    scoreValue += W.positionBonus * pb

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
