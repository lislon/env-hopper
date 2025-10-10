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
import { ApiQueryMagazineResourceJump } from '../../resourceJump/api/ApiQueryMagazineResourceJump'
import type { EnvironmentHistoryItem } from '../types'
import { useEnvironmentHistory } from './useEnvironmentHistory'

export interface EnvironmentContext {
  setCurrentEnv: (envSlug: string | undefined) => void
  currentEnv: EnvBaseInfo | undefined
  history: Array<EnvironmentHistoryItem>
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
  // Use environment history hook (loads history from DB and provides save)
  const { history, historySaveEnvSwitch } = useEnvironmentHistory()

  // Fetch ResourceJumpsData to get environment information
  const { data: resourceJumpsData } = useQuery(
    ApiQueryMagazineResourceJump.getResourceJumps(),
  )

  const [currentEnvSlug, setCurrentEnvSlug] = useState<string | undefined>(
    initialEnvSlug,
  )

  const environments = useMemo(() => {
    return resourceJumpsData?.envs || []
  }, [resourceJumpsData])

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
      // TODO: Intentionally setting state directly from URL
      setCurrentEnvSlug(envSlug)
      if (envSlug !== undefined) {
        historySaveEnvSwitch(envSlug)
      }
    },
    [historySaveEnvSwitch],
  )

  // Sync currentEnvSlug with URL changes (from initialEnvSlug prop)
  useEffect(() => {
    setCurrentEnv(initialEnvSlug)
  }, [initialEnvSlug, setCurrentEnv])

  const value: EnvironmentContext = useMemo(
    () => ({
      setCurrentEnv,
      currentEnv,
      history,
      initialEnvSlug,
      environments,
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
