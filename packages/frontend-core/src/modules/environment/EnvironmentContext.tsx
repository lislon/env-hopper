import type { EnvBaseInfo } from '@env-hopper/backend-core'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useDb } from '~/userDb/DbContext'
import { ApiQueryMagazineResourceJump } from '../resourceJump/api/ApiQueryMagazineResourceJump'
import type { EnvironmentHistoryItem } from './types'

export interface EnvironmentContext {
  setCurrentEnv: (envSlug: string | undefined) => void
  currentEnv: EnvBaseInfo | undefined
  getHistory: () => Array<EnvironmentHistoryItem>
  initialEnvSlug: string | undefined
  environments: Array<EnvBaseInfo>
}

export const EnvironmentContext = createContext<EnvironmentContext | undefined>(
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
  const db = useDb()
  const [history, setHistory] = useState<Array<EnvironmentHistoryItem>>([])

  // Fetch ResourceJumpsData to get environment information
  const { data: resourceJumpsData } = useQuery(
    ApiQueryMagazineResourceJump.getResourceJumps(),
  )


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

  const environments = useMemo(() => {
    return resourceJumpsData?.envs || []
  }, [resourceJumpsData])

  // Sync currentEnvSlug with URL changes (from initialEnvSlug prop)
  useEffect(() => {
    setCurrentEnvSlug(initialEnvSlug)
  }, [initialEnvSlug])

  // Lookup functions
  const findEnvBySlug = useCallback(
    (envSlug: string | undefined): EnvBaseInfo | undefined => {
      if (!envSlug || !resourceJumpsData) return undefined
      return resourceJumpsData.envs.find((env) => env.slug === envSlug)
    },
    [resourceJumpsData],
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

        // Don't navigate here - let ResourceJumpContext handle navigation
        // since it has access to both environment and resource state
      }
    },
    [db.environmentHistory],
  )

  const value: EnvironmentContext = useMemo(
    () => ({
      setCurrentEnv,
      currentEnv,
      getHistory: () => history,
      initialEnvSlug,
      environments
    }),
    [currentEnv, setCurrentEnv, history, initialEnvSlug, environments],
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
