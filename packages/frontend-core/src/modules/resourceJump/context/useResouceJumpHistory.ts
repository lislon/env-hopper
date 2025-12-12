import { useCallback, useEffect, useState } from "react";
import type { ResourceJumpHistoryItem } from "~/modules/resourceJump/types";
import { useDb } from "~/userDb/DbContext";

export function useResourceJumpHistory() {
  const db = useDb()

  const [history, setHistory] = useState<Array<ResourceJumpHistoryItem>>([])

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const historyItems = await db.resourceJumpHistory
        .toCollection()
        .sortBy('timestamp')
      setHistory(historyItems.reverse().slice(0, 100))
    }
    fetchHistory()
  }, [db.resourceJumpHistory])

  const historySaveEnvSwitch = useCallback(
    (envSlug: string) => {
      const timestamp = Date.now()
      const newHistoryItem: ResourceJumpHistoryItem = {
        type: 'switch-selector',
        envSlug,
        timestamp,
      }
      db.resourceJumpHistory.add(newHistoryItem)
      setHistory((prevHistory) => [newHistoryItem, ...prevHistory])
    }, [db.resourceJumpHistory]);

  const historySaveFlagmanSwitch = useCallback(
    (flagmanSlug: string) => {
      const timestamp = Date.now()
      const newHistoryItem: ResourceJumpHistoryItem = {
        type: 'switch-selector',
        flagshipSlug: flagmanSlug,
        timestamp,
      }
      setHistory((prevHistory) => [newHistoryItem, ...prevHistory])
    }, []);


  return {
    history,
    setHistory,
    historySaveEnvSwitch,
    historySaveFlagmanSwitch
  }
}