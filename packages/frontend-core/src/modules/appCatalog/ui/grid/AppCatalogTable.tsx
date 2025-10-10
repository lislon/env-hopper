import type { AppForCatalog } from '@env-hopper/backend-core'
import type { ColumnDef } from '@tanstack/react-table'
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/ui/table'
import { getAppUrl } from './appCatalogUtils'

export interface AppCatalogTableProps {
  apps: Array<AppForCatalog>
}

export function AppCatalogTable({ apps }: AppCatalogTableProps) {
  const columns = useMemo<Array<ColumnDef<AppForCatalog>>>(
    () => [
      {
        id: 'name',
        header: 'App Name',
        cell: ({ row }) => row.original.displayName,
      },
      {
        id: 'url',
        header: 'URL',
        cell: ({ row }) => getAppUrl(row.original),
      },
      {
        id: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="max-w-md line-clamp-2">
            {row.original.description}
          </div>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: apps,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="bg-muted/30 text-muted-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-3">
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
                <TableCell key={cell.id} className="px-3 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
