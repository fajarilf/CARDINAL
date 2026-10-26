import type { DatabaseSchema } from '@cardinal/shared-types/schema';
import { IntrospectionForeignKey } from './introspection-foreign-key.dto';
import { IntrospectionTable } from './introspection-table.dto';

export class IntrospectionDatabaseSchema implements DatabaseSchema {
  schema!: string;
  tables!: IntrospectionTable[];
  foreign_keys!: IntrospectionForeignKey[];
}
