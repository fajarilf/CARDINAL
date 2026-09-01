import { Kysely, PostgresDialect } from 'kysely';
import { Migration, MigrationProvider, Migrator } from 'kysely/migration';
import { Pool } from 'pg';
import { Databases } from './database.type';
import * as createConnections from './migrations/001_create_connections';

// ponytail: explicit map instead of FileMigrationProvider — dodges ts-node
// dynamic-import-of-.ts flakiness on Windows. Add a line per new migration.
class StaticProvider implements MigrationProvider {
  getMigrations(): Promise<Record<string, Migration>> {
    return Promise.resolve({
      '001_create_connections': createConnections,
    });
  }
}

async function main() {
  const direction = process.argv[2] === 'down' ? 'down' : 'latest';

  const db = new Kysely<Databases>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
    }),
  });

  const migrator = new Migrator({ db, provider: new StaticProvider() });

  const { error, results } =
    direction === 'down'
      ? await migrator.migrateDown()
      : await migrator.migrateToLatest();

  for (const r of results ?? []) {
    const mark = r.status === 'Success' ? '✓' : '✗';
    console.log(`${mark} ${r.migrationName} (${r.direction})`);
  }

  await db.destroy();

  if (error) {
    console.error('migration failed:', error);
    process.exit(1);
  }
  if (!results?.length) console.log('no migrations to run');
}

void main();
