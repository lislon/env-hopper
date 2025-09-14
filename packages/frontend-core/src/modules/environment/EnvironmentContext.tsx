import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useBootstrapConfig } from '../config/BootstrapConfigContext'
import type { EhEnvIndexed } from '@env-hopper/backend-core'
import type { ReactNode } from 'react'
import type { EnvironmentHistoryItem } from './types'
import { useDb } from '~/userDb/DbContext'

export interface EnvironmentContext {
  setCurrentEnv: (envSlug: string | undefined) => void
  currentEnv: EhEnvIndexed | undefined
  getHistory: () => Array<EnvironmentHistoryItem>
}

const EnvironmentContext = createContext<EnvironmentContext | undefined>(
  undefined,
)

interface EnvironmentProviderProps {
  children: ReactNode
  initialEnvSlug?: string
}

export function EnvironmentProvider({
  children,
  initialEnvSlug,
}: EnvironmentProviderProps) {
  const indexData = useBootstrapConfig()
  const db = useDb()
  const [history, setHistory] = useState<Array<EnvironmentHistoryItem>>([])

  useEffect(() => {
    const fetchHistory = async () => {
      const historyItems = await db.environmentHistory
        .toCollection()
        .sortBy('timestamp')
      setHistory(historyItems)
    }
    fetchHistory()
  }, [db.environmentHistory])

  const [currentEnvSlug, setCurrentEnvSlug] = useState<string | undefined>(
    initialEnvSlug,
  )

  // Lookup functions
  const findEnvBySlug = useCallback(
    (envSlug: string | undefined): EhEnvIndexed | undefined => {
      if (!envSlug) return undefined
      return indexData.envs[envSlug]
    },
    [indexData.envs],
  )

  // Get current objects from slugs
  const currentEnv = findEnvBySlug(currentEnvSlug)
  const setCurrentEnv = useCallback(
    (envSlug: string | undefined) => {
      setCurrentEnvSlug(envSlug)
      const timestamp = Date.now()
      if (envSlug !== undefined) {
        setHistory((prev) => [...prev, { envSlug, timestamp }])
        db.environmentHistory.add({ envSlug, timestamp })
      }
    },
    [db.environmentHistory],
  )

  const value: EnvironmentContext = useMemo(
    () => ({
      setCurrentEnv,
      currentEnv,
      getHistory: () => history,
    }),
    [currentEnv, setCurrentEnv, history],
  )

  //   return (
  //     <EnvironmentContext value={value}></EnvironmentContext>
  //       recents: history,
  //       record: (envSlug: string) => {
  //         const timestamp = Date.now();
  //         setHistory((prev) => [...prev, { envSlug, timestamp }]);
  //       },
  //     },
  //   }), [currentEnv, setCurrentEnv, history]);

  //   return (
  //     <EnvironmentContext value={value}></EnvironmentContext>
  //       recents: [],
  //       record: (envSlug: string) => {
  //         const timestamp = Date.now();
  //         envHistory.recents.push({ envSlug, timestamp });
  //       },
  //     },
  //   }), [currentEnv, setCurrentEnv]);

  return <EnvironmentContext value={value}>{children}</EnvironmentContext>
}

export function useEnvironmentContext(): EnvironmentContext {
  const context = use(EnvironmentContext)
  if (context === undefined) {
    throw new Error(
      'useEnvironmentContext must be used within an EnvironmentProvider',
    )
  }
  return context
}
