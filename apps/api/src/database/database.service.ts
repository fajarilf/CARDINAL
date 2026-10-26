import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Databases } from './database.type';
import { Pool } from 'pg';
import { env } from '../config/env';

@Injectable()
export class DatabaseService
  extends Kysely<Databases>
  implements OnModuleDestroy
{
  constructor() {
    super({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: env.databaseUrl }),
      }),
    });
  }

  async onModuleDestroy() {
    await this.destroy();
  }
}
