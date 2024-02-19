import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { UserSqlRepository } from '../../user.repository.sql';

export class DeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUser implements ICommandHandler<DeleteUserCommand> {
  constructor(
    public userRepository: UserSqlRepository,
    public helpers: Helpers,
  ) {}

  async execute(command: DeleteUserCommand): Promise<ResultObject<string>> {
    const isExistUser = await this.userRepository.findUserById(command.userId);
    if (!isExistUser) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find user',
      };
    }
    const deleteUser = await this.userRepository.deleteUser(command.userId);
    if (!deleteUser) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t delete user',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
