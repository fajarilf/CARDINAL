import { BadRequestException, Injectable } from '@nestjs/common';
import { SchemaIntrospector } from './adapters/introspector.interface';
import { MySqlIntrospector } from './adapters/mysql.introspector';
import { CreateConnectionDto } from '../connection/dto/create-connection.dto';

type DBEngine = 'mysql';

@Injectable()
export class IntrospectionService {
  private readonly registry: Record<DBEngine, SchemaIntrospector>;

  constructor(mysql: MySqlIntrospector) {
    this.registry = { mysql };
  }

  private select(engine: DBEngine): SchemaIntrospector {
    const adapter = this.registry[engine];
    if (!adapter)
      throw new BadRequestException(`Unsuported database engine: ${engine}`);

    return adapter;
  }

  async listSchemas(dto: CreateConnectionDto): Promise<string[]> {
    const adapter = this.select('mysql');
    const connString = `mysql://${dto.username}:${dto.password}@${dto.ip_address}:${dto.port}/${dto.database_name}`;
    const session = adapter.connect(connString);

    try {
      return await session.getSchemas();
    } finally {
      await session.close();
    }
  }
}
