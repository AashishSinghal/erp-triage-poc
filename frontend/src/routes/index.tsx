import { createFileRoute } from "@tanstack/react-router"
import type { Environment, ErpModule } from "@/types/incident"

import { IncidentsList } from "@/pages/IncidentsList"

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    const limitRaw = search.limit
    const limit =
      typeof limitRaw === "string" && Number.isFinite(Number(limitRaw))
        ? Number(limitRaw)
        : undefined
    return {
      search: typeof search.search === "string" ? search.search : "",
      erpModule: typeof search.erpModule === "string" ? (search.erpModule as ErpModule) : "",
      environment:
        typeof search.environment === "string"
          ? (search.environment as Environment)
          : "",
      sortBy:
        search.sortBy === "createdAt" || search.sortBy === "updatedAt"
          ? search.sortBy
          : "updatedAt",
      sortOrder:
        search.sortOrder === "asc" || search.sortOrder === "desc"
          ? search.sortOrder
          : "desc",
      limit,
    }
  },
  component: IncidentsList,
})
