import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/incidents/")({
  loader: () => {
    throw redirect({ to: "/" })
  },
})
