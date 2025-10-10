import { useMemo } from 'react'
import type { SlugAndDisplayName } from '~/modules/resourceJump/types'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { getTopN } from '~/modules/resourceJump/utils/statistics/statisticsHelpers'

export function useMostRelevantQuickEnvs(): Array<SlugAndDisplayName> {
  const { environments } = useEnvironmentContext()
  const { history } = useResourceJumpContext()

  return useMemo(() => {
    return getTopN({
      historyFiltered: history.filter(
        (item) => item.type === 'switch-selector' && item.envSlug !== undefined,
      ),
      groupByFn: (item) => item.envSlug!,
      slugFinder: (slug) => environments.find((env) => env.slug === slug),
      n: 3,
    })
  }, [environments, history])
}
