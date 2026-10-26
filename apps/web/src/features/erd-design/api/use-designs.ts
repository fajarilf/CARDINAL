import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDesign, fetchDesign, fetchDesigns, updateDesign } from "./designs.service";
import type { CreateDesignRequest } from "./types";

export const designKeys = {
  all: ["designs"] as const,
  list: () => ["designs", "list"] as const,
  detail: (id: number) => ["designs", "detail", id] as const,
};

export function useDesigns() {
  return useQuery({ queryKey: designKeys.list(), queryFn: fetchDesigns });
}

export function useDesign(id: number | undefined) {
  return useQuery({
    queryKey: designKeys.detail(id ?? 0),
    queryFn: () => fetchDesign(id!),
    enabled: id !== undefined,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useSaveDesign() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, revision, ...body }: CreateDesignRequest & { id?: number; revision: number | null }) => {
      if (id !== undefined) {
        if (revision === null) throw new Error("Reload the design before saving.");
        return updateDesign(id, { ...body, revision });
      }
      return createDesign(body);
    },
    onSuccess: (design) => {
      client.setQueryData(designKeys.detail(design.id), design);
      void client.invalidateQueries({ queryKey: designKeys.list() });
    },
  });
}
