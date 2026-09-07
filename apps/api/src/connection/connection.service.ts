import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { EditConnectionDto } from './dto/edit-connection.dto';

@Injectable()
export class ConnectionService {
  constructor(private readonly db: DatabaseService) {}

  async getAll() {
    return await this.db.selectFrom('connections').selectAll().execute();
  }

  async create(dto: CreateConnectionDto) {
    return await this.db
      .insertInto('connections')
      .values(dto)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findOne(id: number) {
    const row = await this.db
      .selectFrom('connections')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!row) throw new NotFoundException(`connection ${id} not found`);
    return row;
  }

  async update(id: number, dto: EditConnectionDto) {
    const row = await this.db
      .updateTable('connections')
      .set({ ...dto, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    if (!row) throw new NotFoundException(`connection ${id} not found`);
    return row;
  }

  async remove(id: number) {
    const res = await this.db
      .deleteFrom('connections')
      .where('id', '=', id)
      .executeTakeFirst();
    if (res.numDeletedRows === 0n)
      throw new NotFoundException(`connection ${id} not found`);
  }
}
