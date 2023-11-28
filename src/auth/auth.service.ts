import { ObjectId } from 'mongodb';
import add from 'date-fns/add';
import { v4 as uuidv4 } from 'uuid';
import { RecoveryCodeModel } from '../db/dbMongo';

import bcrypt from 'bcrypt';
import { UserRepository } from '../users/user.repository';
import { Injectable } from '@nestjs/common';
import {
  getUserViewModel,
  NewUsersDBType,
  UserInputType,
  UserViewModel,
} from '../users/user.types';
import { AuthRepository } from './auth.repository';
import { DeviceDBModel, deviceInputValue } from '../devices/device.types';
import { jwtService } from '../jwt/jwt.service';
import { emailAdapter } from '../email/email.adapter';

@Injectable()
export class AuthService {
  constructor(
    public userRepository: UserRepository,
    public authRepository: AuthRepository,
  ) {}

  async createUser(
    userPostInputData: UserInputType,
  ): Promise<getUserViewModel | null> {
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
    const createdUser = await this.userRepository.createUser(newUser);
    const createdUserFullInformation = this.usersMapping(newUser);
    try {
      await emailAdapter.sendConfirmationEmail(
        createdUserFullInformation.emailConfirmation.confirmationCode,
        createdUser.email,
      );
    } catch (e) {
      return null;
    }
    return createdUser;
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
      return user;
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

  async confirmEmail(code: string): Promise<boolean> {
    const findUser = await this.userRepository.findUserByCode(code);
    if (!findUser) return false;

    return await this.authRepository.updateEmailConfimation(findUser._id);
  }

  async сonfirmAndChangePassword(
    recoveryCode: string,
    password: string,
  ): Promise<boolean> {
    const foundEmailByRecoveryCode =
      await this.authRepository.findEmailByRecoveryCode(recoveryCode);
    if (!foundEmailByRecoveryCode) return false;
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(password, passwordSalt);
    await this.authRepository.updateUserPassword(
      foundEmailByRecoveryCode,
      passwordHash,
      passwordSalt,
    );
    return true;
  }

  async addRecoveryCodeAndEmail(
    email: string,
    recoveryCode: string,
  ): Promise<ObjectId | null> {
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
    return result ? result._id : null;
  }

  async changeUserConfirmationcode(
    email: string,
  ): Promise<NewUsersDBType | null> {
    const currentUser = await this.findUserByEmail(email);
    const newConfirmationCode = uuidv4();
    if (currentUser) {
      try {
        await this.userRepository.updateConfirmationCode(
          currentUser._id,
          newConfirmationCode,
        );
      } catch (e) {
        console.log(e);
        return null;
      }
    }
    return await this.userRepository.findUserByEmail(email);
  }

  async addDeviceInfoToDB(deviceInfo: deviceInputValue): Promise<boolean> {
    const getInfoFromRefreshToken = await jwtService.getTokenInfoByRefreshToken(
      deviceInfo.refreshToken,
    );
    if (!getInfoFromRefreshToken) return false;
    const result: DeviceDBModel = {
      userId: deviceInfo.userId,
      issuedAt: getInfoFromRefreshToken.iat,
      expirationAt: getInfoFromRefreshToken.exp,
      deviceId: deviceInfo.deviceId,
      ip: deviceInfo.ip,
      deviceName: deviceInfo.deviceName,
    };
    return await this.authRepository.createOrUpdateRefreshToken(result);
  }
}
