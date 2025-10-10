import { createFileRoute } from '@tanstack/react-router'
import { LoginModal } from '~/modules/auth/ui/LoginModal'
import { MainLayout } from '~/ui/layout/MainLayout'
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders'

export const Route = createFileRoute('/_layout/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const { queryClient, trpcClient } = Route.useRouteContext()

  return (
    <TopLevelProviders queryClient={queryClient} trpcClient={trpcClient}>
      <MainLayout>
        <LoginModal />
      </MainLayout>
    </TopLevelProviders>
  )
}
