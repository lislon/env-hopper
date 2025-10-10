import { createFileRoute } from '@tanstack/react-router'

import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/ResourceJumpLayout'

export const Route = createFileRoute('/_layout/')({
  component: RouteComponent,
  loader(ctx) {
    return routeLoader(ctx)
  },
})

function RouteComponent() {
  const urlParams = Route.useLoaderData()
  return <ResourceJumpLayout loaderData={urlParams} />
}
