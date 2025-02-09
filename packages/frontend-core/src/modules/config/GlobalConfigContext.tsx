import type { ReactNode } from 'react';
import { createContext, use, useMemo } from 'react';

interface FrontendConfig {
  microinteractionsToKeep: number
  searchHistoryToKeep: number
}

export interface GlobalConfigContext {
  config: FrontendConfig
}

const GlobalConfigContext = createContext<GlobalConfigContext | undefined>(
  undefined,
)

interface GlobalConfigProviderProps {
  children: ReactNode
}

export function GlobalConfigProvider({ children }: GlobalConfigProviderProps) {
  const value: GlobalConfigContext = useMemo(
    () => ({
      config: {
        microinteractionsToKeep: 1000,
        searchHistoryToKeep: 1000,
      },
    }),
    [],
  )
  return (
    <GlobalConfigContext.Provider value={value}>
      {children}
    </GlobalConfigContext.Provider>
  )
}

export function useGlobalConfig(): GlobalConfigContext {
  const context = use(GlobalConfigContext)
  if (context === undefined) {
    throw new Error(
      'useGlobalConfig must be used within a GlobalConfigProvider',
    )
  }
  return context
}
