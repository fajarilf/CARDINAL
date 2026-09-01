import { ColumnType, Generated } from 'kysely';

export interface ConnectionTable {
  id: Generated<number>;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, never, string | undefined>;
}
