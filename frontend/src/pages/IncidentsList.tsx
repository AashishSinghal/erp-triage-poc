import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Header } from "@/components/incidents/Header";
import { Filters } from "@/components/incidents/Filters";
import { IncidentsTable } from "@/components/incidents/IncidentsTable";
import { fetchIncidents } from "@/services/incidents";
import type { IncidentListResponse } from "@/types/incident";

export const IncidentsList = () => {
  const searchParams = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const { search, erpModule, environment, sortBy, sortOrder, limit } =
    searchParams;
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          search: searchInput,
        }),
      });
    }, 300);

    return () => clearTimeout(handle);
  }, [navigate, searchInput]);

  const incidentsQuery = useInfiniteQuery<
    IncidentListResponse,
    Error,
    InfiniteData<IncidentListResponse>,
    (string | number | undefined)[],
    string
  >({
    queryKey: [
      "incidents",
      search,
      erpModule,
      environment,
      sortBy,
      sortOrder,
      limit,
    ],
    queryFn: ({ pageParam }) =>
      fetchIncidents({
        search: search || undefined,
        erpModule: erpModule || undefined,
        environment: environment || undefined,
        sortBy,
        sortOrder,
        limit: typeof limit === "number" ? limit : undefined,
        nextToken: pageParam || undefined,
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextToken,
  });

  const items = useMemo(
    () => incidentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [incidentsQuery.data],
  );

  return (
    <div className="app-shell min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">
        <section className="grid gap-6">
          <Filters
            search={searchInput}
            onSearchChange={setSearchInput}
            erpModule={erpModule}
            onModuleChange={(value) =>
              navigate({
                search: (prev) => ({ ...prev, erpModule: value || "" }),
              })
            }
            environment={environment}
            onEnvironmentChange={(value) =>
              navigate({
                search: (prev) => ({ ...prev, environment: value || "" }),
              })
            }
            sortBy={sortBy}
            onSortByChange={(value) =>
              navigate({
                search: (prev) => ({ ...prev, sortBy: value }),
              })
            }
            sortOrder={sortOrder}
            onSortOrderChange={(value) =>
              navigate({
                search: (prev) => ({ ...prev, sortOrder: value }),
              })
            }
            limit={typeof limit === "number" ? limit : 25}
            onLimitChange={(value) =>
              navigate({
                search: (prev) => ({ ...prev, limit: value }),
              })
            }
            onClear={() => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  search: "",
                  erpModule: "",
                  environment: "",
                }),
              });
            }}
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
            <>
              <IncidentsTable data={items} />
              {incidentsQuery.hasNextPage && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                    onClick={() => incidentsQuery.fetchNextPage()}
                    disabled={incidentsQuery.isFetchingNextPage}
                  >
                    {incidentsQuery.isFetchingNextPage
                      ? "Loading..."
                      : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};
