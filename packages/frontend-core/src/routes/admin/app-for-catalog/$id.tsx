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
import { ApproverFormFields } from '~/modules/appCatalog/admin/ApproverFormFields'
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
    const { trpcClient } = context

    const app =
      id === 'new'
        ? null
        : await trpcClient.appCatalogAdmin.getById.query({ id })

    return { app }
  },
  staticData: {
    breadcrumb: {
      title: 'Edit App',
    },
  },
})

type AccessType =
  | 'none'
  | 'bot'
  | 'ticketing'
  | 'email'
  | 'self-service'
  | 'documentation'
  | 'manual'

type ValidAccessType = Exclude<AccessType, 'none'>
type ApproverType = 'bot' | 'ticket' | 'person'

const ACCESS_TYPES: ReadonlyArray<{ value: AccessType; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'self-service', label: 'Self Service' },
  { value: 'ticketing', label: 'Ticketing' },
  { value: 'bot', label: 'Bot' },
  { value: 'email', label: 'Email' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'manual', label: 'Manual' },
]

const APPROVER_TYPES: ReadonlyArray<{ value: ApproverType; label: string }> = [
  { value: 'bot', label: 'Bot' },
  { value: 'ticket', label: 'Ticket System' },
  { value: 'person', label: 'Person/Group' },
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
  accessType: z
    .enum([
      'none',
      'self-service',
      'ticketing',
      'bot',
      'email',
      'documentation',
      'manual',
    ])
    .default('none'),
  // Access method fields
  accessUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  accessInstructions: z.string().optional(),
  iconName: z.string().optional(),
  appUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  links: z.string().default('[]'),
  // Approver fields
  hasApprover: z.boolean().default(false),
  approverType: z.enum(['bot', 'ticket', 'person']).optional(),
  approver: z
    .object({
      comment: z.string().optional(),
      roles: z.string().optional(),
      approvalPolicy: z.string().optional(),
      postApprovalInstructions: z.string().optional(),
      seeMoreUrls: z.string().optional(),
      // Type-specific fields
      url: z.string().optional(),
      prompt: z.string().optional(),
      requestFormTemplate: z.string().optional(),
      email: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
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

  const approver = app?.approver as any
  const hasApprover = !!approver

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
              | undefined) || 'none',
          accessUrl: (app.access as { url?: string } | undefined)?.url || '',
          accessInstructions:
            (app.access as { instructions?: string } | undefined)
              ?.instructions || '',
          iconName: app.iconName || '',
          appUrl: app.appUrl || '',
          notes: app.notes || '',
          links: JSON.stringify(
            (app as { links?: unknown }).links || [],
            null,
            2,
          ),
          hasApprover,
          approverType: approver?.type,
          approver: hasApprover
            ? {
                comment: approver.comment || '',
                roles: JSON.stringify(approver.roles || [], null, 2),
                approvalPolicy: approver.approvalPolicy || '',
                postApprovalInstructions:
                  approver.postApprovalInstructions || '',
                seeMoreUrls: JSON.stringify(
                  approver.seeMoreUrls || [],
                  null,
                  2,
                ),
                url: approver.url || '',
                prompt: approver.prompt || '',
                requestFormTemplate: approver.requestFormTemplate || '',
                email: approver.email || '',
                description: approver.description || '',
              }
            : undefined,
        }
      : {
          slug: '',
          displayName: '',
          description: '',
          accessType: 'none',
          accessUrl: '',
          accessInstructions: '',
          iconName: '',
          appUrl: '',
          notes: '',
          links: '[]',
          hasApprover: false,
          approverType: undefined,
          approver: undefined,
        },
  })
  const formControl = form.control as unknown as Control<FieldValues>

  // Watch form values for reactivity
  const hasApproverValue = form.watch('hasApprover')
  const approverTypeValue = form.watch('approverType')
  const accessTypeValue = form.watch('accessType')

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
      const linksData: unknown = JSON.parse(formData.links)
      const links: Array<AppLink> | undefined = Array.isArray(linksData)
        ? linksData.filter(
            (l): l is AppLink =>
              typeof l === 'object' &&
              l !== null &&
              'url' in l &&
              typeof (l as { url?: unknown }).url === 'string',
          )
        : undefined

      // Only create access object if type is not 'none'
      const access =
        formData.accessType !== 'none'
          ? ({
              type: formData.accessType,
              ...(formData.accessUrl && { url: formData.accessUrl }),
              ...(formData.accessInstructions && {
                instructions: formData.accessInstructions,
              }),
            } as {
              type: ValidAccessType
            } & Record<string, unknown>)
          : undefined

      // Process approver data
      let approverPayload: any = undefined
      if (formData.hasApprover && formData.approverType && formData.approver) {
        const roles = formData.approver.roles
          ? JSON.parse(formData.approver.roles)
          : undefined
        const seeMoreUrls = formData.approver.seeMoreUrls
          ? JSON.parse(formData.approver.seeMoreUrls)
          : undefined

        approverPayload = {
          type: formData.approverType,
          comment: formData.approver.comment || undefined,
          roles: roles && Array.isArray(roles) ? roles : undefined,
          approvalPolicy: formData.approver.approvalPolicy || undefined,
          postApprovalInstructions:
            formData.approver.postApprovalInstructions || undefined,
          seeMoreUrls:
            seeMoreUrls && Array.isArray(seeMoreUrls) ? seeMoreUrls : undefined,
        }

        // Add type-specific fields
        if (formData.approverType === 'bot') {
          approverPayload.url = formData.approver.url || undefined
          approverPayload.prompt = formData.approver.prompt || undefined
        } else if (formData.approverType === 'ticket') {
          approverPayload.url = formData.approver.url || undefined
          approverPayload.requestFormTemplate =
            formData.approver.requestFormTemplate || undefined
        } else {
          approverPayload.email = formData.approver.email || undefined
          approverPayload.url = formData.approver.url || undefined
          approverPayload.description =
            formData.approver.description || undefined
        }
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
        approver: approverPayload,
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
        message:
          error instanceof Error
            ? error.message
            : 'Invalid JSON in form fields',
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

                  {/* Access Method Configuration */}
                  {(accessTypeValue === 'ticketing' ||
                    accessTypeValue === 'self-service') && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <div className="font-medium text-sm">
                        Access Method Details
                      </div>
                      <FormField
                        control={formControl}
                        name="accessUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://..."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {accessTypeValue === 'ticketing'
                                ? 'URL to the ticketing system or request form'
                                : 'URL to the self-service portal'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formControl}
                        name="accessInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter instructions for accessing this app..."
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Step-by-step instructions for users to request or
                              access this app
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

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

                  {/* Approver Configuration */}
                  <div className="pt-6 border-t">
                    <div className="space-y-4">
                      <FormField
                        control={formControl}
                        name="hasApprover"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">
                              Configure Approver
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {hasApproverValue && (
                        <div className="space-y-4 pl-6">
                          <FormField
                            control={formControl}
                            name="approverType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Approver Type *</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select approver type..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {APPROVER_TYPES.map((type) => (
                                      <SelectItem
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <ApproverFormFields
                            control={formControl}
                            approverType={approverTypeValue}
                          />
                        </div>
                      )}
                    </div>
                  </div>

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
