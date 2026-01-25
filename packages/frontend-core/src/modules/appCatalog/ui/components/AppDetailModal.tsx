import type { AppForCatalog, Approver } from '@env-hopper/backend-core'
import { AppWindow, ExternalLink, X } from 'lucide-react'
import React, { useEffect } from 'react'
import { Badge } from '~/ui/badge'
import { Button } from '~/ui/button'
import { ScrollArea } from '~/ui/scroll-area'
import { Separator } from '~/ui/separator'
import { ApproverDisplay } from './ApproverDisplay'

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
      <AppWindow className="size-8" />
    </div>
  )
}

function ScreenshotGallery({ app }: { app: AppForCatalog }) {
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(
    () => new Set(),
  )

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

  return (
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
            className="w-full rounded-lg overflow-hidden bg-muted/30"
          >
            <img
              src={screenshotUrl}
              alt={`${app.displayName} screenshot ${index + 1}`}
              className="w-full h-auto object-contain max-h-[600px]"
              onError={() => handleImageError(screenshotId)}
            />
          </div>
        )
      })}
    </div>
  )
}

function AccessSection({ app }: { app: AppForCatalog }) {
  const { access } = app

  if (!access) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Access Method</div>
        <div className="text-sm text-muted-foreground">
          Contact administrator
        </div>
      </div>
    )
  }

  const getAccessLabel = () => {
    switch (access.type) {
      case 'self-service':
        return 'Self-service access'
      case 'ticketing':
        return 'Access via ticketing'
      case 'bot':
        return 'Bot-based access'
      case 'email':
        return 'Email for access'
      case 'documentation':
        return 'See documentation'
      case 'manual':
        return 'Manual access'
      default:
        return 'Access available'
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Access Method</div>
      <div className="text-sm text-muted-foreground">{getAccessLabel()}</div>
      {access.type === 'documentation' &&
        'url' in access &&
        typeof access.url === 'string' && (
          <a
            href={access.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            View documentation
            <ExternalLink className="size-3" />
          </a>
        )}
    </div>
  )
}

function ApproverSection({ approver }: { approver: Approver }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Approval Required</div>
      <ApproverDisplay approver={approver} />
    </div>
  )
}

export function AppDetailModal({ app, isOpen, onClose }: AppDetailModalProps) {
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
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 z-10 size-10 rounded-full bg-background/80 backdrop-blur hover:bg-background"
          onClick={onClose}
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Scrollable Content */}
        <ScrollArea
          className="h-full w-full max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-background rounded-lg shadow-2xl border border-border p-8 space-y-8">
            {/* Screenshots Section */}
            <ScreenshotGallery app={app} />

            <Separator />

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
                      Visit application
                      <ExternalLink className="size-4" />
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

              {/* Approver Section */}
              {app.approver && <ApproverSection approver={app.approver} />}

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
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
