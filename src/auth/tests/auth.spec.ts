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
import { ResultCode } from '../../helpers/heplersType';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let httpServer;
  //TODO inject values to new UserRepository()
  //const userRepository = new UserRepository().userModel;

  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();

    const uri = mongod.getUri();
    settings().MONGO_URL = uri;
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
    afterEach(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    const createVasyaData = (number: number) => {
      const registrationData: CreateUserDto = {
        login: `Vasya${number}`,
        email: `vasya${number}@gmail.ru`,
        password: '123456',
      };
      const loginData = {
        loginOrEmail: `Vasya${number}`,
        password: '123456',
      };

      return { registrationData, loginData };
    };

    it('should registration user', async () => {
      await request(httpServer)
        .post('/auth/registration')
        .send(createVasyaData(2).registrationData)
        .expect(ResultCode.NoContent);
      await request(httpServer)
        .post('/auth/registration')
        .send(createVasyaData(2).registrationData)
        .expect(ResultCode.BadRequest);

      await request(httpServer)
        .post('/auth/registration')
        .send(createVasyaData(2555555555555).registrationData)
        .expect(ResultCode.BadRequest);
    });
    it('should login user', async () => {
      await AuthTestManager.registrationUser(
        httpServer,
        createVasyaData(2).registrationData,
      );
      const result = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );
      expect(result.accessToken).toEqual(expect.any(String));
    });
    it('should refresh token and get error for invalid values', async () => {
      await AuthTestManager.registrationUser(
        httpServer,
        createVasyaData(2).registrationData,
      );
      const loginUserInfo = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );
      const result = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .set({ Authorization: `Bearer ${loginUserInfo.accessToken}` })
        .expect(200);
      expect(result.body.accessToken).toEqual(expect.any(String));

      const loginUserInfo2 = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );
      await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .set({ Authorization: `Bearer ${loginUserInfo2.accessToken}` })
        .expect(401);

      await request(httpServer).post('/auth/refresh-token').expect(401);
    });
    it('should get info of user', async () => {
      await AuthTestManager.registrationUser(
        httpServer,
        createVasyaData(2).registrationData,
      );
      const loginUserInfo = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );
      const result = await request(httpServer)
        .get('/auth/me')
        .set({ Authorization: `Bearer ${loginUserInfo.accessToken}` })
        .expect(ResultCode.Success);

      expect(result.body).toEqual({
        email: createVasyaData(2).registrationData.email,
        login: createVasyaData(2).registrationData.login,
        userId: expect.any(String),
      });
    });
    it('should logout user ', async () => {
      await AuthTestManager.registrationUser(
        httpServer,
        createVasyaData(2).registrationData,
      );
      const loginUserInfo = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );
      await request(httpServer)
        .post('/auth/logout')
        .expect(ResultCode.Unauthorized);

      await request(httpServer)
        .post('/auth/logout')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(ResultCode.NoContent);

      await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(ResultCode.Unauthorized);
    });
  });
});
