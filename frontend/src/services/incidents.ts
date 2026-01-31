import type { CreateIncidentInput, IncidentListResponse } from "@/types/incident"

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export type IncidentQueryParams = {
  search?: string
  erpModule?: string
  environment?: string
  status?: string
  severity?: string
  sortBy?: "createdAt" | "updatedAt"
  sortOrder?: "asc" | "desc"
  limit?: number
  nextToken?: string
}

const toQueryString = (params: IncidentQueryParams) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  if (!entries.length) {
    return ""
  }
  const searchParams = new URLSearchParams()
  for (const [key, value] of entries) {
    searchParams.set(key, String(value))
  }
  return `?${searchParams.toString()}`
}

export const fetchIncidents = async (
  params: IncidentQueryParams = {}
): Promise<IncidentListResponse> => {
  const response = await fetch(`${API_BASE}/incidents${toQueryString(params)}`)
  if (!response.ok) {
    throw new Error("Failed to fetch incidents")
  }
  return response.json()
}

export const createIncident = async (payload: CreateIncidentInput) => {
  const response = await fetch(`${API_BASE}/incidents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("Failed to create incident")
  }
  return response.json()
}

export const fetchIncident = async (id: string) => {
  const response = await fetch(`${API_BASE}/incidents/${id}`)
  if (!response.ok) {
    throw new Error("Failed to fetch incident")
  }
  return response.json()
}

export const retryIncidentEnrichment = async (id: string) => {
  const response = await fetch(`${API_BASE}/incidents/${id}/retry-enrichment`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error("Failed to retry enrichment")
  }
  return response.json()
}
