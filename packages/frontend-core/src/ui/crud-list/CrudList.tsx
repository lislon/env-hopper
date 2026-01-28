import { useCallback, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '~/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/ui/alert-dialog'
import { Skeleton } from '~/ui/skeleton'
import type { CrudDialogState, CrudListProps } from './types'

export function CrudList<TData, TCreateInput, TUpdateInput>({
  data,
  isLoading = false,
  columns,
  getRowId,
  renderForm,
  onCreate,
  onUpdate,
  onDelete,
  title,
  createButtonLabel = 'Add',
  emptyMessage = 'No items found',
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: CrudListProps<TData, TCreateInput, TUpdateInput>) {
  const [dialogState, setDialogState] = useState<CrudDialogState<TData>>({
    open: false,
  })
  const [deleteItem, setDeleteItem] = useState<TData | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Add action column
  const columnsWithActions = [
    ...columns,
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: TData } }) => {
        const item = row.original
        const showEdit = typeof canEdit === 'function' ? canEdit(item) : canEdit
        const showDelete =
          typeof canDelete === 'function' ? canDelete(item) : canDelete

        return (
          <div className="flex justify-end gap-1">
            {showEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDialogState({ open: true, mode: 'edit', item })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {showDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteItem(item)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )
      },
      size: 80,
    },
  ]

  const table = useReactTable({
    data,
    columns: columnsWithActions,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  })

  const handleSubmit = useCallback(
    async (formData: TCreateInput | TUpdateInput) => {
      if (!dialogState.open) return

      setIsPending(true)
      try {
        if (dialogState.mode === 'create') {
          await onCreate(formData as TCreateInput)
        } else {
          await onUpdate(formData as TUpdateInput)
        }
        setDialogState({ open: false })
      } finally {
        setIsPending(false)
      }
    },
    [dialogState, onCreate, onUpdate],
  )

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return
    setIsPending(true)
    try {
      await onDelete(deleteItem)
      setDeleteItem(null)
    } finally {
      setIsPending(false)
    }
  }, [deleteItem, onDelete])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        {canCreate && (
          <Button
            onClick={() =>
              setDialogState({ open: true, mode: 'create', item: null })
            }
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            {createButtonLabel}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_item, i) => (
                <TableRow key={i}>
                  {columns.map((_col, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnsWithActions.length}
                  className="text-center text-muted-foreground py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Don't open if clicking on action buttons
                    if ((e.target as HTMLElement).closest('button')) return
                    const showEdit =
                      typeof canEdit === 'function'
                        ? canEdit(row.original)
                        : canEdit
                    if (showEdit) {
                      setDialogState({
                        open: true,
                        mode: 'edit',
                        item: row.original,
                      })
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => !open && setDialogState({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.open && dialogState.mode === 'create'
                ? 'Create'
                : 'Edit'}
            </DialogTitle>
          </DialogHeader>
          {dialogState.open &&
            renderForm({
              mode: dialogState.mode,
              item: dialogState.mode === 'edit' ? dialogState.item : null,
              onSubmit: handleSubmit,
              onCancel: () => setDialogState({ open: false }),
              isPending,
            })}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
