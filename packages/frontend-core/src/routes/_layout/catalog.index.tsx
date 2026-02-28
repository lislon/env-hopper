import { createFileRoute } from '@tanstack/react-router'
import { catalogRouteLoader } from '~/modules/appCatalog/catalogRouteLoader'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { AppCatalogPage } from '~/modules/appCatalog/ui/pages/AppCatalogPage'

export const Route = createFileRoute('/_layout/catalog/')({
  component: RouteComponent,
  async loader(ctx) {
    // Load both resourceJumps and appCatalog data
    await Promise.all([routeLoader(ctx), catalogRouteLoader(ctx)])
    return await routeLoader(ctx)
  },
})

function RouteComponent() {
  const urlParams = Route.useLoaderData()
  const { queryClient, trpcClient } = Route.useRouteContext()

  return (
    <ResourceJumpLayout
      loaderData={urlParams}
      queryClient={queryClient}
      trpcClient={trpcClient}
    >
      <AppCatalogPage />
    </ResourceJumpLayout>
  )
}
