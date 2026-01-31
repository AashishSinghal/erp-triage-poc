import { createFileRoute, Link } from "@tanstack/react-router";

import { fetchIncident } from "@/services/incidents";
import { Header } from "@/components/incidents/Header";
import { MoveLeft } from "lucide-react";

export const Route = createFileRoute("/incidents/$incidentId")({
  loader: async ({ params }) => {
    const incident = await fetchIncident(params.incidentId);
    return { incident };
  },
  component: IncidentDetail,
});

function IncidentDetail() {
  const { incident } = Route.useLoaderData();
  const createdAt = incident?.createdAt
    ? new Date(incident.createdAt).toLocaleString()
    : "-";
  const updatedAt = incident?.updatedAt
    ? new Date(incident.updatedAt).toLocaleString()
    : "-";

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
          <h2 className="text-2xl font-semibold text-slate-900">
            {incident?.title ?? "Incident"}
          </h2>
          <div className="text-xs text-slate-500">
            Incident ID:{" "}
            <span className="font-mono text-slate-700">
              {incident?.id ?? "N/A"}
            </span>
          </div>
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
