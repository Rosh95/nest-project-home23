import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '../../auth.service';
import { AuthRepository } from '../../auth.repository';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import bcrypt from 'bcrypt';

export class ConfirmAndChangePasswordCommand {
  constructor(
    public recoveryCode: string,
    public password: string,
  ) {}
}

@CommandHandler(ConfirmAndChangePasswordCommand)
export class ConfirmAndChangePassword
  implements ICommandHandler<ConfirmAndChangePasswordCommand>
{
  constructor(
    public authService: AuthService,
    public authRepository: AuthRepository,
  ) {}

  async execute(
    command: ConfirmAndChangePasswordCommand,
  ): Promise<ResultObject<string>> {
    const foundEmailByRecoveryCode =
      await this.authRepository.findEmailByRecoveryCode(command.recoveryCode);
    if (!foundEmailByRecoveryCode) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t find user be recovery code',
      };
    }
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this.authService._generateHash(
      command.password,
      passwordSalt,
    );
    await this.authRepository.updateUserPassword(
      foundEmailByRecoveryCode,
      passwordHash,
      passwordSalt,
    );
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
