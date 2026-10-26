import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DesignsController],
  providers: [DesignsService],
})
export class DesignsModule {}
