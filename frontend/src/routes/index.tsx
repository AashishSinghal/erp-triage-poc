import { createFileRoute } from "@tanstack/react-router"

import { IncidentsList } from "@/pages/IncidentsList"

export const Route = createFileRoute("/")({
  component: IncidentsList,
})
