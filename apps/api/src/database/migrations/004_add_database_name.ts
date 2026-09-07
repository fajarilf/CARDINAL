import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('connections')
    .addColumn('database_name', 'varchar(255)')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('connections')
    .dropColumn('database_name')
    .execute();
}
