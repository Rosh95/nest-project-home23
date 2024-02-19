import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginSuccessViewModelForRefresh } from '../../jwt.types';
import jwt from 'jsonwebtoken';
import { settings } from '../../../settings';

export class CreateRefreshJWTCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(CreateRefreshJWTCommand)
export class CreateRefreshJWT
  implements ICommandHandler<CreateRefreshJWTCommand>
{
  constructor() {}

  async execute(
    command: CreateRefreshJWTCommand,
  ): Promise<LoginSuccessViewModelForRefresh> {
    const token = jwt.sign(
      {
        userId: command.userId,
        deviceId: command.deviceId,
      },
      settings().JWT_SECRET,
      { expiresIn: settings().REFRESH_JWT_LIFETIME },
    );
    return {
      refreshToken: token,
    };
  }
}
