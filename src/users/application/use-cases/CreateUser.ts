import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { CreateUserDto, NewUsersDBType } from '../../user.types';
import { v4 as uuidv4 } from 'uuid';
import add from 'date-fns/add';
import { UserRepository } from '../../user.repository';
import { Helpers } from '../../../helpers/helpers';
import bcrypt from 'bcrypt';
import { UsersService } from '../../users.service';
import { Types } from 'mongoose';

export class CreateUserCommand {
  constructor(public userPostInputData: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUser implements ICommandHandler<CreateUserCommand> {
  constructor(
    public userRepository: UserRepository,
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

    const newUser: NewUsersDBType = {
      _id: new Types.ObjectId(),
      accountData: {
        login: command.userPostInputData.login,
        email: command.userPostInputData.email,
        passwordHash,
        passwordSalt,
        createdAt: new Date(),
      },
      emailConfirmation: {
        confirmationCode: uuidv4(),
        emailExpiration: add(new Date(), { hours: 2, minutes: 3 }),
        isConfirmed: true,
      },
    };
    const createUserId = await this.userRepository.createUser(newUser);
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
