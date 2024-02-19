import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { CreateUserDto } from '../../user.types';
import { Helpers } from '../../../helpers/helpers';
import bcrypt from 'bcrypt';
import { UsersService } from '../../users.service';
import { UserSqlRepository } from '../../user.repository.sql';

export class CreateUserCommand {
  constructor(public userPostInputData: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUser implements ICommandHandler<CreateUserCommand> {
  constructor(
    public userRepository: UserSqlRepository,
    public helpers: Helpers,
    public usersService: UsersService,
  ) {}

  async execute(command: CreateUserCommand): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(
      command.userPostInputData,
      CreateUserDto,
    );
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this.usersService._generateHash(
      command.userPostInputData.password,
      passwordSalt,
    );
    const newUserToSql = {
      login: command.userPostInputData.login,
      email: command.userPostInputData.email,
      passwordHash,
      passwordSalt,
    };
    const createUserId = await this.userRepository.createUser(newUserToSql);
    if (!createUserId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create user',
      };
    }
    return {
      data: createUserId,
      resultCode: ResultCode.NoContent,
    };
  }
}
