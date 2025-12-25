import React, { Suspense, useMemo, useState } from 'react'

import {  useQueryClient } from '@tanstack/react-query'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { LoadingScreen } from './LoadingScreen'
import type {QueryClient} from '@tanstack/react-query';
import type { TRPCClient } from '@trpc/client'
import type { TRPCRouter } from '@env-hopper/backend-core'
import { useQueryBootstrapConfig } from '~/api/data/useQueryBootstrapConfig'
import { ThemeProvider } from '~/components/theme-provider'
import { PluginManagerContextProvider } from '~/modules/pluginCore/PluginManagerContext'
import { BootstrapConfigProvider } from '~/modules/config/BootstrapConfigContext'
import { GlobalConfigProvider } from '~/modules/config/GlobalConfigContext'
import { makePluginInterfaceForCore } from '~/modules/pluginCore/makePluginManagerContext'

export interface MainLayoutProps {
  children: React.ReactNode
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
}

export function TopLevelProviders({ children }: MainLayoutProps) {
  // const { data, failureCount, failureReason } = useQueryBootstrapConfig()
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
      <Suspense fallback={<LoadingScreen />}>
        <BootstrapConfigProvider bootstrapConfig={{apps: {}, appsMeta: {tags: {
          descriptions: []
        }}, envs: {}, contexts: [], defaults: {envSlug: '', resourceJumpSlug: ''}}}>
          <GlobalConfigProvider>
            <PluginManagerContextProvider
              plugins={plugins}
              pluginInterfaceForCore={pluginInterfaceForCore}
            >
              {children}
                <TanStackRouterDevtools />
                <ReactQueryDevtools initialIsOpen={false} />

            </PluginManagerContextProvider>
          </GlobalConfigProvider>
        </BootstrapConfigProvider>
      </Suspense>
    </ThemeProvider>
  )
}
