import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import type { BootstrapPayload } from '@env-hopper/backend-core'

const BootstrapConfigContext = createContext<BootstrapPayload | undefined>(
  undefined,
)

/**
 * What consumers see before the config has loaded. Keeping the context a valid
 * object means `undefined` still means "no provider", so the hook below can
 * keep telling those two cases apart.
 */
const EMPTY_BOOTSTRAP_CONFIG: BootstrapPayload = {
  apps: {},
  envs: {},
  envDefaults: {},
  appsMeta: { tags: { descriptions: [] } },
  contexts: [],
  defaults: { envSlug: '', resourceJumpSlug: '' },
}

interface BootstrapConfigProviderProps {
  children: ReactNode
  bootstrapConfig: BootstrapPayload | undefined
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

export function useBootstrapConfig(): BootstrapPayload {
  const context = use(BootstrapConfigContext)
  if (context === undefined) {
    throw new Error(
      'useBootstrapConfig must be used within a BootstrapConfigProvider',
    )
  }
  return context
}
