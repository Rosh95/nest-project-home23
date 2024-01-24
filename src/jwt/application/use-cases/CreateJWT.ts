import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { LoginSuccessViewModel } from '../../jwt.types';
import jwt from 'jsonwebtoken';
import { settings } from '../../jwt.settings';

export class CreateJWTCommand {
  constructor(public userId: Types.ObjectId) {}
}

@CommandHandler(CreateJWTCommand)
export class CreateJWT implements ICommandHandler<CreateJWTCommand> {
  constructor() {}

  async execute(command: CreateJWTCommand): Promise<LoginSuccessViewModel> {
    const token = jwt.sign({ userId: command.userId }, settings.JWT_SECRET, {
      expiresIn: '10s',
    });
    return {
      accessToken: token,
    };
  }
}
