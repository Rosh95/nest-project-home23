import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserAndDeviceTypeFromRefreshToken } from '../../jwt.types';
import jwt from 'jsonwebtoken';
import { settings } from '../../jwt.settings';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';

export class GetTokenInfoByRefreshTokenCommand {
  constructor(public token: string) {}
}

@CommandHandler(GetTokenInfoByRefreshTokenCommand)
export class GetTokenInfoByRefreshToken
  implements ICommandHandler<GetTokenInfoByRefreshTokenCommand>
{
  constructor(private usersQueryRepository: UsersQueryRepository) {}

  async execute(
    command: GetTokenInfoByRefreshTokenCommand,
  ): Promise<ResultObject<UserAndDeviceTypeFromRefreshToken>> {
    let result;
    try {
      result = jwt.verify(command.token, settings.JWT_SECRET) as {
        userId: string;
        deviceId: string;
        iat: number;
        exp: number;
      };
    } catch (e) {
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'something wrong with refresh token',
      };
    }

    const currentUser = await this.usersQueryRepository.findUserById(
      result.userId,
    );
    if (!currentUser) {
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'couldn`t find user',
      };
    }

    // const isActualSession =
    //   await this.deviceQueryRepository.findSessionByDeviceIdAndUserId(
    //     result.deviceId,
    //     result.userId,
    //   );
    //
    // if (!isActualSession) {
    //   return {
    //     data: null,
    //     resultCode: ResultCode.Unauthorized,
    //     message: 'couldn`t session, please refresh your refreshToken',
    //   };
    // }
    return {
      data: result,
      resultCode: ResultCode.NoContent,
    };
  }
}
