import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import {
  CreateUserDto,
  emailConfirmationType,
} from '../../../users/user.types';
import { v4 as uuidv4 } from 'uuid';
import add from 'date-fns/add';
import bcrypt from 'bcrypt';
import { AuthService } from '../../auth.service';
import { EmailService } from '../../../email/email.service';
import { UserSqlRepository } from '../../../users/user.repository.sql';
import { UsersQuerySqlRepository } from '../../../users/usersQuery.repository.sql';

export class CreateUserByRegistrationCommand {
  constructor(public userPostInputData: CreateUserDto) {}
}

@CommandHandler(CreateUserByRegistrationCommand)
export class CreateUserByRegistration
  implements ICommandHandler<CreateUserByRegistrationCommand>
{
  constructor(
    public userRepository: UserSqlRepository,
    public usersQueryRepository: UsersQuerySqlRepository,
    public authService: AuthService,
    public emailService: EmailService,
  ) {}

  async execute(
    command: CreateUserByRegistrationCommand,
  ): Promise<ResultObject<string>> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this.authService._generateHash(
      command.userPostInputData.password,
      passwordSalt,
    );

    const newUserToSql = {
      login: command.userPostInputData.login,
      email: command.userPostInputData.email,
      passwordHash,
      passwordSalt,
    };

    const createdUserId = await this.userRepository.createUser(newUserToSql);
    if (!createdUserId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create user',
      };
    }
    const emailConfirmationInfo: emailConfirmationType = {
      userId: createdUserId,
      confirmationCode: uuidv4(),
      emailExpiration: add(new Date(), {
        hours: 1,
        minutes: 3,
      }).toISOString(),
      isConfirmed: false,
    };

    const createdEmailConfirmation =
      await this.userRepository.sendEmailConfirmation(emailConfirmationInfo);
    if (!createdEmailConfirmation) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create email confirmation',
      };
    }

    const createdUser =
      await this.usersQueryRepository.findUserById(createdUserId);
    // const createdUserFullInformation = this.authService.usersMapping(newUser);
    try {
      await this.emailService.sendConfirmationEmail(
        createdEmailConfirmation.confirmationCode,
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
