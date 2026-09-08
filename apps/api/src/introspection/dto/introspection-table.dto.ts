export class IntrospectionTable {
  name!: string;
  columns!: Column[];
}

export class Column {
  name!: string;
  data_type!: string;
  nullable!: boolean;
  default!: string | null;
  is_primary_key!: boolean;
}
