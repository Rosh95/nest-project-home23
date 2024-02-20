import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument } from './device.types';
import { Model } from 'mongoose';
import { LoginAttempt, LoginAttemptDocument } from '../auth/auth.schema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class DeviceRepositorySql {
  constructor(
    @InjectModel(Device.name) public deviceModel: Model<DeviceDocument>,
    @InjectModel(LoginAttempt.name)
    public loginAttemptModel: Model<LoginAttemptDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async deleteOtherUserDevice(
    userId: string,
    currentDeviceId: string,
  ): Promise<boolean> {
    const deletedOtherSession = await this.dataSource.query(
      `
      DELETE FROM public."Devices"
      WHERE "userId" = $1 and "deviceId" != $2
    `,
      [userId, currentDeviceId],
    );
    return deletedOtherSession[1] >= 1;
  }

  async deleteUserDeviceById(deviceId: string): Promise<boolean> {
    const deletedOtherSession = await this.dataSource.query(
      `
      DELETE FROM public."Devices"
      WHERE "deviceId" = $1
    `,
      [deviceId],
    );
    return deletedOtherSession[1] >= 1;

    // const result = await this.deviceModel.deleteOne({ deviceId: deviceId });
    // return result.deletedCount === 1;
  }
  async deleteCurrentUserDevice(
    userId: string,
    currentDeviceId: string,
  ): Promise<boolean> {
    const deletedUserSession = await this.dataSource.query(
      `
      DELETE FROM public."Devices"
      WHERE "userId" = $1 and "deviceId" = $2
    `,
      [userId, currentDeviceId],
    );
    console.log(deletedUserSession);
    return deletedUserSession[1] >= 1;

    // const result = await this.deviceModel.deleteMany({
    //   $and: [{ userId: userId }, { deviceId: currentDeviceId }],
    // });
    // return result.deletedCount >= 1;
  }

  async updateIssuedDate(userId: string, deviceId: string): Promise<boolean> {
    const result = await this.deviceModel.updateOne(
      { userId: userId, deviceId: deviceId },
      {
        $set: {
          issuedAt: 0,
          expirationAt: 0,
        },
      },
    );
    return result.matchedCount === 1;
  }

  async createLoginAtempt(ip: string, url: string, date: Date) {
    return this.loginAttemptModel.create({ ip, url, date });
  }
}
