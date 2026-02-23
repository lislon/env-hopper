import type { AppForCatalog } from '@env-hopper/backend-core'
import { AppWindowIcon, EditIcon, ExternalLinkIcon, XIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useUser } from '~/modules/auth/AuthContext'
import { Badge } from '~/ui/badge'
import { Button } from '~/ui/button'
import { ScrollArea } from '~/ui/scroll-area'
import { Separator } from '~/ui/separator'
import { useAppCatalogContext } from '~/modules/appCatalog'
import { ExternalLink, Link } from '~/ui/link'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/ui/table'
import { ScreenshotGallery } from './ScreenshotGallery'

export interface AppDetailModalProps {
  app: AppForCatalog
  isOpen: boolean
  onClose: () => void
}

function getIconUrl(iconName: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'
  return `${baseUrl}/api/icons/${iconName}`
}

function AppIcon({ app }: { app: AppForCatalog }) {
  const [imageError, setImageError] = React.useState(false)

  if (app.iconName && !imageError) {
    return (
      <img
        src={getIconUrl(app.iconName)}
        alt={`${app.displayName} icon`}
        className="size-16 rounded-lg object-contain"
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <div className="flex items-center justify-center rounded-lg bg-primary/10 text-primary size-16">
      <AppWindowIcon className="size-8" />
    </div>
  )
}

function ScreenshotPreview({ app }: { app: AppForCatalog }) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(() => new Set())
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [initialIndex, setInitialIndex] = useState(0)

  const screenshotIds = app.screenshotIds || []

  if (screenshotIds.length === 0) {
    return (
      <div className="w-full h-96 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground">
        No screenshots available
      </div>
    )
  }

  const handleImageError = (id: string) => {
    setImageErrors((prev) => new Set([...prev, id]))
  }

  const handleScreenshotClick = (index: number) => {
    setInitialIndex(index)
    setGalleryOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        {screenshotIds.map((screenshotId, index) => {
          const screenshotUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}/api/screenshots/${screenshotId}`
          const hasError = imageErrors.has(screenshotId)

          if (hasError) {
            return null
          }

          return (
            <div
              key={screenshotId}
              className="w-full rounded-lg overflow-hidden bg-muted/30 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => handleScreenshotClick(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleScreenshotClick(index)
                }
              }}
            >
              <img
                src={screenshotUrl}
                alt={`${app.displayName} screenshot ${index + 1}`}
                className="h-auto object-contain max-h-[600px]"
                onError={() => handleImageError(screenshotId)}
              />
            </div>
          )
        })}
      </div>

      <ScreenshotGallery
        app={app}
        screenshotIds={screenshotIds}
        initialIndex={initialIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        title={`${app.displayName} - Screenshots`}
      />
    </>
  )
}

function AccessSection({ app }: { app: AppForCatalog }) {
  const { approvalMethods } = useAppCatalogContext()
  const { accessRequest } = app
  if (!accessRequest) {
    return null
  }

  const approvalMethod = approvalMethods.find(
    (m) => accessRequest.approvalMethodId === m.slug,
  )
  if (approvalMethod?.type !== 'service') {
    return 'not service'
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Access Method</div>
      <div className="text-sm text-muted-foreground">
        <ExternalLink
          href={approvalMethod.config.url}
          target="_blank"
          rel="noopener noreferrer"
          className={'inline-flex gap-1'}
        >
          {approvalMethod.displayName}
          <ExternalLinkIcon className="size-3" />
        </ExternalLink>
      </div>
      {accessRequest.roles && (
        <>
          <div className="text-sm font-medium">Roles</div>
          <div className="text-sm text-muted-foreground">
            <Table>
              <TableCaption>A list of your recent invoices.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessRequest.roles.map((role) => (
                  <TableRow key={role.displayName}>
                    <TableCell className="font-medium">
                      {role.displayName}
                    </TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>{role.adminNotes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <pre>{JSON.stringify(accessRequest, null, 2)}</pre>
    </div>
  )
}

export function AppDetailModal({ app, isOpen, onClose }: AppDetailModalProps) {
  const user = useUser()
  const isAuthenticated = !!user

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Container with wide borders */}
      <div className="relative h-full w-full flex items-center justify-center p-4 sm:p-8 lg:p-16">
        {/* Scrollable Content with positioned buttons */}
        <ScrollArea
          className="relative h-full w-full max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 z-10 size-10 rounded-full bg-background/80 backdrop-blur hover:bg-background"
            onClick={onClose}
          >
            <XIcon className="size-5" />
            <span className="sr-only">Close</span>
          </Button>

          {/* Edit Button (Authenticated users) */}
          {isAuthenticated && app.slug && (
            <Button
              variant="default"
              size="sm"
              asChild
              className="absolute top-6 right-[4.5rem] z-10"
            >
              <Link to="/admin/app-for-catalog/$id" params={{ id: app.slug }}>
                <EditIcon className="size-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}

          <div className="bg-background rounded-lg shadow-2xl border border-border p-8 space-y-8">
            {/* App Details Section */}
            <div className="space-y-6">
              {/* Header with Icon and Title */}
              <div className="flex items-start gap-4">
                <AppIcon app={app} />
                <div className="flex-1 space-y-2">
                  <h2 className="text-3xl font-bold">{app.displayName}</h2>
                  {app.appUrl && (
                    <a
                      href={app.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      {app.appUrl.replaceAll(/^https?:\/\//g, '')}
                      <ExternalLinkIcon className="size-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Description */}
              {app.description && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Description</div>
                  <p className="text-muted-foreground">{app.description}</p>
                </div>
              )}

              {/* Access Section */}
              <AccessSection app={app} />

              {/* Approval Details Section - TODO: Update to use new approval system */}
              {/* {app.accessRequest && <AccessRequestSection accessRequest={app.accessRequest} />} */}

              {/* Tags */}
              {app.tags && app.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {app.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams */}
              {app.teams && app.teams.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Teams</div>
                  <div className="flex flex-wrap gap-2">
                    {app.teams.map((team) => (
                      <Badge key={team} variant="outline">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {app.links && app.links.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Related Links</div>
                  <div className="space-y-1">
                    {app.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex text-sm text-primary hover:underline items-center gap-1"
                      >
                        {link.title || link.url}
                        <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {app.notes && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Notes</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {app.notes}
                  </p>
                </div>
              )}
            </div>
            <Separator />
            <ScreenshotPreview app={app} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
