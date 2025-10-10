import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

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
  const mergedConfig: AdminConfig = {
    ...defaultConfig,
    ...config,
  }

  return (
    <AdminConfigContext.Provider value={mergedConfig}>
      {children}
    </AdminConfigContext.Provider>
  )
}

export function useAdminConfig(): AdminConfig {
  return useContext(AdminConfigContext)
}
