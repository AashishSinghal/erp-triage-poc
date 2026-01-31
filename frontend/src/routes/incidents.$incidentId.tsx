import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatRelative } from "date-fns";

import { fetchIncident, retryIncidentEnrichment } from "@/services/incidents";
import { Header } from "@/components/incidents/Header";
import { MoveLeft, RotateCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/incidents/$incidentId")({
  loader: async ({ params }) => {
    const incident = await fetchIncident(params.incidentId);
    return { incident };
  },
  component: IncidentDetail,
});

function IncidentDetail() {
  const { incident: initialIncident } = Route.useLoaderData();
  const [incident, setIncident] = useState(initialIncident);
  const createdAt = incident?.createdAt
    ? formatRelative(new Date(incident.createdAt), new Date())
    : "-";
  const updatedAt = incident?.updatedAt
    ? formatRelative(new Date(incident.updatedAt), new Date())
    : "-";
  const status = incident?.status ?? "UNKNOWN";
  const statusClass = (() => {
    switch (status) {
      case "ENRICHED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "FAILED":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  })();
  const [copied, setCopied] = useState(false);
  const handleCopyId = async () => {
    if (!incident?.id) return;
    try {
      await navigator.clipboard.writeText(incident.id);
      setCopied(true);
    } catch {
      // noop
    }
  };
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const retryMutation = useMutation({
    mutationFn: () => retryIncidentEnrichment(incident?.id ?? ""),
    onSuccess: (data) => {
      setIncident(data);
    },
  });

  return (
    <div className="app-shell min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
        <Link
          to="/"
          className="text-xs uppercase tracking-[0.2em] text-slate-500 flex gap-2 mb-2"
        >
          <MoveLeft className="h-4 w-4" />
          Back to incidents
        </Link>
        <div className="mb-6 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <h2 className="text-2xl font-semibold text-slate-900">
              {incident?.title ?? "Incident"}
            </h2>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${statusClass} cursor-pointer`}
            >
              {status}
            </span>
            {status === "FAILED" && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 cursor-pointer"
                disabled={retryMutation.isPending}
                onClick={() => retryMutation.mutate()}
                title="Retry enrichment"
              >
                <RotateCw className="h-3 w-3" />
                {retryMutation.isPending ? "Retrying" : "Retry"}
              </button>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="group inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                >
                  <span className="uppercase tracking-wide text-[10px] text-slate-500">
                    Incident ID
                  </span>
                  <span className="font-mono text-slate-700">
                    {incident?.id ?? "N/A"}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied" : "Click to copy"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                {incident?.description ?? "No description provided."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                AI Summary
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                {incident?.summary ?? "Summary will appear after enrichment."}
              </p>
              <h3 className="mt-5 text-sm font-semibold text-slate-900">
                Suggested Next Step
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                {incident?.suggestion ??
                  "Suggestion will appear after enrichment."}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Incident Details
              </h2>
              <dl className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Category
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {incident?.category ?? "UNKNOWN"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Business Unit
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {incident?.businessUnit ?? "-"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Environment
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {incident?.environment ?? "UNKNOWN"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    ERP Module
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {incident?.erpModule ?? "UNKNOWN"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Created
                  </dt>
                  <dd className="font-medium text-slate-900">{createdAt}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Updated
                  </dt>
                  <dd className="font-medium text-slate-900">{updatedAt}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
