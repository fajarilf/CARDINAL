export interface Column {
  name: string;
  data_type: string;
  nullable: boolean;
  default: string | null;
  is_primary_key: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface ForeignKey {
  constraint_name: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
}

export interface DatabaseSchema {
  schema: string;
  tables: Table[];
  foreign_keys: ForeignKey[];
}
