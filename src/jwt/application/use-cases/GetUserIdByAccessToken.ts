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
        iat: number;
        exp: number;
      };

      console.log(result.iat + ' iat');
      console.log(result.exp + ' exp');
      console.log(new Date().getTime() / 1000 + ' currenttime');
      const result22 = result.exp < new Date().getTime() / 1000;
      console.log(result22);
      if (result22) {
        return null;
      }
    } catch (e) {
      return null;
    }

    return result.userId;
  }
}
