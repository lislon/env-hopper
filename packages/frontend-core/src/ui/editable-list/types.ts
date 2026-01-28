import type { ColumnDef } from '@tanstack/react-table'

export interface EditableListFieldProps<T> {
  value: Array<T>
  onChange: (value: Array<T>) => void
  columns: Array<ColumnDef<T>>
  renderForm: (props: {
    item: T | null
    onSave: (item: T) => void
    onCancel: () => void
  }) => React.ReactNode
  createEmpty: () => T
  getItemKey: (item: T, index: number) => string
  label?: string
  addButtonLabel?: string
  emptyMessage?: string
  disabled?: boolean
}
