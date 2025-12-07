import { useCallback, useEffect, useState } from 'react'
import type { EnvironmentHistoryItem } from '~/modules/environment/types'
import { useDb } from '~/userDb/DbContext'

export function useEnvironmentHistory() {
  const db = useDb()

  const [history, setHistory] = useState<Array<EnvironmentHistoryItem>>([])

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const historyItems = await db.environmentHistory
        .toCollection()
        .limit(10)
        .sortBy('timestamp')
      setHistory(historyItems)
    }
    fetchHistory()
  }, [db.environmentHistory])

  const historySaveEnvSwitch = useCallback(
    (envSlug: string) => {
      const timestamp = Date.now()
      const newHistoryItem: EnvironmentHistoryItem = { envSlug, timestamp }
      db.environmentHistory.add(newHistoryItem)
      // update in-memory only; persisting is handled by caller
      setHistory((prev) => [newHistoryItem, ...prev])
    },
    [db.environmentHistory],
  )

  return {
    history,
    setHistory,
    historySaveEnvSwitch,
  }
}
