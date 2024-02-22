import { ResultCode } from '../../helpers/heplersType';
import request from 'supertest';
import { CreateUserDto } from '../../users/user.types';

export const AuthTestManager = {
  async registrationUser(
    server: string,
    data: CreateUserDto,
    expectedStatusCode: ResultCode = ResultCode.NoContent,
  ) {
    const response = await request(server)
      .post('/auth/registration')
      .send(data)
      .expect(expectedStatusCode);
    return response;
  },

  async loginUser(
    server: string,
    data: { loginOrEmail: string; password: string },
    expectedStatusCode: ResultCode = ResultCode.Success,
  ) {
    const response = await request(server)
      .post('/auth/login')
      .send(data)
      .expect(expectedStatusCode);
    const cookiesArray: string[] = response.headers['set-cookie'];

    // Находим refreshToken
    const refreshTokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );
    expect(refreshTokenCookie).toBeDefined();
    return {
      accessToken: response.body.accessToken,
      refreshToken: refreshTokenCookie,
    };
  },
};
