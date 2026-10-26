import type {
  Column as SchemaColumn,
  Table,
} from '@cardinal/shared-types/schema';

export class IntrospectionTable implements Table {
  name!: string;
  columns!: Column[];
}

export class Column implements SchemaColumn {
  name!: string;
  data_type!: string;
  nullable!: boolean;
  default!: string | null;
  is_primary_key!: boolean;
}
