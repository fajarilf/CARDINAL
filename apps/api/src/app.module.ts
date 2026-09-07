import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectionModule } from './connection/connection.module';
import { DatabaseModule } from './database/database.module';
import { IntrospectionModule } from './introspection/introspection.module';

@Module({
  imports: [DatabaseModule, ConnectionModule, IntrospectionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
