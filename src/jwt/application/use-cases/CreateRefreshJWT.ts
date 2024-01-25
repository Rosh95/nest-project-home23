import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { LoginSuccessViewModelForRefresh } from '../../jwt.types';
import jwt from 'jsonwebtoken';
import { settings } from '../../jwt.settings';

export class CreateRefreshJWTCommand {
  constructor(
    public userId: Types.ObjectId,
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
      settings.JWT_SECRET,
      { expiresIn: '2000s' },
    );
    return {
      refreshToken: token,
    };
  }
}
