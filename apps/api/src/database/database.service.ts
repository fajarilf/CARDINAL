import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Databases } from './database.type';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService
  extends Kysely<Databases>
  implements OnModuleDestroy
{
  constructor() {
    super({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      }),
    });
  }

  async onModuleDestroy() {
    await this.destroy();
  }
}
