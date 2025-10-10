import { useMemo } from 'react'
import type { SlugAndDisplayName } from '~/modules/resourceJump/types'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { getTopN } from '~/modules/resourceJump/utils/statistics/statisticsHelpers'

const MAX_N = 3

export function useMostRelevantQuickFlaships(): Array<SlugAndDisplayName> {
  const { history, flagshipJumpResources } = useResourceJumpContext()

  return useMemo(() => {
    const topN = getTopN({
      historyFiltered: history.filter(
        (item) =>
          item.type === 'switch-selector' && item.flagshipSlug !== undefined,
      ),
      groupByFn: (item) => item.envSlug!,
      slugFinder: (slug) =>
        flagshipJumpResources.find((env) => env.slug === slug),
      n: MAX_N,
    })

    for (
      let c = 0;
      topN.length < MAX_N && c < flagshipJumpResources.length;
      c++
    ) {
      if (topN.find((f) => f.slug === flagshipJumpResources[c]!.slug)) {
        continue
      }
      topN.push(flagshipJumpResources[c]!)
    }

    return topN
  }, [flagshipJumpResources, history])
}
