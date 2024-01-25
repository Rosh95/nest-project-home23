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

export class DeviceQueryRepository {
  constructor(
    @InjectModel(Device.name) public deviceModel: Model<DeviceDocument>,
    @InjectModel(LoginAttempt.name)
    public loginAttemptModel: Model<LoginAttemptDocument>,
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
    const foundDeviceInfo = await this.deviceModel.findOne({
      deviceId: deviceId,
      userId: userId,
    });
    if (foundDeviceInfo) {
      return foundDeviceInfo.userId;
    }
    return null;
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
