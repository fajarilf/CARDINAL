import { IntrospectionForeignKey } from '../dto/introspection-foreign-key.dto';
import { IntrospectionTable } from '../dto/introspection-table.dto';

export interface SchemaIntrospector {
  connect(connString: string): IntrospectionSession;
}

export interface IntrospectionSession {
  getSchemas(): Promise<string[]>;
  getTables(schema: string): Promise<IntrospectionTable[]>;
  getForeignKeys(schema: string): Promise<IntrospectionForeignKey[]>;
  close(): Promise<void>;
}
