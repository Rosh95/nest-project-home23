import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../users/user.repository';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { AuthService } from '../../auth.service';
import { AuthRepository } from '../../auth.repository';
import { JwtService } from '../../../jwt/jwt.service';
import { Types } from 'mongoose';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { v4 as uuidv4 } from 'uuid';
import { DeviceDBModel } from '../../../devices/device.types';
import { CreateJWTCommand } from '../../../jwt/application/use-cases/CreateJWT';
import { CreateRefreshJWTCommand } from '../../../jwt/application/use-cases/CreateRefreshJWT';
import { GetTokenInfoByRefreshTokenCommand } from '../../../jwt/application/use-cases/GetTokenInfoByRefreshToken';
import { UserAndDeviceTypeFromRefreshToken } from '../../../jwt/jwt.types';

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
    public userRepository: UserRepository,
    public authService: AuthService,
    public authRepository: AuthRepository,
    public jwtService: JwtService,
    public usersQueryRepository: UsersQueryRepository,
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
    if (currentUserInfo.data === null)
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'couldn`t get refreshToken',
      };
    const currentUserId: string = currentUserInfo.data.userId;
    const currentDeviceId: string = currentUserInfo.data.deviceId
      ? currentUserInfo.data.deviceId
      : uuidv4();

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
