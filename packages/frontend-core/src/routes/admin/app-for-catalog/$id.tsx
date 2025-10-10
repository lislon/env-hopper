import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { Control, FieldValues } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTRPC } from '~/api/infra/trpc'
import { IconPickerField } from '~/components/IconPickerField'
import type { Screenshot } from '~/modules/appCatalog/ScreenshotManager'
import { ScreenshotManager } from '~/modules/appCatalog/ScreenshotManager'
import { Button } from '~/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/ui/form'
import { Input } from '~/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/ui/select'
import { Textarea } from '~/ui/textarea'

export const Route = createFileRoute('/admin/app-for-catalog/$id')({
  component: RouteComponent,
  async loader({ params, context }) {
    const { id } = params
    if (id === 'new') {
      return { app: null }
    }

    const { trpcClient } = context
    const app = await trpcClient.appCatalogAdmin.getById.query({ id })
    return { app }
  },
  staticData: {
    breadcrumb: {
      title: 'Edit App',
    },
  },
})

type AccessType =
  | 'bot'
  | 'ticketing'
  | 'email'
  | 'self-service'
  | 'documentation'
  | 'manual'

const ACCESS_TYPES: ReadonlyArray<{ value: AccessType; label: string }> = [
  { value: 'self-service', label: 'Self Service' },
  { value: 'ticketing', label: 'Ticketing' },
  { value: 'bot', label: 'Bot' },
  { value: 'email', label: 'Email' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'manual', label: 'Manual' },
]

const formSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().min(1, 'Description is required'),
  accessType: z.enum([
    'self-service',
    'ticketing',
    'bot',
    'email',
    'documentation',
    'manual',
  ]),
  iconName: z.string().optional(),
  appUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  links: z.string().default('[]'),
})

type FormData = z.infer<typeof formSchema>

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const loaderData = Route.useLoaderData()
  const isNew = id === 'new'

  const app = loaderData.app

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema as unknown as never),
    defaultValues: app
      ? {
          slug: app.slug || '',
          displayName: app.displayName || '',
          description: app.description || '',
          accessType:
            ((app.access as { type?: unknown }).type as
              | AccessType
              | undefined) || 'self-service',
          iconName: app.iconName || '',
          appUrl: app.appUrl || '',
          notes: app.notes || '',
          links: JSON.stringify(
            (app as { links?: unknown }).links || [],
            null,
            2,
          ),
        }
      : {
          slug: '',
          displayName: '',
          description: '',
          accessType: 'self-service',
          iconName: '',
          appUrl: '',
          notes: '',
          links: '[]',
        },
  })
  const formControl = form.control as unknown as Control<FieldValues>

  const createMutation = useMutation({
    ...trpc.appCatalogAdmin.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.appCatalogAdmin.list.queryKey(),
      })
      navigate({ to: '/admin/app-for-catalog' })
    },
  })

  const updateMutation = useMutation({
    ...trpc.appCatalogAdmin.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.appCatalogAdmin.list.queryKey(),
      })
      navigate({ to: '/admin/app-for-catalog' })
    },
  })

  const updateScreenshotsMutation = useMutation({
    ...trpc.appCatalogAdmin.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.appCatalogAdmin.list.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.appCatalogAdmin.getById.queryKey({ id }),
      })
    },
  })

  const onSubmit = (formData: FormData) => {
    try {
      type AppLink = { displayName?: string; url: string }
      const parsed: unknown = JSON.parse(formData.links)
      const links: Array<AppLink> | undefined = Array.isArray(parsed)
        ? parsed.filter(
            (l): l is AppLink =>
              typeof l === 'object' &&
              l !== null &&
              'url' in l &&
              typeof (l as { url?: unknown }).url === 'string',
          )
        : undefined

      const access: { type: AccessType } & Record<string, unknown> = {
        type: formData.accessType,
      }

      const payload = {
        slug: formData.slug,
        displayName: formData.displayName,
        description: formData.description,
        access,
        iconName: formData.iconName || undefined,
        appUrl: formData.appUrl || undefined,
        notes: formData.notes || undefined,
        links: links && links.length > 0 ? links : undefined,
      }

      if (isNew) {
        createMutation.mutate(payload)
      } else {
        updateMutation.mutate({
          id,
          ...payload,
        })
      }
    } catch (error) {
      form.setError('links', {
        type: 'validate',
        message: 'Invalid JSON in links field',
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isNew ? 'Create New App' : `Edit: ${app?.displayName || ''}`}
        </h2>
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/admin/app-for-catalog' })}
        >
          Back to List
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Details</CardTitle>
              <CardDescription>
                Configure the app catalog entry with all necessary information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={formControl}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL identifier) *</FormLabel>
                          <FormControl>
                            <Input placeholder="my-app" {...field} />
                          </FormControl>
                          <FormDescription>
                            Lowercase letters, numbers, and hyphens only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={formControl}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="My Application" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={formControl}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter app description..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={formControl}
                      name="accessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Type *</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACCESS_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={formControl}
                      name="iconName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <FormControl>
                            <IconPickerField
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select an icon..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={formControl}
                    name="appUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formControl}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formControl}
                    name="links"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Links (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`[\n  { "displayName": "Documentation", "url": "https://..." },\n  { "url": "https://..." }\n]`}
                            rows={5}
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Array of link objects with url and optional
                          displayName
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isPending}>
                      {isPending
                        ? 'Saving...'
                        : isNew
                          ? 'Create App'
                          : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate({ to: '/admin/app-for-catalog' })}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {!isNew && (
            <ScreenshotManager
              screenshots={(
                (app as { screenshotIds?: Array<string> }).screenshotIds || []
              ).map((screenshotId) => ({
                id: screenshotId,
                url: `/api/assets/${screenshotId}`,
              }))}
              onAddScreenshot={async (file) => {
                const formData = new FormData()
                formData.append('asset', file)
                formData.append('name', `${app?.id ?? 'app'}-${file.name}`)
                formData.append('assetType', 'screenshot')

                const response = await fetch('/api/assets/upload', {
                  method: 'POST',
                  body: formData,
                })

                if (!response.ok) {
                  throw new Error('Failed to upload screenshot')
                }

                const data: { id: string } = await response.json()
                return { id: data.id, url: `/api/assets/${data.id}` }
              }}
              onScreenshotsChange={(screenshots: Array<Screenshot>) => {
                updateScreenshotsMutation.mutate({
                  id,
                  screenshotIds: screenshots.map((s) => s.id),
                })
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
