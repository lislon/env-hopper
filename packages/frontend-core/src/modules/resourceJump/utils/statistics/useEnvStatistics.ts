import { useMemo } from 'react'
import { useEnvironmentHistory } from '~/modules/environment/context/useEnvironmentHistory'

export type EnvFreq = Record<string, number>

export function useEnvStatistics(): EnvFreq {
  const { history } = useEnvironmentHistory()

  return useMemo(() => {
    const now = Date.now()
    const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
    // after 7 days → weight is 0.5

    const count = new Map<string, number>()

    for (const item of history) {
      const age = now - item.timestamp
      const weight = Math.exp(-age / HALF_LIFE_MS)

      count.set(item.envSlug, (count.get(item.envSlug) ?? 0) + weight)
    }

    const max = Math.max(...count.values(), 1)
    const freq: EnvFreq = {}

    for (const [env, value] of count) {
      freq[env] = value / max
    }

    return freq
  }, [history])
}
