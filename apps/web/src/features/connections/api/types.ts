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
