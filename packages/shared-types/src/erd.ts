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
