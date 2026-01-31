import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import type { IncidentListResponse } from "@/types/incident"

type IncidentFeedProps = {
  isLoading: boolean
  isError: boolean
  items: IncidentListResponse["items"]
  nextToken?: string
}

export const IncidentFeed = ({ isLoading, isError, items, nextToken }: IncidentFeedProps) => {
  const firstIncidentId = items[0]?.id
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Incident Feed (raw)</h2>
          <p className="text-xs text-slate-500">Raw API payload for quick inspection.</p>
        </div>
        <Button variant="secondary" size="sm">
          Export JSON
        </Button>
      </div>
      <div className="mt-4">
        {isLoading && <p className="text-sm text-slate-500">Loading incidents...</p>}
        {isError && <p className="text-sm text-red-600">Failed to load incidents.</p>}
        {!isLoading && !isError && (
          <Link
            to="/incidents/$incidentId"
            params={{ incidentId: firstIncidentId ?? "" }}
            className={firstIncidentId ? "block" : "pointer-events-none"}
          >
            <pre className="max-h-[420px] w-full max-w-full overflow-auto break-words whitespace-pre-wrap rounded-lg bg-slate-950/95 p-4 text-xs text-slate-100">
              {JSON.stringify(
                {
                  items,
                  nextToken: nextToken ?? null,
                },
                null,
                2
              )}
            </pre>
          </Link>
        )}
      </div>
    </div>
  )
}
