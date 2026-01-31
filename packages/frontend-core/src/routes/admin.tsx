import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ThemeProvider } from '~/components/theme-provider'
import { AdminConfigProvider, AdminLayout } from '~/modules/admin-base'
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders'
import { AuthorizationError } from '~/errors/AuthorizationError'
import { isAdmin } from '~/modules/auth/authUtils'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    // Fetch current user session
    const sessionResponse = await fetch('/api/auth/session', {
      credentials: 'include',
    })

    let user = null
    if (sessionResponse.ok) {
      const data = await sessionResponse.json()
      user = data?.user || null
    }

    // Check if user is authenticated
    if (!user) {
      throw new AuthorizationError({
        message: 'You must be logged in to access the admin panel',
        resource: 'Admin Panel',
      })
    }

    // Fetch auth config from backend to get adminGroups
    const authConfig = await context.trpcClient.authConfig.query()
    const adminGroups = authConfig.adminGroups

    // Check if user has admin role
    if (!isAdmin(user, adminGroups)) {
      throw new AuthorizationError({
        message: 'You need administrator privileges to access this area',
        requiredRoles: adminGroups,
        resource: 'Admin Panel',
      })
    }
  },
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
