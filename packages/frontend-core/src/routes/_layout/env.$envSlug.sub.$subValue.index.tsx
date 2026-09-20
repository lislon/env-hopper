import { createFileRoute } from '@tanstack/react-router'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { EnvPage } from '~/modules/resourceJump/ui/pages/EnvPage'

// A legacy link shape carrying an environment and a value but no app. The
// previous app rendered one form for every shape, differing only in which parts
// were filled in, so the parity choice here is the page `/env/$envSlug` already
// uses: the url says an environment is chosen and an app is not, and the value
// is extra state rather than a different page.
//
// The value cannot be named here. `routeLoaderMapper` takes the parameter's slug
// from the jump's own `lateResolvableParamSlugs`, so with no app there is no
// parameter to attach it to and `crossCuttingParams` comes back empty. The value
// is not lost: the loader still carries `subValue`, and the link the app mints
// when an app is finally chosen puts it back in the url — at which point the
// loader has a jump and does name it.
export const Route = createFileRoute('/_layout/env/$envSlug/sub/$subValue/')({
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
      <EnvPage />
    </ResourceJumpLayout>
  )
}
