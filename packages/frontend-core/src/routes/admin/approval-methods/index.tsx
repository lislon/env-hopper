import type { ApprovalMethodType, TRPCRouter } from '@env-hopper/backend-core'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { TRPCClient } from '@trpc/client'
import { useTRPC } from '~/api/infra/trpc'
import { ApprovalMethodForm } from '~/modules/approvalMethod/ApprovalMethodForm'
import { Badge } from '~/ui/badge'
import { CrudList } from '~/ui/crud-list'

/**
 * ApprovalMethod type as returned by tRPC (dates serialized to strings)
 */
type SerializedApprovalMethod = Awaited<
  ReturnType<TRPCClient<TRPCRouter>['approvalMethod']['list']['query']>
>[number]

export const Route = createFileRoute('/admin/approval-methods/')({
  component: RouteComponent,
  async loader({ context }) {
    const { trpcClient } = context
    return {
      approvalMethods: await trpcClient.approvalMethod.list.query(),
    }
  },
  staticData: {
    breadcrumb: {
      title: 'List',
    },
  },
})

const TYPE_LABELS: Record<ApprovalMethodType, string> = {
  service: 'Service',
  personTeam: 'Person/Team',
  custom: 'Custom',
}

const TYPE_COLORS: Record<
  ApprovalMethodType,
  'default' | 'outline' | 'secondary'
> = {
  service: 'default',
  personTeam: 'secondary',
  custom: 'outline',
}

const columns: Array<ColumnDef<SerializedApprovalMethod>> = [
  {
    accessorKey: 'displayName',
    header: 'Name',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={TYPE_COLORS[row.original.type]}>
        {TYPE_LABELS[row.original.type]}
      </Badge>
    ),
  },
  {
    accessorKey: 'config',
    header: 'Configuration',
    cell: ({ row }) => {
      const config = row.original.config as Record<string, unknown> | null
      if (!config) return <span className="text-muted-foreground">-</span>

      // Show relevant config preview based on type
      if (row.original.type === 'service' && config.url) {
        return (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {config.url as string}
          </span>
        )
      }
      if (
        row.original.type === 'personTeam' &&
        Array.isArray(config.reachOutContacts)
      ) {
        return (
          <span className="text-sm text-muted-foreground">
            {config.reachOutContacts.length} contact(s)
          </span>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
]

function RouteComponent() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const loaderData = Route.useLoaderData()

  // Use query with loader data as initial data
  const { data: approvalMethods = [] } = useQuery({
    ...trpc.approvalMethod.list.queryOptions(),
    initialData:
      'approvalMethods' in loaderData ? loaderData.approvalMethods : [],
  })

  const createMutation = useMutation({
    ...trpc.approvalMethod.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.approvalMethod.list.queryKey(),
      })
    },
  })

  const updateMutation = useMutation({
    ...trpc.approvalMethod.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.approvalMethod.list.queryKey(),
      })
    },
  })

  const deleteMutation = useMutation({
    ...trpc.approvalMethod.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.approvalMethod.list.queryKey(),
      })
    },
  })

  return (
    <div className="p-6">
      <CrudList
        data={approvalMethods}
        columns={columns as any}
        getRowId={(item) => item.slug}
        title="Approval Methods"
        createButtonLabel="Add Method"
        emptyMessage="No approval methods configured"
        renderForm={({ mode, item, onSubmit, onCancel, isPending }) => (
          <ApprovalMethodForm
            mode={mode}
            initialData={item as any}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isPending={isPending}
          />
        )}
        onCreate={async (data: any) => {
          await createMutation.mutateAsync(data)
        }}
        onUpdate={async (data: any) => {
          await updateMutation.mutateAsync(data)
        }}
        onDelete={async (item) => {
          await deleteMutation.mutateAsync({ slug: item.slug })
        }}
      />
    </div>
  )
}
