import type { ForeignKey } from '@cardinal/shared-types/schema';

export class IntrospectionForeignKey implements ForeignKey {
  constraint_name!: string;
  source_table!: string;
  source_column!: string;
  target_table!: string;
  target_column!: string;
}
