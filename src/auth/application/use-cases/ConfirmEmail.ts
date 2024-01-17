import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../auth.repository';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { UserRepository } from '../../../users/user.repository';

export class ConfirmEmailCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmail implements ICommandHandler<ConfirmEmailCommand> {
  constructor(
    public userRepository: UserRepository,
    public authRepository: AuthRepository,
  ) {}

  async execute(command: ConfirmEmailCommand): Promise<ResultObject<string>> {
    const findUser = await this.userRepository.findUserByCode(command.code);
    if (!findUser) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t find user by code',
        field: 'code',
      };
    }
    if (
      findUser.emailConfirmation.emailExpiration.getTime() <
      new Date().getTime()
    ) {
      console.log(findUser.emailConfirmation.emailExpiration.getTime());
      console.log(new Date().getTime());
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'confirmation code is Expired',
        field: 'code',
      };
    }
    if (findUser.emailConfirmation.isConfirmed) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'confirmation code is already confirmed',
        field: 'code',
      };
    }
    const isUpdated = await this.authRepository.updateEmailConfimation(
      findUser._id,
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
