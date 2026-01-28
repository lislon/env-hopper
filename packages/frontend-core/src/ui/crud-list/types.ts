import type { ColumnDef } from '@tanstack/react-table'

export interface CrudListProps<TData, TCreateInput, TUpdateInput> {
  // Data
  data: Array<TData>
  isLoading?: boolean

  // Table configuration
  columns: Array<ColumnDef<TData>>
  getRowId: (item: TData) => string

  // Dialog form - render prop pattern
  renderForm: (
    props: CrudFormProps<TData, TCreateInput, TUpdateInput>,
  ) => React.ReactNode

  // Callbacks
  onCreate: (data: TCreateInput) => Promise<void>
  onUpdate: (data: TUpdateInput) => Promise<void>
  onDelete: (item: TData) => Promise<void>

  // UI customization
  title?: string
  createButtonLabel?: string
  emptyMessage?: string

  // Optional: disable actions
  canCreate?: boolean
  canEdit?: boolean | ((item: TData) => boolean)
  canDelete?: boolean | ((item: TData) => boolean)
}

export interface CrudFormProps<TData, TCreateInput, TUpdateInput> {
  mode: 'create' | 'edit'
  item: TData | null
  onSubmit: (data: TCreateInput | TUpdateInput) => void
  onCancel: () => void
  isPending: boolean
}

export type CrudDialogState<TData> =
  | { open: false }
  | { open: true; mode: 'create'; item: null }
  | { open: true; mode: 'edit'; item: TData }
