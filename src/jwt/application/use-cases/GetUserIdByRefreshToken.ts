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
    let result;
    try {
      result = jwt.verify(command.token, settings.JWT_SECRET) as {
        userId: string;
      };
    } catch (error) {
      return null;
    }
    return new ObjectId(result.userId);
  }
}
