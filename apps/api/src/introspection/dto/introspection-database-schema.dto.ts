import { IntrospectionForeignKey } from './introspection-foreign-key.dto';
import { IntrospectionTable } from './introspection-table.dto';

export class IntrospectionDatabaseSchema {
  schema!: string;
  tables!: IntrospectionTable[];
  foreign_keys!: IntrospectionForeignKey[];
}
