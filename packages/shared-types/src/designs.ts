import type { ErdEdge, ErdTable } from "./erd";

export interface DesignDocument {
  tables: ErdTable[];
  edges: ErdEdge[];
}

export interface CreateDesignRequest {
  name: string;
  document: DesignDocument;
}

export interface UpdateDesignRequest extends CreateDesignRequest {
  revision: number;
}

export interface DesignSummary<TDate = string> {
  id: number;
  name: string;
  revision: number;
  created_at: TDate;
  updated_at: TDate;
}

export interface SavedDesign<TDate = string> extends DesignSummary<TDate> {
  document: DesignDocument;
}
