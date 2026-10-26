import { API_BASE } from "@/config/env";
import { JSON_HEADERS, readEnvelope } from "@/lib/api";
import type { CreateDesignRequest, DesignSummary, SavedDesign, UpdateDesignRequest } from "./types";

export function fetchDesigns(): Promise<DesignSummary[]> {
  return fetch(`${API_BASE}/designs`, { headers: JSON_HEADERS }).then(readEnvelope<DesignSummary[]>);
}

export function fetchDesign(id: number): Promise<SavedDesign> {
  return fetch(`${API_BASE}/designs/${id}`, { headers: JSON_HEADERS }).then(readEnvelope<SavedDesign>);
}

export function createDesign(body: CreateDesignRequest): Promise<SavedDesign> {
  return fetch(`${API_BASE}/designs`, {
    method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body),
  }).then(readEnvelope<SavedDesign>);
}

export function updateDesign(id: number, body: UpdateDesignRequest): Promise<SavedDesign> {
  return fetch(`${API_BASE}/designs/${id}`, {
    method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(body),
  }).then(readEnvelope<SavedDesign>);
}
