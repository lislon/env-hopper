import { resolveTemplate } from '@env-hopper/shared-core'
import type { ColumnDef } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import type { ResourceJumpUI } from '~/modules/resourceJump/types'
import { EnvAutoComplete } from '~/modules/resourceJump/ui/cmdk/EnvAutocomplete'
import { formatResourceTitle } from '~/modules/resourceJump/utils/helpers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/ui/table'

type Row = ResourceJumpUI

export function AppCatalogPage() {
	const { resourceJumps, isLoadingResourceJumps } = useResourceJumpContext()
	const { currentEnv } = useEnvironmentContext()

	const columns = useMemo<Array<ColumnDef<Row>>>(
		() => [
			{
				id: 'title',
				header: 'ResourceJump Title',
				cell: ({ row }) => formatResourceTitle(row.original),
			},
			{
				id: 'urlPattern',
				header: 'URL pattern',
				cell: ({ row }) => {
					if (!currentEnv?.slug) {
						return row.original.urlTemplate.default
					}
					return resolveTemplate(currentEnv.slug, row.original.urlTemplate)
				},
			},
		],
		[currentEnv?.slug],
	)

	const table = useReactTable({
		data: resourceJumps,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	if (isLoadingResourceJumps) {
		return <div className="py-6 text-muted-foreground">Loading…</div>
	}

	return (
		<div className="py-6 flex flex-col gap-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="font-medium">Apps</div>
					<div className="text-sm text-muted-foreground">
						{resourceJumps.length} resource jumps
					</div>
				</div>
				<div className="w-[320px]">
					<EnvAutoComplete />
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

