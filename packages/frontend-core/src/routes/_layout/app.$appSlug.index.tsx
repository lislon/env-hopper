import { createFileRoute } from '@tanstack/react-router'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { AppPage } from '~/modules/resourceJump/ui/pages/AppPage'

// A legacy link shape, and a legal one: naming an app without naming an
// environment. It renders the app page with the environment picker left empty,
// which is what the previous app did whenever it had no environment to offer —
// it never redirected away from this url. Guessing an environment here and
// rewriting the url would silently retarget a shared or bookmarked link, so the
// environment stays the user's choice.
export const Route = createFileRoute('/_layout/app/$appSlug/')({
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
