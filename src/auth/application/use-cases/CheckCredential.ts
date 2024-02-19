import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '../../auth.service';
import { UserSqlRepository } from '../../../users/user.repository.sql';
import { UsersQuerySqlRepository } from '../../../users/usersQuery.repository.sql';

export class CheckCredentialCommand {
  constructor(
    public loginOrEmail: string,
    public password: string,
  ) {}
}

@CommandHandler(CheckCredentialCommand)
export class CheckCredential
  implements ICommandHandler<CheckCredentialCommand>
{
  constructor(
    public userRepository: UserSqlRepository,
    public authService: AuthService,
    public usersQueryRepository: UsersQuerySqlRepository,
  ) {}

  async execute(command: CheckCredentialCommand) {
    const user = await this.userRepository.findUserByLoginOrEmail(
      command.loginOrEmail,
    );
    if (!user) return false;
    const passwordHash = await this.authService._generateHash(
      command.password,
      user.passwordSalt,
    );
    if (user.passwordHash === passwordHash) {
      return user.id;
    } else return false;
  }
}
