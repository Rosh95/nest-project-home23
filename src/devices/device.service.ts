import { Injectable } from '@nestjs/common';
import { DeviceRepository } from './device.repository';
import { UserAndDeviceTypeFromRefreshToken } from '../jwt/jwt.types';
import { ResultCode, ResultObject } from '../helpers/heplersType';
import { DeviceQueryRepository } from './deviceQuery.repository';

@Injectable()
export class DeviceService {
  constructor(
    public deviceRepository: DeviceRepository,
    public deviceQueryRepository: DeviceQueryRepository,
  ) {}

  async deleteOtherUserDevice(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    return await this.deviceRepository.deleteOtherUserDevice(userId, deviceId);
  }

  async deleteUserDeviceById(
    currentUserInfo: UserAndDeviceTypeFromRefreshToken,
    currentDeviceId: string,
  ): Promise<ResultObject<boolean>> {
    const findUserIdByDeviceId =
      await this.deviceQueryRepository.findUserIdByDeviceId(currentDeviceId);
    if (!findUserIdByDeviceId) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        errorMessage: 'user not found',
      };
    }

    if (currentDeviceId === currentUserInfo.deviceId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        errorMessage: 'cant delete current device',
      };
    }
    if (findUserIdByDeviceId !== currentUserInfo.userId) {
      return {
        data: null,
        resultCode: ResultCode.Forbidden,
        errorMessage: 'cant delete another device id',
      };
    }

    const isDeleted: boolean =
      await this.deviceRepository.deleteUserDeviceById(currentDeviceId);
    if (isDeleted) {
      return {
        data: true,
        resultCode: ResultCode.Success,
        errorMessage: '',
      };
    }

    return {
      data: null,
      resultCode: ResultCode.ServerError,
      errorMessage: 'server error',
    };
  }
}