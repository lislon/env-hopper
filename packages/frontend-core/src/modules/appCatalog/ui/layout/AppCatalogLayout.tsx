import type { TRPCRouter } from '@env-hopper/backend-core'
import type { QueryClient } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import { HomeIcon } from 'lucide-react'
import { AppCatalogProvider } from '~/modules/appCatalog/context/AppCatalogContext'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '~/ui/breadcrumb'
import { MainLayout } from '~/ui/layout/MainLayout'
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders'
import { Link } from '~/ui/link'

export interface AppCatalogLayoutProps {
  children: React.ReactNode
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
}

export function AppCatalogLayout({
  children,
  queryClient,
  trpcClient,
}: AppCatalogLayoutProps) {
  return (
    <TopLevelProviders queryClient={queryClient} trpcClient={trpcClient}>
      <AppCatalogProvider>
        <MainLayout>
          <Breadcrumb className="pb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={'/'} className="flex items-center gap-1">
                    <HomeIcon className="size-4" />
                    <span className="sr-only">Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/catalog/apps">App Catalog</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-1 w-full justify-center">{children}</div>
        </MainLayout>
      </AppCatalogProvider>
    </TopLevelProviders>
  )
}
