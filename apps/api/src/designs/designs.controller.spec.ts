import {
  INestApplication,
  ValidationPipe,
  ConflictException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { ResponseInterceptor } from '../common/response.interceptor';
import { AppExceptionFilter } from '../common/app-exception.filter';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';

jest.mock('../database/database.service', () => ({
  DatabaseService: jest.fn(),
}));

// No database connection: exercise routing, nested validation and response envelopes.
describe('design HTTP endpoints', () => {
  let app: INestApplication<App> &
    Pick<NestExpressApplication, 'useBodyParser'>;
  const document = { tables: [], edges: [] };
  const saved = {
    id: 1,
    name: 'Shop',
    document,
    revision: 1,
    created_at: new Date(0),
    updated_at: new Date(0),
  };
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DesignsController],
      providers: [{ provide: DesignsService, useValue: service }],
    }).compile();
    app = module.createNestApplication<typeof app>();
    app.useBodyParser('json', { limit: '1mb' });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it('creates, lists, loads and updates named documents', async () => {
    service.create.mockResolvedValue(saved);
    service.findAll.mockResolvedValue([saved]);
    service.findOne.mockResolvedValue(saved);
    service.update.mockResolvedValue({ ...saved, revision: 2 });
    const created = await request(app.getHttpServer())
      .post('/api/designs')
      .send({ name: 'Shop', document })
      .expect(201);
    expect(created.body).toMatchObject({
      status: 'success',
      data: { id: 1, document, revision: 1 },
    });
    await request(app.getHttpServer()).get('/api/designs').expect(200);
    await request(app.getHttpServer()).get('/api/designs/1').expect(200);
    const updated = await request(app.getHttpServer())
      .put('/api/designs/1')
      .send({ name: 'Shop', document, revision: 1 })
      .expect(200);
    expect(updated.body).toMatchObject({ data: { revision: 2 } });
  });

  it('rejects malformed nested documents and missing revisions before the service', async () => {
    await request(app.getHttpServer())
      .post('/api/designs')
      .send({ name: 'Shop', document: { tables: [null], edges: [] } })
      .expect(400);
    await request(app.getHttpServer())
      .put('/api/designs/1')
      .send({ name: 'Shop', document })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/designs/not-an-id')
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.findOne).not.toHaveBeenCalled();
  });

  it('accepts diagram documents larger than the default 100KB parser limit', async () => {
    service.create.mockResolvedValue(saved);
    const largeDocument = {
      tables: Array.from({ length: 10 }, (_, i) => ({
        id: `t${i}`,
        name: `table_${i}`,
        x: 0,
        y: 0,
        columns: Array.from({ length: 200 }, (_, j) => ({
          name: `column_${j}_${'x'.repeat(40)}`,
          type: 'varchar',
        })),
      })),
      edges: [],
    };
    const body = { name: 'Large design', document: largeDocument };
    expect(Buffer.byteLength(JSON.stringify(body))).toBeGreaterThan(100 * 1024);
    await request(app.getHttpServer())
      .post('/api/designs')
      .send(body)
      .expect(201);
  });

  it('surfaces revision conflicts without a successful response', async () => {
    service.update.mockRejectedValue(
      new ConflictException('A newer revision exists.'),
    );
    const result = await request(app.getHttpServer())
      .put('/api/designs/1')
      .send({ name: 'Shop', document, revision: 1 })
      .expect(409);
    expect(result.body).toMatchObject({ message: 'A newer revision exists.' });
  });
});
