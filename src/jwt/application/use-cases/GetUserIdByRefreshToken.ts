import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import jwt from 'jsonwebtoken';
import { settings } from '../../jwt.settings';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Types } from 'mongoose';
import { AuthRepository } from '../../../auth/auth.repository';

export class GetUserIdByRefreshTokenCommand {
  constructor(public token: string) {}
}

@CommandHandler(GetUserIdByRefreshTokenCommand)
export class GetUserIdByRefreshToken
  implements ICommandHandler<GetUserIdByRefreshTokenCommand>
{
  constructor(public authRepository: AuthRepository) {}

  async execute(
    command: GetUserIdByRefreshTokenCommand,
  ): Promise<ResultObject<Types.ObjectId>> {
    const isRefreshTokenInBlackList =
      await this.authRepository.findTokenInBlackList(command.token);
    if (isRefreshTokenInBlackList)
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'refreshToken used before',
      };

    let result;
    try {
      result = jwt.verify(command.token, settings.JWT_SECRET) as {
        userId: string;
      };
    } catch (error) {
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        field: 'refreshToken',
      };
    }
    return {
      data: new Types.ObjectId(result.userId),
      resultCode: ResultCode.Success,
      field: 'refreshToken',
    };
  }
}
