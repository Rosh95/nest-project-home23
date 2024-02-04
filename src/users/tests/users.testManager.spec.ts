import { ResultCode } from '../../helpers/heplersType';
import request from 'supertest';
import { CreateUserDto } from '../../users/user.types';

export const usersTestManager = {
  async createUser(
    server: string,
    data: CreateUserDto,
    expectedStatusCode: ResultCode = ResultCode.Created,
  ) {
    const response = await request(server)
      .post('/users')
      .auth('admin', 'qwerty')
      .send(data)
      .expect(expectedStatusCode);

    let createdEntity;
    if (expectedStatusCode === ResultCode.Created) {
      createdEntity = response.body;
      expect(createdEntity).toEqual({
        id: expect.any(String),
        login: data.login,
        email: data.email,
        createdAt: expect.any(String),
      });
    }
    return { response, createdEntity };
  },
};
