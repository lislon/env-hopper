import { EhJumpResourceSelector } from './EhJumpResourceSelector'
import type { ResourceJumpLoaderReturn } from '../types'
import { Separator } from '~/components/ui/separator'
import { EnvironmentProvider } from '~/modules/environment/EnvironmentContext'
import { EhEnvSelector } from '~/modules/environment/ui/EhEnvSelector'
import { ResourceJumpProvider } from '~/modules/resourceJump/ResourceJumpContext'
import { JumpMainButton } from '~/modules/resourceJump/ui/JumpMainButton'
import { EnvQuickJumpBar } from '~/ui/components/quickBar/EnvQuickJumpBar'
import { MainLayout } from '~/ui/layout/MainLayout'
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders'

export interface ResourceJumpLayoutProps {
  loaderData: ResourceJumpLoaderReturn
}

export function ResourceJumpLayout({
  loaderData: loaderData,
}: ResourceJumpLayoutProps) {
  return (
    <TopLevelProviders>
      <EnvironmentProvider initialEnvSlug={loaderData.envSlug}>
        <ResourceJumpProvider resourceJumpLoader={loaderData}>
          <MainLayout>
            <div className="flex gap-4 flex-row">
              <EhEnvSelector className="flex flex-col items-start Gap-2 w-4/12" />
              <div>
                <Separator
                  orientation="vertical"
                  className="bg-secondary-foreground/10"
                />
              </div>
              <EhJumpResourceSelector className="flex flex-col items-start gap-2 w-8/12" />
            </div>

            <div>
              <div className="flex flex-col items-start gap-2 w-4/12">
                <EnvQuickJumpBar className="w-full" />
              </div>
              <div>
                <Separator
                  orientation="vertical"
                  className="bg-secondary-foreground/10"
                />
              </div>
            </div>
            <div>
              <JumpMainButton className="px-8 py-4 w-full max-w-[1000px] justify-self-center mt-4" />
            </div>
            {/* <QuickJumpBar /> */}

            {/* <AppSelectorDemo /> */}

            {/* AppDropdownContent for testing - make it larger
            <div className="border border-border rounded-lg p-6 bg-card">
              <h2 className="text-lg font-semibold mb-4">AppDropdownContent Preview</h2>
              <div className="w-full max-w-2xl">
                <AppDropdownContent
                  searchValue=""
                  onSelect={(value) => console.log("Selected:", value)}
                  getItemProps={(options) => options}
                  highlightedIndex={-1}
                  isUntouched={true}
                />
              </div>
            </div> */}

            {/* <WidgetGrid widgets={widgets} onAddWidget={handleAddWidget} /> */}
          </MainLayout>
        </ResourceJumpProvider>
      </EnvironmentProvider>
    </TopLevelProviders>
  )
}
