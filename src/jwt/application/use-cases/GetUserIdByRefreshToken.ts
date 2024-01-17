import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import jwt from 'jsonwebtoken';
import { settings } from '../../jwt.settings';
import { ObjectId } from 'mongodb';

export class GetUserIdByRefreshTokenCommand {
  constructor(public token: string) {}
}

@CommandHandler(GetUserIdByRefreshTokenCommand)
export class GetUserIdByRefreshToken
  implements ICommandHandler<GetUserIdByRefreshTokenCommand>
{
  constructor() {}

  async execute(
    command: GetUserIdByRefreshTokenCommand,
  ): Promise<ObjectId | null> {
    try {
      const result = jwt.verify(command.token, settings.JWT_SECRET) as {
        userId: string;
      };

      return new ObjectId(result.userId);
    } catch (error) {
      return null;
    }
  }
}
