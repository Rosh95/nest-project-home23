import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceRepository } from '../../device.repository';
import { UserAndDeviceTypeFromRefreshToken } from '../../../jwt/jwt.types';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { DeviceQueryRepository } from '../../deviceQuery.repository';

export class DeleteUserDeviceByIdCommand {
  constructor(
    public currentUserInfo: UserAndDeviceTypeFromRefreshToken,
    public currentDeviceId: string,
  ) {}
}

@CommandHandler(DeleteUserDeviceByIdCommand)
export class DeleteUserDeviceById
  implements ICommandHandler<DeleteUserDeviceByIdCommand>
{
  constructor(
    public deviceRepository: DeviceRepository,
    public deviceQueryRepository: DeviceQueryRepository,
  ) {}

  async execute(
    command: DeleteUserDeviceByIdCommand,
  ): Promise<ResultObject<boolean>> {
    const findUserIdByDeviceId =
      await this.deviceQueryRepository.findUserIdByDeviceId(
        command.currentDeviceId,
      );
    if (!findUserIdByDeviceId) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'user not found',
        field: 'refreshToken',
      };
    }

    if (command.currentDeviceId === command.currentUserInfo.deviceId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'cant delete current device',
      };
    }
    if (findUserIdByDeviceId !== command.currentUserInfo.userId) {
      return {
        data: null,
        resultCode: ResultCode.Forbidden,
        message: 'cant delete another device id',
      };
    }

    const isDeleted: boolean = await this.deviceRepository.deleteUserDeviceById(
      command.currentDeviceId,
    );
    if (isDeleted) {
      return {
        data: true,
        resultCode: ResultCode.Success,
        message: '',
      };
    }

    return {
      data: null,
      resultCode: ResultCode.ServerError,
      message: 'server error',
    };
  }
}
