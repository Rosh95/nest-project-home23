import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { UserRepository } from '../../../users/user.repository';
import { v4 as uuidv4 } from 'uuid';

export class ChangeUserConfirmationCodeCommand {
  constructor(public email: string) {}
}

@CommandHandler(ChangeUserConfirmationCodeCommand)
export class ChangeUserConfirmationCode
  implements ICommandHandler<ChangeUserConfirmationCodeCommand>
{
  constructor(public userRepository: UserRepository) {}

  async execute(
    command: ChangeUserConfirmationCodeCommand,
  ): Promise<ResultObject<string>> {
    const currentUser = await this.userRepository.findUserByEmail(
      command.email,
    );

    if (!currentUser) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'email',
        message: 'user doesn`t exist',
      };
    }

    if (currentUser.emailConfirmation.isConfirmed) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'email',
        message: 'user already confirmed',
      };
    }
    const newConfirmationCode = uuidv4();

    try {
      await this.userRepository.updateConfirmationCode(
        currentUser._id,
        newConfirmationCode,
      );
    } catch (e) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'code',
        message: 'user some error on resending email' + e.message,
      };
    }
    const updatedUserInfo = await this.userRepository.findUserByEmail(
      command.email,
    );
    if (!updatedUserInfo) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        field: 'code',
        message: 'user some error on resending email',
      };
    }
    return {
      data: updatedUserInfo.emailConfirmation.confirmationCode,
      resultCode: ResultCode.NoContent,
    };
  }
}
