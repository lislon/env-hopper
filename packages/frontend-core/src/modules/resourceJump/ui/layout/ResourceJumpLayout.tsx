import type { TRPCRouter } from '@env-hopper/backend-core';
import type { QueryClient } from '@tanstack/react-query';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { TRPCClient } from '@trpc/client';
import { CrossCuttingParamsProvider } from '~/modules/crossCuttingParams/CrossCuttingParamsContext';
import { EnvironmentProvider } from '~/modules/environment/context/EnvironmentContext';
import { ResourceJumpProvider } from '~/modules/resourceJump/context/ResourceJumpContext';
import { CommandPalette } from '~/modules/resourceJump/ui/cmdk/CommandPalette';
import {
  QuickSearchProvider
} from '~/modules/resourceJump/ui/cmdk/QuickSearchContext';
import { CenterColumn } from '~/modules/resourceJump/ui/layout/CenterColumn';
import { LeftColumn } from '~/modules/resourceJump/ui/layout/LeftColumn';
import { RightColumn } from '~/modules/resourceJump/ui/layout/RightColumn';
import ContextDebug from '~/ui/components/contextDebug';
import { MainLayout } from '~/ui/layout/MainLayout';
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders';
import type { ResourceJumpLoaderReturn } from '../../types';

export interface ResourceJumpLayoutProps {
  children: React.ReactNode
  loaderData: ResourceJumpLoaderReturn
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
}


export function ResourceJumpLayout({
  children,
  loaderData,
  queryClient,
  trpcClient,
}: ResourceJumpLayoutProps) {
  console.log('layout', loaderData);
  
  return (
    <TopLevelProviders queryClient={queryClient} trpcClient={trpcClient}>
      <EnvironmentProvider initialEnvSlug={loaderData.envSlug}>
        <CrossCuttingParamsProvider initialCrossCuttingParams={loaderData.crossCuttingParams}>
          <ResourceJumpProvider resourceJumpLoader={loaderData}>
            <QuickSearchProvider>
              <MainLayout headerMiddle={<CommandPalette label='App / Env / JIRA / Case Id / Anything...' cmd='k' />}>
                <div className="flex gap-32 flex-row">
                  {/* Left Column - fit content: Environment Section */}
                  <div className="flex flex-col gap-4 w-fit flex-shrink-0">
                    <LeftColumn />
                  </div>
                  <div className="flex flex-col gap-4 flex-1">
                    <CenterColumn>{children}</CenterColumn>
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
                <TanStackRouterDevtools />
                {/* <QuickJumpBar /> */}
              </MainLayout>
            </QuickSearchProvider>
          </ResourceJumpProvider>
        </CrossCuttingParamsProvider>
      </EnvironmentProvider>
    </TopLevelProviders>
  )
}
