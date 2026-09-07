import { Module } from '@nestjs/common';
import { IntrospectionController } from './introspection.controller';
import { IntrospectionService } from './introspection.service';
import { MySqlIntrospector } from './adapters/mysql.introspector';

@Module({
  controllers: [IntrospectionController],
  providers: [IntrospectionService, MySqlIntrospector],
})
export class IntrospectionModule {}
