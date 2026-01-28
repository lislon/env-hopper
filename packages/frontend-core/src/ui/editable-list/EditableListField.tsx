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
import { Label } from '~/ui/label'
import type { EditableListFieldProps } from './types'

type DialogState<T> =
  | { open: false }
  | { open: true; mode: 'create'; index: null }
  | { open: true; mode: 'edit'; index: number; item: T }

export function EditableListField<T>({
  value,
  onChange,
  columns,
  renderForm,
  createEmpty,
  getItemKey,
  label,
  addButtonLabel = 'Add',
  emptyMessage = 'No items',
  disabled = false,
}: EditableListFieldProps<T>) {
  const [dialogState, setDialogState] = useState<DialogState<T>>({
    open: false,
  })

  // Add action column
  const columnsWithActions = [
    ...columns,
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: T; index: number } }) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setDialogState({
                open: true,
                mode: 'edit',
                index: row.index,
                item: row.original,
              })
            }
            disabled={disabled}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const newValue = value.filter((_, i) => i !== row.index)
              onChange(newValue)
            }}
            disabled={disabled}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ),
      size: 60,
    },
  ]

  const table = useReactTable({
    data: value,
    columns: columnsWithActions,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => getItemKey(row, index),
  })

  const handleSave = useCallback(
    (item: T) => {
      if (!dialogState.open) return

      if (dialogState.mode === 'create') {
        onChange([...value, item])
      } else {
        const newValue = [...value]
        newValue[dialogState.index] = item
        onChange(newValue)
      }
      setDialogState({ open: false })
    },
    [dialogState, value, onChange],
  )

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <div className="border rounded-md">
        {value.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-8 text-xs">
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
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setDialogState({ open: true, mode: 'create', index: null })
        }
        disabled={disabled}
      >
        <Plus className="h-3 w-3 mr-1" />
        {addButtonLabel}
      </Button>

      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => !open && setDialogState({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.open && dialogState.mode === 'create'
                ? 'Add Item'
                : 'Edit Item'}
            </DialogTitle>
          </DialogHeader>
          {dialogState.open &&
            renderForm({
              item:
                dialogState.mode === 'edit' ? dialogState.item : createEmpty(),
              onSave: handleSave,
              onCancel: () => setDialogState({ open: false }),
            })}
        </DialogContent>
      </Dialog>
    </div>
  )
}
