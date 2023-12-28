import { ObjectId } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { getUserViewModel, NewUsersDBType } from './user.types';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) public userModel: Model<UserDocument>) {}

  async getAllUsers() {
    return this.userModel.find().sort({ createdAt: -1 }).lean();
  }

  async createUser(newUser: NewUsersDBType): Promise<string | null> {
    const createdUser = await this.userModel.create(newUser);
    const result = createdUser._id.toString()
      ? createdUser._id.toString()
      : null;
    return result;
  }

  async deleteUser(id: ObjectId): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async findUserById(userId: string): Promise<NewUsersDBType | null> {
    const foundUser: NewUsersDBType | null =
      await this.userModel.findById(userId);
    if (foundUser) {
      return foundUser;
    } else {
      return null;
    }
  }

  async findUserByLogin(login: string): Promise<NewUsersDBType | null> {
    const foundUser = await this.userModel.findOne({
      'accountData.login': login,
    });
    if (foundUser) {
      return foundUser;
    } else {
      return null;
    }
  }

  async findUserByEmail(email: string): Promise<NewUsersDBType | null> {
    const foundUser = await this.userModel.findOne({
      'accountData.email': email,
    });
    if (foundUser) {
      return foundUser;
    } else {
      return null;
    }
  }

  async findUserByCode(code: string): Promise<NewUsersDBType | null> {
    const foundUser = await this.userModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    debugger;
    if (foundUser) {
      return foundUser;
    } else {
      return null;
    }
  }

  async findLoginOrEmail(loginOrEmail: string): Promise<NewUsersDBType | null> {
    return this.userModel.findOne({
      $or: [
        { 'accountData.email': loginOrEmail },
        { 'accountData.login': loginOrEmail },
      ],
    });
  }

  async updateConfirmationCode(
    userId: ObjectId,
    code: string,
  ): Promise<boolean> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          'emailConfirmation.confirmationCode': code,
        },
      },
      { new: true },
    );

    return true;
  }

  private getUsersMapping(user: NewUsersDBType): getUserViewModel {
    return {
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt.toISOString(),
    };
  }
}
