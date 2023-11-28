import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { settings } from './jwt.settings';
import {
  LoginSuccessViewModel,
  LoginSuccessViewModelForRefresh,
  UserAndDeviceTypeFromRefreshToken,
} from './jwt.types';
import { NewUsersDBType } from '../users/user.types';

export class JwtService {
  async createJWT(user: NewUsersDBType): Promise<LoginSuccessViewModel> {
    const token = jwt.sign({ userId: user._id }, settings.JWT_SECRET, {
      expiresIn: '600s',
    });
    return {
      accessToken: token,
    };
  }

  async createRefreshJWT(
    user: NewUsersDBType,
    deviceId: string,
  ): Promise<LoginSuccessViewModelForRefresh> {
    const token = jwt.sign(
      {
        userId: user._id,
        deviceId: deviceId,
      },
      settings.JWT_REFRESH_SECRET,
      { expiresIn: '1200s' },
    );
    return {
      refreshToken: token,
    };
  }

  async getUserIdByAccessToken(token: string): Promise<ObjectId | null> {
    try {
      const result = jwt.verify(token, settings.JWT_SECRET) as {
        userId: string;
      };
      console.log(result);
      return new ObjectId(result.userId);
    } catch (error) {
      return null;
    }
  }

  async getUserIdByRefreshToken(token: string): Promise<ObjectId | null> {
    try {
      const result = jwt.verify(token, settings.JWT_REFRESH_SECRET) as {
        userId: string;
      };

      return new ObjectId(result.userId);
    } catch (error) {
      return null;
    }
  }

  async getTokenInfoByRefreshToken(
    token: string,
  ): Promise<UserAndDeviceTypeFromRefreshToken | null> {
    try {
      const result = jwt.verify(token, settings.JWT_REFRESH_SECRET) as {
        userId: string;
        deviceId: string;
        iat: number;
        exp: number;
      };
      return result;
    } catch (error) {
      return null;
    }
  }
}

export const jwtService = new JwtService();
