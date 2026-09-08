import { Injectable } from '@nestjs/common';
import {
  IntrospectionSession,
  SchemaIntrospector,
} from './introspector.interface';
import { Kysely, MysqlDialect, sql } from 'kysely';
import { createPool } from 'mysql2';
import { IntrospectionForeignKey } from '../dto/introspection-foreign-key.dto';
import { Column, IntrospectionTable } from '../dto/introspection-table.dto';

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
    const { rows } = await sql<{ name: string }>`
      SELECT SCHEMA_NAME AS name
      FROM information_schema.schemata
      WHERE SCHEMA_NAME NOT IN ('mysql', 'sys', 'information_schema', 'performance_schema')
      ORDER BY SCHEMA_NAME
    `.execute(this.db);

    return rows.map((d) => d.name);
  }

  async getTables(schema: string): Promise<IntrospectionTable[]> {
    const { rows: cols } = await sql<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: 'YES' | 'NO';
      column_default: string | null;
    }>`
      SELECT
        table_name     AS table_name,
        column_name    AS column_name,
        data_type      AS data_type,
        is_nullable    AS is_nullable,
        column_default AS column_default
      FROM information_schema.columns
      WHERE table_schema = ${schema}
      ORDER BY table_name, ordinal_position
    `.execute(this.db);

    const { rows: pks } = await sql<{
      table_name: string;
      column_name: string;
    }>`
      SELECT
        table_name  AS table_name,
        column_name AS column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = ${schema}
        AND constraint_name = 'PRIMARY'
    `.execute(this.db);

    const pkSet = new Set(pks.map((p) => `${p.table_name}.${p.column_name}`));

    const byTable = new Map<string, Column[]>();
    for (const c of cols) {
      const list = byTable.get(c.table_name) ?? [];
      list.push({
        name: c.column_name,
        data_type: c.data_type,
        nullable: c.is_nullable === 'YES',
        default: c.column_default,
        is_primary_key: pkSet.has(`${c.table_name}.${c.column_name}`),
      });
      byTable.set(c.table_name, list);
    }

    return [...byTable.entries()].map(([name, columns]) => ({ name, columns }));
  }

  async getForeignKeys(schema: string): Promise<IntrospectionForeignKey[]> {
    const { rows } = await sql<IntrospectionForeignKey>`
      SELECT
        constraint_name       AS constraint_name,
        table_name            AS source_table,
        column_name           AS source_column,
        referenced_table_name AS target_table,
        referenced_column_name AS target_column
      FROM information_schema.key_column_usage
      WHERE table_schema = ${schema}
        AND referenced_table_name IS NOT NULL
      ORDER BY constraint_name, ordinal_position
    `.execute(this.db);

    return rows;
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}
