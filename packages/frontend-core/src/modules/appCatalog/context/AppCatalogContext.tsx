import type {
  AppApprovalMethod,
  AppForCatalog,
  GroupingTagDefinition,
} from '@env-hopper/backend-core'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createContext, use, useMemo } from 'react'
import { ApiQueryMagazineAppCatalog } from '~/modules/appCatalog'

export interface AppCatalogContextIface {
  apps: Array<AppForCatalog>
  isLoadingApps: boolean
  tagsDefinitions: Array<GroupingTagDefinition>
  approvalMethods: Array<AppApprovalMethod>
}

export const AppCatalogContext = createContext<
  AppCatalogContextIface | undefined
>(undefined)

interface AppCatalogProviderProps {
  children: ReactNode
}

export function AppCatalogProvider({ children }: AppCatalogProviderProps) {
  const { data, isLoading: isLoadingApps } = useQuery(
    ApiQueryMagazineAppCatalog.getAppCatalog(),
  )

  const contextValue = useMemo<AppCatalogContextIface>(
    () => ({
      apps: data?.apps ?? [],
      isLoadingApps,
      tagsDefinitions: data?.tagsDefinitions ?? [],
      approvalMethods: data?.approvalMethods ?? [],
    }),
    [data?.approvalMethods, data?.apps, data?.tagsDefinitions, isLoadingApps],
  )

  return <AppCatalogContext value={contextValue}>{children}</AppCatalogContext>
}

export function useAppCatalogContext(): AppCatalogContextIface {
  const context = use(AppCatalogContext)
  if (!context) {
    throw new Error(
      'useAppCatalogContext must be used within AppCatalogProvider',
    )
  }
  return context
}
