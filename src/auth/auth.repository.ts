import { FilterQuery, Model } from 'mongoose';
import { NewUsersDBType } from '../users/user.types';
import { ObjectId } from 'mongodb';
import { Device, DeviceDBModel, DeviceDocument } from '../devices/device.types';
import { InjectModel } from '@nestjs/mongoose';
import { RecoveryCode, RecoveryCodeDocument } from './auth.schema';
import { User, UserDocument } from '../users/user.schema';

export class AuthRepository {
  constructor(
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    @InjectModel(RecoveryCode.name)
    public recoveryCodeModel: Model<RecoveryCodeDocument>,
    @InjectModel(Device.name)
    public deviceModel: Model<DeviceDocument>,
  ) {}

  async getAllUsers() {
    return this.userModel.find().sort({ createdAt: -1 }).lean();
  }
  async deleteUser(id: ObjectId): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async findUserById(userId: string): Promise<NewUsersDBType | null> {
    const foundUser: NewUsersDBType | null = await this.userModel.findOne({
      _id: new ObjectId(userId),
    });
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

  async updateEmailConfimation(userId: ObjectId): Promise<boolean> {
    const result = await this.userModel.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'emailConfirmation.isConfirmed': true,
        },
      },
    );
    return result.matchedCount === 1;
  }

  async updateUserPassword(
    email: string,
    passwordHash: string,
    passwordSalt: string,
  ): Promise<boolean> {
    await this.userModel.findOneAndUpdate(
      { 'accountData.email': email },
      {
        $set: {
          'accountData.passwordHash': passwordHash,
          'accountData.passwordSalt': passwordSalt,
        },
      },
    );
    return true;
  }

  async updateRecoveryCode(
    email: string,
    recoveryCode: string,
  ): Promise<ObjectId | null> {
    const result = await this.recoveryCodeModel.findOneAndUpdate(
      { email },
      {
        $set: { recoveryCode },
      },
      { returnDocument: 'after' },
    );

    return result ? result._id : null;
  }

  async addRecoveryCodeAndEmail(
    email: string,
    recoveryCode: string,
  ): Promise<ObjectId> {
    const result = await this.recoveryCodeModel.create({ email, recoveryCode });
    return result._id;
  }

  async findEmailByRecoveryCode(recoveryCode: string): Promise<string | null> {
    const result = await this.recoveryCodeModel.findOne({ recoveryCode });
    return result ? result.email : null;
  }

  async createOrUpdateRefreshToken(
    refreshTokenInfo: DeviceDBModel,
  ): Promise<boolean> {
    const filter: FilterQuery<DeviceDBModel> = {
      userId: refreshTokenInfo.userId,
      deviceId: refreshTokenInfo.deviceId,
    };
    const findUserInRefreshCollection = await this.deviceModel.findOne(filter);
    if (findUserInRefreshCollection) {
      const newRefreshToken = await this.deviceModel.updateOne(filter, {
        $set: {
          issuedAt: refreshTokenInfo.issuedAt,
          expirationAt: refreshTokenInfo.expirationAt,
          ip: refreshTokenInfo.ip,
          deviceName: refreshTokenInfo.deviceName,
        },
      });
      return newRefreshToken.matchedCount === 1;
    } else {
      try {
        await this.deviceModel.create(refreshTokenInfo);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
}
