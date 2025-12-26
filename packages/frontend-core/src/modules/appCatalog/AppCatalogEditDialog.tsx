import type { AppForCatalog } from '@env-hopper/backend-core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTRPC } from '~/api/infra/trpc'
import { Button } from '~/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/ui/dialog'
import { Input } from '~/ui/input'
import { Label } from '~/ui/label'
import { Textarea } from '~/ui/textarea'

// Extended type with DB fields
type AppForCatalogWithDb = AppForCatalog & {
  links?: Array<{ displayName?: string; url: string }>
  screenshotIds?: Array<string>
  createdAt: string
  updatedAt: string
}

interface AppCatalogEditDialogProps {
  app: AppForCatalogWithDb | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  displayName: string
  description: string
  iconName: string
  appUrl: string
  notes: string
  accessType: string
  links: string // JSON array as string
}

export function AppCatalogEditDialog({
  app,
  open,
  onOpenChange,
}: AppCatalogEditDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const isEditing = !!app

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    description: '',
    iconName: '',
    appUrl: '',
    notes: '',
    accessType: 'self-service',
    links: '[]',
  })

  // Reset form when dialog opens/closes or app changes
  useEffect(() => {
    if (open) {
      const newFormData = app
        ? {
            displayName: app.displayName || '',
            description: app.description || '',
            iconName: app.iconName || '',
            appUrl: app.appUrl || '',
            notes: app.notes || '',
            accessType: app.access?.type || 'self-service',
            links: JSON.stringify(app.links || [], null, 2),
          }
        : {
            displayName: '',
            description: '',
            iconName: '',
            appUrl: '',
            notes: '',
            accessType: 'self-service',
            links: '[]',
          }
      setFormData(newFormData)
    }
  }, [app, open])

  const createMutation = useMutation({
    ...trpc.appCatalogAdmin.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.appCatalogAdmin.list.queryKey() })
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    ...trpc.appCatalogAdmin.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.appCatalogAdmin.list.queryKey() })
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const links = JSON.parse(formData.links)

      const payload = {        slug: formData.displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),        displayName: formData.displayName,
        description: formData.description,
        access: { type: formData.accessType as any },
        iconName: formData.iconName || undefined,
        appUrl: formData.appUrl || undefined,
        notes: formData.notes || undefined,
        links: links.length > 0 ? links : undefined,
      }

      if (isEditing) {
        updateMutation.mutate({
          id: app.id,
          ...payload,
        })
      } else {
        createMutation.mutate(payload)
      }
    } catch (error) {
      alert('Invalid JSON in links field')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit App' : 'Create App'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the app catalog entry'
              : 'Add a new app to the catalog'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="displayName">Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="accessType">Access Type *</Label>
              <select
                id="accessType"
                value={formData.accessType}
                onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="self-service">Self Service</option>
                <option value="ticketing">Ticketing</option>
                <option value="bot">Bot</option>
                <option value="email">Email</option>
                <option value="documentation">Documentation</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <Label htmlFor="iconName">Icon Name</Label>
              <Input
                id="iconName"
                value={formData.iconName}
                onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                placeholder="e.g., my-app-icon"
              />
            </div>

            <div>
              <Label htmlFor="appUrl">App URL</Label>
              <Input
                id="appUrl"
                type="url"
                value={formData.appUrl}
                onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="links">Links (JSON)</Label>
              <Textarea
                id="links"
                value={formData.links}
                onChange={(e) => setFormData({ ...formData, links: e.target.value })}
                rows={5}
                placeholder={`[\n  { "displayName": "Documentation", "url": "https://..." },\n  { "url": "https://..." }\n]`}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
