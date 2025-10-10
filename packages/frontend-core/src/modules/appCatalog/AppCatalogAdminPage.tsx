import type { AppForCatalog } from '@env-hopper/backend-core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTRPC } from '~/api/infra/trpc'
import { Button } from '~/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/ui/card'
import { Input } from '~/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/ui/table'

// Extended type with DB fields
type AppForCatalogRow = AppForCatalog & {
  slug: string
  links?: Array<{ displayName?: string; url: string }>
  screenshotIds?: Array<string>
  createdAt: string
  updatedAt: string
}

const columnHelper = createColumnHelper<AppForCatalogRow>()

const columns = [
  columnHelper.accessor('slug', {
    header: 'Slug',
    cell: (info) => <code className="text-xs truncate">{info.getValue()}</code>,
    size: 100,
  }),
  columnHelper.accessor('displayName', {
    header: 'Name',
    cell: (info) => (
      <Link to="/admin/app-for-catalog/$id" params={{ id: info.row.original.id }}>
        <span className="font-medium cursor-pointer hover:underline truncate">
          {info.getValue()}
        </span>
      </Link>
    ),
    size: 120,
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: (info) => {
      const desc = info.getValue()
      return (
        <span className="text-sm text-muted-foreground truncate" title={desc}>
          {desc}
        </span>
      )
    },
    size: 140,
  }),
  columnHelper.accessor('access', {
    header: 'Access',
    cell: (info) => (
      <span className="text-sm truncate">{info.getValue()?.type || 'N/A'}</span>
    ),
    size: 80,
  }),
  columnHelper.accessor('iconName', {
    header: 'Icon',
    cell: (info) => {
      const iconName = info.getValue()
      return iconName ? (
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img
            src={`/api/assets/by-name/${iconName}`}
            alt={iconName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )
    },
    size: 50,
  }),
  columnHelper.accessor('links', {
    header: 'Links',
    cell: (info) => (
      <span className="text-sm truncate">{info.getValue()?.length || 0}</span>
    ),
    size: 50,
  }),
  columnHelper.accessor('screenshotIds', {
    header: 'Screenshots',
    cell: (info) => (
      <span className="text-sm truncate">{info.getValue()?.length || 0}</span>
    ),
    size: 70,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    size: 100,
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (props) => <AppActions app={props.row.original} />,
    size: 70,
  }),
]

function AppActions({ app }: { app: AppForCatalogRow }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    ...trpc.appCatalogAdmin.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.appCatalogAdmin.list.queryKey() })
    },
  })

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        asChild
      >
        <Link to="/admin/app-for-catalog/$id" params={{ id: app.id }}>
          <Edit className="w-4 h-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (confirm(`Are you sure you want to delete "${app.displayName}"?`)) {
            deleteMutation.mutate({ id: app.id })
          }
        }}
        disabled={deleteMutation.isPending}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function AppCatalogAdminPage() {
  const trpc = useTRPC()
  const [globalFilter, setGlobalFilter] = useState('')

  const { data: apps = [], isLoading } = useQuery({
    ...trpc.appCatalogAdmin.list.queryOptions(),
  })

  const table = useReactTable({
    data: apps as Array<AppForCatalogRow>,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>App Catalog Management</CardTitle>
              <CardDescription>
                Manage apps in the catalog with full CRUD operations
              </CardDescription>
            </div>
            <Button asChild>
              <Link to="/admin/app-for-catalog/$id" params={{ id: 'new' }}>
                <Plus className="w-4 h-4 mr-2" />
                Add App
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search apps by name, slug, or description..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{
                            width: `${header.getSize()}px`,
                            minWidth: `${header.getSize()}px`,
                            maxWidth: `${header.getSize()}px`,
                          }}
                          className="overflow-hidden"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{
                              width: `${cell.column.getSize()}px`,
                              minWidth: `${cell.column.getSize()}px`,
                              maxWidth: `${cell.column.getSize()}px`,
                            }}
                            className="overflow-hidden"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No apps found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
