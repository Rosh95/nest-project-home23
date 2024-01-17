import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserAndDeviceTypeFromRefreshToken } from '../../jwt.types';
import jwt from 'jsonwebtoken';
import { settings } from '../../jwt.settings';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';

export class GetTokenInfoByRefreshTokenCommand {
  constructor(public token: string) {}
}

@CommandHandler(GetTokenInfoByRefreshTokenCommand)
export class GetTokenInfoByRefreshToken
  implements ICommandHandler<GetTokenInfoByRefreshTokenCommand>
{
  constructor() {}

  async execute(
    command: GetTokenInfoByRefreshTokenCommand,
  ): Promise<ResultObject<UserAndDeviceTypeFromRefreshToken>> {
    const result = jwt.verify(command.token, settings.JWT_SECRET) as {
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    };
    // const currentUser = await this.usersQueryRepository.findUserById(
    //   result.userId,
    // );
    //
    // if (!currentUser) {
    //   return {
    //     data: null,
    //     resultCode: ResultCode.Unauthorized,
    //     message: 'couldn`t find user',
    //   };
    // }
    return {
      data: result,
      resultCode: ResultCode.NoContent,
    };
  }
}
