import type { ReactNode } from 'react'
import { createContext, use, useMemo } from 'react'

import type { AdminConfig } from '../types/adminTypes'

const defaultConfig: AdminConfig = {
  chatApiUrl: '/api/admin/chat',
}

const AdminConfigContext = createContext<AdminConfig>(defaultConfig)

export interface AdminConfigProviderProps {
  config?: Partial<AdminConfig>
  children: ReactNode
}

export function AdminConfigProvider({
  config,
  children,
}: AdminConfigProviderProps) {
  const mergedConfig: AdminConfig = useMemo(
    () => ({
      ...defaultConfig,
      ...config,
    }),
    [config],
  )

  return (
    <AdminConfigContext value={mergedConfig}>{children}</AdminConfigContext>
  )
}

export function useAdminConfig(): AdminConfig {
  return use(AdminConfigContext)
}
