import React, { Suspense, useMemo, useState } from 'react'

import type { TRPCRouter } from '@env-hopper/backend-core'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { TRPCClient } from '@trpc/client'
import { useQueryBootstrapConfig } from '~/api/data/useQueryBootstrapConfig'
import { ThemeProvider } from '~/components/theme-provider'
import { AuthProvider } from '~/modules/auth'
import { AuthModalProvider } from '~/modules/auth/AuthModalContext'
import { LoginModal } from '~/modules/auth/ui/LoginModal'
import { BootstrapConfigProvider } from '~/modules/config/BootstrapConfigContext'
import { GlobalConfigProvider } from '~/modules/config/GlobalConfigContext'
import { makePluginInterfaceForCore } from '~/modules/pluginCore/makePluginManagerContext'
import { PluginManagerContextProvider } from '~/modules/pluginCore/PluginManagerContext'
import { LoadingScreen } from './LoadingScreen'

export interface MainLayoutProps {
  children: React.ReactNode
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
}

export function TopLevelProviders({ children }: MainLayoutProps) {
  // Not gated on: the config only feeds optional presentation (meta-driven
  // templates), and the jump path resolves without it. Blocking every route on
  // this query would turn a bootstrap failure into a permanent loading screen.
  const { data: bootstrapConfig } = useQueryBootstrapConfig()
  const [plugins] = useState(() => [
    // Future plugins can be added here
  ])

  const pluginInterfaceForCore = useMemo(() => {
    return makePluginInterfaceForCore(plugins)
  }, [plugins])

  // if (!data) {
  //   return <LoadingScreen label='configuration' failureCount={failureCount} failureReason={failureReason?.message} />
  // }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthModalProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <BootstrapConfigProvider bootstrapConfig={bootstrapConfig}>
              <GlobalConfigProvider>
                <PluginManagerContextProvider
                  plugins={plugins}
                  pluginInterfaceForCore={pluginInterfaceForCore}
                >
                  {children}
                  <LoginModal />
                  <TanStackRouterDevtools />
                  <ReactQueryDevtools initialIsOpen={false} />
                </PluginManagerContextProvider>
              </GlobalConfigProvider>
            </BootstrapConfigProvider>
          </Suspense>
        </AuthProvider>
      </AuthModalProvider>
    </ThemeProvider>
  )
}
