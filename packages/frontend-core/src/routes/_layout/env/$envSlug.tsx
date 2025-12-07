import { createFileRoute } from '@tanstack/react-router'
import { Outlet } from 'react-router-dom'
import { routeLoader } from '~/modules/resourceJump/routeLoader'
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout'

export const Route = createFileRoute('/_layout/env/$envSlug')({
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
      z
      <Outlet />
      k
      {/* <EnvPage /> */}
    </ResourceJumpLayout>
  )
}
