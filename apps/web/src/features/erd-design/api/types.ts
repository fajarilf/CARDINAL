// Domain model is the same shape the ERD viewer uses — re-exported through its
// public surface rather than duplicated.
export type {
  Engine,
  ErdColumn,
  ErdTable,
  ErdEndpoint,
  ErdEdgeData as ErdEdge,
  ErdSchema,
} from "@/features/erd";

export type {
  DesignDocument,
  CreateDesignRequest,
  UpdateDesignRequest,
  DesignSummary,
  SavedDesign,
} from "@cardinal/shared-types/designs";

export type DesignSelection =
  | { kind: "table"; id: string }
  | { kind: "edge"; id: string }
  | null;
