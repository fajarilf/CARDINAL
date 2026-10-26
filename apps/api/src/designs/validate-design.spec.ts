import type { DesignDocument } from '@cardinal/shared-types/designs';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateDesignDto, UpdateDesignDto } from './dto/save-design.dto';
import { validateDesign } from './validate-design';

function document(): DesignDocument {
  return {
    tables: [
      {
        id: 'users',
        name: 'users',
        x: 10,
        y: 20,
        columns: [{ name: 'id', type: 'integer', pk: true }],
      },
      {
        id: 'orders',
        name: 'orders',
        x: 100,
        y: 20,
        columns: [{ name: 'user_id', type: 'integer' }],
      },
    ],
    edges: [
      {
        id: 'fk',
        from: { table: 'orders', col: 'user_id' },
        to: { table: 'users', col: 'id' },
      },
    ],
  };
}

describe('design validation', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });

  it('accepts a complete valid design and an empty design', () => {
    expect(() => validateDesign(document())).not.toThrow();
    expect(() => validateDesign({ tables: [], edges: [] })).not.toThrow();
  });

  it('rejects duplicate table IDs, table names, column names, and edge IDs', () => {
    const mutations: ((doc: DesignDocument) => void)[] = [
      (doc) => {
        doc.tables[1].id = doc.tables[0].id;
      },
      (doc) => {
        doc.tables[1].name = doc.tables[0].name;
      },
      (doc) => {
        doc.tables[0].columns.push({ ...doc.tables[0].columns[0] });
      },
      (doc) => {
        doc.edges.push({ ...doc.edges[0] });
      },
      (doc) => {
        doc.edges.push({ ...doc.edges[0], id: 'another' });
      },
      (doc) => {
        doc.edges[0].to.col = 'missing';
      },
      (doc) => {
        doc.edges[0].to = { ...doc.edges[0].from };
      },
    ];
    for (const mutate of mutations) {
      const doc = document();
      mutate(doc);
      expect(() => validateDesign(doc)).toThrow(BadRequestException);
    }
  });

  it('validates nested columns, endpoint objects, and finite coordinates', async () => {
    const invalidBodies = [
      { name: '  ', document: document() },
      { name: 'Shop' },
      { name: 'Shop', document: [] },
      { name: 'Shop', document: { tables: [[]], edges: [] } },
      { name: 'Shop', document: { tables: [], edges: [[]] } },
      {
        name: 'Shop',
        document: {
          tables: [{ ...document().tables[0], columns: [[]] }],
          edges: [],
        },
      },
      {
        name: 'Shop',
        document: {
          tables: [
            {
              ...document().tables[0],
              columns: [{ name: 'id', type: 'integer', pk: null }],
            },
          ],
          edges: [],
        },
      },
      {
        name: 'Shop',
        document: { tables: [], edges: [{ id: 'e', from: [], to: [] }] },
      },
      { name: 'Shop', document: { tables: null, edges: [] } },
      {
        name: 'Shop',
        document: {
          tables: [{ ...document().tables[0], x: Infinity }],
          edges: [],
        },
      },
      {
        name: 'Shop',
        document: {
          tables: [{ ...document().tables[0], columns: [null] }],
          edges: [],
        },
      },
      {
        name: 'Shop',
        document: { tables: [], edges: [{ id: 'e', from: null, to: {} }] },
      },
    ];
    for (const body of invalidBodies) {
      await expect(
        pipe.transform(body, { type: 'body', metatype: CreateDesignDto }),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  it('requires a positive integer revision on updates', async () => {
    for (const revision of [undefined, 0, -1, 1.5, '1']) {
      await expect(
        pipe.transform(
          { name: 'Shop', document: document(), revision },
          { type: 'body', metatype: UpdateDesignDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    await expect(
      pipe.transform(
        { name: 'Shop', document: document(), revision: 1 },
        { type: 'body', metatype: UpdateDesignDto },
      ),
    ).resolves.toBeInstanceOf(UpdateDesignDto);
  });
});
