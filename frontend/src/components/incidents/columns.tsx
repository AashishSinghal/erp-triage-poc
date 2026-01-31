import type { ColumnDef } from "@tanstack/react-table"

import type { Incident } from "@/types/incident"

export const incidentColumns: ColumnDef<Incident>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="font-medium text-slate-900">{row.original.title}</div>
    ),
  },
  {
    accessorKey: "erpModule",
    header: "Module",
  },
  {
    accessorKey: "environment",
    header: "Env",
    meta: { className: "hidden sm:table-cell" },
    cell: ({ row }) => (
      <span className="hidden sm:inline">{row.original.environment}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { className: "hidden md:table-cell" },
    cell: ({ row }) => (
      <span className="hidden md:inline">{row.original.status}</span>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severity",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => (
      <span className="hidden lg:inline">{row.original.severity ?? "-"}</span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => {
      const value = row.original.updatedAt
      return (
        <span className="hidden lg:inline">
          {value ? new Date(value).toLocaleString() : "-"}
        </span>
      )
    },
  },
]
