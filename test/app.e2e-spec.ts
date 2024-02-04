import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { appSettings } from '../src/appSettings';
import { ResultCode } from '../src/helpers/heplersType';
import request from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSettings(app);

    await app.init();

    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('de', () => {
    it('/ (GET)', async () => {
      request(httpServer)
        .get('/')
        .expect(ResultCode.Success)
        .expect('Hello World!Hello Syktyvkar!!!!!');
    });
  });
});
