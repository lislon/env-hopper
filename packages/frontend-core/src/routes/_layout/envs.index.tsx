import { createFileRoute } from '@tanstack/react-router'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { EnvCatalogPage } from '~/modules/resourceJump/ui/pages/EnvCatalog'

export const Route = createFileRoute('/_layout/envs/')({
  component: RouteComponent,
  async loader(ctx) {
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
      <EnvCatalogPage />
    </ResourceJumpLayout>
  )
}
