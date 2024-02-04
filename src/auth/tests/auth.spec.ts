import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { appSettings } from '../../appSettings';
import request from 'supertest';
import { CreateUserDto } from '../../users/user.types';
import { AuthTestManager } from './auth.testManager.spec';
import { settings } from '../../settings';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import * as process from 'process';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let httpServer;

  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();

    const uri = mongod.getUri();
    process.env.MONGO_URL = uri;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(MongooseModule.forRoot(settings().MONGO_URL))
      .useModule(MongooseModule.forRoot(uri))
      .compile();

    app = moduleFixture.createNestApplication();
    appSettings(app);

    await app.init();
    //TODO : поменять конфигурацию для лимитов, сетинг вставить згнаечния всем anv переменным монго юри тоже

    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data');
  });

  describe('Auth router testing', () => {
    beforeEach(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    const userData1: CreateUserDto = {
      login: 'Vasya979',
      email: 'vasya99@gmail.ru',
      password: '123456',
    };
    const loginUser = {
      loginOrEmail: 'Vasya979',
      password: '123456',
    };
    it('should login user', async () => {
      await AuthTestManager.registrationUser(httpServer, userData1);
      const result = await AuthTestManager.loginUser(httpServer, loginUser);
      expect(result.accessToken).toEqual(expect.any(String));
    });
    it('should refresh token', async () => {
      await AuthTestManager.registrationUser(httpServer, userData1);
      const result = await AuthTestManager.loginUser(httpServer, loginUser);
      await request(httpServer)
        .post('/auth/refresh-token')
        //   .set('Cookie', [`refreshToken=${result.refreshToken}`])
        .set('Cookie', [result.refreshToken!])
        .set({ Authorization: `Bearer ${result.accessToken}` })
        .expect(200);
    });
  });
});
