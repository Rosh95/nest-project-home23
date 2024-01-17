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
    const result = command.token
      ? (jwt.verify(command.token, settings.JWT_SECRET) as {
          userId: string;
        })
      : null;

    return result ? new Types.ObjectId(result.userId) : null;
  }
}
