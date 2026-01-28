import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '~/ui/button'
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
import { EditableListField } from '~/ui/editable-list'

const APPROVAL_METHOD_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'personTeam', label: 'Person/Team' },
  { value: 'custom', label: 'Custom' },
] as const

// Form schema
const formSchema = z.object({
  type: z.enum(['service', 'personTeam', 'custom']),
  displayName: z.string().min(1, 'Display name is required'),
  // Service config
  serviceUrl: z.string().url().optional().or(z.literal('')),
  serviceIcon: z.string().optional(),
  // PersonTeam config
  reachOutContacts: z
    .array(
      z.object({
        displayName: z.string(),
        contact: z.string(),
      }),
    )
    .optional(),
})

type FormData = z.infer<typeof formSchema>

interface ApprovalMethodFormProps {
  mode: 'create' | 'edit'
  initialData: {
    id?: string
    type: 'service' | 'personTeam' | 'custom'
    displayName: string
    config?: Record<string, unknown>
  } | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}

export function ApprovalMethodForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: ApprovalMethodFormProps) {
  const config = initialData?.config
  const configRecord = config ? config : undefined

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema as any) as any,
    defaultValues: {
      type: initialData?.type || 'custom',
      displayName: initialData?.displayName || '',
      serviceUrl: configRecord?.url ? String(configRecord.url) : '',
      serviceIcon: configRecord?.icon ? String(configRecord.icon) : '',
      reachOutContacts: Array.isArray(configRecord?.reachOutContacts)
        ? (configRecord.reachOutContacts as Array<{
            displayName: string
            contact: string
          }>)
        : [],
    },
  })

  const typeValue = form.watch('type')

  const handleSubmit = (data: FormData) => {
    // Build config based on type
    let configPayload: Record<string, unknown> | undefined

    if (data.type === 'service') {
      configPayload = {
        ...(data.serviceUrl && { url: data.serviceUrl }),
        ...(data.serviceIcon && { icon: data.serviceIcon }),
      }
    } else if (data.type === 'personTeam') {
      configPayload = {
        ...(data.reachOutContacts?.length && {
          reachOutContacts: data.reachOutContacts,
        }),
      }
    }

    const payload = {
      ...(mode === 'edit' && initialData?.id && { id: initialData.id }),
      type: data.type,
      displayName: data.displayName,
      config:
        Object.keys(configPayload ?? {}).length > 0 ? configPayload : undefined,
    }

    onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control as any}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {APPROVAL_METHOD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {typeValue === 'service' &&
                  'For bots, ticketing systems, self-service portals'}
                {typeValue === 'personTeam' && 'For human approvers or teams'}
                {typeValue === 'custom' &&
                  'Generic approval method with no specific configuration'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Natero Bot, IT Helpdesk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Service-specific fields */}
        {typeValue === 'service' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="text-sm font-medium">Service Configuration</div>

            <FormField
              control={form.control as any}
              name="serviceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    URL to the service (shown as clickable link in app)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="serviceIcon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <Input placeholder="Icon name" {...field} />
                  </FormControl>
                  <FormDescription>Optional icon identifier</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* PersonTeam-specific fields */}
        {typeValue === 'personTeam' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="text-sm font-medium">Reach-Out Contacts</div>
            <FormDescription>
              People or teams to contact for approval (not necessarily the
              approvers themselves)
            </FormDescription>

            <FormField
              control={form.control as any}
              name="reachOutContacts"
              render={({ field }) => (
                <EditableListField
                  value={field.value ?? []}
                  onChange={field.onChange}
                  columns={[
                    { accessorKey: 'displayName', header: 'Name' },
                    { accessorKey: 'contact', header: 'Contact' },
                  ]}
                  createEmpty={() => ({ displayName: '', contact: '' })}
                  getItemKey={(_, i) => String(i)}
                  addButtonLabel="Add Contact"
                  emptyMessage="No contacts configured"
                  renderForm={({ item, onSave, onCancel: onCancelEdit }) => {
                    if (!item) return null
                    return (
                      <ContactForm
                        item={item}
                        onSave={onSave}
                        onCancel={onCancelEdit}
                      />
                    )
                  }}
                />
              )}
            />
          </div>
        )}

        {/* Custom type - no additional fields */}
        {typeValue === 'custom' && (
          <div className="p-4 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
            Custom type has no additional configuration. App-specific details
            will be configured per app.
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Simple contact form for the dialog
function ContactForm({
  item,
  onSave,
  onCancel: handleCancel,
}: {
  item: { displayName: string; contact: string }
  onSave: (item: { displayName: string; contact: string }) => void
  onCancel: () => void
}) {
  const form = useForm<{ displayName: string; contact: string }>({
    defaultValues: item,
  })

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
      <FormField
        control={form.control as any}
        name="displayName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., John Doe, IT Team" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control as any}
        name="contact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., email, Slack handle" />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
