/* ---------------------------- view-model ---------------------------- *
 * Shapes the connections UI renders. Adapted from ApiConnection by
 * ./to-view-model.ts. Kept separate because the API row and the design
 * mock don't line up 1:1 (host vs ip_address, engine vs numeric database,
 * no db-name / tables / lastSynced on the API).
 * ------------------------------------------------------------------ */

export type Engine = "postgresql" | "mysql";

export interface Connection {
  id: string;
  name: string;
  engine: Engine;
  host: string;
  port: string;
  database: string;
  user: string;
  password?: string;
  tables: number | null;
  lastSynced: string;
  current: boolean;
}

export interface Draft {
  id?: string;
  name: string;
  engine: Engine;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

/* ------------------------------ wire ------------------------------- *
 * Matches apps/api: ConnectionResponseDto inside AppSuccessResponse.
 * ------------------------------------------------------------------ */

export const DATABASE = { mysql: 0, postgresql: 1 } as const;
export type DatabaseId = (typeof DATABASE)[keyof typeof DATABASE];

export interface ApiConnection {
  id: number;
  name: string | null;
  database: DatabaseId;
  database_name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

// POST / PATCH body
export interface ConnectionRequest {
  ip_address: string;
  name: string;
  database: DatabaseId;
  database_name: string;
  port: number;
  username: string;
  password: string;
}
