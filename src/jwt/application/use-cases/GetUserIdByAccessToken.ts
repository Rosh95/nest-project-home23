import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import jwt from 'jsonwebtoken';
import { settings } from '../../../settings';

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
  ): Promise<string | null> {
    if (!command.token) return null;
    let result;
    try {
      result = jwt.verify(command.token, settings().JWT_SECRET) as {
        userId: string;
      };
    } catch (e) {
      return null;
    }

    return result.userId;
  }
}
