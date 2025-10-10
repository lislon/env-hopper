import type { TRPCRouter } from '@env-hopper/backend-core'
import type { QueryClient } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import { Children, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { ShortcutButton } from '~/components/ui/shortcut-button'
import { EnvironmentProvider } from '~/modules/environment/EnvironmentContext'
import { ResourceJumpProvider } from '~/modules/resourceJump/ResourceJumpContext'
import { QuickSearch } from '~/modules/resourceJump/ui/cmdk/QuickSearch'
import {
  QuickSearchProvider,
  useQuickSearchContext,
} from '~/modules/resourceJump/ui/cmdk/QuickSearchContext'
import { JumpMainButton } from '~/modules/resourceJump/ui/JumpMainButton'
import { LateResolvableParamsInput } from '~/modules/resourceJump/ui/LateResolvableParamsInput'
import { CenterColumn } from '~/modules/resourceJump/ui/layout/CenterColumn'
import { LeftColumn } from '~/modules/resourceJump/ui/layout/LeftColumn'
import { RightColumn } from '~/modules/resourceJump/ui/layout/RightColumn'
import ContextDebug from '~/ui/components/contextDebug'
import { AppQuickJumpBar } from '~/ui/components/quickBar/AppQuickJumpBar'
import { ResourceJumpGroupViewer } from '~/ui/components/quickBar/ResourceJumpGroupViewer'
import { MainLayout } from '~/ui/layout/MainLayout'
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders'
import type { ResourceJumpLoaderReturn } from '../../types'
import { EhJumpResourceSelector } from '../EhJumpResourceSelector'
import { VersionWidget } from '../widgets/VersionWidget'

export interface ResourceJumpLayoutProps {
  children: React.ReactNode
  loaderData: ResourceJumpLoaderReturn
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
}

function CommandPaletteTrigger() {
  const { openQuickSearch } = useQuickSearchContext();


  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault()
    openQuickSearch({ searchMode: 'anything' })
  })

  return (
    <>
      <ShortcutButton
        text="App / Env / JIRA / Case Id / Anything..."
        onClick={() => openQuickSearch({ searchMode: 'anything' })}
      />
      <QuickSearch />
    </>
  )
}

export function ResourceJumpLayout({
  children,
  loaderData,
  queryClient,
  trpcClient,
}: ResourceJumpLayoutProps) {
  return (
    <TopLevelProviders queryClient={queryClient} trpcClient={trpcClient}>
      <EnvironmentProvider initialEnvSlug={loaderData.envSlug}>
        <ResourceJumpProvider resourceJumpLoader={loaderData}>
          <QuickSearchProvider>
            <MainLayout headerMiddle={<CommandPaletteTrigger />}>
              <div className="flex gap-32 flex-row">
                {/* Left Column - fit content: Environment Section */}
                <div className="flex flex-col gap-4 w-fit flex-shrink-0">
                  <LeftColumn />
                </div>
                <div className="flex flex-col gap-4 flex-1">
                <CenterColumn>
                  {children}
                  </CenterColumn>
                </div>
                <div className="flex flex-col gap-4 w-fit">
                  <RightColumn />
                </div>

                {/* Center Column - max width: Application Section with Tabs */}
                {/* <ApplicationSectionWithTabs /> */}

                {/* Right Column - fit content: Credentials Section */}
                {/* <div className="flex flex-col gap-4 w-fit flex-shrink-0 items-end">
                <CredentialsWidget />
              </div> */}
              </div>
              <ContextDebug />
              {/* <QuickJumpBar /> */}
            </MainLayout>
          </QuickSearchProvider>
        </ResourceJumpProvider>
      </EnvironmentProvider>
    </TopLevelProviders>
  )
}
