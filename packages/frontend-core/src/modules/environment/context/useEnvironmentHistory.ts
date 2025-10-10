import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import type { EnvironmentHistoryItem } from '~/modules/environment/types'
import { useDb } from '~/userDb/DbContext'

export function useEnvironmentHistory() {
  const db = useDb()

  const history = useLiveQuery(async () => {
    const days30Ago = Date.now() - 30 * 24 * 60 * 60 * 1000
    return await db.environmentHistory
      .where('timestamp')
      .aboveOrEqual(days30Ago)
      .sortBy('timestamp')
  })

  const historySaveEnvSwitch = useCallback(
    (envSlug: string) => {
      const timestamp = Date.now()
      const newHistoryItem: EnvironmentHistoryItem = { envSlug, timestamp }
      db.environmentHistory.add(newHistoryItem)
    },
    [db.environmentHistory],
  )

  return {
    history: history || [],
    historySaveEnvSwitch,
  }
}
