import React, { Suspense, useMemo, useState } from 'react'

import { LoadingScreen } from './LoadingScreen'
import { useQueryBootstrapConfig } from '~/api/data/useQueryBootstrapConfig'
import { ThemeProvider } from '~/components/theme-provider'
import { PluginManagerContextProvider } from '~/modules/pluginCore/PluginManagerContext'
import { PageUrlPluginContextProvider } from '~/plugins/builtin/pageUrl/PageUrlPluginContext'
import { PageUrlJumpPlugin } from '~/plugins/builtin/pageUrl/pageUrlJumpPlugin'
import { BootstrapConfigProvider } from '~/modules/config/BootstrapConfigContext'
import { GlobalConfigProvider } from '~/modules/config/GlobalConfigContext'
import { makePluginInterfaceForCore } from '~/modules/pluginCore/makePluginManagerContext'
import { isDexieError } from '~/util/error-utils'
import { DefaultErrorComponent } from '../components/error/DefaultErrorComponent'

export interface MainLayoutProps {
  children: React.ReactNode
}

export function TopLevelProviders({ children }: MainLayoutProps) {
  const { data, isPending, error, isStale, isSuccess, failureCount, failureReason } = useQueryBootstrapConfig()
  const [plugins] = useState(() => [new PageUrlJumpPlugin()])

  const pluginInterfaceForCore = useMemo(() => {
    return makePluginInterfaceForCore(plugins)
  }, [plugins])

  if (!data) {
    return <LoadingScreen label='configuration' failureCount={failureCount} failureReason={failureReason?.message} />
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Suspense fallback={<LoadingScreen />}>
        <BootstrapConfigProvider bootstrapConfig={data}>
          <GlobalConfigProvider>
            <PluginManagerContextProvider
              plugins={plugins}
              pluginInterfaceForCore={pluginInterfaceForCore}
            >
              <PageUrlPluginContextProvider>
                {children}
              </PageUrlPluginContextProvider>
            </PluginManagerContextProvider>
          </GlobalConfigProvider>
        </BootstrapConfigProvider>
      </Suspense>
    </ThemeProvider>
  )
}
