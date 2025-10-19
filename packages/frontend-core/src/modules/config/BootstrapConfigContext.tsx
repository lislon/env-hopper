import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import type { BootstrapConfigData } from '@env-hopper/backend-core'

const BootstrapConfigContext = createContext<BootstrapConfigData | undefined>(
  undefined,
)

interface BootstrapConfigProviderProps {
  children: ReactNode
  bootstrapConfig: BootstrapConfigData|undefined
}

export function BootstrapConfigProvider({
  children,
  bootstrapConfig,
}: BootstrapConfigProviderProps) {
  return (
    <BootstrapConfigContext value={bootstrapConfig}>
      {children}
    </BootstrapConfigContext>
  )
}

export function useBootstrapConfig(): BootstrapConfigData {
  const context = use(BootstrapConfigContext)
  if (context === undefined) {
    throw new Error(
      'useBootstrapConfig must be used within a BootstrapConfigProvider',
    )
  }
  return context
}
