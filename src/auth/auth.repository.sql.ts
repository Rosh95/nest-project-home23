import { Model } from 'mongoose';
import { Device, DeviceDBModel, DeviceDocument } from '../devices/device.types';
import { InjectModel } from '@nestjs/mongoose';
import { RecoveryCode, RecoveryCodeDocument } from './auth.schema';
import { User, UserDocument } from '../users/user.schema';
import {
  TokensBlackList,
  TokensBlackListDocument,
} from './schemas/TokensBlackListSchema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getUserViewModel } from '../users/user.types';

export class AuthSqlRepository {
  constructor(
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    @InjectModel(RecoveryCode.name)
    public recoveryCodeModel: Model<RecoveryCodeDocument>,
    @InjectModel(Device.name)
    public deviceModel: Model<DeviceDocument>,
    @InjectModel(TokensBlackList.name)
    public tokensBlackListModel: Model<TokensBlackListDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async updateEmailConfirmation(userId: string): Promise<boolean> {
    const isUpdatedEmailConfirmation = await this.dataSource.query(
      `
      UPDATE public."EmailConfirmationUser"
      SET "isConfirmed"= true
      WHERE "userId" = $1;
    `,
      [userId],
    );
    console.log(isUpdatedEmailConfirmation + ' isUpdatedEmailConfirmation');
    return isUpdatedEmailConfirmation[1] === 1;
    // const result = await this.userModel.updateOne(
    //   { _id: new ObjectId(userId) },
    //   {
    //     $set: {
    //       'emailConfirmation.isConfirmed': true,
    //     },
    //   },
    // );
    // return result.matchedCount === 1;
  }

  async updateUserPassword(
    email: string,
    passwordHash: string,
    passwordSalt: string,
  ): Promise<boolean> {
    await this.dataSource.query(
      `
    UPDATE public."Users"
    SET  "passwordHash"= $2, "passwordSalt"= $3 
        WHERE email = $1;   
    `,
      [email, passwordHash, passwordSalt],
    );
    const updatedUserInfo = await this.dataSource.query(
      `
      SELECT id, login, email, "passwordHash", "passwordSalt" 
      FROM public."Users"
      WHERE email  = $1
      `,
      [email],
    );
    if (updatedUserInfo.passwordHash !== passwordHash) {
      return false;
    }
    return true;

    // await this.userModel.findOneAndUpdate(
    //   { 'accountData.email': email },
    //   {
    //     $set: {
    //       'accountData.passwordHash': passwordHash,
    //       'accountData.passwordSalt': passwordSalt,
    //     },
    //   },
    // );
    // return true;
  }

  // async updateRecoveryCode(
  //   email: string,
  //   recoveryCode: string,
  // ): Promise<ObjectId | null> {
  //   const result = await this.recoveryCodeModel.findOneAndUpdate(
  //     { email },
  //     {
  //       $set: { recoveryCode },
  //     },
  //     { returnDocument: 'after' },
  //   );
  //
  //   return result ? result._id : null;
  // }

  // async addRecoveryCodeAndEmail(
  //   email: string,
  //   recoveryCode: string,
  // ): Promise<ObjectId> {
  //   const result = await this.recoveryCodeModel.create({ email, recoveryCode });
  //   return result._id;
  // }

  // async findEmailByRecoveryCode(recoveryCode: string): Promise<string | null> {
  //   const result = await this.recoveryCodeModel.findOne({ recoveryCode });
  //   return result ? result.email : null;
  // }

  async addTokenInBlackList(token: string) {
    const result = await this.dataSource.query(
      `
        INSERT INTO public."TokensBlackList"(token)
        VALUES ($1);
    `,
      [token],
    );
    return result[0] ? true : false;

    //  return this.tokensBlackListModel.insertMany({ token: token });
  }

  async findTokenInBlackList(token: string) {
    const result = await this.dataSource.query(
      `
    SELECT token FROM public."TokensBlackList"
    WHERE token = $1
    `,
      [token],
    );
    return result[0] ? true : false;
    //  return this.tokensBlackListModel.findOne({ token: token });
  }

  async createOrUpdateRefreshToken(
    refreshTokenInfo: DeviceDBModel,
  ): Promise<boolean> {
    const queryForFindDevice = `
    SELECT * FROM public."Devices" u 
    WHERE "userId" = $1 AND  "deviceId" = $2
    `;
    const foundUserDevices: getUserViewModel[] = await this.dataSource.query(
      queryForFindDevice,
      [`${refreshTokenInfo.userId}`, `${refreshTokenInfo.deviceId}`],
    );
    if (foundUserDevices[0]) {
      const updatedDevice = await this.dataSource.query(
        `
      UPDATE public."Devices"
      SET  "issuedAt"= $3, "expirationAt"= $4, "ip" = $5 , "deviceName"= $6
      WHERE "userId" = $1 and "deviceId" = $2 ;
      `,
        [
          `${refreshTokenInfo.userId}`,
          `${refreshTokenInfo.deviceId}`,
          `${refreshTokenInfo.issuedAt}`,
          `${refreshTokenInfo.expirationAt}`,
          `${refreshTokenInfo.ip}`,
          `${refreshTokenInfo.deviceName}`,
        ],
      );
      return updatedDevice[1] === 1;
    }
    try {
      await this.dataSource.query(
        `
      INSERT INTO public."Devices"(
       "userId", "issuedAt", "expirationAt", "deviceId", "ip", "deviceName")
        VALUES ($1, $2, $3, $4, $5, $6);
      `,
        [
          `${refreshTokenInfo.userId}`,
          `${refreshTokenInfo.issuedAt}`,
          `${refreshTokenInfo.expirationAt}`,
          `${refreshTokenInfo.deviceId}`,
          `${refreshTokenInfo.ip}`,
          `${refreshTokenInfo.deviceName}`,
        ],
      );
      return true;
    } catch (e) {
      return false;
    }
    // const findUserInRefreshCollection = await this.deviceModel.findOne(filter);
    //
    // if (findUserInRefreshCollection) {
    //   const newRefreshToken = await this.deviceModel.updateOne(filter, {
    //     $set: {
    //       issuedAt: refreshTokenInfo.issuedAt,
    //       expirationAt: refreshTokenInfo.expirationAt,
    //       ip: refreshTokenInfo.ip,
    //       deviceName: refreshTokenInfo.deviceName,
    //     },
    //   });
    //   return newRefreshToken.matchedCount === 1;
    // }
    // try {
    //   await this.deviceModel.create(refreshTokenInfo);
    //   return true;
    // } catch (e) {
    //   return false;
    // }
  }
}
