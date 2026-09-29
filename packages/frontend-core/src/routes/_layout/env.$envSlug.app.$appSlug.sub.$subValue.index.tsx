import { createFileRoute } from '@tanstack/react-router'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { AppPage } from '~/modules/resourceJump/ui/pages/AppPage'

// The legacy link shape. People have these pasted into tickets and chat, and
// the `sub` segment carries the value the page is about, so it has to keep
// working and keep prefilling.
export const Route = createFileRoute(
  '/_layout/env/$envSlug/app/$appSlug/sub/$subValue/',
)({
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
      <AppPage />
    </ResourceJumpLayout>
  )
}
