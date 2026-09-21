import { createFileRoute } from '@tanstack/react-router'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { AppPage } from '~/modules/resourceJump/ui/pages/AppPage'

// The same env-less shape carrying a `sub` value. The loader is the shared one,
// so the value reaches the late-resolvable parameter by the same path as the
// env-ful route — there is nothing environment-specific about seeding it.
export const Route = createFileRoute('/_layout/app/$appSlug/sub/$subValue/')({
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
