import { createContext, use, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ResouceJumpItemParent } from '~/modules/resourceJump/types'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import { usePluginManagerForPlugin } from '~/modules/pluginCore/PluginManagerContext'

export interface PageUrlPluginContextIface {}

const PageUrlPluginContext = createContext<
  PageUrlPluginContextIface | undefined
>(undefined)

interface PageUrlPluginProviderProps {
  children: ReactNode
}

export function PageUrlPluginContextProvider({
  children,
}: PageUrlPluginProviderProps) {
  const { setResouceJumps } = usePluginManagerForPlugin('pageUrl')
  const { apps } = useBootstrapConfig()

  useEffect(() => {
    const jumpLinks = Object.values(apps).flatMap((app) => {
      const parent: ResouceJumpItemParent = {
        type: 'pageUrlParent',
        displayName: app.displayName,
        hasSingleChild: app.ui?.pages.length === 1,
      }
      return (
        app.ui?.pages.map((page) => {
          return {
            type: 'pageUrl',
            displayName: page.displayName || page.slug,
            parent: parent,
            slug: `${app.slug}-${page.slug}`,
          }
        }) || []
      )
    })
    setResouceJumps(jumpLinks)
  }, [apps, setResouceJumps])

  const value: PageUrlPluginContextIface = useMemo(() => ({}), [])

  return <PageUrlPluginContext value={value}>{children}</PageUrlPluginContext>
}

export function usePageUrlPlugin(): PageUrlPluginContextIface {
  const context = use(PageUrlPluginContext)
  if (context === undefined) {
    throw new Error('useEhUserContext must be used within an EhUserProvider')
  }
  return context
}
