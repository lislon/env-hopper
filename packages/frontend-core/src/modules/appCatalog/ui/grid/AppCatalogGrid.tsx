import { AppWindow, ExternalLink } from 'lucide-react'
import React from 'react'

import type { AppForCatalog } from '@env-hopper/backend-core'

import { cn } from '~/lib/utils'
import { Badge } from '~/ui/badge'
import { Card, CardContent } from '~/ui/card'

export interface AppCatalogGridProps {
  apps: Array<AppForCatalog>
  onAppClick?: (app: AppForCatalog) => void
}

function getIconUrl(iconName: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'
  return `${baseUrl}/api/icons/by-name/${iconName}`
}

function AppIcon({ app, className }: { app: AppForCatalog; className?: string }) {
  const [imageError, setImageError] = React.useState(false)

  // Use iconName from backend if available
  if (app.iconName && !imageError) {
    return (
      <div className={cn('size-12 shrink-0', className)}>
        <img
          src={getIconUrl(app.iconName)}
          alt={`${app.displayName} icon`}
          className="size-12 rounded-lg object-contain"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  // Fallback icon
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-primary/10 text-primary size-12 shrink-0',
        className,
      )}
    >
      <AppWindow className="size-6" />
    </div>
  )
}

function AppScreenshot({ app }: { app: AppForCatalog }) {
  const [imageError, setImageError] = React.useState(false)
  const [isLoadingImage, setIsLoadingImage] = React.useState(true)

  // Check if app has screenshots
  const screenshotId = app.screenshotIds?.[0]
  if (!screenshotId) {
    return (
      <div className="w-full bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center min-h-64">
        <div className="w-full h-64 bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
          No screenshot available
        </div>
      </div>
    )
  }

  const screenshotImageUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}/api/screenshots/${screenshotId}?size=512`

  return (
    <div className="w-full bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center min-h-64">
      {!imageError ? (
        <img
          src={screenshotImageUrl}
          alt={`${app.displayName} screenshot`}
          className="w-full h-64 object-contain"
          onError={() => {
            setImageError(true)
            setIsLoadingImage(false)
          }}
          onLoad={() => setIsLoadingImage(false)}
        />
      ) : null}
      {(imageError || isLoadingImage) && (
        <div className="w-full h-64 bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
          {isLoadingImage ? 'Loading screenshot...' : 'No screenshot available'}
        </div>
      )}
    </div>
  )
}

function AppCard({ app, onClick }: { app: AppForCatalog; onClick?: () => void }) {
  const hasUrl = app.appUrl

  return (
    <Card
      className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 flex flex-col h-full cursor-pointer hover:border-primary/50"
      onClick={onClick}
    >
      {/* Screenshot Section */}
      <div className="w-full shrink-0">
        <AppScreenshot app={app} />
      </div>

      <CardContent className="p-6 flex flex-col gap-3 flex-1">
        {/* Icon and Title Row */}
        <div className="flex items-start gap-3">
          <AppIcon app={app} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base leading-tight mb-1">
              {app.displayName || 'Unnamed App'}
            </div>
            {hasUrl && (
              <a
                href={app.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Visit app
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {app.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {app.description}
          </p>
        )}

        {/* Tags/Teams */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {app.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {(app.tags?.length || 0) > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(app.tags?.length || 0) - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AppCatalogGrid({ apps, onAppClick }: AppCatalogGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} onClick={() => onAppClick?.(app)} />
      ))}
    </div>
  )
}
