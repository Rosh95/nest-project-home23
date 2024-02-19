import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getUserViewModel } from '../../user.types';
import { UserSqlRepository } from '../../user.repository.sql';

export class FindUserByIdCommand {
  constructor(public userId: string) {}
}

@CommandHandler(FindUserByIdCommand)
export class FindUserById implements ICommandHandler<FindUserByIdCommand> {
  constructor(public userRepository: UserSqlRepository) {}

  async execute(
    command: FindUserByIdCommand,
  ): Promise<getUserViewModel | null> {
    return await this.userRepository.findUserById(command.userId);
  }
}
