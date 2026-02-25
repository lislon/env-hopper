import { AppWindow, ExternalLink, X } from 'lucide-react'
import React from 'react'

import type {
  AppForCatalog,
  GroupingTagDefinition,
} from '@env-hopper/backend-core'

import { cn } from '~/lib/utils'
import { Badge } from '~/ui/badge'
import { Button } from '~/ui/button'
import { ScreenshotGallery } from '../components/ScreenshotGallery'

export interface AppCatalogGridProps {
  apps: Array<AppForCatalog>
  selectedAppSlug?: string
  groupingDefinition?: GroupingTagDefinition
  onAppClick?: (app: AppForCatalog) => void
  onCloseDetails?: () => void
}

function getIconUrl(iconName: string): string {
  return `/api/icons/${iconName}`
}

function AppIcon({
  app,
  className,
}: {
  app: AppForCatalog
  className?: string
}) {
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

  const screenshotImageUrl = `/api/screenshots/${screenshotId}?size=512`

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

function AppDetails({ app }: { app: AppForCatalog }) {
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false)
  const [galleryInitialIndex, setGalleryInitialIndex] = React.useState(0)

  const handleScreenshotClick = (index: number) => {
    setGalleryInitialIndex(index)
    setIsGalleryOpen(true)
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto p-6">
        {/* Icon and Title */}
        <div className="flex items-center gap-4 border-b pb-6">
          <AppIcon app={app} className="size-16" />
          <div>
            <h2 className="text-2xl font-semibold">{app.displayName}</h2>
            {app.appUrl && (
              <a
                href={app.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                {app.appUrl.replaceAll(/https?:\/\//g, '')}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {app.description && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">Description</h3>
            <p className="text-sm text-muted-foreground">{app.description}</p>
          </div>
        )}

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {app.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        {app.teams && app.teams.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">Teams</h3>
            <div className="flex flex-wrap gap-2">
              {app.teams.map((team) => (
                <Badge key={team} variant="outline" className="text-xs">
                  {team}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Screenshots - Clickable preview */}
        {app.screenshotIds && app.screenshotIds.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">
              Screenshots ({app.screenshotIds.length})
            </h3>
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleScreenshotClick(0)}
            >
              <AppScreenshot app={app} />
              {app.screenshotIds.length > 1 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Click to view all {app.screenshotIds.length} screenshots
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Screenshot Gallery Dialog */}
      <ScreenshotGallery
        app={app}
        screenshotIds={app.screenshotIds || []}
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        initialIndex={galleryInitialIndex}
        title={`${app.displayName} - Screenshots`}
      />
    </>
  )
}

interface GroupedApps {
  groupName: string
  apps: Array<AppForCatalog>
}

function groupApps(
  apps: Array<AppForCatalog>,
  groupingDef?: GroupingTagDefinition,
): Array<GroupedApps> {
  if (!groupingDef) {
    const sortedApps = [...apps].sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    )
    return [{ groupName: 'All Apps', apps: sortedApps }]
  }

  const grouped = new Map<string, Array<AppForCatalog>>()
  const ungrouped: Array<AppForCatalog> = []

  for (const app of apps) {
    const matchingTag = app.tags?.find((tag) =>
      tag.startsWith(`${groupingDef.prefix}:`),
    )

    if (matchingTag) {
      const value = matchingTag.split(':')[1]
      if (value) {
        const tagValue = groupingDef.values.find((v) => v.value === value)
        const displayName = tagValue?.displayName || value

        if (!grouped.has(displayName)) {
          grouped.set(displayName, [])
        }
        grouped.get(displayName)!.push(app)
      } else {
        ungrouped.push(app)
      }
    } else {
      ungrouped.push(app)
    }
  }

  const result: Array<GroupedApps> = []
  for (const [groupName, appsInGroup] of grouped) {
    // Sort apps alphabetically within each group
    const sortedGroupApps = appsInGroup.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    )
    result.push({ groupName, apps: sortedGroupApps })
  }

  if (ungrouped.length > 0) {
    // Sort ungrouped apps alphabetically
    const sortedUngrouped = ungrouped.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    )
    result.push({ groupName: 'Other', apps: sortedUngrouped })
  }

  return result
}

export function AppCatalogGrid({
  apps,
  selectedAppSlug,
  groupingDefinition,
  onAppClick,
  onCloseDetails,
}: AppCatalogGridProps) {
  const tableRef = React.useRef<HTMLTableElement>(null)
  const rowRefs = React.useRef<Map<string, HTMLTableRowElement>>(new Map())
  const lastClickedRef = React.useRef<string | null>(null)

  const selectedApp = selectedAppSlug
    ? apps.find((a) => a.slug === selectedAppSlug)
    : null

  const groupedApps = groupApps(apps, groupingDefinition)

  // Auto-scroll when app is selected from URL (not from click)
  React.useEffect(() => {
    if (selectedAppSlug && selectedAppSlug !== lastClickedRef.current) {
      const rowElement = rowRefs.current.get(selectedAppSlug)
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedAppSlug])

  const handleAppClick = (app: AppForCatalog) => {
    lastClickedRef.current = app.slug
    onAppClick?.(app)
  }

  return (
    <div
      className={cn(
        'grid gap-4 w-full',
        selectedApp ? 'grid-cols-[1fr_400px]' : 'grid-cols-1',
      )}
    >
      {/* Left Column - Table */}
      <div className="overflow-y-auto">
        <table className="w-full table-fixed" ref={tableRef}>
          <thead className="sticky top-0 border-b bg-background z-10">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-sm">
                Application
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedApps.map((group) => (
              <React.Fragment key={group.groupName}>
                {/* Group Header */}
                <tr className="bg-muted/50">
                  <td
                    colSpan={2}
                    className="px-4 py-6 sticky top-[49px] bg-muted/90 backdrop-blur z-10"
                  >
                    <div className="flex items-center justify-center">
                      <span className="font-bold text-lg tracking-widest uppercase leading-loose text-muted-foreground">
                        {group.groupName}
                      </span>
                    </div>
                  </td>
                </tr>
                {/* Group Apps */}
                {group.apps.map((app) => (
                  <tr
                    key={app.id}
                    ref={(el) => {
                      if (el && app.slug) {
                        rowRefs.current.set(app.slug, el)
                      } else if (app.slug) {
                        rowRefs.current.delete(app.slug)
                      }
                    }}
                    onClick={() => handleAppClick(app)}
                    className={cn(
                      'border-b cursor-pointer transition-colors',
                      selectedApp?.id === app.id
                        ? 'bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900'
                        : 'hover:bg-muted/30',
                    )}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <AppIcon app={app} className="size-6" />
                        <span className="font-medium">
                          {app.displayName || 'Unnamed App'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {app.description || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right Column - Sticky Detail Panel */}
      {selectedApp && (
        <div className="sticky top-0 max-h-screen overflow-hidden">
          <div className="h-full overflow-y-auto border-l bg-background relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-20 size-8 rounded-full bg-background/80 backdrop-blur hover:bg-background"
              onClick={onCloseDetails}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
            <AppDetails app={selectedApp} />
          </div>
        </div>
      )}
    </div>
  )
}
