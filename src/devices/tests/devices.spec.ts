import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { appSettings } from '../../appSettings';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { CreateUserDto } from '../../users/user.types';
import { AuthTestManager } from '../../auth/tests/auth.testManager.spec';
import { ResultCode } from '../../helpers/heplersType';
import { DbMongooseModule } from '../../modules/DbMongooseModule';
import { DbMongooseTestingMemoryModule } from '../../modules/DbMongooseTestingMemoryModule';

jest.setTimeout(30000);

describe('SecurityDevicesController (e2e)', () => {
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

  describe('Security devices router testing', () => {
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
    it('should return 200 and info about current sessions, also test errors', async () => {
      await AuthTestManager.registrationUser(
        httpServer,
        createVasyaData(2).registrationData,
      );
      const loginUserInfo = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );
      await request(httpServer).get('/security/devices').expect(401);

      await request(httpServer)
        .post('/auth/logout')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(ResultCode.NoContent);

      await request(httpServer)
        .get('/security/devices')
        .set('Cookie', [loginUserInfo.refreshToken!])
        .expect(401);

      const loginUserInfo2 = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
      );

      const result = await request(httpServer)
        .get('/security/devices')
        .set('Cookie', [loginUserInfo2.refreshToken!])
        .expect(200);

      expect(result.body).toEqual([
        {
          ip: expect.any(String),
          title: expect.any(String),
          lastActiveDate: expect.any(String),
          deviceId: expect.any(String),
        },
      ]);
    });
  });
});
