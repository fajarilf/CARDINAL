import { Controller, Get } from '@nestjs/common';
import { ConnectionService } from './connection.service';

@Controller('connections')
export class ConnectionController {
  constructor(private readonly service: ConnectionService) {}

  @Get()
  findAll() {
    return this.service.getAll();
  }
}
