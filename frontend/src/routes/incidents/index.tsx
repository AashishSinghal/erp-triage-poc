import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/incidents/")({
  loader: () => {
    throw redirect({
      to: "/",
      search: {
        search: "",
        erpModule: "",
        environment: "",
        sortBy: "updatedAt",
        sortOrder: "desc",
        limit: undefined,
      },
    })
  },
})
