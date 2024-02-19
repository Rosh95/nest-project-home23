import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { v4 as uuidv4 } from 'uuid';
import { AuthSqlRepository } from '../../auth.repository.sql';
import { UserSqlRepository } from '../../../users/user.repository.sql';
import { RecoveryCodesRepository } from '../../../email/recoveryCodes.repository';

export class AddRecoveryCodeAndEmailCommand {
  constructor(public email: string) {}
}

@CommandHandler(AddRecoveryCodeAndEmailCommand)
export class AddRecoveryCodeAndEmail
  implements ICommandHandler<AddRecoveryCodeAndEmailCommand>
{
  constructor(
    public userRepository: UserSqlRepository,
    public authRepository: AuthSqlRepository,
    public recoveryCodesRepository: RecoveryCodesRepository,
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
      await this.recoveryCodesRepository.findDataByRecoveryCode(recoveryCode);
    // await this.recoveryCodeModel.findOne({
    //   email: command.email,
    // });

    let result;
    if (isExistRecoveryCodeForCurrentEmail) {
      result = await this.recoveryCodesRepository.updateDataForRecoveryCode(
        command.email,
        recoveryCode,
      );
    } else {
      result = await this.recoveryCodesRepository.createDataForRecoveryCode(
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
