import type { DesignDocument } from '@cardinal/shared-types/designs';
import type { ColumnType, Generated, JSONColumnType } from 'kysely';

export interface DesignTable {
  id: Generated<number>;
  name: string;
  document: JSONColumnType<DesignDocument>;
  revision: Generated<number>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
}
