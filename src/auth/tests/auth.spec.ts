import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import request from 'supertest';
import { CreateUserDto } from '../../users/user.types';
import { AuthTestManager } from './auth.testManager.spec';
import { ResultCode } from '../../helpers/heplersType';
import { appSettings } from '../../appSettings';
import { DbMongooseModule } from '../../modules/DbMongooseModule';
import { DbMongooseTestingMemoryModule } from '../../modules/DbMongooseTestingMemoryModule';

jest.setTimeout(95000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let httpServer;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DbMongooseModule)
      .useModule(DbMongooseTestingMemoryModule)
      .compile();

    app = moduleFixture.createNestApplication();
    //const userRepository = app.get<UserRepository>(UserRepository);
    //    const UserModel = userRepository.userModel;

    appSettings(app);

    await app.init();
    httpServer = app.getHttpServer();
    await request(httpServer).delete('/testing/all-data');
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
        .send(createVasyaData(3).registrationData)
        .expect(ResultCode.NoContent);

      await request(httpServer)
        .post('/auth/registration')
        .send(createVasyaData(3).registrationData)
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
        .expect(200);
      expect(result.body.accessToken).toEqual(expect.any(String));

      await AuthTestManager.loginUser(httpServer, createVasyaData(2).loginData);
      await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', [loginUserInfo.refreshToken!])
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
    it('shouldn`t refresh token and get error for invalid values, after delete', async () => {
      await AuthTestManager.registrationUser(
        httpServer,
        createVasyaData(2).registrationData,
      );
      const loginUserInfo = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );

      const devices = await request(httpServer)
        .get('/security/devices')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(200);
      const devicesArray = devices.body.map((i) => i.deviceId);
      console.log('device   ' + devices.body);
      console.log(devicesArray);

      await request(httpServer)
        .delete('/security/devices')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(204);

      const result = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(200);
      expect(result.body.accessToken).toEqual(expect.any(String));

      await AuthTestManager.loginUser(httpServer, createVasyaData(2).loginData);
      await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(401);

      await request(httpServer).post('/auth/refresh-token').expect(401);
    });
  });
});
