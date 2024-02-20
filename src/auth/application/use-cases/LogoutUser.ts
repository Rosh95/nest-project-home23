import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { GetTokenInfoByRefreshTokenCommand } from '../../../jwt/application/use-cases/GetTokenInfoByRefreshToken';
import { UserAndDeviceTypeFromRefreshToken } from '../../../jwt/jwt.types';
import { AuthSqlRepository } from '../../auth.repository.sql';
import { DeviceQueryRepositorySql } from '../../../devices/deviceQuery.repository.sql';
import { DeviceRepositorySql } from '../../../devices/device.repository.sql';

export class LogoutUserCommand {
  constructor(public refreshToken: string) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUser implements ICommandHandler<LogoutUserCommand> {
  constructor(
    public authRepository: AuthSqlRepository,
    public usersQueryRepository: UsersQueryRepository,
    public deviceRepository: DeviceRepositorySql,
    public deviceQueryRepository: DeviceQueryRepositorySql,
    private commandBus: CommandBus,
  ) {}

  async execute(command: LogoutUserCommand): Promise<ResultObject<any>> {
    const isRefreshTokenInBlackList =
      await this.authRepository.findTokenInBlackList(command.refreshToken);
    if (isRefreshTokenInBlackList)
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'refreshToken used before',
      };
    const currentUserInfo: ResultObject<UserAndDeviceTypeFromRefreshToken> =
      await this.commandBus.execute(
        new GetTokenInfoByRefreshTokenCommand(command.refreshToken),
      );
    if (currentUserInfo.data === null)
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'couldn`t get refreshToken',
      };
    const currentUserId: string = currentUserInfo.data.userId;
    const currentDeviceId: string = currentUserInfo.data.deviceId;
    // const result = await this.deviceRepository.updateIssuedDate(
    //   currentUserId,
    //   currentDeviceId,
    // );
    const isActualSession =
      await this.deviceQueryRepository.findSessionByDeviceIdAndUserId(
        currentDeviceId,
        currentUserId,
      );

    if (!isActualSession) {
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'couldn`t session, please refresh your refreshToken',
      };
    }
    const result = await this.deviceRepository.deleteCurrentUserDevice(
      currentUserId,
      currentDeviceId,
    );
    if (!result) {
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'couldn`t delete device info',
      };
    }
    // await this.deviceRepository.deleteCurrentUserDevice(
    //   currentUserId,
    //   currentDeviceId,
    // );
    await this.authRepository.addTokenInBlackList(command.refreshToken);

    return {
      data: 'ok',
      resultCode: ResultCode.Success,
    };
  }
}
