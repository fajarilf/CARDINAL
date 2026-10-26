import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('designs')
    .addColumn('id', 'serial', (column) => column.primaryKey())
    .addColumn('name', 'varchar(128)', (column) => column.notNull())
    .addColumn('document', 'jsonb', (column) => column.notNull())
    .addColumn('revision', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('created_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('designs').execute();
}
