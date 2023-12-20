import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { settings } from './jwt.settings';
import {
  LoginSuccessViewModel,
  LoginSuccessViewModelForRefresh,
  UserAndDeviceTypeFromRefreshToken,
} from './jwt.types';
import { ResultCode, ResultObject } from '../helpers/heplersType';

export class JwtService {
  constructor() {}

  async createJWT(userId: ObjectId): Promise<LoginSuccessViewModel> {
    const token = jwt.sign({ userId: userId }, settings.JWT_SECRET, {
      expiresIn: '600s',
    });
    return {
      accessToken: token,
    };
  }

  async createRefreshJWT(
    userId: ObjectId,
    deviceId: string,
  ): Promise<LoginSuccessViewModelForRefresh> {
    const token = jwt.sign(
      {
        userId: userId,
        deviceId: deviceId,
      },
      settings.JWT_SECRET,
      { expiresIn: '1200s' },
    );
    return {
      refreshToken: token,
    };
  }

  async getUserIdByAccessToken(token: string | null): Promise<ObjectId | null> {
    const result = token
      ? (jwt.verify(token, settings.JWT_SECRET) as {
          userId: string;
        })
      : null;

    return result ? new ObjectId(result.userId) : null;
  }

  async getUserIdByRefreshToken(token: string): Promise<ObjectId | null> {
    try {
      const result = jwt.verify(token, settings.JWT_SECRET) as {
        userId: string;
      };

      return new ObjectId(result.userId);
    } catch (error) {
      return null;
    }
  }

  async getTokenInfoByRefreshToken(
    token: string,
  ): Promise<ResultObject<UserAndDeviceTypeFromRefreshToken>> {
    const result = jwt.verify(token, settings.JWT_SECRET) as {
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    };
    // const currentUser = await this.usersQueryRepository.findUserById(
    //   result.userId,
    // );
    //
    // if (!currentUser) {
    //   return {
    //     data: null,
    //     resultCode: ResultCode.Unauthorized,
    //     message: 'couldn`t find user',
    //   };
    // }
    return {
      data: result,
      resultCode: ResultCode.NoContent,
    };
  }
}

//export const jwtService = new JwtService();
