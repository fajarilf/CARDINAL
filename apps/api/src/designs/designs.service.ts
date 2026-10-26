import type {
  DesignSummary,
  SavedDesign,
} from '@cardinal/shared-types/designs';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDesignDto, UpdateDesignDto } from './dto/save-design.dto';
import { validateDesign } from './validate-design';

@Injectable()
export class DesignsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<DesignSummary<Date>[]> {
    return this.db
      .selectFrom('designs')
      .select(['id', 'name', 'revision', 'created_at', 'updated_at'])
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc')
      .execute();
  }

  async findOne(id: number): Promise<SavedDesign<Date>> {
    const design = await this.db
      .selectFrom('designs')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!design) throw new NotFoundException(`Design ${id} not found.`);
    return design;
  }

  async create(dto: CreateDesignDto): Promise<SavedDesign<Date>> {
    validateDesign(dto.document);
    return this.db
      .insertInto('designs')
      .values({ name: dto.name.trim(), document: JSON.stringify(dto.document) })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, dto: UpdateDesignDto): Promise<SavedDesign<Date>> {
    validateDesign(dto.document);
    const design = await this.db
      .updateTable('designs')
      .set({
        name: dto.name.trim(),
        document: JSON.stringify(dto.document),
        revision: dto.revision + 1,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .where('revision', '=', dto.revision)
      .returningAll()
      .executeTakeFirst();
    if (design) return design;
    await this.findOne(id);
    throw new ConflictException(
      'A newer revision exists. Export your draft before reopening the saved design.',
    );
  }
}
