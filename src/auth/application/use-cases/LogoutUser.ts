import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../users/user.repository';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { AuthService } from '../../auth.service';
import { AuthRepository } from '../../auth.repository';
import { JwtService } from '../../../jwt/jwt.service';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { GetTokenInfoByRefreshTokenCommand } from '../../../jwt/application/use-cases/GetTokenInfoByRefreshToken';
import { UserAndDeviceTypeFromRefreshToken } from '../../../jwt/jwt.types';
import { DeviceRepository } from '../../../devices/device.repository';

export class LogoutUserCommand {
  constructor(public refreshToken: string) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUser implements ICommandHandler<LogoutUserCommand> {
  constructor(
    public userRepository: UserRepository,
    public authService: AuthService,
    public authRepository: AuthRepository,
    public jwtService: JwtService,
    public usersQueryRepository: UsersQueryRepository,
    public deviceRepository: DeviceRepository,
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
    const result = await this.deviceRepository.updateIssuedDate(
      currentUserId,
      currentDeviceId,
    );
    if (!result) {
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'couldn`t update device info',
      };
    }
    await this.authRepository.addTokenInBlackList(command.refreshToken);

    return {
      data: 'ok',
      resultCode: ResultCode.Success,
    };
  }
}
