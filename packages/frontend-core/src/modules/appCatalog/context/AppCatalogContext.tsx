import type { AppCategory, AppForCatalog } from '@env-hopper/backend-core'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createContext, use, useMemo } from 'react'
import { ApiQueryMagazineAppCatalog } from '../api/ApiQueryMagazineAppCatalog'

export interface AppCatalogContextIface {
  apps: Array<AppForCatalog>
  isLoadingApps: boolean
  categories: Array<AppCategory>
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
  const apps = data?.apps ?? []
  const categories = data?.categories ?? []

  const contextValue = useMemo<AppCatalogContextIface>(
    () => ({
      apps,
      isLoadingApps,
      categories,
    }),
    [apps, isLoadingApps, categories],
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
