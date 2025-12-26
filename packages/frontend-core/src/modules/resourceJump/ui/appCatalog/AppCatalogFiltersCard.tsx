import { AppWindowIcon, LayoutGrid } from 'lucide-react'
import { Button } from '~/ui/button'
import { Card, CardContent } from '~/ui/card'
import { RadioGroup, RadioGroupItem } from '~/ui/radio-group'
import { Separator } from '~/ui/separator'

export type AppCatalogScopeFilter = 'apps' | 'appsAndPages'
export type AppCatalogDisplayMode = 'card' | 'grid'

export interface AppCatalogFiltersCardProps {
  scopeFilter: AppCatalogScopeFilter
  onScopeFilterChange: (value: AppCatalogScopeFilter) => void
  displayMode: AppCatalogDisplayMode
  onDisplayModeChange: (value: AppCatalogDisplayMode) => void
}

export function AppCatalogFiltersCard({
  scopeFilter,
  onScopeFilterChange,
  displayMode,
  onDisplayModeChange,
}: AppCatalogFiltersCardProps) {
  return (
    <Card className="py-4">
      <CardContent className="px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Scope</div>
            <RadioGroup
              value={scopeFilter}
              onValueChange={(value) =>
                onScopeFilterChange(value as AppCatalogScopeFilter)
              }
              className="grid gap-2"
            >
              <label className="flex items-center gap-2">
                <RadioGroupItem value="apps" />
                <span className="text-sm">Show only Apps</span>
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="appsAndPages" />
                <span className="text-sm">Show Apps + Pages</span>
              </label>
            </RadioGroup>
          </div>

          <Separator orientation="vertical" className="hidden sm:block" />

          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Display as</div>
            <div className="inline-flex rounded-md border border-border">
              <Button
                type="button"
                variant={displayMode === 'card' ? 'secondary' : 'ghost'}
                size="lg"
                className="rounded-none border-0"
                onClick={() => onDisplayModeChange('card')}
              >
                <AppWindowIcon className="size-5" />
                Card
              </Button>
              <Separator orientation="vertical" className="h-10" />
              <Button
                type="button"
                variant={displayMode === 'grid' ? 'secondary' : 'ghost'}
                size="lg"
                className="rounded-none border-0"
                onClick={() => onDisplayModeChange('grid')}
              >
                <LayoutGrid className="size-5" />
                Grid
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
