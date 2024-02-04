import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Device, DeviceDBModel, DeviceDocument } from '../devices/device.types';
import { InjectModel } from '@nestjs/mongoose';
import { RecoveryCode, RecoveryCodeDocument } from './auth.schema';
import { User, UserDocument } from '../users/user.schema';
import {
  TokensBlackList,
  TokensBlackListDocument,
} from './schemas/TokensBlackListSchema';

export class AuthRepository {
  constructor(
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    @InjectModel(RecoveryCode.name)
    public recoveryCodeModel: Model<RecoveryCodeDocument>,
    @InjectModel(Device.name)
    public deviceModel: Model<DeviceDocument>,
    @InjectModel(TokensBlackList.name)
    public tokensBlackListModel: Model<TokensBlackListDocument>,
  ) {}

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

  async addTokenInBlackList(token: string) {
    return this.tokensBlackListModel.insertMany({ token: token });
  }

  async findTokenInBlackList(token: string) {
    return this.tokensBlackListModel.findOne({ token: token });
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
    }
    try {
      await this.deviceModel.create(refreshTokenInfo);
      return true;
    } catch (e) {
      return false;
    }
  }
}
