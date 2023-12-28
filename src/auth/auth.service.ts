import { ObjectId } from 'mongodb';
import add from 'date-fns/add';
import { v4 as uuidv4 } from 'uuid';
import { RecoveryCodeModel } from '../db/dbMongo';

import bcrypt from 'bcrypt';
import { UserRepository } from '../users/user.repository';
import { Injectable } from '@nestjs/common';
import {
  NewUsersDBType,
  UserInputType,
  UserViewModel,
} from '../users/user.types';
import { AuthRepository } from './auth.repository';
import { DeviceDBModel } from '../devices/device.types';
import { JwtService } from '../jwt/jwt.service';
import { emailAdapter } from '../email/email.adapter';
import { ResultCode, ResultObject } from '../helpers/heplersType';
import { Types } from 'mongoose';
import { UsersQueryRepository } from '../users/usersQuery.repository';

@Injectable()
export class AuthService {
  constructor(
    public userRepository: UserRepository,
    public authRepository: AuthRepository,
    public jwtService: JwtService,
    public usersQueryRepository: UsersQueryRepository,
  ) {}

  async createUser(
    userPostInputData: UserInputType,
  ): Promise<ResultObject<string>> {
    const isExistEmail = await this.userRepository.findLoginOrEmail(
      userPostInputData.email,
    );
    const isExistLogin = await this.userRepository.findLoginOrEmail(
      userPostInputData.login,
    );
    if (isExistEmail) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'email',
        message: 'email is exist',
      };
    }
    if (isExistLogin) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'login',
        message: 'login is exist',
      };
    }

    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(
      userPostInputData.password,
      passwordSalt,
    );

    const newUser: NewUsersDBType = {
      _id: new ObjectId(),
      accountData: {
        login: userPostInputData.login,
        email: userPostInputData.email,
        passwordHash,
        passwordSalt,
        createdAt: new Date(),
      },
      emailConfirmation: {
        confirmationCode: uuidv4(),
        emailExpiration: add(new Date(), {
          hours: 1,
          minutes: 3,
        }),
        isConfirmed: false,
      },
    };
    const createdUserId = await this.userRepository.createUser(newUser);
    if (!createdUserId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create user',
      };
    }
    const createdUser =
      await this.usersQueryRepository.findUserById(createdUserId);
    const createdUserFullInformation = this.usersMapping(newUser);
    try {
      await emailAdapter.sendConfirmationEmail(
        createdUserFullInformation.emailConfirmation.confirmationCode,
        createdUser!.email,
      );
    } catch (e) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t send email' + e.message,
      };
    }
    return {
      data: createdUserId,
      resultCode: ResultCode.NoContent,
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    const idInMongo = new ObjectId(id);
    return await this.userRepository.deleteUser(idInMongo);
  }

  async checkCredential(loginOrEmail: string, password: string) {
    const user = await this.userRepository.findLoginOrEmail(loginOrEmail);
    if (!user) return false;
    const passwordHash = await this._generateHash(
      password,
      user.accountData.passwordSalt,
    );
    if (user.accountData.passwordHash === passwordHash) {
      return user._id;
    } else return false;
  }

  private usersMapping(user: NewUsersDBType): UserViewModel {
    return {
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt.toISOString(),
      emailConfirmation: {
        confirmationCode: user.emailConfirmation.confirmationCode,
        emailExpiration: user.emailConfirmation.emailExpiration,
        isConfirmed: user.emailConfirmation.isConfirmed,
      },
    };
  }

  async findUserById(userId: string): Promise<NewUsersDBType | null> {
    return await this.userRepository.findUserById(userId);
  }

  async findUserByLogin(login: string): Promise<NewUsersDBType | null> {
    return await this.userRepository.findUserByLogin(login);
  }

  async findUserByEmail(email: string): Promise<NewUsersDBType | null> {
    return await this.userRepository.findUserByEmail(email);
  }

  async findUserByCode(code: string): Promise<NewUsersDBType | null> {
    return await this.userRepository.findUserByCode(code);
  }

  async _generateHash(password: string, salt: string) {
    return await bcrypt.hash(password, salt);
  }

  async addInvalidAccessToken(password: string, salt: string) {
    return await bcrypt.hash(password, salt);
  }

  async confirmEmail(code: string): Promise<ResultObject<string>> {
    const findUser = await this.userRepository.findUserByCode(code);
    if (!findUser) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t find user by code',
        field: 'code',
      };
    }
    if (
      findUser.emailConfirmation.emailExpiration.getTime() <
      new Date().getTime()
    ) {
      console.log(findUser.emailConfirmation.emailExpiration.getTime());
      console.log(new Date().getTime());
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'confirmation code is Expired',
        field: 'code',
      };
    }
    if (findUser.emailConfirmation.isConfirmed) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'confirmation code is already confirmed',
        field: 'code',
      };
    }
    const isUpdated = await this.authRepository.updateEmailConfimation(
      findUser._id,
    );
    if (!isUpdated) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t update confirmation code ',
        field: 'code',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }

  async сonfirmAndChangePassword(
    recoveryCode: string,
    password: string,
  ): Promise<ResultObject<string>> {
    const foundEmailByRecoveryCode =
      await this.authRepository.findEmailByRecoveryCode(recoveryCode);
    if (!foundEmailByRecoveryCode) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t find user be recovery code',
      };
    }
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(password, passwordSalt);
    await this.authRepository.updateUserPassword(
      foundEmailByRecoveryCode,
      passwordHash,
      passwordSalt,
    );
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }

  async addRecoveryCodeAndEmail(email: string): Promise<ResultObject<string>> {
    const recoveryCode = uuidv4();
    const foundUserByEmail = await this.userRepository.findUserByEmail(email);
    if (!foundUserByEmail) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find user',
      };
    }
    const isExistRecoveryCodeForCurrentEmail = await RecoveryCodeModel.findOne({
      email,
    });
    let result;
    if (isExistRecoveryCodeForCurrentEmail) {
      result = await this.authRepository.updateRecoveryCode(
        email,
        recoveryCode,
      );
    } else {
      result = await this.authRepository.addRecoveryCodeAndEmail(
        email,
        recoveryCode,
      );
    }
    return result
      ? {
          data: recoveryCode,
          resultCode: ResultCode.NotFound,
          message: 'couldn`t find user',
        }
      : {
          data: null,
          resultCode: ResultCode.BadRequest,
          message: 'couldn`t send recovery code',
        };
  }

  async changeUserConfirmationcode(
    email: string,
  ): Promise<ResultObject<string>> {
    const currentUser = await this.findUserByEmail(email);

    if (!currentUser) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'email',
        message: 'user doesn`t exist',
      };
    }

    if (currentUser.emailConfirmation.isConfirmed) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'email',
        message: 'user already confirmed',
      };
    }
    const newConfirmationCode = uuidv4();

    try {
      await this.userRepository.updateConfirmationCode(
        currentUser._id,
        newConfirmationCode,
      );
    } catch (e) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'code',
        message: 'user some error on resending email' + e.message,
      };
    }
    const updatedUserInfo = await this.userRepository.findUserByEmail(email);
    if (!updatedUserInfo) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'code',
        message: 'user some error on resending email',
      };
    }
    return {
      data: updatedUserInfo.emailConfirmation.confirmationCode,
      resultCode: ResultCode.NoContent,
    };
  }

  async addDeviceInfoToDB(
    userId: Types.ObjectId,
    userAgent: string,
    ip: string,
    deviceId?: string,
  ): Promise<ResultObject<any>> {
    const accessToken = await this.jwtService.createJWT(userId);
    const currentDeviceId = deviceId ? deviceId : uuidv4();
    const refreshToken = await this.jwtService.createRefreshJWT(
      userId,
      currentDeviceId,
    );

    const getInfoFromRefreshToken =
      await this.jwtService.getTokenInfoByRefreshToken(
        refreshToken.refreshToken,
      );

    if (!getInfoFromRefreshToken.data) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t get refreshToken',
      };
    }
    const result: DeviceDBModel = {
      userId: userId.toString(),
      issuedAt: getInfoFromRefreshToken.data.iat,
      expirationAt: getInfoFromRefreshToken.data.exp,
      deviceId: currentDeviceId,
      ip: ip,
      deviceName: userAgent,
    };
    const isCreated =
      await this.authRepository.createOrUpdateRefreshToken(result);
    if (!isCreated) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t get refreshToken',
      };
    }
    return {
      data: {
        accessToken: accessToken.accessToken,
        refreshToken: refreshToken.refreshToken,
      },
      resultCode: ResultCode.Success,
    };
  }
}
