import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConnection,
  deleteConnection,
  fetchConnection,
  fetchConnections,
  updateConnection,
} from "./connections.service";
import type { ConnectionRequest } from "./types";

export const connectionKeys = {
  all: ["connections"] as const,
  list: () => [...connectionKeys.all, "list"] as const,
  detail: (id: number) => [...connectionKeys.all, "detail", id] as const,
};

export function useConnections() {
  return useQuery({
    queryKey: connectionKeys.list(),
    queryFn: fetchConnections,
  });
}

export function useConnection(id: number) {
  return useQuery({
    queryKey: connectionKeys.detail(id),
    queryFn: () => fetchConnection(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConnection,
    onSuccess: () => qc.invalidateQueries({ queryKey: connectionKeys.all }),
  });
}

export function useUpdateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Partial<ConnectionRequest>;
    }) => updateConnection(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: connectionKeys.all }),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => qc.invalidateQueries({ queryKey: connectionKeys.all }),
  });
}
