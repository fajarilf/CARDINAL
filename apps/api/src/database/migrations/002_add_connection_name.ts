import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('connections')
    .addColumn('name', 'varchar(255)') // nullable — matches `name: string | undefined`
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('connections').dropColumn('name').execute();
}
