import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { Trash2, Upload } from 'lucide-react'
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

type Icon = {
  id: string
  name: string
  mimeType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

const columnHelper = createColumnHelper<Icon>()

const columns = [
  columnHelper.display({
    id: 'preview',
    header: 'Preview',
    cell: (props) => (
      <div className="w-12 h-12 flex items-center justify-center">
        <img
          src={`/api/icons/${props.row.original.id}`}
          alt={props.row.original.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    ),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('mimeType', {
    header: 'Type',
  }),
  columnHelper.accessor('fileSize', {
    header: 'Size',
    cell: (info) => `${(info.getValue() / 1024).toFixed(1)} KB`,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor('updatedAt', {
    header: 'Updated',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (props) => <IconActions icon={props.row.original} />,
  }),
]

function IconActions({ icon }: { icon: Icon }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const deleteMutation = useMutation({
    ...trpc.icon.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.icon.list.queryKey() })
    },
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => deleteMutation.mutate({ id: icon.id })}
      disabled={deleteMutation.isPending}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}

function IconUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [iconName, setIconName] = useState('')
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIconName(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !iconName) return

    const formData = new FormData()
    formData.append('name', iconName)
    formData.append('icon', selectedFile)

    const response = await fetch('/api/icons/upload', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: trpc.icon.list.queryKey() })
      setSelectedFile(null)
      setIconName('')
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Upload Icon</CardTitle>
        <CardDescription>
          Upload SVG, PNG, JPEG, or WebP icons (stored as binary in database)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Icon Name</label>
            <Input
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder="icon-name"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">File</label>
            <Input
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !iconName}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function IconTable() {
  const trpc = useTRPC()
  const { data: icons = [], isLoading } = useQuery(trpc.icon.list.queryOptions())

  const table = useReactTable({
    data: icons,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Icons ({icons.length})</CardTitle>
        <CardDescription>Manage application icons</CardDescription>
      </CardHeader>
      <CardContent>
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
                          header.getContext()
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
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function IconManagementPage() {
  return (
    <div className="container mx-auto p-8">
      <IconUploadForm />
      <IconTable />
    </div>
  )
}
