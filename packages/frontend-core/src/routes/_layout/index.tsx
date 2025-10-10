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
})

export type RootLayoutLoaderReturn =
  | {
      envHopperLoader: {
        envSlug: string | undefined
        resourceSlug: string | undefined
        crossCuttingParams: Array<{ slug: string; stringValue: string }>
      }
    }
  | { appCatalogLoader: Record<string, never> }

export const Route = createFileRoute('/_layout/')({
  component: RouteComponent,
  validateSearch: searchSchema,
  loader(ctx) {
    const appMode = getAppMode()
    if (appMode === 'hopper') {
      return resourceJumpRouteLoader({
        params: {
          envSlug: undefined,
          appSlug: undefined,
          subValue: undefined,
        },
        context: ctx.context,
      }).then(
        (loaderData) =>
          ({
            envHopperLoader: loaderData,
          }) as RootLayoutLoaderReturn,
      )
    } else {
      return appCatalogRouteLoader().then(
        (loaderData) =>
          ({
            appCatalogLoader: loaderData,
          }) as RootLayoutLoaderReturn,
      )
    }
  },
})

function RouteComponent() {
  const appMode = getAppMode()
  const loaderData = Route.useLoaderData()
  const { queryClient, trpcClient } = Route.useRouteContext()

  // Show catalog layout by default in catalog mode
  if (appMode === 'catalog' && 'appCatalogLoader' in loaderData) {
    return (
      <AppCatalogLayout queryClient={queryClient} trpcClient={trpcClient}>
        <AppCatalogPage />
      </AppCatalogLayout>
    )
  }

  // Show hopper layout in hopper mode
  if ('envHopperLoader' in loaderData) {
    return (
      <ResourceJumpLayout
        loaderData={loaderData.envHopperLoader}
        queryClient={queryClient}
        trpcClient={trpcClient}
      >
        <HomePage />
      </ResourceJumpLayout>
    )
  }

  return null
}
