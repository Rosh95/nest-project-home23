import { Injectable } from '@nestjs/common';
import { DeviceQueryRepositorySql } from './deviceQuery.repository.sql';
import { DeviceRepositorySql } from './device.repository.sql';

@Injectable()
export class DeviceService {
  constructor(
    public deviceRepository: DeviceRepositorySql,
    public deviceQueryRepository: DeviceQueryRepositorySql,
  ) {}

  // async deleteOtherUserDevice(
  //   userId: string,
  //   deviceId: string,
  // ): Promise<boolean> {
  //   return await this.deviceRepository.deleteOtherUserDevice(userId, deviceId);
  // }

  // async deleteUserDeviceById(
  //   currentUserInfo: UserAndDeviceTypeFromRefreshToken,
  //   currentDeviceId: string,
  // ): Promise<ResultObject<boolean>> {
  //   const findUserIdByDeviceId =
  //     await this.deviceQueryRepository.findUserIdByDeviceId(currentDeviceId);
  //   if (!findUserIdByDeviceId) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.NotFound,
  //       message: 'user not found',
  //     };
  //   }
  //
  //   if (currentDeviceId === currentUserInfo.deviceId) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.BadRequest,
  //       message: 'cant delete current device',
  //     };
  //   }
  //   if (findUserIdByDeviceId !== currentUserInfo.userId) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.Forbidden,
  //       message: 'cant delete another device id',
  //     };
  //   }
  //
  //   const isDeleted: boolean =
  //     await this.deviceRepository.deleteUserDeviceById(currentDeviceId);
  //   if (isDeleted) {
  //     return {
  //       data: true,
  //       resultCode: ResultCode.Success,
  //       message: '',
  //     };
  //   }
  //
  //   return {
  //     data: null,
  //     resultCode: ResultCode.ServerError,
  //     message: 'server error',
  //   };
  // }
}
