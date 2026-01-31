import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Header } from "@/components/incidents/Header"
import { Filters } from "@/components/incidents/Filters"
import { IncidentsTable } from "@/components/incidents/IncidentsTable"
import { fetchIncidents } from "@/services/incidents"
import { Environment, ErpModule } from "@/types/incident"

export const IncidentsList = () => {
  const [search, setSearch] = useState("")
  const [erpModule, setErpModule] = useState<ErpModule | "">("")
  const [environment, setEnvironment] = useState<Environment | "">("")

  const incidentsQuery = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  })

  const filteredItems = useMemo(() => {
    const items = incidentsQuery.data?.items ?? []
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      const matchesModule = !erpModule || item.erpModule === erpModule
      const matchesEnv = !environment || item.environment === environment
      return matchesSearch && matchesModule && matchesEnv
    })
  }, [incidentsQuery.data, search, erpModule, environment])

  return (
    <div className="app-shell min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">
        <section className="grid gap-6">
          <Filters
            search={search}
            onSearchChange={setSearch}
            erpModule={erpModule}
            onModuleChange={setErpModule}
            environment={environment}
            onEnvironmentChange={setEnvironment}
            onClear={() => {
              setSearch("")
              setErpModule("")
              setEnvironment("")
            }}
            resultCount={filteredItems.length}
          />

          {incidentsQuery.isLoading && (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading incidents...
            </div>
          )}
          {incidentsQuery.isError && (
            <div className="rounded-2xl border border-red-200/60 bg-white p-6 text-sm text-red-600 shadow-sm">
              Failed to load incidents.
            </div>
          )}
          {!incidentsQuery.isLoading && !incidentsQuery.isError && (
            <IncidentsTable data={filteredItems} />
          )}
        </section>
      </main>
    </div>
  )
}
