import { Injectable } from '@nestjs/common';
import {
  IntrospectionSession,
  SchemaIntrospector,
} from './introspector.interface';
import { Kysely, MysqlDialect, sql } from 'kysely';
import { createPool } from 'mysql2';

@Injectable()
export class MySqlIntrospector implements SchemaIntrospector {
  connect(connString: string): IntrospectionSession {
    const db = new Kysely<any>({
      dialect: new MysqlDialect({
        pool: createPool(connString),
      }),
    });

    return new MySqlSession(db);
  }
}

export class MySqlSession implements IntrospectionSession {
  constructor(private readonly db: Kysely<any>) {}

  async getSchemas(): Promise<string[]> {
    const result = await sql<{ name: string }>`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('mysql', 'sys', 'information_schema', 'performance_schema')
      ORDER BY schema_name
    `.execute(this.db);

    return result.rows.map((d) => d.name);
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}
