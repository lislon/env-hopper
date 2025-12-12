import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Outdent } from 'lucide-react';
import { routeLoader } from '~/modules/resourceJump/routeLoader';
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout';
import { EnvPage } from '~/modules/resourceJump/ui/pages/EnvPage';

export const Route = createFileRoute('/_layout/env/$envSlug/')({
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
