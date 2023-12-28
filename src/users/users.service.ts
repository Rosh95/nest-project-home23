import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto, NewUsersDBType } from './user.types';
import bcrypt from 'bcrypt';
import add from 'date-fns/add';
import { Types } from 'mongoose';
import { Helpers } from '../helpers/helpers';
import { ResultCode, ResultObject } from '../helpers/heplersType';

@Injectable()
export class UsersService {
  constructor(
    public userRepository: UserRepository,
    public helpers: Helpers,
  ) {}

  async createUser(
    userPostInputData: CreateUserDto,
  ): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(userPostInputData, CreateUserDto);
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
        emailExpiration: add(new Date(), { hours: 2, minutes: 3 }),
        isConfirmed: true,
      },
    };
    const createUserId = await this.userRepository.createUser(newUser);
    if (!createUserId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create user',
      };
    }
    return {
      data: createUserId,
      resultCode: ResultCode.NoContent,
    };
  }

  async changeUserConfirmationcode(
    email: string,
  ): Promise<NewUsersDBType | null> {
    const currentUser = await this.userRepository.findUserByEmail(email);
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

  async deleteUser(userId: string): Promise<ResultObject<string>> {
    const isExistUser = await this.userRepository.findUserById(userId);
    if (!isExistUser) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find user',
      };
    }
    const idInMongo = new Types.ObjectId(userId);
    const deleteUser = await this.userRepository.deleteUser(idInMongo);
    if (!deleteUser) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t delete user',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
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
}
