import { useQuery } from "@tanstack/react-query";
import { fetchErdSchema } from "./introspection.service";

export const erdKeys = {
  all: ["erd"] as const,
  schema: (id: number) => [...erdKeys.all, "schema", id] as const,
};

export function useErdSchema(connectionId: number) {
  return useQuery({
    queryKey: erdKeys.schema(connectionId),
    queryFn: () => fetchErdSchema(connectionId),
    enabled: Number.isFinite(connectionId),
    retry: false, // introspection failures (bad creds/host) are deterministic
  });
}
