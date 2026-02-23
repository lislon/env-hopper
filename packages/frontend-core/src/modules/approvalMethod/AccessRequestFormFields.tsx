import { useQuery } from '@tanstack/react-query'
import type { Control, FieldValues } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '~/ui/form'
import { MarkdownEditor } from '~/ui/markdown-editor'
import { EditableListField } from '~/ui/editable-list'
import { LinkExternal } from '~/ui/linkExternal'
import { Input } from '~/ui/input'
import { Button } from '~/ui/button'
import { ApiQueryMagazineApprovalMethod } from './api/ApiQueryMagazineApprovalMethod'

interface AccessRequestFormFieldsProps {
  control: Control<FieldValues>
  approvalMethodId: string | undefined
}

export function AccessRequestFormFields({
  control,
  approvalMethodId,
}: AccessRequestFormFieldsProps) {
  const { data: method } = useQuery({
    ...ApiQueryMagazineApprovalMethod.getById(approvalMethodId!),
    enabled: !!approvalMethodId,
  })

  if (!approvalMethodId) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Select an approval method to configure details
      </div>
    )
  }

  if (!method) {
    return <div className="text-sm text-muted-foreground py-4">Loading...</div>
  }

  const methodConfig = method.config as
    | Record<string, unknown>
    | undefined
    | null

  return (
    <div className="space-y-6">
      {/* Service type: Show clickable URL if configured */}
      {method.type === 'service' && methodConfig?.url ? (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="text-sm font-medium mb-2">Service URL</div>
          <LinkExternal href={methodConfig.url as string}>
            {methodConfig.url as string}
          </LinkExternal>
        </div>
      ) : null}

      {/* Common Fields */}
      <FormField
        control={control}
        name="accessRequest.comments"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Comments</FormLabel>
            <FormControl>
              <MarkdownEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="General comments about access..."
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="accessRequest.requestPrompt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Request Prompt</FormLabel>
            <FormControl>
              <MarkdownEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Instructions on how to request access..."
              />
            </FormControl>
            <FormDescription>
              Explain how users should request access to this app
            </FormDescription>
          </FormItem>
        )}
      />

      {/* Roles List */}
      <FormField
        control={control}
        name="accessRequest.roles"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Available Roles</FormLabel>
            <EditableListField
              value={field.value ?? []}
              onChange={field.onChange}
              columns={[
                { accessorKey: 'name', header: 'Role Name' },
                { accessorKey: 'description', header: 'Description' },
              ]}
              createEmpty={() => ({ name: '', description: '' })}
              getItemKey={(_, i) => String(i)}
              addButtonLabel="Add Role"
              emptyMessage="No roles defined"
              renderForm={({ item, onSave, onCancel }) => {
                if (!item) return null
                return (
                  <RoleForm item={item} onSave={onSave} onCancel={onCancel} />
                )
              }}
            />
          </FormItem>
        )}
      />

      {/* Approvers List */}
      <FormField
        control={control}
        name="accessRequest.approvers"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Approvers</FormLabel>
            <EditableListField
              value={field.value ?? []}
              onChange={field.onChange}
              columns={[
                { accessorKey: 'displayName', header: 'Name' },
                { accessorKey: 'contact', header: 'Contact' },
              ]}
              createEmpty={() => ({ displayName: '', contact: '' })}
              getItemKey={(_, i) => String(i)}
              addButtonLabel="Add Approver"
              emptyMessage="No approvers defined"
              renderForm={({ item, onSave, onCancel }) => {
                if (!item) return null
                return (
                  <ApproverForm
                    item={item}
                    onSave={onSave}
                    onCancel={onCancel}
                  />
                )
              }}
            />
            <FormDescription>
              People who can approve access requests
            </FormDescription>
          </FormItem>
        )}
      />

      {/* URLs List */}
      <FormField
        control={control}
        name="accessRequest.urls"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Related URLs</FormLabel>
            <EditableListField
              value={field.value ?? []}
              onChange={field.onChange}
              columns={[
                { accessorKey: 'label', header: 'Label' },
                { accessorKey: 'url', header: 'URL' },
              ]}
              createEmpty={() => ({ label: '', url: '' })}
              getItemKey={(_, i) => String(i)}
              addButtonLabel="Add URL"
              emptyMessage="No URLs defined"
              renderForm={({ item, onSave, onCancel }) => {
                if (!item) return null
                return (
                  <UrlForm item={item} onSave={onSave} onCancel={onCancel} />
                )
              }}
            />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="accessRequest.postApprovalInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Post-Approval Instructions</FormLabel>
            <FormControl>
              <MarkdownEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Steps to follow after approval is granted..."
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Person/Team specific: Who to reach out */}
      {method.type === 'personTeam' && (
        <FormField
          control={control}
          name="accessRequest.whoToReachOut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Who to Reach Out</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="Describe who to contact and how..."
                />
              </FormControl>
              <FormDescription>
                Specific instructions for contacting the person or team
              </FormDescription>
            </FormItem>
          )}
        />
      )}
    </div>
  )
}

// Sub-forms for list editing

function RoleForm({
  item,
  onSave,
  onCancel,
}: {
  item: { name: string; description: string }
  onSave: (item: { name: string; description: string }) => void
  onCancel: () => void
}) {
  const form = useForm<{ name: string; description: string }>({
    defaultValues: item,
  })

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
      <FormField
        control={form.control as any}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., Admin, Read-Only" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control as any}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Brief description of the role" />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ApproverForm({
  item,
  onSave,
  onCancel,
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
              <Input {...field} placeholder="e.g., John Doe" />
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
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function UrlForm({
  item,
  onSave,
  onCancel,
}: {
  item: { label: string; url: string }
  onSave: (item: { label: string; url: string }) => void
  onCancel: () => void
}) {
  const form = useForm<{ label: string; url: string }>({
    defaultValues: item,
  })

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
      <FormField
        control={form.control as any}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., Documentation" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control as any}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder="e.g., https://example.com"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
