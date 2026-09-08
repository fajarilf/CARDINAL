import { API_BASE } from "@/config/env";
import { JSON_HEADERS, readEnvelope } from "@/lib/api";
import type { ApiIntrospectionSchema } from "./types";

export function fetchErdSchema(
  connectionId: number,
): Promise<ApiIntrospectionSchema> {
  return fetch(`${API_BASE}/introspections/${connectionId}`, {
    headers: JSON_HEADERS,
  }).then(readEnvelope<ApiIntrospectionSchema>);
}
