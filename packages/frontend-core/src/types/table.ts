import type {} from '@tanstack/react-table'

// Extend TanStack Table's ColumnMeta for custom column styling
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    /** CSS className to apply to column header and cells */
    className?: string
  }
}
