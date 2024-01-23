import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import jwt from 'jsonwebtoken';
import { settings } from '../../jwt.settings';
import { Types } from 'mongoose';

export class GetUserIdByAccessTokenCommand {
  constructor(public token: string | null) {}
}

@CommandHandler(GetUserIdByAccessTokenCommand)
export class GetUserIdByAccessToken
  implements ICommandHandler<GetUserIdByAccessTokenCommand>
{
  constructor() {}

  async execute(
    command: GetUserIdByAccessTokenCommand,
  ): Promise<Types.ObjectId | null> {
    if (!command.token) return null;
    let result;
    try {
      result = jwt.verify(command.token, settings.JWT_SECRET) as {
        userId: string;
      };
    } catch (e) {
      return null;
    }

    return new Types.ObjectId(result.userId);
  }
}
