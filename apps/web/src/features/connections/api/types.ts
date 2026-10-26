/* ---------------------------- view-model ---------------------------- *
 * Shapes the connections UI renders. Adapted from ApiConnection by
 * ./to-view-model.ts. Kept separate because the API row and the design
 * mock don't line up 1:1 (host vs ip_address, engine vs numeric database,
 * no db-name / tables / lastSynced on the API).
 * ------------------------------------------------------------------ */

import type { Engine } from "@cardinal/shared-types/erd";
export type { Engine } from "@cardinal/shared-types/erd";

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

export const DATABASE = { mysql: 0, postgresql: 1 } as const;
export type {
  DatabaseId,
  ConnectionResponse as ApiConnection,
  ConnectionRequest,
} from "@cardinal/shared-types/connections";
