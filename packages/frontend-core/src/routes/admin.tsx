import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ThemeProvider } from '~/components/theme-provider'
import { AdminConfigProvider, AdminLayout } from '~/modules/admin-base'
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders'

export const Route = createFileRoute('/admin')({
  component: AdminLayoutRoute,
  staticData: {
    breadcrumb: { title: 'Admin' },
  },
})

function AdminLayoutRoute() {
  const { queryClient, trpcClient } = Route.useRouteContext()

  return (
    <TopLevelProviders queryClient={queryClient} trpcClient={trpcClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AdminConfigProvider>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </AdminConfigProvider>
      </ThemeProvider>
    </TopLevelProviders>
  )
}
