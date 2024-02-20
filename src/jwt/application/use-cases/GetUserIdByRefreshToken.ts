import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import jwt from 'jsonwebtoken';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Types } from 'mongoose';
import { settings } from '../../../settings';
import { AuthSqlRepository } from '../../../auth/auth.repository.sql';

export class GetUserIdByRefreshTokenCommand {
  constructor(public token: string) {}
}

@CommandHandler(GetUserIdByRefreshTokenCommand)
export class GetUserIdByRefreshToken
  implements ICommandHandler<GetUserIdByRefreshTokenCommand>
{
  constructor(public authRepository: AuthSqlRepository) {}

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
      result = jwt.verify(command.token, settings().JWT_SECRET) as {
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
      data: result.userId,
      resultCode: ResultCode.Success,
      field: 'refreshToken',
    };
  }
}
