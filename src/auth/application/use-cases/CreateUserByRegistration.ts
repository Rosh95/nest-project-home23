import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { ObjectId } from 'mongodb';
import { CreateUserDto, NewUsersDBType } from '../../../users/user.types';
import { v4 as uuidv4 } from 'uuid';
import add from 'date-fns/add';
import { UserRepository } from '../../../users/user.repository';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import bcrypt from 'bcrypt';
import { AuthService } from '../../auth.service';
import { EmailService } from '../../../email/email.service';

export class CreateUserByRegistrationCommand {
  constructor(public userPostInputData: CreateUserDto) {}
}

@CommandHandler(CreateUserByRegistrationCommand)
export class CreateUserByRegistration
  implements ICommandHandler<CreateUserByRegistrationCommand>
{
  constructor(
    public userRepository: UserRepository,
    public usersQueryRepository: UsersQueryRepository,
    public authService: AuthService,
    public emailService: EmailService,
  ) {}

  async execute(
    command: CreateUserByRegistrationCommand,
  ): Promise<ResultObject<string>> {
    // const isExistEmail = await this.userRepository.findLoginOrEmail(
    //   command.userPostInputData.email,
    // );
    // const isExistLogin = await this.userRepository.findLoginOrEmail(
    //   command.userPostInputData.login,
    // );
    // if (isExistEmail) {
    //   return {
    //     data: null,
    //     resultCode: ResultCode.BadRequest,
    //     field: 'email',
    //     message: 'email is exist',
    //   };
    // }
    // if (isExistLogin) {
    //   return {
    //     data: null,
    //     resultCode: ResultCode.BadRequest,
    //     field: 'login',
    //     message: 'login is exist',
    //   };
    // }

    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this.authService._generateHash(
      command.userPostInputData.password,
      passwordSalt,
    );

    const newUser: NewUsersDBType = {
      _id: new ObjectId(),
      accountData: {
        login: command.userPostInputData.login,
        email: command.userPostInputData.email,
        passwordHash,
        passwordSalt,
        createdAt: new Date(),
      },
      emailConfirmation: {
        confirmationCode: uuidv4(),
        emailExpiration: add(new Date(), {
          hours: 1,
          minutes: 3,
        }),
        isConfirmed: false,
      },
    };
    const createdUserId = await this.userRepository.createUser(newUser);
    if (!createdUserId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create user',
      };
    }
    const createdUser =
      await this.usersQueryRepository.findUserById(createdUserId);
    const createdUserFullInformation = this.authService.usersMapping(newUser);
    try {
      await this.emailService.sendConfirmationEmail(
        createdUserFullInformation.emailConfirmation.confirmationCode,
        createdUser!.email,
      );
    } catch (e) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t send email' + e.message,
      };
    }
    return {
      data: createdUserId,
      resultCode: ResultCode.NoContent,
    };
  }
}
