import { createFileRoute } from '@tanstack/react-router'

import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'
import { HomePage } from '~/modules/resourceJump/ui/pages/HomePage'


export const Route = createFileRoute('/_layout/')({
  component: RouteComponent,
  loader(ctx) {
    return routeLoader(ctx)
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
      <HomePage />
    </ResourceJumpLayout>
  )
}
