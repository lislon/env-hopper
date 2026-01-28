import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApprovalMethod } from '@env-hopper/backend-core'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useTRPC } from '~/api/infra/trpc'
import { cn } from '~/lib/utils'
import { Button } from '~/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/ui/dialog'
import { Badge } from '~/ui/badge'
import { ApprovalMethodForm } from './ApprovalMethodForm'
import { ApiQueryMagazineApprovalMethod } from './api/ApiQueryMagazineApprovalMethod'

interface ApprovalMethodSelectorProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

export function ApprovalMethodSelector({
  value,
  onChange,
  disabled = false,
}: ApprovalMethodSelectorProps) {
  const [open, setOpen] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: methods = [] } = useQuery<Array<ApprovalMethod>>(
    ApiQueryMagazineApprovalMethod.list(),
  )

  const createMutation = useMutation({
    ...trpc.approvalMethod.create.mutationOptions(),
    onSuccess: (newMethod) => {
      queryClient.invalidateQueries({
        queryKey: ['approvalMethod'],
      })
      onChange(newMethod.id)
      setShowQuickAdd(false)
    },
  })

  const selectedMethod = methods.find((m) => m.id === value)

  const TYPE_LABELS: Record<string, string> = {
    service: 'Service',
    personTeam: 'Person/Team',
    custom: 'Custom',
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedMethod ? (
              <span className="flex items-center gap-2">
                {selectedMethod.displayName}
                <Badge variant="secondary" className="text-xs">
                  {TYPE_LABELS[selectedMethod.type]}
                </Badge>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Select approval method...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search methods..." />
            <CommandList>
              <CommandEmpty>No methods found.</CommandEmpty>
              <CommandGroup>
                {methods.map((method) => (
                  <CommandItem
                    key={method.id}
                    value={method.displayName}
                    onSelect={() => {
                      onChange(method.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === method.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex items-center gap-2">
                      {method.displayName}
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[method.type]}
                      </Badge>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowQuickAdd(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new method...
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Approval Method</DialogTitle>
          </DialogHeader>
          <ApprovalMethodForm
            mode="create"
            initialData={null}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowQuickAdd(false)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
