import type { EnvBaseInfo } from '@env-hopper/backend-core'
import type { ColumnDef } from '@tanstack/react-table'
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/ui/table'

type Row = EnvBaseInfo

export function EnvCatalogPage() {
  const { environments } = useEnvironmentContext()

  const columns = useMemo<Array<ColumnDef<Row>>>(
    () => [
      {
        id: 'name',
        header: 'Environment',
        accessorKey: 'displayName',
      },
      {
        id: 'slug',
        header: 'Slug',
        accessorKey: 'slug',
      },
    ],
    [],
  )

  const table = useReactTable({
    data: environments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="py-6 flex flex-col gap-4">
      <div>
        <div className="font-medium">Envs</div>
        <div className="text-sm text-muted-foreground">
          {environments.length} environments
        </div>
      </div>

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
    </div>
  )
}
