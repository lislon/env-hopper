import { createFileRoute } from '@tanstack/react-router'
import { routeLoader as resourceJumpRouteLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { HomePage } from '~/modules/resourceJump/ui/pages/HomePage'

export const Route = createFileRoute('/_layout/')({
  component: RouteComponent,
  async loader(ctx) {
    const envHopperLoader = await resourceJumpRouteLoader({
      params: {
        envSlug: undefined,
        appSlug: undefined,
        subValue: undefined,
      },
      context: ctx.context,
    })
    return {
      envHopperLoader,
    }
  },
})

function RouteComponent() {
  const { envHopperLoader } = Route.useLoaderData()
  const { queryClient, trpcClient } = Route.useRouteContext()

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
