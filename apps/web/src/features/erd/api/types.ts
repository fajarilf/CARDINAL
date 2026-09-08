export type Engine = "postgresql" | "mysql";

export interface ErdColumn {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
}

export interface ErdTable {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: ErdColumn[];
}

export interface ErdEndpoint {
  table: string;
  col: string;
}

export interface ErdEdge {
  id: string;
  from: ErdEndpoint;
  to: ErdEndpoint;
}

export interface ErdSchema {
  schema: string;
  tables: ErdTable[];
  edges: ErdEdge[];
}

/* ------------------------------ wire ------------------------------- *
 * GET /api/introspections/:connection_id → AppSuccessResponse.data.
 * Matches apps/api/src/introspection/dto/.
 * ------------------------------------------------------------------ */

export interface ApiColumn {
  name: string;
  data_type: string;
  nullable: boolean;
  default: string | null;
  is_primary_key: boolean;
}

export interface ApiIntrospectionTable {
  name: string;
  columns: ApiColumn[];
}

export interface ApiForeignKey {
  constraint_name: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
}

export interface ApiIntrospectionSchema {
  schema: string;
  tables: ApiIntrospectionTable[];
  foreign_keys: ApiForeignKey[];
}
