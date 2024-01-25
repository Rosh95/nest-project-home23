import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { AuthRepository } from '../../auth.repository';
import { Types } from 'mongoose';
import {
  mappingErrorStatus,
  ResultCode,
  ResultObject,
} from '../../../helpers/heplersType';
import { DeviceDBModel } from '../../../devices/device.types';
import { CreateJWTCommand } from '../../../jwt/application/use-cases/CreateJWT';
import { CreateRefreshJWTCommand } from '../../../jwt/application/use-cases/CreateRefreshJWT';
import { GetTokenInfoByRefreshTokenCommand } from '../../../jwt/application/use-cases/GetTokenInfoByRefreshToken';
import { UserAndDeviceTypeFromRefreshToken } from '../../../jwt/jwt.types';
import { DeviceQueryRepository } from '../../../devices/deviceQuery.repository';

export class RefreshTokenByRefreshCommand {
  constructor(
    public refreshToken: string,
    public userAgent: string,
    public ip: string,
  ) {}
}

@CommandHandler(RefreshTokenByRefreshCommand)
export class RefreshTokenByRefresh
  implements ICommandHandler<RefreshTokenByRefreshCommand>
{
  constructor(
    public authRepository: AuthRepository,
    public usersQueryRepository: UsersQueryRepository,
    public deviceQueryRepository: DeviceQueryRepository,
    private commandBus: CommandBus,
  ) {}

  async execute(
    command: RefreshTokenByRefreshCommand,
  ): Promise<ResultObject<any>> {
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
    if (currentUserInfo.data === null) mappingErrorStatus(currentUserInfo);
    // return {
    //   data: null,
    //   resultCode: ResultCode.Unauthorized,
    //   message: 'couldn`t get refreshToken',
    // };
    const currentUserId: string = currentUserInfo.data!.userId;
    const currentDeviceId: string = currentUserInfo.data!.deviceId;

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
    const accessToken = await this.commandBus.execute(
      new CreateJWTCommand(new Types.ObjectId(currentUserId)),
    );
    const refreshToken = await this.commandBus.execute(
      new CreateRefreshJWTCommand(
        new Types.ObjectId(currentUserId),
        currentDeviceId,
      ),
    );

    const getInfoFromRefreshToken = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken.refreshToken),
    );

    if (!getInfoFromRefreshToken.data) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t get refreshToken',
      };
    }
    const result: DeviceDBModel = {
      userId: currentUserId,
      issuedAt: getInfoFromRefreshToken.data.iat,
      expirationAt: getInfoFromRefreshToken.data.exp,
      deviceId: currentDeviceId,
      ip: command.ip,
      deviceName: command.userAgent,
    };
    const isCreated =
      await this.authRepository.createOrUpdateRefreshToken(result);
    if (!isCreated) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t get refreshToken',
      };
    }
    await this.authRepository.addTokenInBlackList(command.refreshToken);

    return {
      data: {
        accessToken: accessToken.accessToken,
        refreshToken: refreshToken.refreshToken,
      },
      resultCode: ResultCode.Success,
    };
  }
}
