import type { CreateIncidentInput, IncidentListResponse } from "@/types/incident"

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export const fetchIncidents = async (): Promise<IncidentListResponse> => {
  const response = await fetch(`${API_BASE}/incidents`)
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
    throw new Error("Failed to fetch incidentP")
  }
  return response.json()
}
