import { Kysely, PostgresDialect } from 'kysely';
import { Migration, MigrationProvider, Migrator } from 'kysely/migration';
import { Pool } from 'pg';
import { env } from '../config/env';
import { Databases } from './database.type';
import * as createConnections from './migrations/001_create_connections';
import * as addConnectionName from './migrations/002_add_connection_name';
import * as addDatabaseType from './migrations/003_add_database_type';
import * as addDatabaseName from './migrations/004_add_database_name';
import * as createDesigns from './migrations/005_create_designs';

// ponytail: explicit map instead of FileMigrationProvider — dodges ts-node
// dynamic-import-of-.ts flakiness on Windows. Add a line per new migration.
class StaticProvider implements MigrationProvider {
  getMigrations(): Promise<Record<string, Migration>> {
    return Promise.resolve({
      '001_create_connections': createConnections,
      '002_add_connection_name': addConnectionName,
      '003_add_database_type': addDatabaseType,
      '004_add_database_name': addDatabaseName,
      '005_create_designs': createDesigns,
    });
  }
}

async function main() {
  const direction = process.argv[2] === 'down' ? 'down' : 'latest';

  const db = new Kysely<Databases>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: env.databaseUrl }),
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
