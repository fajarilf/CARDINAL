import type { DesignDocument } from '@cardinal/shared-types/designs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DesignsService } from './designs.service';

jest.mock('../database/database.service', () => ({
  DatabaseService: jest.fn(),
}));

const document: DesignDocument = { tables: [], edges: [] };

function setup() {
  const query = {
    select: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
  };
  const db = {
    selectFrom: jest.fn().mockReturnValue(query),
    insertInto: jest.fn().mockReturnValue(query),
    updateTable: jest.fn().mockReturnValue(query),
  };
  return {
    query,
    db,
    service: new DesignsService(db as unknown as DatabaseService),
  };
}

describe('DesignsService', () => {
  it('stores a trimmed name and the entire JSON document', async () => {
    const { query, service } = setup();
    query.executeTakeFirstOrThrow.mockResolvedValue({ id: 1, revision: 1 });
    await service.create({ name: ' Shop ', document });
    expect(query.values).toHaveBeenCalledWith({
      name: 'Shop',
      document: JSON.stringify(document),
    });
  });

  it('loads a saved design and reports missing designs', async () => {
    const { query, service } = setup();
    const design = { id: 1, name: 'Shop', document, revision: 1 };
    query.executeTakeFirst
      .mockResolvedValueOnce(design)
      .mockResolvedValueOnce(undefined);
    await expect(service.findOne(1)).resolves.toBe(design);
    await expect(service.findOne(2)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists metadata without fetching every design document', async () => {
    const { query, service } = setup();
    query.execute.mockResolvedValue([]);
    await service.findAll();
    expect(query.select).toHaveBeenCalledWith([
      'id',
      'name',
      'revision',
      'created_at',
      'updated_at',
    ]);
  });

  it('updates only the requested revision in one conditional write', async () => {
    const { query, service } = setup();
    const saved = { id: 1, document, revision: 3 };
    query.executeTakeFirst.mockResolvedValue(saved);
    await expect(
      service.update(1, { name: 'Shop', document, revision: 2 }),
    ).resolves.toBe(saved);
    expect(query.where).toHaveBeenCalledWith('id', '=', 1);
    expect(query.where).toHaveBeenCalledWith('revision', '=', 2);
    expect(query.set).toHaveBeenCalledWith(
      expect.objectContaining({
        document: JSON.stringify(document),
        revision: 3,
      }),
    );
  });

  it('rejects a stale revision without retrying or overwriting the newer design', async () => {
    const { db, query, service } = setup();
    query.executeTakeFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ id: 1, revision: 3 });
    await expect(
      service.update(1, { name: 'Shop', document, revision: 2 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.updateTable).toHaveBeenCalledTimes(1);
  });

  it('returns not found rather than conflict for a missing design', async () => {
    const { query, service } = setup();
    query.executeTakeFirst.mockResolvedValue(undefined);
    await expect(
      service.update(1, { name: 'Shop', document, revision: 2 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects dangling relationships before writing anything', async () => {
    const { db, service } = setup();
    const invalid = {
      tables: [],
      edges: [
        {
          id: 'e',
          from: { table: 'missing', col: 'id' },
          to: { table: 'other', col: 'id' },
        },
      ],
    };
    await expect(
      service.create({ name: 'Shop', document: invalid }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.insertInto).not.toHaveBeenCalled();
  });
});
