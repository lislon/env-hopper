import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getAppMode } from '~/lib/getAppMode'
import { appCatalogRouteLoader } from '~/modules/appCatalog/routeLoader'
import { AppCatalogLayout } from '~/modules/appCatalog/ui/layout/AppCatalogLayout'
import { AppCatalogPage } from '~/modules/appCatalog/ui/pages/AppCatalogPage'
import { routeLoader as resourceJumpRouteLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { HomePage } from '~/modules/resourceJump/ui/pages/HomePage'

const searchSchema = z.object({
  app: z.string().optional(),
  filterTag: z.string().optional(),
})

export const Route = createFileRoute('/_layout/')({
  component: RouteComponent,
  validateSearch: searchSchema,
  async loader(ctx) {
    const appMode = getAppMode()
    if (appMode === 'hopper') {
      const envHopperLoader = await resourceJumpRouteLoader({
        params: {
          envSlug: undefined,
          appSlug: undefined,
          subValue: undefined,
        },
        context: ctx.context,
      })
      return {
        appMode,
        envHopperLoader,
      }
    } else {
      const appCatalogLoader = await appCatalogRouteLoader()
      return {
        appMode,
        appCatalogLoader,
      }
    }
  },
})

function RouteComponent() {
  const { appMode, envHopperLoader } = Route.useLoaderData()
  const { queryClient, trpcClient } = Route.useRouteContext()

  // Show catalog layout by default in catalog mode
  if (appMode === 'catalog') {
    return (
      <AppCatalogLayout queryClient={queryClient} trpcClient={trpcClient}>
        <AppCatalogPage />
      </AppCatalogLayout>
    )
  } else {
    return (
      <ResourceJumpLayout
        loaderData={envHopperLoader}
        queryClient={queryClient}
        trpcClient={trpcClient}
      >
        <HomePage />
      </ResourceJumpLayout>
    )
  }
}
