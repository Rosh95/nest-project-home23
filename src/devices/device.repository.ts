import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument } from './device.types';
import { Model } from 'mongoose';
import { LoginAttempt, LoginAttemptDocument } from '../auth/auth.schema';

export class DeviceRepository {
  constructor(
    @InjectModel(Device.name) public deviceModel: Model<DeviceDocument>,
    @InjectModel(LoginAttempt.name)
    public loginAttemptModel: Model<LoginAttemptDocument>,
  ) {}
  async deleteOtherUserDevice(
    userId: string,
    currentDeviceId: string,
  ): Promise<boolean> {
    const result = await this.deviceModel.deleteMany({
      $and: [{ userId: userId }, { deviceId: { $ne: currentDeviceId } }],
    });
    return result.deletedCount >= 1;
  }

  async deleteUserDeviceById(deviceId: string): Promise<boolean> {
    const result = await this.deviceModel.deleteOne({ deviceId: deviceId });
    return result.deletedCount === 1;
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
