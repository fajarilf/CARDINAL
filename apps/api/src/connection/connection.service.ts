import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ConnectionService {
  constructor(private readonly db: DatabaseService) {}

  async getAll() {
    return await this.db.selectFrom('connections').selectAll().execute();
  }
}
