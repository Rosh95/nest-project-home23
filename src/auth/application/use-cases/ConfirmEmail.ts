import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { UserSqlRepository } from '../../../users/user.repository.sql';
import { AuthSqlRepository } from '../../auth.repository.sql';

export class ConfirmEmailCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmail implements ICommandHandler<ConfirmEmailCommand> {
  constructor(
    public userRepository: UserSqlRepository,
    public authRepository: AuthSqlRepository,
  ) {}

  async execute(command: ConfirmEmailCommand): Promise<ResultObject<string>> {
    const foundUser = await this.userRepository.findUserByCode(command.code);
    if (!foundUser) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t find user by code',
        field: 'code',
      };
    }
    if (foundUser.emailExpiration.getTime() < new Date().getTime()) {
      console.log(foundUser.emailExpiration.getTime() + 'emailExpiration');
      console.log(new Date().getTime() + 'now time');
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'confirmation code is Expired',
        field: 'code',
      };
    }
    if (foundUser.isConfirmed) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'confirmation code is already confirmed',
        field: 'code',
      };
    }
    const isUpdated = await this.authRepository.updateEmailConfirmation(
      foundUser.userId,
    );
    if (!isUpdated) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t update confirmation code ',
        field: 'code',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
