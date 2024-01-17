import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { UserRepository } from '../../user.repository';
import { Helpers } from '../../../helpers/helpers';
import { Types } from 'mongoose';

export class DeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUser implements ICommandHandler<DeleteUserCommand> {
  constructor(
    public userRepository: UserRepository,
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
    const idInMongo = new Types.ObjectId(command.userId);
    const deleteUser = await this.userRepository.deleteUser(idInMongo);
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
