import { Controller, Get, Param, Query } from '@nestjs/common';
import { IntrospectionService } from './introspection.service';
import { ApiEnvelope } from '../common/api-envelope';
import { CreateConnectionDto } from '../connection/dto/create-connection.dto';
import { IntrospectionDatabaseSchema } from './dto/introspection-database-schema.dto';

@Controller('introspections')
export class IntrospectionController {
  constructor(private service: IntrospectionService) {}

  @Get()
  @ApiEnvelope(String, { isArray: true })
  listSchemas(
    @Query('ip_address') ip_address: string,
    @Query('port') port: number,
    @Query('username') username: string,
    @Query('password') password: string,
    @Query('database_name') database_name: string,
  ) {
    const dto: CreateConnectionDto = {
      ip_address,
      port,
      username,
      password,
      database_name,
      database: 0,
    };

    return this.service.listSchemas(dto);
  }

  @Get(':connection_id')
  @ApiEnvelope(IntrospectionDatabaseSchema, { status: 201 })
  introspectSchema(@Param('connection_id') connection_id: number) {
    return this.service.introspectSchema(connection_id);
  }
}
