import type {
  AppForCatalog,
  GroupingTagDefinition,
} from '@env-hopper/backend-core'
import type { ColumnDef } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AppWindow, ExternalLink } from 'lucide-react'
import React from 'react'

import { cn } from '~/lib/utils'
import type {} from '~/types/table'
import { Badge } from '~/ui/badge'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/ui/resizable'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/ui/table'
import { AccessRequestSection } from '../components/AccessRequestSection'
import { ScreenshotGallery } from '../components/ScreenshotGallery'
import { useAppCatalogContext } from '../../context/AppCatalogContext'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'

export interface AppCatalogGridProps {
  apps: Array<AppForCatalog>
  selectedAppSlug?: string
  groupingDefinition?: GroupingTagDefinition
  onAppClick?: (app: AppForCatalog) => void
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
    <div className="w-full flex justify-center">
      <div className="rounded-lg overflow-hidden inline-flex items-center justify-center min-h-64">
        {!imageError ? (
          <img
            src={screenshotImageUrl}
            alt={`${app.displayName} screenshot`}
            className="h-64 object-contain"
            onError={() => {
              setImageError(true)
              setIsLoadingImage(false)
            }}
            onLoad={() => setIsLoadingImage(false)}
          />
        ) : null}
        {(imageError || isLoadingImage) && (
          <div className="w-full h-64 bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
            {isLoadingImage
              ? 'Loading screenshot...'
              : 'No screenshot available'}
          </div>
        )}
      </div>
    </div>
  )
}

function AppDetails({ app }: { app: AppForCatalog }) {
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false)
  const [galleryInitialIndex, setGalleryInitialIndex] = React.useState(0)
  const { approvalMethods } = useAppCatalogContext()

  const handleScreenshotClick = (index: number) => {
    setGalleryInitialIndex(index)
    setIsGalleryOpen(true)
  }

  return (
    <>
      <div className="flex h-full flex-col p-6">
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

        {/* Access Request Section */}
        <AccessRequestSection app={app} approvalMethods={approvalMethods} />

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
}: AppCatalogGridProps) {
  const selectedApp = selectedAppSlug
    ? apps.find((a) => a.slug === selectedAppSlug)
    : null

  const groupedApps = groupApps(apps, groupingDefinition)

  // Flatten grouped apps to get display order for keyboard navigation
  const appsInDisplayOrder = React.useMemo(
    () => groupedApps.flatMap((group) => group.apps),
    [groupedApps],
  )

  // Use keyboard navigation hook with apps in display order
  const { rowRefs } = useKeyboardNavigation({
    apps: appsInDisplayOrder,
    selectedAppSlug,
    onAppClick,
  })

  // Define columns
  const columns = React.useMemo<Array<ColumnDef<AppForCatalog>>>(
    () => [
      {
        id: 'application',
        header: 'Application',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <AppIcon app={row.original} className="size-6" />
            <span className="font-medium">
              {row.original.displayName || 'Unnamed App'}
            </span>
          </div>
        ),
        meta: {
          className: 'w-[300px]',
        },
      },
      {
        id: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-2">
            {row.original.description || '—'}
          </span>
        ),
      },
    ],
    [],
  )

  // Create a single table instance with all apps
  const table = useReactTable({
    data: apps,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  // Auto-scroll to selected app (only on initial load)
  const hasScrolledRef = React.useRef(false)
  React.useEffect(() => {
    // Only scroll once on initial load if there's a selection
    if (selectedAppSlug && !hasScrolledRef.current) {
      const rowElement = rowRefs.current.get(selectedAppSlug)
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      hasScrolledRef.current = true
    }
  }, [selectedAppSlug, rowRefs])

  const handleAppClick = (app: AppForCatalog) => {
    onAppClick?.(app)
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel - Table */}
      <ResizablePanel defaultSize={60} minSize={30} className="overflow-hidden">
        <div className="h-full overflow-y-auto pr-2">
          <Table>
            <TableHeader className="sticky top-0 border-b bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left font-medium text-sm',
                        header.column.columnDef.meta?.className,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {groupedApps.map((group) => (
                <React.Fragment key={group.groupName}>
                  {/* Group Header Row */}
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell
                      colSpan={columns.length}
                      className="px-4 py-6 sticky top-[49px] bg-muted/90 backdrop-blur z-10"
                    >
                      <div className="flex items-center justify-center">
                        <span className="font-bold text-lg tracking-widest uppercase leading-loose text-muted-foreground">
                          {group.groupName}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Group Apps */}
                  {group.apps.map((app) => {
                    const row = table
                      .getRowModel()
                      .rows.find((r) => r.id === app.id)
                    if (!row) return null

                    return (
                      <TableRow
                        key={row.id}
                        ref={(el) => {
                          if (el && row.original.slug) {
                            rowRefs.current.set(row.original.slug, el)
                          } else if (row.original.slug) {
                            rowRefs.current.delete(row.original.slug)
                          }
                        }}
                        onClick={() => handleAppClick(row.original)}
                        className={cn(
                          'border-b cursor-pointer transition-colors',
                          selectedApp?.id === row.original.id
                            ? 'bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900'
                            : 'hover:bg-muted/30',
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'px-4 py-4',
                              cell.column.columnDef.meta?.className,
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </ResizablePanel>

      {/* Resizable Handle */}
      <ResizableHandle withHandle />

      {/* Right Panel - Details */}
      <ResizablePanel defaultSize={40} minSize={25} className="overflow-hidden">
        <div className="h-full overflow-y-auto border-l bg-background pl-4">
          {selectedApp ? (
            <AppDetails app={selectedApp} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select an app to view details
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
