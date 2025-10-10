import type { ResourceJumpUI } from '~/modules/resourceJump/types'
import { formatResourceTitle } from '~/modules/resourceJump/utils/helpers'
import { Card, CardContent } from '~/ui/card'
import { getResourceJumpUrlPattern } from './appCatalogUtils'

export interface AppCatalogGridProps {
  rows: Array<ResourceJumpUI>
  currentEnvSlug: string | undefined
}

export function AppCatalogGrid({ rows, currentEnvSlug }: AppCatalogGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rows.map((resourceJump) => (
        <Card key={resourceJump.slug} className="py-4">
          <CardContent className="px-6">
            <div className="flex flex-col gap-2">
              <div className="font-medium">
                {formatResourceTitle(resourceJump)}
              </div>
              <div className="text-sm text-muted-foreground wrap-break-word">
                {getResourceJumpUrlPattern(resourceJump, currentEnvSlug)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
