import { useCallback, useEffect, useState } from 'react'
import type { ResourceJumpHistoryItem } from '~/modules/resourceJump/types'
import { useDb } from '~/userDb/DbContext'

const MAX_HISTORY_ITEMS = 1000
const DISPLAY_HISTORY_ITEMS = 100

function isSameHistoryItem(
  a: ResourceJumpHistoryItem,
  b: Omit<ResourceJumpHistoryItem, 'timestamp'>,
): boolean {
  return (
    a.type === b.type &&
    a.resourceSlug === b.resourceSlug &&
    a.envSlug === b.envSlug &&
    a.flagshipSlug === b.flagshipSlug
  )
}

export function useResourceJumpHistory() {
  const db = useDb()

  const [history, setHistory] = useState<Array<ResourceJumpHistoryItem>>([])

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const historyItems = await db.resourceJumpHistory
        .toCollection()
        .sortBy('timestamp')
      setHistory(historyItems.reverse().slice(0, DISPLAY_HISTORY_ITEMS))
    }
    fetchHistory()
  }, [db.resourceJumpHistory])

  // Trim history if it exceeds MAX_HISTORY_ITEMS
  const trimHistory = useCallback(async () => {
    const count = await db.resourceJumpHistory.count()
    if (count > MAX_HISTORY_ITEMS) {
      const itemsToDelete = count - MAX_HISTORY_ITEMS
      const oldestItems = await db.resourceJumpHistory
        .toCollection()
        .sortBy('timestamp')
      const idsToDelete = oldestItems
        .slice(0, itemsToDelete)
        .map((item) => item.id)
        .filter((id): id is number => id !== undefined)
      await db.resourceJumpHistory.bulkDelete(idsToDelete)
    }
  }, [db.resourceJumpHistory])

  const saveHistoryItem = useCallback(
    async (newItem: Omit<ResourceJumpHistoryItem, 'timestamp'>) => {
      const timestamp = Date.now()
      const historyItem: ResourceJumpHistoryItem = {
        ...newItem,
        timestamp,
      }

      // Check if last item is the same (deduplication)
      const lastItem = history[0]
      if (lastItem && isSameHistoryItem(lastItem, newItem)) {
        return
      }

      // Add new item
      const id = await db.resourceJumpHistory.add(historyItem)
      setHistory((prev) => [
        { ...historyItem, id },
        ...prev.slice(0, DISPLAY_HISTORY_ITEMS - 1),
      ])

      // Trim if needed (async, don't await)
      void trimHistory()
    },
    [db.resourceJumpHistory, history, trimHistory],
  )

  const historySaveEnvSwitch = useCallback(
    (envSlug: string) => {
      void saveHistoryItem({
        type: 'switch-selector',
        envSlug,
      })
    },
    [saveHistoryItem],
  )

  const historySaveFlagmanSwitch = useCallback(
    (flagmanSlug: string) => {
      void saveHistoryItem({
        type: 'switch-selector',
        flagshipSlug: flagmanSlug,
      })
    },
    [saveHistoryItem],
  )

  const historySaveResourceSwitch = useCallback(
    (resourceSlug: string, envSlug?: string) => {
      void saveHistoryItem({
        type: 'switch-selector',
        resourceSlug,
        envSlug,
      })
    },
    [saveHistoryItem],
  )

  return {
    history,
    setHistory,
    historySaveEnvSwitch,
    historySaveFlagmanSwitch,
    historySaveResourceSwitch,
  }
}
