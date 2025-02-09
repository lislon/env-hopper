import { createFileRoute } from '@tanstack/react-router'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/ResouceJumpLayout'

export const Route = createFileRoute('/_layout/env/$envSlug/app/$appSlug')({
  component: RouteComponent,
  loader(ctx) {
    return routeLoader(ctx)
  },
})

function RouteComponent() {
  const urlParams = Route.useLoaderData()
  return <ResourceJumpLayout loaderData={urlParams} />
}
