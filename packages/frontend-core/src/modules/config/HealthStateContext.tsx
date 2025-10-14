import { createContext, use, useMemo, useState } from 'react'
import type { ReactNode} from 'react';

export type EnvHopperHealth = 'healthy' | 'degraded'

export interface EnvHopperHealthStateBootstrapPart {
  bootstrapApiError?: unknown;
}


export interface HealthStateContext {
  envHopperHealth: EnvHopperHealth
  setEnvHopperHealth: (health: EnvHopperHealth) => void
}

const HealthStateContext = createContext<HealthStateContext | undefined>(
  undefined,
)


interface HealthStateProviderProps {
  children: ReactNode
  bootstrapHealth: EnvHopperHealthStateBootstrapPart
}

export function HealthStateProvider({ childrenbootstrapHealth }: HealthStateProviderProps) {
  const [envHopperHealth, setEnvHopperHealth] =
    useState<EnvHopperHealth>('healthy')

  const value = useMemo(
    () => ({
      envHopperHealth,
      setEnvHopperHealth,
    }),
    [envHopperHealth, setEnvHopperHealth],
  )

  return <HealthStateContext value={value}>{children}</HealthStateContext>
}

export function useEnvHopperHealth(): HealthStateContext {
  const context = use(HealthStateContext)
  if (context === undefined) {
    throw new Error('useGlobalConfig must be used within a useEnvHopperHealth')
  }
  return context
}
