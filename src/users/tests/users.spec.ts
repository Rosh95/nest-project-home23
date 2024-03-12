import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { appSettings } from '../../appSettings';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { CreateUserDto } from '../user.types';
import { ResultCode } from '../../helpers/heplersType';
import { usersTestManager } from './users.testManager.spec';
import { EmailService } from '../../email/email.service';
import { v4 } from 'uuid';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let httpServer;

  class EmailAdapterMock {
    sendConfirmationEmail = jest.fn();
    sendRecoveryPasswordEmail = jest.fn();
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useClass(EmailAdapterMock)
      .compile();

    // .overrideProvider(EmailService)
    // .useClass(emailAdapterMock)

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

  describe('Users router testing', () => {
    beforeEach(async () => {
      await request(httpServer).delete('/testing/all-data');
      setTimeout(() => {
        console.log(25);
      }, 10000);
    });

    const userData1: CreateUserDto = {
      login: 'Vasya777',
      email: 'vasya777@gmail.ru',
      password: '123456',
    };
    const userData2: CreateUserDto = {
      login: 'Petya888',
      email: 'petya888@gmail.ru',
      password: '123456',
    };
    it('should return 200 and empty array users', async () => {
      await request(httpServer).get('/sa/users').expect(401);
      const resp = await request(httpServer)
        .get('/sa/users')
        .auth('admin', 'qwerty')
        .expect(ResultCode.Success);

      expect(resp.body.items).toEqual([]);
    });
    it('should post user and get it ', async () => {
      await request(httpServer)
        .post('/sa/users')
        .expect(ResultCode.Unauthorized);
      const resp = await request(httpServer)
        .post('/sa/users')
        .auth('admin', 'qwerty')
        .send(userData1)
        .expect(ResultCode.Created);

      expect(resp.body).toEqual({
        id: expect.any(String),
        login: userData1.login,
        email: userData1.email,
        createdAt: expect.any(String),
      });
      const response = await request(httpServer)
        .get('/sa/users')
        .auth('admin', 'qwerty')
        .expect(ResultCode.Success);

      expect(response.body.items).toEqual([resp.body]);

      const resp2 = await request(httpServer)
        .post('/sa/users')
        .auth('admin', 'qwerty')
        .send(userData2)
        .expect(ResultCode.Created);
      const response2 = await request(httpServer)
        .get('/sa/users')
        .auth('admin', 'qwerty')
        .expect(ResultCode.Success);

      expect(response2.body.items).toEqual([resp2.body, resp.body]);
    });
    it('shouldn`t post user by inccorect data and get 400 ', async () => {
      await request(httpServer)
        .post('/sa/users')
        .auth('admin', 'qwerty')
        .send({ ...userData1, login: '' })
        .expect(ResultCode.BadRequest);
      await request(httpServer)
        .post('/sa/users')
        .auth('admin', 'qwerty')
        .send({ ...userData1, email: 777 })
        .expect(ResultCode.BadRequest);
      await request(httpServer)
        .post('/sa/users')
        .auth('admin', 'qwerty')
        .send({ ...userData1, password: 77 })
        .expect(ResultCode.BadRequest);
    });
    it('should delete user and get 404 if it`s not exist', async () => {
      const randomUUID = v4();
      await request(httpServer)
        .delete(`/sa/users/${randomUUID}`)
        .expect(ResultCode.Unauthorized);

      await request(httpServer)
        .delete('/sa/users/55')
        .auth('admin', 'qwerty')
        .expect(ResultCode.NotFound);

      const createdUser = await usersTestManager.createUser(
        httpServer,
        userData1,
      );
      const deleteUser = await request(httpServer)
        .delete(`/sa/users/${createdUser.createdEntity.id}`)
        .auth('admin', 'qwerty')
        .expect(ResultCode.NoContent);
      expect(deleteUser).toBeTruthy();

      const response = await request(httpServer)
        .get('/sa/users')
        .auth('admin', 'qwerty')
        .expect(ResultCode.Success);
      expect(response.body.items).toEqual([]);
    });
  });
});
