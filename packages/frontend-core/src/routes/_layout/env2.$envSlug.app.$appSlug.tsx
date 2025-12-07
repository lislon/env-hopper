import { createFileRoute } from '@tanstack/react-router';
import { routeLoader } from '~/modules/resourceJump/routeLoader';
import { ResourceJumpLayout } from '~/modules/resourceJump/ui/layout/ResourceJumpLayout';
import { AppPage } from '~/modules/resourceJump/ui/pages/AppPage';

export const Route = createFileRoute('/_layout/env2/$envSlug/app/$appSlug')({
  component: RouteComponent,
  async loader(ctx) {
    const newLocal = await routeLoader(ctx)
    console.log('kotik');
    return newLocal
  },
})

function RouteComponent() {
  console.log('lisa');
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
