//import { DeviceModel, LoginAttemptModel } from '../db/dbMongo';
import {
  Device,
  DeviceDBModel,
  DeviceDocument,
  DeviceViewModel,
  DeviceViewModelArray,
} from './device.types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginAttempt, LoginAttemptDocument } from '../auth/auth.schema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class DeviceQueryRepository {
  constructor(
    @InjectModel(Device.name) public deviceModel: Model<DeviceDocument>,
    @InjectModel(LoginAttempt.name)
    public loginAttemptModel: Model<LoginAttemptDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async getAllDeviceSessions(userId: string): Promise<DeviceViewModelArray> {
    const sessions = await this.deviceModel
      .find({
        userId: userId,
        issuedAt: { $ne: 0 },
      })
      .lean();
    return sessions.map((session) => this.getSessionsMapping(session));
  }

  async findUserIdByDeviceId(deviceId: string): Promise<string | null> {
    const foundDeviceInfo = await this.deviceModel.findOne({
      deviceId: deviceId,
    });
    if (foundDeviceInfo) {
      return foundDeviceInfo.userId;
    }
    return null;
  }
  async findSessionByDeviceIdAndUserId(
    deviceId: string,
    userId: string,
  ): Promise<string | null> {
    const foundDeviceInfo = await this.dataSource.query(
      `
      SELECT id, "userId", "issuedAt", "expirationAt", "deviceId", ip, "deviceName"
      FROM public."Devices"
      WHERE "userId" = $1 AND "deviceId" = $2
    `,
      [userId, deviceId],
    );
    if (foundDeviceInfo) {
      return foundDeviceInfo[0].userId;
    }
    return null;
    //
    // const foundDeviceInfo = await this.deviceModel.findOne({
    //   deviceId: deviceId,
    //   userId: userId,
    // });
    // if (foundDeviceInfo) {
    //   return foundDeviceInfo.userId;
    // }
    // return null;
  }

  private getSessionsMapping(device: DeviceDBModel): DeviceViewModel {
    return {
      ip: device.ip,
      title: device.deviceName,
      lastActiveDate: new Date(device.issuedAt * 1000).toISOString(),
      deviceId: device.deviceId,
    };
  }
  async getLoginAtemptsByUrlAndIp(ip: string, url: string, date: Date) {
    return this.loginAttemptModel.countDocuments({
      ip,
      url,
      date: { $gt: date },
    });
  }
}
