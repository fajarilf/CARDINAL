import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('connections')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('ip_address', 'varchar(45)', (col) => col.notNull())
    .addColumn('port', 'integer', (col) => col.notNull())
    .addColumn('username', 'varchar(255)', (col) => col.notNull())
    .addColumn('password', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
  // ponytail: updated_at auto-touch needs a trigger; add when rows actually get updated
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('connections').execute();
}
