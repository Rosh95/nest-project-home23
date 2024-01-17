import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../users/user.repository';
import { AuthRepository } from '../../auth.repository';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecoveryCode, RecoveryCodeDocument } from '../../auth.schema';

export class AddRecoveryCodeAndEmailCommand {
  constructor(public email: string) {}
}

@CommandHandler(AddRecoveryCodeAndEmailCommand)
export class AddRecoveryCodeAndEmail
  implements ICommandHandler<AddRecoveryCodeAndEmailCommand>
{
  constructor(
    public userRepository: UserRepository,
    public authRepository: AuthRepository,
    @InjectModel(RecoveryCode.name)
    public recoveryCodeModel: Model<RecoveryCodeDocument>,
  ) {}

  async execute(
    command: AddRecoveryCodeAndEmailCommand,
  ): Promise<ResultObject<string>> {
    const recoveryCode = uuidv4();
    const foundUserByEmail = await this.userRepository.findUserByEmail(
      command.email,
    );
    if (!foundUserByEmail) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find user',
      };
    }
    const isExistRecoveryCodeForCurrentEmail =
      await this.recoveryCodeModel.findOne({
        email: command.email,
      });
    let result;
    if (isExistRecoveryCodeForCurrentEmail) {
      result = await this.authRepository.updateRecoveryCode(
        command.email,
        recoveryCode,
      );
    } else {
      result = await this.authRepository.addRecoveryCodeAndEmail(
        command.email,
        recoveryCode,
      );
    }
    return result
      ? {
          data: recoveryCode,
          resultCode: ResultCode.NotFound,
          message: 'couldn`t find user',
        }
      : {
          data: null,
          resultCode: ResultCode.BadRequest,
          message: 'couldn`t send recovery code',
        };
  }
}
