import { API_BASE } from "@/config/env";
import type {
  ApiConnection,
  ApiEnvelope,
  ConnectionRequest,
} from "./types";

const JSON_HEADERS = {
  "content-type": "application/json",
  accept: "application/json",
};

// Unwrap { status, code, data } — or surface the API's AppErrorResponse.message.
async function readEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T> & { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return body.data;
}

export function fetchConnections(): Promise<ApiConnection[]> {
  return fetch(`${API_BASE}/connections`, { headers: JSON_HEADERS }).then(
    readEnvelope<ApiConnection[]>,
  );
}

// Test reachability by listing the schemas the credentials can see.
export function introspectSchemas(params: {
  ip_address: string;
  port: string;
  username: string;
  password: string;
  database_name: string;
}): Promise<string[]> {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${API_BASE}/introspections?${qs}`, {
    headers: JSON_HEADERS,
  }).then(readEnvelope<string[]>);
}

export function createConnection(
  body: ConnectionRequest,
): Promise<ApiConnection> {
  return fetch(`${API_BASE}/connections`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  }).then(readEnvelope<ApiConnection>);
}

export function updateConnection(
  id: number,
  body: Partial<ConnectionRequest>,
): Promise<ApiConnection> {
  return fetch(`${API_BASE}/connections/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  }).then(readEnvelope<ApiConnection>);
}

export async function deleteConnection(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/connections/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    // 204 has no body; an error response does
    const body = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }
}
