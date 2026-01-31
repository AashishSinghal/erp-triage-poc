import { useNavigate } from "@tanstack/react-router"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Incident } from "@/types/incident"
import { incidentColumns } from "@/components/incidents/columns"

type IncidentsTableProps = {
  data: Incident[]
}

export const IncidentsTable = ({ data }: IncidentsTableProps) => {
  const navigate = useNavigate()
  const table = useReactTable({
    data,
    columns: incidentColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Incidents</h2>
          <p className="text-xs text-slate-500">Click a row to view details.</p>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.className as string | undefined}
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
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey) {
                      window.open(`/incidents/${row.original.id}`, "_blank")
                      return
                    }
                    navigate({ to: "/incidents/$incidentId", params: { incidentId: row.original.id } })
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className as string | undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={incidentColumns.length} className="h-24 text-center">
                  No incidents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
