import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginSuccessViewModel } from '../../jwt.types';
import jwt from 'jsonwebtoken';
import { settings } from '../../../settings';

export class CreateJWTCommand {
  constructor(public userId: string) {}
}

@CommandHandler(CreateJWTCommand)
export class CreateJWT implements ICommandHandler<CreateJWTCommand> {
  constructor() {}

  async execute(command: CreateJWTCommand): Promise<LoginSuccessViewModel> {
    const token = jwt.sign({ userId: command.userId }, settings().JWT_SECRET, {
      expiresIn: settings().ACCESS_JWT_LIFETIME,
    });
    return {
      accessToken: token,
    };
  }
}
