import { BadRequestException, Injectable } from '@nestjs/common';
import { SchemaIntrospector } from './adapters/introspector.interface';
import { MySqlIntrospector } from './adapters/mysql.introspector';
import { CreateConnectionDto } from '../connection/dto/create-connection.dto';
import { IntrospectionDatabaseSchema } from './dto/introspection-database-schema.dto';
import { ConnectionService } from '../connection/connection.service';

type DBEngine = 'mysql';

@Injectable()
export class IntrospectionService {
  private readonly registry: Record<DBEngine, SchemaIntrospector>;

  constructor(
    mysql: MySqlIntrospector,
    private connectionService: ConnectionService,
  ) {
    this.registry = { mysql };
  }

  private select(engine: DBEngine): SchemaIntrospector {
    const adapter = this.registry[engine];
    if (!adapter)
      throw new BadRequestException(`Unsupported database engine: ${engine}`);

    return adapter;
  }

  async listSchemas(dto: CreateConnectionDto): Promise<string[]> {
    const adapter = this.select('mysql');
    const connString = `mysql://${dto.username}:${dto.password}@${dto.ip_address}:${dto.port}`;
    const session = adapter.connect(connString);

    try {
      return await session.getSchemas();
    } finally {
      await session.close();
    }
  }

  async introspectSchema(
    connectionId: number,
  ): Promise<IntrospectionDatabaseSchema> {
    const adapter = this.select('mysql');
    const connection = await this.connectionService.findOne(connectionId);
    const connString = `mysql://${connection.username}:${connection.password}@${connection.ip_address}:${connection.port}`;
    const session = adapter.connect(connString);

    try {
      const [tables, foreign_keys] = await Promise.all([
        session.getTables(connection.database_name),
        session.getForeignKeys(connection.database_name),
      ]);

      return { schema: connection.database_name, tables, foreign_keys };
    } finally {
      await session.close();
    }
  }
}
