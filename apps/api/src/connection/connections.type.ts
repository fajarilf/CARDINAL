import { ColumnType, Generated } from 'kysely';

export enum DATABASE {
  mysql,
  postgresql,
}

export interface ConnectionTable {
  id: Generated<number>;
  name: string | null;
  database: DATABASE;
  database_name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, never, string | undefined>;
}
