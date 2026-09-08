import { Module } from '@nestjs/common';
import { IntrospectionController } from './introspection.controller';
import { IntrospectionService } from './introspection.service';
import { MySqlIntrospector } from './adapters/mysql.introspector';
import { ConnectionService } from '../connection/connection.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IntrospectionController],
  providers: [IntrospectionService, MySqlIntrospector, ConnectionService],
})
export class IntrospectionModule {}
