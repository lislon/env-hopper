import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import type { BootstrapConfigData } from '@env-hopper/backend-core'

const BootstrapConfigContext = createContext<BootstrapConfigData | undefined>(
  undefined,
)

/**
 * What consumers see before the config has loaded. Keeping the context a valid
 * object means `undefined` still means "no provider", so the hook below can
 * keep telling those two cases apart.
 */
const EMPTY_BOOTSTRAP_CONFIG: BootstrapConfigData = {
  apps: {},
  envs: {},
  appsMeta: { tags: { descriptions: [] } },
  contexts: [],
  defaults: { envSlug: '', resourceJumpSlug: '' },
}

interface BootstrapConfigProviderProps {
  children: ReactNode
  bootstrapConfig: BootstrapConfigData | undefined
}

export function BootstrapConfigProvider({
  children,
  bootstrapConfig,
}: BootstrapConfigProviderProps) {
  return (
    <BootstrapConfigContext value={bootstrapConfig ?? EMPTY_BOOTSTRAP_CONFIG}>
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
