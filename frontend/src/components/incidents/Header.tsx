import { NewIncidentDialog } from "@/components/incidents/NewIncidentDialog"

export const Header = () => {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
              ERP Triage Solution
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Incident Hub
            </h1>
            <p className="max-w-xl text-sm text-slate-600">
              Track ERP incidents, triage quickly, and capture AI-driven summaries for faster resolution.
            </p>
          </div>
        </div>
        <NewIncidentDialog />
      </div>
    </header>
  )
}
