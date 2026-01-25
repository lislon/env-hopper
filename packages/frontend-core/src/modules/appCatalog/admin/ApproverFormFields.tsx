import type { Control, FieldValues } from 'react-hook-form'
import type { Approver } from '@env-hopper/backend-core'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/ui/form'
import { Input } from '~/ui/input'
import { Textarea } from '~/ui/textarea'

interface ApproverFormFieldsProps {
  control: Control<FieldValues>
  approverType: Approver['type'] | undefined
}

export function ApproverFormFields({
  control,
  approverType,
}: ApproverFormFieldsProps) {
  if (!approverType) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Select an approver type to configure specific settings
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Common Fields */}
      <FormField
        control={control}
        name="approver.comment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Comment</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={2}
                placeholder="Optional comment about this approver..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.roles"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Roles (JSON)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={4}
                className="font-mono text-sm"
                placeholder={`[\n  { "name": "Admin", "description": "Full access" },\n  { "name": "Viewer", "description": "Read-only" }\n]`}
              />
            </FormControl>
            <FormDescription>
              Array of role objects with name and optional description
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.approvalPolicy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Approval Policy</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., Manager approval required" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.postApprovalInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Post-Approval Instructions</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder="Instructions to follow after approval..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.seeMoreUrls"
        render={({ field }) => (
          <FormItem>
            <FormLabel>See More URLs (JSON)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                className="font-mono text-sm"
                placeholder={`[\n  "https://docs.example.com",\n  "https://wiki.example.com"\n]`}
              />
            </FormControl>
            <FormDescription>Array of URL strings</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Type-Specific Fields */}
      {approverType === 'bot' && <BotSpecificFields control={control} />}
      {approverType === 'ticket' && <TicketSpecificFields control={control} />}
      {approverType === 'person' && <PersonSpecificFields control={control} />}
    </div>
  )
}

function BotSpecificFields({ control }: { control: Control<FieldValues> }) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="text-sm font-medium">Bot-Specific Settings</div>

      <FormField
        control={control}
        name="approver.url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bot URL</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder="slack://channel?team=..."
              />
            </FormControl>
            <FormDescription>
              Optional URL to open the bot (overrides instance default)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.prompt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bot Prompt</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Can I get access to..." />
            </FormControl>
            <FormDescription>
              Optional custom prompt text (overrides instance default)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function TicketSpecificFields({ control }: { control: Control<FieldValues> }) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="text-sm font-medium">Ticket-Specific Settings</div>

      <FormField
        control={control}
        name="approver.url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ticket System URL</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder="https://jira.example.com/..."
              />
            </FormControl>
            <FormDescription>
              Optional URL to ticket system (overrides instance default)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.requestFormTemplate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Request Form Template</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={4}
                placeholder="I would like to request access to..."
              />
            </FormControl>
            <FormDescription>
              Template text for the access request form
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function PersonSpecificFields({ control }: { control: Control<FieldValues> }) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="text-sm font-medium">Person/Group Settings</div>

      <FormField
        control={control}
        name="approver.email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="email"
                placeholder="approver@example.com"
              />
            </FormControl>
            <FormDescription>
              Email address to contact for approval
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder="https://wiki.example.com/..."
              />
            </FormControl>
            <FormDescription>
              Optional URL to more information about this person/group
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="approver.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={2}
                placeholder="Additional information about this approver..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
